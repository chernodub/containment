import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,Rect,RoomTemplate} from '../../game/roguelike/types';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';
import {environmentObstacle} from '../ShipEnvironments';
import {safetyInterlockArchitecture} from '../SafetyInterlockArchitecture';

export const ACT3_PRESENTATION_ROOMS:ReadonlySet<string>=new Set(['diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop']);
export type Act3Fixture=Readonly<{x:number;y:number;z:number;color:number;nativeColor:true;poolStyle:1;poolAngle:number;poolWidth:number;poolDepth:number;gain:number}>;
/** Called once alongside the template hull builder (or the bespoke shaft).
 * Replaces generic obstacle dispatch in all four non-shaft rooms. Existing
 * source recorder/AI, workshop mechanics and their owned materials remain whole.
 * Fixture coordinates are render metres; construction coordinates below are
 * simulation units. All raised geometry occupies a live solid or hull edge. */
export function act3ShipPresentation(id:string,t:RoomTemplate):T.Group|null {
 if(!ACT3_PRESENTATION_ROOMS.has(id))return null;
 const root=new T.Group();root.name='l8-act3-presentation';root.userData.roomId=id;
 const material=(name:string,color:number,metalness=.25,roughness=.86)=>{
  const m=new T.MeshStandardMaterial({name:`act3-${name}`,color,metalness,roughness});m.userData.actorMaterial=true;return m;
 };
 const steel=material('painted-casings',0x53636b,.4),edge=material('machined-edges',0x87958e,.6,.66),dark=material('service-recess',0x17272e,.25,.94),paint=material('worn-service-mark',0x82765b,.15,.94),lamp=material('diffuser',0xb8d4cf,.1,.76),resin=material('seam-resin',0x343e31,0,.98);
 lamp.emissive.setHex(0x85b6bc);lamp.emissiveIntensity=.55;lamp.userData.motivatedEmitter=true;
 const batches=new Map<T.Material,T.BufferGeometry[]>();
 const push=(g:T.BufferGeometry,m:T.Material)=>{const part=g.index?g.toNonIndexed():g.clone();g.dispose();const parts=batches.get(m)??[];parts.push(part);batches.set(m,parts);};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,angle=0)=>push(new T.BoxGeometry(w/32,h/32,d/32).rotateY(angle).translate(x/32,y/32,z/32),m);
 const cylinder=(x:number,y:number,z:number,r:number,length:number,m:T.Material,axis:'x'|'z'|'y'='z')=>{
  const g=new T.CylinderGeometry(r/32,r/32,length/32,12,1);if(axis==='z')g.rotateX(Math.PI/2);else if(axis==='x')g.rotateZ(Math.PI/2);g.translate(x/32,y/32,z/32);push(g,m);
 };
 const tube=(a:readonly[number,number,number],b:readonly[number,number,number],radius:number,m:T.Material)=>{
  const p=new T.Vector3(...a).divideScalar(32),q=new T.Vector3(...b).divideScalar(32),g=new T.CylinderGeometry(radius/32,radius/32,p.distanceTo(q),10,1);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),q.clone().sub(p).normalize()));g.translate((p.x+q.x)/2,(p.y+q.y)/2,(p.z+q.z)/2);push(g,m);
 };
 const floorSupported=(x:number,z:number,w:number,d:number)=>{
  const corners=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([sx,sz])=>({x:x+sx*w/2,y:z+sz*d/2}));
  const clear=(a:Point,b:Point)=>clearPolygonTopology(t,a,b)&&t.obstacles.every(r=>{
   // The strip's axis-aligned box, rather than only its center, stays off bases.
   const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x),minY=Math.min(a.y,b.y),maxY=Math.max(a.y,b.y);
   return maxX<r.x||minX>r.x+r.width||maxY<r.y||minY>r.y+r.height;
  });
  return corners.every((p,i)=>clear(p,p)&&clear(p,corners[(i+1)%4]))&&clear(corners[0],corners[2])&&clear(corners[1],corners[3]);
 };
 const floorLine=(a:Point,b:Point,width:number,m:T.Material)=>{
  const dx=b.x-a.x,dz=b.y-a.y,length=Math.hypot(dx,dz),count=Math.ceil(length/32),alongX=dz===0;
  for(let j=0;j<count;j++){
   const f=(j+.5)/count,x=a.x+dx*f,z=a.y+dz*f,w=alongX?length/count:width,d=alongX?width:length/count;
   if(floorSupported(x,z,w,d))box(x,.35,z,w,.22,d,m);
  }
 };
 const fixtures:Act3Fixture[]=[];root.userData.lightFixtures=fixtures;
 const fixture=(x:number,z:number,angle:number,width:number,depth:number,color:number,gain:number,y=1.30)=>{
  if(y>.9)box(x,(y*32+28)/2,z,3,y*32-28,3,edge);
  box(x,y*32-1.5,z,52,5,7,dark,angle);box(x,y*32,z,46,2.2,2.5,gain<.2?dark:lamp,angle);
  fixtures.push({x:x/32,y,z:z/32,color,nativeColor:true,poolStyle:1,poolAngle:angle,poolWidth:width,poolDepth:depth,gain});
 };
 const machinery=(r:Rect,index:number)=>{
  const x=r.x+r.width/2,z=r.y+r.height/2,w=r.width-16,d=r.height-16;
  // Continuous waist-height roof owns the story display's 119-ray support plane.
  // Its inset panel and service drawer are manufactured equipment, not floor pads.
  box(x,14,z,w,28,d,steel);box(x,28.6,z,w-7,1.2,d-7,edge);
  const count=Math.max(1,Math.round(w/112));
  for(let n=0;n<count;n++){
   const cx=r.x+8+(n+.5)*w/count;
   box(cx,17,r.y+r.height-7,w/count-5,15,2,dark);
   box(cx,17,r.y+r.height-5,w/count-18,12,1,steel);
   box(cx,22,r.y+r.height-4,13,2,1,edge);
  }
  // One recessed reading face per bank: no tiling of free-standing consoles.
  box(x,29.4,z,w*.46,.6,Math.min(d*.38,25),dark);
  if(index===0)box(x-16,29.8,z,20,.5,4,paint);
 };
 if(id==='diagnostic-gallery'){
  t.obstacles.forEach(machinery);
  floorLine({x:216,y:272},{x:1064,y:272},1.1,dark);
  floorLine({x:216,y:704},{x:1064,y:704},1.1,dark);
  fixture(390,126,0,.45,7.2,0xb2dadd,1);fixture(710,826,Math.PI,.40,6.0,0xcdb88e,.42);fixture(1084,180,Math.PI/2,.30,4.5,0x98b4c4,.12);
 }else if(id==='safety-interlock-station'){
  const equipment=new T.Group();equipment.name='act3-source-equipment';root.add(equipment);
  for(const [i,r]of t.obstacles.entries())equipment.add(environmentObstacle('engineering',{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},i,id));
  safetyInterlockArchitecture(root,t.width/32,t.height/32,t);
  fixture(370,176,0,.40,6.3,0xb8d8dd,.92);fixture(910,176,0,.35,5.2,0xb0bfbe,.12);fixture(640,824,Math.PI,.35,5.7,0xc9ad82,.38);fixture(528,370,-Math.PI/2,.30,4.5,0xb2d5d7,.46,.84);
 }else if(id==='coolant-plant'){
  for(const [i,r]of t.obstacles.entries()){
   const x=r.x+r.width/2,z=r.y+r.height/2,w=r.width-16,d=r.height-16;
   box(x,3,z,w,6,d,dark);
   // Two serviceable horizontal pump barrels share a wall manifold. A valve
   // operator can use either gallery; the center bank is a low return manifold.
   const radius=Math.min(23,w*.17,d*.15),height=i>=4?20:24;
   for(const side of [-1,1]){
    const px=x+side*w*.23;
    cylinder(px,height,z,radius,d*.78,steel);
    for(const dz of [-d*.36,d*.36]){
     cylinder(px,height,z+dz,radius+3,5,edge);
     box(px,9,z+dz,radius*1.8,12,18,dark);
    }
    cylinder(px,height+radius+3,z,6,7,edge,'y');
    cylinder(px,height+radius+8,z,13,2.5,paint,'y');
    box(px,height+radius+10,z,21,2,3,dark);
   }
   // The header is fitted inside the footprint, never suspended across a lane.
   tube([x-w*.28,14,z-d*.40],[x+w*.28,14,z-d*.40],5,edge);
  }
  floorLine({x:280,y:320},{x:280,y:640},1.6,dark);floorLine({x:280,y:640},{x:1080,y:640},1.6,dark);floorLine({x:1080,y:640},{x:1080,y:320},1.6,dark);
  fixture(256,180,-Math.PI/2,.4,7.2,0x9ccbd3,.88);fixture(1104,180,Math.PI/2,.35,6.2,0xb0d2d0,.30);fixture(1104,780,Math.PI/2,.4,6.4,0xcdb18d,.48);fixture(256,780,-Math.PI/2,.3,5.8,0x9fbfc7,.16);
 }else if(id==='service-shaft-landing'){
  // Source machinery, texture grain and the local task light remain in the
  // bespoke builder. These two sources reveal actual docking recesses only.
  fixture(1060,6,0,.35,5.4,0xa8c9d0,.56);fixture(1060,874,Math.PI,.3,5.2,0xc4a376,.28,.78);
 }else if(id==='infested-workshop'){
  const equipment=new T.Group();equipment.name='act3-source-equipment';root.add(equipment);
  for(const [i,r]of t.obstacles.entries()){
   const source=environmentObstacle('infested',{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},i,id);
   // Foreground workbench and stock do not form a tall actor-hiding wall.
   if(i===1||i===3){const bounds=new T.Box3().setFromObject(source);source.scale.y=Math.min(1,.90/(bounds.max.y||1));}
   equipment.add(source);
  }
  // Growth uses the actual lathe separator, torn doorway and return partition.
  // All segments sit on solid roof/seam surfaces, with no free floor islands.
  for(const points of [[[572,29,24],[572,29,112],[572,29,186]],[[1108,29,450],[1032,29,450],[1092,29,456],[1092,29,548]],[[472,29,876],[472,29,932],[472,29,986]]] as const){
   for(let i=1;i<points.length;i++)tube(points[i-1],points[i],2.4+(i%2)*.5,resin);
  }
  floorLine({x:488,y:820},{x:488,y:982},.9,dark);floorLine({x:1012,y:320},{x:1012,y:430},.9,dark);
  fixture(800,6,0,.40,6.4,0xa8c7bc,.45);fixture(572,170,-Math.PI/2,.30,4.5,0xb7c9c5,.58,.86);fixture(1108,528,Math.PI/2,.28,4.8,0xc8aa85,.22,.84);
 }
 for(const [m,parts]of batches){
  const merged=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());merged.userData.environmentUV=true;
  const mesh=new T.Mesh(merged,m);mesh.name=`act3-batch-${m.name}`;mesh.userData.bakedEnvironment=true;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 }
 // Unused room-private finishes still have one disposal owner.
 for(const m of [steel,edge,dark,paint,lamp,resin])if(!batches.has(m))m.dispose();
 root.userData.replacesGenericObstacles=id!=='service-shaft-landing';
 return root;
}
