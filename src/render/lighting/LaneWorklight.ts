type Pin=[number,number];
const terminals:Record<string,Pin>={
  'relay-racks':[414,476],'service-shaft-landing':[203,198],armory:[572,668],
  'transmission-chamber':[677,535],'crew-checkpoint':[433,414],
  'shielding-gate':[669,505],'manual-control-chamber':[659,573],'coolant-plant':[417,450],
};
export function laneTerminal(id:string):Pin|undefined{return terminals[id];}
