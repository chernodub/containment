import * as T from 'three';
import { FriendlyBoundaryBatch } from './FriendlyBoundary';
import { AbilityLightningBatch, type EnergyRibbon } from './LightningBatch';
import type { Telegraph } from '../vfx';
import type { GraphicsOptions } from '../graphicsOptions';
import type { GraphicsTier } from '../FrameBudget';
import type { LightPool } from '../lighting/LightPool';
import type { DistortionField } from '../post/DistortionField';
import type { AbilityEvent, AbilityElement } from '../../game/abilities/contract';
import { ELEMENT_COLORS, UNIT } from './types';
import { EffectAtlas, EFFECT_TILES, FIRE_FAN_PHASE } from './EffectAtlas';
import { InstanceBatch, type Primitive } from './InstanceBatch';
import { authoredVariation } from './GraphicLanguage';
import { FlagshipFx } from './FlagshipFx';
export const ABILITY_VFX_LIMITS = Object.freeze({ particles: 768, rings: 64, beams: 64, decals: 32, instances: 2048 });
export type ScarKind = keyof typeof SCAR_KIND;
const SCAR_KIND = { crack: 0, frost: 1, trench: 2, fan: 3, star: 4, soot: 5, skid: 15, 'fuel-rim': 16, 'arc-track': 17 } as const;
type Particle = {
    live: boolean;
    kind: Primitive;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    size: number;
    life: number;
    age: number;
    color: number;
    seed: number;
    priority: number;
};
type Wave = {
    live: boolean;
    x: number;
    z: number;
    radius: number;
    life: number;
    age: number;
    color: number;
    reverse: boolean;
};
type Beam = {
    live: boolean;
    age: number;
    life: number;
    delay: number;
    ribbon: EnergyRibbon;
};
type Decal = {
    live: boolean;
    x: number;
    z: number;
    radius: number;
    color: number;
    age: number;
    life: number;
    angle: number;
    width: number;
    kind: number;
};
export interface StatusActor {
    readonly root: T.Object3D;
    readonly height: number;
    hit?(strength: number, direction: number): void;
    elementContact?(element: AbilityElement): void;
}
export interface AbilityServices {
    /** Read-only actor lookup for exact presentation bounds and status ownership. */
    statusActor?: (id: number) => StatusActor | undefined;
    lights: LightPool;
    distortion: DistortionField;
    camera: {
        addTrauma(n: number): void;
        punch(n: number, ms: number): void;
        kick(angle: number, n: number): void;
    };
    /** Existing HDR composite; no extra fullscreen pass or dynamic material. */
    presentation?: { setFlameGrade?(x: number, z: number, radius: number): void; setAbilityPresentation(exposure: number, warm: number, cool: number): void };
}
/** Frame epochs avoid clearing/repopulating a Set backing table in combat. */
class StatusOwnership {
    private readonly frames = new WeakMap<T.Object3D, number>();
    private epoch = 0;
    clear(): void { this.epoch++; }
    add(root: T.Object3D): void { this.frames.set(root, this.epoch); }
    has(root: T.Object3D): boolean { return this.frames.get(root) === this.epoch; }
}
/** Shared element language. Coordinates are render metres (simulation / 32), times seconds. */
export class ElementKit {
    readonly root = new T.Group();
    readonly batches: Record<Primitive, InstanceBatch>;
    readonly rings = new FriendlyBoundaryBatch(this.root, 304);
    readonly ribbons = new AbilityLightningBatch(this.root, 2048);
    /** VFX13 procedural hero surfaces (fire volume, scorch, lance, rings, frost, Overdrive floor). */
    readonly fx = new FlagshipFx(this.root);
    /** Claimed only for targets drawn this frame; legacy status batches cover overflow. */
    readonly atlas = new EffectAtlas();
    /** Owner readiness hook for the first room; never creates another texture. */
    prepare(): Promise<void> { return this.atlas.prepare(); }
    readonly statusOwners = new StatusOwnership();
    statusActor(id: number): StatusActor | undefined { return this.services?.statusActor?.(id); }
    time = 0;
    low = false;
    reducedMotion = false;
    flashIntensity = 1;
    private dynamicLights = true;
    private distortion = true;
    private services?: AbilityServices;
    private particles: Particle[] = Array.from({ length: ABILITY_VFX_LIMITS.particles }, () => ({ live: false, kind: 'spark', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, life: 1, age: 0, color: 0, seed: 0, priority: 0 }));
    private waves: Wave[] = Array.from({ length: ABILITY_VFX_LIMITS.rings }, () => ({ live: false, x: 0, z: 0, radius: 1, life: 1, age: 0, color: 0, reverse: false }));
    private beams: Beam[] = Array.from({ length: ABILITY_VFX_LIMITS.beams }, () => ({ live: false, age: 0, life: 1, delay: 0, ribbon: { start: new T.Vector3(), end: new T.Vector3() } }));
    private decals: Decal[] = Array.from({ length: ABILITY_VFX_LIMITS.decals }, () => ({ live: false, x: 0, z: 0, radius: 1, color: 0, age: 0, life: 1, angle: 0, width: 1, kind: 0 }));
    private cursor = 0;
    private waveCursor = 0;
    private beamCursor = 0;
    private decalCursor = 0;
    private serial = 0;
    private shape: Telegraph = { shape: 'shockwave', x: 0, z: 0 };
    private line: EnergyRibbon = { start: new T.Vector3(), end: new T.Vector3() };
    private light = { x: 0, y: 1, z: 0, color: 0, intensity: 0, distance: 1, duration: .15, priority: 2 };
    private readonly viewPosition = new T.Vector3(0, 8, 8);
    private readonly flowAxis = new T.Vector3();
    private readonly flowView = new T.Vector3();
    private readonly flowSide = new T.Vector3();
    private readonly flowNormal = new T.Vector3();
    private viewRightX = 1;
    private viewRightZ = 0;
    private disposed = false;
    private instanceCount = 0;
    private exposure = 0;
    private warm = 0;
    private cool = 0;
    /** 0 for impact/attached signals, 1 for sustained friendly coverage. */
    priorityWeight = 0;
    sustain(age = 1): void { this.priorityWeight = Math.max(0, Math.min(1, (age - .25) / .12)); }
    impact(): void { this.priorityWeight = 0; }
    peakLights = 0;
    peakParticles = 0;
    peakInstances = 0;
    constructor(root: T.Object3D) {
        root.add(this.root);
        this.root.name = 'ability-element-kit';
        this.batches = { contact: new InstanceBatch(this.root, 'spark', 32, this.atlas), shard: new InstanceBatch(this.root, 'shard', 512, this.atlas), spark: new InstanceBatch(this.root, 'spark', 512, this.atlas), smoke: new InstanceBatch(this.root, 'smoke', 192, this.atlas), flame: new InstanceBatch(this.root, 'flame', 384, this.atlas), solid: new InstanceBatch(this.root, 'solid', 512, this.atlas), ghost: new InstanceBatch(this.root, 'ghost', 128, this.atlas), decal: new InstanceBatch(this.root, 'decal', 64, this.atlas), front: new InstanceBatch(this.root, 'front', 64, this.atlas) };
        this.batches.contact.mesh.renderOrder = 6;
        (this.batches.contact.mesh.material as T.ShaderMaterial).depthTest = false;
    }
    setView(camera: T.Camera): void { this.viewPosition.copy(camera.position); this.viewRightX = camera.matrixWorld.elements[0]; this.viewRightZ = camera.matrixWorld.elements[2]; for (const k in this.batches)
        this.batches[k as Primitive].setView(camera); }
    bind(services: AbilityServices): void { this.services = services; }
    setOptions(options: GraphicsOptions, tier: GraphicsTier, reducedMotion: boolean): void {
        if (tier === 'low' && !this.low) {
            for (let i = 160; i < this.particles.length; i++)
                this.particles[i].live = false;

        }
        this.low = tier === 'low';
        this.fx.low = this.low;
        this.fx.flashIntensity = options.flashIntensity * (reducedMotion ? .5 : 1);
        this.batches.flame.maxCoverage = this.low ? .16 : .30;
        this.batches.smoke.maxCoverage = this.low ? .10 : .18;
        this.batches.decal.maxCoverage = this.low ? .14 : .28;
        this.ribbons.low = this.low;
        this.reducedMotion = reducedMotion;
        this.flashIntensity = options.flashIntensity * (reducedMotion ? .5 : 1);
        this.dynamicLights = options.dynamicLights;
        this.distortion = options.distortion;
    }
    /** Allocation-free solid, crystal, ember, smoke, flame, decal or ghost instance. */
    draw(kind: Primitive, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: number, opacity = 1, angle = 0, tilt = 0, variant = 0): void {
        if (this.instanceCount >= ABILITY_VFX_LIMITS.instances)
            return;
        const batch = this.batches[kind], before = batch.mesh.count;
        batch.priorityWeight = this.priorityWeight;
        batch.draw(x, y, z, sx, sy, sz, color, opacity * (kind === 'spark' || kind === 'flame' ? .35 + .65 * this.flashIntensity : 1), angle, tilt, variant);
        this.instanceCount += batch.mesh.count - before;
    }
    /** Authored atlas stamp in retained alpha/light pools; dimensions are half extents. */
    sprite(tile: keyof typeof EFFECT_TILES | number, x: number, y: number, z: number,
        halfWidth: number, halfHeight: number, color: number, opacity = 1, seed = 0,
        plane: 'billboard' | 'ground' | 'vertical' | 'light' | 'ground-light' = 'billboard', yaw = 0, tilt = 0): void {
        const index = typeof tile === 'number' ? tile : EFFECT_TILES[tile];
        this.draw(plane === 'light' || plane === 'ground-light' ? 'spark' : 'decal', x, y, z, halfWidth, halfHeight, 1,
            color, opacity, yaw, tilt, (plane === 'ground' || plane === 'ground-light' ? 1000 : plane === 'vertical' ? 600 : 200) + index + authoredVariation(seed) * .95);
    }

