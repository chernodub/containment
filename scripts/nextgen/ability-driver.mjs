/** Run all sixteen production ability fixtures, then check their immutable receipts. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ABILITY_SCENARIOS, DESKTOP_ABILITY_SCENARIO } from './ability-scenarios.mjs';
const label = process.argv.find(a => a.startsWith('--label='))?.slice(8) ?? 'A1-abilities';
assert.match(label, /^[a-zA-Z0-9_-]+$/);
const args = ['scripts/nextgen/capture.mjs', `--label=${label}`, `--scenarios=${[...ABILITY_SCENARIOS, DESKTOP_ABILITY_SCENARIO].map(s => s.id).join(',')}`, '--burst=2', '--width=1920', '--height=1080'];
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
const native=manifest.shots.filter(s=>s.scenario===DESKTOP_ABILITY_SCENARIO.id);assert.equal(native.length,2);for(const shot of native)for(const slot of ['dash','tactical','power','overdrive'])assert.equal(shot.evidence.stats.abilityUses[slot],1);
console.log(JSON.stringify({ passed: true, nativeKeys:4, abilities: ABILITY_SCENARIOS.length, screenshots: manifest.shots.length, errors: manifest.errors, label, manifest: resolve('artifacts/nextgen', label, 'manifest.json') }));
