import {SHIP_INGRESS_CANDIDATE_PLANS} from './shipIngressCandidates';
import {SHIP_ACT3_CANDIDATE_V11} from './shipArchitectureAct3CandidateV11';
import {defineShipRoom,point as p,partition as wall,spaceBox as space,opening as gate,type ShipPlan,type ShipOpening} from './shipArchitecturePlan';
import type {Point} from './types';
/** Dormant structural revision. This module never registers or mutates a live
 * template. A broad workbay mouth has two lanes, not two claimed doors. */
export type PartitionAperture=Readonly<{name:string;kind:'wide workbay mouth'|'door';from:Point;to:Point;lanes:readonly ShipOpening[]}>;
const aperture=(name:string,kind:PartitionAperture['kind'],from:Point,to:Point,lanes:readonly ShipOpening[]):PartitionAperture=>Object.freeze({name,kind,from,to,lanes:Object.freeze(lanes)});
const diagnosticBase=SHIP_INGRESS_CANDIDATE_PLANS['diagnostic-gallery'];
const workshopBase=SHIP_ACT3_CANDIDATE_V11['infested-workshop'];
const safetyBase=SHIP_INGRESS_CANDIDATE_PLANS['safety-interlock-station'];
const diagnosticMouths=Object.freeze([
 aperture('Port to return service side door','door',p(572,680),p(572,820),[gate('Port service workbay','Return service workbay',572,680,572,820)]),
 aperture('Recorder to instrument side door','door',p(532,160),p(532,300),[gate('Recorder workbay','Instrument workbay',532,160,532,300)]),
 aperture('Recorder workbay front','wide workbay mouth',p(200,308),p(520,308),[gate('Recorder workbay','Diagnostic nave',200,308,340,308),gate('Recorder workbay','Diagnostic nave',380,308,520,308)]),
 aperture('Instrument workbay front','wide workbay mouth',p(544,308),p(840,308),[gate('Instrument workbay','Diagnostic nave',544,308,684,308),gate('Instrument workbay','Diagnostic nave',700,308,840,308)]),
 aperture('Port service workbay front','wide workbay mouth',p(200,672),p(560,672),[gate('Port service workbay','Diagnostic nave',200,672,360,672),gate('Port service workbay','Diagnostic nave',400,672,560,672)]),
 aperture('Return service workbay front','wide workbay mouth',p(584,672),p(1080,672),[gate('Return service workbay','Diagnostic nave',584,672,804,672),gate('Return service workbay','Diagnostic nave',860,672,1080,672)]),
]);
const workshopMouths=Object.freeze([
 aperture('Loading to lathe side door','door',p(260,180),p(260,320),[gate('Loading dock','Lathe service workbay',260,180,260,320)]),
 aperture('Loading to work threshold','wide workbay mouth',p(260,340),p(260,640),[gate('Loading dock','Work floor',260,340,260,480),gate('Loading dock','Work floor',260,500,260,640)]),
 aperture('Lathe service workbay front','wide workbay mouth',p(272,324),p(560,324),[gate('Lathe service workbay','Work floor',272,324,412,324),gate('Lathe service workbay','Work floor',420,324,560,324)]),
 aperture('Tool workbay front','wide workbay mouth',p(584,288),p(876,288),[gate('Tool workbay','Work floor',584,288,724,288),gate('Tool workbay','Work floor',736,288,876,288)]),
 aperture('Gantry workbay front','wide workbay mouth',p(888,300),p(888,600),[gate('Work floor','Gantry workbay',888,300,888,440),gate('Work floor','Gantry workbay',888,460,888,600)]),
 aperture('Rear service workbay front','wide workbay mouth',p(484,812),p(876,812),[gate('Work floor','Rear service workbay',484,812,664,812),gate('Work floor','Rear service workbay',696,812,876,812)]),
]);
const safetyDoors=Object.freeze([
 aperture('Interlock cage west door','door',p(520,400),p(520,560),[gate('Port inspection','Interlock cage',520,400,520,560)]),
 aperture('Interlock cage east door','door',p(776,400),p(776,560),[gate('Interlock cage','Starboard gallery',776,400,776,560)]),
]);
export const SHIP_PARTITION_APERTURES:Readonly<Record<string,readonly PartitionAperture[]>>=Object.freeze({'diagnostic-gallery':diagnosticMouths,'infested-workshop':workshopMouths,'safety-interlock-station':safetyDoors});
export const SHIP_FINAL_PARTITION_PLANS:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'diagnostic-gallery':Object.freeze({...diagnosticBase,
  topology:defineShipRoom({...diagnosticBase.topology,
   // Actual three-sided cutaway workbays. The right separator moves20units,
   // rather than24, retaining R38 clearance at native904/80 behind it.
   voids:[wall(40,0,1200,40),wall(40,920,1200,40),wall(520,40,24,120),wall(520,300,24,20),wall(840,40,24,280),wall(560,660,24,20),wall(560,820,24,100),
    wall(176,220,24,100),wall(176,660,24,80),wall(1080,660,24,80),wall(200,40,60,90)],
  }),
  spaces:Object.freeze([space('Diagnostic nave',200,320,880,340,620,480),space('Recorder workbay',200,130,320,190,360,230),space('Instrument workbay',544,40,296,280,692,200),space('Port service workbay',200,660,360,260,380,780),space('Return service workbay',584,660,496,260,900,760),space('Port access landing',0,320,200,320,100,480),space('Starboard access landing',1080,320,200,320,1180,480)]),
  openings:Object.freeze([...diagnosticMouths.flatMap(m=>m.lanes),gate('Port access landing','Diagnostic nave',200,320,200,460),gate('Port access landing','Diagnostic nave',200,500,200,640),gate('Diagnostic nave','Starboard access landing',1080,320,1080,460),gate('Diagnostic nave','Starboard access landing',1080,500,1080,640)]),
  bays:Object.freeze([{space:'Port access landing',from:p(0,320),to:p(0,640)},{space:'Starboard access landing',from:p(1280,320),to:p(1280,640)}]),
 }),
 'infested-workshop':Object.freeze({...workshopBase,
  topology:defineShipRoom({...workshopBase.topology,
   // Keep all four V11 source machinery reservations. Connected cheeks make
   // a real loading threshold; the gantry is an open-front service workbay.
   // Fill its former60-unit L interior, not an extra equipment island.
   voids:[wall(560,0,24,340),wall(1020,440,100,120),wall(460,800,24,200),wall(248,160,24,20),wall(248,320,24,20),wall(248,640,24,160),wall(876,0,24,300),wall(876,600,24,400)],
  }),
  spaces:Object.freeze([space('Loading dock',0,0,248,800,100,500),space('Work floor',272,300,604,500,650,500),space('Lathe service workbay',272,160,288,180,416,230),space('Tool workbay',584,0,292,300,800,180),space('Gantry workbay',900,0,380,800,1180,640),space('Rear service workbay',484,800,392,200,650,880)]),
  openings:Object.freeze(workshopMouths.flatMap(m=>m.lanes)),
  bays:Object.freeze([{space:'Loading dock',from:p(0,240),to:p(0,760)},{space:'Gantry workbay',from:p(1280,200),to:p(1280,760)}]),
 }),
 'safety-interlock-station':Object.freeze({...safetyBase,
  // This is an open instrumentation gallery, not two enclosed booths. The
  // two-ended cage remains the actual enclosure; no unnecessary collider edit.
  spaces:Object.freeze(safetyBase.spaces.map(s=>s.name==='Recorder and AI booths'?Object.freeze({...s,name:'Open recorder and AI gallery'}):s)),
  openings:Object.freeze(safetyBase.openings.map(o=>o.a==='Interlock cage'||o.b==='Interlock cage'?(o.a==='Port inspection'?safetyDoors[0].lanes[0]:safetyDoors[1].lanes[0]):Object.freeze({...o,a:o.a==='Recorder and AI booths'?'Open recorder and AI gallery':o.a,b:o.b==='Recorder and AI booths'?'Open recorder and AI gallery':o.b}))),
 }),
});
