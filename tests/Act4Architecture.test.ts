import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {act4Architecture} from '../src/render/Act4Architecture';
import {SHIP_ACT4_PLANS} from '../src/game/roguelike/shipArchitectureAct4';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import type {StoryTemplateId} from '../src/game/roguelike/storyRooms';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {disposeModel} from '../src/render/meshParts';

describe('Act4 function-bound architecture',()=>{
 it.each(Object.keys(SHIP_ACT4_PLANS))('%s keeps cutaways low and owns bounded merged resources',id=>{
  const t={...STORY_ROOM_TEMPLATES[id as StoryTemplateId],...SHIP_ACT4_PLANS[id].topology},model=act4Architecture(id,t)!;
  const meshes=model.children as T.Mesh<T.BufferGeometry,T.Material>[];expect(meshes.length).toBeGreaterThan(0);expect(meshes.length).toBeLessThanOrEqual(3);expect(model.userData.parts.filter((p:{name:string})=>p.name==='ingress-recess')).toHaveLength(4);
  const box=new T.Box3().setFromObject(model,true);expect(box.min.y).toBeGreaterThanOrEqual(0);expect(box.max.y).toBeLessThanOrEqual(.91);
  const materials=[...new Set(meshes.map(m=>m.material))],spies=[...meshes.map(m=>vi.spyOn(m.geometry,'dispose')),...materials.map(m=>vi.spyOn(m,'dispose'))];
  disposeModel(model);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);vi.restoreAllMocks();
 });
 it.each(['containment-annulus','overload-floor'])('%s renders solid hull housings exactly inside every live collider',id=>{
  const t={...STORY_ROOM_TEMPLATES[id as StoryTemplateId],...SHIP_ACT4_PLANS[id].topology},model=act4Architecture(id,t)!;model.updateMatrixWorld(true);
  const bodies=model.userData.parts.filter((p:{name:string})=>p.name==='grounded-hull-housing');expect(bodies).toHaveLength(t.obstacles.length);
  for(const [i,r]of t.obstacles.entries()){
   const body=bodies[i];expect(body.x-body.w/2).toBeCloseTo(r.x/32);expect(body.x+body.w/2).toBeCloseTo((r.x+r.width)/32);expect(body.z-body.d/2).toBeCloseTo(r.y/32);expect(body.z+body.d/2).toBeCloseTo((r.y+r.height)/32);
   const hit=new T.Raycaster(new T.Vector3(body.x+.12,2,body.z+.12),new T.Vector3(0,-1,0)).intersectObject(model,true)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeGreaterThan(.85);expect(hit.point.y).toBeLessThanOrEqual(.91);
  }
  const fixtures=model.userData.lightFixtures;expect(fixtures).toHaveLength(t.obstacles.length);for(const fixture of fixtures){expect(fixture.poolStyle).toBe(1);expect(fixture.poolWidth).toBeLessThanOrEqual(.35);expect(fixture.y).toBe(.72);}
  disposeModel(model);
 });
 it('binds infestation only to actual growth-wall seams',()=>{
  const id='swarm-junction',t={...STORY_ROOM_TEMPLATES[id],...SHIP_ACT4_PLANS[id].topology},g=createRoomTemplateGeometry(t,'swarm-seams'),model=act4Architecture(id,t)!;
  const growth=model.userData.parts.filter((p:{name:string})=>p.name==='seam-bound-growth'||p.name==='growth-clamp');expect(growth.length).toBeGreaterThan(10);
  for(const part of growth)expect(canOccupyExpedition(g,{x:part.x*32,y:part.z*32},0)).toBe(false);
  expect(model.userData.parts.filter((p:{name:string})=>p.name==='ingress-recess')).toHaveLength(4);disposeModel(model);
 });
 it('does not construct for legacy rooms',()=>{expect(act4Architecture('reactor-vault',STORY_ROOM_TEMPLATES['overload-floor'])).toBeNull();});
});
