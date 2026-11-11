import { describe, expect, it, vi } from 'vitest';
import { AudioSystem } from '../src/game/audio/AudioSystem';
import { ABILITY_CATALOG } from '../src/game/abilities/catalog';
import type { AbilityEvent, AbilityEventPhase, AbilityId } from '../src/game/abilities/contract';
import type { AudioCombatState } from '../src/game/audio/contract';
import { UI_CUES } from '../src/game/audio/uiCues';
import { enemyRecipe } from '../src/game/audio/combatCues';
import { synthesize } from '../src/game/audio/synthesis';
import { FakeAudioContext } from './audioFake';

const state = (patch: Partial<AudioCombatState> = {}): AudioCombatState => ({ intensity: .5, boss: false, overdrive: false, danger: 0, hostileTimeScale: 1, paused: false, ...patch });
const event = (id: AbilityId, phase: AbilityEventPhase, entityId?: number): AbilityEvent => ({
  ability: id, phase, slot: ABILITY_CATALOG[id].slot, rig: ABILITY_CATALOG[id].rig,
  element: ABILITY_CATALOG[id].element, durationMs: 6000, entityId,
});
const listener = { x: 0, y: 0 };
async function setup(volumes = { master: 1, music: .38, effects: .8 }) {
  const clock = new FakeAudioContext();
  const audio = new AudioSystem(volumes, { context: clock.asContext(), loadSamples: false, prewarm: false });
  expect(await audio.unlock()).toBe(true);
  return { audio, clock };
}
function emit(audio: AudioSystem, ability: AbilityEvent) { audio.handleEffect({ type: 'ability', ability, x: 80, y: 0 }, listener); }

