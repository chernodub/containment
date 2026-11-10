import { describe, expect, it, vi } from 'vitest';
import {
  ACESFilmicToneMapping, Camera, HalfFloatType, NoToneMapping, OrthographicCamera,
  PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { GRAPHICS_PRESETS } from '../src/render/graphicsOptions';
import { DISTORTION_CAPACITY, DistortionField } from '../src/render/post/DistortionField';
import { PostPipeline } from '../src/render/post/PostPipeline';
import { DEFAULT_POST_MOOD } from '../src/render/post/types';

type Resources = {
  scene: WebGLRenderTarget; ao: WebGLRenderTarget;
  bloomA: WebGLRenderTarget; bloomB: WebGLRenderTarget; distortion: WebGLRenderTarget;
  composite: ShaderMaterial; occlusion: ShaderMaterial;
  extract: ShaderMaterial; blur: ShaderMaterial; distort: ShaderMaterial;
  geometry: { dispose(): void };
};

function resources(pipeline: PostPipeline): Resources | undefined {
  return (pipeline as unknown as { resources?: Resources }).resources;
}

function fixture() {
  let target: WebGLRenderTarget | null = null;
  const frames: { scene: object; target: WebGLRenderTarget | null; mapping: number; camera: Camera }[] = [];
  const gpu = {
    capabilities: { maxSamples: 4 }, toneMapping: ACESFilmicToneMapping,
    toneMappingExposure: 1.3, autoClear: false,
    getRenderTarget: vi.fn(() => target),
    setRenderTarget: vi.fn((next: WebGLRenderTarget | null) => { target = next; }),
    compileAsync: vi.fn(async () => {}),
    render: vi.fn((scene: object, camera: Camera) => { frames.push({ scene, camera, target, mapping: gpu.toneMapping }); }),
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-12, 12, 8, -8, 0.1, 200);
  camera.position.set(0, 30, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const pipeline = new PostPipeline(gpu as unknown as WebGLRenderer, scene, camera);
  return { gpu, scene, camera, pipeline, frames };
}

describe('HDR post lifecycle without a WebGL context', () => {
  it('keeps Low to a single forward render with no post resources, even after prepare', async () => {
    const { pipeline, gpu, scene, frames } = fixture();
    pipeline.setSize(1920, 1080, 2);
    pipeline.setOptions({ ...GRAPHICS_PRESETS.high }, 'low');
    pipeline.distortion.shockwave(0, 0);
    await pipeline.prepare();
    pipeline.render(1 / 60);
    expect(resources(pipeline)).toBeUndefined();
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ scene, target: null, mapping: ACESFilmicToneMapping });
    expect(pipeline.distortion.activeCount).toBe(0);
    expect(gpu.compileAsync).toHaveBeenCalledTimes(1);
    expect(gpu.autoClear).toBe(false);
    pipeline.dispose();
  });

  it('allocates half-float MSAA+depth lazily and applies DPR/render scale once', () => {
    const { pipeline, frames } = fixture();
    pipeline.setOptions({ ...GRAPHICS_PRESETS.high, resolutionScale: 0.75 }, 'high');
    pipeline.setSize(800, 600, 2);
    expect(resources(pipeline)).toBeUndefined();
    pipeline.render(1 / 60);
    const r = resources(pipeline)!;
    expect(r.scene.texture.type).toBe(HalfFloatType);
    expect(r.scene.samples).toBe(4);
    expect(r.scene.depthTexture).toBeTruthy();
    expect([r.scene.width, r.scene.height]).toEqual([1200, 900]);
    expect([r.ao.width, r.ao.height]).toEqual([600, 450]);
    expect([r.bloomA.width, r.bloomA.height]).toEqual([300, 225]);
    expect([r.distortion.width, r.distortion.height]).toEqual([300, 225]);
    expect(frames).toHaveLength(6); // scene + AO + extract + blur X/Y + composite
    expect(frames.every(frame => frame.mapping === NoToneMapping)).toBe(true);
    pipeline.setSize(400, 300, 1);
    expect([r.scene.width, r.scene.height]).toEqual([300, 225]);
    pipeline.dispose();
  });

  it('skips disabled optional passes and keeps grading active', () => {
    const { pipeline, frames } = fixture();
    pipeline.setOptions({ ...GRAPHICS_PRESETS.low }, 'high');
    pipeline.setMood({ ...DEFAULT_POST_MOOD, grade: { ...DEFAULT_POST_MOOD.grade, exposure: 0.91 } });
    pipeline.render(0.016);
    expect(frames).toHaveLength(2);
    const uniforms = resources(pipeline)!.composite.uniforms;
    expect(uniforms.toneMappingExposure.value).toBe(0.91);
    for (const option of ['aoEnabled', 'bloomEnabled', 'distortionEnabled', 'lensEnabled', 'atmosphereEnabled']) {
      expect(uniforms[option].value).toBe(0);
    }
    pipeline.dispose();
  });

  it('disposes every owned target/material exactly once and recreates High after Low', () => {
    const { pipeline } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    pipeline.render(0);
    const r = resources(pipeline)!;
    const owned = [r.scene, r.ao, r.bloomA, r.bloomB, r.distortion,
      r.occlusion, r.extract, r.blur, r.distort, r.composite, r.geometry];
    const disposals = owned.map(value => vi.spyOn(value, 'dispose'));
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low');
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low');
    expect(resources(pipeline)).toBeUndefined();
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledTimes(1);
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    expect(resources(pipeline)).toBeUndefined();
    pipeline.render(0);
    expect(resources(pipeline)!.scene).not.toBe(r.scene);
    const lastDispose = vi.spyOn(resources(pipeline)!.scene, 'dispose');
    pipeline.dispose(); pipeline.dispose(); pipeline.render(0);
    expect(lastDispose).toHaveBeenCalledTimes(1);
    expect(resources(pipeline)).toBeUndefined();
  });

  it('prewarms every shader and the zero-live-effects distortion path offscreen', async () => {
    const { pipeline, gpu, frames } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    await pipeline.prepare();
    expect(gpu.compileAsync).toHaveBeenCalledTimes(6);
    expect(frames).toHaveLength(7);
    expect(frames.every(frame => frame.target !== null)).toBe(true);
    const warmTarget = frames.at(-1)!.target!;
    expect([warmTarget.width, warmTarget.height]).toEqual([1, 1]);
    expect(gpu.getRenderTarget()).toBeNull();
    expect(gpu.toneMapping).toBe(ACESFilmicToneMapping);
    expect(gpu.toneMappingExposure).toBe(1.3);
    expect(gpu.autoClear).toBe(false);
    expect(pipeline.distortion.activeCount).toBe(0);
    pipeline.dispose();
  });

  it('does not allocate High targets when Low is selected while preparation waits', async () => {
    const { pipeline, gpu } = fixture();
    let done!: () => void;
    gpu.compileAsync.mockImplementationOnce(() => new Promise<void>(resolve => { done = resolve; }));
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    const prepared = pipeline.prepare();
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low');
    done();
    await prepared;
    expect(resources(pipeline)).toBeUndefined();
    expect(gpu.render).not.toHaveBeenCalled();
    pipeline.dispose();
  });

  it('refreshes projection uniforms when changing cameras without reallocating targets', () => {
    const { pipeline } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    pipeline.render(0);
    const r = resources(pipeline)!;
    const camera = new PerspectiveCamera(28, 16 / 9, 0.1, 180);
    camera.position.set(0, 30, 20); camera.lookAt(0, 0, 0);
    pipeline.setCamera(camera); pipeline.render(0);
    expect(resources(pipeline)).toBe(r);
    expect(r.composite.uniforms.projectionInverse.value.equals(camera.projectionMatrixInverse)).toBe(true);
    expect(r.composite.uniforms.cameraWorld.value.equals(camera.matrixWorld)).toBe(true);
    pipeline.dispose();
  });

  it('restores renderer state if an offscreen pass throws', () => {
    const { pipeline, gpu } = fixture();
    const externalTarget = new WebGLRenderTarget();
    gpu.setRenderTarget(externalTarget);
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    gpu.render.mockImplementationOnce(() => { throw new Error('context lost'); });
    expect(() => pipeline.render(0)).toThrow('context lost');
    expect(gpu.getRenderTarget()).toBe(externalTarget);
    expect(gpu.toneMapping).toBe(ACESFilmicToneMapping);
    expect(gpu.autoClear).toBe(false);
    pipeline.dispose(); externalTarget.dispose();
  });
});

describe('pooled shockwave and heat distortion', () => {
  it('has a fixed capacity, reuses uniform objects, expires and rejects invalid input', () => {
    const { camera } = fixture();
    const field = new DistortionField();
    const uniforms = field.waves.slice();
    field.shockwave(NaN, 0); field.heat(0, 0, -1);
    expect(field.activeCount).toBe(0);
    for (let i = 0; i < DISTORTION_CAPACITY + 8; i++) field.shockwave(i, 0, 3, 0.01, 0.2);
    expect(field.activeCount).toBe(DISTORTION_CAPACITY);
    field.update(0.1, camera);
    expect(field.waves.every((wave, i) => wave === uniforms[i])).toBe(true);
    expect(field.waves.some(wave => wave.z > 0)).toBe(true);
    field.update(0.1, camera);
    expect(field.activeCount).toBe(0);
    expect(field.waves.every(wave => wave.z === 0)).toBe(true);
    field.heat(0, 0); field.setEnabled(false); field.shockwave(0, 0);
    expect(field.activeCount).toBe(0);
    field.dispose();
  });
});
