import { describe, expect, it } from 'vitest';
import { ABILITY_CATALOG } from '../src/game/abilities/catalog';
import type { AbilityEventPhase } from '../src/game/abilities/contract';
import { ABILITY_RECIPES, abilityLoopRecipe, abilityRecipe } from '../src/game/audio/abilityCues';
import { FAMILY_LEVELS, synthesize } from '../src/game/audio/synthesis';

function measure(samples: Float32Array) {
  let peak = 0, energy = 0, dc = 0, crossings = 0, early = 0, onsetEnergy = 0, onsetDifference = 0, difference = 0;
  const envelope = new Float64Array(12);
  for (let i = 0; i < samples.length; i++) {
    peak = Math.max(peak, Math.abs(samples[i])); energy += samples[i] ** 2; dc += samples[i];
    if (i && samples[i] * samples[i - 1] < 0) crossings++;
    if (i < samples.length * .2) early += samples[i] ** 2;
    if (i) difference += (samples[i] - samples[i - 1]) ** 2;
    envelope[Math.min(11, Math.floor(i / samples.length * 12))] += samples[i] ** 2;
    if (i > 0 && i < 720) { onsetEnergy += samples[i] ** 2; onsetDifference += (samples[i] - samples[i - 1]) ** 2; }
  }
  return { peak, rms: Math.sqrt(energy / samples.length), dc: dc / samples.length, crossings: crossings / samples.length, early: early / energy, onsetBrightness: onsetDifference / onsetEnergy, brightness: difference / energy, envelope: envelope.map(value => value / energy) };
}

describe('signature ability recipe inventory', () => {
  it('maps every ability and contract phase to authored, multi-layer PCM', () => {
    const phases: AbilityEventPhase[] = ['cast', 'impact', 'tick', 'end', 'burst', 'link', 'dash-start', 'dash-end', 'denied', 'ready', 'overdrive-ready'];
    for (const definition of Object.values(ABILITY_CATALOG)) for (const phase of phases) {
      const recipe = abilityRecipe({ phase, ability: definition.id, slot: definition.slot, rig: definition.rig, element: definition.element });
      expect(recipe).toBeDefined(); expect(recipe.layers.length).toBeGreaterThanOrEqual(2);
      expect(ABILITY_RECIPES).toContain(recipe);
    }
    expect(new Set(ABILITY_RECIPES.map(recipe => recipe.id)).size).toBe(ABILITY_RECIPES.length);
  });

  it('has bounded, deterministic, tapered signals within measured family loudness budgets', () => {
    for (const recipe of ABILITY_RECIPES) {
      const samples = synthesize(recipe, 12000);
      expect(samples).toEqual(synthesize(recipe, 12000));
      expect(samples.every(Number.isFinite)).toBe(true);
      expect(samples[0]).toBe(0); expect(samples.at(-1)).toBe(0);
      const metrics = measure(samples);
      expect(metrics.peak, recipe.id).toBeLessThanOrEqual(FAMILY_LEVELS[recipe.family].peak + 1e-6);
      expect(metrics.rms, recipe.id).toBeLessThanOrEqual((recipe.rms ?? FAMILY_LEVELS[recipe.family].rms) + 1e-6);
      expect(metrics.rms, recipe.id).toBeGreaterThan((recipe.rms ?? FAMILY_LEVELS[recipe.family].rms) * .34);
      expect(Math.abs(metrics.dc), recipe.id).toBeLessThan(.004);
      expect(recipe.duration).toBeLessThanOrEqual(recipe.loop ? 2 : 1.6);
    }
  });

  it('gives all sixteen impacts measurably different spectral/envelope fingerprints', () => {
    const fingerprints = Object.values(ABILITY_CATALOG).map(definition => {
      const recipe = abilityRecipe({ ability: definition.id, phase: 'impact', slot: definition.slot, rig: definition.rig, element: definition.element });
      return { id: definition.id, ...measure(synthesize(recipe, 12000)), duration: recipe.duration };
    });
    for (let a = 0; a < fingerprints.length; a++) for (let b = a + 1; b < fingerprints.length; b++) {
      const x = fingerprints[a], y = fingerprints[b];
      const difference = Math.abs(x.crossings - y.crossings) + Math.abs(x.early - y.early) + Math.abs(x.duration - y.duration);
      expect(difference, `${x.id}/${y.id}`).toBeGreaterThan(.025);
    }
    const kinetic = fingerprints.find(x => x.id === 'seismic-slam')!;
    const electric = fingerprints.find(x => x.id === 'static-step')!;
    // Weight the physical onset: zero-crossings over a long fading noise tail
    // overestimate high frequencies even when those samples carry little energy.
    expect(electric.onsetBrightness).toBeGreaterThan(kinetic.onsetBrightness * 2);
  });

  it('provides nine lingering beds with safe repeat boundaries and a real Overclock tick train', () => {
    const sustained = ['bulwark', 'frost-trail', 'afterburn', 'glacier', 'whiteout', 'napalm-charge', 'meltdown', 'tesla-pylon', 'overclock'] as const;
    for (const id of sustained) {
      const recipe = abilityLoopRecipe(id)!;
      expect(recipe.loop).toBe(true); expect(recipe.family).toBe('loop');
      const samples = synthesize(recipe, 12000);
      expect(samples[0]).toBe(0); expect(samples.at(-1)).toBe(0);
    }
    expect(abilityLoopRecipe('railbreaker')).toBeNull();
    const clock = abilityLoopRecipe('overclock')!;
    expect(clock.layers.filter(layer => layer.wave === 'pluck').map(layer => layer.delay ?? 0)).toEqual([0, .5, 1, 1.5]);
  });

  it('separates same-element sustained accents in both spectral energy and envelope', () => {
    const metrics = (id: string) => measure(synthesize(ABILITY_RECIPES.find(recipe => recipe.id === `ability:${id}:tick`)!, 24000));
    for (const [brighter, darker] of [['overload', 'tesla-pylon'], ['napalm-charge', 'afterburn']]) {
      const a = metrics(brighter), b = metrics(darker);
      // Differenced energy is an amplitude-weighted measure of high-frequency
      // content, so an inaudibly faint noise tail cannot satisfy the assertion.
      expect(a.brightness, `${brighter}/${darker}`).toBeGreaterThan(b.brightness * 5);
      const envelopeDistance = a.envelope.reduce((sum, value, i) => sum + Math.abs(value - b.envelope[i]), 0);
      expect(envelopeDistance, `${brighter}/${darker}`).toBeGreaterThan(.35);
    }
  });

  it('retains physical body under Static Step and Railbreaker transients without increasing their peak caps', () => {
    for (const [id, minimumRms] of [['static-step', .145], ['railbreaker', .12]] as const) {
      const recipe = ABILITY_RECIPES.find(cue => cue.id === `ability:${id}:impact`)!;
      const metrics = measure(synthesize(recipe, 24000));
      expect(metrics.rms, id).toBeGreaterThan(minimumRms);
      expect(metrics.peak, id).toBeLessThanOrEqual(.720001);
      expect(metrics.early, id).toBeLessThan(.85);
    }
  });
});
