import type { RoomKind, RunGraph, RunNode, RunPhase, RunState, TemplateId } from './types';

import {SERVICE_IDS,SERVICE_CATALOG,DETOUR_DEPTHS,type DetourChoice} from './economy';
import {isJunction} from './shipConditions';
import {ROOM_STORY_ROUTE} from './storyRooms';
export const RUN_LENGTH = 20;
export const runLength=(version:1|2|3=3)=>version===1?6:version===2?12:RUN_LENGTH;
export const ACT_NAMES=["Cargo", "Quarantine", "The Core"] as const;

export const ROOM_KIND_LABELS: Readonly<Record<RoomKind, string>> = Object.freeze({
  combat: 'Standard encounter', medical: 'Medical station', armory: 'Supply cache',
  elite: 'Elite encounter', boss: 'Final boss',
});
export const ROOM_REWARD_LABELS: Readonly<Record<RunNode['reward'], string>> = Object.freeze({
  upgrade: 'Mutation', healing: 'Healing', supplies: 'Ammo and supplies',
  'rare-upgrade': 'Rare mutation', victory: 'Victory',
});

/** Labels describe future host rewards; this module does not award resources. */
export function getRouteLabel(node: RunNode): string {
  const encounter = node.id.endsWith('r3-safe') ? 'Safer encounter' : ROOM_KIND_LABELS[node.kind];
  return `${encounter} · ${ROOM_REWARD_LABELS[node.reward]}`;
}

function isSeed(seed: unknown): seed is number {
  return typeof seed === 'number' && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;
}

/** Private Mulberry32 stream. No clock, Math.random, or mutable global state. */
function randomFor(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000;
  };
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** Every choice advances one depth, so all eight legal routes end after six rooms. */
function generateLegacyRun(seed: number): RunGraph {
  if (!isSeed(seed)) throw new RangeError('Run seed must be an unsigned 32-bit integer.');
  const random = randomFor(seed);
  const templates = shuffle<TemplateId>([
    'receiving', 'forklift-loop', 'cold-aisle', 'freight-crossing',
    'pump-ring', 'specimen-bay', 'security-lock',
  ], random);
  const layers = [
    ['r0-start'],
    shuffle(['r1-medical', 'r1-armory'], random),
    ['r2-combat'],
    shuffle(['r3-safe', 'r3-elite'], random),
    shuffle(['r4-medical', 'r4-armory'], random),
    ['r5-boss'],
  ].map(layer => layer.map(id => `${seed}:${id}`));
  let templateIndex = 0;
  const nodes: RunNode[] = [];
  for (let depth = 0; depth < layers.length; depth += 1) {
    for (const id of layers[depth]) {
      const kind: RoomKind = id.endsWith('boss') ? 'boss'
        : id.endsWith('elite') ? 'elite'
        : id.endsWith('medical') ? 'medical'
        : id.endsWith('armory') ? 'armory' : 'combat';
      const reward: RunNode['reward'] = kind === 'boss' ? 'victory'
        : kind === 'elite' ? 'rare-upgrade'
        : kind === 'medical' ? 'healing'
        : kind === 'armory' ? 'supplies' : 'upgrade';
      nodes.push(Object.freeze({
        id, depth, kind, reward,
        templateId: kind === 'boss' ? 'reactor-vault' : templates[templateIndex++ % templates.length],
        next: Object.freeze([...(layers[depth + 1] ?? [])]),
      }));
    }
  }
  return Object.freeze({ seed, startId: layers[0][0], bossId: layers[5][0], nodes: Object.freeze(nodes) });
}

