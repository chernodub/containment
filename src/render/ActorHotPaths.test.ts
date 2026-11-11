import {beforeAll,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,marine,disposeModel,freezeCorpse} from './models';
import {AfflictionBatches,NO_AFFLICTION,afflictionEffects} from './afflictions';

beforeAll(loadModels);

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
    expect(material!.emissive.getHex()).toBe(0x42602b);expect(material!.emissiveIntensity).toBe(.22);
    model.setAffliction!({chilled:true,burning:false,frozen:true});model.animate(1.02,0,0);
    expect(material!.emissive.getHex()).toBe(0x79ddff);expect(material!.emissiveIntensity).toBe(.12);
    freezeCorpse(model);model.animate(1.04,0,0);
    expect(material!.emissive.getHex()).toBe(0x42602b);
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
