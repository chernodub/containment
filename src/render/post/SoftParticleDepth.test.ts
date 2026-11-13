import {describe,expect,it,vi} from 'vitest';
import {DepthTexture,UnsignedIntType,WebGLRenderer,WebGLRenderTarget} from 'three';
import {SoftParticleDepth} from './SoftParticleDepth';

function fixture(){
  const scene=new WebGLRenderTarget(1920,1080);
  scene.depthTexture=new DepthTexture(1920,1080,UnsignedIntType);
  let current:WebGLRenderTarget|null=scene;
  const drawBuffers=vi.fn(),initialized:WebGLRenderTarget[]=[];
  const renderer={
    getRenderTarget:()=>current,
    setRenderTarget:vi.fn((target:WebGLRenderTarget|null)=>{current=target;}),
    initRenderTarget:vi.fn((target:WebGLRenderTarget)=>{initialized.push(target);if(target.depthTexture){target.depthTexture.image.width=target.width;target.depthTexture.image.height=target.height;}current=null;}),
    copyTextureToTexture:vi.fn((source:DepthTexture,destination:DepthTexture)=>{
      expect(source).toBe(scene.depthTexture);expect(destination).not.toBe(source);
      expect(destination.image.width).toBe(scene.width);expect(destination.image.height).toBe(scene.height);
      current=null;
    }),
    getContext:()=>({drawBuffers}),
  };
  return{scene,renderer,drawBuffers,initialized,depth:new SoftParticleDepth(renderer as unknown as WebGLRenderer)};
}

describe('detached opaque depth for soft particles',()=>{
  it('does not allocate in forward, disabled, HUD or out-of-submission callbacks',()=>{
    const {depth,renderer}=fixture();expect(depth.capture()).toBeNull();depth.begin(null);expect(depth.capture()).toBeNull();
    expect(renderer.initRenderTarget).not.toHaveBeenCalled();depth.dispose();
  });

  it('copies once for both particle batches, restores the scene and preserves geometry output',()=>{
    const {depth,scene,renderer,drawBuffers}=fixture();depth.begin(scene);
    const sampled=depth.capture();expect(sampled).not.toBe(scene.depthTexture);expect(depth.capture()).toBe(sampled);
    expect(renderer.copyTextureToTexture).toHaveBeenCalledOnce();expect(renderer.getRenderTarget()).toBe(scene);
    expect(drawBuffers).toHaveBeenLastCalledWith([0x8ce0,0]);
    depth.end();expect(depth.capture()).toBeNull();depth.begin(scene);depth.capture();expect(renderer.copyTextureToTexture).toHaveBeenCalledTimes(2);
    depth.dispose();scene.dispose();
  });

  it('tracks native adaptive target dimensions and retires copies on context/tier changes',()=>{
    const {depth,scene,renderer,initialized}=fixture();depth.prepare(scene);const first=initialized[0],dispose=vi.spyOn(first,'dispose');
    renderer.setRenderTarget(scene);depth.begin(scene);expect(depth.capture()).toBe(first.depthTexture);
    scene.setSize(1440,810);renderer.setRenderTarget(scene);depth.begin(scene);expect(depth.capture()).toBe(first.depthTexture);
    expect([first.width,first.height]).toEqual([1440,810]);
    // Three updates DepthTexture dimensions while initializing the actual GPU target.
    expect(renderer.copyTextureToTexture).toHaveBeenCalledTimes(2);
    depth.invalidate();expect(dispose).toHaveBeenCalledTimes(2);expect(depth.capture()).toBeNull();
    depth.prepare(scene);expect(initialized.at(-1)).not.toBe(first);depth.dispose();depth.dispose();scene.dispose();
  });

  it('restores the framebuffer even when a failed depth copy aborts this draw',()=>{
    const {depth,scene,renderer,drawBuffers}=fixture();renderer.copyTextureToTexture.mockImplementation(()=>{throw Error('copy failed');});
    depth.begin(scene);expect(()=>depth.capture()).toThrow('copy failed');expect(renderer.getRenderTarget()).toBe(scene);
    expect(drawBuffers).toHaveBeenLastCalledWith([0x8ce0,0]);depth.dispose();scene.dispose();
  });
});
