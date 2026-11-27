import type {DepthRenderer} from '../render/DepthRenderer';
import type {GraphicsTier} from '../render/FrameBudget';
import type {AudioSystem} from '../game/audio/AudioSystem';
import {loadAudioPreferences, saveAudioPreferences} from '../game/audio/preferences';
import {GRAPHICS_PRESETS, GRAPHICS_OPTION_CHOICES, type GraphicsOptions} from '../render/graphicsOptions';
import {getGraphicsOptions, playUiCue, setGraphicsOptions, setGraphicsTier} from './gameAdapter';
import {renderSettings} from './settingsView';

export const UI_STORAGE_KEY = 'containment.ui.v1';
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'> | null;
export type UiPreferences = Readonly<{
  version: 1;
  tier: GraphicsTier;
  graphics: GraphicsOptions;
  combatText: boolean;
  combatTextDensity?: 'full' | 'reduced';
  radar: boolean;
  hints?: boolean;
  masteryHints?: boolean;
  music: number;
  effects: number;
}>;
export type GameplayPreferences = Readonly<{combatText: boolean; combatTextDensity?: 'full' | 'reduced'; radar: boolean; hints?: boolean; masteryHints?: boolean}>;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const unit = (value: unknown, fallback: number, minimum = 0): number => typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= 1 ? value : fallback;

/** Derive union choices from both presets, with every supported shadow level. */
export function graphicsChoices(key: string): string[] {
  if (key in GRAPHICS_OPTION_CHOICES) return [...GRAPHICS_OPTION_CHOICES[key as keyof typeof GRAPHICS_OPTION_CHOICES]];
  return [...new Set(Object.values(GRAPHICS_PRESETS).map(preset => (preset as unknown as Record<string, unknown>)[key]).filter((value): value is string => typeof value === 'string'))];
}

/** Validate each known field independently; old, partial and corrupt saves stay usable. */
export function loadUiPreferences(storage: PreferenceStorage, defaultTier: GraphicsTier = 'high'): UiPreferences {
  let saved: Record<string, unknown> = {};
  try {
    const value: unknown = JSON.parse(storage?.getItem(UI_STORAGE_KEY) ?? 'null');
    if (record(value) && (value.version === undefined || value.version === 1)) saved = value;
  } catch { /* Storage may be blocked or contain incomplete data. */ }
  const tier = saved.tier === 'high' || saved.tier === 'low' ? saved.tier : defaultTier;
  const graphics = {...GRAPHICS_PRESETS[tier]} as unknown as Record<string, unknown>;
  if (record(saved.graphics)) {
    for (const [key, fallback] of Object.entries(graphics)) {
      const value = saved.graphics[key];
      if (typeof fallback === 'boolean') graphics[key] = typeof value === 'boolean' ? value : fallback;
      else if (typeof fallback === 'number') graphics[key] = unit(value, fallback, key === 'resolutionScale' ? .5 : 0);
      else if (typeof value === 'string' && graphicsChoices(key).includes(value)) graphics[key] = value;
    }
  }
  return {
    version: 1, tier, graphics: graphics as unknown as GraphicsOptions,
    combatText: typeof saved.combatText === 'boolean' ? saved.combatText : true,
    combatTextDensity: saved.combatTextDensity === 'reduced' ? 'reduced' : 'full',
    masteryHints: saved.masteryHints !== false,
    hints: typeof saved.hints === 'boolean' ? saved.hints : true,
    radar: typeof saved.radar === 'boolean' ? saved.radar : false,
    music: unit(saved.music, .38), effects: unit(saved.effects, .8),
  };
}

/** Persist only the versioned UI schema, leaving checkpoint and legacy audio keys intact. */
export function saveUiPreferences(storage: PreferenceStorage, preferences: UiPreferences): void {
  try { storage?.setItem(UI_STORAGE_KEY, JSON.stringify(preferences)); }
  catch { /* Preferences remain live when persistence is unavailable. */ }
}

