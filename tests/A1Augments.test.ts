import { describe, expect, it } from 'vitest';
import { AUGMENT_BOONS, type AugmentId } from '../src/game/abilities/augmentCatalog';
import { RIG_CATALOG } from '../src/game/abilities/catalog';
import type { RigId } from '../src/game/abilities/contract';
import { activePaths, boonHint, pathFor, prerequisitesMet } from '../src/game/roguelike/boonPaths';
import { addMutation, createBuild, draftMutationOffers, isValidBuildState } from '../src/game/roguelike/builds';
import { MUTATION_CATALOG, MUTATION_IDS } from '../src/game/roguelike/mutationCatalog';
import type { BuildState } from '../src/game/roguelike/types';

const rigs = Object.keys(RIG_CATALOG) as RigId[];
const augments = Object.keys(AUGMENT_BOONS) as AugmentId[];
const legacyIds = MUTATION_IDS.filter(id => !MUTATION_CATALOG[id].abilityOnly);

describe('Combat Rig augment catalog and offers', () => {
  it('adds four universal and two augments per rig with readable bounded rules', () => {
    expect(augments).toHaveLength(12);
    expect(augments.filter(id => !AUGMENT_BOONS[id].rig)).toHaveLength(4);
    for (const rig of rigs) expect(augments.filter(id => AUGMENT_BOONS[id].rig === rig)).toHaveLength(2);
    for (const id of augments) {
      const boon = AUGMENT_BOONS[id];
      expect(MUTATION_CATALOG[id]).toBe(boon);
      expect(boon.id).toBe(id);
      expect(boon.abilityOnly).toBe(true);
      expect(boon.description.length).toBeGreaterThan(35);
      expect(boon.tradeoff.length).toBeGreaterThan(20);
      expect(boon.risk).not.toBe(true);
      expect(Object.isFrozen(boon)).toBe(true);
    }
    expect(AUGMENT_BOONS['spreading-nova'].description).toContain('up to 100');
    expect(AUGMENT_BOONS['forked-overload'].description).toContain('eight distinct targets');
    expect(AUGMENT_BOONS['slide-loader'].tradeoff).toContain('Does not create ammunition');
  });

  it('preserves sampled legacy deterministic drafts when no rig argument is passed', () => {
    const samples = [
      [0, false, ['permafrost', 'breacher', 'field-medic']],
      [0, true, ['frost-armor', 'breacher', 'field-medic']],
      [1, false, ['ice-lance', 'breacher', 'leech-rounds']],
      [1, true, ['absolute-zero', 'breacher', 'emergency-plating']],
      [17, false, ['ice-lance', 'breacher', 'leech-rounds']],
      [17, true, ['absolute-zero', 'breacher', 'emergency-plating']],
      [123, false, ['frostbite', 'breacher', 'rapid-cycle']],
      [123, true, ['glacial-wake', 'breacher', 'leech-rounds']],
      [4294967295, false, ['frostbite', 'breacher', 'ice-lance']],
      [4294967295, true, ['glacial-wake', 'breacher', 'ice-lance']],
    ] as const;
    for (const [seed, rare, expected] of samples) {
      expect(draftMutationOffers(seed, { mutations: ['cryogenic'] }, rare, [], 4).map(m => m.id)).toEqual(expected);
    }
    for (const rig of rigs) {
      expect(draftMutationOffers(1, { mutations: legacyIds, rig }, true)).toEqual([]);
    }
  });

  it('offers only matching rig and universal augments, deterministically and without duplicates', () => {
    for (const rig of rigs) {
      const build: BuildState = { mutations: legacyIds, rig };
      const seen = new Set<BuildState['mutations'][number]>();
      for (let seed = 0; seed < 64; seed++) {
        for (const rare of [false, true]) {
          const offers = draftMutationOffers(seed, build, rare, [], 8, rig);
          expect(offers).toEqual(draftMutationOffers(seed, build, rare, [], 8, rig));
          expect(offers).toHaveLength(3);
          expect(new Set(offers.map(m => m.id)).size).toBe(3);
          expect(offers.some(m => m.rig === rig)).toBe(true);
          if (rare) expect(offers.some(m => m.rarity === 'rare')).toBe(true);
          for (const m of offers) {
            expect(m.abilityOnly).toBe(true);
            expect(m.rig === undefined || m.rig === rig).toBe(true);
            expect(prerequisitesMet(m, build)).toBe(true);
            seen.add(m.id);
          }
        }
      }
      expect([...seen].sort()).toEqual(augments.filter(id => !AUGMENT_BOONS[id].rig || AUGMENT_BOONS[id].rig === rig).sort());
      const complete: BuildState = { ...build, mutations: [...legacyIds, ...seen] };
      expect(draftMutationOffers(1, complete, false, [], 0, rig)).toEqual([]);
    }
  });

  it('keeps all four path starters available for every rig and pairs augments with that rig path', () => {
    const starters = ['cryogenic', 'incendiary', 'breacher', 'hot-reload'];
    for (const rig of rigs) {
      const seen = new Set<string>();
      for (let seed = 0; seed < 64; seed++) {
        const offers = draftMutationOffers(seed, createBuild(rig), false, [], 0, rig);
        expect(offers).toHaveLength(3);
        for (const m of offers) {
          expect(starters).toContain(m.id);
          seen.add(m.id);
        }
      }
      expect([...seen].sort()).toEqual(starters.sort());
      expect(activePaths(createBuild(rig)).map(p => p.name)).toEqual([RIG_CATALOG[rig].boonPath]);
    }
    for (const id of augments) {
      const boon = AUGMENT_BOONS[id];
      const hint = boonHint(boon, createBuild(boon.rig ?? 'breacher'));
      if (boon.rig) {
        expect(pathFor(id)?.name).toBe(RIG_CATALOG[boon.rig].boonPath);
        expect(hint).toContain(`${RIG_CATALOG[boon.rig].name} rig augment`);
        expect(hint).toContain(RIG_CATALOG[boon.rig].boonPath);
      } else expect(hint).toBe('Universal rig augment.');
    }
  });

  it('validates and preserves optional rig state without accepting corrupt schema', () => {
    expect(isValidBuildState(createBuild())).toBe(true);
    for (const rig of rigs) {
      const initial = Object.freeze({ rig, mutations: Object.freeze([]) });
      const updated = addMutation(initial, 'reserve-thruster');
      expect(updated).toEqual({ rig, mutations: ['reserve-thruster'] });
      expect(initial.mutations).toEqual([]);
      expect(isValidBuildState(updated)).toBe(true);
    }
    for (const value of [
      { mutations: [], rig: 'unknown' }, { mutations: [], rig: null },
      { mutations: [], rig: undefined }, { mutations: [], rig: 'arc', extra: true },
      { mutations: ['reserve-thruster', 'reserve-thruster'], rig: 'arc' },
      { mutations: Array(1), rig: 'arc' }, Object.create({ mutations: [] }),
    ]) expect(isValidBuildState(value)).toBe(false);
    expect(() => draftMutationOffers(1, createBuild(), false, [], 0, 'unknown' as RigId)).toThrow('Invalid mutation draft');
  });
});
