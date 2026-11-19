import {identityRoleVisible} from './ActorIdentity';
import {isAnatomicalBone} from './motion/AnatomicalFrost';
import {getStaticColliderParts} from './StaticColliderParts';
import RAPIER from '@dimforge/rapier3d-compat';
import * as T from 'three';
import type {ActorModel} from './models';
import type {RoomTemplate} from '../game/roguelike/types';

let ready=false,initializing:Promise<void>|undefined;
export function initDeathPhysics(){return initializing??=RAPIER.init().then(()=>{ready=true;});}
const GROUPS=0x00020001,STATIC_GROUPS=0x00010002,STEP=1/120;
export const RAGDOLL_BUDGET={high:6,low:3} as const;
const BODY_BUDGET={high:100,low:50} as const;
/** Presentation bounds include solver-generated energy as well as the initial shot impulse. */
export const RAGDOLL_MAX_SPEED=8,RAGDOLL_MAX_SPIN=12;
/** Read only by presentation; supplied from the last living status snapshot. */
export type DeathCue='none'|'frost'|'burn'|'arc'|'acid';
const DEATH_POSTURE:Record<string,{lift:number;torque:number}>={
 marine:{lift:.35,torque:.16},crawler:{lift:1.2,torque:.10},stalker:{lift:.72,torque:.13},
 spitter:{lift:.95,torque:.08},carrier:{lift:.65,torque:.06},
 brute:{lift:.75,torque:.07},queen:{lift:.45,torque:.05},
};
// Authored deformation bones only. IK controls, fingers, antennae and small face
// bones remain attached to their nearest simulated ancestor. At most 19 bodies.
/** Fit every positive skin influence, not only the dominant bone or a segment.
 * Each unblended influence follows its nearest simulated ancestor rigidly.
 * Their weighted sum therefore stays above a plane if these boxes do.
 * Bounds are measured once in the captured bone orientation, in world units.
 */
function fitSkin(root:T.Object3D,bones:T.Bone[]){
 const fits=new Map(bones.map(b=>[b,{bounds:new T.Box3(),origin:b.getWorldPosition(new T.Vector3()),inverseRotation:b.getWorldQuaternion(new T.Quaternion()).normalize().invert()}]));
 root.traverse(o=>{
  if(o instanceof T.Mesh&&!(o instanceof T.SkinnedMesh)&&(o.name==='brute-identity'||o.name==='stalker-identity')){
   // Authored rigid anatomy follows its nearest simulated torso just like a
   // weighted plate. Fit visible corpse pieces so broad shields/blades cannot
   // penetrate the deck while their source skin remains correctly supported.
   let owner:T.Object3D|null=o.parent;while(owner&&!fits.has(owner as T.Bone))owner=owner.parent;
   const fit=owner?fits.get(owner as T.Bone):undefined;
   if(fit){const point=new T.Vector3(),positions=o.geometry.getAttribute('position');for(let i=0;i<positions.count;i++){o.getVertexPosition(i,point).applyMatrix4(o.matrixWorld).sub(fit.origin).applyQuaternion(fit.inverseRotation);fit.bounds.expandByPoint(point);}}
   return;
  }
  // Keep the Carrier's validated source proxies: its broad brood armor is
  // visual support, and retirement still recovers the complete rendered bounds.
  if(o.name==='carrier-identity')return;
  if(!(o instanceof T.SkinnedMesh))return;
  const positions=o.geometry.getAttribute('position'),indices=o.geometry.getAttribute('skinIndex'),weights=o.geometry.getAttribute('skinWeight');
  if(!positions||!indices||!weights)return;
  const owners=o.skeleton.bones.map(b=>{let ancestor:T.Object3D|null=b;while(ancestor&&!fits.has(ancestor as T.Bone))ancestor=ancestor.parent;return ancestor?fits.get(ancestor as T.Bone):undefined;});
  const transforms=o.skeleton.bones.map((b,i)=>new T.Matrix4().multiplyMatrices(o.matrixWorld,o.bindMatrixInverse).multiply(b.matrixWorld).multiply(o.skeleton.boneInverses[i]).multiply(o.bindMatrix));
  const point=new T.Vector3(),source=new T.Vector3(),roles=o.geometry.getAttribute('identityRole');
  const anatomy=o.material instanceof T.ShaderMaterial?o.material.uniforms:undefined;
  for(let i=0;i<positions.count;i++){
   if(roles&&anatomy&&!identityRoleVisible(roles.getX(i),anatomy.identityElite.value,anatomy.identityChampion.value,anatomy.identityOpening.value,anatomy.identityDeath.value>.5))continue;
   source.fromBufferAttribute(positions,i);
   for(let slot=0;slot<4;slot++){
    if(weights.getComponent(i,slot)<=0)continue;
    const index=indices.getComponent(i,slot),fit=owners[index];if(!fit)continue;
    point.copy(source).applyMatrix4(transforms[index]).sub(fit.origin).applyQuaternion(fit.inverseRotation);
    fit.bounds.expandByPoint(point);
   }
  }
 });
 return fits;
}
type BonePose={bone:T.Bone;position:T.Vector3;rotation:T.Quaternion;scale:T.Vector3;auto:boolean};
type Part={bone:T.Bone;body:RAPIER.RigidBody;bindLinear:T.Matrix4;localAnchor?:T.Vector3};
type PoseNode={node:T.Object3D;part:Part|undefined};
type RagdollRecord={skinFloorCheckAt?:number;model:ActorModel;cue:DeathCue;terminalTime:number;terminalPulse:number;parts:Part[];hierarchy:PoseNode[];joints:RAPIER.ImpulseJoint[];poses:BonePose[];age:number;holdTicks:number;settled:boolean;falling:boolean;fallSpeed:number;support:T.Vector3;supportLift:number;rootPosition:T.Vector3;anchor:T.Vector3};
type AuthoredDeath={id:number;model:ActorModel;family:string;velocity:{x:number;z:number};cue:DeathCue;hold:number;age:number;duration:number;poses:BonePose[];rootPosition:T.Vector3;anchor:T.Vector3};
type Room=Pick<RoomTemplate,'width'|'height'|'obstacles'|'boundary'|'voids'>;

