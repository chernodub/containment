import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,RoomTemplate} from '../game/roguelike/types';
import {clearPolygonTopology} from '../game/world/polygonGeometry';

type Plan=Pick<RoomTemplate,'voids'> & Partial<Pick<RoomTemplate,'boundary'|'obstacles'>>;
/** Index0 is the retained diagonal penetrator. Extra solids are real ship
 * partitions, never another copy of the organic colony. Legacy plans have one. */
export const room8OrganicVoids=(t:Plan):readonly (readonly Point[])[]=>t.voids?.slice(0,1)??[];
export const room8RepairVoids=(t:Plan):readonly (readonly Point[])[]=>t.voids?.slice(1)??[];
export const room8UsesAuthoredLoadingFloor=(t:Plan):boolean=>room8RepairVoids(t).length>0;

/** A low, closed repair trunk joins the scar to the hull. Owns all resources;
 * no caches, lights, colliders or simulation state. Rooted fixtures are metadata
 * for the existing practical-light owner. At most three material draws. */
export function room8RepairArchitecture(t:Plan):T.Group{
 const root=new T.Group();root.name='room8-repair-architecture';
 const solids=room8RepairVoids(t);if(!solids.length)return root;
 root.userData.replacesLegacyLoadingFloor=true;
 const finish=(name:string,color:number,metalness:number,roughness:number)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});m.name=name;m.userData.actorMaterial=true;return m;};
 const body=finish('room8-repair-casing',0x35484b,.56,.83),edge=finish('room8-repair-joints',0x657175,.64,.7),lamp=finish('room8-repair-fixture',0xd5a672,.3,.5);
 lamp.emissive.setHex(0x9e5e2f);lamp.emissiveIntensity=.65;
 const parts=new Map<T.Material,T.BufferGeometry[]>();
 const add=(g:T.BufferGeometry,m:T.Material)=>{const a=g.index?g.toNonIndexed():g;if(a!==g)g.dispose();const list=parts.get(m)??[];list.push(a);parts.set(m,list);};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const g=new T.BoxGeometry(w/32,h,d/32);g.translate(x/32,y,z/32);add(g,m);};
 const fixtures:{x:number;y:number;z:number;color:number}[]=[];
 for(const solid of solids){
  const shape=new T.Shape(solid.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  const g=new T.ExtrudeGeometry(shape,{depth:.84,steps:1,bevelEnabled:false});g.rotateX(-Math.PI/2);add(g,body);
  const xs=solid.map(p=>p.x),ys=solid.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),x=(x0+x1)/2;
  // Captive access cover and two structural lap seams, fitted inside the trunk.
  // The cover belongs to the repair, rather than repeating a mat on every solid.
  box(x,.845,(y0+y1)/2,x1-x0-16,.01,Math.min(64,y1-y0-24),edge);
  for(const y of [y0+12,y1-12])box(x,.85,y,x1-x0-8,.012,3,edge);
  box(x,.858,y0+7,Math.min(56,x1-x0-16),.016,3,lamp);
  fixtures.push({x:x/32,y:.866,z:(y0+7)/32,color:0x9e5e2f});
 }
 const guides:{bed:number;x:number;z:number;length:number}[]=[];
 const flush=(x:number,z:number,width:number,depth:number,m:T.Material,y:number)=>{
  const corners=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([sx,sz])=>({x:x+sx*width/2,y:z+sz*depth/2}));
  if(!corners.every((p,i)=>clearPolygonTopology(t,p,p)&&clearPolygonTopology(t,p,corners[(i+1)%4])&&(t.obstacles??[]).every(r=>p.x<r.x||p.x>r.x+r.width||p.y<r.y||p.y>r.y+r.height)))return;
  box(x,y,z,width,.004,depth,m);
 };
 // Only the two real loading beds receive guide channels. Their axes and stop
 // points derive from the live stock; the turning floor receives no scatter.
 for(const [i,r]of (t.obstacles??[]).entries())for(const x of [r.x+8,r.x+r.width-8]){
  const z=r.y-68,length=88;flush(x,z,7,length,body,.012);flush(x+1.5,z,1.5,length,edge,.017);
  guides.push({bed:i,x,z,length});
 }
 for(const [m,list]of parts){const g=mergeGeometries(list,false)!;list.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,m);mesh.name=m.name;mesh.userData.bakedEnvironment=true;mesh.castShadow=m!==lamp;mesh.receiveShadow=true;root.add(mesh);}
 root.userData.lightFixtures=fixtures;
 root.userData.loadingGuides=guides;
 return root;
}
