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
