import {afterAll,describe,it,expect} from 'vitest';
import {canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {L8_FAMILIES,L8_STEP_MS} from './helpers/l8SimulationHarness';
import {BAFFLE_MARKS,baffleArena,dispatchBreach,writeBaffleReport} from './helpers/l8SwarmBaffleHarness';
const native:unknown[]=[],crowds:unknown[]=[],comparison:unknown[]=[];
afterAll(()=>{writeBaffleReport('native-family-opportunities.json',native);writeBaffleReport('opening-and-space-crowds.json',crowds);writeBaffleReport('ranged-comparison.json',comparison);});
function opportunity(family:typeof L8_FAMILIES[number],base:boolean,point:{x:number;y:number},requestedIndex:number,productionFallback:boolean){
 const {game,movement}=baffleArena(point,base),requested=game.geometry.breaches[requestedIndex],breach=productionFallback?dispatchBreach(game.geometry,point,requested):requested;
 const start={x:breach.x+(breach.facing==='east'?56:-56),y:breach.y};expect(game['spawn'](family,start.x,start.y),JSON.stringify({family,point,start,base})).toBe(true);
 let atMs:number|null=null,criterion='',firstProjectileLineMs:number|null=null,firstVisibleMs:number|null=null;
 const initial=game.enemies.snapshot.enemies[0],initialVisible=hasClearExpeditionShot(game.geometry,initial,point),initialProjectileLine=canTraverseExpedition(game.geometry,initial,point,9);
 for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){
  const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);const enemy=game.enemies.snapshot.enemies[0];
  if(firstProjectileLineMs===null&&canTraverseExpedition(game.geometry,enemy,point,9))firstProjectileLineMs=elapsed+L8_STEP_MS;
  if(firstVisibleMs===null&&hasClearExpeditionShot(game.geometry,enemy,point))firstVisibleMs=elapsed+L8_STEP_MS;
  if(events.some(e=>e.type==='contact-attack')){atMs=elapsed+L8_STEP_MS;criterion='native contact attack';break;}
  if(family==='spitter'&&events.some(e=>e.type==='hazard-attack')&&canTraverseExpedition(game.geometry,enemy,point,9)){atMs=elapsed+L8_STEP_MS;criterion='native completed spit with R9 projectile clearance';break;}
  if(family==='carrier'&&Math.hypot(enemy.x-point.x,enemy.y-point.y)<=260&&hasClearExpeditionShot(game.geometry,enemy,point)){atMs=elapsed+L8_STEP_MS;criterion='native visible carrier holding range';break;}
 }
 const end=game.enemies.snapshot.enemies[0];return {variant:base?'baseline':'baffle',point,family,requested:requested.id,used:breach.id,start,initial,initialVisible,initialProjectileLine,atMs,criterion,firstProjectileLineMs,firstVisibleMs,end,distanceAtOpportunity:Math.hypot(end.x-point.x,end.y-point.y)};
}
describe('Dormant Swarm baffles native attack and mixed crowd access',()=>{
 it.each(BAFFLE_MARKS)('all families reach native opportunity at $name ($point.x,$point.y)',({name,point})=>{
  const failures:unknown[]=[];
  for(const family of L8_FAMILIES)for(let i=0;i<4;i++){const row={anchor:name,...opportunity(family,false,point,i,true)};native.push(row);if(row.atMs===null)failures.push(row);}
  expect(failures,JSON.stringify(failures)).toEqual([]);
 },30000);
 it.each(BAFFLE_MARKS)('production-dispatched mixed crowd reaches $name ($point.x,$point.y)',({name,point})=>{
  const {game,movement}=baffleArena(point),dispatches:unknown[]=[];
  for(const requested of game.geometry.breaches){const safe=dispatchBreach(game.geometry,point,requested);for(const family of L8_FAMILIES){expect(game['spawn'](family,safe.x+(safe.facing==='east'?56:-56),safe.y)).toBe(true);dispatches.push({family,requested:requested.id,used:safe.id});}}
  const initial=game.enemies.snapshot.enemies,waiting=new Set(initial.map(e=>e.id));expect(initial).toHaveLength(20);let lastOpportunityMs=0;
  for(let elapsed=0;elapsed<60000&&waiting.size;elapsed+=L8_STEP_MS){
   const before=movement.begin();game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);
   for(const e of game.enemies.snapshot.enemies)if(Math.hypot(e.x-point.x,e.y-point.y)<600&&hasClearExpeditionShot(game.geometry,point,e)&&waiting.delete(e.id)){lastOpportunityMs=elapsed+L8_STEP_MS;const death=game.enemies.applyDamage(e.id,Math.ceil(e.health+e.armor));expect(death.applied).toBe(true);expect(death.died).toBe(true);}
  }
  const unresolved=game.enemies.snapshot.enemies.filter(e=>waiting.has(e.id)),row={anchor:name,point,initial:initial.length,cleared:initial.length-waiting.size,lastOpportunityMs,dispatches,unresolved};crowds.push(row);expect(unresolved,JSON.stringify(row)).toEqual([]);expect(game.enemies.activeCount).toBe(0);
 },30000);
 it('records exact before/after ranged approach and first native opportunity without assuming Slam-range entry',()=>{
  const targets=[{name:'north arena',x:600,y:400},{name:'open gallery',x:600,y:520},{name:'port inner cover',x:464,y:400},{name:'starboard inner cover',x:736,y:400}];
  const failures:unknown[]=[];
  for(const target of targets)for(const family of ['spitter','carrier'] as const)for(let i=0;i<4;i++)for(const base of [true,false]){
   const row={anchor:target.name,...opportunity(family,base,target,i,false)};comparison.push(row);if(row.atMs===null)failures.push(row);
  }
  expect(failures,JSON.stringify(failures)).toEqual([]);expect(comparison).toHaveLength(64);
 },60000);
 it('retains the original chamfer-fringe native attack controls',()=>{
  const controls:unknown[]=[],failures:unknown[]=[];
  for(const point of [{x:440,y:330},{x:760,y:330}])for(const family of ['brute','stalker'] as const)for(let i=0;i<4;i++){
   const row=opportunity(family,true,point,i,true);controls.push(row);if(row.atMs===null)failures.push(row);
  }
  writeBaffleReport('original-fringe-controls.json',controls);expect(failures,JSON.stringify(failures)).toEqual([]);
 },30000);
 it('replays every native crowded frame and event deterministically',()=>{
  const run=()=>{const point={x:600,y:400},{game,movement}=baffleArena(point);for(const requested of game.geometry.breaches){const safe=dispatchBreach(game.geometry,point,requested);for(const family of L8_FAMILIES)expect(game['spawn'](family,safe.x+(safe.facing==='east'?56:-56),safe.y)).toBe(true);}const frames:string[]=[];
   for(let tick=0;tick<120;tick++){const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);frames.push(JSON.stringify({bodies:game.enemies.snapshot.enemies,events}));}return frames;};expect(run()).toEqual(run());
 });
});
