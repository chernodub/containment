import {describe, expect, it} from 'vitest';
import {DepthGame, type GameEffect} from '../src/DepthGame';
import {EnemySystem,type EnemySnapshot} from '../src/game/enemies/EnemySystem';
import {progressionFor} from '../src/game/roguelike/progression';
import type {RigId} from '../src/game/abilities/contract';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {generateRun} from '../src/game/roguelike/run';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {
  canOccupyExpedition,
  canTraverseExpedition,
  createExpeditionGeometry,
  hasClearExpeditionShot,
} from '../src/game/world/expeditionGeometry';

const STORY = generateRun(1729, 3).nodes;
const FAMILIES = ['crawler', 'brute', 'spitter', 'stalker', 'carrier'] as const;
const STEP_MS = 50;
// Optional longer investigation still enforces the ordinary 60-second gate below.
const HORIZON_MS = process.env.A3_SOAK_DIAGNOSTIC_120S === '1' ? 120_000 : 60_000;

/** Diagnostic fixtures use native actors and traversal; these are not campaign wins. */
function arena(rig: RigId) {
  const effects: GameEffect[] = [];
  const game = new DepthGame(effect => effects.push(effect));
  game.newRun(1729, {rigSelect: true});
  game.chooseRig(rig);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game['director'].reset();
  game['pending'] = [];
  game.enemies.reset();
  const room = createExpeditionGeometry({...game.node, templateId: 'receiving'});
  game.geometry = {...room, blockers: room.boundaryWalls};
  game.navigation = new FacilityNavigation(game.geometry);
  Object.assign(game.player, {x: 400, y: 440, angle: 0});
  game.combat.setBuild({rig, mutations: []});
  return {game, effects};
}

/** An update can slide around a corner in several legal legs. Validate the
 * accepted movement graph, rather than falsely testing the endpoint shortcut. */
function watchedMovement(game: DepthGame) {
  const accepted = new Map<number, Map<string, Set<string>>>();
  const key = (point: {x:number;y:number}) => `${point.x},${point.y}`;
  game.enemies = new EnemySystem({
    balance: progressionFor(game.node),
    canSeePlayer: (a,b) => hasClearExpeditionShot(game.geometry,a,b),
    launched: id => game['mutations'].isLaunched(id),
    canAttack: (a, b) => (a.type === 'spitter' ? canTraverseExpedition(game.geometry, a, b, 9) : hasClearExpeditionShot(game.geometry, a, b)) && !game.abilities.blocksMovement(a, b, 0),
    route: (enemy, target) => game.navigation.waypoint(enemy, target, 1),
    canMove: context => {
      const from = {x: context.fromX, y: context.fromY};
      const to = {x: context.toX, y: context.toY};
      const legal = canTraverseExpedition(game.geometry, from, to, context.radius) &&
        !game.abilities.blocksMovement(from, to, context.radius);
      if (legal) {
        let edges = accepted.get(context.enemyId);
        if (!edges) accepted.set(context.enemyId, edges = new Map());
        let ends = edges.get(key(from));
        if (!ends) edges.set(key(from), ends = new Set());
        ends.add(key(to));
      }
      return legal;
    },
  });
  return {
    begin() { accepted.clear(); return game.enemies.snapshot.enemies; },
    assert(before: readonly EnemySnapshot[]) {
      for (const enemy of game.enemies.snapshot.enemies) {
        expect(canOccupyExpedition(game.geometry, enemy, enemy.radius)).toBe(true);
        const start = key(before.find(body => body.id === enemy.id)!);
        const goal = key(enemy);
        const seen = new Set([start]), queue = [start], edges = accepted.get(enemy.id);
        for (let i = 0; i < queue.length && !seen.has(goal); i++) {
          for (const next of edges?.get(queue[i]) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
        }
        expect(seen.has(goal), `${game.node.templateId} ${enemy.id}: every position change requires a legal swept leg`).toBe(true);
      }
    },
  };
}

function advance(game: DepthGame, ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += STEP_MS) game.update(Math.min(STEP_MS, ms - elapsed));
}

function spawn(game: DepthGame, family: typeof FAMILIES[number], x: number, y: number) {
  const result = game.enemies.spawn(family, x, y);
  if (!result.spawned) throw new Error(`Could not spawn ${family}: ${result.reason}`);
  return result.enemy;
}

