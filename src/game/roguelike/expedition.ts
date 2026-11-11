import type {RigId} from '../abilities/contract';
import {RIG_CATALOG} from '../abilities/catalog';
import {createRun,generateRun,clearRoom,finishReward,enterRoom,endRun,isValidRunState} from './run';
import {createBuild,addMutation,draftMutationOffers,isValidBuildState} from './builds';
import {isValidRunResources,isValidCheckpointExtensions,parseCheckpoint,serializeCheckpoint} from './checkpoints';
import type {BuildState,MutationId,RunCheckpoint,RunResources,RunState} from './types';

export type Expedition = Readonly<{run:RunState;build:BuildState;resources:RunResources;abilities?:RunCheckpoint['abilities'];stats?:RunCheckpoint['stats']}>;
export type ExpeditionRuntimeState = Pick<RunCheckpoint,'abilities'|'stats'>;
const resourcesCopy=(resources:RunResources):RunResources=>Object.freeze({...resources,ammo:Object.freeze(Object.fromEntries(Object.entries(resources.ammo).map(([key,ammo])=>[key,Object.freeze({...ammo})])) as RunResources['ammo'])});
function assertExpedition(expedition:Expedition):void {
  if(!expedition||!isValidRunState(expedition.run)||!isValidBuildState(expedition.build)||!isValidRunResources(expedition.resources)||!isValidCheckpointExtensions(expedition))throw new Error('Invalid expedition');
}
function snapshot(run:RunState,build:BuildState,resources:RunResources,runtime:ExpeditionRuntimeState={}):Expedition {
  const result=Object.freeze({
    run:Object.freeze({...run,completedNodeIds:Object.freeze([...run.completedNodeIds])}),
    build:Object.freeze({...build,mutations:Object.freeze([...build.mutations])}),
    resources:resourcesCopy(resources),
    ...(runtime.abilities?{abilities:Object.freeze({...runtime.abilities})}:{}),
    ...(runtime.stats?{stats:copyStats(runtime.stats)}:{}),
  });assertExpedition(result);return result;
}
const copyStats=(stats:NonNullable<RunCheckpoint['stats']>):NonNullable<RunCheckpoint['stats']>=>Object.freeze({...stats,kills:Object.freeze({...stats.kills,byFamily:Object.freeze({...stats.kills.byFamily})}),damageDealt:Object.freeze({...stats.damageDealt}),abilityUses:Object.freeze({...stats.abilityUses}),roomTimeMs:Object.freeze({...stats.roomTimeMs})});
function currentNode(expedition:Expedition){
  assertExpedition(expedition);
  return generateRun(expedition.run.seed,expedition.run.version).nodes.find(node=>node.id===expedition.run.currentNodeId)!;
}
const offerSeed=(expedition:Expedition):number=>{
  let hash=expedition.run.seed;
  for(const char of expedition.run.currentNodeId)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
  return hash;
};
export function createExpedition(seed:number,resources:RunResources,options:{rigSelect?:boolean}={}):Expedition {
  if(!isValidRunResources(resources)||resources.health<=0)throw new Error('A run must start alive');
  return snapshot({...createRun(seed),phase:options.rigSelect?'rig-select':'starting-boon'},{...createBuild(),rig:'breacher'},resources);
}
/** Choose once before the starting boon. Legacy starts skip this phase with Breacher. */
export function chooseExpeditionRig(expedition:Expedition,id:RigId):Expedition {
  assertExpedition(expedition);
  if(expedition.run.phase!=='rig-select'||!Object.hasOwn(RIG_CATALOG,id))throw new Error('Rig selection unavailable');
  return snapshot({...expedition.run,phase:'starting-boon'},{...expedition.build,rig:id},expedition.resources,expedition);
}
/** The host supplies authoritative combat resources; changing rooms never resets them. */
export function completeExpeditionRoom(expedition:Expedition,resources:RunResources):Expedition {
  assertExpedition(expedition);
  if(!isValidRunResources(resources)||resources.health<=0)throw new Error('A dead player cannot clear a room');
  return snapshot(clearRoom(expedition.run),expedition.build,resources,expedition);
}
export function expeditionRewardOffers(expedition:Expedition):ReturnType<typeof draftMutationOffers> {
  const node=currentNode(expedition);
  if(expedition.run.phase!=='starting-boon'&&(expedition.run.phase!=='reward'||!['upgrade','rare-upgrade'].includes(node.reward)))return Object.freeze([]);
  let offers:ReturnType<typeof draftMutationOffers>=[],excluded:MutationId[]=[];
  for(let roll=0;roll<=(expedition.run.draftRoll??0);roll++){
    offers=draftMutationOffers((offerSeed(expedition)+Math.imul(roll,0x9e3779b9))>>>0,expedition.build,node.reward==='rare-upgrade',excluded,node.depth,expedition.build.rig??'breacher');
    excluded.push(...offers.map(m=>m.id));
  }
  return offers;
}
export function rerollCost(expedition:Expedition):number{return 75*((expedition.run.draftRoll??0)+1)+currentNode(expedition).depth*10;}
export function rerollExpedition(expedition:Expedition):Expedition{
 const cost=rerollCost(expedition),roll=expedition.run.draftRoll??0;
 if(expedition.run.version===1||roll>=2||!expeditionRewardOffers(expedition).length||expedition.resources.credits<cost)throw new Error('Reroll unavailable');
 return snapshot({...expedition.run,draftRoll:roll+1},expedition.build,{...expedition.resources,credits:expedition.resources.credits-cost},expedition);
}
/** Commit a valid offered mutation and consume the reward in the same transition. */
export function claimExpeditionMutation(expedition:Expedition,id:MutationId):Expedition {
  if(!expeditionRewardOffers(expedition).some(offer=>offer.id===id))throw new Error('Mutation is not offered');
  const run=expedition.run.phase==='starting-boon'?{...expedition.run,phase:'combat' as const,draftRoll:0}:finishReward(expedition.run);
  return snapshot(run,addMutation(expedition.build,id),expedition.resources,expedition);
}
/** Medical/supply adapters apply their receipt first; this boundary commits it once. */
export function claimExpeditionResources(expedition:Expedition,resources:RunResources):Expedition {
  const node=currentNode(expedition);
  if(expedition.run.phase!=='reward'||!['healing','supplies'].includes(node.reward))throw new Error('No resource reward is pending');
  if(!isValidRunResources(resources)||resources.health<=0)throw new Error('Invalid resource receipt');
  return snapshot(finishReward(expedition.run),expedition.build,resources,expedition);
}
export function chooseExpeditionRoute(expedition:Expedition,nodeId:string):Expedition {
  assertExpedition(expedition);return snapshot(enterRoom(expedition.run,nodeId),expedition.build,expedition.resources,expedition);
}
/** Separate from generic routing, so skip/continue can never authorize the sacrifice. */
export function authorizeExpeditionDestruction(expedition:Expedition):Expedition {
 if(currentNode(expedition).templateId!=='manual-control-chamber')throw new Error('Not at manual controls');
 return snapshot(enterRoom(expedition.run,currentNode(expedition).next[0],'destroy-ship'),expedition.build,expedition.resources,expedition);
}
export function defeatExpedition(expedition:Expedition):Expedition {
  assertExpedition(expedition);return snapshot(endRun(expedition.run),expedition.build,expedition.resources,expedition);
}
export function expeditionCheckpoint(expedition:Expedition,savedAt:number,runtime:ExpeditionRuntimeState={}):RunCheckpoint {
  assertExpedition(expedition);
  const checkpoint:RunCheckpoint={version:1,savedAt,...expedition,...runtime};
  const serialized=serializeCheckpoint(checkpoint);if(!serialized)throw new Error('Expedition is not at a save boundary');
  return parseCheckpoint(serialized)!;
}
export function restoreExpedition(checkpoint:RunCheckpoint):Expedition {
  const serialized=serializeCheckpoint(checkpoint);if(!serialized)throw new Error('Invalid checkpoint');
  const valid=parseCheckpoint(serialized)!;return snapshot(valid.run,{...valid.build,rig:valid.build.rig??'breacher'},valid.resources,valid);
}
