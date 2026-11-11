import {describe, expect, it} from 'vitest';
import {aggregateReports, median, memoryTrend, parseArguments, renderSummary, summarizeRun} from './aggregate.mjs';

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
