import {describe,it,expect} from 'vitest';
import {generateRun} from '../src/game/roguelike/run';
import {SHIP_ARCHITECTURE_LAYOUTS} from '../src/game/roguelike/shipArchitectureLayouts';
import {shipNavigationErrors} from '../src/game/roguelike/shipPlanChecks';
import {canOccupyExpedition,canTraverseExpedition,createExpeditionGeometry} from '../src/game/world/expeditionGeometry';

const nodes=generateRun(1729,3).nodes.filter(n=>Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,n.templateId));
/** Dense floor samples include narrow marine-only edges; actor goals are legal
 * contact positions, not an impossible demand to put a Brute inside a wall. */
describe('L8 ship architecture clearance',()=>{
 it.each(nodes)('$templateId has one connected radius32 circulation field with legal continuous sweeps',node=>{
  const g=createExpeditionGeometry(node),step=16,cols=Math.ceil(g.bounds.width/16)+1,marks=new Map<number,{x:number;y:number}>();
  for(let y=32;y<g.bounds.height;y+=step)for(let x=32;x<g.bounds.width;x+=step)if(canOccupyExpedition(g,{x,y},32))marks.set(y/step*cols+x/step,{x,y});
  const start=[...marks.keys()].sort((a,b)=>Math.hypot(marks.get(a)!.x-g.playerSpawn.x,marks.get(a)!.y-g.playerSpawn.y)-Math.hypot(marks.get(b)!.x-g.playerSpawn.x,marks.get(b)!.y-g.playerSpawn.y))[0];
  const seen=new Set([start]),queue=[start];
  for(let i=0;i<queue.length;i++)for(const d of [-1,1,-cols,cols]){const a=queue[i],b=a+d;if(marks.has(b)&&!seen.has(b)&&canTraverseExpedition(g,marks.get(a)!,marks.get(b)!,32)){seen.add(b);queue.push(b);}}
  expect(seen.size,`${node.templateId} disconnected radius32 cells`).toBe(marks.size);
  for(const p of [g.playerSpawn,g.exitPoint,...g.breaches,...g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y}))])expect(canOccupyExpedition(g,p,32),JSON.stringify(p)).toBe(true);
 });
 it.each(nodes)('$templateId routes all enemy radii from each breach to a dense grid of marine positions',node=>{
  expect(shipNavigationErrors(createExpeditionGeometry(node))).toEqual([]);
 },60000);
});
