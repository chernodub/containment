import {
  DepthTexture, NearestFilter, RedFormat, UnsignedByteType,
  WebGLRenderer, WebGLRenderTarget,
} from 'three';

const PARTICLE_DRAW_BUFFERS = [0x8ce0, 0];

/** One half-resolution detached depth snapshot, without another opaque render. */
export class SoftParticleDepth {
  private target?: WebGLRenderTarget;
  private source: WebGLRenderTarget | null = null;
  private copied = false;
  private copies = 0;
  private warmupCopies = 0;
  private sourceOwner?:WebGLRenderTarget;
  private sourceDepth?:DepthTexture;
  private sourceWidth=0;
  private sourceHeight=0;
  private context?:WebGL2RenderingContext;
  private sourceFramebuffer:WebGLFramebuffer|null=null;
  private targetFramebuffer:WebGLFramebuffer|null=null;
  private warmed=false;
  get diagnostics(){return {allocated:!!this.target,width:this.target?.width??0,height:this.target?.height??0,copies:this.copies,warmupCopies:this.warmupCopies};}

  constructor(private readonly renderer: WebGLRenderer) {}

  /** Initialize real FBO bindings and warm the exact scaled blit inside the room hold. */
  prepare(source:WebGLRenderTarget,warm=true):void {
    if(!source.depthTexture)return;
    if(source.samples!==0)throw Error('Soft-particle depth requires a single-sample source');
    const gl=this.renderer.getContext() as WebGL2RenderingContext;
    const width=Math.max(1,Math.ceil(source.width/2)),height=Math.max(1,Math.ceil(source.height/2));
    const rebind=!this.target||this.sourceOwner!==source||this.sourceDepth!==source.depthTexture
      ||this.sourceWidth!==source.width||this.sourceHeight!==source.height||this.context!==gl;
    if(!rebind&&(!warm||this.warmed))return;
    const original=this.renderer.getRenderTarget();
    try{
      if(rebind){
        if(!this.target){
          this.target=new WebGLRenderTarget(width,height,{
            format:RedFormat,type:UnsignedByteType,minFilter:NearestFilter,magFilter:NearestFilter,
            depthBuffer:true,stencilBuffer:source.stencilBuffer,
          });
          this.target.texture.name='Containment soft-particle unused half-size R8 attachment';
          this.target.depthTexture=new DepthTexture(width,height,source.depthTexture.type);
          this.target.depthTexture.format=source.depthTexture.format;
          this.target.depthTexture.name='Containment detached half-resolution opaque depth';
        }
        this.target.setSize(width,height);
        // Public target binding initializes Three's actual framebuffer objects.
        // Read handles only at ownership/size/context changes, never each frame.
        this.renderer.setRenderTarget(source);
        const read=gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer|null;
        this.renderer.setRenderTarget(this.target);
        const draw=gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer|null;
        if(!read||!draw)throw Error('Soft-particle depth framebuffer initialization failed');
        this.sourceFramebuffer=read;this.targetFramebuffer=draw;
        this.sourceOwner=source;this.sourceDepth=source.depthTexture;
        this.sourceWidth=source.width;this.sourceHeight=source.height;this.context=gl;this.warmed=false;
      }
      if(warm&&!this.warmed){
        this.blit(source);this.warmupCopies++;this.warmed=true;
      }
    }finally{
      this.renderer.setRenderTarget(original);
      if(original===source)gl.drawBuffers(PARTICLE_DRAW_BUFFERS);
    }
  }

  /** The first demanded particle in this scene submission performs the sole fresh blit. */
  begin(source:WebGLRenderTarget|null):void {this.source=source;this.copied=false;}

  capture():DepthTexture|null {
    const source=this.source;
    if(!source?.depthTexture||this.renderer.getRenderTarget()!==source)return null;
    if(this.copied)return this.target!.depthTexture;
    try{
      // Adaptive resize may change FBOs in combat. Rebind once, then use the fresh
      // capture itself; do not add a redundant warm copy to this frame.
      this.prepare(source,false);this.blit(source);
      this.copied=true;this.copies++;return this.target!.depthTexture;
    }finally{
      this.renderer.setRenderTarget(source);
      (this.renderer.getContext() as WebGL2RenderingContext).drawBuffers(PARTICLE_DRAW_BUFFERS);
    }
  }

  private blit(source:WebGLRenderTarget):void {
    if(!this.target||!this.sourceFramebuffer||!this.targetFramebuffer||!this.context)throw Error('Soft-particle depth snapshot was not prepared');
    const gl=this.context;
    this.renderer.setRenderTarget(this.target);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER,this.sourceFramebuffer);
    gl.blitFramebuffer(0,0,source.width,source.height,0,0,this.target.width,this.target.height,gl.DEPTH_BUFFER_BIT,gl.NEAREST);
    // Three's next setRenderTarget(source) restores both read/draw bindings and
    // viewport/scissor state. Its transparent MRT policy is restored by caller.
  }

  /** End submission before post, HUD, reflections or another preparation draw. */
  end():void {this.source=null;}

  /** Tier/context changes unbind externally before retiring the owned snapshot. */
  invalidate():void {
    this.end();this.target?.dispose();this.target=undefined;this.copied=false;
    this.sourceOwner=undefined;this.sourceDepth=undefined;this.sourceWidth=this.sourceHeight=0;
    this.context=undefined;this.sourceFramebuffer=this.targetFramebuffer=null;this.warmed=false;
  }

  dispose():void {this.invalidate();}
}
