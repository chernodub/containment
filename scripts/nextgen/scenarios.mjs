import {INTEGRATION_SETTINGS_SCENARIO} from './integration-settings.mjs';
import {ABILITY_SCENARIOS,DESKTOP_ABILITY_SCENARIO} from './ability-scenarios.mjs';
export const DEFAULT_ROOMS=['awakening-bay','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','service-shaft-landing','infested-workshop','containment-annulus','overload-floor'];

// Declarative entries are expanded by capture.mjs. setup runs in the real page;
// use only browser globals and the debug hook inside these small functions.
// The same legal heavy fixture with a settled diagnostics window, for render-cost comparisons.
// Inline the existing staging function into this page-evaluated setup instead of adding globals.
function benchmarkSetup(tier,algorithm='gtao',status=false,nativeRoom=false){
 return new Function('room',`return (async()=>{
  const d=window.__containmentDebug;
  const prepare=d.renderer.prepare;if(${nativeRoom})d.renderer.prepare=async node=>{d.renderer.loadRoom(node);for(let i=0;i<900&&d.renderer.roomLoading;i++)await new Promise(requestAnimationFrame);if(d.renderer.roomLoading)throw Error('Native room assets did not settle');d.refresh();};
  try{await d.gotoRoom(room);}finally{d.renderer.prepare=prepare;}d.renderer.setQuality(${JSON.stringify(tier)});d.renderer.setAmbientOcclusionAlgorithm?.(${JSON.stringify(algorithm)});
  if(${status})d.grantBoons(['cryogenic','permafrost','absolute-zero','incendiary','caustic-rounds','arc-filament','conductive-shell','cryo-conductor']);
  const gl=d.renderer.renderer.getContext(),create=gl.createProgram;const oldPrograms=new Set(d.renderer.renderer.info.programs);let compiled=0;gl.createProgram=function(){compiled++;return create.call(gl);};
  try{(${stageCombat.toString()})({status:${status}});}finally{gl.createProgram=create;}
  d.shaderCompilations=compiled;if(d.renderer.materialWarmup&&compiled)throw Error('Combat created '+compiled+' unprepared GPU programs '+JSON.stringify(d.renderer.renderer.info.programs.filter(p=>!oldPrograms.has(p)).map(p=>{const s=gl.getShaderSource(p.fragmentShader);return {name:p.name,points:s.match(/uniform PointLight pointLights\\[ ?([0-9]+)/)?.[1],flags:s.match(/#define USE_[A-Z_]+/g),actor:s.includes('actorRimStrength'),floor:s.includes('roomFloorGrime'),key:p.cacheKey.slice(-100)};})));
  for(let i=0;i<480;i++)await new Promise(requestAnimationFrame);
  const visible=d.game.enemies.snapshot.enemies.filter(e=>d.renderer.visible(e.x,e.y));
  if(visible.length<12)throw Error('Settled heavy benchmark lost visible threats');
  d.refresh();

 })();`);
}

export async function stageKiting(room, options={}){
  const d=window.__containmentDebug,g=d.game;await d.gotoRoom(room,options.live?{rig:'arc'}:{});if(options.tier){d.renderer.setQuality(options.tier);await d.prepare();}d.invulnerable(true);d.measureLuminance=true;g.enemies.reset();
  const bounds=g.geometry.bounds,candidates=[];
  for(let y=150;y<bounds.height-150;y+=70)for(let x=150;x<bounds.width-150;x+=70)for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
   if(!d.canStand(x,y,28)||!d.canStand(x-Math.cos(angle)*100,y-Math.sin(angle)*100,28))continue;
   let score=0;for(const range of [170,230,290,350])for(let i=0;i<7;i++){const a=angle+(i-3)*.24,p={x:x+Math.cos(a)*range,y:y+Math.sin(a)*range};if(d.canStand(p.x,p.y,28)&&d.clearShot(p.x,p.y,{x,y}))score++;}
   candidates.push({x,y,angle,score});
  }
  candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('No legal kiting lane');
  const lane=candidates[0];Object.assign(g.player,{x:lane.x,y:lane.y,angle:lane.angle});d.setInput({x:0,y:0,fire:false,angle:lane.angle,autoAim:false});d.step(600);
  const enemies=[];for(const range of (options.live?[140,190,240,290]:[170,230,290,350]))for(let i=0;i<7&&enemies.length<12;i++){
   const angle=lane.angle+(i-3)*.24,p={x:lane.x+Math.cos(angle)*range,y:lane.y+Math.sin(angle)*range};
   if(!d.canStand(p.x,p.y,28)||!d.clearShot(p.x,p.y)||enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y )<(options.live?45:55)))continue;
   const id=d.spawn(['brute','crawler','spitter','stalker','crawler','carrier'][enemies.length%6],p.x,p.y,enemies.length%5===0);if(id)enemies.push({...p,id});
  }
  if(enemies.length<10)throw Error('Kiting fixture requires ten spread threats; got '+enemies.length+' at '+JSON.stringify(lane));
  g.switchWeapon('rifle');d.setInput({x:-Math.cos(lane.angle)*.55,y:-Math.sin(lane.angle)*.55,fire:true,angle:lane.angle,autoAim:false});g.grenade();d.step(300);
}

