import {createHash} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {DepthGame, type Bullet, type GameEffect, type GameInput} from '../src/DepthGame';
import {ABILITY_LIMITS} from '../src/game/abilities/AbilitySystem';
import {ABILITY_CATALOG, RIG_IDS} from '../src/game/abilities/catalog';
import type {RigId} from '../src/game/abilities/contract';
import {ProjectileHitTracker} from '../src/game/combat/CombatSystem';
import {WEAPONS} from '../src/game/combat/catalog';
import type {StandardEnemyId} from '../src/game/enemies/types';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {CHECKPOINT_STORAGE_KEY, loadCheckpoint, type StorageLike} from '../src/game/roguelike/checkpoints';
import {createExpeditionGeometry, canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

const idle: GameInput = {x: 0, y: 0, fire: false, angle: 0, autoAim: false};
function memoryStorage() {
  const values = new Map<string, string>();
  const storage: StorageLike = {getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); }};
  return {storage, values};
}
function start(rig: RigId = 'breacher', storage: StorageLike | null = null) {
  const effects: GameEffect[] = [];
  const game = new DepthGame(e => effects.push(e), storage);
  game.newRun(137, {rigSelect: true});
  expect(game.chooseRig(rig)).toBe(true);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  return {game, effects};
}
/** Keep real collision, enemies, combat and runtime adapters; isolate encounter scheduling in combat tests. */
function arena(rig: RigId = 'breacher') {
  const fixture = start(rig);
  const game = fixture.game;
  game['director'].reset();
  game['pending'] = [];
  game.enemies.reset();
  const room = createExpeditionGeometry({...game.node, templateId: 'receiving'});
  game.geometry = {...room, blockers: room.boundaryWalls};
  game.navigation = new FacilityNavigation(game.geometry);
  Object.assign(game.player, {x: 400, y: 440, angle: 0, vx: 0, vy: 0});
  game.combat.setBuild({mutations: [], rig});
  fixture.effects.length = 0;
  return fixture;
}
function spawn(game: DepthGame, type: StandardEnemyId, x: number, y: number) {
  const result = game.enemies.spawn(type, x, y);
  expect(result.spawned).toBe(true);
  if (!result.spawned) throw new Error('Test enemy could not spawn');
  return result.enemy;
}
function advance(game: DepthGame, ms: number, input: GameInput = idle) {
  for (let remaining = ms; remaining > 0; remaining -= 50) game.update(Math.min(50, remaining), input);
}
function projectile(kind: Bullet['kind'], x: number, y: number): Bullet {
  return {kind, x, y, life: 2, request: {weaponId: 'plasma', damage: 5, speed: 260, radius: 4, angle: 0, penetration: 1, splashRadius: 0, knockback: 0}, tracker: new ProjectileHitTracker(1)};
}
function hash(game: DepthGame, effects: readonly GameEffect[]) {
  return createHash('sha256').update(JSON.stringify({player: game.player, enemies: game.enemies.snapshot, boss: game.boss.snapshot, combat: game.combat.snapshot, abilities: game.abilities.snapshot, stats: game.stats, pickups: game.pickups.snapshot, bullets: game.bullets, pools: game.pools, expedition: game.expedition, status: game.status, effects})).digest('hex');
}

