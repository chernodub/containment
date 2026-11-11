import type { MutationDefinition } from '../roguelike/mutationCatalog';

/** Stable checkpoint IDs for the first twelve Combat Rig augments. */
export type AugmentId =
  | 'reserve-thruster'
  | 'tactical-salvage'
  | 'drive-dynamo'
  | 'slide-loader'
  | 'afterquake'
  | 'reinforced-bulwark'
  | 'spreading-nova'
  | 'twin-glacier'
  | 'scorched-fan'
  | 'napalm-triplet'
  | 'forked-overload'
  | 'twin-pylon';

const augment = (definition: MutationDefinition): MutationDefinition => Object.freeze(definition);

/** Ability-only boons enter drafts only when the caller supplies an active rig. */
export const AUGMENT_BOONS: Readonly<Record<AugmentId, MutationDefinition>> = Object.freeze({
  'reserve-thruster': augment({
    id: 'reserve-thruster', family: 'Kinetic', abilityOnly: true,
    name: 'Reserve Thruster', rarity: 'common',
    description: 'Store one additional dash charge, for three charges that recharge independently.',
    tradeoff: 'Dash distance, invulnerability and recharge time stay the same.',
  }),
  'tactical-salvage': augment({
    id: 'tactical-salvage', family: 'Recovery', abilityOnly: true,
    name: 'Tactical Salvage', rarity: 'common',
    description: 'Every kill refunds 0.35 seconds of your tactical ability cooldown.',
    tradeoff: 'Cannot reduce the cooldown below zero or bank refunds while ready.',
  }),
  'drive-dynamo': augment({
    id: 'drive-dynamo', family: 'Reactor', abilityOnly: true,
    name: 'Drive Dynamo', rarity: 'common',
    description: 'Damage and kills generate 30% more Overdrive charge.',
    tradeoff: 'Charge is still capped at one full Overdrive.',
  }),
  'slide-loader': augment({
    id: 'slide-loader', family: 'Reactor', abilityOnly: true,
    name: 'Slide Loader', rarity: 'common',
    description: 'Starting a dash instantly reloads the equipped weapon from its normal ammunition reserve.',
    tradeoff: 'Does not create ammunition; an empty reserve cannot refill the magazine.',
  }),
  afterquake: augment({
    id: 'afterquake', rig: 'breacher', family: 'Kinetic', abilityOnly: true,
    name: 'Afterquake', rarity: 'rare',
    description: 'Seismic Slam repeats at its impact point 0.45 seconds later, dealing 35 damage in the same radius.',
    tradeoff: 'One extra pulse per Slam. Walls still block its damage.',
  }),
  'reinforced-bulwark': augment({
    id: 'reinforced-bulwark', rig: 'breacher', family: 'Kinetic', abilityOnly: true,
    name: 'Reinforced Bulwark', rarity: 'common',
    description: 'Bulwark has 100% more health and lasts 2 seconds longer.',
    tradeoff: 'Its width and cooldown stay the same; enemies can still destroy it.',
  }),
  'spreading-nova': augment({
    id: 'spreading-nova', rig: 'cryo', family: 'Cryo', abilityOnly: true,
    name: 'Spreading Nova', rarity: 'rare',
    description: 'Cryo Nova gains 20 radius for each already chilled enemy in its original radius, up to 100 extra radius.',
    tradeoff: 'Counts visible chilled enemies before the Nova applies chill; newly reached enemies do not grow it again.',
  }),
  'twin-glacier': augment({
    id: 'twin-glacier', rig: 'cryo', family: 'Cryo', abilityOnly: true,
    name: 'Twin Glacier', rarity: 'common',
    description: 'Glacier raises two parallel ice walls, 40 units ahead of and behind the placement point along your aim.',
    tradeoff: 'Each wall keeps its normal health, lifetime and shatter. Blocked placements are skipped.',
  }),
  'scorched-fan': augment({
    id: 'scorched-fan', rig: 'pyro', family: 'Reactor', abilityOnly: true,
    name: 'Scorched Fan', rarity: 'common',
    description: 'Flashfire leaves a burning pool 180 units along your aim, with 120 radius for 2.5 seconds.',
    tradeoff: 'One pool per cast; normal fire ticks and wall rules apply.',
  }),
  'napalm-triplet': augment({
    id: 'napalm-triplet', rig: 'pyro', family: 'Reactor', abilityOnly: true,
    name: 'Napalm Triplet', rarity: 'rare',
    description: 'Napalm Charge creates three pools of 80 radius: at the cursor and 100 units to either side of your aim.',
    tradeoff: 'Replaces the single 120-radius pool. Each pool lasts the normal 6 seconds; blocked placements are skipped.',
  }),
  'forked-overload': augment({
    id: 'forked-overload', rig: 'arc', family: 'Reactor', abilityOnly: true,
    name: 'Forked Overload', rarity: 'common',
    description: 'Overload chains through two additional enemies, for up to eight distinct targets.',
    tradeoff: 'Normal jump range, line of sight and damage falloff still apply.',
  }),
  'twin-pylon': augment({
    id: 'twin-pylon', rig: 'arc', family: 'Reactor', abilityOnly: true,
    name: 'Twin Pylon', rarity: 'rare',
    description: 'Tesla Pylon deploys two pylons, 50 units to either side of the cursor across your aim.',
    tradeoff: 'Each keeps its normal health, lifetime, arcs and marine link; blocked placements are skipped.',
  }),
});
