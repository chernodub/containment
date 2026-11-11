import { sweptCircle } from '../combat/enemyContact';
import { sweptLinkContact } from './linkGeometry';
import { ABILITY_CATALOG, ABILITY_SLOTS, RIG_CATALOG, DASH_DURATION_MS, DASH_INVULNERABLE_MS } from './catalog';
import type { AbilitiesSnapshot, AbilityDefinition, AbilityEvent, AbilityId, AbilitySlot, AbilityZoneSnapshot, DeployableSnapshot, RigId } from './contract';
import type { MutationId } from '../roguelike/types';
import type { MutationTarget } from '../roguelike/MutationRuntime';

const TIMER_EPSILON = 1e-7;
const countdown = (remaining: number, ms: number): number => remaining - ms <= TIMER_EPSILON ? 0 : remaining - ms;

/** Coordinates in deterministic world units. */
export type AbilityPoint = Readonly<{ x: number; y: number }>;
/** Simulation adapters: world collision and all damage/status reactions remain authoritative in the host. */
export interface AbilityHost {
  enabled?: () => boolean;
  /** Accepted Overdrives allowed between room resets; omitted hosts remain unlimited. */
  overdriveRoomLimit?: () => number;
  /** Immutable world-geometry identity/revision for placement-cache invalidation. */
  placementRevision?: () => unknown;
  /** Advance shared friendly status/launch clocks to the next ability event boundary. */
  advance?: (ms: number) => void;
  player: () => AbilityPoint & { angle: number; radius: number; vx: number; vy: number };
  targets: () => readonly MutationTarget[];
  visible: (from: AbilityPoint, to: AbilityPoint) => boolean;
  traverse: (from: AbilityPoint, to: AbilityPoint, radius: number) => boolean;
  movePlayer: (dx: number, dy: number) => void;
  damage: (target: MutationTarget, amount: number) => boolean;
  statuses: (id: number) => { chilled: boolean; frozen: boolean; shocked?: boolean };
  status: (target: MutationTarget, kind: 'chill' | 'freeze' | 'burn' | 'shock', amount: number) => void;
  launch: (target: MutationTarget, x: number, y: number) => void;
  arc: (origin: MutationTarget, targets: readonly MutationTarget[]) => void;
  has: (id: MutationId) => boolean;
  reload: () => void;
  emit: (event: AbilityEvent, x: number, y: number) => void;
}
type SlotState = { cooldowns: number[]; cast: number; active: number };
type Placement = AbilityPoint & { radius?: number };
type Cast = { id: AbilityId; x: number; y: number; angle: number; target: AbilityPoint; remaining: number; placements?: readonly Placement[]; radius?: number; ground?: AbilityPoint };
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Zone = Mutable<AbilityZoneSnapshot> & { tick: number; pulses: number; damage: number };
type Deployable = Mutable<DeployableSnapshot> & { tick: number; assault: number; linkCooldowns: Map<number, number> };
/** Hard caps on persistent entities and per-effect target fanout. */
export const ABILITY_LIMITS = Object.freeze({ zones: 24, deployables: 8, targets: 64 });

/** Distance to a finite segment; shared by actual strip/beam/link and blocker collision tests. */
export function segmentDistance(p: AbilityPoint, a: AbilityPoint, b: AbilityPoint): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

/** Deterministic Combat Rig state. Timers use simulation milliseconds, never render time. */
export class AbilitySystem {
  private rig: RigId | null = null;
  private states = Object.fromEntries(ABILITY_SLOTS.map(s => [s, { cooldowns: [], cast: 0, active: 0 }])) as unknown as Record<AbilitySlot, SlotState>;
  private charge = 0;
  private overdriveUses = 0;
  private immune = 0;
  private dash: { x: number; y: number; angle: number; remaining: number; hit: Set<number>; start: AbilityPoint } | null = null;
  private casts: Cast[] = [];
  private zones: Zone[] = [];
  private deployables: Deployable[] = [];
  private serial = 0;
  private killDepth = 0;
  private afterquakes: Array<Cast & { delay: number }> = [];
  private cached: AbilitiesSnapshot | null = null;
  private cachedEnabled = true;
  private aimPoint: AbilityPoint | null = null;
  private movement = { x: 0, y: 0 };
  private previousTargets = new Map<number, { x: number; y: number }>();
  private currentTargetIds = new Set<number>();
  private previousMarine = { x: 0, y: 0 };
  private hasPreviousMarine = false;
  private cachedLinkX = 0;
  private cachedLinkY = 0;
  private placementCache: { rig: RigId; x: number; y: number; angle: number; aimX: number | undefined; aimY: number | undefined; augments: number; revision: unknown; result: boolean } | null = null;
  constructor(private host: AbilityHost) {}

