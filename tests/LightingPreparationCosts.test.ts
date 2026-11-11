import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { WebGLLights } from 'three/src/renderers/webgl/WebGLLights.js';
import { LightPool } from '../src/render/lighting/LightPool';
import { optimizeLocalLights } from '../src/render/lighting/LocalLightShading';
import { PracticalPools } from '../src/render/lighting/PracticalPools';
import { RoomReflectionCapture } from '../src/render/lighting/RoomReflectionCapture';

describe('bounded lighting preparation costs', () => {
  it('keeps Three’s actual light topology unchanged from idle through peak combat and expiry', () => {
    const pool = new LightPool();
    const packed = new WebGLLights({ has: () => false } as never);
    const collect = () => {
      const lights: T.Light[] = [];
      pool.root.traverseVisible(object => { if (object instanceof T.Light) lights.push(object); });
      packed.setup(lights);
      return packed.state.version;
    };
    const version = collect();
    for (let i = 0; i < 9; i++) {
      pool.flash({ x: i, z: 0, color: 0xffaa44, duration: .1 });
      expect(collect()).toBe(version);
      expect(packed.state.point).toHaveLength(9);
    }
    pool.update(.2);
    expect(collect()).toBe(version);
    pool.setIntensityScale(0);
    expect(collect()).toBe(version);
    pool.setQuality('low');
    collect();
    expect(packed.state.point).toHaveLength(2);
    pool.setQuality('low', false);
    collect();
    expect(packed.state.point).toHaveLength(0);
    pool.dispose();
  });

  it('rejects idle fixed slots before distance attenuation while retaining positive-light shading', () => {
    const material = new T.MeshStandardMaterial();
    optimizeLocalLights(material);
    const shader = { uniforms: {}, fragmentShader: '#include <lights_fragment_begin>' };
    material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms, {} as T.WebGLRenderer);
    const source = shader.fragmentShader;
    const branch = source.indexOf('if ( pointLight.color == vec3( 0.0 ) )');
    const attenuation = source.indexOf('getPointLightInfo( pointLight, geometryPosition, directLight );');
    expect(branch).toBeGreaterThan(0);
    expect(attenuation).toBeGreaterThan(branch);
    expect(source.slice(branch, attenuation)).toContain('directLight.visible = false;');
    expect(source.slice(branch, attenuation)).toContain('} else {');
    expect(source).toContain('if ( directLight.visible ) { RE_Direct(');
    material.dispose();
  });

  it('uploads practical transforms and colors only when the rendered values change', () => {
    const pools = new PracticalPools(new T.Scene());
    const fixtures = Array.from({ length: 4 }, (_, i) => {
      const light = new T.PointLight(0xffbb88, 18, 6);
      light.position.set(i * 3, 2, i);
      return light;
    });
    pools.update(fixtures, true);
    const matrices = pools.root.instanceMatrix;
    const colors = pools.root.instanceColor!;
    const shape = pools.root.geometry.getAttribute('reactorPoolAmount') as T.InstancedBufferAttribute;
    const matrixVersion = matrices.version;
    const colorVersion = colors.version;
    const shapeVersion = shape.version;
    for (let i = 0; i < 20; i++) pools.update(fixtures, true);
    expect(matrices.version).toBe(matrixVersion);
    expect(colors.version).toBe(colorVersion);
    expect(shape.version).toBe(shapeVersion);

    fixtures[1].intensity += 1;
    pools.update(fixtures, true);
    expect(matrices.version).toBe(matrixVersion);
    expect(colors.version).toBe(colorVersion + 1);
    fixtures[1].position.x += .125;
    pools.update(fixtures, true);
    expect(matrices.version).toBe(matrixVersion + 1);
    expect(colors.version).toBe(colorVersion + 1);

    pools.update(fixtures, false);
    expect(pools.root.count).toBe(2);
    pools.update(fixtures, true);
    expect(pools.root.count).toBe(4);
    expect(matrices.version).toBe(matrixVersion + 1);
    expect(colors.version).toBe(colorVersion + 1);
    expect(shape.version).toBe(shapeVersion);
    const dispose = vi.spyOn(pools.root, 'dispose');
    pools.dispose();
    pools.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('retains one reflection filter between rooms and retires it on context reset or disposal', () => {
    const scene = new T.Scene();
    const gpu = { shadowMap: { enabled: true } } as T.WebGLRenderer;
    const generators: T.PMREMGenerator[] = [];
    const targets: T.WebGLRenderTarget[] = [];
    const update = vi.spyOn(T.CubeCamera.prototype, 'update').mockImplementation(() => {});
    const fromCubemap = vi.spyOn(T.PMREMGenerator.prototype, 'fromCubemap').mockImplementation(function () {
      generators.push(this);
      const target = new T.WebGLRenderTarget(64, 64);
      targets.push(target);
      return target;
    });
    const dispose = vi.spyOn(T.PMREMGenerator.prototype, 'dispose');
    try {
      const reflections = new RoomReflectionCapture(gpu, scene);
      reflections.capture(1, 2, 3);
      expect(reflections.capture(1, 2, 3)).toBe(false);
      reflections.invalidate();
      expect(dispose).not.toHaveBeenCalled();
      reflections.capture(4, 2, 6);
      expect(generators[1]).toBe(generators[0]);
      reflections.invalidate(true);
      expect(dispose).toHaveBeenCalledOnce();
      reflections.capture(4, 2, 6);
      expect(generators[2]).not.toBe(generators[0]);
      reflections.dispose();
      reflections.dispose();
      expect(dispose).toHaveBeenCalledTimes(2);
      expect(scene.environment).toBeNull();
    } finally {
      update.mockRestore();
      fromCubemap.mockRestore();
      dispose.mockRestore();
      targets.forEach(target => target.dispose());
    }
  });
});
