import type { Point, Rect, RoomTemplate } from './types';
import type { ShipPlan, ShipSpace } from './shipArchitecturePlan';
import { SHIP_ARCHITECTURE_PLANS } from './shipArchitectureLayouts';
import { clearPolygonTopology } from '../world/polygonGeometry';
export type ShipInteriorFurnishing = Readonly<{
    id: string;
    space: string;
    pack: 'clinical' | 'security' | 'industrial';
    asset: string;
    /** Metre assets are positioned in game units; angle is the renderer's Y rotation. */
    x: number;
    z: number;
    angle: number;
    scale: readonly [
        number,
        number,
        number
    ];
    colliders: readonly Rect[];
    source: 'wall' | 'solid' | 'portal';
}>;
/** Original room kit, after the three-room standard's native art review. */
export const FURNISHED_STORY_ROOMS: ReadonlySet<string> = new Set([
    'awakening-bay', 'passenger-vault', 'residential-gallery', 'communal-atrium',
    'diagnostic-gallery', 'crew-checkpoint', 'swarm-junction',
    'armory', 'freight-hold', 'breached-loading-bay', 'relay-racks', 'transmission-chamber',
    'safety-interlock-station', 'coolant-plant', 'service-shaft-landing', 'infested-workshop',
    'shielding-gate', 'containment-annulus', 'manual-control-chamber', 'overload-floor',
]);
type Asset = Readonly<{
    pack: ShipInteriorFurnishing['pack'];
    name: string;
    width: number;
    depth: number;
    centerX: number;
    centerZ: number;
}>;
type Face = Readonly<{
    a: Point;
    b: Point;
    solid?: readonly Point[];
}>;
type Candidate = {
    asset: Asset;
    rect: Rect;
    front?: Rect;
    x: number;
    z: number;
    angle: number;
    score: number;
};
// Exact metre bounds from the original E9 pack manifests. Height is left at its
// authored scale; the renderer chooses a cutaway model rather than stretching it.
const clinical = (name: string, width: number, depth: number, centerZ = 0, centerX = 0): Asset => Object.freeze({ pack: 'clinical', name, width, depth, centerX, centerZ });
const security = (name: string, width: number, depth: number, centerZ = 0): Asset => Object.freeze({ pack: 'security', name, width, depth, centerX: 0, centerZ });
const industrial = (name: string, width: number, depth: number): Asset => Object.freeze({ pack: 'industrial', name, width, depth, centerX: 0, centerZ: 0 });
const ANALYSER = clinical('clinical-analyser', 4.2, 1.193, -.0035);
const TESTBENCH = clinical('clinical-testbench', 2.8, 1.2);
const CRYO = clinical('cryo-service-console', 2.5, 1.104, .002);
const HABITATION = clinical('habitation-console-locker', 2.4, .8);
const BERTH = clinical('habitation-berth', 2.4085, 1.1735, .01175, -.00425);
const DESK = clinical('habitation-desk', 1.65, 1.058, .119);
const COMMS = clinical('comms-rack-low', 1.8, .8795, .00975);
const CONSOLE = security('security-console', 2.8, 1.2);
const LOCKERS = security('security-lockers-low', 3, .8);
const BENCH = security('security-bench', 2.2, .75);
const QUEUE = security('security-queue-rail', 2.52, .36);
const CONVEYOR = security('security-baggage-conveyor', 3.2, 1.141, .0205);
const PLENUM = industrial('swarm-plenum-low', 4.8, 1.4);
const MANIFOLD = industrial('pipe-manifold', 3.2, .7);
const PUMP = industrial('pump-skid', 3.5, 1.3);
const CARGO = industrial('cargo-restraintbank', 3.2, 1.3);
const SHIELD = industrial('shielding-servicebay', 3.5, 1.2);
const REACTOR = industrial('reactor-servicebay', 3.5, 1.2);
/** Functional equipment vocabulary for each story room. */
const ROOM_ASSETS: Readonly<Record<string, readonly Asset[]>> = Object.freeze({
    'awakening-bay': Object.freeze([CRYO, TESTBENCH, COMMS]),
    'passenger-vault': Object.freeze([CRYO, TESTBENCH, COMMS]),
    'residential-gallery': Object.freeze([HABITATION, BERTH, DESK]),
    'communal-atrium': Object.freeze([HABITATION, BENCH, DESK]),
    'crew-checkpoint': Object.freeze([CONSOLE, LOCKERS, BENCH]),
    armory: Object.freeze([LOCKERS, CONSOLE, CONVEYOR]),
    'freight-hold': Object.freeze([CARGO, CONSOLE, MANIFOLD]),
    'breached-loading-bay': Object.freeze([CARGO, MANIFOLD, CONSOLE]),
    'relay-racks': Object.freeze([COMMS, CONSOLE, MANIFOLD]),
    'transmission-chamber': Object.freeze([COMMS, CONSOLE, MANIFOLD]),
    'diagnostic-gallery': Object.freeze([ANALYSER, TESTBENCH, CRYO]),
    'safety-interlock-station': Object.freeze([TESTBENCH, COMMS, CONSOLE]),
    'coolant-plant': Object.freeze([PUMP, MANIFOLD, CONSOLE]),
    'service-shaft-landing': Object.freeze([MANIFOLD, CONSOLE, COMMS]),
    'infested-workshop': Object.freeze([MANIFOLD, PLENUM, TESTBENCH]),
    'swarm-junction': Object.freeze([PLENUM, MANIFOLD]),
    'shielding-gate': Object.freeze([SHIELD, CONSOLE, COMMS]),
    'containment-annulus': Object.freeze([SHIELD, COMMS, CONSOLE]),
    'manual-control-chamber': Object.freeze([REACTOR, CONSOLE, COMMS]),
    'overload-floor': Object.freeze([REACTOR, MANIFOLD, COMMS]),
});
const UNIT = 32, MAX_PROTRUSION = 48, FRONT_CLEARANCE = 140, FIGHT_RADIUS = 144;
const SCALE = Object.freeze([1, 1, 1] as const);
const EMPTY_COLLIDERS: readonly Rect[] = Object.freeze([]);
const EMPTY: readonly ShipInteriorFurnishing[] = Object.freeze([]);
const cached = new WeakMap<RoomTemplate, readonly ShipInteriorFurnishing[]>();
const rectangle = (r: Rect): readonly Point[] => [
    { x: r.x, y: r.y }, { x: r.x + r.width, y: r.y },
    { x: r.x + r.width, y: r.y + r.height }, { x: r.x, y: r.y + r.height },
];
const overlaps = (a: Rect, b: Rect, pad = 0) => a.x < b.x + b.width + pad && a.x + a.width > b.x - pad &&
    a.y < b.y + b.height + pad && a.y + a.height > b.y - pad;
