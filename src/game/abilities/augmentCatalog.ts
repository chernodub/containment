import type {RigId} from './contract';
import type { MutationDefinition } from '../roguelike/mutationCatalog';

/** Stable checkpoint IDs for Combat Rig augments. */
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
  | 'twin-pylon'
  | 'siege-plow' | 'fault-line' | 'shard-harvest' | 'ice-road'
  | 'ember-relay' | 'meltdown-core' | 'pilgrim-pylon' | 'live-wire';


export const TRANSFORMATIVE_AUGMENT_PAIRS: Readonly<Record<RigId, readonly [AugmentId, AugmentId]>> = Object.freeze({
  breacher: ['siege-plow', 'fault-line'], cryo: ['shard-harvest', 'ice-road'],
  pyro: ['ember-relay', 'meltdown-core'], arc: ['pilgrim-pylon', 'live-wire'],
});
export const TRANSFORMATIVE_AUGMENT_IDS: readonly AugmentId[] = Object.freeze(Object.values(TRANSFORMATIVE_AUGMENT_PAIRS).flat());
export function conflictingAugment(id: string): AugmentId | undefined {
  for (const pair of Object.values(TRANSFORMATIVE_AUGMENT_PAIRS)) if (pair.includes(id as AugmentId)) return pair[0] === id ? pair[1] : pair[0];
  return undefined;
}

const augment = (definition: MutationDefinition): MutationDefinition => Object.freeze(definition);

