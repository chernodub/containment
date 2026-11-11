import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { WebGLLights } from 'three/src/renderers/webgl/WebGLLights.js';
import { optimizeLocalLights } from '../src/render/lighting/LocalLightShading';
import { SceneLighting } from '../src/render/SceneLighting';

function fixture() {
  const material = new T.MeshPhysicalMaterial();
  const previous = vi.fn(); material.onBeforeCompile = previous;
  material.customProgramCacheKey = () => 'authored-physical';
  optimizeLocalLights(material);
  const shader = { uniforms:{}, fragmentShader: '#include <lights_fragment_begin>\n#include <lights_fragment_maps>' };
  material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms, {} as T.WebGLRenderer);
  return { material, shader: shader.fragmentShader, previous };
}

describe('shared key occlusion for fixed practicals', () => {
  it('retains fixture packing through Three’s actual light sort and point-uniform collection', () => {
    const lighting = new SceneLighting();
    lighting.setQuality('high', true, false);
    const scene = new T.Scene(); scene.add(lighting.root);
    const muzzle = new T.PointLight(); scene.add(muzzle);
    const lights: T.Light[] = [];
    scene.traverseVisible(object => { if (object instanceof T.Light) lights.push(object); });
    // Distinct energies make the final packed uniforms identify their source.
    lights.forEach((light, i) => { light.color.setRGB(1, 1, 1); light.intensity = i + 1; });
    const expected = lighting.fixtures.map(light => light.intensity);
    const packed = new WebGLLights({ has: () => false } as never);
    packed.setup(lights);
    const points = packed.state.point as { color: T.Color }[];
    expect(points.slice(0, 4).map(point => point.color.r)).toEqual(expected);
    expect(lights.filter(light => light instanceof T.PointLight).slice(0, 4)).toEqual(lighting.fixtures);
    expect(lighting.fixtures.every(light => !light.castShadow)).toBe(true);
    expect(lighting.pool.lights.every(light => !light.castShadow)).toBe(true);
    lighting.dispose();
  });

  it('samples directional shadow zero once, guarded by shadow support and receiveShadow', () => {
    const { material, shader, previous } = fixture();
    expect(previous).toHaveBeenCalledOnce();
    expect(shader).toContain('#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0 && defined( RE_Direct )');
    const start = shader.indexOf('float roomKeyOcclusion =');
    const pointLoop = shader.indexOf('for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ )');
    const shared = shader.slice(start, pointLoop);
    expect(shared).toContain('if ( receiveShadow )');
    expect(shared.match(/getShadow\( directionalShadowMap\[ 0 \]/g)).toHaveLength(1);
    expect(shared).toContain('roomKeyShadow.shadowMapSize');
    expect(shared).toContain('roomKeyShadow.shadowIntensity');
    expect(shared).toContain('roomKeyShadow.shadowBias');
    expect(shared).toContain('roomKeyShadow.shadowRadius');
    expect(shared).toContain('vDirectionalShadowCoord[ 0 ]');
    expect(material.customProgramCacheKey()).toBe('authored-physical:local-light-rejection-v4');
    material.dispose();
  });

  it('attenuates only the first four point slots and reuses visibility in directional slot zero', () => {
    const { material, shader } = fixture();
    const point = shader.slice(shader.indexOf('getPointLightInfo'), shader.indexOf('#if ( NUM_SPOT_LIGHTS'));
    expect(point).not.toContain('float roomPracticalDistance');expect(point).toContain('dot( pointLight.position - geometryPosition, pointLight.position - geometryPosition ) / roomPracticalNearField');
    expect(point).toContain('#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0 && UNROLLED_LOOP_INDEX < 4');
    expect(point.match(/mix\( roomPracticalShadowFill, 1\.0, roomKeyOcclusion \)/g)).toHaveLength(1);
    const directional = shader.slice(shader.indexOf('getDirectionalLightInfo'), shader.indexOf('#if ( NUM_RECT_AREA_LIGHTS'));
    expect(directional).toContain('#if UNROLLED_LOOP_INDEX == 0');
    expect(directional).toContain('? roomKeyOcclusion : 1.0');
    expect(directional).toContain('#else');
    expect(directional).toContain('getShadow( directionalShadowMap[ i ]');
    const spot = shader.slice(shader.indexOf('getSpotLightInfo'), shader.indexOf('#if ( NUM_DIR_LIGHTS'));
    expect(spot).not.toContain('roomKeyOcclusion');
    expect(spot).toContain('getShadow( spotShadowMap[ i ]');
    expect(shader.match(/if \( directLight.visible \)/g)).toHaveLength(3);
    material.dispose();
  });

  it('keeps dynamic/Low/reactor responses unchanged and practical attenuation finite and bounded', () => {
    const { material, shader } = fixture();
    const guard = shader.match(/if \( !\( roomKeyOcclusion >= 0\.0 && roomKeyOcclusion <= 1\.0 \) \) roomKeyOcclusion = 1\.0;/)![0];
    const sanitize = new Function('roomKeyOcclusion', `${guard};return roomKeyOcclusion;`) as (value: number) => number;
    const attenuation = (slot: number, shadows: boolean, directionalShadows: number, receiveShadow: boolean, visibility: number) => {
      const occlusion = receiveShadow ? sanitize(visibility) : 1;
      return shadows && directionalShadows > 0 && slot < 4 ? 0.025 + (1 - 0.025) * occlusion : 1;
    };
    for (const visibility of [NaN, Infinity, -Infinity, -0.01, 0, 0.25, 1, 1.01]) {
      const value = attenuation(0, true, 1, true, visibility);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0.025); expect(value).toBeLessThanOrEqual(1);
      expect(attenuation(4, true, 1, true, visibility)).toBe(1);
      expect(attenuation(12, true, 1, true, visibility)).toBe(1);
      expect(attenuation(0, false, 1, true, visibility)).toBe(1);
      expect(attenuation(0, true, 0, true, visibility)).toBe(1);
      expect(attenuation(0, true, 1, false, visibility)).toBe(1);
    }
    expect(attenuation(3, true, 1, true, 0)).toBe(0.025);
    material.dispose();
  });
});

