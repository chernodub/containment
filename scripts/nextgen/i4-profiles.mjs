#!/usr/bin/env node
/** Keep sampled allocation/GC/audio telemetry separate from unprofiled timing trials. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const [beforeLabel='integration-4-profile-before',afterLabel='integration-4-profile-after']=process.argv.slice(2),root=resolve('artifacts/nextgen'),out=resolve(root,'integration-4');
await mkdir(out,{recursive:true});
const read=async label=>JSON.parse(await readFile(resolve(root,label,'benchmark.json'))),before=await read(beforeLabel),after=await read(afterLabel);
const key=r=>`${r.room} / ${r.rig} / ${r.tier}`,a=new Map(before.runs.map(r=>[key(r),r])),b=new Map(after.runs.map(r=>[key(r),r]));
assert.equal(before.errors.length,0);assert.equal(after.errors.length,0);assert.deepEqual([...a.keys()],[...b.keys()]);
const stats=values=>{if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);return {p50:s[Math.floor((s.length-1)*.5)],p95:s[Math.ceil(s.length*.95)-1],max:s.at(-1),samples:s.length};};
const summarize=(run,label)=>{
 assert(run.profile&&run.profiling,'Missing profiling data');
 return {load:run.before.load,allocationMBPerSecond:run.profiling.sampledAllocationBytesPerSecond/1048576,
  gcPausesMs:stats(run.profiling.gcPausesMs),gcEventNames:run.profiling.gcEventNames,
  audioGraphCapacityPercent:run.summary.audioGraphCapacityPercent??null,
  audioIntervalRunningMean:run.summary.audioCallbackIntervalMean??null,
  audioContexts:run.profiling.audioContexts,audioError:run.profiling.audioError,
  heapUsedMB:run.cdp.final.find(m=>m.name==='JSHeapUsedSize')?.value/1048576,
  cpuProfile:resolve(root,label,run.name+'.cpuprofile'),heapProfile:resolve(root,label,run.name+'.heapprofile'),trace:resolve(root,label,run.name+'.trace.json')};
};
const rows=[...a].map(([scenario,run])=>({scenario,before:summarize(run,beforeLabel),after:summarize(b.get(scenario),afterLabel)}));
const n=v=>v==null?'—':v.toFixed(2),gc=r=>r.gcPausesMs?`${n(r.gcPausesMs.p50)} / ${n(r.gcPausesMs.p95)} / ${n(r.gcPausesMs.max)}`:'no completed pause events';
const note='Separate 20s CPU/heap/tracing runs. Allocation is sampled (including collected objects), includes fixture/instrumentation work and is not a claim of global zero allocation. GC uses outer completed minor/major events, falling back to completed V8 collector events. WebAudio capacity is native graph rendering percentage; callback interval means are protocol telemetry, not individual callback CPU durations. Profiling changes execution cost; these timings are excluded from the primary comparison.';
const table=['| Room / rig / tier | Load before → after | Sampled allocation MB/s before → after | GC p50 / p95 / max ms before → after | Native audio graph average % before → after | Heap used MB before → after |','|---|---:|---:|---:|---:|---:|',...rows.map(r=>`| ${r.scenario} | ${n(r.before.load[0])} → ${n(r.after.load[0])} | ${n(r.before.allocationMBPerSecond)} → ${n(r.after.allocationMBPerSecond)} | ${gc(r.before)} → ${gc(r.after)} | ${n(r.before.audioGraphCapacityPercent?.average)} → ${n(r.after.audioGraphCapacityPercent?.average)} | ${n(r.before.heapUsedMB)} → ${n(r.after.heapUsedMB)} |`)];
await writeFile(resolve(out,'profiles.json'),JSON.stringify({note,rows},null,2));await writeFile(resolve(out,'profiles.md'),note+'\n\n'+table.join('\n')+'\n');console.log(table.join('\n'));
