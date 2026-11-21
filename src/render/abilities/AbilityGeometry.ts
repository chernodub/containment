import * as T from 'three';
import type { AbilitiesSnapshot, AbilityElement, AbilityEvent } from '../../game/abilities/contract';
import { createDeployableShieldMaterial } from '../vfx';
import { FriendlyBoundaryBatch, FRIENDLY_GROUND_ORDER } from './FriendlyBoundary';
import { AbilityLightningBatch } from './LightningBatch';
import type { Telegraph, EnergyRibbon } from '../vfx';
import { bindAbilityShape } from './shape';
import { createAbilityZoneMaterial } from './ZoneMaterials';
import type { GraphicsOptions } from '../graphicsOptions';
import type { GraphicsTier } from '../FrameBudget';
const UNIT = 32;
/** Interim budgets mirror A1's bounded inventory, with independent event slots. */
export const ABILITY_GEOMETRY_LIMITS = Object.freeze({ zones: 24, deployables: 8, links: 8, events: 32 });
const COLORS: Record<AbilityElement, number> = { kinetic: 0xffd063, cryo: 0x7fd6ff, pyro: 0xff7a2e, arc: 0xb79cff };
type ZoneSlot = {
    body: T.Mesh;
    start: T.Mesh;
    end: T.Mesh;
};
type DeployableSlot = {
    wall: T.Mesh;
    pylon: T.Mesh;
};
type EventSlot = {
    live: boolean;
    age: number;
    life: number;
    cast: boolean;
    ability: AbilityEvent['ability'];
    shape: Telegraph;
    beam: boolean;
    ribbon: EnergyRibbon;
};
const NO_LINKS: NonNullable<AbilitiesSnapshot['links']> = [];
/**
 * Authoritative persistent footprints and anticipation geometry for all rig presentations.
 * Snapshots own persistent geometry; events only own short cast/impact receipts.
 * All meshes/materials exist before prepare, and no GPU objects are made in combat.
 */
