/** KA12 one-off native weapon art captures. No acceptance gates. */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const delayed=process.argv.includes('--delayed-title');
const out=resolve('artifacts/nextgen/ka12-final/'+(delayed?'delayed-title':'native-weapons')),dist=resolve('dist');
await mkdir(out,{recursive:true});
const report={limitations:['Staged calm room with native enemy reset, invulnerability and native weapon switching/fire; not organic campaign evidence.'],shots:[],errors:[]};
const server=createServer(async(req,res)=>{const p=resolve(dist,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/containment\//,'')||'index.html');try{if(!p.startsWith(dist+'/'))return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.avif':'image/avif','.png':'image/png','.woff2':'font/woff2','.glb':'model/gltf-binary'})[extname(p)]??'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
let browser;
try{
await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
for(const [width,height] of [[1920,1080],[1280,720]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});const page=await context.newPage();page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(e.message));
 if(delayed)await page.route('**/assets/ui/u10/**',route=>{(report.delayedRequests??=[]).push(route.request().url());return new Promise(r=>setTimeout(r,30000)).then(()=>{report.artRequestsReleased=(report.artRequestsReleased??0)+1;return route.continue();}).catch(()=>{});});
 const began=Date.now();
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);
 if(width===1920){
  const keys=[];for(let n=0;n<30;n++){const id=await page.evaluate(()=>document.activeElement?.id);if(id==='start')break;await page.keyboard.press('Tab');keys.push('Tab');}
  await page.keyboard.press('Enter');keys.push('Enter');await page.waitForSelector('[data-rig]');
  if(delayed){report.delayedTitle={delayMs:30000,elapsedToRigMs:Date.now()-began,status:await page.evaluate(()=>window.__containmentDebug.game.status),phase:await page.evaluate(()=>window.__containmentDebug.game.expedition.run.phase),rigCards:await page.locator('[data-rig]').count(),artRequests:report.delayedRequests?.length??0,pendingArtRequests:(report.delayedRequests?.length??0)-(report.artRequestsReleased??0)};await context.close();break;}
  await page.screenshot({path:resolve(out,'keyboard-rig-select.png')});await page.keyboard.press('Digit4');await page.keyboard.press('Enter');keys.push('Digit4','Enter');
  await page.waitForFunction(()=>['playing','reward'].includes(window.__containmentDebug.game.status));
  if(await page.evaluate(()=>window.__containmentDebug.game.status==='reward')){await page.keyboard.press('Digit1');keys.push('Digit1');}
  await page.waitForFunction(()=>window.__containmentDebug.game.status==='playing');report.keyboard={keys,status:await page.evaluate(()=>window.__containmentDebug.game.status)};
 }
 await page.evaluate(async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay',{rig:'breacher'});d.invulnerable(true);d.game.enemies.reset();d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});d.refresh();d.settlePresentation(120);});
 await page.locator('#pause').hover();
 for(const weapon of ['pistol','rifle','shotgun','plasma','rocket']){
  await page.evaluate(w=>{const d=window.__containmentDebug;d.setInput({fire:false});d.game.switchWeapon(w);d.step(400);d.game.enemies.reset();d.game.bullets.length=0;d.renderer.effects.clear();d.refresh();d.settlePresentation(30);},weapon);
  for(const phase of ['calm','fire']){
   const receipt=await page.evaluate(phase=>{const d=window.__containmentDebug,before=d.game.stats.shotsFired;if(phase==='fire'){d.setInput({fire:true,angle:0,autoAim:false});d.step(1000/60);}d.refresh();return{weapon:d.game.combat.snapshot.weaponId,shotsBefore:before,shotsAfter:d.game.stats.shotsFired,status:d.game.status};},phase);
   const file=`${width}-${weapon}-${phase}.png`;await page.screenshot({path:resolve(out,file)});report.shots.push({width,height,weapon,phase,file,...receipt});
  }
 }
 await context.close();
}
}catch(e){report.errors.push(String(e));process.exitCode=1;}finally{await browser?.close();server.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));}
