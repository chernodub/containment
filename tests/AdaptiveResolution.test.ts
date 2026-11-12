import { describe, expect, it } from 'vitest';
import { AdaptiveResolution } from '../src/render/post/AdaptiveResolution';
import { GRAPHICS_OPTION_LABELS, GRAPHICS_PRESETS, resolveGraphicsOptions } from '../src/render/graphicsOptions';

function run(controller: AdaptiveResolution, seconds: number, frameMs: number, gpuMs?: number) {
  for (let index = 0; index < seconds * 1000 / frameMs; index++) controller.update(frameMs, gpuMs);
}

describe('adaptive resolution', () => {
  it('keeps native 60 Hz and healthy GPU work at full scale', () => {
    const resolution = new AdaptiveResolution();
    resolution.setEnabled(true);
    run(resolution, 30, 1000 / 60);
    run(resolution, 30, 1000 / 60, 13);
    expect(resolution.scale).toBe(1);
  });

  it('reaches a bounded safety scale after sustained pressure without resizing every frame', () => {
    const resolution = new AdaptiveResolution();
    resolution.setEnabled(true);
    let changes = 0, previous = 1;
    for (let frame = 0; frame < 600; frame++) {
      const scale = resolution.update(1000 / 30, 24);
      if (scale !== previous) changes++;
      expect(previous - scale).toBeLessThanOrEqual(.02501);
      previous = scale;
    }
    expect(resolution.scale).toBe(.7);
    expect(changes).toBe(12);
    expect(resolution.snapshot.source).toBe('gpu');
  });

  it('uses hysteresis through noisy camera/combat intervals and recovers slowly', () => {
    const resolution = new AdaptiveResolution();
    resolution.setEnabled(true);
    for (let index = 0; index < 1200; index++) resolution.update(1000 / 60, index % 2 ? 17 : 12);
    expect(resolution.scale).toBe(1);
    run(resolution, 10, 1000 / 30, 24);
    expect(resolution.scale).toBe(.7);
    run(resolution, 2, 1000 / 60, 8);
    expect(resolution.scale).toBe(.7);
    run(resolution, 7, 1000 / 60, 8);
    expect(resolution.scale).toBeGreaterThan(.7);
    expect(resolution.scale).toBeLessThan(.8);
    run(resolution, 100, 1000 / 60, 8);
    expect(resolution.scale).toBe(1);
  });

  it('ignores invalid/loading stalls, preserves manual disable and resets deterministically', () => {
    const resolution = new AdaptiveResolution();
    resolution.setEnabled(true);
    for (const value of [0, -1, NaN, Infinity, 1000]) for (let index = 0; index < 100; index++) resolution.update(value, 24);
    expect(resolution.scale).toBe(1);
    run(resolution, 10, 33, 24);
    resolution.setEnabled(false);
    expect(resolution.scale).toBe(1);
    run(resolution, 20, 33, 24);
    expect(resolution.scale).toBe(1);
    resolution.setEnabled(true);
    expect(resolution.snapshot.smoothedMs).toBe(0);
  });
});

it('validates additive graphic options while old preferences inherit tier defaults', () => {
  expect(GRAPHICS_PRESETS.high).toMatchObject({ inkOutlines: 'full', stylizedShading: true, adaptiveResolution: true });
  expect(GRAPHICS_PRESETS.low).toMatchObject({ inkOutlines: 'silhouette', stylizedShading: true, adaptiveResolution: false });
  expect(resolveGraphicsOptions(GRAPHICS_PRESETS.high, {})).toEqual(GRAPHICS_PRESETS.high);
  expect(resolveGraphicsOptions(GRAPHICS_PRESETS.high, { inkOutlines: 'off', stylizedShading: false, adaptiveResolution: false })).toMatchObject({ inkOutlines: 'off', stylizedShading: false, adaptiveResolution: false });
  expect(resolveGraphicsOptions(GRAPHICS_PRESETS.high, { inkOutlines: 'invalid', stylizedShading: 1, adaptiveResolution: 'yes' } as never)).toEqual(GRAPHICS_PRESETS.high);
  for (const key of Object.keys(GRAPHICS_PRESETS.high)) expect(GRAPHICS_OPTION_LABELS[key as keyof typeof GRAPHICS_OPTION_LABELS].label).toBeTruthy();
});
