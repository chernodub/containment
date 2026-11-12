import * as T from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { DepthGame } from '../../../DepthGame';
import type { AbilitiesSnapshot, AbilityEvent, AbilitySlotSnapshot } from '../../../game/abilities/contract';
import type { EnemySnapshot } from '../../../game/enemies/EnemySystem';
import { ElementKit } from '../ElementKit';
import { GRAPHICS_PRESETS } from '../../graphicsOptions';
import { createSystemPresentation } from './index';
import { AfflictionBatches, afflictionEffects } from '../../afflictions';

const event = (extra: Partial<AbilityEvent> = {}): AbilityEvent => ({ ability: 'ram', rig: 'breacher', slot: 'dash', element: 'kinetic', phase: 'dash-start', angle: 0, ...extra });
const snapshot = (extra: Partial<AbilitiesSnapshot> = {}): AbilitiesSnapshot => ({ rig: 'breacher', slots: null, overdrive: { active: false, ready: false, charge: 0, activeRemainingMs: 0 }, invulnerable: false, dashing: false, hostileTimeScale: 1, zones: [], deployables: [], ...extra });
const enemy = (extra: Partial<EnemySnapshot> = {}): EnemySnapshot => ({ id: 1, x: 160, y: 128, radius: 24, type: 'brute', health: 100, velocityX: 500, velocityY: 0, baseSpeed: 40, ...extra } as EnemySnapshot);
function fixture() {
  const root = new T.Group(), kit = new ElementKit(root), fx = createSystemPresentation(kit), marine = new T.Group(), body = new T.Group();
  body.position.y = .23; body.rotation.z = .02; body.scale.y = .97; marine.add(body);
  const states = new Map<number, { frozen: boolean; burning: boolean; shocked: boolean; chilled: boolean; chillStacks?: number }>();
  const enemies: EnemySnapshot[] = [];
  const queen = { active: false, defeated: false, x: 256, y: 192, health: 1000 };
  const g = { player: { x: 128, y: 128, angle: 0 }, combat: { snapshot: { dead: false } }, enemies: { snapshot: { enemies } }, boss: { snapshot: queen }, boonStatuses: (id: number) => states.get(id) ?? { frozen: false, burning: false, shocked: false, chilled: false } } as unknown as DepthGame;
  const update = (s = snapshot(), dt = .016) => { kit.begin(dt); fx.update({ snapshot: s, dt, visible: true, game: g, marine }); kit.end(); };
  return { root, kit, fx, marine, body, states, enemies, queen, g, update };
}

