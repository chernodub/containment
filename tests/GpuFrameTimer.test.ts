import { describe, expect, it } from 'vitest';
import { GpuFrameTimer } from '../src/render/post/GpuProfiler';

function fixture(supported = true) {
  let active: object | null = null, disjoint = false, lost = false, created = 0, deleted = 0, begins = 0;
  const queries = new Set<object>(), ready = new Set<object>();
  const gl = {
    QUERY_RESULT_AVAILABLE: 1, QUERY_RESULT: 2, CURRENT_QUERY: 3,
    getExtension: () => supported ? { TIME_ELAPSED_EXT: 4, GPU_DISJOINT_EXT: 5 } : null,
    isContextLost: () => lost,
    getParameter: () => disjoint,
    getQuery: () => active,
    createQuery: () => { const query = {}; queries.add(query); created++; return query; },
    deleteQuery: (query: object) => { expect(queries.delete(query)).toBe(true); deleted++; },
    beginQuery: (_target: number, query: object) => { expect(active).toBeNull(); active = query; begins++; },
    endQuery: () => { expect(active).not.toBeNull(); active = null; },
    getQueryParameter: (query: object, parameter: number) => parameter === 1 ? ready.has(query) : 12_500_000,
  };
  return {
    gl: gl as unknown as WebGL2RenderingContext,
    complete() { for (const query of queries) ready.add(query); },
    disjoint() { disjoint = true; },
    contextLost() { lost = true; },
    externalQuery() { active = { external: true }; },
    clearExternal() { active = null; },
    get counts() { return { created, deleted, begins, pending: queries.size }; },
  };
}

describe('asynchronous adaptive GPU timer', () => {
  it('does no work when disabled or unsupported and avoids nesting external queries', () => {
    const f = fixture(), timer = new GpuFrameTimer(f.gl);
    timer.beginFrame(); timer.endFrame();
    expect(f.counts.created).toBe(0);
    timer.setEnabled(true); f.externalQuery();
    timer.beginFrame(); timer.endFrame();
    expect(f.counts.created).toBe(0);
    f.clearExternal();
    for (let frame = 0; frame < 16; frame++) { timer.beginFrame(); timer.endFrame(); }
    expect(f.counts.created).toBe(1);
    timer.dispose();
    const unsupported = fixture(false), unavailable = new GpuFrameTimer(unsupported.gl);
    unavailable.setEnabled(true); unavailable.beginFrame(); unavailable.endFrame(); unavailable.poll(); unavailable.dispose();
    expect(unavailable.supported).toBe(false);
    expect(unsupported.counts.created).toBe(0);
  });

  it('keeps query inventory bounded, samples sparsely, and reads only available results', () => {
    const f = fixture(), timer = new GpuFrameTimer(f.gl);
    timer.setEnabled(true);
    for (let frame = 0; frame < 320; frame++) { timer.beginFrame(); timer.endFrame(); timer.poll(); }
    expect(f.counts).toMatchObject({ created: 8, pending: 8 });
    expect(timer.latestMs).toBeUndefined();
    f.complete();
    expect(timer.poll()).toBe(12.5);
    expect(f.counts).toMatchObject({ deleted: 8, pending: 0 });
    expect(timer.snapshot.samples).toBe(8);
    timer.dispose(); timer.dispose();
  });

  it('rejects disjoint data, retires active/pending handles, and clears stale timing on disable', () => {
    const f = fixture(), timer = new GpuFrameTimer(f.gl);
    timer.setEnabled(true); timer.beginFrame(); timer.endFrame(); f.complete(); timer.poll();
    expect(timer.latestMs).toBe(12.5);
    for (let frame = 0; frame < 16; frame++) { timer.beginFrame(); timer.endFrame(); }
    f.disjoint();
    expect(timer.poll()).toBeUndefined();
    expect(timer.latestMs).toBeUndefined();
    expect(timer.snapshot.disjointSamples).toBe(1);
    timer.setEnabled(false);
    expect(f.counts.created).toBe(f.counts.deleted);
    timer.dispose();
    const activeFixture = fixture(), activeTimer = new GpuFrameTimer(activeFixture.gl);
    activeTimer.setEnabled(true); activeTimer.beginFrame(); activeTimer.dispose(); activeTimer.endFrame();
    expect(activeFixture.counts).toMatchObject({ created: 1, deleted: 1, pending: 0 });
  });

  it('does not call driver cleanup against a lost context', () => {
    const f = fixture(), timer = new GpuFrameTimer(f.gl);
    timer.setEnabled(true); timer.beginFrame(); f.contextLost(); timer.endFrame(); timer.dispose();
    expect(f.counts.deleted).toBe(0);
    expect(timer.enabled).toBe(false);
  });
});
