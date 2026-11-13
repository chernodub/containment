import { describe, expect, it } from 'vitest';
import { AdaptiveResolution } from '../src/render/post/AdaptiveResolution';
import { RENDER_BUDGET } from '../src/render/FrameBudget';
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

  it('retains resolution through 60 seconds of steady work between the old and new GPU overload points',()=>{
    const resolution=new AdaptiveResolution();resolution.setEnabled(true);
    expect(RENDER_BUDGET.gpuTargetMs).toBe(16.5);
    run(resolution,60,1000/60,16);
    expect(resolution.scale).toBe(1);expect(resolution.snapshot.source).toBe('gpu');
    expect(resolution.snapshot.smoothedMs).toBeCloseTo(16);
    // External frame acceptance and resource bounds are independent of tuning.
    expect(RENDER_BUDGET).toMatchObject({highFrameP50Ms:16.7,highFrameP95Ms:20,lowFrameP50Ms:16.7,drawCalls:330,preparationMs:3000,adaptiveMinScale:.8,adaptiveMaxScale:1});
  });

  it('still downshifts for sustained work above the derived GPU overload threshold',()=>{
    const resolution=new AdaptiveResolution();resolution.setEnabled(true);
    const overload=RENDER_BUDGET.gpuTargetMs+1;
    run(resolution,60,1000/60,overload);
    expect(resolution.scale).toBe(1);
    // New operating point changes neither the .65s pressure requirement nor
    // the .025 step; this is not an extended benchmark-only grace period.
    resolution.update(1000/60,overload+.5);
    run(resolution,.5,1000/60,overload+.5);
    expect(resolution.scale).toBe(1);
    run(resolution,2,1000/60,overload+.5);
    expect(resolution.scale).toBeLessThan(1);
    run(resolution,60,1000/60,overload+.5);
    expect(resolution.scale).toBe(.8);
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
    expect(resolution.scale).toBe(.8);
    expect(changes).toBe(8);
    expect(resolution.snapshot.source).toBe('gpu');
  });

  it('uses hysteresis through noisy camera/combat intervals and recovers slowly', () => {
    const resolution = new AdaptiveResolution();
    resolution.setEnabled(true);
    for (let index = 0; index < 1200; index++) resolution.update(1000 / 60, index % 2 ? 17 : 12);
    expect(resolution.scale).toBe(1);
    run(resolution, 10, 1000 / 30, 24);
    expect(resolution.scale).toBe(.8);
    run(resolution, 2, 1000 / 60, 8);
    expect(resolution.scale).toBe(.8);
    run(resolution, 7, 1000 / 60, 8);
    expect(resolution.scale).toBeGreaterThan(.8);
    expect(resolution.scale).toBeLessThan(.9);
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
