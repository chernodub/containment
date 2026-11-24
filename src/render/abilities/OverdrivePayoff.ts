import type { AbilityEvent, RigId } from '../../game/abilities/contract';
import type { ElementKit } from './ElementKit';
import { FxMode, type FxSlot } from './FlagshipFx';
import { ELEMENT_COLORS, UNIT, type AbilityFrame } from './types';

const WHITE = 0xf4fbff;
const ICE = ELEMENT_COLORS.cryo;
const FIRE = ELEMENT_COLORS.pyro;
const HOT = 0xffc46a;
const VIOLET = ELEMENT_COLORS.arc;
const AMBER = ELEMENT_COLORS.kinetic;
const RIG_COLOR: Readonly<Record<RigId, number>> = { breacher: AMBER, cryo: ICE, pyro: FIRE, arc: VIOLET };
/** Overclock has no native area; its fracture field is presentation-only around the marine. */
const ARC_FIELD = 5.5;

/**
 * VFX15: four different Overdrive climaxes (no shared ring template).
 * - Whiteout: a jagged frost wall races over the deck, ice grows up enemies, freeze pulses travel crack lines.
 * - Meltdown: the suit vents a heat column, molten cracks and blisters spread under him, nearby enemies stand in flame.
 * - Overclock: chromatic time-fracture snap, glass cracks flicker, lightning crawls between enemies and machinery.
 * - Railbreaker: converging charge and a narrow amber column; the lance itself owns the payoff.
 * Floor states use FlagshipFx Climax (one prepared program); the native area keeps only a thin element line.
 */
export class OverdrivePayoff {
  private climax?: FxSlot;
  private climaxSeed = -1;
  private level = 0;
  private wasActive = false;
  private rig: RigId = 'breacher';
  private x = 0;
  private z = 0;
  private radius = ARC_FIELD;
  private age = 0;
  private arcClock = 0;
  constructor(private readonly kit: ElementKit) {}

  event(event: AbilityEvent, x: number, y: number): void {
    if (event.slot !== 'overdrive') return;
    const px = x / UNIT, pz = y / UNIT, k = this.kit;
    if (event.ability === 'railbreaker') { if (event.phase === 'cast') this.rail(px, pz, (event.durationMs ?? 300) / 1000); return; }
    if (event.phase !== 'impact') return;
    this.rig = event.rig; this.x = px; this.z = pz; this.age = 0; this.level = 1;
    this.radius = event.radius ? event.radius / UNIT : ARC_FIELD;
    this.ensure();
    k.impact();
    if (event.ability === 'whiteout') {
      k.flash(px, pz, WHITE, 22, this.radius, 6, .1);
      k.flash(px, pz, ICE, 12, this.radius + 2, 5, .5);

      k.camera(.4);
      k.distort(px, pz, this.radius, -.006, .6);
      // The air crystallises: a short upward burst of shards, no ring.
      for (let i = 0, n = k.low ? 8 : 28; i < n; i++) {
        const a = i * 2.39996, v = (i % 5) / 5;
        k.mote('shard', px + Math.cos(a) * .6, .3, pz + Math.sin(a) * .6, Math.cos(a) * (3 + v * 5), 1.2 + v * 2.5, Math.sin(a) * (3 + v * 5), .07 + v * .06, .9, 0x5799b0);
      }
    } else if (event.ability === 'meltdown') {
      const column = k.fx.spawn(FxMode.Pillar, px, pz, 1.1);
      column.param = 1; column.range = .82; column.h0 = .05; column.h1 = 2.9; column.color = HOT; column.intensity = 1.3;
      k.flash(px, pz, HOT, 28, 9, 6, .12);
      k.flash(px, pz, FIRE, 16, 8, 5, .7);

      k.grade(.8);
      k.camera(.42);
      k.distort(px, pz, 3.5, .007, 1.1, true);
      for (let i = 0, n = k.low ? 6 : 22; i < n; i++) {
        const a = i * 2.39996, v = (i % 5) / 5;
        k.mote('spark', px, 1.2 + v, pz, Math.cos(a) * (1 + v * 2), 4 + v * 4, Math.sin(a) * (1 + v * 2), .035, .9 + v * .4, i % 2 ? HOT : FIRE);
      }
    } else if (event.ability === 'overclock') {
      // Hard chromatic snap: white/cyan/violet light split, inward space kick, then the fracture field.
      k.flash(px, pz, WHITE, 30, 10, 6, .05);
      k.flash(px + .6, pz, 0x7fe6ff, 14, 8, 5, .14);
      k.flash(px - .6, pz, 0xd06bff, 14, 8, 5, .14);

      k.grade(0, .9);
      k.camera(.45);
      k.anticipate(28, .05);
      k.distort(px, pz, 6, -.008, .35);
      this.arcClock = 0;
    }
  }