it('adjusts rough probe fill through retained uniforms while preserving sharp reflected emissives',()=>{
 const material=new T.MeshStandardMaterial();optimizeLocalLights(material,.16);const key=material.customProgramCacheKey();
 const shader={uniforms:{} as Record<string,{value:number}>,fragmentShader:'#include <lights_fragment_maps>'};
 material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 expect(shader.uniforms.roomDiffuseEnvironmentGain.value).toBe(.16);
 expect(shader.fragmentShader).toContain('iblIrradiance += roomDiffuseEnvironmentGain * getIBLIrradiance');
 expect(shader.fragmentShader).toContain('smoothstep(.15,.5,material.roughness)');
 optimizeLocalLights(material,1);expect(shader.uniforms.roomDiffuseEnvironmentGain.value).toBe(1);
 expect(material.customProgramCacheKey()).toBe(key);material.dispose();
});

it('keeps machine near-field irradiance bounded while preserving deck pools and uniform shadow tuning',()=>{
 for(const [name,radius] of [['environment-floor',3.24],['g2-dressing-steel',9]] as const){
  const material=new T.MeshStandardMaterial({name});optimizeLocalLights(material,.02,.16);
  const shader={uniforms:{} as Record<string,{value:unknown}>,fragmentShader:'#include <lights_fragment_begin>\n#include <lights_fragment_maps>'};
  material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
  expect(shader.uniforms.roomPracticalNearField.value).toBe(radius);expect(shader.uniforms.roomPracticalShadowFill.value).toBe(.16);
  optimizeLocalLights(material,.02,.025);expect(shader.uniforms.roomPracticalShadowFill.value).toBe(.025);material.dispose();
 }
});
