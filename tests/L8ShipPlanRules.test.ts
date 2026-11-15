import {describe,it,expect} from 'vitest';
import {SHIP_STANDARD_PLANS} from '../src/game/roguelike/shipArchitectureStandards';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors} from '../src/game/roguelike/shipPlanChecks';
// Frozen 7ceefa5a52cc74a6b95712f29653d9bf523906be,2-unit union sample.
const before:Record<string,number>={'residential-gallery':961000,'crew-checkpoint':973184,'relay-racks':973000};
describe('L8 ship plans: lead architectural rules',()=>{
 it.each(Object.entries(SHIP_STANDARD_PLANS))('%s meets connected architecture, circulation and crowd-space requirements',(id,plan)=>{
  const t=STORY_ROOM_TEMPLATES[id as keyof typeof STORY_ROOM_TEMPLATES],g=createExpeditionGeometry(generateRun(1729,3).nodes.find(n=>n.templateId===id)!);
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
