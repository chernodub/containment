import {SHIP_ACT4_PLANS} from './shipArchitectureAct4';
import {defineShipRoom,point as p,polygon as poly,spaceBox as space,opening as gate,breachFeature as feature,type ShipPlan} from './shipArchitecturePlan';

/** Dormant proposal only. Existing northern airway banks advance into view;
 * their inner faces leave a real352-unit service throat with two144-unit lanes.
 * The original southern banks and R144 fight circle remain untouched. */
const original=SHIP_ACT4_PLANS['swarm-junction'];
const topology=defineShipRoom({...original.topology,
 voids:[
  poly([[160,0],[424,0],[424,270],[394,300],[160,300]]),
  poly([[776,0],[1040,0],[1040,300],[806,300],[776,270]]),
  ...original.topology.voids!.slice(2),
 ],
 breaches:poly([[280,400],[920,400],[280,780],[920,780]]),
});
export const SHIP_SWARM_BAY_CANDIDATE:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'swarm-junction':{
  ...original,topology,
  spaces:[space('Port approach',0,320,320,400,100,520),space('Growth crossing',320,320,560,400,600,520),space('Hull exit',880,320,320,400,1100,520),space('North airway',424,0,352,320,600,160),space('South airway',160,720,880,140,600,790)],
  openings:[
   gate('Port approach','Growth crossing',320,344,320,488),gate('Port approach','Growth crossing',320,560,320,720),
   gate('Growth crossing','Hull exit',880,344,880,488),gate('Growth crossing','Hull exit',880,560,880,720),
   gate('North airway','Growth crossing',456,320,600,320),gate('North airway','Growth crossing',600,320,744,320),
   gate('South airway','Growth crossing',440,720,760,720),gate('South airway','Port approach',160,720,320,720),gate('South airway','Hull exit',880,720,1040,720),
  ],
  breachFeatures:[feature('Port north growth tear',280,300),feature('Starboard north vent',920,300),...original.breachFeatures.slice(2)],
 },
});

/** Cheap prospective depth study. Not registered and not native/cohort certified. */
const depth340=defineShipRoom({...topology,
 voids:[poly([[160,0],[424,0],[424,310],[394,340],[160,340]]),poly([[776,0],[1040,0],[1040,340],[806,340],[776,310]]),...topology.voids!.slice(2)],
 breaches:poly([[280,440],[920,440],[280,780],[920,780]]),
});
export const SHIP_SWARM_BAY_340_CANDIDATE:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'swarm-junction':{
  ...SHIP_SWARM_BAY_CANDIDATE['swarm-junction'],topology:depth340,
  spaces:[space('Port approach',0,320,320,400,100,520),space('Growth crossing',320,360,560,360,600,520),space('Hull exit',880,320,320,400,1100,520),space('North airway',424,0,352,360,600,180),space('South airway',160,720,880,140,600,790)],
  openings:[gate('Port approach','Growth crossing',320,384,320,528),gate('Port approach','Growth crossing',320,560,320,720),gate('Growth crossing','Hull exit',880,384,880,528),gate('Growth crossing','Hull exit',880,560,880,720),gate('North airway','Growth crossing',456,360,600,360),gate('North airway','Growth crossing',600,360,744,360),gate('South airway','Growth crossing',440,720,760,720),gate('South airway','Port approach',160,720,320,720),gate('South airway','Hull exit',880,720,1040,720)],
  breachFeatures:[feature('Port north growth tear',280,340),feature('Starboard north vent',920,340),...original.breachFeatures.slice(2)],
 },
});

/** Actual combat-throat studies: player/arena data, never camera overrides. */
export const SHIP_SWARM_BAY_340_ARENA400_CANDIDATE:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'swarm-junction':{...SHIP_SWARM_BAY_340_CANDIDATE['swarm-junction'],arena:p(600,400)},
});
export const SHIP_SWARM_BAY_340_ARENA420_CANDIDATE:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'swarm-junction':{...SHIP_SWARM_BAY_340_CANDIDATE['swarm-junction'],arena:p(600,420)},
});
