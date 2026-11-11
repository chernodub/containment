#!/usr/bin/env node
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
import {stitchPngFrames} from './sprites.mjs';
import {compareGalleries} from './gallery.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');process.chdir(root);
const args=process.argv.slice(2),flags=new Set(['build','headed','keep-going','help']);
const known=new Set([...flags,'label','scenarios','rooms','burst','width','height','dpr','timestamp','seed','compare','step-ms','sprite-width','dist','dist-source-sha']);
for(const arg of args){assert(arg.startsWith('--')&&known.has(arg.slice(2).split('=')[0]),`Unknown option ${arg}`);assert(arg.includes('=')||flags.has(arg.slice(2)),`Use --name=value: ${arg}`);}
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const integer=(name,fallback,min,max)=>{const n=Number(option(name,fallback));assert(Number.isInteger(n)&&n>=min&&n<=max,`--${name} must be ${min}..${max}`);return n;};
if(args.includes('--help')){console.log('npm run capture -- --label=baseline --scenarios=all [--rooms=id,id] [--burst=4 --step-ms=150 --sprite-width=960] [--compare=labelA,labelB] [--width=1920 --height=1080 --dpr=1] [--build] [--headed] [--keep-going] [--timestamp=ISO] [--seed=1729]\nSee scripts/nextgen/README.md');process.exit(0);}
const comparison=option('compare','');
const label=option('label',comparison?'comparison-'+comparison.replaceAll(',','-'):'baseline');assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label),'Unsafe label');
const viewport={width:integer('width',1920,640,7680),height:integer('height',1080,480,4320)},dpr=Number(option('dpr',1));assert(dpr>=.5&&dpr<=4,'--dpr must be .5..4');
const burst=integer('burst',4,1,30),seed=integer('seed',1729,0,0xffffffff),keepGoing=args.includes('--keep-going');
const rooms=option('rooms',DEFAULT_ROOMS.join(',')).split(',');assert(rooms.length&&rooms.every(id=>/^[a-z0-9-]+$/.test(id)),'Invalid room list');
const selection=option('scenarios','all').split(','),requested=selection.includes('all')?SCENARIOS.map(s=>s.id):selection;
const scenarios=requested.flatMap(item=>{const direct=SCENARIOS.find(s=>s.id===item);if(direct&&!direct.rooms)return [{...direct}];const [id,room,...extra]=item.split(':'),entry=SCENARIOS.find(s=>s.id===id);assert(entry&&!extra.length&&(!room||entry.rooms),`Unknown scenario ${item}`);return entry.rooms?(room?[{...entry,room}]:rooms.map(room=>({...entry,room}))):[{...entry}];});
const out=resolve('artifacts/nextgen',label);
if(comparison){const result=await compareGalleries(resolve('artifacts/nextgen'),comparison.split(','),out);console.log(`${result.pairs} aligned views (missing counterparts labelled)\n${result.file}`);process.exit(0);}
const stepMs=integer('step-ms',150,1,1000),spriteWidth=integer('sprite-width',960,160,1920);
const prefix='/containment/',dist=resolve(option('dist','dist'));
const timestamp=option('timestamp',new Date().toISOString());assert(Number.isFinite(Date.parse(timestamp)),'Invalid --timestamp');
const manifest={gitSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),timestamp,label,seed,viewport,deviceScaleFactor:dpr,burstStepMs:stepMs,shots:[],sprites:[],failures:[],errors:[],fontFallbacks:[],gpuAttempts:[],runtimeSeconds:0,note:'Production game, per-shot High/Low tiers. Fixed-step captures include idle RAF/screenshot overhead; i2 kitingProof separately records live normal-loop samples.'};
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
async function save(){
 await writeFile(resolve(out,'pngs.txt'),[...manifest.shots,...manifest.sprites].map(s=>resolve(out,s.file)).join('\n')+'\n');
 manifest.runtimeSeconds=Number(((performance.now()-started)/1000).toFixed(2));
 await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const spriteCards=await Promise.all(manifest.sprites.map(async s=>`<figure><img src="data:image/png;base64,${(await readFile(resolve(out,s.file))).toString('base64')}" alt="${escape(s.file)}" loading="lazy"><figcaption><b>${escape(s.file)}</b><br>${s.frames} fixed-step frames · ${s.stepMs} ms spacing · read left to right, top to bottom</figcaption></figure>`));
 const cards=await Promise.all(manifest.shots.map(async s=>{const data='data:image/png;base64,'+(await readFile(resolve(out,s.file))).toString('base64');return `<figure><a href="#${escape(s.file)}" target="_blank"><img src="${data}" alt="${escape(s.file)}" loading="lazy"></a><figcaption><b>${escape(s.file)}</b><br>${s.evidence.visibleEnemies} visible enemies · ${s.evidence.playerBullets} player projectiles · ${s.performance.drawCalls} draws · ${s.performance.triangles.toLocaleString()} triangles</figcaption></figure>`;}));
 await writeFile(resolve(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Containment — ${escape(label)}</title><style>body{margin:0;background:#0c1015;color:#dbe7ee;font:15px system-ui}header{padding:24px 28px}h1{margin:0 0 10px}p{max-width:1100px;line-height:1.5;color:#9eafbd}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:18px;padding:0 24px 24px}figure{margin:0;background:#17202a;border:1px solid #34404c;border-radius:6px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:12px;line-height:1.6}.failure{color:#ffab9b}</style><header><h1>Containment / ${escape(label)}</h1><p>${escape(timestamp)} · ${escape(manifest.gitSHA)}<br>${escape(manifest.renderer??'No renderer')} · ${viewport.width}×${viewport.height} @ ${dpr} · Per-shot graphics tier<br>${escape(manifest.note)}<br>${manifest.shots.length} shots · ${manifest.runtimeSeconds}s</p>${manifest.failures.map(f=>`<p class="failure">${escape(f.scenario)} ${escape(f.room??'')}: ${escape(f.error)}</p>`).join('')}</header><main class="grid">${spriteCards.join('')}${cards.join('')}</main><script>document.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();const w=open('about:blank','_blank');if(w){w.document.title=a.querySelector('img').alt;w.document.body.style='margin:0;background:#080b10';const i=w.document.createElement('img');i.src=a.querySelector('img').src;i.style='max-width:100%;height:auto';w.document.body.append(i);}})</script></html>`);
}
function installDrawAudit(){
    const d=window.__containmentDebug,r=d.renderer,gl=r.renderer.getContext(),render=r.renderer.render;d.drawErrors=[];
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
  const name=scenario.id.replaceAll(':','-')+(scenario.room?`-${scenario.room}`:'');console.log(`Capturing ${name}…`);const errorStart=manifest.errors.length;
  try{
   // Reload isolates renderer animation time, effect pools, caches, and random state.
   if(scenario.resetPreferences)await page.evaluate(keys=>{for(const key of keys)localStorage.removeItem(key);},scenario.resetPreferences);
   if(scenarioIndex++||scenario.resetPreferences){await page.reload();await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);}
   if(scenario.auditGraphics)await page.evaluate(installDrawAudit);
   await page.evaluate(seed=>{window.__captureSeed(seed);},seed);await page.evaluate(scenario.setup,scenario.setupArgument??scenario.room);
   if(scenario.reloadAfterSetup){await page.reload();await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);if(scenario.auditGraphics)await page.evaluate(installDrawAudit);await page.evaluate(scenario.afterReload);}
   if(scenario.nativeKeys){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));for(const [key,ms]of scenario.nativeKeys){await page.keyboard.press(key);await page.evaluate(ms=>window.__containmentDebug.step(ms),ms);}}
   // Asset warm-up may consume random values asynchronously. Restart the visual
   // stream only after room preparation, before synchronous combat/VFX staging.
   await page.evaluate(seed=>window.__captureSeed(seed),seed);
   let staging;if(scenario.combat)staging=await page.evaluate(stageCombat,{status:!!scenario.status});
   if(scenario.kiting)staging=await page.evaluate(stageKiting);
   await page.waitForFunction(()=>!window.__containmentDebug.renderer.roomLoading&&document.querySelector('#world').getAttribute('aria-busy')!=='true');
   if(scenario.state==='playing')await page.mouse.move(Math.round(viewport.width*.64),Math.round(viewport.height*.48));else await page.mouse.move(4,4);
   const count=scenario.burst?burst:1,frameStepMs=scenario.stepMs??stepMs;let projectiles=false,muzzle=false,explosion=false;const observed=new Set(),burstFrames=[];let kitingStart=null,feelStart=null;
   for(let frame=0;frame<count;frame++){
    if(scenario.kiting)await page.evaluate(advanceKiting,{frame,stepMs:frameStepMs});
    else if(frame)await page.evaluate(ms=>window.__containmentDebug.step(ms),frameStepMs);
    const evidence=await page.evaluate(inspectFrame);
    if(scenario.auditGraphics)assert.deepEqual(evidence.drawErrors,[],`${name}: GPU draw errors ${JSON.stringify(evidence.drawErrors)}`);
    if(scenario.feelImpact){if(feelStart===null)feelStart=evidence.elapsed*1000;const advanced=evidence.elapsed*1000-feelStart,wall=frame*frameStepMs;if(wall<40)assert(Math.abs(advanced)<.001,`${name}: hit-stop did not hold simulation`);if(wall>=60)assert(advanced>0&&advanced<wall,`${name}: hit-stop did not resume on a delayed fixed step`);}
    for(const selector of scenario.required??[])assert(await page.locator(selector).first().isVisible(),`${name}: missing ${selector}`);
    if(scenario.map){assert.equal(evidence.ui.map.nodes,evidence.ui.map.expectedNodes,`${name}: incomplete actual run map`);assert(evidence.ui.map.edges>0&&evidence.ui.map.current===1&&evidence.ui.map.confirmation,`${name}: map connections/current/confirmation missing`);if(scenario.legacyBranch)assert(evidence.ui.map.choices>1,`${name}: legacy branch choices missing`);}
    if(scenario.state!=='playing')for(const box of evidence.ui.layout)assert(!box.overflowX&&!box.overflowY&&!box.outsideViewport,`${name}: primary screen clips/scrolls: ${JSON.stringify(box)}`);
    if(scenario.phase)assert.equal(evidence.phase,scenario.phase,`${name}: wrong run phase`);
    if(scenario.nativeInput){assert.equal(evidence.abilities.rig,'breacher');for(const slot of ['dash','tactical','power','overdrive'])assert.equal(evidence.stats.abilityUses[slot],1,`Native ${slot} input failed`);assert.equal(evidence.stats.overdrivesUsed,1);}
    if(scenario.ability){assert.equal(evidence.abilities.rig,scenario.ability.rig);assert.equal(evidence.abilities.slots[scenario.ability.slot].id,scenario.ability.id);assert.equal(evidence.stats.abilityUses[scenario.ability.slot],1);assert(evidence.abilities.zones.length<=24&&evidence.abilities.deployables.length<=8,'Ability counts unbounded');}
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
    if(scenario.id==='results'){assert(evidence.stats.kills.total>0&&evidence.stats.damageDealt.ability>0&&evidence.stats.damageDealt.weapon>0&&evidence.stats.shotsHit>0&&evidence.stats.abilityUses.tactical===1&&evidence.stats.overdrivesUsed===1,'Results lack genuine ability and weapon combat receipts');}
    if(scenario.uiState)assert.equal(evidence.uiState,scenario.uiState,`${name}: wrong fixture UI phase`);
    if(scenario.id==='combat-calm')assert.equal(evidence.enemies,0,`${name}: calm room contains enemies`);
    assert.equal(evidence.state,scenario.state,`${name}: wrong game state`);assert(evidence.canvas.colors>8&&!evidence.canvas.contextLost&&!evidence.canvas.error,`${name}: missing/invalid canvas pixels ${JSON.stringify(evidence.canvas)}`);
    if(scenario.room)assert.equal(evidence.templateId,scenario.room);
    if(scenario.state==='playing'){assert(evidence.hud&&evidence.player.visible&&!evidence.overlay,`${name}: HUD/player missing or overlay blocks scene`);}
    if(scenario.state==='playing')assert.deepEqual(evidence.hudOverlaps,[],`${name}: HUD covers the projected marine`);
    if(scenario.liveKiting){assert(evidence.kitingProof.startEnemies>=10&&evidence.kitingProof.endEnemies>=8,`${name}: heavy encounter missing`);assert(evidence.stats.abilityUses.power>0&&evidence.stats.overdrivesUsed>0,`${name}: live ability receipts missing`);}
    if(scenario.kiting){
     assert(evidence.visibleEnemies>=12,`${name}: only ${evidence.visibleEnemies} visible enemies while kiting`);
     assert(evidence.abilities.rig==='cryo'&&evidence.stats.abilityUses.dash>=1&&evidence.stats.abilityUses.tactical>=1,`${name}: missing live kiting rig receipts`);
     if(!kitingStart)kitingStart={x:evidence.player.x,y:evidence.player.y};
     if(frame>0)assert(Math.hypot(evidence.player.x-kitingStart.x,evidence.player.y-kitingStart.y)>1,`${name}: marine did not move`);
     projectiles||=evidence.playerBullets>0;muzzle||=evidence.muzzle>0;
    }
    if(scenario.combat){assert(evidence.visibleEnemies>=12,`${name}: only ${evidence.visibleEnemies} visible enemies`);projectiles||=evidence.playerBullets>0;muzzle||=evidence.muzzle>0;}
    if(scenario.id==='combat-kiting-fixture'&&frame*frameStepMs<600)assert(evidence.ui.damageNumbers.length>0,`${name}: staged damage numbers expired before capture`);
    if(scenario.id==='boss')assert(evidence.boss&&evidence.bossHud,'Queen/boss HUD missing');
    explosion||=evidence.recentEffects.some(e=>e.type==='explosion');
    for(const s of evidence.statuses)for(const key of ['burning','chilled','frozen','poisoned'])if(s[key])observed.add(key);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const file=name+(scenario.burst?`-${String(frame+1).padStart(2,'0')}`:'')+'.png',bytes=await page.screenshot({path:resolve(out,file),animations:'disabled'}),pixels=samplePng(bytes);
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
  }catch(error){const failure={scenario:scenario.id,room:scenario.room,error:String(error),errors:manifest.errors.slice(errorStart)};manifest.failures.push(failure);console.error(`FAILED ${name}: ${error}`);await page.screenshot({path:resolve(out,name+'-failure.png'),timeout:10000}).catch(()=>{});if(!keepGoing)throw error;}
  // The final contact sheet is self-contained; avoid rewriting its large image payload per shot.
  await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 }
 if(manifest.failures.length||manifest.errors.length)throw Error(`${manifest.failures.length} scenarios failed; ${manifest.errors.length} page/console errors`);
}catch(error){manifest.fatalError=String(error);process.exitCode=1;console.error(`Capture failed: ${error.stack??error}`);
}finally{
 await context?.close();await browser?.close();if(server)await new Promise(ok=>server.close(ok));await save();
 console.log(`${manifest.shots.length} PNGs in ${manifest.runtimeSeconds}s\n${relative(root,resolve(out,'index.html'))}`);
}
