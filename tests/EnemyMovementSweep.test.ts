import {describe,it,expect} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
const node=generateRun(1729,3).nodes.find(n=>n.templateId==='shielding-gate')!;
function fixture(x:number,y:number){
 const game=new DepthGame();game.node=node;game.geometry=createExpeditionGeometry(node);game.enemies=game['makeEnemies']();
 const result=game.enemies.spawn('spitter',x,y);if(!result.spawned)throw Error('Legal spitter fixture must spawn');
 return {game,id:result.enemy.id,before:game.enemies.getSnapshot(result.enemy.id)!};
}
describe('production enemy swept movement',()=>{
 it('does not knock a spitter across the redesigned Shielding Gate corner into a legal endpoint',()=>{
  // The old sourceaa4 corner is now buried in a hull-backed bank. This
  // fixture straddles the real new bank corner560/340: both radius18 endpoints
  // remain legal while the diagonal sweep cuts the solid; sliding must survive.
  const from={x:580,y:330},to={x:550,y:360};
  const {game,id,before}=fixture(from.x,from.y);
  expect(canOccupyExpedition(game.geometry,from,before.radius)).toBe(true);
  expect(canOccupyExpedition(game.geometry,to,before.radius)).toBe(true);
  expect(canTraverseExpedition(game.geometry,from,to,before.radius)).toBe(false);
  const result=game.damage(id,20,{x:to.x-from.x,y:to.y-from.y});
  const after=game.enemies.getSnapshot(id)!;
  expect(result.applied).toBe(true);expect(after.health).toBe(before.health-20);
  expect(canTraverseExpedition(game.geometry,before,after,before.radius)).toBe(true);
  expect(Math.hypot(after.x-before.x,after.y-before.y)).toBeGreaterThan(0); // Retain a legal sliding fallback.
 });
 it('retains ordinary knockback and damage in open floor',()=>{
  const {game,id,before}=fixture(100,440);
  game.damage(id,20,{x:12,y:9});const after=game.enemies.getSnapshot(id)!;
  expect(after.x).toBeCloseTo(112);expect(after.y).toBeCloseTo(449);expect(after.health).toBe(before.health-20);
  expect(canTraverseExpedition(game.geometry,before,after,before.radius)).toBe(true);
 });
});
