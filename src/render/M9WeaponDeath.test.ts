import {beforeAll,describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {AttackEffects,EFFECT_LIMITS} from './AttackEffects';
import {DeathRagdolls,initDeathPhysics,RAGDOLL_MAX_SPEED,type DeathCue} from './DeathRagdolls';
import {alien,freezeCorpse,type ActorModel} from './models';
import {registerAsset,type AssetName} from './assets';
import type {WeaponId} from '../game/combat/types';
import {DepthGame,type GameEffect} from '../DepthGame';
import {ProjectileHitTracker} from '../game/combat/CombatSystem';

type ParticleView={p:T.Vector3;v:T.Vector3;color:T.Color;life:number;size:number;aspect?:number;direction?:number};
const particles=(fx:AttackEffects)=>fx as unknown as {glow:ParticleView[];smoke:ParticleView[];debris:ParticleView[]};
const weapons:WeaponId[]=['pistol','rifle','shotgun','plasma','rocket'];

describe('M9 pooled weapon response',()=>{
 it('keeps a full magazine in existing batches and retires muzzle smoke promptly',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.Camera(),inventory=[...scene.children];
  const materials=inventory.map(n=>(n as T.Mesh).material);
  try{
   for(const weapon of weapons){
    fx.clear();
    for(let i=0;i<40;i++){fx.shot(new T.Vector3(1,1,1),.4,weapon);fx.update(.06,camera,[]);}
    expect(scene.children).toEqual(inventory);
    expect(inventory.map(n=>(n as T.Mesh).material)).toEqual(materials);
    expect(fx.counts.glow).toBeLessThanOrEqual(EFFECT_LIMITS.glow);
    expect(fx.counts.smoke).toBeLessThanOrEqual(EFFECT_LIMITS.smoke);
    expect(fx.counts.debris).toBeLessThanOrEqual(EFFECT_LIMITS.debris);
    fx.update(.34,camera,[]);expect(fx.counts.smoke).toBe(0);
   }
  }finally{fx.dispose();}
 });
 it('projects an elongated flash along the actual shot axis, including diagonal aim',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.PerspectiveCamera(40,16/9,.1,100);
  camera.position.set(0,26,19);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const mesh=scene.children.find(n=>n instanceof T.InstancedMesh&&(n.material as T.ShaderMaterial).uniforms.style.value===0) as T.InstancedMesh;
  try{
   for(const angle of [0,.7,Math.PI/2,Math.PI]){
    fx.clear();fx.shot(new T.Vector3(0,1,0),angle,'rifle');fx.update(.001,camera,[]);
    const matrix=new T.Matrix4();mesh.getMatrixAt(0,matrix);
    const actual=new T.Vector3().setFromMatrixColumn(matrix,0).normalize();
    const expected=new T.Vector3(Math.cos(angle),0,Math.sin(angle)).applyQuaternion(camera.quaternion.clone().invert());expected.z=0;expected.normalize().applyQuaternion(camera.quaternion);
    expect(Math.abs(actual.dot(expected))).toBeGreaterThan(.999);
    const scale=new T.Vector3().setFromMatrixScale(matrix);expect(scale.x).toBeGreaterThan(scale.y*3);
   }
  }finally{fx.dispose();}
 });
 it('uses brass for ballistic receivers and vents for energy, with controlled flashes',()=>{
  const fx=new AttackEffects(new T.Scene()),flashes:number[]=[];
  fx.setFeedback({flash:e=>flashes.push(e.intensity)});
  try{
   for(const id of weapons){
    fx.clear();fx.shot(new T.Vector3(0,1,0),0,id);
    expect(particles(fx).debris.length).toBe(id==='plasma'||id==='rocket'?0:1);
    if(id==='plasma')expect(particles(fx).smoke.every(p=>p.p.x<0)).toBe(true);
    if(id==='rocket')expect(particles(fx).smoke[0].p.x).toBeLessThan(-.5);
   }
   const full=flashes.at(-1)!;fx.setOptions({flashIntensity:.5,reducedMotion:true});fx.shot(new T.Vector3(),0,'rocket');
   expect(flashes.at(-1)).toBeCloseTo(full*.25);
   fx.setOptions({flashIntensity:0});const count=flashes.length;fx.shot(new T.Vector3(),0,'rocket');expect(flashes).toHaveLength(count);
  }finally{fx.dispose();}
 });
});

