import type { AbilityEvent, AbilityEventPhase, AbilityId } from '../abilities/contract';
import type { CueRecipe, SynthLayer } from './synthesis';

type WorldPhase = Exclude<AbilityEventPhase, 'denied' | 'ready' | 'overdrive-ready'>;
type Signature = Readonly<{
  duration: number;
  impact: readonly SynthLayer[];
  cast: readonly SynthLayer[];
  tail: readonly SynthLayer[];
  loop?: readonly SynthLayer[];
  pulse?: readonly SynthLayer[];
  castDuration?: number;
}>;
const noise = (gain: number, cutoff: number, extra: Partial<SynthLayer> = {}): SynthLayer => ({ wave: 'noise', gain, cutoff, ...extra });
const tone = (gain: number, frequency: number, endFrequency = frequency, extra: Partial<SynthLayer> = {}): SynthLayer => ({ wave: 'sine', gain, frequency, endFrequency, ...extra });
const metal = (gain: number, frequency: number, extra: Partial<SynthLayer> = {}): SynthLayer => ({ wave: 'metal', gain, frequency, ...extra });
const pluck = (gain: number, frequency: number, extra: Partial<SynthLayer> = {}): SynthLayer => ({ wave: 'pluck', gain, frequency, ...extra });

/** Each move has its own material/gesture, rather than a shared per-element beep. */
const SIGNATURES: Readonly<Record<AbilityId, Signature>> = {
  ram: {
    duration: .30,
    impact: [tone(.85, 160, 48, { decay: 7 }), noise(.9, 1100, { duration: .09, decay: 6 }), metal(.3, 273, { delay: .018, decay: 8 })],
    cast: [noise(.6, 2200, { attack: .07, decay: .5 }), tone(.35, 64, 154, { attack: .05, fm: .8 })],
    tail: [noise(.5, 740, { decay: 7 }), pluck(.3, 194, { decay: 8 })],
  },
  'seismic-slam': {
    duration: .92, castDuration: .22,
    impact: [tone(1, 112, 31, { decay: 6, duration: .75 }), noise(.85, 620, { decay: 6 }), metal(.5, 146, { duration: .39, decay: 7 }), noise(.25, 4500, { delay: .11, decay: 8 })],
    cast: [noise(.7, 850, { attack: .16, decay: 0 }), metal(.4, 81, { endFrequency: 238, attack: .12, decay: 0, fm: .7 })],
    tail: [metal(.5, 174, { endFrequency: 110, decay: 7 }), noise(.5, 1000, { decay: 6 })],
    pulse: [tone(.8, 94, 36, { decay: 8 }), noise(.5, 1100, { decay: 8 })],
  },
  bulwark: {
    duration: .54,
    impact: [metal(.6, 312, { endFrequency: 156, delay: .01, decay: 5 }), pluck(.55, 785, { delay: .05, decay: 7 }), pluck(.42, 1045, { delay: .105, decay: 7 }), tone(.6, 72, 125, { duration: .22, fm: 1.1 }), noise(.28, 2900, { duration: .13 })],
    cast: [metal(.6, 133, { endFrequency: 397, attack: .035, decay: 1 }), noise(.35, 1400, { attack: .03, decay: 1 })],
    tail: [metal(.6, 390, { endFrequency: 72, decay: 4 }), pluck(.4, 1251, { delay: .04, decay: 7 }), noise(.3, 1800, { decay: 7 })],
    loop: [tone(.75, 96, 96, { decay: 0, fm: .9, modRate: 2, am: .25, pulse: 3 }), metal(.24, 192, { decay: 0, am: .35, pulse: 6 }), noise(.12, 1400, { decay: 0 })],
    pulse: [pluck(.7, 975, { decay: 8 }), metal(.4, 274, { decay: 7 }), noise(.2, 4200, { duration: .06 })],
  },
  railbreaker: {
    duration: 1.58, castDuration: .60,
    impact: [noise(.8, 6200, { duration: .12, decay: 8 }), tone(.95, 178, 29, { duration: .95, fm: .3, decay: 3.5 }), metal(.6, 367, { endFrequency: 108, delay: .028, decay: 4.5 }), noise(.55, 1550, { delay: .07, decay: 3.5 }), metal(.3, 730, { delay: .13, decay: 6 }), tone(.8, 57, 37, { delay: .05, duration: 1.3, attack: .02, decay: 1.8 }), noise(.3, 620, { delay: .09, duration: 1.2, decay: 2.3 }), metal(.23, 242, { endFrequency: 126, delay: .19, duration: .75, decay: 2.5 })],
    cast: [tone(.55, 245, 2680, { attack: .30, decay: 0, fm: 1.2, modRate: 1.5 }), noise(.3, 4200, { attack: .4, decay: 0 }), tone(.4, 48, 92, { attack: .2, decay: 0 })],
    tail: [noise(.6, 1700, { decay: 5 }), metal(.35, 232, { endFrequency: 68, decay: 6 })],
    pulse: [noise(.6, 6700, { duration: .05, decay: 9 }), tone(.8, 138, 43, { decay: 7 }), metal(.3, 630, { decay: 8 })],
  },
  'frost-trail': {
    duration: .48,
    impact: [noise(.45, 2500, { highpass: true, attack: .018 }), metal(.6, 1610, { endFrequency: 2130, decay: 5 }), pluck(.5, 2411, { delay: .04, decay: 7 })],
    cast: [noise(.45, 2100, { highpass: true, attack: .06, decay: .5 }), metal(.4, 940, { endFrequency: 1720, attack: .04, decay: .5 })],
    tail: [pluck(.6, 2053, { decay: 5 }), noise(.4, 3100, { highpass: true, decay: 6 })],
    loop: [noise(.65, 2300, { highpass: true, decay: 0, am: .3, pulse: 1 }), metal(.16, 1740, { decay: 0, am: .7, pulse: 3 }), metal(.10, 2720, { decay: 0, am: .8, pulse: 5 })],
  },
  'cryo-nova': {
    duration: .72,
    impact: [noise(.9, 1900, { highpass: true, attack: .012, decay: 4 }), metal(.5, 1467, { endFrequency: 2440, duration: .4, decay: 7 }), pluck(.5, 3353, { delay: .025, decay: 7 }), pluck(.35, 4057, { delay: .075, decay: 7 }), tone(.25, 184, 92, { decay: 6 })],
    cast: [noise(.7, 2800, { highpass: true, attack: .08, decay: .3 }), metal(.4, 1240, { endFrequency: 1950, attack: .07, decay: .6 })],
    tail: [metal(.5, 2871, { decay: 7 }), pluck(.5, 1787, { delay: .025, decay: 6 }), noise(.4, 2800, { highpass: true, decay: 5 })],
  },
  glacier: {
    duration: 1.05, castDuration: .15,
    impact: [noise(.7, 480, { duration: .43, attack: .025, decay: 4 }), metal(.6, 92, { endFrequency: 177, duration: .46, fm: 1.8, decay: 3 }), metal(.45, 1063, { delay: .10, decay: 6 }), pluck(.45, 2437, { delay: .16, decay: 6 }), noise(.3, 3700, { highpass: true, delay: .18, decay: 7 })],
    cast: [noise(.6, 540, { attack: .065, decay: .2 }), metal(.5, 316, { endFrequency: 892, attack: .08, decay: 1 })],
    tail: [noise(.7, 3200, { highpass: true, decay: 7 }), metal(.55, 1711, { decay: 7 }), pluck(.5, 3217, { delay: .03, decay: 7 }), tone(.35, 148, 55, { duration: .31, decay: 7 })],
    loop: [noise(.5, 2300, { highpass: true, decay: 0, am: .2, pulse: 1.5 }), metal(.35, 318, { decay: 0, am: .8, pulse: .5, fm: .3 }), metal(.18, 1549, { decay: 0, am: .75, pulse: 2.5 })],
    pulse: [metal(.7, 741, { endFrequency: 639, decay: 7 }), pluck(.5, 2957, { decay: 7 }), noise(.4, 2700, { duration: .1, highpass: true })],
  },
  whiteout: {
    duration: 1.34,
    impact: [noise(.9, 1800, { attack: .08, decay: 3, am: .22, pulse: 5 }), metal(.3, 587, { endFrequency: 880, attack: .06, decay: 4 }), pluck(.45, 1973, { delay: .06, decay: 5 }), tone(.4, 88, 58, { duration: .55, decay: 5 })],
    cast: [noise(.6, 1700, { attack: .18, decay: .2 }), metal(.4, 440, { endFrequency: 880, attack: .12, decay: .5 })],
    tail: [noise(.7, 1500, { attack: .015, decay: 4 }), metal(.3, 1471, { endFrequency: 587, decay: 6 })],
    loop: [noise(.85, 1650, { decay: 0, attack: .05, am: .4, pulse: .5 }), noise(.3, 3400, { highpass: true, decay: 0, am: .65, pulse: 1.5 }), metal(.16, 293, { decay: 0, fm: .3, am: .4, pulse: 1 })],
    pulse: [noise(.55, 2700, { highpass: true, decay: 5 }), metal(.5, 1174, { endFrequency: 2348, decay: 5 }), pluck(.45, 3521, { delay: .02, decay: 7 })],
  },
  afterburn: {
    duration: .49,
    impact: [noise(.9, 1150, { attack: .012, decay: 4 }), tone(.65, 167, 66, { decay: 5, fm: 2.3, modRate: .5 }), noise(.3, 4700, { delay: .04, duration: .19, am: .65, pulse: 39 })],
    cast: [noise(.8, 1600, { attack: .035, decay: 1 }), tone(.35, 80, 240, { attack: .02, fm: 2.1, decay: 1 })],
    tail: [noise(.8, 900, { decay: 6 }), noise(.35, 4500, { duration: .12, am: .8, pulse: 51 })],
    loop: [noise(.8, 940, { decay: 0, am: .25, pulse: 2.5 }), noise(.4, 3800, { decay: 0, am: .85, pulse: 21 }), tone(.22, 64, 64, { decay: 0, fm: 2, modRate: .5, am: .4, pulse: 3 })],
    // A low, continuous exhaust cough; Napalm's accents are separated crackles.
    pulse: [tone(.75, 180, 90, { duration: .22, fm: 1.8, modRate: .5, decay: 2 }), noise(.5, 1200, { duration: .21, decay: 2, am: .3, pulse: 12 }), noise(.12, 5000, { duration: .03, decay: 5 })],
  },
  flashfire: {
    duration: .66, castDuration: .08,
    impact: [noise(1, 2300, { attack: .025, decay: 4, am: .22, pulse: 11 }), tone(.6, 215, 58, { duration: .37, fm: 2.7, modRate: .7, decay: 4 }), noise(.45, 5100, { delay: .05, duration: .25, am: .8, pulse: 43 }), metal(.18, 460, { endFrequency: 110, duration: .3, decay: 5 })],
    cast: [noise(.7, 3900, { attack: .02, decay: 3 }), metal(.35, 337, { endFrequency: 680, duration: .065, decay: 4 })],
    tail: [noise(.8, 1750, { decay: 5, am: .5, pulse: 17 }), tone(.25, 101, 52, { decay: 5, fm: 1.2 })],
  },
  'napalm-charge': {
    duration: .83, castDuration: .35,
    impact: [tone(.65, 146, 46, { duration: .4, decay: 6 }), noise(.7, 4800, { duration: .12, decay: 7 }), pluck(.65, 2819, { delay: .015, duration: .28, decay: 8 }), noise(.7, 1350, { delay: .07, attack: .03, decay: 4, am: .35, pulse: 13 })],
    cast: [tone(.8, 181, 82, { duration: .14, decay: 7 }), metal(.35, 624, { duration: .1, decay: 8 }), noise(.4, 1800, { delay: .06, duration: .25, attack: .015, decay: 3 })],
    tail: [noise(.8, 1400, { decay: 5, am: .7, pulse: 23 }), pluck(.3, 1733, { delay: .02, decay: 7 })],
    loop: [noise(.7, 1350, { decay: 0, am: .32, pulse: 1 }), noise(.55, 4200, { decay: 0, am: .93, pulse: 31 }), tone(.17, 83, 83, { decay: 0, fm: 1.1, am: .6, pulse: 4.5 })],
    // Wet fuel spits in three small bright pops rather than a jet-like whoosh.
    pulse: [noise(.5, 6200, { duration: .025, decay: 4 }), pluck(.45, 2819, { delay: .008, duration: .055, decay: 5 }), noise(.55, 5400, { delay: .067, duration: .027, decay: 4 }), pluck(.4, 1907, { delay: .074, duration: .065, decay: 5 }), noise(.4, 7100, { delay: .145, duration: .022, decay: 4 }), tone(.18, 104, 58, { duration: .21, decay: 3 })],
  },
  meltdown: {
    duration: 1.26,
    impact: [tone(.9, 124, 32, { duration: .87, fm: 1, decay: 5 }), noise(1, 870, { attack: .015, decay: 3, am: .2, pulse: 9 }), noise(.6, 5700, { delay: .025, duration: .22, decay: 7 }), metal(.25, 277, { endFrequency: 92, delay: .06, decay: 5 })],
    cast: [noise(.8, 700, { attack: .18, decay: .2 }), tone(.5, 54, 162, { attack: .15, fm: 2, decay: .3 })],
    tail: [noise(.8, 720, { decay: 4 }), tone(.5, 93, 26, { decay: 5, fm: 1.1 }), noise(.2, 3500, { decay: 7, am: .7, pulse: 29 })],
    loop: [noise(.9, 620, { decay: 0, am: .3, pulse: 1.5 }), tone(.32, 51, 51, { decay: 0, fm: 1.9, modRate: .5, am: .2, pulse: 3 }), noise(.3, 2900, { decay: 0, am: .7, pulse: 19 })],
    pulse: [tone(.65, 156, 40, { decay: 6, fm: 1.3 }), noise(.7, 1900, { decay: 5 }), noise(.25, 4900, { duration: .07, decay: 7 })],
  },
  'static-step': {
    duration: .26,
    impact: [noise(.45, 6900, { duration: .055, decay: 8 }), metal(.45, 1730, { endFrequency: 430, duration: .20, fm: 2.2, decay: 3.2 }), tone(.7, 186, 61, { decay: 2 }), tone(.18, 745, 430, { delay: .035, duration: .18, fm: .5, decay: 2.2 })],
    cast: [noise(.7, 5900, { attack: .025, duration: .11, decay: 3 }), tone(.45, 810, 2170, { attack: .02, decay: 3, fm: 2 })],
    tail: [metal(.6, 1520, { endFrequency: 370, decay: 8, fm: 1.5 }), noise(.6, 6700, { duration: .07, decay: 8 })],
    pulse: [noise(.7, 7800, { duration: .05, decay: 8 }), tone(.7, 1260, 210, { duration: .11, fm: 2.4, decay: 7 })],
  },
  overload: {
    duration: .71,
    impact: [noise(.85, 7400, { duration: .065, decay: 8 }), metal(.7, 1340, { endFrequency: 218, duration: .24, fm: 2.8, modRate: 1.5, decay: 6 }), noise(.5, 1900, { delay: .045, decay: 6 }), tone(.45, 131, 39, { delay: .025, duration: .45, decay: 6 }), metal(.25, 2710, { delay: .08, duration: .15, fm: 2, decay: 8 })],
    cast: [metal(.5, 538, { endFrequency: 2140, attack: .05, fm: 2, decay: 1 }), noise(.5, 5800, { attack: .04, decay: 1 })],
    tail: [noise(.5, 3800, { decay: 7, am: .8, pulse: 33 }), metal(.5, 839, { endFrequency: 214, fm: 2, decay: 7 })],
    pulse: [metal(.7, 2110, { endFrequency: 390, duration: .13, fm: 3.1, modRate: 1.7, decay: 6 }), noise(.6, 7100, { duration: .055, decay: 9 }), tone(.3, 213, 72, { decay: 8 })],
  },
  'tesla-pylon': {
    duration: .79, castDuration: .10,
    impact: [tone(.65, 169, 58, { duration: .32, decay: 6 }), metal(.55, 397, { duration: .2, decay: 7 }), pluck(.4, 1193, { delay: .06, decay: 7 }), tone(.5, 157, 628, { delay: .11, attack: .05, fm: 1.5, decay: 4 }), noise(.35, 6300, { delay: .12, duration: .13, decay: 6 })],
    cast: [metal(.65, 291, { endFrequency: 582, decay: 3 }), noise(.4, 2400, { duration: .09, decay: 6 })],
    tail: [tone(.65, 628, 78, { fm: 1.7, decay: 5 }), metal(.4, 342, { delay: .06, decay: 7 }), noise(.3, 3500, { duration: .13, decay: 6 })],
    loop: [tone(.55, 157, 157, { decay: 0, fm: 1.1, modRate: 2, am: .72, pulse: 2 }), metal(.25, 628, { decay: 0, am: .8, pulse: 2 }), noise(.3, 4700, { decay: 0, am: .95, pulse: 2 })],
    // A coil's pitched ring answers its short arc; Overload keeps the noisy snap.
    pulse: [metal(.65, 628, { endFrequency: 942, fm: .35, duration: .22, decay: 2 }), tone(.25, 1884, 628, { duration: .14, decay: 3 }), noise(.3, 6200, { duration: .03, decay: 4 }), pluck(.35, 2512, { delay: .09, duration: .1, decay: 4 })],
  },
  overclock: {
    duration: 1.18,
    impact: [tone(.55, 740, 92, { attack: .02, duration: .75, fm: 1.2, decay: 4 }), metal(.35, 1480, { endFrequency: 370, duration: .48, decay: 5 }), noise(.4, 2200, { highpass: true, attack: .02, decay: 5 }), pluck(.55, 1850, { delay: .04, duration: .13, decay: 8 }), pluck(.4, 1233, { delay: .29, duration: .1, decay: 8 })],
    cast: [tone(.5, 185, 1480, { attack: .16, fm: .7, decay: .5 }), noise(.4, 2700, { highpass: true, attack: .10, decay: .4 })],
    tail: [tone(.65, 92, 740, { attack: .06, fm: 1.1, decay: 3 }), metal(.35, 370, { endFrequency: 1480, attack: .05, decay: 4 }), noise(.35, 3100, { highpass: true, decay: 5 })],
    loop: [tone(.45, 92.5, 92.5, { decay: 0, fm: .4, am: .3, pulse: 1 }), pluck(.55, 1850, { duration: .09, decay: 7 }), pluck(.35, 1233, { delay: .5, duration: .07, decay: 7 }), pluck(.55, 1850, { delay: 1, duration: .09, decay: 7 }), pluck(.35, 1233, { delay: 1.5, duration: .07, decay: 7 }), noise(.12, 3400, { highpass: true, decay: 0, am: .5, pulse: .5 })],
    pulse: [pluck(.7, 1850, { duration: .08, decay: 7 }), metal(.3, 740, { duration: .15, decay: 7 }), noise(.2, 3400, { highpass: true, duration: .04, decay: 8 })],
  },
};

