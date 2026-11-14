import {describe, expect, it} from 'vitest';
import * as T from 'three';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';

/** Exact camera recovered from the original seed1729 room6 snapshot. */
function armoryPose() {
  const camera = new T.PerspectiveCamera(28, 16 / 9, .1, 160);
  camera.position.set(14.028286815310697, 24.287016892941725, 33.35174449197629);
  camera.quaternion.set(-.4527600968822728, 0, 0, .8916323764148287);
  camera.zoom = 1.071253228546418;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
}

function bounds(camera: T.Camera, x: number, z: number, radius: number, height: number, width = 1920, cssHeight = 1080) {
  const point = new T.Vector3();
  const result = {left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity};
  for (const ix of [-1, 1]) for (const iz of [-1, 1]) for (const y of [0, height]) {
    point.set(x + ix * radius, y, z + iz * radius).project(camera);
    const px = (point.x + 1) * width / 2, py = (1 - point.y) * cssHeight / 2;
    result.left = Math.min(result.left, px); result.right = Math.max(result.right, px);
    result.top = Math.min(result.top, py); result.bottom = Math.max(result.bottom, py);
  }
  return result;
}

describe('organic Armory room margin', () => {
  it.each([[1920, 1080], [1280, 720]])('keeps the actual Brute and marine inside at %i×%i with hero and room limits', (width, cssHeight) => {
    const camera = armoryPose(), hud = new HudCombatFraming(), final = new RoomCombatFraming();
    const hero = {x: 112.19879280089408 / 32, z: 471.91372017068306 / 32, radius: .5, height: 2.05};
    const brute = {id: 1, x: 128.52716207975018, y: 725.447334729598, radius: 28, health: 603, windupMs: 500};
    const height = 4.3941413771674185;
    const scale = cssHeight / 1080;
    hud.resize(width, cssHeight); hud.setInsets({left: 0, top: 182 * scale, right: 292 * scale, bottom: 120 * scale});
    const crawler = {id: 3, x: 102.97109583483781, y: 353.28630374157336, radius: 14, health: 47};
    hud.selectContacts(hero.x, hero.z, 1.5266594401569926, [brute, crawler], 32, id => id === 1 ? height : 1.2);
    const before = bounds(camera, brute.x / 32, brute.y / 32, brute.radius / 32, height, width, cssHeight);
    expect(before.left).toBeCloseTo(-196.15772446779076 * scale, 5);
    expect(before.bottom).toBeCloseTo(1125.816090468025 * scale, 5);
    // Resume the exact retained pose rather than changing its spring history.
    Object.assign(final, {ready: true, roomWidth: 37.5, roomDepth: 27.5,
      x: camera.position.x, z: camera.position.z, zoom: camera.zoom});
    final.apply(camera, new T.Vector3(), hero.x, hero.z, hero.radius, hero.height,
      37.5, 27.5, hud.viewport, cssHeight, 0, false, undefined, hud);
    hud.refreshFit(camera, new T.Vector3());
    const after = bounds(camera, brute.x / 32, brute.y / 32, brute.radius / 32, height, width, cssHeight);
    const marine = bounds(camera, hero.x, hero.z, hero.radius, hero.height, width, cssHeight);
    for (const body of [after, marine]) {
      expect(body.left).toBeGreaterThanOrEqual(0);
      expect(body.right).toBeLessThanOrEqual(1628 * scale);
      expect(body.top).toBeGreaterThanOrEqual(182 * scale);
      expect(body.bottom).toBeLessThanOrEqual(960 * scale);
    }
    expect(hud.diagnostics.fit).toBe(true);
    expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.999 * scale);
    expect(final.diagnostics.outside).toBeLessThanOrEqual(.18);
    expect(final.diagnostics.outsideX).toBeLessThanOrEqual(.18);
    expect(final.diagnostics.outsideZ).toBeLessThanOrEqual(.18);
  });
});
