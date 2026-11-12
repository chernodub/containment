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
function scale(mesh: T.InstancedMesh, index: number): T.Vector3 {
  const matrix = new T.Matrix4(); mesh.getMatrixAt(index, matrix);
  return new T.Vector3().setFromMatrixScale(matrix);
}

describe('Pyro presentation lifecycle and readability', () => {
  it.each(['high', 'low'] as const)('streams a directional jet inside the exact cone, with a hot nozzle and downstream smoke (%s)', tier => {
    const { kit, fx, step, dispose } = setup(), scar = vi.spyOn(kit, 'scar');
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    fx.event(event({ length: 320, arcRadians: 1.4, angle: .2 }), 64, 96);
    expect(scar).toHaveBeenCalledWith('fan', 2, 3, 10, 0x101619, 8, .2, 10, 1.4);
    step(.15);
    const flames = kit.batches.flame.mesh, matrix = new T.Matrix4();
    let source = 0, far = 0, leaned = 0;
    expect(flames.count).toBeGreaterThan(tier === 'high' ? 40 : 15);
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i), dx = p.x - 2, dz = p.z - 3, radius = Math.hypot(dx, dz);
      expect(radius).toBeLessThanOrEqual(10);
      expect(Math.abs(Math.atan2(dz, dx) - .2)).toBeLessThanOrEqual(.7);
      if (radius < 1.3) source++;
      if (radius > 6) far++;
      flames.getMatrixAt(i, matrix);
      if (Math.abs(matrix.elements[4]) > .02) leaned++;
    }
    expect(source).toBeGreaterThan(1); expect(far).toBeGreaterThan(2); expect(leaned).toBeGreaterThan(8);
    const smoke = kit.batches.smoke.mesh;
    if (tier === 'low') expect(smoke.count).toBe(0);
    else {
      expect(smoke.count).toBeGreaterThan(0);
      expect(smoke.renderOrder).toBeGreaterThan(flames.renderOrder);
      for (let i = 0; i < smoke.count; i++) {
        const p = position(smoke, i);
        expect(Math.hypot(p.x - 2, p.z - 3)).toBeGreaterThan(6);
        expect(p.y).toBeGreaterThanOrEqual(.8);
      }
    }
    expect(kit.batches.decal.mesh.count).toBe(1);
    expect(Math.floor(kit.batches.decal.mesh.geometry.getAttribute('abilityPhase').getX(0))).toBe(3);
    dispose();
  });

  it('holds the pressure dump for 350ms, then yields and retires without extending the hit cone', () => {
    const { kit, fx, step, dispose } = setup(), light = vi.spyOn(kit, 'lightAt');
    fx.event(event({ length: 320, arcRadians: 1.4 }), 64, 96);
    step(.33);
    expect(light).toHaveBeenLastCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 0xff7a2e, 28, 11);
    const flames = kit.batches.flame.mesh;
    const totalAlpha = () => {
      let sum = 0;
      const alpha = flames.geometry.getAttribute('abilityAlpha');
      for (let i = 0; i < flames.count; i++) sum += alpha.getX(i);
      return sum;
    };
    const hotAlpha = totalAlpha();
    step(.32); expect(totalAlpha()).toBeLessThan(hotAlpha * .25);
    step(.1); expect(flames.count).toBe(0); dispose();
  });

  it('keeps a lobbed canister on the captured trajectory and retires it on authoritative impact', () => {
    const { kit, fx, step, dispose } = setup();
    fx.event(event({ ability: 'napalm-charge', slot: 'power', phase: 'cast', targetX: 256, targetY: 128, durationMs: 350 }), 64, 128);
    step(.175);
    const center = position(kit.batches.solid.mesh, 0);
    expect(center.x).toBeCloseTo(5); expect(center.z).toBeCloseTo(4); expect(center.y).toBeGreaterThan(2.5);
    fx.event(event({ ability: 'napalm-charge', slot: 'power', targetX: 256, targetY: 128, radius: 80 }), 64, 128);
    step(0);
    // New ballistic liquid lobes are solids too; the in-flight rotating metal canister is gone.
    for (let i = 0; i < kit.batches.solid.mesh.count; i++) expect(position(kit.batches.solid.mesh, i).y).toBeLessThan(.2);
    expect(kit.counts.rings).toBe(0);
    dispose();
  });

  it.each(['high', 'low'] as const)('keeps a thin low fuel trail along the real dash strip with directional flames (%s)', tier => {
    const { kit, frame, step, dispose } = setup(), directed = vi.spyOn(kit, 'directedFlame');
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    frame.snapshot = snapshot([zone({ ability: 'afterburn', shape: 'strip', x: 64, y: 96, x2: 256, y2: 96, width: 44 })]);
    step(.016);
    const flames = kit.batches.flame.mesh;
    let lowX = Infinity, highX = -Infinity;
    expect(flames.count).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i);
      expect(p.x).toBeGreaterThanOrEqual(2); expect(p.x).toBeLessThanOrEqual(8);
      expect(Math.abs(p.z - 3)).toBeLessThan(44 / 32 / 2);
      expect(p.y + scale(flames, i).y).toBeLessThan(.7);
      lowX = Math.min(lowX, p.x); highX = Math.max(highX, p.x);
    }
    expect(lowX).toBeLessThan(2.25); expect(highX).toBeGreaterThan(7.75);
    expect(directed).toHaveBeenCalledWith(expect.any(Number), .045, expect.any(Number), expect.any(Number), expect.any(Number), 0, 1.5, expect.any(Number), expect.any(Number), expect.any(Boolean));
    for (let i = 0; i < kit.batches.solid.mesh.count; i++) expect(scale(kit.batches.solid.mesh, i).y).toBeCloseTo(.025);
    dispose();
  });

  it.each(['high', 'low'] as const)('anchors a few tall Napalm tongues inside the exact augmented liquid pool and retires from snapshots (%s)', tier => {
    const { kit, frame, step, dispose } = setup(), liquid = vi.spyOn(kit, 'liquidFire');
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    frame.snapshot = snapshot([zone({ radius: 80 })]); step(.016);
    expect(liquid).toHaveBeenCalledWith(4, 5, 2.5, .78);
    const flames = kit.batches.flame.mesh;
    expect(flames.count).toBe(tier === 'low' ? 2 : 4);
    let tallest = 0;
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i);
      expect(Math.hypot(p.x - 4, p.z - 5)).toBeLessThanOrEqual(2.5);
      tallest = Math.max(tallest, p.y + scale(flames, i).y);
    }
    expect(tallest).toBeGreaterThan(1.7);
    expect(kit.batches.smoke.mesh.count).toBe(tier === 'low' ? 1 : 4);
    frame.snapshot = snapshot(); step(0);
    expect(flames.count).toBe(0); expect(kit.batches.smoke.mesh.count).toBe(0); dispose();
  });

  it('charges Meltdown armor and local exhaust while leaving the aura open instead of building a fire ring', () => {
    const { kit, frame, step, dispose } = setup(), grade = vi.spyOn(kit, 'grade');
    frame.snapshot = snapshot([zone({ ability: 'meltdown', radius: 130, attached: true })]);
    frame.game = { player: { x: 128, y: 160, vx: 0, vy: 0, angle: .1 }, bullets: [] } as never;
    step(.016);
    const flames = kit.batches.flame.mesh;
    expect(flames.count).toBe(4); expect(kit.batches.solid.mesh.count).toBe(3); expect(grade).toHaveBeenCalled();
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i);
      expect(Math.hypot(p.x - 4, p.z - 5)).toBeLessThan(.6);
      expect(flames.geometry.getAttribute('abilityPriority').getX(i)).toBe(0);
    }
    expect(kit.counts.rings).toBe(0); expect(kit.batches.decal.mesh.count).toBe(0);
    dispose();
  });

  it('leaves bounded movement wake on Meltdown, freezes it on pause and clears it', () => {
    const { kit, fx, frame, step, dispose } = setup();
    frame.snapshot = { ...snapshot(), overdrive: { charge: 0, ready: false, active: true, activeRemainingMs: 5000 } };
    frame.game = { player: { x: 128, y: 160, vx: 100, vy: 0, angle: .1 }, bullets: [] } as never;
    step(.2); step(.01); expect(kit.batches.solid.mesh.count).toBeGreaterThan(0);
    for (let i = 0; i < 40; i++) step(.17);
    expect(kit.batches.solid.mesh.count).toBeLessThanOrEqual(12);
    const before = kit.batches.solid.mesh.instanceMatrix.array.slice(); step(0);
    expect(kit.batches.solid.mesh.instanceMatrix.array).toEqual(before);
    frame.snapshot = snapshot(); frame.game = undefined; step(2);
    expect(kit.batches.solid.mesh.count).toBe(0);
    fx.clear(); dispose();
  });

  it('marks sustained fuel for priority masking after the impact grace and resets shared state', () => {
    const { kit, frame, step, dispose } = setup();
    frame.snapshot = snapshot([zone({ remainingMs: 5900 })]); step(.016);
    expect(kit.batches.flame.mesh.geometry.getAttribute('abilityPriority').getX(0)).toBe(0);
    frame.snapshot = snapshot([zone({ remainingMs: 5500 })]); step(.016);
    expect(kit.batches.flame.mesh.geometry.getAttribute('abilityPriority').getX(0)).toBe(1);
    expect(kit.priorityWeight).toBe(0); frame.snapshot = undefined; step(0); expect(kit.priorityWeight).toBe(0);
    dispose();
  });

  it('does not allocate GPU inventory or advance flames and emissions while paused', () => {
    const { scene, kit, frame, step, dispose } = setup();
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); materials.add(o.material as T.Material); } });
    frame.snapshot = snapshot([zone()]); step(.1);
    const before = kit.batches.flame.mesh.instanceMatrix.array.slice(), counts = kit.counts;
    for (let i = 0; i < 20; i++) step(0);
    expect(kit.batches.flame.mesh.instanceMatrix.array).toEqual(before); expect(kit.counts.particles).toBe(counts.particles);
    const afterGeometry = new Set<T.BufferGeometry>(), afterMaterials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { afterGeometry.add(o.geometry); afterMaterials.add(o.material as T.Material); } });
    expect(afterGeometry).toEqual(geometry); expect(afterMaterials).toEqual(materials); dispose();
  });

  it('bounds repeated spam and simplifies Low while preserving all source signatures', () => {
    const { kit, fx, frame, step, dispose } = setup();
    for (let i = 0; i < 100; i++) fx.event(event(), 64, 96);
    frame.snapshot = snapshot(Array.from({ length: 24 }, (_, i) => zone({ id: i + 1 }))); step(.016);
    expect(kit.batches.flame.mesh.count).toBeLessThanOrEqual(kit.batches.flame.capacity);
    const high = kit.batches.flame.mesh.count;
    fx.clear(); kit.clear(); frame.snapshot = snapshot([zone()]);
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', true); step(.016);
    expect(kit.batches.flame.mesh.count).toBeGreaterThan(0); expect(kit.batches.flame.mesh.count).toBeLessThan(high);
    dispose();
  });

  it('ignores non-spatial presses and cleans up idempotently without disposing shared kit resources', () => {
    const { kit, fx, step, dispose } = setup(), geometryDisposal = vi.spyOn(kit.batches.flame.mesh.geometry, 'dispose');
    for (const phase of ['denied', 'ready', 'overdrive-ready'] as const) fx.event(event({ phase }), 64, 96);
    step(.016); expect(kit.batches.flame.mesh.count).toBe(0); expect(kit.counts.particles).toBe(0);
    fx.event(event(), 64, 96); fx.clear(); step(.016); expect(kit.batches.flame.mesh.count).toBe(0);
    fx.dispose(); fx.dispose(); expect(geometryDisposal).not.toHaveBeenCalled();
    dispose(); expect(geometryDisposal).toHaveBeenCalledOnce();
  });
});
