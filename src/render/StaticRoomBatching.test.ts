import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { batchStaticRoom } from './StaticRoomBatching';
import { batch, disposeModel, MAT } from './meshParts';
import { appendEnvironment, environmentObstacle } from './ShipEnvironments';
import { authoredRoom } from './AuthoredRooms';
import { ROOM_TEMPLATES } from '../game/roguelike/roomTemplates';
import type { ShipEnvironment } from './ShipEnvironments';
import { getStaticColliderParts } from './StaticColliderParts';
import { shipArchitectureRoom } from './world/ShipArchitectureRoom';
import { optimizeLocalLights } from './lighting/LocalLightShading';

function finish() {
  const material = new T.MeshStandardMaterial({ color: 0x71828a, roughness: .67, metalness: .2 });
  material.userData.actorMaterial = true;
  return material;
}

function mesh(parent: T.Object3D, material: T.Material = finish()) {
  const result = new T.Mesh(new T.BoxGeometry(1, .2, 2), material);
  result.userData.bakedEnvironment = true;
  result.castShadow = result.receiveShadow = true;
  parent.add(result);
  return result;
}

function vertices(root: T.Object3D) {
  root.updateWorldMatrix(true, true);
  const result: number[][] = [];
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    const geometry = object.geometry, p = geometry.attributes.position, n = geometry.attributes.normal;
    const uv = geometry.attributes.uv, normalMatrix = new T.Matrix3().getNormalMatrix(object.matrixWorld);
    const count = geometry.index?.count ?? p.count;
    for (let i = 0; i < count; i++) {
      const index = geometry.index?.getX(i) ?? i;
      const position = new T.Vector3().fromBufferAttribute(p, index).applyMatrix4(object.matrixWorld);
      const normal = new T.Vector3().fromBufferAttribute(n, index).applyNormalMatrix(normalMatrix);
      result.push([...position.toArray(), ...normal.toArray(), uv.getX(index), uv.getY(index)]);
    }
  });
  return result;
}

function triangles(root: T.Object3D) {
  return vertices(root).map(vertex => vertex.map(value => Math.round(value * 10000)).join(',')).sort();
}

// Nested native models move from local Float32 vertices to a room-local
// Float32 buffer. Compare actual world coordinates/normals/UVs to 10 microns,
// allowing only that unavoidable float bake precision, not changed geometry.
function expectSameVertices(before: number[][], root: T.Object3D) {
  const after = vertices(root);
  expect(after.length).toBe(before.length);
  const cellSize = .001, epsilon = .00001;
  const cells = new Map<string, Map<string, { value: number[]; count: number }>>();
  const cell = (value: number[]) => value.slice(0, 3).map(number => Math.floor(number / cellSize));
  for (const value of before) {
    const key = cell(value).join(','), bucket = cells.get(key) ?? new Map();
    const signature = value.join(','), entry = bucket.get(signature) ?? { value, count: 0 };
    entry.count++; bucket.set(signature, entry); cells.set(key, bucket);
  }
  const offsets = [[0, 0, 0]];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    if (x || y || z) offsets.push([x, y, z]);
  }
  for (const value of after) {
    const origin = cell(value); let matched = false;
    for (const offset of offsets) {
      const bucket = cells.get(origin.map((number, i) => number + offset[i]).join(','));
      const match = bucket && [...bucket.values()].find(entry => entry.count &&
        entry.value.every((number, i) => Math.abs(number - value[i]) < epsilon));
      if (match) { match.count--; matched = true; break; }
    }
    if (!matched) throw Error(`Batched vertex no longer matches native position/normal/UV: ${value.join(',')}`);
  }
}

function genericRoom(id: keyof typeof ROOM_TEMPLATES, environment: ShipEnvironment) {
  const root = new T.Group(), template = ROOM_TEMPLATES[id];
  template.obstacles.forEach((r, index) => appendEnvironment(root, environmentObstacle(environment,
    { x: r.x / 32, y: r.y / 32, width: r.width / 32, height: r.height / 32 }, index, id)));
  // Matches the renderer's first identity-only bake, including flag policy.
  batch(root, true);
  return root;
}

