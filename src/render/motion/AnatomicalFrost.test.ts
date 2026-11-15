import {beforeAll, expect, it, vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {alien, disposeModel} from '../models';
import {AnatomicalFrost, isAnatomicalBone} from './AnatomicalFrost';

beforeAll(loadModels);

it('prepares anatomical triangle islands without changing source skin buffers, draw count or material programs', () => {
  for (const family of ['crawler','brute']) {
    const model = alien(family), meshes: T.SkinnedMesh[] = [];
    model.root.traverse(object => {if(object instanceof T.SkinnedMesh)meshes.push(object);});
    const original = meshes.map(mesh => ({geometry:mesh.geometry, material:mesh.material,
      indices: Array.from(mesh.geometry.getAttribute('skinIndex').array), weights:Array.from(mesh.geometry.getAttribute('skinWeight').array)}));
    const frost = new AnatomicalFrost(model.root, family);
    const variants = meshes.flatMap(mesh => mesh.userData.geometryVariants as T.BufferGeometry[]);
    const disposal = variants.map(geometry => vi.spyOn(geometry,'dispose'));
    try {
      expect(meshes.every((mesh,index)=>mesh.geometry===original[index].geometry)).toBe(true);
      frost.use();
      for (const [index,mesh] of meshes.entries()) {
        expect(mesh.material).toBe(original[index].material);
        expect(mesh.geometry).not.toBe(original[index].geometry);
        expect(mesh.geometry.index).toBeNull();
        const bones=mesh.geometry.getAttribute('skinIndex'), weights=mesh.geometry.getAttribute('skinWeight');
        for(let vertex=0;vertex<bones.count;vertex+=3) {
          expect(bones.getX(vertex+1)).toBe(bones.getX(vertex));
          expect(bones.getX(vertex+2)).toBe(bones.getX(vertex));
          expect(weights.getX(vertex)).toBe(1); expect(weights.getY(vertex)).toBe(0);
          expect(isAnatomicalBone(mesh.skeleton.bones[bones.getX(vertex)].name,family)).toBe(true);
        }
        expect(Array.from(original[index].geometry.getAttribute('skinIndex').array)).toEqual(original[index].indices);
        expect(Array.from(original[index].geometry.getAttribute('skinWeight').array)).toEqual(original[index].weights);
      }
      const sameMeshes:T.SkinnedMesh[]=[];model.root.traverse(object=>{if(object instanceof T.SkinnedMesh)sameMeshes.push(object);});
      expect(sameMeshes).toEqual(meshes);
      frost.reset(); frost.use(); frost.reset();
      expect(meshes.every((mesh,index)=>mesh.geometry===original[index].geometry)).toBe(true);
      disposeModel(model.root);
      for(const dispose of disposal)expect(dispose).toHaveBeenCalledOnce();
    } finally {model.stop?.();}
  }
});
