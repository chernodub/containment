#!/usr/bin/env node
/** Serialize small production capture batches, retaining original manifests and bounded galleries. */
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadavg } from 'node:os';

const option = (name, fallback = '') => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const label = option('label', 'v5-before');
assert(/^[\w.-]+$/.test(label));
const dist = resolve(option('dist', 'dist'));
const sha = option('dist-source-sha', execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
const out = resolve('artifacts/nextgen', label);
await mkdir(out, { recursive: true });
const rigs = {
  breacher: ['ram', 'seismic-slam', 'bulwark', 'railbreaker'],
  cryo: ['frost-trail', 'cryo-nova', 'glacier', 'whiteout'],
  pyro: ['afterburn', 'flashfire', 'napalm-charge', 'meltdown'],
  arc: ['static-step', 'overload', 'tesla-pylon', 'overclock'],
};
const combined = { label, gitSHA: sha, shots: [], sprites: [], failures: [], errors: [], sources: [], hostStart: loadavg() };
for (const [rig, abilities] of Object.entries(rigs)) for (const room of ['containment-annulus', 'infested-workshop']) {
  const scenarios = [...abilities.map(id => `v2-${id}-${room}`), `v2-full-${rig}-${room}`];
  const batch = `${label}-${rig}-${room}`;
  console.log(`${batch} / host load ${loadavg().map(n => n.toFixed(2)).join('/')}`);
  const result = spawnSync('npm', ['run', 'capture', '--', `--label=${batch}`, '--burst=7', `--dist=${dist}`, `--dist-source-sha=${sha}`, `--scenarios=${scenarios.join(',')}`], { stdio: 'inherit' });
  assert.equal(result.status, 0, `${batch} failed; original evidence retained`);
  const source = resolve('artifacts/nextgen', batch), manifest = JSON.parse(await readFile(resolve(source, 'manifest.json')));
  assert(!manifest.failures.length && !manifest.errors.length);
  await mkdir(resolve(out, 'sources'), { recursive: true });
  await cp(resolve(source, 'manifest.json'), resolve(out, 'sources', batch + '.json'));
  for (const record of [...manifest.shots, ...manifest.sprites]) await cp(resolve(source, record.file), resolve(out, record.file));
  combined.shots.push(...manifest.shots); combined.sprites.push(...manifest.sprites);
  combined.sources.push({ label: batch, gitSHA: manifest.gitSHA, distSnapshot: manifest.distSnapshot, host: loadavg() });
}
combined.hostEnd = loadavg();
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(combined, null, 2));
const review = spawnSync(process.execPath, ['scripts/nextgen/v3-gallery.mjs', out], { stdio: 'inherit' });
assert.equal(review.status, 0);
await writeFile(resolve(out, 'index.html'), '<!doctype html><meta charset="utf-8"><title>V5 review</title><a href="review/index.html">Ability sheets and exact 480×270 thumbnails</a>');
console.log(`${combined.shots.length} frames, ${combined.sprites.length} sheets, no failures/errors: ${out}`);
