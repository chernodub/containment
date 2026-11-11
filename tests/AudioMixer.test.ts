import { describe, expect, it } from 'vitest';
import { ACTIVE_VOICE_LIMIT, AUDIO_BUSES, LOOP_LIMIT, MixEngine, VOICE_LIMIT, type MixVoice } from '../src/game/audio/MixEngine';
import { FakeAudioContext, FakeNode, FakeParam, FakeSource } from './audioFake';

const node = (value: unknown) => value as FakeNode;
const source = (value: unknown) => value as FakeSource;
const param = (value: unknown) => value as FakeParam;
function setup() {
  const context = new FakeAudioContext();
  const mixer = new MixEngine(context.asContext(), { master: .3, music: .4, effects: .8 });
  const buffer = context.createBuffer(1, 24000 * 4, 24000);
  return { context, mixer, buffer };
}
function reachable(from: FakeNode, to: FakeNode, visited = new Set<FakeNode>()): boolean {
  if (from === to) return true;
  if (visited.has(from)) return false;
  visited.add(from);
  for (const connection of from.connections) if (connection instanceof FakeNode && reachable(connection, to, visited)) return true;
  return false;
}

describe('shared audio mixer', () => {
  it('routes every bus through its real volume group, compressor and bounded waveshaper', () => {
    const { context, mixer } = setup();
    for (const bus of AUDIO_BUSES) {
      expect(reachable(node(mixer.buses[bus]), node(bus === 'music' ? mixer.music : mixer.effects))).toBe(true);
      expect(reachable(node(mixer.buses[bus]), node(bus === 'music' ? mixer.effects : mixer.music))).toBe(false);
      expect(reachable(node(mixer.buses[bus]), context.destination)).toBe(true);
    }
    const compressor = context.nodes.find(n => n.kind === 'compressor')!;
    const limiter = context.nodes.find(n => n.kind === 'shaper')!;
    expect(node(mixer.master).connections.has(compressor)).toBe(true);
    expect(compressor.connections.has(limiter)).toBe(true);
    expect(limiter.connections.has(context.destination)).toBe(true);
    expect(compressor.attack.value).toBeLessThanOrEqual(.005);
    expect(compressor.ratio.value).toBeGreaterThan(1);
    expect(limiter.curve!.every(value => Number.isFinite(value) && Math.abs(value) < .96)).toBe(true);
    expect(limiter.curve![0]).toBeLessThan(0);
    expect(limiter.curve!.at(-1)).toBeGreaterThan(0);
  });

  it('uses independent master/music/effects and clamped per-bus ramped gains', () => {
    const { context, mixer } = setup();
    expect(node(mixer.master).gain.value).toBe(.3 * .85);
    expect(node(mixer.music).gain.value).toBe(.4);
    expect(node(mixer.effects).gain.value).toBe(.8);
    mixer.setVolumes({ master: 0, music: .65, effects: .2 });
    expect(param(mixer.master.gain).calls.at(-1)).toMatchObject({ method: 'target', time: 0, value: 0 });
    expect(param(mixer.music.gain).calls.at(-1)).toMatchObject({ method: 'target', value: .65 });
    expect(param(mixer.effects.gain).calls.at(-1)).toMatchObject({ method: 'target', value: .2 });
    mixer.setBusVolume('abilities', 2); mixer.setBusVolume('enemies', -1); mixer.setBusVolume('ui', NaN);
    context.advance(2);
    expect(mixer.buses.abilities.gain.value).toBeCloseTo(1);
    expect(mixer.buses.enemies.gain.value).toBeCloseTo(0);
    expect(mixer.buses.ui.gain.value).toBeCloseTo(0);
    expect(mixer.buses.weapons.gain.value).toBe(1);
  });

  it('bounds active and physical sources while prioritizing important arrivals', () => {
    const { mixer, buffer } = setup();
    for (let i = 0; i < ACTIVE_VOICE_LIMIT; i++) expect(mixer.play(buffer, { bus: 'impacts', priority: 10 })).not.toBeNull();
    expect(mixer.voices.size).toBe(40);
    expect(mixer.play(buffer, { bus: 'impacts', priority: 10 })).toBeNull();
    for (let i = 0; i < VOICE_LIMIT - ACTIVE_VOICE_LIMIT; i++) expect(mixer.play(buffer, { bus: 'abilities', priority: 80 })).not.toBeNull();
    expect(mixer.voices.size).toBe(48);
    expect([...mixer.voices].filter(voice => voice.retiring)).toHaveLength(8);
    expect([...mixer.voices].filter(voice => !voice.retiring)).toHaveLength(40);
    expect(mixer.play(buffer, { bus: 'ui', priority: 100 })).toBeNull();
    expect(mixer.highWater).toBe(48);
    expect(mixer.rejected).toBe(2);
  });

  it('reserves protected loop voices, caps loops and makes room after fading tails finish', () => {
    const { context, mixer, buffer } = setup();
    const loops: MixVoice[] = [];
    for (let i = 0; i < LOOP_LIMIT; i++) loops.push(mixer.play(buffer, { bus: 'ambience', priority: 5, loop: true })!);
    expect(mixer.play(buffer, { bus: 'ambience', priority: 100, loop: true })).toBeNull();
    for (let i = 0; i < ACTIVE_VOICE_LIMIT - LOOP_LIMIT; i++) mixer.play(buffer, { bus: 'impacts', priority: 10 });
    const important = mixer.play(buffer, { bus: 'abilities', priority: 99 });
    expect(important).not.toBeNull();
    expect(loops.every(voice => !voice.retiring && source(voice.source).stops.length === 0)).toBe(true);
    context.advance(.019);
    expect(mixer.voices.size).toBe(40);
    expect(mixer.play(buffer, { bus: 'ui', priority: 100 })).not.toBeNull();
    mixer.stop(loops[0]); context.advance(.019);
    expect(mixer.play(buffer, { bus: 'ambience', priority: 50, loop: true })).not.toBeNull();
  });

  it('cancels scheduled envelopes, holds gain and reaches silence before stopping or disconnecting', () => {
    const { context, mixer, buffer } = setup();
    const voice = mixer.play(buffer, { bus: 'weapons', delay: .5, level: .6 })!;
    mixer.stop(voice);
    expect(param(voice.gain.gain).calls.slice(-2)).toEqual([
      expect.objectContaining({ method: 'hold', time: 0 }),
      { method: 'linear', value: 0, time: .018 },
    ]);
    expect(source(voice.source).stops).toEqual([.018]);
    expect(node(voice.gain).disconnects).toBe(0);
    context.advance(.019);
    expect(mixer.voices.size).toBe(0);
    expect(node(voice.gain).disconnects).toBe(1);
    expect(source(voice.source).disconnects).toBe(1);
    expect(voice.nodes.every(value => node(value).connections.size === 0)).toBe(true);
  });

  it('retains the deepest overlapping duck and latest hold without an early release', () => {
    const { context, mixer } = setup();
    mixer.duck(.25, .6);
    const ducks = context.nodes.filter(n => n.kind === 'gain' && n.gain.calls.some(call => call.method === 'target' && call.time === 0 && (call.value === .25 || call.value === .22)));
    expect(ducks).toHaveLength(2);
    context.advance(.1); mixer.duck(.6, .8);
    for (const duck of ducks) {
      const scheduled = duck.gain.scheduled;
      expect(scheduled.filter(event => event.method === 'target' && event.value === 1)).toEqual([
        expect.objectContaining({ time: .9, value: 1 }),
      ]);
      expect(duck.gain.valueAt(.65)).toBeLessThan(.3);
      expect(duck.gain.valueAt(2.5)).toBeGreaterThan(.99);
    }
    expect(ducks[0].gain.calls.some(call => call.method === 'hold' && call.time === .1)).toBe(true);
  });

  it('attenuates distance, bounds stereo pan and rate, and connects the chosen bus', () => {
    const { context, mixer, buffer } = setup();
    const voice = mixer.play(buffer, { bus: 'enemies', level: .8, distance: 420, pan: 10, rate: 20 })!;
    const envelope = param(voice.gain.gain);
    expect(envelope.calls.some(call => call.method === 'linear' && call.value === .4)).toBe(true);
    const panner = voice.nodes.map(node).find(n => n.kind === 'panner')!;
    expect(panner.pan.value).toBe(.85);
    expect(panner.connections.has(mixer.buses.enemies)).toBe(true);
    expect(voice.source.playbackRate.value).toBe(3);
    expect(source(voice.source).starts).toEqual([{ when: 0, offset: 0, duration: 4 }]);
    context.advance(1.34);
    expect(mixer.voices.size).toBe(0);
  });

  it('crossfades deterministic stereo room responses and changes music treatment', () => {
    const { context, mixer } = setup();
    mixer.setReverb(.9, .18);
    const convolvers = context.nodes.filter(n => n.kind === 'convolver');
    expect(convolvers[1].buffer).not.toBeNull();
    expect(convolvers[1].buffer!.numberOfChannels).toBe(2);
    expect(convolvers[1].buffer!.duration).toBeCloseTo(.9);
    expect(convolvers[1].buffer!.getChannelData(0)).not.toEqual(convolvers[1].buffer!.getChannelData(1));
    const gains = convolvers.map(convolver => [...convolver.connections][0] as FakeNode);
    context.advance(.1); mixer.setReverb(2.8, .4);
    expect(convolvers[0].buffer!.duration).toBeCloseTo(2.8);
    expect(gains[0].gain.calls.at(-1)).toMatchObject({ method: 'target', value: .5, time: .1 });
    expect(gains[1].gain.calls.at(-1)).toMatchObject({ method: 'target', value: 0, time: .1 });
    mixer.setTreatment(.8, false, false);
    expect(param(mixer.musicFilter.frequency).calls.at(-1)).toMatchObject({ value: 3600 });
    mixer.setTreatment(.1, true, false);
    expect(param(mixer.musicFilter.frequency).calls.at(-1)).toMatchObject({ value: 1100 });
    mixer.setTreatment(0, false, false);
    expect(param(mixer.musicFilter.frequency).calls.at(-1)).toMatchObject({ value: 20000 });
  });

  it('crossfades room loops with a source envelope independent of the repeated PCM seam', () => {
    const { context, mixer, buffer } = setup();
    const old = mixer.play(buffer, { bus: 'ambience', loop: true, fadeIn: .8 })!;
    expect(param(old.gain.gain).calls).toEqual([
      { method: 'set', value: 0, time: 0 },
      { method: 'linear', value: 1, time: .8 },
    ]);
    context.advance(1);
    mixer.stop(old, .8);
    const next = mixer.play(buffer, { bus: 'ambience', loop: true, fadeIn: .8 })!;
    expect(param(next.gain.gain).valueAt(1.4)).toBeCloseTo(.5);
    expect(param(old.gain.gain).valueAt(1.4)).toBeCloseTo(.5);
    context.advance(.81);
    expect(mixer.voices.has(old)).toBe(false);
    expect(mixer.voices.has(next)).toBe(true);
    expect(param(next.gain.gain).valueAt(4)).toBe(1);
    const ability = mixer.play(buffer, { bus: 'abilities', loop: true, fadeIn: .2, level: .8 })!;
    expect(param(ability.gain.gain).calls.at(-1)).toEqual({ method: 'linear', value: .8, time: context.currentTime + .2 });
  });

  it('gives missed-end loop expiry a release envelope and permits earlier lifecycle cancellation', () => {
    const { context, mixer, buffer } = setup();
    const voice = mixer.play(buffer, { bus: 'abilities', loop: true, fadeIn: .2, level: .7 })!;
    mixer.expire(voice, 2);
    expect(param(voice.gain.gain).calls.slice(-2)).toEqual([
      { method: 'set', value: .7, time: 1.975 },
      { method: 'linear', value: 0, time: 2 },
    ]);
    expect(source(voice.source).stops).toEqual([2]);
    expect(param(voice.gain.gain).valueAt(1.99)).toBeCloseTo(.28);
    context.advance(.5); mixer.stop(voice);
    expect(param(voice.gain.gain).scheduled.some(event => event.time >= 1.975)).toBe(false);
    expect(source(voice.source).stops).toEqual([2, .518]);
    context.advance(.019);
    expect(mixer.voices.size).toBe(0);
  });

  it('retimes remaining content without cutting a slowed hostile early or losing its original pitch ratio', () => {
    const { context, mixer, buffer } = setup();
    const voice = mixer.play(buffer, { bus: 'enemies', rate: .7, level: .6 })!;
    const nativeEnd = voice.end;
    context.advance(1);
    mixer.setRate(voice, voice.rate * .5);
    expect(voice.consumed).toBeCloseTo(.7);
    expect(voice.rate).toBeCloseTo(.35);
    expect(voice.end).toBeCloseTo(1 + 3.3 / .35);
    expect(source(voice.source).starts).toEqual([{ when: 0, offset: 0, duration: 4 }]);
    expect(source(voice.source).stops.at(-1)).toBeCloseTo(voice.end);
    expect(param(voice.gain.gain).scheduled.at(-1)).toMatchObject({ method: 'linear', value: 0, time: voice.end });
    expect(param(voice.gain.gain).valueAt(nativeEnd + .1)).toBeCloseTo(.6);
    context.advance(5); // Beyond the original 4/.7-second duration.
    mixer.play(buffer, { bus: 'weapons' }); // Exercises the elapsed-voice reaper.
    expect(mixer.voices.has(voice)).toBe(true);
    mixer.setRate(voice, voice.rate * 2);
    expect(voice.rate).toBeCloseTo(.7);
    expect(voice.source.playbackRate.value).toBeCloseTo(.7);
    expect(voice.consumed).toBeCloseTo(2.45);
    expect(voice.end).toBeCloseTo(6 + 1.55 / .7);
    expect(source(voice.source).stops.at(-1)).toBeCloseTo(voice.end);
    expect(param(voice.gain.gain).scheduled.filter(event => event.method === 'linear' && event.value === 0)).toEqual([
      expect.objectContaining({ time: voice.end }),
    ]);
    context.advance(2.2);
    expect(mixer.voices.has(voice)).toBe(true);
    context.advance(.02);
    expect(mixer.voices.has(voice)).toBe(false);
  });

  it('retimes a future source without consuming content or cancelling its audible onset', () => {
    const { context, mixer, buffer } = setup();
    const voice = mixer.play(buffer, { bus: 'enemies', rate: .7, level: .5, delay: 2 })!;
    context.advance(.5); mixer.setRate(voice, .35);
    context.advance(.5); mixer.setRate(voice, .7);
    expect(voice.consumed).toBe(0);
    expect(voice.rateUpdatedAt).toBe(2);
    expect(voice.end).toBeCloseTo(2 + 4 / .7);
    expect(source(voice.source).starts).toEqual([{ when: 2, offset: 0, duration: 4 }]);
    const envelope = param(voice.gain.gain);
    expect(envelope.valueAt(2)).toBe(0);
    expect(envelope.valueAt(2.002)).toBeCloseTo(.25);
    expect(envelope.valueAt(2.005)).toBeCloseTo(.5);
    expect(envelope.valueAt(voice.end)).toBeCloseTo(0);
    expect(source(voice.source).stops.at(-1)).toBeCloseTo(voice.end);
    context.advance(1.1);
    expect(mixer.voices.has(voice)).toBe(true);
    expect(envelope.value).toBeCloseTo(.5);
  });

  it('releases naturally ended voices and destroys every owned node exactly once', () => {
    const { context, mixer, buffer } = setup();
    const voice = mixer.play(buffer, { bus: 'weapons' })!;
    source(voice.source).finish();
    expect(mixer.voices.size).toBe(0);
    const loop = mixer.play(buffer, { bus: 'ambience', loop: true })!;
    mixer.setReverb(.8, .2);
    mixer.destroy(); mixer.destroy();
    expect(mixer.voices.size).toBe(0);
    expect(source(loop.source).stops).toHaveLength(1);
    expect(context.nodes.every(n => n.connections.size === 0 && n.disconnects === 1)).toBe(true);
    expect(context.nodes.filter(n => n.kind === 'convolver').every(n => n.buffer === null)).toBe(true);
    expect(mixer.play(buffer, { bus: 'ui' })).toBeNull();
  });
});
