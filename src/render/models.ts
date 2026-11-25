import type { AbilityElement } from '../game/abilities/contract';
import {guardianStunIndicator} from './GuardianStunIndicator';
import {weaponTopEdge} from './lighting/WeaponTopEdge';
import * as T from 'three';
import {AuthoredMotionPlayer,AuthoredMarineMotion,AuthoredEnemyMotion} from './motion/AuthoredMotion';
import {AnatomicalFrost} from './motion/AnatomicalFrost';
import {originalCreatureFrost,originalCreatureHeight,originalCreatureFootprints,originalCreatureRankScale,originalCreatureRankHeight,originalCreatureEmission,type CreatureEmissionRegion} from './OriginalCreatureAnatomy';
import {EnemyMotion,type EnemyAttackPhase,type EnemyStrikeShape} from './motion/EnemyMotion';
import {MarineMotion} from './motion/MarineMotion';
import {MarineActionMotion} from './motion/MotionEvents';
import type {GameEffect} from '../DepthGame';
import {ENEMY_SPAN} from '../game/combat/enemyContact';
import {ENEMIES,ENEMY_FAMILY_SCALE,ELITE_BODY_SCALE,enemyBodyRadius} from '../game/enemies/catalog';
import {MAT,shell,rod,box,ring,batch,disposeModel,geometry} from './meshParts';
import {instantiateAsset,type AssetName} from './assets';
import {afflictionEffects,NO_AFFLICTION,type AfflictionStatus} from './afflictions';
import {weaponModel,WEAPON_FIT,WEAPON_APPEARANCE,type GunModel} from './weapons';
import type {WeaponId} from '../game/combat/types';
import {actorSurface} from './vfx/ActorSurface';
import {setGraphicShadowPlane} from './lighting/GraphicSurface';
// Shadow terminator, edge terminator, shadow gain and Carrier atlas flag.
const BROOD_FORM: Readonly<Partial<Record<string, readonly [number, number, number, number]>>> = {
 crawler: [-.06,.94,.34,0], spitter: [-.24,.94,.38,0], stalker: [.26,.95,.32,0],
 carrier: [-.04,.93,.40,1], matron: [-.20,.94,.45,1],
};
/** SHADER25b: small families keep a lighter shadow plane so they stay findable on the darkest decks. */
const SMALL_FAMILY_SHADOW_PLANE=.68;
// CREATURE26: Brute zone levels (lit albedo: carapace, plate, flesh, bone) for its three anatomy value shapes.
// CREATURE26: the Warden's rank scale fell 3.8 -> 2.79 so its drawn reach is ~2.3 m; this presentation-only
// stature factor (was .86) keeps its in-game height at the WARDEN25 4.41 m.
const WARDEN_STATURE=1.175;
// Armour, plate, flesh, bone and the wet highlight on flesh.
const CREATURE_ZONE_LEVELS: Readonly<Partial<Record<string, readonly [number, number, number, number, number]>>> = {
 crawler: [.050, .050, .14308, .180, .08],
 stalker: [.052, .052, .07121, .187, .06],
 spitter: [.048, .048, .16245, .185, .10],
 carrier: [.050, .050, .108, .180, .075],
 brute: [.050, .050, .105, .190, .16],
};
import {alienIdentity,marineIdentity,FAMILY_IDENTITY,FAMILY_LANTERNS, ENEMY_BODY_COLORS,CREATURE_BODY_HUES,CREATURE_DECK_TINTS,RIG_ACCENTS} from './ActorIdentity';
export {MAT,box,ball,rod,disposeModel} from './meshParts';
export type ActorModel={elementContact?:(element:AbilityElement)=>void;root:T.Group;body:T.Group;limbs:T.Group[];height:number;weapon?:T.Group;
 animate:(time:number,moving:number,aim:number,recoil?:number,reload?:number,velocity?:{x:number;y:number})=>void;
 /** Refresh attached weapon after presentation changes the body pose, before sampling the muzzle. */
 syncWeaponPose?:()=>void;
 posePortrait?:()=>void;
 recoveryStagger?:()=>void;
 setWaitingState?:(waiting:boolean,feintProgress?:number,ordinary?:boolean,paceSide?:number,planted?:boolean)=>void;
 setDeathAge?:(seconds:number)=>void;
 setPodCountdown?:(remainingMs:number,stage?:import('../game/enemies/EnemySystem').PodStage)=>void;
 setPlateOpen?:(open:number)=>void;
 setBossState?:(stunMs:number,broodMs:number,chargeMs:number,specialCooldownMs?:number)=>void;
 setEmissionRegion?:(region:CreatureEmissionRegion,strength:number)=>void;
 /** Renderer visibility/waiting-pose LOD only; direct rig studies stay full rate. */
 setMotionVisible?:(visible:boolean,quietLocomotion?:boolean)=>void;
 terminalCue?:(cue:import('./DeathRagdolls').DeathCue)=>import('./DeathRagdolls').DeathCue;
 shadeCastPeak?:()=>void;
 reactToElement?:(element:import('./motion/OverdriveReactions').TargetElement,angle:number)=>void;
 elementalHold?:()=>boolean;
 corpseEffectReady?:(seconds:number)=>boolean;
 poseDeath?:(cue:import('./DeathRagdolls').DeathCue,progress:number)=>number;
 setAttackState?:(phase:EnemyAttackPhase,progress:number,lockedAngle:number,shape?:EnemyStrikeShape|null)=>void;
 setRig?:(rig:string)=>void;setAimPitch?:(radians:number)=>void;setStageLight?:(strength:number)=>void;setThreat?:(windupMs:number,pendingAttack:'spit'|'charge'|null,champion?:string,alpha?:number)=>void;equip?:(id:WeaponId)=>void;muzzleWorld?:(target:T.Vector3)=>T.Vector3;
 reset?:()=>void;prepare?:()=>void;setAffliction?:(status:AfflictionStatus)=>void;freeze?:()=>void;attack?:()=>void;hit?:(strength?:number,direction?:number,heavy?:boolean,weapon?:WeaponId)=>void;setMotionOptions?:(strength:number,reducedMotion:boolean)=>void;setMotionSeed?:(seed:number)=>void;setAction?:(id:string,progress:number)=>void;setDead?:(dead:boolean)=>void;motionEvent?:(event:GameEffect)=>void;setExposed?:(exposed:boolean)=>void;stop?:()=>void;
 dissolve?:(progress:number)=>void;setFlashIntensity?:(value:number)=>void;setColliderDebug?:(visible:boolean,radius?:number)=>void;};
