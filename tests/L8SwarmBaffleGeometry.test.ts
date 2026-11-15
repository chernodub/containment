import {describe,it,expect} from 'vitest';
import {stageGraphicsKiting} from '../scripts/nextgen/scenarios.mjs';
import * as T from 'three';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors,shipNavigationErrors} from '../src/game/roguelike/shipPlanChecks';
import {canOccupyExpedition,canTraverseExpedition,createRoomTemplateGeometry,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {ENEMIES} from '../src/game/enemies/catalog';
import {L8_FAMILIES} from './helpers/l8SimulationHarness';
import {BAFFLE_PLAN as plan,BASE_PLAN,BAFFLE_TEMPLATE as t,BASE_TEMPLATE,BAFFLE_MARKS as marks,writeBaffleReport} from './helpers/l8SwarmBaffleHarness';
import {CameraRig} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
import {projectedLandmarkShare} from '../src/render/camera/LandmarkShare';
const id='swarm-junction',g=createRoomTemplateGeometry(t,'dormant-swarm-baffle');
describe('Dormant attached Swarm vent baffles',()=>{
 it('preserves exact source reservations and area floor with connected returned mouths',()=>{
  expect(t.boundary).toEqual(BASE_TEMPLATE.boundary);expect(t.obstacles).toEqual(BASE_TEMPLATE.obstacles);expect([t.width,t.height,t.spawn,t.exit,t.breaches]).toEqual([BASE_TEMPLATE.width,BASE_TEMPLATE.height,BASE_TEMPLATE.spawn,BASE_TEMPLATE.exit,BASE_TEMPLATE.breaches]);expect(plan.breachFeatures).toEqual(BASE_PLAN.breachFeatures);expect(plan.arena).toEqual(BASE_PLAN.arena);expect(t.voids!.slice(2)).toEqual(BASE_TEMPLATE.voids!.slice(2));
  const stats=shipSolidStatistics(t),before=shipSolidStatistics(BASE_TEMPLATE);expect(stats.solidArea-before.solidArea).toBe(2180);expect(stats.walkableArea).toBe(762500);expect(stats.walkableArea/950800).toBeGreaterThanOrEqual(.8);expect(stats.walkableArea/950800).toBeLessThanOrEqual(1.2);expect(stats.connectedFraction).toBe(1);expect(stats.freeGroups).toBe(0);
  expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);expect(shipNavigationErrors(g)).toEqual([]);
  for(const point of [t.spawn,t.exit,...g.breaches,...g.breaches.flatMap(b=>[-56,56].map(dx=>({x:b.x+dx,y:b.y})))])expect(canOccupyExpedition(g,point,38),JSON.stringify(point)).toBe(true);
  for(const mark of marks)expect(canOccupyExpedition(g,mark.point,16),mark.name).toBe(true);
  writeBaffleReport('strict-geometry.json',{before,after:stats,areaRatio:stats.walkableArea/950800,marks});
 },60000);
 it('interrupts both actual northern raw spit lines while retaining the open gallery and north throat',()=>{
  const old=createRoomTemplateGeometry(BASE_TEMPLATE,'baseline');
  for(const x of [336,864]){expect(canTraverseExpedition(old,{x,y:440},plan.arena,9)).toBe(true);expect(canTraverseExpedition(g,{x,y:440},plan.arena,9)).toBe(false);}
  expect(hasClearExpeditionShot(g,{x:64,y:520},{x:1136,y:520})).toBe(true);expect(canTraverseExpedition(g,{x:600,y:64},{x:600,y:790},16)).toBe(true);
  // The thin returns provide directional cover, not an enclosed pocket:
  // each inner/outer side has independent legal north/south circulation.
  for(const route of [[{x:360,y:400},{x:360,y:500},{x:464,y:500},{x:464,y:400}],[{x:840,y:400},{x:840,y:500},{x:736,y:500},{x:736,y:400}]])for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],32)).toBe(true);
 });
 it('retains two independent marine escape directions at both exact original chamfer fringes',()=>{
  for(const [x,inside]of [[440,464],[760,736]])for(const route of [[{x,y:330},{x:inside,y:250},{x:600,y:250}],[{x,y:330},{x:inside,y:500},{x:600,y:500}]])for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],16)).toBe(true);
 });
 it('retains independent marine escapes on both sides of both returned baffles',()=>{
  for(const [x,end]of [[376,200],[824,1000]])for(const route of [[{x,y:400},{x,y:376},{x:end,y:376},{x:end,y:520}],[{x,y:400},{x,y:520},{x:end,y:520}]])for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],16)).toBe(true);
  for(const x of [464,736])for(const route of [[{x,y:400},{x,y:250},{x:600,y:250}],[{x,y:400},{x,y:520},{x:600,y:520}]])for(let i=1;i<route.length;i++)expect(canTraverseExpedition(g,route[i-1],route[i],16)).toBe(true);
 });
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
  writeBaffleReport('dense-navigation.json',{goals,routes,failures});process.stdout.write(`[Swarm baffle dense] ${goals} marine goals; ${routes} native family routes; ${failures.length} failures\n`);expect(failures).toEqual([]);
 },120000);
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
 it('packs the unchanged G6 five-family geometry and spacing fixture at the selected actual arena',async()=>{
  const previous=globalThis.window,actors:{id:number;family:string;x:number;y:number}[]=[],inputs:Array<{fire?:boolean}>=[],game={geometry:g,player:{...t.spawn,radius:16},stats:{shotsFired:0},bullets:[] as {kind:string}[],enemies:{reset(){}},switchWeapon(){},grenade(){this.bullets.push({kind:'grenade'});}};
  const debug={game,gotoRoom:async()=>{},invulnerable(){},measureLuminance:false,canStand:(x:number,y:number,r:number)=>canOccupyExpedition(g,{x,y},r),clearShot:(x:number,y:number,from=game.player)=>hasClearExpeditionShot(g,from,{x,y}),setInput:(input:{fire?:boolean})=>inputs.push(input),step(){if(inputs.at(-1)?.fire)game.stats.shotsFired++;},spawn:(family:string,x:number,y:number)=>{if(!canOccupyExpedition(g,{x,y},28))return false;const id=actors.length+1;actors.push({id,family,x,y});return id;}};
  try{globalThis.window={__containmentDebug:debug} as unknown as Window&typeof globalThis;await stageGraphicsKiting(id,{arena:plan.arena});expect(actors.length).toBeGreaterThanOrEqual(10);expect(new Set(actors.map(a=>a.family)).size).toBe(5);for(let i=0;i<actors.length;i++)for(let j=0;j<i;j++)expect(Math.hypot(actors[i].x-actors[j].x,actors[i].y-actors[j].y)).toBeGreaterThanOrEqual(55);expect(game.stats.shotsFired).toBeGreaterThan(0);expect(game.bullets.some(b=>b.kind==='grenade')).toBe(true);}finally{globalThis.window=previous;}
 });
});
