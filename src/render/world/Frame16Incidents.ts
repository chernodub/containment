import type { Group } from 'three';
import { IncidentPieces } from './Inc13StoryIncidents';
/** Captive hardware and personal effects, in native ship units. */
export function addFrame16Incidents(root: Group, id: string) {
  const pieces = new IncidentPieces(), steel = 0x76858a, edge = 0xa3a99d;
  switch (id) {
    case 'breached-loading-bay':
      for (const x of [-10, 10]) {
        pieces.rod([x, 25, -35], [x, 8, 5], 3, steel);
        pieces.rod([x, 8, 5], [x - 2, 3, 16], 3, edge);
      }
      pieces.face([[-11, 26, -35], [-7, 26, -35], [-9, 9, 4], [-13, 9, 4]], 0xa3aba7);
      pieces.box(0, 8, 4, 24, 4, 5, steel);
      pieces.finish(root, 'folded-rib', 563, 488);
      break;
    case 'shielding-gate':
      pieces.face([[-33, 2, 15], [-29, 15, -13], [8, 14, -16], [30, 3, -7], [34, 2, 14]], 0x576475);
      pieces.face([[-29, 15, -13], [-28, 10, -17], [9, 10, -20], [8, 14, -16]], 0xa4b4b2);
      pieces.rod([-29, 13, -11], [8, 12, -14], 2.2, edge);
      pieces.rod([8, 12, -14], [31, 4, -6], 2.2, edge);
      for (const x of [-23, 0, 23])
        pieces.box(x, 10, 7, 5, 3, 12, steel);
      pieces.finish(root, 'ejected-leaf', 407, 364).scale.x = .82;
      break;
    case 'overload-floor':
      pieces.face([[-15, 4, 14], [-12, 23, -14], [13, 15, -15], [12, 2, 12]], 0x899492);
      pieces.face([[-12, 23, -14], [-15, 15, -16], [10, 8, -17], [13, 15, -15]], 0x4f5a60);
      for (const x of [-8, 0, 8])
        pieces.rod([x, 5, 11], [x, 14, -10], 1.5, 0x424c56);
      pieces.finish(root, 'shroud', 465, 390);
      break;
    case 'transmission-chamber':
      pieces.rod([-15, 4, 12], [2, 35, -4], 3, steel);
      pieces.rod([2, 35, -4], [50, 42, -12], 2.4, edge);
      for (const t of [12, 25, 38]) {
        const h = 35 + t * .15;
        pieces.rod([t, h, -16], [t, h + 2, 5], 1.7, 0xb3c4bd);
      }
      pieces.finish(root, 'antenna-boom', 850, 476);
      break;
    case 'service-shaft-landing':
      pieces.box(0, 2, 0, 27, 4, 34, 0x495856);
      for (const x of [-11, 11]) {
        pieces.rod([x, 4, -14], [x, 23, -11], 2, steel);
        pieces.rod([x, 4, 14], [x, 17, 12], 2, steel);
        pieces.rod([x, 23, -11], [x, 17, 12], 2, edge);
      }
      pieces.rod([-11, 23, -11], [11, 23, -11], 2, edge);
      pieces.rod([-11, 23, -11], [0, 38, -10], 2, steel);
      pieces.rod([0, 38, -10], [11, 23, -11], 2, steel);
      pieces.rod([0, 38, -10], [3, 59, -16], 1.4, edge);
      pieces.finish(root, 'hoist-cage', 346, 474);
      break;
    case 'residential-gallery':
      for (const x of [-18, -3, 15]) {
        pieces.box(x, 1.5, 0, 11, 3, 18, 0x312d2a);
        pieces.box(x, 5, 0, 10, 5, 16, 0x625043);
        pieces.box(x, 11, -4, 9, 12, 8, 0x82705a);
        pieces.box(x, 17.3, -4, 6, 1, 5, 0x272e31);
        pieces.rod([x - 3, 11, .4], [x + 3, 9, 2], .65, 0xb39a77);
        pieces.rod([x + 3, 11, .4], [x - 3, 9, 2], .65, 0xb39a77);
      }
      pieces.finish(root, 'cabin-boots', 337, 315);
      break;
    case 'diagnostic-gallery':
      pieces.box(0, 8, 0, 28, 3, 17, steel);
      pieces.box(-5, 10, 0, 15, 1.2, 13, 0xbdb9a9);
      // The remaining corner of a sandwich sits on its cut crust.
      pieces.face([[-11, 12, 5], [-11, 12, -5], [-2, 12, -5], [-3, 12, -1], [-1, 12, 1]], 0xac804f);
      pieces.face([[-10, 12.4, 4], [-10, 12.4, -4], [-3, 12.4, -4], [-4, 12.4, -1], [-2, 12.4, 1]], 0xe6c388);
      pieces.box(7, 14, 0, 7, 9, 7, 0x9dbdc2);
      pieces.box(7, 18.7, 0, 5, .6, 5, 0x48392f);
      pieces.rod([10, 17, 0], [13, 16, 0], .9, edge);
      pieces.rod([13, 16, 0], [13, 12, 0], .9, edge);
      pieces.rod([13, 12, 0], [10, 12, 0], .9, edge);
      pieces.finish(root, 'interrupted-meal', 448, 354);
      break;
    case 'containment-annulus':
      // The tags rest on the top lip, above the bent clamp bands.
      pieces.box(0, 33, 0, 19, 3, 48, 0x3f4a4b);
      for (const z of [-15, 0, 15]) {
        pieces.rod([-8, 38, z - 5], [-5, 35, z - 1], .8, edge);
        pieces.face([[-6, 35, z - 3], [-4, 35, z - 5], [5, 35, z - 5],
          [7, 35, z - 2], [7, 35, z + 3], [5, 35, z + 5], [-4, 35, z + 5], [-6, 35, z + 3]], 0xd2c1a0);
        pieces.box(-4, 35.4, z, 2, .6, 2, 0x4d4840);
        for (const line of [-1.5, 1.5]) pieces.box(2, 35.4, z + line, 5, .6, .9, 0x827967);
      }
      pieces.finish(root, 'memorial-tags', 548, 493);
      break;
    case 'freight-hold':
      pieces.face([[-45, 7, 18], [-34, 24, 8], [-23, 7, 22]], 0x8a7254);
      pieces.rod([-40, 9, 18], [-28, 26, 8], 1.4, 0xd1b681);
      for (const [x, z] of [[-42, 27], [-29, 25], [-17, 19]])
        pieces.box(x, 6, z, 10, 9, 8, 0x839392, .3);
      pieces.finish(root, 'torn-pallet', 474, 447);
      break;
  }
}
