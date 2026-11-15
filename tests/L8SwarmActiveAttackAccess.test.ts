import {afterAll,describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../src/game/roguelike/shipArchitectureLayouts';
import {canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {L8_STORY,L8_STEP_MS,l8Arena} from './helpers/l8SimulationHarness';
const id='swarm-junction',node=L8_STORY.find(n=>n.templateId===id)!,template=ROOM_TEMPLATES[id];
const samples=[{face:'left inner',at:416,sign:1},{face:'left outer',at:408,sign:-1},{face:'right inner',at:784,sign:-1},{face:'right outer',at:792,sign:1}].flatMap(face=>[16,24,32].flatMap(gap=>[416,432,448].map(y=>({face:face.face,gap,point:{x:face.at+face.sign*gap,y}}))));
const rows:unknown[]=[];
afterAll(()=>{
 const dir=process.env.L8_ACTIVE_SWARM_REPORT_DIR;if(!dir)return;mkdirSync(dir,{recursive:true});
 const geometry={template,plan:SHIP_ARCHITECTURE_PLANS[id]};
 writeFileSync(join(dir,'active-swarm-face-access.json'),JSON.stringify(rows,null,2)+'\n');
 writeFileSync(join(dir,'active-swarm-face-geometry.json'),JSON.stringify({sha256:createHash('sha256').update(JSON.stringify(geometry)).digest('hex'),...geometry},null,2)+'\n');
});
/** These are the36 legal marine positions that rejected the dormant baffle
 * proposal. Exercise current active templates, never that proposal. */
describe('Active Swarm native attack access along retained face-probe positions',()=>{
 it('retains all36 admitted legal marine positions',()=>{
  expect(samples).toHaveLength(36);expect(new Set(samples.map(s=>`${s.point.x},${s.point.y}`)).size).toBe(36);
  const {game}=l8Arena(node,template.spawn,template);expect(game.geometry.breaches).toHaveLength(4);
  for(const sample of samples)expect(canOccupyExpedition(game.geometry,sample.point,16),JSON.stringify(sample)).toBe(true);
 });
 it.each(samples)('$face gap$gap ($point.x,$point.y) admits Brute/Stalker attacks from every production-dispatched entrance',sample=>{
  const failures:unknown[]=[];
  for(const family of ['brute','stalker'] as const)for(let requestedIndex=0;requestedIndex<4;requestedIndex++){
   const {game,movement}=l8Arena(node,sample.point,template),requested=game.geometry.breaches[requestedIndex];
   // Preserve the exact production240-unit occupied-entrance fallback used by
   // the matched rejected-proposal comparison. Every requested entrance counts.
   const used=Math.hypot(requested.x-sample.point.x,requested.y-sample.point.y)>240?requested:[...game.geometry.breaches].sort((a,b)=>Math.hypot(b.x-sample.point.x,b.y-sample.point.y)-Math.hypot(a.x-sample.point.x,a.y-sample.point.y))[0];
   const start={x:used.x+(used.facing==='east'?56:-56),y:used.y};expect(game['spawn'](family,start.x,start.y),JSON.stringify({sample,family,requested:requested.id,used:used.id})).toBe(true);
   const initial=game.enemies.snapshot.enemies[0];let atMs:number|null=null;
   for(let elapsed=0;elapsed<60000;elapsed+=L8_STEP_MS){
    const before=movement.begin(),events=game.enemies.update(L8_STEP_MS,game.player);movement.assert(before);
    if(events.some(event=>event.type==='contact-attack')){atMs=elapsed+L8_STEP_MS;break;}
   }
   const row={...sample,family,requested:requested.id,used:used.id,start,initial,atMs,end:game.enemies.snapshot.enemies[0]};rows.push(row);if(atMs===null)failures.push(row);
  }
  expect(failures,JSON.stringify(failures)).toEqual([]);
 },30000);
});