const WORLD_PHASES: readonly WorldPhase[] = ['cast', 'impact', 'tick', 'end', 'burst', 'link', 'dash-start', 'dash-end'];
const sustainedPhase = (phase: WorldPhase) => phase === 'tick' || phase === 'link';
const makeRecipe = (id: AbilityId, phase: WorldPhase): CueRecipe => {
  const signature = SIGNATURES[id];
  const cast = phase === 'cast' || phase === 'dash-start';
  const tail = phase === 'end' || phase === 'burst' || phase === 'dash-end';
  const pulse = sustainedPhase(phase);
  const duration = cast ? signature.castDuration ?? .18 : pulse ? .24 : tail ? Math.min(.62, signature.duration) : signature.duration;
  const source = cast ? signature.cast : pulse ? signature.pulse ?? signature.tail : tail ? signature.tail : signature.impact;
  // Keep authored short layers within a shorter phase and leave real releases.
  const layers = source.map(layer => {
    const delay = Math.min(layer.delay ?? 0, duration * .35);
    return { ...layer, delay, duration: Math.min(layer.duration ?? duration - delay, duration - delay) };
  });
  return {
    id: `ability:${id}:${phase}`, family: 'ability', bus: 'abilities', duration, layers,
    rms: cast ? .065 : pulse ? .065 : tail ? .085 : .15,
    priority: id === 'railbreaker' || id === 'whiteout' || id === 'meltdown' || id === 'overclock' ? 90 : pulse ? 48 : 72,
    interval: phase === 'link' ? .045 : phase === 'tick' ? .14 : .035,
  };
};
const ids = Object.keys(SIGNATURES) as AbilityId[];
const phases = new Map<string, CueRecipe>();
const loops = new Map<AbilityId, CueRecipe>();
for (const id of ids) {
  for (const phase of WORLD_PHASES) {
    const recipe = makeRecipe(id, phase); phases.set(recipe.id, recipe);
  }
  const layers = SIGNATURES[id].loop;
  if (layers) loops.set(id, {
    id: `ability:${id}:loop`, family: 'loop', bus: 'abilities', duration: 2, layers,
    loop: true, priority: 65, interval: .1,
  });
}

