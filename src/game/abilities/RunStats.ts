import type { AbilitySlot } from './contract';
import type { EnemyId } from '../enemies/types';
import {generateRun} from '../roguelike/run';
import type {RunState} from '../roguelike/types';

export type DamageSource = 'weapon' | 'ability' | 'status' | 'boon';
export type IncomingDamageSource = 'enemy-contact' | 'enemy-charge' | 'enemy-projectile' | 'acid-pool' | 'boss-attack' | 'self-blast' | 'scripted' | 'unknown';
export type IncomingDamageOrigin = Readonly<{source: IncomingDamageSource; enemyFamily?: EnemyId}>;
/** Actual armor/health lost, with the authoritative simulation clock and run-node id. */
export type IncomingDamageReceipt = IncomingDamageOrigin & Readonly<{amount: number; room: string; atMs: number}>;
export type RunStatsSnapshot = Readonly<{
  kills: Readonly<{ total: number; byFamily: Readonly<Record<EnemyId, number>> }>;
  damageDealt: Readonly<Record<DamageSource, number>>;
  damageTaken: number;
  shotsFired: number;
  shotsHit: number;
  abilityUses: Readonly<Record<AbilitySlot, number>>;
  overdrivesUsed: number;
  highestMultiKill: number;
  roomTimeMs: Readonly<Record<string, number>>;
  creditsEarned: number;
  /** Absent only in historical saves/fixtures; runtime snapshots always supply these defaults. */
  lastDamage?: IncomingDamageReceipt | null;
  recentDamage?: readonly IncomingDamageReceipt[];
  selfBlastDamage?: number;
}>;

/** Persistence limits bound counters, room maps, and the rolling kill queue. */
export const RUN_STATS_LIMITS = Object.freeze({ counter: 1_000_000_000, timeMs: 1_000_000_000_000, rooms: 20, multiKill: 4096 });
export const INCOMING_DAMAGE_WINDOW_MS = 5000;
export const INCOMING_DAMAGE_CAPACITY = 32;
const FAMILIES = ['crawler', 'brute', 'spitter', 'stalker', 'carrier', 'queen'] as const;
const INCOMING_SOURCES: readonly IncomingDamageSource[] = ['enemy-contact', 'enemy-charge', 'enemy-projectile', 'acid-pool', 'boss-attack', 'self-blast', 'scripted', 'unknown'];
const SOURCES = ['weapon', 'ability', 'status', 'boon'] as const;
const SLOTS = ['dash', 'tactical', 'power', 'overdrive'] as const;
const KEYS = ['kills', 'damageDealt', 'damageTaken', 'shotsFired', 'shotsHit', 'abilityUses', 'overdrivesUsed', 'highestMultiKill', 'roomTimeMs', 'creditsEarned'];
const plain = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const bounded = (value: unknown, max: number = RUN_STATS_LIMITS.counter, integer = false): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max && (!integer || Number.isSafeInteger(value));
const roomId = (value: string): boolean => value.length <= 128 && /^\d{1,10}:(?:v3-r(?:[0-9]|1[0-9])|v2-r(?:[0-9]|1[01])-(?:combat|elite|medical|armory|boss)|r[0-5]-(?:start|medical|armory|combat|safe|elite|boss))$/.test(value);
const counts = (value: unknown, keys: readonly string[], integer: boolean): value is Record<string, number> => exact(value, keys) && keys.every(key => bounded(value[key], RUN_STATS_LIMITS.counter, integer));

function validIncoming(value: unknown): value is IncomingDamageReceipt {
  if (!plain(value)) return false;
  const keys = ['source', 'amount', 'room', 'atMs', ...(Object.hasOwn(value, 'enemyFamily') ? ['enemyFamily'] : [])];
  return exact(value, keys) && INCOMING_SOURCES.includes(value.source as IncomingDamageSource) &&
    bounded(value.amount) && value.amount > 0 && typeof value.room === 'string' && roomId(value.room) &&
    bounded(value.atMs, RUN_STATS_LIMITS.timeMs * RUN_STATS_LIMITS.rooms) &&
    (!Object.hasOwn(value, 'enemyFamily') || FAMILIES.includes(value.enemyFamily as EnemyId));
}

