/** Offline authoring checks. Uses simulation geometry; never imported by gameplay. */
import type {Point,RoomTemplate} from './types';
import type {ShipPlan,ShipAperture} from './shipArchitecturePlan';
import {FacilityNavigation} from '../world/FacilityNavigation';
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
function properOverlap(a:readonly Point[],b:readonly Point[]):boolean {
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];
  if(cross(p,q,r)*cross(p,q,s)<-1e-6&&cross(r,s,p)*cross(r,s,q)<-1e-6)return true;
 }return false;
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
 for(let i=0;i<solids.length;i++)for(let j=0;j<i;j++)if(sharedEdge(solids[i],solids[j])||properOverlap(solids[i],solids[j])||solids[i].some(p=>strictlyInside(p,solids[j]))||solids[j].some(p=>strictlyInside(p,solids[i])))parents[root(i)]=root(j);
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
/** A claimed physical door must have actual solid flanks, with depth and width.
 * Open-floor route annotations do not become doorways merely by naming them. */
export function shipPhysicalApertureErrors(
 g:ExpeditionGeometry,
 aperture:Pick<ShipAperture,'from'|'to'> & Partial<ShipAperture>,
):string[]{
 const {from,to}=aperture,dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy),errors:string[]=[];
 if(!Number.isFinite(len)||len<140)return ['Physical aperture width must be at least140'];
 const ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
 for(const [end,sign,label]of [[from,-1,'start'],[to,1,'end']] as const){
  let supported=true;
  for(const d of [0,4,8])for(const n of [-4,0,4]){
   const p={x:end.x+ux*d*sign+nx*n,y:end.y+uy*d*sign+ny*n};
   if(canOccupyExpedition(g,p,0))supported=false;
  }
  if(!supported)errors.push(`${label}: no actual8-unit-wide/deep solid jamb`);
 }
 const c={x:(from.x+to.x)/2,y:(from.y+to.y)/2};
 if(!canOccupyExpedition(g,c,70))errors.push('Physical aperture has no140-unit clear midpoint');
 if(!canTraverseExpedition(g,{x:c.x+nx*64,y:c.y+ny*64},{x:c.x-nx*64,y:c.y-ny*64},32))errors.push('Physical aperture crossing is blocked');
 for(let d=32;d<=len-32;d+=8)if(!canOccupyExpedition(g,{x:from.x+ux*d,y:from.y+uy*d},32)){errors.push('Physical aperture span narrows or crosses solid');break;}
 if(aperture.lanes){
  const spans=aperture.lanes.map(l=>{
   const project=(p:Point)=>(p.x-from.x)*ux+(p.y-from.y)*uy;
   if(Math.abs((l.from.x-from.x)*nx+(l.from.y-from.y)*ny)>1e-6||Math.abs((l.to.x-from.x)*nx+(l.to.y-from.y)*ny)>1e-6)errors.push('Lane does not lie on physical aperture');
   return[project(l.from),project(l.to)];
  }).sort((a,b)=>a[0]-b[0]);
  for(const span of spans)if(span[0]<0||span[1]>len||span[1]-span[0]<140)errors.push('Physical aperture lane is outside the mouth or narrower than140');
  for(let i=1;i<spans.length;i++)if(spans[i][0]<spans[i-1][1])errors.push('Physical aperture lanes overlap');
  if(aperture.kind&&spans.length!==(aperture.kind==='door'?1:2))errors.push('Door/mouth lane classification does not match physical aperture');
 }
 return errors;
}
export function shipPlanOpeningErrors(plan:ShipPlan,g:ExpeditionGeometry):string[]{
 const errors:string[]=[],names=new Set(plan.spaces.map(s=>s.name));
 const hull=g.boundary??[],signed=hull.reduce((n,a,i)=>{const b=hull[(i+1)%hull.length];return n+a.x*b.y-b.x*a.y;},0);
 const reentrant=hull.filter((b,i)=>cross(hull[(i+hull.length-1)%hull.length],b,hull[(i+1)%hull.length])*signed<0);
 if(reentrant.length<4)errors.push('Boundary needs functional recesses/bays, not a convex decorative hull');
 if(plan.bays.length<2)errors.push('Need at least two hull bays tied to named sub-spaces');
 for(const bay of plan.bays){
  const space=plan.spaces.find(s=>s.name===bay.space),mid={x:(bay.from.x+bay.to.x)/2,y:(bay.from.y+bay.to.y)/2};
  if(!space||!sharedEdge([bay.from,bay.to],hull)||Math.hypot(bay.to.x-bay.from.x,bay.to.y-bay.from.y)<140||Math.hypot(space.anchor.x-mid.x,space.anchor.y-mid.y)>280)errors.push(`${bay.space}: hull bay does not correspond to its named space`);
 }
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
 for(const aperture of plan.apertures??[]){
  errors.push(...shipPhysicalApertureErrors(g,aperture).map(error=>`${aperture.name}: ${error}`));
  for(const lane of aperture.lanes)if(!plan.openings.some(o=>o.a===lane.a&&o.b===lane.b&&o.from.x===lane.from.x&&o.from.y===lane.from.y&&o.to.x===lane.to.x&&o.to.y===lane.to.y))errors.push(`${aperture.name}: physical lane is absent from circulation graph`);
 }
 // Every edge must lie on a cycle. Parallel edges represent spatially separate
 // lanes of a broad opening; the physical blocked-opening check also runs below.
 for(let removed=0;!plan.holdout&&removed<plan.openings.length;removed++){
  const seen=new Set([plan.spaces[0].name]);let changed=true;
  while(changed){changed=false;for(const [i,o]of plan.openings.entries())if(i!==removed&&(seen.has(o.a)||seen.has(o.b))){const n=seen.size;seen.add(o.a);seen.add(o.b);changed ||= n!==seen.size;}}
  if(seen.size!==names.size)errors.push(`Opening ${removed}: single-route sub-space graph`);
 }
 return errors;
}
/** Actual radius32 route after a whole declared opening is sealed. A wide
 * vestibule has two disjoint lanes; sealing either must leave the other usable. */
