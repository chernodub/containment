import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {ROOM_STORY_ROUTE} from '../src/game/roguelike/storyRooms';
import {authoredRoom} from '../src/render/AuthoredRooms';
import {disposeModel} from '../src/render/meshParts';
import {createRoomTemplateGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {SHIP_ACT4_PLANS} from '../src/game/roguelike/shipArchitectureAct4';
import {shipSolidStatistics} from '../src/game/roguelike/shipPlanChecks';
const t={...STORY_ROOM_TEMPLATES['containment-annulus'],...SHIP_ACT4_PLANS['containment-annulus'].topology};
const geometry=()=>createRoomTemplateGeometry(t,'annulus-owned-builder');
it('keeps the original sealed core shape and attaches service housings to the live hull',()=>{
 expect(t.voids![0].map(q=>({x:q.x-200,y:q.y-80}))).toEqual([{x:420,y:240},{x:780,y:240},{x:840,y:300},{x:840,y:580},{x:780,y:640},{x:420,y:640},{x:360,y:580},{x:360,y:300}]);
 const stats=shipSolidStatistics(t);expect(stats.connectedFraction).toBeGreaterThanOrEqual(.6);expect(stats.freeGroups).toBe(1);
 expect(t.obstacles).toHaveLength(2);for(const r of t.obstacles)expect(r.y===0||r.y+r.height===t.height).toBe(true);
});
it('keeps both complete ring directions and entry/exit open at player and enemy clearance',()=>{
 const g=geometry(),ring=[[350,520],[350,230],[1160,230],[1160,810],[350,810],[350,520]].map(([x,y])=>({x,y}));
 for(const r of [16,28,30,38]){
  for(const path of [ring,[...ring].reverse(),[t.spawn,ring[0]],[{x:1160,y:520},t.exit]])for(let i=1;i<path.length;i++)expect(canTraverseExpedition(g,path[i-1],path[i],r)).toBe(true);
  for(const p of [...t.breaches,{x:800,y:230},{x:800,y:810},{x:1160,y:350},{x:1160,y:650}])expect(canOccupyExpedition(g,p,r)).toBe(true);
  expect(canOccupyExpedition(g,{x:800,y:520},r)).toBe(false);
 }
 expect(hasClearExpeditionShot(g,{x:350,y:520},{x:1160,y:520})).toBe(false);
});
it('places bounded room assemblies and preserves owned resource disposal',()=>{
 const model=authoredRoom(t.id,t);expect(model).not.toBeNull();if(!model)return;
 expect(model.userData.stage).toBe('model-iteration');
 expect(model.userData.assemblies).toEqual(['sealed-core','segmented-jacket','radial-feet','inspection-plugs','passenger-vitals','authorization-state']);
 const bounds=new T.Box3().setFromObject(model,true);expect(bounds.min.x).toBeGreaterThanOrEqual(0-1e-5);expect(bounds.max.x).toBeLessThanOrEqual(t.width/32+1e-5);expect(bounds.max.y).toBeLessThanOrEqual(1.7);
 const meshes:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});expect(meshes.length).toBeLessThanOrEqual(11);
 const materials=[...new Set(meshes.map(m=>m.material as T.Material))];const gs=meshes.map(m=>vi.spyOn(m.geometry,'dispose')),ms=materials.map(m=>vi.spyOn(m,'dispose'));
 disposeModel(model);for(const spy of [...gs,...ms])expect(spy).toHaveBeenCalledTimes(1);vi.restoreAllMocks();
});
it('retires document-present sign textures with their owned materials',()=>{
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})});
 try{
  const model=authoredRoom(t.id,t)!;const textures=new Set<T.Texture>();
  model.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshBasicMaterial;if(m.map)textures.add(m.map);}});
  expect(textures.size).toBe(2);
  for(const sign of model.userData.localSigns){const hit=surface(model,sign.x,sign.z);expect((hit.object as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>).material.map).toBeInstanceOf(T.Texture);expect(hit.point.y*32).toBeCloseTo(sign.h,3);}
  const spies=[...textures].map(texture=>vi.spyOn(texture,'dispose'));
  disposeModel(model);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 }finally{vi.unstubAllGlobals();vi.restoreAllMocks();}
});
// CPU raycasts check actual surfaces without a renderer or GPU job.
function surface(model:T.Object3D,x:number,z:number){
 model.updateMatrixWorld(true);
 return new T.Raycaster(new T.Vector3(x/32,5,z/32),new T.Vector3(0,-1,0)).intersectObject(model,true)[0];
}
it('builds a continuous contrasting circulation finish with flush service seams',()=>{
 const model=authoredRoom(t.id,t)!;
 for(const [x,z] of [[800,230],[800,810],[500,520],[1100,520],[590,245],[1010,795]]){
  const hit=surface(model,x,z);expect(hit).toBeDefined();
  expect((hit.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toBe('annulus-circulation');
  expect(hit.point.y*32).toBeGreaterThan(0);expect(hit.point.y*32).toBeLessThanOrEqual(1);
 }
 disposeModel(model);
});
// The live walkability query replaces the superseded rectangular core mask.
it.each([[32,352],[368,704],[720,1056],[1072,1408]])('keeps every actual walking surface flush from x%s to x%s',(first,last)=>{
 const model=authoredRoom(t.id,t)!,g=geometry();
 for(let x=first;x<=last;x+=20)for(let z=32;z<t.height;z+=20){
  if(canOccupyExpedition(g,{x,y:z},16))expect(surface(model,x,z)?.point.y! *32,`${x},${z}`).toBeLessThanOrEqual(1.01);
 }
 disposeModel(model);
});
// E7 contracts the raised decorative assembly while the collision/deck stay fixed.
function decorativeSurface(model:T.Object3D,x:number,z:number){
 const scale=model.userData.decorativeCoreScale as number;expect(scale).toBe(.78);
 const center=model.userData.coreCenter;
 return surface(model,center.x+(x-600)*scale,center.y+(z-440)*scale);
}
it('closes the shield roof with broad ceramic panels and keeps the front jacket low',()=>{
 const model=authoredRoom(t.id,t)!;
 for(let i=0;i<16;i++){
  const a=(i+.5)*Math.PI/8,hit=decorativeSurface(model,600+Math.cos(a)*105,440+Math.sin(a)*97);
  expect((hit.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toMatch(/^annulus-ceramic/);
  expect(hit.point.y*32).toBeGreaterThanOrEqual(30);
 }
 const front=decorativeSurface(model,600,605),back=decorativeSurface(model,600,275);
 expect(front.point.y*32).toBeLessThanOrEqual(42);expect(back.point.y).toBeGreaterThan(front.point.y);
 const ceramic:T.MeshStandardMaterial[]=[];
 model.traverse(o=>{if(o instanceof T.Mesh&&o.material.name.startsWith('annulus-ceramic'))ceramic.push(o.material);});
 expect(new Set(ceramic).size).toBe(2);for(const m of ceramic){expect(m.metalness).toBeLessThan(.1);expect(m.roughness).toBeGreaterThan(.8);expect(m.emissive.getHex()).toBe(0);}
 disposeModel(model);
});
it('raises load-bearing shoes above the solid plinth and recesses displays inside guards',()=>{
 const model=authoredRoom(t.id,t)!;
 // West foot is clear of the status rail. Shoes must not be buried in the plinth.
 const shoe=decorativeSurface(model,376,440);
 expect(shoe.point.y*32).toBeGreaterThanOrEqual(17);
 expect((shoe.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toBe('annulus-bands');
 const web=decorativeSurface(model,400,432);
 expect(web.point.y*32).toBeGreaterThan(23);
 const screen=decorativeSurface(model,810,350),guard=decorativeSurface(model,833,350);
 expect(guard.point.y*32-screen.point.y*32).toBeGreaterThanOrEqual(6);
 expect((guard.object as T.Mesh<T.BufferGeometry,T.Material>).material.name).toBe('annulus-bands');
 // A recessed service throat and its flanged collar are separate solid levels.
 expect(decorativeSurface(model,600,634).point.y*32).toBeGreaterThan(decorativeSurface(model,600,622).point.y*32);
 disposeModel(model);
});
it.each([[330,460],[465,595],[600,730],[735,870]])('keeps raised construction inside the exact canonical solid footprint from x%s to x%s',(first,last)=>{
 const model=authoredRoom(t.id,t)!;
 const g=geometry();
 for(let x=first+200;x<=last+200;x+=5)for(let z=295;z<=745;z+=5){
  if(canOccupyExpedition(g,{x,y:z},0))expect(surface(model,x,z).point.y*32,`${x},${z}`).toBeLessThanOrEqual(1.01);
 }
 disposeModel(model);
});
it('retains the living-passenger and unarmed story',()=>{
 const story=ROOM_STORY_ROUTE.find(r=>r.templateId===t.id)!;
 expect(story.objective).toContain('Overload is NOT armed.');expect(story.story).toBe('PASSENGERS ALIVE. Manual authorization still required.');
});
