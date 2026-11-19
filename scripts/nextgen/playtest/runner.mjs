#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir, appendFile, stat, readdir} from 'node:fs/promises';
import {resolve, extname, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadavg,cpus} from 'node:os';
import {chromium} from 'playwright';
import {BOT_POLICY_VERSION, RIGS, chooseBoon, chooseRoute, chooseServicePurchase, chooseDetour, createHumanPolicy, quantiles, distance, pointerFirePlan, assessLoading, routeOptions} from './policy.mjs';
import {sampleWorldPng} from './visuals.mjs';
import {BOT_NAVIGATION_VERSION} from './bot-navigation-version.mjs';
import {loadEarnedBoundary} from './resume.mjs';
import {newEventReceipts} from './evidence.mjs';
import {detectSnapshotDefects} from './diagnostics.mjs';
import {installAudioSpy, readAudioSpy, checkpointProbe} from './lifecycle.mjs';
import {screenStateKey, screenProgressTimedOut} from './screen-progress.mjs';
import {stitchPngFrames} from '../sprites.mjs';
import {samplePng} from '../png.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
process.chdir(root);
const args = process.argv.slice(2);
const options = Object.fromEntries(args.map(arg => {
  assert(/^--[a-z-]+(?:=.*)?$/.test(arg), `Invalid argument ${arg}`);
  const [key, ...value] = arg.slice(2).split('=');
  assert(['startup-timeout-ms','difficulty','profile','rig','seed','rooms','label','headed','assisted','legacy','checkpoints','realtime','max-room-seconds','max-wall-seconds','resume-boundary','death-probe','checkpoint-screens','fast','dist-dir','storyboard-room'].includes(key), `Unknown option ${key}`);
  return [key, value.length ? value.join('=') : true];
}));
const distRoot=resolve(String(options['dist-dir']??'dist'));
const storyboardRoom=options['storyboard-room']??null;
const storyboardRooms=String(storyboardRoom??'').split(',').filter(Boolean);
const storyboardIntervalSeconds=.5;
assert(!storyboardRoom||typeof storyboardRoom==='string'&&storyboardRooms.every(id=>/^[a-z][a-z0-9-]+$/.test(id)),'Invalid storyboard room');
assert(!storyboardRoom||!options.fast&&!options.realtime,'Storyboards require the ordinary fixed clock with every tick rendered');
const checkpointScreens=options['checkpoint-screens']?new Set(String(options['checkpoint-screens']).split(',')):null;
if(checkpointScreens){options.checkpoints=true;for(const kind of checkpointScreens)assert(['menu','menu-settings','menu-controls','menu-credits','rig-select','starting-boon','combat','pause','pause-loadout','pause-settings','pause-controls','reward','route','shop','destroy-confirm','dead','complete'].includes(kind),`Unknown checkpoint screen ${kind}`);}
const shouldProbe=kind=>!!options.checkpoints&&(!checkpointScreens||checkpointScreens.has(kind));
const resumed=options['resume-boundary']?await loadEarnedBoundary(resolve(options['resume-boundary'])):null;
assert(!options.difficulty || ['story','standard','veteran'].includes(options.difficulty), 'difficulty must be story, standard or veteran');
const difficulty = options.difficulty ?? resumed?.parent.difficulty ?? 'standard';
const rig = options.rig ?? resumed?.parent.rig ?? 'arc', seed = Number(options.seed ?? resumed?.checkpoint.run.seed ?? 1729), roomLimit = Number(options.rooms ?? 20);
if(resumed){assert.equal(difficulty,resumed.parent.difficulty??'standard','Cannot change difficulty while resuming');assert.equal(rig,resumed.parent.rig,'Cannot change rig while resuming');assert.equal(seed,resumed.checkpoint.run.seed,'Cannot change seed while resuming');assert.equal(!!options.assisted,resumed.parent.assisted,'Cannot change assistance while resuming');}
assert(!(options.fast&&options.realtime),'Fast draw decimation cannot be combined with passive realtime observation');
assert(!(options.realtime&&options.assisted),'Passive live observation cannot reduce incoming damage; use fixed stepping for assisted coverage');
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
for(const file of ['runner.mjs','policy.mjs','ability-aim.ts','lifecycle.mjs','screen-progress.mjs','diagnostics.mjs','evidence.mjs','resume.mjs','visuals.mjs','bot-navigation.ts','bot-navigation-version.mjs']){const content=await readFile(resolve('scripts/nextgen/playtest',file));harnessHashes[file]=createHash('sha256').update(content).digest('hex');await writeFile(resolve(out,'source',file),content);}
const distributionAssets={};
for(const file of (await readdir(resolve(distRoot,'assets'))).filter(file=>/\.(js|css)$/.test(file)).sort())distributionAssets[file]=createHash('sha256').update(await readFile(resolve(distRoot,'assets',file))).digest('hex');
const distributionSourceSHA=await readFile(resolve(distRoot,'SOURCE_SHA'),'utf8').then(value=>value.trim()).catch(()=>null);
const human = createHumanPolicy(seed,options.profile??resumed?.parent.profile??'competent');
const report = {
  profile:human.profile, humanParameters:human.config,
  label, rig, seed, difficulty, hostLoad:{start:loadavg(),logicalCores:cpus().length}, distributionDirectory:distRoot, distributionSourceSHA, distributionAssets, assisted: !!options.assisted, incomingDamageScale: options.assisted ? .15 : 1,
  legacy: resumed?.parent.legacy??!!options.legacy, fastRendering:!!options.fast, lifecycleOnly:!!options['death-probe'], presentation:true, roomLimit, harnessHashes, head: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  branch: execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(), started: new Date().toISOString(),
  policyVersion:BOT_POLICY_VERSION, navigationVersion:BOT_NAVIGATION_VERSION,
  screenProgressGuard:'post-action-observation-v1',
  policy: `Seeded ${human.profile} human limits over native WASD/mouse: delayed warning attention, threat-load misses, lagged aim with error, movement commitments and input rate limits. Rig-path drafts, safer routes and native actions.`,
  clock: options.realtime ? 'native production RAF, passive observation; no audio/effect/core wrappers' : options.fast ? 'native fixed 60Hz; 100ms human-policy observations; scene/camera every tick, GPU draw at batch end' : 'native fixed 60Hz; 100ms human-policy observations; render every fixed tick',
  rooms: resumed?resumed.parent.rooms.filter(r=>['clear','complete'].includes(r.result)&&resumed.checkpoint.run.completedNodeIds.includes(r.nodeId)):[], errors: resumed?[...resumed.parent.errors]:[], defects: resumed?[...resumed.parent.defects]:[], checkpoints: [], screenshots: [], inputs: [], outcome: 'running',
  limitations: ['Legacy damageSourcesInferred uses proximity; topDamageSources and deathCause use the authoritative room ledger.', 'Accelerated CPU samples include rendering submission, not GPU completion; RAF diagnostics are separately retained.', 'A deterministic seed does not guarantee identical outcomes across policy/render timing; input trace is retained.', 'Audio spy tracks source lifecycle, not perceived sound quality.'],
};
if(storyboardRoom){
 report.storyboards=storyboardRooms.map(room=>({room,sampleIntervalSeconds:storyboardIntervalSeconds,frames:[],method:'Read-only PNG observations after existing native steps; no added simulation tick, input change, camera change or policy decision.'}));
 report.storyboard=report.storyboards[0];
}
const storyboardFor=id=>report.storyboards?.find(board=>board.room===id);
if(options.fast)report.limitations.push('Fast rendering omits intermediate GPU submissions only; timings/draw counts are not a production performance certificate. Preparation and evidence frames are fully drawn.');
if(options['death-probe'])report.policy='Separate lifecycle-only natural death fixture: native UI start, intentionally idle in the first fight; no damage/state injection. Excluded from campaign balance cohorts.';
if(resumed)report.continuation={source:resumed.source,parentLabel:resumed.parent.label,parentHead:resumed.parent.head,parentWallSeconds:resumed.parent.wallSeconds,provenRooms:resumed.checkpoint.run.completedNodeIds,explanation:'Continues a recorded earned boundary through real Continue; no unfought rooms are advanced.'};
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let previousEvents=[];
let browser, server, page, context, room, last, hardest = -1, hardestFrames = [], held = new Set(), shooting = false, wallStart = performance.now();
async function save() {
  report.hostLoad.latest=loadavg();
  report.wallSeconds = (performance.now()-wallStart)/1000;report.totalWallSeconds=report.wallSeconds+(resumed?.parent.totalWallSeconds??resumed?.parent.wallSeconds??0);
  await writeFile(resolve(out,'report.json'), JSON.stringify(report,null,2));
  const images = report.screenshots.map(f => `<figure><a href="${escape(f)}"><img loading="lazy" src="${escape(f)}"></a><figcaption>${escape(f)}</figcaption></figure>`).join('');
  await writeFile(resolve(out,'index.html'), `<!doctype html><meta charset="utf-8"><title>${escape(label)}</title><style>body{background:#111820;color:#dde9ef;font:15px system-ui;margin:24px}table{border-collapse:collapse}td,th{padding:9px;border:1px solid #526170}section{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}img{width:100%}pre{white-space:pre-wrap}</style><h1>${escape(label)}</h1><p>${escape(report.outcome)} · ${report.assisted?'ASSISTED 15% incoming damage':'UNASSISTED'} · seed ${seed} · ${escape(report.clock)}</p><p>${escape(report.policy)}</p><p>Encounter profile: ${report.profileTransition?'MIXED / UNKNOWN CONTINUATION':report.tuningEnabled===true?'I5 STORY PROFILE ENABLED':report.tuningEnabled===false?'PRE-TUNING PROFILE':'HISTORICAL'}</p><a href="report.json">Full JSON</a> · <a href="trace.ndjson">Read state + native input trace</a><table><tr><th>Room</th><th>Result</th><th>Sim seconds</th><th>Damage taken</th><th>Ability damage</th><th>Heap MB</th><th>GPU geometry/texture</th></tr>${report.rooms.map(r=>`<tr><td>${escape(r.id)}</td><td>${escape(r.result)}</td><td>${r.seconds?.toFixed(1)}</td><td>${r.damageTaken?.toFixed(1)}</td><td>${r.damageDealt?.ability?.toFixed(1)}</td><td>${(r.memory?.heap/1e6)?.toFixed(1)}</td><td>${r.memory?.geometries}/${r.memory?.textures}</td></tr>`).join('')}</table><pre>${escape(JSON.stringify(report.defects,null,2))}</pre><section>${images}</section>`);
}
function listen(p) {
  p.setDefaultTimeout(20000);
  p.on('pageerror', e => report.errors.push({type:'pageerror',message:e.message}));
  p.on('console', m => {if(m.type()==='error') report.errors.push({type:'console',message:m.text()});});
  p.on('response', r => {if(r.status()>=400) report.errors.push({type:'http',message:`${r.status()} ${r.url()}`});});
}
async function enableNative() {
  const tuningEnabled = await page.evaluate(({scale,realtime,fast,navigationVersion,policyVersion}) => {
    const d=window.__containmentDebug;
    if(!d.botWaypoint||d.botNavigationVersion!==navigationVersion)throw Error(`Rebuild dist for ${navigationVersion}; loaded ${d.botNavigationVersion??'unversioned navigation'}`);
    if(d.botPolicyVersion!==policyVersion)throw Error(`Rebuild dist for ${policyVersion}; loaded ${d.botPolicyVersion??'old policy'}`);
    if(realtime&&d.liveObservation!==true)throw Error('Rebuild dist for passive live observation');
    d.nativeInput(true);if(fast){if(!d.fastNativeRendering)throw Error('Rebuild dist for native fast rendering');d.fastNativeRendering(true);}d.presentation(true);if(scale<1)d.incomingDamageScale(scale);d.realtime(realtime);
    return typeof d.encounterTuningEnabled === 'boolean' ? d.encounterTuningEnabled : null;
  }, {scale:report.incomingDamageScale,realtime:!!options.realtime,fast:!!options.fast,navigationVersion:BOT_NAVIGATION_VERSION,policyVersion:BOT_POLICY_VERSION});
  if (typeof tuningEnabled === 'boolean') {
    report.tuningEnabled = tuningEnabled;
    if (resumed && resumed.parent.tuningEnabled !== tuningEnabled) {
      report.profileTransition = {from:resumed.parent.tuningEnabled ?? 'historical',to:tuningEnabled};
      report.limitations.push('This earned continuation changes or cannot establish the parent encounter profile; do not pool it with a single-profile balance cohort.');
    }
  }
}
/** Reads geometry/navigation and camera matrices; never writes simulation state. */
async function advance(milliseconds) {
  return page.evaluate(ms=>{const d=window.__containmentDebug;if(d.canStepNative===false||d.renderer.roomLoading||d.renderer.roomKey!==d.game.node.id)return false;d.step(ms);return true;},milliseconds);
}

