import {floorChoicePair} from './game/waves/FloorChoices';
import {wardenOpeningAim,wardenOpeningSpawn} from './game/waves/WardenOpening';
import {demonstratedAugment,RIG_DRILL_PROMPTS} from './game/waves/RigDrill';
import {TRANSFORMATIVE_AUGMENT_PAIRS,TRANSFORMATIVE_AUGMENT_IDS,type AugmentId} from './game/abilities/augmentCatalog';
import {EARLY_LOCKER} from './game/roguelike/economy';
import {ROOM_TEMPLATES} from './game/roguelike/roomTemplates';
import {stageCoverLesson,type CoverLesson} from './game/waves/CoverLesson';
import {segmentIntersectsRect} from './game/input/aimAssist';
import {ROCKET_ARM_DISTANCE} from './game/combat/catalog';
import {AWAKENING_DRILL} from './game/waves/authoredEncounters';
import {BOSS_BODIES,guardianRadius} from './game/enemies/bossDefinitions';
import {SERVICE_IDS,serviceRepairAmounts,serviceCost,serviceStock,availableAugmentUpgrades,GUARDIAN_ROUTE_DEPTH,GUARDIAN_ROUTES,GUARDIAN_SUPPLIES,fieldWorkshopDepth,detourOffers,type ServiceId,type DetourChoice} from './game/roguelike/economy';
import {addMutation,upgradeBuildAugment} from './game/roguelike/builds';
import {markExpeditionAllocation,recordExpeditionPurchase} from './game/roguelike/expedition';
import {DIFFICULTIES,difficultyId,incomingDamageLimit,latePressureProgress,type DifficultyId} from './game/difficulty';
import {ExchangeHistory, type LastExchange} from './game/enemies/LastExchange';
import {meleeStrikeContains, type MeleeStrikeShape} from './game/enemies/meleeAttacks';
import {ENEMY_ATTACK_SHAPES} from './game/enemies/attackShapes';
import {PresentationBudget} from './game/abilities/PresentationBudget';
import {AbilitySystem} from './game/abilities/AbilitySystem';
import type {AbilityEvent,AbilitySlot,RigId} from './game/abilities/contract';
import {RunStats,type DamageSource,type IncomingDamageOrigin} from './game/abilities/RunStats';
import {chooseExpeditionRig} from './game/roguelike/expedition';
import {enemyShotRadius,sweptCircle} from './game/combat/enemyContact';
import {wallContact} from './game/world/wallContact';
import type {BoonEffect} from './game/roguelike/ElementalRuntime';
import {familyBonuses} from './game/roguelike/builds';
import {CombatSystem,ProjectileHitTracker,calculateSplashDamage,type ProjectileRequest} from './game/combat/CombatSystem';
import {EnemySystem,type EnemyEvent,type EnemyCommitment,type EnemySpawnOptions} from './game/enemies/EnemySystem';
import {QueenBossSystem,type QueenBossEvent} from './game/enemies/QueenBossSystem';
import {ENEMIES,enemyBodyRadius} from './game/enemies/catalog';
import type {StandardEnemyId} from './game/enemies/types';
import {PickupSystem} from './game/pickups/PickupSystem';
import {EncounterDirector,type EncounterEvent} from './game/waves/EncounterDirector';
import {FacilityNavigation} from './game/world/FacilityNavigation';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot,clipExpeditionLane} from './game/world/expeditionGeometry';
import {rerollExpedition,createExpedition,completeExpeditionRoom,claimExpeditionMutation,claimExpeditionResources,chooseExpeditionRoute,defeatExpedition,restoreExpedition,type Expedition,type ExpeditionStartOptions} from './game/roguelike/expedition';
import {progressionFor} from './game/roguelike/progression';
import {orderRoom,orderRecovery} from './game/roguelike/orderJunctions';
import {generateRun} from './game/roguelike/run';
import {authorizeExpeditionDestruction} from './game/roguelike/expedition';
import {storyRoomFor,SACRIFICE_ENDING} from './game/roguelike/storyRooms';
import {MutationRuntime,type MutationTarget} from './game/roguelike/MutationRuntime';
import {loadCheckpoint,saveCheckpoint,clearCheckpoint,type StorageLike} from './game/roguelike/checkpoints';
import type {MutationId,RunNode} from './game/roguelike/types';
import {contractFor,contractIndex,contractSector,CONTRACT_ENDS,CONTRACT_PROFILE_KEY} from './game/roguelike/contracts';
import {RoomConditionRuntime,onConditionZone} from './game/roguelike/RoomConditionRuntime';
import {shipCondition,isJunction,BROOD_HATCH_MS,CONDITION_LIGHT_RADIUS} from './game/roguelike/shipConditions';
import {storyOpening} from './game/waves/authoredEncounters';
import type {WeaponId} from './game/combat/types';
export type GameEffect={grilleEscorts?:number;arrivalSwing?:'strike'|'recovery';reserveCut?:{count:number;family:StandardEnemyId;closedEntry?:string};shutterBroken?:true;plateBroken?:true;exposedHit?:true;floorChoice?:string;planReaction?:true;selfBlast?:{distance:number;radius:number};incomingSource?:IncomingDamageOrigin['source'];encounterCue?:'flank'|'crossfire'|'priority'|'escort-broken'|'pincer-broken';cueX?:number;cueY?:number;meleeShape?:MeleeStrikeShape;dangerWeight?:'low';sourceX?:number;sourceY?:number;ability?:AbilityEvent;damage?:number;lethal?:boolean;source?:DamageSource;impulse?:number;contact?:'damage'|'armor'|'blocked';rocketUnarmed?:true;wall?:{x:number;y:number};shotId?:string;type:'story-hold-grace'|'recovery-grille-closed'|'recovery-escort-entered'|'ability'|'melee-miss'|'recovery-stagger'|'wall-slam'|'shot'|'hit'|'corpse'|'explosion'|'acid'|'hurt'|'pickup'|'sync-corpse'|'ambush'|'enemy-attack'|'enemy-warning'|'arrival-recovery'|'arrival-wound'|'reserve-cut'|'boon';boon?:BoonEffect;elements?:readonly ('ice'|'poison'|'fire')[];x:number;y:number;id?:number;vx?:number;vy?:number;radius?:number;weapon?:WeaponId;family?:StandardEnemyId;elite?:boolean;angle?:number;targetId?:number;targetX?:number;targetY?:number;durationMs?:number};
export type GameInput={x:number;y:number;fire:boolean;angle:number|null;autoAim:boolean;aimPoint?:{x:number;y:number}|null};
export type Bullet={hostileOwner?:number;preview?:true;previewAt?:number;sourceX?:number;sourceY?:number;visualMuzzle?:{x:number;y:number;z:number;distance:number};x:number;y:number;life:number;kind:'player'|'grenade'|'hazard';request:ProjectileRequest;tracker:ProjectileHitTracker;hitReceipt?:{hit:boolean}};
export type Pool={id:number;x:number;y:number;radius:number;life:number;warning:number;damage:number;tick:number;spitterOpening?:true};
const IDLE:GameInput={x:0,y:0,fire:false,angle:null,autoAim:false};
const SPITTER_PROJECTILE_RADIUS=ENEMY_ATTACK_SHAPES.spitterProjectileRadius;
const EARLY_SPIT_IMPACT_RADIUS=128;
const RELAY_RACKS_SHUTTER_SPITTER={x:670,y:142};

export class DepthGame {
 private presentation=new PresentationBudget(e=>this.emit(e));
 abilities:AbilitySystem;private runStats=new RunStats();private aimPoint:{x:number;y:number}|null=null;private runSequence=1729;private feedbackBatch=false;private feedback=new Map<string,GameEffect>();
 get stats(){return this.runStats.snapshot;}
 combat=new CombatSystem();boss=new QueenBossSystem();pickups=new PickupSystem(0,(a,b,r)=>canTraverseExpedition(this.geometry,a,b,r));
 expedition:Expedition;node:RunNode;geometry:ReturnType<typeof createExpeditionGeometry>;navigation:FacilityNavigation;enemies:EnemySystem;
 player={x:0,y:0,radius:16,angle:0,moving:false,vx:0,vy:0};bullets:Bullet[]=[];pools:Pool[]=[];
 status:'menu'|'playing'|'paused'|'reward'|'route'|'dead'|'complete'='menu';kills=0;elapsed=0;roomRevision=0;
 private difficultyMode:DifficultyId='standard';
 get difficulty(){return this.difficultyMode;}
 setDifficulty(value:DifficultyId){const id=difficultyId(value),rank={story:0,standard:1,veteran:2};const fresh=['menu','dead','complete'].includes(this.status);if(!fresh&&(this.status!=='paused'||rank[id]>rank[this.difficultyMode]))return false;this.difficultyMode=id;if(!fresh){const cp=loadCheckpoint(this.storage);if(cp){const result=saveCheckpoint(this.storage,{...cp,difficulty:id});this.checkpointState=result.status==='saved'?'saved':this.storage?'save-failed':'unavailable';}}return true;}
 private exchangeHistory=new ExchangeHistory();
 private finalExchange?:LastExchange;
 get deathExchange(){return this.finalExchange;}
 private roomDamageLedger=new Map<string,{source:IncomingDamageOrigin['source'];enemyFamily?:IncomingDamageOrigin['enemyFamily'];guardian?:'warden'|'matron';amount:number}>();
 get roomDamage(){return [...this.roomDamageLedger.values()].sort((a,b)=>b.amount-a.amount).slice(0,3).map(value=>({...value}));}

