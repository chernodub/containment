import { Vector3, type Object3D } from 'three';
import type { AbilityEvent, AbilityLinkSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, isContactJoint, type AbilityFrame, type AbilityPresentation } from '../types';
import { FxMode, type FxSlot } from '../FlagshipFx';
import { MarineTimeEcho } from './MarineTimeEcho';
import { NativeMarineEchoes } from './NativeMarineEchoes';

const VIOLET = ELEMENT_COLORS.arc;
const WHITE = 0xf2ecff;
const STEEL = 0x34414d;
const TAU = Math.PI * 2;
const NO_LINKS: readonly AbilityLinkSnapshot[] = [];
const NO_DEPLOYABLES: readonly DeployableSnapshot[] = [];
type Discharge = { sx: number; sz: number; sy: number; ty: number; victimId: number; x: number; z: number; live: boolean; age: number; delay: number; life: number; contactFrames: number; fired: boolean; seed: number };
type PylonState = { id: number; health: number; flash: number; seen: boolean };
type Blink = { live: boolean; x: number; z: number; angle: number; age: number };
type Bolt = { live: boolean; x: number; z: number; tx: number; tz: number; age: number };
type Echo = { live: boolean; x: number; z: number; angle: number; age: number; articulated: boolean; native: boolean; pose: Float32Array; gunX: number; gunY: number; gunZ: number };
type ShotEcho = { live: boolean; x: number; y: number; z: number; angle: number; age: number; dx: number; dz: number };
type Front = { live: boolean; x: number; z: number; radius: number; age: number; life: number; reverse: boolean; time: boolean };

