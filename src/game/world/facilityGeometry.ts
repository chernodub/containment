import { FACILITY_LAYOUT, type FacilityPoint, type FacilityProp, type FacilityRect } from './facilityLayout';
import geometry from './propGeometry.json';
export const propVisual = (prop:FacilityProp) => geometry[prop.kind];
/** Collision follows opaque sprite bounds after the same uniform scale as the art. */
export function propBounds(prop:FacilityProp):FacilityRect|null {
  const shape=propVisual(prop);if(!shape.solid)return null;
  const scale=Math.min(prop.width/shape.width,prop.height/shape.height);
  const [left,top,right,bottom]=shape.bounds as [number,number,number,number];
  const width=(right-left)*scale,height=(bottom-top)*scale;
  const cx=prop.x+prop.width/2+(left+right-shape.width)*scale/2;
  const cy=prop.y+prop.height/2+(top+bottom-shape.height)*scale/2;
  return {x:cx-width/2,y:cy-height/2,width,height};
}
export const PROP_BLOCKERS=FACILITY_LAYOUT.props.flatMap(p=>{const b=propBounds(p);return b?[b]:[];});
export const facilityBlockers=(wave:number):readonly FacilityRect[] => [
  ...FACILITY_LAYOUT.walls,...PROP_BLOCKERS,
  ...FACILITY_LAYOUT.doors.filter(d=>d.initialState==='closed'&&d.unlockWave>wave),
];
export const circleBlocked=(point:FacilityPoint,radius:number,blockers:readonly FacilityRect[]):boolean =>
  point.x<radius||point.y<radius||point.x>2560-radius||point.y>1440-radius||blockers.some(r=>{
    const dx=point.x-Math.max(r.x,Math.min(r.x+r.width,point.x));
    const dy=point.y-Math.max(r.y,Math.min(r.y+r.height,point.y));return dx*dx+dy*dy<radius*radius;
  });

/** Exact continuous disc sweep around a rectangular solid. The broad AABB is
 * rejection-only; legal rounded corners agree with native movement collision. */
export function clearRectSweep(from:FacilityPoint,to:FacilityPoint,radius:number,r:FacilityRect):boolean {
 const minX=r.x-radius,maxX=r.x+r.width+radius,minY=r.y-radius,maxY=r.y+r.height+radius;
 if(Math.max(from.x,to.x)<minX||Math.min(from.x,to.x)>maxX||Math.max(from.y,to.y)<minY||Math.min(from.y,to.y)>maxY)return true;
 const dx=to.x-from.x,dy=to.y-from.y,len=dx*dx+dy*dy;
 const inside=(p:FacilityPoint)=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height;
 if(inside(from)||inside(to))return false;
 // A center segment can enter the rectangle without approaching a corner.
 let enter=0,leave=1;
 for(const [start,delta,lo,hi]of [[from.x,dx,r.x,r.x+r.width],[from.y,dy,r.y,r.y+r.height]]){
  if(delta===0){if(start<lo||start>hi){enter=2;break;}}
  else{let a=(lo-start)/delta,b=(hi-start)/delta;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);leave=Math.min(leave,b);}
 }
 if(enter<=leave&&enter<=1&&leave>=0)return false;
 const squared=radius*radius;
 for(const p of [from,to]){const x=p.x-Math.max(r.x,Math.min(r.x+r.width,p.x)),y=p.y-Math.max(r.y,Math.min(r.y+r.height,p.y));if(x*x+y*y<squared)return false;}
 for(let i=0;i<4;i++){const x=r.x+(i%2)*r.width,y=r.y+Math.floor(i/2)*r.height,t=len?Math.max(0,Math.min(1,((x-from.x)*dx+(y-from.y)*dy)/len)):0;if((x-from.x-t*dx)**2+(y-from.y-t*dy)**2<squared)return false;}
 return true;
}
