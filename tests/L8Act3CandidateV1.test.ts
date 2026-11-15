import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {SHIP_ACT3_CANDIDATE_V1} from '../src/game/roguelike/shipArchitectureAct3CandidateV1';
import {SHIP_ACT3_CANDIDATE_V11} from '../src/game/roguelike/shipArchitectureAct3CandidateV11';
import {projectedLandmarkShare} from '../src/render/camera/LandmarkShare';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import type {RoomTemplate} from '../src/game/roguelike/types';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors,shipNavigationErrors} from '../src/game/roguelike/shipPlanChecks';
import {canOccupyExpedition,canTraverseExpedition,createRoomTemplateGeometry,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {act3ShipPresentation} from '../src/render/world/Act3ShipPresentation';
import {disposeModel} from '../src/render/meshParts';
import {CameraRig} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
import {L8_STORY,L8_FAMILIES,L8_STEP_MS,l8Arena,spawnL8Cohort} from './helpers/l8SimulationHarness';
const variants=[['V1',SHIP_ACT3_CANDIDATE_V1],['V1.1',SHIP_ACT3_CANDIDATE_V11]] as const;
const plans=variants.flatMap(([variant,map])=>Object.entries(map).map(([id,plan])=>({id,variant,plan,t:{...ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],...plan.topology} as RoomTemplate,node:L8_STORY.find(n=>n.templateId===id)!})));
describe('Prospective Act3 balance candidateV1',()=>{
 for(const {id,variant,plan,t,node}of plans){
  const label=variant+' '+id;
  const g=createRoomTemplateGeometry(t,'candidate-'+id);
  it(label+' keeps strict connected architecture, actual clearance and native breach margins',()=>{
   const s=shipSolidStatistics(t);expect(s.connectedFraction).toBeGreaterThanOrEqual(.6);expect(s.freeGroups).toBeLessThanOrEqual(2);expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);
   expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);expect(shipNavigationErrors(g)).toEqual([]);
   for(const q of [t.spawn,t.exit,...g.breaches,...g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y}))])expect(canOccupyExpedition(g,q,38)).toBe(true);
  },60000);
  if(variant==='V1.1'&&id==='infested-workshop')it('V1.1 fills the old one-ended rear strip and preserves two front escape directions',()=>{
   for(let y=832;y<=960;y+=32)for(let x=72;x<=136;x+=32)expect(canOccupyExpedition(g,{x,y},16)).toBe(false);
   const front={x:100,y:768};expect(canOccupyExpedition(g,front,32)).toBe(true);
   expect(canTraverseExpedition(g,front,{x:100,y:600},32)).toBe(true);expect(canTraverseExpedition(g,front,{x:650,y:768},32)).toBe(true);
  });
  it(label+' retains bounded fitted source equipment, lighting and disposal',()=>{
   const model=act3ShipPresentation(id,t)!;model.updateMatrixWorld(true);expect(model.children.filter(o=>o instanceof T.Mesh).length).toBeLessThanOrEqual(6);
   expect(model.userData.lightFixtures.length).toBeGreaterThanOrEqual(2);const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>();
   model.traverse(o=>{if(o instanceof T.Mesh){materials.add(o.material as T.Material);geometries.add(o.geometry);expect(Array.from(o.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(true);}});
   const privateMaterials=[...materials].filter(m=>m.userData.actorMaterial);let retired=0;for(const r of [...privateMaterials,...geometries].filter(r=>!(r instanceof T.BufferGeometry)||r.userData.environmentUV))r.addEventListener('dispose',()=>retired++);disposeModel(model);expect(retired).toBeGreaterThanOrEqual(privateMaterials.length);
  });
  for(const sample of [{anchor:'entry',point:t.spawn},{anchor:'exit',point:t.exit},{anchor:'arena',point:plan.arena},...plan.spaces.map(s=>({anchor:s.name,point:s.anchor})),...(variant==='V1.1'&&id==='infested-workshop'?[{anchor:'repaired rear-strip front edge',point:{x:100,y:768}}]:[])]){
   it(label+' mixed native crowd reaches '+sample.anchor,()=>{
    const {game,movement}=l8Arena(node,sample.point,t),initial=spawnL8Cohort(game),waiting=new Set(initial.map(e=>e.id));
    for(let elapsed=0;elapsed<60000&&waiting.size;elapsed+=L8_STEP_MS){const before=movement.begin();game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);for(const e of game.enemies.snapshot.enemies)if(Math.hypot(e.x-game.player.x,e.y-game.player.y)<600&&hasClearExpeditionShot(game.geometry,game.player,e)&&waiting.delete(e.id)){const death=game.enemies.applyDamage(e.id,Math.ceil(e.health+e.armor));expect(death.died).toBe(true);}}
    expect(game.enemies.snapshot.enemies.filter(e=>waiting.has(e.id))).toEqual([]);expect(waiting.size).toBe(0);
   },20000);
   it(label+' native family attacks reach '+sample.anchor,()=>{
    const failures:unknown[]=[];
    for(const family of L8_FAMILIES){const {game,movement}=l8Arena(node,sample.point,t);for(const b of game.geometry.breaches){game.enemies.reset();game.navigation=new FacilityNavigation(game.geometry);expect(game['spawn'](family,b.x+(b.facing==='east'?56:-56),b.y)).toBe(true);let reached=false;
     for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);const e=game.enemies.snapshot.enemies[0];if(events.some(e=>e.type==='contact-attack')||family==='spitter'&&events.some(e=>e.type==='hazard-attack')&&canTraverseExpedition(game.geometry,e,game.player,9)||family==='carrier'&&Math.hypot(e.x-game.player.x,e.y-game.player.y)<=260&&hasClearExpeditionShot(game.geometry,e,game.player)){reached=true;break;}}
     if(!reached)failures.push({family,breach:b.id,end:game.enemies.snapshot.enemies[0]});}}
    expect(failures,JSON.stringify(failures)).toEqual([]);
   },20000);
  }
  it(label+' retains C6/E7 full-body, scale, outside and actual playable floor in both desktop modes',()=>{
   const marks=[...plan.spaces.map(s=>s.anchor),plan.arena,t.spawn,t.exit];
   for(const height of [1080,720])for(const reduced of [false,true])for(const mark of marks){
    const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),p=new T.Vector3(),target=new T.Vector3(),x=mark.x/32,z=mark.y/32,scale=height/1080;
    hud.resize(height*16/9,height);hud.setInsets({top:182*scale,right:292*scale,bottom:120*scale,left:0});
    const contacts=[[-140,0],[140,0],[0,-140],[0,140]].map(([dx,dy],i)=>({id:i,x:mark.x+dx,y:mark.y+dy,radius:28,health:100,windupMs:0})).filter(e=>canOccupyExpedition(g,e,e.radius));
    for(let n=0;n<180;n++){hud.selectContacts(x,z,0,contacts);combatFocusTarget(x,z,0,0,0,false,reduced,p);hud.biasTarget(x,z,0,reduced,false,p);rig.update(1/60,p.x,p.z,0,reduced);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,p,target);hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,p,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,p,target,hud.viewport);final.apply(camera,rig.focus,x,z,.5,2.05,t.width/32,t.height/32,hud.viewport,height,1/60,reduced,t.boundary,hud);}
    expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.999*scale);expect(final.diagnostics.outside).toBeLessThanOrEqual(.180001);
    for(const ix of [-1,1])for(const iz of [-1,1])for(const y of [0,2.05]){p.set(x+ix*.5,y,z+iz*.5).project(camera);expect(p.x).toBeGreaterThanOrEqual(hud.viewport.left-1e-5);expect(p.x).toBeLessThanOrEqual(hud.viewport.right+1e-5);expect(p.y).toBeGreaterThanOrEqual(hud.viewport.bottom-1e-5);expect(p.y).toBeLessThanOrEqual(hud.viewport.top+1e-5);}
    if(mark!==plan.arena)continue;for(const r of t.obstacles){const box=new T.Box3(new T.Vector3(r.x/32,0,r.y/32),new T.Vector3((r.x+r.width)/32,1,(r.y+r.height)/32));expect(projectedLandmarkShare(camera,box,hud.viewport)).toBeLessThanOrEqual(.35);}const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();let floor=0;
    for(let row=0;row<9;row++)for(let col=0;col<13;col++){ray.setFromCamera(new T.Vector2(hud.viewport.left+(col+.5)/13*(hud.viewport.right-hud.viewport.left),hud.viewport.bottom+(row+.5)/9*(hud.viewport.top-hud.viewport.bottom)),camera);if(ray.ray.intersectPlane(plane,hit)&&canOccupyExpedition(g,{x:hit.x*32,y:hit.z*32},0))floor++;}
    expect(floor/117).toBeGreaterThanOrEqual(.6);
   }
  });
 }
});
