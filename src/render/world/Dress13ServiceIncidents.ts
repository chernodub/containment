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
    ['service-transit-case', 376, 485, .8, -.58, 1.25, .25],
    ['service-stowage-crate', 349, 509, .9, -.58, .15, .06],
    ['service-transit-case', 381, 514, .55, .4],
    ['service-access-hatch', 414, 480, .55, -.3, 1.5, .1],
    ['service-cable-tray', 398, 506, .6, -.6],
    ['service-pressure-drum', 337, 482, .55, -.5, 1.4, .2],
  ],
  // Open rack service is interrupted mid-patch. Captive trays and detached
  // cards remain on the central rack's native footprint.
  'relay-racks': [
    ['service-access-hatch', 579, 426, .9, .25, 1.5, .16],
    ['service-cable-tray', 571, 384, .9, .3, 0, .08],
    ['service-cable-tray', 568, 450, .7, 1.4, .2, .1],
    ['service-transit-case', 531, 403, .9, -.3],
    ['service-transit-case', 548, 441, .65, .28, 1.5, .23],
    ['service-access-hatch', 582, 465, .55, -.3, 1.5, .1],
    ['service-cable-tray', 581, 345, .7, .2],
    ['service-transit-case', 530, 361, .65, .5],
    ['service-access-hatch', 546, 375, .55, .6, 1.5, .1],
    ['service-transit-case', 568, 482, .5, -.8],
    ['service-cable-tray', 599, 415, .65, .3, .4, .65],
    ['service-access-hatch', 549, 465, .45, .2, 1.5, .12],
  ],
  'transmission-chamber': [
    ['service-console-schematic', 905, 390, .95],
    ['service-transit-case', 882, 410, .8, .25],
    ['service-transit-case', 923, 418, .6, -.4, 1.35, .18],
    ['service-access-hatch', 904, 426, .7, -.2, 1.45, .12],
    ['service-cable-tray', 941, 402, .65, 1.5],
    ['service-access-hatch', 943, 421, .45, .1, 1.5, .1],
    ['service-transit-case', 868, 436, .6, -.4],
    ['service-cable-tray', 866, 425, .65, .5],
    ['service-transit-case', 884, 443, .5, .4, 1.4, .15],
    ['service-access-hatch', 928, 443, .4, -.3, 1.5, .12],
    ['service-transit-case', 956, 399, .5, .8],
  ],
  'diagnostic-gallery': [
    ['specimen-probe-cradle', 357, 324, .6, -.12, .22, .28, 'p11-control'],
    ['service-access-hatch', 328, 353, .9, -.3, .8, .3],
    ['service-access-hatch', 385, 377, 1.1, .2, 1.3, .2],
    ['service-transit-case', 313, 373, .7, .35],
    ['service-transit-case', 423, 353, .6, -.3, 1.4, .15],
    ['service-cable-tray', 329, 313, .65, 1.2, 0, .5],
    ['service-access-hatch', 371, 340, .45, .7, 1.5, .22],
    ['service-safety-rail', 321, 328, .65, .3, -.4, .3],
    ['service-safety-rail', 394, 333, .65, .3, .6, .3],
    ['service-transit-case', 408, 389, .5, .7],
    ['service-access-hatch', 343, 389, .5, -.8, 1.5, .12],
  ],
  'safety-interlock-station': [
    ['service-access-hatch', 545, 349, .7, 0, 0, .15],
    ['service-access-hatch', 585, 349, .7, 0, 0, .15],
    ['service-cable-tray', 565, 347, .65, 1.57, 0, 2.0],
    ['service-transit-case', 496, 320, .65, -.2],
    ['service-access-hatch', 495, 357, .6, .4, 1.5, .12],
    ['service-cable-tray', 497, 388, .6, 1.45, 0, .12],
    ['service-transit-case', 470, 326, .55, .4, 1.3, .2],
    ['service-pressure-drum', 506, 292, .55, -.2, 1.4, .2],
    ['service-access-hatch', 460, 298, .45, .6, 1.5, .1],
    ['service-transit-case', 477, 369, .45, .6],
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
    cutaway: asset === 'specimen-probe-cradle',
  }));
}
