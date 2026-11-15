import {beforeAll, expect, it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {alien, marine, freezeCorpse, disposeModel} from '../models';
import {DeathRagdolls, initDeathPhysics} from '../DeathRagdolls';

beforeAll(async () => {await loadModels(); await initDeathPhysics();});

it('admits the actual marine skeleton and articulates the killing direction without rolling its native root', () => {
  const physics = new DeathRagdolls(), model = marine();
  physics.setRoom({width:640,height:640,obstacles:[]});
  model.root.position.set(5, 1, 5);
  model.animate(0, 0, .3);
  model.root.updateMatrixWorld(true);
  const rotation = model.root.quaternion.clone(), position = model.root.position.clone();
  try {
    expect(physics.add(-1, model, 'marine', {x:6,z:-2})).toBe(true);
    const before = physics.inspect(-1)!;
    expect(before.length).toBeGreaterThanOrEqual(10);
    expect(before.length).toBeLessThanOrEqual(20);
    expect(physics.snapshot().joints).toBe(before.length-1);
    for(let frame=0;frame<20;frame++) physics.update(1/60);
    const after=physics.inspect(-1)!;
    expect(after[0].position.x).toBeGreaterThan(before[0].position.x);
    expect(after[0].position.z).toBeLessThan(before[0].position.z);
    expect(after.some((part,i)=>i>0 && Math.abs(part.rotation.x-after[0].rotation.x)+Math.abs(part.rotation.z-after[0].rotation.z)>.01)).toBe(true);
    expect(model.root.position.distanceTo(position)).toBeLessThan(1e-8);
    expect(model.root.quaternion.angleTo(rotation)).toBeLessThan(1e-8);
    physics.remove(-1);
    expect(model.root.position.distanceTo(position)).toBeLessThan(1e-8);
  } finally {physics.dispose(); disposeModel(model.root);}
});

it('shatters every story family into independently supported anatomical parts with resident skin resources', () => {
  for(const family of ['crawler','spitter','brute','stalker','carrier']) {
    const physics=new DeathRagdolls(), model=alien(family);
    physics.setRoom({width:640,height:640,obstacles:[]});model.root.position.set(5,0,5);
    const skins:T.SkinnedMesh[]=[];model.root.traverse(object=>{if(object instanceof T.SkinnedMesh)skins.push(object);});
    const original=skins.map(mesh=>mesh.geometry),materials=skins.map(mesh=>mesh.material);
    try {
      for(let frame=0;frame<30;frame++)model.animate(frame/60,0,0);
      model.setAffliction!({frozen:true,chilled:true,burning:false});freezeCorpse(model);
      expect(skins.filter((mesh,index)=>mesh.geometry===original[index]).map(mesh=>mesh.name),family).toEqual([]);
      expect(skins.map(mesh=>mesh.material)).toEqual(materials);
      expect(physics.add(1,model,family,{x:8,z:2})).toBe(true);
      expect(physics.snapshot().joints).toBe(0);
      expect(physics.snapshot().bodies).toBeGreaterThanOrEqual(3);
      for(let frame=0;frame<45;frame++)physics.update(1/60);
      const parts=physics.inspect(1)!;
      expect(parts.every(part=>Number.isFinite(part.position.x)&&Number.isFinite(part.position.y)&&Number.isFinite(part.position.z))).toBe(true);
      expect(parts.some((part,index)=>index>0&&Math.abs(part.rotation.x-parts[0].rotation.x)+Math.abs(part.rotation.z-parts[0].rotation.z)>.1)).toBe(true);
      physics.remove(1);model.reset!();
      expect(skins.map(mesh=>mesh.geometry)).toEqual(original);
    } finally {physics.dispose();disposeModel(model.root);}
  }
});

it('dissolves acid kills on the terminal clock while keeping generic corpse retirement monotonic', () => {
  const model=alien('crawler'),physics=new DeathRagdolls();physics.setRoom({width:640,height:640,obstacles:[]});
  model.root.position.set(5,0,5);model.setAffliction!({chilled:false,burning:false,poisoned:true});freezeCorpse(model);
  try{
    expect(physics.add(1,model,'crawler',{x:4,z:0})).toBe(true);
    physics.update(.05);expect(model.root.userData.motionDeathProgress).toBeGreaterThan(.1);
    const first=model.root.userData.motionDeathProgress;model.dissolve!(0);
    const identity=model.root.getObjectByName('crawler-identity') as T.SkinnedMesh<T.BufferGeometry,T.ShaderMaterial>;
    expect(identity.material.uniforms.identityDissolve.value).toBe(first);
    for(let frame=0;frame<90;frame++)physics.update(1/60);
    expect(model.root.userData.motionDeathProgress).toBe(1);
    physics.remove(1);model.reset!();expect(identity.material.uniforms.identityDissolve.value).toBe(0);
  }finally{physics.dispose();disposeModel(model.root);}
});