const vec=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const species:Record<string,{asset:AssetName;span:number;height?:number}>={
 crawler:{asset:'dretch',span:ENEMY_SPAN.crawler},stalker:{asset:'basilisk',span:ENEMY_SPAN.stalker},spitter:{asset:'marauder',span:ENEMY_SPAN.spitter},
 carrier:{asset:'dragoon',span:ENEMY_SPAN.carrier},brute:{asset:'tyrant',span:ENEMY_SPAN.brute},queen:{asset:'tyrant',span:ENEMY_SPAN.queen},
};
const BRUTE_STAND_BOUNDS = {
 size: new T.Vector3(8.041213, 4.992038, 7.173330),
 center: new T.Vector3(.001445, 2.477302, .898714),
 minY: -.018717,
};
const rigMetrics=new Map<string,{size:T.Vector3;center:T.Vector3;minY:number}>();
/** Opt-in capture aid. Ordinary actors allocate no debug mesh/material or draw. */
function colliderDebug(root:T.Group,defaultRadius:number){
 let disc:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>|undefined;
 return(visible:boolean,radius=defaultRadius)=>{
  if(!disc&&visible){
   const material=new T.MeshBasicMaterial({color:root.name==='marine'?0x9fe8ff:0xff5a36,transparent:true,opacity:.72,depthWrite:false,side:T.DoubleSide});material.userData.actorMaterial=true;
   disc=new T.Mesh(geometry('g4-debug-collider-ring',()=>new T.RingGeometry(.92,1,48)),material);disc.name='debug-collider-disc';disc.rotation.x=-Math.PI/2;disc.position.y=.028;disc.castShadow=disc.receiveShadow=false;root.add(disc);
  }
  if(disc){disc.visible=visible;disc.scale.setScalar(Math.max(0,radius));disc.castShadow=disc.receiveShadow=false;}
 };
}
function rig(name:AssetName,span:number,human=false,collisionRadius?:number){
 const source=instantiateAsset(name),root=new T.Group(),body=new T.Group();root.add(body);body.add(source.root);source.root.rotation.y=-Math.PI/2;
 const mixer=new T.AnimationMixer(source.root),actions=new Map<string,T.AnimationAction>(),upper=new Set<string>();
 if(human)source.root.getObjectByName('ribs')?.traverse(o=>upper.add(o.name));
 const action=(name:string):T.AnimationAction|undefined=>{let existing=actions.get(name);if(existing)return existing;const clip=source.clips.find(c=>c.name===name);if(!clip)return;
  const masked=human&&!name.startsWith('m10-')?new T.AnimationClip(clip.name,clip.duration,clip.tracks.filter(t=>clip.name.endsWith('_delta')?upper.has(t.name.split('.')[0]):!upper.has(t.name.split('.')[0]))):clip;
  existing=mixer.clipAction(masked);actions.set(name,existing);return existing;
 };
 const idle=action('stand')??action('idle');idle?.play();if(human){const pose=action('shotgun_delta');pose?.play();if(pose)pose.paused=true;}mixer.update(0);root.updateMatrixWorld(true);
 // Shared rank origin for the original tyrant and its Warden promotion.
 const bruteAnchor=name==='tyrant' && source.materials.some(material=>material.userData.k11Original);
 let metrics=bruteAnchor?BRUTE_STAND_BOUNDS:rigMetrics.get(name);if(!metrics){const bounds=new T.Box3();root.traverseVisible(object=>{/* HERO24: rig kit (Arc mast, Cryo dewars) may stand above the helmet; the marine's scale stays fitted to the body. */if(object instanceof T.Mesh&&!(human&&/^k10-rig-/.test(object.name||object.parent?.name||'')))bounds.expandByObject(object,true);});metrics={size:bounds.getSize(new T.Vector3()),center:bounds.getCenter(new T.Vector3()),minY:bounds.min.y};rigMetrics.set(name,metrics);}
 const {size,center,minY}=metrics,factor=span/(human?size.y:Math.max(size.x,size.z));
 // A collider is a circle: fitting only the widest axis lets diagonal legs and
 // thoraxes cross a touching neighbor. Preserve height, tighten horizontal stance.
 const radial=Math.hypot(size.x,size.z)*.5*factor;
 const horizontal=collisionRadius===undefined?1:Math.min(1,collisionRadius*.94/radial);
 // K11 Lantern Brood skins are sculpted in collider-fitted proportions: height follows the authored aspect.
 let k11Aspect=0;source.root.traverse(o=>{if(o.userData.k11Aspect)k11Aspect=o.userData.k11Aspect;});
 const vertical=k11Aspect?factor*horizontal*k11Aspect:factor;
 source.root.scale.set(factor*horizontal,vertical,factor*horizontal);body.position.y=-minY*vertical;source.root.position.x=-center.x*factor*horizontal;source.root.position.z=-center.z*factor*horizontal;
 root.userData.colliderRadius=collisionRadius;
 const restBones:Array<{bone:T.Bone;position:T.Vector3;quaternion:T.Quaternion;scale:T.Vector3}>=[];
 source.root.traverse(o=>{if(o instanceof T.Bone)restBones.push({bone:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});});
 const height=size.y*vertical;let current=idle,previous:number|undefined,attackTime=0,phase=0,rate=1;
 const switchTo=(next:T.AnimationAction|undefined,oneShot=false)=>{if(!next||next===current&&!oneShot)return;next.reset().setEffectiveWeight(1).setEffectiveTimeScale(oneShot?1:rate);next.setLoop(oneShot?T.LoopOnce:T.LoopRepeat,oneShot?1:Infinity);next.clampWhenFinished=oneShot;if(!oneShot)next.time=next.getClip().duration*phase;next.play();current?.fadeOut(.13);next.fadeIn(.13);current=next;};
 const step=(time:number,moving:number,backwards=false,speed=1)=>{const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;attackTime=Math.max(0,attackTime-dt);if(!attackTime)switchTo(moving>.3?(backwards?action('run_back'):action('run'))??action('walk'):idle);if(current&&moving>.3&&!attackTime)current.setEffectiveTimeScale(speed*rate);mixer.update(dt);};
 return{...source,assetRoot:source.root,root,body,height,span:span*horizontal,mixer,actions,action,step,setPhase(value:number){phase=((value*.61803398875)%1+1)%1;rate=.94+.12*(((value*.41421356237)%1+1)%1);if(current){current.time=current.getClip().duration*phase;if(current===idle)current.setEffectiveTimeScale(rate);}},
 brace(){attackTime=0;switchTo(idle);},react(heavy:boolean){const pain=action(heavy?'pain2':'pain1')??action('pain')??action('pain1');if(pain){switchTo(pain,true);attackTime=.24;pain.setEffectiveTimeScale(pain.getClip().duration/.24);}},
 reset(){mixer.stopAllAction();for(const p of restBones){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.quaternion);p.bone.scale.copy(p.scale);}mixer.timeScale=1;previous=undefined;attackTime=0;current=idle;idle?.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();root.position.set(0,0,0);root.rotation.set(0,0,0);body.rotation.set(0,0,0);root.traverse(o=>{if(o instanceof T.Bone)o.matrixAutoUpdate=true;if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});mixer.update(0);},freeze(){mixer.timeScale=0;},attack(){const attack=action('attack');if(attack){switchTo(attack,true);attackTime=attack.getClip().duration;}},stop(){mixer.stopAllAction();mixer.uncacheRoot(source.root);}};
}
export function alien(kind:string,elite=false):ActorModel{
 const def=species[kind]??species.crawler,collisionRadius=(kind==='queen'?92:ENEMIES[kind as keyof typeof ENEMIES]?.radius??14)/32,r=rig(def.asset,def.span,false,kind==='brute'?28/32:collisionRadius);r.root.name=`alien-${kind}`;r.root.userData.graphicActorBase=ENEMY_BODY_COLORS[kind as keyof typeof ENEMY_BODY_COLORS];
 const family=kind as keyof typeof ENEMY_FAMILY_SCALE;
 const familyScale=ENEMY_FAMILY_SCALE[family]??1;
 const actorScale=familyScale*(elite?ELITE_BODY_SCALE:1);
 const original=r.materials.some(m=>m.userData.k11Original);
 if(kind==='brute'&&!original){r.assetRoot.scale.y*=.78;r.body.position.y*=.78;r.height*=.78;}
 if(kind==='queen'){r.assetRoot.scale.y*=1.08;r.body.position.y*=1.08;r.height*=1.08;}
 if(kind==='stalker'&&!original){r.assetRoot.scale.z*=.62;r.assetRoot.scale.y*=.72;r.body.position.y*=.72;r.height*=.72;}
 // I11b: settled production-idle feet/skin radial fit, measured against the
 // native contact circle. Preserve vertical stature; native strike rules are unchanged.
 const sourceScale=r.assetRoot.scale.clone(),sourcePosition=r.assetRoot.position.clone(),sourceSpan=r.span;
 const footprintFits=original&&kind!=='queen'?originalCreatureFootprints(r.root,r.assetRoot,r.clips,kind,kind==='brute'?28/32:collisionRadius):{};
 if(original)r.root.userData.k11FootprintFits=footprintFits;
 const groundY=r.body.position.y;
 let visualJitter=1;// CREATURE18: presentation-only crowd scale (colliders, reach and span unchanged)
 const fitFootprint=(rank?:string)=>{
  if(!original||kind==='queen')return;
  const jitter=rank?1:visualJitter;
  const rankKey=rank?'boss':elite?'elite':'base';
  const regularBrute=kind==='brute'&&!rank;
  const rankAdjustment=rank?1:actorScale/originalCreatureRankScale(kind,rankKey);
  const fit=(footprintFits[rankKey]??1)*(regularBrute?collisionRadius/(28/32):1)*rankAdjustment;
  const rankHeight=originalCreatureRankHeight(kind,rankKey);
  const rankScale=regularBrute&&rankHeight>0?2.95/rankHeight:originalCreatureRankScale(kind,rankKey);
  // CREATURE19: the Warden stands low and heavy (presentation only; collider, reach and span unchanged).
  const verticalScale=(regularBrute?rankScale*(elite?ELITE_BODY_SCALE:1):rankScale*rankAdjustment)*(rank==='warden'?WARDEN_STATURE:1);
  r.assetRoot.scale.x=sourceScale.x*fit*jitter;r.assetRoot.scale.z=sourceScale.z*fit*jitter;
  // K11 boss tier: uniform rank scale; keep the feet on the deck by moving the asset origin, not the pooled body.
  r.assetRoot.scale.y=sourceScale.y*verticalScale*jitter;r.assetRoot.position.y=sourcePosition.y+groundY*(verticalScale*jitter-1);
  r.assetRoot.position.x=sourcePosition.x*fit*jitter;r.assetRoot.position.z=sourcePosition.z*fit*jitter;r.span=sourceSpan*fit;
  if(r.root.userData.affliction)r.root.userData.affliction.span=r.span;
 };
 fitFootprint();
 const persistentMark=kind==='crawler'||kind==='spitter'||kind==='stalker';
 const organStrength=r.materials.map(m=>m.emissiveIntensity),emission=originalCreatureEmission(r.materials);
 const color=new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler).lerp(new T.Color(0xffffff),.08);const value=kind==='brute'?.62:kind==='carrier'?.75:kind==='spitter'?.70:kind==='stalker'?.40:kind==='queen'?.28:.68;if(!original)for(const m of r.materials)m.color.multiply(color).multiplyScalar(value);
 if(original && kind==='brute') for(const material of r.materials) material.defines={...material.defines,BRUTE_PLANES:1};
 const form=original && BROOD_FORM[kind];
 if(form)for(const material of r.materials)material.defines={...material.defines,BROOD_PLANES:1};
 const surface=actorSurface(r.materials,false,elite||kind==='queen');
 let contactLife=0, contactKind=0;
 if(form)surface.form(...form);
 surface.body(CREATURE_BODY_HUES[kind as keyof typeof CREATURE_BODY_HUES]??CREATURE_BODY_HUES.crawler);
 const deckTints=original && CREATURE_DECK_TINTS[kind];
 let previousFog:T.Scene['fog']|undefined, previousMatron=false;
 const applyDeckTint=(matron:boolean)=>{
  if(!deckTints)return;
  const parent=r.root.parent, fog=parent instanceof T.Scene?parent.fog:null;
  if(fog===previousFog&&matron===previousMatron)return;
  previousFog=fog;previousMatron=matron;
  if(form && kind==='carrier')surface.form(...(matron ? BROOD_FORM.matron! : form));
  // Room fog carries the authored ambient palette. A greener fill shifts the skin towards its cool swatch.
  const sky=fog?.color;
  const cool=sky?T.MathUtils.clamp(5*(sky.g-sky.r)/Math.max(.001,sky.g),0,1):0;
  const {warm,cool:cold,coolFlesh}=deckTints;
  if(levels && coolFlesh!==undefined){
   surface.zones(levels[0],levels[1],T.MathUtils.lerp(levels[2],coolFlesh,cool),levels[3],levels[4]);
  }
  for(const m of r.materials){
   if(matron)m.color.setRGB(1,1,1);
   else m.color.setRGB(T.MathUtils.lerp(warm[0],cold[0],cool),T.MathUtils.lerp(warm[1],cold[1],cool),T.MathUtils.lerp(warm[2],cold[2],cool));
  }
 };
 const levels=CREATURE_ZONE_LEVELS[kind];
 if(original && levels)surface.zones(...levels);
 if(kind==='crawler'||kind==='spitter'||kind==='stalker'){
  const shadow=original && kind==='stalker' ? .82 : SMALL_FAMILY_SHADOW_PLANE;
  for(const material of r.materials)setGraphicShadowPlane(material,shadow);
 }
 surface.identity(kind==='queen'?ENEMY_BODY_COLORS.queen:elite?0xc1d8e5:FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,elite,kind==='queen'?.48:undefined);
 surface.lantern(FAMILY_LANTERNS[kind as keyof typeof FAMILY_LANTERNS]??FAMILY_LANTERNS.crawler);
 const identity=alienIdentity(r.root,kind,r.span,r.height,elite);
 /* CREATURE18: every creature knows its rest-pose height so the corpse wipe is crisp. */{const bounds=new T.Box3();r.assetRoot.traverse(o=>{if(o instanceof T.SkinnedMesh){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox!);}});surface.plateBounds(bounds.min.y,bounds.max.y-bounds.min.y,(bounds.min.z+bounds.max.z)/2,bounds.max.z-bounds.min.z,(bounds.min.x+bounds.max.x)/2,(bounds.max.x-bounds.min.x)*.18);}
 let castShadeTime=0;
 let broodRelease=0, wardenTurnRemaining=0, wallStunStartMs=0;
 let bossStun=0,stageLight=1,brood=0,bossCharge=0;
 let flash=0,previous:number|undefined,exposed=false,dead=false,status:AfflictionStatus=NO_AFFLICTION,windup=0,champion:string|undefined,alpha=1,flinch=0,windupDuration=500,threatKind:'spit'|'charge'|null=null,emergence=0,emissiveHex=-1;
 // K7's procedural growth keeps its legacy reserve; K11 geometry already
 // contains the caste mass and uses explicit rank/pose clearance below.
 const frameHeight=kind==='brute'&&!original?r.height/.78:r.height;
 // I13: world attachments must clear the full authored boss tier across clips,
 // even if rank selection first occurs in a low spawn/anticipation pose.
 const attachmentHeight=()=>original&&kind!=='queen'
  ?Math.max(champion==='warden'?4.5:champion==='matron'?4.8:kind==='brute'?3.03:0,originalCreatureHeight(r.root)+.08,frameHeight*Math.max(kind==='stalker'?1.3:1.12,champion?1.4:elite?1.25:1))
  :frameHeight*Math.max(kind==='queen'?1.4:kind==='spitter'?1.55:kind==='carrier'?1.35:kind==='stalker'?1.5:1,champion?1.72:elite?1.28:1);

 const restBodyY=r.body.position.y,emergenceDuration=.22,emergenceDepth=Math.min(.28,r.height*.14);
 const authored=new AuthoredEnemyMotion(new AuthoredMotionPlayer(r.mixer,kind==='queen'?[]:r.clips,undefined,r.assetRoot),kind);
 const motion=new EnemyMotion(r.root,r.body,r.assetRoot,kind);motion.authored=authored.player.available;
 const corpseBounds=new T.Box3(),frost=kind==='queen'?undefined:originalCreatureFrost(r.root,kind)??new AnatomicalFrost(r.root,kind);let deathCue:'none'|'frost'|'burn'|'acid'|'arc'='none',terminalDissolve=0,liveCrack=false;
 const stunIndicator=kind==='brute'?guardianStunIndicator(r.root):undefined;
 const effects=afflictionEffects(r.root,r.span,r.height),setColliderDebug=colliderDebug(r.root,ENEMY_FAMILY_SCALE[family]?enemyBodyRadius(family,elite)/32:collisionRadius);
 const halo=elite&&ENEMY_FAMILY_SCALE[family]?new T.Mesh(
  new T.RingGeometry(enemyBodyRadius(family,true)/32+.065,enemyBodyRadius(family,true)/32+.135,48),
  new T.MeshBasicMaterial({color:0xe8cd91,transparent:true,opacity:.30,depthWrite:false}),
 ):undefined;
 if(halo){
  halo.name='elite-ground-halo';halo.rotation.x=-Math.PI/2;halo.position.y=.026;
  r.root.add(halo);
 }
 return{root:r.root,body:r.body,limbs:[],elementContact(element){
   contactKind=element==='cryo'?1:element==='pyro'?2:element==='arc'?3:4;
   contactLife=.62;
  },shadeCastPeak(){castShadeTime=.18;surface.castShade(1);},setPlateOpen(open){if(kind==='brute'){surface.expose(open);surface.shedShoulder(open>=1?1:0);}},setEmissionRegion:emission.set,setBossState(stunMs,broodMs,chargeMs,specialCooldownMs=0){if(brood>0 && broodMs===0 && specialCooldownMs>4000)broodRelease=.16;const wasStunned=bossStun>0;bossStun=Math.max(0,stunMs);bossCharge=Math.max(0,chargeMs);brood=Math.max(0,broodMs);if(bossStun>0&&!wasStunned){wallStunStartMs=bossStun;authored.player.snapNext();authored.player.sample(champion==='warden'?'m10-wall-stun':'m10-stagger',champion==='warden'?0:.4,0,0);r.body.rotation.set(0,0,0);r.body.scale.set(1,1,1);}else if(wasStunned&&bossStun===0){authored.player.snapNext();if(champion==='warden')wardenTurnRemaining=.24;}stunIndicator?.update(bossStun,attachmentHeight());if(champion==='warden')emission.set('warden-ram',bossStun>0?0:chargeMs>0?2.5:windup>0?1.8*(1-Math.min(1,windup/windupDuration)):0);if(champion==='matron')emission.set('matron-vents',broodMs>0?1.5*(1-Math.min(1,broodMs/1000)):0);},get height(){return attachmentHeight();},setColliderDebug,setStageLight(strength){stageLight=strength;surface.stage(strength);identity.mesh.material.uniforms.identityStageLight.value=T.MathUtils.clamp(strength,0,1);},setDeathAge(age){if(deathCue==='acid'){terminalDissolve=Math.min(1,.10+Math.max(0,age-.04)/1.15);surface.dissolve(terminalDissolve);identity.mesh.material.uniforms.identityDissolve.value=terminalDissolve;}r.root.userData.motionDeathProgress=terminalDissolve;},dissolve(progress){const amount=Math.max(progress,terminalDissolve);surface.dissolve(amount);identity.mesh.material.uniforms.identityDissolve.value=amount;},setFlashIntensity:surface.setFlashIntensity,recoveryStagger:authored.stagger.bind(authored),setMotionVisible:authored.setVisible.bind(authored),setMotionOptions(strength,reduced){motion.setOptions(strength,reduced);authored.setOptions(strength,reduced);},setWaitingState(waiting,feintProgress,ordinary,paceSide,planted){authored.setWaitingState(waiting,feintProgress,ordinary??!champion,paceSide,planted);},setMotionSeed(seed){authored.seedWaiting(seed);motion.setSeed(seed);r.setPhase(seed);const h=Math.imul((seed|0)^0x9e3779b9,0x85ebca6b)>>>0;visualJitter=.94+.12*((h%1000)/999);fitFootprint(champion);},setAttackState(phase,progress,angle,shape){surface.load(phase==='windup'?progress:phase==='strike'?1:phase==='recovery'?1-progress:0);if(kind==='stalker')surface.reveal(phase==='windup'?.55+progress*.65:phase==='strike'?1.2:phase==='recovery'?.45:0);motion.setAttackState(phase,progress,angle,shape);authored.state(phase,progress);},elementalHold:()=>authored.elementalHold,corpseEffectReady:seconds=>!authored.elementalHold||seconds>=.43,terminalCue:authored.terminalCue.bind(authored),reactToElement(element,direction){authored.reactToElement(element);
   if(!authored.elementalHold)return;
   flash=Math.min(flash,.22);
   if(element==='kinetic')motion.beam(direction);
   if(dead){deathCue=authored.terminalCue(deathCue);surface.death(deathCue);surface.hit(0);surface.stage(stageLight*.36);surface.camouflage(.30);if(deathCue==='frost')frost?.use();r.root.userData.motionDeathCue=deathCue;}
  },poseDeath(cue,progress){if(authored.elementalHold){surface.hit(0);surface.stage(stageLight*.36);surface.camouflage(.30);}motion.carryIntoFall(progress);return authored.death(cue,progress);},attack(){if(!dead&&!status.frozen){motion.attack();authored.attack();if(!motion.authored)r.attack();}},freeze(){if(dead)return;stunIndicator?.reset();emission.reset();identity.mesh.material.uniforms.identityStatus.value=status.frozen?1:status.burning?2:status.poisoned?3:0;deathCue=status.frozen?'frost':status.burning?'burn':status.poisoned?'acid':status.shocked?'arc':'none';deathCue=authored.terminalCue(deathCue);surface.death(deathCue);if(deathCue==='frost')frost?.use();r.root.userData.motionDeathCue=deathCue;dead=true;if(halo)halo.visible=false;surface.load(0);motion.freeze(true);emergence=emergenceDuration;r.root.updateWorldMatrix(true,true);corpseBounds.setFromObject(r.root,true);if(corpseBounds.min.y<r.root.position.y)r.body.position.y+=r.root.position.y-corpseBounds.min.y;status=NO_AFFLICTION;effects?.reset(deathCue==='frost');for(const [i,m] of r.materials.entries())m.emissiveIntensity=original?organStrength[i]*.30:0;surface.hit(0);surface.reveal(0);identity.update(0,0,champion,false,1,true);r.freeze();},stop:r.stop,prepare(){stunIndicator?.prepare(r.height);r.action('run');r.action('attack');r.action('pain1');r.action('pain2');r.action('pain');},reset(){contactLife=0;contactKind=0;broodRelease=0;castShadeTime=0;wardenTurnRemaining=0;bossStun=0;brood=0;bossCharge=0;stageLight=1;emission.reset();authored.reset();liveCrack=false;frost?.reset();deathCue='none';terminalDissolve=0;r.root.userData.motionDeathProgress=0;motion.reset();r.reset();stunIndicator?.reset();r.root.userData.visualStatus=undefined;r.root.userData.motionDeathCue='none';surface.reset();if(halo)halo.visible=true;surface.identity(kind==='queen'?ENEMY_BODY_COLORS.queen:elite?0xc1d8e5:FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,elite,kind==='queen'?.48:undefined);identity.reset();identity.mesh.castShadow=identity.mesh.receiveShadow=false;windup=0;windupDuration=500;threatKind=null;champion=undefined;surface.warden(false);fitFootprint();alpha=1;flinch=0;emergence=0;r.body.position.y=restBodyY;flash=0;previous=undefined;exposed=dead=false;status=NO_AFFLICTION;effects?.reset();setColliderDebug(false);for(const [i,m] of r.materials.entries()){m.emissiveIntensity=original?organStrength[i]:0;if(original)m.emissive.setHex(0xffffff);}},hit(strength=1,direction=0,heavy=false,weapon){flash=Math.max(0,Math.min(1,strength));flinch=flash;motion.hit(strength,direction,heavy);authored.hit(strength,direction,heavy,weapon);if(!motion.authored&&strength>0&&!dead&&!status.frozen&&windup===0)r.react(heavy);},setThreat(ms,attack,rank,camouflage=1){applyDeckTint(rank==='matron');if(threatKind&&!attack&&windup>0&&!status.frozen)motion.attack();const remaining=attack?Math.max(0,ms):0;if(attack&&(attack!==threatKind||remaining>windup)){windupDuration=Math.max(1,remaining);r.brace();}threatKind=attack;windup=remaining;if(champion!==rank)surface.identity(rank||elite?0xc1d8e5:FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,!!rank||elite,kind==='queen'?.48:undefined);champion=rank;surface.warden(rank==='warden');if(halo)halo.visible=!rank&&!dead;fitFootprint(rank);alpha=camouflage;surface.camouflage(kind==='stalker'?alpha:1);},setExposed(v){exposed=v;if(kind!=="queen")surface.expose(v?1:0);},setAffliction(v){
  if(dead)return;status=v;identity.mesh.material.uniforms.identityStatus.value=v.frozen||v.chilled?1:v.burning?2:v.poisoned?3:0;
  effects?.set(v);r.mixer.timeScale=v.frozen?0:1;if(v.frozen)emergence=emergenceDuration;
 },
 animate(time,moving,aim,_recoil=0,_reload=0,velocity){const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;
  contactLife=Math.max(0,contactLife-dt);
  const statusKind=status.burning?2:status.frozen||status.chilled?1:status.shocked?3:0;
  surface.contact(contactLife>0?contactKind:statusKind,dead?0:contactLife>0?Math.min(1,contactLife/.22):statusKind ? .54 : 0,time);
  castShadeTime=Math.max(0,castShadeTime-dt);surface.castShade(Math.min(1,castShadeTime/.035));if(halo)halo.material.opacity=.30+.07*Math.sin(time*1.8);authored.advanceContact(dt);flash=authored.flashedOut?0:Math.max(0,flash-dt*20);surface.hit(authored.elementalHold?Math.min(.22,flash):flash);if(!status.frozen&&!dead&&bossStun===0){
   const yaw=Math.PI/2-aim;
   // On release the native aim can reverse in a tick. Follow that turn over the
   // first recovery step, keeping the jaw visible as the ram leaves the wall.
   if(wardenTurnRemaining>0 && !bossCharge && !windup){
    const delta=yaw-r.root.rotation.y;
    r.root.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*Math.min(1,dt/wardenTurnRemaining);
    wardenTurnRemaining=Math.max(0,wardenTurnRemaining-dt);
   }else{wardenTurnRemaining=0;r.root.rotation.y=yaw;}
  }
  if(form){
   // The broad side of a shell fills more of its projection as it turns.
   // Compensate the terminator without rotating the view-space key.
   const yaw=r.root.rotation.y;
   let shadow=form[0];
   if(kind==='crawler')shadow+=.46*Math.cos(yaw)+.12*Math.sin(yaw);
   if(kind==='stalker')shadow+=-.24*Math.cos(yaw)+.42*Math.sin(yaw);
   if(kind==='carrier')shadow=champion==='matron'?BROOD_FORM.matron![0]:shadow+.06*Math.sin(yaw);
   surface.formShadow(status.frozen||status.chilled||status.burning||status.shocked||flash>=.25||deathCue!=='none'?-2:T.MathUtils.clamp(shadow,-.45,.55));
  }
  if(champion==='warden' && bossStun>0 && !dead){
   authored.player.sample('m10-wall-stun',Math.min(1,(wallStunStartMs-bossStun)/100),dt,0);
  }
  surface.stage(stageLight*(bossStun>0?.68:authored.flashedOut?.36:1));
  if(authored.flashedOut)surface.camouflage(Math.min(.30,alpha));
  if(!dead && liveCrack!==authored.exposedIce){
   liveCrack=authored.exposedIce;
   if(liveCrack)frost?.use();else frost?.reset();
  }
  if(!dead&&bossStun===0){const visualTime=motion.begin(time,!!status.frozen);const speed=motion.rate*(velocity?T.MathUtils.clamp(Math.hypot(velocity.x,velocity.y)/(ENEMIES[kind as keyof typeof ENEMIES]?.speed??150),0,2):1);if(!authored.update(visualTime,moving,aim,windup>0,windup>0?1-Math.min(1,windup/windupDuration):0,!!status.frozen,status.burning,!!status.shocked,speed)&&!status.frozen)r.step(visualTime,windup>0?0:moving,false,speed);motion.apply(time,aim,moving,windup>0?1-Math.min(1,windup/windupDuration):0,windup>0,!!status.frozen,status.burning,!!status.shocked);if(champion==='matron' && (brood>0 || broodRelease>0)){
   authored.player.snapNext();
   authored.player.sample('m10-brood',brood>0?.70*(1-brood/1000):1,dt);
   broodRelease=Math.max(0,broodRelease-dt);
  }
  if(champion==='warden'){if(wardenTurnRemaining>0){
    authored.player.snapNext();
    authored.player.sample('m10-wall-stun',1,dt);
    r.body.rotation.set(0,0,0);
    r.body.scale.set(1,1,1);
   }else if(bossCharge>0 || (threatKind==='charge'&&windup>0)){
    authored.player.snapNext();
    if(bossCharge>0)authored.player.sample('m10-ram-charge',(visualTime/.5)%1,dt);
    else authored.player.sample('m10-ram-load',1-Math.min(1,windup/windupDuration),dt);
   }}}
  if(kind==='queen')surface.expose(identity.mesh.material.uniforms.identityOpening.value);identity.update(time,windup>0?1-Math.min(1,windup/windupDuration):0,champion,exposed,kind==='stalker'?alpha:1,dead);if(original&&r.root.userData.affliction)r.root.userData.affliction.height=attachmentHeight();effects?.animate(time);const hex=status.frozen?0x79ddff:0xffdfb0,intensity=flash*.1+(status.frozen?.018:0);
  const boost=1+flash*.65+(elite?.28:0)+(champion==='matron'?1.45:champion?.45:0)+(windup>0?(1-Math.min(1,windup/windupDuration))*1.8:0);
  // The small directional marks hold their exposure as the pose changes.
  // Compensate for the actor surface's higher emission gain on elite bodies.
  const liveGain=persistentMark?(elite?1.8/2.3:1):boost;
  for(const [i,m] of r.materials.entries()){
   if(original){
    m.emissive.setHex(0xffffff);
    m.emissiveIntensity=organStrength[i]*(dead?.10:bossStun>0?.15:liveGain)+intensity;
   }else{
    if(hex!==emissiveHex)m.emissive.setHex(hex);
    m.emissiveIntensity=intensity;
   }
  }
  emissiveHex=hex;
 }};
}
/** LIGHT13: the carried weapon reads mid-grey against a dark deck, never a black hole in the marine. */
const liftedWeaponMaterials=new WeakSet<T.Material>(),weaponGrey=new T.Color(0x5d666f);
function liftWeaponValue(root:T.Object3D){root.traverse(object=>{if(!(object instanceof T.Mesh))return;for(const m of Array.isArray(object.material)?object.material:[object.material]){if(!(m instanceof T.MeshStandardMaterial)||liftedWeaponMaterials.has(m))continue;liftedWeaponMaterials.add(m);if(m.color.getHSL({h:0,s:0,l:0}).l<.3)m.color.lerp(weaponGrey,.55);}});}
export function marine():ActorModel{
 // The marine's weighted torso already fits its .5m collider. Retain a rigid,
 // uniform source transform so authored hand sockets never inherit shear.
 const r=rig('marine',2.05,true),weapon=new T.Group();r.root.name='marine';r.root.userData.colliderRadius=.5;r.root.add(weapon);
 // The authored clips deliberately leave origin untracked. Retain the ready
 // origin captured by rig(), then retire legacy stand/weapon bindings before
 // authored actions capture their original state (same path as pooled reset).
 r.reset();r.mixer.stopAllAction();
 const surface=actorSurface(r.materials,true),identity=marineIdentity(r.root),authoredPlayer=new AuthoredMotionPlayer(r.mixer,r.clips,r.assetRoot);
 const guns=new Map<WeaponId,GunModel>();let current:GunModel;const socket=r.assetRoot.getObjectByName('tag_weapon')!;let pose=authoredPlayer.available?undefined:r.action('shotgun_delta');
 const equip=(id:WeaponId)=>{if(current?.id===id)return;let gun=guns.get(id);if(!gun){gun=weaponModel(id);guns.set(id,gun);weapon.add(gun.root);liftWeaponValue(gun.root);weaponTopEdge(gun.root);}for(const g of guns.values())g.root.visible=g===gun;current=gun;pose?.stop();pose=authoredPlayer.available?undefined:r.action(`${({pistol:'blaster',plasma:'prifle',rocket:'lcannon'} as Partial<Record<WeaponId,string>>)[id]??id}_delta`);if(pose){pose.play();pose.paused=true;}};equip('shotgun');
 const inverse=new T.Matrix4(),socketMatrix=new T.Matrix4(),scale=new T.Vector3();
 const barrelForward=new T.Vector3(),desiredForward=new T.Vector3(),aimCorrection=new T.Quaternion(),handWorld=new T.Quaternion(),parentWorld=new T.Quaternion();
 const firingHand=r.assetRoot.getObjectByName('handR');let aimConstrained=true;
 const syncWeaponPose=()=>{
  // Correct the wrist in world space before attaching the receiver. Rotating
  // only the detached gun group leaves cast hands visibly beside the grip.
  if(aimConstrained&&firingHand?.parent){
   socket.getWorldQuaternion(handWorld);barrelForward.set(0,0,1).applyQuaternion(handWorld);
   const barrelPitch=aimPitch+authored.barrelLift+authored.carryPitch;
   r.root.getWorldQuaternion(parentWorld);desiredForward.set(0,Math.sin(barrelPitch),Math.cos(barrelPitch)).applyQuaternion(parentWorld);
   aimCorrection.setFromUnitVectors(barrelForward.normalize(),desiredForward.normalize());
   firingHand.getWorldQuaternion(handWorld);handWorld.premultiply(aimCorrection);
   firingHand.parent.getWorldQuaternion(parentWorld).invert();
   firingHand.quaternion.copy(parentWorld.multiply(handWorld));
  }
  socket.updateWorldMatrix(true,false);inverse.copy(r.root.matrixWorld).invert();
  socketMatrix.multiplyMatrices(inverse,socket.matrixWorld);socketMatrix.decompose(weapon.position,weapon.quaternion,scale);weapon.scale.setScalar(1);
 };
 const motion=new MarineMotion(r.root,r.assetRoot),actionMotion=new MarineActionMotion(motion),authored=new AuthoredMarineMotion(authoredPlayer,motion);motion.authored=authoredPlayer.available;let aimPitch=0;
 return{root:r.root,body:r.body,limbs:[],height:r.height,weapon,equip,syncWeaponPose,posePortrait(){authoredPlayer.clearUpper();authoredPlayer.snapNext();authoredPlayer.sample('m10-portrait-'+current.id,0,0);syncWeaponPose();},setColliderDebug:colliderDebug(r.root,.5),setAimPitch(radians){aimPitch=T.MathUtils.clamp(radians,-.6,.6);},setRig(rig){motion.rig=rig;identity.setRig(rig);surface.rig(rig==='pyro'?0xffa036:RIG_ACCENTS[rig as keyof typeof RIG_ACCENTS]??RIG_ACCENTS.breacher);},setFlashIntensity:surface.setFlashIntensity,stop:r.stop,muzzleWorld(target){return current.muzzle.getWorldPosition(target);},
  setMotionOptions(strength,reduced){motion.setOptions(strength,reduced);authored.setOptions(strength,reduced);},setAction:motion.setAction.bind(motion),poseDeath:authored.death.bind(authored),hit(strength=1,direction=0,heavy=false){motion.hit(strength,direction,heavy);authored.hit(strength,direction);},setDead(dead){aimConstrained=!dead;motion.setDead(dead);},motionEvent:actionMotion.event.bind(actionMotion),reset(){aimConstrained=true;authored.reset();actionMotion.reset();motion.reset();r.reset();pose?.play();if(pose)pose.paused=true;r.mixer.update(0);},
 animate(time,moving,aim,recoil=0,reload=0,velocity){r.root.rotation.y=Math.PI/2-aim;
  actionMotion.update(time);motion.begin(time,moving,aim,velocity?.x??Math.cos(aim)*moving*220,velocity?.y??Math.sin(aim)*moving*220);
  r.assetRoot.rotation.y=-Math.PI/2+motion.gaitYaw;authoredPlayer.beginBatch();try{if(!authored.update(motion.visualTime,aim,recoil,reload,velocity?.x??Math.cos(aim)*moving*220,velocity?.y??Math.sin(aim)*moving*220,current.id))r.step(motion.visualTime,motion.moving,motion.backwards,motion.speed);}finally{authoredPlayer.endBatch();}
  motion.finish(current.id,recoil,reload,aimPitch);syncWeaponPose();
 }};
}

