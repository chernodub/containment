import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { batchActorSkins } from './ActorSkinBatching';
import { instantiateAsset, registerAsset } from './assets';
import { disposeModel } from './meshParts';

async function sourceMarine() {
  const bytes = readFileSync('public/assets/models/marine.glb');
  const jsonLength = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  for (const material of json.materials) {
    delete material.pbrMetallicRoughness?.baseColorTexture;
    delete material.normalTexture; delete material.emissiveTexture; delete material.occlusionTexture;
  }
  delete json.images; delete json.textures;
  const binary = bytes.subarray(28 + jsonLength);
  let text = JSON.stringify(json); text += ' '.repeat((4 - text.length % 4) % 4);
  const encoded = Buffer.from(text), glb = Buffer.alloc(28 + encoded.length + binary.length);
  glb.write('glTF'); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(encoded.length, 12); glb.write('JSON', 16); encoded.copy(glb, 20);
  glb.writeUInt32LE(binary.length, 20 + encoded.length); glb.write('BIN\0', 24 + encoded.length);
  binary.copy(glb, 28 + encoded.length);
  return new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.length), '');
}

function skins(root: T.Object3D) {
  const result: T.SkinnedMesh[] = [];
  root.traverse(object => { if (object instanceof T.SkinnedMesh) result.push(object); });
  return result;
}

function vertices(root: T.Object3D, posed = false) {
  root.updateWorldMatrix(true, true);
  const result: string[] = [], position = new T.Vector3();
  for (const mesh of skins(root)) {
    mesh.skeleton.update();
    const attributes = mesh.geometry.attributes;
    for (let i = 0; i < attributes.position.count; i++) {
      const values: number[] = [];
      if (posed) {
        mesh.getVertexPosition(i, position).applyMatrix4(mesh.matrixWorld);
        values.push(...position.toArray().map(value => Math.round(value * 1e6)));
      }
      for (const name of Object.keys(attributes).sort()) {
        const attribute = attributes[name];
        for (let k = 0; k < attribute.itemSize; k++) values.push(attribute.getComponent(i, k));
      }
      result.push(values.join(','));
    }
  }
  return result.sort();
}

function primitive(parent: T.Object3D, material: T.Material, skeleton: T.Skeleton) {
  const geometry = new T.BoxGeometry();
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(new Uint16Array(geometry.attributes.position.count * 4), 4));
  const weights = new Float32Array(geometry.attributes.position.count * 4);
  for (let i = 0; i < weights.length; i += 4) weights[i] = 1;
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const mesh = new T.SkinnedMesh(geometry, material); mesh.bind(skeleton); parent.add(mesh);
  return mesh;
}

describe('template skin primitive batching', () => {
  it('reduces the real marine 22→4 draws with bit-exact attributes and retained named anchors', async () => {
    const asset = await sourceMarine(), before = vertices(asset.scene), source = skins(asset.scene);
    const named = source.map(mesh => [mesh.name, mesh.matrix.clone()] as const);
    const triangles = source.reduce((sum, mesh) => sum + mesh.geometry.index!.count / 3, 0);
    expect(source).toHaveLength(22);
    expect(batchActorSkins(asset.scene, asset.animations)).toBe(18);
    expect(skins(asset.scene)).toHaveLength(4);
    expect(vertices(asset.scene)).toEqual(before);
    expect(skins(asset.scene).reduce((sum, mesh) => sum + mesh.geometry.index!.count / 3, 0)).toBe(triangles);
    for (const [name, matrix] of named) {
      const anchor = asset.scene.getObjectByName(name)!;
      expect(anchor).toBeDefined(); expect(anchor.matrix.equals(matrix)).toBe(true);
      if (anchor instanceof T.SkinnedMesh) expect(source).toContain(anchor);
      else expect(anchor).toBeInstanceOf(T.Group);
    }
    expect(batchActorSkins(asset.scene, asset.animations)).toBe(0);
    disposeModel(asset.scene);
  });

  it('preserves every deformed vertex in production stand, run and weapon poses', async () => {
    const original = await sourceMarine(), merged = await sourceMarine();
    batchActorSkins(merged.scene, merged.animations);
    const a = new T.AnimationMixer(original.scene), b = new T.AnimationMixer(merged.scene);
    for (const name of ['stand', 'run', 'shotgun_delta']) {
      a.stopAllAction(); b.stopAllAction();
      const clip = original.animations.find(clip => clip.name === name)!;
      expect(clip).toBeDefined();
      a.clipAction(clip).reset().play();
      b.clipAction(merged.animations.find(clip => clip.name === name)!).reset().play();
      for (const time of [0, .13, .37]) {
        a.setTime(time); b.setTime(time);
        expect(vertices(merged.scene, true)).toEqual(vertices(original.scene, true));
      }
    }
    a.uncacheRoot(original.scene); b.uncacheRoot(merged.scene);
    disposeModel(original.scene); disposeModel(merged.scene);
  });

  it('shares the four merged template geometries across independently animated actor clones', async () => {
    const asset = await sourceMarine(); registerAsset('marine', asset);
    const a = instantiateAsset('marine'), b = instantiateAsset('marine');
    const aa = skins(a.root), bb = skins(b.root);
    expect(aa).toHaveLength(4); expect(bb).toHaveLength(4);
    aa.forEach((mesh, index) => {
      expect(mesh.geometry).toBe(bb[index].geometry);
      expect(mesh.geometry.userData.sharedAsset).toBe(true);
      expect(mesh.skeleton).not.toBe(bb[index].skeleton);
      expect(mesh.material).not.toBe(bb[index].material);
      expect(mesh.castShadow).toBe(true); expect(mesh.receiveShadow).toBe(true);
    });
    const geometryDisposals = aa.map(mesh => vi.spyOn(mesh.geometry, 'dispose'));
    disposeModel(a.root); disposeModel(b.root);
    for (const spy of geometryDisposals) { expect(spy).not.toHaveBeenCalled(); spy.mockRestore(); }
  });

  it('rejects animated mesh transforms, distinct bind states, bone orders and render flags', () => {
    const root = new T.Group(), bone = new T.Bone(); root.add(bone);
    const skeleton = new T.Skeleton([bone]), material = new T.MeshStandardMaterial();
    const a = primitive(root, material, skeleton), b = primitive(root, material, skeleton);
    a.name = 'animated'; b.name = 'other';
    const clip = new T.AnimationClip('test', 1, [new T.VectorKeyframeTrack('animated.position', [0, 1], [0, 0, 0, 1, 0, 0])]);
    expect(batchActorSkins(root, [clip])).toBe(0);
    b.bindMatrix.elements[12] = .01;
    expect(batchActorSkins(root)).toBe(0);
    b.bindMatrix.copy(a.bindMatrix); b.castShadow = true;
    expect(batchActorSkins(root)).toBe(0);
    b.castShadow = false; b.skeleton = new T.Skeleton([new T.Bone()]);
    expect(batchActorSkins(root)).toBe(0);
    disposeModel(root); material.dispose();
  });
});
