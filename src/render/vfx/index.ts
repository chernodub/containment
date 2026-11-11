import * as T from 'three';
import { TelegraphBatch } from './TelegraphBatch';
import { EnergyRibbonBatch, type EnergyRibbon } from './EnergyRibbonBatch';
import { createGroundZoneMaterial, createDeployableShieldMaterial, type GroundZoneKind } from './materials';

export { TelegraphBatch } from './TelegraphBatch';
export type { Telegraph, TelegraphShape } from './TelegraphBatch';
export { EnergyRibbonBatch } from './EnergyRibbonBatch';
export type { EnergyRibbon } from './EnergyRibbonBatch';
export { createGroundZoneMaterial, createDeployableShieldMaterial } from './materials';
export type { GroundZoneKind } from './materials';

/** Tiny callable gallery for every reusable ability primitive. Does not read or modify simulation. */
export function demoVfx(scene: T.Object3D) {
  const root = new T.Group();
  root.name = 'vfx-primitive-demo';
  scene.add(root);
  const warnings = new TelegraphBatch(root, 8);
  const slots = [
    warnings.add({ shape: 'circle', x: -5, z: -3, radius: 1.25 }),
    warnings.add({ shape: 'cone', x: -1.5, z: -3, radius: 2, arc: Math.PI / 2, angle: .4 }),
    warnings.add({ shape: 'line', x: 1, z: -3, length: 3, width: .45, angle: .3 }),
    warnings.add({ shape: 'wall', x: 5, z: -4, length: 2.5, width: .6, angle: Math.PI / 2 }),
    warnings.add({ shape: 'shockwave', x: 0, z: 0, radius: 2, color: 0xffb454 }),
  ];
  const ribbons = new EnergyRibbonBatch(root, 64);
  const beam: EnergyRibbon = { start: new T.Vector3(-6, .8, 0), end: new T.Vector3(-3, .8, .5), color: 0x9fe8ff };
  const lightning: EnergyRibbon = { start: new T.Vector3(2, .8, 0), end: new T.Vector3(6, .8, .5), lightning: true, seed: 42 };
  const materials: T.ShaderMaterial[] = [];
  const meshes: T.Mesh[] = [];
  const kinds: GroundZoneKind[] = ['fire', 'frost', 'electric'];
  for (let i = 0; i < kinds.length; i++) {
    const material = createGroundZoneMaterial(kinds[i]);
    const mesh = new T.Mesh(new T.PlaneGeometry(2.6, 2.6), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((i - 1) * 3.8, .04, 3.5);
    root.add(mesh); materials.push(material); meshes.push(mesh);
  }
  const shield = createDeployableShieldMaterial();
  const wall = new T.Mesh(new T.PlaneGeometry(3, 1.6), shield);
  wall.position.set(0, .8, 6);
  root.add(wall); materials.push(shield); meshes.push(wall);
  return {
    root,
    update(time: number, reducedMotion = false) {
      const progress = reducedMotion ? .7 : (time % 2) / 2;
      for (const slot of slots) warnings.progress(slot, progress);
      ribbons.begin(); ribbons.append(beam); ribbons.append(lightning, time, reducedMotion); ribbons.end();
      for (const material of materials) { material.uniforms.time.value = time; material.uniforms.motion.value = reducedMotion ? 0 : 1; }
    },
    dispose() {
      warnings.dispose(); ribbons.dispose();
      for (const mesh of meshes) mesh.geometry.dispose();
      for (const material of materials) material.dispose();
      root.removeFromParent();
    },
  };
}
