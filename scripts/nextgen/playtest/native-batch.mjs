#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir, open, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {RIGS} from './policy.mjs';

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  assert(/^--[a-z-]+(?:=.*)?$/.test(arg), `Invalid argument ${arg}`);
  const [key, ...value] = arg.slice(2).split('=');
  assert(['difficulty','profile','storyboard-room','label','seeds','rigs','workers','fast','dist-dir','assisted','legacy'].includes(key), `Unknown option ${key}`);
  return [key, value.length ? value.join('=') : true];
}));
const label = String(args.label ?? 'i5-native');
assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label), 'Unsafe label');
const seeds = String(args.seeds ?? '1729,2718').split(',').map(Number);
const rigs = String(args.rigs ?? RIGS.join(',')).split(',');
const workers = Number(args.workers ?? 1);
assert([1,2].includes(workers), 'workers must be 1 or 2; do not overlap browser gates');
assert(seeds.length && seeds.every(s => Number.isInteger(s) && s >= 0 && s <= 0xffffffff), 'Invalid uint32 seeds');
assert(rigs.length && rigs.every(r => RIGS.includes(r)), 'Unknown rig');
assert(new Set(seeds).size === seeds.length && new Set(rigs).size === rigs.length, 'Duplicate jobs');
const out = resolve('artifacts/nextgen/playtest', label);
await mkdir(out, {recursive:true});
const queue = rigs.flatMap(rig => seeds.map(seed => ({rig,seed,label:`${label}-${rig}-${seed}`})));
const jobs = [];
async function worker() {
  while (queue.length) {
    const job = queue.shift();
    const log = await open(resolve(out, `${job.rig}-${job.seed}.log`), 'w');
    console.log(`Starting ${job.label}`);
    const command = ['scripts/nextgen/playtest/runner.mjs', `--rig=${job.rig}`, `--seed=${job.seed}`, `--label=${job.label}`];
    for (const key of ['fast','assisted','legacy']) if (args[key]) command.push(`--${key}`);
    for (const key of ['difficulty','profile','storyboard-room','dist-dir']) if (args[key]) command.push(`--${key}=${args[key]}`);
    const code = await new Promise((ok, fail) => {
      const child = spawn(process.execPath, command, {stdio:['ignore',log.fd,log.fd]});
      child.once('error',fail);child.once('exit',ok);
    });
    await log.close();jobs.push({...job,code});
    await writeFile(resolve(out,'jobs.json'), JSON.stringify({workers,options:args,jobs},null,2));
    console.log(`Finished ${job.label} (${code}); raw defects remain in its report`);
  }
}
await Promise.all(Array.from({length:workers},worker));
