import {afterAll,describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {SHIP_INGRESS_CANDIDATE_PLANS as plans} from '../src/game/roguelike/shipIngressCandidates';
import {SHIP_STANDARD_PLANS} from '../src/game/roguelike/shipArchitectureStandards';
import {SHIP_ACT3_PLANS} from '../src/game/roguelike/shipArchitectureAct3';
import {SHIP_ACT4_PLANS} from '../src/game/roguelike/shipArchitectureAct4';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {generateRun} from '../src/game/roguelike/run';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {createRoomTemplateGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors} from '../src/game/roguelike/shipPlanChecks';
import {L8_FAMILIES,L8_STEP_MS,l8Arena,spawnL8Cohort} from './helpers/l8SimulationHarness';
import type {RoomTemplate} from '../src/game/roguelike/types';
const nodes=generateRun(1729,3).nodes.filter(n=>Object.hasOwn(plans,n.templateId));
const rooms=nodes.map(node=>({id:node.templateId,template:{...ROOM_TEMPLATES[node.templateId],...plans[node.templateId].topology},plan:plans[node.templateId]}));
const referencePlans={...SHIP_STANDARD_PLANS,...SHIP_ACT3_PLANS,...SHIP_ACT4_PLANS};
const referenceRooms=nodes.map(node=>({id:node.templateId,template:{...ROOM_TEMPLATES[node.templateId],...referencePlans[node.templateId as keyof typeof referencePlans]!.topology},plan:referencePlans[node.templateId as keyof typeof referencePlans]!}));
const rows:unknown[]=[],crowds:unknown[]=[],baseline:unknown[]=[],snap=JSON.stringify(nodes.map(n=>ROOM_TEMPLATES[n.templateId]));
const cases=nodes.flatMap(node=>{const p=plans[node.templateId];return [{anchor:'entry',point:p.topology.spawn},{anchor:'exit',point:p.topology.exit},{anchor:'crowd arena',point:p.arena},...p.spaces.map(s=>({anchor:s.name,point:s.anchor}))].map(s=>({node,...s}));});
afterAll(()=>{if(process.env.L8_INGRESS_REPORT_DIR){const out=process.env.L8_INGRESS_REPORT_DIR;mkdirSync(out,{recursive:true});writeFileSync(join(out,'candidate-receipt.json'),JSON.stringify({module:'src/game/roguelike/shipIngressCandidates.ts',export:'SHIP_INGRESS_CANDIDATE_PLANS',active:rooms.every(r=>JSON.stringify(r.template.breaches)===JSON.stringify(ROOM_TEMPLATES[r.id].breaches)),referenceRooms,sha256:createHash('sha256').update(JSON.stringify(rooms)).digest('hex'),rooms,nativeTrials:rows,baselineArenaTrials:baseline,crowds},null,2)+'\n');}});
function trials(node:typeof nodes[number],point:{x:number;y:number},t:RoomTemplate,anchor:string,output:unknown[]){
 const failures:unknown[]=[];
 for(const family of L8_FAMILIES){const {game,movement}=l8Arena(node,point,t);
  for(const breach of game.geometry.breaches){game.enemies.reset();game.navigation=new FacilityNavigation(game.geometry);const start={x:breach.x+(breach.facing==='east'?56:-56),y:breach.y};
   expect(game['spawn'](family,start.x,start.y),`${node.templateId} ${family} ${breach.id}`).toBe(true);const spawned=game.enemies.snapshot.enemies[0];
   let atMs:number|null=null,distance=0,criterion='';
   for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);const enemy=game.enemies.snapshot.enemies[0];distance+=Math.hypot(enemy.x-before[0].x,enemy.y-before[0].y);
    if(events.some(e=>e.type==='contact-attack')){atMs=elapsed+L8_STEP_MS;criterion='native contact';break;}
    if(family==='spitter'&&events.some(e=>e.type==='hazard-attack')&&canTraverseExpedition(game.geometry,enemy,point,9)){atMs=elapsed+L8_STEP_MS;criterion='native completed spit / R9 sightline';break;}
    if(family==='carrier'&&Math.hypot(enemy.x-point.x,enemy.y-point.y)<=260&&hasClearExpeditionShot(game.geometry,enemy,point)){atMs=elapsed+L8_STEP_MS;criterion='native visible holding range';break;}
   }
   const row={room:node.templateId,anchor,family,breach:breach.id,start,spawned:{x:spawned.x,y:spawned.y},target:point,atMs,criterion,distance,end:game.enemies.snapshot.enemies[0]};output.push(row);if(atMs===null)failures.push(row);
  }
 }expect(failures,JSON.stringify(failures)).toEqual([]);
}
describe('rear-vent ingress overrides',()=>{
 it('preserves base-plan geometry/furniture and has no import-time mutation of the live registry',()=>{
  expect(nodes).toHaveLength(5);expect(Object.keys(plans)).not.toContain('transmission-chamber');
  for(const {id,template,plan}of rooms){const base=referenceRooms.find(r=>r.id===id)!;expect({...template,breaches:base.template.breaches}).toEqual(base.template);expect({...plan,topology:base.plan.topology,breachFeatures:base.plan.breachFeatures}).toEqual(base.plan);}
  expect(JSON.stringify(nodes.map(n=>ROOM_TEMPLATES[n.templateId]))).toBe(snap);
 });
 it.each(rooms)('$id keeps structure, full thresholds, alternate routes and exact R32/R38 ingress clearance',({id,template,plan})=>{
  // This historical ingress-only candidate retains its own pre-partition base.
  // The live Diagnostic now has additional physical workbay dividers, tested
  // by L8FinalPartitions; compare candidate structure to its declared source.
  const g=createRoomTemplateGeometry(template,'ingress-'+id),a=shipSolidStatistics(template),b=shipSolidStatistics(referenceRooms.find(r=>r.id===id)!.template);expect(a).toEqual(b);expect(template.breaches).toEqual(ROOM_TEMPLATES[id].breaches);expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);
  for(const breach of g.breaches)for(const p of [breach,{x:breach.x+(breach.facing==='east'?56:-56),y:breach.y}])for(const radius of [32,38])expect(canOccupyExpedition(g,p,radius),JSON.stringify({id,p,radius})).toBe(true);
  for(const [i,b]of template.breaches.entries()){const f=plan.breachFeatures[i];expect(Math.hypot(f.at.x-b.x,f.at.y-b.y)).toBeLessThanOrEqual(140);expect(canOccupyExpedition(g,f.at,0)).toBe(false);expect(f.name).toMatch(/vent|door/);}
 });
 it.each(cases)('$node.templateId native all-family attacks/holding at $anchor',({node,anchor,point})=>{trials(node,point,rooms.find(r=>r.id===node.templateId)!.template,anchor,rows);},30000);
 it.each(nodes)('$templateId active-arena reference uses the same bounded native method',node=>{trials(node,plans[node.templateId].arena,referenceRooms.find(r=>r.id===node.templateId)!.template,'crowd arena',baseline);},30000);
 it.each(cases)('$node.templateId mixed crowd clears exposed blockers at $anchor',({node,anchor,point})=>{
  const {game,movement}=l8Arena(node,point,rooms.find(r=>r.id===node.templateId)!.template),initial=spawnL8Cohort(game),waiting=new Set(initial.map(e=>e.id));let lastMs=0;
  for(let elapsed=0;elapsed<60000&&waiting.size;elapsed+=L8_STEP_MS){const before=movement.begin();game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);
   for(const e of game.enemies.snapshot.enemies)if(Math.hypot(e.x-point.x,e.y-point.y)<600&&hasClearExpeditionShot(game.geometry,e,point)&&waiting.delete(e.id)){lastMs=elapsed+L8_STEP_MS;const damage=game.enemies.applyDamage(e.id,Math.ceil(e.health+e.armor));expect(damage.applied).toBe(true);expect(damage.died).toBe(true);}
  }crowds.push({room:node.templateId,anchor,initial:initial.length,cleared:initial.length-waiting.size,lastMs});expect([...waiting]).toEqual([]);expect(game.enemies.activeCount).toBe(0);expect(lastMs).toBeLessThanOrEqual(60000);
 },30000);
});
