import {E9_TOUR_SCENARIO} from './e9-room-tour.mjs';
import {U9_SCENARIOS} from './u9-scenarios.mjs';
import {L8_CAPTURE_ARENAS} from './l8-capture-data.mjs';
import {U7_SCENARIOS} from './u7-scenarios.mjs';
import {U6_SCENARIOS} from './u6-scenarios.mjs';
import {G4_FORM_SCENARIOS} from './g4-forms.mjs';
import {G4_SCENARIOS} from './g4-scenarios.mjs';
import {I4_SCENARIOS} from './i4-scenarios.mjs';
import {V2_SCENARIOS} from './v2-scenarios.mjs';
import {V3_SCENARIOS} from './v3-scenarios.mjs';
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

export async function stageGraphicsKiting(room, options={}){
  const d=window.__containmentDebug,g=d.game;await d.gotoRoom(room,options.live?{rig:'arc'}:{});if(options.tier){d.renderer.setQuality(options.tier);await d.prepare();}d.invulnerable(true);d.measureLuminance=true;g.enemies.reset();
  const bounds=g.geometry.bounds,candidates=[],centers=[];
  if(options.arena){
   if(!d.canStand(options.arena.x,options.arena.y,144))throw Error('Authored fight arena is not legal in the actual debug geometry: '+JSON.stringify(options.arena));
   centers.push(options.arena);
  }else for(let y=150;y<bounds.height-150;y+=70)for(let x=150;x<bounds.width-150;x+=70)centers.push({x,y});
  for(const {x,y}of centers)for(const angle of (options.arena?Array.from({length:16},(_,i)=>i*Math.PI/8):[0,Math.PI/2,Math.PI,-Math.PI/2])){
   if(!d.canStand(x,y,28)||!d.canStand(x-Math.cos(angle)*100,y-Math.sin(angle)*100,28))continue;
   let score=0;for(const range of [170,230,290,350])for(let i=0;i<7;i++){const a=angle+(i-3)*.24,p={x:x+Math.cos(a)*range,y:y+Math.sin(a)*range};if(d.canStand(p.x,p.y,28)&&d.clearShot(p.x,p.y,{x,y}))score++;}
   candidates.push({x,y,angle,score});
  }
  candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('No legal kiting lane');
  const lane=candidates[0];Object.assign(g.player,{x:lane.x,y:lane.y,angle:lane.angle});d.setInput({x:0,y:0,fire:false,angle:lane.angle,autoAim:false});d.step(600);
  const targetCount=options.count??12, spread=targetCount>12?13:7;
  const enemies=[];for(const range of (options.live?[140,190,240,290]:targetCount>12?[170,230,290,350,410,470]:[170,230,290,350]))for(let i=0;i<spread&&enemies.length<targetCount;i++){
   const angle=lane.angle+(i-(spread-1)/2)*.24,p={x:lane.x+Math.cos(angle)*range,y:lane.y+Math.sin(angle)*range};
   if(!d.canStand(p.x,p.y,28)||!d.clearShot(p.x,p.y)||enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y )<(options.live?45:55)))continue;
   const family=['brute','crawler','spitter','stalker','crawler','carrier'][enemies.length%6],elite=enemies.length%5===0,id=d.spawn(family,p.x,p.y,elite);if(id)enemies.push({...p,id,family,elite});
  }
  // The twenty-contact dressing study also uses the guaranteed clear arena
  // interior when surrounding machinery occludes the ordinary forward fan.
  if(targetCount>12&&enemies.length<targetCount)for(const range of [110,170,230,290])for(let i=0;i<64&&enemies.length<targetCount;i++){
   const angle=lane.angle+i*Math.PI/32,p={x:lane.x+Math.cos(angle)*range,y:lane.y+Math.sin(angle)*range};
   if(!d.canStand(p.x,p.y,28)||!d.clearShot(p.x,p.y)||enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<55))continue;
   const id=d.spawn('crawler',p.x,p.y,false);if(id)enemies.push({...p,id,family:'crawler',elite:false});
  }
  if(enemies.length<10)throw Error('Kiting fixture requires ten spread threats; got '+enemies.length+' at '+JSON.stringify(lane));
  const shotsBefore=g.stats.shotsFired,grenadesBefore=g.bullets.filter(b=>b.kind==='grenade').length;g.switchWeapon('rifle');d.setInput({x:-Math.cos(lane.angle)*.55,y:-Math.sin(lane.angle)*.55,fire:true,angle:lane.angle,autoAim:false});g.grenade();const grenadeThrown=g.bullets.filter(b=>b.kind==='grenade').length>grenadesBefore;d.step(300);
  if(options.arena&&(!grenadeThrown||g.stats.shotsFired<=shotsBefore))throw Error('Authored G6 fixture lacks native grenade/fire receipts');
  if(options.arena)d.l8FixtureProof={scope:'Native G6 staged movement/fire; not canonical12-visible Cryo or campaign balance evidence',arena:{...options.arena},lane:{...lane},actors:enemies.map(p=>({...p})),minimumSpreadActors:10,grenadeThrown,shotsBefore,shotsAfter:g.stats.shotsFired,cameraOverride:false};
}

