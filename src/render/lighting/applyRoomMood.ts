import * as T from 'three';
import type { ShipEnvironment } from '../ShipEnvironments';
import { getEnvironmentMood } from './EnvironmentMoods';

const originals = new WeakMap<T.MeshStandardMaterial, { color: T.Color; roughness: number; metalness: number; emissiveIntensity: number }>();
const deckTint: Readonly<Record<ShipEnvironment, number>> = {
  cryogenics: 0xb3d9e8, habitation: 0xdec6a8, security: 0xbdc9d4, cargo: 0xdec3a1,
  communications: 0xa2c8d6, engineering: 0xd4c89f, maintenance: 0x9acabc,
  infested: 0xaac19b, containment: 0xc7c5e4, reactor: 0xd1b7a0,
};

/** Tune room-owned surfaces and hot fixtures without changing warning, enemy or navigation colors. */
export function applyRoomMood(world: T.Object3D, environment: ShipEnvironment = 'cryogenics') {
  const mood = getEnvironmentMood(environment), seen = new Set<T.MeshStandardMaterial>();
  const tint = new T.Color(deckTint[environment]);
  world.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof T.MeshStandardMaterial) || seen.has(material)) continue;
      seen.add(material);
      let original = originals.get(material);
      if (!original) {
        original = { color: material.color.clone(), roughness: material.roughness, metalness: material.metalness, emissiveIntensity: material.emissiveIntensity };
        originals.set(material, original);
      }
      // Authored deck materials are shared by their baked floor meshes only.
      if (material.name === 'painted-steel-deck' || material.name === 'environment-floor') {
        material.roughness = environment === 'maintenance' ? mood.floorRoughness : Math.max(.82, mood.floorRoughness);
        material.metalness = environment === 'maintenance' ? Math.max(.38, original.metalness) : original.metalness;
        material.color.copy(original.color).multiply(tint);
      }
      // Keep the authored hue: red warning strips and green safe routes retain their meaning.
      if (original.emissiveIntensity >= .5 && material.emissive.getHex() !== 0) {
        material.emissiveIntensity = Math.max(2.6, original.emissiveIntensity * 1.75);
      }
    }
  });
}
