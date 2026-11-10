import {ABILITY_SCENARIOS} from './ability-scenarios.mjs';
export const DEFAULT_ROOMS=['awakening-bay','passenger-vault','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','infested-workshop','containment-annulus','overload-floor'];

// Declarative entries are expanded by capture.mjs. setup runs in the real page;
// use only browser globals and the debug hook inside these small functions.
export const SCENARIOS=[
 ...ABILITY_SCENARIOS,
 {id:'title',state:'menu',required:['.title-screen','#start'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();}},
 {id:'title-settings',state:'menu',required:['.settings','#quality'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();document.querySelector('#settings').click();}},
 {id:'starting-boon',state:'reward',phase:'starting-boon',required:['.choice-grid'],setup:async()=>{await window.__containmentDebug.startRun();}},
 {id:'combat-calm',rooms:true,state:'playing',setup:async room=>{const d=window.__containmentDebug;await d.gotoRoom(room);d.invulnerable(true);d.refresh();}},
 {id:'combat-heavy',rooms:true,state:'playing',combat:true,burst:true,setup:async room=>{await window.__containmentDebug.gotoRoom(room);}},
 {id:'status-vfx',state:'playing',combat:true,status:true,burst:true,room:'communal-atrium',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('communal-atrium');d.grantBoons(['cryogenic','permafrost','absolute-zero','incendiary','caustic-rounds','arc-filament','conductive-shell','cryo-conductor']);}},
 {id:'boss',state:'playing',burst:true,room:'reactor-vault',setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.invulnerable(true);const q=d.game.boss.snapshot;const candidates=[];for(let y=q.y+120;y<=q.y+330;y+=30)for(let x=q.x-200;x<=q.x+200;x+=30)if(d.canStand(x,y))candidates.push({x,y});if(!q.active||!candidates.length)throw Error('Queen encounter unavailable');Object.assign(d.game.player,candidates[Math.floor(candidates.length/2)]);d.setInput({fire:true,angle:Math.atan2(q.y-d.game.player.y,q.x-d.game.player.x),autoAim:false});d.game.switchWeapon('plasma');d.step(1600);}},
 {id:'reward',state:'reward',phase:'reward',required:['.choice-grid'],setup:async()=>{await window.__containmentDebug.gotoRoom('awakening-bay',{phase:'reward'});}},
 {id:'route',state:'route',required:['.route-grid','[data-route]'],setup:async()=>{await window.__containmentDebug.gotoRoom('awakening-bay',{phase:'route'});}},
 {id:'pause',state:'paused',required:['.pause-panel','#resume'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('passenger-vault');d.game.pause();d.refresh();}},
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
 return {abilities:g.abilities.snapshot,stats:g.stats,recentEffects:d.events.filter(e=>g.elapsed-e.at<.25),state:g.status,phase:g.expedition.run.phase,templateId:g.node.templateId,elapsed:g.elapsed,player:{x:g.player.x,y:g.player.y,visible:r.visible(g.player.x,g.player.y)},enemies:enemies.length,visibleEnemies:visible.length,bullets:g.bullets.length,playerBullets:g.bullets.filter(b=>b.kind==='player').length,muzzle:r.muzzle?.intensity??0,boss:g.boss.snapshot.active,statuses:visible.map(e=>({id:e.id,...g.boonStatuses(e.id)})),performance:window.__containmentPerformance,canvas:{colors:new Set(xs).size,litSamples:xs.filter(c=>c!=='0,0,0').length,contextLost:gl.isContextLost(),error:gl.getError()},hud:!document.querySelector('#hud').hidden,overlay:document.querySelector('#overlay').textContent.trim(),bossHud:!document.querySelector('#boss-hud').hidden};
}
