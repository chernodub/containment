import type { UiCue } from './contract';
import type { CueRecipe, SynthLayer } from './synthesis';

/** Complete contract inventory, also used to build the audition controls. */
export const UI_CUES = [
  'hover', 'select', 'confirm', 'back', 'denied', 'tab', 'toggle', 'slider',
  'draft-reveal', 'boon-acquired', 'rig-equip', 'reroll', 'purchase',
  'room-enter', 'room-clear', 'boss-intro', 'overdrive-ready', 'ability-ready',
  'low-health', 'death', 'victory', 'checkpoint',
] as const satisfies readonly UiCue[];

// A shared interval language (open fifths, suspended seconds) keeps rewards and
// navigation coherent without turning the ship's interface into a melody box.
const tick = (frequency: number, delay = 0, gain = .5, duration = .10): SynthLayer => ({
  wave: 'metal', frequency, delay, gain, duration, attack: .003,
  decay: 5, cutoff: 5000, fm: .08,
});
const air = (duration: number, gain = .12, cutoff = 2600, delay = 0): SynthLayer => ({
  wave: 'noise', gain, cutoff, duration, delay, attack: .004, decay: 6,
});
const tone = (frequency: number, delay: number, duration: number, gain = .4): SynthLayer => ({
  wave: 'sine', frequency, gain, delay, duration, attack: .012, decay: 3,
  fm: .12, modRate: 2.01, cutoff: 4500,
});
const cue = (name: UiCue, duration: number, layers: readonly SynthLayer[], options: Partial<CueRecipe> = {}): CueRecipe => ({
  id: `ui:${name}`, family: 'ui', bus: 'ui', priority: 75,
  interval: .07, duration, layers, ...options,
});
const stinger = (name: UiCue, duration: number, layers: readonly SynthLayer[], options: Partial<CueRecipe> = {}): CueRecipe =>
  cue(name, duration, layers, { family: 'stinger', priority: 95, interval: .45, ...options });

