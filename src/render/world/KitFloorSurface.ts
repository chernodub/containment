import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import type {ShipEnvironment} from '../ShipEnvironments';
import {kitHull,kitInside} from './KitSafety';

type Reservation={x:number;y:number;width:number;height:number};
type Mark={x:number;z:number;kind:string};
export type KitFloorProof={idea:string;coverage:number;triangles:number;features:Record<string,number>;views:{x:number;z:number;features:string[]}[];maxHeight:number};
const FLOOR_IDEAS:Record<ShipEnvironment,string>={
 cryogenics:'Quiet release aisle, broad frost creep at berth seals and interrupted evacuation tracks',
 habitation:'Worn vinyl circulation, domestic carpet islands, unpacked papers and clothing trails',
 security:'Inspection lanes, hardware exclusion paint, spent casings and defensive drag scars',
 cargo:'Loading bays, directional traffic paint, dragged stock and spilled packing contents',
 communications:'Raised service-floor fields, dark cable trenches, removed panels and service papers',
 engineering:'Machine safety aprons, broken hazard paint, service spills and hot scorch tracks',
 maintenance:'Drain-channel network, grates, wet seepage fans and dragged repair supplies',
 infested:'Broad translucent-looking flat tissue mats, branching veins and islands of surviving human deck',
 containment:'Quiet field-sector inlays, calibration lanes, broken-glass and abandoned inspection papers',
 reactor:'Radial heat-stained plating, exclusion chevrons, scorched service lanes and abandoned controls',
};
const COLORS:Record<ShipEnvironment,readonly number[]>={
 cryogenics:[0x73868c,0x526570,0x88999b,0x465964],
 habitation:[0x646c65,0x594d50,0x848273,0x4e5960],
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
 const hull=kitHull(t),w=t.width/32,h=t.height/32,palette=COLORS[environment];
 let seed=0;for(const c of id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const phase=(seed%97)/17,organic=environment==='infested'||id==='breached-loading-bay'||id==='reactor-vault';
 const valid=(x:number,z:number)=>kitInside(x*32,z*32,hull)&&!t.voids?.some(p=>kitInside(x*32,z*32,p))&&!t.obstacles.some(r=>x*32>r.x&&x*32<r.x+r.width&&z*32>r.y&&z*32<r.y+r.height);
 const nearest=(x:number,z:number)=>reservations.reduce((best,r)=>{
  const dx=Math.max(r.x/32-x,0,x-(r.x+r.width)/32),dz=Math.max(r.y/32-z,0,z-(r.y+r.height)/32);
  return Math.min(best,Math.hypot(dx,dz));
 },100);
 const quad=(x:number,z:number,width:number,depth:number,angle:number,color:number,kind:string,y=.021)=>{
  const ca=Math.cos(angle),sa=Math.sin(angle),corners=[[-width/2,-depth/2],[-width/2,depth/2],[width/2,depth/2],[width/2,-depth/2]].map(([a,b])=>[x+a*ca-b*sa,z+a*sa+b*ca]);
  if(!corners.every(([a,b])=>valid(a,b)))return;
  const c=new T.Color(color);
  for(const i of [0,1,2,0,2,3]){positions.push(corners[i][0],y,corners[i][1]);normals.push(0,1,0);colors.push(c.r,c.g,c.b);}
  counts[kind]=(counts[kind]??0)+1;marks.push({x,z,kind});
 };
 const segment=(ax:number,az:number,bx:number,bz:number,width:number,color:number,kind:string,y=.024)=>quad((ax+bx)/2,(az+bz)/2,Math.hypot(bx-ax,bz-az),width,Math.atan2(bz-az,bx-ax),color,kind,y);
 const pitch=.8;let legalCells=0,coveredCells=0;
 // Large material fields are defined by room use and machine position, not a universal decal stamp.
 for(let x=.45;x<w-.35;x+=pitch)for(let z=.45;z<h-.35;z+=pitch){
  if(!valid(x,z))continue;legalCells++;
  const d=nearest(x,z),nx=x/w,nz=z/h,wave=Math.sin(x*.8+phase)+Math.cos(z*.67-phase),stripe=Math.floor((x+z*.55)*2)%2;
  let field=false,color=palette[0],kind='material-zone';
  switch(environment){
   case 'habitation':field=(Math.floor((x+phase)/5)+Math.floor(z/5))%3!==0;color=(Math.floor(z/5)+seed)%2?palette[0]:palette[1];break;
   case 'cargo':field=(x%7<5.5&&z%6<4.8);color=(Math.floor(x/7)+Math.floor(z/6))%2?palette[0]:palette[3];break;
   case 'communications':field=x%6<5.5&&z%5<4.5;color=(Math.floor(x/1.6)+Math.floor(z/1.6))%3===0?palette[3]:palette[0];break;
   case 'maintenance':field=d<3.8+wave*.4||Math.abs(nx-.35)<.13||Math.abs(nx-.72)<.10;color=wave>.2?palette[0]:palette[3];break;
   case 'engineering':field=d<3.1;kind=d<1.1?'hazard-apron':'material-zone';color=d<1.1?(stripe?palette[2]:palette[1]):palette[0];break;
   case 'cryogenics':field=d<3.9+wave*.8||nx<.13+wave*.025;kind='frost-field';color=wave>.5?palette[2]:palette[0];break;
   case 'infested':field=d<4.2+wave*1.1||Math.abs(x-w*.5-Math.sin(z*.22+phase)*w*.2)<2.8+wave*.6;kind='creep-mat';color=wave>.4?palette[0]:palette[1];if(Math.sin(x*2.4)*Math.cos(z*2.1)>.64)field=false;break;
   case 'containment':field=d<3.5||Math.abs(nx-.5)<.18; color=(Math.floor(z/4)+seed)%2?palette[0]:palette[3];break;
   case 'reactor':field=d<4.5||Math.abs(nx-.5)<.28;color=wave>.4?palette[0]:palette[3];break;
   case 'security':field=Math.abs(nx-.28)<.16||Math.abs(nx-.75)<.14||d<2.4;color=palette[0];break;
  }
  if(field){quad(x,z,pitch+.004,pitch+.004,0,color,kind,.018);coveredCells++;}
 }
 // Functional route/inlay network. Its scale is several metres, independent of tile seams.
 for(let z=1;z<h-1;z+=.65){
  const lane=environment==='communications'?w*.44:environment==='maintenance'?w*.35:w*.26;
  const offset=environment==='habitation'?Math.sin(z*.12+phase)*.7:0;
  if(environment==='maintenance'||environment==='communications'){
   quad(lane+offset,z,.58,.59,0,palette[1],environment==='maintenance'?'drain-channel':'cable-trench',.022);
   for(const dx of [-.18,0,.18])quad(lane+offset+dx,z,.055,.43,0,palette[2],'grate',.026);
  }else{
   quad(lane+offset,z,.12,.43,0,palette[2],'route-inlay',.023);
   quad(w*.76-offset,z,.08,.43,0,palette[3],'route-inlay',.023);
  }
 }
 for(let z=3.2+phase%2;z<h-1;z+=5.2)for(let x=.8;x<w-.6;x+=.7){
  if(organic){
   const oz=z+Math.sin(x*.48+phase)*.65;
   quad(x,oz,.8,.28+Math.sin(x*.3)**2*.3,.18*Math.cos(x*.48),palette[2],'growth-vein',.027);
  }else{
   const grate=environment==='maintenance'||environment==='communications';
   quad(x,z,.57,grate?.24:.075,0,grate?palette[1]:palette[2],grate?'cross-service-channel':'bay-inlay',.024);
  }
 }
 // Wear follows circulation and machine service edges. Clusters carry the room story.
 const anchors:([number,number])[]=reservations.flatMap(r=>[[(r.x-22)/32,(r.y+r.height*.35)/32],[(r.x+r.width*.65)/32,(r.y+r.height+26)/32]] as [number,number][]);
 for(let z=2.4;z<h-1;z+=4.8)anchors.push([w*.26+Math.sin(z*.4+phase)*1.1,z],[w*.73+Math.cos(z*.3+phase),z+1.4]);
 for(const [i,[x,z]]of anchors.entries()){
  const a=phase+i*.83;
  for(let k=0;k<5;k++){
   const px=x+Math.sin(a+k*2.3)*.7,pz=z+Math.cos(a+k*1.8)*.55,angle=a+k*.73;
   const paper=environment==='habitation'||environment==='communications'||environment==='containment';
   const glass=environment==='cryogenics'||environment==='containment';
   quad(px,pz,paper?.23:glass?.16:.11,paper?.32:glass?.28:.075,angle,paper?palette[2]:palette[1],paper?'story-papers':glass?'broken-glass':'spent-debris',.028);
  }
  segment(x-.8,z-.2,x+.6,z+.28,.11,palette[1],environment==='reactor'||environment==='engineering'?'scorch-track':'drag-mark',.025);
  for(let step=0;step<4;step++)for(const side of [-1,1])quad(x+side*.16+step*.11,z+step*.39,.10,.23,.24,palette[1],'footprints',.029);
  if(environment==='habitation')quad(x+.45,z+.25,.55,.8,a,palette[1],'discarded-clothing',.026);
  if(environment==='maintenance')quad(x,z,1.8,1.1,a,palette[3],'drain-seepage',.020);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeBoundingBox();geometry.computeBoundingSphere();
 // Approximate shipping long-lens surface view, sampled across legal room positions.
 const views:KitFloorProof['views']=[];
 for(let x=1.5;x<w;x+=4)for(let z=1.5;z<h;z+=4)if(valid(x,z))views.push({x,z,features:[...new Set(marks.filter(m=>Math.abs(m.x-x)<10&&m.z>z-8&&m.z<z+6).map(m=>m.kind))]});
 return{geometry,proof:{idea:FLOOR_IDEAS[environment],coverage:coveredCells/Math.max(1,legalCells),triangles:positions.length/9,features:counts,views,maxHeight:.029}};
}
