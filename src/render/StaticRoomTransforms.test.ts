import { expect, it, vi } from 'vitest';
import { Group, Object3D, Scene, Vector3 } from 'three';
import { freezeStaticRoom } from './StaticRoomTransforms';

it('skips static subtree walks while retaining exact nested transforms and explicit refresh', () => {
  const scene = new Scene(), room = new Group(), group = new Group(), prop = new Object3D();
  scene.matrixAutoUpdate = false;
  group.position.set(2, 3, 4); prop.position.set(-1, .5, 2);
  group.add(prop); room.add(group); scene.add(room);
  freezeStaticRoom(room);
  const expected = prop.matrixWorld.clone(), walk = vi.spyOn(prop, 'updateMatrixWorld');
  scene.updateMatrixWorld(); scene.updateMatrixWorld();
  expect(walk).not.toHaveBeenCalled(); expect(prop.matrixWorld.equals(expected)).toBe(true);
  const late = new Object3D(); late.position.set(7, 2, -1); group.add(late);
  freezeStaticRoom(room);
  expect(late.getWorldPosition(new Vector3()).toArray()).toEqual([9, 5, 3]);
  expect(late.matrixAutoUpdate).toBe(false);
  const refreshed = prop.matrixWorld.clone(); walk.mockClear();
  scene.updateMatrixWorld(); expect(walk).not.toHaveBeenCalled();
  scene.updateMatrixWorld(true); expect(walk).toHaveBeenCalledOnce();
  expect(prop.matrixWorld.equals(refreshed)).toBe(true);
});
