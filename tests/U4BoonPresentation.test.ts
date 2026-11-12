import {describe, expect, it} from 'vitest';
import {MUTATION_CATALOG, MUTATION_IDS} from '../src/game/roguelike/mutationCatalog';
import {BOON_BENEFITS, boonBenefit, boonMetrics, boonNumbers} from '../src/ui/boonBenefits';
import {WORLD_UNITS_PER_METRE} from '../src/ui/units';
import {dismissesBoonInspection} from '../src/ui/screens/boonInspection';

describe('U4 benefit-first boon presentation', () => {
  it('preserves Escape combat pause while inspection modifiers are held', () => {
    expect(dismissesBoonInspection('Escape', false, true)).toBe(false);
    expect(dismissesBoonInspection('Escape', true, false)).toBe(false);
    expect(dismissesBoonInspection('Escape', true, true)).toBe(true);
    expect(dismissesBoonInspection('Enter', true, true)).toBe(false);
  });
  it('authors a short plain-language benefit for all sixty catalog ids', () => {
    expect(MUTATION_IDS).toHaveLength(60);
    expect(Object.keys(BOON_BENEFITS).sort()).toEqual([...MUTATION_IDS].sort());
    for (const boon of Object.values(MUTATION_CATALOG)) {
      expect(boonBenefit(boon).length, boon.id).toBeGreaterThan(10);
      expect(boonBenefit(boon).length, boon.id).toBeLessThanOrEqual(48);
      expect(boonBenefit(boon), boon.id).not.toMatch(/\d|radius|execution order/i);
    }
    expect(boonBenefit(MUTATION_CATALOG['spreading-nova'])).toBe('Chilled crowds expand Cryo Nova');
  });
  it('derives every displayed number from its current catalog description or rules', () => {
    for (const boon of Object.values(MUTATION_CATALOG)) {
      const definition = BOON_BENEFITS[boon.id];
      const metrics = boonMetrics(boon);
      expect(boonNumbers(boon), boon.id).not.toBe('');
      expect(metrics.length).toBe(definition.metrics.length);
      metrics.forEach((result, index) => {
        const metric = definition.metrics[index];
        const source = metric.source.exec(`${boon.description} ${boon.tradeoff}`)?.[1];
        expect(source, `${boon.id}: ${metric.source}`).toBeTruthy();
        expect(Number.isFinite(result.value), boon.id).toBe(true);
        const step = metric.kind === 'percent' ? 5 : ['distance', 'seconds'].includes(metric.kind) ? .5 : 1;
        expect(result.shown / step, boon.id).toBeCloseTo(Math.round(result.shown / step));
        const unrounded = metric.kind === 'distance' ? result.value / WORLD_UNITS_PER_METRE : result.value;
        expect(Math.abs(result.shown - unrounded), boon.id).toBeLessThanOrEqual(step / 2);
        expect(result.text.startsWith('≈'), boon.id).toBe(result.shown !== unrounded);
      });
    }
  });
  it('rounds card metrics while preserving catalog precision for inspection', () => {
    expect(boonNumbers(MUTATION_CATALOG['spreading-nova'])).toBe('≈+0.5 m / chilled · ≈+3 m max');
    expect(boonNumbers(MUTATION_CATALOG['tactical-salvage'])).toBe('≈−0.5 s cooldown per kill');
    expect(MUTATION_CATALOG['tactical-salvage'].description).toContain('0.35 seconds');
    expect(boonNumbers(MUTATION_CATALOG['ice-lance'])).toBe('2 targets in sequence · 1 s between lances');
    expect(boonNumbers(MUTATION_CATALOG['blood-price'])).toBe('+35% weapon damage · +20% damage taken');
    const changed = {...MUTATION_CATALOG['tactical-salvage'], description: 'Every kill refunds 1.25 seconds of your tactical ability cooldown.'};
    expect(boonNumbers(changed)).toBe('≈−1.5 s cooldown per kill');
  });
});
