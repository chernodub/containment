import * as T from 'three';
import type { OriginalKitInstance } from './OriginalShipKitAssets';

/** Consequences remain on existing solid machinery; no additional floor obstruction. */
export function p11IncidentPlacements(id: string): OriginalKitInstance[] {
  const result: OriginalKitInstance[] = [];
  const add = (asset: string, x: number, z: number, scale: number, y = 0) => result.push({
    pack: 'p11-incidents', asset,
    matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32), new T.Quaternion(), new T.Vector3(scale, scale, scale)),
    purpose: 'P11 / interrupted incident / ' + asset, cutaway: false,
  } satisfies OriginalKitInstance);
  if (id === 'service-shaft-landing') add('abandoned-winch-repair',420,330,1.1,.15);
  if (id === 'shielding-gate') add('failed-shield-leaves',460,300,1);
  if (id === 'containment-annulus') add('strained-containment-diaphragm',650,520,1.1,1.2);
  if (id === 'infested-workshop') {
    add('consuming-workstation-mantle',650,326,.7,1.05);
  }
  if (id === 'swarm-junction') {
    // Broad but low sculpture remains inside the existing north-bank void.
    add('brood-stronghold-wall',860,280,1.8,.1);
    result[result.length - 1].matrix.scale(new T.Vector3(1,.7,1));
  }
  if (id === 'relay-racks') add('failed-relay-patch',656,530,1,.22);
  return result;
}
