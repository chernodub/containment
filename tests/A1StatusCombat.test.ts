import {describe, expect, it} from 'vitest';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {RIG_BURN_DAMAGE} from '../src/game/abilities/catalog';
import {WEAPONS} from '../src/game/combat/catalog';
import {EnemySystem} from '../src/game/enemies/EnemySystem';
import {MutationRuntime, type MutationTarget} from '../src/game/roguelike/MutationRuntime';
import type {MutationId} from '../src/game/roguelike/types';

function world(mutations: MutationId[] = []) {
  const combat = new CombatSystem();
  combat.setBuild({mutations});
  const targets: Array<{
    id: number; x: number; y: number; radius: number; health: number;
    immovable?: boolean; resistant?: boolean;
  }> = [
    {id: 1, x: 0, y: 0, radius: 14, health: 100_000},
    {id: 2, x: 50, y: 0, radius: 14, health: 100_000},
  ];
  const hits: Array<{id: number; amount: number; source?: 'status' | 'boon'}> = [];
  const slows = new Map<number, number>();
  let blocked = false, moves = 0, slams = 0;
  const runtime = new MutationRuntime(combat, {
    targets: () => targets.filter(t => t.health > 0),
    damage: (id, amount, source) => {
      const t = targets.find(t => t.id === id)!;
      hits.push({id, amount, source});
      t.health -= amount;
      return {applied: true, died: t.health <= 0};
    },
    move: (id, dx, dy) => {
      moves++;
      if (!blocked) {
        const t = targets.find(t => t.id === id)!;
        t.x += dx; t.y += dy;
      }
      return {blocked};
    },
    moveCorpse: (t, dx, dy) => ({x: t.x + dx, y: t.y + dy, blocked}),
    setSlow: (id, n) => slows.set(id, n),
    wallSlam: () => { slams++; },
  });
  const advance = (ms: number) => {
    for (let n = 0; n < ms; n += 50) runtime.update(Math.min(50, ms - n));
  };
  return {combat, runtime, targets, hits, slows, advance,
    block: () => { blocked = true; }, get moves() { return moves; }, get slams() { return slams; }};
}

function rifle(magazine: number, reserve: number) {
  const combat = new CombatSystem();
  const resources = combat.getRunResources();
  combat.restoreRunResources({...resources, weapon: 'rifle',
    ammo: {...resources.ammo, rifle: {magazine, reserve}}});
  return combat;
}

