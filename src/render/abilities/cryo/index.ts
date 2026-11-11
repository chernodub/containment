import type { AbilityEvent, AbilityZoneSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, type AbilityFrame, type AbilityPresentation } from '../types';

const ICE = ELEMENT_COLORS.cryo;
const CORE = 0xe8fbff;
const DEEP = 0x4e8baf;
const TAU = Math.PI * 2;
const EMPTY_ZONES: readonly AbilityZoneSnapshot[] = [];
const EMPTY_DEPLOYABLES: readonly DeployableSnapshot[] = [];
const PULSE_CAPACITY = 24;
type ColdWave = { live: boolean; x: number; z: number; radius: number; age: number; life: number; shatter: boolean };
type ZoneClock = { id: number; pulse: number; seen: boolean };
type WallState = { id: number; health: number; flash: number; seen: boolean };

/** Four Cryo signatures composed exclusively from the shared, prewarmed instance pools. */
class CryoPresentation implements AbilityPresentation {
  private waves: ColdWave[] = Array.from({ length: PULSE_CAPACITY }, () => ({ live: false, x: 0, z: 0, radius: 1, age: 0, life: 1, shatter: false }));
  private zones: ZoneClock[] = Array.from({ length: 24 }, () => ({ id: -1, pulse: 0, seen: false }));
  private walls: WallState[] = Array.from({ length: 8 }, () => ({ id: -1, health: 0, flash: 0, seen: false }));
  private cursor = 0;
  private mistAge = 0;
  private emitMist = false;
  private disposed = false;

  constructor(private readonly kit: ElementKit) {}

