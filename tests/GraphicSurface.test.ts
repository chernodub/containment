import { afterEach, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import {
  DEFAULT_GRAPHIC_SURFACE_TUNING, patchGraphicSurface,
  setGraphicShadingEnabled, setGraphicSurfaceTuning,
} from '../src/render/lighting/GraphicSurface';
import { optimizeLocalLights } from '../src/render/lighting/LocalLightShading';
import { applyFloorVariation } from '../src/render/lighting/FloorVariation';
import { actorSurface } from '../src/render/vfx/ActorSurface';

function compile(material: T.MeshStandardMaterial) {
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: T.ShaderLib.standard.vertexShader,
    fragmentShader: T.ShaderLib.standard.fragmentShader,
  };
  material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms, {} as T.WebGLRenderer);
  return shader;
}

afterEach(() => {
  setGraphicShadingEnabled(true);
  setGraphicSurfaceTuning(DEFAULT_GRAPHIC_SURFACE_TUNING);
});

describe('graphic material response', () => {
  it('chains authored hooks once and retains one program family across live tuning', () => {
    const material = new T.MeshStandardMaterial();
    const previous = vi.fn(); material.onBeforeCompile = previous;
    material.customProgramCacheKey = () => 'authored';
    patchGraphicSurface(material);
    const version = material.version, key = material.customProgramCacheKey();
    patchGraphicSurface(material);
    const shader = compile(material);
    expect(previous).toHaveBeenCalledOnce();
    expect(shader.fragmentShader.match(/float graphicDiffuseRamp\(/g)).toHaveLength(1);
    expect(key).toBe('authored:graphic-surface-v1');
    setGraphicShadingEnabled(false);
    expect(shader.uniforms.graphicEnabled.value).toBe(0);
    setGraphicSurfaceTuning({ rampStrength: .4, actorMipBias: 2, specularGain: .6 });
    expect((shader.uniforms.graphicResponse.value as T.Vector4).toArray()).toEqual([.4, .6, 2, .45]);
    expect(material.version).toBe(version);
    expect(material.customProgramCacheKey()).toBe(key);
    material.dispose();
  });

  it('reduces actor map/normal detail while keeping the dissolve and HDR light hooks', () => {
    const material = new T.MeshStandardMaterial();
    actorSurface([material]); patchGraphicSurface(material);
    const shader = compile(material);
    expect((shader.uniforms.graphicSurfaceKind.value as T.Vector2).toArray()).toEqual([1, 0]);
    expect(shader.fragmentShader).toContain('if(ash<actorDissolve)discard;');
    expect(shader.fragmentShader).toContain('texture2D( map, vMapUv, graphicEnabled * graphicSurfaceKind.x * graphicResponse.z )');
    expect(shader.fragmentShader).toContain('mapN.xy *= normalScale * mix(1.0, graphicNormal, graphicEnabled)');
    expect(shader.fragmentShader).toContain('graphicDiffuseRamp(dotNL) * directLight.color');
    expect(shader.fragmentShader).toContain('roomKeyOcclusion');
    expect(shader.fragmentShader).toContain('BRDF_GGX_Multiscatter');
    material.dispose();
  });

  it('keeps floor macro authoring and wet reflection while attenuating micro normals', () => {
    const material = new T.MeshStandardMaterial({ name: 'environment-floor' });
    material.userData.actorMaterial = true;
    applyFloorVariation(material, 'maintenance'); optimizeLocalLights(material); patchGraphicSurface(material);
    const shader = compile(material);
    expect((shader.uniforms.graphicSurfaceKind.value as T.Vector2).toArray()).toEqual([0, 1]);
    expect(shader.fragmentShader).toContain('roomFloorLeaks');
    expect(shader.fragmentShader).toContain('graphicNormalGain.y');
    expect(shader.fragmentShader).toContain('mix(.38, .28, graphicSurfaceKind.y)');
    expect(shader.fragmentShader).toContain('iblIrradiance += roomDiffuseEnvironmentGain');
    material.dispose();
  });

  it('shares tuning with copied preparation hooks and ignores invalid values', () => {
    const material = new T.MeshStandardMaterial(); patchGraphicSurface(material);
    const proxy = material.clone(); proxy.onBeforeCompile = material.onBeforeCompile;
    proxy.customProgramCacheKey = material.customProgramCacheKey;
    patchGraphicSurface(proxy);
    const a = compile(material), b = compile(proxy);
    expect(b.fragmentShader.match(/float graphicDiffuseRamp\(/g)).toHaveLength(1);
    expect(a.uniforms.graphicResponse).toBe(b.uniforms.graphicResponse);
    setGraphicSurfaceTuning({ actorMipBias: Infinity, actorDetail: NaN, floorNormalGain: -1, actorNormalGain: 10 });
    expect((a.uniforms.graphicResponse.value as T.Vector4).toArray()).toEqual([.72, .76, 1.65, .45]);
    expect((a.uniforms.graphicNormalGain.value as T.Vector2).toArray()).toEqual([1, 0]);
    material.dispose(); proxy.dispose();
  });

  it('skips minor point-light specular work while retaining practical, spot and directional BRDFs', () => {
    const material = new T.MeshStandardMaterial();
    optimizeLocalLights(material); patchGraphicSurface(material);
    const shader = compile(material), source = shader.fragmentShader;
    const pointStart = source.indexOf('for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ )');
    const spotStart = source.indexOf('#if ( NUM_SPOT_LIGHTS');
    const directionalStart = source.indexOf('#if ( NUM_DIR_LIGHTS');
    const rectStart = source.indexOf('#if ( NUM_RECT_AREA_LIGHTS');
    const points = source.slice(pointStart, spotStart);
    const spots = source.slice(spotStart, directionalStart);
    const directional = source.slice(directionalStart, rectStart);
    expect(points).toContain('#if UNROLLED_LOOP_INDEX >= 4');
    expect(points).toContain('if (graphicEnabled > .5)');
    expect(points).toContain('graphicMinorDiffuse * directLight.color * BRDF_Lambert(material.diffuseContribution)');
    expect(points).toContain('RE_Direct( directLight');
    expect(spots).not.toContain('graphicMinor');
    expect(directional).not.toContain('graphicMinor');
    expect(spots).toContain('if ( directLight.visible ) { RE_Direct(');
    expect(directional).toContain('if ( directLight.visible ) { RE_Direct(');
    expect(source.match(/float graphicMinorDot/g)).toHaveLength(1);
    const key = material.customProgramCacheKey(), version = material.version;
    setGraphicShadingEnabled(false);
    expect(shader.uniforms.graphicEnabled.value).toBe(0);
    setGraphicShadingEnabled(true);
    expect(shader.uniforms.graphicEnabled.value).toBe(1);
    expect(material.version).toBe(version);
    expect(material.customProgramCacheKey()).toBe(key);
    material.dispose();
  });

  it('does not patch transparent effects or add GPU resources', () => {
    const material = new T.MeshStandardMaterial({ transparent: true });
    const hook = material.onBeforeCompile, key = material.customProgramCacheKey();
    patchGraphicSurface(material);
    expect(material.onBeforeCompile).toBe(hook);
    expect(material.customProgramCacheKey()).toBe(key);
    material.dispose();
  });
});
