import { afterEach, expect, it, vi } from 'vitest';
import { AudioSystem } from '../src/game/audio/AudioSystem';
import { synthesize, type CueRecipe } from '../src/game/audio/synthesis';
import { FakeAudioContext } from './audioFake';

class ControlledWorker {
  static instances: ControlledWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  readonly requests: Array<{ key: string; recipe: CueRecipe }> = [];
  terminated = false;
  constructor() { ControlledWorker.instances.push(this); }
  postMessage(request: { key: string; recipe: CueRecipe }) { this.requests.push(request); }
  finish(index = 0) {
    const request = this.requests[index], samples = synthesize(request.recipe);
    this.onmessage?.({ data: { key: request.key, samples: samples.buffer } } as MessageEvent);
  }
  terminate() { this.terminated = true; }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); ControlledWorker.instances.length = 0; });
const tick = { type: 'ability' as const, x: 0, y: 0, ability: { ability: 'whiteout' as const, phase: 'tick' as const, slot: 'overdrive' as const, rig: 'cryo' as const, element: 'cryo' as const, entityId: 7, durationMs: 8000 } };
async function setup() {
  vi.useFakeTimers(); vi.stubGlobal('Worker', ControlledWorker);
  const clock = new FakeAudioContext(), audio = new AudioSystem({ master: 1 }, { context: clock.asContext(), loadSamples: false });
  await audio.unlock(); return { audio, clock };
}
it('generates a long bed off-thread, then creates its AudioBuffer only after transfer', async () => {
  const { audio, clock } = await setup(); audio.setEnvironment('reactor');
  expect(clock.buffers).toHaveLength(0); expect(clock.sources).toHaveLength(0);
  const worker = ControlledWorker.instances[0]; expect(worker.requests[0].recipe.id).toBe('ambience:reactor');
  worker.finish(); expect(clock.sources).toHaveLength(1); expect(clock.sources[0].loop).toBe(true);
  expect(clock.sources[0].buffer!.duration).toBe(5);
  audio.destroy(); expect(worker.terminated).toBe(true); expect(vi.getTimerCount()).toBe(0);
});
it.each(['pause', 'room', 'end', 'death', 'destroy'] as const)('never resurrects a pending loop after %s', async lifecycle => {
  const { audio, clock } = await setup(); audio.handleEffect(tick, { x: 0, y: 0 });
  const worker = ControlledWorker.instances[0]; expect(worker.requests[0].recipe.id).toBe('ability:whiteout:loop');
  if (lifecycle === 'pause') audio.pauseAll();
  if (lifecycle === 'room') audio.setEnvironment('cargo');
  if (lifecycle === 'end') audio.handleEffect({ ...tick, ability: { ...tick.ability, phase: 'end' } }, { x: 0, y: 0 });
  if (lifecycle === 'death') audio.playUi('death');
  if (lifecycle === 'destroy') audio.destroy();
  worker.finish(); expect(audio.diagnostics.loops).toBe(0);
  expect(clock.sources.filter(source => source.loop)).toHaveLength(0); audio.destroy();
});
it('worker errors leave an audible synchronous fallback and do not strand prewarming', async () => {
  const { audio, clock } = await setup(); audio.setEnvironment('cargo');
  const worker = ControlledWorker.instances[0]; worker.onerror?.();
  expect(worker.terminated).toBe(true); expect(clock.sources.some(source => source.loop)).toBe(true);
  await vi.advanceTimersByTimeAsync(24); expect(audio.diagnostics.warmed).toBe(1);
  audio.destroy(); expect(vi.getTimerCount()).toBe(0);
});
it('does not start an expired pending loop even when the worker returns later', async () => {
  const { audio, clock } = await setup(); audio.handleEffect(tick, { x: 0, y: 0 });
  clock.advance(9); ControlledWorker.instances[0].finish(); expect(audio.diagnostics.loops).toBe(0); audio.destroy();
});
