import {describe,it,expect,vi} from 'vitest';
import {EnemySystem} from '../../src/game/enemies/EnemySystem';
import {DepthGame} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {createExpeditionGeometry,createRoomTemplateGeometry} from '../../src/game/world/expeditionGeometry';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../../src/game/roguelike/shipArchitectureLayouts';
import historical from '../fixtures/l8-historical-navigation.json';
import type {RoomTemplate} from '../../src/game/roguelike/types';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {canOccupyExpedition,canTraverseExpedition} from '../../src/game/world/expeditionGeometry';

// Fresh bounded fixtures for the illegal-retreat class; not historical replay equality.
function scene(start:{x:number;y:number},player:{x:number;y:number},specials=true,elite=false,room?:string,frozen=false){
 const game=new DepthGame();if(room)game.node=generateRun(1729,3).nodes.find(n=>n.templateId===room)!;if(!specials)game.node={...game.node,id:'legacy-test'};
 game.geometry={...game.geometry,bounds:{x:0,y:0,width:1200,height:880},blockers:[],boundary:[{x:0,y:0},{x:1200,y:0},{x:1200,y:880},{x:0,y:880}],voids:undefined};
 if(room)game.geometry=frozen?createRoomTemplateGeometry({...ROOM_TEMPLATES[game.node.templateId],boundary:undefined,voids:undefined,...historical.templates[room as keyof typeof historical.templates]} as RoomTemplate,game.node.id+':historical'):createExpeditionGeometry(game.node);
 game.navigation=new FacilityNavigation(game.geometry);game.enemies=game['makeEnemies']();Object.assign(game.player,player);game.status='playing';
 expect(canOccupyExpedition(game.geometry,start,18),'legal initial spitter').toBe(true);expect(canOccupyExpedition(game.geometry,player,16),'legal marine fixture').toBe(true);
 const spawn=game.enemies.spawn('spitter',start.x,start.y,elite);if(!spawn.spawned)throw Error('fixture spawn');
 return {game,id:spawn.enemy.id};
}
function reachesDamage(game:DepthGame,id:number){
 let projectileDamage=0,sawHazard=false;
 // Keep the single-spitter encounter controlled, but run the actual game frame,
 // including hurt cooldowns. Contact damage cannot satisfy this projectile witness.
 game['director'].update=()=>[];
 const enemiesUpdate=game.enemies.update.bind(game.enemies);
 game.enemies.update=(...args)=>{const events=enemiesUpdate(...args);sawHazard ||= events.some(e=>e.type==='hazard-attack');return events;};
 const projectileUpdate=game['updateBullets'].bind(game);
 game['updateBullets']=(...args)=>{
  const before=game.combat.snapshot.health+game.combat.snapshot.armor;
  projectileUpdate(...args);
  projectileDamage+=before-(game.combat.snapshot.health+game.combat.snapshot.armor);
 };
 for(let i=0;i<900&&projectileDamage===0;i++){
  const previous=game.enemies.getSnapshot(id)!;
  game.update(50);
  const current=game.enemies.getSnapshot(id)!;
  expect(canOccupyExpedition(game.geometry,current,current.radius)).toBe(true);
  expect(canTraverseExpedition(game.geometry,previous,current,current.radius)).toBe(true);
 }
 expect(sawHazard).toBe(true);expect(projectileDamage).toBeGreaterThan(0);
}
describe('spitter reachable firing positions',()=>{
 it.each([[true,false],[true,true],[false,false],[false,true]])('escapes an illegal west retreat, specials=%s elite=%s',(specials,elite)=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440},specials,elite);reachesDamage(game,id);
 });
 it.each([
  [{x:1100,y:440},{x:1000,y:440}],
  [{x:600,y:100},{x:600,y:200}],
  [{x:600,y:780},{x:600,y:680}],
 ])('finds a firing position beside another boundary (%j)',(start,player)=>{const {game,id}=scene(start,player);reachesDamage(game,id);});
 it('retains the clear firing-position control',()=>{const {game,id}=scene({x:100,y:200},{x:200,y:440});reachesDamage(game,id);});
 it('keeps a reachable alternate goal stable while approaching firing range',()=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440});
  const route=vi.spyOn(game.navigation,'waypoint');
  for(let i=0;i<8;i++)game.enemies.update(50,game.player);
  expect(route.mock.calls.length).toBeGreaterThan(1);
  const goals=route.mock.calls.map(([,goal])=>({x:goal.x,y:goal.y}));
  expect(goals.every(goal=>goal.x===goals[0].x&&goal.y===goals[0].y)).toBe(true);
  expect(game.enemies.getSnapshot(id)).not.toBeNull();
 });
 it('bounds repeated searches when every candidate is disconnected',()=>{
  const route=vi.fn((enemy:{x:number;y:number})=>enemy);
  const enemies=new EnemySystem({route,canMove:()=>true,canAttack:()=>true});
  expect(enemies.spawn('spitter',100,440,false).spawned).toBe(true);
  for(let i=0;i<20;i++)enemies.update(50,{x:200,y:440});
  expect(route.mock.calls.length).toBeLessThan(100);
 });

 // Fresh executions preserve documented Room17 coordinates on frozen baseline
 // geometry; current architecture has independent live native cases below.
 it.each([
  [{x:600,y:200},{x:600,y:300}],
  [{x:600,y:550},{x:600,y:500}],
  [{x:600,y:200},{x:240,y:395}],
  [{x:600,y:550},{x:240,y:395}],
  [{x:1044,y:780},{x:480,y:665}],
  [{x:156,y:780},{x:720,y:665}],
 ])('reaches actual damage in Room17 from %j toward %j',(start,player)=>{
  const {game,id}=scene(start,player,true,false,'shielding-gate',true);reachesDamage(game,id);
 });

 it('recovers after the player moves away from a cached firing goal',()=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440});
  for(let i=0;i<8;i++)game.enemies.update(50,game.player);
  Object.assign(game.player,{x:400,y:600});reachesDamage(game,id);
 });
 it('recovers after legal knockback changes the approach',()=>{
  const {game,id}=scene({x:100,y:440},{x:200,y:440});
  for(let i=0;i<8;i++)game.enemies.update(50,game.player);
  expect(game.enemies.moveBy(id,0,-60).blocked).toBe(false);reachesDamage(game,id);
 });

 // Frozen Room15 breach-to-anchor matrix; historical300-case bytes remain
 // unavailable. Keep its original geometry instead of moving this regression.
 it.each([{x:156,y:100},{x:1044,y:100},{x:156,y:780},{x:1044,y:780}].flatMap(start=>
  [{x:600,y:440},{x:600,y:100},{x:600,y:780},{x:200,y:440},{x:1100,y:440}].map(player=>[start,player])))
 ('reaches actual damage in Room15 from %j toward %j',(start,player)=>{
  const {game,id}=scene(start,player,true,false,'infested-workshop',true);reachesDamage(game,id);
 });

 // Native current-room damage, not just a firing-goal or observer witness.
 const liveCases=(['shielding-gate','infested-workshop'] as const).flatMap(room=>{
  const node=generateRun(1729,3).nodes.find(n=>n.templateId===room)!,g=createExpeditionGeometry(node);
  return g.breaches.flatMap(b=>SHIP_ARCHITECTURE_PLANS[room]!.spaces.map(space=>({room,space:space.name,start:{x:b.x+(b.facing==='east'?56:-56),y:b.y},player:space.anchor})));
 });
 it.each(liveCases)('reaches actual projectile damage on live $room toward $space from $start',({room,start,player})=>{
  const {game,id}=scene(start,player,true,false,room);reachesDamage(game,id);
 });

});
