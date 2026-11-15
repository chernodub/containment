import {afterAll,describe,it,expect} from 'vitest';
import {L8_STORY,L8_STEP_MS,l8Arena,writeL8Report} from './helpers/l8SimulationHarness';
const rows:unknown[]=[];
afterAll(()=>writeL8Report('native-edge-contacts.json',rows));
/** A closest grid center is not itself the contact target. Native Engagement
 * must still choose/route to a legal berth at this cabinet's rounded corner. */
describe('L8 native contact at a dense marine edge regression',()=>{
 it.each([0,1,2])('Awakening Brute breach%i reaches marine128,688 within60s',index=>{
  const node=L8_STORY.find(n=>n.templateId==='awakening-bay')!,{game,movement}=l8Arena(node,{x:128,y:688}),breach=game.geometry.breaches[index];
  expect(game['spawn']('brute',breach.x+(breach.facing==='east'?56:-56),breach.y)).toBe(true);let contact=false,atMs:number|null=null;
  for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);if(events.some(e=>e.type==='contact-attack')){contact=true;atMs=elapsed+L8_STEP_MS;break;}}
  rows.push({room:node.templateId,point:{x:128,y:688},breach:breach.id,contact,atMs,end:game.enemies.snapshot.enemies[0]});
  expect(contact,JSON.stringify(game.enemies.snapshot.enemies)).toBe(true);
 });
});
