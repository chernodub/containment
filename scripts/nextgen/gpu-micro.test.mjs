import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { fitGpuMicro } from './gpu-micro-fit.mjs';
import { createGpuMicroQueryQueue, runGpuMicro } from './gpu-micro.mjs';

function samples(fn = repeats => 3 + repeats * .5, cpu = repeats => repeats * .01) {
  return [1, 8, 32].flatMap(repeats => [0, 1].map(sample => ({ repeats, sample, status: 'resolved', gpuMs: fn(repeats) + sample * .01, cpuSubmissionMs: cpu(repeats) })));
}

describe('amplified throughput fit acceptance', () => {
  it('reports the linear minimum envelope slope/intercept and paired CPU, never FPS or pass latency', () => {
    const fit = fitGpuMicro(samples());
    assert.equal(fit.supported, true);
    assert.equal(fit.timingAcceptanceEligible, false);
    assert(Math.abs(fit.estimateMsPerRepeat - .5) < 1e-12);
    assert(Math.abs(fit.gpuFit.interceptMs - 3) < 1e-12);
    assert.equal(fit.gpuFit.rSquared, 1);
    assert.deepEqual(fit.counts.map(group => group.samples), [2, 2, 2]);
    assert(fit.estimateKind.includes('not isolated pass latency'));
    assert.deepEqual(fit.counts.map(group => group.pairedCpuSubmissionMs), [.01, .08, .32]);
  });
  it.each([
    ['flat-or-negative-slope', samples(() => 20)],
    ['flat-or-negative-slope', samples(repeats => 20 - repeats * .1)],
    ['nonlinear-repeat-response', samples(repeats => ({ 1: 3, 8: 6, 32: 8 })[repeats])],
    ['amplification-below-resolution-floor', samples(repeats => 20 + repeats * .002)],
    ['gpu-slope-not-separated-from-cpu-submission', samples(repeats => 3 + repeats * .02, repeats => repeats * .03)],
  ])('rejects %s rather than inventing a stage cost', (reason, raw) => {
    const fit = fitGpuMicro(raw);
    assert.equal(fit.supported, false); assert.equal(fit.estimateMsPerRepeat, null);
    assert(fit.reasons.includes(reason));
  });
  it('requires two valid completed samples at every count and rejects within-count noise', () => {
    const incomplete = samples().filter(row => !(row.repeats === 8 && row.sample === 1));
    assert(fitGpuMicro(incomplete).reasons.includes('insufficient-resolved-samples'));
    const noisy = samples().map(row => row.sample ? { ...row, gpuMs: row.gpuMs * 2 } : row);
    assert(fitGpuMicro(noisy).reasons.includes('noisy-within-count-samples'));
    const invalid = samples().map(row => row.repeats === 32 ? { ...row, status: 'disjoint' } : row);
    assert(fitGpuMicro(invalid).reasons.includes('insufficient-resolved-samples'));
  });
  it('keeps the CPU value paired with the selected minimum GPU observation', () => {
    const raw = samples().map(row => row.sample ? { ...row, gpuMs: row.gpuMs - .1, cpuSubmissionMs: row.cpuSubmissionMs * 2 } : row);
    const fit = fitGpuMicro(raw);
    assert.deepEqual(fit.counts.map(group => group.selectedSample), [1, 1, 1]);
    assert.deepEqual(fit.counts.map(group => group.pairedCpuSubmissionMs), [.02, .16, .64]);
  });
});

function fakeGL() {
  const extension = { TIME_ELAPSED_EXT: 1, GPU_DISJOINT_EXT: 2 };
  let active = null, serial = 0, available = false, disjoint = false, lost = false, resultReads = 0;
  const deleted = [], queries = [];
  const gl = {
    CURRENT_QUERY: 3, QUERY_RESULT_AVAILABLE: 4, QUERY_RESULT: 5,
    drawingBufferWidth: 256, drawingBufferHeight: 128,
    getExtension: () => extension, isContextLost: () => lost, getError: () => 0,
    getParameter: () => disjoint, getQuery: () => active,
    createProgram() { return {}; },
    createQuery() { const query = { serial: ++serial, draws: 0 }; queries.push(query); return query; },
    beginQuery(target, query) { assert.equal(active, null); active = query; },
    endQuery() { assert(active); active.nanoseconds = (3 + active.draws * .5) * 1e6; active = null; },
    getQueryParameter(query, name) { if (name === 4) return available; resultReads++; return query.nanoseconds; },
    deleteQuery(query) { assert(!deleted.includes(query), 'query retired exactly once'); deleted.push(query); },
  };
  return { gl, extension, deleted, queries, draw() { if (active) active.draws++; }, setAvailable(value) { available = value; }, setDisjoint(value) { disjoint = value; }, setLost(value) { lost = value; }, setForeign(value) { active = value; }, get resultReads() { return resultReads; } };
}

