import * as T from 'three';
import {ENEMY_SPAN} from '../game/combat/enemyContact';
import {MAT,shell,rod,box,ring,batch,disposeModel} from './meshParts';
import {instantiateAsset,type AssetName} from './assets';
import {afflictionEffects,NO_AFFLICTION,type AfflictionStatus} from './afflictions';
import {weaponModel,WEAPON_FIT,WEAPON_APPEARANCE,type GunModel} from './weapons';
import type {WeaponId} from '../game/combat/types';
import {actorSurface} from './vfx/ActorSurface';
import {alienIdentity,marineIdentity,FAMILY_IDENTITY} from './ActorIdentity';
export {MAT,box,ball,rod,disposeModel} from './meshParts';
export type ActorModel={root:T.Group;body:T.Group;limbs:T.Group[];height:number;weapon?:T.Group;
 animate:(time:number,moving:number,aim:number,recoil?:number,reload?:number,velocity?:{x:number;y:number})=>void;
 /** Refresh attached weapon after presentation changes the body pose, before sampling the muzzle. */
 syncWeaponPose?:()=>void;
 setRig?:(rig:string)=>void;setThreat?:(windupMs:number,pendingAttack:'spit'|'charge'|null,champion?:string,alpha?:number)=>void;equip?:(id:WeaponId)=>void;muzzleWorld?:(target:T.Vector3)=>T.Vector3;
 reset?:()=>void;prepare?:()=>void;setAffliction?:(status:AfflictionStatus)=>void;freeze?:()=>void;attack?:()=>void;hit?:(strength?:number)=>void;setExposed?:(exposed:boolean)=>void;stop?:()=>void;
 dissolve?:(progress:number)=>void;setFlashIntensity?:(value:number)=>void;};
