import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {addWorldDressing,updateWorldDressing} from './world/WorldDressing';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';
import {disposeModel} from './meshParts';
import {environmentArchitecture,environmentObstacle,appendEnvironment} from './ShipEnvironments';
import {CameraRig} from './camera/CameraRig';
import {roomFocus} from './roomFraming';
import {addEnvironmentalStory} from './world/EnvironmentalStory';
import {addInteriorPracticals} from './lighting/InteriorPracticals';
import {addRoomPracticals} from './lighting/RoomPracticals';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from './camera/CombatFraming';

function platformWorld(template:typeof ROOM_TEMPLATES['armory']){
 const root=new T.Group();
 for(const r of template.obstacles){const mesh=new T.Mesh(new T.BoxGeometry(r.width/32,1,r.height/32),new T.MeshStandardMaterial());mesh.position.set((r.x+r.width/2)/32,.5,(r.y+r.height/2)/32);root.add(mesh);}
 for(const polygon of template.voids??[]){const shape=new T.Shape(polygon.map(p=>new T.Vector2(p.x/32,-p.y/32))),geometry=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1});geometry.rotateX(-Math.PI/2);root.add(new T.Mesh(geometry,new T.MeshStandardMaterial()));}
 return root;
}
function arrays(root:T.Object3D){const all:number[][]=[];root.traverse(o=>{if(o instanceof T.Mesh)all.push(Array.from(o.geometry.attributes.position.array));});return all;}
function inside(x:number,z:number,polygon:readonly {x:number;y:number}[]){let value=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)value=!value;}return value;}

