import assert from 'node:assert/strict';
import { it as test } from 'vitest';
import { installGpuPassAudit } from './gpu-pass-audit.mjs';

function fixture() {
  const extension = { TIME_ELAPSED_EXT: 1, GPU_DISJOINT_EXT: 2 };
  let current = null, serial = 0, available = false, disjoint = false, lost = false;
  const deleted = [], queries = [], events = [];
  const gl = {
    CURRENT_QUERY: 3, QUERY_RESULT_AVAILABLE: 4, QUERY_RESULT: 5,
    drawingBufferWidth: 1920, drawingBufferHeight: 1080,
    getExtension: () => extension, isContextLost: () => lost,
    getParameter: () => disjoint, getQuery: () => current,
    createQuery() { const query = { serial: ++serial }; queries.push(query); return query; },
    beginQuery(target, query) { assert.equal(current, null, 'queries must never nest'); current = query; events.push('begin'); },
    endQuery() { assert(current); current = null; events.push('end'); },
    flush() { events.push('flush'); },
    getQueryParameter(query, name) { return name === 4 ? available : query.serial * 1e6; },
    deleteQuery(query) { deleted.push(query); },
  };
  const scene = {}, hudScene = {}, composite = {}, bloomA = { width: 480, height: 270 };
  const renderer = { getContext: () => gl, getRenderTarget: () => null, render() { events.push('render'); } };
  const post = { resources: { composite }, draw(material, target) { renderer.render({}); }, render() { renderer.render(scene); post.draw(composite, bloomA); } };
  const r = { renderer, scene, hudScene, post, render() { post.render(); renderer.render(hudScene); } };
  return { r, gl, queries, deleted, events, setAvailable: value => available = value, setDisjoint: value => disjoint = value, setLost: value => lost = value, setCurrent: value => current = value };
}

test('GPU pass audit resolves asynchronously, keeps stage pixels and restores hooks', () => {
  const f = fixture(), original = { render: f.r.render, scene: f.r.renderer.render, draw: f.r.post.draw };
  installGpuPassAudit(f.r);
  const audit = f.r.__benchGpuPassAudit;
  for (let i = 0; i < 10; i++) f.r.render();
  assert.equal(f.queries.length, 3);
  assert.equal(audit.snapshot().passes[0].samplesMs.length, 0);
  f.setAvailable(true);
  const snapshot = audit.snapshot();
  assert.deepEqual(snapshot.passes.map(p => p.name), ['sceneColor', 'composite', 'hud']);
  assert.deepEqual(snapshot.passes[1].resolutions, [{ width: 480, height: 270, pixels: 129600 }]);
  assert.deepEqual(snapshot.passes.map(p => p.samplesMs), [[1], [2], [3]]);
  assert.equal(f.deleted.length, 3);
  audit.dispose(); audit.dispose();
  assert.equal(f.r.render, original.render); assert.equal(f.r.renderer.render, original.scene); assert.equal(f.r.post.draw, original.draw);
  assert.equal(Object.hasOwn(f.r, '__benchGpuPassAudit'), false);
});

test('disjoint invalidates pending queries, busy contexts never nest, disposal retires pending', () => {
  const f = fixture(); installGpuPassAudit(f.r); const audit = f.r.__benchGpuPassAudit;
  for (let i = 0; i < 10; i++) f.r.render(); f.setDisjoint(true); audit.poll();
  assert.equal(f.deleted.length, 3); assert.equal(audit.snapshot().passes.every(p => p.samplesMs.length === 0), true);
  f.setDisjoint(false); f.setCurrent({ foreign: true });
  for (let i = 0; i < 9; i++) f.r.render();
  assert.equal(f.queries.length, 3); assert.equal(audit.diagnostics.skippedBusy, 3);
  f.setCurrent(null); for (let i = 0; i < 9; i++) f.r.render();
  assert.equal(f.queries.length, 6);
  audit.dispose(); assert.equal(f.deleted.length, 6); assert.equal(audit.diagnostics.abandonedQueries, 3);
});

