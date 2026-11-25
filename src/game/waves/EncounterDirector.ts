import {meleeStrikeContains} from '../enemies/meleeAttacks';
import {WARDEN_WALL_STUN_MS,type EnemyCommitment} from '../enemies/EnemySystem';
import {ENEMY_FAMILY_SCALE} from '../enemies/catalog';
import type {DetourChoice} from '../roguelike/economy';
import {storyBeats,storyOpening,openingBeat,openingRoll,DETOUR_BEATS,type EncounterGrammar,type EnemyRole,type Consequence,type Cleanup} from './authoredEncounters';
import {DIFFICULTIES,latePressureProgress,type DifficultyId} from '../difficulty';
import type { StandardEnemyId } from '../enemies/types';
import type { RunNode } from '../roguelike/types';
import { generateRun } from '../roguelike/run';
import {progressionFor} from '../roguelike/progression';
import {I5_ENCOUNTER_TUNING_ENABLED} from '../roguelike/i5Tuning';

export type EncounterPlayerPose=Readonly<{x:number;y:number;angle:number}>;
export type EncounterPhase = 'idle' | 'combat' | 'boss' | 'complete' | 'dead';
export type EncounterSpawn = Readonly<{
  type: 'spawn-request'; spawnId: string; atMs: number; wave: number;
  enemyId: StandardEnemyId; elite: boolean; breachId: string;
  healthScale?:number;beat?:number;grammar?:EncounterGrammar;role?:EnemyRole;priority?:boolean;controlResistant?:boolean;guardian?:'warden'|'matron';lesson?:'crawler'|'brute'|'stalker';afterHeavyRecovery?:true;rehearsalFlank?:true;reinforcement?:boolean;reserve?:true;shutterSpitter?:true;openingExchange?:true;approachLeadMs?:number;hatchDelayMs?:number;
}>;
export type ReserveCut = Readonly<{
  type:'reserve-cut';breachId:string;count:number;family:StandardEnemyId;closedEntry?:string;
}>;
export type EncounterEvent = EncounterSpawn | ReserveCut
  | Readonly<{ type: 'room-start'; nodeId: string; depth: number; wave: number }>
  | Readonly<{ type: 'boss-start' }>
  | Readonly<{ type: 'room-clear'; nodeId: string; wave: number }>
  | Readonly<{ type: 'defeat' }>;
export type EncounterOptions = Readonly<{ seed: number; node: RunNode; difficulty?:DifficultyId;salvage?:boolean;runStructure?:1;guardianRoute?:GuardianRoute;holdUntilMs?:number;brood?:boolean;junctions?:Readonly<Partial<Record<number,DetourChoice>>>;breaches?:readonly {id:string;x:number;y:number}[]; breachIds: readonly string[] }>;
export type EncounterPlan = Readonly<{
  nodeId: string; kind: RunNode['kind']; wave: number; totalSpawns: number;
  concurrentCap: number; schedule: readonly EncounterSpawn[]; openingName?:string;
  beats?:readonly Readonly<{grammar:EncounterGrammar;label:string;lullMs:number;start:number;end:number;consequence?:Consequence;cleanup?:Cleanup;recallAfterLunge?:true;rehearseHeavy?:true}>[];
}>;
export type PincerSnapshot = Readonly<{
  state: 'staging' | 'sealed' | 'open';
  remainingMs: number;
  elapsedMs: number;
  flankers: readonly EncounterSpawn[];
}>;

export const PINCER_WINDOW_MS = 14000;

export type EncounterSnapshot = Readonly<{
  meleeLockDelays?:number; phase: EncounterPhase; elapsedMs: number; dispatched: number; remaining: number;
  reserve?: {breachId:string;remainingMs:number;leader:'Spitter'|'Brute'}; pincer?: PincerSnapshot; beatRemaining?: number; totalSpawns: number; concurrentCap: number;beat?:number;grammar?:EncounterGrammar;beatLabel?:string;lullRemainingMs?:number;canceledReinforcements?:number;
}>;

import {GUARDIAN_ROUTE_DEPTH,GUARDIAN_ROUTES,type GuardianRoute} from "../roguelike/economy";

