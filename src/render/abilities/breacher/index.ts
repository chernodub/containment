import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { AbilityEvent, DeployableSnapshot } from '../../../game/abilities/contract';
import type { ElementKit } from '../ElementKit';
import { UNIT, ELEMENT_COLORS, type AbilityFrame, type AbilityPresentation } from '../types';

const AMBER = ELEMENT_COLORS.kinetic;
const EDGE = 0x9fe8ff;
const CORE = 0xfff2d2;
const DUST = 0x968673;
const STEEL = 0x34424a;
const TAU = Math.PI * 2;
const NO_DEPLOYABLES: readonly DeployableSnapshot[] = [];
export const BREACHER_LIMITS = Object.freeze({ casts: 8, impacts: 12, barriers: 8, panels: 7 });

type Cast = { live: boolean; rail: boolean; x: number; z: number; angle: number; radius: number; length: number; age: number; life: number };
type Impact = { live: boolean; kind: 'slam' | 'rail' | 'ram' | 'ram-arrival'; x: number; z: number; angle: number; size: number; age: number; life: number; wallDone: boolean };
type Barrier = { id: number; seen: boolean; x: number; z: number; angle: number; length: number; health: number; pulse: number; contact: number };

/** Hard industrial kinetic language, composed entirely through the shared fixed pools. */
export class BreacherPresentation implements AbilityPresentation {
  private readonly casts: Cast[] = Array.from({ length: BREACHER_LIMITS.casts }, () => ({
    live: false, rail: false, x: 0, z: 0, angle: 0, radius: 1, length: 1, age: 0, life: 1,
  }));
  private readonly impacts: Impact[] = Array.from({ length: BREACHER_LIMITS.impacts }, () => ({
    live: false, kind: 'slam', x: 0, z: 0, angle: 0, size: 1, age: 0, life: 1, wallDone: false,
  }));
  private readonly barriers: Barrier[] = Array.from({ length: BREACHER_LIMITS.barriers }, () => ({
    id: -1, seen: false, x: 0, z: 0, angle: 0, length: 1, health: 1, pulse: 0, contact: 0,
  }));
  private nextCast = 0;
  private nextImpact = 0;
  private emissionClock = 0;
  private ramStartX = 0;
  private ramStartZ = 0;
  private ramStartAge = 0;
  private ramStartValid = false;
  private disposed = false;

  constructor(private readonly kit: ElementKit) {}

