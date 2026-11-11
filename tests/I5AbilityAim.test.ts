import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {AbilitySystem, type AbilityHost, type AbilityPoint} from '../src/game/abilities/AbilitySystem';
import {ABILITY_CATALOG} from '../src/game/abilities/catalog';
import type {AbilityId, AbilitySlot, RigId} from '../src/game/abilities/contract';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {chooseAbilityAim, observeAbilityAims, type AbilityAim, type AimEnemy, type AimQueries} from '../scripts/nextgen/playtest/ability-aim';

const origin = Object.freeze({x: 0, y: 0});
const open: AimQueries = {visible: () => true, traverse: () => true};
function enemy(id: number, x: number, y = 0): AimEnemy {
  return {id, x, y, health: 1_000_000, clear: true, visible: true};
}
function polar(id: number, radius: number, angle: number) {
  return enemy(id, Math.cos(angle) * radius, Math.sin(angle) * radius);
}
function aim(id: AbilityId, enemies: readonly AimEnemy[], queries: AimQueries = open) {
  return chooseAbilityAim(ABILITY_CATALOG[id], origin, enemies, queries);
}
/** Real acceptance, cast boundaries and hit queries; only the world/targets are stationary. */
function runtime(rig: RigId, observed: readonly AimEnemy[], queries: AimQueries = open) {
  const player = {x: 0, y: 0, radius: 16, angle: 0, vx: 0, vy: 0};
  const targets = observed.map(e => ({...e, radius: 14}));
  const hits: number[] = [];
  const host: AbilityHost = {
    player: () => player, targets: () => targets,
    visible: queries.visible, traverse: queries.traverse,
    movePlayer: (dx, dy) => { player.x += dx; player.y += dy; },
    damage: (t, amount) => { hits.push(t.id); targets.find(e => e.id === t.id)!.health -= amount; return false; },
    statuses: () => ({chilled: false, frozen: false}), status: () => {},
    launch: () => {}, arc: () => {}, has: id => queries.has?.(id) ?? false,
    reload: () => {}, emit: () => {},
  };
  const system = new AbilitySystem(host);
  system.setRig(rig, 1);
  function cast(slot: AbilitySlot, plan: AbilityAim, ms: number) {
    const resolved = queries.resolveAim?.(plan) ?? plan;
    player.angle = Math.atan2(resolved.y, resolved.x);
    system.setIntent(0, 0, resolved);
    expect(system.use(slot)).toBe(true);
    for (let left = ms; left > 0; left -= 25) system.update(Math.min(25, left));
    return [...new Set(hits)].sort((a, b) => a - b);
  }
  return {system, targets, player, hits, cast};
}