const vec=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const species:Record<string,{asset:AssetName;span:number;height?:number}>={
 crawler:{asset:'dretch',span:ENEMY_SPAN.crawler},stalker:{asset:'basilisk',span:ENEMY_SPAN.stalker},spitter:{asset:'marauder',span:ENEMY_SPAN.spitter},
 carrier:{asset:'dragoon',span:ENEMY_SPAN.carrier},brute:{asset:'tyrant',span:ENEMY_SPAN.brute},queen:{asset:'tyrant',span:ENEMY_SPAN.queen},
};
const rigMetrics=new Map<string,{size:T.Vector3;center:T.Vector3;minY:number}>();
function rig(name:AssetName,span:number,human=false){
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
 source.root.scale.multiplyScalar(factor);body.position.y=-minY*factor;source.root.position.x=-center.x*factor;source.root.position.z=-center.z*factor;
 const restBones:Array<{bone:T.Bone;position:T.Vector3;quaternion:T.Quaternion;scale:T.Vector3}>=[];
 source.root.traverse(o=>{if(o instanceof T.Bone)restBones.push({bone:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});});
 const height=size.y*factor;let current=idle,previous:number|undefined,attackTime=0;
 const switchTo=(next:T.AnimationAction|undefined,oneShot=false)=>{if(!next||next===current&&!oneShot)return;next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1);next.setLoop(oneShot?T.LoopOnce:T.LoopRepeat,oneShot?1:Infinity);next.clampWhenFinished=oneShot;next.play();current?.fadeOut(.13);next.fadeIn(.13);current=next;};
 const step=(time:number,moving:number,backwards=false,speed=1)=>{const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;attackTime=Math.max(0,attackTime-dt);if(!attackTime)switchTo(moving>.3?(backwards?action('run_back'):action('run'))??action('walk'):idle);if(current&&moving>.3)current.setEffectiveTimeScale(speed);mixer.update(dt);};
 return{...source,assetRoot:source.root,root,body,height,mixer,actions,action,step,
 reset(){mixer.stopAllAction();for(const p of restBones){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.quaternion);p.bone.scale.copy(p.scale);}mixer.timeScale=1;previous=undefined;attackTime=0;current=idle;idle?.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();root.position.set(0,0,0);root.rotation.set(0,0,0);body.rotation.set(0,0,0);root.traverse(o=>{if(o instanceof T.Bone)o.matrixAutoUpdate=true;if(o instanceof T.Mesh)o.castShadow=o.receiveShadow=true;});mixer.update(0);},freeze(){mixer.timeScale=0;},attack(){const attack=action('attack');if(attack){switchTo(attack,true);attackTime=attack.getClip().duration;}},stop(){mixer.stopAllAction();mixer.uncacheRoot(source.root);}};
}
export function alien(kind:string,elite=false):ActorModel{
 const def=species[kind]??species.crawler,r=rig(def.asset,def.span*(elite?1.12:1));r.root.name=`alien-${kind}`;
 const color=new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler).lerp(new T.Color(0xffffff),kind==='brute'?.72:.25);const value=kind==='brute'?1.9:kind==='carrier'?1.35:kind==='spitter'?1.3:kind==='stalker'?.48:kind==='queen'?.46:.9;for(const m of r.materials)m.color.multiply(color).multiplyScalar(value);
 const surface=actorSurface(r.materials,false,elite||kind==='queen');surface.identity(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,elite);
 const identity=alienIdentity(r.root,kind,def.span*(elite?1.12:1),r.height,elite);
 if(kind==='queen'){const bounds=new T.Box3();r.assetRoot.traverse(o=>{if(o instanceof T.SkinnedMesh){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox!);}});surface.plateBounds(bounds.min.y,bounds.max.y-bounds.min.y,(bounds.min.z+bounds.max.z)/2,bounds.max.z-bounds.min.z,(bounds.min.x+bounds.max.x)/2,(bounds.max.x-bounds.min.x)*.18);}
 let flash=0,previous:number|undefined,exposed=false,dead=false,status:AfflictionStatus=NO_AFFLICTION,windup=0,champion:string|undefined,alpha=1,flinch=0,windupDuration=500,emergence=0,emissiveHex=-1;
 const restBodyY=r.body.position.y,emergenceDuration=.22,emergenceDepth=Math.min(.28,r.height*.14);
 const effects=afflictionEffects(r.root,def.span*(elite?1.12:1),r.height);
 return{root:r.root,body:r.body,limbs:[],height:r.height,dissolve:surface.dissolve,setFlashIntensity:surface.setFlashIntensity,attack(){if(!dead&&!status.frozen)r.attack();},freeze(){surface.death(status.frozen?'frost':status.burning?'burn':status.poisoned?'acid':'none');dead=true;emergence=emergenceDuration;r.body.position.y=restBodyY;r.body.rotation.x=0;status=NO_AFFLICTION;effects?.reset();surface.hit(0);identity.update(0,0,champion,false,1,true);r.freeze();},stop:r.stop,prepare(){r.action('run');r.action('attack');},reset(){r.reset();surface.reset();surface.identity(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,elite);identity.reset();identity.mesh.castShadow=identity.mesh.receiveShadow=false;windup=0;champion=undefined;alpha=1;flinch=0;emergence=0;r.body.position.y=restBodyY;flash=0;previous=undefined;exposed=dead=false;status=NO_AFFLICTION;effects?.reset();for(const m of r.materials)m.emissiveIntensity=0;},hit(strength=1){flash=Math.max(0,Math.min(1,strength));flinch=flash;},setThreat(ms,attack,rank,camouflage=1){windup=attack?Math.max(0,ms):0;windupDuration=attack==='charge'?850:500;if(champion!==rank)surface.identity(rank==='matron'?0xff70b8:rank==='warden'?0xffbd65:FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler,!!rank||elite);champion=rank;alpha=camouflage;surface.camouflage(kind==='stalker'?alpha:1);},setExposed(v){exposed=v;},setAffliction(v){
  if(dead)return;status=v;
  effects?.set(v);r.mixer.timeScale=v.frozen?0:1;if(v.frozen){emergence=emergenceDuration;r.body.position.y=restBodyY;r.body.rotation.x=0;}
 },
 animate(time,moving,aim){const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;flash=Math.max(0,flash-dt*9);surface.hit(flash);r.root.rotation.y=Math.PI/2-aim;r.step(time,windup>0?0:moving);if(!dead&&!status.frozen){emergence=Math.min(emergenceDuration,emergence+dt);const rise=1-Math.pow(1-emergence/emergenceDuration,3);flinch=Math.max(0,flinch-dt*8);r.body.rotation.x=-flinch*.075+(windup>0?Math.min(1,windup/350)*.055:0)-(1-rise)*.045;r.body.position.y=restBodyY-emergenceDepth*(1-rise)-flinch*.035;}if(kind==='queen')surface.expose(identity.mesh.material.uniforms.identityOpening.value);identity.update(time,windup>0?1-Math.min(1,windup/windupDuration):0,champion,exposed,kind==='stalker'?alpha:1,dead);effects?.animate(time);const hex=status.frozen?0x79ddff:exposed?0xff4aa5:0xffdfb0,intensity=flash*.1+(status.frozen?.12:exposed?.025:0);for(const m of r.materials){if(hex!==emissiveHex)m.emissive.setHex(hex);m.emissiveIntensity=intensity;}emissiveHex=hex;}};
}
export function marine():ActorModel{
 const r=rig('marine',2.05,true),weapon=new T.Group();r.root.name='marine';r.root.add(weapon);
 const surface=actorSurface(r.materials,true),identity=marineIdentity(r.root);
 const guns=new Map<WeaponId,GunModel>();let current:GunModel;const socket=r.assetRoot.getObjectByName('tag_weapon')!;let pose=r.action('shotgun_delta');
 const equip=(id:WeaponId)=>{if(current?.id===id)return;let gun=guns.get(id);if(!gun){gun=weaponModel(id);guns.set(id,gun);weapon.add(gun.root);}for(const g of guns.values())g.root.visible=g===gun;current=gun;pose?.stop();pose=r.action(`${({pistol:'blaster',plasma:'prifle',rocket:'lcannon'} as Partial<Record<WeaponId,string>>)[id]??id}_delta`);if(pose){pose.play();pose.paused=true;}};equip('shotgun');
 const inverse=new T.Matrix4(),socketMatrix=new T.Matrix4(),scale=new T.Vector3();
 const syncWeaponPose=()=>{socket.updateWorldMatrix(true,false);inverse.copy(r.root.matrixWorld).invert();socketMatrix.multiplyMatrices(inverse,socket.matrixWorld);socketMatrix.decompose(weapon.position,weapon.quaternion,scale);weapon.scale.setScalar(1);};
 const spine=r.assetRoot.getObjectByName('spine')!,parentQ=new T.Quaternion(),compensation=new T.Quaternion(),rotation=new T.Quaternion(),up=new T.Vector3(0,1,0),baseSpine=spine.quaternion.clone(),ribs=r.assetRoot.getObjectByName('ribs')!,baseRibs=ribs.quaternion.clone(),armAxis=new T.Vector3();let gaitYaw=0,backwards=false,previous:number|undefined;
 return{root:r.root,body:r.body,limbs:[],height:r.height,weapon,equip,syncWeaponPose,setRig:identity.setRig,setFlashIntensity:surface.setFlashIntensity,stop:r.stop,muzzleWorld(target){return current.muzzle.getWorldPosition(target);},
 animate(time,moving,aim,recoil=0,reload=0,velocity){r.root.rotation.y=Math.PI/2-aim;
  const dt=previous===undefined?1/60:Math.max(0,Math.min(.05,time-previous));previous=time;
  const vx=velocity?.x??Math.cos(aim)*moving*220,vy=velocity?.y??Math.sin(aim)*moving*220,travel=Math.hypot(vx,vy),direction=Math.atan2(vy,vx),forward=Math.cos(direction-aim);if(travel>3){if(forward<-.22)backwards=true;else if(forward>.02)backwards=false;}
  const desired=travel>3?Math.atan2(Math.sin(aim-direction-(backwards?Math.PI:0)),Math.cos(aim-direction-(backwards?Math.PI:0))):0;
  gaitYaw+=Math.atan2(Math.sin(desired-gaitYaw),Math.cos(desired-gaitYaw))*(1-Math.exp(-dt*16));
  spine.quaternion.copy(baseSpine);ribs.quaternion.copy(baseRibs);r.assetRoot.rotation.y=-Math.PI/2+gaitYaw;r.step(time,moving,backwards,T.MathUtils.clamp(travel/220,.35,1.5));
  baseSpine.copy(spine.quaternion);spine.parent!.getWorldQuaternion(parentQ);compensation.copy(parentQ).invert().multiply(rotation.setFromAxisAngle(up,-gaitYaw-T.MathUtils.degToRad(WEAPON_FIT[current.id].aimYaw))).multiply(parentQ);spine.quaternion.premultiply(compensation);

  const pose=reload>0?Math.sin(Math.PI*reload):0;
  baseRibs.copy(ribs.quaternion);ribs.parent!.getWorldQuaternion(parentQ);armAxis.set(-Math.sin(aim),0,Math.cos(aim));compensation.copy(parentQ).invert().multiply(rotation.setFromAxisAngle(armAxis,pose*.18-recoil*.035)).multiply(parentQ);ribs.quaternion.premultiply(compensation);
  syncWeaponPose();
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
  if(object instanceof T.SkinnedMesh){object.skeleton.update();const vertices=geometry.getAttribute('position');for(let i=0;i<vertices.count;i++){position.fromBufferAttribute(vertices,i);object.applyBoneTransform(i,position);vertices.setXYZ(i,position.x,position.y,position.z);}geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.deleteAttribute('tangent');geometry.computeVertexNormals();}
  geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));const mesh=new T.Mesh(geometry,object.material);mesh.castShadow=mesh.receiveShadow=true;baked.add(mesh);
 }});
 model.stop?.();model.root.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});for(const child of [...model.root.children])child.removeFromParent();model.root.add(baked);model.body=baked;model.limbs.length=0;
}
