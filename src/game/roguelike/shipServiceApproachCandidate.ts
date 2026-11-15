import {SHIP_FINAL_PARTITION_PLANS} from './shipFinalPartitions';
import {defineShipRoom,point,breachFeature,type ShipPlan} from './shipArchitecturePlan';

/** Dormant, single predeclared service-entry experiment on reviewed659 bays.
 * Preserve every solid/aperture/arena/count; distribute insulated rear spawns
 * across real transverse entries rather than merging at one gantry mouth. */
const diagnostic=SHIP_FINAL_PARTITION_PLANS['diagnostic-gallery'];
const workshop=SHIP_FINAL_PARTITION_PLANS['infested-workshop'];
export const SHIP_SERVICE_APPROACH_CANDIDATE:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'diagnostic-gallery':Object.freeze({...diagnostic,
  topology:defineShipRoom({...diagnostic.topology,
   breaches:diagnostic.topology.breaches.map((p,i)=>i===1?point(1180,360):p),
  }),
  breachFeatures:Object.freeze(diagnostic.breachFeatures.map((f,i)=>i===1?breachFeature('Starboard transverse service door',1280,360):f)),
 }),
 'infested-workshop':Object.freeze({...workshop,
  topology:defineShipRoom({...workshop.topology,
   breaches:workshop.topology.breaches.map((p,i)=>i===1?point(1180,600):i===3?point(800,940):p),
  }),
  breachFeatures:Object.freeze(workshop.breachFeatures.map((f,i)=>i===1?breachFeature('East gantry service door',1280,600):i===3?breachFeature('Rear service hull vent',800,1000):f)),
 }),
});