  /** Select a rig and reset transient state. Charge is explicitly restored by the run host. */
  setRig(rig: RigId, charge = 0): void {
    this.rig = rig;
    this.charge = Number.isFinite(charge) ? Math.max(0, Math.min(1, charge)) : 0;
    this.resetRoom();
  }
  /** Clear casts, zones and deployables at a boundary; preserve the run's Overdrive meter. */
  resetRoom(): void {
    this.casts.length = this.zones.length = this.deployables.length = this.afterquakes.length = 0;
    this.dash = null; this.immune = 0; this.aimPoint = null; this.movement.x = this.movement.y = 0;
    this.overdriveUses = 0;
    this.previousTargets.clear(); this.currentTargetIds.clear(); this.hasPreviousMarine = false; this.placementCache = null;
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
  /** Hostile simulation time for the next friendly step, including a partial Overclock expiry. */
  hostileDelta(ms: number): number { return Number.isFinite(ms) && ms > 0 ? ms - (this.overclocked ? Math.min(ms, this.states.overdrive.active) * .7 : 0) : 0; }
  get moveSpeedMultiplier(): number { return this.active('meltdown') ? 1.4 : 1; }
  get overclocked(): boolean { return this.active('overclock'); }
  get ignitingShots(): boolean { return this.active('meltdown'); }
  private active(id: AbilityId): boolean { return !!this.rig && RIG_CATALOG[this.rig].abilities.overdrive === id && this.states.overdrive.active > 0; }
  private get overdriveRoomLimited(): boolean { return this.overdriveUses >= (this.host.overdriveRoomLimit?.() ?? Infinity); }
  private definition(slot: AbilitySlot) { return ABILITY_CATALOG[RIG_CATALOG[this.rig!].abilities[slot]]; }
  private maxCharges(slot: AbilitySlot): number { return this.definition(slot).charges + (slot === 'dash' && this.host.has('reserve-thruster' as MutationId) ? 1 : 0); }
  private event(id: AbilityId, phase: AbilityEvent['phase'], p: AbilityPoint, extra: Partial<AbilityEvent> = {}): void {
    // Subscribers may synchronously inspect the snapshot during an emitted phase.
    if (phase !== 'denied') this.cached = null;
    const d = ABILITY_CATALOG[id], s = d.shape;
    this.host.emit({ ability: id, slot: d.slot, rig: d.rig, element: d.element, phase,
      ...(s.kind === 'circle' ? { radius: s.radius } : s.kind === 'cone' ? { length: s.range, arcRadians: s.arcRadians } : s.kind === 'line' || s.kind === 'wall' ? { length: s.length, width: s.kind === 'wall' ? s.thickness : s.width } : s.kind === 'dash' ? { length: s.distance, width: s.width } : s.kind === 'chain' ? { length: s.range, hopRange: s.hopRange, maxTargets: s.maxTargets + (this.host.has('forked-overload') ? 2 : 0) } : {}), ...extra }, p.x, p.y);
  }

  /** Attempt an ability; rejected presses emit a denial without consuming a charge. */
  use(slot: AbilitySlot, enabled = true): boolean {
    if (!this.rig) { this.event(RIG_CATALOG.breacher.abilities[slot], 'denied', this.host.player(), { denial: 'no-rig' }); return false; }
    const d = this.definition(slot), p = this.host.player(), state = this.states[slot];
    enabled = enabled && this.host.enabled?.() !== false;
    const denial = !enabled || (slot === 'overdrive' && this.overdriveRoomLimited) || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.angle) ? 'blocked' : this.casts.length || this.dash ? 'casting' : slot === 'overdrive' ? this.charge < 1 || state.active > 0 ? 'no-charge' : null : state.cooldowns.length >= this.maxCharges(slot) ? 'cooldown' : null;
    if (denial) { this.event(d.id, 'denied', p, { denial }); return false; }
    let angle = p.angle;
    if (slot === 'dash') { const m = this.movement; if (m.x || m.y) angle = Math.atan2(m.y, m.x); }
    const target = this.targetFor(d, p, angle);
    const cast: Cast = { id: d.id, x: p.x, y: p.y, angle, target, remaining: d.castMs };
    if (d.id === 'cryo-nova') cast.radius = 210 + (this.host.has('spreading-nova') ? Math.min(100, this.nearby(cast, 210).filter(t => this.host.statuses(t.id).chilled).length * 20) : 0);
    if (d.id === 'flashfire' && this.host.has('scorched-fan')) {
      const point = { x: cast.x + Math.cos(angle) * 180, y: cast.y + Math.sin(angle) * 180 };
      if (this.host.visible(cast, point)) cast.ground = point;
    }
    if (slot === 'power') {
      this.placementCache = null;
      cast.placements = this.planPlacements(cast);
      if (!cast.placements.length) { this.event(d.id, 'denied', p, { denial: 'blocked' }); return false; }
    }
    if (slot === 'overdrive') { this.charge = 0; this.overdriveUses++; } else state.cooldowns.push(d.cooldownMs);
    this.cached = null;
    if (d.castMs) { state.cast = d.castMs; this.casts.push(cast); }
    for (const preview of cast.placements ?? [target]) this.event(d.id, 'cast', p, {
      angle, targetX: preview.x, targetY: preview.y, durationMs: d.castMs,
      ...(cast.radius === undefined ? {} : { radius: cast.radius }),
      ...('radius' in preview ? { radius: preview.radius } : {}),
    });
    if (cast.ground) this.event(cast.id, 'cast', p, { targetX: cast.ground.x, targetY: cast.ground.y, radius: 120, length: undefined, arcRadians: undefined, durationMs: d.castMs });
    if (!d.castMs) this.resolve(cast);
    return true;
  }

  /** Damage/kill receipts charge once per accepted receipt; filling emits exactly one event. */
  addCharge(damage: number, kills = 0): void {
    if (!this.rig || !Number.isFinite(damage) || !Number.isFinite(kills) || damage < 0 || kills < 0) return;
    const before = this.charge;
    const next = this.charge + (damage / 12000 + kills * .0125) * (this.host.has('drive-dynamo' as MutationId) ? 1.3 : 1);
    this.charge = next >= 1 - TIMER_EPSILON ? 1 : next;
    if (before !== this.charge) this.cached = null;
    if (before < 1 && this.charge === 1 && !this.overdriveRoomLimited) this.event(this.definition('overdrive').id, 'overdrive-ready', this.host.player());
  }

