import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {SHIP_INGRESS_CANDIDATE_PLANS as plans} from '../src/game/roguelike/shipIngressCandidates';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import type {TemplateId} from '../src/game/roguelike/types';
import {createRoomTemplateGeometry} from '../src/game/world/expeditionGeometry';
import {CameraRig} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
describe('reviewed rear-vent ingress C6/E7 framing',()=>{
 it.each(Object.entries(plans))('%s preserves scale, AABB limit and all marine body corners with the new ingress priorities',(id,plan)=>{
  const t={...ROOM_TEMPLATES[id as TemplateId],...plan.topology},g=createRoomTemplateGeometry(t,'ingress-framing'),inward=g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y})),marks=[t.spawn,t.exit,plan.arena,...g.breaches,...inward];
  for(const height of [1080,720])for(const reduced of [false,true])for(const mark of marks){
   const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),p=new T.Vector3(),target=new T.Vector3(),x=mark.x/32,z=mark.y/32,scale=height/1080;
   hud.resize(height*16/9,height);hud.setInsets({top:182*scale,right:292*scale,bottom:120*scale,left:0});
   const contacts=inward.map((b,i)=>({id:i,...b,radius:28,health:100,windupMs:0}));
   for(let n=0;n<180;n++){
    hud.selectContacts(x,z,0,contacts);combatFocusTarget(x,z,0,0,0,false,reduced,p);hud.biasTarget(x,z,0,reduced,false,p);rig.update(1/60,p.x,p.z,0,reduced);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,p,target);
    hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,p,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,p,target,hud.viewport);final.apply(camera,rig.focus,x,z,.5,2.05,t.width/32,t.height/32,hud.viewport,height,1/60,reduced,t.boundary,hud);
   }
   const info=JSON.stringify({id,mark,height,reduced,diagnostics:final.diagnostics});expect(final.diagnostics.heroPixels,info).toBeGreaterThanOrEqual(99.999*scale);expect(final.diagnostics.outside,info).toBeLessThanOrEqual(.180001);
   for(const ix of [-1,1])for(const iz of [-1,1])for(const y of [0,2.05]){p.set(x+ix*.5,y,z+iz*.5).project(camera);expect(p.x,info).toBeGreaterThanOrEqual(hud.viewport.left-1e-5);expect(p.x,info).toBeLessThanOrEqual(hud.viewport.right+1e-5);expect(p.y,info).toBeGreaterThanOrEqual(hud.viewport.bottom-1e-5);expect(p.y,info).toBeLessThanOrEqual(hud.viewport.top+1e-5);}
  }
 });
});
