import {afterAll,describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {SHIP_SERVICE_APPROACH_CANDIDATE as plans} from '../src/game/roguelike/shipServiceApproachCandidate';
import {SHIP_FINAL_PARTITION_PLANS as bases} from '../src/game/roguelike/shipFinalPartitions';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import type {RoomTemplate,TemplateId} from '../src/game/roguelike/types';
import {createRoomTemplateGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors,shipPhysicalApertureErrors,shipNavigationErrors} from '../src/game/roguelike/shipPlanChecks';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {L8_STORY,L8_FAMILIES,L8_STEP_MS,l8Arena,spawnL8Cohort} from './helpers/l8SimulationHarness';
const rows:unknown[]=[],paired:unknown[]=[],crowds:unknown[]=[];
afterAll(()=>{const path=process.env.L8_APPROACH_REPORT_DIR;if(path){mkdirSync(path,{recursive:true});writeFileSync(join(path,'native.json'),JSON.stringify(rows,null,2)+'\n');writeFileSync(join(path,'paired-approach.json'),JSON.stringify(paired,null,2)+'\n');writeFileSync(join(path,'crowds.json'),JSON.stringify(crowds,null,2)+'\n');}});
const template=(id:string,base=false):RoomTemplate=>({...ROOM_TEMPLATES[id as TemplateId],...(base?bases:plans)[id].topology});
function native(id:string,t:RoomTemplate,goal:{x:number;y:number},family:typeof L8_FAMILIES[number],breachIndex:number){
 const node=L8_STORY.find(n=>n.templateId===id)!,{game,movement}=l8Arena(node,goal,t),b=game.geometry.breaches[breachIndex],start={x:b.x+(b.facing==='east'?56:-56),y:b.y};
 game.navigation=new FacilityNavigation(game.geometry);expect(game['spawn'](family,start.x,start.y)).toBe(true);let distance=0,frames=0,clearFrames=0,atMs:number|null=null;
 for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);const e=game.enemies.snapshot.enemies[0];distance+=Math.hypot(e.x-before[0].x,e.y-before[0].y);frames++;if(hasClearExpeditionShot(game.geometry,e,goal))clearFrames++;
  if(events.some(e=>e.type==='contact-attack')||family==='spitter'&&events.some(e=>e.type==='hazard-attack')&&canTraverseExpedition(game.geometry,e,goal,9)||family==='carrier'&&Math.hypot(e.x-goal.x,e.y-goal.y)<=260&&hasClearExpeditionShot(game.geometry,e,goal)){atMs=elapsed+L8_STEP_MS;break;}
 }
 return{room:id,family,breach:breachIndex,start,goal,atMs,distance,frames,clearFrames,end:game.enemies.snapshot.enemies[0]};
}
describe('single predeclared transverse service-approach candidate',()=>{
 for(const [id,plan]of Object.entries(plans)){
  const t=template(id),base=template(id,true),g=createRoomTemplateGeometry(t,'service-approach'),node=L8_STORY.find(n=>n.templateId===id)!;
  it(id+' changes only authorized raw ingress and hull mounts, preserving every accepted bay',()=>{
   expect({...t,breaches:base.breaches}).toEqual(base);
   for(const key of ['arena','spaces','openings','apertures','bays'] as const)expect(plan[key]).toBe(bases[id][key]);
   expect(shipSolidStatistics(t)).toEqual(shipSolidStatistics(base));expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);
   expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);expect(shipNavigationErrors(g)).toEqual([]);
   for(const a of plan.apertures??[])expect(shipPhysicalApertureErrors(g,a)).toEqual([]);
   for(const [i,b]of g.breaches.entries()){
    const f=plan.breachFeatures[i];expect(f.name).toMatch(/vent|door|tear/);expect(Math.hypot(b.x-f.at.x,b.y-f.at.y)).toBeLessThanOrEqual(145);expect(canOccupyExpedition(g,f.at,0)).toBe(false);
    for(const p of [b,{x:b.x+(b.facing==='east'?56:-56),y:b.y}])for(const radius of [32,38])expect(canOccupyExpedition(g,p,radius),JSON.stringify({id,p,radius})).toBe(true);
   }
  },60000);
  const marks=[{name:'entry',point:t.spawn},{name:'exit',point:t.exit},{name:'arena',point:plan.arena},...plan.spaces.map(s=>({name:s.name,point:s.anchor})),...(plan.apertures??[]).map(a=>({name:a.name+' midpoint',point:{x:(a.from.x+a.to.x)/2,y:(a.from.y+a.to.y)/2}}))];
  for(const {name,point}of marks){
   it(id+' actual native families approach '+name,()=>{const fails:unknown[]=[];for(const family of L8_FAMILIES)for(let i=0;i<4;i++){const r=native(id,t,point,family,i);rows.push({...r,anchor:name});if(r.atMs===null)fails.push(r);}expect(fails).toEqual([]);},30000);
   it(id+' finite native mixed crowd reaches '+name,()=>{
    const {game,movement}=l8Arena(node,point,t),initial=spawnL8Cohort(game),waiting=new Set(initial.map(e=>e.id));
    for(let elapsed=0;elapsed<60000&&waiting.size;elapsed+=L8_STEP_MS){const before=movement.begin();game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);for(const e of game.enemies.snapshot.enemies)if(Math.hypot(e.x-point.x,e.y-point.y)<600&&hasClearExpeditionShot(game.geometry,point,e)&&waiting.delete(e.id)){expect(game.enemies.applyDamage(e.id,Math.ceil(e.health+e.armor)).died).toBe(true);}}
    const unresolved=game.enemies.snapshot.enemies.filter(e=>waiting.has(e.id));crowds.push({room:id,anchor:name,initial,unresolved});expect(unresolved,JSON.stringify(unresolved)).toEqual([]);expect(waiting.size).toBe(0);expect(game.enemies.activeCount).toBe(0);
   },20000);
  }
  it(id+' records paired old/new entry and arena approach evidence without asserting rig benefit',()=>{
   for(const index of id==='diagnostic-gallery'?[1]:[1,3])for(const goal of [t.spawn,plan.arena])for(const family of L8_FAMILIES){const old=native(id,base,goal,family,index),candidate=native(id,t,goal,family,index);expect(old.atMs).not.toBeNull();expect(candidate.atMs).not.toBeNull();paired.push({old,candidate});}
  },30000);
 }
 it('compares the exact recorder side-door midpoint against original659 geometry under the same repaired navigation',()=>{
  const results=[];
  for(const variant of ['original659-geometry','candidate'] as const){const id='diagnostic-gallery',point={x:532,y:230},t=template(id,variant==='original659-geometry'),node=L8_STORY.find(n=>n.templateId===id)!,{game,movement}=l8Arena(node,point,t),initial=spawnL8Cohort(game),waiting=new Set(initial.map(e=>e.id)),trace=[],routes:unknown[]=[];let now=0;
   const nav=game.navigation,originalWaypoint=nav.waypoint.bind(nav),commitments=(nav as unknown as {commitments:WeakMap<object,{wave:number;goal:{x:number;y:number};point:{x:number;y:number}}>}).commitments;
   nav.waypoint=(body,goal,wave)=>{const previous=commitments.get(body),before=previous?{goal:{...previous.goal},point:{...previous.point}}:null,result=originalWaypoint(body,goal,wave),next=commitments.get(body),id=(body as typeof body&{id?:number}).id;
    if((id===12||id===15)&&(now<5000||now>=57000))routes.push({atMs:now,id,body:{x:body.x,y:body.y,radius:body.radius},goal:{...goal},result:result?{...result}:null,before,after:next?{goal:{...next.goal},point:{...next.point}}:null});return result;};
   for(let elapsed=0;elapsed<60000&&waiting.size;elapsed+=L8_STEP_MS){now=elapsed;const before=movement.begin();game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);for(const e of game.enemies.snapshot.enemies)if(Math.hypot(e.x-point.x,e.y-point.y)<600&&hasClearExpeditionShot(game.geometry,point,e)&&waiting.delete(e.id))expect(game.enemies.applyDamage(e.id,Math.ceil(e.health+e.armor)).died).toBe(true);
    if(elapsed>=50000&&elapsed%1000===0)trace.push({atMs:elapsed+L8_STEP_MS,enemies:game.enemies.snapshot.enemies.filter(e=>waiting.has(e.id))});
   }
   const unresolved=game.enemies.snapshot.enemies.filter(e=>waiting.has(e.id)).map(e=>{const start=initial.find(x=>x.id===e.id)!,slot=e.attackSlot?{x:point.x+Math.cos(e.attackSlot.angle)*e.attackSlot.radius,y:point.y+Math.sin(e.attackSlot.angle)*e.attackSlot.radius}:undefined,probe=new FacilityNavigation(game.geometry).waypoint({...e},slot??point,1);return{start,end:e,slot,freshWaypoint:probe,slotSweep:slot?canTraverseExpedition(game.geometry,e,slot,e.radius):null,waypointSweep:probe?canTraverseExpedition(game.geometry,e,probe,e.radius):null};});
   results.push({variant,point,unresolved,trace,routes});
  }
  crowds.push({investigation:'recorder side-door midpoint',results});expect(results.flatMap(r=>r.unresolved),JSON.stringify(results)).toEqual([]);
 },60000);
});
