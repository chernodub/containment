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
});