// Self-contained page function, sharing the exact G1 lane algorithm and real A1 actions.
function integrationKitingSetup(tier){
 return new Function('room',`return (async()=>{
  const d=window.__containmentDebug,g=d.game;
  await (${stageKiting.toString()})(room,{tier:${JSON.stringify(tier)},live:true});
  const gl=d.renderer.renderer.getContext(),createProgram=gl.createProgram,oldPrograms=new Set(d.renderer.renderer.info.programs);let compiled=0;gl.createProgram=function(){compiled++;return createProgram.call(gl);};
  try{
  d.uiFixture({preferences:{radar:true,combatText:true}});
  const angle=g.player.angle;g.setAimPoint({x:g.player.x+Math.cos(angle)*120,y:g.player.y+Math.sin(angle)*120});
  if(!g.useAbility('power'))throw Error('Kiting pylon placement denied');d.step(g.abilities.snapshot.slots.power.castRemainingMs+30);
  d.fillOverdrive();if(!g.useAbility('overdrive'))throw Error('Kiting Overclock denied');d.step(30);
  if(!g.abilities.snapshot.deployables.length||!g.abilities.snapshot.overdrive.active)throw Error('Heavy ability fixture is not live');
  d.kitingProof={tier:${JSON.stringify(tier)},startEnemies:g.enemies.activeCount,startPosition:{x:g.player.x,y:g.player.y}};
  // Run normal RAF updates with fixed native-equivalent controls, so diagnostics include real simulation work.
  const sampledFrom=g.elapsed;d.realtime(true);try{for(let i=0;i<900&&g.elapsed-sampledFrom<3;i++){const sign=Math.floor((g.elapsed-sampledFrom)*2)%2?1:-1;d.setInput({x:Math.cos(angle)*.4*sign,y:Math.sin(angle)*.4*sign});await new Promise(requestAnimationFrame);}}finally{d.realtime(false);}
  d.kitingProof.liveSeconds=g.elapsed-sampledFrom;if(d.kitingProof.liveSeconds<3)throw Error('Live benchmark clock did not advance');
  d.kitingProof.endVisible=g.enemies.snapshot.enemies.filter(e=>d.renderer.visible(e.x,e.y)).length;d.kitingProof.endEnemies=g.enemies.activeCount;d.kitingProof.endPosition={x:g.player.x,y:g.player.y};
  d.kitingProof.performance=window.__containmentPerformance;
  if(g.enemies.activeCount<8||d.kitingProof.endVisible<6)throw Error('Heavy ability benchmark lost visible encounter '+JSON.stringify(d.kitingProof));d.refresh();
  }finally{gl.createProgram=createProgram;d.shaderCompilations=compiled;}
  if(compiled)throw Error('Live ability combat compiled '+compiled+' unprepared programs '+JSON.stringify(d.renderer.renderer.info.programs.filter(p=>!oldPrograms.has(p)).map(p=>{const f=gl.getShaderSource(p.fragmentShader);return {name:p.name,points:f.match(/uniform PointLight pointLights\\[ ?([0-9]+)/)?.[1],flags:f.match(/#define USE_[A-Z_]+/g),actor:f.includes('actorRimStrength'),floor:f.includes('roomFloorGrime'),custom:f.includes('ribbonAlpha')||f.includes('varying vec4 ink'),key:p.cacheKey.slice(-150)};})));
 })();`);
}

