#!/usr/bin/env node
/** Staged presentation survey, not a test or native campaign. */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import {stitchPngFrames} from './sprites.mjs';
import {L8_CAPTURE_API as api,L8_CAPTURE_ROOMS as rooms} from './l8-capture-data.mjs';
const option=(n,v)=>process.argv.find(a=>a.startsWith(`--${n}=`))?.split('=')[1]??v;
const out=resolve(option('out','artifacts/nextgen/cam12-final/replay')),dist=resolve(option('dist','dist'));
await mkdir(out,{recursive:true});
const assets=await Promise.all((await readdir(resolve(dist,'assets'))).filter(file=>/\.(js|css)$/.test(file)).sort().map(async file=>{const bytes=await readFile(resolve(dist,'assets',file));return {file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}));

const historicalPath=option('source','/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final6/play/breacher/r5-crew-checkpoint-mid.json');
const historicalBytes=await readFile(historicalPath),historical=JSON.parse(historicalBytes);
const report={sourceSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceStatus:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim(),assets,source:historicalPath,sourceSHA256:createHash('sha256').update(historicalBytes).digest('hex'),scope:'Approximate staged historical replay. Saved marine position/aim/weapon and legal surviving enemy positions are reconstructed with native spawn. Native attack phases, damage state and camera smoothing history are not restored. Frozen simulation,120 presentation ticks.',frames:[],errors:[]};
const server=createServer(async(req,res)=>{const path=resolve(dist,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/containment\//,'')||'index.html');if(!path.startsWith(dist+'/'))return res.writeHead(404).end();try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'})[extname(path)]??'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});let browser;
try{
 browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);await page.waitForFunction(()=>!!window.__containmentDebug);
 for(const viewport of [{width:1920,height:1080},{width:1280,height:720}]){
 await page.setViewportSize(viewport);
 const evidence=await page.evaluate(async saved=>{const d=window.__containmentDebug;await d.gotoRoom(saved.node.templateId,{rig:saved.rig});const g=d.game;g.enemies.reset();Object.assign(g.player,{x:saved.player.x,y:saved.player.y,angle:saved.player.angle,vx:0,vy:0});g.switchWeapon(saved.combat.weaponId);d.setInput({x:0,y:0,fire:false,angle:saved.player.angle,autoAim:false});const spawns=saved.enemies.filter(e=>e.health>0).map(e=>({sourceId:e.id,id:d.spawn(e.type,e.x,e.y,e.elite),type:e.type,x:e.x,y:e.y}));d.refresh();d.settlePresentation(120);const c=d.renderer.camera;return {spawns,player:{x:g.player.x,y:g.player.y,angle:g.player.angle},camera:{position:c.position.toArray(),zoom:c.zoom},framing:d.renderer.combatFramingDiagnostics};},historical);
 const file=`crew-historical-${viewport.height}.png`;await page.screenshot({path:resolve(out,file)});report.frames.push({viewport,file,...evidence});
 }
}finally{await browser?.close();server.close();await writeFile(resolve(out,'replay.json'),JSON.stringify(report,null,2));}
