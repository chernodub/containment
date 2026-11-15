/** File-only L8 budget comparison. Best trial always retains its own scale/load. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const options=Object.fromEntries(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');assert(i>2);return[arg.slice(2,i),arg.slice(i+1)];}));
for(const key of ['before','after','before-rooms','after-rooms','out'])assert(options[key],'Missing --'+key);
const receipt=async path=>{const bytes=await readFile(path);return{path:resolve(path),sha256:createHash('sha256').update(bytes).digest('hex'),data:JSON.parse(bytes)};};
const [before,after,beforeRooms,afterRooms]=await Promise.all(['before','after','before-rooms','after-rooms'].map(k=>receipt(options[k])));
function bench(packet){
 const data=packet.data;assert(data.timingAcceptanceEligible);assert.deepEqual(data.errors,[]);
 const groups=new Map();
 for(const run of data.runs){
  assert.equal(run.tier,'high');assert(run.timingAcceptanceEligible);assert.equal(run.profile,false);assert(!run.costAudit);assert.equal(run.glError,0);assert.equal(run.contextLost,false);
  const key=run.room+'/'+run.rig,group=groups.get(key)??[];
  assert(!group.some(r=>r.repeat===run.repeat),'Duplicate trial');group.push(run);groups.set(key,group);
 }
 assert([4,8].includes(groups.size),'Two rooms × two or four declared rigs');
 return [...groups].map(([key,runs])=>{
  assert.equal(runs.length,3,'Exactly three predeclared trials');
  const trials=runs.map(run=>({name:run.name,frameP95:run.summary.frame.p95,scaleMin:run.summary.adaptiveScale.min,scaleMedian:run.summary.adaptiveScale.p50,drawMax:run.summary.draws.max,combatCompiles:run.programs,loadBefore:run.before,loadAfter:run.after}));
  const best=[...trials].sort((a,b)=>a.frameP95-b.frameP95||a.name.localeCompare(b.name))[0];
  return{key,trials,best,acceptance:{frameP95:best.frameP95<=20,scaleMin:best.scaleMin>=.9,draws:trials.every(t=>t.drawMax<=330),zeroCompiles:trials.every(t=>t.combatCompiles===0)}};
 });
}
const median=values=>{const xs=[...values].sort((a,b)=>a-b),n=xs.length;return n%2?xs[(n-1)/2]:(xs[n/2-1]+xs[n/2])/2;};
function readiness(packet){
 const data=packet.data;assert.deepEqual(data.errors,[]);assert.deepEqual(data.failures,[]);assert.equal(data.rows.length,42);
 for(const row of data.rows){assert.equal(row.combatCompiles,0);assert.equal(row.postReadyCompiles,0);assert(Number.isFinite(row.total));assert(Number.isFinite(row.preparation.at(-1).total));}
 const rows=data.rows.map(r=>({room:r.room,mode:r.mode,wallMs:r.total,ownerMs:r.preparation.at(-1).total,loadBefore:r.before,loadAfter:r.after}));
 const summary={wallMedian:median(rows.map(r=>r.wallMs)),wallWorst:Math.max(...rows.map(r=>r.wallMs)),ownerMedian:median(rows.map(r=>r.ownerMs)),ownerWorst:Math.max(...rows.map(r=>r.ownerMs))};
 return{rows,...summary,acceptance:{wallWorst:summary.wallWorst<=3000,wallTypical:summary.wallMedian<=1500,ownerWorst:summary.ownerWorst<=3000,ownerTypical:summary.ownerMedian<=1500,zeroPostReadyCompiles:true}};
}
const result={method:'Three predeclared native20s High trials per pair; best is lowest frame p95 with that SAME trial scale/load. Report every raw miss. Scale min>=.9; all trials draws<=330 and zero combat compiles. Readiness includes all42 fresh/sequential rows, caller wall and actual preparation owner times. Shared-host evidence, not universal hardware certification.',receipts:[before,after,beforeRooms,afterRooms].map(({data,...rest})=>({...rest,sourceSHA:data.distSnapshot?.sourceSHA??data.distSourceSHA??data.sha,executionHead:data.sha})),before:bench(before),after:bench(after),readiness:{before:readiness(beforeRooms),after:readiness(afterRooms)}};
assert.deepEqual(result.before.map(r=>r.key).sort(),result.after.map(r=>r.key).sort(),'Matched room/rig timing pairs');
let md='# L8 measured budgets\n\n'+result.method+'\n\n|Pair|Profile|Best p95 ms|Same-trial scale min / median|All-trial max draws|Combat compiles|Strict pass|\n|---|---|---:|---|---:|---:|---|\n';
for(const key of result.before.map(r=>r.key))for(const profile of ['before','after']){const r=result[profile].find(r=>r.key===key),b=r.best;md+=`|${key}|${profile}|${b.frameP95.toFixed(3)}|${b.scaleMin} / ${b.scaleMedian}|${Math.max(...r.trials.map(t=>t.drawMax))}|${Math.max(...r.trials.map(t=>t.combatCompiles))}|${Object.values(r.acceptance).every(Boolean)}|\n`;}
md+='\n|Profile|Caller median / worst ms|Owner median / worst ms|All42 preparation budgets|\n|---|---|---|---|\n';
for(const profile of ['before','after']){const r=result.readiness[profile];md+=`|${profile}|${r.wallMedian.toFixed(3)} / ${r.wallWorst.toFixed(3)}|${r.ownerMedian.toFixed(3)} / ${r.ownerWorst.toFixed(3)}|${Object.values(r.acceptance).every(Boolean)}|\n`;}
md+='\nRaw per-trial scale, frame, draw and before/after host-load receipts remain in the JSON. The original baseline benchmark distSnapshot says unrecorded: its execution HEAD and separately retained baseline SOURCE_SHA establish its source; the raw report is not rewritten. Relay baseline early trials overlapped owned CPU work and are load-limited; no such overlap is permitted for final certification.\n';
await writeFile(options.out+'.json',JSON.stringify(result,null,2)+'\n');await writeFile(options.out+'.md',md);console.log(md);
