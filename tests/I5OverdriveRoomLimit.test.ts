import {describe, expect, it} from 'vitest';
import {DepthGame, type GameEffect} from '../src/DepthGame';
import {AbilitySystem, type AbilityHost} from '../src/game/abilities/AbilitySystem';
import {RIG_IDS} from '../src/game/abilities/catalog';
import type {AbilityEvent, RigId} from '../src/game/abilities/contract';
import {CHECKPOINT_STORAGE_KEY, loadCheckpoint, type StorageLike} from '../src/game/roguelike/checkpoints';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {progressionFor} from '../src/game/roguelike/progression';
import {generateRun} from '../src/game/roguelike/run';

function storage() {
  const values = new Map<string, string>();
  const adapter: StorageLike = {getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); }};
  return {adapter, values};
}
function standalone(limit?: () => number) {
  const player = {x: 0, y: 0, angle: 0, radius: 16, vx: 0, vy: 0};
  const events: AbilityEvent[] = [];
  const host: AbilityHost = {
    overdriveRoomLimit: limit, player: () => player, targets: () => [],
    visible: () => true, traverse: () => true, movePlayer: () => {}, damage: () => false,
    statuses: () => ({chilled: false, frozen: false}), status: () => {}, launch: () => {},
    arc: () => {}, has: () => false, reload: () => {}, emit: event => { events.push(event); },
  };
  const abilities = new AbilitySystem(host);
  abilities.setRig('breacher');
  return {abilities, events};
}
function advance(abilities: AbilitySystem, ms = 10_000) {
  for (let left = ms; left > 0; left -= 50) abilities.update(Math.min(50, left));
}
function start(rig: RigId = 'breacher', version: 1|2|3 = 3, adapter: StorageLike | null = null) {
  const events: GameEffect[] = [];
  const game = new DepthGame(event => { events.push(event); }, adapter);
  game.newRun(1729, {rig, version});
  if (version === 3) game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  return {game, events};
}
/** Enter a real generated room; isolate combat scheduling from the allowance assertions. */
function enter(game: DepthGame, selected: number | string) {
  const nodes = generateRun(game.expedition.run.seed, game.expedition.run.version).nodes;
  const node = nodes.find(n => typeof selected === 'number' ? n.depth === selected : n.id === selected)!;
  // Legacy graphs branch at a depth: a checkpoint path contains one ancestor, not the whole layer.
  const completedNodeIds: string[] = [];
  let descendant = node;
  for (let depth = node.depth - 1; depth >= 0; depth--) {
    const ancestor = nodes.find(n => n.depth === depth && n.next.includes(descendant.id))!;
    completedNodeIds.unshift(ancestor.id);
    descendant = ancestor;
  }
  game.expedition = {...game.expedition, run: {...game.expedition.run, currentNodeId: node.id,
    completedNodeIds, phase: 'combat'}};
  game['enterRoom']();
  return node;
}
function twice(game: DepthGame) {
  game.abilities.addCharge(12000);
  expect(game.useAbility('overdrive')).toBe(true);
  advance(game.abilities);
  game.abilities.addCharge(12000);
  expect(game.abilities.snapshot.overdrive.ready).toBe(true);
  expect(game.abilities.snapshot.slots!.overdrive.ready).toBe(true);
  expect(game.useAbility('overdrive')).toBe(true);
}

