#!/usr/bin/env node
/** Replay final4 coverage plus wave7 proofs through I10's guarded serial capture method. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {loadavg} from 'node:os';
import {SCENARIOS} from './scenarios.mjs';
const option=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const width=Number(option('width','1920')),height=Number(option('height','1080'));
assert([[1920,1080],[1280,720]].some(v=>v[0]===width&&v[1]===height),'Desktop evidence sizes only');
const source=JSON.parse(await readFile('artifacts/nextgen/i11/frozen-source.json'));
const history=resolve(option('history','/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final4'));
const prior=JSON.parse(await readFile(resolve(history,'manifest.json'))),entries=new Map();
function add(key,frames=4){
  const scenario=SCENARIOS.find(s=>s.id===key)||SCENARIOS.find(s=>s.rooms&&s.id===key.split(':')[0]);
  assert(scenario,`Missing scenario ${key}`);
  if(!entries.has(key))entries.set(key,{key,frames,masks:/silhouette|families|k7-standard|k7-windup/.test(key)});
}
for(const shot of prior.shots){
  const s=SCENARIOS.find(s=>s.id===shot.scenario);assert(s,shot.scenario);
  const key=s.rooms?`${s.id}:${shot.room}`:s.id;
  add(key,s.burst?prior.shots.filter(p=>p.scenario===shot.scenario&&p.room===shot.room).length:4);
}
const moods=['awakening-bay','residential-gallery','crew-checkpoint','freight-hold','relay-racks','diagnostic-gallery','service-shaft-landing','infested-workshop','shielding-gate','overload-floor'];
for(const room of moods)add(`c6-silhouettes:${room}`);
for(const room of ['containment-annulus','infested-workshop'])for(const status of ['frozen','burning'])add(`k7-${status}-families:${room}`);
for(const rig of ['breacher','cryo','pyro','arc'])add(`k7-standard-${rig}:awakening-bay`);
for(const kind of ['brute','spitter'])add(`k7-windup-${kind}`);
for(const ability of ['railbreaker','whiteout','meltdown','overclock'])for(const room of ['containment-annulus','infested-workshop'])for(const low of [false,true])add(`v7-state-${ability}${low?'-low':''}-${room}`);
for(const ability of ['bulwark','glacier','napalm-charge','tesla-pylon'])for(const validity of ['valid','blocked'])add(`v7-placement-${ability}-${validity}`);
for(const origin of ['weapon','grenade','rocket','nest','queen'])add(`v7-material-explosion-${origin}`,7);
for(const key of ['e7-landmark-annulus','e7-landmark-cargo','i11-legacy-acid-boundary'])add(key);
const batches=[];
for(const frames of [4,7])for(const masks of [false,true]){
  const same=[...entries.values()].filter(e=>e.frames===frames&&e.masks===masks);
  for(let n=0;n<same.length;n+=10)batches.push({frames,masks,scenarios:same.slice(n,n+10).map(e=>e.key)});
}
assert([...entries.values()].every(e=>[4,7].includes(e.frames)),'Unexpected historical phase count');
const start=Number(option('start','0')),end=Number(option('end',String(batches.length))),receipts=[];
await writeFile(`artifacts/nextgen/i11/capture-plan-${height}.json`,JSON.stringify({source,history,batches},null,2)+'\n');
for(let n=start;n<Math.min(end,batches.length);n++){
  const batch=batches[n],label=`i11-${height}-batch-${String(n).padStart(2,'0')}`;
  const args=['scripts/nextgen/i10-run.mjs',label,'npm','run','capture','--',`--label=${label}`,`--width=${width}`,`--height=${height}`,`--burst=${batch.frames}`,'--sprite-width=1920','--kiting-retries=32','--graphics={"adaptiveResolution":false}','--failure-evidence',`--dist=${source.directory}`,`--dist-source-sha=${source.sourceSHA}`,`--scenarios=${batch.scenarios.join(',')}`];
  console.log(`I11 ${height}: batch ${n+1}/${batches.length}; load=${loadavg()}`);
  const child=spawn(process.execPath,args,{stdio:'inherit'});
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  receipts.push({batch:n,label,args,code});
  await writeFile(`artifacts/nextgen/i11/capture-receipts-${height}-${start}.json`,JSON.stringify({source,history,receipts},null,2)+'\n');
  assert.equal(code,0,`${label} failed; raw evidence retained. Resume in a new retry label, never overwrite this failed parent.`);
}
console.log(JSON.stringify({height,batches:batches.length,completed:receipts.length}));
