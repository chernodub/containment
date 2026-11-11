#!/usr/bin/env node
/** Match sustained trials by fixture; preserve all repetitions and contention in the source JSON. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const [beforeLabel = 'v3-before-bench', afterLabel = 'v3-after-bench'] = process.argv.slice(2);
const root = resolve('artifacts/nextgen'), out = resolve(root, 'v3-final');
await mkdir(out, { recursive: true });
const before = JSON.parse(await readFile(resolve(root, beforeLabel, 'benchmark.json')));
const after = JSON.parse(await readFile(resolve(root, afterLabel, 'benchmark.json')));
for (const report of [before, after]) {
  assert.deepEqual(report.errors, []);
  for (const run of report.runs) {
    assert.equal(run.programs, 0); assert(!run.glError && !run.contextLost);
    assert(Object.values(run.uses).every(n => n > 0));
    assert.equal(run.initialEnemies, 25); assert(run.summary.enemies.average >= 22 && run.summary.enemies.p50 >= 24);
  }
}
const key = run => `${run.room} / ${run.rig} / ${run.tier}`;
const group = report => {
  const map = new Map();
  for (const run of report.runs) { if (!map.has(key(run))) map.set(key(run), []); map.get(key(run)).push(run); }
  return map;
};
const a = group(before), b = group(after);
assert.deepEqual([...a.keys()], [...b.keys()]);
const best = runs => runs.reduce((a, b) => a.summary.cpu.p95 <= b.summary.cpu.p95 ? a : b);
const max = (runs, metric) => Math.max(...runs.map(run => run.summary[metric].max));
const rows = [...a].map(([scenario, original]) => {
  const revised = b.get(scenario), baseline = best(original), final = best(revised);
  const cpuDelta = final.summary.cpu.p95 - baseline.summary.cpu.p95;
  const drawDelta = max(revised, 'draws') - max(original, 'draws');
  return { scenario, before: baseline, after: final, beforeTrials: original.map(r => r.name), afterTrials: revised.map(r => r.name),
    cpuDelta, drawDelta, cpuDeltaPass: cpuDelta <= .5 + 1e-6, drawDeltaPass: drawDelta <= 25,
    peakBeforeDraws: max(original, 'draws'), peakAfterDraws: max(revised, 'draws'),
    peakBeforeInstances: max(original, 'instances'), peakAfterInstances: max(revised, 'instances'),
    peakBeforeLights: max(original, 'lights'), peakAfterLights: max(revised, 'lights') };
});
const f = n => n.toFixed(2), pair = (row, metric, field = 'p95') => `${f(row.before.summary[metric][field])} → ${f(row.after.summary[metric][field])}`;
const note = `Native audio, 25 replenished legal actors, corpses retained, native cooldowns. Best CPU-p95 of ${before.repeats}/${after.repeats} 20-second repeats; draw/instance/light peaks are worst of all repeats. Host load differs and is retained for every trial. CPU includes update, render submission, fixture driver and post-render HUD. CPU timing is observational on a shared host; no quiet-hardware certification. Fixed inventories, GL checks and zero combat createProgram calls are separate deterministic guarantees.`;
const lines = ['| Room / rig / tier | Load before → after | CPU p95 ms | Δ CPU | Draw peak | Δ draws | Ability instances | Lights | Delta checks |', '|---|---:|---:|---:|---:|---:|---:|---:|---|',
  ...rows.map(r => `| ${r.scenario} | ${f(r.before.before.load[0])} → ${f(r.after.before.load[0])} | ${pair(r, 'cpu')} | ${f(r.cpuDelta)} | ${r.peakBeforeDraws} → ${r.peakAfterDraws} | ${r.drawDelta} | ${r.peakBeforeInstances} → ${r.peakAfterInstances} | ${r.peakBeforeLights} → ${r.peakAfterLights} | CPU ${r.cpuDeltaPass ? 'pass' : 'FAIL'}; draw ${r.drawDeltaPass ? 'pass' : 'FAIL'} |`)];
await writeFile(resolve(out, 'bench.md'), note + '\n\n' + lines.join('\n') + '\n');
await writeFile(resolve(out, 'bench.json'), JSON.stringify({ beforeLabel, afterLabel, note, rows, afterBudgetFailures: after.budgetFailures }, null, 2));
const high = rows.filter(r => r.after.tier === 'high'), height = 60 + high.length * 46;
const scale = 400 / Math.max(...high.flatMap(r => [r.before.summary.cpu.p95, r.after.summary.cpu.p95]));
const svg = `<svg viewBox="0 0 740 ${height}" role="img" aria-label="High CPU p95 before and after"><style>text{fill:var(--foreground);font:11px system-ui}</style>${high.map((r, i) => {
  const y = 20 + i * 46; return `<text x="0" y="${y + 12}">${r.scenario}</text><rect x="285" y="${y}" width="${r.before.summary.cpu.p95 * scale}" height="13" fill="var(--chart-2)"/><rect x="285" y="${y + 15}" width="${r.after.summary.cpu.p95 * scale}" height="13" fill="var(--chart-1)"/><text x="${290 + r.after.summary.cpu.p95 * scale}" y="${y + 27}">${f(r.after.summary.cpu.p95)}</text>`;
}).join('')}<text x="0" y="${height - 8}">Top: before. Bottom: V3. Shared-host observations; see exact loads and all trials.</text></svg>`;
const drawScale = 350 / Math.max(...high.flatMap(r => [r.peakBeforeDraws, r.peakAfterDraws]));
const drawSvg = `<svg viewBox="0 0 740 ${height}" role="img" aria-label="High draw peaks before and after"><style>text{fill:var(--foreground);font:11px system-ui}</style>${high.map((r, i) => {
  const y = 20 + i * 46;
  return `<text x="0" y="${y + 12}">${r.scenario}</text><rect x="285" y="${y}" width="${r.peakBeforeDraws * drawScale}" height="13" fill="var(--chart-2)"/><rect x="285" y="${y + 15}" width="${r.peakAfterDraws * drawScale}" height="13" fill="var(--chart-1)"/><text x="${290 + Math.max(r.peakBeforeDraws, r.peakAfterDraws) * drawScale}" y="${y + 27}">${r.peakBeforeDraws} → ${r.peakAfterDraws}</text>`;
}).join('')}<text x="0" y="${height - 8}">Top: before. Bottom: V3. Worst peak of all three sustained trials.</text></svg>`;
const status = `Original matrix: ${rows.filter(r => !r.cpuDeltaPass).length}/16 CPU delta misses; ${rows.filter(r => !r.drawDeltaPass).length}/16 draw delta misses. ${after.budgetFailures.length} final trials exceed the absolute 350-draw target. Separate rechecks retain this original matrix.`;
const html = `<!doctype html><meta charset="utf-8"><style>svg{width:100%;height:${height}px}p{color:var(--muted-foreground);font-size:12px}</style><p>${status}</p><p>High draw-call peaks — global target 350, V3 delta limit +25</p>${drawSvg}<p>High CPU p95 in milliseconds — best of three, contended host</p>${svg}<p>${note}</p>`;
await writeFile(resolve(out, 'bench.html'), html);
console.log(lines.join('\n'));
console.log(`V3 delta misses: CPU ${rows.filter(r => !r.cpuDeltaPass).length}, draw ${rows.filter(r => !r.drawDeltaPass).length}`);
