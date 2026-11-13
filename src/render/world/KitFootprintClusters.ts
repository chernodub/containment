import type {Rect, RoomTemplate} from '../../game/roguelike/types';
import type {ShipEnvironment} from '../ShipEnvironments';

export type KitClusterPlace = (
  name: string, x: number, y: number, z: number,
  width: number, height: number, depth: number,
  angle?: number, purpose?: string, override?: string, flat?: boolean,
) => boolean;

export type KitClusterPlaceTilted = (
  name: string, x: number, y: number, z: number,
  width: number, height: number, depth: number,
  angle?: number, purpose?: string, override?: string, flat?: boolean,
  tiltX?: number, tiltZ?: number,
) => boolean;

export type KitFootprintContext = {
  template: RoomTemplate;
  environment: ShipEnvironment;
  roomId: string;
  reservations: readonly Rect[];
  place: KitClusterPlace;
  placeTilted?: KitClusterPlaceTilted;
  /** Existing world support only; main retains the full navigation/sightline guards. */
  supportHeight: (x: number, z: number) => number;
};

export type KitFootprintCluster = {
  reservation: number;
  originalObstacle: boolean;
  idea: string;
  attempted: number;
  accepted: number;
  fallenAccepted: boolean;
  statusAccepted: boolean;
  estimatedTriangles: number;
};

type Part = {
  model: string;
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  purpose: string;
  role?: string;
  flat?: boolean;
  fallen?: boolean;
  status?: boolean;
};

// Counts are the shipped static atlas counts, not source high-resolution counts.
// The room owner's own admission budget remains authoritative.
const TRIANGLES: Readonly<Record<string, number>> = {
  'container-wide': 116, 'container-tall': 116, 'container-flat-open': 132,
  computer: 140, 'computer-system': 176, 'computer-screen': 198,
  pipe: 20, 'pipe-bend': 48, 'pipe-ring': 40, rail: 96,
  'wall-detail': 120, 'wall-switch': 18,
  cardboardBoxOpen: 60, books: 62, cabinetBedDrawer: 182, pillow: 50,
  rock_smallFlatA: 20, rock_smallTopA: 52,
};

const IDEAS: Readonly<Record<ShipEnvironment, string>> = {
  cryogenics: 'pod service collar, removed seal cover and live release interlock',
  habitation: 'unpacked belongings, open bedside storage and an interrupted routine',
  security: 'issued equipment, opened case and a displaced defense panel',
  cargo: 'mixed-height loading stock, an open lashing case and a fallen restraint',
  communications: 'connected relay cassette, open service tray and removed rack cover',
  engineering: 'instrument-side coolant connections, removed cover and service interlock',
  maintenance: 'pressure fittings, open maintenance tray and a displaced drain cover',
  infested: 'consumed human fittings breaking through the living machine foundation',
  containment: 'field-side calibration fittings and a detached access cover',
  reactor: 'heat-side coolant fittings and a displaced service cover',
};

