import {beforeAll,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,marine,disposeModel,freezeCorpse} from './models';
import {AfflictionBatches,NO_AFFLICTION,afflictionEffects} from './afflictions';
import type {DepthGame} from '../DepthGame';
import type {AbilitiesSnapshot,AbilitySlotSnapshot} from '../game/abilities/contract';
import {ElementKit} from './abilities/ElementKit';
import {createSystemPresentation} from './abilities/system';

beforeAll(loadModels);

it('resynchronizes a real marine weapon and muzzle after V2 brace, dash and restored body poses',()=>{
  const model=marine(),kit=new ElementKit(new T.Group()),presentation=createSystemPresentation(kit);
  const game={player:{x:128,y:128,angle:.4},combat:{snapshot:{dead:false}},enemies:{snapshot:{enemies:[]}},boonStatuses:()=>NO_AFFLICTION} as unknown as DepthGame;
  const baseline:AbilitiesSnapshot={rig:'breacher',slots:null,overdrive:{active:false,ready:false,charge:0,activeRemainingMs:0},invulnerable:false,dashing:false,hostileTimeScale:1,zones:[],deployables:[]};
  const cast:AbilitySlotSnapshot={id:'seismic-slam',slot:'tactical',ready:false,charges:0,maxCharges:1,cooldownMs:6000,cooldownRemainingMs:6000,castRemainingMs:100,activeRemainingMs:0,activeMs:0};
  const bracing={...baseline,slots:{tactical:cast,power:{...cast,castRemainingMs:0},overdrive:{...cast,castRemainingMs:0},dash:{...cast,castRemainingMs:0}}};
  const socket=model.root.getObjectByName('tag_weapon')!,matrix=new T.Matrix4(),expectedPosition=new T.Vector3(),expectedRotation=new T.Quaternion(),scale=new T.Vector3(),muzzle=new T.Vector3();
  const apply=(snapshot:AbilitiesSnapshot)=>{kit.begin(0);presentation.update({snapshot,dt:0,visible:true,game,marine:model.root,marineBody:model.body});kit.end();};
  const checkAttached=()=>{
    socket.updateWorldMatrix(true,false);matrix.copy(model.root.matrixWorld).invert().multiply(socket.matrixWorld).decompose(expectedPosition,expectedRotation,scale);
    expect(model.weapon!.position.distanceTo(expectedPosition)).toBeLessThan(1e-10);
    model.weapon!.quaternion.toArray().forEach((value,i)=>expect(value).toBeCloseTo(expectedRotation.toArray()[i],12));
    expect(model.weapon!.scale.toArray()).toEqual([1,1,1]);
    expect(model.muzzleWorld!(muzzle).toArray().every(Number.isFinite)).toBe(true);
  };
  try{
    model.root.position.set(4,.2,7);model.animate(0,0,.4);const restY=model.body.position.y;
    for(const snapshot of [bracing,{...baseline,dashing:true},baseline]){
      model.animate(1,0,.4);const before=model.muzzleWorld!(new T.Vector3()).clone();
      apply(snapshot);model.syncWeaponPose!();checkAttached();
      expect(model.muzzleWorld!(muzzle).distanceTo(before)).toBeGreaterThan(1e-4);
      const stable=muzzle.clone();apply(snapshot);model.syncWeaponPose!();checkAttached();
      expect(model.muzzleWorld!(muzzle).distanceTo(stable)).toBeLessThan(1e-10);
    }
    expect(model.body.position.y).toBe(restY);
  }finally{presentation.dispose();kit.dispose();disposeModel(model.root);}
});

it('reuses marine rotation scratch while preserving explicit and inferred travel poses',()=>{
  const inferred=marine(),explicit=marine(),rotations=new Set<T.Quaternion>();
  const original=T.Quaternion.prototype.setFromAxisAngle;
  const spy=vi.spyOn(T.Quaternion.prototype,'setFromAxisAngle').mockImplementation(function(this:T.Quaternion,axis,angle){rotations.add(this);return original.call(this,axis,angle);});
  try{
    for(let i=0;i<20;i++){
      const aim=i*.13,moving=i<10?1:0,recoil=i%3*.2,reload=i/20;
      inferred.animate(i/60,moving,aim,recoil,reload);
      explicit.animate(i/60,moving,aim,recoil,reload,{x:Math.cos(aim)*moving*220,y:Math.sin(aim)*moving*220});
      expect(inferred.weapon!.position.distanceTo(explicit.weapon!.position)).toBeLessThan(1e-10);
      expect(inferred.weapon!.quaternion.toArray()).toEqual(explicit.weapon!.quaternion.toArray());
    }
    expect(rotations.size).toBe(2);
  }finally{spy.mockRestore();disposeModel(inferred.root);disposeModel(explicit.root);}
});

