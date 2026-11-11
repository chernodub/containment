import {GRAPHICS_OPTION_LABELS} from '../render/graphicsOptions';
import type {AudioPreferences} from '../game/audio/preferences';
import type {UiPreferences} from './settings';
import {graphicsChoices} from './settings';
import './styles/settings.css';

const escape = (text: string): string => text.replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]!));
const percent = (value: number) => `${Math.round(value * 100)}%`;
function range(key: string, label: string, hint: string, value: number, minimum = 0, id = `setting-${key.replace('.', '-')}`): string {
  return `<div class="settings-control settings-control--range"><div class="settings-control__copy"><label for="${id}">${escape(label)}</label><span id="${id}-hint">${escape(hint)}</span></div><div class="settings-range"><input id="${id}" data-setting="${key}" type="range" min="${minimum}" max="100" step="1" value="${Math.round(value * 100)}" aria-label="${escape(label)}" aria-describedby="${id}-hint"><output ${key === 'master' ? 'id="volume-value" ' : ''}for="${id}">${percent(value)}</output></div></div>`;
}
function toggle(key: string, label: string, hint: string, value: boolean): string {
  const id = `setting-${key.replace('.', '-')}`;
  return `<label class="settings-control settings-control--toggle" for="${id}"><span class="settings-control__copy"><span>${escape(label)}</span><span id="${id}-hint">${escape(hint)}</span></span><span class="settings-toggle"><input id="${id}" data-setting="${key}" type="checkbox" aria-label="${escape(label)}"${value ? ' checked' : ''} aria-describedby="${id}-hint"><span class="settings-toggle__track" aria-hidden="true"></span></span></label>`;
}
function graphicsControl(key: string, value: unknown): string {
  const metadata = (GRAPHICS_OPTION_LABELS as unknown as Record<string, {label: string; hint: string}>)[key];
  const label = metadata?.label ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
  const hint = metadata?.hint ?? 'Adjust this rendering effect.';
  if (typeof value === 'boolean') return toggle(`graphics.${key}`, label, hint, value);
  if (typeof value === 'number') return range(`graphics.${key}`, label, hint, value, key === 'resolutionScale' ? 50 : 0);
  const id = `setting-graphics-${key}`;
  return `<div class="settings-control"><div class="settings-control__copy"><label for="${id}">${escape(label)}</label><span id="${id}-hint">${escape(hint)}</span></div><select id="${id}" data-setting="graphics.${key}" aria-describedby="${id}-hint">${graphicsChoices(key).map(choice => `<option value="${escape(choice)}"${choice === value ? ' selected' : ''}>${escape(choice.charAt(0).toUpperCase() + choice.slice(1))}</option>`).join('')}</select></div>`;
}

/** Every graphics contract field remains a native labelled control in a compact two-column console. */
export function renderSettings({state, sound, reducedMotion}: {state: UiPreferences; sound: AudioPreferences; reducedMotion: boolean}): string {
  const graphics = Object.entries(state.graphics);
  const quality = new Set(['shadows','resolutionScale']);
  const comfort = new Set(['screenShake','flashIntensity']);
  return `<div class="system-settings" data-ui-settings><div class="settings-layout"><div class="settings-primary">
    <section class="settings-section" aria-labelledby="settings-graphics-heading"><div class="settings-section__heading"><h3 id="settings-graphics-heading">Quality</h3><span>Display systems</span></div><div class="quality-controls"><div class="settings-control"><div class="settings-control__copy"><label for="quality">Quality preset</label><span id="quality-hint">Changing preset resets rendering options.</span></div><select id="quality" data-setting="tier" aria-describedby="quality-hint"><option value="high"${state.tier === 'high' ? ' selected' : ''}>High</option><option value="low"${state.tier === 'low' ? ' selected' : ''}>Low</option></select></div>${graphics.filter(([key])=>quality.has(key)).map(([key,value])=>graphicsControl(key,value)).join('')}</div></section>
    <section class="settings-section" aria-labelledby="settings-effects-heading"><div class="settings-section__heading"><h3 id="settings-effects-heading">Effects</h3><span>Rendering layers</span></div><div class="effects-controls">${graphics.filter(([key])=>!quality.has(key)&&!comfort.has(key)).map(([key,value])=>graphicsControl(key,value)).join('')}</div></section>
    </div><div class="settings-secondary"><section class="settings-section" aria-labelledby="settings-accessibility-heading"><div class="settings-section__heading"><h3 id="settings-accessibility-heading">Comfort</h3><span>Combat readability</span></div><p class="settings-motion-note" data-reduced-motion${reducedMotion ? '' : ' hidden'}>Reduced motion is active. Camera motion and flashes are disabled; your preferred values are preserved.</p>${graphics.filter(([key])=>comfort.has(key)).map(([key,value])=>graphicsControl(key,value)).join('')}<div class="comfort-toggles">${toggle('combatText','Combat text','Damage numbers and status callouts.',state.combatText)}${toggle('radar','Threat radar','Compact tactical room display.',state.radar)}</div></section>
    <section class="settings-section settings-section--audio" aria-labelledby="settings-audio-heading"><div class="settings-section__heading"><h3 id="settings-audio-heading">Audio</h3><span>Shipboard mix</span></div><div class="settings-master">${range('master','Master volume','Overall sound level.',sound.master,0,'master-volume')}<button id="sound" type="button" class="settings-mute" aria-label="Mute sound" aria-pressed="${sound.muted}">${sound.muted?'Unmute':'Mute'}</button></div><div class="audio-channels">${range('music','Music','Ambient score and combat tension.',state.music)}${range('effects','Sound effects','Weapons, abilities and ship systems.',state.effects)}</div></section></div></div><a class="settings-credits" href="${import.meta.env.BASE_URL}audio-credits.html" target="_blank" rel="noopener">Audio Credits <span aria-hidden="true">↗</span></a></div>`;
}
