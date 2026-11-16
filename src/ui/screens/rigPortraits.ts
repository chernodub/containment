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
const base = `${import.meta.env.BASE_URL}assets/portraits/u10/`;

/** The original K10 marine, rendered in a braced cinematic studio pose. */
export function marinePortrait(rig: RigId, className = '', eager = false): string {
  return `<picture class="marine-portrait ${className}"><source type="image/webp" srcset="${base}${rig}-bust-256.webp 256w, ${base}${rig}-bust-640.webp 640w, ${base}${rig}-bust-1024.webp 1024w" sizes="${className==='rig-portrait-image'?'(max-height: 820px) 340px, 520px':'128px'}"><img src="${base}${rig}-bust.png" width="1024" height="1024" alt="${rig} marine. ${equipment[rig]}." loading="${eager?'eager':'lazy'}" decoding="async"></picture>`;
}

/** Large selected-rig portrait; the four renders share the same three-quarter camera. */
export function rigPortrait(rig: RigId): string {
  return `<figure class="rig-portrait" data-portrait="${rig}">${marinePortrait(rig,'rig-portrait-image',true)}<figcaption><span>CROWN–KEEL / ${rig.toUpperCase()}</span><span>LINK ESTABLISHED</span></figcaption></figure>`;
}

let preloaded = false;
const portraits: HTMLImageElement[] = [];
/** Warm the four small delivery images once; image decode never gates an action. */
export function preloadRigPortraits(): void {
  if (preloaded) return;
  preloaded = true;
  for (const rig of ['breacher','cryo','pyro','arc']) {
    const portrait = new Image();
    portrait.decoding = 'async';
    portrait.src = `${base}${rig}-bust-640.webp`;
    portraits.push(portrait);
  }
}
