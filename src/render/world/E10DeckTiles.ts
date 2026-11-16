import * as T from 'three';

type Vertex = { x: number; z: number };
const TILE = 2.8;
function clip(input: Vertex[], axis: 'x' | 'z', edge: number, keepGreater: boolean): Vertex[] {
  const output: Vertex[] = [];
  for (let i = 0; i < input.length; i++) {
    const p = input[i], q = input[(i + 1) % input.length];
    const a = (p[axis] - edge) * (keepGreater ? 1 : -1), b = (q[axis] - edge) * (keepGreater ? 1 : -1);
    if (a >= -1e-8) output.push(p);
    if ((a >= -1e-8) !== (b >= -1e-8)) {
      const f = a / (a - b); output.push({ x: p.x + (q.x - p.x) * f, z: p.z + (q.z - p.z) * f });
    }
  }
  return output;
}

/** Split the existing clipped deck at module boundaries, then assign ordinary
 * continuous atlas UVs. Native mip/anisotropic filtering cannot see hash/fract
 * discontinuities. The geometry stays on the authored walking skin. */
export function tileDeckGeometry(source: T.BufferGeometry): T.BufferGeometry {
  const p = source.getAttribute('position'), c = source.getAttribute('color');
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [];
  for (let i = 0; i < p.count; i += 3) {
    const triangle = [0, 1, 2].map(k => ({ x: p.getX(i + k), z: p.getZ(i + k) }));
    const minX = Math.floor(Math.min(...triangle.map(v => v.x)) / TILE), maxX = Math.floor((Math.max(...triangle.map(v => v.x)) - 1e-7) / TILE);
    const minZ = Math.floor(Math.min(...triangle.map(v => v.z)) / TILE), maxZ = Math.floor((Math.max(...triangle.map(v => v.z)) - 1e-7) / TILE);
    for (let tx = minX; tx <= maxX; tx++) for (let tz = minZ; tz <= maxZ; tz++) {
      let poly = clip(triangle, 'x', tx * TILE, true);
      poly = clip(poly, 'x', (tx + 1) * TILE, false);
      poly = clip(poly, 'z', tz * TILE, true);
      poly = clip(poly, 'z', (tz + 1) * TILE, false);
      if (poly.length < 3) continue;
      const hash = (Math.imul(tx + 1729, 1597334677) ^ Math.imul(tz + 73, 3812015801)) >>> 0;
      const choice = hash / 4294967296, variant = choice < .52 ? 0 : choice < .8 ? 1 : choice < .9 ? 2 : 3;
      const rotate = !!(hash & 0x10000), offsetX = variant % 2, offsetZ = Math.floor(variant / 2);
      for (let n = 1; n < poly.length - 1; n++) {
        const corners = [poly[0], poly[n], poly[n + 1]];
        const area = (corners[1].x - corners[0].x) * (corners[2].z - corners[0].z) - (corners[1].z - corners[0].z) * (corners[2].x - corners[0].x);
        if (Math.abs(area) < 1e-9) continue;
        for (const v of corners) {
          positions.push(v.x, p.getY(i), v.z); colors.push(c.getX(i), c.getY(i), c.getZ(i));
          let u = (v.x / TILE - tx) * .998 + .001, w = (v.z / TILE - tz) * .998 + .001;
          if (rotate) [u, w] = [w, u];
          uvs.push((u + offsetX) * .5, (w + offsetZ) * .5);
        }
      }
    }
  }
  const geometry = new T.BufferGeometry(), normals = new Float32Array(positions.length);
  for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('normal', new T.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