export function shipBlockedOpeningErrors(plan:ShipPlan,g:ExpeditionGeometry):string[]{
 if(plan.holdout)return [];
 const step=16,cols=Math.ceil(g.bounds.width/step)+1,nodes=new Map<number,Point>();
 for(let y=32;y<g.bounds.height;y+=step)for(let x=32;x<g.bounds.width;x+=step)if(canOccupyExpedition(g,{x,y},32))nodes.set(y/step*cols+x/step,{x,y});
 const adjacency=new Map<number,number[]>();
 for(const [id,p]of nodes){const edges:number[]=[];for(const delta of [-1,1,-cols,cols]){const q=nodes.get(id+delta);if(q&&canTraverseExpedition(g,p,q,32))edges.push(id+delta);}adjacency.set(id,edges);}
 const errors:string[]=[];
 for(const [i,o]of plan.openings.entries()){
  const vertical=o.from.x===o.to.x,block={x:Math.min(o.from.x,o.to.x)-(vertical?12:0),y:Math.min(o.from.y,o.to.y)-(vertical?0:12),width:vertical?24:Math.abs(o.to.x-o.from.x),height:vertical?Math.abs(o.to.y-o.from.y):24};
  const blocked={...g,blockers:[...g.blockers,block]};
  const nearby=(anchor:Point)=>[...nodes].filter(([,p])=>Math.hypot(p.x-anchor.x,p.y-anchor.y)<=step*1.5&&canTraverseExpedition(blocked,p,anchor,32)).map(([key])=>key);
  const seen=new Set<number>(),queue:number[]=[];
  if(canOccupyExpedition(blocked,plan.spaces[0].anchor,32))for(const start of nearby(plan.spaces[0].anchor)){seen.add(start);queue.push(start);}
  for(let k=0;k<queue.length;k++)for(const next of adjacency.get(queue[k])!)if(!seen.has(next)&&canTraverseExpedition(blocked,nodes.get(queue[k])!,nodes.get(next)!,32)){seen.add(next);queue.push(next);}
  for(const space of plan.spaces)if(!canOccupyExpedition(blocked,space.anchor,32)||!nearby(space.anchor).some(key=>seen.has(key)))errors.push(`Opening ${i} sealed: ${space.name} has no alternate route`);
 }return errors;
}

/** Dense marine-position contact routing for each supported enemy radius. */
export function shipNavigationErrors(g:ExpeditionGeometry):string[]{
 const errors:string[]=[];
 for(let y=48;y<g.bounds.height;y+=80)for(let x=48;x<g.bounds.width;x+=80){
  const goal={x,y};if(!canOccupyExpedition(g,goal,16))continue;
  for(const radius of [14,18,24,28]){
   const nav=new FacilityNavigation(g);
   for(const b of g.breaches){
    const p={x:b.x+(b.facing==='east'?56:-56),y:b.y,radius};let arrived=false;
    for(let i=0;i<900;i++){
     if(Math.hypot(p.x-x,p.y-y)<=radius+16+8&&canTraverseExpedition(g,p,goal,0)){arrived=true;break;}
     const q=nav.waypoint(p,goal,1)??goal,d=Math.hypot(q.x-p.x,q.y-p.y);if(d<1e-6)break;
     const n={x:p.x+(q.x-p.x)/d*Math.min(8,d),y:p.y+(q.y-p.y)/d*Math.min(8,d)};
     if(!canTraverseExpedition(g,p,n,radius))break;Object.assign(p,n);
    }
    if(!arrived)errors.push(`radius${radius} ${b.id} to ${x},${y}; stopped ${p.x},${p.y}`);
   }
  }
 }return errors;
}