/** Heavy violet-white discharges, grounded machinery and cool time-dilation language. */
class ArcPresentation implements AbilityPresentation {
  private discharges: Discharge[] = Array.from({ length: 48 }, () => ({ sx: 0, sz: 0, sy: .95, ty: .75, victimId: -1, live: false, x: 0, z: 0, age: 0, delay: 0, life: .55, contactFrames: 0, fired: false, seed: 0 }));
  private pylons: PylonState[] = Array.from({ length: 8 }, () => ({ id: -1, health: 0, flash: 0, seen: false }));
  private blinks: Blink[] = Array.from({ length: 6 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0 }));
  private bolts: Bolt[] = Array.from({ length: 6 }, () => ({ live: false, x: 0, z: 0, tx: 0, tz: 0, age: 0 }));
  private fronts: Front[] = Array.from({ length: 12 }, () => ({ live: false, x: 0, z: 0, radius: 1, age: 0, life: 1, reverse: false, time: false }));
  private echoes: Echo[] = Array.from({ length: 1 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0, articulated: false, native: false, pose: MarineTimeEcho.pose(), gunX: 0, gunY: 0, gunZ: 0 }));
  private readonly marineEcho = new MarineTimeEcho();
  private readonly nativeEchoes: NativeMarineEchoes;
  private readonly shotEchoes: ShotEcho[] = Array.from({ length: 24 }, () => ({ live: false, x: 0, y: 0, z: 0, angle: 0, age: 0, dx: 0, dz: 0 }));
  private nextShot = 0;
  private shotsObserved = 0;
  private shotBaseline = false;
  private echoAge = 0;
  private overclockAge = 0;
  private readonly start = new Vector3();
  private readonly end = new Vector3();
  private muzzle?: Object3D;
  private readonly contactBones = new WeakMap<Object3D, Object3D | null>();
  private nextDischarge = 0;
  private nextBlink = 0;
  private chainAt = -100;
  private chainHop = 0;
  private emissionAge = 0;
  private nextBolt = 0;
  private nextFront = 0;
  private dashLive = false;
  private dashX = 0;
  private dashZ = 0;
  private timeField?: FxSlot;
  private timeFieldSeed = -1;
  private disposed = false;

  constructor(private readonly kit: ElementKit) { this.nativeEchoes = new NativeMarineEchoes(kit.root); }

  event(event: AbilityEvent, x: number, y: number): void {
    if (this.disposed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const k = this.kit, px = x / UNIT, pz = y / UNIT;
    k.impact();
    if (event.phase === 'denied' || event.phase === 'ready' || event.phase === 'overdrive-ready') return;
    if (event.ability === 'static-step') {
      if (event.phase === 'dash-start') {
        this.dashX = px; this.dashZ = pz; this.dashLive = true;
        this.blink(px, pz, event.angle ?? 0);
        k.burst(px, .9, pz, 'arc', 12, 1.6, .3);
        k.flash(px, pz, WHITE, 8, 4.5, 3, .1);
      } else if (event.phase === 'dash-end') {
        const tx=(event.targetX??x)/UNIT,tz=(event.targetY??y)/UNIT;
        if (this.dashLive) {
          const bolt = this.bolts[this.nextBolt++ % this.bolts.length];
          bolt.live = true; bolt.x = this.dashX; bolt.z = this.dashZ; bolt.tx = tx; bolt.tz = tz; bolt.age = 0;
          const dx = tx - this.dashX, dz = tz - this.dashZ;
          const trail = k.fx.spawn(FxMode.Wake, this.dashX, this.dashZ, .2);
          trail.angle = Math.atan2(dz, dx); trail.range = Math.hypot(dx, dz);
          trail.inner = .16; trail.h0 = trail.h1 = .85; trail.param = 3;
          trail.color = VIOLET; trail.intensity = .65;
        }
        this.dashLive = false;
        this.blink(tx, tz, event.angle ?? 0);
        k.ring(tx, tz, .9, VIOLET, .3);
        this.front(tx, tz, .75, .28);
        k.scar('star', tx, tz, 1.2, 0x181421, 7, event.angle ?? 0);
        k.flash(tx, tz, WHITE, 11, 4.2, 4, .1);
        k.distort(tx, tz, 1.3, .0025, .28);
        k.burst(tx, .2, tz, 'arc', 24, 3, .55);
      } else if (event.phase === 'link') this.strike(event, px, pz, .012);
      return;
    }
    if (event.ability === 'overload') {
      if (event.phase === 'link') {
        // Links of a native chain arrive synchronously; presentation adds the hop rhythm only.
        if (k.time - this.chainAt > .03) this.chainHop = 0;
        this.chainAt = k.time;
        this.strike(event, px, pz, Math.min(7, this.chainHop++) * .04);
      } else if (event.phase === 'impact') {
        k.flash(px, pz, WHITE, 10, 5, 4, .12);
        k.camera(.24);
      }
      return;
    }
    if (event.ability === 'tesla-pylon') {
      if (event.phase === 'impact') {
        const tx = (event.targetX ?? x) / UNIT, tz = (event.targetY ?? y) / UNIT;
        k.ring(tx, tz, 1.25, VIOLET, .45);
        this.front(tx, tz, .72, .32);
        k.burst(tx, .08, tz, 'arc', 26, 3.2, .6);
        k.scar('star', tx, tz, 1.2, 0x1e182b, 8);
        k.flash(tx, tz, WHITE, 14, 5.5, 4, .1);
        k.camera(.25);
        const chunks = k.low ? 4 : 12;
        for (let i = 0; i < chunks; i++) {
          const a = i * 2.39996323;
          k.mote('solid', tx, .12, tz, Math.cos(a) * (1.5 + i % 3), 1.5 + i % 4 * .5,
            Math.sin(a) * (1.5 + i % 3), .06 + i % 3 * .025, .8, STEEL);
        }
      } else if (event.phase === 'link') {
        // width identifies the persistent marine link; its authoritative snapshot draws that cable.
        if (event.width === undefined) this.strike(event, px, pz, 0, true);
        else if (event.targetIds?.length) k.burst(px, .4, pz, 'arc', 5, 1.1, .3);
      } else if (event.phase === 'end' || event.phase === 'burst') {
        k.burst(px, .85, pz, 'arc', 18, 1.7, .65);
        for (let i = 0; i < (k.low ? 3 : 8); i++) {
          const a = i * 2.39996323;
          k.mote('shard', px + Math.cos(a) * .25, .65 + i % 3 * .3, pz + Math.sin(a) * .25,
            Math.cos(a) * .65, .25, Math.sin(a) * .65, .07 + i % 2 * .025, .65, i % 2 ? VIOLET : STEEL);
        }
        k.ring(px, pz, 1.1, VIOLET, .5, true);
      }
      return;
    }
    if (event.ability === 'overclock') {
      if (event.phase === 'impact') {
        // VFX15: the chromatic snap and fracture field live in OverdrivePayoff.
        k.burst(px, .65, pz, 'arc', 24, 3.2, .6);
      } else if (event.phase === 'end') {
        // A short reverse collapse ends the temporal state in one hard beat.
        k.burst(px, .2, pz, 'arc', 12, 1.5, .4);
      }
    }
  }

  private blink(x: number, z: number, angle: number): void {
    const b = this.blinks[this.nextBlink++ % this.blinks.length];
    b.live = true; b.x = x; b.z = z; b.angle = angle; b.age = 0;
  }

  private front(x: number, z: number, radius: number, life: number, reverse = false, time = false): void {
    const f = this.fronts[this.nextFront++ % this.fronts.length];
    f.live = true; f.x = x; f.z = z; f.radius = radius; f.life = life; f.age = 0; f.reverse = reverse; f.time = time;
  }

  private strike(event: AbilityEvent, x: number, z: number, delay: number, pylon = false): void {
    if (!Number.isFinite(event.targetX) || !Number.isFinite(event.targetY)) return;
    const k = this.kit, tx = event.targetX! / UNIT, tz = event.targetY! / UNIT;
    // The shared procedural surface supplies a white core and violet halo.
    // Only authoritative links create a strike; no decorative bolt invents another target.
    // Delay the complete discharge (surface, light and contacts) together.
    // The source and destination are immutable native link receipts.
    const d = this.discharges[this.nextDischarge++ % this.discharges.length];
    d.sx = x; d.sz = z; d.sy = pylon ? 1.5 : .95;
    d.live = true; d.x = tx; d.z = tz; d.age = 0; d.delay = delay; d.life = 2.1; d.contactFrames = 0; d.fired = false; d.seed = this.nextDischarge;
    d.ty = .75; d.victimId = event.targetIds?.[0] ?? -1;
    const id = event.targetIds?.[0], root = id === undefined ? undefined : k.statusActor(id)?.root;
    if (root) {
      let joint = this.contactBones.get(root);
      if (joint === undefined) {
        joint = null;
        root.traverse(node => { if (!joint && isContactJoint(node)) joint = node; });
        this.contactBones.set(root, joint);
      }
      if (joint?.parent) {
        const tip = joint.matrixWorld.elements;
        d.x = tip[12]; d.ty = tip[13]; d.z = tip[14];
      }
    }
  }

  update(frame: AbilityFrame): void {
    this.nativeEchoes.begin();
    if (this.disposed || !frame.visible) return;
    const k = this.kit, dt = frame.dt;
    k.impact();
    this.emissionAge += dt;
    const emit = dt > 0 && this.emissionAge > .085;
    if (emit) this.emissionAge %= .085;
    for (const f of this.fronts) {
      if (!f.live) continue;
      f.age += dt;
      if (f.age >= f.life) { f.live = false; continue; }
      const t = f.age / f.life, progress = f.reverse ? 1 - t : Math.min(1, .08 + f.age / .22);
      k.sustain(f.age);
      if (f.time) this.timeFront(f, progress, 1 - t);
      else {
        // A local forked electrical contact, not a shiny expanding volume. One retained instance.
        const radius = f.radius * (.65 + progress * .35);
        k.sprite('impact', f.x, .06, f.z, radius, radius, VIOLET, (1 - t) * .8, f.radius, 'ground', 0, f.age * 1.4);
      }
    }
    k.impact();
    if (this.dashLive && frame.game) {
      const player = frame.game.player;
      this.bolt(this.dashX, this.dashZ, player.x / UNIT, player.y / UNIT, .85);
      this.lightningBody(player.x / UNIT, player.y / UNIT, player.angle ?? 0, .85);
    }
    for (const b of this.bolts) {
      if (!b.live) continue;
      b.age += dt;
      if (b.age >= .27) { b.live = false; continue; }
      this.bolt(b.x, b.z, b.tx, b.tz, (1 - b.age / .27) * .85);
    }
    for (const d of this.discharges) {
      if (!d.live) continue;
      d.age += dt;
      if (d.age >= d.delay + d.life) { d.live = false; continue; }
      if (d.age < d.delay) continue;
      if (!d.fired && dt > 0) {
        d.fired = true;
        const dx = d.x - d.sx, dz = d.z - d.sz, length = Math.hypot(dx, dz);
        if (length > .01) {
          const arc = k.fx.spawn(FxMode.Wake, d.sx, d.sz, .55);
          arc.angle = Math.atan2(dz, dx); arc.range = length; arc.inner = .80;
          arc.h0 = d.sy; arc.h1 = d.ty; arc.param = 3; arc.color = VIOLET; arc.intensity = .86;
          // Two asymmetric branches meet the same native contact; no invented target.
          for (let side = -1; side <= 1; side += 2) {
            const t = side < 0 ? .43 : .67;
            const bx = d.sx + dx * t - dz / length * side * .18;
            const bz = d.sz + dz * t + dx / length * side * .18;
            k.beam(bx, d.sy + .13, bz, d.x, d.ty, d.z, VIOLET, .018, .18, true);
          }
        }
        const node = k.fx.spawn(FxMode.Shock, d.x, d.z, .3);
        node.range = .55; node.h0 = .045; node.color = VIOLET; node.intensity = 1.2;
        k.flash(d.x, d.z, VIOLET, 5, 2.4, 3, .08);
        k.burst(d.x, .7, d.z, 'arc', 9, 1.8, .45);
      }
      k.sustain(d.age - d.delay);
      const fade = 1 - (d.age - d.delay) / d.life;
      k.ribbon(d.sx, .045, d.sz, d.x, .045, d.z, VIOLET, .09, fade * .36, false);
      const contact = d.age - d.delay < .051;
      if (contact && d.contactFrames < 3) {
        k.impact();
        k.sprite('glow', d.x, d.ty, d.z, .76, .55, d.contactFrames < 2 ? WHITE : VIOLET, k.flashIntensity, d.seed, 'light');
        k.sustain(d.age - d.delay);
        if (dt > 0) d.contactFrames++;
      }
      k.sprite('scorch', d.x, .048, d.z, .44, .36, VIOLET, fade * .72, d.seed, 'ground');
      if (d.victimId >= 0 && d.age - d.delay < .34) {
        const actor = k.statusActor(d.victimId);
        const joint = actor && this.contactBones.get(actor.root);
        if (joint?.parent) {
          const base = joint.parent.matrixWorld.elements, tip = joint.matrixWorld.elements;
          k.ribbon(base[12], base[13], base[14], tip[12], tip[13], tip[14], 0xb8caff, .105, .82 * fade, false);
        }
      }
      if (d.age - d.delay > .28) continue;
      const count = k.low ? 2 : 5;
      for (let i = 0; i < count; i++) {
        const a = d.seed + i * TAU / count + (k.reducedMotion ? 0 : k.time * 5);
        const radius = .22 + i % 2 * .18;
        k.sprite('spark', d.x + Math.cos(a) * radius, .5 + i % 3 * .22, d.z + Math.sin(a) * radius,
          .075, .15, i % 2 ? VIOLET : WHITE, fade * .8, d.seed + i, 'light', -a, .7);
        if (!k.low && i % 2 === 0) k.ribbon(d.x, .55, d.z, d.x + Math.cos(a) * radius, .9, d.z + Math.sin(a) * radius, VIOLET, .025, fade * .55, true);
      }
    }
    for (const b of this.blinks) {
      if (!b.live) continue;
      b.age += dt;
      if (b.age > .19) { b.live = false; continue; }
      const fade = 1 - b.age / .19;
      this.lightningBody(b.x, b.z, b.angle, fade * .75);
      k.afterImage(b.x, b.z, b.angle, VIOLET, fade * .22);
    }
    for (const state of this.pylons) { state.seen = false; state.flash = Math.max(0, state.flash - dt * 6); }
    for (const pylon of frame.snapshot?.deployables ?? NO_DEPLOYABLES) {
      if (pylon.kind === 'pylon' && pylon.health > 0 && pylon.remainingMs > 0) this.pylon(pylon, dt);
    }
    for (const state of this.pylons) if (!state.seen) state.id = -1;
    for (const link of frame.snapshot?.links ?? NO_LINKS) {
      // A live cable is sustained world coverage; contact and suit signals stay unmasked.
      k.sustain();
      const x = link.x / UNIT, z = link.y / UNIT, tx = link.targetX / UNIT, tz = link.targetY / UNIT;
      // Two drifting bends keep the energized cable visibly alive without widening
      // its contact support or painting a filled strip over hostile bodies.
      const dx = tx - x, dz = tz - z, length = Math.max(.001, Math.hypot(dx, dz));
      const sway = k.reducedMotion ? .05 : Math.sin(k.time * 13 + link.x) * .12;
      const mx = (x + tx) * .5 - dz / length * sway, mz = (z + tz) * .5 + dx / length * sway;
      k.ribbon(x, 1.5, z, mx, 1.25, mz, VIOLET, .024, .34, true);
      k.ribbon(mx, 1.25, mz, tx, .85, tz, VIOLET, .024, .34, true);
      k.ribbon(x, 1.5, z, mx, 1.25, mz, WHITE, .009, .55, false);
      if (emit && !k.low) {
        const t = (Math.sin(k.time * 1.3) + 1) * .5;
        k.mote('spark', x + (tx - x) * t, 1.5 - t * .65, z + (tz - z) * t, 0, .2, 0, .045, .22, VIOLET);
      }
    }
    if (frame.snapshot?.hostileTimeScale !== undefined && frame.snapshot.hostileTimeScale < 1) this.overclock(frame, emit);
    else {
      if (this.timeField && this.timeField.seed === this.timeFieldSeed) this.timeField.live = false;
      this.timeField = undefined;
      this.overclockAge = 0; this.echoAge = 0;
      for (const echo of this.echoes) echo.live = false;
      for (const shot of this.shotEchoes) shot.live = false;
      this.shotsObserved = frame.game?.stats?.shotsFired ?? 0;
      this.shotBaseline = true;
    }
    k.impact();
  }

  private timeFront(f: Front, progress: number, fade: number): void {
    this.timeRipple(f.x, f.z, f.radius * .7 * Math.max(.02, progress), fade * (f.reverse ? .25 : .18), f.reverse ? -.4 : .2);
  }

  private timeRipple(x: number, z: number, radius: number, opacity: number, phase: number): void {
    const k = this.kit, count = k.low ? 3 : 4;
    // Broken caustic arcs are confined to the same real ripple support. A quiet
    // center leaves the marine and moving hostile bodies above this world layer.
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996323 + phase, r = radius * (.9 + i % 3 * .04);
      k.sprite('caustic', x + Math.cos(a) * r * .55, .055, z + Math.sin(a) * r * .55,
        r * .55, r * .25, VIOLET, opacity * (1.4 + i % 2 * .3), i * 3.17 + phase,
        'ground', 0, -a - Math.PI / 2);
    }
  }

  private bolt(x: number, z: number, tx: number, tz: number, fade: number): void {
    const k = this.kit, dx = tx - x, dz = tz - z, length = Math.hypot(dx, dz);
    if (length < .015) return;
    k.ribbon(x, .85, z, tx, .85, tz, VIOLET, .035, fade, true);
  }

  private lightningBody(x: number, z: number, angle: number, fade: number): void {
    const k = this.kit, sx = -Math.sin(angle), sz = Math.cos(angle);
    k.ribbon(x, 1.65, z, x, .7, z, WHITE, .028, fade, true);
    k.ribbon(x, 1.3, z, x + sx * .42, .9, z + sz * .42, VIOLET, .024, fade, true);
    k.ribbon(x, 1.3, z, x - sx * .42, .9, z - sz * .42, VIOLET, .024, fade, true);
    k.ribbon(x, .7, z, x + sx * .22, .05, z + sz * .22, VIOLET, .028, fade, true);
    k.ribbon(x, .7, z, x - sx * .22, .05, z - sz * .22, VIOLET, .028, fade, true);
    k.boltCard(x, 1.65, z, x, .7, z, .1, 0, fade * .8, WHITE);
    for (let side = -1; side <= 1; side += 2) {
      k.boltCard(x, 1.3, z, x + sx * .42 * side, .9, z + sz * .42 * side, .085, side + 2, fade * .8);
      if (!k.low) k.boltCard(x, .7, z, x + sx * .22 * side, .05, z + sz * .22 * side, .075, side + 5, fade * .7);
    }
  }

  private pylon(p: DeployableSnapshot, dt: number): void {
    const k = this.kit, x = p.x / UNIT, z = p.y / UNIT, radius = p.radius / UNIT;
    k.impact();
    const age = (p.durationMs - p.remainingMs) / 1000;
    // Machinery arrives from above, compresses at contact, then settles. The
    // native deployable remains in place; this is only the coil assembly height.
    const rise = k.reducedMotion ? 1 : 1 + Math.exp(-age * 18) * 1.8 - Math.sin(Math.min(1, age / .24) * Math.PI) * .16;
    const fade = Math.min(1, p.remainingMs / 220);
    const pulse = k.reducedMotion ? .7 : .6 + Math.sin(age * TAU * 2) * .16;
    const expiry = p.remainingMs < 1000 && !k.reducedMotion ? .75 + Math.sin(k.time * 17) * .15 : 1;
    let state: PylonState | undefined;
    for (const s of this.pylons) if (s.id === p.id) { state = s; break; }
    if (!state) for (const s of this.pylons) if (s.id === -1) { state = s; s.id = p.id; s.health = p.health; s.flash = 0; break; }
    if (state) {
      state.seen = true;
      if (dt > 0 && p.health < state.health) { state.flash = 1; k.burst(x, .5, z, 'arc', 8, 1.3, .35); }
      state.health = p.health;
    }
    const glow = (pulse + (state?.flash ?? 0) * .4) * expiry;
    // Low retains the same tripod/stem/coil silhouette with fewer winding segments.
    k.draw('solid', x, .1, z, radius * 1.35, .18, radius * 1.35, 0x18232c, fade, -.2);
    for (let i = 0; i < 3; i++) {
      const angle = i * TAU / 3 + p.angle;
      k.draw('solid', x + Math.cos(angle) * radius * .5, .13, z + Math.sin(angle) * radius * .5,
        radius * .9, .13, .13, STEEL, fade, -angle);
      k.draw('solid', x + Math.cos(angle) * radius * .89, .16, z + Math.sin(angle) * radius * .89,
        .11, .15, .18, VIOLET, .6 * fade, -angle);
    }
    k.draw('solid', x, .66 * rise, z, .26, 1.17 * rise, .26, 0x263440, fade, -.3);
    k.draw('solid', x, .7 * rise, z, .065, 1.15 * rise, .065, WHITE, .75 * fade, -.3);
    const windings = k.low ? 2 : 3, segments = k.low ? 6 : 12;
    for (let row = 0; row < windings; row++) {
      const height = (1.03 + row * .22) * rise, coilRadius = radius * (.51 + row * .045) * rise;
      for (let i = 0; i < segments; i++) {
        const a = i * TAU / segments, b = (i + 1) * TAU / segments;
        k.ribbon(x + Math.cos(a) * coilRadius, height, z + Math.sin(a) * coilRadius,
          x + Math.cos(b) * coilRadius, height, z + Math.sin(b) * coilRadius, VIOLET, .022, glow * fade, false);
      }
    }
    k.draw('shard', x, 1.63 * rise, z, .12, .14, .12, WHITE, fade * .75, p.angle);
    k.sprite('glow', x, 1.48 * rise, z, .28, .32, VIOLET, glow * fade * .6, p.id, 'light');
    const arcs = k.low ? 1 : 3;
    for (let i = 0; i < arcs; i++) {
      const a = p.angle + i * TAU / arcs + (k.reducedMotion ? 0 : Math.floor(k.time * 12) * 1.7);
      k.boltCard(x, 1.55 * rise, z, x + Math.cos(a) * radius * .7, 1.08 * rise,
        z + Math.sin(a) * radius * .7, .085, p.id + i, glow * fade * .65);
    }
    k.lightAt(p.id, x, z, VIOLET, 2.8 * glow * fade, 4.8);
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
    for (const child of node.children) {
      const socket = this.findMuzzle(child);
      if (socket) return socket;
    }
    return undefined;
  }

  private seam(frame: AbilityFrame, sx: number, sy: number, sz: number, ex: number, ey: number, ez: number, width: number, opacity: number): void {
    const g = frame.game!;
    if (frame.marine) {
      this.start.set(sx, sy, sz).applyMatrix4(frame.marine.matrixWorld);
      this.end.set(ex, ey, ez).applyMatrix4(frame.marine.matrixWorld);
    } else {
      const angle = g.player.angle ?? 0, c = Math.cos(angle), s = Math.sin(angle);
      this.start.set(g.player.x / UNIT + c * sz + s * sx, sy, g.player.y / UNIT + s * sz - c * sx);
      this.end.set(g.player.x / UNIT + c * ez + s * ex, ey, g.player.y / UNIT + s * ez - c * ex);
    }
    const k = this.kit;
    k.ribbon(this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z, VIOLET, width, opacity, false);
    // Animated branches crawl over the same armor rails, rather than orbiting the suit.
    if (!k.low || sy > 1.4) k.boltCard(this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z,
      width * (k.low ? 2.8 : 3.4), sx * 7.1 + sy * 11.3, opacity * .8, WHITE);
  }

  private overclock(frame: AbilityFrame, emit: boolean): void {
    const g = frame.game, k = this.kit;
    if (!g) return;
    const x = g.player.x / UNIT, z = g.player.y / UNIT;
    const remaining = frame.snapshot?.overdrive.activeRemainingMs ?? 0;
    const fade = Math.min(1, remaining / 450);
    k.grade(0, fade * .22);
    const starting = this.overclockAge === 0;
    this.overclockAge += frame.dt;
    this.echoAge += frame.dt;
    const angle = g.player.angle ?? 0;
    k.impact();
    // The suit changes first: charged shoulder plates, chest seams, greaves and gun rail.
    // These signals are attached to the marine rather than orbiting symbols.
    frame.marine?.updateWorldMatrix(true, false);
    for (let side = -1; side <= 1; side += 2) {
      this.seam(frame, side * .24, 1.52, -.04, side * .36, 1.46, .13, .032, fade);
      this.seam(frame, side * .16, 1.36, .22, side * .14, 1.06, .22, .026, fade);
      this.seam(frame, side * .17, .65, .11, side * .19, .2, .12, .022, fade * .9);
    }
    this.seam(frame, -.12, 1.77, .13, .12, 1.77, .13, .022, fade);
    // Prefer the visible weapon's authored socket, including animation and weapon switching.
    if (!this.muzzle || !this.visibleSocket(this.muzzle, frame.marine)) this.muzzle = frame.marine ? this.findMuzzle(frame.marine) : undefined;
    if (this.muzzle) this.muzzle.getWorldPosition(this.end);
    else this.end.set(x + Math.cos(angle) * .85, 1.25, z + Math.sin(angle) * .85);
    const mx = this.end.x, my = this.end.y, mz = this.end.z;
    k.ribbon(mx - Math.cos(angle) * .48, my, mz - Math.sin(angle) * .48, mx, my, mz,
      WHITE, .032, fade, false);
    k.boltCard(mx - Math.cos(angle) * .48, my, mz - Math.sin(angle) * .48, mx, my, mz, .11, 19, fade * .85, WHITE);
    const crackles = k.low ? 1 : 3;
    for (let i = 0; i < crackles; i++) {
      const a = angle + i * TAU / crackles + (k.reducedMotion ? 0 : Math.floor(k.time * 18) * 1.7);
      k.boltCard(mx, my, mz, mx + Math.cos(a) * .27, my + .13 + i * .045, mz + Math.sin(a) * .27,
        .105, i * 1.73, fade * .9, VIOLET);
    }
    if (starting || frame.dt > 0 && this.echoAge >= .14) {
      this.echoAge %= .14;
      // A single quiet delayed body makes the live marine the unique bright actor.
      const speed = Math.hypot(g.player.vx, g.player.vy);
      const dx = speed > 25 ? g.player.vx / speed : Math.cos(angle);
      const dz = speed > 25 ? g.player.vy / speed : Math.sin(angle);
      const echo = this.echoes[0];
      echo.live = true; echo.age = -frame.dt;
      echo.x = x - dx * 1.05 - dz * .3; echo.z = z - dz * 1.05 + dx * .3; echo.angle = angle;
      echo.gunX = mx - x; echo.gunY = my; echo.gunZ = mz - z;
      echo.native = this.nativeEchoes.capture(0, frame.marine, x, z);
      echo.articulated = !echo.native && this.marineEcho.capture(echo.pose, frame.marine, x, z, mx, my, mz, angle);
    }
    for (let index = 0; index < this.echoes.length; index++) {
      const echo = this.echoes[index];
      if (!echo.live) continue;
      echo.age += frame.dt;
      if (echo.age >= .35) { echo.live = false; continue; }
      k.sustain(this.overclockAge);
      const opacity = fade * (1 - echo.age / .35) * .085;
      if (echo.native) {
        this.nativeEchoes.draw(index, echo.x, echo.z, opacity, k.priorityWeight, k.time, k.low);
        if (!k.low || index === 0) {
          const mx = echo.x + echo.gunX, mz = echo.z + echo.gunZ;
          k.ribbon(mx - Math.cos(echo.angle) * .62, echo.gunY, mz - Math.sin(echo.angle) * .62,
            mx, echo.gunY, mz, VIOLET, .028, opacity * .45, false);
        }
      }
      else if (echo.articulated) this.marineEcho.draw(k, echo.pose, echo.x, echo.z, opacity);
      else k.afterImage(echo.x, echo.z, echo.angle, VIOLET, opacity);
    }
    this.firingEchoes(frame, mx, my, mz, angle, fade);
    k.sustain(this.overclockAge);
    const speed = Math.hypot(g.player.vx, g.player.vy);
    if (speed > 25) {
      const dx = g.player.vx / speed, dz = g.player.vy / speed;
      for (let side = -1; side <= 1; side += 2) this.motionContour(
        x - dz * side * .28, 1.18, z + dx * side * .28, dx, dz,
        Math.min(1.4, .5 + speed / UNIT * .07), fade * .28);
    }
    const progress = k.reducedMotion ? .7 : (this.overclockAge * .65) % 1;
    this.timeRipple(x, z, 1.3 + progress * 2.2, fade * Math.sin(progress * Math.PI) * .12,
      k.reducedMotion ? 0 : this.overclockAge * .08);
    k.lightAt(9000, x, z, VIOLET, 1.1 * fade, 4);
    {
      k.sustain(this.overclockAge);
      let n = 0;
      for (const e of g.enemies.snapshot.enemies) {
        if (n++ >= (k.low ? 12 : 25)) break;
        const speed = Math.hypot(e.velocityX, e.velocityY);
        if (speed < 1) continue;
        // Short contour fragments stay attached to motion. Round, soft-capped
        // pooled ribbons taper in both width and alpha; no rectangular scan cards.
        const length = Math.min(.9, Math.max(.32, speed / UNIT * .28));
        const dx = e.velocityX / speed, dz = e.velocityY / speed;
        const radius = Math.max(.2, Math.min(.7, (e.radius ?? 16) / UNIT));
        this.motionContour(e.x / UNIT, .35, e.y / UNIT, dx, dz, length, fade * .19);
        if (!k.low) this.motionContour(e.x / UNIT - dz * radius * .45, .7,
          e.y / UNIT + dx * radius * .45, dx, dz, length * .75, fade * .10);
      }
      let friendly = 0, hostile = 0;
      for (const bullet of g.bullets) {
        const a = bullet.request.angle, dx = Math.cos(a), dz = Math.sin(a);
        if (bullet.kind === 'hazard') {
          if (hostile++ >= (k.low ? 8 : 20)) continue;
          // The hostile projectile and its danger color remain owned by AttackEffects.
          // A separated, faint time smear follows behind it and yields through the
          // same danger mask; no overlay ever sits on the actual projectile head.
          const px = bullet.x / UNIT, pz = bullet.y / UNIT;
          this.motionContour(px - dx * .28, .5, pz - dz * .28, dx, dz, .82, fade * .12);
          continue;
        }
        if (bullet.kind !== 'player' || friendly++ >= (k.low ? 24 : 80)) continue;
        const length = k.low ? 2.6 : 3.4;
        k.ribbon(bullet.x / UNIT, bullet.visualMuzzle?.y ?? .9, bullet.y / UNIT,
          bullet.x / UNIT - dx * length, bullet.visualMuzzle?.y ?? .9,
          bullet.y / UNIT - dz * length, WHITE,
          k.low ? .018 : .028, fade * .65, false);
      }
      if (emit && Math.hypot(g.player.vx, g.player.vy) > 25) {
        const vx = g.player.vx / UNIT, vz = g.player.vy / UNIT;
        k.mote('spark', x - vx * .06, .6, z - vz * .06, -vx * .1, .2, -vz * .1, .055, .3, VIOLET);
      }
    }
  }

  /** Contiguous round segments shrink toward the wake; existing material fades both caps. */
  private motionContour(x: number, y: number, z: number, dx: number, dz: number, length: number, opacity: number): void {
    const k = this.kit, segments = k.low ? 2 : 3;
    for (let i = 0; i < segments; i++) {
      const t = i / segments, next = (i + 1) / segments;
      k.ribbon(x - dx * length * t, y, z - dz * length * t,
        x - dx * length * next, y, z - dz * length * next,
        VIOLET, .037 * (1 - t * .8), opacity * (1 - t) * (1 - t), false);
    }
  }

  private firingEchoes(frame: AbilityFrame, x: number, y: number, z: number, angle: number, fade: number): void {
    const g = frame.game!, k = this.kit, total = g.stats?.shotsFired;
    // Run statistics are authoritative shot receipts, including projectiles that
    // hit and retire before the renderer sees them. Never infer a shot from ammo
    // (Overclock consumes none), elapsed time or a repeatedly observed bullet.
    if (Number.isFinite(total)) {
      if (this.shotBaseline && frame.dt > 0) {
        const count = Math.min(this.shotEchoes.length, Math.max(0, total! - this.shotsObserved));
        const speed = Math.hypot(g.player.vx, g.player.vy);
        const dx = speed > 25 ? g.player.vx / speed : Math.cos(angle);
        const dz = speed > 25 ? g.player.vy / speed : Math.sin(angle);
        for (let i = 0; i < count; i++) {
          const shot = this.shotEchoes[this.nextShot++ % this.shotEchoes.length];
          shot.live = true; shot.x = x; shot.y = y; shot.z = z; shot.angle = angle;
          shot.dx = dx; shot.dz = dz; shot.age = -frame.dt;
        }
      }
      this.shotsObserved = total!; this.shotBaseline = true;
    }
    k.sustain(this.overclockAge);
    for (const shot of this.shotEchoes) {
      if (!shot.live) continue;
      shot.age += frame.dt;
      if (shot.age >= .36) { shot.live = false; continue; }
      const age = shot.age - .045;
      if (age < 0 || age >= .17) continue;
      const sx = shot.x - shot.dx * 1.05 - shot.dz * .3;
      const sz = shot.z - shot.dz * 1.05 + shot.dx * .3;
      const c = Math.cos(shot.angle), s = Math.sin(shot.angle);
      const travel = age * 13, opacity = fade * (1 - age / .17) * .25;
      this.motionContour(sx + c * (travel + 1.1), shot.y, sz + s * (travel + 1.1),
        c, s, 1.1, opacity);
      if (age < .065) k.sprite('impact', sx, shot.y, sz, .13, .13, VIOLET,
        opacity * (1 - age / .065), this.nextShot, 'light');
    }
  }

  clear(): void {
    for (const d of this.discharges) d.live = false;
    for (const echo of this.echoes) echo.live = false;
    for (const shot of this.shotEchoes) shot.live = false;
    if (this.timeField && this.timeField.seed === this.timeFieldSeed) this.timeField.live = false;
    this.timeField = undefined;
    this.marineEcho.clear(); this.nativeEchoes.clear(); this.nextShot = 0; this.shotsObserved = 0; this.shotBaseline = false;
    this.overclockAge = 0; this.echoAge = 0; this.muzzle = undefined;
    for (const b of this.blinks) b.live = false;
    for (const p of this.pylons) p.id = -1;
    for (const b of this.bolts) b.live = false;
    for (const f of this.fronts) f.live = false;
    this.chainAt = -100; this.chainHop = 0; this.emissionAge = 0; this.dashLive = false;
  }
  dispose(): void { if (this.disposed) return; this.disposed = true; this.clear(); this.nativeEchoes.dispose(); }
}

/** Register the Arc rig with the shared ability presentation owner. */
export function createArcPresentation(kit: ElementKit): AbilityPresentation { return new ArcPresentation(kit); }
