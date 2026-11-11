import type { AbilityEvent, AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { ElementKit } from '../ElementKit';
import { UNIT, type AbilityFrame, type AbilityPresentation } from '../types';

const FIRE = 0xff7a2e;
const CORE = 0xffc14b;
const SOOT = 0x101619;
const HOT = 0xff982f;
const FAN = ABILITY_CATALOG.flashfire.shape;
const FAN_RANGE = FAN.kind === 'cone' ? FAN.range / UNIT : 0;
const FAN_ARC = FAN.kind === 'cone' ? FAN.arcRadians : 0;
const TRANSIENT_CAPACITY = 24;
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

/** Pyro's flames stay low and broken so bodies, red warnings and aiming remain visible. */
class PyroPresentation implements AbilityPresentation {
  private readonly effects: Transient[] = Array.from({ length: TRANSIENT_CAPACITY }, () => ({
    live: false, kind: 'cone', age: 0, life: 1, x: 0, z: 0, tx: 0, tz: 0,
    angle: 0, radius: 0, range: 0, arc: 0,
  }));
  private next = 0;
  private emission = 0;
  private shimmer = 0;
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
        kit.flash(x, z, FIRE, 7, 4, 2, .2);
      } else if (event.phase === 'dash-end') {
        const tx = (event.targetX ?? x * UNIT) / UNIT, tz = (event.targetY ?? y) / UNIT;
        kit.burst(tx, .15, tz, 'pyro', 16, 1.4, .4);
        kit.decal(tx, tz, .48, SOOT, 3);
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
        const p = this.acquire('cone', x, z, .68);
        p.angle = event.angle ?? 0; p.range = (event.length ?? FAN_RANGE * UNIT) / UNIT;
        p.arc = event.arcRadians ?? FAN_ARC;
        kit.flash(x + Math.cos(p.angle) * 1.2, z + Math.sin(p.angle) * 1.2, FIRE, 10, 6, 4, .22);
        kit.distort(x + Math.cos(p.angle) * p.range * .5, z + Math.sin(p.angle) * p.range * .5, p.range * .55, .0045, .65, true);
        kit.camera(.13, p.angle);
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
        kit.decal(tx, tz, radius, SOOT, 9);
        kit.flash(tx, tz, FIRE, 13, Math.min(7, radius * 2), 5, .28);
        kit.distort(tx, tz, radius * 1.1, .004, .65, true);
        kit.camera(.19);
        const p = this.acquire('ignition', tx, tz, .48); p.radius = radius;
      }
      return;
    }
    if (event.ability === 'meltdown') {
      if (event.phase === 'impact' || event.phase === 'burst') {
        const radius = (event.radius ?? 130) / UNIT;
        const p = this.acquire('ignition', x, z, event.phase === 'burst' ? .38 : .65); p.radius = radius;
        kit.burst(x, .35, z, 'pyro', event.phase === 'burst' ? 18 : 40, 3, .65);
        kit.ring(x, z, radius, CORE, .5);
        kit.flash(x, z, FIRE, event.phase === 'burst' ? 5 : 14, 6, event.phase === 'burst' ? 3 : 6, .25);
        kit.distort(x, z, radius, .004, .6, true);
        if (event.phase === 'impact') kit.camera(.28);
      } else if (event.phase === 'end') {
        kit.burst(x, .2, z, 'pyro', 12, .8, .7);
        for (let i = 0; i < (kit.low ? 2 : 5); i++) kit.mote('smoke', x + Math.cos(i * 2.4) * .4, .5, z + Math.sin(i * 2.4) * .4, 0, .55, 0, .5, 1.3, SOOT);
      }
    }
  }

  private scorchFan(p: Transient): void {
    const n = this.kit.low ? 3 : 7;
    for (let i = 0; i < n; i++) {
      const a = p.angle + (i / Math.max(1, n - 1) - .5) * p.arc * .75;
      const r = p.range * .57;
      this.kit.decal(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, p.range * .23, SOOT, 5, a);
    }
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
      else if (p.kind === 'lob') this.lob(p);
      else if (p.kind === 'exhaust') this.exhaust(p, frame, emit);
      else this.ignition(p);
    }
    if (!frame.snapshot) return;
    for (const zone of frame.snapshot.zones) {
      if (zone.element !== 'pyro' || zone.remainingMs <= 0) continue;
      if (zone.shape === 'strip') this.fireStrip(zone, emit);
      else this.firePool(zone, emit, shimmer, frame);
    }
    if (frame.snapshot.rig === 'pyro' && frame.snapshot.overdrive.active && frame.game) {
      let count = 0;
      for (const bullet of frame.game.bullets) {
        if (bullet.kind !== 'player' || count++ >= (kit.low ? 8 : 30)) continue;
        const bx = bullet.x / UNIT, bz = bullet.y / UNIT, a = bullet.request.angle;
        kit.ribbon(bx - Math.cos(a) * .5, .85, bz - Math.sin(a) * .5, bx, .85, bz, CORE, .025, .5, false);
        if (emit && !kit.low) kit.mote('spark', bx, .85, bz, -.1 * Math.cos(a), .2, -.1 * Math.sin(a), .035, .32, FIRE);
      }
    }
  }

  private cone(p: Transient, emit: boolean): void {
    const kit = this.kit, grow = Math.min(1, .12 + p.age / .12);
    const fade = Math.max(0, 1 - Math.max(0, p.age - .12) / .56);
    const lanes = kit.low ? 3 : 9;
    // A broad rolling front, with overlapping lobes rather than a grid of isolated flames.
    for (let lane = 0; lane < lanes; lane++) {
      const side = lane / Math.max(1, lanes - 1) - .5;
      const a = p.angle + side * p.arc * .9;
      const variation = .5 + .5 * Math.sin(lane * 12.9898 + 3.7);
      const roll = kit.reducedMotion ? .5 : .5 + .5 * Math.sin(kit.time * 11 + lane * 1.8);
      const r = p.range * grow * (.86 + variation * .12);
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const width = (.46 + r * .09 + variation * .2) * Math.max(.25, fade);
      const height = (.9 + variation * .65 + roll * .25) * Math.max(.15, fade);
      kit.draw('flame', x, .06 + height * .5, z, width, height * .5, 1,
        Math.abs(side) < .23 ? HOT : FIRE, .6 * fade, 0, (variation - .5) * .22);
      if (!kit.low) {
        // The hot inner fold trails the lip of the front and leaves view gaps behind it.
        const trail = r * (.52 + variation * .15), innerHeight = height * .66;
        kit.draw('flame', p.x + Math.cos(a) * trail, .05 + innerHeight * .5, p.z + Math.sin(a) * trail,
          width * .78, innerHeight * .5, 1, HOT, .5 * fade, 0, -.12 + variation * .23);
        if (lane % 2 === 0) kit.draw('smoke', x - Math.cos(a) * .3, .6 + roll * .2, z - Math.sin(a) * .3,
          width * 1.1, .4, 1, SOOT, .17 * fade);
      }
    }
    // The narrow jet at the origin joins the two broad flame folds into one cone.
    const throat = 1.2 * grow, h = .65 * fade;
    kit.draw('flame', p.x + Math.cos(p.angle) * throat, .08 + h * .5, p.z + Math.sin(p.angle) * throat,
      .48 * fade, h * .5, 1, CORE, .55 * fade);
    if (emit && !kit.low) {
      const r = p.range * grow * .85, a = p.angle + Math.sin(p.age * 43) * p.arc * .35;
      kit.mote('smoke', p.x + Math.cos(a) * r, .55, p.z + Math.sin(a) * r,
        Math.cos(a) * .5, .65, Math.sin(a) * .5, .58, 1.25, SOOT);
      for (let i = 0; i < 3; i++) kit.mote('spark', p.x + Math.cos(a) * r, .35, p.z + Math.sin(a) * r,
        Math.cos(a) * (1.6 + i * .4), .8 + i * .3, Math.sin(a) * (1.6 + i * .4), .025 + i * .008, .8, CORE);
    }
  }

  private lob(p: Transient): void {
    const kit = this.kit, t = p.age / p.life;
    const x = p.x + (p.tx - p.x) * t, z = p.z + (p.tz - p.z) * t;
    const height = .85 * (1 - t) + Math.sin(t * Math.PI) * 2.3 + .15;
    const spin = kit.reducedMotion ? 0 : t * Math.PI * 3;
    kit.draw('solid', x, height, z, .14, .28, .14, 0x283d43, .95, spin, spin);
    kit.draw('solid', x, height + .055, z, .15, .035, .15, CORE, .85, spin, spin);
    kit.draw('spark', x, height + .12, z, .045, .06, 1, FIRE, .8);
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
      kit.ribbon(bx, .65, bz, bx - cx * 1.2 * fade, .35, bz - sz * 1.2 * fade, HOT, .1 * fade, .7, false);
      for (let i = 0; i < (kit.low ? 1 : 3); i++) {
        const behind = .2 + i * .32, h = (.7 - i * .12) * fade;
        kit.draw('flame', bx - cx * behind, .35 + h * .35, bz - sz * behind,
          (.25 + i * .04) * fade, h * .5, 1, i === 0 ? CORE : FIRE, (.75 - i * .1) * fade, 0, side * -.15);
      }
      if (emit) {
        kit.mote('spark', bx, .5, bz, -cx * 3, .65, -sz * 3, .035, .6, CORE);
        if (!kit.low) kit.mote('smoke', bx - cx * .6, .5, bz - sz * .6, -cx * .6, .35, -sz * .6, .3, .7, SOOT);
      }
    }
  }

  private ignition(p: Transient): void {
    const kit = this.kit, t = p.age / p.life;
    const r = p.radius * Math.min(1, .2 + t * 2), n = kit.low ? 5 : 18;
    for (let i = 0; i < n; i++) {
      const variation = .5 + .5 * Math.sin(i * 9.31 + 2.7);
      const a = (i + variation * .4) / n * Math.PI * 2;
      const h = (.7 + variation * .9) * (1 - t), width = (.28 + variation * .35) * (1 - t);
      kit.draw('flame', p.x + Math.cos(a) * r, .06 + h * .5, p.z + Math.sin(a) * r,
        width, h * .5, 1, i % 3 === 0 ? HOT : FIRE, .6 * (1 - t), 0, (variation - .5) * .3);
    }
  }

  private fireStrip(zone: AbilityZoneSnapshot, emit: boolean): void {
    const kit = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, ex = zone.x2 / UNIT, ez = zone.y2 / UNIT;
    const angle = Math.atan2(ez - z, ex - x), radius = zone.width / UNIT * .5;
    const fade = Math.min(1, zone.remainingMs / 350), points = kit.low ? 5 : 18;
    for (let i = 0; i < points; i++) {
      const variation = .5 + .5 * Math.sin(i * 13.7 + zone.id * 2.1);
      const t = (i + .25 + variation * .5) / points;
      const wobble = kit.reducedMotion ? .5 : .5 + .5 * Math.sin(kit.time * 9 + i * 2.4 + zone.id);
      // The two ragged edges lick upward at unequal heights; the central lane stays open.
      const lateral = (i % 2 ? 1 : -1) * radius * (.55 + variation * .28);
      const px = x + (ex - x) * t - Math.sin(angle) * lateral, pz = z + (ez - z) * t + Math.cos(angle) * lateral;
      const h = (.48 + variation * .52 + wobble * .2) * fade;
      kit.draw('flame', px, .045 + h * .5, pz, .22 + variation * .19, h * .5, 1,
        i % 5 === 0 ? HOT : FIRE, (.48 + variation * .18) * fade, 0, (variation - .5) * .2);
      if (!kit.low && i % 4 === 0) kit.draw('flame', px, .13, pz, .42, .13, 1, HOT, .35 * fade);
    }
    kit.lightAt(zone.id, (x + ex) * .5, (z + ez) * .5, FIRE, 4.5 * fade, 4.2);
    if (emit) {
      const t = (Math.floor(kit.time * 13) * .61803398875) % 1, px = x + (ex - x) * t, pz = z + (ez - z) * t;
      for (let i = 0; i < (kit.low ? 1 : 3); i++) kit.mote('spark', px, .25, pz, .08 * i, .8 + i * .3, .06, .025, .8 + i * .15, CORE);
      if (!kit.low) kit.mote('smoke', px, .38, pz, .12, .48, .05, .4, 1.25, SOOT);
    }
  }

  private firePool(zone: AbilityZoneSnapshot, emit: boolean, shimmer: boolean, frame: AbilityFrame): void {
    const kit = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, radius = zone.radius / UNIT;
    const elapsed = (zone.durationMs - zone.remainingMs) / 1000;
    const growth = Math.min(1, .25 + elapsed / .25), fade = Math.min(1, zone.remainingMs / 600);
    const meltdown = zone.ability === 'meltdown', n = kit.low ? 7 : meltdown ? 24 : 36;
    for (let i = 0; i < n; i++) {
      const variation = .5 + .5 * Math.sin(i * 7.83 + zone.id * 3.17);
      const a = i * 2.3999632297 + zone.id * .71;
      // Meltdown is an open aura; Napalm has sparse inner folds and a thicker boiling rim.
      const edge = meltdown || i % 4 !== 0;
      const r = radius * growth * (edge ? .79 + variation * .15 : .25 + variation * .35);
      const wobble = kit.reducedMotion ? .5 : .5 + .5 * Math.sin(kit.time * 8 + i * 2.4);
      const h = (.38 + variation * .55 + wobble * .22) * fade;
      const width = .24 + variation * .28;
      kit.draw('flame', x + Math.cos(a) * r, .04 + h * .5, z + Math.sin(a) * r,
        width, h * .5, 1, i % 6 === 0 ? HOT : FIRE, (.44 + variation * .16) * fade, 0, (variation - .5) * .26);
      if (!kit.low && edge && i % 5 === 0) {
        // Broad low folds stitch neighboring tongues together without filling the damage area.
        kit.draw('flame', x + Math.cos(a + .08) * r, .16, z + Math.sin(a + .08) * r,
          .55, .16, 1, HOT, .36 * fade);
      }
    }
    if (meltdown) {
      const angle = frame.game?.player.angle ?? 0, mantle = kit.low ? 4 : 10;
      // Wreath the calves, backpack and shoulders; the hot core remains below the head.
      for (let i = 0; i < mantle; i++) {
        const variation = .5 + .5 * Math.sin(i * 8.17 + 2.1);
        const a = angle + Math.PI + (i / Math.max(1, mantle - 1) - .5) * 2.4;
        const r = .31 + variation * .11, h = .48 + variation * .36;
        const pulse = kit.reducedMotion ? 1 : .88 + Math.sin(kit.time * 11 + i * 1.4) * .12;
        kit.draw('flame', x + Math.cos(a) * r, .26 + h * .5, z + Math.sin(a) * r,
          .19 + variation * .12, h * .5 * pulse, 1, i % 3 === 0 ? HOT : FIRE, .55 * fade, 0, (variation - .5) * .3);
      }
    }
    kit.lightAt(zone.id, x, z, FIRE, (meltdown ? 7 : 6) * fade, Math.min(7, radius * 1.8));
    if (shimmer) kit.distort(x, z, radius, .0027 * fade, .9, true);
    if (emit) {
      const a = kit.time * 2.6 + zone.id, r = radius * .86;
      for (let i = 0; i < (kit.low ? 1 : 4); i++) {
        const ea = a + i * .48;
        kit.mote('spark', x + Math.cos(ea) * r, .22, z + Math.sin(ea) * r,
          Math.cos(ea) * .08, .7 + i * .19, Math.sin(ea) * .08, .022 + i * .004, .85 + i * .15, CORE);
      }
      if (!kit.low) {
        kit.mote('smoke', x + Math.cos(a + 2) * r, .35, z + Math.sin(a + 2) * r, .1, .55, .05, .5, 1.4, SOOT);
        if (meltdown) kit.mote('spark', x, .65, z, -.1, 1.2, .05, .03, .8, CORE);
      }
    }
  }

  clear(): void {
    for (const p of this.effects) p.live = false;
    this.next = 0; this.emission = 0; this.shimmer = 0;
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
