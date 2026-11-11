import type { AbilityEvent, AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { ElementKit } from '../ElementKit';
import { UNIT, type AbilityFrame, type AbilityPresentation } from '../types';

const FIRE = 0xff7a2e;
const CORE = 0xffedb5;
const SOOT = 0x101619;
const HOT = 0xff982f;
const FAN = ABILITY_CATALOG.flashfire.shape;
const FAN_RANGE = FAN.kind === 'cone' ? FAN.range / UNIT : 0;
const FAN_ARC = FAN.kind === 'cone' ? FAN.arcRadians : 0;
const TRANSIENT_CAPACITY = 24;
type Footprint = { live: boolean; x: number; z: number; angle: number; age: number };
type Transient = {
  live: boolean;
  kind: 'cone' | 'lob' | 'exhaust' | 'ignition';
  age: number;
  life: number;
  x: number;
  z: number;
  tx: number;
  tz: number;
  angle: number;
  radius: number;
  range: number;
  arc: number;
};

/** Short rising fire volumes settle into broken tongues, soot and head-clear embers. */
class PyroPresentation implements AbilityPresentation {
  private readonly effects: Transient[] = Array.from({ length: TRANSIENT_CAPACITY }, () => ({
    live: false, kind: 'cone', age: 0, life: 1, x: 0, z: 0, tx: 0, tz: 0,
    angle: 0, radius: 0, range: 0, arc: 0,
  }));
  private next = 0;
  private emission = 0;
  private shimmer = 0;
  private readonly prints: Footprint[] = Array.from({ length: 12 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0 }));
  private printCursor = 0;
  private printClock = 0;
  private disposed = false;

  constructor(private readonly kit: ElementKit) {}

  private acquire(kind: Transient['kind'], x: number, z: number, life: number): Transient {
    const effect = this.effects[this.next++ % TRANSIENT_CAPACITY];
    effect.live = true; effect.kind = kind; effect.x = x; effect.z = z;
    effect.tx = x; effect.tz = z; effect.age = 0; effect.life = life;
    effect.angle = 0; effect.radius = 0; effect.range = 0; effect.arc = 0;
    return effect;
  }

  event(event: AbilityEvent, x: number, y: number): void {
    if (this.disposed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    x /= UNIT; const z = y / UNIT, kit = this.kit;
    if (event.phase === 'denied' || event.phase === 'ready' || event.phase === 'overdrive-ready') return;
    if (event.ability === 'afterburn') {
      if (event.phase === 'dash-start') {
        const p = this.acquire('exhaust', x, z, .3);
        p.angle = event.angle ?? 0;
        p.tx = (event.targetX ?? x * UNIT) / UNIT;
        p.tz = (event.targetY ?? y) / UNIT;
        kit.flash(x, z, FIRE, 12, 5, 2, .2);
      } else if (event.phase === 'dash-end') {
        const tx = (event.targetX ?? x * UNIT) / UNIT, tz = (event.targetY ?? y) / UNIT;
        kit.burst(tx, .15, tz, 'pyro', 16, 1.4, .4);
        kit.scar('soot', tx, tz, .7, SOOT, 5);
      }
      return;
    }
    if (event.ability === 'flashfire') {
      // Scorched Fan emits a separate circle receipt; its snapshot supplies the pool.
      if (event.radius !== undefined && event.arcRadians === undefined) return;
      if (event.phase === 'cast') {
        const a = event.angle ?? 0;
        kit.mote('spark', x + Math.cos(a) * .35, .7, z + Math.sin(a) * .35,
          Math.cos(a) * 1.5, .2, Math.sin(a) * 1.5, .05, .12, CORE);
      } else if (event.phase === 'impact') {
        const p = this.acquire('cone', x, z, .72);
        p.angle = event.angle ?? 0; p.range = (event.length ?? FAN_RANGE * UNIT) / UNIT;
        p.arc = event.arcRadians ?? FAN_ARC;
        kit.flash(x + Math.cos(p.angle) * 1.2, z + Math.sin(p.angle) * 1.2, FIRE, 24, 8, 4, .32);
        kit.distort(x + Math.cos(p.angle) * p.range * .5, z + Math.sin(p.angle) * p.range * .5, p.range * .55, .0045, .65, true);
        kit.camera(.21, p.angle);
        this.scorchFan(p);
      }
      return;
    }
    if (event.ability === 'napalm-charge') {
      if (event.phase === 'cast') {
        const p = this.acquire('lob', x, z, Math.max(.05, (event.durationMs ?? 350) / 1000));
        p.tx = (event.targetX ?? x * UNIT) / UNIT; p.tz = (event.targetY ?? y) / UNIT;
        p.radius = (event.radius ?? 120) / UNIT;
      } else if (event.phase === 'impact') {
        const tx = (event.targetX ?? x * UNIT) / UNIT, tz = (event.targetY ?? y) / UNIT;
        const radius = (event.radius ?? 120) / UNIT;
        // Authoritative landing immediately retires matching in-flight canisters.
        for (const p of this.effects) if (p.live && p.kind === 'lob' && Math.hypot(p.tx - tx, p.tz - tz) < .02) p.live = false;
        kit.burst(tx, .25, tz, 'pyro', 36, 3.5, .65);
        kit.ring(tx, tz, radius, CORE, .42);
        kit.scar('soot', tx, tz, radius, SOOT, 10);
        kit.flash(tx, tz, CORE, 22, Math.max(6, radius * 1.8), 5, .3);
        kit.distort(tx, tz, radius * 1.1, .004, .65, true);
        kit.camera(.26);
        const p = this.acquire('ignition', tx, tz, .65); p.radius = radius; p.range = 1;
      }
      return;
    }
    if (event.ability === 'meltdown') {
      if (event.phase === 'impact' || event.phase === 'burst') {
        const radius = (event.radius ?? 130) / UNIT;
        const p = this.acquire('ignition', x, z, event.phase === 'burst' ? .38 : .65); p.radius = radius;
        kit.burst(x, .35, z, 'pyro', event.phase === 'burst' ? 12 : 20, 3, .65);
        kit.ring(x, z, radius, CORE, .5);
        kit.flash(x, z, FIRE, event.phase === 'burst' ? 5 : 14, 6, event.phase === 'burst' ? 3 : 6, .25);
        kit.distort(x, z, radius, .004, .6, true);
        if (event.phase === 'impact') { kit.camera(.34); kit.exposureFlash(.2); }
      } else if (event.phase === 'end') {
        kit.burst(x, .2, z, 'pyro', 12, .8, .7);
        for (let i = 0; i < (kit.low ? 2 : 5); i++) kit.mote('smoke', x + Math.cos(i * 2.4) * .4, .5, z + Math.sin(i * 2.4) * .4, 0, .55, 0, .5, 1.3, SOOT);
      }
    }
  }

  private scorchFan(p: Transient): void {
    this.kit.scar('fan', p.x, p.z, p.range, SOOT, 8, p.angle, p.range, p.arc);
  }

  update(frame: AbilityFrame): void {
    if (this.disposed || !frame.visible) return;
    const kit = this.kit, dt = Math.max(0, frame.dt);
    this.emission += dt; this.shimmer += dt;
    const emit = dt > 0 && this.emission >= (kit.low ? .15 : .065);
    const shimmer = dt > 0 && this.shimmer >= .65;
    if (emit) this.emission = 0;
    if (shimmer) this.shimmer = 0;
    for (const p of this.effects) {
      if (!p.live) continue;
      p.age += dt;
      if (p.age >= p.life) { p.live = false; continue; }
      if (p.kind === 'cone') this.cone(p, emit);
      else if (p.kind === 'lob') this.lob(p, emit);
      else if (p.kind === 'exhaust') this.exhaust(p, frame, emit);
      else this.ignition(p);
    }
    if (frame.snapshot?.rig === 'pyro' && frame.snapshot.overdrive.active && frame.game) {
      const player = frame.game.player;
      this.printClock -= dt;
      if (dt > 0 && Math.hypot(player.vx, player.vy) > 18 && this.printClock <= 0) {
        const print = this.prints[this.printCursor++ % this.prints.length], side = this.printCursor % 2 ? 1 : -1;
        print.live = true; print.age = 0; print.angle = player.angle;
        print.x = player.x / UNIT - Math.sin(player.angle) * side * .19;
        print.z = player.y / UNIT + Math.cos(player.angle) * side * .19;
        this.printClock = kit.low ? .28 : .16;
      }
    }
    for (const print of this.prints) {
      if (!print.live) continue;
      print.age += dt;
      if (print.age >= 1.5) { print.live = false; continue; }
      const fade = 1 - print.age / 1.5;
      kit.draw('solid', print.x, .035, print.z, .16, .018, .34, SOOT, fade * .7, -print.angle);
      kit.draw('flame', print.x, .15, print.z, .17, .14, 1, CORE, fade * .65);
    }
    if (!frame.snapshot) return;
    for (const zone of frame.snapshot.zones) {
      if (zone.element !== 'pyro' || zone.remainingMs <= 0) continue;
      if (zone.shape === 'strip') this.fireStrip(zone, emit);
      else this.firePool(zone, emit, shimmer, frame);
    }
    if (frame.snapshot.rig === 'pyro' && frame.snapshot.overdrive.active && frame.game) {
      kit.grade(.7);
      let count = 0;
      for (const bullet of frame.game.bullets) {
        if (bullet.kind !== 'player') continue;
        if (count++ >= (kit.low ? 8 : 30)) break;
        const bx = bullet.x / UNIT, bz = bullet.y / UNIT, a = bullet.request.angle;
        kit.ribbon(bx - Math.cos(a) * .9, .85, bz - Math.sin(a) * .9, bx, .85, bz, CORE, .045, .7, false);
        if (emit && !kit.low) kit.mote('spark', bx, .85, bz, -.1 * Math.cos(a), .2, -.1 * Math.sin(a), .035, .32, FIRE);
      }
    }
  }

  private cone(p: Transient, emit: boolean): void {
    const kit = this.kit, grow = Math.min(1, .22 + p.age / .11);
    // Hold the full dump for 350ms, then let the hot folds roll into smoke.
    const fade = Math.max(0, 1 - Math.max(0, p.age - .35) / .37);
    kit.fireFan(p.x, p.z, p.range * grow, p.angle, p.arc, fade * .85);
    // Sparse, irregular far smoke breaks the silhouette without drawing a triangular backing plane.
    const smoke = kit.low ? 2 : 5;
    for (let i = 0; i < smoke; i++) {
      const seed = i * 2.731 + .71, a = p.angle + Math.sin(seed * 3.17) * p.arc * .4;
      const r = p.range * grow * (.77 + Math.sin(seed * 7.1) ** 2 * .17);
      const rise = kit.reducedMotion ? .4 : (kit.time * .7 + i * .237) % 1;
      kit.draw('smoke', p.x + Math.cos(a) * r, .6 + rise * .6, p.z + Math.sin(a) * r,
        .35 + rise * .32, .32 + rise * .25, 1, SOOT, (.18 - rise * .07) * fade);
    }
    // White-yellow throat binds the full cone to the suit's discharge point.
    const throat = Math.min(1, p.range * .15) * grow, h = .95 * fade;
    kit.draw('flame', p.x + Math.cos(p.angle) * throat, .13 + h * .5, p.z + Math.sin(p.angle) * throat,
      .58 * fade, h * .5, 1, CORE, .92 * fade);
    kit.draw('spark', p.x + Math.cos(p.angle) * .55, .65, p.z + Math.sin(p.angle) * .55,
      .3, .35, 1, CORE, .65 * fade);
    if (emit && !kit.low) {
      const r = p.range * grow * .9, a = p.angle + Math.sin(p.age * 43) * p.arc * .35;
      kit.mote('smoke', p.x + Math.cos(a) * r, .65, p.z + Math.sin(a) * r,
        Math.cos(a) * .45, .65, Math.sin(a) * .45, .65, 1.1, SOOT);
      for (let i = 0; i < 4; i++) kit.mote('spark', p.x + Math.cos(a) * r, .35, p.z + Math.sin(a) * r,
        Math.cos(a) * (1.6 + i * .4), .8 + i * .3, Math.sin(a) * (1.6 + i * .4), .04 + i * .01, .8, CORE);
    }
  }

  private lob(p: Transient, emit: boolean): void {
    const kit = this.kit, t = p.age / p.life;
    const x = p.x + (p.tx - p.x) * t, z = p.z + (p.tz - p.z) * t;
    const height = .85 * (1 - t) + Math.sin(t * Math.PI) * 2.3 + .15;
    const spin = kit.reducedMotion ? 0 : t * Math.PI * 3;
    kit.draw('solid', x, height, z, .24, .42, .24, 0x283d43, .98, spin, spin);
    kit.draw('solid', x, height + .09, z, .25, .07, .25, CORE, .95, spin, spin);
    kit.draw('spark', x, height + .15, z, .12, .16, 1, CORE, .95);
    if (emit) kit.mote('smoke', x, height, z, 0, .2, 0, .18, .5, SOOT);
    for (let i = 1; i <= (kit.low ? 2 : 5); i++) {
      const tail = Math.max(0, t - i * .045), h = .85 * (1 - tail) + Math.sin(tail * Math.PI) * 2.3 + .15;
      kit.draw('flame', p.x + (p.tx - p.x) * tail, h, p.z + (p.tz - p.z) * tail, .08, .13, 1, HOT, .7 - i * .09);
    }
    if (kit.low) return;
    // Eight narrow trajectory segments; this is a flight path, not a damage area.
    for (let i = 0; i < 8; i++) {
      const a = i / 8, b = (i + .55) / 8;
      if (a < t) continue;
      kit.ribbon(p.x + (p.tx - p.x) * a, .85 * (1 - a) + Math.sin(a * Math.PI) * 2.3 + .15, p.z + (p.tz - p.z) * a,
        p.x + (p.tx - p.x) * b, .85 * (1 - b) + Math.sin(b * Math.PI) * 2.3 + .15, p.z + (p.tz - p.z) * b, 0x9fe8ff, .008, .17, false);
    }
  }

  private exhaust(p: Transient, frame: AbilityFrame, emit: boolean): void {
    const kit = this.kit, fraction = Math.min(1, p.age / .14), fade = 1 - p.age / p.life;
    const x = frame.snapshot?.dashing && frame.game ? frame.game.player.x / UNIT : p.x + (p.tx - p.x) * fraction;
    const z = frame.snapshot?.dashing && frame.game ? frame.game.player.y / UNIT : p.z + (p.tz - p.z) * fraction;
    const cx = Math.cos(p.angle), sz = Math.sin(p.angle);
    for (let side = -1; side <= 1; side += 2) {
      const bx = x - cx * .35 - sz * side * .22, bz = z - sz * .35 + cx * side * .22;
      kit.ribbon(bx, .65, bz, bx - cx * .8 * fade, .35, bz - sz * .8 * fade, HOT, .025 * fade, .6, false);
      for (let i = 0; i < (kit.low ? 1 : 3); i++) {
        const behind = .2 + i * .38, h = (1.0 - i * .14) * fade;
        kit.draw('flame', bx - cx * behind, .35 + h * .35, bz - sz * behind,
          (.35 + i * .05) * fade, h * .5, 1, i === 0 ? CORE : FIRE, (.9 - i * .1) * fade, 0, side * -.15);
      }
      if (emit) {
        kit.mote('spark', bx, .5, bz, -cx * 3, .65, -sz * 3, .035, .6, CORE);
        if (!kit.low) kit.mote('smoke', bx - cx * .6, .5, bz - sz * .6, -cx * .6, .35, -sz * .6, .3, .7, SOOT);
      }
    }
  }

  private ignition(p: Transient): void {
    const kit = this.kit, t = p.age / p.life, fade = 1 - t;
    const r = p.radius * Math.min(1, .16 + t * 2.6), n = kit.low ? 7 : 20;
    for (let i = 0; i < n; i++) {
      const variation = .5 + .5 * Math.sin(i * 9.31 + 2.7);
      const a = (i + variation * .4) / n * Math.PI * 2;
      const h = (p.range > 0 ? 1.15 + variation * 1.1 : .4 + variation * .4) * fade, width = (p.range > 0 ? .5 + variation * .4 : .2 + variation * .18) * fade;
      kit.draw('flame', p.x + Math.cos(a) * r, .06 + h * .5, p.z + Math.sin(a) * r,
        width, h * .5, 1, i % 3 === 0 ? HOT : FIRE, .82 * fade);
    }
    // The brief central stem and rising crown sell pressure before the liquid spreads.
    const cap = Math.sin(Math.min(1, t * 1.7) * Math.PI * .65), spread = Math.max(.35, p.radius * .45 * cap);
    if (p.range > 0) kit.draw('flame', p.x, .25 + fade * .55, p.z, .6 * fade, .8 * fade, 1, CORE, .9 * fade);
    for (let i = 0; p.range > 0 && i < (kit.low ? 3 : 7); i++) {
      const a = i * 2.399963, cr = spread * (i % 2 ? .6 : 1);
      kit.draw('flame', p.x + Math.cos(a) * cr, .7 + cap * .75, p.z + Math.sin(a) * cr,
        (.65 + cap * .3) * fade, .5 * fade, 1, CORE, .75 * fade);
      if (!kit.low && p.range > 0) kit.draw('smoke', p.x + Math.cos(a) * cr, 1.05 + cap * 1.0, p.z + Math.sin(a) * cr,
        .65 + t * .45, .5, 1, SOOT, .26 * fade);
    }
  }

  private fireStrip(zone: AbilityZoneSnapshot, emit: boolean): void {
    const kit = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, ex = zone.x2 / UNIT, ez = zone.y2 / UNIT;
    const angle = Math.atan2(ez - z, ex - x), radius = zone.width / UNIT * .5;
    const c = Math.cos(angle), s = Math.sin(angle), length = Math.hypot(ex - x, ez - z);
    const fade = Math.min(1, zone.remainingMs / 350), points = Math.min(kit.low ? 11 : 20, Math.max(kit.low ? 8 : 14, Math.ceil(length / (kit.low ? .6 : .4))));
    for (let i = 0; i <= points; i++) {
      const variation = .5 + .5 * Math.sin(i * 13.7 + zone.id * 2.1);
      const t = .015 + .97 * (i === 0 || i === points ? i / points : (i + (variation - .5) * .6) / points);
      const wobble = kit.reducedMotion ? .5 : .5 + .5 * Math.sin(kit.time * 9 + i * 2.4 + zone.id);
      const lateral = Math.sin(i * 2.67 + zone.id) * radius * .35;
      const px = x + (ex - x) * t - s * lateral, pz = z + (ez - z) * t + c * lateral;
      const h = (1.34 + variation * .16 + wobble * .08) * fade;
      kit.flameTongue(px, pz, Math.max(.21, radius * (.34 + variation * .15)), h, i * 1.73 + zone.id, (.75 + variation * .12) * fade, i % 7 === 0);
    }
    kit.lightAt(zone.id, (x + ex) * .5, (z + ez) * .5, FIRE, 7 * fade, 5.2);
    if (emit) {
      const t = (Math.floor(kit.time * 13) * .61803398875) % 1, px = x + (ex - x) * t, pz = z + (ez - z) * t;
      for (let i = 0; i < (kit.low ? 1 : 4); i++) kit.mote('spark', px, .25, pz, .08 * i, 1 + i * .3, .06, .04, .8 + i * .15, CORE);
      if (!kit.low) kit.mote('smoke', px, .55, pz, .12, .5, .05, .5, 1.25, SOOT);
    }
  }

  private firePool(zone: AbilityZoneSnapshot, emit: boolean, shimmer: boolean, frame: AbilityFrame): void {
    const kit = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, radius = zone.radius / UNIT;
    const elapsed = (zone.durationMs - zone.remainingMs) / 1000;
    const growth = Math.min(1, .25 + elapsed / .25), fade = Math.min(1, zone.remainingMs / 600);
    const meltdown = zone.ability === 'meltdown', n = kit.low ? (meltdown ? 7 : 9) : meltdown ? 20 : 24;
    if (!meltdown) kit.liquidFire(x, z, radius * growth, .55 * fade);
    for (let i = 0; i < n; i++) {
      const variation = .5 + .5 * Math.sin(i * 7.83 + zone.id * 3.17);
      const a = i * 2.3999632297 + zone.id * .71;
      // Meltdown is an open aura; Napalm has sparse inner folds and a thicker boiling rim.
      const edge = meltdown || i % 3 !== 0;
      const r = radius * growth * (edge ? .8 + variation * .12 : .18 + variation * .46);
      const wobble = kit.reducedMotion ? .5 : .5 + .5 * Math.sin(kit.time * 8 + i * 2.4);
      const h = (meltdown ? .4 + variation * .34 + wobble * .12 : .85 + variation * .55 + wobble * .22) * fade;
      const width = meltdown ? .24 + variation * .2 : .21 + variation * .18;
      kit.flameTongue(x + Math.cos(a) * r, z + Math.sin(a) * r,
        width, h, i * 2.17 + zone.id * .73, (meltdown ? .5 + variation * .12 : .75 + variation * .16) * fade);
    }
    if (meltdown) {
      const angle = frame.game?.player.angle ?? 0, mantle = kit.low ? 4 : 8;
      // Wreath the calves, backpack and shoulders; the hot core remains below the head.
      for (let i = 0; i < mantle; i++) {
        const variation = .5 + .5 * Math.sin(i * 8.17 + 2.1);
        const a = angle + Math.PI + (i / Math.max(1, mantle - 1) - .5) * 2.4;
        const r = .35 + variation * .12, h = .58 + variation * .22;
        const pulse = kit.reducedMotion ? 1 : .88 + Math.sin(kit.time * 11 + i * 1.4) * .12;
        const level = i % 3 === 0 ? .45 : .16;
        kit.draw('flame', x + Math.cos(a) * r, level + h * .5, z + Math.sin(a) * r,
          .21 + variation * .1, h * .5 * pulse, 1, i % 3 === 0 ? CORE : HOT, .55 * fade);
      }
      for (let side = -1; side <= 1; side += 2) {
        const px = x - Math.cos(angle) * .3 - Math.sin(angle) * side * .25;
        const pz = z - Math.sin(angle) * .3 + Math.cos(angle) * side * .25;
        kit.draw('flame', px, .94, pz, .19, .32, 1, HOT, .6 * fade);
      }
      kit.draw('spark', x - Math.cos(angle) * .35, .75, z - Math.sin(angle) * .35, .13, .2, 1, CORE, .3 * fade);
      kit.grade(.7 * fade);
    }
    kit.lightAt(zone.id, x, z, FIRE, (meltdown ? 6 : 8) * fade, Math.max(6, Math.min(8, radius * 1.8)));
    if (shimmer) kit.distort(x, z, radius, .004 * fade, .9, true);
    if (!meltdown && !kit.low) {
      // Small opaque-soot folds rise from the fuel's interior, leaving the edge and enemy heads open.
      for (let i = 0; i < 4; i++) {
        const a = i * 2.399963 + zone.id, r = radius * (.2 + i * .055);
        const rise = kit.reducedMotion ? .5 : (kit.time * .35 + i * .23) % 1;
        kit.draw('smoke', x + Math.cos(a) * r, .6 + rise * 1.5, z + Math.sin(a) * r,
          .5 + rise * .38, .5 + rise * .25, 1, SOOT, (.24 - rise * .08) * fade);
      }
    }
    if (emit) {
      const a = kit.time * 2.6 + zone.id, r = radius * .86;
      for (let i = 0; i < (kit.low ? 2 : meltdown ? 7 : 5); i++) {
        const ea = a + i * .48;
        kit.mote('spark', x + Math.cos(ea) * r, .22, z + Math.sin(ea) * r,
          Math.cos(ea) * .08, .85 + i * .19, Math.sin(ea) * .08, .035 + i * .005, .85 + i * .15, CORE);
      }
      if (!kit.low) {
        kit.mote('smoke', x + Math.cos(a + 2) * r, .35, z + Math.sin(a + 2) * r, .1, .55, .05, .5, 1.4, SOOT);
        if (meltdown) kit.mote('spark', x, .65, z, -.1, 1.2, .05, .03, .8, CORE);
      }
    }
  }

  clear(): void {
    for (const p of this.effects) p.live = false;
    for (const print of this.prints) print.live = false;
    this.next = 0; this.emission = 0; this.shimmer = 0; this.printCursor = 0; this.printClock = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.clear(); this.disposed = true;
  }
}

/** Construct the four Pyro signatures without adding GPU resources outside ElementKit. */
export function createPyroPresentation(kit: ElementKit): AbilityPresentation {
  return new PyroPresentation(kit);
}
