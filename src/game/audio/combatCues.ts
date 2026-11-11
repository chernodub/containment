import type { CueRecipe, SynthLayer } from './synthesis';

export type WeaponCueId = 'pistol' | 'rifle' | 'shotgun' | 'plasma' | 'rocket';
export type ImpactCueId = 'flesh' | 'armor' | 'blocked' | 'kill' | 'body' | 'wall'
  | 'small-explosion' | 'explosion' | 'large-explosion' | 'reload' | 'shell' | 'hurt' | 'grenade' | 'switch';
export type EnemyCuePhase = 'warning' | 'attack' | 'death';

const noise = (gain: number, cutoff: number, duration: number, extra: Partial<SynthLayer> = {}): SynthLayer =>
  ({ wave: 'noise', gain, cutoff, duration, ...extra });
const tone = (gain: number, frequency: number, endFrequency: number, duration: number, extra: Partial<SynthLayer> = {}): SynthLayer =>
  ({ wave: 'sine', gain, frequency, endFrequency, duration, ...extra });
const metal = (gain: number, frequency: number, duration: number, extra: Partial<SynthLayer> = {}): SynthLayer =>
  ({ wave: 'metal', gain, frequency, duration, ...extra });

const weapons: Record<WeaponCueId, CueRecipe> = {
  pistol: {
    id: 'weapon:pistol', family: 'weapon', bus: 'weapons', duration: .28, priority: 64, interval: .055,
    layers: [
      noise(.8, 5400, .045, { decay: 8 }),
      tone(.78, 205, 69, .18, { decay: 5, fm: .4 }),
      metal(.34, 1450, .075, { delay: .012, decay: 7 }),
      noise(.24, 900, .22, { delay: .045, decay: 6 }),
    ],
  },
  rifle: {
    id: 'weapon:rifle', family: 'weapon', bus: 'weapons', duration: .19, priority: 63, interval: .045,
    layers: [
      noise(.82, 7200, .032, { decay: 6 }),
      tone(.62, 255, 102, .12, { decay: 6 }),
      metal(.48, 1950, .06, { delay: .019, decay: 9 }),
      tone(.18, 420, 210, .15, { delay: .025, fm: 1.4, modRate: 2.1 }),
    ],
  },
  shotgun: {
    id: 'weapon:shotgun', family: 'weapon', bus: 'weapons', duration: .52, priority: 70, interval: .09,
    layers: [
      noise(.95, 3500, .14, { decay: 5 }),
      tone(1.1, 145, 38, .38, { decay: 4, fm: .35 }),
      noise(.42, 720, .45, { delay: .045, decay: 5 }),
      metal(.28, 630, .12, { delay: .18, decay: 4 }),
      metal(.17, 1540, .08, { delay: .31, decay: 7 }),
    ],
  },
  plasma: {
    id: 'weapon:plasma', family: 'weapon', bus: 'weapons', duration: .43, priority: 67, interval: .055,
    layers: [
      tone(.75, 1250, 230, .27, { fm: 2.6, modRate: 1.51, decay: 5 }),
      noise(.42, 5900, .055, { decay: 5 }),
      tone(.45, 93, 50, .31, { decay: 3 }),
      metal(.25, 2250, .35, { delay: .03, decay: 5, am: .45, pulse: 31 }),
    ],
  },
  rocket: {
    id: 'weapon:rocket', family: 'weapon', bus: 'weapons', duration: .75, priority: 73, interval: .12,
    layers: [
      tone(.85, 167, 48, .22, { decay: 5 }),
      metal(.38, 460, .08, { decay: 6 }),
      noise(.92, 1800, .67, { delay: .05, attack: .022, decay: 2.9, am: .38, pulse: 37 }),
      tone(.22, 850, 210, .58, { delay: .12, fm: .8, decay: 3.8 }),
    ],
  },
};

