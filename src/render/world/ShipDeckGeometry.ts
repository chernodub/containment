import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
type Plan=Pick<RoomTemplate,'width'|'height'|'boundary'|'voids'>;
const EPS=1e-7;
const cross=(a:Point,b:Point,p:Point)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
const area=(p:readonly Point[])=>p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a.x*b.y-b.x*a.y;},0)/2;
function clean(p:Point[]):Point[]{
 const result=p.filter((v,i)=>Math.hypot(v.x-p[(i+p.length-1)%p.length].x,v.y-p[(i+p.length-1)%p.length].y)>EPS);
 return result.length>=3&&Math.abs(area(result))>EPS?result:[];
}
/** Exact convex half-plane clip; cuts carry the native authored coordinates. */
function halfPlane(poly:readonly Point[],a:Point,b:Point,sign:number,inside:boolean):Point[]{
 const result:Point[]=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],dp=cross(a,b,p)*sign,dq=cross(a,b,q)*sign,acceptP=inside?dp>=-EPS:dp<=EPS,acceptQ=inside?dq>=-EPS:dq<=EPS;
  if(acceptP)result.push(p);
  if(acceptP!==acceptQ&&Math.abs(dp-dq)>EPS){const f=dp/(dp-dq);result.push({x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f});}
 }return clean(result);
}
function subtractTriangle(subject:readonly Point[],clip:readonly Point[]):Point[][]{
 const sign=area(clip)>=0?1:-1,result:Point[][]=[];let remainder:readonly Point[]=subject;
 for(let i=0;i<3&&remainder.length;i++){
  const a=clip[i],b=clip[(i+1)%3],outside=halfPlane(remainder,a,b,sign,false);if(outside.length)result.push(outside);
  remainder=halfPlane(remainder,a,b,sign,true);
 }return result;
}
function triangles(poly:readonly Point[]):Point[][]{
 return T.ShapeUtils.triangulateShape(poly.map(p=>new T.Vector2(p.x,p.y)),[]).map(row=>row.map(i=>poly[i]));
}
/** Hull minus the UNION of all sealed voids. Sequential triangle subtraction
 * handles overlap, concavity and hull-attached partitions without rasterization
 * or invalid overlapping Three.Shape holes. Construction-only CPU work. */
export function shipDeckPolygons(t:Plan):readonly (readonly Point[])[]{
 const hull=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
 let pieces=triangles(hull);
 for(const hole of t.voids??[])for(const cut of triangles(hole)){
  const minX=Math.min(...cut.map(p=>p.x)),maxX=Math.max(...cut.map(p=>p.x)),minY=Math.min(...cut.map(p=>p.y)),maxY=Math.max(...cut.map(p=>p.y));
  pieces=pieces.flatMap(poly=>{
   if(poly.every(p=>p.x<=minX+EPS)||poly.every(p=>p.x>=maxX-EPS)||poly.every(p=>p.y<=minY+EPS)||poly.every(p=>p.y>=maxY-EPS))return [poly];
   return subtractTriangle(poly,cut);
  });
 }
 return pieces;
}
/** One room-owned, non-indexed deck geometry with the original exact elevations. */
export function shipDeckGeometry(t:Plan,depth=.28,top=-.02):T.BufferGeometry{
 const parts=shipDeckPolygons(t).map(poly=>{
  const shape=new T.Shape(poly.map(p=>new T.Vector2(p.x/32,-p.y/32))),g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1,curveSegments:1});
  g.rotateX(-Math.PI/2);g.translate(0,top-depth,0);return g;
 });
 if(!parts.length){const empty=new T.BufferGeometry();for(const [name,size]of [['position',3],['normal',3],['uv',2]] as const)empty.setAttribute(name,new T.Float32BufferAttribute([],size));return empty;}
 const merged=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());return merged;
}
