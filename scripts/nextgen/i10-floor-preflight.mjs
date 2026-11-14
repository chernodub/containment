#!/usr/bin/env node
/** Desktop-only canonical floor coverage through the existing native capture harness. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const sourceFile = process.argv[2];
if (!sourceFile || ['--help', '-h'].includes(sourceFile)) {
  console.log('Usage: node scripts/nextgen/i10-floor-preflight.mjs <frozen-source.json>');
  console.log('Writes160 native floor frames per desktop size through the existing capture harness; use a new cohort for each source.');
  process.exit(sourceFile ? 0 : 1);
}
const source = JSON.parse(await readFile(sourceFile));
const {sourceSHA, cohort, directory} = source;
assert(resolve(directory).startsWith(resolve(process.cwd()) + '/'), 'Frozen distribution must be inside this worktree');
assert(/^[a-f0-9]{40}$/.test(sourceSHA), 'Exact application source SHA required');
assert(/^[\w.-]+$/.test(cohort), 'Safe, distinct evidence cohort required');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
for (const [file, expected] of Object.entries(source.assets)) {
  assert.equal(hash(await readFile(resolve(directory, 'assets', file))), expected, file);
}
if (source.indexSHA256) {
  assert.equal(hash(await readFile(resolve(directory, 'index.html'))), source.indexSHA256);
}
assert.equal((await readFile(resolve(directory, 'SOURCE_SHA'), 'utf8')).trim(), sourceSHA);

const canonical = [
  'awakening-bay', 'passenger-vault', 'residential-gallery', 'communal-atrium',
  'crew-checkpoint', 'armory', 'freight-hold', 'breached-loading-bay',
  'relay-racks', 'transmission-chamber', 'diagnostic-gallery',
  'safety-interlock-station', 'coolant-plant', 'service-shaft-landing',
  'infested-workshop', 'swarm-junction', 'shielding-gate',
  'containment-annulus', 'manual-control-chamber', 'overload-floor',
];
const priority = source.priorityRooms ?? [];
assert(new Set(priority).size === priority.length);
assert(priority.every(room => canonical.includes(room)), 'Unknown priority room');
const remaining = canonical.filter(room => !priority.includes(room));
const keys = [
  ...priority.map(room => 'x2-calm-motion-high:' + room),
  ...priority.map(room => 'combat-kiting:' + room),
  ...remaining.map(room => 'x2-calm-motion-high:' + room),
  ...remaining.map(room => 'combat-kiting:' + room),
];
assert.equal(new Set(keys).size, 40);
// Reserve both unique outputs before starting either browser. Never overwrite a prior trial.
for (const height of [1080, 720]) {
  await mkdir(resolve('artifacts/nextgen', 'i10-' + cohort + '-' + height));
}
const jobs = [];
let saving = Promise.resolve();

async function capture(width, height) {
  const label = 'i10-' + cohort + '-' + height;
  const args = [
    'scripts/nextgen/i10-run.mjs', cohort + '-' + height,
    'npm', 'run', 'capture', '--',
    '--label=' + label, '--dist=' + directory, '--dist-source-sha=' + sourceSHA,
    '--width=' + width, '--height=' + height, '--burst=4', '--sprite-width=1920',
    '--kiting-retries=32', '--graphics={"adaptiveResolution":false}',
    '--scenarios=' + keys.join(','),
  ];
  const child = spawn(process.execPath, args, {stdio:'inherit'});
  const code = await new Promise((ok, fail) => {
    child.once('error', fail);
    child.once('close', ok);
  });
  jobs.push({label, args, code});
  saving = saving.then(() => writeFile(
    resolve('artifacts/nextgen/i10', cohort + '-native-jobs.json'),
    JSON.stringify({
      sourceSHA, sourceFile:resolve(sourceFile), jobs,
      note:'At most two desktop capture browsers. Fixed native graphics for visual/code-value evidence; no hardware timing acceptance.',
    }, null, 2) + '\n',
  ));
  await saving;
  if (code !== 0) return code ?? 1;

  const manifest = JSON.parse(await readFile(resolve('artifacts/nextgen', label, 'manifest.json')));
  assert.equal(manifest.distSnapshot.sourceSHA, sourceSHA);
  assert.deepEqual(manifest.appAssets, source.assets);
  assert.equal(manifest.shots.length, 160);
  assert.equal(manifest.errors.length, 0);
  assert.equal(manifest.failures.length, 0);
  const phases = new Map();
  for (const shot of manifest.shots) {
    const key = shot.scenario + ':' + shot.room;
    assert(keys.includes(key), key);
    const frames = phases.get(key) ?? new Set();
    frames.add(shot.frame);
    phases.set(key, frames);
  }
  assert.equal(phases.size, 40);
  for (const frames of phases.values()) assert.deepEqual([...frames].sort(), [1,2,3,4]);
  return 0;
}

const results = await Promise.allSettled([capture(1920,1080), capture(1280,720)]);
console.log(JSON.stringify(results));
process.exitCode = results.some(result => result.status === 'rejected' || result.value !== 0) ? 1 : 0;
