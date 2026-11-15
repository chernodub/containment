import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {SHIP_SWARM_BAY_340_ARENA400_CANDIDATE} from '../src/game/roguelike/shipArchitectureSwarmBayCandidate';
import {SHIP_ACT4_PLANS} from '../src/game/roguelike/shipArchitectureAct4';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors,shipNavigationErrors} from '../src/game/roguelike/shipPlanChecks';
import {canOccupyExpedition,canTraverseExpedition,createRoomTemplateGeometry,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {ENEMIES} from '../src/game/enemies/catalog';
import {stageGraphicsKiting} from '../scripts/nextgen/scenarios.mjs';
import {roomFocus} from '../src/render/roomFraming';
import {CameraRig} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
import {projectedLandmarkShare} from '../src/render/camera/LandmarkShare';
import {L8_STORY,L8_FAMILIES,L8_STEP_MS,l8Arena,spawnL8Cohort} from './helpers/l8SimulationHarness';
const id='swarm-junction',plan=SHIP_SWARM_BAY_340_ARENA400_CANDIDATE[id],t={...ROOM_TEMPLATES[id],...plan.topology},node=L8_STORY.find(n=>n.templateId===id)!,g=createRoomTemplateGeometry(t,'dormant-swarm-bays');
const marks=[{name:'entry',point:t.spawn},{name:'exit',point:t.exit},{name:'arena',point:plan.arena},...plan.spaces.map(s=>({name:s.name,point:s.anchor})),{name:'new north mouth',point:{x:600,y:360}},{name:'port inner chamfer fringe',point:{x:440,y:330}},{name:'starboard inner chamfer fringe',point:{x:760,y:330}},{name:'port north bank front fringe',point:{x:280,y:360}},{name:'starboard north bank front fringe',point:{x:920,y:360}}];
describe('Dormant Swarm north-bank architecture proposal',()=>{
 it('preserves the live registry, southern banks, story dimensions and all strict plan contracts',()=>{
  expect(plan.topology.voids).not.toBe(SHIP_ACT4_PLANS[id].topology.voids);expect(plan.topology.boundary).toEqual(SHIP_ACT4_PLANS[id].topology.boundary);expect(plan.topology.voids!.slice(2)).toEqual(SHIP_ACT4_PLANS[id].topology.voids!.slice(2));expect(t.spawn).toEqual(ROOM_TEMPLATES[id].spawn);expect(t.exit).toEqual(ROOM_TEMPLATES[id].exit);expect(plan.arena).toEqual({x:600,y:400});expect(canOccupyExpedition(g,{x:600,y:520},144)).toBe(true);
  const stats=shipSolidStatistics(t);expect(stats.walkableArea).toBe(764680);expect(stats.walkableArea/950800).toBeGreaterThanOrEqual(.8);expect(stats.walkableArea/950800).toBeLessThanOrEqual(1.2);expect(stats.connectedFraction).toBe(1);expect(stats.freeGroups).toBe(0);expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);
  expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);expect(shipNavigationErrors(g)).toEqual([]);
  for(const point of [t.spawn,t.exit,...g.breaches,...g.breaches.flatMap(b=>[-56,56].map(dx=>({x:b.x+dx,y:b.y})))])expect(canOccupyExpedition(g,point,38),JSON.stringify(point)).toBe(true);
 },60000);
 it('routes every native family from all breaches to a dense64-unit marine field or native spitter firing band',()=>{
  const firingPool:{x:number;y:number}[]=[];for(let y=32;y<t.height;y+=16)for(let x=32;x<t.width;x+=16)if(canOccupyExpedition(g,{x,y},ENEMIES.spitter.radius))firingPool.push({x,y});
  const navs=new Map(L8_FAMILIES.map(f=>[f,new FacilityNavigation(g)])),failures:unknown[]=[];let goals=0,routes=0;
  for(let y=48;y<t.height;y+=64)for(let x=48;x<t.width;x+=64){const goal={x,y};if(!canOccupyExpedition(g,goal,16))continue;goals++;
   const firing=firingPool.filter(p=>{const d=Math.hypot(p.x-x,p.y-y);return d>=180&&d<=420&&canTraverseExpedition(g,p,goal,9);});expect(firing.length).toBeGreaterThan(0);
   for(const family of L8_FAMILIES){const radius=ENEMIES[family].radius,contact:Array<{x:number;y:number}>=[];
    for(let i=0;i<64;i++){const a=i*Math.PI/32,p={x:x+Math.cos(a)*(radius+16+.25),y:y+Math.sin(a)*(radius+16+.25)};if(canOccupyExpedition(g,p,radius)&&canTraverseExpedition(g,p,goal,0))contact.push(p);}
    for(const b of g.breaches){routes++;const start={x:b.x+(b.facing==='east'?56:-56),y:b.y},candidates=[...(family==='spitter'?firing:contact)].sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y));let reached=false;
     for(const target of candidates){const body={...start,radius};for(let step=0;step<900;step++){
      const d=Math.hypot(body.x-x,body.y-y);if(family==='spitter'?d>=180&&d<=420&&canTraverseExpedition(g,body,goal,9):d<=radius+16+.5&&canTraverseExpedition(g,body,goal,0)){reached=true;break;}
      const q=canTraverseExpedition(g,body,target,radius)?target:navs.get(family)!.waypoint(body,target,1)??target,dq=Math.hypot(q.x-body.x,q.y-body.y);if(dq<1e-6)break;
      const next={x:body.x+(q.x-body.x)/dq*Math.min(8,dq),y:body.y+(q.y-body.y)/dq*Math.min(8,dq)};if(!canTraverseExpedition(g,body,next,radius))break;Object.assign(body,next);
     }if(reached)break;}
     if(!reached)failures.push({goal,family,breach:b.id,candidates:candidates.length});
    }
   }
  }
  process.stdout.write(`[Swarm candidate dense] ${goals} marine goals; ${routes} native family routes; ${failures.length} failures\n`);expect(failures).toEqual([]);
 },120000);
 for(const mark of marks){
  it('mixed native crowd reaches '+mark.name,()=>{
   const {game,movement}=l8Arena(node,mark.point,t),initial=spawnL8Cohort(game),waiting=new Set(initial.map(e=>e.id));let lastMs=0;
   for(let elapsed=0;elapsed<60000&&waiting.size;elapsed+=L8_STEP_MS){const before=movement.begin();game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);for(const e of game.enemies.snapshot.enemies)if(Math.hypot(e.x-game.player.x,e.y-game.player.y)<600&&hasClearExpeditionShot(game.geometry,game.player,e)&&waiting.delete(e.id)){lastMs=elapsed+L8_STEP_MS;expect(game.enemies.applyDamage(e.id,Math.ceil(e.health+e.armor)).died).toBe(true);}}
   process.stdout.write(`[Swarm candidate A3] ${mark.name}: ${initial.length-waiting.size}/${initial.length}, last ${lastMs}ms\n`);expect(waiting.size).toBe(0);expect(game.enemies.activeCount).toBe(0);
  },20000);
  it('native contact/firing families reach '+mark.name,()=>{
   const failures:unknown[]=[];
   for(const family of L8_FAMILIES){const {game,movement}=l8Arena(node,mark.point,t);for(const b of game.geometry.breaches){game.enemies.reset();game.navigation=new FacilityNavigation(game.geometry);expect(game['spawn'](family,b.x+(b.facing==='east'?56:-56),b.y)).toBe(true);let reached=false;
    for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);const e=game.enemies.snapshot.enemies[0];if(events.some(e=>e.type==='contact-attack')||family==='spitter'&&events.some(e=>e.type==='hazard-attack')&&canTraverseExpedition(game.geometry,e,game.player,9)||family==='carrier'&&Math.hypot(e.x-game.player.x,e.y-game.player.y)<=260&&hasClearExpeditionShot(game.geometry,e,game.player)){reached=true;break;}}
    if(!reached)failures.push({family,breach:b.id,end:game.enemies.snapshot.enemies[0]});}}
   expect(failures,JSON.stringify(failures)).toEqual([]);
  },20000);
 }
 it('preserves C6/E7 body, hero, AABB and actual main-fight floor/landmark shares',()=>{
  for(const height of[1080,720])for(const reduced of[false,true])for(const mark of marks){
   const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),point=new T.Vector3(),target=new T.Vector3(),x=mark.point.x/32,z=mark.point.y/32,scale=height/1080;
   hud.resize(height*16/9,height);hud.setInsets({top:182*scale,right:292*scale,bottom:120*scale,left:0});
   const contacts=[[-140,0],[140,0],[0,-140],[0,140]].map(([dx,dy],i)=>({id:i,x:mark.point.x+dx,y:mark.point.y+dy,radius:28,health:100})).filter(e=>canOccupyExpedition(g,e,28));
   for(let i=0;i<180;i++){hud.selectContacts(x,z,0,contacts);combatFocusTarget(x,z,0,0,0,false,reduced,point);hud.biasTarget(x,z,0,reduced,false,point);rig.update(1/60,point.x,point.z,0,reduced);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,point,target);hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,point,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,point,target,hud.viewport);final.apply(camera,rig.focus,x,z,.5,2.05,t.width/32,t.height/32,hud.viewport,height,1/60,reduced,t.boundary,hud);}
   expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.999*scale);expect(final.diagnostics.outside).toBeLessThanOrEqual(.180001);
   for(const sx of[-1,1])for(const sz of[-1,1])for(const y of[0,2.05]){point.set(x+sx*.5,y,z+sz*.5).project(camera);expect(point.x).toBeGreaterThanOrEqual(hud.viewport.left-1e-5);expect(point.x).toBeLessThanOrEqual(hud.viewport.right+1e-5);expect(point.y).toBeGreaterThanOrEqual(hud.viewport.bottom-1e-5);expect(point.y).toBeLessThanOrEqual(hud.viewport.top+1e-5);}
   if(mark.name!=='arena')continue;
   const shares:number[]=[];for(const polygon of t.voids!){const box=new T.Box3();for(const p of polygon){box.expandByPoint(new T.Vector3(p.x/32,0,p.y/32));box.expandByPoint(new T.Vector3(p.x/32,.91,p.y/32));}const share=projectedLandmarkShare(camera,box,hud.viewport);shares.push(share);expect(share).toBeLessThanOrEqual(.35);}
   const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();let floor=0;
   for(let row=0;row<9;row++)for(let col=0;col<13;col++){ray.setFromCamera(new T.Vector2(hud.viewport.left+(col+.5)/13*(hud.viewport.right-hud.viewport.left),hud.viewport.bottom+(row+.5)/9*(hud.viewport.top-hud.viewport.bottom)),camera);if(ray.ray.intersectPlane(plane,hit)&&canOccupyExpedition(g,{x:hit.x*32,y:hit.z*32},0))floor++;}
   process.stdout.write(`[Swarm candidate F2] ${height}/${reduced}: ${floor}/117 walkable viewport samples; bank shares ${shares.map(s=>s.toFixed(4)).join('/')}\n`);expect(floor/117).toBeGreaterThanOrEqual(.6);
  }
 });
 it('retains the native large ability reserve, four broad escape sweeps and the long cross-ship firing line',()=>{
  expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);expect(hasClearExpeditionShot(g,{x:64,y:400},{x:1136,y:400})).toBe(true);
  for(let i=0;i<4;i++){const angle=i*Math.PI/2,next={x:plan.arena.x+Math.cos(angle)*220,y:plan.arena.y+Math.sin(angle)*220};expect(canTraverseExpedition(g,plan.arena,next,32)).toBe(true);}
 });
 it('packs the unchanged G6 five-family geometry and spacing fixture at the selected actual arena',async()=>{
  const previous=globalThis.window,actors:{id:number;family:string;x:number;y:number}[]=[],inputs:Array<{fire?:boolean}>=[],game={geometry:g,player:{...t.spawn,radius:16},stats:{shotsFired:0},bullets:[] as {kind:string}[],enemies:{reset(){}},switchWeapon(){},grenade(){this.bullets.push({kind:'grenade'});}};
  const debug={game,gotoRoom:async()=>{},invulnerable(){},measureLuminance:false,canStand:(x:number,y:number,r:number)=>canOccupyExpedition(g,{x,y},r),clearShot:(x:number,y:number,from=game.player)=>hasClearExpeditionShot(g,from,{x,y}),setInput:(input:{fire?:boolean})=>inputs.push(input),step(){if(inputs.at(-1)?.fire)game.stats.shotsFired++;},spawn:(family:string,x:number,y:number)=>{if(!canOccupyExpedition(g,{x,y},28))return false;const id=actors.length+1;actors.push({id,family,x,y});return id;}};
  try{globalThis.window={__containmentDebug:debug} as unknown as Window&typeof globalThis;await stageGraphicsKiting(id,{arena:plan.arena});expect(actors.length).toBeGreaterThanOrEqual(10);expect(new Set(actors.map(a=>a.family)).size).toBe(5);for(let i=0;i<actors.length;i++)for(let j=0;j<i;j++)expect(Math.hypot(actors[i].x-actors[j].x,actors[i].y-actors[j].y)).toBeGreaterThanOrEqual(55);expect(game.stats.shotsFired).toBeGreaterThan(0);expect(game.bullets.some(b=>b.kind==='grenade')).toBe(true);}finally{globalThis.window=previous;}
 });
 it('replays identical native crowded motion with the dormant template',()=>{
  const run=()=>{const {game,movement}=l8Arena(node,plan.arena,t);spawnL8Cohort(game);const frames:string[]=[];for(let tick=0;tick<120;tick++){const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);frames.push(JSON.stringify({bodies:game.enemies.snapshot.enemies,events}));}return frames;};expect(run()).toEqual(run());
 });
});
