#!/usr/bin/env node
/** HEAVY47 probe: stage a capture scenario and report the actor geometry class, region and id
 * (from the resolved geometry attachment) at 480x270 review pixels.
 * node tools/assets/k11-creatures/heavy47/probe.mjs --dist=dist --scenario=heavy47-heavies-swarm-junction-rest --points=263,160;270,142 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import {SCENARIOS} from '../../../../scripts/nextgen/scenarios.mjs';
import {registerHeavy47} from './scenarios.mjs';
registerHeavy47(SCENARIOS);
const option=(k,f)=>process.argv.find(x=>x.startsWith(`--${k}=`))?.slice(k.length+3)??f;
const dist=resolve(option('dist','dist')),scenario=SCENARIOS.find(s=>s.id===option('scenario'));
const points=option('points','').split(';').filter(Boolean).map(p=>p.split(',').map(Number));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.wasm':'application/wasm','.ktx2':'image/ktx2','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/^\/containment\//,'')||'index.html';const f=resolve(dist,p);if(!f.startsWith(dist+'/'))return res.writeHead(404).end();res.setHeader('Content-Type',types[extname(f)]??'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.setDefaultTimeout(180000);
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);await page.waitForFunction(()=>!!window.__containmentDebug);
 await page.evaluate(`(${scenario.setup.toString()})()`);
 const result=await page.evaluate(points=>{
  const d=window.__containmentDebug,r=d.renderer;d.refresh();const t=r.post.resources.scene,W=t.width,H=t.height,g=new Uint8Array(W*H*4);
  r.renderer.readRenderTargetPixels(t,0,0,W,H,g,undefined,1);
  const names=new Map();for(const e of d.game.enemies.snapshot.enemies){const m=r.actors.get(e.id);if(m)names.set(m.root.userData.containmentGeometryId,e.champion??e.type);}
  return points.map(([x,y])=>{const out=[];for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=2;dx++){const px=Math.floor((x+dx/4)*W/480),py=H-1-Math.floor((y+dy/4)*H/270),i=4*(py*W+px);out.push(`${g[i+3]&7}/${g[i+3]>>3}/${names.get(g[i+2])??g[i+2]}`);}return {x,y,samples:[...new Set(out)]};});
 },points);
 for(const p of result)console.log(p.x,p.y,p.samples.join(' '));
}finally{await browser.close();server.close();}
