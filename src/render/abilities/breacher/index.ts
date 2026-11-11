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

type Cast = { live: boolean; rail: boolean; x: number; z: number; angle: number; radius: number; age: number; life: number };
type Impact = { live: boolean; kind: 'slam' | 'rail' | 'ram'; x: number; z: number; angle: number; size: number; age: number; life: number };
type Barrier = { id: number; seen: boolean; x: number; z: number; angle: number; length: number; health: number; pulse: number };

/** Hard industrial kinetic language, composed entirely through the shared fixed pools. */
export class BreacherPresentation implements AbilityPresentation {
  private readonly casts: Cast[] = Array.from({ length: BREACHER_LIMITS.casts }, () => ({
    live: false, rail: false, x: 0, z: 0, angle: 0, radius: 1, age: 0, life: 1,
  }));
  private readonly impacts: Impact[] = Array.from({ length: BREACHER_LIMITS.impacts }, () => ({
    live: false, kind: 'slam', x: 0, z: 0, angle: 0, size: 1, age: 0, life: 1,
  }));
  private readonly barriers: Barrier[] = Array.from({ length: BREACHER_LIMITS.barriers }, () => ({
    id: -1, seen: false, x: 0, z: 0, angle: 0, length: 1, health: 1, pulse: 0,
  }));
  private nextCast = 0;
  private nextImpact = 0;
  private emissionClock = 0;
  private disposed = false;

  constructor(private readonly kit: ElementKit) {}

