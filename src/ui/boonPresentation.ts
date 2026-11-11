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
