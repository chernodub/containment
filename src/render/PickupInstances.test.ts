import * as T from 'three';
import {expect, it, vi} from 'vitest';
import {MAX_ACTIVE_PICKUPS, PICKUP_KINDS, type PickupKind, type PickupSnapshot} from '../game/pickups/PickupSystem';
import {PickupInstances} from './PickupInstances';
import {pickupModel} from './models';
import {disposeModel, geometries, MAT} from './meshParts';
import {ContextResources} from './ContextResources';

const item = (kind: PickupKind, id: number): PickupSnapshot => ({id, kind, x: id * 17 + 96, y: id * 11 + 64, value: 1, ageMs: 0, lifetimeMs: 30000, alpha: .5});

it('matches all five ordinary pickup geometries, finishes, UVs, shadows and transformed vertices', () => {
  const batches = new PickupInstances(), snapshot = PICKUP_KINDS.flatMap((kind, i) => [item(kind, i * 2 + 1), item(kind, i * 2 + 2)]);
  const actual = new T.Matrix4(), expected = new T.Matrix4(), point = new T.Vector3(), reference = new T.Vector3();
  try {
    for (const time of [0, .73, 4.2]) {
      batches.update(snapshot, time);
      for (const kind of PICKUP_KINDS) {
        const source = pickupModel(kind), parts = source.children as T.Mesh[];
        try {
          for (let instance = 0; instance < 2; instance++) {
            const pickup = snapshot.filter(p => p.kind === kind)[instance];
            source.position.set(pickup.x / 32, .26 + Math.sin(time * 2 + pickup.id) * .07, pickup.y / 32);
            source.rotation.y = time * .6;
            source.updateMatrixWorld(true);
            for (let part = 0; part < parts.length; part++) {
              const mesh = batches.root.getObjectByName(`pickup-${kind}-${part}`) as T.InstancedMesh;
              expect(mesh.count).toBe(2); expect(mesh.material).toBe(parts[part].material);
              expect(mesh.castShadow).toBe(parts[part].castShadow); expect(mesh.receiveShadow).toBe(parts[part].receiveShadow);
              for (const name of ['position', 'normal', 'uv']) expect(mesh.geometry.getAttribute(name).array).toEqual(parts[part].geometry.getAttribute(name).array);
              mesh.getMatrixAt(instance, actual); expected.copy(parts[part].matrixWorld);
              actual.elements.forEach((n, i) => expect(n).toBeCloseTo(expected.elements[i], 5));
              const positions = mesh.geometry.getAttribute('position');
              for (let vertex = 0; vertex < positions.count; vertex++) {
                point.fromBufferAttribute(positions, vertex).applyMatrix4(actual);
                reference.fromBufferAttribute(positions, vertex).applyMatrix4(expected);
                expect(point.distanceTo(reference)).toBeLessThan(2e-6);
              }
            }
          }
        } finally { disposeModel(source); }
      }
    }
  } finally { batches.dispose(); }
});

it('retains fixed native capacity and buffers, reuses live upload ranges and makes no empty draws', () => {
  const batches = new PickupInstances(), meshes = batches.root.children as T.InstancedMesh[];
  const inventory = meshes.map(mesh => ({mesh, geometry: mesh.geometry, material: mesh.material, buffer: mesh.instanceMatrix.array}));
  const saturated = Array.from({length: MAX_ACTIVE_PICKUPS + 20}, (_, i) => item('credits', i));
  try {
    expect(meshes.every(mesh => !mesh.visible && mesh.count === 0)).toBe(true);
    batches.update(saturated, 1);
    for (const mesh of meshes) {
      expect(mesh.instanceMatrix.count).toBe(MAX_ACTIVE_PICKUPS);
      expect(mesh.count).toBe(mesh.name.startsWith('pickup-credits-') ? MAX_ACTIVE_PICKUPS : 0);
    }
    const active = meshes.find(mesh => mesh.count > 0)!, range = active.instanceMatrix.updateRanges[0];
    expect(range.count).toBe(MAX_ACTIVE_PICKUPS * 16); active.instanceMatrix.clearUpdateRanges();
    batches.update([item('credits', 99)], 2);
    expect(active.instanceMatrix.updateRanges[0]).toBe(range); expect(range.count).toBe(16);
    const versions = meshes.map(mesh => mesh.instanceMatrix.version);
    batches.update([], 3); expect(meshes.every(mesh => !mesh.visible && mesh.count === 0)).toBe(true);
    expect(meshes.map(mesh => mesh.instanceMatrix.version)).toEqual(versions);
    batches.update(PICKUP_KINDS.map((kind, id) => item(kind, id)), 4); batches.clear();
    expect(meshes.every(mesh => !mesh.visible && mesh.count === 0)).toBe(true);
    expect(batches.root.children).toEqual(meshes);
    for (const entry of inventory) {
      expect(entry.mesh.geometry).toBe(entry.geometry); expect(entry.mesh.material).toBe(entry.material); expect(entry.mesh.instanceMatrix.array).toBe(entry.buffer);
    }
  } finally { batches.dispose(); }
});

it('survives context invalidation and disposes owned resources once without disposing shared finishes/primitives', () => {
  const batches = new PickupInstances(), meshes = [...batches.root.children] as T.InstancedMesh[], resources = new ContextResources();
  const shared = [...Object.values(MAT), ...geometries.values()].map(resource => vi.spyOn(resource, 'dispose'));
  resources.track(batches.root); resources.invalidate();
  const geometryDisposals = meshes.map(mesh => vi.spyOn(mesh.geometry, 'dispose')), instanceDisposals = meshes.map(mesh => vi.spyOn(mesh, 'dispose'));
  try {
    batches.update([item('armor', 2)], .5); expect(meshes.some(mesh => mesh.visible && mesh.count === 1)).toBe(true);
    batches.dispose(); batches.dispose(); batches.update([item('ammo', 3)], 1);
    expect(batches.root.children).toHaveLength(0);
    for (const spy of geometryDisposals) expect(spy).toHaveBeenCalledOnce();
    for (const spy of instanceDisposals) expect(spy).toHaveBeenCalledOnce();
    // Context invalidation retires shared GPU bindings; owner disposal must not retire them again.
    for (const spy of shared) expect(spy.mock.calls.length).toBeLessThanOrEqual(1);
  } finally { for (const spy of [...shared, ...geometryDisposals, ...instanceDisposals]) spy.mockRestore(); batches.dispose(); }
});
