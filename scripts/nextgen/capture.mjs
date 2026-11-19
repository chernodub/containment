#!/usr/bin/env node
import {advanceRoomTour,assertRoomTour} from './e9-room-tour.mjs';
import {assertNativeWarning} from './capture-warning-contract.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat,readdir} from 'node:fs/promises';
import {resolve,extname,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {SCENARIOS,DEFAULT_ROOMS,stageCombat,stageKiting,advanceKiting,inspectFrame} from './scenarios.mjs';
import {samplePng} from './png.mjs';
import {assertPriorityPair} from './i10-framing-contract.mjs';
import {assertCaptureCanvas} from './capture-canvas.mjs';
import {assertKitingMovement} from './capture-movement.mjs';
import {assertPlayingMarine} from './capture-marine-contract.mjs';
import {configureCaptureGraphics} from './capture-graphics.mjs';
import {inspectI10ArmoryReplay} from './i10-armory-replay.mjs';
import {inspectV7Placement} from './v7-placement-scenarios.mjs';
import {stitchPngFrames} from './sprites.mjs';
import {compareGalleries} from './gallery.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');process.chdir(root);
const args=process.argv.slice(2),flags=new Set(['build','headed','keep-going','help','scaffold','failure-evidence','canvas-only']);
const known=new Set([...flags,'label','scenarios','rooms','burst','width','height','dpr','timestamp','seed','compare','step-ms','sprite-width','dist','dist-source-sha','graphics','style','hud-insets','kiting-retries']);
for(const arg of args){assert(arg.startsWith('--')&&known.has(arg.slice(2).split('=')[0]),`Unknown option ${arg}`);assert(arg.includes('=')||flags.has(arg.slice(2)),`Use --name=value: ${arg}`);}
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const integer=(name,fallback,min,max)=>{const n=Number(option(name,fallback));assert(Number.isInteger(n)&&n>=min&&n<=max,`--${name} must be ${min}..${max}`);return n;};
if(args.includes('--help')){console.log('npm run capture -- --label=baseline --scenarios=all [--rooms=id,id] [--burst=4 --step-ms=150 --sprite-width=960] [--compare=labelA,labelB] [--width=1920 --height=1080 --dpr=1] [--build] [--headed] [--canvas-only] [--keep-going] [--timestamp=ISO] [--seed=1729]\nSee scripts/nextgen/README.md');process.exit(0);}
const comparison=option('compare','');
const label=option('label',comparison?'comparison-'+comparison.replaceAll(',','-'):'baseline');assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label),'Unsafe label');
const viewport={width:integer('width',1920,640,7680),height:integer('height',1080,360,4320)},dpr=Number(option('dpr',1));assert(dpr>=.5&&dpr<=4,'--dpr must be .5..4');
const burst=integer('burst',4,1,30),seed=integer('seed',1729,0,0xffffffff),keepGoing=args.includes('--keep-going');
const kitingRetries=integer('kiting-retries',0,0,32);
const style=option('style','bold');assert(['subtle','medium','bold'].includes(style),'Invalid --style strength');
const graphics=JSON.parse(option('graphics','{}'));assert(graphics&&typeof graphics==='object'&&!Array.isArray(graphics),'--graphics requires an options JSON object');
const hudInsets=JSON.parse(option('hud-insets','null'));if(hudInsets!==null){assert(hudInsets&&typeof hudInsets==='object'&&!Array.isArray(hudInsets),'--hud-insets requires an object');assert(['top','right','bottom','left'].every(key=>Number.isFinite(hudInsets[key])&&hudInsets[key]>=0),'HUD insets require four finite nonnegative CSS-pixel values');}
const rooms=option('rooms',DEFAULT_ROOMS.join(',')).split(',');assert(rooms.length&&rooms.every(id=>/^[a-z0-9-]+$/.test(id)),'Invalid room list');
const selection=option('scenarios','all').split(','),requested=selection.includes('all')?SCENARIOS.filter(s=>!s.diagnosticOnly).map(s=>s.id):selection;
const scenarios=requested.flatMap(item=>{const direct=SCENARIOS.find(s=>s.id===item);if(direct&&!direct.rooms)return [{...direct}];const [id,room,...extra]=item.split(':'),entry=SCENARIOS.find(s=>s.id===id);assert(entry&&!extra.length&&(!room||entry.rooms),`Unknown scenario ${item}`);return entry.rooms?(room?[{...entry,room}]:rooms.map(room=>({...entry,room}))):[{...entry}];});
const out=resolve('artifacts/nextgen',label);
if(comparison){const result=await compareGalleries(resolve('artifacts/nextgen'),comparison.split(','),out);console.log(`${result.pairs} aligned views (missing counterparts labelled)\n${result.file}`);process.exit(0);}
const stepMs=integer('step-ms',150,1,1000),spriteWidth=integer('sprite-width',960,160,1920);
const prefix='/containment/',dist=resolve(option('dist','dist'));
const timestamp=option('timestamp',new Date().toISOString());assert(Number.isFinite(Date.parse(timestamp)),'Invalid --timestamp');
const canvasOnly=args.includes('--canvas-only');
const manifest={canvasOnly,hudInsets,graphicStrength:style,graphicsOverrides:graphics,gitSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),timestamp,label,seed,viewport,deviceScaleFactor:dpr,burstStepMs:stepMs,shots:[],sprites:[],failures:[],errors:[],fontFallbacks:[],gpuAttempts:[],runtimeSeconds:0,note:'Production game, per-shot High/Low tiers. Fixed-step captures include idle RAF/screenshot overhead; i2 kitingProof separately records live normal-loop samples.'};
let browser,context,server,page;const started=performance.now();
async function latest(path){let result=0;for(const entry of await readdir(path,{withFileTypes:true})){const p=resolve(path,entry.name);result=Math.max(result,entry.isDirectory()?await latest(p):(await stat(p)).mtimeMs);}return result;}
async function buildIfNeeded(){if(option('dist','')){await stat(resolve(dist,'index.html'));manifest.distSnapshot={path:dist,sourceSHA:option('dist-source-sha','unrecorded')};return;}let built=0;try{built=(await stat(resolve(dist,'index.html'))).mtimeMs;}catch{}const source=Math.max(...await Promise.all(['src','public','scripts/nextgen'].map(latest)),...await Promise.all(['package.json','package-lock.json','vite.config.ts','tsconfig.json','index.html'].map(async p=>(await stat(p)).mtimeMs)));if(args.includes('--build')||built<source){console.log('Building production dist/…');await new Promise((ok,fail)=>{const p=spawn('npm',['run','build'],{stdio:'inherit'});p.on('error',fail);p.on('exit',code=>code===0?ok():fail(Error(`Production build failed (${code})`)));});}}
async function launch(){
 const metal=process.platform==='darwin'?'metal':'gl';
 const modes=[{name:`hardware-${metal}`,args:[`--use-angle=${metal}`,'--enable-gpu','--ignore-gpu-blocklist']},{name:'hardware-default',args:['--enable-gpu','--ignore-gpu-blocklist']},{name:'software-fallback',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}];
 for(const mode of modes){let candidate;try{
  const options={headless:!args.includes('--headed'),args:['--no-sandbox',...mode.args],timeout:45000};
  if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;else options.channel='chromium'; // full Chromium, not headless-shell
  try{candidate=await chromium.launch(options);}catch(error){if(!/Executable doesn't exist/.test(String(error)))throw error;console.log('Installing full Chromium for GPU capture…');execFileSync('npx',['playwright','install','chromium'],{stdio:'inherit',timeout:180000});candidate=await chromium.launch(options);}
  const probe=await candidate.newPage(),renderer=await probe.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2');if(!gl)throw Error('WebGL2 unavailable');const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});await probe.close();
  const software=/swiftshader|llvmpipe|software/i.test(renderer),unverified=/^WebKit WebGL$|^WebGL/.test(renderer);manifest.gpuAttempts.push({mode:mode.name,renderer,software});
  if(mode.name!=='software-fallback'&&(software||unverified)){await candidate.close();continue;}
  manifest.renderer=renderer;manifest.hardwareAccelerated=!software&&!unverified;manifest.launch={...options,mode:mode.name};console.log(`WebGL2: ${renderer}`);return candidate;
 }catch(error){manifest.gpuAttempts.push({mode:mode.name,error:String(error)});await candidate?.close();}}
 throw Error('No usable WebGL2 renderer. Try --headed or PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.');
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Opt-in fixture search, never a campaign retry or a changed visibility gate. */
async function stageKitingBurst(frames){
 const attempts=[];let next=0,chosen=null;
 for(let trial=0;trial<kitingRetries&&next<32;trial++){
  await page.evaluate(seed=>window.__captureSeed(seed),seed);
  const staged=await page.evaluate(stageKiting,next),counts=[];
  for(let frame=0;frame<frames;frame++){
   await page.evaluate(advanceKiting,{frame,stepMs});
   const count=await page.evaluate(()=>{const d=window.__containmentDebug;d.refresh();return d.game.enemies.snapshot.enemies.filter(e=>e.health>0&&d.renderer.visible(e.x,e.y)).length;});
   counts.push(count);if(count<12)break;
  }
  attempts.push({laneAttempt:staged.laneAttempt,player:staged.player,counts});
  if(counts.length===frames&&counts.every(count=>count>=12)){chosen=staged;break;}
  next=staged.laneAttempt+1;
 }
 assert(chosen,`No native kiting burst retained twelve visible threats: ${JSON.stringify(attempts)}`);
 // Recreate the chosen real room/rig and its ordinary public ability/input
 // sequence; the capture still executes and asserts every phase independently.
 await page.evaluate(async()=>{const d=window.__containmentDebug,g=d.game;await d.gotoRoom(g.node.templateId,{version:g.expedition.run.version,rig:'cryo'});});
 await page.evaluate(seed=>window.__captureSeed(seed),seed);
 const replay=await page.evaluate(stageKiting,chosen.laneAttempt);
 assert.equal(replay.laneAttempt,chosen.laneAttempt,'Native lane replay changed the validated attempt');
 assert.deepEqual(replay.player,chosen.player,'Native lane replay changed the legal marine origin');
 return{...replay,preflight:{frames,stepMs,attempts,method:'Real native four-phase fixture search, then fresh room replay; all original capture assertions remain.'}};
}
async function save(){
 await writeFile(resolve(out,'pngs.txt'),[...manifest.shots,...manifest.sprites].map(s=>resolve(out,s.file)).join('\n')+'\n');
 manifest.runtimeSeconds=Number(((performance.now()-started)/1000).toFixed(2));
 await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 // Large room matrices exceed V8's string limit when every PNG is embedded.
 const pngBytes=(await Promise.all([...manifest.shots,...manifest.sprites].map(async s=>(await stat(resolve(out,s.file))).size))).reduce((sum,size)=>sum+size,0);
 const linked=pngBytes>64*1024*1024;
 manifest.galleryMode=linked?'file-linked':'embedded';
 await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const spriteCards=await Promise.all(manifest.sprites.map(async s=>`<figure><img src="${linked?encodeURIComponent(s.file):'data:image/png;base64,'+(await readFile(resolve(out,s.file))).toString('base64')}" alt="${escape(s.file)}" loading="lazy"><figcaption><b>${escape(s.file)}</b><br>${s.frames} fixed-step frames · ${s.stepMs} ms spacing · read left to right, top to bottom</figcaption></figure>`));
 const cards=await Promise.all(manifest.shots.map(async s=>{const data=linked?encodeURIComponent(s.file):'data:image/png;base64,'+(await readFile(resolve(out,s.file))).toString('base64');return `<figure><a href="#${escape(s.file)}" target="_blank"><img src="${data}" alt="${escape(s.file)}" loading="lazy"></a><figcaption><b>${escape(s.file)}</b><br>${s.evidence.visibleEnemies} visible enemies · ${s.evidence.playerBullets} player projectiles · ${s.performance.drawCalls} draws · ${s.performance.triangles.toLocaleString()} triangles</figcaption></figure>`;}));
 await writeFile(resolve(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Containment — ${escape(label)}</title><style>body{margin:0;background:#0c1015;color:#dbe7ee;font:15px system-ui}header{padding:24px 28px}h1{margin:0 0 10px}p{max-width:1100px;line-height:1.5;color:#9eafbd}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:18px;padding:0 24px 24px}figure{margin:0;background:#17202a;border:1px solid #34404c;border-radius:6px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:12px;line-height:1.6}.failure{color:#ffab9b}</style><header><h1>Containment / ${escape(label)}</h1><p>${escape(timestamp)} · ${escape(manifest.gitSHA)}<br>${escape(manifest.renderer??'No renderer')} · ${viewport.width}×${viewport.height} @ ${dpr} · Per-shot graphics tier<br>${escape(manifest.note)}<br>${manifest.shots.length} shots · ${manifest.runtimeSeconds}s</p>${manifest.failures.map(f=>`<p class="failure">${escape(f.scenario)} ${escape(f.room??'')}: ${escape(f.error)}</p>`).join('')}</header><main class="grid">${spriteCards.join('')}${cards.join('')}</main><script>document.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();const w=open('about:blank','_blank');if(w){w.document.title=a.querySelector('img').alt;w.document.body.style='margin:0;background:#080b10';const i=w.document.createElement('img');i.src=a.querySelector('img').src;i.style='max-width:100%;height:auto';w.document.body.append(i);}})</script></html>`);
}
/** Measure computed foreground/backing and inherited opacity, never screenshot colors. */
function criticalContrast() {
 const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=rgb=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 return [...document.querySelectorAll('[data-hud-critical],[data-obscures-threat=true] [data-ability][data-state=ready] .ability-icon')].filter(n=>n.getClientRects().length&&(n.textContent.trim()||n.matches('.ability-icon'))).map(n=>{
  const style=getComputedStyle(n),fg=rgb(style.color),bg=rgb(style.backgroundColor),a=lum(fg),b=lum(bg);
  let opacity=1;for(let node=n;node;node=node.parentElement)opacity*=Number(getComputedStyle(node).opacity);
  return {name:n.id||n.textContent.trim()||`${n.closest('[data-ability]').dataset.ability} ready glyph`,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),backingAlpha:bg[3]??1,opacity,faded:n.closest('[data-obscures-threat=true]')!==null};
 });
}
function installDrawAudit(){
    const d=window.__containmentDebug,r=d.renderer,gl=r.renderer.getContext(),render=r.renderer.render;d.drawErrors=[];
    const direct=r.renderer.renderBufferDirect;
    r.renderer.renderBufferDirect=function(camera,scene,geometry,material,object,group){const result=direct.call(this,camera,scene,geometry,material,object,group),error=gl.getError();if(error&&error!==gl.CONTEXT_LOST_WEBGL)d.drawErrors.push({when:'draw',error,object:object.name,parent:object.parent?.name,material:material.name,type:material.type,key:material.customProgramCacheKey(),target:r.renderer.getRenderTarget()?.texture.name});return result;};
    r.renderer.render=function(scene,camera){const before=gl.getError();if(before&&before!==gl.CONTEXT_LOST_WEBGL)d.drawErrors.push({when:'before',error:before,stack:new Error().stack});const result=render.call(this,scene,camera),error=gl.getError();if(error&&error!==gl.CONTEXT_LOST_WEBGL)d.drawErrors.push({when:'after',error,scene:scene===r.scene?'world':scene===r.hudScene?'hud':scene.children[0]?.material?.name,stack:new Error().stack});return result;};
   }
try{
 await mkdir(out,{recursive:true});await buildIfNeeded();
 const assets=(await readdir(resolve(dist,'assets'))).filter(file=>/\.(js|css)$/.test(file));
 manifest.appAssets=Object.fromEntries(await Promise.all(assets.map(async file=>[file,createHash('sha256').update(await readFile(resolve(dist,'assets',file))).digest('hex')])));
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.woff2':'font/woff2'};
 server=createServer(async(req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(dist,path.slice(prefix.length)||'index.html');if(!path.startsWith(prefix)||!file.startsWith(dist+'/')){res.writeHead(404).end();return;}try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end();}});
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await launch();context=await browser.newContext({viewport,deviceScaleFactor:dpr});
 await context.addInitScript(value=>{let s=value;window.__captureSeed=n=>{s=n>>>0;};Math.random=()=>{s=(s+0x6d2b79f5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};},seed);
 // Font dependencies must be local; a CDN request is a regression, not a fallback.
 for(const host of ['fonts.googleapis.com','fonts.gstatic.com'])await context.route(`https://${host}/**`,async route=>{
  manifest.errors.push({type:'font',message:`External font request: ${route.request().url()}`});
  await route.abort('blockedbyclient');
 });
 page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',error=>manifest.errors.push({type:'pageerror',message:error.message}));
 page.on('console',message=>{if(message.type()==='error')manifest.errors.push({type:'console',message:message.text()});});
 page.on('response',response=>{if(response.url().startsWith(origin)&&response.status()>=400)manifest.errors.push({type:'http',message:`${response.status()} ${response.url()}`});});
 page.on('requestfailed',request=>{if(request.url().startsWith(origin))manifest.errors.push({type:'request',message:`${request.url()} ${request.failure()?.errorText}`});});
 await page.goto(origin+prefix+'?debug=1&seed='+seed);await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);manifest.fonts=await page.evaluate(()=>[...document.fonts].map(f=>({family:f.family,status:f.status,weight:f.weight})));
 assert.equal(manifest.errors.length,0,JSON.stringify(manifest.errors));
 let scenarioIndex=0;
 for(const scenario of scenarios){
  const name=scenario.id.replaceAll(':','-')+(scenario.room?`-${scenario.room}`:'');console.log(`Capturing ${name}…`);const errorStart=manifest.errors.length;let lastEvidence=null,lastCamera=null;
  try{
   // Leave combat before navigation: blur would otherwise start a lazy pause
   // chunk during unload. Settle pending modules without ignoring failed requests.
   // Reload isolates renderer animation time, effect pools, caches, and random state.
   if(scenario.resetPreferences)await page.evaluate(keys=>{for(const key of keys)localStorage.removeItem(key);},scenario.resetPreferences);
   if(scenarioIndex++||scenario.resetPreferences){await page.evaluate(async()=>{const d=window.__containmentDebug;document.querySelector('#difficulty-back')?.click();await d.renderer.finishRoomPrefetch?.();d.game.menu();d.refresh();});await page.waitForSelector('.title-key-art');await page.evaluate(()=>Promise.all([...document.querySelectorAll('.title-key-art img')].map(image=>image.decode())));await page.waitForLoadState('networkidle');await page.reload();await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);}
   await page.emulateMedia({reducedMotion:scenario.reducedMotion?'reduce':'no-preference'});
   if(scenario.auditGraphics)await page.evaluate(installDrawAudit);
   await page.evaluate(seed=>{window.__captureSeed(seed);},seed);
   await page.evaluate(configureCaptureGraphics,graphics);
   // Let the lazy title artwork finish before setup leaves the menu.
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.waitForSelector('.title-key-art');
   await page.evaluate(()=>Promise.all([...document.querySelectorAll('.title-key-art img')].map(image=>image.decode())));
   await page.waitForLoadState('networkidle');
   await page.evaluate(scenario.setup,scenario.setupArgument??scenario.room);
   await page.evaluate(strength=>{window.__containmentDebug.renderer.post.setStyleStrength(strength);window.__containmentDebug.refresh();},style);
   if(scenario.reloadAfterSetup){await page.reload();await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);if(scenario.auditGraphics)await page.evaluate(installDrawAudit);await page.evaluate(scenario.afterReload);}
   if(scenario.nativeKeys){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));for(const [key,ms]of scenario.nativeKeys){await page.keyboard.press(key);await page.evaluate(ms=>window.__containmentDebug.step(ms),ms);}}
   // Asset warm-up may consume random values asynchronously. Restart the visual
   // stream only after room preparation, before synchronous combat/VFX staging.
   await page.evaluate(seed=>window.__captureSeed(seed),seed);
   let staging;if(scenario.combat)staging=await page.evaluate(stageCombat,{status:!!scenario.status});
   if(scenario.combat&&scenario.textureWeapon)await page.evaluate(weapon=>{const d=window.__containmentDebug,g=d.game;g.switchWeapon(weapon);if(g.combat.snapshot.weaponId!==weapon)throw Error('Texture review weapon selection failed');const shots=g.stats.shotsFired;for(let frame=0;frame<120;frame++){d.step(1000/60);if(g.stats.shotsFired>shots&&d.renderer.muzzle.intensity>0&&g.bullets.some(b=>b.kind==='player'))break;}if(g.stats.shotsFired===shots)throw Error('Texture review weapon never fired');d.refresh();},scenario.textureWeapon);
   if(scenario.kiting)staging=kitingRetries?await stageKitingBurst(scenario.burst?burst:1):await page.evaluate(stageKiting);
   if(hudInsets)await page.evaluate(insets=>{const d=window.__containmentDebug;if(typeof d.renderer.setHudInsets!=='function')throw Error('Frozen renderer has no setHudInsets API');d.renderer.setHudInsets(insets);d.refresh();},hudInsets);
   await page.waitForFunction(()=>!window.__containmentDebug.renderer.roomLoading&&document.querySelector('#world').getAttribute('aria-busy')!=='true');
   // A terminal game snapshot can precede its lazy DOM commit. Inspect only
   // the matching screen; screenshot() previously settled this after inspection.
   if(scenario.state==='complete'||scenario.state==='dead') {
    await page.waitForFunction(state=>document.body.dataset.state===state&&document.querySelector(`.debrief-panel[data-outcome="${state}"]`),scenario.state);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   }
   if(scenario.i11NativePointer){
    const point=await page.evaluate(()=>window.__containmentDebug.i11NativePointer);
    assert(point&&Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.x>=0&&point.x<viewport.width&&point.y>=0&&point.y<viewport.height,`${name}: native pool cursor is outside the viewport`);
    await page.mouse.move(point.x,point.y);
    await page.evaluate(()=>{window.__containmentDebug.refresh();window.__containmentDebug.refresh();});
   }else if(scenario.v7Placement){
    const point=await page.evaluate(()=>window.__containmentDebug.v7PlacementPointer);
    assert(point&&Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.x>=0&&point.x<viewport.width&&point.y>=0&&point.y<viewport.height,`${name}: native placement cursor is outside the viewport`);
    await page.mouse.move(point.x,point.y);
    await page.evaluate(()=>{window.__containmentDebug.refresh();window.__containmentDebug.refresh();});
   }else if(scenario.nativePointerHover){
    // A real desktop pointer leaving the canvas lets the normal HUD retire its
    // idle power-placement preview. No ability mesh or simulation is masked.
    await page.locator(scenario.nativePointerHover).hover();
    const pointerProof=await page.evaluate(selector=>{const d=window.__containmentDebug;d.refresh();d.refresh();const mesh=d.renderer.scene.getObjectByName('ability-placement-preview');return d.l8PointerProof={selector,method:'native pointer hover on existing HUD control',previewCount:mesh?.count??0};},scenario.nativePointerHover);
    assert.equal(pointerProof.previewCount,0,`${name}: native HUD hover did not clear idle ability preview`);
   }else if(scenario.state==='playing')await page.mouse.move(Math.round(viewport.width*.64),Math.round(viewport.height*.48));else await page.mouse.move(4,4);
   if(scenario.nativeFocus)await page.locator(scenario.nativeFocus).first().focus();
   for(const key of scenario.nativeHold??[])await page.keyboard.down(key);
   if(scenario.nativeHold?.length)await page.evaluate(()=>window.__containmentDebug.refresh());
   const count=scenario.frameCount??(scenario.burst?burst:1),frameStepMs=scenario.stepMs??stepMs;let projectiles=false,muzzle=false,explosion=false;const observed=new Set(),burstFrames=[];let kitingPrevious=null,feelStart=null;
   for(let frame=0;frame<count;frame++){
    if(scenario.roomTour)await page.evaluate(advanceRoomTour,frame);
    else if(scenario.kiting)await page.evaluate(advanceKiting,{frame,stepMs:frameStepMs});
    else if(frame)await page.evaluate(ms=>window.__containmentDebug.step(ms),frameStepMs);
    if(scenario.titleArtTimeline) await page.evaluate(ms=>{
     const art=document.querySelector('.title-key-art');
     if(!art)throw Error('Title artwork is absent');
     // Debug refreshes rebuild the menu; replay the same production entry CSS at an exact time.
     art.classList.remove('key-art-revealed');
     for(const animation of art.getAnimations({subtree:true})){animation.pause();animation.currentTime=ms;}
    },frame*frameStepMs);
    // Opt-in failed-case diagnosis records camera and evidence in one page task,
    // before the unchanged visibility/HUD assertions run. Ordinary captures keep
    // their original inspection path and presentation clocks.
    const inspected=args.includes('--failure-evidence')?await page.evaluate(new Function(`
     const evidence=(${inspectFrame.toString()})();const d=window.__containmentDebug,r=d.renderer;
     return{evidence,camera:{world:r.camera.matrixWorld.toArray(),inverseProjection:r.camera.projectionMatrixInverse.toArray(),zoom:r.camera.zoom,focus:r.cameraRig.focus.toArray(),marineHeight:r.player.height,roomBounds:d.game.geometry.bounds,roomBoundary:d.game.geometry.boundary,actors:Array.from(r.actors,([id,m])=>({id,height:m.height,elevation:m.root.position.y}))}};
    `)):null;
    const evidence=inspected?.evidence??await page.evaluate(inspectFrame);lastEvidence=evidence;lastCamera=inspected?.camera??null;
    if(scenario.roomTour)evidence.e9RoomTourProof=await page.evaluate(()=>window.__containmentDebug.e9RoomTourProof);
    if(scenario.i10ArmoryReplay)evidence.i10ArmoryReplay=await page.evaluate(inspectI10ArmoryReplay);
    if(scenario.u7Crossing)evidence.u7Crossing=await page.evaluate(()=>window.__containmentDebug.u7Crossing);
    if(scenario.i11NativePointer){
    const point=await page.evaluate(()=>window.__containmentDebug.i11NativePointer);
    assert(point&&Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.x>=0&&point.x<viewport.width&&point.y>=0&&point.y<viewport.height,`${name}: native pool cursor is outside the viewport`);
    await page.mouse.move(point.x,point.y);
    await page.evaluate(()=>{window.__containmentDebug.refresh();window.__containmentDebug.refresh();});
   }else if(scenario.v7Placement){
     const proof=evidence.v7Placement=await page.evaluate(inspectV7Placement);
     assert(proof.bridge&&proof.meshCount>0,`${name}: native cursor lacks a prepared world footprint`);
     assert.equal(proof.usesAfter,proof.usesBefore,`${name}: placement inspection changed gameplay`);
     assert(proof.charges>0,`${name}: placement inspection consumed its charge`);
     if(proof.blocked){assert.equal(proof.nativeFKey,1,`${name}: missing trusted native F press`);assert.equal(proof.nativeDenied,1,`${name}: missing native blocked denial`);assert(proof.valid.every(value=>!value),`${name}: denied footprint remains valid`);assert(['Blocked by machinery','Need clear ground'].includes(proof.label),`${name}: cursor denial reason absent`);assert.equal(proof.slot,'REPOSITION',`${name}: slot lost its availability cue`);}
     else assert(proof.valid.some(Boolean),`${name}: legal native placement has no valid outline`);
    }
    if(scenario.nativeReload){assert(await page.evaluate(()=>window.__containmentDebug.game.combat.snapshot.reloading),`${name}: native reload is absent`);assert.equal(await page.locator('#reload-label').innerText(),'RELOADING');}
    if(scenario.titleArtTimeline){
     assert.equal(await page.locator('.title-screen').evaluate(node=>getComputedStyle(node).opacity),'1','Title shell exposed the hidden 3D cast');
     evidence.titleArt=await page.evaluate(()=>Object.fromEntries(['ka-emergency','ka-marine-reveal','ka-eyes-main'].map(name=>[name,Number(getComputedStyle(document.querySelector('.'+name)).opacity)])));
     if(frame===0){assert(evidence.titleArt['ka-marine-reveal']<=.061,'Marine reveal skipped its dark opening');assert.equal(evidence.titleArt['ka-eyes-main'],0,'Threat eyes opened before the light');}
     if(frame*frameStepMs>=1800){assert.equal(evidence.titleArt['ka-marine-reveal'],1);assert.equal(evidence.titleArt['ka-eyes-main'],1);}
    }
    if(scenario.i11Duration){
     const {ability,durationMs}=scenario.i11Duration,slot=evidence.abilities.slots.overdrive;
     assert.equal(slot.id,ability,`${name}: native ultimate identity changed`);
     assert.equal(slot.activeMs,durationMs,`${name}: native duration changed`);
     assert.equal(evidence.stats.abilityUses.overdrive,1,`${name}: timeline recast ultimate`);
     const remaining=evidence.abilities.overdrive.activeRemainingMs;
     assert.equal(evidence.abilities.overdrive.active,remaining>0,`${name}: native active snapshot disagrees`);
     const phaseMs=30+frame*frameStepMs;
     if(durationMs&&phaseMs<durationMs-50)assert(remaining>0,`${name}: ultimate expired before its native duration`);
     if(durationMs&&phaseMs>durationMs+50)assert.equal(remaining,0,`${name}: ultimate stayed active after expiry`);
     evidence.i11Duration={...scenario.i11Duration,phaseMs,remainingMs:remaining,scope:ability==='railbreaker'?'Instant native attack and its visual aftermath':'Native active duration through expiry; no recast'};
    }
    if(scenario.priorityPair)assertPriorityPair(evidence,viewport,name);
    if(scenario.auditGraphics)assert.deepEqual(evidence.drawErrors,[],`${name}: GPU draw errors ${JSON.stringify(evidence.drawErrors)}`);
    if(scenario.feelImpact){if(feelStart===null)feelStart=evidence.elapsed*1000;const advanced=evidence.elapsed*1000-feelStart,wall=frame*frameStepMs;if(wall<40)assert(Math.abs(advanced)<.001,`${name}: hit-stop did not hold simulation`);if(wall>=60)assert(advanced>0&&advanced<wall,`${name}: hit-stop did not resume on a delayed fixed step`);}
    for(const selector of scenario.required??[])assert(await page.locator(selector).first().isVisible(),`${name}: missing ${selector}`);
    if(scenario.map){assert.equal(evidence.ui.map.nodes,evidence.ui.map.expectedNodes,`${name}: incomplete actual run map`);assert(evidence.ui.map.edges>0&&evidence.ui.map.current===1&&evidence.ui.map.confirmation,`${name}: map connections/current/confirmation missing`);if(scenario.legacyBranch)assert(evidence.ui.map.choices>1,`${name}: legacy branch choices missing`);}
    if(scenario.state!=='playing')for(const box of evidence.ui.layout)assert(!box.overflowX&&!box.outsideViewport&&(!box.overflowY||viewport.height<600&&/auto|scroll/.test(box.overflow)),`${name}: primary screen clips/scrolls: ${JSON.stringify(box)}`);
    if(scenario.phase)assert.equal(evidence.phase,scenario.phase,`${name}: wrong run phase`);
    if(scenario.nativeInput){assert.equal(evidence.abilities.rig,'breacher');for(const slot of ['dash','tactical','power','overdrive'])assert.equal(evidence.stats.abilityUses[slot],1,`Native ${slot} input failed`);assert.equal(evidence.stats.overdrivesUsed,1);}
    if(scenario.ability){assert.equal(evidence.abilities.rig,scenario.ability.rig);assert.equal(evidence.abilities.slots[scenario.ability.slot].id,scenario.ability.id);assert.equal(evidence.stats.abilityUses[scenario.ability.slot],scenario.ability.uses??1);assert(evidence.abilities.zones.length<=24&&evidence.abilities.deployables.length<=8,'Ability counts unbounded');}
    if(scenario.ability&&(evidence.abilities.deployables.length||evidence.abilities.zones.length))assert(evidence.interimMeshes>0,`${name}: live ability entities lack world visuals`);
    if(scenario.ability||scenario.nativeInput){
     assert.equal(evidence.ui.abilitySlots.length,4,`${name}: live ability HUD incomplete`);
     assert(!evidence.ui.toasts.some(text=>text.includes('acquired')),`${name}: stale draft acquisition toast in ability-only fixture`);
     for(const hud of evidence.ui.abilitySlots){
      const slot=evidence.abilities.slots[hud.slot];
      assert(hud.title&&hud.value&&hud.icon,`${name}: ${hud.slot} HUD content missing`);
      assert.equal(hud.title.toLowerCase().replace(/[^a-z]/g,''),slot.id.replaceAll('-',''),`${name}: HUD shows a different rig ability`);
      if(hud.state!=='denied')assert.equal(hud.state,slot.castRemainingMs>0?'casting':slot.activeRemainingMs>0?'active':(hud.slot==='overdrive'?evidence.abilities.overdrive.ready:slot.ready)?'ready':'cooling',`${name}: ${hud.slot} HUD state differs from live snapshot`);
     }
    }
    if(scenario.id==='i4-menu-after-combat'){assert(evidence.i4Proof.retainedEnemies>=2,'Title fixture cleared its native enemies');assert.equal(evidence.i4Proof.foreignDraws,0,'Retained gameplay actors leaked into the cinematic title');}
    if(scenario.id==='results'){assert(evidence.stats.kills.total>0&&evidence.stats.damageDealt.ability>0&&evidence.stats.damageDealt.weapon>0&&evidence.stats.shotsHit>0&&evidence.stats.abilityUses.tactical===1&&evidence.stats.overdrivesUsed===1,'Results lack genuine ability and weapon combat receipts');}
    if(scenario.state==='dead'||scenario.state==='complete')assert(await page.locator('.damage-source-legend [data-stat] b').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).color==='rgb(240, 251, 255)')),`${name}: source accounting legend implies an element`);
    if(scenario.uiState)assert.equal(evidence.uiState,scenario.uiState,`${name}: wrong fixture UI phase`);
    if(evidence.warningProof)evidence.warningProof.hudPanels=await page.evaluate(()=>[...document.querySelectorAll('#hud :is(.vitals,#status-hud,#action-bar,#radar-hud)')].filter(panel=>panel.getClientRects().length).map(panel=>{
     const {left,top,right,bottom}=panel.getBoundingClientRect();
     const background=getComputedStyle(panel).backgroundColor;
     const alpha=background.startsWith('rgba(')?Number(background.split(',').at(-1).slice(0,-1)):1;
     return {left,top,right,bottom,alpha,faded:panel.dataset.obscuresThreat==='true'};
    }));
    assertNativeWarning(evidence,name,{quiet:scenario.roomTour||scenario.id==='combat-calm'||scenario.id==='l8-arena-calm'});
    if(scenario.roomTour)assertRoomTour(evidence,frame,name);
    if(scenario.id==='combat-calm')assert.equal(evidence.enemies,0,`${name}: calm room contains enemies`);
    if(scenario.id==='l8-arena-calm'){
     assert.equal(evidence.enemies,0,`${name}: arena calm contains enemies`);const proof=evidence.l8ArenaCalmProof;
     assert(proof?.nativePresentation&&proof.presentationTicks===120&&proof.simulationBefore===proof.simulationAfter&&proof.cameraOverride===false,`${name}: native presentation-only arena settling proof missing`);
     assert.equal(proof.preparedShaderCompiles,0,`${name}: prepared presentation compiled new programs`);assert.deepEqual({x:evidence.player.x,y:evidence.player.y},proof.arena,`${name}: arena calm left declared fight arena`);
    }
    assert.equal(evidence.state,scenario.state,`${name}: wrong game state`);assertCaptureCanvas(evidence,{scenarioId:scenario.id,viewport,dpr,name});
    if(scenario.room)assert.equal(evidence.templateId,scenario.room);
    if(scenario.state==='playing')assertPlayingMarine(evidence,viewport,name);
    if(scenario.state==='playing')assert.deepEqual(evidence.hudOverlaps,[],`${name}: HUD covers the projected marine`);
    if(scenario.state==='playing') {
     evidence.ui.criticalContrast=await page.evaluate(criticalContrast);
     for(const value of evidence.ui.criticalContrast)assert(value.contrast>=4.5&&value.backingAlpha===1&&value.opacity===1,`${name}: critical HUD value loses contrast: ${JSON.stringify(value)}`);
    }
    if(scenario.liveKiting){assert(evidence.kitingProof.startEnemies>=10&&evidence.kitingProof.endEnemies>=8,`${name}: heavy encounter missing`);assert(evidence.stats.abilityUses.power>0&&evidence.stats.overdrivesUsed>0,`${name}: live ability receipts missing`);}
    if(scenario.kiting){
     assert(evidence.visibleEnemies>=12,`${name}: only ${evidence.visibleEnemies} visible enemies while kiting`);
     assert(evidence.abilities.rig==='cryo'&&evidence.stats.abilityUses.dash>=1&&evidence.stats.abilityUses.tactical>=1,`${name}: missing live kiting rig receipts`);
     kitingPrevious=assertKitingMovement(kitingPrevious,evidence.player,name);
     projectiles||=evidence.playerBullets>0;muzzle||=evidence.muzzle>0;
    }
    if(scenario.combat){assert(evidence.visibleEnemies>=12,`${name}: only ${evidence.visibleEnemies} visible enemies`);projectiles||=evidence.playerBullets>0;muzzle||=evidence.muzzle>0;}
    if(scenario.id==='combat-kiting-fixture'&&frame*frameStepMs<600)assert(evidence.ui.damageNumbers.length>0,`${name}: staged damage numbers expired before capture`);
    if(scenario.id==='boss')assert(evidence.boss&&evidence.bossHud,'Queen/boss HUD missing');
    explosion||=evidence.recentEffects.some(e=>e.type==='explosion');
    for(const s of evidence.statuses)for(const key of ['burning','chilled','frozen','poisoned'])if(s[key])observed.add(key);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const file=name+(scenario.burst?`-${String(frame+1).padStart(2,'0')}`:'')+'.png';
    // Art-only world view: leave native DOM/input/framing inspection intact,
    // but export the actual rendered canvas so HUD cannot identify the rig.
    const bytes=canvasOnly?Buffer.from(await page.evaluate(()=>{const d=window.__containmentDebug;d.refresh();return d.renderer.renderer.domElement.toDataURL('image/png').split(',')[1];}),'base64'):await page.screenshot({path:resolve(out,file),animations:scenario.titleArtTimeline?'allow':'disabled'});
    if(canvasOnly)await writeFile(resolve(out,file),bytes);
    const pixels=samplePng(bytes);
    if(args.includes('--scaffold')&&await page.locator('[data-key-art-scaffold]').count()) {
     await page.locator('[data-key-art-scaffold]').evaluate(node=>node.style.display='');
     const scaffoldFile=file.replace('.png','-scaffold.png');
     await page.screenshot({path:resolve(out,scaffoldFile),animations:'disabled'});
     await page.locator('[data-key-art-scaffold]').evaluate(node=>node.style.display='none');
     evidence.scaffoldFile=scaffoldFile;
    }
    if(scenario.burst)burstFrames.push(bytes);
    const errors=manifest.errors.slice(errorStart);assert.equal(errors.length,0,JSON.stringify(errors));
    manifest.shots.push({scenario:scenario.id,room:scenario.room??null,frame:scenario.burst?frame+1:null,file,presentationMs:frame*frameStepMs,simulationMs:Math.round(evidence.elapsed*1000),performance:evidence.performance,errors,pixels,staging,evidence});
   }
   if(scenario.burst){
    const sprite=stitchPngFrames(burstFrames,spriteWidth),file=name+'-sprite.png';
    await writeFile(resolve(out,file),sprite.png);
    const {png,...layout}=sprite;manifest.sprites.push({scenario:scenario.id,room:scenario.room??null,file,...layout,stepMs:frameStepMs,simulationMs:manifest.shots.filter(s=>s.scenario===scenario.id&&s.room===(scenario.room??null)).map(s=>s.simulationMs)});
   }
   if(scenario.kiting)assert(projectiles&&muzzle,`${name}: kiting burst lacks real firing feedback`);
   if(scenario.combat)assert((scenario.status||projectiles)&&muzzle,`${name}: burst lacks player projectiles or muzzle flash`);
   if(scenario.id==='i4-breach'){const shots=manifest.shots.filter(s=>s.scenario===scenario.id);assert(shots[0].evidence.i4Proof?.nativeWarning&&shots[0].evidence.i4Proof.pendingAtStart>0,'Native breach scheduling receipt missing');assert(shots.some(s=>s.evidence.i4Proof.active>0),'Breach burst never reached a native enemy spawn');}
   if(scenario.id==='i4-exit-standby')assert(manifest.shots.at(-1).evidence.i4Proof?.visible,'Authored exit is not visible');
   if(scenario.id==='combat-heavy')assert(explosion,`${name}: burst lacks a real explosion`);
   if(scenario.status)assert(['burning','chilled','frozen','poisoned'].every(s=>observed.has(s)),`Missing elemental statuses: ${[...observed]}`);
   console.log(`  ${count} PNGs verified`);
  }catch(error){const failure={scenario:scenario.id,room:scenario.room,error:String(error),errors:manifest.errors.slice(errorStart)};manifest.failures.push(failure);console.error(`FAILED ${name}: ${error}`);if(scenario.priorityPair||args.includes('--failure-evidence')){const evidence=lastEvidence??await page.evaluate(inspectFrame).catch(()=>null);const camera=lastCamera??await page.evaluate(()=>{const r=window.__containmentDebug.renderer;return{world:Array.from(r.camera.matrixWorld.elements),inverseProjection:Array.from(r.camera.projectionMatrixInverse.elements),zoom:r.camera.zoom,focus:r.cameraRig.focus.toArray(),marineHeight:r.player.height,actors:Array.from(r.actors,([id,m])=>({id,height:m.height,elevation:m.root.position.y}))};}).catch(()=>null);await writeFile(resolve(out,name+'-failure.json'),JSON.stringify({failure,atAssertion:!!lastEvidence&&!!lastCamera,distSnapshot:manifest.distSnapshot,appAssets:manifest.appAssets,evidence,camera},null,2));}await page.screenshot({path:resolve(out,name+'-failure.png'),timeout:10000}).catch(()=>{});if(!keepGoing)throw error;}
  for(const key of scenario.nativeHold??[])await page.keyboard.up(key);
  // The final contact sheet is self-contained; avoid rewriting its large image payload per shot.
  await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 }
 if(manifest.failures.length||manifest.errors.length)throw Error(`${manifest.failures.length} scenarios failed; ${manifest.errors.length} page/console errors`);
}catch(error){manifest.fatalError=String(error);process.exitCode=1;console.error(`Capture failed: ${error.stack??error}`);
}finally{
 await context?.close();await browser?.close();if(server)await new Promise(ok=>server.close(ok));await save();
 console.log(`${manifest.shots.length} PNGs in ${manifest.runtimeSeconds}s\n${relative(root,resolve(out,'index.html'))}`);
}