describe('DepthGame Combat Rig flow and persistence', () => {
  it('reflects a newly drafted dash capacity immediately in cached snapshots', () => {
    const {game} = arena();
    expect(game.abilities.snapshot.slots!.dash.maxCharges).toBe(2);
    game.combat.setBuild({rig:'breacher',mutations:['reserve-thruster']});
    expect(game.abilities.snapshot.slots!.dash.maxCharges).toBe(3);
    const stable=game.abilities.snapshot;
    expect(game.abilities.snapshot).toBe(stable);
  });

  it('keeps legacy newRun starting directly at the boon with Breacher', () => {
    const game = new DepthGame();
    game.newRun(137);
    expect(game.status).toBe('reward');
    expect(game.expedition.run.phase).toBe('starting-boon');
    expect(game.abilities.snapshot.rig).toBe('breacher');
    expect(game.chooseRig('arc')).toBe(false);
    expect(game.useAbility('dash')).toBe(false);
    expect(game.stats.abilityUses.dash).toBe(0);
    game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    expect(game.status).toBe('playing');
    expect(game.useAbility('dash')).toBe(true);
  });

  it.each(RIG_IDS)('selects %s once before drafting and locks combat until then', rig => {
    const game = new DepthGame();
    game.newRun(137, {rigSelect: true});
    expect(game.expedition.run.phase).toBe('rig-select');
    expect(game.status).toBe('reward');
    expect(expeditionRewardOffers(game.expedition)).toEqual([]);
    const before = hash(game, []);
    game.update(50, {x: 1, y: 1, fire: true, angle: 1, autoAim: true});
    expect(hash(game, [])).toBe(before);
    expect(game.useAbility('tactical')).toBe(false);
    expect(game.chooseRig('invalid' as RigId)).toBe(false);
    expect(game.chooseRig(rig)).toBe(true);
    expect(game.expedition.run.phase).toBe('starting-boon');
    expect(game.combat.build.rig).toBe(rig);
    expect(game.abilities.snapshot.rig).toBe(rig);
    expect(game.chooseRig('breacher')).toBe(false);
    game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    expect(game.status).toBe('playing');
    expect(game.expedition.build.rig).toBe(rig);
    expect(game.useAbility('tactical')).toBe(true);
    expect(game.stats.abilityUses.tactical).toBe(1);
  });

  it('saves meter and statistics through a naturally cleared encounter, reward, route, and Continue', () => {
    const {storage, values} = memoryStorage();
    const {game} = start('arc', storage);
    expect(game.useAbility('dash')).toBe(true);
    // Let the real director dispatch every authored wave and resolve every death through DepthGame.
    for (let frame = 0; frame < 2000 && game.status === 'playing'; frame++) {
      game.update(50, {...idle, fire: frame % 4 === 0});
      for (const target of game.targets()) game.damage(target.id, 100_000, undefined, frame % 2 ? 'ability' : 'weapon');
    }
    expect(game.status).toBe('reward');
    expect(game.expedition.run.completedNodeIds).toEqual([game.node.id]);
    expect(game.stats.kills.total).toBeGreaterThan(0);
    expect(game.stats.damageDealt.ability).toBeGreaterThan(0);
    expect(game.stats.shotsFired).toBeGreaterThan(0);
    expect(game.abilities.snapshot.overdrive.charge).toBeGreaterThan(0);
    expect(game.checkpointStatus).toBe('saved');
    expect(values.has(CHECKPOINT_STORAGE_KEY)).toBe(true);
    const checkpoint = loadCheckpoint(storage)!;
    expect(checkpoint.stats).toEqual(game.stats);
    expect(checkpoint.abilities?.overdriveCharge).toBe(game.abilities.snapshot.overdrive.charge);
    expect(checkpoint.build.rig).toBe('arc');
    const continued = new DepthGame(() => {}, storage);
    expect(continued.continueRun()).toBe(true);
    expect(continued.status).toBe('reward');
    expect(continued.stats).toEqual(game.stats);
    expect(continued.kills).toBe(game.stats.kills.total);
    expect(continued.abilities.snapshot.overdrive.charge).toBe(checkpoint.abilities?.overdriveCharge);
    continued.chooseMutation(expeditionRewardOffers(continued.expedition)[0].id);
    expect(continued.status).toBe('route');
    const routeContinue = new DepthGame(() => {}, storage);
    expect(routeContinue.continueRun()).toBe(true);
    expect(routeContinue.status).toBe('route');
    const charge = routeContinue.abilities.snapshot.overdrive.charge;
    routeContinue.route(routeContinue.node.next[0]);
    expect(routeContinue.status).toBe('playing');
    expect(routeContinue.abilities.snapshot.overdrive.charge).toBe(charge);
    expect(routeContinue.stats.kills).toEqual(game.stats.kills);
    expect(routeContinue.stats.roomTimeMs[routeContinue.node.id]).toBe(0);
  });
});

