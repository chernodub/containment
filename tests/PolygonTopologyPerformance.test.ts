import {expect,it} from 'vitest';
import {clearPolygonTopology} from '../src/game/world/polygonGeometry';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import type {Point} from '../src/game/roguelike/types';
type PolygonTopology=Readonly<{boundary?:readonly Point[];voids?:readonly (readonly Point[])[]}>;
const EPS=1e-8;
function pointSegmentDistanceSquared(p:Point,a:Point,b:Point):number {
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
 return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
}
function inside(p:Point,polygon:readonly Point[]):boolean {
 let result=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  if(pointSegmentDistanceSquared(p,a,b)<EPS)return true;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
 }return result;
}
function segmentDistanceSquared(a:Point,b:Point,c:Point,d:Point):number {
 if(a===b)return pointSegmentDistanceSquared(a,c,d);
 const cross=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
 if(((abC>0&&abD<0)||(abC<0&&abD>0))&&((cdA>0&&cdB<0)||(cdA<0&&cdB>0)))return 0;
 return Math.min(pointSegmentDistanceSquared(a,c,d),pointSegmentDistanceSquared(b,c,d),pointSegmentDistanceSquared(c,a,b),pointSegmentDistanceSquared(d,a,b));
}
/** Continuous swept-disc test, including concave edges and arbitrarily thin voids.
 * No sampling or rectangle approximation: rendering and physics use identical edges. */
function reference(topology:PolygonTopology,from:Point,to:Point,radius=0):boolean {
 if(![from.x,from.y,to.x,to.y,radius].every(Number.isFinite)||radius<0)return false;
 if(topology.boundary&&(!inside(from,topology.boundary)||!inside(to,topology.boundary)))return false;
 if(topology.voids?.some(p=>inside(from,p)||inside(to,p)))return false;
 const polygons=topology.boundary?[topology.boundary,...topology.voids??[]]:topology.voids??[];
 for(const polygon of polygons)for(let i=0;i<polygon.length;i++){
  const distance=segmentDistanceSquared(from,to,polygon[i],polygon[(i+1)%polygon.length]);
  if(radius===0?distance<EPS:distance+EPS<radius*radius)return false;
 }return true;
}


it('matches the original continuous predicate across every authored polygon, edge and epsilon boundary',()=>{
 let seed=1729;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const template of Object.values(ROOM_TEMPLATES)){
  for(let i=0;i<500;i++){
   const from={x:random()*template.width,y:random()*template.height},to=i%3?{x:random()*template.width,y:random()*template.height}:from;
   const radius=[0,12,28,36][i%4];
   expect(clearPolygonTopology(template,from,to,radius)).toBe(reference(template,from,to,radius));
  }
  for(const polygon of [template.boundary,...template.voids??[]])if(polygon)for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],length=Math.hypot(b.x-a.x,b.y-a.y)||1;
   for(const distance of [-28,-.00011,-.000099,0,.000099,.00011,28]){
    const p={x:(a.x+b.x)/2-(b.y-a.y)/length*distance,y:(a.y+b.y)/2+(b.x-a.x)/length*distance};
    for(const radius of [0,1e-200,28])expect(clearPolygonTopology(template,p,p,radius)).toBe(reference(template,p,p,radius));
   }
  }
 }
});

it('does not cache mutable topology or accept nonfinite probes',()=>{
 const topology={boundary:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]},p={x:50,y:50};
 expect(clearPolygonTopology(topology,p,p,1)).toBe(true);topology.boundary[1].x=10;topology.boundary[2].x=10;
 expect(clearPolygonTopology(topology,p,p,1)).toBe(false);
 expect(clearPolygonTopology({},p,{x:NaN,y:1})).toBe(false);
});


it('bounds steady query arithmetic without a wall-clock timing assertion',()=>{
 const topology={boundary:[{x:0,y:0},{x:1000,y:0},{x:1000,y:1000},{x:0,y:1000}]};
 let reads=0;const p={get x(){reads++;return 500;},get y(){reads++;return 500;}};
 expect(reference(topology,p,p,28)).toBe(true);const previous=reads;reads=0;
 expect(clearPolygonTopology(topology,p,p,28)).toBe(true);expect(reads).toBeLessThan(previous*.5);
});
