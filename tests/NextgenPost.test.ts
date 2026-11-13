import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { lowAntialiasFragment } from '../src/render/post/LowAntialias';
import { describe, expect, it, vi } from 'vitest';
import {
  ACESFilmicToneMapping, AgXToneMapping, Camera, Color, DataUtils, HalfFloatType, RGBFormat, UnsignedInt101111Type, NearestFilter, SRGBColorSpace, NoToneMapping, OrthographicCamera,
  DepthTexture, Mesh, PerspectiveCamera, Scene, ShaderMaterial, UnsignedByteType, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { GRAPHICS_PRESETS } from '../src/render/graphicsOptions';
import { DISTORTION_CAPACITY, DistortionField } from '../src/render/post/DistortionField';
import { PostPipeline } from '../src/render/post/PostPipeline';
import { DEFAULT_POST_MOOD } from '../src/render/post/types';
import type { DepthGTAO } from '../src/render/post/DepthGTAO';
import { compositeFragment, finiteOcclusionGLSL } from '../src/render/post/shaders';

type Resources = {
  scene: WebGLRenderTarget; present: WebGLRenderTarget; antialias: ShaderMaterial; ao: WebGLRenderTarget;
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
    expect(compiles[1]).toMatchObject({target:resources(pipeline)!.present,mapping:NoToneMapping});
    expect(compiles[2]).toMatchObject({target:null,mapping:NoToneMapping});pipeline.dispose();
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

  it('keeps default Low silhouette to scene, compact composite and final AA with one-pixel optional targets', async () => {
    const { pipeline, gpu, scene, frames } = fixture();
    pipeline.setSize(1920, 1080);
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low');
    pipeline.distortion.shockwave(0, 0);
    await pipeline.prepare();
    expect(gpu.compileAsync).toHaveBeenCalledTimes(3); // actual HDR scene + linear composite + screen AA
    frames.length = 0;
    pipeline.render(1 / 60);
    const r = resources(pipeline)!;
    expect(frames).toHaveLength(3);
    expect(frames[0]).toMatchObject({ scene, target: r.scene, mapping: NoToneMapping });
    expect(frames[1]).toMatchObject({ target: r.present, mapping: NoToneMapping });
    expect(frames[2]).toMatchObject({ target: null, mapping: NoToneMapping });
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
    pipeline.render(0);expect(resources(pipeline)!.scene).not.toBe(old.scene);expect(resources(pipeline)!.scene.texture.type).toBe(UnsignedInt101111Type);pipeline.dispose();
  });

  it('allocates HDR color and compact geometry plus depth without MSAA and applies DPR/render scale once', () => {
    const { pipeline, frames } = fixture();
    pipeline.setOptions({ ...GRAPHICS_PRESETS.high, resolutionScale: 0.75 }, 'high');
    pipeline.setSize(800, 600, 2);
    expect(resources(pipeline)).toBeUndefined();
    pipeline.render(1 / 60);
    const r = resources(pipeline)!;
    expect(r.scene.texture.type).toBe(UnsignedInt101111Type);
    expect(r.scene.texture.format).toBe(RGBFormat);
    expect(r.ao.texture.type).toBe(HalfFloatType);
    expect(r.aoDenoised.texture.type).toBe(HalfFloatType);
    expect(r.scene.samples).toBe(0);
    expect(r.scene.textures).toHaveLength(2);
    expect(r.scene.textures[1].type).toBe(UnsignedByteType);
    expect(r.scene.textures[1].minFilter).toBe(NearestFilter);
    expect(r.scene.textures[1].magFilter).toBe(NearestFilter);
    expect(r.composite.uniforms.tGeometry.value).toBe(r.scene.textures[1]);
    expect(r.scene.depthTexture).toBeTruthy();
    expect([r.scene.width, r.scene.height]).toEqual([1200, 900]);
    expect([r.present.width,r.present.height]).toEqual([1200,900]);
    expect(r.present.texture.type).toBe(UnsignedByteType);
    expect(r.present.texture.colorSpace).toBe(SRGBColorSpace);
    expect(r.antialias.uniforms.tDiffuse.value).toBe(r.present.texture);
    expect(r.antialias.uniforms.resolution.value.toArray()).toEqual([1/1200,1/900]);
    expect([r.ao.width, r.ao.height]).toEqual([600, 450]);
    expect([r.bloomA.width, r.bloomA.height]).toEqual([300, 225]);
    expect([r.distortion.width, r.distortion.height]).toEqual([300, 225]);
    expect(frames).toHaveLength(8); // scene + GTAO/denoise + extract + blur X/Y + composite + final AA
    expect(frames.every(frame => frame.mapping === NoToneMapping)).toBe(true);
    pipeline.setSize(400, 300, 1);
    expect([r.scene.width, r.scene.height]).toEqual([300, 225]);
    expect([r.present.width,r.present.height]).toEqual([300,225]);
    expect(r.antialias.uniforms.resolution.value.toArray()).toEqual([1/300,1/225]);
    pipeline.dispose();
  });

  it('skips disabled optional passes and keeps grading active', () => {
    const { pipeline, frames } = fixture();
    pipeline.setOptions({ ...GRAPHICS_PRESETS.low }, 'high');
    pipeline.setMood({ ...DEFAULT_POST_MOOD, grade: { ...DEFAULT_POST_MOOD.grade, exposure: 0.91 } });
    pipeline.render(0.016);
    expect(frames).toHaveLength(3);
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
    const owned = [r.scene, r.present, r.antialias, r.ao, r.aoDenoised, r.bloomA, r.bloomB, r.distortion,
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
    expect(gpu.compileAsync).toHaveBeenCalledTimes(9);
    expect(frames).toHaveLength(10);
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

  it('releases High targets without warm draws when explicit ink-off Low is selected during preparation', async () => {
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
    expect(frames).toHaveLength(7);
    expect(frames.some(frame => frame.target === r.aoDenoised)).toBe(false);
    expect(r.composite.uniforms.tAO.value).toBe(r.ao.texture);
    pipeline.setAmbientOcclusionAlgorithm('gtao');
    frames.length = 0;
    pipeline.render(0);
    expect(frames).toHaveLength(8);
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
    const disabled = specialize(main, false);
    expect(disabled).toContain('vec3 color = texture2D(tScene, uv).rgb');
    expect(disabled.match(/texture2D\(tScene,/g)).toHaveLength(1);
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
    expect(enabled.match(/texture2D\(tScene,/g)).toHaveLength(8);
    expect(enabled).toContain('for(int i=0;i<6;i++)');
    expect(enabled).toContain('sampleDepth-focalDepth');
    for (const sampler of ['tDistortion', 'tAO', 'tBloom', 'tDepth', 'tGeometry']) {
      expect(enabled).toContain(`texture2D(${sampler},`);
    }
    expect(enabled).toContain('float haze =');
    expect(enabled).toContain('float grain =');
    const ink = compositeFragment.slice(compositeFragment.indexOf('float inkCoverage('), compositeFragment.indexOf('float noise('));
    expect(ink).toContain('for(int i=0;i<8;i++)');
    expect(ink).toContain('if(inkMode<.5||center.z<.5||center.w<.5');expect(ink).toContain('if(floorSurface)return 0.0');expect(ink).toContain('center.w>6.5');
    expect(ink).toContain('if(!actor&&inkMode>1.5');
    expect(ink.match(/texture2D\(tScene,/g)).toHaveLength(1); // radiance chooses line color only after an identity boundary
    expect(ink).toContain('if(different*surface>.5)inkBackdropLuma=');
    expect(ink).toContain('return max(edge,crease*inkStyle.w)*haze*inkStyle.z;');
    expect(ink).toContain('edge=max(edge,different*surface);');
  });

  it('filters graded ink in one bounded FXAA stage before the final screen color conversion', () => {
    const { pipeline, frames } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    pipeline.render(0);
    const r = resources(pipeline)!;
    expect(r.antialias.name).toBe('Containment final FXAA');
    expect(r.antialias.uniforms.tDiffuse.value).toBe(r.present.texture);
    expect(r.present.texture.type).toBe(UnsignedByteType);
    expect(r.present.texture.colorSpace).toBe(SRGBColorSpace);
    expect(frames.at(-2)!.target).toBe(r.present);
    expect(frames.at(-1)!.target).toBeNull();
    const aa = r.antialias.fragmentShader;
    expect(aa).toContain('#define EDGE_STEP_COUNT 6');
    expect(aa.match(/for \( int i = 1; i < EDGE_STEP_COUNT/g)).toHaveLength(2);
    expect(aa).toContain('if ( ShouldSkipPixel( luminance ) )');
    expect(aa).toContain('return Sample( tex2D, uv );');
    const neighborhood = aa.slice(aa.indexOf('LuminanceData SampleLuminanceNeighborhood('),aa.indexOf('bool ShouldSkipPixel('));
    // The retained Three implementation declares nine neighborhood samples;
    // coherent pixels skip both bounded edge searches and keep the center.
    expect(neighborhood.match(/= SampleLuminance\(/g)).toHaveLength(9);
    expect(aa.indexOf('#include <colorspace_fragment>')).toBeGreaterThan(aa.lastIndexOf('gl_FragColor = ApplyFXAA('));
    pipeline.dispose();
  });

  it('limits default Low final AA to five fixed taps while preserving the prepared presentation targets', async () => {
    const { pipeline, gpu, frames } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low');
    pipeline.setSize(1920, 1080);
    const selected: { target: WebGLRenderTarget | null; material?: ShaderMaterial }[] = [];
    await pipeline.prepare(async scene => {
      const triangle = scene.children[0] as { material?: ShaderMaterial } | undefined;
      selected.push({ target: gpu.getRenderTarget(), material: triangle?.material });
    });
    const r = resources(pipeline)!;
    expect(selected).toHaveLength(3);
    expect(selected[0].target).toBe(r.scene);
    expect(selected[1]).toEqual({ target: r.present, material: r.composite });
    expect(selected[2]).toEqual({ target: null, material: r.antialias });
    expect(r.antialias.name).toBe('Containment final compact AA');
    expect(r.antialias.fragmentShader).toBe(lowAntialiasFragment);
    expect(lowAntialiasFragment.match(/texture2D\(tDiffuse,/g)).toHaveLength(5);
    expect(lowAntialiasFragment).not.toMatch(/\b(?:for|while)\s*\(/);
    expect(lowAntialiasFragment).not.toContain('EDGE_STEP_COUNT');
    expect(lowAntialiasFragment).toContain('float blend = .32 *');
    expect(lowAntialiasFragment).toContain('gradient.yx');
    expect(lowAntialiasFragment.match(/#include <colorspace_fragment>/g)).toHaveLength(1);
    expect(lowAntialiasFragment.indexOf('#include <colorspace_fragment>')).toBeGreaterThan(lowAntialiasFragment.indexOf('gl_FragColor ='));
    expect(r.antialias.uniforms.tDiffuse.value).toBe(r.present.texture);
    expect(r.antialias.uniforms.resolution.value.toArray()).toEqual([1 / 1920, 1 / 1080]);
    expect(r.present.texture.colorSpace).toBe(SRGBColorSpace);
    expect(r.present.texture.type).toBe(UnsignedByteType);
    expect(r.composite.uniforms.inkPixel.value.toArray()).toEqual([1 / 1920, 1 / 1080]);
    frames.length = 0;
    pipeline.render(0);
    expect(frames.map(frame => frame.target)).toEqual([r.scene, r.present, null]);
    pipeline.dispose();
  });

  it('retires Low final AA on tier changes and retains the unchanged High FXAA source', () => {
    const { pipeline } = fixture();
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low'); pipeline.render(0);
    const low = resources(pipeline)!, retired = vi.spyOn(low.antialias, 'dispose');
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    expect(retired).toHaveBeenCalledOnce();
    expect(resources(pipeline)).toBeUndefined();
    pipeline.render(0);
    const high = resources(pipeline)!;
    expect(high.antialias.fragmentShader).toBe(FXAAShader.fragmentShader.replace(
      'gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );',
      'gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );\n#include <colorspace_fragment>',
    ));
    expect(high.antialias.name).toBe('Containment final FXAA');
    const retiredHigh = vi.spyOn(high.antialias, 'dispose');
    pipeline.setOptions(GRAPHICS_PRESETS.low, 'low'); pipeline.render(0);
    expect(retiredHigh).toHaveBeenCalledOnce();
    expect(resources(pipeline)!.antialias).not.toBe(low.antialias);
    expect(resources(pipeline)!.antialias.fragmentShader).toBe(lowAntialiasFragment);
    pipeline.dispose(); pipeline.dispose();
    expect(retired).toHaveBeenCalledOnce(); expect(retiredHigh).toHaveBeenCalledOnce();
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


it('binds detached particle depth without replacing atlas hooks or adding a scene draw',()=>{
  const {pipeline,gpu,scene,camera,frames}=fixture(),mesh=new Mesh(),original=vi.fn();
  mesh.onBeforeRender=original;
  const received=vi.fn(),detached=new DepthTexture(1,1),owner=(pipeline as unknown as {softDepth:{capture:()=>DepthTexture|null;begin:(source:WebGLRenderTarget|null)=>void;end:()=>void}}).softDepth;
  const capture=vi.spyOn(owner,'capture').mockReturnValue(detached),begin=vi.spyOn(owner,'begin'),end=vi.spyOn(owner,'end');
  pipeline.bindSoftParticles([mesh],received,()=>true);
  const render=gpu.render.getMockImplementation()!;
  gpu.render.mockImplementation((rendered,c)=>{render(rendered,c);if(rendered===scene)Reflect.apply(mesh.onBeforeRender,mesh,[gpu,scene,camera,mesh.geometry,mesh.material,null]);});
  pipeline.setOptions(GRAPHICS_PRESETS.high,'high');end.mockClear();pipeline.render(0);
  expect(original).toHaveBeenCalledOnce();expect(received).toHaveBeenLastCalledWith(detached);
  expect(capture).toHaveBeenCalledOnce();expect(begin).toHaveBeenLastCalledWith(resources(pipeline)!.scene);expect(end).toHaveBeenCalledOnce();
  expect(frames.filter(frame=>frame.scene===scene)).toHaveLength(1);
  pipeline.setOptions(GRAPHICS_PRESETS.low,'low');expect(received).toHaveBeenLastCalledWith(null);
  pipeline.dispose();expect(mesh.onBeforeRender).toBe(original);detached.dispose();
});

it('captures depth only for meshes that demand it, after their atlas hook, and unbinds legacy batches',()=>{
  const {pipeline,gpu,scene,camera}=fixture(),legacy=new Mesh(),authored=new Mesh(),calls:string[]=[];
  const detached=new DepthTexture(1,1),received:Array<DepthTexture|null>=[];
  const owner=(pipeline as unknown as {softDepth:{capture:()=>DepthTexture|null}}).softDepth;
  const capture=vi.spyOn(owner,'capture').mockImplementation(()=>{calls.push('copy');return detached;});
  const beforeLegacy=vi.fn(()=>calls.push('atlas-legacy')),beforeAuthored=vi.fn(()=>calls.push('atlas-authored'));
  legacy.onBeforeRender=beforeLegacy;authored.onBeforeRender=beforeAuthored;
  let demand=true;
  pipeline.bindSoftParticles([legacy,authored],value=>{received.push(value);},()=>true,mesh=>{calls.push(mesh===legacy?'demand-legacy':'demand-authored');return mesh===authored&&demand;});
  const draw=(mesh:Mesh)=>Reflect.apply(mesh.onBeforeRender,mesh,[gpu,scene,camera,mesh.geometry,mesh.material,null]);
  draw(legacy);draw(authored);draw(legacy);
  expect(calls).toEqual(['atlas-legacy','demand-legacy','atlas-authored','demand-authored','copy','atlas-legacy','demand-legacy']);
  expect(received).toEqual([null,detached,null]);expect(capture).toHaveBeenCalledOnce();
  demand=false;draw(authored);expect(received.at(-1)).toBeNull();expect(capture).toHaveBeenCalledOnce();
  pipeline.dispose();expect(legacy.onBeforeRender).toBe(beforeLegacy);expect(authored.onBeforeRender).toBe(beforeAuthored);
  expect(received.at(-1)).toBeNull();detached.dispose();
});

it('does not ask a particle mesh for demand when atlas enablement is false',()=>{
  const {pipeline,gpu,scene,camera}=fixture(),mesh=new Mesh(),needsDepth=vi.fn(()=>true),receive=vi.fn();
  pipeline.bindSoftParticles([mesh],receive,()=>false,needsDepth);
  Reflect.apply(mesh.onBeforeRender,mesh,[gpu,scene,camera,mesh.geometry,mesh.material,null]);
  expect(needsDepth).not.toHaveBeenCalled();expect(receive).toHaveBeenLastCalledWith(null);pipeline.dispose();
});
