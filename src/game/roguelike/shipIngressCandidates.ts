import {SHIP_STANDARD_PLANS} from './shipArchitectureStandards';
import {SHIP_ACT3_PLANS} from './shipArchitectureAct3';
import {SHIP_ACT4_PLANS} from './shipArchitectureAct4';
import {defineShipRoom,polygon,breachFeature,type ShipPlan} from './shipArchitecturePlan';

/** Separately authored ingress overrides, validated before registry activation.
 * Geometry, furniture, route anchors and save formats match the base plans.
 * Activation is owned by the integration registry, never by this module. */
function ingress(base:ShipPlan,raw:readonly (readonly [number,number])[],mounts:readonly (readonly [string,number,number])[]):ShipPlan{
 return Object.freeze({...base,topology:defineShipRoom({...base.topology,breaches:polygon(raw)}),breachFeatures:Object.freeze(mounts.map(([name,x,y])=>breachFeature(name,x,y)))});
}
export const SHIP_INGRESS_CANDIDATE_PLANS:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'residential-gallery':ingress(SHIP_STANDARD_PLANS['residential-gallery'],
  //600/80 would face west: native544/80 has only34 clearance to the bed.
  //592 faces east to648/80, preserving furniture and the requested R38 stress.
  [[592,80],[1030,80],[200,880],[1030,880]],
  [['N2 rear locker vent',600,40],['N3 rear locker vent',1030,40],['S1 rear locker vent',200,920],['S3 rear locker vent',1030,920]]),
 'crew-checkpoint':ingress(SHIP_STANDARD_PLANS['crew-checkpoint'],
  [[380,160],[980,120],[380,720],[980,760]],
  [['Inspection north rear vent',380,120],['North bypass rear door',1080,120],['Inspection south rear vent',380,760],['South bypass rear door',1080,760]]),
 'diagnostic-gallery':ingress(SHIP_ACT3_PLANS['diagnostic-gallery']!,
  [[600,80],[960,80],[456,880],[960,880]],
  [['Recorder rear header vent',600,40],['Instrument rear header vent',960,40],['Service rear header vent',456,920],['Return rear header vent',960,920]]),
 'safety-interlock-station':ingress(SHIP_ACT3_PLANS['safety-interlock-station']!,
  [[160,80],[1100,80],[360,880],[920,880]],
  [['Recorder port rear vent',160,40],['AI starboard rear vent',1080,40],['Battery port return vent',360,920],['Battery starboard return vent',920,920]]),
 'shielding-gate':ingress(SHIP_ACT4_PLANS['shielding-gate'],
  [[704,200],[980,120],[300,840],[704,920]],
  [['North power service vent',704,160],['Inspection cabinet rear vent',848,120],['Sterilization rear door',300,880],['Shield return rear door',704,960]]),
});
