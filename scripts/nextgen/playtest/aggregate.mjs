#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const finite = value => typeof value === 'number' && Number.isFinite(value);
const cleared = room => ['clear', 'complete'].includes(room.result);
const sum = values => values.reduce((total, value) => total + (finite(value) ? value : 0), 0);

/** Median of individual observations; no percentile-of-percentiles aggregation. */
export function median(values) {
  const sorted = values.filter(finite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sumRecords(records) {
  const result = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record ?? {})) {
      if (finite(value)) result[key] = (result[key] ?? 0) + value;
    }
  }
  return result;
}

/** Preserve first/last resource measurements without interpreting room changes as leaks. */
export function memoryTrend(rooms) {
  const points = rooms.map(room => ({
    room: room.id, depth: room.depth + 1, result: room.result,
    start: room.memoryStart ?? null, end: room.memory ?? null,
    withinRoomDelta: Object.fromEntries(['heap', 'geometries', 'textures'].map(key => [key,
      finite(room.memory?.[key]) && finite(room.memoryStart?.[key])
        ? room.memory[key] - room.memoryStart[key] : null])),
  }));
  const delta = {}, first = {}, last = {}, peak = {};
  for (const key of ['heap', 'geometries', 'textures']) {
    const values = points.flatMap(point => [point.start?.[key], point.end?.[key]]).filter(finite);
    first[key] = values[0] ?? null;
    last[key] = values.at(-1) ?? null;
    peak[key] = values.length ? Math.max(...values) : null;
    delta[key] = values.length ? last[key] - first[key] : null;
  }
  return {first, last, peak, delta, points};
}

/** Reduce one runner report, retaining exact fixed-step percentile snapshots and provenance. */
export function summarizeRun(report, reportPath = null) {
  const rooms = report.rooms ?? [];
  const stats = report.final?.stats;
  const completedRooms = rooms.filter(cleared);
  const depthValues = rooms.map(room => room.depth).filter(finite);
  if (finite(report.final?.node?.depth)) depthValues.push(report.final.node.depth);
  const deepestRoom = depthValues.length ? Math.max(...depthValues) + 1 : 0;
  const lastRoom = rooms.at(-1);
  const deathRoom = report.outcome === 'dead'
    ? {id: report.final?.node?.templateId ?? lastRoom?.id ?? 'unknown',
      depth: finite(report.final?.node?.depth) ? report.final.node.depth + 1 : deepestRoom,
      cause: report.deathCause ?? report.final?.deathCause ?? null,
      nearbySourcesInferred: lastRoom?.damageSourcesInferred ?? {}} : null;
  const fixedStepSnapshots = rooms.filter(room => room.performance?.debugFixedStep).map(room => ({
    room: room.id, depth: room.depth + 1, result: room.result,
    ...room.performance.debugFixedStep,
  }));
  const finalFixedStep = report.final?.performance?.debugFixedStep;
  return {
    label: report.label, reportPath, rig: report.rig, seed: report.seed,
    assisted: report.assisted === true, incomingDamageScale: report.incomingDamageScale ?? 1,
    legacy: report.legacy === true, roomLimit: report.roomLimit,
    branch: report.branch, head: report.head, outcome: report.outcome,
    fullClear: report.outcome === 'complete', deepestRoom,
    roomsCleared: Math.max(completedRooms.length, report.final?.run?.completedNodeIds?.length ?? 0),
    medianClearSeconds: median(completedRooms.map(room => room.seconds)),
    clearSeconds: completedRooms.map(room => room.seconds).filter(finite),
    deathRoom, wallSeconds: report.wallSeconds ?? null,
    damageTaken: stats?.damageTaken ?? sum(rooms.map(room => room.damageTaken)),
    damageTakenSourcesInferred: sumRecords(rooms.map(room => room.damageSourcesInferred)),
    damageDealt: stats?.damageDealt ?? sumRecords(rooms.map(room => room.damageDealt)),
    abilityUses: stats?.abilityUses ?? sumRecords(rooms.map(room => room.abilityUses)),
    overdrives: stats?.overdrivesUsed ?? sum(rooms.map(room => room.overdrives)),
    creditsEarned: stats?.creditsEarned ?? null,
    creditsRemaining: report.final?.combat?.credits ?? lastRoom?.credits ?? null,
    boons: report.final?.build?.mutations ?? lastRoom?.boons ?? [],
    fixedStep: {
      latest: finalFixedStep ?? fixedStepSnapshots.at(-1) ?? null,
      snapshots: fixedStepSnapshots,
      scope: (report.checkpoints?.length ?? 0) ? 'Cumulative within each page lifetime; checkpoint page recreation resets samples.'
        : 'Cumulative within this page lifetime; percentile window is limited to retained samples.',
    },
    memory: memoryTrend(rooms), gpu: report.gpu, clock: report.clock,
    roomMetrics: rooms.map(room => ({
      id: room.id, depth: room.depth + 1, result: room.result, seconds: room.seconds ?? null,
      damageTaken: room.damageTaken ?? null, damageTakenSourcesInferred: room.damageSourcesInferred ?? {},
      damageDealt: room.damageDealt ?? {}, abilityUses: room.abilityUses ?? {},
      overdrives: room.overdrives ?? null, credits: room.credits ?? null, boons: room.boons ?? [],
    })),
    errors: report.errors ?? [], defects: report.defects ?? [],
    checkpoints: (report.checkpoints ?? []).map(receipt => ({
      label: receipt.label, passed: receipt.passed, expectedRollback: receipt.expectedRollback,
      beforePhase: receipt.before?.run?.phase, afterPhase: receipt.after?.run?.phase,
      comparison: receipt.comparison, error: receipt.error,
      evidence: reportPath ? join(dirname(reportPath), 'checkpoints', `${String(receipt.label).replace(/[^a-zA-Z0-9_-]/g, '-')}.json`) : null,
    })),
    limitations: report.limitations ?? [],
  };
}