const distanceSquared = (r: Rect, p: Point) => Math.max(r.x - p.x, 0, p.x - r.x - r.width) ** 2 +
    Math.max(r.y - p.y, 0, p.y - r.y - r.height) ** 2;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
function inside(p: Point, polygon: readonly Point[]): boolean {
    let value = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[j], b = polygon[i], dx = b.x - a.x, dy = b.y - a.y;
        const cross = dx * (p.y - a.y) - dy * (p.x - a.x);
        if (Math.abs(cross) < 1e-6 && p.x >= Math.min(a.x, b.x) - 1e-6 && p.x <= Math.max(a.x, b.x) + 1e-6 &&
            p.y >= Math.min(a.y, b.y) - 1e-6 && p.y <= Math.max(a.y, b.y) + 1e-6)
            return true;
        if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x)
            value = !value;
    }
    return value;
}
/** Segment/box overlap includes the whole aperture, not just a doorway centre. */
function segmentOverlaps(rect: Rect, a: Point, b: Point, margin: number): boolean {
    const minX = rect.x - margin, maxX = rect.x + rect.width + margin;
    const minY = rect.y - margin, maxY = rect.y + rect.height + margin;
    let lo = 0, hi = 1;
    for (const [start, delta, min, max] of [[a.x, b.x - a.x, minX, maxX], [a.y, b.y - a.y, minY, maxY]]) {
        if (Math.abs(delta) < 1e-8) {
            if (start < min || start > max)
                return false;
            continue;
        }
        const first = (min - start) / delta, second = (max - start) / delta;
        lo = Math.max(lo, Math.min(first, second));
        hi = Math.min(hi, Math.max(first, second));
        if (lo > hi)
            return false;
    }
    return true;
}
/** A floor rectangle must remain wholly legal, including thin enclosed voids. */
function clearFloor(t: RoomTemplate, rect: Rect, occupied: readonly Rect[] = []): boolean {
    if (t.obstacles.some(r => overlaps(rect, r)) || occupied.some(r => overlaps(rect, r, 2)))
        return false;
    const points = rectangle(rect), topology = { boundary: t.boundary ?? rectangle({ x: 0, y: 0, width: t.width, height: t.height }), voids: t.voids };
    if (!points.every((p, i) => clearPolygonTopology(topology, p, points[(i + 1) % 4], 0)))
        return false;
    if (t.voids?.some(polygon => polygon.some(p => p.x > rect.x && p.x < rect.x + rect.width &&
        p.y > rect.y && p.y < rect.y + rect.height)))
        return false;
    return true;
}
function reserved(t: RoomTemplate, plan: ShipPlan, rect: Rect, openingMargin = 70): boolean {
    if (distanceSquared(rect, plan.arena) < FIGHT_RADIUS ** 2 || distanceSquared(rect, t.spawn) < 34 ** 2 ||
        distanceSquared(rect, t.exit) < 34 ** 2)
        return true;
    if (plan.openings.some(o => segmentOverlaps(rect, o.from, o.to, openingMargin)))
        return true;
    for (const [i, breach] of t.breaches.entries()) {
        if (distanceSquared(rect, breach) < 70 ** 2)
            return true;
        const backing = plan.breachFeatures[i]?.at;
        if (!backing)
            continue;
        const dx = breach.x - backing.x, dz = breach.y - backing.y, length = Math.hypot(dx, dz) || 1;
        const approach = { x: breach.x + dx / length * 96, y: breach.y + dz / length * 96 };
        if (segmentOverlaps(rect, backing, approach, 70))
            return true;
    }
    return false;
}
function spaceAssets(id: string, space: ShipSpace, index: number): readonly Asset[] {
    if (id === 'diagnostic-gallery')
        return space.name === 'Diagnostic nave' ? [ANALYSER, TESTBENCH, CRYO] : [TESTBENCH, CRYO, COMMS];
    if (id === 'crew-checkpoint') {
        if (space.name === 'Scanner hall')
            return [CONVEYOR, CONSOLE, BENCH];
        if (space.name.includes('bypass'))
            return [LOCKERS, BENCH, CONSOLE];
        if (space.name === 'Guard cage' || space.name === 'Guard gallery')
            return [CONSOLE, BENCH, LOCKERS, QUEUE];
        return [CONSOLE, LOCKERS, BENCH];
    }
    const recipe = ROOM_ASSETS[id] ?? [];
    if (id === 'residential-gallery' && space.name.startsWith('Cabin'))
        return [BERTH, DESK, HABITATION];
    if (id === 'swarm-junction')
        return space.name === 'South airway' ? [MANIFOLD, PLENUM] : [PLENUM, MANIFOLD];
    return [...recipe.slice(index % Math.max(1, recipe.length)), ...recipe.slice(0, index % Math.max(1, recipe.length))];
}
function facesFor(t: RoomTemplate): Face[] {
    const hull = t.boundary ?? rectangle({ x: 0, y: 0, width: t.width, height: t.height });
    const result: Face[] = [];
    for (const [index, polygon] of [hull, ...t.voids ?? [], ...t.obstacles.map(rectangle)].entries()) {
        for (let i = 0; i < polygon.length; i++) {
            const a = polygon[i], b = polygon[(i + 1) % polygon.length];
            // Collision contracts are axis-aligned rectangles. Diagonal seams stay
            // with the authored room; no AABB is invented across a diagonal lane.
            if (Math.abs(a.x - b.x) > 1e-6 && Math.abs(a.y - b.y) > 1e-6)
                continue;
            result.push({ a, b, solid: index ? polygon : undefined });
        }
    }
    return result;
}
function footprint(x: number, z: number, ux: number, uz: number, width: number, depth: number): Rect {
    const w = Math.abs(ux) * width + Math.abs(uz) * depth;
    const d = Math.abs(uz) * width + Math.abs(ux) * depth;
    return { x: x - w / 2, y: z - d / 2, width: w, height: d };
}
function wallCandidate(t: RoomTemplate, plan: ShipPlan, space: ShipSpace, asset: Asset, faces: readonly Face[], occupied: readonly Rect[], fronts: readonly Rect[], solid: boolean): Candidate | undefined {
    const width = asset.width * UNIT, depth = asset.depth * UNIT;
    if (depth > MAX_PROTRUSION)
        return;
    let best: Candidate | undefined;
    for (const face of faces) {
        if (solid && !face.solid)
            continue;
        const dx = face.b.x - face.a.x, dz = face.b.y - face.a.y, length = Math.hypot(dx, dz);
        if (length < width + 2)
            continue;
        const ux = dx / length, uz = dz / length;
        const projected = (space.anchor.x - face.a.x) * ux + (space.anchor.y - face.a.y) * uz;
        const candidates = [projected, length / 2, width / 2 + 1, length - width / 2 - 1];
        for (let step = 32; step < length; step += 32)
            candidates.push(projected - step, projected + step);
        const seen = new Set<number>();
        for (const raw of candidates) {
            const along = clamp(raw, width / 2 + 1, length - width / 2 - 1);
            if (seen.has(along))
                continue;
            seen.add(along);
            const px = face.a.x + ux * along, pz = face.a.y + uz * along;
            for (const side of [-1, 1]) {
                const nx = -uz * side, nz = ux * side, sign = solid ? -1 : 1;
                const x = px + nx * (depth / 2 + .35) * sign, z = pz + nz * (depth / 2 + .35) * sign;
                const rect = footprint(x, z, ux, uz, width, depth);
                if (!solid && (!inside({ x, y: z }, space.outline) || fronts.some(r => overlaps(rect, r, 2))))
                    continue;
                if (reserved(t, plan, rect, solid ? 5 : 70) || occupied.some(r => overlaps(rect, r, 4)))
                    continue;
                let frontRect: Rect | undefined;
                if (solid) {
                    // Replace an already-solid bank's cap; do not extend its collision.
                    // Both the corners and boundary segments remain inside one native bank.
                    if (!face.solid || !rectangle(rect).every(p => inside(p, face.solid!)) ||
                        !inside({ x, y: z }, face.solid))
                        continue;
                    if (face.solid.some((p, i) => segmentOverlaps({ x: rect.x + .001, y: rect.y + .001,
                        width: rect.width - .002, height: rect.height - .002 }, p, face.solid![(i + 1) % face.solid!.length], 0)))
                        continue;
                    const front = { x: px + nx, y: pz + nz };
                    if (!clearFloor(t, { x: front.x - .1, y: front.y - .1, width: .2, height: .2 }))
                        continue;
                }
                else {
                    if (!clearFloor(t, rect))
                        continue;
                    const clearX = px + nx * (depth + .35 + FRONT_CLEARANCE / 2);
                    const clearZ = pz + nz * (depth + .35 + FRONT_CLEARANCE / 2);
                    frontRect = footprint(clearX, clearZ, ux, uz, width, FRONT_CLEARANCE);
                    if (!clearFloor(t, frontRect, occupied))
                        continue;
                }
                const nearSpace = inside({ x, y: z }, space.outline) ? 0 : 96;
                const score = Math.hypot(x - space.anchor.x, z - space.anchor.y) + nearSpace;
                if (!best || score < best.score)
                    best = { asset, rect, front: frontRect,
                        // Some authored props have a slightly offset physical bound (stool,
                        // cable or latch). Place the model origin from its real bound centre.
                        x: x - UNIT * (nz * asset.centerX + nx * asset.centerZ),
                        z: z - UNIT * (-nx * asset.centerX + nz * asset.centerZ),
                        angle: Math.atan2(nx, nz), score };
            }
        }
    }
    return best;
}
function furnishing(id: string, space: string, candidate: Candidate, source: 'wall' | 'solid'): ShipInteriorFurnishing {
    return Object.freeze({ id, space, pack: candidate.asset.pack, asset: candidate.asset.name,
        x: candidate.x, z: candidate.z, angle: candidate.angle, scale: SCALE, source,
        colliders: source === 'solid' ? Object.freeze([]) : Object.freeze([Object.freeze(candidate.rect)]),
    });
}
function checkpointPortal(t: RoomTemplate, plan: ShipPlan): ShipInteriorFurnishing | undefined {
    if (t.id !== 'crew-checkpoint')
        return;
    const x = 208, z = 440, halfDepth = .6 * UNIT, outer = 2.85 * UNIT, inner = 4.484 * UNIT / 2;
    // Only the actual posts obstruct the deck. The 3.039m beam underside is
    // overhead; its 143.488-unit native clear aperture is never a solid box.
    const posts: Rect[] = [
        { x: x - halfDepth, y: z - outer, width: halfDepth * 2, height: outer - inner },
        { x: x - halfDepth, y: z + inner, width: halfDepth * 2, height: outer - inner },
    ];
    if (posts.some(rect => !clearFloor(t, rect) || distanceSquared(rect, plan.arena) < FIGHT_RADIUS ** 2 ||
        distanceSquared(rect, t.spawn) < 34 ** 2 || distanceSquared(rect, t.exit) < 34 ** 2))
        return;
    if (!clearFloor(t, { x: x - 140, y: z - inner, width: 280, height: inner * 2 }))
        return;
    return Object.freeze({ id: 'crew-checkpoint-scanner-portal', space: 'Entry vestibule',
        pack: 'security', asset: 'security-scanner-gate', x, z, angle: Math.PI / 2, scale: SCALE,
        colliders: Object.freeze(posts.map(rect => Object.freeze(rect))), source: 'portal',
    });
}
/** Authored stations use the whole shallow wall bay, rather than treating every
 * virtual sub-space boundary as a physical doorway. Dimensions are native kit
 * bounds; passage widths and the clear fight circle belong to the room plan. */
