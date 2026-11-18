import {AUTHORED_ENCOUNTERS,SALVAGE_BEAT,type EncounterGrammar,type EnemyRole} from './authoredEncounters';
import {DIFFICULTIES,type DifficultyId} from '../difficulty';
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
  beat?:number;grammar?:EncounterGrammar;role?:EnemyRole;priority?:boolean;controlResistant?:boolean;guardian?:'warden'|'matron';lesson?:'crawler'|'brute'|'stalker';reinforcement?:boolean;
}>;
export type EncounterEvent = EncounterSpawn
  | Readonly<{ type: 'room-start'; nodeId: string; depth: number; wave: number }>
  | Readonly<{ type: 'boss-start' }>
  | Readonly<{ type: 'room-clear'; nodeId: string; wave: number }>
  | Readonly<{ type: 'defeat' }>;
export type EncounterOptions = Readonly<{ seed: number; node: RunNode; difficulty?:DifficultyId;salvage?:boolean;breaches?:readonly {id:string;x:number;y:number}[]; breachIds: readonly string[] }>;
export type EncounterPlan = Readonly<{
  nodeId: string; kind: RunNode['kind']; wave: number; totalSpawns: number;
  concurrentCap: number; schedule: readonly EncounterSpawn[];
  beats?:readonly Readonly<{grammar:EncounterGrammar;label:string;lullMs:number;start:number;end:number}>[];
}>;
export type EncounterSnapshot = Readonly<{
  phase: EncounterPhase; elapsedMs: number; dispatched: number; remaining: number;
  totalSpawns: number; concurrentCap: number;beat?:number;grammar?:EncounterGrammar;beatLabel?:string;lullRemainingMs?:number;canceledReinforcements?:number;
}>;

