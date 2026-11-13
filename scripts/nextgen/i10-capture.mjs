#!/usr/bin/env node
/** Replay I9's exact coverage in bounded serial capture batches, with wave 6 proofs. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {loadavg} from 'node:os';
import {SCENARIOS} from './scenarios.mjs';
const opt=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const label=opt('label','final4'),width=Number(opt('width','1920')),height=Number(opt('height','1080'));
const dist=resolve(opt('dist','dist')),sha=opt('dist-source-sha',execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
const history=resolve(opt('history','/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final3'));
const prior=JSON.parse(await readFile(resolve(history,'manifest.json'))),entries=new Map();
for(const shot of prior.shots){
 const scenario=SCENARIOS.find(s=>s.id===shot.scenario);assert(scenario,`Missing prior scenario ${shot.scenario}`);
 const key=scenario.rooms?`${shot.scenario}:${shot.room}`:shot.scenario;
 const frames=prior.shots.filter(s=>s.scenario===shot.scenario&&s.room===shot.room).length;
 entries.set(key,{key,frames:scenario.burst?frames:4});
}
for(const key of ['c6-silhouettes:containment-annulus','c6-frozen-silhouettes:containment-annulus',...['cryo','arc'].flatMap(rig=>['containment-annulus','infested-workshop'].map(room=>`v6-open-${rig==='cryo'?'whiteout':'overclock'}-${room}`))])entries.set(key,{key,frames:4});
const out=resolve('artifacts/nextgen/i10');await mkdir(out,{recursive:true});
const batches=[];
for(const frames of [4,7])for(const masks of [false,true]){const same=[...entries.values()].filter(e=>e.frames===frames&&e.key.includes('silhouette')===masks);for(let n=0;n<same.length;n+=10)batches.push({frames,scenarios:same.slice(n,n+10).map(e=>e.key)});}
assert([...entries.values()].every(e=>[4,7].includes(e.frames)),'Unexpected historical phase count');
const start=Number(opt('start','0')),end=Number(opt('end',String(batches.length)));
const receipts=[];
for(let n=start;n<Math.min(end,batches.length);n++){
 const batch=batches[n],batchLabel=`${label}-batch-${String(n).padStart(2,'0')}`;
 const args=['run','capture','--',`--label=${batchLabel}`,`--width=${width}`,`--height=${height}`,`--burst=${batch.frames}`,'--sprite-width=1920','--kiting-retries=32',`--dist=${dist}`,`--dist-source-sha=${sha}`,`--scenarios=${batch.scenarios.join(',')}`];
 if(batch.scenarios.some(id=>id.includes('silhouette')))args.push('--graphics={"adaptiveResolution":false}');
 console.log(`I10 ${n+1}/${batches.length}: ${batchLabel}; load=${loadavg()}`);
 const before={time:new Date().toISOString(),load:loadavg()},run=spawnSync('npm',args,{stdio:'inherit'});
 receipts.push({batch:n,label:batchLabel,args,before,after:{time:new Date().toISOString(),load:loadavg()},exit:run.status});
 await writeFile(resolve(out,`${label}-capture-receipts-${start}.json`),JSON.stringify({history,sha,dist,batches,receipts},null,2)+'\n');
 assert.equal(run.status,0,`${batchLabel} failed; original evidence retained`);
}
console.log(JSON.stringify({label,batches:batches.length,completed:receipts.length}));