function authoredPlan(options:EncounterOptions):EncounterPlan {
 const {node}=options,mode=options.difficulty??'standard',d=DIFFICULTIES[mode];
 const lateWaves=1+(d.lateWaves-1)*latePressureProgress(node.depth,mode,true);
 const source=[...storyBeats(node.depth,mode==='story')];
 const opening=options.runStructure?storyOpening(options.seed,node.depth,mode==='story',options.junctions?.[node.depth]==='salvage',options.junctions):undefined;
 if(opening&&node.depth>=3){
  const [beat]=source.splice(opening.index,1);
  source.unshift(openingBeat(node.depth,opening.index,beat,mode==='story'));
 }
 const shutterOpening=node.templateId==='relay-racks';
 const coverOpening=node.templateId==='transmission-chamber';
 if(coverOpening){
  const index=source.findIndex(beat=>beat.grammar==='siege');
  if(index>0)source.unshift(...source.splice(index,1));
  source[0]={...source[0],label:'Use the relay receiver as cover'};
 }
 const galleryOpening=node.templateId==='diagnostic-gallery';
 const shaftLanding=node.templateId==='service-shaft-landing';
 if(shutterOpening){
  const index=source.findIndex(beat=>beat.groups.some(group=>group.guardian==='warden'));
  if(index>0)source.unshift(...source.splice(index,1));
 }
 if(galleryOpening){
  const index=source.findIndex(beat=>beat.grammar==='interception');
  if(index>=0){
   const [beat]=source.splice(index,1);
   source.unshift({...beat,label:'Cut back around the recorder and return fire'});
  }
 }
 const route=node.depth===GUARDIAN_ROUTE_DEPTH?options.guardianRoute:undefined;
 if(route){
  const index=source.findIndex(beat=>beat.groups.some(group=>group.guardian==='warden'));
  if(index>=0){
   const [beat]=source.splice(index,1);
   source.unshift(route==='brood'?{
    ...beat,label:'Rocket the hatching pods',consequence:'brood',
    groups:beat.groups.map(group=>group.guardian==='warden'?{...group,guardian:'matron',family:'carrier'}:group),
   }:{...beat,label:'Break the Warden’s armour with plasma'});
  }
 }
 // Resolve one readable interception before admitting its screen.
 if(node.depth===9||node.depth===13){
  const index=source.findIndex(beat=>beat.groups.some(group=>group.role==='flanker'&&!group.reinforcement));
  if(index>=0){
   const beat=source[index],flank=beat.groups.find(group=>group.role==='flanker'&&!group.reinforcement)!;
   const groups=beat.groups.flatMap(group=>group!==flank?[group]:group.count>1?[{...group,count:group.count-1}]:[]);
   source.splice(index,1,{grammar:'interception',label:'Read the lunge from cover',lullMs:900,recallAfterLunge:true,
    groups:[{...flank,count:1}]},{...beat,groups});
  }
 }
 // Keep the contract in Coolant Plant and reserve Relay Racks for its shutter.
 // Book only one guardian beyond the Plant, with a different final demand
 // from the seeded Armory appointment.
 const plantKind=options.guardianRoute==='brood'?'matron':'warden';
 const armoryKind=plantKind==='matron'?'warden':'matron';
 const finalDepth=plantKind==='warden'?-1:openingRoll(options.seed,15)%2===0?15:18;
 const finalKind='matron';
 const booked=node.depth===5?armoryKind:node.depth===8?'warden':
  node.depth===GUARDIAN_ROUTE_DEPTH?plantKind:node.depth===finalDepth?finalKind:undefined;
 const extra=options.salvage?DETOUR_BEATS[node.depth]:undefined;
 if(extra)source.push(extra);
 for(let index=0;index<source.length;index++){
  const beat=source[index];
  if(!beat.groups.some(group=>group.guardian))continue;
  const guardian=beat===extra?undefined:booked;
  if(guardian===beat.groups.find(group=>group.guardian)?.guardian)continue;
  source[index]={...beat,
   label:guardian==='warden'?'Bait the Warden into a wall':guardian==='matron'?'Break the Matron brood pods':'Break the escort before reinforcements',
   consequence:guardian==='matron'?'brood':guardian?undefined:'leader',
   groups:beat.groups.map(group=>group.guardian?{...group,
    family:guardian==='warden'?'brute':'carrier',guardian}:group),
  };
 }
 const broodReserve=options.brood&&!source.some(beat=>beat.groups.some(group=>group.reinforcement))
  ?source.at(-1)?.groups.find(group=>!group.guardian&&!group.lesson&&!group.priority):undefined;
 const veteranLate=mode==='veteran'&&node.depth>=10;
 const standardFinalAct=mode==='standard'&&node.depth>=14;
 const arrivalSpacing=node.depth===9&&options.junctions?.[7]==='salvage'?1.1:veteranLate?.58:standardFinalAct?DIFFICULTIES.standard.finalActArrivalSpacing:1;
 let state=(options.seed^Math.imul(node.depth+1,0x9e3779b9))>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};
 const positions=options.breaches;const center=positions?.length?{x:positions.reduce((n,p)=>n+p.x,0)/positions.length,y:positions.reduce((n,p)=>n+p.y,0)/positions.length}:null;
 const ids=center&&positions?[...options.breachIds].sort((a,b)=>{const pa=positions.find(p=>p.id===a),pb=positions.find(p=>p.id===b);return pa&&pb?Math.atan2(pa.y-center.y,pa.x-center.x)-Math.atan2(pb.y-center.y,pb.x-center.x):0;}):options.breachIds,rotation=Math.floor(random()*ids.length),schedule:EncounterSpawn[]=[];
 const reserveLeader=node.templateId==='coolant-plant'?'spitter':node.templateId==='infested-workshop'?'brute':undefined;
 if(reserveLeader==='spitter'){
  const pincer=source.findIndex(beat=>beat.grammar==='pincer');
  if(pincer>=0)source.push(...source.splice(pincer,1));
 }
 const reserveBeat=source.findIndex(beat=>reserveLeader==='spitter'?beat.grammar==='crossfire':reserveLeader==='brute'&&beat.grammar==='interception');
 // Freight Hold already uses a split pincer. In the other early sectors,
 // pick a featured actor from the existing exchanges without adding bodies.
 const exchangeFamilies=['stalker','brute','stalker','brute',undefined,'stalker','brute','spitter'] as const;
 const exchangeFamily=mode==='standard'?exchangeFamilies[node.depth-2]:undefined;
 const exchangeBeat=exchangeFamily?source.findIndex(beat=>beat.groups.some(group=>
  group.family===exchangeFamily&&!group.guardian&&!group.reinforcement)):-1;
 const beats=source.map((beat,beatIndex)=>{
  const start=schedule.length;let marked=false;
  for(const group of beat.groups){
   const baseCount=group.guardian?1:group.lesson||group.priority||node.depth<4?group.count:Math.max(1,Math.round(group.count*d.waves*lateWaves));
   // Later Story and Standard firing lanes retain one more ranged threat.
   // Earlier teaching beats are unchanged.
   const extraRanged=group.family==='spitter'&&node.depth>=10&&(options.difficulty==='story'||options.difficulty==='standard');
   const standardFinaleEscort=mode==='standard'&&node.depth===19&&beat.grammar==='siege'&&group.role==='screen';
   const originalCount=baseCount+(extraRanged?1:0)+(standardFinaleEscort?1:0);
   // Keep isolated lessons, paired firing lanes and short flanks intact.
   // Large single-family groups take fewer slots at the same body-area budget.
   const scale=ENEMY_FAMILY_SCALE[group.family];
   const count=originalCount>=4&&scale>1?Math.round(originalCount/(scale*scale)):originalCount;
   const healthScale=originalCount/count;
   const reinforcement=group.reinforcement||group===broodReserve;
   for(let index=0;index<count;index++){
    // Keep the roster size while interleaving ranged threats with the screen.
    const rangedSupport=veteranLate&&group.family==='crawler'&&!group.lesson&&!group.priority&&index%6===5;
    const family=rangedSupport?'spitter':group.family,role=rangedSupport?'ranged':group.role;
    const ordinal=schedule.length-start;
    const elite=!group.lesson&&node.depth>1&&(!!group.guardian||random()<Math.min(.28,(node.depth>=10?.21:.06+node.depth*.012)*d.elites));
    const resistant=!marked&&(!!group.guardian||elite&&!!group.priority);
    if(resistant)marked=true;
    const side=reserveLeader==='spitter'&&beat.grammar==='pincer'?ordinal%2:role==='flanker'?1+index%Math.max(1,ids.length-1):role==='ranged'?(index%2?Math.floor(ids.length/2):0):beat.grammar==='pincer'?(ordinal%2?Math.floor(ids.length/2):0):0;
    const breachId=ids[(rotation+beatIndex+side+(node.depth<3?opening?.index??0:0)+(group.guardian?beat.breachOffset??0:0))%ids.length];
    const shaftOpening=shaftLanding&&beatIndex===0;
    const rehearsalFlank=beat.rehearseHeavy&&group.role==='flanker'&&index===0;
    const reserveHeavy=beat.rehearseHeavy&&group.role==='anchor'&&index>0;
    schedule.push(Object.freeze({type:'spawn-request',spawnId:`${node.id}:spawn-${schedule.length}`,atMs:reinforcement?(beat.consequence==='brood'?11000:beat.consequence==='pincer'?PINCER_WINDOW_MS:group===broodReserve?10500:4500)+index*650:650+ordinal*450*arrivalSpacing+(reserveHeavy?2500:0)+(shaftOpening&&ordinal>0?2800:0)+(coverOpening&&beatIndex===0&&ordinal>0?4000:0),wave:node.depth+1,enemyId:family,elite,breachId,beat:beatIndex,grammar:beat.grammar,role,healthScale,priority:group.priority??false,controlResistant:resistant,...(group.guardian?{guardian:group.guardian}:{}),...(group.lesson?{lesson:group.lesson}:{}),...(beat.rehearseHeavy&&(group.role==='flanker'||reserveHeavy)?{afterHeavyRecovery:true as const}:{}),...(rehearsalFlank?{rehearsalFlank:true as const}:{}),reinforcement:!!reinforcement}));
   }
  }
  // Reinforcements are late arrivals even when their group precedes another authored group.
  const arrivals=schedule.splice(start);
  if(beatIndex===exchangeBeat){
   const lead=arrivals.findIndex(request=>request.enemyId===exchangeFamily&&!request.guardian&&!request.reinforcement);
   if(lead>=0){
    const request=arrivals[lead];
    arrivals[lead]=Object.freeze({...request,openingExchange:true,elite:request.elite||node.depth===3,
     healthScale:(request.healthScale??1)*(node.depth===2?2.2:node.depth===3?1.45:1)});
    const partner=exchangeFamily==='stalker'?arrivals.findIndex((other,index)=>
     index!==lead&&other.enemyId==='stalker'&&!other.reinforcement):-1;
    if(partner>=0){
     const other=arrivals[partner];
     arrivals[partner]=Object.freeze({...other,openingExchange:true,atMs:request.atMs+850,approachLeadMs:450});
    }
   }
  }
  if(shaftLanding&&beatIndex===0&&
    arrivals[0]?.enemyId==='stalker'&&arrivals[1]?.enemyId==='stalker'){
   const early=arrivals[0].atMs+100;
   arrivals[1]=Object.freeze({...arrivals[1],atMs:early,approachLeadMs:arrivals[1].atMs-early+250});
  }
  if(shaftLanding){
   const protectedArrivals=beatIndex===0?2:1;
   const pincerDelay=beat.grammar==='pincer'?1200:0;
   for(let index=protectedArrivals;index<arrivals.length;index++){
    const request=arrivals[index];
    arrivals[index]=Object.freeze({...request,atMs:request.atMs+pincerDelay+(index-protectedArrivals+1)*300});
   }
  }
  if(galleryOpening&&beatIndex===0){
   const flank=arrivals.findIndex(request=>request.enemyId==='stalker');
   if(flank>0){
    const [request]=arrivals.splice(flank,1);
    arrivals.splice(1,0,Object.freeze({...request,atMs:arrivals[0].atMs+450}));
   }
   for(let index=2;index<arrivals.length;index++){
    const request=arrivals[index];
    arrivals[index]=Object.freeze({...request,atMs:request.atMs+2400});
   }
  }
  if(beatIndex===reserveBeat){
   const leader=arrivals.findIndex(request=>request.enemyId===reserveLeader);
   const screen=arrivals.filter((request,index)=>index!==leader&&
     request.role===(reserveLeader==='spitter'?'screen':'flanker'));
   const reserve=screen.slice(-Math.ceil(screen.length/3));
   if(leader>=0&&reserve.length){
    arrivals[leader]=Object.freeze({...arrivals[leader],priority:true});
    reserve.forEach((request,index)=>{
     arrivals[arrivals.indexOf(request)]=Object.freeze({...request,reinforcement:true,reserve:true,
      breachId:reserve[0].breachId,atMs:9500+index*650});
    });
   }
  }
  if(node.templateId==='relay-racks'&&arrivals.some(request=>request.guardian==='warden')){
   const escort=arrivals.findIndex(request=>request.enemyId==='crawler');
   if(escort>=0){
    const warden=arrivals.find(request=>request.guardian==='warden')!;
    arrivals[escort]=Object.freeze({...arrivals[escort],enemyId:'spitter',role:'ranged',
      atMs:warden.atMs+450,reinforcement:false,shutterSpitter:true});
   }
  }
  schedule.push(...arrivals.sort((a,b)=>a.atMs-b.atMs));
  return Object.freeze({grammar:beat.grammar,label:beat.label,lullMs:beat.lullMs,start,end:schedule.length,consequence:beat.consequence,recallAfterLunge:beat.recallAfterLunge,rehearseHeavy:beat.rehearseHeavy,cleanup:beat.cleanup??(beat.recallAfterLunge?undefined:node.depth>0?(beat.grammar==='siege'?'withdraw':'rush'):undefined)});
 });
 const concurrentBonus=veteranLate?3:standardFinalAct?DIFFICULTIES.standard.finalActConcurrentBonus:0;
 const concurrentCap=Math.min(12+concurrentBonus,6+Math.floor(node.depth/3)+concurrentBonus);
 return Object.freeze({nodeId:node.id,kind:node.kind,wave:node.depth+1,totalSpawns:schedule.length,concurrentCap,schedule:Object.freeze(schedule),beats:Object.freeze(beats),...(opening?{openingName:shutterOpening?'Bait the ram into the rack shutter':coverOpening?'Use the relay receiver as cover':galleryOpening?'Cut back around the recorder':route?`${GUARDIAN_ROUTES[route].name} · ${GUARDIAN_ROUTES[route].banner}`:opening.name}:{})});
}