/** Ability-only boons enter drafts only when the caller supplies an active rig. */
export const AUGMENT_BOONS: Readonly<Record<AugmentId, MutationDefinition>> = Object.freeze({
  "siege-plow": augment({"id": "siege-plow", "rig": "breacher", "family": "Kinetic", "abilityOnly": true, "name": "Siege Plow", "rarity": "rare", "whatChanges": "Bulwark advances and pushes a lane open.", "description": "Bulwark advances at 90 units/s, stopping at architecture. Every 0.5 seconds its face launches touching enemies forward.", "tradeoff": "Trades a fixed defense for a moving front; ordinary wall health and lifetime remain. Mutually exclusive with Fault Line."}),
  "fault-line": augment({"id": "fault-line", "rig": "breacher", "family": "Kinetic", "abilityOnly": true, "name": "Fault Line", "rarity": "rare", "whatChanges": "Slam leaves a lasting stagger fissure.", "description": "Slam leaves a 320-unit fissure along your aim for 3 seconds. Every 0.5 seconds its 70-unit lane deals 8 damage and 200 ms shock.", "tradeoff": "Walls block fissure damage. The fissure does not launch; the ordinary Slam still resolves once. Mutually exclusive with Siege Plow."}),
  "shard-harvest": augment({"id": "shard-harvest", "rig": "cryo", "family": "Cryo", "abilityOnly": true, "name": "Shard Harvest", "rarity": "rare", "whatChanges": "Frozen kills fire shards at nearby enemies.", "description": "Killing a frozen enemy hits the three nearest visible enemies within 220 units for 35 damage and one chill each.", "tradeoff": "Shard kills cannot trigger another shard volley. Whiteout retains its separate kill burst. Mutually exclusive with Ice Road."}),
  "ice-road": augment({"id": "ice-road", "rig": "cryo", "family": "Cryo", "abilityOnly": true, "name": "Ice Road", "rarity": "rare", "whatChanges": "Glacier becomes a traversable ice runway.", "description": "Glacier makes a 280-unit ice strip along your aim for 5 seconds. Its 100-unit lane chills enemies and multiplies your movement speed by 1.6 while on it.", "tradeoff": "Replaces walls and their shatter; roads cannot block enemies or shots. Twin Glacier creates parallel roads. Mutually exclusive with Shard Harvest."}),
  "ember-relay": augment({"id": "ember-relay", "rig": "pyro", "family": "Reactor", "abilityOnly": true, "name": "Ember Relay", "rarity": "rare", "whatChanges": "Fire zones relay ignition beyond their edges.", "description": "Every 0.5 seconds each fire zone relays sparks from occupants to the nearest visible non-burning enemies within 120 units, up to four sparks. Each deals 12 damage and ignites.", "tradeoff": "Sparks do not propagate recursively. A victim receives one spark per zone pulse; walls block relays. Mutually exclusive with Meltdown Core."}),
  "meltdown-core": augment({"id": "meltdown-core", "rig": "pyro", "family": "Reactor", "abilityOnly": true, "name": "Meltdown Core", "rarity": "rare", "whatChanges": "Meltdown becomes a short fuse and detonation.", "description": "Meltdown lasts 2 seconds, then detonates around you for 240 damage and ignition in a 260-unit radius. Movement and shot ignition bonuses last only during the fuse. Detonation grants 0.6 seconds of escape protection.", "tradeoff": "Replaces the normal 8-second aura. Leaving the room cancels an unfinished fuse. Mutually exclusive with Ember Relay."}),
  "pilgrim-pylon": augment({"id": "pilgrim-pylon", "rig": "arc", "family": "Reactor", "abilityOnly": true, "name": "Pilgrim Pylon", "rarity": "rare", "whatChanges": "Tesla Pylons follow behind the marine.", "description": "Pylons follow a point 100 units behind your aim at up to 180 units/s. Their ordinary arcs and marine links remain active.", "tradeoff": "Pylons obey architecture and can be left behind by a dash; they never teleport through walls. Mutually exclusive with Live Wire."}),
  "live-wire": augment({"id": "live-wire", "rig": "arc", "family": "Reactor", "abilityOnly": true, "name": "Live Wire", "rarity": "rare", "whatChanges": "Overload binds one target with a live tether.", "description": "Overload replaces its chain with a 4-second marine-to-enemy tether. Every 0.25 seconds enemies intersecting the 28-unit wire take 12 damage and 120 ms shock.", "tradeoff": "One target selected near the cursor. On its death the remaining tether passes to the nearest visible foe within 520 units. Walls or separation beyond 520 units break the wire. Forked Overload adds no targets. Mutually exclusive with Pilgrim Pylon."}),
  'reserve-thruster': augment({
    id: 'reserve-thruster', family: 'Kinetic', abilityOnly: true,
    name: 'Reserve Thruster', rarity: 'common',
    whatChanges: 'Store an extra dash charge.',
    description: 'Store one additional dash charge, for three charges that recharge independently.',
    tradeoff: 'Dash distance, invulnerability and recharge time stay the same.',
  }),
  'tactical-salvage': augment({
    id: 'tactical-salvage', family: 'Recovery', abilityOnly: true,
    name: 'Tactical Salvage', rarity: 'common',
    whatChanges: 'Kills recharge your tactical ability.',
    description: 'Every kill refunds 0.35 seconds of your tactical ability cooldown.',
    tradeoff: 'Cannot reduce the cooldown below zero or bank refunds while ready.',
  }),
  'drive-dynamo': augment({
    id: 'drive-dynamo', family: 'Reactor', abilityOnly: true,
    name: 'Drive Dynamo', rarity: 'common',
    whatChanges: 'Damage and kills charge Overdrive faster.',
    description: 'Damage and kills generate 30% more Overdrive charge.',
    tradeoff: 'Charge is still capped at one full Overdrive.',
  }),
  'slide-loader': augment({
    id: 'slide-loader', family: 'Reactor', abilityOnly: true,
    name: 'Slide Loader', rarity: 'common',
    whatChanges: 'Dashing reloads your equipped weapon.',
    description: 'Starting a dash instantly reloads the equipped weapon from its normal ammunition reserve.',
    tradeoff: 'Does not create ammunition; an empty reserve cannot refill the magazine.',
  }),
  afterquake: augment({
    id: 'afterquake', rig: 'breacher', family: 'Kinetic', abilityOnly: true,
    name: 'Afterquake', rarity: 'rare',
    whatChanges: 'Slam repeats at its impact point.',
    description: 'Seismic Slam repeats at its impact point 0.45 seconds later, dealing 35 damage in the same radius.',
    tradeoff: 'One extra pulse per Slam. Walls still block its damage.',
  }),
  'reinforced-bulwark': augment({
    id: 'reinforced-bulwark', rig: 'breacher', family: 'Kinetic', abilityOnly: true,
    name: 'Reinforced Bulwark', rarity: 'common',
    whatChanges: 'Bulwark survives longer under pressure.',
    description: 'Bulwark has 100% more health and lasts 2 seconds longer.',
    tradeoff: 'Its width and cooldown stay the same; enemies can still destroy it.',
  }),
  'spreading-nova': augment({
    id: 'spreading-nova', rig: 'cryo', family: 'Cryo', abilityOnly: true,
    name: 'Spreading Nova', rarity: 'rare',
    whatChanges: 'Chilled groups expand Cryo Nova.',
    description: 'Cryo Nova gains 20 radius for each already chilled enemy in its original radius, up to 100 extra radius.',
    tradeoff: 'Counts visible chilled enemies before the Nova applies chill; newly reached enemies do not grow it again.',
  }),
  'twin-glacier': augment({
    id: 'twin-glacier', rig: 'cryo', family: 'Cryo', abilityOnly: true,
    name: 'Twin Glacier', rarity: 'common',
    whatChanges: 'Glacier raises two parallel walls.',
    description: 'Glacier raises two parallel ice walls, 40 units ahead of and behind the placement point along your aim.',
    tradeoff: 'Each wall keeps its normal health, lifetime and shatter. Blocked placements are skipped.',
  }),
  'scorched-fan': augment({
    id: 'scorched-fan', rig: 'pyro', family: 'Reactor', abilityOnly: true,
    name: 'Scorched Fan', rarity: 'common',
    whatChanges: 'Flashfire leaves a burning pool.',
    description: 'Flashfire leaves a burning pool 180 units along your aim, with 120 radius for 2.5 seconds.',
    tradeoff: 'One pool per cast; normal fire ticks and wall rules apply.',
  }),
  'napalm-triplet': augment({
    id: 'napalm-triplet', rig: 'pyro', family: 'Reactor', abilityOnly: true,
    name: 'Napalm Triplet', rarity: 'rare',
    whatChanges: 'Napalm Charge scatters three fire pools.',
    description: 'Napalm Charge creates three pools of 80 radius: at the cursor and 100 units to either side of your aim.',
    tradeoff: 'Replaces the single 120-radius pool. Each pool lasts the normal 6 seconds; blocked placements are skipped.',
  }),
  'forked-overload': augment({
    id: 'forked-overload', rig: 'arc', family: 'Reactor', abilityOnly: true,
    name: 'Forked Overload', rarity: 'common',
    whatChanges: 'Overload chains through two more targets.',
    description: 'Overload chains through two additional enemies, for up to eight distinct targets.',
    tradeoff: 'Normal jump range, line of sight and damage falloff still apply.',
  }),
  'twin-pylon': augment({
    id: 'twin-pylon', rig: 'arc', family: 'Reactor', abilityOnly: true,
    name: 'Twin Pylon', rarity: 'rare',
    whatChanges: 'Deploy two linked Tesla Pylons.',
    description: 'Tesla Pylon deploys two pylons, 50 units to either side of the cursor across your aim.',
    tradeoff: 'Each keeps its normal health, lifetime, arcs and marine link; blocked placements are skipped.',
  }),
});

export const AUGMENT_IDS: readonly AugmentId[] = Object.freeze(Object.keys(AUGMENT_BOONS) as AugmentId[]);
export const AUGMENT_UPGRADE_RULES: Readonly<Partial<Record<AugmentId,string>>> = Object.freeze({'siege-plow':'Plow advances at 120 units/s.','fault-line':'Fissure lasts 4.5 seconds.','shard-harvest':'Frozen kills fire five shards.','ice-road':'Ice roads last 8 seconds.','ember-relay':'Relay sparks reach 180 units.','meltdown-core':'Detonation deals 320 damage.','pilgrim-pylon':'Following pylons travel at 260 units/s.','live-wire':'Tether lasts 6 seconds.'});
