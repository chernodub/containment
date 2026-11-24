import {AUGMENT_BOONS, conflictingAugment, type AugmentId} from '../../game/abilities/augmentCatalog';
import type {AbilityDefinition, AbilityId} from '../../game/abilities/contract';
import {escapeHtml} from './initialTemplates';

const marine = (x = 38, y = 42) => `<g class="vignette-marine" transform="translate(${x} ${y})"><path d="M-4-4Q0-8 4-4L5 3 0 6-5 3Z"/><path d="M0-6V0M-3 0H3M-5 7H5M4 1h9"/></g>`;
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

type Vignette = {label: string; drawing: string};

function renderVignette(scene: Vignette, data = ''): string {
  return `<svg class="ability-shape ability-vignette" ${data} viewBox="0 0 200 84" role="img" aria-label="${escapeHtml(scene.label)}"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path class="vignette-arena" d="M8 8H192V76H8ZM54 8v68m46-68v68m46-68v68M8 30h184M8 54h184"/>${scene.drawing}</g></svg>`;
}

/** Authored tactical stories share one arena, marine silhouette and enemy scale. */
export function abilityVignette(ability: AbilityDefinition): string {
  return renderVignette(scenes[ability.id], `data-ability="${ability.id}" data-shape="${ability.shape.kind}"`);
}

type Transformation = {target: string; lost?: string; before: Vignette; after: Vignette};

const frozenKill = `${marine(31)}${frozen(87,42)}<path class="vignette-hostile" d="m83 38 8 8m0-8-8 8"/>`;
const shardTargets = enemies([128,20],[153,43],[129,64]);
const fireZone = `<circle class="shape-fill" cx="65" cy="42" r="25"/>${enemies([69,42],[121,24],[134,57])}${flame(69,35)}`;
const pylon = '<path class="shape-fill" d="m82 39 8-13 8 13-8 13Z"/><path d="M90 48v15m-9 0h18"/>';
const pylonArc = `${enemies([124,23])}<path d="m97 36 9-8 2 4 12-9"/>`;

const iceAttack = `${marine(48)}${enemies([149,34],[149,50])}`;
const iceVolley = '<path class="vignette-hostile" d="M144 34H105m5-3-5 3 5 3M144 50H105m5-3-5 3 5 3"/>';
const overloadTargets = enemies([65,27],[102,53],[140,24],[171,52]);
const meltdownTargets = enemies([115,30],[158,42]);

