#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir, appendFile, stat} from 'node:fs/promises';
import {resolve, extname, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {RIGS, chooseBoon, chooseRoute, chooseTarget, chooseMovement, chooseActions, quantiles, distance, pointerFirePlan, assessLoading} from './policy.mjs';
import {loadEarnedBoundary} from './resume.mjs';
import {newEventReceipts} from './evidence.mjs';
import {detectSnapshotDefects} from './diagnostics.mjs';
import {installAudioSpy, readAudioSpy, checkpointProbe} from './lifecycle.mjs';
import {stitchPngFrames} from '../sprites.mjs';
import {samplePng} from '../png.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
process.chdir(root);
const args = process.argv.slice(2);
const options = Object.fromEntries(args.map(arg => {
  assert(/^--[a-z-]+(?:=.*)?$/.test(arg), `Invalid argument ${arg}`);
  const [key, ...value] = arg.slice(2).split('=');
  assert(['rig','seed','rooms','label','headed','assisted','legacy','checkpoints','realtime','max-room-seconds','max-wall-seconds','resume-boundary'].includes(key), `Unknown option ${key}`);
  return [key, value.length ? value.join('=') : true];
}));
const resumed=options['resume-boundary']?await loadEarnedBoundary(resolve(options['resume-boundary'])):null;
const rig = options.rig ?? resumed?.parent.rig ?? 'arc', seed = Number(options.seed ?? resumed?.checkpoint.run.seed ?? 1729), roomLimit = Number(options.rooms ?? 20);
if(resumed){assert.equal(rig,resumed.parent.rig,'Cannot change rig while resuming');assert.equal(seed,resumed.checkpoint.run.seed,'Cannot change seed while resuming');assert.equal(!!options.assisted,resumed.parent.assisted,'Cannot change assistance while resuming');}
assert(RIGS.includes(rig), 'Rig must be breacher/cryo/pyro/arc');
assert(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'Invalid uint32 seed');
assert(Number.isInteger(roomLimit) && roomLimit >= 1 && roomLimit <= 20, 'rooms must be 1..20');
const maxWallSeconds=Number(options['max-wall-seconds']??3600);assert(Number.isFinite(maxWallSeconds)&&maxWallSeconds>=10&&maxWallSeconds<=7200,'max-wall-seconds must be 10..7200');
const label = options.label ?? `${rig}-${seed}${resumed?'-continued':''}${options.assisted ? '-assisted' : ''}${options.legacy ? '-legacy' : ''}`;
assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(label), 'Unsafe label');
const out = resolve('artifacts/nextgen/playtest', label);
await mkdir(out, {recursive:true});
await writeFile(resolve(out,'trace.ndjson'),'');
await mkdir(resolve(out,'source'),{recursive:true});
const harnessHashes={};
for(const file of ['runner.mjs','policy.mjs','lifecycle.mjs','diagnostics.mjs','evidence.mjs','resume.mjs']){const content=await readFile(resolve('scripts/nextgen/playtest',file));harnessHashes[file]=createHash('sha256').update(content).digest('hex');await writeFile(resolve(out,'source',file),content);}
const report = {
  label, rig, seed, assisted: !!options.assisted, incomingDamageScale: options.assisted ? .15 : 1,
  legacy: resumed?.parent.legacy??!!options.legacy, presentation:true, roomLimit, harnessHashes, head: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  branch: execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(), started: new Date().toISOString(),
  policy: 'Native WASD and mouse; spitter/champion focus; obstacle-probed kiting; rig-path/augment boon heuristic; safer route, medical if health<75; heal<40%; Q/F opportunity; V at 6+ or boss/champion.',
  clock: options.realtime ? 'native realtime RAF' : 'native fixed 60Hz; 250ms policy decisions; render every fixed tick',
  rooms: resumed?resumed.parent.rooms.filter(r=>['clear','complete'].includes(r.result)&&resumed.checkpoint.run.completedNodeIds.includes(r.nodeId)):[], errors: resumed?[...resumed.parent.errors]:[], defects: resumed?[...resumed.parent.defects]:[], checkpoints: [], screenshots: [], inputs: [], outcome: 'running',
  limitations: ['Incoming damage source is inferred from nearby threats, not authoritative attribution.', 'Accelerated CPU samples include rendering submission, not GPU completion; RAF diagnostics are separately retained.', 'A deterministic seed does not guarantee identical outcomes across policy/render timing; input trace is retained.', 'Audio spy tracks source lifecycle, not perceived sound quality.'],
};
if(resumed)report.continuation={source:resumed.source,parentLabel:resumed.parent.label,parentHead:resumed.parent.head,parentWallSeconds:resumed.parent.wallSeconds,provenRooms:resumed.checkpoint.run.completedNodeIds,explanation:'Continues a recorded earned boundary through real Continue; no unfought rooms are advanced.'};
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let previousEvents=[];
let browser, server, page, context, room, last, hardest = -1, hardestFrames = [], held = new Set(), shooting = false, wallStart = performance.now();
async function save() {
  report.wallSeconds = (performance.now()-wallStart)/1000;report.totalWallSeconds=report.wallSeconds+(resumed?.parent.totalWallSeconds??resumed?.parent.wallSeconds??0);
  await writeFile(resolve(out,'report.json'), JSON.stringify(report,null,2));
  const images = report.screenshots.map(f => `<figure><a href="${escape(f)}"><img loading="lazy" src="${escape(f)}"></a><figcaption>${escape(f)}</figcaption></figure>`).join('');
  await writeFile(resolve(out,'index.html'), `<!doctype html><meta charset="utf-8"><title>${escape(label)}</title><style>body{background:#111820;color:#dde9ef;font:15px system-ui;margin:24px}table{border-collapse:collapse}td,th{padding:9px;border:1px solid #526170}section{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}img{width:100%}pre{white-space:pre-wrap}</style><h1>${escape(label)}</h1><p>${escape(report.outcome)} · ${report.assisted?'ASSISTED 15% incoming damage':'UNASSISTED'} · seed ${seed} · ${escape(report.clock)}</p><p>${escape(report.policy)}</p><a href="report.json">Full JSON</a> · <a href="trace.ndjson">Read state + native input trace</a><table><tr><th>Room</th><th>Result</th><th>Sim seconds</th><th>Damage taken</th><th>Ability damage</th><th>Heap MB</th><th>GPU geometry/texture</th></tr>${report.rooms.map(r=>`<tr><td>${escape(r.id)}</td><td>${escape(r.result)}</td><td>${r.seconds?.toFixed(1)}</td><td>${r.damageTaken?.toFixed(1)}</td><td>${r.damageDealt?.ability?.toFixed(1)}</td><td>${(r.memory?.heap/1e6)?.toFixed(1)}</td><td>${r.memory?.geometries}/${r.memory?.textures}</td></tr>`).join('')}</table><pre>${escape(JSON.stringify(report.defects,null,2))}</pre><section>${images}</section>`);
}
function listen(p) {
  p.setDefaultTimeout(20000);
  p.on('pageerror', e => report.errors.push({type:'pageerror',message:e.message}));
  p.on('console', m => {if(m.type()==='error') report.errors.push({type:'console',message:m.text()});});
  p.on('response', r => {if(r.status()>=400) report.errors.push({type:'http',message:`${r.status()} ${r.url()}`});});
}
async function enableNative() {
  await page.evaluate(({scale,realtime}) => {
    const d=window.__containmentDebug;
    d.nativeInput(true);d.presentation(true);if(scale<1)d.incomingDamageScale(scale);d.realtime(realtime);
  }, {scale:report.incomingDamageScale,realtime:!!options.realtime});
}
/** Reads geometry/navigation and camera matrices; never writes simulation state. */
async function snapshot() {
  return page.evaluate(() => {
    const d=window.__containmentDebug,g=d.game,r=d.renderer;
    const project=(x,y,height=.65)=>{
      const v=r.camera.position.clone().set(x/32,height,y/32).project(r.camera);
      return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,depth:v.z};
    };
    const enemies=g.enemies.snapshot.enemies.filter(e=>e.health>0).map(e=>({...e,clear:d.clearShot(e.x,e.y),visible:r.visible(e.x,e.y),screen:project(e.x,e.y)}));
    for(const t of g.targets().filter(t=>t.id<0&&t.health>0)) enemies.push({...t,type:'queen',clear:d.clearShot(t.x,t.y),visible:r.visible(t.x,t.y),screen:project(t.x,t.y),vulnerable:t.id!==-1||g.boss.snapshot.vulnerable});
    const nearest=[...enemies].sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y))[0];
    const waypoint=nearest ? g.navigation.waypoint({...g.player,radius:16},nearest,1)??nearest : null;
    const candidates=[];
    for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const length=Math.hypot(dx,dy)||1,x=g.player.x+dx/length*90,y=g.player.y+dy/length*90;
      let legal=true;
      for(let i=1;i<=6;i++) if(!d.canStand(g.player.x+(x-g.player.x)*i/6,g.player.y+(y-g.player.y)*i/6,19)) legal=false;
      if(g.abilities.blocksMovement(g.player,{x,y},19))legal=false;
      candidates.push({x,y,dx,dy,legal,waypoint,clear:nearest?d.clearShot(nearest.x,nearest.y,{x,y}):false});
    }
    const perf=window.__containmentPerformance;
    const slots=[...document.querySelectorAll('[data-ability]')].map(n=>({slot:n.dataset.ability,state:n.dataset.state,value:n.querySelector('.ability-value')?.textContent}));
    return {
      rig:g.abilities.snapshot.rig,status:g.status,uiState:document.body.dataset.state,phase:g.expedition.run.phase,
      run:g.expedition.run,build:g.expedition.build,node:g.node,elapsed:g.elapsed,player:{...g.player,screen:project(g.player.x,g.player.y)},
      combat:{...g.combat.snapshot,weapon:g.combat.snapshot.weaponId},resources:g.combat.getRunResources(),abilities:g.abilities.snapshot,enemies,candidates,
      hazards:[...g.pools,...g.bullets.filter(b=>b.kind==='hazard').map(b=>({x:b.x,y:b.y,radius:35})),...d.events.filter(e=>e.type==='enemy-warning'&&g.elapsed-e.at<(e.durationMs??800)/1000).map(e=>({x:e.targetX??e.x,y:e.targetY??e.y,radius:e.radius??50}))],
      remaining:g.encounterRemaining,stats:g.stats,events:d.events,performance:perf,
      memory:{heap:performance.memory?.usedJSHeapSize??null,geometries:perf.geometries,textures:perf.textures,programs:r.renderer.info.programs?.length??null},
      onboarding:{visible:!document.querySelector('#contextual-onboarding')?.hidden,copy:document.querySelector('#contextual-onboarding')?.textContent,seen:localStorage.getItem('containment.onboarding.v1')},
      hud:{slots,marine:r.playerScreenBounds(g.player.radius),health:document.querySelector('#health')?.textContent,magazine:document.querySelector('#magazine')?.textContent,opaqueBounds:['#status-hud','#action-bar','.vitals','#boss-hud','#radar-hud','#hud-toasts'].flatMap(selector=>{const el=document.querySelector(selector);if(!el||el.hidden||!el.getClientRects().length)return [];const b=el.getBoundingClientRect();return b.width&&b.height?[{id:selector,bounds:{left:b.left,top:b.top,right:b.right,bottom:b.bottom}}]:[];})},
      loading:r.roomLoading||document.querySelector('#world')?.getAttribute('aria-busy')==='true',
      actions:[...document.querySelectorAll('#overlay button:not(:disabled)')].filter(b=>!b.hidden&&b.getBoundingClientRect().width>0).map(b=>({id:b.id,mutation:b.dataset.mutation,route:b.dataset.route,purchase:b.dataset.purchase,text:b.textContent})),
      audio:window.__containmentPlaytestAudio?{starts:window.__containmentPlaytestAudio.starts,stops:window.__containmentPlaytestAudio.stops,loopsStarted:window.__containmentPlaytestAudio.loopsStarted,loopsStopped:window.__containmentPlaytestAudio.loopsStopped}:null,
    };
  });
}
async function shot(name,s) {
  const file=`${name}.png`,bytes=await page.screenshot({path:resolve(out,file)});
  report.screenshots.push(file);
  await writeFile(resolve(out,`${name}.json`),JSON.stringify(s,null,2));
  try{samplePng(bytes);}catch(error){report.defects.push({kind:'black-frame',area:'render',severity:'high',evidence:file,error:String(error)});}
  return bytes;
}
async function release() {
  for(const k of held) await page.keyboard.up(k);
  held.clear();
  if(shooting) await page.mouse.up();
  shooting=false;
}
async function move(dx,dy) {
  const next=new Set([dx>0?'d':dx<0?'a':null,dy>0?'s':dy<0?'w':null].filter(Boolean));
  for(const k of held)if(!next.has(k))await page.keyboard.up(k);
  for(const k of next)if(!held.has(k))await page.keyboard.down(k);
  held=next;
}
async function probe(label) {
  await release();
  const result=await checkpointProbe(page,{label,evidenceDir:resolve(out,'checkpoints'),onPage:listen});
  page=result.page;await enableNative();
  const {page:unused,...receipt}=result;report.checkpoints.push(receipt);
  if(!result.passed)report.defects.push({kind:'checkpoint',label,error:result.error,differences:result.comparison?.differences});
  return snapshot();
}
async function finishRoom(s,result) {
  if(!room||room.result!=='playing')return;
  room.result=result;room.seconds=s.elapsed-room.startedElapsed;
  room.damageTaken=s.stats.damageTaken-room.startStats.damageTaken;
  room.damageDealt=Object.fromEntries(Object.keys(s.stats.damageDealt).map(k=>[k,s.stats.damageDealt[k]-room.startStats.damageDealt[k]]));
  room.abilityUses=Object.fromEntries(Object.keys(s.stats.abilityUses).map(k=>[k,s.stats.abilityUses[k]-room.startStats.abilityUses[k]]));
  room.overdrives=s.stats.overdrivesUsed-room.startStats.overdrivesUsed;room.memory=s.memory;
  room.frame=s.performance.debugFixedStep?.updateRenderMs??null;room.frameScope=room.timingReset?'Latest 2048 ticks within this room; max/mean since room reset.':'Latest 2048 fixed ticks for percentiles; page-lifetime max. Not an isolated room distribution.';room.performance=s.performance;room.credits=s.combat.credits;
  room.audio=await readAudioSpy(page);
  await shot(`r${room.depth+1}-${room.id}-${result}`,s);
  await save();
}
try {
  await stat(resolve('dist/index.html'));
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
  server=createServer(async(req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve('dist',pathname.slice('/containment/'.length)||'index.html');
    if(!pathname.startsWith('/containment/')||!file.startsWith(resolve('dist')+'/'))return res.writeHead(404).end();
    try{res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({channel:'chromium',headless:!options.headed,args:['--no-sandbox','--enable-gpu','--ignore-gpu-blocklist',...(process.platform==='darwin'?['--use-angle=metal']:[])]});
  context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await installAudioSpy(context);
  page=await context.newPage();listen(page);
  await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=${seed}`);
  await page.waitForFunction(()=>!!window.__containmentDebug);
  await enableNative();
  report.gpu=await page.evaluate(()=>{const r=window.__containmentDebug.renderer,gl=r.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
  if(resumed){
    await page.evaluate(cp=>localStorage.setItem('containment-depth:run:v1',JSON.stringify(cp)),resumed.checkpoint);
    await page.reload();await page.waitForFunction(()=>!!window.__containmentDebug);await enableNative();await page.locator('#continue').click();
  }else{
  if(options.checkpoints)await probe('menu');
  await page.locator('#start').click();
  await page.waitForFunction(()=>window.__containmentDebug.game.expedition.run.phase==='rig-select');
  if(options.legacy) {
    // Untouched initial boundary only: no completed rooms, no boons, default resources.
    await page.evaluate(()=>{const key='containment-depth:run:v1',cp=JSON.parse(localStorage.getItem(key));if(cp.run.phase!=='rig-select'||cp.run.completedNodeIds.length||cp.build.mutations.length)throw Error('Legacy bootstrap requires untouched new run');cp.run.version=2;cp.run.currentNodeId=`${cp.run.seed}:v2-r0-combat`;delete cp.stats;localStorage.setItem(key,JSON.stringify(cp));});
    await page.reload();await page.waitForFunction(()=>!!window.__containmentDebug);await enableNative();await page.locator('#continue').click();
  }
  }
  assert.equal((await snapshot()).run.seed,seed,'Native Start must honor diagnostic seed');
  let previousSnapshot=null;const foundDefects=new Set();
  let loadingSince=null,loadingRecorded=false,screenSince=performance.now(),screenKey='',steps=0,stagnantSince=0,previousProgress='',probed=new Set();
  while(performance.now()-wallStart<maxWallSeconds*1000) {
    let s=await snapshot();last=s;
    for(const defect of detectSnapshotDefects(s,previousSnapshot)){const key=[defect.kind,defect.room,defect.slot??defect.panel??defect.entity??''].join(':');if(foundDefects.has(key))continue;foundDefects.add(key);const stem=`defect-${report.defects.length}`;defect.evidence=`${stem}.png`;report.defects.push(defect);await shot(stem,s);}
    previousSnapshot=s;
    if(s.loading) {
      if(loadingSince===null){loadingSince=performance.now();await release();}
      if(assessLoading(performance.now()-loadingSince,loadingRecorded).record) {
        loadingRecorded=true;report.defects.push({kind:'room-loading>5s',area:'render',severity:'medium',room:s.node.templateId,wallMs:performance.now()-loadingSince,evidence:`loading-${steps}.png`});
        await shot(`loading-${steps}`,s);await save();
      }
      if(assessLoading(performance.now()-loadingSince,loadingRecorded).timeout){report.outcome='loading-timeout';report.final=s;break;}
      await page.waitForTimeout(50);continue;
    }
    if(loadingSince!==null){report.loadingHolds??=[];report.loadingHolds.push({room:s.node.templateId,wallMs:performance.now()-loadingSince});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));s=await snapshot();last=s;}
    loadingSince=null;loadingRecorded=false;
    const key=`${s.node.id}:${s.status}:${s.phase}`;
    if(key!==screenKey){screenSince=performance.now();screenKey=key;}
    const checkpointKind=s.phase==='reward'&&s.actions.some(a=>a.id==='claim')?'shop':s.status==='route'&&s.actions.some(a=>a.id==='destroy-ship')?'destroy-confirm':s.phase;
    if(options.checkpoints&&!probed.has(checkpointKind)&&['rig-select','starting-boon','reward','route','shop','destroy-confirm'].includes(checkpointKind)) {
      probed.add(checkpointKind);s=await probe(checkpointKind);continue;
    }
    if(['dead','complete'].includes(s.status)) {
      await release();if(!options.realtime){await page.evaluate(()=>window.__containmentDebug.step(750));s=await snapshot();}
      await finishRoom(s,s.status);await shot(`terminal-${s.status}`,s);report.outcome=s.status;report.final=s;report.deathCause=s.status==='dead'?{classification:'inferred',sources:room?.damageSourcesInferred??{},nearby:s.enemies.map(e=>({type:e.type,distance:distance(e,s.player)})),hazards:s.hazards}:null;
      if(options.checkpoints){await probe(s.status);}
      break;
    }
    if(s.status!=='playing') {
      await release();
      if(s.phase==='rig-select') {
        await page.locator(`[data-rig="${rig}"]`).click();await page.locator('#equip-rig').click();
      } else if(s.status==='reward') {
        const ids=s.actions.map(a=>a.mutation).filter(Boolean);
        if(ids.length){const id=chooseBoon(ids,rig,s.build.mutations);await page.locator(`[data-mutation="${id}"]`).click();}
        else {
          const heal=s.actions.find(a=>a.purchase==='heal');
          if(s.combat.health<70&&heal)await page.locator('[data-purchase="heal"]').click();
          else if(s.actions.some(a=>a.id==='claim'))await page.locator('#claim').click();
        }
      } else if(s.status==='route') {
        if(s.actions.some(a=>a.id==='destroy-ship')) await page.locator('#destroy-ship').click();
        else {
          const routes=s.actions.filter(a=>a.route).map(a=>({id:a.route,kind:/medical/i.test(a.route)?'medical':/elite/i.test(a.route)?'elite':/armory/i.test(a.route)?'armory':'combat'}));
          const route=chooseRoute(routes,s.combat.health);
          if(route)await page.locator(`[data-route="${route.id}"]`).click();
        }
      } else if(s.status==='paused') await page.keyboard.press('Escape');
      if(performance.now()-screenSince>10000){report.defects.push({kind:'screen-without-progress',state:s.status,phase:s.phase,actions:s.actions});await shot('screen-stuck',s);report.outcome='screen-stuck';break;}
      if(!s.actions.length&&!options.realtime)await page.evaluate(()=>window.__containmentDebug.step(250));
      await page.waitForTimeout(30);continue;
    }
    if(room?.nodeId!==s.node.id) {
      if(room?.result==='playing')await finishRoom(s,'transition');
      if(report.rooms.filter(r=>r.result==='clear').length>=roomLimit){report.outcome='room-limit';report.final=s;break;}
      room={id:s.node.templateId,nodeId:s.node.id,depth:s.node.depth,startedElapsed:s.elapsed,startStats:s.stats,result:'playing',cpuSamples:[],damageSourcesInferred:{},memoryStart:s.memory,boons:[...s.build.mutations],loadingHolds:[]};
      room.timingReset=await page.evaluate(()=>{const d=window.__containmentDebug;if(!d.resetStepPerformance)return false;d.resetStepPerformance();return true;});
      room.abilityReceipts={};room.denials={};
      report.rooms.push(room);console.log(`${label}: room ${s.node.depth+1} ${s.node.templateId}`);
      await shot(`r${s.node.depth+1}-${room.id}-start`,s);
      previousProgress='';stagnantSince=s.elapsed;
    }
    if(options.checkpoints&&!probed.has('pause')&&probed.has('combat')&&s.elapsed-room.startedElapsed>4){await release();await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__containmentDebug.game.status==='paused');probed.add('pause');s=await probe('pause');room.result='checkpoint-interrupted';room=null;continue;}
    if(options.checkpoints&&!probed.has('combat')&&s.elapsed-room.startedElapsed>3) {
      probed.add('combat');s=await probe('combat');
      // Rollback is intentional. Restart this room measurement after re-choosing the boundary.
      room.result='checkpoint-interrupted';room=null;continue;
    }
    const target=chooseTarget(s.enemies.filter(e=>e.vulnerable!==false),s.player),movement=chooseMovement(s,{x:[...held].includes('d')?1:[...held].includes('a')?-1:0,y:[...held].includes('s')?1:[...held].includes('w')?-1:0});
    await move(movement.dx,movement.dy);
    if(target){const point={x:Math.max(4,Math.min(1916,target.screen.x)),y:Math.max(4,Math.min(1000,target.screen.y))};for(const action of pointerFirePlan(point,s.hud.marine,shooting)){if(action.type==='down'){await page.mouse.down();shooting=true;}else await page.mouse.move(action.x,action.y);}}
    else if(shooting){await page.mouse.up();shooting=false;}
    // Native weapon switching: rifle for ranged lanes; shotgun when a crowd closes in.
    const near=Math.min(Infinity,...s.enemies.map(e=>distance(e,s.player)));
    const ammo=s.resources.ammo;
    const desired=near<180&&ammo.shotgun.magazine+ammo.shotgun.reserve>0?'shotgun':ammo.rifle.magazine+ammo.rifle.reserve>0?'rifle':ammo.plasma.magazine+ammo.plasma.reserve>0?'plasma':'pistol';
    if(s.combat.weapon!==desired)await page.keyboard.press(String(['pistol','rifle','shotgun','plasma','rocket'].indexOf(desired)+1));
    const actions=chooseActions(s);
    for(const key of actions)await page.keyboard.press(key);
    const freshEvents=newEventReceipts(previousEvents,s.events);previousEvents=s.events;
    for(const e of freshEvents){if(e.type!=='ability'||!e.ability)continue;const a=e.ability,bucket=room.abilityReceipts[a.ability]??={phases:{},reportedDamage:0};bucket.phases[a.phase]=(bucket.phases[a.phase]??0)+1;bucket.reportedDamage+=a.totalDamage??0;if(a.phase==='denied')room.denials[a.denial]=(room.denials[a.denial]??0)+1;}
    const input={tick:steps++,elapsed:s.elapsed,room:s.node.templateId,dx:movement.dx,dy:movement.dy,target:target?.id,keys:actions,weapon:desired};
    report.inputs.push(input);
    await appendFile(resolve(out,'trace.ndjson'),JSON.stringify({input,events:freshEvents,state:{status:s.status,phase:s.phase,elapsed:s.elapsed,player:s.player,combat:s.combat,remaining:s.remaining,enemies:s.enemies.map(e=>({id:e.id,type:e.type,champion:e.champion,health:e.health,x:e.x,y:e.y,clear:e.clear,visible:e.visible})),stats:s.stats,abilities:s.abilities}})+'\n');
    if(options.realtime)await page.waitForTimeout(250);else await page.evaluate(()=>window.__containmentDebug.step(250));
    let after=await snapshot();last=after;
        room.performance=after.performance;room.peakDrawCalls=Math.max(room.peakDrawCalls??0,s.performance.drawCalls,after.performance.drawCalls);room.peakTriangles=Math.max(room.peakTriangles??0,s.performance.triangles,after.performance.triangles);
    if(after.stats.kills.total!==s.stats.kills.total||Math.floor(after.elapsed)%5===0)await save();
    const progress=`${after.stats.kills.total}:${after.remaining}:${Math.round(Object.values(after.stats.damageDealt).reduce((a,b)=>a+b,0))}`;
    if(progress!==previousProgress){previousProgress=progress;stagnantSince=after.elapsed;}
    if(after.elapsed-stagnantSince>45||after.elapsed-room.startedElapsed>Number(options['max-room-seconds']??240)) {
      report.defects.push({kind:after.elapsed-stagnantSince>45?'no-combat-progress-45s':'room-timeout',room:room.id,remaining:after.remaining,enemies:after.enemies.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,health:e.health})),evidence:`r${room.depth+1}-${room.id}-stalled.png`});
      await finishRoom(after,'stalled');report.outcome='stalled';report.final=after;break;
    }
    const pressure=after.enemies.length*5+(100-after.combat.health)*2;
    if(pressure>hardest+40&&after.status==='playing') {
      hardest=pressure;hardestFrames=[];report.hardestMoment={pressure,room:room.id,elapsed:after.elapsed};
      for(let frame=0;frame<4;frame++){hardestFrames.push(await shot(`hardest-${steps}-${frame}`,after));if(frame<3&&after.status==='playing'){if(options.realtime)await page.waitForTimeout(67);else await page.evaluate(()=>window.__containmentDebug.step(1000/15));after=await snapshot();last=after;await appendFile(resolve(out,'trace.ndjson'),JSON.stringify({burst:true,elapsed:after.elapsed,held:[...held],state:{status:after.status,player:after.player,stats:after.stats,enemies:after.enemies.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,health:e.health}))}})+'\n');}}
    }
    const delta=after.stats.damageTaken-s.stats.damageTaken;
    if(delta>0){const source=s.hazards.some(h=>distance(h,s.player)<h.radius+80)?'hazard-proximity':s.enemies.find(e=>distance(e,s.player)<140)?.type??'unknown';room.damageSourcesInferred[source]=(room.damageSourcesInferred[source]??0)+delta;}
    if(!room.mid&&after.elapsed-room.startedElapsed>3&&after.enemies.length) {room.mid=true;await shot(`r${room.depth+1}-${room.id}-mid`,after);}
    if(after.status!=='playing'&&after.status!=='paused') {
      await release();await finishRoom(after,after.status==='dead'?'dead':after.status==='complete'?'complete':'clear');
      if(room.result==='clear'&&report.rooms.filter(r=>r.result==='clear').length>=roomLimit){report.outcome='room-limit';report.final=after;break;}
    }
  }
  if(report.outcome==='running')report.outcome='wall-timeout';
} catch(error) {
  report.outcome='error';report.errors.push({type:'runner',message:String(error),stack:error.stack});
  if(page)await shot('failure',await snapshot().catch(()=>({}))).catch(()=>{});
} finally {
  if(last&&!report.final)report.final=last;
  if(hardestFrames.length){const sheet=stitchPngFrames(hardestFrames,640);await writeFile(resolve(out,'hardest-sprite.png'),sheet.png);report.screenshots.push('hardest-sprite.png');}
  await save();await browser?.close();await new Promise(ok=>server?server.close(ok):ok());
}
console.log(`${label}: ${report.outcome}; ${report.rooms.filter(r=>['clear','complete'].includes(r.result)).length} rooms cleared; ${report.errors.length} errors; ${out}/index.html`);
if(report.errors.length||report.defects.length||!['dead','complete','room-limit'].includes(report.outcome)||(options.rooms&&report.outcome==='dead'))process.exitCode=1;