export {nest,updateNest} from './NestPresentation';


export {pickupModel} from './PickupModels';

/** Retain GPU skinning and freeze the existing pose; no per-death vertex cloning or normal rebuild. */
export function freezeCorpse(model:ActorModel){model.freeze?.();model.root.updateMatrixWorld(true);model.root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial&&!m.userData.k11Original)m.emissiveIntensity=0;}if(o instanceof T.Bone)o.matrixAutoUpdate=false;});}

/** Bake the deformed skin, so thrown bodies keep the exact impact pose. */
export function collapseCorpse(model:ActorModel){
 model.setAffliction?.(NO_AFFLICTION);
 for(const child of [...model.root.children])if(child.userData.afflictionEffect)disposeModel(child);
 model.root.updateMatrixWorld(true);const inverse=model.root.matrixWorld.clone().invert(),baked=new T.Group(),position=new T.Vector3();
 model.root.traverseVisible(object=>{if(object instanceof T.Mesh){
  const geometry=object.geometry.clone();delete geometry.userData.sharedAsset;
  if(object instanceof T.SkinnedMesh){object.skeleton.update();const vertices=geometry.getAttribute('position');for(let i=0;i<vertices.count;i++){object.getVertexPosition(i,position);vertices.setXYZ(i,position.x,position.y,position.z);}geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.deleteAttribute('tangent');geometry.computeVertexNormals();}
  geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));const mesh=new T.Mesh(geometry,object.material);mesh.castShadow=mesh.receiveShadow=true;baked.add(mesh);
 }});
 model.stop?.();model.root.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});for(const child of [...model.root.children])child.removeFromParent();model.root.add(baked);model.body=baked;model.limbs.length=0;
}
