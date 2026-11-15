import {it,expect} from 'vitest';
import * as T from 'three';
import {SHIP_SWARM_BAY_CANDIDATE,SHIP_SWARM_BAY_340_CANDIDATE,SHIP_SWARM_BAY_340_ARENA400_CANDIDATE,SHIP_SWARM_BAY_340_ARENA420_CANDIDATE} from '../src/game/roguelike/shipArchitectureSwarmBayCandidate';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors} from '../src/game/roguelike/shipPlanChecks';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {roomFocus} from '../src/render/roomFraming';
import {CameraRig} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
import {projectedLandmarkShare} from '../src/render/camera/LandmarkShare';
for(const [depth,map]of[[300,SHIP_SWARM_BAY_CANDIDATE],[340,SHIP_SWARM_BAY_340_CANDIDATE],['340-arena400',SHIP_SWARM_BAY_340_ARENA400_CANDIDATE],['340-arena420',SHIP_SWARM_BAY_340_ARENA420_CANDIDATE]] as const){
 const plan=map['swarm-junction'],t={...ROOM_TEMPLATES['swarm-junction'],...plan.topology},g=createRoomTemplateGeometry(t,'swarm-depth-study');
 it(`dormant depth${depth} retains connected area, real two-route openings and R38/R144 margins`,()=>{
  const stats=shipSolidStatistics(t);expect(stats.walkableArea/950800).toBeGreaterThanOrEqual(.8);expect(stats.walkableArea/950800).toBeLessThanOrEqual(1.2);expect(stats.connectedFraction).toBeGreaterThanOrEqual(.6);expect(stats.freeGroups).toBeLessThanOrEqual(2);expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);
  for(const q of[t.spawn,t.exit,...g.breaches,...g.breaches.flatMap(b=>[-56,56].map(dx=>({x:b.x+dx,y:b.y})))])expect(canOccupyExpedition(g,q,38)).toBe(true);
  process.stdout.write(`[Swarm depth${depth} geometry] ${JSON.stringify(stats)}; ratio${stats.walkableArea/950800}\n`);
 });
 it(`dormant depth${depth} honestly measures main-camera context in quiet/crowded and frozen presentation`,()=>{
  for(const crowded of[false,true])for(const frozen of[false,true])for(const reduced of[false,true]){
   const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),p=new T.Vector3(),target=new T.Vector3(),x=plan.arena.x/32,z=plan.arena.y/32;
   hud.resize(1920,1080);hud.setInsets({top:182,right:292,bottom:120,left:0});const contacts=crowded?[[-140,0],[140,0],[0,-140],[0,140]].map(([dx,dy],i)=>({id:i,x:plan.arena.x+dx,y:plan.arena.y+dy,radius:28,health:100})).filter(e=>canOccupyExpedition(g,e,28)):[];
   for(let tick=0;tick<180+(frozen?120:0);tick++){const dt=tick<180?1/60:0;hud.selectContacts(x,z,0,contacts);combatFocusTarget(x,z,0,0,0,false,reduced,p);hud.biasTarget(x,z,0,reduced,false,p);if(!hud.hasEngagement){const focus=roomFocus(p.x,p.z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,'swarm-junction');p.set(focus.x,0,focus.z);}rig.update(dt,p.x,p.z,0,reduced);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,p,target);hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,p,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,p,target,hud.viewport);final.apply(camera,rig.focus,x,z,.5,2.05,t.width/32,t.height/32,hud.viewport,1080,dt,reduced,t.boundary,hud);}
   expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.999);expect(final.diagnostics.outside).toBeLessThanOrEqual(.180001);
   const shares=t.voids!.map(poly=>{const box=new T.Box3();for(const q of poly){box.expandByPoint(new T.Vector3(q.x/32,0,q.y/32));box.expandByPoint(new T.Vector3(q.x/32,.91,q.y/32));}return projectedLandmarkShare(camera,box,hud.viewport);});shares.forEach(s=>expect(s).toBeLessThanOrEqual(.35));
   const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();let floor=0;for(let row=0;row<9;row++)for(let col=0;col<13;col++){ray.setFromCamera(new T.Vector2(hud.viewport.left+(col+.5)/13*(hud.viewport.right-hud.viewport.left),hud.viewport.bottom+(row+.5)/9*(hud.viewport.top-hud.viewport.bottom)),camera);if(ray.ray.intersectPlane(plane,hit)&&canOccupyExpedition(g,{x:hit.x*32,y:hit.z*32},0))floor++;}expect(floor/117).toBeGreaterThanOrEqual(.6);
   process.stdout.write(`[Swarm depth${depth} F2] ${JSON.stringify({crowded,frozen,reduced,hero:final.diagnostics.heroPixels,floor:floor/117,shares,northCombined:shares[0]+shares[1]})}\n`);
  }
 });
}
