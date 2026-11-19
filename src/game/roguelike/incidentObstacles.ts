// Native ship units. These solids wear the authored incident meshes. Keeping
// them separate from architectural obstacles avoids generating a stock cabinet
// or cutting a hole in the floor underneath the prop.
import {rectangles} from './shipArchitecturePlan';
import type {Rect} from './types';

export const INCIDENT_OBSTACLES: Readonly<Record<string, readonly Rect[]>> = Object.freeze({
  'awakening-bay': rectangles([[447,220,376,98],[465,333,74,49]]),
  'passenger-vault': rectangles([[300,519,94,97],[380,583,109,56]]),
  'residential-gallery': rectangles([[297,259,168,73]]),
  'communal-atrium': rectangles([[503,383,107,57]]),
  'crew-checkpoint': rectangles([[648,342,78,22],[718,342,51,17]]),
  'armory': rectangles([[341,586,66,40]]),
  'freight-hold': rectangles([[419,413,110,69]]),
  'breached-loading-bay': rectangles([[531,408,129,90]]),
  'relay-racks': rectangles([[599,372,66,103]]),
  'transmission-chamber': rectangles([[832,453,34,45],[838,453,72,33]]),
  'diagnostic-gallery': rectangles([[428,302,94,69]]),
  'safety-interlock-station': rectangles([[473,325,53,35],[467,355,28,10]]),
  'coolant-plant': rectangles([[209,288,143,29],[337,294,112,38]]),
  'service-shaft-landing': rectangles([[337,435,26,68],[330,514,24,56]]),
  'infested-workshop': rectangles([[496,266,96,81],[605,281,79,43]]),
  'swarm-junction': rectangles([[252,530,160,63]]),
  'shielding-gate': rectangles([[401,314,154,28],[377,330,61,56]]),
  'containment-annulus': rectangles([[534,465,28,56],[534,537,28,20]]),
  'manual-control-chamber': rectangles([[366,539,128,60],[451,621,51,41]]),
  'overload-floor': rectangles([[436,304,181,84]]),
});
