import {expect,it} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../src/game/roguelike/shipArchitectureLayouts';
import {generateRun} from '../src/game/roguelike/run';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {addWorldDressing} from '../src/render/world/WorldDressing';
import {disposeModel} from '../src/render/meshParts';
import {CameraRig} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
import {roomFocus} from '../src/render/roomFraming';
const ids=['diagnostic-gallery','safety-interlock-station','manual-control-chamber'] as const;
it.each(ids)('%s has a full physical warning quad inside the native HUD-safe viewport at entry and fight',id=>{
 const t=ROOM_TEMPLATES[id],plan=SHIP_ARCHITECTURE_PLANS[id]!,g=createRoomTemplateGeometry(t,'display-framing'),node=generateRun(1729,3).nodes.find(n=>n.templateId===id)!,world=new T.Group();
 world.add(DepthRenderer.prototype['buildRoomArchitecture'].call(Object.create(DepthRenderer.prototype),node,t)!);const dressing=addWorldDressing(world,t,id==='manual-control-chamber'?'reactor':'engineering',id),displays=dressing.userData.storyDisplays as {corners:number[][]}[];expect(displays.length).toBeGreaterThan(0);
 const failures:unknown[]=[];
 const angle=id==='safety-interlock-station'?Math.PI*5/8:0;
 const marks=[{name:'entry',...t.spawn,angle:0,crowd:false},{name:'arena',...plan.arena,angle:0,crowd:false},{name:'native G6 retreat',x:plan.arena.x-Math.cos(angle)*133.1,y:plan.arena.y-Math.sin(angle)*133.1,angle,crowd:true}];
 for(const height of [1080,720])for(const reduced of [false,true])for(const mark of marks){
  const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),p=new T.Vector3(),target=new T.Vector3(),x=mark.x/32,z=mark.y/32,scale=height/1080;
  hud.resize(height*16/9,height);hud.setInsets(mark.crowd?{top:0,right:300*scale,bottom:160*scale,left:280*scale}:{top:182*scale,right:292*scale,bottom:120*scale,left:0});
  const contacts=mark.crowd?[170,230,290,350].flatMap(range=>Array.from({length:7},(_,i)=>({id:range+i,x:plan.arena.x+Math.cos(angle+(i-3)*.24)*range,y:plan.arena.y+Math.sin(angle+(i-3)*.24)*range,radius:28,health:100}))).filter(e=>canOccupyExpedition(g,e,28)):[];
  const initial=roomFocus(x,z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,id);rig.reset(initial.x,initial.z);
  for(let n=0;n<180;n++){
   hud.selectContacts(x,z,mark.angle,contacts,32,()=>3.2);combatFocusTarget(x,z,mark.angle,0,0,false,reduced,p);hud.biasTarget(x,z,mark.angle,reduced,false,p);
   const framed=roomFocus(p.x,p.z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,id);if(!hud.hasEngagement)p.set(framed.x,0,framed.z);
   rig.update(1/60,p.x,p.z,0,reduced);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,p,target);hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,p,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,p,target,hud.viewport);final.apply(camera,rig.focus,x,z,.5,2.05,t.width/32,t.height/32,hud.viewport,height,1/60,reduced,t.boundary,hud);
  }
  const panels=displays.map(display=>display.corners.map(c=>new T.Vector3().fromArray(c).project(camera)));
  const valid=panels.some(projected=>projected.every(c=>c.z<1&&c.x>=hud.viewport.left&&c.x<=hud.viewport.right&&c.y>=hud.viewport.bottom&&c.y<=hud.viewport.top));
  if(!valid)failures.push({id,mark:mark.name,height,reduced,panels:panels.map(p=>p.map(c=>c.toArray())),viewport:hud.viewport});
  for(const display of displays)expect(new T.Vector3().fromArray(display.corners[0]).distanceTo(new T.Vector3().fromArray(display.corners[1]))).toBeGreaterThanOrEqual(3.2);

 }
 disposeModel(world);expect(failures).toEqual([]);
});
