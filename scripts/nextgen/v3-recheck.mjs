#!/usr/bin/env node
/** Recheck original delta misses with three alternating, matched build pairs. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadavg } from 'node:os';
import { createHash } from 'node:crypto';

const root = resolve('artifacts/nextgen'), out = resolve(root, 'v3-final');
const original = JSON.parse(await readFile(resolve(out, 'bench.json')));
const misses = original.rows.filter(row => !row.cpuDeltaPass || !row.drawDeltaPass);
const builds = {
  before: { dist: resolve(root, 'v3-before-dist'), rendererSHA: '93adf6d10870e94fd5b32d2b04eff1ef746f64d8' },
  after: { dist: resolve(root, 'v3-shipped-dist'), rendererSHA: '55114ad6f2b3b383978b16c3642e123bf0dd3956' },
};
const witness = JSON.parse(await readFile(resolve(out, 'runtime-witness.json')));
for (const build of Object.values(builds)) {
  const name = build.dist.split('/').at(-1);
  for (const [file, digest] of Object.entries(witness[name].files)) {
    const actual = createHash('sha256').update(await readFile(resolve(build.dist, file))).digest('hex');
    assert.equal(actual, digest, `Preserved build changed: ${name}/${file}`);
  }
}
const rows = [];
await mkdir(resolve(out, 'rechecks'), { recursive: true });
for (const miss of misses) {
  const { room, rig, tier } = miss.after;
  const key = `${room}-${rig}-${tier}`, trials = { before: [], after: [] };
  for (let repeat = 0; repeat < 3; repeat++) {
    // Reverse the middle pair to reduce systematic warm/order bias.
    for (const build of repeat === 1 ? ['after', 'before'] : ['before', 'after']) {
      const label = `v3-recheck-${key}-${build}-${repeat}`;
      console.log(`${label}, host ${loadavg().map(n => n.toFixed(2)).join('/')}`);
      const args = ['run', 'bench', '--', `--label=${label}`, '--no-build', '--repeat=1',
        `--dist=${builds[build].dist}`, `--rooms=${room}`, `--rigs=${rig}`, `--tiers=${tier}`];
      if (build === 'before') args.push('--baseline');
      const result = spawnSync('npm', args, { stdio: 'inherit' });
      assert([0, 2].includes(result.status), `${label}: runner failed`);
      const report = JSON.parse(await readFile(resolve(root, label, 'benchmark.json')));
      assert.deepEqual(report.errors, []); assert.equal(report.runs.length, 1);
      const run = report.runs[0]; assert.equal(run.programs, 0);
      assert(!run.glError && !run.contextLost);
      trials[build].push({ label, rendererSHA: builds[build].rendererSHA, run, absoluteBudgetFailures: report.budgetFailures });
    }
  }
  const best = entries => entries.reduce((a, b) => a.run.summary.cpu.p95 <= b.run.summary.cpu.p95 ? a : b);
  const peak = entries => Math.max(...entries.map(entry => entry.run.summary.draws.max));
  const before = best(trials.before), after = best(trials.after);
  const cpuDelta = after.run.summary.cpu.p95 - before.run.summary.cpu.p95;
  const drawDelta = peak(trials.after) - peak(trials.before);
  const row = { scenario: miss.scenario, before, after, cpuDelta, drawDelta,
    peakBeforeDraws: peak(trials.before), peakAfterDraws: peak(trials.after),
    cpuDeltaPass: cpuDelta <= .500001, drawDeltaPass: drawDelta <= 25, trials };
  rows.push(row);
  await writeFile(resolve(out, 'rechecks', key + '.json'), JSON.stringify(row, null, 2));
  await writeFile(resolve(out, 'recheck.json'), JSON.stringify({ builds, rows }, null, 2));
}
const f = n => n.toFixed(2);
const lines = ['| Original miss | Best-trial load before → after | CPU p95 ms | Δ CPU | Worst draws | Δ draws | Delta checks |',
  '|---|---:|---:|---:|---:|---:|---|', ...rows.map(row =>
    `| ${row.scenario} | ${f(row.before.run.before.load[0])} → ${f(row.after.run.before.load[0])} | ${f(row.before.run.summary.cpu.p95)} → ${f(row.after.run.summary.cpu.p95)} | ${f(row.cpuDelta)} | ${row.peakBeforeDraws} → ${row.peakAfterDraws} | ${row.drawDelta} | CPU ${row.cpuDeltaPass ? 'pass' : 'FAIL'}; draw ${row.drawDeltaPass ? 'pass' : 'FAIL'} |`)];
const note = 'Unchanged preserved builds; three alternating before/after pairs for every original delta miss. Best CPU-p95 of three per build; worst draw peak of all three. Original 48-trial matrix is retained unchanged. These remain shared-host observations, not quiet-hardware certification. Raw source reports and complete loads are linked by label in recheck.json.';
await writeFile(resolve(out, 'recheck.md'), note + '\n\n' + lines.join('\n') + '\n');
console.log(lines.join('\n'));