/** Group only explicitly selected runs, separating assistance and legacy campaign graphs. */
export function aggregateReports(reports) {
  const runs = reports.map(({report, path}) => summarizeRun(report, path));
  const keys = [...new Set(runs.map(run => `${run.assisted ? 'assisted' : 'unassisted'}:${run.legacy ? 'legacy-v2' : 'story-v3'}:${run.rig}`))].sort();
  const groups = keys.map(key => {
    const selected = runs.filter(run => `${run.assisted ? 'assisted' : 'unassisted'}:${run.legacy ? 'legacy-v2' : 'story-v3'}:${run.rig}` === key);
    const deathsByRoom = {}, outcomes = {};
    for (const run of selected) {
      outcomes[run.outcome] = (outcomes[run.outcome] ?? 0) + 1;
      if (run.deathRoom) {
        const room = `${run.deathRoom.depth}: ${run.deathRoom.id}`;
        deathsByRoom[room] = (deathsByRoom[room] ?? 0) + 1;
      }
    }
    const damageDealt = sumRecords(selected.map(run => run.damageDealt));
    const totalDamage = sum(Object.values(damageDealt));
    const completedRoomCount = sum(selected.map(run => run.roomsCleared));
    const overdrives = sum(selected.map(run => run.overdrives));
    const roomIds = [...new Set(selected.flatMap(run => run.roomMetrics.map(room => room.id)))];
    const roomPacing = roomIds.map(id => {
      const attempts = selected.flatMap(run => run.roomMetrics.filter(room => room.id === id));
      const times = attempts.filter(cleared).map(room => room.seconds).filter(finite);
      return {id, depth: attempts[0].depth, attempts: attempts.length,
        clears: attempts.filter(cleared).length,
        medianClearSeconds: median(times), minClearSeconds: times.length ? Math.min(...times) : null,
        maxClearSeconds: times.length ? Math.max(...times) : null,
        damageTaken: sum(attempts.map(room => room.damageTaken)),
      };
    }).sort((a, b) => a.depth - b.depth);
    return {
      key, rig: selected[0].rig, assisted: selected[0].assisted, legacy: selected[0].legacy,
      runs: selected.length, labels: selected.map(run => run.label),
      deepestRoom: Math.max(...selected.map(run => run.deepestRoom)),
      fullClears: selected.filter(run => run.fullClear).length,
      clearRate: selected.filter(run => run.fullClear).length / selected.length,
      outcomes, medianClearSeconds: median(selected.flatMap(run => run.clearSeconds)),
      deathsByRoom, damageTaken: sum(selected.map(run => run.damageTaken)), damageDealt,
      damageTakenSourcesInferred: sumRecords(selected.map(run => run.damageTakenSourcesInferred)),
      roomPacing,
      damageShare: Object.fromEntries(Object.entries(damageDealt).map(([source, damage]) => [source, totalDamage ? damage / totalDamage : 0])),
      abilityUses: sumRecords(selected.map(run => run.abilityUses)), overdrives,
      clearedRoomsPerOverdrive: overdrives ? completedRoomCount / overdrives : null,
      errors: sum(selected.map(run => run.errors.length)), defects: sum(selected.map(run => run.defects.length)),
      checkpoints: {total: sum(selected.map(run => run.checkpoints.length)), failed: sum(selected.map(run => run.checkpoints.filter(receipt => !receipt.passed).length))},
    };
  });
  return {
    generated: new Date().toISOString(), selection: 'Only explicitly supplied labels/directories; no automatic discovery.',
    caveats: [
      'Clear rate means ending reached / selected runs. Room-limit, running, error and stalled outcomes are not wins or deaths.',
      'Median room time pools individual cleared-room simulation durations, excluding deaths and interrupted rooms.',
      'Fixed-step p50/p95/max are copied exactly from __containmentPerformance.debugFixedStep; they are never combined as medians of medians.',
      'Fixed-step samples measure update plus render submission CPU work, not GPU completion. Capture overhead and shared-machine contention affect timing.',
      'RAF frameMs describes a different clock and is not a fixed-step gameplay frame budget.',
      'Heap observations include nondeterministic GC. Different rooms have different asset populations; cross-room growth alone is not a leak proof.',
      'Incoming damage source proximity is inferred, not authoritative attribution. Ability damage is authoritative but control value is not quantified.',
      'Checkpoint probes intentionally roll combat back to its last saved boundary; checkpoint runs must not be interpreted as uninterrupted attempts.',
    ],
    groups, runs,
    findings: runs.flatMap(run => [
      ...run.errors.map(error => ({label: run.label, seed: run.seed, rig: run.rig, assisted: run.assisted, type: 'error', reportPath: run.reportPath, detail: error})),
      ...run.defects.map(defect => ({label: run.label, seed: run.seed, rig: run.rig, assisted: run.assisted, type: 'defect', reportPath: run.reportPath,
        evidencePath: run.reportPath && typeof defect.evidence === 'string' ? resolve(dirname(run.reportPath), defect.evidence) : null, detail: defect})),
    ]),
  };
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
const number = value => finite(value) ? value.toFixed(2) : '—';

/** Standalone review table with exact timing receipts and evidence links. */
export function renderSummary(summary) {
  const rows = summary.groups.map(group => `<tr><td>${escapeHtml(group.key)}</td><td>${group.runs}</td><td>${group.deepestRoom}</td><td>${group.fullClears}/${group.runs} (${Math.round(group.clearRate * 100)}%)</td><td>${number(group.medianClearSeconds)}</td><td>${escapeHtml(JSON.stringify(group.outcomes))}</td><td>${escapeHtml(JSON.stringify(group.deathsByRoom))}</td><td>${group.errors}/${group.defects}</td></tr>`).join('');
  const runs = summary.runs.map(run => {
    const timing = run.fixedStep.latest;
    return `<article><h2>${escapeHtml(run.label)} · ${escapeHtml(run.outcome)}</h2><p>Seed ${run.seed} · ${run.assisted ? 'ASSISTED' : 'UNASSISTED'} · deepest ${run.deepestRoom} · cleared ${run.roomsCleared} · <a href="${escapeHtml(run.reportPath ? pathToFileURL(run.reportPath).href : '#')}">source JSON</a></p><p>Exact latest fixed-step update+render ms: p50 ${number(timing?.updateRenderMs?.p50)}, p95 ${number(timing?.updateRenderMs?.p95)}, max ${number(timing?.updateRenderMs?.max)}; samples ${timing?.samples ?? '—'}, retained ${timing?.retained ?? '—'}. ${escapeHtml(run.fixedStep.scope)}</p><p>Damage ${escapeHtml(JSON.stringify(run.damageDealt))}; uses ${escapeHtml(JSON.stringify(run.abilityUses))}; Overdrives ${run.overdrives}.</p><p>Memory first → last delta: heap ${number(run.memory.delta.heap === null ? null : run.memory.delta.heap / 1e6)} MB, geometries ${run.memory.delta.geometries ?? '—'}, textures ${run.memory.delta.textures ?? '—'}.</p><details><summary>Per-room memory / exact timings / checkpoint receipts</summary><pre>${escapeHtml(JSON.stringify({memory: run.memory, timing: run.fixedStep.snapshots, checkpoints: run.checkpoints}, null, 2))}</pre></details></article>`;
  }).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Containment campaign playtests</title><style>body{font:15px system-ui;background:#111820;color:#e0ebf0;margin:24px;line-height:1.5}a{color:#99dcff}table{border-collapse:collapse;width:100%}td,th{border:1px solid #526170;padding:8px;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere}article{border-top:1px solid #526170;margin-top:24px}li{margin:8px 0}</style><h1>Containment campaign playtests</h1><p>${escapeHtml(summary.selection)}</p><ul>${summary.caveats.map(caveat => `<li>${escapeHtml(caveat)}</li>`).join('')}</ul><table><thead><tr><th>Mode / graph / rig</th><th>Runs</th><th>Deepest</th><th>Ending clear rate</th><th>Median cleared room s</th><th>End states</th><th>Deaths by room</th><th>Errors/defects</th></tr></thead><tbody>${rows}</tbody></table>${runs}<h2>Errors and defect receipts</h2><pre>${escapeHtml(JSON.stringify(summary.findings, null, 2))}</pre></html>`;
}

/** Resolve explicitly selected report labels or report directories; never sweep stale attempts. */
export function parseArguments(args, root = ROOT) {
  const labels = [], directories = [];
  let out = join(root, 'artifacts/nextgen/playtest/campaign-summary');
  for (const arg of args) {
    if (arg.startsWith('--labels=')) labels.push(...arg.slice(9).split(',').filter(Boolean));
    else if (arg.startsWith('--out=')) out = resolve(arg.slice(6));
    else if (arg.startsWith('--')) throw new Error(`Unknown option ${arg}`);
    else directories.push(arg);
  }
  assert(labels.length || directories.length, 'Supply --labels=label1,label2 or explicit report directories.');
  for (const label of labels) assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label) && label !== '..', `Unsafe label ${label}`);
  const paths = [...labels.map(label => join(root, 'artifacts/nextgen/playtest', label, 'report.json')),
    ...directories.map(directory => resolve(directory.endsWith('.json') ? directory : join(directory, 'report.json')))];
  return {paths: [...new Set(paths)], out};
}

async function main() {
  const {paths, out} = parseArguments(process.argv.slice(2));
  const reports = await Promise.all(paths.map(async path => ({path, report: JSON.parse(await readFile(path, 'utf8'))})));
  const summary = aggregateReports(reports);
  await mkdir(out, {recursive: true});
  await writeFile(join(out, 'campaign-summary.json'), JSON.stringify(summary, null, 2));
  await writeFile(join(out, 'campaign-summary.html'), renderSummary(summary));
  console.log(`${summary.runs.length} selected runs, ${summary.groups.length} rig/mode/graph groups: ${join(out, 'campaign-summary.html')}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
