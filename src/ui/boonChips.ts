import type {MutationDefinition} from '../game/roguelike/mutationCatalog';
import {boonConcepts} from './boonPresentation';
import {icon} from './icons';

const effectIcons = {pyro:'pyro', cryo:'cryo', arc:'arc', kinetic:'kinetic', recovery:'health', acid:'acid'};

/** All set badges use the same neutral identity, even on an elemental card. */
export function setChip(family: string, installed: number): string {
  const progress = Math.min(3, Math.max(0, installed));
  return `<span class="set-chip" data-set="${family}" aria-label="Set · ${family} ${progress}/3${installed >= 3 ? ' · bonus active' : ''}">${icon('loadout')}<span>Set · ${family} <b>${progress}/3</b>${installed >= 3 ? ' ◆' : ''}</span></span>`;
}

/** Explicit text, glyph and color describe effects; membership never supplies hue. */
export function effectChip(boon: MutationDefinition): string {
  const {element, effect} = boonConcepts(boon, 0);
  return `<span class="effect-chip" data-effect="${element}">${icon(effectIcons[element])}<span>Effect · ${effect}</span></span>`;
}

export function boonChips(boon: MutationDefinition, installed: number): string {
  return `<span class="boon-chips">${effectChip(boon)}${setChip(boon.family, installed)}</span>`;
}