const impact = (id: ImpactCueId, duration: number, layers: readonly SynthLayer[], extra: Partial<CueRecipe> = {}): CueRecipe => ({
  id: `impact:${id}`, family: 'impact', bus: 'impacts', duration, layers, priority: 45, interval: .055, ...extra,
});
const impacts: Record<ImpactCueId, CueRecipe> = {
  flesh: impact('flesh', .16, [noise(.9, 1450, .075, { decay: 5 }), tone(.6, 190, 72, .13), noise(.18, 5200, .04, { delay: .018 })]),
  armor: impact('armor', .19, [metal(.85, 1870, .18, { decay: 6 }), noise(.5, 6200, .025), tone(.3, 340, 170, .11)], { rms: .065, peak: .37 }),
  blocked: impact('blocked', .105, [metal(.72, 570, .085, { decay: 9 }), noise(.45, 2900, .022), tone(.25, 118, 88, .09)], { rms: .05, peak: .28 }),
  kill: impact('kill', .25, [noise(.75, 2100, .08), tone(.55, 240, 66, .2, { fm: .8 }), metal(.3, 2850, .15, { delay: .018, decay: 8 })], { priority: 66, interval: .075 }),
  body: impact('body', .32, [tone(.9, 122, 37, .27), noise(.8, 650, .19, { decay: 5 }), noise(.25, 3200, .065, { delay: .015 })], { priority: 43, interval: .1 }),
  wall: impact('wall', .46, [tone(1, 170, 42, .32, { fm: .4 }), metal(.65, 390, .35, { delay: .015 }), noise(.8, 3600, .10), noise(.24, 1100, .35, { delay: .09 })], { priority: 68, interval: .085 }),
  'small-explosion': impact('small-explosion', .48, [noise(.8, 3700, .12), tone(.9, 168, 40, .35), noise(.45, 650, .4, { delay: .04 })], { priority: 68, interval: .08 }),
  explosion: impact('explosion', .95, [noise(.95, 4400, .16), tone(1.1, 130, 27, .66, { decay: 4 }), noise(.7, 580, .88, { delay: .03, decay: 4.7 }), metal(.15, 710, .46, { delay: .18, decay: 5 })], { rms: .14, peak: .70, priority: 80, interval: .09 }),
  'large-explosion': impact('large-explosion', 1.4, [noise(1, 5600, .19), tone(1.2, 107, 22, 1, { decay: 4 }), noise(.85, 460, 1.3, { delay: .03, decay: 4.1 }), metal(.25, 295, .67, { delay: .2, decay: 4 }), noise(.24, 1900, .4, { delay: .55, decay: 4 })], { rms: .16, peak: .72, priority: 90, interval: .15 }),
  reload: impact('reload', .22, [metal(.7, 870, .06, { decay: 7 }), noise(.6, 3800, .08, { delay: .025 }), metal(.45, 1500, .10, { delay: .11, decay: 6 })], { rms: .055, peak: .32, priority: 52, interval: .08 }),
  shell: impact('shell', .17, [{ wave: 'pluck', gain: .8, frequency: 2860, duration: .09 }, metal(.38, 3900, .07, { delay: .065, decay: 6 }), noise(.16, 6100, .025)], { rms: .026, peak: .18, priority: 18, interval: .09 }),
  hurt: impact('hurt', .34, [tone(.9, 160, 52, .30, { fm: 1.2, decay: 5 }), noise(.65, 1100, .16), metal(.22, 510, .2, { delay: .035 })], { priority: 86, interval: .16 }),
  grenade: impact('grenade', .29, [metal(.65, 630, .08), noise(.7, 2400, .19, { delay: .05, attack: .02, decay: 3 }), tone(.25, 360, 120, .2, { delay: .035 })], { rms: .065, peak: .36, priority: 59, interval: .12 }),
  switch: impact('switch', .18, [noise(.7, 1900, .06), metal(.6, 960, .09, { delay: .055, decay: 7 }), tone(.22, 205, 130, .11)], { rms: .048, peak: .28, priority: 52, interval: .07 }),
};

type VocalProfile = Readonly<{
  fundamental: number; formant: number; rasp: number; pulse: number;
  duration: number; warning: number; wet: number;
}>;
const vocals: Readonly<Record<string, VocalProfile>> = {
  // Small throat/chitin clicks; heavy subharmonic growl; wet pressure sack;
  // breathy high predator; fluttering, gurgling brood cavity.
  crawler: { fundamental: 390, formant: 2400, rasp: 2.8, pulse: 32, duration: .27, warning: .32, wet: .1 },
  brute: { fundamental: 57, formant: 310, rasp: 1.8, pulse: 17, duration: .65, warning: .85, wet: .15 },
  spitter: { fundamental: 185, formant: 970, rasp: 3.1, pulse: 13, duration: .43, warning: .5, wet: .7 },
  stalker: { fundamental: 680, formant: 3700, rasp: 1.4, pulse: 45, duration: .35, warning: .4, wet: .05 },
  carrier: { fundamental: 98, formant: 660, rasp: 4.8, pulse: 8, duration: .59, warning: .55, wet: .85 },
  champion: { fundamental: 45, formant: 470, rasp: 2.9, pulse: 12, duration: .9, warning: .85, wet: .25 },
  warden: { fundamental: 49, formant: 390, rasp: 2.1, pulse: 19, duration: .83, warning: .85, wet: .1 },
  matron: { fundamental: 78, formant: 815, rasp: 5.4, pulse: 6, duration: .95, warning: .85, wet: .95 },
  queen: { fundamental: 39, formant: 1180, rasp: 4.1, pulse: 11, duration: 1.1, warning: .8, wet: .5 },
  'queen-phase-2': { fundamental: 47, formant: 1540, rasp: 4.8, pulse: 16, duration: 1.15, warning: .8, wet: .55 },
  'queen-phase-3': { fundamental: 62, formant: 2100, rasp: 5.6, pulse: 23, duration: 1.2, warning: .8, wet: .65 },
};