describe('confirmed damage and run statistics in DepthGame', () => {
  it('reports applied ability damage, lethal hits, kill families and credits without overkill inflation', () => {
    const {game, effects} = arena('breacher');
    const enemy = spawn(game, 'crawler', 500, 440);
    expect(game.useAbility('tactical')).toBe(true);
    advance(game, 250);
    const hits = effects.filter(e => e.source === 'ability' && e.targetId === enemy.id);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({damage: enemy.health, lethal: true, source: 'ability'});
    expect(game.stats.damageDealt.ability).toBe(enemy.health);
    expect(game.stats.kills).toMatchObject({total: 1, byFamily: {crawler: 1}});
    expect(game.stats.creditsEarned).toBe(enemy.creditReward);
    expect(game.stats.abilityUses.tactical).toBe(1);
    const before = game.stats;
    expect(game.useAbility('tactical')).toBe(false);
    expect(game.stats).toBe(before);
    game.hurt(7);
    expect(game.stats.damageTaken).toBe(7);
  });

  it('coalesces simultaneous burn and poison receipts by target with applied amounts and lethal state', () => {
    const {game, effects} = arena('pyro');
    game.combat.setBuild({rig: 'pyro', mutations: ['incendiary', 'caustic-rounds']});
    const enemy = spawn(game, 'spitter', 700, 440);
    game.damage(enemy.id, enemy.health - 10, undefined, 'weapon');
    const target = game.targets().find(t => t.id === enemy.id)!;
    game['mutations'].hit('status-setup', 'pistol', target, {x: 1, y: 0});
    game['mutations'].applyAbilityStatus(target, 'freeze', 2000);
    advance(game, 450);
    const before = game.stats.damageDealt.status;
    effects.length = 0;
    game.update(50);
    const status = effects.filter(e => e.source === 'status');
    expect(status).toHaveLength(1);
    expect(status[0]).toMatchObject({targetId: enemy.id, damage: 6, lethal: true});
    expect(game.stats.damageDealt.status - before).toBe(6);
    expect(game.stats.damageDealt.status).toBe(10);
    expect(game.stats.kills.byFamily.spitter).toBe(1);
  });

  it('coalesces simultaneous delayed boon explosions with clamped lethal damage', () => {
    const {game, effects} = arena('arc');
    game.combat.setBuild({rig: 'arc', mutations: ['ball-lightning', 'aftershock']});
    const enemy = spawn(game, 'spitter', 700, 440);
    game.damage(enemy.id, enemy.health - 35, undefined, 'weapon');
    const target = game.targets().find(t => t.id === enemy.id)!;
    game['mutations'].applyAbilityStatus(target, 'freeze', 2000);
    // Ball Lightning resolves after 500ms; Aftershock created 50ms later resolves on the same tick.
    for (let arc = 0; arc < 3; arc++) game['mutations'].abilityArc(target, [target]);
    game.update(50);
    game['mutations'].hit('delayed-boon', 'pistol', target, {x: 1, y: 0});
    advance(game, 400);
    effects.length = 0;
    game.update(50);
    const boons = effects.filter(e => e.source === 'boon');
    expect(boons).toHaveLength(1);
    expect(boons[0]).toMatchObject({targetId: enemy.id, damage: 35, lethal: true});
    expect(game.stats.damageDealt.boon).toBe(35);
    expect(game.stats.kills.byFamily.spitter).toBe(1);
  });

  it('reports boon damage and counts shotgun pellets as one shot and one confirmed hit', () => {
    const {game, effects} = arena();
    game.combat.setBuild({rig: 'breacher', mutations: ['first-impact']});
    const enemy = spawn(game, 'brute', 510, 440);
    game.switchWeapon('shotgun');
    game.update(50, {...idle, fire: true});
    advance(game, 150);
    expect(game.stats.shotsFired).toBe(1);
    expect(game.stats.shotsHit).toBe(1);
    expect(game.stats.damageDealt.weapon).toBeGreaterThan(0);
    const boons = effects.filter(e => e.source === 'boon' && e.targetId === enemy.id);
    expect(boons).toHaveLength(1);
    expect(boons[0]).toMatchObject({damage: 18, lethal: false});
    expect(game.stats.damageDealt.boon).toBe(18);
    for (const e of effects.filter(e => e.damage !== undefined)) {
      expect(e.damage).toBeGreaterThan(0);
      expect(Number.isFinite(e.damage)).toBe(true);
      expect(typeof e.lethal).toBe('boolean');
      expect(['weapon', 'ability', 'status', 'boon']).toContain(e.source);
    }
  });
});

