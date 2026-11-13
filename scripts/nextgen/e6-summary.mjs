/** File-only E6 evidence and budget summary. Does not launch a browser or modify native PNGs. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('artifacts/nextgen'),out=resolve(root,'e6-report');await mkdir(out,{recursive:true});
const json=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const rooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
const capture=await json('e6-final/manifest.json'),beforeCapture=await json('e6-before-all/manifest.json'),luma=await json('e6-final/deck-luminance.json');
assert.deepEqual(capture.errors,[]);assert.deepEqual(capture.failures,[]);assert.deepEqual(beforeCapture.errors,[]);assert.deepEqual(beforeCapture.failures,[]);
const sha=b=>createHash('sha256').update(b).digest('hex'),frames=[];
for(const room of rooms){
 const calm=capture.shots.find(s=>s.room===room&&s.scenario==='combat-calm'),kite=capture.shots.filter(s=>s.room===room&&s.scenario==='combat-kiting');assert(calm&&kite.length===4,room+' full calm/kiting coverage');
 for(const s of [calm,...kite]){assert(s.evidence.e6KitProof,room+' kit readiness');assert(s.evidence.e6KitProof.triangles<32000,room+' triangle cap');assert(s.evidence.e6KitProof.marineSightlineSamples>50);const file=resolve(root,'e6-final',s.file),bytes=await readFile(file);frames.push({file,sha256:sha(bytes),room,scenario:s.scenario,frame:s.frame??null,kitTriangles:s.evidence.e6KitProof.triangles,marineSamples:s.evidence.e6KitProof.marineSightlineSamples});}
}
assert(capture.shots.filter(s=>s.scenario==='boss').length===4);assert(capture.shots.filter(s=>s.scenario==='g2-queen-exposed').length===4);
await writeFile(resolve(out,'frame-ledger.json'),JSON.stringify(frames,null,2)+'\n');
const kitRows=rooms.map(room=>{
 const proof=capture.shots.find(s=>s.room===room&&s.scenario==='combat-calm').evidence.e6KitProof;
 const models=proof.placements.filter(p=>p.model!=='connection');assert(models.length>0,room+' has accepted author geometry');
 if(room==='residential-gallery')assert(proof.majorCabinForms>=4,'restored cabin furniture');
 assert(proof.floorSurface.views.every(v=>v.features.length>=3),room+' three functional floor features per sampled view');
 assert(proof.perimeter.edges.every(e=>e.attempted===0||e.accepted>0),room+' every dressed hull edge');assert(proof.perimeter.overheadAccepted>0);
 return{room,triangles:proof.triangles,models:models.length,marineSightlineSamples:proof.marineSightlineSamples,majorCabinForms:proof.majorCabinForms,narrativeVignette:proof.narrativeVignette,floor:proof.floorSurface,perimeter:proof.perimeter,footprintClusters:proof.footprintClusters,rejected:proof.rejected};
});
await writeFile(resolve(out,'kit-room-summary.json'),JSON.stringify(kitRows,null,2)+'\n');
const lumRows=rooms.map(room=>{const calm=luma.shots.find(s=>s.room===room&&s.scenario==='combat-calm'),all=luma.shots.filter(s=>s.room===room&&s.scenario==='combat-kiting'),kite=all.find(s=>s.frame===2);assert(calm?.deck&&calm.hero&&kite?.deck&&kite.hero);return{room,calm:calm.deck,heroCalm:calm.hero.median,kiting:kite.deck,heroKiting:kite.hero.median,kitingMedianRange:[Math.min(...all.map(s=>s.deck.median)),Math.max(...all.map(s=>s.deck.median))]};});
await writeFile(resolve(out,'luminance.json'),JSON.stringify({method:luma.method,rows:lumRows},null,2)+'\n');
const tuple=x=>[x.p5,x.median,x.p95].join(' / ');
const lum=['| Room | Calm p5 / median / p95 | Kiting02 p5 / median / p95 | Hero calm / kite | All4 kite median |','|---|---:|---:|---:|---:|',...lumRows.map(r=>`| ${r.room} | ${tuple(r.calm)} | ${tuple(r.kiting)} | ${r.heroCalm} / ${r.heroKiting} | ${r.kitingMedianRange.join('–')} |`)];
await writeFile(resolve(out,'luminance.md'),luma.method+'\n\n'+lum.join('\n')+'\n');
const links=['| Room | Before calm | After calm | Before kiting02 | After kiting02 |','|---|---|---|---|---|',...rooms.map(room=>`| ${room} | [PNG](${resolve(root,'e6-before-all',`combat-calm-${room}.png`)}) | [PNG](${resolve(root,'e6-final',`combat-calm-${room}.png`)}) | [PNG](${resolve(root,'e6-before-all',`combat-kiting-${room}-02.png`)}) | [PNG](${resolve(root,'e6-final',`combat-kiting-${room}-02.png`)}) |`)];await writeFile(resolve(out,'all-room-paths.md'),links.join('\n')+'\n');
const benchmarks=await Promise.all(['e6-before-bench/benchmark.json','e6-after-bench/benchmark.json'].map(json));
const roomAudits=await Promise.all(['e6-before-rooms/rooms.json','e6-after-rooms/rooms.json'].map(json));
const quant=(values,p)=>{values=[...values].sort((a,b)=>a-b);return values[Math.floor((values.length-1)*p)];};
const range=a=>[Math.min(...a),Math.max(...a)];
const summary=(b,a)=>({trials:b.runs.length,errors:b.errors,budgetFailures:b.budgetFailures,drawPeak:Math.max(...b.runs.map(r=>r.summary.draws.max)),combatCompiles:Math.max(...b.runs.map(r=>r.programs)),programPeak:Math.max(...b.runs.map(r=>typeof r.programInventory==='number'?r.programInventory:r.programInventory?.length??0)),highFrameP50:range(b.runs.filter(r=>r.tier==='high').map(r=>r.summary.frame.p50)),highFrameP95:range(b.runs.filter(r=>r.tier==='high').map(r=>r.summary.frame.p95)),highCpuP95:range(b.runs.filter(r=>r.tier==='high').map(r=>r.summary.cpu.p95)),highMedianScale:range(b.runs.filter(r=>r.tier==='high').map(r=>r.summary.adaptiveScale.p50)),load1m:range(b.runs.flatMap(r=>[r.before.load[0],r.after.load[0]])),roomEntries:a.rows.length,roomMedian:quant(a.rows.map(r=>r.total),.5),roomP95:quant(a.rows.map(r=>r.total),.95),roomMax:Math.max(...a.rows.map(r=>r.total)),allPreparationMedian:quant(a.rows.flatMap(r=>r.preparation.map(p=>p.total)),.5),allPreparationMax:Math.max(...a.rows.flatMap(r=>r.preparation.map(p=>p.total))),postReadyCompiles:Math.max(...a.rows.map(r=>r.postReadyCompiles??0)),roomCombatCompiles:Math.max(...a.rows.map(r=>r.combatCompiles??0)),roomLoad1m:range(a.rows.flatMap(r=>[r.before.load[0],r.after.load[0]])),roomErrors:a.errors,roomFailures:a.failures});
const budget={before:summary(benchmarks[0],roomAudits[0]),after:summary(benchmarks[1],roomAudits[1])};
const scan=await json('e6-after-scan/benchmark.json');
assert.deepEqual(scan.errors,[]);assert.deepEqual(scan.budgetFailures,[]);assert.equal(scan.scan.length,20);
assert(new Set(scan.scan.map(row=>row.room)).size===20);
assert(scan.scan.every(row=>row.calls<=330&&row.programs===0));
budget.after.allRoomDrawPeak=Math.max(...scan.scan.map(row=>row.calls));
budget.after.allRoomScanLoad1m=range(scan.scan.map(row=>row.host.load[0]));
const authored=JSON.parse(await readFile('artifacts/authored-smoke/desktop/manifest.json','utf8'));
assert.equal(authored.results.length,20);assert(new Set(authored.results.map(row=>row.id)).size===20);
assert(authored.results.every(row=>row.errors.length===0&&row.state==='playing'));
for(const [label,b] of Object.entries(budget)){assert.deepEqual(b.errors,[]);assert.deepEqual(b.budgetFailures,[]);assert.deepEqual(b.roomErrors,[]);assert.deepEqual(b.roomFailures,[]);assert(b.drawPeak<=330,label+' draws');assert.equal(b.combatCompiles,0);assert.equal(b.postReadyCompiles,0);assert.equal(b.roomCombatCompiles,0);assert(b.roomMax<=3000);assert(b.roomMedian<=1500);assert(b.allPreparationMax<=3000);assert(b.allPreparationMedian<=1500);}
await writeFile(resolve(out,'budget-comparison.json'),JSON.stringify(budget,null,2)+'\n');
const n=x=>Number(x.toFixed(1)),fmt=x=>Array.isArray(x)?x.map(n).join('–'):n(x);
const metrics=[['Sustained trials','trials'],['Peak draws','drawPeak'],['Combat compiles','combatCompiles'],['High frame p50 ms','highFrameP50'],['High frame p95 ms','highFrameP95'],['High CPU+HUD p95 ms','highCpuP95'],['High median scale','highMedianScale'],['Sustained host load1m','load1m'],['Room entries','roomEntries'],['Room median ms','roomMedian'],['Room p95 ms','roomP95'],['Room max ms','roomMax'],['All preparation median ms','allPreparationMedian'],['All preparation max ms','allPreparationMax'],['Room-audit host load1m','roomLoad1m']];
await writeFile(resolve(out,'budget-comparison.md'),['| Metric | Before | After |','|---|---:|---:|',...metrics.map(([label,key])=>`| ${label} | ${key==='highMedianScale'?budget.before[key].map(v=>v.toFixed(3)).join('–'):fmt(budget.before[key])} | ${key==='highMedianScale'?budget.after[key].map(v=>v.toFixed(3)).join('–'):fmt(budget.after[key])} |`)].join('\n')+'\n');
const assetRows=[];let shippedBytes=0;
for(const p of await readdir('public/assets/kits')){const folder='public/assets/kits/'+p,m=JSON.parse(await readFile(folder+'/manifest.json'));let bytes=0;for(const f of await readdir(folder))bytes+=(await stat(folder+'/'+f)).size;shippedBytes+=bytes;assetRows.push({pack:p,author:m.author,license:m.license,source:m.sourceURL,models:m.models.length,glbBytes:m.output.bytes,allShippedBytes:bytes,archiveSHA256:m.archiveSHA256,glbSHA256:m.output.sha256});}
assert(shippedBytes<=12_000_000);await writeFile(resolve(out,'asset-summary.json'),JSON.stringify({shippedBytes,packs:assetRows},null,2)+'\n');
const chart=`<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:var(--font-sans);color:var(--foreground);font-size:14px}h3{font-size:16px;margin:20px 0 8px}p{color:var(--muted-foreground);line-height:1.5}svg{display:block;width:100%;height:132px}.before{fill:var(--chart-2)}.after{fill:var(--chart-1)}text{fill:var(--foreground);font:13px var(--font-sans)}.limit{stroke:var(--muted-foreground);stroke-dasharray:4 4}
</style></head><body><h3>E6 measured resource budgets</h3><p>Matched sustained cases: Relay Racks and Infested Workshop, four rigs, High/Low, 20 seconds, one repeat. Fresh/sequential preparation: 42 entries each.</p>
${[['Peak sustained draws','drawPeak',330,'draws'],['Worst room readiness','roomMax',3000,'ms']].map(([label,key,limit,unit])=>{const x=v=>145+v/limit*430;return `<h3>${label}</h3><svg viewBox="0 0 700 132" role="img" aria-label="${label}: before ${n(budget.before[key])}, after ${n(budget.after[key])}; limit ${limit} ${unit}"><text x="0" y="34">Before</text><rect class="before" x="145" y="16" height="26" width="${x(budget.before[key])-145}"/><text x="${x(budget.before[key])+8}" y="34">${n(budget.before[key])}</text><text x="0" y="78">After</text><rect class="after" x="145" y="60" height="26" width="${x(budget.after[key])-145}"/><text x="${x(budget.after[key])+8}" y="78">${n(budget.after[key])}</text><line class="limit" x1="575" x2="575" y1="8" y2="96"/><text x="435" y="120">Limit ${limit} ${unit}</text></svg>`;}).join('')}
<p>Zero measured combat shader compiles in both cohorts. Host load1m: before ${fmt(budget.before.load1m)}, after ${fmt(budget.after.load1m)} on 10 logical cores. Shared-host timings do not certify an uncontended 60 fps result.</p></body></html>`;
await writeFile(resolve(out,'budget-chart.html'),chart);
console.log(JSON.stringify({frames:frames.length,bossFrames:8,roomRows:lumRows.length,shippedBytes,budget},null,2));