it('updates alien emissive color only when the visible status changes and preserves pool/death transitions',()=>{
  const model=alien('queen');let material:T.MeshStandardMaterial|undefined;
  model.root.traverse(o=>{if(o instanceof T.SkinnedMesh&&!material)material=(Array.isArray(o.material)?o.material[0]:o.material) as T.MeshStandardMaterial;});
  const color=vi.spyOn(material!.emissive,'setHex');
  try{
    for(let i=0;i<20;i++)model.animate(i/60,1,.4);
    expect(color).toHaveBeenCalledOnce();expect(material!.emissive.getHex()).toBe(0xffdfb0);
    model.setExposed!(true);model.animate(1,0,0);
    expect(material!.emissive.getHex()).toBe(0xff4aa5);expect(material!.emissiveIntensity).toBe(.10);
    model.setAffliction!({chilled:true,burning:false,frozen:true});model.animate(1.02,0,0);
    expect(material!.emissive.getHex()).toBe(0x79ddff);expect(material!.emissiveIntensity).toBe(.12);
    freezeCorpse(model);model.animate(1.04,0,0);
    expect(material!.emissive.getHex()).toBe(0xff4aa5);
    model.reset!();model.animate(2,0,0);
    expect(material!.emissive.getHex()).toBe(0xffdfb0);expect(material!.emissiveIntensity).toBe(0);
  }finally{color.mockRestore();disposeModel(model.root);}
});

it('uploads only live affliction instances and leaves inactive buffers untouched across clear and reuse',()=>{
  const batches=new AfflictionBatches(undefined,8),root=new T.Group(),status=afflictionEffects(root,2,2),camera=new T.PerspectiveCamera();
  const meshes=batches.root.children as T.InstancedMesh[];
  const attributes=(mesh:T.InstancedMesh)=>[mesh.instanceMatrix,mesh.instanceColor,mesh.geometry.getAttribute('atlas'),mesh.geometry.getAttribute('particleAlpha')].filter((a):a is T.BufferAttribute=>a instanceof T.BufferAttribute);
  const versions=meshes.flatMap(attributes).map(a=>a.version);
  try{
    batches.update([root],camera,0);
    expect(meshes.flatMap(attributes).map(a=>a.version)).toEqual(versions);
    status.set({chilled:true,burning:true,poisoned:true,frozen:true});batches.update([root],camera,1);
    expect(batches.counts).toEqual({fire:6,poison:4,ice:10,drops:4,embers:6});
    const ranges=new Map<T.BufferAttribute,{start:number;count:number}>();
    for(const mesh of meshes)for(const a of attributes(mesh)){
      // Non-ice instance colors are constant white, so they never need a frame upload.
      if(a===mesh.instanceColor&&mesh!==meshes[2])continue;
      expect(a.updateRanges).toEqual([{start:0,count:mesh.count*a.itemSize}]);
      ranges.set(a,a.updateRanges[0]);a.clearUpdateRanges();
    }
    status.set(NO_AFFLICTION);const activeVersions=meshes.flatMap(attributes).map(a=>a.version);
    batches.update([root],camera,2);expect(Object.values(batches.counts).every(n=>n===0)).toBe(true);
    expect(meshes.flatMap(attributes).map(a=>a.version)).toEqual(activeVersions);
    batches.clear();batches.setOptions({tier:'low'});status.set({chilled:true,burning:true});batches.update([root],camera,3);
    expect(batches.counts).toEqual({fire:3,poison:0,ice:1,drops:0,embers:2});
    for(const mesh of meshes)if(mesh.count)for(const a of attributes(mesh))if(ranges.has(a)){
      expect(a.updateRanges[0]).toBe(ranges.get(a));expect(a.updateRanges[0].count).toBe(mesh.count*a.itemSize);
    }
  }finally{batches.dispose();}
});

it('omits fragment-discarded corpse identity draws and restores them on pool reuse',()=>{
 const model=alien('brute'),identity=model.root.getObjectByName('brute-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 try{expect(identity.visible).toBe(true);model.freeze!();expect(identity.material.uniforms.identityDeath.value).toBe(1);expect(identity.visible).toBe(false);model.reset!();expect(identity.visible).toBe(true);expect(identity.material.uniforms.identityDeath.value).toBe(0);}finally{disposeModel(model.root);}
});
