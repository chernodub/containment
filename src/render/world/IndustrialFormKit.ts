import * as T from 'three';

/** One bevel scale for ship machinery; never inflate the authored envelope. */
export function industrialBevel(width: number, height: number, depth: number): number {
  return Math.min(.065, Math.min(width, height, depth) * .16);
}

/** A 44-triangle milled shell. Planar faces and chamfers have separate normal groups. */
export function industrialBoxGeometry(width: number, height: number, depth: number, radius = industrialBevel(width, height, depth)): T.BufferGeometry {
  const r = Math.min(Math.max(0, radius), Math.min(width, height, depth) * .49);
  if (r === 0) return new T.BoxGeometry(width, height, depth);
  const half = [width / 2, height / 2, depth / 2], inset = half.map(value => value - r);
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
  const face = (points: number[][]) => {
    const a = new T.Vector3(...points[0]), b = new T.Vector3(...points[1]), c = new T.Vector3(...points[2]);
    const normal = b.sub(a).cross(c.sub(a)).normalize();
    const center = points.reduce((sum, p) => sum.add(new T.Vector3(...p)), new T.Vector3());
    if (normal.dot(center) < 0) { points.reverse(); normal.negate(); }
    for (let i = 1; i < points.length - 1; i++) for (const p of [points[0], points[i], points[i + 1]]) {
      positions.push(...p); normals.push(normal.x, normal.y, normal.z); uvs.push(p[0] / width + .5, (p[1] + p[2]) / (height + depth) + .5);
    }
  };
  for (let axis = 0; axis < 3; axis++) for (const sign of [-1, 1]) {
    const other = [0, 1, 2].filter(value => value !== axis);
    face([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => {
      const p = [0, 0, 0]; p[axis] = half[axis] * sign; p[other[0]] = inset[other[0]] * u; p[other[1]] = inset[other[1]] * v; return p;
    }));
  }
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
    const c = 3 - a - b;
    face([[0, -1], [1, -1], [1, 1], [0, 1]].map(([edge, end]) => {
      const p = [0, 0, 0]; p[a] = (edge ? inset[a] : half[a]) * sa; p[b] = (edge ? half[b] : inset[b]) * sb; p[c] = inset[c] * end; return p;
    }));
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) face([0, 1, 2].map(axis => half.map((value, i) => (i === axis ? value : inset[i]) * [sx, sy, sz][i])));
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  return geometry;
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
  const geometry = new T.LatheGeometry(profile, segments);
  const normals = geometry.getAttribute('normal');
  const radial = [0, 0, Math.SQRT1_2, 1, 1, Math.SQRT1_2, 0, 0];
  const vertical = [-1, -1, -Math.SQRT1_2, 0, 0, Math.SQRT1_2, 1, 1];
  for (let col = 0; col <= segments; col++) {
    const angle = col / segments * Math.PI * 2;
    for (let row = 0; row < profile.length; row++) normals.setXYZ(col * profile.length + row, Math.sin(angle) * radial[row], vertical[row], Math.cos(angle) * radial[row]);
  }
  return geometry;
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
  // A lighter fitted lid and a dark central seam separate the broad top from
  // vertical sides. The writer retains its existing material/draw ownership.
  w.box(m.trim, x, y + height * .5 - .012, z, width * .92, .025, depth * .91);
  w.box(m.accent, x, y + height * .5 + .002, z, width * .018, .008, depth * .80);
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
  w.box(m.trim, x, y + height * .472, z, width * .83, height * .025, depth * .79);
  for (const side of [-1, 1]) w.box(m.accent, x + side * width * .17, y + height * .49, z, width * .045, height * .012, depth * .63);
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      w.box(m.trim, x + side * width * .43, y, z + end * depth * .43, width * .14, height, depth * .14);
      w.box(m.accent, x + side * width * .43, y + height * .43, z + end * depth * .501, width * .065, height * .065, .012);
    }
    for (const offset of [-.27, 0, .27]) w.box(m.trim, x + width * offset, y, z + side * depth * .477, width * .05, height * .84, depth * .045);
    w.box(m.trim, x, y + side * height * .43, z, width * .88, height * .14, depth * .99);
  }
}

/** Large physical stencil digits, emitted into the caller's existing finish batch. */
export function industrialStencil(w: FormWriter, material: T.Material, text: string, x: number, y: number, z: number, width: number, depth: number): void {
  const digits: Readonly<Record<string, readonly string[]>> = {
    '0': ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'],
    '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'],
    '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'],
  };
  const columns = Math.max(1, text.length * 4 - 1), cellX = width / columns, cellZ = depth / 5;
  for (let digit = 0; digit < text.length; digit++) {
    const rows = digits[text[digit]];
    if (!rows) continue;
    for (let row = 0; row < 5; row++) for (let column = 0; column < 3; column++) {
      if (rows[row][column] !== '1') continue;
      w.box(material, x - width * .5 + (digit * 4 + column + .5) * cellX, y,
        z - depth * .5 + (row + .5) * cellZ, cellX * .82, .008, cellZ * .82);
    }
  }
}