 private checkpointState:'none'|'saved'|'save-failed'|'clear-failed'|'unavailable'='none';
 get checkpointStatus(){return this.checkpointState;}
 get checkpointWarning(){
  if(this.checkpointState==='clear-failed')return 'Could not remove the previous checkpoint. Reloading may restore an old run.';
  if(this.checkpointState==='save-failed')return 'Progress could not be saved. Leaving or reloading may lose progress or restore an older checkpoint.';
  if(this.checkpointState==='unavailable')return 'Saving is unavailable in this browser. Progress will be lost when you leave or reload.';
  return '';
 }
 get checkpointNote(){return this.checkpointWarning||(this.checkpointState==='saved'?'Checkpoint saved. Leaving a fight returns to the last saved choice or room boundary.':'No checkpoint saved yet. Complete a room to save progress.');}
 private discardCheckpoint(){this.suppressSave=true;this.checkpointState=clearCheckpoint(this.storage)?'none':this.storage?'clear-failed':'unavailable';}
 private lastAbilityReady:Partial<Record<AbilitySlot,number>>={};
 private abilitySampleAt=-Infinity;
 private deathReadySlot:AbilitySlot|undefined;
 get deathReadyAbility(){return this.status==='dead'?this.deathReadySlot:undefined;}
 private sampleAbilityReadiness(){
  this.abilitySampleAt=this.elapsed;
  const slots=this.abilities.snapshot.slots;
  if(!slots)return;
  for(const slot of ['dash','tactical','power','overdrive'] as const)
   if(slots[slot].ready)this.lastAbilityReady[slot]=this.elapsed;
 }
 private plateRifleHits=0;
 private bruteIngress=new Map<number,FacilityNavigation>();
 private relayCrossfire=false;
 private relayVolleyId?:number;
 private consoleRelease=0;
 private get recoveryGrilles(){return this.grilleOverride??(this.difficulty==='standard'?'staged-side':false);}
 private recoveryGrilleState?:{x:number;y:number;angle:number;escorts:number;attackerId?:number;
  state:'waiting'|'closed'|'entered';changedAt:number;expiresAt:number;attackStarted?:true};
 get recoveryGrille(){
  const grille=this.recoveryGrilleState;
  if(grille&&grille.attackerId!==undefined&&
   (grille.state==='waiting'||this.elapsed-grille.changedAt<2)){
   const {attackStarted:_,...visible}=grille;
   return {...visible,
    returnArcCosine:this.recoveryGrilles==='staged-arc'?Math.cos(Math.PI/6):undefined,
    returnRange:this.recoveryGrilles===true?176:undefined,returnHalfWidth:64,
    returnAisleSide:this.recoveryGrilles==='staged-side'};
  }
 }
 private findRecoveryAisle(lead:{x:number;y:number},approach:{x:number;y:number}){
  if(!hasClearExpeditionShot(this.geometry,approach,lead))return;
  const bearing=Math.atan2(lead.y-approach.y,lead.x-approach.x);
  for(const distance of [96,80,64]){
   for(const offset of [0,.2,-.2,.4,-.4]){
    const heading=bearing+offset;
    const point={x:lead.x+Math.cos(heading)*distance,y:lead.y+Math.sin(heading)*distance};
    if(canOccupyExpedition(this.geometry,point,32)&&hasClearExpeditionShot(this.geometry,approach,point))
     return {...point,angle:Math.atan2(lead.y-point.y,lead.x-point.x)};
   }
  }
 }
 private findLegacyGrille(lead:{x:number;y:number},reference:{x:number;y:number}){
  const bearing=Math.atan2(reference.y-lead.y,reference.x-lead.x);
  for(const offset of [Math.PI/2,-Math.PI/2,1,-1,.45,-.45,0,2,-2,Math.PI]){
   const angle=bearing+offset,point={x:lead.x+Math.cos(angle)*99,y:lead.y+Math.sin(angle)*99};
   if(canOccupyExpedition(this.geometry,point,25)&&hasClearExpeditionShot(this.geometry,reference,point))
    return {...point,angle:Math.atan2(lead.y-point.y,lead.x-point.x)};
  }
 }
 private get delayRecoveryEscort(){
  return this.recoveryGrilles==='staged-side'&&this.node.templateId==='manual-control-chamber';
 }
 private resolveRecoveryGrille(closed:boolean){
  const grille=this.recoveryGrilleState;
  if(!grille||grille.state!=='waiting')return;
  grille.state=closed?'closed':'entered';grille.changedAt=this.elapsed;
  if(closed){
   this.director.reportRecoveryGrilleClosed(this.delayRecoveryEscort);
   this.pending=this.pending.filter(spawn=>!spawn.grilleEscort||this.delayRecoveryEscort&&spawn.grilleDelayedEscort);
   for(const escort of this.pending){
    if(escort.grilleDelayedEscort)escort.delay=Math.max(escort.delay,3000);
   }
  }
  this.presentation.push({type:closed?'recovery-grille-closed':'recovery-escort-entered',
   x:grille.x,y:grille.y,angle:grille.angle,grilleEscorts:closed&&this.delayRecoveryEscort?1:grille.escorts});
 }
 private tickRecoveryGrille(){
  const grille=this.recoveryGrilleState;
  if(grille?.state!=='waiting')return;
  const attacker=grille.attackerId===undefined?undefined:this.enemies.getSnapshot(grille.attackerId);
  if(attacker?.meleePhase==='windup'||attacker?.meleePhase==='strike'||attacker?.meleePhase==='recovery')
   grille.attackStarted=true;
  const finished=grille.attackerId!==undefined&&(!attacker||grille.attackStarted&&attacker.meleePhase==='approach');
  if(this.elapsed>=grille.expiresAt||finished)this.resolveRecoveryGrille(false);
 }
 private consoleExchange?:{bait:{x:number;y:number};landing:{x:number;y:number};target:{x:number;y:number}};
 get manualExchange(){return this.consoleRelease>this.elapsed?this.consoleExchange:undefined;}
 private shaftApproach?:{id:number;readyAt:number};
 private residentialLane?:{plate:{x:number;y:number};side:{x:number;y:number}};
 private shaftIngress?:{beat:number;deckY:number;x:number};
 private platedLessonTarget:number|undefined;
 private promptedWeapons=0;
 private weaponLesson:{weapon:'plasma'|'rocket';target:number;until:number}|undefined;
 private coverLesson:CoverLesson|undefined;
 private readonly stagedCover=new Set<CoverLesson['cover']>();
 private departures=new Map<number,{ms:number;escort:boolean;breach:{x:number;y:number}}>();
 private cleanupElapsed=0;
 private breakAnnounced=false;
 private broodPodsDestroyed=0;
 private director:EncounterDirector;private mutations:MutationRuntime;private pending:Array<{type:StandardEnemyId;x:number;y:number;elite:boolean;delay:number;guardian?:'warden'|'matron';options?:EnemySpawnOptions;shutterSpitter?:true;approachLeadMs?:number;delayedHatch?:string;clutchHoldUntil?:number;consoleHold?:true;grilleEscort?:true;grilleDelayedEscort?:true;attempts?:number}>=[];private clearRequested=false;private bossSlow=1;private hurtCooldown=0;private heavyHitGrace=0;private recentHits:{at:number;damage:number}[]=[];private emergencyUsed=false;private poolId=0;private suppressSave=false;
 constructor(readonly emit:(e:GameEffect)=>void=()=>{},readonly storage:StorageLike|null=null,private readonly grilleOverride?:boolean|'release-only'|'staged-arc'|'staged-side'){
  if(!storage)this.checkpointState='unavailable';
  this.expedition=createExpedition(1729,this.combat.getRunResources());this.node=this.findNode();this.geometry=createExpeditionGeometry(this.node);this.navigation=new FacilityNavigation(this.geometry);this.enemies=this.makeEnemies();this.director=this.makeDirector();this.mutations=this.makeMutations();this.abilities=this.makeAbilities();this.abilities.setRig('breacher');Object.assign(this.player,this.geometry.playerSpawn);
 }
 private findNode(){return generateRun(this.expedition.run.seed,this.expedition.run.version,this.expedition.run.roomOrder).nodes.find(n=>n.id===this.expedition.run.currentNodeId)!;}
 private roomStartCredits=0;
 private hiddenEnemiesMs=0;
 private roomCondition:RoomConditionRuntime|null=null;
 get conditionState(){return this.roomCondition;}
 get conditionObservation(){
  const state=this.roomCondition;
  return state?{id:state.condition.id,zones:state.zones,ventLive:state.ventLive,ventWarning:state.ventWarning,conduitLive:state.conduitLive,eggIds:[...state.eggs]}:null;
 }
 private conditionsEnabled=true;
 private get openBreaches(){return this.geometry.breaches.filter(b=>!this.roomCondition?.closedBreaches.includes(b.id));}
 private makeDirector(){
  const breaches=this.openBreaches;
  const hold=this.condition?.id==='sealed'&&/relay/i.test(this.openingName(this.node.depth,this.expedition.run.detour?.choice==='salvage')??'');
  if(this.roomCondition)this.roomCondition.sealedHold=hold;
  return new EncounterDirector({seed:this.expedition.run.seed,node:this.node,difficulty:this.difficulty,recoveryGrilles:!!this.recoveryGrilles,transmissionAugment:this.transmissionAugment,runStructure:this.expedition.run.runStructure,roomOrder:this.expedition.run.roomOrder,holdUntilMs:hold?45000:0,brood:this.condition?.id==='brood',guardianRoute:this.expedition.run.guardianRoute,junctions:this.expedition.run.junctions,salvage:this.expedition.run.detour?.depth===this.node.depth&&this.expedition.run.detour.choice==='salvage',breaches,breachIds:breaches.map(b=>b.id)});
 }
 private broodSupply?:{pod:number;pickup:number};
 private savedArmour?:{id:number;at:number;room:number};
 get savedArmourReveal(){
  const saved=this.savedArmour;
  return saved&&saved.room===this.roomRevision&&this.elapsed-saved.at<1.15?saved:undefined;
 }
 private broodChoiceUsed=false;
 private broodMarksShownAt:number|undefined;
 private repelSavedBroodLane(pod:{x:number;y:number}){
  const screens=this.enemies.snapshot.enemies.filter(enemy=>!enemy.pod&&(enemy.type==='crawler'||enemy.type==='stalker'))
   .sort((a,b)=>Math.hypot(a.x-pod.x,a.y-pod.y)-Math.hypot(b.x-pod.x,b.y-pod.y)).slice(0,3);
  for(const enemy of screens){
   const dx=enemy.x-pod.x,dy=enemy.y-pod.y,distance=Math.hypot(dx,dy);
   if(distance>300||distance===0)continue;
   this.shoveEnemy(enemy.id,dx/distance*95,dy/distance*95);
   this.enemies.stagger(enemy.id,950);
  }
  this.presentation.push({type:'boon',boon:'shield',x:pod.x,y:pod.y,durationMs:950,radius:96});
 }
 private stageBroodChoice(index:number, fallback:{x:number;y:number}){
  const player=this.player,exit=this.geometry.exitPoint;
  const bearing=Math.atan2(exit.y-player.y,exit.x-player.x);
  for(const turn of [0,Math.PI/2,-Math.PI/2,Math.PI]){
   const angle=bearing+turn;
   const pair=[{x:player.x+Math.cos(angle)*164,y:player.y+Math.sin(angle)*164},
    {x:player.x+Math.cos(angle)*84-Math.sin(angle)*92,y:player.y+Math.sin(angle)*84+Math.cos(angle)*92}];
   if(pair.every(point=>canOccupyExpedition(this.geometry,point,26)&&hasClearExpeditionShot(this.geometry,player,point)))
    return pair[index]??fallback;
  }
  return fallback;
 }
 private rackShutter:{wardenId?:number;spitterId?:number;broken:boolean;openedAt?:number;shotThrough?:boolean}|undefined;
 get relayShutterFrame(){
  return this.rackShutter?{x:491,y:158,width:18,height:140,broken:this.rackShutter.broken}:undefined;
 }
 get relayShutter(){
  const frame=this.relayShutterFrame;
  return frame&&!frame.broken?frame:undefined;
 }
 isShutterProtected(id:number){
  const shutter=this.rackShutter;
  return !!shutter&&!shutter.broken&&shutter.spitterId===id&&
    (shutter.wardenId===undefined||!!this.enemies.getSnapshot(shutter.wardenId));
 }
 get shutterCameraPoint(){
  const shutter=this.rackShutter,frame=this.relayShutterFrame;
  if(!shutter||!frame||shutter.shotThrough)return;
  const warden=shutter.wardenId===undefined?undefined:this.enemies.getSnapshot(shutter.wardenId);
  if(warden?.pendingAttack==='charge'||warden?.chargeMs||shutter.broken&&this.elapsed-(shutter.openedAt??0)<2)
   return {x:frame.x+frame.width/2,y:frame.y+frame.height/2};
 }
 get shutterBait(){
  const shutter=this.relayShutter,warden=this.rackShutter?.wardenId;
  const enemy=warden===undefined?undefined:this.enemies.getSnapshot(warden);
  if(!shutter||!enemy||enemy.pendingAttack||enemy.chargeMs)return;
  return {x:shutter.x-50,y:250,wardenId:enemy.id};
 }
 private get crawlerPressureRoom(){
  return ['service-shaft-landing','coolant-plant','overload-floor'].includes(this.node.templateId);
 }
 private featuredVolleyUsed=false;
 private earlyPressureAt: number|undefined;
 private earlyPressureFollow?:{x:number;y:number;shooter:number;at:number;hatch?:string};
 private stageEarlyPressure(firstLane?:{x:number;y:number;hatch?:string}){
  this.earlyPressureAt=Infinity;
  const covers=ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles??[];
  const lane=stageCoverLesson(this.geometry,covers,this.player);
  const origin={x:this.player.x,y:this.player.y};
  const family=firstLane?'brute':'spitter';
  const breach=this.geometry.breaches.find(point=>point.id===firstLane?.hatch);
  const ingressPoint=breach&&{x:breach.x+(breach.facing==='east'?56:-56),y:breach.y};
  const ingress=firstLane?64:128;
  const travel=firstLane?Math.atan2(origin.y-firstLane.y,origin.x-firstLane.x):
   Math.hypot(this.player.vx,this.player.vy)>30?Math.atan2(this.player.vy,this.player.vx):this.player.angle;
  for(let turn=0;turn<16;turn++){
   const offset=turn%2?-(turn+1)/2:turn/2;
   const angle=travel+offset*Math.PI/8;
   const stagedPoint=ingressPoint??(!firstLane&&this.node.depth<=3?lane?.shooter:undefined);
   const shooter=(turn===0?stagedPoint:undefined)??
    {x:origin.x+Math.cos(angle)*ingress,y:origin.y+Math.sin(angle)*ingress};
   if(!canOccupyExpedition(this.geometry,shooter,enemyBodyRadius(family,false))||
    shooter!==ingressPoint&&shooter!==lane?.shooter&&!canTraverseExpedition(this.geometry,shooter,origin,SPITTER_PROJECTILE_RADIUS))continue;
   const sidesteps=[1,-1].map(side=>({x:origin.x-side*Math.sin(angle)*146,y:origin.y+side*Math.cos(angle)*146}));
   const reward=lane?.pickup??sidesteps.find(step=>canTraverseExpedition(this.geometry,origin,step,this.player.radius));
   if(!reward)continue;
   this.pending.push({type:family,...shooter,elite:false,delay:firstLane?80:350,delayedHatch:shooter===ingressPoint?breach?.id:undefined,
    options:{closeIngress:true,interceptOpening:!!firstLane,
     openingVolley:firstLane?undefined:this.node.depth<=3?'lead-marine-wide':'lead-marine'}});
   this.presentation.push({type:'enemy-warning',...shooter,durationMs:firstLane?80:350,radius:32});
   this.pickups.spawn('armor',firstLane?40:24,reward.x,reward.y);
   break;
  }
 }
 private makeEnemies(){return new EnemySystem({crawlerWallQueue:this.difficulty!=='story'||this.node.depth>=4,crawlerBiteCap:this.crawlerPressureRoom?2:undefined,readySeed:this.expedition.run.seed,spitWindupMs:this.condition?.id==='dark'?650:500,slick:p=>this.roomCondition?.slick(p)??false,difficulty:()=>{
  const mode=this.difficulty,d=DIFFICULTIES[mode];
  const lateWindups=Math.round(d.windups*(1+(d.lateWindups-1)*latePressureProgress(this.node.depth,mode,this.expedition.run.version===3)))/d.windups;
  return {...d,lateWindups};
 },ordinaryIdleScale:this.difficulty==='standard'&&this.node.depth>=14?.72:1,
 openingWindup:this.node.depth===0?1.5:1,lateDifficulty:this.node.depth>=10,canSeePlayer:(a,b)=>hasClearExpeditionShot(this.geometry,a,b),launched:id=>this.mutations?.isLaunched(id)??false,immovables:()=>{const q=this.boss.snapshot;return q.active?[{x:q.x,y:q.y,radius:92,health:q.health},...q.nests.map(n=>({x:n.x,y:n.y,radius:28,health:n.health}))]:[];},balance:progressionFor(this.node),wardenOpeningAim:this.expedition.run.version===3?(enemy,player)=>{
  const shutter=this.relayShutter;
  if(!shutter)return wardenOpeningAim(this.geometry,enemy,player);
  if(enemy.x>shutter.x+shutter.width&&player.x<shutter.x&&segmentIntersectsRect(enemy,player,shutter))return player;
 }:undefined,canCommit:(enemy,player,others,attack,attempting)=>{
  if(this.storyFirstHold&&(enemy.type==='brute'||enemy.type==='carrier')&&
   [...others].some(other=>other.id!==enemy.id&&(other.type==='brute'||other.type==='carrier')&&
    (other.meleePhase==='windup'||other.meleePhase==='strike'||other.pendingAttack||other.chargeMs)))return false;
  if(this.shaftApproach?.id===enemy.id&&this.elapsed<this.shaftApproach.readyAt)return false;
  if(!this.relayHeavyRecovered&&enemy.beat===this.director.returnShotBeat&&
    (enemy.type==='crawler'||enemy.type==='stalker'||enemy.type==='spitter')){
   for(const other of others)if(other.beat===enemy.beat&&other.type==='brute'&&other.role==='anchor')return false;
  }
  return this.director.canCommit(enemy,player,others,attack,
   this.difficulty==='standard'||this.difficulty==='story'?{
    radius:this.player.radius,attempting,
    ...(this.node.templateId==='service-shaft-landing'&&this.encounter.grammar==='pincer'?{
     cover:(point:{x:number;y:number},pack:Iterable<EnemyCommitment>)=>{
      for(const threat of pack){
       if(threat.type==='spitter'&&Math.hypot(point.x-threat.x,point.y-threat.y)<480&&
        canTraverseExpedition(this.geometry,threat,point,SPITTER_PROJECTILE_RADIUS))return false;
       if(threat.id!==enemy.id&&threat.meleePhase==='approach'&&
        Math.hypot(point.x-threat.x,point.y-threat.y)<100&&
        canTraverseExpedition(this.geometry,threat,point,this.player.radius))return false;
      }
      return !this.pending.some(next=>next.options?.beat===enemy.beat&&next.delay<=900&&
       Math.hypot(point.x-next.x,point.y-next.y)<110&&
       canTraverseExpedition(this.geometry,next,point,this.player.radius));
     },
    }:{}),
    clear:point=>canTraverseExpedition(this.geometry,player,point,this.player.radius)&&
     !this.abilities?.blocksMovement(player,point,this.player.radius),
   }:undefined);
 },canAttack:(a,b)=>(a.type==='spitter'?canTraverseExpedition(this.geometry,a,b,SPITTER_PROJECTILE_RADIUS):hasClearExpeditionShot(this.geometry,a,b))&&!this.abilities?.blocksMovement(a,b,0),chargeObstacle:(id,from,to,radius)=>{
   const shutter=this.relayShutter;
   if(!shutter||id!==this.rackShutter?.wardenId||!segmentIntersectsRect(from,to,
     {x:shutter.x-radius,y:shutter.y-radius,width:shutter.width+2*radius,height:shutter.height+2*radius}))return false;
   this.rackShutter.broken=true;
   this.rackShutter.openedAt=this.elapsed;
   const spitterId=this.rackShutter.spitterId;
   const spitter=spitterId===undefined?null:this.enemies.getSnapshot(spitterId);
   if(spitter){
    const opening={x:shutter.x+shutter.width/2,y:shutter.y+shutter.height/2};
    const angle=Math.atan2(opening.y-spitter.y,opening.x-spitter.x);
    const target={x:opening.x+Math.cos(angle)*160,y:opening.y+Math.sin(angle)*160};
    this.enemyEvents(this.enemies.startOpeningVolley(spitter.id,target));
   }
   this.presentation.push({type:'wall-slam',shutterBroken:true,x:shutter.x+shutter.width/2,y:shutter.y+shutter.height/2,targetId:id});
   return true;
  },canMove:c=>!(this.rackShutter?.spitterId===c.enemyId&&(this.isShutterProtected(c.enemyId)||this.elapsed-(this.rackShutter.openedAt??-Infinity)<3)&&Math.hypot(c.fromX-RELAY_RACKS_SHUTTER_SPITTER.x,c.fromY-RELAY_RACKS_SHUTTER_SPITTER.y)<42)&&canTraverseExpedition(this.geometry,{x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius)&&!this.abilities?.blocksMovement({x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius),route:(e,p)=>this.navigation.waypoint(e,p,1)});}
 private makeMutations(){return new MutationRuntime(this.combat,{player:()=>this.player,targets:()=>this.targets(),damage:(id,n,source)=>this.damage(id,n,undefined,source??'boon'),move:(id,x,y)=>this.shoveEnemy(id,x,y),moveCorpse:(t,x,y)=>{const m=this.moveCorpse(t,x,y);this.presentation.push({type:'sync-corpse',id:t.id,x:m.x,y:m.y});return m;},setSlow:(id,m)=>{if(id>0)this.enemies.setSlow(id,m);else if(id===-1)this.bossSlow=Math.max(.65,m);},launchCollision:(from,target,wall)=>{if(this.roomCondition?.slick(from)||this.roomCondition?.slick(target))this.damage(target.id,wall?12:6,undefined,'boon');},canAffect:(a,b)=>hasClearExpeditionShot(this.geometry,a,b),boonEffect:(boon,x,y,targetX,targetY,radius,durationMs)=>this.presentation.push({type:'boon',boon,x,y,targetX,targetY,radius,durationMs}),wallSlam:(from,to,impulse)=>{const c=wallContact(this.geometry,from,to,from.radius);this.presentation.push({type:'wall-slam',x:c.x,y:c.y,wall:c.normal,targetId:from.id,vx:to.x-from.x,vy:to.y-from.y,impulse});},effect:(x,y,radius)=>this.presentation.push({type:'explosion',x,y,radius})});}
 private abilityPulseDamage=0;
 private readonly protectedStatuses=new Map<number,{kind:'chill'|'freeze'|'burn'|'shock';amount:number}[]>();
 private readonly protectedDamage=new Map<number,{amount:number;source:DamageSource}[]>();
 private applyRigStatus(target:MutationTarget,kind:'chill'|'freeze'|'burn'|'shock',amount:number){
  if(!this.enemies.getSnapshot(target.id)?.arrivalProtected){
   this.mutations.applyAbilityStatus(target,kind,amount);
   return;
  }
  const pending=this.protectedStatuses.get(target.id)??[];
  pending.push({kind,amount});
  this.protectedStatuses.set(target.id,pending);
 }
 private makeAbilities(){return new AbilitySystem({roomDepth:()=>this.node.depth,enabled:()=>this.status==='playing',overdriveRoomLimit:()=>this.expedition.run.version===3&&this.node.depth!==9&&this.node.depth!==19?1:Infinity,placementRevision:()=>this.geometry,dashDistanceScale:p=>this.roomCondition?.slick(p)?1.5:1,chainThrough:(a,b)=>this.roomCondition?.condition.id==='conduit'&&this.roomCondition.zones.some(z=>onConditionZone(a,z)&&onConditionZone(b,z))||false,advance:ms=>this.mutations.update(ms),player:()=>this.player,targets:()=>this.targets(),visible:(a,b)=>hasClearExpeditionShot(this.geometry,a,b),traverse:(a,b,r)=>canTraverseExpedition(this.geometry,a,b,r),movePlayer:(dx,dy)=>{const p=this.moveCorpse(this.player,dx,dy);this.player.x=p.x;this.player.y=p.y;},damage:(target,n)=>{const r=this.damage(target.id,n,undefined,'ability');this.abilityPulseDamage+=r.damage;if(r.died)this.mutations.kill(target,'direct');return r.died;},statuses:id=>this.mutations.statuses(id),consumeBurn:id=>this.mutations.consumeBurn(id),impede:t=>this.mutations.impedeWithFire(t),status:(t,k,n)=>this.applyRigStatus(t,k,n),launch:(t,x,y)=>this.mutations.launchAbility(t,x,y),arc:(t,others)=>this.mutations.abilityArc(t,others),has:id=>this.combat.hasMutation(id),upgraded:id=>this.expedition.build.augmentUpgrades?.includes(id)??false,reload:()=>{if(this.combat.instantReload())this.mutations.completedReload(this.player);},emit:(ability,x,y)=>{const measured=ability.targetIds&&['tick','impact','burst','link','dash-end'].includes(ability.phase);const totalDamage=measured?this.abilityPulseDamage:undefined;if(measured)this.abilityPulseDamage=0;this.observeRigDrill(ability);this.presentation.push({type:'ability',ability:totalDamage===undefined?ability:{...ability,totalDamage},x,y});}});}
 /** World-space cursor point for placed abilities; null falls back to aim and maximum range. */
 get currentAimPoint(){return this.aimPoint && Object.freeze({...this.aimPoint});}
 setAimPoint(point:{x:number;y:number}|null){this.aimPoint=point&&Number.isFinite(point.x)&&Number.isFinite(point.y)?{...point}:null;this.abilities.setIntent(this.player.vx,this.player.vy,this.aimPoint);}
 /** Activate the current rig slot from keyboard or presentation controls. */
 useAbility(slot:AbilitySlot):boolean{const used=this.abilities.use(slot,this.status==='playing');if(used){this.runStats.recordAbilityUse(slot);this.syncOverclock();}return used;}
 /** Select a rig during an explicitly requested rig-select phase. */
 chooseRig(id:RigId):boolean{if(this.status!=='reward'||this.expedition.run.phase!=='rig-select')return false;try{this.expedition=chooseExpeditionRig(this.expedition,id);this.combat.setBuild(this.expedition.build);this.abilities.setRig(id);if(this.checkpointState!=='clear-failed')this.save();return true;}catch{return false;}}
 private syncOverclock(active=this.abilities.overclocked){const before=this.combat.snapshot;this.combat.setOverclock(active);if(this.combat.snapshot.magazine>before.magazine)this.mutations.completedReload(this.player);}
 private reportDamage(effect:GameEffect){if(this.feedbackBatch&&(effect.source==='status'||effect.source==='boon')){const key=`${effect.targetId}:${effect.source}`,old=this.feedback.get(key);if(old){old.damage=(old.damage??0)+(effect.damage??0);old.lethal=old.lethal||effect.lethal;}else if(this.feedback.size<128)this.feedback.set(key,effect);}else this.presentation.push(effect);}
 private flushFeedback(){for(const effect of this.feedback.values())this.presentation.push(effect);this.feedback.clear();this.feedbackBatch=false;}
 private usedContractMedkit=false;
 get contractOffer(){
  const run=this.expedition.run;
  if(!run.runStructure||run.contract||this.node.depth!==2||this.status!=='route')return undefined;
  try{if(this.storage?.getItem(CONTRACT_PROFILE_KEY)==='1')return contractFor(run.seed);}catch{}
  return undefined;
 }
 acceptContract(){
  if(!this.contractOffer)return false;
  this.writeContract({progress:0,earned:0});
  this.save();
  return true;
 }
 private writeContract(contract:NonNullable<import('./game/roguelike/types').RunState['contract']>, rerollTokens=this.expedition.run.rerollTokens){
  this.expedition=Object.freeze({...this.expedition,run:Object.freeze({...this.expedition.run,contract:Object.freeze(contract),...(rerollTokens===undefined?{}:{rerollTokens})})});
 }
 private settleContract(){
  const run=this.expedition.run, contract=run.contract, depth=this.node.depth;
  if(!contract||depth<3||depth>18)return;
  const goal=contractIndex(run.seed);
  const damage=[...this.roomDamageLedger.values()].reduce((sum,entry)=>sum+entry.amount,0);
  const time=this.stats.roomTimeMs[this.node.id]??0;
  const progress=contract.progress+(goal===0?Number(this.usedContractMedkit):goal===1?damage:Number(time>90000));
  if(depth!==CONTRACT_ENDS[contractSector(depth)]){this.writeContract({...contract,progress});return;}
  const earned=progress<=(goal===1?60:0);
  if(earned&&goal===1)this.combat.restoreArmor(25);
  if(earned&&goal===2)this.abilities.addCharge(6000);
  const tokens=earned&&goal===0?Math.min(3,(run.rerollTokens??0)+1):run.rerollTokens;
  this.writeContract({progress:0,earned:contract.earned+Number(earned),lastPayout:earned},tokens);
 }
 private rememberExpedition(){try{this.storage?.setItem(CONTRACT_PROFILE_KEY,'1');}catch{}}
 private siegeBeat=-1;private siegeRemainingMs=12000;private siegePoint={x:0,y:0};
 private prepareSiegePoint(){this.navigation.prepare(this.geometry.playerSpawn,1);const exit=this.geometry.exitPoint;for(let ring=0;ring<=320;ring+=16){for(let i=0;i<(ring?24:1);i++){const angle=i*Math.PI/12,p={x:exit.x+Math.cos(angle)*ring,y:exit.y+Math.sin(angle)*ring};if(canOccupyExpedition(this.geometry,p,this.player.radius)&&this.navigation.reachable(p)){this.siegePoint=p;return;}}}this.siegePoint={...this.geometry.playerSpawn};}
 private gateHold:{id:string;ms:number;x:number;y:number}|undefined;
 private gateGraceUntil=0;
 private holdTeachingUntil=0;
 private holdTeachingGraceUntil=0;
 private holdCornerDashUsed=false;
 private heldSiegeBeat=-1;
 private get storyFirstHold(){return this.difficulty==='story'&&this.node.templateId==='safety-interlock-station';}
 get storyHoldPrompt(){return this.elapsed<this.holdTeachingUntil;}

 private gatePreviousStrikes=new Set<number>();
 get storyHoldGrace(){
  const hold=this.gateHold;
  const remainingMs=Math.max(0,(this.gateGraceUntil-this.elapsed)*1000);
  if(this.difficulty==='story'&&hold&&remainingMs>0)return {...hold,remainingMs,durationMs:2500,...(hold.id==='siege'?{radius:220,chargeDurationMs:12000,teaching:this.elapsed<this.holdTeachingGraceUntil}:{})};
 }
 private gateStaged=false;
 private gatePads:{x:number;y:number}[]=[];
 private relayBanks:{x:number;y:number}[]=[];
 private relayBank:{x:number;y:number}|undefined;
 get floorControls(){
  if(this.status!=='playing'&&this.status!=='paused')return [];
  const {pincer,reserve}=this.encounter;
  const breach=reserve&&this.geometry.breaches.find(point=>point.id===reserve.breachId);
  if(breach)return [{...breach,kind:'reserve' as const,radius:34+8*(reserve!.remainingMs%1000)/1000}];
  if(this.node.templateId==='safety-interlock-station'&&pincer?.state==='staging'&&!this.director.closedFlank){
   const breaches=[...new Set(pincer.flankers.map(flank=>flank.breachId))];
   const pads=this.gatePads.slice(0,breaches.length);
   if(pads.length===2){
    const [first,second]=breaches.map(id=>this.geometry.breaches.find(breach=>breach.id===id));
    if(first&&second){
     const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
     if(distance(pads[0],first)+distance(pads[1],second)>distance(pads[0],second)+distance(pads[1],first))breaches.reverse();
    }
   }
   return pads.map((point,index)=>({...point,id:breaches[index],threats:pincer.flankers.filter(flank=>flank.breachId===breaches[index]).length,kind:'gate' as const,radius:28}));
  }
  if(this.node.templateId==='overload-floor'&&this.siege&&!this.relayBank)
   return [...this.relayBanks.map((point,index)=>({...point,id:String(index),kind:'bank' as const,radius:68})),
    ...(this.crossingRequired?[{...this.siegePoint,id:'failed-bank',kind:'failed-bank' as const,radius:220}]:[])];
  return [];
 }
 get delayedPincerHatch(){
  const arrivals=this.pending.filter(spawn=>spawn.delayedHatch!==undefined);
  const opening=this.earlyPressureFollow;
  const openingBreach=opening&&this.geometry.breaches.find(point=>point.id===opening.hatch);
  if(opening&&openingBreach)return {breach:openingBreach,arrivals:[Math.max(0,(opening.at-this.elapsed)*1000)]};
  const breach=this.geometry.breaches.find(point=>point.id===arrivals[0]?.delayedHatch);
  return breach?{breach,arrivals:arrivals.map(spawn=>spawn.delay)}:undefined;
 }
 get markedClosedEntry(){
  const encounter=this.director.snapshot;
  const pending=encounter.grammar==='pincer'&&this.pending.some(spawn=>spawn.options?.beat===encounter.beat);
  const id=this.director.markedClosedEntry(pending);
  return id===undefined?undefined:this.geometry.breaches.find(breach=>breach.id===id);
 }
 get closedFlank(){return this.director.closedFlank;}
 private relayRoutes:{x:number;y:number}[][]=[];
 get relayApproaches(){return this.crossingRequired&&!this.relayBank?this.relayRoutes:[];}
 private relayRoute(goal:{x:number;y:number},navigator:FacilityNavigation){
  const route=[this.siegePoint];
  for(let i=0;i<24;i++){
   const from=route.at(-1)!;
   if(canTraverseExpedition(this.geometry,from,goal,this.player.radius))return [...route,goal];
   const step=navigator.waypoint({...from,radius:this.player.radius},goal,1);
   if(!step||route.some(point=>Math.hypot(point.x-step.x,point.y-step.y)<1))break;
   route.push(step);
  }
  return route;
 }
 readonly clipHostileLane=(from:{x:number;y:number},to:{x:number;y:number})=>
  clipExpeditionLane(this.geometry,from,to,SPITTER_PROJECTILE_RADIUS,(a,b,radius)=>this.abilities.blocksMovement(a,b,radius));
 get relayShelter(){
  if(this.node.templateId!=='overload-floor'||!this.relayCoverPreview&&!this.crossingRequired||this.relayBank)return;
  return this.relayShelterStep;
 }
 private relayShelterStep?:{x:number;y:number};
 private coverPreview?:{x:number;y:number;from:{x:number;y:number};until:number;impactUntil?:number};
 get relayCoverPreview(){return this.coverPreview&&this.elapsed<this.coverPreview.until?this.coverPreview:undefined;}
 private previewRelayCover(){
  const bank=this.relayShelterStep;
  if(!bank)return;
  const source=this.siegePoint;
  const lane=clipExpeditionLane(this.geometry,source,bank,SPITTER_PROJECTILE_RADIUS);
  if(!lane.blocked)return;
  this.coverPreview={...lane.point,from:source,until:this.elapsed+4};
  const angle=Math.atan2(bank.y-source.y,bank.x-source.x);
  for(const offset of [0,.22,.44])this.bullets.push({preview:true,previewAt:this.elapsed+offset,x:source.x,y:source.y,life:ENEMY_ATTACK_SHAPES.spitterProjectileLife,kind:'hazard',
   request:{weaponId:'plasma',damage:0,speed:ENEMY_ATTACK_SHAPES.spitterProjectileSpeed,radius:SPITTER_PROJECTILE_RADIUS,angle,penetration:1,splashRadius:0,knockback:0},
   tracker:new ProjectileHitTracker(1)});
 }
 private stageRelayCrossfire(){
  this.relayCrossfire=true;
  const near=this.relayBanks[0];
  const midpoint={x:(near.x+this.siegePoint.x)/2,y:(near.y+this.siegePoint.y)/2};
  const bearing=Math.atan2(near.y-this.siegePoint.y,near.x-this.siegePoint.x);
  const origins:{x:number;y:number}[]=[];
  for(const side of [1,-1])for(const range of [180,150,120,220]){
   if(origins.length===2)break;
   const point={x:midpoint.x-Math.sin(bearing)*side*range,y:midpoint.y+Math.cos(bearing)*side*range};
   if(!canOccupyExpedition(this.geometry,point,enemyBodyRadius('spitter',false))||
    !hasClearExpeditionShot(this.geometry,point,midpoint)||
    origins.some(other=>Math.hypot(other.x-point.x,other.y-point.y)<60))continue;
   origins.push(point);
  }
  for(const point of origins){
   const options={beat:this.encounter.beat,role:'ranged' as const};
   if(this.relayVolleyId===undefined&&Math.hypot(point.x-this.player.x,point.y-this.player.y)>100){
    const spawn=this.enemies.spawn('spitter',point.x,point.y,false,options);
    if(spawn.spawned){
     this.relayVolleyId=spawn.enemy.id;
     this.enemyEvents(this.enemies.startOpeningVolley(spawn.enemy.id,midpoint));
     continue;
    }
   }
   this.pending.push({type:'spitter',...point,elite:false,delay:400,options});
   this.presentation.push({type:'enemy-warning',...point,radius:32,durationMs:400});
  }
 }
 get relayVolley(){
  if(!this.crossingRequired||this.relayVolleyId===undefined)return undefined;
  const enemy=this.enemies.getSnapshot(this.relayVolleyId);
  const near=this.relayBanks[0];
  if(enemy?.pendingAttack==='spit'&&enemy.lockX===(near.x+this.siegePoint.x)/2&&
   enemy.lockY===(near.y+this.siegePoint.y)/2)return enemy.id;
 }
 private get crossingRequired(){
  return this.node.templateId==='overload-floor'&&this.siegeBeat>=0&&this.siegeRemainingMs<=4000&&this.relayBanks.length>0
   &&this.director.snapshot.grammar==='siege';
 }
 get siege(){
  const encounter=this.director?.snapshot;
  if(this.status!=='playing'||encounter?.grammar!=='siege'||(encounter.lullRemainingMs??0)>0)return null;
  const crossing=this.crossingRequired;
  const target=crossing?(this.relayBank??this.relayBanks.reduce((best,point)=>
   Math.hypot(point.x-this.player.x,point.y-this.player.y)<Math.hypot(best.x-this.player.x,best.y-this.player.y)?point:best)):this.siegePoint;
  return {beat:encounter.beat??0,x:target.x,y:target.y,radius:crossing?68:220,durationMs:12000,
   selectedBank:crossing&&this.relayBank?(this.relayBank.x===this.relayBanks[0].x&&this.relayBank.y===this.relayBanks[0].y?'near':'far'):undefined,
   nearLaneWindup:this.relayVolley!==undefined,
   nearMeleePressure:crossing&&!this.relayBank&&this.enemies.snapshot.enemies.some(enemy=>{
    if(enemy.health<=0||enemy.pod||enemy.type==='spitter')return false;
    const near=this.relayBanks[0],dx=near.x-this.siegePoint.x,dy=near.y-this.siegePoint.y;
    const along=Math.max(0,Math.min(1,((enemy.x-this.siegePoint.x)*dx+(enemy.y-this.siegePoint.y)*dy)/(dx*dx+dy*dy)));
    const intercept={x:this.siegePoint.x+dx*along,y:this.siegePoint.y+dy*along};
    return Math.hypot(enemy.x-intercept.x,enemy.y-intercept.y)<230&&canTraverseExpedition(this.geometry,enemy,intercept,enemy.radius);
   }),
   nearBank:crossing&&!this.relayBank?this.relayBanks[0]:undefined,
   remainingMs:this.siegeBeat===encounter.beat?this.siegeRemainingMs:12000,crossing,choosing:crossing&&!this.relayBank,farBank:crossing&&!this.relayBank?this.relayBanks[1]:undefined};
 }
 private tickFloorObjectives(ms:number){
  if(!this.gateStaged&&this.node.templateId==='safety-interlock-station'&&this.encounter.pincer?.state==='staging'){
   this.gateStaged=true;
   const heading=Math.atan2(this.geometry.exitPoint.y-this.player.y,this.geometry.exitPoint.x-this.player.x);
   const pads=floorChoicePair(this.geometry,this.player,p=>this.navigation.reachable(p),64,160,heading);
   if(pads.length===2)this.gatePads=pads;
  }
  if(this.crossingRequired&&!this.relayCrossfire)this.stageRelayCrossfire();
  if(this.heldSiegeBeat>=0&&(!this.siege||this.siegeRemainingMs<=0)){this.heldSiegeBeat=-1;this.gateHold=undefined;this.gateGraceUntil=0;this.gatePreviousStrikes.clear();}
  const pad=this.floorControls.find(control=>Math.hypot(control.x-this.player.x,control.y-this.player.y)<=control.radius
   &&(control.kind==='gate'||control.kind==='bank'&&this.crossingRequired));
  if(this.difficulty==='story'&&this.gateHold&&this.heldSiegeBeat<0){
   const hold=this.gateHold;
   const strikes=this.enemies.snapshot.enemies.filter(enemy=>(enemy.meleePhase==='windup'||enemy.meleePhase==='strike')&&
    meleeStrikeContains(enemy.meleeShape,enemy.meleeOriginX,enemy.meleeOriginY,enemy.meleeAngle,hold.x,hold.y,this.player.radius));
   const current=new Set(strikes.map(enemy=>enemy.id));
   for(const id of this.gatePreviousStrikes)if(!current.has(id))this.gatePreviousStrikes.delete(id);
   if(pad?.id!==hold.id&&this.gateGraceUntil<=this.elapsed){
    const striker=strikes.find(enemy=>!this.gatePreviousStrikes.has(enemy.id));
    if(striker){
     this.gatePreviousStrikes.add(striker.id);
     this.gateGraceUntil=this.elapsed+2.5;
     this.presentation.push({type:'story-hold-grace',x:hold.x,y:hold.y,id:striker.id,durationMs:2500});
    }
   }
  }
  if(pad?.kind==='gate'){
   if(this.gateHold?.id!==pad.id)this.gateHold={id:pad.id,ms:0,x:pad.x,y:pad.y};
   this.gateGraceUntil=0;
   this.gateHold.ms+=ms;
   if(this.gateHold.ms>=950&&this.director.closeFlank(pad.id))
    this.presentation.push({type:'boon',boon:'shield',x:pad.x,y:pad.y,encounterCue:'pincer-broken',floorChoice:'gate:'+pad.id});
  }else{
   if(this.heldSiegeBeat<0&&(!this.storyHoldGrace||!this.floorControls.some(control=>control.id===this.gateHold?.id)))this.gateHold=undefined;
   if(pad?.kind==='bank'&&!this.relayBank){
    this.relayBank=pad;
    this.presentation.push({type:'boon',boon:'shield',x:pad.x,y:pad.y,floorChoice:pad.id==='0'?'near bank':'far bank'});
   }
  }
  if(this.storyFirstHold&&!this.holdCornerDashUsed&&this.abilities.snapshot.slots?.dash?.charges===0&&
   this.enemies.snapshot.enemies.some(enemy=>Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y)<95)&&
   [[1,0],[-1,0],[0,1],[0,-1]].filter(([x,y])=>!canTraverseExpedition(this.geometry,this.player,
    {x:this.player.x+x*48,y:this.player.y+y*48},this.player.radius)).length>=2)
   this.holdCornerDashUsed=this.abilities.recoverDashCharge();
  const siege=this.siege;
  if(!siege)return;
  if(this.siegeBeat!==siege.beat){
   this.siegeBeat=siege.beat;this.siegeRemainingMs=12000;
   this.relayBank=undefined;this.coverPreview=undefined;
  }
  if(this.node.templateId==='overload-floor'&&!this.coverPreview&&!siege.crossing&&
   Math.hypot(this.player.x-this.siegePoint.x,this.player.y-this.siegePoint.y)<=320)this.previewRelayCover();
  if(this.storyFirstHold&&this.siegeRemainingMs>0){
   if(this.heldSiegeBeat!==siege.beat){this.gatePreviousStrikes.clear();this.gateGraceUntil=0;this.heldSiegeBeat=siege.beat;}
   this.gateHold={id:'siege',x:siege.x,y:siege.y,ms:12000-this.siegeRemainingMs};
   const strikes=this.enemies.snapshot.enemies.filter(enemy=>(enemy.type==='brute'||enemy.type==='carrier')&&
    (enemy.meleePhase==='windup'||enemy.meleePhase==='strike')&&
    meleeStrikeContains(enemy.meleeShape,enemy.meleeOriginX,enemy.meleeOriginY,enemy.meleeAngle,siege.x,siege.y,siege.radius));
   for(const id of this.gatePreviousStrikes)if(!strikes.some(enemy=>enemy.id===id))this.gatePreviousStrikes.delete(id);
   const striker=strikes.find(enemy=>!this.gatePreviousStrikes.has(enemy.id));
   if(striker){
    this.gatePreviousStrikes.add(striker.id);
    const teaching=this.holdTeachingUntil===0&&striker.meleePhase==='windup';
    if(teaching){this.enemies.extendWindup(striker.id,650);this.holdTeachingUntil=this.elapsed+2.5;}
    this.gateGraceUntil=Math.max(this.gateGraceUntil,this.elapsed+2.5+(striker.meleePhase==='windup'?striker.meleeRemainingMs/1000:0)+(teaching?.65:0));
    if(teaching)this.holdTeachingGraceUntil=this.gateGraceUntil;
    this.presentation.push({type:'story-hold-grace',x:siege.x,y:siege.y,id:striker.id,durationMs:2500});
   }
  }
  if(!siege.choosing&&Math.hypot(this.player.x-siege.x,this.player.y-siege.y)<=siege.radius){
   const floor=this.node.templateId==='overload-floor'&&this.relayBanks.length&&!this.relayBank?4000:0;
   this.siegeRemainingMs=Math.max(floor,this.siegeRemainingMs-ms);
  }
 }

 get encounterGuardian(){
  return this.expedition.run.version===3
   ?this.director.plan.schedule.find(spawn=>spawn.guardian)?.guardian??null
   :progressionFor(this.node).guardianKind;
 }
 get encounter(){return this.director.snapshot;}
 get encounterRemaining(){return this.director.snapshot.remaining+this.enemies.activeCount+this.enemies.reservedCount+this.pending.reduce((n,p)=>n+(p.type==='carrier'?4:1),0);}
 get canContinue(){const cp=this.suppressSave?null:loadCheckpoint(this.storage);if(!cp)return false;const c=new CombatSystem();c.setBuild(cp.build);return c.restoreRunResources(cp.resources);}
 newRun(seed=(this.runSequence=Math.imul(this.runSequence,1664525)+1013904223>>>0),options:ExpeditionStartOptions={}){this.nextRigDrill=null;this.conditionsEnabled=options.shipConditions!==false;this.difficultyMode=difficultyId(options.difficulty??this.difficultyMode);const nextCombat=new CombatSystem();nextCombat.switchWeapon('shotgun');const nextExpedition=createExpedition(seed,nextCombat.getRunResources(),options);this.presentation.reset();this.discardCheckpoint();this.combat=nextCombat;this.expedition=nextExpedition;this.runStats.reset();this.abilities.setRig(this.expedition.build.rig??'breacher');this.kills=0;this.elapsed=0;const combat=this.expedition.run.phase==='combat';this.enterRoom(combat);if(!combat)this.status='reward';if(this.checkpointState!=='clear-failed')this.save();}
 continueRun(){const cp=this.suppressSave?null:loadCheckpoint(this.storage);if(!cp)return false;const c=new CombatSystem();c.setBuild(cp.build);if(!c.restoreRunResources(cp.resources))return false;this.combat=c;this.difficultyMode=difficultyId(cp.difficulty);this.expedition=restoreExpedition(cp);this.runStats.reset(cp.stats);this.abilities.setRig(this.expedition.build.rig??'breacher',cp.abilities?.overdriveCharge??0);this.kills=this.runStats.snapshot.kills.total;this.elapsed=Object.values(this.runStats.snapshot.roomTimeMs).reduce((a,b)=>a+b,0)/1000;this.enterRoom(false);this.nextRigDrill=cp.pendingRigDrill?{augment:cp.pendingRigDrill,depth:this.node.depth+1}:null;this.status=cp.run.phase==='route'?'route':'reward';this.checkpointState='saved';if(this.status==='route')this.finishChoice();return true;}
 retryLoadout(){
  if(this.status!=='dead'||!this.expedition.build.rig)return false;
  const {build,run}=this.expedition;
  this.newRun(undefined,{rig:build.rig,difficulty:this.difficulty,version:run.version,startingBoon:run.version===3?build.mutations[0]:undefined});
  return true;
 }
 private enterRoom(start=true){this.guardianGroundUntil=0;this.consoleRelease=0;this.recoveryGrilleState=undefined;this.consoleExchange=undefined;this.broodStarted.clear();this.protectedStatuses.clear();this.protectedDamage.clear();this.exchangeHistory.clear();this.finalExchange=undefined;this.featuredVolleyUsed=false;this.earlyPressureAt=undefined;this.earlyPressureFollow=undefined;this.residentialLane=undefined;this.broodSupply=undefined;this.broodChoiceUsed=false;this.broodMarksShownAt=undefined;this.coverPreview=undefined;this.rackShutter=undefined;this.shaftApproach=undefined;this.shaftIngress=undefined;this.relayHeavyRecovered=this.relayHeavyRecovering=false;this.plateRifleHits=0;this.relayCrossfire=false;this.relayVolleyId=undefined;this.hiddenEnemiesMs=0;this.roomStartCredits=this.combat.snapshot.credits;this.usedContractMedkit=false;this.dodgeDrill=null;this.rigDrill=null;this.departures.clear();this.coverLesson=undefined;this.lastAbilityReady={};this.abilitySampleAt=-Infinity;this.deathReadySlot=undefined;this.platedLessonTarget=undefined;this.promptedWeapons=0;this.weaponLesson=undefined;this.stagedCover.clear();this.cleanupElapsed=0;this.breakAnnounced=false;this.lastPriorityPoint=undefined;this.broodPodsDestroyed=0;this.broodCollapse=undefined;this.siegeBeat=-1;this.siegeRemainingMs=12000;this.relayBank=undefined;this.roomDamageLedger.clear();this.presentation.flush();this.presentation.reset();this.abilityPulseDamage=0;this.storySkipped=false;this.aimPoint=null;this.mutations.reset();this.abilities.resetRoom();this.combat.setOverclock(false);this.node=this.findNode();this.runStats.enterRoom(this.node.id);this.geometry=createExpeditionGeometry(this.node);this.navigation=new FacilityNavigation(this.geometry);this.prepareSiegePoint();
 this.gateStaged=false;this.holdTeachingUntil=0;this.holdTeachingGraceUntil=0;this.holdCornerDashUsed=false;this.heldSiegeBeat=-1;this.gateHold=undefined;this.gateGraceUntil=0;this.gatePreviousStrikes.clear();this.bruteIngress.clear();
 this.gatePads=this.node.templateId==='safety-interlock-station'?floorChoicePair(this.geometry,this.geometry.playerSpawn,p=>this.navigation.reachable(p),64,128):[];
 this.relayBanks=[];this.relayRoutes=[];this.relayShelterStep=undefined;
 if(this.node.templateId==='overload-floor'){
  const reachable=(point:{x:number;y:number})=>this.navigation.reachable(point);
  const [near]=floorChoicePair(this.geometry,this.siegePoint,p=>reachable(p)&&hasClearExpeditionShot(this.geometry,this.siegePoint,p),292,388);
  const [far]=floorChoicePair(this.geometry,this.siegePoint,p=>reachable(p)&&!hasClearExpeditionShot(this.geometry,this.siegePoint,p)
   &&(!near||(p.y-this.siegePoint.y)*(near.y-this.siegePoint.y)<0
    &&Math.hypot(p.x-near.x,p.y-near.y)>450),704,864);
  this.relayBanks=near&&far?[near,far]:floorChoicePair(this.geometry,this.siegePoint,reachable,304,496);
  const routes=new FacilityNavigation(this.geometry);
  this.relayRoutes=this.relayBanks.map(bank=>this.relayRoute(bank,routes));
  const covered=this.relayRoutes[1];
  if(covered)for(let i=1;i<covered.length&&!this.relayShelterStep;i++){
   const from=covered[i-1],to=covered[i],steps=Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/12);
   for(let step=1;step<=steps;step++){
    const point={x:from.x+(to.x-from.x)*step/steps,y:from.y+(to.y-from.y)*step/steps};
    if(canOccupyExpedition(this.geometry,point,this.player.radius)&&
     clipExpeditionLane(this.geometry,this.siegePoint,point,SPITTER_PROJECTILE_RADIUS+this.player.radius).blocked&&
     clipExpeditionLane(this.geometry,this.siegePoint,point,SPITTER_PROJECTILE_RADIUS).blocked){
     this.relayShelterStep=point;
     break;
    }
   }
  }
 }
 const condition=this.condition;this.roomCondition=condition?new RoomConditionRuntime(condition,this.geometry,this.expedition.run.seed+this.node.depth):null;this.enemies=this.makeEnemies();this.boss.reset();this.bossSlow=1;this.pickups.reset(this.expedition.run.seed+this.node.depth);this.bullets=[];this.pools=[];this.pending=[];this.clearRequested=false;this.emergencyUsed=false;this.hurtCooldown=0;this.heavyHitGrace=0;this.recentHits=[];this.mutations=this.makeMutations();this.director=this.makeDirector();this.combat.setBuild(this.expedition.build);this.combat.setWave(this.node.depth+1);Object.assign(this.player,this.geometry.playerSpawn,{angle:0,moving:false,vx:0,vy:0});this.roomRevision++;this.status='playing';
 const junctionRecovery=orderRecovery(this.difficulty);
 if(start&&junctionRecovery.armor&&orderRoom(this.expedition.run.roomOrder,this.node.depth).second){
  const entrance=this.moveCorpse({...this.player,radius:14},48,0);
  this.pickups.spawn('armor',junctionRecovery.armor,entrance.x,entrance.y);
 }
 if(this.expedition.run.version===3&&this.difficulty==='story'){
  const {health,armor}=this.combat.snapshot;
  const suit=health+armor;
  if(this.node.templateId==='diagnostic-gallery'&&suit<=70)
   this.pickups.spawn('health',suit<=12?65:25,260,485);
  const recovery=this.node.depth===11&&health<50?35:this.node.templateId==='infested-workshop'&&health<=60?25:0;
  if(recovery){
   const entrance=this.moveCorpse({...this.player,radius:14},48,0);
   this.pickups.spawn('health',recovery,entrance.x,entrance.y);
  }
 }
 if(start){this.stageRigDrill();this.placeConditionEggs();if(this.node.depth===15&&this.expedition.run.junctions?.[11]==='salvage')this.abilities.addCharge(3000);this.combat.replenishReserves();if(familyBonuses(this.expedition.build).recovery)this.combat.restoreArmor(6);this.encounterEvents(this.director.start());}}
 pause(){if(this.status==='playing'){this.status='paused';this.player.moving=false;}}
 resume(){if(this.status==='paused')this.status='playing';}
 menu(){this.status='menu';this.player.moving=false;}
 private save(){const result=saveCheckpoint(this.storage,{version:1,difficulty:this.difficulty,savedAt:Math.round(this.elapsed*1000),...this.expedition,...(this.nextRigDrill&&this.expedition.run.phase==='route'?{pendingRigDrill:this.nextRigDrill.augment}:{}),abilities:{overdriveCharge:this.abilities.snapshot.overdrive.charge},stats:this.stats});if(result.status==='saved'){this.suppressSave=false;this.checkpointState='saved';}else if(result.status==='unavailable'||result.status==='invalid'){if(this.checkpointState!=='clear-failed')this.checkpointState=this.storage?'save-failed':'unavailable';}}
 chooseMutation(id:MutationId){if(this.status!=='reward'||this.expedition.run.phase==='rig-select')return;const first=TRANSFORMATIVE_AUGMENT_IDS.find(augment=>this.expedition.build.mutations.includes(augment));
 this.expedition=claimExpeditionMutation(this.expedition,id);
 if(!first&&TRANSFORMATIVE_AUGMENT_IDS.includes(id as AugmentId))this.nextRigDrill={augment:id as AugmentId,depth:this.node.depth+1};this.combat.setBuild(this.expedition.build);if(this.expedition.run.phase==='combat'){this.enterRoom();return;}this.finishChoice();}
 reroll(){if(this.status!=='reward')return false;try{this.expedition=rerollExpedition(this.expedition);this.combat.setCredits(this.expedition.resources.credits);this.save();return true;}catch{return false;}}
 private applyHealingAllocation(combat:CombatSystem){const act=progressionFor(this.node).act;combat.restoreHealth(35+act*5);combat.restoreArmor(15+act*5);}
 /** Preview the free allocation before deciding whether a paid item adds value. */
 private serviceAllocation(combat:CombatSystem){
  if(this.expedition.run.service?.nodeId===this.node.id&&this.expedition.run.service.allocationClaimed)return;
  if(this.node.reward==='healing')this.applyHealingAllocation(combat);
  else if(this.node.reward==='supplies'){combat.collectAmmoPack(false);combat.collectAmmoPack(false);combat.addGrenades(1);}
 }
 private allocateService(){this.serviceAllocation(this.combat);this.expedition=markExpeditionAllocation(this.expedition,this.combat.getRunResources());}
 get returningRigAugments(){
  const build=this.expedition.build;
  const pair=TRANSFORMATIVE_AUGMENT_PAIRS[build.rig??'breacher'];
  return serviceStock(this.expedition.run,'rig-return')&&!pair.some(id=>build.mutations.includes(id))?pair:[];
 }
 canPurchaseService(purchase:ServiceId,augment?:string){
  if(this.status!=='reward'||this.expedition.run.phase!=='reward'||!['healing','supplies'].includes(this.node.reward)||this.combat.snapshot.dead||!SERVICE_IDS.includes(purchase))return false;
  if(!serviceStock(this.expedition.run,purchase)||this.combat.snapshot.credits<serviceCost(purchase,this.node.depth))return false;
  if(purchase==='rig-return')return this.returningRigAugments.some(id=>augment===undefined||id===augment);
  const preview=new CombatSystem();preview.setBuild(this.expedition.build);if(!preview.restoreRunResources(this.combat.getRunResources()))return false;this.serviceAllocation(preview);
  if(purchase==='heal')return preview.snapshot.health<100;
  if(purchase==='armor')return preview.snapshot.armor<preview.mutationResources().maxArmor;
  if(purchase==='medkit')return preview.snapshot.medkits<6;
  if(purchase==='grenade')return preview.snapshot.grenades<6;
  if(purchase==='reroll')return this.expedition.run.version!==1&&(this.expedition.run.rerollTokens??0)<3;
  if(purchase==='upgrade')return availableAugmentUpgrades(this.expedition.build).some(id=>augment===undefined||id===augment);
  if(purchase==='revive')return !this.expedition.run.finaleRevive;
  if(purchase==='route-ammo'){
   const route=this.expedition.run.guardianRoute;
   if(!route)return false;
   const {reserve,maxReserve}=preview.mutationResources(GUARDIAN_SUPPLIES[route].weapon);
   return reserve<maxReserve;
  }
  const before=preview.getRunResources();preview.refillShopAmmo();const after=preview.getRunResources();return (Object.keys(before.ammo) as WeaponId[]).some(id=>after.ammo[id].reserve>before.ammo[id].reserve);
 }
 purchaseService(purchase:ServiceId,augment?:string){
  const upgrade=availableAugmentUpgrades(this.expedition.build).find(id=>id===augment);
  const returning=this.returningRigAugments.find(id=>id===augment);
  if((purchase==='rig-return'&&!returning)||(purchase==='upgrade'&&!upgrade)||!this.canPurchaseService(purchase,augment))return false;
  this.allocateService();const before=this.combat.getRunResources();let build=this.expedition.build;
  if(purchase==='heal')this.combat.restoreHealth(serviceRepairAmounts(this.difficulty).heal);
  else if(purchase==='armor')this.combat.restoreArmor(serviceRepairAmounts(this.difficulty).armor);
  else if(purchase==='ammo')this.combat.refillShopAmmo();
  else if(purchase==='route-ammo'&&this.expedition.run.guardianRoute){
   const supply=GUARDIAN_SUPPLIES[this.expedition.run.guardianRoute];
   this.combat.grantRouteAmmo(supply.weapon,supply.rounds);
  }
  else if(purchase==='medkit')this.combat.restoreRunResources({...before,medkits:Math.min(6,before.medkits+1)});
  else if(purchase==='grenade')this.combat.addGrenades(2);
  else if(purchase==='rig-return')build=addMutation(build,returning!);
  else if(purchase==='upgrade')build=upgradeBuildAugment(build,upgrade!);
  this.combat.setCredits(before.credits-serviceCost(purchase,this.node.depth));
  this.expedition=recordExpeditionPurchase(this.expedition,purchase,this.combat.getRunResources(),build);this.combat.setBuild(build);this.save();return true;
 }
 claimResources(purchase:ServiceId|null=null){
  if(purchase){this.purchaseService(purchase);return;}
  if(this.status!=='reward'||this.expedition.run.phase!=='reward'||!['healing','supplies'].includes(this.node.reward))return;
  this.allocateService();this.expedition=claimExpeditionResources(this.expedition,this.combat.getRunResources());this.finishChoice();
 }
 private finishChoice(){this.status='route';this.save();if(this.expedition.run.version===3&&this.node.templateId!=='manual-control-chamber'&&!detourOffers(this.expedition.run).length&&!this.conditionFor(this.node.depth+1)&&this.node.next.length===1){this.expedition=chooseExpeditionRoute(this.expedition,this.node.next[0]);this.enterRoom();}}
 readonly boonStatuses=(id:number)=>this.mutations.statuses(id);
 conditionFor(depth:number,salvage=false){return shipCondition(this.expedition.run,depth,salvage);}
 get condition(){return this.conditionsEnabled?this.conditionFor(this.node.depth,this.expedition.run.detour?.choice==='salvage'):undefined;}
 get storyRoom(){return storyRoomFor(this.node.templateId);}
 openingName(depth?:number,salvage=false){
  if(depth===undefined)return this.director.plan.openingName;
  const run=this.expedition.run;
  if(depth===8&&run.version===3)return 'Bait the ram into the rack shutter';
  if(depth===9&&run.version===3)return 'Use the relay receiver as cover';
  if(depth===GUARDIAN_ROUTE_DEPTH&&run.guardianRoute){
   const route=GUARDIAN_ROUTES[run.guardianRoute];
   return `${route.name} · ${route.banner}`;
  }
  return run.runStructure?storyOpening(run.seed,depth,this.difficulty==='story',salvage&&isJunction(depth),run.junctions).name:undefined;
 }
 private startWeaponLesson(weapon:'plasma'|'rocket',target:number){
  if(this.expedition.run.version!==3)return;
  const flag=weapon==='plasma'?1:2;
  const lessons=this.expedition.run.weaponLessons??0;
  if(((lessons|this.promptedWeapons)&flag)!==0||this.weaponLessonPrompt)return;
  this.promptedWeapons|=flag;
  this.weaponLesson={weapon,target,until:this.elapsed+4};
 }
 private completeWeaponLesson(flag:1|2){
  if(this.expedition.run.version!==3)return;
  const lessons=this.expedition.run.weaponLessons??0;
  if((lessons&flag)!==0)return;
  if(this.weaponLesson?.weapon===(flag===1?'plasma':'rocket'))this.weaponLesson=undefined;
  this.expedition=Object.freeze({...this.expedition,run:Object.freeze({
   ...this.expedition.run,weaponLessons:(lessons|flag) as 1|2|3,
  })});
 }
 get weaponLessonPrompt(){
  const lesson=this.weaponLesson;
  if(!lesson||this.elapsed>=lesson.until){
   const plate=this.node.templateId==='residential-gallery'&&this.platedLessonTarget!==undefined?this.enemies.getSnapshot(this.platedLessonTarget):undefined;
   return plate?.armor?{target:plate,text:'4 · Plasma breaks armour'}:undefined;
  }
  const target=this.enemies.getSnapshot(lesson.target);
  if(!target||lesson.weapon==='plasma'&&!target.armor)return undefined;
  return {target,text:lesson.weapon==='plasma'?'4 · Plasma breaks armour':'5 · Rocket the incoming pair from range'};
 }
 private lookForWeaponLessons(){
  if(this.expedition.run.version!==3||this.weaponLessonPrompt)return;
  const remaining=3&~((this.expedition.run.weaponLessons??0)|this.promptedWeapons);
  if(!remaining)return;
  const enemies=this.enemies.snapshot.enemies;
  if(enemies.some(enemy=>enemy.windupMs>0||enemy.chargeMs>0||enemy.meleePhase==='windup'||enemy.pod))return;
  if(this.node.depth>=2&&(remaining&1)){
   const plate=enemies.find(enemy=>enemy.armor>0&&Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y)<=360
    &&hasClearExpeditionShot(this.geometry,this.player,enemy));
   if(plate){this.startWeaponLesson('plasma',plate.id);return;}
  }
  if(this.node.depth<2||!(remaining&2))return;
  const incoming=enemies.filter(enemy=>{
   if(enemy.type!=='stalker'&&enemy.type!=='crawler')return false;
   const x=this.player.x-enemy.x,y=this.player.y-enemy.y,distance=Math.hypot(x,y);
   return distance>=ROCKET_ARM_DISTANCE+enemy.radius+45&&distance<=400
    &&x*enemy.velocityX+y*enemy.velocityY>distance*35&&hasClearExpeditionShot(this.geometry,this.player,enemy);
  });
  const lead=incoming.find(enemy=>incoming.some(other=>other!==enemy&&Math.hypot(enemy.x-other.x,enemy.y-other.y)<=88
   &&hasClearExpeditionShot(this.geometry,enemy,other)));
  if(lead)this.startWeaponLesson('rocket',lead.id);
 }

 get coverLessonActive(){
  return !!this.coverLesson&&!this.coverLesson.learned&&this.enemies.snapshot.enemies.some(enemy=>enemy.type==='spitter');
 }
 get escortExitOpen(){return this.status==='playing'&&this.clearRequested&&[...this.departures.values()].some(departure=>departure.escort);}
 get encounterObjective(){if(this.status!=='playing')return '';if(this.elapsed<this.guardianGroundUntil)return 'Ingress sealed · cross the lane';if(this.escortExitOpen)return 'Exit open · escorts retreating';if(this.dodgeDrill)return this.dodgeDrill.confirmation>0?'Punished · 20 CR':(this.dodgeDrill.caught?'Practice strike — no damage. Step across the red edge sooner, then shoot the recovering body.':'Bonus drill · 20 CR — Step across the red edge, then shoot the recovering body.');if(this.rigDrill)return this.rigDrill.won?'Augment demonstrated · 15 CR':RIG_DRILL_PROMPTS[this.rigDrill.augment]??'';if(this.director.objectiveBroken)return this.encounter.grammar==='pincer'?'PINCER BROKEN — flank sealed':'Escort is breaking';const {pincer,reserve}=this.encounter;if(reserve)return `Reserve breach · ${Math.ceil(reserve.remainingMs/1000)}s · Kill the marked ${reserve.leader}`;if(this.floorControls.some(pad=>pad.kind==='gate'))return 'Hold either floor control to seal its flank';if(pincer?.state==='staging')return `Flank massing · ${Math.ceil(pincer.remainingMs/1000)}s to break the screen`;if(pincer?.state==='open')return 'Flank gate open';const siege=this.siege;if(siege){if(siege.choosing)return 'Relay bank failing · Short · exposed / Long · covered';if(this.relayCoverPreview)return 'Next bank · Short · exposed / Long · covered';if(siege.remainingMs<=0)return 'Relay charged — clear the remaining attackers.';return `${Math.hypot(this.player.x-siege.x,this.player.y-siege.y)<=siege.radius?'Hold':'Reach'} the exit relay: ${Math.ceil(siege.remainingMs/1000)}s charge remaining.`;}const brood=this.broodInterruption;if(brood)return brood.canceled?`BROOD INTERRUPTED — ${brood.canceled} arrivals stopped`:'BROOD INTERRUPTED — punish the Matron';const threats=this.enemies.snapshot.enemies;if(threats.some(enemy=>enemy.champion==='warden'&&(enemy.stunRemainingMs??0)>0))return 'Warden stunned by the wall — punish the opening.';if(this.relayShutter&&threats.some(enemy=>enemy.champion==='warden'))return 'Rack shutter · Bait the Warden’s ram into the marked panel';if(threats.some(enemy=>enemy.champion==='matron'&&(enemy.broodRemainingMs??0)>0))return 'Matron is brooding — focus fire to interrupt.';if(threats.some(enemy=>enemy.pod))return 'Destroy the brood pods before they hatch.';const encounter=this.director.snapshot;if(this.node.templateId==='overload-floor'&&!siege&&!(encounter.lullRemainingMs??0)&&this.hiddenEnemiesMs>=10000)return 'Sweep around the reactor to reach the remaining attackers';if((encounter.canceledReinforcements??0)>0&&!(encounter.lullRemainingMs??0))return `Reinforcements stopped · ${encounter.canceledReinforcements} arrivals canceled`;return (encounter.lullRemainingMs??0)>0?`Regroup · next wave in ${Math.ceil(encounter.lullRemainingMs!/1000)}s`:(encounter.beatLabel??'');}
 private storySkipped=false;
 get storyPresentation(){return this.storySkipped?undefined:this.storyRoom?.story;}
 skipStory(){this.storySkipped=true;}
 get storyStatus(){
  if(!this.storyRoom)return '';
  if(this.status==='complete')return SACRIFICE_ENDING;
  const depth=this.node.depth,cleared=this.expedition.run.completedNodeIds.length>depth;
  if(depth>=11)return 'NEW EARTH WARNED / PASSENGERS ALIVE / AI LIED. THE PURGE KILLS EVERYONE. LOCAL RECORD: AI KNEW BEFORE AWAKENING.';
  if(depth>=10)return 'WARNING RECEIVED / NEW EARTH PREPARING FOR WAR / SERVICE DISPLAY: PURGE DESTROYS OCCUPIED CRYO DECKS.';
  if(depth===9&&cleared)return 'WARNING RECEIVED / NEW EARTH PREPARING FOR WAR / PASSENGERS ALIVE';
  return 'MERCENARY / PASSENGERS ALIVE / AI PROMISE: YOU AND THE PASSENGERS WILL SURVIVE.';
 }
 authorizeDestruction(){
  if(this.status!=='route'||this.node.templateId!=='manual-control-chamber')return false;
  this.expedition=authorizeExpeditionDestruction(this.expedition);this.enterRoom();return true;
 }
 private collectLoot(sweep=false){for(const p of this.pickups.snapshot){const c=this.pickups.collect(p.id,sweep?p:this.player,{pickupEfficiency:DIFFICULTIES[this.difficulty].pickups});if(!c.collected)continue;const r=c.reward;if(r.kind==='health')this.combat.restoreHealth(r.amount);else if(r.kind==='armor')this.combat.restoreArmor(r.amount);else if(r.kind==='ammo')this.combat.collectAmmoPack();else if(r.kind==='grenade')this.combat.addGrenades(r.amount);else{const credits=Math.max(1,Math.round(r.amount*.15));this.combat.setCredits(this.combat.snapshot.credits+credits);this.runStats.recordCredits(credits);}this.presentation.push({type:'pickup',x:p.x,y:p.y});}}

 route(id:string,detour?:DetourChoice,augment?:string){
  if(this.status!=='route'||this.node.templateId==='manual-control-chamber')return;
  const depth=this.node.depth;
  const upgrade=availableAugmentUpgrades(this.expedition.build).find(id=>id===augment);
  if(detour==='salvage'&&(depth===fieldWorkshopDepth&&(!upgrade||this.combat.snapshot.credits<180)||depth===6&&this.combat.snapshot.credits<70))return;
  this.expedition=chooseExpeditionRoute(this.expedition,id,detour);
  const guardianRoute=depth===2?this.expedition.run.guardianRoute:undefined;
  if(!guardianRoute&&detour==='direct'&&depth===2){
   this.combat.restoreHealth(EARLY_LOCKER.health);this.combat.addGrenades(EARLY_LOCKER.grenades);
  }
  if(detour==='direct'&&depth===fieldWorkshopDepth)this.combat.restoreHealth(35);
  if(detour==='salvage'){
   if(depth===2&&!guardianRoute)this.awardCredits(EARLY_LOCKER.salvageCredits);
   if(depth===6){this.awardCredits(-70);this.combat.restoreArmor(25);this.combat.addGrenades(2);}
   if(depth===fieldWorkshopDepth&&upgrade){
    this.awardCredits(-180);
    const build=upgradeBuildAugment(this.expedition.build,upgrade);
    this.expedition=Object.freeze({...this.expedition,build});this.combat.setBuild(build);
   }
  }
  if(guardianRoute)this.awardCredits(EARLY_LOCKER.salvageCredits);
  this.expedition=Object.freeze({...this.expedition,resources:this.combat.getRunResources()});
  this.enterRoom();
  if(guardianRoute){
   this.combat.grantRouteAmmo(guardianRoute==='brood'?'rocket':'plasma',guardianRoute==='brood'?2:24);
   this.expedition=Object.freeze({...this.expedition,resources:this.combat.getRunResources()});
  }
 }
 private awardCredits(amount:number){
  this.combat.setCredits(this.combat.snapshot.credits+amount);
  if(amount>0)this.runStats.recordCredits(amount);
 }
 moveCorpse(p:{x:number;y:number;radius:number},dx:number,dy:number){
  const solids=p===this.player?this.targets().filter(t=>t.immovable&&t.health>0):[];
  // An embedded marine may increase clearance, even before clearing the full radius.
  // Dash passes through ordinary enemies but never enters Queen/nest solids.
  const canMove=(nextX:number,nextY:number,fromX:number,fromY:number)=>canOccupyExpedition(this.geometry,{x:nextX,y:nextY},p.radius)&&solids.every(t=>{
   const radius=p.radius+t.radius,before=Math.hypot(fromX-t.x,fromY-t.y),after=Math.hypot(nextX-t.x,nextY-t.y);
   return after>=radius-1e-7||before<radius&&after>before+1e-9;
  });
  let x=p.x,y=p.y,blocked=false;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
  for(let i=0;i<steps;i++){
   if(dx){if(canMove(x+dx/steps,y,x,y))x+=dx/steps;else blocked=true;}
   if(dy){if(canMove(x,y+dy/steps,x,y))y+=dy/steps;else blocked=true;}
  }
  return{x,y,blocked};
 }
 private readonly previousTargetPositions = new Map<number, {x:number;y:number}>();
 private readonly shotRadii = new Map<number, number>();
 private readonly previousTargetBuffer: {x:number;y:number}[] = [];
 private targetCache:MutationTarget[]|null=null;private targetSnapshot:unknown;
 targets():MutationTarget[]{const snapshot=this.enemies.snapshot;if(!this.boss.snapshot.active&&this.targetCache&&this.targetSnapshot===snapshot)return this.targetCache;this.targetSnapshot=snapshot;const a:MutationTarget[]=snapshot.enemies.map(e=>({id:e.id,x:e.x,y:e.y,radius:e.radius,health:e.health,maxHealth:e.maxHealth,resistant:this.expedition.run.version===3?!!e.controlResistant:e.elite||!!e.champion}));const q=this.boss.snapshot;if(q.active){a.push({id:-1,x:q.x,y:q.y,radius:92,health:q.health,maxHealth:q.maxHealth,immovable:true});for(const n of q.nests)a.push({id:-100-n.id,x:n.x,y:n.y,radius:28,health:n.health,maxHealth:n.maxHealth,immovable:true});}this.targetCache=a;return a;}
 private spawn(type:StandardEnemyId,x:number,y:number,elite=false,guardian?:'warden'|'matron',options:EnemySpawnOptions={},shutterSpitter?:true,approachLeadMs?:number){
  if(this.storyFirstHold&&this.siegeRemainingMs>8000)elite=false;
  const radius=guardianRadius(guardian,enemyBodyRadius(type,elite)),origin=options.podOrigin;
  const checkIngress=this.expedition.run.version===3&&type==='brute'&&!guardian;
  let ingress=this.bruteIngress.get(radius);
  if(checkIngress&&!ingress){
   ingress=new FacilityNavigation(this.geometry,Math.ceil(radius+2));
   ingress.prepare(this.geometry.playerSpawn,1);
   this.bruteIngress.set(radius,ingress);
  }
  const podNeighbors=origin?this.enemies.snapshot.enemies:undefined;
  // I13 pod retries search the entire authored hatch annulus, never a remote breach.
  const tries=origin?73:25,baseAngle=origin?Math.atan2(y-origin.y,x-origin.x):0;
  for(let i=0;i<tries;i++){
   const angle=origin?baseAngle+((i-1)%24)*Math.PI*2/24:i*2.399;
   const distance=origin?BOSS_BODIES.matron.hatchRingMin+(Math.floor((i-1)/24)+.5)*(BOSS_BODIES.matron.hatchRingMax-BOSS_BODIES.matron.hatchRingMin)/3:i?20+Math.sqrt(i)*18:0;
   const p=origin&&i>0?{x:origin.x+Math.cos(angle)*distance,y:origin.y+Math.sin(angle)*distance}:{x:x+Math.cos(angle)*(origin?0:distance),y:y+Math.sin(angle)*(origin?0:distance)};
   if(origin){const ringDistance=Math.hypot(p.x-origin.x,p.y-origin.y);if(ringDistance<BOSS_BODIES.matron.hatchRingMin||ringDistance>BOSS_BODIES.matron.hatchRingMax)continue;}
   // I13: rooted pods cannot separate themselves; reserve a clear native body circle.
   if(podNeighbors){let occupied=false;for(const neighbor of podNeighbors)if(Math.hypot(p.x-neighbor.x,p.y-neighbor.y)<radius+neighbor.radius+.5){occupied=true;break;}if(occupied)continue;}
   if(Math.hypot(p.x-this.player.x,p.y-this.player.y)>radius+this.player.radius+(options.pod?0:options.closeIngress?0:options.lesson||guardian==='warden'?20:80)&&canOccupyExpedition(this.geometry,p,radius)){
    // A legal circle inside an isolated pocket is not an entrance. The pending
    // request rotates to another open breach when no connected candidate fits.
    if(checkIngress&&!ingress?.reachable(p,radius+2))continue;
    const result=this.enemies.spawn(type,p.x,p.y,elite,options);if(result.spawned){
     if(options.recoveryFloorMs&&this.recoveryGrilleState?.state==='waiting'&&this.recoveryGrilleState.attackerId===undefined){
      const grille=this.recoveryGrilleState;
      const aisle=this.findRecoveryAisle(p,this.player);
      if(aisle)Object.assign(grille,aisle);
      for(const escort of this.pending){
       if(!escort.grilleEscort)continue;
       escort.x=grille.x+Math.cos(grille.angle)*24;
       escort.y=grille.y+Math.sin(grille.angle)*24;
      }
      grille.changedAt=this.elapsed;
      grille.attackerId=result.enemy.id;
     }
     if(approachLeadMs)this.shaftApproach={id:result.enemy.id,readyAt:this.elapsed+approachLeadMs/1000};
     if(options.closeIngress||options.lesson==='stalker'&&this.node.templateId==='residential-gallery'){
      const aim=options.baitAim?{...this.player,...options.baitAim}:this.player;
      this.enemyEvents(this.enemies.beginArrivalSwing(result.enemy.id,aim,options.interceptOpening));
     }
     if(guardian)this.enemies.promote(result.enemy.id,guardian);
     if(this.rackShutter&&guardian==='warden')this.rackShutter.wardenId=result.enemy.id;
     if(options.broodDestination&&this.enemies.snapshot.enemies.filter(enemy=>enemy.broodDestination).length>=2)
      this.broodMarksShownAt=this.elapsed;
     if(options.broodSupply){
      const pickup=this.pickups.spawn('armor',35,p.x+Math.cos(Math.atan2(this.player.y-p.y,this.player.x-p.x))*28,p.y+Math.sin(Math.atan2(this.player.y-p.y,this.player.x-p.x))*28);
      if(pickup.spawned)this.broodSupply={pod:result.enemy.id,pickup:pickup.pickup.id};
     }
     if(type==='spitter'&&!options.openingVolley&&this.crawlerPressureRoom&&!this.featuredVolleyUsed&&
      canTraverseExpedition(this.geometry,p,this.player,SPITTER_PROJECTILE_RADIUS)){
      this.featuredVolleyUsed=true;
      this.enemyEvents(this.enemies.startOpeningVolley(result.enemy.id,this.player));
     }
     if(this.rackShutter&&shutterSpitter)this.rackShutter.spitterId=result.enemy.id;
     if(this.node.templateId==='residential-gallery'&&options.beat===0&&type==='brute'&&this.residentialLane)
      this.platedLessonTarget=result.enemy.id;
     if(this.node.templateId==='passenger-vault'&&options.lesson==='brute'){
      this.platedLessonTarget=result.enemy.id;
      const angle=Math.atan2(p.y-this.player.y,p.x-this.player.x)+Math.PI/2;
      for(const distance of [148,124,96]){
       const side=[1,-1].find(side=>canTraverseExpedition(this.geometry,this.player,{
        x:this.player.x+side*distance*Math.cos(angle),y:this.player.y+side*distance*Math.sin(angle),
       },this.player.radius));
       if(side===undefined)continue;
       const step={x:this.player.x+side*distance*Math.cos(angle),y:this.player.y+side*distance*Math.sin(angle)};
       this.pickups.spawn('armor',12,step.x,step.y);
       break;
      }
      this.startWeaponLesson('plasma',result.enemy.id);
     }
    }
    return result.spawned;
   }
  }
  return false;
 }

 private get authoredViewTarget(){
  return {x:this.player.x+64*Math.cos(this.player.angle),y:this.player.y+64*Math.sin(this.player.angle)};
 }
 private reserveBendRecoil?:{x:number;y:number;angle:number;at:number;room:number};
 get queuedReserveBend(){return this.reserveBend();}
 private reserveBend(defeated?:{x:number;y:number}){
  const recoil=this.reserveBendRecoil;
  if(recoil?.room===this.roomRevision&&this.elapsed-recoil.at<1.1)
   return {...recoil,recoilAge:this.elapsed-recoil.at};
  const reserve=this.encounter.reserve;
  if(!reserve||!['coolant-plant','infested-workshop'].includes(this.node.templateId))return;
  const leader=defeated??this.enemies.snapshot.enemies.find(enemy=>enemy.priority);
  if(!leader)return;
  const view=this.authoredViewTarget;
  const entry=this.director.coolantReserveEntry(leader,view)??this.geometry.breaches.find(breach=>breach.id===reserve.breachId);
  if(!entry)return;
  for(const fraction of [.15,.3,.5,.7]){
   const bend={x:entry.x+(view.x-entry.x)*fraction,y:entry.y+(view.y-entry.y)*fraction};
   if(Math.abs(bend.x-view.x)<=144&&Math.abs(bend.y-view.y)<=80&&canOccupyExpedition(this.geometry,bend,15))
    return {...bend,angle:Math.atan2(view.y-bend.y,view.x-bend.x),recoilAge:undefined};
  }
 }
 private reserveBearing?:{from:{x:number;y:number};to:{x:number;y:number};until:number;room:number};
 get sealedEntryBearing(){
  const bearing=this.reserveBearing;
  return bearing&&bearing.room===this.roomRevision&&this.elapsed<bearing.until?bearing:undefined;
 }
 private get transmissionAugment(){
  if(this.node.templateId!=='transmission-chamber')return;
  const rig=this.expedition.build.rig;
  return rig&&TRANSFORMATIVE_AUGMENT_PAIRS[rig].find(id=>this.expedition.build.mutations.includes(id));
 }

 private encounterEvents(events:readonly EncounterEvent[]){for(const e of events){if(e.type==='reserve-cut'){
 const breach=this.geometry.breaches.find(point=>point.id===e.breachId);
 const closed=this.geometry.breaches.find(point=>point.id===e.closedEntry);
 if(closed&&this.lastPriorityPoint)this.reserveBearing={from:this.lastPriorityPoint,to:closed,until:this.elapsed+2,room:this.roomRevision};
 if(breach)this.presentation.push({type:'reserve-cut',x:breach.x,y:breach.y,durationMs:3000,reserveCut:e});
 }else if(e.type==='spawn-request'){
 if(e.beat===0&&this.earlyPressureAt===undefined&&this.difficulty==='standard'&&
  this.node.depth>=2&&this.node.depth<=7)this.earlyPressureAt=this.elapsed+1.6;
 const chosen=this.geometry.breaches.find(b=>b.id===e.breachId)??this.geometry.breaches[0];
 let x=chosen.x+(chosen.facing==='east'?56:-56),y=chosen.y;
 let openingVolley:EnemySpawnOptions['openingVolley'];
 if(this.node.templateId==='relay-racks'&&e.guardian==='warden'){
  this.rackShutter={broken:false};
  ({x,y}={x:620,y:250});
 }
 if(e.shutterSpitter)({x,y}=RELAY_RACKS_SHUTTER_SPITTER);
 if(!e.shutterSpitter&&e.enemyId==='spitter'&&(!this.coverLesson||this.coverLesson.learned)){
  const covers=(ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles??[]).filter(rect=>!this.stagedCover.has(rect));
  const lesson=stageCoverLesson(this.geometry,covers,this.player);
  if(lesson){
   this.coverLesson=lesson;
   this.stagedCover.add(lesson.cover);
   ({x,y}=lesson.shooter);
   if(this.node.templateId==='passenger-vault'||
      this.node.templateId==='transmission-chamber'&&e.spawnId.endsWith('spawn-0'))openingVolley=lesson.pickup;
   const pickup=lesson.pickup;
   if(this.node.depth<=2)this.pickups.spawn('armor',15,pickup.x,pickup.y);
   else this.pickups.spawn('credits',60,pickup.x,pickup.y);
  }
 }
 const galleryOpening=this.node.templateId==='diagnostic-gallery'&&e.beat===0;
 const firstHeavy=(galleryOpening||this.node.templateId==='communal-atrium')&&
  e.spawnId===this.director.plan.schedule.find(request=>request.enemyId==='brute'&&!request.guardian)?.spawnId;
 const shaftLanding=this.node.templateId==='service-shaft-landing';
 if(galleryOpening){
  const [anchor,flanker]=this.director.plan.schedule;
  if(e.spawnId===anchor?.spawnId)({x,y}={x:460,y:300});
  if(e.spawnId===flanker?.spawnId)({x,y}={x:550,y:527});
 }
 if(shaftLanding){
  const [first,second]=this.director.plan.schedule.filter(request=>request.enemyId==='stalker');
  const firstLunge=e.spawnId===first?.spawnId;
  const secondLunge=e.spawnId===second?.spawnId;
  const farApproach={x:265,y:270};
  if(firstLunge&&second&&!second.approachLeadMs)this.presentation.push({type:'enemy-warning',...farApproach,
   radius:38,durationMs:1050,encounterCue:'flank',cueX:farApproach.x,cueY:farApproach.y});
  const radius=enemyBodyRadius(e.enemyId,e.elite);
  if(firstLunge||secondLunge){
   const landing=this.player;
   const point=secondLunge?farApproach:[1,-1].map(side=>({
    x:Math.max(78,Math.min(145,landing.x)),y:landing.y+side*145,
   })).find(point=>canTraverseExpedition(this.geometry,point,landing,radius)&&
    canTraverseExpedition(this.geometry,landing,{x:landing.x+this.player.radius*2,y:landing.y},this.player.radius));
   if(point&&canOccupyExpedition(this.geometry,point,radius))({x,y}=point);
  }else if(e.beat!==undefined){
   if(this.shaftIngress?.beat!==e.beat)this.shaftIngress={
    beat:e.beat,deckY:this.player.y<440?125:775,x:Math.min(1080,Math.max(510,this.player.x+255)),
   };
   const ingress=this.shaftIngress;
   // Feed the pincer along the outer shoulder of the existing shaft wall.
   const deckY=e.grammar==='pincer'?(ingress.deckY<440?102:798):ingress.deckY;
   const offsets=[0,-38,38];
   const point=offsets.map(offset=>({x:ingress.x,y:deckY+offset})).find(point=>
    canOccupyExpedition(this.geometry,point,radius)&&
    Math.hypot(point.x-this.player.x,point.y-this.player.y)>radius+this.player.radius+80);
   if(point)({x,y}=point);
  }
 }
 if(firstHeavy||e.rehearsalFlank||e.openingExchange&&!e.lesson&&e.enemyId!=='spitter'){
  const bearing=Math.atan2(y-this.player.y,x-this.player.x);
  const radius=enemyBodyRadius(e.enemyId,e.elite);
  const distance=firstHeavy?84:e.openingExchange?(e.enemyId==='brute'?178:150):144;
  for(const offset of (firstHeavy?Array.from({length:16},(_,i)=>i*Math.PI/8):[0,.5,-.5,1,-1,1.5,-1.5,Math.PI])){
   const heading=bearing+offset,point={x:this.player.x+Math.cos(heading)*distance,y:this.player.y+Math.sin(heading)*distance};
   if(!canOccupyExpedition(this.geometry,point,radius)||!hasClearExpeditionShot(this.geometry,this.player,point)||
    firstHeavy&&!canTraverseExpedition(this.geometry,point,this.player,this.player.radius))continue;
   ({x,y}=point);
   break;
  }
 }
 if(e.augmentPosition&&this.transmissionAugment){
  const augment=this.transmissionAugment;
  const spacing=augment==='ember-relay'?108:augment==='pilgrim-pylon'?140:82;
  const sideways=augment==='siege-plow'?0:36;
  const radius=enemyBodyRadius(e.enemyId,e.elite);
  const anchor={x:this.player.x,y:this.player.y};
  const receiver=ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles?.[0];
  const bearing=receiver?Math.atan2(receiver.y+receiver.height/2-anchor.y,receiver.x+receiver.width/2-anchor.x):this.player.angle;
  for(const offset of [0,.5,-.5,1,-1,1.5,-1.5,2,-2,Math.PI]){
   const angle=bearing+offset,fx=Math.cos(angle),fy=Math.sin(angle);
   const near={x:anchor.x+fx*125,y:anchor.y+fy*125};
   const far={x:near.x+fx*spacing-fy*sideways,y:near.y+fy*spacing+fx*sideways};
   if(!canOccupyExpedition(this.geometry,near,46)||!canOccupyExpedition(this.geometry,far,46)||
    !hasClearExpeditionShot(this.geometry,anchor,far)||!hasClearExpeditionShot(this.geometry,near,far))continue;
   const point=e.augmentPosition==='approach'?near:far;
   if(canOccupyExpedition(this.geometry,point,radius)){({x,y}=point);break;}
  }
 }
 let consoleApproachMs=0;
 if(e.consoleLead){
  this.consoleRelease=this.elapsed+4.8;
  const console=ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles?.[0];
  if(console){
   const radius=enemyBodyRadius(e.enemyId,e.elite);
   const nearSide=this.player.y<console.y+console.height/2?-1:1;
   const nearY=nearSide<0?console.y:console.y+console.height;
   const farY=nearSide<0?console.y+console.height:console.y;
   const midX=console.x+console.width/2;
   const ends=this.player.x<midX?[console.x,console.x+console.width]:[console.x+console.width,console.x];
   for(const end of ends){
    const side=end<midX?-1:1;
    const edgeY=e.grilleLead?nearY:farY;
    const out=e.grilleLead?nearSide:-nearSide;
    const target={x:end-side*24,y:edgeY+out*(radius+8)};
    const bait={x:end+side*54,y:edgeY+out*10};
    const landing={x:end+side*62,y:edgeY+out*78};
    const retreat={x:midX,y:nearY+nearSide*95};
    if(!canOccupyExpedition(this.geometry,target,radius)||
     !canTraverseExpedition(this.geometry,bait,landing,this.player.radius)||
     !hasClearExpeditionShot(this.geometry,bait,target)||
     !hasClearExpeditionShot(this.geometry,landing,target)||
     (e.grilleLead?!hasClearExpeditionShot(this.geometry,this.player,target):
      hasClearExpeditionShot(this.geometry,retreat,target)))continue;
    this.consoleExchange={bait,landing,target};
    const approach=Math.hypot(bait.x-this.player.x,bait.y-this.player.y);
    consoleApproachMs=Math.min(e.grilleLead?400:3000,Math.round(approach/220*1000+350));
    this.consoleRelease+=consoleApproachMs/1000;
    ({x,y}=target);
    break;
   }
  }
  if(!this.consoleExchange){
   for(let i=0;i<16;i++){
    const angle=i*Math.PI/8,target={x:this.player.x+82*Math.cos(angle),y:this.player.y+82*Math.sin(angle)};
    if(!canOccupyExpedition(this.geometry,target,enemyBodyRadius(e.enemyId,e.elite))||!hasClearExpeditionShot(this.geometry,target,this.player))continue;
    ({x,y}=target);break;
   }
  }
 }
 if(e.lateExchange){
  const covers=ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles??[];
  const shoulder=stageCoverLesson(this.geometry,covers,this.player);
  if(shoulder&&canOccupyExpedition(this.geometry,shoulder.shooter,enemyBodyRadius(e.enemyId,e.elite)))
   ({x,y}=shoulder.shooter);
 }
 if(this.node.templateId==='residential-gallery'&&e.enemyId==='brute'&&e.beat===0){
  if(!this.residentialLane){
   const player=this.player;
   for(let i=0;i<16;i++){
    const angle=player.angle+i*Math.PI/8,dx=Math.cos(angle),dy=Math.sin(angle);
    const plate={x:player.x+dx*150,y:player.y+dy*150};
    const reward={x:plate.x+dx*58,y:plate.y+dy*58};
    if(!canOccupyExpedition(this.geometry,plate,enemyBodyRadius(e.enemyId,e.elite))||
     !canTraverseExpedition(this.geometry,player,reward,player.radius)||
     !hasClearExpeditionShot(this.geometry,player,plate))continue;
    this.residentialLane={plate,side:{x:-dy,y:dx}};
    const cover=this.difficulty==='standard'&&stageCoverLesson(this.geometry,
     ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles??[],player);
    const pickup=cover?cover.pickup:reward;
    this.pickups.spawn('armor',20,pickup.x,pickup.y);
    break;
   }
  }
  if(this.residentialLane)({x,y}=this.residentialLane.plate);
 }
 if(e.lesson){
  const distance=e.lesson==='brute'&&this.node.templateId==='passenger-vault'?70:e.lesson==='brute'?215:e.lesson==='crawler'?90:100;
  const offsets=e.lesson==='brute'?[0,.2,-.2,.35,-.35,.5,-.5,1,-1]:e.lesson==='stalker'?[1,-1,1.5,-1.5,.5,-.5,0]:[0,.5,-.5,1,-1];
  const legal=offsets.map(offset=>{
   const angle=this.player.angle+offset;
   return {x:this.player.x+Math.cos(angle)*distance,y:this.player.y+Math.sin(angle)*distance};
  }).filter(point=>canOccupyExpedition(this.geometry,point,enemyBodyRadius(e.enemyId,e.elite))&&hasClearExpeditionShot(this.geometry,this.player,point));
  const cover=ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles??[];
  const nearCover=e.lesson==='brute'&&this.node.templateId!=='passenger-vault'?legal.find(point=>cover.some(rect=>
   Math.hypot(Math.max(rect.x-point.x,0,point.x-rect.x-rect.width),Math.max(rect.y-point.y,0,point.y-rect.y-rect.height))<55)):undefined;
  const sidestep=e.lesson==='stalker'?legal.find(point=>{
   const angle=Math.atan2(point.y-this.player.y,point.x-this.player.x)+Math.PI/2;
   return [-1,1].some(side=>canTraverseExpedition(this.geometry,this.player,{
    x:this.player.x+side*65*Math.cos(angle),y:this.player.y+side*65*Math.sin(angle),
   },this.player.radius));
  }):undefined;
  const point=nearCover??sidestep??legal[0];
  if(point){
   ({x,y}=point);
   if(e.lesson==='stalker'&&this.node.templateId==='residential-gallery'){
    const angle=Math.atan2(point.y-this.player.y,point.x-this.player.x);
    for(const side of [1,-1]){
     const plate={x:point.x+Math.cos(angle)*70-Math.sin(angle)*side*88,
      y:point.y+Math.sin(angle)*70+Math.cos(angle)*side*88};
     const lane=Math.atan2(plate.y-this.player.y,plate.x-this.player.x);
     const reward={x:plate.x+Math.cos(lane)*58,y:plate.y+Math.sin(lane)*58};
     if(!canOccupyExpedition(this.geometry,plate,enemyBodyRadius('brute',true))||
      !canTraverseExpedition(this.geometry,this.player,reward,this.player.radius)||
      !hasClearExpeditionShot(this.geometry,this.player,plate))continue;
     this.residentialLane={plate,side:{x:-Math.sin(angle)*side,y:Math.cos(angle)*side}};
     const coveredReward=this.difficulty==='standard'&&stageCoverLesson(this.geometry,cover,this.player);
     const pickup=coveredReward?coveredReward.pickup:reward;
     this.pickups.spawn('armor',20,pickup.x,pickup.y);
     break;
    }
   }
  }
 }
 const guardian=e.guardian??(this.expedition.run.version!==3&&progressionFor(this.node).guardian&&e.spawnId.endsWith('spawn-0')?(progressionFor(this.node).guardianKind??undefined):undefined);
  if(guardian==='warden'&&this.expedition.run.version===3&&!this.relayShutter){
   const stage=wardenOpeningSpawn(this.geometry,this.player,Math.atan2(y-this.player.y,x-this.player.x),this.enemies.snapshot.enemies);
   if(stage){x=stage.x;y=stage.y;}
  }
 if(e.grilleLead){
  const reference=this.consoleExchange?.landing??this.player;
  const lead={x,y};
  const aisle=this.findRecoveryAisle(lead,reference);
  const grille=aisle??this.findLegacyGrille(lead,reference);
  if(grille)this.recoveryGrilleState={...grille,escorts:e.grilleLead,state:'waiting',
   changedAt:this.elapsed,expiresAt:this.elapsed+7};
 }
 const grilleClosed=this.recoveryGrilleState?.state==='closed';
 const delayedEscort=this.delayRecoveryEscort&&e.grilleDelayedEscort;
 if(e.grilleEscort&&grilleClosed&&!delayedEscort)continue;
 if(e.grilleEscort&&this.recoveryGrilleState){
  const grille=this.recoveryGrilleState;
  ({x,y}={x:grille.x+Math.cos(grille.angle)*24,y:grille.y+Math.sin(grille.angle)*24});
 }
 this.pending.push({type:guardian?(guardian==='matron'?'carrier':'brute'):e.enemyId,x,y,elite:e.elite,delay:delayedEscort&&grilleClosed?3000:650+consoleApproachMs+(e.hatchDelayMs??0),consoleHold:e.grilleEscort&&!this.recoveryGrilleState?e.consoleHold:e.grilleEscort?undefined:e.consoleHold,grilleEscort:e.grilleEscort,grilleDelayedEscort:delayedEscort?true:undefined,delayedHatch:e.hatchDelayMs?chosen.id:undefined,clutchHoldUntil:e.afterMarkedClutch?this.elapsed+4:undefined,guardian,shutterSpitter:e.shutterSpitter,approachLeadMs:e.approachLeadMs,options:{closeIngress:firstHeavy||!!e.grilleLead||e.consoleLead||e.lesson==='brute'&&this.node.templateId==='passenger-vault',lessonDamageScale:e.lesson==='brute'&&this.node.templateId==='passenger-vault'?.3:this.node.depth>=1&&this.node.depth<=3&&(e.lesson||firstHeavy)?.65:undefined,baitAim:e.consoleLead?this.consoleExchange?.bait:undefined,recoveryFloorMs:e.grilleLead?1900:undefined,openingVolley,healthScale:e.healthScale,role:e.role,priority:e.priority,controlResistant:e.controlResistant,beat:e.beat,lesson:e.lesson}});this.presentation.push({type:'enemy-warning',x,y,radius:38,durationMs:650+consoleApproachMs+(e.hatchDelayMs??0),encounterCue:e.hatchDelayMs||e.relievedFlank?'flank':e.grammar==='interception'&&e.role==='flanker'?'flank':e.grammar==='crossfire'&&e.role==='ranged'?'crossfire':undefined,cueX:firstHeavy||e.rehearsalFlank||e.openingExchange||galleryOpening||shaftLanding?x:chosen.x,cueY:firstHeavy||e.rehearsalFlank||e.openingExchange||galleryOpening||shaftLanding?y:chosen.y});}else if(e.type==='boss-start')this.boss.start(this.geometry.bossSpawn.x,this.geometry.bossSpawn.y);else if(e.type==='room-clear'){if(this.node.kind==='boss')this.clearRequested=true;else if(!this.startAwakeningDrill())this.clearRoom();}}}
 private dodgeDrill: {id:number; entered:boolean; evaded:boolean; confirmation:number; caught?:number} | null = null;
 get awakeningDrill(){return this.dodgeDrill ? Object.freeze({...this.dodgeDrill}) : null;}
 skipAwakeningDrill(){if(this.status!=='playing')return;if(this.rigDrill&&!this.rigDrill.won)this.finishRigDrill();else if(this.dodgeDrill&&!this.dodgeDrill.confirmation)this.clearRoom();}

 private nextRigDrill:{augment:AugmentId;depth:number}|null=null;
 private rigDrill:{augment:AugmentId;ids:number[];until:number;won:boolean;priorCharge?:number}|null=null;
 get augmentDrillActive(){return this.rigDrill!==null;}
 get augmentDrillTarget(){
  const drill=this.rigDrill;
  if(drill&&!drill.won)for(const id of drill.ids){
   const enemy=this.enemies.getSnapshot(id);
   if(enemy)return enemy;
  }
 }

 private stageRigDrill(){
  const next=this.nextRigDrill;
  this.nextRigDrill=null;
  if(!next||next.depth!==this.node.depth)return;
  const ids:number[]=[];
  for(const bearing of [0,.55,-.55,1.1,-1.1,Math.PI]){
   const points=[{distance:150,angle:bearing},{distance:214,angle:bearing+.25}].map(({distance,angle})=>({
    x:this.player.x+Math.cos(angle)*distance,y:this.player.y+Math.sin(angle)*distance,
   }));
   if(!points.every(point=>canOccupyExpedition(this.geometry,point,28)&&hasClearExpeditionShot(this.geometry,this.player,point)))continue;
   for(const point of points){
    const result=this.enemies.spawn(next.augment==='shard-harvest'?'crawler':'brute',point.x,point.y,false);
    if(result.spawned){ids.push(result.enemy.id);this.enemies.stagger(result.enemy.id,12000);}
   }
   break;
  }
  if(ids.length!==2){for(const id of ids)this.enemies.remove(id);return;}
  this.rigDrill={augment:next.augment,ids,until:this.elapsed+12,won:false};
  if(next.augment==='shard-harvest'){
   const target=this.targets().find(enemy=>enemy.id===ids[0]);
   if(target)this.mutations.applyAbilityStatus(target,'chill',2);
  }
  if(next.augment==='meltdown-core'){
   this.rigDrill.priorCharge=this.abilities.snapshot.overdrive.charge;
   this.abilities.addCharge(12000);
  }
 }

 private observeRigDrill(event:AbilityEvent){
  const drill=this.rigDrill;
  if(!drill||drill.won||!demonstratedAugment(drill.augment,event,drill.ids))return;
  drill.won=true;
  drill.until=Math.min(drill.until,this.elapsed+1.1);
  this.awardCredits(15);
 }

 private finishRigDrill(){
  const drill=this.rigDrill;
  for(const id of drill?.ids??[])this.enemies.remove(id);
  if(drill?.priorCharge!==undefined)this.abilities.setRig('pyro',drill.priorCharge);
  this.rigDrill=null;
 }

 private startAwakeningDrill(){
  if(this.dodgeDrill||this.node.depth!==0||this.node.templateId!=='awakening-bay')return false;
  const {x,y}=this.player;
  for(let i=0;i<16;i++){
   const angle=this.player.angle+i*Math.PI/8;
   const point={x:x+AWAKENING_DRILL.spawnDistance*Math.cos(angle),y:y+AWAKENING_DRILL.spawnDistance*Math.sin(angle)};
   if(!canTraverseExpedition(this.geometry,this.player,point,ENEMIES.brute.radius))continue;
   const result=this.enemies.spawn(AWAKENING_DRILL.family,point.x,point.y,false,{lesson:AWAKENING_DRILL.family});
   if(!result.spawned)continue;
   this.dodgeDrill={id:result.enemy.id,entered:false,evaded:false,confirmation:0};
   return true;
  }
  return false;
 }
 private updateAwakeningDrill(ms:number){
  const drill=this.dodgeDrill;
  if(!drill)return;
  if(drill.confirmation>0){
   drill.confirmation-=ms;
   if(drill.confirmation<=0)this.clearRoom();
   return;
  }
  const enemy=this.enemies.getSnapshot(drill.id);
  if(!enemy){this.clearRoom();return;}
  const inside=meleeStrikeContains(enemy.meleeShape,enemy.meleeOriginX,enemy.meleeOriginY,enemy.meleeAngle,this.player.x,this.player.y,this.player.radius);
  if(enemy.meleePhase==='windup'){drill.entered ||= inside;drill.evaded=false;}
  else if(enemy.meleePhase==='recovery'){drill.entered=false;}
  else if(enemy.meleePhase==='approach'){drill.entered=false;drill.evaded=false;}
 }
 private clearRoom(){if(this.combat.snapshot.dead||this.expedition.run.phase!=='combat')return;this.dodgeDrill=null;this.collectLoot(true);const ordered=orderRoom(this.expedition.run.roomOrder,this.node.depth);if(ordered.opening!==undefined&&!ordered.second)this.combat.restoreHealth(orderRecovery(this.difficulty).hp);if(this.condition?.id==='brood')this.awardCredits(Math.round(Math.max(0,this.combat.snapshot.credits-this.roomStartCredits)*.3));if(this.node.depth===7&&(this.expedition.run.guardianRoute||this.expedition.run.junctions?.[3]==='salvage'))this.awardCredits(35);if(this.node.depth===GUARDIAN_ROUTE_DEPTH&&this.expedition.run.guardianRoute){this.combat.restoreHealth(35);this.combat.restoreArmor(25);}if(this.difficulty==='story'&&this.node.depth===2)this.combat.restoreHealth(35);if(this.expedition.run.detour?.depth===this.node.depth&&this.expedition.run.detour.choice==='salvage'){if(this.node.depth===15)this.awardCredits(160);if(this.node.depth===18)this.abilities.addCharge(24000);}this.settleContract();this.expedition=completeExpeditionRoom(this.expedition,this.combat.getRunResources());this.bullets=[];this.pools=[];this.pending=[];this.enemies.reset();this.abilities.resetRoom();this.combat.setOverclock(false);this.player.moving=false;this.status=this.expedition.run.phase==='complete'?'complete':'reward';if(this.status==='complete'){this.rememberExpedition();if(this.storyRoom){this.combat.applyDamage(1000000);this.expedition=Object.freeze({...this.expedition,resources:this.combat.getRunResources()});this.presentation.push({type:'explosion',x:this.player.x,y:this.player.y,radius:900});}this.discardCheckpoint();}else this.save();}
 private relayHeavyRecovered=false;
 private relayHeavyRecovering=false;
 private guardianGroundUntil=0;
 private guardianGround(guardian:'warden'|'matron',id:number,beat:number|undefined){
  const room=this.node.templateId;
  if(room!=='coolant-plant'&&(room!=='swarm-junction'||guardian!=='matron'||this.broodCollapse?.id!==id))return;
  const damage=[...this.roomDamageLedger.values()].reduce((sum,entry)=>sum+entry.amount,0);
  if(this.elapsed>22||damage>24)return;
  const queued=this.director.concedeGuardianGround(beat);
  if(!queued?.length)return;
  const breach=this.geometry.breaches.find(point=>point.id===queued[0].breachId);
  if(!breach)return;
  this.guardianGroundUntil=this.elapsed+3.5;
  queued.forEach((request,index)=>{
   const x=breach.x+(breach.facing==='east'?1:-1)*(76+index*22);
   const y=breach.y+(index%2?1:-1)*index*12;
   if(!canOccupyExpedition(this.geometry,{x,y},enemyBodyRadius(request.enemyId,false)))return;
   const result=this.enemies.spawn(request.enemyId,x,y,false);
   if(result.spawned)this.departures.set(result.enemy.id,{ms:1900,breach,escort:true});
  });
  this.presentation.push({type:'reserve-cut',x:breach.x,y:breach.y,durationMs:3500,
   reserveCut:{count:queued.length,family:queued[0].enemyId,closedEntry:breach.id}});
 }

 private readonly broodStarted=new Set<number>();
 private enemyEvents(events:readonly EnemyEvent[]){this.exchangeHistory.record(events,this.elapsed,2*SPITTER_PROJECTILE_RADIUS);for(const e of events){if(this.roomCondition?.condition.id==='dark'&&(e.type==='attack-warning'||e.type==='melee-warning'||e.type==='contact-attack'||e.type==='hazard-attack'))this.roomCondition.openedAttacks.add(e.enemyId);if(e.type==='arrival-wound'){
 this.presentation.push({type:e.type,targetId:e.enemyId,family:e.enemyType,x:e.x,y:e.y,damage:e.damage});
 }else if(e.type==='arrival-recovery'){
 this.presentation.push({type:e.type,arrivalSwing:'recovery',id:e.enemyId,family:e.enemyType,x:e.x,y:e.y,damage:e.damage});
 const damage=this.protectedDamage.get(e.enemyId)??[];
 const statuses=this.protectedStatuses.get(e.enemyId)??[];
 this.protectedDamage.delete(e.enemyId);
 this.protectedStatuses.delete(e.enemyId);
 for(const hit of damage)this.damage(e.enemyId,hit.amount,undefined,hit.source,false);
 const target=this.targets().find(t=>t.id===e.enemyId);
 if(target)for(const status of statuses)this.applyRigStatus(target,status.kind,status.amount);
 }else if(e.type==='melee-miss'||e.type==='recovery-stagger'){this.presentation.push({type:e.type,id:e.enemyId,x:e.x,y:e.y});}else if(e.type==='ready-shove'){const point=this.moveCorpse(this.player,e.x,e.y);this.player.x=point.x;this.player.y=point.y;}else if(e.type==='death'){if(e.guardian)this.guardianGround(e.guardian,e.enemyId,e.beat);if(e.enemyType==='carrier'&&!this.broodStarted.has(e.enemyId))this.director.reportWorkshopBroodLeaderDefeated(e.beat,e);if(e.priority&&e.beat!==undefined){this.lastPriorityPoint={x:e.x,y:e.y};const bend=this.reserveBend(e);
 const cut=this.director.reportPriorityDefeated(e.beat,e,this.authoredViewTarget);
 if(cut){
  if(bend)this.reserveBendRecoil={...bend,at:this.elapsed,room:this.roomRevision};
  this.encounterEvents([cut]);
 }}const training=this.rigDrill?.ids.includes(e.enemyId);if(!training){this.kills++;this.runStats.recordKill(e.enemyType);}const reward=training?0:Math.max(1,Math.round(e.reward*.15));const retreating=this.departures.get(e.enemyId)?.escort;const credits=retreating?Math.floor(reward/2):reward;this.runStats.recordCredits(credits);this.combat.setCredits(this.combat.snapshot.credits+credits);if(!retreating&&!training)this.pickups.rollEnemyDrop(e.enemyType,e.x,e.y);this.presentation.push({type:'corpse',encounterCue:e.priority?'priority':undefined,id:e.enemyId,x:e.x,y:e.y,vx:e.impulse?.x??0,vy:e.impulse?.y??0,family:e.enemyType,elite:e.elite});}else if(e.type==='contact-attack'&&this.dodgeDrill?.id===e.enemyId){const drill=this.dodgeDrill;drill.caught=(drill.caught??0)+1;if(drill.caught>=3&&!drill.confirmation)this.clearRoom();}else if(e.type==='contact-attack'){const attacker=this.enemies.getSnapshot(e.enemyId);this.hurt(e.damage,attacker??undefined,{source:e.attack==='charge'?'enemy-charge':'enemy-contact',enemyFamily:e.enemyType},attacker?.champion,e.enemyId); }else if(e.type==='melee-warning'){this.presentation.push({type:'enemy-warning',id:e.enemyId,family:e.enemyType,x:e.x,y:e.y,angle:e.angle,meleeShape:e.shape,dangerWeight:'low',durationMs:e.durationMs});}else if(e.type==='melee-strike'){const drill=this.dodgeDrill;if(drill?.id===e.enemyId)drill.evaded=drill.entered&&!meleeStrikeContains(e.shape,e.x,e.y,e.angle,this.player.x,this.player.y,this.player.radius);this.presentation.push({type:'enemy-attack',arrivalSwing:e.arrivalSwing?'strike':undefined,id:e.enemyId,family:e.enemyType,x:e.x,y:e.y,angle:e.angle,meleeShape:e.shape,dangerWeight:'low'});}else if(e.type==='spawn-request'){
 const broodChoice=e.pod&&this.node.templateId==='swarm-junction'&&!this.broodChoiceUsed;
 const point=broodChoice?this.stageBroodChoice(e.requestIndex,e):e;
 this.pending.push({type:e.enemyType,x:point.x,y:point.y,elite:e.elite,delay:450,options:{
  pod:e.pod,hatchMs:e.hatchMs,beat:e.beat,broodDestination:broodChoice?(e.requestIndex===0?'relay':'supply'):undefined,broodSupply:broodChoice&&e.requestIndex===1,
  ...(e.pod&&!broodChoice?{podOrigin:this.enemies.getSnapshot(e.sourceEnemyId)??{x:e.x,y:e.y}}:{}),
 }});
 if(broodChoice&&e.requestIndex===1)this.broodChoiceUsed=true;
 }else if(e.type==='attack-warning'){
  if(e.enemyType==='carrier'){this.broodPodsDestroyed=0;this.broodStarted.add(e.enemyId);}
  this.presentation.push({type:'enemy-warning',id:e.enemyId,family:e.enemyType,x:e.x,y:e.y,targetX:e.targetX,targetY:e.targetY,durationMs:e.durationMs,radius:32});
  if(e.spread){
   const away={x:2*this.player.x-e.x,y:2*this.player.y-e.y};
   const hatch=this.openBreaches.filter(breach=>canOccupyExpedition(this.geometry,
    {x:breach.x+(breach.facing==='east'?56:-56),y:breach.y},enemyBodyRadius('brute',false))).sort((a,b)=>
    Math.hypot(a.x-away.x,a.y-away.y)-Math.hypot(b.x-away.x,b.y-away.y))[0];
   this.earlyPressureFollow={x:e.x,y:e.y,shooter:e.enemyId,at:this.elapsed+.64,hatch:hatch?.id};
   const angle=Math.atan2(e.targetY-e.y,e.targetX-e.x);
   const range=Math.hypot(e.targetX-e.x,e.targetY-e.y);
   this.presentation.push({type:'enemy-warning',x:e.targetX,y:e.targetY,durationMs:e.durationMs,radius:EARLY_SPIT_IMPACT_RADIUS});
   for(const edge of [-e.spread,e.spread])this.presentation.push({type:'enemy-warning',x:e.x,y:e.y,
    targetX:e.x+Math.cos(angle+edge)*range,targetY:e.y+Math.sin(angle+edge)*range,
    durationMs:e.durationMs,radius:12});
  }
 }else if(e.type==='hazard-attack'){
  const angle=Math.atan2(e.targetY-e.sourceY,e.targetX-e.sourceX);
  this.presentation.push({type:'enemy-attack',id:e.enemyId,family:'spitter',x:e.sourceX,y:e.sourceY,angle});
  if(e.spread&&canTraverseExpedition(this.geometry,{x:e.sourceX,y:e.sourceY},{x:e.targetX,y:e.targetY},
   SPITTER_PROJECTILE_RADIUS)){
   this.pools.push({id:++this.poolId,x:e.targetX,y:e.targetY,radius:EARLY_SPIT_IMPACT_RADIUS,warning:0,life:.36,
    damage:12,tick:0,spitterOpening:true});
  }
  const rays=e.spread?[-e.spread,-e.spread/2,0,e.spread/2,e.spread]:[0];
  for(const ray of rays)this.bullets.push({hostileOwner:e.enemyId,sourceX:e.sourceX,sourceY:e.sourceY,x:e.sourceX,y:e.sourceY,
   life:ENEMY_ATTACK_SHAPES.spitterProjectileLife,kind:'hazard',
   request:{weaponId:'plasma',damage:e.damage,speed:ENEMY_ATTACK_SHAPES.spitterProjectileSpeed,radius:SPITTER_PROJECTILE_RADIUS,
    angle:angle+ray,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
 }}}
 private queenEvents(events:readonly QueenBossEvent[]){for(const e of events){if(e.type==='minion-spawn-request'&&this.enemies.activeCount+this.pending.length<20)this.pending.push({type:'crawler',x:e.x,y:e.y,elite:false,delay:650});else if(e.type==='area-attack'){this.presentation.push({type:'enemy-attack',id:-1,x:this.boss.snapshot.x,y:this.boss.snapshot.y});this.presentation.push({type:'acid',x:e.x,y:e.y,radius:e.radius});if(Math.hypot(this.player.x-e.x,this.player.y-e.y)<e.radius+16)this.hurt(e.damage,{x:e.x,y:e.y,radius:e.radius},{source:'boss-attack',enemyFamily:'queen'});this.pools.push({id:++this.poolId,x:e.x,y:e.y,radius:e.radius*.75,life:2,warning:0,damage:6,tick:.5});}else if(e.type==='nest-destroyed')this.presentation.push({type:'explosion',x:e.x,y:e.y,radius:64});else if(e.type==='queen-defeated'){this.presentation.push({type:'explosion',x:e.x,y:e.y,radius:240});this.encounterEvents(this.director.reportBossDefeated());}}}
 observeWeaponDamage?: (weapon: WeaponId, family: string, damage: number, lethal: boolean) => void;
 damage(id:number,amount:number,impulse?:{x:number;y:number},source:DamageSource='weapon',feedback=true,weapon?:WeaponId,shot?:Pick<Bullet,'sourceX'|'sourceY'>){if(this.isShutterProtected(id))return {applied:false,died:false,absorbedByArmor:0,damage:0,exposedHit:undefined};const target=this.targets().find(t=>t.id===id),frozen=target?this.mutations.statuses(id).frozen:false;this.targetCache=null;let applied=false,died=false,absorbedByArmor=0,damage=0;let exposedHit: true|undefined;
  const drill=this.dodgeDrill;
  const practicing=drill?.id===id;
  if(practicing&&(!drill.evaded||this.enemies.getSnapshot(id)?.meleePhase!=='recovery'))return {applied:false,died:false,absorbedByArmor:0,damage:0};
  if(id>0){const before=this.enemies.getSnapshot(id);const condition=this.roomCondition;
   if(weapon&&before?.exposedMs){amount*=!before.champion&&(before.type==='brute'||before.type==='carrier')?1.4:1.15;exposedHit=true;}
   const grille=this.recoveryGrille;
   if(weapon&&grille&&grille.state==='waiting'&&grille.attackerId===id&&
    before?.meleePhase==='recovery'&&shot?.sourceX!==undefined&&shot.sourceY!==undefined){
    const dx=shot.sourceX-before.x,dy=shot.sourceY-before.y;
    const forwardX=Math.cos(grille.angle),forwardY=Math.sin(grille.angle);
    const distance=Math.hypot(dx,dy);
    const gx=grille.x-before.x,gy=grille.y-before.y;
    const legacyAngle=grille.returnArcCosine!==undefined&&
     dx*gx+dy*gy>=grille.returnArcCosine*distance*Math.hypot(gx,gy);
    const aisleShot=grille.returnRange!==undefined&&distance<=grille.returnRange&&
     dx*forwardX+dy*forwardY>0&&Math.abs(dx*forwardY-dy*forwardX)<=grille.returnHalfWidth;
    const sideShot=grille.returnAisleSide&&dx*forwardX+dy*forwardY>0;
    if(legacyAngle||aisleShot||sideShot)
     this.resolveRecoveryGrille(true);
   }
   let ambush=false;
   if(before&&!before.pod&&condition?.condition.id==='dark'&&!condition.ambushed.has(id)&&source!=='status'){
    condition.ambushed.add(id);
    if(!condition.openedAttacks.has(id)){amount*=1.3;ambush=true;}
   }
   const slickImpulse=target&&impulse&&before&&condition?.slick(before)?impulse:undefined;
   const r=this.enemies.applyDamage(id,amount,slickImpulse?undefined:impulse,weapon!==undefined,source==='ability');
   for(const event of r.events)if(event.type==='arrival-wound'){
    const pending=this.protectedDamage.get(id)??[];
    pending.push({amount:event.damage,source});this.protectedDamage.set(id,pending);
   }
   if(ambush&&before&&r.applied)this.presentation.push({type:'ambush',x:before.x,y:before.y,id});
   if(target&&slickImpulse&&r.applied&&!r.died){
    const magnitude=Math.hypot(slickImpulse.x,slickImpulse.y);
    const scale=magnitude?4*Math.min(magnitude,120)/magnitude:0;
    this.mutations.launchAbility(target,slickImpulse.x*scale,slickImpulse.y*scale);
   }
   if(r.died&&condition?.eggs.delete(id)&&!condition.eggs.size&&!condition.broodLost)this.director.cancelNextReinforcements();
   if(before?.champion==='matron'&&!r.died&&before.broodRemainingMs&& !this.enemies.getSnapshot(id)?.broodRemainingMs)this.interruptBrood(id,before.beat);
   if(before?.broodDestination&&r.died){
    this.repelSavedBroodLane(before);
    if(before.broodDestination==='supply'&&this.broodSupply?.pod===id)
     this.savedArmour={id:this.broodSupply.pickup,at:this.elapsed,room:this.roomRevision};
   }
   if(before?.pod&&r.died&&++this.broodPodsDestroyed===2){
    const matron=this.enemies.snapshot.enemies.find(enemy=>enemy.champion==='matron');
    if(matron)this.interruptBrood(matron.id,matron.beat);
   }
   if(weapon&&r.applied&&before)this.observeWeaponDamage?.(weapon,before.pod?'pod':before.champion??before.type,r.healthDamage+r.absorbedByArmor,r.died);
   applied=r.applied;died=r.died;absorbedByArmor=r.absorbedByArmor;damage=r.healthDamage+r.absorbedByArmor;this.enemyEvents(r.events);if(r.died)this.departures.delete(id);}else{const r=this.boss.applyDamage(id===-1?{type:'queen'}:{type:'nest',id:-100-id},amount);applied=r.applied;died=r.destroyed;damage=r.damage;if(id===-1&&r.destroyed){this.kills++;this.runStats.recordKill('queen');}this.queenEvents(r.events);}
  if(practicing&&applied&&damage>0&&!drill.confirmation){
   drill.confirmation=AWAKENING_DRILL.confirmationMs;
   this.combat.setCredits(this.combat.snapshot.credits+AWAKENING_DRILL.credits);
   this.runStats.recordCredits(AWAKENING_DRILL.credits);
   if(target)this.presentation.push({type:'pickup',x:target.x,y:target.y});
  }
  if(applied&&damage>0){this.runStats.recordDamage(source,damage);this.abilities.addCharge(damage*DIFFICULTIES[this.difficulty].overdrive*(this.node.depth>=10?DIFFICULTIES[this.difficulty].lateOverdrive:1),died?DIFFICULTIES[this.difficulty].overdrive*(this.node.depth>=10?DIFFICULTIES[this.difficulty].lateOverdrive:1):0);if(feedback&&target)this.reportDamage({type:'hit',weapon,angle:impulse?Math.atan2(impulse.y,impulse.x):undefined,contact:absorbedByArmor>0?'armor':'damage',x:target.x,y:target.y,targetId:id,damage,lethal:died,source,exposedHit});if(died&&target)this.abilities.onKill(target,frozen);}
  return{applied,died,absorbedByArmor,damage,exposedHit};
 }
 /** Native attacks carry typed sources; direct unattributed damage also serves opt-in UI fixtures. */
 private updateHitGrace(damage:number){
  if(damage>20+1e-7){this.heavyHitGrace=2;this.recentHits=[];return;}
  if(this.difficulty==='veteran'||this.heavyHitGrace>0||damage<=0)return;
  this.recentHits=this.recentHits.filter(hit=>this.elapsed-hit.at<=1.5);
  this.recentHits.push({at:this.elapsed,damage});
  if(this.recentHits.reduce((total,hit)=>total+hit.damage,0)>=30){this.heavyHitGrace=2;this.recentHits=[];}
 }
 hurt(amount:number,origin?:{x:number;y:number;radius?:number},source:IncomingDamageOrigin={source:'unknown'},guardian?:'warden'|'matron',fatalOwner?:number){if(this.status!=='playing'||this.abilities.invulnerable||this.hurtCooldown>0||!Number.isFinite(amount)||amount<=0)return;this.hurtCooldown=.22;const armorBefore=this.combat.snapshot.armor,healthBefore=this.combat.snapshot.health;let incoming=Math.min(amount*DIFFICULTIES[this.difficulty].damage,source.source==='unknown'||source.source==='scripted'||source.source==='self-blast'?Infinity:incomingDamageLimit(this.difficulty,source.enemyFamily??'unknown'));if(this.heavyHitGrace>0&&source.source==='enemy-contact'&&['crawler','stalker','spitter'].includes(source.enemyFamily??''))incoming*=.25;const received=this.combat.applyDamage(incoming*this.abilities.incomingDamageMultiplier,source.source==='unknown'||source.source==='scripted'||source.source==='self-blast'?Infinity:incomingDamageLimit(this.difficulty,source.enemyFamily??'unknown'));this.updateHitGrace(received.absorbedByArmor+received.healthDamage);const firstSelfBlast=source.source==='self-blast'&&!this.stats.selfBlastDamage;this.runStats.recordDamageTaken(armorBefore+healthBefore-this.combat.snapshot.armor-this.combat.snapshot.health,source);const roomDamage=armorBefore+healthBefore-this.combat.snapshot.armor-this.combat.snapshot.health,key=source.source+':'+(guardian??source.enemyFamily??'');if(roomDamage>0){const prior=this.roomDamageLedger.get(key);this.roomDamageLedger.set(key,{...source,guardian,amount:(prior?.amount??0)+roomDamage});}if(!this.combat.snapshot.dead)this.mutations.hurt(armorBefore,this.combat.snapshot.armor,this.player);if(!this.emergencyUsed&&!this.combat.snapshot.dead&&this.combat.snapshot.health<30&&this.combat.build.mutations.includes('emergency-plating')){this.emergencyUsed=true;this.combat.restoreArmor(20);this.presentation.push({type:'boon',boon:'shield',x:this.player.x,y:this.player.y});}this.presentation.push({type:'hurt',x:this.player.x,y:this.player.y,incomingSource:source.source,...(firstSelfBlast&&roomDamage>0&&origin?.radius?{selfBlast:{distance:Math.hypot(this.player.x-origin.x,this.player.y-origin.y),radius:origin.radius}}:{}),...(origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)?{sourceX:origin.x,sourceY:origin.y}:{})});if(this.combat.snapshot.dead&&this.node.depth===19&&this.expedition.run.finaleRevive){
  const {finaleRevive:revive,...run}=this.expedition.run;
  this.combat.restoreRunResources({...this.combat.getRunResources(),health:45});
  this.expedition=Object.freeze({...this.expedition,run:Object.freeze(run)});
  this.heavyHitGrace=2;this.presentation.push({type:'boon',boon:'shield',x:this.player.x,y:this.player.y});
 }if(this.combat.snapshot.dead){
 this.finalExchange=this.exchangeHistory.snapshot(this.player,this.geometry.blockers,this.elapsed,fatalOwner,source,origin);
 this.sampleAbilityReadiness();
 this.deathReadySlot=(['dash','tactical','power','overdrive'] as const)
  .find(slot=>this.elapsed-(this.lastAbilityReady[slot]??-Infinity)<=1);
 this.expedition=defeatExpedition(this.expedition);this.status='dead';this.rememberExpedition();this.player.moving=false;this.director.reportPlayerDefeated();this.bullets=[];this.pools=[];this.abilities.resetRoom();this.combat.setOverclock(false);this.discardCheckpoint();}}
 reload(){if(this.status==='playing'){const before=this.combat.snapshot;this.combat.startReload();if(this.combat.snapshot.magazine>before.magazine)this.mutations.completedReload(this.player);}}
 heal(){if(this.status==='playing'&&this.combat.consumeMedkit())this.usedContractMedkit=true;}
 switchWeapon(id:WeaponId){if(this.status==='playing'){const before=this.combat.getRunResources().ammo[id].magazine;if(this.combat.switchWeapon(id)&&this.combat.snapshot.magazine>before)this.mutations.completedReload(this.player);this.syncOverclock();}}
 grenade(){if(this.status!=='playing')return;const r=this.combat.throwGrenade(this.player.angle);if(r)this.bullets.push({x:this.player.x,y:this.player.y,life:1.1,kind:'grenade',request:{...r,weaponId:'rocket',radius:7,penetration:1,mutationShotId:this.combat.nextMutationEventId('grenade')},tracker:new ProjectileHitTracker(1)});}
 private weaponImpactDamage(b:Bullet, id:number){
  const {weaponId,damage,precision}=b.request;
  if(weaponId!=='pistol'&&weaponId!=='plasma'&&weaponId!=='rifle')return damage;
  const enemy=this.enemies.getSnapshot(id);
  switch(weaponId){
   case 'rifle':return enemy?.armor?Math.min(enemy.armor,damage*.42):damage;
   case 'pistol': {
    const recovering=enemy?.meleePhase==='recovery'||(enemy?.stunRemainingMs??0)>0;
    const finishing=recovering&&enemy&&enemy.armor===0&&enemy.health<=damage*2;
    return damage*(finishing?2:precision?1.85:1);
   }
   case 'plasma': {
    const plate=Math.min(enemy?.armor??0,damage*4);
    // Extra plate damage never transfers into health on the breaking hit.
    return plate + damage*.8*(1-plate/(damage*4));
   }
  }
 }
 private rocketArmed(b:Bullet){
  return Math.hypot(b.x-b.sourceX!,b.y-b.sourceY!)>=ROCKET_ARM_DISTANCE;
 }
 private blast(b:Bullet){
  if(b.kind==='player'){
   if(!this.rocketArmed(b)){this.presentation.push({type:'hit',x:b.x,y:b.y,weapon:'rocket',contact:'blocked',rocketUnarmed:true});return;}
  }
  const distanceToBlast=Math.hypot(this.player.x-b.x,this.player.y-b.y);
  if(distanceToBlast<b.request.splashRadius&&hasClearExpeditionShot(this.geometry,b,this.player)){
   this.hurt(calculateSplashDamage(b.kind==='grenade'?36:72,distanceToBlast,b.request.splashRadius),
    {x:b.x,y:b.y,radius:b.request.splashRadius},{source:'self-blast'});
  }
  const targets=this.targets().filter(t=>Math.hypot(t.x-b.x,t.y-b.y)<=b.request.splashRadius&&hasClearExpeditionShot(this.geometry,b,t));
  let rocketHits=0;
  const pincer=b.kind==='player'&&targets.filter(t=>this.enemies.getSnapshot(t.id)?.role==='flanker').length>=2;
  const elements=new Set<'ice'|'poison'|'fire'>();for(const t of targets){const s=this.mutations.statuses(t.id);if(s.chilled||s.frozen)elements.add('ice');if(s.poisoned)elements.add('poison');if(s.burning)elements.add('fire');}this.presentation.push({type:'explosion',x:b.x,y:b.y,radius:b.request.splashRadius,weapon:b.kind==='player'?b.request.weaponId:undefined,elements:[...elements]});const cause={chainId:b.request.mutationShotId??this.combat.nextMutationEventId('blast'),depth:0};for(const t of targets){const distance=Math.hypot(t.x-b.x,t.y-b.y);const enemy=b.kind==='player'?this.enemies.getSnapshot(t.id):null;
   let multiplier=1;
   if(b.kind==='player'){
    if(enemy?.pod||enemy?.broodRemainingMs)multiplier=1.2;
    else if(pincer&&enemy?.role==='flanker')multiplier=1.1;
    else multiplier=enemy?.type==='crawler'?.42:.7;
   }
   const n=calculateSplashDamage(b.request.damage*multiplier,distance,b.request.splashRadius);if(this.abilities.ignitingShots)this.mutations.applyAbilityStatus(t,'burn',1);const r=this.damage(t.id,n,{x:(t.x-b.x)/(distance||1)*b.request.knockback,y:(t.y-b.y)/(distance||1)*b.request.knockback},'weapon',true,b.kind==='player'?b.request.weaponId:undefined,b);if(r.applied){if(b.kind==='player'&&++rocketHits===2)this.completeWeaponLesson(2);if(b.hitReceipt&&!b.hitReceipt.hit){b.hitReceipt.hit=true;this.runStats.recordShotHit();}this.mutations.hit(cause.chainId,b.request.weaponId,t,{x:(t.x-b.x)/(distance||1),y:(t.y-b.y)/(distance||1)},b.request.primed);if(r.died)this.mutations.kill(t,'direct',cause);}}}
 private updateBullets(dt:number,previousTargets:ReadonlyMap<number,{x:number;y:number}>=new Map(),hostileScale=this.abilities.hostileTimeScale){
  const shotRadii=this.shotRadii;
  shotRadii.clear();
  for(const enemy of this.enemies.snapshot.enemies){
   shotRadii.set(enemy.id,enemy.champion==='matron'?enemy.radius:enemyShotRadius(enemy.type,enemy.elite));
  }
  const contacts: {t:MutationTarget;entry:number}[]=[];
  const start={x:0,y:0},end={x:0,y:0},origin={x:0,y:0},impact={x:0,y:0};
  for(const b of [...this.bullets]){if(this.status!=='playing')break;if((b.previewAt??0)>this.elapsed)continue;const bulletDt=dt*(b.kind==='hazard'?hostileScale:1);b.life-=bulletDt;const dx=Math.cos(b.request.angle)*b.request.speed*bulletDt,dy=Math.sin(b.request.angle)*b.request.speed*bulletDt;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/7));let done=false;for(let i=0;i<steps&&!done;i++){
   const from={x:b.x,y:b.y},next={x:b.x+dx/steps,y:b.y+dy/steps};const barrierBlocked=b.kind==='hazard'&&!b.preview&&this.abilities.interceptProjectile(from,next,b.request.radius,b.request.damage);if(barrierBlocked){done=true;break;}const shutter=b.kind==='player'&&this.relayShutter;
   const opened=b.kind==='player'&&this.rackShutter?.broken&&this.relayShutterFrame;
   if(opened&&this.rackShutter&&segmentIntersectsRect(from,next,opened))this.rackShutter.shotThrough=true;
   if(shutter&&segmentIntersectsRect(from,next,shutter)){
    this.presentation.push({type:'hit',x:from.x,y:from.y,angle:b.request.angle,weapon:b.request.weaponId});
    done=true;break;
   }
   const wallBlocked=!canTraverseExpedition(this.geometry,from,next,b.request.radius);if(wallBlocked&&b.kind!=='player'){
    if(b.preview&&this.coverPreview){
     this.coverPreview.impactUntil=this.elapsed+1.3;
     this.presentation.push({type:'hit',x:this.coverPreview.x,y:this.coverPreview.y,durationMs:1300,contact:'blocked'});
    }
    const lesson=this.coverLesson;
    const r=b.request.radius;
    if(b.kind==='hazard'&&lesson&&!lesson.learned&&b.sourceX!==undefined&&b.sourceY!==undefined
      &&(lesson.solids.some(solid=>segmentIntersectsRect(from,next,{x:solid.x-r,y:solid.y-r,width:solid.width+2*r,height:solid.height+2*r}))
        ||Math.hypot(Math.max(0,lesson.cover.x-next.x,next.x-lesson.cover.x-lesson.cover.width),
          Math.max(0,lesson.cover.y-next.y,next.y-lesson.cover.y-lesson.cover.height))<=42)
      &&segmentIntersectsRect({x:b.sourceX,y:b.sourceY},this.player,lesson.cover))lesson.learned=true;if(b.kind==='grenade'){b.request={...b.request,speed:0};break;}if(b.request.splashRadius)this.blast(b);else this.presentation.push({type:'hit',x:b.x,y:b.y,angle:b.request.angle,weapon:b.request.weaponId});done=true;break;}b.x=next.x;b.y=next.y;
   if(b.kind==='hazard'){if(!b.preview&&Math.hypot(b.x-this.player.x,b.y-this.player.y)<b.request.radius+16){this.presentation.push({type:'acid',x:b.x,y:b.y,angle:b.request.angle});this.hurt(b.request.damage,Number.isFinite(b.sourceX)&&Number.isFinite(b.sourceY)?{x:b.sourceX!,y:b.sourceY!}:undefined,{source:'enemy-projectile',enemyFamily:'spitter'},undefined,b.hostileOwner);done=true;}continue;}if(b.kind==='grenade')continue;
   contacts.length=0;
   for(const t of this.targets()){
    const radius=shotRadii.get(t.id)??t.radius;
    const previous=previousTargets.get(t.id)??t,mx=t.x-previous.x,my=t.y-previous.y;
    start.x=from.x-previous.x-mx*i/steps;start.y=from.y-previous.y-my*i/steps;
    end.x=next.x-previous.x-mx*(i+1)/steps;end.y=next.y-previous.y-my*(i+1)/steps;
    const entry=sweptCircle(start,end,origin,radius+b.request.radius);
    if(entry===null||!hasClearExpeditionShot(this.geometry,from,t))continue;
    impact.x=from.x+(next.x-from.x)*entry;impact.y=from.y+(next.y-from.y)*entry;
    if(canTraverseExpedition(this.geometry,from,impact,b.request.radius))contacts.push({t,entry});
   }
   contacts.sort((a,b)=>a.entry-b.entry);
   for(const {t,entry} of contacts){const hit=b.tracker.hit(t.id);if(!hit.applied)continue;if(b.request.splashRadius){b.x=from.x+(next.x-from.x)*entry;b.y=from.y+(next.y-from.y)*entry;this.blast(b);done=true;break;}const direction={x:Math.cos(b.request.angle),y:Math.sin(b.request.angle)};if(this.abilities.ignitingShots)this.mutations.applyAbilityStatus(t,'burn',1);const r=this.damage(t.id,this.weaponImpactDamage(b,t.id),{x:direction.x*b.request.knockback,y:direction.y*b.request.knockback},'weapon',false,b.request.weaponId,b);const plateBroken=b.request.weaponId==='plasma'&&r.absorbedByArmor>0&&!this.enemies.getSnapshot(t.id)?.armor;this.presentation.push({type:'hit',contact:r.applied?(r.absorbedByArmor>0?'armor':'damage'):'blocked',x:from.x+(next.x-from.x)*entry,y:from.y+(next.y-from.y)*entry,angle:b.request.angle,weapon:b.request.weaponId,targetId:t.id,...(r.applied?{damage:r.damage,lethal:r.died,source:'weapon' as const,plateBroken:plateBroken?true as const:undefined,exposedHit:r.exposedHit}:{})});if(plateBroken){
    const firstStrip=this.expedition.run.version===3&&!((this.expedition.run.weaponLessons??0)&1);
    this.completeWeaponLesson(1);
    if(this.node.templateId==='residential-gallery'||firstStrip&&(this.difficulty==='story'||t.id===this.platedLessonTarget)){
     this.combat.setCredits(this.combat.snapshot.credits+15);
     this.runStats.recordCredits(15);
     if(!r.died&&t.id===this.platedLessonTarget&&this.residentialLane){
      const side=this.residentialLane.side;
      this.shoveEnemy(t.id,side.x*72,side.y*72);
     }
     if(!r.died)this.enemies.stagger(t.id,this.difficulty==='story'||this.node.templateId==='residential-gallery'?1600:1100);
     this.presentation.push({type:'boon',boon:'shield',x:t.x,y:t.y,targetId:t.id});
    }
   }if(b.request.weaponId==='rifle'&&t.id===this.platedLessonTarget&&r.absorbedByArmor>0&&!r.died&&this.enemies.getSnapshot(t.id)?.armor){
    this.startWeaponLesson('plasma',t.id);
    if(++this.plateRifleHits===3)this.enemies.releaseStagger(t.id);
   }if(r.applied){if(b.hitReceipt&&!b.hitReceipt.hit){b.hitReceipt.hit=true;this.runStats.recordShotHit();}}const shot=b.request.mutationShotId??this.combat.nextMutationEventId('hit');if(r.applied){this.mutations.hit(shot,b.request.weaponId,t,direction,b.request.primed);if(r.died)this.mutations.kill(t,'direct',{chainId:shot,depth:0});}if(hit.exhausted){done=true;break;}}
   if(!done&&wallBlocked){b.x=from.x;b.y=from.y;if(b.request.splashRadius)this.blast(b);else if(b.request.weaponId==='shotgun'){const c=wallContact(this.geometry,from,next,b.request.radius);this.presentation.push({type:'hit',x:c.x,y:c.y,angle:b.request.angle,weapon:'shotgun',shotId:b.request.mutationShotId,wall:c.normal});}else this.presentation.push({type:'hit',x:b.x,y:b.y,angle:b.request.angle,weapon:b.request.weaponId});done=true;}
  }if(b.life<=0){if(b.kind==='grenade')this.blast(b);done=true;}if(done){const i=this.bullets.indexOf(b);if(i>=0)this.bullets.splice(i,1);}}
 }
 update(deltaMs:number,input:GameInput=IDLE){
  if(this.status!=='playing'||!Number.isFinite(deltaMs))return;
  const ms=Math.min(50,Math.max(0,deltaMs));
  const expiry=this.abilities.overclocked?this.abilities.snapshot.overdrive.activeRemainingMs:0;
  if(expiry>1e-7&&expiry<ms-1e-7){this.updateStep(expiry,input);this.updateStep(ms-expiry,input);}
  else this.updateStep(ms,input);
 }
 private broodCollapse: {id:number; canceled:number; pods:readonly {x:number;y:number}[]} | undefined;
 get broodInterruption(){
  const collapse=this.broodCollapse;
    const remainingMs=collapse?this.enemies.getSnapshot(collapse.id)?.stunRemainingMs??0:0;
  return collapse&&remainingMs>0?{...collapse,remainingMs}:undefined;
 }

 private lastPriorityPoint:{x:number;y:number}|undefined;
 private interruptBrood(id:number,beat:number|undefined){
  const reserve=this.director.reportBroodInterrupted(beat);
  const pods=this.enemies.snapshot.enemies.filter(enemy=>enemy.pod&&enemy.beat===beat&&beat!==undefined);
  this.broodCollapse={id,canceled:reserve+pods.length,pods};
  const parent=this.enemies.getSnapshot(id),pod=pods[0];
  if(parent)this.presentation.push({type:'boon',planReaction:true,x:parent.x,y:parent.y,
   targetX:pod?.x??parent.x,targetY:pod?.y??parent.y});
  for(const pod of pods)this.enemies.remove(pod.id);
  this.pending=this.pending.filter(request=>!request.options?.pod||request.options.beat!==beat);
  this.enemies.stagger(id,1800);
 }

 getEscortRetreat(id:number){
  const retreat=this.departures.get(id);
  return retreat?.escort?{x:retreat.breach.x,y:retreat.breach.y,flinching:retreat.ms>1750}:undefined;
 }

 private updateCleanup(ms:number){
  const live=this.enemies.snapshot.enemies;
  const mode=this.director.resolveCleanup(live.filter(enemy=>!this.departures.get(enemy.id)?.escort),this.pending.length,(this.siege?.remainingMs??0)<=0);
  if(this.director.objectiveBroken){
   const beat=this.encounter.beat;
   this.pending=this.pending.filter(request=>request.options?.beat!==beat);
   if(!this.breakAnnounced&&this.encounter.pincer?.state==='sealed'){
    for(const id of new Set(this.encounter.pincer.flankers.map(enemy=>enemy.breachId))){
     const breach=this.geometry.breaches.find(point=>point.id===id);
     if(breach)this.presentation.push({type:'boon',encounterCue:'pincer-broken',x:breach.x,y:breach.y});
    }
    this.breakAnnounced=true;
   }else if(!this.breakAnnounced&&this.encounter.grammar==='priority'){
    const first=live.filter(enemy=>!enemy.priority).sort((a,b)=>
      Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];
    const from=this.lastPriorityPoint??this.player;
    this.presentation.push({type:'boon',encounterCue:'escort-broken',planReaction:true,x:from.x,y:from.y,
     targetX:first?.x??from.x,targetY:first?.y??from.y,targetId:first?.id});
    this.breakAnnounced=true;
   }
  }else this.breakAnnounced=false;
  const escort=this.director.objectiveBroken&&this.encounter.grammar==='priority';
  this.cleanupElapsed=mode?this.cleanupElapsed+ms:0;
  for(const enemy of live){
   if(enemy.priority||enemy.id===this.platedLessonTarget&&(enemy.armor>0||(enemy.stunRemainingMs??0)>0))continue;
   let departure=this.departures.get(enemy.id);
   if(!mode&&!departure)continue;
   if(!departure){
    if(mode==='rush'&&live.length>1&&this.cleanupElapsed<300){this.enemies.beginRush(enemy.id);continue;}
    const breaches=this.openBreaches.length?this.openBreaches:this.geometry.breaches;
    const breach=breaches.reduce((best,point)=>
     Math.hypot(point.x-enemy.x,point.y-enemy.y)<Math.hypot(best.x-enemy.x,best.y-enemy.y)?point:best);
    departure={ms:escort?2000:550,breach,escort};this.departures.set(enemy.id,departure);
    if(escort)this.enemies.releaseChildReservation(enemy.id);
   }
   this.enemies.stagger(enemy.id,250);
   departure.ms-=ms;
   if(departure.escort&&departure.ms>1750)continue;
   const dx=departure.breach.x-enemy.x,dy=departure.breach.y-enemy.y,distance=Math.hypot(dx,dy);
   if(departure.ms>0&&distance>36){
    const step=Math.min(1,enemy.baseSpeed*2.4*ms/1000/distance);
    this.enemies.moveBy(enemy.id,dx*step,dy*step);
   }else if(this.enemies.remove(enemy.id)){
    this.departures.delete(enemy.id);
    if(departure.escort)continue;
    const credits=Math.floor(Math.max(1,Math.round(enemy.creditReward*.15))/2);
    this.runStats.recordCredits(credits);this.combat.setCredits(this.combat.snapshot.credits+credits);
   }
  }
 }
 private placeConditionEggs(){
  const state=this.roomCondition;
  if(state?.condition.id!=='brood')return;
  for(const point of state.zones){
   const egg=this.enemies.spawn('crawler',point.x,point.y,false,{pod:true,hatchMs:BROOD_HATCH_MS});
   if(egg.spawned)state.eggs.add(egg.enemy.id);
  }
 }

 private conditionWalk(x:number,y:number,dt:number){
  if(this.abilities.dashing)return this.moveCorpse(this.player,0,0);
  if(this.roomCondition?.slick(this.player)){
   const keep=Math.exp(-dt/.12);
   x=x*(1-keep)+this.player.vx*keep;
   y=y*(1-keep)+this.player.vy*keep;
  }
  return this.moveCorpse(this.player,x*dt,y*dt);
 }

 private shoveEnemy(id:number,x:number,y:number){
  const enemy=this.enemies.getSnapshot(id);
  const slick=enemy&&this.roomCondition?.slick(enemy);
  return this.enemies.moveBy(id,x*(slick?1.5:1),y*(slick?1.5:1));
 }

 private updateRoomCondition(ms:number){
  const state=this.roomCondition;
  if(!state||this.status!=='playing')return;
  switch(state.condition.id){
   case 'brood':
    state.broodRemaining=0;
    for(const id of state.eggs){
     const egg=this.enemies.getSnapshot(id);
     if(!egg)continue;
     if(egg.pod){state.broodRemaining=Math.max(state.broodRemaining,egg.podRemainingMs??0);continue;}
     state.broodLost=true;
     state.eggs.delete(id);
     this.pending.push({type:'crawler',x:egg.x+36,y:egg.y,elite:false,delay:0});
    }
    break;
   case 'conduit': {
    if(!state.conduitLive)return;
    if(!state.struck.has(0)&&state.line(this.player)){
     state.struck.add(0);
     state.marineStagger=180;
     this.hurt(3);
    }
    for(const enemy of this.enemies.snapshot.enemies){
     if(enemy.pod||state.struck.has(enemy.id)||!state.line(enemy))continue;
     state.struck.add(enemy.id);
     this.enemies.stagger(enemy.id,this.mutations.isLaunched(enemy.id)?1000:220);
     this.damage(enemy.id,6,undefined,'status');
    }
    break;
   }
   case 'vent': {
    if(!state.ventLive)return;
    const breach=state.zones[0];
    if(!breach)return;
    const pull=(point:{x:number;y:number},speed:number)=>{
     const x=breach.x-point.x,y=breach.y-point.y,d=Math.hypot(x,y);
     const length=Math.min(d,speed*ms/1000);
     return {x:x/(d||1)*length,y:y/(d||1)*length,d};
    };
    if(!this.abilities.dashing){
     const force=pull(this.player,66);
     const moved=this.moveCorpse(this.player,force.x,force.y);
     this.player.x=moved.x;this.player.y=moved.y;
     if(force.d<38&&!state.struck.has(0)){state.struck.add(0);this.hurt(24,breach);}
    }
    for(const enemy of this.enemies.snapshot.enemies){
     if(enemy.pod)continue;
     const light=enemy.type==='crawler'||enemy.type==='stalker';
     const force=pull(enemy,light?120:26);
     if(force.d<52&&(this.mutations.isLaunched(enemy.id)||light&&state.struck.has(enemy.id))){this.damage(enemy.id,enemy.health+enemy.armor,undefined,'status');continue;}
     this.enemies.moveBy(enemy.id,force.x,force.y,false);
     if(light&&!state.struck.has(enemy.id)){state.struck.add(enemy.id);this.enemies.stagger(enemy.id,230);}
    }
    break;
   }
  }
 }

 private updateStep(deltaMs:number,input:GameInput){if(this.status!=='playing')return;if(!Number.isFinite(deltaMs))return;const ms=Math.min(50,Math.max(0,deltaMs)),dt=ms/1000;const weaponOverclock=this.abilities.overclocked,hostileMs=this.abilities.hostileDelta(ms),hostileScale=ms?hostileMs/ms:1;this.presentation.update(ms);this.runStats.update(ms,this.expedition.run.currentNodeId);this.elapsed+=dt;this.exchangeHistory.sample(this.player,this.elapsed);if(this.elapsed-this.abilitySampleAt>=.1)this.sampleAbilityReadiness();this.heavyHitGrace=Math.max(0,this.heavyHitGrace-dt);this.hurtCooldown=Math.max(0,this.hurtCooldown-dt);const length=Math.max(1,Math.hypot(input.x,input.y));const speed=this.roomCondition?.marineStagger?0:220;this.roomCondition?.advance(ms);if(input.aimPoint!==undefined)this.aimPoint=input.aimPoint;this.abilities.setIntent(input.x,input.y,this.aimPoint);const frameX=this.player.x,frameY=this.player.y;const moved=this.conditionWalk(input.x/length*speed*this.abilities.moveSpeedMultiplier,input.y/length*speed*this.abilities.moveSpeedMultiplier,dt);this.player.vx=dt?(moved.x-this.player.x)/dt:0;this.player.vy=dt?(moved.y-this.player.y)/dt:0;this.player.moving=Math.hypot(this.player.vx,this.player.vy)>3;this.player.x=moved.x;this.player.y=moved.y;this.tickFloorObjectives(ms);
  if(input.angle!==null&&Number.isFinite(input.angle))this.player.angle=input.angle;else if(input.autoAim){const q=this.boss.snapshot,target=this.targets().filter(t=>(t.id!==-1||q.vulnerable)&&Math.hypot(t.x-this.player.x,t.y-this.player.y)<(this.condition?.id==='dark'?CONDITION_LIGHT_RADIUS:720)&&hasClearExpeditionShot(this.geometry,this.player,t)).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];if(target)this.player.angle=Math.atan2(target.y-this.player.y,target.x-this.player.x);}
  this.feedbackBatch=true;try{this.abilities.update(ms);}finally{this.flushFeedback();}this.player.vx=dt?(this.player.x-frameX)/dt:0;this.player.vy=dt?(this.player.y-frameY)/dt:0;this.player.moving=Math.hypot(this.player.vx,this.player.vy)>3;this.syncOverclock(weaponOverclock);if(this.status!=='playing')return;
  const reloadBefore=this.combat.snapshot;this.combat.regenerateReserves(ms);this.combat.update(ms,input.fire);if(reloadBefore.reloading&&!this.combat.snapshot.reloading&&this.combat.snapshot.magazine>reloadBefore.magazine)this.mutations.completedReload(this.player);if(input.fire){const shots=this.combat.fire(this.player.angle);if(shots.length){this.runStats.recordShot();const hitReceipt={hit:false};this.presentation.push({type:'shot',x:this.player.x,y:this.player.y,weapon:shots[0].weaponId,angle:this.player.angle});for(const request of shots)this.bullets.push({sourceX:this.player.x,sourceY:this.player.y,x:this.player.x,y:this.player.y,life:2,kind:'player',request,hitReceipt,tracker:new ProjectileHitTracker(request.penetration)});}}this.combat.reloadIfEmpty();
  const previousTargets=this.previousTargetPositions;
  previousTargets.clear();
  let previousIndex=0;
  for(const target of this.targets()){
   const point=this.previousTargetBuffer[previousIndex]??(this.previousTargetBuffer[previousIndex]={x:0,y:0});
   point.x=target.x;point.y=target.y;
   previousTargets.set(target.id,point);previousIndex++;
  }
  if(this.rigDrill&&this.elapsed>=this.rigDrill.until)this.finishRigDrill();
  if(this.earlyPressureAt!==undefined&&this.elapsed>=this.earlyPressureAt)this.stageEarlyPressure();
  const follow=this.earlyPressureFollow;
  if(follow&&(this.elapsed>=follow.at||this.enemies.getSnapshot(follow.shooter)?.pendingAttack!=='spit')){
   this.earlyPressureFollow=undefined;
   if(this.enemies.getSnapshot(follow.shooter)?.pendingAttack==='spit')this.stageEarlyPressure(follow);
  }
  this.updateCleanup(ms);this.navigation.prepare(this.player,1);this.enemyEvents(this.enemies.update(hostileMs,this.player));if(this.broodSupply){
   const pod=this.enemies.getSnapshot(this.broodSupply.pod);
   if(!pod||!pod.pod){
    if(pod&&this.pickups.remove(this.broodSupply.pickup))this.presentation.push({type:'explosion',x:pod.x,y:pod.y,radius:30});
    this.broodSupply=undefined;
   }
  }
  const rehearsalBeat=this.director.rehearsalBeat??this.director.returnShotBeat;
  if(rehearsalBeat>=0&&!this.relayHeavyRecovered){
   const recovering=this.enemies.snapshot.enemies.some(enemy=>enemy.beat===rehearsalBeat&&enemy.type==='brute'&&enemy.role==='anchor'&&enemy.meleePhase==='recovery');
   this.relayHeavyRecovered=this.relayHeavyRecovering&&!recovering;
   this.relayHeavyRecovering=recovering;
  }
  this.updateRoomCondition(ms);if(this.node.templateId==='overload-floor'){const live=this.enemies.snapshot.enemies;this.hiddenEnemiesMs=live.length&&!live.some(enemy=>hasClearExpeditionShot(this.geometry,this.player,enemy))?this.hiddenEnemiesMs+ms:0;}if(this.status!=='playing')return;this.updateAwakeningDrill(ms);if(this.status!=='playing')return;this.queenEvents(this.boss.update(hostileMs*this.bossSlow,this.player,this.enemies.activeCount+this.pending.length));this.updateBullets(dt,previousTargets,hostileScale);if(this.status!=='playing')return;
  for(const pool of this.pools){
   pool.life-=hostileMs/1000;
   pool.tick-=hostileMs/1000;
   if(pool.tick>0)continue;
   pool.tick=.5;
   if(pool.spitterOpening)this.presentation.push({type:'acid',x:pool.x,y:pool.y,radius:pool.radius});
   if(Math.hypot(pool.x-this.player.x,pool.y-this.player.y)<pool.radius+16&&
    (!pool.spitterOpening||hasClearExpeditionShot(this.geometry,pool,this.player)))
    this.hurt(pool.damage,pool,{source:'acid-pool',enemyFamily:pool.spitterOpening?'spitter':'queen'});
  }
  this.pools=this.pools.filter(p=>p.life>0);if(this.status!=='playing')return;
  this.pickups.update(ms,this.player,{magnetEnabled:true,magnetRange:familyBonuses(this.combat.build).recovery?144:120});this.collectLoot();
  this.tickRecoveryGrille();
  for(let i=this.pending.length-1;i>=0;i--){const p=this.pending[i];p.delay-=hostileMs;if(p.delay>0||p.grilleEscort&&this.recoveryGrilleState?.state==='waiting'||p.consoleHold&&this.elapsed<this.consoleRelease||(p.clutchHoldUntil??0)>this.elapsed&&this.elapsed<(this.broodMarksShownAt??Infinity)+.4)continue;if(this.spawn(p.type,p.x,p.y,p.elite,p.guardian,p.options,p.shutterSpitter,p.approachLeadMs))this.pending.splice(i,1);else if((p.attempts=(p.attempts??0)+1)>40){/* I13: exhausted annulus requests retire so a blocked brood cannot jam room clear. */if(p.options?.podOrigin){this.pending.splice(i,1);continue;}const open=this.openBreaches;const point=open[p.attempts%open.length];p.x=point.x+(point.facing==='east'?56:-56);p.y=point.y;}}
  this.lookForWeaponLessons();
  const shaftCrawlerSlots=this.node.templateId==='service-shaft-landing'?Math.max(0,3
   -this.enemies.snapshot.enemies.filter(enemy=>enemy.type==='crawler').length
   -this.pending.filter(request=>request.type==='crawler').length):Infinity;
  if(!this.rigDrill&&this.elapsed>=this.guardianGroundUntil)this.encounterEvents(this.director.update(ms,this.enemies.activeCount-[...this.departures.values()].filter(departure=>departure.escort).length+this.enemies.reservedCount+this.pending.reduce((n,p)=>n+(p.type==='carrier'?4:1),0),(this.siege?.remainingMs??0)<=0,this.player,this.relayHeavyRecovered,shaftCrawlerSlots));if(this.clearRequested&&(!this.escortExitOpen||Math.hypot(this.player.x-this.geometry.exitPoint.x,this.player.y-this.geometry.exitPoint.y)<=64)){this.clearRequested=false;this.clearRoom();}this.syncOverclock();
 }
}