  event(event: AbilityEvent, worldX: number, worldY: number): void {
    if (this.disposed || event.rig !== 'breacher' || !Number.isFinite(worldX) || !Number.isFinite(worldY)) return;
    const x = worldX / UNIT, z = worldY / UNIT, angle = event.angle ?? 0;
    if (event.phase === 'cast' && (event.ability === 'seismic-slam' || event.ability === 'railbreaker')) {
      const cast = this.casts[this.nextCast++ % this.casts.length];
      cast.live = true; cast.rail = event.ability === 'railbreaker'; cast.x = x; cast.z = z; cast.angle = angle;
      cast.radius = (event.radius ?? 230) / UNIT; cast.age = 0; cast.life = Math.max(.02, (event.durationMs ?? 220) / 1000);
      const shape = ABILITY_CATALOG.railbreaker.shape;
      cast.length = (event.length ?? (shape.kind === 'line' ? shape.length : 900)) / UNIT;
      if (cast.rail) {this.kit.flash(x, z, AMBER, 1.5, 2, 2, .4);this.kit.anticipate?.(cast.life*1000);}
      return;
    }
    if (event.ability === 'ram' && event.phase === 'dash-start') {
      this.ramStartX = x; this.ramStartZ = z; this.ramStartAge = 0; this.ramStartValid = true;
      this.impact('ram', x, z, angle, (event.length ?? 150) / UNIT, .32);
      // Universal dash camera/pose feedback is applied once by the system presentation.
      return;
    }
    if (event.ability === 'ram' && event.phase === 'dash-end') {
      const tx=(event.targetX??worldX)/UNIT,tz=(event.targetY??worldY)/UNIT;
      if (this.ramStartValid && this.ramStartAge <= .5) this.ramSkids(tx, tz);
      this.ramStartValid = false;
      this.impact('ram-arrival', tx, tz, angle, .68, .3);
      this.kit.burst(tx, .25, tz, 'kinetic', 20, 3.3, .55);
      const nx = Math.cos(angle), nz = Math.sin(angle), dust = this.kit.low ? 4 : 10;
      for (let i = 0; i < dust; i++) {
        const side = (i / Math.max(1, dust - 1) - .5) * 1.25;
        this.kit.mote('smoke', tx + nx * .25 - nz * side, .22, tz + nz * .25 + nx * side,
          nx * 2.8 - nz * side, .35 + i % 3 * .18, nz * 2.8 + nx * side, .5 + i % 3 * .1, .7, DUST);
      }
      this.kit.flash(tx, tz, AMBER, 7, 3.5, 3, .1);
      return;
    }
    if (event.phase !== 'impact' && event.phase !== 'burst') return;
    if (event.ability === 'seismic-slam') {
      const radius = (event.radius ?? 230) / UNIT;
      this.impact('slam', x, z, angle, radius, 1.05);
      this.kit.ring(x, z, radius, AMBER, .28);
      this.kit.distort(x, z, radius, .007, .55);
      this.kit.flash(x, z, CORE, 28, radius + 1, 5, .035);
      this.kit.flash(x, z, AMBER, 13, radius, 4, .18);
      this.kit.camera(.54);
      this.kit.anticipate(34, .045);
      this.kit.scar('crack', x, z, radius, 0x211a13, 10);
      this.kit.burst(x, .15, z, 'kinetic', 24, 6, .45);
      this.dust(x, z, radius, this.kit.low ? 5 : 14);
      this.kit.debris(x, z, radius, 'kinetic', 32);
    } else if (event.ability === 'railbreaker') {
      const shape = ABILITY_CATALOG.railbreaker.shape;
      const length = (event.length ?? (shape.kind === 'line' ? shape.length : 900)) / UNIT;
      const endX = x + Math.cos(angle) * length, endZ = z + Math.sin(angle) * length;
      this.impact('rail', x, z, angle, length, 2.6);
      // Ribbon width is a radius: this is a .7m core, with a broad short corona and .85s air trail.
      this.kit.heavyBeam(x, .85, z, endX, .85, endZ, AMBER, .35, .85, false);
      this.kit.scar('trench', (x + endX) * .5, (z + endZ) * .5, length * .5, 0x1b1510, 12, angle, .62);
      this.kit.burst(x, .85, z, 'kinetic', 32, 6.5, .6);
      this.kit.flash(x, z, CORE, 36, 11, 6, .065);
      this.kit.flash(x, z, AMBER, 14, 9, 5, .24);
      this.kit.camera(.92, angle);
      this.kit.anticipate(40, .06);
      this.kit.exposureFlash(.95);
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        this.kit.distort(x + Math.cos(angle) * length * t, z + Math.sin(angle) * length * t, 2, .004, .65, true);
      }
      const count = this.kit.low ? 6 : 15;
      for (let i = 0; i < count; i++) {
        const t = i / count, px = x + (endX - x) * t, pz = z + (endZ - z) * t;
        this.kit.mote('smoke', px, .35, pz, -Math.sin(angle) * .4, .5, Math.cos(angle) * .4, .4, 1.2, DUST);
      }
    } else if (event.ability === 'bulwark') {
      const px = (event.targetX ?? worldX) / UNIT, pz = (event.targetY ?? worldY) / UNIT;
      if(event.phase==='impact'){this.kit.camera(.14);this.kit.distort(px,pz,1.1,.0015,.25);}
      this.kit.ring(px, pz, .9, EDGE, .3);
      this.kit.flash(px, pz, EDGE, 4, 4, 3, .15);
      this.kit.burst(px, .1, pz, 'kinetic', 10, 1.5, .4);
    }
  }

  private impact(kind: Impact['kind'], x: number, z: number, angle: number, size: number, life: number): void {
    const p = this.impacts[this.nextImpact++ % this.impacts.length];
    p.live = true; p.kind = kind; p.x = x; p.z = z; p.angle = angle; p.size = size; p.life = life; p.age = 0; p.wallDone = false;
  }

  private dust(x: number, z: number, radius: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = TAU * i / count, r = radius * .12;
      this.kit.mote('smoke', x + Math.cos(a) * r, .15, z + Math.sin(a) * r,
        Math.cos(a) * radius * .8, .3 + i % 4 * .16, Math.sin(a) * radius * .8, .48 + i % 3 * .14, .95 + i % 4 * .08, DUST);
    }
  }

  private ramSkids(x: number, z: number): void {
    const dx = x - this.ramStartX, dz = z - this.ramStartZ, length = Math.hypot(dx, dz);
    if (length < .08) return;
    const nx = dx / length, nz = dz / length, angle = Math.atan2(dz, dx);
    for (let side = -1; side <= 1; side += 2) {
      const sx = -nz * side * .38, sz = nx * side * .38;
      // Both traces stop at the observed arrival; the dash-start target is deliberately unused.
      this.kit.scar('trench', (this.ramStartX + x) * .5 + sx, (this.ramStartZ + z) * .5 + sz,
        length * .5, 0x352a20, 2.4, angle, .075);
      this.kit.beam(this.ramStartX + sx, .055, this.ramStartZ + sz, x + sx, .055, z + sz,
        AMBER, .04, .65, false);
    }
    const dust = this.kit.low ? 2 : 4;
    for (let i = 0; i < dust; i++) {
      const t = (i + .5) / dust;
      this.kit.mote('smoke', this.ramStartX + dx * t, .12, this.ramStartZ + dz * t,
        nx * .2, .12, nz * .2, .38 + i % 2 * .12, .85, DUST);
    }
  }

  update(frame: AbilityFrame): void {
    if (this.disposed) return;
    const dt = Number.isFinite(frame.dt) ? Math.max(0, frame.dt) : 0;
    if (this.ramStartValid) this.ramStartAge += dt;
    this.emissionClock += dt;
    const emit = dt > 0 && this.emissionClock >= (this.kit.low ? .1 : .035);
    if (emit) this.emissionClock = 0;
    for (const c of this.casts) {
      if (!c.live) continue;
      c.age += dt;
      if (c.age >= c.life) { c.live = false; continue; }
      const t = c.age / c.life;
      if (c.rail) this.drawRailCharge(c, t, emit);
      else this.drawSlamCharge(c, t, emit);
    }
    for (const p of this.impacts) {
      if (!p.live) continue;
      p.age += dt;
      if (p.age >= p.life) { p.live = false; continue; }
      if (p.kind === 'ram') this.drawRam(p, frame, emit);
      else if (p.kind === 'ram-arrival') this.drawRamArrival(p);
      else if (p.kind === 'slam') this.drawSlam(p);
      else this.drawRailTail(p, frame);
    }
    for (const b of this.barriers) b.seen = false;
    for (const entity of frame.snapshot?.deployables ?? NO_DEPLOYABLES) {
      if (entity.ability !== 'bulwark' || entity.health <= 0 || entity.remainingMs <= 0) continue;
      this.drawBulwark(entity, dt);
    }
    for (const b of this.barriers) {
      if (b.id < 0 || b.seen) continue;
      this.collapseBarrier(b);
      b.id = -1;
    }
  }

  private drawSlamCharge(c: Cast, t: number, emit: boolean): void {
    const count = this.kit.low ? 6 : 16, radius = c.radius * (1 - t * .75);
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count + .05, x = c.x + Math.cos(a) * radius, z = c.z + Math.sin(a) * radius;
      this.kit.ribbon(x, .065, z, x - Math.cos(a) * .28, .065, z - Math.sin(a) * .28, AMBER, .015, .28 + t * .35, false);
      if (emit && !this.kit.low && i % 2 === 0) this.kit.mote('smoke', x, .12, z, -Math.cos(a) * 6, .05, -Math.sin(a) * 6, .12, .16, DUST);
    }
    // Four rigid projector fins ground the crouched cast; no fill hides targets.
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, r = .45 + (1 - t) * .25;
      this.kit.draw('solid', c.x + Math.cos(a) * r, .1, c.z + Math.sin(a) * r, .1, .15, .28, AMBER, .65, -a);
    }
  }

  private drawRailCharge(c: Cast, t: number, emit: boolean): void {
    const nx = Math.cos(c.angle), nz = Math.sin(c.angle), sx = -nz, sz = nx;
    const width = .045 + (1 - t) * .85;
    this.kit.ribbon(c.x + nx * .6, .85, c.z + nz * .6,
      c.x + nx * c.length, .85, c.z + nz * c.length, CORE, .012 + t * .019, .2 + t * .7, false);
    this.kit.lightAt(7101, c.x + nx * .8, c.z + nz * .8, AMBER, 2 + t * t * 16, 3 + t * 4);
    for (let side = -1; side <= 1; side += 2) {
      this.kit.ribbon(c.x + sx * width * side, .82, c.z + sz * width * side,
        c.x + nx * (1 + t), .82, c.z + nz * (1 + t), AMBER, .018 + t * .012, .35 + t * .45, false);
      this.kit.draw('solid', c.x + sx * .33 * side + nx * .3, .8, c.z + sz * .33 * side + nz * .3,
        .05, .08, .65, STEEL, .7, Math.PI / 2 - c.angle);
    }
    this.kit.draw('spark', c.x + nx * .7, .85, c.z + nz * .7, .15 + t * .3, .15 + t * .3, .1, CORE, .2 + t * .8, -c.angle);
    if (emit && !this.kit.low) {
      for (let i = 0; i < 6; i++) {
        const a = this.kit.time * 11 + i * TAU / 6, r = 1.2 * (1 - t * .4);
        this.kit.mote('spark', c.x + Math.cos(a) * r + nx * .7, .85 + Math.sin(a) * .3, c.z + Math.sin(a) * r + nz * .7,
          -Math.cos(a) * 4, 0, -Math.sin(a) * 4, .055, .2, AMBER);
      }
    }
  }

  private drawRam(p: Impact, frame: AbilityFrame, emit: boolean): void {
    const t = Math.min(1, p.age / .14), player = frame.game?.player;
    const x = player ? player.x / UNIT : p.x + Math.cos(p.angle) * p.size * t;
    const z = player ? player.y / UNIT : p.z + Math.sin(p.angle) * p.size * t;
    const fade = Math.max(0, 1 - p.age / p.life), nx = Math.cos(p.angle), nz = Math.sin(p.angle), sx = -nz, sz = nx;
    const count = this.kit.low ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const r = .7 + i * .17, tipX = x + nx * r, tipZ = z + nz * r, width = .65 + i * .12;
      this.kit.draw('shard', x + nx * (.38 + i * .17), .83, z + nz * (.38 + i * .17),
        width, .65, .16, i === 0 ? CORE : AMBER, fade * .22, Math.PI / 2 - p.angle);
      for (let side = -1; side <= 1; side += 2) this.kit.ribbon(
        x + sx * side * width + nx * .1, .35 + i * .18, z + sz * side * width + nz * .1,
        tipX, .35 + i * .18, tipZ, i === 0 ? CORE : AMBER, .065, fade * .8, false);
    }
    for (let side = -1; side <= 1; side += 2) {
      this.kit.draw('smoke', x - nx * .4 + sx * side * .38, .28, z - nz * .4 + sz * side * .38,
        .6, .35, .3, DUST, fade * .35);
      if (emit) this.kit.mote('spark', x + sx * side * .5, .1, z + sz * side * .5,
        -nx * 3 + sx * side, .5, -nz * 3 + sz * side, .07, .35, AMBER);
    }
  }

  private drawRamArrival(p: Impact): void {
    const t = p.age / p.life, fade = 1 - t, nx = Math.cos(p.angle), nz = Math.sin(p.angle);
    const lead = .3 + t * .6, x = p.x + nx * lead, z = p.z + nz * lead;
    // An upright forward cap and two dust shoulders retain a directional shove, never a new ground disc.
    this.kit.draw('shard', x, .82, z, p.size, .7 * (1 - t * .25), .26, AMBER, fade * .46, Math.PI / 2 - p.angle);
    if (!this.kit.low) this.kit.draw('shard', x - nx * .12, .76, z - nz * .12,
      p.size * .85, .55, .16, CORE, fade * .23, Math.PI / 2 - p.angle);
    for (let side = -1; side <= 1; side += 2) {
      const offset = side * p.size * .8;
      this.kit.draw('smoke', x - nz * offset, .4 + t * .25, z + nx * offset,
        .62 + t * .25, .48, .3, DUST, fade * .52);
      this.kit.ribbon(p.x - nz * offset, .12, p.z + nx * offset,
        x + nx * .25 - nz * offset, .16, z + nz * .25 + nx * offset, AMBER, .05, fade * .65, false);
    }
  }

  private drawSlam(p: Impact): void {
    const t = p.age / p.life, progress = Math.min(1, .12 + p.age / .14), radius = p.size * progress;
    const count = this.kit.low ? 7 : 18, frontFade = Math.max(0, 1 - p.age / .36);
    // A low pressure ridge and broken dust wake preserve deck markings and incoming warnings.
    this.kit.front(p.x, p.z, p.size, progress, AMBER, .045, frontFade * .15);
    for (let i = 0; i < count; i++) {
      const seed = Math.sin(i * 7.1) ** 2, a = i * TAU / count + Math.sin(i * 3.73) * .08;
      const r = radius * (.71 + seed * .24);
      const lift = Math.sin(Math.min(1, p.age / .36) * Math.PI) * (.08 + seed * .16);
      // Fine angular chips replace the regular, broad square deck plates.
      this.kit.draw('shard', p.x + Math.cos(a) * r, .035 + lift, p.z + Math.sin(a) * r,
        .045 + seed * .08, .025 + seed * .035, .03 + seed * .055, i % 7 === 0 && p.age < .08 ? AMBER : STEEL,
        (1 - t) * .72, -a + seed, Math.sin(i * 2.3) * .65);
      if (i % (this.kit.low ? 3 : 2) === 0) {
        const wake = radius * (.93 + seed * .04);
        this.kit.draw('smoke', p.x + Math.cos(a) * wake, .12 + p.age * .2, p.z + Math.sin(a) * wake,
          .3 + seed * .16 + t * .12, .14 + seed * .12 + t * .12, .2, DUST, frontFade * .2, -a);
      }
    }
  }

  private drawRailTail(p: Impact, frame: AbilityFrame): void {
    const nx = Math.cos(p.angle), nz = Math.sin(p.angle), fade = 1 - p.age / p.life;
    if (!p.wallDone && frame.dt > 0 && frame.game?.geometry) {
      p.wallDone = true;
      this.railWallImpact(p, frame);
    }
    this.kit.draw('solid', p.x + nx * p.size / 2, .025, p.z + nz * p.size / 2,
      p.size, .012, .28, 0x252420, fade * .55, -p.angle);
    if (p.age > .85) return;
    if (p.age < .36) {
      const rings = this.kit.low ? 3 : 6, shock = 1 - p.age / .36;
      for (let i = 0; i < rings; i++) {
        const distance = (i + .5) / rings * p.size, r = .5 + p.age * 2 + i % 2 * .1;
        this.kit.draw('front', p.x + nx * distance, .85, p.z + nz * distance,
          r, .7, r, p.age < .065 ? CORE : AMBER, shock * .7, -p.angle, Math.PI / 2);
      }
    }
    const heat = (1 - p.age / .85) * .65, sideX = -nz, sideZ = nx, count = this.kit.low ? 5 : 12;
    for (let i = 0; i < count; i++) {
      const along = (i + .5) / count * p.size, px = p.x + nx * along, pz = p.z + nz * along;
      this.kit.ribbon(px - sideX * .12, .045, pz - sideZ * .12,
        px + nx * .55, .045, pz + nz * .55, AMBER, .025, heat, false);
      this.kit.ribbon(px + sideX * .12, .045, pz + sideZ * .12,
        px + nx * .55, .045, pz + nz * .55, AMBER, .025, heat, false);
    }
  }

  private railWallImpact(p: Impact, frame: AbilityFrame): void {
    const geometry = frame.game!.geometry, nx = Math.cos(p.angle), nz = Math.sin(p.angle);
    let contact = Infinity;
    // Presentation-only ray/edge intersections: no geometry mutation, collider query or scratch allocation.
    for (let i = -1; i < geometry.blockers.length; i++) {
      const r = i < 0 ? geometry.bounds : geometry.blockers[i];
      const x = r.x / UNIT, z = r.y / UNIT, right = (r.x + r.width) / UNIT, bottom = (r.y + r.height) / UNIT;
      contact = Math.min(contact, this.contactDistance(p, nx, nz, x, z, right, z),
        this.contactDistance(p, nx, nz, right, z, right, bottom),
        this.contactDistance(p, nx, nz, right, bottom, x, bottom),
        this.contactDistance(p, nx, nz, x, bottom, x, z));
    }
    for (let set = 0; set <= (geometry.voids?.length ?? 0); set++) {
      const polygon = set === 0 ? geometry.boundary : geometry.voids![set - 1];
      if (!polygon) continue;
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i], b = polygon[(i + 1) % polygon.length];
        contact = Math.min(contact, this.contactDistance(p, nx, nz, a.x / UNIT, a.y / UNIT, b.x / UNIT, b.y / UNIT));
      }
    }
    if (!Number.isFinite(contact) || contact > p.size) return;
    const x = p.x + nx * contact, z = p.z + nz * contact, count = this.kit.low ? 8 : 24;
    this.kit.burst(x, .85, z, 'kinetic', this.kit.low ? 8 : 32, 5.5, .65);
    this.kit.flash(x, z, AMBER, 15, 6, 5, .2);
    for (let i = 0; i < count; i++) {
      const side = (i % 2 ? -1 : 1), lateral = .8 + i % 5 * .45;
      this.kit.mote('solid', x - nx * .08, .5 + i % 4 * .2, z - nz * .08,
        -nx * (1.1 + i % 3) - nz * lateral * side, 2.3 + i % 5 * .5,
        -nz * (1.1 + i % 3) + nx * lateral * side, .055 + i % 3 * .025, .9, i % 3 ? AMBER : STEEL);
    }
    this.dust(x, z, 2, this.kit.low ? 3 : 10);
  }

  private contactDistance(p: Impact, nx: number, nz: number, ax: number, az: number, bx: number, bz: number): number {
    const ex = bx - ax, ez = bz - az, determinant = nx * ez - nz * ex;
    if (Math.abs(determinant) < .000001) return Infinity;
    const dx = ax - p.x, dz = az - p.z;
    const along = (dx * ez - dz * ex) / determinant, edge = (dx * nz - dz * nx) / determinant;
    return along > .05 && edge >= 0 && edge <= 1 ? along : Infinity;
  }

  private drawBulwark(e: DeployableSnapshot, dt: number): void {
    let slot: Barrier | undefined;
    for (const b of this.barriers) if (b.id === e.id) { slot = b; break; }
    if (!slot) for (const b of this.barriers) if (b.id < 0) { slot = b; break; }
    if (!slot) return;
    const x = e.x / UNIT, z = e.y / UNIT, length = e.length / UNIT, thickness = e.thickness / UNIT;
    if (slot.id !== e.id) {
      slot.id = e.id; slot.health = e.health; slot.pulse = 0; slot.contact = 0;
    } else if (dt > 0 && e.health < slot.health) {
      slot.pulse = .22;
      // The snapshot reports total load rather than an impact point. Keep its response local
      // to one projector, selected from the receipt, without implying a new gameplay hit.
      slot.contact = Math.sin(e.health * 17.1) * length * .35;
      this.kit.burst(x - Math.sin(e.angle) * slot.contact, .7, z + Math.cos(e.angle) * slot.contact, 'kinetic', 7, 1.4, .3);
      this.kit.flash(x, z, EDGE, 2, 3, 2, .07);
      this.kit.distort(x, z, length * .5, .0015, .22, true);
    }
    slot.seen = true; slot.health = e.health; slot.x = x; slot.z = z; slot.angle = e.angle; slot.length = length;
    slot.pulse = Math.max(0, slot.pulse - dt);
    const nx = Math.cos(e.angle), nz = Math.sin(e.angle), ux = -nz, uz = nx;
    const age = Math.max(0, (e.durationMs - e.remainingMs) / 1000);
    const growth = this.kit.reducedMotion ? 1 : Math.min(1, age / .14), h = 2.4 * growth;
    const fade = Math.min(1, e.remainingMs / 180), nodes = this.kit.low ? 3 : 5;
    const flicker = e.remainingMs < 1000 && !this.kit.reducedMotion && !this.kit.low
      ? .82 + Math.sin(this.kit.time * 19 + e.id) * .08 : 1;
    const health = e.health / Math.max(1, e.maxHealth);
    // One continuous field and projector bed; no independently repeated translucent panels.
    this.kit.draw('solid', x, .055, z, thickness * .92, .1, length, STEEL, .96 * fade, -e.angle);
    if (growth > 0) {
      this.kit.draw('solid', x, h / 2 + .06, z, thickness * .72, h, length, EDGE, .22 * fade * flicker, -e.angle);
      for (let side = -1; side <= 1; side += 2) {
        const px = x + nx * thickness * .36 * side, pz = z + nz * thickness * .36 * side;
        this.kit.ribbon(px - ux * length * .5, h + .06, pz - uz * length * .5,
          px + ux * length * .5, h + .06, pz + uz * length * .5, EDGE, .022, .82 * fade * flicker, false);
      }
      for (let end = -1; end <= 1; end += 2) {
        const px = x + ux * length * .5 * end, pz = z + uz * length * .5 * end;
        this.kit.ribbon(px - nx * thickness * .36, h + .06, pz - nz * thickness * .36,
          px + nx * thickness * .36, h + .06, pz + nz * thickness * .36, EDGE, .022, .82 * fade, false);
      }
    }
    for (let i = 0; i < nodes; i++) {
      const along = (i / (nodes - 1) - .5) * Math.max(0, length - thickness * .5);
      const px = x + ux * along, pz = z + uz * along;
      this.kit.draw('solid', px, .115, pz, thickness, .22, thickness * .5, STEEL, fade, -e.angle);
      this.kit.draw('solid', px + nx * thickness * .08, .245, pz + nz * thickness * .08,
        thickness * .64, .045, thickness * .33, EDGE, .8 * fade, -e.angle);
      if (growth <= 0) continue;
      const load = slot.pulse * Math.max(0, 1 - Math.abs(along - slot.contact) / Math.max(.4, length * .27));
      this.kit.ribbon(px, .26, pz, px, h + .055, pz, AMBER, .008,
        (.16 + load * 1.8) * fade * flicker, false);
    }
    if (growth > 0) {
      const columns = this.kit.low ? 3 : 6, cellWidth = length / columns * .43;
      const rows = this.kit.low ? 1 : 2, cellHeight = Math.min(.31, h * .17);
      // Sparse hex cells share the continuous field. Only cells near the loaded node brighten.
      for (let column = 0; column < columns; column++) for (let row = 0; row < rows; row++) {
        const along = ((column + .5 + (row % 2) * .15) / columns - .5) * length;
        const local = slot.pulse * Math.max(0, 1 - Math.abs(along - slot.contact) / Math.max(.4, length * .24));
        if (this.kit.low && local <= .04) continue;
        const centerY = h * (this.kit.low ? .5 : .3 + row * .4) + .06;
        const px = x + ux * along + nx * thickness * .37, pz = z + uz * along + nz * thickness * .37;
        for (let edge = 0; edge < 6; edge++) {
          const a = edge * Math.PI / 3, b = (edge + 1) * Math.PI / 3;
          this.kit.ribbon(px + ux * Math.cos(a) * cellWidth, centerY + Math.sin(a) * cellHeight, pz + uz * Math.cos(a) * cellWidth,
            px + ux * Math.cos(b) * cellWidth, centerY + Math.sin(b) * cellHeight, pz + uz * Math.cos(b) * cellWidth,
            local > .04 ? CORE : EDGE, .006 + local * .02, (.12 + health * .06 + local * 2.5) * fade * flicker, false);
        }
      }
    }
    this.kit.lightAt(e.id, x, z, EDGE, 1.8 * fade, 4.5);
  }

  private collapseBarrier(b: Barrier): void {
    const count = this.kit.low ? 6 : 21, ux = -Math.sin(b.angle), uz = Math.cos(b.angle);
    for (let i = 0; i < count; i++) {
      const along = (i / Math.max(1, count - 1) - .5) * b.length;
      this.kit.mote('shard', b.x + ux * along, .5 + i % 4 * .55, b.z + uz * along,
        ux * Math.sin(i) * .9, -.4 - i % 3 * .2, uz * Math.sin(i) * .9, .1 + i % 3 * .035, .6 + i % 3 * .1, i % 3 ? EDGE : AMBER);
    }
  }

  clear(): void {
    for (const c of this.casts) c.live = false;
    for (const p of this.impacts) p.live = false;
    for (const b of this.barriers) { b.id = -1; b.seen = false; b.pulse = 0; b.contact = 0; }
    this.emissionClock = 0;
    this.ramStartValid = false; this.ramStartAge = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear();
  }
}

/** Register this factory before renderer material preparation. */
export function createBreacherPresentation(kit: ElementKit): AbilityPresentation {
  return new BreacherPresentation(kit);
}
