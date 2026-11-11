import {describe, expect, it} from 'vitest';
import {EnemySystem, type EnemyEvent, type EnemySystemOptions} from '../src/game/enemies/EnemySystem';
import {progressionFor} from '../src/game/roguelike/progression';
import {generateRun} from '../src/game/roguelike/run';

type Balance = NonNullable<EnemySystemOptions['balance']>;
type Champion = 'warden' | 'matron';
const BASE = {health: 1.4, damage: 1.25, speed: 1.1, eliteHealth: 1.65, eliteDamage: 1.2, specials: true};
const PLAYER = {x: 400, y: 200};

function champion(kind: Champion, balance: Balance = BASE) {
  const enemies = new EnemySystem({balance, canMove: () => false});
  const result = enemies.spawn(kind === 'warden' ? 'brute' : 'carrier', 100, 200, true);
  if (!result.spawned) throw new Error('Champion fixture failed to spawn');
  enemies.promote(result.enemy.id, kind);
  return {enemies, snapshot: () => enemies.getSnapshot(result.enemy.id)!};
}

function advance(enemies: EnemySystem, duration: number) {
  const events: EnemyEvent[] = [];
  for (let remaining = duration; remaining > 0;) {
    const step = Math.min(50, remaining);
    events.push(...enemies.update(step, PLAYER));
    remaining -= step;
  }
  return events;
}

describe('I5 optional champion progression numbers', () => {
  it.each(['warden', 'matron'] as const)('replays %s identically with omitted or explicit unit champion multipliers', kind => {
    const replay = (explicit: boolean) => {
      const h = champion(kind, explicit ? {...BASE, championHealth: 1, championDamage: 1} : BASE);
      const snapshots = [h.snapshot()], events: EnemyEvent[] = [];
      for (let tick = 0; tick < 200; tick++) {
        events.push(...h.enemies.update(50, PLAYER));
        if (tick % 10 === 0) snapshots.push(h.snapshot());
      }
      return {events, snapshots};
    };
    expect(replay(true)).toEqual(replay(false));
  });

  it.each([
    {health: 1.25, damage: 1.3, wardenHealth: 950, wardenDamage: 36.4, matronHealth: 1437.5, matronDamage: 31.2},
    {health: 1.45, damage: 1.55, wardenHealth: 1102, wardenDamage: 43.4, matronHealth: 1667.5, matronDamage: 37.2},
  ])('scales promoted HP and contact damage by $health/$damage while preserving other authored stats', tuning => {
    for (const kind of ['warden', 'matron'] as const) {
      const h = champion(kind, {...BASE, championHealth: tuning.health, championDamage: tuning.damage});
      const warden = kind === 'warden', state = h.snapshot();
      expect(state).toMatchObject({
        champion: kind, elite: true,
        health: warden ? tuning.wardenHealth : tuning.matronHealth,
        maxHealth: warden ? tuning.wardenHealth : tuning.matronHealth,
        armor: warden ? 120 : 0, maxArmor: warden ? 120 : 0,
        radius: warden ? 28 : 24, speed: warden ? 88 : 76, baseSpeed: warden ? 88 : 76,
        creditReward: warden ? 100 : 150, specialCooldownMs: 1500,
      });
      expect(state.contactDamage).toBeCloseTo(warden ? tuning.wardenDamage : tuning.matronDamage, 12);
    }
  });

  it('does not apply champion multipliers to crawlers or any other ordinary/elite spawn', () => {
    for (const type of ['crawler', 'brute', 'spitter', 'stalker', 'carrier'] as const) {
      for (const elite of [false, true]) {
        const plain = new EnemySystem({balance: BASE});
        const scaled = new EnemySystem({balance: {...BASE, championHealth: 1.45, championDamage: 1.55}});
        const before = plain.spawn(type, 100, 200, elite), after = scaled.spawn(type, 100, 200, elite);
        expect(before.spawned).toBe(true);
        expect(after).toEqual(before);
      }
    }
  });

  it.each([1, 2] as const)('keeps historical graph-v%i default promotion HP and damage unchanged', version => {
    for (const node of generateRun(1729, version).nodes) {
      const balance = progressionFor(node);
      expect(Object.hasOwn(balance, 'championHealth')).toBe(false);
      expect(Object.hasOwn(balance, 'championDamage')).toBe(false);
      for (const kind of ['warden', 'matron'] as const) {
        const h = champion(kind, balance), warden = kind === 'warden';
        expect(h.snapshot()).toMatchObject({
          health: warden ? 760 : 1150, maxHealth: warden ? 760 : 1150,
          contactDamage: warden ? 28 : 24,
          maxArmor: warden ? 120 : 0, radius: warden ? 28 : 24,
          speed: warden ? 88 : 76, baseSpeed: warden ? 88 : 76, creditReward: warden ? 100 : 150,
        });
      }
    }
  });

  it('preserves the Warden 1500/850/4600 ms authored charge sequence under every optional override', () => {
    const h = champion('warden', {
      ...BASE, championHealth: 1.45, championDamage: 1.55,
      chargeInitialCooldownMs: 5000, chargeWindupMs: 1150, chargeCooldownMs: 6500,
    });
    expect(h.snapshot()).toMatchObject({health: 1102, maxArmor: 120, specialCooldownMs: 1500});
    expect(advance(h.enemies, 1499)).toEqual([]);
    expect(h.snapshot()).toMatchObject({specialCooldownMs: 1, chargeMs: 0, windupMs: 0});
    expect(h.enemies.update(1, PLAYER)).toContainEqual(expect.objectContaining({type: 'attack-warning', durationMs: 850}));
    expect(h.snapshot()).toMatchObject({windupMs: 850, specialCooldownMs: 4600, lockX: 300, lockY: 0});
    expect(advance(h.enemies, 849)).toEqual([]);
    expect(h.snapshot()).toMatchObject({windupMs: 1, chargeMs: 0});
    h.enemies.update(1, PLAYER);
    expect(h.snapshot()).toMatchObject({windupMs: 0, chargeMs: 650, velocityX: 330, velocityY: 0});
    expect(advance(h.enemies, 3749)).toEqual([]);
    expect(h.snapshot().specialCooldownMs).toBe(1);
    expect(h.enemies.update(1, PLAYER)).toContainEqual(expect.objectContaining({type: 'attack-warning', durationMs: 850}));
    expect(h.snapshot().specialCooldownMs).toBe(4600);
    expect(h.snapshot().contactDamage).toBeCloseTo(43.4, 12);
  });
});
