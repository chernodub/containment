import { bindPriorityMask } from './abilities/PriorityMask';
import {BOSS_BODIES} from '../game/enemies/bossDefinitions';
import {meleeStrikeContains} from '../game/enemies/meleeAttacks';
import {ENEMY_ATTACK_SHAPES} from '../game/enemies/attackShapes';
import {canTraverseExpedition} from '../game/world/expeditionGeometry';
import type {Telegraph} from './vfx/TelegraphBatch';
import type {EnemySnapshot} from '../game/enemies/EnemySystem';
import type {DepthGame} from '../DepthGame';
import * as T from 'three';
import type {WeaponId} from '../game/combat/types';
import type {Bullet,GameEffect} from '../DepthGame';
import {WEAPON_APPEARANCE} from './weapons';
import {FAMILY_IDENTITY} from './ActorIdentity';
import {wallSurface} from './wallSurface';
import {GRAPHIC_COMBUSTION_GLSL} from './abilities/GraphicLanguage';
import type {GraphicsOptions} from './graphicsOptions';
import type {GraphicsTier} from './FrameBudget';
import type {DeathCue} from './DeathRagdolls';
const UP=new T.Vector3(0,1,0),WHITE=new T.Color(0xffffff);
const meleeWarningWeight=(family:string,elite=false)=>family==='crawler'?(elite?.17:.12):family==='stalker'?.56:family==='brute'||family==='carrier'?.48:elite?.34:.24;
export type AttackEffectOptions=Partial<GraphicsOptions>&{reducedMotion?:boolean;tier?:GraphicsTier};
export type AttackFeedback={
 flash?:(event:{position:T.Vector3;color:number;intensity:number;radius:number;duration:number;priority:number})=>void;
 shockwave?:(event:{position:T.Vector3;radius:number;strength:number;duration:number})=>void;
};
type Particle={variant?:number;liquid?:boolean;wall?:T.Vector3;growth?:number;aspect?:number;direction?:number;p:T.Vector3;v:T.Vector3;color:T.Color;age:number;life:number;size:number;stretch:number;spin:number;rotation:number;gravity:number;ground:boolean};
type Pulse={p:T.Vector3;color:T.Color;age:number;life:number;radius:number;angle:number;slash:boolean;stable:boolean;arrival?:boolean};
export const EFFECT_LIMITS={glow:360,smoke:80,debris:80,pulses:24,decals:64,beams:320,fire:16} as const;
export const PRIORITY_ACTOR_LIMIT=130;
const vertex=`attribute float effectFrame; varying float vFrame;attribute vec4 effectShape;varying vec4 vShape;attribute float effectAlpha;varying vec2 vUv;varying vec3 vColor;varying float vAlpha;varying vec2 warningWorld;
void main(){vShape=effectShape;vFrame=effectFrame;vUv=uv;vColor=instanceColor;vAlpha=effectAlpha;warningWorld=(modelMatrix*instanceMatrix*vec4(position,1.0)).xz;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;
const fragment=`uniform sampler2D map;uniform float inset;uniform float grid;uniform float textured;uniform float flashScale;varying float vFrame;uniform float style;varying vec4 vShape;varying vec2 vUv;varying vec3 vColor;varying float vAlpha;
${GRAPHIC_COMBUSTION_GLSL}
uniform vec4 warningOrigin[57];uniform vec4 warningSize[57];uniform vec4 warningTime[57];
uniform int warningCount;uniform int primaryWarning;uniform float warningFillScale;varying vec2 warningWorld;
void main(){vec2 p=vUv*2.0-1.0;float d=length(p);float alpha=vAlpha;vec3 color=vColor;
if(style>6.5){
 if(d>1.0)discard;
 if(vFrame<-.5){color=vec3(.006,.008,.009);alpha*=.88*(1.0-smoothstep(.75,1.0,d));}
 else{float edge=1.0-smoothstep(.74,.91,d),core=1.0-smoothstep(.04,.14,abs(d-.32));color=mix(vec3(.008,.006,.009),vec3(1.65,.018,.044),edge);color=mix(color,vec3(2.3,2.1,1.95),core);alpha*=1.0-smoothstep(.92,1.0,d);}
}
else if(style>5.5 && vFrame>.5){
 float shaft=(1.-smoothstep(.12,.43,abs(p.y)))*(1.-smoothstep(.77,1.,vUv.x));
 float organ=1.-smoothstep(.55,1.,length(vec2((vUv.x-.10)*9.,p.y)));
 float pulse=.72+.28*sin(vShape.x*7.85);
 color=vec3(1.65,.018,.044);
 alpha*=max(shaft*.78,organ*pulse);
}
else if(style>5.5){
 // Merge the capsule footprints before inking their perimeter. A group
 // shares the longitudinal front of its earliest commitment.
 float fill=0.,core=0.,key=0.,pulseInk=0.,laneBoundary=1e4;
 for(int i=0;i<57;i++){
  if(i>=warningCount)break;
  vec4 o=warningOrigin[i],sz=warningSize[i],tm=warningTime[i];
  vec2 delta=warningWorld-o.xy;
  vec2 q=vec2(dot(delta,o.zw),dot(delta,vec2(-o.w,o.z)));
  bool lane=sz.w>.5&&sz.w<1.5;
  float radial=length(lane?vec2(q.x-clamp(q.x,0.,sz.y),q.y):q);
  float boundary=radial-sz.x;
  if(boundary>.14)continue;
  if(sz.w>1.5){
   float angle=abs(atan(q.y,q.x))-sz.z;
   boundary=max(boundary,sin(clamp(angle,-1.5708,1.5708))*radial);
  }
  if(boundary>.14)continue;
  int leader=int(tm.w);
  bool primary=leader==primaryWarning || i==primaryWarning;
  float pulse=primary ? sin(3.14159*clamp(warningTime[max(0,primaryWarning)].y/.2,0.,1.))*flashScale : 0.;
  float advance=lane?smoothstep(0.,max(.08,sz.y+sz.x),q.x):smoothstep(0.,sz.x,radial);
  if(boundary<=0.)fill=max(fill,.18*advance*warningFillScale);

  if(lane){
   laneBoundary=min(laneBoundary,boundary);
   vec4 lead=warningOrigin[leader],extent=warningSize[leader];
   float along=dot(warningWorld-lead.xy,lead.zw);
   float front=mix(0.,extent.y+extent.x,clamp(warningTime[leader].x,.12,1.));
   float edge=abs(along-front);
   float hull=1.-smoothstep(-.02,.062,boundary);
   key=max(key,hull*(1.-smoothstep(.075,.122,edge)));
   float stroke=hull*(1.-smoothstep(.026+.010*pulse,.054+.010*pulse,edge));
   core=max(core,stroke*(primary?.95:.75));
   pulseInk=max(pulseInk,stroke*pulse);
  }else{
   float edge=abs(radial-sz.x);
   float limit=1.-smoothstep(.005,.055,boundary);
   key=max(key,max(.62*(1.-smoothstep(.055,.11,abs(boundary))),limit*(1.-smoothstep(.082,.13,edge))));
   float stroke=limit*(1.-smoothstep(.026+.012*pulse,.065+.012*pulse,edge));
   core=max(core,stroke*(primary?.98:.79));
   pulseInk=max(pulseInk,stroke*pulse);
  }
 }
 // The union's muted perimeter survives even when the traveling front
 // passes under the marine. Internal capsule edges are absent.
 float hullDistance=abs(laneBoundary);
 float hullInk=.54*(1.-smoothstep(.014,.039,hullDistance));
 key=max(key,.88*(1.-smoothstep(.049,.098,hullDistance)));
 float ink=max(fill,key*.94);
 color=mix(vec3(.016,.005,.009),vec3(.78,.025,.041),fill/max(.001,fill+key));
 color=mix(color,vec3(1.65,.018,.044),hullInk);
 color=mix(color,vec3(1.65,.018,.044)*(1.+.35*pulseInk),core);
 alpha=max(ink,core);

}
else if(style>4.5){
 float grain=fract(sin(dot(floor(p*80.0),vec2(12.9898,78.233)))*43758.5453);
 float edge=1.0-smoothstep(.70+grain*.18,1.0,d);
 if(vFrame<.5){float hole=1.0-smoothstep(.08,.38,d);float rim=(1.0-smoothstep(.34,.53,d))*.28;color=mix(color,vec3(.012,.017,.019),hole);alpha*=max(hole,rim)*edge;}
 else if(vFrame<1.5){alpha*=edge*(.3+grain*.35)*(1.0-smoothstep(.25,.95,d));}
 else if(vFrame<2.5){float pools=sin(p.x*11.0+p.y*4.0)*sin(p.y*13.0-p.x*3.0);alpha*=edge*(.18+smoothstep(-.3,.4,pools)*.5);}
 else if(vFrame<3.5){float crystal=pow(1.0-abs(sin(atan(p.y,p.x)*6.0+d*12.0)),12.0);alpha*=edge*(.08+crystal*.6);}
 else{float drops=sin(p.x*17.0)*sin(p.y*21.0);alpha*=edge*(.18+smoothstep(-.1,.4,drops)*.6);}
}
else if(style>3.5){
 // Dry, disconnected frost deposits, not a liquid disk. The plane and hard
 // outer clip retain the real radius; a quiet broken fringe indicates its reach.
 vec2 q=p*2.8+vec2(sin(p.y*7.0),sin(p.x*5.0))*.18;
 vec2 cell=floor(q+.5);vec2 local=fract(q+.5)-.5;
 float seed=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);
 float angle=atan(local.y,local.x)+seed*6.28;float reach=length(local);
 float spoke=abs(sin(angle*3.0))*reach;
 float trunk=1.0-smoothstep(.010,.025,spoke);
 float twig=1.0-smoothstep(.008,.020,abs(sin(reach*43.0+spoke*32.0))*reach);
 float crystal=max(trunk,twig*.35)*(1.0-smoothstep(.22,.45,reach));
 float grain=fract(sin(dot(floor(p*95.0),vec2(12.9898,78.233)))*43758.5453);
 float deposits=sin(p.x*8.0+p.y*3.0)*sin(p.y*9.0-p.x*2.0);
 float patches=smoothstep(-.12,.48,deposits);
 float boundary=.86+.08*sin(atan(p.y,p.x)*5.0+.7)+.06*sin(atan(p.y,p.x)*9.0);
 float brokenEdge=1.0-smoothstep(boundary-.12,min(1.0,boundary+.05),d);
 alpha*=brokenEdge*patches*(.025+crystal*.34+step(.975,grain)*.065);
 color=mix(vec3(.18,.34,.39),vec3(.48,.67,.72),crystal);
 if(d>1.0)discard;
}
else if(vFrame<0.0){float drop=length(vec2(p.x/(.76-.18*p.y),p.y));alpha*=1.0-smoothstep(.82,1.0,drop);color*=.72+.28*max(0.0,1.0-drop);color=mix(color,mix(color,vec3(1.0),.35),.35*(1.0-smoothstep(.08,.30,length(p-vec2(-.22,.28)))));}
else if(style<0.5){alpha*=pow(max(0.0,1.0-d),1.8);color*=1.0+2.0*pow(max(0.0,1.0-d),5.0);}
else if(style<1.5){float n=.86+.09*sin(p.x*13.0+p.y*7.0)+.05*sin(p.y*19.0-p.x*4.0);alpha*=(1.0-smoothstep(.15,1.0,d/n))*.48;}
if(textured>.5&&vFrame>=0.0){float frame=floor(vFrame);vec2 cell=vec2(mod(frame,grid),grid-1.0-floor(frame/grid));vec4 tex=texture2D(map,(cell+clamp(vUv,inset,1.0-inset))/grid,1.5);alpha=vAlpha*graphicCoverage(tex.a)*(style>2.5?.9*smoothstep(.0,.12,vUv.y):.42);color=style>2.5?graphicCombustion(tex):graphicSmoke(tex,vColor);}
if(style<.5||style>2.5&&style<3.5)alpha*=flashScale;
if(alpha<.003)discard;gl_FragColor=vec4(color,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function pool(scene:T.Scene,geometry:T.BufferGeometry,count:number,style:number,additive=false,texture?:T.Texture,grid=1){
 geometry.setAttribute('effectShape',new T.InstancedBufferAttribute(new Float32Array(count*4),4).setUsage(T.DynamicDrawUsage));
 geometry.setAttribute('effectFrame',new T.InstancedBufferAttribute(new Float32Array(count),1));
 const alpha=new T.InstancedBufferAttribute(new Float32Array(count),1);alpha.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectAlpha',alpha);
 const material=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{style:{value:style},flashScale:{value:1},map:{value:texture??null},grid:{value:grid},inset:{value:grid===5?.5/256:.5/128},textured:{value:texture?1:0}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:additive?T.AdditiveBlending:T.NormalBlending});
 const mesh=new T.InstancedMesh(geometry,material,count);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.setColorAt(0,WHITE);mesh.frustumCulled=false;scene.add(mesh);return mesh;
}
/** Bounded GPU instance pools: no lights or draw call per pellet / particle. */
export class AttackEffects {
 private readonly nativeWarnings=Array.from({length:32},()=>({active:false,id:0,family:'',melee:false,striking:false,heavy:false,weight:1,durationMs:1,remainingMs:0,shape:{shape:'line',x:0,z:0,length:-1,width:0,angle:0} as Telegraph}));
 private readonly shooters = new Map<number, {x:number;y:number;z:number;angle:number;progress:number;fade:number}>();
 private readonly activeShooters = new Set<number>();
 private readonly warningFrom={x:0,y:0};private readonly warningTo={x:0,y:0};
 private warningFrustum:T.Frustum|undefined;private readonly warningBounds=new T.Sphere();
 /** Borrow the renderer's settled frustum; warning state and priority stay live. */
 setWarningFrustum(frustum:T.Frustum):void{this.warningFrustum=frustum;}
 private warningVisible(x:number,z:number,radius:number,length=0,angle=0,y=.04):boolean{
  if(!this.warningFrustum)return true;
  const halfLength=length*.5;
  this.warningBounds.center.set(x+Math.cos(angle)*halfLength,y,z+Math.sin(angle)*halfLength);this.warningBounds.radius=halfLength+radius;
  return this.warningFrustum.intersectsSphere(this.warningBounds);
 }
 /** Presentation-only overlap for the suit locator; no attack acceptance uses this. */
 warningNear(x:number,z:number,padding=.8):boolean{
  for(const warning of this.nativeWarnings){
   if(!warning.active)continue;
   const w=warning.shape,dx=x-w.x,dz=z-w.z,angle=w.angle??0;
   const reach=Math.max(w.radius??0,w.length??0)+(w.width??0)*.5+padding;
   if(Math.abs(dx)>reach||Math.abs(dz)>reach)continue;
   if(w.shape==='line'||w.shape==='wall'){
    const along=dx*Math.cos(angle)+dz*Math.sin(angle),side=-dx*Math.sin(angle)+dz*Math.cos(angle);
    const outside=Math.max(0,-along,along-(w.length??0)),radius=(w.width??0)*.5+padding;
    if(outside*outside+side*side<=radius*radius)return true;
   }else{
    const radius=(w.radius??0)+padding;
    if(dx*dx+dz*dz>radius*radius)continue;
    if(w.shape!=='cone'||Math.abs(Math.atan2(Math.sin(Math.atan2(dz,dx)-angle),Math.cos(Math.atan2(dz,dx)-angle)))<=(w.arc??Math.PI)*.5+Math.asin(Math.min(1,padding/Math.max(padding,Math.hypot(dx,dz)))))return true;
   }
  }
  for(const pulse of this.pulses)if(pulse.stable&&pulse.age<pulse.life&&Math.hypot(x-pulse.p.x,z-pulse.p.z)<=pulse.radius+padding)return true;
  const boss=this.bossWarning;
  return !!boss&&Math.hypot(x-boss.x,z-boss.z)<=boss.radius+padding;
 }
 private readonly priorityShape={shape:'circle' as const,x:0,z:0,radius:0};
 /** Read-only live hostile warning footprints for friendly-effect priority. No copies or rendering changes. */
 forEachHostilePriority(visit:(shape:Readonly<Telegraph>)=>void):void{for(const warning of this.nativeWarnings)if(warning.active&&warning.shape.length!==-1)visit(warning.shape);for(const p of this.pulses){if(!p.stable||p.age>=p.life)continue;const s=this.priorityShape;s.x=p.p.x;s.z=p.p.z;s.radius=p.radius;visit(s);}if(this.bossWarning){const s=this.priorityShape,w=this.bossWarning;s.x=w.x;s.z=w.z;s.radius=w.radius;visit(s);}}
 forEachShooterPriority(visit:(x:number,y:number,z:number,angle:number,id:number)=>void):void {
  for (const [id,cue] of this.shooters) visit(cue.x,cue.y,cue.z,cue.angle,id);
 }
 private fields:Pulse[]=[];private fieldMesh:T.InstancedMesh;
 private fire:Particle[]=[];private fireMesh:T.InstancedMesh;private textures:T.Texture[]=[];
 private links:{start:T.Vector3;end:T.Vector3;age:number;frost:boolean}[]=[];
 private arcs:{start:T.Vector3;end:T.Vector3;age:number;seed:number;ball?:boolean}[]=[];
 private glow:Particle[]=[];private smoke:Particle[]=[];private debris:Particle[]=[];private decals:Particle[]=[];private pulses:Pulse[]=[];
 private glowMesh:T.InstancedMesh;private smokeMesh:T.InstancedMesh;private debrisMesh:T.InstancedMesh;private decalMesh:T.InstancedMesh;private pulseMesh:T.InstancedMesh;private slashMesh:T.InstancedMesh;private beamMesh:T.InstancedMesh;
 private readonly emptyPriorityTexture = new T.DataTexture(new Uint8Array(4),1,1,T.RGBAFormat);
 private readonly maskedGround: T.ShaderMaterial[] = [];
 setGroundPriorityTexture(texture: T.Texture | undefined, sample = true): void {
  for (const material of this.maskedGround) {
   material.uniforms.abilityPriorityMap.value = texture ?? this.emptyPriorityTexture;
   material.uniforms.diagnosticPrioritySampling.value = sample;
  }
 }
 showFloorDecals(visible: boolean): void { this.decalMesh.visible = visible; }
 private hostileMesh:T.InstancedMesh;private hostileWarningMesh:T.InstancedMesh;private bossWarning:{x:number;z:number;radius:number;progress:number}|null=null;
 private readonly priorityViewport=new T.Vector2(1,1);
 private priorityCamera:T.Camera|undefined;private readonly priorityPoint=new T.Vector3();
 private readonly warningMarineShape: {kind: "cone"|"line";range:number;width:number;halfAngle:number}={kind:'cone',range:0,width:0,halfAngle:0};
 private readonly primaryWarning={value:-1};
 private readonly warningOrigins=Array.from({length:57},()=>new T.Vector4());
 private readonly warningSizes=Array.from({length:57},()=>new T.Vector4());
 private readonly warningTimes=Array.from({length:57},()=>new T.Vector4());
 private readonly warningFamilies:string[]=Array(57).fill('');
 private readonly warningParents=new Int16Array(57);private readonly warningSoonest=new Int16Array(57);
 private readonly unionCount={value:0};private readonly unionFillScale={value:1};
 private warningMinX=0;private warningMinZ=0;private warningMaxX=0;private warningMaxZ=0;private warningCoverage=0;

