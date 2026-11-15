import type {Point,Rect,RoomTemplate} from '../../game/roguelike/types';

export type EquipmentFeed={reason:'hull-fed'|'structural-reservation'|'remote-hull'|'local-feed';path:readonly Point[]};
const polygon=(r:Rect):readonly Point[]=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
const cross=(a:Point,b:Point,p:Point)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
const inside=(p:Point,poly:readonly Point[])=>{
 let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if(Math.abs(cross(a,b,p))<1e-6&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y))return false;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;
 }return yes;
};
const shared=(a:readonly Point[],b:readonly Point[])=>a.some((p,i)=>b.some((r,j)=>{
 const q=a[(i+1)%a.length],s=b[(j+1)%b.length];if(Math.abs(cross(p,q,r))>1e-6||Math.abs(cross(p,q,s))>1e-6)return false;
 const axis=Math.abs(q.x-p.x)>Math.abs(q.y-p.y)?'x':'y';return Math.min(Math.max(p[axis],q[axis]),Math.max(r[axis],s[axis]))-Math.max(Math.min(p[axis],q[axis]),Math.min(r[axis],s[axis]))>=8;
}));
const touching=(a:readonly Point[],b:readonly Point[])=>shared(a,b)||a.some(p=>inside(p,b))||b.some(p=>inside(p,a))||a.some((p,i)=>b.some((r,j)=>{
 const q=a[(i+1)%a.length],s=b[(j+1)%b.length];return cross(p,q,r)*cross(p,q,s)<-1e-6&&cross(r,s,p)*cross(r,s,q)<-1e-6;
}));
const closest=(p:Point,a:Point,b:Point):Point=>{
 const dx=b.x-a.x,dy=b.y-a.y,f=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return {x:a.x+f*dx,y:a.y+f*dy};
};
/** One preparation-time graph. Hull-built equipment receives power inside its
 * actual wall/partition chain; structural roof reservations are not machines.
 * Only a free machine within four metres of a real hull gets an inset spur.
 * Longer installations require authored service routing, never cross-arena bars. */
export function kitEquipmentFeeds(t:RoomTemplate):(r:Rect)=>EquipmentFeed {
 const hull=t.boundary??polygon({x:0,y:0,width:t.width,height:t.height}),solids=[...t.obstacles.map(polygon),...(t.voids??[])];
 const connected=new Set<number>();solids.forEach((s,i)=>{if(shared(s,hull))connected.add(i);});
 let changed=true;while(changed){changed=false;solids.forEach((s,i)=>{if(!connected.has(i)&&[...connected].some(j=>touching(s,solids[j]))){connected.add(i);changed=true;}});}
 return r=>{
  const index=t.obstacles.findIndex(o=>o.x===r.x&&o.y===r.y&&o.width===r.width&&o.height===r.height);
  if(index<0)return {reason:'structural-reservation',path:[]};
  if(connected.has(index))return {reason:'hull-fed',path:[]};
  const machine=solids[index],candidates:{from:Point;to:Point;length:number}[]=[];
  for(let i=0;i<hull.length;i++)for(let j=0;j<machine.length;j++){
   const a=hull[i],b=hull[(i+1)%hull.length],p=machine[j],q=machine[(j+1)%machine.length];
   const to=closest(p,a,b),from=closest(a,p,q);
   candidates.push({from:p,to,length:Math.hypot(p.x-to.x,p.y-to.y)},{from,to:a,length:Math.hypot(from.x-a.x,from.y-a.y)});
  }
  const route=candidates.sort((a,b)=>a.length-b.length)[0],bend={x:route.to.x,y:route.from.y};
  if(Math.abs(route.to.x-route.from.x)+Math.abs(route.to.y-route.from.y)>128)return {reason:'remote-hull',path:[]};
  const path=[route.from,bend,route.to].filter((p,i,a)=>i===0||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>.001);
  return {reason:'local-feed',path};
 };
}
