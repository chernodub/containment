import { describe, expect, it } from 'vitest';
import { industrialBoxGeometry, industrialCylinderGeometry } from './IndustrialFormKit';

describe('industrial forms', () => {
  it('keeps real bevels inside the supplied envelope with finite unit normals', () => {
    for (const g of [industrialBoxGeometry(2, 1, 3), industrialCylinderGeometry(1, 2)]) {
      g.computeBoundingBox();
      const p = g.getAttribute('position'), n = g.getAttribute('normal');
      expect(p.count).toBeGreaterThan(24);
      for (let i = 0; i < n.count; i++) expect(Math.hypot(n.getX(i), n.getY(i), n.getZ(i))).toBeCloseTo(1, 4);
      expect(g.boundingBox!.min.y).toBeGreaterThanOrEqual(-1.00001);
      expect(g.boundingBox!.max.y).toBeLessThanOrEqual(1.00001);
      g.dispose();
    }
  });
  it('bounds milled housings at 44 triangles and keeps flat faces free of smoothing dents', () => {
    const g = industrialBoxGeometry(2, 1, 3);
    expect(g.getAttribute('position').count / 3).toBe(44);
    const n = g.getAttribute('normal'), p = g.getAttribute('position');
    let flatFaces = 0;
    for (let i = 0; i < p.count; i += 3) {
      const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
      if (Math.max(Math.abs(nx), Math.abs(ny), Math.abs(nz)) > .99999) flatFaces++;
      for (let j = 1; j < 3; j++) expect([n.getX(i + j), n.getY(i + j), n.getZ(i + j)]).toEqual([nx, ny, nz]);
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
      const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
      const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      expect(cx * nx + cy * ny + cz * nz).toBeGreaterThan(0);
    }
    expect(flatFaces).toBe(12);
    g.dispose();
  });
});
