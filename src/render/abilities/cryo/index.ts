import type { AbilityEvent, AbilityZoneSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, type AbilityFrame, type AbilityPresentation } from '../types';
import { authoredVariation } from '../GraphicLanguage';

const ICE = ELEMENT_COLORS.cryo;
const CORE = 0xe8fbff;
const TAU = Math.PI * 2;
const EMPTY_ZONES: readonly AbilityZoneSnapshot[] = [];
const EMPTY_DEPLOYABLES: readonly DeployableSnapshot[] = [];
const PULSE_CAPACITY = 24;
const WALL_SECTIONS = [0, .17, .43, .63, .86, 1] as const;
const LOW_WALL_SECTIONS = [0, .23, .51, .79, 1] as const;
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
        k.debris(px, pz, radius, 'cryo', 18);
        k.burst(px, .9, pz, 'cryo', 10, 5.5, 1.3);
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
    const whiteout = frame.snapshot?.zones.find(zone => zone.ability === 'whiteout' && zone.remainingMs > 0);
    for (const wave of this.waves) {
      if (!wave.live) continue;
      wave.age += dt;
      if (wave.age >= wave.life + (wave.aftermath ? 2.2 : 0)) { wave.live = false; continue; }
      k.sustain(wave.age);
      const progress = Math.min(1, wave.age / wave.life);
      const travel = .12 + .88 * (1 - (1 - Math.min(1, wave.age / .24)) ** 3);
      const radius = wave.radius * travel;
      const insideStorm = whiteout && Math.hypot(wave.x - whiteout.x / UNIT, wave.z - whiteout.y / UNIT) + wave.radius < whiteout.radius / UNIT;
      const localYield = insideStorm && wave.age > .10 ? .16 : 1;
      const fade = (1 - progress) * (.45 + .55 * k.flashIntensity) * localYield;
      if (wave.age < wave.life && wave.aftermath) {
        // Nova alone owns the single rolling front. Arrival/shatter pulses stay thin.
        // Retain the impact's rolling wall for 100ms, then collapse its broad
        // curtain into the same wavy physical edge before it can veil a fight.
        const curtainYield = Math.min(1, Math.max(0, (wave.age - .10) / .08));
        k.front(wave.x, wave.z, wave.radius, travel, CORE, .7 - curtainYield * .43,
          fade * .48 * (1 - curtainYield * .55), 2);
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
            .045 + i % 3 * .02, (.14 + i % 4 * .05) * growth, .055, i % 3 ? ICE : CORE, lingering * .30 * localYield, -a, .15);
        }
      }
    }
    for (const clock of this.zones) clock.seen = false;
    for (const state of this.walls) { state.seen = false; state.flash = Math.max(0, state.flash - dt * 5); }
    for (const zone of frame.snapshot?.zones ?? EMPTY_ZONES) {
      if (zone.remainingMs <= 0 || zone.element !== 'cryo') continue;
      if (zone.ability === 'frost-trail' && zone.shape === 'strip') this.frostStrip(zone, whiteout);
      else if (zone.ability === 'whiteout') this.blizzard(zone, dt, frame);
    }
    for (const wall of frame.snapshot?.deployables ?? EMPTY_DEPLOYABLES) {
      if (wall.kind === 'ice-wall' && wall.health > 0 && wall.remainingMs > 0) this.glacier(wall, dt);
    }
    k.impact();
    for (const clock of this.zones) if (!clock.seen) clock.id = -1;
    for (const state of this.walls) if (!state.seen) state.id = -1;
  }

  private frostStrip(zone: AbilityZoneSnapshot, whiteout?: AbilityZoneSnapshot): void {
    const k = this.kit, x = zone.x / UNIT, z = zone.y / UNIT;
    const dx = (zone.x2 - zone.x) / UNIT, dz = (zone.y2 - zone.y) / UNIT;
    const length = Math.hypot(dx, dz), direction = Math.atan2(dz, dx);
    const cx = Math.cos(direction), sz = Math.sin(direction), half = zone.width / UNIT / 2;
    if (half <= 0) return;
    const fade = Math.min(1, zone.remainingMs / 450), age = (zone.durationMs - zone.remainingMs) / 1000;
    k.sustain(age);
    // New contact retains its brief frost hit; settled coverage yields even on
    // unoccupied deck, with the exact capsule and its crystal edges unchanged.
    const covered = whiteout && Math.hypot(zone.x - whiteout.x, zone.y - whiteout.y) < whiteout.radius && Math.hypot(zone.x2 - whiteout.x, zone.y2 - whiteout.y) < whiteout.radius;
    const overlapYield = covered && age > .25 ? .22 : 1;
    const groundYield = overlapYield * (1 - .68 * Math.min(1, Math.max(0, (age - .25) / .12)));
    k.frostFilm(x + dx * .5, z + dz * .5, length, half, direction, fade * .62 * groundYield);
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
        i % 5 ? ICE : CORE, fade * (.55 + variation * .25) * overlapYield, -direction + Math.sin(seed) * .7, .12);
      if (cluster) {
        const shift = half * .12;
        k.draw('shard', px + Math.cos(direction) * shift, height * .42 + .025, pz + Math.sin(direction) * shift,
          size * .62, height * .52, size * .5, CORE, fade * .62 * overlapYield, -direction - .38, -.08);
      }
      const seamLength = half * (cluster ? .36 : .23), yaw = direction + tangent;
      k.ribbon(px, .035, pz, px + Math.cos(yaw) * seamLength, .035, pz + Math.sin(yaw) * seamLength,
        ICE, Math.min(half * .045, .026 + variation * .014), fade * .58 * overlapYield, false);
      if (cluster) {
        const bx = px + sz * lateral * .36, bz = pz - cx * lateral * .36;
        k.ribbon(px, .032, pz, bx + cx * half * .16, .032, bz + sz * half * .16, ICE, half * .035, fade * .52 * overlapYield, false);
      }
      if (i % (k.low ? 3 : 2) === 0) {
        const t = length > 0 ? Math.max(0, Math.min(length, along)) : 0;
        const drift = k.reducedMotion ? 0 : Math.sin(age * 1.8 + seed) * half * .13;
        k.draw('smoke', x + cx * t - sz * drift, .12, z + sz * t + cx * drift,
          half * .52, .13 + variation * .075, .1, 0xa9d3e4, fade * .34 * groundYield);
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
    const groundYield = 1 - .65 * Math.min(1, Math.max(0, (age - 250) / 120));
    const time = k.reducedMotion ? 0 : age / 1000;
    const clearRadius = radius * .76, count = k.low ? 10 : 24;
    k.front(x, z, radius, 1, ICE, .85, fade * .24, 3);
    // Snow follows the same circulation as the low mist, rather than a field of unrelated flecks.
    for (let i = 0; i < count; i++) {
      const seed = i * 2.39996323 + zone.id * .7;
      const phase = (i / count + time * .065) % 1;
      const r = clearRadius + (radius - clearRadius) * (.45 + Math.sin(seed * 3.7) ** 2 * .5);
      const angle = seed + time * .42 + phase * 1.3;
      const px = x + Math.cos(angle) * r, pz = z + Math.sin(angle) * r;
      const height = .18 + Math.sin(seed * 3) ** 2 * 1.05;
      const variation = Math.sin(seed * 1.7) ** 2;
      const size = Math.min(.12 + variation * .18, (radius - r) * .7);
      k.draw('shard', px, height, pz, .028 + variation * .012, .035, size,
        i % 3 ? ICE : CORE, fade * (.4 + Math.sin(seed) ** 2 * .18), -angle, .3);
    }
    // Short tangential currents reinforce the storm perimeter, leaving the eye calm.
    const strokes = k.low ? 3 : 6;
    for (let i = 0; i < strokes; i++) {
      const seed = i * 2.731 + zone.id, variation = authoredVariation(seed, 3);
      const a = i * TAU / strokes + time * .24 + variation * .21;
      const r = radius * (.84 + variation * .045), halfWidth = Math.min(.17, radius * .025);
      const halfLength = Math.min(radius * (.14 + variation * .08), Math.sqrt(Math.max(.001, radius * radius - (r + halfWidth) ** 2)) * .85);
      k.gust(x + Math.cos(a) * r, z + Math.sin(a) * r, halfLength * 2, halfWidth * 2,
        a + Math.PI / 2, seed, fade * (.33 + variation * .13) * groundYield);
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
        if (distanceSquared > radiusSquared || Math.sqrt(distanceSquared) + .4 * UNIT >= zone.radius || distanceSquared < (zone.radius * .76 + .1 * UNIT) ** 2) continue;
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
    const sections = k.low ? LOW_WALL_SECTIONS : WALL_SECTIONS, count = sections.length - 1;
    for (let i = 0; i < count; i++) {
      const seed = wall.id * .73 + i * 2.731, variation = authoredVariation(seed, 2);
      const lo = sections[i] * length - length * .5, hi = sections[i + 1] * length - length * .5;
      const offset = (lo + hi) * .5, column = hi - lo;
      const rise = k.reducedMotion ? 1 : Math.min(1, Math.max(.02, (age - i * .012) / .095));
      const height = (1.65 + variation * 1.0 + (i % 2 ? .25 : 0)) * rise;
      const yaw = -wall.angle + (variation - .5) * .075;
      const px = x + alongX * offset, pz = z + alongZ * offset;
      const width = Math.min(column * .59, length * .5 - Math.abs(offset) - thickness * .06);
      const depth = thickness * (.37 - Math.abs(Math.sin(yaw + wall.angle)) * .4);
      // Few large interlocking broken-crown blocks: the wall reads as cover, not a spike fence.
      k.draw('shard', px, height * .5, pz, depth, height * .5, width,
        i % 2 ? 0x65b6d2 : 0x8bd3e5, fade * .94, yaw, 0, 2.7 + variation * 4);
      if (i === 0 || i === count - 1 || !k.low && i === 2) {
        const ankle = .22 + variation * .14;
        k.draw('shard', px, ankle, pz, thickness * .39, ankle,
          Math.min(width, length * .5 - Math.abs(offset)), 0x4e8baf, fade * .68, -wall.angle, 0, 8 + variation);
      }
      // A narrow internal fracture glow sits on the front plane and never fills the wall.
      const fx = px + faceX * depth * .7, fz = pz + faceZ * depth * .7;
      const along = column * .12;
      k.ribbon(fx - alongX * along, height * .28, fz - alongZ * along,
        fx + alongX * along, height * .62, fz + alongZ * along, CORE, .022,
        fade * (.43 + (state?.flash ?? 0) * .25), false);
      if (!k.low) {
        k.ribbon(fx + alongX * along, height * .62, fz + alongZ * along,
          fx - alongX * along * .4, height * .83, fz - alongZ * along * .4, ICE, .012,
          fade * (.35 + Math.max(damage, expiry) * .3), false);
        if (this.emitMist && i % 2 === 0) k.mote('smoke', px, .12, pz, faceX * .1, .04, faceZ * .1, .3, .8, 0x8eafc0);
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
