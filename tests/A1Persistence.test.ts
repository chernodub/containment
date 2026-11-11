import {describe, expect, it} from 'vitest';
import {RunStats, RUN_STATS_LIMITS, isValidRunStatsSnapshot} from '../src/game/abilities/RunStats';
import {createRun, clearRoom, enterRoom, finishReward, generateRun, isValidRunState} from '../src/game/roguelike/run';
import {serializeCheckpoint, parseCheckpoint} from '../src/game/roguelike/checkpoints';
import {chooseExpeditionRig, chooseExpeditionRoute, claimExpeditionMutation, completeExpeditionRoom, createExpedition, expeditionCheckpoint, expeditionRewardOffers, rerollExpedition, restoreExpedition} from '../src/game/roguelike/expedition';
import type {RunCheckpoint, RunResources} from '../src/game/roguelike/types';

const resources: RunResources = {
  health: 100, armor: 20, credits: 1000, grenades: 2, medkits: 1, weapon: 'pistol',
  ammo: {pistol: {magazine: 12, reserve: -1}, rifle: {magazine: 30, reserve: 90}, shotgun: {magazine: 8, reserve: 24}, plasma: {magazine: 20, reserve: 60}, rocket: {magazine: 1, reserve: 4}},
};
const oldCheckpoint = (): RunCheckpoint => ({version: 1, savedAt: 123, run: clearRoom(createRun(42)), build: {mutations: []}, resources});
const decode = (value: unknown) => parseCheckpoint(JSON.stringify(value));
const statsSnapshot = () => {
  const stats = new RunStats();
  stats.update(500, '42:v3-r0');
  stats.recordKill('crawler');
  stats.recordDamage('ability', 123);
  stats.recordShot(true);
  stats.recordAbilityUse('overdrive');
  return stats.snapshot;
};

describe('Combat Rig checkpoint extensions', () => {
  it('accepts exact old saves without adding data to the persistence reader', () => {
    const old = oldCheckpoint();
    expect(decode(old)).toEqual(old);
    expect(serializeCheckpoint(old)).toEqual(JSON.stringify(old));
    const restored = restoreExpedition(old);
    expect(restored.build).toEqual({mutations: [], rig: 'breacher'});
    expect(restored.stats).toBeUndefined();
    expect(restored.abilities).toBeUndefined();
  });

  it.each(['breacher', 'cryo', 'pyro', 'arc'] as const)('round-trips %s rig, Overdrive, and statistics at reward and route boundaries', rig => {
    const checkpoint = {...oldCheckpoint(), build: {mutations: [], rig}, abilities: {overdriveCharge: .75}, stats: statsSnapshot()};
    for (const run of [checkpoint.run, finishReward(checkpoint.run)]) {
      const saved = {...checkpoint, run};
      expect(decode(saved)).toEqual(saved);
      expect(decode(saved)).toEqual(parseCheckpoint(serializeCheckpoint(saved)));
      expect(expeditionCheckpoint(restoreExpedition(saved), 123)).toEqual(saved);
    }
  });

  it('retains restored runtime through reward, reroll, and route transitions', () => {
    const saved = {...oldCheckpoint(), build: {mutations: [], rig: 'arc' as const}, abilities: {overdriveCharge: .42}, stats: statsSnapshot()};
    let e = rerollExpedition(restoreExpedition(saved));
    e = claimExpeditionMutation(e, expeditionRewardOffers(e)[0].id);
    e = chooseExpeditionRoute(e, generateRun(e.run.seed).nodes[1].id);
    e = completeExpeditionRoom(e, resources);
    expect(e.build.rig).toBe('arc');
    expect(e.abilities).toEqual(saved.abilities);
    expect(e.stats).toEqual(saved.stats);
    expect(Object.isFrozen(e.stats?.kills.byFamily)).toBe(true);
    const fresh = expeditionCheckpoint(e, 999, {abilities: {overdriveCharge: .95}, stats: new RunStats().snapshot});
    expect(fresh.abilities?.overdriveCharge).toBe(.95);
    expect(fresh.stats?.kills.total).toBe(0);
  });

  it('rejects unknown, corrupt, unbounded, and partially specified extensions', () => {
    const saved = {...oldCheckpoint(), build: {mutations: [], rig: 'arc'}, abilities: {overdriveCharge: .5}, stats: statsSnapshot()};
    for (const abilities of [{}, {overdriveCharge: -1}, {overdriveCharge: 1.1}, {overdriveCharge: '1'}, {overdriveCharge: .5, extra: true}, null]) expect(decode({...saved, abilities})).toBeNull();
    for (const build of [{mutations: [], rig: 'unknown'}, {mutations: [], rig: null}, {...saved.build, extra: true}]) expect(decode({...saved, build})).toBeNull();
    expect(decode({...saved, extra: true})).toBeNull();
    expect(serializeCheckpoint({...saved, abilities: undefined})).toBeNull();
    expect(serializeCheckpoint({...saved, stats: undefined})).toBeNull();
    expect(serializeCheckpoint({...saved, abilities: {overdriveCharge: NaN}})).toBeNull();
    const corrupt = [null, {}, {...saved.stats, extra: 1}, {...saved.stats, kills: {...saved.stats.kills, total: 2}}, {...saved.stats, damageDealt: {...saved.stats.damageDealt, ability: Infinity}}, {...saved.stats, abilityUses: {...saved.stats.abilityUses, dash: -1}}, {...saved.stats, highestMultiKill: RUN_STATS_LIMITS.multiKill + 1}, {...saved.stats, roomTimeMs: {arbitrary: 1}}, {...saved.stats, roomTimeMs: {'42:v3-r0': RUN_STATS_LIMITS.timeMs + 1}}];
    for (const stats of corrupt) expect(serializeCheckpoint({...saved, stats})).toBeNull();
  });

  it('keeps checkpoints restricted to cleared reward/route boundaries', () => {
    const saved = oldCheckpoint();
    for (const phase of ['rig-select', 'starting-boon', 'combat', 'dead', 'complete']) expect(decode({...saved, run: {...createRun(42), phase}})).toBeNull();
  });
});

