import type * as T from 'three';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
import type {ShipPlan} from '../../game/roguelike/shipArchitecturePlan';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';

const U=32;
export const ACT4_MOUNTED_INGRESS=new Set(['swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor']);
type Frame=Readonly<{center:Point;tangent:Point;normal:Point;face:readonly [Point,Point];width:number}>;
export type IngressPart={name:string;material:string;start:number;end:number;center:number[];size:number[];angle:number};
export type MountedIngress=Frame & {index:number;name:string;kind:'vent'|'door'|'tear';at:Point;parts:IngressPart[]};
type Writer={box(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle?:number):void;vertexCount(m:T.Material):number};
type Materials={steel:T.Material;dark:T.Material;signal:T.Material};
const inside=(p:Point,poly:readonly Point[])=>{
 let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;
};
const rect=(r:RoomTemplate['obstacles'][number]):readonly Point[]=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
const hull=(t:RoomTemplate)=>t.boundary??rect({x:0,y:0,width:t.width,height:t.height});
const floor=(t:RoomTemplate,p:Point)=>inside(p,hull(t))&&!t.obstacles.some(r=>p.x>r.x&&p.x<r.x+r.width&&p.y>r.y&&p.y<r.y+r.height)&&!t.voids?.some(poly=>inside(p,poly));
/** Entire backing span must separate playable air from actual solid/hull.
 * Sampling includes both lateral corners; an eight-unit return cannot carry a
 * metre-wide facade, nor can a buried/shared partition face count as a mount. */
export function mountedIngressHasBacking(t:RoomTemplate,f:Frame):boolean {
 const {center:c,tangent:v,normal:n}=f,a=f.face[0],b=f.face[1],len=Math.hypot(b.x-a.x,b.y-a.y);
 if(!Number.isFinite(len)||len<1||f.width<.4||Math.abs(v.x*n.x+v.y*n.y)>1e-6)return false;
 const samples=Math.max(8,Math.ceil(f.width*U/4));
 for(let i=0;i<=samples;i++){
  const s=-f.width*U/2+f.width*U*i/samples;
  const p={x:c.x+v.x*s,y:c.y+v.y*s},u=((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(len*len),cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
  if(u<0||u>1||Math.abs(cross)>1e-5||!floor(t,{x:p.x+n.x*.5,y:p.y+n.y*.5})||[.5,1.5,2.56].some(d=>floor(t,{x:p.x-n.x*d,y:p.y-n.y*d})))return false;
 }
 return true;
}
export function mountedIngressContainsVertex(f:Frame,p:readonly number[]):boolean {
 const dx=p[0]*U-f.center.x,dz=p[2]*U-f.center.y,lateral=(dx*f.tangent.x+dz*f.tangent.y)/U,normal=(dx*f.normal.x+dz*f.normal.y)/U;
 return Number.isFinite(p[0]+p[1]+p[2])&&p[1]>=-1e-5&&p[1]<=.91+1e-5&&Math.abs(lateral)<=f.width/2+1e-5&&normal>=-.081-1e-5&&normal<=.035+1e-5;
}
function mount(t:RoomTemplate,at:Point,breach:Point,desired:number):Frame|undefined {
 const candidates:{frame:Frame;score:number}[]=[];
 for(const poly of [hull(t),...t.obstacles.map(rect),...(t.voids??[])])for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],len=Math.hypot(b.x-a.x,b.y-a.y);if(len<16)continue;
  const dx=(b.x-a.x)/len,dy=(b.y-a.y)/len,projection=((at.x-a.x)*dx+(at.y-a.y)*dy);
  for(let width=Math.min(desired*U,len-2);width>=12.8;width-=4){
   const s=Math.max(width/2+1,Math.min(len-width/2-1,projection)),center={x:a.x+dx*s,y:a.y+dy*s};
   if(Math.hypot(center.x-at.x,center.y-at.y)>64)continue;
   for(const sign of [-1,1]){
    const tangent={x:dx*sign,y:dy*sign},normal={x:-tangent.y,y:tangent.x},frame={center,tangent,normal,face:[a,b] as const,width:width/U};
    const facing=(breach.x-center.x)*normal.x+(breach.y-center.y)*normal.y;
    if(facing<=0||!mountedIngressHasBacking(t,frame))continue;
    candidates.push({frame,score:Math.hypot(center.x-at.x,center.y-at.y)+(desired-width/U)*32});
   }
   if(candidates.some(c=>c.frame.face[0]===a&&c.frame.face[1]===b))break;
  }
 }
 return candidates.sort((a,b)=>a.score-b.score)[0]?.frame;
}
/** Adds only to the caller's populated steel/graphite/signal batches. Act4
 * already owns its five room fittings. Legacy rooms remain byte-for-byte. */
export function addMountedIngress(id:string,t:RoomTemplate,w:Writer,m:Materials,plan?:ShipPlan):MountedIngress[]{
 if(ACT4_MOUNTED_INGRESS.has(id)||!Object.hasOwn(SHIP_ARCHITECTURE_PLANS,id))return [];
 plan??=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];if(!plan)return [];
 const fittings:MountedIngress[]=[];
 for(const [index,feature]of plan.breachFeatures.entries()){
  const kind=feature.name.includes('tear')?'tear':feature.name.includes('door')?'door':'vent',f=mount(t,feature.at,t.breaches[index],kind==='vent'?1.12:1.55);if(!f)continue;
  const fitting:MountedIngress={...f,index,name:feature.name,kind,at:feature.at,parts:[]},angle=-Math.atan2(f.tangent.y,f.tangent.x),width=f.width;
  const box=(material:T.Material,lateral:number,y:number,offset:number,bw:number,bh:number,bd:number,name='mounted-ingress-skin')=>{
   const x=f.center.x/U+f.tangent.x*lateral+f.normal.x*offset,z=f.center.y/U+f.tangent.y*lateral+f.normal.y*offset,start=w.vertexCount(material);
   w.box(material,x,y,z,bw,bh,bd,angle);fitting.parts.push({name,material:material.name,start,end:w.vertexCount(material),center:[x,y,z],size:[bw,bh,bd],angle});
  };
  const rim=Math.min(.065,width*.10);
  // A real grounded cassette fills the declared wall's cutaway face, even
  // where a borrowed source leaves only a low plinth or a recessed silhouette.
  // Its complete slab stays inside existing sealed solid; no gameplay collider.
  box(m.steel,0,.44,-.04,width,.88,.08,'grounded-ingress-cassette');
  // Embedded back panel, shared sill and jambs: no free-standing door obstacle.
  box(m.dark,0,.46,.004,width,.76,.024);
  for(const side of [-1,1])box(m.steel,side*(width/2-rim/2),kind==='tear'&&side===1?.42:.46,0,rim,kind==='tear'&&side===1?.68:.80,.04);
  box(m.steel,0,.855,0,width,.05,.04);
  if(kind==='vent'){
   for(const y of [.28,.41,.54,.67])box(m.steel,0,y,.022,width-rim*2,.045,.022);
  }else if(kind==='door'){
   for(const side of [-1,1])box(m.steel,side*width*.23,.44,.022,width*.43,.67,.020);
   box(m.dark,width*.20,.44,.033,.045,.16,.004);
  }else{
   box(m.steel,-width*.18,.24,.022,width*.27,.07,.022);
   box(m.steel,width*.16,.66,.022,width*.32,.06,.022);
  }
  box(m.signal,-width*.26,.79,.028,Math.min(.12,width*.18),.035,.012);
  fittings.push(fitting);
 }
 return fittings;
}
