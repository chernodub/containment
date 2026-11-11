import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {RIG_IDS} from '../src/game/abilities/catalog';
import type {RunStatsSnapshot} from '../src/game/abilities/RunStats';
import type {AbilityId, RigId} from '../src/game/abilities/contract';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {createExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

const STEP_MS = 50;
const FIGHT_MS = 30_000;
const MAX_SPAWNS = 60;
const ACTIVE_ENEMIES = 6;

/** A repeatable moving fight: ordinary AI, real rifle rounds, circle kiting, no boons or augments. */
function fight(rig: RigId) {
  let measuring = true;
  let pendingAbilityDamage = 0;
  const damageByAbility: Partial<Record<AbilityId, number>> = {};
  const targetsByAbility: Partial<Record<AbilityId, number>> = {};
  const poolTargets = new Map<number, number>();
  let poolPulses = 0;
  const game = new DepthGame(effect => {
    if (!measuring) return;
    if (effect.source === 'ability') pendingAbilityDamage += effect.damage ?? 0;
    const event = effect.ability;
    if (!event || (event.phase !== 'impact' && event.phase !== 'tick' && event.phase !== 'burst')) return;
    if (pendingAbilityDamage) {
      damageByAbility[event.ability] = (damageByAbility[event.ability] ?? 0) + pendingAbilityDamage;
      pendingAbilityDamage = 0;
    }
    if (event.targetIds) targetsByAbility[event.ability] = (targetsByAbility[event.ability] ?? 0) + event.targetIds.length;
    if (event.ability === 'napalm-charge' && event.phase === 'tick' && event.targetIds) {
      poolPulses++;
      for (const id of event.targetIds) poolTargets.set(id, (poolTargets.get(id) ?? 0) + 1);
    }
  });
  game.newRun(137, {rigSelect: true});
  game.chooseRig(rig);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  // Keep host adapters and AI; use a known open room and an explicit, bounded replacement budget.
  game['director'].reset();
  game['pending'] = [];
  game.enemies.reset();
  const room = createExpeditionGeometry({...game.node, templateId: 'receiving'});
  game.geometry = {...room, blockers: room.boundaryWalls};
  game.navigation = new FacilityNavigation(game.geometry);
  game.combat.setBuild({mutations: [], rig});
  game.switchWeapon('rifle');
  Object.assign(game.player, {x: 820, y: 440, angle: Math.PI});
  let spawned = 0;
  let powerUsed = false;
  let firstOverdriveReadyMs: number | null = null;
  let statsAt30: RunStatsSnapshot | null = null;
  let chargeAt30 = 0;
  let spawnedAt30 = 0;
  let observedThroughMs = 0;

  // Snapshot damage at 30s; continue the same cadence only until the first fill (60s ceiling).
  for (let elapsedMs = 0; elapsedMs < FIGHT_MS * 2; elapsedMs += STEP_MS) {
    while (game.enemies.activeCount < ACTIVE_ENEMIES && spawned < MAX_SPAWNS) {
      const angle = spawned * Math.PI * 2 / ACTIVE_ENEMIES;
      const result = game.enemies.spawn(spawned % 3 === 0 ? 'brute' : 'crawler', 600 + Math.cos(angle) * 80, 440 + Math.sin(angle) * 80);
      if (!result.spawned) throw new Error('Balance encounter exceeded its spawn budget');
      spawned++;
    }
    const nearest = [...game.targets()].sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y) || a.id - b.id)[0];
    game.setAimPoint(nearest ? {x: nearest.x, y: nearest.y} : null);
    if (nearest) game.player.angle = Math.atan2(nearest.y - game.player.y, nearest.x - game.player.x);
    if (!powerUsed) powerUsed = game.useAbility('power');
    if (game.abilities.snapshot.slots?.tactical.ready) game.useAbility('tactical');
    const phase = (elapsedMs + STEP_MS) / 1000;
    const dx = 600 + Math.cos(phase) * 220 - game.player.x;
    const dy = 440 + Math.sin(phase) * 220 - game.player.y;
    const length = Math.hypot(dx, dy) || 1;
    game.update(STEP_MS, {x: dx / length, y: dy / length, fire: true, angle: null, autoAim: true});
    if (firstOverdriveReadyMs === null && game.abilities.snapshot.overdrive.ready) firstOverdriveReadyMs = elapsedMs + STEP_MS;
    observedThroughMs = elapsedMs + STEP_MS;
    if (observedThroughMs === FIGHT_MS) {
      statsAt30 = game.stats;
      chargeAt30 = game.abilities.snapshot.overdrive.charge;
      spawnedAt30 = spawned;
      measuring = false;
    }
    if (game.status !== 'playing') throw new Error(`${rig} balance fight ended early at ${elapsedMs + STEP_MS}ms (${game.status})`);
    if (statsAt30 && firstOverdriveReadyMs !== null) break;
  }

  if (!statsAt30) throw new Error('Balance fight did not reach thirty seconds');
  const damage = statsAt30.damageDealt;
  // Without weapon boons, status ticks and launch/wall impacts originate exclusively from the rig.
  const rigDamage = damage.ability + damage.status + damage.boon;
  const totalDamage = damage.weapon + rigDamage;
  return {
    rig, durationMs: FIGHT_MS, spawned: spawnedAt30, kills: statsAt30.kills.total,
    shotsFired: statsAt30.shotsFired, shotsHit: statsAt30.shotsHit,
    weaponDamage: damage.weapon, abilityDamage: damage.ability, nativeStatusDamage: damage.status,
    nativeReactionDamage: damage.boon, totalDamage,
    abilityShare: rigDamage / totalDamage,
    tacticalUses: statsAt30.abilityUses.tactical, powerUses: statsAt30.abilityUses.power,
    overdrivesUsed: statsAt30.overdrivesUsed,
    overdriveChargeAt30: chargeAt30, firstOverdriveReadyMs, observedThroughMs,
    damageTaken: statsAt30.damageTaken,
    damageByAbility, targetsByAbility,
    ...(rig === 'pyro' ? {poolPulses, poolDistinctTargets: poolTargets.size,
      poolBurnApplications: [...poolTargets.values()].reduce((sum, count) => sum + count, 0),
      poolRepeatApplications: [...poolTargets.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0),
      poolApplicationsPerTarget: Object.fromEntries(poolTargets)} : {}),
  };
}

