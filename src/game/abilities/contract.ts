/**
 * Combat Rig contract — shared by the simulation (src/game/abilities), the renderer/audio
 * (ability VFX/SFX) and the UI (action bar, rig selection).
 *
 * Types only. No runtime code, no imports from Three.js or the DOM.
 * Design source: docs/nextgen/00-VISION.md §4. Owner: the lead; the ability-system stream may ADD
 * optional fields and new event phases, but must not rename or remove anything other streams build on.
 */

export type RigId = 'breacher' | 'cryo' | 'pyro' | 'arc';

/** Bound to Shift / Q / F / V on desktop. */
export type AbilitySlot = 'dash' | 'tactical' | 'power' | 'overdrive';

export type AbilityId =
  | 'ram' | 'seismic-slam' | 'bulwark' | 'railbreaker'
  | 'frost-trail' | 'cryo-nova' | 'glacier' | 'whiteout'
  | 'afterburn' | 'flashfire' | 'napalm-charge' | 'meltdown'
  | 'static-step' | 'overload' | 'tesla-pylon' | 'overclock';

/** Drives color/VFX/SFX language. See the color meaning table in 00-VISION.md §3. */
export type AbilityElement = 'kinetic' | 'cryo' | 'pyro' | 'arc';

/** How the ability is aimed. `self`: around the marine. `direction`: along the aim angle. `point`: at the cursor, range-clamped. */
export type AbilityTargeting = 'self' | 'direction' | 'point';

/** Shape of the gameplay effect, used for telegraphs and for matching VFX to real hit areas. All lengths in world units. */
export type AbilityShape =
  | Readonly<{ kind: 'circle'; radius: number }>
  | Readonly<{ kind: 'cone'; range: number; arcRadians: number }>
  | Readonly<{ kind: 'line'; length: number; width: number }>
  | Readonly<{ kind: 'wall'; length: number; thickness: number }>
  | Readonly<{ kind: 'chain'; range: number; hopRange: number; maxTargets: number }>
  | Readonly<{ kind: 'dash'; distance: number; width: number }>;

export type AbilityDefinition = Readonly<{
  id: AbilityId;
  rig: RigId;
  slot: AbilitySlot;
  element: AbilityElement;
  name: string;
  /** One short imperative sentence for the HUD tooltip / rig card. */
  summary: string;
  /** Full rules text for the loadout screen. */
  description: string;
  targeting: AbilityTargeting;
  shape: AbilityShape;
  /** Anticipation before the effect resolves. 0 = instant. */
  castMs: number;
  /** Cooldown per charge. Overdrive abilities use 0 and are gated by the Overdrive meter instead. */
  cooldownMs: number;
  /** Dash-only immunity override; absent retains the universal default. */
  invulnerableMs?: number;
  /** Stored uses. 1 for most abilities, 2 for the dash. */
  charges: number;
  /** Lifetime of the lingering effect (zone, deployable, self-buff). 0 = none. */
  durationMs: number;
  /** Maximum placement distance for `point` targeting. 0 otherwise. */
  range: number;
  /** Headline numbers for UI stat lines; the simulation is the source of truth for actual values. */
  stats: readonly Readonly<{ label: string; value: string }>[];
}>;

export type RigDefinition = Readonly<{
  id: RigId;
  element: AbilityElement;
  name: string;
  /** Two or three words: the fantasy. */
  tagline: string;
  description: string;
  /** Name of the existing boon path this rig multiplies (see boonPaths.ts). */
  boonPath: string;
  abilities: Readonly<Record<AbilitySlot, AbilityId>>;
}>;

/** Why a press did nothing. UI/audio use this for "denied" feedback. */
export type AbilityDenial = 'cooldown' | 'casting' | 'no-charge' | 'blocked' | 'no-rig';

export type AbilitySlotSnapshot = Readonly<{
  slot: AbilitySlot;
  id: AbilityId;
  /** True when a press right now would start the ability. */
  ready: boolean;
  charges: number;
  maxCharges: number;
  /** Time until the next charge is restored. 0 when all charges are stored. */
  cooldownRemainingMs: number;
  cooldownMs: number;
  /** > 0 while winding up. */
  castRemainingMs: number;
  /** > 0 while the lingering effect of this slot is alive (zone/deployable/buff). */
  activeRemainingMs: number;
  activeMs: number;
}>;

