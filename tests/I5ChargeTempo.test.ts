import {describe, expect, it, vi} from 'vitest';
import {EnemySystem, type EnemyEvent, type EnemyPlayerState, type EnemySystemOptions} from '../src/game/enemies/EnemySystem';
import {progressionFor} from '../src/game/roguelike/progression';
import {generateRun} from '../src/game/roguelike/run';

// Keep the unaccepted v21 profile reviewable without enabling it in production.
vi.mock('../src/game/roguelike/i5Tuning', () => ({I5_ENCOUNTER_TUNING_ENABLED: true}));

const BASE = {health: 1, damage: 1, speed: 1, eliteHealth: 1.65, eliteDamage: 1.2, specials: true};
const PLAYER = {x: 400, y: 200};

function fixture(balance: NonNullable<EnemySystemOptions['balance']> = BASE, elite = true, warden = false) {
  let blocked = true;
  const enemies = new EnemySystem({balance, canMove: () => !blocked});
  const result = enemies.spawn('brute', 100, 200, elite);
  if (!result.spawned) throw new Error('Charge fixture failed to spawn');
  if (warden) enemies.promote(result.enemy.id, 'warden');
  return {
    enemies,
    snapshot: () => enemies.getSnapshot(result.enemy.id)!,
    releaseMovement: () => { blocked = false; },
  };
}

/** Advance real enemy timers in bounded fixed steps and retain every attack receipt. */
function advance(enemies: EnemySystem, duration: number, player: EnemyPlayerState = PLAYER) {
  const events: EnemyEvent[] = [];
  for (let remaining = duration; remaining > 0;) {
    const step = Math.min(50, remaining);
    events.push(...enemies.update(step, player));
    remaining -= step;
  }
  return events;
}

function firstWarning(h: ReturnType<typeof fixture>, initialCooldown = 1500) {
  expect(advance(h.enemies, initialCooldown - 1)).toEqual([]);
  expect(h.snapshot()).toMatchObject({specialCooldownMs: 1, windupMs: 0, chargeMs: 0});
  const warnings = h.enemies.update(1, PLAYER);
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toMatchObject({type: 'attack-warning', enemyType: 'brute', targetX: 400, targetY: 200});
  return warnings[0];
}