describe('V2 common marine and struck feedback', () => {
  it('does not make world effects for denied or ordinary ready presses', () => {
    const { kit, fx, update } = fixture();
    fx.event(event({ phase: 'denied' }), 128, 128); fx.event(event({ phase: 'ready' }), 128, 128); update();
    expect(kit.counts.particles).toBe(0); expect(kit.batches.ghost.mesh.count).toBe(0); expect(kit.batches.spark.mesh.count).toBe(0);
    fx.dispose(); kit.dispose();
  });

  it('draws articulated dash ghosts for 180ms, respects reduced motion, and adds one universal dash kick', () => {
    const { kit, fx, update } = fixture();
    const addTrauma = vi.fn(), punch = vi.fn(), kick = vi.fn();
    kit.bind({ lights: {} as never, distortion: {} as never, camera: { addTrauma, punch, kick } });
    fx.event(event(), 128, 128); update(snapshot(), .01);
    expect(kit.batches.ghost.mesh.count).toBeGreaterThanOrEqual(7); expect(addTrauma).toHaveBeenCalledOnce(); expect(kick).toHaveBeenCalledOnce();
    update(snapshot(), .3); expect(kit.batches.ghost.mesh.count).toBe(0);
    kit.setOptions(GRAPHICS_PRESETS.high, 'high', true); fx.event(event(), 128, 128); update(snapshot(), .01);
    expect(kit.batches.ghost.mesh.count).toBe(0); expect(addTrauma).toHaveBeenCalledOnce();
    fx.dispose(); kit.dispose();
  });

  it('leaves Static Step to electrical body feedback rather than rectangular shared ghosts', () => {
    const { kit, fx, update } = fixture();
    fx.event(event(), 128, 128); update(snapshot(), .01);
    expect(kit.batches.ghost.mesh.count).toBeGreaterThan(0);
    fx.event(event({ ability: 'static-step', rig: 'arc', element: 'arc' }), 128, 128);
    update(snapshot({ rig: 'arc', dashing: true }), .01);
    expect(kit.batches.ghost.mesh.count).toBe(0);
    fx.event(event({ ability: 'static-step', rig: 'arc', element: 'arc', phase: 'dash-end' }), 200, 128);
    update(snapshot({ rig: 'arc' }), .01); expect(kit.batches.ghost.mesh.count).toBe(0);
    fx.dispose(); kit.dispose();
  });

  it('keeps pose transforms absolute across paused refreshes and restores authored values', () => {
    const { kit, fx, body, update } = fixture();
    const cast: AbilitySlotSnapshot = { id: 'seismic-slam', slot: 'tactical', ready: false, charges: 0, maxCharges: 1, cooldownMs: 6000, cooldownRemainingMs: 6000, castRemainingMs: 100, activeRemainingMs: 0, activeMs: 0 };
    const s = snapshot({ slots: { tactical: cast, power: { ...cast, castRemainingMs: 0 }, overdrive: { ...cast, castRemainingMs: 0 }, dash: { ...cast, castRemainingMs: 0 } } });
    update(s, .016); const y = body.position.y, rz = body.rotation.z, sy = body.scale.y;
    expect(y).toBeLessThan(.23); update(s, 0); update(s, 0);
    expect(body.position.y).toBe(y); expect(body.rotation.z).toBe(rz); expect(body.scale.y).toBe(sy);
    fx.clear(); expect(body.position.y).toBe(.23); expect(body.rotation.z).toBe(.02); expect(body.scale.y).toBe(.97);
    fx.dispose(); kit.dispose();
  });

  it('adds a thin invulnerability contour without covering the marine in a solid shell', () => {
    const { kit, fx, update } = fixture(); update(snapshot({ invulnerable: true }), 0);
    expect(kit.ribbons.mesh.count).toBe(10); expect(kit.batches.solid.mesh.count).toBe(0); expect(kit.rings.mesh.count).toBe(1);
    update(snapshot(), 0); expect(kit.ribbons.mesh.count).toBe(0);
    fx.dispose(); kit.dispose();
  });

  it('keeps frozen, burning, stunned and launched feedback distinct and target-bound', () => {
    const { kit, fx, update, states, enemies } = fixture();
    enemies.push(enemy()); states.set(1, { frozen: true, burning: true, shocked: true, chilled: true });
    fx.event(event({ phase: 'impact', ability: 'seismic-slam', slot: 'tactical', targetIds: [1] }), 128, 128); update();
    expect(kit.batches.shard.mesh.count).toBe(7); expect(kit.batches.flame.mesh.count).toBe(3); expect(kit.batches.spark.mesh.count).toBeGreaterThanOrEqual(5); expect(kit.ribbons.mesh.count).toBeGreaterThanOrEqual(12);
    states.clear(); enemies.length = 0; update(snapshot(), .5);
    expect(kit.batches.shard.mesh.count).toBe(0); expect(kit.batches.flame.mesh.count).toBe(0);
    fx.dispose(); kit.dispose();
  });

  it('renders and expires Queen strike receipts at her position, and retains separate status feedback', () => {
    const { kit, fx, queen, states, update } = fixture();
    const burst = vi.spyOn(kit, 'burst').mockImplementation(() => {});
    const draw = vi.spyOn(kit, 'draw');
    fx.event(event({ phase: 'impact', ability: 'cryo-nova', rig: 'cryo', element: 'cryo', targetIds: [-1] }), 128, 128);
    update(snapshot(), 0); expect(kit.batches.shard.mesh.count).toBe(0);
    queen.active = true; update(snapshot(), 0);
    expect(kit.batches.shard.mesh.count).toBe(7); expect(burst).not.toHaveBeenCalled();
    for (const call of draw.mock.calls) {
      expect(Math.hypot(call[1] - queen.x / 32, call[3] - queen.y / 32)).toBeLessThanOrEqual(92 / 32);
    }
    update(); update();
    expect(burst).toHaveBeenCalledOnce();
    expect(burst).toHaveBeenCalledWith(8, 4.5 * .45, 6, 'cryo', 7, 1.2, .3);
    update(snapshot(), .3); expect(kit.batches.shard.mesh.count).toBe(0);
    states.set(-1, { frozen: true, burning: true, shocked: true, chilled: true }); update();
    expect(kit.batches.shard.mesh.count).toBe(7); expect(kit.batches.flame.mesh.count).toBe(3);
    expect(kit.batches.spark.mesh.count).toBe(4);
    queen.defeated = true; update();
    expect(kit.batches.shard.mesh.count).toBe(0); expect(kit.batches.flame.mesh.count).toBe(0);
    expect(kit.batches.spark.mesh.count).toBe(0); expect(burst).toHaveBeenCalledOnce();
    fx.dispose(); kit.dispose();
  });

  it('gives the immovable Queen kinetic impact accents without launch trails or stale receipts', () => {
    const { kit, fx, queen, update } = fixture(); queen.active = true;
    const burst = vi.spyOn(kit, 'burst').mockImplementation(() => {});
    fx.event(event({ phase: 'impact', targetIds: [-1] }), 128, 128); update();
    expect(burst).toHaveBeenCalledOnce(); expect(kit.batches.spark.mesh.count).toBe(1);
    expect(kit.ribbons.mesh.count).toBe(0);
    fx.clear(); update();
    expect(kit.batches.spark.mesh.count).toBe(0); expect(burst).toHaveBeenCalledOnce();
    fx.dispose(); kit.dispose();
  });

  it.each(['high', 'low'] as const)('includes Queen feedback within the existing %s target cap', tier => {
    const { kit, fx, queen, enemies, states, update } = fixture(); queen.active = true;
    kit.setOptions(GRAPHICS_PRESETS[tier], tier, false);
    const frozen = { frozen: true, burning: false, shocked: false, chilled: true };
    states.set(-1, frozen);
    for (let id = 1; id <= 44; id++) { enemies.push(enemy({ id })); states.set(id, frozen); }
    const geometry = kit.batches.shard.mesh.geometry, buffer = kit.batches.shard.mesh.instanceMatrix.array;
    update(snapshot(), 0);
    const targets = tier === 'low' ? 24 : 40, shards = tier === 'low' ? 3 : 7;
    expect(kit.batches.shard.mesh.count).toBe(targets * shards);
    // First shard belongs to the Queen; the crowd uses the remaining budget.
    const position = new T.Vector3(), matrix = new T.Matrix4(); kit.batches.shard.mesh.getMatrixAt(0, matrix); position.setFromMatrixPosition(matrix);
    // The first facet now encases the complete actor; glints retain the outer target-bound ring.
    expect(Math.hypot(position.x - queen.x / 32, position.z - queen.y / 32)).toBeCloseTo(0, 5);
    queen.active = false; update(snapshot(), 0);
    expect(kit.batches.shard.mesh.count).toBe(targets * shards);
    expect(kit.batches.shard.mesh.geometry).toBe(geometry); expect(kit.batches.shard.mesh.instanceMatrix.array).toBe(buffer);
    fx.dispose(); kit.dispose();
  });


  it('progressively accretes chilled frost without an enclosing shell and keeps element signals off the central silhouette', () => {
    const { kit, fx, update, states, enemies } = fixture(); enemies.push(enemy());
    states.set(1, { frozen: false, burning: false, shocked: false, chilled: true, chillStacks: 1 });
    update(snapshot(), 0); const first = kit.batches.shard.mesh.instanceMatrix.array.slice(0, 4 * 16);
    expect(kit.batches.shard.mesh.count).toBe(4); expect(kit.batches.flame.mesh.count).toBe(0);
    states.set(1, { frozen: false, burning: false, shocked: false, chilled: true, chillStacks: 5 });
    update(snapshot(), 0); expect(kit.batches.shard.mesh.instanceMatrix.array.slice(0, 4 * 16)).not.toEqual(first);
    const m = new T.Matrix4(), p = new T.Vector3();
    for (let i = 0; i < 4; i++) { kit.batches.shard.mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m);
      expect(Math.hypot(p.x - 5, p.z - 4)).toBeGreaterThan(.5); }
    expect(Array.from(kit.batches.shard.mesh.geometry.getAttribute('abilityPriority').array).slice(0, 4)).toEqual([0, 0, 0, 0]);
    states.clear(); update(snapshot(), 0); expect(kit.batches.shard.mesh.count).toBe(0); fx.dispose(); kit.dispose();
  });


  it('hands drawn statuses to the shared kit while legacy batches retain overflow and poison', () => {
    const f = fixture(), first = new T.Group(), overflow = new T.Group(), camera = new T.PerspectiveCamera();
    const status = { frozen: false, burning: true, shocked: false, chilled: true, poisoned: true, chillStacks: 1 };
    afflictionEffects(first, 2, 1.5).set(status); afflictionEffects(overflow, 2, 1.5).set(status);
    const legacy = new AfflictionBatches(undefined, 8), fire = legacy.root.children[0] as T.InstancedMesh;
    const poison = legacy.root.children[1] as T.InstancedMesh, ice = legacy.root.children[2] as T.InstancedMesh;
    legacy.update([first, overflow], camera, .2); const fireCount = fire.count, iceCount = ice.count, poisonCount = poison.count;
    f.kit.bind({ lights: {} as never, distortion: {} as never, camera: {} as never, statusActor: id => id === 1 ? { root: first, height: 1.5 } : undefined });
    f.enemies.push(enemy()); f.states.set(1, status); f.update(snapshot(), 0);
    expect(f.kit.statusOwners.has(first)).toBe(true); expect(f.kit.statusOwners.has(overflow)).toBe(false);
    legacy.update([first, overflow], camera, .2, f.kit.statusOwners);
    expect(fire.count).toBe(fireCount / 2); expect(ice.count).toBe(iceCount / 2); expect(poison.count).toBe(poisonCount);
    f.kit.begin(0); legacy.update([first, overflow], camera, .2, f.kit.statusOwners);
    expect(fire.count).toBe(fireCount); expect(ice.count).toBe(iceCount);
    legacy.dispose(); f.fx.dispose(); f.kit.dispose();
  });

  it('has a genuinely simpler Low path, preserves resources on saturation, and clears on death', () => {
    const { kit, fx, update, states, enemies, g } = fixture();
    const geometry = kit.batches.shard.mesh.geometry;
    for (let i = 0; i < 100; i++) fx.event(event({ phase: 'impact', targetIds: [i] }), 128, 128);
    enemies.push(enemy()); states.set(1, { frozen: true, burning: true, shocked: true, chilled: true });
    update(); const high = kit.batches.shard.mesh.count + kit.batches.flame.mesh.count + kit.batches.spark.mesh.count;
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', false); update();
    const low = kit.batches.shard.mesh.count + kit.batches.flame.mesh.count + kit.batches.spark.mesh.count;
    expect(low).toBeLessThan(high); expect(kit.batches.shard.mesh.geometry).toBe(geometry);
    (g.combat.snapshot as { dead: boolean }).dead = true; update(); expect(kit.batches.ghost.mesh.count).toBe(0);
    const dispose = vi.spyOn(geometry, 'dispose'); fx.dispose(); fx.dispose(); expect(dispose).not.toHaveBeenCalled(); kit.dispose(); expect(dispose).toHaveBeenCalledOnce();
  });
});
