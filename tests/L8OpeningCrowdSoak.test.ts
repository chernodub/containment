import {afterAll, describe, expect, it} from 'vitest';
import {hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {
  L8_STORY, L8_FAMILIES, L8_STEP_MS, l8Arena, l8Plan, writeL8Report,
} from './helpers/l8SimulationHarness';

// Named-space anchors and a dense grid do not necessarily hit a doorway's
// exact center. Exercise every authored lane without moving the marine away
// from a troublesome threshold or increasing the native 60-second bound.
const cases = L8_STORY.flatMap(node => {
  const seen = new Set<string>();
  return l8Plan(node.templateId).openings.flatMap(opening => {
    const point = {
      x: (opening.from.x + opening.to.x) / 2,
      y: (opening.from.y + opening.to.y) / 2,
    };
    const key = `${point.x},${point.y}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{node, point, anchor: `${opening.a} ↔ ${opening.b}`}];
  });
});
const rows: unknown[] = [];
afterAll(() => writeL8Report('opening-midpoint-crowds.json', rows));

describe('L8 native mixed crowds at every authored opening midpoint', () => {
  it('covers all twenty rooms and every distinct opening midpoint', () => {
    expect(new Set(cases.map(c => c.node.templateId)).size).toBe(20);
    expect(cases.length).toBeGreaterThanOrEqual(60);
  });

  it.each(cases)('$node.templateId at $anchor ($point.x,$point.y)', ({node, point, anchor}) => {
    const {game, movement} = l8Arena(node, point);
    // Match production's 240-unit occupied-entrance fallback. A marine can
    // stand at a doorway/vent; the real director then uses the farthest breach,
    // rather than asking native spawn to place a Brute on top of the marine.
    const dispatches: {requested: string; used: string; family: string}[] = [];
    for (const requested of game.geometry.breaches) {
      const safe = Math.hypot(requested.x - point.x, requested.y - point.y) > 240
        ? requested : [...game.geometry.breaches].sort((a, b) =>
          Math.hypot(b.x - point.x, b.y - point.y) - Math.hypot(a.x - point.x, a.y - point.y))[0];
      for (const family of L8_FAMILIES) {
        expect(game['spawn'](family, safe.x + (safe.facing === 'east' ? 56 : -56), safe.y)).toBe(true);
        dispatches.push({requested: requested.id, used: safe.id, family});
      }
    }
    const initial = game.enemies.snapshot.enemies;
    expect(initial).toHaveLength(game.geometry.breaches.length * L8_FAMILIES.length);
    expect(initial.length).toBeGreaterThanOrEqual(20);
    const waiting = new Set(initial.map(enemy => enemy.id));
    let lastOpportunityMs = 0;
    for (let elapsed = 0; elapsed < 60000 && waiting.size; elapsed += L8_STEP_MS) {
      const before = movement.begin();
      game.enemies.update(L8_STEP_MS, game.player);
      movement.assert(before);
      for (const enemy of game.enemies.snapshot.enemies) {
        if (Math.hypot(enemy.x - point.x, enemy.y - point.y) >= 600
          || !hasClearExpeditionShot(game.geometry, point, enemy)
          || !waiting.delete(enemy.id)) continue;
        lastOpportunityMs = elapsed + L8_STEP_MS;
        const death = game.enemies.applyDamage(enemy.id, Math.ceil(enemy.health + enemy.armor));
        expect(death.applied).toBe(true);
        expect(death.died).toBe(true);
      }
    }
    const unresolved = game.enemies.snapshot.enemies.filter(enemy => waiting.has(enemy.id));
    const row = {room: node.templateId, anchor, point, initial: initial.length,
      cleared: initial.length - waiting.size, lastOpportunityMs, dispatches, unresolved};
    rows.push(row);
    expect(unresolved, JSON.stringify(row)).toEqual([]);
    expect(game.enemies.activeCount).toBe(0);
  }, 30000);
});