describe('actual browser micro query queue lifecycle', () => {
  it('reads only available results and enforces one active query plus bounded pending handles', () => {
    const f = fakeGL(), q = createGpuMicroQueryQueue(f.gl, f.extension, { maximumPending: 2 });
    const a = {}, b = {}, c = {};
    assert(q.begin(a, 0, 0)); f.draw(); q.end(1);
    assert(q.begin(b, 1, 1)); q.end(2);
    assert.equal(q.begin(c, 2, 2), false); assert.equal(c.status, 'capacity');
    q.poll(2, 2); assert.equal(f.resultReads, 0); assert.equal(q.pendingCount, 2);
    f.setAvailable(true); q.poll(3, 3);
    assert.equal(a.status, 'resolved'); assert.equal(a.gpuMs, 3.5);
    assert.equal(q.pendingCount, 0); assert.equal(f.deleted.length, 2);
    q.dispose(); q.dispose(); assert.equal(f.deleted.length, 2);
  });
  it('rejects foreign active queries and invalidates pending disjoint/stale observations', () => {
    const f = fakeGL(), q = createGpuMicroQueryQueue(f.gl, f.extension, { maximumAgeFrames: 3, maximumAgeMs: 10 });
    f.setForeign({}); const busy = {}; assert.equal(q.begin(busy, 0, 0), false); assert.equal(busy.status, 'busy'); f.setForeign(null);
    const disjoint = {}; q.begin(disjoint, 0, 0); q.end(1); f.setDisjoint(true); q.poll(1, 1);
    assert.equal(disjoint.status, 'disjoint'); assert.equal(f.resultReads, 0); f.setDisjoint(false);
    const stale = {}; q.begin(stale, 2, 2); q.end(3); q.poll(6, 6);
    assert.equal(stale.status, 'stale'); assert.equal(q.pendingCount, 0);
    q.dispose(); assert.equal(f.deleted.length, 2);
  });
  it('abandons lost-context handles without calling into a dead context and disposes active queries', () => {
    const f = fakeGL(), q = createGpuMicroQueryQueue(f.gl, f.extension);
    const lost = {}; q.begin(lost, 0, 0); q.end(1); f.setLost(true); q.poll(1, 1); q.dispose();
    assert.equal(lost.status, 'context-lost'); assert.equal(f.deleted.length, 0);
    const live = fakeGL(), active = createGpuMicroQueryQueue(live.gl, live.extension), sample = {};
    active.begin(sample, 0, 0); active.dispose(); active.dispose();
    assert.equal(sample.status, 'abandoned'); assert.equal(live.deleted.length, 1);
  });
});

function runnerFixture(throwDraw = false) {
  const f = fakeGL(); f.setAvailable(true);
  let clock = 0, normalCalls = 0, target = null, clearAlpha = .7, scissorTest = true;
  const value = fields => ({ ...fields, clone() { return value(fields); } });
  let clear = value({ r: .1, g: .2, b: .3 }), viewport = value({ x: 1, y: 2, z: 3, w: 4 }), scissor = value({ x: 5, y: 6, z: 7, w: 8 });
  const game = { status: 'playing', elapsed: 42, player: { moving: true }, pause() { this.status = 'paused'; this.player.moving = false; }, resume() { this.status = 'playing'; } };
  const timerChanges = [], timer = { enabled: true, setEnabled(enabled) { this.enabled = enabled; timerChanges.push(enabled); } };
  const renderer = {
    getContext: () => f.gl, getRenderTarget: () => target, setRenderTarget(next) { target = next; },
    toneMapping: 7, toneMappingExposure: 1.2, autoClear: false,
    getClearColor(out) { return out.copy(clear); }, getClearAlpha: () => clearAlpha,
    setClearColor(next, alpha) { clear = next; clearAlpha = alpha; },
    getViewport(out) { return out.copy(viewport); }, setViewport(next) { viewport = next; },
    getScissor(out) { return out.copy(scissor); }, setScissor(next) { scissor = next; },
    getScissorTest: () => scissorTest, setScissorTest(next) { scissorTest = next; },
    info: { render: { calls: 7, triangles: 123, frame: 2 }, programs: [] },
    shadowMap: { autoUpdate: true, needsUpdate: true },
  };
  const resources = { extract: { name: 'extract' }, composite: { name: 'composite' }, bloomA: { width: 64, height: 32 }, present: { width: 256, height: 128 } };
  const post = {
    resources, tier: 'high', options: { bloom: true, ambientOcclusion: false }, gpuTimer: timer,
    draw() { if (throwDraw) throw Error('fixture draw failure'); renderer.info.render.calls++; f.draw(); clock += .01; },
    render(dt) { assert.equal(dt, 0); assert.equal(game.status, 'paused'); assert.equal(this.gpuTimer.enabled, false); assert.equal(renderer.shadowMap.autoUpdate, false); this.draw(resources.extract, resources.bloomA); this.draw(resources.composite, resources.present); },
  };
  const root = { game, renderer: { renderer, post, render() { normalCalls++; } }, refresh() { this.renderer.render(); renderer.toneMapping = 99; renderer.autoClear = true; } };
  const original = { render: root.renderer.render, draw: post.draw, create: f.gl.createProgram };
  return { root, f, timerChanges, original, renderer, get normalCalls() { return normalCalls; }, configuration: { root, stages: ['bloomExtract'], samples: 2, now: () => clock, requestFrame(callback) { clock++; root.renderer.render(); callback(clock); } } };
}