  event(event: AbilityEvent, x: number, y: number): void {
    if (this.disposed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const k = this.kit, px = x / UNIT, pz = y / UNIT;
    if (event.ability === 'frost-trail') {
      if (event.phase === 'dash-start') {
        k.burst(px, .12, pz, 'cryo', 10, 1.4, .45);
        if (Number.isFinite(event.targetX) && Number.isFinite(event.targetY)) {
          k.beam(px, .075, pz, event.targetX! / UNIT, .075, event.targetY! / UNIT, ICE, .045, .22, false);
        }
      } else if (event.phase === 'dash-end') {
        this.wave(px, pz, .8, .45, false);
        k.burst(px, .12, pz, 'cryo', 12, 1.7, .65);
      }
      return;
    }
    if (event.ability === 'cryo-nova' && event.phase === 'impact') {
      const radius = (event.radius ?? 210) / UNIT;
      this.wave(px, pz, radius, .78, false);
      k.burst(px, .18, pz, 'cryo', 32, 4.2, .8);
      k.decal(px, pz, radius, DEEP, 4.2);
      k.flash(px, pz, ICE, 10, Math.min(10, radius), 4, .18);
      k.distort(px, pz, radius, -.0035, .45);
      k.camera(.15);
    } else if (event.ability === 'glacier') {
      if (event.phase === 'impact') {
        const tx = (event.targetX ?? x) / UNIT, tz = (event.targetY ?? y) / UNIT;
        k.burst(tx, .1, tz, 'cryo', 18, 2.1, .65);
        k.flash(tx, tz, ICE, 5, 4, 3, .22);
        k.camera(.17);
      } else if (event.phase === 'burst') {
        const radius = (event.radius ?? 150) / UNIT;
        this.wave(px, pz, radius, .85, true);
        k.burst(px, .9, pz, 'cryo', 48, 4.8, .95);
        k.decal(px, pz, radius, DEEP, 5);
        k.distort(px, pz, radius, -.004, .55);
        k.flash(px, pz, CORE, 9, radius + 1, 4, .14);
        k.camera(.24);
      }
    } else if (event.ability === 'whiteout') {
      if (event.phase === 'impact') {
        const radius = (event.radius ?? 300) / UNIT;
        this.wave(px, pz, radius, .9, false);
        k.burst(px, .35, pz, 'cryo', 36, 3.6, .9);
        k.distort(px, pz, radius, -.0025, .8);
        k.flash(px, pz, ICE, 8, 7, 5, .3);
        k.camera(.27);
      } else if (event.phase === 'burst') {
        this.wave(px, pz, (event.radius ?? 100) / UNIT, .62, true);
        k.burst(px, .8, pz, 'cryo', 26, 3.6, .8);
      } else if (event.phase === 'end') {
        k.ring(px, pz, (event.radius ?? 300) / UNIT, ICE, .75, true);
      }
    }
  }

  private wave(x: number, z: number, radius: number, life: number, shatter: boolean): void {
    const wave = this.waves[this.cursor++ % this.waves.length];
    wave.live = true; wave.x = x; wave.z = z; wave.radius = radius; wave.life = life; wave.age = 0; wave.shatter = shatter;
    this.kit.ring(x, z, radius, CORE, Math.min(.5, life));
  }

  update(frame: AbilityFrame): void {
    if (this.disposed || !frame.visible) return;
    const k = this.kit, dt = frame.dt;
    this.mistAge += dt;
    this.emitMist = dt > 0 && this.mistAge >= (k.low ? .15 : .065);
    if (this.emitMist) this.mistAge %= k.low ? .15 : .065;
    for (const wave of this.waves) {
      if (!wave.live) continue;
      wave.age += dt;
      if (wave.age >= wave.life) { wave.live = false; continue; }
      const progress = wave.age / wave.life;
      const radius = wave.radius * Math.min(1, .06 + (1 - (1 - Math.min(1, progress * 2.6)) ** 3) * .94);
      const fade = (1 - progress) * k.flashIntensity;
      const count = k.low ? 12 : 36;
      for (let i = 0; i < count; i++) {
        const angle = i * TAU / count, c = Math.cos(angle), s = Math.sin(angle);
        const size = .055 + (i % 4) * .014;
        k.draw('shard', wave.x + c * radius, .09 + Math.sin(i * 1.7) ** 2 * .12, wave.z + s * radius,
          size, size * (wave.shatter ? 2.8 : 1.8), size * .75, i % 3 ? ICE : CORE, fade * .72, angle, .3);
        if (!k.low && i % 3 === 0) {
          k.draw('smoke', wave.x + c * radius * .94, .12, wave.z + s * radius * .94,
            .38 + progress * .38, .12 + progress * .08, .1, 0xb2dce8, fade * .12, angle);
        }
      }
    }
    for (const clock of this.zones) clock.seen = false;
    for (const state of this.walls) { state.seen = false; state.flash = Math.max(0, state.flash - dt * 5); }
    for (const zone of frame.snapshot?.zones ?? EMPTY_ZONES) {
      if (zone.remainingMs <= 0 || zone.element !== 'cryo') continue;
      if (zone.ability === 'frost-trail' && zone.shape === 'strip') this.frostStrip(zone);
      else if (zone.ability === 'whiteout') this.blizzard(zone, dt);
    }
    for (const wall of frame.snapshot?.deployables ?? EMPTY_DEPLOYABLES) {
      if (wall.kind === 'ice-wall' && wall.health > 0 && wall.remainingMs > 0) this.glacier(wall, dt);
    }
    for (const clock of this.zones) if (!clock.seen) clock.id = -1;
    for (const state of this.walls) if (!state.seen) state.id = -1;
  }

  private frostStrip(zone: AbilityZoneSnapshot): void {
    const k = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, dx = (zone.x2 - zone.x) / UNIT, dz = (zone.y2 - zone.y) / UNIT;
    const length = Math.hypot(dx, dz), direction = Math.atan2(dz, dx), cx = Math.cos(direction), sz = Math.sin(direction);
    const half = zone.width / UNIT / 2, fade = Math.min(1, zone.remainingMs / 450);
    const count = k.low ? 6 : 15;
    const age = (zone.durationMs - zone.remainingMs) / 1000;
    for (let i = 0; i <= count; i++) {
      const along = length * i / count;
      const seed = i * 1.873 + zone.id;
      for (let side = -1; side <= 1; side += 2) {
        const inset = half * (.64 + Math.sin(seed) ** 2 * .2);
        const px = x + cx * along - sz * inset * side, pz = z + sz * along + cx * inset * side;
        const growth = Math.min(1, Math.max(0, age * 12 - i * .05));
        k.draw('shard', px, .075, pz, .055, (.12 + Math.sin(seed * 2) ** 2 * .1) * growth, .09,
          i % 3 ? ICE : CORE, fade * .65, direction + seed * .15, side * .35);
        if (!k.low && this.emitMist && i % 5 === 0) {
          k.mote('smoke', px, .07, pz, -sz * .18, .08, cx * .18, .26, .65, 0xb5d9e5);
        }
      }
    }
    if (this.emitMist && !k.low) k.lightAt(zone.id, x + dx * .5, z + dz * .5, ICE, .75 * fade, 2.2);
  }

  private blizzard(zone: AbilityZoneSnapshot, dt: number): void {
    const k = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, radius = zone.radius / UNIT;
    const age = zone.durationMs - zone.remainingMs, fade = Math.min(1, zone.remainingMs / 600, age / 150);
    let clock: ZoneClock | undefined;
    for (const item of this.zones) if (item.id === zone.id) { clock = item; break; }
    if (!clock) {
      for (const item of this.zones) if (item.id === -1) { clock = item; item.id = zone.id; item.pulse = 0; break; }
    }
    if (clock) {
      clock.seen = true;
      const pulse = Math.floor(age / 2000);
      if (dt > 0 && pulse > clock.pulse) {
        clock.pulse = pulse;
        this.wave(x, z, radius, .75, false);
        k.flash(x, z, ICE, 4, 7, 3, .14);
      }
    }
    const time = k.reducedMotion ? 0 : k.time;
    const count = k.low ? 14 : 48;
    for (let i = 0; i < count; i++) {
      const seed = i * 2.39996323 + zone.id * .7;
      const angle = seed + time * (.33 + i % 3 * .06);
      const r = radius * (.48 + .48 * ((i * 17 % count) / count));
      const px = x + Math.cos(angle) * r, pz = z + Math.sin(angle) * r;
      const height = .1 + Math.sin(seed * 3) ** 2 * (k.low ? .1 : .72);
      k.draw('shard', px, height, pz, .018, .035, .1 + i % 3 * .04, i % 4 ? ICE : CORE, fade * .45, angle, .6);
      if (!k.low && i % 6 === 0) {
        const tail = angle - .095;
        k.ribbon(px, height, pz, x + Math.cos(tail) * r, height - .03, z + Math.sin(tail) * r, ICE, .009, fade * .3, false);
      }
    }
    // Open, low boundary sections imply a dome without a full-screen translucent shell.
    const edgeCount = k.low ? 12 : 24;
    for (let i = 0; i < edgeCount; i++) {
      const angle = i * TAU / edgeCount;
      k.draw('shard', x + Math.cos(angle) * radius * .992, .09, z + Math.sin(angle) * radius * .992,
        .025, .09, .11, ICE, fade * .38, angle);
    }
    k.lightAt(zone.id, x, z, ICE, 1.8 * fade, 6);
    if (!k.low && this.emitMist) {
      const angle = time * .6 + zone.id;
      k.mote('smoke', x + Math.cos(angle) * radius * .75, .06, z + Math.sin(angle) * radius * .75,
        -Math.sin(angle) * .4, .02, Math.cos(angle) * .4, .6, .9, 0xb0cedb);
    }
  }

  private glacier(wall: DeployableSnapshot, dt: number): void {
    const k = this.kit, x = wall.x / UNIT, z = wall.y / UNIT;
    const length = wall.length / UNIT, thickness = wall.thickness / UNIT;
    const alongX = -Math.sin(wall.angle), alongZ = Math.cos(wall.angle);
    const faceX = Math.cos(wall.angle), faceZ = Math.sin(wall.angle);
    const age = (wall.durationMs - wall.remainingMs) / 1000;
    const damage = 1 - wall.health / Math.max(1, wall.maxHealth), expiry = 1 - Math.min(1, wall.remainingMs / 1100);
    const fade = Math.min(1, wall.remainingMs / 130);
    let state: WallState | undefined;
    for (const item of this.walls) if (item.id === wall.id) { state = item; break; }
    if (!state) for (const item of this.walls) if (item.id === -1) { state = item; item.id = wall.id; item.health = wall.health; item.flash = 0; break; }
    if (state) {
      state.seen = true;
      if (dt > 0 && wall.health < state.health) {
        state.flash = 1;
        k.burst(x, .7, z, 'cryo', 8, 1.3, .45);
      }
      state.health = wall.health;
    }
    const count = k.low ? 5 : 9, column = length / count;
    for (let i = 0; i < count; i++) {
      const offset = -length / 2 + column * (i + .5), seed = i * 1.731 + wall.id;
      const rise = k.reducedMotion ? 1 : Math.min(1, Math.max(.02, (age - i * .009) / .09));
      const height = (1.35 + Math.sin(seed * 3) ** 2 * .62) * rise;
      const px = x + alongX * offset, pz = z + alongZ * offset;
      k.draw('solid', px, height * .33, pz, thickness * .86, height * .66, column * .94,
        DEEP, fade * .36, -wall.angle);
      k.draw('shard', px, height * .48, pz, thickness * .46, height * .52, column * .47,
        ICE, fade * (.42 + (state?.flash ?? 0) * .18), -wall.angle, Math.sin(seed) * .08);
      if (!k.low) {
        k.draw('shard', px + faceX * thickness * .07, height * .6, pz + faceZ * thickness * .07,
          thickness * .12, height * .41, column * .15, CORE, fade * .28, -wall.angle, .1);
        const crack = Math.max(damage, expiry);
        if (crack > .1 && i % 2 === 0) {
          const frontX = px + faceX * thickness * .44, frontZ = pz + faceZ * thickness * .44;
          k.ribbon(frontX, height * .75, frontZ, frontX + alongX * column * .22, height * .4, frontZ + alongZ * column * .22,
            CORE, .012, crack * fade * .55, false);
          k.ribbon(frontX + alongX * column * .22, height * .4, frontZ + alongZ * column * .22,
            frontX - alongX * column * .2, height * .2, frontZ - alongZ * column * .2, CORE, .009, crack * fade * .45, false);
        }
        if (this.emitMist && i % 3 === 0) k.mote('smoke', px, .08, pz, faceX * .16, .12, faceZ * .16, .35, .8, 0xc1dfeb);
      }
    }
    k.lightAt(wall.id, x, z, ICE, 1.3 * fade, 3.5);
  }

  clear(): void {
    for (const wave of this.waves) wave.live = false;
    for (const clock of this.zones) { clock.id = -1; clock.pulse = 0; clock.seen = false; }
    for (const state of this.walls) { state.id = -1; state.flash = 0; state.seen = false; }
    this.cursor = 0; this.mistAge = 0; this.emitMist = false;
  }

  dispose(): void { if (this.disposed) return; this.clear(); this.disposed = true; }
}

/** Registry factory; all GPU resources remain owned by ElementKit. */
export function createCryoPresentation(kit: ElementKit): AbilityPresentation {
  return new CryoPresentation(kit);
}
