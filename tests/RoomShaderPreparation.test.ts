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