/** New runs use three acts; version one remains byte-for-byte deterministic for old saves. */
export function generateRun(seed:number,version:1|2|3=3):RunGraph{
 if(version===3)return generateStoryRun(seed);
 if(version===1)return generateLegacyRun(seed);
 if(!isSeed(seed))throw new RangeError('Run seed must be an unsigned 32-bit integer.');
 const random=randomFor(seed),decks:TemplateId[][]=[
  shuffle<TemplateId>(['receiving','forklift-loop','freight-crossing','rail-depot'],random),
  shuffle<TemplateId>(['cold-aisle','specimen-bay','quarantine-cross','cryo-gallery','filtration'],random),
  shuffle<TemplateId>(['pump-ring','security-lock','turbine-hall','waste-processing','power-conduits','hive-approach'],random),
 ];
 const kinds:RoomKind[][]=[['combat'],['combat','elite'],['medical','armory'],['elite'],['combat'],['combat','elite'],['medical','armory'],['elite'],['combat'],['combat','elite'],['medical','armory'],['boss']];
 const layers=kinds.map((list,depth)=>shuffle(list,random).map(kind=>({id:`${seed}:v2-r${depth}-${kind}`,kind})));
 const nodes:RunNode[]=layers.flatMap((layer,depth)=>layer.map(({id,kind})=>Object.freeze({id,depth,kind,
  templateId:kind==='boss'?'reactor-vault' as const:decks[Math.floor(depth/4)][depth%4],
  reward:kind==='boss'?'victory' as const:kind==='elite'?'rare-upgrade' as const:kind==='medical'?'healing' as const:kind==='armory'?'supplies' as const:'upgrade' as const,
  next:Object.freeze((layers[depth+1]??[]).map(n=>n.id)),
 })));
 return Object.freeze({seed,nodes:Object.freeze(nodes),startId:layers[0][0].id,bossId:layers[11][0].id});
}

/** Twenty encounters, with rewards independent from encounter kind. Legacy saves keep their graphs. */
function generateStoryRun(seed:number):RunGraph {
 if(!isSeed(seed))throw new RangeError('Run seed must be an unsigned 32-bit integer.');
 const id=(depth:number)=>`${seed}:v3-r${depth}`;
 const nodes:RunNode[]=ROOM_STORY_ROUTE.map((room,depth)=>Object.freeze({
  id:id(depth),depth,templateId:room.templateId,
  kind:depth===5||depth===15?'elite' as const:'combat' as const,
  reward:depth===19?'victory' as const:depth===5||depth===15?'rare-upgrade' as const:
   [3,11].includes(depth)?'healing' as const:[7,14,18].includes(depth)?'supplies' as const:'upgrade' as const,
  next:Object.freeze(depth===19?[]:[id(depth+1)]),
 }));
 return Object.freeze({seed,nodes:Object.freeze(nodes),startId:id(0),bossId:id(19)});
}

export function freezeRunState(state: RunState): RunState {
  return Object.freeze({
    ...state,
    completedNodeIds: Object.freeze([...state.completedNodeIds]),
    ...(state.junctions ? {junctions:Object.freeze({...state.junctions})} : {}),
    ...(state.contract ? {contract:Object.freeze({...state.contract})} : {}),
    ...(state.service ? {service:Object.freeze({...state.service,purchases:Object.freeze([...state.service.purchases])})} : {}),
    ...(state.detour ? {detour:Object.freeze({...state.detour})} : {}),
  });
}

export function createRun(seed: number): RunState {
  const graph = generateRun(seed);
  return freezeRunState({ version: 3, seed, runStructure:1, currentNodeId: graph.startId, completedNodeIds: [], phase: 'combat',draftRoll:0 });
}

const PHASES: readonly RunPhase[] = ['rig-select', 'starting-boon', 'combat', 'reward', 'route', 'complete', 'dead'];
const STATE_KEYS = ['version', 'seed', 'currentNodeId', 'completedNodeIds', 'phase'];

/** Validate an ordered path, not just membership in the generated graph.
 * Combat/dead exclude the current room; reward/route/complete include it.
 * Only the boss can complete a run, and the boss never has a reward/route phase.
 */