export function createEncounterPlan(options: EncounterOptions): EncounterPlan {
  const canonical = generateRun(options.seed,options.node.id.includes(':v3-')?3:options.node.id.includes(':v2-')?2:1).nodes.find(node => node.id === options.node.id);
  if (!canonical || canonical.kind !== options.node.kind || canonical.depth !== options.node.depth
    || canonical.templateId !== options.node.templateId) throw new Error('Encounter node does not belong to this seed.');
  const { node, breachIds } = options;
  if (!Array.isArray(breachIds) || breachIds.length > 8
    || breachIds.some(id => typeof id !== 'string' || !id.trim() || id.length > 160)
    || new Set(breachIds).size !== breachIds.length) throw new Error('Invalid encounter breach IDs.');
  const combat = node.kind === 'combat' || node.kind === 'elite';
  if (combat && breachIds.length === 0) throw new Error('Combat encounters need at least one breach.');
  if(node.id.includes(':v3-')&&combat)return authoredPlan(options);
  const story=node.id.includes(':v3-'),tuning=story&&I5_ENCOUNTER_TUNING_ENABLED,holdout=story&&(node.depth===9||node.depth===19);
  const guardian=progressionFor(node).guardianKind;
  const extraSpawns=tuning?(node.depth===0?16:node.depth===1?4:node.depth===2?10:node.depth<5?6:node.depth>=10?16:node.depth>=2&&node.kind==='combat'&&!guardian?2:0):0;
  // L8 measured these four authored approaches after geometry-first trials.
  // Keep those additional requests while B10 applies its cadence to the whole wave.
  const architectureSpawns=tuning&&['transmission-chamber','diagnostic-gallery','safety-interlock-station','shielding-gate'].includes(node.templateId)?2:0;
  const tuningDifficulty=DIFFICULTIES[options.difficulty??'standard'];
  const originalTotalSpawns = combat ? story ? holdout ? (node.depth===9?32:48)+architectureSpawns : 12+Math.round(node.depth*.7)+(node.kind==='elite'?5:0)+extraSpawns+architectureSpawns : Math.round((12 + node.depth * 3 + (node.kind === 'elite' ? 5 : 0))*(node.id.includes(':v2-')?1.25:1)) : 0;
  const totalSpawns=Math.max(0,Math.round(originalTotalSpawns*tuningDifficulty.waves*(node.depth>=10?tuningDifficulty.lateWaves:1))-(node.depth===0?2:0));
  const pressureAct=story?Math.floor(node.depth/5):0;
  // Experimental brood-free mixes have no three-child reservations: normalize their live-body pressure.
  const concurrentCap = combat ? Math.min(tuning?(node.depth>=10?15:20):18, (tuning&&node.depth<5?10:7) + Math.floor(node.depth * .8) + (node.kind === 'elite' ? 2 : 0)+(tuning&&!holdout?Math.min(2,pressureAct):0)) : 0;
  let randomState = (options.seed ^ Math.imul(node.depth + 1, 0x9e3779b9) ^ (node.kind === 'elite' ? 0xabc123 : 0)) >>> 0;
  const random = (): number => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let value = Math.imul(randomState ^ (randomState >>> 15), randomState | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
  const pool: readonly StandardEnemyId[] = tuning&&node.depth>=5&&node.depth!==9 ? node.depth<10
    ? ['crawler','crawler','spitter','spitter','stalker','carrier']
    : ['crawler','crawler','crawler','crawler','crawler','crawler','crawler','brute','spitter','spitter','spitter','stalker','stalker','carrier']
    : node.depth === 0 ? tuning ? ['crawler', 'crawler', 'crawler', 'crawler', 'crawler', 'crawler', 'brute'] : ['crawler', 'crawler', 'crawler', 'brute']
    : node.depth < 4 ? ['crawler', 'crawler', 'brute', 'spitter']
    : node.depth < 8 ? ['crawler','crawler','spitter','stalker','carrier']
    : ['crawler', 'crawler', 'brute', 'spitter', 'spitter', 'stalker', 'carrier'];
  const interval = Math.max(430,1050-node.depth*48-(node.kind==='elite'?120:0));
  const lateEliteScale=node.depth>=10?tuningDifficulty.lateElites:1;
  const eliteChance=tuning&&node.depth>=10?.60+(node.depth-10)*.01:.14+(node.depth-5)*.018;
  // Later four-body pulses leave a readable reset between arrivals. Pressure
  // comes from mixed angles and sustained waves, rather than an elite firing wall.
  let openingBrutes = 0;
  const scheduledFamily = (index: number): StandardEnemyId => {
    const family = index===0&&guardian ? guardian==='matron'?'carrier':'brute' : node.kind==='elite'&&index===0?'brute':pool[Math.floor(random()*pool.length)];
    if (tuning&&node.depth===0&&family==='brute'&&++openingBrutes>2) return 'crawler';
    return family;
  };
  // Teach with four widely spaced opening enemies; later waves retain native timing.
  const nativeArrival=(index:number)=>story ? 650+(holdout?index*(node.depth===9?1500:900):tuning?node.depth<5?Math.floor(index/6)*3000+(index%6)*300:Math.floor(index/4)*4000+(index%4)*350:Math.floor(index/6)*1100+(index%6)*100) : 650 + index * interval + Math.floor(index/8)*1800;
  const schedule = Array.from({ length: totalSpawns }, (_, index): EncounterSpawn => Object.freeze({
    type: 'spawn-request', spawnId: `${node.id}:spawn-${index}`, atMs: node.depth===0?(index<4?1000+index*1600:7400+nativeArrival(index+2)-nativeArrival(6)):nativeArrival(index), wave: node.depth + 1,
    enemyId: scheduledFamily(index),
    elite: tuning ? node.kind==='elite' ? index===0||random()<(node.depth>=10?eliteChance:.10+node.depth*.008)*lateEliteScale : node.depth>=5&&node.depth!==9&&(random()<eliteChance*tuningDifficulty.elites*lateEliteScale||index===0&&!!guardian) : node.kind==='elite'&&(index===0||random()<(.10+node.depth*.008)*lateEliteScale),
    breachId: breachIds[Math.floor(random() * breachIds.length)],
  }));
  return Object.freeze({ nodeId: node.id, kind: node.kind, wave: node.depth + 1, totalSpawns, concurrentCap,
    schedule: Object.freeze(schedule) });
}

const EMPTY: readonly EncounterEvent[] = Object.freeze([]);
const events = (...values: EncounterEvent[]): readonly EncounterEvent[] => Object.freeze(values.map(value => Object.freeze(value)));

/** Pure deterministic domain director: no Phaser, timers, wall-clock, or callbacks.
 * Host occupiedCount MUST include active enemies, child reservations, and pending
 * spawn commands. Keep failed commands pending; dropping them can falsely clear a room.
 */
export class EncounterDirector {
  readonly plan: EncounterPlan;
  readonly returnShotBeat: number;
  private readonly pincerFlanks = new Map<number, readonly EncounterSpawn[]>();
  private readonly breaches:readonly {id:string;x:number;y:number}[];
  private holdUntilMs=0;
  private skipReinforcements=false;
  private skippedReinforcementBeat=-1;
  private closedFlankId:string|undefined;
  get closedFlank(){return this.closedFlankId;}
  closeFlank(breachId:string):boolean {
    const pincer=this.snapshot.pincer;
    if(this.closedFlankId||pincer?.state!=='staging'||!pincer.flankers.some(flank=>flank.breachId===breachId))return false;
    this.closedFlankId=breachId;
    return true;
  }
  private currentPhase: EncounterPhase = 'idle';
  private elapsedMs = 0;
  private dispatched = 0;
  private coolantEntry?:string;private interruptedBrood=false;private beatIndex=0;private beatElapsedMs=0;private lullRemainingMs=0;private clearingBeat=false;private defusedBeats=new Set<number>();private usedFlankerBreaches=new Set<string>();private canceledReinforcements=0;private broken=false;

  private readonly coolantPlant:boolean;
  private readonly withdrawLateScreen: boolean;
  private readonly tokens: {meleeTokens:number;rangedTokens:number};
  constructor(options: EncounterOptions) {
    this.plan = createEncounterPlan(options);
    this.coolantPlant=options.node.templateId==='coolant-plant';
    this.returnShotBeat=(options.node.templateId==='communal-atrium'||options.node.templateId==='diagnostic-gallery')&&options.difficulty!=='veteran'
      ? this.plan.beats?.findIndex(beat=>{
        const arrivals=this.plan.schedule.slice(beat.start,beat.end);
        return arrivals.some(enemy=>enemy.enemyId==='brute'&&enemy.role==='anchor')&&
          arrivals.some(enemy=>enemy.enemyId==='crawler'||enemy.enemyId==='stalker'||enemy.enemyId==='spitter');
      })??-1 : -1;
    this.withdrawLateScreen=options.difficulty==='standard'&&options.node.depth>=10;
    this.tokens=DIFFICULTIES[options.difficulty??'standard'];
    this.holdUntilMs=options.holdUntilMs??0;
    this.breaches=options.breaches??[];
    this.plan.beats?.forEach((beat,index)=>{
      if(beat.consequence==='pincer')this.pincerFlanks.set(index,Object.freeze(this.plan.schedule.slice(beat.start,beat.end)
        .filter(request=>request.reinforcement&&request.role==='flanker')));
    });
  }
  private readonly delayedLocks=new Set<number>();
  meleeLockDelays=0;
  canCommit(enemy:EnemyCommitment,player:{x:number;y:number},others:Iterable<EnemyCommitment>,attack:'melee'|'ranged'|'charge',
    sidestep?:{radius:number;attempting?:boolean;clear:(point:{x:number;y:number})=>boolean;cover?:(point:{x:number;y:number},others:Iterable<EnemyCommitment>)=>boolean}):boolean {
    const active:EnemyCommitment[]=[];
    let melee=0,ranged=0;
    let charging=false;
    for(const other of others){
      if(other.id===enemy.id)continue;
      if(other.champion==='warden'&&other.wallStunAngle!==undefined&&other.beat===enemy.beat&&!enemy.champion
        &&(other.stunRemainingMs??0)>WARDEN_WALL_STUN_MS-800&&Math.hypot(enemy.x-other.x,enemy.y-other.y)<=150)return false;
      if(sidestep&&attack==='melee'&&(other.meleePhase==='windup'||other.meleePhase==='strike'))active.push(other);
      if(other.champion){
        charging ||= other.pendingAttack==='charge'||other.chargeMs>0;
        continue;
      }
      if(other.pendingAttack==='spit')ranged++;
      if(other.meleePhase!=='approach'||other.pendingAttack==='charge'||other.chargeMs>0)
        melee+=other.type==='crawler'?.5:1;
    }
    if(active.length&&sidestep?.clear){
      const angle=Math.atan2(player.y-enemy.y,player.x-enemy.x);
      const clear=Array.from({length:16},(_,index)=>{
        const heading=angle+index*Math.PI/8;
        return {x:player.x+65*Math.cos(heading),y:player.y+65*Math.sin(heading)};
      }).some(point=>sidestep.clear(point)&&(!sidestep.cover||sidestep.cover(point,others))&&
        !meleeStrikeContains(enemy.meleeShape,enemy.x,enemy.y,angle,point.x,point.y,sidestep.radius)&&
        active.every(other=>!meleeStrikeContains(other.meleeShape,other.meleeOriginX,other.meleeOriginY,
          other.meleeAngle,point.x,point.y,sidestep.radius)));
      if(!clear){
        if(sidestep.attempting&&!this.delayedLocks.has(enemy.id)){this.delayedLocks.add(enemy.id);this.meleeLockDelays++;}
        return false;
      }
    }
    if(sidestep?.attempting)this.delayedLocks.delete(enemy.id);
    if(enemy.champion)return attack!=='charge'||melee<=this.tokens.meleeTokens-1;
    if(attack==='ranged')return ranged<this.tokens.rangedTokens;
    return melee+(enemy.type==='crawler'?.5:1)<=this.tokens.meleeTokens-Number(charging);
  }
  get rehearsalBeat(){return this.plan.beats?.[this.beatIndex]?.rehearseHeavy?this.beatIndex:undefined;}
  get phase(): EncounterPhase { return this.currentPhase; }
  get currentWave(): number { return this.plan.wave; }
  get snapshot(): EncounterSnapshot {
    const flankers = this.pincerFlanks.get(this.beatIndex);
    const pincer: PincerSnapshot | undefined = flankers ? {
      state: this.broken ? 'sealed' : this.beatElapsedMs < PINCER_WINDOW_MS ? 'staging' : 'open',
      remainingMs: Math.max(0, PINCER_WINDOW_MS - this.beatElapsedMs),
      elapsedMs: this.beatElapsedMs,
      flankers,
    } : undefined;
    const beat=this.plan.beats?.[this.beatIndex];
    const nextReserve=beat&&!this.defusedBeats.has(this.beatIndex)
      ?this.plan.schedule.slice(this.dispatched,beat.end).find(request=>request.reserve):undefined;
    const reserve=nextReserve?{breachId:nextReserve.breachId,
      remainingMs:Math.max(0,nextReserve.atMs-this.beatElapsedMs),
      leader:beat?.grammar==='crossfire'?'Spitter' as const:'Brute' as const}:undefined;
    return Object.freeze({ meleeLockDelays:this.meleeLockDelays, reserve, pincer, phase: this.currentPhase, elapsedMs: this.elapsedMs, dispatched: this.dispatched,
      remaining: this.plan.totalSpawns - this.dispatched, totalSpawns: this.plan.totalSpawns, concurrentCap: this.plan.concurrentCap,...(this.plan.beats?{beat:this.beatIndex,beatRemaining:Math.max(0,(this.plan.beats[this.beatIndex]?.end??this.dispatched)-this.dispatched),grammar:this.plan.beats[this.beatIndex]?.grammar,beatLabel:this.plan.beats[this.beatIndex]?.label,lullRemainingMs:this.lullRemainingMs,canceledReinforcements:this.canceledReinforcements}:{}) });
  }

  start(): readonly EncounterEvent[] {
    if (this.currentPhase !== 'idle') return EMPTY;
    const start: EncounterEvent = { type: 'room-start', nodeId: this.plan.nodeId, depth: this.plan.wave - 1, wave: this.plan.wave };
    if (this.plan.kind === 'boss') {
      this.currentPhase = 'boss';
      return events(start, { type: 'boss-start' });
    }
    if (this.plan.kind === 'medical' || this.plan.kind === 'armory') {
      this.currentPhase = 'complete';
      return events(start, this.clearEvent());
    }
    this.currentPhase = 'combat';
    return events(start);
  }

  update(deltaMs: number, occupiedCount: number,siegeReady=true,player?:EncounterPlayerPose,heavyRecovered=false,crawlerSlots=Infinity): readonly EncounterEvent[] {
    if (this.currentPhase !== 'combat' || !Number.isFinite(deltaMs) || deltaMs < 0
      || !Number.isSafeInteger(occupiedCount) || occupiedCount < 0) return EMPTY;
    this.elapsedMs = Math.min(Number.MAX_SAFE_INTEGER, this.elapsedMs + deltaMs);
    if(this.plan.beats)return this.updateAuthored(deltaMs,occupiedCount,siegeReady,player,heavyRecovered,crawlerSlots);
    if (this.dispatched === this.plan.totalSpawns) {
      if (occupiedCount !== 0) return EMPTY;
      this.currentPhase = 'complete';
      return events(this.clearEvent());
    }
    const batch: EncounterEvent[] = [];
    let slots = Math.max(0, this.plan.concurrentCap - occupiedCount);
    while (slots>0 && this.dispatched < this.plan.totalSpawns) {
      const request = this.plan.schedule[this.dispatched];
      const cost=request.enemyId==='carrier'?4:1;
      if (request.atMs > this.elapsedMs||cost>slots) break;
      slots-=cost;batch.push(request);
      this.dispatched += 1;
    }
    // A final batch can only clear on a later update, after host occupancy settles.
    return batch.length ? Object.freeze(batch) : EMPTY;
  }

  get objectiveBroken(){return this.broken;}
  reportBroodInterrupted(beat:number|undefined):number {
    if(beat!==this.beatIndex||this.defusedBeats.has(beat))return 0;
    const current=this.plan.beats?.[beat];
    if(current?.consequence!=='brood')return 0;
    this.defusedBeats.add(beat);
    if(this.coolantPlant)this.interruptedBrood=true;
    return this.plan.schedule.slice(this.dispatched,current.end).filter(request=>request.reinforcement).length;
  }
  resolveCleanup(live:readonly {type:StandardEnemyId;role?:EnemyRole;priority?:boolean;meleePhase?:string}[],pending:number,siegeReady:boolean):Cleanup|undefined {
    const beat=this.plan.beats?.[this.beatIndex];
    if(!beat||this.clearingBeat)return;
    if(!this.broken&&beat.consequence==='pincer'&&this.beatElapsedMs<PINCER_WINDOW_MS&&this.dispatched>beat.start
      &&this.plan.schedule.slice(this.dispatched,beat.end).every(request=>request.reinforcement)
      &&!pending&&!live.some(enemy=>enemy.role==='screen'))this.breakBeat(beat.end);
    if(this.broken)return 'withdraw';
    if(beat.recallAfterLunge&&this.dispatched===beat.end&&!pending
      &&live.some(enemy=>enemy.role==='flanker'&&enemy.meleePhase==='recovery'))return 'withdraw';
    if(this.withdrawLateScreen&&!pending&&this.dispatched===beat.end&&
      (beat.grammar!=='siege'||siegeReady)&&live.length>0&&live.length<=3&&
      live.every(enemy=>!enemy.priority&&(enemy.type==='crawler'||enemy.type==='stalker'))&&
      this.plan.schedule.slice(beat.start,beat.end).some(request=>
        request.priority||request.enemyId==='brute'||request.enemyId==='spitter'||request.enemyId==='carrier'))return 'withdraw';
    if(!pending&&this.dispatched===beat.end&&live.length<=3&&!live.some(enemy=>enemy.priority)
      &&(beat.grammar!=='siege'||siegeReady))return beat.cleanup;
  }
  private breakBeat(end:number){
    this.broken=true;
    this.canceledReinforcements+=end-this.dispatched;
    this.dispatched=end;
  }
  /** A killed priority body prevents its still-unannounced escort reinforcement. */
  reportPriorityDefeated(beat:number){
    if(beat!==this.beatIndex||this.defusedBeats.has(beat))return;
    const plan=this.plan.beats?.[beat];
    const cut=this.reserveCut(beat);
    this.defusedBeats.add(beat);
    if(plan?.consequence==='leader')this.breakBeat(plan.end);
    return cut;
  }
  private reserveCut(beat:number):ReserveCut|undefined {
    const end=this.plan.beats?.[beat]?.end??this.dispatched;
    const reserve=this.plan.schedule.slice(this.dispatched,end).filter(request=>request.reserve);
    if(!reserve.length)return;
    if(reserve[0].enemyId==='crawler'){
      const pincer=this.plan.beats?.slice(beat+1).find(next=>next.grammar==='pincer');
      if(pincer)this.coolantEntry=this.plan.schedule[pincer.start].breachId;
    }
    return {type:'reserve-cut',breachId:reserve[0].breachId,count:reserve.length,family:reserve[0].enemyId,closedEntry:this.coolantEntry};
  }
  cancelNextReinforcements():void { this.skipReinforcements=true; }
  private rehearsalReleaseMs?:number;
  private updateAuthored(deltaMs:number,occupiedCount:number,siegeReady:boolean,player:EncounterPlayerPose|undefined,heavyRecovered:boolean,crawlerSlots:number):readonly EncounterEvent[]{
    const beat=this.plan.beats![this.beatIndex];if(!beat)return EMPTY;
    if(this.clearingBeat){
      this.lullRemainingMs=Math.max(0,this.lullRemainingMs-deltaMs);if(this.lullRemainingMs>0)return EMPTY;
      this.beatIndex++;this.rehearsalReleaseMs=undefined;this.broken=false;this.canceledReinforcements=0;this.usedFlankerBreaches.clear();this.beatElapsedMs=0;this.clearingBeat=false;return EMPTY;
    }
    this.beatElapsedMs+=deltaMs;
    if(this.dispatched===beat.end){
      if(occupiedCount!==0||beat.grammar==='siege'&&!siegeReady)return EMPTY;
      if(this.beatIndex===this.plan.beats!.length-1){if(this.elapsedMs<this.holdUntilMs)return EMPTY;this.currentPhase='complete';return events(this.clearEvent());}
      this.clearingBeat=true;this.lullRemainingMs=beat.lullMs;return EMPTY;
    }
    const batch:EncounterEvent[]=[];let slots=Math.max(0,this.plan.concurrentCap-occupiedCount);
    while(this.dispatched<beat.end){
      const request=this.plan.schedule[this.dispatched];
      if(request.reinforcement&&this.skipReinforcements&&!this.defusedBeats.has(this.beatIndex)){
        this.skipReinforcements=false;this.skippedReinforcementBeat=this.beatIndex;
        const cut=this.reserveCut(this.beatIndex);
        if(cut)batch.push(cut);
      }
      if(request.reinforcement&&(this.defusedBeats.has(this.beatIndex)||this.skippedReinforcementBeat===this.beatIndex)){this.dispatched++;this.canceledReinforcements++;continue;}
      if(beat.grammar==='pincer'&&request.breachId===this.coolantEntry){
        this.dispatched++;this.canceledReinforcements++;continue;
      }
      const cost=request.enemyId==='carrier'?4:1;
      if(request.atMs>this.beatElapsedMs||cost>slots||request.enemyId==='crawler'&&crawlerSlots===0)break;
      if(request.rehearsalFlank){
        if(!heavyRecovered&&occupiedCount>0&&this.beatElapsedMs<request.atMs+3000)break;
        this.rehearsalReleaseMs=this.beatElapsedMs;
      }else if(request.afterHeavyRecovery&&this.beatElapsedMs<(this.rehearsalReleaseMs??request.atMs+3000)+900)break;
      const arrival=request.reserve?request:this.placeInterception(request,player);
      if(request.reinforcement&&request.role==='flanker'&&arrival.breachId===this.closedFlankId){
        this.dispatched++;this.canceledReinforcements++;continue;
      }
      if(request.enemyId==='crawler')crawlerSlots--;
      const otherArm=beat.grammar==='pincer'&&this.interruptedBrood&&
        (this.plan.schedule.slice(beat.start,beat.end).find(spawn=>spawn.breachId!==this.coolantEntry)?.breachId!==request.breachId);
      const delayed=beat.grammar==='pincer'&&this.interruptedBrood&&
        (this.coolantEntry!==undefined||otherArm);
      slots-=cost;batch.push(delayed?{...arrival,hatchDelayMs:3500}:arrival);this.dispatched++;
    }
    return batch.length?Object.freeze(batch):EMPTY;
  }
  /** Commit flanker arrivals relative to the observed marine pose; the existing arrival warning still owns their delay. */
  private placeInterception(request:EncounterSpawn,player?:EncounterPlayerPose):EncounterSpawn {
    if(request.grammar!=='interception'||request.role!=='flanker'||!player||!Number.isFinite(player.x)||!Number.isFinite(player.y)||!Number.isFinite(player.angle)||this.breaches.length<2)return request;
    const fx=Math.cos(player.angle),fy=Math.sin(player.angle);
    const ranked=this.breaches.filter(b=>Math.hypot(b.x-player.x,b.y-player.y)>130).map(b=>{
      const dx=b.x-player.x,dy=b.y-player.y,distance=Math.hypot(dx,dy);
      return {id:b.id,behind:-(dx*fx+dy*fy)/distance,side:Math.abs((-dx*fy+dy*fx)/distance)};
    }).sort((a,b)=>b.behind-a.behind||(a.id<b.id?-1:a.id>b.id?1:0));
    if(!ranked.length)return request;
    let ordinal=0;const start=this.plan.beats?.[this.beatIndex].start??0;
    for(let i=start;i<this.dispatched;i++)if(this.plan.schedule[i].role==='flanker')ordinal++;
    const unused=ranked.filter(b=>!this.usedFlankerBreaches.has(b.id)),choices=unused.length?unused:ranked;
    if(ordinal%2===1||request.afterHeavyRecovery&&ordinal===0)choices.sort((a,b)=>b.side-a.side||(a.id<b.id?-1:a.id>b.id?1:0));
    const breachId=choices[0].id;this.usedFlankerBreaches.add(breachId);
    return breachId===request.breachId?request:Object.freeze({...request,breachId});
  }
  reportBossDefeated(): readonly EncounterEvent[] {
    if (this.currentPhase !== 'boss') return EMPTY;
    this.currentPhase = 'complete';
    return events(this.clearEvent());
  }
  reportPlayerDefeated(): readonly EncounterEvent[] {
    if (this.currentPhase !== 'combat' && this.currentPhase !== 'boss') return EMPTY;
    this.currentPhase = 'dead';
    return events({ type: 'defeat' });
  }
  reset(): void { this.meleeLockDelays=0;this.delayedLocks.clear();this.coolantEntry=undefined;this.interruptedBrood=false;this.rehearsalReleaseMs=undefined;this.currentPhase = 'idle'; this.closedFlankId=undefined; this.elapsedMs = 0; this.dispatched = 0;this.beatIndex=0;this.beatElapsedMs=this.lullRemainingMs=0;this.clearingBeat=false;this.broken=false;this.defusedBeats.clear();this.usedFlankerBreaches.clear();this.canceledReinforcements=0; }
  private clearEvent(): EncounterEvent { return { type: 'room-clear', nodeId: this.plan.nodeId, wave: this.plan.wave }; }
}