function vocalRecipe(family: string, profile: VocalProfile, phase: EnemyCuePhase, elite = false): CueRecipe {
  const warning = phase === 'warning', death = phase === 'death';
  const duration = warning ? profile.warning : profile.duration * (death ? 1.25 : 1);
  const pitch = profile.fundamental * (elite ? .78 : 1);
  const rising = warning ? 1.55 : death ? .40 : .65;
  const layers: SynthLayer[] = [
    tone(.75, pitch, pitch * rising, duration, {
      fm: profile.rasp, modRate: .49, decay: warning ? .7 : 4,
      attack: warning ? .025 : .006, am: .5, pulse: profile.pulse,
    }),
    tone(.44, profile.formant, profile.formant * (warning ? 1.3 : .6), duration * .83, {
      fm: 2.5, modRate: .193, cutoff: profile.formant * 1.4,
      delay: duration * .06, decay: warning ? 1.3 : 4.5, am: .7, pulse: profile.pulse * .51,
    }),
    noise(.38 + profile.wet * .2, profile.formant * (family === 'stalker' ? 1.7 : .7), duration * .75, {
      delay: duration * .04, attack: .018, decay: 3.5, am: .8, pulse: profile.pulse * .87,
    }),
    metal(.16, profile.formant * 1.7, Math.min(.12, duration * .4), { delay: duration * .09, decay: 6 }),
  ];
  if (family === 'spitter' && phase === 'attack') {
    // Air displaced by the launched bolus; wet throat onset stays underneath.
    layers.push(noise(.8, 3500, .31, { delay: .06, attack: .025, decay: 4.2 }));
  }
  if (profile.wet > .6) layers.push(tone(.32, 420, 120, duration * .65, {
    delay: duration * .12, fm: 6, modRate: .26, am: .9, pulse: 17, decay: 3,
  }));
  if (death) layers.push(noise(.35, 1000, duration * .35, { delay: duration * .5, decay: 5 }));
  const boss = family === 'champion' || family === 'warden' || family === 'matron' || family.startsWith('queen');
  return {
    id: `enemy:${family}${elite ? '-elite' : ''}:${phase}`, family: 'enemy', bus: 'enemies',
    duration, layers, priority: warning ? 77 : boss ? 76 : death ? 36 : 54,
    interval: warning ? .12 : death ? .12 : .16,
    rms: boss ? .10 : warning ? .075 : .085, peak: boss ? .55 : .48,
  };
}

const enemyRecipes = new Map<string, CueRecipe>();
for (const [family, profile] of Object.entries(vocals)) {
  for (const phase of ['warning', 'attack', 'death'] as const) {
    const recipe = vocalRecipe(family, profile, phase); enemyRecipes.set(recipe.id, recipe);
    if (['crawler', 'brute', 'spitter', 'stalker', 'carrier'].includes(family)) {
      const elite = vocalRecipe(family, profile, phase, true); enemyRecipes.set(elite.id, elite);
    }
  }
}

/** Complete original combat inventory; local licensed samples are layered by the director. */
export const COMBAT_RECIPES: readonly CueRecipe[] = Object.freeze([
  ...Object.values(weapons), ...Object.values(impacts), ...enemyRecipes.values(),
]);

/** Weapon signature independent of the recorded round-robin layer. */
export function weaponRecipe(id: WeaponCueId): CueRecipe { return weapons[id]; }

/** Confirmed contacts and physical Foley; no gameplay inference happens here. */
export function impactRecipe(kind: ImpactCueId): CueRecipe { return impacts[kind]; }

/** Native enemy family, champion identity or Queen phase; unknown spawn tells use crawler. */
export function enemyRecipe(family: string, phase: EnemyCuePhase, elite = false): CueRecipe {
  return enemyRecipes.get(`enemy:${family}${elite ? '-elite' : ''}:${phase}`)
    ?? enemyRecipes.get(`enemy:${family}:${phase}`)
    ?? enemyRecipes.get(`enemy:crawler:${phase}`)!;
}
