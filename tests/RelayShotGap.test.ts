import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {DepthGame} from '../src/DepthGame';
import {ProjectileHitTracker} from '../src/game/combat/CombatSystem';
import {generateRun} from '../src/game/roguelike/run';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {createExpeditionGeometry,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
import {shipArchitectureRoom} from '../src/render/world/ShipArchitectureRoom';
import {disposeModel} from '../src/render/models';
const node=generateRun(1729,3).nodes.find(n=>n.templateId==='relay-racks')!;
function fire(y:number,reverse:boolean){
 const game=new DepthGame();game.node=node;game.geometry=createExpeditionGeometry(node);game.enemies.reset();game.status='playing';
 Object.assign(game.player,{x:reverse?885:395,y,angle:reverse?Math.PI:0});
 game.combat.switchWeapon('pistol');const request=game.combat.fire(game.player.angle)[0];expect(request).toBeDefined();
 const bullet={x:game.player.x,y,life:2,kind:'player' as const,request,tracker:new ProjectileHitTracker(request.penetration)};game.bullets=[bullet];
 for(let i=0;i<Math.ceil(490/request.speed/.01)+3&&game.bullets.length&&(reverse?bullet.x>395:bullet.x<885);i++)game['updateBullets'](.01);
 return reverse?bullet.x<=395:bullet.x>=885;
}
describe('Room9 physical service-spine south gap',()=>{
 it.each([false,true])('passes a production pistol through y704 in direction %s, with solid and open controls',reverse=>{
  expect(fire(704,reverse)).toBe(true);
  expect(fire(500,reverse)).toBe(false);
  expect(fire(740,reverse)).toBe(true);
 });
 it('keeps the whole raised central fixture outside the swept pistol corridor, independently of muzzle height',()=>{
  const model=shipArchitectureRoom('relay-racks',ROOM_TEMPLATES['relay-racks'])!;model.updateMatrixWorld(true);
  try{
   const bounds=new T.Box3().setFromObject(model.getObjectByName('relay-fixture-4')!);
   // Production pistol radius4: y704 has a southern silhouette boundary of700.
   expect(bounds.max.z*32).toBeLessThanOrEqual(700.001);
   expect(bounds.max.y).toBeGreaterThan(.6); // Retain raised equipment rather than flattening it.
  }finally{disposeModel(model);}
 });
 it('does not turn the narrow pistol clearance into a route through the fixture',()=>{
  const geometry=createExpeditionGeometry(node);
  for(const radius of [16,28,38])expect(canTraverseExpedition(geometry,{x:395,y:704},{x:885,y:704},radius)).toBe(false);
  expect(ROOM_TEMPLATES['relay-racks'].obstacles).toHaveLength(6);
 });
});