// Self-contained page function, sharing the exact G1 lane algorithm and real A1 actions.
function integrationKitingSetup(tier){
 return new Function('room',`return (async()=>{
  const d=window.__containmentDebug,g=d.game;
  await (${stageGraphicsKiting.toString()})(room,{tier:${JSON.stringify(tier)},live:true});
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
 E9_TOUR_SCENARIO,
 ...U6_SCENARIOS,...G4_SCENARIOS,...G4_FORM_SCENARIOS,
 ...I4_SCENARIOS,...V2_SCENARIOS,...V3_SCENARIOS,
 ...ABILITY_SCENARIOS,DESKTOP_ABILITY_SCENARIO,INTEGRATION_SETTINGS_SCENARIO,
 {id:'title',state:'menu',required:['.title-screen','#start'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();}},
 {id:'title-settings',state:'menu',required:['[data-ui-settings]','#quality'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();document.querySelector('#settings').click();}},
 {id:'starting-boon',state:'reward',phase:'starting-boon',required:['.choice-grid'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});if(!d.game.chooseRig('cryo'))throw Error('Starting boon rig selection failed');d.refresh();}},
 {id:'augment-draft',state:'reward',phase:'reward',required:['.choice-grid','[data-mutation=spreading-nova], [data-mutation=twin-glacier]'],setup:async()=>{
   const d=window.__containmentDebug;
   for(let seed=1729;seed<1769;seed++){
     await d.startRun(seed);await d.gotoRoom('awakening-bay',{phase:'reward',rig:'cryo'});d.grantBoons(['cryogenic']);
     for(let frame=0;frame<120&&!document.querySelector('.choice-grid');frame++)await new Promise(requestAnimationFrame);
     if(document.querySelector('[data-mutation=spreading-nova], [data-mutation=twin-glacier]'))return;
   }
   throw Error('No seeded live Cryo augment reward draft found');
 }},
 {id:'rig-select',state:'reward',phase:'rig-select',uiState:'rig-select',required:['.rig-panel','[data-rig]','.rig-footnote'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});}},
 {id:'rig-select-cryo',state:'reward',uiState:'rig-select',required:['.rig-panel [data-element=cryo]'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});for(let frame=0;frame<900&&!document.querySelector('[data-rig=cryo]');frame++)await new Promise(requestAnimationFrame);document.querySelector('[data-rig=cryo]').click();}},
 {id:'rig-select-pyro',state:'reward',uiState:'rig-select',required:['.rig-panel [data-element=pyro]'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});for(let frame=0;frame<900&&!document.querySelector('[data-rig=pyro]');frame++)await new Promise(requestAnimationFrame);document.querySelector('[data-rig=pyro]').click();}},
 {id:'rig-select-arc',state:'reward',uiState:'rig-select',required:['.rig-panel [data-element=arc]'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});for(let frame=0;frame<900&&!document.querySelector('[data-rig=arc]');frame++)await new Promise(requestAnimationFrame);document.querySelector('[data-rig=arc]').click();}},
 {id:'ability-ready',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('breacher','ready');}},
 {id:'ability-cryo',state:'playing',room:'awakening-bay',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay');d.abilityFixture('cryo','ready');}},
 {id:'ability-pyro',state:'playing',room:'infested-workshop',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('infested-workshop');d.abilityFixture('pyro','active');}},
 {id:'ability-arc',state:'playing',room:'relay-racks',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('relay-racks');d.abilityFixture('arc','ready');}},
 {id:'ability-cooling',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('cryo','cooling');}},
 {id:'ability-casting',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('breacher','casting');}},
 {id:'ability-denied',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('pyro','denied');}},
 {id:'ability-overdrive',state:'playing',room:'armory',required:['#ability-bar'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.abilityFixture('arc','overdrive');}},
 {id:'combat-kiting-fixture',state:'playing',room:'breached-loading-bay',burst:true,setup:async()=>{
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
 {id:'combat-kiting',rooms:true,state:'playing',kiting:true,burst:true,required:['#ability-bar','#radar-hud'],setup:async room=>{await window.__containmentDebug.gotoRoom(room,{rig:'cryo'});}},
 {id:'onboarding',state:'playing',room:'awakening-bay',resetPreferences:['containment.onboarding.v1','containment.finished.v1'],required:['#contextual-onboarding[data-action]'],setup:async()=>{
   const d=window.__containmentDebug;await d.startRun(1729,{rigSelect:true});
   if(!d.game.chooseRig('cryo'))throw Error('Onboarding rig selection failed');d.refresh();
   for(let frame=0;frame<900&&!document.querySelector('[data-mutation]');frame++)await new Promise(requestAnimationFrame);
   const first=document.querySelector('[data-mutation]');if(!first)throw Error('Onboarding starter missing');
   first.click();await d.prepare();d.game.skipStory();d.step(100);d.refresh();
 }},
 {id:'low-ammo',state:'playing',room:'armory',required:['.weapon-hud[data-ammo=low]'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.invulnerable(true);d.game.switchWeapon('rifle');d.setInput({fire:true,angle:0,autoAim:false});for(let i=0;i<400&&d.game.combat.snapshot.magazine>Math.ceil(d.game.combat.snapshot.magazineCapacity*.2);i++)d.step(1000/60);d.setInput({fire:false});d.abilityFixture('breacher','ready');d.refresh();}},
 {id:'reload-fixture',state:'playing',room:'armory',required:['#reload-label'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory');d.invulnerable(true);d.game.switchWeapon('rifle');d.setInput({fire:true,angle:0,autoAim:false});d.step(500);d.setInput({fire:false});d.game.reload();d.step(d.game.combat.snapshot.reloadDurationMs*.4);d.abilityFixture('arc','ready');d.refresh();}},
 {id:'combat-calm',rooms:true,state:'playing',nativePointerHover:'#pause',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room,room==='reactor-vault'?{version:2}:{});d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'l8-arena-calm',rooms:true,state:'playing',phase:'combat',nativePointerHover:'#pause',setup:new Function('room',`return (async()=>{
  const d=window.__containmentDebug,g=d.game,arena=${JSON.stringify(L8_CAPTURE_ARENAS)}[room];await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;
  if(!arena||!d.canStand(arena.x,arena.y,144))throw Error('Declared arena calm is not legal in actual debug geometry');
  Object.assign(g.player,{x:arena.x,y:arena.y,vx:0,vy:0,angle:0});d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
  g.enemies.reset();const simulationBefore=g.elapsed,gl=d.renderer.renderer.getContext(),createProgram=gl.createProgram;let preparedShaderCompiles=0;
  gl.createProgram=function(){preparedShaderCompiles++;return createProgram.call(gl);};try{d.settlePresentation(120);}finally{gl.createProgram=createProgram;}
  if(preparedShaderCompiles)throw Error('Prepared arena presentation compiled '+preparedShaderCompiles+' new programs');
  if(g.elapsed!==simulationBefore)throw Error('Arena presentation advanced simulation');
  d.l8ArenaCalmProof={arena,presentationTicks:120,nativePresentation:true,preparedShaderCompiles,simulationBefore,simulationAfter:g.elapsed,cameraOverride:false,scope:'Staged arena view; native renderer presentation ticks, simulation frozen; separate from room entry and campaigns'};d.refresh();
 })();`)},
 {id:'e6-far-edge',rooms:true,state:'playing',setup:async room=>{
  const d=window.__containmentDebug,g=d.game;await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;
  const points=[];for(let y=64;y<g.geometry.bounds.height;y+=24)for(let x=64;x<g.geometry.bounds.width-32;x+=24)if(d.canStand(x,y,28))points.push({x,y});
  points.sort((a,b)=>a.y-b.y||Math.abs(a.x-g.geometry.bounds.width*.5)-Math.abs(b.x-g.geometry.bounds.width*.5));
  if(!points.length)throw Error('No legal far-edge density view');Object.assign(g.player,points[0]);d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});d.step(900);g.enemies.reset();d.refresh();
 }},
 {id:'combat-heavy',rooms:true,state:'playing',combat:true,burst:true,setup:async room=>{await window.__containmentDebug.gotoRoom(room);}},
 {id:'status-vfx',state:'playing',combat:true,status:true,burst:true,room:'communal-atrium',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('communal-atrium',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','absolute-zero','incendiary','caustic-rounds','arc-filament','conductive-shell','cryo-conductor']);}},
 {id:'boss',auditGraphics:true,state:'playing',burst:true,room:'reactor-vault',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.invulnerable(true);const q=d.game.boss.snapshot;const candidates=[];for(let y=q.y+120;y<=q.y+330;y+=30)for(let x=q.x-200;x<=q.x+200;x+=30)if(d.canStand(x,y))candidates.push({x,y});if(!q.active||!candidates.length)throw Error('Queen encounter unavailable');candidates.sort((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)-Math.hypot(b.x-q.x,b.y-q.y));Object.assign(d.game.player,candidates[0]);d.setInput({fire:true,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.game.switchWeapon('plasma');d.step(1600);}},
 {id:'boss-radar',state:'playing',room:'reactor-vault',required:['#radar-hud','.radar-objective'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.uiFixture({preferences:{radar:true,combatText:true}});}},
 {id:'reward',state:'reward',phase:'reward',required:['.choice-grid'],setup:async()=>{await window.__containmentDebug.gotoRoom('awakening-bay',{phase:'reward'});}},
 {id:'route',state:'route',required:['[data-detour="direct"]','[data-detour="salvage"]','[data-route]'],setup:async()=>{await window.__containmentDebug.gotoRoom('residential-gallery',{phase:'route'});}},
 {id:'route-legacy-branch',state:'route',map:true,legacyBranch:true,required:['.deck-map','.route-destination','[data-route]','[data-inspect-route]'],setup:async()=>{const d=window.__containmentDebug;for(const room of ['receiving','forklift-loop','freight-crossing','rail-depot']){await d.gotoRoom(room,{version:2,phase:'route'});if(d.game.node.next.length>1)return;}throw Error('Legacy branch route unavailable');}},
 {id:'f2-fallback-corpse',state:'playing',burst:true,setup:async()=>{
  const d=window.__containmentDebug;await d.gotoRoom('awakening-bay');d.invulnerable(true);d.renderer.ragdolls.dispose();
  let id=false;for(let i=0;i<16&&!id;i++){const a=i*Math.PI/8;id=d.spawn('crawler',d.game.player.x+Math.cos(a)*150,d.game.player.y+Math.sin(a)*150);}
  if(!id)throw Error('No legal fallback corpse fixture');d.game.damage(id,100000,{x:120,y:-30});d.step(200);
  if(d.renderer.ragdolls.has(id)||!d.renderer.corpses.some(c=>c.id===id))throw Error('Frozen-pose fallback did not retain corpse');
 }},
 {id:'f2-recovery',state:'paused',required:['.recovery-panel','#recover'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');const r=d.renderer,gl=r.renderer.getContext(),ext=gl.getExtension('WEBGL_lose_context');await new Promise(resolve=>{r.canvas.addEventListener('webglcontextrestored',resolve,{once:true});r.canvas.addEventListener('webglcontextlost',()=>requestAnimationFrame(()=>ext.restoreContext()),{once:true});ext.loseContext();});for(let i=0;i<900&&r.roomLoading;i++)await new Promise(requestAnimationFrame);if(r.roomLoading)throw Error('Recovery did not prepare');d.refresh();}},
 {id:'f2-pause-focus',state:'paused',required:['#resume'],nativeKeys:[['Tab',0]],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();for(let i=0;i<900&&!document.querySelector('#pause-tabpanel');i++)await new Promise(requestAnimationFrame);document.querySelector('#pause-tabpanel').focus();}},
 {id:'pause',state:'paused',required:['.pause-panel','#resume'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();}},
 {id:'pause-loadout',state:'paused',required:['.owned-boons','.ability-preview'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','spreading-nova','twin-glacier','reserve-thruster']);d.game.pause();d.refresh();for(let i=0;i<900&&!document.querySelector('[data-pause-tab=loadout]');i++)await new Promise(requestAnimationFrame);document.querySelector('[data-pause-tab=loadout]').click();}},
 {id:'pause-loadout-augments',state:'paused',required:['.pause-panel [data-boon=spreading-nova]','.pause-panel [data-boon=twin-glacier]','.pause-panel [data-boon=reserve-thruster]'],setup:async()=>{
   const d=window.__containmentDebug;await d.gotoRoom('armory',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','spreading-nova','twin-glacier','reserve-thruster']);
   d.game.pause();d.refresh();for(let i=0;i<900&&!document.querySelector('[data-pause-tab=loadout]');i++)await new Promise(requestAnimationFrame);document.querySelector('[data-pause-tab=loadout]').click();
   const panel=document.querySelector('#pause-tabpanel');panel.scrollTop=panel.scrollHeight;
 }},
 {id:'pause-settings',state:'paused',required:['[data-ui-settings]','#quality'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();for(let i=0;i<900&&!document.querySelector('[data-pause-tab=settings]');i++)await new Promise(requestAnimationFrame);document.querySelector('[data-pause-tab=settings]').click();document.querySelector('.settings-advanced')?.setAttribute('open','');}},
 {id:'graphics-options',state:'paused',required:['[data-setting=\"graphics.bloom\"]'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();for(let i=0;i<900&&!document.querySelector('[data-pause-tab=settings]');i++)await new Promise(requestAnimationFrame);document.querySelector('[data-pause-tab=settings]').click();const advanced=document.querySelector('.settings-advanced');if(advanced)advanced.open=true;}},
 {id:'pause-controls',state:'paused',required:['.controls-reference'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();for(let i=0;i<900&&!document.querySelector('[data-pause-tab=controls]');i++)await new Promise(requestAnimationFrame);document.querySelector('[data-pause-tab=controls]').click();}},
 {id:'destroy-confirm',state:'route',required:['#destroy-ship'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('manual-control-chamber',{phase:'route'});}},
 {id:'results',state:'dead',required:['.result-details','.result-panel','#start'],setup:async()=>{
   const d=window.__containmentDebug,g=d.game;await d.startRun(undefined,{rigSelect:true});
   if(!g.chooseRig('arc'))throw Error('Live results rig selection failed');d.refresh();
   for(let frame=0;frame<900&&!document.querySelector('[data-mutation]');frame++)await new Promise(requestAnimationFrame);
   document.querySelector('[data-mutation]').click();await d.prepare();g.skipStory();d.invulnerable(true);g.enemies.reset();
   Object.assign(g.player,{x:320,y:440,angle:-Math.PI/2,vx:0,vy:0});
   // Survive the opening Overload so the debrief also exercises confirmed weapon receipts.
   for(const [x,y]of [[320,280],[350,260],[290,230]])if(!d.spawn('brute',x,y))throw Error('Live results target unavailable');
   g.switchWeapon('rifle');g.setAimPoint({x:320,y:220});d.setInput({fire:true,angle:null,autoAim:true});
   if(!g.useAbility('tactical'))throw Error('Live results tactical denied');d.step(250);d.fillOverdrive();
   if(!g.useAbility('overdrive'))throw Error('Live results Overdrive denied');d.step(5000);d.setInput({fire:false});
   d.invulnerable(false);g.hurt(100000);d.refresh();
 }},
 {id:'results-fixture',state:'dead',required:['.result-details'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('breached-loading-bay',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','spreading-nova','twin-glacier','reserve-thruster','drive-dynamo']);d.game.hurt(100000);d.uiFixture({stats:{...d.game.stats,kills:{total:284,byFamily:{crawler:184,brute:40,spitter:30,stalker:20,carrier:10,queen:0}},damageDealt:{weapon:12000,ability:2000,status:582,boon:100},shotsFired:812,shotsHit:620,abilityUses:{dash:18,tactical:12,power:5,overdrive:1},overdrivesUsed:1,highestMultiKill:6,roomTimeMs:{...d.game.stats.roomTimeMs,'fixture':487000}}});}},
 {id:'complete-fixture',state:'complete',required:['.result-panel'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('overload-floor',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','spreading-nova','twin-glacier','reserve-thruster','drive-dynamo']);d.game.status='complete';d.uiFixture({stats:{...d.game.stats,kills:{total:652,byFamily:{crawler:450,brute:80,spitter:50,stalker:40,carrier:31,queen:1}},damageDealt:{weapon:30000,ability:8000,status:2082,boon:1000},roomTimeMs:{...d.game.stats.roomTimeMs,'fixture':1227000}}});}},
 {id:'x3-failure-analysis',state:'dead',required:['.incoming-report','.fatal-source','.incoming-breakdown'],setup:async()=>{const d=window.__containmentDebug,g=d.game;await d.gotoRoom('breached-loading-bay',{rig:'cryo'});g.enemies.reset();g.hurt(55,{x:g.player.x+60,y:g.player.y},{source:'acid-pool'});d.step(300);g.hurt(40,{x:g.player.x-60,y:g.player.y},{source:'enemy-projectile',enemyFamily:'spitter'});d.step(300);for(let i=0;i<6&&g.status==='playing';i++){g.hurt(42,{x:g.player.x,y:g.player.y+60},{source:'enemy-contact',enemyFamily:'brute'});if(g.status==='playing')d.step(300);}d.refresh();}},
 {id:'x3-hud-compact',state:'playing',room:'awakening-bay',required:['#action-bar','#status-hud'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay',{rig:'cryo'});d.invulnerable(true);d.step(4500);d.refresh();}},
 {id:'x3-denial-reticle',state:'playing',room:'armory',required:['#ability-denial'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory',{rig:'cryo'});d.uiEvent({type:'ability',x:d.game.player.x,y:d.game.player.y,ability:{phase:'denied',ability:'glacier',slot:'power',rig:'cryo',element:'cryo',denial:'blocked',targetX:d.game.player.x,targetY:d.game.player.y}});d.refresh();}},
 {id:'x3-status-priority',state:'playing',room:'armory',required:['.combat-float[data-kind=status]:not([hidden])'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('armory',{rig:'cryo'});const p=d.game.player;for(const elements of [['ice'],['fire'],['freeze'],['poison']])d.uiEvent({type:'hit',x:p.x+200,y:p.y,targetId:123,damage:12,elements});d.refresh();}},
 {id:'critical-health',state:'playing',room:'awakening-bay',required:['#hud.low-health'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay');d.invulnerable(false);d.game.hurt(130);d.abilityFixture('breacher','cooling');d.refresh();}},
 {id:'dead',state:'dead',required:['.result-panel','#start'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('breached-loading-bay');d.invulnerable(false);d.game.hurt(100000);d.refresh();}},
 {id:'feel-impact-fixture',state:'playing',room:'awakening-bay',burst:true,stepMs:25,feelImpact:true,setup:async()=>{
   const d=window.__containmentDebug;await d.gotoRoom('awakening-bay',{rig:'cryo'});d.invulnerable(true);
   d.setInput({x:1,y:0,fire:false,angle:0,autoAim:false});d.presentation(true);
   d.presentationEvent({type:'wall-slam',x:d.game.player.x,y:d.game.player.y,targetId:999});d.refresh();
 }},
 ...['room-enter','room-clear','boss-intro','boss-defeated','overdrive-ready','death'].map(kind=>({
   id:`beat-${kind}-fixture`,state:'playing',room:'awakening-bay',burst:true,required:['#presentation-beat'],
   setupArgument:kind,setup:async kind=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay',{rig:'cryo'});d.presentation(true);d.presentationEvent({type:'beat',kind});d.refresh();},
 })),
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
  if(r.roomLoading)throw Error('Graphics preparation did not recover');
  // GPU readiness can precede the application's next RAF/DOM commit. Exercise
  // the actual enabled recovery and pause actions; never skip a missing button.
  const control=async selector=>{for(let i=0;i<900;i++){d.refresh();const button=document.querySelector(selector);if(button&&!button.disabled&&button.getClientRects().length)return button;await new Promise(requestAnimationFrame);}throw Error('Recovery control did not become ready: '+selector);};
  (await control('#graphics-continue')).click();(await control('#resume')).click();d.refresh();await d.gotoRoom('infested-workshop');await d.gotoRoom('armory');d.refresh();
  r.renderer.render=originalRender;if(drawErrors.length)throw Error('Recovery draw errors '+JSON.stringify(drawErrors));
  d.recoveryProof={before,roomCycles,afterRooms,afterRestore:{...r.renderer.info.memory},programs:r.renderer.info.programs.length,contextLost:gl.isContextLost()};
 }},
 {id:'g2-champions',state:'playing',burst:true,room:'armory',setup:new Function(`return (async()=>{const d=window.__containmentDebug;await (${stageGraphicsKiting.toString()})('armory');const enemies=d.game.enemies.snapshot.enemies;const w=enemies.find(e=>e.type==='brute'),m=enemies.find(e=>e.type==='carrier');if(!w||!m)throw Error('Champion families absent');d.game.enemies.promote(w.id,'warden');d.game.enemies.promote(m.id,'matron');d.setInput({x:0,y:0,fire:false});d.step(400);d.championProof=d.game.enemies.snapshot.enemies.filter(e=>e.champion).map(e=>({id:e.id,champion:e.champion,type:e.type}));if(d.championProof.length!==2)throw Error('Champion proof missing');d.refresh();})();`)},
 {id:'g2-pickups',state:'playing',room:'awakening-bay',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay');for(const [i,kind]of ['credits','health','armor','ammo','grenade'].entries()){const x=d.game.player.x+80+(i%3)*32,y=d.game.player.y-45+Math.floor(i/3)*70;if(!d.canStand(x,y)||!d.game.pickups.spawn(kind,20,x,y).spawned)throw Error('Pickup fixture rejected '+kind);}d.pickupProof=d.game.pickups.snapshot.map(p=>({id:p.id,kind:p.kind}));d.refresh();}},
 {id:'g2-queen-exposed',state:'playing',burst:true,room:'reactor-vault',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.invulnerable(true);const q=d.game.boss.snapshot;let placed=false;for(let y=q.y+160;y<q.y+300&&!placed;y+=30)for(let x=q.x-100;x<q.x+100;x+=30)if(d.canStand(x,y)){Object.assign(d.game.player,{x,y});placed=true;break;}d.setInput({x:0,y:0,fire:false,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.step(3200);if(!d.game.boss.snapshot.vulnerable||!d.game.boss.snapshot.nests.length)throw Error('Queen did not enter real exposed nest phase');
 const live=d.game.boss.snapshot;let near=null;
 for(const distance of [136,160,184]){for(const angle of [0,Math.PI,Math.PI/4,Math.PI*3/4,Math.PI/2]){const x=live.x+Math.cos(angle)*distance,y=live.y+Math.sin(angle)*distance;if(d.canStand(x,y,d.game.player.radius)){near={x,y};break;}}if(near)break;}
 if(!near)throw Error('No legal close Queen anatomy viewing mark');Object.assign(d.game.player,near);d.setInput({x:0,y:0,fire:false,angle:Math.atan2(live.y-near.y,live.x-near.x),autoAim:false});
 d.measureLuminance=true;d.refresh();}},
 {id:'g2-legacy-high',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug,seeds={'receiving':5,'cold-aisle':2,'rail-depot':2,'cryo-gallery':1,'pump-ring':1,'power-conduits':2,'waste-processing':3,'turbine-hall':11};await d.gotoRoom(room,{version:2,seed:seeds[room]??0});d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g2-legacy-low',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug,seeds={'receiving':5,'cold-aisle':2,'rail-depot':2,'cryo-gallery':1,'pump-ring':1,'power-conduits':2,'waste-processing':3,'turbine-hall':11};await d.gotoRoom(room,{version:2,seed:seeds[room]??0});d.renderer.setQuality('low');await d.prepare();d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g2-calm-high',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g2-calm-low',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setQuality('low');await d.prepare();d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g2-kiting-high',rooms:true,state:'playing',burst:true,setup:new Function('room',`return (${stageGraphicsKiting.toString()})(room,{tier:'high'});`)},
 {id:'g2-kiting-low',rooms:true,state:'playing',burst:true,setup:new Function('room',`return (${stageGraphicsKiting.toString()})(room,{tier:'low'});`)},
 {id:'g2-title-low',state:'menu',required:['.title-screen','#start'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.renderer.setQuality('low');await d.prepare();d.game.menu();d.refresh();}},
 {id:'g2-boss-low',auditGraphics:true,state:'playing',burst:true,room:'reactor-vault',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.renderer.setQuality('low');await d.prepare();d.invulnerable(true);const q=d.game.boss.snapshot;for(let y=q.y+180;y<=q.y+300;y+=30)for(let x=q.x-160;x<q.x+160;x+=30)if(d.canStand(x,y)){Object.assign(d.game.player,{x,y});break;}d.setInput({fire:true,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.game.switchWeapon('plasma');d.measureLuminance=true;d.step(1600);}},
 {id:'g1-exposure-calm',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;d.refresh();}},
 {id:'g1-low',rooms:true,state:'playing',combat:true,burst:true,setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setQuality('low');await d.prepare();d.refresh();}},
 {id:'g1-perspective',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setCameraProjection('perspective');d.refresh();}},
 {id:'g1-orthographic',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setCameraProjection('orthographic');d.refresh();}},
 {id:'g1-aces',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setToneMapping('aces');d.refresh();}},
 {id:'g1-agx',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setToneMapping('agx');d.refresh();}},
 {id:'g1-contact-ao',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setAmbientOcclusionAlgorithm('contact');d.refresh();}},
 {id:'g1-kiting',rooms:true,state:'playing',burst:true,setup:stageGraphicsKiting},
 {id:'i2-kiting-high',rooms:true,state:'playing',burst:true,liveKiting:true,setup:integrationKitingSetup('high')},
 {id:'i2-kiting-low',rooms:true,state:'playing',burst:true,liveKiting:true,setup:integrationKitingSetup('low')},
 {id:'i2-low-calm',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.renderer.setQuality('low');await d.prepare();d.invulnerable(true);d.refresh();}},

];

// X2 extends the existing public fixtures for matched tier/phase evidence.
// Every setup is self-contained because capture serializes it into the page.
for(const [id,sourceId]of [['x2-status-low','status-vfx'],['x2-pickups-low','g2-pickups'],['x2-queen-exposed-low','g2-queen-exposed'],['x2-kiting-full-low','combat-kiting']]){
 const source=SCENARIOS.find(s=>s.id===sourceId);
 SCENARIOS.push({...source,id,setup:new Function('room',`return (async()=>{await (${source.setup.toString()})(room);const d=window.__containmentDebug;d.renderer.setQuality('low');await d.prepare();d.refresh();})();`)});
}
for(const tier of ['high','low']){
 const exposed=SCENARIOS.find(s=>s.id==='g2-queen-exposed');
 SCENARIOS.push({...exposed,id:`x2-nest-husk-${tier}`,setup:new Function(`return (async()=>{
  await (${exposed.setup.toString()})();const d=window.__containmentDebug;
  d.renderer.setQuality('${tier}');await d.prepare();
  const nest=d.game.boss.snapshot.nests[0];if(!nest)throw Error('No living nest');
  d.refresh();const hit=d.game.boss.applyDamage({type:'nest',id:nest.id},nest.maxHealth*2);
  if(!hit.applied)throw Error('Real nest destruction rejected');d.step(100);d.refresh();
  if(![...d.renderer.nests.values()].some(n=>n.userData.destroyed))throw Error('Ruptured husk absent');
 })();`)});
}
for(const tier of ['high','low'])for(const [phase,at]of [['opening',2950],['closing',6950]]){
 SCENARIOS.push({id:`x2-queen-${phase}-${tier}`,state:'playing',room:'reactor-vault',burst:true,stepMs:100,auditGraphics:true,setup:new Function(`return (async()=>{
  const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.invulnerable(true);
  d.renderer.setQuality('${tier}');await d.prepare();const q=d.game.boss.snapshot;
  let placed=false;for(let y=q.y+160;y<q.y+300&&!placed;y+=30)for(let x=q.x-100;x<q.x+100;x+=30)if(d.canStand(x,y)){Object.assign(d.game.player,{x,y});placed=true;break;}
  d.setInput({x:0,y:0,fire:false,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.step(${at});d.refresh();
 })();`)});
}
SCENARIOS.push({...SCENARIOS.find(s=>s.id==='title'),id:'x2-title-motion',burst:true,stepMs:1000});
SCENARIOS.push({...SCENARIOS.find(s=>s.id==='g2-calm-high'),id:'x2-calm-motion-high',burst:true});
SCENARIOS.push({...SCENARIOS.find(s=>s.id==='g2-calm-low'),id:'x2-calm-motion-low',burst:true});

// Local combat staging uses legal occupancy and clear shots, real enemy systems,
// real weapons, real mutation triggers, and the unchanged gameplay camera.
export function stageCombat({status=false}){
 const d=window.__containmentDebug,g=d.game;d.invulnerable(true);g.enemies.reset();
 const {x:boundX=0,y:boundY=0,width,height}=g.geometry.bounds,candidates=[];
 for(let y=boundY+120;y<boundY+height-100;y+=80)for(let x=boundX+120;x<boundX+width-100;x+=80){
  if(!d.canStand(x,y,28))continue;
  let score=0;for(let i=0;i<32;i++){const a=i*Math.PI/16;for(const r of [150,230,310])if(d.canStand(x+Math.cos(a)*r,y+Math.sin(a)*r,28)&&d.clearShot(x+Math.cos(a)*r,y+Math.sin(a)*r,{x,y}))score++;}
  candidates.push({x,y,score:score-Math.hypot(x-boundX-width/2,y-boundY-height/2)/1000});
 }
 candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('No legal combat staging position');
 // Native HUD reservations can make the world-space winner a poor screen-space
 // arena. Try spatially distinct centers, then pack on the settled native camera.
 const centers=[],remaining=[...candidates];
 while(remaining.length&&centers.length<16){
  let best=0;for(let i=1;i<remaining.length;i++){
   const merit=p=>p.score-(centers.length?Math.max(0,160-Math.min(...centers.map(c=>Math.hypot(c.x-p.x,c.y-p.y))))/3:0);
   if(merit(remaining[i])>merit(remaining[best]))best=i;
  }
  centers.push(remaining.splice(best,1)[0]);
 }
 // Breached bay's narrow approach needs20extra units of pre-grenade
 // corridor: ordinary700ms approach previously consumed its60travel margin.
 const packingExclusion=Math.max(110,g.player.radius+28+12),packingTrials=[],reservedHalfWidth=g.node.templateId==='breached-loading-bay'?120:100;let shotLaneAngle=null;
 const settlePresentation=(frames=12)=>{
  const before=g.elapsed,clock=d.renderer.time;
  d.realtime(true);try{for(let frame=0;frame<frames;frame++)d.renderer.render(g,1/60,false);}finally{d.realtime(false);}
  if(g.elapsed!==before)throw Error('Heavy presentation settle advanced simulation');d.refresh();
  return Number.isFinite(clock)&&Number.isFinite(d.renderer.time)?(d.renderer.time-clock)*1000:null;
 };
 const pack=()=>{
  let best=[],bestScore=-Infinity,angleChoice=null;const spacing=54.01,row=spacing*Math.sqrt(3)/2,layouts=[];
  // Alternative hex phases avoid a radial-first greedy packing wasting the
  // narrow native viewport. Every layout keeps the original54-unit separation.
  for(let layout=0;layout<32;layout++){
   const points=[];
   for(let iy=-9;iy<=9;iy++)for(let ix=-10;ix<=10;ix++){
    const u=(ix+(iy&1)*.5+(layout&3)*.25)*spacing,v=(iy+((layout>>2)&3)*.25)*row;
    const x=g.player.x+(layout<16?u:v),y=g.player.y+(layout<16?v:u),distance=Math.hypot(x-g.player.x,y-g.player.y);
    if(distance<packingExclusion||distance>380||!d.renderer.visible(x,y)||!d.canStand(x,y,28)||!d.clearShot(x,y))continue;
    const interior=[[-20,0],[20,0],[0,-20],[0,20],[-45,0],[45,0],[0,-45],[0,45]].filter(([dx,dy])=>d.renderer.visible(x+dx,y+dy)).length;
    points.push({x,y,distance,interior});
   }
   points.sort((a,b)=>b.interior-a.interior||a.distance-b.distance||a.y-b.y||a.x-b.x);
   layouts.push(points);
  }
  // Reserve a real clear travelling-shot lane before the native700ms grenade
  // resolution lets enemies approach. The original post-grenade60-unit check
  // and actual projectile/muzzle assertions remain authoritative below.
  for(let n=0;n<(shotLaneAngle===null?48:1);n++){
   const angle=shotLaneAngle??n*Math.PI/24,fx=Math.cos(angle),fy=Math.sin(angle);
   if(![32,64,96].every(radius=>d.canStand(g.player.x+fx*radius,g.player.y+fy*radius,16))||!d.clearShot(g.player.x+fx*120,g.player.y+fy*120))continue;
   for(const points of layouts){
    const packed=points.filter(p=>{const dx=p.x-g.player.x,dy=p.y-g.player.y;return !(dx*fx+dy*fy>0&&dx*fx+dy*fy<320&&Math.abs(dx*fy-dy*fx)<reservedHalfWidth);}).slice(0,26);
    const score=packed.length*10000+packed.reduce((sum,p)=>sum+p.interior,0);if(score>bestScore){best=packed;bestScore=score;angleChoice=angle;}
   }
  }
  if(angleChoice!==null){shotLaneAngle=angleChoice;g.player.angle=angleChoice;d.setInput({x:0,y:0,fire:false,angle:angleChoice,autoAim:false});}
  return best;
 };
 let staged=[],chosen=null,mostVisible=0,plasmaLaneProof=null;
 const place=points=>{
  g.enemies.reset();const placed=[];
  for(const p of points){const id=d.spawn(placed.length%5===0?'spitter':'brute',p.x,p.y,placed.length%4===0);if(id){
   const actor=g.enemies.getSnapshot(id);
   if(!actor||!d.canStand(p.x,p.y,actor.radius)||!d.clearShot(p.x,p.y)||Math.hypot(p.x-g.player.x,p.y-g.player.y)<actor.radius+g.player.radius+12)throw Error('Heavy native spawn clearance failed');
   placed.push({...p,id,radius:actor.radius});
  }}
  return placed;
 };
 const refine=()=>{
  let points=pack(),placed=place(points),visible=0;
  for(let pass=0;pass<6&&placed.length;pass++){
   const actualPresentationMs=settlePresentation();visible=g.enemies.snapshot.enemies.filter(e=>d.renderer.visible(e.x,e.y)).length;
   packingTrials.push({player:{x:g.player.x,y:g.player.y},pass,staged:placed.length,visible,requestedPresentationMs:200,actualPresentationMs,simulationAdvancedMs:0});
   if(visible>=24)break;
   if(pass<5){points=pack();placed=place(points);}
  }
  return {placed,visible};
 };
 for(const center of centers){
  // Retain the preceding trial's actors while the native camera settles; an
  // empty encounter must not be advanced repeatedly just to search its floor.
  shotLaneAngle=null;Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0});d.setInput({x:0,y:0,fire:false,angle:g.player.angle,autoAim:false});settlePresentation(36);
  const result=refine();staged=result.placed;const visible=result.visible;
  if(visible>mostVisible){mostVisible=visible;chosen={...center,shotLaneAngle,points:staged.map(p=>({...p}))};}
  if(visible>=24)break;
 }
 // Recreate the best trial when the last spatial candidate was worse. Eighteen
 // initial visible bodies leave the unchanged twelve-per-frame combat gate room
 // for native movement, damage and the grenade; no enemies are frozen or buffed.
 if(mostVisible<18)throw Error(`Only ${mostVisible} visible legal enemies could be staged`);
 if(g.enemies.snapshot.enemies.filter(e=>d.renderer.visible(e.x,e.y)).length<mostVisible){
  shotLaneAngle=chosen.shotLaneAngle;Object.assign(g.player,{x:chosen.x,y:chosen.y,vx:0,vy:0,angle:shotLaneAngle});d.setInput({x:0,y:0,fire:false,angle:shotLaneAngle,autoAim:false});settlePresentation(72);staged=place(chosen.points);settlePresentation();
  if(g.enemies.snapshot.enemies.filter(e=>d.renderer.visible(e.x,e.y)).length<18)staged=refine().placed;
 }
 if(g.enemies.snapshot.enemies.filter(e=>d.renderer.visible(e.x,e.y)).length<18)throw Error('Heavy native framing lost eighteen initial visible targets');
 if(!status){
  // Resolve the real grenade before firing, so the first captured plasma pulse
  // does not depend on a short accidental overlap between two independent clocks.
  g.grenade();d.step(700);
  for(let i=0;i<60&&!d.events.some(e=>e.type==='explosion'&&g.elapsed-e.at<.25);i++)d.step(1000/60);
  if(!d.events.some(e=>e.type==='explosion'&&g.elapsed-e.at<.25))throw Error('Heavy fixture grenade did not explode');
 }
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
  // Aim a native shot through legal floor with enough travel before a body.
  // Autoaim could select an adjacent shield and consume every round immediately.
  let aim=null,clearance=-1,tested=0,legal=0;
  const evaluateAngle=angle=>{
   tested++;const fx=Math.cos(angle),fy=Math.sin(angle);
   if(![32,64,96].every(radius=>d.canStand(g.player.x+fx*radius,g.player.y+fy*radius,16))||!d.clearShot(g.player.x+fx*120,g.player.y+fy*120))return;
   legal++;let travel=300;
   for(const e of g.enemies.snapshot.enemies){const dx=e.x-g.player.x,dy=e.y-g.player.y,along=dx*fx+dy*fy;if(along>0&&Math.abs(dx*fy-dy*fx)<60)travel=Math.min(travel,along);}
   if(travel>clearance){clearance=travel;aim=angle;}
  };
  for(let i=0;i<48;i++)evaluateAngle(i*Math.PI/24);
  const coarseClearance=clearance;
  // These authored bays have a narrow gap between the unchanged wall/body
  // cones after grenade resolution. Keep every sufficient original48-angle
  // aim, then test144 quarter-offsets only if its60-unit travel gate failed.
  if(['breached-loading-bay','overload-floor'].includes(g.node.templateId)&&(aim===null||clearance<60))for(let i=0;i<192;i++)if(i%4)evaluateAngle(i*Math.PI/96);
  plasmaLaneProof={tested,legal,coarseClearance,clearance,aim,player:{x:g.player.x,y:g.player.y},minimumTravel:60,bodyHalfWidth:60,simulationAdvancedMs:0};
  if(aim===null||clearance<60)throw Error('No legal travelling plasma lane in heavy fixture '+JSON.stringify({room:g.node.templateId,player:{x:g.player.x,y:g.player.y},aim,clearance,reservedAngle:shotLaneAngle}));
  d.setInput({fire:true,angle:aim,autoAim:false});d.step(1000/60);
  if(!(d.renderer.muzzle.intensity>0&&g.bullets.some(b=>b.kind==='player')))throw Error('Heavy fixture lacks first real plasma pulse');
 }
 return {staged:staged.length,player:{x:g.player.x,y:g.player.y},packingExclusion,packingSpacing:54.01,reservedFiringLane:{angle:shotLaneAngle,length:320,halfWidth:reservedHalfWidth},plasmaLaneProof,packingTrials};
}

/** A repeatable moving firefight on the native camera, with real Combat Rig receipts. */
export async function stageKiting(attempt=0){
 const d=window.__containmentDebug,g=d.game;
 if(!attempt)d.i10KitingAttempts=[];
 const laneSearch=d.i10KitingAttempts??=[];
 if(attempt){
  // Start a fresh real attempt through the validated route helper. Advancing
  // an emptied prior encounter just to recharge could legitimately clear it.
  await d.gotoRoom(g.node.templateId,{version:g.expedition.run.version,rig:'cryo'});
 }
 d.invulnerable(true);g.enemies.reset();
 // Pack against the final HUD reservation, including the optional right radar.
 d.measureLuminance=true;
 d.uiFixture({preferences:{radar:true,combatText:true}});d.refresh();
 const bounds=g.geometry.bounds,candidates=[],footprint=[],packingExclusion=Math.max(110,g.player.radius+28+12);
 // Read the current native HUD-aware footprint without moving/zooming the camera.
 // Translating these offsets ranks floor candidates only; final packing below is
 // always queried again against the actually settled camera at the chosen lane.
 for(let dy=-520;dy<=520;dy+=65)for(let dx=-520;dx<=520;dx+=65)if(Math.hypot(dx,dy)>=packingExclusion&&Math.hypot(dx,dy)<=650&&d.renderer.visible(g.player.x+dx,g.player.y+dy))footprint.push({dx,dy});
 for(let y=bounds.y+70;y<bounds.y+bounds.height-70;y+=70)for(let x=bounds.x+70;x<bounds.x+bounds.width-70;x+=70){
  if(!d.canStand(x,y,28))continue;
  const floor=footprint.filter(p=>d.canStand(x+p.dx,y+p.dy,28)&&d.clearShot(x+p.dx,y+p.dy,{x,y})),headings=[];
  for(let i=0;i<16;i++){
   const angle=i*Math.PI/8,fx=Math.cos(angle),fy=Math.sin(angle);let legal=true;
   for(let distance=-150;distance<=80;distance+=10)if(!d.canStand(x+fx*distance,y+fy*distance,20)){legal=false;break;}
   if(legal)headings.push({angle,score:floor.filter(p=>!(p.dx*fx+p.dy*fy>0&&p.dx*fx+p.dy*fy<320&&Math.abs(p.dx*fy-p.dy*fx)<75)).length});
  }
  if(!headings.length)continue;headings.sort((a,b)=>b.score-a.score);
  candidates.push({x,y,headings,score:floor.length-Math.hypot(x-bounds.x-bounds.width/2,y-bounds.y-bounds.height/2)/10000});
 }
 // The manual chamber/relay north rim can straddle both sides of the marine:
 // its initial shot can show twenty bodies, then native auto-aim flips the
 // contact composition and loses the twelve-body reserve. Prefer the legal
 // west-side approach in these authored rooms, keeping the crowd on the same
 // side through the burst. Candidate legality, all32 lane attempts, spacing,
 // native abilities and every saved-frame visibility guard remain unchanged.
 const westApproach=['manual-control-chamber','relay-racks'].includes(g.node.templateId);
 candidates.sort((a,b)=>westApproach?a.x-b.x||b.score-a.score:b.score-a.score);
 const lanes=[],remaining=[...candidates];
 while(remaining.length&&lanes.length<16){
  let best=0;for(let i=1;i<remaining.length;i++){
   const merit=p=>p.score-(westApproach?(p.x-bounds.x)/4:0)-(lanes.length?Math.max(0,160-Math.min(...lanes.map(c=>Math.hypot(c.x-p.x,c.y-p.y))))/5:0);
   if(merit(remaining[i])>merit(remaining[best]))best=i;
  }
  lanes.push(remaining.splice(best,1)[0]);
 }
 const center=lanes[attempt%lanes.length],heading=center?.headings[Math.floor(attempt/lanes.length)%center.headings.length].angle??0;
 const maxAttempts=Math.min(32,lanes.length*2);
 if(!center)throw Error('No legal kiting movement lane');
 // Dash INTO the scored open space, before enemies are staged. Placing the
 // swarm before the dash could leave the marine inside a brute's shot radius.
 const start={x:center.x-Math.cos(heading)*150,y:center.y-Math.sin(heading)*150};
 Object.assign(g.player,{...start,angle:heading,vx:0,vy:0});
 d.setInput({x:0,y:0,fire:false,angle:heading,autoAim:false});d.step(600);
 if(!g.useAbility('dash'))throw Error('Kiting Frost Trail denied '+JSON.stringify({attempt,status:g.status,dash:g.abilities.snapshot.slots.dash}));
 d.step(160);d.step(600);g.enemies.reset();d.refresh();
 // Settle the native follow spring after the dash before evaluating visible packing.
 const origin={x:g.player.x,y:g.player.y};
 // Choose the reserved firing lane against the real rendered footprint. The old
 // first-legal angle could reserve the only visible floor around the reactor core.
 let shotAngle=null,best=[],initialVisible=0;
 const viewMinimum=g.node.templateId==='communal-atrium'?15:18;
 // Preview the same public placement-ready contract used by the HUD. A denser
 // candidate must still support the burst's later real Glacier, at the shot aim.
 const glacierFits=angle=>{
  const previous=g.player.angle;g.player.angle=angle;let available=false;
  for(const radius of [220,160,300])for(let i=0;i<16&&!available;i++){
   const a=i*Math.PI/8,target={x:origin.x+Math.cos(a)*radius,y:origin.y+Math.sin(a)*radius};
   if(!d.canStand(target.x,target.y,28)||!d.clearShot(target.x,target.y))continue;
   g.setAimPoint(target);available=g.abilities.snapshot.slots.power.ready;
  }
  g.setAimPoint(null);g.player.angle=previous;return available;
 };
 const choosePacking=()=>{
  let choice=[],angleChoice=null,choiceScore=-Infinity;const spacing=65.01,row=spacing*Math.sqrt(3)/2,layouts=[];
  // All points within each hex phase already satisfy the original65-unit
  // separation. Dense native-visible floor is no longer blocked by inner rings.
  // Quarter-cell phases resolve narrow legal strips without reducing spacing
  // or changing the seed/lane budget. The two orientations retain hex packing.
  for(let layout=0;layout<32;layout++){
   const points=[];
   for(let iy=-12;iy<=12;iy++)for(let ix=-12;ix<=12;ix++){
    const u=(ix+(iy&1)*.5+(layout&3)*.25)*spacing,v=(iy+((layout>>2)&3)*.25)*row;
    const x=origin.x+(layout<16?u:v),y=origin.y+(layout<16?v:u),distance=Math.hypot(x-origin.x,y-origin.y);
    if(distance<packingExclusion||distance>650||!d.renderer.visible(x,y)||!d.canStand(x,y,28)||!d.clearShot(x,y))continue;
    const interior=[[-20,0],[20,0],[0,-20],[0,20],[-45,0],[45,0],[0,-45],[0,45]].filter(([dx,dy])=>d.renderer.visible(x+dx,y+dy)).length;
    points.push({x,y,distance,interior});
   }
   points.sort((a,b)=>b.interior-a.interior||a.distance-b.distance||a.y-b.y||a.x-b.x);layouts.push(points);
  }
  // Keep the verified native aim while refining its contacts. Re-optimizing
  // all forty-eight opposing aims on every pass can alternate two different
  // camera footprints without ever converging either legal pack.
  for(let i=0;i<(shotAngle===null?48:1);i++){
   const angle=shotAngle??heading+Math.PI+i*Math.PI/24,fx=Math.cos(angle),fy=Math.sin(angle);
   if(![60,120,180,240].every(radius=>d.canStand(origin.x+fx*radius,origin.y+fy*radius,16))||!d.clearShot(origin.x+fx*260,origin.y+fy*260))continue;
   for(const points of layouts){
    const packed=points.filter(p=>{const dx=p.x-origin.x,dy=p.y-origin.y,along=dx*fx+dy*fy;return !(along>0&&along<320&&Math.abs(dx*fy-dy*fx)<75);}).slice(0,26);
    const score=packed.length*10000+packed.reduce((sum,p)=>sum+p.interior,0);
    if(score>choiceScore&&glacierFits(angle)){choice=packed;angleChoice=angle;choiceScore=score;}
   }
  }
  return {points:choice,angle:angleChoice};
 };
 const place=()=>{
  const packing=choosePacking();best=packing.points;shotAngle=packing.angle;initialVisible=best.length;
  // Preserve fifteen initial visible bodies in the atrium plus eighteen legal
  // world targets. Bearing/radar integration still has real offscreen threats.
  if(best.length>=viewMinimum&&best.length<18&&shotAngle!==null){
   const fx=Math.cos(shotAngle),fy=Math.sin(shotAngle);
   for(let y=bounds.y+28;y<bounds.y+bounds.height-28&&best.length<26;y+=35)for(let x=bounds.x+28;x<bounds.x+bounds.width-28&&best.length<26;x+=35){
    const dx=x-origin.x,dy=y-origin.y,distance=Math.hypot(dx,dy),along=dx*fx+dy*fy,across=Math.abs(dx*fy-dy*fx);
    if(distance<packingExclusion||distance>650||along>0&&along<320&&across<75||d.renderer.visible(x,y)||!d.canStand(x,y,28)||!d.clearShot(x,y)||best.some(p=>Math.hypot(p.x-x,p.y-y)<65.01))continue;
    best.push({x,y});
   }
  }
  // The unengaged camera deliberately keeps the hero at122px. It can contain
  // fewer than eighteen marks even though the eventual100px combat footprint
  // fits the unchanged reserve. Seed those legal marks first, then converge
  // against actual contacts below; no provisional pack is a saved fixture.
  if(!best.length||shotAngle===null)return [];
  g.enemies.reset();const placed=[];
  for(const p of best){const id=d.spawn(placed.length%5===0?'spitter':'brute',p.x,p.y,placed.length%3===0);if(id){
   const actor=g.enemies.getSnapshot(id);
   if(!actor||!d.canStand(p.x,p.y,actor.radius)||!d.clearShot(p.x,p.y)||Math.hypot(p.x-origin.x,p.y-origin.y)<actor.radius+g.player.radius+12)throw Error('Kiting native spawn clearance failed');
   placed.push({...p,id,radius:actor.radius});
  }}
  // Select contacts with the same aim used by the first real rifle round,
  // rather than the previous dash heading (which can face the opposite way).
  g.player.angle=shotAngle;
  d.setInput({x:0,y:0,fire:false,angle:shotAngle,autoAim:false});
  return placed;
 };
 let placed=place(),placedVisible=0;const packingPasses=[];
 // Contact framing starts only after actors exist. Repack against that native
 // footprint before paying for a fresh room/dash attempt; do not edit the camera.
 for(let pass=0;pass<6&&placed.length>0;pass++){
  // refresh() has zero renderer delta in capture mode. Let the production
  // follow/room springs settle against unchanged legal actors before judging
  // a pack; no simulation update or input tick occurs in this synchronous span.
  const simulationBefore=g.elapsed,rendererBefore=d.renderer.time;
  d.realtime(true);
  try{for(let frame=0;frame<12;frame++)d.renderer.render(g,1/60,false);}finally{d.realtime(false);}
  if(g.elapsed!==simulationBefore)throw Error('Kiting presentation settle advanced simulation');
  d.refresh();d.refresh();placedVisible=g.enemies.snapshot.enemies.filter(e=>d.renderer.visible(e.x,e.y)).length;
  packingPasses.push({pass,staged:placed.length,initialVisible,placedVisible,shotAngle,simulationAdvancedMs:0,requestedPresentationMs:200,actualPresentationMs:Number.isFinite(rendererBefore)&&Number.isFinite(d.renderer.time)?(d.renderer.time-rendererBefore)*1000:null});
  if(placed.length>=18&&initialVisible>=viewMinimum&&placedVisible>=viewMinimum)break;
  if(pass<5)placed=place();
 }
 // Fifteen remains the atrium's hard floor, but prefer an eighteen-body native
 // reserve in the first few distinct lanes so movement does not immediately
 // exhaust the unchanged twelve-per-frame requirement.
 const thinAtrium=g.node.templateId==='communal-atrium'&&Math.min(initialVisible,placedVisible)<18&&attempt<4;
 laneSearch.push({attempt,room:g.node.templateId,player:origin,heading,initialVisible,placedVisible,staged:placed.length,packingPasses});if(laneSearch.length>64)laneSearch.shift();
 if((placed.length<18||initialVisible<viewMinimum||placedVisible<viewMinimum||thinAtrium)&&attempt+1<maxAttempts)return stageKiting(attempt+1);
 if(shotAngle===null)throw Error('No clear kiting firing lane');
 if(placed.length<18)throw Error(`Only ${placed.length} legal kiting targets (current visible packing ${initialVisible}, lane ${attempt+1}/${maxAttempts}; all lane counts ${JSON.stringify(laneSearch.map(p=>({attempt:p.attempt,initial:p.initialVisible,settled:p.placedVisible,staged:p.staged})))})`);
 if(initialVisible<viewMinimum)throw Error(`Only ${initialVisible} initial visible kiting targets`);
 if(placedVisible<viewMinimum)throw Error(`Only ${placedVisible} kiting targets fit the HUD-aware camera`);
 g.switchWeapon('rifle');
 if(!g.useAbility('tactical'))throw Error('Kiting Cryo Nova denied');
 // Acquire the first actual travelling round without drifting out of its verified lane.
 d.setInput({x:0,y:0,fire:true,angle:shotAngle,autoAim:false});d.step(1000/60);
 if(!(d.renderer.muzzle.intensity>0&&g.bullets.some(bullet=>bullet.kind==='player')))throw Error(`No travelling rifle round in verified kiting lane: ${JSON.stringify({player:origin,shotAngle,weapon:g.combat.snapshot.weaponId,magazine:g.combat.snapshot.magazine,shots:g.stats.shotsFired,bullets:g.bullets.length,state:g.status})}`);
 d.uiFixture({preferences:{radar:true,combatText:true}});
 return {staged:placed.length,initialVisible,placedVisible,approach:westApproach?'west':'ranked-native-footprint',offscreenStaged:placed.length-initialVisible,packingExclusion,minimumSpawnClearance:Math.min(...placed.map(p=>Math.hypot(p.x-origin.x,p.y-origin.y)-p.radius-g.player.radius)),packingSpacing:65.01,packingPoints:placed.map(({id,x,y,radius})=>({id,x,y,radius})),packingPasses,laneSearch,laneAttempt:attempt,player:origin,dashStart:start,heading,shotAngle,reservedFiringLane:{length:320,halfWidth:75},liveRig:'cryo',script:'Frost Trail into open center; Nova + rifle; Glacier at frame 2; Whiteout at frame 3',invulnerable:true};
}

/** Deterministic motion and public ability actions are keyed to burst frame index. */
export function advanceKiting({frame,stepMs}){
 const d=window.__containmentDebug,g=d.game;
 if(frame===1){
  // Probe legal cursor placements through the public action's own wall validation.
  let accepted=false;
  for(const radius of [220,160,300])for(let i=0;i<16&&!accepted;i++){
   const angle=i*Math.PI/8,target={x:g.player.x+Math.cos(angle)*radius,y:g.player.y+Math.sin(angle)*radius};
   if(!d.canStand(target.x,target.y,28)||!d.clearShot(target.x,target.y))continue;
   g.setAimPoint(target);accepted=g.useAbility('power');
  }
  if(!accepted)throw Error('No legal Glacier placement in kiting fixture');
 }
 if(frame===2){d.fillOverdrive();if(!g.useAbility('overdrive'))throw Error('Kiting Whiteout denied');}
 if(frame){
  // Rank legal motion by the worst translated native footprint in either
  // follow direction. Eighteen centers alone no longer imply a spare outer
  // row under the closer camera; actual movement/auto-aim still run normally.
  const base=(frame%8)*Math.PI/4,contacts=g.enemies.snapshot.enemies.filter(e=>e.health>0);
  const distance=220*stepMs/1000*g.abilities.moveSpeedMultiplier;let direction=null,best=-Infinity;
  for(let i=0;i<16;i++){
   const angle=base+i*Math.PI/8,x=Math.cos(angle),y=Math.sin(angle);
   if(![24,48,72].every(radius=>d.canStand(g.player.x+x*radius,g.player.y+y*radius,20)))continue;
   const retained=Math.min(...[-1,1].map(sign=>contacts.filter(e=>d.renderer.visible(e.x+sign*x*distance,e.y+sign*y*distance)).length));
   const interior=contacts.filter(e=>[[-20,0],[20,0],[0,-20],[0,20]].every(([dx,dy])=>d.renderer.visible(e.x-x*distance+dx,e.y-y*distance+dy))).length;
   const score=retained*100+interior;
   if(score>best){best=score;direction={x,y};}
  }
  if(!direction)throw Error('Kiting fixture lost its movement lane');
  d.setInput({...direction,fire:true,angle:null,autoAim:true});d.step(stepMs);
  if(!d.canStand(g.player.x,g.player.y))throw Error('Kiting marine left navigable floor');
 }
 d.refresh();
}

export function inspectFrame(){
 const d=window.__containmentDebug,g=d.game,r=d.renderer;d.refresh();
 const gl=r.renderer.getContext();
 // Read the just-rendered default framebuffer before the browser clears it.
 const xs=[];for(let y=0;y<18;y++)for(let x=0;x<32;x++){const p=new Uint8Array(4);gl.readPixels(Math.floor((x+.5)*gl.drawingBufferWidth/32),Math.floor((y+.5)*gl.drawingBufferHeight/18),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);xs.push(`${p[0]>>3},${p[1]>>3},${p[2]>>3}`);}
 const enemies=g.enemies.snapshot.enemies.filter(e=>e.health>0),visible=enemies.filter(e=>r.visible(e.x,e.y));
 if(d.g5Proof){
  const owners=[{model:r.player,family:'marine'},...(g.boss.snapshot.active&&r.queen?[{model:r.queen,family:'queen'}]:[]),...enemies.map(e=>({model:r.actors.get(e.id),family:e.type,elite:e.elite,champion:e.champion}))].filter(o=>o.model);
  d.g5Proof.projected=owners.map(o=>{const p=o.model.root.position.clone();p.y=o.model.height*.5;p.project(r.camera);return {name:o.family,elite:o.elite,champion:o.champion,x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
  if(d.g5Proof.silhouette){
   // One-shot evidence readback only, following G3's existing fixture convention.
   const target=r.post.resources.scene,w=target.width,h=target.height,bytes=new Uint8Array(w*h*4);
   r.renderer.readRenderTargetPixels(target,0,0,w,h,bytes,undefined,1);
   const masks=owners.map(o=>({id:o.model.root.userData.containmentGeometryId,name:o.family,elite:o.elite,champion:o.champion,spans:[]})),byId=new Map(masks.map(m=>[m.id,m]));
   for(let y=0;y<h;y++)for(let x=0;x<w;){const id=bytes[(y*w+x)*4+2],mask=byId.get(id);let end=x+1;while(end<w&&bytes[(y*w+end)*4+2]===id)end++;if(mask)mask.spans.push([x,h-1-y,end-x]);x=end;}
   d.g5Proof.masks={width:w,height:h,actors:masks};
  }
 }
 const marineBounds={...r.playerScreenBounds(g.player.radius)},hudOverlaps=[];
 // CAM12: capture the drawn pose and weapon, rather than the standing collider proxy.
 if(r.marineEnvelope?.count){
  const point=r.player.root.position.clone(),rect=r.canvas.getBoundingClientRect();
  marineBounds.left=marineBounds.top=Infinity;marineBounds.right=marineBounds.bottom=-Infinity;
  for(let n=0;n<r.marineEnvelope.count;n++){r.marineEnvelope.point(point,n);point.project(r.camera);const x=rect.left+(point.x+1)*rect.width/2,y=rect.top+(1-point.y)*rect.height/2;marineBounds.left=Math.min(marineBounds.left,x);marineBounds.right=Math.max(marineBounds.right,x);marineBounds.top=Math.min(marineBounds.top,y);marineBounds.bottom=Math.max(marineBounds.bottom,y);}
 }
 for(const selector of ['#status-hud','#action-bar','.vitals','#boss-hud','#radar-hud','#hud-toasts']){
  const element=document.querySelector(selector);if(!element||element.hidden||!element.getClientRects().length)continue;
  const box=element.getBoundingClientRect();if(box.width>0&&box.height>0&&box.left<marineBounds.right&&box.right>marineBounds.left&&box.top<marineBounds.bottom&&box.bottom>marineBounds.top)hudOverlaps.push(selector);
 }
 const playfieldSamples=[],marineLocalSamples=[],visibleFloorSamples=[],visibleHeroFloorSamples=[],visibleFloorSurfaces=[];
 const playfieldProjection=d.measureLuminance?{inverseProjection:r.camera.projectionMatrixInverse.toArray(),world:r.camera.matrixWorld.toArray(),boundary:g.geometry.boundary??[{x:0,y:0},{x:g.geometry.bounds.width,y:0},{x:g.geometry.bounds.width,y:g.geometry.bounds.height},{x:0,y:g.geometry.bounds.height}]}:null;
 if(d.measureLuminance){
  const {width,height}=g.geometry.bounds,canvas=r.canvas,point=r.screenPoint;
  for(let y=height/140;y<height;y+=height/70)for(let x=width/140;x<width;x+=width/70){
   if(!d.canStand(x,y,12))continue;
   point.set(x/32,.04,y/32).project(r.camera);
   const px=(point.x+1)/2,py=(1-point.y)/2;
   const sample=[Math.round(px*canvas.clientWidth),Math.round(py*canvas.clientHeight)],inDeck=px>.15&&px<.85&&py>.2&&py<.8,inHero=px>0&&px<1&&py>0&&py<1&&Math.hypot(x-g.player.x,y-g.player.y)<=96;
   if(inDeck)playfieldSamples.push(sample);if(inHero)marineLocalSamples.push(sample);
   // Keep occluding machine roofs/walls out of the floor statistic. Capture-only ray query.
   if(inDeck||inHero){
    r.raycaster.setFromCamera(point,r.camera);const surface=r.raycaster.intersectObject(r.world,true).find(hit=>hit.object.visible);
    if(surface){
     const materialIndex=surface.face?.materialIndex??0,material=Array.isArray(surface.object.material)?surface.object.material[materialIndex]:surface.object.material;
     const isFloor=surface.point.y<.085;
     // Reuse exactly the existing classification hit; no extra rays or altered
     // sample membership. Keep roofs too so the actual top surface is auditable.
     visibleFloorSurfaces.push({sample,world:{x:surface.point.x,y:surface.point.y,z:surface.point.z},materialIndex,materialName:material?.name??null,meshName:surface.object.name??'',inDeck,inHero,isFloor});
     if(isFloor){if(inDeck)visibleFloorSamples.push(sample);if(inHero)visibleHeroFloorSamples.push(sample);}
    }
   }
  }
 }
 const layout=[...document.querySelectorAll('.panel, .title-screen, .title-drawer, #pause-tabpanel, .rig-panel > .ability-preview, .deck-map')].filter(node=>node.getClientRects().length).map(node=>{
  const rect=node.getBoundingClientRect(),style=getComputedStyle(node);
  const normal=[...node.children].filter(child=>{const s=getComputedStyle(child);return !child.hidden&&s.position!=='absolute'&&s.position!=='fixed';});
  const contentBottom=normal.reduce((bottom,child)=>Math.max(bottom,child.getBoundingClientRect().bottom),rect.top);
  const contentRight=normal.reduce((right,child)=>Math.max(right,child.getBoundingClientRect().right),rect.left);
  return {selector:node.id?`#${node.id}`:'.'+[...node.classList].join('.'),left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:node.clientWidth,height:node.clientHeight,scrollWidth:node.scrollWidth,scrollHeight:node.scrollHeight,overflowX:node.scrollWidth>node.clientWidth+2&&contentRight>rect.right+2,overflowY:node.scrollHeight>node.clientHeight+2&&contentBottom>rect.bottom+2,outsideViewport:rect.left < -2||rect.top < -2||rect.right > innerWidth+2||rect.bottom > innerHeight+2,overflow:style.overflow};
 });
 const map={nodes:document.querySelectorAll('[data-node-id]').length,edges:document.querySelectorAll('[data-edge]').length,current:document.querySelectorAll('[data-map-state=current]').length,choices:document.querySelectorAll('[data-inspect-route]').length,confirmation:document.querySelector('[data-route]')?.getAttribute('data-route')??null,expectedNodes:g.expedition.run.version===3?20:g.expedition.run.version===2?18:9};
 const queenBounds={left:0,right:0,top:0,bottom:0};const queenBody=g.boss.snapshot.active&&r.actorScreenBounds(-1,g.boss.snapshot.x,g.boss.snapshot.y,92,queenBounds)?queenBounds:null;
 const queenProjected=g.boss.snapshot.active?(()=>{const p=r.player.root.position.clone().set(g.boss.snapshot.x/32,(r.queen?.height??2)*.5,g.boss.snapshot.y/32).project(r.camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};})():null;
 const g6FramingProof=r.hudInsets?{insets:{...r.hudInsets},viewport:{width:r.viewportWidth,height:r.viewportHeight},framing:r.combatFramingDiagnostics??null,marineBounds,contacts:enemies.map(e=>{
  const point=r.camera.position.clone(),model=r.actors?.get(e.id),height=model?.height??2;
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const ix of [-1,1])for(const iz of [-1,1])for(const iy of [0,1]){point.set((e.x+ix*e.radius)/32,iy*height,(e.y+iz*e.radius)/32).project(r.camera);const x=(point.x+1)*.5*r.viewportWidth,y=(1-point.y)*.5*r.viewportHeight;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const dx=e.x-g.player.x,dy=e.y-g.player.y,distance=Math.hypot(dx,dy),aim=(dx*Math.cos(g.player.angle)+dy*Math.sin(g.player.angle))/Math.max(1,distance);
  return {x:e.x,y:e.y,id:e.id,type:e.type,meleePhase:e.meleePhase,windupMs:e.windupMs,chargeMs:e.chargeMs,pendingAttack:!!e.pendingAttack,distance,aim,visible:r.visible(e.x,e.y),bounds:{left,right,top,bottom},insideUsable:left>=r.hudInsets.left&&right<=r.viewportWidth-r.hudInsets.right&&top>=r.hudInsets.top&&bottom<=r.viewportHeight-r.hudInsets.bottom};
 })}:null;
 const dressing=r.world?.getObjectByName('g2-world-dressing')?.userData;
 const warningProof=dressing?.storyDisplays?{text:dressing.displayText,clearance:dressing.warningClearance,supports:dressing.warningSupports,faded:dressing.warningVisibility?.faded,opacity:dressing.warningVisibility?.material?.opacity,structureOpacity:dressing.warningVisibility?.structure?.opacity,fadedParts:dressing.warningVisibility?.fadedParts,totalParts:dressing.warningVisibility?.totalParts,structureFaded:dressing.warningVisibility?.structureFaded,panels:dressing.storyDisplays.map(panel=>({mount:panel.mount,corners:panel.corners.map(c=>r.camera.position.clone().fromArray(c).project(r.camera).toArray())}))}:null;
 return {renderPrograms:r.renderer.info.programs?.length??0,e9InteriorProof:r.world?.getObjectByName('e9-room-interiors')?.userData.interior??null,warningProof,l8ArenaCalmProof:d.l8ArenaCalmProof??null,l8PointerProof:d.l8PointerProof??null,l8FixtureProof:d.l8FixtureProof??null,queenBounds:queenBody,roomFraming:r.roomCombatFraming?{...r.roomCombatFraming.diagnostics}:null,e6KitProof:r.world?.getObjectByName('e6-room-kits')?.userData??null,queenProjected,e7LandmarkProof:d.e7LandmarkProof??null,i9PriorityPair:d.i9PriorityPair??null,g5Proof:d.g5Proof??null,g6ConstructionProof:dressing?{environment:dressing.constructionLanguage,parts:dressing.constructionParts,triangles:dressing.constructionTriangles,consumptionForms:dressing.consumptionForms??[],skinWinding:dressing.consumptionSkinWinding??[],lightFixtures:dressing.lightFixtures??[],partlyBuriedHumanFixture:dressing.partlyBuriedHumanFixture??null}:null,g6FramingProof,i8FamilyProof:d.i8FamilyProof??null,i8CorpseProof:d.i8CorpseProof??null,geometryCoverageProof:d.geometryCoverageProof??null,voidContourProof:d.voidContourProof??null,inkPreparationProof:d.inkPreparationProof??null,g4FootprintProof:d.g4FootprintProof??null,g4DangerProof:d.g4DangerProof??null,preparation:r.preparationDiagnostics??null,staticBatching:r.world?.userData.staticBatching??null,i4Proof:d.i4Proof?{...d.i4Proof,pending:g.pending.length,active:g.enemies.activeCount}:null,championProof:d.championProof??null,pickupProof:d.pickupProof??null,queenPhase:g.boss.snapshot.phase,interimMeshes:r.scene.getObjectByName('interim-ability-visuals')?.children.filter(o=>o.visible&&o.isMesh&&(o.count===undefined||o.count>0)).length??0,drawErrors:d.drawErrors??[],settingsProof:d.settingsProof??null,marineBounds,hudOverlaps,kitingProof:d.kitingProof??null,shaderCompilations:d.shaderCompilations??null,recoveryProof:d.recoveryProof??null,lighting:r.lighting?.fixtures?.map(l=>({x:l.position.x,y:l.position.y,z:l.position.z,energy:l.intensity,color:l.color.getHex(),visible:l.visible,poolStyle:l.userData.poolStyle,poolAngle:l.userData.poolAngle,poolWidth:l.userData.poolWidth,poolDepth:l.userData.poolDepth,fixtureGain:l.userData.fixtureGain,humanFailed:l.userData.humanFailed})),poolLights:r.lighting?.pool?.lights?.filter(l=>l.visible).length,playfieldSamples,marineLocalSamples,visibleFloorSamples,visibleHeroFloorSamples,visibleFloorSurfaces,playfieldProjection,abilities:g.abilities.snapshot,stats:g.stats,recentEffects:d.events.filter(e=>g.elapsed-e.at<.25),state:g.status,uiState:document.body.dataset.state,phase:g.expedition.run.phase,templateId:g.node.templateId,elapsed:g.elapsed,player:{x:g.player.x,y:g.player.y,visible:r.visible(g.player.x,g.player.y)},enemies:enemies.length,visibleEnemies:visible.length,bullets:g.bullets.length,playerBullets:g.bullets.filter(b=>b.kind==='player').length,muzzle:r.muzzle?.intensity??0,boss:g.boss.snapshot.active,statuses:visible.map(e=>({id:e.id,...g.boonStatuses(e.id)})),performance:window.__containmentPerformance,canvas:{colors:new Set(xs).size,litSamples:xs.filter(c=>c!=='0,0,0').length,contextLost:gl.isContextLost(),error:gl.getError()},hud:!document.querySelector('#hud').hidden,overlay:document.querySelector('#overlay').textContent.trim(),bossHud:!document.querySelector('#boss-hud').hidden,ui:{layout,map,damageReceipts:[...document.querySelectorAll('.combat-float[data-kind=damage]:not([hidden])')].map(n=>({text:n.textContent,source:n.dataset.source,element:n.dataset.element,token:n.dataset.damageToken,color:getComputedStyle(n).color})),rightColumnArea:['#status-hud','#radar-hud'].reduce((area,selector)=>{const n=document.querySelector(selector);if(!n||n.hidden)return area;const box=n.getBoundingClientRect();return area+box.width*box.height;},0),radarOpacity:getComputedStyle(document.querySelector('#radar-hud')).opacity,presentation:document.querySelector('#presentation-beat')?.textContent??'',toasts:[...document.querySelectorAll('.hud-toast:not([hidden])')].map(n=>n.textContent),abilitySlots:[...document.querySelectorAll('[data-ability]')].map(n=>({slot:n.dataset.ability,state:n.dataset.state,title:n.querySelector('.ability-title')?.textContent,value:n.querySelector('.ability-value')?.textContent,icon:!!n.querySelector('svg')})),damageNumbers:[...document.querySelectorAll('.combat-float[data-kind=damage]:not([hidden])')].map(n=>n.textContent),threatMarkers:[...document.querySelectorAll('.threat-marker:not([hidden])')].map(node=>{const box=node.getBoundingClientRect();return{enemyId:Number(node.dataset.enemyId),enemyIds:(node.dataset.enemyIds??node.dataset.enemyId??'').split(',').filter(Boolean).map(Number),kind:node.dataset.kind,attacking:node.dataset.attacking==='true',approaching:node.dataset.approaching==='true',opacity:Number(getComputedStyle(node).opacity),bounds:{left:box.left,top:box.top,right:box.right,bottom:box.bottom}};}),threats:document.querySelectorAll('.threat-marker:not([hidden])').length}};


}

// Explicit expanded views preserve outgoing/build evidence behind the new native disclosure.
for (const [baseId,id] of [['results-fixture','x3-results-statistics'],['complete-fixture','x3-completion-statistics']]) {
 const base=SCENARIOS.find(scenario=>scenario.id===baseId);
 SCENARIOS.push({...base,id,required:['.result-stats','.debrief-build'],setup:new Function(`return (async()=>{await (${base.setup.toString()})();for(let frame=0;frame<900&&!document.querySelector('.result-details');frame++)await new Promise(requestAnimationFrame);const details=document.querySelector('.result-details');if(!details)throw Error('Results disclosure missing');details.open=true;window.__containmentDebug.refresh();})();`)});
}

// I7 integration: actual boss deployables, champion statuses and pickup/zone overlap.
for(const rig of ['breacher','cryo','arc']){
 const exposed=SCENARIOS.find(s=>s.id==='g2-queen-exposed');
 const setup=exposed.setup.toString().replace("{version:2}",`{version:2,rig:'${rig}'}`);
 SCENARIOS.push({...exposed,id:`i7-boss-${rig}`,setup:new Function(`return (async()=>{
  await (${setup})();const d=window.__containmentDebug,g=d.game,p=g.player;
  let accepted=false;placement:for(const range of [100,140,180])for(const turn of [0,.4,-.4,.8,-.8]){
   const angle=p.angle+turn,x=p.x+Math.cos(angle)*range,y=p.y+Math.sin(angle)*range;
   if(!d.canStand(x,y,24))continue;g.setAimPoint({x,y});if(g.useAbility('power')){accepted=true;break placement;}
  }
  if(!accepted)throw Error('I7 boss power placement denied');d.step(g.abilities.snapshot.slots.power.castRemainingMs+30);
  if(!g.abilities.snapshot.deployables.length)throw Error('I7 boss deployable missing');d.refresh();
 })();`)});
}
{
 const champions=SCENARIOS.find(s=>s.id==='g2-champions');
 SCENARIOS.push({...champions,id:'i7-champions-effects',setup:new Function(`return (async()=>{
  await (${champions.setup.toString()})();const d=window.__containmentDebug,g=d.game;
  d.grantBoons(['incendiary','caustic-rounds','arc-filament']);d.setInput({fire:true});
  if(!g.useAbility('tactical'))throw Error('Champion ability effect denied');d.step(g.abilities.snapshot.slots.tactical.castRemainingMs+30);d.refresh();
 })();`)});
 const kit=SCENARIOS.find(s=>s.id==='v2-full-pyro-awakening-bay');
 SCENARIOS.push({...kit,id:'i7-pickups-zones',setup:new Function(`return (async()=>{
  await (${kit.setup.toString()})(${JSON.stringify(kit.setupArgument)});const d=window.__containmentDebug,g=d.game,p=g.player;
  let placed=0;for(const [i,kind]of ['credits','health','armor','ammo','grenade'].entries())for(const side of [1,-1]){
   const x=p.x+65+i*22,y=p.y+side*65;if(d.canStand(x,y)&&g.pickups.spawn(kind,20,x,y).spawned){placed++;break;}
  }
  if(placed!==5)throw Error('I7 pickup overlap placement incomplete');d.refresh();
 })();`)});
}


// U4 intentional inspection and critical-objective proof use real native input.
SCENARIOS.push({id:'u4-critical-objective',state:'playing',room:'containment-annulus',required:['#objective-critical','#radar-hud'],setup:async()=>{
 const d=window.__containmentDebug;await d.gotoRoom('containment-annulus',{rig:'arc'});d.invulnerable(true);d.uiFixture({preferences:{combatText:true,radar:true}});d.step(4500);d.refresh();
}});
SCENARIOS.push({id:'u4-ability-inspect',state:'playing',room:'awakening-bay',nativeFocus:'[data-ability=tactical]',nativeHold:['Alt'],required:['#ability-rules-tactical'],setup:async()=>{
 const d=window.__containmentDebug;await d.gotoRoom('awakening-bay',{rig:'arc'});d.invulnerable(true);d.step(4500);
 // A legal settled inspection mark leaves the deliberate tooltip clear of the marine at720p.
 const g=d.game,b=g.geometry.bounds,points=[];
 for(let y=b.y+40;y<b.y+220;y+=16)for(let x=b.x+60;x<b.x+b.width-60;x+=24)if(d.canStand(x,y,g.player.radius))points.push({x,y,distance:Math.abs(x-g.player.x)});
 points.sort((a,b)=>a.y-b.y||a.distance-b.distance);if(!points.length)throw Error('No legal desktop inspection mark');
 Object.assign(g.player,{x:points[0].x,y:points[0].y,vx:0,vy:0});d.step(900);d.refresh();
}});
const u4Draft=SCENARIOS.find(s=>s.id==='augment-draft');
SCENARIOS.push({...u4Draft,id:'u4-boon-inspect',nativeFocus:'[data-mutation=spreading-nova], [data-mutation=twin-glacier]',nativeHold:['Alt'],required:['.boon-inspect-detail:visible']});
SCENARIOS.push({...SCENARIOS.find(s=>s.id==='complete-fixture'),id:'u4-ending-reduced-motion',reducedMotion:true});
const u4Fire=SCENARIOS.find(s=>s.id==='v2-flashfire');
SCENARIOS.push({...u4Fire,id:'u4-burn-ticks',burst:false,required:['.combat-float[data-source=status][data-damage-token=pyro]:not([hidden])'],setup:new Function(`return (async()=>{
 await (${u4Fire.setup.toString()})(${JSON.stringify(u4Fire.setupArgument)});
 window.__containmentDebug.step(600);window.__containmentDebug.refresh();
})();`)});

// Native camera projection proof: place one legal contact beneath the actual radar.
SCENARIOS.push({id:'u4-radar-fade',state:'playing',required:['#radar-hud[data-obscures-threat=true]'],setup:async()=>{
 const d=window.__containmentDebug;
 for(const room of ['awakening-bay','armory','containment-annulus']){
  await d.gotoRoom(room,{rig:'arc'});d.invulnerable(true);d.game.enemies.reset();
  d.uiFixture({preferences:{combatText:true,radar:true}});d.refresh();
  const box=document.getElementById('radar-hud').getBoundingClientRect();
  const point=d.renderer.camera.position.clone();
  for(let y=box.top+16;y<box.bottom-8;y+=12)for(let x=box.left+16;x<box.right-8;x+=12){
   const floor=d.renderer.pointer(x,y+32);if(!floor||!d.canStand(floor.x,floor.y,28))continue;
   point.set(floor.x/32,.8,floor.y/32).project(d.renderer.camera);
   const sx=(point.x+1)*innerWidth/2,sy=(1-point.y)*innerHeight/2;
   if(sx<box.left+8||sx>box.right-8||sy<box.top+8||sy>box.bottom-8)continue;
   if(!d.spawn('brute',floor.x,floor.y))continue;
   d.step(300);d.refresh();
   if(document.getElementById('radar-hud').dataset.obscuresThreat==='true')return;
   d.game.enemies.reset();
  }
 }
 throw Error('No legal native contact beneath radar');
}});
// V4 adds matched friendly-yield overlaps without changing any existing scenario.
import { registerV4Scenarios } from './v4-scenarios.mjs';
registerV4Scenarios(SCENARIOS);
SCENARIOS.push({id:'g3-prop-motion',rooms:true,state:'playing',burst:true,setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;d.game.enemies.reset();d.setInput({x:.35,y:0,fire:false,angle:0,autoAim:false});d.refresh();}});

