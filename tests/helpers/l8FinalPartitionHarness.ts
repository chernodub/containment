import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {SHIP_FINAL_PARTITION_PLANS as plans} from '../../src/game/roguelike/shipFinalPartitions';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {L8_STORY,l8Arena} from './l8SimulationHarness';
export const PARTITION_NODES=L8_STORY.filter(n=>plans[n.templateId]);
export const partitionPlan=(id:string)=>plans[id];
export const partitionTemplate=(node:typeof L8_STORY[number])=>({...ROOM_TEMPLATES[node.templateId],...plans[node.templateId].topology});
export const PARTITION_CASES=PARTITION_NODES.flatMap(node=>{
 const plan=plans[node.templateId],extra=node.templateId==='diagnostic-gallery'?[{anchor:'rear instrument pocket',point:{x:960,y:80}}]:node.templateId==='infested-workshop'?[{anchor:'rear loading pocket',point:{x:144,y:80}}]:[];
 return [{anchor:'entry',point:plan.topology.spawn},{anchor:'exit',point:plan.topology.exit},{anchor:'crowd arena',point:plan.arena},...plan.spaces.map(s=>({anchor:s.name,point:s.anchor})),...extra].map(sample=>({node,...sample}));
});
export const partitionArena=(node:typeof L8_STORY[number],point:{x:number;y:number})=>l8Arena(node,point,partitionTemplate(node));
export function writePartitionReport(name:string,rows:unknown){
 const dir=process.env.L8_PARTITION_REPORT_DIR;if(!dir)return;mkdirSync(dir,{recursive:true});
 const rooms=PARTITION_NODES.map(node=>({id:node.templateId,template:partitionTemplate(node),plan:plans[node.templateId]})),serialized=JSON.stringify(rooms);
 writeFileSync(join(dir,name),JSON.stringify(rows,null,2)+'\n');
 writeFileSync(join(dir,name.replace(/\.json$/,'-geometry.json')),JSON.stringify({sha256:createHash('sha256').update(serialized).digest('hex'),rooms},null,2)+'\n');
}