    private readonly contacts = Array.from({ length: 24 }, () => ({
        age: 4, frames: 0, x: 0, z: 0, size: 1, angle: 0, element: 'kinetic' as AbilityElement,
    }));
    private nextContact = 0;

    /** Rig owners supply the native footprint. A contact only marks its point of impact. */
    contact(event: AbilityEvent, x: number, y: number): void {
        const launch = event.phase === 'dash-start';
        if (!launch && event.phase !== 'impact' && event.phase !== 'dash-end') return;
        const placed = !launch && (event.phase === 'dash-end' || event.slot === 'power' ||
            (event.ability === 'flashfire' && event.radius !== undefined && event.arcRadians === undefined));
        const mark = this.contacts[this.nextContact++ % this.contacts.length];
        mark.x = (placed ? event.targetX ?? x : x) / UNIT;
        mark.z = (placed ? event.targetY ?? y : y) / UNIT;
        mark.angle = event.angle ?? 0;
        mark.element = event.element;
        mark.age = mark.frames = 0;
        mark.size = Math.min(2.4, Math.max(.55, (event.radius ?? 60) / UNIT * .55));
        this.flash(mark.x, mark.z, ELEMENT_COLORS[event.element], 10 + mark.size * 5, 3 + mark.size, 4, .16);
    }