SCENARIOS.push({id:'g3-ink-switches',room:'awakening-bay',state:'playing',auditGraphics:true,setup:async()=>{
 const d=window.__containmentDebug,r=d.renderer;await d.gotoRoom('awakening-bay');d.invulnerable(true);r.setQuality('low');await d.prepare();
 const gl=r.renderer.getContext(),original=gl.createProgram;d.inkPreparationProof=[];
 for(const inkOutlines of ['off','silhouette','off','full']){
  r.setGraphicsOptions({inkOutlines});const held=r.roomLoading;if(!held)throw Error('Low ink topology transition did not hold readiness');await d.prepare();
  let compiled=0;gl.createProgram=function(){compiled++;return original.call(gl);};try{d.step(100);}finally{gl.createProgram=original;}
  if(compiled)throw Error('Prepared Low ink transition compiled '+compiled+' combat programs');
  d.inkPreparationProof.push({inkOutlines,held,compiled,postResources:!!r.post.resources});
 }
 r.setGraphicsOptions({inkOutlines:'silhouette'});await d.prepare();d.refresh();
}});

// One-shot capture proof; readbacks are test-only, outside the application frame.
SCENARIOS.push({id:'g3-void-contours',room:'awakening-bay',state:'playing',auditGraphics:true,setup:async()=>{
 const d=window.__containmentDebug,r=d.renderer;await d.gotoRoom('awakening-bay');d.invulnerable(true);d.game.enemies.reset();
 r.setGraphicsOptions({inkOutlines:'off',adaptiveResolution:false,bloom:false,ambientOcclusion:false,lensEffects:false,distortion:false,atmosphere:false});await d.prepare();
 const previous=r.scene.onBeforeRender;r.scene.onBeforeRender=function(...args){previous.apply(this,args);this.traverse(o=>{if(!o.isMesh)return;let marine=false;for(let p=o;p;p=p.parent)if(p===r.player.root)marine=true;if(!marine&&o.name!=='motivated-practical-bounce')o.visible=false;});};d.refresh();
 const gl=r.renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,before=new Uint8Array(w*h*4),after=new Uint8Array(w*h*4),ids=new Uint8Array(w*h*4),create=gl.createProgram;
 let compiled=0;gl.createProgram=function(){compiled++;return create.call(gl);};
 try{
  d.refresh();gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,before);
  r.setGraphicsOptions({inkOutlines:'silhouette'});d.refresh();gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,after);
  r.renderer.readRenderTargetPixels(r.post.resources.scene,0,0,w,h,ids,undefined,1);
 }finally{gl.createProgram=create;}
 let actorPixels=0,darkenedActorPixels=0,backgroundPixels=0;for(let i=0;i<ids.length;i+=4){if(ids[i+3]%8>=3&&ids[i+3]%8<=6){actorPixels++;if(before[i]+before[i+1]+before[i+2]-after[i]-after[i+1]-after[i+2]>15)darkenedActorPixels++;}else if(ids[i+2]===0&&ids[i+3]===0)backgroundPixels++;}
 d.voidContourProof={width:w,height:h,actorPixels,darkenedActorPixels,backgroundPixels,compiled};
 if(compiled||actorPixels<100||darkenedActorPixels<30||backgroundPixels<w*h*.5)throw Error('Void contour proof failed '+JSON.stringify(d.voidContourProof));
 if(gl.getError()!==gl.NO_ERROR)throw Error('Void contour proof WebGL readback error');
}});

