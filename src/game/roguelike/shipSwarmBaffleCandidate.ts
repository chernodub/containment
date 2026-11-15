import {SHIP_SWARM_BAY_340_ARENA400_CANDIDATE} from './shipArchitectureSwarmBayCandidate';
import {defineShipRoom,polygon,spaceBox,point,type ShipPlan} from './shipArchitecturePlan';
/** Dormant counterplay study. Attached8-unit vent returns interrupt the northern
 * raw approach sightlines. The inner chamfers and small inward doglegs retain
 * native attack berths on both sides of the original fringes;
 * all source reservations and southern banks persist.
 * Open circulation planes are not declared physical doorways. */
const base=SHIP_SWARM_BAY_340_ARENA400_CANDIDATE['swarm-junction'];
export const SHIP_SWARM_BAFFLE_CANDIDATE:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'swarm-junction':Object.freeze({...base,
  topology:defineShipRoom({...base.topology,voids:[
   polygon([[160,0],[424,0],[424,310],[408,326],[408,384],[416,400],[416,460],[408,460],[408,404],[400,388],[400,340],[160,340]]),
   polygon([[776,0],[1040,0],[1040,340],[800,340],[800,388],[792,404],[792,460],[784,460],[784,400],[792,384],[792,326],[776,310]]),
   ...base.topology.voids!.slice(2),
  ]}),
  spaces:Object.freeze(base.spaces.map(s=>s.name==='Port approach'?spaceBox(s.name,0,320,300,400,s.anchor.x,s.anchor.y):s.name==='Growth crossing'?spaceBox(s.name,300,360,600,360,s.anchor.x,s.anchor.y):s.name==='Hull exit'?spaceBox(s.name,900,320,300,400,s.anchor.x,s.anchor.y):s)),
  openings:Object.freeze(base.openings.map(o=>Object.freeze({...o,from:point(o.from.x===320?300:o.from.x===880?900:o.from.x,o.from.y),to:point(o.to.x===320?300:o.to.x===880?900:o.to.x,o.to.y)}))),
 }),
});
