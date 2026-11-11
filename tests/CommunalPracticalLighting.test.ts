import {expect,it} from 'vitest';
import * as T from 'three';
import {communalAtrium} from '../src/render/CommunalAtrium';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {COMMUNAL_ATRIUM_BLOCKOUT} from '../src/game/roguelike/authoredRoomTopologies';
import {disposeModel} from '../src/render/meshParts';

it('mounts atrium task lamps within existing solid furniture footprints and reuses the welcome finish',()=>{
 const room=communalAtrium(ROOM_TEMPLATES['communal-atrium']);
 const fixtures=room.userData.lightFixtures as {x:number;y:number;z:number;color:number;nativeColor:boolean}[];
 expect(fixtures).toHaveLength(4);
 for(const light of fixtures){
  expect(COMMUNAL_ATRIUM_BLOCKOUT.some(f=>light.x*32>=f.x&&light.x*32<=f.x+f.w&&light.z*32>=f.y&&light.z*32<=f.y+f.h)).toBe(true);
  expect(light.y).toBeGreaterThan(2);expect(light.nativeColor).toBe(true);
  const color=new T.Color(light.color);expect(color.r).toBeGreaterThan(color.b);
 }
 const materials=new Set<T.Material>();room.traverse(o=>{if(o instanceof T.Mesh)materials.add(o.material as T.Material);});
 expect(materials.size).toBe(8);
 expect([...materials].filter(m=>m.userData.motivatedEmitter).map(m=>m.name)).toEqual(['ca_welcome']);
 disposeModel(room);
});
