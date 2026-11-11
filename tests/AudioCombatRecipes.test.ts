import { describe, expect, it } from 'vitest';
import { COMBAT_RECIPES, enemyRecipe, impactRecipe, weaponRecipe } from '../src/game/audio/combatCues';
import { FAMILY_LEVELS, synthesize } from '../src/game/audio/synthesis';

function measure(pcm: Float32Array) {
  let energy = 0, peak = 0, dc = 0, crossings = 0, late = 0;
  for (let i = 0; i < pcm.length; i++) {
    const value = pcm[i]; energy += value * value; dc += value;
    peak = Math.max(peak, Math.abs(value));
    if (i && value * pcm[i - 1] < 0) crossings++;
    if (i > pcm.length * .5) late += value * value;
  }
  return { rms: Math.sqrt(energy / pcm.length), peak, dc: dc / pcm.length, crossings: crossings / pcm.length, tail: late / energy };
}

describe('combat audio authoring', () => {
  it('covers five weapons, fourteen impacts and every native/elite/champion/boss vocal', () => {
    expect(new Set(COMBAT_RECIPES.map(recipe => recipe.id)).size).toBe(COMBAT_RECIPES.length);
    expect(COMBAT_RECIPES.filter(recipe => recipe.family === 'weapon')).toHaveLength(5);
    expect(COMBAT_RECIPES.filter(recipe => recipe.family === 'impact')).toHaveLength(14);
    for (const family of ['crawler', 'brute', 'spitter', 'stalker', 'carrier', 'champion', 'warden', 'matron', 'queen', 'queen-phase-2', 'queen-phase-3']) {
      for (const phase of ['warning', 'attack', 'death'] as const) expect(enemyRecipe(family, phase).id).toBe(`enemy:${family}:${phase}`);
    }
    expect(enemyRecipe('spitter', 'warning').duration).toBe(.5);
    expect(enemyRecipe('brute', 'warning').duration).toBe(.85);
    expect(enemyRecipe('spitter', 'attack', true).id).toBe('enemy:spitter-elite:attack');
    expect(enemyRecipe('unknown', 'warning').id).toBe('enemy:crawler:warning');
  });

  it('renders deterministic finite layered PCM within declared family loudness and edge budgets', () => {
    for (const recipe of COMBAT_RECIPES) {
      const pcm = synthesize(recipe), m = measure(pcm), target = FAMILY_LEVELS[recipe.family];
      expect(recipe.layers.length, recipe.id).toBeGreaterThanOrEqual(3);
      expect(pcm, recipe.id).toEqual(synthesize(recipe));
      expect(pcm.every(Number.isFinite), recipe.id).toBe(true);
      expect(pcm[0], recipe.id).toBe(0); expect(pcm.at(-1), recipe.id).toBe(0);
      expect(m.peak, recipe.id).toBeLessThanOrEqual((recipe.peak ?? target.peak) + .000001);
      expect(m.rms, recipe.id).toBeLessThanOrEqual((recipe.rms ?? target.rms) + .000001);
      // Peak-normalized transients may fall below target RMS; they still carry useful energy.
      expect(m.rms, recipe.id).toBeGreaterThan((recipe.rms ?? target.rms) * .30);
      expect(Math.abs(m.dc), recipe.id).toBeLessThan(.002);
      expect(recipe.duration, recipe.id).toBeLessThanOrEqual(1.5);
      expect(Math.abs(pcm[1]), recipe.id).toBeLessThan(.002);
      expect(Math.abs(pcm[pcm.length - 2]), recipe.id).toBeLessThan(.002);
    }
  });

  it('keeps weapon spectra and envelopes individually identifiable, and variants deterministic', () => {
    const signatures = ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'].map(id => {
      const recipe = weaponRecipe(id as Parameters<typeof weaponRecipe>[0]);
      const a = synthesize(recipe, 24000, 1), b = synthesize(recipe, 24000, 2);
      expect(a).toEqual(synthesize(recipe, 24000, 1)); expect(a).not.toEqual(b);
      const m = measure(a); return [m.crossings, m.tail, recipe.duration];
    });
    for (let i = 0; i < signatures.length; i++) for (let j = i + 1; j < signatures.length; j++) {
      const distance = signatures[i].reduce((sum, value, k) => sum + Math.abs(value - signatures[j][k]), 0);
      expect(distance).toBeGreaterThan(.06);
    }
  });

  it('separates enemy throats and confirms armor/blocked quieter than flesh', () => {
    const signatures = ['crawler', 'brute', 'spitter', 'stalker', 'carrier'].map(family => {
      const recipe = enemyRecipe(family, 'attack'), m = measure(synthesize(recipe));
      return [m.crossings, m.tail, recipe.duration];
    });
    for (let i = 0; i < signatures.length; i++) for (let j = i + 1; j < signatures.length; j++) {
      const distance = signatures[i].reduce((sum, value, k) => sum + Math.abs(value - signatures[j][k]), 0);
      expect(distance).toBeGreaterThan(.055);
    }
    const flesh = measure(synthesize(impactRecipe('flesh'))).rms;
    expect(measure(synthesize(impactRecipe('armor'))).rms).toBeLessThan(flesh);
    expect(measure(synthesize(impactRecipe('blocked'))).rms).toBeLessThan(flesh);
    expect(measure(synthesize(impactRecipe('large-explosion'))).rms).toBeGreaterThan(measure(synthesize(impactRecipe('small-explosion'))).rms);
  });
});
