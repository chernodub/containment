import { describe, expect, it } from 'vitest';
import { ENVIRONMENT_PROFILES, ENVIRONMENT_RECIPES, HEARTBEAT_RECIPE } from '../src/game/audio/environmentCues';
import { UI_CUES, UI_RECIPES, uiRecipe } from '../src/game/audio/uiCues';
import { FAMILY_LEVELS, synthesize, type CueRecipe } from '../src/game/audio/synthesis';

function measure(samples: Float32Array) {
  let peak = 0, square = 0, dc = 0, crossings = 0, early = 0;
  for (let i = 0; i < samples.length; i++) {
    peak = Math.max(peak, Math.abs(samples[i]));
    square += samples[i] * samples[i]; dc += samples[i];
    if (i && samples[i] * samples[i - 1] < 0) crossings++;
    if (i < samples.length / 3) early += samples[i] * samples[i];
  }
  return { peak, rms: Math.sqrt(square / samples.length), dc: dc / samples.length, crossings: crossings / samples.length, early: early / square };
}

describe('environment and interface authoring', () => {
  it('covers exactly ten environments and every frozen interface cue', () => {
    expect(ENVIRONMENT_RECIPES).toHaveLength(10);
    expect(UI_CUES).toHaveLength(22);
    expect(UI_RECIPES.map(recipe => recipe.id)).toEqual(UI_CUES.map(cue => `ui:${cue}`));
    for (const cue of UI_CUES) expect(uiRecipe(cue)).toBe(UI_RECIPES.find(recipe => recipe.id === `ui:${cue}`));
    for (const [environment, profile] of Object.entries(ENVIRONMENT_PROFILES)) {
      expect(profile.recipe.id).toBe(`ambience:${environment}`);
      expect(profile.recipe.loop).toBe(true);
      expect(profile.recipe.duration).toBeGreaterThanOrEqual(4);
      expect(profile.recipe.duration).toBeLessThanOrEqual(6);
      expect(profile.reverbSeconds).toBeGreaterThan(.5);
      expect(profile.reverbSeconds).toBeLessThan(4);
      expect(profile.damping).toBeGreaterThan(0);
      expect(profile.damping).toBeLessThan(1);
    }
  });

  it.each([...ENVIRONMENT_RECIPES, ...UI_RECIPES, HEARTBEAT_RECIPE])('$id has deterministic finite, silent-edged PCM inside its loudness budget', (recipe: CueRecipe) => {
    const rate = 12000, samples = synthesize(recipe, rate);
    expect(samples).toEqual(synthesize(recipe, rate));
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(samples[0]).toBe(0); expect(samples.at(-1)).toBe(0);
    const stats = measure(samples), levels = FAMILY_LEVELS[recipe.family];
    expect(stats.peak).toBeLessThanOrEqual((recipe.peak ?? levels.peak) + 1e-6);
    expect(stats.rms).toBeLessThanOrEqual((recipe.rms ?? levels.rms) + 1e-6);
    expect(stats.rms).toBeGreaterThan((recipe.rms ?? levels.rms) * .25);
    expect(Math.abs(stats.dc)).toBeLessThan(.001);
    expect(recipe.layers.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps all ambience beds similar in loudness but distinct in spectrum or envelope', () => {
    const stats = ENVIRONMENT_RECIPES.map(recipe => measure(synthesize(recipe, 12000)));
    const levels = stats.map(value => value.rms);
    expect(Math.max(...levels) / Math.min(...levels)).toBeLessThan(1.8);
    for (let i = 0; i < stats.length; i++) for (let j = 0; j < i; j++) {
      const difference = Math.abs(stats[i].crossings - stats[j].crossings) + Math.abs(stats[i].early - stats[j].early);
      expect(difference, `${ENVIRONMENT_RECIPES[i].id} / ${ENVIRONMENT_RECIPES[j].id}`).toBeGreaterThan(.002);
    }
    expect(ENVIRONMENT_PROFILES.cargo.reverbSeconds).toBeGreaterThan(ENVIRONMENT_PROFILES.communications.reverbSeconds * 3);
    expect(ENVIRONMENT_PROFILES.infested.damping).toBeLessThan(ENVIRONMENT_PROFILES.security.damping);
  });

  it('separates navigation from major beats and makes danger feedback sparse', () => {
    for (const cue of ['hover', 'slider', 'ability-ready'] as const) {
      const recipe = uiRecipe(cue);
      expect(recipe.duration).toBeLessThan(.12);
      expect(recipe.rms).toBeLessThan(.03);
    }
    for (const cue of ['room-enter', 'room-clear', 'boss-intro', 'overdrive-ready', 'death', 'victory'] as const) {
      expect(uiRecipe(cue).family).toBe('stinger');
      expect(uiRecipe(cue).duration).toBeLessThanOrEqual(1.75);
    }
    expect(uiRecipe('low-health').interval).toBeGreaterThanOrEqual(2.5);
    const heartbeat = synthesize(HEARTBEAT_RECIPE, 12000);
    const energy = (from: number, to: number) => {
      let sum = 0;
      for (let i = Math.floor(from * 12000); i < Math.floor(to * 12000); i++) sum += heartbeat[i] * heartbeat[i];
      return sum;
    };
    expect(energy(.03, .2)).toBeGreaterThan(energy(.6, 1.2) * 100);
    expect(energy(.27, .42)).toBeGreaterThan(energy(.6, 1.2) * 100);
  });
});