const feedback: Readonly<Record<'denied' | 'ready' | 'overdrive-ready', CueRecipe>> = {
  denied: { id: 'ability:feedback:denied', family: 'ui', bus: 'ui', duration: .065, rms: .025, priority: 85, interval: .15, layers: [noise(.7, 1300, { duration: .035, decay: 8 }), metal(.3, 290, { decay: 8 })] },
  ready: { id: 'ability:feedback:ready', family: 'ui', bus: 'ui', duration: .10, rms: .022, priority: 60, interval: .2, layers: [pluck(.6, 1250, { decay: 7 }), noise(.25, 3400, { duration: .035, decay: 8 })] },
  'overdrive-ready': { id: 'ability:feedback:overdrive-ready', family: 'stinger', bus: 'ui', duration: .72, priority: 95, interval: 1, layers: [metal(.35, 370, { endFrequency: 740, attack: .06, decay: 4 }), pluck(.5, 740, { delay: .1, decay: 5 }), pluck(.4, 1110, { delay: .19, decay: 5 }), noise(.2, 2500, { attack: .035, decay: 4 })] },
};

/** Complete local authoring inventory, shared by prewarming and offline audition. */
export const ABILITY_RECIPES: readonly CueRecipe[] = Object.freeze([...phases.values(), ...loops.values(), ...Object.values(feedback)]);

/** Every frozen contract phase has a voice; the director owns lifecycle decisions. */
export function abilityRecipe(event: AbilityEvent): CueRecipe {
  if (event.phase === 'denied' || event.phase === 'ready' || event.phase === 'overdrive-ready') return feedback[event.phase];
  return phases.get(`ability:${event.ability}:${event.phase}`)!;
}

/** A sustained bed exists only for abilities that leave a field, construct or buff. */
export function abilityLoopRecipe(id: AbilityId): CueRecipe | null { return loops.get(id) ?? null; }
