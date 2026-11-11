import { AUDIO_RECIPES, AudioSystem } from '../../src/game/audio/AudioSystem';
import { AUDIO_BUSES, MixEngine } from '../../src/game/audio/MixEngine';
import { SYNTH_SAMPLE_RATE, synthesize } from '../../src/game/audio/synthesis';
import { ABILITY_CATALOG } from '../../src/game/abilities/catalog';
import type { AbilityEventPhase, AbilityId } from '../../src/game/abilities/contract';
import type { AudioEnvironment, UiCue } from '../../src/game/audio/contract';
import { ENVIRONMENT_PROFILES } from '../../src/game/audio/environmentCues';
import { UI_RECIPES } from '../../src/game/audio/uiCues';

if (!import.meta.env.DEV) throw new Error('Audio audition is a Vite development entry only.');
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let context: AudioContext | null = null, audio: AudioSystem | null = null, mixer: MixEngine | null = null;
const buffers = new Map<string, AudioBuffer>();
const volume = { master: .3, music: .65, effects: .8 };
const status = (message: string) => { el('status').textContent = message; };
const ready = () => {
  if (audio && mixer && context?.state === 'running') return true;
  status('Enable audio first.'); return false;
};
const option = (select: HTMLSelectElement, value: string) => { const node = document.createElement('option'); node.value = value; node.textContent = value; select.append(node); };
const button = (id: string, action: () => void) => el(id).addEventListener('click', action);
const phases: AbilityEventPhase[] = ['cast', 'impact', 'tick', 'end', 'burst', 'link', 'dash-start', 'dash-end', 'denied', 'ready', 'overdrive-ready'];
for (const id of Object.keys(ABILITY_CATALOG)) option(el('ability'), id);
for (const phase of phases) option(el('phase'), phase);
for (const cue of UI_RECIPES) option(el('ui'), cue.id.replace(/^ui:/, ''));
for (const environment of Object.keys(ENVIRONMENT_PROFILES)) option(el('environment'), environment);

for (const name of ['master', 'music', 'effects'] as const) {
  const label = document.createElement('label'), slider = document.createElement('input'), output = document.createElement('output');
  label.textContent = `${name} `; slider.type = 'range'; slider.min = '0'; slider.max = '1'; slider.step = '.01'; slider.value = String(volume[name]); output.textContent = slider.value;
  slider.addEventListener('input', () => { volume[name] = Number(slider.value); output.textContent = slider.value; audio?.setVolumes(volume); mixer?.setVolumes(volume); });
  label.append(slider, output); el('volumes').append(label);
}
for (const bus of AUDIO_BUSES) {
  const label = document.createElement('label'), slider = document.createElement('input'); label.textContent = `${bus} `;
  slider.type = 'range'; slider.min = '0'; slider.max = '1'; slider.step = '.01'; slider.value = '1';
  slider.addEventListener('input', () => { audio?.setBusVolume(bus, Number(slider.value)); mixer?.setBusVolume(bus, Number(slider.value)); });
  label.append(slider); el('buses').append(label);
}
button('unlock', () => {
  if (!context) { context = new AudioContext(); audio = new AudioSystem(volume, { context }); mixer = new MixEngine(context, volume); }
  void context.resume().then(() => audio!.unlock()).then(ok => status(ok ? `Audio ready. ${AUDIO_RECIPES.length} recipes; production director unlocked.` : 'Audio could not be unlocked.'));
});
button('pause', () => { audio?.pauseAll(); mixer?.stopAll(); status('Paused. Ability and audition loops stopped.'); });
button('resume', () => { audio?.resumeAll(); status('Resumed. Ability loops require new authoritative events.'); });
button('stop', () => { audio?.pauseAll(); audio?.setEnvironment(null); mixer?.stopAll(); audio?.resumeAll(); audio?.pauseMusic(); status('Stopped all sources.'); });
button('ability-play', () => {
  if (!ready()) return;
  const id = el<HTMLSelectElement>('ability').value as AbilityId, definition = ABILITY_CATALOG[id], phase = el<HTMLSelectElement>('phase').value as AbilityEventPhase;
  audio!.handleEffect({ type: 'ability', x: 0, y: 0, ability: { ability: id, phase, rig: definition.rig, slot: definition.slot, element: definition.element, entityId: 1, durationMs: phase === 'cast' ? definition.castMs : definition.durationMs } }, { x: 0, y: 0 });
  status(`Director: ${id} / ${phase}\n${JSON.stringify(audio!.diagnostics)}`);
});
button('ui-play', () => { if (ready()) audio!.playUi(el<HTMLSelectElement>('ui').value as UiCue); });
button('environment-play', () => { if (ready()) audio!.setEnvironment((el<HTMLSelectElement>('environment').value || null) as AudioEnvironment | null); });
button('weapon-play', () => { if (ready()) audio!.handleEffect({ type: 'shot', weapon: el<HTMLSelectElement>('weapon').value as 'pistol', x: 0, y: 0 }, { x: 0, y: 0 }); });
button('explosion', () => { if (ready()) audio!.handleEffect({ type: 'explosion', radius: 240, x: 0, y: 0 }, { x: 0, y: 0 }); });
for (const cue of ['freeze', 'shatter', 'reactor'] as const) button(cue, () => { if (ready()) audio!.playElemental(cue); });
const combat = () => audio?.setCombatState({
  intensity: Number(el<HTMLInputElement>('intensity').value), danger: Number(el<HTMLInputElement>('danger').value),
  boss: el<HTMLInputElement>('boss').checked, overdrive: el<HTMLInputElement>('overdrive').checked,
  hostileTimeScale: el<HTMLInputElement>('slow').checked ? .3 : 1, paused: false,
});
for (const id of ['intensity', 'danger', 'boss', 'overdrive', 'slow']) el(id).addEventListener('input', combat);

for (const recipe of AUDIO_RECIPES) {
  const node = document.createElement('button'); node.textContent = recipe.id;
  node.dataset.cue = recipe.id; const detail = document.createElement('small'); detail.textContent = `${recipe.family} · ${recipe.duration.toFixed(2)}s · ${recipe.layers.length} layers${recipe.loop ? ' · loop' : ''}`; node.append(detail);
  node.addEventListener('click', () => {
    if (!ready()) return;
    audio!.pauseMusic();
    let buffer = buffers.get(recipe.id);
    if (!buffer) { const pcm = synthesize(recipe); buffer = context!.createBuffer(1, pcm.length, SYNTH_SAMPLE_RATE); buffer.getChannelData(0).set(pcm); buffers.set(recipe.id, buffer); }
    mixer!.play(buffer, { bus: recipe.bus, priority: 70, loop: recipe.loop });
    status(`Recipe: ${recipe.id}\n${recipe.layers.length} original layers / ${recipe.duration.toFixed(3)}s / ${recipe.bus} bus\nDirector ${JSON.stringify(audio!.diagnostics)}`);
  });
  el('recipes').append(node);
}
el<HTMLInputElement>('filter').addEventListener('input', event => {
  const query = (event.target as HTMLInputElement).value.toLowerCase();
  for (const node of el('recipes').querySelectorAll<HTMLButtonElement>('button')) node.hidden = !node.dataset.cue!.includes(query);
});
window.addEventListener('pagehide', () => { audio?.destroy(); mixer?.destroy(); });
