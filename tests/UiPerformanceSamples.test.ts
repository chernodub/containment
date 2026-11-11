import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {NativeFrameSamples} from '../src/ui/performance';

describe('native RAF CPU sample window', () => {
  it('reports an empty window and exact nearest-rank percentiles for observed costs', () => {
    const samples = new NativeFrameSamples();
    expect(samples.snapshot).toMatchObject({samples: 0, retained: 0, capacity: 240, p50: 0, p95: 0, max: 0, average: 0});
    for (const cost of [10, 2, 8, 6, 4]) samples.record(cost);
    expect(samples.snapshot).toMatchObject({samples: 5, retained: 5, p50: 6, p95: 10, max: 10, average: 6, windowMax: 10, windowAverage: 6});
  });

  it('evicts overwritten values from percentiles while preserving lifetime maximum and mean', () => {
    const samples = new NativeFrameSamples(3);
    for (const cost of [100, 1, 2, 3]) samples.record(cost);
    expect(samples.snapshot).toMatchObject({samples: 4, retained: 3, p50: 2, p95: 3, max: 100, average: 26.5, windowMax: 3, windowAverage: 2});
    for (const cost of [7, 8, 9]) samples.record(cost);
    expect(samples.snapshot).toMatchObject({samples: 7, retained: 3, p50: 8, p95: 9, max: 100, average: 130 / 7, windowMax: 9, windowAverage: 8});
    expect(samples.snapshot.scope).toContain('max/average/samples use page lifetime');
  });

  it('rejects invalid costs without consuming ring positions or poisoning later measurements', () => {
    const samples = new NativeFrameSamples(2);
    samples.record(5);
    for (const invalid of [NaN, Infinity, -Infinity, -1]) samples.record(invalid);
    samples.record(0);
    expect(samples.snapshot).toMatchObject({samples: 2, retained: 2, p50: 0, p95: 5, max: 5, average: 2.5});
    samples.record(3);
    expect(samples.snapshot).toMatchObject({samples: 3, retained: 2, p50: 0, p95: 3, max: 5, average: 8 / 3, windowAverage: 1.5});
  });

  it('does not expose mutable storage or mutate earlier returned snapshots', () => {
    const samples = new NativeFrameSamples(1);
    samples.record(4);
    const before = samples.snapshot;
    before.p50 = 999;
    expect(samples.snapshot.p50).toBe(4);
    samples.record(6);
    expect(before.retained).toBe(1);
    expect(before.max).toBe(4);
    expect(samples.snapshot).toMatchObject({p50: 6, max: 6, average: 5});
  });

  it('rejects invalid capacities before allocating a ring', () => {
    for (const invalid of [0, -1, 1.5, NaN, Infinity, 16_385]) expect(() => new NativeFrameSamples(invalid)).toThrow(RangeError);
  });

  it('records actual RAF update plus render timing in the existing performance hook', () => {
    const source = readFileSync(new URL('../src/ui/application.ts', import.meta.url), 'utf8');
    expect(source).toContain('nativeUpdateRenderMs: nativeFrameSamples.snapshot');
    expect(source).toMatch(/diagnostics\.record\(elapsed \* 1000, updated - started, rendered - updated\);\s*nativeFrameSamples\.record\(rendered - started\);/);
  });
});
