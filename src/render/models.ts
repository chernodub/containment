import * as T from 'three';
import {AnatomicalFrost} from './motion/AnatomicalFrost';
import {EnemyMotion,type EnemyAttackPhase,type EnemyStrikeShape} from './motion/EnemyMotion';
import {MarineMotion} from './motion/MarineMotion';
import {MarineActionMotion} from './motion/MotionEvents';
import type {GameEffect} from '../DepthGame';
import {ENEMY_SPAN} from '../game/combat/enemyContact';
import {ENEMIES} from '../game/enemies/catalog';
import {MAT,shell,rod,box,ring,batch,disposeModel,geometry} from './meshParts';
import {instantiateAsset,type AssetName} from './assets';
import {afflictionEffects,NO_AFFLICTION,type AfflictionStatus} from './afflictions';
import {weaponModel,WEAPON_FIT,WEAPON_APPEARANCE,type GunModel} from './weapons';
import type {WeaponId} from '../game/combat/types';
import {actorSurface} from './vfx/ActorSurface';
import {alienIdentity,marineIdentity,FAMILY_IDENTITY,ENEMY_BODY_COLORS} from './ActorIdentity';
export {MAT,box,ball,rod,disposeModel} from './meshParts';
export type ActorModel={root:T.Group;body:T.Group;limbs:T.Group[];height:number;weapon?:T.Group;
 animate:(time:number,moving:number,aim:number,recoil?:number,reload?:number,velocity?:{x:number;y:number})=>void;
 /** Refresh attached weapon after presentation changes the body pose, before sampling the muzzle. */
 syncWeaponPose?:()=>void;
 setDeathAge?:(seconds:number)=>void;
 setAttackState?:(phase:EnemyAttackPhase,progress:number,lockedAngle:number,shape?:EnemyStrikeShape|null)=>void;
 setRig?:(rig:string)=>void;setAimPitch?:(radians:number)=>void;setStageLight?:(strength:number)=>void;setThreat?:(windupMs:number,pendingAttack:'spit'|'charge'|null,champion?:string,alpha?:number)=>void;equip?:(id:WeaponId)=>void;muzzleWorld?:(target:T.Vector3)=>T.Vector3;
 reset?:()=>void;prepare?:()=>void;setAffliction?:(status:AfflictionStatus)=>void;freeze?:()=>void;attack?:()=>void;hit?:(strength?:number,direction?:number,heavy?:boolean)=>void;setMotionOptions?:(strength:number,reducedMotion:boolean)=>void;setMotionSeed?:(seed:number)=>void;setAction?:(id:string,progress:number)=>void;setDead?:(dead:boolean)=>void;motionEvent?:(event:GameEffect)=>void;setExposed?:(exposed:boolean)=>void;stop?:()=>void;
 dissolve?:(progress:number)=>void;setFlashIntensity?:(value:number)=>void;setColliderDebug?:(visible:boolean,radius?:number)=>void;};