SCENARIOS.push({id:'g3-geometry-coverage',room:'awakening-bay',state:'playing',auditGraphics:true,setup:async()=>{
 const d=window.__containmentDebug,r=d.renderer;await d.gotoRoom('awakening-bay');r.setGraphicsOptions({adaptiveResolution:false});await d.prepare();d.refresh();
 const target=r.post.resources.scene,data=new Uint8Array(target.width*target.height*4);r.renderer.readRenderTargetPixels(target,0,0,target.width,target.height,data,undefined,1);
 const counts={};for(let i=0;i<data.length;i+=4)counts[data[i+3]%8]=(counts[data[i+3]%8]??0)+1;
 d.geometryCoverageProof={pixels:target.width*target.height,classes:counts};
 if((counts[1]??0)<target.width*target.height*.1||(counts[2]??0)<1000||(counts[3]??0)<100)throw Error('Geometry coverage proof failed '+JSON.stringify(d.geometryCoverageProof));
}});

import {registerI8Scenarios} from './i8-scenarios.mjs';
registerI8Scenarios(SCENARIOS);

// U5 recovery receipts stage resources only; purchases still use native actions.
SCENARIOS.push({...SCENARIOS.find(s=>s.id==='shop'),id:'u5-shop-recovery',setup:async()=>{
 const d=window.__containmentDebug;await d.gotoRoom('communal-atrium',{phase:'reward'});
 const r=d.game.combat.getRunResources();d.game.combat.restoreRunResources({...r,health:62,armor:60,credits:180});d.refresh();
}});
import {registerV5Scenarios} from './v5-scenarios.mjs';
registerV5Scenarios(SCENARIOS);
import {registerG5Scenarios} from './g5-scenarios.mjs';
registerG5Scenarios(SCENARIOS);
import {registerG6Scenarios} from './g6-scenarios.mjs';
registerG6Scenarios(SCENARIOS,stageGraphicsKiting,L8_CAPTURE_ARENAS);
import {registerI9Scenarios} from './i9-scenarios.mjs';
registerI9Scenarios(SCENARIOS);

