import {it,expect} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {generateRun} from '../src/game/roguelike/run';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {addWorldDressing} from '../src/render/world/WorldDressing';
import {CameraRig} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
import {roomFocus} from '../src/render/roomFraming';
import {disposeModel} from '../src/render/meshParts';
it('bounds native foreground occlusion to the Safety battery contact plinth',()=>{
 const id='safety-interlock-station',t=ROOM_TEMPLATES[id],g=createRoomTemplateGeometry(t,'source-probe'),world=new T.Group(),node=generateRun(1729,3).nodes.find(n=>n.templateId===id)!;
 world.add(DepthRenderer.prototype['buildRoomArchitecture'].call(Object.create(DepthRenderer.prototype),node,t)!);addWorldDressing(world,t,'engineering',id);world.updateWorldMatrix(true,true);
 const battery=world.getObjectByName('split-contactor-battery')!;expect(battery).toBeDefined();const bounds=new T.Box3().setFromObject(battery),failures:Array<{x:number;y:number;height:number;dx:number;dz:number;mesh:string;hit:number[]}>=[];let probes=0;
 for(const x of[520,560,600,640,680,720,760])for(const y of[780,792,800,804]){
  if(!canOccupyExpedition(g,{x,y},16))continue;
  const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),p=new T.Vector3(),target=new T.Vector3(),mx=x/32,mz=y/32;
  hud.resize(1920,1080);hud.setInsets({top:182,right:292,bottom:120,left:0});
  for(let tick=0;tick<180;tick++){hud.selectContacts(mx,mz,0,[]);combatFocusTarget(mx,mz,0,0,0,false,false,p);hud.biasTarget(mx,mz,0,false,false,p);const f=roomFocus(p.x,p.z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,id);p.set(f.x,0,f.z);rig.update(1/60,p.x,p.z,0,false);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,p,target);protectPlayerFrame(camera,rig.focus,mx,mz,.5,2.05,p,target,hud.viewport);final.apply(camera,rig.focus,mx,mz,.5,2.05,t.width/32,t.height/32,hud.viewport,1080,1/60,false,t.boundary,hud);}
  const ray=new T.Raycaster();for(const dx of[-.5,.5])for(const dz of[-.5,.5])for(const height of[0,.95,1.45,2.05]){
   probes++;target.set(mx+dx,height,mz+dz);ray.set(camera.position,target.clone().sub(camera.position).normalize());ray.far=camera.position.distanceTo(target)-.001;
   const first=ray.intersectObject(battery,true).find(hit=>{const mesh=hit.object as T.Mesh,material=Array.isArray(mesh.material)?mesh.material[hit.face?.materialIndex??0]:mesh.material;return material&&!material.transparent&&material.visible;});if(first)failures.push({x,y,height,dx,dz,mesh:first.object.name,hit:first.point.toArray()});
  }
 }
 process.stdout.write(`[Safety source probe] battery maxY${bounds.max.y}; ${probes} native full-body/torso rays; ${failures.length} occlusions; ${JSON.stringify(failures.slice(0,8))}\n`);disposeModel(world);expect(failures.filter(f=>f.height>=.95)).toEqual([]);expect(failures.every(f=>f.mesh==='island-base'&&f.height===0&&f.hit[1]<=.310001)).toBe(true);expect(failures.length).toBeLessThanOrEqual(14);
});
