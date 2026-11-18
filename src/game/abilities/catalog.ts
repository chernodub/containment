/**
 * Combat Rig design data: the four rigs and their sixteen abilities.
 *
 * This is the lead's design (docs/nextgen/00-VISION.md §4) expressed as data. UI reads names, text, shapes and
 * headline stats from here. The ability runtime owns the detailed tuning constants; when it tunes a number that is
 * mirrored here (cooldown, cast time, duration, shape, stat lines) it must update this file in the same change so
 * UI text never lies.
 *
 * World units: the marine's radius is 16 and run speed is 220 units/s; a crawler's radius is 14.
 */
import type { AbilityDefinition, AbilityId, AbilitySlot, RigDefinition, RigId } from './contract';

const ability = (definition: AbilityDefinition): AbilityDefinition => Object.freeze(definition);
const seconds = (ms: number) => `${(ms / 1000).toFixed(ms % 1000 ? 1 : 0)} s`;

export const RIG_BURN_DAMAGE = 2;
export const DASH_CHARGES = 2;
export const DASH_RECHARGE_MS = 2_600;
export const DASH_DISTANCE = 150;
export const DASH_DURATION_MS = 140;
export const DASH_INVULNERABLE_MS = 220;
export const PYRO_DASH_INVULNERABLE_MS = 400;
export const PYRO_DASH_DISTANCE = 240;
export const PYRO_DASH_RECHARGE_MS = 2_500;

const dash = (
  id: AbilityId,
  rig: RigId,
  element: AbilityDefinition['element'],
  name: string,
  summary: string,
  description: string,
  durationMs: number,
  extra: AbilityDefinition['stats'],
): AbilityDefinition =>
  ability({
    id, rig, slot: 'dash', element, name, summary, description,
    targeting: 'direction',
    shape: { kind: 'dash', distance: rig==='pyro'?PYRO_DASH_DISTANCE:DASH_DISTANCE, width: 44 },
    castMs: 0,
    cooldownMs: rig==='pyro'?PYRO_DASH_RECHARGE_MS:DASH_RECHARGE_MS,
    charges: DASH_CHARGES,
    durationMs,
    range: 0,
    stats: [{ label: 'Charges', value: String(DASH_CHARGES) }, { label: 'Recharge', value: seconds(rig==='pyro'?PYRO_DASH_RECHARGE_MS:DASH_RECHARGE_MS) }, ...extra],
  });

