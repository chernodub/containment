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
  it.each(['high', 'low'] as const)('keeps cone volume while reserving the far-smoke draw for High (%s)', tier => {
    const { kit, fx, step, dispose } = setup();
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    fx.event(event(), 64, 96); step(.15);
    expect(kit.batches.flame.mesh.count).toBeGreaterThan(12);
    if (tier === 'low') expect(kit.batches.smoke.mesh.count).toBe(0);
    else {
      const smoke = kit.batches.smoke.mesh;
      expect(smoke.count).toBeGreaterThan(0);
      expect(smoke.renderOrder).toBeGreaterThan(kit.batches.flame.mesh.renderOrder);
      expect(position(smoke, 0).y).toBeGreaterThanOrEqual(1.6);
    }
    expect(kit.batches.decal.mesh.count).toBe(1); dispose();
  });

  it.each(['high', 'low'] as const)('overlaps broad folds in every cone band through the hot dump, then thins (%s)', tier => {
    const { kit, fx, step, dispose } = setup(), light = vi.spyOn(kit, 'lightAt');
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    fx.event(event({ length: 320, arcRadians: 1.4 }), 64, 96);
    const flames = kit.batches.flame.mesh, matrix = new T.Matrix4();
    let hotAlpha = 0;
    for (const dt of [.03, .12, .18]) {
      step(dt);
      const bands = new Set<string>();
      let wide = 0;
      for (let i = 0; i < flames.count; i++) {
        flames.getMatrixAt(i, matrix);
        const p = new T.Vector3().setFromMatrixPosition(matrix), scale = new T.Vector3().setFromMatrixScale(matrix);
        const dx = p.x - 2, dz = p.z - 3, radius = Math.hypot(dx, dz);
        if (radius < 2 || radius > 9.8) continue;
        const a = Math.atan2(dz, dx);
        bands.add(`${Math.min(3, Math.floor(radius / 2.5))}:${Math.min(4, Math.max(0, Math.floor((a + .7) / 1.4 * 5)))}`);
        if (scale.x * 2 > .85) wide++;
      }
      expect(flames.count).toBeGreaterThanOrEqual(tier === 'high' ? 96 : 35);
      expect(bands.size).toBeGreaterThanOrEqual(tier === 'high' ? 17 : 14);
      expect(wide).toBeGreaterThan(tier === 'high' ? 60 : 20);
      expect(light).toHaveBeenLastCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 0xff7a2e, 28, 11);
      hotAlpha = 0;
      const alpha = flames.geometry.getAttribute('abilityAlpha');
      for (let i = 0; i < flames.count; i++) hotAlpha += alpha.getX(i);
    }
    step(.32);
    let aftermathAlpha = 0;
    const alpha = flames.geometry.getAttribute('abilityAlpha');
    for (let i = 0; i < flames.count; i++) aftermathAlpha += alpha.getX(i);
    expect(aftermathAlpha).toBeLessThan(hotAlpha * .25);
    step(.1); expect(flames.count).toBe(0); dispose();
  });

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
      // Rising fuel tongues leave enemy heads readable and retain gaps between sources.
      const matrix = new T.Matrix4(); flames.getMatrixAt(i, matrix);
      const scale = new T.Vector3().setFromMatrixScale(matrix);
      expect(p.y + scale.y).toBeLessThan(1.8);
    }
    frame.snapshot = snapshot(); step(0);
    expect(flames.count).toBe(0);
    dispose();
  });

  it('spans the real cone with upright varied flames through 350ms and leaves only a sector scar', () => {
    const { kit, fx, step, dispose } = setup(), scar = vi.spyOn(kit, 'scar'), fan = vi.spyOn(kit, 'fireFan');
    fx.event(event({ length: 320, arcRadians: 1.4, angle: .2 }), 64, 96);
    expect(scar).toHaveBeenCalledWith('fan', 2, 3, 10, 0x101619, 8, .2, 10, 1.4);
    step(.15);
    expect(fan).toHaveBeenLastCalledWith(2, 3, 10, .2, 1.4, .85);
    const flames = kit.batches.flame.mesh, bands = new Set<number>(), heights = new Set<number>();
    expect(flames.count).toBeGreaterThanOrEqual(40);
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i), dx = p.x - 2, dz = p.z - 3;
      const radius = Math.hypot(dx, dz), angle = Math.atan2(dz, dx) - .2;
      expect(radius).toBeLessThanOrEqual(10);
      expect(Math.abs(angle)).toBeLessThanOrEqual(.7);
      bands.add(Math.floor(radius / 2));
      const matrix = new T.Matrix4(); flames.getMatrixAt(i, matrix);
      expect(matrix.elements[5]).toBeGreaterThan(0); // Every fire card rises vertically.
      expect(matrix.elements[6]).toBeCloseTo(0);
      // A brief rolling flame volume can crest above enemies; the marine overlay remains separate.
      expect(p.y + matrix.elements[5]).toBeLessThan(3.1);
      heights.add(Math.round(matrix.elements[5] * 100));
    }
    expect(bands.size).toBe(5); expect(heights.size).toBeGreaterThan(12);
    // The only ground instance is the dark aftermath, never a second luminous cone plane.
    expect(kit.batches.decal.mesh.count).toBe(1);
    expect(Math.floor(kit.batches.decal.mesh.geometry.getAttribute('abilityPhase').getX(0))).toBe(3);
    step(.18); expect(flames.count).toBeGreaterThanOrEqual(40);
    step(.5); expect(flames.count).toBe(0); dispose();
  });

  it('keeps a continuous tall fire wall on the real dash strip on both tiers', () => {
    for (const tier of ['high', 'low'] as const) {
      const { kit, frame, step, dispose } = setup();
      kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
      frame.snapshot = snapshot([zone({ ability: 'afterburn', shape: 'strip', x: 64, y: 96, x2: 256, y2: 96, width: 44 })]);
      step(.016);
      const flames = kit.batches.flame.mesh, matrix = new T.Matrix4();
      let tall = 0, lowX = Infinity, highX = -Infinity;
      for (let i = 0; i < flames.count; i++) {
        const p = position(flames, i), scale = new T.Vector3(); flames.getMatrixAt(i, matrix); scale.setFromMatrixScale(matrix);
        expect(p.x).toBeGreaterThanOrEqual(2); expect(p.x).toBeLessThanOrEqual(8);
        expect(Math.abs(p.z - 3)).toBeLessThan(44 / 32 / 2);
        if (scale.y * 2 >= .8) { tall++; lowX = Math.min(lowX, p.x); highX = Math.max(highX, p.x); }
      }
      expect(tall).toBeGreaterThanOrEqual(8);
      // Decorative tips stay inset while spanning both ends; the shared boundary owns exact endpoints.
      expect(lowX).toBeLessThan(2.25); expect(highX).toBeGreaterThan(7.75);
      expect(kit.batches.decal.mesh.count).toBe(0);
      dispose();
    }
  });

  it('layers rising fire in the exact pool and leaves bounded burning footsteps while Meltdown moves', () => {
    const { kit, frame, step, dispose } = setup(), liquid = vi.spyOn(kit, 'liquidFire'), grade = vi.spyOn(kit, 'grade');
    frame.snapshot = snapshot([zone()]); step(.016);
    expect(liquid).toHaveBeenCalledWith(4, 5, 120 / 32, .55);
    frame.snapshot = { ...snapshot([zone({ ability: 'meltdown', attached: true })]), overdrive: { charge: 0, ready: false, active: true, activeRemainingMs: 5000 } };
    frame.game = { player: { x: 128, y: 160, vx: 100, vy: 0, angle: .1 }, bullets: [] } as never;
    step(.2); step(.01); expect(grade).toHaveBeenCalled(); expect(kit.batches.solid.mesh.count).toBeGreaterThan(0);
    for (let i = 0; i < 40; i++) step(.17);
    expect(kit.batches.solid.mesh.count).toBeLessThanOrEqual(12);
    const before = kit.batches.solid.mesh.instanceMatrix.array.slice(); step(0);
    expect(kit.batches.solid.mesh.instanceMatrix.array).toEqual(before);
    fxClear();
    function fxClear() { frame.snapshot = snapshot(); frame.game = undefined; step(2); expect(kit.batches.solid.mesh.count).toBe(0); }
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
