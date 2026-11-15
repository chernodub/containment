import {afterAll,describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {DepthGame,type GameEffect} from '../src/DepthGame';
import type {RigId} from '../src/game/abilities/contract';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {canOccupyExpedition,createRoomTemplateGeometry} from '../src/game/world/expeditionGeometry';
import {spawnL8Cohort,watchL8Movement} from './helpers/l8SimulationHarness';
import {PARTITION_NODES as L8_STORY,partitionTemplate,partitionPlan as l8Plan,writePartitionReport as writeL8Report} from './helpers/l8FinalPartitionHarness';
const rows:unknown[]=[];
afterAll(()=>writeL8Report('replay-determinism.json',rows));
/** A fixed public-input trace in every real activated geometry. These are
 * independent room fixtures, not a forced-clear campaign completion claim. */
function replay(rig:RigId){
 const results:{room:string;hash:string;events:number;activeSteps:number;acceptedCommands:number}[]=[];
 for(const node of L8_STORY){
  const effects:GameEffect[]=[],game=new DepthGame(e=>effects.push(e));game.newRun(1729,{rigSelect:true});game.chooseRig(rig);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game['director'].reset();game['pending']=[];game.enemies.reset();game.node=node;game.geometry=createRoomTemplateGeometry(partitionTemplate(node),node.id);game.navigation=new FacilityNavigation(game.geometry);
  const movement=watchL8Movement(game),arena=l8Plan(node.templateId).arena;Object.assign(game.player,arena);spawnL8Cohort(game);
  const hash=createHash('sha256');hash.update(JSON.stringify({rig,node,geometry:game.geometry}));let events=0,activeSteps=0,acceptedCommands=0;
  for(let tick=0;tick<120;tick++){
   const enemy=game.enemies.snapshot.enemies[0],aim=enemy??{x:arena.x+70,y:arena.y};game.setAimPoint(aim);
   if(tick===5)acceptedCommands+=Number(game.useAbility('tactical'));if(tick===12)acceptedCommands+=Number(game.useAbility('power'));if(tick===20)acceptedCommands+=Number(game.useAbility('dash'));if(tick===60)acceptedCommands+=Number(game.useAbility('overdrive'));
   const tx=arena.x+Math.sin(tick*.07)*70,ty=arena.y+Math.cos(tick*.07)*70,dx=tx-game.player.x,dy=ty-game.player.y,d=Math.hypot(dx,dy)||1;
   const input={x:dx/d,y:dy/d,fire:tick%3!==0,angle:Math.atan2(aim.y-game.player.y,aim.x-game.player.x),aimPoint:{x:aim.x,y:aim.y},autoAim:false};
   const before=movement.begin();if(game.status==='playing')activeSteps++;game.update(50,input);movement.assert(before);
   expect(canOccupyExpedition(game.geometry,game.player,16),`${node.templateId} replay player clearance`).toBe(true);
   const frameEffects=effects.splice(0);events+=frameEffects.length;
   hash.update(JSON.stringify({tick,input,status:game.status,player:game.player,combat:game.combat.snapshot,abilities:game.abilities.snapshot,enemies:game.enemies.snapshot,bullets:game.bullets,pools:game.pools,pickups:game.pickups.snapshot,stats:game.stats,effects:frameEffects}));
  }
  expect(activeSteps).toBeGreaterThan(10);results.push({room:node.templateId,hash:hash.digest('hex'),events,activeSteps,acceptedCommands});
 }
 expect(results.reduce((n,r)=>n+r.events,0)).toBeGreaterThan(0);expect(results.reduce((n,r)=>n+r.acceptedCommands,0)).toBeGreaterThan(0);return results;
}
describe('Dormant physical-partition deterministic native input replay',()=>{
 it.each(['breacher','cryo','pyro','arc'] as const)('%s reproduces every frame and effect across all3 candidate geometries',rig=>{
  const first=replay(rig),second=replay(rig);rows.push({rig,seed:1729,rooms:first});expect(first).toHaveLength(3);expect(second).toEqual(first);
 },60000);
});
