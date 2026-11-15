import {describe,it,expect} from 'vitest';
import {SHIP_FINAL_PARTITION_PLANS as plans,SHIP_PARTITION_APERTURES as apertures,type PartitionAperture} from '../src/game/roguelike/shipFinalPartitions';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../src/game/roguelike/shipArchitectureLayouts';
import {createRoomTemplateGeometry,canOccupyExpedition,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors,shipPhysicalApertureErrors} from '../src/game/roguelike/shipPlanChecks';
import baseline from './fixtures/l8-walkable-baseline.json';
import previous from './fixtures/l8-pre-partition-geometry.json';
import type {Point,RoomTemplate,TemplateId} from '../src/game/roguelike/types';
const oldTemplate=(id:string):RoomTemplate=>previous.templates[id as keyof typeof previous.templates] as RoomTemplate;
const template=(id:string):RoomTemplate=>({...ROOM_TEMPLATES[id as TemplateId],...plans[id].topology});
/** Exercise the shared production audit with the exact prospective geometry. */
function apertureErrors(t:RoomTemplate,a:Pick<PartitionAperture,'from'|'to'>){
 return shipPhysicalApertureErrors(createRoomTemplateGeometry(t,'jamb'),a);
}
describe('dormant final workbay structure',()=>{
 it.each(Object.keys(plans))('%s retains source machinery, arena, route anchors and R38 rear ingress',id=>{
  const old=oldTemplate(id),t=template(id),plan=plans[id],g=createRoomTemplateGeometry(t,'partition-'+id),s=shipSolidStatistics(t);
  expect(t.obstacles).toEqual(old.obstacles);expect([t.width,t.height,t.spawn,t.exit,t.breaches]).toEqual([old.width,old.height,old.spawn,old.exit,old.breaches]);expect(plan.arena).toEqual(SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS]!.arena);
  expect(s.connectedFraction).toBeGreaterThanOrEqual(.6);expect(s.freeGroups).toBeLessThanOrEqual(id==='infested-workshop'?1:2);expect(s.walkableArea/baseline.areas[id as keyof typeof baseline.areas]).toBeGreaterThanOrEqual(.8);expect(s.walkableArea/baseline.areas[id as keyof typeof baseline.areas]).toBeLessThanOrEqual(1.2);
  expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);
  for(const b of g.breaches)for(const p of [b,{x:b.x+(b.facing==='east'?56:-56),y:b.y}])for(const radius of [32,38])expect(canOccupyExpedition(g,p,radius),JSON.stringify({id,p,radius})).toBe(true);
 });
 it.each(Object.entries(apertures))('%s supports every claimed physical aperture with real8-unit-deep jambs',(id,doors)=>{
  for(const a of doors){expect(apertureErrors(template(id),a),a.name).toEqual([]);
   const dx=a.to.x-a.from.x,dy=a.to.y-a.from.y,len=Math.hypot(dx,dy),range=(p:Point)=>((p.x-a.from.x)*dx+(p.y-a.from.y)*dy)/len;
   const spans=a.lanes.map(l=>[range(l.from),range(l.to)]).sort((x,y)=>x[0]-y[0]);for(const span of spans){expect(span[0]).toBeGreaterThanOrEqual(0);expect(span[1]).toBeLessThanOrEqual(len);expect(span[1]-span[0]).toBeGreaterThanOrEqual(140);}for(let i=1;i<spans.length;i++)expect(spans[i][0]).toBeGreaterThanOrEqual(spans[i-1][1]);
   expect(a.lanes).toHaveLength(a.kind==='door'?1:2); // Parallel lanes are not two claimed doorways.
  }
 });
 it('rejects the old Diagnostic/Workshop green floor lines as physical doors',()=>{
  expect(apertureErrors(oldTemplate('diagnostic-gallery'),{from:{x:200,y:300},to:{x:520,y:300}})).not.toEqual([]);
  expect(apertureErrors(oldTemplate('infested-workshop'),{from:{x:260,y:300},to:{x:560,y:300}})).not.toEqual([]);
  expect(apertureErrors(oldTemplate('infested-workshop'),{from:{x:900,y:300},to:{x:900,y:480}})).not.toEqual([]);
 });
 it.each([
  {id:'diagnostic-gallery',direct:[{x:360,y:230},{x:692,y:230}],around:[{x:360,y:230},{x:360,y:400},{x:692,y:400},{x:692,y:230}],seal:{x:520,y:160,width:24,height:140}},
  {id:'diagnostic-gallery',direct:[{x:380,y:750},{x:900,y:750}],around:[{x:380,y:750},{x:380,y:580},{x:900,y:580},{x:900,y:750}],seal:{x:560,y:680,width:24,height:140}},
  {id:'infested-workshop',direct:[{x:144,y:250},{x:416,y:250}],around:[{x:144,y:250},{x:144,y:400},{x:416,y:400},{x:416,y:250}],seal:{x:248,y:180,width:24,height:140}},
 ])('$id supplies a genuine side-door loop independent of its broad front',({id,direct,around,seal})=>{
  const g=createRoomTemplateGeometry(template(id),'loop'),closed={...g,blockers:[...g.blockers,seal]};
  for(const route of [direct,around])for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],32)).toBe(true);
  expect(canTraverseExpedition(closed,direct[0],direct[1],32)).toBe(false);
  for(let i=1;i<around.length;i++)expect(canTraverseExpedition(closed,around[i-1],around[i],32)).toBe(true);
 });
 it('fills the Diagnostic60-unit rear strip and the Workshop gantry L interior with connected structure',()=>{
  const d=createRoomTemplateGeometry(template('diagnostic-gallery'),'d'),w=createRoomTemplateGeometry(template('infested-workshop'),'w');
  expect(canOccupyExpedition(createRoomTemplateGeometry(oldTemplate('diagnostic-gallery'),'old'),{x:230,y:80},16)).toBe(true);expect(canOccupyExpedition(d,{x:230,y:80},0)).toBe(false);
  expect(canOccupyExpedition(createRoomTemplateGeometry(oldTemplate('infested-workshop'),'old'),{x:1056,y:500},16)).toBe(true);expect(canOccupyExpedition(w,{x:1056,y:500},0)).toBe(false);
 });
 it('preserves the V11 rear-strip safety through two separate real loading-mouth lanes',()=>{
  const g=createRoomTemplateGeometry(template('infested-workshop'),'escape'),old=createRoomTemplateGeometry(oldTemplate('infested-workshop'),'old'),p={x:100,y:768};
  expect(canOccupyExpedition(g,p,32)).toBe(true);expect(canTraverseExpedition(old,p,{x:650,y:768},32)).toBe(true);expect(canTraverseExpedition(g,p,{x:650,y:768},32)).toBe(false);
  const routes=[[p,{x:100,y:400},{x:650,y:400}],[p,{x:200,y:768},{x:200,y:580},{x:650,y:580}]];
  for(const route of routes)for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],32)).toBe(true);
  for(const [i,r]of [{x:248,y:340,width:24,height:140},{x:248,y:500,width:24,height:140}].entries()){const closed={...g,blockers:[...g.blockers,r]},other=routes[1-i];expect(canTraverseExpedition(closed,routes[i].at(-2)!,routes[i].at(-1)!,32)).toBe(false);for(let n=1;n<other.length;n++)expect(canTraverseExpedition(closed,other[n-1],other[n],32)).toBe(true);}
  for(const x of [72,104,136])for(const y of [832,896,960])expect(canOccupyExpedition(g,{x,y},0)).toBe(false);
 });
 it('describes Safety as an open equipment gallery and retains its exact two-ended cage geometry',()=>{
  expect(template('safety-interlock-station')).toEqual(oldTemplate('safety-interlock-station'));expect(plans['safety-interlock-station'].spaces.some(s=>s.name.includes('booths'))).toBe(false);expect(plans['safety-interlock-station'].spaces.some(s=>s.name==='Open recorder and AI gallery')).toBe(true);
 });
});
