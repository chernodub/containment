import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import type {ShipEnvironment} from '../ShipEnvironments';
import {kitHull,kitInside} from './KitSafety';
import {addKitFloorAftermath,type FloorAftermathProof} from './KitFloorAftermath';
import {addKitDeckArchitecture,type DeckArchitectureProof} from './KitDeckArchitecture';

type Reservation={x:number;y:number;width:number;height:number};
type Mark={x:number;z:number;kind:string};
export type KitFloorProof={idea:string;coverage:number;triangles:number;features:Record<string,number>;views:{x:number;z:number;features:string[]}[];maxHeight:number;aftermath:FloorAftermathProof;architecture:DeckArchitectureProof};
/** Floor-only albedo calibration after the saved all20 density value audit. */
export const KIT_FLOOR_VALUE_GAIN:Readonly<Record<string,number>>={
 'awakening-bay':.60,'passenger-vault':.40,'transmission-chamber':.64,
 'crew-checkpoint':.48,'armory':.68,'breached-loading-bay':.60,
 'shielding-gate':.38,'overload-floor':.78,
 'manual-control-chamber':.64,'diagnostic-gallery':.80,
 'infested-workshop':.85,'swarm-junction':.80,
 'freight-hold':1.40,'relay-racks':.90,'containment-annulus':.962,
 'service-shaft-landing':.90,
};
const FLOOR_IDEAS:Record<ShipEnvironment,string>={
 cryogenics:'Quiet release aisle, broad frost creep at berth seals and interrupted evacuation tracks',
 habitation:'Worn vinyl circulation, domestic carpet islands, unpacked papers and clothing trails',
 security:'Inspection lanes, hardware exclusion paint, spent casings and defensive drag scars',
 cargo:'Loading bays, directional traffic paint, dragged stock and spilled packing contents',
 communications:'Raised service-floor fields, dark cable trenches, removed panels and service papers',
 engineering:'Machine safety aprons, broken hazard paint, service spills and hot scorch tracks',
 maintenance:'Drain-channel network, grates, wet seepage fans and dragged repair supplies',
 infested:'Thin seam veins around sculptural machine growth; exposed central human deck',
 containment:'Quiet field-sector inlays, calibration lanes, broken-glass and abandoned inspection papers',
 reactor:'Radial heat-stained plating, exclusion chevrons, scorched service lanes and abandoned controls',
};
const COLORS:Record<ShipEnvironment,readonly number[]>={
 cryogenics:[0x73868c,0x526570,0x88999b,0x465964],
 habitation:[0x646c65,0x453b40,0x848273,0x4e5960],
 security:[0x647079,0x404e59,0x8d8b73,0x51606b],
 cargo:[0x716b56,0x514e46,0x9c895c,0x5c625e],
 communications:[0x63777f,0x344953,0x788c8e,0x4b626d],
 engineering:[0x77735f,0x4b5052,0xa08a58,0x686b62],
 maintenance:[0x60756b,0x354c49,0x79877b,0x526b5b],
 infested:[0x6a5963,0x514550,0x778369,0x596357],
 containment:[0x737d88,0x4d596c,0x8c9197,0x626d7a],
 reactor:[0x73695d,0x51494d,0x9d7e54,0x665e5a],
};

