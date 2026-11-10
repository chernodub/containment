import { ABILITY_CATALOG, ABILITY_SLOTS, RIG_CATALOG, DASH_DURATION_MS, DASH_INVULNERABLE_MS } from './catalog';
import type { AbilitiesSnapshot, AbilityEvent, AbilityId, AbilitySlot, AbilityZoneSnapshot, DeployableSnapshot, RigId } from './contract';
import type { MutationId } from '../roguelike/types';
import type { MutationTarget } from '../roguelike/MutationRuntime';

export type AbilityPoint = Readonly<{ x: number; y: number }>;
/** Simulation adapters: world collision and all damage/status reactions remain authoritative in the host. */
export interface AbilityHost {
  player: () => AbilityPoint & { angle: number; radius: number; vx: number; vy: number };
  targets: () => readonly MutationTarget[];
  visible: (from: AbilityPoint, to: AbilityPoint) => boolean;
  traverse: (from: AbilityPoint, to: AbilityPoint, radius: number) => boolean;
  movePlayer: (dx: number, dy: number) => void;
  damage: (target: MutationTarget, amount: number) => boolean;
  statuses: (id: number) => { chilled: boolean; frozen: boolean };
  status: (target: MutationTarget, kind: 'chill' | 'freeze' | 'burn' | 'shock', amount: number) => void;
  launch: (target: MutationTarget, x: number, y: number) => void;
  arc: (origin: MutationTarget, targets: readonly MutationTarget[]) => void;
  has: (id: MutationId) => boolean;
  reload: () => void;
  emit: (event: AbilityEvent, x: number, y: number) => void;
}
type SlotState = { cooldowns: number[]; cast: number; active: number };
type Cast = { id: AbilityId; x: number; y: number; angle: number; target: AbilityPoint; remaining: number };
type Zone = AbilityZoneSnapshot & { tick: number; pulses: number; damage: number };
type Deployable = DeployableSnapshot & { tick: number };

/** Distance to a finite segment; shared by actual strip/beam/link and blocker collision tests. */
export function segmentDistance(p: AbilityPoint, a: AbilityPoint, b: AbilityPoint): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

/** Deterministic Combat Rig state. Timers use simulation milliseconds, never render time. */
export class AbilitySystem {
  private rig: RigId | null = null;
  private states = Object.fromEntries(ABILITY_SLOTS.map(s => [s, { cooldowns: [], cast: 0, active: 0 }])) as Record<AbilitySlot, SlotState>;
  private charge = 0;
  private immune = 0;
  private dash: { x: number; y: number; angle: number; remaining: number; hit: Set<number>; start: AbilityPoint } | null = null;
  private casts: Cast[] = [];
  private zones: Zone[] = [];
  private deployables: Deployable[] = [];
  private serial = 0;
  private cached: AbilitiesSnapshot | null = null;
  private aimPoint: AbilityPoint | null = null;
  private movement = { x: 0, y: 0 };
  constructor(private host: AbilityHost) {}

  /** Select a rig and reset transient state. Charge is explicitly restored by the run host. */
  setRig(rig: RigId, charge = 0): void {
    this.rig = rig;
    this.charge = Number.isFinite(charge) ? Math.max(0, Math.min(1, charge)) : 0;
    this.resetRoom();
  }
  /** Clear casts, zones and deployables at a boundary; preserve the run's Overdrive meter. */
  resetRoom(): void {
    this.casts.length = this.zones.length = this.deployables.length = 0;
    this.dash = null; this.immune = 0;
    for (const state of Object.values(this.states)) { state.cooldowns.length = 0; state.cast = state.active = 0; }
    this.cached = null;
  }
  /** Feed normal movement intent and the cursor world position before an edge-triggered press. */
  setIntent(x: number, y: number, point: AbilityPoint | null): void {
    this.movement.x = Number.isFinite(x) ? x : 0; this.movement.y = Number.isFinite(y) ? y : 0;
    this.aimPoint = point && Number.isFinite(point.x) && Number.isFinite(point.y) ? { ...point } : null;
  }
  get invulnerable(): boolean { return this.immune > 0; }
  get dashing(): boolean { return this.dash !== null; }
  get hostileTimeScale(): number { return this.active('overclock') ? .3 : 1; }
  get moveSpeedMultiplier(): number { return this.active('meltdown') ? 1.25 : 1; }
  get overclocked(): boolean { return this.active('overclock'); }
  get ignitingShots(): boolean { return this.active('meltdown'); }
  private active(id: AbilityId): boolean { return !!this.rig && RIG_CATALOG[this.rig].abilities.overdrive === id && this.states.overdrive.active > 0; }
  private definition(slot: AbilitySlot) { return ABILITY_CATALOG[RIG_CATALOG[this.rig!].abilities[slot]]; }
  private maxCharges(slot: AbilitySlot): number { return this.definition(slot).charges + (slot === 'dash' && this.host.has('reserve-thruster' as MutationId) ? 1 : 0); }
  private event(id: AbilityId, phase: AbilityEvent['phase'], p: AbilityPoint, extra: Partial<AbilityEvent> = {}): void {
    const d = ABILITY_CATALOG[id], s = d.shape;
    this.host.emit({ ability: id, slot: d.slot, rig: d.rig, element: d.element, phase,
      ...(s.kind === 'circle' ? { radius: s.radius } : s.kind === 'cone' ? { length: s.range, arcRadians: s.arcRadians } : s.kind === 'line' || s.kind === 'wall' ? { length: s.length, width: s.kind === 'wall' ? s.thickness : s.width } : s.kind === 'dash' ? { length: s.distance, width: s.width } : {}), ...extra }, p.x, p.y);
  }

