import * as T from 'three';
import type { OriginalKitInstance } from './OriginalShipKitAssets';

/** Existing solid footprints own all machinery; no new deck obstruction. */
export function p11MaintenancePlacements(id: string): OriginalKitInstance[] {
  const result: OriginalKitInstance[] = [];
  const add = (asset: string, x: number, z: number, scale: number, y = 0) => result.push({
    pack: 'p11-maintenance', asset,
    matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32), new T.Quaternion(), new T.Vector3(scale, scale, scale)),
    purpose: 'P11 / engineered machinery / ' + asset, cutaway: false,
  });
  if (id === 'coolant-plant') {
    add('frost-manifold-turbines', 680, 350, 1);
    result.push({pack:'p11-inc13-coolant',asset:'frozen-pump-jacket',purpose:'INC13 / frozen pump casing',
      cutaway:false,matrix:new T.Matrix4().makeTranslation(680/32,0,350/32)});
    result.push({pack:'p11-inc13-coolant',asset:'frozen-header',purpose:'INC13 / burst header',
      cutaway:false,matrix:new T.Matrix4().makeRotationY(-.14).setPosition(401/32,0,300/32)});
  }
  if (id === 'service-shaft-landing') add('lift-winch-machinery', 420, 330, 1.1, .15);
  // Paired emitters occupy x385..535,z281..326 of the existing west
  // shield solid (360..560,80..340), within view of the scanner floor.
  if (id === 'shielding-gate') add('shield-field-emitter', 460, 300, 1);
  // West-facing service ring sits fully on the sealed core roof:
  // x565.5..734.5,z435.5..607.2, clear of its chamfered corners.
  if (id === 'containment-annulus') add('containment-ring-cradle', 650, 520, 1.1, 1.2);
  return result;
}
