import {SHIP_ACT3_CANDIDATE_V1} from './shipArchitectureAct3CandidateV1';
import {defineShipRoom,rectangles,type ShipPlan} from './shipArchitecturePlan';
/** Reviewed V1.1: close the unused one-ended strip with real bench machinery. */
const workshop=SHIP_ACT3_CANDIDATE_V1['infested-workshop'];
export const SHIP_ACT3_CANDIDATE_V11:Readonly<Record<string,ShipPlan>>=Object.freeze({
 ...SHIP_ACT3_CANDIDATE_V1,
 'infested-workshop':Object.freeze({...workshop,topology:defineShipRoom({...workshop.topology,
  // P11 north-east machine: nearest corner152 units from arena centre650,500
  // (R144); west/east circulation gaps162/226 units. Presentation-owned solid.
  obstacles:rectangles([[260,0,300,160],[40,800,420,200],[1120,200,160,280],[900,800,220,200],[746,310,148,72]]),
 })}),
});
