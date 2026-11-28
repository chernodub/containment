import {CylinderGeometry,DoubleSide,MeshBasicMaterial,type Group} from 'three';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
import {IncidentPieces} from './Inc13StoryIncidents';
import {arenaAperture} from '../lighting/ArenaAperture';

type Mount='surgery'|'berth'|'pendant'|'skylight'|'channel'|'searchlight'|'gantry'|'jib'|'rack'|'coil'|'scope'|'signal'|'pipe'|'hoist'|'welder'|'vent'|'shield'|'iris'|'desk'|'port';
const mounts:Record<string,Mount>={
 'awakening-bay':'surgery','passenger-vault':'berth','residential-gallery':'pendant','communal-atrium':'skylight',
 'crew-checkpoint':'channel',armory:'searchlight','freight-hold':'gantry','breached-loading-bay':'jib',
 'relay-racks':'rack','transmission-chamber':'coil','diagnostic-gallery':'scope','safety-interlock-station':'signal',
 'coolant-plant':'pipe','service-shaft-landing':'hoist','infested-workshop':'welder','swarm-junction':'vent',
 'shielding-gate':'shield','containment-annulus':'iris','manual-control-chamber':'desk','overload-floor':'port',
};

// Trace a support from the lamp to the first bulkhead it reaches.
function wallSocket(room:RoomTemplate,x:number,z:number,dx:number,dz:number):[number,number]{
 const hull=room.boundary??[{x:0,y:0},{x:room.width,y:0},{x:room.width,y:room.height},{x:0,y:room.height}];
 let reach=Infinity;
 for(let i=0;i<hull.length;i++){
  const a=hull[i],b=hull[(i+1)%hull.length],ex=b.x-a.x,ez=b.y-a.y;
  const det=dx*ez-dz*ex;
  if(Math.abs(det)<1e-6)continue;
  const t=((a.x-x)*ez-(a.y-z)*ex)/det,u=((a.x-x)*dz-(a.y-z)*dx)/det;
  if(t>=0&&u>=0&&u<=1)reach=Math.min(reach,t);
 }
 return Number.isFinite(reach)?[dx*reach,dz*reach]:[0,0];
}