async function snapshot() {
  return page.evaluate(() => {
    const d=window.__containmentDebug,g=d.game,r=d.renderer;
    const project=(x,y,height=.65)=>{
      const v=r.camera.position.clone().set(x/32,height,y/32).project(r.camera);
      return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,depth:v.z};
    };
    const enemies=g.enemies.snapshot.enemies.filter(e=>e.health>0).map(e=>({...e,burning:g.boonStatuses(e.id).burning,clear:d.clearShot(e.x,e.y),visible:r.visible(e.x,e.y),screen:project(e.x,e.y)}));
    for(const t of g.targets().filter(t=>t.id<0&&t.health>0)) enemies.push({...t,burning:g.boonStatuses(t.id).burning,type:'queen',clear:d.clearShot(t.x,t.y),visible:r.visible(t.x,t.y),screen:project(t.x,t.y),vulnerable:t.id!==-1||g.boss.snapshot.vulnerable});
    const nearest=[...enemies].sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y))[0];
    const siege=g.siege,goal=siege&&siege.remainingMs>0?siege:nearest;const waypoint=goal ? d.botWaypoint(goal)??goal : null;
    const candidates=[];
    for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const length=Math.hypot(dx,dy)||1,x=g.player.x+dx/length*90,y=g.player.y+dy/length*90;
      let legal=true;
      for(let i=1;i<=6;i++) if(!d.canStand(g.player.x+(x-g.player.x)*i/6,g.player.y+(y-g.player.y)*i/6,g.player.radius)) legal=false;
      if(g.abilities.blocksMovement(g.player,{x,y},g.player.radius))legal=false;
      candidates.push({x,y,dx,dy,legal,waypoint,rangedSightlines:enemies.filter(e=>e.type==='spitter'&&e.visible&&d.clearShot(e.x,e.y,{x,y})).map(e=>e.id),clear:nearest?d.clearShot(nearest.x,nearest.y,{x,y}):false});
    }
    const perf=window.__containmentPerformance;
    const slots=[...document.querySelectorAll('[data-ability]')].map(n=>({slot:n.dataset.ability,state:n.dataset.state,value:n.querySelector('.ability-value')?.textContent}));
    return {
      drill:g.awakeningDrill,encounterGuardian:d.encounterGuardian,rig:g.abilities.snapshot.rig,status:g.status,uiState:document.body.dataset.state,phase:g.expedition.run.phase,
      siege:g.siege,encounter:g.encounter,run:g.expedition.run,build:g.expedition.build,node:g.node,elapsed:g.elapsed,difficulty:g.difficulty,player:{...g.player,screen:project(g.player.x,g.player.y)},
      combat:{...g.combat.snapshot,weapon:g.combat.snapshot.weaponId},resources:g.combat.getRunResources(),abilities:g.abilities.snapshot,abilityAims:Object.fromEntries(Object.entries(d.botAbilityAims(enemies)).map(([slot,aim])=>[slot,aim?{...aim,screen:project(aim.x,aim.y,0)}:null])),enemies,candidates,
      hazards:[...(g.boss.snapshot.pendingTelegraph?[{x:g.boss.snapshot.pendingTelegraph.targetX,y:g.boss.snapshot.pendingTelegraph.targetY,radius:g.boss.snapshot.pendingTelegraph.radius,kind:'warning',visible:r.visible(g.boss.snapshot.pendingTelegraph.targetX,g.boss.snapshot.pendingTelegraph.targetY)}]:[]),...g.pools.map(p=>({id:`pool:${p.id}`,x:p.x,y:p.y,radius:p.radius,kind:'pool',visible:r.visible(p.x,p.y),warningRemainingMs:Math.max(0,p.warning)*1000})),...g.bullets.filter(b=>b.kind==='hazard').map(b=>({id:`shot:${b.sourceX}:${b.sourceY}:${b.request.angle}`,x:b.x,y:b.y,radius:35,collisionRadius:b.request.radius,kind:'projectile',visible:r.visible(b.x,b.y),vx:Math.cos(b.request.angle)*b.request.speed*g.abilities.hostileTimeScale,vy:Math.sin(b.request.angle)*b.request.speed*g.abilities.hostileTimeScale})),...enemies.filter(e=>e.pendingAttack==='spit'&&e.windupMs>0).map(e=>({id:`native:${e.id}`,x:e.lockX,y:e.lockY,radius:9,kind:'warning',warningRemainingMs:e.windupMs,visible:r.visible(e.lockX,e.lockY)})),...d.events.filter(e=>e.type==='enemy-warning'&&!e.meleeShape&&e.id===undefined&&g.elapsed-e.at<(e.durationMs??800)/1000).map(e=>({x:e.targetX??e.x,y:e.targetY??e.y,radius:e.radius??50,kind:'warning',warningRemainingMs:Math.max(0,(e.durationMs??800)-(g.elapsed-e.at)*1000),visible:r.visible(e.targetX??e.x,e.targetY??e.y)}))],
      boss:g.boss.snapshot,remaining:g.encounterRemaining,stats:g.stats,topDamageSources:g.roomDamage,events:d.events,performance:perf,preparation:r.preparationDiagnostics??[],
      memory:{heap:performance.memory?.usedJSHeapSize??null,geometries:perf.geometries,textures:perf.textures,programs:r.renderer.info.programs?.length??null},
      visualOverlays:['#presentation-beat','#contextual-onboarding'].flatMap(selector=>{const el=document.querySelector(selector);if(!el||el.hidden||!el.getClientRects().length)return [];const b=el.getBoundingClientRect();return [{left:b.left,top:b.top,right:b.right,bottom:b.bottom}];}),
      onboarding:{visible:!document.querySelector('#contextual-onboarding')?.hidden,copy:document.querySelector('#contextual-onboarding')?.textContent,seen:localStorage.getItem('containment.onboarding.v1')},
      hud:{slots,insets:{...r.hudInsets},framing:r.combatFramingDiagnostics?{...r.combatFramingDiagnostics,selectedIds:[...r.combatFramingDiagnostics.selectedIds]}:null,viewport:{width:innerWidth,height:innerHeight},marine:r.playerScreenBounds(g.player.radius),health:document.querySelector('#health')?.textContent,magazine:document.querySelector('#magazine')?.textContent,opaqueBounds:['#status-hud','#action-bar','.vitals','#boss-hud','#radar-hud','#hud-toasts'].flatMap(selector=>{const el=document.querySelector(selector);if(!el||el.hidden||!el.getClientRects().length)return [];const b=el.getBoundingClientRect();return b.width&&b.height?[{id:selector,obscuresThreat:el.dataset.obscuresThreat==='true',opacity:getComputedStyle(el).opacity,bounds:{left:b.left,top:b.top,right:b.right,bottom:b.bottom}}]:[];})},
      loading:r.roomLoading||d.canStepNative===false||r.roomKey!==g.node.id||document.querySelector('#world')?.getAttribute('aria-busy')==='true',
      actions:[...document.querySelectorAll('#overlay button:not(:disabled)')].filter(b=>!b.hidden&&b.getBoundingClientRect().width>0).map(b=>({id:b.id,mutation:b.dataset.mutation,route:b.dataset.route,inspect:b.dataset.inspectRoute,purchase:b.dataset.purchase,detour:b.dataset.detour,text:b.textContent})),
      audio:window.__containmentPlaytestAudio?{starts:window.__containmentPlaytestAudio.starts,stops:window.__containmentPlaytestAudio.stops,loopsStarted:window.__containmentPlaytestAudio.loopsStarted,loopsStopped:window.__containmentPlaytestAudio.loopsStopped}:null,
    };
  });
}
async function shot(name,s) {
  const file=`${name}.png`,bytes=await page.screenshot({path:resolve(out,file)});
  report.screenshots.push(file);
  // Save actual body extents only at evidence frames; policy and native inputs are unchanged.
  if(s.status==='playing'&&!s.loading)s.framingEvidence=await page.evaluate(()=>{
    const d=window.__containmentDebug,g=d.game,r=d.renderer,i=r.hudInsets;
    const selected=r.combatFramingDiagnostics?.focusedPair?[r.combatFramingDiagnostics.focusContactId]:r.combatFramingDiagnostics?.selectedIds??[];
    const contacts=g.enemies.snapshot.enemies.filter(e=>e.health>0).map(e=>{
      const point=r.camera.position.clone(),height=r.actors.get(e.id)?.height??2;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
      for(const ix of [-1,1])for(const iz of [-1,1])for(const iy of [0,1]){point.set((e.x+ix*e.radius)/32,iy*height,(e.y+iz*e.radius)/32).project(r.camera);const x=(point.x+1)*innerWidth/2,y=(1-point.y)*innerHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      return{id:e.id,type:e.type,selected:selected.includes(e.id),bounds:{left,right,top,bottom},insideUsable:left>=i.left&&right<=innerWidth-i.right&&top>=i.top&&bottom<=innerHeight-i.bottom};
    });
    if(g.boss.snapshot.active){
      const bounds={left:0,right:0,top:0,bottom:0};
      if(r.actorScreenBounds(-1,g.boss.snapshot.x,g.boss.snapshot.y,92,bounds))contacts.push({id:-1,type:'queen',selected:selected.includes(-1),bounds,insideUsable:bounds.left>=i.left&&bounds.right<=innerWidth-i.right&&bounds.top>=i.top&&bounds.bottom<=innerHeight-i.bottom});
    }
    return{contacts,insets:{...i},marine:r.playerScreenBounds(g.player.radius),framing:r.combatFramingDiagnostics,roomFraming:r.roomCombatFraming?{...r.roomCombatFraming.diagnostics}:null};
  });
  await writeFile(resolve(out,`${name}.json`),JSON.stringify(s,null,2));
  try{samplePng(bytes);}catch(error){report.defects.push({kind:'black-frame',area:'render',severity:'high',evidence:file,error:String(error)});}
  if(s.status==='playing'&&!s.loading){const world=sampleWorldPng(bytes,[...(s.hud?.opaqueBounds??[]),...(s.visualOverlays??[])]);if(world.likelyBlank)report.defects.push({kind:'blank-world-behind-hud',area:'render',severity:'high',evidence:file,samples:world});}
  return bytes;
}
/** Register an existing evidence frame without changing native input or advancing the clock. */
function recordStoryboard(beat,name,s) {
  const board=storyboardFor(room?.id);if(!board)return;
  board.frames.push({
    beat,file:`${name}.png`,snapshot:`${name}.json`,room:room.id,nodeId:room.nodeId,
    elapsed:s.elapsed,roomSeconds:s.elapsed-room.startedElapsed,status:s.status,phase:s.phase,
    remaining:s.remaining,kills:s.stats.kills.total,inputs:report.inputs.length,
    held:[...held],shooting,input:report.inputs.at(-1)??null,
  });
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
  room.damageTaken=s.stats.damageTaken-room.startStats.damageTaken;room.topDamageSources=s.topDamageSources;
  room.damageDealt=Object.fromEntries(Object.keys(s.stats.damageDealt).map(k=>[k,s.stats.damageDealt[k]-room.startStats.damageDealt[k]]));
  room.abilityUses=Object.fromEntries(Object.keys(s.stats.abilityUses).map(k=>[k,s.stats.abilityUses[k]-room.startStats.abilityUses[k]]));
  room.overdrives=s.stats.overdrivesUsed-room.startStats.overdrivesUsed;room.memory=s.memory;
  room.frame=options.realtime?s.performance.nativeUpdateRenderMs:s.performance.debugFixedStep?.updateRenderMs??null;room.frameScope=options.realtime?s.performance.nativeUpdateRenderMs?.scope:room.timingReset?'Latest 2048 ticks within this room; max/mean since room reset.':'Latest 2048 fixed ticks for percentiles; page-lifetime max. Not an isolated room distribution.';room.performance=s.performance;room.credits=s.combat.credits;
  room.audio=await readAudioSpy(page);
  const name=`r${room.depth+1}-${room.id}-${result}`;
  await shot(name,s);
  recordStoryboard(result,name,s);
  await save();
}
try {
  await stat(resolve(distRoot,'index.html'));
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
  server=createServer(async(req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(distRoot,pathname.slice('/containment/'.length)||'index.html');
    if(!pathname.startsWith('/containment/')||!file.startsWith(distRoot+'/'))return res.writeHead(404).end();
    try{res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}
  });
  await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({channel:'chromium',headless:!options.headed,args:['--no-sandbox','--enable-gpu','--ignore-gpu-blocklist',...(process.platform==='darwin'?['--use-angle=metal']:[])]});
  context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  if(!options.realtime)await installAudioSpy(context);
  page=await context.newPage();page.setDefaultTimeout(Number(options['startup-timeout-ms']??30000));listen(page);
  await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=${seed}${options.realtime?'&playtest-live=1':''}`);
  await page.waitForFunction(()=>!!window.__containmentDebug);
  await enableNative();
  report.gpu=await page.evaluate(()=>{const r=window.__containmentDebug.renderer,gl=r.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
  if(resumed){
    await page.evaluate(cp=>localStorage.setItem('containment-depth:run:v1',JSON.stringify(cp)),resumed.checkpoint);
    await page.reload();await page.waitForFunction(()=>!!window.__containmentDebug);await enableNative();await page.locator('#continue').click();
  }else{
  if(shouldProbe('menu'))await probe('menu');
  for(const [kind,selector]of [['menu-settings','#settings'],['menu-controls','#controls'],['menu-credits','#menu-credits']])if(shouldProbe(kind)){await page.locator(selector).click();await page.locator(kind==='menu-settings'?'.configuration-drawer':kind==='menu-controls'?'.controls-drawer':'.credits-drawer').waitFor({state:'visible'});await probe(kind);}
  await page.locator('#start').click();
  const difficultyCard = page.locator(`[data-difficulty="${difficulty}"]`);
  await difficultyCard.click();
  await page.locator('#difficulty-begin').click();
  await page.waitForFunction(()=>window.__containmentDebug.game.expedition.run.phase==='rig-select');
  if(options.legacy) {
    await page.locator(`[data-rig="${rig}"]`).click();await page.locator('#equip-rig').click();
    await page.evaluate(({seed,rig})=>window.__containmentDebug.startLegacyRun(seed,rig),{seed,rig});
    const initial=await snapshot();
    report.legacyBootstrap={method:'Guarded initial legacy campaign factory after native rig selection; legacy has no title-menu entry.',run:initial.run,build:initial.build,resources:initial.resources,stats:initial.stats};
    assert.equal(initial.run.version,2);assert.equal(initial.node.depth,0);assert.equal(initial.run.completedNodeIds.length,0);assert.equal(initial.build.mutations.length,0);
  }
  }
  assert.equal((await snapshot()).run.seed,seed,'Native Start must honor diagnostic seed');
  assert.equal(await page.evaluate(()=>window.__containmentDebug.game.difficulty),difficulty,'Native start must honor selected difficulty');
  let previousSnapshot=null;const foundDefects=new Set();
  let loadingSince=null,loadingHost=null,loadingRecorded=false,screenSince=performance.now(),screenKey='',steps=0,stagnantSince=0,previousProgress='',probed=new Set();
  while(performance.now()-wallStart<maxWallSeconds*1000) {
    let s=await snapshot();last=s;
    for(const defect of detectSnapshotDefects(s,previousSnapshot)){const key=[defect.kind,defect.room,defect.slot??defect.panel??defect.entity??''].join(':');if(foundDefects.has(key))continue;foundDefects.add(key);const stem=`defect-${report.defects.length}`;defect.evidence=`${stem}.png`;report.defects.push(defect);await shot(stem,s);}
    previousSnapshot=s;
    if(s.loading) {
      if(loadingSince===null){loadingSince=performance.now();loadingHost=loadavg();await release();}
      if(assessLoading(performance.now()-loadingSince,loadingRecorded).record) {
        loadingRecorded=true;report.defects.push({kind:'room-loading>5s',area:'render',severity:'medium',room:s.node.templateId,wallMs:performance.now()-loadingSince,hostLoad:{start:loadingHost,observed:loadavg()},evidence:`loading-${steps}.png`});
        await shot(`loading-${steps}`,s);await save();
      }
      if(assessLoading(performance.now()-loadingSince,loadingRecorded).timeout){report.outcome='loading-timeout';report.final=s;break;}
      await page.waitForTimeout(50);continue;
    }
    if(loadingSince!==null){
      const wallMs=performance.now()-loadingSince,finishedLoad=loadavg();
      report.loadingHolds??=[];
      report.loadingHolds.push({room:s.node.templateId,wallMs,hostLoad:{start:loadingHost,end:finishedLoad}});
      console.log(`${label}: ${s.node.templateId} hold ${wallMs.toFixed(0)} ms (load1m ${loadingHost[0].toFixed(2)} → ${finishedLoad[0].toFixed(2)}, ${report.hostLoad.logicalCores} cores)`);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));s=await snapshot();last=s;
    }
    loadingSince=null;loadingHost=null;loadingRecorded=false;
    const key=screenStateKey(s);
    if(key!==screenKey){screenSince=performance.now();screenKey=key;}
    const checkpointKind=s.phase==='reward'&&s.actions.some(a=>a.id==='claim')?'shop':s.status==='route'&&s.actions.some(a=>a.id==='destroy-ship')?'destroy-confirm':s.phase;
    if(shouldProbe(checkpointKind)&&!probed.has(checkpointKind)&&['rig-select','starting-boon','reward','route','shop','destroy-confirm'].includes(checkpointKind)) {
      probed.add(checkpointKind);s=await probe(checkpointKind);continue;
    }
    if(['dead','complete'].includes(s.status)) {
      await release();if(!options.realtime){await advance(750);s=await snapshot();}
      await finishRoom(s,s.status);await page.waitForFunction(()=>['dead','complete'].includes(document.body.dataset.state));await page.waitForTimeout(220);s=await snapshot();await shot(`terminal-${s.status}`,s);report.outcome=s.status;report.final=s;report.deathCause=s.status==='dead'?{classification:'authoritative-room-ledger',sources:s.topDamageSources??[],nearby:s.enemies.map(e=>({type:e.type,distance:distance(e,s.player)})),hazards:s.hazards}:null;
      if(shouldProbe(s.status)){await probe(s.status);}
      break;
    }
    if(s.status!=='playing') {
      await release();
      if(s.status==='reward'&&['medical','armory'].includes(s.node.kind)&&s.run.completedNodeIds.includes(s.node.id)&&!report.rooms.some(r=>r.nodeId===s.node.id)){report.rooms.push({id:s.node.templateId,nodeId:s.node.id,depth:s.node.depth,nodeKind:s.node.kind,openingGrammar:s.encounter?.grammar,holdout:!report.legacy&&[9,19].includes(s.node.depth),guardian:s.encounterGuardian,result:'clear',autoClear:true,seconds:0,damageTaken:0,damageDealt:{weapon:0,ability:0,status:0,boon:0},abilityUses:{dash:0,tactical:0,power:0,overdrive:0},overdrives:0,boons:s.build.mutations,memoryStart:s.memory,memory:s.memory,performance:s.performance,credits:s.combat.credits});await shot(`r${s.node.depth+1}-${s.node.templateId}-clear`,s);await save();}
      if(s.phase==='rig-select') {
        if(rig==='cryo'&&!report.legacy)await page.locator('#recommended-loadout').click();
        else {await page.locator(`[data-rig="${rig}"]`).click();await page.locator('#equip-rig').click();}
      } else if(s.status==='reward') {
        const ids=s.actions.map(a=>a.mutation).filter(Boolean);
        if(ids.length){const id=chooseBoon(ids,rig,s.build.mutations);await page.locator(`[data-mutation="${id}"]`).click();}
        else {
          const purchase=chooseServicePurchase(s.actions.map(a=>a.purchase).filter(Boolean),s.combat,s.build,s.run);
          if(purchase)await page.locator(`[data-purchase="${purchase}"]`).click();
          else if(s.actions.some(a=>a.id==='claim'))await page.locator('#claim').click();
        }
      } else if(s.status==='route') {
        if(s.actions.some(a=>a.id==='destroy-ship')) await page.locator('#destroy-ship').click();
        else {
          const routes=routeOptions(s.actions);
          const route=chooseRoute(routes,s.combat.health);
          if(s.actions.some(a=>a.detour)){await page.locator(`[data-detour="${chooseDetour(s.combat)}"]`).click();}
          else if(route){if(s.actions.some(a=>a.inspect===route.id))await page.locator(`[data-inspect-route="${route.id}"]`).last().click();await page.locator(`[data-route="${route.id}"]`).click();}
        }
      } else if(s.status==='paused') await page.keyboard.press('Escape');
      if(performance.now()-screenSince>10000){
        // A slow click/capture may already have entered the next screen or room.
        // Never report the stale pre-click snapshot as a live no-progress state.
        const current=await snapshot();last=current;
        if(screenProgressTimedOut(s,current,performance.now()-screenSince)){
          report.defects.push({kind:'screen-without-progress',state:current.status,phase:current.phase,actions:current.actions});await shot('screen-stuck',current);report.outcome='screen-stuck';break;
        }
        const currentKey=screenStateKey(current);
        if(currentKey!==key){screenKey=currentKey;screenSince=performance.now();}
        continue;
      }
      if(!s.actions.length&&!options.realtime)await advance(250);
      await page.waitForTimeout(30);continue;
    }
    if(room?.nodeId!==s.node.id) {
      if(room?.result==='playing')await finishRoom(s,'transition');
      if(report.rooms.filter(r=>r.result==='clear').length>=roomLimit){report.outcome='room-limit';report.final=s;break;}
      room={id:s.node.templateId,nodeId:s.node.id,depth:s.node.depth,nodeKind:s.node.kind,openingGrammar:s.encounter?.grammar,holdout:!report.legacy&&[9,19].includes(s.node.depth),guardian:s.encounterGuardian,startedElapsed:s.elapsed,startStats:s.stats,result:'playing',cpuSamples:[],damageSourcesInferred:{},memoryStart:s.memory,boons:[...s.build.mutations],loadingHolds:[]};
      room.timingReset=await page.evaluate(()=>{const d=window.__containmentDebug;if(!d.resetStepPerformance)return false;d.resetStepPerformance();return true;});
      room.abilityReceipts={};room.denials={};
      report.rooms.push(room);console.log(`${label}: room ${s.node.depth+1} ${s.node.templateId}`);
      const entryName=`r${s.node.depth+1}-${room.id}-start`;
      await shot(entryName,s);
      recordStoryboard('entry',entryName,s);
      if(storyboardFor(room.id))room.nextStoryboardSecond=storyboardIntervalSeconds;
      previousProgress='';stagnantSince=s.elapsed;
    }
    const pauseProbe=['pause','pause-loadout','pause-settings','pause-controls'].find(kind=>shouldProbe(kind)&&!probed.has(kind));
    if(pauseProbe&&(!shouldProbe('combat')||probed.has('combat'))&&s.elapsed-room.startedElapsed>4){await release();await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__containmentDebug.game.status==='paused');if(pauseProbe!=='pause')await page.locator(`[data-pause-tab="${pauseProbe.slice(6)}"]`).click();probed.add(pauseProbe);s=await probe(pauseProbe);room.result='checkpoint-interrupted';room=null;continue;}
    if(shouldProbe('combat')&&!probed.has('combat')&&s.elapsed-room.startedElapsed>3) {
      probed.add('combat');s=await probe('combat');
      // Rollback is intentional. Restart this room measurement after re-choosing the boundary.
      room.result='checkpoint-interrupted';room=null;continue;
    }
    const decision=human.decide(s);
    const target=options['death-probe']?null:decision.target,movement=options['death-probe']?{dx:0,dy:0}:decision.movement;
    await move(movement.dx,movement.dy);
    if(target){const point={x:Math.max(4,Math.min(1916,target.screen.x)),y:Math.max(4,Math.min(1000,target.screen.y))};for(const action of pointerFirePlan(point,s.hud.marine,shooting)){if(action.type==='down'){await page.mouse.down();shooting=true;}else await page.mouse.move(action.x,action.y);}}
    else if(shooting){await page.mouse.up();shooting=false;}
    // Native weapon switching: rifle for ranged lanes; shotgun when a crowd closes in.
    const desired=decision.weapon;
    if(s.combat.weapon!==desired)await page.keyboard.press(String(['pistol','rifle','shotgun','plasma','rocket'].indexOf(desired)+1));
    const actions=options['death-probe']?[]:decision.actions;
    for(const key of actions){
      const slot={q:'tactical',f:'power',v:'overdrive'}[key],aim=slot?s.abilityAims[slot]:null;
      if(aim)await page.mouse.move(Math.max(4,Math.min(1916,aim.screen.x)),Math.max(4,Math.min(1000,aim.screen.y)));
      await page.keyboard.press(key);
      if(aim&&target)await page.mouse.move(Math.max(4,Math.min(1916,target.screen.x)),Math.max(4,Math.min(1000,target.screen.y)));
    }
    if(target)await page.mouse.move(Math.max(4,Math.min(1916,target.screen.x)),Math.max(4,Math.min(1000,target.screen.y)));
    const freshEvents=newEventReceipts(previousEvents,s.events);previousEvents=s.events;
    for(const e of freshEvents){if(e.type!=='ability'||!e.ability)continue;const a=e.ability,bucket=room.abilityReceipts[a.ability]??={phases:{},reportedDamage:0};bucket.phases[a.phase]=(bucket.phases[a.phase]??0)+1;bucket.reportedDamage+=a.totalDamage??0;if(a.phase==='denied')room.denials[a.denial]=(room.denials[a.denial]??0)+1;}
    const input={tick:steps++,elapsed:s.elapsed,room:s.node.templateId,dx:movement.dx,dy:movement.dy,target:target?.id,aim:target?{screen:{x:Math.max(4,Math.min(1916,target.screen.x)),y:Math.max(4,Math.min(1000,target.screen.y))},world:{x:target.x,y:target.y}}:null,fire:!!target,stepMs:decision.stepMs,keys:actions,abilityAims:s.abilityAims,weapon:desired};
    report.inputs.push(input);
    await appendFile(resolve(out,'trace.ndjson'),JSON.stringify({input,events:freshEvents,state:{status:s.status,phase:s.phase,elapsed:s.elapsed,player:s.player,combat:s.combat,remaining:s.remaining,enemies:s.enemies.map(e=>({id:e.id,type:e.type,champion:e.champion,health:e.health,x:e.x,y:e.y,clear:e.clear,visible:e.visible})),stats:s.stats,abilities:s.abilities}})+'\n');
    if(options.realtime)await page.waitForTimeout(decision.stepMs);else await advance(decision.stepMs);
    let after=await snapshot();last=after;
        if(options.realtime&&after.status==='playing'&&after.elapsed-room.startedElapsed>4){room.nativeFrameWindows??=[];room.nativeFrameWindows.push({...after.performance.nativeUpdateRenderMs,elapsed:after.elapsed});}
    room.performance=after.performance;room.peakDrawCalls=Math.max(room.peakDrawCalls??0,s.performance.drawCalls,after.performance.drawCalls);room.peakTriangles=Math.max(room.peakTriangles??0,s.performance.triangles,after.performance.triangles);
    if(after.stats.kills.total!==s.stats.kills.total||Math.floor(after.elapsed/5)!==Math.floor(s.elapsed/5))await save();
    const progress=`${Math.ceil((after.siege?.remainingMs??0)/1000)}:${after.stats.kills.total}:${after.remaining}:${Math.round(Object.values(after.stats.damageDealt).reduce((a,b)=>a+b,0))}`;
    if(progress!==previousProgress){previousProgress=progress;stagnantSince=after.elapsed;}
    if(after.elapsed-stagnantSince>45||after.elapsed-room.startedElapsed>Number(options['max-room-seconds']??240)) {
      report.defects.push({kind:after.elapsed-stagnantSince>45?'no-combat-progress-45s':'room-timeout',room:room.id,remaining:after.remaining,enemies:after.enemies.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,health:e.health})),evidence:`r${room.depth+1}-${room.id}-stalled.png`});
      await finishRoom(after,'stalled');report.outcome='stalled';report.final=after;break;
    }
    const pressure=after.enemies.length*5+(100-after.combat.health)*2;
    if(pressure>hardest+40&&after.status==='playing') {
      hardest=pressure;hardestFrames=[];report.hardestMoment={pressure,room:room.id,elapsed:after.elapsed};
      for(let frame=0;frame<4;frame++){hardestFrames.push(await shot(`hardest-${steps}-${frame}`,after));if(frame<3&&after.status==='playing'){if(options.realtime)await page.waitForTimeout(67);else await advance(1000/15);after=await snapshot();last=after;await appendFile(resolve(out,'trace.ndjson'),JSON.stringify({burst:true,stepMs:1000/15,aim:input.aim,fire:shooting,elapsed:after.elapsed,held:[...held],state:{status:after.status,player:after.player,stats:after.stats,enemies:after.enemies.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,health:e.health}))}})+'\n');}}
    }
    if(storyboardFor(room.id)&&after.status==='playing'&&!after.loading&&after.elapsed-room.startedElapsed>=room.nextStoryboardSecond) {
      const name=`play-r${room.depth+1}-${room.id}-${String(storyboardFor(room.id).frames.length).padStart(3,'0')}`;
      await shot(name,after);
      recordStoryboard('fight',name,after);
      room.nextStoryboardSecond=(Math.floor((after.elapsed-room.startedElapsed)/storyboardIntervalSeconds)+1)*storyboardIntervalSeconds;
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
