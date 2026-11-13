#!/usr/bin/env node
/** File-only I9 performance, native campaign and unchanged organic-evidence receipts. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {resolve,basename,sep} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';

const args=process.argv.slice(2);
if(args.includes('--help')){
  console.log('node scripts/nextgen/i9-summary.mjs [--performance-only|--campaigns-only] [--base=artifacts/nextgen] [--cohort=<safe-label>]');
  process.exit(0);
}
for(const arg of args)assert(/^--(?:performance-only|campaigns-only|base=.+|cohort=[\w.-]+)$/.test(arg),`Unknown flag ${arg}`);
assert(!(args.includes('--performance-only')&&args.includes('--campaigns-only')),'Choose at most one partial mode');
const base=resolve(args.find(a=>a.startsWith('--base='))?.slice(7)??'artifacts/nextgen');
const out=resolve(base,'i9');await mkdir(out,{recursive:true});
const cohort=args.find(a=>a.startsWith('--cohort='))?.slice(9)??'';
const benchmarkPrefix=cohort?`i9-${cohort}`:'i9';
const campaignPrefix=cohort?`i9-${cohort}`:'i9-final';
const missing=[];
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const round1=value=>finite(value)?Math.round(value*10)/10:null;
const round2=value=>finite(value)?Math.round(value*100)/100:null;
const quantiles=values=>{
  const sorted=values.filter(finite).sort((a,b)=>a-b);
  if(!sorted.length)return null;
  return{n:sorted.length,min:sorted[0],p50:sorted[Math.floor((sorted.length-1)*.5)],p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted.at(-1)};
};
const range=values=>{const q=quantiles(values);return q?[q.min,q.max]:null;};
const fmt=value=>finite(value)?String(round1(value)):'missing';
const rangeText=values=>{const r=range(values);return r?`${fmt(r[0])}–${fmt(r[1])}`:'missing';};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=file=>file.split(sep).map(encodeURIComponent).join('/');
async function json(path,required=true){
  try{const bytes=await readFile(path);return{path,value:JSON.parse(bytes),sha256:sha256(bytes)};}
  catch(error){if(error.code!=='ENOENT')throw error;if(required)missing.push(path);return null;}
}
const writeJson=(name,value)=>writeFile(resolve(out,name),JSON.stringify(value,null,2)+'\n');
const hostLoads=rows=>rows.flatMap(row=>[row.before?.load?.[0],row.after?.load?.[0]]).filter(finite);
function fill(image,x,y,width,height,color){
  for(let py=Math.max(0,y);py<Math.min(image.height,y+height);py++)for(let px=Math.max(0,x);px<Math.min(image.width,x+width);px++){
    const p=(py*image.width+px)*3;for(let c=0;c<3;c++)image.pixels[p+c]=color[c];
  }
}

async function performance(){
  const bench=await json(resolve(base,`${benchmarkPrefix}-bench-five/benchmark.json`));
  const roomReports=[];
  for(let repeat=1;repeat<=5;repeat++){
    const source=await json(resolve(base,`${benchmarkPrefix}-rooms-five-${repeat}/rooms.json`));
    if(source)roomReports.push({repeat,...source});
  }
  const grouped=new Map(),trials=[];
  for(const run of bench?.value.runs??[]){
    const summary=run.summary??{},precision={frameP50:round1(summary.frame?.p50),frameP95:round1(summary.frame?.p95)};
    const timingEligible=run.timingAcceptanceEligible!==false&&!run.profile&&!bench.value.auditCosts&&!bench.value.gpuFlush;
    const targets={
      timingEligible,
      frameP50:precision.frameP50!==null&&precision.frameP50<=16.7,
      highFrameP95:run.tier!=='high'||precision.frameP95!==null&&precision.frameP95<=20,
      highMedianScale:run.tier!=='high'||finite(summary.adaptiveScale?.p50)&&summary.adaptiveScale.p50>=.9,
      draws:finite(summary.draws?.max)&&summary.draws.max<=330,
      combatCompiles:run.programs===0,
    };
    const trial={name:run.name,room:run.room,rig:run.rig,tier:run.tier,repeat:run.repeat,
      summary,reportedPrecisionMs:precision,rawHarnessBudgetBooleans:run.budget,targets,pass:Object.values(targets).every(Boolean),
      before:run.before,after:run.after,programs:run.programs,programInventory:run.programInventory,
      wallSeconds:run.wallSeconds,simulationSeconds:run.simulationSeconds,initialEnemies:run.initialEnemies,
      uses:run.uses,timingScope:run.timingScope,timingAcceptanceEligible:run.timingAcceptanceEligible};
    trials.push(trial);const key=`${run.room}/${run.rig}/${run.tier}`;
    if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(trial);
  }
  const cases=[...grouped.entries()].map(([key,runs])=>{
    runs.sort((a,b)=>a.repeat-b.repeat);
    return{key,room:runs[0].room,rig:runs[0].rig,tier:runs[0].tier,repeats:runs.length,
      fiveRepeats:runs.length===5&&new Set(runs.map(r=>r.repeat)).size===5,
      frameP50All:runs.map(r=>r.reportedPrecisionMs.frameP50),frameP95All:runs.map(r=>r.reportedPrecisionMs.frameP95),
      cpuP95Range:range(runs.map(r=>r.summary.cpu?.p95)),medianScaleRange:range(runs.map(r=>r.summary.adaptiveScale?.p50)),
      minimumScale:Math.min(...runs.map(r=>r.summary.adaptiveScale?.min??Infinity)),load1mRange:range(hostLoads(runs)),
      drawsMax:Math.max(...runs.map(r=>r.summary.draws?.max??-Infinity)),combatCompiles:runs.reduce((n,r)=>n+(r.programs??0),0),
      pass:runs.length===5&&new Set(runs.map(r=>r.repeat)).size===5&&runs.every(r=>r.pass),trials:runs};
  });
  const readiness=[],preparations=[],roomSources=[];
  for(const source of roomReports){
    const report=source.value,seen=new Set();
    roomSources.push({repeat:source.repeat,path:source.path,sha256:source.sha256,sourceSHA:report.distSourceSHA,harnessSHA:report.sha,host:report.host,errors:report.errors,failures:report.failures});
    for(let index=0;index<(report.rows??[]).length;index++){
      const row=report.rows[index],entry={repeat:source.repeat,index,room:row.room,mode:row.mode,totalMs:row.total,
        before:row.before,after:row.after,programs:row.programs,combatCompiles:row.combatCompiles,postReadyCompiles:row.postReadyCompiles,
        phases:row.phases,pass:finite(row.total)&&row.total<=3000&&row.combatCompiles===0&&row.postReadyCompiles===0};
      readiness.push(entry);
      for(const p of row.preparation??[]){
        // A fresh row owns a new page. Sequential rows retain the same renderer history.
        // Do not collapse coincident timestamps on distinct fresh pages.
        const context=row.mode==='fresh'?`fresh-page-${index}`:`${row.mode}-retained-page`;
        const key=JSON.stringify([context,p.room,p.started]);
        if(seen.has(key))continue;seen.add(key);
        preparations.push({repeat:source.repeat,context,observedAt:{room:row.room,mode:row.mode,index},...p,
          initialColdOrWarm:p===row.preparation?.[0]&&(row.mode==='fresh'||index===report.rows.findIndex(r=>r.mode===row.mode)),
          pass:finite(p.total)&&p.total<=3000});
      }
    }
  }
  const roomGroups=new Map();
  for(const row of readiness){const key=`${row.room}/${row.mode}`;if(!roomGroups.has(key))roomGroups.set(key,[]);roomGroups.get(key).push(row);}
  const roomCases=[...roomGroups.entries()].map(([key,rows])=>({key,room:rows[0].room,mode:rows[0].mode,
    repeats:rows.length,allMs:rows.sort((a,b)=>a.repeat-b.repeat).map(r=>r.totalMs),summary:quantiles(rows.map(r=>r.totalMs)),load1mRange:range(hostLoads(rows)),pass:rows.length===5&&rows.every(r=>r.pass)}));
  const readinessStats=quantiles(readiness.map(r=>r.totalMs)),preparationStats=quantiles(preparations.map(r=>r.total));
  const results={
    method:'Native benchmark reports retained in full. Requested frame targets compare values rounded to the browser reporting precision of0.1ms; raw summaries and original harness budget booleans remain beside them. High frame p50≤16.7ms,p95≤20ms,median adaptive scale≥.9; Low p50≤16.7ms; all draws≤330 and combat compiles0. Five repeats per case; no best-of-N selection. Host load is1-minute system load, not CPU utilization.',
    benchmarkSource:bench?{path:bench.path,sha256:bench.sha256,source:bench.value.distSnapshot,harnessSHA:bench.value.sha,gpu:bench.value.gpu,seconds:bench.value.seconds,repeats:bench.value.repeats,host:bench.value.host,errors:bench.value.errors,budgetFailures:bench.value.budgetFailures}:null,
    cases,trials,
    roomPreparation:{method:'Public gotoRoom readiness is separate from inclusive preparation receipts. All preparation histories, including initial cold/warm work, are deduplicated per retained renderer within each run; fresh pages remain distinct. Values are milliseconds;≤3000 worst and≤1500 median targets.',
      sources:roomSources,readiness,preparations,cases:roomCases,readinessSummary:readinessStats,allPreparationSummary:preparationStats,
      targets:{fiveReports:roomReports.length===5,fiveRepeatsPerCase:roomCases.length>0&&roomCases.every(c=>c.repeats===5),
        publicWorst:!!readinessStats&&readinessStats.max<=3000,publicTypical:!!readinessStats&&readinessStats.p50<=1500,
        allPreparationWorst:!!preparationStats&&preparationStats.max<=3000,allPreparationTypical:!!preparationStats&&preparationStats.p50<=1500,
        zeroCombatCompiles:readiness.length>0&&readiness.every(r=>r.combatCompiles===0),zeroPostReadyCompiles:readiness.length>0&&readiness.every(r=>r.postReadyCompiles===0)}}};
  results.missingInputs=[...missing];
  results.accepted=missing.length===0&&cases.length>0&&cases.every(c=>c.pass)&&Object.values(results.roomPreparation.targets).every(Boolean)
    &&(bench?.value.errors??[]).length===0&&(bench?.value.budgetFailures??[]).length===0&&roomReports.every(r=>(r.value.errors??[]).length===0&&(r.value.failures??[]).length===0);
  await writeJson('performance.json',results);
  const lines=[
    '# I9 performance acceptance','',results.method,'',`Accepted: **${results.accepted}**. GPU: ${bench?.value.gpu??'missing'}. Missing inputs: ${missing.length}.`,'',
    '| Room / rig / tier | Frame p50 all5 ms | Frame p95 all5 ms | CPU p95 range ms | Median scale range | Minimum scale | Load1m range | Draws peak | Combat compiles | Pass |',
    '|---|---|---|---|---|---:|---|---:|---:|---|',
    ...cases.map(c=>`| ${c.key} | ${c.frameP50All.map(fmt).join(' / ')} | ${c.frameP95All.map(fmt).join(' / ')} | ${c.cpuP95Range?.map(fmt).join('–')??'missing'} | ${c.medianScaleRange?.map(v=>v.toFixed(3)).join('–')??'missing'} | ${c.minimumScale.toFixed(3)} | ${c.load1mRange?.map(fmt).join('–')??'missing'} | ${c.drawsMax} | ${c.combatCompiles} | ${c.pass} |`),
    '', '## Room readiness','',results.roomPreparation.method,'',
    `Public readiness n=${readinessStats?.n??0}: median ${fmt(readinessStats?.p50)}ms, p95 ${fmt(readinessStats?.p95)}ms, max ${fmt(readinessStats?.max)}ms.`,
    `All distinct preparation receipts n=${preparationStats?.n??0}: median ${fmt(preparationStats?.p50)}ms, p95 ${fmt(preparationStats?.p95)}ms, max ${fmt(preparationStats?.max)}ms.`,'',
    '| Room / mode | Repeat1 ms | Repeat2 ms | Repeat3 ms | Repeat4 ms | Repeat5 ms | Load1m range | Pass |','|---|---:|---:|---:|---:|---:|---|---|',
    ...roomCases.map(c=>`| ${c.key} | ${Array.from({length:5},(_,i)=>fmt(readiness.find(r=>r.room===c.room&&r.mode===c.mode&&r.repeat===i+1)?.totalMs)).join(' | ')} | ${c.load1mRange?.map(fmt).join('–')??'missing'} | ${c.pass} |`),
    '', '## Missing inputs','',...(missing.length?missing.map(p=>`- ${p}`):['None.']),'',
    'Original source reports and all failed trials remain unchanged. Campaign/capture CPU timings are excluded from this hardware acceptance table.','',
  ];
  await writeFile(resolve(out,'performance.md'),lines.join('\n'));
  await performanceChart(cases,results);
  console.log(`Performance summary: ${cases.length} cases/${trials.length} trials;${readiness.length} readiness rows/${preparations.length} distinct preparation receipts;accepted=${results.accepted};missing=${missing.length}.`);
}

async function performanceChart(cases,results){
  const image=canvas(1800,Math.max(400,cases.length*50+200)),left=490,right=1620,width=right-left;
  const maximum=Math.max(22,...cases.flatMap(c=>c.frameP95All).filter(finite));
  drawText(image,'I9 NATIVE FULL-KIT FRAME TIMES - ALL TRIALS RETAINED',24,20,undefined,2);
  drawText(image,'P50 CYAN / P95 AMBER / HIGH P95 LIMIT RED / LOAD IS SYSTEM LOAD',24,48,undefined,1);
  for(let ms=0;ms<=maximum;ms+=5){const x=left+Math.round(ms/maximum*width);fill(image,x,85,1,cases.length*50+10,[53,64,75]);drawText(image,`${ms}MS`,x-8,70,undefined,1);}
  const target=left+Math.round(20/maximum*width);fill(image,target,85,2,cases.length*50+10,[191,73,59]);
  cases.forEach((c,index)=>{
    const y=98+index*50;drawText(image,c.key,24,y+8,undefined,1);
    for(let r=0;r<c.frameP50All.length;r++){
      const x=left+Math.round(c.frameP50All[r]/maximum*width);fill(image,x,y+r*5,4,4,[120,224,244]);
      const p=left+Math.round(c.frameP95All[r]/maximum*width);fill(image,p,y+r*5,4,4,[255,181,89]);
    }
    drawText(image,`${c.drawsMax} DRAWS`,1640,y,undefined,1);
    drawText(image,c.pass?'PASS':'FAIL',1640,y+16,c.pass?[132,216,165]:[255,121,92],1);
  });
  drawText(image,`GPU ${String(results.benchmarkSource?.gpu??'MISSING').slice(0,130)}`,24,image.height-64,undefined,1);
  drawText(image,'1920X1080 DPR1 -25 NATIVE ENEMIES -20S -5 REPEATS -NO CAPTURE TIMINGS',24,image.height-42,undefined,1);
  await writeFile(resolve(out,'performance.png'),encode(image));
}

function overlap(a,b){
  if(!a||!b)return 0;
  return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
}
function inside(b,i,v){
  return!!b&&!!i&&!!v&&b.left>=i.left-.5&&b.right<=v.width-i.right+.5&&b.top>=i.top-.5&&b.bottom<=v.height-i.bottom+.5;
}

async function distributionProvenance(report){
  const directory=resolve(report.distributionDirectory??'dist'),assets={};
  let applicationSHA=null;
  try{applicationSHA=(await readFile(resolve(directory,'SOURCE_SHA'),'utf8')).trim();}catch(error){if(error.code!=='ENOENT')throw error;}
  try{for(const file of(await readdir(resolve(directory,'assets'))).filter(f=>/\.(js|css)$/.test(f)).sort())assets[file]=sha256(await readFile(resolve(directory,'assets',file)));}
  catch(error){if(error.code!=='ENOENT')throw error;}
  const startupAssets=report.distributionAssets??null,startupSHA=report.distributionSourceSHA??null;
  const canonical=value=>JSON.stringify(Object.fromEntries(Object.entries(value??{}).sort(([a],[b])=>a.localeCompare(b))));
  const assetsMatchStartup=startupAssets?canonical(startupAssets)===canonical(assets):null;
  const sourceMatchesStartup=startupSHA?startupSHA===applicationSHA:null;
  return{directory,applicationSHA:startupSHA??applicationSHA,appAssets:startupAssets??assets,summaryTime:{applicationSHA,appAssets:assets},startupWitness:!!startupAssets,assetsMatchStartup,sourceMatchesStartup,
    verified:!!startupAssets&&assetsMatchStartup&&(startupSHA===null||sourceMatchesStartup),
    note:startupAssets?'Startup JS/CSS hashes from the original runner report are authoritative and are compared with the report-named frozen distribution at summary time. Harness head remains separate.':'Legacy runner supplied no startup asset witness; source marker and hashes are summary-time observations only.'};
}

async function campaigns(){
  const rigReports=[],organic=resolve(base,'final3/organic'),organicReceipts=[],auditRows=[];
  await mkdir(organic,{recursive:true});
  for(const rig of ['breacher','cryo','pyro','arc']){
    const directory=resolve(base,`playtest/${campaignPrefix}-${rig}-1729`),source=await json(resolve(directory,'report.json'));
    if(!source)continue;
    const report=source.value,provenance=await distributionProvenance(report),tracePath=resolve(directory,'trace.ndjson');
    let trace=[],traceHash=null;
    try{const bytes=await readFile(tracePath);traceHash=sha256(bytes);trace=bytes.toString('utf8').split('\n').filter(Boolean).map((line,index)=>{try{return JSON.parse(line);}catch(error){throw Error(`${tracePath}:${index+1}: ${error.message}`);}});}
    catch(error){if(error.code!=='ENOENT')throw error;missing.push(tracePath);}
    const casts=[],seenCasts=new Set(),counterTransitions=[];let priorCount=0;
    for(const row of trace){
      const count=row.state?.stats?.overdrivesUsed;
      if(finite(count)&&count>priorCount){counterTransitions.push({elapsed:row.state?.elapsed??row.input?.elapsed??row.elapsed,count,previous:priorCount,room:row.input?.room});priorCount=count;}
      for(const e of row.events??[]){
        if(e.type!=='ability'||e.ability?.slot!=='overdrive'||e.ability.phase!=='cast')continue;
        const at=finite(e.at)?e.at:row.state?.elapsed??row.input?.elapsed??row.elapsed;
        const key=JSON.stringify([at,e.ability.ability,row.input?.room]);if(seenCasts.has(key))continue;seenCasts.add(key);
        casts.push({at,ability:e.ability.ability,room:row.input?.room,timeSource:finite(e.at)?'native event at':'trace observation elapsed'});
      }
    }
    const intervals=casts.slice(1).map((cast,index)=>cast.at-casts[index].at).filter(finite);
    const frames=(report.rooms??[]).filter(r=>finite(r.frame?.p50)&&finite(r.frame?.p95)).map(r=>({room:r.id,nodeId:r.nodeId,result:r.result,frame:r.frame,scope:r.frameScope,timingReset:r.timingReset}));
    const holds=[...(report.loadingHolds??[])];
    for(const room of report.rooms??[])for(const hold of room.loadingHolds??[])if(!holds.some(h=>h.room===hold.room&&h.wallMs===hold.wallMs))holds.push(hold);
    const midFiles=(await readdir(directory)).filter(f=>/-mid\.png$/.test(f)).sort((a,b)=>Number(a.match(/^r(\d+)/)?.[1]??0)-Number(b.match(/^r(\d+)/)?.[1]??0));
    const midRows=[];
    for(const file of midFiles){
      const pngPath=resolve(directory,file),jsonPath=pngPath.replace(/\.png$/,'.json'),snapshot=await json(jsonPath),bytes=await readFile(pngPath);
      if(!snapshot)continue;
      const target=`${rig}-${file}`,targetJson=target.replace(/\.png$/,'.json');
      await copyFile(pngPath,resolve(organic,target));await copyFile(jsonPath,resolve(organic,targetJson));
      const png=decode(bytes),s=snapshot.value,e=s.framingEvidence,viewport=s.hud?.viewport??{width:png.width,height:png.height},insets=e?.insets??s.hud?.insets;
      const panels=s.hud?.opaqueBounds??[],contacts=e?.contacts??[];
      const contactRows=contacts.map(c=>{
        const covered=panels.filter(p=>overlap(c.bounds,p.bounds)>0).map(p=>({id:p.id,overlapPixels:overlap(c.bounds,p.bounds),obscuresThreat:p.obscuresThreat===true,opacity:p.opacity??null,
          yields:p.obscuresThreat===true||p.opacity!==null&&p.opacity!==undefined&&finite(Number(p.opacity))&&Number(p.opacity)<.5}));
        return{...c,insideUsable:inside(c.bounds,insets,viewport),coveredByFadedPanels:covered.filter(p=>p.yields),coveredByUnfadedPanels:covered.filter(p=>!p.yields)};
      });
      const marine=e?.marine??s.hud?.marine,marineOverlaps=panels.filter(p=>overlap(marine,p.bounds)>0).map(p=>({id:p.id,overlapPixels:overlap(marine,p.bounds)}));
      const audit={rig,file:target,room:s.node?.templateId,elapsed:s.elapsed,viewport,insets,framing:e?.framing??s.hud?.framing,
        eightCornerEvidence:!!e,marineBounds:marine,marineInside:inside(marine,insets,viewport),marineOverlaps,
        selected:contactRows.filter(c=>c.selected),selectedOutside:contactRows.filter(c=>c.selected&&!c.insideUsable),
        peripheralOutside:contactRows.filter(c=>!c.selected&&!c.insideUsable),
        contacts:contactRows,unfadedCoverageCandidates:contactRows.filter(c=>c.coveredByUnfadedPanels.length),
        fadedCoverage:contactRows.filter(c=>c.coveredByFadedPanels.length)};
      auditRows.push(audit);midRows.push(audit);
      const receipt={rig,file:target,json:targetJson,original:pngPath,originalJson:jsonPath,sha256:sha256(bytes),jsonSHA256:snapshot.sha256,
        sourceReport:source.path,sourceReportSHA256:source.sha256,tracePath,traceSHA256:traceHash,harnessHead:report.head,application:provenance,
        nativeSize:{width:png.width,height:png.height},room:s.node?.templateId,depth:s.node?.depth,elapsed:s.elapsed};
      organicReceipts.push(receipt);
    }
    const finalOverdrives=report.final?.stats?.overdrivesUsed??null;
    rigReports.push({rig,path:source.path,sha256:source.sha256,head:report.head,branch:report.branch,application:provenance,
      outcome:report.outcome,clears:(report.rooms??[]).filter(r=>['clear','complete'].includes(r.result)).length,
      entered:(report.rooms??[]).length,deaths:report.outcome==='dead'?1:(report.rooms??[]).filter(r=>r.result==='dead').length,
      naturalUnassisted:!report.assisted&&report.incomingDamageScale===1&&!report.fastRendering&&!report.lifecycleOnly&&!report.continuation&&!report.legacy,
      fullNativeRendering:/render every fixed tick|native production RAF/.test(report.clock??''),clock:report.clock,wallSeconds:report.wallSeconds,
      errors:report.errors??[],defects:report.defects??[],hostLoad:report.hostLoad,gpu:report.gpu,
      overdrives:{authoritativeTotal:finalOverdrives,castReceiptCount:casts.length,receiptCountMatchesFinal:finalOverdrives===casts.length,casts,intervalsSeconds:intervals,nonMonotonicIntervals:intervals.filter(v=>v<0),intervalSummary:quantiles(intervals),counterTransitions},
      preparationHolds:{count:holds.length,summaryMs:quantiles(holds.map(h=>h.wallMs)),holds},
      roomCpuFrames:{scope:'Per-room fixed-step update+render CPU submission quantiles, or separately identified native RAF quantiles; not pooled GPU completion or hardware FPS.',
        rooms:frames,p50AcrossRooms:quantiles(frames.map(f=>f.frame.p50)),p95AcrossRooms:quantiles(frames.map(f=>f.frame.p95))},
      organicFrames:midRows.length,organicEarlyLateDepthRange:range(midRows.map(r=>report.rooms.find(room=>room.id===r.room)?.depth)),
      finalStats:report.final?.stats,limitations:report.limitations,
      pass:['dead','complete','room-limit'].includes(report.outcome)&&(report.errors??[]).length===0&&(report.defects??[]).length===0,provenanceVerified:provenance.verified});
  }
  const framingAudit={method:'Actual saved8-corner body projections and measured CSS HUD insets. Selected engagement contacts and marine are audited separately from peripheral contacts. Peripheral outside contacts are reported, not automatically errors. Overlap of a conservative body box with an unfaded HUD rectangle is a review candidate, not proof that dangerous pixels are hidden. Panel yielding is indicated by saved obscuresThreat or opacity<.5. Screenshots remain unmodified.',
    frames:auditRows,marineFailures:auditRows.filter(r=>r.eightCornerEvidence&&!r.marineInside),marineHudOverlaps:auditRows.filter(r=>r.marineOverlaps.length),
    selectedBoundsFailures:auditRows.filter(r=>r.eightCornerEvidence&&r.selectedOutside.length),missingEightCornerEvidence:auditRows.filter(r=>!r.eightCornerEvidence),
    peripheralOutsideFrames:auditRows.filter(r=>r.peripheralOutside.length).length,
    fadedCoverageFrames:auditRows.filter(r=>r.fadedCoverage.length).length,unfadedCoverageCandidateFrames:auditRows.filter(r=>r.unfadedCoverageCandidates.length).length};
  const summary={method:'One original native seed1729 campaign per rig. Natural deaths are reported as deaths, never relabeled completion. Source traces/reports and screenshot JSONs remain unchanged. Frame statistics here describe CPU submission and are excluded from the sustained hardware acceptance.',
    rigs:rigReports,missingInputs:[...missing],accepted:missing.length===0&&rigReports.length===4&&rigReports.every(r=>r.pass&&r.naturalUnassisted&&r.fullNativeRendering&&r.provenanceVerified),
    organic:{path:organic,frames:organicReceipts.length,minimumSixPerRig:rigReports.length===4&&rigReports.every(r=>r.organicFrames>=6),framing:{marineFailures:framingAudit.marineFailures.length,marineHudOverlaps:framingAudit.marineHudOverlaps.length,selectedBoundsFailures:framingAudit.selectedBoundsFailures.length,missingEightCornerEvidence:framingAudit.missingEightCornerEvidence.length,peripheralOutsideFrames:framingAudit.peripheralOutsideFrames,fadedCoverageFrames:framingAudit.fadedCoverageFrames,unfadedCoverageCandidateFrames:framingAudit.unfadedCoverageCandidateFrames}}};
  await writeJson('campaign-summary.json',summary);
  await writeFile(resolve(organic,'source-receipts.json'),JSON.stringify(organicReceipts,null,2)+'\n');
  await writeFile(resolve(organic,'framing-audit.json'),JSON.stringify(framingAudit,null,2)+'\n');
  await organicReview(organic,organicReceipts);
  await writeFile(resolve(organic,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>I9 organic mid-fight evidence</title><style>body{background:#111923;color:#dceaf3;font:15px system-ui;margin:24px}a{color:#9ee3ff}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}figure{margin:0}img{display:block;width:100%}figcaption{padding:8px}p{line-height:1.5}</style><h1>I9 organic mid-fight evidence</h1><p>${organicReceipts.length} unchanged native campaign frames. <a href="source-receipts.json">Hashes/provenance</a> · <a href="framing-audit.json">Actual projection audit</a> · <a href="review480/index.html">Every frame at480×270</a></p><div class="grid">${organicReceipts.map(s=>`<figure><a href="${url(s.file)}"><img src="${url(s.file)}" loading="lazy" alt="${escape(s.file)}"></a><figcaption>${escape(s.file)}<br><a href="${url(s.json)}">Original snapshot</a> · ${s.elapsed?.toFixed(2)??'?'}s</figcaption></figure>`).join('')}</div></html>`);
  const lines=['# I9 native campaign acceptance','',summary.method,'',
    '| Rig | Outcome | Clears / entered | Deaths | Overdrives / cast receipts | V intervals min / median / max s | Holds / max ms | CPU room p50 min / median / max ms | CPU room p95 min / median / max ms | Wall s | Load1m start → end | Errors / defects |',
    '|---|---|---|---:|---|---|---|---|---|---:|---|---|',
    ...rigReports.map(r=>{
      const q=r.overdrives.intervalSummary,p50=r.roomCpuFrames.p50AcrossRooms,p95=r.roomCpuFrames.p95AcrossRooms;
      return`| ${r.rig} | ${r.outcome} | ${r.clears} / ${r.entered} | ${r.deaths} | ${r.overdrives.authoritativeTotal??'?'} / ${r.overdrives.castReceiptCount} | ${q?[q.min,q.p50,q.max].map(fmt).join(' / '):'none'} | ${r.preparationHolds.count} / ${fmt(r.preparationHolds.summaryMs?.max)} | ${p50?[p50.min,p50.p50,p50.max].map(fmt).join(' / '):'missing'} | ${p95?[p95.min,p95.p50,p95.max].map(fmt).join(' / '):'missing'} | ${fmt(r.wallSeconds)} | ${fmt(r.hostLoad?.start?.[0])} → ${fmt(r.hostLoad?.latest?.[0])} | ${r.errors.length} / ${r.defects.length} |`;
    }),'',`Organic frames: ${organicReceipts.length}. Minimum6 perrig: ${summary.organic.minimumSixPerRig}. Actual marine-bound failures: ${framingAudit.marineFailures.length}; marine/HUD overlaps: ${framingAudit.marineHudOverlaps.length}; selected-contact bounds failures: ${framingAudit.selectedBoundsFailures.length}.`,
    `Peripheral outside frames: ${framingAudit.peripheralOutsideFrames}; faded-HUD coverage frames: ${framingAudit.fadedCoverageFrames}; conservative unfaded-coverage candidates: ${framingAudit.unfadedCoverageCandidateFrames}. Candidates require PNG review; they are not automatically classified as hidden danger.`,
    '', '## Missing inputs','',...(missing.length?missing.map(p=>`- ${p}`):['None.']),''];
  await writeFile(resolve(out,'campaign-summary.md'),lines.join('\n'));
  console.log(`Campaign summary: ${rigReports.length}/4 rigs; ${organicReceipts.length} unchanged mid-fight frames; accepted=${summary.accepted}; missing=${missing.length}.`);
}

/** Exact area average; derivatives never replace original evidence PNGs. */
function area(source){
  const width=480,height=270,horizontal=new Float64Array(width*source.height*3),xs=source.width/width,ys=source.height/height;
  for(let y=0;y<source.height;y++)for(let x=0;x<width;x++){
    const a=x*xs,b=(x+1)*xs,t=(y*width+x)*3;
    for(let sx=Math.floor(a);sx<Math.ceil(b);sx++){
      const weight=(Math.min(b,sx+1)-Math.max(a,sx))/xs,s=(y*source.width+Math.min(source.width-1,sx))*source.channels;
      for(let c=0;c<3;c++)horizontal[t+c]+=source.pixels[s+c]*weight;
    }
  }
  const result=canvas(width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=y*ys,b=(y+1)*ys,t=(y*width+x)*3;let red=0,green=0,blue=0;
    for(let sy=Math.floor(a);sy<Math.ceil(b);sy++){
      const weight=(Math.min(b,sy+1)-Math.max(a,sy))/ys,s=(Math.min(source.height-1,sy)*width+x)*3;
      red+=horizontal[s]*weight;green+=horizontal[s+1]*weight;blue+=horizontal[s+2]*weight;
    }
    result.pixels[t]=Math.round(red);result.pixels[t+1]=Math.round(green);result.pixels[t+2]=Math.round(blue);
  }
  return result;
}
async function organicReview(directory,receipts){
  const review=resolve(directory,'review480');await mkdir(review,{recursive:true});const pages=[];
  for(let start=0;start<receipts.length;start+=6){
    const image=canvas(1440,592),entries=receipts.slice(start,start+6),file=`organic-${String(start/6+1).padStart(3,'0')}.png`;
    for(let i=0;i<entries.length;i++){
      const entry=entries[i],small=area(decode(await readFile(resolve(directory,entry.file)))),x=i%3*480,y=Math.floor(i/3)*296;
      drawText(image,entry.file,x+4,y+5,undefined,1);drawImage(image,small,x,y+24,480,270);
      await writeFile(resolve(review,entry.file),encode(small));
    }
    await writeFile(resolve(review,file),encode(image));pages.push({file,entries:entries.map(e=>({file:e.file,sha256:e.sha256,room:e.room,depth:e.depth,rig:e.rig}))});
  }
  await writeFile(resolve(review,'pages.json'),JSON.stringify(pages,null,2)+'\n');
  await writeFile(resolve(review,'index.html'),`<!doctype html><meta charset="utf-8"><title>I9 organic480 review</title><style>body{background:#111923;color:#e1edf5;font:15px system-ui;margin:24px}img{width:100%;max-width:1440px;display:block}figure{margin:20px 0}</style><h1>All original campaign mid-fight frames at480×270</h1>${pages.map(p=>`<figure><a href="${url(p.file)}"><img src="${url(p.file)}" loading="lazy" alt="${escape(p.file)}"></a><figcaption>${escape(p.file)} · ${p.entries.map(e=>escape(e.file)).join(' · ')}</figcaption></figure>`).join('')}`);
}

if(!args.includes('--campaigns-only'))await performance();
// Missing inputs are reported per requested output, never silently replaced with historical data.
if(!args.includes('--performance-only')){missing.length=0;await campaigns();}
