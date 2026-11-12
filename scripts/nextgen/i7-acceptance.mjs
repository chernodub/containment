#!/usr/bin/env node
/** Serial acceptance batches. Every original log, load measurement and nonzero exit is retained. */
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const mode = process.argv[2], sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const rooms = ['awakening-bay', 'passenger-vault', 'residential-gallery', 'communal-atrium', 'crew-checkpoint', 'armory', 'freight-hold', 'breached-loading-bay', 'relay-racks', 'transmission-chamber', 'diagnostic-gallery', 'safety-interlock-station', 'coolant-plant', 'service-shaft-landing', 'infested-workshop', 'swarm-junction', 'shielding-gate', 'containment-annulus', 'manual-control-chamber', 'overload-floor'];
const rigs = ['breacher', 'cryo', 'pyro', 'arc'];
const abilities = ['ram', 'seismic-slam', 'bulwark', 'railbreaker', 'frost-trail', 'cryo-nova', 'glacier', 'whiteout', 'afterburn', 'flashfire', 'napalm-charge', 'meltdown', 'static-step', 'overload', 'tesla-pylon', 'overclock'];
const dist = 'artifacts/nextgen/i7/final-dist';
const jobs = [];
const capture = (label, scenarios, extra = []) => jobs.push([label, 'npm', 'run', 'capture', '--', `--label=${label}`, `--dist=${dist}`, `--dist-source-sha=${sha}`, `--scenarios=${scenarios.join(',')}`, '--keep-going', ...extra]);
if (mode === 'gates') {
    jobs.push(['final-vitest', 'npx', 'vitest', 'run', '--exclude', 'scripts/cryo-model-preview.test.mjs', '--no-file-parallelism']);
    jobs.push(['final-model-preview', 'node', '--test', 'scripts/cryo-model-preview.test.mjs']);
    jobs.push(['final-verify', 'npm', 'run', 'verify']);
    jobs.push(['final-build', 'npm', 'run', 'build']);
    jobs.push(['final-room-evidence', 'npm', 'run', 'test:room-evidence']);
    jobs.push(['final-smoke', 'npm', 'run', 'test:smoke']);
    jobs.push(['final-authored', 'npm', 'run', 'test:authored-smoke:all', '--', `--rooms=${rooms.join(',')}`]);
    jobs.push(['final-playtest-smoke', 'npm', 'run', 'playtest:smoke']);
}
else if (mode === 'captures') {
    const ui = ['title', 'title-settings', 'rig-select', 'rig-select-cryo', 'rig-select-pyro', 'rig-select-arc', 'starting-boon', 'augment-draft', 'reward', 'route', 'shop', 'pause', 'pause-loadout', 'pause-settings', 'pause-controls', 'dead', 'results', 'complete-fixture', 'x3-results-statistics', 'x3-completion-statistics', 'onboarding', ...['room-enter', 'room-clear', 'boss-intro', 'boss-defeated', 'overdrive-ready', 'death'].map(s => `beat-${s}-fixture`)];
    capture('final-ui', ui, ['--burst=4']);
    capture('final-rooms', ['combat-calm', 'x2-calm-motion-high', 'combat-kiting'], [`--rooms=${rooms.join(',')}`, '--burst=4']);
    capture('final-combat', ['combat-heavy'], ['--rooms=awakening-bay,communal-atrium,armory,relay-racks,infested-workshop,containment-annulus,overload-floor', '--burst=4']);
    capture('final-baseline-extra', ['combat-heavy'], ['--rooms=passenger-vault,breached-loading-bay,safety-interlock-station', '--burst=4']);
    capture('final-abilities', abilities.map(id => `v2-${id}`), ['--burst=7']);
    capture('final-kits', rigs.flatMap(rig => ['containment-annulus', 'infested-workshop'].map(room => `v2-full-${rig}-${room}`)), ['--burst=7']);
    capture('final-details', ['v3-recovery', 'boss', 'g2-queen-exposed', 'x2-queen-opening-high', 'x2-queen-closing-high', 'x2-nest-husk-high', 'g2-champions', 'status-vfx', 'g2-pickups', 'i7-boss-breacher', 'i7-boss-cryo', 'i7-boss-arc', 'i7-champions-effects', 'i7-pickups-zones'], ['--burst=7']);
    capture('final-low', ['g2-calm-low', 'g2-kiting-low'], ['--rooms=awakening-bay,infested-workshop,overload-floor', '--burst=4']);
    capture('final-720', ['title', 'rig-select-cryo', 'starting-boon', 'augment-draft', 'route', 'shop', 'pause-settings', 'pause-controls', 'dead', 'complete-fixture', 'combat-kiting:awakening-bay', 'combat-kiting:infested-workshop', 'combat-kiting:overload-floor', 'v2-flashfire', 'g2-queen-exposed'], ['--width=1280', '--height=720', '--burst=7']);
}
else if (mode === 'bench') {
    jobs.push(['final-bench', 'npm', 'run', 'bench', '--', '--label=i7-bench', `--dist=${dist}`, `--dist-source-sha=${sha}`, '--no-build']);
    jobs.push(['final-bench-rooms', 'npm', 'run', 'bench:rooms', '--', '--label=i7-bench-rooms', `--dist=${dist}`, `--dist-source-sha=${sha}`, '--no-build']);
}
else
    throw Error('Expected gates/captures/bench');
await mkdir('artifacts/nextgen/i7-logs', { recursive: true });
const results = [];
for (const [label, command, ...args] of jobs) {
    console.log(`START ${label}`);
    const env = { ...process.env };
    if (label === 'final-verify')
        env.VITEST_MAX_WORKERS = '1';
    const exit = await new Promise(resolve => { const child = spawn(process.execPath, ['scripts/nextgen/i7-command.mjs', label, command, ...args], { stdio: 'inherit', env }); child.on('exit', resolve); });
    results.push({ label, exit });
    await writeFile(`artifacts/nextgen/i7-logs/${mode}-summary.json`, JSON.stringify({ applicationSHA: sha, jobs: results }, null, 2) + '\n');
    console.log(`END ${label}: ${exit}`);
}
assert(results.every(r => r.exit === 0 || r.label === 'final-verify'), `Acceptance failures: ${JSON.stringify(results.filter(r => r.exit !== 0))}`);