/** Presentation-only world. Never fed back into combat, navigation or mutation state. */
export class DeathRagdolls {
 private world:RAPIER.World|undefined;
 private records=new Map<number,RagdollRecord>();
 private authored=new Map<number,AuthoredDeath>();
 private tier:'high'|'low'='high';private accumulator=0;
 private q=new T.Quaternion();private inverse=new T.Matrix4();private rigidWorld=new T.Matrix4();
 private elapsedMs=0;private steps=0;private overflow=0;
 private physicsVelocity={x:0,y:0,z:0};
 private skinFloorBounds=new T.Box3();
 setQuality(tier:'high'|'low'){
  this.tier=tier;
  const active=[...this.records.values()].filter(r=>!r.settled);
  let bodies=active.reduce((count,r)=>count+r.parts.length,0);
  while(active.length&&(active.length+this.authored.size>RAGDOLL_BUDGET[tier]||bodies>BODY_BUDGET[tier])){
   const record=active.shift()!;
   bodies-=record.parts.length;
   this.retire(record);
  }
  while(this.authored.size>RAGDOLL_BUDGET[tier])this.remove(this.authored.keys().next().value!);
 }
 private statics:RAPIER.Collider[]=[];
 private fallLimit=-32;
 private supportRay=new RAPIER.Ray({x:0,y:0,z:0},{x:0,y:-1,z:0});
 private collisionMaterial=new T.MeshBasicMaterial({side:T.DoubleSide});
 setRoom(room:Room,world?:T.Object3D){
  this.dispose();if(!ready)return;
  this.world=new RAPIER.World({x:0,y:-9.81,z:0});this.world.integrationParameters.numSolverIterations=12;
  this.accumulator=0;this.elapsedMs=0;this.steps=0;this.overflow=0;
  if(world){this.refreshStatic(world);return;}
  // Compatibility proxy only. Without rendered geometry furniture heights are
  // unknown, so do not fabricate them. Polygon voids remain floor holes.
  const group=new T.Group(),boundary=room.boundary??[{x:0,y:0},{x:room.width,y:0},{x:room.width,y:room.height},{x:0,y:room.height}];
  const shape=new T.Shape(boundary.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  for(const hole of room.voids??[])shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p.x/32,-p.y/32))));
  const floor=new T.Mesh(new T.ShapeGeometry(shape),this.collisionMaterial);floor.rotation.x=-Math.PI/2;group.add(floor);
  for(let i=0;i<boundary.length;i++){
   const a=boundary[i],b=boundary[(i+1)%boundary.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32;
   const mesh=new T.Mesh(new T.BoxGeometry(Math.hypot(dx,dz),3,.24),this.collisionMaterial);
   mesh.position.set((a.x+b.x)/64,1.5,(a.y+b.y)/64);mesh.rotation.y=-Math.atan2(dz,dx);group.add(mesh);
  }
  this.refreshStatic(group);group.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});
 }
 /** Replace static triangles only. Existing ragdolls and their poses survive. */
 refreshStatic(world:T.Object3D){
  if(!this.world)return;
  for(const c of this.statics)this.world.removeCollider(c,false);this.statics=[];
  this.fallLimit=-32;world.updateWorldMatrix(true,true);const partMatrix=new T.Matrix4();
  world.traverseVisible(o=>{
   if(!(o instanceof T.Mesh)||o instanceof T.SkinnedMesh||o.userData.ragdollCollision===false)return;
   const materials=Array.isArray(o.material)?o.material:[o.material];
   if(materials.every(m=>!m.visible||(m.transparent&&m.opacity<.5)))return;
   const add=(geometry:T.BufferGeometry,matrix:T.Matrix4)=>{
    let g=geometry.clone().applyMatrix4(matrix);g.computeBoundingBox();
    this.fallLimit=Math.min(this.fallLimit,g.boundingBox!.min.y-32);
    const size=g.boundingBox!.getSize(new T.Vector3());
    // Dense standalone equipment gets a fitted finite-height proxy. Broad deck
    // meshes keep triangles so authored concave cutouts remain open.
    if((g.index?.count??g.getAttribute('position')?.count??0)>12288&&size.x<8&&size.z<8&&size.y>.15){
     const center=g.boundingBox!.getCenter(new T.Vector3());g.dispose();g=new T.BoxGeometry(size.x,size.y,size.z).translate(center.x,center.y,center.z);
    }
    const pos=g.getAttribute('position');if(!pos){g.dispose();return;}
    const vertices=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){vertices[i*3]=pos.getX(i);vertices[i*3+1]=pos.getY(i);vertices[i*3+2]=pos.getZ(i);}
    const index=g.index?new Uint32Array(g.index.array):Uint32Array.from({length:pos.count},(_,i)=>i);
    if(index.length<3){g.dispose();return;}
    this.statics.push(this.world!.createCollider(RAPIER.ColliderDesc.trimesh(vertices,index).setCollisionGroups(STATIC_GROUPS).setFriction(.8)));
    g.dispose();
   };
   const parts=getStaticColliderParts(o);
   if(parts){for(const part of parts)add(part.geometry,partMatrix.multiplyMatrices(o.matrixWorld,part.matrix));}
   else if(o instanceof T.InstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,partMatrix);add(o.geometry,partMatrix.premultiply(o.matrixWorld));}}else add(o.geometry,o.matrixWorld);
  });
  // Rapier 0.20 scene queries share the simulation broad phase. Publish changed
  // statics with a zero-duration step, without advancing existing bodies.
  const timestep=this.world.timestep;this.world.timestep=0;this.world.step();this.world.timestep=timestep;
  for(const r of this.records.values())if(r.settled){r.falling=true;r.fallSpeed=0;}
 }
 add(id:number,model:ActorModel,family:string,velocity:{x:number;z:number},cue:DeathCue=model.root.userData.motionDeathCue??'none',holdSeconds=0,skipAuthored=false){
  if(!this.world||this.records.has(id)||this.authored.has(id))return false;
  if(this.snapshot().active>=RAGDOLL_BUDGET[this.tier]){this.overflow++;return false;}
  if(!skipAuthored&&model.poseDeath){
    const poses:BonePose[]=[];model.root.traverse(node=>{if(node instanceof T.Bone){poses.push({bone:node,position:node.position.clone(),rotation:node.quaternion.clone(),scale:node.scale.clone(),auto:node.matrixAutoUpdate});node.matrixAutoUpdate=true;}});
    const duration=model.poseDeath(cue,0);
    if(duration>0){this.authored.set(id,{id,model,family,velocity,cue,hold:holdSeconds,age:0,duration,poses,rootPosition:model.root.position.clone(),anchor:model.root.position.clone()});return true;}
    for(const pose of poses)pose.bone.matrixAutoUpdate=pose.auto;
  }

  model.root.updateMatrixWorld(true);
  const poses:BonePose[]=[],bones:T.Bone[]=[];let originalCreature=false;
  model.root.traverse(o=>{if(o instanceof T.SkinnedMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(material=>material.userData.k11Original))originalCreature=true;if(o instanceof T.Bone){poses.push({bone:o,position:o.position.clone(),rotation:o.quaternion.clone(),scale:o.scale.clone(),auto:o.matrixAutoUpdate});if(isAnatomicalBone(o.name,family))bones.push(o);}});
  if(bones.length<3||bones.length>20)return false;
  let bodies=0;
  for(const record of this.records.values())bodies+=record.parts.length;
  if(bodies+bones.length>BODY_BUDGET[this.tier]){this.overflow++;return false;}
  model.freeze?.();
  const parts:Part[]=[],joints:RAPIER.ImpulseJoint[]=[],mass=family==='brute'?3.5:family==='carrier'?1.8:1;
  const posture=DEATH_POSTURE[family]??DEATH_POSTURE.crawler;
  const lift=skipAuthored?0:cue==='frost'?.55:cue==='burn'?.08:cue==='acid'?.04:cue==='arc'?.45:posture.lift;
  // Attenuate before capping: native shotgun (12.75) and rocket (33.75)
  // previously both saturated at 12, erasing weapon strength. Preserve direction
  // and family weight while bounding even extreme presentation-only impulses.
  const vertical=lift/Math.sqrt(mass),horizontalLimit=Math.sqrt(RAGDOLL_MAX_SPEED*RAGDOLL_MAX_SPEED-vertical*vertical);
  const speed=Math.hypot(velocity.x,velocity.z),scale=Math.min(.25,horizontalLimit/Math.max(speed,.001))/mass,fits=fitSkin(model.root,bones);
  for(const bone of bones){
   const position=bone.getWorldPosition(new T.Vector3()),rotation=bone.getWorldQuaternion(new T.Quaternion()).normalize();
   const bindLinear=bone.matrixWorld.clone().setPosition(0,0,0);bone.matrixAutoUpdate=false;
   const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x,position.y,position.z).setRotation({x:0,y:0,z:0,w:1}).setAdditionalSolverIterations(16).setCanSleep(true).setCcdEnabled(true).setLinearDamping(skipAuthored?3.2:.6).setAngularDamping(skipAuthored?4:cue==='arc'?3.2:cue==='frost'?3:1.8));
   const bounds=fits.get(bone)!.bounds;
   // Bone-only fixtures and unweighted controls still need finite inertia.
   if(bounds.isEmpty())bounds.setFromCenterAndSize(new T.Vector3(),new T.Vector3(.1,.1,.1));
   const half=bounds.getSize(new T.Vector3()).multiplyScalar(.5).addScalar(family==='stalker'?.010:.003),center=bounds.getCenter(new T.Vector3()).applyQuaternion(rotation);
   const desc=RAPIER.ColliderDesc.cuboid(half.x,half.y,half.z).setTranslation(center.x,center.y,center.z).setRotation(rotation).setMass(mass*(parts.length===0?3:1)).setCollisionGroups(GROUPS).setFriction(.8).setRestitution(.08);
   this.world.createCollider(desc,body);
   const scatter=cue==='frost'?.9:0,scatterAngle=Math.atan2(position.z-model.root.position.z,position.x-model.root.position.x);
   const launchX=velocity.x*scale+Math.cos(scatterAngle)*scatter,launchZ=velocity.z*scale+Math.sin(scatterAngle)*scatter;
   const launchScale=Math.min(1,RAGDOLL_MAX_SPEED/Math.max(.001,Math.hypot(launchX,vertical,launchZ)));
   body.setLinvel({x:launchX*launchScale,y:vertical*launchScale,z:launchZ*launchScale},true);
   // Off-center shot torque tips the body. Limbs subsequently respond to joints,
   // gravity and contacts rather than a canned rotation or independent animation.
   const convulse=skipAuthored?0:cue==='arc'?(parts.length%2?-3.8:3.8):cue==='frost'?(parts.length%2?-2.5:2.5):cue==='burn'?(parts.length%2?-.9:.9):0;
   body.setAngvel({x:velocity.z*scale*posture.torque+convulse,y:0,z:-velocity.x*scale*posture.torque},true);
   parts.push({bone,body,bindLinear});
  }
  for(const part of cue==='frost'?[]:parts.slice(1)){
   // I13: connected authored creature skins keep anatomical joint offsets.
   // Physics solver anchor error must not become temporary limb elongation.
   if(originalCreature)part.localAnchor=part.bone.position.clone();
   let parent=part.bone.parent;while(parent&&!parts.some(p=>p.bone===parent))parent=parent.parent;
   const other=parts.find(p=>p.bone===parent)??parts[0];
   const anchor=part.body.translation(),op=other.body.translation(),oq=other.body.rotation();
   const local=new T.Vector3(anchor.x-op.x,anchor.y-op.y,anchor.z-op.z).applyQuaternion(new T.Quaternion(oq.x,oq.y,oq.z,oq.w).invert());
   const joint=this.world.createImpulseJoint(RAPIER.JointData.revolute(local,{x:0,y:0,z:0},{x:1,y:0,z:0}),other.body,part.body,true) as RAPIER.RevoluteImpulseJoint;
   // Align both constraint frames in the captured world pose, then bound flexion.
   const childQ=part.body.rotation(),frame=new T.Quaternion(childQ.x,childQ.y,childQ.z,childQ.w).invert().multiply(new T.Quaternion(oq.x,oq.y,oq.z,oq.w));
   const axisFrame=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2);joint.setFrameX1(axisFrame);joint.setFrameX2(frame.multiply(axisFrame));
   const flex=cue==='frost'?.35:cue==='arc'?.8:1.1;
   joint.setLimits(-flex,flex);joint.setContactsEnabled(false);joints.push(joint);
  }
  const byBone=new Map(parts.map(p=>[p.bone,p])),hierarchy:PoseNode[]=[];
  model.root.traverse(node=>{if(node!==model.root)hierarchy.push({node,part:byBone.get(node as T.Bone)});});
  // Only this corpse pauses. Other actors, camera, inputs and the world keep
  // their clocks. Disabled bodies retain the exact captured pose and impulse.
  // Quantize down: the 32ms request holds at most three 120Hz ticks (25ms).
  const holdTicks=Number.isFinite(holdSeconds)?Math.floor(Math.min(.032,Math.max(0,holdSeconds))/STEP):0;
  if(holdTicks>0)for(const part of parts)part.body.setEnabled(false);
  this.records.set(id,{skinFloorCheckAt:(family==='carrier'&&originalCreature&&cue!=='frost'&&model.height>=4) ? .75 : undefined,model,cue,terminalTime:0,terminalPulse:0,parts,hierarchy,joints,poses,age:0,holdTicks,settled:false,falling:false,fallSpeed:0,support:new T.Vector3(),supportLift:.25,rootPosition:model.root.position.clone(),anchor:new T.Vector3().copy(parts[0].body.translation())});return true;
 }
 update(dt:number,marineX?:number,marineZ?:number){
  this.elapsedMs=0;if(!this.world||dt<=0)return;
  const authoredDt=Math.min(dt,.05);
  for(const [id,death] of this.authored){
    death.age+=authoredDt;
    // An ability can identify its victim after the native corpse event.
    death.cue=death.model.terminalCue?.(death.cue)??death.cue;
    const duration=death.model.poseDeath?.(death.cue,Math.min(1,death.age/death.duration));
    if(duration)death.duration=duration;
    death.model.setDeathAge?.(death.age);
    // Carry the accepted shot direction through the authored collapse, before
    // handing the settled pose to physics. A strong small-body kill travels
    // farther than a rifle drop; heavy castes retain their planted mass.
    const mass=death.family==='brute'?3.5:death.family==='carrier'?1.8:1;
    const speed=Math.hypot(death.velocity.x,death.velocity.z);
    const momentum=Math.min(.22,4/Math.max(.001,speed))/mass;
    const travel=(Math.exp(-Math.max(0,death.age-authoredDt)*7)-Math.exp(-death.age*7))/7*momentum;
    const dx=death.velocity.x*travel,dz=death.velocity.z*travel;
    death.model.root.position.x+=dx;death.model.root.position.z+=dz;
    death.anchor.x+=dx;death.anchor.z+=dz;
    death.model.root.updateMatrixWorld(true);
    if(death.age>=death.duration){this.authored.delete(id);this.add(id,death.model,death.family,death.velocity,death.cue,death.hold,true);}
  }
  let active=false,falling=false;for(const r of this.records.values()){active ||= !r.settled;falling ||= r.falling;}
  if(!active&&!falling)return;const start=performance.now(),delta=Math.min(dt,.05);
  if(active){this.accumulator+=delta;while(this.accumulator+1e-9>=STEP){
   this.world.timestep=STEP;this.world.step();
   for(const record of this.records.values()){
    if(record.holdTicks>0){record.holdTicks--;if(record.holdTicks===0)for(const part of record.parts)part.body.setEnabled(true);continue;}
    record.terminalTime+=STEP;
    if(record.cue==='arc'&&record.terminalTime<.22){const pulse=Math.floor(record.terminalTime/.07);if(pulse>record.terminalPulse){record.terminalPulse=pulse;for(let i=0;i<record.parts.length;i++){const part=record.parts[i];this.physicsVelocity.x=(i%2?-1:1)*(pulse%2?-4:4);this.physicsVelocity.y=0;this.physicsVelocity.z=(i%2?-1:1)*1.7;part.body.setAngvel(this.physicsVelocity,true);}}}
   }
   // Contacts and anchors are solved together. Postsolve translations can push
   // otherwise valid skin proxies through the deck without contact resolution.
   // Narrow fitted limbs can amplify joint-limit impulses into extreme energy.
   // Bound velocity only; retain every solved contact position and joint anchor.
   for(const r of this.records.values())for(const p of r.parts){
    const linear=p.body.linvel(this.physicsVelocity),speed=Math.hypot(linear.x,linear.y,linear.z);
    if(speed>RAGDOLL_MAX_SPEED){const scale=RAGDOLL_MAX_SPEED/speed;linear.x*=scale;linear.y*=scale;linear.z*=scale;p.body.setLinvel(linear,false);}
    const angular=p.body.angvel(this.physicsVelocity),spin=Math.hypot(angular.x,angular.y,angular.z);
    if(spin>RAGDOLL_MAX_SPIN){const scale=RAGDOLL_MAX_SPIN/spin;angular.x*=scale;angular.y*=scale;angular.z*=scale;p.body.setAngvel(angular,false);}
   }
   this.accumulator-=STEP;this.steps++;}}
  for(const r of this.records.values()){
   r.age+=delta;r.model.setDeathAge?.(r.age);if(r.falling){this.fall(r,delta);continue;}if(r.settled)continue;if(r.holdTicks>0)continue;this.apply(r);
   // I13: tall Matron proxies can support empty space after connected-skin
   // joint offsets are restored. Check the drawn bottom once, then hand a
   // genuinely suspended skin to the existing support-aware frozen fall.
   if(r.skinFloorCheckAt!==undefined&&r.age>=r.skinFloorCheckAt){
    r.skinFloorCheckAt=undefined;
    if(this.skinSuspendedAboveSupport(r)){this.retire(r,true);continue;}
   }
   const distant=marineX!==undefined&&marineZ!==undefined&&!r.model.root.visible&&r.age>=1.5&&
    (r.anchor.x-marineX)**2+(r.anchor.z-marineZ)**2>14**2;
   if(r.parts.every(p=>p.body.isSleeping())||r.age>=6||distant&&this.quiet(r))this.retire(r,true);
  }
  this.elapsedMs=performance.now()-start;
 }
 private quiet(r:RagdollRecord):boolean {
  for(const {body} of r.parts){
   const linear=body.linvel(this.physicsVelocity);
   if(linear.x**2+linear.y**2+linear.z**2>.18**2)return false;
   const angular=body.angvel(this.physicsVelocity);
   if(angular.x**2+angular.y**2+angular.z**2>.3**2)return false;
  }
  return true;
 }
 private skinSuspendedAboveSupport(r:RagdollRecord):boolean {
  r.model.root.updateMatrixWorld(true);
  const bounds=this.skinFloorBounds.setFromObject(r.model.root,true);
  if(bounds.isEmpty())return false;
  const origin=this.supportRay.origin;
  origin.x=(bounds.min.x+bounds.max.x)*.5;origin.z=(bounds.min.z+bounds.max.z)*.5;
  // Start below the skin so an overhead table/ceiling cannot become its support.
  origin.y=bounds.min.y-.01;
  const hit=this.world!.castRay(this.supportRay,Math.max(8,r.model.height+4),true,RAPIER.QueryFilterFlags.ONLY_FIXED,GROUPS);
  return !hit||hit.timeOfImpact>.35;
 }
 private fall(r:RagdollRecord,dt:number){
  r.fallSpeed-=9.81*dt;let dy=r.fallSpeed*dt;
  // The frozen pose only translates. Its cached bottom-center support avoids
  // rescanning every skinned vertex or accepting an AABB corner across a pit.
  // Start above shallow solver penetration rather than casting below the floor.
  const lift=r.supportLift,origin=this.supportRay.origin;
  origin.x=r.support.x;origin.y=r.support.y+lift;origin.z=r.support.z;
  const hit=this.world!.castRay(this.supportRay,lift-dy,true,RAPIER.QueryFilterFlags.ONLY_FIXED,GROUPS);
  r.supportLift=.25;
  if(hit){dy=lift-hit.timeOfImpact;r.falling=false;r.fallSpeed=0;}
  r.model.root.position.y+=dy;r.anchor.y+=dy;r.support.y+=dy;r.model.root.updateMatrixWorld(true);
  // Stop retained renderer-owned corpses below every static, including real pits.
  if(r.support.y<this.fallLimit){r.falling=false;r.fallSpeed=0;}
 }
 private apply(r:RagdollRecord){
  // Parent-first world -> local mapping retains imported bind matrices and GPU
  // skinning. Unsimulated bones follow the nearest simulated parent unchanged.
  // The frozen hierarchy is captured at admission. Updating every node once
  // avoids repeatedly walking ancestor chains and entire limb subtrees for
  // worldToLocal/getWorldQuaternion on each simulated part.
  r.model.root.updateWorldMatrix(true,false);
  for(const {node,part:p} of r.hierarchy){
   if(p){
    const position=p.body.translation(),rotation=p.body.rotation(),parent=node.parent!;
    this.inverse.copy(parent.matrixWorld).invert();
    // Nonuniform fitted skins introduce shear below rotated parents. A TRS
    // decomposition loses that shear and lets rendered skin escape its fitted
    // physics proxies. Retain the exact captured linear map under rigid motion.
    this.rigidWorld.makeRotationFromQuaternion(this.q.set(rotation.x,rotation.y,rotation.z,rotation.w));
    this.rigidWorld.setPosition(position.x,position.y,position.z);
    node.matrix.multiplyMatrices(this.inverse,this.rigidWorld).multiply(p.bindLinear);
    // Keep physics orientation and the captured shear/scale, but attach a
    // connected child at its captured local joint. Frost islands deliberately
    // retain independent body translations and therefore have no localAnchor.
    if(p.localAnchor)node.matrix.setPosition(p.localAnchor);
    node.matrix.decompose(node.position,node.quaternion,node.scale);
   }
   // Frozen unsimulated bones have matrixAutoUpdate=false, so force their world
   // matrix to follow the already updated parent while retaining their locals.
   node.matrixWorldNeedsUpdate=true;node.updateWorldMatrix(false,false);
  }
  r.anchor.copy(r.parts[0].body.translation());
 }
 private retire(r:RagdollRecord,poseCurrent=false){
  if(r.settled)return;
  if(!poseCurrent)this.apply(r);
  r.model.root.updateMatrixWorld(true);const bounds=this.skinFloorBounds.setFromObject(r.model.root,true);
  if(bounds.isEmpty())r.support.copy(r.anchor).y-=.05;
  else {bounds.getCenter(r.support);r.support.y=bounds.min.y;}
  // Recover only shallow contact slop. A ray above the whole body can catch an overhead table.
  r.supportLift=.25;
  for(const p of r.parts){p.body.sleep();this.world!.removeRigidBody(p.body);}r.parts=[];r.hierarchy=[];r.joints=[];r.settled=true;r.falling=true;r.fallSpeed=0;
 }
 has(id:number){return this.records.has(id)||this.authored.has(id);}
 position(id:number){return this.records.get(id)?.anchor??this.authored.get(id)?.anchor;}
 sync(id:number,x:number,z:number){
  const pending=this.authored.get(id);if(pending){pending.model.root.position.x+=x-pending.anchor.x;pending.model.root.position.z+=z-pending.anchor.z;pending.anchor.x=x;pending.anchor.z=z;pending.velocity.x=pending.velocity.z=0;return;}
  const r=this.records.get(id);if(!r)return;const dx=x-r.anchor.x,dz=z-r.anchor.z;
  if(r.settled){r.model.root.position.x+=dx;r.model.root.position.z+=dz;r.support.x+=dx;r.support.z+=dz;r.falling=true;r.fallSpeed=0;}else{
   for(const p of r.parts){const v=p.body.translation();p.body.setTranslation({x:v.x+dx,y:v.y,z:v.z+dz},true);p.body.setLinvel({x:0,y:0,z:0},true);}this.apply(r);
  }
  r.anchor.x=x;r.anchor.z=z;
 }
 remove(id:number){
  const pending=this.authored.get(id);if(pending){for(const p of pending.poses){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.rotation);p.bone.scale.copy(p.scale);p.bone.matrixAutoUpdate=p.auto;p.bone.updateMatrix();}pending.model.root.position.copy(pending.rootPosition);this.authored.delete(id);return;}
  const r=this.records.get(id);if(!r)return;
  if(!r.settled)for(const p of r.parts)this.world!.removeRigidBody(p.body);
  for(const p of r.poses){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.rotation);p.bone.scale.copy(p.scale);p.bone.matrixAutoUpdate=p.auto;p.bone.updateMatrix();}
  r.model.root.position.copy(r.rootPosition);r.model.root.updateMatrixWorld(true);this.records.delete(id);
 }
 inspect(id:number){return this.records.get(id)?.parts.map(p=>({name:p.bone.name,position:{...p.body.translation()},rotation:{...p.body.rotation()},sleeping:p.body.isSleeping()}));}
 maxJointError(id:number){
  let error=0;for(const j of this.records.get(id)?.joints??[]){const a=j.body1(),b=j.body2(),qa=a.rotation(),qb=b.rotation();const va=new T.Vector3().copy(j.anchor1()).applyQuaternion(new T.Quaternion(qa.x,qa.y,qa.z,qa.w)).add(a.translation());const vb=new T.Vector3().copy(j.anchor2()).applyQuaternion(new T.Quaternion(qb.x,qb.y,qb.z,qb.w)).add(b.translation());error=Math.max(error,va.distanceTo(vb));}return error;
 }
 snapshot(){let active=this.authored.size,falling=0,bodies=0,joints=0;for(const r of this.records.values()){if(!r.settled)active++;if(r.falling)falling++;bodies+=r.parts.length;joints+=r.joints.length;}return{active,falling,bodies,joints,settled:this.records.size+this.authored.size-active-falling,budget:RAGDOLL_BUDGET[this.tier],collisionGroups:GROUPS,staticColliders:(this.world?.colliders.len()??0)-bodies,stepMs:this.elapsedMs,steps:this.steps,overflow:this.overflow};}
 dispose(){for(const id of this.authored.keys())this.remove(id);for(const id of this.records.keys())this.remove(id);this.world?.free();this.world=undefined;this.statics=[];this.accumulator=0;this.elapsedMs=0;}
}