describe('I5 observed catalog aiming', () => {
  it('aims Flashfire at the crawler 150 away instead of a spitter 360 away', () => {
    const enemies = [enemy(1, 360), enemy(2, 0, 150)];
    const plan = aim('flashfire', enemies)!;
    expect(plan.targets).toEqual([2]);
    expect(runtime('pyro', enemies).cast('tactical', plan, 80)).toEqual([2]);
  });

  it('maximizes cone coverage rather than following the nearest or first enemy', () => {
    const enemies = [polar(1, 100, -2), polar(2, 230, .2), polar(3, 250, .9), polar(4, 290, 1.1)];
    const plan = aim('flashfire', enemies)!;
    expect(plan.targets).toEqual([2, 3, 4]);
    expect(runtime('pyro', enemies).cast('tactical', plan, 80)).toEqual(plan.targets);
  });

  it('can cover both exact cone edges without predicting a target outside the actual cone', () => {
    // atan2 of these coordinates is inside the exact runtime bound (no test epsilon).
    const enemies = [enemy(1, 150, -150 * Math.tan(.61)), enemy(2, 150, 150 * Math.tan(.61))];
    expect(runtime('pyro', enemies).cast('tactical', {x: 300, y: 0, angle: 0, targets: [1, 2]}, 80)).toEqual([1, 2]);
    const plan = aim('flashfire', enemies)!;
    expect(plan.targets).toEqual([1, 2]);
    expect(runtime('pyro', enemies).cast('tactical', plan, 80)).toEqual(plan.targets);
  });

  it('rejects an entirely out-of-range cone and does not inflate it by enemy radius', () => {
    expect(aim('flashfire', [enemy(1, 300.001)])).toBeNull();
    expect(aim('flashfire', [enemy(1, 300)])?.targets).toEqual([1]);
  });

  it('maximizes the real cone plus Scorched Fan ground coverage', () => {
    const enemies = [polar(1, 100, -.65), polar(2, 100, 0), polar(3, 100, .65)];
    const queries = {...open, has: (id: string) => id === 'scorched-fan'};
    // A straight-ahead cone plus its 120-radius ground zone reaches all three.
    const witness = {x: 300, y: 0, angle: 0, targets: [1, 2, 3]};
    expect(runtime('pyro', enemies, queries).cast('tactical', witness, 330)).toEqual([1, 2, 3]);
    const plan = aim('flashfire', enemies, queries)!;
    expect(plan.targets).toEqual([1, 2, 3]);
    expect(runtime('pyro', enemies, queries).cast('tactical', plan, 330)).toEqual(plan.targets);
  });

  it('uses the actual finite 900 by 44 Railbreaker beam', () => {
    // Resolver fixes the actual direction, isolating width and longitudinal endpoints.
    const queries = {...open, resolveAim: () => ({x: 900, y: 0})};
    const enemies = [enemy(1, 100, 22), enemy(2, 900), enemy(3, 100, 22.001), enemy(4, 900.001), enemy(5, -1)];
    const plan = aim('railbreaker', enemies, queries)!;
    expect(plan.targets).toEqual([1, 2]);
    expect(runtime('breacher', enemies, queries).cast('overdrive', plan, 600)).toEqual([1, 2]);
  });

  it('finds a beam through a larger off-axis group', () => {
    const enemies = [enemy(1, 180, -100), enemy(2, 150, 150), enemy(3, 300, 300), enemy(4, 600, 600)];
    const plan = aim('railbreaker', enemies)!;
    expect(plan.targets).toEqual([2, 3, 4]);
    expect(runtime('breacher', enemies).cast('overdrive', plan, 600)).toEqual(plan.targets);
  });

  it('finds a beam maximum bounded by its finite end face as well as its side faces', () => {
    const enemies = [polar(1, 900.2, 0), polar(2, 900.2, .0435)];
    const angle = .0435 / 2;
    const witness = {x: 900 * Math.cos(angle), y: 900 * Math.sin(angle), angle, targets: [1, 2]};
    expect(runtime('breacher', enemies).cast('overdrive', witness, 600)).toEqual([1, 2]);
    const plan = aim('railbreaker', enemies)!;
    expect(plan.targets).toEqual([1, 2]);
    expect(runtime('breacher', enemies).cast('overdrive', plan, 600)).toEqual([1, 2]);
  });

  it('places the circle between enemies to cover both rather than centering one enemy', () => {
    const enemies = [enemy(1, 300, -110), enemy(2, 300, 110)];
    const plan = aim('napalm-charge', enemies)!;
    expect(plan.targets).toEqual([1, 2]);
    expect(runtime('pyro', enemies).cast('power', plan, 600)).toEqual(plan.targets);
  });

  it('clamps a point cast to 480 while using the real 120 radius beyond cast range', () => {
    const enemies = [enemy(1, 590)];
    const plan = aim('napalm-charge', enemies)!;
    expect(Math.hypot(plan.x, plan.y)).toBeLessThanOrEqual(480.00000001);
    expect(plan.targets).toEqual([1]);
    expect(runtime('pyro', enemies).cast('power', plan, 600)).toEqual([1]);
    expect(aim('napalm-charge', [enemy(1, 600.001)])).toBeNull();
  });

  it('checks both player-to-placement and placement-to-victim sight lines', () => {
    const enemies = [enemy(1, 300)];
    expect(aim('napalm-charge', enemies, {...open, visible: (from) => from === origin})).toBeNull();
    expect(aim('napalm-charge', enemies, {...open, visible: () => false})).toBeNull();
  });

  it('does not spend point powers when no placement is traversable', () => {
    for (const id of ['napalm-charge', 'glacier', 'tesla-pylon'] as const)
      expect(aim(id, [enemy(1, 200)], {...open, traverse: () => false})).toBeNull();
  });

  it('tests the entire Glacier footprint, not just the clear cursor path', () => {
    const checks: Array<{from: AbilityPoint; to: AbilityPoint; radius: number}> = [];
    const queries = {...open, traverse: (from: AbilityPoint, to: AbilityPoint, radius: number) => {
      checks.push({from, to, radius});
      return radius !== 13;
    }};
    expect(aim('glacier', [enemy(1, 300)], queries)).toBeNull();
    expect(checks.some(c => c.radius === 4)).toBe(true);
    expect(checks.some(c => c.radius === 13 && Math.abs(Math.hypot(c.to.x - c.from.x, c.to.y - c.from.y) - 200) < 1e-8)).toBe(true);
  });

  it('chooses a legal wall covering multiple targets and the real system accepts it', () => {
    const enemies = [enemy(1, 300, -70), enemy(2, 300, 70)];
    const plan = aim('glacier', enemies)!;
    expect(plan.targets).toEqual([1, 2]);
    const w = runtime('cryo', enemies);
    w.cast('power', plan, 150);
    const wall = w.system.snapshot.deployables[0];
    expect(wall.kind).toBe('ice-wall');
    expect(wall.length).toBe(200);
    expect(wall.thickness).toBe(26);
  });

  it('places Bulwark at its fixed 70 reach with a 220 by 18 footprint', () => {
    const enemies = [enemy(1, 70, -70), enemy(2, 70, 70)];
    const plan = aim('bulwark', enemies)!;
    expect(Math.hypot(plan.x, plan.y)).toBeCloseTo(70);
    expect(plan.targets).toEqual([1, 2]);
    const w = runtime('breacher', enemies);
    w.cast('power', plan, 0);
    expect(w.system.snapshot.deployables[0]).toMatchObject({kind: 'barrier', length: 220, thickness: 18});
  });

  it('selects the chain starting target with greatest deterministic nearest-neighbor fanout', () => {
    const enemies = [enemy(1, -300), enemy(2, 100), enemy(3, 280), enemy(4, 460), enemy(5, 640)];
    const plan = aim('overload', enemies)!;
    expect(plan.targets).toEqual([2, 3, 4, 5]);
    expect(runtime('arc', enemies).cast('tactical', plan, 0)).toEqual([2, 3, 4, 5]);
    expect(aim('overload', [...enemies].reverse())).toEqual(plan);
  });

  it('respects chain hop LOS and the 200 hop bound', () => {
    const enemies = [enemy(1, 100), enemy(2, 300), enemy(3, 500.001)];
    const queries = {...open, visible: (from: AbilityPoint, to: AbilityPoint) => from.x === 0 || Math.abs(to.x - from.x) < 199};
    const plan = aim('overload', enemies, queries)!;
    expect(plan.targets).toHaveLength(1);
    expect(runtime('arc', enemies, queries).cast('tactical', plan, 0)).toEqual(plan.targets);
  });

  it('extends chain fanout from six to eight only with Forked Overload', () => {
    const enemies = Array.from({length: 8}, (_, i) => enemy(i + 1, 100 + i * 100));
    const normal = aim('overload', enemies)!;
    const queries = {...open, has: (id: string) => id === 'forked-overload'};
    const augmented = aim('overload', enemies, queries)!;
    expect(normal.targets).toHaveLength(6);
    expect(augmented.targets).toHaveLength(8);
    expect(runtime('arc', enemies, queries).cast('tactical', augmented, 0)).toEqual([...augmented.targets].sort((a, b) => a - b));
  });

  it('uses smaller real triplet radii and legal placements independently', () => {
    const queries = {...open, has: (id: string) => id === 'napalm-triplet', resolveAim: () => ({x: 300, y: 0})};
    const enemies = [enemy(1, 300, -175), enemy(2, 300, 175), enemy(3, 381)];
    const plan = aim('napalm-charge', enemies, queries)!;
    expect(plan.targets).toEqual([1, 2]);
    expect(runtime('pyro', enemies, queries).cast('power', plan, 600)).toEqual([1, 2]);
    const blocked = {...queries, traverse: (_from: AbilityPoint, to: AbilityPoint) => to.y >= 0};
    const oneSide = aim('napalm-charge', enemies, blocked)!;
    expect(oneSide.targets).toEqual([2]);
    expect(runtime('pyro', enemies, blocked).cast('power', oneSide, 600)).toEqual([2]);
  });

  it('uses twin Glacier along-axis offsets and validates each complete footprint', () => {
    const queries = {...open, has: (id: string) => id === 'twin-glacier', resolveAim: () => ({x: 300, y: 0})};
    const enemies = [enemy(1, 260, 80), enemy(2, 340, -80)];
    const plan = aim('glacier', enemies, queries)!;
    expect(plan.targets).toEqual([1, 2]);
    const w = runtime('cryo', enemies, queries);
    w.cast('power', plan, 150);
    expect(w.system.snapshot.deployables.map(d => d.x).sort((a, b) => a - b)).toEqual([260, 340]);
  });

  it('uses twin Pylon lateral offsets and its real deployment clearance', () => {
    const radii: number[] = [];
    const queries = {...open, has: (id: string) => id === 'twin-pylon', resolveAim: () => ({x: 300, y: 0}),
      traverse: (_from: AbilityPoint, _to: AbilityPoint, radius: number) => { radii.push(radius); return true; }};
    const plan = aim('tesla-pylon', [enemy(1, 300, -265), enemy(2, 300, 265)], queries)!;
    expect(plan.targets).toEqual([1, 2]);
    expect(radii.every(r => r === 18)).toBe(true);
    const w = runtime('arc', [], queries);
    w.cast('power', plan, 100);
    expect(w.system.snapshot.deployables.map(d => d.y).sort((a, b) => a - b)).toEqual([-50, 50]);
  });

  it('scores resolved native aim, skips unprojectable candidates and finds a valid alternative', () => {
    const enemies = [enemy(1, 200), enemy(2, 0, 200)];
    const queries = {...open, resolveAim: (cursor: AbilityPoint) => cursor.x > 0 ? {x: -300, y: 0} : cursor.y > 0 ? {x: 0, y: 300} : null};
    const plan = aim('flashfire', enemies, queries)!;
    expect(plan.targets).toEqual([2]);
    expect(runtime('pyro', enemies, queries).cast('tactical', plan, 80)).toEqual([2]);
    expect(aim('flashfire', enemies, {...open, resolveAim: () => null})).toBeNull();
    expect(aim('flashfire', enemies, {...open, resolveAim: () => ({x: -300, y: 0})})).toBeNull();
  });

  it('rejects dead, unseen, occluded and invulnerable targets without changing frozen observations', () => {
    const enemies = Object.freeze([
      Object.freeze({...enemy(1, 100), health: 0}), Object.freeze({...enemy(2, 120), visible: false}),
      Object.freeze({...enemy(3, 140), clear: false}), Object.freeze({...enemy(4, 160), vulnerable: false}),
    ]);
    const before = JSON.stringify(enemies);
    expect(aim('flashfire', enemies)).toBeNull();
    expect(aim('overload', [])).toBeNull();
    expect(aim('cryo-nova', [enemy(5, 10)])).toBeNull();
    expect(JSON.stringify(enemies)).toBe(before);
  });

  it('observes a real game without advancing simulation, consuming charges or taking over dash', () => {
    const game = new DepthGame();
    game.newRun(137, {rigSelect: true});
    expect(game.chooseRig('pyro')).toBe(true);
    game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    const e = enemy(1, game.player.x + 50, game.player.y);
    const snapshot = () => JSON.stringify({player: game.player, abilities: game.abilities.snapshot,
      stats: game.stats, expedition: game.expedition, enemies: game.enemies.snapshot, status: game.status});
    const before = snapshot();
    const plans = observeAbilityAims(game, [e]);
    expect(plans).not.toHaveProperty('dash');
    expect(plans).not.toHaveProperty('overdrive'); // Pyro Overdrive is self targeted.
    expect(snapshot()).toBe(before);
    expect(observeAbilityAims(game, [e])).toEqual(plans);
  });
});
