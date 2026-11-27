import { Vector3, type Object3D } from 'three';
import type { AbilityEvent, AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { ElementKit } from '../ElementKit';
import { UNIT, type AbilityFrame, type AbilityPresentation } from '../types';
import { authoredVariation, impactBeat } from '../GraphicLanguage';
import { POOL_FLAME_PHASE } from '../EffectAtlas';
import { FxMode, type FxSlot } from '../FlagshipFx';

const FIRE = 0xffa332;
const CORE = 0xffedb5;
const SOOT = 0x101619;
const HOT = 0xffbf51;
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
  targetIds?: readonly number[];
  arc: number;
};

/** Four physical sources: a pressure jet, deck fuel, a liquid fire and a charged suit. */
class PyroPresentation implements AbilityPresentation {
  private readonly effects: Transient[] = Array.from({ length: TRANSIENT_CAPACITY }, (_, lightId) => ({
    live: false, lightId: 7100 + lightId, kind: 'cone', age: 0, life: 1, x: 0, z: 0, tx: 0, tz: 0,
    angle: 0, radius: 0, range: 0, arc: 0,
  }));
  private readonly surfaces = Array.from({ length: 32 }, () => ({ id: -1, part: 0, seen: false, seed: -1, slot: undefined as FxSlot | undefined }));
  private readonly burnYield = Array.from({ length: 32 }, () => ({
    zone: -1, seen: false, gain: 1, weight: new Float32Array(18),
  }));
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
    if (!fuel) slot.age = .09;
    slot.intensity = intensity;
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
  private heatVictim = -1;
  private heatUntil = -1;
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
        const length = Math.hypot(tx - x, tz - z);
        kit.scar('soot', (x + tx) * .5, (z + tz) * .5, Math.max(.7, length * .5),
          SOOT, 4.5, Math.atan2(tz - z, tx - x), .68);
      }
      return;
    }
    if (event.ability === 'flashfire') {
      if (event.phase === 'burst') {
        const ball = kit.fx.spawn(FxMode.Fire, x, z, .42);
        ball.range = (event.radius ?? 42) / UNIT;
        ball.arc = Math.PI * 2;
        ball.h0 = .35; ball.h1 = 1.1; ball.param = .2; ball.intensity = .9;
        kit.burst(x, .6, z, 'pyro', 12, 2.2, .45);
        kit.flash(x, z, FIRE, 6, 3, 3, .18);
        return;
      }
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
        p.targetIds = event.targetIds;
        const c = Math.cos(p.angle), s = Math.sin(p.angle);
        const scorch = kit.fx.spawn(FxMode.Scorch, x, z, 2.4);
        scorch.angle = p.angle; scorch.arc = p.arc; scorch.range = p.range; scorch.inner = .06; scorch.h0 = scorch.h1 = .034;
        kit.flash(x + c * 1.2, z + s * 1.2, HOT, 30, 9, 4, .34);
        kit.flash(x + c * p.range * .6, z + s * p.range * .6, FIRE, 18, p.range, 3, .45);
        kit.distort(x + c * p.range * .5, z + s * p.range * .5, p.range * .55, .0055, .8, true);
        kit.camera(.24, p.angle);

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
        // Landing splashes are ballistic liquid, never a ring of repeated fire stamps.
        kit.scar('fuel-rim', tx, tz, radius, SOOT, 10);
        kit.flash(tx, tz, CORE, 22, Math.max(6, radius * 1.8), 5, .3);
        kit.distort(tx, tz, radius * 1.1, .004, .65, true);
        kit.camera(.26);
        const p = this.acquire('ignition', tx, tz, .65); p.radius = radius; p.range = 1;
      }
      return;
    }
    if (event.ability === 'meltdown') {
      if (event.phase === 'tick') {
        kit.sustain();
        const ids = event.targetIds;
        const lastId = ids?.[ids.length - 1];
        const actor = lastId === undefined ? undefined : kit.statusActor(lastId);
        if (actor && lastId !== undefined) {
          this.heatVictim = lastId;
          this.heatUntil = kit.time + .32;
          const body = actor.root.position;
          const angle = Math.atan2(body.z - z, body.x - x);
          actor.hit?.(.68, angle);
          kit.impact();
          for (let i = -1; i <= 1; i++) {
            const a = angle + i * .38;
            kit.mote('spark', body.x, body.y + actor.height * .58, body.z,
              Math.cos(a) * 2.8, 1.3 + i * .3, Math.sin(a) * 2.8,
              i === 0 ? .46 : .24, .32, i === 0 ? CORE : HOT);
          }
        }
        return;
      }
      if (event.phase === 'impact' || event.phase === 'burst') {
        const radius = (event.radius ?? 130) / UNIT;
        const p = this.acquire('ignition', x, z, event.phase === 'burst' ? .38 : .65); p.radius = radius; p.angle = event.angle ?? 0;
        kit.burst(x, .35, z, 'pyro', event.phase === 'burst' ? 12 : 20, 3, .65);
        if (event.phase === 'burst' && (event.radius ?? 0) > 130) {
          // The core detonation owns the traveling front. Kill bursts already
          // have a local ignition and particles on their struck bodies.
          const front = kit.fx.spawn(FxMode.Climax, x, z, .62);
          front.range = radius; front.arc = 2; front.h0 = .044;
          front.param = 1; front.color = HOT;

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
    for (const pool of this.burnYield) {
      if (!pool.seen) pool.zone = -1;
      pool.seen = false;
    }
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

  private readonly joints = new WeakMap<Object3D,Object3D[]>();
  private readonly hitPosition = new Vector3();

  private cone(p: Transient, emit: boolean, frame: AbilityFrame): void {
    const kit = this.kit, hot = impactBeat(p.age);
    const c = Math.cos(p.angle), s = Math.sin(p.angle);
    const fade = Math.max(0, 1 - Math.max(0, p.age - .18) / .4);
    kit.impact();
    if (fade > 0) {
      if (!this.muzzle || !this.visibleSocket(this.muzzle, frame.marine)) this.muzzle = frame.marine ? this.findMuzzle(frame.marine) : undefined;
      if (this.muzzle) this.muzzle.getWorldPosition(this.source);
      else this.source.set(p.x + c * .55, .95, p.z + s * .55);
      kit.sustain(p.age);
      kit.sprite('glow', p.x + c*p.range*.48, .05, p.z + s*p.range*.48, p.range*.42, p.range*.27, FIRE, fade*.25, 0, 'ground-light');
      if (p.age < .12) for (const id of p.targetIds ?? []) {
        const actor=kit.statusActor(id);
        if (!actor) continue;
        const root=actor.root, pos=root.position;
        let bones=this.joints.get(root);
        if (!bones) {
          bones=[];
          root.traverse(node=>{ if (node.type==='Bone') bones!.push(node); });
          this.joints.set(root,bones);
        }
        root.updateWorldMatrix(true,true);
        const dx=p.x-pos.x, dz=p.z-pos.z, distance=Math.max(.01,Math.hypot(dx,dz));
        let best=-Infinity;
        this.hitPosition.set(pos.x,actor.height*.48,pos.z);
        for (const bone of bones) {
          const m=bone.matrixWorld.elements;
          if (m[13]<actor.height*.22 || m[13]>actor.height*.82) continue;
          const facing=((m[12]-pos.x)*dx+(m[14]-pos.z)*dz)/distance;
          const score=facing-.55*Math.abs(m[13]-actor.height*.52);
          if (score>best) { best=score; this.hitPosition.set(m[12],m[13],m[14]); }
        }
        const hit=this.hitPosition, age=p.age/.12;
        const variation=authoredVariation(id*1.73);
        const side=id%2 ? 1 : -1;
        const outward=.17+.12*variation;
        const hx=hit.x+dx/distance*outward, hz=hit.z+dz/distance*outward;
        kit.draw('contact',hx,hit.y,hz,.25+.09*variation,.30,1,CORE,(1.-age*.55)*kit.flashIntensity,0,id*.71,900+age);
        kit.draw('contact',hx+side*dz/distance*.22,hit.y+.16,hz-side*dx/distance*.22,
          .12,.24,1,HOT,(1.-age)*.88,0,side*.72,900+age);
      }
      const tongueOpacity = fade * (.16 + .84 * Math.max(0, 1 - Math.max(0, p.age - .045) / .15));
      kit.fireFan(p.x, p.z, p.range, p.angle, p.arc, tongueOpacity, this.source.y, this.source.x, this.source.z, p.age <= .15);
      kit.impact();
    }
    // Compact white-yellow muzzle core, only for the first beats.
    if (p.age < .055) {
      const k = 1 - p.age / .055;
      kit.draw('spark', this.source.x + c * .15, this.source.y, this.source.z + s * .15, .68 * k + .16, .46 * k + .12, 1, 0xfff9e9, k);
      kit.draw('spark', this.source.x + c * .4, this.source.y, this.source.z + s * .4, .5 * k, .14 * k, 1, 0xffd27a, .8 * k, 0, -p.angle);
    }
    kit.lightAt(p.lightId, p.x + c * p.range * .4, p.z + s * p.range * .4, FIRE, (5 + 18 * hot) * fade * (.28 + .72 * Math.max(0, 1 - p.age / .2)), Math.max(8, p.range * 1.2));
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
      for (let i = 0; i < 3; i++) {
        const angle = i * 2.4 + .35, reach = p.radius * (.23 + .21 * t);
        const x = p.x + Math.cos(angle) * reach, z = p.z + Math.sin(angle) * reach;
        const height = (1.6 + i * .35) * (.8 + Math.sin(t * Math.PI) * .65);
        kit.draw('flame', x, height * .55, z, (.65 + .2 * i) * fade, height * .5, 1,
          CORE, fade, 0, Math.cos(angle) * .23, POOL_FLAME_PHASE + i * 7);
        kit.sprite('glow', x, height * .3, z, .32 * fade, .44 * fade, CORE, fade, i, 'light');
      }
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
    const fade = Math.min(1, zone.remainingMs / 350), points = Math.min(kit.low ? 3 : 5, Math.max(2, Math.ceil(length / 1.4)));
    kit.sustain((zone.durationMs - zone.remainingMs) / 1000);
    // One connected native-width strip avoids a row of circular fire stamps.
    this.surface(zone.id, 0, x, z, radius, angle, 0, .038, .038, fade * .85, true, length);
    for (let i = 0; i < points; i++) {
      const variation = authoredVariation(zone.id + i * 2.4);
      const t = (i + .15 + variation * .7) / points;
      const cross = Math.sin(i * 2.4 + zone.id) * radius * .55;
      const px = x + (ex - x) * t - s * cross, pz = z + (ez - z) * t + c * cross;
      const reach = .28 + variation * .62;
      kit.flowFlame(px, .07, pz, px - c * reach, .14 + variation * .19, pz - s * reach,
        .13 + variation * .09, zone.id + i, fade * .42);
    }
    kit.sprite('glow', (x+ex)*.5, .05, (z+ez)*.5, length*.52, radius, FIRE, .3*fade, zone.id, 'ground-light', 0, -angle);
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
    kit.sustain(elapsed);
    const meltdown = zone.ability === 'meltdown';
    const enemies = frame.game?.enemies.snapshot.enemies;
    const zones = frame.snapshot?.zones;
    const radiusSquared = zone.radius ** 2;
    let hasContact = false;
    if (enemies) for (const enemy of enemies) {
      if (enemy.health <= 0 || (enemy.x - zone.x) ** 2 + (enemy.y - zone.y) ** 2 > radiusSquared) continue;
      hasContact = true;
      break;
    }
    // Keep the fuel running between victims while reserving its hottest value
    // for the skin-bound ember after ignition.
    const desiredGain = 1 - (hasContact ? .84 : .66) * Math.min(1, Math.max(0, (elapsed - .08) / .22));
    const pockets = meltdown ? 0 : kit.low ? 6 : 12;
    const clock = kit.reducedMotion ? 0 : kit.time;
    let pool = this.burnYield.find(entry => entry.zone === zone.id);
    if (!pool) {
      pool = this.burnYield.find(entry => entry.zone === -1);
      if (pool) { pool.zone = zone.id; pool.gain = 1; pool.weight.fill(0); }
    }
    if (pool) {
      pool.seen = true;
      const step = Math.max(0, frame.dt) * 8;
      pool.gain += Math.min(step, Math.max(-step, desiredGain - pool.gain));
    }
    const flameGain = pool?.gain ?? desiredGain;
    for (let i = 0; i < pockets; i++) {
      const seed = zone.id * .71 + i * 2.39996;
      const napalm = zone.ability === 'napalm-charge';
      const interior = i % 3 !== 1;
      const nearSuit = meltdown;
      const scatter = authoredVariation(seed);
      let reach = nearSuit ? 1.18 + .36 * scatter : radius * (interior ? .12 + .56 * scatter : .70 + .25 * scatter);
      let angle = meltdown ? i * Math.PI / 3 : seed + .68 * Math.sin(seed * 3.2);
      if (napalm) {
        // Triplets follow each of two diverging fuel runs. Outer pockets ignite last.
        const cluster = Math.floor(i / 3);
        const run = (Math.floor(cluster / 2) + .42 + .34 * scatter) / Math.ceil(pockets / 6);
        reach = radius * run * Math.min(1, .15 + elapsed * 3.2);
        angle = zone.id * .71 + (cluster % 2 ? .95 : -1.85) + .50 * run
          + .16 * Math.sin(8 * run) + (i % 3 - 1) * .16;
      }
      const px = x + Math.cos(angle) * reach + .08 * Math.sin(clock * 2.1 + seed);
      const pz = z + Math.sin(angle) * reach + .06 * Math.cos(clock * 2.4 + seed);
      // Earlier pools own the shared fuel so overlapping patches do not stack their flames.
      if (zones && this.sharedFuel(zones, zone.id, px, pz)) continue;
      let target = 0;
      if (enemies) for (const enemy of enemies) {
        if (enemy.health <= 0 || (enemy.meleePhase === 'approach' && enemy.windupMs <= 0 && enemy.chargeMs <= 0)) continue;
        const dx = px - enemy.x / UNIT, dz = pz - enemy.y / UNIT;
        const bodyRadius = enemy.radius / UNIT;
        const reach = bodyRadius + .38;
        // Both the body margin and the committed limb's capsule already yield
        // zero outside this bound. Skip their trigonometry for distant attackers.
        const maxReach = reach + 1.22;
        if (dx * dx + dz * dz > maxReach * maxReach) continue;
        const charge = enemy.pendingAttack === 'charge' || enemy.chargeMs > 0;
        const facing = enemy.meleePhase !== 'approach' ? enemy.meleeAngle :
          Math.atan2(charge ? enemy.lockY : enemy.lockY - enemy.y, charge ? enemy.lockX : enemy.lockX - enemy.x);
        const c = Math.cos(facing), s = Math.sin(facing);
        const along = Math.max(0, Math.min(reach, dx * c + dz * s));
        const clearance = Math.min(Math.hypot(dx, dz) - bodyRadius, Math.hypot(dx - along * c, dz - along * s));
        target = Math.max(target, Math.min(1, (1.22 - clearance) / .4));
      }
      const previous = pool?.weight[i] ?? target;
      const step = Math.max(0, frame.dt) / (target > previous ? .045 : .18);
      const weight = previous + Math.min(step, Math.max(-step, target - previous));
      if (pool) pool.weight[i] = weight;
      const height = ((napalm ? .18 + 1.45 * scatter * scatter : .40 + .66 * scatter) + .17 * Math.sin(clock * 5 + seed)) * (nearSuit ? .78 : 1) * (1 - .67 * weight);
      const width = (.22 + .13 * scatter) * (1 - .62 * weight);
      const visibility = 1 - (i % 3 === 0 ? .5 : 1) * weight;
      const lean = .26 + scatter * .69;
      kit.flowFlame(px, .07, pz, px + Math.cos(angle) * lean, .10 + height * (i % 5 ? .30 : .72),
        pz + Math.sin(angle) * lean, width, seed, fade * visibility * flameGain);
      if (target < .15 && weight < .15 && emit && i % (kit.low ? 8 : 6) === Math.floor(kit.time * 11) % (kit.low ? 8 : 6))
        kit.mote('spark', px, height * .75, pz, .12, 1.35 + scatter, .08, .045, .7, HOT);
    }
    if (!meltdown) kit.sprite('glow', x, .052, z, radius * 1.18, radius * 1.18, FIRE, .27 * fade, zone.id, 'ground-light');
    let nearest = radius * radius, lx = x, lz = z;
    if (enemies) for (const enemy of enemies) {
      const ex = enemy.x / UNIT, ez = enemy.y / UNIT;
      const dist = (ex-x)**2 + (ez-z)**2;
      if (enemy.health <= 0 || dist > radius*radius || enemy.meleePhase !== 'approach' || enemy.windupMs > 0 || enemy.chargeMs > 0) continue;
      const foot = enemy.radius / UNIT * .66;
      if (dist < nearest) { nearest=dist; lx=ex+foot; lz=ez+.22; }
    }
    const contact = meltdown && kit.time < this.heatUntil ? kit.statusActor(this.heatVictim) : undefined;
    if (contact) { lx = contact.root.position.x; lz = contact.root.position.z; }
    kit.lightAt(zone.id,lx,lz,meltdown ? CORE : HOT,(contact ? 9 : meltdown ? 4 : 15)*fade,Math.min(8,radius*2),3,.48);
    if (zone.ability === 'meltdown') {
      this.meltdown(zone, x, z, fade * flameGain, frame, emit);
      if (shimmer) {
        const player = frame.game?.player;
        const angle = player && Math.hypot(player.vx, player.vy) > 18
          ? Math.atan2(player.vy, player.vx) : player?.angle ?? 0;
        kit.distort(x - Math.cos(angle) * .40, z - Math.sin(angle) * .40, 1.05, .0028 * fade, .45, true);
      }
      return;
    }
    kit.sustain(elapsed);
    // One charred footprint; the upright atlas flames above carry its height.
    this.surface(zone.id, 0, x, z, radius, zone.id * .71, zone.ability === 'napalm-charge' ? Math.PI * 2 : 0, .035, .035, fade, true);
    // A single loose smoke column rises from the hottest interior fuel pocket.
    for (let i = 0; i < (kit.low ? 1 : 2); i++) {
      const rise = kit.reducedMotion ? .5 : (kit.time * .3 + i * .23) % 1;
      kit.draw('smoke', x + Math.sin(i * 2.4 + rise) * radius * .14, 1 + rise * 2.1,
        z + Math.cos(i * 2.4 + rise) * radius * .12,
        .45 + rise * .65, .55 + rise * .5, 1, SOOT, (.3 - rise * .09) * fade);
    }

    if (shimmer) kit.distort(x, z, radius, .003 * fade, .9, true);
    if (emit && !kit.low) kit.mote('spark', x, .2, z, .08, 1.4, .04, .035, .9, CORE);
  }

  private sharedFuel(zones: readonly AbilityZoneSnapshot[], id: number, x: number, z: number): boolean {
    for (const other of zones) {
      if (other.id >= id || other.element !== 'pyro' || other.shape !== 'circle') continue;
      const dx = x - other.x / UNIT, dz = z - other.y / UNIT, radius = other.radius / UNIT;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
    return false;
  }

  private meltdown(zone: AbilityZoneSnapshot, x: number, z: number, fade: number, frame: AbilityFrame, emit: boolean): void {
    const kit = this.kit, angle = frame.game?.player.angle ?? 0, c = Math.cos(angle), s = Math.sin(angle);
    const move = frame.game?.player, moving = move && Math.hypot(move.vx, move.vy) > 18;
    const exhaustAngle = moving ? Math.atan2(-move.vy, -move.vx) : angle + Math.PI;
    const pulse = kit.reducedMotion ? 1 : .88 + Math.sin(kit.time * 8) * .12;
    const age = (zone.durationMs-zone.remainingMs)/1000;
    kit.sprite('glow', x, .055, z, 1.35, 1.1, HOT, fade * .48, zone.id, 'ground-light');
    this.suitAngle=angle;
    if (frame.marine !== this.suit) {
      this.suit=frame.marine;this.shoulders.fill(undefined);this.suit?.traverse(this.locateVents);
    }
    // Short unequal exhaust curls stay close to the heated shoulder hardware.
    // Charged seams and shoulder vents retain their attached silhouette priority.
    kit.impact();
    for (let side = -1; side <= 1; side += 2) {
      const shoulder=this.shoulders[side<0?0:1];
      shoulder?.getWorldPosition(this.vent);
      const bx = shoulder?this.vent.x-c*.14:x-c*.3-s*side*.48;
      const bz = shoulder?this.vent.z-s*.14:z-s*.3+c*side*.48;
      const base = shoulder?this.vent.y:side<0?1.3:1.25;
      kit.impact();
      kit.draw('solid', bx, base+.06, bz, .32, .20, .35, 0xd95b16, (.9 + pulse * .1) * fade, -angle);
      kit.draw('spark', bx, base+.1, bz, .18, .14, 1, CORE, .96 * fade);
      kit.sustain(age);
      // Both curls share the flame batch with the victim wick.
      const exhaust = exhaustAngle + side * .32;
      const reach = side < 0 ? .70 : .45;
      kit.flowFlame(bx, base, bz, bx + Math.cos(exhaust) * reach, base + .74,
        bz + Math.sin(exhaust) * reach, .30, zone.id + side, .78 * fade);
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

    if (emit) {
      kit.sustain(age);
      for (let i = 0; i < (kit.low ? 1 : 3); i++) {
        const turn = kit.time * 3.2 + i * 2.4, rad = .48 + i * .22;
        kit.mote('spark', x + Math.cos(turn) * rad, .15, z + Math.sin(turn) * rad,
          .18 * Math.cos(turn), 2.4 + i * .35, .18 * Math.sin(turn), .046, .92, HOT);
      }
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
    this.heatVictim = this.heatUntil = -1;
    for (const pool of this.burnYield) { pool.zone = -1; pool.seen = false; }
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
