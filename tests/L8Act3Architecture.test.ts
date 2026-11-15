import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {SHIP_ACT3_PLANS} from '../src/game/roguelike/shipArchitectureAct3';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import type {RoomTemplate} from '../src/game/roguelike/types';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors} from '../src/game/roguelike/shipPlanChecks';
import {act3ShipPresentation} from '../src/render/world/Act3ShipPresentation';
import {serviceShaftLanding} from '../src/render/ServiceShaftLanding';
import {safetyInterlockArchitecture} from '../src/render/SafetyInterlockArchitecture';
import {clearPolygonTopology} from '../src/game/world/polygonGeometry';
import {disposeModel} from '../src/render/meshParts';
const plans=Object.entries(SHIP_ACT3_PLANS).map(([id,p])=>({id,plan:p!,template:{...ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],...p!.topology} as RoomTemplate}));
describe('L8 Act3 prospective architecture',()=>{
 for(const {id,plan,template:t}of plans){
  const g=createRoomTemplateGeometry(t,'l8-act3-'+id);
  it(id+' has real connected machinery, a crowd floor and two physical routes',()=>{
   const s=shipSolidStatistics(t);expect(s.connectedFraction).toBeGreaterThanOrEqual(.6);expect(s.freeGroups).toBeLessThanOrEqual(2);
   expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);
  });
  it(id+' owns explicit mounted linear lights and bounded presentation batches',()=>{
   const root=act3ShipPresentation(id,t)!;root.updateMatrixWorld(true);
   expect(root.userData.lightFixtures.length).toBeGreaterThanOrEqual(2);expect(root.userData.lightFixtures.length).toBeLessThanOrEqual(4);
   for(const f of root.userData.lightFixtures){
    expect(f.poolStyle).toBe(1);expect(f.nativeColor).toBe(true);expect(f.poolWidth).toBeGreaterThan(0);expect(f.poolWidth).toBeLessThanOrEqual(.45);expect(f.poolDepth).toBeLessThanOrEqual(7.2);
    expect(canOccupyExpedition(g,{x:f.x*32,y:f.z*32},16),'fixture must be mounted beyond actor center clearance').toBe(false);
   }
   const custom=root.children.filter(o=>o instanceof T.Mesh);expect(custom.length).toBeLessThanOrEqual(6);
   const spies=custom.map(o=>vi.spyOn((o as T.Mesh).geometry,'dispose'));
   const materials=new Set(custom.map(o=>(o as T.Mesh).material as T.Material));const materialSpies=[...materials].map(m=>vi.spyOn(m,'dispose'));
   for(const mesh of custom as T.Mesh[]){const p=mesh.geometry.getAttribute('position');expect(Array.from(p.array).every(Number.isFinite)).toBe(true);}
   disposeModel(root);for(const spy of [...spies,...materialSpies])expect(spy).toHaveBeenCalledTimes(1);vi.restoreAllMocks();
  });
 }
 it('fits safety service channels to real booths, retaining all three independent terminations',()=>{
  const t=plans.find(p=>p.id==='safety-interlock-station')!.template,root=new T.Group();safetyInterlockArchitecture(root,t.width/32,t.height/32,t);root.updateMatrixWorld(true);
  for(const name of ['service-route-recorder-load','service-route-ai-rear','service-route-battery-return'])expect(root.getObjectByName(name)).toBeDefined();
  const deck=root.getObjectByName('room12-service-deck')!;let vertices=0;
  deck.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){
   const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);vertices++;expect(v.y).toBeLessThanOrEqual(.024);
   expect(clearPolygonTopology(t,{x:v.x*32,y:v.z*32},{x:v.x*32,y:v.z*32})).toBe(true);
  }}});expect(vertices).toBeGreaterThan(100);disposeModel(root);
 });
 it('retains the exact C core while all real outer-shell ribs and finishes follow the new hull',()=>{
  const t=plans.find(p=>p.id==='service-shaft-landing')!.template,g=createRoomTemplateGeometry(t,'l8-shaft'),root=serviceShaftLanding(t);root.updateMatrixWorld(true);
  expect(t.voids).toEqual([[{x:340,y:240},{x:900,y:240},{x:900,y:540},{x:1200,y:540},{x:1200,y:640},{x:340,y:640}]]);
  for(const name of ['deck-finish','wall-ribs','outer-shell'])root.getObjectByName(name)!.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){
   const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(name==='deck-finish'){expect(v.y*32).toBeLessThanOrEqual(.5);expect(canOccupyExpedition(g,{x:v.x*32,y:v.z*32},0)).toBe(true);}else expect(canOccupyExpedition(g,{x:v.x*32,y:v.z*32},0)).toBe(false);
  }}});disposeModel(root);
 });
 it('keeps source workshop mechanics whole and lowers only the two foreground solids',()=>{
  const t=plans.find(p=>p.id==='infested-workshop')!.template,root=act3ShipPresentation('infested-workshop',t)!;root.updateMatrixWorld(true);
  for(const name of ['chuck','tailstock-center','gripper-pad-left','gripper-pad-right','tendon-brace','guard-torn-edge','insulation-cut-stub'])expect(root.getObjectByName(name)).toBeDefined();
  const models=root.getObjectByName('act3-source-equipment')!.children;expect(models).toHaveLength(4);
  for(const i of [1,3])expect(new T.Box3().setFromObject(models[i],true).max.y).toBeLessThanOrEqual(.90001);
  const growth=root.getObjectByName('act3-batch-act3-seam-resin') as T.Mesh;expect(growth).toBeDefined();const p=growth.geometry.getAttribute('position');
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i);expect(canOccupyExpedition(createRoomTemplateGeometry(t,'growth'),{x:v.x*32,y:v.z*32},0)).toBe(false);}
  disposeModel(root);
 });
});