    private drawContacts(dt: number): void {
        for (const mark of this.contacts) {
            if (mark.age >= 3) continue;
            mark.age += dt;
            const { age, x, z, size, angle, element } = mark;
            const color = ELEMENT_COLORS[element];
            this.sustain();
            if (age < .051 && mark.frames < 3) {
                const extent = .42 + size * .39;
                this.impact();
                this.sprite('glow', x, .10, z, extent * 1.6, extent, color, .78 * this.flashIntensity, angle, 'ground');
                this.sprite('glow', x, .36 + age * 5, z, extent * .58, extent, 0xfff1cf, this.flashIntensity, angle, 'light');
                if (element === 'pyro') this.directedFlame(x, .12, z, extent * .55, extent * 2.3, angle, .42, angle, this.flashIntensity, true);
                this.sustain();
                if (dt > 0) mark.frames++;
            }
            const fade = Math.max(0, 1 - age / 3) * Math.min(1, age * 9);
            const tile = element === 'cryo' ? 'frost' : element === 'arc' ? 'scorch' : 'crack';
            this.sprite(tile, x, .047, z, size, size * .78, color, fade * .82, angle, 'ground', 0, -angle);
            for (let i = 0; i < (this.low ? 2 : 5); i++) {
                const a = angle + i * 2.4, r = size * (.32 + i % 3 * .17);
                const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
                if (element === 'cryo') {
                    const h = (.18 + i % 3 * .11) * fade;
                    this.draw('shard', px, h, pz, .066, h, .08, color, fade, a, .36);
                } else if (element === 'pyro') {
                    const rise = (age * .85 + i * .31) % 1;
                    this.sprite('ember', px, .09 + rise * .84, pz, .065, .1, color, fade * (1 - rise), a, 'light');
                } else if (element === 'kinetic') {
                    this.sprite('dust', px, .16 + age * .36, pz, .18 + age * .11, .28, 0x998d7e, fade * .36, a);
                } else {
                    this.sprite('ember', px, .063, pz, .12, .09, color, fade, a, 'ground');
                }
            }
        }
        this.impact();
    }

