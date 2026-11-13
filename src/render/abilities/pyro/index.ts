import { Vector3, type Object3D } from 'three';
import type { AbilityEvent, AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { ElementKit } from '../ElementKit';
import { UNIT, type AbilityFrame, type AbilityPresentation } from '../types';
import { impactBeat } from '../GraphicLanguage';

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
  lightId: number;
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

/** Four physical sources: a pressure jet, deck fuel, a liquid fire and a charged suit. */
class PyroPresentation implements AbilityPresentation {
  private readonly effects: Transient[] = Array.from({ length: TRANSIENT_CAPACITY }, (_, lightId) => ({
    live: false, lightId: 7100 + lightId, kind: 'cone', age: 0, life: 1, x: 0, z: 0, tx: 0, tz: 0,
    angle: 0, radius: 0, range: 0, arc: 0,
  }));
  private next = 0;
  private emission = 0;
  private shimmer = 0;
  private readonly prints: Footprint[] = Array.from({ length: 12 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0 }));
  private printCursor = 0;
  private printClock = 0;
  private disposed = false;
  private muzzle?: Object3D;
  private readonly source = new Vector3();

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
    kit.impact();
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
        // Landing splashes are ballistic liquid, never a ring of repeated fire stamps.
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
        const p = this.acquire('ignition', x, z, event.phase === 'burst' ? .38 : .65); p.radius = radius; p.angle = event.angle ?? 0;
        kit.burst(x, .35, z, 'pyro', event.phase === 'burst' ? 12 : 20, 3, .65);
        // The authoritative aura boundary is shared; the suit itself is the heat source.
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
    this.kit.impact();
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
      if (p.kind === 'cone') this.cone(p, emit, frame);
      else if (p.kind === 'lob') this.lob(p, emit);
      else if (p.kind === 'exhaust') this.exhaust(p, frame, emit);
      else this.ignition(p);
    }
    if (frame.snapshot?.rig === 'pyro' && frame.snapshot.overdrive.active && frame.game) {
      const player = frame.game.player;
      this.printClock -= dt;
      if (dt > 0 && Math.hypot(player.vx, player.vy) > 18 && this.printClock <= 0) {
        const print = this.prints[this.printCursor++ % this.prints.length], side = this.printCursor % 2 ? 1 : -1;
        print.live = true; print.age = 0; print.angle = Math.atan2(player.vy, player.vx);
        print.x = player.x / UNIT - Math.cos(print.angle) * .3 - Math.sin(print.angle) * side * .14;
        print.z = player.y / UNIT - Math.sin(print.angle) * .3 + Math.cos(print.angle) * side * .14;
        this.printClock = kit.low ? .28 : .16;
      }
    }
    for (const print of this.prints) {
      if (!print.live) continue;
      print.age += dt;
      if (print.age >= 1.5) { print.live = false; continue; }
      const fade = 1 - print.age / 1.5;
      kit.sustain();
      kit.draw('decal', print.x, .035, print.z, .52, .19, 1, 0x57240d, fade * .65, 0, -print.angle, 9);
      kit.directedFlame(print.x, .04, print.z, .20, .42, print.angle + Math.PI, .8, print.angle + print.x, fade * .48);
    }
    if (!frame.snapshot) { kit.impact(); return; }
    for (const zone of frame.snapshot.zones) {
      if (zone.element !== 'pyro' || zone.remainingMs <= 0) continue;
      if (zone.shape === 'strip') this.fireStrip(zone, emit);
      else this.firePool(zone, emit, shimmer, frame);
    }
    if (frame.snapshot.rig === 'pyro' && frame.snapshot.overdrive.active && frame.game) {
      kit.impact();
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
    kit.impact();
  }

  private cone(p: Transient, emit: boolean, frame: AbilityFrame): void {
    const kit = this.kit, grow = Math.min(1, .6 + p.age / .05);
    const fade = Math.max(0, 1 - Math.max(0, p.age - .09) / .28), hot = impactBeat(p.age);
    const c = Math.cos(p.angle), s = Math.sin(p.angle);
    if (!this.muzzle || !this.visibleSocket(this.muzzle, frame.marine)) this.muzzle = frame.marine ? this.findMuzzle(frame.marine) : undefined;
    if (this.muzzle) { frame.marine?.updateWorldMatrix(true, false); this.muzzle.getWorldPosition(this.source); }
    else this.source.set(p.x + c * .3, .95, p.z + s * .3);
    kit.sustain(p.age + .20);
    kit.fireFan(p.x, p.z, p.range * grow, p.angle, p.arc, fade * .85, this.source.y, this.source.x, this.source.z);
    // The first blast has expanding turbulent lobes from the authored explosion sequence.
    // Short cards overlap in depth; the exact ground cone stays in the boundary batch.
    if (p.age < .24) for (let i = 0; i < (kit.low ? 2 : 4); i++) {
      const t = .24 + i * .16, a = p.angle + (i % 2 ? -.15 : .15) * p.arc;
      const r = p.range * t, w = Math.min(p.range * .16, r * Math.sin(p.arc * .5) * .65);
      kit.draw('flame', p.x + Math.cos(a) * r, this.source.y + .16 + i * .12,
        p.z + Math.sin(a) * r, w, w * .72, 1, FIRE, fade * .82,
        0, 0, 328 + Math.min(24, Math.floor(p.age * 65) + i));
    }
    kit.lightAt(p.lightId, p.x + Math.cos(p.angle) * p.range * .34,
      p.z + Math.sin(p.angle) * p.range * .34, FIRE, (12 + 16 * hot) * fade, Math.max(8, p.range * 1.1));
    // Range curls are downstream, above the jet rather than a wall of ground flames.
    for (let i = 0; i < (kit.low ? 0 : 5); i++) {
      const seed = i * 2.731 + .71, a = p.angle + Math.sin(seed * 3.17) * p.arc * .36;
      const travel = kit.reducedMotion ? .5 : (kit.time * .6 + i * .237) % 1;
      const r = p.range * grow * (.73 + travel * .17);
      kit.draw('smoke', p.x + Math.cos(a) * r, 1.2 + travel * .7, p.z + Math.sin(a) * r,
        .45 + travel * .5, .42 + travel * .25, 1, SOOT, (.28 - travel * .1) * fade);
    }
    // Hot nozzle is attached to the discharge point, with a thin velocity-stretched core.
    kit.impact();
    kit.flowFlame(this.source.x, this.source.y, this.source.z,
      this.muzzle ? this.source.x + c * 1.05 : p.x + c * 1.8, this.source.y,
      this.muzzle ? this.source.z + s * 1.05 : p.z + s * 1.8,
      .14 + hot * .055, 7, fade * .96, true);
    if (emit && !kit.low) {
      const a = p.angle + Math.sin(p.age * 43) * p.arc * .3, r = p.range * grow * .82;
      kit.mote('smoke', p.x + Math.cos(a) * r, .8, p.z + Math.sin(a) * r,
        Math.cos(a) * 1.5, .55, Math.sin(a) * 1.5, .5, .8, SOOT);
      kit.mote('spark', p.x + c, .65, p.z + s, c * 7, .3, s * 7, .035, .6, CORE);
    }
  }

  private visibleSocket(socket: Object3D, root?: Object3D): boolean {
    for (let node: Object3D | null = socket; node; node = node.parent) {
      if (!node.visible) return false;
      if (node === root) return true;
    }
    return false;
  }

  private findMuzzle(node: Object3D): Object3D | undefined {
    if (!node.visible) return undefined;
    if (node.name === 'muzzle') return node;
    for (const child of node.children) { const socket = this.findMuzzle(child); if (socket) return socket; }
    return undefined;
  }

  private lob(p: Transient, emit: boolean): void {
    const kit = this.kit, t = p.age / p.life;
    kit.impact();
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
    kit.impact();
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
    kit.sustain(p.age);
    if (p.range > 0) {
      // A canister throws heavy fuel lobes: outward travel, then gravity returns them to the pool.
      for (let i = 0; i < (kit.low ? 4 : 9); i++) {
        const a = i * 2.399963, r = p.radius * t * (.55 + i % 3 * .12);
        const h = .08 + Math.sin(t * Math.PI) * (.6 + i % 4 * .18);
        kit.fuelDroplet(p.x + Math.cos(a) * r, h, p.z + Math.sin(a) * r,
          .09 + i % 3 * .025 + fade * .045, .14 + i % 4 * .035 + fade * .1,
          -a + t * .35, i * 1.73, fade * .9);
        if (!kit.low) kit.directedFlame(p.x + Math.cos(a) * r, h, p.z + Math.sin(a) * r,
          .14, .38 * fade, a, 1.5, i, fade * .6);
      }
      kit.directedFlame(p.x, .12, p.z, .42 * fade, 2.2 * fade, 0, .15, 3, fade * .9, true);
    } else {
      // Meltdown activation vents upward at the backpack; no radial carpet of fires.
      kit.impact();
      for (let i = 0; i < (kit.low ? 2 : 3); i++) {
        const side = i - 1, hot = impactBeat(p.age);
        kit.directedFlame(p.x - Math.cos(p.angle) * .22 - Math.sin(p.angle) * side * .37, .9,
          p.z - Math.sin(p.angle) * .22 + Math.cos(p.angle) * side * .37, .27 + hot * .12,
          (1.8 + hot * .8 - i * .17) * fade, side, .35, i * 2.73, fade * .96, true);
      }
    }
  }

  private fireStrip(zone: AbilityZoneSnapshot, emit: boolean): void {
    const kit = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, ex = zone.x2 / UNIT, ez = zone.y2 / UNIT;
    const angle = Math.atan2(ez - z, ex - x), radius = zone.width / UNIT * .5;
    const c = Math.cos(angle), s = Math.sin(angle), length = Math.hypot(ex - x, ez - z);
    const fade = Math.min(1, zone.remainingMs / 350), points = Math.min(kit.low ? 5 : 8, Math.max(4, Math.ceil(length / .85)));
    kit.sustain((zone.durationMs - zone.remainingMs) / 1000);
    kit.draw('decal', (x + ex) * .5, .045, (z + ez) * .5, length * .5, radius * .42, 1, FIRE, .68 * fade, 0, -angle, 9);
    for (let i = 0; i <= points; i++) {
      const variation = .5 + .5 * Math.sin(i * 13.7 + zone.id * 2.1), t = .025 + .95 * i / points;
      const lateral = Math.sin(i * 2.67 + zone.id) * radius * .25;
      const px = x + (ex - x) * t - s * lateral, pz = z + (ez - z) * t + c * lateral;
      // Short flames are swept by dash momentum over one continuous glossy fuel stroke.
      kit.directedFlame(px, .045, pz, .16 + variation * .08,
        (.25 + variation * .30) * fade, angle, 1.5, i * 1.73 + zone.id, (.6 + variation * .14) * fade, i % 7 === 0);
    }
    kit.lightAt(zone.id, (x + ex) * .5, (z + ez) * .5, FIRE, 4 * fade, 4);
    if (emit) {
      const t = (Math.floor(kit.time * 13) * .61803398875) % 1;
      const px = x + (ex - x) * t, pz = z + (ez - z) * t;
      kit.mote('spark', px, .12, pz, c * .7, .4, s * .7, .025, .5, CORE);
      if (!kit.low) kit.mote('smoke', px, .18, pz, c * .2, .3, s * .2, .2, .8, SOOT);
    }
  }

  private firePool(zone: AbilityZoneSnapshot, emit: boolean, shimmer: boolean, frame: AbilityFrame): void {
    const kit = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, radius = zone.radius / UNIT;
    const elapsed = (zone.durationMs - zone.remainingMs) / 1000;
    const growth = Math.min(1, .25 + elapsed / .25), fade = Math.min(1, zone.remainingMs / 600);
    if (zone.ability === 'meltdown') {
      this.meltdown(zone, x, z, fade, frame, emit);
      if (shimmer) {
        const player = frame.game?.player;
        const angle = player && Math.hypot(player.vx, player.vy) > 18
          ? Math.atan2(player.vy, player.vx) : player?.angle ?? 0;
        kit.distort(x - Math.cos(angle) * .65, z - Math.sin(angle) * .65, .7, .0022 * fade, .55, true);
      }
      return;
    }
    kit.sustain(elapsed);
    kit.liquidFire(x, z, radius * growth, .78 * fade);
    // Fuel burns at the ragged edge, with two taller interior vents. The center
    // remains open deck between pockets rather than an opaque orange carpet.
    const tongues = kit.low ? 4 : 8;
    for (let i = 0; i < tongues; i++) {
      const a = i * 2.399963 + zone.id * .71;
      const variation = .5 + .5 * Math.sin(i * 7.83 + zone.id * 3.17);
      const r = radius * growth * (i < 2 ? .22 + i * .18 : .74 + variation * .13);
      kit.directedFlame(x + Math.cos(a) * r, .06, z + Math.sin(a) * r,
        .23 + variation * .13, (i < 2 ? 1.8 + variation * .85 : .6 + variation * .8) * fade,
        a, .22, i * 2.17 + zone.id, (i < 2 ? .72 : .60) * fade);
    }
    // A single loose smoke column rises from the hottest interior fuel pocket.
    for (let i = 0; i < (kit.low ? 1 : 4); i++) {
      const rise = kit.reducedMotion ? .5 : (kit.time * .3 + i * .23) % 1;
      kit.draw('smoke', x + Math.sin(i * 2.4 + rise) * radius * .14, 1 + rise * 2.1,
        z + Math.cos(i * 2.4 + rise) * radius * .12,
        .45 + rise * .65, .55 + rise * .5, 1, SOOT, (.3 - rise * .09) * fade);
    }
    kit.lightAt(zone.id, x, z, FIRE, 6 * fade, Math.max(6, Math.min(8, radius * 1.8)));
    if (shimmer) kit.distort(x, z, radius, .003 * fade, .9, true);
    if (emit && !kit.low) kit.mote('spark', x, .2, z, .08, 1.4, .04, .035, .9, CORE);
  }

  private meltdown(zone: AbilityZoneSnapshot, x: number, z: number, fade: number, frame: AbilityFrame, emit: boolean): void {
    const kit = this.kit, angle = frame.game?.player.angle ?? 0, c = Math.cos(angle), s = Math.sin(angle);
    const move = frame.game?.player, moving = move && Math.hypot(move.vx, move.vy) > 18;
    const exhaustAngle = moving ? Math.atan2(-move.vy, -move.vx) : angle + Math.PI;
    const pulse = kit.reducedMotion ? 1 : .88 + Math.sin(kit.time * 8) * .12;
    // Unequal rear flames rise above the suit without widening the floor aura.
    // Charged seams and shoulder vents retain their attached silhouette priority.
    kit.impact();
    for (let side = -1; side <= 1; side += 2) {
      const bx = x - c * .3 - s * side * .4, bz = z - s * .3 + c * side * .4;
      kit.draw('solid', bx, 1.36, bz, .28, .22, .34, 0xd95b16, (.9 + pulse * .1) * fade, -angle);
      kit.draw('spark', bx, side < 0 ? 1.4 : 1.3, bz, .15, .17, 1, CORE, .96 * fade);
      const height = side < 0 ? 2.4 : 1.8, base = side < 0 ? 1.3 : 1.25;
      kit.directedFlame(bx, base, bz, side < 0 ? .52 : .43, height * (.95 + pulse * .05),
        exhaustAngle, moving ? 1.1 : .5, side + zone.id, .9 * fade, true);
      if (!kit.low) kit.directedFlame(bx - c * .18, 1.08, bz - s * .18, .28, 2.6,
        exhaustAngle, .65, side * 2.7, .78 * fade);
    }
    // A low attached mantle wraps the armor flanks, distinct from the tall rear vents.
    // Its narrow shoulders leave the cyan helmet and central aiming silhouette exposed.
    const flanks = kit.low ? 1 : 2;
    for (let i = 0; i < flanks; i++) {
      const side = i === 0 ? -1 : 1;
      kit.directedFlame(x - c * .04 - s * side * .27, .12,
        z - s * .04 + c * side * .27, .23, 1.45, exhaustAngle, .2,
        zone.id + side * 8.1, .68 * fade);
    }
    kit.draw('solid', x - c * .3, 1.12, z - s * .3, .22, .55, .36, 0xb9450e, .94 * fade, -angle);
    // Short heated armor seams describe shoulders, chest and weapon, leaving the helmet open.
    for (let side = -1; side <= 1; side += 2) {
      kit.ribbon(x + c * .08 - s * side * .25, 1.25, z + s * .08 + c * side * .25,
        x + c * .18 - s * side * .14, 1.02, z + s * .18 + c * side * .14, HOT, .035, .9 * fade, false);
      kit.ribbon(x - c * .15 - s * side * .34, 1.5, z - s * .15 + c * side * .34,
        x + c * .04 - s * side * .29, 1.42, z + s * .04 + c * side * .29, CORE, .025, .84 * fade, false);
    }
    kit.grade(.65 * fade);
    kit.lightAt(zone.id, x, z, FIRE, 5 * fade, 6);
    if (emit) {
      // Bounded ember storm is attached to the moving suit, never a floor aura fill.
      for (let i = 0; i < (kit.low ? 1 : 3); i++) {
        const a = exhaustAngle + (i - 1) * .7, side = i - 1;
        kit.mote('spark', x - c * .3 - s * side * .22, 1.05 + i * .22, z - s * .3 + c * side * .22,
          Math.cos(a) * (.8 + i * .3), .65 + i * .35, Math.sin(a) * (.8 + i * .3), .025 + i * .008, .65, CORE);
      }
      if (!kit.low) kit.mote('smoke', x - c * .35, 1.2, z - s * .35,
        Math.cos(exhaustAngle) * .4, .45, Math.sin(exhaustAngle) * .4, .23, .9, SOOT);
    }
  }

  clear(): void {
    for (const p of this.effects) p.live = false;
    for (const print of this.prints) print.live = false;
    this.next = 0; this.emission = 0; this.shimmer = 0; this.printCursor = 0; this.printClock = 0; this.muzzle = undefined;
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
