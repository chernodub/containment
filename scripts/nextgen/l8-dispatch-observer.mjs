#!/usr/bin/env node
/** Prepare ONLY. Generated diagnostic runner requires separate authorization to run. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function once(source, needle, replacement) {
    if (source.split(needle).length !== 2) throw Error('Unrecognized source anchor: ' + needle);
    return source.replace(needle, replacement);
}
export function instrumentDispatchCore(core, observerImport) {
    let out = `import {DispatchObservation,readDispatchSample} from ${JSON.stringify(observerImport)};\n` + core;
    out = once(out, '    let game: DepthGame;', '    let game: DepthGame;\n    let l8Dispatch: DispatchObservation | null = null;');
    out = once(out, '    const onEffect = (e: GameEffect) => {', '    const onEffect = (e: GameEffect) => {\n        l8Dispatch?.effect(e,game);');
    out = once(out, '                game.update(step, input);', '                const l8BeforeStep=l8Dispatch?readDispatchSample(game):null;\n                game.update(step, input);\n                if(l8Dispatch&&l8BeforeStep)l8Dispatch.record(l8BeforeStep,readDispatchSample(game),"native-update");');
    out = once(out, '        delete room.startStats;', '        if(l8Dispatch)room.dispatchObservation=l8Dispatch.finish(game);\n        l8Dispatch=null;\n        delete room.startStats;');
    out = once(out, '            report.rooms.push(room);', '            report.rooms.push(room);\n            l8Dispatch=new DispatchObservation(game);');
    out = once(out, '            applyNativeImmediateKey(game, key, readInput);', '            const l8BeforeKey=l8Dispatch?readDispatchSample(game):null;\n            applyNativeImmediateKey(game, key, readInput);\n            if(l8Dispatch&&l8BeforeKey)l8Dispatch.record(l8BeforeKey,readDispatchSample(game),"native-key:"+key);');
    return out;
}

export async function prepareDispatchRunner({label, gameRevision}) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label) || !/^[a-f0-9]{40}$/.test(gameRevision))
        throw Error('Explicit safe label and committed40-character game revision required');
    const root=process.cwd(), generated=resolve('artifacts/nextgen/l8-sim/dispatch-runners');
    const originalCore=await readFile('scripts/nextgen/playtest/sim-core.ts','utf8');
    const originalRunner=await readFile('scripts/nextgen/playtest/sim.mjs','utf8');
    const observerPath=resolve('scripts/nextgen/l8-dispatch-observation.mjs');
    const observerBytes=await readFile(observerPath);
    const observerSnapshotPath=resolve('artifacts/nextgen/playtest',label,'source/l8-dispatch-observation.mjs');
    const core=instrumentDispatchCore(originalCore,observerSnapshotPath);
    const meta={diagnostic:true,acceptance:false,gameRevision,
        purpose:'Read-only actual dispatch/Overdrive observation; no geometry, input or policy edits',
        originalCoreSHA256:hash(originalCore),observedCoreSHA256:hash(core),
        originalRunnerSHA256:hash(originalRunner),observerModuleSHA256:hash(observerBytes),
        policyDecisionEdits:false,geometryOverride:false};
    let runner=originalRunner;
    runner=once(runner,"const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');",`const root = ${JSON.stringify(root)};\nconst l8Diagnostic=${JSON.stringify(meta)};`);
    runner=once(runner,"import { actorMetrics } from './sim-metrics.mjs';",`import { actorMetrics } from ${JSON.stringify(pathToFileURL(resolve('scripts/nextgen/playtest/sim-metrics.mjs')).href)};`);
    runner=once(runner,"const gameRef = args['game-revision'] ?? args['game-ref'];",`const gameRef = args['game-revision'] ?? args['game-ref'];\nif(gameRef!==${JSON.stringify(gameRevision)}||args.label!==${JSON.stringify(label)})throw Error('Prepared observer requires its exact declared revision and label');`);
    runner=once(runner,"const plugins = [{ name: 'simulation-snapshot', load(id) {",`const plugins = [{ name: 'simulation-snapshot', load(id) { if(id===root+'/scripts/nextgen/playtest/sim-core.ts')return ${JSON.stringify(core)};`);
    runner=once(runner,'await build({ configFile: false',`await writeFile(resolve(source,'sim-core.ts'),${JSON.stringify(core)});\nawait writeFile(resolve(source,'l8-dispatch-observation.mjs'),${JSON.stringify(observerBytes.toString())});\nawait writeFile(resolve(source,'l8-diagnostic.json'),JSON.stringify(l8Diagnostic,null,2)+'\\n');\nawait build({ configFile: false`);
    runner=once(runner,"await writeFile(resolve(source,'backend.patch'),backendPatch);","backendProvenance.l8Diagnostic=l8Diagnostic;\nawait writeFile(resolve(source,'backend.patch'),backendPatch);");
    runner=once(runner,'        report.head = head;','        report.l8Diagnostic=l8Diagnostic;\n        report.head = head;');
    runner=once(runner,'JSON.stringify({ head, backendProvenance, gameRef:','JSON.stringify({ l8Diagnostic, head, backendProvenance, gameRef:');
    await mkdir(generated,{recursive:true});
    const path=resolve(generated,label+'.mjs');
    await writeFile(path,runner,{flag:'wx'});
    await writeFile(resolve(generated,label+'.json'),JSON.stringify({preparedOnly:true,...meta,generatedRunnerSHA256:hash(runner)},null,2)+'\n',{flag:'wx'});
    return {path,preparedOnly:true,...meta};
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
    const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return i<0?[s.slice(2),true]:[s.slice(2,i),s.slice(i+1)];}));
    if (!args.prepare || Object.keys(args).some(k=>!['prepare','label','game-revision'].includes(k)))
        throw Error('Prepare only: --prepare --label=<unique> --game-revision=<SHA>. No campaign is launched.');
    console.log(JSON.stringify(await prepareDispatchRunner({label:args.label,gameRevision:args['game-revision']}),null,2));
}
