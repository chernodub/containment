#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {open, mkdir, writeFile, readFile} from 'node:fs/promises';

// Run after the twelve-job campaign queue drains. All launches remain <=2 browsers.
await mkdir('artifacts/nextgen/playtest/logs',{recursive:true});
const results=[];
async function run(label,args) {
  const log=await open(`artifacts/nextgen/playtest/logs/${label}.log`,'w');
  console.log(`Starting ${label}`);
  const code=await new Promise((ok,fail)=>{
    const child=spawn(process.execPath,['scripts/nextgen/playtest/runner.mjs',`--label=${label}`,...args],{stdio:['ignore',log.fd,log.fd]});
    child.on('error',fail);child.on('exit',ok);
  });
  await log.close();results.push({label,code});
  await writeFile('artifacts/nextgen/playtest/supplement-jobs.json',JSON.stringify(results,null,2));
  console.log(`Finished ${label} (${code})`);
}
const resume=(label,rig,seed,extra=[])=>run(label,[`--resume-boundary=artifacts/nextgen/playtest/r4-${rig}-${seed}/r18-containment-annulus-clear.json`,...extra]);
const completedJobs=JSON.parse(await readFile('artifacts/nextgen/playtest/campaign-jobs.json','utf8'));
if(completedJobs.length!==12)throw Error('Wait until all twelve campaign browsers have exited.');
const recovery=[];
for(const job of completedJobs){
  const parent=JSON.parse(await readFile(`artifacts/nextgen/playtest/${job.label}/report.json`,'utf8'));
  if(['complete','dead'].includes(parent.outcome))continue;
  if(parent.outcome!=='loading-hold'&&!(parent.outcome==='error'&&parent.errors.every(e=>/Room is still loading|Native .* is not ready/.test(e.message))))throw Error(`Triage ${job.label} before continuation: ${parent.outcome}`);
  const boundary=[...parent.rooms].reverse().find(r=>r.result==='clear');
  if(!boundary)throw Error(`No earned boundary for ${job.label}`);
  recovery.push({label:`${job.label}-continued`,source:`artifacts/nextgen/playtest/${job.label}/r${boundary.depth+1}-${boundary.id}-clear.json`,probes:job.label==='r4-breacher-1729'});
}
async function recoveryWorker(){while(recovery.length){const job=recovery.shift();await run(job.label,[`--resume-boundary=${job.source}`,...(job.probes?['--checkpoints','--checkpoint-screens=destroy-confirm,complete']:[])]);}}
await Promise.all(Array.from({length:process.argv.includes('--serial')?1:2},()=>recoveryWorker()));
if(process.argv.includes('--recovery-only'))process.exit(0);
await Promise.all([
  run('r4-legacy-arc-assisted',['--rig=arc','--seed=1729','--legacy','--assisted']),
  (async()=>{
    await run('r4-death-lifecycle',['--rig=arc','--seed=1729','--death-probe','--checkpoints','--checkpoint-screens=dead']);
    await run('r4-checkpoint-early',['--rig=arc','--seed=1729','--rooms=4','--checkpoints']);
    await run('r4-shop-proof',['--resume-boundary=artifacts/nextgen/playtest/r4-breacher-2718/r4-communal-atrium-clear.json','--rooms=4','--checkpoints','--checkpoint-screens=shop']);
  })(),
]);
// A real native RAF measurement with no competing campaign/browser.
await resume('r4-serial-late','cryo',1729,['--realtime']);
