import type { ShipEnvironment } from '../ShipEnvironments';

type RGB = readonly [number, number, number];
type DirectionalMood = Readonly<{ color: number; intensity: number; offset: RGB }>;
export type PracticalBehavior = 'steady' | 'flicker' | 'alarm' | 'pulse' | 'reactor';

/** Shared color script for lighting, atmospheric layers and the final composite. */
export type EnvironmentMood = Readonly<{
  environment: ShipEnvironment;
  ambient: Readonly<{ sky: number; ground: number; intensity: number }>;
  key: DirectionalMood;
  fill: DirectionalMood;
  rim: DirectionalMood;
  fog: Readonly<{ color: number; density: number; height: number }>;
  grade: Readonly<{ exposure: number; saturation: number; contrast: number; lift: RGB; gain: RGB; shadowTint: number; highlightTint: number }>;
  practical: Readonly<{ color: number; intensity: number; distance: number; behavior: PracticalBehavior }>;
  floorRoughness: number;
  reflectionIntensity: number;
}>;

function mood(environment: ShipEnvironment, key: number, accent: number, behavior: PracticalBehavior, fog: number,
  exposure: number, saturation: number, roughness: number, ambient = .8, practical = 12): EnvironmentMood {
  return Object.freeze({
    environment,
    ambient: Object.freeze({ sky: 0xc1cbd2, ground: 0x687078, intensity: ambient }),
    key: Object.freeze({ color: key, intensity: 3.2, offset: [-16, 14, 10] as RGB }),
    fill: Object.freeze({ color: 0xb9c8d8, intensity: .8, offset: [8, 10, -12] as RGB }),
    rim: Object.freeze({ color: accent, intensity: .7, offset: [5, 6, -9] as RGB }),
    fog: Object.freeze({ color: fog, density: environment === 'cryogenics' ? .024 : environment === 'infested' ? .021 : .012, height: environment === 'cryogenics' ? 1.1 : 2.1 }),
    grade: Object.freeze({ exposure, saturation, contrast: 1.015, lift: [.008, .009, .011] as RGB, gain: [1.025, 1.025, 1.025] as RGB, shadowTint: 0xa0acb5, highlightTint: 0xe9e7e3 }),
    practical: Object.freeze({ color: accent, intensity: practical, distance: 5.8, behavior }),
    floorRoughness: roughness,
    reflectionIntensity: environment === 'maintenance' ? .65 : .38,
  });
}

function artMood(base: EnvironmentMood, overrides: Partial<EnvironmentMood>): EnvironmentMood {
  return Object.freeze({ ...base, ...overrides });
}


/** Low broad illumination leaves room for motivated colored practicals and stable cast shadows. */
function localMood(environment: ShipEnvironment, keyColor: number, accent: number, behavior: PracticalBehavior,
  fog: number, roughness: number, ambient: number, key: number, fill: number, rim: number,
  practical: number, distance: number, keyHeight: number, sky: number, fillColor = 0x92b2d3): EnvironmentMood {
  return artMood(mood(environment,keyColor,accent,behavior,fog,1.06,.97,roughness,ambient,practical), {
    ambient: Object.freeze({ sky, ground: 0x303c4c, intensity: ambient }),
    key: Object.freeze({ color: keyColor, intensity: key, offset: [-16,keyHeight,10] as RGB }),
    fill: Object.freeze({ color: fillColor, intensity: fill, offset: [8,10,-12] as RGB }),
    rim: Object.freeze({ color: accent, intensity: rim, offset: [5,6,-9] as RGB }),
    practical: Object.freeze({ color: accent, intensity: practical, distance, behavior }),
    grade: Object.freeze({ exposure: 1.06, saturation: .97, contrast: 1.025,
      lift: [.0002,.00035,.0005] as RGB, gain: [1,1,1] as RGB, shadowTint: 0x8e9eb2, highlightTint: 0xe9e7e3 }),
  });
}

/** All ten ship environments have a distinct, authored lighting and grading palette. */
export const ENVIRONMENT_MOODS: Readonly<Record<ShipEnvironment, EnvironmentMood>> = Object.freeze({
  cryogenics: localMood('cryogenics',0xd9efff,0x86dcff,'steady',0x8397a2,.86,.10,1.25,.24,.28,100,8,10,0x839db6),
  habitation: localMood('habitation',0xffe0bc,0xffb968,'flicker',0x8b8580,.91,.12,1.6,.29,.28,115,8.8,9,0x7b8fa8),
  security: localMood('security',0xf1f4ff,0xff513d,'alarm',0x6c7888,.82,.12,1.8,.34,.25,240,7.2,12,0x7c91a9),
  cargo: localMood('cargo',0xffd398,0xffa54d,'steady',0x8b8375,.94,.08,1.65,.28,.28,250,9.6,8,0x8293a7),
  communications: localMood('communications',0xbddfe9,0x58e4bc,'flicker',0x687b87,.86,.14,1.5,.32,.30,240,8,10,0x769ba8),
  engineering: localMood('engineering',0xffe2a9,0xffbb47,'flicker',0x8b8374,.88,.08,1.7,.29,.28,260,8.8,9,0x85949f),
  maintenance: localMood('maintenance',0xc0e0d6,0x73d7af,'flicker',0x6f8981,.28,.14,1.5,.28,.30,220,8,9,0x789d99),
  infested: artMood(localMood('infested',0xb7d7b0,0xa8ff72,'pulse',0x768579,.9,.10,1.4,.26,.35,210,8.4,8,0x718a86),{rim:Object.freeze({color:0xe26acf,intensity:.35,offset:[6,6,-9] as RGB})}),
  containment: localMood('containment',0xe4ebff,0xb99bff,'pulse',0x818594,.82,.16,1.65,.30,.32,230,8.4,11,0x8a94b1),
  reactor: artMood(mood('reactor', 0xffe0bc, 0xff8a39, 'reactor', 0x596675, 1.06, .97, .85, .24, 18), {
    ambient: Object.freeze({ sky: 0x8294aa, ground: 0x303c4c, intensity: .08 }),
    key: Object.freeze({ color: 0xffa14b, intensity: 1.7, offset: [0, 3.2, 0] as RGB }),
    fill: Object.freeze({ color: 0x92b2d3, intensity: .29, offset: [8, 10, -12] as RGB }),
    rim: Object.freeze({ color: 0xff4936, intensity: .18, offset: [5, 5, -9] as RGB }),
    grade: Object.freeze({ exposure: 1.06, saturation: .97, contrast: 1.025, lift: [.0002, .00035, .0005] as RGB, gain: [1, 1, 1] as RGB, shadowTint: 0x8e9eb2, highlightTint: 0xe9e7e3 }),
  }),
});

/** Resolve a mood without allocating; legacy rooms use the ship's cold base palette. */
export function getEnvironmentMood(environment: ShipEnvironment = 'cryogenics'): EnvironmentMood {
  return ENVIRONMENT_MOODS[environment];
}
export const environmentMood = getEnvironmentMood;