export class AbilityGeometry {
    readonly root = new T.Group();
    private footprints = new FriendlyBoundaryBatch(this.root, 112);
    private telegraphs = new FriendlyBoundaryBatch(this.root, ABILITY_GEOMETRY_LIMITS.events);
    private readonly ribbons = new AbilityLightningBatch(this.root, 80);
    private readonly circle = new T.PlaneGeometry(2, 2);
    private readonly strip = new T.PlaneGeometry(2, 2);
    private readonly box = new T.BoxGeometry(1, 1, 1);
    private readonly cylinder = new T.CylinderGeometry(1, 1, 1, 12);
    private readonly zoneMaterials = {
        cryo: createAbilityZoneMaterial('frost'), pyro: createAbilityZoneMaterial('fire'), arc: createAbilityZoneMaterial('electric'),
    };
    private readonly shieldMaterials = {
        kinetic: createDeployableShieldMaterial(COLORS.kinetic), cryo: createDeployableShieldMaterial(COLORS.cryo), arc: createDeployableShieldMaterial(COLORS.arc),
    };
    private readonly flatMaterials = {
        cryo: this.flat(COLORS.cryo), pyro: this.flat(COLORS.pyro), arc: this.flat(COLORS.arc),
    };
    private readonly auraMaterial = createAbilityZoneMaterial('aura');
    private low = false;
    private readonly materials = [...Object.values(this.zoneMaterials), ...Object.values(this.shieldMaterials), ...Object.values(this.flatMaterials), this.auraMaterial];
    private readonly animatedMaterials = [...Object.values(this.zoneMaterials), ...Object.values(this.shieldMaterials), ...Object.values(this.flatMaterials), this.auraMaterial];
    private readonly zones: ZoneSlot[] = [];
    private readonly deployables: DeployableSlot[] = [];
    private readonly events: EventSlot[] = [];
    private readonly eventShape: Telegraph = { shape: 'circle', x: 0, z: 0 };
    private readonly footprint: Telegraph = { shape: 'circle', x: 0, z: 0, progress: 1 };
    private readonly link: EnergyRibbon = { start: new T.Vector3(), end: new T.Vector3(), lightning: false };
    private ownsBoundaryBatches = true;
    /** Rich presentations pool casts, exact footprints and aftermath in one draw. */
    protected shareBoundaries(batch: FriendlyBoundaryBatch): void {
        this.footprints.dispose(); this.telegraphs.dispose();
        this.footprints = this.telegraphs = batch; this.ownsBoundaryBatches = false;
    }
    protected ownsLinkPresentation = true;
    /** Rich rig modules can own surfaces while this layer retains exact boundaries. */
    protected ownsZonePresentation = false;
    private nextEvent = 0;
    private time = 0;
    private reducedMotion = false;
    private disposed = false;
    constructor(scene: T.Object3D) {
        // Retained debug inventory name keeps the existing capture evidence contract working.
        this.root.name = 'interim-ability-visuals';
        this.telegraphs.priorityWeight = 0;
        // Interim footprints mark boundaries while preserving the authored deck and hostile silhouettes.
        for (const material of Object.values(this.zoneMaterials))
            material.uniforms.strength.value = 1;
        // Retain every selectable material in the tracked hierarchy even while no
        // snapshot uses it. MaterialWarmup registers hidden descendants as proxies.
        const inventory = new T.Group();
        inventory.name = 'interim-ability-material-library';
        inventory.visible = false;
        for (const material of this.materials)
            inventory.add(new T.Mesh(this.circle, material));
        this.root.add(inventory);
        // A strip's rectangle samples the center of G1's circular texture; round
        // end caps supply the exact capsule footprint used by segmentDistance.
        const uv = this.strip.getAttribute('uv');
        for (let i = 0; i < uv.count; i++)
            uv.setXY(i, .25 + uv.getX(i) * .5, .25 + uv.getY(i) * .5);
        for (let i = 0; i < ABILITY_GEOMETRY_LIMITS.zones; i++) {
            const body = this.ground(this.strip), start = this.ground(this.circle), end = this.ground(this.circle);
            this.zones.push({ body, start, end });
        }
        for (let i = 0; i < ABILITY_GEOMETRY_LIMITS.deployables; i++) {
            const wall = new T.Mesh(this.box, this.shieldMaterials.kinetic);
            const pylon = new T.Mesh(this.cylinder, this.shieldMaterials.arc);
            wall.visible = pylon.visible = false;
            this.root.add(wall, pylon);
            this.deployables.push({ wall, pylon });
        }
        for (let i = 0; i < ABILITY_GEOMETRY_LIMITS.events; i++)
            this.events.push({
                live: false, age: 0, life: 0, cast: false, ability: 'ram', beam: false,
                shape: { shape: 'circle', x: 0, z: 0 },
                ribbon: { start: new T.Vector3(), end: new T.Vector3(), lightning: false },
            });
        scene.add(this.root);
    }
    private flat(color: number): T.ShaderMaterial {
        return new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide,
            uniforms: { color: { value: new T.Color(color) }, strength: { value: .16 }, time: { value: 0 }, motion: { value: 0 } },
            vertexShader: 'varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
            fragmentShader: `uniform vec3 color;uniform float strength;varying vec2 p;
void main(){float r=length(p);if(r>1.)discard;float rim=1.-smoothstep(.006,.025,abs(r-.975));float n=fract(sin(dot(floor(p*20.),vec2(127.1,311.7)))*43758.5);gl_FragColor=vec4(color,strength*(rim*.5+step(.94,n)*smoothstep(.75,.96,r)*.025));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` });
    }
    setOptions(options: GraphicsOptions, tier: GraphicsTier, reducedMotion: boolean): void {
        this.low = tier === 'low';
        this.setReducedMotion(reducedMotion);
        for (const material of Object.values(this.zoneMaterials)) {
            material.uniforms.strength.value = 1;
            material.uniforms.low.value = this.low ? 1 : 0;
            material.uniforms.flash.value = options.flashIntensity;
        }
        this.auraMaterial.uniforms.flash.value = options.flashIntensity;
    }
    private ground(geometry: T.BufferGeometry): T.Mesh {
        const mesh = new T.Mesh(geometry, this.zoneMaterials.cryo);
        mesh.renderOrder = FRIENDLY_GROUND_ORDER;
        mesh.rotation.x = -Math.PI / 2;
        mesh.visible = false;
        this.root.add(mesh);
        return mesh;
    }
    /** Snapshot geometry remains readable on both tiers, including reduced motion. */
    setReducedMotion(value: boolean): void {
        this.reducedMotion = value;
        for (const material of this.materials)
            material.uniforms.motion.value = value ? 0 : 1;
    }
    /** Accept only spatial ability receipts; unknown/non-spatial phases are harmless. */
    event(event: AbilityEvent, x: number, y: number): void {
        if (this.disposed || !Number.isFinite(x) || !Number.isFinite(y))
            return;
        const phase = event.phase;
        if (phase === 'end') {
            for (const slot of this.events)
                if (slot.ability === event.ability)
                    slot.live = false;
            return;
        }
        if (phase !== 'cast' && phase !== 'impact' && phase !== 'burst' && phase !== 'link')
            return;
        if (phase === 'cast' && (!(event.durationMs! > 0) || !Number.isFinite(event.durationMs)))
            return;
        const slot = this.events[this.nextEvent % this.events.length];
        const shape = this.eventShape;
        const beam = phase === 'link';
        if (beam) {
            if (!Number.isFinite(event.targetX) || !Number.isFinite(event.targetY))
                return;
            slot.ribbon.start.set(x / UNIT, .35, y / UNIT);
            slot.ribbon.end.set(event.targetX! / UNIT, .35, event.targetY! / UNIT);
            slot.ribbon.color = COLORS[event.element];
            slot.ribbon.width = .035;
            slot.ribbon.opacity = .8;
        }
        else if (!bindAbilityShape(shape, event, x, y))
            return;
        shape.opacity = phase === 'cast' ? .65 : .18;
        slot.beam = beam;
        Object.assign(slot.shape, shape);
        slot.live = true;
        slot.age = 0;
        slot.life = phase === 'cast' ? event.durationMs! / 1000 : .22;
        slot.cast = phase === 'cast';
        slot.ability = event.ability;
        this.nextEvent++;
    }
    /** Render authoritative snapshots; callers pass zero delta while paused. */
    update(snapshot: AbilitiesSnapshot | undefined, delta: number, visible = true): void {
        if (this.disposed)
            return;
        const dt = Number.isFinite(delta) ? Math.max(0, delta) : 0;
        this.time += dt;
        this.root.visible = visible;
        for (const material of this.materials)
            material.uniforms.time.value = this.time;
        this.footprints.setTime(this.time, this.reducedMotion);
        this.telegraphs.setTime(this.time, this.reducedMotion);
        if (this.ownsBoundaryBatches) { this.footprints.clear(); this.telegraphs.clear(); }
        this.ribbons.begin();
        for (let i = 0; i < this.zones.length; i++) {
            const slot = this.zones[i], zone = snapshot?.zones[i];
            slot.body.visible = slot.start.visible = slot.end.visible = false;
            if (!zone || zone.remainingMs <= 0)
                continue;
            const material = zone.ability === 'meltdown' ? this.auraMaterial : this.zoneMaterials[zone.element === 'kinetic' ? 'arc' : zone.element];
            slot.body.material = slot.start.material = slot.end.material = material;
            const x = zone.x / UNIT, z = zone.y / UNIT;
            this.footprints.setColdDominance();
            if (zone.element === 'cryo' && zone.ability !== 'whiteout') {
                let dominantRadius = 0;
                for (const other of snapshot!.zones) if (other.ability === 'whiteout' && other.remainingMs > 0 && other.radius > dominantRadius) {
                    const reach = zone.shape === 'strip' ? Math.hypot(zone.x2 - zone.x, zone.y2 - zone.y) + zone.width * .5 : zone.radius;
                    if (Math.hypot(zone.x - other.x, zone.y - other.y) < other.radius + reach) {
                        dominantRadius = other.radius;
                        this.footprints.setColdDominance(other.x / UNIT, other.y / UNIT, other.radius / UNIT);
                    }
                }
            }
            if (zone.shape === 'circle') {
                slot.start.position.set(x, .04, z);
                slot.start.scale.set(zone.radius / UNIT, zone.radius / UNIT, 1);
                slot.start.visible = true;
                if (!this.ownsZonePresentation || zone.element !== 'pyro')
                    this.circleFootprint(x, z, zone.radius / UNIT, COLORS[zone.element]);
            }
            else {
                const ex = zone.x2 / UNIT, ez = zone.y2 / UNIT, length = Math.hypot(ex - x, ez - z), angle = Math.atan2(ez - z, ex - x), radius = zone.width / UNIT / 2;
                slot.body.position.set((x + ex) / 2, .04, (z + ez) / 2);
                slot.body.rotation.set(-Math.PI / 2, 0, -angle);
                slot.body.scale.set(length / 2, radius, 1);
                slot.body.visible = length > 0;
                slot.start.position.set(x, .04, z);
                slot.end.position.set(ex, .04, ez);
                slot.start.scale.set(radius, radius, 1);
                slot.end.scale.copy(slot.start.scale);
                slot.start.visible = slot.end.visible = true;
                this.footprints.priorityWeight = 1;
                this.footprints.addCapsule(x, z, length, radius * 2, angle, COLORS[zone.element], .22);
            }
        }
        this.footprints.setColdDominance();
        if (this.ownsZonePresentation) for (const slot of this.zones) slot.body.visible = slot.start.visible = slot.end.visible = false;
        for (let i = 0; i < this.deployables.length; i++) {
            const slot = this.deployables[i], entity = snapshot?.deployables[i];
            slot.wall.visible = slot.pylon.visible = false;
            if (!entity || entity.remainingMs <= 0 || entity.health <= 0)
                continue;
            const x = entity.x / UNIT, z = entity.y / UNIT, color = COLORS[entity.element];
            if (entity.kind === 'pylon') {
                slot.pylon.position.set(x, .625, z);
                slot.pylon.scale.set(entity.radius / UNIT, 1.25, entity.radius / UNIT);
                slot.pylon.visible = false;
                this.circleFootprint(x, z, entity.radius / UNIT, color);
            }
            else {
                slot.wall.material = entity.kind === 'ice-wall' ? this.shieldMaterials.cryo : this.shieldMaterials.kinetic;
                slot.wall.position.set(x, .7, z);
                slot.wall.rotation.y = -entity.angle;
                slot.wall.scale.set(entity.thickness / UNIT, 1.4, entity.length / UNIT);
                slot.wall.visible = false;
                const angle = entity.angle + Math.PI / 2, length = entity.length / UNIT;
                this.lineFootprint(x - Math.cos(angle) * length / 2, z - Math.sin(angle) * length / 2, length, entity.thickness / UNIT, angle, color);
            }
        }
        let linkCount = 0;
        for (const link of snapshot?.links ?? NO_LINKS) {
            if (linkCount++ >= ABILITY_GEOMETRY_LIMITS.links)
                break;
            const x = link.x / UNIT, z = link.y / UNIT, ex = link.targetX / UNIT, ez = link.targetY / UNIT, radius = link.width / UNIT / 2;
            this.lineFootprint(x, z, Math.hypot(ex - x, ez - z), radius * 2, Math.atan2(ez - z, ex - x), COLORS.arc);
            this.circleFootprint(x, z, radius, COLORS.arc);
            this.circleFootprint(ex, ez, radius, COLORS.arc);
            this.link.start.set(x, .35, z);
            this.link.end.set(ex, .35, ez);
            this.link.width = .035;
            this.link.color = COLORS.arc;
            if (this.ownsLinkPresentation) this.ribbons.append(this.link, this.time, this.reducedMotion);

        }
        for (const slot of this.events) {
            if (!slot.live)
                continue;
            slot.age += dt;
            if (slot.age >= slot.life) {
                slot.live = false;
                continue;
            }
            if (slot.beam)
                this.ribbons.append(slot.ribbon, this.time, this.reducedMotion);
            else {
                slot.shape.progress = slot.cast ? slot.age / slot.life : 1;
                this.telegraphs.priorityWeight = 0;
                this.telegraphs.add(slot.shape);
            }
        }
        this.ribbons.end();
        this.ribbons.mesh.visible = this.ribbons.mesh.count > 0;
        this.footprints.mesh.visible = this.footprints.mesh.count > 0;
        this.telegraphs.mesh.visible = this.telegraphs.mesh.count > 0;
    }
    private circleFootprint(x: number, z: number, radius: number, color: number): void {
        const shape = this.footprint;
        shape.shape = 'circle';
        shape.x = x;
        shape.z = z;
        shape.radius = radius;
        shape.color = color;
        shape.opacity = .22;
        this.footprints.priorityWeight = 1;
        this.footprints.add(shape);
    }
    private lineFootprint(x: number, z: number, length: number, width: number, angle: number, color: number): void {
        const shape = this.footprint;
        shape.shape = 'line';
        shape.x = x;
        shape.z = z;
        shape.length = length;
        shape.width = width;
        shape.angle = angle;
        shape.color = color;
        shape.opacity = .22;
        this.footprints.priorityWeight = 1;
        this.footprints.add(shape);
    }
    /** Keep resources allocated across rooms, retiring only room-local state. */
    clear(): void {
        for (const slot of this.zones)
            slot.body.visible = slot.start.visible = slot.end.visible = false;
        for (const slot of this.deployables)
            slot.wall.visible = slot.pylon.visible = false;
        for (const slot of this.events)
            slot.live = false;
        this.nextEvent = 0;
        this.footprints.clear();
        this.telegraphs.clear();
        this.ribbons.clear();
    }
    /** Dispose owned CPU/GPU resources once; context recovery reuses them before final disposal. */
    dispose(): void {
        if (this.disposed)
            return;
        this.disposed = true;
        this.clear();
        if (this.ownsBoundaryBatches) { this.footprints.dispose(); this.telegraphs.dispose(); }
        this.ribbons.dispose();
        this.circle.dispose();
        this.strip.dispose();
        this.box.dispose();
        this.cylinder.dispose();
        for (const material of this.materials)
            material.dispose();
        this.root.clear();
        this.root.removeFromParent();
    }
}