/** Strict exact-schema validation; optional run context also checks timer membership and resume capacity. */
export function isValidRunStatsSnapshot(value: unknown, run?: RunState): value is RunStatsSnapshot {
  try {
    if(!plain(value))return false;
    const keys=Object.hasOwn(value,'selfBlastDamage')?[...KEYS,'selfBlastDamage']:KEYS;
    if (!(exact(value, keys) || exact(value, [...keys, 'lastDamage', 'recentDamage'])) || !exact(value.kills, ['total', 'byFamily']) || !bounded(value.kills.total, RUN_STATS_LIMITS.counter, true) || !counts(value.kills.byFamily, FAMILIES, true) || Object.values(value.kills.byFamily).reduce((sum, n) => sum + n, 0) !== value.kills.total || !counts(value.damageDealt, SOURCES, false) || !counts(value.abilityUses, SLOTS, true)) return false;
    if (!['damageTaken', 'shotsFired', 'shotsHit', 'overdrivesUsed', 'creditsEarned'].every(key => bounded(value[key], RUN_STATS_LIMITS.counter, key !== 'damageTaken'))) return false;
    if (Object.hasOwn(value,'selfBlastDamage')&&!bounded(value.selfBlastDamage,Number(value.damageTaken)))return false;
    if (Number(value.shotsHit) > Number(value.shotsFired) || (value.kills.total > 0 && Number(value.highestMultiKill) < 1)) return false;
    if (Number(value.overdrivesUsed) !== value.abilityUses.overdrive || !bounded(value.highestMultiKill, RUN_STATS_LIMITS.multiKill, true) || Number(value.highestMultiKill) > value.kills.total) return false;
    if (!plain(value.roomTimeMs)) return false;
    const rooms = Reflect.ownKeys(value.roomTimeMs);
    if (rooms.length > RUN_STATS_LIMITS.rooms || !rooms.every(key => typeof key === 'string' && roomId(key) && bounded((value.roomTimeMs as Record<string, unknown>)[key], RUN_STATS_LIMITS.timeMs))) return false;
    if (Object.hasOwn(value, 'lastDamage')) {
      if (value.lastDamage !== null && !validIncoming(value.lastDamage)) return false;
      if (!Array.isArray(value.recentDamage) || value.recentDamage.length > INCOMING_DAMAGE_CAPACITY || !value.recentDamage.every(validIncoming)) return false;
      const recent = value.recentDamage as IncomingDamageReceipt[];
      const last = value.lastDamage as IncomingDamageReceipt | null;
      const elapsed = Object.values(value.roomTimeMs as Record<string, number>).reduce((sum, n) => sum + n, 0);
      const receipts = last ? [...recent, last] : recent;
      if ((!last && recent.length) || receipts.some(receipt => !rooms.includes(receipt.room) || receipt.atMs > elapsed || receipt.amount > Number(value.damageTaken))) return false;
      if (recent.some((receipt, index) => receipt.atMs < elapsed - INCOMING_DAMAGE_WINDOW_MS || index > 0 && receipt.atMs < recent[index - 1].atMs)) return false;
      if (last && recent.length) {
        const newest = recent[recent.length - 1];
        if (newest.source !== last.source || newest.enemyFamily !== last.enemyFamily || newest.room !== last.room || newest.amount !== last.amount || newest.atMs !== last.atMs) return false;
      }
    }
    if (run) {
      const graph = generateRun(run.seed, run.version);
      if (!graph.nodes.some(node => node.id === run.currentNodeId) || !rooms.every(id => graph.nodes.some(node => node.id === id))) return false;
      // Continue always enters the current node; a full map must already contain its timer.
      if (!Object.hasOwn(value.roomTimeMs, run.currentNodeId) && rooms.length === RUN_STATS_LIMITS.rooms) return false;
    }
    return true;
  } catch { return false; }
}