describe('I5 ordinary-room Overdrive allowance', () => {
  it.each(RIG_IDS)('accepts one %s Overdrive and holds the next full meter until a room boundary', rig => {
    const {game} = start(rig);
    expect(game.node.kind).toBe('combat');
    expect(game.useAbility('overdrive')).toBe(false); // An empty press does not consume the allowance.
    game.abilities.addCharge(12000);
    expect(game.abilities.snapshot.slots!.overdrive.ready).toBe(true);
    expect(game.useAbility('overdrive')).toBe(true);
    expect(game.stats.abilityUses.overdrive).toBe(1);
    game.abilities.addCharge(12000);
    advance(game.abilities);
    const snapshot = game.abilities.snapshot;
    expect(snapshot.overdrive).toMatchObject({charge: 1, ready: false, active: false, roomLimited: true});
    expect(snapshot.slots!.overdrive).toMatchObject({charges: 1, ready: false});
    expect(game.useAbility('overdrive')).toBe(false);
    expect(game.abilities.use('overdrive')).toBe(false); // Direct call paths share the same limit.
    expect(game.abilities.snapshot.overdrive.charge).toBe(1);
    expect(game.stats.abilityUses.overdrive).toBe(1);
    const next = enter(game, 1);
    expect(next.kind).toBe('combat');
    expect(game.abilities.snapshot.overdrive).toMatchObject({charge: 1, ready: true});
    expect(game.abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    expect(game.abilities.snapshot.slots!.overdrive.ready).toBe(true);
    expect(game.useAbility('overdrive')).toBe(true);
    expect(game.stats.abilityUses.overdrive).toBe(2);
  });

  it('does not emit ready after the allowance is exhausted or consume charge on a rejected press', () => {
    const {abilities, events} = standalone(() => 1);
    abilities.addCharge(12000);
    expect(events.filter(e => e.phase === 'overdrive-ready')).toHaveLength(1);
    expect(abilities.use('overdrive')).toBe(true);
    abilities.addCharge(6000);
    expect(abilities.snapshot.overdrive.charge).toBeCloseTo(.5);
    abilities.addCharge(6000);
    expect(events.filter(e => e.phase === 'overdrive-ready')).toHaveLength(1);
    expect(abilities.use('overdrive')).toBe(false);
    expect(events.at(-1)).toMatchObject({phase: 'denied', denial: 'blocked'});
    expect(abilities.snapshot.overdrive.charge).toBe(1);
    abilities.resetRoom();
    expect(abilities.snapshot.slots!.overdrive.ready).toBe(true);
    expect(abilities.use('overdrive')).toBe(true);
  });

  it('invalidates cached readiness when the host changes its room allowance', () => {
    let limit = 1;
    const {abilities} = standalone(() => limit);
    abilities.addCharge(12000);
    abilities.use('overdrive');
    advance(abilities);
    abilities.addCharge(12000);
    const limited = abilities.snapshot;
    expect(abilities.snapshot).toBe(limited);
    expect(limited.overdrive.roomLimited).toBe(true);
    limit = Infinity;
    const unlimited = abilities.snapshot;
    expect(unlimited).not.toBe(limited);
    expect(unlimited.overdrive.ready).toBe(true);
    expect(unlimited.slots!.overdrive.ready).toBe(true);
    limit = 1;
    expect(abilities.snapshot.overdrive.roomLimited).toBe(true);
    expect(abilities.snapshot.slots!.overdrive.ready).toBe(false);
  });

  it('does not count blocked, disabled or casting presses as accepted uses', () => {
    const {abilities} = standalone(() => 1);
    abilities.addCharge(12000);
    expect(abilities.use('overdrive', false)).toBe(false);
    expect(abilities.use('tactical')).toBe(true);
    expect(abilities.use('overdrive')).toBe(false);
    advance(abilities, 220);
    expect(abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    expect(abilities.use('overdrive')).toBe(true);
    expect(abilities.snapshot.overdrive.roomLimited).toBe(true);
  });

  it('preserves the limit through active expiry, pausing, reload and weapon switches', () => {
    const {game} = start('arc');
    game.abilities.addCharge(12000);
    expect(game.useAbility('overdrive')).toBe(true);
    game.abilities.addCharge(12000);
    expect(game.abilities.snapshot.overdrive.active).toBe(true);
    expect(game.abilities.snapshot.overdrive.roomLimited).toBe(true);
    game.pause();
    expect(game.useAbility('overdrive')).toBe(false);
    game.resume();
    game.reload();
    game.switchWeapon('rifle');
    advance(game.abilities);
    expect(game.abilities.snapshot.overdrive.active).toBe(false);
    expect(game.abilities.snapshot.overdrive.charge).toBe(1);
    expect(game.useAbility('overdrive')).toBe(false);
  });

  it('leaves standalone hosts unlimited and preserves existing meter arithmetic', () => {
    const {abilities} = standalone();
    abilities.addCharge(600, 2);
    expect(abilities.snapshot.overdrive.charge).toBeCloseTo(.075);
    for (let i = 0; i < 3; i++) {
      abilities.addCharge(12000);
      expect(abilities.use('overdrive')).toBe(true);
      advance(abilities);
      expect(abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    }
  });

  it.each([1, 2] as const)('leaves every combat-enabled graph-v%i room unlimited, including legacy Queen encounters', version => {
    const {game} = start('breacher', version);
    const encounters = generateRun(1729, version).nodes.filter(n => ['combat', 'elite', 'boss'].includes(n.kind));
    expect(encounters.some(n => n.kind === 'boss')).toBe(true);
    for (const node of encounters) {
      enter(game, node.id);
      twice(game);
      expect(game.abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    }
  });

  it('enforces the allowance in every strict ordinary story room', () => {
    const {game} = start();
    const ordinary = generateRun(1729, 3).nodes.filter(node => node.kind === 'combat'
      && !progressionFor(node).guardian && node.depth !== 9 && node.depth !== 19);
    expect(ordinary.length).toBeGreaterThan(5);
    for (const node of ordinary) {
      enter(game, node.id);
      game.abilities.addCharge(12000);
      expect(game.useAbility('overdrive')).toBe(true);
      advance(game.abilities);
      game.abilities.addCharge(12000);
      expect(game.useAbility('overdrive')).toBe(false);
      expect(game.abilities.snapshot.overdrive).toMatchObject({charge: 1, ready: false, roomLimited: true});
    }
  });

  it('keeps every authored elite, planned guardian and holdout/finale room unlimited', () => {
    const {game} = start();
    const special = generateRun(1729, 3).nodes.filter(node => node.kind !== 'combat'
      || progressionFor(node).guardian || node.depth === 9 || node.depth === 19);
    expect(special.some(node => progressionFor(node).guardian)).toBe(true);
    expect(special.some(node => node.kind === 'elite')).toBe(true);
    expect(special.map(node => node.depth)).toContain(9);
    expect(special.map(node => node.depth)).toContain(19);
    for (const node of special) {
      enter(game, node.depth);
      twice(game);
      expect(game.abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    }
  });

  it('carries a full held meter through real clear/reward/route transitions and checkpoint continuation', () => {
    const {adapter, values} = storage();
    const {game} = start('breacher', 3, adapter);
    game.abilities.addCharge(12000);
    expect(game.useAbility('overdrive')).toBe(true);
    advance(game.abilities);
    game.abilities.addCharge(12000);
    expect(game.abilities.snapshot.overdrive.roomLimited).toBe(true);
    game['clearRoom']();
    expect(game.status).toBe('reward');
    const cp = loadCheckpoint(adapter)!;
    expect(cp.version).toBe(1);
    expect(cp.abilities).toEqual({overdriveCharge: 1});
    expect(values.get(CHECKPOINT_STORAGE_KEY)).not.toContain('roomLimited');
    const resumed = new DepthGame(() => {}, adapter);
    expect(resumed.continueRun()).toBe(true);
    expect(resumed.abilities.snapshot.overdrive.charge).toBe(1);
    resumed.chooseMutation(expeditionRewardOffers(resumed.expedition)[0].id);
    expect(resumed.status).toBe('route');
    resumed.route(resumed.node.next[0]);
    if (resumed.status === 'reward') {
      expect(['medical', 'armory']).toContain(resumed.node.kind);
      resumed.claimResources();
      expect(resumed.status).toBe('route');
      resumed.route(resumed.node.next[0]);
    }
    expect(resumed.status).toBe('playing');
    expect(resumed.abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    expect(resumed.abilities.snapshot.slots!.overdrive.ready).toBe(true);
    expect(resumed.useAbility('overdrive')).toBe(true);
    expect(resumed.abilities.snapshot.overdrive.roomLimited).toBe(true);
  });

  it.each([1, 2, 3] as const)('continues an old graph-v%i boundary checkpoint without ability extensions', version => {
    const {adapter, values} = storage();
    const {game} = start('breacher', version, adapter);
    game['clearRoom']();
    const cp = loadCheckpoint(adapter)!;
    expect(cp).not.toBeNull();
    const {abilities: _abilities, stats: _stats, ...old} = cp;
    values.set(CHECKPOINT_STORAGE_KEY, JSON.stringify(old));
    const resumed = new DepthGame(() => {}, adapter);
    expect(resumed.continueRun()).toBe(true);
    expect(resumed.expedition.run.version).toBe(version);
    expect(resumed.abilities.snapshot.overdrive).toMatchObject({charge: 0, ready: false});
    expect(resumed.abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    expect(resumed.expedition.run.currentNodeId).toBe(game.node.id);
    resumed.chooseMutation(expeditionRewardOffers(resumed.expedition)[0].id);
    expect(resumed.status).toBe('route');
    resumed.route(resumed.node.next[0]);
    if (resumed.status === 'reward') {
      expect(['medical', 'armory']).toContain(resumed.node.kind);
      resumed.claimResources();
      expect(resumed.status).toBe('route');
      resumed.route(resumed.node.next[0]);
    }
    expect(resumed.status).toBe('playing');
    resumed.abilities.addCharge(12000);
    expect(resumed.useAbility('overdrive')).toBe(true);
    advance(resumed.abilities);
    resumed.abilities.addCharge(12000);
    const ordinary = version === 3 && resumed.node.kind === 'combat'
      && !progressionFor(resumed.node).guardian && resumed.node.depth !== 9 && resumed.node.depth !== 19;
    expect(resumed.useAbility('overdrive')).toBe(!ordinary);
  });
});
