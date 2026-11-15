import { describe, expect, it } from 'vitest';
import { FacilityNavigation, type NavigationGeometry } from './FacilityNavigation';
import {clearRectSweep} from './facilityGeometry';
import {clearPolygonTopology} from './polygonGeometry';

const geometry: NavigationGeometry = {
  bounds: { x: 0, y: 0, width: 640, height: 448 },
  blockers: [{ x: 288, y: 96, width: 64, height: 256 }],
  boundary: [{ x: 0, y: 0 }, { x: 640, y: 0 }, { x: 640, y: 448 }, { x: 0, y: 448 }],
};
const goal = { x: 528, y: 224 };

describe('navigation grid coordinate reuse', () => {
  it.each([14,28,38])('reaches the actual goal with deterministic continuously clear radius%s legs',radius=>{
    const before=JSON.stringify({geometry,goal});
    const run=()=>{
      const navigation=new FacilityNavigation(geometry),enemy={x:112,y:224,radius},path:{x:number;y:number}[]=[];
      for(let step=0;step<12&&Math.hypot(enemy.x-goal.x,enemy.y-goal.y)>.001;step++){
        const waypoint=navigation.waypoint(enemy,goal,1)??goal;
        expect(Number.isFinite(waypoint.x+waypoint.y)).toBe(true);
        expect(Math.hypot(waypoint.x-enemy.x,waypoint.y-enemy.y)).toBeGreaterThan(0);
        expect(clearPolygonTopology(geometry,enemy,waypoint,radius)).toBe(true);
        for(const solid of geometry.blockers)expect(clearRectSweep(enemy,waypoint,radius,solid)).toBe(true);
        path.push({...waypoint});Object.assign(enemy,waypoint);
      }
      expect(path.length).toBeLessThanOrEqual(12);expect(enemy.x).toBeCloseTo(goal.x);expect(enemy.y).toBeCloseTo(goal.y);
      return path;
    };
    // Exact rounded rectangle sweeps and committed visible legs intentionally
    // supersede the old square-expanded grid tie-order snapshot.
    expect(run()).toEqual(run());expect(JSON.stringify({geometry,goal})).toBe(before);
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
