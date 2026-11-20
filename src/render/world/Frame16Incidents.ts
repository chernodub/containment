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
      pieces.face([[-12,30,-67],[15,27,-61],[11,6,9],[-8,9,9]],0x697e8c);
      pieces.face([[-8,9,9],[11,6,9],[13,.4,17],[-11,.4,17]],0xb2bdba);
      // Beyond the rib the torn sheet is mashed into the deck, below the walkable relief limit.
      pieces.face([[-11,.69,17],[13,.69,17],[48,.69,146],[32,.69,134],[19,.69,156],[-1,.69,93]],0xacb9b7);
      for(const [x,z] of [[4,63],[11,86],[22,117]]) {
        pieces.face([[x,.697,z],[x+4,.697,z+1],[x+6,.697,z+5],[x+2,.697,z+4]],0x38474b);
      }
      // Creased plating fans out from the rib onto the turning apron.
      pieces.face([[-10,.67,17],[7,.67,18],[6,.67,101],[-17,.67,127],[-12,.67,86],[-23,.67,99]],0x737e83);
      pieces.face([[12,.68,22],[29,.68,35],[61,.68,105],[54,.68,99],[59,.68,125],[39,.68,100]],0x919e9d);
      pieces.face([[34,.68,135],[49,.68,148],[66,.68,179],[55,.68,174],[49,.68,182]],0x66787b);
      pieces.finish(root, 'folded-rib', 563, 488);
      break;
    case 'shielding-gate':
      // Hinge barrel sits on the sill. The torn skin folds toward the approach.
      pieces.rod([1,23,-38],[28,23,-38],4,edge);
      pieces.face([[1,23,-38],[28,23,-38],[28,11,-25],[2,16,-25]],0x8d9897);
      pieces.face([[2,16,-25],[28,11,-25],[28,4,-5],[3,10,-7]],0x889594);
      pieces.face([[-33, 2, 15], [-29, 15, -13], [8, 14, -16], [30, 3, -7], [34, 2, 14]], 0x576475);
      pieces.face([[-29, 15, -13], [-28, 10, -17], [9, 10, -20], [8, 14, -16]], 0xa4b4b2);
      pieces.rod([-29, 13, -11], [8, 12, -14], 2.2, edge);
      pieces.rod([8, 12, -14], [31, 4, -6], 2.2, edge);
      for (const x of [-23, 0, 23])
        pieces.box(x, 10, 7, 5, 3, 12, steel);
      // A full door half twists down the approach with its heel still on the carriage.
      pieces.face([[-27,12,9],[27,11,1],[33,20,92],[-23,6,104]],0x84949d);
      pieces.face([[-23,6,104],[33,20,92],[32,7,141],[-16,2,139]],0xadb8b4);
      for(const x of [-17,18])pieces.rod([x,13,13],[x,14,96],2.1,steel);
      pieces.box(4,13,77,42,3,6,0xb7b9ac);
      pieces.face([[16,.68,18],[32,.68,14],[102,.68,111],[95,.68,110],[96,.68,120],[82,.68,111]],0x707b83);
      pieces.rod([-21,11,94],[28,22,91],3.2,0x48535d);
      pieces.box(-16,13,105,9,6,13,0xc0beab);
      // The lower knuckle has pulled out with its bolted backing plate.
      pieces.box(-1,13,83,62,6,21,0x44505a,.07);
      for(const x of [-22,0,22]){
        pieces.rod([x-8,20,88],[x+8,20,88],5,edge);
        pieces.face([[x-6,19,85],[x+5,19,85],[x+5,13,48],[x-7,12,43]],0x647482);
      }
      pieces.rod([-33,20,88],[32,20,88],2.8,0x404952);
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
    case 'manual-control-chamber':
      pieces.box(0,11,0,19,4,22,0xb2a184,.22);
      pieces.box(2,20,9,20,18,4,0x786958,.22);
      pieces.rod([0,2,0],[0,11,0],2.5,steel);
      pieces.box(0,2,0,24,2,4,steel,.22);
      pieces.box(-18,26,-7,14,3,27,edge);
      pieces.box(-18,28,-11,9,1,12,0x527475);
      for(const side of [-1,1]){
        pieces.rod([side*9,11,1],[side*10,17,1],1.2,steel);
        pieces.box(side*10,18,1,3,2,12,0xa29784);
        pieces.rod([0,4,0],[side*9,2,-8],1.3,steel);
      }
      pieces.box(2,27,9,16,4,5,0xb8a793,.22);
      pieces.finish(root,'abandoned-chair',482,644);
      break;
    case 'safety-interlock-station':
      pieces.box(0,11,0,40,22,20,steel);
      pieces.box(0,23,0,39,3,18,edge);
      for(const x of [-14,14])pieces.box(x,13,9,3,20,2,0xc2b28d);
      pieces.finish(root,'relay-shoulder',176,414);
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
      pieces.finish(root, 'interrupted-meal', 362, 431);
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
      for(const z of [18,26])pieces.box(-30,4,z,46,6,5,0xc09a6f,-.13);
      pieces.rod([-42,12,16],[-20,6,24],1.5,0xd3b99a);
      pieces.face([[-22,.67,25],[-17,.67,24],[-51,.67,49],[-58,.67,48]],0xaf906b);
      pieces.face([[-58,.67,48],[-51,.67,49],[-75,.67,55],[-77,.67,51]],0x9f8064);
      // The strap descends across the exposed lid and tears at the deck eye.
      pieces.face([[-38,58,-13],[-29,58,-16],[9,77,8],[0,77,12]],0xad9e84);
      pieces.face([[0,77,12],[9,77,8],[20,41,17],[10,38,21]],0x8b8270);
      pieces.face([[10,38,21],[20,41,17],[23,2,31],[16,6,29],[14,1,32]],0xafa58e);
      pieces.face([[16,.68,32],[22,.68,31],[5,.68,48],[-32,.68,60],[-31,.68,55]],0x867e6c);
      pieces.face([[-32,.68,60],[-31,.68,55],[-46,.68,54],[-49,.68,58]],0xb1a68f);
      pieces.face([[-54,.67,50],[-40,.67,49],[-38,.67,63],[-56,.67,64]],0x515f61);
      for(const z of [14,23]){
        pieces.rod([-53,8,z],[-38,26,z-3],3.6,0xb29a76);
        pieces.rod([-38,26,z-3],[-17,7,z-5],2.8,0x7b776d);
      }
      pieces.finish(root, 'torn-pallet', 474, 447);
      break;
  }
}
