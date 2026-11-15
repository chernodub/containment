import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {ABILITY_CATALOG, RIG_IDS} from '../src/game/abilities/catalog';
import type {RigId} from '../src/game/abilities/contract';
import {generateRun, isValidRunState} from '../src/game/roguelike/run';
import {progressionFor} from '../src/game/roguelike/progression';
import {createExpeditionGeometry, canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

const SEED = 137;
const STEP_MS = 50;
const LIMIT_MS = 240_000;
const ROOM_DEPTH = 9;
const CENTER = {x: 600, y: 440};
const KITE_RADIUS = 270;

/** Complete one real seeded Act 2 holdout: finite waves, ordinary AI, earned meter and real pistol rounds. */
function encounter(rig: RigId | null) {
  const impactTargets: Record<string, number> = {};
  const game = new DepthGame(effect => {
    if (effect.ability?.phase === 'impact') {
      const event = effect.ability;
      impactTargets[event.ability] = (impactTargets[event.ability] ?? 0) + (event.targetIds?.length ?? 0);
    }
  });
  game.newRun(SEED);
  const graph = generateRun(SEED);
  const node = graph.nodes[ROOM_DEPTH];
  // Start at a valid middle-act boundary without bringing previous-room boons or combat receipts into the trial.
  game.expedition = {...game.expedition, run: {...game.expedition.run, currentNodeId: node.id, completedNodeIds: graph.nodes.slice(0, ROOM_DEPTH).map(n => n.id), phase: 'combat'}, build: {mutations: [], rig: rig ?? 'breacher'}};
  game['enterRoom']();
  const room = createExpeditionGeometry({...game.node, templateId: 'receiving'});
  game.geometry = {...room, blockers: room.boundaryWalls};
  game.navigation = new FacilityNavigation(game.geometry);
  game['director'] = game['makeDirector']();
  game['encounterEvents'](game['director'].start());
  game.abilities.setRig(rig ?? 'breacher');
  game.switchWeapon('pistol');
  if (!isValidRunState(game.expedition.run) || game.abilities.snapshot.rig !== (rig ?? 'breacher')) throw new Error('Invalid full-kit trial setup');
  Object.assign(game.player, {x: CENTER.x + KITE_RADIUS, y: CENTER.y, angle: Math.PI});
  const plan = game['director'].plan;
  const composition = Object.fromEntries(['crawler', 'brute', 'spitter', 'stalker', 'carrier'].map(family => [family, plan.schedule.filter(spawn => spawn.enemyId === family).length]));
  let firstOverdriveReadyMs: number | null = null;
  let simulatedMs = 0;

  for (; simulatedMs < LIMIT_MS && game.status === 'playing'; simulatedMs += STEP_MS) {
    const targets = game.targets();
    const nearest = [...targets].sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y) || a.id - b.id)[0];
    // Aim placed abilities into the nearest visible group, shared by every rig.
    const cluster = [...targets].filter(t => Math.hypot(t.x - game.player.x, t.y - game.player.y) < 400).sort((a, b) => {
      const neighbors = (p: {x: number; y: number}) => targets.filter(t => Math.hypot(t.x - p.x, t.y - p.y) < 160).length;
      return neighbors(b) - neighbors(a) || Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y) || a.id - b.id;
    })[0] ?? nearest;
    if (cluster) {
      game.setAimPoint({x: cluster.x, y: cluster.y});
      game.player.angle = Math.atan2(cluster.y - game.player.y, cluster.x - game.player.x);
    }
    const radial = Math.atan2(game.player.y - CENTER.y, game.player.x - CENTER.x);
    const desired = {x: CENTER.x + Math.cos(radial + .08) * KITE_RADIUS, y: CENTER.y + Math.sin(radial + .08) * KITE_RADIUS};
    const dx = desired.x - game.player.x, dy = desired.y - game.player.y, length = Math.hypot(dx, dy) || 1;
    if (rig && nearest) {
      const slots = game.abilities.snapshot.slots!;
      const hazardNear = game.bullets.some(b => b.kind === 'hazard' && Math.hypot(b.x - game.player.x, b.y - game.player.y) < 105);
      if (slots.dash.ready && (hazardNear || Math.hypot(nearest.x - game.player.x, nearest.y - game.player.y) < 135)) {
        game.abilities.setIntent(dx / length, dy / length, cluster ? {x: cluster.x, y: cluster.y} : null);
        game.useAbility('dash');
      }
      if (slots.overdrive.ready) {
        if (firstOverdriveReadyMs === null) firstOverdriveReadyMs = simulatedMs;
        game.useAbility('overdrive');
      }
      const tactical = ABILITY_CATALOG[slots.tactical.id];
      const shape = tactical.shape;
      const tacticalRange = shape.kind === 'circle' ? shape.radius : shape.kind === 'cone' || shape.kind === 'chain' ? shape.range : shape.kind === 'line' || shape.kind === 'wall' ? shape.length : shape.distance;
      if (slots.tactical.ready && targets.some(t => Math.hypot(t.x - game.player.x, t.y - game.player.y) <= tacticalRange)) game.useAbility('tactical');
      if (slots.power.ready) game.useAbility('power');
    }
    if (game.combat.snapshot.health <= 60) game.heal();
    game.update(STEP_MS, {x: dx / length, y: dy / length, fire: true, angle: null, autoAim: true});
    if (firstOverdriveReadyMs === null && game.abilities.snapshot.overdrive.ready) firstOverdriveReadyMs = simulatedMs + STEP_MS;
    if (!canOccupyExpedition(game.geometry, game.player, game.player.radius)) throw new Error('Balance input policy left the room');
  }
  const damage = game.stats.damageDealt;
  const rigDamage = damage.ability + damage.status + damage.boon;
  const totalDamage = rigDamage + damage.weapon;
  return {
    rig: rig ?? 'weapons-only', seed: SEED, act: progressionFor(node).act + 1, status: game.status,
    plannedSpawns: plan.totalSpawns, composition, kills: game.stats.kills.total,
    clearMs: simulatedMs, firstOverdriveReadyMs,
    weaponDamage: damage.weapon, abilityDamage: damage.ability, nativeStatusDamage: damage.status,
    nativeReactionDamage: damage.boon, totalDamage, abilityShare: rigDamage / totalDamage,
    abilityUses: game.stats.abilityUses, overdrivesUsed: game.stats.overdrivesUsed,
    damageTaken: game.stats.damageTaken, shotsFired: game.stats.shotsFired, shotsHit: game.stats.shotsHit,
    remaining: game.encounterRemaining, impactTargets,
  };
}

