import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import type { AbilitiesSnapshot, AbilityEvent, DeployableSnapshot } from '../../../game/abilities/contract';
import { GRAPHICS_PRESETS } from '../../graphicsOptions';
import { ElementKit } from '../ElementKit';
import type { AbilityFrame } from '../types';
import { createArcPresentation } from './index';

const event = (extra: Partial<AbilityEvent> = {}): AbilityEvent => ({
  rig: 'arc', element: 'arc', slot: 'tactical', ability: 'overload', phase: 'link',
  targetX: 192, targetY: 96, ...extra,
});
const pylon = (extra: Partial<DeployableSnapshot> = {}): DeployableSnapshot => ({
  id: 1, ability: 'tesla-pylon', element: 'arc', kind: 'pylon', x: 128, y: 160,
  angle: .4, length: 0, thickness: 0, radius: 18, remainingMs: 8600, durationMs: 9000,
  health: 180, maxHealth: 180, ...extra,
});
const snapshot = (extra: Partial<AbilitiesSnapshot> = {}): AbilitiesSnapshot => ({
  rig: 'arc', slots: null, zones: [], deployables: [], dashing: false, invulnerable: false,
  hostileTimeScale: 1, overdrive: { charge: 0, ready: false, active: false, activeRemainingMs: 0 }, ...extra,
});
function setup() {
  const scene = new T.Scene(), kit = new ElementKit(scene), fx = createArcPresentation(kit);
  const frame: AbilityFrame = { snapshot: snapshot(), dt: 0, visible: true };
  const step = (dt: number) => { frame.dt = dt; kit.begin(dt); fx.update(frame); kit.end(); };
  const dispose = () => { fx.dispose(); kit.dispose(); };
  return { scene, kit, fx, frame, step, dispose };
}
function position(mesh: T.InstancedMesh, index: number): T.Vector3 {
  const matrix = new T.Matrix4(); mesh.getMatrixAt(index, matrix);
  return new T.Vector3().setFromMatrixPosition(matrix);
}

