#!/usr/bin/env node
import {build} from 'vite';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {cpus,loadavg,freemem} from 'node:os';
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const out=resolve('artifacts/nextgen/a3',args.label??'cost');await mkdir(out,{recursive:true});
await build({configFile:false,publicDir:false,logLevel:'error',plugins:args.ref?[{name:'frozen-game',load(id){if(id.startsWith(resolve('src/game')+'/'))return execFileSync('git',['show',`${args.ref}:${id.slice(process.cwd().length+1)}`],{encoding:'utf8'});}}]:[],build:{ssr:resolve('src/game/enemies/EnemySystem.ts'),outDir:out,emptyOutDir:false,rollupOptions:{output:{entryFileNames:'enemy.mjs'}}}});
const {EnemySystem}=await import(pathToFileURL(resolve(out,'enemy.mjs')));
const hostStart={load:loadavg(),logicalCores:cpus().length,freeBytes:freemem()};
const trials=[];
for(let trial=0;trial<7;trial++){
 const system=new EnemySystem();for(let i=0;i<60;i++)system.spawn(i%5===0?'brute':i%5===1?'spitter':'crawler',500+i%10*32,400+Math.floor(i/10)*32);
 for(let i=0;i<600;i++)system.update(1000/60,{x:800+Math.cos(i/300)*240,y:650+Math.sin(i/300)*160,radius:16});
 const start=performance.now();for(let i=0;i<3600;i++)system.update(1000/60,{x:800+Math.cos(i/300)*240,y:650+Math.sin(i/300)*160,radius:16});
 trials.push((performance.now()-start)/3600);
}
const report={hostStart,hostEnd:{load:loadavg(),freeBytes:freemem()},ref:args.ref??'working-tree',enemies:60,stepsPerTrial:3600,trialsMs:trials,medianMs:[...trials].sort((a,b)=>a-b)[3],description:'Node deterministic simulation update only; shared host, no rendering or snapshots'};
await writeFile(resolve(out,'cost.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
