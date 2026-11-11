import { afterEach, describe, expect, it, vi } from 'vitest';
import { Group } from 'three';
import type { RunNode } from '../src/game/roguelike/types';
import { RoomPreparationCache } from '../src/render/RoomPreparationCache';

function node(templateId: RunNode['templateId'], id: string = templateId): RunNode {
  return { id, templateId, depth: 1, kind: 'combat', reward: 'upgrade', next: [] };
}

function idleScheduler() {
  const callbacks: IdleRequestCallback[] = [];
  const schedule = vi.fn((callback: IdleRequestCallback) => { callbacks.push(callback); return callbacks.length; });
  const cancel = vi.fn();
  vi.stubGlobal('requestIdleCallback', schedule);
  vi.stubGlobal('cancelIdleCallback', cancel);
  const run = (index: number) => callbacks[index]({ didTimeout: false, timeRemaining: () => 20 });
  return { callbacks, schedule, cancel, run };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('CPU room preparation cache', () => {
  it('schedules two unique templates during idle and transfers each root exactly once', () => {
    const idle = idleScheduler();
    const roots = [new Group(), new Group()];
    const factory = vi.fn().mockReturnValueOnce(roots[0]).mockReturnValueOnce(roots[1]);
    const dispose = vi.fn();
    const cache = new RoomPreparationCache(factory, dispose);
    cache.prepareAhead([node('receiving'), node('receiving', 'same-template'), node('cold-aisle'), node('pump-ring')]);
    cache.prepareAhead([node('receiving', 'another-route'), node('cold-aisle')]);
    expect(factory).not.toHaveBeenCalled();
    expect(idle.schedule).toHaveBeenCalledTimes(2);
    expect(idle.schedule.mock.calls[0]).toEqual([expect.any(Function), { timeout: 500 }]);
    idle.run(0);
    idle.run(1);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(cache.take(node('receiving', 'new-node-id'))).toBe(roots[0]);
    expect(cache.take(node('receiving'))).toBeUndefined();
    expect(cache.take(node('cold-aisle'))).toBe(roots[1]);
    cache.dispose();
    expect(dispose).not.toHaveBeenCalled();
  });

  it('evicts the least recently requested template within the two-root limit', () => {
    const idle = idleScheduler();
    const roots = [new Group(), new Group(), new Group()];
    const factory = vi.fn().mockReturnValueOnce(roots[0]).mockReturnValueOnce(roots[1]).mockReturnValueOnce(roots[2]);
    const dispose = vi.fn();
    const cache = new RoomPreparationCache(factory, dispose);
    cache.prepareAhead([node('receiving'), node('cold-aisle')]);
    idle.run(0);
    idle.run(1);
    cache.prepareAhead([node('receiving')]);
    cache.prepareAhead([node('pump-ring')]);
    idle.run(2);
    expect(dispose).toHaveBeenCalledExactlyOnceWith(roots[1]);
    expect(cache.take(node('cold-aisle'))).toBeUndefined();
    expect(cache.take(node('receiving'))).toBe(roots[0]);
    cache.dispose();
    cache.dispose();
    expect(dispose.mock.calls).toEqual([[roots[1]], [roots[2]]]);
  });

  it('retains null results without regenerating or disposing them', () => {
    const idle = idleScheduler();
    const factory = vi.fn(() => null);
    const dispose = vi.fn();
    const cache = new RoomPreparationCache(factory, dispose);
    cache.prepareAhead([node('receiving')]);
    idle.run(0);
    cache.prepareAhead([node('receiving', 'another-node')]);
    expect(idle.schedule).toHaveBeenCalledOnce();
    expect(cache.take(node('receiving'))).toBeNull();
    expect(cache.take(node('receiving'))).toBeUndefined();
    expect(factory).toHaveBeenCalledOnce();
    cache.dispose();
    expect(dispose).not.toHaveBeenCalled();
  });

  it('cancels pending work without discarding completed roots, including late callbacks', () => {
    const idle = idleScheduler();
    const root = new Group();
    const factory = vi.fn(() => root);
    const dispose = vi.fn();
    const cache = new RoomPreparationCache(factory, dispose);
    cache.prepareAhead([node('receiving'), node('cold-aisle')]);
    idle.run(0);
    cache.clearPending();
    expect(idle.cancel).toHaveBeenCalledExactlyOnceWith(2);
    idle.run(1);
    expect(factory).toHaveBeenCalledOnce();
    expect(cache.take(node('receiving'))).toBe(root);
    cache.prepareAhead([node('pump-ring')]);
    expect(cache.take(node('pump-ring'))).toBeUndefined();
    idle.run(2);
    expect(factory).toHaveBeenCalledOnce();
    cache.dispose();
    expect(dispose).not.toHaveBeenCalled();
  });

  it('uses cancellable timer work where requestIdleCallback is unavailable', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const root = new Group();
    const factory = vi.fn(() => root);
    const dispose = vi.fn();
    const cache = new RoomPreparationCache(factory, dispose, 1);
    cache.prepareAhead([node('receiving'), node('cold-aisle')]);
    expect(factory).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(factory).toHaveBeenCalledOnce();
    cache.prepareAhead([node('pump-ring')]);
    cache.dispose();
    vi.runAllTimers();
    expect(factory).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledExactlyOnceWith(root);
    cache.prepareAhead([node('receiving')]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves failed speculation as a miss so normal loading can retry', () => {
    const idle = idleScheduler();
    const factory = vi.fn(() => { throw new Error('optional preparation failed'); });
    const cache = new RoomPreparationCache(factory, vi.fn());
    cache.prepareAhead([node('receiving')]);
    expect(() => idle.run(0)).not.toThrow();
    expect(cache.take(node('receiving'))).toBeUndefined();
    cache.prepareAhead([node('receiving')]);
    expect(idle.schedule).toHaveBeenCalledTimes(2);
    cache.dispose();
  });
});
