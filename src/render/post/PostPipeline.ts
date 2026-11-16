import { lowAntialiasFragment } from './LowAntialias';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { AdaptiveResolution } from './AdaptiveResolution';
import { GpuFrameTimer } from './GpuProfiler';
import { INK_STRENGTHS } from './Ink';
import { installGeometryClearPolicy } from './GeometryBuffer';
import { setGraphicStrength, type GraphicStrength, setGraphicShadingEnabled } from '../lighting/GraphicSurface';
import {
  ACESFilmicToneMapping, AgXToneMapping, BufferGeometry, Camera, Color, DepthTexture,
  Float32BufferAttribute, HalfFloatType, LinearFilter, NearestFilter, Matrix4, Mesh, NoBlending,
  NoToneMapping, OrthographicCamera, Scene, ShaderMaterial, SRGBColorSpace, RGBFormat, RedFormat, UnsignedInt101111Type, UnsignedIntType, UnsignedByteType, UniformsUtils,
  Vector2, Vector3, Vector4, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { setRenderDiagnostics, type GraphicsTier } from '../FrameBudget';
import { GRAPHICS_PRESETS, type GraphicsOptions } from '../graphicsOptions';
import { DistortionField, distortionFragment } from './DistortionField';
import { DepthGTAO } from './DepthGTAO';
import { SoftParticleDepth } from './SoftParticleDepth';
import {
  bloomBlurFragment, bloomExtractFragment, compositeFragment, occlusionFragment, screenVertex,
} from './shaders';
import { DEFAULT_POST_MOOD, type PostMood } from './types';

export type { PostMood } from './types';
export type AmbientOcclusionAlgorithm = 'contact' | 'gtao';

type PostResources = {
  scene: WebGLRenderTarget;
  present: WebGLRenderTarget;
  antialias: ShaderMaterial;
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
  private readonly releaseGeometryClear:()=>void;
  readonly distortion = new DistortionField();
  readonly adaptive = new AdaptiveResolution();
  gpuTimer?: GpuFrameTimer;
  get diagnostics() { return { adaptiveScale:this.adaptive.scale, adaptive:this.adaptive.snapshot, gpu:this.gpuTimer?.snapshot, softParticles:this.softDepth.diagnostics }; }
  /** Borrowed current scene depth for the native-resolution occlusion silhouette. */
  get sceneDepthTexture(): DepthTexture | null { return this.resources?.scene.depthTexture ?? null; }
  private styleStrength:GraphicStrength='bold';
  /** Debug art review strengths share the shipping shader programs. */
  setStyleStrength(value:GraphicStrength):void {
    this.styleStrength=value;setGraphicStrength(value);
    if(this.resources){this.resources.composite.uniforms.inkStyle.value.fromArray(INK_STRENGTHS[value]);this.resources.composite.uniforms.inkStrength.value=value==='bold'?1:value==='medium'?.5:0;}
  }
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
  private readonly abilityPresentation = new Vector3();
  private readonly softDepth: SoftParticleDepth;
  private softParticleBinding?: {enabled:()=>boolean;receive:(depth:DepthTexture|null)=>void;release:()=>void};

  /** V3's bounded presentation inputs reuse the prepared composite; Low keeps its forward path. */
  setAbilityPresentation(exposure: number, warm: number, cool: number): void {
    this.abilityPresentation.set(exposure, warm, cool).clampScalar(0, 1);
  }

  constructor(
    private readonly renderer: WebGLRenderer,
    private readonly scene: Scene,
    private camera: Camera,
  ) { this.softDepth=new SoftParticleDepth(renderer);this.releaseGeometryClear=installGeometryClearPolicy(renderer);setRenderDiagnostics(()=>this.diagnostics);this.distortion.setEnabled(false); if(renderer.getContext)this.gpuTimer=new GpuFrameTimer(renderer.getContext() as WebGL2RenderingContext); }

  /** Borrowed flame/smoke meshes keep their existing preparation/atlas hooks. */
  bindSoftParticles(meshes:readonly Mesh[], receive:(depth:DepthTexture|null)=>void, enabled:()=>boolean, needsDepth:(mesh:Mesh)=>boolean=()=>true):void {
    this.softParticleBinding?.release();
    const hooks=meshes.map(mesh=>{
      const previous=mesh.onBeforeRender;
      const hook:Mesh['onBeforeRender']=function(this:Mesh,renderer,scene,camera,geometry,material,group){previous.call(this,renderer,scene,camera,geometry,material,group);receive(enabled()&&needsDepth(this)?owner.softDepth.capture():null);};
      const owner=this;mesh.onBeforeRender=hook;
      return ()=>{if(mesh.onBeforeRender===hook)mesh.onBeforeRender=previous;};
    });
    this.softParticleBinding={receive,enabled,release:()=>{receive(null);for(const release of hooks)release();}};
  }

  /** Target allocation stays lazy until render/prepare after selecting High. */
  setOptions(options: GraphicsOptions, tier: GraphicsTier): void {
    if (this.disposed) return;
    const previousScale=this.adaptive.scale;
    let resized = this.options.resolutionScale !== options.resolutionScale;
    if(this.tier!==tier)this.releaseResources();
    this.options = { ...options };
    this.tier = tier;
    this.adaptive.setEnabled(tier==='high'&&options.adaptiveResolution);
    resized ||= previousScale!==this.adaptive.scale;
    this.gpuTimer?.setEnabled(tier==='high'&&options.adaptiveResolution);
    setGraphicShadingEnabled(options.stylizedShading);
    this.distortion.setEnabled(tier === 'high' && options.distortion);
    if (tier === 'low' && options.inkOutlines === 'off') this.releaseResources();
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
    this.ensureGpuTimer();
    this.gpuTimer?.poll();
    if(dt>0) { const previous=this.adaptive.scale;this.adaptive.update(dt*1000,this.gpuTimer?.latestMs);if(previous!==this.adaptive.scale)this.resizeResources(); }
    this.gpuTimer?.beginFrame();
    try { this.renderTo(dt, target, false); } finally { this.gpuTimer?.endFrame(); }
  }

  /** Compiles every post shader and draws a complete offscreen warm frame. */
  async prepare(compile:(scene:Scene,camera:Camera)=>Promise<unknown>=(scene,camera)=>this.renderer.compileAsync(scene,camera)): Promise<void> {
    if (this.disposed) return;
    if (this.disposed || (this.tier === 'low' && this.options.inkOutlines === 'off')) { await compile(this.scene,this.camera);return; }
    const resources = this.ensureResources();
    const originalTarget = this.renderer.getRenderTarget();
    const originalMapping = this.renderer.toneMapping;
    const warmTarget = this.target(1, 1);
    try {
      this.renderer.setRenderTarget(resources.scene);this.renderer.toneMapping=NoToneMapping;
      if(this.tier==='high'&&this.softParticleBinding?.enabled()){this.softDepth.prepare(resources.scene);this.renderer.setRenderTarget(resources.scene);}
      await compile(this.scene,this.camera);
      if(this.disposed||this.resources!==resources)return;
      // Compile the actual screen color-space variants before the offscreen draw.
      this.renderer.setRenderTarget(null);
      this.renderer.toneMapping = NoToneMapping;
      const materials=this.tier==='low'?[resources.composite,resources.antialias]:[resources.occlusion,resources.gtao.material,resources.gtao.denoiseMaterial,resources.extract,resources.blur,resources.distort,resources.composite,resources.antialias];
      for (const material of materials) {
        if (this.disposed || this.resources !== resources) return;
        this.renderer.setRenderTarget(material===resources.composite?resources.present:null);
        resources.triangle.material = material;
        await compile(resources.screenScene, resources.screenCamera);
      }
      if (!this.disposed) this.renderTo(0, warmTarget, true);
    } finally {
      warmTarget.dispose();
      this.renderer.toneMapping = originalMapping;
      this.renderer.setRenderTarget(originalTarget);
    }
  }

  /** Recreate offscreen attachments after a WebGL context replacement. */
  invalidate(): void { this.releaseResources(); this.distortion.clear(); this.gpuTimer?.dispose();this.gpuTimer=undefined;this.adaptive.reset(); }

  /** Releases all GPU resources; safe to repeat during context recovery. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.softParticleBinding?.release();this.softParticleBinding=undefined;
    this.releaseGeometryClear();
    setRenderDiagnostics(undefined);
    this.releaseResources();
    this.distortion.dispose();
    this.gpuTimer?.dispose();
  }

  private ensureGpuTimer():void {
    if(this.gpuTimer||!this.renderer.getContext)return;
    const gl=this.renderer.getContext() as WebGL2RenderingContext;
    if(gl.isContextLost())return;
    this.gpuTimer=new GpuFrameTimer(gl);this.gpuTimer.setEnabled(this.tier==='high'&&this.options.adaptiveResolution);
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
      if (this.tier === 'low' && this.options.inkOutlines === 'off') {
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
      this.softParticleBinding?.receive(null);
      this.softDepth.begin(this.tier==='high'&&this.softParticleBinding?.enabled()?r.scene:null);
      try{renderer.render(this.scene, this.camera);}finally{this.softDepth.end();}
      r.occlusion.uniforms.projectionInverse.value.copy(this.camera.projectionMatrixInverse);
      r.occlusion.uniforms.projection.value.copy(this.camera.projectionMatrix);
      if (this.tier==='high'&&(this.options.ambientOcclusion || warm)) {
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
      if (this.tier==='high'&&(this.options.bloom || warm)) {
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
      if (this.tier==='high'&&(hasDistortion || warm)) this.draw(r.distort, r.distortion);
      const u = r.composite.uniforms;
      u.tAO.value = this.occlusionAlgorithm === 'gtao' ? r.aoDenoised.texture : r.ao.texture;
      u.projectionInverse.value.copy(this.camera.projectionMatrixInverse);
      u.cameraWorld.value.copy(this.camera.matrixWorld);
      u.time.value = this.time;
      u.inkMode.value=this.options.inkOutlines==='off'?0:this.options.inkOutlines==='silhouette'?1:2;
      u.aoEnabled.value = this.tier==='high'&&this.options.ambientOcclusion ? 1 : 0;
      u.bloomEnabled.value = this.tier==='high'&&this.options.bloom ? 1 : 0;
      u.distortionEnabled.value = hasDistortion ? 1 : 0;
      u.lensEnabled.value = this.tier==='high'&&this.options.lensEffects ? 1 : 0;
      u.focusDistance.value = this.focusDistance;
      u.menuPresentation.value = this.menuPresentation ? 1 : 0;
      u.atmosphereEnabled.value = this.tier==='high'&&this.options.atmosphere ? 1 : 0;
      u.useAgX.value = this.agx ? 1 : 0;
      this.draw(r.composite, r.present);
      this.draw(r.antialias, output);
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
    const present=this.target(1,1);present.texture.type=UnsignedByteType;present.texture.colorSpace=SRGBColorSpace;present.texture.name='Containment graded ink';
    const antialias=this.material(this.tier==='low'?lowAntialiasFragment:FXAAShader.fragmentShader.replace('gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );','gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );\n#include <colorspace_fragment>'),UniformsUtils.clone(FXAAShader.uniforms));
    antialias.name=this.tier==='low'?'Containment final compact AA':'Containment final FXAA';antialias.uniforms.tDiffuse.value=present.texture;
    const ao = this.target(1, 1);
    // F11: only red is consumed after denoise; retain identical half-float precision.
    const aoDenoised = this.target(1, 1);aoDenoised.texture.format=RedFormat;
    const gtao = new DepthGTAO(scene.depthTexture!, this.camera, ao.texture, scene.textures[1]);
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
      tGeometry:{value:scene.textures[1]},inkPixel:{value:new Vector2()},inkMode:{value:0},inkStrength:{value:this.styleStrength==='bold'?1:this.styleStrength==='medium'?.5:0},inkStyle:{value:new Vector4().fromArray(INK_STRENGTHS[this.styleStrength])},
      tScene: { value: scene.texture }, tDepth: { value: scene.depthTexture },
      tAO: { value: ao.texture }, tBloom: { value: bloomA.texture }, tDistortion: { value: distortion.texture },
      projectionInverse: { value: new Matrix4() }, cameraWorld: { value: new Matrix4() },
      invSize: { value: new Vector2() }, time: { value: 0 },
      aoEnabled: { value: 0 }, bloomEnabled: { value: 0 }, distortionEnabled: { value: 0 },
      lensEnabled: { value: 0 }, atmosphereEnabled: { value: 0 }, useAgX: { value: 0 },
      focusDistance: { value: 26 }, menuPresentation: { value: 0 },
      toneMappingExposure: { value: 1 }, saturation: { value: 1 }, contrast: { value: 1 },
      abilityPresentation: { value: this.abilityPresentation },
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
      scene, present, antialias, ao, aoDenoised, gtao, bloomA, bloomB, distortion, occlusion, extract, blur, distort, composite,
      geometry, triangle, screenScene, screenCamera: new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    };
    this.applyMood(composite);
    this.resizeResources();
    return this.resources;
  }

  private target(width: number, height: number, depth = false): WebGLRenderTarget {
    const target = new WebGLRenderTarget(width, height, {
      type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter,
      depthBuffer: depth, stencilBuffer: false, count: depth ? 2 : 1,
    });
    target.texture.name = depth ? 'Containment HDR scene' : 'Containment post';
    // Scene alpha is never sampled; RGB11/11/10 preserves positive HDR while
    // halving main color storage/bandwidth. AO remains full RGBA16F.
    if (depth) { target.texture.type=UnsignedInt101111Type;target.texture.format=RGBFormat;target.textures[1].name = 'Containment geometry normal + identity'; target.textures[1].type=UnsignedByteType; target.textures[1].minFilter = target.textures[1].magFilter = NearestFilter; }
    if (depth) {
      target.depthTexture = new DepthTexture(width, height, UnsignedIntType);
      target.samples = 0; // Post AA avoids HDR multisample color/depth resolves.
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
    const scale = Math.max(0.5, Math.min(1, this.options.resolutionScale*this.adaptive.scale));
    const width = Math.max(1, Math.round(this.width * this.pixelRatio * scale));
    const height = Math.max(1, Math.round(this.height * this.pixelRatio * scale));
    r.scene.setSize(width, height);
    r.present.setSize(width,height);r.antialias.uniforms.resolution.value.set(1/width,1/height);
    r.ao.setSize(this.tier==='low'?1:Math.max(1, Math.ceil(width / 2)),this.tier==='low'?1:Math.max(1, Math.ceil(height / 2)));
    r.aoDenoised.setSize(r.ao.width, r.ao.height);
    r.gtao.setSize(r.ao.width, r.ao.height);
    const quarterWidth = this.tier==='low'?1:Math.max(1, Math.ceil(width / 4));
    const quarterHeight = this.tier==='low'?1:Math.max(1, Math.ceil(height / 4));
    r.bloomA.setSize(quarterWidth, quarterHeight);
    r.bloomB.setSize(quarterWidth, quarterHeight);
    r.distortion.setSize(quarterWidth, quarterHeight);
    r.occlusion.uniforms.invSize.value.set(1 / width, 1 / height);
    r.composite.uniforms.invSize.value.set(1 / width, 1 / height);
    r.composite.uniforms.inkPixel.value.set(1/(this.width*this.pixelRatio),1/(this.height*this.pixelRatio));
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
    this.softParticleBinding?.receive(null);this.softDepth.invalidate();
    const r = this.resources;
    if (!r) return;
    for (const target of [r.scene, r.present, r.ao, r.aoDenoised, r.bloomA, r.bloomB, r.distortion]) target.dispose();
    r.gtao.dispose();
    for (const material of [r.occlusion, r.extract, r.blur, r.distort, r.composite, r.antialias]) material.dispose();
    r.geometry.dispose();
    r.screenScene.clear();
    this.resources = undefined;
  }
}