  /** Attempt an ability; rejected presses emit a denial without consuming a charge. */
  use(slot: AbilitySlot, enabled = true): boolean {
    if (!this.rig) return false;
    const d = this.definition(slot), p = this.host.player(), state = this.states[slot];
    const denial = !enabled ? 'blocked' : this.casts.length || this.dash ? 'casting' : slot === 'overdrive' ? this.charge < 1 || state.active > 0 ? 'no-charge' : null : state.cooldowns.length >= this.maxCharges(slot) ? 'cooldown' : null;
    if (denial) { this.event(d.id, 'denied', p, { denial }); return false; }
    let angle = p.angle;
    if (slot === 'dash') { const m = this.movement; if (m.x || m.y) angle = Math.atan2(m.y, m.x); }
    const desired = this.aimPoint ?? { x: p.x + Math.cos(angle) * d.range, y: p.y + Math.sin(angle) * d.range };
    const distance = Math.hypot(desired.x - p.x, desired.y - p.y), scale = Math.min(1, d.range / (distance || 1));
    const target = d.targeting === 'point' ? { x: p.x + (desired.x - p.x) * scale, y: p.y + (desired.y - p.y) * scale } : { x: p.x + Math.cos(angle) * d.range, y: p.y + Math.sin(angle) * d.range };
    if (d.targeting === 'point' && !this.host.traverse(p, target, d.id === 'tesla-pylon' ? 18 : 4)) { this.event(d.id, 'denied', p, { denial: 'blocked' }); return false; }
    if (slot === 'overdrive') this.charge = 0; else state.cooldowns.push(d.cooldownMs);
    this.cached = null;
    const cast: Cast = { id: d.id, x: p.x, y: p.y, angle, target, remaining: d.castMs };
    this.event(d.id, 'cast', p, { angle, targetX: target.x, targetY: target.y, durationMs: d.castMs });
    if (d.castMs) { state.cast = d.castMs; this.casts.push(cast); } else this.resolve(cast);
    return true;
  }

  /** Damage/kill receipts charge once per accepted receipt; filling emits exactly one event. */
  addCharge(damage: number, kills = 0): void {
    if (!this.rig || !Number.isFinite(damage) || !Number.isFinite(kills) || damage < 0 || kills < 0) return;
    const before = this.charge;
    this.charge = Math.min(1, this.charge + (damage / 6000 + kills * .025) * (this.host.has('drive-dynamo' as MutationId) ? 1.3 : 1));
    if (before !== this.charge) this.cached = null;
    if (before < 1 && this.charge === 1) this.event(this.definition('overdrive').id, 'overdrive-ready', this.host.player());
  }

  // Rig-specific resolution and ticking are added alongside the host integration.
  private resolve(cast: Cast): void { this.event(cast.id, 'impact', cast, { angle: cast.angle, targetX: cast.target.x, targetY: cast.target.y }); }
  /** Advance all friendly timers at normal speed. */
  update(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0 || !this.rig) return;
    ms = Math.min(ms, 100);
    this.cached = null;
    this.immune = Math.max(0, this.immune - ms);
    for (const slot of ABILITY_SLOTS) {
      const state = this.states[slot];
      for (let i = state.cooldowns.length - 1; i >= 0; i--) {
        state.cooldowns[i] -= ms;
        if (state.cooldowns[i] <= 0) { state.cooldowns.splice(i, 1); this.event(this.definition(slot).id, 'ready', this.host.player()); }
      }
      state.cast = Math.max(0, state.cast - ms);
      state.active = Math.max(0, state.active - ms);
    }
    for (let i = this.casts.length - 1; i >= 0; i--) {
      const cast = this.casts[i]; cast.remaining -= ms;
      if (cast.remaining <= 0) { this.casts.splice(i, 1); this.resolve(cast); }
    }
  }

  /** Stable immutable presentation snapshot until simulation state changes. */
  get snapshot(): AbilitiesSnapshot {
    if (this.cached) return this.cached;
    const slots = this.rig ? Object.fromEntries(ABILITY_SLOTS.map(slot => {
      const d = this.definition(slot), state = this.states[slot], charges = slot === 'overdrive' ? +(this.charge >= 1) : Math.max(0, this.maxCharges(slot) - state.cooldowns.length);
      return [slot, Object.freeze({ slot, id: d.id, ready: !this.casts.length && !this.dash && charges > 0 && (slot !== 'overdrive' || !state.active), charges, maxCharges: this.maxCharges(slot), cooldownRemainingMs: state.cooldowns.length ? Math.min(...state.cooldowns) : 0, cooldownMs: d.cooldownMs, castRemainingMs: state.cast, activeRemainingMs: state.active, activeMs: d.durationMs })];
    })) as AbilitiesSnapshot['slots'] : null;
    return this.cached = Object.freeze({ rig: this.rig, slots: slots && Object.freeze(slots), overdrive: Object.freeze({ charge: this.charge, ready: this.charge >= 1, active: this.states.overdrive.active > 0, activeRemainingMs: this.states.overdrive.active }), invulnerable: this.invulnerable, dashing: this.dashing, hostileTimeScale: this.hostileTimeScale, deployables: Object.freeze(this.deployables.map(d => Object.freeze({ ...d }))), zones: Object.freeze(this.zones.map(z => Object.freeze({ ...z }))) });
  }
}
