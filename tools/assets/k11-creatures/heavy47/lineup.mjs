#!/usr/bin/env node
/** HEAVY47 turnaround: four copies of one heavy ringed around a stationary marine, each facing him,
 * so one game-camera frame shows the front, back and both sides. No simulation time passes. Writes the canvas at native size, 480x270 colour and
 * greyscale, and a native close crop per copy. Families: brute, elite, warden, matron.
 * node tools/assets/k11-creatures/heavy47/lineup.mjs --dist=dist --out=artifacts/nextgen/heavy47/now/lineup
 *   [--room=crew-checkpoint] [--families=brute,elite,warden,matron] [--zoom=1.35] */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';
const option=(k,f)=>process.argv.find(x=>x.startsWith(`--${k}=`))?.slice(k.length+3)??f;
const dist=resolve(option('dist','dist')),out=resolve(option('out','artifacts/nextgen/heavy47/now/lineup')),room=option('room','crew-checkpoint');
const families=option('families','brute,elite,warden,matron').split(','),zoom=Number(option('zoom',1.35));
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.wasm':'application/wasm','.ktx2':'image/ktx2','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/^\/containment\//,'')||'index.html';const f=resolve(dist,p);if(!f.startsWith(dist+'/'))return res.writeHead(404).end();res.setHeader('Content-Type',types[extname(f)]??'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
const errors=[],report={room,dist,zoom,families:{}};
const png=url=>Buffer.from(url.split(',')[1],'base64');
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.setDefaultTimeout(180000);
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);await page.waitForFunction(()=>!!window.__containmentDebug);
 for(const family of families){
  const r=await page.evaluate(async({room,family,zoom})=>{
   const d=window.__containmentDebug,g=d.game,ren=d.renderer;await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
   d.setInput({x:0,y:0,fire:false,angle:Math.PI/2,autoAim:false});
   const type=family==='matron'?'carrier':'brute',reach=family==='warden'||family==='matron'?150:112,radius=family==='warden'?64:family==='matron'?52:44;
   const b=g.geometry.bounds,cx=b.x+b.width/2,cy=b.y+b.height/2;let best;
   for(let y=b.y+120;y<b.y+b.height-120;y+=8)for(let x=b.x+120;x<b.x+b.width-120;x+=8){
    if(!d.canStand(x,y,30))continue;if(![0,1,2,3].every(k=>d.canStand(x+Math.cos(k*Math.PI/2)*reach,y+Math.sin(k*Math.PI/2)*reach,radius)))continue;
    const s=-Math.hypot(x-cx,y-cy);if(!best||s>best.s)best={x,y,s};}
   if(!best)throw Error('no ring for '+family);
   Object.assign(g.player,{x:best.x,y:best.y,vx:0,vy:0,angle:Math.PI/2});d.step(600);g.enemies.reset();
   const ids=[0,1,2,3].map(k=>{const id=d.spawn(type,best.x+Math.cos(k*Math.PI/2)*reach,best.y+Math.sin(k*Math.PI/2)*reach,family==='elite');if(id&&(family==='warden'||family==='matron'))g.enemies.promote(id,family);return id;});
   if(ids.some(id=>!id))throw Error('spawn failed for '+family);
   // No simulation time passes: the actors keep their spawn bearing towards the marine and
   // presentation settles the pose (as WARDEN25's trio does).
   for(let t=0;t<Number(window.__h47turn??300);t+=50){d.step(50);for(const e of g.enemies.snapshot.enemies)if(!ids.includes(e.id))g.enemies.remove(e.id);}
   d.settlePresentation(120);
   d.cameraZoom(zoom);d.settlePresentation(10);d.refresh();
   const cam=ren.camera,canvas=ren.canvas;
   const pts=ids.map(id=>{const m=ren.actors.get(id);const v=m.root.position.clone();v.y+=family==='brute'||family==='elite'?.55:.75;v.project(cam);return{id,x:(v.x+1)/2*canvas.width,y:(1-v.y)/2*canvas.height};});
   const enemies=g.enemies.snapshot.enemies.filter(e=>ids.includes(e.id)).map(e=>({id:e.id,x:+e.x.toFixed(1),y:+e.y.toFixed(1),angle:+(e.angle??0).toFixed(3),phase:e.meleePhase??null,champion:e.champion??null,elite:!!e.elite}));
   const url=canvas.toDataURL('image/png');d.cameraZoom(1);return{url,pts,enemies,ring:best};
  },{room,family,zoom});
  const buf=png(r.url);report.families[family]={ring:r.ring,enemies:r.enemies,pts:r.pts};
  await writeFile(resolve(out,`${family}-native.png`),buf);
  await sharp(buf).resize(480,270).png().toFile(resolve(out,`${family}-480.png`));
  await sharp(buf).resize(480,270).grayscale().png().toFile(resolve(out,`${family}-grey-480.png`));
  const half=family==='brute'||family==='elite'?170:230;
  const crops=await Promise.all(r.pts.map(p=>{const left=Math.max(0,Math.min(1920-2*half,Math.round(p.x-half))),top=Math.max(0,Math.min(1080-2*half,Math.round(p.y-half)));return sharp(buf).extract({left,top,width:2*half,height:2*half}).resize(340,340).png().toBuffer();}));
  await sharp({create:{width:1360,height:340,channels:3,background:'#101820'}}).composite(crops.map((input,i)=>({input,left:340*i,top:0}))).png().toFile(resolve(out,`${family}-turnaround.png`));
 }
}finally{await browser.close();server.close();}
report.errors=errors;await writeFile(resolve(out,'lineup.json'),JSON.stringify(report,null,1));
console.log(`${errors.length} errors; ${out}`);if(errors.length)process.exitCode=1;
