import * as T from 'three';

/** Refine the existing welded sculpture in bind space before actors share it. */
export function shapeBrute(geometry: T.BufferGeometry, regalia: boolean) {
  const p = geometry.getAttribute('position');
  const zones = geometry.getAttribute('_heavyzone');
  if (!zones) return;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (regalia && (zones.getX(i) >> 4) === 1) {
      // Carry the existing central prong out past the near shoulder.
      const rise = T.MathUtils.smoothstep(z, 4.61, 5.23);
      p.setXYZ(i, x - .32 * rise, y + 1.18 * rise, z + 1.65 * rise);
      continue;
    }
    const lateral = Math.abs(y);
    const face = T.MathUtils.smoothstep(x, 1.85, 3.45) *
      (1 - T.MathUtils.smoothstep(lateral, .95, 1.45)) * T.MathUtils.smoothstep(z, 3.5, 4);
    y *= 1 - .27 * face;
    x += .25 * face;
    const forearm = T.MathUtils.smoothstep(lateral, 2.05, 2.6) *
      (1 - T.MathUtils.smoothstep(z, 3.4, 4));
    // Flatten the outer elbow into the upper arm and narrow the heel
    // behind the broad transverse knuckle ridge.
    const elbow = forearm * Math.exp(-2.8 * (x + .21) ** 2);
    z -= elbow * (.30 * (z - 3.32) + .16 * (lateral - 3.28));
    const wrist = forearm * Math.exp(-3 * (x - 1.45) ** 2);
    y -= (y - Math.sign(y) * 3.1) * .34 * wrist;
    z -= (z - 2.87) * .28 * wrist;
    const palm = forearm * T.MathUtils.smoothstep(x, 1.55, 2.12);
    const heel = palm * (1 - T.MathUtils.smoothstep(x, 2.12, 2.73));
    y -= (y - Math.sign(y) * 3) * .48 * heel;
    z += palm * (.12 * Math.exp(-8 * (x - 2.64) ** 2) - .07 * Math.exp(-6 * (x - 2.18) ** 2));
    p.setXYZ(i, x, y, z);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
