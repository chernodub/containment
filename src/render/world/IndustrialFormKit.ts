import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** One bevel scale for ship machinery; never inflate the authored envelope. */
export function industrialBevel(width: number, height: number, depth: number): number {
  return Math.min(.065, Math.min(width, height, depth) * .16);
}

/** Real rounded edges with analytic face/bevel normals, ready for material merging. */
export function industrialBoxGeometry(width: number, height: number, depth: number, radius = industrialBevel(width, height, depth)): T.BufferGeometry {
  const r = Math.min(Math.max(0, radius), Math.min(width, height, depth) * .49);
  return r > 0 ? new RoundedBoxGeometry(width, height, depth, 1, r) : new T.BoxGeometry(width, height, depth);
}

/** Rounded pressure vessel with separate flat cap normals and smooth radial normals. */
export function industrialCylinderGeometry(radius: number, height: number, bevel = Math.min(.055, radius * .12, height * .16), segments = 16): T.BufferGeometry {
  const b = Math.min(bevel, radius * .49, height * .49);
  const profile = [
    new T.Vector2(0, -height / 2), new T.Vector2(radius - b, -height / 2),
    new T.Vector2(radius - b + b * .7071, -height / 2 + b * .2929),
    new T.Vector2(radius, -height / 2 + b), new T.Vector2(radius, height / 2 - b),
    new T.Vector2(radius - b + b * .7071, height / 2 - b * .2929),
    new T.Vector2(radius - b, height / 2), new T.Vector2(0, height / 2),
  ];
  return new T.LatheGeometry(profile, segments);
}

export type FormWriter = {
  box(material: T.Material, x: number, y: number, z: number, width: number, height: number, depth: number, angle?: number): void;
  pipe(material: T.Material, a: T.Vector3, b: T.Vector3, radius: number): void;
};
export type FormRoles = { body: T.Material; trim: T.Material; accent: T.Material };

/** A broad inset face, rolled frame and two integral feet in the caller's batches. */
export function industrialCabinet(w: FormWriter, m: FormRoles, x: number, y: number, z: number, width: number, height: number, depth: number): void {
  w.box(m.body, x, y, z, width, height, depth);
  const front = z + depth * .5, edge = Math.min(.10, width * .07, height * .06);
  w.box(m.accent, x, y, front + .006, width * .80, height * .76, .012);
  for (const side of [-1, 1]) {
    w.box(m.trim, x + side * (width * .5 - edge), y, front + .018, edge, height * .94, .045);
    w.box(m.trim, x, y + side * (height * .5 - edge), front + .018, width * .88, edge, .045);
    w.box(m.trim, x + side * width * .32, y - height * .5 + .05, z, width * .17, .10, depth * .88);
  }
  for (let row = 0; row < 3; row++) w.box(m.body, x - width * .12, y + (row - 1) * height * .14, front + .018, width * .49, height * .055, .025);
  w.box(m.trim, x + width * .28, y, front + .045, edge * .6, height * .27, .07);
}

/** Broad ribs and recessed corner castings describe a freight shell without micro-detail. */
export function industrialCrate(w: FormWriter, m: FormRoles, x: number, y: number, z: number, width: number, height: number, depth: number): void {
  w.box(m.body, x, y, z, width * .96, height * .96, depth * .96);
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      w.box(m.trim, x + side * width * .43, y, z + end * depth * .43, width * .14, height, depth * .14);
      w.box(m.accent, x + side * width * .43, y + height * .43, z + end * depth * .501, width * .065, height * .065, .012);
    }
    for (const offset of [-.27, 0, .27]) w.box(m.trim, x + width * offset, y, z + side * depth * .477, width * .05, height * .84, depth * .045);
    w.box(m.trim, x, y + side * height * .43, z, width * .88, height * .14, depth * .99);
  }
}
