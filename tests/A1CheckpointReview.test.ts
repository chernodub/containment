import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {RunStats, RUN_STATS_LIMITS, isValidRunStatsSnapshot} from '../src/game/abilities/RunStats';
import {parseCheckpoint, serializeCheckpoint, type StorageLike} from '../src/game/roguelike/checkpoints';
import {clearRoom, createRun, finishReward, generateRun} from '../src/game/roguelike/run';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import type {RunCheckpoint, RunState} from '../src/game/roguelike/types';

function checkpoint(version: 1 | 2 | 3 = 3): RunCheckpoint {
  const graph = generateRun(42, version);
  const run: RunState = version === 3 ? createRun(42) : {version, seed: 42, currentNodeId: graph.startId, completedNodeIds: [], phase: 'combat'};
  return {version: 1, savedAt: 0, run: clearRoom(run), build: {mutations: [], rig: 'breacher'}, resources: new DepthGame().combat.getRunResources(), stats: new RunStats().snapshot};
}
const timers = (seed: number, version: 1 | 2 | 3 = 3) => Object.fromEntries(generateRun(seed, version).nodes.map((node, i) => [node.id, i * 50]));
const withTimers = <T>(roomTimeMs: T, original = checkpoint()) => ({...original, stats: {...original.stats!, roomTimeMs}});
const storage = (serialized: string | null): StorageLike => ({getItem: () => serialized, setItem: () => {}, removeItem: () => {}});

function expectSafeContinue(serialized: string | null, expected: boolean) {
  const game = new DepthGame(() => {}, storage(serialized));
  expect(() => game.canContinue).not.toThrow();
  expect(game.canContinue).toBe(expected);
  let continued: boolean | undefined;
  expect(() => { continued = game.continueRun(); }).not.toThrow();
  expect(continued).toBe(expected);
  return game;
}

describe('checkpoint statistics match the regenerated run graph', () => {
  it('rejects the reviewed foreign twenty-room timer map before advertising Continue', () => {
    const malformed = withTimers(timers(99));
    // Its stats schema is independently valid; the checkpoint supplies the missing run context.
    expect(isValidRunStatsSnapshot(malformed.stats)).toBe(true);
    expect(isValidRunStatsSnapshot(malformed.stats, malformed.run)).toBe(false);
    expect(serializeCheckpoint(malformed)).toBeNull();
    expect(parseCheckpoint(JSON.stringify(malformed))).toBeNull();
    expectSafeContinue(JSON.stringify(malformed), false);
  });

  it.each([1, 2, 3] as const)('accepts every legitimate timer id from graph version %i', version => {
    const original = checkpoint(version);
    const saved = withTimers(timers(original.run.seed, version), original);
    const encoded = serializeCheckpoint(saved);
    expect(encoded).not.toBeNull();
    expect(parseCheckpoint(encoded)).toEqual(saved);
    const continued = expectSafeContinue(encoded, true);
    expect(continued.expedition.run.version).toBe(version);
    expect(continued.stats.roomTimeMs).toEqual(saved.stats.roomTimeMs);
    expect(continued.expedition.run.currentNodeId).toBe(original.run.currentNodeId);
    const stats = new RunStats(parseCheckpoint(encoded)!.stats);
    expect(() => stats.enterRoom(original.run.currentNodeId)).not.toThrow();
  });

  it('round-trips a full twenty-timer map through reward, route, Continue and entry of the next room', () => {
    const saved = withTimers(timers(42));
    expect(Object.keys(saved.stats.roomTimeMs)).toHaveLength(RUN_STATS_LIMITS.rooms);
    const encoded = serializeCheckpoint(saved);
    const continued = expectSafeContinue(encoded, true);
    expect(continued.stats.roomTimeMs).toEqual(saved.stats.roomTimeMs);
    continued.chooseMutation(expeditionRewardOffers(continued.expedition)[0].id);
    expect(continued.status).toBe('route');
    continued.route(continued.node.next[0]);
    expect(continued.status).toBe('playing');
    expect(Object.keys(continued.stats.roomTimeMs)).toHaveLength(20);
    continued.update(50);
    expect(continued.stats.roomTimeMs[continued.node.id]).toBe(100);
    const route = {...saved, run: finishReward(saved.run)};
    expectSafeContinue(serializeCheckpoint(route), true);
  });

  it('allows omitted current timers only when Continue can add them within capacity', () => {
    const graph = generateRun(42);
    const full = timers(42);
    delete full[graph.startId];
    const continued = expectSafeContinue(serializeCheckpoint(withTimers(full)), true);
    expect(continued.stats.roomTimeMs[graph.startId]).toBe(0);
    expect(Object.keys(continued.stats.roomTimeMs)).toHaveLength(20);
    expectSafeContinue(serializeCheckpoint(withTimers({})), true);
  });

  it('rejects syntactically valid legacy node IDs that are absent from their own regenerated graph', () => {
    for (const [version, id] of [[1, '42:r0-boss'], [1, '42:r2-safe'], [2, '42:v2-r0-boss'], [2, '42:v2-r3-medical']] as const) {
      const malformed = withTimers({[id]: 1}, checkpoint(version));
      expect(isValidRunStatsSnapshot(malformed.stats)).toBe(true);
      expect(isValidRunStatsSnapshot(malformed.stats, malformed.run)).toBe(false);
      expect(serializeCheckpoint(malformed)).toBeNull();
      expectSafeContinue(JSON.stringify(malformed), false);
    }
  });

  it('keeps exact historical saves without statistics or rig readable', () => {
    for (const version of [1, 2, 3] as const) {
      const original = checkpoint(version);
      const {stats: _stats, ...withoutStats} = original;
      const old = {...withoutStats, build: {mutations: []}};
      const encoded = JSON.stringify(old);
      expect(serializeCheckpoint(old)).toBe(encoded);
      expect(parseCheckpoint(encoded)).toEqual(old);
      const continued = expectSafeContinue(encoded, true);
      expect(continued.abilities.snapshot.rig).toBe('breacher');
    }
  });
});

