#!/usr/bin/env node
/** Native single-browser production initial-load comparison; no screenshots or debug staging. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadavg,cpus,platform,release} from 'node:os';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';

const args=process.argv.slice(2);
const allowed=new Set(['baseline-dist','dist','out','baseline-source-sha','dist-source-sha','help']);
for(const arg of args){assert(arg.startsWith('--')&&allowed.has(arg.slice(2).split('=')[0]),`Unknown argument ${arg}`);assert(arg==='--help'||arg.includes('='),'Use --name=value');}
const option=(name,fallback)=>args.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
if(args.includes('--help')){
 console.log('node scripts/nextgen/i10-loading.mjs [--baseline-dist=artifacts/nextgen/i10/baseline-dist] [--dist=artifacts/nextgen/i10/final-dist] [--out=artifacts/nextgen/i10/loading.json] [--baseline-source-sha=0cfcecb] [--dist-source-sha=<sha>]');
 process.exit(0);
}
const baselineDist=resolve(option('baseline-dist','artifacts/nextgen/i10/baseline-dist'));
const finalDist=resolve(option('dist','artifacts/nextgen/i10/final-dist'));
const output=resolve(option('out','artifacts/nextgen/i10/loading.json'));
assert.notEqual(baselineDist,finalDist,'Comparison must use two distinct production distributions');
const prefix='/containment/';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const host=()=>({at:new Date().toISOString(),load:loadavg(),logicalCores:cpus().length});
const round=value=>Math.round(value*10)/10;
const forbidden=url=>url.includes('/assets/kits/')||url.includes('/assets/vfx/containment-v6/');
const role=url=>/\.js(?:\?|$)/.test(url)?'js':/\.css(?:\?|$)/.test(url)?'css':/\.(woff2?|ttf|otf)(?:\?|$)/.test(url)?'font':/\.(glb|gltf)(?:\?|$)/.test(url)?'model':/\.(png|jpe?g|webp|svg)(?:\?|$)/.test(url)?'image':/\.(ogg|mp3|wav)(?:\?|$)/.test(url)?'audio':'other';
const total=rows=>({requests:rows.length,decodedBytes:rows.reduce((sum,row)=>sum+(row.decodedBytes??0),0),gzipEstimateBytes:rows.reduce((sum,row)=>sum+(row.gzipEstimateBytes??0),0)});
const report={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),started:host(),
 machine:{platform:platform(),release:release(),cpu:cpus()[0]?.model??null},viewport:{width:1920,height:1080},sources:[],errors:[],failures:[],
 method:'One native Chromium browser, one isolated fresh context/page at a time, production /containment/ URL without debug. Native Start → equip Breacher → first boon → first combat. No screenshots, simulation fixtures, throttling or cache reuse.',
 qualifications:[
  'The baseline source is exact 0cfcecb reconstructed inside this worktree using git cat-file. Its build reuses the current public tree; initial requested public media are expected to be unchanged. Each requested baseline public file is compared to the 0cfcecb blob and any difference is reported, not hidden.',
  'Decoded response-body bytes and per-response gzip level9 estimates are measured locally. The audit server serves uncompressed bodies with no-store; gzip estimates are not observed network transfers and summing per-file estimates includes per-file gzip overhead.',
  'Menu-ready elapsed and host loads are single observations, not hardware frame/preparation acceptance. Resource timing and DOM loading intervals retain first-gameplay request/readiness evidence without asserting sub-frame causality.',
  'Fresh contexts and no-store responses prevent application/HTTP-cache reuse. Both sources share one browser process and OS/GPU caches, with baseline measured first; this is not a cold-machine startup speed comparison.',
 ]};
let servingDist=baselineDist,browser,context,server;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};

async function save(){
 const baseline=report.sources.find(source=>source.name==='BASELINE'),final=report.sources.find(source=>source.name==='FINAL');
 if(baseline?.initial&&final?.initial){
  const delta=(before,after)=>({before,after,delta:after-before,percent:before?round((after-before)/before*100):null});
  report.comparison={baselinePublicComparable:baseline.baselinePublicMismatches.length===0,requests:delta(baseline.initial.total.requests,final.initial.total.requests),decodedBytes:delta(baseline.initial.total.decodedBytes,final.initial.total.decodedBytes),gzipEstimateBytes:delta(baseline.initial.total.gzipEstimateBytes,final.initial.total.gzipEstimateBytes),js: {},css:{},menuReadyMs:delta(baseline.initial.menuReadyMs,final.initial.menuReadyMs)};
  for(const kind of ['js','css'])for(const key of ['requests','decodedBytes','gzipEstimateBytes'])report.comparison[kind][key]=delta(baseline.initial.byRole[kind][key],final.initial.byRole[kind][key]);
 }
 report.finished=host();report.passed=report.sources.length===2&&report.errors.length===0&&report.failures.length===0&&report.sources.every(source=>source.passed&&source.errors.length===0);
 await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
 const lines=['# I10 initial loading audit','',report.method,'',`Result: **${report.passed?'PASS':'INCOMPLETE / FAIL'}**. Renderer: ${report.renderer??'unrecorded'}. Browser: ${report.browser??'unrecorded'}.`,'',
 '| Source | Initial requests | Decoded bytes | Gzip estimate bytes | JS requests / decoded / gzip estimate | CSS requests / decoded / gzip estimate | First menu ready ms | Load1m start → menu |',
 '|---|---:|---:|---:|---:|---:|---:|---:|'];
 for(const source of report.sources){const i=source.initial;lines.push(i?`| ${source.name} | ${i.total.requests} | ${i.total.decodedBytes} | ${i.total.gzipEstimateBytes} | ${i.byRole.js.requests} / ${i.byRole.js.decodedBytes} / ${i.byRole.js.gzipEstimateBytes} | ${i.byRole.css.requests} / ${i.byRole.css.decodedBytes} / ${i.byRole.css.gzipEstimateBytes} | ${i.menuReadyMs} | ${round(source.before.load[0])} → ${round(i.menuHost.load[0])} |`:`| ${source.name} | incomplete | | | | | | |`);}
 if(report.comparison){const c=report.comparison;lines.push('',`Final − baseline: requests ${c.requests.delta>=0?'+':''}${c.requests.delta}; decoded bytes ${c.decodedBytes.delta>=0?'+':''}${c.decodedBytes.delta}; JS decoded bytes ${c.js.decodedBytes.delta>=0?'+':''}${c.js.decodedBytes.delta}; CSS decoded bytes ${c.css.decodedBytes.delta>=0?'+':''}${c.css.decodedBytes.delta}. No arbitrary size threshold is applied.`);}
 for(const source of report.sources){lines.push('',`## ${source.name}`,`Source: ${source.sourceSHA??'unrecorded'}; dist: ${source.directory}.`);if(source.initial)lines.push(`Initial eager kit/atlas requests: ${source.initial.eagerAssets.length}. Loaded JS/CSS SHA256, all response sizes, fonts and resource timings are in the JSON receipt.`);if(source.gameplay)lines.push(`Native first gameplay ready: ${source.gameplay.ready}; observed room hold: ${source.gameplay.observedLoadingHold}; kit requests ${source.gameplay.kitRequests.length}; atlas requests ${source.gameplay.atlasRequests.length}; page/console/network errors ${source.errors.length}. Native steps: ${source.gameplay.actions.map(action=>action.action).join(' → ')}.`);if(source.baselinePublicMismatches?.length)lines.push(`Baseline public mismatches: ${source.baselinePublicMismatches.map(row=>row.path).join(', ')}. This affects comparability; see individual hashes in JSON.`);}
 lines.push('','## Qualifications',...report.qualifications.map(note=>`- ${note}`),'','## Errors / failures',...report.errors.map(error=>`- ${JSON.stringify(error)}`),...report.failures.map(error=>`- ${JSON.stringify(error)}`));
 await writeFile(output.replace(/\.json$/i,'')+'.md',lines.join('\n')+'\n');
}

async function measure(name,directory,sourceSHA){
 servingDist=directory;await readFile(resolve(directory,'index.html'));
 const row={name,directory,sourceSHA,before:host(),requests:[],errors:[],baselinePublicMismatches:[],passed:false};report.sources.push(row);
 context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,serviceWorkers:'block'});
 const page=await context.newPage();page.setDefaultTimeout(120000);
 const started=performance.now(),pending=new Set(),requestRows=new WeakMap();let phase='initial';
 const elapsed=()=>round(performance.now()-started);
 const enqueue=promise=>{pending.add(promise);promise.finally(()=>pending.delete(promise));};
 const drain=async()=>{while(pending.size)await Promise.allSettled([...pending]);};
 page.on('pageerror',error=>row.errors.push({type:'pageerror',phase,message:error.message}));
 page.on('console',message=>{if(message.type()==='error')row.errors.push({type:'console',phase,message:message.text()});});
 page.on('request',request=>{
  const entry={url:request.url(),method:request.method(),resourceType:request.resourceType(),phase,startedMs:elapsed()};
  row.requests.push(entry);requestRows.set(request,entry);
  if(!request.url().startsWith(origin)&&/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(request.url()))row.errors.push({type:'external-font',url:request.url(),phase});
 });
 page.on('requestfailed',request=>{const entry=requestRows.get(request);if(entry)entry.failure=request.failure();if(phase==='teardown'){(row.teardownCancellations??=[]).push({url:request.url(),failure:request.failure()});return;}row.errors.push({type:'requestfailed',phase:entry?.phase??phase,url:request.url(),failure:request.failure()});});
 page.on('response',response=>{
  const entry=requestRows.get(response.request());if(!entry)return;
  enqueue((async()=>{
   entry.status=response.status();entry.role=role(response.url());entry.responseMs=elapsed();
   if(response.status()>=400)row.errors.push({type:'http',phase:entry.phase,status:response.status(),url:response.url()});
   try{const bytes=await response.body();entry.completedMs=elapsed();entry.decodedBytes=bytes.length;entry.gzipEstimateBytes=gzipSync(bytes,{level:9}).length;entry.sha256=hash(bytes);}
   catch(error){entry.bodyError=String(error);row.errors.push({type:'body',phase:entry.phase,url:response.url(),message:String(error)});}
  })());
 });
 let observer;
 try{
  console.log(`Loading ${name}: ${directory}; host load ${loadavg().map(value=>value.toFixed(2)).join('/')}`);
  await page.goto(origin+prefix+'?seed=1729',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.dataset.state==='menu'&&!!window.__containmentPerformance);
  const menuReadyMs=elapsed(),menuHost=host();
  await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');await drain();
  const initialState=await page.evaluate(()=>({state:document.body.dataset.state,browserNow:performance.now(),fonts:[...document.fonts].map(font=>({family:font.family,style:font.style,weight:font.weight,status:font.status})),resources:performance.getEntriesByType('resource').map(resource=>({url:resource.name,initiatorType:resource.initiatorType,startTime:resource.startTime,responseEnd:resource.responseEnd,duration:resource.duration,decodedBodySize:resource.decodedBodySize,encodedBodySize:resource.encodedBodySize,transferSize:resource.transferSize})),renderer:(()=>{const canvas=document.querySelector('#world');const gl=canvas?.getContext?.('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return gl?(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)):null;})()}));
  report.renderer??=initialState.renderer;
  const initialRequests=row.requests.filter(request=>request.phase==='initial');
  row.initial={menuReadyMs,menuHost,settledMs:elapsed(),state:initialState.state,browserNow:initialState.browserNow,fonts:initialState.fonts,resources:initialState.resources,total:total(initialRequests),byRole:Object.fromEntries(['js','css','font','model','image','audio','other'].map(kind=>[kind,total(initialRequests.filter(request=>request.role===kind))])),loadedModules:initialRequests.filter(request=>['js','css'].includes(request.role)).map(({url,role,decodedBytes,gzipEstimateBytes,sha256})=>({url,role,decodedBytes,gzipEstimateBytes,sha256})),eagerAssets:initialRequests.filter(request=>forbidden(request.url))};
  assert.equal(row.initial.eagerAssets.length,0,`${name}: kits/effect atlas were eagerly requested before native Start`);
  if(name==='BASELINE')for(const request of initialRequests){
   const url=new URL(request.url);if(!url.pathname.startsWith(prefix)||request.role==='js'||request.role==='css'||url.pathname===prefix)continue;
   const relative=decodeURIComponent(url.pathname.slice(prefix.length));if(!relative)continue;
   let expected;try{expected=hash(execFileSync('git',['cat-file','blob',`${sourceSHA}:public/${relative}`],{stdio:['ignore','pipe','ignore']}));}catch{expected=null;}
   if(expected!==request.sha256)row.baselinePublicMismatches.push({path:relative,baselineSHA256:expected,servedSHA256:request.sha256??null});
  }
  // A handle owns observation state; no extra global or production/debug hook is installed.
  observer=await page.evaluateHandle(()=>{
   const rows=[];let previous='';const read=()=>({at:performance.now(),state:document.body.dataset.state,worldBusy:document.querySelector('#world')?.getAttribute('aria-busy')??null,loadingVisible:document.querySelector('#room-loading')?.hidden===false});
   const sample=()=>{const value=read(),key=JSON.stringify([value.state,value.worldBusy,value.loadingVisible]);if(key!==previous){rows.push(value);previous=key;}};
   const observer=new MutationObserver(sample);observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['data-state','aria-busy','hidden']});sample();
   return {rows,read,stop:()=>observer.disconnect()};
  });
  phase='first-gameplay';const actions=[];
  const action=async(name,run)=>{actions.push({action:name,nodeMs:elapsed(),browserMs:await page.evaluate(()=>performance.now())});await run();};
  await action('native #start click',()=>page.locator('#start').click());
  await page.waitForFunction(()=>document.body.dataset.state==='rig-select');
  await action('native #equip-rig click (default Breacher)',()=>page.locator('#equip-rig').click());
  await page.waitForFunction(()=>document.body.dataset.state==='reward'&&document.querySelectorAll('[data-mutation]').length>0);
  await action('native first boon click',()=>page.locator('[data-mutation]').first().click());
  await page.waitForFunction(()=>document.body.dataset.state==='playing'&&document.querySelector('#world')?.getAttribute('aria-busy')==='false'&&document.querySelector('#room-loading')?.hidden===true);
  const readyNodeMs=elapsed(),readyHost=host(),readyState=await observer.evaluate(value=>value.read());
  await page.waitForLoadState('networkidle');await drain();
  const timeline=await observer.evaluate(value=>value.rows),resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(resource=>({url:resource.name,initiatorType:resource.initiatorType,startTime:resource.startTime,responseEnd:resource.responseEnd,duration:resource.duration,decodedBodySize:resource.decodedBodySize,encodedBodySize:resource.encodedBodySize,transferSize:resource.transferSize})));
  const gameplayRequests=row.requests.filter(request=>request.phase==='first-gameplay'),kitRequests=gameplayRequests.filter(request=>request.url.includes('/assets/kits/')),atlasRequests=gameplayRequests.filter(request=>request.url.includes('/assets/vfx/containment-v6/elements.png'));
  const observedLoadingHold=timeline.some(state=>state.worldBusy==='true'||state.loadingVisible);
  row.gameplay={flow:'Native UI only; no debug URL or staging',actions,ready:true,readyNodeMs,readyBrowserMs:readyState.at,readyHost,readyState,timeline,resources,total:total(gameplayRequests),kitRequests,atlasRequests,observedLoadingHold,
   newAssetsReadyBeforeInput:resources.filter(resource=>forbidden(resource.url)).map(resource=>({...resource,responseCompletedBeforeReady:resource.responseEnd>0&&resource.responseEnd<=readyState.at}))};
  assert.equal(readyState.worldBusy,'false',`${name}: first gameplay readiness missing`);assert.equal(readyState.loadingVisible,false,`${name}: first gameplay loading overlay remains`);
  if(name==='FINAL'){
   assert(kitRequests.length>0,'FINAL: no kit request after native Start');assert.equal(atlasRequests.length,1,'FINAL: first gameplay must request exactly one shared atlas');assert(observedLoadingHold,'FINAL: no native DOM room-preparation hold was observed');
   for(const request of [...kitRequests,...atlasRequests])assert(row.gameplay.newAssetsReadyBeforeInput.some(asset=>asset.url===request.url),`FINAL: missing resource-timing receipt for ${request.url}`);
   for(const asset of row.gameplay.newAssetsReadyBeforeInput)assert(asset.responseCompletedBeforeReady,`FINAL: ${asset.url} did not finish before first gameplay readiness`);
  }
  assert.deepEqual(row.errors,[],`${name}: console/page/network errors`);row.passed=true;row.after=host();
  console.log(`${name}: initial ${row.initial.total.requests} requests / ${row.initial.total.decodedBytes} decoded bytes; JS ${row.initial.byRole.js.decodedBytes}; native first gameplay ready; load ${row.after.load[0].toFixed(2)}`);
 }finally{
  phase='teardown';await observer?.evaluate(value=>value.stop()).catch(()=>{});await observer?.dispose().catch(()=>{});await drain();await context.close();context=undefined;
 }
}

let origin;
try{
 server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith(prefix)){res.writeHead(404).end();return;}
  let relative;try{relative=decodeURIComponent(path.slice(prefix.length));}catch{res.writeHead(400).end();return;}
  const file=resolve(servingDist,relative||'index.html');if(!file.startsWith(servingDist+'/')){res.writeHead(404).end();return;}
  try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store'}).end(bytes);}
  catch{res.writeHead(404).end();}
 });
 await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});origin=`http://127.0.0.1:${server.address().port}`;
 const launch={headless:true,args:['--no-sandbox',`--use-angle=${platform()==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']};
 if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)launch.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;else launch.channel='chromium';
 browser=await chromium.launch(launch);report.browser=browser.version();report.launch=launch;
 const baselineSHA=option('baseline-source-sha','0cfcecb');
 const finalSHA=option('dist-source-sha',await readFile(resolve(finalDist,'SOURCE_SHA'),'utf8').then(value=>value.trim()).catch(()=>null));
 for(const [name,directory,sourceSHA]of [['BASELINE',baselineDist,baselineSHA],['FINAL',finalDist,finalSHA]]){
  try{await measure(name,directory,sourceSHA);}catch(error){report.failures.push({source:name,message:String(error)});console.error(`${name} loading audit failed: ${error}`);}
  await save();
 }
}catch(error){report.errors.push({message:String(error)});console.error(error);}
finally{await context?.close().catch(()=>{});await browser?.close().catch(()=>{});if(server?.listening)await new Promise(done=>server.close(done));await save();}
console.log(`Initial loading audit ${report.passed?'passed':'failed'}: ${output}`);if(!report.passed)process.exitCode=1;
