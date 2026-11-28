// Half extents in receiver radii, taper toward the source (negative Z),
// and number of louvre openings across the throw.
type Aperture = readonly [width:number, depth:number, taper:number, openings:number];
const apertures:Record<string,Aperture>={
  'awakening-bay':[1.12,.65,.3,2], 'passenger-vault':[.48,1.5,0,1],
  'residential-gallery':[1,.78,.53,1], 'communal-atrium':[1.25,.77,0,3],
  'crew-checkpoint':[1.34,.79,0,1], armory:[.82,1.02,.42,2],
  'freight-hold':[1.75,.42,0,1], 'breached-loading-bay':[.70,1.32,.38,1],
  'relay-racks':[.85,1.16,0,3], 'transmission-chamber':[1.48,.65,.4,1],
  'diagnostic-gallery':[.68,1.26,0,2], 'safety-interlock-station':[1.24,.78,.28,1],
  'coolant-plant':[1.30,.62,0,2], 'service-shaft-landing':[.82,1.12,.62,1],
  'infested-workshop':[1.34,.64,.28,2], 'swarm-junction':[.92,1.05,0,4],
  'shielding-gate':[.54,1.53,0,1], 'containment-annulus':[1.16,.86,.49,1],
  'manual-control-chamber':[1.38,.58,0,2], 'overload-floor':[1.08,1.34,.76,1],
};
export const arenaAperture=(id:string):Aperture=>apertures[id]??[1,1,0,1];