describe('M9 directional and elemental corpse presentation',()=>{
 it('distinguishes actual native rocket killing momentum with bounded longer downstream fragments',()=>{
  const nativeCorpse=(weapon:'shotgun'|'rocket')=>{
   const events:GameEffect[]=[],game=new DepthGame(event=>events.push(event));
   const internals=game as unknown as {makeEnemies():typeof game.enemies;updateBullets(dt:number):void};
   game.geometry={...game.geometry,bounds:{x:0,y:0,width:1200,height:880},blockers:[],voids:undefined,boundary:[{x:0,y:0},{x:1200,y:0},{x:1200,y:880},{x:0,y:880}]};
   game.enemies=internals.makeEnemies();game.status='playing';Object.assign(game.player,{x:300,y:440,angle:0});
   const spawn=game.enemies.spawn('crawler',470,440,false);if(!spawn.spawned)throw Error('native test spawn rejected');
   game.enemies.applyDamage(spawn.enemy.id,spawn.enemy.health+spawn.enemy.armor-1);
   game.combat.switchWeapon(weapon);
   game.bullets=game.combat.fire(0).map(request=>({x:300,y:440,life:3,kind:'player',request,tracker:new ProjectileHitTracker(request.penetration)}));
   for(let i=0;i<100&&!events.some(event=>event.type==='corpse');i++)internals.updateBullets(.01);
   const corpse=events.find(event=>event.type==='corpse');if(!corpse)throw Error('native projectile did not kill');
   return corpse;
  };
  const fx=new AttackEffects(new T.Scene());
  try{
   const shotgun=nativeCorpse('shotgun'),rocket=nativeCorpse('rocket');
   expect(Math.hypot(rocket.vx??0,rocket.vy??0)).toBeGreaterThan(Math.hypot(shotgun.vx??0,shotgun.vy??0)*1.5);
   fx.event(shotgun);const ordinaryCount=fx.counts.debris,ordinaryLife=Math.max(...particles(fx).debris.map(p=>p.life));
   fx.clear();const payload=JSON.stringify(rocket);fx.event(rocket);
   expect(JSON.stringify(rocket)).toBe(payload);
   expect(fx.counts.debris).toBe(ordinaryCount+3);expect(fx.counts.debris).toBeLessThanOrEqual(13);
   expect(Math.max(...particles(fx).debris.map(p=>p.life))).toBeGreaterThan(ordinaryLife);
   const direction=new T.Vector3(rocket.vx??0,0,rocket.vy??0).normalize();
   expect(particles(fx).debris.every(p=>p.v.dot(direction)>0)).toBe(true);
   expect(particles(fx).debris.every(p=>Math.hypot(p.v.x,p.v.z)<=2.8+1e-6)).toBe(true);
  }finally{fx.dispose();}
 });
 it('keeps fragments downstream of a killing blow and distinguishes status aftermath',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene),inventory=[...scene.children];
  const colors=new Set<number>();
  try{
   for(const cue of ['none','frost','burn','arc','acid'] as DeathCue[]){
    fx.clear();fx.event({type:'corpse',family:'carrier',x:64,y:96,vx:320,vy:0},cue);
    expect(particles(fx).debris.every(p=>p.v.x>0)).toBe(true);
    colors.add(particles(fx).debris[0].color.getHex());
    if(cue==='burn')expect(particles(fx).smoke.length).toBeGreaterThan(1);
    if(cue==='arc')expect(particles(fx).glow.length).toBeGreaterThan(0);
    if(cue==='frost')expect(particles(fx).debris.every(p=>p.size<.08)).toBe(true);
    expect(scene.children).toEqual(inventory);
   }
   expect(colors.size).toBe(5);
   fx.clear();fx.event({type:'corpse',family:'crawler',x:64,y:96,vx:-320,vy:0});
   expect(particles(fx).debris.every(p=>p.v.x<0)).toBe(true);
  }finally{fx.dispose();}
 });
 it('reduces fragment travel under reduced motion and preserves pool limits in a crowd',()=>{
  const fx=new AttackEffects(new T.Scene());
  try{
   fx.event({type:'corpse',family:'brute',x:0,y:0,vx:320,vy:0},'frost');const full=particles(fx).debris[0].v.length();
   fx.clear();fx.setOptions({reducedMotion:true,tier:'low'});fx.event({type:'corpse',family:'brute',x:0,y:0,vx:320,vy:0},'frost');
   expect(particles(fx).debris[0].v.length()).toBeLessThan(full*.5);
   for(let i=0;i<200;i++)fx.event({type:'corpse',family:'carrier',x:0,y:0,vx:320,vy:0},'burn');
   expect(fx.counts.debris).toBeLessThanOrEqual(Math.floor(EFFECT_LIMITS.debris*.45));
   expect(fx.counts.smoke).toBeLessThanOrEqual(Math.floor(EFFECT_LIMITS.smoke*.45));
  }finally{fx.dispose();}
 });
});

