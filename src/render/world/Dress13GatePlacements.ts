import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

/** Brood masses borrow existing shield/cabinet solids; no new collision owners. */
export function dress13GatePlacements(id: string): OriginalKitInstance[] {
  const pieces: OriginalKitInstance[] = [];
  const add = (asset: string, x: number, z: number, yaw = 0, scale = 1, y = 0, pitch = 0) => {
    pieces.push({pack: 'p11-brood', asset: 'brood-' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32),
        new T.Quaternion().setFromEuler(new T.Euler(pitch, yaw, 0, 'YXZ')), new T.Vector3(scale, scale, scale)),
      purpose: 'DRESS13 / architecture under pressure / ' + asset,
      cutaway: !asset.startsWith('creep'), castShadow: !asset.startsWith('creep'),
    });
  };
  if (id === 'shielding-gate') {
    // The infestation presses down the inspection cabinet and stops before the field.
    add('nest-medium', 437, 326, 0, 1.1);
    add('burst-duct', 302, 213, .65, .85);
    add('consumed-shell', 484, 246, .1, 1.2, .25);
    add('pods-small', 343, 300, .4, .8);
    add('creep-a', 398, 341, .1, 1.25);
    add('creep-c', 300, 283, -.45, 1.25);
    add('creep-b', 487, 327, .6, 1.15);
    add('creep-wall', 432, 341, 0, 1.2, .5, -Math.PI / 2);
    // Opposite gate leaf: growth is stranded behind the hot shield rather than spread on the arena.
    add('nest-medium', 976, 642, Math.PI, 1.15);
    add('creep-a', 972, 616, Math.PI, 1.25);
    add('creep-wall', 979, 620, Math.PI, 1.2, .45, -Math.PI / 2);
    add('web-long', 365, 336, 0, 1.2, 2.8);
    add('web-medium', 1044, 623, Math.PI, 1.15, 2.7);
  }
  if (id === 'containment-annulus') {
    // Continuous overlapping crust climbs the outer housing lips, leaving the west arena quiet.
    for (const z of [162, 878]) {
      const south = z > 520;
      for (let x = 224; x <= 1210; x += 76) {
        add('creep-c', x, z, south ? Math.PI : 0, 1.1);
        if (x % 152 === 72) add('creep-wall', x, south ? 900 : 140,
          south ? Math.PI : 0, 1.3, .45, -Math.PI / 2);
      }
    }
    add('burst-duct', 1128, 179, .1, .9);
    add('burst-duct', 1128, 861, Math.PI + .1, .9);
    add('pods-hatched', 1198, 181, .5, .8);
    add('pods-hatched', 1198, 856, -.5, .8);
    add('consumed-shell', 1082, 114, .2, 1.35);
    add('web-medium', 1045, 139, 0, 1.25, 2.6);
    add('web-medium', 1168, 899, Math.PI, 1.25, 2.6);
  }
  return pieces;
}
