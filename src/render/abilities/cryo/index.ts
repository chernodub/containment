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
type ColdWave = { live: boolean; x: number; z: number; radius: number; age: number; life: number; shatter: boolean; aftermath: boolean };
type ZoneClock = { id: number; pulse: number; seen: boolean };
type WallState = { id: number; health: number; flash: number; seen: boolean };

/** Four Cryo signatures composed exclusively from the shared, prewarmed instance pools. */
class CryoPresentation implements AbilityPresentation {
  private waves: ColdWave[] = Array.from({ length: PULSE_CAPACITY }, () => ({ live: false, x: 0, z: 0, radius: 1, age: 0, life: 1, shatter: false, aftermath: false }));
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
          k.beam(px, .075, pz, event.targetX! / UNIT, .075, event.targetY! / UNIT, CORE, .11, .24, false);
        }
      } else if (event.phase === 'dash-end') {
        const tx=(event.targetX??x)/UNIT,tz=(event.targetY??y)/UNIT;
        this.wave(tx, tz, .8, .45, false);
        k.burst(tx, .12, tz, 'cryo', 12, 1.7, .65);
      }
      return;
    }
    if (event.ability === 'cryo-nova' && event.phase === 'impact') {
      const radius = (event.radius ?? 210) / UNIT;
      this.wave(px, pz, radius, .78, false, true);
      k.burst(px, .18, pz, 'cryo', 32, 5.2, .95);
      k.scar('frost', px, pz, radius, ICE, 6.5);
      k.flash(px, pz, CORE, 15, Math.min(12, radius + 2), 4, .14);
      k.distort(px, pz, radius, -.005, .55);
      k.camera(.23);
    } else if (event.ability === 'glacier') {
      if (event.phase === 'impact') {
        const tx = (event.targetX ?? x) / UNIT, tz = (event.targetY ?? y) / UNIT;
        k.burst(tx, .1, tz, 'cryo', 18, 2.1, .65);
        k.flash(tx, tz, ICE, 9, 5, 3, .22);
        k.camera(.2);
      } else if (event.phase === 'burst') {
        const radius = (event.radius ?? 150) / UNIT;
        this.wave(px, pz, radius, .85, true);
        k.debris(px, pz, radius, 'cryo', 48);
        k.burst(px, .9, pz, 'cryo', 24, 5.5, 1.3);
        k.scar('frost', px, pz, radius, ICE, 7);
        k.distort(px, pz, radius, -.004, .55);
        k.flash(px, pz, CORE, 9, radius + 1, 4, .14);
        k.camera(.3);
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

  private wave(x: number, z: number, radius: number, life: number, shatter: boolean, aftermath = false): void {
    const wave = this.waves[this.cursor++ % this.waves.length];
    wave.live = true; wave.x = x; wave.z = z; wave.radius = radius; wave.life = life; wave.age = 0; wave.shatter = shatter; wave.aftermath = aftermath;
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
      if (wave.age >= wave.life + (wave.aftermath ? 2.2 : 0)) { wave.live = false; continue; }
      const progress = Math.min(1, wave.age / wave.life);
      const travel = .12 + .88 * (1 - (1 - Math.min(1, wave.age / .24)) ** 3);
      const radius = wave.radius * travel;
      const fade = (1 - progress) * (.45 + .55 * k.flashIntensity);
      if (wave.age < wave.life) {
        // A low, rolling body behind a hard front fills the actual radius in 240ms.
        k.front(wave.x, wave.z, wave.radius, travel, CORE, wave.shatter ? .5 : 1.05, fade * .78);
        if (!k.low) k.front(wave.x, wave.z, wave.radius, travel * .91, ICE, wave.shatter ? .22 : .48, fade * .42);
      }
      const count = k.low ? 12 : 36;
      for (let i = 0; i < count && wave.age < wave.life; i++) {
        const angle = i * TAU / count, c = Math.cos(angle), s = Math.sin(angle);
        const size = .07 + (i % 4) * .018;
        k.draw('shard', wave.x + c * (radius - size), .15 + Math.sin(i * 1.7) ** 2 * .18, wave.z + s * (radius - size),
          size, size * (wave.shatter ? 3.6 : 2.7), size * .8, i % 3 ? ICE : CORE, fade * .85, angle, .2);
        if (!k.low && i % 3 === 0) {
          k.draw('smoke', wave.x + c * radius * .89, .3, wave.z + s * radius * .89,
            .65 + progress * .45, .33 + progress * .2, .1, 0xb2dce8, fade * .38, angle);
        }
      }
      if (wave.aftermath) {
        const needles = k.low ? 8 : 24, lingering = Math.min(1, (wave.life + 2.2 - wave.age) / 1.1);
        for (let i = 0; i < needles; i++) {
          const a = i * 2.39996323, r = wave.radius * (.32 + (i % 7) * .09);
          const growth = Math.min(1, Math.max(0, (wave.age - r / wave.radius * .22) * 8));
          k.draw('shard', wave.x + Math.cos(a) * r, .1, wave.z + Math.sin(a) * r,
            .045 + i % 3 * .02, (.14 + i % 4 * .05) * growth, .055, i % 3 ? ICE : CORE, lingering * .55, -a, .15);
        }
      }
    }
    for (const clock of this.zones) clock.seen = false;
    for (const state of this.walls) { state.seen = false; state.flash = Math.max(0, state.flash - dt * 5); }
    for (const zone of frame.snapshot?.zones ?? EMPTY_ZONES) {
      if (zone.remainingMs <= 0 || zone.element !== 'cryo') continue;
      if (zone.ability === 'frost-trail' && zone.shape === 'strip') this.frostStrip(zone);
      else if (zone.ability === 'whiteout') this.blizzard(zone, dt, frame);
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
    // Continuous, ankle-low mass stays inside the authoritative capsule rectangle.
    k.draw('solid', x + dx * .5, .055, z + dz * .5, length, .095, half * 1.88, DEEP, fade * .62, -direction);
    const plates = k.low ? 5 : 11;
    for (let i = 0; i < plates; i++) {
      const t = (i + .5) / plates, r = half * (.56 + .12 * Math.sin(i * 3.7) ** 2);
      k.draw('shard', x + dx * t, .08, z + dz * t,
        Math.min(length / plates * .72, half * .7), .065, r, i % 3 ? ICE : CORE, fade * .56, -direction, 0);
    }
    // Faceted caps fill the rounded ends without extending beyond the real capsule.
    k.draw('shard', x, .055, z, half * .94, .08, half * .94, ICE, fade * .58, -direction);
    k.draw('shard', x + dx, .055, z + dz, half * .94, .08, half * .94, ICE, fade * .58, -direction);
    for (let i = 0; i <= count; i++) {
      const along = length * i / count;
      const seed = i * 1.873 + zone.id;
      for (let side = -1; side <= 1; side += 2) {
        const inset = half * (.64 + Math.sin(seed) ** 2 * .14);
        const px = x + cx * along - sz * inset * side, pz = z + sz * along + cx * inset * side;
        const growth = Math.min(1, Math.max(0, age * 12 - i * .05));
        k.draw('shard', px, .1, pz, Math.min(.09, half * .12), (.23 + Math.sin(seed * 2) ** 2 * .18) * growth, Math.min(.1, half * .15),
          i % 3 ? ICE : CORE, fade * .8, -direction, side * .2);
        if (!k.low && this.emitMist && i % 5 === 0) {
          k.mote('smoke', px, .12, pz, -sz * .22, .08, cx * .22, .4, .8, 0xb5d9e5);
        }
      }
    }
    k.lightAt(zone.id, x + dx * .5, z + dz * .5, ICE, 1.7 * fade, 3);
  }

  private blizzard(zone: AbilityZoneSnapshot, dt: number, frame: AbilityFrame): void {
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
    const count = k.low ? 24 : 96;
    for (let i = 0; i < count; i++) {
      const seed = i * 2.39996323 + zone.id * .7;
      const angle = seed + time * (.33 + i % 3 * .06);
      const r = radius * (.25 + .69 * ((i * 17 % count) / count));
      const px = x + Math.cos(angle) * r, pz = z + Math.sin(angle) * r;
      const height = .12 + Math.sin(seed * 3) ** 2 * (k.low ? .25 : 1.15);
      k.draw('shard', px, height, pz, .023, .035, .17 + i % 3 * .06, i % 4 ? ICE : CORE, fade * .62, -angle, .6);
      if (!k.low && i % 4 === 0) {
        const tail = angle - .11;
        k.ribbon(px, height, pz, x + Math.cos(tail) * r, height + .035, z + Math.sin(tail) * r, ICE, .013, fade * .42, false);
      }
    }
    // Open, low boundary sections imply a dome without a full-screen translucent shell.
    const edgeCount = k.low ? 12 : 24;
    for (let i = 0; i < edgeCount; i++) {
      const angle = i * TAU / edgeCount;
      const r = Math.max(0, radius - .14);
      k.draw('shard', x + Math.cos(angle) * r, .12, z + Math.sin(angle) * r,
        .05, .16, .13, ICE, fade * .52, -angle);
    }
    k.lightAt(zone.id, x, z, ICE, 3.8 * fade, 8);
    if (!k.low) this.frostRims(zone, frame, fade);
    if (!k.low && this.emitMist) {
      const angle = time * .6 + zone.id;
      k.mote('smoke', x + Math.cos(angle) * radius * .75, .06, z + Math.sin(angle) * radius * .75,
        -Math.sin(angle) * .65, .02, Math.cos(angle) * .65, .85, 1.1, 0xb0cedb);
    }
  }

  private frostRims(zone: AbilityZoneSnapshot, frame: AbilityFrame, fade: number): void {
    const blockers = frame.game?.geometry?.blockers;
    if (!blockers) return;
    const k = this.kit, radiusSquared = zone.radius * zone.radius;
    let count = 0;
    // These are the actual authored solid skirts, not invented props or hit geometry.
    for (const rect of blockers) {
      for (let corner = 0; corner < 4; corner++) {
        const x = rect.x + (corner % 2) * rect.width, z = rect.y + Math.floor(corner / 2) * rect.height;
        if ((x - zone.x) ** 2 + (z - zone.y) ** 2 > radiusSquared) continue;
        k.draw('shard', x / UNIT, .16, z / UNIT, .07, .23, .07, CORE, fade * .48, corner * Math.PI / 2);
        const alongX = corner < 2 ? .35 : 0, alongZ = corner < 2 ? 0 : .35;
        k.ribbon(x / UNIT, .13, z / UNIT, x / UNIT + alongX, .13, z / UNIT + alongZ, ICE, .024, fade * .3, false);
        if (++count >= 16) return;
      }
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
    if (!state) for (const item of this.walls) if (item.id === -1) {
      state = item; item.id = wall.id; item.health = wall.health; item.flash = 0;
      k.scar('frost', x, z, length * .52, ICE, wall.remainingMs / 1000 + 3, wall.angle + Math.PI / 2, thickness * 1.2);
      break;
    }
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
      const height = (2.05 + Math.sin(seed * 3) ** 2 * .45) * rise;
      const px = x + alongX * offset, pz = z + alongZ * offset;
      k.iceColumn(px, pz, column, thickness, height, wall.angle, fade * (1 + (state?.flash ?? 0) * .2));
      if (!k.low) {
        const crack = Math.max(damage, expiry);
        if (crack > .1 && i % 2 === 0) {
          const frontX = px + faceX * thickness * .44, frontZ = pz + faceZ * thickness * .44;
          k.ribbon(frontX, height * .75, frontZ, frontX + alongX * column * .22, height * .4, frontZ + alongZ * column * .22,
            CORE, .012, crack * fade * .55, false);
          k.ribbon(frontX + alongX * column * .22, height * .4, frontZ + alongZ * column * .22,
            frontX - alongX * column * .2, height * .2, frontZ - alongZ * column * .2, CORE, .009, crack * fade * .45, false);
        }
        if (this.emitMist && i % 3 === 0) k.mote('smoke', px, .2, pz, faceX * .3, .06, faceZ * .3, .6, 1.05, 0xc1dfeb);
      }
    }
    k.lightAt(wall.id, x, z, ICE, 2.6 * fade, 4.8);
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
