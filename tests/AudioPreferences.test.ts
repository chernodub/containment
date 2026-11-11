import {afterEach, expect, it, vi} from 'vitest';
import {AudioSystem} from '../src/game/audio/AudioSystem';
import {FakeAudioContext} from './audioFake';
import type {MixEngine} from '../src/game/audio/MixEngine';
import {AUDIO_STORAGE_KEY, loadAudioPreferences, saveAudioPreferences} from '../src/game/audio/preferences';

const store = (value: string | null) => ({getItem: vi.fn(() => value), setItem: vi.fn()});
afterEach(() => vi.unstubAllGlobals());

it('defaults to 30% and unmuted without stored preferences', () => {
  expect(loadAudioPreferences(null)).toEqual({master: .3, muted: false});
  expect(loadAudioPreferences(store(null))).toEqual({master: .3, muted: false});
});
it.each([0, .3, .73, 1])('preserves saved master %s and mute separately', master => {
  const storage = store(JSON.stringify({master, muted: true}));
  expect(loadAudioPreferences(storage)).toEqual({master, muted: true});
  expect(storage.getItem).toHaveBeenCalledWith(AUDIO_STORAGE_KEY);
});
it.each(['broken', 'null', '[]', '"loud"', '{"master":-1}', '{"master":2}', '{"master":"0"}'])('tolerates invalid storage %s', value => {
  expect(loadAudioPreferences(store(value))).toEqual({master: .3, muted: false});
});
it('validates fields independently and leaves unrelated storage alone', () => {
  expect(loadAudioPreferences(store('{"master":0.65,"muted":"false"}'))).toEqual({master: .65, muted: false});
  expect(loadAudioPreferences(store('{"master":null,"muted":true}'))).toEqual({master: .3, muted: true});
  const storage = store(null);
  saveAudioPreferences(storage, {master: 0, muted: true});
  expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(AUDIO_STORAGE_KEY, '{"master":0,"muted":true}');
});
it('keeps controls usable when storage is blocked or full', () => {
  const storage = {getItem: () => {throw new Error('blocked');}, setItem: () => {throw new Error('full');}};
  expect(loadAudioPreferences(storage)).toEqual({master: .3, muted: false});
  expect(() => saveAudioPreferences(storage, {master: .7, muted: false})).not.toThrow();
  expect(() => saveAudioPreferences(null, {master: .7, muted: false})).not.toThrow();
});
it('applies 30% by default and ramps master independently from real music/effects gains', async () => {
  const clock = new FakeAudioContext();
  const audio = new AudioSystem({music: .38, effects: .8}, {context: clock.asContext(), loadSamples: false, prewarm: false});
  expect(await audio.unlock()).toBe(true);
  const mixer = (audio as unknown as {mixer: MixEngine}).mixer;
  expect(mixer.master.gain.value).toBeCloseTo(.3 * .85);
  expect(mixer.effects.gain.value).toBe(.8); expect(mixer.music.gain.value).toBe(.38);
  audio.setMasterVolume(0); clock.advance(.5); expect(mixer.master.gain.value).toBeCloseTo(0);
  audio.setMasterVolume(.73); clock.advance(.5); expect(mixer.master.gain.value).toBeCloseTo(.73 * .85);
  expect(mixer.effects.gain.value).toBe(.8); expect(mixer.music.gain.value).toBe(.38);
  audio.setMusicVolume(0); audio.setEffectsVolume(.2); clock.advance(2);
  expect(mixer.music.gain.value).toBeCloseTo(0); expect(mixer.effects.gain.value).toBeCloseTo(.2);
  audio.destroy();
  const silentClock = new FakeAudioContext();
  const silent = new AudioSystem({master: 0}, {context: silentClock.asContext(), loadSamples: false, prewarm: false});
  expect(await silent.unlock()).toBe(true); silent.playPistol(); silent.playUi('confirm');
  expect(silentClock.sources).toHaveLength(0); silent.destroy();
});
