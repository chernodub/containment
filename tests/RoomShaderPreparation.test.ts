import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {generateRun} from '../src/game/roguelike/run';

function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done;});return{promise,resolve};}
function fixture(){
 const images=deferred(),shaders=deferred();
 const probe:any=Object.assign(Object.create(DepthRenderer.prototype),{
  world:new T.Group(),disposed:false,graphicsGeneration:0,roomWarmPending:false,roomWarmWork:Promise.resolve(),
  surfaces:{ready:images.promise},renderer:{getContext:()=>({isContextLost:()=>false})},
  captureRoomReflections:vi.fn(),prepareScene:vi.fn(()=>shaders.promise),
 });
 return{probe,images,shaders};
}

it('blocks room input through asset readiness and shader preparation, then releases it',async()=>{
 const{probe,images,shaders}=fixture();probe.queueRoomWarmup();const work=probe.roomWarmWork;
 expect(probe.roomLoading).toBe(true);expect(probe.prepareScene).not.toHaveBeenCalled();images.resolve();
 await vi.waitFor(()=>expect(probe.prepareScene).toHaveBeenCalledOnce());expect(probe.roomLoading).toBe(true);
 shaders.resolve();await work;expect(probe.roomLoading).toBeFalsy();expect(probe.captureRoomReflections).toHaveBeenCalledOnce();
});

it('defers a room replacement until the previous GPU preparation releases its materials',async()=>{
 const{probe,images,shaders}=fixture(),node=generateRun(1729,3).nodes[1],original=DepthRenderer.prototype.loadRoom;
 const loaded=vi.fn();probe.loadRoom=(...args:any[])=>probe.roomWarmPending?original.apply(probe,args as [typeof node]):loaded(...args);
 probe.queueRoomWarmup();const work=probe.roomWarmWork,world=probe.world;images.resolve();
 await vi.waitFor(()=>expect(probe.prepareScene).toHaveBeenCalledOnce());probe.loadRoom(node);
 expect(probe.world).toBe(world);expect(loaded).not.toHaveBeenCalled();shaders.resolve();await work;
 expect(loaded).toHaveBeenCalledWith(node,expect.any(String));
});

it('stops polling old GPU programs when their graphics generation is replaced',async()=>{
 const isReady=vi.fn(()=>false),probe:any=Object.assign(Object.create(DepthRenderer.prototype),{
  graphicsGeneration:0,disposed:false,renderer:{getContext:()=>({isContextLost:()=>false}),compile:vi.fn(),info:{programs:[{isReady}]}},
 });
 const work=probe.compilePrepared(new T.Scene(),new T.PerspectiveCamera()).catch((error:unknown)=>error);
 probe.graphicsGeneration++;expect(typeof await work).toBe('symbol');expect(isReady).toHaveBeenCalledOnce();
});

it('does not reblock an already prepared room when an asset repeats a known shader topology',()=>{
 const owner=new T.Group(),probe:any=Object.assign(Object.create(DepthRenderer.prototype),{
  world:owner,materialWarmup:{register:vi.fn(()=>0)},contextResources:{track:vi.fn()},reflection:{invalidate:vi.fn()},queueRoomWarmup:vi.fn(),
 });
 probe.staticLoaded(owner)();expect(probe.queueRoomWarmup).not.toHaveBeenCalled();
 probe.materialWarmup.register.mockReturnValue(1);probe.staticLoaded(owner)();expect(probe.queueRoomWarmup).toHaveBeenCalledOnce();
});

it('resolves lazy uniform and attribute introspection before releasing combat input',async()=>{
 const getUniforms=vi.fn(),getAttributes=vi.fn(),probe:any=Object.assign(Object.create(DepthRenderer.prototype),{
  graphicsGeneration:0,disposed:false,renderer:{getContext:()=>({isContextLost:()=>false}),compile:vi.fn(),info:{programs:[{program:{},isReady:()=>true,getUniforms,getAttributes}]}},
 });
 await probe.compilePrepared(new T.Scene(),new T.PerspectiveCamera());
 expect(getUniforms).toHaveBeenCalledOnce();expect(getAttributes).toHaveBeenCalledOnce();
 await probe.compilePrepared(new T.Scene(),new T.PerspectiveCamera());
 expect(getUniforms).toHaveBeenCalledOnce();expect(getAttributes).toHaveBeenCalledOnce();
});

it('coalesces owner arrivals while the queued prepare is still awaiting assets',async()=>{
 const{probe,images,shaders}=fixture();probe.queueRoomWarmup();const work=probe.roomWarmWork;
 probe.queueRoomWarmup();probe.queueRoomWarmup();images.resolve();
 await vi.waitFor(()=>expect(probe.prepareScene).toHaveBeenCalledOnce());
 shaders.resolve();await work;
 expect(probe.prepareScene).toHaveBeenCalledOnce();expect(probe.roomWarmPending).toBe(false);
});

it('retains authored static transforms without composing their local matrices every frame',()=>{
 const world=new T.Group(),nested=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());
 nested.position.set(2,3,4);mesh.position.set(-1,.5,2);nested.add(mesh);world.add(nested);
 const probe:any=Object.assign(Object.create(DepthRenderer.prototype),{world});probe.freezeRoomTransforms();
 const expected=mesh.matrixWorld.clone(),updates=vi.spyOn(mesh,'updateMatrix');
 const scene=new T.Scene();scene.matrixAutoUpdate=false;scene.add(world);scene.updateMatrixWorld();scene.updateMatrixWorld();
 expect(updates).not.toHaveBeenCalled();expect(mesh.matrixWorld.elements).toEqual(expected.elements);
 mesh.geometry.dispose();(mesh.material as T.Material).dispose();
});

it('defers ability atlas requests on title, then holds first gameplay until decode and upload',async()=>{
 const {probe,images,shaders}=fixture(),atlasReady=deferred(),texture=new T.Texture();
 const prepare=vi.fn(()=>atlasReady.promise),initTexture=vi.fn();
 probe.interimAbilities={prepare,kit:{atlas:{loaded:false,texture}}};probe.renderer.initTexture=initTexture;
 probe.kitStartupComplete=false;await probe.prepareAbilityAssets();expect(prepare).not.toHaveBeenCalled();
 probe.kitStartupComplete=true;probe.queueRoomWarmup();images.resolve();
 await Promise.resolve();expect(prepare).toHaveBeenCalledOnce();expect(probe.prepareScene).not.toHaveBeenCalled();expect(probe.roomLoading).toBe(true);
 probe.interimAbilities.kit.atlas.loaded=true;atlasReady.resolve();
 await vi.waitFor(()=>expect(probe.prepareScene).toHaveBeenCalledOnce());expect(initTexture).toHaveBeenCalledWith(texture);
 expect(probe.roomLoading).toBe(true);shaders.resolve();await probe.roomWarmWork;expect(probe.roomLoading).toBeFalsy();texture.dispose();
});

it('does not upload a late ability decode into a replaced graphics context',async()=>{
 const {probe}=fixture(),ready=deferred(),texture=new T.Texture();probe.kitStartupComplete=true;
 probe.interimAbilities={prepare:()=>ready.promise,kit:{atlas:{loaded:true,texture}}};probe.renderer.initTexture=vi.fn();
 const work=probe.prepareAbilityAssets().catch((error:unknown)=>error);probe.graphicsGeneration++;ready.resolve();
 expect(typeof await work).toBe('symbol');expect(probe.renderer.initTexture).not.toHaveBeenCalled();texture.dispose();
});
