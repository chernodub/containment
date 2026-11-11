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

/** Mechanical violet-white tech with sparse, sharp lightning and open space around targets. */
class ArcPresentation implements AbilityPresentation {
  private discharges: Discharge[] = Array.from({ length: 48 }, () => ({ live: false, x: 0, z: 0, age: 0, delay: 0, life: .55, fired: false, seed: 0 }));
  private pylons: PylonState[] = Array.from({ length: 8 }, () => ({ id: -1, health: 0, flash: 0, seen: false }));
  private blinks: Blink[] = Array.from({ length: 6 }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0 }));
  private nextDischarge = 0;
  private nextBlink = 0;
  private chainAt = -100;
  private chainHop = 0;
  private emissionAge = 0;
  private disposed = false;

  constructor(private readonly kit: ElementKit) {}

  event(event: AbilityEvent, x: number, y: number): void {
    if (this.disposed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const k = this.kit, px = x / UNIT, pz = y / UNIT;
    if (event.phase === 'denied' || event.phase === 'ready' || event.phase === 'overdrive-ready') return;
    if (event.ability === 'static-step') {
      if (event.phase === 'dash-start') {
        this.blink(px, pz, event.angle ?? 0);
        k.burst(px, .9, pz, 'arc', 12, 1.6, .3);
        k.flash(px, pz, VIOLET, 4, 3.5, 3, .1);
      } else if (event.phase === 'dash-end') {
        this.blink(px, pz, event.angle ?? 0);
        k.ring(px, pz, .9, VIOLET, .3);
        k.distort(px, pz, 1.3, .0025, .28);
        k.burst(px, .2, pz, 'arc', 18, 2.4, .45);
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
        k.flash(px, pz, WHITE, 5.5, 4, 3, .12);
        k.camera(.16);
      }
      return;
    }
    if (event.ability === 'tesla-pylon') {
      if (event.phase === 'impact') {
        const tx = (event.targetX ?? x) / UNIT, tz = (event.targetY ?? y) / UNIT;
        k.ring(tx, tz, 1.25, VIOLET, .45);
        k.burst(tx, .08, tz, 'arc', 16, 2.1, .45);
        k.decal(tx, tz, .7, 0x26313d, 6);
        k.flash(tx, tz, VIOLET, 5, 4, 3, .18);
        k.camera(.17);
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
        k.distort(px, pz, 6, .0045, .7);
        k.flash(px, pz, VIOLET, 7, 6, 5, .28);
        k.burst(px, .65, pz, 'arc', 24, 3.2, .6);
        k.camera(.27);
      } else if (event.phase === 'end') {
        k.ring(px, pz, 5.5, VIOLET, .65, true);
        k.distort(px, pz, 5.5, -.0025, .65);
        k.burst(px, .2, pz, 'arc', 12, 1.5, .4);
      }
    }
  }

  private blink(x: number, z: number, angle: number): void {
    const b = this.blinks[this.nextBlink++ % this.blinks.length];
    b.live = true; b.x = x; b.z = z; b.angle = angle; b.age = 0;
  }

  private strike(event: AbilityEvent, x: number, z: number, delay: number, pylon = false): void {
    if (!Number.isFinite(event.targetX) || !Number.isFinite(event.targetY)) return;
    const k = this.kit, tx = event.targetX! / UNIT, tz = event.targetY! / UNIT;
    k.beam(x, pylon ? 1.5 : .95, z, tx, .75, tz, VIOLET, k.low ? .024 : .043, .19, true, delay);
    if (!k.low) {
      // A distinct white core and short fork create a readable electrical silhouette.
      k.beam(x, pylon ? 1.5 : .95, z, tx, .75, tz, WHITE, .013, .115, true, delay);
      const dx = tx - x, dz = tz - z, length = Math.hypot(dx, dz) || 1;
      k.beam(x + dx * .56, 1.03, z + dz * .56,
        tx - dz / length * .32, .47, tz + dx / length * .32, VIOLET, .015, .14, true, delay + .018);
    }
    const d = this.discharges[this.nextDischarge++ % this.discharges.length];
    d.live = true; d.x = tx; d.z = tz; d.age = 0; d.delay = delay; d.life = .58; d.fired = false; d.seed = this.nextDischarge;
  }

  update(frame: AbilityFrame): void {
    if (this.disposed || !frame.visible) return;
    const k = this.kit, dt = frame.dt;
    this.emissionAge += dt;
    const emit = dt > 0 && this.emissionAge > .085;
    if (emit) this.emissionAge %= .085;
    for (const d of this.discharges) {
      if (!d.live) continue;
      d.age += dt;
      if (d.age >= d.delay + d.life) { d.live = false; continue; }
      if (d.age < d.delay) continue;
      if (!d.fired) {
        d.fired = true;
        k.flash(d.x, d.z, VIOLET, 3, 2.7, 2, .11);
        k.burst(d.x, .7, d.z, 'arc', 6, 1.3, .35);
      }
      const fade = 1 - (d.age - d.delay) / d.life;
      const count = k.low ? 2 : 5;
      for (let i = 0; i < count; i++) {
        const a = d.seed + i * TAU / count + (k.reducedMotion ? 0 : k.time * 5);
        const radius = .22 + i % 2 * .18;
        k.draw('spark', d.x + Math.cos(a) * radius, .5 + i % 3 * .22, d.z + Math.sin(a) * radius,
          .022, .065, 1, i % 2 ? VIOLET : WHITE, fade * .65, -a, .7);
      }
    }
    for (const b of this.blinks) {
      if (!b.live) continue;
      b.age += dt;
      if (b.age > .19) { b.live = false; continue; }
      this.lightningBody(b.x, b.z, b.angle, (1 - b.age / .19) * .6);
    }
    for (const state of this.pylons) { state.seen = false; state.flash = Math.max(0, state.flash - dt * 6); }
    for (const pylon of frame.snapshot?.deployables ?? NO_DEPLOYABLES) {
      if (pylon.kind === 'pylon' && pylon.health > 0 && pylon.remainingMs > 0) this.pylon(pylon, dt);
    }
    for (const state of this.pylons) if (!state.seen) state.id = -1;
    for (const link of frame.snapshot?.links ?? NO_LINKS) {
      const x = link.x / UNIT, z = link.y / UNIT, tx = link.targetX / UNIT, tz = link.targetY / UNIT;
      k.ribbon(x, 1.5, z, tx, .85, tz, VIOLET, k.low ? .016 : .023, .45, !k.low);
      if (!k.low) k.ribbon(x, 1.5, z, tx, .85, tz, WHITE, .006, .45, true);
      if (emit && !k.low) {
        const t = (Math.sin(k.time * 1.3) + 1) * .5;
        k.mote('spark', x + (tx - x) * t, 1.5 - t * .65, z + (tz - z) * t, 0, .2, 0, .045, .22, VIOLET);
      }
    }
    if (frame.snapshot?.hostileTimeScale !== undefined && frame.snapshot.hostileTimeScale < 1) this.overclock(frame, emit);
  }

  private lightningBody(x: number, z: number, angle: number, fade: number): void {
    const k = this.kit, sx = -Math.sin(angle), sz = Math.cos(angle);
    k.ribbon(x, 1.65, z, x, .7, z, WHITE, .021, fade, true);
    k.ribbon(x, 1.3, z, x + sx * .42, .9, z + sz * .42, VIOLET, .019, fade, true);
    k.ribbon(x, 1.3, z, x - sx * .42, .9, z - sz * .42, VIOLET, .019, fade, true);
    k.ribbon(x, .7, z, x + sx * .22, .05, z + sz * .22, VIOLET, .023, fade, true);
    k.ribbon(x, .7, z, x - sx * .22, .05, z - sz * .22, VIOLET, .023, fade, true);
  }

  private pylon(p: DeployableSnapshot, dt: number): void {
    const k = this.kit, x = p.x / UNIT, z = p.y / UNIT, radius = p.radius / UNIT;
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
    k.draw('solid', x, .1, z, radius * 1.35, .18, radius * 1.35, STEEL, .9 * fade, -.2);
    for (let i = 0; i < 3; i++) {
      const angle = i * TAU / 3 + p.angle;
      k.draw('solid', x + Math.cos(angle) * radius * .5, .13, z + Math.sin(angle) * radius * .5,
        radius * .9, .13, .13, 0x5f6875, fade, -angle);
      k.draw('solid', x + Math.cos(angle) * radius * .89, .16, z + Math.sin(angle) * radius * .89,
        .11, .15, .18, VIOLET, .6 * fade, -angle);
    }
    k.draw('solid', x, .66 * rise, z, .19, 1.17 * rise, .19, 0x697283, fade, -.3);
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
    k.lightAt(p.id, x, z, VIOLET, 1.45 * glow * fade, 3.8);
  }

  private overclock(frame: AbilityFrame, emit: boolean): void {
    const g = frame.game, k = this.kit;
    if (!g) return;
    const x = g.player.x / UNIT, z = g.player.y / UNIT;
    const remaining = frame.snapshot?.overdrive.activeRemainingMs ?? 0;
    const fade = Math.min(1, remaining / 450);
    // Sparse dial ticks give the state a unique silhouette without tinting hostile warnings.
    const count = k.low ? 8 : 12, rotation = k.reducedMotion ? 0 : k.time * .19;
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count + rotation, r = 1.05;
      k.draw('shard', x + Math.cos(a) * r, .06, z + Math.sin(a) * r, .025, .045, i % 3 ? .08 : .16,
        i % 3 ? VIOLET : WHITE, fade * .5, -a);
    }
    k.lightAt(9000, x, z, VIOLET, 1.1 * fade, 4);
    if (!k.low) {
      let n = 0;
      for (const e of g.enemies.snapshot.enemies) {
        if (n++ >= 25) break;
        const speed = Math.hypot(e.velocityX, e.velocityY);
        if (speed < 10) continue;
        const tx = e.x / UNIT - e.velocityX / UNIT * .09, tz = e.y / UNIT - e.velocityY / UNIT * .09;
        k.ribbon(e.x / UNIT, .25, e.y / UNIT, tx, .25, tz, VIOLET, .016, fade * .16, false);
      }
      n = 0;
      for (const bullet of g.bullets) {
        if (n++ >= 80) break;
        const length = bullet.kind === 'player' ? .8 : .45;
        k.ribbon(bullet.x / UNIT, bullet.visualMuzzle?.y ?? .9, bullet.y / UNIT,
          bullet.x / UNIT - Math.cos(bullet.request.angle) * length, bullet.visualMuzzle?.y ?? .9,
          bullet.y / UNIT - Math.sin(bullet.request.angle) * length, bullet.kind === 'player' ? WHITE : VIOLET,
          .012, fade * (bullet.kind === 'player' ? .35 : .12), false);
      }
      if (emit && Math.hypot(g.player.vx, g.player.vy) > 25) {
        const vx = g.player.vx / UNIT, vz = g.player.vy / UNIT;
        k.mote('spark', x - vx * .06, .6, z - vz * .06, -vx * .1, .2, -vz * .1, .055, .3, VIOLET);
      }
    }
  }

  clear(): void {
    for (const d of this.discharges) d.live = false;
    for (const b of this.blinks) b.live = false;
    for (const p of this.pylons) p.id = -1;
    this.chainAt = -100; this.chainHop = 0; this.emissionAge = 0;
  }
  dispose(): void { if (this.disposed) return; this.disposed = true; this.clear(); }
}

/** Register the Arc rig with the shared ability presentation owner. */
export function createArcPresentation(kit: ElementKit): AbilityPresentation { return new ArcPresentation(kit); }
