// Native ship units. These solids wear the authored incident meshes. Keeping
// them separate from architectural obstacles avoids generating a stock cabinet
// or cutting a hole in the floor underneath the prop.
import {rectangles} from './shipArchitecturePlan';
import type {Rect} from './types';

export const INCIDENT_OBSTACLES: Readonly<Record<string, readonly Rect[]>> = Object.freeze({
  'awakening-bay': rectangles([[447,216,376,166]]),
  'passenger-vault': rectangles([[300,519,94,99],[376,575,113,67]]),
  'residential-gallery': rectangles([[297,259,168,84]]),
  'communal-atrium': rectangles([[501,378,110,64]]),
  'crew-checkpoint': rectangles([[600,349,122,22]]),
  'armory': rectangles([[341,586,66,40]]),
  'freight-hold': rectangles([[419,413,110,70]]),
  'breached-loading-bay': rectangles([[483,416,129,90]]),
  'relay-racks': rectangles([[572,371,95,106]]),
  'transmission-chamber': rectangles([[832,453,78,45]]),
  'diagnostic-gallery': rectangles([[428,302,94,71]]),
  'safety-interlock-station': rectangles([[467,325,59,40]]),
  'coolant-plant': rectangles([[200,287,258,48]]),
  'service-shaft-landing': rectangles([[330,340,54,256]]),
  'infested-workshop': rectangles([[493,261,192,93]]),
  'swarm-junction': rectangles([[235,530,203,69]]),
  'shielding-gate': rectangles([[377,322,178,88]]),
  'containment-annulus': rectangles([[534,465,29,92]]),
  'manual-control-chamber': rectangles([[366,536,128,70],[442,632,65,52]]),
  'overload-floor': rectangles([[436,304,181,84]]),
});
