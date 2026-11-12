import type { AbilityEvent, AbilityZoneSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, type AbilityFrame, type AbilityPresentation } from '../types';

const ICE = ELEMENT_COLORS.cryo;
const CORE = 0xe8fbff;
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
    k.impact();
    if (event.ability === 'frost-trail') {
      if (event.phase === 'dash-start') {
        k.burst(px, .12, pz, 'cryo', 10, 1.4, .45);
        if (Number.isFinite(event.targetX) && Number.isFinite(event.targetY)) {
          k.beam(px, .075, pz, event.targetX! / UNIT, .075, event.targetY! / UNIT, CORE, .055, .18, false);
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
        // Whiteout establishes a persistent perimeter; Nova owns the thick rolling front.
        k.ring(px, pz, radius, ICE, .65);
        k.flash(px, pz, ICE, 1.5, 4, 3, .12);
        k.camera(.14);
      } else if (event.phase === 'burst') {
        k.ring(px, pz, (event.radius ?? 100) / UNIT, CORE, .45);
        k.burst(px, .35, pz, 'cryo', 8, 1.4, .45);
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
      k.sustain(wave.age);
      const progress = Math.min(1, wave.age / wave.life);
      const travel = .12 + .88 * (1 - (1 - Math.min(1, wave.age / .24)) ** 3);
      const radius = wave.radius * travel;
      const fade = (1 - progress) * (.45 + .55 * k.flashIntensity);
      if (wave.age < wave.life && wave.aftermath) {
        // Nova alone owns the single rolling front. Arrival/shatter pulses stay thin.
        k.front(wave.x, wave.z, wave.radius, travel, CORE, .7, fade * .48, 2);
      }
      const count = k.low ? 12 : 36;
      for (let i = 0; i < count && wave.age < wave.life; i++) {
        const seed = i * 1.873, angle = (i + Math.sin(seed) * .32) * TAU / count;
        const c = Math.cos(angle), s = Math.sin(angle);
        const size = .045 + Math.sin(seed * 3.1) ** 2 * .1;
        k.draw('shard', wave.x + c * Math.max(0, radius - size * 1.65), .15 + Math.sin(i * 1.7) ** 2 * .18, wave.z + s * Math.max(0, radius - size * 1.65),
          size, size * (wave.shatter ? 3.6 : 2.7), size * .8, i % 3 ? ICE : CORE, fade * .85, angle + Math.sin(seed * 2.3) * .55, .1 + Math.sin(seed) * .12);
        if (!k.low && i % 3 === 0) {
          k.draw('smoke', wave.x + c * radius * .89, .3, wave.z + s * radius * .89,
            .65 + progress * .45, .33 + progress * .2, .1, 0xb2dce8, fade * .38, angle);
        }
      }
      if (wave.aftermath) {
        const needles = k.low ? 6 : 18, lingering = Math.min(1, (wave.life + 2.2 - wave.age) / 1.1);
        for (let i = 0; i < needles; i++) {
          const a = i * 2.39996323, r = wave.radius * (.66 + Math.sin(i * 1.71) ** 2 * .22);
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
    k.impact();
    for (const clock of this.zones) if (!clock.seen) clock.id = -1;
    for (const state of this.walls) if (!state.seen) state.id = -1;
  }

  private frostStrip(zone: AbilityZoneSnapshot): void {
    const k = this.kit, x = zone.x / UNIT, z = zone.y / UNIT;
    const dx = (zone.x2 - zone.x) / UNIT, dz = (zone.y2 - zone.y) / UNIT;
    const length = Math.hypot(dx, dz), direction = Math.atan2(dz, dx);
    const cx = Math.cos(direction), sz = Math.sin(direction), half = zone.width / UNIT / 2;
    if (half <= 0) return;
    const fade = Math.min(1, zone.remainingMs / 450), age = (zone.durationMs - zone.remainingMs) / 1000;
    k.sustain(age);
    // Broken fern seams describe the real capsule, with a dark open centre instead of a filled sheet.
    const count = k.low ? 6 : 13, perimeter = 2 * length + TAU * half;
    for (let i = 0; i < count; i++) {
      const seed = i * 2.731 + zone.id * .83, variation = Math.sin(seed * 2.1) ** 2;
      const path = perimeter * (i + .23 + Math.sin(seed) * .19) / count;
      const cluster = i % (k.low ? 2 : 4) === 1;
      const inset = half * (cluster ? .46 + variation * .06 : .63 + variation * .1);
      let along: number, lateral: number, tangent: number;
      if (path < length) { along = path; lateral = inset; tangent = 0; }
      else if (path < length + Math.PI * half) {
        const a = (path - length) / half;
        along = length + Math.sin(a) * inset; lateral = Math.cos(a) * inset; tangent = -a;
      } else if (path < 2 * length + Math.PI * half) {
        along = length - (path - length - Math.PI * half); lateral = -inset; tangent = Math.PI;
      } else {
        const a = (path - 2 * length - Math.PI * half) / half;
        along = -Math.sin(a) * inset; lateral = -Math.cos(a) * inset; tangent = Math.PI - a;
      }
      const px = x + cx * along - sz * lateral, pz = z + sz * along + cx * lateral;
      const size = Math.min(half * (cluster ? .22 : .13), (cluster ? .12 : .055) + variation * .075);
      const growth = k.reducedMotion ? 1 : Math.min(1, Math.max(.02, age * 10 - i * .035));
      const height = Math.min(half * (cluster ? .95 : .65), (cluster ? .4 : .14) + variation * .3) * growth;
      // Needles lean along the dash, never a repeated diamond paving pattern.
      k.draw('shard', px, height * .76 + .025, pz, size, height, size * .62,
        i % 5 ? ICE : CORE, fade * (.55 + variation * .25), -direction + Math.sin(seed) * .7, .12);
      if (cluster) {
        const shift = half * .12;
        k.draw('shard', px + Math.cos(direction) * shift, height * .42 + .025, pz + Math.sin(direction) * shift,
          size * .62, height * .52, size * .5, CORE, fade * .62, -direction - .38, -.08);
      }
      const seamLength = half * (cluster ? .36 : .23), yaw = direction + tangent;
      k.ribbon(px, .035, pz, px + Math.cos(yaw) * seamLength, .035, pz + Math.sin(yaw) * seamLength,
        ICE, Math.min(half * .045, .026 + variation * .014), fade * .58, false);
      if (cluster) {
        const bx = px + sz * lateral * .36, bz = pz - cx * lateral * .36;
        k.ribbon(px, .032, pz, bx + cx * half * .16, .032, bz + sz * half * .16, ICE, half * .035, fade * .52, false);
      }
      if (i % (k.low ? 3 : 2) === 0) {
        const t = length > 0 ? Math.max(0, Math.min(length, along)) : 0;
        const drift = k.reducedMotion ? 0 : Math.sin(age * 1.8 + seed) * half * .13;
        k.draw('smoke', x + cx * t - sz * drift, .12, z + sz * t + cx * drift,
          half * .52, .13 + variation * .075, .1, 0xa9d3e4, fade * .34);
      }
    }
    k.lightAt(zone.id, x + dx * .5, z + dz * .5, ICE, 1.1 * fade, 3);
    k.impact();
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
        k.ring(x, z, radius, CORE, .65);
        k.flash(x, z, ICE, 1.1, 4, 3, .1);
      }
    }
    k.sustain(age / 1000);
    const time = k.reducedMotion ? 0 : age / 1000;
    const clearRadius = Math.min(radius * .62, 2.25), count = k.low ? 10 : 24;
    // Snow follows the same circulation as the low mist, rather than a field of unrelated flecks.
    for (let i = 0; i < count; i++) {
      const seed = i * 2.39996323 + zone.id * .7;
      const phase = (i / count + time * .065) % 1;
      const r = clearRadius + (radius - clearRadius) * (.45 + Math.sin(seed * 3.7) ** 2 * .5);
      const angle = seed + time * .42 + phase * 1.3;
      const px = x + Math.cos(angle) * r, pz = z + Math.sin(angle) * r;
      const height = .18 + Math.sin(seed * 3) ** 2 * 1.05;
      const size = Math.min(.07 + Math.sin(seed * 1.7) ** 2 * .12, (radius - r) * .7);
      k.draw('shard', px, height, pz, .012, .018, size,
        i % 4 ? ICE : CORE, fade * (.25 + Math.sin(seed) ** 2 * .14), -angle, .3);
    }
    // Curved matte gusts form three connected currents without straight floating markers.
    const steps = k.low ? 3 : 5;
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1), seed = i * 2.73 + arm * 4.13;
        const variation = Math.sin(seed * 1.71) ** 2;
        const a = arm * TAU / 3 + t * 2.45 + time * .24;
        const band = radius - clearRadius, margin = band * .2;
        const r = clearRadius + margin + (band - margin * 2) * t;
        const radialSpace = Math.min(r - clearRadius, radius - r);
        // Complete rectangular brush support, including the curved ends, stays in the annulus.
        const halfLength = Math.min(.85 + t * .55 + variation * .25, radialSpace * .78);
        const halfWidth = Math.min(.18 + t * .12 + variation * .08, radialSpace * .24);
        k.gust(x + Math.cos(a) * r, z + Math.sin(a) * r, halfLength * 2, halfWidth * 2,
          a + Math.PI / 2 - .28, seed, fade * (.4 + variation * .12));
      }
    }
    k.lightAt(zone.id, x, z, ICE, .85 * fade, 4.5);
    if (!k.low) this.frostRims(zone, frame, fade * .45);
    k.impact();
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
        const distanceSquared = (x - zone.x) ** 2 + (z - zone.y) ** 2;
        if (distanceSquared > radiusSquared || Math.sqrt(distanceSquared) + .4 * UNIT >= zone.radius || distanceSquared < (Math.min(zone.radius * .62, 2.25 * UNIT) + .1 * UNIT) ** 2) continue;
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
    k.sustain(age);
    const count = k.low ? 5 : 9, column = length / count;
    for (let i = 0; i < count; i++) {
      const seed = i * 1.731 + wall.id, variation = Math.sin(seed * 2.37) ** 2;
      const offset = -length / 2 + column * (i + .5 + Math.sin(seed) * .29);
      const rise = k.reducedMotion ? 1 : Math.min(1, Math.max(.02, (age - i * .009) / .09));
      const height = (1.45 + Math.sin(seed * 3) ** 2 * 1.5) * rise;
      const lateral = Math.sin(seed * 4.1) * thickness * .075;
      const px = x + alongX * offset + faceX * lateral, pz = z + alongZ * offset + faceZ * lateral;
      const yaw = -wall.angle + Math.sin(seed * 5.1) * .12;
      const width = Math.min(column * (.54 + variation * .13), Math.max(.01, length / 2 - Math.abs(offset) - thickness * .07));
      const depth = thickness * (.25 + Math.sin(seed * 2.1) ** 2 * .055);
      // Overlapping dark rear facets and offset lit spires replace the backing box and diamond fence.
      k.draw('shard', px - faceX * thickness * .08, height * .46, pz - faceZ * thickness * .08,
        depth, height * .46, width, 0x27536d, fade * .91, yaw, 0, 1);
      const shoulder = width * Math.sin(seed * 2.9) * .32, shoulderHeight = height * (.23 + variation * .11);
      if (i % 3 !== 1) k.draw('shard', px + alongX * shoulder, shoulderHeight, pz + alongZ * shoulder,
        depth * .64, shoulderHeight, width * .52, i % 3 ? 0x6bb6d3 : 0x99d9ed,
        fade * .67, -wall.angle + Math.sin(seed * 3.9) * .32, 0, 1);
      // Broken ankle-high frost clusters stay irregular without a continuous rectangular skirt.
      k.draw('shard', px, .09 + variation * .09, pz, thickness * .39,
        (.12 + variation * .15) * rise, Math.min(width * 1.12, length / 2 - Math.abs(offset)), 0x4e8baf, fade * .55, -wall.angle);
      if (!k.low) {
        if (i % 3 !== 0) k.draw('shard', px + faceX * depth * .1 - alongX * width * .16, height * .55,
          pz + faceZ * depth * .1 - alongZ * width * .16,
          depth * .13, height * .36, width * .15, CORE, fade * (.17 + (state?.flash ?? 0) * .15), yaw, 0, 1);
        const crack = Math.max(damage, expiry);
        if (crack > .1 && i % 2 === 0) {
          const frontX = px + faceX * depth * .8, frontZ = pz + faceZ * depth * .8;
          k.ribbon(frontX, height * .75, frontZ, frontX + alongX * column * .16, height * .4, frontZ + alongZ * column * .16,
            CORE, .007, crack * fade * .4, false);
        }
        if (this.emitMist && i % 3 === 0) k.mote('smoke', px, .15, pz, faceX * .15, .04, faceZ * .15, .32, .8, 0x8eafc0);
      }
    }
    k.lightAt(wall.id, x, z, ICE, 2.6 * fade, 4.8);
    k.impact();
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
