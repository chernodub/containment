import {studioImage} from './studioArt';
import {AUGMENT_IDS} from '../game/abilities/augmentCatalog';
import {MUTATION_CATALOG, type MutationDefinition} from '../game/roguelike/mutationCatalog';
import {pathFor} from '../game/roguelike/boonPaths';
import {boonElement} from './boonPresentation';

export type RewardArtFamily = ReturnType<typeof boonElement> | 'universal';
export const REWARD_ART_MANIFEST = Object.fromEntries(Object.values(MUTATION_CATALOG).map(boon => {
  const family: RewardArtFamily = boon.abilityOnly && !boon.rig ? 'universal' : boonElement(boon);
  const path = pathFor(boon.id);
  const pathArt = {breacher:'demolition', cryo:'executioner', pyro:'wildfire', arc:'cycling'};
  const studies = [boon.id, ...(!boon.abilityOnly && path ? [pathArt[path.rig]] : []), family];
  return [boon.id, {family, studies}];
}));

export function rewardArt(boon: MutationDefinition, compact = false): string {
  const entry = REWARD_ART_MANIFEST[boon.id];
  const id = AUGMENT_IDS.some(id => id===boon.id) ? boon.id : entry.studies[1] ?? entry.family;
  const image = studioImage(`reward-${id}`);
  return `<span class="reward-art${compact?' reward-art-compact':''}" data-art-family="${entry.family}" aria-hidden="true">${image}<span class="reward-art-grain"></span></span>`;
}
