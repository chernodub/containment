export type IncidentLaneLayout = readonly [sourceX:number, sourceZ:number, endX:number, endZ:number];
export const incidentLanes:Readonly<Record<string,IncidentLaneLayout>> = {
  'awakening-bay':[640,295,935,432],
  'passenger-vault':[380,551,211,458],
  'residential-gallery':[531,432,651,480],
  'communal-atrium':[554,412,365,487],
  'freight-hold':[480,468,741,725],
  'breached-loading-bay':[599,618,652,718],
  'diagnostic-gallery':[382,423,583,496],
  'safety-interlock-station':[509,453,391,504],
  'infested-workshop':[577,319,680,483],
  'swarm-junction':[552,432,637,549],
  'containment-annulus':[551,508,390,542],
  'overload-floor':[589,508,365,574],
};
