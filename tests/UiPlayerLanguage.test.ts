import {describe, expect, it} from 'vitest';
import {formatDistance, playerFacingStat, playerFacingText, WORLD_UNITS_PER_METRE} from '../src/ui/units';
import {boonElement, boonIcon, boonPath} from '../src/ui/boonPresentation';
import {MUTATION_CATALOG} from '../src/game/roguelike/mutationCatalog';
import {ABILITY_CATALOG} from '../src/game/abilities/catalog';
import {abilityVignette} from '../src/ui/screens/abilityVignettes';

describe('player-facing units and elemental identity', () => {
  it('uses the same metre as world projection and retains small augment distances', () => {
    expect(WORLD_UNITS_PER_METRE).toBe(32);
    expect(formatDistance(32)).toBe('1 m');
    expect(formatDistance(20)).toBe('0.63 m');
    expect(playerFacingStat('Radius', '300')).toBe('9.38 m');
    expect(playerFacingStat('Damage', '300')).toBe('300');
    expect(playerFacingText('20 radius; up to 100 extra radius; 120-radius pool; 40 units ahead.')).toBe('0.63 m radius; up to 3.13 m extra radius; 3.75 m radius pool; 1.25 m ahead.');
  });
  it('converts every current authored distance at the UI boundary', () => {
    for (const boon of Object.values(MUTATION_CATALOG)) {
      expect(playerFacingText(boon.description+' '+boon.tradeoff)).not.toMatch(/\b\d+\s*(?:-\s*)?(?:extra\s+)?(?:units|radius)\b/);
      expect(boonPath(boon)).not.toMatch(/augment ·/);
    }
    for (const ability of Object.values(ABILITY_CATALOG)) expect(playerFacingText(ability.description)).not.toMatch(/\b\d+ units/);
    expect(playerFacingText('Mutation · Rare mutation · Mutations')).toBe('boon · Rare boon · boons');
  });
  it('separates fire, poison and recovery from legacy set colors', () => {
    expect(boonElement(MUTATION_CATALOG.incendiary)).toBe('pyro');
    expect(MUTATION_CATALOG.incendiary.family).toBe('Reactor');
    expect(boonIcon(MUTATION_CATALOG.incendiary)).toBe('pyro');
    expect(boonElement(MUTATION_CATALOG['scorched-fan'])).toBe('pyro');
    expect(boonElement(MUTATION_CATALOG['caustic-rounds'])).toBe('acid');
    expect(boonElement(MUTATION_CATALOG['field-medic'])).toBe('recovery');
    expect(boonElement(MUTATION_CATALOG['arc-filament'])).toBe('arc');
  });
  it('authors a distinct behavioral vignette for all sixteen abilities with consistent actors', () => {
    const scenes = Object.values(ABILITY_CATALOG).map(abilityVignette);
    expect(scenes).toHaveLength(16);
    expect(new Set(scenes).size).toBe(16);
    for (const scene of scenes) {
      expect(scene).toContain('vignette-arena');
      expect(scene).toContain('vignette-marine');
      expect(scene).toContain('vignette-enemy');
      expect(scene).toContain('role="img"');
    }
    expect(abilityVignette(ABILITY_CATALOG['cryo-nova'])).toContain('Instant cold pulse');
    expect(abilityVignette(ABILITY_CATALOG.whiteout)).toContain('moving blizzard');
    expect(abilityVignette(ABILITY_CATALOG.overclock)).toContain('Time dilation');
  });
});
