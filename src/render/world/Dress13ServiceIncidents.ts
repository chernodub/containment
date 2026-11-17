import * as T from 'three';
import type {OriginalKitInstance, OriginalKitPack} from './OriginalShipKitAssets';

type Piece = [asset: string, x: number, z: number, scale?: number, yaw?: number, roll?: number, y?: number, pack?: OriginalKitPack];
/** Captive debris tells one incident around each existing machine. These pieces
 * are presentation only: the native machinery retains collision ownership. */
const incidents: Record<string, Piece[]> = {
  // The port stock-bank shoulder carries the collapsed stack in the spawn
  // view. Its spilled load stops north of the clear crossing and tow floor.
  'freight-hold': [
    ['service-stowage-crate', 290, 286, 1.2, .12],
    ['service-stowage-crate', 324, 294, 1.15, -.2, 1.18, .55],
    ['service-stowage-crate', 362, 310, 1, .4, 1.25, .35],
    ['service-transit-case', 390, 320, .85, -.45, 1.35, .32],
    ['service-transit-case', 418, 332, .75, 1.1],
    ['service-transit-case', 443, 318, .6, -.28],
    ['service-cable-tray', 458, 293, .55, 1.4],
    ['service-access-hatch', 473, 314, .7, .3, 1.5, .18],
    ['service-transit-case', 384, 351, .55, .9],
    ['service-pressure-drum', 306, 339, .7, .4, 1.3, .2],
    ['service-transit-case', 480, 339, .5, -.4],
    ['service-access-hatch', 416, 345, .45, -.6, 1.5, .12],
  ],
  // A diagonal chain of dragged cargo terminates at the torn hull shoulder.
  'breached-loading-bay': [
    ['service-stowage-crate', 405, 455, .9, -.58, .25, .12],
    ['service-transit-case', 423, 426, .8, -.58],
    ['service-transit-case', 445, 403, .65, -.4, 1.2, .28],
    ['service-pressure-drum', 561, 396, .65, -.6, 1.4, .23],
    ['service-access-hatch', 588, 410, .75, -.58, 1.5, .14],
    ['service-cable-tray', 616, 430, .7, .9],
  ],
  // Open rack service is interrupted mid-patch. Captive trays and detached
  // cards remain on the central rack's native footprint.
  'relay-racks': [
    ['service-access-hatch', 578, 553, .8, .25, 1.5, .16],
    ['service-cable-tray', 620, 552, .85, .3, 0, .1],
    ['service-cable-tray', 631, 578, .65, 1.4, .2, .1],
    ['service-transit-case', 570, 590, .65, -.3],
    ['service-transit-case', 588, 620, .45, .28, 1.5, .23],
    ['service-access-hatch', 650, 600, .4, -.3, 1.5, .1],
  ],
  'transmission-chamber': [
    ['service-console-schematic', 905, 390, .8],
    ['service-transit-case', 882, 410, .7, .25],
    ['service-transit-case', 923, 418, .45, -.4, 1.35, .18],
    ['service-access-hatch', 904, 426, .6, -.2, 1.45, .12],
    ['service-cable-tray', 941, 402, .6, 1.5],
    ['service-access-hatch', 943, 421, .35, .1, 1.5, .1],
  ],
  'diagnostic-gallery': [
    ['service-access-hatch', 762, 369, .9, -.3, .8, .3],
    ['service-access-hatch', 800, 391, 1.1, .2, 1.3, .2],
    ['service-transit-case', 767, 388, .5, .35],
    ['service-transit-case', 840, 385, .4, -.3, 1.4, .15],
    ['service-cable-tray', 780, 338, .6, 1.2, 0, .5],
    ['service-access-hatch', 797, 345, .3, .7, 1.5, .22],
  ],
  'safety-interlock-station': [
    ['service-access-hatch', 619, 393, .7, 0, 0, .15],
    ['service-access-hatch', 680, 393, .7, 0, 0, .15],
    ['service-cable-tray', 647, 391, .5, 1.5, 0, 1.1],
    ['service-transit-case', 616, 406, .45, -.2],
    ['service-access-hatch', 681, 406, .4, .4, 1.5, .12],
    ['service-cable-tray', 652, 405, .4, 1.45, 0, .12],
  ],
  'coolant-plant': [
    ['service-valve-manifold', 640, 328, .9, .25],
    ['service-pressure-drum', 628, 361, .7, -.3, 1.4, .25],
    ['service-access-hatch', 655, 381, .6, .5, 1.5, .12],
    ['service-safety-rail', 632, 411, .65, .1],
    ['service-safety-rail', 723, 399, .65, -.3],
    ['service-transit-case', 716, 366, .7, .2],
  ],
  // The cage is below the walkable C-balcony, held on one remaining cable.
  'service-shaft-landing': [
    ['service-safety-rail', 420, 465, 1.8, .2, -.15, -.8],
    ['service-safety-rail', 440, 506, 1.8, 1.7, -.15, -.8],
    ['service-safety-rail', 478, 475, 1.8, .2, -.15, -.8],
    ['service-access-hatch', 437, 478, 2.8, .2, 1.57, -1.2],
    ['service-cable-tray', 434, 337, .7, .5, .6, .05],
    ['service-transit-case', 390, 312, .7, -.2],
    ['service-access-hatch', 461, 322, .65, .3, 1.45, .1],
  ],
};

export function dress13ServiceIncidents(id: string): OriginalKitInstance[] {
  return (incidents[id] ?? []).map(([asset, x, z, scale = 1, yaw = 0, roll = 0, y = 0, pack = 'p11-service']) => ({
    pack, asset, purpose: 'DRESS13 / ' + id + ' incident / ' + asset,
    matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32),
      new T.Quaternion().setFromEuler(new T.Euler(
        asset === 'service-access-hatch' ? roll : 0, yaw,
        asset === 'service-access-hatch' ? 0 : roll, 'YXZ')), new T.Vector3().setScalar(scale)),
    cutaway: false,
  }));
}
