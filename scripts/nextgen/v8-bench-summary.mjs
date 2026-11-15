/** Matched ordinary benchmark review. Every trial and every timing/scale miss stays visible. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const labels=process.argv.slice(2,4);assert.equal(labels.length,2,'Usage: v8-bench-summary.mjs <before-label> <final-label>');
const reports=await Promise.all(labels.map(async label=>JSON.parse(await readFile(resolve('artifacts/nextgen',label,'benchmark.json')))));
const rawLabels=labels.map(label=>[label]);
for(let side=0;side<2;side++){
 const prefix=side?'--after-extra=':'--before-extra=';
 const extraLabels=process.argv.find(arg=>arg.startsWith(prefix))?.slice(prefix.length).split(',').filter(Boolean)??[];
 for(const label of extraLabels){
  const extra=JSON.parse(await readFile(resolve('artifacts/nextgen',label,'benchmark.json')));
  assert.deepEqual(extra.errors,[]);assert.equal(extra.timingAcceptanceEligible,true);
  assert.equal(extra.distSnapshot.sourceSHA,reports[side].distSnapshot.sourceSHA,'Unmatched runtime build');
  reports[side].runs.push(...extra.runs.map(run=>({...run,name:`${label}:${run.name}`})));rawLabels[side].push(label);
 }
}
for(const r of reports){assert.deepEqual(r.errors,[]);assert.equal(r.timingAcceptanceEligible,true);}
const rounded=n=>Math.round(n*10)/10;
const accepted=r=>rounded(r.summary.frame.p50)<=16.7&&(r.tier!=='high'||rounded(r.summary.frame.p95)<=20&&r.summary.adaptiveScale.min>=.9)&&r.summary.draws.max<=330&&r.budget.programs;
const keys=[...new Set(reports[0].runs.map(r=>`${r.room}/${r.rig}/${r.tier}`))];
const review=reports.map(report=>{
 const cases=keys.map(key=>{
  const trials=report.runs.filter(r=>`${r.room}/${r.rig}/${r.tier}`===key);assert(trials.length>=2,key+' lacks best-of-N');
  const sorted=[...trials].sort((a,b)=>Number(accepted(b))-Number(accepted(a))||rounded(a.summary.frame.p95)-rounded(b.summary.frame.p95)||b.summary.adaptiveScale.p50-a.summary.adaptiveScale.p50||a.summary.cpu.p95-b.summary.cpu.p95);
  const selected=sorted[0],peakDraws=Math.max(...trials.map(r=>r.summary.draws.max));
  const misses=trials.flatMap(r=>{
   const result=[];
   if(rounded(r.summary.frame.p50)>16.7)result.push('frame p50');
   if(r.tier==='high'&&rounded(r.summary.frame.p95)>20)result.push('High frame p95');
   if(r.tier==='high'&&r.summary.adaptiveScale.min<.9)result.push('High minimum scale');
   if(r.summary.draws.max>330)result.push('draws');
   if(!r.budget.programs)result.push('combat programs');
   return result.length?[{run:r.name,reasons:result,frame:r.summary.frame,scale:r.summary.adaptiveScale,load:r.before.load[0]}]:[];
  });
  return{key,repeats:trials.length,acceptedTrials:trials.filter(accepted).length,selectedRun:selected.name,frame:selected.summary.frame,scale:selected.summary.adaptiveScale,cpu:selected.summary.cpu,peakDraws,load:selected.before.load[0],allFrameP95:trials.map(r=>r.summary.frame.p95),allMedianScale:trials.map(r=>r.summary.adaptiveScale.p50),misses};
 });
 return{dist:report.distSnapshot,host:report.host,cases,misses:cases.flatMap(c=>c.misses),loadRange:[Math.min(...report.runs.map(r=>r.before.load[0])),Math.max(...report.runs.map(r=>r.before.load[0]))],peakDraws:Math.max(...cases.map(c=>c.peakDraws))};
});
assert.deepEqual(keys,[...new Set(reports[1].runs.map(r=>`${r.room}/${r.rig}/${r.tier}`))]);
const finalAccepted=review[1].cases.every(c=>c.acceptedTrials>0&&c.peakDraws<=330);
const out=resolve('artifacts/nextgen/v8');await mkdir(out,{recursive:true});
const rows=['# V8 matched native benchmark','','Best ordinary frame-p95 trial among jointly passing trials when available, otherwise the least p95 miss; that same trial supplies scale/CPU/load. High requires minimum adaptive scale≥.9, stronger than I11’s median check. Peak draws retain every repeat. Raw misses remain below. Shared-host load is not CPU utilization; no screenshot timing is used.','','| Room /rig /tier | Best frame p95 before→after ms | Median/min scale before→after | Peak draws all repeats | Load1m for selected trial | Jointly passing trials |','|---|---:|---:|---:|---:|---:|'];
for(let i=0;i<keys.length;i++){
 const a=review[0].cases[i],b=review[1].cases[i];
 rows.push(`| ${keys[i]} | ${rounded(a.frame.p95)}→${rounded(b.frame.p95)} | ${a.scale.p50.toFixed(3)}/${a.scale.min.toFixed(3)}→${b.scale.p50.toFixed(3)}/${b.scale.min.toFixed(3)} | ${a.peakDraws}→${b.peakDraws} | ${a.load.toFixed(2)}→${b.load.toFixed(2)} | ${a.acceptedTrials}/${a.repeats}→${b.acceptedTrials}/${b.repeats} |`);
}
for(let j=0;j<2;j++){
 rows.push('',`${labels[j]}: ${reports[j].runs.length} trials; load1m ${review[j].loadRange.map(n=>n.toFixed(2)).join('–')}; peak draws ${review[j].peakDraws}; ${review[j].misses.length} timing/scale/draw/program trial misses.`);
 for(const m of review[j].misses)rows.push(`- ${m.run}: ${m.reasons.join(', ')}; p95 ${rounded(m.frame.p95)}ms; median scale ${m.scale.p50}; load ${m.load.toFixed(2)}.`);
}
await writeFile(resolve(out,'performance.json'),JSON.stringify({labels,rawLabels,finalAccepted,selection:'joint acceptance first, then lowest rounded ordinary frame p95, highest median scale, lowest CPU p95; paired metrics from same trial',review},null,2));
await writeFile(resolve(out,'performance.md'),rows.join('\n')+'\n');
const width=1150,rowHeight=38,height=75+keys.length*rowHeight;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const bars=keys.map((key,i)=>{
 const y=48+i*rowHeight,a=review[0].cases[i],b=review[1].cases[i];
 return `<text x="8" y="${y+15}" fill="#c7d5df" font-size="12">${esc(key)}</text><rect x="350" y="${y}" width="${a.frame.p95*20}" height="12" fill="#7b91a0"/><rect x="350" y="${y+14}" width="${b.frame.p95*20}" height="12" fill="#76d8ee"/><text x="${355+a.frame.p95*20}" y="${y+10}" fill="#c7d5df" font-size="11">${rounded(a.frame.p95)}</text><text x="${355+b.frame.p95*20}" y="${y+24}" fill="#76d8ee" font-size="11">${rounded(b.frame.p95)}</text><text x="920" y="${y+17}" fill="${b.acceptedTrials?'#76d8ee':'#ef9878'}" font-size="12">scale ${a.scale.p50.toFixed(3)} → ${b.scale.p50.toFixed(3)}</text>`;
}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Best-of-N ordinary frame p95 before and after, milliseconds"><rect width="100%" height="100%" fill="#101820"/><text x="8" y="22" fill="#e2eff6" font-size="17">V8 ordinary frame p95 · gray before /cyan after · dashed20ms High target</text><path d="M750 36V${height-12}" stroke="#ef9878" stroke-dasharray="4 5"/>${bars}</svg>`;
await writeFile(resolve(out,'performance.svg'),svg);
const highRows=keys.flatMap((key,i)=>{
 if(!key.endsWith('/high'))return[];
 const a=review[0].cases[i],b=review[1].cases[i];
 return [`<div class="row"><span>${esc(key.replace('/high','').replace('/',' / '))}</span><div class="plot"><i class="limit"></i><i class="before" style="width:${a.frame.p95/30*100}%"></i><i class="after" style="width:${b.frame.p95/30*100}%"></i></div><span>${rounded(a.frame.p95)} → ${rounded(b.frame.p95)} ms<br><small>scale ${a.scale.p50.toFixed(3)} → ${b.scale.p50.toFixed(3)}</small></span></div>`];
}).join('');
await writeFile(resolve(out,'performance.html'),`<!doctype html><html><head><meta charset="utf-8"><title>V8 measured benchmark</title><style>body{margin:0;font-family:var(--font-sans,system-ui);color:var(--foreground);font-size:12px}.chart{background:var(--card);padding:16px;border-radius:var(--radius)}p{line-height:1.5;margin:10px 0}.row{display:grid;grid-template-columns:180px 1fr 140px;gap:10px;align-items:center;min-height:42px}.plot{position:relative;height:26px}.plot i{display:block;height:10px;margin:2px 0}.before{background:var(--chart-2,#7b91a0)}.after{background:var(--chart-1,#76d8ee)}.plot .limit{position:absolute;left:66.667%;top:0;height:26px;width:0;border-left:1px dashed var(--warning,#ef9878)}small{color:var(--muted-foreground)}.legend{display:flex;gap:18px;align-items:center}.key{display:inline-block;width:12px;height:8px;margin-right:5px}</style></head><body><div class="chart"><div class="legend"><strong>High frame p95</strong><span><i class="key before"></i>Before</span><span><i class="key after"></i>Final</span><small>Dashed:20ms target</small></div>${highRows}</div><p>Jointly passing trial if available; otherwise lowest-p95 miss. Same-trial scale is shown; Repeat counts and every raw trial are retained in performance.json. All raw misses retained: ${review[0].misses.length} before / ${review[1].misses.length} final. Peak draws across every trial: ${review[0].peakDraws} → ${review[1].peakDraws} (cap330).</p><p>Shared-host load1m: ${review[0].loadRange.map(n=>n.toFixed(2)).join('–')} before / ${review[1].loadRange.map(n=>n.toFixed(2)).join('–')} final. These observations do not establish an all-load or causal performance improvement.</p></body></html>`);
console.log(rows.slice(-5).join('\n'));
console.log(`V8 final best-of-N acceptance: ${finalAccepted?'PASS':'FAIL'}; ${review[1].cases.filter(c=>c.acceptedTrials>0).length}/${keys.length} cases have a jointly passing trial; all-repeat peak draws ${review[1].peakDraws}/330. Raw misses retained.`);
if(!finalAccepted)process.exitCode=1;