describe('complete Combat Rig encounter balance', () => {
  it('keeps full-kit damage shares and clear times comparable across all rigs', () => {
    const results = [encounter(null), ...RIG_IDS.map(encounter)];
    for (const result of results) console.info(`[A1 full-kit balance] ${JSON.stringify({...result, abilityShare: `${(result.abilityShare * 100).toFixed(1)}%`})}`);
    const [baseline, ...rigs] = results;
    expect(baseline.status).toBe('reward');
    expect(baseline.abilityShare).toBe(0);
    expect(baseline.remaining).toBe(0);
    expect(baseline.act).toBe(2);
    expect(baseline.plannedSpawns).toBe(34);
    // L8 appends two real Transmission requests; the original32 remain exact.
    expect(baseline.composition).toEqual({crawler: 8, brute: 6, spitter: 10, stalker: 3, carrier: 7});
    expect(baseline.abilityUses).toEqual({dash: 0, tactical: 0, power: 0, overdrive: 0});
    for (const result of rigs) {
      expect(result.composition).toEqual(baseline.composition);
      expect(Object.values(result.composition).every(count => count > 0)).toBe(true);
      expect(result.status).toBe('reward');
      expect(result.remaining).toBe(0);
      expect(result.clearMs).toBeLessThan(LIMIT_MS);
      expect(result.kills).toBe(baseline.kills);
      expect(result.totalDamage).toBeCloseTo(baseline.totalDamage);
      expect(result.weaponDamage).toBeGreaterThan(0);
      expect.soft(result.abilityShare, `${result.rig} damage share`).toBeGreaterThanOrEqual(.30);
      expect.soft(result.abilityShare, `${result.rig} damage share`).toBeLessThanOrEqual(.45);
      for (const uses of Object.values(result.abilityUses)) expect(uses).toBeGreaterThan(0);
      expect(result.overdrivesUsed).toBeGreaterThanOrEqual(1);
    }
    const times = rigs.map(result => result.clearMs);
    expect.soft(Math.max(...times), 'full-kit clear-time spread').toBeLessThanOrEqual(Math.min(...times) * 1.25);
  }, 15_000);
});
