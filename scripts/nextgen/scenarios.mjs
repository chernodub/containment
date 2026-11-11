import {ABILITY_SCENARIOS,DESKTOP_ABILITY_SCENARIO} from './ability-scenarios.mjs';
export const DEFAULT_ROOMS=['awakening-bay','passenger-vault','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','infested-workshop','containment-annulus','overload-floor'];

// Declarative entries are expanded by capture.mjs. setup runs in the real page;
// use only browser globals and the debug hook inside these small functions.
export const SCENARIOS=[
 ...ABILITY_SCENARIOS,DESKTOP_ABILITY_SCENARIO,
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
 {id:'status-vfx',state:'playing',combat:true,status:true,burst:true,room:'communal-atrium',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('communal-atrium');d.grantBoons(['cryogenic','permafrost','absolute-zero','incendiary','caustic-rounds','arc-filament','conductive-shell','cryo-conductor']);}},
 {id:'boss',state:'playing',burst:true,room:'reactor-vault',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.invulnerable(true);const q=d.game.boss.snapshot;const candidates=[];for(let y=q.y+120;y<=q.y+330;y+=30)for(let x=q.x-200;x<=q.x+200;x+=30)if(d.canStand(x,y))candidates.push({x,y});if(!q.active||!candidates.length)throw Error('Queen encounter unavailable');Object.assign(d.game.player,candidates[Math.floor(candidates.length/2)]);d.setInput({fire:true,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.game.switchWeapon('plasma');d.step(1600);}},
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
   for(const [x,y]of [[320,280],[350,260],[290,230]])if(!d.spawn('crawler',x,y))throw Error('Live results target unavailable');
   g.switchWeapon('rifle');g.setAimPoint({x:320,y:220});d.setInput({fire:true,angle:-Math.PI/2,autoAim:false});
   if(!g.useAbility('tactical'))throw Error('Live results tactical denied');d.step(250);d.fillOverdrive();
   if(!g.useAbility('overdrive'))throw Error('Live results Overdrive denied');d.step(1800);d.setInput({fire:false});
   d.invulnerable(false);g.hurt(100000);d.refresh();
 }},
 {id:'results-fixture',state:'dead',required:['.result-stats'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('breached-loading-bay');d.game.hurt(100000);d.uiFixture({stats:{...d.game.stats,kills:{total:284,byFamily:{crawler:184,brute:40,spitter:30,stalker:20,carrier:10,queen:0}},damageDealt:{weapon:12000,ability:2000,status:582,boon:100},shotsFired:812,shotsHit:620,abilityUses:{dash:18,tactical:12,power:5,overdrive:1},overdrivesUsed:1,highestMultiKill:6,roomTimeMs:{...d.game.stats.roomTimeMs,'fixture':487000}}});}},
 {id:'complete-fixture',state:'complete',required:['.result-panel'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('overload-floor');d.game.status='complete';d.uiFixture({stats:{...d.game.stats,kills:{total:652,byFamily:{crawler:450,brute:80,spitter:50,stalker:40,carrier:31,queen:1}},damageDealt:{weapon:30000,ability:8000,status:2082,boon:1000},roomTimeMs:{...d.game.stats.roomTimeMs,'fixture':1227000}}});}},
 {id:'critical-health',state:'playing',room:'awakening-bay',required:['#hud.low-health'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay');d.invulnerable(false);d.game.hurt(130);d.abilityFixture('breacher','cooling');d.refresh();}},
 {id:'dead',state:'dead',required:['.result-panel','#start'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('breached-loading-bay');d.invulnerable(false);d.game.hurt(100000);d.refresh();}},
 {id:'shop',state:'reward',phase:'reward',required:['.service-shop','#claim'],setup:async()=>{await window.__containmentDebug.gotoRoom('communal-atrium',{phase:'reward'});}},
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
  // Repeated genuine rifle hits on tough targets build all three chill stacks.
  const targets=staged.filter(e=>g.enemies.getSnapshot(e.id)?.type==='brute').slice(0,4);
  for(const target of targets){d.setInput({angle:Math.atan2(target.y-g.player.y,target.x-g.player.x),autoAim:false});d.step(460);}
 }else d.step(360);
 if(status){for(let i=0;i<120;i++){const states=g.enemies.snapshot.enemies.map(e=>g.boonStatuses(e.id));if(['burning','chilled','frozen','poisoned'].every(k=>states.some(s=>s[k]))&&d.renderer.muzzle.intensity>0)break;d.step(1000/60);}}
 else for(let i=0;i<60&&!(d.renderer.muzzle.intensity>0&&g.bullets.some(b=>b.kind==='player')&&d.events.some(e=>e.type==='explosion'&&g.elapsed-e.at<.25));i++)d.step(1000/60);
 return {staged:staged.length,player:{x:g.player.x,y:g.player.y}};
}

export function inspectFrame(){
 const d=window.__containmentDebug,g=d.game,r=d.renderer;d.refresh();
 const gl=r.renderer.getContext();
 // Read the just-rendered default framebuffer before the browser clears it.
 const xs=[];for(let y=0;y<18;y++)for(let x=0;x<32;x++){const p=new Uint8Array(4);gl.readPixels(Math.floor((x+.5)*gl.drawingBufferWidth/32),Math.floor((y+.5)*gl.drawingBufferHeight/18),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);xs.push(`${p[0]>>3},${p[1]>>3},${p[2]>>3}`);}
 const enemies=g.enemies.snapshot.enemies.filter(e=>e.health>0),visible=enemies.filter(e=>r.visible(e.x,e.y));
 return {abilities:g.abilities.snapshot,stats:g.stats,recentEffects:d.events.filter(e=>g.elapsed-e.at<.25),state:g.status,uiState:document.body.dataset.state,phase:g.expedition.run.phase,templateId:g.node.templateId,elapsed:g.elapsed,player:{x:g.player.x,y:g.player.y,visible:r.visible(g.player.x,g.player.y)},enemies:enemies.length,visibleEnemies:visible.length,bullets:g.bullets.length,playerBullets:g.bullets.filter(b=>b.kind==='player').length,muzzle:r.muzzle?.intensity??0,boss:g.boss.snapshot.active,statuses:visible.map(e=>({id:e.id,...g.boonStatuses(e.id)})),performance:window.__containmentPerformance,canvas:{colors:new Set(xs).size,litSamples:xs.filter(c=>c!=='0,0,0').length,contextLost:gl.isContextLost(),error:gl.getError()},hud:!document.querySelector('#hud').hidden,overlay:document.querySelector('#overlay').textContent.trim(),bossHud:!document.querySelector('#boss-hud').hidden,ui:{toasts:[...document.querySelectorAll('.hud-toast:not([hidden])')].map(n=>n.textContent),abilitySlots:[...document.querySelectorAll('[data-ability]')].map(n=>({slot:n.dataset.ability,state:n.dataset.state,title:n.querySelector('.ability-title')?.textContent,value:n.querySelector('.ability-value')?.textContent,icon:!!n.querySelector('svg')})),damageNumbers:[...document.querySelectorAll('.combat-float[data-kind=damage]:not([hidden])')].map(n=>n.textContent),threats:document.querySelectorAll('.threat-marker:not([hidden])').length}};
}
