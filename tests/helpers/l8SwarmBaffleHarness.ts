import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {SHIP_SWARM_BAFFLE_CANDIDATE} from '../../src/game/roguelike/shipSwarmBaffleCandidate';
import {SHIP_SWARM_BAY_340_ARENA400_CANDIDATE} from '../../src/game/roguelike/shipArchitectureSwarmBayCandidate';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates';
import {L8_STORY,l8Arena} from './l8SimulationHarness';
export const SWARM_ID='swarm-junction';
export const SWARM_NODE=L8_STORY.find(n=>n.templateId===SWARM_ID)!;
export const BAFFLE_PLAN=SHIP_SWARM_BAFFLE_CANDIDATE[SWARM_ID],BASE_PLAN=SHIP_SWARM_BAY_340_ARENA400_CANDIDATE[SWARM_ID];
export const BAFFLE_TEMPLATE={...ROOM_TEMPLATES[SWARM_ID],...BAFFLE_PLAN.topology},BASE_TEMPLATE={...ROOM_TEMPLATES[SWARM_ID],...BASE_PLAN.topology};
const seen=new Set<string>();
export const BAFFLE_MARKS=[{name:'entry',point:BAFFLE_TEMPLATE.spawn},{name:'exit',point:BAFFLE_TEMPLATE.exit},{name:'arena',point:BAFFLE_PLAN.arena},...BAFFLE_PLAN.spaces.map(s=>({name:s.name,point:s.anchor})),...BAFFLE_PLAN.openings.map(o=>({name:'opening '+o.a+' ↔ '+o.b,point:{x:(o.from.x+o.to.x)/2,y:(o.from.y+o.to.y)/2}})),...[
 ['original north mouth',600,360],['original port chamfer fringe',440,330],['original starboard chamfer fringe',760,330],['port outer baffle',376,400],['port inner baffle',464,400],['starboard outer baffle',824,400],['starboard inner baffle',736,400],['port lower baffle tip',416,500],['starboard lower baffle tip',784,500],['port north bank front fringe',280,360],['starboard north bank front fringe',920,360],
].map(([name,x,y])=>({name:name as string,point:{x:x as number,y:y as number}}))].filter(m=>{const key=`${m.point.x},${m.point.y}`;if(seen.has(key))return false;seen.add(key);return true;});
export const baffleArena=(point:{x:number;y:number},base=false)=>l8Arena(SWARM_NODE,point,base?BASE_TEMPLATE:BAFFLE_TEMPLATE);
/** Match production when the marine occupies an entrance; dense tests still
 * route all raw native entrances independently without this fallback. */
export function dispatchBreach(g:ReturnType<typeof baffleArena>['game']['geometry'],point:{x:number;y:number},requested:typeof g.breaches[number]){
 return Math.hypot(requested.x-point.x,requested.y-point.y)>240?requested:[...g.breaches].sort((a,b)=>Math.hypot(b.x-point.x,b.y-point.y)-Math.hypot(a.x-point.x,a.y-point.y))[0];
}
export function writeBaffleReport(name:string,rows:unknown){
 const dir=process.env.L8_SWARM_BAFFLE_REPORT_DIR;if(!dir)return;mkdirSync(dir,{recursive:true});
 const geometry={baseline:{plan:BASE_PLAN,template:BASE_TEMPLATE},candidate:{plan:BAFFLE_PLAN,template:BAFFLE_TEMPLATE}};
 writeFileSync(join(dir,name),JSON.stringify(rows,null,2)+'\n');writeFileSync(join(dir,name.replace(/\.json$/,'-geometry.json')),JSON.stringify({sha256:createHash('sha256').update(JSON.stringify(geometry)).digest('hex'),...geometry},null,2)+'\n');
}
