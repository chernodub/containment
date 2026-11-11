import {describe, expect, it} from 'vitest';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {aggregateReports, applyTriage, loadReport, median, memoryTrend, parseArguments, renderSummary, summarizeRun} from './aggregate.mjs';

function report(label, changes = {}) {
  return {
    label, seed: 10, rig: 'arc', assisted: false, legacy: false, roomLimit: 20,
    outcome: 'dead', errors: [], defects: [], checkpoints: [],
    rooms: [{id: 'first', depth: 0, result: 'clear', seconds: 10, damageDealt: {weapon: 20},
      abilityUses: {tactical: 2}, overdrives: 0,
      memoryStart: {heap: 100, geometries: 3, textures: 4}, memory: {heap: 120, geometries: 3, textures: 5},
      performance: {debugFixedStep: {samples: 100, retained: 100, updateRenderMs: {p50: 2, p95: 8, max: 30}}}},
    {id: 'second', depth: 1, result: 'dead', seconds: 30, damageTaken: 50}],
    ...changes,
  };
}

describe('campaign aggregation', () => {
  it('separates assisted and legacy runs and counts only endings as clears', () => {
    const summary = aggregateReports([
      {report: report('dead')}, {report: report('win', {outcome: 'complete'})},
      {report: report('limit', {outcome: 'room-limit'})},
      {report: report('assisted', {assisted: true})}, {report: report('queen', {legacy: true})},
    ]);
    const group = summary.groups.find(group => group.key === 'unassisted:story-v3:arc');
    expect(summary.groups).toHaveLength(3);
    expect(group.clearRate).toBe(1 / 3);
    expect(group.deathsByRoom).toEqual({'2: second': 1});
    expect(group.outcomes).toEqual({dead: 1, complete: 1, 'room-limit': 1});
  });

  it('pools individual room clear times, excluding deaths and interrupted attempts', () => {
    const summary = aggregateReports([
      {report: report('one')},
      {report: report('two', {rooms: [
        {result: 'clear', seconds: 40}, {result: 'clear', seconds: 50},
        {result: 'checkpoint-interrupted', seconds: 999}, {result: 'dead', seconds: 999},
      ]})},
    ]);
    expect(summary.groups[0].medianClearSeconds).toBe(40);
    expect(median([])).toBe(null);
    expect(median([1, 3, NaN, null])).toBe(2);
  });

  it('preserves exact fixed-step stats and never manufactures pooled percentiles', () => {
    const run = summarizeRun(report('a'));
    expect(run.fixedStep.latest.updateRenderMs).toEqual({p50: 2, p95: 8, max: 30});
    const summary = aggregateReports([{report: report('a')}, {report: report('b')}]);
    expect(summary.groups[0]).not.toHaveProperty('frame');
    expect(summary.groups[0]).not.toHaveProperty('p95');
    expect(summary.caveats.some(text => text.includes('never combined'))).toBe(true);
  });

  it('uses final authoritative totals, including a retained boundary after checkpoint rollback', () => {
    const run = summarizeRun(report('a', {final: {
      stats: {damageDealt: {ability: 100, weapon: 90}, abilityUses: {power: 3}, overdrivesUsed: 2, damageTaken: 14, creditsEarned: 80},
      run: {completedNodeIds: ['a', 'b', 'c']}, node: {depth: 3, templateId: 'fourth'},
      combat: {credits: 70}, build: {mutations: ['conductive-shell']},
    }}));
    expect(run.damageDealt).toEqual({ability: 100, weapon: 90});
    expect(run.roomsCleared).toBe(3);
    expect(run.deepestRoom).toBe(4);
    expect(run.deathRoom.id).toBe('fourth');
    expect(run.overdrives).toBe(2);
  });

  it('retains missing heap information and computes within-room and first-last resource deltas', () => {
    const trend = memoryTrend([
      {id: 'a', depth: 0, memoryStart: {heap: null, geometries: 10, textures: 4}, memory: {heap: null, geometries: 12, textures: 5}},
      {id: 'b', depth: 1, memoryStart: {heap: null, geometries: 20, textures: 8}, memory: {heap: null, geometries: 18, textures: 8}},
    ]);
    expect(trend.delta).toEqual({heap: null, geometries: 8, textures: 4});
    expect(trend.points[0].withinRoomDelta).toEqual({heap: null, geometries: 2, textures: 1});
    expect(trend.points[1].withinRoomDelta.geometries).toBe(-2);
  });

  it('keeps defects, errors and failed checkpoint evidence attached to seed and label', () => {
    const summary = aggregateReports([{path: '/tmp/run/report.json', report: report('bad', {
      errors: [{message: 'exception'}], defects: [{kind: 'stalled'}],
      checkpoints: [{label: 'starting-boon', passed: false, comparison: {differences: ['build']}}],
    })}]);
    expect(summary.findings.map(item => item.type)).toEqual(['error', 'defect']);
    expect(summary.findings[0]).toMatchObject({label: 'bad', seed: 10, reportPath: '/tmp/run/report.json'});
    expect(summary.runs[0].checkpoints[0].evidence).toBe('/tmp/run/checkpoints/starting-boon.json');
    expect(summary.groups[0].checkpoints).toEqual({total: 1, failed: 1});
  });

  it('requires explicit selection and deduplicates selected paths', () => {
    expect(() => parseArguments([], '/repo')).toThrow(/Supply/);
    expect(() => parseArguments(['--labels=../smoke'], '/repo')).toThrow(/Unsafe/);
    expect(parseArguments(['--labels=a,a,b'], '/repo').paths).toEqual([
      '/repo/artifacts/nextgen/playtest/a/report.json', '/repo/artifacts/nextgen/playtest/b/report.json',
    ]);
  });

  it('escapes report text in standalone HTML', () => {
    const html = renderSummary(aggregateReports([{report: report('<script>bad</script>')} ]));
    expect(html).not.toContain('<script>bad</script>');
    expect(html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(html).toContain('p95 8.00');
  });
});

describe('reviewed collector defect sidecars', () => {
  const dismissal = (evidence = 'defect-1.png') => ({
    evidence, status: 'dismissed', reason: 'Marine projection sampled during loading.',
    source: 'defect-1.json loading=true; inspected defect-1.png after load.',
  });

  it('annotates only exact evidence matches while retaining and not mutating all raw receipts', () => {
    const raw = report('reviewed', {
      defects: [Object.freeze({kind: 'hud-covers-marine', evidence: 'defect-1.png'}),
        Object.freeze({kind: 'room-loading>5s', evidence: 'loading-1.png'})],
      errors: [Object.freeze({type: 'console', message: 'real error'})],
    });
    Object.freeze(raw.defects);
    const original = structuredClone(raw), sidecar = {defects: [dismissal()]};
    const annotated = applyTriage(raw, sidecar);
    expect(raw).toEqual(original);
    expect(annotated.defects).toHaveLength(2);
    expect(annotated.defects[0]).toMatchObject({disposition: 'dismissed', reason: dismissal().reason, source: dismissal().source});
    expect(annotated.defects[1]).toEqual(raw.defects[1]);
    expect(annotated.errors).toBe(raw.errors);
    expect(annotated.triage).toEqual(sidecar);
    expect(annotated.triage).not.toBe(sidecar);
  });

  it('cannot dismiss a different evidence spelling, an unknown entry or evidence-free findings', () => {
    const raw = report('unmatched', {defects: [
      {kind: 'exact-extension', evidence: 'defect-1.png'}, {kind: 'missing'},
      {kind: 'empty', evidence: ''}, {kind: 'whitespace', evidence: ' '},
      {kind: 'non-string', evidence: 123},
    ]});
    const sidecar = {defects: [dismissal('defect-1'), dismissal('unseen.png'), dismissal('123')]};
    const run = summarizeRun(applyTriage(raw, sidecar));
    expect(run.defects).toEqual(raw.defects);
    expect(run.dismissedDefects).toEqual([]);
    expect(run.triage).toEqual(sidecar);
  });

  it('keeps active invariants and console errors counted while exposing dismissal evidence in JSON and HTML', () => {
    const raw = report('reviewed', {defects: [
      {kind: 'hud-covers-marine', evidence: 'defect-1.png'},
      {kind: 'invalid-combat-resource', evidence: 'invalid.png'},
    ], errors: [{type: 'console', message: 'real error'}]});
    const sidecar = {defects: [dismissal()]};
    const summary = aggregateReports([{report: raw, path: '/tmp/run/report.json', triage: sidecar}]);
    expect(summary.groups[0]).toMatchObject({defects: 1, dismissedDefects: 1, errors: 1});
    expect(summary.runs[0].defects[0].kind).toBe('invalid-combat-resource');
    expect(summary.runs[0].dismissedDefects[0].evidence).toBe('defect-1.png');
    expect(summary.runs[0].triage).toEqual(sidecar);
    expect(summary.findings.map(item => item.type)).toEqual(['error', 'defect']);
    expect(summary.dismissedFindings[0]).toMatchObject({type: 'dismissed-collector-defect', evidencePath: '/tmp/run/defect-1.png'});
    expect(JSON.stringify(summary)).toContain(dismissal().reason);
    const html = renderSummary(summary);
    expect(html).toContain('Dismissed collector findings');
    expect(html).toContain(dismissal().reason);
    expect(html).toContain('invalid-combat-resource');
    expect(html).toContain('real error');
  });

  it('rejects malformed, unsupported, duplicate and evidence-free sidecar entries', () => {
    for (const invalid of [null, [], {}, {defects: null}, {defects: [dismissal('')]},
      {defects: [{...dismissal(), status: 'accepted'}]},
      {defects: [{...dismissal(), reason: ' '}]}, {defects: [{...dismissal(), source: ''}]},
      {defects: [dismissal(), dismissal()]},
    ]) expect(() => applyTriage(report('bad-sidecar'), invalid)).toThrow(/Malformed triage/);
  });

  it('loads optional sibling sidecars but ignores only ENOENT, not invalid JSON, schema or filesystem errors', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'containment-triage-'));
    const path = join(directory, 'report.json'), sidecarPath = join(directory, 'triage.json');
    try {
      await writeFile(path, JSON.stringify(report('disk', {defects: [{kind: 'hud-covers-marine', evidence: 'defect-1.png'}]})));
      const absent = await loadReport(path);
      expect(absent.report.defects[0]).not.toHaveProperty('disposition');
      await writeFile(sidecarPath, JSON.stringify({defects: [dismissal()]}));
      expect((await loadReport(path)).report.defects[0].disposition).toBe('dismissed');
      await writeFile(sidecarPath, '{ broken');
      await expect(loadReport(path)).rejects.toBeInstanceOf(SyntaxError);
      await writeFile(sidecarPath, 'null');
      await expect(loadReport(path)).rejects.toThrow(/Malformed triage/);
      await rm(sidecarPath);
      await mkdir(sidecarPath);
      await expect(loadReport(path)).rejects.toMatchObject({code: 'EISDIR'});
    } finally { await rm(directory, {recursive: true, force: true}); }
  });
});
