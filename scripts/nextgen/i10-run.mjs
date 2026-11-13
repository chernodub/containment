#!/usr/bin/env node
/** Serial I10 command receipts with a complete combined log and actual host load. */
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {loadavg,cpus} from 'node:os';
import {resolve} from 'node:path';
const [label,executable,...args]=process.argv.slice(2);
if(!/^[\w.-]+$/.test(label)||!executable)throw Error('Usage: i10-run.mjs label executable args...');
const root=resolve('artifacts/nextgen/i10/logs');await mkdir(root,{recursive:true});
const host=()=>({at:new Date().toISOString(),load:loadavg(),cores:cpus().length});
const receipt={label,command:[executable,...args],before:host()},started=performance.now();
const log=createWriteStream(resolve(root,label+'.log'));
const child=spawn(executable,args,{env:{...process.env,VITEST_MAX_WORKERS:process.env.VITEST_MAX_WORKERS??'2'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
receipt.code=await new Promise((ok,fail)=>{child.on('error',fail);child.on('close',ok);});
await new Promise(done=>log.end(done));receipt.seconds=(performance.now()-started)/1000;receipt.after=host();
await writeFile(resolve(root,label+'.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));process.exitCode=receipt.code;
