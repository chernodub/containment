import {ARMORY_CENTER} from '../../game/world/armoryCarouselLayout';
import {registerOriginalInteriorCutaways,type InteriorCutaway} from './OriginalInteriorCutaways';
import {alignIncidentInstance,incidentTransform} from './Room14Mounts';
import {room14Debris} from './Room14Debris';
import {addRoom14Fittings} from './Room14Fittings';
import {addStoryIncident} from './Inc13StoryIncidents';
import {addDress13EarlyDetails} from './Dress13EarlyIncidents';
import {addDress13ServiceDetails} from './Dress13ServiceDetails';
import {p11IncidentPlacements} from './P11IncidentPlacements';
import {p11ServicePlacements} from './P11ServicePlacements';
import {p11MaintenancePlacements} from './P11MaintenancePlacements';
import {p11CargoPlacements} from './P11CargoPlacements';
import {p11ClinicalSecurityPlacements} from './P11ClinicalSecurityPlacements';
import {p11ControlPlacements} from './P11ControlPlacements';
import {p11HabitationPlacements} from './P11HabitationPlacements';
import {p11InfestedPlacements} from './P11InfestedPlacements';
import * as T from 'three';
import type { RoomTemplate } from '../../game/roguelike/types';
import { SHIP_ARCHITECTURE_PLANS } from '../../game/roguelike/shipArchitectureLayouts';
import { shipInteriorFurnishings } from '../../game/roguelike/shipInteriorFurnishings';
import { disposeModel, geometries } from '../meshParts';
import { retireRoomModels } from '../RoomModelCache';
import { acquireOriginalShipKit, prefetchOriginalShipKit, buildOriginalShipKit, setOriginalShipKitQuality, type OriginalKitInstance, type OriginalKitPack } from './OriginalShipKitAssets';
import { interiorFloorServices } from './RoomInteriors';
import { loadDeckSurfaces } from './E10DeckSurfaces';
import { addCeilingServices } from './E10CeilingServices';
import { addRecessedServices } from './E10RecessedServices';
import { cutInteriorWallNiches } from './InteriorWallNiches';
import { INTERIOR_PROFILES, INTERIOR_WALL_FINISHES } from './RoomInteriorProfiles';
const floorNames = new Set(['painted-steel-deck', 'annulus-deck', 'annulus-circulation', 'environment-floor', 'shaft-deck', 'shaft-floor-panel']);
const legacyFloorNames=new Set([...floorNames,'annulus-sealed','shaft-zinc','shaft-worn-grate','shaft-depth','shaft-amber']);
function instancesFor(t: RoomTemplate): OriginalKitInstance[] {
    const instances: OriginalKitInstance[] = [], id = t.id, plan = SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];
    const matrix = (x: number, y: number, z: number, angle: number, sx = 1, sy = 1, sz = 1) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(sx, sy, sz));
    for (const furnishing of shipInteriorFurnishings(t)) {
        // The north common-nook solid owns bespoke furniture. Its split low
        // mesh starts above deck height, so generic 3D hero bounds cannot
        // reliably remove the legacy cabinet mounted on this collider.
        if (id === 'shielding-gate' && furnishing.source === 'solid' && furnishing.x === 460 && furnishing.z === 210) continue;
        if (id === 'transmission-chamber' && furnishing.source === 'solid' && furnishing.x === 816 && furnishing.z === 380) continue;
        if (id === 'residential-gallery' && furnishing.source === 'solid'
            && furnishing.x >= 572 && furnishing.x <= 768
            && furnishing.z >= 241 && furnishing.z <= 279) continue;
        if (id === 'awakening-bay' && furnishing.source === 'solid'
            && furnishing.x >= 440 && furnishing.x <= 840
            && furnishing.z >= 240 && furnishing.z <= 350) continue;
        if (id === 'passenger-vault' && furnishing.source === 'solid'
            && furnishing.x >= 320 && furnishing.x <= 520
            && furnishing.z >= 260 && furnishing.z <= 360) continue;
        if (furnishing.source === 'solid' && ((id === 'diagnostic-gallery' && furnishing.x === 790 && furnishing.z === 340)
            || (id === 'safety-interlock-station' && furnishing.x === 650 && furnishing.z === 365)
            || (id === 'manual-control-chamber' && furnishing.x === 640 && furnishing.z === 380))) continue;
        instances.push({ pack: furnishing.pack, asset: furnishing.asset, matrix: matrix(furnishing.x / 32, 0, furnishing.z / 32, furnishing.angle, ...furnishing.scale), purpose: furnishing.space + ' / ' + furnishing.asset,cutaway:furnishing.source==='portal' });
    }
    if(id==='relay-racks') {
        // Exactly inside the existing 100 × 400-unit central solid.
        for(let i=instances.length-1;i>=0;i--) {
            const p=instances[i].matrix.elements;
            if(p[12]>606/32 && p[12]<706/32 && p[14]>300/32 && p[14]<700/32) instances.splice(i,1);
        }
        instances.push({pack:'p11-comms',asset:'relay-monolith-spine',matrix:matrix(656/32,0,500/32,0),purpose:'P11 central fibre spine',cutaway:true});
        instances.push({pack:'p11-comms',asset:'relay-crosspatch',matrix:matrix(640/32,0,24/32,0),purpose:'P11 north cross-aisle patch wall',cutaway:true});
    }
    // P11 landmarks replace the repeated overhead utility rafts.
    const hull = t.boundary ?? [{ x: 0, y: 0 }, { x: t.width, y: 0 }, { x: t.width, y: t.height }, { x: 0, y: t.height }];
    const addWall = (x: number, z: number, length: number, depth: number, angle: number, near: boolean, purpose: string) => {
        const count = Math.max(1, Math.ceil(length / 4.1));
        for (let n = 0; n < count; n++) {
            const along = -length / 2 + (n + .5) * length / count;
            instances.push({ pack: 'structure', asset: near ? 'wall-bulkhead-low' : 'wall-bulkhead', matrix: matrix(x + Math.cos(angle) * along, 0, z - Math.sin(angle) * along, angle, length / count / 4, 1, depth / .75), purpose, cutaway: near });
        }
    };
    for (let i = 0; i < hull.length; i++) {
        const p = hull[i], q = hull[(i + 1) % hull.length], dx = (q.x - p.x) / 32, dz = (q.y - p.y) / 32, length = Math.hypot(dx, dz);
        if (length < .25)
            continue;
        const nx = dz / length, nz = -dx / length, angle = -Math.atan2(dz, dx), x = (p.x + q.x) / 64, z = (p.y + q.y) / 64;
        addWall(x + nx * .375, z + nz * .375, length, .75, angle, dx < 0, 'Hull / manufactured cap, baseboard and source strip');
    }
    for (const [index, p] of (t.voids ?? []).entries()) {
        if(id==='transmission-chamber' && index===1)continue; // uplink owns chancel screen skin
        const xs = p.map(v => v.x / 32), zs = p.map(v => v.y / 32), w = Math.max(...xs) - Math.min(...xs), d = Math.max(...zs) - Math.min(...zs);
        if (Math.min(w, d) > 1.55 || p.length !== 4)
            continue;
        const x = (Math.min(...xs) + Math.max(...xs)) / 2, z = (Math.min(...zs) + Math.max(...zs)) / 2;
        addWall(x, z, Math.max(w, d), Math.min(w, d), w >= d ? 0 : Math.PI / 2, z > (plan?.arena.y ?? t.height / 2) / 32, 'Partition ' + index + ' / capped panel wall');
    }
    const solids = [hull, ...t.voids ?? [], ...t.obstacles.map(r => [{ x: r.x, y: r.y }, { x: r.x + r.width, y: r.y }, { x: r.x + r.width, y: r.y + r.height }, { x: r.x, y: r.y + r.height }])];
    const touchesConstruction = (p: {
        x: number;
        y: number;
    }) => solids.some(polygon => polygon.some((a, i) => {
        const b = polygon[(i + 1) % polygon.length], dx = b.x - a.x, dz = b.y - a.y, length = dx * dx + dz * dz;
        const f = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dz) / length)) : 0;
        return Math.hypot(p.x - a.x - dx * f, p.y - a.y - dz * f) < 4;
    }));
    const openings = plan?.apertures ?? plan?.openings.filter(o => touchesConstruction(o.from) || touchesConstruction(o.to)) ?? [];
    for (const opening of openings) {
        const p = opening.from, q = opening.to, dx = (q.x - p.x) / 32, dz = (q.y - p.y) / 32, length = Math.hypot(dx, dz);
        instances.push({ pack: 'structure', asset: 'door-threshold', matrix: matrix((p.x + q.x) / 64, -.025, (p.y + q.y) / 64, -Math.atan2(dz, dx), length / 4.5, 1, 1), purpose: 'Flush manufactured doorway threshold', castShadow: false });
    }
    instances.push(...room14Debris(id),...p11IncidentPlacements(id),...p11InfestedPlacements(id),...p11HabitationPlacements(id),...p11ControlPlacements(id),...p11ClinicalSecurityPlacements(id),...p11CargoPlacements(id),...p11MaintenancePlacements(id),...p11ServicePlacements(t));
    for(const piece of instances)alignIncidentInstance(id,piece);
    return instances;
}
/** Prepare only compressed or raw GLB bytes. Geometry work stays in the hold. */
export function prefetchOriginalRoomInteriors(t:RoomTemplate, renderer:T.WebGLRenderer):()=>Promise<void> {
    if(typeof requestIdleCallback!=='function')return async()=>{};
    let cancelled=false,handle:number;
    let packs: Iterator<OriginalKitPack>|undefined;
    let transfer=Promise.resolve();
    const schedule=()=>{
        handle=requestIdleCallback(deadline=>{
            if(cancelled)return;
            if(deadline.timeRemaining()<4){schedule();return;}
            if(!packs){
                packs=new Set(instancesFor(t).map(instance=>instance.pack)).values();
                schedule();
                return;
            }
            const next=packs.next();
            if(!next.done)transfer=prefetchOriginalShipKit(next.value,renderer).finally(()=>{if(!cancelled)schedule();});
        });
    };
    schedule();
    return ()=>{cancelled=true;cancelIdleCallback(handle);return transfer;};
}

