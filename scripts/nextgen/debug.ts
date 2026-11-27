import {drawnExchange} from '../../src/ui/gameAdapter';
import type {StudioShot} from './studioFixture';
// Imported only by main.ts when ?debug=1. Production gameplay never installs these overrides.
import {setUiFixture, type UiFixture} from '../../src/ui/gameAdapter';
import {abilityFixture, type AbilityFixtureState} from '../../src/ui/fixtures';
import type {RigId} from '../../src/game/abilities/contract';
import type {DepthGame,GameInput,GameEffect} from '../../src/DepthGame';
import type {DepthRenderer} from '../../src/render/DepthRenderer';
import {generateRun} from '../../src/game/roguelike/run';
import {restoreExpedition,completeExpeditionRoom,expeditionRewardOffers} from '../../src/game/roguelike/expedition';
import {serializeCheckpoint,parseCheckpoint} from '../../src/game/roguelike/checkpoints';
import {addMutation} from '../../src/game/roguelike/builds';
import {canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {WEAPONS} from '../../src/game/combat/catalog';
import {enemyShotRadius} from '../../src/game/combat/enemyContact';
import {ENEMY_ATTACK_SHAPES} from '../../src/game/enemies/attackShapes';
import {MELEE_ATTACKS} from '../../src/game/enemies/meleeAttacks';
import {AREA_ATTACK_RADIUS} from '../../src/game/enemies/QueenBossSystem';
import type {EnemyEvent} from '../../src/game/enemies/EnemySystem';
import {ENEMIES} from '../../src/game/enemies/catalog';
import type {StandardEnemyId} from '../../src/game/enemies/types';
import type {MutationId} from '../../src/game/roguelike/types';
import {BOT_NAVIGATION_VERSION,botPursuitLookAhead,botWaypoint as observeBotWaypoint} from './playtest/bot-navigation';
import {observeAbilityAims, type AimEnemy} from './playtest/ability-aim';
import {BOT_POLICY_VERSION} from './playtest/bot-navigation-version.mjs';
import {I5_ENCOUNTER_TUNING_ENABLED} from '../../src/game/roguelike/i5Tuning';

export type PresentationDebug = {
 setEnabled(value:boolean):void;
 reset():void;
 effect(event:Record<string,unknown>):void;
 step(ms:number,input:GameInput,update:(ms:number,input:GameInput)=>void):void;
};
export type PerformanceSample = {frame:number;updateStart:number;update:number;render:number;hud:number;audio:number};
export function installDebug(game:DepthGame,renderer:DepthRenderer,sync:()=>void,beforePrepare:()=>void, uiEvent:(event:Record<string,unknown>)=>void=()=>{},advanceUi:(dt:number)=>void=()=>{},presentation?:PresentationDebug,nativeRead?:()=>GameInput,nativeReady?:()=>boolean,liveObservation=false,observePerformance?:(listener:((sample:PerformanceSample)=>void)|undefined)=>void,prepareAudio?:()=>Promise<void>|undefined){
 let presentationEnabled=false;
 const update=game.update.bind(game),render=renderer.render.bind(renderer),hurt=game.hurt.bind(game),effect=renderer.effect.bind(renderer);
 const events:Array<GameEffect & {at:number}>=[];if(!liveObservation)renderer.effect=e=>{events.push({...e,at:game.elapsed});if(events.length>300)events.shift();effect(e);};
 let realtime=false,nativeInput=false,fastNativeRendering=false,incomingDamageScale=1,nativeRealtimeUiDt:number|null=null;
 const stepCosts:number[]=[];let stepCount=0,stepTotal=0,stepMaximum=0;
 let controls:GameInput={x:0,y:0,fire:false,angle:null,autoAim:true},immune=false,seed=Number(new URLSearchParams(location.search).get('seed')??1729);
 const canStepNative=()=>!renderer.roomLoading&&(!nativeInput||!nativeReady||nativeReady());
 // RAF still owns resource recovery and diagnostics; only explicit steps advance time.
 if(!liveObservation){
  game.update=(dt,input)=>{nativeRealtimeUiDt=null;if(!realtime||nativeInput&&!canStepNative())return;if(nativeInput){const intent=input??nativeRead!();nativeRealtimeUiDt=dt/1000;if(presentationEnabled&&presentation)presentation.step(dt,intent,update);else update(dt,intent);}else update(dt,controls);};
  renderer.render=(g,dt,menu)=>{render(g,realtime?dt:0,menu);if(realtime){const uiDt=nativeInput?(canStepNative()?nativeRealtimeUiDt??0:0):dt;nativeRealtimeUiDt=null;advanceUi(uiDt);}};
  game.hurt=(amount,origin,source={source:'scripted'},guardian,fatalOwner)=>{
    if(!immune)hurt(Number.isFinite(amount)?amount*incomingDamageScale:amount,origin,source,guardian,fatalOwner);
  };
 }
 const refresh=()=>{render(game,0,game.status==='menu');sync();advanceUi(0);};
 const ready=async()=>{if(game.status!=='menu')renderer.beginGameplayPresentation();beforePrepare();await Promise.all([renderer.prepare(game.node),prepareAudio?.()]);refresh();};
 const api={game,renderer,events,prepare:ready,
  async studio(shot:StudioShot){
   if(liveObservation||renderer.roomLoading)throw Error('Studio requires a prepared fixed-step room');
   const {shootStudio}=await import('./studioFixture');
   let seed=1729;
   const random=Math.random;
   Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   try{return await shootStudio(renderer,game,shot);}finally{Math.random=random;}
  },
  /** Passive mode keeps the production update/render/audio effect functions intact. */
  get liveObservation(){return liveObservation;},
  /** Benchmark-only observer; the sample is reused and must be copied by consumers. */
  observePerformance,
  /** Opt-in live RAF benchmark; the normal game loop measures actual simulation/render work. */
  realtime(value:boolean){realtime=value;nativeRealtimeUiDt=null;},
  /** Read the real InputController each fixed tick; never inject bot controls. */
  nativeInput(value:boolean){if(value&&!nativeRead)throw Error('Native input provider unavailable');nativeInput=value;nativeRealtimeUiDt=null;},
  /** Diagnostic draw decimation keeps native simulation, camera and actor updates at 60 Hz. */
  fastNativeRendering(value:boolean){
   if(value&&liveObservation)throw Error('Fast rendering unavailable in live observation mode');
   if(value&&(!nativeInput||!renderer.renderer?.render))throw Error('Fast rendering requires native input and a WebGL renderer');
   fastNativeRendering=value;
  },
  /** Atomically query the same loading/recovery gate used by native gameplay. */
  get canStepNative(){return canStepNative();},
  /** Explicit assisted-playtest setting; ordinary runs retain the exact hurt path. */
  incomingDamageScale(value:number){if(!Number.isFinite(value)||value<=0||value>1)throw Error('incomingDamageScale expects 0 < scale <= 1');if(liveObservation&&value!==1)throw Error('Assistance unavailable in live observation mode');incomingDamageScale=value;},
  /** Bounded accelerated-step timings; these are diagnostic CPU costs, not real-time FPS. */
  /** Presentation-only LOD comparison; never changes native actor state. */
  studyActorLOD(mode:'auto'|'full'|'low'){if(!['auto','full','low'].includes(mode))throw Error('Unknown LOD study mode');renderer.setActorLODStudy(mode);},
  resetStepPerformance(){stepCosts.length=0;stepCount=stepTotal=stepMaximum=0;},
  get stepPerformance(){const sorted=[...stepCosts].sort((a,b)=>a-b),percentile=(fraction:number)=>sorted[Math.max(0,Math.ceil(sorted.length*fraction)-1)]??0;return {samples:stepCount,retained:sorted.length,updateRenderMs:{average:stepCount?stepTotal/stepCount:0,p50:percentile(.5),p95:percentile(.95),max:stepMaximum}};},
  async startRun(value=seed,options:{rigSelect?:boolean}={}){seed=value;controls={x:0,y:0,fire:false,angle:null,autoAim:true};setUiFixture(game,null);presentationEnabled=false;presentation?.setEnabled(false);presentation?.reset();game.newRun(seed,options);events.length=0;await ready();},
  /** Bootstrap the first legacy encounter only after native rig selection; no rooms or rewards are skipped. */
  async startLegacyRun(value:number,rig:RigId){
   const run=game.expedition.run,build=game.expedition.build;
   if(game.status!=='reward'||run.version!==3||run.phase!=='starting-boon'||run.seed!==value||run.completedNodeIds.length||build.mutations.length||build.rig!==rig||game.abilities.snapshot.rig!==rig)throw Error('Legacy start requires an untouched native rig choice for the same seed');
   seed=value;setUiFixture(game,null);nativeRealtimeUiDt=null;presentation?.reset();game.newRun(seed,{version:2,rig});events.length=0;await ready();
  },
  async gotoRoom(templateId:string,options:{version?:1|2|3;phase?:'combat'|'reward'|'route';rig?:RigId;seed?:number;runStructure?:true;orderJunction?:true}={}){
   if(options.seed!==undefined)seed=options.seed;
   const version=options.version??3,nodes=generateRun(seed,version).nodes,index=nodes.findIndex(n=>n.templateId===templateId);
   if(index<0)throw Error(`Room ${templateId} is not in run v${version}`);
   setUiFixture(game,null);presentationEnabled=false;presentation?.setEnabled(false);presentation?.reset();game.newRun(seed,{rigSelect:!!options.rig});if(options.rig&&!game.chooseRig(options.rig))throw Error('Debug rig selection failed');events.length=0;controls={x:0,y:0,fire:false,angle:null,autoAim:true};
   if(index===0)game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
   else{
    const target=nodes[index],path:typeof nodes[number][]=[];let cursor=target;while(cursor.depth>0){cursor=nodes.find(n=>n.depth===cursor.depth-1&&n.next.includes(cursor.id))!;if(!cursor)throw Error('No route to target');path.unshift(cursor);}
    const previous=path.at(-1)!,serialized=serializeCheckpoint({version:1,savedAt:0,run:{version,seed,...(version===3&&options.runStructure?{runStructure:1 as const}:{}),currentNodeId:previous.id,completedNodeIds:path.map(n=>n.id),phase:'route'},build:{mutations:[],...(options.rig?{rig:options.rig}:{})},resources:game.combat.getRunResources()});
    if(!serialized)throw Error(`Invalid checkpoint before ${templateId}`);
    game.expedition=restoreExpedition(parseCheckpoint(serialized)!);game.node=previous;game.status='route';
    if(previous.templateId==='manual-control-chamber')game.authorizeDestruction();else game.route(nodes[index].id);
   }
   if(game.node.templateId!==templateId)throw Error(`Route did not reach ${templateId}`);
   game.skipStory();await ready();
   if(options.phase&&options.phase!=='combat'){
    game.expedition=completeExpeditionRoom(game.expedition,game.combat.getRunResources());
    if(options.orderJunction){
     const roomOrder=game.node.depth===5?{}:game.node.depth===13?{5:'direct' as const}:null;
     if(!roomOrder)throw Error('Expected a room-order junction');
     game.expedition={...game.expedition,run:{...game.expedition.run,runStructure:1,roomOrder}};
    }
    game.enemies.reset();game.bullets=[];game.pools=[];game.status='reward';
    if(options.phase==='route'){const offers=expeditionRewardOffers(game.expedition);if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();}
    refresh();
   }
  },
  grantBoons(ids:MutationId[]){let build=game.expedition.build;for(const id of ids)if(!build.mutations.includes(id))build=addMutation(build,id);game.expedition=Object.freeze({...game.expedition,build});game.combat.setBuild(build);refresh();},
  async stageDeathExchange({kind,room='awakening-bay',bruteLoss=false}:{
   kind:'crawler'|'stalker'|'spitter'|'charge'|'pool';room?:string;bruteLoss?:boolean;
  }){
   await api.gotoRoom(room,{rig:'cryo'});
   game.skipStory();
   const runtime=game as unknown as {enemyEvents(events:readonly EnemyEvent[]):void;updateBullets(dt:number):void;hurtCooldown:number};
   const impact={x:game.player.x,y:game.player.y};
   const positions=[[-54,0],[54,0],[0,-54],[0,54],[-38,-38],[38,38]];
   const earlier=positions.map(([x,y])=>({x:impact.x+x,y:impact.y+y}))
    .find(p=>canTraverseExpedition(game.geometry,impact,p,game.player.radius));
   if(earlier)Object.assign(game.player,earlier);
   immune=true;
   for(let frame=0;frame<21;frame++) update(50,{x:0,y:0,fire:false,angle:null,autoAim:true});
   immune=false;
   Object.assign(game.player,impact);
   game.enemies.reset();
   const pose=(family:StandardEnemyId,distance:number,base:number)=>{
    for(const offset of [0,1,-1,2,-2,3,-3,4]){
     const angle=base+offset*Math.PI/4,x=impact.x-Math.cos(angle)*distance,y=impact.y-Math.sin(angle)*distance;
     if(canOccupyExpedition(game.geometry,{x,y},ENEMIES[family].radius)&&hasClearExpeditionShot(game.geometry,{x,y},impact)
       &&(family!=='spitter'||canTraverseExpedition(game.geometry,{x,y},impact,ENEMY_ATTACK_SHAPES.spitterProjectileRadius))){
      const spawned=game.enemies.spawn(family,x,y,false);
      if(spawned.spawned)return {x,y,angle,id:spawned.enemy.id};
     }
    }
    throw Error('No clear attack origin in staged death room');
   };
   if(bruteLoss){
    const brute=pose('brute',65,-.85);
    runtime.enemyEvents([{type:'melee-strike',enemyId:brute.id,enemyType:'brute',...brute,shape:MELEE_ATTACKS.brute.shape}]);
    for(let hit=0;hit<(room==='relay-racks'&&kind==='spitter'?3:1);hit++){
     runtime.hurtCooldown=0;
     game.hurt(60,brute,{source:'enemy-contact',enemyFamily:'brute'});
    }
   }
   game.combat.restoreRunResources({...game.combat.getRunResources(),health:1,armor:0});
   runtime.hurtCooldown=0;
   if(kind==='pool'){
    game.hurt(90,{...impact,radius:AREA_ATTACK_RADIUS*.75},{source:'acid-pool',enemyFamily:'queen'});
   }else if(kind==='charge'){
    const attacker=pose('brute',80,.35);
    runtime.enemyEvents([
     {type:'attack-warning',enemyId:attacker.id,enemyType:'brute',x:attacker.x,y:attacker.y,targetX:impact.x,targetY:impact.y,durationMs:450},
     {type:'contact-attack',attack:'charge',enemyId:attacker.id,enemyType:'brute',damage:90,
      chargeFootprint:{...impact,angle:attacker.angle,shape:{kind:'line',range:5,width:2*ENEMIES.brute.radius,halfAngle:0}}},
    ]);
   }else if(kind==='spitter'){
    const attacker=pose(kind,78,.2);
    runtime.enemyEvents([{type:'hazard-attack',enemyId:attacker.id,enemyType:kind,sourceX:attacker.x,sourceY:attacker.y,
     targetX:impact.x,targetY:impact.y,damage:90}]);
    for(let frame=0;frame<36&&game.status==='playing';frame++)runtime.updateBullets(1/60);
   }else{
    const shape=MELEE_ATTACKS[kind].shape, attacker=pose(kind,shape.range*.7,.35);
    runtime.enemyEvents([
     {type:'melee-strike',enemyId:attacker.id,enemyType:kind,...attacker,shape},
     {type:'contact-attack',enemyId:attacker.id,enemyType:kind,damage:90},
    ]);
   }
   if(game.status!=='dead'||!game.deathExchange?.fatal)throw Error('The staged attack did not produce a fatal exchange');
   refresh();
   for(let frame=0;frame<60&&!document.querySelector('#retry-rig');frame++)await new Promise(requestAnimationFrame);
  },
  spawn(type:StandardEnemyId,x:number,y:number,elite=false){const radius=ENEMIES[type]?.radius;if(!radius||!canOccupyExpedition(game.geometry,{x,y},radius)||Math.hypot(x-game.player.x,y-game.player.y)<radius+game.player.radius+12)return false;const result=game.enemies.spawn(type,x,y,elite);return result.spawned?result.enemy.id:false;},
  canStand(x:number,y:number,radius=16){return canOccupyExpedition(game.geometry,{x,y},radius);},
  botWeaponRange:()=>WEAPONS[game.combat.snapshot.weaponId].projectileSpeed*2,
  botShotClear(x:number,y:number,from:{x:number;y:number}=game.player, weapon=game.combat.snapshot.weaponId){
    return canTraverseExpedition(game.geometry,from,{x,y},WEAPONS[weapon].projectileRadius);
  },
  clearShot(x:number,y:number,from:{x:number;y:number}=game.player){return hasClearExpeditionShot(game.geometry,from,{x,y});},
  /** The runner verifies this build's shared policy before collecting a cohort. */
  get botNavigationVersion(){return BOT_NAVIGATION_VERSION;},
  get botPolicyVersion(){return BOT_POLICY_VERSION;},
  botAbilityAims(enemies:readonly AimEnemy[]){
   const targets=game.targets().filter(t=>hasClearExpeditionShot(game.geometry,game.player,t)).map(t=>{const e=t.id>0?game.enemies.getSnapshot(t.id):undefined;return {...t,radius:e?enemyShotRadius(e.type,e.elite):t.radius};});
   return observeAbilityAims(game,enemies,point=>{
    const p=renderer.camera.position.clone().set(point.x/32,0,point.y/32).project(renderer.camera);
    return renderer.pointer(Math.max(4,Math.min(1916,(p.x+1)*innerWidth/2)),Math.max(4,Math.min(1000,(1-p.y)*innerHeight/2)),targets);
   });
  },
  /** Build-time profile provenance only; this getter never changes simulation state. */
  get encounterTuningEnabled(){return I5_ENCOUNTER_TUNING_ENABLED;},
  get encounterGuardian(){return game.encounterGuardian;},
  /** Read-only marine path observer; never replaces the simulation's enemy navigation. */
  botPursuitLookAhead(target:{x:number;y:number},requireProgress=false){return botPursuitLookAhead(game,target,90,requireProgress);},
  drawnExchange(){
   const marks=drawnExchange(game,renderer);
   const waypoint=(mark:{x:number;y:number})=>canTraverseExpedition(game.geometry,game.player,mark,game.player.radius)?{x:mark.x,y:mark.y}:observeBotWaypoint(game,mark);
   return marks&&{...marks,
    bait:marks.bait&&{...marks.bait,waypoint:waypoint(marks.bait)},
    landing:marks.landing&&{...marks.landing,waypoint:waypoint(marks.landing)}};
  },
  botWaypoint(target:{x:number;y:number}){return observeBotWaypoint(game,target);},
  setInput(value:Partial<GameInput>){controls={...controls,...value};},
  step(ms:number){
   if(liveObservation)throw Error('Fixed stepping unavailable in live observation mode');
   if(!Number.isFinite(ms)||ms<0||ms>60000)throw Error('step expects 0..60000 ms');
   if(renderer.roomLoading)throw Error('Room is still loading');
   if(!canStepNative())throw Error('Native gameplay is not ready');
   for(let remaining=ms;remaining>1e-7;){
    if(!canStepNative())break;
    const dt=Math.min(1000/60,remaining),started=performance.now(),input=nativeInput?nativeRead!():controls;
    if(presentationEnabled&&presentation)presentation.step(dt,input,update);else update(dt,input);
    // Only raw GPU submission is omitted. The real scene/camera/effect update still
    // runs for every tick, preserving pointer projection and policy observations.
    const raw=renderer.renderer,draw=raw?.render;
    const suppress=fastNativeRendering&&nativeInput&&remaining-dt>1e-7&&canStepNative()&&game.status==='playing';
    if(suppress)raw.render=function(...args:Parameters<typeof draw>){
     // Room preparation can start inside render; its warmup draws must remain real.
     if(renderer.roomLoading||!canStepNative()||game.status!=='playing')return draw.apply(raw,args);
    };
    try{render(game,dt/1000,game.status==='menu');}finally{if(suppress)raw.render=draw;}
    const cost=performance.now()-started;stepCount++;stepTotal+=cost;stepMaximum=Math.max(stepMaximum,cost);
    if(stepCosts.length===2048)stepCosts.shift();stepCosts.push(cost);advanceUi(dt/1000);remaining-=dt;
   }
   refresh();
  },
  /** Stage a capture with the normal fixed simulation clock and no intermediate draws. */
  stepSimulation(ms:number){
   if(liveObservation||nativeInput)throw Error('Simulation staging requires fixture mode');
   if(!Number.isFinite(ms)||ms<0||ms>60000)throw Error('stepSimulation expects 0..60000 ms');
   if(!canStepNative())throw Error('Room is still loading');
   for(let remaining=ms;remaining>1e-7;){
    const dt=Math.min(1000/60,remaining);
    update(dt,controls);
    remaining-=dt;
   }
  },
  /** Presentation-only settling uses the original renderer/follow-camera path.
   * Simulation, encounter clocks and UI effect clocks remain frozen. */
  settlePresentation(ticks:number){
   if(liveObservation)throw Error('Presentation settling unavailable in live observation mode');
   if(!Number.isInteger(ticks)||ticks<0||ticks>600)throw Error('Presentation settling expects 0..600 ticks');
   if(renderer.roomLoading)throw Error('Room is still loading');
   const elapsed=game.elapsed;
   for(let i=0;i<ticks;i++)render(game,1/60,game.status==='menu');
   if(game.elapsed!==elapsed)throw Error('Presentation settling advanced simulation');
   sync();advanceUi(0);
  },
  invulnerable(value:boolean){if(liveObservation&&value)throw Error('Invulnerability unavailable in live observation mode');immune=value;},
  /** Fill the real runtime meter without injecting a presentation snapshot. */
  fillOverdrive(){game.abilities.addCharge(12000);refresh();},
  /** A presentation-only close-camera stress case; never changes native gameplay defaults. */
  cameraZoom(value:number){if(!Number.isFinite(value)||value<1||value>3)throw Error('cameraZoom expects 1..3');renderer.camera.zoom=value;renderer.camera.updateProjectionMatrix();refresh();},
  /** Presentation-only fixtures: never install simulation APIs or alter hit results. */
  uiFixture(value:UiFixture|null){setUiFixture(game,value);refresh();},
  abilityFixture(rig:RigId,state:AbilityFixtureState,preferences?:UiFixture['preferences']){setUiFixture(game,{abilities:abilityFixture(rig,state),preferences});refresh();if(state==='denied')uiEvent({type:'ability',x:game.player.x,y:game.player.y,ability:{phase:'denied',slot:'tactical',rig,ability:abilityFixture(rig,state).slots!.tactical.id,element:rig==='breacher'?'kinetic':rig,denial:'cooldown'}});},
  uiEvent(event:Record<string,unknown>){uiEvent(event);refresh();},
  presentation(value:boolean){if(liveObservation){if(!value)throw Error('Production presentation stays enabled in live observation mode');return;}presentationEnabled=value;presentation?.setEnabled(value);refresh();},
  presentationEvent(event:Record<string,unknown>){if(!presentationEnabled)throw Error('Enable presentation first');presentation?.effect(event);refresh();},
  refresh,
 };
 Object.defineProperty(window,'__containmentDebug',{value:api,configurable:true});
}
