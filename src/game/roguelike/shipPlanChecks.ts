/** Offline authoring checks. Uses simulation geometry; never imported by gameplay. */
import type {Point,RoomTemplate} from './types';
import type {ShipPlan} from './shipArchitectureStandards';
import {canOccupyExpedition,canTraverseExpedition,type ExpeditionGeometry} from '../world/expeditionGeometry';
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export function insidePlanPolygon(p:Point,poly:readonly Point[]):boolean {
 let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;
 }return yes;
}
function strictlyInside(p:Point,poly:readonly Point[]):boolean {
 if(!insidePlanPolygon(p,poly))return false;
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(Math.abs(cross(a,b,p))<1e-6&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y))return false;}return true;
}
function sharedEdge(a:readonly Point[],b:readonly Point[]):boolean {
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];
  if(Math.abs(cross(p,q,r))>1e-6||Math.abs(cross(p,q,s))>1e-6)continue;
  const axis=Math.abs(q.x-p.x)>Math.abs(q.y-p.y)?'x':'y';
  if(Math.min(Math.max(p[axis],q[axis]),Math.max(r[axis],s[axis]))-Math.max(Math.min(p[axis],q[axis]),Math.min(r[axis],s[axis]))>=8)return true;
 }return false;
}
export function shipSolidStatistics(t:RoomTemplate){
 const hull=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
 const solids=[...t.obstacles.map(r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}]),...(t.voids??[])];
 const parents=solids.map((_,i)=>i),root=(i:number):number=>parents[i]===i?i:parents[i]=root(parents[i]);
 for(let i=0;i<solids.length;i++)for(let j=0;j<i;j++)if(sharedEdge(solids[i],solids[j])||solids[i].some(p=>strictlyInside(p,solids[j]))||solids[j].some(p=>strictlyInside(p,solids[i])))parents[root(i)]=root(j);
 const connected=new Set(solids.flatMap((poly,i)=>sharedEdge(poly,hull)?[root(i)]:[]));
 let solidArea=0,connectedArea=0,walkableArea=0;
 const used=new Set<number>();
 for(let y=1;y<t.height;y+=2)for(let x=1;x<t.width;x+=2){const p={x,y};if(!insidePlanPolygon(p,hull))continue;
  const hits=solids.flatMap((poly,i)=>insidePlanPolygon(p,poly)?[root(i)]:[]);
  if(!hits.length){walkableArea+=4;continue;}solidArea+=4;
  if(hits.some(i=>connected.has(i)))connectedArea+=4;else hits.forEach(i=>used.add(i));
 }
 return {solidArea,connectedArea,connectedFraction:connectedArea/solidArea,freeGroups:used.size,walkableArea};
}
export function shipPlanOpeningErrors(plan:ShipPlan,g:ExpeditionGeometry):string[]{
 const errors:string[]=[],names=new Set(plan.spaces.map(s=>s.name));
 const hull=g.boundary??[],signed=hull.reduce((n,a,i)=>{const b=hull[(i+1)%hull.length];return n+a.x*b.y-b.x*a.y;},0);
 const reentrant=hull.filter((b,i)=>cross(hull[(i+hull.length-1)%hull.length],b,hull[(i+1)%hull.length])*signed<0);
 if(reentrant.length<4)errors.push('Boundary needs functional recesses/bays, not a convex decorative hull');
 if(names.size<3||names.size!==plan.spaces.length)errors.push('Need at least three distinct named sub-spaces');
 for(const s of plan.spaces)if(!insidePlanPolygon(s.anchor,s.outline)||!canOccupyExpedition(g,s.anchor,32))errors.push(`${s.name}: invalid sub-space anchor`);
 for(const [i,o]of plan.openings.entries()){
  const dx=o.to.x-o.from.x,dy=o.to.y-o.from.y,len=Math.hypot(dx,dy),c={x:(o.from.x+o.to.x)/2,y:(o.from.y+o.to.y)/2};
  if(!names.has(o.a)||!names.has(o.b)||o.a===o.b)errors.push(`Opening ${i}: invalid space names`);
  if(len<140)errors.push(`Opening ${i}: ${len} <140`);
  if(!canOccupyExpedition(g,c,70))errors.push(`Opening ${i}: no 140-unit clear width`);
  if(len>=140)for(let d=32;d<=len-32;d+=8){const point={x:o.from.x+dx*d/len,y:o.from.y+dy*d/len};if(!canOccupyExpedition(g,point,32)){errors.push(`Opening ${i}: declared span narrows inside the opening`);break;}}
  const sideA={x:c.x-dy/len*64,y:c.y+dx/len*64},sideB={x:c.x+dy/len*64,y:c.y-dx/len*64};
  const a=plan.spaces.find(s=>s.name===o.a),b=plan.spaces.find(s=>s.name===o.b);
  if(a&&b&&!((insidePlanPolygon(sideA,a.outline)&&insidePlanPolygon(sideB,b.outline))||(insidePlanPolygon(sideB,a.outline)&&insidePlanPolygon(sideA,b.outline))))errors.push(`Opening ${i}: does not join its declared sub-spaces`);
  if(!canTraverseExpedition(g,{x:c.x-dy/len*64,y:c.y+dx/len*64},{x:c.x+dy/len*64,y:c.y-dx/len*64},32))errors.push(`Opening ${i}: blocked threshold crossing`);
 }
 // Every edge must lie on a cycle. Parallel edges represent spatially separate
 // lanes of a broad opening; the physical blocked-opening check also runs below.
 for(let removed=0;removed<plan.openings.length;removed++){
  const seen=new Set([plan.spaces[0].name]);let changed=true;
  while(changed){changed=false;for(const [i,o]of plan.openings.entries())if(i!==removed&&(seen.has(o.a)||seen.has(o.b))){const n=seen.size;seen.add(o.a);seen.add(o.b);changed ||= n!==seen.size;}}
  if(seen.size!==names.size)errors.push(`Opening ${removed}: single-route sub-space graph`);
 }
 return errors;
}
/** Actual radius32 route after a whole declared opening is sealed. A wide
 * vestibule has two disjoint lanes; sealing either must leave the other usable. */
