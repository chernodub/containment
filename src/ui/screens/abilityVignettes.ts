import type {AbilityDefinition, AbilityId} from '../../game/abilities/contract';
import {escapeHtml} from './initialTemplates';

const marine = (x = 38, y = 42) => `<g class="vignette-marine" transform="translate(${x} ${y})"><circle r="5"/><path d="M0-8V8M-5-3H5M4 0h9"/></g>`;
const enemies = (...points: [number, number][]) => points.map(([x,y]) => `<circle class="vignette-enemy" cx="${x}" cy="${y}" r="4"/>`).join('');
const frozen = (x: number, y: number) => `<path class="vignette-freeze" d="M${x-7} ${y}h14m-7-7v14m-5-12 10 10m0-10-10 10"/>`;
const flame = (x: number, y: number) => `<path class="shape-fill" d="M${x} ${y+7}q-7-3-3-10l2 3 3-7q8 12-2 14Z"/>`;
const arrow = (x: number, y: number, angle = 0) => `<path transform="translate(${x} ${y}) rotate(${angle})" d="M-12 0H9M3-6l6 6-6 6"/>`;

const scenes: Readonly<Record<AbilityId, {label: string; drawing: string}>> = {
  ram: {label: 'Dash through the swarm; shove enemies sideways', drawing: `${marine(122)}${enemies([85,24],[92,60])}<path d="M35 42h70" stroke-width="4"/>${arrow(118,42)}${arrow(86,19,-90)}${arrow(93,65,90)}<path class="vignette-ghost" d="M35 35v14m-5-7h10"/>`},
  'seismic-slam': {label: 'Launch nearby enemies outward into walls', drawing: `${marine(99)}<circle cx="99" cy="42" r="24" class="shape-fill"/>${enemies([70,25],[129,27],[97,64])}${arrow(64,20,210)}${arrow(138,20,-30)}${arrow(97,70,90)}<path class="vignette-wall" d="M151 15v55"/>`},
  bulwark: {label: 'Block the swarm and hostile shots; fire through the barricade', drawing: `${marine(43)}${enemies([135,22],[143,57])}<path class="vignette-wall" d="M91 14v55"/><path d="M55 42h73m-9-5 9 5-9 5"/><path class="vignette-hostile" d="M130 22H98m0-4v8M137 58H98m0-4v8"/>`},
  railbreaker: {label: 'Pierce the line; hurl targets sideways into walls', drawing: `${marine(34)}${enemies([90,41],[125,42],[158,43])}<path d="M47 42H177" stroke-width="5"/>${arrow(182,42)}${arrow(91,23,-90)}${arrow(128,64,90)}<path class="vignette-wall" d="M72 10h82M112 74h62"/>`},
  'frost-trail': {label: 'Dash away; leave a frost lane that chills pursuers', drawing: `<path class="shape-fill" d="M37 32H135V52H37Z"/><path d="M43 42h83" stroke-dasharray="3 5"/>${marine(139)}${enemies([64,35],[96,52])}${frozen(64,35)}${arrow(156,42)}${frozen(46,42)}`},
  'cryo-nova': {label: 'Instant cold pulse; freeze enemies already chilled', drawing: `${marine(99)}<circle cx="99" cy="42" r="27"/><path d="M66 42h-9m84 0h-9M99 8v9m0 50v9"/>${enemies([76,24],[123,52],[85,63])}${frozen(76,24)}${frozen(123,52)}${frozen(85,63)}`},
  glacier: {label: 'Place an ice wall; its fragments chill enemies when it breaks', drawing: `${marine(38,55)}${enemies([112,23],[145,28])}<path class="shape-fill" d="m88 42 9-12 9 8 8-11 11 12 11-9 10 12v9H88Z"/><path class="vignette-ghost" d="M48 52 108 46"/><path d="m84 28-8-8m36-1 2-9m37 28 12-5m-11 21 10 9"/>`},
  whiteout: {label: 'A moving blizzard; repeated freezes and shattering kills', drawing: `<ellipse cx="103" cy="42" rx="54" ry="29" class="shape-fill"/><path d="M61 34q37-34 80 2m-1-15 1 15-15-3M145 54q-39 26-82-3m0 14V51l14 3"/>${marine(101)}${enemies([74,32],[127,53])}${frozen(74,32)}<path d="m127 46-3-7m9 8 7-5m-8 12 8 5m-15-3-4 8"/>${arrow(108,69)}`},
  afterburn: {label: 'Dash forward; ignite enemies in the burning exhaust lane', drawing: `<path class="shape-fill" d="M36 33h96v19H36Z"/>${flame(48,42)}${flame(72,42)}${flame(98,42)}${marine(141)}${enemies([62,27],[100,59])}${flame(62,24)}${arrow(159,42)}`},
  flashfire: {label: 'Ignite a wide cone in front of you', drawing: `${marine(38)}<path class="shape-fill" d="M48 42 133 12Q153 42 133 72Z"/>${enemies([91,30],[112,52],[130,39])}${flame(91,25)}${flame(112,46)}${flame(130,34)}`},
  'napalm-charge': {label: 'Lob a canister; deny ground with a lasting fire pool', drawing: `${marine(35,54)}<path d="M48 47Q79-11 118 33" stroke-dasharray="3 4"/><path d="m110 31 9 2 1-9"/><ellipse cx="134" cy="49" rx="34" ry="20" class="shape-fill"/>${enemies([119,47],[149,55])}${flame(132,44)}${flame(149,49)}`},
  meltdown: {label: 'Carry a fire aura; ignite shots and burst enemies on kills', drawing: `<circle cx="93" cy="42" r="26" class="shape-fill"/>${marine(93)}${flame(75,23)}${flame(75,59)}${flame(108,63)}${enemies([115,30],[158,42])}<path d="M107 42h43"/>${flame(158,35)}<path d="m118 17 1-8m6 14 8-5m-4 13 9 1"/>${arrow(98,72)}`},
  'static-step': {label: 'Dash, then discharge into nearby enemies on arrival', drawing: `<path d="M29 42h81" stroke-dasharray="4 4"/>${marine(115)}${enemies([141,20],[151,43],[138,64])}<path d="m121 37 7-9 3 4 8-10m-16 20 10-4-1 7 14-2m-25 5 6 9 5-2 4 8"/>`},
  overload: {label: 'Chain hops between enemies, briefly stunning each target', drawing: `${marine(28,49)}${enemies([65,27],[102,53],[140,24],[171,52])}<path d="m39 46 13-13-2-5 15-1 15 15 4-4 18 15 19-16-1-7 20-6 18 17 7-1 6 12"/><text x="62" y="15">1</text><text x="99" y="72">2</text><text x="137" y="13">3</text>`},
  'tesla-pylon': {label: 'Deploy a pylon; arcs strike nearby enemies and a live link guards your lane', drawing: `${marine(37,53)}<path class="shape-fill" d="m120 35 8-13 8 13-8 13Z"/><path d="M128 43v15m-9 0h18M50 52l21-11 9 9 21-13 19 2"/>${enemies([154,24],[157,59],[82,44])}<path d="m135 32 7-7 4 5 6-6m-15 18 7 8 5-2 8 10"/>`},
  overclock: {label: 'Time dilation slows enemies and projectiles; your fire stays fast', drawing: `${marine(49)}<circle cx="104" cy="42" r="26"/><path d="M104 23v19l12 8"/>${enemies([157,24],[164,59])}<path class="vignette-ghost" d="M171 24h13m-7 35h10"/><path d="M62 36h24m-24 6h31m-31 6h24M142 25h-9m11 34h-9"/><path d="M144 21v8m-6 26v8"/>`},
};

/** Authored tactical stories share one arena, marine silhouette and enemy scale. */
export function abilityVignette(ability: AbilityDefinition): string {
  const scene = scenes[ability.id];
  return `<svg class="ability-shape ability-vignette" data-ability="${ability.id}" data-shape="${ability.shape.kind}" viewBox="0 0 200 84" role="img" aria-label="${escapeHtml(scene.label)}"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path class="vignette-arena" d="M8 8H192V76H8ZM54 8v68m46-68v68m46-68v68M8 30h184M8 54h184"/>${scene.drawing}</g></svg>`;
}