function authoredPlan(options:EncounterOptions):EncounterPlan {
 const {node}=options,d=DIFFICULTIES[options.difficulty??'standard'];
 const source=[...AUTHORED_ENCOUNTERS[node.depth]];if(options.salvage)source.push(SALVAGE_BEAT);
 let state=(options.seed^Math.imul(node.depth+1,0x9e3779b9))>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};
 const positions=options.breaches;const center=positions?.length?{x:positions.reduce((n,p)=>n+p.x,0)/positions.length,y:positions.reduce((n,p)=>n+p.y,0)/positions.length}:null;
 const ids=center&&positions?[...options.breachIds].sort((a,b)=>{const pa=positions.find(p=>p.id===a),pb=positions.find(p=>p.id===b);return pa&&pb?Math.atan2(pa.y-center.y,pa.x-center.x)-Math.atan2(pb.y-center.y,pb.x-center.x):0;}):options.breachIds,rotation=Math.floor(random()*ids.length),schedule:EncounterSpawn[]=[];
 const beats=source.map((beat,beatIndex)=>{
  const start=schedule.length;let marked=false;
  for(const group of beat.groups){
   const baseCount=group.guardian?1:group.lesson||group.priority||node.depth<4?group.count:Math.max(1,Math.round(group.count*d.waves*(node.depth>=10?d.lateWaves:1)));
   // Standard's final containment siege sustains one additional ranged lane.
   const count=baseCount+(options.difficulty==='standard'&&node.depth===19&&group.family==='spitter'?1:0);
   for(let index=0;index<count;index++){
    // Exchange only the final body, preserving the pack's original arrival times.
    const rangedRelief=options.difficulty==='veteran'&&node.depth>=10&&group.family==='crawler'&&!group.lesson&&!group.priority&&count>1&&index===count-1;
    const family=rangedRelief?'spitter':group.family,role=rangedRelief?'ranged':group.role;
    const ordinal=schedule.length-start;
    const elite=!group.lesson&&node.depth>1&&(!!group.guardian||random()<Math.min(.28,(node.depth>=10?.21:.06+node.depth*.012)*d.elites));
    const resistant=!marked&&(!!group.guardian||elite&&!!group.priority);
    if(resistant)marked=true;
    const side=role==='flanker'?1+index%Math.max(1,ids.length-1):role==='ranged'?(index%2?Math.floor(ids.length/2):0):beat.grammar==='pincer'?(ordinal%2?Math.floor(ids.length/2):0):0;
    const breachId=ids[(rotation+beatIndex+side)%ids.length];
    schedule.push(Object.freeze({type:'spawn-request',spawnId:`${node.id}:spawn-${schedule.length}`,atMs:group.reinforcement?4500+index*650:650+ordinal*450,wave:node.depth+1,enemyId:family,elite,breachId,beat:beatIndex,grammar:beat.grammar,role,priority:group.priority??false,controlResistant:resistant,...(group.guardian?{guardian:group.guardian}:{}),...(group.lesson?{lesson:group.lesson}:{}),reinforcement:group.reinforcement??false}));
   }
  }
  // Reinforcements are late arrivals even when their group precedes another authored group.
  const sorted=schedule.splice(start).sort((a,b)=>a.atMs-b.atMs);schedule.push(...sorted);
  return Object.freeze({grammar:beat.grammar,label:beat.label,lullMs:beat.lullMs,start,end:schedule.length});
 });
 return Object.freeze({nodeId:node.id,kind:node.kind,wave:node.depth+1,totalSpawns:schedule.length,concurrentCap:Math.min(12,6+Math.floor(node.depth/3)),schedule:Object.freeze(schedule),beats:Object.freeze(beats)});
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
  private readonly breaches:readonly {id:string;x:number;y:number}[];
  private currentPhase: EncounterPhase = 'idle';
  private elapsedMs = 0;
  private dispatched = 0;
  private beatIndex=0;private beatElapsedMs=0;private lullRemainingMs=0;private clearingBeat=false;private defusedBeats=new Set<number>();private usedFlankerBreaches=new Set<string>();private canceledReinforcements=0;

  constructor(options: EncounterOptions) { this.plan = createEncounterPlan(options);this.breaches=options.breaches??[]; }
  get phase(): EncounterPhase { return this.currentPhase; }
  get currentWave(): number { return this.plan.wave; }
  get snapshot(): EncounterSnapshot {
    return Object.freeze({ phase: this.currentPhase, elapsedMs: this.elapsedMs, dispatched: this.dispatched,
      remaining: this.plan.totalSpawns - this.dispatched, totalSpawns: this.plan.totalSpawns, concurrentCap: this.plan.concurrentCap,...(this.plan.beats?{beat:this.beatIndex,grammar:this.plan.beats[this.beatIndex]?.grammar,beatLabel:this.plan.beats[this.beatIndex]?.label,lullRemainingMs:this.lullRemainingMs,canceledReinforcements:this.canceledReinforcements}:{}) });
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

  update(deltaMs: number, occupiedCount: number,siegeReady=true,player?:EncounterPlayerPose): readonly EncounterEvent[] {
    if (this.currentPhase !== 'combat' || !Number.isFinite(deltaMs) || deltaMs < 0
      || !Number.isSafeInteger(occupiedCount) || occupiedCount < 0) return EMPTY;
    this.elapsedMs = Math.min(Number.MAX_SAFE_INTEGER, this.elapsedMs + deltaMs);
    if(this.plan.beats)return this.updateAuthored(deltaMs,occupiedCount,siegeReady,player);
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

  /** A killed priority body prevents its still-unannounced escort reinforcement. */
  reportPriorityDefeated(beat:number):void {if(Number.isSafeInteger(beat)&&beat===this.beatIndex)this.defusedBeats.add(beat);}
  private updateAuthored(deltaMs:number,occupiedCount:number,siegeReady:boolean,player?:EncounterPlayerPose):readonly EncounterEvent[]{
    const beat=this.plan.beats![this.beatIndex];if(!beat)return EMPTY;
    if(this.clearingBeat){
      this.lullRemainingMs=Math.max(0,this.lullRemainingMs-deltaMs);if(this.lullRemainingMs>0)return EMPTY;
      this.beatIndex++;this.canceledReinforcements=0;this.usedFlankerBreaches.clear();this.beatElapsedMs=0;this.clearingBeat=false;return EMPTY;
    }
    this.beatElapsedMs+=deltaMs;
    if(this.dispatched===beat.end){
      if(occupiedCount!==0||beat.grammar==='siege'&&!siegeReady)return EMPTY;
      if(this.beatIndex===this.plan.beats!.length-1){this.currentPhase='complete';return events(this.clearEvent());}
      this.clearingBeat=true;this.lullRemainingMs=beat.lullMs;return EMPTY;
    }
    const batch:EncounterEvent[]=[];let slots=Math.max(0,this.plan.concurrentCap-occupiedCount);
    while(this.dispatched<beat.end){
      const request=this.plan.schedule[this.dispatched];
      if(request.reinforcement&&this.defusedBeats.has(this.beatIndex)){this.dispatched++;this.canceledReinforcements++;continue;}
      const cost=request.enemyId==='carrier'?4:1;
      if(request.atMs>this.beatElapsedMs||cost>slots)break;
      slots-=cost;batch.push(this.placeInterception(request,player));this.dispatched++;
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
    if(ordinal%2===1)choices.sort((a,b)=>b.side-a.side||(a.id<b.id?-1:a.id>b.id?1:0));
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
  reset(): void { this.currentPhase = 'idle'; this.elapsedMs = 0; this.dispatched = 0;this.beatIndex=0;this.beatElapsedMs=this.lullRemainingMs=0;this.clearingBeat=false;this.defusedBeats.clear();this.usedFlankerBreaches.clear();this.canceledReinforcements=0; }
  private clearEvent(): EncounterEvent { return { type: 'room-clear', nodeId: this.plan.nodeId, wave: this.plan.wave }; }
}