const zeroRecord = <K extends string>(keys: readonly K[]): Record<K, number> => Object.fromEntries(keys.map(key => [key, 0])) as Record<K, number>;
type MutableStats = {
  kills: { total: number; byFamily: Record<EnemyId, number> };
  damageDealt: Record<DamageSource, number>;
  damageTaken: number;
  shotsFired: number;
  shotsHit: number;
  abilityUses: Record<AbilitySlot, number>;
  overdrivesUsed: number;
  highestMultiKill: number;
  roomTimeMs: Record<string, number>;
  creditsEarned: number;
  selfBlastDamage?: number;
  lastDamage: IncomingDamageReceipt | null;
  recentDamage: IncomingDamageReceipt[];
};
const empty = (): MutableStats => ({ kills: { total: 0, byFamily: zeroRecord(FAMILIES) }, damageDealt: zeroRecord(SOURCES), damageTaken: 0, shotsFired: 0, shotsHit: 0, abilityUses: zeroRecord(SLOTS), overdrivesUsed: 0, highestMultiKill: 0, roomTimeMs: {}, creditsEarned: 0, lastDamage: null, recentDamage: [] });
const clone = (s: RunStatsSnapshot): RunStatsSnapshot => Object.freeze({ ...s, kills: Object.freeze({ ...s.kills, byFamily: Object.freeze({ ...s.kills.byFamily }) }), damageDealt: Object.freeze({ ...s.damageDealt }), abilityUses: Object.freeze({ ...s.abilityUses }), roomTimeMs: Object.freeze({ ...s.roomTimeMs }), lastDamage: s.lastDamage ? Object.freeze({...s.lastDamage}) : null, recentDamage: Object.freeze((s.recentDamage ?? []).map(receipt => Object.freeze({...receipt}))) });
const increment = (current: number, amount: number, limit: number = RUN_STATS_LIMITS.counter): number => Math.min(limit, current + amount);

/** Authoritative receipts accumulate using simulation time only. Snapshots stay stable until a receipt changes state. */
export class RunStats {
  private value = empty();
  private cached: RunStatsSnapshot | null = null;
  private time = 0;
  private room: string | null = null;
  private kills = new Float64Array(RUN_STATS_LIMITS.multiKill);
  private killHead = 0;
  private killCount = 0;

  constructor(snapshot?: RunStatsSnapshot) { if (snapshot) this.reset(snapshot); }

  /** Restore a boundary snapshot (or start a run); transient multi-kill windows never cross rooms. */
  reset(snapshot?: RunStatsSnapshot): void {
    if (snapshot && !isValidRunStatsSnapshot(snapshot)) throw new Error('Invalid run statistics');
    this.value = snapshot ? { ...snapshot, kills: { ...snapshot.kills, byFamily: { ...snapshot.kills.byFamily } }, damageDealt: { ...snapshot.damageDealt }, abilityUses: { ...snapshot.abilityUses }, roomTimeMs: { ...snapshot.roomTimeMs }, lastDamage: snapshot.lastDamage ? {...snapshot.lastDamage} : null, recentDamage: (snapshot.recentDamage ?? []).map(receipt => ({...receipt})) } : empty();
    this.cached = null;
    this.time = Object.values(this.value.roomTimeMs).reduce((sum, n) => sum + n, 0);
    this.room = null;
    this.killHead = this.killCount = 0;
  }

  get snapshot(): RunStatsSnapshot { return this.cached ??= clone(this.value); }

  /** Select a generated run-node id; at most twenty room timers are retained. */
  enterRoom(id: string): void {
    if (!roomId(id)) throw new Error('Invalid statistics room id');
    if (this.room === id) return;
    if (!Object.hasOwn(this.value.roomTimeMs, id)) {
      if (Object.keys(this.value.roomTimeMs).length >= RUN_STATS_LIMITS.rooms) throw new Error('Too many statistics rooms');
      this.value.roomTimeMs[id] = 0;
      this.cached = null;
    }
    this.room = id;
    this.killHead = this.killCount = 0;
  }