/** Settings own preference state; rendering never replaces a focused native input. */
export function createSettings({renderer, audio, storage}: {renderer: DepthRenderer; audio: AudioSystem; storage: Storage | null}) {
  let state = loadUiPreferences(storage, renderer.qualityTier === 'low' ? 'low' : 'high');
  let sound = loadAudioPreferences(storage);
  let preferences: GameplayPreferences = Object.freeze({combatText: state.combatText, combatTextDensity: state.combatTextDensity, radar: state.radar, hints: state.hints, masteryHints: state.masteryHints});
  let root: HTMLElement | null = null;
  let media: MediaQueryList | null = null;
  let unbind = () => {};
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') media = window.matchMedia('(prefers-reduced-motion: reduce)');

  const effectiveGraphics = (): GraphicsOptions => {
    const options = {...getGraphicsOptions(renderer), ...state.graphics};
    return media?.matches ? {...options, screenShake: 0, flashIntensity: 0} : options;
  };
  const applyGraphics = () => setGraphicsOptions(renderer, effectiveGraphics());
  const applyAudio = () => {
    audio.setMasterVolume(sound.muted ? 0 : sound.master);
    audio.setMusicVolume(state.music);
    audio.setEffectsVolume(state.effects);
  };
  const persist = () => saveUiPreferences(storage, state);
  const sync = () => {
    if (!root) return;
    for (const input of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-setting]')) {
      const key = input.dataset.setting!;
      const value = key === 'tier' ? state.tier : key === 'master' ? sound.master : key.startsWith('graphics.') ? (state.graphics as unknown as Record<string, unknown>)[key.slice(9)] : (state as unknown as Record<string, unknown>)[key];
      if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = value === true;
      else input.value = typeof value === 'number' ? String(Math.round(value * 100)) : String(value);
      const output = root.querySelector<HTMLOutputElement>(`output[for="${input.id}"]`);
      if (output) {
        output.value = `${Math.round(Number(value) * 100)}%`;
        input.setAttribute('aria-valuetext', `${Math.round(Number(value) * 100)} percent${key === 'master' && sound.muted ? ', muted' : ''}`);
      }
    }
    const mute = root.querySelector<HTMLButtonElement>('#sound');
    if (mute) {mute.textContent = sound.muted ? 'Unmute' : 'Mute'; mute.setAttribute('aria-pressed', String(sound.muted));}
    const reduced = root.querySelector<HTMLElement>('[data-reduced-motion]');
    if (reduced) reduced.hidden = !media?.matches;
  };
  const onMotionChange = () => {applyGraphics(); sync();};
  media?.addEventListener?.('change', onMotionChange);

  const settings = {
    get quality(): GraphicsTier {return state.tier;},
    get preferences(): GameplayPreferences {return preferences;},
    /** Runtime values respect OS motion preferences without overwriting player choices. */
    get effectiveGraphicsOptions(): GraphicsOptions {return effectiveGraphics();},
    render(): string {return renderSettings({state, sound, reducedMotion: media?.matches ?? false});},
    apply(): void {
      setGraphicsTier(renderer, state.tier);
      applyGraphics();
      applyAudio();
    },
    bind(nextRoot: HTMLElement): void {
      unbind(); root = nextRoot;
      const onInput = (event: Event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement) || !input.dataset.setting) return;
        // Checkbox/select commit via change; ranges respond to every native drag/key step.
        if (event.type === 'input' && (!(input instanceof HTMLInputElement) || input.type !== 'range')) return;
        if (event.type === 'change' && input instanceof HTMLInputElement && input.type === 'range') return;
        const key = input.dataset.setting;
        if (key === 'tier') {
          if (input.value !== 'high' && input.value !== 'low') return;
          state = {...state, tier: input.value, graphics: {...GRAPHICS_PRESETS[input.value]}};
          setGraphicsTier(renderer, state.tier); applyGraphics(); persist();
        } else if (key === 'master') {
          const value = Number(input.value) / 100;
          if (!Number.isFinite(value) || value < 0 || value > 1) return;
          sound = {...sound, master: value}; applyAudio(); saveAudioPreferences(storage, sound);
        } else if (key === 'music' || key === 'effects') {
          const value = Number(input.value) / 100;
          if (!Number.isFinite(value) || value < 0 || value > 1) return;
          state = {...state, [key]: value}; applyAudio(); persist();
        } else if (key === 'combatTextDensity') {
          if (input.value !== 'full' && input.value !== 'reduced') return;
          state = {...state, combatTextDensity: input.value};
          preferences = Object.freeze({combatText: state.combatText, combatTextDensity: state.combatTextDensity, radar: state.radar, hints: state.hints, masteryHints: state.masteryHints}); persist();
        } else if (key === 'combatText' || key === 'radar' || key === 'hints' || key === 'masteryHints') {
          state = {...state, [key]: (input as HTMLInputElement).checked};
          preferences = Object.freeze({combatText: state.combatText, combatTextDensity: state.combatTextDensity, radar: state.radar, hints: state.hints, masteryHints: state.masteryHints}); persist();
        } else if (key.startsWith('graphics.')) {
          const option = key.slice(9);
          const previous = (state.graphics as unknown as Record<string, unknown>)[option];
          if (previous === undefined) return;
          const value = typeof previous === 'boolean' ? (input as HTMLInputElement).checked : typeof previous === 'number' ? Number(input.value) / 100 : input.value;
          if (typeof previous === 'number' && (typeof value !== 'number' || !Number.isFinite(value) || value < (option === 'resolutionScale' ? .5 : 0) || value > 1)) return;
          if (typeof previous === 'string' && !graphicsChoices(option).includes(String(value))) return;
          const graphics = {...state.graphics, [option]: value};
          if (option === 'resolutionScale') graphics.adaptiveResolution = false;
          if (option === 'adaptiveResolution' && value === true) graphics.resolutionScale = 1;
          state = {...state, graphics};
          applyGraphics(); persist();
        }
        sync();
        playUiCue(audio, input instanceof HTMLInputElement && input.type === 'range' ? 'slider' : input instanceof HTMLInputElement && input.type === 'checkbox' ? 'toggle' : 'select');
      };
      const onClick = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest('#sound')) {
          sound = {...sound, muted: !sound.muted}; applyAudio(); saveAudioPreferences(storage, sound); sync();
          void audio.unlock();
          playUiCue(audio, 'toggle');
        }
      };
      nextRoot.addEventListener('input', onInput);
      nextRoot.addEventListener('change', onInput);
      nextRoot.addEventListener('click', onClick);
      unbind = () => {
        nextRoot.removeEventListener('input', onInput);
        nextRoot.removeEventListener('change', onInput);
        nextRoot.removeEventListener('click', onClick);
      };
      sync();
    },
    dispose(): void {unbind(); root = null; media?.removeEventListener?.('change', onMotionChange);},
  };
  return settings;
}

export type Settings = ReturnType<typeof createSettings>;
