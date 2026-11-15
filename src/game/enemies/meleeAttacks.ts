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
  lockProgress: number;
  engageRange: number;
  damageMultiplier: number;
  cooldownMs?: number;
  shape: MeleeStrikeShape;
}>;

function profile(windupMs: number, strikeMs: number, recoveryMs: number,
  engageRange: number, kind: MeleeStrikeShape['kind'], range: number,
  halfAngle: number, damageMultiplier: number, width = 0, cooldownMs?: number): MeleeAttackProfile {
  return Object.freeze({windupMs, strikeMs, recoveryMs, engageRange, damageMultiplier, cooldownMs, lockProgress: .72,
    shape: Object.freeze({kind, range, halfAngle, width})});
}

/** Melee-only tuning; ranged source damage and clocks retain their original catalog values. */
export const MELEE_ATTACKS: Readonly<Record<StandardEnemyId, MeleeAttackProfile>> = Object.freeze({
  crawler: profile(260, 70, 240, 54, 'arc', 66, .72, 15 / 12),
  stalker: profile(420, 90, 560, 105, 'line', 155, 0, 26 / 22, 36),
  brute: profile(650, 120, 450, 74, 'arc', 94, 1.08, 42 / 35),
  spitter: profile(350, 90, 420, 48, 'cone', 58, .78, 12 / 10, 0, 860),
  carrier: profile(620, 120, 460, 63, 'cone', 82, 1.15, 22 / 18),
});

export const ELITE_MELEE_WINDUP_SCALE = .82;
export const ELITE_MELEE_RECOVERY_SCALE = .85;

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
