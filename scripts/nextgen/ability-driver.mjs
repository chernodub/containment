/** Run all sixteen production ability fixtures, then check their immutable receipts. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ABILITY_SCENARIOS } from './ability-scenarios.mjs';
const label = process.argv.find(a => a.startsWith('--label='))?.slice(8) ?? 'A1-abilities';
assert.match(label, /^[a-zA-Z0-9_-]+$/);
const args = ['scripts/nextgen/capture.mjs', `--label=${label}`, `--scenarios=${ABILITY_SCENARIOS.map(s => s.id).join(',')}`, '--burst=2', '--width=1280', '--height=720'];
const code = await new Promise((ok, fail) => { const p = spawn(process.execPath, args, { stdio: 'inherit' }); p.on('error', fail); p.on('exit', ok); });
assert.equal(code, 0, 'Production ability captures failed');
const manifest = JSON.parse(await readFile(resolve('artifacts/nextgen', label, 'manifest.json'), 'utf8'));
assert.deepEqual(manifest.failures, []); assert.deepEqual(manifest.errors, []);
for (const scenario of ABILITY_SCENARIOS) {
  const shots = manifest.shots.filter(s => s.scenario === scenario.id);
  assert.equal(shots.length, 2, scenario.id);
  for (const shot of shots) {
    assert.equal(shot.evidence.abilities.rig, scenario.ability.rig);
    assert.equal(shot.evidence.stats.abilityUses[scenario.ability.slot], 1);
    assert.equal(shot.evidence.state, 'playing');
    assert.equal(shot.evidence.hud, true);
  }
}
console.log(JSON.stringify({ passed: true, abilities: ABILITY_SCENARIOS.length, screenshots: manifest.shots.length, errors: manifest.errors, label, manifest: resolve('artifacts/nextgen', label, 'manifest.json') }));
