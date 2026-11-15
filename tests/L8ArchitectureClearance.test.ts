import {describe,it,expect} from 'vitest';
import {generateRun} from '../src/game/roguelike/run';
import {SHIP_ARCHITECTURE_LAYOUTS} from '../src/game/roguelike/shipArchitectureLayouts';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
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
  const g=createExpeditionGeometry(node);
  for(let y=48;y<g.bounds.height;y+=80)for(let x=48;x<g.bounds.width;x+=80){
   const goal={x,y};if(!canOccupyExpedition(g,goal,16))continue;
   for(const radius of [14,18,24,28]){
    const nav=new FacilityNavigation(g);
    for(const b of g.breaches){
     const p={x:b.x+(b.facing==='east'?56:-56),y:b.y,radius};let arrived=false;
     for(let i=0;i<900;i++){
      if(Math.hypot(p.x-x,p.y-y)<=radius+16+8&&canTraverseExpedition(g,p,goal,0)){arrived=true;break;}
      const q=nav.waypoint(p,goal,1)??goal,d=Math.hypot(q.x-p.x,q.y-p.y);if(d<1e-6)break;
      const n={x:p.x+(q.x-p.x)/d*Math.min(8,d),y:p.y+(q.y-p.y)/d*Math.min(8,d)};
      if(!canTraverseExpedition(g,p,n,radius))break;Object.assign(p,n);
     }
     expect(arrived,`${node.templateId} radius${radius} breach${b.id} → ${x},${y}; stopped ${p.x},${p.y}`).toBe(true);
    }
   }
  }
 },60000);
});