function partsFor(environment: ShipEnvironment, roomId: string): Part[] {
  const coveredCore = environment === 'containment' || environment === 'reactor';
  const organic = environment === 'infested' || roomId === 'reactor-vault';
  if (environment === 'habitation') return [
    {model:'cabinetBedDrawer', x:-.34, z:-.28, width:.24, height:.58, depth:.24, purpose:'open bedside storage beside the cabin wall'},
    {model:'cardboardBoxOpen', x:.28, z:.23, width:.24, height:.32, depth:.24, purpose:'arrival box opened inside the cabin'},
    {model:'books', x:.06, z:.27, width:.28, height:.09, depth:.18, purpose:'unpacked reading and colony papers', flat:true, fallen:true},
    {model:'pillow', x:-.28, z:.29, width:.22, height:.09, depth:.18, purpose:'dropped soft belongings beside the berth', flat:true},
    {model:'wall-switch', x:.34, z:-.30, width:.07, height:.18, depth:.04, purpose:'cabin standby power indicator', role:'accent', status:true},
  ];
  if (organic) return [
    {model:'pipe-bend', x:-.29, z:-.25, width:.25, height:.38, depth:.24, purpose:'human pressure fitting protruding through growth', role:'dark'},
    {model:'rock_smallTopA', x:.25, z:-.24, width:.32, height:.48, depth:.28, purpose:'engulfed service collar', role:'resin', flat:true},
    {model:'wall-detail', x:-.15, z:.23, width:.38, height:.12, depth:.20, purpose:'broken machine cover caught in the living foundation', role:'dark', flat:true, fallen:true},
    {model:'rock_smallFlatA', x:.27, z:.18, width:.23, height:.08, depth:.23, purpose:'acid vesicle follows the former instrument connection', role:'accent', flat:true, status:true},
  ];
  if (coveredCore || environment === 'engineering') return [
    {model:'pipe-bend', x:-.31, z:-.27, width:.24, height:.42, depth:.24, purpose:'connected coolant return on the mechanism edge', role:'trim'},
    {model:'wall-detail', x:.29, z:-.29, width:.27, height:.36, depth:.16, purpose:'mechanism-side maintenance access panel'},
    {model:'rail', x:-.18, z:-.04, width:.38, height:.10, depth:.16, purpose:'removed mechanism access cover resting against its mount', role:'dark', flat:true, fallen:true},
    {model:'wall-switch', x:.33, z:-.12, width:.07, height:.22, depth:.035, purpose:'local service interlock with standby indication', role:'accent', status:true},
  ];
  if (environment === 'maintenance') return [
    {model:'pipe-ring', x:-.29, z:-.27, width:.27, height:.54, depth:.24, purpose:'pressure flange retained at the pump connection', role:'trim'},
    {model:'pipe-bend', x:.28, z:-.19, width:.27, height:.36, depth:.26, purpose:'disconnected pressure return beside the manifold'},
    {model:'rail', x:-.12, z:.21, width:.40, height:.10, depth:.18, purpose:'drain-service cover left displaced at the pump', role:'dark', flat:true, fallen:true},
    {model:'wall-switch', x:.30, z:.20, width:.08, height:.24, depth:.04, purpose:'local pressure isolation indicator', role:'accent', status:true},
  ];
  if (environment === 'communications') return [
    {model:'computer-system', x:-.27, z:-.29, width:.28, height:.68, depth:.27, purpose:'connected relay cassette at the rack end'},
    {model:'container-flat-open', x:.27, z:-.17, width:.29, height:.22, depth:.27, purpose:'open cassette tray beside the active rack'},
    {model:'rail', x:-.12, z:.24, width:.42, height:.10, depth:.16, purpose:'removed rack cover left against the service frame', role:'dark', flat:true, fallen:true},
    {model:'wall-switch', x:.30, z:.21, width:.08, height:.24, depth:.04, purpose:'rack-side live circuit indicator', role:'accent', status:true},
  ];
  const cryo = environment === 'cryogenics';
  const cargo = environment === 'cargo';
  return [
    {model:cryo?'pipe-ring':'container-tall', x:-.28, z:-.28, width:.27, height:cryo?.55:.85, depth:.27, purpose:cryo?'pod release collar beside its berth':cargo?'tall loading stock against a secured cargo stack':'issued equipment rack inside the fortified footprint'},
    {model:'container-flat-open', x:.28, z:-.17, width:.29, height:.22, depth:.27, purpose:cryo?'open seal-service case':cargo?'open lashing case beside interrupted unloading':'open equipment issue case'},
    {model:'rail', x:-.13, z:.22, width:.42, height:.10, depth:.17, purpose:cryo?'removed seal cover resting inside the pod foundation':cargo?'fallen cargo restraint inside the loading footprint':'displaced defense panel inside existing cover', role:'dark', flat:true, fallen:true},
    {model:'wall-switch', x:.30, z:.20, width:.08, height:.24, depth:.04, purpose:cryo?'live emergency release interlock':cargo?'loader charging interlock':'local hardware readiness indicator', role:'accent', status:true},
  ];
}

/**
 * Make each frozen solid carry a composed service interruption. This function
 * never creates geometry directly: the owner's supported-placement, marine,
 * story-screen and shared triangle guards decide every admission.
 */
export function addKitFootprintClusters(context: KitFootprintContext): KitFootprintCluster[] {
  const {template, environment, roomId, place, placeTilted, supportHeight} = context;
  const original = new Set(template.obstacles);
  const reservations = [...context.reservations].sort((a, b) => Number(original.has(b)) - Number(original.has(a)));
  let usedTriangles = 0;
  const rows: KitFootprintCluster[] = [];
  for (const reservation of reservations) {
    const index = context.reservations.indexOf(reservation);
    const row: KitFootprintCluster = {
      reservation:index, originalObstacle:original.has(reservation),
      idea:IDEAS[environment], attempted:0, accepted:0,
      fallenAccepted:false, statusAccepted:false, estimatedTriangles:0,
    };
    rows.push(row);
    const width = reservation.width / 32, depth = reservation.height / 32;
    const centerX = (reservation.x + reservation.width * .5) / 32;
    const centerZ = (reservation.y + reservation.height * .5) / 32;
    if (Math.min(width, depth) < .7) continue;
    for (const part of partsFor(environment, roomId)) {
      const triangles = TRIANGLES[part.model];
      if (usedTriangles + triangles > 4000) continue;
      const x = centerX + part.x * width, z = centerZ + part.z * depth;
      // Cabin floors are assembled by the owner in this same preparation pass.
      // Other props each sample their own existing support, never a shared roof.
      const y = environment === 'habitation' ? .185 : Math.max(.17, supportHeight(x, z)) + .015;
      const w = Math.min(width * part.width, part.fallen ? 1.65 : 1.2);
      const h = part.height;
      const d = Math.min(depth * part.depth, part.fallen ? .62 : 1.05);
      const yaw = part.fallen ? (index % 2 ? -.14 : .12) : (index % 2 ? -.04 : .035);
      row.attempted++;
      const purpose = `footprint ${index + 1}: ${part.purpose}`;
      const accepted = part.fallen && placeTilted
        ? placeTilted(part.model, x, y + .06, z, w, h, d, yaw, purpose, part.role, part.flat, .18, index % 2 ? -.12 : .12)
        : place(part.model, x, y, z, w, h, d, yaw, purpose, part.role, part.flat);
      if (!accepted) continue;
      usedTriangles += triangles;
      row.estimatedTriangles += triangles;
      row.accepted++;
      row.fallenAccepted ||= part.fallen === true;
      row.statusAccepted ||= part.status === true;
    }
  }
  return rows;
}