SCENARIOS.push(...U7_SCENARIOS);
import { registerV6Scenarios } from './v6-scenarios.mjs';
registerV6Scenarios(SCENARIOS);
import {registerC6Scenarios} from './c6-scenarios.mjs';
registerC6Scenarios(SCENARIOS);
import {registerI10Scenarios} from './i10-scenarios.mjs';
registerI10Scenarios(SCENARIOS);
import {registerV7Scenarios} from './v7-scenarios.mjs';
registerV7Scenarios(SCENARIOS);
import {registerV7ExplosionScenarios} from './v7-explosion-scenarios.mjs';
registerV7ExplosionScenarios(SCENARIOS);
import {registerV7PlacementScenarios} from './v7-placement-scenarios.mjs';
registerV7PlacementScenarios(SCENARIOS);

import {registerV7ExplosionMaterialScenarios} from './v7-explosion-scenarios.mjs';
registerV7ExplosionMaterialScenarios(SCENARIOS);
import {registerK7Scenarios} from './k7-scenarios.mjs';
registerK7Scenarios(SCENARIOS);
import {registerE7Scenarios} from './e7-scenarios.mjs';
registerE7Scenarios(SCENARIOS);
import {registerI11Scenarios} from './i11-scenarios.mjs';
registerI11Scenarios(SCENARIOS);

