import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {roomValueProfile} from './RoomValueStandard';

type Pin=[number,number];
const terminals:Record<string,Pin>={
  'relay-racks':[414,476],'service-shaft-landing':[203,198],armory:[572,668],
  'transmission-chamber':[677,535],'crew-checkpoint':[433,414],
  'shielding-gate':[669,505],'manual-control-chamber':[659,573],'coolant-plant':[417,450],
};
export function laneTerminal(id:string):Pin|undefined{return terminals[id];}


/** Follow the original machine's direction from the arena to its service light. */
export function laneWorklight(id:string){
  const source=roomValueProfile(id)?.landmark;
  const arena=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS]?.arena;
  if(!source||!arena)return;
  const dx=source.at[0]-arena.x,dz=source.at[1]-arena.y;
  const reach=Math.min(1,92/Math.max(1,Math.hypot(dx,dz)));
  const [x,z]=laneTerminal(id)??[arena.x+dx*reach,arena.y+dz*reach];
  const color=id==='manual-control-chamber'?0x9acbbb:source.color;
  return {x:x+9,z:z-10,color,y:.76,angle:Math.atan2(arena.x-x,arena.y-z)};
}