    mote(kind: Primitive, x: number, y: number, z: number, vx: number, vy: number, vz: number, size: number, life: number, color: number): void {
        const cap = this.low ? 160 : this.particles.length, p = this.particles[this.cursor++ % cap];
        p.live = true;
        p.kind = kind;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = vx;
        p.vy = vy;
        p.vz = vz;
        p.size = size;
        p.life = life;
        p.age = 0;
        p.color = color;
        p.seed = ++this.serial;
        p.priority = this.priorityWeight;
    }
    burst(x: number, y: number, z: number, element: AbilityElement, count = 24, speed = 3, life = .7): void {
        count = this.low ? Math.min(6, count) : count;
        for (let i = 0; i < count; i++) {
            const angle = i * 2.3999632297 + this.serial * .13, f = .4 + (i % 7) / 10;
            this.mote(element === 'cryo' ? 'shard' : element === 'pyro' ? 'flame' : 'spark', x, y, z, Math.cos(angle) * speed * f, (.2 + i % 5 * .16) * speed, Math.sin(angle) * speed * f, element === 'cryo' ? .06 : .09, life * (.6 + i % 4 * .15), ELEMENT_COLORS[element]);
        }
    }
    ring(x: number, z: number, radius: number, color: number, life = .65, reverse = false): void {
        if (radius <= 0)
            return;
        const p = this.waves[this.waveCursor++ % this.waves.length];
        p.live = true;
        p.x = x;
        p.z = z;
        p.radius = radius;
        p.color = color;
        p.life = life;
        p.age = 0;
        p.reverse = reverse;
    }
    outline(x: number, z: number, radius: number, color: number, opacity = .25, progress = 1): void {
        const s = this.shape;
        s.shape = 'circle';
        s.x = x;
        s.z = z;
        s.radius = radius;
        s.color = color;
        s.opacity = opacity;
        s.progress = progress;
        this.rings.priorityWeight = this.priorityWeight;
        this.rings.add(s);
    }
    beam(x: number, y: number, z: number, tx: number, ty: number, tz: number, color: number, width = .035, life = .22, lightning = true, delay = 0, clipToHud = false): void {
        const p = this.beams[this.beamCursor++ % this.beams.length];
        p.live = true;
        p.age = 0;
        p.life = life;
        p.delay = delay;
        const r = p.ribbon;
        r.start.set(x, y, z);
        r.end.set(tx, ty, tz);
        r.color = color;
        r.width = width;
        r.lightning = lightning;
        r.seed = ++this.serial;
        r.clipToHud = clipToHud;
    }
    ribbon(x: number, y: number, z: number, tx: number, ty: number, tz: number, color: number, width = .035, opacity = .6, lightning = true): void {
        const r = this.line;
        r.start.set(x, y, z);
        r.end.set(tx, ty, tz);
        r.color = color;
        r.width = width;
        r.opacity = opacity * this.flashIntensity;
        r.lightning = lightning;
        r.seed = 7;
        this.ribbons.priorityWeight = this.priorityWeight;
        this.ribbons.append(r, this.time, this.reducedMotion);
    }
    decal(x: number, z: number, radius: number, color: number, life = 5, angle = 0): void {
        const p = this.decals[this.decalCursor++ % this.decals.length];
        p.live = true;
        p.x = x;
        p.z = z;
        p.radius = radius;
        p.color = color;
        p.life = life;
        p.age = 0;
        p.angle = angle;
        p.width = radius;
        p.kind = 0;
    }
    hideFloorResidues(): void {
        this.batches.decal.mesh.visible = false;
        this.fx.hideFloorResidues();
    }
    /** Persistent shaped floor aftermath; half-length/half-width are exact bounds. */
    scar(kind: ScarKind, x: number, z: number, radius: number, color: number, life = 8, angle = 0, width = radius, arc = 1.28): void {
        this.decal(x, z, radius, color, life, -angle);
        const p = this.decals[(this.decalCursor - 1) % this.decals.length];
        p.width = width; p.kind = SCAR_KIND[kind] + (kind === 'fan' ? arc / (Math.PI * 4) : 0);
    }
    /** One instanced volume, its outer radius never exceeds the authoritative radius. */
    front(x: number, z: number, radius: number, progress: number, color: number, height = 1.5, opacity = .65, style = 0): void {
        const r = radius * Math.max(.015, Math.min(1, progress));
        const h = height * (this.low ? .6 : 1);
        this.draw('front', x, h * .5 + .025, z, r, h / .24, r, color, opacity * (.35 + .65 * this.flashIntensity), 0, 0, style);
    }
    /** Cryo keeps crystal chunks; kinetic pressure throws short hot deck splinters.
     * The Breacher owner draws the larger manufactured plates from its fixed impact pool.
     */
    debris(x: number, z: number, radius: number, element: 'kinetic' | 'cryo', count = 28): void {
        count = this.low ? Math.min(8, count) : Math.min(64, count);
        for (let i = 0; i < count; i++) {
            const a = i * 2.39996323, speed = radius * (.65 + i % 7 * .09);
            const cold = element === 'cryo';
            this.mote(cold ? 'shard' : 'spark', x + Math.cos(a) * .25, .12, z + Math.sin(a) * .25,
                Math.cos(a) * speed, cold ? 2 + i % 5 * .55 : .7 + i % 5 * .24, Math.sin(a) * speed,
                cold ? .12 + Math.sin(i * 7.13) ** 2 * .17 : .025 + i % 3 * .012,
                cold ? 1.2 + i % 3 * .15 : .38 + i % 3 * .09,
                cold ? (i % 3 ? 0x7fd6ff : 0xe8fbff) : (i % 4 ? 0xffd063 : 0xe8fbff));
        }
    }
    /** Thick hot core, broad corona and persistent glowing air, all in the existing ribbon draw. */
    heavyBeam(x: number, y: number, z: number, tx: number, ty: number, tz: number, color: number, width = .35, life = .7, lightning = false, delay = 0): void {
        this.beam(x, y, z, tx, ty, tz, 0xfff5e5, width, .065, lightning, delay);
        this.beam(x, y, z, tx, ty, tz, color, width * 1.6, .19, lightning, delay);
        this.beam(x, y, z, tx, ty, tz, color, width * .45, life, lightning, delay);
    }
    /** Broken rising tongues vary size and lifetime without allocations. */
    flameTongue(x: number, z: number, width: number, height: number, seed: number, opacity = 1, core = false): void {
        const cycle = this.reducedMotion ? .43 : (this.time * (1.7 + Math.sin(seed) * .35) + seed * .6180339) % 1;
        const life = Math.sin(cycle * Math.PI);
        const h = height * (.6 + life * .4);
        this.draw('flame', x + Math.sin(seed * 7.1 + cycle * 5) * width * .16,
            .04 + h * .5 + cycle * .13, z + Math.cos(seed * 3.7 + cycle * 6) * width * .12,
            width * (.65 + life * .35), h * .5, 1, core ? 0xffedb5 : 0xff7a2e, opacity * (.3 + life * .55));
    }
    /** Low glossy fuel surface, leaving flame placement to the owning ability. */
    liquidFire(x: number, z: number, radius: number, opacity = 1): void {
        this.draw('decal', x, .045, z, radius, radius, 1, 0xff7a2e, opacity, 0, 0, 8);
    }
    /** Overlapping atlas tongues follow rays from the native origin through the entire hit sector. */
    fireFan(x: number, z: number, radius: number, angle: number, arc: number, opacity: number,
        height: number, sourceX: number, sourceZ: number, peak: boolean): void {
        const c = Math.cos(angle), s = Math.sin(angle);
        this.services?.presentation?.setFlameGrade?.(x + c * radius * .5, z + s * radius * .5, radius * .82);
        this.flowFlame(sourceX, height, sourceZ, x + c * radius * .23, height,
            z + s * radius * .23, radius * .084, .71, opacity, true);

        const halfArc = arc * .5;
        this.draw('flame', x + c * radius * .5, height, z + s * radius * .5,
            radius * Math.sin(halfArc), radius * .5, 1, 0xff872b, opacity,
            angle, 0, FIRE_FAN_PHASE + (peak ? 4 : 0) + halfArc);
    }

