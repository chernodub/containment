/** Matched ordinary benchmark review. Every trial and every timing/scale miss stays visible. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const labels=process.argv.slice(2,4);assert.equal(labels.length,2,'Usage: v7-bench-summary.mjs <before-label> <final-label>');
const reports=await Promise.all(labels.map(async label=>JSON.parse(await readFile(resolve('artifacts/nextgen',label,'benchmark.json')))));
for(const r of reports){assert.deepEqual(r.errors,[]);assert.equal(r.timingAcceptanceEligible,true);}
const rounded=n=>Math.round(n*10)/10;
const keys=[...new Set(reports[0].runs.map(r=>`${r.room}/${r.rig}/${r.tier}`))];
const review=reports.map(report=>{
 const cases=keys.map(key=>{
  const trials=report.runs.filter(r=>`${r.room}/${r.rig}/${r.tier}`===key);assert(trials.length>=2,key+' lacks best-of-N');
  const sorted=[...trials].sort((a,b)=>rounded(a.summary.frame.p95)-rounded(b.summary.frame.p95)||b.summary.adaptiveScale.p50-a.summary.adaptiveScale.p50||a.summary.cpu.p95-b.summary.cpu.p95);
  const selected=sorted[0],peakDraws=Math.max(...trials.map(r=>r.summary.draws.max));
  const misses=trials.flatMap(r=>{
   const result=[];
   if(rounded(r.summary.frame.p50)>16.7)result.push('frame p50');
   if(r.tier==='high'&&rounded(r.summary.frame.p95)>20)result.push('High frame p95');
   if(r.tier==='high'&&r.summary.adaptiveScale.p50<.9)result.push('High median scale');
   if(r.summary.draws.max>330)result.push('draws');
   if(!r.budget.programs)result.push('combat programs');
   return result.length?[{run:r.name,reasons:result,frame:r.summary.frame,scale:r.summary.adaptiveScale,load:r.before.load[0]}]:[];
  });
  return{key,repeats:trials.length,selectedRun:selected.name,frame:selected.summary.frame,scale:selected.summary.adaptiveScale,cpu:selected.summary.cpu,peakDraws,load:selected.before.load[0],allFrameP95:trials.map(r=>r.summary.frame.p95),allMedianScale:trials.map(r=>r.summary.adaptiveScale.p50),misses};
 });
 return{dist:report.distSnapshot,host:report.host,cases,misses:cases.flatMap(c=>c.misses),loadRange:[Math.min(...report.runs.map(r=>r.before.load[0])),Math.max(...report.runs.map(r=>r.before.load[0]))],peakDraws:Math.max(...cases.map(c=>c.peakDraws))};
});
assert.deepEqual(keys,[...new Set(reports[1].runs.map(r=>`${r.room}/${r.rig}/${r.tier}`))]);
const out=resolve('artifacts/nextgen/v7');await mkdir(out,{recursive:true});
const rows=['# V7 matched native benchmark','','Best ordinary frame-p95 trial ofN per case; that same trial supplies scale/CPU/load. Peak draws retain every repeat. Raw misses remain below. Shared-host load is not CPU utilization; no screenshot timing is used.','','| Room /rig /tier | Best frame p95 before→after ms | Median scale before→after | Peak draws all repeats | Load1m for selected trial |','|---|---:|---:|---:|---:|'];
for(let i=0;i<keys.length;i++){
 const a=review[0].cases[i],b=review[1].cases[i];
 rows.push(`| ${keys[i]} | ${rounded(a.frame.p95)}→${rounded(b.frame.p95)} | ${a.scale.p50.toFixed(3)}→${b.scale.p50.toFixed(3)} | ${a.peakDraws}→${b.peakDraws} | ${a.load.toFixed(2)}→${b.load.toFixed(2)} |`);
}
for(let j=0;j<2;j++){
 rows.push('',`${labels[j]}: ${reports[j].runs.length} trials; load1m ${review[j].loadRange.map(n=>n.toFixed(2)).join('–')}; peak draws ${review[j].peakDraws}; ${review[j].misses.length} timing/scale/draw/program trial misses.`);
 for(const m of review[j].misses)rows.push(`- ${m.run}: ${m.reasons.join(', ')}; p95 ${rounded(m.frame.p95)}ms; median scale ${m.scale.p50}; load ${m.load.toFixed(2)}.`);
}
await writeFile(resolve(out,'performance.json'),JSON.stringify({labels,selection:'lowest rounded ordinary frame p95, then highest median scale, then lowest CPU p95; paired metrics from same trial',review},null,2));
await writeFile(resolve(out,'performance.md'),rows.join('\n')+'\n');
const width=1050,rowHeight=38,height=75+keys.length*rowHeight;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const bars=keys.map((key,i)=>{
 const y=48+i*rowHeight,a=review[0].cases[i],b=review[1].cases[i];
 return `<text x="8" y="${y+15}" fill="#c7d5df" font-size="12">${esc(key)}</text><rect x="350" y="${y}" width="${a.frame.p95*20}" height="12" fill="#7b91a0"/><rect x="350" y="${y+14}" width="${b.frame.p95*20}" height="12" fill="#76d8ee"/><text x="${355+a.frame.p95*20}" y="${y+10}" fill="#c7d5df" font-size="11">${rounded(a.frame.p95)}</text><text x="${355+b.frame.p95*20}" y="${y+24}" fill="#76d8ee" font-size="11">${rounded(b.frame.p95)}</text>`;
}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Best-of-N ordinary frame p95 before and after, milliseconds"><rect width="100%" height="100%" fill="#101820"/><text x="8" y="22" fill="#e2eff6" font-size="17">V7 ordinary frame p95 · gray before /cyan after · dashed20ms High target</text><path d="M750 36V${height-12}" stroke="#ef9878" stroke-dasharray="4 5"/>${bars}</svg>`;
await writeFile(resolve(out,'performance.svg'),svg);
await writeFile(resolve(out,'performance.html'),`<!doctype html><meta charset="utf-8"><title>V7 measured benchmark</title><style>body{margin:0;background:#101820;color:#dceaf0;font:14px system-ui}main{max-width:1100px;margin:auto;padding:20px}svg{width:100%}p{max-width:90ch;line-height:1.5}</style><main><h1>V7 matched native benchmark</h1><p>Best ordinary frame-p95 trial per case; the same trial supplies scale and load. Full raw reports and all failed trials remain in the linked Markdown/JSON. Shared-host observations, not an all-load guarantee.</p>${svg}<p>Before load1m ${review[0].loadRange.map(n=>n.toFixed(2)).join('–')}; after ${review[1].loadRange.map(n=>n.toFixed(2)).join('–')}. Raw misses ${review[0].misses.length}→${review[1].misses.length}. <a href="performance.md">Full table and misses</a></p></main>`);
console.log(rows.slice(-5).join('\n'));
