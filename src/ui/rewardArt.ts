import {MUTATION_CATALOG, type MutationDefinition} from '../game/roguelike/mutationCatalog';
import {boonElement} from './boonPresentation';

export type RewardArtFamily = ReturnType<typeof boonElement> | 'universal';
/** Inventory contains URLs only. Bitmap decode/upload starts when the reward is shown. */
const available = import.meta.glob('/public/assets/ui/rewards/*.{webp,png}', {eager:true, query:'?url', import:'default'}) as Record<string,string>;
const root = '/assets/ui/rewards/';
export const REWARD_ART_MANIFEST = Object.fromEntries(Object.values(MUTATION_CATALOG).map(boon => {
  const family: RewardArtFamily = boon.abilityOnly && !boon.rig ? 'universal' : boonElement(boon);
  return [boon.id, {family, candidates:[`${boon.id}.webp`, `${boon.id}.png`, `${family}.webp`, `${family}.png`]}];
}));

/** Unique augment art wins; an authored family plate keeps new catalog entries covered. */
export function rewardArt(boon: MutationDefinition, compact = false): string {
  const entry = REWARD_ART_MANIFEST[boon.id];
  const url = (file: string) => available[`/public${root}${file}`];
  const webp = [boon.id, entry.family].map(id => url(`${id}.webp`)).find(Boolean);
  const png = [boon.id, entry.family].map(id => url(`${id}.png`)).find(Boolean);
  const image = png || webp ? `<picture>${webp?`<source type="image/webp" srcset="${webp}">`:''}<img src="${png??webp}" alt="" loading="lazy" decoding="async" width="960" height="600"></picture>` : '';
  return `<span class="reward-art${compact?' reward-art-compact':''}" data-art-family="${entry.family}" aria-hidden="true">${image}<span class="reward-art-grain"></span></span>`;
}
