import * as T from 'three';
import { FriendlyBoundaryBatch } from './FriendlyBoundary';
import { AbilityLightningBatch } from './LightningBatch';
import type { EnergyRibbon, Telegraph } from '../vfx';
import type { GraphicsOptions } from '../graphicsOptions';
import type { GraphicsTier } from '../FrameBudget';
import type { LightPool } from '../lighting/LightPool';
import type { DistortionField } from '../post/DistortionField';
import type { AbilityElement } from '../../game/abilities/contract';
import { ELEMENT_COLORS } from './types';
import { InstanceBatch, type Primitive } from './InstanceBatch';
export const ABILITY_VFX_LIMITS = Object.freeze({ particles: 768, rings: 64, beams: 64, decals: 32, instances: 2048 });
export type ScarKind = 'crack' | 'frost' | 'trench' | 'fan' | 'star' | 'soot';
const SCAR_KIND = { crack: 0, frost: 1, trench: 2, fan: 3, star: 4, soot: 5 } as const;
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
export interface AbilityServices {
    lights: LightPool;
    distortion: DistortionField;
    camera: {
        addTrauma(n: number): void;
        punch(n: number, ms: number): void;
        kick(angle: number, n: number): void;
    };
    /** Existing HDR composite; no extra fullscreen pass or dynamic material. */
    presentation?: { setAbilityPresentation(exposure: number, warm: number, cool: number): void };
}
/** Shared element language. Coordinates are render metres (simulation / 32), times seconds. */
export class ElementKit {
    readonly root = new T.Group();
    readonly batches: Record<Primitive, InstanceBatch>;
    readonly rings = new FriendlyBoundaryBatch(this.root, 160);
    readonly ribbons = new AbilityLightningBatch(this.root, 2048);
    time = 0;
    low = false;
    reducedMotion = false;
    flashIntensity = 1;
    private dynamicLights = true;
    private distortion = true;
    private services?: AbilityServices;
    private particles: Particle[] = Array.from({ length: ABILITY_VFX_LIMITS.particles }, () => ({ live: false, kind: 'spark', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, life: 1, age: 0, color: 0, seed: 0 }));
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
        this.batches = { shard: new InstanceBatch(this.root, 'shard', 512), spark: new InstanceBatch(this.root, 'spark', 512), smoke: new InstanceBatch(this.root, 'smoke', 192), flame: new InstanceBatch(this.root, 'flame', 384), solid: new InstanceBatch(this.root, 'solid', 512), ghost: new InstanceBatch(this.root, 'ghost', 128), decal: new InstanceBatch(this.root, 'decal', 64), front: new InstanceBatch(this.root, 'front', 64) };
    }
    setView(camera: T.Camera): void { for (const k in this.batches)
        this.batches[k as Primitive].setView(camera); }
    bind(services: AbilityServices): void { this.services = services; }
    setOptions(options: GraphicsOptions, tier: GraphicsTier, reducedMotion: boolean): void {
        if (tier === 'low' && !this.low) {
            for (let i = 160; i < this.particles.length; i++)
                this.particles[i].live = false;

        }
        this.low = tier === 'low';
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
        this.rings.add(s);
    }
    beam(x: number, y: number, z: number, tx: number, ty: number, tz: number, color: number, width = .035, life = .22, lightning = true, delay = 0): void {
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
    /** Persistent shaped floor aftermath; half-length/half-width are exact bounds. */
    scar(kind: ScarKind, x: number, z: number, radius: number, color: number, life = 8, angle = 0, width = radius, arc = 1.28): void {
        this.decal(x, z, radius, color, life, -angle);
        const p = this.decals[(this.decalCursor - 1) % this.decals.length];
        p.width = width; p.kind = SCAR_KIND[kind] + (kind === 'fan' ? arc / (Math.PI * 4) : 0);
    }
    /** One instanced volume, its outer radius never exceeds the authoritative radius. */
    front(x: number, z: number, radius: number, progress: number, color: number, height = 1.5, opacity = .65): void {
        const r = radius * Math.max(.015, Math.min(1, progress));
        const h = height * (this.low ? .6 : 1);
        this.draw('front', x, h * .5 + .025, z, r, h / .24, r, color, opacity * (.35 + .65 * this.flashIntensity));
    }
    /** Ballistic chunks have visible mass and one damped deck bounce, within the particle pool. */
    debris(x: number, z: number, radius: number, element: 'kinetic' | 'cryo', count = 28): void {
        count = this.low ? Math.min(8, count) : Math.min(64, count);
        for (let i = 0; i < count; i++) {
            const a = i * 2.39996323, speed = radius * (.65 + i % 7 * .09);
            this.mote('shard', x + Math.cos(a) * .25, .12, z + Math.sin(a) * .25,
                Math.cos(a) * speed, 2 + i % 5 * .55, Math.sin(a) * speed, .12 + Math.sin(i * 7.13) ** 2 * .17, 1.2 + i % 3 * .15,
                element === 'cryo' ? (i % 3 ? 0x7fd6ff : 0xe8fbff) : (i % 5 ? 0x4b4540 : 0xffb454));
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
    /** Directional jet: source-hot stretched tongues, accelerating and curling outwards. */
    fireFan(x: number, z: number, radius: number, angle: number, arc: number, opacity = 1): void {
        const count = this.low ? 16 : 42;
        for (let i = 0; i < count; i++) {
            const seed = i * 2.39996323, f = .5 + .5 * Math.sin(seed * 4.73);
            const travel = this.reducedMotion ? (i + .5) / count : (i * .618033989 + this.time * (1.7 + f * .45)) % 1;
            const r = radius * (.07 + travel * .85);
            const a = angle + Math.sin(seed * 3.17) * arc * .43 * Math.sqrt(travel);
            const width = (.13 + travel * .32) * (.7 + f * .5);
            const h = (.8 + travel * 1.15) * (.65 + f * .5);
            this.draw('flame', x + Math.cos(a) * r, .45 + travel * .5, z + Math.sin(a) * r,
                width, h * .5, 1, travel < .26 ? 0xffedb5 : 0xff7a2e,
                opacity * (.85 - travel * .25), 0, Math.sin(a - .7) * (.5 + travel * .5), 1);
        }
    }
    /** Analytic tongue leaning along a world direction; shares the prepared flame draw. */
    directedFlame(x: number, y: number, z: number, width: number, height: number, angle: number, lean: number, seed: number, opacity = 1, core = false): void {
        const cycle = this.reducedMotion ? .4 : (this.time * (1.6 + Math.sin(seed) * .25) + seed * .6180339) % 1;
        this.draw('flame', x, y + height * .5, z, width, height * (.38 + Math.sin(cycle * Math.PI) * .12), 1,
            core ? 0xffedb5 : 0xff7a2e, opacity, 0, Math.sin(angle - .7) * lean, 1);
    }
    /** Solid-looking faceted translucent column, with a narrow luminous internal vein. */
    iceColumn(x: number, z: number, width: number, depth: number, height: number, angle: number, opacity = 1): void {
        this.draw('solid', x, height * .43, z, depth * .94, height * .86, width * .94, 0x4c9abc, opacity * .72, -angle);
        this.draw('shard', x, height * .5, z, depth * .49, height * .5, width * .49, 0x9be7ff, opacity * .39, -angle, .07);
        if (!this.low) this.draw('shard', x, height * .57, z, depth * .14, height * .41, width * .13, 0xe8fbff, opacity * .36, -angle);
    }
    /** Full faceted shell preserves a translucent view of the frozen actor. */
    iceShell(x: number, z: number, radius: number, height: number, opacity = .35): void {
        this.draw('shard', x, height * .5, z, radius * 1.05, height * .62, radius * 1.05, 0x7fd6ff, opacity);
        if (!this.low) this.draw('shard', x, height * .57, z, radius * .94, height * .58, radius * .94, 0xe8fbff, opacity * .3, .6);
    }
    /** Bright articulated marine afterimage, using only the existing ghost batch. */
    afterImage(x: number, z: number, angle: number, color: number, opacity: number, lean = 0): void {
        const c = Math.cos(angle), s = Math.sin(angle);
        this.draw('ghost', x + c * lean, 1.74, z + s * lean, .29, .32, .32, color, opacity, -angle);
        this.draw('ghost', x + c * lean * .6, 1.23, z + s * lean * .6, .34, .63, .58, color, opacity, -angle);
        for (let side = -1; side <= 1; side += 2) {
            this.draw('ghost', x - s * side * .19, .48, z + c * side * .19, .24, .72, .21, color, opacity * .7, -angle, side * .08);
            if (!this.low) this.draw('ghost', x + c * .25 - s * side * .34, 1.26, z + s * .25 + c * side * .34, .43, .22, .2, color, opacity * .8, -angle);
        }
        this.draw('ghost', x + c * .55 - s * .13, 1.28, z + s * .55 + c * .13, .72, .12, .12, 0xe8fbff, opacity, -angle);
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
        r.intensity = intensity * this.flashIntensity;
        r.distance = distance;
        r.priority = priority;
        r.duration = duration;
        this.services?.lights.flash(r);
        this.measureLights();
    }
    lightAt(id: number, x: number, z: number, color: number, intensity = 2, distance = 4): void {
        if (this.low || !this.dynamicLights)
            return;
        const r = this.light;
        r.x = x;
        r.z = z;
        r.color = color;
        r.intensity = intensity;
        r.distance = distance;
        r.priority = 2;
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
        this.time += dt;
        this.impact();
        this.warm = this.cool = 0;
        this.instanceCount = 0;
        this.rings.setTime(this.time, this.reducedMotion);
        this.rings.clear();
        this.ribbons.begin();
        this.ribbons.priorityWeight = 0;
        for (const kind in this.batches)
            this.batches[kind as Primitive].begin(this.reducedMotion ? 0 : this.time);
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
            this.draw(p.kind, p.x, p.y, p.z, s, p.kind === 'spark' ? s * 2 : s, s, p.color, fade * (p.kind === 'smoke' ? .22 : .7), p.seed * .8, p.seed + p.age);
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
            b.draw(p.x, .027, p.z, p.radius, p.width, 1, p.color, Math.min(1, (p.life - p.age) / Math.min(3, p.life * .4)) * .8, 0, p.angle, p.kind === 2 ? 2 + .1 * Math.max(0, 1 - p.age) : p.kind);
            this.instanceCount += b.mesh.count - before;
        }
    }
    end(): void { this.services?.presentation?.setAbilityPresentation(this.exposure, this.warm * this.flashIntensity, this.cool * this.flashIntensity); this.exposure = 0; this.ribbons.end(); this.ribbons.mesh.visible = this.ribbons.mesh.count > 0; this.rings.mesh.visible = this.rings.mesh.count > 0; let n = 0; for (const kind in this.batches) {
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
    clear(): void { for (const p of this.particles)
        p.live = false; for (const p of this.waves)
        p.live = false; for (const p of this.beams)
        p.live = false; for (const p of this.decals)
        p.live = false; this.exposure = this.warm = this.cool = 0; this.services?.presentation?.setAbilityPresentation(0, 0, 0); this.rings.clear(); this.ribbons.clear(); for (const k in this.batches)
        this.batches[k as Primitive].begin(); }
    dispose(): void { if (this.disposed)
        return; this.disposed = true; this.clear(); for (const k in this.batches)
        this.batches[k as Primitive].dispose(); this.rings.dispose(); this.ribbons.dispose(); this.root.removeFromParent(); }
}
