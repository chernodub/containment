import {RIG_CATALOG} from '../game/abilities/catalog';
import {pathFor} from '../game/roguelike/boonPaths';
import type {MutationDefinition} from '../game/roguelike/mutationCatalog';

export type BoonElement = 'kinetic' | 'cryo' | 'pyro' | 'arc' | 'recovery' | 'acid';

/** Element conveys the effect. Legacy family membership remains a separate badge. */
export function boonElement(boon: MutationDefinition): BoonElement {
  if (boon.rig) return RIG_CATALOG[boon.rig].element;
  if (['incendiary', 'scavenger', 'combustion'].includes(boon.id)) return 'pyro';
  if (['caustic-rounds', 'toxic-bloom'].includes(boon.id)) return 'acid';
  if (['arc-filament', 'conductive-shell', 'ball-lightning', 'cryo-conductor'].includes(boon.id)) return 'arc';
  if (boon.family === 'Cryo' || boon.id === 'shock-absorber') return 'cryo';
  if (['blood-price', 'blood-capacitor', 'reactive-barrier'].includes(boon.id)) return 'kinetic';
  if (boon.family === 'Recovery') return 'recovery';
  if (boon.family === 'Kinetic' || ['volatile-remains', 'last-shell', 'aftershock'].includes(boon.id)) return 'kinetic';
  return 'arc';
}

/** Augments retain dedicated glyphs; elemental boons show their actual effect. */
export function boonIcon(boon: MutationDefinition): string {
  if (boon.abilityOnly) return boon.id;
  const element = boonElement(boon);
  return element === 'pyro' ? 'pyro' : element === 'acid' ? 'acid'
    : element === 'recovery' ? 'boon-Recovery' : element === 'arc' ? 'arc'
    : `boon-${element === 'cryo' ? 'Cryo' : 'Kinetic'}`;
}

/** Do not repeat the family next to an identically named rig augment. */
export function boonPath(boon: MutationDefinition): string {
  return boon.abilityOnly ? `${boon.rig ? RIG_CATALOG[boon.rig].name : 'Universal'} augment`
    : pathFor(boon.id)?.name ?? ({pyro: 'Fire', cryo: 'Cryo control', arc: 'Arc & cycling', kinetic: 'Kinetic impact', recovery: 'Recovery', acid: 'Acid & poison'}[boonElement(boon)]);
}

/** Distinguish tactical advice, restrictions and actual costs without a combined label. */
export function boonRuleLabel(boon: MutationDefinition): string {
  if (boon.risk) return 'TRADE-OFF';
  if (boon.requires?.length || boon.requiresAny?.length) return 'CONDITION';
  if (/^Use\b/i.test(boon.tradeoff)) return 'TACTIC';
  if (/\bonly\b|\bno effect\b|\bcannot\b|\bcapped\b|\bresist\b|\bdoes not\b|\bdoesn.t\b/i.test(boon.tradeoff)) return 'LIMIT';
  return 'RULE';
}

export const EFFECT_NAMES: Readonly<Record<BoonElement, string>> = {
  pyro: 'Fire', cryo: 'Cryo', arc: 'Arc', kinetic: 'Kinetic', recovery: 'Recovery', acid: 'Acid',
};

/** Effect identity and legacy set membership are independent catalog facts. */
export function boonConcepts(boon: MutationDefinition, installed: number) {
  const element = boonElement(boon);
  return {element, effect: EFFECT_NAMES[element], set: boon.family, progress: Math.min(3, Math.max(0, installed))};
}

export const EFFECT_SET_LESSON_KEY = 'containment.effect-set-lesson.v1';
export const EFFECT_SET_LESSON = 'Effect tells you what a boon does. Set counts toward a three-boon bonus. Fire can belong to the Reactor set.';

/** First safe draft with a cross-family effect teaches the distinction once. */
export function needsEffectSetLesson(boons: readonly MutationDefinition[], storage: Pick<Storage, 'getItem'> | null): boolean {
  try { if (storage?.getItem(EFFECT_SET_LESSON_KEY) === 'seen') return false; } catch { /* Session fallback. */ }
  return boons.some(boon => ({kinetic:'Kinetic', cryo:'Cryo', arc:'Reactor', recovery:'Recovery', pyro:'Fire', acid:'Acid'}[boonElement(boon)]) !== boon.family);
}
