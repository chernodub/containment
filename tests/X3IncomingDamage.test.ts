import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {
  INCOMING_DAMAGE_CAPACITY,
  INCOMING_DAMAGE_WINDOW_MS,
  RunStats,
  isValidRunStatsSnapshot,
} from '../src/game/abilities/RunStats';
import {parseCheckpoint, serializeCheckpoint} from '../src/game/roguelike/checkpoints';
import {expeditionRewardOffers, restoreExpedition} from '../src/game/roguelike/expedition';
import {clearRoom} from '../src/game/roguelike/run';
import {SACRIFICE_ENDING} from '../src/game/roguelike/storyRooms';
import {completionEnding, incomingDamageReport} from '../src/ui/screens/damageReport';

const idle = {x: 0, y: 0, fire: false, angle: null, autoAim: false};
function fixture() {
  const game = new DepthGame();
  game.newRun(1729);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  return game;
}

describe('authoritative incoming damage provenance', () => {
  it('records actual damage, fatal source and room, while denied and paused hurt never rewrite history', () => {
    const game = fixture();
    game.hurt(8, {x: 10, y: 20}, {source: 'enemy-contact', enemyFamily: 'crawler'});
    const first = game.stats;
    expect(first.lastDamage).toEqual({source: 'enemy-contact', enemyFamily: 'crawler', amount: 8, room: game.node.id, atMs: 0});
    game.hurt(90, undefined, {source: 'boss-attack', enemyFamily: 'queen'});
    expect(game.stats).toBe(first);
    game.pause();
    game.update(10000, idle);
    game.hurt(90, undefined, {source: 'boss-attack', enemyFamily: 'queen'});
    expect(game.stats).toBe(first);
    game.resume();
    (game as any).hurtCooldown = 0;
    const remaining = game.combat.snapshot.health + game.combat.snapshot.armor;
    game.hurt(10000, undefined, {source: 'acid-pool'});
    expect(game.status).toBe('dead');
    expect(game.stats.lastDamage).toMatchObject({source: 'acid-pool', amount: remaining, room: game.node.id});
    expect(game.stats.recentDamage).toHaveLength(2);
    expect(first.lastDamage?.source).toBe('enemy-contact');
    expect(Object.isFrozen(game.stats.lastDamage)).toBe(true);
    expect(Object.isFrozen(game.stats.recentDamage)).toBe(true);
  });

  it.each(['contact', 'projectile', 'pool', 'boss'] as const)('labels the actual %s hurt call site', kind => {
    const game = fixture(), host = game as any;
    const origin = {x: game.player.x + 10, y: game.player.y + 5};
    if (kind === 'contact') {
      const spawned = game.enemies.spawn('crawler', origin.x, origin.y);
      if (!spawned.spawned) throw new Error('spawn');
      host.enemyEvents([{type: 'contact-attack', enemyId: spawned.enemy.id, enemyType: 'crawler', damage: 1}]);
    } else if (kind === 'projectile') {
      host.enemyEvents([{type: 'hazard-attack', enemyId: 1, sourceX: origin.x, sourceY: origin.y, targetX: game.player.x, targetY: game.player.y, damage: 1}]);
      game.update(1, idle);
    } else if (kind === 'pool') {
      game.pools.push({id: 1, ...origin, radius: 40, life: 1, warning: 0, damage: 1, tick: 0});
      game.update(1, idle);
    } else {
      host.queenEvents([{type: 'area-attack', ...origin, radius: 40, damage: 1}]);
    }
    const sources = {contact: 'enemy-contact', projectile: 'enemy-projectile', pool: 'acid-pool', boss: 'boss-attack'};
    expect(game.stats.lastDamage).toMatchObject({source: sources[kind], amount: 1, room: game.node.id});
    if (kind !== 'pool') expect(game.stats.lastDamage?.enemyFamily).toBe(kind === 'contact' ? 'crawler' : kind === 'projectile' ? 'spitter' : 'queen');
  });

  it('bounds the recent ring, prunes only simulation time, and keeps the last damaging source', () => {
    const stats = new RunStats();
    stats.enterRoom('1729:v3-r0');
    for (let i = 0; i < INCOMING_DAMAGE_CAPACITY + 10; i++) {
      stats.update(10);
      stats.recordDamageTaken(i + 1, {source: 'enemy-contact', enemyFamily: 'brute'});
    }
    expect(stats.snapshot.recentDamage).toHaveLength(INCOMING_DAMAGE_CAPACITY);
    expect(stats.snapshot.recentDamage?.[0].amount).toBe(11);
    const before = stats.snapshot;
    stats.update(INCOMING_DAMAGE_WINDOW_MS);
    expect(stats.snapshot.recentDamage).toHaveLength(1);
    stats.update(1);
    expect(stats.snapshot.recentDamage).toEqual([]);
    expect(stats.snapshot.lastDamage).toEqual(before.lastDamage);
    expect(isValidRunStatsSnapshot(stats.snapshot)).toBe(true);
  });

  it('replays the same provenance and rolling window identically', () => {
    const replay = () => {
      const stats = new RunStats();
      for (let frame = 0; frame < 1500; frame++) {
        stats.update(16, `1729:v3-r${Math.floor(frame / 500)}`);
        if (frame % 25 === 0) stats.recordDamageTaken(3, {source: frame % 50 ? 'acid-pool' : 'enemy-projectile', enemyFamily: 'spitter'});
      }
      return stats.snapshot;
    };
    expect(replay()).toEqual(replay());
  });
});