describe('desktop simulation collision and hostile time isolation', () => {
  it('dashes through enemies, stops at walls, and ignores direct and acid-pool damage during i-frames', () => {
    const {game} = arena('breacher');
    spawn(game, 'brute', 470, 440);
    game.pools.push({id: 1, x: 475, y: 440, radius: 200, life: 2, warning: 0, damage: 30, tick: 0});
    const health = game.combat.snapshot.health, armor = game.combat.snapshot.armor;
    expect(game.useAbility('dash')).toBe(true);
    game.hurt(100);
    advance(game, 150);
    expect(game.player.x).toBeCloseTo(550);
    expect(game.combat.snapshot).toMatchObject({health, armor});
    expect(game.stats.damageTaken).toBe(0);
    expect(canOccupyExpedition(game.geometry, game.player, game.player.radius)).toBe(true);
    advance(game, 100);
    game.hurt(7);
    expect(game.stats.damageTaken).toBe(7);
    game.pools = [];
    Object.assign(game.player, {x: 1160, y: 440, angle: 0});
    expect(game.useAbility('dash')).toBe(true);
    advance(game, 150);
    expect(game.player.x).toBeLessThanOrEqual(1184);
    expect(game.player.x).toBeGreaterThan(1160);
    expect(canOccupyExpedition(game.geometry, game.player, game.player.radius)).toBe(true);
  });

  it('integrates the full six-second Overclock window and a partial final step exactly', () => {
    const {game} = arena('arc');
    game.abilities.addCharge(6000); game.useAbility('overdrive');
    advance(game, 5990);
    const hostile = projectile('hazard', 700, 600); game.bullets.push(hostile);
    game.pools.push({id: 1, x: 900, y: 700, radius: 20, life: 2, warning: 0, damage: 6, tick: .5});
    game.update(50);
    // Ten friendly ms at 30%, then forty ms at normal hostile speed.
    expect(hostile.x).toBeCloseTo(700 + 260 * .043);
    expect(hostile.life).toBeCloseTo(2 - .043);
    expect(game.pools[0].life).toBeCloseTo(2 - .043);
    expect(game.abilities.snapshot.overdrive.active).toBe(false);
    game.update(50);
    expect(hostile.x).toBeCloseTo(700 + 260 * .093);
  });

  it('slows enemy attack clocks, movement, hostile bullets and pools while friendly clocks remain normal', () => {
    const {game} = arena('arc');
    const contact = spawn(game, 'brute', 443, 440);
    const distant = spawn(game, 'crawler', 1000, 440);
    game.update(50);
    const contactBefore = game.enemies.getSnapshot(contact.id)!;
    const distantBefore = game.enemies.getSnapshot(distant.id)!;
    expect(contactBefore.contactCooldownRemainingMs).toBeGreaterThan(0);
    const hostile = projectile('hazard', 700, 600), friendly = projectile('player', 700, 700);
    game.bullets.push(hostile, friendly);
    game.pools.push({id: 1, x: 900, y: 700, radius: 20, life: 2, warning: 0, damage: 6, tick: .5});
    game.pickups.spawn('credits', 10, 100, 100);
    game.abilities.addCharge(6000);
    expect(game.useAbility('overdrive')).toBe(true);
    expect(game.useAbility('power')).toBe(true);
    const magazine = game.combat.snapshot.magazine;
    const playerX = game.player.x;
    game.update(50, {...idle, x: 1, fire: true, angle: Math.PI, aimPoint: {x: 550, y: 500}});
    expect(game.abilities.hostileTimeScale).toBe(.3);
    expect(game.enemies.getSnapshot(contact.id)!.contactCooldownRemainingMs).toBeCloseTo(contactBefore.contactCooldownRemainingMs - 15);
    expect(distantBefore.x - game.enemies.getSnapshot(distant.id)!.x).toBeCloseTo(distantBefore.speed * .015);
    expect(hostile.x).toBeCloseTo(703.9);
    expect(hostile.life).toBeCloseTo(1.985);
    expect(friendly.x).toBeCloseTo(713);
    expect(friendly.life).toBeCloseTo(1.95);
    expect(game.pools[0]).toMatchObject({life: 1.985, tick: .485});
    expect(game.player.x - playerX).toBeCloseTo(11);
    expect(game.pickups.snapshot[0].ageMs).toBe(50);
    expect(game.combat.snapshot.magazine).toBe(magazine);
    expect(game.combat.snapshot.fireCooldownRemainingMs).toBeCloseTo(1000 / WEAPONS.shotgun.roundsPerSecond / 1.5);
    expect(game.abilities.snapshot.overdrive.activeRemainingMs).toBe(5950);
    expect(game.abilities.snapshot.slots?.power.cooldownRemainingMs).toBe(ABILITY_CATALOG['tesla-pylon'].cooldownMs - 50);
    expect(game.stats.overdrivesUsed).toBe(1);
  });

  it('slows a locked spitter wind-up and its ranged cooldown without changing its attack target', () => {
    const {game} = arena('arc');
    const enemy = spawn(game, 'spitter', 700, 440);
    game.update(50);
    const before = game.enemies.getSnapshot(enemy.id)!;
    expect(before.pendingAttack).toBe('spit');
    expect(before.windupMs).toBe(500);
    game.abilities.addCharge(6000);
    game.useAbility('overdrive');
    game.update(50, {...idle, y: 1});
    const slowed = game.enemies.getSnapshot(enemy.id)!;
    expect(slowed.windupMs).toBe(485);
    expect(slowed.rangedCooldownRemainingMs).toBe(before.rangedCooldownRemainingMs - 15);
    expect(slowed.lockX).toBe(before.lockX);
    expect(slowed.lockY).toBe(before.lockY);
    expect(game.player.y).toBe(451);
  });

  it('pauses ability timers, statistics, movement, damage and charge without accumulating wall time', () => {
    const {game, effects} = arena('arc');
    game.abilities.addCharge(6000);
    game.useAbility('overdrive');
    game.useAbility('dash');
    game.pause();
    const before = hash(game, effects);
    for (let frame = 0; frame < 100; frame++) game.update(50, {...idle, x: 1, fire: true});
    game.hurt(100);
    expect(hash(game, effects)).toBe(before);
    game.resume();
    game.update(50);
    expect(game.abilities.snapshot.overdrive.activeRemainingMs).toBe(5950);
  });
});

