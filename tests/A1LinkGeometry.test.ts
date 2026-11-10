import {describe, expect, it} from 'vitest';
import {sweptLinkContact} from '../src/game/abilities/linkGeometry';

type Point = {x: number; y: number};
const origin = {x: 0, y: 0};
const point = (x: number, y = 0): Point => ({x, y});
const stationary = (target: Point, endpoint: Point, radius: number) =>
  sweptLinkContact(target, target, origin, endpoint, endpoint, radius);

describe('swept contact with a moving pylon-to-marine capsule', () => {
  it('tests the actual stationary capsule interior and both endpoint caps', () => {
    expect(stationary(point(5, .9), point(10), 1)).toBe(true);
    expect(stationary(point(5, 1.01), point(10), 1)).toBe(false);
    expect(stationary(point(-.9), point(10), 1)).toBe(true);
    expect(stationary(point(10.9), point(10), 1)).toBe(true);
    expect(stationary(point(-1.01), point(10), 1)).toBe(false);
    expect(stationary(point(11.01), point(10), 1)).toBe(false);
  });

  it('catches a target crossing between updates even though both positions are outside', () => {
    const from = point(5, -20), to = point(5, 20), marine = point(10);
    expect(stationary(from, marine, .5)).toBe(false);
    expect(stationary(to, marine, .5)).toBe(false);
    expect(sweptLinkContact(from, to, origin, marine, marine, .5)).toBe(true);
  });

  it('catches a marine dash sweeping the interior of the link across a stationary enemy', () => {
    const target = point(5), from = point(10, -10), to = point(10, 10);
    expect(stationary(target, from, .1)).toBe(false);
    expect(stationary(target, to, .1)).toBe(false);
    expect(sweptLinkContact(target, target, origin, from, to, .1)).toBe(true);
  });

  it('uses simultaneous relative motion instead of the broad triangle swept by the rope', () => {
    // At x=5 the rope and target both move upward ten units. Their vertical
    // separation stays three units, despite the target path entering the triangle.
    expect(sweptLinkContact(point(5, -2), point(5, 8), origin,
      point(10, -10), point(10, 10), 2)).toBe(false);
    expect(sweptLinkContact(point(5, -2), point(5, 8), origin,
      point(10, -10), point(10, 10), 2.2)).toBe(true);
  });

  it('handles moving targets and rotating links with a quadratic cross product', () => {
    // cross(C(t),B(t))=-92+224t-104t²; its root near .552 is inside the segment.
    expect(sweptLinkContact(point(8, 5), point(3, 2), origin,
      point(12, -4), point(4, 12), 0)).toBe(true);
    expect(sweptLinkContact(point(50, 50), point(40, 30), origin,
      point(12, -4), point(4, 12), 1)).toBe(false);
  });

  it('finds zero-radius interior grazing with no sign change in the cross product', () => {
    // cross(C(t),B(t))=(t-.5)² touches zero only at t=.5, projection=.5.
    expect(sweptLinkContact(point(0, -.25), point(1, .75), origin,
      point(1), point(1, 1), 0)).toBe(true);
    expect(sweptLinkContact(point(0, -.25001), point(1, .74999), origin,
      point(1), point(1, 1), 0)).toBe(false);
  });

  it('accepts exact capsule grazing and rejects points beyond the boundary', () => {
    expect(stationary(point(5, 1), point(10), 1)).toBe(true);
    expect(stationary(point(5, 1.000001), point(10), 1)).toBe(false);
    expect(sweptLinkContact(point(-2, 1), point(2, 1), origin,
      point(0, -5), point(0, -5), 1)).toBe(true);
    expect(sweptLinkContact(point(-2, 1.000001), point(2, 1.000001), origin,
      point(0, -5), point(0, -5), 1)).toBe(false);
  });

  it('sweeps the moving marine endpoint cap independently of interior contact', () => {
    expect(sweptLinkContact(point(5, 2), point(5, 2), origin,
      point(0, 2), point(10, 2), 0)).toBe(true);
    expect(sweptLinkContact(point(5, 2.5), point(5, 2.5), origin,
      point(0, 2), point(10, 2), .49)).toBe(false);
  });

  it('reduces a zero-length rope to the anchor circle and survives intermediate collapse', () => {
    expect(sweptLinkContact(point(-2), point(2), origin, origin, origin, 0)).toBe(true);
    expect(sweptLinkContact(point(-2, 1.01), point(2, 1.01), origin, origin, origin, 1)).toBe(false);
    expect(stationary(origin, origin, 0)).toBe(true);
    expect(sweptLinkContact(point(0, 1), point(0, 1), origin,
      point(10), point(-10), .99)).toBe(false);
    expect(sweptLinkContact(point(0, -2), point(0, 2), origin,
      point(10), point(-10), 0)).toBe(true);
  });

  it('rejects invalid coordinates and radius without throwing', () => {
    for (const invalid of [NaN, Infinity, -Infinity]) {
      for (let coordinate = 0; coordinate < 10; coordinate++) {
        const points = [point(5), point(5), origin, point(10), point(10)].map(p => ({...p}));
        points[Math.floor(coordinate / 2)][coordinate % 2 ? 'y' : 'x'] = invalid;
        expect(sweptLinkContact(points[0], points[1], points[2], points[3], points[4], 1)).toBe(false);
      }
      expect(stationary(point(5), point(10), invalid)).toBe(false);
    }
    expect(stationary(point(5), point(10), -1)).toBe(false);
  });

  it('preserves contact under translation, uniform scale, quarter turns and time reversal', () => {
    const cases = [
      {target: [point(8, 5), point(3, 2)], marine: [point(12, -4), point(4, 12)], radius: 0, contact: true},
      {target: [point(5, -2), point(5, 8)], marine: [point(10, -10), point(10, 10)], radius: 2, contact: false},
    ];
    for (const test of cases) for (const scale of [.000001, 1, 1_000_000]) {
      const transform = (p: Point) => ({x: 100 + p.y * scale, y: -200 - p.x * scale});
      const a = transform(origin), [c0, c1] = test.target.map(transform), [b0, b1] = test.marine.map(transform);
      expect(sweptLinkContact(c0, c1, a, b0, b1, test.radius * scale)).toBe(test.contact);
      expect(sweptLinkContact(c1, c0, a, b1, b0, test.radius * scale)).toBe(test.contact);
    }
  });

  it('returns deterministic results across repeated evaluations and finite extreme scales', () => {
    for (let n = 0; n < 500; n++) {
      expect(sweptLinkContact(point(8, 5), point(3, 2), origin,
        point(12, -4), point(4, 12), 0)).toBe(true);
      expect(sweptLinkContact(point(5, -2), point(5, 8), origin,
        point(10, -10), point(10, 10), 2)).toBe(false);
    }
    expect(stationary(point(5e200), point(1e201), 1e199)).toBe(true);
    expect(stationary(point(5e-200), point(1e-199), 0)).toBe(true);
    expect(sweptLinkContact(point(-1e308), point(1e308), point(-1e308),
      point(1e308), point(1e308), 0)).toBe(true);
  });
});
