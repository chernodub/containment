import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { loadModels } from '../../../../tests/loadModels';
import { marine, disposeModel } from '../../models';
import { NativeMarineEchoes } from './NativeMarineEchoes';
import { bindPriorityMask } from '../PriorityMask';

beforeAll(loadModels);

function nativeSkin(root: T.Object3D): T.SkinnedMesh {
  let skin: T.SkinnedMesh | undefined;
  root.traverse(node => { if (node instanceof T.SkinnedMesh) skin ??= node; });
  return skin!;
}

describe('exact native temporal marine', () => {
  it('matches actual deformed surface vertices under translated, rotated, recoiling and braced poses', () => {
    const model = marine(), root = new T.Group(), echoes = new NativeMarineEchoes(root);
    const source = nativeSkin(model.root), sourcePose = new T.Vector3(), copiedPose = new T.Vector3();
    try {
      expect(echoes.slots).toHaveLength(1);
      expect(echoes.slots.every(slot => slot.meshes.length === 1)).toBe(true);
      for (let frame = 0; frame < 8; frame++) {
        model.root.position.set(4 + frame * .1, .12, 5 - frame * .08);
        model.animate(frame / 60, 1, .4 + frame * .08, .7, .25, { x: 220, y: 0 });
        model.body.rotation.z += .08; model.syncWeaponPose!();
        expect(echoes.capture(0, model.root, model.root.position.x, model.root.position.z)).toBe(true);
        echoes.draw(0, model.root.position.x - 1.1, model.root.position.z + .3, .7, 1, frame / 60, false);
        root.updateMatrixWorld(true);
        const copy = echoes.slots[0].meshes[0].mesh;
        expect(copy.geometry).toBe(source.geometry);
        expect(copy.skeleton).not.toBe(source.skeleton);
        expect(copy.bindMode).toBe(T.DetachedBindMode);
        const count = source.geometry.getAttribute('position').count;
        for (let i = 0; i < count; i += Math.max(1, Math.floor(count / 80))) {
          source.getVertexPosition(i, sourcePose).applyMatrix4(source.matrixWorld);
          copy.getVertexPosition(i, copiedPose).applyMatrix4(copy.matrixWorld);
          sourcePose.x -= 1.1; sourcePose.z += .3;
          expect(copiedPose.distanceTo(sourcePose)).toBeLessThan(1e-6);
        }
      }
    } finally { echoes.dispose(); disposeModel(model.root); }
  });

  it('holds a complete frozen native pose, keeps exactly one draw on both tiers and keeps prepared inventory stable', () => {
    const model = marine(), root = new T.Group(), echoes = new NativeMarineEchoes(root);
    const geometry = echoes.slots.map(slot => slot.meshes[0].mesh.geometry);
    const material = echoes.material, textures = echoes.slots.flatMap(slot => slot.skeletons.map(skeleton => skeleton.boneTexture));
    try {
      expect(textures.every(Boolean)).toBe(true);
      expect(new Set(textures).size).toBe(1);
      const preparationTextures = Object.values(echoes.material!).filter(value => value instanceof T.Texture);
      expect(preparationTextures).toEqual(expect.arrayContaining(textures));
      model.root.position.set(4, 0, 5); model.animate(0, 1, .4);
      for (let i = 0; i < 1; i++) {
        expect(echoes.capture(i, model.root, 4, 5)).toBe(true);
        echoes.draw(i, 2.9 - i, 5.3, .7, 1, 0, false);
      }
      root.updateMatrixWorld(true);
      const copy = echoes.slots[0].meshes[0].mesh, oldPose = copy.skeleton.boneMatrices!.slice();
      const world = copy.matrixWorld.clone();
      for (let i = 1; i < 8; i++) model.animate(i / 60, 1, 1.3, 1, .6);
      echoes.begin(); echoes.draw(0, 2.9, 5.3, .7, 1, 0, true); echoes.draw(1, 1.9, 5.3, .7, 1, 0, true);
      root.updateMatrixWorld(true);
      expect(copy.skeleton.boneMatrices).toEqual(oldPose);
      expect(copy.matrixWorld.equals(world)).toBe(true);
      expect(echoes.slots[0].meshes[0].mesh.visible).toBe(true);
      expect(echoes.slots).toHaveLength(1);
      expect(echoes.capture(1, model.root, 4, 5)).toBe(false);
      expect(echoes.slots.map(slot => slot.meshes[0].mesh.geometry)).toEqual(geometry);
      expect(echoes.material).toBe(material);
      expect(echoes.slots.flatMap(slot => slot.skeletons.map(skeleton => skeleton.boneTexture))).toEqual(textures);
      echoes.clear(); expect(root.children.every(node => !node.visible)).toBe(true);
    } finally { echoes.dispose(); disposeModel(model.root); }
  });

  it('owns only its material and preallocated bone textures, disposing each once without source buffer disposal', () => {
    const root = new T.Group(), echoes = new NativeMarineEchoes(root);
    const material = vi.spyOn(echoes.material!, 'dispose');
    const geometry = vi.spyOn(echoes.slots[0].meshes[0].mesh.geometry, 'dispose');
    const bones = echoes.slots.flatMap(slot => slot.skeletons.map(skeleton => vi.spyOn(skeleton.boneTexture!, 'dispose')));
    const sourceInverse = echoes.slots[0].meshes[0].mesh.skeleton.boneInverses[0];
    const model = marine();
    expect(sourceInverse).not.toBe(nativeSkin(model.root).skeleton.boneInverses[0]);
    disposeModel(model.root);
    echoes.dispose(); echoes.dispose();
    expect(material).toHaveBeenCalledOnce(); expect(geometry).not.toHaveBeenCalled();
    for (const bone of bones) expect(bone).toHaveBeenCalledOnce();
    expect(root.children).toHaveLength(0);
  });

  it('uses standard skinning and the existing priority mask without ink or shader variants per pose', () => {
    const echoes = new NativeMarineEchoes(new T.Group()), material = echoes.material!;
    const texture = new T.DataTexture();
    try {
      bindPriorityMask(material, texture);
      const shader = { fragmentShader: material.fragmentShader };
      material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms, {} as T.WebGLRenderer);
      expect(material.vertexShader).toContain('#include <skinning_pars_vertex>');
      expect(material.vertexShader).toContain('#include <skinning_vertex>');
      expect(shader.fragmentShader).toContain('priority*echoPriority*.97');
      expect(material.fragmentShader).not.toContain('inkEdge');
      expect(material.depthWrite).toBe(false); expect(material.premultipliedAlpha).toBe(true);
      expect(material.customProgramCacheKey()).toBe('v8-overclock-native-skin-v1');
    } finally { echoes.dispose(); texture.dispose(); }
  });
});
