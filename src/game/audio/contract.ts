/**
 * Audio direction contract — shared by the audio stream (implements it on AudioSystem) and the UI/application
 * layer (calls it). Types only. Design source: docs/nextgen/streams/S2-audio.md.
 *
 * The application forwards every simulation effect to `handleEffect` and pushes coarse state through
 * `setCombatState` / `setEnvironment`; the audio layer decides what, if anything, to play. UI code plays
 * interface sounds through `playUi`. Nothing here may influence gameplay.
 */
import type { GameEffect } from '../../DepthGame';

/** Interface and presentation-beat sounds. */
export type UiCue =
  | 'hover' | 'select' | 'confirm' | 'back' | 'denied' | 'tab' | 'toggle' | 'slider'
  | 'draft-reveal' | 'boon-acquired' | 'rig-equip' | 'reroll' | 'purchase'
  | 'room-enter' | 'room-clear' | 'boss-intro' | 'overdrive-ready' | 'ability-ready'
  | 'low-health' | 'death' | 'victory' | 'checkpoint';

/** One of the ten ship environments (see 00-VISION §3); drives ambience and reverb character. */
export type AudioEnvironment =
  | 'cryogenics' | 'habitation' | 'security' | 'cargo' | 'communications'
  | 'engineering' | 'maintenance' | 'infested' | 'containment' | 'reactor';

export type AudioCombatState = Readonly<{
  /** 0 calm … 1 peak combat. */
  intensity: number;
  boss: boolean;
  /** An Overdrive is currently active. */
  overdrive: boolean;
  /** 0 healthy … 1 about to die. */
  danger: number;
  /** 1 normally; < 1 while Overclock slows hostile time (drives a time-dilation mix treatment). */
  hostileTimeScale: number;
  paused: boolean;
}>;

export type AudioListener = Readonly<{ x: number; y: number }>;

export interface GameAudioDirector {
  /** Route any simulation effect (shots, hits, explosions, statuses, boons, abilities, pickups, deaths) to sound. */
  handleEffect(effect: GameEffect, listener: AudioListener): void;
  playUi(cue: UiCue): void;
  setEnvironment(environment: AudioEnvironment | null): void;
  setCombatState(state: AudioCombatState): void;
}