describe('Combat Rig mixed-play balance measurements', () => {
  it.each(RIG_IDS)('measures %s thirty-second damage share and first Overdrive fill under mixed play', rig => {
    const result = fight(rig);
    console.info(`[A1 balance] ${JSON.stringify({...result, abilityShare: Number((result.abilityShare * 100).toFixed(1)) + '%'})}`);
    expect(result.durationMs).toBe(30_000);
    expect(result.spawned).toBeLessThanOrEqual(MAX_SPAWNS);
    expect(result.weaponDamage).toBeGreaterThan(0);
    expect(result.abilityDamage).toBeGreaterThan(0);
    expect(result.totalDamage).toBeGreaterThan(0);
    expect(Object.values(result.damageByAbility).reduce((sum, amount) => sum + amount, 0)).toBeCloseTo(result.abilityDamage);
    expect(Number.isFinite(result.abilityShare)).toBe(true);
    expect(result.abilityShare).toBeGreaterThan(0);
    expect(result.abilityShare).toBeLessThan(1);
    expect(result.overdriveChargeAt30).toBeGreaterThan(0);
    expect(result.overdriveChargeAt30).toBeLessThanOrEqual(1);
    expect(result.tacticalUses).toBeGreaterThan(1);
    expect(result.powerUses).toBe(1);
    expect(result.overdrivesUsed).toBe(0);
    expect(result.shotsHit).toBeGreaterThan(0);
    if (result.firstOverdriveReadyMs !== null) {
      expect(result.firstOverdriveReadyMs).toBeGreaterThan(0);
      expect(result.firstOverdriveReadyMs).toBeLessThanOrEqual(FIGHT_MS * 2);
    }
  });
});