export function isValidRunState(value: unknown): value is RunState {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (!STATE_KEYS.every(key => Object.hasOwn(record,key)) || keys.some(key=>!STATE_KEYS.includes(key)&&!['runStructure','guardianRoute','contract','junctions','draftRoll','service','detour','rerollTokens','finaleRevive'].includes(key)))return false;
  if(record.runStructure!==undefined&&(record.runStructure!==1||record.version!==3))return false;
  if(record.rerollTokens!==undefined&&(!Number.isInteger(record.rerollTokens)||Number(record.rerollTokens)<0||Number(record.rerollTokens)>3))return false;
  if(record.service!==undefined){const q=record.service as RunState['service'];if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).sort().join(',')!=='allocationClaimed,nodeId,purchases'||q.nodeId!==record.currentNodeId||typeof q.allocationClaimed!=='boolean'||!Array.isArray(q.purchases)||q.purchases.length>10||q.purchases.length>0&&!q.allocationClaimed||Array.from({length:q.purchases.length},(_,i)=>i).some(i=>!Object.hasOwn(q.purchases,i))||q.purchases.some(id=>!SERVICE_IDS.includes(id))||SERVICE_IDS.some(id=>q.purchases.filter(x=>x===id).length>SERVICE_CATALOG[id].stock))return false;}
  if(record.detour!==undefined){const q=record.detour as RunState['detour'];if(record.version!==3||!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).sort().join(',')!=='choice,depth'||!Number.isInteger(q.depth)||!DETOUR_DEPTHS.some(d=>d+1===q.depth)||!['direct','salvage'].includes(q.choice))return false;}
  if(record.draftRoll!==undefined&&(record.version===1||!Number.isInteger(record.draftRoll)||Number(record.draftRoll)<0||Number(record.draftRoll)>2))return false;
  if ((record.version !== 1 && record.version !== 2 && record.version !== 3) || !isSeed(record.seed) || typeof record.currentNodeId !== 'string') return false;
  if (typeof record.phase !== 'string' || !PHASES.includes(record.phase as RunPhase)) return false;
  if (!Array.isArray(record.completedNodeIds) || record.completedNodeIds.length > RUN_LENGTH) return false;
  if (!record.completedNodeIds.every(id => typeof id === 'string')) return false;
  const graph = generateRun(record.seed,record.version as 1|2|3);
  const current = graph.nodes.find(node => node.id === record.currentNodeId);
  if (!current) return false;
  if(record.contract!==undefined){
    const contract=record.contract as RunState['contract'];
    if(record.runStructure!==1||!contract||typeof contract!=='object'||Array.isArray(contract)||Object.keys(contract).some(key=>!['earned','progress','lastPayout'].includes(key))||(contract.lastPayout!==undefined&&typeof contract.lastPayout!=='boolean')||!Number.isFinite(contract.progress)||contract.progress<0||contract.progress>20000||!Number.isInteger(contract.earned)||contract.earned<0||contract.earned>3)return false;
  }
  if(record.junctions!==undefined){
    if(record.runStructure!==1||!record.junctions||typeof record.junctions!=='object'||Array.isArray(record.junctions))return false;
    if(Object.entries(record.junctions).some(([key,value])=>key!==String(Number(key))||!isJunction(Number(key))||Number(key)>current.depth||(value!=='direct'&&value!=='salvage')))return false;
  }
  if(record.finaleRevive!==undefined&&(record.finaleRevive!==true||record.version!==3||current.depth<18))return false;
  if(record.service!==undefined&&(!['reward','route'].includes(String(record.phase))||!['healing','supplies'].includes(current.reward)))return false;
  if(record.guardianRoute!==undefined){
    const junctions=record.junctions as RunState['junctions'];
    if(record.runStructure!==1||current.depth<3||
      !(record.guardianRoute==='plate-breaker'&&junctions?.[3]==='direct'||record.guardianRoute==='brood'&&junctions?.[3]==='salvage'))return false;
  }
  if(record.detour!==undefined){
    const detour=record.detour as NonNullable<RunState['detour']>;
    if(detour.depth!==current.depth)return false;
    const junctions=record.junctions as RunState['junctions'];
    if(record.runStructure===1&&isJunction(current.depth)&&junctions?.[current.depth]!==detour.choice)return false;
  }
  if ((record.phase === 'starting-boon' || record.phase === 'rig-select') && (record.version !== 3 || current.id !== graph.startId)) return false;
  const completed = record.completedNodeIds as string[];
  const cleared = record.phase === 'reward' || record.phase === 'route' || record.phase === 'complete';
  if (completed.length !== current.depth + (cleared ? 1 : 0)) return false;
  if (record.phase === 'complete' && current.id !== graph.bossId) return false;
  if ((record.phase === 'reward' || record.phase === 'route') && current.id === graph.bossId) return false;
  const path = cleared ? completed : [...completed, current.id];
  if (path[0] !== graph.startId || path[path.length - 1] !== current.id) return false;
  if (new Set(path).size !== path.length) return false;
  for (let depth = 0; depth < path.length; depth += 1) {
    const node = graph.nodes.find(candidate => candidate.id === path[depth]);
    if (!node || node.depth !== depth) return false;
    if (depth > 0) {
      const previous = graph.nodes.find(candidate => candidate.id === path[depth - 1]);
      if (!previous?.next.includes(node.id)) return false;
    }
  }
  return true;
}

