import { Vector3, type Object3D } from 'three';
import type { AbilityEvent, AbilityLinkSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, type AbilityFrame, type AbilityPresentation } from '../types';

const VIOLET = ELEMENT_COLORS.arc;
const WHITE = 0xf2ecff;
const STEEL = 0x34414d;
const TAU = Math.PI * 2;
const NO_LINKS: readonly AbilityLinkSnapshot[] = [];
const NO_DEPLOYABLES: readonly DeployableSnapshot[] = [];
type Discharge = { live: boolean; x: number; z: number; age: number; delay: number; life: number; fired: boolean; seed: number };
type PylonState = { id: number; health: number; flash: number; seen: boolean };
type Blink = { live: boolean; x: number; z: number; angle: number; age: number };
type Bolt = { live: boolean; x: number; z: number; tx: number; tz: number; age: number };
type Echo = { live: boolean; x: number; z: number; angle: number; age: number };
type Front = { live: boolean; x: number; z: number; radius: number; age: number; life: number; reverse: boolean; time: boolean };

/** Heavy violet-white discharges, grounded machinery and cool time-dilation language. */
class ArcPresentation implements AbilityPresentation {
  private discharges: Discharge[] = Array.from({ length: 48 }, () => ({ live: false, x: 0, z: 0, age: 0, delay: 0, life: .55, fired: false, seed: 0 }));
  private pylons: PylonState[] = Array.from({ length: 8 }, () => ({ id: -1, health: 0, flash: 0, seen: false }));
  private blinks: Blink[] = Array.from({ length: 6 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0 }));
  private bolts: Bolt[] = Array.from({ length: 6 }, () => ({ live: false, x: 0, z: 0, tx: 0, tz: 0, age: 0 }));
  private fronts: Front[] = Array.from({ length: 12 }, () => ({ live: false, x: 0, z: 0, radius: 1, age: 0, life: 1, reverse: false, time: false }));
  private echoes: Echo[] = Array.from({ length: 4 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0 }));
  private nextEcho = 0;
  private echoAge = 0;
  private overclockAge = 0;
  private readonly start = new Vector3();
  private readonly end = new Vector3();
  private muzzle?: Object3D;
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
  private disposed = false;

  constructor(private readonly kit: ElementKit) {}

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
        }
        this.dashLive = false;
        this.blink(tx, tz, event.angle ?? 0);
        k.ring(tx, tz, .9, VIOLET, .3);
        this.front(tx, tz, 1.15, .4);
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
        this.front(tx, tz, 1.65, .55);
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
        k.ring(px, pz, 5.5, VIOLET, .7);
        k.ring(px, pz, 3.2, WHITE, .45);
        this.front(px, pz, 6, .85, false, true);
        k.distort(px, pz, 6, .0045, .7);
        k.flash(px, pz, WHITE, 13, 7, 5, .16);
        k.burst(px, .65, pz, 'arc', 24, 3.2, .6);
        k.camera(.27);
      } else if (event.phase === 'end') {
        k.ring(px, pz, 5.5, VIOLET, .65, true);
        this.front(px, pz, 6, .65, true, true);
        k.distort(px, pz, 5.5, -.0025, .65);
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
    // The shared ribbon draw supplies a white-hot core and restrained violet halo.
    // Only authoritative links create a strike; no decorative bolt invents another target.
    k.beam(x, pylon ? 1.5 : .95, z, tx, .75, tz, VIOLET, pylon ? .036 : .045, .32, true, delay);
    const d = this.discharges[this.nextDischarge++ % this.discharges.length];
    d.live = true; d.x = tx; d.z = tz; d.age = 0; d.delay = delay; d.life = .38; d.fired = false; d.seed = this.nextDischarge;
  }

  update(frame: AbilityFrame): void {
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
      else k.front(f.x, f.z, f.radius, progress, WHITE, .65, (1 - t) * .65);
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
        k.flash(d.x, d.z, WHITE, 8, 4, 3, .12);
        k.burst(d.x, .7, d.z, 'arc', 9, 1.8, .45);
      }
      k.impact();
      const fade = 1 - (d.age - d.delay) / d.life;
      const contact = Math.max(0, 1 - (d.age - d.delay) / .12);
      k.draw('spark', d.x, .75, d.z, .22, .3, 1, WHITE, contact * .95);
      const count = k.low ? 2 : 5;
      for (let i = 0; i < count; i++) {
        const a = d.seed + i * TAU / count + (k.reducedMotion ? 0 : k.time * 5);
        const radius = .22 + i % 2 * .18;
        k.draw('spark', d.x + Math.cos(a) * radius, .5 + i % 3 * .22, d.z + Math.sin(a) * radius,
          .045, .13, 1, i % 2 ? VIOLET : WHITE, fade * .8, -a, .7);
        if (!k.low && i % 2 === 0) k.ribbon(d.x, .55, d.z, d.x + Math.cos(a) * radius, .9, d.z + Math.sin(a) * radius, VIOLET, .025, fade * .55, true);
      }
    }
    for (const b of this.blinks) {
      if (!b.live) continue;
      b.age += dt;
      if (b.age > .19) { b.live = false; continue; }
      const fade = 1 - b.age / .19;
      this.lightningBody(b.x, b.z, b.angle, fade * .75);
      k.afterImage(b.x, b.z, b.angle, VIOLET, fade * .12);
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
      k.ribbon(x, 1.5, z, tx, .85, tz, VIOLET, .025, .6, true);
      if (emit && !k.low) {
        const t = (Math.sin(k.time * 1.3) + 1) * .5;
        k.mote('spark', x + (tx - x) * t, 1.5 - t * .65, z + (tz - z) * t, 0, .2, 0, .045, .22, VIOLET);
      }
    }
    if (frame.snapshot?.hostileTimeScale !== undefined && frame.snapshot.hostileTimeScale < 1) this.overclock(frame, emit);
    else { this.overclockAge = 0; this.echoAge = 0; for (const echo of this.echoes) echo.live = false; }
    k.impact();
  }

  private timeFront(f: Front, progress: number, fade: number): void {
    const k = this.kit, count = k.low ? 8 : 12, r = f.radius * Math.max(.02, progress);
    // Broken concentric wavefronts stay on the deck; no floating brackets or clock hands.
    const echo = f.radius * (f.reverse ? .2 + progress * .55 : 1 - progress * .7);
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count, end = a + .22;
      k.ribbon(f.x + Math.cos(a) * r, .085, f.z + Math.sin(a) * r,
        f.x + Math.cos(end) * r, .085, f.z + Math.sin(end) * r, VIOLET, .055, fade * .65, false);
      const middle = a + .11;
      k.ribbon(f.x + Math.cos(middle) * r, .085, f.z + Math.sin(middle) * r,
        f.x + Math.cos(end) * r, .085, f.z + Math.sin(end) * r, WHITE, .026, fade * .36, false);
      if (!k.low && i % 2 === 0) {
        k.ribbon(f.x + Math.cos(a + .3) * echo, .065, f.z + Math.sin(a + .3) * echo,
          f.x + Math.cos(a + .48) * echo, .065, f.z + Math.sin(a + .48) * echo, VIOLET, .025, fade * .32, false);
      }
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
  }

  private pylon(p: DeployableSnapshot, dt: number): void {
    const k = this.kit, x = p.x / UNIT, z = p.y / UNIT, radius = p.radius / UNIT;
    k.impact();
    const age = (p.durationMs - p.remainingMs) / 1000;
    const rise = k.reducedMotion ? 1 : Math.min(1, Math.max(.03, age / .15));
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
    this.kit.ribbon(this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z, VIOLET, width, opacity, false);
  }

  private overclock(frame: AbilityFrame, emit: boolean): void {
    const g = frame.game, k = this.kit;
    if (!g) return;
    const x = g.player.x / UNIT, z = g.player.y / UNIT;
    const remaining = frame.snapshot?.overdrive.activeRemainingMs ?? 0;
    const fade = Math.min(1, remaining / 450);
    k.grade(0, fade * .9);
    this.overclockAge += frame.dt;
    this.echoAge += frame.dt;
    const angle = g.player.angle ?? 0;
    k.impact();
    // The suit changes first: charged shoulder plates, chest seams, greaves and gun rail.
    // These signals are attached to the marine rather than orbiting symbols.
    frame.marine?.updateWorldMatrix(true, false);
    for (let side = -1; side <= 1; side += 2) {
      this.seam(frame, side * .24, 1.52, -.04, side * .36, 1.46, .13, .023, fade * .9);
      this.seam(frame, side * .16, 1.36, .22, side * .14, 1.06, .22, .018, fade * .8);
      this.seam(frame, side * .17, .65, .11, side * .19, .2, .12, .018, fade * .65);
    }
    this.seam(frame, -.12, 1.77, .13, .12, 1.77, .13, .018, fade * .75);
    // Prefer the visible weapon's authored socket, including animation and weapon switching.
    if (!this.muzzle || !this.visibleSocket(this.muzzle, frame.marine)) this.muzzle = frame.marine ? this.findMuzzle(frame.marine) : undefined;
    if (this.muzzle) this.muzzle.getWorldPosition(this.end);
    else this.end.set(x + Math.cos(angle) * .85, 1.25, z + Math.sin(angle) * .85);
    const mx = this.end.x, my = this.end.y, mz = this.end.z;
    k.ribbon(mx - Math.cos(angle) * .48, my, mz - Math.sin(angle) * .48, mx, my, mz,
      VIOLET, .021, fade * .85, false);
    const crackles = k.low ? 1 : 3;
    for (let i = 0; i < crackles; i++) {
      const a = angle + i * TAU / crackles + (k.reducedMotion ? 0 : Math.floor(k.time * 18) * 1.7);
      k.ribbon(mx, my, mz, mx + Math.cos(a) * .17, my + .08 + i * .035, mz + Math.sin(a) * .17,
        VIOLET, .018, fade * .7, true);
    }
    if (frame.dt > 0 && this.echoAge >= .12 && Math.hypot(g.player.vx, g.player.vy) > 25) {
      this.echoAge %= .12;
      const echo = this.echoes[this.nextEcho++ % this.echoes.length];
      echo.live = true; echo.age = -frame.dt; echo.x = x; echo.z = z; echo.angle = angle;
    }
    for (const echo of this.echoes) {
      if (!echo.live) continue;
      echo.age += frame.dt;
      if (echo.age >= .3) { echo.live = false; continue; }
      k.sustain(echo.age);
      k.afterImage(echo.x, echo.z, echo.angle, VIOLET, fade * (1 - echo.age / .3) * .18);
    }
    // Low coverage moving world ripple gives the time field scale while keeping actors clear.
    k.sustain(this.overclockAge);
    const progress = k.reducedMotion ? .7 : (this.overclockAge * .65) % 1;
    const radius = 1.7 + progress * 3.2, slices = k.low ? 6 : 10;
    for (let i = 0; i < slices; i++) {
      const a = i * TAU / slices;
      k.ribbon(x + Math.cos(a) * radius, .055, z + Math.sin(a) * radius,
        x + Math.cos(a + .28) * radius, .055, z + Math.sin(a + .28) * radius,
        VIOLET, .025, fade * Math.sin(progress * Math.PI) * .18, false);
    }
    k.lightAt(9000, x, z, VIOLET, 1.1 * fade, 4);
    {
      k.sustain(this.overclockAge);
      let n = 0;
      for (const e of g.enemies.snapshot.enemies) {
        if (n++ >= (k.low ? 12 : 25)) break;
        const speed = Math.hypot(e.velocityX, e.velocityY);
        if (speed < 1) continue;
        // Slowed simulation velocity can be only a few units/s: preserve its direction while
        // giving the presentation-only time echo enough length to survive 480px reduction.
        const length = Math.min(1.5, Math.max(.55, speed / UNIT * .4));
        const tx = e.x / UNIT - e.velocityX / speed * length, tz = e.y / UNIT - e.velocityY / speed * length;
        k.ribbon(e.x / UNIT, .35, e.y / UNIT, tx, .35, tz, VIOLET, .045, fade * .32, false);
        if (!k.low) k.ribbon(e.x / UNIT, .7, e.y / UNIT, tx, .7, tz, WHITE, .02, fade * .14, false);
      }
      n = 0;
      for (const bullet of g.bullets) {
        if (n++ >= (k.low ? 24 : 80)) break;
        if (bullet.kind !== 'player') continue;
        const length = 2.1;
        k.ribbon(bullet.x / UNIT, bullet.visualMuzzle?.y ?? .9, bullet.y / UNIT,
          bullet.x / UNIT - Math.cos(bullet.request.angle) * length, bullet.visualMuzzle?.y ?? .9,
          bullet.y / UNIT - Math.sin(bullet.request.angle) * length, WHITE,
          k.low ? .018 : .028, fade * .65, false);
      }
      if (emit && Math.hypot(g.player.vx, g.player.vy) > 25) {
        const vx = g.player.vx / UNIT, vz = g.player.vy / UNIT;
        k.mote('spark', x - vx * .06, .6, z - vz * .06, -vx * .1, .2, -vz * .1, .055, .3, VIOLET);
      }
    }
  }

  clear(): void {
    for (const d of this.discharges) d.live = false;
    for (const echo of this.echoes) echo.live = false;
    this.overclockAge = 0; this.echoAge = 0; this.muzzle = undefined;
    for (const b of this.blinks) b.live = false;
    for (const p of this.pylons) p.id = -1;
    for (const b of this.bolts) b.live = false;
    for (const f of this.fronts) f.live = false;
    this.chainAt = -100; this.chainHop = 0; this.emissionAge = 0; this.dashLive = false;
  }
  dispose(): void { if (this.disposed) return; this.disposed = true; this.clear(); }
}

/** Register the Arc rig with the shared ability presentation owner. */
export function createArcPresentation(kit: ElementKit): AbilityPresentation { return new ArcPresentation(kit); }
