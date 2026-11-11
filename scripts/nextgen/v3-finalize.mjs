#!/usr/bin/env node
/** Assemble immutable before/after evidence without recapturing or relabeling failed shots. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { decode, encode, canvas, drawImage, drawText } from './g2-png.mjs';

const root = resolve('artifacts/nextgen'), out = resolve(root, 'v3-final');
const labels = process.argv.slice(2);
assert(labels.length, 'Pass validated final core/environment/recovery labels');
await mkdir(resolve(out, 'sources'), { recursive: true });
const merged = { label: 'v3-final', shots: [], sprites: [], failures: [], errors: [], sources: [] };
for (const label of labels) {
  const source = resolve(root, label), m = JSON.parse(await readFile(resolve(source, 'manifest.json')));
  assert.deepEqual(m.failures, []); assert.deepEqual(m.errors, []);
  merged.sources.push({ label, gitSHA: m.gitSHA, sources: m.sources, distSnapshot: m.distSnapshot });
  await cp(resolve(source, 'manifest.json'), resolve(out, 'sources', label + '.json'));
  for (const s of [...m.shots, ...m.sprites]) await cp(resolve(source, s.file), resolve(out, s.file));
  merged.shots.push(...m.shots); merged.sprites.push(...m.sprites);
}
assert.equal(new Set(merged.shots.map(s => s.file)).size, merged.shots.length, 'Duplicate final evidence key');
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(merged, null, 2));
const result = spawnSync(process.execPath, ['scripts/nextgen/v3-gallery.mjs', out], { stdio: 'inherit' });
assert.equal(result.status, 0);
const before = resolve(root, 'v3-before'), bm = JSON.parse(await readFile(resolve(before, 'manifest.json')));
assert.deepEqual(bm.failures, []); assert.deepEqual(bm.errors, []);
await cp(resolve(before, 'manifest.json'), resolve(out, 'sources/v3-before.json'));
await cp(resolve(before, 'review'), resolve(out, 'before-thumbnails'), { recursive: true });
const beforeIndex = resolve(out, 'before-thumbnails/index.html');
await writeFile(beforeIndex, (await readFile(beforeIndex, 'utf8')).replaceAll('href="../', 'href="../before-sheets/'));
await mkdir(resolve(out, 'before-sheets'), { recursive: true });
for (const sprite of bm.sprites) await cp(resolve(before, sprite.file), resolve(out, 'before-sheets', sprite.file));
await mkdir(resolve(out, 'comparisons'), { recursive: true });
await mkdir(resolve(out, 'thumbnails'), { recursive: true });
const groups = new Map();
for (const s of bm.shots) {
  if (!groups.has(s.scenario)) groups.set(s.scenario, []);
  groups.get(s.scenario).push(s);
}
const cards = [];
for (const [scenario, shots] of groups) {
  const after = merged.shots.filter(s => s.scenario === scenario && s.room === shots[0].room);
  assert.equal(after.length, shots.length, `Missing matched phases for ${scenario}`);
  const sheet = canvas(480 * shots.length, 600);
  for (let row = 0; row < 2; row++) for (let i = 0; i < shots.length; i++) {
    const record = (row ? after : shots)[i], base = row ? resolve(out, 'review') : resolve(out, 'before-thumbnails');
    const im = decode(await readFile(resolve(base, record.file)));
    drawImage(sheet, im, i * 480, row * 300 + 20, 480, 270);
    drawText(sheet, `${row ? 'V3' : 'BEFORE'} / ${i + 1} / ${record.simulationMs}MS`, i * 480 + 8, row * 300 + 4, undefined, 1);
  }
  const file = scenario.replaceAll(':', '-') + '.png';
  await writeFile(resolve(out, 'comparisons', file), encode(sheet));
  // Identical impact+30ms phase for every before/after pair; complete timelines remain primary evidence.
  const stem = scenario.replaceAll(':', '-');
  await cp(resolve(out, 'before-thumbnails', shots[2].file), resolve(out, 'thumbnails', stem + '-before.png'));
  await cp(resolve(out, 'review', after[2].file), resolve(out, 'thumbnails', stem + '-after.png'));
  cards.push(`<figure><h2>${scenario}</h2><a href="comparisons/${file}"><img src="comparisons/${file}"></a></figure>`);
}
await writeFile(resolve(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Containment V3 final</title><style>body{background:#101821;color:#e3edf2;font:15px system-ui;margin:20px}a{color:#a9e5ff}img{width:100%;height:auto}figure{margin:24px 0}h2{font-size:18px}</style><h1>Containment / V3 ability spectacle</h1><p>Each cell is exactly 480×270. Before above, V3 below. Click to inspect all seven phases. Original PNGs and manifests are retained.</p><p><a href="review/index.html">All final timelines, bright/dark kits and Low</a> · <a href="bench.html">Sustained before/after benchmark</a> · <a href="recheck.md">Alternating matched CPU rechecks</a></p>${cards.join('')}`);
console.log(`${merged.shots.length} final frames, ${groups.size} matched comparisons: ${out}`);
