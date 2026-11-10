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
  exposure: number, saturation: number, roughness: number, ambient = .52, practical = 12): EnvironmentMood {
  return Object.freeze({
    environment,
    ambient: Object.freeze({ sky: 0x9aaebc, ground: 0x28353c, intensity: ambient }),
    key: Object.freeze({ color: key, intensity: 2.65, offset: [-16, 14, 10] as RGB }),
    fill: Object.freeze({ color: 0x718eaa, intensity: .3, offset: [8, 10, -12] as RGB }),
    rim: Object.freeze({ color: accent, intensity: .7, offset: [5, 6, -9] as RGB }),
    fog: Object.freeze({ color: fog, density: environment === 'cryogenics' ? .024 : environment === 'infested' ? .021 : .012, height: environment === 'cryogenics' ? 1.1 : 2.1 }),
    grade: Object.freeze({ exposure, saturation, contrast: 1.055, lift: [.004, .008, .012] as RGB, gain: [1.025, 1.015, 1] as RGB, shadowTint: 0x698c9a, highlightTint: key }),
    practical: Object.freeze({ color: accent, intensity: practical, distance: 5.8, behavior }),
    floorRoughness: roughness,
    reflectionIntensity: environment === 'maintenance' ? .65 : .38,
  });
}

/** All ten ship environments have a distinct, authored lighting and grading palette. */
export const ENVIRONMENT_MOODS: Readonly<Record<ShipEnvironment, EnvironmentMood>> = Object.freeze({
  cryogenics: mood('cryogenics', 0xd8f3ff, 0x86dcff, 'steady', 0x789fae, 1.04, .88, .86, .56, 12),
  habitation: mood('habitation', 0xffe5c2, 0xffb968, 'flicker', 0x5d717c, 1.02, .9, .91, .5, 15),
  security: mood('security', 0xf1f4ff, 0xff513d, 'alarm', 0x344b62, .99, .83, .82, .46, 13),
  cargo: mood('cargo', 0xffd39b, 0xffa54d, 'steady', 0x766b57, 1.02, .86, .94, .48, 16),
  communications: mood('communications', 0x9adce8, 0x58e4bc, 'flicker', 0x274f62, 1.04, .9, .86, .49, 12),
  engineering: mood('engineering', 0xffdf9c, 0xffbb47, 'flicker', 0x807258, 1, .89, .88, .5, 15),
  maintenance: mood('maintenance', 0xb4e4d2, 0x73d7af, 'flicker', 0x487b72, 1.03, .82, .28, .51, 12),
  infested: mood('infested', 0xa6d2b7, 0xa8ff72, 'pulse', 0x51664f, 1.06, .92, .9, .48, 10),
  containment: mood('containment', 0xebf1ff, 0xb99bff, 'pulse', 0x656b94, 1.01, .85, .82, .54, 13),
  reactor: mood('reactor', 0xffddb6, 0xff8a39, 'reactor', 0x98603d, .98, .93, .85, .5, 20),
});

/** Resolve a mood without allocating; legacy rooms use the ship's cold base palette. */
export function getEnvironmentMood(environment: ShipEnvironment = 'cryogenics'): EnvironmentMood {
  return ENVIRONMENT_MOODS[environment];
}
export const environmentMood = getEnvironmentMood;
