#!/usr/bin/env node
/** Diagnostic-only SSR overlay. Never changes live templates or bot decisions. */
import {access,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const root=process.cwd(),argv=process.argv.slice(2),geometryArg=argv.find(a=>a.startsWith('--geometry=')),geometry=geometryArg?.split('=')[1]??'baseline',geometryFileArg=argv.find(a=>a.startsWith('--geometry-file='))?.slice(16);
if(!['baseline','current','custom'].includes(geometry))throw Error('--geometry must be baseline, current or custom');
if(geometry==='custom'&&!geometryFileArg)throw Error('--geometry=custom requires --geometry-file');
const observationMode=argv.find(a=>a.startsWith('--observations='))?.slice(15)??'on';
if(!['on','off'].includes(observationMode))throw Error('--observations must be on or off');
const observe=observationMode==='on';
const args=argv.filter(a=>!a.startsWith('--geometry=')&&!a.startsWith('--geometry-file=')&&!a.startsWith('--observations=')),label=args.find(a=>a.startsWith('--label='))?.slice(8),revision=args.find(a=>a.startsWith('--game-revision='))?.slice(16);
if(!label||!revision)throw Error('Diagnostic requires explicit immutable --label and --game-revision');
if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label))throw Error('Unsafe label');
const hash=s=>createHash('sha256').update(s).digest('hex'),baselinePath=resolve('artifacts/nextgen/l8-baseline/plans/templates.json'),baseline=await readFile(baselinePath,'utf8'),geometryPath=geometry==='custom'?resolve(geometryFileArg):baselinePath,geometryBytes=geometry==='custom'?await readFile(geometryPath,'utf8'):baseline,templates=JSON.parse(geometryBytes);
if(Object.keys(templates).length!==20)throw Error('Expected frozen twenty-room geometry packet');
const geometryModule='const deepFreeze=(v)=>{if(v&&typeof v==="object"){Object.values(v).forEach(deepFreeze);Object.freeze(v);}return v;};\nexport const STORY_ROOM_TEMPLATES=deepFreeze('+JSON.stringify(templates)+');\n';
const originalRunner=await readFile('scripts/nextgen/playtest/sim.mjs','utf8'),originalCore=await readFile('scripts/nextgen/playtest/sim-core.ts','utf8');
function once(source,needle,replacement){if(source.split(needle).length!==2)throw Error('Unrecognized source anchor: '+needle);return source.replace(needle,replacement);}
let core=originalCore;
if(observe){
core=once(core,"const TICK = 1000 / 60;","import {ABILITY_CATALOG, RIG_CATALOG} from '../../../src/game/abilities/catalog';\nconst TICK = 1000 / 60;");
core=once(core,'    const onEffect = (e: GameEffect) => {','    const l8Observer: any = {room:null};\n    const onEffect = (e: GameEffect) => {\n        if(l8Observer.room && e.type===\'ability\' && e.ability && e.ability.phase===\'impact\'){const a=e.ability, o=l8Observer.room.impacts[a.ability]??={events:0,targetOccurrences:0};o.events++;o.targetOccurrences+=(a.targetIds??[]).length;}');
core=once(core,'        delete room.startStats;','        l8Observer.room=null;\n        delete room.startStats;');
core=once(core,'            report.rooms.push(room);','            report.rooms.push(room);\n            room.abilityObservation={decisions:0,livingEnemySamples:0,visibleEnemySamples:0,clearEnemySamples:0,visibleClearEnemySamples:0,slots:{},impacts:{}};l8Observer.room=room.abilityObservation;');
core=once(core,'        const actions = chooseActions(s);',[
'        const actions = chooseActions(s);',
'        const l8o=room.abilityObservation;l8o.decisions++;l8o.livingEnemySamples+=s.enemies.length;l8o.visibleEnemySamples+=s.enemies.filter(e=>e.visible).length;l8o.clearEnemySamples+=s.enemies.filter(e=>e.clear).length;l8o.visibleClearEnemySamples+=s.enemies.filter(e=>e.visible&&e.clear).length;',
"        for(const [slot,key]of [['dash','Shift'],['tactical','q'],['power','f'],['overdrive','v']] as const){const o=l8o.slots[slot]??={ready:0,readyWithVisible:0,readyWithAim:0,readyNoAimWithVisible:0,attempted:0,accepted:0,denied:0,expectedTargetOccurrences:0};const ready=s.abilities.slots?.[slot]?.ready,aim=s.abilityAims?.[slot],self=slot==='dash'||ABILITY_CATALOG[RIG_CATALOG[options.rig].abilities[slot]].targeting==='self';if(ready){o.ready++;if(s.enemies.some(e=>e.visible&&e.clear)){o.readyWithVisible++;if(!self&&!aim)o.readyNoAimWithVisible++;}if(self||aim)o.readyWithAim++;}if(actions.includes(key)){o.attempted++;o.expectedTargetOccurrences+=aim?.targets.length??0;}}"
].join('\n'));
core=once(core,'        if (target) screen = weaponScreen;\n        input = readInput();',"        for(const [slot,key]of [['dash','Shift'],['tactical','q'],['power','f'],['overdrive','v']] as const)if(actions.includes(key)){const o=l8o.slots[slot],used=game.stats.abilityUses[slot]-statsBefore.abilityUses[slot];o.accepted+=used;o.denied+=Number(used===0);}\n        if (target) screen = weaponScreen;\n        input = readInput();");
}
const meta={observationsAdded:observe,diagnostic:true,acceptance:false,purpose:geometry==='baseline'?'Counterfactual current game/navigation with frozen baseline geometry':geometry==='custom'?'Prospective geometry candidate on frozen game/navigation; not acceptance':'Read-only ability observation on current geometry',gameRevision:revision,geometry,baselineGeometryRevision:'7ceefa5a52cc74a6b95712f29653d9bf523906be',baselineGeometryPath:baselinePath,baselineGeometrySHA256:hash(baseline),geometryPath:geometry==='current'?null:geometryPath,geometrySHA256:geometry==='current'?null:hash(geometryBytes),geometryModuleSHA256:geometry!=='current'?hash(geometryModule):null,originalRunnerSHA256:hash(originalRunner),originalCoreSHA256:hash(originalCore),observedCoreSHA256:hash(core),policyDecisionEdits:false};
let runner=originalRunner;
runner=once(runner,"const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');",'const root = '+JSON.stringify(root)+';\nconst l8Diagnostic='+JSON.stringify(meta)+';');
runner=once(runner,"import { actorMetrics } from './sim-metrics.mjs';",'import { actorMetrics } from '+JSON.stringify(pathToFileURL(resolve('scripts/nextgen/playtest/sim-metrics.mjs')).href)+';');
runner=once(runner,"const plugins = [{ name: 'simulation-snapshot', load(id) {", "const plugins = [{ name: 'simulation-snapshot', load(id) { if(id===root+'/scripts/nextgen/playtest/sim-core.ts')return "+JSON.stringify(core)+';');
if(geometry!=='current')runner=once(runner,'                sourceCache.set(id, content);',"                if(id===root+'/src/game/roguelike/storyRoomTemplates.ts')content="+JSON.stringify(geometryModule)+';\n                sourceCache.set(id, content);');
runner=once(runner,"await build({ configFile: false", "await writeFile(resolve(source,'sim-core.ts'),"+JSON.stringify(core)+");\nawait writeFile(resolve(source,'l8-diagnostic.json'),JSON.stringify(l8Diagnostic,null,2)+'\\n');\n"+(geometry!=='current'?"await writeFile(resolve(source,'counterfactual-storyRoomTemplates.ts'),"+JSON.stringify(geometryModule)+");\n":'')+"await build({ configFile: false");
runner=once(runner,"await writeFile(resolve(source,'backend.patch'),backendPatch);","backendProvenance.l8Diagnostic=l8Diagnostic;\nawait writeFile(resolve(source,'backend.patch'),backendPatch);");
runner=once(runner,'        report.head = head;','        report.l8Diagnostic=l8Diagnostic;\n        report.head = head;');
runner=once(runner,"JSON.stringify({ head, backendProvenance, gameRef:","JSON.stringify({ l8Diagnostic, head, backendProvenance, gameRef:");
const generated=resolve('artifacts/nextgen/l8-sim/diagnostic-runners');await mkdir(generated,{recursive:true});
const path=resolve(generated,label+'.mjs');
for(const file of [resolve('artifacts/nextgen/playtest',label),path,resolve(generated,label+'.json')]){try{await access(file);throw Error('Diagnostic label already exists; preserve its frozen source and choose a new label: '+label);}catch(error){if(error.code!=='ENOENT')throw error;}}
await writeFile(path,runner,{flag:'wx'});await writeFile(resolve(generated,label+'.json'),JSON.stringify({...meta,generatedRunnerSHA256:hash(runner)},null,2)+'\n',{flag:'wx'});
const child=spawn(process.execPath,[path,...args],{cwd:root,stdio:'inherit'});child.on('error',e=>{throw e;});process.exitCode=await new Promise(ok=>child.on('exit',code=>ok(code??1)));