function authoredStations(id: string): ShipInteriorFurnishing[] {
    const station = (name: string, space: string, asset: Asset, cx: number, cz: number, angle = 0, sy = 1): ShipInteriorFurnishing => {
        const nx = Math.sin(angle), nz = Math.cos(angle);
        const rect = footprint(cx, cz, nz, -nx, asset.width * UNIT, asset.depth * UNIT);
        return Object.freeze({ id: `${id}-${name}`, space, pack: asset.pack, asset: asset.name,
            x: cx - UNIT * (nz * asset.centerX + nx * asset.centerZ),
            z: cz - UNIT * (-nx * asset.centerX + nz * asset.centerZ), angle,
            scale: Object.freeze([1, sy, 1] as const), source: 'wall',
            colliders: Object.freeze([Object.freeze(rect)]),
        });
    };
    if (id === 'crew-checkpoint') {
        const x = 364, z = 250, outer = 2.85 * UNIT, inner = 4.484 * UNIT / 2, depth = .6 * UNIT;
        return [
            Object.freeze({ id: id + '-inspection-gate', space: 'Inspection N', pack: 'security', asset: 'security-scanner-gate',
                x, z, angle: 0, scale: SCALE, source: 'portal', colliders: Object.freeze([
                    Object.freeze({ x: x - outer, y: z - depth, width: outer - inner, height: depth * 2 }),
                    Object.freeze({ x: x + inner, y: z - depth, width: outer - inner, height: depth * 2 }),
                ]) }),
            Object.freeze({ id: id + '-departure-gate', space: 'Scanner hall', pack: 'security', asset: 'security-scanner-gate',
                x: 668, z: 440, angle: Math.PI / 2, scale: Object.freeze([1, .76, 1] as const), source: 'portal', colliders: Object.freeze([
                    Object.freeze({ x: 648.8, y: 348.8, width: 38.4, height: 19.456 }),
                    Object.freeze({ x: 648.8, y: 511.744, width: 38.4, height: 19.456 }),
                ]) }),
            // 45.2u into the cage from its north partition; the west gate stays open.
            station('glazed-guard-desk', 'Guard cage', security('security-guard-booth', 2.8, 1.4115, .00575), 830, 306.584, 0, .55),
            // 36.5u / 25.6u from the bypass walls leave 143.5u / 154.4u clear.
            station('baggage-trays', 'North bypass', CONVEYOR, 950, 98.256),
            station('return-lockers', 'South bypass', LOCKERS, 950, 787.2, Math.PI),
        ];
    }
    if (id === 'diagnostic-gallery')
        return [
            Object.freeze({ id: id + '-probe-arch', space: 'Diagnostic nave', pack: 'clinical', asset: 'clinical-scanner-arch',
                x: 856, z: 480, angle: Math.PI / 2, scale: SCALE, source: 'portal', colliders: Object.freeze([
                    Object.freeze({ x: 836.8, y: 340.8, width: 38.4, height: 9.92 }),
                    Object.freeze({ x: 836.8, y: 609.28, width: 38.4, height: 9.92 }),
                ]) }),
            station('recorder-workstation', 'Recorder workbay', CRYO, 217.664, 260, Math.PI / 2),
            station('instrument-workstation', 'Instrument workbay', TESTBENCH, 820.8, 200, -Math.PI / 2),
            station('return-testbench', 'Return service workbay', TESTBENCH, 980, 900.8, Math.PI),
            station('return-instrument-stack', 'Return service workbay', clinical('clinical-diagnostic-tower', 1.6, .9), 1065.6, 700, -Math.PI / 2, .6),
            station('entry-instrument-panel', 'Port access landing', CRYO, 17.664, 400, Math.PI / 2),
        ];
    if (id === 'swarm-junction') {
        const result = [
            station('port-growth-plenum', 'Port approach', PLENUM, 300, 361.728),
            station('starboard-growth-plenum', 'Hull exit', PLENUM, 900, 361.728),
        ];
        // The two far-wall crowns stand above their native banks. Their shallow
        // bases stop before the 384u airway mouths and leave breach approaches open.
        const crowns = result.map(f => Object.freeze({ ...f, asset: 'swarm-plenum-tall',
            scale: Object.freeze([1, 1, .97] as const),
            colliders: Object.freeze(f.colliders.map(r => Object.freeze({ ...r, y: 340, height: 43.456 }))),
        }));
        const southern = [330, 870].map((x, n) => Object.freeze({
            ...station('south-bank-' + n, 'South airway', PLENUM, x, 882.4), source: 'solid' as const, colliders: EMPTY_COLLIDERS,
        }));
        return [...crowns, ...southern];
    }
    return [];
}
/** Build once per immutable room template. Placement is static product geometry,
 * independent of actors, clocks, rendering, RNG and saved run state. */
