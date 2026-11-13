#!/usr/bin/env node
/** Serial acceptance command receipts, including real host load and exit status. */
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {loadavg,cpus} from 'node:os';
import {resolve} from 'node:path';
const [label, executable, ...args]=process.argv.slice(2);
if(!/^[\w.-]+$/.test(label)||!executable)throw Error('Usage: i9-run.mjs label executable args...');
const root=resolve('artifacts/nextgen/i9/logs');await mkdir(root,{recursive:true});
const host=()=>({at:new Date().toISOString(),load:loadavg(),cores:cpus().length});
const receipt={label,command:[executable,...args],before:host()};
const started=performance.now(),log=createWriteStream(resolve(root,label+'.log'));
const child=spawn(executable,args,{env:{...process.env,VITEST_MAX_WORKERS:process.env.VITEST_MAX_WORKERS??'2'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(log);child.stderr.pipe(log);
const code=await new Promise((ok,fail)=>{child.on('error',fail);child.on('close',ok);});
receipt.seconds=(performance.now()-started)/1000;receipt.after=host();receipt.code=code;
await writeFile(resolve(root,label+'.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));process.exitCode=code;
