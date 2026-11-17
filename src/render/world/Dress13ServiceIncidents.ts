import * as T from 'three';
import type {OriginalKitInstance, OriginalKitPack} from './OriginalShipKitAssets';

type Piece = [asset: string, x: number, z: number, scale?: number, yaw?: number, roll?: number, y?: number, pack?: OriginalKitPack];
/** Captive debris tells one incident around each existing machine. These pieces
 * are presentation only: the native machinery retains collision ownership. */
const incidents: Record<string, Piece[]> = {
  // The gantry's shifted load has crushed its stack. Cases spill along the
  // existing 260×108 machinery bed, away from the southern tow floor.
  'freight-hold': [
    ['service-stowage-crate', 688, 514, 1.25, .12],
    ['service-stowage-crate', 716, 516, 1.2, -.2, 1.18, .6],
    ['service-stowage-crate', 746, 516, 1, .4, .38, .15],
    ['service-transit-case', 780, 521, .8, -.45, 1.35, .35],
    ['service-transit-case', 817, 506, .7, .62],
    ['service-transit-case', 839, 508, .5, -.28],
    ['service-cable-tray', 855, 479, .5, 1.4],
    ['service-access-hatch', 868, 495, .65, .3, 1.5, .18],
  ],
  // A diagonal chain of dragged cargo terminates at the torn hull shoulder.
  'breached-loading-bay': [
    ['service-stowage-crate', 485, 350, .9, -.58, .25],
    ['service-transit-case', 514, 364, .8, -.58],
    ['service-transit-case', 538, 381, .65, -.4, 1.2, .28],
    ['service-pressure-drum', 561, 396, .65, -.6, 1.4, .23],
    ['service-access-hatch', 588, 410, .75, -.58, 1.5, .14],
    ['service-cable-tray', 616, 430, .7, .9],
  ],
  // Open rack service is interrupted mid-patch. Captive trays and detached
  // cards remain on the central rack's native footprint.
  'relay-racks': [
    ['service-access-hatch', 620, 425, .75, 0, .32, .4],
    ['service-cable-tray', 635, 461, .85, 0, 0, .25],
    ['service-cable-tray', 672, 478, .65, -.13, .2, .3],
    ['service-transit-case', 634, 520, .65, -.3, 0, .22],
    ['service-transit-case', 673, 540, .45, .28, 1.5, .23],
    ['service-access-hatch', 655, 568, .4, -.3, 1.5, .1],
  ],
  'transmission-chamber': [
    ['service-console-schematic', 835, 365, .8],
    ['service-transit-case', 801, 365, .7, .25],
    ['service-transit-case', 782, 365, .45, -.4, 1.35, .18],
    ['service-access-hatch', 814, 390, .6, -.2, 1.45, .12],
    ['service-cable-tray', 849, 384, .6, 1.5],
    ['service-access-hatch', 865, 388, .35, .1, 1.5, .1],
  ],
  'diagnostic-gallery': [
    ['service-access-hatch', 748, 335, .65, -.3, .8, .3],
    ['service-access-hatch', 830, 342, .6, .2, 1.3, .18],
    ['service-transit-case', 754, 350, .5, .35],
    ['service-transit-case', 812, 353, .4, -.3, 1.4, .15],
    ['service-cable-tray', 780, 338, .6, 1.2, 0, .5],
    ['service-access-hatch', 797, 345, .3, .7, 1.5, .22],
  ],
  'safety-interlock-station': [
    ['service-access-hatch', 619, 345, .7, 0, 0, .15],
    ['service-access-hatch', 680, 345, .7, 0, 0, .15],
    ['service-cable-tray', 647, 347, .5, 1.5, 0, 1.3],
    ['service-transit-case', 616, 368, .45, -.2],
    ['service-access-hatch', 681, 368, .4, .4, 1.5, .12],
    ['service-cable-tray', 652, 376, .4, 1.45, 0, .12],
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
    ['service-safety-rail', 458, 370, 1.8, .2, -.15, -.8],
    ['service-safety-rail', 478, 411, 1.8, 1.7, -.15, -.8],
    ['service-safety-rail', 516, 380, 1.8, .2, -.15, -.8],
    ['service-access-hatch', 475, 383, 1.8, .2, 1.57, -1.2],
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
    cutaway: true,
  }));
}
