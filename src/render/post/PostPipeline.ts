import {
  ACESFilmicToneMapping, AgXToneMapping, BufferGeometry, Camera, Color, DepthTexture,
  Float32BufferAttribute, HalfFloatType, LinearFilter, Matrix4, Mesh, NoBlending,
  NoToneMapping, OrthographicCamera, Scene, ShaderMaterial, UnsignedIntType,
  Vector2, Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import type { GraphicsTier } from '../FrameBudget';
import { GRAPHICS_PRESETS, type GraphicsOptions } from '../graphicsOptions';
import { DistortionField, distortionFragment } from './DistortionField';
import { DepthGTAO } from './DepthGTAO';
import {
  bloomBlurFragment, bloomExtractFragment, compositeFragment, occlusionFragment, screenVertex,
} from './shaders';
import { DEFAULT_POST_MOOD, type PostMood } from './types';

export type { PostMood } from './types';
export type AmbientOcclusionAlgorithm = 'contact' | 'gtao';

type PostResources = {
  scene: WebGLRenderTarget;
  ao: WebGLRenderTarget;
  aoDenoised: WebGLRenderTarget;
  gtao: DepthGTAO;
  bloomA: WebGLRenderTarget;
  bloomB: WebGLRenderTarget;
  distortion: WebGLRenderTarget;
  occlusion: ShaderMaterial;
  extract: ShaderMaterial;
  blur: ShaderMaterial;
  distort: ShaderMaterial;
  composite: ShaderMaterial;
  geometry: BufferGeometry;
  screenScene: Scene;
  triangle: Mesh<BufferGeometry, ShaderMaterial>;
  screenCamera: OrthographicCamera;
};

/** HDR post on High; Low owns no post textures and uses one forward render. */
export class PostPipeline {
  readonly distortion = new DistortionField();
  private options: GraphicsOptions = GRAPHICS_PRESETS.low;
  private tier: GraphicsTier = 'low';
  private mood: PostMood = DEFAULT_POST_MOOD;
  private resources?: PostResources;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  private time = 0;
  private disposed = false;
  private agx = true;
  private occlusionAlgorithm: AmbientOcclusionAlgorithm = 'gtao';
  private readonly savedClearColor = new Color();
  private focusDistance = 26;
  private menuPresentation = false;

  constructor(
    private readonly renderer: WebGLRenderer,
    private readonly scene: Scene,
    private camera: Camera,
  ) { this.distortion.setEnabled(false); }

  /** Target allocation stays lazy until render/prepare after selecting High. */
  setOptions(options: GraphicsOptions, tier: GraphicsTier): void {
    if (this.disposed) return;
    const resized = this.options.resolutionScale !== options.resolutionScale;
    this.options = { ...options };
    this.tier = tier;
    this.distortion.setEnabled(tier === 'high' && options.distortion);
    if (tier === 'low') this.releaseResources();
    else if (resized && this.resources) this.resizeResources();
  }

  /** Swaps projection without rebuilding targets, including depth reconstruction. */
  setCamera(camera: Camera): void {
    this.camera = camera;
    this.resources?.gtao.setCamera(camera);
  }

  /** GTAO is the default; contact is retained for matching-scene cost comparisons. */
  setAmbientOcclusionAlgorithm(algorithm: AmbientOcclusionAlgorithm): void {
    this.occlusionAlgorithm = algorithm;
  }

  /** EnvironmentMoods can pass its complete mood here without conversion. */
  setMood(mood: PostMood): void {
    this.mood = mood;
    if (this.resources) this.applyMood(this.resources.composite);
  }

  /** AgX is the default; this switch supports matching-scene AgX evaluation. */
  setToneMapping(operator: 'aces' | 'agx'): void { this.agx = operator === 'agx'; }

  /** Stable focal plane; gameplay blur is confined beyond the combat neighborhood. */
  setFocus(distance:number, menu=false):void {
    this.focusDistance=Number.isFinite(distance)?Math.max(1,distance):26;
    this.menuPresentation=menu;
  }

  /** CSS size plus DPR; resolutionScale is applied exactly once to post targets. */
  setSize(width: number, height: number, pixelRatio = 1): void {
    this.width = Number.isFinite(width) ? Math.max(1, width) : 1;
    this.height = Number.isFinite(height) ? Math.max(1, height) : 1;
    this.pixelRatio = Number.isFinite(pixelRatio) ? Math.max(0.25, pixelRatio) : 1;
    if (this.resources) this.resizeResources();
  }

  /** Renders with renderer state restored even if the GPU raises an error. */
  render(dt: number): void {
    if (this.disposed) return;
    const target = this.renderer.getRenderTarget();
    this.renderTo(dt, target, false);
  }

  /** Compiles every post shader and draws a complete offscreen warm frame. */
  async prepare(compile:(scene:Scene,camera:Camera)=>Promise<unknown>=(scene,camera)=>this.renderer.compileAsync(scene,camera)): Promise<void> {
    if (this.disposed) return;
    await compile(this.scene, this.camera);
    if (this.disposed || this.tier === 'low') return;
    const resources = this.ensureResources();
    const originalTarget = this.renderer.getRenderTarget();
    const originalMapping = this.renderer.toneMapping;
    const warmTarget = this.target(1, 1);
    try {
      // Compile the actual screen color-space variants before the offscreen draw.
      this.renderer.setRenderTarget(null);
      this.renderer.toneMapping = NoToneMapping;
      for (const material of [resources.occlusion, resources.gtao.material, resources.gtao.denoiseMaterial,
        resources.extract, resources.blur, resources.distort, resources.composite]) {
        if (this.disposed || this.resources !== resources) return;
        resources.triangle.material = material;
        await compile(resources.screenScene, resources.screenCamera);
      }
      if (!this.disposed && this.tier === 'high') this.renderTo(0, warmTarget, true);
    } finally {
      warmTarget.dispose();
      this.renderer.toneMapping = originalMapping;
      this.renderer.setRenderTarget(originalTarget);
    }
  }

  /** Recreate offscreen attachments after a WebGL context replacement. */
  invalidate(): void { this.releaseResources(); this.distortion.clear(); }

  /** Releases all GPU resources; safe to repeat during context recovery. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseResources();
    this.distortion.dispose();
  }

  private renderTo(dt: number, output: WebGLRenderTarget | null, warm: boolean): void {
    const renderer = this.renderer;
    const originalTarget = renderer.getRenderTarget();
    const originalMapping = renderer.toneMapping;
    const originalExposure = renderer.toneMappingExposure;
    const originalAutoClear = renderer.autoClear;
    renderer.getClearColor(this.savedClearColor);
    const originalClearAlpha = renderer.getClearAlpha();
    try {
      renderer.autoClear = true;
      if (this.tier === 'low') {
        renderer.toneMapping = this.agx ? AgXToneMapping : ACESFilmicToneMapping;
        renderer.toneMappingExposure = this.mood.grade.exposure;
        renderer.setRenderTarget(output);
        renderer.render(this.scene, this.camera);
        return;
      }
      const r = this.ensureResources();
      renderer.toneMapping = NoToneMapping;
      this.time += Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
      this.camera.updateMatrixWorld();
      renderer.setRenderTarget(r.scene);
      renderer.render(this.scene, this.camera);
      r.occlusion.uniforms.projectionInverse.value.copy(this.camera.projectionMatrixInverse);
      r.occlusion.uniforms.projection.value.copy(this.camera.projectionMatrix);
      if (this.options.ambientOcclusion || warm) {
        // GTAO discards background pixels; white clear preserves unoccluded sky.
        renderer.setClearColor(0xffffff, 1);
        if (warm) this.draw(r.occlusion, r.ao);
        if (this.occlusionAlgorithm === 'gtao' || warm) {
          r.gtao.update(this.camera);
          this.draw(r.gtao.material, r.ao);
          r.gtao.denoiseMaterial.uniforms.tDiffuse.value = r.ao.texture;
          this.draw(r.gtao.denoiseMaterial, r.aoDenoised);
        } else this.draw(r.occlusion, r.ao);
        renderer.setClearColor(this.savedClearColor, originalClearAlpha);
      }
      if (this.options.bloom || warm) {
        this.draw(r.extract, r.bloomA);
        r.blur.uniforms.tInput.value = r.bloomA.texture;
        r.blur.uniforms.direction.value.set(1 / r.bloomA.width, 0);
        this.draw(r.blur, r.bloomB);
        r.blur.uniforms.tInput.value = r.bloomB.texture;
        r.blur.uniforms.direction.value.set(0, 1 / r.bloomB.height);
        this.draw(r.blur, r.bloomA);
      }
      this.distortion.update(dt, this.camera);
      const hasDistortion = this.options.distortion && this.distortion.activeCount > 0;
      r.distort.uniforms.time.value = this.time;
      if (hasDistortion || warm) this.draw(r.distort, r.distortion);
      const u = r.composite.uniforms;
      u.tAO.value = this.occlusionAlgorithm === 'gtao' ? r.aoDenoised.texture : r.ao.texture;
      u.projectionInverse.value.copy(this.camera.projectionMatrixInverse);
      u.cameraWorld.value.copy(this.camera.matrixWorld);
      u.time.value = this.time;
      u.aoEnabled.value = this.options.ambientOcclusion ? 1 : 0;
      u.bloomEnabled.value = this.options.bloom ? 1 : 0;
      u.distortionEnabled.value = hasDistortion ? 1 : 0;
      u.lensEnabled.value = this.options.lensEffects ? 1 : 0;
      u.focusDistance.value = this.focusDistance;
      u.menuPresentation.value = this.menuPresentation ? 1 : 0;
      u.atmosphereEnabled.value = this.options.atmosphere ? 1 : 0;
      u.useAgX.value = this.agx ? 1 : 0;
      this.draw(r.composite, output);
    } finally {
      renderer.toneMapping = originalMapping;
      renderer.toneMappingExposure = originalExposure;
      renderer.autoClear = originalAutoClear;
      renderer.setClearColor(this.savedClearColor, originalClearAlpha);
      renderer.setRenderTarget(originalTarget);
    }
  }

  private draw(material: ShaderMaterial, target: WebGLRenderTarget | null): void {
    const r = this.resources!;
    r.triangle.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(r.screenScene, r.screenCamera);
  }

  private ensureResources(): PostResources {
    if (this.resources) return this.resources;
    const scene = this.target(1, 1, true);
    const ao = this.target(1, 1);
    const aoDenoised = this.target(1, 1);
    const gtao = new DepthGTAO(scene.depthTexture!, this.camera, ao.texture);
    const bloomA = this.target(1, 1);
    const bloomB = this.target(1, 1);
    const distortion = this.target(1, 1);
    const occlusion = this.material(occlusionFragment, {
      tDepth: { value: scene.depthTexture }, projectionInverse: { value: new Matrix4() },
      projection: { value: new Matrix4() }, invSize: { value: new Vector2() },
    });
    const extract = this.material(bloomExtractFragment, { tInput: { value: scene.texture } });
    const blur = this.material(bloomBlurFragment, {
      tInput: { value: bloomA.texture }, direction: { value: new Vector2() },
    });
    const distort = this.material(distortionFragment, {
      waves: { value: this.distortion.waves }, shapes: { value: this.distortion.shapes }, time: { value: 0 },
    });
    const composite = this.material(compositeFragment, {
      tScene: { value: scene.texture }, tDepth: { value: scene.depthTexture },
      tAO: { value: ao.texture }, tBloom: { value: bloomA.texture }, tDistortion: { value: distortion.texture },
      projectionInverse: { value: new Matrix4() }, cameraWorld: { value: new Matrix4() },
      invSize: { value: new Vector2() }, time: { value: 0 },
      aoEnabled: { value: 0 }, bloomEnabled: { value: 0 }, distortionEnabled: { value: 0 },
      lensEnabled: { value: 0 }, atmosphereEnabled: { value: 0 }, useAgX: { value: 0 },
      focusDistance: { value: 26 }, menuPresentation: { value: 0 },
      toneMappingExposure: { value: 1 }, saturation: { value: 1 }, contrast: { value: 1 },
      lift: { value: new Vector3() }, gain: { value: new Vector3(1, 1, 1) },
      shadowTint: { value: new Color() }, highlightTint: { value: new Color() },
      fogColor: { value: new Color() }, fogDensity: { value: 0 }, fogHeight: { value: 1 },
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    geometry.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
    const triangle = new Mesh(geometry, composite);
    triangle.frustumCulled = false;
    const screenScene = new Scene();
    screenScene.add(triangle);
    this.resources = {
      scene, ao, aoDenoised, gtao, bloomA, bloomB, distortion, occlusion, extract, blur, distort, composite,
      geometry, triangle, screenScene, screenCamera: new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    };
    this.applyMood(composite);
    this.resizeResources();
    return this.resources;
  }

  private target(width: number, height: number, depth = false): WebGLRenderTarget {
    const target = new WebGLRenderTarget(width, height, {
      type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter,
      depthBuffer: depth, stencilBuffer: false,
    });
    target.texture.name = depth ? 'Containment HDR scene' : 'Containment post';
    if (depth) {
      target.depthTexture = new DepthTexture(width, height, UnsignedIntType);
      target.samples = Math.min(2, this.renderer.capabilities.maxSamples);
    }
    return target;
  }

  private material(fragmentShader: string, uniforms: ShaderMaterial['uniforms']): ShaderMaterial {
    return new ShaderMaterial({
      vertexShader: screenVertex, fragmentShader, uniforms,
      depthTest: false, depthWrite: false, blending: NoBlending, toneMapped: false,
    });
  }

  private resizeResources(): void {
    const r = this.resources;
    if (!r) return;
    const scale = Math.max(0.5, Math.min(1, this.options.resolutionScale));
    const width = Math.max(1, Math.round(this.width * this.pixelRatio * scale));
    const height = Math.max(1, Math.round(this.height * this.pixelRatio * scale));
    r.scene.setSize(width, height);
    r.ao.setSize(Math.max(1, Math.ceil(width / 2)), Math.max(1, Math.ceil(height / 2)));
    r.aoDenoised.setSize(r.ao.width, r.ao.height);
    r.gtao.setSize(r.ao.width, r.ao.height);
    const quarterWidth = Math.max(1, Math.ceil(width / 4));
    const quarterHeight = Math.max(1, Math.ceil(height / 4));
    r.bloomA.setSize(quarterWidth, quarterHeight);
    r.bloomB.setSize(quarterWidth, quarterHeight);
    r.distortion.setSize(quarterWidth, quarterHeight);
    r.occlusion.uniforms.invSize.value.set(1 / width, 1 / height);
    r.composite.uniforms.invSize.value.set(1 / width, 1 / height);
  }

  private applyMood(material: ShaderMaterial): void {
    const u = material.uniforms;
    const grade = this.mood.grade;
    u.toneMappingExposure.value = grade.exposure;
    u.saturation.value = grade.saturation;
    u.contrast.value = grade.contrast;
    u.lift.value.fromArray(grade.lift);
    u.gain.value.fromArray(grade.gain);
    u.shadowTint.value.setHex(grade.shadowTint);
    u.highlightTint.value.setHex(grade.highlightTint);
    u.fogColor.value.setHex(this.mood.fog.color);
    u.fogDensity.value = this.mood.fog.density;
    u.fogHeight.value = this.mood.fog.height;
  }

  private releaseResources(): void {
    const r = this.resources;
    if (!r) return;
    for (const target of [r.scene, r.ao, r.aoDenoised, r.bloomA, r.bloomB, r.distortion]) target.dispose();
    r.gtao.dispose();
    for (const material of [r.occlusion, r.extract, r.blur, r.distort, r.composite]) material.dispose();
    r.geometry.dispose();
    r.screenScene.clear();
    this.resources = undefined;
  }
}
