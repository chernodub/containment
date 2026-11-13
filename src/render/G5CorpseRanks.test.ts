import {beforeAll, expect, it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien, freezeCorpse, disposeModel} from './models';
import {DeathRagdolls, initDeathPhysics} from './DeathRagdolls';

beforeAll(async () => {
  await loadModels();
  await initDeathPhysics();
});

for (const [family, rank] of [['brute', 'warden'], ['carrier', 'matron']]) {
  it(`${rank} retains authored anatomy above the deck with native joint limits`, () => {
    const model = alien(family, true), physics = new DeathRagdolls();
    const world = new T.Group(), floor = new T.Mesh(new T.BoxGeometry(20, .32, 20));
    floor.position.set(10, -.18, 10);
    world.add(floor);
    physics.setRoom({width: 640, height: 640, obstacles: []}, world);
    try {
      model.root.position.set(5, .5, 5);
      model.setThreat!(0, null, rank);
      model.animate(1, 1, .4);
      freezeCorpse(model);
      expect(physics.add(1, model, family, {x: 8, z: 2})).toBe(true);
      for (let frame = 0; frame < 600; frame++) {
        physics.update(1 / 60);
        expect(physics.maxJointError(1)).toBeLessThan(.2);
      }
      expect(new T.Box3().setFromObject(model.root, true).min.y).toBeCloseTo(-.02, 2);
      physics.remove(1);
      model.reset!();
      expect(model.root.getObjectByName(`${family}-identity`)?.visible).toBe(true);
    } finally {
      physics.dispose();
      disposeModel(model.root);
      floor.geometry.dispose();
    }
  });
}
