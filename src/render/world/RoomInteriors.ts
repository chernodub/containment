import * as T from 'three';
import type { Point, Rect, RoomTemplate } from '../../game/roguelike/types';
import { SHIP_ARCHITECTURE_PLANS } from '../../game/roguelike/shipArchitectureLayouts';
import { FURNISHED_STORY_ROOMS, shipInteriorFurnishings } from '../../game/roguelike/shipInteriorFurnishings';
import { clearPolygonTopology } from '../../game/world/polygonGeometry';
import { InteriorDeckChart } from './InteriorDeckGeometry';
import { INTERIOR_PROFILES } from './RoomInteriorProfiles';
import { buildAct1InteriorInlay } from './RoomInteriorAct1';
import { buildAct2InteriorInlay } from './RoomInteriorAct2';
export const INTERIOR_ROOMS = FURNISHED_STORY_ROOMS;
export type InteriorFloorService = {
    asset: string;
    pack: 'structure' | 'industrial';
    x: number;
    z: number;
    width: number;
    depth: number;
    angle: number;
};
const rect = (x: number, y: number, width: number, height: number): Point[] => [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
/** Captive, flush service openings are presentation only: native floor remains
 * continuous for movement while glass/grating exposes its actual shallow pipes. */
export function interiorFloorServices(id: string, t: RoomTemplate): readonly InteriorFloorService[] {
    if (!INTERIOR_ROOMS.has(id))
        return [];
    const plan = SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];
    if (!plan)
        return [];
    const occupied = shipInteriorFurnishings(t).flatMap(f => f.colliders), result: InteriorFloorService[] = [];
    const add = (x: number, z: number, industrial: boolean) => {
        const width = 96, depth = industrial ? 24 : 16;
        const r = { x: x - width / 2, y: z - depth / 2, width, height: depth }, p = rect(r.x, r.y, r.width, r.height);
        if (!p.every((v, n) => clearPolygonTopology(t, v, p[(n + 1) % 4], 0)))
            return false;
        if (t.obstacles.some(o => overlap(r, o)) || occupied.some(o => overlap(r, o)))
            return false;
        if (result.some(o => overlap(r, { x: o.x - o.width * 16, y: o.z - o.depth * 16, width: o.width * 32, height: o.depth * 32 })))
            return false;
        result.push({ asset: industrial ? 'drainage-grating' : 'floor-glass-channel', pack: industrial ? 'industrial' : 'structure', x, z, width: width / 32, depth: depth / 32, angle: 0 });
        return true;
    };
    // Connected service runs make the inspection lanes and instrument circuits
    // actual deck hardware. Pipes and captive covers sit below the walking skin.
    const a = plan.arena;
    if (id === 'crew-checkpoint' || id === 'diagnostic-gallery')
        for (const dz of [-105, 105])
            for (const dx of [-144, -48, 48, 144])
                add(a.x + dx, a.y + dz, false);
    if (id === 'swarm-junction') {
        for (const dz of [-106, 106])
            for (const dx of [-96, 0, 96])
                add(a.x + dx, a.y + dz, true);
        const south = plan.spaces.find(s => s.name === 'South airway');
        if (south)
            for (const dx of [-96, 0, 96])
                add(south.anchor.x + dx, south.anchor.y, true);
    }
    if (!['diagnostic-gallery','crew-checkpoint','swarm-junction'].includes(id)) {
        const industrial = ['freight-hold','breached-loading-bay','coolant-plant','service-shaft-landing','infested-workshop'].includes(id);
        for (const space of plan.spaces)
            add(space.anchor.x + 96, space.anchor.y, industrial);
        if (['relay-racks','transmission-chamber','shielding-gate'].includes(id))
            for (const dz of [-106,106])
                for (const dx of [-144,-48,48,144])
                    add(a.x + dx, a.y + dz, false);
    }
    for (const [i, space] of plan.spaces.entries()) {
        const industrial = id === 'swarm-junction' || id === 'coolant-plant' || id === 'infested-workshop' || id === 'service-shaft-landing';
        const width = 96, depth = industrial ? 24 : 16;
        for (const offset of [64, -64, 0, 100, -100]) {
            const x = space.anchor.x, z = space.anchor.y + offset;
            if (result.some(o => Math.hypot(o.x - x, o.z - z) < 120))
                continue;
            if (add(x, z, industrial))
                break;
        }
    }
    return result;
}
/** Broad named material fields, distinct from wall/casing paint. Original
 * Blender equipment, wall modules and recessed floor hardware arrive together
 * through the room's lazy preparation owner. */
