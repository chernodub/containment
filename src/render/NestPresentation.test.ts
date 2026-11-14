import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {nest,updateNest} from './NestPresentation';
import {disposeModel} from './meshParts';

it('keeps the Queen brood inside its footprint with three live material draws and a retained empty husk',()=>{
  const root=nest(),live=root.getObjectByName('nest-living-sac')!,husk=root.getObjectByName('nest-ruptured-husk')!;
  try{
    expect(live.children).toHaveLength(3);expect(husk.children).toHaveLength(2);
    const bounds=new T.Box3().setFromObject(root,true),size=bounds.getSize(new T.Vector3());
    expect(bounds.min.x).toBeGreaterThan(-1.02);expect(bounds.max.x).toBeLessThan(1.02);
    expect(bounds.min.z).toBeGreaterThan(-1.02);expect(bounds.max.z).toBeLessThan(1.02);
    expect(size.y).toBeGreaterThan(.9);expect(size.y).toBeLessThan(1.3);
    const core=root.userData.nestCore as T.MeshStandardMaterial;
    expect(core.emissiveIntensity).toBeLessThan(.5);
    const sourceMeshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)sourceMeshes.push(o);});
    const geometries=sourceMeshes.map(m=>m.geometry),materials=sourceMeshes.map(m=>m.material),children=[...root.children];
    for(let i=0;i<40;i++){
      updateNest(root,i/60,i%3===0);
      expect(root.children).toEqual(children);
      expect(sourceMeshes.map(m=>m.geometry)).toEqual(geometries);
      expect(sourceMeshes.map(m=>m.material)).toEqual(materials);
      expect(live.visible).toBe(i%3!==0);expect(husk.visible).toBe(i%3===0);
      expect(core.emissiveIntensity).toBeGreaterThan(.3);expect(core.emissiveIntensity).toBeLessThan(.5);
    }
  }finally{disposeModel(root);}
});

it('shares shell and tissue owners between living and ruptured states and disposes each exactly once',()=>{
  const root=nest(),materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>();
  root.traverse(o=>{if(o instanceof T.Mesh){materials.add(o.material as T.Material);geometries.add(o.geometry);}});
  expect(materials.size).toBe(3);
  const materialSpies=[...materials].map(m=>vi.spyOn(m,'dispose')),geometrySpies=[...geometries].map(g=>vi.spyOn(g,'dispose'));
  updateNest(root,1,true);updateNest(root,2,false);
  disposeModel(root);
  for(const spy of [...materialSpies,...geometrySpies])expect(spy).toHaveBeenCalledOnce();
});
