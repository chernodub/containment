import {DepthGame, type GameEffect} from '../src/DepthGame';
import {AbilitySystem, type AbilityHost} from '../src/game/abilities/AbilitySystem';
import type {RigId, AbilityEvent} from '../src/game/abilities/contract';
import type {MutationId} from '../src/game/roguelike/types';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {createExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

export function advance(system:{update(ms:number):void},total:number,step=50) {
  for(let elapsed=0;elapsed<total-1e-8;elapsed+=step)system.update(Math.min(step,total-elapsed));
}
export function arena(rig:RigId='breacher') {
  const effects:GameEffect[]=[];
  const game=new DepthGame(e=>effects.push(e));
  game.newRun(137,{rigSelect:true});game.chooseRig(rig);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game['director'].reset();game['pending']=[];game.enemies.reset();
  const room=createExpeditionGeometry({...game.node,templateId:'receiving'});
  game.geometry={...room,blockers:room.boundaryWalls};game.navigation=new FacilityNavigation(game.geometry);
  Object.assign(game.player,{x:400,y:440,angle:0,vx:0,vy:0});
  game.combat.setBuild({rig,mutations:[]});effects.length=0;
  return {game,effects};
}
export function world(rig:RigId='pyro',augments:MutationId[]=[]) {
  const player={x:0,y:0,angle:0,radius:16,vx:0,vy:0};
  const targets=[{id:1,x:100,y:0,radius:14,health:1e6}];
  const events:Array<AbilityEvent&{x:number;y:number}>=[];
  const hits:Array<{id:number;damage:number}>=[];
  const status=new Map<number,{chilled:boolean;frozen:boolean}>();
  const owned=new Set(augments);
  const host:AbilityHost={player:()=>player,targets:()=>targets.filter(t=>t.health>0),visible:()=>true,traverse:()=>true,
    movePlayer:(x,y)=>{player.x+=x;player.y+=y;},damage:(t,n)=>{hits.push({id:t.id,damage:n});const live=targets.find(a=>a.id===t.id)!;live.health-=n;return live.health<=0;},
    statuses:id=>status.get(id)??{chilled:false,frozen:false},status:(t,kind)=>{const old=status.get(t.id);status.set(t.id,{chilled:!!old?.chilled||kind==='chill'||kind==='freeze',frozen:!!old?.frozen||kind==='freeze'});},
    launch:()=>{},arc:()=>{},has:id=>owned.has(id),reload:()=>{},emit:(e,x,y)=>events.push({...e,x,y})};
  const system=new AbilitySystem(host);system.setRig(rig,1);system.setIntent(0,0,{x:100,y:0});
  return {system,player,targets,events,hits,host,status,owned};
}