describe('opt-in rig selection', () => {
  it('preserves the legacy starting-boon flow with the default Breacher rig', () => {
    const e = createExpedition(42, resources);
    expect(e.run.phase).toBe('starting-boon');
    expect(e.build.rig).toBe('breacher');
    expect(() => chooseExpeditionRig(e, 'arc')).toThrow();
    const active = claimExpeditionMutation(e, expeditionRewardOffers(e)[0].id);
    expect(active.run.phase).toBe('combat');
    expect(active.build.rig).toBe('breacher');
  });

  it('offers rig selection only at the first version-three node, then advances once', () => {
    const e = createExpedition(42, resources, {rigSelect: true});
    expect(e.run.phase).toBe('rig-select');
    expect(isValidRunState(e.run)).toBe(true);
    expect(expeditionRewardOffers(e)).toEqual([]);
    const selected = chooseExpeditionRig(e, 'cryo');
    expect(selected.run.phase).toBe('starting-boon');
    expect(selected.build.rig).toBe('cryo');
    expect(() => chooseExpeditionRig(selected, 'arc')).toThrow();
    expect(() => chooseExpeditionRig(e, 'unknown' as 'arc')).toThrow();
    const later = enterRoom(finishReward(clearRoom(createRun(42))), '42:v3-r1');
    expect(isValidRunState({...later, phase: 'rig-select'})).toBe(false);
    for (const version of [1, 2] as const) expect(isValidRunState({version, seed: 42, phase: 'rig-select', currentNodeId: generateRun(42, version).startId, completedNodeIds: []})).toBe(false);
  });
});