beforeAll(async()=>{
 await initDeathPhysics();
 for(const name of ['dretch','basilisk','marauder','dragoon','tyrant'] as AssetName[]){
  const bytes=readFileSync(`public/assets/models/${name}.glb`),loader=new GLTFLoader();
  loader.register(()=>({name:'cpu-texture-stub',loadTexture:async()=>new T.Texture()}));
  registerAsset(name,await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''));
 }
});
function actor(family:string):ActorModel{
 const names:Record<string,string[]>={crawler:['chest','leg0_upper','leg1_upper'],stalker:['torso','chest','head'],spitter:['bum','spine2','head'],carrier:['body','body001','head'],brute:['chest','tail','head']};
 const root=new T.Group(),body=new T.Group();root.add(body);root.position.set(5,3,5);
 const bones=names[family].map(name=>{const bone=new T.Bone();bone.name=name;return bone;});
 body.add(bones[0]);bones[0].add(bones[1],bones[2]);bones[1].position.set(.2,0,0);bones[2].position.set(-.2,.2,0);
 return{root,body,height:1,limbs:[],animate(){},freeze(){}};
}
it('keeps killing direction and distinguishes family collapse without translating the actor root',()=>{
 const physics=new DeathRagdolls();physics.setRoom({width:640,height:640,obstacles:[]});
 const world=(physics as unknown as {world:RAPIER.World}).world;
 const lift:number[]=[];
 try{
  for(const family of ['crawler','stalker','spitter','carrier','brute']){
   const model=actor(family),root=model.root.position.clone();expect(physics.add(1,model,family,{x:8,z:-2})).toBe(true);
   const velocities:Array<{x:number;y:number;z:number}>=[];world.forEachRigidBody(b=>velocities.push(b.linvel()));
   expect(velocities.every(v=>v.x>0&&v.z<0)).toBe(true);lift.push(velocities[0].y);
   physics.update(1/120);expect(model.root.position.distanceTo(root)).toBe(0);physics.remove(1);
  }
  expect(new Set(lift.map(v=>v.toFixed(3))).size).toBe(5);
  expect(lift[4]).toBeLessThan(lift[0]);
 }finally{physics.dispose();}
});
it('gives frost a heavy low fall and arc a short opposing-limb impulse without changing launch direction',()=>{
 const physics=new DeathRagdolls();physics.setRoom({width:640,height:640,obstacles:[]});
 const world=(physics as unknown as {world:RAPIER.World}).world;
 try{
  const rows=(cue:DeathCue)=>{
   expect(physics.add(1,actor('crawler'),'crawler',{x:8,z:0},cue)).toBe(true);
   const result:Array<{linear:{x:number;y:number;z:number};angular:{x:number;y:number;z:number}}>=[];
   world.forEachRigidBody(b=>result.push({linear:b.linvel(),angular:b.angvel()}));physics.remove(1);return result;
  };
  const plain=rows('none'),frost=rows('frost'),arc=rows('arc');
  expect(frost[0].linear.y).toBeLessThan(plain[0].linear.y*.2);
  expect(frost[0].linear.x).toBe(plain[0].linear.x);
  expect(arc.some(v=>v.angular.x<0)&&arc.some(v=>v.angular.x>0)).toBe(true);
  expect(arc.every(v=>v.linear.x>0&&Math.hypot(v.angular.x,v.angular.y,v.angular.z)<1)).toBe(true);
 }finally{physics.dispose();}
});
it('reserves vertical launch headroom inside the initial three-dimensional velocity cap',()=>{
 const physics=new DeathRagdolls();physics.setRoom({width:640,height:640,obstacles:[]});
 const world=(physics as unknown as {world:RAPIER.World}).world;
 try{
  expect(physics.add(1,actor('crawler'),'crawler',{x:1e6,z:-1e6})).toBe(true);
  world.forEachRigidBody(body=>{const v=body.linvel();expect(Math.hypot(v.x,v.y,v.z)).toBeLessThanOrEqual(RAGDOLL_MAX_SPEED+1e-5);expect(v.x).toBeGreaterThan(0);expect(v.z).toBeLessThan(0);});
 }finally{physics.dispose();}
});
it('holds only a new corpse for capped presentation time while other bodies keep moving',()=>{
 const physics=new DeathRagdolls();physics.setRoom({width:640,height:640,obstacles:[]});
 try{
  const held=actor('crawler'),live=actor('crawler');live.root.position.z+=3;
  expect(physics.add(1,held,'crawler',{x:8,z:0},'none',10)).toBe(true);
  expect(physics.add(2,live,'crawler',{x:8,z:0})).toBe(true);
  const captured=physics.inspect(1)!,moving=physics.inspect(2)!,root=held.root.position.clone();
  physics.update(0);expect(physics.inspect(1)).toEqual(captured);
  physics.update(1/60);expect(physics.inspect(1)).toEqual(captured);
  expect(physics.inspect(2)![0].position.x).toBeGreaterThan(moving[0].position.x);
  const world=(physics as unknown as {world:RAPIER.World}).world;
  physics.update(1/120);expect(physics.inspect(1)).toEqual(captured);
  world.forEachRigidBody(body=>expect(body.isEnabled()).toBe(true));
  physics.update(1/120);expect(physics.inspect(1)![0].position.x).toBeGreaterThan(captured[0].position.x);
  expect(held.root.position.distanceTo(root)).toBe(0);expect(physics.maxJointError(1)).toBeLessThan(.2);
 }finally{physics.dispose();}
});
for(const family of ['crawler','stalker','spitter','carrier','brute'])for(const cue of ['frost','arc'] as DeathCue[])it(`${family} ${cue}: retains real skin support and bounded joints through terminal collapse`,()=>{
 const physics=new DeathRagdolls();physics.setRoom({width:640,height:640,obstacles:[]});
 const model=alien(family);model.root.position.set(5,0,5);model.animate(1,1,.4);freezeCorpse(model);
 const root=model.root.position.clone(),point=new T.Vector3();
 try{
  expect(physics.add(1,model,family,{x:8,z:2},cue,.032)).toBe(true);
  for(let frame=0;frame<90;frame++){
   physics.update(1/60);expect(physics.maxJointError(1)).toBeLessThan(.2);
   if(frame%15!==14)continue;
   model.root.updateMatrixWorld(true);let minimum=Infinity;
   model.root.traverse(node=>{
    if(!(node instanceof T.SkinnedMesh))return;
    for(let i=0;i<node.geometry.getAttribute('position').count;i++)minimum=Math.min(minimum,node.getVertexPosition(i,point).applyMatrix4(node.matrixWorld).y);
   });
   expect(minimum).toBeGreaterThanOrEqual(-.025);
   if(physics.snapshot().active)expect(model.root.position.distanceTo(root)).toBe(0);
  }
 }finally{physics.dispose();}
});
