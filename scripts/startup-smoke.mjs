import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,dirname} from 'node:path';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';

// Cold-context production startup measurements, served at the real Pages subpath.
const prefix='/containment/', root=resolve('dist');
const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6)??'artifacts/nextgen/f2-loading.json';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,path.slice(prefix.length)||'index.html');
  if(!path.startsWith(prefix)||!file.startsWith(root+'/'))return res.writeHead(404).end();
  try {res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream'}).end(await readFile(file));}
  catch {res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
const runs=[];
try {
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?undefined:'chromium',executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox',...(process.platform==='darwin'?['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']:[])]});
  for(let run=0;run<5;run++) {
    const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
    const page=await context.newPage();page.setDefaultTimeout(120000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.__startup={};
      const check=()=>{
        const s=window.__startup;
        if(document.body?.dataset.state==='menu'&&!s.titleMs)s.titleMs=performance.now();
        if(document.body?.dataset.state==='playing'&&document.querySelector('#world')?.getAttribute('aria-busy')==='false'&&document.querySelector('#room-loading')?.hidden&&!s.playableMs)s.playableMs=performance.now();
        requestAnimationFrame(check);
      };requestAnimationFrame(check);
    });
    await page.goto(origin+prefix);await page.waitForFunction(()=>window.__startup.titleMs);
    const initial=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script'||e.name.endsWith('.js')).map(e=>new URL(e.name).pathname));
    const scripts=await Promise.all([...new Set(initial)].map(async path=>{const bytes=await readFile(resolve(root,path.slice(prefix.length)));return {path,raw:bytes.length,gzip:gzipSync(bytes).length};}));
    const titleRequests=await page.evaluate(()=>performance.getEntriesByType('resource').length+1);
    await page.locator('#start').click();await page.locator('#equip-rig').click();await page.locator('[data-mutation]').first().click();
    await page.waitForFunction(()=>window.__startup.playableMs);
    const result=await page.evaluate(()=>{
      const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');
      return {...window.__startup,requests:performance.getEntriesByType('resource').length+1,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
    });
    assert.deepEqual(errors,[]);assert.match(result.gpu,/Apple|AMD|NVIDIA|Intel|Metal/i);assert.doesNotMatch(result.gpu,/SwiftShader|llvmpipe/i);
    runs.push({...result,titleRequests,scripts,initialJsRaw:scripts.reduce((n,s)=>n+s.raw,0),initialJsGzip:scripts.reduce((n,s)=>n+s.gzip,0)});
    console.log(`Startup run ${run+1}: title ${result.titleMs.toFixed(0)} ms; playable ${result.playableMs.toFixed(0)} ms; ${result.requests} requests; ${result.gpu}`);
    await context.close();
  }
  const median=key=>runs.map(r=>r[key]).sort((a,b)=>a-b)[2];
  const result={runs,median:Object.fromEntries(['titleMs','playableMs','titleRequests','requests','initialJsRaw','initialJsGzip'].map(k=>[k,median(k)]))};
  await mkdir(dirname(resolve(out)),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.median));
} finally {await browser?.close();await new Promise(ok=>server.close(ok));}
