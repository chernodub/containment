import * as T from 'three';
import type { Point, Rect, RoomTemplate } from '../../game/roguelike/types';
import { SHIP_ARCHITECTURE_PLANS } from '../../game/roguelike/shipArchitectureLayouts';
import { FURNISHED_STORY_ROOMS, shipInteriorFurnishings } from '../../game/roguelike/shipInteriorFurnishings';
import { clearPolygonTopology } from '../../game/world/polygonGeometry';
import { InteriorDeckChart } from './InteriorDeckGeometry';
import { INTERIOR_PROFILES } from './RoomInteriorProfiles';
import { buildAct1InteriorInlay } from './RoomInteriorAct1';
import { buildAct2InteriorInlay } from './RoomInteriorAct2';
import { shapeDeckLight } from './E10DeckSurfaces';
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
        const width = 64, depth = industrial ? 22 : 18;
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
    // Two small service windows in peripheral galleries, never repeated across
    // the fight circle or underneath an ingress grate.
    for (const space of plan.spaces) {
        if (Math.hypot(space.anchor.x-plan.arena.x,space.anchor.y-plan.arena.y)<190) continue;
        for(const dz of [-48,48,0]) {
            const x=space.anchor.x,z=space.anchor.y+dz;
            if(t.breaches.some(b=>Math.abs(b.x-x)<64&&Math.abs(b.y-z)<48))continue;
            if(add(x,z,['coolant-plant','infested-workshop','service-shaft-landing'].includes(id)))break;
        }
        if(result.length===2)break;
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
    const deckTemplate = { ...t, voids: [...t.voids ?? [], ...holes] };
    const chart = new InteriorDeckChart(deckTemplate), serviceChart = new InteriorDeckChart(deckTemplate), trimChart = new InteriorDeckChart(deckTemplate), base = new T.Color(profile.deck), zone = new T.Color(profile.zone), trim = new T.Color(profile.trim);
    const hull = t.boundary ?? rect(0, 0, t.width, t.height);
    const claimed: (readonly Point[])[]=[];
    chart.polygon(hull, base, .005,undefined,plan.spaces.map(s=>s.outline));
    for (const [i, space] of plan.spaces.entries()) {
        const service = /service|bypass|cross aisle|console bay|pump return|entry lock|exit lock/i.test(space.name);
        const tone = service ? new T.Color(id==='shielding-gate'?0x655f46:id==='relay-racks'?0x69624e:id==='coolant-plant'?0x414b45:profile.deck).lerp(zone,.15)
          : base.clone().lerp(zone, i % 2 ? .72 : .10).multiplyScalar(1 + (i % 3 - 1) * .045);
        const field = service ? serviceChart : chart;
        field.polygon(space.outline, tone, .006, space.name,claimed);
        for (let n = 0; n < space.outline.length; n++)
            chart.strip(space.outline[n], space.outline[(n + 1) % space.outline.length], 2.8, tone.clone().lerp(trim, .26), .012,claimed,space.outline);
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
        trimChart.strip(opening.from, opening.to, 4.5, base.clone().lerp(trim, .24), .016);
    const m = new T.MeshStandardMaterial({ name: 'e9-interior-floor', color: 0xffffff, vertexColors: true, roughness: .91, metalness: .03,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2 });
    m.userData.actorMaterial = true;
    m.userData.floorDressing = true;
    shapeDeckLight(m, t);
    const floor = new T.Mesh(chart.geometry(), m);
    floor.name = 'e9-named-space-decks';
    floor.receiveShadow = true;
    root.add(floor);
    if(serviceChart.positions.length){
      const serviceMaterial = new T.MeshStandardMaterial({ name:'e10-service-floor',color:0xffffff,vertexColors:true,roughness:.98,metalness:.02,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2 });
      serviceMaterial.userData.actorMaterial=true;serviceMaterial.userData.floorDressing=true;shapeDeckLight(serviceMaterial,t);
      const service = new T.Mesh(serviceChart.geometry(),serviceMaterial);service.name='e10-service-lane-decks';service.receiveShadow=true;root.add(service);
    }
    const trimMaterial = new T.MeshStandardMaterial({ name: 'e10-floor-trim', color: 0xffffff, vertexColors: true, roughness: .85, metalness: .18, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    trimMaterial.userData.actorMaterial = true; trimMaterial.userData.floorDressing = true;
    const threshold = new T.Mesh(trimChart.geometry(), trimMaterial); threshold.name = 'e10-threshold-trims'; threshold.receiveShadow = true; root.add(threshold);
    root.userData.interior = { room: id, landmark: profile.landmark, floor: [...chart.zones,...serviceChart.zones], clusters: shipInteriorFurnishings(t), services };
    return root;
}
