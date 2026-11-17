import { Vector3, type Object3D } from 'three';
import type { AbilityEvent, AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { ElementKit } from '../ElementKit';
import { UNIT, type AbilityFrame, type AbilityPresentation } from '../types';
import { authoredVariation, impactBeat } from '../GraphicLanguage';
import { FxMode, type FxSlot } from '../FlagshipFx';

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
  kind: 'cone' | 'lob' | 'exhaust' | 'ignition' | 'cooling';
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
  /** VFX13 fire volume slices owned by a Flashfire cone (fixed three, reused). */
  slices: (FxSlot | undefined)[];
  sliceSeeds: number[];
};

/** Four physical sources: a pressure jet, deck fuel, a liquid fire and a charged suit. */
class PyroPresentation implements AbilityPresentation {
  private readonly effects: Transient[] = Array.from({ length: TRANSIENT_CAPACITY }, (_, lightId) => ({
    live: false, lightId: 7100 + lightId, kind: 'cone', age: 0, life: 1, x: 0, z: 0, tx: 0, tz: 0,
    angle: 0, radius: 0, range: 0, arc: 0, slices: [undefined, undefined, undefined], sliceSeeds: [-1, -1, -1],
  }));
  private readonly surfaces = Array.from({ length: 32 }, () => ({ id: -1, part: 0, seen: false, seed: -1, slot: undefined as FxSlot | undefined }));
  private next = 0;

