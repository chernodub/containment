import {describe,it,expect} from 'vitest';
import baseline from './fixtures/l8-walkable-baseline.json';
import {SHIP_ARCHITECTURE_PLANS} from '../src/game/roguelike/shipArchitectureLayouts';
import {SHIP_STANDARD_PLANS} from '../src/game/roguelike/shipArchitectureStandards';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,createRoomTemplateGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors,shipPhysicalApertureErrors} from '../src/game/roguelike/shipPlanChecks';
// Frozen 7ceefa5a52cc74a6b95712f29653d9bf523906be,2-unit union sample.
const before:Record<string,number>=baseline.areas;
describe('L8 ship plans: lead architectural rules',()=>{
 it.each(Object.entries(SHIP_ARCHITECTURE_PLANS))('%s meets connected architecture, circulation and crowd-space requirements',(id,plan)=>{
  const t=STORY_ROOM_TEMPLATES[id as keyof typeof STORY_ROOM_TEMPLATES],g=createExpeditionGeometry(generateRun(1729,3).nodes.find(n=>n.templateId===id)!);
  if(plan.holdout)expect(['transmission-chamber','overload-floor']).toContain(id);
  const stats=shipSolidStatistics(t);
  expect(stats.connectedFraction,'at least60% of solid union area connects to hull').toBeGreaterThanOrEqual(.6);
  expect(stats.freeGroups,'at most two freestanding components').toBeLessThanOrEqual(2);
  expect(stats.walkableArea/before[id]).toBeGreaterThanOrEqual(.8);expect(stats.walkableArea/before[id]).toBeLessThanOrEqual(1.2);
  expect(canOccupyExpedition(g,plan.arena,144),'9m diameter crowd/ability floor').toBe(true);
  expect(shipPlanOpeningErrors(plan,g)).toEqual([]);
  expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);
  expect(plan.breachFeatures).toHaveLength(t.breaches.length);
  for(const [i,b]of t.breaches.entries()){
   const f=plan.breachFeatures[i];expect(f.name).toMatch(/vent|door|tear/);
   expect(Math.hypot(b.x-f.at.x,b.y-f.at.y),'breach mouth near actual architectural feature').toBeLessThanOrEqual(145);
   expect(canOccupyExpedition(g,f.at,0),'feature on solid/hull').toBe(false);
  }
 },60000);
});

it('rejects corner-only chains, too many islands and a decorative octagon',()=>{
 const base=STORY_ROOM_TEMPLATES['relay-racks'];
 const islands=shipSolidStatistics({...base,width:400,height:400,boundary:[{x:0,y:0},{x:400,y:0},{x:400,y:400},{x:0,y:400}],voids:[],obstacles:[{x:0,y:0,width:40,height:40},{x:40,y:40,width:40,height:40},{x:140,y:140,width:40,height:40},{x:240,y:240,width:40,height:40}]});
 expect(islands.freeGroups).toBe(3);expect(islands.connectedFraction).toBe(.25);
 const plan=SHIP_STANDARD_PLANS['relay-racks'],g=createExpeditionGeometry(generateRun(1729,3).nodes.find(n=>n.templateId==='relay-racks')!);
 expect(shipPlanOpeningErrors({...plan,openings:plan.openings.map((o,i)=>i?o:{...o,to:{x:o.from.x+100,y:o.from.y}})},g)).toContain('Opening 0: 100 <140');
 expect(shipBlockedOpeningErrors(plan,{...g,blockers:[...g.blockers,{x:0,y:700,width:1280,height:48}]}).length).toBeGreaterThan(0);
 expect(shipPlanOpeningErrors(plan,{...g,boundary:[{x:40,y:0},{x:1240,y:0},{x:1280,y:40},{x:1280,y:960},{x:1240,y:1000},{x:40,y:1000},{x:0,y:960},{x:0,y:40}]})).toContain('Boundary needs functional recesses/bays, not a convex decorative hull');
});

it('distinguishes real jamb-supported apertures from floor lines and overlapping claimed lanes',()=>{
 const t={...ROOM_TEMPLATES.receiving,width:1000,height:800,boundary:undefined,voids:[],
  spawn:{x:100,y:200},exit:{x:900,y:200},breaches:[{x:100,y:100},{x:900,y:100},{x:100,y:700},{x:900,y:700}],
  obstacles:[{x:0,y:380,width:300,height:40},{x:600,y:380,width:400,height:40}]};
 const g=createRoomTemplateGeometry(t,'physical-aperture'),mouth={name:'Service bay mouth',kind:'wide workbay mouth' as const,
  from:{x:300,y:400},to:{x:600,y:400},lanes:[
   {a:'Bay',b:'Hall',from:{x:300,y:400},to:{x:440,y:400}},
   {a:'Bay',b:'Hall',from:{x:460,y:400},to:{x:600,y:400}},
  ]};
 expect(shipPhysicalApertureErrors(g,mouth)).toEqual([]);
 expect(shipPhysicalApertureErrors(g,{from:{x:300,y:200},to:{x:600,y:200}})).not.toEqual([]);
 const halfJamb=createRoomTemplateGeometry({...t,obstacles:t.obstacles.map(r=>({...r,height:20}))},'half-jamb');
 expect(shipPhysicalApertureErrors(halfJamb,mouth).some(e=>e.includes('solid jamb'))).toBe(true);
 expect(shipPhysicalApertureErrors(g,{...mouth,lanes:[mouth.lanes[0],{...mouth.lanes[1],from:{x:430,y:400}}]})).toContain('Physical aperture lanes overlap');
 expect(shipPhysicalApertureErrors(g,{...mouth,kind:'door'})).toContain('Door/mouth lane classification does not match physical aperture');
 expect(shipPhysicalApertureErrors(g,{...mouth,lanes:[mouth.lanes[0],{...mouth.lanes[1],from:{x:460,y:401},to:{x:600,y:401}}]})).toContain('Lane does not lie on physical aperture');
});
