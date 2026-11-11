import * as T from 'three';
import { EnergyRibbonBatch, TelegraphBatch } from '../vfx';
import type { EnergyRibbon, Telegraph } from '../vfx';
import type { GraphicsOptions } from '../graphicsOptions';
import type { GraphicsTier } from '../FrameBudget';
import type { LightPool } from '../lighting/LightPool';
import type { DistortionField } from '../post/DistortionField';
import type { AbilityElement } from '../../game/abilities/contract';
import { ELEMENT_COLORS } from './types';
import { InstanceBatch, type Primitive } from './InstanceBatch';

export const ABILITY_VFX_LIMITS = Object.freeze({ particles:768, rings:64, beams:64, decals:32, instances:2048 });
type Particle = {live:boolean;kind:Primitive;x:number;y:number;z:number;vx:number;vy:number;vz:number;size:number;life:number;age:number;color:number;seed:number};
type Wave = {live:boolean;x:number;z:number;radius:number;life:number;age:number;color:number;reverse:boolean};
type Beam = {live:boolean;age:number;life:number;delay:number;ribbon:EnergyRibbon};
type Decal = {live:boolean;x:number;z:number;radius:number;color:number;age:number;life:number;angle:number};
export interface AbilityServices {
  lights: LightPool;
  distortion: DistortionField;
  camera: {addTrauma(n:number):void;punch(n:number,ms:number):void;kick(angle:number,n:number):void};
}
/** Shared element language. Coordinates are render metres (simulation / 32), times seconds. */
export class ElementKit {
  readonly root = new T.Group();
  readonly batches: Record<Primitive, InstanceBatch>;
  readonly rings = new TelegraphBatch(this.root,160);
  readonly ribbons = new EnergyRibbonBatch(this.root,2048);
  time=0;
  low=false;
  reducedMotion=false;
  flashIntensity=1;
  private dynamicLights=true;
  private distortion=true;
  private services?:AbilityServices;
  private particles:Particle[]=Array.from({length:ABILITY_VFX_LIMITS.particles},()=>({live:false,kind:'spark',x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,life:1,age:0,color:0,seed:0}));
  private waves:Wave[]=Array.from({length:ABILITY_VFX_LIMITS.rings},()=>({live:false,x:0,z:0,radius:1,life:1,age:0,color:0,reverse:false}));
  private beams:Beam[]=Array.from({length:ABILITY_VFX_LIMITS.beams},()=>({live:false,age:0,life:1,delay:0,ribbon:{start:new T.Vector3(),end:new T.Vector3()}}));
  private decals:Decal[]=Array.from({length:ABILITY_VFX_LIMITS.decals},()=>({live:false,x:0,z:0,radius:1,color:0,age:0,life:1,angle:0}));
  private cursor=0;private waveCursor=0;private beamCursor=0;private decalCursor=0;private serial=0;
  private shape:Telegraph={shape:'shockwave',x:0,z:0};
  private line:EnergyRibbon={start:new T.Vector3(),end:new T.Vector3()};
  private light={x:0,y:1,z:0,color:0,intensity:0,distance:1,duration:.15,priority:2};
  private disposed=false;
  peakParticles=0;peakInstances=0;
  constructor(root:T.Object3D){
    root.add(this.root);this.root.name='ability-element-kit';
    this.batches={shard:new InstanceBatch(this.root,'shard',512),spark:new InstanceBatch(this.root,'spark',512),smoke:new InstanceBatch(this.root,'smoke',192),flame:new InstanceBatch(this.root,'flame',384),solid:new InstanceBatch(this.root,'solid',512),ghost:new InstanceBatch(this.root,'ghost',128),decal:new InstanceBatch(this.root,'decal',32)};
  }
  bind(services:AbilityServices):void {this.services=services;}
  setOptions(options:GraphicsOptions,tier:GraphicsTier,reducedMotion:boolean):void {
    this.low=tier==='low';this.reducedMotion=reducedMotion;this.flashIntensity=options.flashIntensity*(reducedMotion?.5:1);
    this.dynamicLights=options.dynamicLights;this.distortion=options.distortion;
  }
  /** Allocation-free solid, crystal, ember, smoke, flame, decal or ghost instance. */
  draw(kind:Primitive,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,opacity=1,angle=0,tilt=0):void {
    this.batches[kind].draw(x,y,z,sx,sy,sz,color,opacity*(kind==='spark'||kind==='flame'? .35+.65*this.flashIntensity:1),angle,tilt);
  }
  mote(kind:Primitive,x:number,y:number,z:number,vx:number,vy:number,vz:number,size:number,life:number,color:number):void {
    const cap=this.low?160:this.particles.length,p=this.particles[this.cursor++%cap];
    p.live=true;p.kind=kind;p.x=x;p.y=y;p.z=z;p.vx=vx;p.vy=vy;p.vz=vz;p.size=size;p.life=life;p.age=0;p.color=color;p.seed=++this.serial;
  }
  burst(x:number,y:number,z:number,element:AbilityElement,count=24,speed=3,life=.7):void {
    count=this.low?Math.min(6,count):count;
    for(let i=0;i<count;i++){
      const angle=i*2.3999632297+this.serial*.13,f=.4+(i%7)/10;
      this.mote(element==='cryo'?'shard':element==='pyro'?'flame':'spark',x,y,z,Math.cos(angle)*speed*f,(.2+i%5*.16)*speed,Math.sin(angle)*speed*f,element==='cryo'?.06:.09,life*(.6+i%4*.15),ELEMENT_COLORS[element]);
    }
  }
  ring(x:number,z:number,radius:number,color:number,life=.65,reverse=false):void {
    if(radius<=0)return;const p=this.waves[this.waveCursor++%this.waves.length];
    p.live=true;p.x=x;p.z=z;p.radius=radius;p.color=color;p.life=life;p.age=0;p.reverse=reverse;
  }
  outline(x:number,z:number,radius:number,color:number,opacity=.25,progress=1):void {
    const s=this.shape;s.shape='circle';s.x=x;s.z=z;s.radius=radius;s.color=color;s.opacity=opacity;s.progress=progress;this.rings.add(s);
  }
  beam(x:number,y:number,z:number,tx:number,ty:number,tz:number,color:number,width=.035,life=.22,lightning=true,delay=0):void {
    const p=this.beams[this.beamCursor++%this.beams.length];p.live=true;p.age=0;p.life=life;p.delay=delay;
    const r=p.ribbon;r.start.set(x,y,z);r.end.set(tx,ty,tz);r.color=color;r.width=width;r.lightning=lightning;r.seed=++this.serial;
  }
  ribbon(x:number,y:number,z:number,tx:number,ty:number,tz:number,color:number,width=.035,opacity=.6,lightning=true):void {
    const r=this.line;r.start.set(x,y,z);r.end.set(tx,ty,tz);r.color=color;r.width=width;r.opacity=opacity*this.flashIntensity;r.lightning=lightning;r.seed=7;
    this.ribbons.append(r,this.time,this.reducedMotion||this.low);
  }
  decal(x:number,z:number,radius:number,color:number,life=5,angle=0):void {
    const p=this.decals[this.decalCursor++%this.decals.length];p.live=true;p.x=x;p.z=z;p.radius=radius;p.color=color;p.life=life;p.age=0;p.angle=angle;
  }
  flash(x:number,z:number,color:number,intensity=8,distance=5,priority=3,duration=.18):void {
    if(this.low||!this.dynamicLights)return;
    const r=this.light;r.x=x;r.z=z;r.color=color;r.intensity=intensity;r.distance=distance;r.priority=priority;r.duration=duration;
    this.services?.lights.flash(r);
  }
  lightAt(id:number,x:number,z:number,color:number,intensity=2,distance=4):void {
    if(this.low||!this.dynamicLights)return;
    const r=this.light;r.x=x;r.z=z;r.color=color;r.intensity=intensity;r.distance=distance;r.priority=2;r.duration=.1;
    this.services?.lights.attach(-200000-id,r);
  }
  distort(x:number,z:number,radius:number,strength=.004,life=.6,heat=false):void {
    if(this.low||this.reducedMotion||!this.distortion)return;
    if(heat)this.services?.distortion.heat(x,z,radius,strength,life);else this.services?.distortion.shockwave(x,z,radius,strength,life);
  }
  camera(weight=.12,angle?:number):void {
    if(this.reducedMotion)return;
    this.services?.camera.addTrauma(weight);if(weight>.2)this.services?.camera.punch(Math.min(.035,weight*.06),220);
    if(angle!==undefined)this.services?.camera.kick(angle,weight*.1);
  }
  begin(dt:number):void {
    this.time+=dt;this.rings.clear();this.ribbons.begin();for(const kind in this.batches)this.batches[kind as Primitive].begin();
    let live=0;
    for(const p of this.particles){if(!p.live)continue;p.age+=dt;if(p.age>=p.life){p.live=false;continue;}live++;
      const motion=this.reducedMotion?.2:1;p.x+=p.vx*dt*motion;p.y+=p.vy*dt*motion;p.z+=p.vz*dt*motion;
      if(p.kind==='shard'||p.kind==='spark')p.vy-=dt*4;else p.vy+=dt*.15;
      p.y=Math.max(.04,p.y);const fade=1-p.age/p.life,s=p.size*(p.kind==='smoke'?1+p.age*2:1);
      this.draw(p.kind,p.x,p.y,p.z,s,p.kind==='spark'?s*2:s,s,p.color,fade*(p.kind==='smoke'?.22:.7),p.seed*.8,p.seed+p.age);
    }
    this.peakParticles=Math.max(this.peakParticles,live);
    for(const p of this.waves){if(!p.live)continue;p.age+=dt;if(p.age>=p.life){p.live=false;continue;}
      const s=this.shape;s.shape='shockwave';s.x=p.x;s.z=p.z;s.radius=p.radius;s.color=p.color;s.progress=p.reverse?1-p.age/p.life:p.age/p.life;s.opacity=(1-p.age/p.life)*.65*this.flashIntensity;this.rings.add(s);
    }
    for(const p of this.beams){if(!p.live)continue;p.age+=dt;if(p.age>=p.life+p.delay){p.live=false;continue;}if(p.age<p.delay)continue;
      p.ribbon.opacity=(1-(p.age-p.delay)/p.life)*this.flashIntensity;this.ribbons.append(p.ribbon,this.time,this.reducedMotion||this.low);
    }
    for(const p of this.decals){if(!p.live)continue;p.age+=dt;if(p.age>=p.life){p.live=false;continue;}
      this.draw('decal',p.x,.025,p.z,p.radius,p.radius,1,p.color,(1-p.age/p.life)*.55,0,p.angle);
    }
  }
  end():void {this.ribbons.end();let n=0;for(const kind in this.batches){const b=this.batches[kind as Primitive];b.end();n+=b.mesh.count;}this.peakInstances=Math.max(this.peakInstances,n);}
  get counts(){let particles=0,rings=0,beams=0;for(const p of this.particles)if(p.live)particles++;for(const p of this.waves)if(p.live)rings++;for(const p of this.beams)if(p.live)beams++;return {particles,rings,beams,peakParticles:this.peakParticles,peakInstances:this.peakInstances};}
  clear():void {for(const p of this.particles)p.live=false;for(const p of this.waves)p.live=false;for(const p of this.beams)p.live=false;for(const p of this.decals)p.live=false;this.rings.clear();this.ribbons.clear();for(const k in this.batches)this.batches[k as Primitive].begin();}
  dispose():void {if(this.disposed)return;this.disposed=true;this.clear();for(const k in this.batches)this.batches[k as Primitive].dispose();this.rings.dispose();this.ribbons.dispose();this.root.removeFromParent();}
}