describe('Arc presentation signatures and lifecycle', () => {
  it('adds a 40ms native-chain hop rhythm using authoritative endpoints', () => {
    const { kit, fx, step, dispose } = setup();
    const beam = vi.spyOn(kit, 'beam');
    fx.event(event(), 64, 96);
    fx.event(event({ targetX: 256, targetY: 128 }), 192, 96);
    fx.event(event({ targetX: 320, targetY: 160 }), 256, 128);
    const cores = beam.mock.calls.filter(call => call[7] === .045);
    expect(cores).toHaveLength(3);
    expect(cores.map(call => call[10])).toEqual([0, .04, .08]);
    expect(cores[1].slice(0, 6)).toEqual([6, .95, 3, 8, .75, 4]);
    step(.01); const early = kit.ribbons.mesh.count;
    step(.08); expect(kit.ribbons.mesh.count).toBeGreaterThan(early);
    step(1); expect(kit.ribbons.mesh.count).toBe(0);
    dispose();
  });

  it('renders pylon base/stem/coil within its actual base radius, then removes it from snapshots', () => {
    const { kit, frame, step, dispose } = setup();
    frame.snapshot = snapshot({ deployables: [pylon()] }); step(0);
    expect(kit.batches.solid.mesh.count).toBeGreaterThan(6);
    expect(kit.ribbons.mesh.count).toBeGreaterThan(50);
    const base = position(kit.batches.solid.mesh, 0);
    expect(base.x).toBe(4); expect(base.z).toBe(5);
    for (let i = 0; i < kit.batches.solid.mesh.count; i++) {
      const p = position(kit.batches.solid.mesh, i);
      expect(Math.hypot(p.x - 4, p.z - 5)).toBeLessThanOrEqual(18 / 32);
    }
    frame.snapshot = snapshot(); step(0);
    expect(kit.batches.solid.mesh.count).toBe(0); expect(kit.ribbons.mesh.count).toBe(0);
    dispose();
  });

  it('uses exact live marine-link endpoints and retains readable cable width on Low', () => {
    const { kit, frame, step, dispose } = setup();
    const ribbon = vi.spyOn(kit, 'ribbon');
    frame.snapshot = snapshot({ links: [{ id: 1, ability: 'tesla-pylon', element: 'arc', x: 32, y: 64, targetX: 192, targetY: 128, width: 28 }] });
    step(0);
    expect(ribbon.mock.calls[0].slice(0, 6)).toEqual([1, 1.5, 2, 6, .85, 4]);
    expect(ribbon).toHaveBeenCalledOnce();
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', false); ribbon.mockClear(); step(0);
    expect(ribbon).toHaveBeenCalledOnce(); expect(ribbon.mock.calls[0][9]).toBe(true);
    expect(ribbon.mock.calls[0][7]).toBe(.025);
    dispose();
  });

  it('retains fixed GPU inventory, freezes poses at zero delta and simplifies the mechanical silhouette on Low', () => {
    const { scene, kit, frame, fx, step, dispose } = setup();
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); materials.add(o.material as T.Material); } });
    frame.snapshot = snapshot({ deployables: [pylon()] }); step(.1);
    const before = kit.batches.solid.mesh.instanceMatrix.array.slice();
    step(0); expect(kit.batches.solid.mesh.instanceMatrix.array).toEqual(before);
    const high = kit.ribbons.mesh.count;
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', true); step(0);
    expect(kit.ribbons.mesh.count).toBeLessThan(high); expect(kit.batches.solid.mesh.count).toBeGreaterThan(6);
    const afterGeometry = new Set<T.BufferGeometry>(), afterMaterials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { afterGeometry.add(o.geometry); afterMaterials.add(o.material as T.Material); } });
    expect(afterGeometry).toEqual(geometry); expect(afterMaterials).toEqual(materials);
    const disposeShared = vi.spyOn(kit, 'dispose'); fx.dispose(); fx.dispose(); expect(disposeShared).not.toHaveBeenCalled();
    dispose();
  });

  it('bounds repeated arcs and keeps denied/ready presses out of the world', () => {
    const { kit, fx, step, dispose } = setup();
    for (const phase of ['denied', 'ready', 'overdrive-ready'] as const) fx.event(event({ phase }), 64, 96);
    step(0); expect(kit.counts.beams).toBe(0); expect(kit.counts.particles).toBe(0);
    for (let i = 0; i < 300; i++) fx.event(event(), 64, 96);
    step(.1); expect(kit.counts.beams).toBeLessThanOrEqual(64); expect(kit.ribbons.mesh.count).toBeLessThanOrEqual(2048);
    fx.clear(); kit.clear(); step(.3); expect(kit.counts.particles).toBe(0); expect(kit.ribbons.mesh.count).toBe(0);
    dispose();
  });

  it('adds an electrical human silhouette for Static Step and retires it promptly', () => {
    const { kit, fx, step, dispose } = setup(), ribbon = vi.spyOn(kit, 'ribbon');
    fx.event(event({ ability: 'static-step', slot: 'dash', phase: 'dash-start', angle: .5 }), 64, 96);
    step(.01); expect(ribbon).toHaveBeenCalledTimes(5);
    const heights = ribbon.mock.calls.flatMap(c => [c[1], c[4]]);
    expect(Math.min(...heights)).toBe(.05); expect(Math.max(...heights)).toBe(1.65);
    for (const c of ribbon.mock.calls) expect(Math.hypot(c[3] - 2, c[5] - 3)).toBeLessThanOrEqual(.421);
    expect(kit.ribbons.mesh.count).toBeGreaterThan(0); expect(kit.ribbons.mesh.count).toBeLessThanOrEqual(30);
    step(.3); expect(kit.ribbons.mesh.count).toBe(0); dispose();
  });

  it('creates activation and reverse expiry ripples only once for Overclock', () => {
    const { kit, fx, step, dispose } = setup();
    const ring = vi.spyOn(kit, 'ring'), camera = vi.spyOn(kit, 'camera');
    fx.event(event({ ability: 'overclock', slot: 'overdrive', phase: 'impact' }), 64, 96);
    expect(ring).toHaveBeenCalledTimes(2); expect(camera).toHaveBeenCalledOnce();
    step(.1); step(.1); expect(camera).toHaveBeenCalledOnce();
    fx.event(event({ ability: 'overclock', slot: 'overdrive', phase: 'end' }), 64, 96);
    expect(ring.mock.calls[2][5]).toBe(true); dispose();
  });

  it('connects Static Step to the observed marine and actual arrival, leaving a ground scorch star', () => {
    const { kit, fx, frame, step, dispose } = setup();
    const ribbon = vi.spyOn(kit, 'ribbon'), scar = vi.spyOn(kit, 'scar');
    frame.game = { player: { x: 144, y: 96 } } as never;
    fx.event(event({ ability: 'static-step', slot: 'dash', phase: 'dash-start', targetX: 400, targetY: 96 }), 64, 96);
    step(.07);
    // Predicted target 400 is never used as a travelled endpoint.
    expect(ribbon.mock.calls.some(call => call[3] === 144 / 32 && call[5] === 3)).toBe(true);
    expect(ribbon.mock.calls.some(call => call[3] === 400 / 32)).toBe(false);
    ribbon.mockClear();
    fx.event(event({ ability: 'static-step', slot: 'dash', phase: 'dash-end', targetX: 192, targetY: 96 }), 64, 96);
    step(.03);
    expect(scar).toHaveBeenCalledWith('star', 6, 3, 1.2, 0x181421, 7, 0);
    expect(ribbon.mock.calls.some(call => call[3] === 6 && call[5] === 3)).toBe(true);
    step(.4); expect(kit.batches.front.mesh.count).toBe(0); dispose();
  });

  it('grounds a small electrical landing corona and aftermath at the authoritative pylon placement', () => {
    const { kit, fx, step, dispose } = setup();
    const front = vi.spyOn(kit, 'front'), draw = vi.spyOn(kit, 'draw'), scar = vi.spyOn(kit, 'scar');
    fx.event(event({ ability: 'tesla-pylon', slot: 'power', phase: 'impact', targetX: 320, targetY: 224 }), 64, 96);
    step(.08);
    expect(front).not.toHaveBeenCalled();
    const corona = draw.mock.calls.filter(call => call[0] === 'decal' && call[11] === 4);
    expect(corona).toHaveLength(1);
    expect(corona[0].slice(1, 4)).toEqual([10, .06, 7]);
    expect(corona[0][4]).toBeLessThanOrEqual(.72);
    expect(corona[0][5]).toBeLessThanOrEqual(.72);
    expect(scar).toHaveBeenCalledWith('star', 10, 7, 1.2, 0x1e182b, 8);
    expect(kit.batches.solid.mesh.count).toBeGreaterThan(0);
    fx.clear(); kit.clear(); step(0); expect(kit.batches.front.mesh.count).toBe(0); dispose();
  });

  it.each(['high', 'low'] as const)('makes sustained Overclock visible on %s without changing hostile endpoints', tier => {
    const { kit, frame, step, dispose } = setup();
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    const grade = vi.spyOn(kit, 'grade'), ribbon = vi.spyOn(kit, 'ribbon'), gust = vi.spyOn(kit, 'gust');
    frame.game = { player: { x: 128, y: 128, vx: 0, vy: 0 }, enemies: { snapshot: { enemies: [
      { x: 256, y: 160, velocityX: 120, velocityY: 0 },
    ] } }, bullets: [{ kind: 'player', x: 160, y: 128, request: { angle: 0 } }] } as never;
    frame.snapshot = snapshot({ hostileTimeScale: .3, overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 4000 } });
    step(.016);
    expect(grade).toHaveBeenLastCalledWith(0, .22);
    expect(ribbon.mock.calls.some(call => call[0] === 8 && call[2] === 5 && call[3] < 8)).toBe(true);
    expect(ribbon.mock.calls.some(call => call[0] === 5 && call[3] <= 3)).toBe(true);
    // Overclock is attached suit/weapon energy and a deck ripple, replacing the old dial shards.
    expect(kit.batches.front.mesh.count).toBe(0);
    expect(kit.batches.shard.mesh.count).toBe(0);
    expect(ribbon.mock.calls.filter(call => Math.hypot(call[0] - 4, call[2] - 4) < .5 && call[1] > .1).length).toBeGreaterThanOrEqual(7);
    expect(gust).toHaveBeenCalledTimes(tier === 'low' ? 3 : 4);
    expect(gust.mock.calls.every(call => call[7] === 0xb79cff)).toBe(true);
    expect(ribbon.mock.calls.some(call => call[1] === 1.52 && (call[7] ?? 0) >= .022 && (call[7] ?? 0) <= .032)).toBe(true);
    expect(kit.batches.ghost.mesh.count).toBe(2);
    const calls = grade.mock.calls.length; frame.snapshot = snapshot(); step(.016);
    expect(grade.mock.calls).toHaveLength(calls); expect(kit.batches.front.mesh.count).toBe(0); dispose();
  });

  it('keeps curved activation and reverse expiry ripples inside their true radius without floating bars', () => {
    const { kit, fx, step, dispose } = setup();
    const volume = vi.spyOn(kit, 'front'), ribbon = vi.spyOn(kit, 'ribbon'), gust = vi.spyOn(kit, 'gust');
    fx.event(event({ ability: 'overclock', slot: 'overdrive', phase: 'impact' }), 64, 96);
    step(.15); expect(volume).not.toHaveBeenCalled(); expect(ribbon).not.toHaveBeenCalled();
    expect(gust).toHaveBeenCalledTimes(4);
    for (const call of gust.mock.calls) {
      const [x, z, length, width, angle] = call;
      expect(call[7]).toBe(0xb79cff);
      for (const side of [-1, 1]) for (const end of [-1, 1]) {
        const px = x + Math.cos(angle) * length * .5 * end - Math.sin(angle) * width * .5 * side;
        const pz = z + Math.sin(angle) * length * .5 * end + Math.cos(angle) * width * .5 * side;
        expect(Math.hypot(px - 2, pz - 3)).toBeLessThanOrEqual(6.001);
      }
    }
    step(1); gust.mockClear();
    fx.event(event({ ability: 'overclock', slot: 'overdrive', phase: 'end' }), 64, 96);
    step(.1); expect(gust).toHaveBeenCalledTimes(4); expect(volume).not.toHaveBeenCalled();
    step(1); expect(kit.ribbons.mesh.count).toBe(0); expect(kit.batches.decal.mesh.count).toBe(0); dispose();
  });

  it.each(['high', 'low'] as const)('keeps slowed-moving hostile echoes visible and bounded on %s, excluding stationary actors', tier => {
    const { kit, frame, step, dispose } = setup();
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    const ribbon = vi.spyOn(kit, 'ribbon');
    frame.game = { player: { x: 128, y: 128, vx: 0, vy: 0 }, enemies: { snapshot: { enemies: [
      { x: 256, y: 160, velocityX: 3, velocityY: 4 },
      { x: 320, y: 160, velocityX: 0, velocityY: 0 },
      { x: 384, y: 160, velocityX: 500, velocityY: 0 },
    ] } }, bullets: [] } as never;
    frame.snapshot = snapshot({ hostileTimeScale: .2, overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 3000 } });
    step(.016);
    const trails = ribbon.mock.calls.filter(call => call[0] === 8 || call[0] === 12);
    expect(trails).toHaveLength(tier === 'low' ? 2 : 4);
    for (const call of trails) expect(Math.hypot(call[3] - call[0], call[5] - call[2])).toBeGreaterThanOrEqual(.45);
    for (const call of trails) expect(Math.hypot(call[3] - call[0], call[5] - call[2])).toBeLessThanOrEqual(1.501);
    expect(ribbon.mock.calls.some(call => call[0] === 10)).toBe(false); dispose();
  });

  it('attaches Overclock gun energy to the visible animated muzzle and follows weapon switches', () => {
    const { kit, frame, step, dispose } = setup();
    const marine = new T.Group(), weaponA = new T.Group(), weaponB = new T.Group();
    const muzzleA = new T.Object3D(), muzzleB = new T.Object3D();
    muzzleA.name = muzzleB.name = 'muzzle'; muzzleA.position.set(1.2, 1.4, .1); muzzleB.position.set(.9, 1.1, .2);
    weaponA.add(muzzleA); weaponB.add(muzzleB); marine.add(weaponA, weaponB); marine.position.set(4, 0, 4); weaponB.visible = false;
    frame.marine = marine;
    frame.game = { player: { x: 128, y: 128, angle: 0, vx: 0, vy: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [] } as never;
    frame.snapshot = snapshot({ hostileTimeScale: .3, overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 4000 } });
    const ribbon = vi.spyOn(kit, 'ribbon'); step(.016);
    expect(ribbon.mock.calls.some(call => call[3] === 5.2 && call[4] === 1.4 && call[5] === 4.1)).toBe(true);
    weaponA.visible = false; weaponB.visible = true; ribbon.mockClear(); step(.016);
    expect(ribbon.mock.calls.some(call => call[3] === 4.9 && call[4] === 1.1 && call[5] === 4.2)).toBe(true);
    expect(ribbon.mock.calls.some(call => call[3] === 5.2 && call[4] === 1.4)).toBe(false);
    dispose();
  });

  it('masks sustained cables/world echoes while preserving attached suit and contact signals', () => {
    const { kit, frame, fx, step, dispose } = setup();
    const samples: { y: number; weight: number; lightning: boolean }[] = [];
    const worldWeights: number[] = [];
    const gust = kit.gust.bind(kit);
    vi.spyOn(kit, 'gust').mockImplementation((...args) => { worldWeights.push(kit.priorityWeight); gust(...args); });
    const ribbon = kit.ribbon.bind(kit);
    vi.spyOn(kit, 'ribbon').mockImplementation((...args) => { samples.push({ y: args[1], weight: kit.priorityWeight, lightning: args[9] ?? true }); ribbon(...args); });
    frame.game = { player: { x: 128, y: 128, angle: 0, vx: 100, vy: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [] } as never;
    frame.snapshot = snapshot({ hostileTimeScale: .3, links: [{ id: 1, ability: 'tesla-pylon', element: 'arc', x: 32, y: 64, targetX: 192, targetY: 128, width: 28 }], overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 4000 } });
    step(.4);
    expect(samples.some(sample => sample.y === 1.5 && sample.weight === 1 && sample.lightning)).toBe(true);
    expect(worldWeights).toHaveLength(4); expect(worldWeights.every(weight => weight === 1)).toBe(true);
    expect(samples.some(sample => sample.y === 1.52 && sample.weight === 0)).toBe(true);
    expect(kit.batches.ghost.mesh.count).toBeGreaterThan(0);
    expect(kit.priorityWeight).toBe(0);
    samples.length = 0;
    fx.event(event({ targetX: 320, targetY: 128 }), 192, 128); step(.016);
    expect(samples.some(sample => sample.y === .55 && sample.weight === 0)).toBe(true);
    dispose();
  });

  it('leaves hostile projectiles to their danger presentation during time dilation', () => {
    const { kit, frame, step, dispose } = setup();
    const ribbon = vi.spyOn(kit, 'ribbon');
    frame.game = { player: { x: 128, y: 128, vx: 0, vy: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [
      { kind: 'hazard', x: 320, y: 224, request: { angle: 0 } },
    ] } as never;
    frame.snapshot = snapshot({ hostileTimeScale: .3, overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 4000 } });
    step(.016);
    expect(ribbon.mock.calls.some(call => call[0] === 10 && call[2] === 7)).toBe(false);
    dispose();
  });

  it.each(['high', 'low'] as const)('freezes Overclock suit, muzzle and pooled marine echoes at zero delta on %s', tier => {
    const { scene, kit, frame, step, dispose } = setup();
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    const inventory = new Set<unknown>();
    scene.traverse(node => { if (node instanceof T.Mesh) { inventory.add(node.geometry); inventory.add(node.material); } });
    frame.game = { player: { x: 128, y: 128, angle: .6, vx: 100, vy: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [] } as never;
    frame.snapshot = snapshot({ hostileTimeScale: .3, overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 4000 } });
    step(.12);
    expect(kit.batches.ghost.mesh.count).toBeGreaterThan(0);
    const ribbons = kit.ribbons.mesh.instanceMatrix.array.slice(), ghosts = kit.batches.ghost.mesh.instanceMatrix.array.slice();
    step(0);
    expect(kit.ribbons.mesh.instanceMatrix.array).toEqual(ribbons);
    expect(kit.batches.ghost.mesh.instanceMatrix.array).toEqual(ghosts);
    const after = new Set<unknown>();
    scene.traverse(node => { if (node instanceof T.Mesh) { after.add(node.geometry); after.add(node.material); } });
    expect(after).toEqual(inventory);
    frame.snapshot = snapshot(); step(.01);
    expect(kit.ribbons.mesh.count).toBe(0); expect(kit.batches.ghost.mesh.count).toBe(0);
    dispose();
  });

  it.each(['high', 'low'] as const)('keeps two separated marine echoes and localized electric armor edges readable on %s', tier => {
    const { kit, frame, step, dispose } = setup();
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    const afterImage = vi.spyOn(kit, 'afterImage'), ribbon = vi.spyOn(kit, 'ribbon'), gust = vi.spyOn(kit, 'gust');
    frame.game = { player: { x: 128, y: 128, angle: 0, vx: 0, vy: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [] } as never;
    frame.snapshot = snapshot({ hostileTimeScale: .3, overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 4000 } });
    step(.016);
    expect(afterImage).toHaveBeenCalledTimes(2);
    const positions = afterImage.mock.calls.map(call => [call[0], call[1]]);
    for (const call of afterImage.mock.calls) {
      expect(Math.hypot(call[0] - 4, call[1] - 4)).toBeGreaterThanOrEqual(.85);
      expect(Math.hypot(call[0] - 4, call[1] - 4)).toBeLessThanOrEqual(1.4);
      expect(call[4]).toBe(.4);
    }
    expect((positions[0][1] - 4) * (positions[1][1] - 4)).toBeLessThan(0);
    const seams = ribbon.mock.calls.filter(call => call[9] === false && call[1] > .1);
    expect(seams).toHaveLength(8);
    for (const call of seams) {
      expect(call[7]).toBeGreaterThanOrEqual(.022); expect(call[7]).toBeLessThanOrEqual(.032);
      expect(Math.hypot(call[0] - 4, call[2] - 4)).toBeLessThan(1);
    }
    afterImage.mockClear(); step(.14);
    expect(afterImage).toHaveBeenCalledTimes(2);
    expect(afterImage.mock.calls.map(call => [call[0], call[1]])).toEqual(positions);
    for (const call of gust.mock.calls) {
      expect(call[2]).toBeLessThan(3.8); expect(call[6]).toBeLessThanOrEqual(.06);
    }
    dispose();
  });

  it.each(['high', 'low'] as const)('keeps refreshed Overclock world ghosts masked after impact grace on %s, including pause and reset', tier => {
    const { kit, frame, step, dispose } = setup();
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    frame.game = { player: { x: 128, y: 128, angle: 0, vx: 0, vy: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [] } as never;
    const active = snapshot({ hostileTimeScale: .3, overdrive: { active: true, charge: 0, ready: false, activeRemainingMs: 4000 } });
    frame.snapshot = active;
    step(.2); step(.2); // Refresh a new ghost while the sustained ultimate is already .4s old.
    const ghosts = kit.batches.ghost.mesh, priority = ghosts.geometry.getAttribute('abilityPriority');
    expect(ghosts.count).toBe(2);
    for (let i = 0; i < ghosts.count; i++) expect(priority.getX(i)).toBe(1);
    const pose = ghosts.instanceMatrix.array.slice();
    step(0);
    expect(ghosts.instanceMatrix.array).toEqual(pose);
    for (let i = 0; i < ghosts.count; i++) expect(priority.getX(i)).toBe(1);
    const attached = kit.ribbons.mesh.geometry.getAttribute('ribbonPriority');
    // The first ribbons are the attached suit rails; their mask exemption remains intact.
    expect(attached.getX(0)).toBe(0); expect(kit.priorityWeight).toBe(0);
    frame.snapshot = snapshot(); step(.016); expect(ghosts.count).toBe(0);
    frame.snapshot = active; step(.016);
    expect(ghosts.count).toBeGreaterThan(0);
    for (let i = 0; i < ghosts.count; i++) expect(priority.getX(i)).toBe(0);
    expect(kit.priorityWeight).toBe(0);
    dispose();
  });

});
