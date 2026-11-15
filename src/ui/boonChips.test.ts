import {describe, expect, it} from 'vitest';
import {MUTATION_CATALOG} from '../game/roguelike/mutationCatalog';
import {boonChips} from './boonChips';
import {boonConcepts, boonElement, EFFECT_NAMES, EFFECT_SET_LESSON_KEY, needsEffectSetLesson} from './boonPresentation';

describe('explicit Effect and neutral Set vocabulary', () => {
  it.each(Object.values(MUTATION_CATALOG))('$id renders both chips from catalog identity, including augments', boon => {
    for (const installed of [0,2,3,8]) {
      const html=boonChips(boon,installed), concepts=boonConcepts(boon,installed);
      expect(html).toContain(`data-effect="${boonElement(boon)}"`);
      expect(html).toContain(`Effect · ${EFFECT_NAMES[boonElement(boon)]}`);
      expect(html).toContain(`Set · ${boon.family} <b>${Math.min(3,installed)}/3</b>`);
      expect(html).toContain(`data-set="${boon.family}"`);
      expect(html).not.toMatch(/--family-color|style=/);
      expect(concepts.set).toBe(boon.family);
    }
  });
  it('teaches cross-family effects only on a safe draft until explicitly acknowledged', () => {
    expect(needsEffectSetLesson([MUTATION_CATALOG.cryogenic],null)).toBe(false);
    expect(needsEffectSetLesson([MUTATION_CATALOG.incendiary],null)).toBe(true);
    const storage={getItem:(key:string)=>key===EFFECT_SET_LESSON_KEY?'seen':null};
    expect(needsEffectSetLesson([MUTATION_CATALOG.incendiary],storage)).toBe(false);
    expect(needsEffectSetLesson([MUTATION_CATALOG.incendiary],{getItem:()=>{throw Error('blocked');}})).toBe(true);
  });
});