export function shipBlockedOpeningErrors(plan:ShipPlan,g:ExpeditionGeometry):string[]{
 const step=16,cols=Math.ceil(g.bounds.width/step)+1,nodes=new Map<number,Point>();
 for(let y=32;y<g.bounds.height;y+=step)for(let x=32;x<g.bounds.width;x+=step)if(canOccupyExpedition(g,{x,y},32))nodes.set(y/step*cols+x/step,{x,y});
 const adjacency=new Map<number,number[]>();
 for(const [id,p]of nodes){const edges:number[]=[];for(const delta of [-1,1,-cols,cols]){const q=nodes.get(id+delta);if(q&&canTraverseExpedition(g,p,q,32))edges.push(id+delta);}adjacency.set(id,edges);}
 const nearest=(p:Point)=>[...nodes].reduce((a,b)=>Math.hypot(b[1].x-p.x,b[1].y-p.y)<Math.hypot(a[1].x-p.x,a[1].y-p.y)?b:a)[0];
 const anchors=plan.spaces.map(s=>nearest(s.anchor)),errors:string[]=[];
 for(const [i,o]of plan.openings.entries()){
  const vertical=o.from.x===o.to.x,block={x:Math.min(o.from.x,o.to.x)-(vertical?12:0),y:Math.min(o.from.y,o.to.y)-(vertical?0:12),width:vertical?24:Math.abs(o.to.x-o.from.x),height:vertical?Math.abs(o.to.y-o.from.y):24};
  const blocked={...g,blockers:[...g.blockers,block]};
  const seen=new Set<number>(),queue:number[]=[];
  if(canOccupyExpedition(blocked,nodes.get(anchors[0])!,32)){seen.add(anchors[0]);queue.push(anchors[0]);}
  for(let k=0;k<queue.length;k++)for(const next of adjacency.get(queue[k])!)if(!seen.has(next)&&canTraverseExpedition(blocked,nodes.get(queue[k])!,nodes.get(next)!,32)){seen.add(next);queue.push(next);}
  for(const [j,a]of anchors.entries())if(!seen.has(a))errors.push(`Opening ${i} sealed: ${plan.spaces[j].name} has no alternate route`);
 }return errors;
}
