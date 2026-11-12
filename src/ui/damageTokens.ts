import type {DamageSource} from '../game/abilities/RunStats';
import type {AbilityElement} from '../game/abilities/contract';
import type {BoonEffect} from '../game/roguelike/ElementalRuntime';

/** Combat hue is the damage's element, never its accounting category. */
export const DAMAGE_TOKENS = Object.freeze({
  neutral: {variable: '--damage-neutral', color: '#f0fbff'},
  kinetic: {variable: '--kinetic', color: '#ffb454'},
  cryo: {variable: '--cryo', color: '#7fd6ff'},
  pyro: {variable: '--pyro', color: '#ff7a2e'},
  arc: {variable: '--arc', color: '#b79cff'},
  acid: {variable: '--acid', color: '#9dff5a'},
  healing: {variable: '--healing', color: '#8ce6c3'},
  reward: {variable: '--gold', color: '#ffd27a'},
});
export type DamageToken = keyof typeof DAMAGE_TOKENS;

/** Includes every native status/boon visual plus optional element aliases. */
export const DAMAGE_ELEMENT_TOKENS: Readonly<Record<string, DamageToken>> = Object.freeze({
  weapon: 'neutral', ability: 'neutral', status: 'neutral', boon: 'neutral',
  kinetic: 'kinetic', impact: 'kinetic', blast: 'kinetic', charge: 'kinetic', 'wall-slam': 'kinetic',
  cryo: 'cryo', ice: 'cryo', frost: 'cryo', chill: 'cryo', chilled: 'cryo', freeze: 'cryo', frozen: 'cryo', shatter: 'cryo', field: 'cryo',
  pyro: 'pyro', fire: 'pyro', burn: 'pyro', burning: 'pyro', combustion: 'pyro',
  arc: 'arc', shock: 'arc', shocked: 'arc', overload: 'arc',
  acid: 'acid', poison: 'acid', poisoned: 'acid',
  heal: 'healing', healing: 'healing', leech: 'healing', shield: 'healing', recovery: 'healing',
} satisfies Record<DamageSource | AbilityElement | BoonEffect, DamageToken> & Record<string, DamageToken>);

/** Unknown and mixed damage remains neutral instead of claiming an element. */
export function damageToken(element: unknown): DamageToken {
  return typeof element === 'string' ? DAMAGE_ELEMENT_TOKENS[element] ?? 'neutral' : 'neutral';
}
