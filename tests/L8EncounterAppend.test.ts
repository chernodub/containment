import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {generateRun} from '../src/game/roguelike/run';
import {createEncounterPlan,EncounterDirector} from '../src/game/waves/EncounterDirector';

const seeds=[1729,2718,31415,42,137,8675309,2026,9001,65537,123456,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,2646007777,2400273476,1420519048,926231573,3293539470,302625857,3031516705,315632507,3763819556,1353316589,2570684887,2825160470,676147701,1074335564,1576486972,719510212,1190535481,3640216177,3344254954,2595108862];
const rooms=[
 {depth:6,id:'freight-hold',before:18,after:19,cap:12,oldTail:3000,tail:3500},
 {depth:9,id:'transmission-chamber',before:32,after:34,cap:14,oldTail:23900,tail:25400},
 {depth:10,id:'diagnostic-gallery',before:27,after:29,cap:15,oldTail:4230,tail:4410},
 {depth:11,id:'safety-interlock-station',before:28,after:30,cap:15,oldTail:4320,tail:4500},
 {depth:16,id:'shielding-gate',before:31,after:33,cap:15,oldTail:4400,tail:4580},
];
const breachIds=['north','south','east','west'];
describe('L8 measured encounter appends remain finite seeded native requests',()=>{
 for(const spec of rooms)it(spec.id+' appends exactly '+(spec.after-spec.before)+' at the original cadence across the fixed40 seeds',()=>{
  for(const seed of seeds){const node=generateRun(seed).nodes[spec.depth],options={seed,node,breachIds},p=createEncounterPlan(options);
   expect(node.templateId).toBe(spec.id);expect(p).toEqual(createEncounterPlan(options));expect(Object.isFrozen(p.schedule)).toBe(true);
   expect(p.totalSpawns).toBe(spec.after);expect(p.concurrentCap).toBe(spec.cap);expect(p.schedule[0].atMs).toBe(650);expect(p.schedule[spec.before-1].atMs).toBe(spec.oldTail);expect(p.schedule.at(-1)!.atMs).toBe(spec.tail);
   for(const [index,r]of p.schedule.entries()){expect(r.spawnId).toBe(`${node.id}:spawn-${index}`);expect(breachIds).toContain(r.breachId);expect(r.atMs).toBe(650+(spec.depth===9?index*750:Math.floor(index/6)*(1050-Math.floor(spec.depth/5)*100)+(index%6)*90));}
   const director=new EncounterDirector(options);director.start();let dispatched=0;
   while(director.snapshot.remaining){const next=director.update(60000,0);expect(next.length).toBeGreaterThan(0);dispatched+=next.filter(e=>e.type==='spawn-request').length;expect(director.phase).toBe('combat');}
   expect(dispatched).toBe(spec.after);expect(director.update(0,1)).toEqual([]);expect(director.phase).toBe('combat');expect(director.update(0,0).some(e=>e.type==='room-clear')).toBe(true);
  }
 });
 it('retains every original200-plan prefix, all other rooms and original request fields',()=>{
  const primary=seeds.slice(0,10),plans=primary.flatMap(seed=>generateRun(seed).nodes.map(node=>{const p=createEncounterPlan({seed,node,breachIds}),spec=rooms.find(s=>s.id===node.templateId),append=spec?spec.after-spec.before:0;return{...p,totalSpawns:p.totalSpawns-append,schedule:p.schedule.slice(0,p.totalSpawns-append)};}));
  expect(createHash('sha256').update(JSON.stringify(plans)).digest('hex')).toBe('5e75648612329a47605d2b4c7c979b4e629aa08639d684fd67a4e01a999b0333');
 });
 it('pins all40 Freight original request prefixes and the single seeded append',()=>{
  const plans=seeds.map(seed=>{const node=generateRun(seed).nodes[6];return createEncounterPlan({seed,node,breachIds});});
  const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
  expect(digest(plans.map(p=>({...p,totalSpawns:18,schedule:p.schedule.slice(0,18)})))).toBe('8f8dfe48935c25eac337ce1d293dad4311a4065bd4297f825e61d93b3cb45298');
  expect(digest(plans)).toBe('9c73f7fe01486484bc807f995ab9fd90b0d441da850173201f9194cfe820605f');
 });
});
