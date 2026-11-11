import type { AudioEnvironment } from './contract';
import type { CueRecipe, SynthLayer } from './synthesis';

type EnvironmentProfile = Readonly<{
  recipe: CueRecipe;
  reverbSeconds: number;
  damping: number;
}>;

const bed = (environment: AudioEnvironment, layers: readonly SynthLayer[], rms = .036): CueRecipe => ({
  id: `ambience:${environment}`,
  family: 'ambience',
  bus: 'ambience',
  duration: 5,
  loop: true,
  priority: 85,
  rms,
  layers,
});

/** Original ship-room beds; the small reverb profiles describe material and scale. */
export const ENVIRONMENT_PROFILES: Readonly<Record<AudioEnvironment, EnvironmentProfile>> = {
  cryogenics: {
    reverbSeconds: 1.8, damping: .30,
    recipe: bed('cryogenics', [
      { wave: 'noise', gain: .50, cutoff: 1700, highpass: true, attack: .3, am: .30, pulse: .2 },
      { wave: 'sine', gain: .32, frequency: 72, fm: .10, attack: .2, am: .18, pulse: .4 },
      { wave: 'metal', gain: .10, frequency: 576, attack: .4, am: .8, pulse: .2, cutoff: 1800 },
      { wave: 'noise', gain: .20, cutoff: 300, attack: .4, am: .6, pulse: .6 },
    ], .034),
  },
  habitation: {
    reverbSeconds: .85, damping: .16,
    recipe: bed('habitation', [
      { wave: 'noise', gain: .65, cutoff: 420, attack: .3, am: .12, pulse: .2 },
      { wave: 'sine', gain: .32, frequency: 49, attack: .3, am: .18, pulse: .4 },
      { wave: 'metal', gain: .15, frequency: 112, endFrequency: 83, delay: 1.2, duration: 1.1, attack: .15, decay: 2.3, fm: .4, cutoff: 900 },
      { wave: 'pluck', gain: .17, frequency: 188, delay: 3.2, duration: .8, attack: .03, decay: 1, cutoff: 1200 },
    ], .032),
  },
  security: {
    reverbSeconds: 1.1, damping: .45,
    recipe: bed('security', [
      { wave: 'noise', gain: .35, cutoff: 900, attack: .3, am: .2, pulse: .4 },
      { wave: 'metal', gain: .32, frequency: 120, attack: .2, cutoff: 900, am: .72, pulse: .8 },
      { wave: 'sine', gain: .14, frequency: 420, attack: .1, am: 1, pulse: .8, cutoff: 1500 },
      { wave: 'sine', gain: .12, frequency: 560, delay: .32, duration: 4.65, attack: .1, am: 1, pulse: .8, cutoff: 1500 },
    ], .033),
  },
  cargo: {
    reverbSeconds: 2.8, damping: .22,
    recipe: bed('cargo', [
      { wave: 'noise', gain: .65, cutoff: 230, attack: .4, am: .45, pulse: .2 },
      { wave: 'sine', gain: .35, frequency: 36, attack: .4, am: .22, pulse: .4 },
      { wave: 'metal', gain: .28, frequency: 92, endFrequency: 78, delay: .8, duration: 1.6, attack: .02, decay: 4, cutoff: 1500 },
      { wave: 'metal', gain: .14, frequency: 161, delay: 1.1, duration: 1.8, attack: .04, decay: 4, cutoff: 1200 },
      { wave: 'noise', gain: .08, cutoff: 1900, delay: 3.3, duration: 1.4, attack: .15, decay: 2 },
    ], .036),
  },
  communications: {
    reverbSeconds: .65, damping: .55,
    recipe: bed('communications', [
      { wave: 'noise', gain: .32, cutoff: 1850, attack: .2, am: .3, pulse: .6 },
      { wave: 'metal', gain: .12, frequency: 960, fm: .65, attack: .15, am: .95, pulse: 11, cutoff: 3400 },
      { wave: 'sine', gain: .16, frequency: 1440, endFrequency: 1680, delay: .2, duration: 1.4, attack: .08, decay: 1, am: 1, pulse: 17, cutoff: 4200 },
      { wave: 'sine', gain: .13, frequency: 2160, endFrequency: 1800, delay: 2.7, duration: 1.3, attack: .1, decay: 1, am: 1, pulse: 13, cutoff: 4200 },
      { wave: 'sine', gain: .27, frequency: 96, attack: .2, am: .18, pulse: .4 },
    ], .030),
  },
  engineering: {
    reverbSeconds: 1.5, damping: .32,
    recipe: bed('engineering', [
      { wave: 'metal', gain: .48, frequency: 52, fm: .22, attack: .2, am: .35, pulse: 5.2, cutoff: 1500 },
      { wave: 'sine', gain: .26, frequency: 104, attack: .2, am: .45, pulse: 2.6 },
      { wave: 'noise', gain: .45, cutoff: 680, attack: .3, am: .3, pulse: 5.2 },
      { wave: 'noise', gain: .40, cutoff: 1000, highpass: true, delay: 2.4, duration: .9, attack: .08, decay: 2 },
      { wave: 'metal', gain: .08, frequency: 1680, delay: 3.65, duration: .3, attack: .003, decay: 7, cutoff: 4300 },
    ], .040),
  },
  maintenance: {
    reverbSeconds: 1.3, damping: .24,
    recipe: bed('maintenance', [
      { wave: 'noise', gain: .38, cutoff: 620, attack: .2, am: .35, pulse: .8 },
      { wave: 'sine', gain: .35, frequency: 61, fm: .17, attack: .2, am: .55, pulse: 1.6 },
      { wave: 'sine', gain: .17, frequency: 1360, endFrequency: 520, delay: .7, duration: .16, attack: .003, decay: 5, fm: 1.2, cutoff: 3500 },
      { wave: 'sine', gain: .14, frequency: 1780, endFrequency: 680, delay: 2.15, duration: .13, attack: .003, decay: 5, fm: .7, cutoff: 3500 },
      { wave: 'sine', gain: .20, frequency: 1120, endFrequency: 480, delay: 3.8, duration: .2, attack: .003, decay: 5, fm: 1.5, cutoff: 3500 },
    ], .033),
  },
  infested: {
    reverbSeconds: .9, damping: .10,
    recipe: bed('infested', [
      { wave: 'noise', gain: .48, cutoff: 280, attack: .3, am: .7, pulse: .6 },
      { wave: 'sine', gain: .26, frequency: 83, endFrequency: 67, fm: 2.4, modRate: .51, attack: .3, am: .6, pulse: .8, cutoff: 650 },
      { wave: 'noise', gain: .24, cutoff: 2300, delay: 1.3, duration: 1.3, attack: .2, decay: 2, am: .9, pulse: 19 },
      { wave: 'sine', gain: .15, frequency: 420, endFrequency: 240, delay: 3.1, duration: .6, attack: .06, decay: 2, fm: 3.2, modRate: .47, cutoff: 1400 },
    ], .037),
  },
  containment: {
    reverbSeconds: 1.9, damping: .50,
    recipe: bed('containment', [
      { wave: 'sine', gain: .32, frequency: 144, attack: .3, am: .42, pulse: 1.2, fm: .15 },
      { wave: 'metal', gain: .23, frequency: 288, attack: .3, am: .7, pulse: 1.2, cutoff: 1800 },
      { wave: 'noise', gain: .26, cutoff: 2400, attack: .3, am: .68, pulse: 1.2 },
      { wave: 'sine', gain: .12, frequency: 864, attack: .4, am: .85, pulse: .6, fm: .3, cutoff: 2600 },
    ], .034),
  },
  reactor: {
    reverbSeconds: 3.3, damping: .18,
    recipe: bed('reactor', [
      { wave: 'noise', gain: .75, cutoff: 1100, attack: .3, am: .28, pulse: 2 },
      { wave: 'sine', gain: .42, frequency: 42, fm: .5, attack: .3, am: .2, pulse: .4 },
      { wave: 'metal', gain: .18, frequency: 168, fm: .7, attack: .3, am: .4, pulse: 4.2, cutoff: 2300 },
      { wave: 'noise', gain: .20, cutoff: 3200, highpass: true, attack: .4, am: .8, pulse: 6.4 },
      { wave: 'sine', gain: .12, frequency: 336, attack: .15, am: 1, pulse: .8 },
    ], .040),
  },
};

export const ENVIRONMENT_RECIPES: readonly CueRecipe[] = Object.values(ENVIRONMENT_PROFILES).map(profile => profile.recipe);

/** Low-health double heartbeat; deliberately quiet and below enemy tell frequencies. */
export const HEARTBEAT_RECIPE: CueRecipe = {
  id: 'system:heartbeat', family: 'loop', bus: 'ambience', duration: 1.25,
  loop: true, priority: 88, rms: .020, peak: .17,
  layers: [
    { wave: 'sine', gain: .7, frequency: 73, endFrequency: 44, delay: .03, duration: .17, attack: .018, decay: 4, cutoff: 220 },
    { wave: 'noise', gain: .18, cutoff: 170, delay: .03, duration: .14, attack: .012, decay: 4 },
    { wave: 'sine', gain: .45, frequency: 66, endFrequency: 40, delay: .27, duration: .15, attack: .016, decay: 4, cutoff: 200 },
    { wave: 'noise', gain: .12, cutoff: 150, delay: .27, duration: .12, attack: .01, decay: 4 },
  ],
};
