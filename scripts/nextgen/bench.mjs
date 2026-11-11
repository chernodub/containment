#!/usr/bin/env node
/** Sequential production-browser benchmark. No timing assertions on a shared host. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadavg, cpus} from 'node:os';
import {chromium} from 'playwright';
import {stageV2} from './v2-scenarios.mjs';
import {SCENARIOS} from './scenarios.mjs';

const args=process.argv.slice(2);
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const label=option('label','integration-4-bench');
assert(/^[\w.-]+$/.test(label));
const seconds=Number(option('seconds',20)), repeats=Number(option('repeat',3));
assert(seconds>=1&&seconds<=120&&repeats>=1&&repeats<=10);
const out=resolve('artifacts/nextgen',label), dist=resolve(option('dist','dist'));
const tiers=option('tiers','high,low').split(','), rigs=option('rigs','breacher,cryo,pyro,arc').split(',');
const storyRooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
await mkdir(out,{recursive:true});
if(!args.includes('--no-build'))execFileSync('npm',['run','build'],{stdio:'inherit'});
const host=()=>({at:new Date().toISOString(),load:loadavg(),cores:cpus().length});
const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),seconds,repeats,host:host(),scan:[],runs:[],errors:[],notes:['25 legal initial enemies; losses retained; native ability cooldowns, Overdrive recharged only by actual damage after initial fill. Invulnerable marine is fixture-only.','Audio is main-thread scheduling time; audio render callback timing is unavailable. GPU time uses EXT_disjoint_timer_query_webgl2 when supported.','Timing runs use retained numeric arrays; instrumentation allocates samples intentionally. Heap/CPU sampling runs are flagged and are not quiet budget certification.']};
let browser;
const server=createServer(async(req,res)=>{
 const file=resolve(dist,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/containment\//,'')||'index.html');
 if(!file.startsWith(dist+'/'))return res.writeHead(404).end();
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}
});
try{
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.setDefaultTimeout(180000);
 page.on('pageerror',e=>report.errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`;
 async function reset(){await page.goto(url);await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);}
 await reset();
 report.gpu=await page.evaluate(()=>{const gl=window.__containmentDebug.renderer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 assert(!/swiftshader|software|llvmpipe/i.test(report.gpu),'Hardware renderer required');
 let rooms=option('rooms','').split(',').filter(Boolean);
 if(args.includes('--scan')||!rooms.length){
  for(const room of storyRooms){
   await reset();await page.evaluate(SCENARIOS.find(s=>s.id==='g2-calm-high').setup,room);
   const counts=await page.evaluate(()=>{const d=window.__containmentDebug;d.refresh();return {...d.renderer.renderer.info.render};});
   report.scan.push({room,...counts,host:host()});console.log(`scan ${room}: ${counts.calls} draws`);
  }
  const ranked=[...report.scan].sort((a,b)=>b.calls-a.calls);rooms=[ranked[0].room,ranked[Math.floor(ranked.length/2)].room];
  await writeFile(resolve(out,'room-ranking.json'),JSON.stringify(report.scan,null,2));
 }
 report.rooms=rooms;
 for(const room of rooms)for(const rig of rigs)for(const tier of tiers)for(let repeat=0;repeat<repeats;repeat++){
  const name=`${room}-${rig}-${tier}-${repeat}`, before=host();console.log(`bench ${name}, load ${before.load.map(x=>x.toFixed(2)).join('/')}`);
  await reset();await page.evaluate(stageV2,{rig,room,tier,heavy:true,setupOnly:true});
  await page.mouse.click(1910,10); // trusted audio unlock, outside HUD actions
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const profile=args.includes('--profile');
  const traceEvents=[];if(profile)cdp.on('Tracing.dataCollected',event=>traceEvents.push(...event.value));
  if(profile){await cdp.send('Tracing.start',{categories:'v8,disabled-by-default-v8.gc',transferMode:'ReportEvents'});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');await cdp.send('HeapProfiler.startSampling',{samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});}
  const initial=await cdp.send('Performance.getMetrics');
  const data=await page.evaluate(async seconds=>{
   const d=window.__containmentDebug,g=d.game,r=d.renderer,gl=r.renderer.getContext();
   const capacity=Math.ceil(seconds*240), samples={frame:[],update:[],render:[],hud:[],audio:[],draws:[],triangles:[],lights:[],instances:[],gpu:[]};
   const values={};for(const key of Object.keys(samples))values[key]=new Float64Array(capacity);
   let count=0,programs=0,peakInstances=0;const create=gl.createProgram;
   gl.createProgram=function(){programs++;return create.call(gl);};
   const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),pending=[];let frame=0;
   const original=r.render;
   r.render=function(...args){
    const query=ext&&frame++%15===0?gl.createQuery():null;
    if(query)gl.beginQuery(ext.TIME_ELAPSED_EXT,query);
    const result=original.apply(this,args);
    if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(query);}
    return result;
   };
   d.observePerformance(sample=>{
    if(count>=capacity)return;
    for(const key of ['frame','update','render','hud','audio'])values[key][count]=sample[key];
    values.draws[count]=r.renderer.info.render.calls;values.triangles[count]=r.renderer.info.render.triangles;
    let lights=0;for(const l of r.lighting.pool.lights)if(l.intensity>0)lights++;
    values.lights[count]=lights;
    let instances=0;const visit=o=>{if(!o.visible)return;if(o.isInstancedMesh)instances+=o.count;for(const c of o.children)visit(c);};visit(r.interimAbilities.root);values.instances[count]=instances;peakInstances=Math.max(peakInstances,instances);
    count++;
   });
   const lane=d.benchmarkLane, start=performance.now(), initialEnemies=g.enemies.activeCount;
   g.switchWeapon('rifle');d.fillOverdrive();
   const uses={dash:0,tactical:0,power:0,overdrive:0};
   d.realtime(true);
   try{
    while(performance.now()-start<seconds*1000){
     const elapsed=(performance.now()-start)/1000;
     // Reverse a short, legal kiting vector. Collision remains authoritative.
     const side=Math.sin(elapsed*1.2)>0?1:-1;
     d.setInput({fire:true,x:-Math.sin(lane.angle)*side*.25,y:Math.cos(lane.angle)*side*.25,angle:null,autoAim:true});
     for(const slot of ['power','tactical','dash','overdrive'])if(g.abilities.snapshot.slots[slot].ready&&g.useAbility(slot))uses[slot]++;
     await new Promise(requestAnimationFrame);
    }
   }finally{d.realtime(false);d.observePerformance(undefined);gl.createProgram=create;r.render=original;}
   const gpu=[];for(const q of pending){if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT))gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
   for(const key of Object.keys(samples))samples[key]=Array.from(values[key].subarray(0,count));samples.gpu=gpu;
   return {samples,count,programs,uses,initialEnemies,remainingEnemies:g.enemies.activeCount,simulationSeconds:g.elapsed,wallSeconds:(performance.now()-start)/1000,programInventory:r.renderer.info.programs.length,abilityPool:r.interimAbilities.kit.counts,gpuSupported:!!ext,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null};
  },seconds);
  const final=await cdp.send('Performance.getMetrics');
  let profiling=null;
  if(profile){const cpu=await cdp.send('Profiler.stop'),heap=await cdp.send('HeapProfiler.stopSampling');
   const complete=new Promise(ok=>cdp.once('Tracing.tracingComplete',ok));await cdp.send('Tracing.end');await complete;
   await writeFile(resolve(out,name+'.trace.json'),JSON.stringify({traceEvents}));
   const gc=traceEvents.filter(e=>e.ph==='X'&&/V8.GC_SCAVENGER$|V8.GC_MARK_COMPACTOR$|MinorGC$|MajorGC$/.test(e.name)).map(e=>(e.dur??0)/1000);
   const allocated=heap.profile.samples.reduce((n,s)=>n+s.size,0);profiling={sampledAllocationBytes:allocated,sampledAllocationBytesPerSecond:allocated/data.wallSeconds,gcPausesMs:gc};await writeFile(resolve(out,name+'.cpuprofile'),JSON.stringify(cpu.profile));await writeFile(resolve(out,name+'.heapprofile'),JSON.stringify(heap.profile));}
  await cdp.detach();
  const stats=values=>{if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);return {p50:s[Math.floor((s.length-1)*.5)],p95:s[Math.ceil(s.length*.95)-1],max:s.at(-1),average:s.reduce((a,b)=>a+b,0)/s.length};};
  const summary=Object.fromEntries(Object.entries(data.samples).map(([k,v])=>[k,stats(k==='frame'?v.slice(1):v)]));
  // The first RAF interval begins before the measurement window; retain it raw, exclude it only from frame statistics.
  summary.cpu=stats(data.samples.update.map((v,i)=>v+data.samples.render[i]));
  const run={name,room,rig,tier,repeat,before,after:host(),profile,profiling,summary,...data,cdp:{initial:initial.metrics,final:final.metrics}};
  report.runs.push(run);await writeFile(resolve(out,'benchmark.json'),JSON.stringify(report,null,2));
  console.log(`${name}: frame ${summary.frame.p50.toFixed(2)}/${summary.frame.p95.toFixed(2)}ms CPU ${summary.cpu.p50.toFixed(2)}/${summary.cpu.p95.toFixed(2)}ms draws ${summary.draws.max}, compiles ${data.programs}`);
  assert.equal(data.programs,0,'Mid-combat shader compile');
 }
 const triple=s=>s?`${s.p50.toFixed(2)}/${s.p95.toFixed(2)}/${s.max.toFixed(2)}`:'unavailable';
 console.log('Timing columns are p50 / p95 / max milliseconds');
 console.table(report.runs.map(r=>({scenario:r.name,load:r.before.load[0].toFixed(1),frame:triple(r.summary.frame),update:triple(r.summary.update),render:triple(r.summary.render),hud:triple(r.summary.hud),audioSync:triple(r.summary.audio),cpu:triple(r.summary.cpu),gpu:triple(r.summary.gpu)})));
 console.table(report.runs.map(r=>({scenario:r.name,draws:r.summary.draws.max,triangles:r.summary.triangles.max,lights:r.summary.lights.max,instances:r.summary.instances.max,programs:r.programInventory,compiles:r.programs,allocationBytesPerSecond:r.profiling?.sampledAllocationBytesPerSecond??'not sampled',gcMaxMs:r.profiling?Math.max(0,...r.profiling.gcPausesMs):'not traced'})));
 assert.equal(report.errors.length,0,report.errors.join('\n'));
}finally{await writeFile(resolve(out,'benchmark.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(ok=>server.close(ok));}
