import type {RigId} from '../../game/abilities/contract';

export const RIG_FANTASIES: Readonly<Record<RigId, string>> = {
  breacher: 'BECOME THE BREACH.',
  cryo: 'STILL. SHATTER. SURVIVE.',
  pyro: 'LEAVE NOTHING STANDING.',
  arc: 'COMMAND THE CURRENT.',
};

const equipment: Readonly<Record<RigId, string>> = {
  breacher: 'Asymmetric amber ram shoulder and shield projector',
  cryo: 'Ice-blue insulated collar, coolant vessels and pressure hoses',
  pyro: 'Orange vent shield, hot stacks and ribbed gauntlets',
  arc: 'Violet open induction frames, capacitor bows and antenna forks',
};
const base = `${import.meta.env.BASE_URL}assets/ui/studio/`;

/** Portraits use the live marine model and the selected rig's paint. */
export function marinePortrait(rig: RigId, className = ''): string {
  return `<picture class="marine-portrait ${className}"><img src="${base}portrait-${rig}.png" width="640" height="640" alt="${rig} marine. ${equipment[rig]}." loading="lazy" decoding="async"></picture>`;
}

/** Large selected-rig portrait; the four renders share the same three-quarter camera. */
export function rigPortrait(rig: RigId): string {
  return `<figure class="rig-portrait" data-portrait="${rig}">${marinePortrait(rig,'rig-portrait-image')}<figcaption><span>CROWN–KEEL / ${rig.toUpperCase()}</span><span>LINK ESTABLISHED</span></figcaption></figure>`;
}