  private nearby(point: AbilityPoint, radius: number): MutationTarget[] {
    return this.host.targets().filter(t => t.health > 0 && Math.hypot(t.x - point.x, t.y - point.y) <= radius && this.host.visible(point, t))
      .sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y) || a.id - b.id).slice(0, ABILITY_LIMITS.targets);
  }
  private hit(t: MutationTarget, damage: number, kind?: 'chill' | 'freeze' | 'burn' | 'shock', amount = 1): void {
    // Status is applied before damage so a lethal ability still participates in frozen/burning kill reactions.
    if (kind) this.host.status(t, kind, amount);
    this.host.damage(t, damage);
  }
  private radial(cast: Cast, radius: number, damage: number, kind?: 'chill' | 'burn', launch = 0): number[] {
    const ids: number[] = [];
    for (const t of this.nearby(cast, radius)) {
      if (launch) { const a = Math.atan2(t.y - cast.y, t.x - cast.x); this.host.launch(t, Math.cos(a) * launch, Math.sin(a) * launch); }
      this.hit(t, damage, kind, kind === 'chill' ? 2 : 1); ids.push(t.id);
    }
    return ids;
  }
  private addZone(id: AbilityId, p: AbilityPoint, radius: number, duration: number, damage: number, attached = false, end?: AbilityPoint, width = 0): void {
    if (this.zones.length >= ABILITY_LIMITS.zones) { const old = this.zones.shift()!; this.event(old.ability, 'end', old, { entityId: old.id }); }
    const d = ABILITY_CATALOG[id];
    const zone: Zone = { id: ++this.serial, ability: id, element: d.element, shape: end ? 'strip' : 'circle', x: p.x, y: p.y, x2: end?.x ?? p.x, y2: end?.y ?? p.y, width, radius, attached, remainingMs: duration, durationMs: duration, tick: 250, pulses: 0, damage };
    this.zones.push(zone);
    this.states[d.slot].active = Math.max(this.states[d.slot].active, duration);
    this.event(id, 'tick', p, { entityId: zone.id, radius, targetX: zone.x2, targetY: zone.y2, width, durationMs: duration, ...(end ? { length: Math.hypot(end.x - p.x, end.y - p.y) } : id === 'flashfire' ? { length: undefined, arcRadians: undefined } : {}) });
  }
  private wallFits(p: AbilityPoint, angle: number, length: number, thickness: number): boolean {
    const dx = -Math.sin(angle) * length / 2, dy = Math.cos(angle) * length / 2;
    return this.host.traverse({ x: p.x - dx, y: p.y - dy }, { x: p.x + dx, y: p.y + dy }, thickness / 2);
  }
  private targetFor(d: AbilityDefinition, p: AbilityPoint, angle: number): AbilityPoint {
    const range = d.shape.kind === 'dash' ? d.shape.distance : d.range;
    const desired = this.aimPoint ?? { x: p.x + Math.cos(angle) * range, y: p.y + Math.sin(angle) * range };
    const distance = Math.hypot(desired.x - p.x, desired.y - p.y), scale = Math.min(1, d.range / (distance || 1));
    return d.targeting === 'point' ? { x: p.x + (desired.x - p.x) * scale, y: p.y + (desired.y - p.y) * scale }
      : { x: p.x + Math.cos(angle) * range, y: p.y + Math.sin(angle) * range };
  }
  private powerPlacementAvailable(): boolean {
    const p = this.host.player(), rig = this.rig!;
    const augments = +this.host.has('twin-glacier') + 2 * +this.host.has('twin-pylon') + 4 * +this.host.has('napalm-triplet');
    const revision = this.host.placementRevision?.(), cached = this.placementCache;
    if (cached && cached.rig === rig && cached.x === p.x && cached.y === p.y && cached.angle === p.angle && cached.aimX === this.aimPoint?.x && cached.aimY === this.aimPoint?.y && cached.augments === augments && cached.revision === revision) return cached.result;
    const d = this.definition('power');
    const result = this.planPlacements({ id: d.id, x: p.x, y: p.y, angle: p.angle,
      target: this.targetFor(d, p, p.angle), remaining: d.castMs }).length > 0;
    this.placementCache = { rig, x: p.x, y: p.y, angle: p.angle, aimX: this.aimPoint?.x, aimY: this.aimPoint?.y, augments, revision, result };
    return result;
  }
  private planPlacements(cast: Cast): Placement[] {
    const d = ABILITY_CATALOG[cast.id];
    const glacier = cast.id === 'glacier', pylon = cast.id === 'tesla-pylon';
    const triplet = cast.id === 'napalm-charge' && this.host.has('napalm-triplet');
    const offsets = glacier && this.host.has('twin-glacier') ? [-40, 40]
      : pylon && this.host.has('twin-pylon') ? [-50, 50] : triplet ? [-100, 0, 100] : [0];
    const radius = triplet ? 80 : d.shape.kind === 'circle' ? d.shape.radius : undefined;
    const result: Placement[] = [];
    for (const offset of offsets) {
      const along = glacier ? offset : 0, lateral = glacier ? 0 : offset;
      const p: Placement = { x: cast.target.x + Math.cos(cast.angle) * along - Math.sin(cast.angle) * lateral,
        y: cast.target.y + Math.sin(cast.angle) * along + Math.cos(cast.angle) * lateral,
        ...(radius === undefined ? {} : { radius }) };
      if (this.host.traverse(cast, p, pylon ? 18 : 4) &&
        (d.shape.kind !== 'wall' || this.wallFits(p, cast.angle, d.shape.length, d.shape.thickness))) result.push(p);
    }
    return result;
  }
  private deploy(cast: Cast, p: AbilityPoint): void {
    const d = ABILITY_CATALOG[cast.id], wall = d.shape.kind === 'wall' ? d.shape : null;
    if (this.deployables.length >= ABILITY_LIMITS.deployables) this.removeDeployable(this.deployables[0]);
    const reinforced = cast.id === 'bulwark' && this.host.has('reinforced-bulwark' as MutationId);
    const duration = d.durationMs + (reinforced ? 2000 : 0), health = (cast.id === 'glacier' ? 160 : cast.id === 'bulwark' ? 240 : 100) * (reinforced ? 2 : 1);
    const entity: Deployable = { id: ++this.serial, ability: cast.id, element: d.element, kind: cast.id === 'glacier' ? 'ice-wall' : cast.id === 'bulwark' ? 'barrier' : 'pylon', x: p.x, y: p.y, angle: cast.angle, length: wall?.length ?? 0, thickness: wall?.thickness ?? 0, radius: cast.id === 'tesla-pylon' ? 18 : 0, remainingMs: duration, durationMs: duration, health, maxHealth: health, tick: 500, assault: 250, linkCooldowns: new Map() };
    this.deployables.push(entity); this.states[d.slot].active = Math.max(this.states[d.slot].active, duration);
    this.event(cast.id, 'tick', p, { entityId: entity.id, durationMs: duration, angle: cast.angle });
  }
  private wallDistance(target: MutationTarget, dx: number, dy: number): number {
    const maximum = 1600; // Beyond the longest authored room dimension; bounded binary search.
    if (this.host.traverse(target, { x: target.x + dx * maximum, y: target.y + dy * maximum }, target.radius)) return maximum;
    let clear = 0, blocked = maximum;
    for (let i = 0; i < 12; i++) {
      const middle = (clear + blocked) / 2;
      if (this.host.traverse(target, { x: target.x + dx * middle, y: target.y + dy * middle }, target.radius)) clear = middle;
      else blocked = middle;
    }
    return clear;
  }
  private resolve(cast: Cast): void {
    const d = ABILITY_CATALOG[cast.id];
    let ids: number[] = [];
    if (d.slot === 'dash') {
      const distance = d.shape.kind==='dash'?d.shape.distance:150;
      this.dash = { x: Math.cos(cast.angle) * distance, y: Math.sin(cast.angle) * distance, angle: cast.angle, remaining: DASH_DURATION_MS, hit: new Set(), start: { x: cast.x, y: cast.y } };
      this.immune = DASH_INVULNERABLE_MS;
      if (this.host.has('slide-loader' as MutationId)) this.host.reload();
      this.event(cast.id, 'dash-start', cast, { angle: cast.angle, targetX: cast.x + this.dash.x, targetY: cast.y + this.dash.y, durationMs: DASH_DURATION_MS });
    } else switch (cast.id) {
      case 'seismic-slam':
        ids = this.radial(cast, 230, 90, undefined, 700);
        if (this.host.has('afterquake' as MutationId) && this.afterquakes.length < 4) { this.afterquakes.push({ ...cast, delay: 450 }); this.event(cast.id, 'cast', cast, { durationMs: 450 }); }
        break;
      case 'cryo-nova': {
        const radius = cast.radius ?? 210;
        for (const t of this.nearby(cast, radius)) { const chilled = this.host.statuses(t.id).chilled; this.host.status(t, 'chill', 2); if (chilled) this.host.status(t, 'freeze', 1800); this.hit(t, 30); ids.push(t.id); }
        this.event(cast.id, 'impact', cast, { radius, targetIds: ids }); return;
      }
      case 'flashfire': {
        for (const t of this.nearby(cast, 300)) { const a = Math.atan2(t.y - cast.y, t.x - cast.x) - cast.angle; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) <= 1.22 / 2) { this.hit(t, 25, 'burn'); ids.push(t.id); } }
        if (cast.ground) {
          this.addZone(cast.id, cast.ground, 120, 2500, 4);
          this.event(cast.id, 'impact', cast, { targetX: cast.ground.x, targetY: cast.ground.y, radius: 120, length: undefined, arcRadians: undefined, durationMs: 2500 });
        }
        break;
      }
      case 'overload': ids = this.chain(cast, 60, this.host.has('forked-overload' as MutationId) ? 8 : 6); break;
      case 'bulwark': case 'glacier': case 'tesla-pylon': {
        for (const p of cast.placements ?? this.planPlacements(cast)) {
          this.deploy(cast, p);
          this.event(cast.id, 'impact', cast, { angle: cast.angle, targetX: p.x, targetY: p.y, ...(p.radius === undefined ? {} : { radius: p.radius }), durationMs: d.durationMs });
        }
        return;
      }
      case 'napalm-charge': {
        for (const p of cast.placements ?? this.planPlacements(cast)) {
          this.addZone(cast.id, p, p.radius ?? 120, 6000, 6.5);
          this.event(cast.id, 'impact', cast, { targetX: p.x, targetY: p.y, radius: p.radius ?? 120, durationMs: d.durationMs });
        }
        return;
      }
      case 'railbreaker': {
        const end = { x: cast.x + Math.cos(cast.angle) * 900, y: cast.y + Math.sin(cast.angle) * 900 };
        for (const t of this.host.targets().slice(0, ABILITY_LIMITS.targets)) {
          const along = (t.x - cast.x) * Math.cos(cast.angle) + (t.y - cast.y) * Math.sin(cast.angle);
          if (along < 0 || along > 900 || segmentDistance(t, cast, end) > 22 || !this.host.visible(cast, t)) continue;
          const px = -Math.sin(cast.angle), py = Math.cos(cast.angle), positive = this.wallDistance(t, px, py), negative = this.wallDistance(t, -px, -py);
          const side = Math.abs(positive - negative) < .5 ? ((t.x - cast.x) * px + (t.y - cast.y) * py < 0 ? -1 : 1) : positive < negative ? 1 : -1;
          this.host.launch(t, px * 4800 * side, py * 4800 * side); this.hit(t, 420); ids.push(t.id);
        }
        this.event(cast.id, 'link', cast, { angle: cast.angle, targetX: end.x, targetY: end.y, targetIds: ids }); break;
      }
      case 'whiteout': this.addZone(cast.id, cast, 300, 8000, 4, true); break;
      case 'meltdown': this.addZone(cast.id, cast, 130, 8000, 4, true); break;
      case 'overclock': this.states.overdrive.active = 6000; break;
    }
    this.event(cast.id, 'impact', cast, { angle: cast.angle, targetX: cast.target.x, targetY: cast.target.y, targetIds: ids, durationMs: d.durationMs });
  }
  private chain(cast: Cast, damage: number, cap: number): number[] {
    const targets = this.nearby(cast, 520), aim = { x: cast.x + Math.cos(cast.angle) * 520, y: cast.y + Math.sin(cast.angle) * 520 };
    // Aim selects the closest target to the cursor, or the forward ray endpoint when using keyboard aim.
    const cursor = this.aimPoint ?? aim;
    targets.sort((a, b) => Math.hypot(a.x - cursor.x, a.y - cursor.y) - Math.hypot(b.x - cursor.x, b.y - cursor.y) || a.id - b.id);
    const ids: number[] = []; let origin: AbilityPoint = cast, target = targets[0];
    while (target && ids.length < cap) {
      const n = damage * .85 ** ids.length;
      const before = this.host.statuses(target.id);
      ids.push(target.id);
      const next = this.nearby(target, 200).find(t => !ids.includes(t.id));
      if (next && ids.length < cap) this.host.arc(target, [next]);
      this.hit(target, n, 'shock', before.chilled ? 550 : 350);
      this.event(cast.id, 'link', origin, { targetX: target.x, targetY: target.y, targetIds: [target.id] });
      origin = target; target = next!;
    }
    return ids;
  }
  private stepDash(ms: number): void {
    if (!this.dash || !this.rig) return;
    const dash = this.dash, before = { ...this.host.player() }, step = Math.min(ms, dash.remaining);
    this.host.movePlayer(dash.x * step / DASH_DURATION_MS, dash.y * step / DASH_DURATION_MS);
    const p = this.host.player(), id = this.definition('dash').id;
    if (id === 'ram') for (const t of this.host.targets().slice(0, ABILITY_LIMITS.targets)) {
      if (dash.hit.has(t.id) || segmentDistance(t, before, p) > 22 || !this.host.visible(p, t)) continue;
      dash.hit.add(t.id); const side = (t.x - p.x) * -Math.sin(dash.angle) + (t.y - p.y) * Math.cos(dash.angle) < 0 ? -1 : 1;
      this.host.launch(t, -Math.sin(dash.angle) * 350 * side, Math.cos(dash.angle) * 350 * side); this.host.status(t, 'shock', 180); this.hit(t, 18);
    }
    dash.remaining = countdown(dash.remaining, step);
    const blocked = Math.hypot(p.x - before.x, p.y - before.y) < Math.hypot(dash.x, dash.y) * step / DASH_DURATION_MS - .01;
    if (dash.remaining <= 0 || blocked) {
      this.dash = null;
      if (id === 'frost-trail' || id === 'afterburn') this.addZone(id, dash.start, 0, 2500, 0, false, p, 44);
      if (id === 'static-step') { const targets = this.nearby(p, 160).slice(0, 3); this.host.arc({ id: 0, x: p.x, y: p.y, radius: 0, health: 1 }, targets); for (const t of targets) { this.hit(t, 22, 'shock', 250); this.event(id, 'link', p, { targetX: t.x, targetY: t.y, targetIds: [t.id] }); }}
      this.event(id, 'dash-end', dash.start, { targetX: p.x, targetY: p.y, angle: dash.angle, targetIds: [...dash.hit] });
    }
  }
  private stepZones(ms: number, existingThrough: number): void {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const zone = this.zones[i];
      if (zone.id > existingThrough) continue; // A dash trail begins at this step’s arrival, not its start.
      const live = Math.min(ms, zone.remainingMs);
      if (zone.attached) { const p = this.host.player(); zone.x = p.x; zone.y = p.y; }
      zone.tick -= live; zone.remainingMs = countdown(zone.remainingMs, ms);
      if (zone.tick <= TIMER_EPSILON) {
        zone.tick += 250; zone.pulses++;
        const ids: number[] = [];
        for (const t of this.host.targets().slice(0, ABILITY_LIMITS.targets)) {
          const inside = zone.shape === 'circle' ? Math.hypot(t.x - zone.x, t.y - zone.y) <= zone.radius : segmentDistance(t, zone, { x: zone.x2, y: zone.y2 }) <= zone.width / 2;
          const origin = zone.shape === 'strip' ? this.closestOnStrip(t, zone) : zone;
          if (!inside || !this.host.visible(origin, t)) continue;
          if (zone.ability === 'frost-trail' || zone.ability === 'whiteout') this.host.status(t, 'chill', 1); else this.host.status(t, 'burn', 1);
          if (zone.ability === 'whiteout' && zone.pulses % 8 === 0) this.host.status(t, 'freeze', 1000);
          if (zone.damage) this.host.damage(t, zone.damage);
          ids.push(t.id);
        }
        this.event(zone.ability, 'tick', zone, { entityId: zone.id, radius: zone.radius, targetIds: ids, targetX: zone.x2, targetY: zone.y2, width: zone.width, ...(zone.shape === 'strip' ? { length: Math.hypot(zone.x2-zone.x,zone.y2-zone.y) } : zone.ability === 'flashfire' ? { length: undefined, arcRadians: undefined } : {}) });
      }
      if (zone.remainingMs <= 0) { this.zones.splice(i, 1); this.event(zone.ability, 'end', zone, { entityId: zone.id }); }
    }
  }
  private closestOnStrip(t: AbilityPoint, zone: Zone): AbilityPoint {
    const dx = zone.x2 - zone.x, dy = zone.y2 - zone.y, f = Math.max(0, Math.min(1, ((t.x - zone.x) * dx + (t.y - zone.y) * dy) / (dx * dx + dy * dy || 1)));
    return { x: zone.x + f * dx, y: zone.y + f * dy };
  }
  private stepDeployables(ms: number, hostileScale: number): void {
    if (!this.deployables.length) return;
    const targets = this.host.targets(), p = this.host.player();
    this.currentTargetIds.clear();
    for (let i = 0; i < Math.min(targets.length, ABILITY_LIMITS.targets); i++) if (targets[i].health > 0) this.currentTargetIds.add(targets[i].id);
    for (let entityIndex = this.deployables.length - 1; entityIndex >= 0; entityIndex--) {
      const d = this.deployables[entityIndex];
      const live = Math.min(ms, d.remainingMs); d.remainingMs = countdown(d.remainingMs, ms); d.tick -= live; d.assault -= live * hostileScale;
      if (d.assault <= TIMER_EPSILON) {
        d.assault += 250;
        for (const t of this.host.targets().slice(0, ABILITY_LIMITS.targets)) if (!this.host.statuses(t.id).frozen && !this.host.statuses(t.id).shocked && this.touches(d, t, t, t.radius + 20) && this.host.visible(d, t)) d.health -= 20;
      }
      if (d.kind === 'pylon' && d.health > 0) {
        const pulse = d.tick <= TIMER_EPSILON;
        if (pulse) {
          d.tick += 500;
          for (const t of this.nearby(d, 220).slice(0, 1)) { this.host.arc({ id: 0, x: d.x, y: d.y, radius: 0, health: 1 }, [t]); this.hit(t, 26, 'shock', 120); this.event(d.ability, 'link', d, { entityId: d.id, targetX: t.x, targetY: t.y, targetIds: [t.id] }); }
        }
        for (const [id, remaining] of d.linkCooldowns) {
          const next = countdown(remaining, live);
          if (!next || !this.currentTargetIds.has(id)) d.linkCooldowns.delete(id);
          else d.linkCooldowns.set(id, next);
        }
        if (this.linkActive(d, p)) {
          const ids: number[] = [];
          for (let i = 0; i < Math.min(targets.length, ABILITY_LIMITS.targets); i++) {
            const t = targets[i];
            if (t.health <= 0 || d.linkCooldowns.has(t.id) || !this.host.visible(d, t)) continue;
            const previous = this.previousTargets.get(t.id) ?? t;
            // A previously disconnected rope cannot sweep across the room on reconnection.
            const fromMarine = this.hasPreviousMarine && this.linkActive(d, this.previousMarine) ? this.previousMarine : p;
            if (!sweptLinkContact(previous, t, d, fromMarine, p, 14)) continue;
            d.linkCooldowns.set(t.id, 500); this.hit(t, 12, 'shock', 120); ids.push(t.id);
          }
          if (ids.length || pulse) this.event(d.ability, 'link', d, { entityId: d.id, targetX: p.x, targetY: p.y, width: 28, targetIds: ids });
        }
        if (pulse) this.event(d.ability, 'tick', d, { entityId: d.id });
      }
      if (d.health <= 0 || d.remainingMs <= 0) this.removeDeployable(d);
    }
  }
  private hasPylon(): boolean { for (const d of this.deployables) if (d.kind === 'pylon') return true; return false; }
  private linkActive(d: Deployable, p: AbilityPoint): boolean {
    return d.kind === 'pylon' && d.health > 0 && Math.hypot(p.x - d.x, p.y - d.y) <= 280 && this.host.visible(p, d);
  }
  /** Reuse bounded motion records; no target object or internal cooldown map escapes in snapshots. */
  private rememberLinkMotion(): void {
    if (!this.hasPylon()) {
      this.previousTargets.clear(); this.hasPreviousMarine = false; return;
    }
    const targets = this.host.targets();
    this.currentTargetIds.clear();
    for (let i = 0; i < Math.min(targets.length, ABILITY_LIMITS.targets); i++) {
      const t = targets[i]; if (t.health <= 0) continue;
      this.currentTargetIds.add(t.id);
      const record = this.previousTargets.get(t.id);
      if (record) { record.x = t.x; record.y = t.y; }
      else this.previousTargets.set(t.id, { x: t.x, y: t.y });
    }
    for (const id of this.previousTargets.keys()) if (!this.currentTargetIds.has(id)) this.previousTargets.delete(id);
    const p = this.host.player(); this.previousMarine.x = p.x; this.previousMarine.y = p.y; this.hasPreviousMarine = true;
  }
  private contact(d: Deployable, from: AbilityPoint, to: AbilityPoint, radius: number): number | null {
    if (d.kind === 'pylon') return sweptCircle(from, to, d, d.radius + radius);
    // Exact swept circle against an oriented wall: flat faces plus four rounded corners.
    const c = Math.cos(d.angle), s = Math.sin(d.angle);
    const a = { x: (from.x - d.x) * c + (from.y - d.y) * s, y: -(from.x - d.x) * s + (from.y - d.y) * c };
    const b = { x: (to.x - d.x) * c + (to.y - d.y) * s, y: -(to.x - d.x) * s + (to.y - d.y) * c };
    const hx = d.thickness / 2, hy = d.length / 2;
    if (Math.hypot(Math.max(0, Math.abs(a.x) - hx), Math.max(0, Math.abs(a.y) - hy)) <= radius) return 0;
    let first = Infinity;
    const dx = b.x - a.x, dy = b.y - a.y;
    for (const side of [-1, 1]) {
      if (dx) { const t = (side * (hx + radius) - a.x) / dx; if (t >= 0 && t <= 1 && Math.abs(a.y + dy * t) <= hy) first = Math.min(first, t); }
      if (dy) { const t = (side * (hy + radius) - a.y) / dy; if (t >= 0 && t <= 1 && Math.abs(a.x + dx * t) <= hx) first = Math.min(first, t); }
      for (const vertical of [-1, 1]) { const t = sweptCircle(a, b, { x: side * hx, y: vertical * hy }, radius); if (t !== null) first = Math.min(first, t); }
    }
    return first === Infinity ? null : first;
  }
  private touches(d: Deployable, from: AbilityPoint, to: AbilityPoint, radius: number): boolean { return this.contact(d, from, to, radius) !== null; }
  /** Hostile movement only: the marine and friendly projectiles never collide with rig walls. */
  blocksMovement(from: AbilityPoint, to: AbilityPoint, radius: number): boolean {
    return this.deployables.some(d => d.kind !== 'pylon' && d.health > 0 && this.touches(d, from, to, radius));
  }
  /** Intercept a hostile swept projectile and damage its first blocking wall. */
  interceptProjectile(from: AbilityPoint, to: AbilityPoint, radius: number, damage: number): boolean {
    let wall: Deployable | undefined, first = Infinity;
    for (const d of this.deployables) { if (d.kind === 'pylon' || d.health <= 0) continue; const entry = this.contact(d, from, to, radius); if (entry !== null && entry < first) { first = entry; wall = d; } }
    if (!wall) return false;
    wall.health -= Number.isFinite(damage) ? Math.max(0, damage) : 0; this.cached = null;
    if (wall.health <= 0) this.removeDeployable(wall);
    return true;
  }
  private removeDeployable(d: Deployable): void {
    const i = this.deployables.indexOf(d); if (i < 0) return;
    this.deployables.splice(i, 1); this.cached = null;
    const slot = ABILITY_CATALOG[d.ability].slot;
    this.states[slot].active = Math.max(0, ...this.deployables.filter(x => ABILITY_CATALOG[x.ability].slot === slot).map(x => x.remainingMs), ...this.zones.filter(x => ABILITY_CATALOG[x.ability].slot === slot).map(x => x.remainingMs));
    if (d.kind === 'ice-wall') {
      const ids = this.radial({ id: d.ability, x: d.x, y: d.y, angle: d.angle, target: d, remaining: 0 }, 150, 80, 'chill');
      this.event(d.ability, 'burst', d, { entityId: d.id, radius: 150, targetIds: ids });
    }
    this.event(d.ability, 'end', d, { entityId: d.id });
  }
  /** Bounded kill payoffs run before MutationRuntime clears the victim's shared statuses. */
  onKill(target: MutationTarget, wasFrozen = this.host.statuses(target.id).frozen): void {
    if (this.rig && this.host.has('tactical-salvage' as MutationId)) {
      this.cached = null;
      const state = this.states.tactical; for (let i = state.cooldowns.length - 1; i >= 0; i--) { state.cooldowns[i] = Math.max(0, state.cooldowns[i] - 350); if (!state.cooldowns[i]) { state.cooldowns.splice(i, 1); this.event(this.definition('tactical').id, 'ready', this.host.player()); } }
    }
    if (this.killDepth >= 3) return;
    const p = this.host.player(), whiteout = this.active('whiteout') && wasFrozen && Math.hypot(target.x - p.x, target.y - p.y) <= 300 && this.host.visible(p, target);
    const meltdown = this.active('meltdown');
    if (!whiteout && !meltdown) return;
    this.killDepth++;
    try { const id = whiteout ? 'whiteout' : 'meltdown', ids = this.radial({ id, x: target.x, y: target.y, angle: 0, target, remaining: 0 }, whiteout ? 100 : 85, whiteout ? 40 : 20, meltdown ? 'burn' : 'chill'); this.event(id, 'burst', target, { radius: whiteout ? 100 : 85, targetIds: ids }); }
    finally { this.killDepth--; }
    this.cached = null;
  }
  /** Advance all friendly timers at normal speed. */
  update(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0 || !this.rig) return;
    let remaining = Math.min(ms, 100);
    // Resolve wind-ups and dash arrivals at their exact simulation boundary, then
    // carry the rest of this call into newly created entities and delayed effects.
    while (remaining > TIMER_EPSILON) {
      let step = remaining;
      for (const cast of this.casts) if (cast.remaining > TIMER_EPSILON) step = Math.min(step, cast.remaining);
      for (const quake of this.afterquakes) if (quake.delay > TIMER_EPSILON) step = Math.min(step, quake.delay);
      if (this.dash) step = Math.min(step, this.dash.remaining);
      if (this.overclocked) step = Math.min(step, this.states.overdrive.active);
      for (const zone of this.zones) step = Math.min(step, zone.tick, zone.remainingMs);
      for (const entity of this.deployables) step = Math.min(step, entity.remainingMs, entity.assault / this.hostileTimeScale, entity.kind === 'pylon' ? entity.tick : remaining);
      this.advanceStep(step);
      remaining = countdown(remaining, step);
    }
  }
  private advanceStep(ms: number): void {
    this.host.advance?.(ms);
    if (!this.immune && !this.dash && !this.casts.length && !this.zones.length && !this.deployables.length && !this.afterquakes.length && ABILITY_SLOTS.every(slot => !this.states[slot].cooldowns.length && !this.states[slot].active)) return;
    const hostileScale = this.hostileDelta(ms) / ms;
    this.placementCache = null;
    this.cached = null;
    this.immune = countdown(this.immune, ms);
    for (const slot of ABILITY_SLOTS) {
      const state = this.states[slot];
      for (let i = state.cooldowns.length - 1; i >= 0; i--) {
        state.cooldowns[i] = countdown(state.cooldowns[i], ms);
        if (state.cooldowns[i] <= 0) { state.cooldowns.splice(i, 1); this.event(this.definition(slot).id, 'ready', this.host.player()); }
      }
      state.cast = countdown(state.cast, ms);
    }
    const existingThrough = this.serial;
    this.stepDash(ms);
    this.stepZones(ms, existingThrough);
    this.stepDeployables(ms, hostileScale);
    // Final zone pulses (and synchronous kill reactions) still belong to the buff.
    for (const slot of ABILITY_SLOTS) {
      const state = this.states[slot], wasActive = state.active > 0;
      state.active = countdown(state.active, ms);
      if (wasActive && !state.active && this.definition(slot).id === 'overclock') this.event('overclock', 'end', this.host.player());
    }
    for (let i = this.afterquakes.length - 1; i >= 0; i--) { const cast = this.afterquakes[i]; cast.delay = countdown(cast.delay, ms); if (cast.delay <= 0) { this.afterquakes.splice(i, 1); const ids = this.radial(cast, 230, 35, undefined, 350); this.event(cast.id, 'impact', cast, { targetIds: ids }); } }
    for (let i = this.casts.length - 1; i >= 0; i--) {
      const cast = this.casts[i]; cast.remaining = countdown(cast.remaining, ms);
      if (cast.remaining <= 0) { this.casts.splice(i, 1); this.resolve(cast); }
    }
    // Derive lingering slot time after every entity has advanced (including twin constructs).
    for (const slot of ABILITY_SLOTS) {
      if (this.definition(slot).id === 'overclock') continue;
      let active = 0;
      for (const zone of this.zones) if (ABILITY_CATALOG[zone.ability].slot === slot) active = Math.max(active, zone.remainingMs);
      for (const entity of this.deployables) if (ABILITY_CATALOG[entity.ability].slot === slot) active = Math.max(active, entity.remainingMs);
      this.states[slot].active = active;
    }
    this.rememberLinkMotion();
    this.cached = null; // Discard any intermediate snapshot retained by a synchronous subscriber.
  }

  /** Stable immutable presentation snapshot until simulation state changes. */
  get snapshot(): AbilitiesSnapshot {
    const p = this.host.player();
    const enabled = this.host.enabled?.() !== false && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.angle);
    const roomLimited = this.overdriveRoomLimited;
    const powerReady = !!this.rig && enabled && !this.casts.length && !this.dash && this.states.power.cooldowns.length < this.maxCharges('power') && this.powerPlacementAvailable();
    if (this.cached && this.cachedEnabled === enabled && !!this.cached.overdrive.roomLimited === roomLimited && (!this.hasPylon() || (this.cachedLinkX === p.x && this.cachedLinkY === p.y)) && (!this.rig || (this.cached.slots?.dash.maxCharges === this.maxCharges('dash') && this.cached.slots?.power.ready === powerReady))) return this.cached;
    this.cachedEnabled = enabled;
    this.cachedLinkX = p.x; this.cachedLinkY = p.y;
    const slots = this.rig ? Object.fromEntries(ABILITY_SLOTS.map(slot => {
      const d = this.definition(slot), state = this.states[slot], charges = slot === 'overdrive' ? +(this.charge >= 1) : Math.max(0, this.maxCharges(slot) - state.cooldowns.length);
      return [slot, Object.freeze({ slot, id: d.id, ready: enabled && !this.casts.length && !this.dash && charges > 0 && (slot !== 'overdrive' || (!state.active && !roomLimited)) && (slot !== 'power' || powerReady), charges, maxCharges: this.maxCharges(slot), cooldownRemainingMs: state.cooldowns.length ? Math.min(...state.cooldowns) : 0, cooldownMs: d.cooldownMs, castRemainingMs: state.cast, activeRemainingMs: state.active, activeMs: Math.max(d.durationMs, ...this.deployables.filter(e => ABILITY_CATALOG[e.ability].slot === slot).map(e => e.durationMs), ...this.zones.filter(e => ABILITY_CATALOG[e.ability].slot === slot).map(e => e.durationMs)) })];
    })) as AbilitiesSnapshot['slots'] : null;
    return this.cached = Object.freeze({ rig: this.rig, slots: slots && Object.freeze(slots), overdrive: Object.freeze({ charge: this.charge, ready: this.charge >= 1 && !roomLimited, active: this.states.overdrive.active > 0, activeRemainingMs: this.states.overdrive.active, ...(roomLimited ? {roomLimited: true} : {}) }), invulnerable: this.invulnerable, dashing: this.dashing, hostileTimeScale: this.hostileTimeScale,
      deployables: Object.freeze(this.deployables.map(d => { const { tick, assault, linkCooldowns, ...entity } = d; return Object.freeze(entity); })),
      zones: Object.freeze(this.zones.map(z => { const { tick, pulses, damage, ...zone } = z; return Object.freeze(zone); })),
      links: Object.freeze(this.deployables.filter(d => this.linkActive(d, p)).map(d => Object.freeze({ id: d.id, ability: 'tesla-pylon' as const, element: 'arc' as const, x: d.x, y: d.y, targetX: p.x, targetY: p.y, width: 28 }))) });
  }
}
