#!/usr/bin/env node
/** WARDEN25: can the Warden collider grow? For every story room: standable area and charge lanes at radius 64/80/96
 * (lane = 3 clear samples then a blocked one within 200 units, the i13 wall-bait geometry), plus whether the native
 * opening spawn still finds a point. node tools/assets/k11-creatures/warden25/collider.mjs [--dist=dist] */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const dist=resolve(process.argv.find(x=>x.startsWith('--dist='))?.slice(7)??'dist');
const rooms='awakening-bay passenger-vault residential-gallery communal-atrium crew-checkpoint armory freight-hold breached-loading-bay relay-racks transmission-chamber diagnostic-gallery safety-interlock-station coolant-plant service-shaft-landing infested-workshop swarm-junction shielding-gate containment-annulus manual-control-chamber overload-floor'.split(' ');
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://x').pathname).replace(/^\/containment\//,'')||'index.html';const f=resolve(dist,p);if(!f.startsWith(dist+'/'))return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.wasm':'application/wasm','.ktx2':'image/ktx2'})[extname(f)]??'application/octet-stream');res.end(await readFile(f));}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:960,height:540}});page.setDefaultTimeout(180000);
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);await page.waitForFunction(()=>!!window.__containmentDebug);
 console.log('room              area64 area80 area96 | lanes64 lanes80 lanes96');
 for(const room of rooms){
  const row=await page.evaluate(async room=>{const d=window.__containmentDebug,g=d.game;try{await d.gotoRoom(room,{rig:'breacher'});}catch(e){return null;}g.enemies.reset();
   const b=g.geometry.bounds,out={};
   for(const r of [64,80,96]){let area=0,lanes=0;
    for(let y=b.y+r;y<=b.y+b.height-r;y+=24)for(let x=b.x+r;x<=b.x+b.width-r;x+=24){if(!d.canStand(x,y,r))continue;area++;
     for(let i=0;i<8;i++){const a=i*Math.PI/4,dx=Math.cos(a),dy=Math.sin(a);if([60,100,140].every(t=>d.canStand(x+dx*t,y+dy*t,r))&&!d.canStand(x+dx*200,y+dy*200,r)){lanes++;break;}}}
    out[r]={area,lanes};}
   return out;},room);
  if(!row){console.log(room.padEnd(18),'(not loadable)');continue;}
  console.log(room.padEnd(18),[64,80,96].map(r=>String(row[r].area).padStart(6)).join(' '),'|',[64,80,96].map(r=>String(row[r].lanes).padStart(7)).join(' '));
 }
}finally{await browser.close();server.close();}
