import {beforeAll,expect,it} from 'vitest';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {SHIP_FINAL_PARTITION_PLANS} from '../src/game/roguelike/shipFinalPartitions';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {generateRun} from '../src/game/roguelike/run';
import {addWorldDressing} from '../src/render/world/WorldDressing';
import {buildRoomKitDressing} from '../src/render/world/RoomKitDressing';
import {CameraRig} from '../src/render/camera/CameraRig';
import {roomFocus} from '../src/render/roomFraming';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {disposeModel} from '../src/render/meshParts';
const sources:T.Group[]=[];
beforeAll(async()=>{for(const pack of ['kenney-space-station','kenney-furniture','kenney-nature','quaternius-scifi-essentials']){
 const b=await readFile('public/assets/kits/'+pack+'/kit.glb');sources.push((await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'' )).scene);
}});
it.each(['diagnostic-gallery','safety-interlock-station'] as const)('%s live service architecture retains all119 fatal-warning rays after asynchronous kits',id=>{
 const t={...ROOM_TEMPLATES[id],...SHIP_FINAL_PARTITION_PLANS[id]!.topology},world=new T.Group();world.add(DepthRenderer.prototype['buildRoomArchitecture'].call(Object.create(DepthRenderer.prototype),generateRun(1729,3).nodes.find(n=>n.templateId===id)!,t)!);
 const dressing=addWorldDressing(world,t,'engineering',id);buildRoomKitDressing(world,t,'engineering',id,sources);world.updateWorldMatrix(true,true);
 expect(dressing.userData.displayText[2]).toBe(id==='diagnostic-gallery'?'PURGE IS FATAL':'RECORD LOCKED');
 const display=dressing.userData.storyDisplay as {corners:number[][]},corners=display.corners.map(v=>new T.Vector3().fromArray(v));
 // The actual cabinet supports a full-width physical gantry repeater.
 expect(corners[0].distanceTo(corners[1])).toBeGreaterThanOrEqual(3.2);
 const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),desired=new T.Vector3(),scratch=new T.Vector3(),targetScratch=new T.Vector3(),ray=new T.Raycaster();
 const arena=SHIP_FINAL_PARTITION_PLANS[id]!.arena;
 for(const [px,pz]of [[t.spawn.x/32,t.spawn.y/32],[arena.x/32,arena.y/32]]){
  combatFocusTarget(px,pz,0,0,0,false,false,desired);const focus=roomFocus(desired.x,desired.z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,id);rig.reset(focus.x,focus.z);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);protectPlayerFrame(camera,rig.focus,px,pz,.5,2.2,scratch,targetScratch);
  for(let column=0;column<17;column++)for(let row=0;row<7;row++){
   const u=.005+column*.99/16,v=.005+row*.99/6,target=corners[0].clone().lerp(corners[1],u).lerp(corners[3].clone().lerp(corners[2],u),v);ray.set(camera.position,target.sub(camera.position).normalize());
   const first=ray.intersectObject(world,true)[0];expect(first,`${id} ${u}/${v}`).toBeDefined();expect((first.object as T.Mesh<T.BufferGeometry,T.Material>).material.name,`${id} ${u}/${v}`).toBe('g2-dressing-display');
  }
 }
 disposeModel(world);
},30000);
