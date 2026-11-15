import * as T from 'three';
import {describe, expect, it} from 'vitest';
import {ACT2_INTERIOR_PROFILES, buildAct2InteriorInlay} from './RoomInteriorAct2';
import {InteriorDeckChart} from './InteriorDeckGeometry';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';

const ids = [
  'safety-interlock-station', 'coolant-plant', 'service-shaft-landing', 'infested-workshop',
  'shielding-gate', 'containment-annulus', 'manual-control-chamber', 'overload-floor',
] as const;
const luminance = (r: number, g: number, b: number) => r * .2126 + g * .7152 + b * .0722;

describe('unconnected late-story interior direction', () => {
  it('owns exactly eight distinct function profiles with restrained keys', () => {
    expect(Object.keys(ACT2_INTERIOR_PROFILES).sort()).toEqual([...ids].sort());
    expect(new Set(Object.values(ACT2_INTERIOR_PROFILES).map(p => p.kind)).size).toBe(8);
    for (const profile of Object.values(ACT2_INTERIOR_PROFILES)) {
      expect(profile.landmark.length).toBeGreaterThan(25);
      for (const value of [profile.deck, profile.zone, profile.trim, profile.key]) {
        const channels = [value >> 16 & 255, value >> 8 & 255, value & 255];
        expect(Math.max(...channels) - Math.min(...channels)).toBeLessThan(65);
      }
    }
  });

  it.each(ids)('%s clips a deterministic quiet inlay to its frozen deck', id => {
    const template = ROOM_TEMPLATES[id], plan = SHIP_ARCHITECTURE_PLANS[id]!;
    const before = JSON.stringify({template, plan});
    const profile = ACT2_INTERIOR_PROFILES[id], base = new T.Color(profile.deck), trim = new T.Color(profile.trim);
    const originalBase = base.clone(), originalTrim = trim.clone();
    const first = new InteriorDeckChart(template), second = new InteriorDeckChart(template);
    expect(buildAct2InteriorInlay(id, plan, first, base, trim)).toBe(true);
    expect(buildAct2InteriorInlay(id, plan, second, base, trim)).toBe(true);
    expect(first.positions.length).toBeGreaterThan(54);
    expect(first.positions.length).toBeLessThan(45000);
    expect(first.positions).toEqual(second.positions);
    expect(first.colors).toEqual(second.colors);
    expect(base.equals(originalBase)).toBe(true);
    expect(trim.equals(originalTrim)).toBe(true);
    const geometry = first.geometry(), p = geometry.getAttribute('position'), color = geometry.getAttribute('color');
    const baseLuma = luminance(base.r, base.g, base.b);
    for (let i = 0; i < p.count; i++) {
      expect(p.getY(i)).toBeGreaterThan(0);
      expect(p.getY(i)).toBeLessThan(.022);
      const luma = luminance(color.getX(i), color.getY(i), color.getZ(i));
      expect((Math.max(luma, baseLuma) + .05) / (Math.min(luma, baseLuma) + .05)).toBeLessThan(1.35);
    }
    for (let i = 0; i < p.count; i += 3) {
      const center = {x: (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) * 32 / 3,
        y: (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) * 32 / 3};
      expect(clearPolygonTopology(template, center, center), JSON.stringify(center)).toBe(true);
      expect(template.obstacles.some(r => center.x > r.x + 1e-4 && center.x < r.x + r.width - 1e-4 && center.y > r.y + 1e-4 && center.y < r.y + r.height - 1e-4)).toBe(false);
      const ax = p.getX(i + 1) - p.getX(i), az = p.getZ(i + 1) - p.getZ(i);
      const bx = p.getX(i + 2) - p.getX(i), bz = p.getZ(i + 2) - p.getZ(i);
      expect(az * bx - ax * bz).toBeGreaterThanOrEqual(-1e-8);
    }
    geometry.dispose();
    expect(JSON.stringify({template, plan})).toBe(before);
  });

  it('declines unrelated rooms without writing a deck', () => {
    const id = 'diagnostic-gallery', chart = new InteriorDeckChart(ROOM_TEMPLATES[id]);
    expect(buildAct2InteriorInlay(id, SHIP_ARCHITECTURE_PLANS[id]!, chart, new T.Color(.2, .2, .2), new T.Color(.3, .3, .3))).toBe(false);
    expect(chart.positions).toHaveLength(0);
  });
});
