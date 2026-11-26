import {incidentLanes} from './IncidentLaneLayouts';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {roomValueProfile} from './RoomValueStandard';

type Pin=[number,number];
const terminals:Record<string,Pin>={
  'relay-racks':[414,476],'service-shaft-landing':[203,198],armory:[572,668],
  'transmission-chamber':[677,535],'crew-checkpoint':[433,414],
  'shielding-gate':[669,505],'manual-control-chamber':[659,573],'coolant-plant':[417,450],
};
export function laneTerminal(id:string):Pin|undefined{const layout=incidentLanes[id];return layout?[layout[2],layout[3]]:terminals[id];}


/** Follow the original machine's direction from the arena to its service light. */
export function laneWorklight(id:string){
  const source=roomValueProfile(id)?.landmark;
  const arena=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS]?.arena;
  if(!source||!arena)return;
  const dx=source.at[0]-arena.x,dz=source.at[1]-arena.y;
  const reach=Math.min(1,92/Math.max(1,Math.hypot(dx,dz)));
  const [x,z]=laneTerminal(id)??[arena.x+dx*reach,arena.y+dz*reach];
  const color=id==='manual-control-chamber'?0x9acbbb:source.color;
  return {x:x+9,z:z-10,color,y:.76,angle:Math.atan2(source.at[0]-x,source.at[1]-z)};
}

// The second housing is fastened to the receiver flange or the split pipe header.
// It uses the existing landmark key and a baked spill, leaving combat slots available.
export function landmarkHousing(id:string){
  if(id==='awakening-bay')return {x:164,z:467,y:.68,color:0x99ddf2,angle:.72};
  if(id==='transmission-chamber')return {x:820,z:486,y:1.08,color:0xa2ceff,angle:-1.20};
  if(id==='coolant-plant')return {x:378,z:326,y:.92,color:0xb7eafa,angle:.32};
  const landmark=roomValueProfile(id)?.landmark,end=laneTerminal(id);
  if(!landmark||!end)return;
  const [x,z]=landmark.at;
  const angle=Math.atan2(end[0]-x,end[1]-z);
  return {x:x+16*Math.sin(angle),z:z+16*Math.cos(angle),y:Math.min(1.65,landmark.height??1),color:landmark.color,angle};
}