describe('I5 encounter charge tempo parameters', () => {
  it('wires charge overrides only after Transmission and never into either legacy graph', () => {
    for (const seed of [0, 1729, 0xffff_ffff]) {
      for (const version of [1, 2, 3] as const) {
        for (const node of generateRun(seed, version).nodes) {
          const balance = progressionFor(node);
          if (version === 3 && node.depth >= 10) {
            expect(balance).toMatchObject({chargeWindupMs: 1150, chargeCooldownMs: 6500, chargeInitialCooldownMs: 5000});
          } else {
            for (const key of ['chargeWindupMs', 'chargeCooldownMs', 'chargeInitialCooldownMs']) {
              expect(Object.hasOwn(balance, key), `graph ${version}, room ${node.depth + 1}, ${key}`).toBe(false);
            }
          }
        }
      }
    }
  });

  it.each(['ordinary-elite', 'warden'] as const)('uses progression-wired opening and charge tempo for %s', role => {
    const warden = role === 'warden';
    const node = generateRun(1729).nodes[warden ? 18 : 10];
    const h = fixture(progressionFor(node), true, warden);
    const initial = warden ? 1500 : 5000, windup = warden ? 850 : 1150, cooldown = warden ? 4600 : 6500;
    expect(h.snapshot().specialCooldownMs).toBe(initial);
    expect(firstWarning(h, initial)).toMatchObject({durationMs: windup});
    expect(h.snapshot()).toMatchObject({windupMs: windup, specialCooldownMs: cooldown, pendingAttack: 'charge'});
    expect(advance(h.enemies, windup - 1)).toEqual([]);
    expect(h.snapshot()).toMatchObject({windupMs: 1, chargeMs: 0});
    h.enemies.update(1, PLAYER);
    expect(h.snapshot()).toMatchObject({windupMs: 0, chargeMs: 650, velocityX: 330, velocityY: 0});
  });

  it.each(['default', 'legacy-v2'] as const)('keeps %s elite charge warning and cooldown at 850/4600 ms', mode => {
    const balance = mode === 'default' ? BASE : progressionFor(generateRun(1729, 2).nodes.find(node => node.depth === 4)!);
    const h = fixture(balance);
    expect(firstWarning(h)).toMatchObject({durationMs: 850});
    expect(h.snapshot()).toMatchObject({windupMs: 850, specialCooldownMs: 4600, pendingAttack: 'charge'});
    expect(advance(h.enemies, 849)).toEqual([]);
    expect(h.snapshot()).toMatchObject({windupMs: 1, chargeMs: 0, velocityX: 0, velocityY: 0});
    h.enemies.update(1, PLAYER);
    expect(h.snapshot()).toMatchObject({windupMs: 0, chargeMs: 650, velocityX: 330, velocityY: 0});
    expect(advance(h.enemies, 3749)).toEqual([]);
    expect(h.snapshot().specialCooldownMs).toBe(1);
    expect(h.enemies.update(1, PLAYER)).toContainEqual(expect.objectContaining({type: 'attack-warning', durationMs: 850}));
    expect(h.snapshot().specialCooldownMs).toBe(4600);
  });

  it('makes explicit default values replay identically to omitted charge parameters', () => {
    const run = (explicit: boolean) => {
      const h = fixture(explicit ? {...BASE, chargeWindupMs: 850, chargeCooldownMs: 4600, chargeInitialCooldownMs: 1500} : BASE);
      const events = advance(h.enemies, 12_000);
      return {events, snapshot: h.snapshot()};
    };
    expect(run(true)).toEqual(run(false));
  });

  it('uses the configured 1150 ms warning and 6500 ms start-to-start cooldown for ordinary elites', () => {
    const h = fixture({...BASE, chargeWindupMs: 1150, chargeCooldownMs: 6500});
    expect(firstWarning(h)).toMatchObject({durationMs: 1150});
    expect(h.snapshot()).toMatchObject({windupMs: 1150, specialCooldownMs: 6500, pendingAttack: 'charge'});
    expect(advance(h.enemies, 1149)).toEqual([]);
    expect(h.snapshot()).toMatchObject({windupMs: 1, chargeMs: 0, velocityX: 0, velocityY: 0});
    h.enemies.update(1, PLAYER);
    expect(h.snapshot()).toMatchObject({windupMs: 0, chargeMs: 650, specialCooldownMs: 5350, velocityX: 330, velocityY: 0});
    expect(advance(h.enemies, 5349)).toEqual([]);
    expect(h.snapshot().specialCooldownMs).toBe(1);
    expect(h.enemies.update(1, PLAYER)).toContainEqual(expect.objectContaining({type: 'attack-warning', durationMs: 1150}));
    expect(h.snapshot().specialCooldownMs).toBe(6500);
  });

  it('waits the configured 5000 ms initial countdown without changing the default wind-up or repeat cooldown', () => {
    const h = fixture({...BASE, chargeInitialCooldownMs: 5000});
    expect(h.snapshot().specialCooldownMs).toBe(5000);
    expect(firstWarning(h, 5000)).toMatchObject({durationMs: 850});
    expect(h.snapshot()).toMatchObject({windupMs: 850, specialCooldownMs: 4600, pendingAttack: 'charge'});
    expect(advance(h.enemies, 849)).toEqual([]);
    expect(h.snapshot()).toMatchObject({windupMs: 1, chargeMs: 0});
    h.enemies.update(1, PLAYER);
    expect(h.snapshot()).toMatchObject({windupMs: 0, chargeMs: 650, velocityX: 330, velocityY: 0});
  });

  it('applies the configured initial delay only to ordinary elite brutes', () => {
    for (const type of ['crawler', 'brute', 'spitter', 'stalker', 'carrier'] as const) {
      for (const elite of [false, true]) {
        const enemies = new EnemySystem({balance: {...BASE, chargeInitialCooldownMs: 5000}});
        const result = enemies.spawn(type, 100, 200, elite);
        if (!result.spawned) throw new Error('Initial delay fixture failed to spawn');
        expect(result.enemy.specialCooldownMs).toBe(type === 'brute' && elite ? 5000 : 1500);
      }
    }
  });

  it.each([undefined, 5000])('keeps the authored Warden opening and charge tempo with initial override %s', chargeInitialCooldownMs => {
    const h = fixture({...BASE, chargeWindupMs: 1150, chargeCooldownMs: 6500, chargeInitialCooldownMs}, true, true);
    expect(firstWarning(h)).toMatchObject({durationMs: 850});
    expect(h.snapshot()).toMatchObject({champion: 'warden', windupMs: 850, specialCooldownMs: 4600, baseSpeed: 88, contactDamage: 28});
    expect(advance(h.enemies, 849)).toEqual([]);
    expect(h.snapshot().chargeMs).toBe(0);
    h.enemies.update(1, PLAYER);
    expect(h.snapshot()).toMatchObject({chargeMs: 650, velocityX: 330, velocityY: 0});
    expect(advance(h.enemies, 3749)).toEqual([]);
    expect(h.snapshot().specialCooldownMs).toBe(1);
    expect(h.enemies.update(1, PLAYER)).toContainEqual(expect.objectContaining({type: 'attack-warning', durationMs: 850}));
  });

  it.each([false, true])('never gives non-elite brutes a charge when configuration is present=%s', configured => {
    const h = fixture(configured ? {...BASE, chargeWindupMs: 1150, chargeCooldownMs: 6500, chargeInitialCooldownMs: 5000} : BASE, false);
    expect(h.snapshot().specialCooldownMs).toBe(1500);
    expect(advance(h.enemies, 12_000)).toEqual([]);
    expect(h.snapshot()).toMatchObject({pendingAttack: null, chargeMs: 0, windupMs: 0});
  });

  it('retains the original locked target and 330-unit charge velocity through the longer opening and wind-up deterministically', () => {
    const replay = () => {
      const h = fixture({...BASE, chargeWindupMs: 1150, chargeCooldownMs: 6500, chargeInitialCooldownMs: 5000});
      const warning = firstWarning(h, 5000);
      const movedPlayer = {x: 100, y: 500};
      const windup = advance(h.enemies, 1149, movedPlayer);
      expect(h.snapshot()).toMatchObject({x: 100, y: 200, lockX: 300, lockY: 0, windupMs: 1, chargeMs: 0});
      h.releaseMovement();
      const impact = h.enemies.update(1, movedPlayer);
      expect(h.snapshot()).toMatchObject({lockX: 300, lockY: 0, chargeMs: 650, velocityX: 330, velocityY: 0});
      expect(h.snapshot().x).toBeCloseTo(100.33);
      expect(h.snapshot().y).toBe(200);
      expect(h.snapshot().contactDamage).toBe(42);
      return {warning, windup, impact, snapshot: h.snapshot()};
    };
    expect(replay()).toEqual(replay());
  });
});
