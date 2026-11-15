import {afterAll,describe,it,expect} from 'vitest';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {canTraverseExpedition,hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {L8_FAMILIES,L8_STEP_MS} from './helpers/l8SimulationHarness';
import {PARTITION_CASES as L8_SPACE_CASES,partitionArena as l8Arena,writePartitionReport as writeL8Report} from './helpers/l8FinalPartitionHarness';
const rows:unknown[]=[];
afterAll(()=>writeL8Report('native-family-opportunities.json',rows));
describe('Dormant physical-partition native family attack and holding access',()=>{
 it.each(L8_SPACE_CASES)('$node.templateId every breach/family reaches native opportunity at $anchor',({node,anchor,point})=>{
  const failures:unknown[]=[];
  for(const family of L8_FAMILIES){
   // Test each initial family independently so attack berths are not held by
   // an immortal front line. The mixed-crowd fixture checks finite fights.
   const {game,movement}=l8Arena(node,point);
   for(const breach of game.geometry.breaches){
    game.enemies.reset();game.navigation=new FacilityNavigation(game.geometry);
    const start={x:breach.x+(breach.facing==='east'?56:-56),y:breach.y};expect(game['spawn'](family,start.x,start.y),`${family} ${breach.id}`).toBe(true);
    let atMs:number|null=null,criterion='';
    for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){
     const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);
     const enemy=game.enemies.snapshot.enemies[0];
     if(events.some(e=>e.type==='contact-attack')){atMs=elapsed+L8_STEP_MS;criterion='native contact attack';break;}
     if(family==='spitter'&&events.some(e=>e.type==='hazard-attack')&&canTraverseExpedition(game.geometry,enemy,point,9)){atMs=elapsed+L8_STEP_MS;criterion='native completed spit with projectile-radius sightline';break;}
     // Carrier is deliberately a ranged holder in Engagement. Its supported
     // geometry contract is visible170-ish holding access, not melee contact.
     if(family==='carrier'&&Math.hypot(enemy.x-point.x,enemy.y-point.y)<=260&&hasClearExpeditionShot(game.geometry,enemy,point)){atMs=elapsed+L8_STEP_MS;criterion='native visible carrier holding range';break;}
    }
    const row={room:node.templateId,anchor,point,family,breach:breach.id,start,atMs,criterion,end:game.enemies.snapshot.enemies[0]};rows.push(row);if(atMs===null)failures.push(row);
   }
  }
  expect(failures,JSON.stringify(failures)).toEqual([]);
 },30000);
});
