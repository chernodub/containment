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
    const { kit, fx, step, dispose } = setup(), scar = vi.spyOn(kit, 'scar'), flow = vi.spyOn(kit, 'flowFlame');
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    fx.event(event({ length: 320, arcRadians: 1.4, angle: .2 }), 64, 96);
    expect(scar).toHaveBeenCalledWith('fan', 2, 3, 10, 0x101619, 8, .2, 10, 1.4);
    step(.15);
    const flames = kit.batches.flame.mesh, matrix = new T.Matrix4();
    let source = 0, far = 0, leaned = 0;
    expect(flames.count).toBe(tier === 'high' ? 20 : 9);
    const reaches = flow.mock.calls.map(call => Math.hypot(call[3] - 2, call[5] - 3));
    expect(Math.max(...reaches)).toBeLessThanOrEqual(9.600001);
    expect(Math.max(...reaches)).toBeGreaterThan(8.5);
    expect(new Set(flow.mock.calls.map(call => call[6])).size).toBeGreaterThan(2);
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i), dx = p.x - 2, dz = p.z - 3, radius = Math.hypot(dx, dz);
      expect(radius).toBeLessThanOrEqual(10);
      expect(Math.abs(Math.atan2(dz, dx) - .2)).toBeLessThanOrEqual(.7);
      if (radius < 1.3) source++;
      if (radius > 4) far++;
      flames.getMatrixAt(i, matrix);
      if (Math.abs(matrix.elements[4]) > .02) leaned++;
    }
    expect(source).toBeGreaterThan(0); expect(far).toBeGreaterThan(1); expect(leaned).toBe(flow.mock.calls.length);
    const phase = flames.geometry.getAttribute('abilityPhase');
    expect(Array.from(phase.array).slice(0, flames.count).filter(value => value >= 328)).toHaveLength(tier === 'high' ? 4 : 2);
    expect(flow).toHaveBeenLastCalledWith(2 + Math.cos(.2) * .3, .95, 3 + Math.sin(.2) * .3,
      2 + Math.cos(.2) * 1.8, .95, 3 + Math.sin(.2) * 1.8, .14 + (1 - (.15 - .05) / .12) * .055, 7, (1 - (.15 - .09) / .28) * .96, true);
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

  it('attaches the pressure throat to the animated visible weapon muzzle and follows weapon switching', () => {
    const { scene, kit, fx, frame, step, dispose } = setup(), flow = vi.spyOn(kit, 'flowFlame');
    const marine = new T.Group(), weaponA = new T.Group(), weaponB = new T.Group();
    const a = new T.Object3D(), b = new T.Object3D(); a.name = b.name = 'muzzle';
    marine.position.set(2, 0, 3); a.position.set(.8, 1.3, .1); b.position.set(.6, 1.15, -.2);
    weaponA.add(a); weaponB.add(b); weaponB.visible = false; marine.add(weaponA, weaponB); scene.add(marine);
    frame.marine = marine; fx.event(event({ angle: 0 }), 64, 96); step(.03);
    expect(flow.mock.calls[0].slice(0, 3)).toEqual([2.8, 1.3, 3.1]); // Main mass and hot throat share one source.
    expect(flow.mock.lastCall!.slice(0, 3)).toEqual([2.8, 1.3, 3.1]);
    a.position.y = 1.4; step(0); expect(flow.mock.lastCall![1]).toBe(1.4);
    weaponA.visible = false; weaponB.visible = true; step(0);
    expect(flow.mock.lastCall!.slice(0, 3)).toEqual([2.6, 1.15, 2.8]);
    expect(flow.mock.lastCall![3]).toBeCloseTo(3.65);
    fx.clear(); step(0); expect(kit.batches.flame.mesh.count).toBe(0); dispose();
  });

  it('hits hot for three frames, then collapses to shaped aftermath without extending the hit cone', () => {
    const { kit, fx, step, dispose } = setup(), light = vi.spyOn(kit, 'lightAt');
    fx.event(event({ length: 320, arcRadians: 1.4 }), 64, 96);
    step(.03);
    expect(light).toHaveBeenLastCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 0xff7a2e, 28, 11);
    const flames = kit.batches.flame.mesh;
    const totalAlpha = () => {
      let sum = 0;
      const alpha = flames.geometry.getAttribute('abilityAlpha');
      for (let i = 0; i < flames.count; i++) sum += alpha.getX(i);
      return sum;
    };
    const hotAlpha = totalAlpha();
    step(.46); expect(totalAlpha()).toBeLessThan(hotAlpha * .25);
    expect(light.mock.lastCall![4]).toBeLessThan(2);
    step(.25); expect(flames.count).toBe(0); dispose();
  });

  it('keeps a lobbed canister on the captured trajectory and retires it on authoritative impact', () => {
    const { kit, fx, step, dispose } = setup();
    fx.event(event({ ability: 'napalm-charge', slot: 'power', phase: 'cast', targetX: 256, targetY: 128, durationMs: 350 }), 64, 128);
    step(.175);
    const center = position(kit.batches.solid.mesh, 0);
    expect(center.x).toBeCloseTo(5); expect(center.z).toBeCloseTo(4); expect(center.y).toBeGreaterThan(2.5);
    fx.event(event({ ability: 'napalm-charge', slot: 'power', targetX: 256, targetY: 128, radius: 80 }), 64, 128);
    step(0);
    // Ballistic liquid uses retained glossy droplets; no metal canister remains after impact.
    expect(kit.batches.solid.mesh.count).toBe(0);
    expect(kit.counts.rings).toBe(0);
    dispose();
  });

  it('throws varied glossy fuel droplets on bounded ballistic impact paths instead of cube splashes', () => {
    const { kit, fx, step, dispose } = setup(), droplets = vi.spyOn(kit, 'fuelDroplet');
    fx.event(event({ ability: 'napalm-charge', slot: 'power', targetX: 256, targetY: 128, radius: 80 }), 64, 128);
    step(.1625);
    expect(droplets).toHaveBeenCalledTimes(9); expect(kit.batches.solid.mesh.count).toBe(0);
    const widths = new Set<number>(), tilts = new Set<number>();
    for (const call of droplets.mock.calls) {
      expect(Math.hypot(call[0] - 8, call[2] - 4)).toBeLessThanOrEqual(2.5);
      expect(call[1]).toBeGreaterThan(.45);
      widths.add(call[3]); tilts.add(call[5]);
    }
    expect(widths.size).toBeGreaterThan(2); expect(tilts.size).toBe(9);
    const firstHeight = droplets.mock.calls[0][1]; droplets.mockClear(); step(.325);
    expect(droplets.mock.calls[0][1]).toBeCloseTo(firstHeight);
    droplets.mockClear(); step(.2); expect(droplets).not.toHaveBeenCalled();
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
    expect(kit.batches.solid.mesh.count).toBe(0);
    const fuel = kit.batches.decal.mesh;
    expect(fuel.count).toBe(1); expect(position(fuel, 0).x).toBeCloseTo(5);
    expect(position(fuel, 0).z).toBeCloseTo(3);
    expect(scale(fuel, 0).x).toBeCloseTo(3);
    expect(scale(fuel, 0).y).toBeLessThan(44 / 32 / 2);
    expect(fuel.geometry.getAttribute('abilityPhase').getX(0)).toBe(9);
    dispose();
  });

  it.each(['high', 'low'] as const)('anchors a few tall Napalm tongues inside the exact augmented liquid pool and retires from snapshots (%s)', tier => {
    const { kit, frame, step, dispose } = setup(), liquid = vi.spyOn(kit, 'liquidFire');
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    frame.snapshot = snapshot([zone({ radius: 80 })]); step(.016);
    expect(liquid).toHaveBeenCalledWith(4, 5, 2.5, .78);
    const flames = kit.batches.flame.mesh;
    expect(flames.count).toBe(tier === 'low' ? 4 : 8);
    let edgeFires = 0;
    let tallest = 0;
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i);
      const distance = Math.hypot(p.x - 4, p.z - 5);
      expect(distance).toBeLessThanOrEqual(2.5);
      if (distance > 2.5 * .7) edgeFires++;
      tallest = Math.max(tallest, p.y + scale(flames, i).y);
    }
    expect(tallest).toBeGreaterThan(1.7);
    expect(edgeFires).toBe(tier === 'low' ? 2 : 6);
    expect(kit.batches.smoke.mesh.count).toBe(tier === 'low' ? 1 : 4);
    frame.snapshot = snapshot(); step(0);
    expect(flames.count).toBe(0); expect(kit.batches.smoke.mesh.count).toBe(0); dispose();
  });

  it.each(['high', 'low'] as const)('charges Meltdown armor and local exhaust while leaving the aura open instead of building a fire ring (%s)', tier => {
    const { kit, frame, step, dispose } = setup(), grade = vi.spyOn(kit, 'grade'), exhaust = vi.spyOn(kit, 'directedFlame');
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    frame.snapshot = snapshot([zone({ ability: 'meltdown', radius: 130, attached: true })]);
    frame.game = { player: { x: 128, y: 160, vx: 0, vy: 0, angle: .1 }, bullets: [] } as never;
    step(.016);
    const flames = kit.batches.flame.mesh;
    expect(flames.count).toBe(tier === 'low' ? 2 : 4); expect(kit.batches.solid.mesh.count).toBe(3); expect(grade).toHaveBeenCalled();
    for (let i = 0; i < flames.count; i++) {
      const p = position(flames, i);
      expect(Math.hypot(p.x - 4, p.z - 5)).toBeLessThan(.65);
      expect(flames.geometry.getAttribute('abilityPriority').getX(i)).toBe(0);
    }
    const shoulderVents = exhaust.mock.calls.filter(call => call[3] >= .3);
    expect(shoulderVents).toHaveLength(2);
    for (const call of shoulderVents) {
      expect(call[1]).toBeGreaterThanOrEqual(1.15); expect(call[4]).toBeGreaterThan(1);
      expect(call[1] + call[4]).toBeLessThanOrEqual(3.9);
      // Exhaust is outboard of the helmet axis and behind the facing direction.
      const dx = call[0] - 4, dz = call[2] - 5;
      expect(dx * Math.cos(.1) + dz * Math.sin(.1)).toBeLessThan(-.25);
      expect(Math.abs(-dx * Math.sin(.1) + dz * Math.cos(.1))).toBeGreaterThanOrEqual(.39);
    }
    const backpackVents = exhaust.mock.calls.filter(call => call[3] < .3);
    expect(backpackVents).toHaveLength(tier === 'low' ? 0 : 2);
    for (const call of backpackVents) { expect(call[1]).toBeGreaterThanOrEqual(1); expect(call[1] + call[4]).toBeLessThan(3.9); }
    expect(shoulderVents[0][4]).not.toBe(shoulderVents[1][4]);
    expect(Math.max(...shoulderVents.map(call => call[1] + call[4]))).toBeGreaterThan(3.5);
    expect(scale(kit.batches.solid.mesh, 0).x).toBeCloseTo(.28);
    expect(scale(kit.batches.solid.mesh, 2).y).toBeGreaterThanOrEqual(.1);
    expect(kit.counts.rings).toBe(0); expect(kit.batches.decal.mesh.count).toBe(0);
    dispose();
  });

  it('puts Meltdown shimmer in a small moving exhaust wake instead of the full aura', () => {
    const { kit, frame, step, dispose } = setup(), distort = vi.spyOn(kit, 'distort');
    frame.snapshot = snapshot([zone({ ability: 'meltdown', radius: 130, attached: true })]);
    frame.game = { player: { x: 128, y: 160, vx: 0, vy: 100, angle: 0 }, bullets: [] } as never;
    step(.7);
    expect(distort).toHaveBeenCalledExactlyOnceWith(4, 5 - .65, .7, .0022, .55, true);
    step(0); expect(distort).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('yields a newly emitted Meltdown wake immediately while attached suit signals retain impact priority', () => {
    const { kit, frame, step, dispose } = setup();
    frame.snapshot = { ...snapshot([zone({ ability: 'meltdown', attached: true })]), overdrive: { charge: 0, ready: false, active: true, activeRemainingMs: 5000 } };
    frame.game = { player: { x: 128, y: 160, vx: 100, vy: 0, angle: .1 }, bullets: [] } as never;
    step(.016);
    const flames = kit.batches.flame.mesh, priority = flames.geometry.getAttribute('abilityPriority');
    expect(priority.getX(0)).toBe(1); // First new wake has no renewed impact grace.
    for (let i = 1; i < flames.count; i++) expect(priority.getX(i)).toBe(0);
    expect(kit.batches.decal.mesh.geometry.getAttribute('abilityPriority').getX(0)).toBe(1);
    expect(kit.batches.solid.mesh.geometry.getAttribute('abilityPriority').getX(0)).toBe(0);
    const before = flames.instanceMatrix.array.slice(); step(0);
    expect(flames.instanceMatrix.array).toEqual(before); expect(priority.getX(0)).toBe(1);
    frame.snapshot = snapshot(); frame.game = undefined; step(2);
    expect(flames.count).toBe(0); expect(kit.batches.solid.mesh.count).toBe(0);
    dispose();
  });

  it('leaves bounded movement wake on Meltdown, freezes it on pause and clears it', () => {
    const { kit, fx, frame, step, dispose } = setup();
    frame.snapshot = { ...snapshot(), overdrive: { charge: 0, ready: false, active: true, activeRemainingMs: 5000 } };
    frame.game = { player: { x: 128, y: 160, vx: 100, vy: 0, angle: .1 }, bullets: [] } as never;
    step(.2); step(.01); expect(kit.batches.decal.mesh.count).toBeGreaterThan(0);
    for (let i = 0; i < 40; i++) step(.17);
    expect(kit.batches.decal.mesh.count).toBeLessThanOrEqual(12);
    const before = kit.batches.decal.mesh.instanceMatrix.array.slice(); step(0);
    expect(kit.batches.decal.mesh.instanceMatrix.array).toEqual(before);
    frame.snapshot = snapshot(); frame.game = undefined; step(2);
    expect(kit.batches.decal.mesh.count).toBe(0);
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