export const ABILITY_CATALOG: Readonly<Record<AbilityId, AbilityDefinition>> = Object.freeze({
  // ── BREACHER ────────────────────────────────────────────────────────────────
  ram: dash('ram', 'breacher', 'kinetic', 'Ram',
    'Dash through enemies, shoving them aside.',
    'Dash in your movement direction. You cannot be hit while dashing. Enemies you pass through take 18 damage and are shoved sideways and staggered.',
    0, [{ label: 'Damage', value: '18' }]),
  'seismic-slam': ability({
    id: 'seismic-slam', rig: 'breacher', slot: 'tactical', element: 'kinetic', name: 'Seismic Slam',
    summary: 'Shockwave that launches everything around you.',
    description: 'Drive the rig into the deck. After a short wind-up a shockwave deals 90 damage and launches enemies outward. Launched enemies can slam into walls and trigger Breacher boons.',
    targeting: 'self', shape: { kind: 'circle', radius: 230 },
    castMs: 220, cooldownMs: 6_000, charges: 1, durationMs: 0, range: 0,
    stats: [{ label: 'Damage', value: '90' }, { label: 'Radius', value: '230' }, { label: 'Cooldown', value: seconds(6_000) }],
  }),
  bulwark: ability({
    id: 'bulwark', rig: 'breacher', slot: 'power', element: 'kinetic', name: 'Bulwark',
    summary: 'Deploy an energy barricade that stops enemies and spit.',
    description: 'Project a wide barricade in front of you for 6 seconds. It blocks enemy movement and enemy projectiles. Your own shots pass through it.',
    targeting: 'direction', shape: { kind: 'wall', length: 220, thickness: 18 },
    castMs: 0, cooldownMs: 20_000, charges: 1, durationMs: 6_000, range: 70,
    stats: [{ label: 'Duration', value: seconds(6_000) }, { label: 'Width', value: '220' }, { label: 'Cooldown', value: seconds(20_000) }],
  }),
  railbreaker: ability({
    id: 'railbreaker', rig: 'breacher', slot: 'overdrive', element: 'kinetic', name: 'Railbreaker',
    summary: 'Charge and fire a lance that pierces the whole room.',
    description: 'Brace for a moment, then fire a lance along your aim. Everything on the line takes 420 damage and is hurled sideways into the nearest wall. One activation per ordinary story room; charge carries between rooms.',
    targeting: 'direction', shape: { kind: 'line', length: 900, width: 44 },
    castMs: 250, cooldownMs: 0, charges: 1, durationMs: 0, range: 0,
    stats: [{ label: 'Damage', value: '420' }, { label: 'Pierce', value: 'All' }],
  }),

  // ── CRYO ────────────────────────────────────────────────────────────────────
  'frost-trail': dash('frost-trail', 'cryo', 'cryo', 'Frost Trail',
    'Dash and leave a strip of chilling frost.',
    'Dash in your movement direction. You cannot be hit while dashing. The path freezes over for 2.5 seconds and chills enemies that cross it.',
    2_500, [{ label: 'Frost', value: seconds(2_500) }]),
  'cryo-nova': ability({
    id: 'cryo-nova', rig: 'cryo', slot: 'tactical', element: 'cryo', name: 'Cryo Nova',
    summary: 'Ring of cold. Chills hard; freezes the already chilled.',
    description: 'Vent coolant in a ring around you: 30 damage and heavy chill. Enemies that were already chilled are frozen solid for 1.5 seconds.',
    targeting: 'self', shape: { kind: 'circle', radius: 210 },
    castMs: 0, cooldownMs: 13_000, charges: 1, durationMs: 0, range: 0,
    stats: [{ label: 'Damage', value: '30' }, { label: 'Freeze', value: seconds(1_500) }, { label: 'Cooldown', value: seconds(13_000) }],
  }),
  glacier: ability({
    id: 'glacier', rig: 'cryo', slot: 'power', element: 'cryo', name: 'Glacier',
    summary: 'Raise an ice wall at the cursor. It shatters when it ends.',
    description: 'Raise a wall of ice at the cursor for 5 seconds. It blocks enemies and enemy projectiles. When it expires or is broken it shatters for 80 damage and chills everything nearby.',
    targeting: 'point', shape: { kind: 'wall', length: 200, thickness: 26 },
    castMs: 150, cooldownMs: 18_000, charges: 1, durationMs: 5_000, range: 420,
    stats: [{ label: 'Duration', value: seconds(5_000) }, { label: 'Shatter', value: '80' }, { label: 'Cooldown', value: seconds(18_000) }],
  }),
  whiteout: ability({
    id: 'whiteout', rig: 'cryo', slot: 'overdrive', element: 'cryo', name: 'Whiteout',
    summary: 'A blizzard follows you. Frozen enemies shatter.',
    description: 'For 8 seconds a blizzard rages around you: constant chill and damage, a freeze pulse every 2 seconds, and enemies killed while frozen shatter for area damage. One activation per ordinary story room; charge carries between rooms.',
    targeting: 'self', shape: { kind: 'circle', radius: 300 },
    castMs: 0, cooldownMs: 0, charges: 1, durationMs: 8_000, range: 0,
    stats: [{ label: 'Duration', value: seconds(8_000) }, { label: 'Radius', value: '300' }],
  }),

  // ── PYRO ────────────────────────────────────────────────────────────────────
  afterburn: dash('afterburn', 'pyro', 'pyro', 'Afterburn',
    'Dash and leave a line of fire.',
    'Dash 240 units in your movement direction with 0.4 seconds of invulnerability. Your exhaust leaves a line of fire for 2.5 seconds that ignites enemies. Native rig burn deals 2 damage every 0.25 seconds for 1.5 seconds; refreshing preserves its tick cadence.',
    2_500, [{ label: 'Fire', value: seconds(2_500) }]),
  flashfire: ability({
    id: 'flashfire', rig: 'pyro', slot: 'tactical', element: 'pyro', name: 'Flashfire',
    summary: 'A wide cone of flame.',
    description: 'Dump the tank in a wide cone along your aim: 25 damage and every enemy hit is ignited. Native rig burn deals 2 damage every 0.25 seconds for 1.5 seconds; refreshing preserves its tick cadence.',
    targeting: 'direction', shape: { kind: 'cone', range: 300, arcRadians: 1.22 },
    castMs: 0, cooldownMs: 5_000, charges: 1, durationMs: 0, range: 0,
    stats: [{ label: 'Damage', value: '25' }, { label: 'Range', value: '300' }, { label: 'Cooldown', value: seconds(5_000) }],
  }),
  'napalm-charge': ability({
    id: 'napalm-charge', rig: 'pyro', slot: 'power', element: 'pyro', name: 'Napalm Charge',
    summary: 'Lob a canister. The pool keeps burning.',
    description: 'Lob a canister to the cursor. It bursts into a burning pool for 6 seconds, dealing 6.5 damage every 0.25 seconds and igniting everything standing in it. Native rig burn deals 2 damage every 0.25 seconds for 1.5 seconds; refreshing preserves its tick cadence.',
    targeting: 'point', shape: { kind: 'circle', radius: 120 },
    castMs: 150, cooldownMs: 12_000, charges: 1, durationMs: 6_000, range: 480,
    stats: [{ label: 'Duration', value: seconds(6_000) }, { label: 'Radius', value: '120' }, { label: 'Cooldown', value: seconds(12_000) }],
  }),
  meltdown: ability({
    id: 'meltdown', rig: 'pyro', slot: 'overdrive', element: 'pyro', name: 'Meltdown',
    summary: 'Become the fire.',
    description: 'For 8 seconds you burn everything near you, every shot ignites, kills burst for 20 damage within 85 units, and you move 40% faster. Native rig burn deals 2 damage every 0.25 seconds for 1.5 seconds; refreshing preserves its tick cadence. One activation per ordinary story room; charge carries between rooms.',
    targeting: 'self', shape: { kind: 'circle', radius: 130 },
    castMs: 0, cooldownMs: 0, charges: 1, durationMs: 8_000, range: 0,
    stats: [{ label: 'Duration', value: seconds(8_000) }, { label: 'Speed', value: '+40%' }],
  }),

  // ── ARC ─────────────────────────────────────────────────────────────────────
  'static-step': dash('static-step', 'arc', 'arc', 'Static Step',
    'Dash and shock the nearest enemies on arrival.',
    'Dash in your movement direction. You cannot be hit while dashing. On arrival, discharge into the three nearest enemies for 22 damage each.',
    0, [{ label: 'Shock', value: '22 × 3' }]),
  overload: ability({
    id: 'overload', rig: 'arc', slot: 'tactical', element: 'arc', name: 'Overload',
    summary: 'Chain lightning that stuns.',
    description: 'Lightning jumps from the enemy nearest your aim through up to six targets: 60 damage, falling 15% per jump. Shocked enemies are stunned briefly.',
    targeting: 'direction', shape: { kind: 'chain', range: 520, hopRange: 200, maxTargets: 6 },
    castMs: 0, cooldownMs: 7_000, charges: 1, durationMs: 0, range: 0,
    stats: [{ label: 'Damage', value: '60' }, { label: 'Targets', value: '6' }, { label: 'Cooldown', value: seconds(7_000) }],
  }),
  'tesla-pylon': ability({
    id: 'tesla-pylon', rig: 'arc', slot: 'power', element: 'arc', name: 'Tesla Pylon',
    summary: 'Deploy a pylon that zaps and links to you.',
    description: 'Deploy a pylon at the cursor for 9 seconds. It arcs to nearby enemies, and while you stay close a live link runs between you and the pylon that damages enemies crossing it.',
    targeting: 'point', shape: { kind: 'circle', radius: 220 },
    castMs: 100, cooldownMs: 18_000, charges: 1, durationMs: 9_000, range: 440,
    stats: [{ label: 'Duration', value: seconds(9_000) }, { label: 'Zap', value: '26' }, { label: 'Cooldown', value: seconds(18_000) }],
  }),
  overclock: ability({
    id: 'overclock', rig: 'arc', slot: 'overdrive', element: 'arc', name: 'Overclock',
    summary: 'Time slows for everything except you.',
    description: 'For 6 seconds enemies and their projectiles move in slow motion while you do not. You fire faster, reload instantly and spend no ammunition. One activation per ordinary story room; charge carries between rooms.',
    targeting: 'self', shape: { kind: 'circle', radius: 0 },
    castMs: 0, cooldownMs: 0, charges: 1, durationMs: 6_000, range: 0,
    stats: [{ label: 'Duration', value: seconds(6_000) }, { label: 'Enemy speed', value: '30%' }],
  }),
});

