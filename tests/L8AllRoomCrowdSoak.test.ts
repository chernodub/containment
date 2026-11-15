import {afterAll,describe,it,expect} from 'vitest';
import {hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {L8_STORY,L8_SPACE_CASES,L8_STEP_MS,l8Arena,spawnL8Cohort,writeL8Report} from './helpers/l8SimulationHarness';
const rows:unknown[]=[];
afterAll(()=>writeL8Report('named-space-crowds.json',rows));
describe('L8 all20 native named-space crowd liveness',()=>{
 it('covers all20 activated story geometries and every named sub-space',()=>{expect(L8_STORY).toHaveLength(20);expect(new Set(L8_SPACE_CASES.map(c=>c.node.templateId)).size).toBe(20);});
 it.each(L8_SPACE_CASES)('$node.templateId crowd reaches $anchor within60s',({node,anchor,point})=>{
  const {game,movement}=l8Arena(node,point),initial=spawnL8Cohort(game),waiting=new Set(initial.map(e=>e.id)),opportunities:{id:number;family:string;atMs:number}[]=[];
  // Same finite-fight contract as A3: exposed front blockers are resolved via
  // ordinary full health+armor damage. Native carrier child requests are not
  // dispatched; this is geometry liveness, not a campaign completion result.
  for(let elapsed=0;elapsed<60000&&waiting.size;elapsed+=L8_STEP_MS){
   const before=movement.begin();game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);
   for(const enemy of game.enemies.snapshot.enemies)if(Math.hypot(enemy.x-point.x,enemy.y-point.y)<600&&hasClearExpeditionShot(game.geometry,point,enemy)&&waiting.delete(enemy.id)){
    opportunities.push({id:enemy.id,family:enemy.type,atMs:elapsed+L8_STEP_MS});const death=game.enemies.applyDamage(enemy.id,Math.ceil(enemy.health+enemy.armor));expect(death.applied).toBe(true);expect(death.died).toBe(true);
   }
  }
  const unresolved=game.enemies.snapshot.enemies.filter(e=>waiting.has(e.id)),row={room:node.templateId,anchor,point,initial:initial.length,cleared:opportunities.length,lastOpportunityMs:Math.max(0,...opportunities.map(o=>o.atMs)),unresolved,opportunities};rows.push(row);
  expect(unresolved,JSON.stringify(row)).toEqual([]);expect(opportunities).toHaveLength(initial.length);expect(game.enemies.activeCount).toBe(0);
 },20000);
});
