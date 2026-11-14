import {describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {VerticalRoofSampler} from './VerticalRoofSampler';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {appendEnvironment, environmentArchitecture, environmentObstacle, shipEnvironment} from '../ShipEnvironments';

function reference(world: T.Object3D, x: number, z: number, ceiling: number) {
  const ray = new T.Raycaster(new T.Vector3(x, 20, z), new T.Vector3(0, -1, 0));
  return ray.intersectObject(world, true).find(hit => hit.point.y > .15 && hit.point.y < ceiling)?.point.y;
}

describe('static vertical roof candidate index', () => {
  it.each([T.FrontSide, T.BackSide, T.DoubleSide])('preserves actual Three hits for side %i, transforms and indexed/nonindexed meshes', side => {
    const world = new T.Group();
    for (let n = 0; n < 12; n++) {
      let geometry: T.BufferGeometry = new T.BoxGeometry(1.7, .4 + n * .08, 1.3);
      if (n % 2) geometry = geometry.toNonIndexed();
      const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({side}));
      mesh.position.set(n % 4 * 2 - 3, n * .3, Math.floor(n / 4) * 2 - 2);
      mesh.rotation.set(.03 * n, .17 * n, -.04 * n); mesh.scale.set(n % 3 ? 1 : -1, 1.1, .9);
      world.add(mesh);
    }
    world.updateWorldMatrix(true, true);
    const sampler = new VerticalRoofSampler(world);
    for (let x = -5; x <= 5; x += .25) for (let z = -4; z <= 4; z += .25) {
      for (const ceiling of [4, 5] as const) {
        const expected = reference(world, x, z, ceiling), actual = sampler.heightAt(x, z, ceiling);
        if (expected === undefined) expect(actual).toBeUndefined();
        else expect(actual).toBeCloseTo(expected, 12);
      }
    }
    sampler.dispose();
  });

  it('retains groups, draw ranges, layers and instanced/morph/custom fallback behavior', () => {
    const world = new T.Group(), material = new T.MeshBasicMaterial();
    const grouped = new T.Mesh(new T.BoxGeometry(3, 1, 3), [material, material, material, material, material, material]);
    grouped.position.y = 2; world.add(grouped);
    const instanced = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), material, 2);
    instanced.setMatrixAt(0, new T.Matrix4().makeTranslation(4, 2, 0));
    instanced.setMatrixAt(1, new T.Matrix4().makeTranslation(-4, 3, 0)); world.add(instanced);
    const ranged = new T.Mesh(new T.BoxGeometry(2, 1, 2), material);
    ranged.geometry.setDrawRange(0, 12); ranged.position.set(0, 1, 4); world.add(ranged);
    const morph = new T.Mesh(new T.BoxGeometry(1, 1, 1), material);
    const changed = morph.geometry.getAttribute('position').clone();
    for (let n = 0; n < changed.count; n++) changed.setY(n, changed.getY(n) + .6);
    morph.geometry.morphAttributes.position = [changed]; morph.updateMorphTargets();
    morph.morphTargetInfluences![0] = .7; morph.position.set(4, 1, 4); world.add(morph);
    const custom = new T.Group();
    custom.raycast = () => false;
    const hiddenByCustom = new T.Mesh(new T.BoxGeometry(1, 1, 1), material);
    hiddenByCustom.position.set(-4, 3, 4); custom.add(hiddenByCustom); world.add(custom);
    const excluded = new T.Mesh(new T.BoxGeometry(10, 1, 10), material);
    excluded.position.y = 3; excluded.layers.set(2); world.add(excluded);
    world.updateWorldMatrix(true, true);
    const sampler = new VerticalRoofSampler(world);
    expect(sampler.diagnostics.fallbackObjects).toBe(4);
    for (const [x, z] of [[0, 0], [4, 0], [-4, 0], [0, 4], [2, 4], [2, 2], [4, 4], [-4, 4]]) {
      expect(sampler.heightAt(x, z, 4)).toEqual(reference(world, x, z, 4));
    }
    sampler.dispose();
  });

  it.each(Object.values(ROOM_TEMPLATES))('$id preserves native nine-point and twenty-five-point roof probes', template => {
    const world = new T.Group(), environment = shipEnvironment(template.id)!;
    for (const [n, rect] of template.obstacles.entries()) {
      appendEnvironment(world, environmentObstacle(environment, {x: rect.x / 32, y: rect.y / 32,
        width: rect.width / 32, height: rect.height / 32}, n, template.id));
    }
    environmentArchitecture(world, environment, template.width / 32, template.height / 32, template.id);
    world.updateWorldMatrix(true, true);
    const sampler = new VerticalRoofSampler(world);
    const patterns = [[4, [.35, .5, .65]], [5, [.18, .35, .5, .65, .82]]] as const;
    for (const rect of template.obstacles) for (const [ceiling, fractions] of patterns) {
      for (const fx of fractions) for (const fz of fractions) {
        const x = (rect.x + rect.width * fx) / 32, z = (rect.y + rect.height * fz) / 32;
        const expected = reference(world, x, z, ceiling), actual = sampler.heightAt(x, z, ceiling);
        if (expected === undefined) expect(actual).toBeUndefined();
        else expect(actual).toBeCloseTo(expected, 12);
      }
    }
    sampler.dispose();
  });

  it('preserves strict height thresholds and exact cell-edge samples', () => {
    const world = new T.Group();
    for (const y of [.15, 4, 5]) {
      const plane = new T.Mesh(new T.PlaneGeometry(8, 8), new T.MeshBasicMaterial({side: T.DoubleSide}));
      plane.rotation.x = -Math.PI / 2; plane.position.y = y; world.add(plane);
    }
    world.updateWorldMatrix(true, true);
    const sampler = new VerticalRoofSampler(world);
    for (const x of [-4, -2, 0, 2, 4]) for (const z of [-4, -2, 0, 2, 4]) {
      expect(sampler.heightAt(x, z, 4)).toEqual(reference(world, x, z, 4));
      expect(sampler.heightAt(x, z, 5)).toEqual(reference(world, x, z, 5));
    }
    sampler.dispose();
  });

  it('retains an existing restrictive box and custom intersection policy', () => {
    const world = new T.Group(), material = new T.MeshBasicMaterial();
    const boxed = new T.Mesh(new T.BoxGeometry(2, 1, 2), material);
    boxed.position.y = 2;
    boxed.geometry.boundingBox = new T.Box3(new T.Vector3(10, -1, 10), new T.Vector3(12, 1, 12));
    const custom = new T.Mesh(new T.BoxGeometry(2, 1, 2), material);
    custom.position.set(4, 2, 0);
    (custom as unknown as {_computeIntersections: () => void})._computeIntersections = () => {};
    world.add(boxed, custom); world.updateWorldMatrix(true, true);
    const sampler = new VerticalRoofSampler(world);
    expect(sampler.diagnostics.fallbackObjects).toBe(1);
    for (const x of [0, 4]) {
      expect(reference(world, x, 0, 4)).toBeUndefined();
      expect(sampler.heightAt(x, 0, 4)).toBeUndefined();
    }
    sampler.dispose();
  });

  it('owns no rendered nodes or source buffers and releases only temporary query geometries', () => {
    const world = new T.Group(), geometry = new T.BoxGeometry(2, 1, 2), material = new T.MeshBasicMaterial();
    const mesh = new T.Mesh(geometry, material); mesh.position.y = 1; world.add(mesh);
    const positions = Array.from(geometry.getAttribute('position').array), indices = Array.from(geometry.index!.array);
    const sourceDispose = vi.spyOn(geometry, 'dispose'), materialDispose = vi.spyOn(material, 'dispose');
    const sampler = new VerticalRoofSampler(world);
    expect(world.children).toEqual([mesh]); sampler.dispose(); sampler.dispose();
    expect(sourceDispose).not.toHaveBeenCalled(); expect(materialDispose).not.toHaveBeenCalled();
    expect(Array.from(geometry.getAttribute('position').array)).toEqual(positions);
    expect(Array.from(geometry.index!.array)).toEqual(indices);
    expect(() => sampler.heightAt(0, 0, 4)).toThrow(/disposed/);
  });
});
