import { describe, expect, it } from 'vitest';
import { FacilityNavigation, type NavigationGeometry } from './FacilityNavigation';

const geometry: NavigationGeometry = {
  bounds: { x: 0, y: 0, width: 640, height: 448 },
  blockers: [{ x: 288, y: 96, width: 64, height: 256 }],
  boundary: [{ x: 0, y: 0 }, { x: 640, y: 0 }, { x: 640, y: 448 }, { x: 0, y: 448 }],
};
const goal = { x: 528, y: 224 };

describe('navigation grid coordinate reuse', () => {
  it('preserves the prior waypoint sequence and tie order at standard and wider clearances', () => {
    const paths = [14, 28, 38].map(radius => {
      const navigation = new FacilityNavigation(geometry), enemy = { x: 112, y: 224, radius };
      const path: Array<{ x: number; y: number } | null> = [];
      for (let step = 0; step < 12; step++) {
        const waypoint = navigation.waypoint(enemy, goal, 1);
        path.push(waypoint);
        if (!waypoint || waypoint === enemy) break;
        Object.assign(enemy, waypoint);
      }
      return { radius, path };
    });
    expect(paths).toMatchInlineSnapshot(`
      [
        {
          "path": [
            {
              "x": 240,
              "y": 112,
            },
            {
              "x": 272,
              "y": 48,
            },
            {
              "x": 496,
              "y": 48,
            },
            null,
          ],
          "radius": 14,
        },
        {
          "path": [
            {
              "x": 240,
              "y": 112,
            },
            {
              "x": 240,
              "y": 48,
            },
            {
              "x": 464,
              "y": 48,
            },
            null,
          ],
          "radius": 28,
        },
        {
          "path": [
            {
              "x": 240,
              "y": 112,
            },
            {
              "x": 240,
              "y": 48,
            },
            {
              "x": 464,
              "y": 48,
            },
            null,
          ],
          "radius": 38,
        },
      ]
    `);
  });

  it('returns fresh public waypoints whose mutation cannot change the shared grid', () => {
    const navigation = new FacilityNavigation(geometry), enemy = { x: 112, y: 224, radius: 28 };
    const first = navigation.waypoint(enemy, goal, 1)!;
    const expected = { ...first };
    expect(first).not.toBe(enemy);
    expect(Object.isFrozen(first)).toBe(false);
    const second = navigation.waypoint(enemy, goal, 1);
    expect(second).toEqual(expected); expect(second).not.toBe(first);
    Object.assign(first, { x: -1000, y: -1000 });
    expect(navigation.waypoint(enemy, goal, 1)).toEqual(expected);
    expect(new FacilityNavigation(geometry).waypoint(enemy, goal, 1)).toEqual(expected);
  });
});
