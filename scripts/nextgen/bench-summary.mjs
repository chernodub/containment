#!/usr/bin/env node
/** Offline F11 attribution and comparison; never launches a browser. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname, basename, extname} from 'node:path';
import {attributeCpuSelf} from './bench-cpu.mjs';

const [beforeArgument, afterArgument, outputArgument] = process.argv.slice(2);
if (!beforeArgument || !afterArgument || !outputArgument) {
  throw Error('Usage: node scripts/nextgen/bench-summary.mjs <before-dir> <after-dir> <output.md>');
}
const output = resolve(outputArgument);
const warnings = [];

async function load(directory, label) {
  const root = resolve(directory);
  let report;
  try { report = JSON.parse(await readFile(resolve(root, 'benchmark.json'), 'utf8')); }
  catch (error) {
    if (label === 'before') throw error;
    warnings.push(`After report unavailable: ${String(error)}`);
    return {root, report: null, runs: []};
  }
  const runs = [];
  for (const run of report.runs ?? []) {
    let cpuSelf = run.profiling?.cpuSelf ?? null;
    let attributionError = null;
    try {
      const profile = JSON.parse(await readFile(resolve(root, run.name + '.cpuprofile'), 'utf8'));
      const dist = report.distSnapshot?.path;
      if (!dist) throw Error('Report does not record distSnapshot.path');
      cpuSelf = await attributeCpuSelf(profile, dist);
    } catch (error) {
      attributionError = String(error);
      warnings.push(`${label}/${run.name}: ${cpuSelf ? 'using saved attribution; offline re-attribution failed' : 'CPU attribution unavailable'} (${attributionError})`);
    }
    const activeSampleMs = Object.entries(cpuSelf?.milliseconds ?? {})
      .filter(([name]) => name !== 'idle').reduce((sum, [,value]) => sum + value, 0);
    const cpuSubsystems = Object.entries(cpuSelf?.milliseconds ?? {}).map(([name, milliseconds]) => ({
      name, milliseconds,
      activeFraction: name === 'idle' || !activeSampleMs ? null : milliseconds / activeSampleMs,
    })).sort((a, b) => b.milliseconds - a.milliseconds);
    runs.push({...run, cpuSelf, attributionError, activeSampleMs, cpuSubsystems});
  }
  return {root, report, runs};
}
const before = await load(beforeArgument, 'before');
const after = await load(afterArgument, 'after');
const key = run => `${run.room}/${run.rig}/${run.tier}/${run.repeat ?? 0}`;
const beforeRuns = new Map(before.runs.map(run => [key(run), run]));
const afterRuns = new Map(after.runs.map(run => [key(run), run]));
const keys = [...new Set([...beforeRuns.keys(), ...afterRuns.keys()])];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const number = (value, digits = 3) => finite(value) ? value.toFixed(digits) : 'unavailable';
const percent = value => finite(value) ? (value * 100).toFixed(1) + '%' : 'unavailable';
const pair = (a, b, digits) => `${number(a, digits)} → ${number(b, digits)}`;
const sampleStats = samples => {
  const sorted = (samples ?? []).filter(finite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  return {p50: sorted[Math.floor((sorted.length - 1) * .5)], p95: sorted[Math.ceil(sorted.length * .95) - 1]};
};
const passStats = pass => pass?.summaryMs ?? sampleStats(pass?.samplesMs);
const submissionCount = run => {
  const passes = run?.gpuPassTimings?.passes ?? [];
  const final = passes.find(pass => pass.name === 'finalAA');
  const finalDraws = final?.counts?.reduce((sum, row) => sum + (row.draws ?? 0), 0) ?? 0;
  if (finalDraws > 0) return finalDraws;
  const maximumFrame = passes.reduce((maximum, pass) => (pass.counts ?? []).reduce((value, row) => Math.max(value, row.frame ?? 0), maximum), 0);
  return maximumFrame || run?.count || null;
};
const legacyFillDerived = (run, pass, field) => field === 'targetPixels' &&
  (run?.gpuPassTimings?.auditVersion ?? 1) < 2 &&
  ['mainOpaque', 'transparentVFX'].includes(pass?.name);
const meanCount = (run, pass, field) => {
  const denominator = submissionCount(run);
  if (!run || !pass?.counts || !(denominator > 0)) return null;
  // Version 1 grouped several actual renders under one public-root frame and
  // used max() for native footprints, irreversibly losing repeated coverage.
  const source = legacyFillDerived(run, pass, field)
    ? run.gpuPassTimings.passes.find(scope => scope.name === 'sceneColor') : pass;
  if (!source?.counts) return null;
  return source.counts.reduce((sum, row) => sum + (row[field] ?? 0), 0) / denominator;
};
const loadText = run => run ? `${run.before?.load?.map(value => number(value, 2)).join('/') ?? 'unavailable'} → ${run.after?.load?.map(value => number(value, 2)).join('/') ?? 'unavailable'} (${run.before?.cores ?? '?'} cores)` : 'unavailable';
const lines = [
  '# F11 renderer breakdown comparison', '',
  `Before: ${before.root}; source ${before.report?.sha ?? 'unrecorded'}.`, '',
  `After: ${after.root}; source ${after.report?.sha ?? 'unavailable'}.`, '',
  'GPU timer queries measure device execution intervals and can include shared-device contention. CPU sampling is exclusive sampled wall duration subject to host scheduling, not uncontended subsystem execution time. These instrumented observations do not certify the hardware frame budget.', '',
  'GPU scopes are ranked by before p50 (after p50 when no before sample exists). Never sum independently sampled percentiles. sceneColor includes native opaque, transparent, shadow and depth-copy work; exclusive scopes overlap that inclusive scope. Composite physically combines ink/outline, lens and grade. Missing samples stay unavailable.', '',
  'Draw/triangle/fill means below divide scope totals by actual render submissions counted by finalAA draws (one per shipping High/Low render), falling back to the maximum recorded frame ID and then observer count. This includes fixed-step refresh and RAF submissions, including frames where an intermittent scope did not execute. Fill means render-target footprint × named submissions, not actual fragment invocations or transparent overdraw. Memory is estimated texture payload, not driver allocation telemetry.', '',
];
const comparisons = [];
for (const scenario of keys) {
  const a = beforeRuns.get(scenario), b = afterRuns.get(scenario);
  lines.push(`## ${scenario}`, '');
  if (!a || !b) lines.push(`**${!a ? 'Before' : 'After'} run unavailable; this is not a completed before/after comparison.**`, '');
  for (const [label, run] of [['before', a], ['after', b]]) if (run) {
    lines.push(`${label} audit version: ${run.gpuPassTimings?.auditVersion ?? '1 (legacy)'}; denominator: ${submissionCount(run) ?? 'unavailable'} actual submissions.`, '');
    if ((run.gpuPassTimings?.auditVersion ?? 1) < 2) lines.push('Legacy native opaque/transparent fill is derived from summed sceneColor footprints divided by finalAA submissions: the old max-per-group field lost repeated footprints. This estimate assumes each native scope exists in each submission; it cannot recover absent-scope coverage. Legacy GPU frame grouping and counts are retained in the raw input.', '');
  }
  lines.push(`Host load (1/5/15 minute) before trial → after trial: baseline ${loadText(a)}; changed ${loadText(b)}.`, '',
    '| Observed metric | before → after |', '| --- | ---: |');
  for (const [label, field, statistic] of [
    ['frame p50 ms', 'frame', 'p50'], ['frame p95 ms', 'frame', 'p95'],
    ['CPU update/render/HUD p50 ms', 'cpu', 'p50'], ['CPU update/render/HUD p95 ms', 'cpu', 'p95'],
    ['UI-independent post envelope GPU p50 ms (frameTotal; ordinary total fallback)', 'gpu', 'p50'],
    ['adaptive scale minimum', 'adaptiveScale', 'min'], ['adaptive scale p50', 'adaptiveScale', 'p50'],
    ['draws maximum', 'draws', 'max'], ['triangles maximum', 'triangles', 'max'],
  ]) {const metric=run=>field==='gpu'?(passStats(run?.gpuPassTimings?.passes?.find(pass=>pass.name==='frameTotal'))?.[statistic]??run?.summary?.[field]?.[statistic]):run?.summary?.[field]?.[statistic];lines.push(`| ${label} | ${pair(metric(a),metric(b))} |`);}
  lines.push(`| mid-combat program creations | ${pair(a?.programs, b?.programs, 0)} |`, '');
  const aPasses = new Map((a?.gpuPassTimings?.passes ?? []).map(pass => [pass.name, pass]));
  const bPasses = new Map((b?.gpuPassTimings?.passes ?? []).map(pass => [pass.name, pass]));
  const scopes = [...new Set([...aPasses.keys(), ...bPasses.keys()])].sort((x, y) =>
    (passStats(aPasses.get(y))?.p50 ?? passStats(bPasses.get(y))?.p50 ?? -1) -
    (passStats(aPasses.get(x))?.p50 ?? passStats(bPasses.get(x))?.p50 ?? -1));
  lines.push('| GPU scope (ranked) | p50 ms before → after | p95 ms before → after | samples before → after | draws/frame before → after | triangles/frame before → after | target pixels/frame before → after |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const scope of scopes) {
    const ap = aPasses.get(scope), bp = bPasses.get(scope);
    lines.push(`| ${scope} | ${pair(passStats(ap)?.p50, passStats(bp)?.p50)} | ${pair(passStats(ap)?.p95, passStats(bp)?.p95)} | ${ap?.samplesMs?.length ?? 'unavailable'} → ${bp?.samplesMs?.length ?? 'unavailable'} | ${pair(meanCount(a, ap, 'draws'), meanCount(b, bp, 'draws'))} | ${pair(meanCount(a, ap, 'triangles'), meanCount(b, bp, 'triangles'))} | ${pair(meanCount(a, ap, 'targetPixels'), meanCount(b, bp, 'targetPixels'), 0)} |`);
  }
  lines.push('', '| Estimated memory | bytes before → after |', '| --- | ---: |');
  for (const [label, field] of [['scene textures', 'textureBytes'], ['render-target textures', 'renderTargetTextureBytes'], ['renderbuffers', 'renderbufferBytes']]) {
    lines.push(`| ${label} | ${pair(a?.gpuPassTimings?.memory?.[field], b?.gpuPassTimings?.memory?.[field], 0)} |`);
  }
  lines.push('', a?.gpuPassTimings?.memory?.assumptions ?? b?.gpuPassTimings?.memory?.assumptions ?? 'Memory inventory unavailable.', '',
    '| CPU subsystem | sampled ms before → after | fraction excluding idle before → after |', '| --- | ---: | ---: |');
  const ac = new Map((a?.cpuSubsystems ?? []).map(row => [row.name, row]));
  const bc = new Map((b?.cpuSubsystems ?? []).map(row => [row.name, row]));
  const categories = [...new Set([...ac.keys(), ...bc.keys()])].sort((x, y) => (ac.get(y)?.milliseconds ?? bc.get(y)?.milliseconds ?? 0) - (ac.get(x)?.milliseconds ?? bc.get(x)?.milliseconds ?? 0));
  for (const category of categories) lines.push(`| ${category} | ${pair(ac.get(category)?.milliseconds, bc.get(category)?.milliseconds)} | ${percent(ac.get(category)?.activeFraction)} → ${percent(bc.get(category)?.activeFraction)} |`);
  lines.push('', `Active sampled duration: ${pair(a?.activeSampleMs, b?.activeSampleMs)} ms. Idle remains separately visible; unknown samples are retained as unattributed.`, '',
    `Source maps resolved: before ${(a?.cpuSelf?.sourceMaps ?? []).join(', ') || 'none'}; after ${(b?.cpuSelf?.sourceMaps ?? []).join(', ') || 'none'}.`, '');
  const compact = run => run ? {
    name: run.name, room: run.room, rig: run.rig, tier: run.tier, repeat: run.repeat,
    hostBefore: run.before, hostAfter: run.after, summary: run.summary,
    actualSubmissionDenominator: submissionCount(run), auditVersion: run.gpuPassTimings?.auditVersion ?? 1,
    programs: run.programs, cpuSelf: run.cpuSelf, attributionError: run.attributionError,
    activeSampleMs: run.activeSampleMs, cpuSubsystems: run.cpuSubsystems,
    memory: run.gpuPassTimings?.memory ?? null,
    gpuScopes: (run.gpuPassTimings?.passes ?? []).map(pass => ({
      name: pass.name, scope: pass.scope, summaryMs: passStats(pass),
      samples: pass.samplesMs?.length ?? 0, resolutions: pass.resolutions,
      drawsPerFrame: meanCount(run, pass, 'draws'), trianglesPerFrame: meanCount(run, pass, 'triangles'),
      targetPixelsPerFrame: meanCount(run, pass, 'targetPixels'),
      targetPixelsDerivedFromLegacySceneColor: legacyFillDerived(run, pass, 'targetPixels'),
    })),
  } : null;
  comparisons.push({scenario, before: compact(a), after: compact(b)});
}
if (!keys.length) lines.push('No completed runs are available in either report.', '');
for (const [label, data] of [['before', before], ['after', after]]) {
  if (data.report?.errors?.length) lines.push(`## ${label} runner errors`, '', '```json', JSON.stringify(data.report.errors, null, 2), '```', '');
}
if (warnings.length) lines.push('## Attribution and input warnings', '', ...warnings.map(warning => '- ' + warning), '');
await mkdir(dirname(output), {recursive: true});
await writeFile(output, lines.join('\n'));
const attributionOutput = resolve(dirname(output), basename(output, extname(output)) + '.json');
await writeFile(attributionOutput, JSON.stringify({beforeDirectory: before.root, afterDirectory: after.root, warnings, comparisons}, null, 2));
console.log(`Wrote ${output} and ${attributionOutput}`);
