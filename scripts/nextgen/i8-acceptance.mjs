#!/usr/bin/env node
/** Serialized final desktop gates and N=5 timing evidence; retains every exit/load. */
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {loadavg,cpus} from 'node:os';
const root=process.cwd(),logs=root+'/artifacts/nextgen/i8/logs',dist='artifacts/nextgen/i8/budgeted-dist';
const source=(await readFile(dist+'/SOURCE_SHA','utf8')).trim();await mkdir(logs,{recursive:true});
const rooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
const receipt={sourceSHA:source,harnessSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),started:new Date().toISOString(),cores:cpus().length,steps:[]};
async function run(name,args,allowBlender=false){
 const started=Date.now(),before=loadavg(),log=createWriteStream(logs+'/'+name+'.log');console.log('START',name,before);
 const child=spawn('npm',args,{cwd:root,env:{...process.env,VITEST_MAX_WORKERS:'2'},stdio:['ignore','pipe','pipe']});child.stdout.pipe(log);child.stderr.pipe(log);
 const code=await new Promise((ok,fail)=>{child.on('error',fail);child.on('close',ok);});await new Promise(ok=>log.end(ok));
 const knownEnvironmentBlock=allowBlender&&code!==0&&(await readFile(logs+'/'+name+'.log','utf8')).includes("No such file or directory: 'blender'");
 const step={name,args,code,knownEnvironmentBlock,seconds:(Date.now()-started)/1000,loadStart:before,loadEnd:loadavg()};receipt.steps.push(step);await writeFile(logs+'/acceptance-budgeted.json',JSON.stringify(receipt,null,2));console.log('DONE',JSON.stringify(step));
 if(code&&!knownEnvironmentBlock)throw Error(name+' failed; original log retained');
}
await run('verify-budgeted',['run','verify'],true);
await run('build-budgeted',['run','build']);
await run('room-evidence-budgeted',['run','test:room-evidence']);
await run('smoke-budgeted',['run','test:smoke']);
await run('authored-twenty-budgeted',['run','test:authored-smoke:all','--','--rooms='+rooms.join(','),'--out=artifacts/authored-smoke/i8-budgeted-twenty']);
await run('playtest-smoke-budgeted',['run','playtest:smoke']);
const common=['--no-build','--dist='+dist,'--dist-source-sha='+source];
await run('rooms-budgeted',['run','bench:rooms','--','--label=i8-rooms-budgeted',...common]);
await run('bench-budgeted',['run','bench','--','--label=i8-budgeted-bench',...common]);
const bench=JSON.parse(await readFile('artifacts/nextgen/i8-budgeted-bench/benchmark.json','utf8'));
if(bench.runs.length!==48)throw Error('Expected complete48-trial matrix');
await run('bench-budgeted-extra',['run','bench','--','--label=i8-budgeted-extra',...common,'--rooms='+bench.rooms.join(','),'--repeat=2']);
await run('profile-budgeted',['run','bench','--','--label=i8-profile-budgeted',...common,'--rooms='+bench.rooms.join(','),'--rigs=arc','--tiers=high','--repeat=1','--gpu-passes']);
