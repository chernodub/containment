import {SHIP_ACT3_CANDIDATE_V1} from './shipArchitectureAct3CandidateV1';
import {defineShipRoom,rectangles,type ShipPlan} from './shipArchitecturePlan';
/** Reviewed V1.1: close the unused one-ended strip with real bench machinery. */
const workshop=SHIP_ACT3_CANDIDATE_V1['infested-workshop'];
export const SHIP_ACT3_CANDIDATE_V11:Readonly<Record<string,ShipPlan>>=Object.freeze({
 ...SHIP_ACT3_CANDIDATE_V1,
 'infested-workshop':Object.freeze({...workshop,topology:defineShipRoom({...workshop.topology,
  obstacles:rectangles([[260,0,300,160],[40,800,420,200],[1120,200,160,280],[900,800,220,200]]),
 })}),
});
