/** Serial native campaigns. Production runner owns inputs, assertions and cleanup. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createWriteStream,existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const options=Object.fromEntries(process.argv.slice(2).map(arg=>{
 const index=arg.indexOf('=');assert(index>2,'Use --dist=... --prefix=...');
 return[arg.slice(2,index),arg.slice(index+1)];
}));
assert(options.dist&&options.prefix,'Supply immutable --dist and unique --prefix');
assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(options.prefix));
const dist=resolve(options.dist),source=(await readFile(resolve(dist,'SOURCE_SHA'),'utf8')).trim();
assert.match(source,/^[a-f0-9]{40}$/,'Distribution needs its exact source stamp');
const rigs=['breacher','cryo','pyro','arc'];
const directory=resolve('artifacts/nextgen',options.prefix+'-campaigns');
assert(!existsSync(directory),'Keep every prior dispatch, including failures');
for(const rig of rigs)assert(!existsSync(resolve('artifacts/nextgen/playtest',options.prefix+'-'+rig)),'Refuse to overwrite native raw run '+rig);
await mkdir(directory,{recursive:true});
const dispatch={source,dist,seed:1729,scope:'Four ordinary unassisted native20-room attempts, every fixed tick rendered, one browser at a time. All rigs record Swarm fighting if reached; Arc also records the three standard rooms. Natural deaths remain attempts; timings are not hardware FPS.',runs:[]};
const save=()=>writeFile(resolve(directory,'dispatch.json'),JSON.stringify(dispatch,null,2)+'\n');
await save();
for(const rig of rigs){
 const label=options.prefix+'-'+rig,logPath=resolve(directory,rig+'.log');
 const args=['run','playtest','--','--rig='+rig,'--seed=1729','--label='+label,'--dist-dir='+dist];
 args.push('--storyboard-room='+(rig==='arc'?'residential-gallery,crew-checkpoint,relay-racks,swarm-junction':'swarm-junction'));
 const run={rig,label,argv:['npm',...args],logPath,status:'running'};
 dispatch.runs.push(run);await save();console.log('Native campaign started: '+rig);
 const log=createWriteStream(logPath,{flags:'wx'});
 const child=spawn('npm',args,{cwd:process.cwd(),stdio:['ignore','pipe','pipe'],env:process.env});
 child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 const code=await new Promise((done,reject)=>{child.once('error',reject);child.once('close',done);});
 await new Promise(done=>log.end(done));
 run.exitCode=code;run.status=code===0?'checking receipts':'failed';await save();
 assert.equal(code,0,'Native runner failed; preserve '+logPath);
 const reportPath=resolve('artifacts/nextgen/playtest',label,'report.json');
 const report=JSON.parse(await readFile(reportPath,'utf8'));
 assert.equal(report.distributionSourceSHA,source);assert.equal(report.rig,rig);assert.equal(report.seed,1729);
 assert.equal(report.roomLimit,20);assert.equal(report.assisted,false);assert.equal(report.fastRendering,false);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.defects,[]);
 assert(['complete','dead'].includes(report.outcome),'No censor or forced-clear outcome');
 assert(report.rooms.slice(0,5).length===5&&report.rooms.slice(0,5).every(room=>room.result==='clear'),'Welcoming native act1');
 if(report.outcome==='dead')assert(report.deathRoom>=9,'Early native campaign death requires review');
 run.status='passed';run.reportPath=reportPath;run.outcome=report.outcome;run.deathRoom=report.deathRoom;run.clearedRooms=report.rooms.filter(room=>['clear','complete'].includes(room.result)).length;
 await save();console.log(`Native ${rig}: ${run.outcome}; ${run.clearedRooms} clears;0 errors/defects`);
}
dispatch.complete=true;await save();
console.log('L8 native campaigns passed:4 rigs, unassisted/every tick rendered,0 errors/defects; '+directory);
