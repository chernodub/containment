import { beforeAll, expect, it, vi } from 'vitest';
import * as T from 'three';
import { loadModels } from '../../../../tests/loadModels';
import { marine, disposeModel } from '../../models';
import { ElementKit } from '../ElementKit';
import { createArcPresentation } from './index';
import type { AbilityFrame } from '../types';
import { MarineTimeEcho } from './MarineTimeEcho';

beforeAll(loadModels);

it('uses the shipped marine animated skeleton for its two held Overclock poses', () => {
  const model = marine(), kit = new ElementKit(new T.Group()), fx = createArcPresentation(kit);
  const echo = new MarineTimeEcho(), oldPose = MarineTimeEcho.pose(), newPose = MarineTimeEcho.pose();
  const fallback = vi.spyOn(kit, 'afterImage');
  const game = { player: { x: 128, y: 160, angle: .4, vx: 0, vy: 0 },
    stats: { shotsFired: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [] };
  const frame: AbilityFrame = { game: game as never, marine: model.root, marineBody: model.body,
    dt: .016, visible: true, snapshot: { rig: 'arc', slots: null, zones: [], deployables: [],
      dashing: false, invulnerable: false, hostileTimeScale: .3,
      overdrive: { active: true, activeRemainingMs: 4000, ready: false, charge: 0 } } };
  try {
    model.root.position.set(4, 0, 5); model.animate(0, 1, .4);
    expect(echo.capture(oldPose, model.root, 4, 5, 5, 1.2, 5, .4)).toBe(true);
    for (let i = 1; i <= 8; i++) model.animate(i / 60, 1, .4, .7, .25, { x: 220, y: 0 });
    expect(echo.capture(newPose, model.root, 4, 5, 5, 1.2, 5, .4)).toBe(true);
    expect(newPose).not.toEqual(oldPose);
    kit.begin(.016); fx.update(frame); kit.end();
    expect(fallback).not.toHaveBeenCalled();
    expect(kit.batches.solid.mesh.count).toBe(0);
    const native: T.SkinnedMesh[] = [];
    kit.root.traverse(node => { if (node instanceof T.SkinnedMesh) native.push(node); });
    expect(native).toHaveLength(2);
    expect(native.every(mesh => mesh.visible)).toBe(true);
    const delayed = native.map(mesh => mesh.skeleton.boneMatrices!.slice());
    // Paused refresh changes neither the stored delayed pose nor GPU inventory.
    frame.dt = 0; kit.begin(0); fx.update(frame); kit.end();
    expect(native.map(mesh => mesh.skeleton.boneMatrices)).toEqual(delayed);
    frame.snapshot = { ...frame.snapshot!, hostileTimeScale: 1 };
    kit.begin(.016); fx.update(frame); kit.end();
    expect(kit.batches.solid.mesh.count).toBe(0);
    expect(native.every(mesh => !mesh.visible)).toBe(true);
  } finally { fx.dispose(); kit.dispose(); disposeModel(model.root); }
});