export function shipInteriorFurnishings(t: RoomTemplate): readonly ShipInteriorFurnishing[] {
    if (!FURNISHED_STORY_ROOMS.has(t.id))
        return EMPTY;
    const saved = cached.get(t);
    if (saved)
        return saved;
    const plan = SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS] as ShipPlan | undefined;
    if (!plan)
        return EMPTY;
    const result: ShipInteriorFurnishing[] = [], occupied: Rect[] = [], fronts: Rect[] = [];
    const portal = checkpointPortal(t, plan);
    if (portal) {
        result.push(portal);
        occupied.push({ x: portal.x - .6 * UNIT, y: portal.z - 2.85 * UNIT, width: 1.2 * UNIT, height: 5.7 * UNIT });
        fronts.push({ x: portal.x - 140, y: portal.z - 4.484 * UNIT / 2, width: 280, height: 4.484 * UNIT });
    }
    for (const station of authoredStations(t.id)) {
        result.push(station);
        occupied.push(...station.colliders);
    }
    const faces = facesFor(t);
    for (const [index, space] of plan.spaces.entries()) {
        if (result.some(f => f.space === space.name))
            continue;
        const assets = spaceAssets(t.id, space, index);
        let candidate: Candidate | undefined, source: 'wall' | 'solid' = 'wall';
        for (const asset of assets) {
            candidate = wallCandidate(t, plan, space, asset, faces, occupied, fronts, false);
            if (candidate)
                break;
        }
        if (!candidate) {
            source = 'solid';
            for (const [preference, asset] of assets.entries()) {
                const mount = wallCandidate(t, plan, space, asset, faces, occupied, fronts, true);
                if (!mount)
                    continue;
                // Keep the analyser as the room's hero; compact fallback groups should
                // otherwise use the closest native bank rather than a distant cabinet.
                mount.score += preference * (t.id === 'diagnostic-gallery' && space.name === 'Diagnostic nave' ? 10000 : 24);
                if (!candidate || mount.score < candidate.score)
                    candidate = mount;
            }
        }
        if (!candidate)
            continue;
        const slug = space.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        result.push(furnishing(`${t.id}-${slug}`, space.name, candidate, source));
        occupied.push(candidate.rect);
        if (candidate.front)
            fronts.push(candidate.front);
    }
    const frozen = Object.freeze(result);
    cached.set(t, frozen);
    return frozen;
}