  /** Retained procedural surface; refreshed from native snapshots, no per-frame meshes/materials. */
  private surface(id: number, part: number, x: number, z: number, range: number, angle: number, arc: number, h0: number, h1: number, intensity: number, fuel = false, stripLength = -1, force?: FxMode): void {
    let owner: (typeof this.surfaces)[number] | undefined;
    for (const candidate of this.surfaces) if (candidate.id === id && candidate.part === part) { owner = candidate; break; }
    if (!owner) for (const candidate of this.surfaces) if (candidate.id === -1) { owner = candidate; break; }
    if (!owner) return;
    owner.id = id; owner.part = part; owner.seen = true;
    const mode = force ?? (stripLength >= 0 ? FxMode.FuelStrip : fuel ? FxMode.Fuel : FxMode.Fire);
    let slot = owner.slot;
    if (!slot?.live || slot.seed !== owner.seed || slot.mode !== mode || slot.life < 1000) {
      slot = owner.slot = this.kit.fx.spawn(mode, x, z, 1e6); owner.seed = slot.seed;
    }
    slot.x = x; slot.z = z; slot.mx = x; slot.mz = z;
    slot.range = stripLength >= 0 ? stripLength : range; slot.angle = angle; slot.arc = arc; slot.inner = stripLength >= 0 ? range : 0;
    slot.h0 = h0; slot.h1 = h1; slot.param = part % 2 ? .45 : .12;
    // Hold the hot portion of the Fire envelope; flow still uses the presentation clock.
    slot.age = .09; slot.intensity = intensity;
    if (fuel) slot.param = intensity;
    else if (id < 0 || range < 1.5) slot.param = -1;
    if (mode === FxMode.Tongues) { slot.param = intensity; slot.intensity = 1; slot.angle = angle; }
  }
  private emission = 0;
  private shimmer = 0;
  private readonly prints: Footprint[] = Array.from({ length: 12 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0 }));
  private printCursor = 0;
  private printClock = 0;
  private disposed = false;
  private suitAngle = 0;
  private muzzle?: Object3D;
  private readonly source = new Vector3();
  private suit?: Object3D;
  private readonly shoulders: (Object3D | undefined)[] = [undefined, undefined];
  private readonly vent = new Vector3();
  private readonly locateVents = (node: Object3D): void => {
    const name = node.name.replace(/\./g, '');
    if (name === 'upper_armL') this.shoulders[0] = node;
    if (name === 'upper_armR') this.shoulders[1] = node;
  };

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
        const p = this.acquire('cone', x, z, 1.35);
        p.angle = event.angle ?? 0; p.range = (event.length ?? FAN_RANGE * UNIT) / UNIT;
        p.arc = event.arcRadians ?? FAN_ARC;
        const c = Math.cos(p.angle), s = Math.sin(p.angle);
        // Volume: a low hot sheet, the rolling body and a smoke crown. Low keeps the body.
        const layers = kit.low ? 1 : 3;
        for (let i = 0; i < 3; i++) {
          if (i >= layers) { p.slices[i] = undefined; continue; }
          const layer = kit.low ? .35 : i * .5;
          const slot = kit.fx.spawn(FxMode.Fire, x, z, layer > .9 ? 1.35 : .62);
          slot.angle = p.angle; slot.arc = p.arc; slot.range = p.range; slot.inner = .07;
          slot.h0 = .95 + i * .08; slot.h1 = .5 + i * .4; slot.param = layer;
          slot.mx = x + c * .55; slot.my = .95; slot.mz = z + s * .55;
          p.slices[i] = slot; p.sliceSeeds[i] = slot.seed;
        }
        const scorch = kit.fx.spawn(FxMode.Scorch, x, z, 7);
        scorch.angle = p.angle; scorch.arc = p.arc; scorch.range = p.range; scorch.inner = .06; scorch.h0 = scorch.h1 = .034;
        kit.flash(x + c * 1.2, z + s * 1.2, HOT, 30, 9, 4, .34);
        kit.flash(x + c * p.range * .6, z + s * p.range * .6, FIRE, 18, p.range, 3, .45);
        kit.distort(x + c * p.range * .5, z + s * p.range * .5, p.range * .55, .0055, .8, true);
        kit.camera(.24, p.angle);
        kit.exposureFlash(.12);
        // Embers thrown forward through the cone (inside the arc), falling under gravity.
        for (let i = 0, n = kit.low ? 8 : 30; i < n; i++) {
          const v = authoredVariation(i * 1.37 + 2.1), a = p.angle + (authoredVariation(i * 2.71, 3) - .5) * p.arc * .8;
          const speed = p.range * (.9 + v * 1.1);
          kit.mote('spark', x + c * .6, .85 + v * .3, z + s * .6, Math.cos(a) * speed, .6 + v * 1.4, Math.sin(a) * speed,
            .022 + v * .02, .45 + v * .5, i % 3 ? HOT : CORE);
        }
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
        // Hard burst: a short fireball volume inside the exact radius, then the pool takes over.
        const ball = kit.fx.spawn(FxMode.Fire, tx, tz, .45);
        ball.range = radius * .85; ball.arc = Math.PI * 2; ball.h0 = .5; ball.h1 = 1.4; ball.param = .25; ball.intensity = 1.1;
        kit.exposureFlash(.12);
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
        if (event.phase === 'burst') {
          // Kill-burst: a small compact fireball, not a full-radius sheet.
          const ball = kit.fx.spawn(FxMode.Fire, x, z, .42);
          ball.range = Math.min(radius, 1.3); ball.arc = Math.PI * 2; ball.h0 = .3; ball.h1 = 1.1;
          ball.param = .2; ball.intensity = .9;
        }
        // The authoritative aura boundary is shared; the suit itself is the heat source.
        kit.flash(x, z, FIRE, event.phase === 'burst' ? 5 : 14, 6, event.phase === 'burst' ? 3 : 6, .25);
        kit.distort(x, z, radius, .004, .6, true);
        // VFX15: the rupture (heat column, molten floor) lives in OverdrivePayoff; no ring.
        void radius;
      } else if (event.phase === 'end') {
        const cooling=this.acquire('cooling',x,z,.65);cooling.angle=this.suitAngle;
        kit.ring(x, z, .9, HOT, .35, true);
        kit.burst(x, .2, z, 'pyro', 12, .8, .7);
        for (let i = 0; i < (kit.low ? 2 : 5); i++) kit.mote('smoke', x + Math.cos(i * 2.4) * .4, .5, z + Math.sin(i * 2.4) * .4, 0, .55, 0, .5, 1.3, SOOT);
      }
    }
  }

  update(frame: AbilityFrame): void {
    this.kit.impact();
    if (this.disposed || !frame.visible) return;
    const kit = this.kit, dt = Math.max(0, frame.dt);
    for (const surface of this.surfaces) surface.seen = false;
    this.emission += dt; this.shimmer += dt;
    const emit = dt > 0 && this.emission >= (kit.low ? .15 : .065);
    const shimmer = dt > 0 && this.shimmer >= .32;
    if (emit) this.emission = 0;
    if (shimmer) this.shimmer = 0;
    for (const p of this.effects) {
      if (!p.live) continue;
      p.age += dt;
      if (p.age >= p.life) { p.live = false; continue; }
      if (p.kind === 'cone') this.cone(p, emit, frame);
      else if (p.kind === 'lob') this.lob(p, emit);
      else if (p.kind === 'exhaust') this.exhaust(p, frame, emit);
      else if (p.kind === 'cooling') this.cooling(p);
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
      kit.draw('decal', print.x, .035, print.z, .64, .22, 1, 0x231b16, fade * .58, 0, -print.angle, 9);
      kit.directedFlame(print.x, .04, print.z, .16, .36, print.angle + Math.PI, 1.1, print.angle + print.x, fade * .42);
    }
    if (!frame.snapshot) {
      for (const surface of this.surfaces) { if (surface.slot && surface.slot.seed === surface.seed) surface.slot.live = false; surface.id = -1; surface.slot = undefined; }
      kit.impact(); return;
    }
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
    for (const surface of this.surfaces) if (!surface.seen && surface.id !== -1) {
      if (surface.slot && surface.slot.seed === surface.seed) surface.slot.live = false;
      surface.id = -1; surface.slot = undefined;
    }
    kit.impact();
  }

  private cone(p: Transient, emit: boolean, frame: AbilityFrame): void {
    const kit = this.kit, hot = impactBeat(p.age);
    const c = Math.cos(p.angle), s = Math.sin(p.angle);
    if (!this.muzzle || !this.visibleSocket(this.muzzle, frame.marine)) this.muzzle = frame.marine ? this.findMuzzle(frame.marine) : undefined;
    if (this.muzzle) { frame.marine?.updateWorldMatrix(true, false); this.muzzle.getWorldPosition(this.source); }
    else this.source.set(p.x + c * .55, .95, p.z + s * .55);
    for (let i = 0; i < p.slices.length; i++) {
      const slot = p.slices[i];
      if (slot?.live && slot.seed === p.sliceSeeds[i] && slot.mode === FxMode.Fire) {
        slot.mx = this.source.x; slot.my = this.source.y; slot.mz = this.source.z; slot.h0 = this.source.y;
      }
    }
    const fade = Math.max(0, 1 - Math.max(0, p.age - .12) / .4);
    kit.impact();
    // Compact white-yellow muzzle core, only for the first beats.
    if (p.age < .2) {
      const k = 1 - p.age / .2;
      kit.draw('spark', this.source.x + c * .15, this.source.y, this.source.z + s * .15, .5 * k + .14, .36 * k + .1, 1, CORE, k);
      kit.draw('spark', this.source.x + c * .4, this.source.y, this.source.z + s * .4, .5 * k, .14 * k, 1, 0xffd27a, .8 * k, 0, -p.angle);
    }
    kit.lightAt(p.lightId, p.x + c * p.range * .4, p.z + s * p.range * .4, FIRE, (14 + 18 * hot) * fade, Math.max(8, p.range * 1.2));
    if (emit && !kit.low && p.age < .5) {
      const a = p.angle + Math.sin(p.age * 43) * p.arc * .3, r = p.range * (.5 + (p.age * 3.1) % .4);
      kit.mote('spark', p.x + Math.cos(a) * r, .5, p.z + Math.sin(a) * r, Math.cos(a) * 2, 1.4, Math.sin(a) * 2, .03, .8, HOT);
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
    // Landing marker: thin element outline at the exact radius, filling with flight time.
    kit.outline(p.tx, p.tz, p.radius, FIRE, .38, t);
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
      this.surface(-100 - p.lightId, side < 0 ? 0 : 1, bx, bz, 1.2 * fade,
        p.angle + Math.PI, .7, .65, .22, fade * .85);
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
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1, hot = impactBeat(p.age);
        kit.directedFlame(p.x - Math.cos(p.angle) * .22 - Math.sin(p.angle) * side * .37, .9,
          p.z - Math.sin(p.angle) * .22 + Math.cos(p.angle) * side * .37, .23 + hot * .09,
          (.85 + hot * .5 - i * .16) * fade, side, .65, i * 2.73, fade * .90, true);
      }
    }
  }

  private cooling(p: Transient): void {
    const kit=this.kit,t=p.age/p.life,c=Math.cos(p.angle),s=Math.sin(p.angle);
    kit.sustain(p.age+.4);
    for(let i=0;i<(kit.low?1:3);i++){
      const side=i-1;
      kit.draw('smoke',p.x-c*.3-s*side*.3,.9+t*.85,p.z-s*.3+c*side*.3,
        .23+t*.15,.30+t*.14,1,0xa1cad7,(1-t)*.38,0,0,64+i*17);
    }
  }

  private fireStrip(zone: AbilityZoneSnapshot, emit: boolean): void {
    const kit = this.kit, x = zone.x / UNIT, z = zone.y / UNIT, ex = zone.x2 / UNIT, ez = zone.y2 / UNIT;
    const angle = Math.atan2(ez - z, ex - x), radius = zone.width / UNIT * .5;
    const c = Math.cos(angle), s = Math.sin(angle), length = Math.hypot(ex - x, ez - z);
    const fade = Math.min(1, zone.remainingMs / 350), points = Math.min(kit.low ? 5 : 8, Math.max(4, Math.ceil(length / .85)));
    kit.sustain((zone.durationMs - zone.remainingMs) / 1000);
    // One connected native-width strip avoids a row of circular fire stamps.
    this.surface(zone.id, 0, x, z, radius, angle, 0, .038, .038, fade * .85, true, length);
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
    const fade = Math.min(1, zone.remainingMs / 600);
    if (zone.ability === 'meltdown') {
      this.meltdown(zone, x, z, fade, frame, emit);
      if (shimmer) {
        const player = frame.game?.player;
        const angle = player && Math.hypot(player.vx, player.vy) > 18
          ? Math.atan2(player.vy, player.vx) : player?.angle ?? 0;
        kit.distort(x - Math.cos(angle) * .40, z - Math.sin(angle) * .40, 1.05, .0028 * fade, .45, true);
      }
      return;
    }
    kit.sustain(elapsed);
    // Two irregular depth layers share the exact native circular footprint.
    this.surface(zone.id, 0, x, z, radius, 0, Math.PI * 2, .035, .035, fade, true);
    // VFX15: eight standing procedural tongues with height (one draw), growing in after the burst.
    const grow = Math.min(1, Math.max(0, (elapsed - .05) / .3));
    this.surface(zone.id, 1, x, z, radius * .9, (zone.id * .371) % 1, 0, .03, 1.9, fade * grow * (.9 + .1 * Math.sin(kit.time * 7 + zone.id)), false, -1, FxMode.Tongues);
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
    const age = (zone.durationMs-zone.remainingMs)/1000;
    this.suitAngle=angle;
    if (frame.marine !== this.suit) {
      this.suit=frame.marine;this.shoulders.fill(undefined);this.suit?.traverse(this.locateVents);
    }
    this.suit?.updateWorldMatrix(true, true);
    // Short unequal exhaust curls stay close to the heated shoulder hardware.
    // Charged seams and shoulder vents retain their attached silhouette priority.
    kit.impact();
    for (let side = -1; side <= 1; side += 2) {
      const shoulder=this.shoulders[side<0?0:1];
      if(shoulder)this.vent.setFromMatrixPosition(shoulder.matrixWorld);
      const bx = shoulder?this.vent.x-c*.14:x-c*.3-s*side*.48;
      const bz = shoulder?this.vent.z-s*.14:z-s*.3+c*side*.48;
      const base = shoulder?this.vent.y:side<0?1.3:1.25;
      kit.impact();
      kit.draw('solid', bx, base+.06, bz, .32, .20, .35, 0xd95b16, (.9 + pulse * .1) * fade, -angle);
      kit.draw('spark', bx, base+.1, bz, .18, .14, 1, CORE, .96 * fade);
      kit.sustain(age);
      this.surface(zone.id, side < 0 ? 0 : 1, bx, bz, side < 0 ? .95 : .72,
        exhaustAngle + side * .32, 1.1, base, base + 1.1, .95 * fade);
      if (!kit.low) {
        // Replace the long parallel backpack tongue with a small moving ember.
        const turn = kit.reducedMotion ? side : kit.time * 4 + side * 1.7;
        kit.draw('spark', bx - c * .25 + Math.cos(turn) * .12, base + .18 + Math.sin(turn) * .14,
          bz - s * .25 + Math.sin(turn) * .12, .028, .052, 1, HOT, .72 * fade);
      }
    }
    // Low short flank fire and small embers surround the suit without a horn crown.
    // Its narrow shoulders leave the cyan helmet and central aiming silhouette exposed.
    kit.sustain(age);
    kit.impact();
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
      kit.sustain(age);
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
    for (const surface of this.surfaces) { if (surface.slot && surface.slot.seed === surface.seed) surface.slot.live = false; surface.id = -1; surface.slot = undefined; }
    for (const p of this.effects) p.live = false;
    for (const print of this.prints) print.live = false;
    this.next = 0; this.emission = 0; this.shimmer = 0; this.printCursor = 0; this.printClock = 0; this.muzzle = undefined; this.suit=undefined;this.shoulders.fill(undefined); this.suitAngle=0;
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
