#!/usr/bin/env node
/** PNG-only V4 comparisons; preserves source manifests, phase identities and raw benchmark trials. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { canvas, decode, encode, drawImage, drawText } from './g2-png.mjs';

const root = resolve('artifacts/nextgen'), out = resolve(root, 'v4');
await mkdir(out, { recursive: true });
const mode = process.argv[2];
async function filesUnder(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(resolve(dir, prefix), { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(dir, name + '/')); else files.push(name);
  }
  return files.sort();
}
if (mode === 'witness') {
  const records = [];
  const builds=(await readdir(out,{withFileTypes:true})).filter(e=>e.isDirectory()&&e.name.endsWith('-dist')).map(e=>e.name).sort();
  for (const name of builds) {
    const dir = resolve(out, name, 'assets');
    let files; try { files = await filesUnder(dir); } catch { continue; }
    const hashes = {};
    for (const file of files.sort()) hashes[file] = createHash('sha256').update(await readFile(resolve(dir, file))).digest('hex');
    const actualRendererSHA=(await readFile(resolve(out,name,'SOURCE_SHA'),'utf8')).trim();
    assert(/^[a-f0-9]{40}$/.test(actualRendererSHA),`Missing full source identity for ${name}`);
    records.push({ build: name, actualRendererSHA, assets: hashes });
  }
  const core=JSON.parse(await readFile(resolve(root,'v4-before/sources/v4-before-breacher.json')));
  const baseline=records.find(r=>r.build==='before-dist');
  for(const [file,hash]of Object.entries(core.appAssets))assert.equal(baseline.assets[file],hash);
  const environmentProof=[];
  try{for(const file of await readdir(resolve(root,'v4-before-env/sources'))){
    const m=JSON.parse(await readFile(resolve(root,'v4-before-env/sources',file)));assert.deepEqual(m.appAssets,core.appAssets);
    environmentProof.push({file,recordedHarnessSHA:m.gitSHA,servedPath:m.distSnapshot.path,actualRendererSHA:baseline.actualRendererSHA,appAssetHashesMatch:true});
  }}catch(error){if(error.code!=='ENOENT')throw error;}
  await writeFile(resolve(out, 'runtime-witness.json'), JSON.stringify({ note: 'Before core manifest records the correct initial SHA. The queued before environment wrapper reads a later harness HEAD; it still serves these identical immutable before assets. Original manifests remain unchanged.', records,environmentProof }, null, 2));
} else if (mode === 'compare') {
  const beforeLabels = (process.argv[3] ?? 'v4-before,v4-before-env').split(',');
  const afterLabels = (process.argv[4] ?? 'v4-final,v4-final-env').split(',');
  const read = async labels => {
    const records = [];
    for (const label of labels) {
      const dir = resolve(root, label), m = JSON.parse(await readFile(resolve(dir, 'manifest.json')));
      assert.deepEqual(m.errors, []); assert.deepEqual(m.failures, []);
      records.push(...m.shots.map(s => ({ ...s, directory: dir })));
    }
    return records;
  };
  const before = await read(beforeLabels), after = await read(afterLabels);
  const groups = new Map();
  for (const s of before) { const key = `${s.scenario}:${s.room}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(s); }
  const comparisons = [];
  await mkdir(resolve(out, 'comparisons'), { recursive: true });
  for (const [key, original] of groups) {
    const revised = after.filter(s => `${s.scenario}:${s.room}` === key);
    assert.equal(original.length, 7); assert.equal(revised.length, 7, key);
    const sheet = canvas(3360, 600);
    for (const [row, records] of [original, revised].entries()) for (let i = 0; i < records.length; i++) {
      const s = records[i]; assert.equal(s.simulationMs, original[i].simulationMs, `${key} phase ${i}`);
      const im = decode(await readFile(resolve(s.directory, 'review', s.file)));
      assert.equal(im.width, 480); assert.equal(im.height, 270);
      drawImage(sheet, im, i * 480, row * 300 + 20, 480, 270);
      drawText(sheet, `${row ? 'V4' : 'BEFORE'} / ${i + 1} / ${s.simulationMs}MS`, i * 480 + 8, row * 300 + 4, undefined, 1);
    }
    const file = key.replaceAll(':', '-') + '.png'; await writeFile(resolve(out, 'comparisons', file), encode(sheet));
    comparisons.push({ key, file: resolve(out, 'comparisons', file), before: original.map(s => resolve(s.directory, s.file)), after: revised.map(s => resolve(s.directory, s.file)) });
  }
  await writeFile(resolve(out, 'comparisons.json'), JSON.stringify({ beforeLabels, afterLabels, comparisons }, null, 2));
  console.log(`${comparisons.length} matched seven-phase before/after PNGs`);
} else if (mode === 'bench') {
  const labels = process.argv.slice(3, 5), reports = await Promise.all(labels.map(l => readFile(resolve(root, l, 'benchmark.json')).then(JSON.parse)));
  const groups = reports.map(report => {
    assert.deepEqual(report.errors, []); const map = new Map();
    for (const r of report.runs) {
      assert.equal(r.programs, 0); assert(!r.glError && !r.contextLost); assert(Object.values(r.uses).every(n => n > 0));
      assert.equal(r.initialEnemies, 25); assert(r.summary.enemies.average >= 22 && r.summary.enemies.p50 >= 24);
      const key = `${r.room} / ${r.rig} / ${r.tier}`; if (!map.has(key)) map.set(key, []); map.get(key).push(r);
    }
    return map;
  });
  assert.deepEqual([...groups[0].keys()], [...groups[1].keys()]);
  const best = runs => runs.reduce((a, b) => a.summary.cpu.p95 <= b.summary.cpu.p95 ? a : b);
  const rows = [...groups[0]].map(([key, a]) => {
    const b = groups[1].get(key), before = best(a), after = best(b);
    const beforeDraws = Math.max(...a.map(r => r.summary.draws.max)), afterDraws = Math.max(...b.map(r => r.summary.draws.max));
    const cpuDelta = after.summary.cpu.p95 - before.summary.cpu.p95, drawDelta = afterDraws - beforeDraws;
    return { key, before, after, beforeDraws, afterDraws, cpuDelta, drawDelta, cpuPass: cpuDelta <= 1e-6, drawPass: drawDelta <= 0, beforeTrials: a.map(r => r.name), afterTrials: b.map(r => r.name) };
  });
  const note = `Native 25-actor sustained fixture, full kits High/Low. Best CPU p95 of ${reports[0].repeats}/${reports[1].repeats} repeats; draws use the worst peak across every repeat. Strict zero-increase comparison. Shared-host CPU submission is observational, not GPU completion or quiet-hardware certification. All raw errors, budgets, distributions and loads remain in the original reports.`;
  const f = n => n.toFixed(2);
  const table = ['| Fixture | CPU p95 before → after ms | Δ | Draw peak before → after | Δ | Load before → after | Strict result |','|---|---:|---:|---:|---:|---:|---|', ...rows.map(r => `| ${r.key} | ${f(r.before.summary.cpu.p95)} → ${f(r.after.summary.cpu.p95)} | ${f(r.cpuDelta)} | ${r.beforeDraws} → ${r.afterDraws} | ${r.drawDelta} | ${f(r.before.before.load[0])} → ${f(r.after.before.load[0])} | CPU ${r.cpuPass ? 'pass' : 'FAIL'}, draw ${r.drawPass ? 'pass' : 'FAIL'} |`)];
  await writeFile(resolve(out, 'bench.md'), note + '\n\n' + table.join('\n') + '\n');
  await writeFile(resolve(out, 'bench.json'), JSON.stringify({ labels, note, rows, budgetFailures: reports.map(r => r.budgetFailures) }, null, 2));
  const chart = canvas(1440, 70 + rows.length * 68), cpuScale = 320 / Math.max(...rows.flatMap(r => [r.before.summary.cpu.p95, r.after.summary.cpu.p95]));
  drawText(chart, 'CPU P95 / DRAW PEAKS - BEFORE AMBER / V4 CYAN', 12, 12);
  for (const [i, r] of rows.entries()) {
    const y = 60 + i * 68; drawText(chart, r.key, 12, y, undefined, 1);
    for (const [j, [cpu, draws, color]] of [[r.before.summary.cpu.p95, r.beforeDraws, [238, 175, 86]], [r.after.summary.cpu.p95, r.afterDraws, [108, 220, 238]]].entries()) {
      for (let dy = 0; dy < 12; dy++) for (let dx = 0; dx < Math.round(cpu * cpuScale); dx++) {
        const p = ((y + j * 17 + dy) * chart.width + 390 + dx) * 3; chart.pixels.set(color, p);
      }
      drawText(chart, `${f(cpu)} MS / ${draws} DRAWS`, 750, y + j * 17 + 2, color, 1);
    }
  }
  await writeFile(resolve(out, 'bench.png'), encode(chart));
  console.log(table.join('\n')); console.log(`Strict misses: CPU ${rows.filter(r => !r.cpuPass).length}/${rows.length}, draw ${rows.filter(r => !r.drawPass).length}/${rows.length}`);
} else throw Error('Choose witness, compare or bench');
