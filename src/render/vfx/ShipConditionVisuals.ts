import * as T from 'three';
import type {DepthGame} from '../../DepthGame';
import type {RoomConditionRuntime} from '../../game/roguelike/RoomConditionRuntime';
import type {LightPool} from '../lighting/LightPool';
import {bindPriorityMask} from '../abilities/PriorityMask';
import {conditionMount} from './ConditionMount';
import {ConditionFittings} from './ConditionFittings';
import {conditionDeck,clippedConditions} from './ConditionDeck';

const STEEL=0x53606a, INK=0x252b33, FROST=0x9abac3, BRASS=0xb39d78;
const DIGITS=[0x3f,6,0x5b,0x4f,0x66,0x6d,0x7d,7,0x7f,0x6f];
const SEGMENTS=[[0,.16,1],[.09,.08,0],[.09,-.08,0],[0,-.16,1],[-.09,-.08,0],[-.09,.08,0],[0,0,1]];

export class ShipConditionVisuals {
 readonly root=new T.Group();
 private plane=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2);
 private blank=new T.DataTexture(new Uint8Array(4),1,1);
 private fittings=new ConditionFittings(this.blank);
 private patches=Array.from({length:3},()=>new T.Mesh<T.BufferGeometry,ReturnType<typeof conditionDeck>>(this.plane,conditionDeck()));
 private previous:RoomConditionRuntime|null=null;
 private live=false;
 private unlockedAt=-1;
 private tracks=Array.from({length:16},()=>({x:0,z:0,a:0,t:-Infinity}));
 private nextTrack=0;
 private mounts:ReturnType<typeof conditionMount>[]=[];
 private nextSkid=0;
 constructor(private readonly unit:number){
  this.root.name='ship-condition-visuals';
  this.blank.needsUpdate=true;
  for(const p of this.patches){bindPriorityMask(p.material,this.blank);p.renderOrder=3;}
  this.root.add(this.fittings.root,...this.patches);
 }
 update(state:RoomConditionRuntime|null,low:boolean,reduced:boolean,game?:DepthGame,lights?:LightPool,mask?:T.Texture){
  const f=this.fittings;
  f.begin(mask??this.blank);
  for(const p of this.patches)p.visible=false;
  if(this.previous!==state){
   for(const patch of this.patches){
    if(patch.geometry!==this.plane)patch.geometry.dispose();
    patch.geometry=this.plane;
   }
   if(state&&game&&['coolant','conduit','brood'].includes(state.condition.id)){
    clippedConditions(game.geometry,state.zones,state.condition.id==='brood').forEach((g,i)=>this.patches[i].geometry=g);
   }
   this.mounts=[];
   if(state&&game){
    const points=state.condition.id==='dark'?game.geometry.breaches:state.condition.id==='coolant'?state.zones:[];
    this.mounts=points.map(p=>conditionMount(p,game.geometry,this.unit));
   }
   this.nextSkid=0;
   this.live=false;this.unlockedAt=-1;for(const t of this.tracks)t.t=-Infinity;this.previous=state;}
  if(!state||!game){f.finish();return;}
  const id=state.condition.id,t=state.elapsed*.001,u=this.unit;
  const px=game.player.x/u,pz=game.player.y/u;
  for(const [i,zone] of state.zones.entries()){
   const x=zone.x/u,z=zone.y/u,r=zone.radius/u;
   const dx=((zone.end?.x??zone.x)-zone.x)/u,dz=((zone.end?.y??zone.y)-zone.y)/u;
   const a=Math.atan2(dx,dz),len=Math.hypot(dx,dz);
   if(id==='coolant'||id==='conduit'||id==='brood'){
    const patch=this.patches[i],uniforms=patch.material.uniforms;
    const size=id==='brood'?r*2.8:r;
    patch.visible=true;patch.position.set(x+dx/2,.022,z+dz/2);
    patch.rotation.y=a;patch.scale.set(size,1,size+len/2);
    uniforms.size.value.set(size,size+len/2);uniforms.lamp.value.set(px,pz);
    uniforms.kind.value=id==='coolant'?0:id==='conduit'?1:2;
    uniforms.charge.value=state.conduitLive?1:Math.max(0,1-state.countdown*.001);
    uniforms.clock.value=reduced?0:t;uniforms.abilityPriorityMap.value=mask??this.blank;
   }
   if(id==='coolant'){
    // Locate the valve against the closest solid face to the simulated leak origin.
    const {x:sx,z:sz}=this.mounts[i];
    f.part(sx,.34,sz,.32,.68,.38,STEEL);
    for(let k=0;k<8;k++){
     const yaw=k*Math.PI/4;
     f.part(sx+.27*Math.cos(yaw),.69,sz+.27*Math.sin(yaw),.26,.075,.078,0x71989d,Math.PI/2-yaw);
    }
    for(let k=0;k<2;k++)f.part(sx,.69,sz,.48,.055,.048,STEEL,k*Math.PI/2);
    f.part(sx,.49,sz,.49,.12,.52,FROST);
    f.part(sx,.23,sz,.52,.14,.48,INK);
    const spillLength=Math.hypot(x-sx,z-sz), direction=Math.atan2(x-sx,z-sz);
    f.part(sx,.56,sz,.78,.27,.48,STEEL,direction);
    f.part(sx,.3,sz,.38,.55,.15,FROST,direction,0,true);
    f.part((sx+x)/2,.014,(sz+z)/2,.36,.012,spillLength,0x5f949b,direction);
    const ripple=reduced?.46:(t*.55)%1;
    f.part(sx+(x-sx)*ripple,.020,sz+(z-sz)*ripple,.27,.003,.24,0x95b8bc,direction);
    this.mist(sx,sz,t,low);
   }else if(id==='conduit'){
    for(const side of [-1,1]){
     f.part(x+dx/2+Math.cos(a)*r*.78*side,.012,z+dz/2-Math.sin(a)*r*.78*side,.065,.019,len,STEEL,a);
    }
    if(state.conduitLive){
     if(!this.live&&!reduced)lights?.flash({x:x+dx/2,z:z+dz/2,y:.34,color:0xd6cced,intensity:3,distance:3,duration:.14,priority:1});
     for(let j=0;j<(low?2:5);j++){
      const phase=(t*3+j*.31)%1,s=(j*.38+i*.27+Math.floor(t*3)*.23)%1;
      f.part(x+dx*s+phase*.19,.06+Math.sin(phase*Math.PI)*.32,z+dz*s,.033,.13,.043,0xbab7c7,a,phase,true);
     }
    }
   }else if(id==='vent'){
    const radius=r*.50;
    for(let j=0;j<12;j++){
     const angle=j*Math.PI/6;
     f.part(x+radius*Math.cos(angle),.12,z+radius*Math.sin(angle),radius*.55,.20,.17,j%3?STEEL:FROST,Math.PI/2-angle);
    }
    for(let j=-3;j<=3;j++)f.part(x+j*radius*.23,.10,z,.105,.18,2*radius*Math.sqrt(1-(j*.23)**2),INK);
    const beacon=state.ventWarning&&(reduced||Math.sin(t*14)>0)?0xffe5ad:BRASS;
    f.part(x+radius,.30,z,.28,.28,.30,beacon,0,0,true);
    if(state.ventLive)for(let j=0;j<(low?9:28);j++){
     const phase=(t*.54+j*.618)%1,angle=Math.atan2(px-x,pz-z)+Math.sin(j*4.17)*1.12;
     const distance=(1-phase)*(5+Math.hypot(px-x,pz-z));
     f.part(x+Math.sin(angle)*distance,.14+.27*phase,z+Math.cos(angle)*distance,j%3?.042:.18,.02,j%3?.91:.27,j%3?0x8a959a:0xc6c2ad,angle,phase,true);
    }
   }else if(id==='brood'){
    if(state.eggs.size)this.mist(x,z,t+i,low);
   }else if(id==='sealed'){
    const exit=i===state.closedBreaches.length;
    const open=exit&&((game.status!=='playing'&&game.status!=='paused')||(!state.countdown&&!state.sealedHold));
    if(open&&this.unlockedAt<0){this.unlockedAt=t;lights?.flash({x,z,color:0xffdfa6,duration:.45,distance:4,intensity:5});}
    this.shutter(x,z,(zone.angle??0)+Math.PI/2,r,open?(game.status==='playing'||game.status==='paused'?Math.min(1,(t-this.unlockedAt)*3):1):0,Math.ceil(state.countdown/1000),low);
   }
  }
  if(id==='coolant'){
   if(t>=this.nextSkid){
    this.nextSkid=t+(low?.14:.10);
    const mark=(x:number,y:number,vx:number,vy:number)=>{
     if(Math.hypot(vx,vy)<20||!state.slick({x,y}))return;
     Object.assign(this.tracks[this.nextTrack],{x:x/u,z:y/u,a:Math.atan2(vx,vy),t});
     this.nextTrack=(this.nextTrack+1)%this.tracks.length;
    };
    for(const e of game.enemies.snapshot.enemies)mark(e.x,e.y,e.velocityX,e.velocityY);
    mark(game.player.x,game.player.y,game.player.vx,game.player.vy);
   }
   for(const p of this.tracks)if(t-p.t<.8)f.part(p.x,.025,p.z,.05,.006,.42*(1-(t-p.t)/.8),0x738c95,p.a);
  }
  if(id==='dark'){
   for(const {x,z,a} of this.mounts.slice(0,low?2:3)){
    const toward=Math.atan2(game.geometry.bounds.width/(2*u)-x,game.geometry.bounds.height/(2*u)-z);
    if(!low)lights?.attach('emergency-rake-'+x+','+z,{x:x+1.4*Math.sin(toward),z:z+1.4*Math.cos(toward),y:.42,color:0xa2cbd0,intensity:3.6,distance:5,priority:0,duration:.14});
    // Louvres shield the sides of each emergency lamp. Its low source catches legs and flanks.
    for(const side of [-1,1])f.part(x+side*.69*Math.cos(toward),.33,z-side*.69*Math.sin(toward),.08,.47,.72,STEEL,toward);
    f.part(x,.15,z,2.3,.25,.25,INK,a);
    for(let j=-1;j<=1;j++)f.part(x+j*.70*Math.cos(a),.29,z-j*.70*Math.sin(a),.55,.072,.13,0x89a5ab,a,0,true);
   }
  }
  this.live=state.conduitLive;f.finish();
 }
 private mist(x:number,z:number,t:number,low:boolean){
  for(let j=0;j<(low?2:5);j++){
   const p=(t*.64+j*.39)%1;
   this.fittings.part(x+.35*p,.25+p*.72,z+.11*Math.sin(t+j),.35+.25*p,.52*(1-p),.1,0x9dafb2,p+j,0,true,true);
  }
 }
 private shutter(x:number,z:number,a:number,r:number,open:number,seconds:number,low:boolean){
  const part=(s:number,y:number,d:number,w:number,h:number,l:number,color:number,roll=0,lit=false)=>
   this.fittings.part(x+s*Math.cos(a)+d*Math.sin(a),y,z-s*Math.sin(a)+d*Math.cos(a),w,h,l,color,a,roll,lit);
  for(const side of [-1,1]){
   part(side*r,.77,0,.23,1.54,.55,STEEL);
   for(const y of [.48,1.03])part(side*r*(.47+open),y,.22,r*.99,.16,.14,BRASS);
   const slats=low?3:5,pitch=1.3/slats;
   for(let j=0;j<slats;j++)part(side*r*(.50+open),.06+(j+.5)*pitch,0,r*.95,pitch-.055,.34,j%2?0x35434c:0x53616a);
   part(side*r*(.50+open),1.39,0,r*.97,.12,.40,BRASS);
   for(const face of [-1,1])part(side*r*(.50+open),.75,face*.182,.14,.67,.035,BRASS,-side*.52);
  }
  // The readout sits horizontally on the jamb; its glyphs face the fixed deck camera.
  const panelX=x+r*Math.cos(a),panelZ=z-r*Math.sin(a);
  this.fittings.part(panelX,1.60,panelZ,1.16,.10,.80,INK);
  for(const [i,ch] of String(seconds).padStart(2,'0').slice(-2).split('').entries()){
   SEGMENTS.forEach(([dx,dz,horiz],j)=>{if(DIGITS[Number(ch)]&(1<<j))this.fittings.part(panelX+(i-.5)*.44+dx*1.5,1.66,panelZ-dz*1.5,horiz?.23:.05,.012,horiz?.05:.20,0xdad4ad,0,0,true);});
  }
 }
 dispose(){
  for(const p of this.patches){p.material.dispose();if(p.geometry!==this.plane)p.geometry.dispose();}
  this.plane.dispose();this.blank.dispose();this.fittings.dispose();this.root.removeFromParent();
 }
}