 private dummy=new T.Object3D();private forward=new T.Vector3();private previous=new WeakMap<Bullet,T.Vector3>();private trailClock=0;private boonBursts=0;private arcBursts=0;
 private options:AttackEffectOptions={flashIntensity:1,reducedMotion:false,tier:'high',dynamicLights:true,distortion:true};
 private feedback:AttackFeedback={};private particleFree=new Map<Particle[],Particle[]>();private disposed=false;
 private bulletPosition=new T.Vector3();private bulletPrevious=new T.Vector3();private axis=new T.Vector3(0,0,1);private beamColor=new T.Color();
 private arcAxis=new T.Vector3();private arcSide=new T.Vector3();private arcStart=new T.Vector3();private arcEnd=new T.Vector3();private forkStart=new T.Vector3();private forkEnd=new T.Vector3();
 constructor(scene:T.Scene,loader:T.TextureLoader|undefined=typeof document==='undefined'?undefined:new T.TextureLoader(),private world?:T.Object3D){
  const texture=(name:string,srgb=false)=>{const t=loader?.load(`${import.meta.env.BASE_URL}assets/vfx/${name}.png`)??new T.Texture();t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;this.textures.push(t);return t;};
  this.fireMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.fire,3,false,texture('Explosion01',true),5);this.fireMesh.name='explosion-fire';
  this.glowMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.glow,0,true);
  this.smokeMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.smoke,1,false,texture('WispySmoke02'),8);
  this.debrisMesh=pool(scene,new T.BoxGeometry(1,1,1),EFFECT_LIMITS.debris,2);
  this.decalMesh=pool(scene,new T.PlaneGeometry(1,1),EFFECT_LIMITS.decals,5);this.decalMesh.name='contact-decals';
  this.pulseMesh=pool(scene,new T.RingGeometry(.955,1,48),EFFECT_LIMITS.pulses,2,true);this.pulseMesh.renderOrder=20;
  this.slashMesh=pool(scene,new T.RingGeometry(.72,1,16,1,-.65,1.3),EFFECT_LIMITS.pulses,2,true);
  this.beamMesh=pool(scene,new T.CylinderGeometry(.16,1,1,5),EFFECT_LIMITS.beams,2,true);this.beamMesh.name='weapon-tracers';
  // Keep the existing pool order stable for renderer diagnostics.
  scene.remove(this.fireMesh);scene.add(this.fireMesh);
  this.fieldMesh=pool(scene,new T.PlaneGeometry(1,1),4,4);this.fieldMesh.name='frost-fields';
  this.hostileMesh=pool(scene,new T.PlaneGeometry(2,2),320,7);this.hostileMesh.name='hostile-projectiles';this.hostileMesh.renderOrder=40;(this.hostileMesh.material as T.Material).depthTest=false;
  this.hostileWarningMesh=pool(scene,new T.PlaneGeometry(2,2),1+64,6);this.hostileWarningMesh.name='hostile-warning-union';this.hostileWarningMesh.renderOrder=30;(this.hostileWarningMesh.material as T.Material).depthTest=true;(this.hostileWarningMesh.material as T.Material).forceSinglePass=true;
  Object.assign((this.hostileWarningMesh.material as T.ShaderMaterial).uniforms,{warningOrigin:{value:this.warningOrigins},warningSize:{value:this.warningSizes},warningTime:{value:this.warningTimes},warningCount:this.unionCount,primaryWarning:this.primaryWarning,warningFillScale:this.unionFillScale});
  this.emptyPriorityTexture.needsUpdate=true;
  for (const mesh of [this.decalMesh,this.fieldMesh,this.pulseMesh,this.slashMesh,this.beamMesh,this.fireMesh,this.smokeMesh]) {
   const material=mesh.material as T.ShaderMaterial;
   bindPriorityMask(material,this.emptyPriorityTexture,undefined,true);
   this.maskedGround.push(material);
  }
  for(const [list,limit]of [[this.fire,EFFECT_LIMITS.fire],[this.glow,EFFECT_LIMITS.glow],[this.smoke,EFFECT_LIMITS.smoke],[this.debris,EFFECT_LIMITS.debris],[this.decals,EFFECT_LIMITS.decals]] as const){
   const free:Particle[]=[];for(let i=0;i<limit;i++)free.push({p:new T.Vector3(),v:new T.Vector3(),color:new T.Color(),age:0,life:0,size:0,stretch:1,spin:0,rotation:0,gravity:0,ground:false});this.particleFree.set(list,free);
  }
 }
 /** Additive preferences; safe to change during combat or tier switches. */
 setOptions(options:AttackEffectOptions){
  this.options={...this.options,...options,flashIntensity:T.MathUtils.clamp(options.flashIntensity??this.options.flashIntensity??1,0,1)};
  for(const mesh of this.meshes())(mesh.material as T.ShaderMaterial).uniforms.flashScale.value=(this.options.flashIntensity??1)*(this.options.reducedMotion?.55:1);
  if(this.options.tier==='low')for(const [list,free]of this.particleFree){const limit=list===this.fire?EFFECT_LIMITS.fire:list===this.glow?EFFECT_LIMITS.glow:list===this.smoke?EFFECT_LIMITS.smoke:list===this.debris?EFFECT_LIMITS.debris:EFFECT_LIMITS.decals;const cap=Math.max(4,Math.floor(limit*.45));while(list.length>cap)free.push(list.pop()!);}
 }
 /** Event-local vectors may be reused; copy the position if a callback retains it. */
 setFeedback(feedback:AttackFeedback){this.feedback=feedback;}
 /** Projectiles retain post-HDR priority; union warnings stay depth-tested
  * beneath the actual actor silhouettes in the world pass. */
 setPriorityScene(scene:T.Object3D){scene.add(this.hostileMesh);}
 /** Actual screen framebuffer pixels, matching gl_FragCoord after HDR/post. */
 setPriorityViewport(width:number,height:number){this.priorityViewport.set(Math.max(1,width),Math.max(1,height));}
 /** Ground warnings remain in the world depth pass: actors occlude their exact silhouettes. */
 beginPriorityActors(camera:T.Camera){this.priorityCamera=camera;}
 /** Retained caller API; no screen-space discs or approximate body cut-outs. */
 addPriorityActor(_x:number,_z:number,_radius:number,_height:number){}
 private queueWarning(x:number,z:number,radius:number,length:number,angle:number,arc:number,kind:number,progress:number,remaining:number,heavy:boolean,marineX:number,marineZ:number,marineRadius:number,family=""){
  const i=this.unionCount.value;if(i>=57||radius<=0)return;
  this.warningFamilies[i]=family;
  this.warningOrigins[i].set(x,z,Math.cos(angle),Math.sin(angle));
  this.warningSizes[i].set(radius,length,arc,kind);this.warningTimes[i].set(progress,Math.max(0,remaining)/1000,heavy?1:0,0);this.unionCount.value++;
  const shape=this.warningMarineShape;
  shape.kind=kind===1?'line':'cone';shape.range=kind===1?length:radius;shape.width=radius*2;shape.halfAngle=arc;
  const hits=kind===0?Math.hypot(marineX-x,marineZ-z)<=radius+marineRadius:
   meleeStrikeContains(shape,x,z,angle,marineX,marineZ,marineRadius);
  const previous=this.primaryWarning.value;
  if(hits&&(previous<0||remaining/1000<this.warningTimes[previous].y))this.primaryWarning.value=i;
  const reach=radius+.14,endX=x+(kind===1?Math.cos(angle)*length:0),endZ=z+(kind===1?Math.sin(angle)*length:0);
  const minX=Math.min(x,endX)-reach,maxX=Math.max(x,endX)+reach,minZ=Math.min(z,endZ)-reach,maxZ=Math.max(z,endZ)+reach;
  this.warningMinX=Math.min(this.warningMinX,minX);this.warningMaxX=Math.max(this.warningMaxX,maxX);this.warningMinZ=Math.min(this.warningMinZ,minZ);this.warningMaxZ=Math.max(this.warningMaxZ,maxZ);
  // Conservative projected AABB × maximum fill alpha bounds total optical fill
  // coverage to 7% of the viewport. Edges are deliberately outside this budget.
  if(this.priorityCamera){let l=1,r=-1,t=1,b=-1;for(let k=0;k<4;k++){const p=this.priorityPoint.set(k&1?maxX:minX,.04,k&2?maxZ:minZ).project(this.priorityCamera);l=Math.min(l,p.x);r=Math.max(r,p.x);t=Math.min(t,p.y);b=Math.max(b,p.y);}
   const area=Math.max(0,Math.min(1,r)-Math.max(-1,l))*Math.max(0,Math.min(1,b)-Math.max(-1,t))*.25;
   const urgency=1-T.MathUtils.smoothstep(Math.max(0,remaining)/1000,.055,.30);
   this.warningCoverage+=area*T.MathUtils.lerp(.025,heavy?.30:.24,urgency);
  }
 }
 private warningRoot(i:number):number{while(this.warningParents[i]!==i)i=this.warningParents[i];return i;}
 private groupWarnings(){
  const n=this.unionCount.value;
  for(let i=0;i<n;i++){this.warningParents[i]=i;this.warningSoonest[i]=i;}
  for(let i=0;i<n;i++)for(let j=0;j<i;j++){
   const a=this.warningOrigins[i],b=this.warningOrigins[j],sa=this.warningSizes[i],sb=this.warningSizes[j];
   const la=sa.w>.5&&sa.w<1.5?sa.y:0,lb=sb.w>.5&&sb.w<1.5?sb.y:0;
   if(!la||!lb||this.warningFamilies[i]!==this.warningFamilies[j]||a.z*b.z+a.w*b.w<.92)continue;
   const ax=a.x+a.z*la,az=a.y+a.w*la,bx=b.x+b.z*lb,bz=b.y+b.w*lb;
   // Conservative footprint AABB components catch crossing lanes whose far
   // endpoints differ. This changes hierarchy only, never a shape's clip.
   if(Math.max(a.x,ax)+sa.x<Math.min(b.x,bx)-sb.x||Math.max(b.x,bx)+sb.x<Math.min(a.x,ax)-sa.x||Math.max(a.y,az)+sa.x<Math.min(b.y,bz)-sb.x||Math.max(b.y,bz)+sb.x<Math.min(a.y,az)-sa.x)continue;
   // Measure the lateral gap over the shared longitudinal interval. The
   // broad-phase AABBs alone overjoin oblique rows across empty floor.
   const dx=b.x-a.x,dz=b.y-a.y;
   const start=dx*a.z+dz*a.w, alignment=b.z*a.z+b.w*a.w;
   const end=start+lb*alignment;
   const from=Math.max(0,start),to=Math.min(la,end),reach=sa.x+sb.x;
   if(from>to+reach)continue;
   const side=dz*a.z-dx*a.w,slope=(b.w*a.z-b.z*a.w)/alignment;
   const sideFrom=side+(T.MathUtils.clamp(from,start,end)-start)*slope;
   const sideTo=side+(T.MathUtils.clamp(to,start,end)-start)*slope;
   if(sideFrom*sideTo>0&&Math.min(Math.abs(sideFrom),Math.abs(sideTo))>reach)continue;
   const ra=this.warningRoot(i),rb=this.warningRoot(j);if(ra===rb)continue;
   this.warningParents[rb]=ra;
   if(this.warningTimes[this.warningSoonest[rb]].y<this.warningTimes[this.warningSoonest[ra]].y)this.warningSoonest[ra]=this.warningSoonest[rb];
  }
  const primary=this.primaryWarning.value;
  if(primary>=0)this.warningSoonest[this.warningRoot(primary)]=primary;
  for(let i=0;i<n;i++)this.warningTimes[i].w=this.warningSoonest[this.warningRoot(i)];
 }
 /** Synchronize attack presentation to native shape and remaining wind-up; never drives a hit. */
 syncEnemyWarnings(enemies:DepthGame['enemies']['snapshot']['enemies'],geometry:DepthGame['geometry'], game?:DepthGame, firingSocket?:(id:number)=>T.Vector3|undefined):void {
  if (game) for (const enemy of enemies) {
   if (!game.getEscortRetreat(enemy.id)) continue;
   // A retreat can start while the earlier arrival ring is still on deck.
   for (const pulse of this.pulses) {
    if (pulse.arrival && Math.hypot(pulse.p.x - enemy.x / 32, pulse.p.z - enemy.y / 32) <= pulse.radius)
     pulse.age = pulse.life;
   }
  }
  this.activeShooters.clear();
  for (const enemy of enemies) {
   if (enemy.type !== 'spitter' || enemy.pod || enemy.health <= 0 || enemy.pendingAttack !== 'spit' || enemy.windupMs <= 0 || game?.getEscortRetreat(enemy.id)) continue;
   const angle = Math.atan2(enemy.lockY-enemy.y,enemy.lockX-enemy.x);
   const distance = enemy.radius / 32 * .55;
   const cue = this.shooters.get(enemy.id) ?? {x:0,y:0,z:0,angle:0,progress:0,fade:-1};
   const socket=firingSocket?.(enemy.id);
   cue.x=socket?.x??enemy.x/32+Math.cos(angle)*distance;
   cue.z=socket?.z??enemy.y/32+Math.sin(angle)*distance;
   cue.y=socket?socket.y+.06:.99;
   cue.angle=angle;
   cue.progress=1-Math.min(1,enemy.windupMs/650);
   cue.fade=-1;
   this.activeShooters.add(enemy.id);
   this.shooters.set(enemy.id,cue);
  }
  for (const [id, cue] of this.shooters) if (cue.fade < 0 && !this.activeShooters.has(id)) this.shooters.delete(id);
  for(const warning of this.nativeWarnings){
   if(!warning.active)continue;
   if(game?.getEscortRetreat(warning.id)){warning.active=false;continue;}
   let enemy:typeof enemies[number]|undefined;
   for(const candidate of enemies)if(candidate.id===warning.id){enemy=candidate;break;}
   warning.family=enemy?.type??'';
   warning.heavy=!!enemy&&(enemy.type==='brute'||!!enemy.champion);
   if(warning.melee){
    if(!enemy||enemy.health<=0||(enemy.meleePhase!=='windup'&&enemy.meleePhase!=='strike')){warning.active=false;continue;}
    const w=warning.shape,m=enemy.meleeShape;w.shape=m.kind==='line'?'line':'cone';w.x=enemy.meleeOriginX/32;w.z=enemy.meleeOriginY/32;w.angle=enemy.meleeAngle;w.radius=m.range/32;w.length=m.range/32;w.width=m.width/32;w.arc=m.halfAngle*2;warning.striking=enemy.meleePhase==='strike';w.progress=warning.striking?1:enemy.meleeProgress;warning.remainingMs=enemy.meleeRemainingMs;warning.weight=meleeWarningWeight(enemy.type,enemy.elite);continue;
   }
   if(!enemy||enemy.health<=0||enemy.windupMs<=0||!enemy.pendingAttack){warning.active=false;continue;}
   const shape=warning.shape,charge=enemy.pendingAttack==='charge';
   const angle=charge?Math.atan2(enemy.lockY,enemy.lockX):Math.atan2(enemy.lockY-enemy.y,enemy.lockX-enemy.x);
   const radius=charge?enemy.radius:enemy.pod?enemy.radius:(enemy.broodRemainingMs??0)>0?BOSS_BODIES.matron.hatchRingMax:ENEMY_ATTACK_SHAPES.spitterProjectileRadius;
   if(!charge){shape.shape='circle';shape.x=enemy.lockX/32;shape.z=enemy.lockY/32;shape.radius=radius/32;shape.width=radius*2/32;shape.length=0;shape.angle=angle;warning.remainingMs=enemy.windupMs;shape.progress=1-enemy.windupMs/warning.durationMs;continue;}
   shape.shape='line';
   if(shape.length!<0||Math.hypot(shape.x-enemy.x/32,shape.z-enemy.y/32)>.03){
    const maximum=charge?(enemy.chargeWarningLength??ENEMY_ATTACK_SHAPES.chargeSpeed*ENEMY_ATTACK_SHAPES.chargeDurationMs/1000):ENEMY_ATTACK_SHAPES.spitterProjectileSpeed*ENEMY_ATTACK_SHAPES.spitterProjectileLife;
    this.warningFrom.x=enemy.x;this.warningFrom.y=enemy.y;
    let legal=0,blocked=maximum;
    for(let distance=16;distance<=maximum+16;distance+=16){const probe=Math.min(distance,maximum);this.warningTo.x=enemy.x+Math.cos(angle)*probe;this.warningTo.y=enemy.y+Math.sin(angle)*probe;if(!canTraverseExpedition(geometry,this.warningFrom,this.warningTo,radius)){blocked=probe;break;}legal=probe;if(probe===maximum)break;}
    if(legal<maximum)for(let step=0;step<6;step++){const probe=(legal+blocked)/2;this.warningTo.x=enemy.x+Math.cos(angle)*probe;this.warningTo.y=enemy.y+Math.sin(angle)*probe;if(canTraverseExpedition(geometry,this.warningFrom,this.warningTo,radius))legal=probe;else blocked=probe;}
    shape.length=legal/32;
   }
   shape.x=enemy.x/32;shape.z=enemy.y/32;shape.angle=angle;shape.width=radius*2/32;
   warning.remainingMs=enemy.windupMs;shape.progress=1-enemy.windupMs/warning.durationMs;
  }
 }

 /** Snapshot coordinates in world units; one reserved prewarmed warning slot. */
 setBossWarning(x:number,z:number,radius:number,progress:number,visible=true){
  if(!visible){this.bossWarning=null;return;}
  const w=this.bossWarning??(this.bossWarning={x:0,z:0,radius:0,progress:0});w.x=x;w.z=z;w.radius=radius;w.progress=T.MathUtils.clamp(progress,0,1);
 }
 private flash(position:T.Vector3,color:number,intensity:number,radius:number,duration:number,priority:number){
  if(this.options.dynamicLights===false||!(this.options.flashIntensity??1))return;
  this.feedback.flash?.({position,color,intensity:intensity*(this.options.flashIntensity??1)*(this.options.reducedMotion?.5:1),radius,duration,priority});
 }
 /** Room loads replace the rendered geometry group. Never retain its disposed predecessor. */
 setWorld(world:T.Object3D){this.world=world;}
 private particle(list:Particle[],limit:number,p:T.Vector3,color:number,size:number,life:number,v?:T.Vector3,gravity=0,stretch=1){
  const cap=this.options.tier==='low'?Math.max(4,Math.floor(limit*.45)):limit;
  const item=list.length>=cap?list.shift()!:this.particleFree.get(list)!.pop()!;
  item.p.copy(p);if(v)item.v.copy(v);else item.v.set(0,0,0);item.color.setHex(color);item.age=0;item.life=life;item.size=size;item.stretch=stretch;
  item.spin=list===this.decals?0:(Math.random()-.5)*(list===this.smoke?.9:12)*(this.options.reducedMotion?.2:1);item.rotation=Math.random()*6.28;item.gravity=gravity;item.ground=list===this.decals;
  item.liquid=false;item.wall=undefined;item.growth=undefined;item.aspect=undefined;item.direction=undefined;item.variant=list===this.decals?1:undefined;list.push(item);
 }
 private pulse(p:T.Vector3,color:number,radius:number,life:number,angle=0,slash=false,stable=false,arrival=false){
  if(this.pulses.length>=EFFECT_LIMITS.pulses){
   const friendly=this.pulses.findIndex(item=>!item.stable);
   if(friendly>=0)this.pulses.splice(friendly,1);
   else if(stable)this.pulses.shift();else return;
  }
  this.pulses.push({p:p.clone(),color:new T.Color(color),radius,life,age:0,angle,slash,stable,arrival});
 }
 shot(p:T.Vector3,angle:number,id:WeaponId){
  if(this.disposed)return;
  const cfg=WEAPON_APPEARANCE[id],forward=new T.Vector3(Math.cos(angle),0,Math.sin(angle)),right=new T.Vector3(-forward.z,0,forward.x);
  this.flash(p,cfg.color,id==='rocket'?4:id==='shotgun'?3:1.6,id==='rocket'?5:3,.065,2);
  const count=id==='shotgun'?3:id==='plasma'?3:id==='rocket'?4:id==='rifle'?3:2;
  // Short aim-aligned needles, a broad shotgun fan, and a compact energy pulse.
  // These are shapes in the existing batch, never another material/program.
  for(let i=0;i<count;i++){
   const fan=id==='shotgun'?(i-(count-1)/2)*.055:0;
   const pos=p.clone().addScaledVector(forward,.07+i*(id==='rifle'?.08:.055)).addScaledVector(right,fan);
   this.particle(this.glow,EFFECT_LIMITS.glow,pos,cfg.color,id==='shotgun'?.42:id==='rocket'?.34:id==='plasma'?.22:.24,id==='plasma'?.075:id==='shotgun'?.055:.038,forward.clone().multiplyScalar(1.1));
   const lobe=this.glow[this.glow.length-1];lobe.direction=angle+fan;lobe.aspect=id==='rifle'?.22:id==='plasma'?.6:id==='shotgun'?.65:.38;lobe.spin=0;
  }
  this.particle(this.glow,EFFECT_LIMITS.glow,p,id==='plasma'?0xc8fbff:0xfff4df,id==='shotgun'?.23:.15,.035);
  for(let i=0;i<(id==='shotgun'?5:id==='rocket'?4:2);i++){
   const v=forward.clone().multiplyScalar(2+Math.random()*5).addScaledVector(right,(Math.random()-.5)*2);v.y=Math.random()*1.4;
   this.particle(this.glow,EFFECT_LIMITS.glow,p,cfg.color,.05,.09+Math.random()*.08,v,2);
  }
  if(id==='plasma'){
   // Cool gas leaves the receiver instead of another bright airborne ring.
   for(const side of [-1,1]){
    const vent=p.clone().addScaledVector(forward,-.38).addScaledVector(right,side*.09);
    this.particle(this.smoke,EFFECT_LIMITS.smoke,vent,0x65b3bd,.13,.22,right.clone().multiplyScalar(side*.4).add(new T.Vector3(0,.15,0)));
   }
  }
  else{
   const exhaust=id==='rocket'?p.clone().addScaledVector(forward,-.9):p;
   this.particle(this.smoke,EFFECT_LIMITS.smoke,exhaust,0x82938d,id==='rocket'?.32:.21,id==='rocket'?.30:.22,forward.clone().multiplyScalar(id==='rocket'?-.8:.3).add(new T.Vector3(0,.3,0)));
   if(id!=='rocket'){
    const casing=p.clone().addScaledVector(forward,-.65).addScaledVector(right,.09);
    const v=right.multiplyScalar(id==='rifle'?2.5:id==='shotgun'?.82:1.6+Math.random()).addScaledVector(forward,-.42);v.y=id==='shotgun'?.84:1.7;
    this.particle(this.debris,EFFECT_LIMITS.debris,casing,id==='shotgun'?0x994b31:0xe9b450,id==='shotgun'?.065:id==='rifle'?.061:.038,id==='rifle'?.58:id==='shotgun'?.47:2.8,v,9.8,id==='rifle'?1.95:2.5);
   }
  }
 }
 event(e:GameEffect,deathCue:DeathCue='none',targetFamily?:string, frozenBody?:T.Vector3){
  if(this.disposed)return;
  const p=new T.Vector3(e.x/32,(e.type==='explosion'||e.radius!==undefined)? .10:.8,e.y/32);
  if(e.planReaction){
   const start=new T.Vector3(e.x/32,.55,e.y/32);
   const end=new T.Vector3((e.targetX??e.x)/32,.55,(e.targetY??e.y)/32);
   for(let i=0;i<=7;i++){
    const point=start.clone().lerp(end,i/7);
    this.particle(this.glow,EFFECT_LIMITS.glow,point,0x8df9db,.13,.28+i*.035);
   }
  }
  if(e.selfBlast&&e.sourceX!==undefined&&e.sourceY!==undefined){
   const out=new T.Vector3(e.x-e.sourceX,0,e.y-e.sourceY);
   if(out.lengthSq()<.001)out.set(1,0,0);
   out.normalize();
   const from=new T.Vector3(e.x/32,.06,e.y/32);
   const length=(e.selfBlast.radius-e.selfBlast.distance+12)/32;
   for(let i=1;i<=5;i++)this.pulse(from.clone().addScaledVector(out,length*i/5),0xffbd68,i===5?.34:.09,1);
  }

  if(e.type==='wall-slam'&&e.wall){p.y=.8;this.wallSlam(e,p);return;}
  if(e.type==='corpse'){this.death(e,p,deathCue,frozenBody);return;}
  const angle=e.angle??0,forward=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
  if(e.contact){
   const blocked=e.contact!=='damage',heavy=e.weapon==='shotgun'||e.weapon==='rocket'||!!e.lethal;
   const color=e.weapon==='plasma'?0x82f4ff:blocked?0x90baca:e.weapon==='pistol'?0xfff1cb:0xffe6b7;
   if(e.weapon==='plasma'&&e.contact==='armor'){
    this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.33,.23);
   }
   this.flash(p,color,heavy?1.1:.65,heavy?2.1:1.7,.07,1);
   // A compact point spark and three short backward splinters locate the
   // accepted impact; the separate liquid follows the shot through the body.
   this.particle(this.glow,EFFECT_LIMITS.glow,p,color,blocked?.16:heavy?.30:.22,.065);
   for(let i=0;i<3;i++){
    const a=angle+Math.PI+(i-1)*.8;
    this.forward.set(Math.cos(a)*2,.5+i*.3,Math.sin(a)*2);
    this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.045,.12+i*.025,this.forward,4);
   }
   const ichor=targetFamily?FAMILY_IDENTITY[targetFamily as keyof typeof FAMILY_IDENTITY]:undefined;
   if(!blocked&&ichor!==undefined){
    const reduced=this.options.reducedMotion?.4:1,rifle=e.weapon==='rifle',count=rifle?2:heavy?5:3;
    for(let i=0;i<count;i++){
     const a=angle+(i-(count-1)*.5)*.30,speed=(rifle?3.3+i*.7:heavy?2.5:1.4)*reduced;
     this.forward.set(Math.cos(a)*speed,(.55+(i%2)*.35)*reduced,Math.sin(a)*speed);
     this.particle(this.smoke,EFFECT_LIMITS.smoke,p,ichor,rifle?.09:heavy?.075:.06,rifle?.14:.20+i*.025,this.forward,6,1.8);
     const drop=this.smoke[this.smoke.length-1];drop.liquid=true;drop.spin=0;if(rifle)drop.aspect=3.5;
    }
   }
   return;
  }
  // Successful bullet damage also uses "acid"; only untargeted hazards spray liquid.
  if(e.type==='acid'&&e.targetId===undefined){this.acidSplash(e,p);return;}
  if(e.type==='enemy-warning'){
   if(e.id!==undefined&&e.family){
    let warning=this.nativeWarnings.find(w=>w.active&&w.id===e.id);
    warning??=this.nativeWarnings.find(w=>!w.active);
    if(warning){warning.active=true;warning.id=e.id;warning.melee=!!e.meleeShape;warning.weight=e.meleeShape?meleeWarningWeight(e.family??'crawler',e.elite):e.dangerWeight==='low'?.27:1;warning.durationMs=e.durationMs??650;warning.remainingMs=warning.durationMs;warning.shape.length=-1;}
    return;
   }
   p.y=.035;const life=(e.durationMs??650)/1000;
   // A warning always shows its complete hit radius, never an expanding approximation.
   this.pulse(p,0xff2340,(e.radius??38)/32,life,0,false,true,true);
   if(e.targetX!==undefined&&e.targetY!==undefined){const target=new T.Vector3(e.targetX/32,.04,e.targetY/32);this.pulse(target,0xff2340,.8,life,0,false,true);const direction=target.clone().sub(p);for(let i=0;i<12;i++)this.particle(this.glow,EFFECT_LIMITS.glow,p.clone().addScaledVector(direction,i/12),0xff2340,.07,life);}
   return;
  }
  if(e.type==='boon'){
   if(this.boonBursts++>=8)return;
   const colors={frost:0x8cdeed,arc:0xb3bbff,burn:0xf89847,impact:0xf5dab0,leech:0xbb7385,shield:0x86c9ce,overload:0xf4b96b,poison:0x5dd8b6,charge:0xd6b9f3,blast:0xcbd8dc,combustion:0xffba71,shatter:0xa3eaf3,field:0x75bdcf},color=colors[e.boon??'impact'];
   if(e.boon==='arc'||e.boon==='burn'||e.boon==='frost'||e.boon==='shatter')this.flash(p,color,e.boon==='arc'?2.5:1.6,3,.16,2);
   if(e.targetX!==undefined&&e.targetY!==undefined){
    if(e.boon==='impact'||e.boon==='frost'){
     const end=new T.Vector3(e.targetX/32,.8,e.targetY/32),frost=e.boon==='frost';
     if(this.links.length>=12)this.links.shift();this.links.push({start:p.clone(),end,age:0,frost});
     this.particle(this.glow,EFFECT_LIMITS.glow,end,color,frost?.28:.18,.09);
     for(let i=0;i<(frost?7:4);i++){const a=i*2.399,v=new T.Vector3(Math.cos(a)*1.5,.5+Math.random(),Math.sin(a)*1.5);
      this.particle(frost?this.debris:this.glow,frost?EFFECT_LIMITS.debris:EFFECT_LIMITS.glow,end,color,frost?.075:.04,frost?.35:.16,v,5,frost?3:1);
     }return;
    }
    if(this.arcBursts++>=2)return;const end=new T.Vector3(e.targetX/32,.8,e.targetY/32);
    if(this.arcs.length>=6)this.arcs.shift();this.arcs.push({start:p.clone(),end,age:0,seed:Math.floor(Math.random()*65536)});
    this.particle(this.glow,EFFECT_LIMITS.glow,end,0xddeaff,.48,.10);
    for(let i=0;i<9;i++){const a=i*2.399;this.particle(this.glow,EFFECT_LIMITS.glow,end,i%2?0x8d9bff:0xcbefff,.065,.18+Math.random()*.16,new T.Vector3(Math.cos(a)*2,.4+Math.random()*2,Math.sin(a)*2),4);}
    return;
   }
   // Toxic Bloom is immediate spread on poisoned death, never a lingering hazard.
   // Separated normal-blended atlas wisps share the existing bounded smoke draw.
   if(e.boon==='poison'&&e.radius!==undefined){
    p.y=.55;const reach=Math.min(3,e.radius/32);
    for(let i=0;i<8;i++){
     const a=i*2.399+(Math.random()-.5)*.55,r=reach*(.12+Math.random()*.22);
     const pos=p.clone().add(new T.Vector3(Math.cos(a)*r,.08+i*.045,Math.sin(a)*r));
     const speed=reach*(.55+Math.random()*.5);
     this.particle(this.smoke,EFFECT_LIMITS.smoke,pos,i%3?0x639b40:0x8caa56,.65+Math.random()*.35,.48+Math.random()*.22,new T.Vector3(Math.cos(a)*speed,.25+Math.random()*.35,Math.sin(a)*speed));
     const wisp=this.smoke[this.smoke.length-1];wisp.growth=.65;wisp.aspect=.65+Math.random()*.3;
    }return;
   }
   // Untargeted radial arc is Ball Lightning's discharge, not a blast ring.
   if(e.boon==='arc'&&e.radius!==undefined){
    p.y=.65;const radius=Math.min(4,e.radius/32);
    this.particle(this.glow,EFFECT_LIMITS.glow,p,0xc4eaff,.5,.12);
    for(let i=0;i<6;i++){
     const angle=i*Math.PI/3+(Math.random()-.5)*.85,reach=radius*(.65+Math.random()*.35),end=p.clone().add(new T.Vector3(Math.cos(angle)*reach,Math.random()*.6,Math.sin(angle)*reach));
     if(this.arcs.length>=6)this.arcs.shift();this.arcs.push({start:p.clone(),end,age:0,seed:Math.floor(Math.random()*65536),ball:true});
     this.particle(this.glow,EFFECT_LIMITS.glow,end,0x8d9bff,.12,.18);
    }return;
   }
   // Radial impact is Fragmentation. Keep ordinary point impacts and links separate.
   if(e.boon==='impact'&&e.radius!==undefined){
    p.y=.65;const speed=Math.min(7,e.radius/32*1.7);
    this.particle(this.glow,EFFECT_LIMITS.glow,p,0xf5dab0,.28,.07);
    for(let i=0;i<12;i++){
     const angle=i*Math.PI/6,s=speed*(.65+Math.random()*.35),v=new T.Vector3(Math.cos(angle)*s,.8+Math.random()*1.5,Math.sin(angle)*s);
     this.particle(this.debris,EFFECT_LIMITS.debris,p,i%3?0x9d9c8d:0xf5dab0,.085+Math.random()*.045,.65+Math.random()*.2,v,9.8,2.8);
    }return;
   }
   if(e.boon==='field'){if(this.fields.length>=4)this.fields.shift();this.fields.push({p:new T.Vector3(p.x,.026,p.z),color:new T.Color(color),radius:(e.radius??75)/32,life:(e.durationMs??2000)/1000,age:0,angle:0,slash:false,stable:true});return;}
   if(e.boon==='charge'){this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.25,(e.durationMs??450)/1000);return;}
   if(e.boon==='shatter'){
    // Fracture, not combustion: blue-white flash, radial crystals and fleeting vapor.
    p.y=.65;const r=Math.min(3,(e.radius??60)/32);
    this.particle(this.glow,EFFECT_LIMITS.glow,p,0xdaf7ff,r*.65,.09);
    for(let i=0;i<18;i++){const a=i*Math.PI*2/18,s=2+Math.random()*r*2,v=new T.Vector3(Math.cos(a)*s,1+Math.random()*2,Math.sin(a)*s);
     this.particle(this.debris,EFFECT_LIMITS.debris,p,i%3?0x64b7d5:0xb9efff,.10+Math.random()*.08,.45+Math.random()*.25,v,8,3.5);
     if(i%2===0)this.particle(this.glow,EFFECT_LIMITS.glow,p,0xb9efff,.07,.16,v.clone().multiplyScalar(1.4));
    }
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0xa9ddec,.5,.3,new T.Vector3(Math.cos(a)*1.2,.3,Math.sin(a)*1.2));}return;
   }
   // Radius-free overload is non-damaging Hot Reload readiness, not Cascade.
   if(e.boon==='overload'&&e.radius===undefined){
    p.y=.85;
    for(let i=0;i<6;i++){
     const a=i*Math.PI/3,pos=p.clone().add(new T.Vector3(Math.cos(a)*.44,(i%2)*.12,Math.sin(a)*.44));
     this.particle(this.glow,EFFECT_LIMITS.glow,pos,color,.32,.65,new T.Vector3(0,.65,0));
    }return;
   }
   if(e.boon==='blast'||e.boon==='overload'||e.boon==='combustion'){this.event({type:'explosion',x:e.x,y:e.y,radius:e.radius??48,elements:e.boon==='combustion'?['fire']:[]});return;}
   const frost=e.boon==='frost',shield=e.boon==='shield'||e.boon==='leech';
   this.pulse(new T.Vector3(p.x,.05,p.z),color,e.radius?e.radius/32:frost?1.3:shield?.65:.8,frost?.45:.3);
   for(let i=0;i<(frost?7:5);i++){const a=i*6.28/7,v=new T.Vector3(Math.cos(a)*.8,shield?1.4:.5,Math.sin(a)*.8);this.particle(this.glow,EFFECT_LIMITS.glow,p,color,frost?.12:.10,.35,v,0);}
   return;
  }
  if(e.type==='enemy-attack'){
   const shooter=e.id===undefined?undefined:this.shooters.get(e.id);
   if(shooter && e.family==='spitter' && !e.meleeShape){shooter.fade=.15;shooter.progress=1;}
   for(const warning of this.nativeWarnings)if(warning.active&&warning.id===e.id&&!warning.melee)warning.active=false;
   // Native melee impact flashes the exact retained footprint, not a generic slash.
   if(e.meleeShape)return;
   if(e.id===-1)return;
   if(e.family==='spitter'){
    p.y=.8;for(let i=0;i<7;i++)this.particle(this.glow,EFFECT_LIMITS.glow,p,0x9bd25e,.1,.3,forward.clone().multiplyScalar(1+Math.random()*2).add(new T.Vector3(0,Math.random(),0)),2);
   }else{p.y=.38;this.pulse(p,0xc8c6a3,1.1,.16,angle,true);}return;
  }
  if(e.type==='pickup'){this.particle(this.glow,EFFECT_LIMITS.glow,p,0x87f3d1,.45,.22,new T.Vector3(0,1,0));return;}
  if(e.type==='hurt'||e.type==='shot'||e.type==='sync-corpse')return;
  const explosion=e.type==='explosion',acid=e.type==='acid';
  const impactColor=acid?0x9ebc5e:e.weapon==='plasma'?0x69ddff:0xffc68b;
  if(explosion||(acid&&e.radius)){
   const r=(e.radius??100)/32,fiery=e.elements?.includes('fire')??false,icy=e.elements?.includes('ice')??false,toxic=e.elements?.includes('poison')??false,color=acid||toxic?0x8dd45a:fiery||e.weapon==='rocket'?0xffb64e:icy?0xb9efff:0xcbd8dc;
   const warningOverlap=e.weapon==='rocket'&&this.warningNear(p.x,p.z,r);
   this.flash(p,color,warningOverlap?1.5:acid?2:8,Math.min(warningOverlap?3:12,r*3),warningOverlap?.10:.38,4);
   if(!acid&&!warningOverlap&&this.options.distortion!==false&&!this.options.reducedMotion)this.feedback.shockwave?.({position:p,radius:r,strength:.6*(this.options.flashIntensity??1),duration:.42});
   // Mixed statuses compose local cues; no global-build tint or hidden priority.
   if(icy)this.event({type:'boon',boon:'shatter',x:e.x,y:e.y,radius:e.radius});
   if(toxic)for(let i=0;i<8;i++){const a=i*Math.PI/4;this.particle(this.debris,EFFECT_LIMITS.debris,p,0x76d958,.08,.55,new T.Vector3(Math.cos(a)*2,1.5,Math.sin(a)*2),6,0);}
   if(toxic)for(let i=0;i<4;i++){const a=i*Math.PI/2;this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x76c999,.55,.45,new T.Vector3(Math.cos(a)*1.5,.5,Math.sin(a)*1.5));}
   this.pulse(p,color,r,.24);this.particle(this.glow,EFFECT_LIMITS.glow,p,acid||!fiery?color:0xffedbc,r*.65,.065);
   if(!acid&&fiery){const center=p.clone(),size=Math.min(5,r*1.5);center.y=size*.38;this.particle(this.fire,EFFECT_LIMITS.fire,center,0xffffff,size,.62,new T.Vector3(0,.65,0));this.fire[this.fire.length-1].spin=0;this.fire[this.fire.length-1].rotation=0;
    for(let i=0;i<9;i++){const a=i*2.399,s=1.5+Math.random()*r;this.particle(this.debris,EFFECT_LIMITS.debris,p,i%2?0x746c59:0x343a38,.055+Math.random()*.07,3.5,new T.Vector3(Math.cos(a)*s,2+Math.random()*3,Math.sin(a)*s),9.8,1.8);}}
   for(let i=0;i<16;i++){const a=Math.random()*6.28,s=1+Math.random()*r*2,v=new T.Vector3(Math.cos(a)*s,Math.random()*4+.5,Math.sin(a)*s);this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.10+Math.random()*.08,.25+Math.random()*.4,v,6);}
   if(!acid&&!fiery&&!icy)for(let i=0;i<7;i++){const a=i*2.399;this.particle(this.debris,EFFECT_LIMITS.debris,p,0x9aabad,.06,1.2,new T.Vector3(Math.cos(a)*2,2,Math.sin(a)*2),9.8,1.8);}
   if(!icy)for(let i=0;i<5;i++){this.particle(this.smoke,EFFECT_LIMITS.smoke,p,acid?0x758b50:0x667174,.65+Math.random()*.5,acid||fiery?.85+Math.random()*.4:.4+Math.random()*.15,new T.Vector3((Math.random()-.5)*r,1+Math.random(),(Math.random()-.5)*r));if(fiery)this.smoke[this.smoke.length-1].age=-.09;}
   if(acid||fiery||icy){this.particle(this.decals,EFFECT_LIMITS.decals,new T.Vector3(p.x,.008,p.z),acid?0x283f20:icy?0x72a3ae:0x111719,r*1.4,14);this.decals[this.decals.length-1].variant=acid?2:icy?3:1;}
  }else{
   if(!acid){
    this.flash(p,impactColor,.7,1.8,.08,1);
    if(e.targetId===undefined){
     const surface=this.world&&wallSurface(this.world,p,forward.clone().negate(),.3);
     this.particle(this.decals,EFFECT_LIMITS.decals,surface?.supported?surface.point:new T.Vector3(p.x,.012,p.z),0x1a2224,e.weapon==='plasma'?.34:.2,18);
     const mark=this.decals[this.decals.length-1];mark.variant=e.weapon==='plasma'?1:0;mark.ground=true;mark.spin=0;if(surface?.supported)mark.wall=surface.normal;
    }
   }
   if(!acid)for(let i=0;i<(e.targetId!==undefined?4:3);i++){const a=angle+Math.PI+(Math.random()-.5)*1.1,s=1+Math.random()*2,target=e.targetId!==undefined;this.particle(this.debris,EFFECT_LIMITS.debris,p,0x898477,target?.022+Math.random()*.012:.045,target?.35+Math.random()*.3:3.5,new T.Vector3(Math.cos(a)*s,1+Math.random()*1.5,Math.sin(a)*s),9.8,1.8);}
   for(let i=0;i<(acid?7:9);i++){
    const a=acid?Math.random()*6.28:angle+Math.PI+(Math.random()-.5)*1.3,s=.8+Math.random()*3,v=new T.Vector3(Math.cos(a)*s,Math.random()*2.8,Math.sin(a)*s).addScaledVector(forward,acid?1.5:-1.5);
    this.particle(this.glow,EFFECT_LIMITS.glow,p,impactColor,acid?.095:.065,.15+Math.random()*.24,v,7);
   }
   this.particle(this.glow,EFFECT_LIMITS.glow,p,impactColor,acid?.3:.4,.075);
   if(!acid)this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x8b9185,.35,.45,new T.Vector3(0,.3,0));
   if(acid){
    this.particle(this.decals,EFFECT_LIMITS.decals,new T.Vector3(p.x,.009,p.z),0x263524,.5,16);
    this.decals[this.decals.length-1].variant=2;
    const target=e.targetId!==undefined;
    for(let i=0;i<(target?4:2);i++)this.particle(this.debris,EFFECT_LIMITS.debris,p,i%2?0x4c5541:0x9a9872,target?.025+Math.random()*.025:.075+Math.random()*.08,target?.35+Math.random()*.3:6,new T.Vector3((Math.random()-.5)*3,1+Math.random()*3,(Math.random()-.5)*3),9.8,1.7);
   }
  }
 }
 /** Family-sized fragments follow the killing impulse, leaving the body readable. */
 private death(e:GameEffect,p:T.Vector3,cue:DeathCue,frozenBody?:T.Vector3){
  if(cue==='none')cue=e.elements?.includes('ice')?'frost':e.elements?.includes('fire')?'burn':e.elements?.includes('poison')?'acid':'none';
  const large=e.family==='brute'||e.family==='carrier';
  const baseCount=e.family===undefined||large?10:e.family==='spitter'?7:5;
  const dx=(e.vx??0)/32,dz=(e.vy??0)/32,speed=Math.hypot(dx,dz);
  // Native rocket-strength killing momentum gets three longer trailing pieces.
  // This is an impulse variant, not a claim about unreported health overshoot.
  const highImpulse=speed>=24,count=baseCount+(highImpulse?3:0);
  const momentum=Math.min(2.1,speed*.08),direction=Math.atan2(dz,dx);
  const color=cue==='frost'?0xa3eaf3:cue==='burn'?0xd98643:cue==='arc'?0xc6baff:cue==='acid'?0x79aa58:FAMILY_IDENTITY[e.family as keyof typeof FAMILY_IDENTITY]??0x7d8868;
  const reduced=this.options.reducedMotion?.45:1;
  p.y=e.family==='brute'?.55:e.family==='spitter'?.8:.4;
  if(cue==='frost' && frozenBody)p.copy(frozenBody);
  for(let i=0;i<count;i++){
   const trailing=highImpulse&&i>=baseCount;
   const angle=trailing?direction+(i-baseCount-1)*.16:speed>.001?direction+(i-(baseCount-1)/2)*.37:i*Math.PI*2/baseCount;
   const v=new T.Vector3((Math.cos(angle)*.7+Math.cos(direction)*momentum)*reduced,(trailing?.35:cue==='frost'?.8:cue==='burn'?.35:1.1)*reduced, (Math.sin(angle)*.7+Math.sin(direction)*momentum)*reduced);
   if(cue==='frost'){
    const a=i*2.39996;
    v.set(Math.cos(a)*2.7,.65+i%3*.45,Math.sin(a)*2.7).multiplyScalar(reduced);
   }
   this.particle(this.debris,EFFECT_LIMITS.debris,p,color,cue==='frost'?.065:.025+(i%3)*.008,(cue==='frost'?.55:cue==='burn'?.35:.48)+(trailing?.12:0),v,9.8,cue==='frost'?2.6:1.7);
  }
  if(cue==='burn'){
   for(let i=0;i<3;i++)this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x48504a,.25,.45,new T.Vector3((i-1)*.15,.25+i*.08,0));
   for(let i=0;i<4;i++)this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.035,.16+i*.035,new T.Vector3((i-1.5)*.15,.6,0));
  }else if(cue==='arc'){
   for(let i=0;i<4;i++){
    const a=i*Math.PI/2;this.particle(this.glow,EFFECT_LIMITS.glow,p,color,.12,.055+i*.012,new T.Vector3(Math.cos(a)*.8,.2,Math.sin(a)*.8));
    const spark=this.glow[this.glow.length-1];spark.direction=a;spark.aspect=.2;spark.spin=0;
   }
  }else if(cue==='frost'){
   this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x8aa6ad,.22,.24,new T.Vector3(0,.12,0));
   for(let i=0;i<3;i++){
    this.particle(this.glow,EFFECT_LIMITS.glow,p,0xa3eaf3,.16,.09,new T.Vector3(Math.cos(i*2.1)*.6,.2,Math.sin(i*2.1)*.6));
    const glint=this.glow[this.glow.length-1];glint.direction=i*2.1;glint.aspect=.18;glint.spin=0;
   }
  }
  const mark=new T.Vector3(p.x,.009,p.z);
  this.particle(this.decals,EFFECT_LIMITS.decals,mark,cue==='frost'?0x5d8290:cue==='burn'?0x18201e:0x263524,large?.65:.42,10);
  this.decals[this.decals.length-1].variant=cue==='frost'?3:cue==='burn'?1:4;
 }
 private acidSplash(e:GameEffect,p:T.Vector3){
  const area=e.radius!==undefined,r=area?Math.min(3,Math.max(.5,(e.radius??32)/32)):1,count=area?18:10;
  // Normal-blended procedural drops share the smoke budget, never spark beams.
  for(let i=0;i<count;i++){
   const a=i*Math.PI*2/count+(Math.random()-.5)*.25,s=(.8+Math.random()*1.4)*r;
   const v=new T.Vector3(Math.cos(a)*s,1.6+Math.random()*1.6,Math.sin(a)*s);
   if(!area){v.x+=Math.cos(e.angle??0)*.8;v.z+=Math.sin(e.angle??0)*.8;}
   this.particle(this.smoke,EFFECT_LIMITS.smoke,p,i%3?0x689d35:0x96bb4f,.12+Math.random()*.12,.8+Math.random()*.3,v,9.8);
   const drop=this.smoke[this.smoke.length-1];drop.liquid=true;drop.spin=0;
  }
 }
 /** Body-sized contact fan. No explosion atlas, ground ring or radial particle burst. */
 private wallSlam(e:GameEffect,p:T.Vector3){
  let n=new T.Vector3(e.wall!.x,0,e.wall!.y).normalize();
  const surface=this.world&&wallSurface(this.world,p,n,.35);
  if(surface){p.copy(surface.point);n=surface.normal;}
  p.addScaledVector(n,.025);
  const tangent=new T.Vector3(-n.z,0,n.x);
  // A compact flash behind the body, with a few sheared metal glints.
  this.particle(this.glow,EFFECT_LIMITS.glow,p,0xe8ece7,.7,.075);
  for(let i=0;i<6;i++){
   const v=n.clone().multiplyScalar(1.2+Math.random()).addScaledVector(tangent,(Math.random()-.5)*5);v.y=.4+Math.random()*2;
   this.particle(this.glow,EFFECT_LIMITS.glow,p,0xdac8a6,.055,.12+Math.random()*.09,v,5);
  }
  for(let i=0;i<26;i++){
   const pos=p.clone().addScaledVector(tangent,(Math.random()-.5)*.8);pos.y+=(Math.random()-.5)*.35;
   const v=n.clone().multiplyScalar(.8+Math.random()*1.8).addScaledVector(tangent,(Math.random()-.5)*6);v.y=.7+Math.random()*2.6;
   this.particle(this.debris,EFFECT_LIMITS.debris,pos,i%3===0?0xc4cbc7:i%3===1?0x8f9b9e:0x667074,.07+Math.random()*.09,.65+Math.random()*.4,v,8,1.6+Math.random());
  }
  if(surface?.supported){
   this.particle(this.decals,EFFECT_LIMITS.decals,p,0x121b1e,.48,1.15);
   const mark=this.decals[this.decals.length-1];mark.wall=n;mark.spin=0;mark.ground=true;
  }
  // Textured lobes spread along the wall, not out into a spherical blast cloud.
  for(let i=0;i<7;i++){
   const side=(i-3)/3,pos=p.clone().addScaledVector(tangent,side*.65).addScaledVector(n,.08);pos.y+=(i%3-1)*.15;
   const v=tangent.clone().multiplyScalar(side*.65).addScaledVector(n,.25+Math.random()*.15);v.y=.14+Math.random()*.15;
   this.particle(this.smoke,EFFECT_LIMITS.smoke,pos,i%3===0?0xc4cbc7:i%3===1?0xa3afaf:0x849094,.7+Math.random()*.2,.45+Math.random()*.25,v);
   const dust=this.smoke[this.smoke.length-1];dust.wall=n;dust.growth=.45;dust.aspect=.72;dust.spin=0;
  }
 }
 private drawParticles(list:Particle[],mesh:T.InstancedMesh,dt:number,camera:T.Camera,mode:'glow'|'smoke'|'debris'|'decal'|'fire'){
  const alpha=mesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute;let index=0;
  for(const s of list){
   s.age+=dt;if(s.age>=s.life||s.age<0)continue;const t=s.age/s.life;
   if(!s.ground){s.v.y-=s.gravity*dt;s.p.addScaledVector(s.v,dt);s.rotation+=s.spin*dt;if(mode==='debris'&&s.p.y<.035){s.p.y=.035;s.v.y=Math.abs(s.v.y)*.23;s.v.x*=.65;s.v.z*=.65;s.spin*=.55;if(s.v.y<.35&&Math.hypot(s.v.x,s.v.z)<.3){s.ground=true;s.v.set(0,0,0);s.spin=0;}}}
   if(s.liquid&&s.p.y<=.012){s.p.y=.012;s.ground=true;s.v.set(0,0,0);}
   const priority=this.warningNear(s.p.x,s.p.z,.25)?.24:1;
   this.dummy.position.copy(s.p);this.dummy.quaternion.copy(camera.quaternion);
   if(s.liquid){
    if(s.ground)this.dummy.rotation.set(-Math.PI/2,0,s.rotation);
    else{this.forward.copy(s.v).applyQuaternion(this.dummy.quaternion.invert());this.dummy.quaternion.copy(camera.quaternion);this.dummy.rotateZ(Math.atan2(this.forward.y,this.forward.x)-Math.PI/2);}
    const size=s.size*(s.ground?1.8:1);this.dummy.scale.set(size,size*(s.ground?.8:s.aspect??1.6),1);this.dummy.updateMatrix();
    mesh.setMatrixAt(index,this.dummy.matrix);mesh.setColorAt(index,s.color);(mesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).setX(index,-1);alpha.setX(index,priority*.9*Math.min(1,(1-t)*4));index++;continue;
   }
   if(mode==='decal'||mode==='smoke'&&s.wall){if(s.wall){this.dummy.quaternion.setFromUnitVectors(this.axis,s.wall);this.dummy.rotateZ(s.rotation);}else this.dummy.rotation.set(-Math.PI/2,0,s.rotation);}
   else if(mode==='debris')this.dummy.rotation.set(s.rotation,s.rotation*.7,s.rotation*.4);
   else if(s.direction!==undefined){
    this.forward.set(Math.cos(s.direction),0,Math.sin(s.direction)).applyQuaternion(this.dummy.quaternion.invert());
    this.dummy.quaternion.copy(camera.quaternion);this.dummy.rotateZ(Math.atan2(this.forward.y,this.forward.x));
   }else this.dummy.rotateZ(s.rotation);
   const size=s.size*(mode==='smoke'?1+t*(s.growth??2.5):mode==='glow'?1-t*.4:mode==='fire'?1+t*.25:1);
   (mesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).setX(index,mode==='decal'?(s.variant??1):Math.min(mode==='fire'?24:63,Math.floor(t*(mode==='fire'?25:64))));
   this.dummy.scale.set(size,mode==='debris'?size*.5:size*(s.aspect??1),size*s.stretch);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);mesh.setColorAt(index,s.color);alpha.setX(index,priority*(mode==='decal'?.75*(1-t*t):mode==='debris'?Math.min(1,(1-t)*4):mode==='fire'?Math.min(1,(1-t)*4):(1-t)*(mode==='smoke'?Math.min(1,t*10):1)));index++;
  }
  let write=0;const free=this.particleFree.get(list)!;
  for(let i=0;i<list.length;i++){const item=list[i];if(item.age>=item.life)free.push(item);else list[write++]=item;}list.length=write;
  this.finish(mesh,index);
 }
 private finish(mesh:T.InstancedMesh,count:number){mesh.count=count;(mesh.geometry.getAttribute('effectShape') as T.InstancedBufferAttribute).needsUpdate=true;(mesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).needsUpdate=true;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;(mesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).needsUpdate=true;}
 private arcBeam(start:T.Vector3,end:T.Vector3,width:number,color:number,alpha:number,index:number){
  this.forward.subVectors(end,start);const length=this.forward.length();if(length<.001)return index;
  this.dummy.position.copy(start).add(end).multiplyScalar(.5);this.dummy.quaternion.setFromUnitVectors(UP,this.forward.multiplyScalar(1/length));this.dummy.scale.set(width,length,width);this.dummy.updateMatrix();
  this.beamMesh.setMatrixAt(index,this.dummy.matrix);this.beamMesh.setColorAt(index,this.beamColor.setHex(color).multiplyScalar(width<.05?3:1.4));(this.beamMesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).setX(index,alpha);return index+1;
 }
 // A deck skip marks a segment that has already passed beside a visible
 // hostile. It never predicts whether the projectile will hit a later target.
 private readonly skippedRifles: (Bullet | undefined)[] = new Array(24);
 private skipCursor = 0;
 private deckSkip(b:Bullet,from:T.Vector3,to:T.Vector3,targets:readonly EnemySnapshot[]) {
  const dx=to.x-from.x,dz=to.z-from.z,length2=dx*dx+dz*dz;
  if(length2<.0001 || this.skippedRifles.includes(b))return;
  for(const target of targets){
   if(target.health<=0)continue;
   const x=target.x/32-from.x,z=target.y/32-from.z;
   const t=(x*dx+z*dz)/length2;
   if(t<=0 || t>1)continue;
   const gap=Math.hypot(x-t*dx,z-t*dz)-target.radius/32;
   if(gap<.13 || gap>.80)continue;
   this.skippedRifles[this.skipCursor]=b;
   this.skipCursor=(this.skipCursor+1)%this.skippedRifles.length;
   this.bulletSkipPoint.set(from.x+t*dx,.045,from.z+t*dz);
   this.forward.set(dx,.12,dz).normalize().multiplyScalar(1.8);
   this.particle(this.debris,EFFECT_LIMITS.debris,this.bulletSkipPoint,0xc5c0a9,.097,.22,this.forward,7,2.4);
   this.forward.multiplyScalar(.55);
   this.forward.y=.58;
   this.particle(this.debris,EFFECT_LIMITS.debris,this.bulletSkipPoint,0x999584,.066,.14,this.forward,8,1.8);
   return;
  }
 }
 private readonly bulletSkipPoint=new T.Vector3();
 update(dt:number,camera:T.Camera,bullets:readonly Bullet[],marineX=Infinity,marineZ=Infinity,marineRadius=0,targets?:readonly EnemySnapshot[]){
  if(dt<=0||this.disposed)return;
  this.boonBursts=this.arcBursts=0;this.trailClock+=dt;const trail=this.trailClock>.04;if(trail)this.trailClock=0;
  let beam=0,hostile=0;const beamLimit=this.options.tier==='low'?120:EFFECT_LIMITS.beams,alpha=this.beamMesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute;
  for(const b of bullets){
   if(b.kind==='player'&&(2-b.life)*b.request.speed<(b.visualMuzzle?.distance??0))continue;
   const id=b.request.weaponId,grenade=b.kind==='grenade',hazard=b.kind==='hazard';
   const p=this.bulletPosition.set(b.x/32,grenade?1+Math.sin((1-b.life/1.1)*Math.PI)*1.4:b.visualMuzzle?.y??.99,b.y/32);
   if(hazard&&hostile<318){
    // One normal-blended batch contains a broad dark silhouette, saturated ring
    // and dark core. A second instance is its floor contact/shadow dot.
    this.dummy.position.copy(p);this.dummy.quaternion.copy(camera.quaternion);this.dummy.scale.set(.18,.18,.18);this.dummy.updateMatrix();this.hostileMesh.setMatrixAt(hostile,this.dummy.matrix);this.hostileMesh.setColorAt(hostile,WHITE);(this.hostileMesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).setX(hostile,0);(this.hostileMesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).setX(hostile++,1);
    this.dummy.position.set(p.x,.035,p.z);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.set(.16,.16,.16);this.dummy.updateMatrix();this.hostileMesh.setMatrixAt(hostile,this.dummy.matrix);this.hostileMesh.setColorAt(hostile,WHITE);(this.hostileMesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).setX(hostile,-1);(this.hostileMesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).setX(hostile++,1);
   }
   let old=this.previous.get(b);
   if(!old){old=this.bulletPrevious;if(b.visualMuzzle)old.set(b.visualMuzzle.x,b.visualMuzzle.y,b.visualMuzzle.z);else old.copy(p).addScaledVector(this.forward.set(Math.cos(b.request.angle),0,Math.sin(b.request.angle)),-b.request.speed/32*dt);}
   if(!grenade&&beam<beamLimit){
    this.forward.copy(p).sub(old);const distance=this.forward.length();
    if(distance>.002){
     const width=hazard?.065:id==='plasma'?.065:id==='rocket'?.032:id==='shotgun'?.019:id==='rifle'?.016:.021;
     this.dummy.position.copy(p).add(old).multiplyScalar(.5);this.dummy.quaternion.setFromUnitVectors(UP,this.forward.normalize());this.dummy.scale.set(width,distance,width);this.dummy.updateMatrix();this.beamMesh.setMatrixAt(beam,this.dummy.matrix);this.beamMesh.setColorAt(beam,this.beamColor.setHex(hazard?0xff2340:WEAPON_APPEARANCE[id].color).multiplyScalar(id==='plasma'?3.5:2.4));alpha.setX(beam,.85);beam++;
    }
   }
   if(targets && id==='rifle' && b.kind==='player')this.deckSkip(b,old,p,targets);
   if(old===this.bulletPrevious)this.previous.set(b,p.clone());else old.copy(p);
   if(trail&&(id==='plasma'||id==='rocket'||hazard)&&!grenade){
    this.particle(this.glow,EFFECT_LIMITS.glow,p,hazard?0xff2340:WEAPON_APPEARANCE[id].color,hazard?.2:id==='rocket'?.22:.19,.16);
    if(id==='rocket')this.particle(this.smoke,EFFECT_LIMITS.smoke,p,0x77817d,.25,.6,this.forward.set(0,.2,0));
   }
  }
  // Straight kinetic tracer or layered cyan lance. Only arc events branch/restrike.
  for(const link of this.links){
   link.age+=dt;const life=link.frost?.24:.12;if(link.age>=life)continue;
   this.forward.copy(link.end).sub(link.start);const length=this.forward.length();if(length<.002)continue;
   const fade=1-link.age/life;
   for(let layer=0;layer<(link.frost?2:1)&&beam<beamLimit;layer++){
    this.dummy.position.copy(link.start).add(link.end).multiplyScalar(.5);this.dummy.quaternion.setFromUnitVectors(UP,this.forward.normalize());
    const width=link.frost?(layer?.018:.065):.018;this.dummy.scale.set(width,length,width);this.dummy.updateMatrix();
    this.beamMesh.setMatrixAt(beam,this.dummy.matrix);this.beamMesh.setColorAt(beam,this.beamColor.setHex(link.frost?(layer?0xe4fbff:0x8cdeed):0xf5dab0).multiplyScalar(layer?2.8:1.5));alpha.setX(beam++,fade*(layer||!link.frost?.85:.35));
   }
  }
  let write=0;for(const link of this.links)if(link.age<(link.frost?.24:.12))this.links[write++]=link;this.links.length=write;
  // Reuse the bounded beam pool: broad violet corona plus thin blue-white core.
  for(const arc of this.arcs){
   arc.age+=dt;const life=arc.ball?.36:.26;if(arc.age>=life)continue;
   const strike=this.options.reducedMotion?0:Math.floor(arc.age/(arc.ball?.06:.045)),fade=Math.pow(1-arc.age/life,.6)*(strike%2?.65:1);
   this.arcAxis.subVectors(arc.end,arc.start);const distance=this.arcAxis.length(),count=arc.ball?11:12;
   this.arcSide.set(-this.arcAxis.z,0,this.arcAxis.x).normalize();this.arcStart.copy(arc.start);
   for(let i=1;i<=count&&beam+1<beamLimit;i++){
    const t=i/count,noise=Math.sin((arc.seed+strike)*7.13+i*127.1);
    this.arcEnd.copy(arc.start).addScaledVector(this.arcAxis,t);
    if(i<count){this.arcEnd.addScaledVector(this.arcSide,noise*Math.sin(t*Math.PI)*Math.min(arc.ball?.85:.5,distance*.2));this.arcEnd.y+=Math.cos(i*37.7+strike)*.14;}
    const width=arc.ball?(1-t*.65)*(.8+Math.abs(noise)*.6):1;
    beam=this.arcBeam(this.arcStart,this.arcEnd,(arc.ball?.075:.045)*width,0x666dff,fade*.22,beam);
    beam=this.arcBeam(this.arcStart,this.arcEnd,(arc.ball?.042:.012)*width,0xc4eaff,fade*.95,beam);
    // Coherent small forks share the same pool; never allocate a segment list per frame.
    if(i%3===0&&i<count&&beam+3<beamLimit){
     this.forkStart.copy(this.arcEnd);const sign=noise<0?-1:1;
     for(let j=0;j<2;j++){
      this.forkEnd.copy(this.forkStart).addScaledVector(this.arcSide,sign*(.16+Math.abs(noise)*.24)).addScaledVector(this.arcAxis,.025);this.forkEnd.y+=.08;
      beam=this.arcBeam(this.forkStart,this.forkEnd,.024,0x666dff,fade*.18,beam);beam=this.arcBeam(this.forkStart,this.forkEnd,.008,0xc4eaff,fade*.7,beam);this.forkStart.copy(this.forkEnd);
     }
    }
    this.arcStart.copy(this.arcEnd);
   }
  }
  write=0;for(const arc of this.arcs)if(arc.age<(arc.ball?.36:.26))this.arcs[write++]=arc;this.arcs.length=write;
  // Short velocity-aligned spark streaks share the existing bounded beam draw.
  for(const spark of this.glow){
   if(beam>=beamLimit)break;
   const speed=spark.v.length();if(speed<2||spark.age+dt>=spark.life)continue;
   const length=Math.min(.28,speed*.035);
   this.forward.copy(spark.v).normalize();this.dummy.position.copy(spark.p).addScaledVector(this.forward,-length*.5);
   this.dummy.quaternion.setFromUnitVectors(UP,this.forward);this.dummy.scale.set(.009,length,.009);this.dummy.updateMatrix();
   this.beamMesh.setMatrixAt(beam,this.dummy.matrix);this.beamMesh.setColorAt(beam,spark.color);alpha.setX(beam++,(1-spark.age/spark.life)*.55*(this.warningNear(spark.p.x,spark.p.z,.25)?.24:1));
  }
  this.finish(this.beamMesh,beam);this.finish(this.hostileMesh,hostile);
  this.drawParticles(this.fire,this.fireMesh,dt,camera,'fire');
  this.drawParticles(this.glow,this.glowMesh,dt,camera,'glow');this.drawParticles(this.smoke,this.smokeMesh,dt,camera,'smoke');this.drawParticles(this.debris,this.debrisMesh,dt,camera,'debris');this.drawParticles(this.decals,this.decalMesh,dt,camera,'decal');
  let field=0;for(const f of this.fields){f.age+=dt;if(f.age>=f.life)continue;
   this.dummy.position.copy(f.p);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.setScalar(f.radius*2);this.dummy.updateMatrix();
   this.fieldMesh.setMatrixAt(field,this.dummy.matrix);this.fieldMesh.setColorAt(field,f.color);
   (this.fieldMesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).setX(field++,Math.min(1,f.age/.12,(f.life-f.age)/.25));
  }write=0;for(const f of this.fields)if(f.age<f.life)this.fields[write++]=f;this.fields.length=write;this.finish(this.fieldMesh,field);
  this.primaryWarning.value=-1;this.unionCount.value=0;this.warningCoverage=0;this.warningMinX=this.warningMinZ=Infinity;this.warningMaxX=this.warningMaxZ=-Infinity;
  let ring=0,slash=0;for(const pulse of this.pulses){pulse.age+=dt;if(pulse.age>=pulse.life)continue;if(pulse.stable){if(this.warningVisible(pulse.p.x,pulse.p.z,pulse.radius))this.queueWarning(pulse.p.x,pulse.p.z,pulse.radius,0,0,0,0,pulse.age/pulse.life,(pulse.life-pulse.age)*1000,pulse.radius>2,marineX,marineZ,marineRadius);continue;}
   const t=pulse.age/pulse.life,mesh=pulse.slash?this.slashMesh:this.pulseMesh,index=pulse.slash?slash++:ring++;
   this.dummy.position.copy(pulse.p);this.dummy.rotation.set(-Math.PI/2,0,-pulse.angle);this.dummy.scale.setScalar(pulse.radius*(pulse.slash?.65+t*.35:.15+t*.85));this.dummy.updateMatrix();(mesh.geometry.getAttribute('effectShape') as T.InstancedBufferAttribute).setXYZW(index,0,0,0,0);mesh.setMatrixAt(index,this.dummy.matrix);mesh.setColorAt(index,pulse.color);(mesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute).setX(index,0);(mesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute).setX(index,(1-t)*(this.warningNear(pulse.p.x,pulse.p.z,pulse.radius)?.20:.8));
  }
  for(const native of this.nativeWarnings){if(!native.active)continue;const w=native.shape,sector=w.shape==='cone',circle=w.shape==='circle',radius=sector||circle?w.radius!:w.width!*.5,length=sector||circle?0:w.length!,angle=w.angle??0;
   if(this.warningVisible(w.x,w.z,radius,length,angle))this.queueWarning(w.x,w.z,radius,length,angle,sector?w.arc!*.5:0,sector?2:circle?0:1,w.progress??0,native.striking?0:native.remainingMs,native.heavy,marineX,marineZ,marineRadius,native.family);
  }
  if(this.bossWarning){const w=this.bossWarning;if(this.warningVisible(w.x,w.z,w.radius))this.queueWarning(w.x,w.z,w.radius,0,0,0,0,w.progress,(1-w.progress)*1000,true,marineX,marineZ,marineRadius);}
  this.groupWarnings();
  this.unionFillScale.value=Math.min(1,.07/Math.max(.07,this.warningCoverage));
  if(this.unionCount.value){this.dummy.position.set((this.warningMinX+this.warningMaxX)*.5,.04,(this.warningMinZ+this.warningMaxZ)*.5);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.set((this.warningMaxX-this.warningMinX)*.5,(this.warningMaxZ-this.warningMinZ)*.5,1);this.dummy.updateMatrix();this.hostileWarningMesh.setMatrixAt(0,this.dummy.matrix);this.hostileWarningMesh.setColorAt(0,WHITE);}
  write=0;for(const p of this.pulses)if(p.age<p.life)this.pulses[write++]=p;this.pulses.length=write;this.finish(this.pulseMesh,ring);this.finish(this.slashMesh,slash);this.finish(this.hostileWarningMesh,this.drawShooterCues(this.unionCount.value?1:0,dt));

 }
 private drawShooterCues(count:number,dt:number):number {
  const mesh=this.hostileWarningMesh;
  const frame=mesh.geometry.getAttribute('effectFrame') as T.InstancedBufferAttribute;
  const shape=mesh.geometry.getAttribute('effectShape') as T.InstancedBufferAttribute;
  const alpha=mesh.geometry.getAttribute('effectAlpha') as T.InstancedBufferAttribute;
  frame.setX(0,0);
  alpha.setX(0,1);
  for (const [id,cue] of this.shooters) {
   if (cue.fade>=0) {
    cue.fade=Math.max(0,cue.fade-dt);
    if (cue.fade===0) {this.shooters.delete(id);continue;}
   }
   if (count>=mesh.instanceMatrix.count || !this.warningVisible(cue.x,cue.z,.25,1.6,cue.angle,cue.y)) continue;
   const offset=.64;
   this.dummy.position.set(cue.x+Math.cos(cue.angle)*offset,cue.y,cue.z+Math.sin(cue.angle)*offset);
   this.dummy.rotation.set(-Math.PI/2,0,-cue.angle);
   this.dummy.scale.set(.8,.16,1);
   this.dummy.updateMatrix();
   mesh.setMatrixAt(count,this.dummy.matrix);
   mesh.setColorAt(count,WHITE);
   frame.setX(count,1);
   shape.setX(count,cue.progress);
   alpha.setX(count,cue.fade<0?1:cue.fade/.15);
   count++;
  }
  return count;
 }
 clear(){this.shooters.clear();this.activeShooters.clear();this.skippedRifles.fill(undefined);this.skipCursor=0;for(const warning of this.nativeWarnings)warning.active=false;this.unionCount.value=0;this.bossWarning=null;this.fields.length=0;this.trailClock=0;this.boonBursts=this.arcBursts=0;this.links.length=this.arcs.length=this.pulses.length=0;for(const [list,free]of this.particleFree){for(const item of list)free.push(item);list.length=0;}this.previous=new WeakMap();for(const m of this.meshes())m.count=0;}
 get counts(){return{fire:this.fire.length,glow:this.glow.length,smoke:this.smoke.length,debris:this.debris.length,pulses:this.pulses.length,decals:this.decals.length};}
 private meshes(){return[this.fireMesh,this.glowMesh,this.smokeMesh,this.debrisMesh,this.decalMesh,this.pulseMesh,this.slashMesh,this.beamMesh,this.fieldMesh,this.hostileMesh,this.hostileWarningMesh];}
 dispose(){if(this.disposed)return;this.clear();this.disposed=true;this.emptyPriorityTexture.dispose();this.feedback={};for(const t of this.textures)t.dispose();for(const m of this.meshes()){m.geometry.dispose();(m.material as T.Material).dispose();m.removeFromParent();}this.particleFree.clear();}
}
