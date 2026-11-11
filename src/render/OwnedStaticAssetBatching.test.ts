import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { batchOwnedStaticAsset } from './OwnedStaticAssetBatching';
import { attachRecoveryKit } from './RecoveryKit';
import { RoomModelCache, retireRoomModels } from './RoomModelCache';
import { getStaticColliderParts } from './StaticColliderParts';
import { DeathRagdolls, initDeathPhysics } from './DeathRagdolls';
import { ROOM_TEMPLATES } from '../game/roguelike/roomTemplates';

class Bitmap {
  width = 512;
  height = 512;
  close = vi.fn();
}

async function actualKit() {
  // Exercise Three's real image/texture cache, with only bitmap decoding stubbed.
  vi.stubGlobal('self', globalThis);
  vi.stubGlobal('ImageBitmap', Bitmap);
  vi.stubGlobal('createImageBitmap', async () => new Bitmap());
  const bytes = readFileSync('public/assets/awakening/recovery-kit/room-kit.glb');
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

function meshes(root: T.Object3D) {
  const result: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>[] = [];
  root.traverse(object => { if (object instanceof T.Mesh) result.push(object as typeof result[number]); });
  return result;
}

function materialValues(material: T.Material) {
  return JSON.stringify(Object.entries(material).filter(([key]) => !['uuid', 'version'].includes(key)).map(([key, value]) => {
    if (value instanceof T.Texture) return [key, value.uuid];
    if (value instanceof T.Color || value instanceof T.Vector2 || value instanceof T.Euler) return [key, value.toArray()];
    return [key, value];
  }));
}

function surface(root: T.Object3D) {
  root.updateWorldMatrix(true, true);
  const result = new Map<string, { positions: number[]; normals: number[]; uvs: number[] }>();
  const position = new T.Vector3(), normal = new T.Vector3();
  for (const mesh of meshes(root)) {
    const geometry = mesh.geometry, p = geometry.attributes.position, n = geometry.attributes.normal;
    const uv = geometry.attributes.uv, nm = new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const finish = mesh.material.name, count = geometry.index?.count ?? p.count;
    const values = result.get(finish) ?? { positions: [], normals: [], uvs: [] };
    for (let i = 0; i < count; i++) {
      const index = geometry.index?.getX(i) ?? i;
      position.fromBufferAttribute(p, index).applyMatrix4(mesh.matrixWorld);
      normal.fromBufferAttribute(n, index).applyNormalMatrix(nm);
      values.positions.push(...position.toArray()); values.normals.push(...normal.toArray());
      values.uvs.push(uv.getX(index), uv.getY(index));
    }
    result.set(finish, values);
  }
  return result;
}

function colliderDecisions(root: T.Object3D, partitions = true) {
  root.updateWorldMatrix(true, true);
  const result: { name: string; count: number; proxy: boolean; bounds: number[] }[] = [];
  for (const mesh of meshes(root)) {
    const parts = partitions ? getStaticColliderParts(mesh) : undefined;
    const sources = parts ?? [{ geometry: mesh.geometry, matrix: new T.Matrix4(), name: mesh.name }];
    for (const part of sources) {
      const g = part.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(mesh.matrixWorld, part.matrix));
      g.computeBoundingBox();
      const size = g.boundingBox!.getSize(new T.Vector3());
      const count = g.index?.count ?? g.attributes.position.count;
      result.push({ name: part.name, count, proxy: count > 12288 && size.x < 8 && size.z < 8 && size.y > .15,
        bounds: [...g.boundingBox!.min.toArray(), ...g.boundingBox!.max.toArray()] });
      g.dispose();
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('owned recovery kit finish consolidation', () => {
  it('retains all 21 original corpse collider partitions and the exact fitted console proxy', async () => {
    const asset = await actualKit(), root = asset.scene;
    root.position.set(204 / 32, 0, 700 / 32);
    const originalGeometries = new Set(meshes(root).map(mesh => mesh.geometry));
    const geometryDisposed = vi.spyOn(T.BufferGeometry.prototype, 'dispose');
    const before = colliderDecisions(root);
    expect(before).toHaveLength(21);
    expect(before.filter(value => value.proxy).map(value => value.name)).toEqual(['Batch_02_graphite_powdercoat']);
    batchOwnedStaticAsset(root);
    expect(colliderDecisions(root, false)).toHaveLength(8);
    expect(colliderDecisions(root, false).filter(value => value.proxy)).toHaveLength(0);
    expect(colliderDecisions(root)).toEqual(before);
    await initDeathPhysics();
    const physics = new DeathRagdolls();
    physics.setRoom(ROOM_TEMPLATES['awakening-bay'], root);
    expect(physics.snapshot().staticColliders).toBe(21);
    physics.dispose();
    // Noncached original geometry remains owned by its merged render geometry.
    for (const geometry of originalGeometries) expect(geometryDisposed.mock.contexts.filter(value => value === geometry)).toHaveLength(0);
    retireRoomModels(root); retireRoomModels(root);
    for (const geometry of originalGeometries) expect(geometryDisposed.mock.contexts.filter(value => value === geometry)).toHaveLength(1);
  });

  it('merges the production kit21→8 with identical world surfaces, PBR values, map identities and named anchors', async () => {
    const asset = await actualKit(), root = asset.scene;
    const originals = meshes(root), before = surface(root);
    const finishes = new Map(originals.map(mesh => [mesh.material.name, materialValues(mesh.material)]));
    const named = originals.map(mesh => [mesh.name, mesh.matrix.clone()] as const);
    const triangles = originals.reduce((n, mesh) => n + mesh.geometry.index!.count / 3, 0);
    expect(originals).toHaveLength(21); expect(triangles).toBe(29304);
    expect(batchOwnedStaticAsset(root)).toBe(13);
    expect(meshes(root)).toHaveLength(8);
    expect(new Map(meshes(root).map(mesh => [mesh.material.name, materialValues(mesh.material)]))).toEqual(finishes);
    const after = surface(root);
    expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
    for (const [finish, expected] of before) {
      const actual = after.get(finish)!;
      expect(actual.positions).toHaveLength(expected.positions.length);
      expect(actual.normals).toHaveLength(expected.normals.length);
      expect(actual.uvs).toEqual(expected.uvs);
      let positionError = 0, normalError = 0;
      actual.positions.forEach((value, i) => { positionError = Math.max(positionError, Math.abs(value - expected.positions[i])); });
      actual.normals.forEach((value, i) => { normalError = Math.max(normalError, Math.abs(value - expected.normals[i])); });
      // Applying native TRS to Float32 positions rounds once when baking.
      expect(positionError).toBeLessThan(0.000002);
      expect(normalError).toBeLessThan(0.000001);
    }
    for (const [name, matrix] of named) {
      const anchor = root.getObjectByName(name)!;
      expect(anchor).toBeDefined(); expect(anchor.matrix.equals(matrix)).toBe(true);
      if (!(anchor instanceof T.Mesh)) expect(anchor).toBeInstanceOf(T.Group);
    }
    expect(meshes(root).reduce((n, mesh) => n + mesh.geometry.index!.count / 3, 0)).toBe(triangles);
    expect(batchOwnedStaticAsset(root)).toBe(0);
    retireRoomModels(root);
  });

  it('preserves lease root identity and cache resources while retiring every owned result exactly once', async () => {
    const asset = await actualKit(), spec = { url: 'kit', label: 'kit', maxBytes: 1800000 };
    const cache = new RoomModelCache([spec], async () => asset);
    const templateGeometries = new Set(meshes(asset.scene).map(mesh => mesh.geometry));
    const templateMaterials = new Set(meshes(asset.scene).map(mesh => mesh.material));
    const textures = new Set<T.Texture>();
    templateMaterials.forEach(material => Object.values(material).forEach(value => { if (value instanceof T.Texture) textures.add(value); }));
    const imageClosures = [...textures].map(texture => (texture.image as Bitmap).close);
    const geometryDisposed = vi.spyOn(T.BufferGeometry.prototype, 'dispose');
    const materialDisposed = vi.spyOn(T.Material.prototype, 'dispose');
    const textureDisposed = vi.spyOn(T.Texture.prototype, 'dispose');
    const borrowed = await cache.acquire('kit'), ownedMaterials = new Set(meshes(borrowed).map(mesh => mesh.material));
    const room = new T.Group(), fallback = new T.Group(); fallback.name = 'awakening-kit'; room.add(fallback);
    const owner = attachRecoveryKit(room, vi.fn(), async () => borrowed);
    await owner.ready;
    expect(owner.state).toBe('ready'); expect(room.getObjectByName('recovery-kit')).toBe(borrowed);
    expect(meshes(borrowed)).toHaveLength(8);
    meshes(borrowed).forEach(mesh => { expect(mesh.castShadow).toBe(true); expect(mesh.receiveShadow).toBe(true); });
    const finalGeometries = new Set(meshes(borrowed).map(mesh => mesh.geometry));
    owner.dispose(); owner.dispose();
    for (const material of ownedMaterials) expect(materialDisposed.mock.contexts.filter(value => value === material)).toHaveLength(1);
    for (const geometry of finalGeometries) expect(geometryDisposed.mock.contexts.filter(value => value === geometry)).toHaveLength(templateGeometries.has(geometry) ? 0 : 1);
    for (const geometry of templateGeometries) expect(geometryDisposed.mock.contexts.filter(value => value === geometry)).toHaveLength(0);
    expect(textureDisposed).not.toHaveBeenCalled(); imageClosures.forEach(close => expect(close).not.toHaveBeenCalled());
    cache.dispose(); cache.dispose();
    for (const geometry of templateGeometries) expect(geometryDisposed.mock.contexts.filter(value => value === geometry)).toHaveLength(1);
    for (const material of templateMaterials) expect(materialDisposed.mock.contexts.filter(value => value === material)).toHaveLength(1);
    for (const texture of textures) expect(textureDisposed.mock.contexts.filter(value => value === texture)).toHaveLength(1);
    for (const close of new Set(imageClosures)) expect(close).toHaveBeenCalledTimes(1);
  });

  it('keeps different texture objects, material names/channels, cleanup hooks and live transforms independent', () => {
    const root = new T.Group(), map = new T.Texture(), material = new T.MeshStandardMaterial({ map });
    const add = () => { const mesh = new T.Mesh(new T.BoxGeometry(), material.clone()); root.add(mesh); return mesh; };
    add(); const distinctMap = add(); distinctMap.material.map = map.clone();
    const name = add(); name.material.name = 'separate-role';
    const channel = add(); channel.material.map = map.clone(); channel.material.map.channel = 1;
    const cleanup = add(); cleanup.material.addEventListener('dispose', () => {});
    const live = add(); live.userData.live = true;
    const custom = add(); custom.onBeforeRender = () => {};
    expect(batchOwnedStaticAsset(root)).toBe(0);
    retireRoomModels(root);
  });
});
