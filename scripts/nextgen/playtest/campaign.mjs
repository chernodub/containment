#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {mkdir, open, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Deliberately two browsers maximum; do not run browser gates concurrently.
const rigs=['breacher','cryo','pyro','arc'];
const seeds=[1729,2718,31415];
const queue=rigs.flatMap(rig=>seeds.map(seed=>({rig,seed,label:`r4-${rig}-${seed}`})));
const receipts=[];
await mkdir('artifacts/nextgen/playtest/logs',{recursive:true});
async function worker() {
  while(queue.length) {
    const job=queue.shift(),log=await open(resolve('artifacts/nextgen/playtest/logs',`${job.label}.log`),'w');
    console.log(`Starting ${job.label}`);
    const code=await new Promise((ok,fail)=>{
      const child=spawn(process.execPath,['scripts/nextgen/playtest/runner.mjs',`--rig=${job.rig}`,`--seed=${job.seed}`,`--label=${job.label}`],{stdio:['ignore',log.fd,log.fd]});
      child.on('error',fail);child.on('exit',ok);
    });
    await log.close();receipts.push({...job,code});
    await writeFile('artifacts/nextgen/playtest/campaign-jobs.json',JSON.stringify(receipts,null,2));
    console.log(`Finished ${job.label} (${code})`);
  }
}
await Promise.all([worker(),worker()]);
