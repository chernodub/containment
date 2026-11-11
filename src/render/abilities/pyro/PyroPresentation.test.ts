import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import type { AbilityEvent, AbilitiesSnapshot, AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { GRAPHICS_PRESETS } from '../../graphicsOptions';
import { ElementKit } from '../ElementKit';
import type { AbilityFrame } from '../types';
import { createPyroPresentation } from './index';

const event = (extra: Partial<AbilityEvent> = {}): AbilityEvent => ({
  rig: 'pyro', element: 'pyro', slot: 'tactical', ability: 'flashfire', phase: 'impact',
  angle: 0, length: 300, arcRadians: 1.22, ...extra,
});
const zone = (extra: Partial<AbilityZoneSnapshot> = {}): AbilityZoneSnapshot => ({
  id: 1, ability: 'napalm-charge', element: 'pyro', shape: 'circle', x: 128, y: 160,
  radius: 120, x2: 128, y2: 160, width: 0, attached: false, remainingMs: 5000, durationMs: 6000, ...extra,
});
const snapshot = (zones: readonly AbilityZoneSnapshot[] = []): AbilitiesSnapshot => ({
  rig: 'pyro', slots: null, zones, deployables: [], dashing: false, invulnerable: false,
  hostileTimeScale: 1, overdrive: { charge: 0, ready: false, active: false, activeRemainingMs: 0 },
});
function setup() {
  const scene = new T.Scene(), kit = new ElementKit(scene), fx = createPyroPresentation(kit);
  const frame: AbilityFrame = { snapshot: snapshot(), dt: 0, visible: true };
  const step = (dt: number) => { frame.dt = dt; kit.begin(dt); fx.update(frame); kit.end(); };
  const dispose = () => { fx.dispose(); kit.dispose(); };
  return { scene, kit, fx, frame, step, dispose };
}
function position(mesh: T.InstancedMesh, index: number): T.Vector3 {
  const matrix = new T.Matrix4(); mesh.getMatrixAt(index, matrix);
  return new T.Vector3().setFromMatrixPosition(matrix);
}

describe('Pyro presentation lifecycle and readability', () => {
  it('keeps a lobbed canister on the captured trajectory and retires it on authoritative impact', () => {
    const { kit, fx, step, dispose } = setup();
    fx.event(event({ ability: 'napalm-charge', slot: 'power', phase: 'cast', targetX: 256, targetY: 128, durationMs: 350 }), 64, 128);
    step(.175);
    const center = position(kit.batches.solid.mesh, 0);
    expect(center.x).toBeCloseTo(5); expect(center.z).toBeCloseTo(4);
    expect(center.y).toBeGreaterThan(2.5);
    fx.event(event({ ability: 'napalm-charge', slot: 'power', targetX: 256, targetY: 128, radius: 80 }), 64, 128);
    step(0);
    expect(kit.batches.solid.mesh.count).toBe(0);
    dispose();
  });

  it('keeps flame positions inside authoritative augmented pools and expires them from snapshots', () => {
    const { kit, frame, step, dispose } = setup();
    frame.snapshot = snapshot([zone({ radius: 80 })]); step(.016);
    const flames = kit.batches.flame.mesh;
    expect(flames.count).toBeGreaterThan(0);
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i);
      expect(Math.hypot(p.x - 4, p.z - 5)).toBeLessThanOrEqual(80 / 32 + .001);
      // Animated lobes are taller than the rejected paper-spike version, but their
      // complete cards remain below a standing actor's head.
      const matrix = new T.Matrix4(); flames.getMatrixAt(i, matrix);
      const scale = new T.Vector3().setFromMatrixScale(matrix);
      expect(p.y + scale.y).toBeLessThan(1.3);
    }
    frame.snapshot = snapshot(); step(0);
    expect(flames.count).toBe(0);
    dispose();
  });

  it('leaves Meltdown open between its rim and body mantle and varies flame silhouettes', () => {
    const { kit, frame, step, dispose } = setup();
    frame.snapshot = snapshot([zone({ ability: 'meltdown', radius: 130, attached: true })]);
    step(.016);
    const flames = kit.batches.flame.mesh, heights = new Set<number>();
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i), distance = Math.hypot(p.x - 4, p.z - 5);
      expect(distance < .6 || distance > 130 / 32 * .75).toBe(true);
      const matrix = new T.Matrix4(); flames.getMatrixAt(i, matrix);
      const scale = new T.Vector3().setFromMatrixScale(matrix);
      heights.add(Math.round(scale.y * 100));
    }
    expect(heights.size).toBeGreaterThan(8);
    dispose();
  });

  it('does not allocate GPU inventory or advance flames and emissions while paused', () => {
    const { scene, kit, frame, step, dispose } = setup();
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); materials.add(o.material as T.Material); } });
    frame.snapshot = snapshot([zone()]); step(.1);
    const before = kit.batches.flame.mesh.instanceMatrix.array.slice(), counts = kit.counts;
    for (let i = 0; i < 20; i++) step(0);
    expect(kit.batches.flame.mesh.instanceMatrix.array).toEqual(before);
    expect(kit.counts.particles).toBe(counts.particles);
    const afterGeometry = new Set<T.BufferGeometry>(), afterMaterials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { afterGeometry.add(o.geometry); afterMaterials.add(o.material as T.Material); } });
    expect(afterGeometry).toEqual(geometry); expect(afterMaterials).toEqual(materials);
    dispose();
  });

  it('bounds repeated spam and simplifies Low while preserving recognizable flame coverage', () => {
    const { kit, fx, frame, step, dispose } = setup();
    for (let i = 0; i < 100; i++) fx.event(event(), 64, 96);
    frame.snapshot = snapshot(Array.from({ length: 24 }, (_, i) => zone({ id: i + 1 })));
    step(.016);
    expect(kit.batches.flame.mesh.count).toBeLessThanOrEqual(kit.batches.flame.capacity);
    const high = kit.batches.flame.mesh.count;
    fx.clear(); kit.clear();
    frame.snapshot = snapshot([zone()]);
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', true); step(.016);
    expect(kit.batches.flame.mesh.count).toBeGreaterThan(0);
    expect(kit.batches.flame.mesh.count).toBeLessThan(high);
    dispose();
  });

  it('ignores non-spatial presses and cleans up idempotently without disposing shared kit resources', () => {
    const { kit, fx, step, dispose } = setup();
    const geometryDisposal = vi.spyOn(kit.batches.flame.mesh.geometry, 'dispose');
    for (const phase of ['denied', 'ready', 'overdrive-ready'] as const) fx.event(event({ phase }), 64, 96);
    step(.016);
    expect(kit.batches.flame.mesh.count).toBe(0); expect(kit.counts.particles).toBe(0);
    fx.event(event(), 64, 96); fx.clear(); step(.016);
    expect(kit.batches.flame.mesh.count).toBe(0);
    fx.dispose(); fx.dispose();
    expect(geometryDisposal).not.toHaveBeenCalled();
    dispose(); expect(geometryDisposal).toHaveBeenCalledOnce();
  });
});