const recipes: Readonly<Record<UiCue, CueRecipe>> = {
  hover: cue('hover', .065, [tick(1760, 0, .35, .055), air(.04, .12)], { rms: .025, interval: .09 }),
  select: cue('select', .12, [tick(880), tick(1320, .018, .18, .08), air(.06)], { rms: .040 }),
  confirm: cue('confirm', .28, [tick(660, 0, .35, .12), tone(990, .055, .2), air(.08)], { rms: .045 }),
  back: cue('back', .18, [tick(990, 0, .25, .08), tone(660, .045, .12, .35), air(.05, .08, 1700)], { rms: .035 }),
  denied: cue('denied', .10, [tick(220, 0, .45, .07), tick(311, .018, .18, .07), air(.05, .28, 900)], { rms: .032, interval: .15 }),
  tab: cue('tab', .11, [tick(1100, 0, .4, .085), tick(1650, .025, .2, .07), air(.035, .1, 3400)], { rms: .032 }),
  toggle: cue('toggle', .16, [tick(550, 0, .4, .08), tick(1100, .04, .22, .1), air(.045, .12, 1800)], { rms: .038 }),
  slider: cue('slider', .05, [tick(1320, 0, .3, .045), air(.03, .12, 3800)], { rms: .022, interval: .045 }),
  'draft-reveal': stinger('draft-reveal', .75, [
    air(.4, .25, 3400), tone(220, .04, .6, .45), tone(330, .12, .56, .35),
    tick(880, .22, .16, .45), tick(1320, .32, .12, .38),
  ], { rms: .085 }),
  'boon-acquired': stinger('boon-acquired', .70, [
    tick(440, 0, .32, .25), tone(660, .09, .45, .35), tone(880, .18, .45, .4),
    tick(1320, .22, .12, .4), air(.09, .12, 3000),
  ], { rms: .090 }),
  'rig-equip': stinger('rig-equip', .60, [
    { wave: 'noise', gain: .3, cutoff: 700, duration: .18, attack: .005, decay: 6 },
    tick(165, .02, .35, .22), tick(330, .08, .28, .3), tone(660, .16, .4, .32),
  ], { rms: .080 }),
  reroll: cue('reroll', .34, [tick(440, 0, .3, .13), tick(660, .055, .3, .13), tick(550, .11, .27, .13), tick(880, .19, .25, .14), air(.15, .12)], { rms: .045, interval: .2 }),
  purchase: cue('purchase', .42, [tick(660, 0, .35, .15), tick(1320, .075, .25, .18), tone(990, .14, .25, .35), air(.06, .1, 3400)], { rms: .050, interval: .2 }),
  'room-enter': stinger('room-enter', .85, [
    tone(110, 0, .8, .45), tone(165, .10, .65, .28), tick(660, .14, .2, .45),
    { wave: 'noise', gain: .3, cutoff: 1400, duration: .45, attack: .15, decay: 2 },
  ], { rms: .075 }),
  'room-clear': stinger('room-clear', 1.05, [
    tone(220, 0, .9, .32), tone(330, .08, .8, .36), tone(440, .17, .8, .3),
    tick(880, .26, .13, .65), air(.2, .15, 4200),
  ]),
  'boss-intro': stinger('boss-intro', 1.65, [
    { wave: 'sine', gain: .6, frequency: 66, endFrequency: 42, duration: 1.5, attack: .02, decay: 2, fm: .5 },
    { wave: 'metal', gain: .25, frequency: 98, endFrequency: 87, duration: 1.6, attack: .15, decay: 1, fm: 1.2, cutoff: 1800 },
    { wave: 'noise', gain: .3, cutoff: 1300, duration: 1.2, attack: .08, decay: 3 },
    tone(185, .25, 1.15, .2),
  ], { rms: .11, priority: 100, interval: 1.2 }),
  'overdrive-ready': stinger('overdrive-ready', .90, [
    { wave: 'sine', gain: .35, frequency: 330, endFrequency: 660, duration: .4, attack: .03, decay: 1, fm: .3 },
    tone(660, .32, .52, .36), tone(990, .38, .46, .3), tick(1320, .42, .17, .42), air(.3, .16, 4200),
  ], { rms: .095, priority: 100 }),
  'ability-ready': cue('ability-ready', .09, [tick(1100, 0, .3, .07), tone(1650, .012, .065, .12), air(.035, .08)], { rms: .022, interval: .18 }),
  'low-health': cue('low-health', .42, [tone(110, 0, .16, .5), tone(98, .21, .16, .35), air(.09, .15, 380)], { rms: .032, interval: 2.5 }),
  death: stinger('death', 1.50, [
    { wave: 'sine', gain: .45, frequency: 220, endFrequency: 55, duration: 1.4, attack: .025, decay: 2, fm: .35 },
    { wave: 'metal', gain: .22, frequency: 146.8, endFrequency: 73.4, duration: 1.2, attack: .01, decay: 3, cutoff: 1400 },
    { wave: 'noise', gain: .4, cutoff: 780, duration: .7, attack: .004, decay: 4 },
    tone(55, .3, 1.1, .3),
  ], { rms: .085, interval: 1.5, priority: 100 }),
  victory: stinger('victory', 1.75, [
    tone(220, 0, 1.6, .35), tone(330, .15, 1.4, .35), tone(440, .3, 1.3, .30),
    tone(550, .5, 1.1, .18), tick(880, .52, .12, .8), air(.4, .12, 3200),
  ], { rms: .1, interval: 1.5, priority: 100 }),
  checkpoint: cue('checkpoint', .48, [tick(550, 0, .25, .15), tone(825, .07, .3, .35), tick(1100, .18, .18, .25), air(.06, .12)], { rms: .04, interval: .6 }),
};

export const UI_RECIPES: readonly CueRecipe[] = UI_CUES.map(name => recipes[name]);

/** Quiet, rate-limited navigation and concise presentation beats. */
export function uiRecipe(cue: UiCue): CueRecipe { return recipes[cue]; }