const transformations: Partial<Record<AugmentId, Transformation>> = {
  'siege-plow': {
    target: 'Bulwark',
    lost: 'Stationary cover.',
    before: scenes.bulwark,
    after: {
      label: 'Bulwark moves forward from its original position and launches enemies in its path',
      drawing: `${marine(43)}<path class="vignette-wall vignette-ghost" d="M91 14v55"/><path class="vignette-wall" d="M122 14v55"/>${arrow(103,42)}${enemies([135,22],[143,57])}<path class="vignette-hostile" d="M130 22H124m0-4v8M137 58H124m0-4v8"/>${arrow(151,22)}${arrow(152,57)}`,
    },
  },
  'fault-line': {
    target: 'Seismic Slam',
    before: scenes['seismic-slam'],
    after: {
      label: 'Slam still launches nearby enemies; a fissure along aim repeatedly staggers enemies in the lane',
      drawing: `<path class="shape-fill" d="M67 34H176V50H67Z"/><path d="m70 42 24 1 9-5 18 6 11-4 18 3 22-2"/>${marine(67)}<circle cx="67" cy="42" r="24" class="shape-fill"/>${enemies([54,21],[69,66],[131,42],[159,44])}${arrow(48,19,220)}${arrow(69,71,90)}<path d="m128 35 6-6m22 8 6-6"/><path class="vignette-wall" d="M178 15v55"/>`,
    },
  },
  'shard-harvest': {
    target: 'Frozen kills',
    before: {label: 'A frozen enemy dies; the nearby enemies are untouched', drawing: frozenKill + shardTargets},
    after: {
      label: 'The frozen kill fires shards that damage and chill the three nearest visible enemies',
      drawing: `${frozenKill}${shardTargets}<path d="m95 38 27-15m-26 19 51 1m-52 3 28 15m-5-39 4 1-1 5m21 12 5 3-5 3m-21 10 2 5-5 1"/>`,
    },
  },
  'ice-road': {
    target: 'Glacier',
    lost: 'Projectile-blocking walls and manual shatter.',
    before: {
      label: 'The incoming volley stops at the wall, which the marine can shatter manually',
      drawing: `${iceAttack}${iceVolley}<path class="shape-fill" d="m96 21 7 7-5 9 7 8-6 9 5 9H94V21Z"/><path d="m110 26 6-6m-7 39 7 6m-6-23 10-2"/>`,
    },
    after: {
      label: 'The marine moves faster along a traversable ice road that chills enemies standing on it',
      drawing: `<path class="shape-fill" d="M33 28H171V56H33Z"/>${iceAttack}${iceVolley}<path class="vignette-hostile" stroke-dasharray="3 3" d="M103 34H61m5-3-5 3 5 3M103 50H61m5-3-5 3 5 3"/>${arrow(75,42)}`,
    },
  },
  'ember-relay': {
    target: 'Fire zones',
    before: {label: 'The fire zone ignites an enemy inside its edge', drawing: fireZone},
    after: {
      label: 'An enemy inside the fire zone relays a spark to the nearest visible non-burning enemy outside',
      drawing: `${fireZone}<path d="m76 41 15-13 5 4 17-8m-6 0h6l-2 5"/>${flame(121,18)}`,
    },
  },
  'meltdown-core': {
    target: 'Meltdown',
    lost: 'The full 8-second aura and its sustained bonuses.',
    before: scenes.meltdown,
    after: {
      label: 'A short fuse follows the marine, then a larger burst damages and ignites nearby enemies',
      drawing: `<circle cx="93" cy="42" r="15" stroke-dasharray="3 3"/><circle cx="93" cy="42" r="38" class="shape-fill"/>${marine(93)}${meltdownTargets}${flame(115,23)}<text x="94" y="69" text-anchor="middle">2 s fuse</text>`,
    },
  },
  'pilgrim-pylon': {
    target: 'Tesla Pylon',
    lost: 'A pylon that stays where you placed it.',
    before: {
      label: 'The pylon stays at its placement, arcs to a nearby enemy and links to the marine',
      drawing: `${pylon}${pylonArc}${marine(148,51)}<path d="m97 43 16 1 3 8 24-1"/>`,
    },
    after: {
      label: 'The pylon follows behind the marine while retaining its arc and live link',
      drawing: `<g class="vignette-ghost" transform="translate(-41 0)">${pylon}</g>${arrow(68,46)}${pylon}${pylonArc}${marine(148,51)}<path d="m97 43 16 1 3 8 24-1"/>${arrow(174,51)}`,
    },
  },
  'live-wire': {
    target: 'Overload',
    lost: 'Chain jumps between targets, including the extra jumps from Forked Overload.',
    before: scenes.overload,
    after: {
      label: 'One enemy anchors a tether to the marine; enemies crossing the line take repeated damage and shock',
      drawing: `<path class="shape-fill" d="M40 45L171 48V56L40 53Z"/>${marine(28,49)}${overloadTargets}<path d="m42 49 15-2 5 5 18-4 4 3 20-2 18-2 5 5 17-4 4 2 16-1"/><circle cx="171" cy="52" r="9" stroke-dasharray="2 3"/><path d="m97 42 4-5m4 4 5-4m-5 26 4-5"/>`,
    },
  },
};

export function transformationPreview(id: string, upgraded = false): string {
  const transformation = transformations[id as AugmentId];
  const partner = conflictingAugment(id);
  if (!transformation || !partner) return '';
  let after = transformation.after;
  if (id === 'shard-harvest' && upgraded) {
    after = {
      label: 'The frozen kill fires shards that damage and chill the five nearest visible enemies',
      drawing: after.drawing + enemies([105,17],[105,67]) + '<path d="m91 34 11-13m-11 29 11 13"/>',
    };
  }
  const loss = transformation.lost
    ? `${transformation.lost} Also locks out ${AUGMENT_BOONS[partner].name}.`
    : `Access to ${AUGMENT_BOONS[partner].name}.`;
  return `<span class="transformation-preview"><b class="transformation-title">Transforms: ${transformation.target}</b><span class="reward-combat-preview"><span><small>Before</small>${renderVignette(transformation.before)}</span><b aria-hidden="true">→</b><span><small>After</small>${renderVignette(after)}</span></span><span class="transformation-loss"><b>Gives up</b> ${loss}</span></span>`;
}
