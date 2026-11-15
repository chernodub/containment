import {SHIP_ACT2_PLANS} from './shipArchitectureAct2';
import {breachFeature,defineShipRoom,polygon,type ShipPlan} from './shipArchitecturePlan';

const transmission=SHIP_ACT2_PLANS['transmission-chamber'];
/** Prospective ingress-spacing experiment; the defensive nave and encounters stay exact. */
export const SHIP_TRANSMISSION_CANDIDATE:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'transmission-chamber':Object.freeze({...transmission,
  topology:defineShipRoom({...transmission.topology,
   breaches:polygon([[260,120],[1120,120],[100,600],[960,800]]),
  }),
  breachFeatures:Object.freeze([
   breachFeature('Uplink port vent',200,120),
   breachFeature('Uplink starboard door',1200,120),
   breachFeature('Service airlock door',0,600),
   breachFeature('South service vent',1040,800),
  ]),
 }),
});
