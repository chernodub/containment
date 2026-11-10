/**
 * Player-facing graphics options — shared contract between the renderer (applies them) and the UI (edits/persists them).
 *
 * Types and presets only; no Three.js or DOM imports. The existing two quality tiers stay the primary switch:
 * choosing a tier loads its preset, then individual options may be overridden.
 * Owner: the render-pipeline stream (may add options); the UI stream reads this file and must render any
 * option it does not know generically (boolean → toggle, number → slider, union → select).
 */
import type { GraphicsTier } from './FrameBudget';

export type ShadowQuality = 'off' | 'low' | 'high';

export type GraphicsOptions = Readonly<{
  /** HDR bloom on hot emissives. */
  bloom: boolean;
  /** Screen-space ambient occlusion. */
  ambientOcclusion: boolean;
  /** Vignette, chromatic fringe and film grain. Color grading itself is always on. */
  lensEffects: boolean;
  /** Screen-space refraction for shockwaves and heat haze. */
  distortion: boolean;
  /** Ambient particles, fog sheets and light shafts. */
  atmosphere: boolean;
  /** Pooled dynamic lights from muzzle flashes, explosions, projectiles and status effects. */
  dynamicLights: boolean;
  shadows: ShadowQuality;
  /** Internal resolution multiplier, 0.5–1. */
  resolutionScale: number;
  /** Camera shake / kick / zoom-punch strength, 0–1. 0 disables camera motion effects entirely. */
  screenShake: number;
  /** Strength of full-screen and hit flashes, 0–1 (photosensitivity). */
  flashIntensity: number;
}>;

export const GRAPHICS_PRESETS: Readonly<Record<GraphicsTier, GraphicsOptions>> = Object.freeze({
  high: Object.freeze({
    bloom: true, ambientOcclusion: true, lensEffects: true, distortion: true, atmosphere: true, dynamicLights: true,
    shadows: 'high', resolutionScale: 1, screenShake: 1, flashIntensity: 1,
  }),
  low: Object.freeze({
    bloom: false, ambientOcclusion: false, lensEffects: false, distortion: false, atmosphere: false, dynamicLights: false,
    shadows: 'off', resolutionScale: 1, screenShake: 1, flashIntensity: 1,
  }),
});

/** Metadata so the settings UI can label options without hard-coding copy next to the renderer. */
export const GRAPHICS_OPTION_LABELS: Readonly<Record<keyof GraphicsOptions, Readonly<{ label: string; hint: string }>>> = Object.freeze({
  bloom: { label: 'Bloom', hint: 'Glow on bright lights and energy effects.' },
  ambientOcclusion: { label: 'Ambient occlusion', hint: 'Soft contact shading that grounds objects.' },
  lensEffects: { label: 'Lens effects', hint: 'Vignette, chromatic fringe and film grain.' },
  distortion: { label: 'Shockwave distortion', hint: 'Heat haze and blast refraction.' },
  atmosphere: { label: 'Atmosphere', hint: 'Dust, mist, embers and light shafts.' },
  dynamicLights: { label: 'Dynamic lights', hint: 'Weapons and effects light the room.' },
  shadows: { label: 'Shadows', hint: 'Shadow quality.' },
  resolutionScale: { label: 'Render scale', hint: 'Lower values trade sharpness for speed.' },
  screenShake: { label: 'Screen shake', hint: 'Camera shake, recoil and zoom punch.' },
  flashIntensity: { label: 'Flash intensity', hint: 'Brightness of hit and explosion flashes.' },
});