test('lost context abandons pending query handles safely', () => {
  const f = fixture(); installGpuPassAudit(f.r); const audit = f.r.__benchGpuPassAudit;
  for (let i = 0; i < 10; i++) f.r.render(); f.setLost(true); audit.poll(); audit.dispose();
  assert.equal(f.deleted.length, 0); assert.equal(audit.diagnostics.abandonedQueries, 3);
});

test('one selected stage per frame prevents Metal command-buffer query overlap and restores runtime timer', () => {
  const f = fixture(), changes = [];
  f.r.post.gpuTimer = { enabled: true, setEnabled(value) { this.enabled = value; changes.push(value); } };
  installGpuPassAudit(f.r);
  assert.equal(f.r.post.gpuTimer.enabled, false);
  for (let frame = 0; frame < 90; frame++) {
    const previous = f.queries.length;
    f.r.render();
    assert(f.queries.length - previous <= 1, 'only one GPU stage may be queried in a frame');
  }
  assert.equal(f.queries.length, 29);
  f.r.__benchGpuPassAudit.dispose();
  assert.deepEqual(changes, [false, true]);
});

test('explicit flush profile requests submission boundaries without waiting and labels the snapshot', () => {
  const f = fixture();
  installGpuPassAudit({ rendererRoot: f.r, flush: true });
  for (let i = 0; i < 4; i++) f.r.render();
  const first = f.events.indexOf('flush');
  assert.deepEqual(f.events.slice(first, first + 5), ['flush', 'begin', 'render', 'end', 'flush']);
  const snapshot = f.r.__benchGpuPassAudit.snapshot();
  assert.equal(snapshot.flush, true);
  assert.equal(snapshot.diagnostics.flushCalls, 2);
  assert.equal(f.queries.length, 1);
  f.r.__benchGpuPassAudit.dispose();
});

test('shadow queries require an enabled dirty map and retain actual bound map dimensions', () => {
  const f = fixture(), map = { width: 1024, height: 512 }, light = { shadow: { map } };
  const renderer = f.r.renderer, original = renderer.render;
  renderer.setRenderTarget = () => {};
  renderer.shadowMap = { enabled: true, autoUpdate: false, needsUpdate: false, render(lights) {
    if (!this.enabled || !(this.autoUpdate || this.needsUpdate)) return;
    for (const entry of lights) renderer.setRenderTarget(entry.shadow.map);
    renderer.setRenderTarget(null);
  } };
  renderer.render = function (scene, ...parameters) {
    if (scene === f.r.scene) this.shadowMap.render([light]);
    return original.call(this, scene, ...parameters);
  };
  installGpuPassAudit(f.r);
  for (let i = 0; i < 15; i++) f.r.render();
  assert.equal(f.r.__benchGpuPassAudit.snapshot().passes.some(pass => pass.name === 'shadows'), false);
  renderer.shadowMap.needsUpdate = true;
  for (let i = 0; i < 24; i++) f.r.render();
  const shadow = f.r.__benchGpuPassAudit.snapshot().passes.find(pass => pass.name === 'shadows');
  assert(shadow);
  assert.deepEqual(shadow.resolutions, [{ width: 1024, height: 512, pixels: 524288 }]);
  renderer.shadowMap.enabled = false;
  const previous = f.queries.length;
  for (let i = 0; i < 24; i++) f.r.render();
  assert(f.queries.length > previous, 'other stage queries keep rotating when shadow updates are absent');
  f.r.__benchGpuPassAudit.dispose();
});

test('final AA has its own GPU stage while preserved builds without it remain supported', () => {
  const f = fixture(), original = f.r.post.render;
  f.r.post.resources.antialias = {};
  f.r.post.render = function () { original.call(this);this.draw(this.resources.antialias,null); };
  installGpuPassAudit(f.r);
  for (let i = 0; i < 18; i++) f.r.render();
  const pass = f.r.__benchGpuPassAudit.snapshot().passes.find(entry => entry.name === 'finalAA');
  assert(pass);
  assert.deepEqual(pass.resolutions,[{width:1920,height:1080,pixels:2073600}]);
  f.r.__benchGpuPassAudit.dispose();
});