  private rail(x: number, z: number, charge: number): void {
    const k = this.kit;
    k.impact();
    const column = k.fx.spawn(FxMode.Pillar, x, z, Math.max(.25, charge + .1));
    column.range = .22; column.h0 = .05; column.h1 = 3.6; column.color = AMBER; column.intensity = .9;
    k.flash(x, z, AMBER, 10, 5, 4, Math.max(.2, charge));
    k.camera(.18);
    // Charge converges on the rig: sparks fly inward from a 2.5 m shell.
    for (let i = 0, n = k.low ? 6 : 20; i < n; i++) {
      const a = i * 2.39996, d = 2.2 + (i % 4) * .2, life = Math.max(.15, charge * .9);
      k.mote('spark', x + Math.cos(a) * d, .4 + (i % 3) * .4, z + Math.sin(a) * d,
        -Math.cos(a) * d / life, .2, -Math.sin(a) * d / life, .03, life, i % 3 ? AMBER : WHITE);
    }
  }

  private ensure(): FxSlot {
    let slot = this.climax;
    if (!slot || !slot.live || slot.seed !== this.climaxSeed || slot.mode !== FxMode.Climax) {
      slot = this.climax = this.kit.fx.spawn(FxMode.Climax, this.x, this.z, 1e6);
      this.climaxSeed = slot.seed; slot.h0 = .043;
    }
    return slot;
  }

  private finish(): void {
    const k = this.kit, x = this.x, z = this.z;
    k.impact();
    if (this.rig === 'cryo') {
      const shatter = k.fx.spawn(FxMode.Crack, x, z, .9);
      shatter.range = Math.min(this.radius, 5); shatter.h0 = .05; shatter.color = ICE;
      k.debris(x, z, 3, 'cryo', 24);
      k.flash(x, z, ICE, 10, 7, 4, .25);
      k.camera(.2);
    } else if (this.rig === 'pyro') {
      k.flash(x, z, FIRE, 8, 5, 4, .4);
      for (let i = 0, n = k.low ? 3 : 9; i < n; i++) {
        const a = i * 2.39996;
        k.mote('smoke', x + Math.cos(a) * .7, .4, z + Math.sin(a) * .7, Math.cos(a) * .4, .8, Math.sin(a) * .4, .45, 1.6, 0x1a1512);
      }
    } else if (this.rig === 'arc') {
      // Reverse snap: space kicks outward once, violet light collapses into the suit.
      k.flash(x, z, WHITE, 18, 7, 5, .05);
      k.flash(x, z, VIOLET, 10, 6, 4, .2);

      k.distort(x, z, 5, .006, .25);
      k.camera(.22);
      for (let i = 0; i < (k.low ? 3 : 7); i++) {
        const a = i * 2.39996;
        k.beam(x + Math.cos(a) * 3.2, .3, z + Math.sin(a) * 3.2, x, 1.1, z, i % 2 ? VIOLET : WHITE, .03, .14, true);
      }
    }
  }

