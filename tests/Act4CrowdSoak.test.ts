import { describe, expect, it } from 'vitest';
import { DepthGame, type GameEffect } from '../src/DepthGame';
import { EnemySystem, type EnemySnapshot } from '../src/game/enemies/EnemySystem';
import { progressionFor } from '../src/game/roguelike/progression';
import { generateRun } from '../src/game/roguelike/run';
import { FacilityNavigation } from '../src/game/world/FacilityNavigation';
import { canOccupyExpedition, canTraverseExpedition, createRoomTemplateGeometry, hasClearExpeditionShot, } from '../src/game/world/expeditionGeometry';
import {SHIP_ACT4_PLANS} from '../src/game/roguelike/shipArchitectureAct4';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
const STORY = generateRun(1729, 3).nodes.filter(node=>Object.hasOwn(SHIP_ACT4_PLANS,node.templateId));
const FAMILIES = ['crawler', 'brute', 'spitter', 'stalker', 'carrier'] as const;
const STEP_MS = 50;
// Optional longer investigation still enforces the ordinary 60-second gate below.
const HORIZON_MS = process.env.A3_SOAK_DIAGNOSTIC_120S === '1' ? 120000 : 60000;
/** An update can slide around a corner in several legal legs. Validate the
 * accepted movement graph, rather than falsely testing the endpoint shortcut. */
function watchedMovement(game: DepthGame) {
    const accepted = new Map<number, Map<string, Set<string>>>();
    const key = (point: {
        x: number;
        y: number;
    }) => `${point.x},${point.y}`;
    game.enemies = new EnemySystem({
        balance: progressionFor(game.node),
        canSeePlayer: (a, b) => hasClearExpeditionShot(game.geometry, a, b),
        launched: id => game['mutations'].isLaunched(id),
        canAttack: (a, b) => (a.type === 'spitter' ? canTraverseExpedition(game.geometry, a, b, 9) : hasClearExpeditionShot(game.geometry, a, b)) && !game.abilities.blocksMovement(a, b, 0),
        route: (enemy, target) => game.navigation.waypoint(enemy, target, 1),
        canMove: context => {
            const from = { x: context.fromX, y: context.fromY };
            const to = { x: context.toX, y: context.toY };
            const legal = canTraverseExpedition(game.geometry, from, to, context.radius) &&
                !game.abilities.blocksMovement(from, to, context.radius);
            if (legal) {
                let edges = accepted.get(context.enemyId);
                if (!edges)
                    accepted.set(context.enemyId, edges = new Map());
                let ends = edges.get(key(from));
                if (!ends)
                    edges.set(key(from), ends = new Set());
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
                    for (const next of edges?.get(queue[i]) ?? [])
                        if (!seen.has(next)) {
                            seen.add(next);
                            queue.push(next);
                        }
                }
                expect(seen.has(goal), `${game.node.templateId} ${enemy.id}: every position change requires a legal swept leg`).toBe(true);
            }
        },
    };
}
describe('Act4 prospective A3 native crowd navigation soak', () => {
    it('covers all five Act4 candidates', () => {
        expect(STORY).toHaveLength(5);
        expect(new Set(STORY.map(node => node.templateId)).size).toBe(5);
    });
    it.each(STORY.flatMap(node => ['entry', 'exit'].map(anchor => ({ node, anchor }))))('$node.templateId mixed breach crowds to $anchor remain reachable within 60 seconds', ({ node, anchor }) => {
        const game = new DepthGame();
        game.node = node;
        game.geometry = createRoomTemplateGeometry({...ROOM_TEMPLATES[node.templateId],...SHIP_ACT4_PLANS[node.templateId].topology},node.id);
        game.navigation = new FacilityNavigation(game.geometry);
        const movement = watchedMovement(game);
        Object.assign(game.player, anchor === 'entry' ? game.geometry.playerSpawn : game.geometry.exitPoint);
        expect(canOccupyExpedition(game.geometry, game.player, game.player.radius)).toBe(true);
        const waiting = new Set<number>();
        let maxOpportunityMs = 0;
        for (const breach of game.geometry.breaches) {
            const point = { x: breach.x + (breach.facing === 'east' ? 56 : -56), y: breach.y };
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
        expect(maxOpportunityMs).toBeLessThanOrEqual(60000);
        expect(opportunities.size).toBe(initialCount);
        expect(game.enemies.activeCount).toBe(0);
    }, 15000);
});
describe('Act4 deterministic native crowd replay',()=>{
 it.each(STORY)('$templateId replays identical mixed-family ingress and movement receipts',node=>{
  const replay=()=>{
   const game=new DepthGame();game.node=node;game.geometry=createRoomTemplateGeometry({...ROOM_TEMPLATES[node.templateId],...SHIP_ACT4_PLANS[node.templateId].topology},node.id);game.navigation=new FacilityNavigation(game.geometry);const movement=watchedMovement(game);
   Object.assign(game.player,game.geometry.playerSpawn);
   for(const breach of game.geometry.breaches)for(const family of FAMILIES)expect(game['spawn'](family,breach.x+(breach.facing==='east'?56:-56),breach.y)).toBe(true);
   const receipts=[];
   for(let tick=0;tick<80;tick++){const before=movement.begin();game.enemies.update(STEP_MS,game.player);movement.assert(before);receipts.push(JSON.stringify(game.enemies.snapshot));}
   return receipts;
  };
  expect(replay()).toEqual(replay());
 });
});
