import type * as T from 'three';
import type {ShipEnvironment} from '../ShipEnvironments';
import type {InteriorProof} from './RoomInteriors';

type Place = (
  model: string, x: number, y: number, z: number,
  width: number, height: number, depth: number,
  angle?: number, purpose?: string, override?: string, flat?: boolean,
) => boolean;

export type InteriorKitClusterProof = {
  space: string;
  backing: string;
  requested: string[];
  accepted: string[];
};

const MODELS: Record<ShipEnvironment, readonly string[]> = {
  cryogenics: ['computer', 'Prop_HealthPack_Tube', 'bed-single'],
  habitation: ['table', 'chair-cushion', 'Prop_Locker'],
  security: ['computer', 'Prop_Locker', 'wall-switch'],
  cargo: ['container-wide', 'Prop_Shelves_ThinShort', 'container-flat-open'],
  communications: ['computer-system', 'computer-wide', 'display-wall-wide'],
  engineering: ['Prop_Desk_Small', 'computer', 'pipe-ring'],
  maintenance: ['pipe-ring', 'pipe-bend', 'Prop_Barrel2_Closed'],
  infested: ['pipe-ring', 'rocks', 'wall-detail'],
  containment: ['computer-screen', 'Prop_Locker', 'wall-switch'],
  reactor: ['pipe-bend', 'computer', 'wall-detail'],
};

type Piece = {
  model: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  role?: string;
};

const STANDARD_WORKSTATIONS: Readonly<Record<string, readonly Piece[]>> = {
  'diagnostic-gallery': [
    {model: 'Prop_Desk_Small', x: -.9, y: .24, z: 0, width: 1.55, height: .42, depth: .55},
    {model: 'computer-wide', x: -.9, y: .66, z: -.12, width: 1.10, height: .18, depth: .22},
    {model: 'Prop_Chair', x: .55, y: .24, z: .04, width: .45, height: .40, depth: .46},
    {model: 'Prop_HealthPack_Tube', x: -1.3, y: .68, z: .10, width: .20, height: .12, depth: .20},
    {model: 'wall-detail', x: 1.5, y: .30, z: -.20, width: .50, height: .45, depth: .10},
  ],
  'crew-checkpoint': [
    {model: 'computer', x: -.8, y: .24, z: 0, width: 1.40, height: .50, depth: .52},
    {model: 'Prop_Locker', x: .8, y: .24, z: 0, width: .90, height: .58, depth: .52},
    {model: 'wall-switch', x: .8, y: .55, z: .29, width: .14, height: .17, depth: .035},
    {model: 'Prop_Ammo_Closed', x: -.72, y: .74, z: .05, width: .38, height: .12, depth: .25},
  ],
  'swarm-junction': [
    {model: 'pipe-ring', x: -1.1, y: .24, z: -.03, width: .90, height: .50, depth: .48},
    {model: 'rocks', x: .65, y: .24, z: 0, width: 1.10, height: .38, depth: .60, role: 'resin'},
    {model: 'wall-detail', x: 1.6, y: .31, z: -.18, width: .45, height: .45, depth: .12},
    {model: 'pipe-bend', x: -.6, y: .69, z: -.05, width: 1.20, height: .18, depth: .44},
  ],
};

function workstation(room: string, environment: ShipEnvironment): readonly Piece[] {
  return STANDARD_WORKSTATIONS[room] ?? MODELS[environment].map((model, index) => {
    const switchFace = model === 'wall-switch';
    return {
      model, x: (index - 1) * 1.42, y: .24, z: 0,
      width: switchFace ? .18 : 1.28,
      height: switchFace ? .18 : index === 2 ? .28 : .54,
      depth: switchFace ? .055 : .48,
    };
  });
}

/** Borrow the existing kit primitives at the authored solid-backed mounts.
 * Every placement still passes the kit's independent navigation/sightline guard;
 * receipts contain only pieces actually accepted into its merged role batches. */
export function addInteriorKitClusters(
  world: T.Group, room: string, environment: ShipEnvironment, place: Place,
): InteriorKitClusterProof[] {
  const interior = world.getObjectByName('e9-room-interiors')?.userData.interior as InteriorProof | undefined;
  if (!interior) return [];
  const pieces = workstation(room, environment);
  return interior.clusters.map(cluster => {
    const proof: InteriorKitClusterProof = {
      space: cluster.space, backing: cluster.backing,
      requested: pieces.map(piece => piece.model), accepted: [],
    };
    const [x, z] = cluster.position, {angle, scale} = cluster;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    for (const piece of pieces) {
      const px = x + (piece.x * cosine + piece.z * sine) * scale;
      const pz = z + (-piece.x * sine + piece.z * cosine) * scale;
      if (place(piece.model, px, piece.y, pz,
        piece.width * scale, piece.height, piece.depth * scale, angle,
        `E9 ${cluster.space}: ${cluster.purpose}`, piece.role, true)) proof.accepted.push(piece.model);
    }
    return proof;
  });
}
