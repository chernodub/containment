// Imported only by main.ts when ?debug=1. Production gameplay never installs these overrides.
import type {DepthGame,GameInput} from '../../src/DepthGame';
import type {DepthRenderer} from '../../src/render/DepthRenderer';
import {generateRun} from '../../src/game/roguelike/run';
import {restoreExpedition,completeExpeditionRoom,expeditionRewardOffers} from '../../src/game/roguelike/expedition';
import {serializeCheckpoint,parseCheckpoint} from '../../src/game/roguelike/checkpoints';
import {addMutation} from '../../src/game/roguelike/builds';
import {canOccupyExpedition,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {ENEMIES} from '../../src/game/enemies/catalog';
import type {StandardEnemyId} from '../../src/game/enemies/types';
import type {MutationId} from '../../src/game/roguelike/types';

export function installDebug(game:DepthGame,renderer:DepthRenderer,sync:()=>void,beforePrepare:()=>void){
 const update=game.update.bind(game),render=renderer.render.bind(renderer),hurt=game.hurt.bind(game),effect=renderer.effect.bind(renderer);
 const events:Array<{type:string;boon?:string;at:number}>=[];renderer.effect=e=>{events.push({type:e.type,boon:e.boon,at:game.elapsed});if(events.length>300)events.shift();effect(e);};
 let controls:GameInput={x:0,y:0,fire:false,angle:null,autoAim:true},immune=false,seed=Number(new URLSearchParams(location.search).get('seed')??1729);
 // RAF still owns resource recovery and diagnostics; only explicit steps advance time.
 game.update=()=>{};renderer.render=(g,_dt,menu)=>render(g,0,menu);
 game.hurt=n=>{if(!immune)hurt(n);};
 const refresh=()=>{render(game,0,game.status==='menu');sync();};
 const ready=async()=>{beforePrepare();await renderer.prepare(game.node);refresh();};
 const api={game,renderer,events,prepare:ready,
  async startRun(value=seed,options:{rigSelect?:boolean}={}){seed=value;controls={x:0,y:0,fire:false,angle:null,autoAim:true};game.newRun(seed,options);events.length=0;await ready();},
  async gotoRoom(templateId:string,options:{version?:1|2|3;phase?:'combat'|'reward'|'route'}={}){
   const version=options.version??3,nodes=generateRun(seed,version).nodes,index=nodes.findIndex(n=>n.templateId===templateId);
   if(index<0)throw Error(`Room ${templateId} is not in run v${version}`);
   game.newRun(seed);events.length=0;controls={x:0,y:0,fire:false,angle:null,autoAim:true};
   if(index===0)game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
   else{
    const target=nodes[index],path:typeof nodes[number][]=[];let cursor=target;while(cursor.depth>0){cursor=nodes.find(n=>n.depth===cursor.depth-1&&n.next.includes(cursor.id))!;if(!cursor)throw Error('No route to target');path.unshift(cursor);}
    const previous=path.at(-1)!,serialized=serializeCheckpoint({version:1,savedAt:0,run:{version,seed,currentNodeId:previous.id,completedNodeIds:path.map(n=>n.id),phase:'route'},build:{mutations:[]},resources:game.combat.getRunResources()});
    if(!serialized)throw Error(`Invalid checkpoint before ${templateId}`);
    game.expedition=restoreExpedition(parseCheckpoint(serialized)!);game.node=previous;game.status='route';
    if(previous.templateId==='manual-control-chamber')game.authorizeDestruction();else game.route(nodes[index].id);
   }
   if(game.node.templateId!==templateId)throw Error(`Route did not reach ${templateId}`);
   game.skipStory();await ready();
   if(options.phase&&options.phase!=='combat'){
    game.expedition=completeExpeditionRoom(game.expedition,game.combat.getRunResources());game.enemies.reset();game.bullets=[];game.pools=[];game.status='reward';
    if(options.phase==='route'){const offers=expeditionRewardOffers(game.expedition);if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();}
    refresh();
   }
  },
  grantBoons(ids:MutationId[]){let build=game.expedition.build;for(const id of ids)if(!build.mutations.includes(id))build=addMutation(build,id);game.expedition=Object.freeze({...game.expedition,build});game.combat.setBuild(build);refresh();},
  spawn(type:StandardEnemyId,x:number,y:number,elite=false){const radius=ENEMIES[type]?.radius;if(!radius||!canOccupyExpedition(game.geometry,{x,y},radius)||Math.hypot(x-game.player.x,y-game.player.y)<radius+game.player.radius+12)return false;const result=game.enemies.spawn(type,x,y,elite);return result.spawned?result.enemy.id:false;},
  canStand(x:number,y:number,radius=16){return canOccupyExpedition(game.geometry,{x,y},radius);},
  clearShot(x:number,y:number,from:{x:number;y:number}=game.player){return hasClearExpeditionShot(game.geometry,from,{x,y});},
  setInput(value:Partial<GameInput>){controls={...controls,...value};},
  step(ms:number){if(!Number.isFinite(ms)||ms<0||ms>60000)throw Error('step expects 0..60000 ms');if(renderer.roomLoading)throw Error('Room is still loading');for(let remaining=ms;remaining>1e-7;){const dt=Math.min(1000/60,remaining);update(dt,controls);render(game,dt/1000,game.status==='menu');remaining-=dt;}refresh();},
  invulnerable(value:boolean){immune=value;},
  refresh,
 };
 Object.defineProperty(window,'__containmentDebug',{value:api,configurable:true});
}