export const SCENARIOS=[
 ...ABILITY_SCENARIOS,DESKTOP_ABILITY_SCENARIO,INTEGRATION_SETTINGS_SCENARIO,
 {id:'title',state:'menu',required:['.title-screen','#start'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();}},
 {id:'title-settings',state:'menu',required:['[data-ui-settings]','#quality'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();document.querySelector('#settings').click();}},
 {id:'starting-boon',state:'reward',phase:'starting-boon',required:['.choice-grid'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});if(!d.game.chooseRig('cryo'))throw Error('Starting boon rig selection failed');d.refresh();}},
 {id:'augment-draft',state:'reward',phase:'reward',required:['.choice-grid','[data-mutation=spreading-nova], [data-mutation=twin-glacier]'],setup:async()=>{
   const d=window.__containmentDebug;
   for(let seed=1729;seed<1769;seed++){
     await d.startRun(seed);await d.gotoRoom('awakening-bay',{phase:'reward',rig:'cryo'});d.grantBoons(['cryogenic']);
     if(document.querySelector('[data-mutation=spreading-nova], [data-mutation=twin-glacier]'))return;
   }
   throw Error('No seeded live Cryo augment reward draft found');
 }},
 {id:'rig-select',state:'reward',phase:'rig-select',uiState:'rig-select',required:['.rig-panel','[data-rig]','.rig-footnote'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});}},
 {id:'rig-select-cryo',state:'reward',uiState:'rig-select',required:['.rig-panel [data-element=cryo]'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});document.querySelector('[data-rig=cryo]').click();}},
 {id:'rig-select-pyro',state:'reward',uiState:'rig-select',required:['.rig-panel [data-element=pyro]'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});document.querySelector('[data-rig=pyro]').click();}},
 {id:'rig-select-arc',state:'reward',uiState:'rig-select',required:['.rig-panel [data-element=arc]'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});document.querySelector('[data-rig=arc]').click();}},
 {id:'ability-ready',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('breacher','ready');}},
 {id:'ability-cryo',state:'playing',room:'awakening-bay',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay');d.abilityFixture('cryo','ready');}},
 {id:'ability-pyro',state:'playing',room:'infested-workshop',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('infested-workshop');d.abilityFixture('pyro','active');}},
 {id:'ability-arc',state:'playing',room:'relay-racks',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('relay-racks');d.abilityFixture('arc','ready');}},
 {id:'ability-cooling',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('cryo','cooling');}},
 {id:'ability-casting',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('breacher','casting');}},
 {id:'ability-denied',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('pyro','denied');}},
 {id:'ability-overdrive',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('arc','overdrive');}},
 {id:'combat-kiting',state:'playing',room:'breached-loading-bay',burst:true,setup:async()=>{
   const d=window.__containmentDebug,g=d.game;await d.gotoRoom('breached-loading-bay');d.invulnerable(true);g.enemies.reset();
   const candidates=[];for(let y=100;y<g.geometry.bounds.height-100;y+=90)for(let x=100;x<g.geometry.bounds.width-100;x+=90)if(d.canStand(x,y,28))candidates.push({x,y});
   const center=candidates.reduce((best,p)=>Math.hypot(p.x-g.geometry.bounds.width*.5,p.y-g.geometry.bounds.height*.5)<Math.hypot(best.x-g.geometry.bounds.width*.5,best.y-g.geometry.bounds.height*.5)?p:best,candidates[0]);
   Object.assign(g.player,center);let count=0;const placed=[];
   for(let i=0;i<18&&count<15;i++){
     const angle=i*2.399963229728653,range=[250,370,530,730][i%4];
     const desired={x:center.x+Math.cos(angle)*range,y:center.y+Math.sin(angle)*range};
     const legal=candidates.filter(p=>{const distance=Math.hypot(p.x-center.x,p.y-center.y);return distance>=220&&distance<=900&&!placed.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<120);}).sort((a,b)=>Math.hypot(a.x-desired.x,a.y-desired.y)-Math.hypot(b.x-desired.x,b.y-desired.y));
     const p=legal[0];if(!p)continue;const id=d.spawn(['crawler','spitter','brute','stalker'][count%4],p.x,p.y,count%5===0);if(id){placed.push({...p,id});count++;}
   }
   g.switchWeapon('rifle');d.setInput({x:.6,y:-.4,fire:true,angle:null,autoAim:true});d.abilityFixture('cryo','cooling',{radar:true,combatText:true});d.step(450);d.cameraZoom(1.75);
   const visible=g.enemies.snapshot.enemies.filter(e=>e.health>0&&d.renderer.visible(e.x,e.y)).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y));
   for(const [i,p] of visible.slice(0,5).entries())d.uiEvent({type:'hit',x:p.x,y:p.y,id:p.id,damage:24+i*17,critical:i===2,lethal:i===3,source:i%2?'ice':'fire'});
   d.uiEvent({type:'boon',boon:'shatter',x:center.x+100,y:center.y});d.refresh();
 }},
 {id:'low-ammo',state:'playing',room:'armory',required:['.weapon-hud[data-ammo=low]'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.invulnerable(true);d.game.switchWeapon('rifle');d.setInput({fire:true,angle:0,autoAim:false});for(let i=0;i<400&&d.game.combat.snapshot.magazine>Math.ceil(d.game.combat.snapshot.magazineCapacity*.2);i++)d.step(1000/60);d.setInput({fire:false});d.abilityFixture('breacher','ready');d.refresh();}},
 {id:'reload-fixture',state:'playing',room:'armory',required:['#reload-label'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.invulnerable(true);d.game.switchWeapon('rifle');d.setInput({fire:true,angle:0,autoAim:false});d.step(500);d.setInput({fire:false});d.game.reload();d.step(d.game.combat.snapshot.reloadDurationMs*.4);d.abilityFixture('arc','ready');d.refresh();}},
 {id:'combat-calm',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.invulnerable(true);d.refresh();}},
 {id:'combat-heavy',rooms:true,state:'playing',combat:true,burst:true,setup:async room=>{await window.__containmentDebug.gotoRoom(room);}},
 {id:'status-vfx',state:'playing',combat:true,status:true,burst:true,room:'communal-atrium',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('communal-atrium',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','absolute-zero','incendiary','caustic-rounds','arc-filament','conductive-shell','cryo-conductor']);}},
 {id:'boss',auditGraphics:true,state:'playing',burst:true,room:'reactor-vault',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.invulnerable(true);const q=d.game.boss.snapshot;const candidates=[];for(let y=q.y+120;y<=q.y+330;y+=30)for(let x=q.x-200;x<=q.x+200;x+=30)if(d.canStand(x,y))candidates.push({x,y});if(!q.active||!candidates.length)throw Error('Queen encounter unavailable');Object.assign(d.game.player,candidates[Math.floor(candidates.length/2)]);d.setInput({fire:true,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.game.switchWeapon('plasma');d.step(1600);}},
 {id:'boss-radar',state:'playing',room:'reactor-vault',required:['#radar-hud','.radar-objective'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.uiFixture({preferences:{radar:true,combatText:true}});}},
 {id:'reward',state:'reward',phase:'reward',required:['.choice-grid'],setup:async()=>{await window.__containmentDebug.gotoRoom('awakening-bay',{phase:'reward'});}},
 {id:'route',state:'route',required:['.route-grid','[data-route]'],setup:async()=>{await window.__containmentDebug.gotoRoom('awakening-bay',{phase:'route'});}},
 {id:'pause',state:'paused',required:['.pause-panel','#resume'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();}},
 {id:'pause-loadout',state:'paused',required:['.owned-boons','.ability-preview'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','spreading-nova','twin-glacier','reserve-thruster']);d.game.pause();d.refresh();document.querySelector('[data-pause-tab=loadout]').click();}},
 {id:'pause-loadout-augments',state:'paused',required:['[data-boon=spreading-nova]','[data-boon=twin-glacier]','[data-boon=reserve-thruster]'],setup:async()=>{
   const d=window.__containmentDebug;await d.gotoRoom('armory',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','spreading-nova','twin-glacier','reserve-thruster']);
   d.game.pause();d.refresh();document.querySelector('[data-pause-tab=loadout]').click();
   const panel=document.querySelector('#pause-tabpanel');panel.scrollTop=panel.scrollHeight;
 }},
 {id:'pause-settings',state:'paused',required:['[data-ui-settings]','#quality'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();document.querySelector('[data-pause-tab=settings]').click();document.querySelector('.settings-advanced')?.setAttribute('open','');}},
 {id:'graphics-options',state:'paused',required:['[data-setting=\"graphics.bloom\"]'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();document.querySelector('[data-pause-tab=settings]').click();document.querySelector('.settings-advanced').open=true;}},
 {id:'pause-controls',state:'paused',required:['.controls-reference'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();document.querySelector('[data-pause-tab=controls]').click();}},
 {id:'destroy-confirm',state:'route',required:['#destroy-ship'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('manual-control-chamber',{phase:'route'});}},
 {id:'results',state:'dead',required:['.result-stats','.result-panel','#start'],setup:async()=>{
   const d=window.__containmentDebug,g=d.game;await d.startRun(undefined,{rigSelect:true});
   if(!g.chooseRig('arc'))throw Error('Live results rig selection failed');d.refresh();
   document.querySelector('[data-mutation]').click();await d.prepare();g.skipStory();d.invulnerable(true);g.enemies.reset();
   Object.assign(g.player,{x:320,y:440,angle:-Math.PI/2,vx:0,vy:0});
   // Survive the opening Overload so the debrief also exercises confirmed weapon receipts.
   for(const [x,y]of [[320,280],[350,260],[290,230]])if(!d.spawn('brute',x,y))throw Error('Live results target unavailable');
   g.switchWeapon('rifle');g.setAimPoint({x:320,y:220});d.setInput({fire:true,angle:null,autoAim:true});
   if(!g.useAbility('tactical'))throw Error('Live results tactical denied');d.step(250);d.fillOverdrive();
   if(!g.useAbility('overdrive'))throw Error('Live results Overdrive denied');d.step(5000);d.setInput({fire:false});
   d.invulnerable(false);g.hurt(100000);d.refresh();
 }},
 {id:'results-fixture',state:'dead',required:['.result-stats'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('breached-loading-bay');d.game.hurt(100000);d.uiFixture({stats:{...d.game.stats,kills:{total:284,byFamily:{crawler:184,brute:40,spitter:30,stalker:20,carrier:10,queen:0}},damageDealt:{weapon:12000,ability:2000,status:582,boon:100},shotsFired:812,shotsHit:620,abilityUses:{dash:18,tactical:12,power:5,overdrive:1},overdrivesUsed:1,highestMultiKill:6,roomTimeMs:{...d.game.stats.roomTimeMs,'fixture':487000}}});}},
 {id:'complete-fixture',state:'complete',required:['.result-panel'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('overload-floor');d.game.status='complete';d.uiFixture({stats:{...d.game.stats,kills:{total:652,byFamily:{crawler:450,brute:80,spitter:50,stalker:40,carrier:31,queen:1}},damageDealt:{weapon:30000,ability:8000,status:2082,boon:1000},roomTimeMs:{...d.game.stats.roomTimeMs,'fixture':1227000}}});}},
 {id:'critical-health',state:'playing',room:'awakening-bay',required:['#hud.low-health'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay');d.invulnerable(false);d.game.hurt(130);d.abilityFixture('breacher','cooling');d.refresh();}},
 {id:'dead',state:'dead',required:['.result-panel','#start'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('breached-loading-bay');d.invulnerable(false);d.game.hurt(100000);d.refresh();}},
 {id:'shop',state:'reward',phase:'reward',required:['.service-shop','#claim'],setup:async()=>{await window.__containmentDebug.gotoRoom('communal-atrium',{phase:'reward'});}},
 {id:'g1-benchmark-high',rooms:true,state:'playing',setup:benchmarkSetup('high')},
 {id:'g1-native-room-shaders',rooms:true,state:'playing',setup:benchmarkSetup('high','gtao',false,true)},
 {id:'g1-benchmark-status',rooms:true,state:'playing',setup:benchmarkSetup('high','gtao',true)},
 {id:'g1-benchmark-contact',rooms:true,state:'playing',setup:benchmarkSetup('high','contact')},
 {id:'g1-benchmark-low',rooms:true,state:'playing',setup:benchmarkSetup('low')},
 // G1 additions preserve the original baseline fixtures unchanged.
 {id:'g1-recovery',state:'playing',room:'armory',setup:async()=>{
  const d=window.__containmentDebug,r=d.renderer;await d.gotoRoom('armory');d.invulnerable(true);d.refresh();
  const before={...r.renderer.info.memory},roomCycles=[];
  for(let i=0;i<3;i++){r.setQuality('low');d.refresh();r.setQuality('high');await d.gotoRoom('infested-workshop');await d.gotoRoom('armory');d.refresh();roomCycles.push({...r.renderer.info.memory});}
  if(JSON.stringify(roomCycles[1])!==JSON.stringify(roomCycles[2]))throw Error('GPU resources grew between equivalent room cycles '+JSON.stringify(roomCycles));
  const afterRooms={...r.renderer.info.memory},gl=r.renderer.getContext(),ext=gl.getExtension('WEBGL_lose_context'),drawErrors=[],originalRender=r.renderer.render;
  r.renderer.render=function(scene,camera){const beforeError=gl.getError();if(beforeError&&beforeError!==gl.CONTEXT_LOST_WEBGL)drawErrors.push({when:'before',error:beforeError,stack:new Error().stack});const result=originalRender.call(this,scene,camera),error=gl.getError();if(error&&error!==gl.CONTEXT_LOST_WEBGL)drawErrors.push({name:scene===r.scene?'world':scene===r.hudScene?'hud':scene.children[0]?.material?.name||'other',error,shadow:this.shadowMap.enabled,stack:new Error().stack});return result;};if(!ext)throw Error('Context-loss extension unavailable');
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Context restoration timeout')),30000);r.canvas.addEventListener('webglcontextrestored',()=>{clearTimeout(timeout);resolve();},{once:true});ext.loseContext();setTimeout(()=>ext.restoreContext(),250);});
  for(let i=0;i<900&&r.roomLoading;i++)await new Promise(requestAnimationFrame);
  if(r.roomLoading)throw Error('Graphics preparation did not recover');d.game.resume();d.refresh();await d.gotoRoom('infested-workshop');await d.gotoRoom('armory');d.refresh();
  r.renderer.render=originalRender;if(drawErrors.length)throw Error('Recovery draw errors '+JSON.stringify(drawErrors));
  d.recoveryProof={before,roomCycles,afterRooms,afterRestore:{...r.renderer.info.memory},programs:r.renderer.info.programs.length,contextLost:gl.isContextLost()};
 }},
 {id:'g2-calm-high',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g2-calm-low',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setQuality('low');await d.prepare();d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g2-kiting-high',rooms:true,state:'playing',burst:true,setup:new Function('room',`return (${stageKiting.toString()})(room,{tier:'high'});`)},
 {id:'g2-kiting-low',rooms:true,state:'playing',burst:true,setup:new Function('room',`return (${stageKiting.toString()})(room,{tier:'low'});`)},
 {id:'g2-title-low',state:'menu',required:['.title-screen','#start'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.renderer.setQuality('low');await d.prepare();d.game.menu();d.refresh();}},
 {id:'g2-boss-low',auditGraphics:true,state:'playing',burst:true,room:'reactor-vault',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.renderer.setQuality('low');await d.prepare();d.invulnerable(true);const q=d.game.boss.snapshot;for(let y=q.y+180;y<=q.y+300;y+=30)for(let x=q.x-160;x<q.x+160;x+=30)if(d.canStand(x,y)){Object.assign(d.game.player,{x,y});break;}d.setInput({fire:true,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.game.switchWeapon('plasma');d.measureLuminance=true;d.step(1600);}},
 {id:'g1-exposure-calm',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g1-low',rooms:true,state:'playing',combat:true,burst:true,setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setQuality('low');d.refresh();}},
 {id:'g1-perspective',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setCameraProjection('perspective');d.refresh();}},
 {id:'g1-orthographic',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setCameraProjection('orthographic');d.refresh();}},
 {id:'g1-aces',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setToneMapping('aces');d.refresh();}},
 {id:'g1-agx',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setToneMapping('agx');d.refresh();}},
 {id:'g1-contact-ao',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setAmbientOcclusionAlgorithm('contact');d.refresh();}},
 {id:'g1-kiting',rooms:true,state:'playing',burst:true,setup:stageKiting},
 {id:'i2-kiting-high',rooms:true,state:'playing',burst:true,liveKiting:true,setup:integrationKitingSetup('high')},
 {id:'i2-kiting-low',rooms:true,state:'playing',burst:true,liveKiting:true,setup:integrationKitingSetup('low')},
 {id:'i2-low-calm',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setQuality('low');await d.prepare();d.invulnerable(true);d.refresh();}},

];

// Local combat staging uses legal occupancy and clear shots, real enemy systems,
// real weapons, real mutation triggers, and the unchanged gameplay camera.
export function stageCombat({status=false}){
 const d=window.__containmentDebug,g=d.game;d.invulnerable(true);g.enemies.reset();
 const {width,height}=g.geometry.bounds,candidates=[];
 for(let y=120;y<height-100;y+=80)for(let x=120;x<width-100;x+=80){
  if(!d.canStand(x,y,28))continue;
  let score=0;for(let i=0;i<32;i++){const a=i*Math.PI/16;for(const r of [150,230,310])if(d.canStand(x+Math.cos(a)*r,y+Math.sin(a)*r,28)&&d.clearShot(x+Math.cos(a)*r,y+Math.sin(a)*r,{x,y}))score++;}
  candidates.push({x,y,score:score-Math.hypot(x-width/2,y-height/2)/1000});
 }
 candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('No legal combat staging position');
 Object.assign(g.player,candidates[0]);d.setInput({fire:false});d.step(600); // settle native camera
 const staged=[];
 for(const range of [145,205,265,325,380])for(let i=0;i<40&&staged.length<26;i++){
  const a=i*Math.PI/20,p={x:g.player.x+Math.cos(a)*range,y:g.player.y+Math.sin(a)*range};
  if(!d.canStand(p.x,p.y,28)||!d.clearShot(p.x,p.y)||!d.renderer.visible(p.x,p.y)||staged.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<54))continue;
  const type=staged.length%5===0?'spitter':'brute',id=d.spawn(type,p.x,p.y,staged.length%4===0);if(id)staged.push({...p,id});
 }
 if(staged.length<14)throw Error(`Only ${staged.length} visible legal enemies could be staged`);
 if(!status){g.grenade();d.step(700);}
 g.switchWeapon(status?'rifle':'plasma');d.setInput({fire:true,angle:null,autoAim:true});
 if(status){
  // A confirmed rifle hit supplies burn, poison and chill; native Cryo Nova then
  // freezes that already-chilled target. Capture the actual next muzzle pulse.
  const target=staged.find(e=>{const enemy=g.enemies.getSnapshot(e.id);return enemy?.type==='brute'&&!enemy.elite;});
  if(!target)throw Error('No ordinary status target');
  d.setInput({angle:Math.atan2(target.y-g.player.y,target.x-g.player.x),autoAim:false});
  let primed=false;
  for(let i=0;i<120;i++){
   const s=g.boonStatuses(target.id);
   if(s.chilled&&s.burning&&s.poisoned){primed=true;break;}
   d.step(1000/60);
  }
  if(!primed||!g.useAbility('tactical'))throw Error('Live Cryo status staging failed');
  for(let i=0;i<90;i++){
   const states=g.enemies.snapshot.enemies.map(e=>g.boonStatuses(e.id));
   if(['burning','chilled','frozen','poisoned'].every(k=>states.some(s=>s[k]))&&d.renderer.muzzle.intensity>0)break;
   d.step(1000/60);
  }
 }else{
  d.step(360);
  for(let i=0;i<60&&!(d.renderer.muzzle.intensity>0&&g.bullets.some(b=>b.kind==='player')&&d.events.some(e=>e.type==='explosion'&&g.elapsed-e.at<.25));i++)d.step(1000/60);
 }
 return {staged:staged.length,player:{x:g.player.x,y:g.player.y}};
}

export function inspectFrame(){
 const d=window.__containmentDebug,g=d.game,r=d.renderer;d.refresh();
 const gl=r.renderer.getContext();
 // Read the just-rendered default framebuffer before the browser clears it.
 const xs=[];for(let y=0;y<18;y++)for(let x=0;x<32;x++){const p=new Uint8Array(4);gl.readPixels(Math.floor((x+.5)*gl.drawingBufferWidth/32),Math.floor((y+.5)*gl.drawingBufferHeight/18),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);xs.push(`${p[0]>>3},${p[1]>>3},${p[2]>>3}`);}
 const enemies=g.enemies.snapshot.enemies.filter(e=>e.health>0),visible=enemies.filter(e=>r.visible(e.x,e.y));
 const marineBounds=r.playerScreenBounds(g.player.radius),hudOverlaps=[];
 for(const selector of ['#status-hud','#action-bar','.vitals','#boss-hud','#radar-hud','#hud-toasts']){
  const element=document.querySelector(selector);if(!element||element.hidden||!element.getClientRects().length)continue;
  const box=element.getBoundingClientRect();if(box.width>0&&box.height>0&&box.left<marineBounds.right&&box.right>marineBounds.left&&box.top<marineBounds.bottom&&box.bottom>marineBounds.top)hudOverlaps.push(selector);
 }
 const playfieldSamples=[],marineLocalSamples=[];
 const playfieldProjection=d.measureLuminance?{inverseProjection:r.camera.projectionMatrixInverse.toArray(),world:r.camera.matrixWorld.toArray(),boundary:g.geometry.boundary??[{x:0,y:0},{x:g.geometry.bounds.width,y:0},{x:g.geometry.bounds.width,y:g.geometry.bounds.height},{x:0,y:g.geometry.bounds.height}]}:null;
 if(d.measureLuminance){
  const {width,height}=g.geometry.bounds,canvas=r.canvas,point=r.screenPoint;
  for(let y=height/140;y<height;y+=height/70)for(let x=width/140;x<width;x+=width/70){
   if(!d.canStand(x,y,12))continue;
   point.set(x/32,.04,y/32).project(r.camera);
   const px=(point.x+1)/2,py=(1-point.y)/2;
   const sample=[Math.round(px*canvas.clientWidth),Math.round(py*canvas.clientHeight)];if(px>.15&&px<.85&&py>.2&&py<.8)playfieldSamples.push(sample);if(px>0&&px<1&&py>0&&py<1&&Math.hypot(x-g.player.x,y-g.player.y)<=96)marineLocalSamples.push(sample);
  }
 }
 return {interimMeshes:r.scene.getObjectByName('interim-ability-visuals')?.children.filter(o=>o.visible&&o.isMesh&&(o.count===undefined||o.count>0)).length??0,drawErrors:d.drawErrors??[],settingsProof:d.settingsProof??null,marineBounds,hudOverlaps,kitingProof:d.kitingProof??null,shaderCompilations:d.shaderCompilations??null,recoveryProof:d.recoveryProof??null,lighting:r.lighting?.fixtures?.map(l=>({x:l.position.x,y:l.position.y,z:l.position.z,energy:l.intensity,color:l.color.getHex(),visible:l.visible})),poolLights:r.lighting?.pool?.lights?.filter(l=>l.visible).length,playfieldSamples,marineLocalSamples,playfieldProjection,abilities:g.abilities.snapshot,stats:g.stats,recentEffects:d.events.filter(e=>g.elapsed-e.at<.25),state:g.status,uiState:document.body.dataset.state,phase:g.expedition.run.phase,templateId:g.node.templateId,elapsed:g.elapsed,player:{x:g.player.x,y:g.player.y,visible:r.visible(g.player.x,g.player.y)},enemies:enemies.length,visibleEnemies:visible.length,bullets:g.bullets.length,playerBullets:g.bullets.filter(b=>b.kind==='player').length,muzzle:r.muzzle?.intensity??0,boss:g.boss.snapshot.active,statuses:visible.map(e=>({id:e.id,...g.boonStatuses(e.id)})),performance:window.__containmentPerformance,canvas:{colors:new Set(xs).size,litSamples:xs.filter(c=>c!=='0,0,0').length,contextLost:gl.isContextLost(),error:gl.getError()},hud:!document.querySelector('#hud').hidden,overlay:document.querySelector('#overlay').textContent.trim(),bossHud:!document.querySelector('#boss-hud').hidden,ui:{toasts:[...document.querySelectorAll('.hud-toast:not([hidden])')].map(n=>n.textContent),abilitySlots:[...document.querySelectorAll('[data-ability]')].map(n=>({slot:n.dataset.ability,state:n.dataset.state,title:n.querySelector('.ability-title')?.textContent,value:n.querySelector('.ability-value')?.textContent,icon:!!n.querySelector('svg')})),damageNumbers:[...document.querySelectorAll('.combat-float[data-kind=damage]:not([hidden])')].map(n=>n.textContent),threats:document.querySelectorAll('.threat-marker:not([hidden])').length}};
}
