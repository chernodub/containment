type Point = Readonly<{x: number; y: number}>;

const ROOT_STEPS = 48;
const CONTACT_EPSILON = 128 * Number.EPSILON;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;
const within = (x: number, y: number, radiusSquared: number) => x * x + y * y <= radiusSquared;

function circleSweep(x: number, y: number, dx: number, dy: number, radiusSquared: number): boolean {
  const speedSquared = dx * dx + dy * dy;
  const t = speedSquared === 0 ? 0 : clamp(-(x * dx + y * dy) / speedSquared);
  return within(x + t * dx, y + t * dy, radiusSquared);
}

function segmentContact(cx: number, cy: number, bx: number, by: number, radiusSquared: number): boolean {
  const lengthSquared = bx * bx + by * by;
  const projection = lengthSquared === 0 ? 0 : clamp((cx * bx + cy * by) / lengthSquared);
  return within(cx - projection * bx, cy - projection * by, radiusSquared);
}

function criticalIntervalContact(
  lo: number, hi: number, d0: number, d1: number, d2: number, d3: number,
  cx: number, cy: number, vx: number, vy: number,
  bx: number, by: number, wx: number, wy: number, radiusSquared: number,
): boolean {
  // Partition boundaries include repeated cubic roots without a sign change.
  if (segmentContact(cx + vx * lo, cy + vy * lo, bx + wx * lo, by + wy * lo, radiusSquared)) return true;
  let low = ((d3 * lo + d2) * lo + d1) * lo + d0;
  const high = ((d3 * hi + d2) * hi + d1) * hi + d0;
  if (!((low < 0 && high > 0) || (low > 0 && high < 0))) return false;
  for (let step = 0; step < ROOT_STEPS; step++) {
    const mid = (lo + hi) / 2, value = ((d3 * mid + d2) * mid + d1) * mid + d0;
    if (value === 0) { lo = hi = mid; break; }
    if ((low < 0) === (value < 0)) { lo = mid; low = value; }
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  return segmentContact(cx + vx * t, cy + vy * t, bx + wx * t, by + wy * t, radiusSquared);
}

/**
 * Contact during one linear step with a capsule from a fixed anchor to a moving
 * marine endpoint. Scalar endpoint sweeps and quartic critical points avoid
 * temporal sampling gaps, including zero-radius tangencies, without allocations.
 */
export function sweptLinkContact(
  targetFrom: Point,
  targetTo: Point,
  anchor: Point,
  marineFrom: Point,
  marineTo: Point,
  radius: number,
): boolean {
  if (radius < 0 || !Number.isFinite(radius)
    || !Number.isFinite(targetFrom.x) || !Number.isFinite(targetFrom.y)
    || !Number.isFinite(targetTo.x) || !Number.isFinite(targetTo.y)
    || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)
    || !Number.isFinite(marineFrom.x) || !Number.isFinite(marineFrom.y)
    || !Number.isFinite(marineTo.x) || !Number.isFinite(marineTo.y)) return false;

  // Translate before scaling for precision near a distant anchor. If subtraction
  // overflows, scale first instead; all later polynomial coefficients stay bounded.
  let cx = targetFrom.x - anchor.x, cy = targetFrom.y - anchor.y;
  let tx = targetTo.x - anchor.x, ty = targetTo.y - anchor.y;
  let bx = marineFrom.x - anchor.x, by = marineFrom.y - anchor.y;
  let ex = marineTo.x - anchor.x, ey = marineTo.y - anchor.y;
  let r = radius;
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(tx) || !Number.isFinite(ty)
    || !Number.isFinite(bx) || !Number.isFinite(by) || !Number.isFinite(ex) || !Number.isFinite(ey)) {
    const absoluteScale = Math.max(Math.abs(targetFrom.x), Math.abs(targetFrom.y),
      Math.abs(targetTo.x), Math.abs(targetTo.y), Math.abs(anchor.x), Math.abs(anchor.y),
      Math.abs(marineFrom.x), Math.abs(marineFrom.y), Math.abs(marineTo.x), Math.abs(marineTo.y), r);
    cx = targetFrom.x / absoluteScale - anchor.x / absoluteScale;
    cy = targetFrom.y / absoluteScale - anchor.y / absoluteScale;
    tx = targetTo.x / absoluteScale - anchor.x / absoluteScale;
    ty = targetTo.y / absoluteScale - anchor.y / absoluteScale;
    bx = marineFrom.x / absoluteScale - anchor.x / absoluteScale;
    by = marineFrom.y / absoluteScale - anchor.y / absoluteScale;
    ex = marineTo.x / absoluteScale - anchor.x / absoluteScale;
    ey = marineTo.y / absoluteScale - anchor.y / absoluteScale;
    r /= absoluteScale;
  }
  const scale = Math.max(Math.abs(cx), Math.abs(cy), Math.abs(tx), Math.abs(ty),
    Math.abs(bx), Math.abs(by), Math.abs(ex), Math.abs(ey), r);
  if (scale === 0) return true;
  cx /= scale; cy /= scale; tx /= scale; ty /= scale;
  bx /= scale; by /= scale; ex /= scale; ey /= scale; r /= scale;
  const vx = tx - cx, vy = ty - cy, wx = ex - bx, wy = ey - by;
  const contactRadiusSquared = (r + CONTACT_EPSILON) ** 2;
  if (circleSweep(cx, cy, vx, vy, contactRadiusSquared)
    || circleSweep(cx - bx, cy - by, vx - wx, vy - wy, contactRadiusSquared)
    || segmentContact(cx, cy, bx, by, contactRadiusSquared)
    || segmentContact(tx, ty, ex, ey, contactRadiusSquared)) return true;

  const s0 = cross(cx, cy, bx, by), targetSlope = cross(vx, vy, bx, by);
  if (wx === 0 && wy === 0) {
    // For two fixed segments the closest pair involves an endpoint, unless they
    // intersect. The four endpoint distance checks above handle parallel motion.
    if (targetSlope === 0) return false;
    const t = -s0 / targetSlope;
    return t > 0 && t < 1 && segmentContact(cx + vx * t, cy + vy * t, bx, by, contactRadiusSquared);
  }

  // Interior contact means F(t) = cross(C(t), B(t))²-r²|B(t)|² <= 0.
  // Unless an endpoint circle was contacted, a minimum in the valid projection
  // interval lies at F'=0. Projection boundaries themselves belong to the caps.
  const s1 = targetSlope + cross(cx, cy, wx, wy), s2 = cross(vx, vy, wx, wy), r2 = r * r;
  const d0 = 2 * s0 * s1 - r2 * 2 * (bx * wx + by * wy);
  const d1 = 2 * (s1 * s1 + 2 * s0 * s2 - r2 * (wx * wx + wy * wy));
  const d2 = 6 * s1 * s2, d3 = 4 * s2 * s2;

  // Roots of F'' partition the cubic F' into at most three monotone intervals.
  // Stable quadratic roots and scalar partitions keep even the rotating case allocation-free.
  let first = 1, second = 1;
  const qa = 3 * d3, qb = 2 * d2, qc = d1;
  if (qa === 0) {
    if (qb !== 0) { const root = -qc / qb; if (root > 0 && root < 1) first = root; }
  } else {
    const discriminant = qb * qb - 4 * qa * qc;
    const tolerance = 16 * Number.EPSILON * (qb * qb + Math.abs(4 * qa * qc));
    if (discriminant >= -tolerance) {
      const squareRoot = Math.sqrt(Math.max(0, discriminant));
      const q = -.5 * (qb + (qb < 0 ? -squareRoot : squareRoot));
      const root1 = q === 0 ? -qb / (2 * qa) : q / qa;
      const root2 = q === 0 ? root1 : qc / q;
      if (root1 > 0 && root1 < 1) first = root1;
      if (root2 > 0 && root2 < 1) {
        if (root2 < first) { second = first; first = root2; }
        else second = root2;
      }
    }
  }
  for (let interval = 0; interval < 3; interval++) {
    const lo = interval === 0 ? 0 : interval === 1 ? first : second;
    const hi = interval === 0 ? first : interval === 1 ? second : 1;
    if (hi > lo && criticalIntervalContact(lo, hi, d0, d1, d2, d3,
      cx, cy, vx, vy, bx, by, wx, wy, contactRadiusSquared)) return true;
  }
  return false;
}
