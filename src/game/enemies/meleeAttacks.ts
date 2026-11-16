import type {StandardEnemyId} from './types';

export type MeleePhase = 'approach' | 'windup' | 'strike' | 'recovery';

/** Filled sectors and a capsule, in simulation units. The renderer uses this same footprint. */
export type MeleeStrikeShape = Readonly<{
  kind: 'arc' | 'cone' | 'line';
  range: number;
  halfAngle: number;
  width: number;
}>;

export type MeleeAttackProfile = Readonly<{
  windupMs: number;
  strikeMs: number;
  recoveryMs: number;
  /** Includes one native50ms step of margin above the minimum visible lock. */
  lockLeadMs: number;
  heavy: boolean;
  engageRange: number;
  damage: number;
  /** Rest time begins after recovery, rather than at the warning. */
  cooldownMs: number;
  shape: MeleeStrikeShape;
}>;

function profile(windupMs: number, strikeMs: number, recoveryMs: number,
  engageRange: number, kind: MeleeStrikeShape['kind'], range: number,
  halfAngle: number, width = 0, heavy = false, cooldownMs = 900, damage = 12): MeleeAttackProfile {
  return Object.freeze({windupMs, strikeMs, recoveryMs, engageRange, damage, cooldownMs,
    lockLeadMs: heavy ? 250 : 170, heavy,
    shape: Object.freeze({kind, range, halfAngle, width})});
}

/** Short native strikes; player radius is added once by the intersection function. */
export const MELEE_ATTACKS: Readonly<Record<StandardEnemyId, MeleeAttackProfile>> = Object.freeze({
  crawler: profile(320, 70, 280, 54, 'arc', 78, 50 * Math.PI / 180, 0, false, 350, 10),
  stalker: profile(460, 90, 650, 84, 'line', 130, 0, 24, false, 1000, 22),
  brute: profile(700, 120, 550, 62, 'arc', 92, 65 * Math.PI / 180, 0, true, 1100, 35),
  spitter: profile(400, 90, 420, 28, 'cone', 46, Math.PI / 4, 0, false, 1500, 10),
  carrier: profile(660, 120, 500, 46, 'cone', 70, 50 * Math.PI / 180, 0, true, 1100, 18),
});

export const ELITE_MELEE_WINDUP_SCALE = .9;
export const ELITE_MELEE_RECOVERY_SCALE = .85;
export const MELEE_START_STAGGER_MS = 200;
export const ELITE_MELEE_DAMAGE_SCALE = 1.25;

/** Authored damage does not compound with depth scaling. Elites/champions gain 25%. */
export function calculateMeleeDamage(type: StandardEnemyId, elite = false): number {
  return MELEE_ATTACKS[type].damage * (elite ? ELITE_MELEE_DAMAGE_SCALE : 1);
}

function segmentDistanceSquared(x: number, y: number, bx: number, by: number): number {
  const lengthSquared = bx * bx + by * by;
  const t = lengthSquared ? Math.max(0, Math.min(1, (x * bx + y * by) / lengthSquared)) : 0;
  return (x - bx * t) ** 2 + (y - by * t) ** 2;
}

/** Exact circle versus sector/capsule overlap, shared by native strikes and bot counterplay. */
export function meleeStrikeContains(shape: MeleeStrikeShape, originX: number, originY: number,
  angle: number, x: number, y: number, radius = 0): boolean {
  if (!Number.isFinite(originX)||!Number.isFinite(originY)||!Number.isFinite(angle)||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius < 0) return false;
  const dx = x - originX, dy = y - originY;
  const c = Math.cos(angle), s = Math.sin(angle);
  const forward = dx * c + dy * s, side = -dx * s + dy * c;
  if (shape.kind === 'line') {
    return segmentDistanceSquared(forward, side, shape.range, 0) <= (shape.width * .5 + radius) ** 2 + 1e-9;
  }
  const distance = Math.hypot(forward, side);
  const insideAngle = Math.abs(Math.atan2(side, forward)) <= shape.halfAngle;
  if (insideAngle && distance <= shape.range + radius) return true;
  const bx = Math.cos(shape.halfAngle) * shape.range;
  const by = Math.sin(shape.halfAngle) * shape.range;
  return Math.min(segmentDistanceSquared(forward, side, bx, by),
    segmentDistanceSquared(forward, side, bx, -by)) <= radius * radius;
}