/** Original model owner settles before combat warmup. Session transfers survive
 * a room cancellation; partial/late borrows retire independently and quietly. */
export function attachOriginalRoomInteriors(world: T.Group, t: RoomTemplate, onChanged: () => void, prerequisite: Promise<unknown> = Promise.resolve(), highQuality: () => boolean = () => true, renderer?: T.WebGLRenderer, record?: (phase:string, ms:number)=>void) {
    const controller = new AbortController(), borrowed = new Set<T.Group>(), sources = new Map<OriginalKitPack, T.Group>();
    const restores: (() => void)[] = [], geometryChanges: {
        mesh: T.Mesh;
        old: T.BufferGeometry;
        next: T.BufferGeometry;
    }[] = [];
    let active = true, root: T.Group | undefined, timer: ReturnType<typeof setTimeout>;
    const retire = () => { for (const source of borrowed)
        retireRoomModels(source); borrowed.clear(); sources.clear(); };
    const restore = () => { for (const undo of restores.reverse())
        undo(); restores.length = 0; };
    const owner = { state: 'loading', error: undefined as unknown, ready: Promise.resolve(), readyPromise: Promise.resolve(), dispose() { if (owner.state === 'disposed')
            return; active = false; controller.abort(); clearTimeout(timer); retire(); if (root) {
            disposeModel(root);
            root = undefined;
        } restore(); owner.state = 'disposed'; } };
    const work = async () => {
        try {
            await prerequisite;
            if (!active)
                return;
            const instances = instancesFor(t), packs = [...new Set(instances.map(i => i.pack))];
            const results = await Promise.allSettled([loadDeckSurfaces(world, t, () => active, dispose => restores.push(dispose),record), ...packs.map(async (pack) => {
                const source = await acquireOriginalShipKit(pack, controller.signal, renderer, record);
                if (!active) {
                    retireRoomModels(source);
                    return;
                }
                borrowed.add(source);
                sources.set(pack, source);
            })]);
            if (!active)
                return;
            const failed = results.find(r => r.status === 'rejected');
            if (failed?.status === 'rejected')
                throw failed.reason;
            const mergeStarted=performance.now();
            root = buildOriginalShipKit(sources, instances, t);
            record?.('kitMerge',performance.now()-mergeStarted);
            const dressingStarted=performance.now();
            const firstDetail=root.children.length;
            addDress13ServiceDetails(root, t.id);
            addDress13EarlyDetails(root, t.id);
            const firstIncident=root.children.length;
            addStoryIncident(root,t);
            for(const object of root.children.slice(firstIncident))object.applyMatrix4(incidentTransform(t.id));
            addRoom14Fittings(root,t.id);
            const raised=root.children.slice(firstDetail).filter(o=>o.name.startsWith('inc13-')||o.name==='room14-landmark-worklight');
            registerOriginalInteriorCutaways(root,raised.flatMap((object):InteriorCutaway[]=>{
                if(object instanceof T.Mesh&&object.geometry.userData.cutawayRanges){
                    object.updateWorldMatrix(true,false);
                    const ranges=object.geometry.userData.cutawayRanges as {bounds:T.Box3;start:number;end:number}[];
                    return ranges.map(({bounds,start,end})=>({bounds:bounds.clone().applyMatrix4(object.matrixWorld),
                        floorCover:t.id==='swarm-junction',parts:[],indices:{attribute:object.geometry.index!,start,end},hidden:false}));
                }
                // A fitted accessory must disappear with the imported machine under it.
                const owner=object.userData.cutawayAsset && root!.userData.placements.find(
                    (placement:{asset:string})=>placement.asset===object.userData.cutawayAsset);
                const bounds=owner ? new T.Box3(new T.Vector3().fromArray(owner.bounds[0]),new T.Vector3().fromArray(owner.bounds[1]))
                    : new T.Box3().setFromObject(object);
                // A preview volley strikes this face. Cutting it for the warning
                // at the point of impact would make the stopped round float.
                const shelter=object.name==='inc13-reactor-feeder-refuge';
                return bounds.max.y>.8?[{object,bounds,floorCover:shelter||t.id==='swarm-junction',
                    actorsOnly:shelter,parts:[],hidden:false}]:[];
            }));
            if(t.id==='shielding-gate'){
                const oldGate=world.getObjectByName('shielding-gate-west');
                if(oldGate){const visible=oldGate.visible;oldGate.visible=false;restores.push(()=>{oldGate.visible=visible;});}
            }
            addCeilingServices(root, t);
            addRecessedServices(root, t);
            record?.('incidentDressing',performance.now()-dressingStarted);
            const cutStarted=performance.now();
            // Replace skins on precisely those existing solids occupied by a new
            // original machine. Simulation still owns the old solid plus shallow bays.
            const replacements = shipInteriorFurnishings(t).filter(f => f.source === 'solid').map(f => {
                let bounds: T.Box3 | undefined;
                for (const p of root!.userData.placements as {
                    purpose: string;
                    bounds: number[][];
                }[])
                    if (p.purpose === f.space + ' / ' + f.asset)
                        bounds = new T.Box3(new T.Vector3().fromArray(p.bounds[0]), new T.Vector3().fromArray(p.bounds[1]));
                if (!bounds)
                    return null;
                return { x: (bounds.min.x + bounds.max.x) / 2, z: (bounds.min.z + bounds.max.z) / 2, angle: 0, scale: 1, width: bounds.max.x - bounds.min.x + .025, depth: bounds.max.z - bounds.min.z + .025, bottom: -.01, top: 2.2 };
            }).filter((v): v is NonNullable<typeof v> => v !== null);
            for(const p of root.userData.placements as {pack:string;bounds:number[][]}[]) {
                if(!p.pack.startsWith('p11-') || p.pack==='p11-service')continue;
                const [lo,hi]=p.bounds;
                replacements.push({x:(lo[0]+hi[0])/2,z:(lo[2]+hi[2])/2,angle:0,scale:1,
                    width:hi[0]-lo[0],depth:hi[2]-lo[2],bottom:Math.max(0,lo[1]),top:hi[1]});
            }
            // P11 owns the full native north bank, including edge headers that
            // sit just beyond the imported hero's mesh bounds.
            if(t.id==='awakening-bay')replacements.push({x:640/32,z:295/32,angle:0,scale:1,
                width:400/32,depth:110/32,bottom:-.01,top:2.6});
            if(t.id==='passenger-vault')replacements.push({x:420/32,z:310/32,angle:0,scale:1,
                width:200/32,depth:100/32,bottom:-.01,top:3.4});
            // Retire the old taller mast, not only geometry inside the new motor.
            if(t.id==='armory')replacements.push({x:ARMORY_CENTER.x/32,z:ARMORY_CENTER.y/32,angle:0,scale:1,
                width:160/32,depth:160/32,bottom:-.01,top:5});
            const thin = (t.voids ?? []).flatMap(p => {
                const xs = p.map(v => v.x / 32), zs = p.map(v => v.y / 32), w = Math.max(...xs) - Math.min(...xs), d = Math.max(...zs) - Math.min(...zs);
                return p.length === 4 && Math.min(w, d) <= 1.55 ? [{ x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2, angle: 0, scale: 1, width: w + .01, depth: d + .01, bottom: -.01, top: 2.4 }] : [];
            });
            const services = interiorFloorServices(t.id, t).map(s => ({ x: s.x / 32, z: s.z / 32, angle: s.angle, scale: 1, width: s.width, depth: s.depth, bottom: -.6, top: .026 }));
            const shared = new Set(geometries.values()), worldInverse = world.matrixWorld.clone().invert();
            world.traverse(o => {
                if (!(o instanceof T.Mesh) || Array.isArray(o.material))
                    return;
                for (let p: T.Object3D | null = o; p && p !== world; p = p.parent)
                    if (p.name === 'g2-world-dressing' || p.name === 'e9-room-interiors')
                        return;
                const name = o.material.name;
                if (name === 'ship-bulkhead' || name === 'ship-bulkhead-ribs') {
                    const visible = o.visible;
                    o.visible = false;
                    restores.push(() => { o.visible = visible; });
                    return;
                }
                const cuts = legacyFloorNames.has(name) ? services : name === 'ship-interior-cutaway' ? [...thin, ...replacements] : replacements;
                if (!cuts.length&&!legacyFloorNames.has(name))
                    return;
                const old = o.geometry, relative = new T.Matrix4().multiplyMatrices(worldInverse, o.matrixWorld);
                const construction = (old.index?old.toNonIndexed():old.clone()).applyMatrix4(relative);
                if(legacyFloorNames.has(name)){
                    const p=construction.getAttribute('position'),n=construction.getAttribute('normal');
                    // The replacement skin owns these millimetre-high finishes.
                    // Keep raised hardware and the shaft's retained grain hook;
                    // move only old horizontal floor faces below the new skin.
                    for(let i=0;i<p.count;i+=3){
                        const lo=Math.min(p.getY(i),p.getY(i+1),p.getY(i+2)),hi=Math.max(p.getY(i),p.getY(i+1),p.getY(i+2));
                        if(lo>=-.00001&&hi<=.026&&hi-lo<.0001&&n.getY(i)>.99)
                            for(let k=0;k<3;k++)p.setY(i+k,-.025);
                    }
                }
                const next = cuts.length?cutInteriorWallNiches(construction,cuts):construction;
                if(next!==construction)construction.dispose();
                next.applyMatrix4(relative.invert());
                o.geometry = next;
                // Keep replacement ownership simple: the room's normal disposal owns
                // new buffers. Retired private source buffers are released here once.
                geometryChanges.push({ mesh: o, old, next });
            });
            record?.('interiorCuts',performance.now()-cutStarted);
            const profile = INTERIOR_PROFILES[t.id], finishes = INTERIOR_WALL_FINISHES[t.id];
            root.traverse(o => {
                if (!(o instanceof T.Mesh) || Array.isArray(o.material) || !(o.material instanceof T.MeshStandardMaterial))
                    return;
                const m = o.material;
                if (finishes && m.name === 'e9-body')
                    m.color.setHex(finishes[0]);
                if (finishes && m.name === 'e9-ceramic')
                    m.color.setHex(finishes[1]);
                if (profile && m.name === 'e9-yellow' && !['crew-checkpoint', 'armory', 'freight-hold', 'breached-loading-bay', 'service-shaft-landing', 'infested-workshop', 'swarm-junction'].includes(t.id))
                    m.color.setHex(profile.trim);
                if (profile && m.name === 'e9-cyan') {
                    m.color.setHex(profile.key);
                    m.emissive.setHex(profile.key);
                    m.emissiveIntensity = 6;
                }
            });
            if (profile)
                for (const fixture of root.userData.lightFixtures as {
                    color: number;
                }[])
                    if (fixture.color === 0x65d8e6)
                        fixture.color = profile.key;
            if(t.id==='relay-racks') {
                const legacy=world.getObjectByName('relay-fixture-4');
                if(legacy){const visible=legacy.visible;legacy.visible=false;restores.push(()=>{legacy.visible=visible;});}
            }
            setOriginalShipKitQuality(root,highQuality());
            world.add(root);
            owner.state = 'ready';
            onChanged();
            const retired = new Set<T.BufferGeometry>();
            for (const change of geometryChanges)
                if (!shared.has(change.old) && !change.old.userData.sharedAsset)
                    retired.add(change.old);
            for (const geometry of retired)
                geometry.dispose();
            geometryChanges.length = 0;
        }
        finally {
            retire();
        }
    };
    const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error('Original ship kit preparation timed out')), 3000); });
    const cancelled = new Promise<void>(resolve => controller.signal.addEventListener('abort', () => resolve(), { once: true }));
    owner.ready = Promise.race([work(), deadline, cancelled]).catch(error => {
        if (!active)
            return;
        owner.error = error;
        active = false;
        controller.abort();
        retire();
        for (const change of geometryChanges.reverse()) {
            change.mesh.geometry = change.old;
            change.next.dispose();
        }
        geometryChanges.length = 0;
        if (root) {
            disposeModel(root);
            root = undefined;
        }
        restore();
        owner.state = 'fallback';
        console.error('Original ship interiors failed', error);
    }).finally(() => clearTimeout(timer));
    owner.readyPromise = owner.ready;
    return owner;
}