describe('deterministic run statistics', () => {
  it('records receipts with stable immutable snapshots and no clocks', () => {
    const stats = new RunStats();
    const initial = stats.snapshot;
    expect(stats.snapshot).toBe(initial);
    stats.recordDamage('ability', 20);
    expect(stats.snapshot).not.toBe(initial);
    expect(initial.damageDealt.ability).toBe(0);
    stats.recordDamage('weapon', 10);
    stats.recordDamage('status', 5);
    stats.recordDamage('boon', 2);
    stats.recordDamageTaken(8);
    stats.recordShot(); stats.recordShotHit(); stats.recordShot();
    stats.recordAbilityUse('dash'); stats.recordAbilityUse('tactical'); stats.recordAbilityUse('power'); stats.recordAbilityUse('overdrive');
    stats.recordCredits(40);
    expect(stats.snapshot).toMatchObject({damageDealt: {ability: 20, weapon: 10, status: 5, boon: 2}, damageTaken: 8, shotsFired: 2, shotsHit: 1, abilityUses: {dash: 1, tactical: 1, power: 1, overdrive: 1}, overdrivesUsed: 1, creditsEarned: 40});
    expect(isValidRunStatsSnapshot(stats.snapshot)).toBe(true);
    expect(Object.isFrozen(stats.snapshot.damageDealt)).toBe(true);
    const before = stats.snapshot;
    for (const amount of [0, -1, NaN, Infinity]) { stats.recordDamage('weapon', amount); stats.recordDamageTaken(amount); stats.recordCredits(amount); stats.update(amount); }
    expect(stats.snapshot).toBe(before);
  });

  it('counts families and the highest number of kills in a rolling one-second simulation window', () => {
    const stats = new RunStats();
    stats.update(1, '42:v3-r0');
    stats.recordKill('crawler');
    stats.update(600); stats.recordKill('brute');
    stats.update(399); stats.recordKill('queen');
    expect(stats.snapshot.highestMultiKill).toBe(3);
    stats.update(601); stats.recordKill('spitter');
    stats.update(400); stats.recordKill('carrier');
    expect(stats.snapshot.highestMultiKill).toBe(3);
    stats.enterRoom('42:v3-r1');
    stats.recordKill('stalker');
    stats.update(50);
    expect(stats.snapshot.kills).toEqual({total: 6, byFamily: {crawler: 1, brute: 1, spitter: 1, stalker: 1, carrier: 1, queen: 1}});
    expect(stats.snapshot.roomTimeMs).toEqual({'42:v3-r0': 2001, '42:v3-r1': 50});
    expect(stats.snapshot.highestMultiKill).toBe(3);
  });

  it('restores without aliasing and resets transient multi-kill time at a save boundary', () => {
    const original = statsSnapshot();
    const restored = new RunStats(original);
    restored.recordKill('crawler');
    expect(restored.snapshot.kills.total).toBe(2);
    expect(restored.snapshot.highestMultiKill).toBe(1);
    expect(original.kills.total).toBe(1);
    restored.reset();
    expect(restored.snapshot.kills.total).toBe(0);
    expect(() => restored.reset({...original, shotsHit: 10})).toThrow();
  });

  it('bounds counters, the multi-kill window, and room storage', () => {
    const stats = new RunStats();
    stats.recordDamage('ability', Number.MAX_VALUE);
    stats.recordDamageTaken(Number.MAX_VALUE);
    stats.recordCredits(Number.MAX_SAFE_INTEGER);
    for (let i = 0; i < RUN_STATS_LIMITS.multiKill + 100; i++) stats.recordKill('crawler');
    expect(stats.snapshot.highestMultiKill).toBe(RUN_STATS_LIMITS.multiKill);
    expect(stats.snapshot.kills.total).toBe(RUN_STATS_LIMITS.multiKill + 100);
    expect(stats.snapshot.damageDealt.ability).toBe(RUN_STATS_LIMITS.counter);
    for (let depth = 0; depth < 20; depth++) stats.update(Number.MAX_VALUE, `42:v3-r${depth}`);
    expect(Object.keys(stats.snapshot.roomTimeMs)).toHaveLength(20);
    expect(() => stats.enterRoom('43:v3-r0')).toThrow();
    expect(isValidRunStatsSnapshot(stats.snapshot)).toBe(true);
  });

  it('replays identical receipts into identical snapshots', () => {
    const replay = () => {
      const s = new RunStats();
      for (let frame = 0; frame < 4000; frame++) {
        s.update(16, `42:v3-r${Math.floor(frame / 200)}`);
        if (frame % 17 === 0) { s.recordShot(true); s.recordDamage('weapon', 18); }
        if (frame % 35 === 0) { s.recordKill('crawler'); s.recordCredits(20); }
        if (frame % 60 === 0) s.recordAbilityUse('tactical');
      }
      return s.snapshot;
    };
    expect(replay()).toEqual(replay());
  });
});