const rig = (definition: RigDefinition): RigDefinition => Object.freeze(definition);

export const RIG_CATALOG: Readonly<Record<RigId, RigDefinition>> = Object.freeze({
  breacher: rig({
    id: 'breacher', element: 'kinetic', name: 'Breacher', tagline: 'Walls are weapons',
    description: 'Close-range demolition. Shove, launch and pin the swarm against the ship itself.',
    boonPath: 'Kinetic demolition',
    abilities: { dash: 'ram', tactical: 'seismic-slam', power: 'bulwark', overdrive: 'railbreaker' },
  }),
  cryo: rig({
    id: 'cryo', element: 'cryo', name: 'Cryo', tagline: 'Control, then execute',
    description: 'Slow the room to a crawl, freeze what matters, and shatter it.',
    boonPath: 'Cryo executioner',
    abilities: { dash: 'frost-trail', tactical: 'cryo-nova', power: 'glacier', overdrive: 'whiteout' },
  }),
  pyro: rig({
    id: 'pyro', element: 'pyro', name: 'Pyro', tagline: 'Own the ground',
    description: 'Paint the deck in fire and keep moving. What chases you burns.',
    boonPath: 'Wildfire',
    abilities: { dash: 'afterburn', tactical: 'flashfire', power: 'napalm-charge', overdrive: 'meltdown' },
  }),
  arc: rig({
    id: 'arc', element: 'arc', name: 'Arc', tagline: 'Tempo and chains',
    description: 'Lightning that jumps, gadgets that hold a lane, and a clock that runs for you alone.',
    boonPath: 'Reactor cycling',
    abilities: { dash: 'static-step', tactical: 'overload', power: 'tesla-pylon', overdrive: 'overclock' },
  }),
});

export const RIG_IDS = Object.freeze(Object.keys(RIG_CATALOG) as RigId[]);
export const ABILITY_SLOTS = Object.freeze(['dash', 'tactical', 'power', 'overdrive'] as const satisfies readonly AbilitySlot[]);
/** Default desktop key label per slot, for HUD keycaps. */
export const ABILITY_KEYS: Readonly<Record<AbilitySlot, string>> = Object.freeze({ dash: 'SHIFT', tactical: 'Q', power: 'F', overdrive: 'V' });
