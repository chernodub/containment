import * as T from 'three';
import type { OriginalKitInstance } from './OriginalShipKitAssets';
import {dress13ServiceIncidents} from './Dress13ServiceIncidents';

/** Consequences remain on existing solid machinery; no additional floor obstruction. */
export function p11IncidentPlacements(id: string): OriginalKitInstance[] {
  const result: OriginalKitInstance[] = dress13ServiceIncidents(id);
  const add = (asset: string, x: number, z: number, scale: number, y = 0) => result.push({
    pack: 'p11-incidents', asset,
    matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32), new T.Quaternion(), new T.Vector3(scale, scale, scale)),
    purpose: 'P11 / interrupted incident / ' + asset, cutaway: false,
  } satisfies OriginalKitInstance);
  if (id === 'service-shaft-landing') add('abandoned-winch-repair',420,330,1.1,.15);
  if (id === 'shielding-gate') add('failed-shield-leaves',460,300,1);
  if (id === 'containment-annulus') add('strained-containment-diaphragm',650,520,1.1,1.2);
  if (id === 'relay-racks') add('failed-relay-patch',656,530,1,.22);
  return result;
}