describe('G2 deterministic world dressing',()=>{
 it.each(ROOM_STORY_ROUTE.map(room=>[room.templateId,room.environment] as const))('%s retains its topology and bounds the material/triangle inventory', (id,environment)=>{
  const template=ROOM_TEMPLATES[id],before=JSON.stringify(template),world=platformWorld(template),root=addWorldDressing(world,template,environment,id,1729);
  expect(JSON.stringify(template)).toBe(before);expect(root.userData.visualIdea).toBeTruthy();expect(root.children.length).toBeLessThanOrEqual(7);expect(root.userData.constructionNewFinishes).toEqual([]);
  let triangles=0;root.traverse(o=>{if(o instanceof T.Mesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;expect((o.material as T.Material).userData.actorMaterial).toBe(true);expect(Array.from(o.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);}});
  expect(triangles).toBeLessThan(12000);
  // Raised fittings stay over the original nonwalkable solids; approved hull
  // construction may extend outboard, while every interior navigation sample remains protected.
  root.traverse(object=>{
   if(!(object instanceof T.Mesh))return;
   const positions=object.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){
    if(positions.getY(i)<=.08)continue;
    const x=positions.getX(i)*32,z=positions.getZ(i)*32;
    const supported=template.obstacles.some(r=>x>=r.x-.01&&x<=r.x+r.width+.01&&z>=r.y-.01&&z<=r.y+r.height+.01)||!!template.voids?.some(polygon=>inside(x,z,polygon));
    const hull=template.boundary??[{x:0,y:0},{x:template.width,y:0},{x:template.width,y:template.height},{x:0,y:template.height}];
    expect(supported||!inside(x,z,hull),`${object.name} ${x}/${z} at ${positions.getY(i)}`).toBe(true);
   }
  });
  disposeModel(root);for(const child of world.children)if(child instanceof T.Mesh){child.geometry.dispose();(child.material as T.Material).dispose();}
 });
 it('keeps sixteen frosted observation windows inside sealed passenger rows and retires their texture',()=>{
  const t=ROOM_TEMPLATES['passenger-vault'],world=platformWorld(t),root=addWorldDressing(world,t,'cryogenics',t.id,3);
  expect(root.userData.occupiedWindows).toBe(16);
  const display=root.getObjectByName('g2-dressing-display') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
  expect(display.material.map).toBeInstanceOf(T.DataTexture);expect(display.material.roughness).toBeLessThan(.3);
  const texture=display.material.map!,image=texture.image as {width:number;height:number;data:Uint8Array};
  expect(image.width*image.height).toBeLessThanOrEqual(32768);expect(new Set(image.data).size).toBeGreaterThan(20);
  const dispose=vi.spyOn(texture,'dispose');disposeModel(root);expect(dispose).toHaveBeenCalledTimes(1);
 });
 it('roots every bounded wet patch in a visible machine outlet',()=>{
  const t=ROOM_TEMPLATES['coolant-plant'],world=platformWorld(t),root=addWorldDressing(world,t,'maintenance',t.id,3);
  const positions=root.userData.leakPositions as Array<{x:number;z:number}>;
  expect(positions.length).toBeGreaterThan(0);expect(positions.length).toBeLessThanOrEqual(3);
  for(const p of positions)expect(t.obstacles.some(r=>Math.abs(p.x*32-r.x)<8&&p.z*32>r.y&&p.z*32<r.y+r.height)).toBe(true);
  disposeModel(world);
 });
 it('owns one generated diagnostic display and retires its image with the room',()=>{
  const template=ROOM_TEMPLATES['diagnostic-gallery'],world=platformWorld(template),root=addWorldDressing(world,template,'engineering',template.id,1729);
  expect(root.userData.displayText).toEqual(['INDEPENDENT DIAGNOSTIC','OCCUPIED CRYO DECKS','PURGE IS FATAL']);
  const mesh=root.getObjectByName('g2-dressing-display') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>,texture=mesh.material.map!;
  expect(texture).toBeInstanceOf(T.DataTexture);expect(mesh.material.emissiveMap).toBe(texture);const image=texture.image as {width:number;height:number};expect(image.width*image.height).toBeLessThanOrEqual(65536);
  const retired=vi.spyOn(texture,'dispose');disposeModel(root);expect(retired).toHaveBeenCalledTimes(1);
 });
 it.each(['diagnostic-gallery','safety-interlock-station','manual-control-chamber'] as const)('%s projects the full story quad in front of all foreground hardware',id=>{
  const t=ROOM_TEMPLATES[id],world=new T.Group(),environment=id==='manual-control-chamber'?'reactor':'engineering';
  for(const [index,r] of t.obstacles.entries())appendEnvironment(world,environmentObstacle(environment,{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},index,id));
  environmentArchitecture(world,environment,t.width/32,t.height/32,id);
  const root=addWorldDressing(world,t,environment,id),display=root.userData.storyDisplay as {center:number[];corners:number[][];normal:number[]};
  addEnvironmentalStory(world,t,environment,id);
  addRoomPracticals(world,t.width/32,t.height/32,environment);addInteriorPracticals(world,t,environment);
  expect(display.corners).toHaveLength(4);
  const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig();world.updateWorldMatrix(true,true);
  const desired=new T.Vector3(),scratch=new T.Vector3(),target=new T.Vector3();
  for(const [px,pz] of [[t.spawn.x/32,t.spawn.y/32],[(id==='diagnostic-gallery'?550:560)/32,440/32]]){
  combatFocusTarget(px,pz,0,0,0,false,false,desired);
  const focus=roomFocus(desired.x,desired.z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,id);
  rig.reset(focus.x,focus.z);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);protectPlayerFrame(camera,rig.focus,px,pz,.5,2.2,scratch,target);
  const center=new T.Vector3().fromArray(display.center),normal=new T.Vector3().fromArray(display.normal);
  expect(normal.dot(camera.position.clone().sub(center).normalize())).toBeGreaterThan(.5);
  const projected=display.corners.map(v=>new T.Vector3().fromArray(v).project(camera));
  let area=0;for(let i=0;i<4;i++){const a=projected[i],b=projected[(i+1)%4];area+=a.x*b.y-a.y*b.x;expect([a.x,a.y,a.z].every(Number.isFinite)).toBe(true);expect(a.z).toBeLessThan(1);}
  expect(Math.abs(area)).toBeGreaterThan(.004);
  const ray=new T.Raycaster();
  // Dense coverage catches small lamps mounted over individual first-line
  // letters. Include the complete practical/overhead scene, as captured.
  const corners=display.corners.map(v=>new T.Vector3().fromArray(v));
  for(let column=0;column<17;column++)for(let row=0;row<7;row++){
   const u=.005+column*.99/16,v=.005+row*.99/6;
   const target=corners[0].clone().lerp(corners[1],u).lerp(corners[3].clone().lerp(corners[2],u),v);
   ray.set(camera.position,target.sub(camera.position).normalize());
   const first=ray.intersectObject(world,true)[0];expect(first,`${id} display ${u}/${v}`).toBeDefined();
   expect((first.object as T.Mesh<T.BufferGeometry,T.Material>).material.name,`${id} ${u}/${v}: ${first.object.parent?.name}/${first.object.name}/${(first.object as T.Mesh<T.BufferGeometry,T.Material>).material.type} @ ${first.point.toArray()}`).toBe('g2-dressing-display');
  }
  }
  disposeModel(world);
 });
 it('same room seed reproduces every fitting while a new seed changes clutter',()=>{
  const t=ROOM_TEMPLATES['infested-workshop'],a=platformWorld(t),b=platformWorld(t),c=platformWorld(t);
  const first=addWorldDressing(a,t,'infested',t.id,1729),same=addWorldDressing(b,t,'infested',t.id,1729),different=addWorldDressing(c,t,'infested',t.id,1730);
  expect(arrays(first)).toEqual(arrays(same));expect(arrays(first)).not.toEqual(arrays(different));
  for(const root of [a,b,c])disposeModel(root);
 });
 it('consumes the four Queen machinery islands asymmetrically inside their existing reservations',()=>{
  const t=ROOM_TEMPLATES['reactor-vault'],world=platformWorld(t),root=addWorldDressing(world,t,'reactor',t.id,1729);
  expect(root.userData.consumedArchitecture).toBe(4);expect(root.children.length).toBeLessThanOrEqual(7);
  root.traverse(object=>{if(object instanceof T.Mesh){const p=object.geometry.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)>.08){const x=p.getX(i)*32,z=p.getZ(i)*32;expect(t.obstacles.some(r=>x>=r.x-.01&&x<=r.x+r.width+.01&&z>=r.y-.01&&z<=r.y+r.height+.01)||x<0||z<0||x>t.width||z>t.height).toBe(true);}}});
  disposeModel(world);
 });
 it('pulses retained material only, freezes reduced motion, and retires every room allocation once',()=>{
  const t=ROOM_TEMPLATES['infested-workshop'],world=platformWorld(t),root=addWorldDressing(world,t,'infested',t.id,3),material=root.userData.pulseMaterial as T.MeshStandardMaterial;
  const resources=new Set<T.BufferGeometry|T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);resources.add(o.material as T.Material);}});
  const spies=[...resources].map(resource=>vi.spyOn(resource,'dispose')),oldArrays=arrays(root),count=root.children.length;
  updateWorldDressing(world,1);expect(material.emissiveIntensity).not.toBe(root.userData.growthIntensity);
  updateWorldDressing(root,90,true);expect(material.emissiveIntensity).toBe(root.userData.growthIntensity);expect(root.children.length).toBe(count);expect(arrays(root)).toEqual(oldArrays);
  disposeModel(root);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
});
