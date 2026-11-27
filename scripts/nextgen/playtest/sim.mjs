#!/usr/bin/env node
import { build } from 'vite';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { actorMetrics } from './sim-metrics.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
process.chdir(root);
const allowed = new Set(['difficulty', 'profile', 'label', 'rig', 'rigs', 'seed', 'seeds', 'rooms', 'assisted', 'legacy', 'trace', 'max-room-seconds', 'workers', 'game-ref', 'game-revision', 'policy-revision', 'tuning','conditions-off','exchange-marks','room-order']);
const args = Object.fromEntries(process.argv.slice(2).map(arg => { const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.length ? value.join('=') : true]; }));
for (const key of Object.keys(args))
    if (!allowed.has(key))
        throw Error(`Unknown option ${key}`);
if (args.difficulty && !['story','standard','veteran'].includes(args.difficulty)) throw Error('difficulty must be story, standard or veteran');
if (args['room-order'] && !['direct','salvage','policy'].includes(args['room-order'])) throw Error('room-order must be direct, salvage or policy');
if (args.profile && !['novice','competent','expert'].includes(args.profile)) throw Error('profile must be novice, competent or expert');
if (args.label && !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(String(args.label)))
    throw Error('Unsafe label');
const out = resolve('artifacts/nextgen/playtest', args.label ?? 'sim');
await mkdir(dirname(out), { recursive: true });
try { await mkdir(out); }
catch (error) {
    if (error.code === 'EEXIST') throw Error('Simulation label already exists; use a new label to preserve its source snapshot and reports.');
    throw error;
}
const gameRef = args['game-revision'] ?? args['game-ref'];
if (args.tuning !== undefined && args.tuning !== true) throw Error('--tuning is a switch without a value');
const tuningFile = resolve('src/game/roguelike/i5Tuning.ts');
const sourceCache = new Map();
const policyFiles = new Set(['policy.mjs','ability-aim.ts','bot-navigation.ts','bot-navigation-version.mjs']);
const policySources = new Map();
if (args['policy-revision']) for (const file of policyFiles) policySources.set(resolve('scripts/nextgen/playtest',file), execFileSync('git',['show',`${args['policy-revision']}:scripts/nextgen/playtest/${file}`],{encoding:'utf8'}));
const plugins = [{ name: 'simulation-snapshot', load(id) { if (policySources.has(id)) return policySources.get(id); if (id === root + '/src/DepthGame.ts' || id.startsWith(root + '/src/game/')) {
            if (!sourceCache.has(id)) {
                let content = gameRef ? execFileSync('git', ['show', `${gameRef}:${id.slice(root.length + 1)}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }) : readFileSync(id, 'utf8');
                if (args.tuning && id === tuningFile) {
                    content = content.replace(/(I5_ENCOUNTER_TUNING_ENABLED\s*=\s*)false\b/, '$1true');
                    if (!/I5_ENCOUNTER_TUNING_ENABLED\s*=\s*true\b/.test(content)) throw Error('Unrecognized I5 tuning flag declaration');
                }
                sourceCache.set(id, content);
            }
            return sourceCache.get(id);
        } } }];
const source = resolve(out, 'source');
await mkdir(source, { recursive: true });
for (const file of ['sim-core.ts', 'sim-native-emulation.ts', 'sim.mjs', 'sim-metrics.mjs', 'sim-worker.mjs', 'policy.mjs', 'ability-aim.ts', 'bot-navigation.ts', 'bot-navigation-version.mjs'])
    await writeFile(resolve(source, file), policySources.get(resolve('scripts/nextgen/playtest', file)) ?? await readFile(resolve('scripts/nextgen/playtest', file)));
await build({ configFile: false, publicDir: false, plugins, logLevel: 'error', build: { ssr: resolve('scripts/nextgen/playtest/sim-core.ts'), outDir: source, emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'sim-core.mjs' } } } });
if (args.tuning && !sourceCache.has(tuningFile)) throw Error('--tuning requires a game revision with the I5 encounter flag');
const tuningEnabled = sourceCache.has(tuningFile) ? /I5_ENCOUNTER_TUNING_ENABLED\s*=\s*true\b/.test(sourceCache.get(tuningFile)) : undefined;
const { runSimulation, summarizeSimulations, SIM_ACTOR_RADII } = await import(pathToFileURL(resolve(source, 'sim-core.mjs')).href + '?' + Date.now());
const seeds = String(args.seeds ?? args.seed ?? '1729,2718,31415,42,137,8675309,2026,9001,65537,123456').split(',').map(Number);
const rigs = String(args.rigs ?? args.rig ?? 'breacher,cryo,pyro,arc').split(',');
if (!seeds.length || seeds.some(seed => !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff))
    throw Error('seeds must be unsigned integers');
if (!rigs.length || rigs.some(rig => !['breacher', 'cryo', 'pyro', 'arc'].includes(rig)))
    throw Error('Invalid rig');
if (args.rooms && (!Number.isInteger(Number(args.rooms)) || Number(args.rooms) < 1 || Number(args.rooms) > 20))
    throw Error('rooms must be 1..20');
const reports = [], metrics = await actorMetrics(SIM_ACTOR_RADII);
const policyHash = createHash('sha256').update(await readFile(resolve(source,'policy.mjs'))).update(await readFile(resolve(source,'ability-aim.ts'))).update(await readFile(resolve(source,'bot-navigation.ts'))).update(await readFile(resolve(source,'bot-navigation-version.mjs'))).digest('hex');
const gameHash = createHash('sha256').update([...sourceCache].sort(([a], [b]) => a.localeCompare(b)).map(([path, content]) => path.slice(root.length + 1) + '\n' + content).join('\n')).digest('hex');
for (const path of ['src/DepthGame.ts', 'src/game/abilities/AbilitySystem.ts', 'src/game/roguelike/progression.ts', 'src/game/waves/EncounterDirector.ts', 'src/game/enemies/EnemySystem.ts', 'src/game/roguelike/i5Tuning.ts'])
    if (sourceCache.has(resolve(path))) {
        const destination = resolve(source, path);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, sourceCache.get(resolve(path)));
    }
const bundleHash = createHash('sha256').update(await readFile(resolve(source, 'sim-core.mjs'))).digest('hex');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
// A workspace HEAD does not identify uncommitted backend fixes: freeze their full source and patch identities.
const backendFiles = ['sim-core.ts', 'sim-native-emulation.ts', 'sim.mjs', 'sim-metrics.mjs', 'sim-worker.mjs'];
const backendSources = await Promise.all(backendFiles.map(async file => ({file, bytes: await readFile(resolve(source,file))})));
const backendSourceHashes = Object.fromEntries(backendSources.map(({file,bytes}) => [file,createHash('sha256').update(bytes).digest('hex')]));
const backendHash = createHash('sha256').update(backendSources.map(({file,bytes})=>file+'\n'+bytes.toString()).join('\n')).digest('hex');
const trackedBackendPatch = execFileSync('git',['diff','--binary','HEAD','--',...backendFiles.map(file=>'scripts/nextgen/playtest/'+file)],{encoding:'utf8'});
const newBackendFiles = backendSources.filter(({file})=>{
    try {execFileSync('git',['cat-file','-e',head+':scripts/nextgen/playtest/'+file],{stdio:'ignore'});return false;} catch {return true;}
});
const backendPatch = trackedBackendPatch + newBackendFiles.map(({file,bytes})=>'\n--- untracked backend source: '+file+' ---\n'+bytes.toString()).join('');
const backendProvenance = {workspaceHead:head,mode:'sim-human-v1',dirtyBackend:backendPatch.length>0,
    patchHash:createHash('sha256').update(backendPatch).digest('hex'),backendHash,sourceHashes:backendSourceHashes,
    patchFormat:'git diff --binary HEAD for tracked backend files followed by exact untracked source snapshots'};
await writeFile(resolve(source,'backend.patch'),backendPatch);
await writeFile(resolve(source,'backend-provenance.json'),JSON.stringify(backendProvenance,null,2)+'\n');
const workers = Number(args.workers ?? 1);
if (![1, 2, 3].includes(workers))
    throw Error('workers must be 1..3');
const queue = rigs.flatMap(rig => seeds.map(seed => ({ rig, seed })));
async function worker() {
    while (queue.length) {
        const { rig, seed } = queue.shift();
        const options = { rig, seed, roomOrder:args['room-order'], readExchange:args['exchange-marks']==='on', recoveryGrilles:args['exchange-marks']==='absent'?'release-only':args['exchange-marks']!==undefined, difficulty:args.difficulty??'standard', profile:args.profile??'competent', metrics, rooms: args.rooms ? Number(args.rooms) : undefined, assisted: !!args.assisted, legacy: !!args.legacy, trace: !!args.trace, conditionsOff:!!args['conditions-off'], maxRoomSeconds: args['max-room-seconds'] ? Number(args['max-room-seconds']) : undefined };
        const report = workers === 1 ? runSimulation(options) : await new Promise((ok, fail) => {
            const child = spawn(process.execPath, [resolve(source,'sim-worker.mjs'), resolve(source, 'sim-core.mjs'), JSON.stringify(options)], { stdio: ['ignore', 'pipe', 'inherit'] });
            const parts = [];
            child.stdout.on('data', data => parts.push(data));
            child.on('error', fail);
            child.on('exit', code => { if (code !== 0)
                fail(Error(`Sim worker exited ${code}`));
            else
                try {
                    ok(JSON.parse(Buffer.concat(parts).toString()));
                }
                catch (error) {
                    fail(error);
                } });
        });
        report.head = head;
        report.backendProvenance = backendProvenance;
        report.gameRef = gameRef ?? 'working-tree';
        report.policyRef = args['policy-revision'] ?? 'working-tree';
        if (tuningEnabled !== undefined) report.tuningEnabled = tuningEnabled;
        report.bundleHash = bundleHash;
        report.policyHash = policyHash;
        report.gameHash = gameHash;
        reports.push(report);
        await writeFile(resolve(out, `${rig}-${seed}.json`), JSON.stringify(report, null, 2));
        console.log(`${rig} ${seed}: ${report.outcome}, ${report.rooms.filter(r => ['clear', 'complete'].includes(r.result)).length} clears, ${report.stats.overdrivesUsed} OD, ${report.wallSeconds.toFixed(2)}s wall`);
        await writeFile(resolve(out, 'summary.json'), JSON.stringify({ head, roomOrder:args['room-order']??'policy', difficulty:args.difficulty??'standard', profile:args.profile??'competent', backendProvenance, gameRef: gameRef ?? 'working-tree', tuningEnabled, bundleHash, policyHash, gameHash, workers, ...summarizeSimulations(reports) }, null, 2));
    }
}
await Promise.all(Array.from({ length: workers }, worker));