describe('ability statuses share elemental and mutation reactions', () => {
  it('emits one physical wall contact for a native launch without inventing boon damage', () => {
    const w=world();w.block();w.runtime.launchAbility(w.targets[0],700,0);w.advance(100);
    expect(w.slams).toBe(1);expect(w.hits).toEqual([]);
    w.advance(500);expect(w.slams).toBe(1);
  });

  it('adds capped chill without Cryogenic and uses Permafrost duration', () => {
    const w = world(['permafrost']);
    w.runtime.applyAbilityStatus(w.targets[0], 'chill', 2);
    w.runtime.applyAbilityStatus(w.targets[0], 'chill', 2);
    expect(w.runtime.statuses(1).chillStacks).toBe(3);
    expect(w.slows.get(1)).toBeCloseTo(.55);
    w.advance(3000);
    expect(w.runtime.statuses(1).chillStacks).toBe(3);
    w.advance(500);
    expect(w.runtime.statuses(1).chillStacks).toBe(0);
    expect(w.slows.get(1)).toBe(1);
  });

  it('freezes for the requested duration and Shattershot consumes the same root and chill', () => {
    const w = world(['shattershot']);
    w.runtime.applyAbilityStatus(w.targets[0], 'freeze', 1800);
    expect(w.runtime.statuses(1)).toMatchObject({frozen: true, chillStacks: 3});
    expect(w.slows.get(1)).toBe(0);
    w.runtime.hit('shatter', 'rifle', w.targets[0], {x: 1, y: 0});
    w.advance(50);
    expect(w.runtime.statuses(1)).toMatchObject({frozen: false, chillStacks: 0});
    expect(w.slows.get(1)).toBe(1);
    expect(w.hits).toContainEqual({id: 2, amount: 16, source: 'boon'});
    w.runtime.applyAbilityStatus(w.targets[0], 'freeze', 1800);
    w.advance(1750);
    expect(w.runtime.statuses(1).frozen).toBe(true);
    w.advance(50);
    expect(w.runtime.statuses(1).frozen).toBe(false);
    expect(w.slows.get(1)).toBe(1);
  });

  for (const flag of ['resistant', 'immovable'] as const) {
    it(`converts freeze, shock and launch into brief slows on ${flag} targets`, () => {
      const w = world();
      w.targets[0][flag] = true;
      for (const kind of ['freeze', 'shock'] as const) {
        w.runtime.applyAbilityStatus(w.targets[0], kind, 1800);
        expect(w.runtime.statuses(1).frozen).toBe(false);
        expect(w.slows.get(1)).toBe(.65);
        w.advance(350);
        expect(w.slows.get(1)).toBe(1);
      }
      w.runtime.launchAbility(w.targets[0], 300, 0);
      expect(w.slows.get(1)).toBe(.65);
      w.advance(400);
      expect(w.moves).toBe(0);
      expect(w.targets[0].x).toBe(0);
      expect(w.slows.get(1)).toBe(1);
    });
  }

  it('stuns ordinary targets and resets shared shock state', () => {
    const w = world();
    w.runtime.applyAbilityStatus(w.targets[0], 'shock', 600);
    expect(w.runtime.statuses(1).shocked).toBe(true);
    expect(w.slows.get(1)).toBe(0);
    w.advance(600);
    expect(w.runtime.statuses(1).shocked).toBe(false);
    expect(w.slows.get(1)).toBe(1);
    w.runtime.applyAbilityStatus(w.targets[0], 'shock', 600);
    w.runtime.reset();
    expect(w.runtime.statuses(1).shocked).toBe(false);
    expect(w.slows.get(1)).toBe(1);
  });

  for (const kind of ['freeze', 'shock'] as const) {
    it(`${kind} suspends native enemy movement and contact attacks until control expires`, () => {
      const enemies = new EnemySystem();
      const spawn = enemies.spawn('crawler', 100, 100);
      if (!spawn.spawned) throw new Error('expected crawler');
      const runtime = new MutationRuntime(new CombatSystem(), {
        targets: () => enemies.snapshot.enemies,
        damage: () => ({applied: false, died: false}),
        move: (id, dx, dy) => enemies.moveBy(id, dx, dy),
        moveCorpse: t => ({...t, blocked: false}),
        setSlow: (id, multiplier) => enemies.setSlow(id, multiplier),
      });
      runtime.applyAbilityStatus(spawn.enemy, kind, 600);
      for (let ms = 0; ms < 550; ms += 50) {
        expect(enemies.update(50, {x: 110, y: 100})).toEqual([]);
        runtime.update(50);
      }
      expect(enemies.getSnapshot(spawn.enemy.id)).toMatchObject({x: 100, y: 100, speed: 0});
      runtime.update(50);
      expect(enemies.update(50, {x: 110, y: 100}).some(e => e.type === 'contact-attack')).toBe(true);
    });
  }

  it('burns without Incendiary and Kindling spreads an ability burn on death', () => {
    const w = world(['scavenger']);
    w.targets[0].health = RIG_BURN_DAMAGE;
    w.runtime.applyAbilityStatus(w.targets[0], 'burn', 1);
    w.advance(250);
    expect(w.runtime.statuses(2).burning).toBe(true);
    expect(w.hits[0]).toEqual({id: 1, amount: RIG_BURN_DAMAGE, source: 'status'});
    w.advance(1500);
    expect(w.hits.filter(h => h.id === 2)).toHaveLength(6);
    expect(w.hits.every(h => h.source === 'status')).toBe(true);
  });

  it.each([false,true])('native rig burn never weakens a stronger weapon burn (weapon first=%s)',weaponFirst=>{
    const w=world(['incendiary']);
    const weapon=()=>w.runtime.hit('weapon-burn','pistol',w.targets[0],{x:1,y:0});
    const rig=()=>w.runtime.applyAbilityStatus(w.targets[0],'burn',1);
    if(weaponFirst){weapon();rig();}else{rig();weapon();}
    w.advance(250);
    expect(w.hits).toEqual([{id:1,amount:4,source:'status'}]);
  });

  it('keeps renewed burn ticking past reaction budgets during a long fight', () => {
    const w = world();
    for (let ms = 0; ms < 1_100_000; ms += 500) {
      w.runtime.applyAbilityStatus(w.targets[0], 'burn', 1);
      w.advance(500);
    }
    expect(w.hits).toHaveLength(4400);
    expect(w.hits.every(h => h.source === 'status')).toBe(true);
    expect(w.targets[0].health).toBe(100_000 - 4400 * RIG_BURN_DAMAGE);
  });

  it('retains the recursion depth cap when status kills spread Kindling', () => {
    const w = world(['scavenger']);
    w.targets.splice(0, w.targets.length, ...Array.from({length: 12}, (_, id) => (
      {id, x: id * 90, y: 0, radius: 14, health: id===0?RIG_BURN_DAMAGE:4}
    )));
    w.runtime.applyAbilityStatus(w.targets[0], 'burn', 1);
    w.advance(3000);
    expect(w.targets.filter(t => t.health <= 0)).toHaveLength(4);
    expect(w.hits).toHaveLength(4);
  });

  it('tags poison and frostbite ticks as status damage', () => {
    const w = world(['caustic-rounds', 'frostbite']);
    w.runtime.hit('poison', 'rifle', w.targets[0], {x: 1, y: 0});
    w.runtime.applyAbilityStatus(w.targets[0], 'chill', 3);
    w.advance(600);
    expect(w.hits).toHaveLength(2);
    expect(w.hits.every(h => h.source === 'status')).toBe(true);
  });

  it('routes ability launch into wall-slam and body-chain boons without Breacher', () => {
    const w = world(['seismic-impact']);
    w.block();
    w.runtime.launchAbility(w.targets[0], 270, 0);
    w.advance(50);
    expect(w.slams).toBe(1);
    expect(w.hits).toEqual([{id: 1, amount: 24, source: 'boon'}, {id: 2, amount: 24, source: 'boon'}]);
    const chain = world(['chain-reaction']);
    chain.targets[1].x = 20;
    chain.runtime.launchAbility(chain.targets[0], 270, 0);
    chain.advance(50);
    expect(chain.hits.some(h => h.id === 2 && h.source === 'boon')).toBe(true);
  });

  it('feeds ability arcs through Cryo Conductor and Ball Lightning without Arc Filament', () => {
    const w = world(['cryo-conductor', 'ball-lightning']);
    w.runtime.applyAbilityStatus(w.targets[0], 'chill', 1);
    w.runtime.applyAbilityStatus(w.targets[1], 'chill', 1);
    for (let n = 0; n < 3; n++) w.runtime.abilityArc(w.targets[0], [w.targets[1]]);
    expect(w.hits.filter(h => h.amount === 12)).toHaveLength(3);
    w.advance(500);
    expect(w.hits.filter(h => h.amount === 22)).toHaveLength(2);
    expect(w.hits.every(h => h.source === 'boon')).toBe(true);
  });

  it('ignores invalid status amounts and dead targets', () => {
    const w = world();
    w.runtime.applyAbilityStatus(w.targets[0], 'freeze', NaN);
    w.runtime.applyAbilityStatus(w.targets[0], 'chill', -1);
    const dead: MutationTarget = {...w.targets[0], id: 3, health: 0};
    w.runtime.applyAbilityStatus(dead, 'shock', 1000);
    expect(w.slows.size).toBe(0);
    expect(w.runtime.statuses(1)).toMatchObject({frozen: false, chillStacks: 0});
  });
});

