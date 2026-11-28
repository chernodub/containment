#!/usr/bin/env node
/** HEAVY46: heavy walk studies from the game camera with the native simulation clock.
 * One actor walks towards a stationary marine past a fixed screen window (the deck stays put,
 * so its seams are the reference), then a pack of three walks in the same room.
 * Writes native crops, 4x2 strips and 480x270 colour/greyscale pack frames.
 * node tools/assets/k11-creatures/heavy46/study.mjs --dist=dist --out=artifacts/nextgen/heavy46/now [--room=crew-checkpoint] [--subjects=brute,elite,warden,pack] */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium} from 'playwright';
const option=(k,f)=>process.argv.find(x=>x.startsWith(`--${k}=`))?.slice(k.length+3)??f;
const dist=resolve(option('dist','dist')),out=resolve(option('out','artifacts/nextgen/heavy46/now')),room=option('room','crew-checkpoint');
const subjects=option('subjects','brute,elite,warden,pack').split(','),frames=Number(option('frames',8)),stepMs=Number(option('step-ms',80));
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.wasm':'application/wasm','.ktx2':'image/ktx2','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/^\/containment\//,'')||'index.html';const f=resolve(dist,p);if(!f.startsWith(dist+'/'))return res.writeHead(404).end();res.setHeader('Content-Type',types[extname(f)]??'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
const errors=[],report={room,dist,frames,stepMs,subjects:{}};
const png=url=>Buffer.from(url.split(',')[1],'base64');
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);await page.waitForFunction(()=>!!window.__containmentDebug);
 for(const subject of subjects){
  const setup=await page.evaluate(async({room,subject})=>{
   const d=window.__containmentDebug,g=d.game;await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();d.setInput({x:0,y:0,fire:false,angle:Math.PI,autoAim:false});
   const b=g.geometry.bounds,cy=b.y+b.height/2;let best;
   for(let y=b.y+140;y<b.y+b.height-140;y+=8)for(let x=b.x+120;x<b.x+b.width-700;x+=8){
    const pts=[];for(let k=0;k<=(subject==='pack'?420:640);k+=40)for(const dy of subject==='pack'?[-80,0,80]:[0])pts.push([x+k,y+dy,subject==='warden'?64:subject==='pack'?28:40]);
    if(!pts.every(([px,py,rr])=>d.canStand(px,py,rr)))continue;const s=-Math.hypot(x+320-b.x-b.width/2,y-cy);if(!best||s>best.s)best={x,y,s};}
   if(!best)throw Error('no lane');
   Object.assign(g.player,{x:best.x,y:best.y,vx:0,vy:0,angle:0});g.setAimPoint({x:best.x+300,y:best.y});d.step(600);g.enemies.reset();
   const ids=subject==='pack'?[[330,-80],[380,0],[320,85]].map(([dx,dy])=>d.spawn('brute',best.x+dx,best.y+dy,false))
    :[d.spawn('brute',best.x+(subject==='warden'?400:360),best.y,subject!=='brute')];
   if(subject==='warden')g.enemies.promote(ids[0],'warden');
   d.step(subject==='warden'?700:600);
   const scales=ids.map(id=>{const m=d.renderer.actors.get(id);let bone;m.root.traverse(o=>{if(!bone&&o.isBone&&o.name==='chest')bone=o;});const arm=bone?.parent;if(!arm)return null;arm.updateWorldMatrix(true,false);const e=arm.matrixWorld.elements;const len=(i)=>Math.hypot(e[i],e[i+1],e[i+2]);return{armX:+len(0).toFixed(4),armY:+len(4).toFixed(4),armZ:+len(8).toFixed(4)};});
   return{ids,lane:best,scales};
  },{room,subject});
  const shots=[],positions=[];
  for(let f=0;f<frames;f++){
   const r=await page.evaluate(({ids,stepMs,first})=>{const d=window.__containmentDebug,r=d.renderer;if(!first)d.step(stepMs);else d.refresh();
    const cam=r.camera,canvas=r.canvas;const pts=ids.map(id=>{const m=r.actors.get(id);if(!m)return null;const v=m.root.position.clone();v.project(cam);return{x:(v.x+1)/2*canvas.clientWidth,y:(1-v.y)/2*canvas.clientHeight,h:m.height??0};});
    return{url:canvas.toDataURL('image/png'),pts,enemies:d.game.enemies.snapshot.enemies.filter(e=>ids.includes(e.id)).map(e=>({x:+e.x.toFixed(1),y:+e.y.toFixed(1),phase:e.meleePhase??null}))};},{ids:setup.ids,stepMs,first:f===0});
   shots.push(png(r.url));positions.push(r);
  }
  const dir=resolve(out,subject);await mkdir(dir,{recursive:true});
  await sharp(shots[0]).resize(960,540).png().toFile(resolve(dir,"full-0-960.png"));
  report.subjects[subject]={lane:setup.lane,scales:setup.scales,frames:positions.map(p=>({pts:p.pts,enemies:p.enemies}))};
  if(subject==='pack'){
   const tiles=[];for(const [i,buf] of shots.entries()){
    const c=await sharp(buf).resize(480,270).png().toBuffer(),gy=await sharp(buf).resize(480,270).grayscale().png().toBuffer();
    await writeFile(resolve(dir,`pack-${i}-480.png`),c);await writeFile(resolve(dir,`pack-${i}-grey-480.png`),gy);tiles.push([c,gy]);
    if(i===0||i===frames-1)await writeFile(resolve(dir,`pack-${i}-native.png`),buf);
   }
   const pick=tiles.filter((_,i)=>i%2===0);
   await sharp({create:{width:480*pick.length,height:540,channels:3,background:'#101820'}}).composite(pick.flatMap(([c,gy],i)=>[{input:c,left:480*i,top:0},{input:gy,left:480*i,top:270}])).png().toFile(resolve(out,'pack-strip-480.png'));
  }else{
   const xs=positions.flatMap(p=>p.pts.filter(Boolean).map(q=>q.x)),ys=positions.flatMap(p=>p.pts.filter(Boolean).map(q=>q.y));
   const w=subject==='warden'?620:440,h=subject==='warden'?460:360;
   const cx=Math.round((Math.min(...xs)+Math.max(...xs))/2),cy=Math.round(Math.max(...ys)-h*.55);
   const left=Math.max(0,Math.min(1920-w,cx-w/2)),top=Math.max(0,Math.min(1080-h,cy));
   const crops=[];for(const [i,buf] of shots.entries()){const c=await sharp(buf).extract({left,top,width:w,height:h}).png().toBuffer();crops.push(c);await writeFile(resolve(dir,`frame-${i}.png`),c);}
   // A fixed vertical tick (top and bottom edges) marks the same deck column in every frame.
   const tick=Buffer.from(`<svg width="${w}" height="${h}"><rect x="${w/2-1}" y="0" width="2" height="14" fill="#ffd34d"/><rect x="${w/2-1}" y="${h-14}" width="2" height="14" fill="#ffd34d"/></svg>`);
   const marked=await Promise.all(crops.map(c=>sharp(c).composite([{input:tick}]).png().toBuffer()));
   await sharp({create:{width:w*4,height:h*2,channels:3,background:'#101820'}}).composite(marked.map((c,i)=>({input:c,left:w*(i%4),top:h*Math.floor(i/4)}))).png().toFile(resolve(out,`${subject}-strip-native.png`));
   await sharp(resolve(out,`${subject}-strip-native.png`)).resize(Math.round(w*4/2),Math.round(h)).png().toFile(resolve(out,`${subject}-strip-half.png`));
   report.subjects[subject].crop={left,top,w,h};
  }
 }
}finally{await browser.close();server.close();}
report.errors=errors;await writeFile(resolve(out,'study-'+subjects.join('-')+'.json'),JSON.stringify(report,null,1));
console.log(`${errors.length} errors; ${out}`);
