import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { addRoomPracticals } from '../src/render/lighting/RoomPracticals';
import { disposeModel } from '../src/render/meshParts';

const stepped = [
  { x: 6, y: 6.75 }, { x: 30, y: 6.75 }, { x: 30, y: 12 }, { x: 27, y: 12 },
  { x: 27, y: 20 }, { x: 21, y: 20 }, { x: 21, y: 22 }, { x: 6, y: 22 },
];
type Fixture = { x: number; y: number; z: number; color: number; nativeColor: boolean };

function withinSteppedFloor(x: number, z: number): boolean {
  return x >= 6 && z >= 6.75 && (z <= 12 && x <= 30 || z <= 20 && x <= 27 || z <= 22 && x <= 21);
}

describe('practicals follow physical room boundaries', () => {
  it('insets emitters and housings onto a shifted stepped floor and aligns each diffuser with its edge', () => {
    const world = new T.Group();
    addRoomPracticals(world, 36, 27.5, 'habitation', stepped);
    const fixtures = world.userData.lightFixtures as Fixture[];
    const emitters = world.getObjectByName('wall-practical-diffusers') as T.InstancedMesh;
    const housings = world.getObjectByName('wall-practical-housings') as T.InstancedMesh;
    expect(world.children).toHaveLength(2);
    expect(fixtures.length).toBeGreaterThan(8);
    expect(fixtures.length).toBeLessThanOrEqual(32);
    expect(emitters.count).toBe(fixtures.length);
    expect(housings.count).toBe(fixtures.length);
    const matrix = new T.Matrix4(), position = new T.Vector3(), direction = new T.Vector3();
    const orientations = new Set<string>();
    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];
      expect(withinSteppedFloor(fixture.x, fixture.z)).toBe(true);
      expect(fixture.nativeColor).toBe(true);
      emitters.getMatrixAt(i, matrix);
      expect(matrix.elements.every(Number.isFinite)).toBe(true);
      position.setFromMatrixPosition(matrix);
      expect(position.x).toBeCloseTo(fixture.x);
      expect(position.z).toBeCloseTo(fixture.z);
      direction.set(0, 0, 1).transformDirection(matrix);
      orientations.add(Math.abs(direction.x) > .99 ? 'horizontal' : 'vertical');
      expect(Math.max(Math.abs(direction.x), Math.abs(direction.z))).toBeCloseTo(1);
      housings.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      expect(withinSteppedFloor(position.x, position.z)).toBe(true);
      // Housing centers sit .20 m nearer the same wall than diffuser centers.
      expect(Math.hypot(position.x - fixture.x, position.z - fixture.z)).toBeCloseTo(.2, 5);
    }
    expect(orientations).toEqual(new Set(['horizontal', 'vertical']));
    disposeModel(world);
  });

  it('handles either polygon winding, preserves native warning hues, and respects the 32 fixture cap', () => {
    const forward = new T.Group(), backward = new T.Group();
    addRoomPracticals(forward, 36, 27.5, 'security', stepped);
    addRoomPracticals(backward, 36, 27.5, 'security', [...stepped].reverse());
    const origins = (world: T.Group) => (world.userData.lightFixtures as Fixture[])
      .map(fixture => `${fixture.x.toFixed(3)},${fixture.z.toFixed(3)}`).sort();
    expect(origins(forward)).toEqual(origins(backward));
    for (const world of [forward, backward]) {
      const fixtures = world.userData.lightFixtures as Fixture[];
      expect(new Set(fixtures.map(fixture => fixture.color))).toEqual(new Set([0xe8f1ff, 0xff6650]));
      expect(fixtures.every(fixture => fixture.nativeColor && withinSteppedFloor(fixture.x, fixture.z))).toBe(true);
      disposeModel(world);
    }
    const enormous = new T.Group();
    addRoomPracticals(enormous, 1000, 1000, 'infested', [{ x: 10, y: 10 }, { x: 990, y: 10 }, { x: 990, y: 990 }, { x: 10, y: 990 }]);
    expect(enormous.userData.lightFixtures).toHaveLength(32);
    expect(new Set((enormous.userData.lightFixtures as Fixture[]).map(fixture => fixture.color))).toEqual(new Set([0xdc68ca, 0xa1ef72]));
    disposeModel(enormous);
  });

  it('preserves exact legacy rectangular placement when the optional polygon is omitted', () => {
    const world = new T.Group();
    addRoomPracticals(world, 24, 18, 'infested');
    const fixtures = world.userData.lightFixtures as Fixture[];
    expect(fixtures).toHaveLength(8);
    for (let i = 0; i < fixtures.length; i++) {
      const index = i % 4;
      expect(fixtures[i]).toEqual({
        x: i >= 4 ? 24 - .32 : .32,
        y: .9,
        z: 1.8 + (18 - 3.6) * (index + .5) / 4,
        color: index % 3 === 1 ? 0xdc68ca : 0xa1ef72,
        nativeColor: true,
      });
      const matrix = new T.Matrix4();
      (world.children[1] as T.InstancedMesh).getMatrixAt(i, matrix);
      const expected = new T.Object3D();
      expected.position.set(fixtures[i].x, 1.05, fixtures[i].z);
      expected.scale.set(.26, .52, .37);
      expected.updateMatrix();
      expect(matrix.elements).toEqual(Array.from(new Float32Array(expected.matrix.elements)));
    }
    disposeModel(world);
  });

  it('retires both room draw resources and instance buffers once through the existing owner lifecycle', () => {
    const world = new T.Group();
    addRoomPracticals(world, 36, 27.5, 'habitation', stepped);
    const resources = (world.children as T.InstancedMesh[]).flatMap(mesh => [
      vi.spyOn(mesh.geometry, 'dispose'), vi.spyOn(mesh.material as T.Material, 'dispose'), vi.spyOn(mesh, 'dispose'),
    ]);
    disposeModel(world);
    expect(resources.every(resource => resource.mock.calls.length === 1)).toBe(true);
  });
});