describe('A3 authored crowd navigation soak', () => {
  it('retains every one of the twenty story rooms', () => {
    expect(STORY).toHaveLength(20);
    expect(new Set(STORY.map(node => node.templateId)).size).toBe(20);
  });

  it.each(STORY.flatMap(node => ['entry', 'exit'].map(anchor => ({node, anchor}))))(
    '$node.templateId mixed breach crowds to $anchor remain reachable within 60 seconds',
    ({node, anchor}) => {
      const game = new DepthGame();
      game.node = node;
      game.geometry = createExpeditionGeometry(node);
      game.navigation = new FacilityNavigation(game.geometry);
      const movement = watchedMovement(game);
      Object.assign(game.player, anchor === 'entry' ? game.geometry.playerSpawn : game.geometry.exitPoint);
      expect(canOccupyExpedition(game.geometry, game.player, game.player.radius)).toBe(true);
      const waiting = new Set<number>();
      let maxOpportunityMs = 0;
      for (const breach of game.geometry.breaches) {
        const point = {x: breach.x + (breach.facing === 'east' ? 56 : -56), y: breach.y};
        for (const family of FAMILIES) {
          // Native placement searches legal body clearance beside the authored breach.
          const before = game.enemies.activeCount;
          expect(game['spawn'](family, point.x, point.y), `${family} ${breach.id}`).toBe(true);
          expect(game.enemies.activeCount).toBe(before + 1);
          waiting.add(game.enemies.snapshot.enemies.at(-1)!.id);
        }
      }
      expect(waiting.size).toBeGreaterThanOrEqual(20);
      const initialCount = waiting.size;
      // Diagnostic "kill exposed blockers" fixture: an immortal, already visible
      // front line can hold a narrow lane forever. Record the native LOS/range
      // opportunity, then resolve its full health+armor through ordinary damage.
      // Only the initial cohort is staged here; carrier spawn-request events are
      // not dispatched. This is finite-fight liveness, not an organic campaign.
      const opportunities = new Map<number, number>();
      for (let elapsed = 0; elapsed < HORIZON_MS && waiting.size; elapsed += STEP_MS) {
        const before = movement.begin();
        game.enemies.update(STEP_MS, game.player);
        movement.assert(before);
        for (const enemy of game.enemies.snapshot.enemies) {
          // A wall-occluded actor or a permanently distant orbit cannot satisfy
          // the opportunity. Exposed blockers then stop reserving narrow lanes.
          if (Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) < 600 &&
              hasClearExpeditionShot(game.geometry, game.player, enemy) && waiting.delete(enemy.id)) {
            maxOpportunityMs = elapsed + STEP_MS;
            opportunities.set(enemy.id, maxOpportunityMs);
            const death = game.enemies.applyDamage(enemy.id, Math.ceil(enemy.health + enemy.armor));
            expect(death.applied).toBe(true);
            expect(death.died).toBe(true);
          }
        }
      }
      const unresolved = game.enemies.snapshot.enemies.filter(enemy => waiting.has(enemy.id));
      console.info(`[A3 navigation soak] ${node.templateId} ${anchor}: ${initialCount - waiting.size}/${initialCount} exposed blockers cleared, last ${maxOpportunityMs}ms; horizon ${HORIZON_MS}ms; unresolved ${JSON.stringify(unresolved)}`);
      expect(unresolved, JSON.stringify(unresolved)).toEqual([]);
      expect(maxOpportunityMs).toBeLessThanOrEqual(60_000);
      expect(opportunities.size).toBe(initialCount);
      expect(game.enemies.activeCount).toBe(0);
    },
    15_000,
  );
});