export function buildRoomInteriors(id: string, t: RoomTemplate, _world?: T.Group): T.Group | null {
    if (!INTERIOR_ROOMS.has(id))
        return null;
    const plan = SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS], profile = INTERIOR_PROFILES[id];
    if (!plan || !profile)
        return null;
    const root = new T.Group();
    root.name = 'e9-room-interiors';
    root.userData.visualOnly = true;
    const services = interiorFloorServices(id, t);
    const holes = services.map(s => rect(s.x - s.width * 16, s.z - s.depth * 16, s.width * 32, s.depth * 32));
    const chart = new InteriorDeckChart({ ...t, voids: [...t.voids ?? [], ...holes] }), base = new T.Color(profile.deck), zone = new T.Color(profile.zone), trim = new T.Color(profile.trim);
    const hull = t.boundary ?? rect(0, 0, t.width, t.height);
    const claimed: (readonly Point[])[]=[];
    chart.polygon(hull, base, .005,undefined,plan.spaces.map(s=>s.outline));
    for (const [i, space] of plan.spaces.entries()) {
        const tone = base.clone().lerp(zone, i % 2 ? .72 : .10).multiplyScalar(1 + (i % 3 - 1) * .045);
        chart.polygon(space.outline, tone, .006, space.name,claimed);
        for (let n = 0; n < space.outline.length; n++)
            chart.strip(space.outline[n], space.outline[(n + 1) % space.outline.length], 2.8, tone.clone().lerp(trim, .26), .012,claimed,space.outline);
        const xs = space.outline.map(p => p.x), ys = space.outline.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...ys), z1 = Math.max(...ys);
        for (let n = (i % 2 ? x0 : z0) + 110; n < (i % 2 ? x1 : z1); n += 140)
            chart.polygon(i % 2 ? rect(n, z0, 1.0, z1 - z0) : rect(x0, n, x1 - x0, 1.0), tone.clone().multiplyScalar(.84), .010,undefined,claimed,space.outline);
        claimed.push(space.outline);
    }
    const a = plan.arena, ink = base.clone().lerp(trim, .12), dark = base.clone().multiplyScalar(.67);
    const elsewhere = buildAct1InteriorInlay(id, plan, chart, base, trim) || buildAct2InteriorInlay(id, plan, chart, base, trim);
    if (!elsewhere && id === 'diagnostic-gallery') {
        for (const side of [-1, 1]) {
            chart.strip({ x: a.x - 240, y: a.y + side * 106 }, { x: a.x + 240, y: a.y + side * 106 }, 12, dark, .017);
            for (let n = -3; n <= 3; n++)
                chart.strip({ x: a.x + n * 62, y: a.y + side * 99 }, { x: a.x + n * 62, y: a.y + side * 111 }, 2, ink, .018);
        }
        const trace = [[-182, 4], [-124, 4], [-110, -12], [-90, 19], [-67, -40], [-42, 34], [-20, 4], [66, 4], [83, -14], [102, 4], [182, 4]];
        for (let n = 1; n < trace.length; n++)
            chart.strip({ x: a.x + trace[n - 1][0], y: a.y + trace[n - 1][1] }, { x: a.x + trace[n][0], y: a.y + trace[n][1] }, 2.3, ink, .019);
    }
    else if (!elsewhere && id === 'crew-checkpoint') {
        const paint = new T.Color(0xa38e43), black = new T.Color(0x28353b);
        for (const dy of [-132, 132])
            for (let n = -4; n <= 4; n++) {
                const x = a.x + n * 47;
                chart.polygon([{ x: x - 19, y: a.y + dy - 7 }, { x: x + 10, y: a.y + dy - 7 }, { x: x + 21, y: a.y + dy + 7 }, { x: x - 8, y: a.y + dy + 7 }], n % 2 ? paint : black, .018);
            }
        for (const x of [a.x - 136, a.x + 136]) {
            chart.strip({ x, y: a.y - 62 }, { x, y: a.y + 62 }, 4, dark, .017);
            chart.polygon([{ x: x - 10, y: a.y - 25 }, { x: x + 8, y: a.y }, { x: x - 10, y: a.y + 25 }], new T.Color(0x708780), .018);
        }
    }
    else if (!elsewhere) {
        for (const dy of [-106, 106])
            chart.strip({ x: a.x - 230, y: a.y + dy }, { x: a.x + 230, y: a.y + dy }, 16, dark, .017);
        for (let n = 0; n < 8; n++) {
            const angle = n * Math.PI / 4;
            const p = { x: a.x + 130 * Math.cos(angle), y: a.y + 130 * Math.sin(angle) }, q = { x: a.x + 130 * Math.cos(angle + .49), y: a.y + 130 * Math.sin(angle + .49) };
            chart.strip(p, q, 3, ink, .018);
            chart.polygon(rect(p.x - 4, p.y - 4, 8, 8), dark, .019);
        }
    }
    for (const opening of plan.openings)
        chart.strip(opening.from, opening.to, 4.5, base.clone().lerp(trim, .24), .016);
    const m = new T.MeshStandardMaterial({ name: 'e9-interior-floor', color: 0xffffff, vertexColors: true, roughness: .91, metalness: .03,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2 });
    m.userData.actorMaterial = true;
    m.userData.floorDressing = true;
    const floor = new T.Mesh(chart.geometry(), m);
    floor.name = 'e9-named-space-decks';
    floor.receiveShadow = true;
    root.add(floor);
    root.userData.interior = { room: id, landmark: profile.landmark, floor: chart.zones, clusters: shipInteriorFurnishings(t), services };
    return root;
}