  /** Call only while simulation is playing; paused time must never be supplied. */
  update(ms: number, id?: string): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    if (id !== undefined) this.enterRoom(id);
    this.time += Math.min(ms, RUN_STATS_LIMITS.timeMs);
    this.prune();
    this.pruneIncoming();
    if (this.room) {
      const elapsed = increment(this.value.roomTimeMs[this.room], ms, RUN_STATS_LIMITS.timeMs);
      if (elapsed !== this.value.roomTimeMs[this.room]) {
        this.value.roomTimeMs[this.room] = elapsed;
        this.cached = null;
      }
    }
  }

  private prune(): void {
    while (this.killCount && this.kills[this.killHead] < this.time - 1000) {
      this.killHead = (this.killHead + 1) % RUN_STATS_LIMITS.multiKill;
      this.killCount--;
    }
  }

  private pruneIncoming(): void {
    let expired = 0;
    while (expired < this.value.recentDamage.length && this.value.recentDamage[expired].atMs < this.time - INCOMING_DAMAGE_WINDOW_MS) expired++;
    if (expired) {
      this.value.recentDamage.splice(0, expired);
      this.cached = null;
    }
  }

  /** Count each confirmed death once, including status/boon deaths. */
  recordKill(family: EnemyId): void {
    if (!FAMILIES.includes(family) || this.value.kills.total >= RUN_STATS_LIMITS.counter) return;
    this.prune();
    if (this.killCount === RUN_STATS_LIMITS.multiKill) {
      this.killHead = (this.killHead + 1) % RUN_STATS_LIMITS.multiKill;
      this.killCount--;
    }
    this.kills[(this.killHead + this.killCount++) % RUN_STATS_LIMITS.multiKill] = this.time;
    this.value.kills.total++;
    this.value.kills.byFamily[family]++;
    this.value.highestMultiKill = Math.max(this.value.highestMultiKill, this.killCount);
    this.cached = null;
  }

  /** Actual health and armor removed, after defenses and clamping overkill. */
  recordDamage(source: DamageSource, amount: number): void {
    if (!SOURCES.includes(source) || !Number.isFinite(amount) || amount <= 0) return;
    const next = increment(this.value.damageDealt[source], amount);
    if (next !== this.value.damageDealt[source]) {
      this.value.damageDealt[source] = next;
      this.cached = null;
    }
  }

  recordDamageTaken(amount: number, origin: IncomingDamageOrigin = {source: 'unknown'}): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.add('damageTaken', amount);
    if(origin.source==='self-blast'){
      this.value.selfBlastDamage=increment(this.value.selfBlastDamage??0,amount);
      this.cached=null;
    }
    if (!this.room) return;
    this.pruneIncoming();
    const receipt: IncomingDamageReceipt = {
      source: INCOMING_SOURCES.includes(origin.source) ? origin.source : 'unknown',
      ...(origin.enemyFamily && FAMILIES.includes(origin.enemyFamily) ? {enemyFamily: origin.enemyFamily} : {}),
      // Match the persisted timer aggregation exactly. Summing fixed steps
      // across rooms in another order can otherwise put a receipt a fraction
      // of a microsecond beyond the serialized run clock.
      amount: Math.min(amount, RUN_STATS_LIMITS.counter), room: this.room,
      atMs: Object.values(this.value.roomTimeMs).reduce((sum, elapsed) => sum + elapsed, 0),
    };
    this.value.lastDamage = receipt;
    if (this.value.recentDamage.length === INCOMING_DAMAGE_CAPACITY) this.value.recentDamage.shift();
    this.value.recentDamage.push(receipt);
    this.cached = null;
  }
  /** Count a fired shot (not pellets); hit receipts may arrive later through recordShotHit. */
  recordShot(hit = false): void { this.add('shotsFired', 1); if (hit) this.recordShotHit(); }
  /** Host deduplicates pellet and piercing hits per fired shot. */
  recordShotHit(): void { if (this.value.shotsHit < this.value.shotsFired) this.add('shotsHit', 1); }
  recordCredits(amount: number): void { if (Number.isSafeInteger(amount)) this.add('creditsEarned', amount); }

  /** Accepted activations only; denied inputs never count. */
  recordAbilityUse(slot: AbilitySlot): void {
    if (!SLOTS.includes(slot)) return;
    const next = increment(this.value.abilityUses[slot], 1);
    if (next === this.value.abilityUses[slot]) return;
    this.value.abilityUses[slot] = next;
    if (slot === 'overdrive') this.value.overdrivesUsed = next;
    this.cached = null;
  }

  private add(key: 'damageTaken' | 'shotsFired' | 'shotsHit' | 'creditsEarned', amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const next = increment(this.value[key], amount);
    if (next !== this.value[key]) {
      this.value[key] = next;
      this.cached = null;
    }
  }
}
