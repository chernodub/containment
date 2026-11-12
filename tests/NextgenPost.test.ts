import { describe, expect, it, vi } from 'vitest';
import {
  ACESFilmicToneMapping, AgXToneMapping, Camera, Color, DataUtils, HalfFloatType, NearestFilter, NoToneMapping, OrthographicCamera,
  PerspectiveCamera, Scene, ShaderMaterial, UnsignedByteType, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { GRAPHICS_PRESETS } from '../src/render/graphicsOptions';
import { DISTORTION_CAPACITY, DistortionField } from '../src/render/post/DistortionField';
import { PostPipeline } from '../src/render/post/PostPipeline';
import { DEFAULT_POST_MOOD } from '../src/render/post/types';
import type { DepthGTAO } from '../src/render/post/DepthGTAO';
import { compositeFragment, finiteOcclusionGLSL } from '../src/render/post/shaders';

type Resources = {
  scene: WebGLRenderTarget; ao: WebGLRenderTarget;
  aoDenoised: WebGLRenderTarget; gtao: DepthGTAO;
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
  const clearColor = new Color(0x123456);
  let clearAlpha = 0.7;
  const compiles:{target:WebGLRenderTarget|null;mapping:number}[]=[];
  const frames: { scene: object; target: WebGLRenderTarget | null; mapping: number; camera: Camera }[] = [];
  const gpu = {
    capabilities: { maxSamples: 4 }, toneMapping: ACESFilmicToneMapping,
    toneMappingExposure: 1.3, autoClear: false,
    getClearColor: vi.fn((output: Color) => output.copy(clearColor)),
    getClearAlpha: vi.fn(() => clearAlpha),
    setClearColor: vi.fn((color: Color | number, alpha?: number) => {
      clearColor.set(color);
      if (alpha !== undefined) clearAlpha = alpha;
    }),
    getRenderTarget: vi.fn(() => target),
    setRenderTarget: vi.fn((next: WebGLRenderTarget | null) => { target = next; }),
    compileAsync: vi.fn(async () => {compiles.push({target,mapping:gpu.toneMapping});}),
    render: vi.fn((scene: object, camera: Camera) => { frames.push({ scene, camera, target, mapping: gpu.toneMapping }); }),
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-12, 12, 8, -8, 0.1, 200);
  camera.position.set(0, 30, 20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const pipeline = new PostPipeline(gpu as unknown as WebGLRenderer, scene, camera);
  return { gpu, scene, camera, pipeline, frames, compiles };
}

describe('HDR post lifecycle without a WebGL context', () => {
  it('prepares Low ink actor programs against the actual HDR target before any warm draw',async()=>{
    const {pipeline,compiles}=fixture();pipeline.setOptions(GRAPHICS_PRESETS.low,'low');await pipeline.prepare();
    expect(compiles[0]).toMatchObject({target:resources(pipeline)!.scene,mapping:NoToneMapping});
    expect(compiles[1]).toMatchObject({target:null,mapping:NoToneMapping});pipeline.dispose();
  });

  it('keeps explicit ink-off Low to a single forward render with no post resources, even after prepare', async () => {
    const { pipeline, gpu, scene, frames } = fixture();
    pipeline.setSize(1920, 1080, 2);
    pipeline.setOptions({ ...GRAPHICS_PRESETS.high, inkOutlines: 'off' }, 'low');
    pipeline.distortion.shockwave(0, 0);
    await pipeline.prepare();
    pipeline.render(1 / 60);
    expect(resources(pipeline)).toBeUndefined();
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ scene, target: null, mapping: AgXToneMapping });
    expect(pipeline.distortion.activeCount).toBe(0);
    expect(gpu.compileAsync).toHaveBeenCalledTimes(1);
    expect(gpu.autoClear).toBe(false);
    pipeline.dispose();
  });

  it('keeps default Low silhouette to scene plus compact composite with one-pixel optional targets', async () => {
    const { pipeline, gpu, scene, frames } = fixture();
    pipeline.setSize(1920, 1080);
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low');
    pipeline.distortion.shockwave(0, 0);
    await pipeline.prepare();
    expect(gpu.compileAsync).toHaveBeenCalledTimes(2); // scene + selected composite
    frames.length = 0;
    pipeline.render(1 / 60);
    const r = resources(pipeline)!;
    expect(frames).toHaveLength(2);
    expect(frames[0]).toMatchObject({ scene, target: r.scene, mapping: NoToneMapping });
    expect(frames[1]).toMatchObject({ target: null, mapping: NoToneMapping });
    expect(r.composite.uniforms.inkMode.value).toBe(1);
    expect(r.scene.textures).toHaveLength(2);
    for (const target of [r.ao, r.aoDenoised, r.bloomA, r.bloomB, r.distortion]) {
      expect([target.width, target.height]).toEqual([1, 1]);
    }
    for (const option of ['aoEnabled', 'bloomEnabled', 'distortionEnabled', 'lensEnabled', 'atmosphereEnabled']) {
      expect(r.composite.uniforms[option].value).toBe(0);
    }
    expect(pipeline.distortion.activeCount).toBe(0);
    pipeline.dispose();
  });

  it('releases High targets when switching to default Low and lazily recreates the compact target set', () => {
    const { pipeline } = fixture();
    pipeline.setSize(1280, 720);
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    pipeline.render(0);
    const high = resources(pipeline)!, disposed = vi.spyOn(high.scene, 'dispose');
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low');
    expect(disposed).toHaveBeenCalledOnce();
    expect(resources(pipeline)).toBeUndefined();
    pipeline.render(0);
    const low = resources(pipeline)!;
    expect(low.scene).not.toBe(high.scene);
    expect([low.scene.width, low.scene.height]).toEqual([1280, 720]);
    expect([low.ao.width, low.ao.height, low.bloomA.width, low.bloomA.height]).toEqual([1, 1, 1, 1]);
    pipeline.dispose();
  });

  it('retires context-owned attachments and recreates the same High pipeline after restore', () => {
    const {pipeline}=fixture();pipeline.setOptions(GRAPHICS_PRESETS.high,'high');pipeline.render(0);
    const old=resources(pipeline)!,dispose=vi.spyOn(old.scene,'dispose');pipeline.distortion.shockwave(0,0);
    pipeline.invalidate();expect(resources(pipeline)).toBeUndefined();expect(dispose).toHaveBeenCalledOnce();expect(pipeline.distortion.activeCount).toBe(0);
    pipeline.render(0);expect(resources(pipeline)!.scene).not.toBe(old.scene);expect(resources(pipeline)!.scene.texture.type).toBe(HalfFloatType);pipeline.dispose();
  });

  it('allocates HDR color and compact geometry plus depth without MSAA and applies DPR/render scale once', () => {
    const { pipeline, frames } = fixture();
    pipeline.setOptions({ ...GRAPHICS_PRESETS.high, resolutionScale: 0.75 }, 'high');
    pipeline.setSize(800, 600, 2);
    expect(resources(pipeline)).toBeUndefined();
    pipeline.render(1 / 60);
    const r = resources(pipeline)!;
    expect(r.scene.texture.type).toBe(HalfFloatType);
    expect(r.scene.samples).toBe(0);
    expect(r.scene.textures).toHaveLength(2);
    expect(r.scene.textures[1].type).toBe(UnsignedByteType);
    expect(r.scene.textures[1].minFilter).toBe(NearestFilter);
    expect(r.scene.textures[1].magFilter).toBe(NearestFilter);
    expect(r.composite.uniforms.tGeometry.value).toBe(r.scene.textures[1]);
    expect(r.scene.depthTexture).toBeTruthy();
    expect([r.scene.width, r.scene.height]).toEqual([1200, 900]);
    expect([r.ao.width, r.ao.height]).toEqual([600, 450]);
    expect([r.bloomA.width, r.bloomA.height]).toEqual([300, 225]);
    expect([r.distortion.width, r.distortion.height]).toEqual([300, 225]);
    expect(frames).toHaveLength(7); // scene + GTAO/denoise + extract + blur X/Y + composite
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
    const owned = [r.scene, r.ao, r.aoDenoised, r.bloomA, r.bloomB, r.distortion,
      r.occlusion, r.gtao.material, r.gtao.denoiseMaterial, r.gtao.noise, r.gtao.denoiseNoise,
      r.extract, r.blur, r.distort, r.composite, r.geometry];
    const disposals = owned.map(value => vi.spyOn(value, 'dispose'));
    pipeline.setOptions({ ...GRAPHICS_PRESETS.low, inkOutlines: 'off' }, 'low');
    pipeline.setOptions({ ...GRAPHICS_PRESETS.low, inkOutlines: 'off' }, 'low');
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
    expect(gpu.compileAsync).toHaveBeenCalledTimes(8);
    expect(frames).toHaveLength(9);
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
    pipeline.setOptions({ ...GRAPHICS_PRESETS.low, inkOutlines: 'off' }, 'low');
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
    expect(r.gtao.material.defines.PERSPECTIVE_CAMERA).toBe(1);
    expect(r.gtao.material.uniforms.cameraNear.value).toBe(0.1);
    expect(r.gtao.material.uniforms.cameraFar.value).toBe(180);
    expect(r.gtao.material.uniforms.cameraProjectionMatrix.value.equals(camera.projectionMatrix)).toBe(true);
    expect(r.gtao.denoiseMaterial.uniforms.cameraProjectionMatrixInverse.value.equals(camera.projectionMatrixInverse)).toBe(true);
    const ortho = new OrthographicCamera(-12, 12, 8, -8, 1, 120);
    pipeline.setCamera(ortho);
    expect(r.gtao.material.defines.PERSPECTIVE_CAMERA).toBe(0);
    expect(r.gtao.material.uniforms.cameraNear.value).toBe(1);
    pipeline.dispose();
  });

  it('uses real GTAO with shared depth, fixed noise, and a half-resolution denoise target by default', () => {
    const { pipeline, frames, scene, gpu } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    pipeline.setSize(1280, 720);
    pipeline.render(0);
    const r = resources(pipeline)!;
    expect(r.gtao.material.fragmentShader).toContain('cosHorizons');
    expect(r.gtao.denoiseMaterial.fragmentShader).toContain('denoiseSample');
    expect(r.gtao.material.defines).toMatchObject({ NORMAL_VECTOR_TYPE: 1, SAMPLES: 12, PERSPECTIVE_CAMERA: 0 });
    expect(r.gtao.material.uniforms.tNormal.value).toBe(r.scene.textures[1]);
    expect(r.gtao.material.fragmentShader).toContain('geometry.zw*=255.0');expect(r.gtao.material.fragmentShader).toContain('return computeNormalFromDepth(uv)');
    expect(r.gtao.denoiseMaterial.defines).toMatchObject({ NORMAL_VECTOR_TYPE: 1, SAMPLES: 8, SAMPLE_LUMINANCE: 'a.r' });
    expect(r.gtao.material.defines.FRAGMENT_OUTPUT).toBe('vec4(ao, packNormalToRGB(viewNormal))');
    expect(r.gtao.denoiseMaterial.uniforms.tNormal.value).toBe(r.ao.texture);
    expect(r.gtao.denoiseMaterial.fragmentShader).toContain('texelFetch(tNormal, pixel, 0).gba');
    expect(r.gtao.denoiseMaterial.fragmentShader).toContain('if (planeError > 0.015) return computeNormalFromDepth(uv)');
    expect(r.gtao.material.uniforms.tDepth.value).toBe(r.scene.depthTexture);
    expect(r.gtao.denoiseMaterial.uniforms.tDepth.value).toBe(r.scene.depthTexture);
    expect(r.gtao.denoiseMaterial.uniforms.tDiffuse.value).toBe(r.ao.texture);
    expect(r.composite.uniforms.tAO.value).toBe(r.aoDenoised.texture);
    expect([r.aoDenoised.width, r.aoDenoised.height]).toEqual([640, 360]);
    expect(frames.filter(frame => frame.scene === scene)).toHaveLength(1);
    const noise = r.gtao.noise;
    pipeline.render(0.016);
    expect(resources(pipeline)!.gtao.noise).toBe(noise);
    const restored = new Color();
    gpu.getClearColor(restored);
    expect(restored.getHex()).toBe(0x123456);
    expect(gpu.getClearAlpha()).toBe(0.7);
    pipeline.dispose();
  });

  it('switches to contact AO without reallocating or drawing denoise, then back to GTAO', () => {
    const { pipeline, frames } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    pipeline.render(0);
    const r = resources(pipeline)!;
    frames.length = 0;
    pipeline.setAmbientOcclusionAlgorithm('contact');
    pipeline.render(0);
    expect(resources(pipeline)).toBe(r);
    expect(frames).toHaveLength(6);
    expect(frames.some(frame => frame.target === r.aoDenoised)).toBe(false);
    expect(r.composite.uniforms.tAO.value).toBe(r.ao.texture);
    pipeline.setAmbientOcclusionAlgorithm('gtao');
    frames.length = 0;
    pipeline.render(0);
    expect(frames).toHaveLength(7);
    expect(r.composite.uniforms.tAO.value).toBe(r.aoDenoised.texture);
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

describe('finite AO shader numerics', () => {
  // These small scalar GLSL guards have JS-compatible bodies. Execute those
  // shipping bodies with GLSL clamp semantics instead of duplicating the logic.
  function scalarGuard(source: string): (value: number) => number {
    const body = source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'));
    const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
    const evaluate = new Function('value', 'clamp', body) as (value: number, clamp: Function) => number;
    return value => evaluate(value, clamp);
  }

  it('preserves valid AO and makes non-finite samples unoccluded before HDR multiplication', () => {
    const guard = scalarGuard(finiteOcclusionGLSL);
    for (const value of [0, 0.18, 0.55, 1]) expect(guard(value)).toBe(value);
    for (const value of [NaN, Infinity, -Infinity, -0.01, 1.01]) {
      expect(guard(value)).toBe(1);
      expect(3.5 * guard(value)).toBe(3.5);
    }
    expect(compositeFragment).toContain(finiteOcclusionGLSL);
    expect(compositeFragment).toContain('float ao = finiteOcclusion(texture2D(tAO, uv).r)');
  });

});

describe('post shader work and packed normal precision', () => {
  // Specialize only uniform-coherent branches, leaving per-pixel branches
  // untouched. This checks the actual shader's texture work, not a second shader.
  function specialize(source: string, enabled: boolean): string {
    const branch = /if\s*\((?:(?:ao|bloom|distortion|lens|atmosphere)Enabled > 0\.5|inkMode>\.5)\)\s*/g;
    let result = '';
    let cursor = 0;
    for (;;) {
      branch.lastIndex = cursor;
      const match = branch.exec(source);
      if (!match) return result + source.slice(cursor);
      result += source.slice(cursor, match.index);
      const start = branch.lastIndex;
      let end = start;
      if (source[start] === '{') {
        let depth = 1;
        for (end = start + 1; depth > 0; end++) {
          if (source[end] === '{') depth++;
          if (source[end] === '}') depth--;
        }
      } else end = source.indexOf(';', start) + 1;
      if (enabled) result += source.slice(start, end);
      cursor = end;
    }
  }

  it('bounds post AA and geometry ink work while optional composite effects remain skippable', () => {
    // Separate called helper bodies from main: a disabled ink branch must not
    // make its unused function declaration look like executed texture work.
    const main = compositeFragment.slice(compositeFragment.indexOf('void main() {'));
    const aa = compositeFragment.slice(compositeFragment.indexOf('vec3 sceneAA('), compositeFragment.indexOf('float noise('));
    expect(aa.match(/texture2D\(tScene,/g)).toHaveLength(7);
    expect(aa).not.toContain('for(');
    expect(aa).toContain('if(hi-lo<'); // coherent regions keep their exact center
    const disabled = specialize(main, false);
    expect(disabled).toContain('vec3 color = sceneAA(uv)');
    expect(disabled).not.toContain('texture2D(tScene,');
    for (const sampler of ['tDistortion', 'tAO', 'tBloom', 'tDepth', 'tGeometry']) {
      expect(disabled).not.toContain(`texture2D(${sampler},`);
    }
    expect(disabled).not.toContain('inkCoverage(');
    expect(disabled).not.toContain('float haze =');
    expect(disabled).not.toContain('float grain =');
    expect(disabled).toContain('AgXToneMapping(color)');
    expect(disabled).toContain('float dither =');
    const enabled = specialize(main, true);
    // Six bounded, depth-rejected far-field lens taps share the composite.
    expect(enabled.match(/texture2D\(tScene,/g)).toHaveLength(7);
    expect(enabled).toContain('for(int i=0;i<6;i++)');
    expect(enabled).toContain('sampleDepth-focalDepth');
    for (const sampler of ['tDistortion', 'tAO', 'tBloom', 'tDepth', 'tGeometry']) {
      expect(enabled).toContain(`texture2D(${sampler},`);
    }
    expect(enabled).toContain('float haze =');
    expect(enabled).toContain('float grain =');
    const ink = compositeFragment.slice(compositeFragment.indexOf('float inkCoverage('), compositeFragment.indexOf('vec3 sceneAA('));
    expect(ink).toContain('for(int i=0;i<8;i++)');
    expect(ink).toContain('if(inkMode<.5||center.z<.5||center.w<.5');expect(ink).toContain('if(floorSurface&&(inkMode<1.5||inkStrength<.5))return 0.0');expect(ink).toContain('center.w>6.5');
    expect(ink).toContain('if(!actor&&inkMode>1.5');
    expect(ink).not.toContain('texture2D(tScene,'); // no luminance edge detection
  });

  it('retains AO and unit normal accuracy in the existing half-float RGBA target', () => {
    const half = (value: number) => DataUtils.fromHalfFloat(DataUtils.toHalfFloat(value));
    for (const normal of [[1, 0, 0], [0, 0, 1], [0.31, -0.52, 0.8]]) {
      const length = Math.hypot(...normal);
      const unit = normal.map(value => value / length);
      const decoded = unit.map(value => half(value * 0.5 + 0.5) * 2 - 1);
      const decodedLength = Math.hypot(...decoded);
      const agreement = unit.reduce((sum, value, i) => sum + value * decoded[i] / decodedLength, 0);
      expect(agreement).toBeGreaterThan(0.99999);
    }
    for (const ao of [0, 0.12, 0.55, 1]) expect(Math.abs(half(ao) - ao)).toBeLessThan(0.0005);
    const { pipeline } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high'); pipeline.render(0);
    const r = resources(pipeline)!;
    // Explicit texel fetch preserves the selected side of a silhouette even
    // though AO itself retains linear filtering for denoise interpolation.
    expect(r.gtao.denoiseMaterial.fragmentShader).toContain('ivec2 pixel = clamp(ivec2(uv * vec2(size))');
    expect(r.gtao.denoiseMaterial.fragmentShader).not.toContain('return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb)');
    expect(r.gtao.denoiseMaterial.fragmentShader).toContain('float depthSimilarity =');
    expect(r.gtao.denoiseMaterial.defines.FRAGMENT_OUTPUT).toBe('vec4(vec3(denoised.r), 1.0)');
    pipeline.dispose();
  });
});