export type OverdriveSnapshot = Readonly<{
  /** 0..1 */
  charge: number;
  ready: boolean;
  active: boolean;
  activeRemainingMs: number;
  /** The room's accepted-use allowance is exhausted; earned charge carries forward. */
  roomLimited?: boolean;
}>;

/** A world object created by an ability that persists and can be drawn: barricade, ice wall, pylon. */
export type DeployableSnapshot = Readonly<{
  id: number;
  ability: AbilityId;
  element: AbilityElement;
  kind: 'barrier' | 'ice-wall' | 'pylon';
  x: number;
  y: number;
  /** Facing; for walls the wall runs perpendicular to this angle. */
  angle: number;
  length: number;
  thickness: number;
  radius: number;
  remainingMs: number;
  durationMs: number;
  health: number;
  maxHealth: number;
}>;

/** A lingering area effect that can be drawn: frost strip, fire line, napalm pool, blizzard, burning aura. */
export type AbilityZoneSnapshot = Readonly<{
  id: number;
  ability: AbilityId;
  element: AbilityElement;
  shape: 'circle' | 'strip';
  x: number;
  y: number;
  radius: number;
  /** For strips: end point and width. */
  x2: number;
  y2: number;
  width: number;
  /** True when the zone follows the marine (Whiteout, Meltdown aura). */
  attached: boolean;
  remainingMs: number;
  durationMs: number;
}>;

/** Current continuous pylon-to-marine damage link; endpoints are authoritative world coordinates. */
export type AbilityLinkSnapshot = Readonly<{
  id: number;
  ability: 'tesla-pylon';
  element: 'arc';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  width: number;
}>;

export type AbilitiesSnapshot = Readonly<{
  rig: RigId | null;
  slots: Readonly<Record<AbilitySlot, AbilitySlotSnapshot>> | null;
  overdrive: OverdriveSnapshot;
  /** True during dash i-frames or other ability-granted immunity. */
  invulnerable: boolean;
  /** True while the marine is being moved by a dash. */
  dashing: boolean;
  /** 1 normally; < 1 while Overclock slows hostile time. Applies to enemies and enemy projectiles only. */
  hostileTimeScale: number;
  deployables: readonly DeployableSnapshot[];
  zones: readonly AbilityZoneSnapshot[];
  /** Present in the Combat Rig runtime; additive for existing presentation consumers. */
  links?: readonly AbilityLinkSnapshot[];
}>;

/**
 * Presentation event emitted by the simulation through `GameEffect` as `{type:'ability', ability: AbilityEvent, x, y}`.
 * Renderer, audio and UI subscribe. Positions are world units; angles radians.
 */
export type AbilityEventPhase =
  /** Wind-up started (telegraph should appear and last `durationMs`). */
  | 'cast'
  /** The effect resolved (the big moment). */
  | 'impact'
  /** A periodic pulse of a lingering effect. */
  | 'tick'
  /** A lingering effect or buff ended naturally. */
  | 'end'
  /** A deployable was destroyed/shattered early or on expiry with a payoff. */
  | 'burst'
  /** One lightning/beam segment from (x,y) to (targetX,targetY). */
  | 'link'
  /** The marine started / finished a dash. `x,y` start, `targetX,targetY` end. */
  | 'dash-start'
  | 'dash-end'
  /** A press was rejected. */
  | 'denied'
  /** A slot came off cooldown / gained a charge. */
  | 'ready'
  /** The Overdrive meter just filled. */
  | 'overdrive-ready';

export type AbilityEvent = Readonly<{
  /** Authoritative chain hop distance and target cap, including augments. */
  /** Applied ability damage aggregated for this bounded targetIds receipt. */
  totalDamage?: number;
  hopRange?: number;
  maxTargets?: number;
  phase: AbilityEventPhase;
  ability: AbilityId;
  slot: AbilitySlot;
  rig: RigId;
  element: AbilityElement;
  angle?: number;
  targetX?: number;
  targetY?: number;
  radius?: number;
  length?: number;
  width?: number;
  arcRadians?: number;
  durationMs?: number;
  /** Deployable or zone id this event refers to, when any. */
  entityId?: number;
  /** Enemy ids affected by this event (bounded), for per-target feedback. */
  targetIds?: readonly number[];
  denial?: AbilityDenial;
}>;
