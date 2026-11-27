import * as T from 'three';

/** Refine the existing welded sculpture in bind space before actors share it. */
export function shapeBrute(geometry: T.BufferGeometry, regalia: boolean) {
  const p = geometry.getAttribute('position');
  const zones = geometry.getAttribute('_heavyzone');
  if (!zones) return;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (regalia) continue;
    const lateral = Math.abs(y);
    const face = T.MathUtils.smoothstep(x, 1.85, 3.45) *
      (1 - T.MathUtils.smoothstep(lateral, .95, 1.45)) * T.MathUtils.smoothstep(z, 3.5, 4);
    y *= 1 - .27 * face;
    x += .25 * face;
    const forearm = T.MathUtils.smoothstep(lateral, 2.05, 2.6) *
      (1 - T.MathUtils.smoothstep(z, 3.4, 4));
    const wrist = forearm * Math.exp(-3 * (x - 1.45) ** 2);
    y -= (y - Math.sign(y) * 3.1) * .34 * wrist;
    z -= (z - 2.87) * .28 * wrist;
    const palm = forearm * T.MathUtils.smoothstep(x, 1.55, 2.12);
    z += palm * (.12 * Math.exp(-8 * (x - 2.64) ** 2) - .07 * Math.exp(-6 * (x - 2.18) ** 2));
    p.setXYZ(i, x, y, z);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
