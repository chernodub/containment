import {beforeAll,expect,it} from 'vitest';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {environmentArchitecture,environmentObstacle,appendEnvironment} from '../ShipEnvironments';
import {addWorldDressing} from './WorldDressing';
import {addEnvironmentalStory} from './EnvironmentalStory';
import {addInteriorPracticals} from '../lighting/InteriorPracticals';
import {addRoomPracticals} from '../lighting/RoomPracticals';
import {buildRoomKitDressing} from './RoomKitDressing';
import {CameraRig} from '../camera/CameraRig';
import {roomFocus} from '../roomFraming';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../camera/CombatFraming';
import {disposeModel} from '../meshParts';
const sources:T.Group[]=[];
beforeAll(async()=>{for(const pack of ['kenney-space-station','kenney-furniture','kenney-nature','quaternius-scifi-essentials']){const b=await readFile('public/assets/kits/'+pack+'/kit.glb');sources.push((await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'' )).scene);}});
it.each(['diagnostic-gallery','safety-interlock-station','manual-control-chamber'] as const)('%s retains all119 story-screen rays after the asynchronous kit assembly',id=>{
 const t=ROOM_TEMPLATES[id],world=new T.Group(),env=id==='manual-control-chamber'?'reactor':'engineering';
 for(const [index,r] of t.obstacles.entries())appendEnvironment(world,environmentObstacle(env,{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},index,id));
 environmentArchitecture(world,env,t.width/32,t.height/32,id);const dressing=addWorldDressing(world,t,env,id);addEnvironmentalStory(world,t,env,id);addRoomPracticals(world,t.width/32,t.height/32,env);addInteriorPracticals(world,t,env);
 buildRoomKitDressing(world,t,env,id,sources);world.updateWorldMatrix(true,true);
 const display=dressing.userData.storyDisplay as {corners:number[][]},corners=display.corners.map(v=>new T.Vector3().fromArray(v)),camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),desired=new T.Vector3(),scratch=new T.Vector3(),targetScratch=new T.Vector3(),ray=new T.Raycaster();
 for(const [px,pz] of [[t.spawn.x/32,t.spawn.y/32],[(id==='diagnostic-gallery'?550:560)/32,440/32]]){
  combatFocusTarget(px,pz,0,0,0,false,false,desired);const focus=roomFocus(desired.x,desired.z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,id);rig.reset(focus.x,focus.z);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);protectPlayerFrame(camera,rig.focus,px,pz,.5,2.2,scratch,targetScratch);
  for(let column=0;column<17;column++)for(let row=0;row<7;row++){
   const u=.005+column*.99/16,v=.005+row*.99/6,target=corners[0].clone().lerp(corners[1],u).lerp(corners[3].clone().lerp(corners[2],u),v);ray.set(camera.position,target.sub(camera.position).normalize());
   const first=ray.intersectObject(world,true)[0];expect(first,`${id} ${u}/${v}`).toBeDefined();expect((first.object as T.Mesh<T.BufferGeometry,T.Material>).material.name,`${id} ${u}/${v}`).toBe('g2-dressing-display');
  }
 }
 disposeModel(world);
},30000);