describe('Overclock weapon adapter', () => {
  it('preserves the selected rig in copied combat builds', () => {
    const c = new CombatSystem();
    c.setBuild({mutations: ['hot-reload'], rig: 'arc'});
    expect(c.build).toEqual({mutations: ['hot-reload'], rig: 'arc'});
  });
  it('fires an empty weapon freely, with faster cadence and no created normal ammo', () => {
    const c = rifle(0, 0);
    c.setOverclock(true);
    for (let n = 0; n < 5; n++) {
      expect(c.fire(0)).toHaveLength(1);
      const interval = 1000 / WEAPONS.rifle.roundsPerSecond / 1.5;
      expect(c.snapshot.fireCooldownRemainingMs).toBeCloseTo(interval);
      expect(c.fire(0)).toHaveLength(0);
      c.update(interval);
    }
    expect(c.snapshot).toMatchObject({magazine: 0, reserve: 0, reloading: false});
    c.setOverclock(false);
    expect(c.fire(0)).toHaveLength(0);
    expect(c.instantReload()).toBe(false);
  });

  it('instantly completes ordinary reload on activation and retains loaded ammo on free shots', () => {
    const c = rifle(0, 40);
    expect(c.startReload()).toBe(true);
    c.update(100);
    c.setOverclock(true);
    expect(c.snapshot).toMatchObject({reloading: false, magazine: 30, reserve: 10});
    c.fire(0);
    expect(c.snapshot.magazine).toBe(30);
    c.setOverclock(false);
    c.update(1000);
    c.fire(0);
    expect(c.snapshot.magazine).toBe(29);
    expect(c.snapshot.fireCooldownRemainingMs).toBeCloseTo(1000 / WEAPONS.rifle.roundsPerSecond);
    expect(c.startReload()).toBe(true);
    expect(c.snapshot.reloading).toBe(true);
  });

  it('instant reload transfers available reserves and triggers ordinary reload boons', () => {
    const c = rifle(1, 3);
    c.setBuild({mutations: ['hot-reload']});
    expect(c.instantReload()).toBe(true);
    expect(c.snapshot).toMatchObject({magazine: 4, reserve: 0, reloading: false});
    const shot = c.fire(0)[0];
    expect(shot.primed).toBe(true);
    expect(shot.damage).toBe(WEAPONS.rifle.damage * 1.5);
    expect(c.instantReload()).toBe(false);
  });

  it('keeps grenade clocks at normal speed and reset restores normal ammunition use', () => {
    const c = new CombatSystem();
    c.throwGrenade(0);
    c.setOverclock(true);
    c.update(100);
    expect(c.snapshot.grenadeCooldownRemainingMs).toBe(1100);
    c.reset();
    const before = c.snapshot.magazine;
    c.fire(0);
    expect(c.snapshot.magazine).toBe(before - 1);
  });
});
