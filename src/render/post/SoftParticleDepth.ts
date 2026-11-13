import {
  DepthTexture, NearestFilter, RedFormat, UnsignedByteType,
  WebGLRenderer, WebGLRenderTarget,
} from 'three';

const PARTICLE_DRAW_BUFFERS = [0x8ce0, 0];

/** One detached depth snapshot, copied after opaque draws without rendering them again. */
export class SoftParticleDepth {
  private target?: WebGLRenderTarget;
  private source: WebGLRenderTarget | null = null;
  private copied = false;
  private copies = 0;
  get diagnostics(){return {allocated:!!this.target,width:this.target?.width??0,height:this.target?.height??0,copies:this.copies};}

  constructor(private readonly renderer: WebGLRenderer) {}

  /** Allocate during the gameplay preparation hold, before particles can appear. */
  prepare(source: WebGLRenderTarget): void {
    if (!source.depthTexture) return;
    if (!this.target) {
      this.target = new WebGLRenderTarget(source.width, source.height, {
        format: RedFormat, type: UnsignedByteType,
        minFilter: NearestFilter, magFilter: NearestFilter,
        depthBuffer: true, stencilBuffer: false,
      });
      this.target.texture.name = 'Containment soft-particle unused R8 attachment';
      this.target.depthTexture = new DepthTexture(source.width, source.height, source.depthTexture.type);
      this.target.depthTexture.name = 'Containment detached opaque depth';
    }
    this.target.setSize(source.width, source.height);
    // Three requires a render-target-owned depth texture for its depth blit.
    // No color is drawn or copied into this one-byte companion attachment.
    this.renderer.initRenderTarget(this.target);
  }

  /** The first visible particle in this scene submission performs the sole depth blit. */
  begin(source: WebGLRenderTarget | null): void {
    this.source = source;
    this.copied = false;
  }

  capture(): DepthTexture | null {
    const source = this.source;
    if (!source?.depthTexture || this.renderer.getRenderTarget() !== source) return null;
    if (this.copied) return this.target!.depthTexture;
    try {
      this.prepare(source);
      this.renderer.copyTextureToTexture(source.depthTexture, this.target!.depthTexture!);
      this.copied = true;this.copies++;
      return this.target!.depthTexture;
    } finally {
      // The depth blit unbinds READ/DRAW framebuffers. Restore Three's target,
      // then the existing transparent color-only policy before its material hook.
      // Re-enabling the geometry attachment here would erase actor IDs whenever
      // the previous transparent draw already selected color-only output.
      this.renderer.setRenderTarget(source);
      (this.renderer.getContext() as WebGL2RenderingContext).drawBuffers(PARTICLE_DRAW_BUFFERS);
    }
  }

  /** End scene submission before any post, HUD, reflection or preparation draw. */
  end(): void { this.source = null; }

  /** Tier/context changes discard the old copy; its next allocation stays lazy. */
  invalidate(): void {
    this.end();
    this.target?.dispose();
    this.target = undefined;
    this.copied = false;
  }

  dispose(): void { this.invalidate(); }
}