describe('post-trial micro isolation and restoration', () => {
  it('repeats one stage1/8/32 twice with fixed post inputs and restores simulation, wrappers, counts and render state', async () => {
    const f = runnerFixture(), result = await runGpuMicro(f.configuration);
    assert.equal(result.error, undefined); assert.equal(result.restoreError, undefined);
    assert.equal(result.programCreations, 0); assert.equal(result.simulation.unchanged, true);
    assert.equal(result.timingAcceptanceEligible, false);
    assert.deepEqual(result.stages[0].samples.map(sample => sample.repeats), [1, 8, 32, 32, 8, 1]);
    assert(result.stages[0].samples.every(sample => sample.status === 'resolved'));
    assert.equal(f.normalCalls, 1, 'ordinary presentation frozen until final refresh');
    assert.equal(f.root.game.status, 'playing'); assert.equal(f.root.game.player.moving, true);
    assert.equal(f.root.renderer.render, f.original.render); assert.equal(f.root.renderer.post.draw, f.original.draw); assert.equal(f.f.gl.createProgram, f.original.create);
    assert.deepEqual(f.renderer.info.render, { calls: 7, triangles: 123, frame: 2 });
    assert.equal(f.renderer.toneMapping, 7); assert.equal(f.renderer.autoClear, false);
    assert.deepEqual(f.timerChanges, [false, true]); assert.equal(f.f.deleted.length, 6);
  });
  it('restores all ownership after a repeated draw throws', async () => {
    const f = runnerFixture(true), result = await runGpuMicro(f.configuration);
    assert(result.error.includes('fixture draw failure'));
    assert.equal(f.root.game.status, 'playing'); assert.equal(f.root.game.player.moving, true);
    assert.equal(f.root.renderer.render, f.original.render); assert.equal(f.root.renderer.post.draw, f.original.draw); assert.equal(f.f.gl.createProgram, f.original.create);
    assert.equal(f.renderer.toneMapping, 7); assert.deepEqual(f.timerChanges, [false, true]);
    assert.equal(f.f.deleted.length, 1);
  });
  it('keeps an already paused game paused and records cold optional Low stages as unsupported', async () => {
    const f = runnerFixture(); f.root.game.status = 'paused'; f.root.game.player.moving = false;
    f.root.renderer.post.tier = 'low';
    const result = await runGpuMicro({ ...f.configuration, stages: ['gtao', 'bloomExtract', 'composite'] });
    assert.equal(result.error, undefined); assert.equal(f.root.game.status, 'paused');
    assert.equal(f.root.game.player.moving, false);
    assert(result.stages[0].unsupportedReason); assert(result.stages[1].unsupportedReason);
    assert.equal(result.stages[2].samples.length, 6); assert.equal(result.programCreations, 0);
  });
  it('records every new program creation so the external zero-program guard stays fatal', async () => {
    const f = runnerFixture(), post = f.root.renderer.post, original = post.draw;
    post.draw = function (...parameters) { f.f.gl.createProgram(); return original.apply(this, parameters); };
    const result = await runGpuMicro(f.configuration);
    assert(result.programCreations > 0);
    assert.equal(f.root.game.status, 'playing');
    assert.equal(f.f.gl.createProgram, f.original.create);
  });
  it('restores prototype method ownership without leaving own wrapper properties', async () => {
    const f = runnerFixture(), root = f.root.renderer, post = root.post;
    const draw = post.draw, render = root.render;
    delete post.draw; Object.setPrototypeOf(post, { draw });
    delete root.render; Object.setPrototypeOf(root, { render });
    const result = await runGpuMicro(f.configuration);
    assert.equal(result.error, undefined);
    assert.equal(Object.hasOwn(post, 'draw'), false);
    assert.equal(Object.hasOwn(root, 'render'), false);
    assert.equal(post.draw, draw); assert.equal(root.render, render);
  });
  it('keeps scene/shadow/HUD explicitly unsupported without allocating a synthetic scene path', async () => {
    const f = runnerFixture(), result = await runGpuMicro({ ...f.configuration, stages: ['sceneColor', 'shadows', 'hud'] });
    assert.equal(result.unsupportedReason, 'no-enabled-requested-post-stage');
    assert(result.stages.every(stage => stage.unsupportedReason));
    assert.equal(f.f.queries.length, 0); assert.deepEqual(f.timerChanges, []);
  });
});
