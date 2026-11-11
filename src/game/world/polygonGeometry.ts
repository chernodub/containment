import type {Point} from '../roguelike/types';
export type PolygonTopology=Readonly<{boundary?:readonly Point[];voids?:readonly (readonly Point[])[]}>;
const EPS=1e-8,EDGE_MARGIN=1e-4;
function pointSegmentDistanceSquared(p:Point,a:Point,b:Point):number {
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
 return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
}
function inside(p:Point,polygon:readonly Point[]):boolean {
 let result=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  // Only an edge whose padded bounds contain the point can satisfy distance²<EPS.
  if(p.x>=Math.min(a.x,b.x)-EDGE_MARGIN&&p.x<=Math.max(a.x,b.x)+EDGE_MARGIN
   &&p.y>=Math.min(a.y,b.y)-EDGE_MARGIN&&p.y<=Math.max(a.y,b.y)+EDGE_MARGIN
   &&pointSegmentDistanceSquared(p,a,b)<EPS)return true;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
 }return result;
}
const cross=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
function segmentDistanceSquared(a:Point,b:Point,c:Point,d:Point):number {
 if(a===b)return pointSegmentDistanceSquared(a,c,d);
 const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
 if(((abC>0&&abD<0)||(abC<0&&abD>0))&&((cdA>0&&cdB<0)||(cdA<0&&cdB>0)))return 0;
 return Math.min(pointSegmentDistanceSquared(a,c,d),pointSegmentDistanceSquared(b,c,d),pointSegmentDistanceSquared(c,a,b),pointSegmentDistanceSquared(d,a,b));
}
function clearEdges(polygon:readonly Point[],from:Point,to:Point,radius:number,minX:number,maxX:number,minY:number,maxY:number):boolean {
 const radiusSquared=radius*radius;
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length];
  // Conservative swept AABB is rejection only. Nearby edges retain the exact
  // continuous distance predicate, including concavity, tangency and thin voids.
  if(Math.max(a.x,b.x)<minX||Math.min(a.x,b.x)>maxX||Math.max(a.y,b.y)<minY||Math.min(a.y,b.y)>maxY)continue;
  const distance=segmentDistanceSquared(from,to,a,b);
  if(radius===0?distance<EPS:distance+EPS<radiusSquared)return false;
 }return true;
}
/** Continuous swept-disc test, including concave edges and arbitrarily thin voids.
 * No sampling or rectangle approximation: rendering and physics use identical edges. */
export function clearPolygonTopology(topology:PolygonTopology,from:Point,to:Point,radius=0):boolean {
 if(!Number.isFinite(from.x)||!Number.isFinite(from.y)||!Number.isFinite(to.x)||!Number.isFinite(to.y)||!Number.isFinite(radius)||radius<0)return false;
 const same=from===to,boundary=topology.boundary,voids=topology.voids;
 if(boundary&&(!inside(from,boundary)||!same&&!inside(to,boundary)))return false;
 if(voids)for(const polygon of voids)if(inside(from,polygon)||!same&&inside(to,polygon))return false;
 const margin=radius+EDGE_MARGIN,minX=Math.min(from.x,to.x)-margin,maxX=Math.max(from.x,to.x)+margin,minY=Math.min(from.y,to.y)-margin,maxY=Math.max(from.y,to.y)+margin;
 if(boundary&&!clearEdges(boundary,from,to,radius,minX,maxX,minY,maxY))return false;
 if(voids)for(const polygon of voids)if(!clearEdges(polygon,from,to,radius,minX,maxX,minY,maxY))return false;
 return true;
}
