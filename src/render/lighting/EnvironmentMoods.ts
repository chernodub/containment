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

/** All ten ship environments have a distinct, authored lighting and grading palette. */
export const ENVIRONMENT_MOODS: Readonly<Record<ShipEnvironment, EnvironmentMood>> = Object.freeze({
  cryogenics: mood('cryogenics', 0xe4f0f8, 0x86dcff, 'steady', 0x8397a2, 1.14, .96, .86, .8, 12),
  habitation: artMood(mood('habitation', 0xffecdb, 0xffb968, 'flicker', 0x8b8580, 1.14, .97, .91, .8, 18), {
    fill: Object.freeze({ color: 0xc1cbd5, intensity: .9, offset: [8, 10, -12] as RGB }),
  }),
  security: artMood(mood('security', 0xf1f4ff, 0xff513d, 'alarm', 0x6c7888, 1.12, .95, .82, .8, 18), {
    key: Object.freeze({ color: 0xf1f4ff, intensity: 3.5, offset: [-16, 14, 10] as RGB }),
  }),
  cargo: mood('cargo', 0xffe6c7, 0xffa54d, 'steady', 0x8b8375, 1.16, .96, .94, .82, 16),
  communications: mood('communications', 0xd6e7ee, 0x58e4bc, 'flicker', 0x687b87, 1.17, .96, .86, .82, 12),
  engineering: mood('engineering', 0xffebcd, 0xffbb47, 'flicker', 0x8b8374, 1.15, .97, .88, .8, 15),
  maintenance: mood('maintenance', 0xdcebe5, 0x73d7af, 'flicker', 0x6f8981, 1.16, .95, .28, .82, 12),
  infested: artMood(mood('infested', 0xc9ded0, 0xa8ff72, 'pulse', 0x768579, 1.18, .97, .9, .82, 13), {
    // Neutral moonlight keeps yellow safety paint and enemy silhouettes readable between organic pools.
    key: Object.freeze({ color: 0xc9ded0, intensity: 3.2, offset: [-14, 10, 9] as RGB }),
    fill: Object.freeze({ color: 0xc1cbdc, intensity: 1, offset: [8, 7, -12] as RGB }),
    rim: Object.freeze({ color: 0xe26acf, intensity: 1.6, offset: [6, 6, -9] as RGB }),
  }),
  containment: mood('containment', 0xebf1ff, 0xb99bff, 'pulse', 0x818594, 1.13, .95, .82, .8, 13),
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
