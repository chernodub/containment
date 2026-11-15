import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {SHIP_ACT4_PLANS} from '../../game/roguelike/shipArchitectureAct4';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../../game/world/expeditionGeometry';
import {CameraRig} from './CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from './CombatFraming';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';
import {projectedLandmarkShare} from './LandmarkShare';

describe('Act4 prospective plans retain the full C6/E7 encounter camera contract',()=>{
 it.each(Object.entries(SHIP_ACT4_PLANS))('%s keeps every named space in the C6/E7 camera contract',(id,plan)=>{
  const t={...ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],...plan.topology},g=createRoomTemplateGeometry(t,'framing'),marks=[...plan.spaces.map(s=>s.anchor),plan.arena,t.spawn,t.exit];
  for(const height of [1080,720])for(const reduced of [false,true])for(const mark of marks){
   const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),p=new T.Vector3(),target=new T.Vector3(),x=mark.x/32,z=mark.y/32,scale=height/1080;
   hud.resize(height*16/9,height);hud.setInsets({top:182*scale,right:292*scale,bottom:120*scale,left:0});
   const contacts=[[-140,0],[140,0],[0,-140],[0,140]].map(([dx,dy],i)=>({id:i,x:mark.x+dx,y:mark.y+dy,radius:28,health:100,windupMs:0})).filter(e=>canOccupyExpedition(g,e,e.radius));
   for(let n=0;n<180;n++){
    hud.selectContacts(x,z,0,contacts);combatFocusTarget(x,z,0,0,0,false,reduced,p);hud.biasTarget(x,z,0,reduced,false,p);
    rig.update(1/60,p.x,p.z,0,reduced);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,p,target);
    hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,p,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,p,target,hud.viewport);
    final.apply(camera,rig.focus,x,z,.5,2.05,t.width/32,t.height/32,hud.viewport,height,1/60,reduced,t.boundary,hud);
   }
   const info=JSON.stringify({id,mark,height,reduced,diag:final.diagnostics});
   expect(final.diagnostics.heroPixels,info).toBeGreaterThanOrEqual(99.999*scale);expect(final.diagnostics.outside,info).toBeLessThanOrEqual(.180001);
   for(const ix of [-1,1])for(const iz of [-1,1])for(const y of [0,2.05]){
    p.set(x+ix*.5,y,z+iz*.5).project(camera);expect(p.x,info).toBeGreaterThanOrEqual(hud.viewport.left-1e-5);expect(p.x,info).toBeLessThanOrEqual(hud.viewport.right+1e-5);expect(p.y,info).toBeGreaterThanOrEqual(hud.viewport.bottom-1e-5);expect(p.y,info).toBeLessThanOrEqual(hud.viewport.top+1e-5);
   }
   if(mark!==plan.arena)continue;
   // Each actual machine/furnishing reservation is a separate built structure.
   // The enclosure is not incorrectly counted as one gigantic decorative box.
   for(const r of t.obstacles){const box=new T.Box3(new T.Vector3(r.x/32,0,r.y/32),new T.Vector3((r.x+r.width)/32,1,(r.y+r.height)/32));expect(projectedLandmarkShare(camera,box,hud.viewport),info).toBeLessThanOrEqual(.35);}
   if(id==='containment-annulus'||id==='overload-floor'){
    const core=t.voids![0],minX=Math.min(...core.map(p=>p.x))/32,maxX=Math.max(...core.map(p=>p.x))/32,minZ=Math.min(...core.map(p=>p.y))/32,maxZ=Math.max(...core.map(p=>p.y))/32;
    const box=new T.Box3(new T.Vector3(minX,0,minZ),new T.Vector3(maxX,1.8,maxZ));expect(projectedLandmarkShare(camera,box,hud.viewport),info+' core reservation').toBeLessThanOrEqual(.35);
   }
   const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();let floor=0,total=0;
   for(let row=0;row<9;row++)for(let col=0;col<13;col++){
    ray.setFromCamera(new T.Vector2(hud.viewport.left+(col+.5)/13*(hud.viewport.right-hud.viewport.left),hud.viewport.bottom+(row+.5)/9*(hud.viewport.top-hud.viewport.bottom)),camera);
    if(ray.ray.intersectPlane(plane,hit)&&canOccupyExpedition(g,{x:hit.x*32,y:hit.z*32},0))floor++;total++;
   }
   expect(floor/total,info+' actual floor fraction').toBeGreaterThanOrEqual(.6);
  }
 });
});