describe('ability replay and long-running host state', () => {
  it.each(RIG_IDS)('replays %s rig with identical seeded state hashes and presentation receipts', rig => {
    function replay() {
      const {game, effects} = arena(rig);
      for (let i = 0; i < 6; i++) spawn(game, 'brute', 550 + (i % 3) * 100, 340 + Math.floor(i / 3) * 180);
      game.setAimPoint({x: 600, y: 440});
      game.abilities.addCharge(6000);
      const hashes: string[] = [];
      for (let frame = 0; frame < 260; frame++) {
        if (frame === 0) game.useAbility('power');
        if (frame === 30) game.useAbility('tactical');
        if (frame === 60) game.useAbility('dash');
        if (frame === 90) game.useAbility('overdrive');
        game.update(16, {x: 0, y: frame < 60 ? -.2 : 0, fire: frame % 2 === 0, angle: frame / 260, autoAim: false});
        if (frame % 26 === 0) hashes.push(hash(game, effects));
      }
      expect(game.stats.abilityUses).toEqual({dash: 1, tactical: 1, power: 1, overdrive: 1});
      expect(game.status).toBe('playing');
      return hashes;
    }
    expect(replay()).toEqual(replay());
  });

  it.each(RIG_IDS)('keeps %s host combat finite and ability entities bounded during repeated casts', rig => {
    const {game} = arena(rig);
    // Two simulated minutes of repeated real host casts and damage/status/death receipts.
    for (let frame = 0; frame < 2400; frame++) {
      if (frame % 80 === 0 && game.enemies.activeCount < 8) spawn(game, 'brute', 600 + (frame % 3) * 70, 300 + (frame % 4) * 90);
      if (frame % 120 === 0) game.abilities.addCharge(6000);
      game.setAimPoint({x: 650, y: 440});
      for (const slot of ['dash', 'tactical', 'power', 'overdrive'] as const) game.useAbility(slot);
      game.update(50, {...idle, fire: true, autoAim: true, angle: null});
      if (frame % 10 === 0) {
        const resources = game.combat.getRunResources();
        game.combat.restoreRunResources({...resources, health: 100, armor: 50});
      }
      expect(game.status).toBe('playing');
      expect(game.abilities.snapshot.zones.length).toBeLessThanOrEqual(ABILITY_LIMITS.zones);
      expect(game.abilities.snapshot.deployables.length).toBeLessThanOrEqual(ABILITY_LIMITS.deployables);
      expect(game.enemies.activeCount).toBeLessThanOrEqual(8);
      expect(game.bullets.length).toBeLessThan(100);
      expect(Number.isFinite(game.player.x) && Number.isFinite(game.player.y)).toBe(true);
      expect(canOccupyExpedition(game.geometry, game.player, game.player.radius)).toBe(true);
      for (const value of Object.values(game.stats.damageDealt)) expect(Number.isFinite(value)).toBe(true);
    }
    expect(game.stats.abilityUses.dash).toBeGreaterThan(2);
    expect(game.stats.abilityUses.tactical).toBeGreaterThan(2);
    expect(game.stats.abilityUses.power).toBeGreaterThan(2);
    expect(game.stats.overdrivesUsed).toBeGreaterThan(2);
  });
});
