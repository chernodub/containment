#!/usr/bin/env node
/** Serial fresh-page and retained-session room preparation audit on the production renderer. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadavg, cpus} from 'node:os';
import {chromium} from 'playwright';

const args = process.argv.slice(2);
const option = (name, fallback) => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const allRooms = ['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor','reactor-vault'];
const rooms = option('rooms', allRooms.join(',')).split(',');
const loadLimit = Number(option('load-limit', '0'));
assert(rooms.every(r => allRooms.includes(r)), 'Unknown room');
const label = option('label', 'p1-rooms');
assert(/^[\w.-]+$/.test(label));
const out = resolve('artifacts/nextgen', label), dist = resolve(option('dist', 'dist'));
const baseline = args.includes('--baseline');
const modes=option('modes','fresh,sequential').split(',');assert(modes.every(mode=>['fresh','sequential','ahead','revisit'].includes(mode)),'Unknown audit mode');
const host = () => ({at: new Date().toISOString(), load: loadavg(), cores: cpus().length});
const report = {distSourceSHA:option('dist-source-sha','unrecorded'),sha: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), dist, baseline, host: host(), rows: [], errors: [], failures: [], notes: ['Fresh page per room; sequential rows retain the same renderer through all rooms, using validated checkpoint routes. Sequential staging is accumulation coverage, not an organic twenty-room campaign.', 'Revisit mode primes each room and then repeats the same traversal in the same renderer.', 'Phases are inclusive and may overlap. Model fetch and parse durations sum across parallel loads. Compressed texture loading includes worker setup and is nested within parse. Total is the complete public gotoRoom readiness hold.']};
await mkdir(out, {recursive: true});
if (!args.includes('--no-build')) execFileSync('npm',['run','build'],{stdio:'inherit'});
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server = createServer(async (req,res) => {
  const file = resolve(dist, decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/containment\//,'') || 'index.html');
  if (!file.startsWith(dist + '/')) return res.writeHead(404).end();
  try {res.setHeader('Content-Type',mime[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file));}
  catch {res.writeHead(404).end();}
});
let browser;
try {
  await new Promise((ok,fail) => {server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  browser = await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
  let page;
  async function reset() {
    await page?.close();
    page = await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
    page.setDefaultTimeout(180000);
    page.on('pageerror',e => report.errors.push(e.message));
    page.on('console',m => {if(m.type()==='error') report.errors.push(m.text());});
    await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);
    await page.waitForFunction(() => !!window.__containmentDebug);
    await page.evaluate(() => {
      const r = window.__containmentDebug.renderer;
      const gl = r.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      window.__roomAudit = {gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER), phases:{}, calls:{}};
      const prepare=r.prepare;
      r.prepare=async function(...args){window.__roomAudit.ready=false;const value=await prepare.apply(this,args);window.__roomAudit.ready=true;return value;};
      const render=r.post.render;
      r.post.render=function(...args){
        const audit=window.__roomAudit, measure=audit.ready&&!audit.calls.firstFrame;
        const started=measure?performance.now():0;
        try{return render.apply(this,args);}
        finally{if(measure){audit.phases.firstFrame=performance.now()-started;audit.calls.firstFrame=1;}}
      };
      const shadow=r.renderer.shadowMap, renderShadows=shadow.render;
      shadow.render=function(...args){
        if(!shadow.enabled||!shadow.needsUpdate)return renderShadows.apply(this,args);
        const started=performance.now();
        try{return renderShadows.apply(this,args);}
        finally{
          const audit=window.__roomAudit;
          audit.phases.shadowAtlas=(audit.phases.shadowAtlas??0)+performance.now()-started;
          audit.calls.shadowAtlas=(audit.calls.shadowAtlas??0)+1;
        }
      };
      const create=gl.createProgram;
      gl.createProgram=function(){if(window.__roomAudit.ready)window.__roomAudit.postReadyCompiles=(window.__roomAudit.postReadyCompiles??0)+1;return create.call(gl);};
      for (const key of ['loadRoom','prepareScene','captureRoomReflections','compilePrepared','freezeRoomTransforms']) {
        const original = r[key]; if (typeof original !== 'function') continue;
        r[key] = function(...args) {
          const start = performance.now(), audit = window.__roomAudit;
          const done = () => {audit.phases[key]=(audit.phases[key]??0)+performance.now()-start;audit.calls[key]=(audit.calls[key]??0)+1;};
          try {const value=original.apply(this,args);if(value?.then)return value.finally(done);done();return value;}
          catch(e) {done();throw e;}
        };
      }
    });
  }
  for (const mode of modes) {
    if (mode!=='fresh') await reset();
    for (const room of mode==='revisit'?[...rooms,...rooms]:rooms) {
      if (mode==='fresh') await reset();
      let aheadWork=null;
      if(mode==='ahead'&&allRooms.indexOf(room)>0&&room!=='reactor-vault'){
        aheadWork=await page.evaluate(async previous=>{
          const d=window.__containmentDebug;await d.gotoRoom(previous,{phase:'reward'});
          const r=d.renderer,start=performance.now(),inventory=r.renderer.info.programs.length;
          for(let i=0;i<1800;i++){
            await new Promise(requestAnimationFrame);
            if(!r.aheadRooms.pending.size&&r.renderer.info.programs.every(p=>!p.program||!p.isReady||p.isReady()))return {previous,ms:performance.now()-start,programsLinked:r.renderer.info.programs.length-inventory};
          }
          throw Error('Background route preparation did not settle');
        },allRooms[allRooms.indexOf(room)-1]);
      }
      const visitingAgain=mode==='revisit'&&report.rows.some(row=>row.mode==='revisit-prime'&&row.room===room);
      if (loadLimit > 0) {
        console.log(execFileSync('uptime', {encoding:'utf8'}).trim());
        while (loadavg()[0] > loadLimit) {
          console.log(`One-minute load above ${loadLimit}. Waiting 15 seconds.`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          console.log(execFileSync('uptime', {encoding:'utf8'}).trim());
        }
      }
      const before = host();
      const row = await page.evaluate(async ({room,mode}) => {
        const d=window.__containmentDebug,r=d.renderer,a=window.__roomAudit;
        a.phases={};a.calls={};a.postReadyCompiles=0;a.ready=false;const inventory=r.renderer.info.programs.length;
        const started=performance.now();await d.gotoRoom(room,room==='reactor-vault'?{version:2}:{});
        const total=performance.now()-started;
        if(r.roomLoading)throw Error('Input released before readiness');
        const phases={...a.phases},calls={...a.calls},postReadyCompiles=a.postReadyCompiles??0;
        const gl=r.renderer.getContext(),create=gl.createProgram;let compiles=0;
        gl.createProgram=function(){compiles++;return create.call(gl);};
        try {d.invulnerable(true);d.setInput({fire:true,autoAim:true,angle:null});d.step(300);}
        finally {gl.createProgram=create;}
        return {room,mode,total,phases,calls,inventoryBefore:inventory,programs:r.renderer.info.programs.length,newPrograms:r.renderer.info.programs.length-inventory,combatCompiles:compiles,postReadyCompiles,postReadyPrograms:postReadyCompiles?r.renderer.info.programs.slice(-postReadyCompiles).map(p=>({name:p.name,key:p.cacheKey})):[],preparation:r.preparationDiagnostics??null,post:r.post.diagnostics??r.post.performanceDiagnostics??null,resources:{...r.renderer.info.memory},gpu:a.gpu};
      },{room,mode:mode==='revisit'&&!visitingAgain?'revisit-prime':mode});
      row.before=before;row.after=host();row.aheadWork=aheadWork;report.rows.push(row);
      assert(!/swiftshader|software|llvmpipe/i.test(row.gpu),'Hardware renderer required');
      if(!baseline && row.postReadyCompiles)report.failures.push({room,mode,metric:'postReadyCompiles',value:row.postReadyCompiles,limit:0});
      if(row.combatCompiles)report.failures.push({room,mode,metric:'combatCompiles',value:row.combatCompiles,limit:0});
      if(!baseline && row.programs>Number(option('max-programs',400)))report.failures.push({room,mode,metric:'programs',value:row.programs,limit:Number(option('max-programs',400))});
      if(!baseline && row.total>Number(option('max-ms',3000)))report.failures.push({room,mode,metric:'preparationMs',value:row.total,limit:Number(option('max-ms',3000))});
      const preparation=row.preparation?.at(-1);
      if(!baseline && preparation?.compilePasses>12)report.failures.push({room,mode,metric:'compilePasses',value:preparation.compilePasses,limit:12});
      if(!baseline && preparation?.materialProfiles>160)report.failures.push({room,mode,metric:'materialProfiles',value:preparation.materialProfiles,limit:160});
      console.log(`${row.mode} ${room} (load1m ${before.load[0].toFixed(2)} → ${row.after.load[0].toFixed(2)}, ${before.cores} cores): ${row.total.toFixed(1)}ms; build ${row.phases.loadRoom?.toFixed(1)} reflection ${row.phases.captureRoomReflections?.toFixed(1)} warm ${row.phases.prepareScene?.toFixed(1)}; programs ${row.programs}; combat compiles ${row.combatCompiles}`);
      await writeFile(resolve(out,'rooms.json'),JSON.stringify(report,null,2));
    }
  }
  console.table(report.rows.map(r=>({mode:r.mode,room:r.room,ms:Math.round(r.total),build:Math.round(r.phases.loadRoom??0),reflection:Math.round(r.phases.captureRoomReflections??0),warm:Math.round(r.phases.prepareScene??0),programs:r.programs,compiles:r.combatCompiles,load:r.before.load[0]})));
  assert.equal(report.errors.length,0,report.errors.join('\n'));
  if(report.failures.length){console.error('Room preparation guardrails:',JSON.stringify(report.failures));process.exitCode=2;}
} catch(error) {report.errors.push(String(error));throw error;}
finally {await writeFile(resolve(out,'rooms.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(ok=>server.close(ok));}
