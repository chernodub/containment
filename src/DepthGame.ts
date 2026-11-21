import {floorChoicePair} from './game/waves/FloorChoices';
import {wardenOpeningAim,wardenOpeningSpawn} from './game/waves/WardenOpening';
import {demonstratedAugment,RIG_DRILL_PROMPTS} from './game/waves/RigDrill';
import {TRANSFORMATIVE_AUGMENT_IDS,type AugmentId} from './game/abilities/augmentCatalog';
import {EARLY_LOCKER} from './game/roguelike/economy';
import {ROOM_TEMPLATES} from './game/roguelike/roomTemplates';
import {stageCoverLesson,type CoverLesson} from './game/waves/CoverLesson';
import {segmentIntersectsRect} from './game/input/aimAssist';
import {ROCKET_ARM_DISTANCE} from './game/combat/catalog';
import {AWAKENING_DRILL} from './game/waves/authoredEncounters';
import {BOSS_BODIES,guardianRadius} from './game/enemies/bossDefinitions';
import {SERVICE_IDS,serviceCost,serviceStock,availableAugmentUpgrades,GUARDIAN_ROUTE_DEPTH,GUARDIAN_ROUTES,GUARDIAN_SUPPLIES,fieldWorkshopDepth,detourOffers,type ServiceId,type DetourChoice} from './game/roguelike/economy';
import {upgradeBuildAugment} from './game/roguelike/builds';
import {markExpeditionAllocation,recordExpeditionPurchase} from './game/roguelike/expedition';
import {DIFFICULTIES,difficultyId,incomingDamageLimit,latePressureProgress,type DifficultyId} from './game/difficulty';
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
import {EnemySystem,type EnemyEvent,type EnemySpawnOptions} from './game/enemies/EnemySystem';
import {QueenBossSystem,type QueenBossEvent} from './game/enemies/QueenBossSystem';
import {ENEMIES,enemyBodyRadius} from './game/enemies/catalog';
import type {StandardEnemyId} from './game/enemies/types';
import {PickupSystem} from './game/pickups/PickupSystem';
import {EncounterDirector,type EncounterEvent} from './game/waves/EncounterDirector';
import {FacilityNavigation} from './game/world/FacilityNavigation';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot} from './game/world/expeditionGeometry';
import {rerollExpedition,createExpedition,completeExpeditionRoom,claimExpeditionMutation,claimExpeditionResources,chooseExpeditionRoute,defeatExpedition,restoreExpedition,type Expedition,type ExpeditionStartOptions} from './game/roguelike/expedition';
import {progressionFor} from './game/roguelike/progression';
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
export type GameEffect={planReaction?:true;selfBlast?:{distance:number;radius:number};incomingSource?:IncomingDamageOrigin['source'];encounterCue?:'flank'|'crossfire'|'priority'|'escort-broken'|'pincer-broken';cueX?:number;cueY?:number;meleeShape?:MeleeStrikeShape;dangerWeight?:'low';sourceX?:number;sourceY?:number;ability?:AbilityEvent;damage?:number;lethal?:boolean;source?:DamageSource;impulse?:number;contact?:'damage'|'armor'|'blocked';rocketUnarmed?:true;wall?:{x:number;y:number};shotId?:string;type:'ability'|'wall-slam'|'shot'|'hit'|'corpse'|'explosion'|'acid'|'hurt'|'pickup'|'sync-corpse'|'ambush'|'enemy-attack'|'enemy-warning'|'boon';boon?:BoonEffect;elements?:readonly ('ice'|'poison'|'fire')[];x:number;y:number;id?:number;vx?:number;vy?:number;radius?:number;weapon?:WeaponId;family?:StandardEnemyId;elite?:boolean;angle?:number;targetId?:number;targetX?:number;targetY?:number;durationMs?:number};
export type GameInput={x:number;y:number;fire:boolean;angle:number|null;autoAim:boolean;aimPoint?:{x:number;y:number}|null};
export type Bullet={sourceX?:number;sourceY?:number;visualMuzzle?:{x:number;y:number;z:number;distance:number};x:number;y:number;life:number;kind:'player'|'grenade'|'hazard';request:ProjectileRequest;tracker:ProjectileHitTracker;hitReceipt?:{hit:boolean}};
export type Pool={id:number;x:number;y:number;radius:number;life:number;warning:number;damage:number;tick:number};
const IDLE:GameInput={x:0,y:0,fire:false,angle:null,autoAim:false};
const SPITTER_PROJECTILE_RADIUS=ENEMY_ATTACK_SHAPES.spitterProjectileRadius;
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
 private platedLessonTarget:number|undefined;
 private promptedWeapons=0;
 private weaponLesson:{weapon:'plasma'|'rocket';target:number;until:number}|undefined;
 private coverLesson:CoverLesson|undefined;
 private readonly stagedCover=new Set<CoverLesson['cover']>();
 private departures=new Map<number,{ms:number;escort:boolean;breach:{x:number;y:number}}>();
 private cleanupElapsed=0;
 private breakAnnounced=false;
 private broodPodsDestroyed=0;
 private director:EncounterDirector;private mutations:MutationRuntime;private pending:Array<{type:StandardEnemyId;x:number;y:number;elite:boolean;delay:number;guardian?:'warden'|'matron';options?:EnemySpawnOptions;attempts?:number}>=[];private clearRequested=false;private bossSlow=1;private hurtCooldown=0;private heavyHitGrace=0;private recentHits:{at:number;damage:number}[]=[];private emergencyUsed=false;private poolId=0;private suppressSave=false;
 constructor(readonly emit:(e:GameEffect)=>void=()=>{},readonly storage:StorageLike|null=null){
  if(!storage)this.checkpointState='unavailable';
  this.expedition=createExpedition(1729,this.combat.getRunResources());this.node=this.findNode();this.geometry=createExpeditionGeometry(this.node);this.navigation=new FacilityNavigation(this.geometry);this.enemies=this.makeEnemies();this.director=this.makeDirector();this.mutations=this.makeMutations();this.abilities=this.makeAbilities();this.abilities.setRig('breacher');Object.assign(this.player,this.geometry.playerSpawn);
 }
 private findNode(){return generateRun(this.expedition.run.seed,this.expedition.run.version).nodes.find(n=>n.id===this.expedition.run.currentNodeId)!;}
 private roomStartCredits=0;
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
  return new EncounterDirector({seed:this.expedition.run.seed,node:this.node,difficulty:this.difficulty,runStructure:this.expedition.run.runStructure,holdUntilMs:hold?45000:0,brood:this.condition?.id==='brood',guardianRoute:this.expedition.run.guardianRoute,junctions:this.expedition.run.junctions,salvage:this.expedition.run.detour?.depth===this.node.depth&&this.expedition.run.detour.choice==='salvage',breaches,breachIds:breaches.map(b=>b.id)});
 }
 private makeEnemies(){return new EnemySystem({spitWindupMs:this.condition?.id==='dark'?650:500,slick:p=>this.roomCondition?.slick(p)??false,difficulty:()=>{
  const mode=this.difficulty,d=DIFFICULTIES[mode];
  const lateWindups=Math.round(d.windups*(1+(d.lateWindups-1)*latePressureProgress(this.node.depth,mode,this.expedition.run.version===3)))/d.windups;
  return {...d,lateWindups};
 },openingWindup:this.node.depth===0?1.5:1,lateDifficulty:this.node.depth>=10,canSeePlayer:(a,b)=>hasClearExpeditionShot(this.geometry,a,b),launched:id=>this.mutations?.isLaunched(id)??false,immovables:()=>{const q=this.boss.snapshot;return q.active?[{x:q.x,y:q.y,radius:92,health:q.health},...q.nests.map(n=>({x:n.x,y:n.y,radius:28,health:n.health}))]:[];},balance:progressionFor(this.node),wardenOpeningAim:this.expedition.run.version===3?(enemy,player)=>wardenOpeningAim(this.geometry,enemy,player):undefined,canCommit:(enemy,player,others)=>this.director.canCommit(enemy,player,others),canAttack:(a,b)=>(a.type==='spitter'?canTraverseExpedition(this.geometry,a,b,SPITTER_PROJECTILE_RADIUS):hasClearExpeditionShot(this.geometry,a,b))&&!this.abilities?.blocksMovement(a,b,0),canMove:c=>canTraverseExpedition(this.geometry,{x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius)&&!this.abilities?.blocksMovement({x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius),route:(e,p)=>this.navigation.waypoint(e,p,1)});}
 private makeMutations(){return new MutationRuntime(this.combat,{player:()=>this.player,targets:()=>this.targets(),damage:(id,n,source)=>this.damage(id,n,undefined,source??'boon'),move:(id,x,y)=>this.shoveEnemy(id,x,y),moveCorpse:(t,x,y)=>{const m=this.moveCorpse(t,x,y);this.presentation.push({type:'sync-corpse',id:t.id,x:m.x,y:m.y});return m;},setSlow:(id,m)=>{if(id>0)this.enemies.setSlow(id,m);else if(id===-1)this.bossSlow=Math.max(.65,m);},launchCollision:(from,target,wall)=>{if(this.roomCondition?.slick(from)||this.roomCondition?.slick(target))this.damage(target.id,wall?12:6,undefined,'boon');},canAffect:(a,b)=>hasClearExpeditionShot(this.geometry,a,b),boonEffect:(boon,x,y,targetX,targetY,radius,durationMs)=>this.presentation.push({type:'boon',boon,x,y,targetX,targetY,radius,durationMs}),wallSlam:(from,to,impulse)=>{const c=wallContact(this.geometry,from,to,from.radius);this.presentation.push({type:'wall-slam',x:c.x,y:c.y,wall:c.normal,targetId:from.id,vx:to.x-from.x,vy:to.y-from.y,impulse});},effect:(x,y,radius)=>this.presentation.push({type:'explosion',x,y,radius})});}
 private abilityPulseDamage=0;
 private makeAbilities(){return new AbilitySystem({roomDepth:()=>this.node.depth,enabled:()=>this.status==='playing',overdriveRoomLimit:()=>this.expedition.run.version===3&&this.node.depth!==9&&this.node.depth!==19?1:Infinity,placementRevision:()=>this.geometry,dashDistanceScale:p=>this.roomCondition?.slick(p)?1.5:1,chainThrough:(a,b)=>this.roomCondition?.condition.id==='conduit'&&this.roomCondition.zones.some(z=>onConditionZone(a,z)&&onConditionZone(b,z))||false,advance:ms=>this.mutations.update(ms),player:()=>this.player,targets:()=>this.targets(),visible:(a,b)=>hasClearExpeditionShot(this.geometry,a,b),traverse:(a,b,r)=>canTraverseExpedition(this.geometry,a,b,r),movePlayer:(dx,dy)=>{const p=this.moveCorpse(this.player,dx,dy);this.player.x=p.x;this.player.y=p.y;},damage:(target,n)=>{const r=this.damage(target.id,n,undefined,'ability');this.abilityPulseDamage+=r.damage;if(r.died)this.mutations.kill(target,'direct');return r.died;},statuses:id=>this.mutations.statuses(id),consumeBurn:id=>this.mutations.consumeBurn(id),impede:t=>this.mutations.impedeWithFire(t),status:(t,k,n)=>this.mutations.applyAbilityStatus(t,k,n),launch:(t,x,y)=>this.mutations.launchAbility(t,x,y),arc:(t,others)=>this.mutations.abilityArc(t,others),has:id=>this.combat.hasMutation(id),upgraded:id=>this.expedition.build.augmentUpgrades?.includes(id)??false,reload:()=>{if(this.combat.instantReload())this.mutations.completedReload(this.player);},emit:(ability,x,y)=>{const measured=ability.targetIds&&['tick','impact','burst','link','dash-end'].includes(ability.phase);const totalDamage=measured?this.abilityPulseDamage:undefined;if(measured)this.abilityPulseDamage=0;this.observeRigDrill(ability);this.presentation.push({type:'ability',ability:totalDamage===undefined?ability:{...ability,totalDamage},x,y});}});}
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
 private gatePads:{x:number;y:number}[]=[];
 private relayBanks:{x:number;y:number}[]=[];
 private relayBank:{x:number;y:number}|undefined;
 get floorControls(){
  if(this.status!=='playing'&&this.status!=='paused')return [];
  const pincer=this.encounter.pincer;
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
   return pads.map((point,index)=>({...point,id:breaches[index],kind:'gate' as const,radius:28}));
  }
  if(this.crossingRequired&&!this.relayBank)
   return [...this.relayBanks.map((point,index)=>({...point,id:String(index),kind:'bank' as const,radius:68})),
    {...this.siegePoint,id:'failed-bank',kind:'failed-bank' as const,radius:220}];
  return [];
 }
 get closedFlank(){return this.director.closedFlank;}
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
   remainingMs:this.siegeBeat===encounter.beat?this.siegeRemainingMs:12000,crossing,choosing:crossing&&!this.relayBank};
 }
 private tickFloorObjectives(ms:number){
  for(const pad of this.floorControls){
   if(pad.kind==='failed-bank')continue;
   if(Math.hypot(pad.x-this.player.x,pad.y-this.player.y)>pad.radius)continue;
   if(pad.kind==='gate'){
    if(this.director.closeFlank(pad.id))this.presentation.push({type:'boon',boon:'shield',x:pad.x,y:pad.y});
   }else this.relayBank=pad;
   break;
  }
  const siege=this.siege;
  if(!siege)return;
  if(this.siegeBeat!==siege.beat){this.siegeBeat=siege.beat;this.siegeRemainingMs=12000;this.relayBank=undefined;}
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
 private enterRoom(start=true){this.roomStartCredits=this.combat.snapshot.credits;this.usedContractMedkit=false;this.dodgeDrill=null;this.rigDrill=null;this.departures.clear();this.coverLesson=undefined;this.lastAbilityReady={};this.abilitySampleAt=-Infinity;this.deathReadySlot=undefined;this.platedLessonTarget=undefined;this.promptedWeapons=0;this.weaponLesson=undefined;this.stagedCover.clear();this.cleanupElapsed=0;this.breakAnnounced=false;this.lastPriorityPoint=undefined;this.broodPodsDestroyed=0;this.broodCollapse=undefined;this.siegeBeat=-1;this.siegeRemainingMs=12000;this.relayBank=undefined;this.roomDamageLedger.clear();this.presentation.flush();this.presentation.reset();this.abilityPulseDamage=0;this.storySkipped=false;this.aimPoint=null;this.mutations.reset();this.abilities.resetRoom();this.combat.setOverclock(false);this.node=this.findNode();this.runStats.enterRoom(this.node.id);this.geometry=createExpeditionGeometry(this.node);this.navigation=new FacilityNavigation(this.geometry);this.prepareSiegePoint();
 this.gatePads=this.node.templateId==='safety-interlock-station'?floorChoicePair(this.geometry,this.geometry.playerSpawn,p=>this.navigation.reachable(p),64,128):[];
 this.relayBanks=this.node.templateId==='overload-floor'?floorChoicePair(this.geometry,this.siegePoint,p=>this.navigation.reachable(p),304,496):[];
 const condition=this.condition;this.roomCondition=condition?new RoomConditionRuntime(condition,this.geometry,this.expedition.run.seed+this.node.depth):null;this.enemies=this.makeEnemies();this.boss.reset();this.bossSlow=1;this.pickups.reset(this.expedition.run.seed+this.node.depth);this.bullets=[];this.pools=[];this.pending=[];this.clearRequested=false;this.emergencyUsed=false;this.hurtCooldown=0;this.heavyHitGrace=0;this.recentHits=[];this.mutations=this.makeMutations();this.director=this.makeDirector();this.combat.setBuild(this.expedition.build);this.combat.setWave(this.node.depth+1);Object.assign(this.player,this.geometry.playerSpawn,{angle:0,moving:false,vx:0,vy:0});this.roomRevision++;this.status='playing';
 if(this.expedition.run.version===3&&this.difficulty==='story'&&this.node.depth===11&&this.combat.snapshot.health<50){
  const entrance=this.moveCorpse({...this.player,radius:14},48,0);
  this.pickups.spawn('health',35,entrance.x,entrance.y);
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
 canPurchaseService(purchase:ServiceId,augment?:string){
  if(this.status!=='reward'||this.expedition.run.phase!=='reward'||!['healing','supplies'].includes(this.node.reward)||this.combat.snapshot.dead||!SERVICE_IDS.includes(purchase))return false;
  if(!serviceStock(this.expedition.run,purchase)||this.combat.snapshot.credits<serviceCost(purchase,this.node.depth))return false;
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
  if((purchase==='upgrade'&&!upgrade)||!this.canPurchaseService(purchase,augment))return false;
  this.allocateService();const before=this.combat.getRunResources();let build=this.expedition.build;
  if(purchase==='heal')this.combat.restoreHealth(35);
  else if(purchase==='armor')this.combat.restoreArmor(30);
  else if(purchase==='ammo')this.combat.refillShopAmmo();
  else if(purchase==='route-ammo'&&this.expedition.run.guardianRoute){
   const supply=GUARDIAN_SUPPLIES[this.expedition.run.guardianRoute];
   this.combat.grantRouteAmmo(supply.weapon,supply.rounds);
  }
  else if(purchase==='medkit')this.combat.restoreRunResources({...before,medkits:Math.min(6,before.medkits+1)});
  else if(purchase==='grenade')this.combat.addGrenades(2);
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
  if(!lesson||this.elapsed>=lesson.until)return undefined;
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
 get encounterObjective(){if(this.status!=='playing')return '';if(this.escortExitOpen)return 'Exit open · escorts retreating';if(this.dodgeDrill)return this.dodgeDrill.confirmation>0?'Punished · 20 CR':(this.dodgeDrill.caught?'Practice strike — no damage. Step across the red edge sooner, then shoot the recovering body.':'Bonus drill · 20 CR — Step across the red edge, then shoot the recovering body.');if(this.rigDrill)return this.rigDrill.won?'Augment demonstrated · 15 CR':RIG_DRILL_PROMPTS[this.rigDrill.augment]??'';if(this.coverLessonActive)return "Break the Spitter’s line of sight";if(this.director.objectiveBroken)return this.encounter.grammar==='pincer'?'PINCER BROKEN — flank sealed':'Escort is breaking';const pincer=this.encounter.pincer;if(this.floorControls.some(pad=>pad.kind==='gate'))return 'Step onto either control to seal that flank';if(pincer?.state==='staging')return `Flank massing · ${Math.ceil(pincer.remainingMs/1000)}s to break the screen`;if(pincer?.state==='open')return 'Flank gate open';const siege=this.siege;if(siege){if(siege.choosing)return 'Relay bank failing · Cross to either backup';if(siege.remainingMs<=0)return 'Relay charged — clear the remaining attackers.';return `${Math.hypot(this.player.x-siege.x,this.player.y-siege.y)<=siege.radius?'Hold':'Reach'} the exit relay: ${Math.ceil(siege.remainingMs/1000)}s charge remaining.`;}const brood=this.broodInterruption;if(brood)return brood.canceled?`BROOD INTERRUPTED — ${brood.canceled} arrivals stopped`:'BROOD INTERRUPTED — punish the Matron';const threats=this.enemies.snapshot.enemies;if(threats.some(enemy=>enemy.champion==='warden'&&(enemy.stunRemainingMs??0)>0))return 'Warden stunned by the wall — punish the opening.';if(threats.some(enemy=>enemy.champion==='matron'&&(enemy.broodRemainingMs??0)>0))return 'Matron is brooding — focus fire to interrupt.';if(threats.some(enemy=>enemy.pod))return 'Destroy the brood pods before they hatch.';const encounter=this.director.snapshot;if((encounter.canceledReinforcements??0)>0&&!(encounter.lullRemainingMs??0))return `Reinforcements stopped · ${encounter.canceledReinforcements} arrivals canceled`;return (encounter.lullRemainingMs??0)>0?`Regroup · next wave in ${Math.ceil(encounter.lullRemainingMs!/1000)}s`:(encounter.beatLabel??'');}
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
 private targetCache:MutationTarget[]|null=null;private targetSnapshot:unknown;
 targets():MutationTarget[]{const snapshot=this.enemies.snapshot;if(!this.boss.snapshot.active&&this.targetCache&&this.targetSnapshot===snapshot)return this.targetCache;this.targetSnapshot=snapshot;const a:MutationTarget[]=snapshot.enemies.map(e=>({id:e.id,x:e.x,y:e.y,radius:e.radius,health:e.health,maxHealth:e.maxHealth,resistant:this.expedition.run.version===3?!!e.controlResistant:e.elite||!!e.champion}));const q=this.boss.snapshot;if(q.active){a.push({id:-1,x:q.x,y:q.y,radius:92,health:q.health,maxHealth:q.maxHealth,immovable:true});for(const n of q.nests)a.push({id:-100-n.id,x:n.x,y:n.y,radius:28,health:n.health,maxHealth:n.maxHealth,immovable:true});}this.targetCache=a;return a;}
 private spawn(type:StandardEnemyId,x:number,y:number,elite=false,guardian?:'warden'|'matron',options:EnemySpawnOptions={}){
  const radius=guardianRadius(guardian,enemyBodyRadius(type,elite)),origin=options.podOrigin;
  if(guardian==='warden'&&this.expedition.run.version===3){
   const stage=wardenOpeningSpawn(this.geometry,this.player,Math.atan2(y-this.player.y,x-this.player.x),this.enemies.snapshot.enemies);
   if(stage){x=stage.x;y=stage.y;}
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
   if(Math.hypot(p.x-this.player.x,p.y-this.player.y)>radius+this.player.radius+(options.pod?0:options.lesson||guardian==='warden'?20:80)&&canOccupyExpedition(this.geometry,p,radius)){
    const result=this.enemies.spawn(type,p.x,p.y,elite,options);if(result.spawned){
     if(guardian)this.enemies.promote(result.enemy.id,guardian);
     if(this.node.templateId==='passenger-vault'&&options.lesson==='brute'){
      this.platedLessonTarget=result.enemy.id;
      this.enemies.stagger(result.enemy.id,3200);
      this.startWeaponLesson('plasma',result.enemy.id);
     }
    }
    return result.spawned;
   }
  }
  return false;
 }

 private encounterEvents(events:readonly EncounterEvent[]){for(const e of events){if(e.type==='spawn-request'){const chosen=this.geometry.breaches.find(b=>b.id===e.breachId)??this.geometry.breaches[0];
 let x=chosen.x+(chosen.facing==='east'?56:-56),y=chosen.y;
 let openingVolley:EnemySpawnOptions['openingVolley'];
 if(e.enemyId==='spitter'&&(!this.coverLesson||this.coverLesson.learned)){
  const covers=(ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles??[]).filter(rect=>!this.stagedCover.has(rect));
  const lesson=stageCoverLesson(this.geometry,covers,this.player);
  if(lesson){
   this.coverLesson=lesson;
   this.stagedCover.add(lesson.cover);
   ({x,y}=lesson.shooter);
   if(this.node.templateId==='transmission-chamber'&&e.spawnId.endsWith('spawn-0'))openingVolley=lesson.pickup;
   const pickup=lesson.pickup;
   if(this.node.depth<=2)this.pickups.spawn('armor',15,pickup.x,pickup.y);
   else this.pickups.spawn('credits',60,pickup.x,pickup.y);
  }
 }
 if(e.lesson){
  const distance=e.lesson==='brute'?215:e.lesson==='crawler'?90:100;
  const offsets=e.lesson==='brute'?[0,.2,-.2,.35,-.35,.5,-.5,1,-1]:[0,.5,-.5,1,-1];
  const legal=offsets.map(offset=>{
   const angle=this.player.angle+offset;
   return {x:this.player.x+Math.cos(angle)*distance,y:this.player.y+Math.sin(angle)*distance};
  }).filter(point=>canOccupyExpedition(this.geometry,point,enemyBodyRadius(e.enemyId,e.elite))&&hasClearExpeditionShot(this.geometry,this.player,point));
  const cover=ROOM_TEMPLATES[this.node.templateId]?.incidentObstacles??[];
  const nearCover=e.lesson==='brute'?legal.find(point=>cover.some(rect=>
   Math.hypot(Math.max(rect.x-point.x,0,point.x-rect.x-rect.width),Math.max(rect.y-point.y,0,point.y-rect.y-rect.height))<55)):undefined;
  const point=nearCover??legal[0];
  if(point)({x,y}=point);
 }
 const guardian=e.guardian??(this.expedition.run.version!==3&&progressionFor(this.node).guardian&&e.spawnId.endsWith('spawn-0')?(progressionFor(this.node).guardianKind??undefined):undefined);
 this.pending.push({type:guardian?(guardian==='matron'?'carrier':'brute'):e.enemyId,x,y,elite:e.elite,delay:650,guardian,options:{openingVolley,healthScale:e.healthScale,role:e.role,priority:e.priority,controlResistant:e.controlResistant,beat:e.beat,lesson:e.lesson}});this.presentation.push({type:'enemy-warning',x,y,radius:38,durationMs:650,encounterCue:e.grammar==='interception'&&e.role==='flanker'?'flank':e.grammar==='crossfire'&&e.role==='ranged'?'crossfire':undefined,cueX:chosen.x,cueY:chosen.y});}else if(e.type==='boss-start')this.boss.start(this.geometry.bossSpawn.x,this.geometry.bossSpawn.y);else if(e.type==='room-clear'){if(this.node.kind==='boss')this.clearRequested=true;else if(!this.startAwakeningDrill())this.clearRoom();}}}
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
 private clearRoom(){if(this.combat.snapshot.dead||this.expedition.run.phase!=='combat')return;this.dodgeDrill=null;this.collectLoot(true);if(this.condition?.id==='brood')this.awardCredits(Math.round(Math.max(0,this.combat.snapshot.credits-this.roomStartCredits)*.3));if(this.node.depth===7&&(this.expedition.run.guardianRoute||this.expedition.run.junctions?.[3]==='salvage'))this.awardCredits(35);if(this.node.depth===GUARDIAN_ROUTE_DEPTH&&this.expedition.run.guardianRoute){this.combat.restoreHealth(35);this.combat.restoreArmor(25);}if(this.difficulty==='story'&&this.node.depth===2)this.combat.restoreHealth(35);if(this.expedition.run.detour?.depth===this.node.depth&&this.expedition.run.detour.choice==='salvage'){if(this.node.depth===15)this.awardCredits(160);if(this.node.depth===18)this.abilities.addCharge(24000);}this.settleContract();this.expedition=completeExpeditionRoom(this.expedition,this.combat.getRunResources());this.bullets=[];this.pools=[];this.pending=[];this.enemies.reset();this.abilities.resetRoom();this.combat.setOverclock(false);this.player.moving=false;this.status=this.expedition.run.phase==='complete'?'complete':'reward';if(this.status==='complete'){this.rememberExpedition();if(this.storyRoom){this.combat.applyDamage(1000000);this.expedition=Object.freeze({...this.expedition,resources:this.combat.getRunResources()});this.presentation.push({type:'explosion',x:this.player.x,y:this.player.y,radius:900});}this.discardCheckpoint();}else this.save();}
 private enemyEvents(events:readonly EnemyEvent[]){for(const e of events){if(this.roomCondition?.condition.id==='dark'&&(e.type==='attack-warning'||e.type==='melee-warning'||e.type==='contact-attack'||e.type==='hazard-attack'))this.roomCondition.openedAttacks.add(e.enemyId);if(e.type==='death'){if(e.priority&&e.beat!==undefined){this.lastPriorityPoint={x:e.x,y:e.y};this.director.reportPriorityDefeated(e.beat);}const training=this.rigDrill?.ids.includes(e.enemyId);if(!training){this.kills++;this.runStats.recordKill(e.enemyType);}const reward=training?0:Math.max(1,Math.round(e.reward*.15));const retreating=this.departures.get(e.enemyId)?.escort;const credits=retreating?Math.floor(reward/2):reward;this.runStats.recordCredits(credits);this.combat.setCredits(this.combat.snapshot.credits+credits);if(!retreating&&!training)this.pickups.rollEnemyDrop(e.enemyType,e.x,e.y);this.presentation.push({type:'corpse',encounterCue:e.priority?'priority':undefined,id:e.enemyId,x:e.x,y:e.y,vx:e.impulse?.x??0,vy:e.impulse?.y??0,family:e.enemyType,elite:e.elite});}else if(e.type==='contact-attack'&&this.dodgeDrill?.id===e.enemyId){const drill=this.dodgeDrill;drill.caught=(drill.caught??0)+1;if(drill.caught>=3&&!drill.confirmation)this.clearRoom();}else if(e.type==='contact-attack'){const attacker=this.enemies.getSnapshot(e.enemyId);this.hurt(e.damage,attacker??undefined,{source:e.attack==='charge'?'enemy-charge':'enemy-contact',enemyFamily:e.enemyType},attacker?.champion); }else if(e.type==='melee-warning'){this.presentation.push({type:'enemy-warning',id:e.enemyId,family:e.enemyType,x:e.x,y:e.y,angle:e.angle,meleeShape:e.shape,dangerWeight:'low',durationMs:e.durationMs});}else if(e.type==='melee-strike'){const drill=this.dodgeDrill;if(drill?.id===e.enemyId)drill.evaded=drill.entered&&!meleeStrikeContains(e.shape,e.x,e.y,e.angle,this.player.x,this.player.y,this.player.radius);this.presentation.push({type:'enemy-attack',id:e.enemyId,family:e.enemyType,x:e.x,y:e.y,angle:e.angle,meleeShape:e.shape,dangerWeight:'low'});}else if(e.type==='spawn-request')this.pending.push({type:e.enemyType,x:e.x,y:e.y,elite:e.elite,delay:450,options:{pod:e.pod,hatchMs:e.hatchMs,beat:e.beat,...(e.pod?{podOrigin:this.enemies.getSnapshot(e.sourceEnemyId)??{x:e.x,y:e.y}}:{})}});else if(e.type==='attack-warning'){if(e.enemyType==='carrier')this.broodPodsDestroyed=0;this.presentation.push({type:'enemy-warning',id:e.enemyId,family:e.enemyType,x:e.x,y:e.y,targetX:e.targetX,targetY:e.targetY,durationMs:e.durationMs,radius:32});}else if(e.type==='hazard-attack'){const angle=Math.atan2(e.targetY-e.sourceY,e.targetX-e.sourceX);this.presentation.push({type:'enemy-attack',id:e.enemyId,family:'spitter',x:e.sourceX,y:e.sourceY,angle});this.bullets.push({sourceX:e.sourceX,sourceY:e.sourceY,x:e.sourceX,y:e.sourceY,life:ENEMY_ATTACK_SHAPES.spitterProjectileLife,kind:'hazard',request:{weaponId:'plasma',damage:e.damage,speed:ENEMY_ATTACK_SHAPES.spitterProjectileSpeed,radius:SPITTER_PROJECTILE_RADIUS,angle,penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});}}}
 private queenEvents(events:readonly QueenBossEvent[]){for(const e of events){if(e.type==='minion-spawn-request'&&this.enemies.activeCount+this.pending.length<20)this.pending.push({type:'crawler',x:e.x,y:e.y,elite:false,delay:650});else if(e.type==='area-attack'){this.presentation.push({type:'enemy-attack',id:-1,x:this.boss.snapshot.x,y:this.boss.snapshot.y});this.presentation.push({type:'acid',x:e.x,y:e.y,radius:e.radius});if(Math.hypot(this.player.x-e.x,this.player.y-e.y)<e.radius+16)this.hurt(e.damage,{x:e.x,y:e.y},{source:'boss-attack',enemyFamily:'queen'});this.pools.push({id:++this.poolId,x:e.x,y:e.y,radius:e.radius*.75,life:2,warning:0,damage:6,tick:.5});}else if(e.type==='nest-destroyed')this.presentation.push({type:'explosion',x:e.x,y:e.y,radius:64});else if(e.type==='queen-defeated'){this.presentation.push({type:'explosion',x:e.x,y:e.y,radius:240});this.encounterEvents(this.director.reportBossDefeated());}}}
 observeWeaponDamage?: (weapon: WeaponId, family: string, damage: number, lethal: boolean) => void;
 damage(id:number,amount:number,impulse?:{x:number;y:number},source:DamageSource='weapon',feedback=true,weapon?:WeaponId){const target=this.targets().find(t=>t.id===id),frozen=target?this.mutations.statuses(id).frozen:false;this.targetCache=null;let applied=false,died=false,absorbedByArmor=0,damage=0;
  const drill=this.dodgeDrill;
  const practicing=drill?.id===id;
  if(practicing&&(!drill.evaded||this.enemies.getSnapshot(id)?.meleePhase!=='recovery'))return {applied:false,died:false,absorbedByArmor:0,damage:0};
  if(id>0){const before=this.enemies.getSnapshot(id);const condition=this.roomCondition;
   let ambush=false;
   if(before&&!before.pod&&condition?.condition.id==='dark'&&!condition.ambushed.has(id)&&source!=='status'){
    condition.ambushed.add(id);
    if(!condition.openedAttacks.has(id)){amount*=1.3;ambush=true;}
   }
   const slickImpulse=target&&impulse&&before&&condition?.slick(before)?impulse:undefined;
   const r=this.enemies.applyDamage(id,amount,slickImpulse?undefined:impulse);
   if(ambush&&before&&r.applied)this.presentation.push({type:'ambush',x:before.x,y:before.y,id});
   if(target&&slickImpulse&&r.applied&&!r.died){
    const magnitude=Math.hypot(slickImpulse.x,slickImpulse.y);
    const scale=magnitude?4*Math.min(magnitude,120)/magnitude:0;
    this.mutations.launchAbility(target,slickImpulse.x*scale,slickImpulse.y*scale);
   }
   if(r.died&&condition?.eggs.delete(id)&&!condition.eggs.size&&!condition.broodLost)this.director.cancelNextReinforcements();
   if(before?.champion==='matron'&&!r.died&&before.broodRemainingMs&& !this.enemies.getSnapshot(id)?.broodRemainingMs)this.interruptBrood(id,before.beat);
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
  if(applied&&damage>0){this.runStats.recordDamage(source,damage);this.abilities.addCharge(damage*DIFFICULTIES[this.difficulty].overdrive*(this.node.depth>=10?DIFFICULTIES[this.difficulty].lateOverdrive:1),died?DIFFICULTIES[this.difficulty].overdrive*(this.node.depth>=10?DIFFICULTIES[this.difficulty].lateOverdrive:1):0);if(feedback&&target)this.reportDamage({type:'hit',weapon,angle:impulse?Math.atan2(impulse.y,impulse.x):undefined,contact:absorbedByArmor>0?'armor':'damage',x:target.x,y:target.y,targetId:id,damage,lethal:died,source});if(died&&target)this.abilities.onKill(target,frozen);}
  return{applied,died,absorbedByArmor,damage};
 }
 /** Native attacks carry typed sources; direct unattributed damage also serves opt-in UI fixtures. */
 private updateHitGrace(damage:number){
  if(damage>20+1e-7){this.heavyHitGrace=2;this.recentHits=[];return;}
  if(this.difficulty==='veteran'||this.heavyHitGrace>0||damage<=0)return;
  this.recentHits=this.recentHits.filter(hit=>this.elapsed-hit.at<=1.5);
  this.recentHits.push({at:this.elapsed,damage});
  if(this.recentHits.reduce((total,hit)=>total+hit.damage,0)>=30){this.heavyHitGrace=2;this.recentHits=[];}
 }
 hurt(amount:number,origin?:{x:number;y:number;radius?:number},source:IncomingDamageOrigin={source:'unknown'},guardian?:'warden'|'matron'){if(this.status!=='playing'||this.abilities.invulnerable||this.hurtCooldown>0||!Number.isFinite(amount)||amount<=0)return;this.hurtCooldown=.22;const armorBefore=this.combat.snapshot.armor,healthBefore=this.combat.snapshot.health;let incoming=Math.min(amount*DIFFICULTIES[this.difficulty].damage,source.source==='unknown'||source.source==='scripted'||source.source==='self-blast'?Infinity:incomingDamageLimit(this.difficulty,source.enemyFamily??'unknown'));if(this.heavyHitGrace>0&&source.source==='enemy-contact'&&['crawler','stalker','spitter'].includes(source.enemyFamily??''))incoming*=.25;const received=this.combat.applyDamage(incoming*this.abilities.incomingDamageMultiplier,source.source==='unknown'||source.source==='scripted'||source.source==='self-blast'?Infinity:incomingDamageLimit(this.difficulty,source.enemyFamily??'unknown'));this.updateHitGrace(received.absorbedByArmor+received.healthDamage);const firstSelfBlast=source.source==='self-blast'&&!this.stats.selfBlastDamage;this.runStats.recordDamageTaken(armorBefore+healthBefore-this.combat.snapshot.armor-this.combat.snapshot.health,source);const roomDamage=armorBefore+healthBefore-this.combat.snapshot.armor-this.combat.snapshot.health,key=source.source+':'+(guardian??source.enemyFamily??'');if(roomDamage>0){const prior=this.roomDamageLedger.get(key);this.roomDamageLedger.set(key,{...source,guardian,amount:(prior?.amount??0)+roomDamage});}if(!this.combat.snapshot.dead)this.mutations.hurt(armorBefore,this.combat.snapshot.armor,this.player);if(!this.emergencyUsed&&!this.combat.snapshot.dead&&this.combat.snapshot.health<30&&this.combat.build.mutations.includes('emergency-plating')){this.emergencyUsed=true;this.combat.restoreArmor(20);this.presentation.push({type:'boon',boon:'shield',x:this.player.x,y:this.player.y});}this.presentation.push({type:'hurt',x:this.player.x,y:this.player.y,incomingSource:source.source,...(firstSelfBlast&&roomDamage>0&&origin?.radius?{selfBlast:{distance:Math.hypot(this.player.x-origin.x,this.player.y-origin.y),radius:origin.radius}}:{}),...(origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)?{sourceX:origin.x,sourceY:origin.y}:{})});if(this.combat.snapshot.dead&&this.node.depth===19&&this.expedition.run.finaleRevive){
  const {finaleRevive:revive,...run}=this.expedition.run;
  this.combat.restoreRunResources({...this.combat.getRunResources(),health:45});
  this.expedition=Object.freeze({...this.expedition,run:Object.freeze(run)});
  this.heavyHitGrace=2;this.presentation.push({type:'boon',boon:'shield',x:this.player.x,y:this.player.y});
 }if(this.combat.snapshot.dead){
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
   const n=calculateSplashDamage(b.request.damage*multiplier,distance,b.request.splashRadius);if(this.abilities.ignitingShots)this.mutations.applyAbilityStatus(t,'burn',1);const r=this.damage(t.id,n,{x:(t.x-b.x)/(distance||1)*b.request.knockback,y:(t.y-b.y)/(distance||1)*b.request.knockback},'weapon',true,b.kind==='player'?b.request.weaponId:undefined);if(r.applied){if(b.kind==='player'&&++rocketHits===2)this.completeWeaponLesson(2);if(b.hitReceipt&&!b.hitReceipt.hit){b.hitReceipt.hit=true;this.runStats.recordShotHit();}this.mutations.hit(cause.chainId,b.request.weaponId,t,{x:(t.x-b.x)/(distance||1),y:(t.y-b.y)/(distance||1)},b.request.primed);if(r.died)this.mutations.kill(t,'direct',cause);}}}
 private updateBullets(dt:number,previousTargets:ReadonlyMap<number,{x:number;y:number}>=new Map(),hostileScale=this.abilities.hostileTimeScale){const shotRadii=new Map(this.enemies.snapshot.enemies.map(e=>[e.id,e.champion==='matron'?e.radius:enemyShotRadius(e.type,e.elite)]));for(const b of [...this.bullets]){if(this.status!=='playing')break;const bulletDt=dt*(b.kind==='hazard'?hostileScale:1);b.life-=bulletDt;const dx=Math.cos(b.request.angle)*b.request.speed*bulletDt,dy=Math.sin(b.request.angle)*b.request.speed*bulletDt;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/7));let done=false;for(let i=0;i<steps&&!done;i++){
   const from={x:b.x,y:b.y},next={x:b.x+dx/steps,y:b.y+dy/steps};const barrierBlocked=b.kind==='hazard'&&this.abilities.interceptProjectile(from,next,b.request.radius,b.request.damage);if(barrierBlocked){done=true;break;}const wallBlocked=!canTraverseExpedition(this.geometry,from,next,b.request.radius);if(wallBlocked&&b.kind!=='player'){
    const lesson=this.coverLesson;
    const r=b.request.radius;
    if(b.kind==='hazard'&&lesson&&!lesson.learned&&b.sourceX!==undefined&&b.sourceY!==undefined
      &&(lesson.solids.some(solid=>segmentIntersectsRect(from,next,{x:solid.x-r,y:solid.y-r,width:solid.width+2*r,height:solid.height+2*r}))
        ||Math.hypot(Math.max(0,lesson.cover.x-next.x,next.x-lesson.cover.x-lesson.cover.width),
          Math.max(0,lesson.cover.y-next.y,next.y-lesson.cover.y-lesson.cover.height))<=42)
      &&segmentIntersectsRect({x:b.sourceX,y:b.sourceY},this.player,lesson.cover))lesson.learned=true;if(b.kind==='grenade'){b.request={...b.request,speed:0};break;}if(b.request.splashRadius)this.blast(b);else this.presentation.push({type:'hit',x:b.x,y:b.y,angle:b.request.angle,weapon:b.request.weaponId});done=true;break;}b.x=next.x;b.y=next.y;
   if(b.kind==='hazard'){if(Math.hypot(b.x-this.player.x,b.y-this.player.y)<b.request.radius+16){this.presentation.push({type:'acid',x:b.x,y:b.y,angle:b.request.angle});this.hurt(b.request.damage,Number.isFinite(b.sourceX)&&Number.isFinite(b.sourceY)?{x:b.sourceX!,y:b.sourceY!}:undefined,{source:'enemy-projectile',enemyFamily:'spitter'});done=true;}continue;}if(b.kind==='grenade')continue;
   const contacts=this.targets().map(t=>{const radius=shotRadii.get(t.id)??t.radius;const previous=previousTargets.get(t.id)??t,mx=t.x-previous.x,my=t.y-previous.y;
    const start={x:from.x-previous.x-mx*i/steps,y:from.y-previous.y-my*i/steps},end={x:next.x-previous.x-mx*(i+1)/steps,y:next.y-previous.y-my*(i+1)/steps};
    return {t,entry:sweptCircle(start,end,{x:0,y:0},radius+b.request.radius)};}).filter(c=>c.entry!==null&&hasClearExpeditionShot(this.geometry,from,c.t)&&canTraverseExpedition(this.geometry,from,{x:from.x+(next.x-from.x)*c.entry,y:from.y+(next.y-from.y)*c.entry},b.request.radius)).sort((a,b)=>a.entry!-b.entry!);
   for(const {t,entry} of contacts){const hit=b.tracker.hit(t.id);if(!hit.applied)continue;if(b.request.splashRadius){b.x=from.x+(next.x-from.x)*entry!;b.y=from.y+(next.y-from.y)*entry!;this.blast(b);done=true;break;}const direction={x:Math.cos(b.request.angle),y:Math.sin(b.request.angle)};if(this.abilities.ignitingShots)this.mutations.applyAbilityStatus(t,'burn',1);const r=this.damage(t.id,this.weaponImpactDamage(b,t.id),{x:direction.x*b.request.knockback,y:direction.y*b.request.knockback},'weapon',false,b.request.weaponId);this.presentation.push({type:'hit',contact:r.applied?(r.absorbedByArmor>0?'armor':'damage'):'blocked',x:from.x+(next.x-from.x)*entry!,y:from.y+(next.y-from.y)*entry!,angle:b.request.angle,weapon:b.request.weaponId,targetId:t.id,...(r.applied?{damage:r.damage,lethal:r.died,source:'weapon' as const}:{})});if(b.request.weaponId==='plasma'&&r.absorbedByArmor>0&&!this.enemies.getSnapshot(t.id)?.armor){
    this.completeWeaponLesson(1);
    if(t.id===this.platedLessonTarget&&!r.died){
     this.enemies.stagger(t.id,1100);
     this.presentation.push({type:'boon',boon:'shield',x:t.x,y:t.y,targetId:t.id});
    }
   }if(b.request.weaponId==='rifle'&&t.id===this.platedLessonTarget&&r.absorbedByArmor>0&&!r.died&&this.enemies.getSnapshot(t.id)?.armor)this.startWeaponLesson('plasma',t.id);if(r.applied){if(b.hitReceipt&&!b.hitReceipt.hit){b.hitReceipt.hit=true;this.runStats.recordShotHit();}}const shot=b.request.mutationShotId??this.combat.nextMutationEventId('hit');if(r.applied){this.mutations.hit(shot,b.request.weaponId,t,direction,b.request.primed);if(r.died)this.mutations.kill(t,'direct',{chainId:shot,depth:0});}if(hit.exhausted){done=true;break;}}
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
   if(enemy.priority)continue;
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

 private updateStep(deltaMs:number,input:GameInput){if(this.status!=='playing')return;if(!Number.isFinite(deltaMs))return;const ms=Math.min(50,Math.max(0,deltaMs)),dt=ms/1000;const weaponOverclock=this.abilities.overclocked,hostileMs=this.abilities.hostileDelta(ms),hostileScale=ms?hostileMs/ms:1;this.presentation.update(ms);this.runStats.update(ms,this.expedition.run.currentNodeId);this.elapsed+=dt;if(this.elapsed-this.abilitySampleAt>=.1)this.sampleAbilityReadiness();this.heavyHitGrace=Math.max(0,this.heavyHitGrace-dt);this.hurtCooldown=Math.max(0,this.hurtCooldown-dt);const length=Math.max(1,Math.hypot(input.x,input.y));const speed=this.roomCondition?.marineStagger?0:220;this.roomCondition?.advance(ms);if(input.aimPoint!==undefined)this.aimPoint=input.aimPoint;this.abilities.setIntent(input.x,input.y,this.aimPoint);const frameX=this.player.x,frameY=this.player.y;const moved=this.conditionWalk(input.x/length*speed*this.abilities.moveSpeedMultiplier,input.y/length*speed*this.abilities.moveSpeedMultiplier,dt);this.player.vx=dt?(moved.x-this.player.x)/dt:0;this.player.vy=dt?(moved.y-this.player.y)/dt:0;this.player.moving=Math.hypot(this.player.vx,this.player.vy)>3;this.player.x=moved.x;this.player.y=moved.y;this.tickFloorObjectives(ms);
  if(input.angle!==null&&Number.isFinite(input.angle))this.player.angle=input.angle;else if(input.autoAim){const q=this.boss.snapshot,target=this.targets().filter(t=>(t.id!==-1||q.vulnerable)&&Math.hypot(t.x-this.player.x,t.y-this.player.y)<(this.condition?.id==='dark'?CONDITION_LIGHT_RADIUS:720)&&hasClearExpeditionShot(this.geometry,this.player,t)).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0];if(target)this.player.angle=Math.atan2(target.y-this.player.y,target.x-this.player.x);}
  this.feedbackBatch=true;try{this.abilities.update(ms);}finally{this.flushFeedback();}this.player.vx=dt?(this.player.x-frameX)/dt:0;this.player.vy=dt?(this.player.y-frameY)/dt:0;this.player.moving=Math.hypot(this.player.vx,this.player.vy)>3;this.syncOverclock(weaponOverclock);if(this.status!=='playing')return;
  const reloadBefore=this.combat.snapshot;this.combat.regenerateReserves(ms);this.combat.update(ms,input.fire);if(reloadBefore.reloading&&!this.combat.snapshot.reloading&&this.combat.snapshot.magazine>reloadBefore.magazine)this.mutations.completedReload(this.player);if(input.fire){const shots=this.combat.fire(this.player.angle);if(shots.length){this.runStats.recordShot();const hitReceipt={hit:false};this.presentation.push({type:'shot',x:this.player.x,y:this.player.y,weapon:shots[0].weaponId,angle:this.player.angle});for(const request of shots)this.bullets.push({sourceX:this.player.x,sourceY:this.player.y,x:this.player.x,y:this.player.y,life:2,kind:'player',request,hitReceipt,tracker:new ProjectileHitTracker(request.penetration)});}}this.combat.reloadIfEmpty();
  const previousTargets=new Map(this.targets().map(t=>[t.id,{x:t.x,y:t.y}]));
  if(this.rigDrill&&this.elapsed>=this.rigDrill.until)this.finishRigDrill();
  this.updateCleanup(ms);this.navigation.prepare(this.player,1);this.enemyEvents(this.enemies.update(hostileMs,this.player));this.updateRoomCondition(ms);if(this.status!=='playing')return;this.updateAwakeningDrill(ms);if(this.status!=='playing')return;this.queenEvents(this.boss.update(hostileMs*this.bossSlow,this.player,this.enemies.activeCount+this.pending.length));this.updateBullets(dt,previousTargets,hostileScale);if(this.status!=='playing')return;
  for(const pool of this.pools){pool.life-=hostileMs/1000;pool.tick-=hostileMs/1000;if(pool.tick<=0){pool.tick=.5;if(Math.hypot(pool.x-this.player.x,pool.y-this.player.y)<pool.radius+16)this.hurt(pool.damage,pool,{source:'acid-pool',enemyFamily:'queen'});}}this.pools=this.pools.filter(p=>p.life>0);if(this.status!=='playing')return;
  this.pickups.update(ms,this.player,{magnetEnabled:true,magnetRange:familyBonuses(this.combat.build).recovery?144:120});this.collectLoot();
  for(let i=this.pending.length-1;i>=0;i--){const p=this.pending[i];p.delay-=hostileMs;if(p.delay>0)continue;if(this.spawn(p.type,p.x,p.y,p.elite,p.guardian,p.options))this.pending.splice(i,1);else if((p.attempts=(p.attempts??0)+1)>40){/* I13: exhausted annulus requests retire so a blocked brood cannot jam room clear. */if(p.options?.podOrigin){this.pending.splice(i,1);continue;}const open=this.openBreaches;const point=open[p.attempts%open.length];p.x=point.x+(point.facing==='east'?56:-56);p.y=point.y;}}
  this.lookForWeaponLessons();
  if(!this.rigDrill)this.encounterEvents(this.director.update(ms,this.enemies.activeCount-[...this.departures.values()].filter(departure=>departure.escort).length+this.enemies.reservedCount+this.pending.reduce((n,p)=>n+(p.type==='carrier'?4:1),0),(this.siege?.remainingMs??0)<=0,this.player));if(this.clearRequested&&(!this.escortExitOpen||Math.hypot(this.player.x-this.geometry.exitPoint.x,this.player.y-this.geometry.exitPoint.y)<=64)){this.clearRequested=false;this.clearRoom();}this.syncOverclock();
 }
}