SCENARIOS.push(...U9_SCENARIOS);

// K10 reuses the ordinary room/combat fixtures, changing only the selected native rig.
for (const rig of ['breacher', 'cryo', 'pyro', 'arc']) {
 for (const mood of ['calm', 'heavy']) {
  const base = SCENARIOS.find(scenario => scenario.id === `combat-${mood}`);
  SCENARIOS.push({...base, id: `k10-${mood}-${rig}`, setup: new Function('room', `return (async () => {
   const d = window.__containmentDebug;
   await d.gotoRoom(room, {rig: '${rig}'});
   ${mood === 'calm' ? 'd.invulnerable(true);d.measureLuminance=true;d.refresh();' : ''}
  })();`)});
 }
}
import {registerM10Scenarios,registerC10Scenarios} from './m10-scenarios.mjs';
registerM10Scenarios(SCENARIOS);
registerC10Scenarios(SCENARIOS);

import {registerK11Scenarios} from './k11-scenarios.mjs';
registerK11Scenarios(SCENARIOS);

import {registerFeel12WeaponScenarios} from './feel12-weapon-scenarios.mjs';
registerFeel12WeaponScenarios(SCENARIOS);
import {registerT12Scenarios} from './t12-scenarios.mjs';
registerT12Scenarios(SCENARIOS);

