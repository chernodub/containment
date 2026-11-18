import {MUTATION_CATALOG, type MutationDefinition} from '../game/roguelike/mutationCatalog';
import {pathFor} from '../game/roguelike/boonPaths';
import {boonElement} from './boonPresentation';

export type RewardArtFamily = ReturnType<typeof boonElement> | 'universal';
/** Inventory contains URLs only. Bitmap decode/upload starts when the reward is shown. */
const available = import.meta.glob('/public/assets/ui/rewards/*.{webp,png}', {eager:true, query:'?url', import:'default'}) as Record<string,string>;
const root = '/assets/ui/rewards/';
export const REWARD_ART_MANIFEST = Object.fromEntries(Object.values(MUTATION_CATALOG).map(boon => {
  const family: RewardArtFamily = boon.abilityOnly && !boon.rig ? 'universal' : boonElement(boon);
  const path = pathFor(boon.id);
  const pathArt = {breacher:'demolition', cryo:'executioner', pyro:'wildfire', arc:'cycling'};
  const studies = [boon.id, ...(!boon.abilityOnly && path ? [pathArt[path.rig]] : []), family];
  return [boon.id, {family, studies}];
}));

export function rewardArt(boon: MutationDefinition, compact = false): string {
  const entry = REWARD_ART_MANIFEST[boon.id];
  const first = (extension: string) => entry.studies.map(id => available[`/public${root}${id}.${extension}`]).find(Boolean);
  const webp = first('webp'), png = first('png');
  const image = png || webp ? `<picture>${webp?`<source type="image/webp" srcset="${webp}">`:''}<img src="${png??webp}" alt="" loading="lazy" decoding="async" width="960" height="600"></picture>` : '';
  return `<span class="reward-art${compact?' reward-art-compact':''}" data-art-family="${entry.family}" aria-hidden="true">${image}<span class="reward-art-grain"></span></span>`;
}
