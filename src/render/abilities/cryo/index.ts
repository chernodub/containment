import type { AbilityEvent, AbilityZoneSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, type AbilityFrame, type AbilityPresentation } from '../types';
import { FxMode, type FxSlot } from '../FlagshipFx';
import type { EnemySnapshot } from '../../../game/enemies/EnemySystem';
import { authoredVariation } from '../GraphicLanguage';
import { WhiteoutState } from './WhiteoutState';

const ICE = ELEMENT_COLORS.cryo;
const CORE = 0xe8fbff;
const TAU = Math.PI * 2;
const EMPTY_ZONES: readonly AbilityZoneSnapshot[] = [];
const EMPTY_DEPLOYABLES: readonly DeployableSnapshot[] = [];
const EMPTY_ENEMIES: readonly EnemySnapshot[] = [];
const PULSE_CAPACITY = 24;
const WALL_SECTIONS = [0, .11, .24, .39, .57, .72, .87, 1] as const;
const LOW_WALL_SECTIONS = [0, .17, .39, .61, .82, 1] as const;
type ColdWave = { live: boolean; x: number; z: number; radius: number; age: number; life: number; shatter: boolean; aftermath: boolean };
type ZoneClock = { id: number; pulse: number; seen: boolean; fx?: FxSlot; fxSeed?: number };
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

  readonly storm?: WhiteoutState;
  constructor(private readonly kit: ElementKit) { if (kit.root?.isObject3D === true) this.storm = new WhiteoutState(kit.root); }

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
      // VFX13: hard ice shock front racing to the exact radius, then crystalline frost creeping over the deck.
      const shock = k.fx.spawn(FxMode.Shock, px, pz, .42);
      shock.range = radius; shock.h0 = .07; shock.color = ICE; shock.intensity = 1.3;
      const frost = k.fx.spawn(FxMode.Frost, px, pz, 6.5);
      frost.range = radius; frost.h0 = .036; frost.color = ICE;
      k.draw('spark', px, .6, pz, 1.4, 1.4, 1, CORE, 1);
      k.exposureFlash(.1);
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
        const frost = k.fx.spawn(FxMode.Frost, px, pz, 7);
        frost.range = radius; frost.color = ICE; frost.intensity = .35;
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
        const pulse = k.fx.spawn(FxMode.Shock, px, pz, .36);
        pulse.range = (event.radius ?? 100) / UNIT; pulse.color = CORE; pulse.intensity = .65;
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
    let whiteout: AbilityZoneSnapshot | undefined;
    for (const zone of frame.snapshot?.zones ?? EMPTY_ZONES) if (zone.ability === 'whiteout' && zone.remainingMs > 0) { whiteout = zone; break; }
    this.storm?.update(whiteout, k.low, k.reducedMotion, k.flashIntensity);
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
        // Native radius remains a thin boundary. Authored mist carries the rolling
        // vapor silhouette, with short overlapping cards instead of a solid torus.
        const curtainYield = Math.min(1, Math.max(0, (wave.age - .10) / .08));
        const mistCount = k.low ? 4 : 8;
        for (let i = 0; i < mistCount; i++) {
          const a = i * TAU / mistCount + .13;
          const width = Math.min(radius * .17, .58 + progress * .42);
          const r = Math.max(0, radius - width * 1.2);
          k.sprite('mist', wave.x + Math.cos(a) * r, .28 + (1 - curtainYield) * .2,
            wave.z + Math.sin(a) * r, width, .24 + (1 - curtainYield) * .22,
            CORE, fade * .4 * (1 - curtainYield * .7), i * 1.87,
            'billboard', 0, -.24);
        }
      }
      const count = k.low ? 8 : 24;
      for (let i = 0; i < count && wave.age < wave.life; i++) {
        const seed = i * 1.873, angle = (i + Math.sin(seed) * .32) * TAU / count;
        const c = Math.cos(angle), s = Math.sin(angle);
        const size = .045 + Math.sin(seed * 3.1) ** 2 * .1;
        k.draw('shard', wave.x + c * Math.max(0, radius - size * 1.65), .15 + Math.sin(i * 1.7) ** 2 * .18, wave.z + s * Math.max(0, radius - size * 1.65),
          size, size * (wave.shatter ? 3.6 : 2.7), size * .8, i % 3 ? ICE : CORE, fade * .85, angle + Math.sin(seed * 2.3) * .55, .1 + Math.sin(seed) * .12);
        if (!k.low && i % 3 === 0) {
          k.draw('smoke', wave.x + c * radius * .89, .3, wave.z + s * radius * .89,
            .65 + progress * .45, .33 + progress * .2, .1, 0xb2dce8, fade * (wave.shatter ? .12 : .38), angle);
        }
      }
      if (wave.aftermath) {
        // Crystal spikes erupt from the deck where the front passes, in leaning clusters, then sink.
        const clusters = k.low ? 6 : 16, lingering = Math.min(1, (wave.life + 2.2 - wave.age) / 1.1);
        for (let i = 0; i < clusters; i++) {
          const a = i * 2.39996323 + .4, r = wave.radius * (.38 + ((i * .618034) % 1) * .54);
          const g0 = Math.min(1, Math.max(0, (radius - r) / .35)), growth = 1 - (1 - g0) ** 3;
          if (growth <= 0) continue;
          const tall = (.5 + (i % 4) * .14) * growth * (.55 + .45 * lingering);
          for (let j = 0; j < (k.low ? 2 : 3); j++) {
            const ja = a + (j - 1) * .09, jr = r + (j - 1) * .08, h = tall * (j === 1 ? 1 : .62);
            k.draw('shard', wave.x + Math.cos(ja) * jr, h * .45, wave.z + Math.sin(ja) * jr,
              .08 + j % 2 * .03, h, .07, j === 1 ? CORE : ICE, lingering * .9 * localYield, -ja, (j - 1) * .35 + .25);
          }
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
    for (const clock of this.zones) if (!clock.seen) { if (clock.fx && clock.fx.seed === clock.fxSeed) clock.fx.live = false; clock.fx = undefined; clock.id = -1; }
    for (const state of this.walls) if (!state.seen) { state.id = -1; }
  }

  private frostStrip(zone: AbilityZoneSnapshot, whiteout?: AbilityZoneSnapshot): void {
    const k = this.kit, x = zone.x / UNIT, z = zone.y / UNIT;
    const dx = (zone.x2 - zone.x) / UNIT, dz = (zone.y2 - zone.y) / UNIT;
    const length = Math.hypot(dx, dz), direction = Math.atan2(dz, dx);
    const cx = Math.cos(direction), sz = Math.sin(direction), half = zone.width / UNIT / 2;
    if (half <= 0) return;
    const fade = Math.min(1, zone.remainingMs / 450), age = (zone.durationMs - zone.remainingMs) / 1000;
    k.sustain(age);
    let clock: ZoneClock | undefined;
    for (const item of this.zones) if (item.id === zone.id) { clock = item; break; }
    if (!clock) {
      for (const item of this.zones) if (item.id < 0) { clock = item; break; }
      if (clock) {
        clock.id = zone.id;
        const ice = k.fx.spawn(FxMode.FrostStrip, x, z, zone.remainingMs / 1000);
        ice.angle = direction; ice.range = length; ice.inner = half;
        ice.h0 = .035; ice.color = ICE; ice.intensity = .75; ice.param = 1;
      }
    }
    if (clock) clock.seen = true;
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
        i % 5 ? ICE : CORE, fade * (.55 + variation * .25) * overlapYield, -direction + Math.sin(seed) * .7, .12, 21 + variation * 3);
      if (cluster) {
        const shift = half * .12;
        k.draw('shard', px + Math.cos(direction) * shift, height * .42 + .025, pz + Math.sin(direction) * shift,
          size * .62, height * .52, size * .5, CORE, fade * .62 * overlapYield, -direction - .38, -.08, 22 + variation * 3);
      }
      if (i % (k.low ? 3 : 2) === 0) {
        const stamp = Math.min(half * .13, .10 + variation * .03);
        k.sprite('frost', px, .034, pz, stamp, stamp, ICE,
          fade * .62 * overlapYield, seed, 'ground', 0, -direction - tangent);
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
      if (!clock.fx?.live || clock.fx.mode !== FxMode.Aura || clock.fx.seed !== clock.fxSeed) {
        clock.fx = k.fx.spawn(FxMode.Aura, x, z, 1e6);
        clock.fx.h0 = .06; clock.fx.arc = 1; clock.fxSeed = clock.fx.seed;
      }
      clock.fx.x = x; clock.fx.z = z; clock.fx.range = radius;
      clock.fx.color = ICE; clock.fx.param = fade * .22; clock.fx.intensity = .45;
      const pulse = Math.floor(age / 2000);
      if (dt > 0 && pulse > clock.pulse) {
        clock.pulse = pulse;
        const front = k.fx.spawn(FxMode.Shock, x, z, .42);
        front.range = radius; front.color = ICE; front.intensity = .55; front.h0 = .055;
        k.flash(x, z, ICE, 1.1, 4, 3, .1);
      }
    }
    k.sustain(age / 1000);
    const groundYield = 1 - .65 * Math.min(1, Math.max(0, (age - 250) / 120));
    const time = k.reducedMotion ? 0 : age / 1000;
    // Connected weather is a fixed perimeter mesh. A few atlas snow wisps add
    // parallax without rebuilding the old disconnected cloud-stamp silhouette.
    const wisps = k.low ? 4 : 8;
    for (let i = 0; i < wisps; i++) {
      const seed = i * 2.731 + zone.id * .73;
      const a = i * TAU / wisps + time * .48;
      const r = radius * (i % 4 === 0 ? .46 : .87), width = Math.min(.48, radius * .045);
      k.sprite('snow', x + Math.cos(a) * r, .65 + (i % 3) * .14, z + Math.sin(a) * r,
        width, .32, CORE, fade * .72, seed, 'billboard', 0, -.72);
    }
    // Tangential gust ribbons keep the interior transparent.
    const strokes = k.low ? 3 : 6;
    for (let i = 0; i < strokes; i++) {
      const seed = i * 2.731 + zone.id, variation = authoredVariation(seed, 3);
      const a = i * TAU / strokes + time * .24 + variation * .21;
      const r = radius * (.84 + variation * .045), halfWidth = Math.min(.17, radius * .025);
      const halfLength = Math.min(radius * (.14 + variation * .08), Math.sqrt(Math.max(.001, radius * radius - (r + halfWidth) ** 2)) * .85);
      k.gust(x + Math.cos(a) * r, z + Math.sin(a) * r, halfLength * 2, halfWidth * 2,
        a + Math.PI / 2, seed, fade * (.33 + variation * .13) * groundYield);
    }
    this.targetVapor(zone, frame, fade);
    k.lightAt(zone.id, x, z, ICE, .85 * fade, 4.5);
    this.frostRims(zone, frame, fade * .85);
    k.impact();
  }

  private targetVapor(zone: AbilityZoneSnapshot, frame: AbilityFrame, fade: number): void {
    const game = frame.game, k = this.kit;
    if (!game) return;
    let count = 0;
    for (const enemy of game.enemies?.snapshot.enemies ?? EMPTY_ENEMIES) {
      if (enemy.health <= 0) continue;
      const dx = enemy.x - zone.x, dz = enemy.y - zone.y;
      if (dx * dx + dz * dz > zone.radius * zone.radius) continue;
      const status = game.boonStatuses?.(enemy.id);
      if (!status?.chilled && !status?.frozen) continue;
      const radius = enemy.radius / UNIT, actorHeight = k.statusActor?.(enemy.id)?.height ?? 1;
      const x = enemy.x / UNIT, z = enemy.y / UNIT;
      k.sprite('mist', x - .22, actorHeight * .3, z + .15,
        Math.min(.65, radius * 1.05), Math.min(.58, actorHeight * .4),
        ICE, fade * .38, enemy.id, 'billboard', 0, -.55);
      const pulseAge = ((zone.durationMs - zone.remainingMs) % 2000) / 1000;
      if (status.frozen && pulseAge < .32) {
        // Contact facets frame the feet, never a white overlay across anatomy.
        for (let i = 0; i < (k.low ? 2 : 4); i++) {
          const a = i * TAU / (k.low ? 2 : 4) + .37, r = radius * 1.25;
          if (Math.hypot(dx / UNIT, dz / UNIT) + r + .2 >= zone.radius / UNIT) continue;
          k.sprite('crystal', x + Math.cos(a) * r, .13, z + Math.sin(a) * r,
            .13, .25 * (1 - pulseAge / .32), CORE, fade * (1 - pulseAge / .32) * .65, enemy.id + i, 'vertical', -a);
        }
      }
      if (++count >= (k.low ? 2 : 4)) break;
    }
  }

  private frostRims(zone: AbilityZoneSnapshot, frame: AbilityFrame, fade: number): void {
    const geometry=frame.game?.geometry;
    if(!geometry)return;
    const k=this.kit,radius=zone.radius/UNIT,creep=Math.min(1,(zone.durationMs-zone.remainingMs)/2400);
    const width=.16+creep*.24,height=.12+creep*.14;
    let count=0;
    // Authored machinery may be a blocker or an occupied deck void. Frost only
    // their actual skirts/edges; never modify source prop materials or colliders.
    for(const rect of geometry.blockers){
      if(geometry.boundaryWalls?.includes(rect))continue;
      for(let corner=0;corner<4;corner++){
        const x=(rect.x+(corner%2)*rect.width)/UNIT,z=(rect.y+Math.floor(corner/2)*rect.height)/UNIT;
        if(Math.hypot(x-zone.x/UNIT,z-zone.y/UNIT)+Math.hypot(width,height)>=radius)continue;
        this.frostEdge(x,z,width,height,corner*Math.PI/2,fade,corner+rect.x*.13);
        if(++count>=(k.low?2:4))return;
      }
    }
    if(geometry.voids)for(const polygon of geometry.voids)for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length],x=(a.x+b.x)/UNIT/2,z=(a.y+b.y)/UNIT/2;
      if(Math.hypot(x-zone.x/UNIT,z-zone.y/UNIT)+Math.hypot(width,height)>=radius)continue;
      this.frostEdge(x,z,width,height,-Math.atan2(b.y-a.y,b.x-a.x),fade,i+a.x*.13);
      if(++count>=(k.low?2:4))return;
    }
  }

  private frostEdge(x:number,z:number,width:number,height:number,angle:number,fade:number,seed:number):void{
    this.kit.sprite('frost',x,.032,z,width,height,CORE,fade*.55,seed,'ground',0,angle);
    this.kit.sprite('frost',x,.18,z,width*.85,.14,ICE,fade*.65,seed,'vertical',angle,0);
  }

  private glacier(wall: DeployableSnapshot, dt: number): void {
    const k = this.kit, x = wall.x / UNIT, z = wall.y / UNIT;
    const length = wall.length / UNIT, thickness = wall.thickness / UNIT;
    const alongX = -Math.sin(wall.angle), alongZ = Math.cos(wall.angle);
    const faceX = Math.cos(wall.angle), faceZ = Math.sin(wall.angle);
    const age = (wall.durationMs - wall.remainingMs) / 1000;
    const fade = Math.min(1, wall.remainingMs / 130);
    let state: WallState | undefined;
    for (const item of this.walls) if (item.id === wall.id) { state = item; break; }
    if (!state) for (const item of this.walls) if (item.id === -1) {
      state = item; item.id = wall.id; item.health = wall.health; item.flash = 0;
      const base = k.fx.spawn(FxMode.Frost, x, z, wall.remainingMs / 1000 + 3);
      base.range = Math.min(thickness * .5, length * .5); base.color = ICE; base.intensity = .6;
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
    // A low continuous frozen ridge grounds unequal tapered crystals. Texture
    // facets carry the internal light; no folded planes or procedural glow seams.
    const baseRise = k.reducedMotion ? 1 : Math.min(1, Math.max(.02, age / .095));
    k.draw('shard', x, .30 * baseRise, z, thickness * .46, .30 * baseRise, length * .5,
      0x3c809d, fade * .96, -wall.angle, 0, 3.7);
    k.sprite('frost', x, .036, z, length * .51, thickness * .74, ICE, fade * .42, wall.id, 'ground', 0, -wall.angle - Math.PI / 2);
    const sections = k.low ? LOW_WALL_SECTIONS : WALL_SECTIONS, count = sections.length - 1;
    for (let i = 0; i < count; i++) {
      const seed = wall.id * .73 + i * 2.731, variation = authoredVariation(seed, 2);
      const lo = sections[i] * length - length * .5, hi = sections[i + 1] * length - length * .5;
      const offset = (lo + hi) * .5, column = hi - lo;
      const rise = k.reducedMotion ? 1 : Math.min(1, Math.max(.02, (age - i * .012) / .095));
      const height = (1.45 + variation * 1.5 + (i % 3 === 1 ? .38 : 0)) * rise;
      const yaw = -wall.angle + (variation - .5) * .075;
      const px = x + alongX * offset, pz = z + alongZ * offset;
      const width = Math.min(column * .58, length * .5 - Math.abs(offset) - thickness * .06);
      const depth = thickness * (.37 - Math.abs(Math.sin(yaw + wall.angle)) * .4);
      // Unequal tapered crystal teeth share the same exact native blocking strip.
      k.draw('shard', px, height * .5, pz, depth, height * .5, width,
        i % 2 ? 0x61badb : 0x9adcec, fade * .94, yaw, 0, 22 + variation * 4);
      if (i === 0 || i === count - 1 || !k.low && i === 2) {
        const ankle = .22 + variation * .14;
        k.draw('shard', px, ankle, pz, thickness * .39, ankle,
          Math.min(width, length * .5 - Math.abs(offset)), 0x4e8baf, fade * .68, -wall.angle, 0, 8 + variation);
      }
      if (!k.low && this.emitMist && i % 3 === 0) {
        k.mote('smoke', px, .12, pz, faceX * .1, .04, faceZ * .1, .3, .8, 0x8eafc0);
      }
      // Subsurface core follows each erupting tooth and stays inside its native footprint.
      k.ribbon(px, .08, pz, px, Math.max(.09, height * .76), pz,
        CORE, Math.min(.028, depth * .12), fade * (.18 + (state?.flash ?? 0) * .45), false);
      // Dark oblique seams make health loss read as cracking rather than a white flash.
      const damage = Math.min(1, (state?.flash ?? 0));
      if (damage > .05) {
        k.ribbon(px - alongX * width * .45, height * .28, pz - alongZ * width * .45,
          px + alongX * width * .35, height * .69, pz + alongZ * width * .35,
          0x234c64, .018, fade * damage * .72, false);
      }
      if ((state?.flash ?? 0) > .1 && i % 2 === 0) {
        k.sprite('star', px, height * .57, pz, .14, .3, CORE,
          fade * (state?.flash ?? 0) * .45, seed, 'light');
      }

    }
    k.lightAt(wall.id, x, z, ICE, 2.6 * fade, 4.8);
    k.impact();
  }

  clear(): void {
    this.storm?.clear();
    for (const wave of this.waves) wave.live = false;
    for (const clock of this.zones) { if (clock.fx && clock.fx.seed === clock.fxSeed) clock.fx.live = false; clock.fx = undefined; clock.id = -1; clock.pulse = 0; clock.seen = false; }
    for (const state of this.walls) { state.id = -1; state.flash = 0; state.seen = false; }
    this.cursor = 0; this.mistAge = 0; this.emitMist = false;
  }

  dispose(): void { if (this.disposed) return; this.clear(); this.storm?.dispose(); this.disposed = true; }
}

/** Registry factory; all GPU resources remain owned by ElementKit. */
export function createCryoPresentation(kit: ElementKit): AbilityPresentation {
  return new CryoPresentation(kit);
}
