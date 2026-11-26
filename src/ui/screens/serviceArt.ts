import type {ServiceId} from '../../game/roguelike/economy';
import '../styles/requisition.css';

const drawings = {
  heal: ['#a4d9a8','M14 18H50V47H14Z','M28 23H36V29H42V37H36V43H28V37H22V29H28Z'],
  medkit: ['#a4d9a8','M12 23H22V15H42V23H52V49H12ZM27 23H37V20H27Z','M29 27H35V33H41V39H35V45H29V39H23V33H29Z'],
  armor: ['#a3c9dd','M17 15L26 12L32 17L38 12L47 15L52 29L45 48H19L12 29Z','M18 27L32 33L46 27L42 42H22Z'],
  ammo: ['#e2bb79','M13 26L19 14L25 26V49H13ZM26 22L32 10L38 22V49H26ZM39 26L45 14L51 26V49H39Z','M13 42H25V49H13ZM26 42H38V49H26ZM39 42H51V49H39Z'],
  grenade: ['#dfae88','M27 21V13H39L46 20V30H41V23H36L45 34L42 49L32 54L21 49L18 34Z','M22 34H41L40 41H23Z'],
  reroll: ['#c5addc','M49 19V31H36L41 26A12 12 0 0 0 20 26L13 22A20 20 0 0 1 46 21ZM15 45V33H28L23 38A12 12 0 0 0 44 38L51 42A20 20 0 0 1 18 43Z',''],
  upgrade: ['#c5addc','M18 18H46V46H18ZM12 23H18V41H12ZM46 23H52V41H46Z','M24 34L32 24L40 34H35V41H29V34Z'],
  revive: ['#a4d9a8','M18 14H46V49H18Z','M22 33H27L30 24L35 41L38 32H43V36H40L34 46L29 34L28 37H22Z'],
} as const;

export function serviceArt(service: ServiceId): string {
  const id = service === 'route-ammo' ? 'ammo' : service === 'rig-return' ? 'upgrade' : service;
  const [color, body, mark] = drawings[id];
  return `<svg class="service-illustration" viewBox="0 0 64 64" aria-hidden="true"><path fill="${color}" stroke="#101820" stroke-width="3" stroke-linejoin="round" fill-rule="evenodd" d="${body}"/>${mark?`<path fill="#273944" d="${mark}"/>`:''}</svg>`;
}