  event(event: AbilityEvent, worldX: number, worldY: number): void {
    if (this.disposed || event.rig !== 'breacher' || !Number.isFinite(worldX) || !Number.isFinite(worldY)) return;
    const x = worldX / UNIT, z = worldY / UNIT, angle = event.angle ?? 0;
    if (event.phase === 'cast' && (event.ability === 'seismic-slam' || event.ability === 'railbreaker')) {
      const cast = this.casts[this.nextCast++ % this.casts.length];
      cast.live = true; cast.rail = event.ability === 'railbreaker'; cast.x = x; cast.z = z; cast.angle = angle;
      cast.radius = (event.radius ?? 230) / UNIT; cast.age = 0; cast.life = Math.max(.02, (event.durationMs ?? 220) / 1000);
      if (cast.rail) this.kit.flash(x, z, AMBER, 1.5, 2, 2, .4);
      return;
    }
    if (event.ability === 'ram' && event.phase === 'dash-start') {
      this.impact('ram', x, z, angle, (event.length ?? 150) / UNIT, .32);
      // Universal dash camera/pose feedback is applied once by the system presentation.
      return;
    }
    if (event.ability === 'ram' && event.phase === 'dash-end') {
      const tx=(event.targetX??worldX)/UNIT,tz=(event.targetY??worldY)/UNIT;
      this.kit.burst(tx, .25, tz, 'kinetic', 12, 2.3, .42);
      this.dust(tx, tz, 1.4, 8);
      this.kit.flash(tx, tz, AMBER, 3.5, 2.5, 2, .1);
      return;
    }
    if (event.phase !== 'impact' && event.phase !== 'burst') return;
    if (event.ability === 'seismic-slam') {
      const radius = (event.radius ?? 230) / UNIT;
      this.impact('slam', x, z, angle, radius, .7);
      this.kit.ring(x, z, radius, AMBER, .55);
      this.kit.distort(x, z, radius, .007, .55);
      this.kit.flash(x, z, AMBER, 12, 7, 4, .15);
      this.kit.camera(.28);
      this.kit.decal(x, z, Math.min(radius * .72, 4.5), 0x33312c, 9);
      this.kit.burst(x, .15, z, 'kinetic', 38, 6, .65);
      this.dust(x, z, radius, this.kit.low ? 8 : 28);
      const debris = this.kit.low ? 5 : 16;
      for (let i = 0; i < debris; i++) {
        const a = i * 2.399963, speed = 2 + i % 5;
        this.kit.mote('solid', x + Math.cos(a) * .3, .1, z + Math.sin(a) * .3,
          Math.cos(a) * speed, 2.5 + i % 3, Math.sin(a) * speed, .045 + i % 3 * .018, .8, STEEL);
      }
    } else if (event.ability === 'railbreaker') {
      const shape = ABILITY_CATALOG.railbreaker.shape;
      const length = (event.length ?? (shape.kind === 'line' ? shape.length : 900)) / UNIT;
      const endX = x + Math.cos(angle) * length, endZ = z + Math.sin(angle) * length;
      this.impact('rail', x, z, angle, length, 2.6);
      // A narrow hot core survives only three frames; the amber corona carries the readable tail.
      this.kit.beam(x, .85, z, endX, .85, endZ, CORE, .095, .055, false);
      this.kit.beam(x, .85, z, endX, .85, endZ, AMBER, .22, .18, false);
      this.kit.beam(x, .85, z, endX, .85, endZ, AMBER, .035, .75, false);
      this.kit.burst(x, .85, z, 'kinetic', 32, 6.5, .6);
      this.kit.flash(x, z, CORE, 18, 8, 5, .16);
      this.kit.camera(.48, angle);
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        this.kit.distort(x + Math.cos(angle) * length * t, z + Math.sin(angle) * length * t, 2, .004, .65, true);
      }
      const count = this.kit.low ? 6 : 15;
      for (let i = 0; i < count; i++) {
        const t = i / count, px = x + (endX - x) * t, pz = z + (endZ - z) * t;
        this.kit.mote('smoke', px, .25, pz, -Math.sin(angle) * .2, .3, Math.cos(angle) * .2, .2, 1.1, 0x5c574f);
      }
    } else if (event.ability === 'bulwark') {
      const px = (event.targetX ?? worldX) / UNIT, pz = (event.targetY ?? worldY) / UNIT;
      this.kit.ring(px, pz, .9, EDGE, .3);
      this.kit.flash(px, pz, EDGE, 4, 4, 3, .15);
      this.kit.burst(px, .1, pz, 'kinetic', 10, 1.5, .4);
    }
  }

  private impact(kind: Impact['kind'], x: number, z: number, angle: number, size: number, life: number): void {
    const p = this.impacts[this.nextImpact++ % this.impacts.length];
    p.live = true; p.kind = kind; p.x = x; p.z = z; p.angle = angle; p.size = size; p.life = life; p.age = 0;
  }

  private dust(x: number, z: number, radius: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = TAU * i / count, r = radius * .12;
      this.kit.mote('smoke', x + Math.cos(a) * r, .15, z + Math.sin(a) * r,
        Math.cos(a) * radius * 1.4, .25 + i % 4 * .08, Math.sin(a) * radius * 1.4, .22 + i % 3 * .08, .5 + i % 4 * .09, DUST);
    }
  }

  update(frame: AbilityFrame): void {
    if (this.disposed) return;
    const dt = Number.isFinite(frame.dt) ? Math.max(0, frame.dt) : 0;
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
      if (p.kind === 'ram') this.drawRam(p, frame);
      else if (p.kind === 'slam') this.drawSlam(p);
      else this.drawRailTail(p);
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
    const width = .1 + (1 - t) * .65;
    for (let side = -1; side <= 1; side += 2) {
      this.kit.ribbon(c.x + sx * width * side, .82, c.z + sz * width * side,
        c.x + nx * (1 + t), .82, c.z + nz * (1 + t), AMBER, .018 + t * .012, .35 + t * .45, false);
      this.kit.draw('solid', c.x + sx * .33 * side + nx * .3, .8, c.z + sz * .33 * side + nz * .3,
        .05, .08, .65, STEEL, .7, Math.PI / 2 - c.angle);
    }
    this.kit.draw('spark', c.x + nx * .7, .85, c.z + nz * .7, .11 + t * .09, .11 + t * .09, .1, CORE, t * .6, -c.angle);
    if (emit && !this.kit.low) {
      for (let i = 0; i < 3; i++) {
        const a = this.kit.time * 11 + i * TAU / 3, r = 1.2 * (1 - t * .4);
        this.kit.mote('spark', c.x + Math.cos(a) * r + nx * .7, .85 + Math.sin(a) * .3, c.z + Math.sin(a) * r + nz * .7,
          -Math.cos(a) * 4, 0, -Math.sin(a) * 4, .035, .2, AMBER);
      }
    }
  }

  private drawRam(p: Impact, frame: AbilityFrame): void {
    const t = Math.min(1, p.age / .14), player = frame.game?.player;
    const x = player ? player.x / UNIT : p.x + Math.cos(p.angle) * p.size * t;
    const z = player ? player.y / UNIT : p.z + Math.sin(p.angle) * p.size * t;
    const fade = Math.max(0, 1 - p.age / p.life), nx = Math.cos(p.angle), nz = Math.sin(p.angle), sx = -nz, sz = nx;
    const count = this.kit.low ? 1 : 3;
    for (let i = 0; i < count; i++) {
      const r = .7 + i * .2, tipX = x + nx * r, tipZ = z + nz * r, width = .5 + i * .15;
      for (let side = -1; side <= 1; side += 2) this.kit.ribbon(
        x + sx * side * width + nx * .1, .3 + i * .12, z + sz * side * width + nz * .1,
        tipX, .3 + i * .12, tipZ, i === 0 ? CORE : AMBER, .026, fade * .7, false);
    }
  }

  private drawSlam(p: Impact): void {
    const t = p.age / p.life, radius = p.size * Math.min(1, p.age / .3), count = this.kit.low ? 8 : 24;
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count, r = radius * (.95 + Math.sin(i * 7.1) * .04);
      // Broken deck strips lift and settle along the pressure front, never a solid wall.
      const lift = Math.sin(Math.min(1, p.age / .4) * Math.PI) * .24;
      this.kit.draw('solid', p.x + Math.cos(a) * r, .055 + lift, p.z + Math.sin(a) * r,
        .32, .035, .11, i % 3 === 0 ? AMBER : STEEL, (1 - t) * (i % 3 === 0 ? .55 : .85), -a);
      if (!this.kit.low) this.kit.draw('smoke', p.x + Math.cos(a) * r, .15, p.z + Math.sin(a) * r,
        .25 + t * .18, .13 + t * .15, .2, DUST, (1 - t) * .18, -a);
    }
  }

  private drawRailTail(p: Impact): void {
    const nx = Math.cos(p.angle), nz = Math.sin(p.angle), fade = 1 - p.age / p.life;
    this.kit.draw('solid', p.x + nx * p.size / 2, .025, p.z + nz * p.size / 2,
      p.size, .012, .28, 0x252420, fade * .55, -p.angle);
    if (p.age > .85) return;
    const heat = (1 - p.age / .85) * .4, sideX = -nz, sideZ = nx, count = this.kit.low ? 5 : 12;
    for (let i = 0; i < count; i++) {
      const along = (i + .5) / count * p.size, px = p.x + nx * along, pz = p.z + nz * along;
      this.kit.ribbon(px - sideX * .12, .045, pz - sideZ * .12,
        px + nx * .3, .045, pz + nz * .3, AMBER, .012, heat, false);
      this.kit.ribbon(px + sideX * .12, .045, pz + sideZ * .12,
        px + nx * .3, .045, pz + nz * .3, AMBER, .012, heat, false);
    }
  }

  private drawBulwark(e: DeployableSnapshot, dt: number): void {
    let slot: Barrier | undefined;
    for (const b of this.barriers) if (b.id === e.id) { slot = b; break; }
    if (!slot) for (const b of this.barriers) if (b.id < 0) { slot = b; break; }
    if (!slot) return;
    const x = e.x / UNIT, z = e.y / UNIT, length = e.length / UNIT, thickness = e.thickness / UNIT;
    if (slot.id !== e.id) {
      slot.id = e.id; slot.health = e.health; slot.pulse = 0;
    } else if (e.health < slot.health) {
      slot.pulse = .22;
      const offset = Math.sin(e.health * 17.1) * length * .35;
      this.kit.burst(x - Math.sin(e.angle) * offset, .7, z + Math.cos(e.angle) * offset, 'kinetic', 9, 1.8, .38);
      this.kit.flash(x, z, EDGE, 2, 3, 2, .07);
    }
    slot.seen = true; slot.health = e.health; slot.x = x; slot.z = z; slot.angle = e.angle; slot.length = length;
    slot.pulse = Math.max(0, slot.pulse - dt);
    const nx = Math.cos(e.angle), nz = Math.sin(e.angle), ux = -nz, uz = nx;
    const age = Math.max(0, (e.durationMs - e.remainingMs) / 1000), panels = this.kit.low ? 3 : BREACHER_LIMITS.panels;
    const panelWidth = length / panels;
    const flicker = e.remainingMs < 1000 && !this.kit.reducedMotion && !this.kit.low
      ? .72 + Math.sin(this.kit.time * 31 + e.id) * .15 : 1;
    const health = e.health / Math.max(1, e.maxHealth);
    for (let i = 0; i < panels; i++) {
      const growth = Math.max(0, Math.min(1, (age - i / panels * .09) / .08));
      const along = (i + .5) * panelWidth - length / 2;
      const baseX = x + ux * along, baseZ = z + uz * along;
      // The full projector line is present on the impact frame, before panels rise.
      this.kit.draw('solid', baseX, .08, baseZ, thickness * 1.15, .13, panelWidth * .96, STEEL, .9, -e.angle);
      this.kit.draw('solid', baseX + nx * thickness * .58, .12, baseZ + nz * thickness * .58,
        .045, .04, panelWidth * .83, AMBER, .85, -e.angle);
      if (growth <= 0) continue;
      const h = 1.5 * growth;
      const hinge = this.kit.reducedMotion ? 0 : (1 - growth) * .35;
      const px = x + ux * along + nx * hinge, pz = z + uz * along + nz * hinge;
      this.kit.draw('solid', px, h / 2 + .06, pz, thickness * .45, h, panelWidth * .92, EDGE,
        (.035 + slot.pulse * .3) * flicker, -e.angle);
      // Cold top rim and warm uprights distinguish friendly cover from hostile red warnings.
      this.kit.ribbon(px - ux * panelWidth * .46, h + .06, pz - uz * panelWidth * .46,
        px + ux * panelWidth * .46, h + .06, pz + uz * panelWidth * .46, EDGE, .022, .58 * flicker, false);
      this.kit.ribbon(px - ux * panelWidth * .46, .08, pz - uz * panelWidth * .46,
        px - ux * panelWidth * .46, h + .06, pz - uz * panelWidth * .46, AMBER, .015, .4 * flicker, false);
      if (!this.kit.low) {
        const hexWidth = panelWidth * .33, hexHeight = Math.min(.23, h * .22);
        for (let row = 0; row < 2; row++) {
          const centerY = h * (.32 + row * .38) + .06;
          for (let edge = 0; edge < 6; edge++) {
            const a = edge * Math.PI / 3, b = (edge + 1) * Math.PI / 3;
            const sa = Math.cos(a) * hexWidth, sb = Math.cos(b) * hexWidth;
            this.kit.ribbon(px + ux * sa, centerY + Math.sin(a) * hexHeight, pz + uz * sa,
              px + ux * sb, centerY + Math.sin(b) * hexHeight, pz + uz * sb,
              slot.pulse > 0 ? CORE : EDGE, .009, (.18 + health * .1 + slot.pulse) * flicker, false);
          }
        }
      }
      if (slot.pulse > 0) this.kit.outline(px, pz, .25 + (.22 - slot.pulse) * 2, AMBER, slot.pulse * .8);
    }
    this.kit.lightAt(e.id, x, z, AMBER, 1.1, 3.8);
  }

  private collapseBarrier(b: Barrier): void {
    const count = this.kit.low ? 6 : 18, ux = -Math.sin(b.angle), uz = Math.cos(b.angle);
    for (let i = 0; i < count; i++) {
      const along = (i / Math.max(1, count - 1) - .5) * b.length;
      this.kit.mote('shard', b.x + ux * along, .5 + i % 3 * .3, b.z + uz * along,
        ux * Math.sin(i) * .7, -.4 - i % 3 * .2, uz * Math.sin(i) * .7, .05, .4 + i % 3 * .1, i % 3 ? EDGE : AMBER);
    }
  }

  clear(): void {
    for (const c of this.casts) c.live = false;
    for (const p of this.impacts) p.live = false;
    for (const b of this.barriers) { b.id = -1; b.seen = false; b.pulse = 0; }
    this.emissionClock = 0;
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