describe('generated malformed checkpoint statistics', () => {
  it('rejects foreign seeds, graph versions, unknown nodes and invalid timer values without throwing Continue', () => {
    const malformed: unknown[] = [];
    const original = checkpoint();
    for (const seed of [0, 1, 41, 43, 99, 0xffff_ffff]) {
      for (const count of [1, 5, 19, 20]) malformed.push(withTimers(Object.fromEntries(Object.entries(timers(seed)).slice(0, count))));
    }
    for (const version of [1, 2] as const) malformed.push(withTimers(timers(42, version)));
    for (const id of ['42:v3-r20', '42:v3-r99', '42:v2-r0-boss', '42:r0-boss', '000042:v3-r0', '42:v3-r0-extra', '__proto__', 'constructor', '', '42:v3-r0\0']) malformed.push(withTimers({[id]: 1}));
    for (const value of [-1, NaN, Infinity, -Infinity, RUN_STATS_LIMITS.timeMs + 1, '1', null, false, {}, []]) malformed.push(withTimers({[original.run.currentNodeId]: value}));
    for (const map of [null, [], 1, 'timers', new Map([['42:v3-r0', 1]])]) malformed.push(withTimers(map));
    malformed.push({...original, stats: {...original.stats, version: 2}});
    malformed.push({...original, stats: {...original.stats, shotsHit: 1}});
    malformed.push({...original, stats: {...original.stats, overdrivesUsed: 1}});
    malformed.push({...original, stats: {...original.stats, kills: {...original.stats!.kills, byFamily: {...original.stats!.kills.byFamily, unknown: 1}}}});
    malformed.push({...original, run: {...original.run, version: 2}});
    for (const candidate of malformed) {
      expect(() => serializeCheckpoint(candidate)).not.toThrow();
      expect(serializeCheckpoint(candidate)).toBeNull();
      // JSON turns Map into {}, so only assert rejection after parsing if serialization preserves the corruption.
      if ((candidate as {stats?: {roomTimeMs?: unknown}}).stats?.roomTimeMs instanceof Map) continue;
      const encoded = JSON.stringify(candidate);
      expect(parseCheckpoint(encoded)).toBeNull();
      expectSafeContinue(encoded, false);
    }
    expect(malformed.length).toBeGreaterThan(50);
  });

  it('rejects throwing getters, changing getters, symbols and prototype-shaped corruption safely', () => {
    const base = checkpoint();
    const throwingStats = {...base.stats!};
    Object.defineProperty(throwingStats, 'roomTimeMs', {enumerable: true, get() { throw new Error('untrusted timer getter'); }});
    const throwingTimers = {'42:v3-r0': 0};
    Object.defineProperty(throwingTimers, '42:v3-r0', {enumerable: true, get() { throw new Error('untrusted room getter'); }});
    const changingStats = {...base.stats!};
    let reads = 0;
    Object.defineProperty(changingStats, 'roomTimeMs', {enumerable: true, get: () => ++reads === 1 ? {} : timers(99)});
    const symbolic = {'42:v3-r0': 1, [Symbol('unknown')]: 1};
    const polluted = Object.create({inheritedTimer: 1}) as Record<string, number>;
    polluted['42:v3-r0'] = 1;
    for (const candidate of [{...base, stats: throwingStats}, withTimers(throwingTimers), {...base, stats: changingStats}, withTimers(symbolic), withTimers(polluted)]) {
      expect(() => serializeCheckpoint(candidate)).not.toThrow();
      expect(serializeCheckpoint(candidate)).toBeNull();
    }
    const ownPrototypeKey = JSON.parse('{"__proto__":1}') as Record<string, number>;
    expect(serializeCheckpoint(withTimers(ownPrototypeKey))).toBeNull();
    expect(isValidRunStatsSnapshot(throwingStats)).toBe(false);
  });

  it('all accepted generated timer subsets permit safe Continue, with matching availability', () => {
    for (const version of [1, 2, 3] as const) {
      const base = checkpoint(version);
      const entries = Object.entries(timers(base.run.seed, version));
      for (let subset = 0; subset < 12; subset++) {
        const roomTimeMs = Object.fromEntries(entries.filter((_, index) => (index + subset) % (subset % 4 + 1) === 0));
        const saved = withTimers(roomTimeMs, base);
        const encoded = serializeCheckpoint(saved);
        expect(encoded).not.toBeNull();
        expectSafeContinue(encoded, true);
      }
      // Persistence resource limits intentionally exceed loadout capacities; both host queries decline them.
      const excessive = {...base, resources: {...base.resources, health: 1000}};
      expect(serializeCheckpoint(excessive)).not.toBeNull();
      expectSafeContinue(serializeCheckpoint(excessive), false);
    }
  });
});
