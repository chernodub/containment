import type { RoomTemplate } from '../../game/roguelike/types';

type Reservation = {
  x: number;
  y: number;
  width: number;
  height: number;
};
type FloorPainter = {
  quad: (
    x: number, z: number, width: number, depth: number,
    angle: number, color: number, kind: string, y?: number,
  ) => boolean;
  segment: (
    ax: number, az: number, bx: number, bz: number,
    width: number, color: number, kind: string, y?: number,
  ) => boolean;
};
export type DeckArchitectureProof = {
  idea: string;
  bays: number;
  connections: number;
  triangles: number;
  baseArea: number;
  maxHeight: number;
  anchors: number[][];
};
const LIMIT = 800;

/** Room-scale flush infrastructure, baked into the existing vertex-colour floor.
 * Heights below are before KitFloorSurface's existing .75 scale: final .015–.021m.
 * The owning painter retains its hull/void/obstacle checks. No mesh/material owner. */
export function addKitDeckArchitecture(
  t: RoomTemplate,
  id: string,
  reservations: readonly Reservation[],
  p: FloorPainter,
): DeckArchitectureProof {
  const proof: DeckArchitectureProof = {
    idea: '',
    bays: 0,
    connections: 0,
    triangles: 0,
    baseArea: 0,
    maxHeight: 0,
    anchors: [],
  };
  if (!['residential-gallery', 'crew-checkpoint', 'transmission-chamber'].includes(id))
    return proof;
  const w = t.width / 32;
  const h = t.height / 32;
  const z = h * .5;
  const color = id === 'residential-gallery' ? {
    bed: 0x4b5556,
    edge: 0x858b7d,
    rib: 0x657471,
    cap: 0x9b927c,
  } : id === 'crew-checkpoint' ? {
    bed: 0x52616c,
    edge: 0x879692,
    rib: 0x71828b,
    cap: 0xa49470,
  } : {
    bed: 0x465d66,
    edge: 0x7c9599,
    rib: 0x657f87,
    cap: 0x8ea8a5,
  };

  const quad = (
    x: number, z: number, width: number, depth: number,
    tint: number, kind: string, y = .024,
  ) => {
    if (proof.triangles + 2 > LIMIT || !p.quad(x, z, width, depth, 0, tint, kind, y))
      return false;
    proof.triangles += 2;
    proof.maxHeight = Math.max(proof.maxHeight, y * .75);
    return true;
  };
  const line = (
    ax: number, az: number, bx: number, bz: number,
    width: number, tint: number, kind: string, y = .024,
  ) => {
    if (proof.triangles + 2 > LIMIT || !p.segment(ax, az, bx, bz, width, tint, kind, y))
      return false;
    proof.triangles += 2;
    proof.maxHeight = Math.max(proof.maxHeight, y * .75);
    return true;
  };
  const bay = (x: number, cz: number, width: number, depth: number, ribs: number) => {
    // A rejected whole bay never leaves orphan hatching inside a solid/void.
    if (!quad(x, cz, width, depth, color.bed, 'deck-access-bay', .020))
      return false;
    proof.bays++;
    proof.baseArea += width * depth;
    for (const side of [-1, 1]) {
      quad(x + side * (width / 2 - .10), cz, .20, depth, color.edge, 'deck-bay-frame');
      quad(x, cz + side * (depth / 2 - .10), width, .20, color.edge, 'deck-bay-frame');
      // Broad end plates identify an inspection cover rather than loose debris.
      quad(x + side * (width / 2 - .38), cz, .32, depth * .38, color.cap, 'deck-bay-endplate', .028);
    }
    for (let n = 1; n <= ribs; n++)
      quad(x - width / 2 + width * n / (ribs + 1), cz, .12, depth - .64, color.rib, 'deck-hatch-rib', .028);
    return true;
  };
  const feed = (ax: number, az: number, bx: number, bz: number) => {
    if (!line(ax, az, bx, bz, .34, color.bed, 'deck-frontage-feed', .020))
      return;
    const length = Math.hypot(bx - ax, bz - az);
    const nx = length ? -(bz - az) / length * .20 : 0;
    const nz = length ? (bx - ax) / length * .20 : 0;
    line(ax + nx, az + nz, bx + nx, bz + nz, .10, color.edge, 'deck-feed-edge');
    line(ax - nx, az - nz, bx - nx, bz - nz, .10, color.edge, 'deck-feed-edge');
    proof.connections++;
    proof.anchors.push([ax, az, bx, bz]);
  };
  if (id === 'residential-gallery') {
    proof.idea = 'Connected cabin service covers give the gallery a continuous inspected deck spine';
    for (const x of [w * .145, w * .34, w * .535, w * .73, w * .92])
      bay(x, z, 5.4, 3.8, 4);
    // The long spine joins actual cabin frontages. These are surface conduits,
    // not lips/rails across the traversable gallery.
    feed(w * .08, z, w * .96, z);
    for (const r of reservations) {
      const x = (r.x + r.width * .5) / 32;
      const near = (r.y + r.height * .5) / 32 < z;
      const edge = (near ? r.y + r.height : r.y) / 32 + (near ? .24 : -.24);
      const target = z + (near ? -1.9 : 1.9);
      feed(x, edge, x, target);
    }
  } else if (id === 'crew-checkpoint') {
    proof.idea = 'One broad ribbed inspection apron leads into the fortified checkpoint opening';
    const gate = reservations.length ? Math.min(...reservations.map(r => r.x)) / 32 : w * .442;
    const left = Math.max(2.7, gate - 13.4);
    const right = gate - 1.1;
    bay((left + right) / 2, z, right - left, 6.4, 8);
    feed(right, z, gate - .16, z);
    for (const side of [-1, 1]) {
      // Two broad terminal bars are attached to the same inspection deck frame.
      line(left + .5, z + side * 2.6, right - .5, z + side * 2.6, .16, color.cap, 'checkpoint-inspection-guide', .028);
      for (let n = 0; n < 3; n++)
        quad(right - .9 - n * .48, z + side * 2.1, .20, .62, color.cap, 'checkpoint-stop-mark', .028);
    }
  } else {
    proof.idea = 'Linked flush relay access covers connect the broad western approach to the rack service trench';
    for (const x of [4.2, 8.6, 12.7])
      bay(x, z, 3.7, 5.2, 3);
    const trench = w * .44;
    const returnZ = z + 3.2;
    feed(3.2, returnZ, trench, returnZ);
    for (const x of [4.2, 8.6, 12.7])
      feed(x, z + 2.6, x, returnZ);
    // The final elbow joins the existing cable trench below the central rack.
    feed(trench, returnZ, trench, z + 2.2);
  }
  return proof;
}
