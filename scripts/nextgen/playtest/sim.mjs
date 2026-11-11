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
const allowed = new Set(['label', 'rig', 'rigs', 'seed', 'seeds', 'rooms', 'assisted', 'legacy', 'trace', 'max-room-seconds', 'workers', 'game-ref', 'game-revision']);
const args = Object.fromEntries(process.argv.slice(2).map(arg => { const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.length ? value.join('=') : true]; }));
for (const key of Object.keys(args))
    if (!allowed.has(key))
        throw Error(`Unknown option ${key}`);
if (args.label && !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(String(args.label)))
    throw Error('Unsafe label');
const out = resolve('artifacts/nextgen/playtest', args.label ?? 'sim');
await mkdir(out, { recursive: true });
const gameRef = args['game-revision'] ?? args['game-ref'];
const sourceCache = new Map();
const plugins = [{ name: 'simulation-snapshot', load(id) { if (id === root + '/src/DepthGame.ts' || id.startsWith(root + '/src/game/')) {
            if (!sourceCache.has(id))
                sourceCache.set(id, gameRef ? execFileSync('git', ['show', `${gameRef}:${id.slice(root.length + 1)}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }) : readFileSync(id, 'utf8'));
            return sourceCache.get(id);
        } } }];
const source = resolve(out, 'source');
await mkdir(source, { recursive: true });
for (const file of ['sim-core.ts', 'sim.mjs', 'sim-metrics.mjs', 'sim-worker.mjs', 'policy.mjs', 'bot-navigation.ts', 'bot-navigation-version.mjs'])
    await writeFile(resolve(source, file), await readFile(resolve('scripts/nextgen/playtest', file)));
await build({ configFile: false, plugins, logLevel: 'error', build: { ssr: resolve('scripts/nextgen/playtest/sim-core.ts'), outDir: source, emptyOutDir: false, rollupOptions: { output: { entryFileNames: 'sim-core.mjs' } } } });
const { runSimulation, summarizeSimulations } = await import(pathToFileURL(resolve(source, 'sim-core.mjs')).href + '?' + Date.now());
const seeds = String(args.seeds ?? args.seed ?? '1729,2718,31415,42,137,8675309,2026,9001,65537,123456').split(',').map(Number);
const rigs = String(args.rigs ?? args.rig ?? 'breacher,cryo,pyro,arc').split(',');
if (!seeds.length || seeds.some(seed => !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff))
    throw Error('seeds must be unsigned integers');
if (!rigs.length || rigs.some(rig => !['breacher', 'cryo', 'pyro', 'arc'].includes(rig)))
    throw Error('Invalid rig');
if (args.rooms && (!Number.isInteger(Number(args.rooms)) || Number(args.rooms) < 1 || Number(args.rooms) > 20))
    throw Error('rooms must be 1..20');
const reports = [], metrics = await actorMetrics();
const policyHash = createHash('sha256').update(await readFile(resolve('scripts/nextgen/playtest/policy.mjs'))).update(await readFile(resolve('scripts/nextgen/playtest/bot-navigation.ts'))).update(await readFile(resolve('scripts/nextgen/playtest/bot-navigation-version.mjs'))).digest('hex');
const gameHash = createHash('sha256').update([...sourceCache].sort(([a], [b]) => a.localeCompare(b)).map(([path, content]) => path.slice(root.length + 1) + '\n' + content).join('\n')).digest('hex');
for (const path of ['src/DepthGame.ts', 'src/game/abilities/AbilitySystem.ts', 'src/game/roguelike/progression.ts', 'src/game/waves/EncounterDirector.ts'])
    if (sourceCache.has(resolve(path))) {
        const destination = resolve(source, path);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, sourceCache.get(resolve(path)));
    }
const bundleHash = createHash('sha256').update(await readFile(resolve(source, 'sim-core.mjs'))).digest('hex');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const workers = Number(args.workers ?? 1);
if (![1, 2].includes(workers))
    throw Error('workers must be 1 or 2');
const queue = rigs.flatMap(rig => seeds.map(seed => ({ rig, seed })));
async function worker() {
    while (queue.length) {
        const { rig, seed } = queue.shift();
        const options = { rig, seed, metrics, rooms: args.rooms ? Number(args.rooms) : undefined, assisted: !!args.assisted, legacy: !!args.legacy, trace: !!args.trace, maxRoomSeconds: args['max-room-seconds'] ? Number(args['max-room-seconds']) : undefined };
        const report = workers === 1 ? runSimulation(options) : await new Promise((ok, fail) => {
            const child = spawn(process.execPath, [resolve('scripts/nextgen/playtest/sim-worker.mjs'), resolve(source, 'sim-core.mjs'), JSON.stringify(options)], { stdio: ['ignore', 'pipe', 'inherit'] });
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
        report.gameRef = gameRef ?? 'working-tree';
        report.bundleHash = bundleHash;
        report.policyHash = policyHash;
        report.gameHash = gameHash;
        reports.push(report);
        await writeFile(resolve(out, `${rig}-${seed}.json`), JSON.stringify(report, null, 2));
        console.log(`${rig} ${seed}: ${report.outcome}, ${report.rooms.filter(r => ['clear', 'complete'].includes(r.result)).length} clears, ${report.stats.overdrivesUsed} OD, ${report.wallSeconds.toFixed(2)}s wall`);
        await writeFile(resolve(out, 'summary.json'), JSON.stringify({ head, gameRef: gameRef ?? 'working-tree', bundleHash, policyHash, gameHash, workers, ...summarizeSimulations(reports) }, null, 2));
    }
}
await Promise.all(Array.from({ length: workers }, worker));
