import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import type {RoomTemplate} from '../../src/game/roguelike/types';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {expect} from 'vitest';
import {DepthGame} from '../../src/DepthGame';
import {EnemySystem,type EnemySnapshot} from '../../src/game/enemies/EnemySystem';
import {progressionFor} from '../../src/game/roguelike/progression';
import {generateRun} from '../../src/game/roguelike/run';
import {SHIP_ARCHITECTURE_PLANS} from '../../src/game/roguelike/shipArchitectureLayouts';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {canOccupyExpedition,canTraverseExpedition,createExpeditionGeometry,createRoomTemplateGeometry,hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
export const L8_STORY=generateRun(1729,3).nodes;
export const L8_FAMILIES=['crawler','brute','spitter','stalker','carrier'] as const;
export const L8_STEP_MS=50;
export const l8Plan=(id:typeof L8_STORY[number]['templateId'])=>SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS]!;
export const L8_SPACE_CASES=L8_STORY.flatMap(node=>{
 const plan=l8Plan(node.templateId);
 return [{anchor:'entry',point:plan.topology.spawn},{anchor:'exit',point:plan.topology.exit},{anchor:'crowd arena',point:plan.arena},...plan.spaces.map(s=>({anchor:s.name,point:s.anchor}))].map(sample=>({node,...sample}));
});
/** All accepted collision legs are recorded: a legal multi-leg corner slide is
 * neither rejected as an endpoint shortcut nor silently allowed to cross cover. */
export function watchL8Movement(game:DepthGame){
 const accepted=new Map<number,Map<string,Set<string>>>(),key=(p:{x:number;y:number})=>`${p.x},${p.y}`;
 game.enemies=new EnemySystem({balance:progressionFor(game.node),canSeePlayer:(a,b)=>hasClearExpeditionShot(game.geometry,a,b),launched:id=>game['mutations'].isLaunched(id),
  canAttack:(a,b)=>(a.type==='spitter'?canTraverseExpedition(game.geometry,a,b,9):hasClearExpeditionShot(game.geometry,a,b))&&!game.abilities.blocksMovement(a,b,0),
  route:(enemy,target)=>game.navigation.waypoint(enemy,target,1),canMove:context=>{
   const from={x:context.fromX,y:context.fromY},to={x:context.toX,y:context.toY},legal=canTraverseExpedition(game.geometry,from,to,context.radius)&&!game.abilities.blocksMovement(from,to,context.radius);
   if(legal){let edges=accepted.get(context.enemyId);if(!edges)accepted.set(context.enemyId,edges=new Map());let ends=edges.get(key(from));if(!ends)edges.set(key(from),ends=new Set());ends.add(key(to));}return legal;
  }});
 return {begin(){accepted.clear();return game.enemies.snapshot.enemies;},assert(before:readonly EnemySnapshot[]){
  for(const enemy of game.enemies.snapshot.enemies){
   expect(canOccupyExpedition(game.geometry,enemy,enemy.radius),`${game.node.templateId} ${enemy.type} ${enemy.id} body clearance`).toBe(true);
   const old=before.find(body=>body.id===enemy.id);if(!old)continue;
   const start=key(old),goal=key(enemy),seen=new Set([start]),queue=[start],edges=accepted.get(enemy.id);
   for(let i=0;i<queue.length&&!seen.has(goal);i++)for(const next of edges?.get(queue[i])??[])if(!seen.has(next)){seen.add(next);queue.push(next);}
   expect(seen.has(goal),`${game.node.templateId} ${enemy.type} ${enemy.id}: no accepted swept-leg path ${start}→${goal}`).toBe(true);
  }
 }};
}
export function l8Arena(node:typeof L8_STORY[number],point:{x:number;y:number},template?:RoomTemplate){
 const game=new DepthGame();game.node=node;game.geometry=template?createRoomTemplateGeometry(template,node.id):createExpeditionGeometry(node);game.navigation=new FacilityNavigation(game.geometry);const movement=watchL8Movement(game);
 Object.assign(game.player,point);expect(canOccupyExpedition(game.geometry,game.player,16),`${node.templateId} target ${point.x},${point.y}`).toBe(true);
 return {game,movement};
}
export function spawnL8Cohort(game:DepthGame){
 const initial:EnemySnapshot[]=[];
 for(const breach of game.geometry.breaches)for(const family of L8_FAMILIES){
  const p={x:breach.x+(breach.facing==='east'?56:-56),y:breach.y};expect(game['spawn'](family,p.x,p.y),`${game.node.templateId} ${family} ${breach.id}`).toBe(true);initial.push(game.enemies.snapshot.enemies.at(-1)!);
 }
 expect(initial.length).toBeGreaterThanOrEqual(20);return initial;
}

/** Store the exact immutable template/metadata objects used by this test worker,
 * rather than inferring geometry identity from a moving shared-worktree HEAD. */
export function writeL8Report(name:string,rows:unknown){
 const dir=process.env.L8_SIM_REPORT_DIR;if(!dir)return;mkdirSync(dir,{recursive:true});
 const rooms=L8_STORY.map(node=>({id:node.templateId,template:ROOM_TEMPLATES[node.templateId],plan:l8Plan(node.templateId)})),serialized=JSON.stringify(rooms);
 writeFileSync(join(dir,name),JSON.stringify(rows,null,2)+'\n');
 writeFileSync(join(dir,name.replace(/\.json$/,'-geometry.json')),JSON.stringify({sha256:createHash('sha256').update(serialized).digest('hex'),rooms},null,2)+'\n');
}
