#!/usr/bin/env node
/** Summarize matched I4 trials without discarding raw samples or contention. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const [beforeLabel='integration-4-before-final',afterLabel='integration-4-after']=process.argv.slice(2);
const root=resolve('artifacts/nextgen'),out=resolve(root,'integration-4');await mkdir(out,{recursive:true});
const before=JSON.parse(await readFile(resolve(root,beforeLabel,'benchmark.json'))),after=JSON.parse(await readFile(resolve(root,afterLabel,'benchmark.json')));
// The first interval straddles setup; recompute frame stats consistently for older manifests too.
for(const report of [before,after])for(const run of report.runs){const values=run.samples.frame.slice(1).sort((a,b)=>a-b);run.summary.frame={p50:values[Math.floor((values.length-1)*.5)],p95:values[Math.ceil(values.length*.95)-1],max:values.at(-1),average:values.reduce((a,b)=>a+b,0)/values.length};}
const key=r=>`${r.room} / ${r.rig} / ${r.tier}`;
const best=report=>{const map=new Map();for(const run of report.runs){const k=key(run);if(!map.has(k)||run.summary.cpu.p95<map.get(k).summary.cpu.p95)map.set(k,run);}return map;};
const a=best(before),b=best(after);assert.deepEqual([...a.keys()],[...b.keys()],'Scenario matrices differ');
const rows=[...a].map(([scenario,before])=>({scenario,before,after:b.get(scenario)}));
const n=v=>v==null?'—':v.toFixed(2), pair=(r,name,field='p95')=>`${n(r.before.summary[name]?.[field])} → ${n(r.after.summary[name]?.[field])}`;
const table=['| Room / rig / tier | Load before → after | Frame p50 / p95 ms before → after | CPU p50 / p95 ms before → after | Draw peak before → after | GPU p95 ms before → after |','|---|---:|---:|---:|---:|---:|',...rows.map(r=>`| ${r.scenario} | ${n(r.before.before.load[0])} → ${n(r.after.before.load[0])} | ${pair(r,'frame','p50')} / ${pair(r,'frame')} | ${pair(r,'cpu','p50')} / ${pair(r,'cpu')} | ${r.before.summary.draws.max} → ${r.after.summary.draws.max} | ${pair(r,'gpu')} |`)];
const note='Best CPU-P95 trial of three per scenario, selected explicitly; every trial remains in the source JSON. Shared-machine load differs between runs. These are observations, not an isolated causal estimate or quiet-host certification.';
await writeFile(resolve(out,'performance.md'),note+'\n\n'+table.join('\n')+'\n');
await writeFile(resolve(out,'performance.json'),JSON.stringify({before:beforeLabel,after:afterLabel,note,rows},null,2));
const chartRows=rows.filter(r=>r.after.tier==='high'),height=chartRows.length*56+75,width=1000,left=305,scale=620/Math.max(16,...chartRows.flatMap(r=>[r.before.summary.cpu.p95,r.after.summary.cpu.p95]));
const svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Observed High CPU p95 before and after"><style>text{fill:#dcebf3;font:12px system-ui}</style><rect width="100%" height="100%" fill="#0b1821"/><text x="20" y="25" style="font-size:18px">High update + render JS, p95 milliseconds</text><line x1="${left+8*scale}" x2="${left+8*scale}" y1="42" y2="${height-28}" stroke="#ffb454" stroke-dasharray="4 4"/><text x="${left+8*scale+3}" y="40">8 ms target</text>${chartRows.map((r,i)=>{const y=58+i*56;return `<text x="12" y="${y+16}">${r.scenario}</text><rect x="${left}" y="${y}" width="${r.before.summary.cpu.p95*scale}" height="17" fill="#667d8d"/><text x="${left+r.before.summary.cpu.p95*scale+5}" y="${y+13}">${n(r.before.summary.cpu.p95)}</text><rect x="${left}" y="${y+21}" width="${r.after.summary.cpu.p95*scale}" height="17" fill="#8edcef"/><text x="${left+r.after.summary.cpu.p95*scale+5}" y="${y+34}">${n(r.after.summary.cpu.p95)}</text>`;}).join('')}<text x="20" y="${height-10}">Gray: before. Cyan: after. Contested host; best of 3. See per-trial loads and full samples in JSON.</text></svg>`;
await writeFile(resolve(out,'performance.svg'),svg);
await writeFile(resolve(out,'performance.html'),`<!doctype html><meta charset="utf-8"><title>I4 observed performance</title><style>body{margin:20px;background:#081014;color:#dcebf3;font:14px system-ui}svg{width:100%;max-width:1100px}p{max-width:1000px}table{border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #345;text-align:left}</style>${svg}<p>${note}</p><table><tr><th>Scenario</th><th>Load before → after</th><th>CPU p95</th><th>Frame p95</th><th>Draw peak</th></tr>${rows.map(r=>`<tr><td>${r.scenario}</td><td>${n(r.before.before.load[0])} → ${n(r.after.before.load[0])}</td><td>${pair(r,'cpu')}</td><td>${pair(r,'frame')}</td><td>${r.before.summary.draws.max} → ${r.after.summary.draws.max}</td></tr>`).join('')}</table>`);
console.log(table.join('\n'));
