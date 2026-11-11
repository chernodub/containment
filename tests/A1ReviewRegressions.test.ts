import {describe, expect, it} from 'vitest';
import {DepthGame, type GameEffect, type GameInput} from '../src/DepthGame';
import type {RigId} from '../src/game/abilities/contract';
import type {StandardEnemyId} from '../src/game/enemies/types';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {createExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

const idle: GameInput = {x: 0, y: 0, fire: false, angle: 0, autoAim: false};

/** Exercise real host damage, statuses, enemy AI and collision without scheduled waves. */
function arena(rig: RigId) {
  const effects: GameEffect[] = [];
  const game = new DepthGame(e => effects.push(e));
  game.newRun(137, {rigSelect: true});
  expect(game.chooseRig(rig)).toBe(true);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game['director'].reset();
  game['pending'] = [];
  game.enemies.reset();
  const room = createExpeditionGeometry({...game.node, templateId: 'receiving'});
  game.geometry = {...room, blockers: room.boundaryWalls};
  game.navigation = new FacilityNavigation(game.geometry);
  Object.assign(game.player, {x: 400, y: 440, angle: 0, vx: 0, vy: 0});
  game.combat.setBuild({mutations: [], rig});
  effects.length = 0;
  return {game, effects};
}

function spawn(game: DepthGame, type: StandardEnemyId, x: number, y = 440) {
  const result = game.enemies.spawn(type, x, y);
  if (!result.spawned) throw new Error(`Expected ${type} spawn: ${result.reason}`);
  return game.targets().find(t => t.id === result.enemy.id)!;
}

function advance(game: DepthGame, ms: number, input = idle) {
  for (let remaining = ms; remaining > 0; remaining -= 50) {
    game.update(Math.min(50, remaining), input);
  }
}

function ballCharges(effects: readonly GameEffect[]) {
  return effects.filter(e => e.type === 'boon' && e.boon === 'charge');
}

describe('Combat Rig review regressions in the real game host', () => {
  for (const control of ['freeze', 'shock', 'launch'] as const) {
    it(`turns resisted boss ${control} into a brief actual slowdown and restores its clock`, () => {
      const {game} = arena('arc');
      expect(game.boss.start(800, 440)).toBe(true);
      const queen = game.targets().find(t => t.id === -1)!;
      if (control === 'launch') game['mutations'].launchAbility(queen, 700, 0);
      else game['mutations'].applyAbilityStatus(queen, control, 1800);
      expect(game.boonStatuses(-1).frozen).toBe(false);
      const before = game.boss.snapshot.phaseRemainingMs;
      game.update(50);
      expect(before - game.boss.snapshot.phaseRemainingMs).toBeCloseTo(50 * .65);
      expect(game.boss.snapshot).toMatchObject({x: 800, y: 440});
      advance(game, 300);
      const afterControl = game.boss.snapshot.phaseRemainingMs;
      game.update(50);
      expect(afterControl - game.boss.snapshot.phaseRemainingMs).toBeCloseTo(50);
    });
  }

  it('notifies Cold Snap and Combat Medic once when Overclock reloads a newly equipped weapon', () => {
    const {game} = arena('arc');
    game.combat.setBuild({rig: 'arc', mutations: ['cold-snap', 'combat-medic', 'hot-reload']});
    const enemy = spawn(game, 'brute', 520);
    const resources = game.combat.getRunResources();
    expect(game.combat.restoreRunResources({...resources, health: 50,
      ammo: {...resources.ammo, rifle: {magazine: 0, reserve: 60}}})).toBe(true);
    game.abilities.addCharge(6000);
    expect(game.useAbility('overdrive')).toBe(true);
    expect(game.combat.snapshot.health).toBe(50);
    game.switchWeapon('rifle');
    expect(game.combat.snapshot).toMatchObject({magazine: 30, reserve: 30, health: 52, reloading: false});
    expect(game.boonStatuses(enemy.id).chillStacks).toBe(2);
    expect(game.combat.fire(0)[0].primed).toBe(true);
    game.switchWeapon('rifle');
    expect(game.boonStatuses(enemy.id).chillStacks).toBe(2);
    expect(game.combat.snapshot.health).toBe(52);
  });

  it('ignites a fresh lethal Meltdown weapon victim before Kindling spreads beyond the kill burst', () => {
    const {game, effects} = arena('pyro');
    game.combat.setBuild({rig: 'pyro', mutations: ['scavenger']});
    const victim = spawn(game, 'crawler', 700);
    const neighbor = spawn(game, 'brute', 795);
    game.damage(victim.id, victim.health - 1);
    for (const target of game.targets()) game['mutations'].applyAbilityStatus(target, 'shock', 2000);
    expect(game.boonStatuses(victim.id).burning).toBe(false);
    expect(game.boonStatuses(neighbor.id).burning).toBe(false);
    game.abilities.addCharge(6000);
    expect(game.useAbility('overdrive')).toBe(true);
    game.switchWeapon('pistol');
    game.update(50, {...idle, fire: true});
    advance(game, 350);
    expect(game.enemies.getSnapshot(victim.id)).toBeNull();
    expect(effects.some(e => e.targetId === victim.id && e.source === 'weapon' && e.lethal)).toBe(true);
    // The neighbor is outside Meltdown's 85-unit death burst and 130-unit marine aura.
    expect(game.boonStatuses(neighbor.id).burning).toBe(true);
    expect(effects.some(e => e.targetId === neighbor.id && e.source === 'ability')).toBe(false);
  });

  it('lets Tesla Pylon zaps trigger Ball Lightning without Arc Filament', () => {
    const {game, effects} = arena('arc');
    game.combat.setBuild({rig: 'arc', mutations: ['ball-lightning']});
    const enemy = spawn(game, 'brute', 775, 495);
    game['mutations'].applyAbilityStatus(enemy, 'freeze', 4000);
    game.setAimPoint({x: 700, y: 440});
    expect(game.useAbility('power')).toBe(true);
    advance(game, 1600);
    expect(ballCharges(effects)).toHaveLength(1);
    expect(ballCharges(effects)[0]).toMatchObject({x: 700, y: 440, durationMs: 500});
    expect(effects.some(e => e.source === 'boon' && e.damage === 22)).toBe(false);
    advance(game, 500);
    expect(effects.some(e => e.targetId === enemy.id && e.source === 'boon' && e.damage === 22)).toBe(true);
  });

  it('lets the third Static Step discharge trigger Ball Lightning without Arc Filament', () => {
    const {game, effects} = arena('arc');
    game.combat.setBuild({rig: 'arc', mutations: ['ball-lightning']});
    const enemy = spawn(game, 'brute', 600);
    game['mutations'].applyAbilityStatus(enemy, 'freeze', 10_000);
    const dash = () => {
      Object.assign(game.player, {x: 400, y: 440, angle: 0});
      expect(game.useAbility('dash')).toBe(true);
      advance(game, 150);
    };
    dash(); dash();
    expect(ballCharges(effects)).toEqual([]);
    advance(game, 2300);
    dash();
    expect(ballCharges(effects)).toHaveLength(1);
    expect(ballCharges(effects)[0].x).toBeCloseTo(550);
    expect(ballCharges(effects)[0].y).toBe(440);
    advance(game, 500);
    expect(effects.some(e => e.targetId === enemy.id && e.source === 'boon' && e.damage === 22)).toBe(true);
  });

  it('propagates Cryo Conductor chill from a lethally struck Overload origin before death cleanup', () => {
    const {game, effects} = arena('arc');
    game.combat.setBuild({rig: 'arc', mutations: ['cryo-conductor']});
    const origin = spawn(game, 'crawler', 650);
    const next = spawn(game, 'brute', 800);
    game.damage(origin.id, origin.health - 1);
    for (const target of game.targets()) game['mutations'].applyAbilityStatus(target, 'shock', 2000);
    game['mutations'].applyAbilityStatus(origin, 'chill', 1);
    expect(game.boonStatuses(next.id).chilled).toBe(false);
    game.setAimPoint({x: 650, y: 440});
    expect(game.useAbility('tactical')).toBe(true);
    expect(game.enemies.getSnapshot(origin.id)).toBeNull();
    expect(game.boonStatuses(next.id).chillStacks).toBe(1);
    expect(effects.some(e => e.targetId === next.id && e.source === 'ability' && e.damage === 51)).toBe(true);
  });

  for (const control of ['freeze', 'shock'] as const) {
    it(`prevents ${control} targets attacking a rig wall and resumes assault after expiry`, () => {
      const {game} = arena('breacher');
      const enemy = spawn(game, 'brute', 490);
      game['mutations'].applyAbilityStatus(enemy, control, 1000);
      expect(game.useAbility('power')).toBe(true);
      const wall = game.abilities.snapshot.deployables[0];
      expect(wall.health).toBe(240);
      advance(game, 750);
      expect(game.abilities.snapshot.deployables[0].health).toBe(240);
      advance(game, 500);
      expect(game.abilities.snapshot.deployables[0].health).toBeLessThan(240);
    });
  }

  it('clears the power active timer immediately when a hostile projectile destroys its only wall', () => {
    const {game} = arena('breacher');
    expect(game.useAbility('power')).toBe(true);
    expect(game.abilities.snapshot.slots!.power.activeRemainingMs).toBe(6000);
    expect(game.abilities.interceptProjectile({x: 600, y: 440}, {x: 400, y: 440}, 9, 240)).toBe(true);
    expect(game.abilities.snapshot.deployables).toEqual([]);
    expect(game.abilities.snapshot.slots!.power.activeRemainingMs).toBe(0);
    expect(game.abilities.snapshot.slots!.power.cooldownRemainingMs).toBe(16_000);
  });
});
