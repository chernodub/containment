import {ABILITY_CATALOG, ABILITY_SLOTS, RIG_CATALOG} from '../game/abilities/catalog';
import type {AbilitiesSnapshot, AbilitySlot, AbilitySlotSnapshot, RigId} from '../game/abilities/contract';

export type AbilityFixtureState = 'ready' | 'cooling' | 'casting' | 'active' | 'denied' | 'overdrive';
/** Explicit visual fixture. This is never installed by normal gameplay. */
export function abilityFixture(rig: RigId, state: AbilityFixtureState): AbilitiesSnapshot {
  const slots = {} as Record<AbilitySlot, AbilitySlotSnapshot>;
  for (const slot of ABILITY_SLOTS) {
    const definition = ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]];
    const cooling = (state === 'cooling' || state === 'denied') && slot !== 'overdrive';
    slots[slot] = {
      slot, id: definition.id, ready: !cooling && state !== 'casting',
      charges: cooling ? (slot === 'dash' ? 1 : 0) : definition.charges,
      maxCharges: definition.charges,
      cooldownRemainingMs: cooling ? definition.cooldownMs * .58 : 0,
      cooldownMs: definition.cooldownMs,
      castRemainingMs: state === 'casting' && slot === 'tactical' ? Math.max(120, definition.castMs) : 0,
      activeRemainingMs: state === 'active' ? definition.durationMs * .6 : 0,
      activeMs: definition.durationMs,
    };
  }
  return {
    rig, slots,
    overdrive: {charge: state === 'overdrive' ? 1 : .63, ready: state === 'overdrive', active: state === 'active', activeRemainingMs: state === 'active' ? 3200 : 0},
    invulnerable: false, dashing: false, hostileTimeScale: 1, deployables: [], zones: [],
  };
}