describe('static room finish consolidation', () => {
  it.each(['armory', 'freight-hold', 'transmission-chamber'] as const)(
    '%s batches native rigid fittings without losing a single authored triangle', id => {
      const root = shipArchitectureRoom(id, ROOM_TEMPLATES[id])!;
      const before = vertices(root);
      const stats = batchStaticRoom(root);
      expect(stats.mergedMeshes).toBeGreaterThan(100);
      expect(stats.meshesAfter).toBeLessThanOrEqual(62);
      expectSameVertices(before, root);
      expect(batchStaticRoom(root).mergedMeshes).toBe(0);
      disposeModel(root);
    },
  );

  it('keeps rigid-owner transforms, fixture groups, exact collider parts and excluded subtrees', () => {
    const world = new T.Group(), owner = new T.Group();
    world.add(owner); owner.name = 'l8-equipment'; owner.position.set(5, .2, 9);
    const a = new T.Group(), b = new T.Group(), hidden = new T.Group(), reflected = new T.Group();
    a.position.set(2, 0, -1); a.rotation.y = .3; a.scale.set(1.2, .7, .9);
    b.position.set(-2, 1, 3); b.rotation.y = -.5;
    a.userData.lightFixtures = [{x: 0, y: .7, z: .2}];
    hidden.visible = false; reflected.scale.x = -1; owner.add(a, b, hidden, reflected);
    const first = mesh(a), second = mesh(b), excluded = [mesh(hidden), mesh(reflected), mesh(a)];
    for (const object of [first, second, ...excluded]) delete object.userData.bakedEnvironment;
    excluded[2].onBeforeRender = () => {};
    const before = vertices(world), originals = [first.geometry, second.geometry];
    const result = batchStaticRoom(world);
    expect(result.mergedMeshes).toBe(1); expectSameVertices(before, world);
    expect(a.parent).toBe(owner); expect(b.parent).toBe(owner);
    expect(a.userData.lightFixtures).toEqual([{x: 0, y: .7, z: .2}]);
    expect(excluded.map(mesh => mesh.parent)).toEqual([hidden, reflected, a]);
    const merged = owner.children.find(child => child instanceof T.Mesh) as T.Mesh;
    expect(getStaticColliderParts(merged)!.map(part => part.geometry)).toEqual(originals);
    expect(merged.castShadow).toBe(true); expect(merged.receiveShadow).toBe(true);
    disposeModel(world);
  });

  it('retains original collision partitions and composes them through subsequent render merges', () => {
    const root = new T.Group(), a = mesh(root), b = mesh(root);
    a.position.x = 1; b.position.x = 3;
    const originals = [a.geometry, b.geometry];
    batchStaticRoom(root);
    const first = root.children[0] as T.Mesh;
    expect(getStaticColliderParts(first)!.map(part => part.geometry)).toEqual(originals);
    expect(getStaticColliderParts(first)!.map(part => part.matrix.elements[12])).toEqual([1, 3]);
    first.position.x = 4;
    const c = mesh(root); c.position.x = 9;
    batchStaticRoom(root);
    const parts = getStaticColliderParts(root.children[0] as T.Mesh)!;
    expect(parts.map(part => part.geometry)).toEqual([...originals, c.geometry]);
    expect(parts.map(part => part.matrix.elements[12])).toEqual([5, 7, 9]);
    expect(root.children[0].userData).toEqual({ bakedEnvironment: true });
    disposeModel(root);
  });

  it.each([
    ['manual-control-chamber', 'reactor', 15, 7],
    ['safety-interlock-station', 'engineering', 16, 8],
  ] as const)('%s reduces real duplicate palette draws with identical authored vertices', (id, environment, expectedBefore, expectedAfter) => {
    const root = genericRoom(id, environment), before = triangles(root);
    const stats = batchStaticRoom(root);
    expect(stats.mergedMeshes).toBeGreaterThan(0);
    expect(stats.meshesAfter).toBeLessThan(stats.meshesBefore);
    expect(stats.meshesBefore).toBe(expectedBefore);
    expect(stats.meshesAfter).toBe(expectedAfter);
    expect(triangles(root)).toEqual(before);
    expect(batchStaticRoom(root).mergedMeshes).toBe(0);
    root.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      expect(object.castShadow).toBe(true);
      expect(object.receiveShadow).toBe(true);
      expect(object.frustumCulled).toBe(true);
    });
    disposeModel(root);
  });

  it('retains already-shared infestation palettes without manufacturing a saving', () => {
    const root = genericRoom('infested-workshop', 'infested'), before = triangles(root);
    expect(batchStaticRoom(root).mergedMeshes).toBe(0);
    expect(triangles(root)).toEqual(before);
    disposeModel(root);
  });

  it('preserves separate authored/optional owner roots and unbaked live meshes', () => {
    const root = new T.Group(), room = authoredRoom('awakening-bay', ROOM_TEMPLATES['awakening-bay'])!;
    root.add(room);
    const before = triangles(root), children = [...room.children];
    batchStaticRoom(root);
    expect(triangles(root)).toEqual(before);
    for (const child of children) if (child instanceof T.Group) expect(child.parent).toBe(room);
    const live = mesh(root); delete live.userData.bakedEnvironment;
    const other = mesh(root);
    expect(batchStaticRoom(root).mergedMeshes).toBe(0);
    expect(live.parent).toBe(root); expect(other.parent).toBe(root);
    disposeModel(root);
  });

  it('retains full fitted shear, attributes, parent transforms and cullable bounds', () => {
    const scene = new T.Group(), root = new T.Group();
    root.position.set(4, 2, -3); root.rotation.y = .4; scene.add(root);
    const a = mesh(root), b = mesh(root);
    a.matrixAutoUpdate = false;
    a.matrix.set(1, .2, .3, 2, 0, .8, .1, .4, 0, 0, 1.4, -2, 0, 0, 0, 1);
    b.position.set(2.5, .1, -1.2); b.rotation.y = .6; b.scale.set(.7, 1.2, 1.4);
    const before = triangles(scene), bounds = new T.Box3().setFromObject(root, true);
    const result = batchStaticRoom(root);
    expect(result.mergedMeshes).toBe(1);
    expect(triangles(scene)).toEqual(before);
    const merged = root.children[0] as T.Mesh;
    expect(merged.geometry.boundingBox).not.toBeNull();
    expect(merged.geometry.boundingSphere).not.toBeNull();
    const after = new T.Box3().setFromObject(root, true);
    expect(after.min.distanceTo(bounds.min)).toBeLessThan(.00001);
    expect(after.max.distanceTo(bounds.max)).toBeLessThan(.00001);
    const camera = new T.PerspectiveCamera(60, 1, .1, 100);
    camera.position.copy(after.getCenter(new T.Vector3())).add(new T.Vector3(0, 10, 0));
    camera.lookAt(after.getCenter(new T.Vector3())); camera.updateMatrixWorld();
    const frustum = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    expect(frustum.intersectsObject(merged)).toBe(true);
    disposeModel(root);
  });

  it('keeps distinct names, metadata, exact textures, flags and property differences', () => {
    const root = new T.Group();
    mesh(root);
    const changed = Array.from({ length: 10 }, () => mesh(root));
    changed[0].name = 'authored-hook';
    changed[1].userData.independent = true;
    changed[2].castShadow = false;
    changed[3].receiveShadow = false;
    changed[4].layers.set(2);
    (changed[5].material as T.MeshStandardMaterial).roughness += .0000001;
    (changed[6].material as T.MeshStandardMaterial).map = new T.Texture();
    (changed[7].material as T.MeshStandardMaterial).name = 'independent-finish';
    (changed[8].material as T.MeshStandardMaterial).userData.role = 'independent';
    changed[9].renderOrder = 2;
    expect(batchStaticRoom(root).mergedMeshes).toBe(0);
    (changed[6].material as T.MeshStandardMaterial).map!.dispose();
    disposeModel(root);
  });

  it('leaves transparency, shader hooks, skinning, instances, partial draws and reflections untouched', () => {
    const root = new T.Group();
    for (let i = 0; i < 2; i++) {
      const transparent = mesh(root); transparent.material.transparent = true;
      const hook = mesh(root); hook.material.onBeforeCompile = () => {};
      const callback = mesh(root); callback.onBeforeRender = () => {};
      const partial = mesh(root); partial.geometry.setDrawRange(3, 6);
      const reflected = mesh(root); reflected.scale.x = -1;
      const depthless = mesh(root); depthless.material.depthWrite = false;
      const hashed = mesh(root); hashed.material.alphaHash = true;
      const cyclic = mesh(root); cyclic.userData.self = cyclic.userData;
      const instance = new T.InstancedMesh(new T.BoxGeometry(), finish(), 2);
      instance.userData.bakedEnvironment = true; root.add(instance);
      const skin = new T.SkinnedMesh(new T.BoxGeometry(), finish());
      skin.userData.bakedEnvironment = true; root.add(skin);
    }
    const before = [...root.children];
    expect(batchStaticRoom(root).mergedMeshes).toBe(0);
    expect(root.children).toEqual(before);
    for (const child of [...root.children]) if (child instanceof T.SkinnedMesh) {
      child.geometry.dispose(); (child.material as T.Material).dispose(); child.removeFromParent();
    }
    disposeModel(root);
  });

  it('retires detached allocations once, retains referenced resources, and respects owner boundaries', () => {
    const materialDisposed = vi.spyOn(T.Material.prototype, 'dispose');
    const geometryDisposed = vi.spyOn(T.BufferGeometry.prototype, 'dispose');
    const root = new T.Group(), a = mesh(root), b = mesh(root), excluded = mesh(root, b.material);
    delete excluded.userData.bakedEnvironment;
    excluded.geometry.dispose(); excluded.geometry = b.geometry;
    const oldA = a.geometry, oldB = b.geometry, materialA = a.material, materialB = b.material;
    materialDisposed.mockClear(); geometryDisposed.mockClear();
    const stats = batchStaticRoom(root);
    expect(stats.mergedMeshes).toBe(1);
    expect(stats.retiredGeometries).toBe(1);
    expect(stats.retiredMaterials).toBe(0);
    expect(geometryDisposed.mock.contexts.filter(value => value === oldA)).toHaveLength(1);
    expect(geometryDisposed.mock.contexts.filter(value => value === oldB)).toHaveLength(0);
    const siblingOwner = new T.Group(); root.add(siblingOwner);
    mesh(siblingOwner); mesh(siblingOwner);
    const nested = batchStaticRoom(root);
    expect(nested.retiredMaterials).toBe(1);
    expect(siblingOwner.children).toHaveLength(1);
    disposeModel(root);
    expect(materialDisposed.mock.contexts.filter(value => value === materialA)).toHaveLength(1);
    expect(materialDisposed.mock.contexts.filter(value => value === materialB)).toHaveLength(1);
    expect(geometryDisposed.mock.contexts.filter(value => value === oldB)).toHaveLength(1);
    materialDisposed.mockRestore(); geometryDisposed.mockRestore();
  });
  it('batches later native equipment after retained session finishes gained the room light hook', () => {
    for (const material of Object.values(MAT)) optimizeLocalLights(material);
    for (const id of ['freight-hold', 'transmission-chamber'] as const) {
      const root = shipArchitectureRoom(id, ROOM_TEMPLATES[id])!;
      const before = vertices(root), stats = batchStaticRoom(root);
      expect(stats.mergedMeshes).toBeGreaterThan(100);
      expect(stats.meshesAfter).toBeLessThanOrEqual(11);
      expectSameVertices(before, root);
      disposeModel(root);
    }
  });
});
