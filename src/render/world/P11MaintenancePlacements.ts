import * as T from 'three';
import type { OriginalKitInstance } from './OriginalShipKitAssets';

/** Existing solid footprints own all machinery; no new deck obstruction. */
export function p11MaintenancePlacements(id: string): OriginalKitInstance[] {
  const result: OriginalKitInstance[] = [];
  const add = (asset: string, x: number, z: number, scale: number, y = 0) => result.push({
    pack: 'p11-maintenance', asset,
    matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32), new T.Quaternion(), new T.Vector3(scale, scale, scale)),
    purpose: 'P11 / engineered machinery / ' + asset, cutaway: true,
  });
  if (id === 'coolant-plant') add('frost-manifold-turbines', 150, 150, 1.4);
  if (id === 'service-shaft-landing') add('lift-winch-machinery', 420, 330, 1.1, .15);
  // The north power-cabinet footprint is 288 by160; the paired emitter occupies
  // only 240 by72, leaving the existing native solid and every lane unchanged.
  if (id === 'shielding-gate') add('shield-field-emitter', 704, 80, 1.6);
  // Mechanical containment hardware sits on the retained sealed core roof.
  if (id === 'containment-annulus') add('containment-ring-cradle', 800, 520, 1.5, 1.2);
  return result;
}
