import {app,el,mountShell} from './shell';
import {createHud} from './hud/Hud';
import {createScreens} from './screens/ScreenManager';
import {loadAudioPreferences} from '../game/audio/preferences';
import {FramePacer,FrameDiagnostics} from '../render/FrameBudget';
import {HitConfirmation} from './hud/HitConfirmation';
import {captureWeaponPointer} from '../WeaponHud';
import {positionHudPanels} from '../HudLayout';
import {DepthGame,type GameEffect} from '../DepthGame';
import {preloadAssets} from '../render/assets';
import {DepthRenderer} from '../render/DepthRenderer';
import {InputController} from '../InputController';
import {AudioSystem} from '../game/audio/AudioSystem';
import type {WeaponId} from '../game/combat/types';
/** Initialize assets, game, input and graphics recovery. */
export async function bootstrap(){
mountShell();
function positionHud(){positionHudPanels(renderer.playerScreenBounds(game.player.radius),innerWidth,innerHeight);}
el('overlay').innerHTML='<div class="asset-loading"><span>CONTAINMENT / DEPTH</span><div><i id="asset-progress"></i></div></div>';
try{await preloadAssets(fraction=>{el('asset-progress').style.width=`${fraction*100}%`;});}catch(error){app.innerHTML='<div class="unsupported"><h1>Download interrupted</h1><button onclick="location.reload()">Try again</button></div>';throw error;}
let renderer:DepthRenderer;
try{renderer=new DepthRenderer(el('world') as HTMLCanvasElement);renderer.setQuality('high');}catch{app.innerHTML='<div class="unsupported"><h1>3D graphics unavailable</h1><p>Open this game in a browser with WebGL 2 enabled.</p><button onclick="location.reload()">Try again</button></div>';throw new Error('WebGL renderer unavailable');}
let storage:Storage|null=null;try{storage=localStorage;}catch{}
const marker=document.createElement('div');marker.id='hit-confirmation';marker.hidden=true;marker.setAttribute('aria-hidden','true');app.append(marker);
const confirmation=new HitConfirmation(marker);for(const event of ['pointermove','pointerdown'] as const)renderer.canvas.addEventListener(event,e=>{if(e.pointerType==='mouse')confirmation.point(e.clientX,e.clientY);});
let audioPreferences=loadAudioPreferences(storage);
const audio=new AudioSystem({master:audioPreferences.muted?0:audioPreferences.master,music:.38,effects:.8});void AudioSystem.preload();
const effect=(e:GameEffect)=>{if(e.type==='sync-corpse'){renderer.syncCorpse(e.id!,e.x,e.y);return;}renderer.effect(e);if(e.contact){audio.playConfirmedHit(e.contact!=='damage');confirmation.confirm(e.contact);}if(e.type==='shot'){const methods={pistol:()=>audio.playPistol(),rifle:()=>audio.playRifle(),shotgun:()=>audio.playShotgun(),plasma:()=>audio.playPlasma(),rocket:()=>audio.playRocket()};methods[e.weapon??'pistol']();}else if(e.type==='corpse'||e.type==='wall-slam')audio.playBodyImpact();else if(e.type==='explosion')audio.playExplosion();else if(e.type==='pickup')audio.playPickup();else if(e.type==='boon'&&e.boon==='shatter')audio.playElemental('shatter');else if(e.type==='boon'&&e.boon==='overload')audio.playElemental('reactor');else if(e.type==='hurt'){el('hurt-flash').classList.remove('flash');void el('hurt-flash').offsetWidth;el('hurt-flash').classList.add('flash');}};
const game=new DepthGame(effect,storage);const pause=()=>{if(game.status==='playing'){game.pause();input.reset();audio.pauseAll();}else if(game.status==='paused'&&!document.hidden&&!graphicsLost){game.resume();audio.resumeAll();}syncScreen();};
game.aimVisible=(x,y)=>renderer.visible(x,y);
try{await renderer.prepare(game.node);}catch(error){el('overlay').innerHTML='<div class="unsupported"><h1>Graphics interrupted</h1><button onclick="location.reload()">Try again</button></div>';throw error;}
const input=new InputController(game,renderer,(toggle)=>{if(game.status==='playing'||toggle&&game.status==='paused')pause();},()=>!graphicsLost&&!roomRecovering&&lastRoom===game.roomRevision&&!renderer.roomLoading);let roomRecovering=true;let graphicsLost=false;let lastStatus='',lastRoom=-1,unusedScreenKey='';
const start=(resume=false)=>{void audio.unlock();audio.resumeAll();input.reset();screens.resetSettings();if(resume){if(!game.continueRun())return;}else game.newRun();syncScreen(true);};
captureWeaponPointer(el('pause') as HTMLButtonElement);captureWeaponPointer(el('skip-story') as HTMLButtonElement);
el('pause').addEventListener('click',pause);document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(b=>{captureWeaponPointer(b);b.addEventListener('click',()=>{if(!roomRecovering&&lastRoom===game.roomRevision&&!renderer.roomLoading&&!graphicsLost)game.switchWeapon(b.dataset.weapon as WeaponId);b.blur();});});
el('skip-story').addEventListener('click',()=>{game.skipStory();hud();});
// END HUD INPUT
const hud=createHud(game,renderer,positionHud);
const screens=createScreens({game,renderer,input,audio,confirmation,storage,pause,start,graphicsLost:()=>graphicsLost,recovering:()=>roomRecovering||lastRoom!==game.roomRevision||renderer.roomLoading});
function syncScreen(force=false){screens.syncScreen(force);}
renderer.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();graphicsLost=true;game.pause();input.reset();audio.pauseAll();syncScreen(true);});renderer.canvas.addEventListener('webglcontextrestored',()=>{graphicsLost=false;renderer.setQuality(screens.quality);syncScreen(true);});window.addEventListener('resize',()=>renderer.resize());let hudTime=0;const pacer=new FramePacer(),diagnostics=new FrameDiagnostics();document.addEventListener('visibilitychange',()=>pacer.reset());
Object.defineProperty(window,'__containmentPerformance',{get:()=>({...diagnostics.snapshot,quality:renderer.qualityTier,drawCalls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,geometries:renderer.renderer.info.memory.geometries,textures:renderer.renderer.info.memory.textures,graphicsLost})});
function frame(now:number){
 requestAnimationFrame(frame);if(document.hidden)return;const elapsed=pacer.sample(now);if(elapsed===null)return;const dt=Math.min(.05,elapsed),started=performance.now();
 // Synchronize before input/update: a boon, restart or route can change rooms between RAFs.
 if(lastRoom!==game.roomRevision){renderer.loadRoom(game.node);lastRoom=game.roomRevision;roomRecovering=true;}
 const blocked=graphicsLost||renderer.roomLoading;
 const recovering=roomRecovering;
 if(blocked||recovering)input.reset();else game.update(dt*1000,input.read());
 if(game.status==='playing'&&!blocked&&!recovering)audio.syncFrozen(game.enemies.snapshot.enemies.filter(e=>e.health>0&&game.boonStatuses(e.id).frozen).map(e=>e.id),game.roomRevision);
 confirmation.update(blocked||recovering?0:dt,game.status==='playing'&&!blocked&&!recovering);const updated=performance.now();
 if(!blocked){renderer.render(game,recovering?0:dt,game.status==='menu');if(game.status==='playing')positionHud();roomRecovering=false;if(recovering)pacer.reset();}else roomRecovering=true;
 el('room-loading').hidden=!blocked||game.status!=='playing';el('world').setAttribute('aria-busy',String(blocked));
 const rendered=performance.now();
 if(lastStatus!==game.status){lastStatus=game.status;syncScreen();}hudTime+=dt;
 if(hudTime>.08){hudTime=0;hud();audio.syncCombat(game.combat.snapshot);audio.setMusicIntensity(Math.min(1,game.enemies.activeCount/12+(game.boss.snapshot.active?.3:0)));}
 diagnostics.record(elapsed*1000,updated-started,rendered-updated);
}
lastRoom=game.roomRevision;syncScreen(true);requestAnimationFrame(frame);
// Explicit opt-in only: fixed-step visual review of the real production game.
if(new URLSearchParams(location.search).get('debug')==='1'){
 const {installDebug}=await import('../../scripts/nextgen/debug');
 installDebug(game,renderer,()=>{syncScreen(true);hud();},()=>{lastRoom=game.roomRevision;roomRecovering=true;});
}
}