describe('A3 multi-body ability interactions', () => {
  it.each(['breacher', 'cryo'] as const)('%s barriers keep every projected crowd step legal and resume after removal', rig => {
    const {game} = arena(rig);
    const movement = watchedMovement(game);
    game.setAimPoint({x: 500, y: 440});
    expect(game.useAbility('power')).toBe(true);
    advance(game, 200);
    expect(game.abilities.snapshot.deployables).toHaveLength(1);
    for (let i = 0; i < 12; i++) spawn(game, i % 3 ? 'stalker' : 'brute', 580 + i % 3 * 12, 410 + Math.floor(i / 3) * 16);
    let assaulted = false;
    let resumed = false;
    for (let frame = 0; frame < 180; frame++) {
      const before = movement.begin();
      const wall = game.abilities.snapshot.deployables[0];
      // Advance actors under the current wall before its natural assault/removal tick.
      game.enemies.update(STEP_MS, game.player);
      const after = game.enemies.snapshot.enemies;
      if (wall) movement.assert(before);
      game.abilities.update(STEP_MS);
      const live = game.abilities.snapshot.deployables[0];
      assaulted ||= !!live && live.health < live.maxHealth;
      resumed ||= !live && after.some(enemy => enemy.x < 480);
    }
    expect(assaulted).toBe(true);
    expect(game.abilities.snapshot.deployables).toHaveLength(0);
    expect(resumed).toBe(true);
  });

  it('preserves pylon links against a separated pack without making the pylon a movement wall', () => {
    const {game, effects} = arena('arc');
    game.setAimPoint({x: 620, y: 440});
    expect(game.useAbility('power')).toBe(true);
    advance(game, 250);
    expect(game.abilities.snapshot.deployables[0]?.kind).toBe('pylon');
    const enemies = Array.from({length: 8}, (_, i) => spawn(game, 'brute', 485 + i % 4 * 15, 425 + Math.floor(i / 4) * 20));
    expect(game.abilities.blocksMovement({x: 600, y: 440}, {x: 640, y: 440}, 28)).toBe(false);
    advance(game, 1500);
    expect(effects.some(effect => effect.ability?.ability === 'tesla-pylon' && effect.ability.phase === 'link' && (effect.ability.targetIds?.length ?? 0) > 0)).toBe(true);
    expect(enemies.some(enemy => {
      const after = game.enemies.getSnapshot(enemy.id);
      return !after || after.health + after.armor < enemy.health + enemy.armor;
    })).toBe(true);
    expect(game.stats.damageDealt.ability).toBeGreaterThan(0);
  });

  it('keeps Napalm zone damage and burn authoritative after pack separation', () => {
    const {game, effects} = arena('pyro');
    game.setAimPoint({x: 560, y: 440});
    expect(game.useAbility('power')).toBe(true);
    advance(game, 200);
    const enemies = Array.from({length: 8}, (_, i) => spawn(game, 'brute', 540 + i % 4 * 8, 425 + Math.floor(i / 4) * 16));
    advance(game, 500);
    expect(game.abilities.snapshot.zones.some(zone => zone.ability === 'napalm-charge')).toBe(true);
    expect(effects.some(effect => effect.ability?.ability === 'napalm-charge' && effect.ability.phase === 'tick' && (effect.ability.targetIds?.length ?? 0) >= 2)).toBe(true);
    expect(enemies.filter(enemy => game['mutations'].statuses(enemy.id).burning).length).toBeGreaterThanOrEqual(2);
    expect(game.stats.damageDealt.ability).toBeGreaterThan(0);
    advance(game, 500);
    expect(game.stats.damageDealt.status).toBeGreaterThan(0);
  });

  it('allows a launched body through a frozen crowd into an actual wall/body chain', () => {
    const {game, effects} = arena('breacher');
    game.combat.setBuild({rig: 'breacher', mutations: ['breacher', 'chain-reaction', 'seismic-impact']});
    const launched = spawn(game, 'carrier', 1030, 440);
    for (let i = 0; i < 3; i++) {
      const enemy = spawn(game, 'brute', 1140 + i * 15, 440);
      const target = game.targets().find(body => body.id === enemy.id)!;
      game['mutations'].applyAbilityStatus(target, 'freeze', 2000);
    }
    const target = game.targets().find(body => body.id === launched.id)!;
    game['mutations'].launchAbility(target, 1700, 0);
    expect(game['mutations'].isLaunched(launched.id)).toBe(true);
    advance(game, 500);
    expect(effects.some(effect => effect.type === 'wall-slam'),JSON.stringify({effects:effects.map(e=>({type:e.type,targetId:e.targetId,source:e.source,damage:e.damage,x:e.x,y:e.y})),enemies:game.enemies.snapshot.enemies})).toBe(true);
    expect(game.stats.damageDealt.boon).toBeGreaterThan(0);
    expect(game.enemies.snapshot.enemies.some(enemy => enemy.type === 'brute' && enemy.health + enemy.armor < enemy.maxHealth + enemy.maxArmor)).toBe(true);
  });
});
