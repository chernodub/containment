import {afterEach, describe, expect, it, vi} from 'vitest';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkpointProbe, compareCheckpoint, installAudioSpy, readAudioSpy} from './lifecycle.mjs';

const checkpoint = {
  run: {phase: 'route', seed: 10, currentNodeId: 'a', completedNodeIds: ['a']},
  build: {rig: 'cryo', mutations: ['cryogenic']},
  resources: {health: 100, credits: 14},
  abilities: {overdriveCharge: .6},
  stats: {damageDealt: {ability: 24, weapon: 40}},
};
const resumed = () => ({
  ...structuredClone(checkpoint), status: 'route', overdriveCharge: .6, canContinue: true,
});

describe('checkpoint interruption comparison', () => {
  it('accepts exact stored boundary regardless of object key order', () => {
    const actual = resumed();
    actual.resources = {credits: 14, health: 100};
    expect(compareCheckpoint(checkpoint, actual)).toEqual({passed: true, differences: []});
  });

  it('detects wrong seed, lost rig, resource desync and lost meter/statistics', () => {
    const actual = resumed();
    actual.run.seed++;
    actual.build.rig = 'arc';
    actual.resources.health--;
    actual.overdriveCharge = 0;
    actual.stats.damageDealt.ability = 0;
    expect(compareCheckpoint(checkpoint, actual)).toEqual({
      passed: false, differences: ['run', 'build', 'resources', 'overdriveCharge', 'stats'],
    });
  });

  it('expects choice screens to resume as reward rather than combat', () => {
    const saved = {...checkpoint, run: {...checkpoint.run, phase: 'starting-boon'}};
    const actual = {...resumed(), run: saved.run, status: 'reward'};
    expect(compareCheckpoint(saved, actual).passed).toBe(true);
    expect(compareCheckpoint(saved, {...actual, status: 'playing'}).differences).toEqual(['status']);
  });

  it('allows old saves with no optional meter or statistics', () => {
    const {abilities, stats, ...legacy} = checkpoint;
    expect(compareCheckpoint(legacy, {...resumed(), overdriveCharge: 0, stats: {}}).passed).toBe(true);
  });

  it('requires terminal runs with no checkpoint to expose no Continue action', () => {
    expect(compareCheckpoint(null, {canContinue: false}).passed).toBe(true);
    expect(compareCheckpoint(null, {canContinue: true}).passed).toBe(false);
  });

  it('rejects a missing or invalid restored meter', () => {
    expect(compareCheckpoint(checkpoint, {...resumed(), overdriveCharge: undefined}).differences).toEqual(['overdriveCharge']);
  });

  it('installs replacement page listeners before navigation and Continue', async () => {
    const evidenceDir = await mkdtemp(join(tmpdir(), 'containment-checkpoint-probe-'));
    const events = [], capturedErrors = [], handlers = {};
    const saved = {run: {phase: 'route'}, build: {}, resources: {}};
    const actual = {run: saved.run, build: {}, resources: {}, status: 'route', canContinue: true};
    const nextPage = {
      on(name, callback) { events.push(`listen:${name}`); handlers[name] = callback; },
      async goto() { events.push('goto'); handlers.pageerror?.(new Error('startup failure')); },
      async waitForFunction() {},
      async screenshot() {},
      async evaluate(callback, argument) { return argument ? actual : null; },
      locator() { return {
        async count() { return 1; }, async isVisible() { return true; },
        async click() { events.push('Continue'); handlers.pageerror?.(new Error('Continue failure')); },
      }; },
    };
    const beforePage = {
      context: () => ({newPage: async () => nextPage}), url: () => 'https://example.invalid/?debug=1',
      async waitForFunction() {}, async waitForLoadState() {}, async screenshot() {}, async close() {},
      async evaluate(callback, argument) { return argument ? {...actual, checkpoint: saved} : null; },
    };
    try {
      const receipt = await checkpointProbe(beforePage, {label: 'route', evidenceDir,
        onPage: page => page.on('pageerror', error => capturedErrors.push(error.message)),
      });
      expect(events).toEqual(['listen:pageerror', 'goto', 'Continue']);
      expect(capturedErrors).toEqual(['startup failure', 'Continue failure']);
      expect(receipt.passed).toBe(true);
      expect(receipt.page).toBe(nextPage);
    } finally { await rm(evidenceDir, {recursive: true, force: true}); }
  });
});

describe('audio lifecycle observation', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function fixture() {
    class Source {
      loop = false;
      calls = [];
      buffer = {duration: 8};
      listeners = {};
      start(...args) { this.calls.push(['start', ...args]); }
      stop(...args) { this.calls.push(['stop', ...args]); }
      addEventListener(name, callback) { this.listeners[name] = callback; }
    }
    class Context {
      currentTime = 0;
      state = 'running';
      createBufferSource() { return new Source(); }
      createOscillator() { return new Source(); }
    }
    vi.stubGlobal('window', {AudioContext: Context});
    await installAudioSpy({addInitScript: async callback => callback()});
    return {context: new window.AudioContext(), page: {evaluate: async callback => callback()}};
  }

  it('preserves native arguments and observes future stop replacement', async () => {
    const {context, page} = await fixture();
    const source = context.createBufferSource();
    source.loop = true;
    source.start(1, 0, 3);
    source.stop(2);
    source.stop(5);
    context.currentTime = 3;
    expect(source.calls).toEqual([['start', 1, 0, 3], ['stop', 2], ['stop', 5]]);
    expect((await readAudioSpy(page)).activeLoops).toHaveLength(1);
    context.currentTime = 5;
    expect((await readAudioSpy(page)).activeLoops).toHaveLength(0);
    source.listeners.ended();
    expect((await readAudioSpy(page)).ended).toBe(1);
    expect(window.__containmentPlaytestAudio.active.size).toBe(0);
  });

  it('accounts for naturally ended one-shots without requiring stop', async () => {
    const {context, page} = await fixture();
    const source = context.createBufferSource();
    source.start();
    expect((await readAudioSpy(page)).activeSources).toBe(1);
    source.listeners.ended();
    expect((await readAudioSpy(page)).activeSources).toBe(0);
    expect((await readAudioSpy(page)).stops).toBe(0);
  });
});