/** Baked, opaque surface art. All vertices are below 3cm and use one shared floor pass. */
export function buildKitFloorSurface(t:RoomTemplate,environment:ShipEnvironment,id:string,reservations:readonly Reservation[]):{geometry:T.BufferGeometry;proof:KitFloorProof} {
 const positions:number[]=[],normals:number[]=[],colors:number[]=[],marks:Mark[]=[],counts:Record<string,number>={};
 const hull=kitHull(t),w=t.width/32,h=t.height/32,palette=COLORS[id==='reactor-vault'?'infested':environment];
 let seed=0;for(const c of id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const phase=(seed%97)/17,matOrganic=environment==='infested'||id==='reactor-vault',organic=matOrganic||id==='breached-loading-bay';
 const valid=(x:number,z:number)=>kitInside(x*32,z*32,hull)&&!t.voids?.some(p=>kitInside(x*32,z*32,p))&&!t.obstacles.some(r=>x*32>r.x&&x*32<r.x+r.width&&z*32>r.y&&z*32<r.y+r.height);
 const nearest=(x:number,z:number)=>reservations.reduce((best,r)=>{
  const dx=Math.max(r.x/32-x,0,x-(r.x+r.width)/32),dz=Math.max(r.y/32-z,0,z-(r.y+r.height)/32);
  return Math.min(best,Math.hypot(dx,dz));
 },100);
 const quad=(x:number,z:number,width:number,depth:number,angle:number,color:number,kind:string,y=.021)=>{
  const ca=Math.cos(angle),sa=Math.sin(angle),corners=[[-width/2,-depth/2],[-width/2,depth/2],[width/2,depth/2],[width/2,-depth/2]].map(([a,b])=>[x+a*ca-b*sa,z+a*sa+b*ca]);
  if(!corners.every(([a,b])=>valid(a,b)))return false;
  if(width>1||depth>1)for(let u=-width/2;u<=width/2;u+=.35)for(let v=-depth/2;v<=depth/2;v+=.35)if(!valid(x+u*ca-v*sa,z+u*sa+v*ca))return false;
  const c=new T.Color(color);
  for(const i of [0,1,2,0,2,3]){positions.push(corners[i][0],y,corners[i][1]);normals.push(0,1,0);colors.push(c.r,c.g,c.b);}
  counts[kind]=(counts[kind]??0)+1;marks.push({x,z,kind});return true;
 };
 const segment=(ax:number,az:number,bx:number,bz:number,width:number,color:number,kind:string,y=.024)=>quad((ax+bx)/2,(az+bz)/2,Math.hypot(bx-ax,bz-az),width,Math.atan2(bz-az,bx-ax),color,kind,y);
 const patch=(points:readonly(readonly[number,number])[],color:number,kind:string,y=.024)=>{
  const polygon=points.map(p=>new T.Vector2(p[0],p[1])),c=new T.Color(color);let admitted=false;
  for(const triangle of T.ShapeUtils.triangulateShape(polygon,[])){
   const [a,b,d]=triangle.map(i=>polygon[i]);if(![a,b,d].every(p=>valid(p.x,p.y)))continue;
   const cross=(p:T.Vector2,u:T.Vector2,v:T.Vector2)=>(p.x-v.x)*(u.y-v.y)-(u.x-v.x)*(p.y-v.y);
   let safe=true;
   for(let x=Math.min(a.x,b.x,d.x);x<=Math.max(a.x,b.x,d.x)&&safe;x+=.35)for(let z=Math.min(a.y,b.y,d.y);z<=Math.max(a.y,b.y,d.y);z+=.35){const p=new T.Vector2(x,z),s=[cross(p,a,b),cross(p,b,d),cross(p,d,a)];if(!(s.some(v=>v<0)&&s.some(v=>v>0))&&!valid(x,z)){safe=false;break;}}
   if(!safe)continue;if((b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x)>0)triangle.reverse();
   for(const i of triangle){positions.push(polygon[i].x,y,polygon[i].y);normals.push(0,1,0);colors.push(c.r,c.g,c.b);}admitted=true;
  }
  if(admitted){counts[kind]=(counts[kind]??0)+1;marks.push({x:points.reduce((n,p)=>n+p[0],0)/points.length,z:points.reduce((n,p)=>n+p[1],0)/points.length,kind});}return admitted;
 };
 const pitch=environment==='infested'?.4:matOrganic||environment==='cryogenics'?.55:.8;let legalCells=0,coveredCells=0;
 const livingField=(x:number,z:number)=>{
  const wave=Math.sin(x*.64+phase)+Math.cos(z*.51-phase);
  const mass=.38+wave*.10-nearest(x,z),branch=-100;
  const holes=.88-Math.sin(x*.71+phase)*Math.cos(z*.57-phase)-.2*Math.sin(x*1.7+z*1.1);
  const fringe=.22*Math.sin(x*2.4+z*1.8+phase)+.12*Math.cos(x*1.8-z*3.1);
  return Math.min(Math.max(mass,branch)+fringe,holes*3);
 };
 const frostField=(x:number,z:number)=>3.9+Math.sin(x*.8+phase)*.7+Math.cos(z*.67-phase)*.6-nearest(x,z);
 // Interpolate the contour across each cell, instead of drawing stair-step squares.
 const contour=(x:number,z:number,field:(x:number,z:number)=>number,color:number,kind:string)=>{
  const corners=[[-1,-1],[-1,1],[1,1],[1,-1]].map(([dx,dz])=>new T.Vector2(x+dx*pitch/2,z+dz*pitch/2));
  if(!corners.every(p=>valid(p.x,p.y)))return;
  const polygon:T.Vector2[]=[];
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],fa=field(a.x,a.y),fb=field(b.x,b.y);if(fa>=0)polygon.push(a);if((fa>=0)!==(fb>=0))polygon.push(a.clone().lerp(b,fa/(fa-fb)));}
  if(polygon.length<3)return;
  const c=new T.Color(color),secondary=new T.Color(palette[matOrganic?1:2]),shade=new T.Color();
  for(const triangle of T.ShapeUtils.triangulateShape(polygon,[])){
   const [a,b,d]=triangle.map(i=>polygon[i]);
   // Earcut winds for the XY plane; the shipping floor lies in XZ.
   if((b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x)>0)triangle.reverse();
   for(const i of triangle){const p=polygon[i],strength=T.MathUtils.clamp(field(p.x,p.y)/3,0,1);shade.copy(c).lerp(secondary,strength*.35);positions.push(p.x,.018,p.y);normals.push(0,1,0);colors.push(shade.r,shade.g,shade.b);}
  }
  counts[kind]=(counts[kind]??0)+1;marks.push({x,z,kind});coveredCells++;
 };
 // Large material fields are defined by room use and machine position, not a universal decal stamp.
 for(let x=.45;x<w-.35;x+=pitch)for(let z=.45;z<h-.35;z+=pitch){
  if(!valid(x,z))continue;legalCells++;
  const d=nearest(x,z),nx=x/w,nz=z/h,wave=Math.sin(x*.8+phase)+Math.cos(z*.67-phase),stripe=Math.floor((x+z*.55)*2)%2;
  let field=false,color=palette[0],kind='material-zone';
  switch(environment){
   case 'habitation':{
    const rug=reservations.some(r=>x>r.x/32-.7&&x<(r.x+r.width)/32+.7&&z>(r.y+r.height)/32+.3&&z<(r.y+r.height)/32+4.1);
    field=rug&&d<.55;color=palette[1];break;
   }
   case 'cargo':field=d<.65;color=(Math.floor(x/7)+Math.floor(z/6))%2?palette[0]:palette[3];break;
   case 'communications':field=d<.4;color=palette[0];break;
   case 'maintenance':field=d<.85+wave*.15;color=wave>.2?palette[0]:palette[3];break;
   case 'engineering':field=d<.65;kind=d<.35?'hazard-apron':'material-zone';color=d<.35?(stripe?palette[2]:palette[1]):palette[0];break;
   case 'cryogenics':field=frostField(x,z)>0;kind='frost-field';color=palette[0];break;
   case 'infested':field=livingField(x,z)>0;kind='creep-mat';color=palette[0];break;
   case 'containment':field=d<.5; color=(Math.floor(z/4)+seed)%2?palette[0]:palette[3];break;
   case 'reactor':field=d<.8;color=wave>.4?palette[0]:palette[3];break;
   case 'security':field=d<.55;color=palette[0];break;
  }
  if(matOrganic){contour(x,z,livingField,palette[0],'creep-mat');continue;}
  if(environment==='cryogenics'){contour(x,z,frostField,color,kind);continue;}
  if(field){quad(x,z,pitch+.002,pitch+.002,0,color,kind,.018);coveredCells++;}
 }
 // Equipment service feeds replace the arbitrary court/lane network.
 for(const r of reservations){
  const x=(r.x+r.width*.5)/32,z=(r.y+r.height)/32+.30;
  for(let n=0;n<5;n++){
   const px=x+(n-2)*.16;
   quad(px,z,.055,.23,0,palette[1],'equipment-drain',.022);
  }
 }
 if(organic){
  for(const [i,r]of reservations.entries())for(let arm=0;arm<3;arm++){
   const a=phase+i*.7+arm*2.1,cx=(r.x+r.width*.5)/32,cz=(r.y+r.height*.5)/32,reach=Math.min(r.width/64/Math.max(.001,Math.abs(Math.cos(a))),r.height/64/Math.max(.001,Math.abs(Math.sin(a))))+.06;
   const x=cx+Math.cos(a)*reach,z=cz+Math.sin(a)*reach;
   const curve=new T.CatmullRomCurve3([new T.Vector3(x,.027,z),new T.Vector3(x+Math.cos(a)*.65,.027,z+Math.sin(a)*.65),new T.Vector3(x+Math.cos(a+.35)*1.1,.027,z+Math.sin(a+.35)*1.1),new T.Vector3(x+Math.cos(a+.15)*1.6,.027,z+Math.sin(a+.15)*1.6)]);
   for(let step=0;step<36;step++){const a=curve.getPoint(step/36),b=curve.getPoint((step+1)/36);segment(a.x,a.z,b.x,b.z,.018+.025*(1-step/36),palette[2],'growth-vein',.027);}
   for(const t of [.32,.61]){
    const p=curve.getPoint(t),tangent=curve.getTangent(t),side=arm%2?1:-1,end=p.clone().add(new T.Vector3(tangent.x*.45-tangent.z*.4*side,0,tangent.z*.45+tangent.x*.4*side));
    const fork=new T.CatmullRomCurve3([p,p.clone().lerp(end,.5).add(new T.Vector3(tangent.x*.3,0,tangent.z*.3)),end]);
    for(let step=0;step<12;step++){const a=fork.getPoint(step/12),b=fork.getPoint((step+1)/12);segment(a.x,a.z,b.x,b.z,.012+.018*(1-step/12),palette[2],'growth-vein-branch',.027);}
   }
  }
 }
 const architecture=addKitDeckArchitecture(t,id,reservations,{quad,segment});
 const aftermath=addKitFloorAftermath(t,id,reservations,{valid,quad,segment,patch});
 // Low-contrast circulation wear reaches quiet edges without repeating a pile
 // of story props in every bay. It is a separate large-scale surface feature.
 for(let z=1.8;z<h-1;z+=3.6)for(const x of [1.4,w*.5,w-1.4]){
  const a=.18*Math.sin(z*.4+phase),px=x+Math.sin(z*.7+phase)*.35;
  const kind=organic?'resin-smear':environment==='cryogenics'?'thaw-streak':'circulation-scuff';
  quad(px,z,1.45,.055,a,palette[1],kind,.025);
  quad(px+.22,z+.23,.72,.035,a+.05,palette[3],kind,.026);
 }
 for(let z=3;z<h-1;z+=7.1)for(const x of [1.5,w-1.5]){
  quad(x,z,.95,1.25,0,palette[1],'service-hatch',.025);
  for(const side of [-1,1]){
   quad(x+side*.5,z,.065,1.3,0,palette[3],'service-hatch',.027);
   quad(x,z+side*.65,1.06,.065,0,palette[3],'service-hatch',.027);
   quad(x+side*.32,z+.42,.07,.07,0,palette[2],'service-hatch',.028);
  }
 }
 // Preserve ordering inside our pass, below every combat ground decal.
 for(let i=1;i<positions.length;i+=3)positions[i]*=.75;
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeBoundingBox();geometry.computeBoundingSphere();
 // Approximate shipping long-lens surface view, sampled across legal room positions.
 const views:KitFloorProof['views']=[];
 for(let x=1.5;x<w;x+=4)for(let z=1.5;z<h;z+=4)if(valid(x,z))views.push({x,z,features:[...new Set(marks.filter(m=>Math.abs(m.x-x)<10&&m.z>z-8&&m.z<z+6).map(m=>m.kind))]});
 return{geometry,proof:{idea:FLOOR_IDEAS[environment],coverage:coveredCells/Math.max(1,legalCells),triangles:positions.length/9,features:counts,views,maxHeight:.029*.75,aftermath,architecture}};
}
