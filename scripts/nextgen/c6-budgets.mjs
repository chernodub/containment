#!/usr/bin/env node
/** Compare ordinary sustained trials without dropping the contended attempts. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {canvas,drawText,encode} from './g2-png.mjs';
const base=resolve('artifacts/nextgen'),out=resolve(base,'c6-budget-review');await mkdir(out,{recursive:true});
const before=JSON.parse(await readFile(resolve(base,'c6-bench-before/benchmark.json'))),after=JSON.parse(await readFile(resolve(base,'c6-bench-final/benchmark.json')));
const key=r=>`${r.room}/${r.rig}/${r.tier}`,keys=[...new Set(before.runs.map(key))];
const trial=r=>({name:r.name,frame:r.summary.frame,draws:r.summary.draws.max,compiles:r.programs,programInventory:r.programInventory,loadBefore:r.before.load[0],loadAfter:r.after.load[0],adaptiveScale:r.summary.adaptiveScale});
const rows=keys.map(k=>{
 const a=before.runs.filter(r=>key(r)===k),b=after.runs.filter(r=>key(r)===k);
 const best=rows=>[...rows].sort((a,b)=>a.summary.frame.p95-b.summary.frame.p95||a.summary.frame.p50-b.summary.frame.p50)[0];
 return {case:k,before:a.map(trial),after:b.map(trial),selectedBefore:trial(best(a)),selectedAfter:trial(best(b))};
});
const report={selection:'Lowest frame p95 of three ordinary20-second trials; paired p50/load/scale from the same trial. All trials retained. Different host loads preclude a causal timing speedup claim.',beforeSource:before.distSnapshot,afterSource:after.distSnapshot,rows,errors:{before:before.errors,after:after.errors},resourceFailures:{before:before.budgetFailures,after:after.budgetFailures}};
await writeFile(resolve(out,'comparison.json'),JSON.stringify(report,null,2));
let md='| Case | Before best p50/p95 ms | After best p50/p95 ms | Draw peaks before/after | Selected host load before/after |\n|---|---:|---:|---:|---:|\n';
for(const r of rows)md+=`| ${r.case} | ${r.selectedBefore.frame.p50.toFixed(1)}/${r.selectedBefore.frame.p95.toFixed(1)} | ${r.selectedAfter.frame.p50.toFixed(1)}/${r.selectedAfter.frame.p95.toFixed(1)} | ${Math.max(...r.before.map(t=>t.draws))}/${Math.max(...r.after.map(t=>t.draws))} | ${r.selectedBefore.loadBefore.toFixed(1)}/${r.selectedAfter.loadBefore.toFixed(1)} |\n`;
await writeFile(resolve(out,'comparison.md'),md+'\n'+report.selection+'\n');
const chart=canvas(1200,740),rect=(x,y,w,h,color)=>{for(let py=Math.max(0,y);py<Math.min(chart.height,y+h);py++)for(let px=Math.max(0,x);px<Math.min(chart.width,x+w);px++){const i=(py*chart.width+px)*3;for(let c=0;c<3;c++)chart.pixels[i+c]=color[c];}};
drawText(chart,'C6 ORDINARY SUSTAINED TRIALS - ALL RAW TRIALS RETAINED',30,24,undefined,2);
drawText(chart,'BLUE BEFORE / AMBER AFTER - TIMINGS HAVE DIFFERENT HOST LOADS',30,56,undefined,1);
drawText(chart,'PEAK DRAWS - LIMIT330',30,100,undefined,2);
drawText(chart,'BEST OF3 FRAME P95 MS - TARGET20',630,100,undefined,2);
for(let n=0;n<rows.length;n++){
 const r=rows[n],y=155+n*125,label=r.case.replace('/high','');drawText(chart,label,30,y,undefined,1);drawText(chart,label,630,y,undefined,1);
 const a=Math.max(...r.before.map(t=>t.draws)),b=Math.max(...r.after.map(t=>t.draws));
 rect(30,y+20,Math.round(a*1.4),18,[76,157,211]);rect(30,y+44,Math.round(b*1.4),18,[229,160,71]);
 drawText(chart,String(a),35+Math.round(a*1.4),y+24,undefined,1);drawText(chart,String(b),35+Math.round(b*1.4),y+48,undefined,1);rect(30+462,y+15,2,55,[232,92,78]);
 for(const [j,t]of [r.selectedBefore,r.selectedAfter].entries()){const v=t.frame.p95;rect(630,y+20+j*24,Math.round(v*8),18,j?[229,160,71]:[76,157,211]);drawText(chart,v.toFixed(1),635+Math.round(v*8),y+24+j*24,undefined,1);}rect(790,y+15,2,55,[232,92,78]);
}
drawText(chart,'ZERO MID-COMBAT COMPILES IS REQUIRED IN EVERY TRIAL - SEE COMPARISON.JSON',30,690,undefined,1);
await writeFile(resolve(out,'comparison.png'),encode(chart));console.log(md);
