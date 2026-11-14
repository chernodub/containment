import * as T from 'three';
import { describe, expect, it } from 'vitest';
import type { DepthGame } from '../../DepthGame';
import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import type { AbilitiesSnapshot, AbilityEvent, RigId } from '../../game/abilities/contract';
import { LightPool } from '../lighting/LightPool';
import { DistortionField } from '../post/DistortionField';
import { GRAPHICS_PRESETS } from '../graphicsOptions';
import { AbilityVisuals } from './AbilityVisuals';
import { ABILITY_VFX_LIMITS } from './ElementKit';

describe('full ability-kit resource budgets', () => {
  it('keeps all sixteen signatures within fixed GPU, instance and light inventories under saturation', () => {
    const scene = new T.Scene(), visuals = new AbilityVisuals(scene), lights = new LightPool();
    visuals.bind({ lights, distortion: new DistortionField(), camera: { addTrauma() {}, punch() {}, kick() {} } });
    const marine = new T.Group(); marine.add(new T.Group());
    const enemies = Array.from({ length: 40 }, (_, id) => ({ id, x: 128 + id, y: 128, radius: 24,
      type: 'brute', health: 100, velocityX: 500, velocityY: 10, baseSpeed: 40 }));
    const status = { frozen: true, burning: true, shocked: true, chilled: true };
    const game = { status: 'playing', player: { x: 128, y: 128, angle: .2, vx: 80, vy: 10 },
      combat: { snapshot: { dead: false } }, enemies: { snapshot: { enemies } },
      bullets: [], boonStatuses: () => status } as unknown as DepthGame;
    const snapshot: AbilitiesSnapshot = { rig: 'breacher', slots: null,
      overdrive: { active: true, ready: false, charge: 0, activeRemainingMs: 6000 },
      invulnerable: true, dashing: true, hostileTimeScale: .3,
      zones: Array.from({ length: 24 }, (_, id) => ({ id,
        ability: id % 4 === 0 ? 'whiteout' : id % 4 === 1 ? 'frost-trail' : id % 4 === 2 ? 'napalm-charge' : 'afterburn',
        element: id % 4 < 2 ? 'cryo' : 'pyro', shape: id % 2 ? 'strip' : 'circle', x: 128, y: 128, radius: 140,
        x2: 256, y2: 128, width: 48, attached: false, remainingMs: 5500, durationMs: 6000 })),
      deployables: Array.from({ length: 8 }, (_, id) => ({ id,
        ability: id % 3 === 0 ? 'tesla-pylon' : id % 3 === 1 ? 'glacier' : 'bulwark',
        element: id % 3 === 0 ? 'arc' : id % 3 === 1 ? 'cryo' : 'kinetic',
        kind: id % 3 === 0 ? 'pylon' : id % 3 === 1 ? 'ice-wall' : 'barrier',
        x: 128 + id * 20, y: 160, angle: .2, length: 160, thickness: 20,
        radius: 18, remainingMs: 5500, durationMs: 6000, health: 100, maxHealth: 100 })),
      links: Array.from({ length: 8 }, (_, id) => ({ id, ability: 'tesla-pylon', element: 'arc',
        x: 128, y: 128, targetX: 256, targetY: 160, width: 28 })),
    };
    const receipts: AbilityEvent[] = Object.values(ABILITY_CATALOG).map(definition => ({
      ability: definition.id, rig: definition.rig, slot: definition.slot, element: definition.element,
      phase: definition.slot === 'dash' ? 'dash-start' : 'impact', angle: .2,
      targetX: 256, targetY: 160, durationMs: 220, targetIds: enemies.map(enemy => enemy.id),
    }));
    expect(receipts).toHaveLength(16);
    const meshes: T.Mesh[] = [], geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    scene.traverse(node => {
      if (!(node instanceof T.Mesh)) return;
      meshes.push(node); geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
    });
    // V7 adds exactly two connected weather surfaces and one pooled footprint.
    // Retain the previous inventory caps for every existing owner independently.
    const additions=meshes.filter(mesh=>['whiteout-connected-wind-wall','whiteout-spreading-floor-frost','ability-placement-preview'].includes(mesh.name));
    expect(additions).toHaveLength(3);
    expect(meshes.length-additions.length).toBeLessThanOrEqual(111);
    expect(geometries.size-new Set(additions.map(mesh=>mesh.geometry)).size).toBeLessThanOrEqual(17);
    expect(materials.size-new Set(additions.map(mesh=>mesh.material)).size).toBeLessThanOrEqual(23);
    expect(meshes.length).toBeLessThanOrEqual(114);expect(geometries.size).toBeLessThanOrEqual(20);expect(materials.size).toBeLessThanOrEqual(26);
    const buffers = meshes.filter((mesh): mesh is T.InstancedMesh => mesh instanceof T.InstancedMesh)
      .map(mesh => ({ mesh, matrix: mesh.instanceMatrix.array, color: mesh.instanceColor?.array }));
    const rigs: RigId[] = ['breacher', 'cryo', 'pyro', 'arc'];
    for (const tier of ['high', 'low'] as const) {
      visuals.setOptions(GRAPHICS_PRESETS[tier], tier, false); lights.setQuality(tier);
      for (let frame = 0; frame < 80; frame++) {
        if (frame % 4 === 0) for (const receipt of receipts) {
          if (receipt.slot !== 'dash') visuals.event({ ...receipt, phase: 'cast' }, 128, 128);
          visuals.event(receipt, 128, 128);
          if (receipt.ability === 'overload' || receipt.ability === 'tesla-pylon') visuals.event({ ...receipt, phase: 'link' }, 128, 128);
        }
        lights.update(1 / 60);
        visuals.update({ ...snapshot, rig: rigs[frame % rigs.length] }, 1 / 60, true, game, marine);
        const counts = visuals.kit.counts;
        expect(counts.particles).toBeLessThanOrEqual(tier === 'low' ? 160 : ABILITY_VFX_LIMITS.particles);
        expect(counts.rings).toBeLessThanOrEqual(ABILITY_VFX_LIMITS.rings);
        expect(counts.beams).toBeLessThanOrEqual(ABILITY_VFX_LIMITS.beams);
        expect(counts.peakInstances).toBeLessThanOrEqual(ABILITY_VFX_LIMITS.instances);
        expect(lights.lights.filter(light => light.intensity > 0).length).toBeLessThanOrEqual(9);
        let draws = 0; scene.traverseVisible(node => { if (node instanceof T.Mesh && (!(node instanceof T.InstancedMesh) || node.count > 0)) draws++; });
        expect(draws).toBeLessThanOrEqual(85); // Single shared pressure-front draw, not one per volume.
        for (const { mesh, matrix, color } of buffers) {
          expect(mesh.instanceMatrix.array).toBe(matrix); expect(mesh.instanceColor?.array).toBe(color);
        }
      }
    }
    const after: T.Mesh[] = []; scene.traverse(node => { if (node instanceof T.Mesh) after.push(node); });
    expect(after).toEqual(meshes);
    visuals.clear(); expect(visuals.kit.counts.particles).toBe(0);
    visuals.dispose(); visuals.dispose(); lights.dispose(); expect(scene.children).toHaveLength(0);
  });
});
