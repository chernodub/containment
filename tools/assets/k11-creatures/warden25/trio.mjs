#!/usr/bin/env node
/** WARDEN25: Brute, elite Brute and Warden side by side from the game camera (no sim stepping), written as colour,
 * greyscale and silhouette at native 1920x1080 and 480x270. Silhouette = actor pixels found by rendering the same frame
 * with and without the three actors (their shadows off), so the room never leaks into the mask.
 * node tools/assets/k11-creatures/warden25/trio.mjs --out=artifacts/nextgen/warden25-trio [--room=crew-checkpoint] [--dist=dist] */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const option=(k,f)=>process.argv.find(x=>x.startsWith(`--${k}=`))?.slice(k.length+3)??f;
const dist=resolve(option('dist','dist')),out=resolve(option('out','artifacts/nextgen/warden25-trio')),room=option('room','crew-checkpoint');
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/^\/containment\//,'')||'index.html';const f=resolve(dist,p);if(!f.startsWith(dist+'/'))return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.wasm':'application/wasm','.ktx2':'image/ktx2'})[extname(f)]??'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);await page.waitForFunction(()=>!!window.__containmentDebug);
 const info=await page.evaluate(async room=>{
  const d=window.__containmentDebug,g=d.game,r=d.renderer;await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
  const b=g.geometry.bounds,cy=b.y+b.height/2;let best;
  for(let y=b.y+120;y<b.y+b.height-120;y+=8)for(let x=b.x+200;x<b.x+b.width-260;x+=8){const pts=[[x,y,45],[x+160,y,58],[x+380,y,64]];if(!pts.every(([px,py,rr])=>d.canStand(px,py,rr)))continue;const s=-Math.hypot(x+165-b.x-b.width/2,y-cy);if(!best||s>best.s)best={x,y,s};}
  if(!best)throw Error('no row');
  Object.assign(g.player,{x:best.x+110,y:best.y+150,vx:0,vy:0,angle:-Math.PI/2});g.setAimPoint({x:best.x+190,y:best.y});d.step(1000);g.enemies.reset();
  const ids=[d.spawn('brute',best.x,best.y,false),d.spawn('brute',best.x+160,best.y,true),d.spawn('brute',best.x+380,best.y,true)];g.enemies.promote(ids[2],'warden');
  d.step(0);d.settlePresentation(120);d.refresh();return{ids,row:best};
 },room);
 let info3d;const shot=()=>page.evaluate(()=>{const d=window.__containmentDebug,ren=d.renderer.renderer;ren.info.autoReset=false;ren.info.reset();d.refresh();const i=ren.info.render;window.__w25info={calls:i.calls,triangles:i.triangles};ren.info.autoReset=true;return d.renderer.canvas.toDataURL('image/png');});
 const colour=await shot();info3d=await page.evaluate(()=>window.__w25info);console.log('frame',JSON.stringify(info3d));
 // isolate the three actors: hide every scene object that is not on an actor's ancestor/descendant chain
 const isolate=async(on)=>page.evaluate(({ids,on})=>{const d=window.__containmentDebug,r=d.renderer,keep=new Set();for(const id of ids){const m=r.actors.get(id);if(!m)continue;m.root.traverse(o=>keep.add(o));for(let o=m.root;o;o=o.parent)keep.add(o);}
  if(on){r.__w25=[];r.scene.traverse(o=>{if(!keep.has(o)&&o.visible&&(o.isMesh||o.isPoints||o.isLine||o.isSprite)){o.visible=false;r.__w25.push(o);}});}else{for(const o of r.__w25)o.visible=true;}d.refresh();return r.canvas.toDataURL('image/png');},{ids:info.ids,on});
 const noShadow=await isolate(true);const empty=await page.evaluate(ids=>{const d=window.__containmentDebug,r=d.renderer;const mats=new Set();for(const id of ids)r.actors.get(id).root.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat())if(m&&m.visible){mats.add(m);}});for(const m of mats)m.visible=false;d.refresh();const u=r.canvas.toDataURL('image/png');for(const m of mats)m.visible=true;return u;},info.ids);await isolate(false);
 const images=await page.evaluate(async({colour,empty,noShadow})=>{
  const load=src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.src=src;});
  const [c,e,n]=await Promise.all([colour,empty,noShadow].map(load));const W=c.width,H=c.height;
  const px=img=>{const cv=new OffscreenCanvas(W,H),x=cv.getContext('2d');x.drawImage(img,0,0);return x.getImageData(0,0,W,H);};
  const C=px(c),E=px(e),N=px(n),G=new ImageData(W,H),S=new ImageData(W,H);
  for(let i=0;i<W*H*4;i+=4){const l=.2126*C.data[i]+.7152*C.data[i+1]+.0722*C.data[i+2];G.data[i]=G.data[i+1]=G.data[i+2]=l;G.data[i+3]=255;
   const diff=Math.abs(N.data[i]-E.data[i])+Math.abs(N.data[i+1]-E.data[i+1])+Math.abs(N.data[i+2]-E.data[i+2]);const v=diff>10?0:235;S.data[i]=S.data[i+1]=S.data[i+2]=v;S.data[i+3]=255;}
  const enc=async(data,w,h)=>{const cv=new OffscreenCanvas(W,H);cv.getContext('2d').putImageData(data,0,0);const o=new OffscreenCanvas(w,h),x=o.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(cv,0,0,w,h);const b=await o.convertToBlob({type:'image/png'});const a=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s);};
  let lum=0,ink=0;for(let i=0;i<W*H*4;i+=4){lum+=G.data[i];if(!S.data[i])ink++;}const res={stats:{meanLuma:+(lum/W/H).toFixed(1),silhouettePx:ink}};for(const [k,d] of [['colour',C],['grey',G],['silhouette',S]]){res[k]=await enc(d,W,H);res[k+'-480']=await enc(d,480,270);}return res;
 },{colour,empty,noShadow});
 console.log(JSON.stringify(images.stats));delete images.stats;for(const [k,v] of Object.entries(images))await writeFile(resolve(out,`trio-${room}-${k}.png`),Buffer.from(v,'base64'));
 const sizes=await page.evaluate(ids=>{const d=window.__containmentDebug,r=d.renderer;return ids.map(id=>{const m=r.actors.get(id);const b={minX:1e9,maxX:-1e9,minZ:1e9,maxZ:-1e9,maxY:-1e9};const p=m.root.position.clone();m.root.updateMatrixWorld(true);m.root.traverseVisible(o=>{if(!o.isSkinnedMesh)return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld);b.minX=Math.min(b.minX,p.x);b.maxX=Math.max(b.maxX,p.x);b.minZ=Math.min(b.minZ,p.z);b.maxZ=Math.max(b.maxZ,p.z);b.maxY=Math.max(b.maxY,p.y);}});return{id,collider:d.game.enemies.getSnapshot(id)?.radius,width:+(b.maxX-b.minX).toFixed(2),depth:+(b.maxZ-b.minZ).toFixed(2),height:+(b.maxY-m.root.position.y).toFixed(2)};});},info.ids);
 await writeFile(resolve(out,'trio.json'),JSON.stringify({room,...info,frame:info3d,sizes,errors},null,1));console.log(JSON.stringify(sizes));
}finally{await browser.close();server.close();}
console.log(`${errors.length} errors; ${out}`);