describe('audio director', () => {
  it('schedules every phase of all sixteen abilities and every UiCue', async () => {
    const { audio, clock } = await setup();
    const phases: AbilityEventPhase[] = ['cast', 'impact', 'tick', 'end', 'burst', 'link', 'dash-start', 'dash-end', 'denied', 'ready', 'overdrive-ready'];
    for (const id of Object.keys(ABILITY_CATALOG) as AbilityId[]) {
      for (const phase of phases) {
        const before = audio.diagnostics.admitted;
        emit(audio, event(id, phase, 5));
        expect(audio.diagnostics.admitted, `${id}:${phase}`).toBeGreaterThan(before);
        clock.advance(7);
      }
    }
    for (const cue of UI_CUES) {
      const before = audio.diagnostics.admitted; audio.playUi(cue);
      expect(audio.diagnostics.admitted, cue).toBeGreaterThan(before); clock.advance(2);
    }
    audio.destroy();
  });
  it('starts entity loops once from the initial tick and stops the exact entity on end/burst', async () => {
    const { audio, clock } = await setup();
    emit(audio, event('tesla-pylon', 'tick', 1)); emit(audio, event('tesla-pylon', 'impact'));
    expect(audio.diagnostics.loops).toBe(1);
    clock.advance(.5); emit(audio, { ...event('tesla-pylon', 'tick', 1), durationMs: undefined });
    expect(audio.diagnostics.loops).toBe(1);
    emit(audio, event('tesla-pylon', 'tick', 2)); expect(audio.diagnostics.loops).toBe(2);
    emit(audio, event('tesla-pylon', 'end', 1)); expect(audio.diagnostics.loops).toBe(1);
    emit(audio, event('tesla-pylon', 'burst', 2)); expect(audio.diagnostics.loops).toBe(0);
    emit(audio, event('overclock', 'impact')); expect(audio.diagnostics.loops).toBe(1);
    clock.advance(6.2); expect(audio.diagnostics.loops).toBe(0); audio.destroy();
  });
  it('restores paused fields only when a fresh authoritative entity tick arrives', async () => {
    const { audio, clock } = await setup();
    emit(audio, event('whiteout', 'tick', 8)); audio.pauseAll(); clock.advance(.03); audio.resumeAll();
    expect(audio.diagnostics.loops).toBe(0);
    emit(audio, { ...event('whiteout', 'tick', 8), durationMs: undefined });
    expect(audio.diagnostics.loops).toBe(1);
    emit(audio, event('whiteout', 'end', 8)); expect(audio.diagnostics.loops).toBe(0); audio.destroy();
  });
  it.each(['pause', 'room', 'death', 'context', 'mute', 'effects-zero', 'destroy'] as const)('force-stops loops on %s', async lifecycle => {
    const { audio, clock } = await setup();
    emit(audio, event('whiteout', 'tick', 1)); expect(audio.diagnostics.loops).toBe(1);
    if (lifecycle === 'pause') audio.pauseAll();
    if (lifecycle === 'room') audio.setEnvironment('cargo');
    if (lifecycle === 'death') audio.syncCombat({ dead: true } as any);
    if (lifecycle === 'context') clock.setState('suspended');
    if (lifecycle === 'mute') audio.setMasterVolume(0);
    if (lifecycle === 'effects-zero') audio.setEffectsVolume(0);
    if (lifecycle === 'destroy') audio.destroy();
    expect(audio.diagnostics.loops).toBe(0);
    clock.advance(.03);
    expect(clock.sources.filter(source => source.loop && !source.ended && source.buffer?.duration !== 5)).toHaveLength(0);
    audio.destroy();
  });
  it('does not schedule while locked, muted, effects-zero, paused or context-suspended', async () => {
    const locked = new AudioSystem(); locked.playPistol(); locked.playUi('confirm'); emit(locked, event('bulwark', 'tick', 3));
    expect(locked.diagnostics.admitted).toBe(0); locked.destroy();
    const { audio, clock } = await setup();
    const check = () => { const before = clock.sources.length; audio.playPistol(); audio.playElemental('freeze'); audio.playUi('confirm'); emit(audio, event('bulwark', 'tick', 3)); expect(clock.sources.length).toBe(before); };
    audio.setMasterVolume(0); check(); audio.setMasterVolume(1);
    audio.setEffectsVolume(0); check(); audio.setEffectsVolume(.8);
    audio.pauseAll(); check(); audio.resumeAll();
    clock.setState('suspended'); check(); audio.destroy();
  });
  it('holds physical voices and loops bounded through 2000 events over eight seconds', async () => {
    const { audio, clock } = await setup();
    audio.setEnvironment('reactor');
    const ids = Object.keys(ABILITY_CATALOG) as AbilityId[];
    for (let i = 0; i < 2000; i++) {
      if (i % 5 === 0) emit(audio, event(ids[i % ids.length], i % 10 === 0 ? 'tick' : 'impact', i % 24));
      else if (i % 5 === 1) audio.playRifle();
      else if (i % 5 === 2) audio.handleEffect({ type: 'enemy-warning', family: 'spitter', x: 100, y: 50 }, listener);
      else if (i % 5 === 3) audio.playConfirmedHit(i % 2 === 0);
      else audio.playExplosion();
      expect(audio.diagnostics.voices).toBeLessThanOrEqual(48);
      expect(audio.diagnostics.loops).toBeLessThanOrEqual(9);
      clock.advance(.004);
    }
    expect(audio.diagnostics.admitted).toBeLessThan(2000);
    expect(audio.diagnostics.admitted).toBeGreaterThan(150);
    expect(audio.diagnostics.highWater).toBeLessThanOrEqual(48);
    audio.pauseAll(); clock.advance(.03); expect(audio.diagnostics.voices).toBe(0); audio.destroy();
  });
  it('caches PCM and cycles three repeatable sample/synthesis round-robin variants', async () => {
    const { audio, clock } = await setup();
    for (let i = 0; i < 4; i++) { audio.playPistol(); clock.advance(1); }
    const shots = clock.sources.filter(source => Math.abs((source.buffer?.duration ?? 0) - .28) < .0001);
    expect(shots).toHaveLength(4); expect(shots[0].buffer).toBe(shots[3].buffer);
    expect(shots[0].buffer).not.toBe(shots[1].buffer);
    for (const kind of ['freeze', 'shatter', 'reactor'] as const) { audio.playElemental(kind); audio.playElemental(kind); }
    const buffers = clock.buffers.length; clock.advance(1);
    for (const kind of ['freeze', 'shatter', 'reactor'] as const) audio.playElemental(kind);
    expect(clock.buffers.length).toBe(buffers); audio.destroy();
  });
  it('restores music lowpass after Overclock and only pulses below 30% health', async () => {
    const { audio, clock } = await setup();
    const filter = clock.nodes.find(node => node.kind === 'filter')!;
    audio.setCombatState(state({ hostileTimeScale: .3 })); clock.advance(.8); expect(filter.frequency.value).toBeLessThan(1200);
    audio.setCombatState(state()); clock.advance(1); expect(filter.frequency.value).toBeGreaterThan(19000);
    audio.setCombatState(state({ danger: .69 })); expect(clock.sources.filter(source => source.loop)).toHaveLength(0);
    audio.setCombatState(state({ danger: .8 })); expect(clock.sources.filter(source => source.loop)).toHaveLength(1);
    audio.setCombatState(state({ danger: .6 })); clock.advance(.03); expect(clock.sources.filter(source => source.loop && !source.ended)).toHaveLength(0); audio.destroy();
  });
  it('accepts the real Queen phase vocabulary and keeps spawn warnings separate from Queen tells', async () => {
    const { audio, clock } = await setup();
    audio.handleEffect({ type: 'enemy-warning', x: 0, y: 0 }, listener);
    expect(clock.sources.at(-1)!.buffer!.getChannelData(0)).toEqual(synthesize(enemyRecipe('crawler', 'warning')));
    audio.setCombatState(state({ boss: true })); audio.setBossPhase('nest-spawn');
    expect(clock.sources.at(-1)!.buffer!.getChannelData(0)).toEqual(synthesize(enemyRecipe('queen-phase-2', 'warning', true)));
    const before = audio.diagnostics.admitted; audio.setBossPhase('nest-spawn'); expect(audio.diagnostics.admitted).toBe(before);
    audio.setBossPhase('vulnerable');
    audio.handleEffect({ type: 'enemy-attack', id: -1, x: 0, y: 0 }, listener);
    expect(clock.sources.at(-1)!.buffer!.getChannelData(0)).toEqual(synthesize(enemyRecipe('queen-phase-3', 'attack')));
    audio.destroy();
  });
  it('cancels all pending reload Foley when cancelled/switched/dead and resumes only its last latch', async () => {
    const { audio, clock } = await setup();
    const snapshot = { dead: false, weaponId: 'pistol', reloading: true, reloadRemainingMs: 1500 } as any;
    audio.syncCombat(snapshot); expect(clock.sources).toHaveLength(3);
    audio.syncCombat(snapshot); expect(clock.sources).toHaveLength(3);
    audio.pauseAll(); clock.advance(.03); expect(clock.sources.every(source => source.ended)).toBe(true);
    audio.resumeAll(); expect(clock.sources).toHaveLength(4);
    audio.syncCombat({ ...snapshot, reloading: false }); clock.advance(.03);
    expect(clock.sources.every(source => source.ended)).toBe(true); audio.destroy();
  });
  it('spreads optional prewarming across tasks and cancels it on destroy', async () => {
    vi.useFakeTimers();
    try {
      const clock = new FakeAudioContext(), audio = new AudioSystem({}, { context: clock.asContext(), loadSamples: false });
      await audio.unlock(); expect(audio.diagnostics.warmed).toBe(0);
      await vi.advanceTimersByTimeAsync(24); expect(audio.diagnostics.warmed).toBe(1);
      await vi.advanceTimersByTimeAsync(24); expect(audio.diagnostics.warmed).toBe(2);
      audio.destroy(); await vi.advanceTimersByTimeAsync(100); expect(audio.diagnostics.buffers).toBe(0);
      expect(vi.getTimerCount()).toBe(0); expect(clock.nodes.every(node => node.connections.size === 0)).toBe(true);
    } finally { vi.useRealTimers(); }
  });
});
