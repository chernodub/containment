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
assert(rooms.every(r => allRooms.includes(r)), 'Unknown room');
const label = option('label', 'p1-rooms');
assert(/^[\w.-]+$/.test(label));
const out = resolve('artifacts/nextgen', label), dist = resolve(option('dist', 'dist'));
const baseline = args.includes('--baseline');
const host = () => ({at: new Date().toISOString(), load: loadavg(), cores: cpus().length});
const report = {sha: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), dist, baseline, host: host(), rows: [], errors: [], failures: [], notes: ['Fresh page per room; sequential rows retain the same renderer through all rooms, using validated checkpoint routes. Sequential staging is accumulation coverage, not an organic twenty-room campaign.', 'Phases are inclusive and may overlap; total is the complete public gotoRoom readiness hold. Instrumentation exists only in this audit.']};
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
  for (const mode of ['fresh','sequential']) {
    if (mode==='sequential') await reset();
    for (const room of rooms) {
      if (mode==='fresh') await reset();
      const before = host();
      const row = await page.evaluate(async ({room,mode}) => {
        const d=window.__containmentDebug,r=d.renderer,a=window.__roomAudit;
        a.phases={};a.calls={};const inventory=r.renderer.info.programs.length;
        const started=performance.now();await d.gotoRoom(room,room==='reactor-vault'?{version:2}:{});
        const total=performance.now()-started;
        if(r.roomLoading)throw Error('Input released before readiness');
        const phases={...a.phases},calls={...a.calls};
        const gl=r.renderer.getContext(),create=gl.createProgram;let compiles=0;
        gl.createProgram=function(){compiles++;return create.call(gl);};
        try {d.invulnerable(true);d.setInput({fire:true,autoAim:true,angle:null});d.step(300);}
        finally {gl.createProgram=create;}
        return {room,mode,total,phases,calls,inventoryBefore:inventory,programs:r.renderer.info.programs.length,newPrograms:r.renderer.info.programs.length-inventory,combatCompiles:compiles,preparation:r.preparationDiagnostics??null,resources:{...r.renderer.info.memory},gpu:a.gpu};
      },{room,mode});
      row.before=before;row.after=host();report.rows.push(row);
      assert(!/swiftshader|software|llvmpipe/i.test(row.gpu),'Hardware renderer required');
      if(row.combatCompiles)report.failures.push({room,mode,metric:'combatCompiles',value:row.combatCompiles,limit:0});
      if(!baseline && row.programs>Number(option('max-programs',400)))report.failures.push({room,mode,metric:'programs',value:row.programs,limit:Number(option('max-programs',400))});
      if(!baseline && row.total>Number(option('max-ms',3000)))report.failures.push({room,mode,metric:'preparationMs',value:row.total,limit:Number(option('max-ms',3000))});
      const preparation=row.preparation?.at(-1);
      if(!baseline && preparation?.compilePasses>12)report.failures.push({room,mode,metric:'compilePasses',value:preparation.compilePasses,limit:12});
      if(!baseline && preparation?.materialProfiles>160)report.failures.push({room,mode,metric:'materialProfiles',value:preparation.materialProfiles,limit:160});
      console.log(`${mode} ${room}: ${row.total.toFixed(1)}ms; build ${row.phases.loadRoom?.toFixed(1)} reflection ${row.phases.captureRoomReflections?.toFixed(1)} warm ${row.phases.prepareScene?.toFixed(1)}; programs ${row.programs}; combat compiles ${row.combatCompiles}`);
      await writeFile(resolve(out,'rooms.json'),JSON.stringify(report,null,2));
    }
  }
  console.table(report.rows.map(r=>({mode:r.mode,room:r.room,ms:Math.round(r.total),build:Math.round(r.phases.loadRoom??0),reflection:Math.round(r.phases.captureRoomReflections??0),warm:Math.round(r.phases.prepareScene??0),programs:r.programs,compiles:r.combatCompiles,load:r.before.load[0]})));
  assert.equal(report.errors.length,0,report.errors.join('\n'));
  if(report.failures.length){console.error('Room preparation guardrails:',JSON.stringify(report.failures));process.exitCode=2;}
} catch(error) {report.errors.push(String(error));throw error;}
finally {await writeFile(resolve(out,'rooms.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(ok=>server.close(ok));}
