import {describe,expect,it,vi} from 'vitest';
import {DepthTexture,UnsignedIntType,WebGLRenderer,WebGLRenderTarget} from 'three';
import {SoftParticleDepth} from './SoftParticleDepth';

function fixture(width=1920,height=1080){
 const scene=new WebGLRenderTarget(width,height);scene.depthTexture=new DepthTexture(width,height,UnsignedIntType);
 let current:WebGLRenderTarget|null=scene,read:object|null=null,draw:object|null=null;
 const handles=new WeakMap<WebGLRenderTarget,object>(),bindings:WebGLRenderTarget[]=[];
 const gl={
  DRAW_FRAMEBUFFER_BINDING:0x8ca6,READ_FRAMEBUFFER:0x8ca8,DEPTH_BUFFER_BIT:0x0100,NEAREST:0x2600,
  getParameter:vi.fn((name:number)=>{expect(name).toBe(0x8ca6);return draw;}),
  bindFramebuffer:vi.fn((target:number,handle:object|null)=>{expect(target).toBe(0x8ca8);read=handle;}),
  blitFramebuffer:vi.fn((...args:number[])=>{expect(read).toBe(handles.get(scene));expect(draw).not.toBe(read);expect(args.at(-2)).toBe(0x0100);expect(args.at(-1)).toBe(0x2600);}),
  drawBuffers:vi.fn(),
 };
 const renderer={
  getRenderTarget:()=>current,
  setRenderTarget:vi.fn((target:WebGLRenderTarget|null)=>{
   current=target;bindings.push(target!);if(target){if(!handles.has(target))handles.set(target,{});read=draw=handles.get(target)!;if(target.depthTexture){target.depthTexture.image.width=target.width;target.depthTexture.image.height=target.height;}}else read=draw=null;
  }),
  getContext:()=>gl,
 };
 renderer.setRenderTarget(scene);
 return{scene,renderer,gl,bindings,handles,depth:new SoftParticleDepth(renderer as unknown as WebGLRenderer)};
}

describe('half-resolution detached opaque depth for soft particles',()=>{
 it('does not allocate or query bindings for disabled, forward, HUD or out-of-submission callbacks',()=>{
  const {depth,gl}=fixture();expect(depth.capture()).toBeNull();depth.begin(null);expect(depth.capture()).toBeNull();
  expect(gl.getParameter).not.toHaveBeenCalled();expect(gl.blitFramebuffer).not.toHaveBeenCalled();expect(depth.diagnostics.allocated).toBe(false);depth.dispose();
 });

 it('prepares and warms the exact scaled NEAREST depth blit once, with separate warm receipts',()=>{
  const {depth,scene,renderer,gl}=fixture(1921,1081);
  depth.prepare(scene);expect(gl.getParameter).toHaveBeenCalledTimes(2);expect(gl.blitFramebuffer).toHaveBeenCalledExactlyOnceWith(0,0,1921,1081,0,0,961,541,0x0100,0x2600);
  expect(depth.diagnostics).toMatchObject({width:961,height:541,copies:0,warmupCopies:1});expect(renderer.getRenderTarget()).toBe(scene);
  depth.prepare(scene);expect(gl.getParameter).toHaveBeenCalledTimes(2);expect(gl.blitFramebuffer).toHaveBeenCalledOnce();depth.dispose();scene.dispose();
 });

 it('copies once for both demanded particle batches and performs no per-frame binding readbacks',()=>{
  const {depth,scene,renderer,gl}=fixture();depth.prepare(scene);gl.blitFramebuffer.mockClear();depth.begin(scene);
  const sampled=depth.capture();expect(sampled).not.toBe(scene.depthTexture);expect([sampled!.image.width,sampled!.image.height]).toEqual([960,540]);
  expect(depth.capture()).toBe(sampled);expect(gl.blitFramebuffer).toHaveBeenCalledOnce();expect(renderer.getRenderTarget()).toBe(scene);
  expect(gl.drawBuffers).toHaveBeenLastCalledWith([0x8ce0,0]);depth.end();expect(depth.capture()).toBeNull();
  for(let i=0;i<60;i++){depth.begin(scene);depth.capture();depth.end();}
  expect(gl.getParameter).toHaveBeenCalledTimes(2);expect(gl.blitFramebuffer).toHaveBeenCalledTimes(61);expect(depth.diagnostics.copies).toBe(61);depth.dispose();scene.dispose();
 });

 it('rebinds resized targets once without a duplicate combat warm blit, then retires context/tier resources',()=>{
  const {depth,scene,renderer,gl,bindings}=fixture();depth.prepare(scene);
  const first=bindings.find(target=>target!==scene)!,dispose=vi.spyOn(first,'dispose');
  scene.setSize(1441,811);renderer.setRenderTarget(scene);gl.blitFramebuffer.mockClear();depth.begin(scene);depth.capture();
  expect(gl.getParameter).toHaveBeenCalledTimes(4);expect(gl.blitFramebuffer).toHaveBeenCalledExactlyOnceWith(0,0,1441,811,0,0,721,406,0x0100,0x2600);
  expect(depth.diagnostics).toMatchObject({width:721,height:406,copies:1,warmupCopies:1});depth.invalidate();expect(dispose).toHaveBeenCalledTimes(2);expect(depth.capture()).toBeNull();
  depth.prepare(scene);expect(gl.getParameter).toHaveBeenCalledTimes(6);expect(depth.diagnostics.warmupCopies).toBe(2);depth.dispose();depth.dispose();scene.dispose();
 });

 it('restores the source framebuffer and transparent MRT policy after a failed scaled copy',()=>{
  const {depth,scene,renderer,gl}=fixture();depth.prepare(scene);gl.blitFramebuffer.mockImplementation(()=>{throw Error('scaled blit failed');});
  depth.begin(scene);expect(()=>depth.capture()).toThrow('scaled blit failed');expect(renderer.getRenderTarget()).toBe(scene);
  expect(gl.drawBuffers).toHaveBeenLastCalledWith([0x8ce0,0]);expect(depth.diagnostics.copies).toBe(0);depth.dispose();scene.dispose();
 });

 it('rejects multisample and missing framebuffer inputs without disguising them as soft-particle success',()=>{
  const {depth,scene,renderer,gl}=fixture();scene.samples=4;expect(()=>depth.prepare(scene)).toThrow('single-sample');expect(gl.blitFramebuffer).not.toHaveBeenCalled();
  scene.samples=0;gl.getParameter.mockReturnValue(null);expect(()=>depth.prepare(scene)).toThrow('framebuffer initialization');expect(renderer.getRenderTarget()).toBe(scene);expect(gl.blitFramebuffer).not.toHaveBeenCalled();depth.dispose();scene.dispose();
 });
});
