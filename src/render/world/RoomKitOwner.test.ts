import {beforeAll,describe,expect,it,vi} from 'vitest';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {attachRoomKits} from './RoomKitDressing';
const templates:T.Group[]=[];
beforeAll(async()=>{for(const p of ['kenney-space-station','kenney-furniture','kenney-nature','quaternius-scifi-essentials']){const b=await readFile('public/assets/kits/'+p+'/kit.glb');templates.push((await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'' )).scene);}});
function copy(root:T.Group){const clone=root.clone(true);clone.traverse(o=>{if(o instanceof T.Mesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}});return clone;}
function source(url:string){return copy(templates[url.includes('space-station')?0:url.includes('furniture')?1:url.includes('nature')?2:3]);}
describe('room kit preparation owner',()=>{
 it('does not start kit requests after disposal while its prerequisite is pending',async()=>{
  let release!:()=>void;
  const prerequisite=new Promise<void>(resolve=>{release=resolve;}),load=vi.fn(async(url:string)=>source(url));
  const error=vi.spyOn(console,'error').mockImplementation(()=>{});
  try{
   const owner=attachRoomKits(new T.Group(),ROOM_TEMPLATES['relay-racks'],'communications','relay-racks',vi.fn(),prerequisite,load);
   owner.dispose();await owner.ready;release();await Promise.resolve();await Promise.resolve();
   expect(load).not.toHaveBeenCalled();expect(owner.state).toBe('disposed');expect(owner.error).toBeUndefined();expect(error).not.toHaveBeenCalled();
  }finally{error.mockRestore();}
 });
 it('releases each completed or late borrow on cancellation even while a sibling stays pending, then restarts cleanly',async()=>{
  const world=new T.Group(),borrowed=source('space-station'),late=source('industrial');
  // Observe all actual owned materials rather than assuming a particular GLB hierarchy.
  const materials=new Set<T.Material>();
  for(const group of [borrowed,late])group.traverse(object=>{if(object instanceof T.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);});
  const disposed=[...materials].map(material=>vi.spyOn(material,'dispose'));
  let resolveLate!:(value:T.Group)=>void;
  const pending=new Promise<T.Group>(resolve=>{resolveLate=resolve;}),load=vi.fn((url:string)=>url.includes('space-station')?Promise.resolve(borrowed):pending);
  const error=vi.spyOn(console,'error').mockImplementation(()=>{}),changed=vi.fn();
  try{
   const owner=attachRoomKits(world,ROOM_TEMPLATES['relay-racks'],'communications','relay-racks',changed,Promise.resolve(),load);
   await vi.waitFor(()=>expect(load).toHaveBeenCalledTimes(2));
   owner.dispose();owner.dispose();await owner.ready;
   const firstCount=disposed.filter(spy=>spy.mock.calls.length===1).length;expect(firstCount).toBeGreaterThan(0);expect(firstCount).toBeLessThan(disposed.length);
   resolveLate(late);await vi.waitFor(()=>expect(disposed.every(spy=>spy.mock.calls.length===1)).toBe(true));
   expect(owner.state).toBe('disposed');expect(owner.error).toBeUndefined();expect(changed).not.toHaveBeenCalled();expect(world.children).toHaveLength(0);expect(error).not.toHaveBeenCalled();
   const next=attachRoomKits(world,ROOM_TEMPLATES['relay-racks'],'communications','relay-racks',changed,Promise.resolve(),async url=>source(url));
   await next.ready;expect(next.state).toBe('ready');expect(changed).toHaveBeenCalledOnce();next.dispose();expect(world.children).toHaveLength(0);
  }finally{error.mockRestore();}
 });
 it('ignores a late transfer rejection for a departed room but reports the same failure for a live room',async()=>{
  let reject!:(error:unknown)=>void;
  const pending=new Promise<T.Group>((_,fail)=>{reject=fail;}),load=vi.fn(()=>pending),changed=vi.fn();
  const error=vi.spyOn(console,'error').mockImplementation(()=>{}),failure=new TypeError('Failed to fetch');
  try{
   const cancelled=attachRoomKits(new T.Group(),ROOM_TEMPLATES['relay-racks'],'communications','relay-racks',changed,Promise.resolve(),load);
   await vi.waitFor(()=>expect(load).toHaveBeenCalledTimes(2));cancelled.dispose();await cancelled.ready;reject(failure);
   await Promise.resolve();await Promise.resolve();expect(cancelled.error).toBeUndefined();expect(error).not.toHaveBeenCalled();
   const live=attachRoomKits(new T.Group(),ROOM_TEMPLATES['relay-racks'],'communications','relay-racks',changed,Promise.resolve(),async()=>{throw failure;});
   await live.ready;expect(live.state).toBe('fallback');expect(live.error).toBe(failure);expect(error).toHaveBeenCalledExactlyOnceWith('CC0 room dressing failed',failure);expect(changed).not.toHaveBeenCalled();live.dispose();
  }finally{error.mockRestore();}
 });
 it('waits for existing ownership, publishes once, and restores the original on disposal',async()=>{
  const world=new T.Group(),original=new T.Group();original.name='residential-gallery-equipment';world.add(original);
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;}),load=vi.fn(async(url:string)=>source(url)),changed=vi.fn();
  const owner=attachRoomKits(world,ROOM_TEMPLATES['residential-gallery'],'habitation','residential-gallery',changed,gate,load);
  expect(load).not.toHaveBeenCalled();expect(owner.state).toBe('loading');release();await owner.ready;
  expect(changed).toHaveBeenCalledTimes(1);expect(owner.state).toBe('ready');expect(original.visible).toBe(false);expect(world.getObjectByName('e6-room-kits')).toBeDefined();owner.dispose();owner.dispose();expect(original.visible).toBe(true);expect(world.getObjectByName('e6-room-kits')).toBeUndefined();expect(owner.state).toBe('disposed');
 });
 it('settles cancellation immediately and retires late borrows without adding stale meshes',async()=>{
  const world=new T.Group(),waiting:{url:string;resolve:(root:T.Group)=>void}[]=[];
  const load=(url:string)=>new Promise<T.Group>(resolve=>waiting.push({url,resolve})),changed=vi.fn(),owner=attachRoomKits(world,ROOM_TEMPLATES['relay-racks'],'communications','relay-racks',changed,Promise.resolve(),load);
  await Promise.resolve();owner.dispose();await owner.ready;expect(owner.state).toBe('disposed');
  for(const pending of waiting)pending.resolve(source(pending.url));await Promise.resolve();await Promise.resolve();expect(changed).not.toHaveBeenCalled();expect(world.children).toHaveLength(0);
 });
 it('rolls back kit meshes and original visibility if material registration fails',async()=>{
  const world=new T.Group(),original=new T.Group();original.name='residential-gallery-equipment';world.add(original);
  const error=vi.spyOn(console,'error').mockImplementation(()=>{});
  try{const owner=attachRoomKits(world,ROOM_TEMPLATES['residential-gallery'],'habitation','residential-gallery',()=>{throw Error('test registration failure');},Promise.resolve(),async url=>source(url));await owner.ready;expect(owner.state).toBe('fallback');expect(error).toHaveBeenCalledTimes(1);expect(original.visible).toBe(true);expect(world.getObjectByName('e6-room-kits')).toBeUndefined();owner.dispose();expect(owner.state).toBe('disposed');}finally{error.mockRestore();}
 });
});
