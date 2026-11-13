/** File-only matched evidence receipt. Never edits captured PNGs or starts a browser. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const roots = [process.argv[2] ?? 'artifacts/nextgen/v6-before', process.argv[3] ?? 'artifacts/nextgen/v6-final'].map(x => resolve(x));
const out = resolve('artifacts/nextgen/v6');
await mkdir(out, { recursive: true });
const manifests = await Promise.all(roots.map(async root => JSON.parse(await readFile(resolve(root, 'manifest.json')))));
for (const m of manifests) {
  assert.deepEqual(m.errors, []); assert.deepEqual(m.failures, []);
  assert.equal(m.shots.length, 280); assert.equal(m.sprites.length, 40);
}
const rows = ['# V6 matched before/after evidence', '', '| Ability / room | Before native / 480 | Final native / 480 |', '|---|---|---|'];
const records = [];
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
for (const sprite of manifests[0].sprites) {
  const key = `${sprite.scenario}:${sprite.room}`;
  const groups = manifests.map(m => m.shots.filter(s => `${s.scenario}:${s.room}` === key).sort((a,b) => a.frame-b.frame));
  assert.equal(groups[0].length, 7); assert.equal(groups[1].length, 7);
  const pairs = [];
  for (let i = 0; i < 7; i++) {
    assert.equal(groups[0][i].simulationMs, groups[1][i].simulationMs, `${key} phase ${i}`);
    const paths = roots.map((root, j) => resolve(root, groups[j][i].file));
    pairs.push({ phase: i+1, simulationMs: groups[0][i].simulationMs, paths, hashes: await Promise.all(paths.map(hash)) });
  }
  const paths = roots.map(root => ({ native: resolve(root,sprite.file), thumbnail: resolve(root,'review',sprite.file.replace('-sprite.png','-sheet.png')) }));
  for (const pair of paths) { await readFile(pair.native); await readFile(pair.thumbnail); }
  rows.push(`| ${key} | [native](${paths[0].native}) / [480](${paths[0].thumbnail}) | [native](${paths[1].native}) / [480](${paths[1].thumbnail}) |`);
  records.push({ key, sheets: paths, pairs });
}
await writeFile(resolve(out,'evidence.md'),rows.join('\n')+'\n');
await writeFile(resolve(out,'evidence.json'),JSON.stringify({roots, records},null,2));
console.log('40 matched sheets / 280 phase pairs, identical simulation clocks; PNG hashes retained');