    /** Short authored flame card aligned to the actual three-dimensional flow. */
    flowFlame(x: number, y: number, z: number, tx: number, ty: number, tz: number, width: number, seed: number, opacity = 1, core = false): void {
        this.flowCard('flame', x, y, z, tx, ty, tz, width, core ? 0xffedb5 : 0xff7a2e, opacity, 100 + Math.abs(seed) % 64);
    }
    /** Place the ember on the camera-facing skin of its posed joint. */
    jointEmber(x: number, y: number, z: number, radius: number, height: number, seed: number, opacity = 1): void {
        const lift = this.flowView.set(this.viewPosition.x - x, this.viewPosition.y - y, this.viewPosition.z - z)
            .normalize().multiplyScalar(radius * .54);
        x += lift.x; y += lift.y; z += lift.z;
        this.flowCard('flame', x, y, z, x + radius * .20, y + height, z + radius * .13,
            Math.max(.14, radius * .34), 0xfff5c9, opacity, -1 - Math.abs(seed % 63));
    }
    /** Authored animated bolt strip for suit crawl/contact flashes; long chains keep their structure. */
    boltCard(x: number, y: number, z: number, tx: number, ty: number, tz: number, width: number, seed: number, opacity = 1, color = 0xb79cff): void {
        this.flowCard('spark', x, y, z, tx, ty, tz, width * 3.5, color, opacity, 376 + authoredVariation(seed) * .95);
    }
    private flowCard(kind: Primitive, x: number, y: number, z: number, tx: number, ty: number, tz: number, width: number, color: number, opacity: number, variant: number): void {
        const axis = this.flowAxis.set(tx - x, ty - y, tz - z), length = axis.length();
        if (length < .01) return;
        axis.multiplyScalar(1 / length);
        const mx = (x + tx) * .5, my = (y + ty) * .5, mz = (z + tz) * .5;
        this.flowView.set(this.viewPosition.x - mx, this.viewPosition.y - my, this.viewPosition.z - mz);
        this.flowSide.crossVectors(axis, this.flowView);
        if (this.flowSide.lengthSq() < .0001) this.flowSide.set(1, 0, 0); else this.flowSide.normalize();
        this.flowNormal.crossVectors(this.flowSide, axis).normalize();
        const batch = this.batches[kind], before = batch.mesh.count;
        this.draw(kind, mx, my, mz, width, length * .5, 1, color, opacity, 0, 0, variant);
        if (batch.mesh.count === before) return;
        const matrix = batch.mesh.instanceMatrix.array, o = before * 16;
        matrix[o] = this.flowSide.x * width; matrix[o + 1] = this.flowSide.y * width; matrix[o + 2] = this.flowSide.z * width;
        matrix[o + 4] = axis.x * length * .5; matrix[o + 5] = axis.y * length * .5; matrix[o + 6] = axis.z * length * .5;
        matrix[o + 8] = this.flowNormal.x; matrix[o + 9] = this.flowNormal.y; matrix[o + 10] = this.flowNormal.z;
    }
    private flameTilt(angle: number, lean: number): number {
        return -Math.atan((Math.cos(angle) * this.viewRightX + Math.sin(angle) * this.viewRightZ) * lean);
    }
    /** Analytic tongue leaning along a world direction; shares the prepared flame draw. */
    directedFlame(x: number, y: number, z: number, width: number, height: number, angle: number, lean: number, seed: number, opacity = 1, core = false): void {
        const cycle = this.reducedMotion ? .4 : (this.time * (1.6 + Math.sin(seed) * .25) + seed * .6180339) % 1;
        this.draw('flame', x, y + height * .5, z, width, height * (.38 + Math.sin(cycle * Math.PI) * .12), 1,
            core ? 0xffedb5 : 0xff7a2e, opacity, 0, this.flameTilt(angle, lean), 64 + Math.abs(seed) % 32);
    }
    /** Glossy ballistic fuel lobe, sharing the retained decal plane and material. */
    fuelDroplet(x: number, y: number, z: number, halfWidth: number, halfHeight: number, tilt: number, seed: number, opacity = 1): void {
        this.draw('decal', x, y, z, halfWidth, halfHeight, 1, 0x963914, opacity, 0, tilt,
            11 + (Math.sin(seed * 7.13) * .5 + .5) * .2);
    }
    /** Irregular ground frost within the exact rounded strip, including both end caps. */
    frostFilm(x: number, z: number, length: number, halfWidth: number, angle: number, opacity = .7): void {
        if (halfWidth <= 0) return;
        const halfLength = Math.max(0, length) * .5 + halfWidth;
        this.draw('decal', x, .043, z, halfLength, halfWidth, 1, 0x9bdcf0, opacity, 0, -angle,
            14 + halfWidth / halfLength * .8);
    }
    /** Curved ground-mist brush stroke; length/width are complete world bounds. */
    gust(x: number, z: number, length: number, width: number, angle: number, seed: number, opacity = .4, color = 0x9bdcf0): void {
        this.draw('decal', x, .055, z, length * .5, width * .5, 1, color, opacity, 0, -angle,
            10 + (Math.sin(seed * 7.13) * .5 + .5) * .4);
    }
    /** Soft perimeter vapor, sharing the prepared ground/aftermath draw as a billboard variant. */
    stormWisp(x: number, y: number, z: number, halfWidth: number, halfHeight: number, seed: number, opacity: number): void {
        this.draw('decal', x, y, z, halfWidth, halfHeight, 1, 0x7fd6ff, opacity, 0, 0,
            12 + authoredVariation(seed, 5) * .8);
    }
    /** Solid-looking faceted translucent column, with a narrow luminous internal vein. */
    iceColumn(x: number, z: number, width: number, depth: number, height: number, angle: number, opacity = 1): void {
        this.draw('solid', x, height * .43, z, depth * .94, height * .86, width * .94, 0x4c9abc, opacity * .72, -angle);
        this.draw('shard', x, height * .5, z, depth * .49, height * .5, width * .49, 0x9be7ff, opacity * .39, -angle, .07);
        if (!this.low) this.draw('shard', x, height * .57, z, depth * .14, height * .41, width * .13, 0xe8fbff, opacity * .36, -angle);
    }
    /** One restrained shell; the frozen actor remains the dominant interior shape. */
    iceShell(x: number, z: number, radius: number, height: number, opacity = .35): void {
        // Actor materials own upper-body frost. Keep ability ice at the feet so
        // Whiteout cannot replace distinct family anatomy with matching statues.
        this.draw('shard', x, height * .11, z, radius * 1.05, height * .11, radius * 1.05, 0x6fa8bb, opacity, 0, 0, 7.3);
    }
    /** One clean authored echo silhouette; weapon and split stride share one instance. */
    afterImage(x: number, z: number, angle: number, color: number, opacity: number, lean = 0): void {
        const facing = Math.atan2(this.viewPosition.x - x, this.viewPosition.z - z);
        const direction = Math.cos(angle) * this.viewRightX + Math.sin(angle) * this.viewRightZ >= 0 ? 1 : -1;
        this.draw('ghost', x, .98, z, .98 * direction, 1.96, .35, color, opacity, facing,
            -Math.cos(angle) * Math.min(.16, Math.abs(lean)));
    }
    /** One-frame exposure impulse, suppressed by photosensitivity/reduced motion options. */
    exposureFlash(amount = .75): void { if (!this.reducedMotion) this.exposure = Math.max(this.exposure, Math.min(1, amount) * this.flashIntensity); }
    /** Refresh every active frame; resets automatically when the owning rig stops. */
    grade(warm = 0, cool = 0): void { this.warm = Math.max(this.warm, warm); this.cool = Math.max(this.cool, cool); }
    flash(x: number, z: number, color: number, intensity = 8, distance = 5, priority = 3, duration = .18): void {
        if (this.low || !this.dynamicLights)
            return;
        const r = this.light;
        r.x = x;
        r.z = z;
        r.color = color;
        r.y = 1;
        r.intensity = intensity * this.flashIntensity;
        r.distance = distance;
        r.priority = priority;
        r.duration = duration;
        this.services?.lights.flash(r);
        this.measureLights();
    }
    lightAt(id: number, x: number, z: number, color: number, intensity = 2, distance = 4, priority = 2, height = 1): void {
        if (this.low || !this.dynamicLights)
            return;
        const r = this.light;
        r.x = x;
        r.z = z;
        r.color = color;
        r.y = height;
        r.intensity = intensity;
        r.distance = distance;
        r.priority = priority;
        r.duration = .1;
        this.services?.lights.attach(-200000 - id, r);
        this.measureLights();
    }
    private measureLights(): void {
        const lights = this.services?.lights.lights;
        if (!lights)
            return;
        let live = 0;
        for (const light of lights)
            if (light.intensity > 0)
                live++;
        this.peakLights = Math.max(this.peakLights, live);
    }
    distort(x: number, z: number, radius: number, strength = .004, life = .6, heat = false): void {
        if (this.low || this.reducedMotion || !this.distortion)
            return;
        if (heat)
            this.services?.distortion.heat(x, z, radius, strength, life);
        else
            this.services?.distortion.shockwave(x, z, radius, strength, life);
    }
    anticipate(ms: number, amount = .012): void { if (!this.reducedMotion)
        this.services?.camera.punch(amount, ms); }
    camera(weight = .12, angle?: number): void {
        if (this.reducedMotion)
            return;
        this.services?.camera.addTrauma(weight);
        if (weight > .2)
            this.services?.camera.punch(Math.min(.035, weight * .06), weight >= .5 ? 34 : 220);
        if (angle !== undefined)
            this.services?.camera.kick(angle, weight * .1);
    }
    begin(dt: number): void {
        this.statusOwners.clear();
        this.time += dt;
        this.impact();
        this.services?.presentation?.setFlameGrade?.(0, 0, 0);
        this.warm = this.cool = 0;
        this.instanceCount = 0;
        this.rings.setTime(this.time, this.reducedMotion);
        this.fx.update(dt, this.time, this.reducedMotion);
        this.rings.clear();
        this.ribbons.begin();
        this.ribbons.priorityWeight = 0;
        for (const kind in this.batches)
            this.batches[kind as Primitive].begin(this.reducedMotion ? 0 : this.time);
        this.drawContacts(dt);
        let live = 0;
        for (const p of this.particles) {
            if (!p.live)
                continue;
            p.age += dt;
            if (p.age >= p.life) {
                p.live = false;
                continue;
            }
            live++;
            const motion = this.reducedMotion ? .2 : 1;
            p.x += p.vx * dt * motion;
            p.y += p.vy * dt * motion;
            p.z += p.vz * dt * motion;
            if (p.kind === 'shard' || p.kind === 'spark' || p.kind === 'solid')
                p.vy -= dt * (p.kind === 'solid' ? 9.8 : 4);
            else
                p.vy += dt * .15;
            if (p.y < .04 && p.vy < 0 && (p.kind === 'solid' || p.kind === 'shard')) {
                p.vy *= -.28; p.vx *= .55; p.vz *= .55;
            }
            p.y = Math.max(.04, p.y);
            const fade = 1 - p.age / p.life, s = p.size * (p.kind === 'smoke' ? 1 + p.age * 2 : 1);
            this.sustain(p.age);
            this.priorityWeight = Math.max(this.priorityWeight, p.priority);
            this.draw(p.kind, p.x, p.y, p.z, s, p.kind === 'spark' ? s * 2 : s, s, p.color, fade * (p.kind === 'smoke' ? .22 : .7), p.seed * .8, p.seed + p.age, p.kind === 'smoke' || p.kind === 'flame' ? 64 + p.seed % 64 : 0);
        }
        this.impact();
        this.peakParticles = Math.max(this.peakParticles, live);
        for (const p of this.waves) {
            if (!p.live)
                continue;
            p.age += dt;
            if (p.age >= p.life) {
                p.live = false;
                continue;
            }
            const s = this.shape;
            s.shape = 'shockwave';
            s.x = p.x;
            s.z = p.z;
            s.radius = p.radius;
            s.color = p.color;
            s.progress = p.reverse ? 1 - p.age / p.life : p.age / p.life;
            s.opacity = (1 - p.age / p.life) * .65 * this.flashIntensity;
            this.rings.priorityWeight = Math.max(0, Math.min(1, (p.age - .25) / .12));
            this.rings.add(s);
        }
        for (const p of this.beams) {
            if (!p.live)
                continue;
            p.age += dt;
            if (p.age >= p.life + p.delay) {
                p.live = false;
                continue;
            }
            if (p.age < p.delay)
                continue;
            p.ribbon.opacity = (1 - (p.age - p.delay) / p.life) * this.flashIntensity;
            this.ribbons.priorityWeight = Math.max(0, Math.min(1, (p.age - p.delay - .25) / .12));
            this.ribbons.append(p.ribbon, this.time, this.reducedMotion);
        }
        for (const p of this.decals) {
            if (!p.live)
                continue;
            p.age += dt;
            if (p.age >= p.life) {
                p.live = false;
                continue;
            }
            if (this.instanceCount >= ABILITY_VFX_LIMITS.instances) continue;
            const b = this.batches.decal, before = b.mesh.count;
            b.priorityWeight = Math.max(0, Math.min(1, (p.age - .25) / .12));
            b.draw(p.x, .027, p.z, p.radius, p.width, 1, p.color, Math.min(1, (p.life - p.age) / Math.min(3, p.life * .4)) * .8, 0, p.angle, p.kind === 2 ? 2 + .1 * Math.max(0, 1 - p.age / 3) : p.kind);
            this.instanceCount += b.mesh.count - before;
        }
    }
    end(): void { this.fx.commit(); this.services?.presentation?.setAbilityPresentation(this.exposure, this.warm * this.flashIntensity, this.cool * this.flashIntensity); this.exposure = 0; this.ribbons.end(); this.ribbons.mesh.visible = this.ribbons.mesh.count > 0; this.rings.mesh.visible = this.rings.mesh.count > 0; let n = 0; for (const kind in this.batches) {
        const b = this.batches[kind as Primitive];
        b.end();
        n += b.mesh.count;
    } this.peakInstances = Math.max(this.peakInstances, n); }
    get counts() { let particles = 0, rings = 0, beams = 0; for (const p of this.particles)
        if (p.live)
            particles++; for (const p of this.waves)
        if (p.live)
            rings++; for (const p of this.beams)
        if (p.live)
            beams++; return { particles, rings, beams, peakParticles: this.peakParticles, peakInstances: this.peakInstances, peakLights: this.peakLights }; }
    clear(): void {
        this.services?.presentation?.setFlameGrade?.(0, 0, 0); for (const mark of this.contacts) mark.age = 4; this.statusOwners.clear(); for (const p of this.particles)
        p.live = false; for (const p of this.waves)
        p.live = false; for (const p of this.beams)
        p.live = false; for (const p of this.decals)
        p.live = false; this.exposure = this.warm = this.cool = 0; this.services?.presentation?.setAbilityPresentation(0, 0, 0); this.rings.clear(); this.ribbons.clear(); this.fx.clear(); for (const k in this.batches)
        this.batches[k as Primitive].begin(); }
    dispose(): void { if (this.disposed)
        return; this.disposed = true; this.clear(); for (const k in this.batches)
        this.batches[k as Primitive].dispose(); this.rings.dispose(); this.ribbons.dispose(); this.fx.dispose(); this.atlas.dispose(); this.root.removeFromParent(); }
}