// PERF13: identical close-up staging; only presentation LOD differs.
for(const family of ['crawler','stalker','spitter','brute','carrier']){const base=SCENARIOS.find(s=>s.id===`i11b-calm-${family}-base`);for(const mode of ['full','low'])SCENARIOS.push({...base,id:`perf13-near-${family}-${mode}`,setup:new Function('room',`return(async()=>{await (${base.setup.toString()})(room);window.__containmentDebug.studyActorLOD?.('${mode}');window.__containmentDebug.refresh();})();`)});}
for(const tier of ['high','low']){const base=SCENARIOS.find(s=>s.id==='k10-calm-breacher');SCENARIOS.push({...base,id:`perf13-growth-${tier}`,setup:new Function('room',`return(async()=>{await (${base.setup.toString()})(room);const d=window.__containmentDebug;d.renderer.setQuality('${tier}');await d.prepare();d.refresh();})();`)});}

import {COMM13_SCENARIOS} from './comm13-scenarios.mjs';
SCENARIOS.push(...COMM13_SCENARIOS);

const comm13Crowd = SCENARIOS.find(scenario => scenario.id === 'm10-melee-crowd');
SCENARIOS.push({
  ...comm13Crowd,
  id: 'comm13-crowd',
  setup: new Function(`return (${comm13Crowd.setup.toString().replace(
    'd.spawn(families[i],p.x,p.y,false)',
    "g.enemies.spawn(families[i],p.x,p.y,false,{beat:0,role:i===13?'brood':i<3?'screen':undefined,priority:i===13,controlResistant:i===13}).enemy?.id"
  )})();`),
});
