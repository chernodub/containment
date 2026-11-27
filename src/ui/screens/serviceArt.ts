import type {ServiceId} from '../../game/roguelike/economy';
import '../styles/requisition.css';

type Drawing = {
  accent: string;
  shell: string;
  panels: string;
  marks: string;
};

const drawings: Record<Exclude<ServiceId, 'route-ammo' | 'rig-return'>, Drawing> = {
  heal: {
    accent: '#a4d9a8',
    shell: 'M24 13L31 7H52L60 14V47L52 55H31L24 49Z M18 22H24V43H18Z M60 22H66V43H60Z',
    panels: 'M24 18H60V24H24Z M25 44H59V49L52 54H31L25 49Z M32 8H52V15H32Z',
    marks: 'M32 29H52V40H32Z M38 7V4H46V7Z',
  },
  medkit: {
    accent: '#a4d9a8',
    shell: 'M27 20V10H54V20H48V15H33V20Z M9 24L17 18H65L75 25V48L68 54H16L9 47Z',
    panels: 'M9 31H75V47L68 54H16L9 47Z M17 18H65L73 25H11Z M17 43H26V54H17Z M59 43H68V54H59Z',
    marks: 'M34 25H50V37H34Z M18 29H24V37H18Z M60 29H66V37H60Z',
  },
  armor: {
    accent: '#a3c9dd',
    shell: 'M12 28L22 17L43 22L64 15L73 25L65 48L43 57L21 49Z M9 20L20 10L42 15L63 8L74 18L66 41L42 51L18 43Z',
    panels: 'M14 22L42 30L70 21L66 33L42 42L19 35Z M22 43L42 51L64 43L61 49L43 55L25 49Z',
    marks: 'M24 15L42 19L60 14L55 22L42 26L29 22Z',
  },
  ammo: {
    accent: '#e2bb79',
    shell: 'M13 15L20 5L27 15V48H13Z M35 13L42 3L49 13V48H35Z M57 15L64 5L71 15V48H57Z M9 36H75V53L70 58H14L9 53Z',
    panels: 'M9 42H75V53L70 58H14L9 53Z M13 29H27V36H13Z M35 29H49V36H35Z M57 29H71V36H57Z',
    marks: 'M14 15L20 6L26 15V23H14Z M36 13L42 4L48 13V23H36Z M58 15L64 6L70 15V23H58Z M34 47H50V52H34Z',
  },
  grenade: {
    accent: '#dfae88',
    shell: 'M32 17V10H54L62 16V31H56V21H48V25L60 35V47L51 57H32L22 47V35Z M55 13A7 7 0 1 1 69 13A7 7 0 1 1 55 13Z',
    panels: 'M28 30H54L60 35H22Z M22 42H60V47L51 57H32L22 47Z M34 10H52V17H34Z',
    marks: 'M29 36H53V42H29Z',
  },
  reroll: {
    accent: '#c5addc',
    shell: 'M41 14L56 6L74 15V34L57 44L41 35Z M10 29L28 20L47 30V48L28 58L10 49Z',
    panels: 'M41 14L56 6L74 15L57 24Z M57 24L74 15V34L57 44Z M10 29L28 20L47 30L28 40Z M28 40L47 30V48L28 58Z',
    marks: 'M55 13L59 15L55 17L51 15Z M66 27L69 25V29L66 31Z M19 29L23 27L27 29L23 31Z M30 32L34 30L38 32L34 34Z M16 37L20 39V43L16 41Z M35 44L39 42V46L35 48Z',
  },
  upgrade: {
    accent: '#c5addc',
    shell: 'M19 13L58 6L70 15L65 46L25 55L14 46Z M16 22L8 24V29L15 28Z M14 34L7 36V41L13 40Z M64 25L77 22V28L63 31Z M62 37L75 34V40L61 43Z',
    panels: 'M19 13L58 6L70 15L29 25Z M29 25L70 15L65 46L25 55Z M32 29L61 22L58 40L29 47Z',
    marks: 'M37 35L47 26L57 31L51 33L50 39L42 41L43 35Z',
  },
  revive: {
    accent: '#a4d9a8',
    shell: 'M12 25L24 13H60L72 25L77 43L68 53H16L7 43Z M20 49V58H30V52Z M54 52V58H64V49Z',
    panels: 'M24 13H60L67 24H17Z M7 43H77L68 53H16Z M13 32H25V43H10Z M59 32H71L74 43H59Z',
    marks: 'M28 18H56L61 29H23Z M34 34H50V42H34Z',
  },
};

export function serviceArt(service: ServiceId): string {
  const id = service === 'route-ammo' ? 'ammo' : service === 'rig-return' ? 'upgrade' : service;
  const {accent, shell, panels, marks} = drawings[id];
  return `<svg class="service-illustration" viewBox="0 0 84 64" aria-hidden="true">
    <g stroke="#0b141b" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <path fill="#617d87" fill-rule="evenodd" d="${shell}"/>
      <path fill="#3a515c" d="${panels}"/>
      <path fill="${accent}" d="${marks}"/>
    </g>
  </svg>`;
}