function requirePhase(state: RunState, phase: RunPhase): void {
  if (!isValidRunState(state)) throw new Error('Invalid run state.');
  if (state.phase !== phase) throw new Error(`Expected ${phase} phase; received ${state.phase}.`);
}

export function clearRoom(state: RunState): RunState {
  requirePhase(state, 'combat');
  const graph = generateRun(state.seed,state.version);
  return freezeRunState({
    ...state,
    completedNodeIds: [...state.completedNodeIds, state.currentNodeId],
    phase: state.currentNodeId === graph.bossId ? 'complete' : 'reward',
  });
}

/** Host calls after applying the pending reward exactly once. */
export function finishReward(state: RunState): RunState {
  requirePhase(state, 'reward');
  return freezeRunState({ ...state, phase: 'route' });
}

export function enterRoom(state: RunState, nextId: string, action?:'destroy-ship',detour?:DetourChoice): RunState {
  requirePhase(state, 'route');
  const current = generateRun(state.seed,state.version).nodes.find(node => node.id === state.currentNodeId)!;
  if (current.templateId === 'manual-control-chamber' && action !== 'destroy-ship') throw new Error('Explicit destruction authorization required.');
  if (!current.next.includes(nextId)) throw new Error('Requested room is not an available route.');
  if(detour!==undefined&&(state.version!==3||!DETOUR_DEPTHS.includes(current.depth as typeof DETOUR_DEPTHS[number])||!['direct','salvage'].includes(detour)))throw new Error('Preparation choice unavailable.');
  const {service: _service,detour: _detour,...continuation}=state;
  const junctions=state.runStructure&&isJunction(current.depth+1)?{...state.junctions,[current.depth+1]:detour??'direct'}:state.junctions;
  const guardianRoute=state.runStructure&&current.depth===2&&detour
    ?detour==='direct'?'plate-breaker':'brood':state.guardianRoute;
  return freezeRunState({ ...continuation, ...(guardianRoute?{guardianRoute}:{}), ...(junctions?{junctions}:{}), ...(detour?{detour:{depth:current.depth+1,choice:detour}}:{}),currentNodeId: nextId, phase: 'combat',...(state.version!==1?{draftRoll:0}:{}) });
}

/** Death is terminal and can occur only during an active room. */
export function endRun(state: RunState): RunState {
  requirePhase(state, 'combat');
  return freezeRunState({ ...state, phase: 'dead' });
}
