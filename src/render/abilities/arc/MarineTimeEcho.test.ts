import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { ElementKit } from '../ElementKit';
import { GRAPHICS_PRESETS } from '../../graphicsOptions';
import { MarineTimeEcho } from './MarineTimeEcho';

function skeleton() {
  const root = new T.Group();
  const names = ['hips', 'ribs', 'neck', 'head', 'upper_arm.L', 'forearm.L', 'hand.L',
    'upper_arm.R', 'forearm.R', 'hand.R', 'thigh.L', 'shin.L', 'foot.L', 'toe.L',
    'thigh.R', 'shin.R', 'foot.R', 'toe.R'];
  names.forEach((name, i) => {
    const bone = new T.Bone(); bone.name = name;
    bone.position.set(i % 2 * .3, .3 + i * .08, i % 3 * .1); root.add(bone);
  });
  root.position.set(4, 0, 5);
  return root;
}

describe('animated marine time images', () => {
  it('records joint transforms in fixed storage and holds an actual delayed arm pose', () => {
    const root = skeleton(), scene = new T.Scene(), kit = new ElementKit(scene);
    const echo = new MarineTimeEcho(), oldPose = MarineTimeEcho.pose(), newPose = MarineTimeEcho.pose();
    expect(echo.capture(oldPose, root, 4, 5, 4.8, 1.2, 5, 0)).toBe(true);
    const frozen = oldPose.slice(), forearm = root.getObjectByName('forearm.L')!;
    forearm.position.y += .7;
    expect(echo.capture(newPose, root, 4, 5, 4.8, 1.2, 5, 0)).toBe(true);
    expect(oldPose).toEqual(frozen); expect(newPose).not.toEqual(oldPose);
    const draw = vi.spyOn(kit, 'draw'); kit.begin(0); echo.draw(kit, oldPose, 2.8, 5.3, .5); kit.end();
    const oldArm = draw.mock.calls.find(call => call[4] === .23)!;
    expect(kit.batches.solid.mesh.count).toBe(13);
    draw.mockClear(); kit.begin(0); echo.draw(kit, newPose, 2.8, 5.3, .5); kit.end();
    expect(draw.mock.calls.some(call => call[2] > oldArm[2])).toBe(true);
    // Capturing does not write the source pose or geometry.
    expect(forearm.position.y).toBeCloseTo(1.4);
    kit.dispose();
  });

  it('keeps Low articulated, allocates no GPU inventory and permits exact paused redraws', () => {
    const root = skeleton(), scene = new T.Scene(), kit = new ElementKit(scene);
    const echo = new MarineTimeEcho(), pose = MarineTimeEcho.pose();
    const inventory = new Set<unknown>();
    scene.traverse(node => { if (node instanceof T.Mesh) { inventory.add(node.geometry); inventory.add(node.material); } });
    echo.capture(pose, root, 4, 5, 4.8, 1.2, 5, 0);
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', true);
    kit.begin(0); echo.draw(kit, pose, 2.8, 5.3, .5); kit.end();
    const before = kit.batches.solid.mesh.instanceMatrix.array.slice();
    expect(kit.batches.solid.mesh.count).toBe(10);
    kit.begin(0); echo.draw(kit, pose, 2.8, 5.3, .5); kit.end();
    expect(kit.batches.solid.mesh.instanceMatrix.array).toEqual(before);
    const after = new Set<unknown>();
    scene.traverse(node => { if (node instanceof T.Mesh) { after.add(node.geometry); after.add(node.material); } });
    expect(after).toEqual(inventory); echo.clear();
    expect(echo.capture(pose, new T.Group(), 0, 0, 0, 1, 0, 0)).toBe(false);
    kit.dispose();
  });
});
