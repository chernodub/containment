import type { AbilityEvent, RigId } from '../../game/abilities/contract';
import type { ElementKit } from './ElementKit';
import { FxMode, type FxSlot } from './FlagshipFx';
import { ELEMENT_COLORS, UNIT, type AbilityFrame } from './types';

const WHITE = 0xf4fbff;
const RIG_COLOR: Readonly<Record<RigId, number>> = {
  breacher: ELEMENT_COLORS.kinetic, cryo: ELEMENT_COLORS.cryo, pyro: ELEMENT_COLORS.pyro, arc: ELEMENT_COLORS.arc,
};
/** Floor-state radius around the marine; presentation only (Overdrive areas keep their own exact boundaries). */
const AURA_RADIUS = 2.1;

/**
 * VFX13 shared Overdrive payoff language for every rig:
 * activation = white core flash + element shock ring + vertical light accent + exposure/camera beat;
 * sustained = an element-coloured energy field on the deck that follows the marine;
 * ending = a short contracting ring and spark fall. Uses only FlagshipFx, pooled beams and the light pool.
 */
export class OverdrivePayoff {
  private aura?: FxSlot;
  private level = 0;
  private wasActive = false;
  private color = WHITE;
  private x = 0;
  private z = 0;

  constructor(private readonly kit: ElementKit) {}

  /** Exact activation moment from the simulation event stream. */
  event(event: AbilityEvent, x: number, y: number): void {
    if (event.slot !== 'overdrive') return;
    const instant = event.ability === 'railbreaker';
    if (instant ? event.phase !== 'cast' : event.phase !== 'impact') return;
    this.activate(x / UNIT, y / UNIT, ELEMENT_COLORS[event.element], instant ? .6 : 1);
  }

  private activate(x: number, z: number, color: number, weight: number): void {
    const k = this.kit;
    k.impact();
    const core = k.fx.spawn(FxMode.Shock, x, z, .38);
    core.range = 3.2 * weight; core.h0 = .08; core.color = WHITE; core.intensity = 1.4;
    const wave = k.fx.spawn(FxMode.Shock, x, z, .55);
    wave.range = 6 * weight; wave.h0 = .06; wave.color = color; wave.intensity = 1.2;
    // Vertical accent: a brief pillar of light through the marine.
    const pillar = k.fx.spawn(FxMode.Pillar, x, z, .32);
    pillar.range = .38 * weight; pillar.h0 = .05; pillar.h1 = 4.2;
    pillar.color = color; pillar.intensity = weight;
    k.draw('spark', x, 1, z, 1.6 * weight, 1.6 * weight, 1, WHITE, 1);
    k.flash(x, z, WHITE, 30 * weight, 9, 6, .08);
    k.flash(x, z, color, 18 * weight, 10, 5, .4);
    k.distort(x, z, 6 * weight, .006, .5);
    k.exposureFlash(.55 * weight);
    k.camera(.45 * weight);
    k.anticipate(30, .04 * weight);
    for (let i = 0, n = k.low ? 8 : 26; i < n; i++) {
      const a = i * 2.39996 + .3, v = (i % 5) / 5;
      k.mote('spark', x, .3 + v, z, Math.cos(a) * (4 + v * 4), 1.5 + v * 3, Math.sin(a) * (4 + v * 4), .03, .5 + v * .4, i % 3 ? color : WHITE);
    }
  }

  private finish(x: number, z: number, color: number): void {
    const k = this.kit;
    k.impact();
    const ring = k.fx.spawn(FxMode.Shock, x, z, .3);
    ring.range = 1.6; ring.h0 = .06; ring.color = color;
    k.flash(x, z, color, 10, 5, 4, .25);
    k.beam(x, .05, z, x, 2.4, z, color, .2, .22, false);
    for (let i = 0, n = k.low ? 4 : 12; i < n; i++) {
      const a = i * 2.39996;
      k.mote('spark', x + Math.cos(a) * .5, 1.6, z + Math.sin(a) * .5, Math.cos(a) * .6, -.5, Math.sin(a) * .6, .03, .6, color);
    }
  }

  /** Per-frame: sustained floor state follows the marine; falling edge plays the ending beat. */
  update(frame: AbilityFrame): void {
    const snapshot = frame.snapshot, player = frame.game?.player;
    const rig = snapshot?.rig;
    const active = !!(frame.visible && snapshot && rig && rig !== 'breacher' && snapshot.overdrive.active && player);
    if (player) { this.x = player.x / UNIT; this.z = player.y / UNIT; }
    if (rig) this.color = RIG_COLOR[rig];
    if (this.wasActive && !active && frame.visible) this.finish(this.x, this.z, this.color);
    this.wasActive = active;
    const dt = Math.max(0, frame.dt);
    this.level += ((active ? 1 : 0) - this.level) * Math.min(1, dt * (active ? 5 : 8));
    let slot = this.aura;
    if (slot && (!slot.live || slot.mode !== FxMode.Aura || slot.life < 1000)) slot = this.aura = undefined;
    if (this.level < .01 && !active) {
      if (slot) { slot.live = false; this.aura = undefined; }
      this.level = 0;
      return;
    }
    if (!slot) {
      slot = this.aura = this.kit.fx.spawn(FxMode.Aura, this.x, this.z, 1e6);
      slot.h0 = .045; slot.range = AURA_RADIUS;
    }
    slot.x = this.x; slot.z = this.z; slot.color = this.color; slot.param = this.level;
    slot.arc = rig === 'cryo' ? 1 : rig === 'pyro' ? 2 : rig === 'arc' ? 3 : 0;
    slot.intensity = this.kit.low ? .7 : 1;
    // The suit itself becomes a light source in the element colour.
    this.kit.lightAt(990001, this.x, this.z, this.color, 6 * this.level, 5);
  }

  clear(): void {
    if (this.aura) this.aura.live = false;
    this.aura = undefined; this.level = 0; this.wasActive = false;
  }
}