describe('incoming damage checkpoint extensions', () => {
  function saved() {
    const game = fixture();
    game.update(50, idle);
    game.hurt(4, undefined, {source: 'enemy-projectile', enemyFamily: 'spitter'});
    return {version: 1, savedAt: 50, ...game.expedition, run: clearRoom(game.expedition.run), stats: game.stats};
  }

  it('round-trips receipts, restores without aliasing, and continues the simulation clock', () => {
    const checkpoint = saved();
    const encoded = serializeCheckpoint(checkpoint);
    expect(encoded).not.toBeNull();
    const parsed = parseCheckpoint(encoded)!;
    expect(parsed.stats).toEqual(checkpoint.stats);
    const expedition = restoreExpedition(parsed);
    expect(Object.isFrozen(expedition.stats?.lastDamage)).toBe(true);
    expect(Object.isFrozen(expedition.stats?.recentDamage)).toBe(true);
    expect(expedition.stats?.recentDamage?.[0]).not.toBe(parsed.stats?.recentDamage?.[0]);
    const restored = new RunStats(parsed.stats);
    restored.enterRoom(checkpoint.run.currentNodeId);
    restored.update(100);
    restored.recordDamageTaken(2, {source: 'acid-pool'});
    expect(restored.snapshot.lastDamage?.atMs).toBe(150);
    expect(parsed.stats?.recentDamage).toHaveLength(1);
    expect(isValidRunStatsSnapshot(restored.snapshot)).toBe(true);
  });

  it('keeps the full bounded ring inside the unchanged checkpoint storage limit', () => {
    const checkpoint = saved();
    const stats = new RunStats(checkpoint.stats);
    stats.enterRoom(checkpoint.run.currentNodeId);
    for (let index = 0; index < INCOMING_DAMAGE_CAPACITY; index++) {
      stats.update(1);
      stats.recordDamageTaken(1, {source: 'enemy-contact', enemyFamily: 'carrier'});
    }
    const encoded = serializeCheckpoint({...checkpoint, stats: stats.snapshot});
    expect(encoded).not.toBeNull();
    expect(parseCheckpoint(encoded)?.stats?.recentDamage).toHaveLength(INCOMING_DAMAGE_CAPACITY);
  });

  it('reads historical stats without provenance and supplies safe empty runtime defaults', () => {
    const checkpoint = saved();
    const {lastDamage: _last, recentDamage: _recent, ...legacy} = checkpoint.stats;
    const encoded = serializeCheckpoint({...checkpoint, stats: legacy});
    expect(encoded).not.toBeNull();
    const restored = new RunStats(parseCheckpoint(encoded)!.stats);
    expect(restored.snapshot).toMatchObject({lastDamage: null, recentDamage: []});
    expect(restored.snapshot.damageTaken).toBe(4);
  });

  it('rejects malformed or unbounded provenance without relaxing any prior checkpoint validation', () => {
    const checkpoint = saved();
    const last = checkpoint.stats.lastDamage!;
    const variants: unknown[] = [
      {lastDamage: undefined}, {recentDamage: undefined}, {lastDamage: null},
      {lastDamage: {...last, source: 'nearby-enemy'}},
      {lastDamage: {...last, enemyFamily: 'unknown'}},
      {lastDamage: {...last, room: '9999:v3-r0'}},
      {lastDamage: {...last, amount: -1}},
      {lastDamage: {...last, atMs: -1}},
      {lastDamage: {...last, atMs: 50000}},
      {lastDamage: {...last, unexpected: true}},
      {recentDamage: Array(INCOMING_DAMAGE_CAPACITY + 1).fill(last)},
      {recentDamage: [{...last, atMs: 51}, last]},
    ];
    for (const variant of variants) {
      const stats = {...checkpoint.stats, ...(variant as object)};
      expect(isValidRunStatsSnapshot(stats)).toBe(false);
      expect(serializeCheckpoint({...checkpoint, stats})).toBeNull();
      expect(parseCheckpoint(JSON.stringify({...checkpoint, stats}))).toBeNull();
    }
  });
});

describe('failure-first debrief text', () => {
  it('groups recent incoming sources and names the actual fatal source and room', () => {
    const game = fixture();
    game.hurt(4, undefined, {source: 'enemy-contact', enemyFamily: 'brute'});
    (game as any).hurtCooldown = 0;
    game.hurt(3, undefined, {source: 'enemy-contact', enemyFamily: 'brute'});
    (game as any).hurtCooldown = 0;
    game.hurt(10000, undefined, {source: 'acid-pool'});
    const report = incomingDamageReport(game, game.stats);
    expect(report).toContain('FATAL HIT');
    expect(report).toContain('<h3>Acid pool</h3>');
    expect(report).toContain('Awakening bay');
    expect(report).toContain('LAST 5 SECONDS');
    expect(report).toContain('Brute attack');
    expect(report).toContain('<strong>7</strong>');
  });

  it('preserves the exact authored ending and never invents an unknown fatal source', () => {
    const game = fixture();
    expect(completionEnding(game)).toContain(SACRIFICE_ENDING);
    expect(incomingDamageReport(game, new RunStats().snapshot)).toContain('Damage source unavailable');
    game.hurt(1);
    expect(incomingDamageReport(game, game.stats)).toContain('Unidentified damage');
  });
});