export function addArenaFixture(root:Group,room:RoomTemplate,arena:Point,radius:number){
 const mount=mounts[room.id];if(!mount)return;
 const [,depth]=arenaAperture(room.id);
 // The checkpoint scanner occupies the middle of its short throw.
 // Hang the inspection channel over its exposed left jamb.
 const sourceX=arena.x-(mount==='channel'?radius*.82:0);
 const z=arena.y-radius*depth;
 const p=new IncidentPieces();
 const steel=0x475354,edge=0x697575,iron=0x30393b,copper=0x886952,cold=0xa3c4c5,amber=0xd4a567;
 const side=['surgery','pendant','gantry','rack','scope','pipe','welder','shield','desk'].includes(mount)?-1:1;
 const x=side*Math.min(radius*.32,42);
 const trussed=mount==='gantry'||mount==='jib'||mount==='shield';
 const hung=mount==='pendant'||mount==='hoist'||mount==='welder'||mount==='berth';
 const [wx,wz]=wallSocket(room,sourceX,z,trussed?side:side*.25,trussed?-.30:-1);
 p.box(wx,38,wz,20,17,14,iron);
 if(trussed){
  p.rod([wx,46,wz],[0,67,-12],4,steel);
  p.rod([wx,32,wz],[0,55,-12],3.5,copper);
  const bays=Math.max(1,Math.ceil(Math.hypot(wx,wz+12)/58));
  for(let i=0;i<bays;i++){
   const a=i/bays,b=(i+1)/bays;
   p.rod([wx*(1-a),32+23*a,wz*(1-a)-12*a],[wx*(1-b),46+21*b,wz*(1-b)-12*b],2.3,edge);
  }
 }else if(hung){
  p.rod([wx,51,wz],[wx*.55,45,wz*.55],2.5,iron);
  p.rod([wx*.55,45,wz*.55],[0,77,-13],2.5,steel);
  p.rod([0,77,-13],[0,65,-13],3,copper);
 }else{
  p.rod([wx,39,wz],[x,71,-44],3.4,steel);
  p.box(x,71,-44,12,11,12,iron);
  p.rod([x,72,-44],[0,65,-13],4,edge);
 }
 const cone=(cx:number,h:number,cz:number,top:number,bottom:number,height:number,color:number,sides=8)=>{
  p.add(new CylinderGeometry(top,bottom,height,sides).translate(cx,h,cz),color);
 };
 const lens=(cx:number,h:number,cz:number,r:number,color:number)=>cone(cx,h,cz,r,r,4,color);
 const hood=(cx:number,cz:number,r:number,color:number)=>{
  cone(cx,54,cz,r*.42,r,18,color);lens(cx,45,cz+3,r*.87,amber);
  for(const dx of [-r*.60,r*.60])p.rod([cx+dx,49,cz-6],[cx+dx,42,cz+9],1.8,iron);
 };
 switch(mount){
  case 'surgery':case 'scope':{
   // Jointed theatre boom; three lamp wells versus one deep exam optic.
   p.rod([0,65,-13],[-24,58,-9],5,edge);
   p.rod([-24,58,-9],[0,51,7],4.5,steel);lens(-24,60,-9,7,iron);
   if(mount==='surgery'){
    for(const [cx,cz] of [[-14,3],[13,3],[0,22]]){
     cone(cx,50,cz,10,14,9,0x576866);lens(cx,55,cz,10,iron);lens(cx,58,cz,7,cold);
    }
   }else{
    cone(0,49,8,14,20,14,0x515d68);lens(0,57,8,13,0x99abb9);lens(0,60,8,7,0x526c79);
    p.rod([-23,55,8],[-20,47,24],2.6,edge);
   }
   break;
  }
  case 'pendant':case 'welder':case 'hoist':{
   p.rod([0,65,-13],[0,61,0],3,iron);
   if(mount==='pendant'){
    hood(0,0,23,0x776454);cone(0,65,0,5,8,7,copper);
   }else if(mount==='welder'){
    for(const dx of [-23,15]){
     p.rod([0,63,-12],[dx,61,2],3,copper);hood(dx,2,13,0x696242);
    }
   }else{
    p.box(0,68,-9,28,12,24,steel);p.rod([0,66,-10],[0,39,0],2,0x8d8675);
    cone(0,36,0,7,12,13,iron);lens(0,31,3,9,amber);
    for(const dx of [-12,12])p.rod([dx,36,-3],[dx*.7,24,6],2,copper);
   }
   break;
  }
  case 'gantry':case 'jib':{
   const span=mount==='gantry'?106:61;
   p.rod([-span*.5,67,-12],[span*.5,67,-12],3.5,edge);
   p.rod([-span*.5,52,-5],[span*.5,52,-5],3.5,steel);
   for(let i=0;i<4;i++){
    const dx=span*(i/4-.5),dy=i%2?52:67;
    p.rod([dx,dy,dy===52?-5:-12],[dx+span/4,119-dy,dy===52?-12:-5],2.5,copper);
   }
   if(mount==='gantry')p.rod([-44,48,-2],[44,48,-2],3.8,amber);
   else hood(23,-1,17,0x8b6547);
   break;
  }
  case 'vent':case 'skylight':case 'channel':case 'rack':{
   const w=mount==='channel'?35:mount==='rack'?24:66;
   const d=mount==='channel'?60:mount==='rack'?71:38;
   p.box(0,62,-4,w+10,9,d+10,iron);p.box(0,67,-4,w,2,d,steel);
   if(mount==='channel'||mount==='rack'){
    for(const dx of [-w*.26,w*.26])p.box(dx,69,-4,5,2,d-8,mount==='rack'?0x80b7af:cold);
    p.box(0,71,-d*.24,w+5,4,5,edge);
   }else{
    p.box(0,69,-4,w-6,2,d-4,mount==='vent'?0xb397a4:0xc1aa7c);
    const blades=mount==='vent'?5:2;
    for(let i=0;i<blades;i++)p.box(w*((i+.5)/blades-.5),72,-4,5,6,d+4,steel,mount==='vent'?.26:0);
    if(mount==='skylight')p.box(0,72,-4,w,4,5,copper);
   }
   break;
  }
  case 'coil':case 'pipe':case 'berth':{
   const r=mount==='pipe'?9:5;
   p.rod([0,65,-13],[0,53,1],r,steel);
   p.rod([-32,53,1],[32,53,1],r,mount==='coil'?copper:edge);
   for(const dx of [-27,0,27]){
    if(mount==='coil'){
     for(const h of [45,50,55])lens(dx,h,3,9,0x8d7762);
     lens(dx,58,3,5,0xafc2ac);
    }else if(mount==='pipe'){
     cone(dx,51,6,8,8,19,0x567774);p.box(dx,50,13,11,12,5,0x92b9ab);
    }else{
     p.rod([dx,54,1],[dx,43,10],2.5,copper);cone(dx,42,10,6,9,9,0x736b59);lens(dx,42,15,5,amber);
    }
   }
   break;
  }
  case 'iris':case 'port':case 'searchlight':{
   // A forward-facing flanged throat, with the lens inside the lip.
   const r=mount==='port'?24:mount==='iris'?21:15;
   const flange=(cz:number,h:number,rad:number,length:number,color:number)=>{
    p.add(new CylinderGeometry(rad,rad,length,mount==='iris'?12:8).rotateX(Math.PI*.30).translate(0,h,cz),color);
   };
   p.rod([0,65,-13],[0,49,-9],6,steel);
   flange(-7,48,r,21,mount==='port'?0x775c4b:steel);
   flange(3,54,r+3,5,mount==='port'?copper:edge);flange(6,57,r-3,5,iron);
   flange(9,59,r*.63,4,mount==='port'?0xe1a36b:mount==='iris'?0x9cb8ac:cold);
   if(mount==='iris')flange(12,61,r*.36,3,steel);
   if(mount==='searchlight')for(const dx of [-19,19])p.box(dx,53,2,4,20,21,0x5e6861);
   break;
  }
  case 'signal':case 'shield':case 'desk':{
   p.rod([0,65,-13],[-16,54,4],4,steel);
   if(mount==='signal'){
    p.box(0,49,4,52,17,24,0x686046);
    for(const [dx,color] of [[-16,amber],[0,0x827450],[16,0x495658]])lens(dx,59,6,6,color);
    p.box(0,60,-6,56,5,8,iron);
   }else if(mount==='shield'){
    for(const dx of [-16,16]){
     p.box(dx,53,4,18,18,35,0x555a61,dx*.025);
     p.box(dx,63,6,8,2,25,0xaaa7b8,dx*.025);
    }
   }else{
    p.box(0,53,3,36,6,26,steel,-.24);p.box(1,57,5,25,2,14,0x9eaf8d,-.24);
    p.rod([-18,53,-7],[-34,42,-16],3,copper);
   }
   break;
  }
 }
 // Bake a cool upper facet and a darker lower return into the shared unlit batch.
 for(const part of p.parts){
  const n=part.attributes.normal,c=part.attributes.color;
  for(let i=0;i<c.count;i++){
   const gain=.62+.49*Math.max(0,n.getY(i))+.20*Math.max(0,-n.getX(i))+.08*Math.max(0,n.getZ(i));
   c.setXYZ(i,c.getX(i)*gain,c.getY(i)*gain,c.getZ(i)*gain);
  }
 }
 p.finish(root,'arena-'+mount,sourceX,z,new MeshBasicMaterial({vertexColors:true,side:DoubleSide}),mount==='channel');
}

// Cast edge on the deck survives the cutaway camera cropping an overhead head.
export function paintFixtureShadow(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point,radius:number){
 const mount=mounts[room.id];if(!mount)return;
 const [w,d]=arenaAperture(room.id);
 c.save();c.translate(arena.x,arena.y-radius*d+7);
 c.fillStyle='rgba(15,22,25,.44)';c.strokeStyle='rgba(15,22,25,.46)';c.lineWidth=4;
 c.beginPath();c.moveTo(-radius*w*.67,-22);c.quadraticCurveTo(-24,10,12,16);c.stroke();
 if(mount==='vent'||mount==='gantry'||mount==='skylight'){
  for(const dx of [-24,0,24]){c.beginPath();c.moveTo(dx-15,1);c.lineTo(dx+4,19);c.stroke();}
 }else{
  c.beginPath();c.ellipse(12,16,mount==='port'?20:12,6,.22,0,Math.PI*2);c.fill();
 }
 c.restore();
}