const vec=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const species:Record<string,{asset:AssetName;span:number;height?:number}>={
 crawler:{asset:'dretch',span:ENEMY_SPAN.crawler},stalker:{asset:'basilisk',span:ENEMY_SPAN.stalker},spitter:{asset:'marauder',span:ENEMY_SPAN.spitter},
 carrier:{asset:'dragoon',span:ENEMY_SPAN.carrier},brute:{asset:'tyrant',span:ENEMY_SPAN.brute},queen:{asset:'tyrant',span:ENEMY_SPAN.queen},
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
  const masked=human?new T.AnimationClip(clip.name,clip.duration,clip.tracks.filter(t=>clip.name.endsWith('_delta')?upper.has(t.name.split('.')[0]):!upper.has(t.name.split('.')[0]))):clip;
  existing=mixer.clipAction(masked);actions.set(name,existing);return existing;
 };
 const idle=action('stand')??action('idle');idle?.play();if(human){const pose=action('shotgun_delta');pose?.play();if(pose)pose.paused=true;}mixer.update(0);root.updateMatrixWorld(true);
 let metrics=rigMetrics.get(name);if(!metrics){const bounds=new T.Box3().setFromObject(root,true);metrics={size:bounds.getSize(new T.Vector3()),center:bounds.getCenter(new T.Vector3()),minY:bounds.min.y};rigMetrics.set(name,metrics);}
 const {size,center,minY}=metrics,factor=span/(human?size.y:Math.max(size.x,size.z));
 // A collider is a circle: fitting only the widest axis lets diagonal legs and
 // thoraxes cross a touching neighbor. Preserve height, tighten horizontal stance.
 const radial=Math.hypot(size.x,size.z)*.5*factor;
 const horizontal=collisionRadius===undefined?1:Math.min(1,collisionRadius*.94/radial);
 source.root.scale.set(factor*horizontal,factor,factor*horizontal);body.position.y=-minY*factor;source.root.position.x=-center.x*factor*horizontal;source.root.position.z=-center.z*factor*horizontal;
 root.userData.colliderRadius=collisionRadius;
 const restBones:Array<{bone:T.Bone;position:T.Vector3;quaternion:T.Quaternion;scale:T.Vector3}>=[];
 source.root.traverse(o=>{if(o instanceof T.Bone)restBones.push({bone:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});});
 const height=size.y*factor;let current=idle,previous:number|undefined,attackTime=0,phase=0;
 const switchTo=(next:T.AnimationAction|undefined,oneShot=false)=>{if(!next||next===current&&!oneShot)return;next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);next.setLoop(oneShot?T.LoopOnce:T.LoopRepeat,oneShot?1:Infinity);next.clampWhenFinished=oneShot;if(!oneShot)next.time=next.getClip().duration*phase;next.play();current?.fadeOut(.13);next.fadeIn(.13);current=next;};
 const step=(time:number,moving:number,backwards=false,speed=1)=>{const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;attackTime=Math.max(0,attackTime-dt);if(!attackTime)switchTo(moving>.3?(backwards?action('run_back'):action('run'))??action('walk'):idle);if(current&&moving>.3&&!attackTime)current.setEffectiveTimeScale(speed);mixer.update(dt);};
 return{...source,assetRoot:source.root,root,body,height,span:span*horizontal,mixer,actions,action,step,setPhase(value:number){phase=((value*.61803398875)%1+1)%1;if(current)current.time=current.getClip().duration*phase;},
 brace(){attackTime=0;switchTo(idle);},react(heavy:boolean){const pain=action(heavy?'pain2':'pain1')??action('pain')??action('pain1');if(pain){switchTo(pain,true);attackTime=.24;pain.setEffectiveTimeScale(pain.getClip().duration/.24);}},
 reset(){mixer.stopAllAction();for(const p of restBones){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.quaternion);p.bone.scale.copy(p.scale);}mixer.timeScale=1;previous=undefined;attackTime=0;current=idle;idle?.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();root.position.set(0,0,0);root.rotation.set(0,0,0);body.rotation.set(0,0,0);root.traverse(o=>{if(o instanceof T.Bone)o.matrixAutoUpdate=true;if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});mixer.update(0);},freeze(){mixer.timeScale=0;},attack(){const attack=action('attack');if(attack){switchTo(attack,true);attackTime=attack.getClip().duration;}},stop(){mixer.stopAllAction();mixer.uncacheRoot(source.root);}};
}
export function alien(kind:string,elite=false):ActorModel{
 const def=species[kind]??species.crawler,collisionRadius=(kind==='queen'?92:ENEMIES[kind as keyof typeof ENEMIES]?.radius??14)/32,r=rig(def.asset,def.span,false,collisionRadius);r.root.name=`alien-${kind}`;r.root.userData.graphicActorBase=ENEMY_BODY_COLORS[kind as keyof typeof ENEMY_BODY_COLORS];
 if(kind==='brute'){r.assetRoot.scale.y*=.78;r.body.position.y*=.78;r.height*=.78;}
 if(kind==='queen'){r.assetRoot.scale.y*=1.08;r.body.position.y*=1.08;r.height*=1.08;}
 if(kind==='stalker'){r.assetRoot.scale.z*=.62;r.assetRoot.scale.y*=.72;r.body.position.y*=.72;r.height*=.72;}
 const color=new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler).lerp(new T.Color(0xffffff),.08);const value=kind==='brute'?.62:kind==='carrier'?.75:kind==='spitter'?.70:kind==='stalker'?.40:kind==='queen'?.28:.68;for(const m of r.materials)m.color.multiply(color).multiplyScalar(value);
 const surface=actorSurface(r.materials,false,elite||kind==='queen');surface.identity(kind==='queen'?ENEMY_BODY_COLORS.queen:FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,elite,kind==='queen'?.48:undefined);
 const identity=alienIdentity(r.root,kind,r.span,r.height,elite);
 if(kind==='queen'){const bounds=new T.Box3();r.assetRoot.traverse(o=>{if(o instanceof T.SkinnedMesh){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox!);}});surface.plateBounds(bounds.min.y,bounds.max.y-bounds.min.y,(bounds.min.z+bounds.max.z)/2,bounds.max.z-bounds.min.z,(bounds.min.x+bounds.max.x)/2,(bounds.max.x-bounds.min.x)*.18);}
 let flash=0,previous:number|undefined,exposed=false,dead=false,status:AfflictionStatus=NO_AFFLICTION,windup=0,champion:string|undefined,alpha=1,flinch=0,windupDuration=500,threatKind:'spit'|'charge'|null=null,emergence=0,emissiveHex=-1;
 // Keep the original conservative Brute framing reserve while its physical posture lowers.
 const frameHeight=kind==='brute'?r.height/.78:r.height;
 const restBodyY=r.body.position.y,emergenceDuration=.22,emergenceDepth=Math.min(.28,r.height*.14);
 const motion=new EnemyMotion(r.root,r.body,r.assetRoot,kind),corpseBounds=new T.Box3(),frost=kind==='queen'?undefined:new AnatomicalFrost(r.root,kind);let deathCue:'none'|'frost'|'burn'|'acid'|'arc'='none',terminalDissolve=0;
 const effects=afflictionEffects(r.root,r.span,r.height),setColliderDebug=colliderDebug(r.root,collisionRadius);
 return{root:r.root,body:r.body,limbs:[],get height(){return frameHeight*Math.max(kind==='queen'?1.4:kind==='spitter'?1.55:kind==='carrier'?1.35:kind==='stalker'?1.5:1,champion?1.72:elite?1.28:1);},setColliderDebug,setStageLight(strength){surface.stage(strength);identity.mesh.material.uniforms.identityStageLight.value=T.MathUtils.clamp(strength,0,1);},setDeathAge(age){if(deathCue==='acid'){terminalDissolve=Math.min(1,.10+Math.max(0,age-.04)/1.15);surface.dissolve(terminalDissolve);identity.mesh.material.uniforms.identityDissolve.value=terminalDissolve;}r.root.userData.motionDeathProgress=terminalDissolve;},dissolve(progress){const amount=Math.max(progress,terminalDissolve);surface.dissolve(amount);identity.mesh.material.uniforms.identityDissolve.value=amount;},setFlashIntensity:surface.setFlashIntensity,setMotionOptions:motion.setOptions.bind(motion),setMotionSeed(seed){motion.setSeed(seed);r.setPhase(seed);},setAttackState:motion.setAttackState.bind(motion),attack(){if(!dead&&!status.frozen){motion.attack();r.attack();}},freeze(){if(dead)return;identity.mesh.material.uniforms.identityStatus.value=status.frozen?1:status.burning?2:status.poisoned?3:0;deathCue=status.frozen?'frost':status.burning?'burn':status.poisoned?'acid':status.shocked?'arc':'none';surface.death(deathCue);if(deathCue==='frost')frost?.use();r.root.userData.motionDeathCue=deathCue;dead=true;motion.freeze(true);emergence=emergenceDuration;r.root.updateWorldMatrix(true,true);corpseBounds.setFromObject(r.root,true);if(corpseBounds.min.y<r.root.position.y)r.body.position.y+=r.root.position.y-corpseBounds.min.y;status=NO_AFFLICTION;effects?.reset();surface.hit(0);identity.update(0,0,champion,false,1,true);r.freeze();},stop:r.stop,prepare(){r.action('run');r.action('attack');r.action('pain1');r.action('pain2');r.action('pain');},reset(){frost?.reset();deathCue='none';terminalDissolve=0;r.root.userData.motionDeathProgress=0;motion.reset();r.reset();r.root.userData.visualStatus=undefined;r.root.userData.motionDeathCue='none';surface.reset();surface.identity(kind==='queen'?ENEMY_BODY_COLORS.queen:FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,elite,kind==='queen'?.48:undefined);identity.reset();identity.mesh.castShadow=identity.mesh.receiveShadow=false;windup=0;windupDuration=500;threatKind=null;champion=undefined;alpha=1;flinch=0;emergence=0;r.body.position.y=restBodyY;flash=0;previous=undefined;exposed=dead=false;status=NO_AFFLICTION;effects?.reset();setColliderDebug(false);for(const m of r.materials)m.emissiveIntensity=0;},hit(strength=1,direction=0,heavy=false){flash=Math.max(0,Math.min(1,strength));flinch=flash;motion.hit(strength,direction,heavy);if(strength>0&&!dead&&!status.frozen&&windup===0)r.react(heavy);},setThreat(ms,attack,rank,camouflage=1){if(threatKind&&!attack&&windup>0&&!status.frozen)motion.attack();const remaining=attack?Math.max(0,ms):0;if(attack&&(attack!==threatKind||remaining>windup)){windupDuration=Math.max(1,remaining);r.brace();}threatKind=attack;windup=remaining;if(champion!==rank)surface.identity(rank==='matron'?0xff70b8:rank==='warden'?0xffbd65:FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,!!rank||elite,kind==='queen'?.48:undefined);champion=rank;alpha=camouflage;surface.camouflage(kind==='stalker'?alpha:1);},setExposed(v){exposed=v;},setAffliction(v){
  if(dead)return;status=v;identity.mesh.material.uniforms.identityStatus.value=v.frozen||v.chilled?1:v.burning?2:v.poisoned?3:0;
  effects?.set(v);r.mixer.timeScale=v.frozen?0:1;if(v.frozen){emergence=emergenceDuration;r.body.position.y=restBodyY;r.body.rotation.x=0;}
 },
 animate(time,moving,aim,_recoil=0,_reload=0,velocity){const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;flash=Math.max(0,flash-dt*9);surface.hit(flash);if(!status.frozen&&!dead)r.root.rotation.y=Math.PI/2-aim;
  if(!dead){const visualTime=motion.begin(time,!!status.frozen);if(!status.frozen)r.step(visualTime,windup>0?0:moving,false,motion.rate*(velocity?T.MathUtils.clamp(Math.hypot(velocity.x,velocity.y)/(ENEMIES[kind as keyof typeof ENEMIES]?.speed??150),0,2):1));motion.apply(time,aim,moving,windup>0?1-Math.min(1,windup/windupDuration):0,windup>0,!!status.frozen,status.burning,!!status.shocked);}
  if(kind==='queen')surface.expose(identity.mesh.material.uniforms.identityOpening.value);identity.update(time,windup>0?1-Math.min(1,windup/windupDuration):0,champion,exposed,kind==='stalker'?alpha:1,dead);effects?.animate(time);const hex=status.frozen?0x79ddff:exposed?0xff4aa5:0xffdfb0,intensity=flash*.1+(status.frozen?.018:exposed?.025:0);for(const m of r.materials){if(hex!==emissiveHex)m.emissive.setHex(hex);m.emissiveIntensity=intensity;}emissiveHex=hex;}};
}
export function marine():ActorModel{
 // The marine's weighted torso already fits its .5m collider. Retain a rigid,
 // uniform source transform so authored hand sockets never inherit shear.
 const r=rig('marine',2.05,true),weapon=new T.Group();r.root.name='marine';r.root.userData.colliderRadius=.5;r.root.add(weapon);
 const surface=actorSurface(r.materials,true),identity=marineIdentity(r.root);
 const guns=new Map<WeaponId,GunModel>();let current:GunModel;const socket=r.assetRoot.getObjectByName('tag_weapon')!;let pose=r.action('shotgun_delta');
 const equip=(id:WeaponId)=>{if(current?.id===id)return;let gun=guns.get(id);if(!gun){gun=weaponModel(id);guns.set(id,gun);weapon.add(gun.root);}for(const g of guns.values())g.root.visible=g===gun;current=gun;pose?.stop();pose=r.action(`${({pistol:'blaster',plasma:'prifle',rocket:'lcannon'} as Partial<Record<WeaponId,string>>)[id]??id}_delta`);if(pose){pose.play();pose.paused=true;}};equip('shotgun');
 const inverse=new T.Matrix4(),socketMatrix=new T.Matrix4(),scale=new T.Vector3();
 const syncWeaponPose=()=>{
  socket.updateWorldMatrix(true,false);inverse.copy(r.root.matrixWorld).invert();
  socketMatrix.multiplyMatrices(inverse,socket.matrixWorld);socketMatrix.decompose(weapon.position,weapon.quaternion,scale);weapon.scale.setScalar(1);
 };
 const motion=new MarineMotion(r.root,r.assetRoot),actionMotion=new MarineActionMotion(motion);let aimPitch=0;
 return{root:r.root,body:r.body,limbs:[],height:r.height,weapon,equip,syncWeaponPose,setColliderDebug:colliderDebug(r.root,.5),setAimPitch(radians){aimPitch=T.MathUtils.clamp(radians,-.6,.6);},setRig:identity.setRig,setFlashIntensity:surface.setFlashIntensity,stop:r.stop,muzzleWorld(target){return current.muzzle.getWorldPosition(target);},
  setMotionOptions:motion.setOptions.bind(motion),setAction:motion.setAction.bind(motion),hit:motion.hit.bind(motion),setDead:motion.setDead.bind(motion),motionEvent:actionMotion.event.bind(actionMotion),reset(){actionMotion.reset();motion.reset();r.reset();pose?.play();if(pose)pose.paused=true;r.mixer.update(0);},
 animate(time,moving,aim,recoil=0,reload=0,velocity){r.root.rotation.y=Math.PI/2-aim;
  actionMotion.update(time);motion.begin(time,moving,aim,velocity?.x??Math.cos(aim)*moving*220,velocity?.y??Math.sin(aim)*moving*220);
  r.assetRoot.rotation.y=-Math.PI/2+motion.gaitYaw;r.step(motion.visualTime,motion.moving,motion.backwards,motion.speed);
  motion.finish(current.id,recoil,reload,aimPitch);syncWeaponPose();
 }};
}

export {nest,updateNest} from './NestPresentation';


export {pickupModel} from './PickupModels';

/** Retain GPU skinning and freeze the existing pose; no per-death vertex cloning or normal rebuild. */
export function freezeCorpse(model:ActorModel){model.freeze?.();model.root.updateMatrixWorld(true);model.root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial)m.emissiveIntensity=0;}if(o instanceof T.Bone)o.matrixAutoUpdate=false;});}

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