  update(frame: AbilityFrame): void {
    const snapshot = frame.snapshot, game = frame.game, player = game?.player;
    const rig = snapshot?.rig;
    const active = !!(frame.visible && snapshot && rig && rig !== 'breacher' && snapshot.overdrive.active && player);
    const dt = Math.max(0, frame.dt);
    if (rig && active) this.rig = rig;
    if (active && player) { this.x = player.x / UNIT; this.z = player.y / UNIT; }
    // Whiteout and Meltdown keep the exact native zone; Overclock follows the marine.
    if (active && snapshot) for (const zone of snapshot.zones) {
      if (zone.remainingMs <= 0) continue;
      if ((this.rig === 'cryo' && zone.ability === 'whiteout') || (this.rig === 'pyro' && zone.ability === 'meltdown')) {
        this.x = zone.x / UNIT; this.z = zone.y / UNIT; this.radius = zone.radius / UNIT; break;
      }
    }
    if (this.rig === 'arc') this.radius = ARC_FIELD;
    if (this.wasActive && !active && frame.visible) this.finish();
    if (!this.wasActive && active && this.level < .5) this.age = 0;
    this.wasActive = active;
    this.age += dt;
    this.level += ((active ? 1 : 0) - this.level) * Math.min(1, dt * (active ? 6 : 1.65));
    let slot = this.climax;
    if (slot && (!slot.live || slot.seed !== this.climaxSeed || slot.mode !== FxMode.Climax)) slot = this.climax = undefined;
    if (this.level < .01 && !active) {
      if (slot) { slot.live = false; this.climax = undefined; }
      this.level = 0;
      return;
    }
    slot = this.ensure();
    slot.x = this.x; slot.z = this.z; slot.range = this.radius; slot.color = RIG_COLOR[this.rig];
    slot.arc = this.rig === 'cryo' ? 1 : this.rig === 'pyro' ? 2 : 3;
    slot.param = this.level; slot.intensity = this.kit.low ? .75 : 1;
    if (active && this.rig === 'pyro' && this.age < .65) {
      const progress = this.age / .65;
      this.kit.front(this.x, this.z, this.radius * 2.5, progress, HOT, .14, 1 - progress, 1);
    }
    if (active && game && this.rig === 'arc') {
      this.kit.sustain(this.age);
      this.crawl(game, dt);
      this.kit.impact();
    }
  }

  /** Lightning crawls along nearby machinery edges, re-struck ~9 times a second. */
  private crawl(game: NonNullable<AbilityFrame['game']>, dt: number): void {
    const k = this.kit;
    this.arcClock -= dt;
    if (this.arcClock > 0) return;
    this.arcClock = k.low ? .22 : .11;
    const tick = Math.floor(this.age * 9);
    const blockers = game.geometry?.blockers;
    if (!blockers || k.low) return;
    let lit = 0;
    for (let i = 0; i < blockers.length && lit < 2; i++) {
      const b = blockers[(i + tick) % blockers.length];
      const x0 = b.x / UNIT, z0 = b.y / UNIT, x1 = (b.x + b.width) / UNIT, z1 = (b.y + b.height) / UNIT;
      const cx = Math.max(x0, Math.min(this.x, x1)), cz = Math.max(z0, Math.min(this.z, z1));
      if (Math.hypot(cx - this.x, cz - this.z) > 6) continue;
      lit++;
      // Crawl along the nearest machinery face, from the marine-side point toward a far corner.
      const tx = Math.abs(cx - x0) < Math.abs(cx - x1) ? x1 : x0, tz = Math.abs(cz - z0) < Math.abs(cz - z1) ? z1 : z0;
      k.beam(cx, 1.05, cz, (cx + tx) * .5, .95, (cz + tz) * .5, VIOLET, .028, .12, true);
      k.flash(cx, cz, VIOLET, 3, 3, 2, .1);
    }
  }

  clear(): void {
    if (this.climax && this.climax.seed === this.climaxSeed) this.climax.live = false;
    this.climax = undefined; this.level = 0; this.wasActive = false; this.age = 0;
  }
}
