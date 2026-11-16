import * as T from 'three';
import {FULL_COMBAT_VIEWPORT,type CombatViewport} from './HudCombatFraming';

/** Fifteen-percent pullback: final uniform marine measures110–118 px in the native camera. */
export const COMBAT_VIEW_HEIGHT = 15;
/** Full body envelope, expressed in NDC: middle 60% width and 55% height. */
export const PLAYER_SAFE_INSET = Object.freeze({ x: .60, y: .55 });

/** Bounded threat/aim lead keeps a remote boss from taking the camera away from the marine. */
export function combatFocusTarget(
  x: number, z: number, angle: number, bossX: number, bossZ: number,
  bossActive: boolean, reducedMotion: boolean, out: T.Vector3,
): T.Vector3 {
  const lead = reducedMotion ? 0 : .65;
  let dx = Math.cos(angle) * lead;
  let dz = Math.sin(angle) * lead;
  if (bossActive) {
    const bx = bossX - x, bz = bossZ - z;
    const distance = Math.hypot(bx, bz);
    const amount = distance > 0 ? Math.min(1.65, distance * .28) / distance : 0;
    dx = dx * .4 + bx * amount;
    dz = dz * .4 + bz * amount;
  }
  return out.set(x + dx, 0, z + dz);
}

/** Keep a moving body inside the central safe inset, using the rendered camera.
 * Oversized envelopes (extreme desktop resizing/debug zoom) use a documented
 * centered fallback: expand the inset only enough to contain that body. */
export function protectPlayerFrame(
  camera: T.OrthographicCamera | T.PerspectiveCamera, focus: T.Vector3,
  x: number, z: number, radius: number, height: number,
  point: T.Vector3, target: T.Vector3, viewport:CombatViewport=FULL_COMBAT_VIEWPORT,
): boolean {
  let changed = false;
  for (let pass = 0; pass < 3; pass++) {
    let left = Infinity, right = -Infinity, top = -Infinity, bottom = Infinity;
    for (let ix = -1; ix <= 1; ix += 2) for (let iz = -1; iz <= 1; iz += 2) for (let iy = 0; iy < 2; iy++) {
      point.set(x + ix * radius, iy * height, z + iz * radius).project(camera);
      left = Math.min(left, point.x);
      right = Math.max(right, point.x);
      top = Math.max(top, point.y);
      bottom = Math.min(bottom, point.y);
    }
    const insetX = Math.max(PLAYER_SAFE_INSET.x*viewport.halfX, (right - left) * .5 + .015);
    const insetY = Math.max(PLAYER_SAFE_INSET.y*viewport.halfY, (top - bottom) * .5 + .015);
    const correctionX = left < viewport.centerX-insetX ? left-viewport.centerX+insetX : right > viewport.centerX+insetX ? right-viewport.centerX-insetX : 0;
    const correctionY = top > viewport.centerY+insetY ? top-viewport.centerY-insetY : bottom < viewport.centerY-insetY ? bottom-viewport.centerY+insetY : 0;
    if (Math.abs(correctionX) + Math.abs(correctionY) < 1e-7) break;
    point.set(x, height * .5, z).project(camera);
    target.copy(point);
    target.x -= correctionX;
    target.y -= correctionY;
    point.unproject(camera);
    target.unproject(camera);
    point.sub(target);
    point.z -= point.y * camera.matrixWorld.elements[10] / camera.matrixWorld.elements[9];
    point.y = 0;
    camera.position.add(point);
    focus.add(point);
    camera.updateMatrixWorld();
    changed = true;
  }
  return changed;
}
