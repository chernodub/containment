import * as T from 'three';
import type { ShipEnvironment } from '../ShipEnvironments';
import { getEnvironmentMood } from './EnvironmentMoods';
import { applyFloorVariation } from './FloorVariation';
import { optimizeLocalLights } from './LocalLightShading';
import { applyHotFixtureSurface } from './HotFixtureSurface';

const originals = new WeakMap<T.MeshStandardMaterial, { color: T.Color; roughness: number; metalness: number; emissiveIntensity: number }>();
// Subtle surface tint only: environment identity comes from motivated light, not tinted black paint.
const deckTint: Readonly<Record<ShipEnvironment, number>> = {
  cryogenics: 0xf1f6fa, habitation: 0xfaf5ee, security: 0xf4f6fa, cargo: 0xf9f5ec,
  communications: 0xeff6f9, engineering: 0xf9f6ee, maintenance: 0xeff7f3,
  infested: 0xf1f6f0, containment: 0xf4f3fa, reactor: 0xf9f4ed,
};
// Bounded cool reflected fill keeps construction legible in the unlit deck toe.
const deckBounce: Readonly<Record<ShipEnvironment,number>>={cryogenics:.006,habitation:.006,security:.001,cargo:.004,communications:.013,engineering:.004,maintenance:.006,infested:.003,containment:.002,reactor:.007};
const readableSteel = new T.Color(0x657481);
const reactorSteel = new T.Color(0x626b73);

/** Tune room-owned surfaces and hot fixtures without changing warning, enemy or navigation colors. */
export function applyRoomMood(world: T.Object3D, environment: ShipEnvironment = 'cryogenics', templateId?:string, practicalShapes?:T.Vector4[]) {
  const mood = getEnvironmentMood(environment), seen = new Set<T.MeshStandardMaterial>();
  const legacyBounce=['cold-aisle','cryo-gallery','turbine-hall','power-conduits'].includes(templateId??'')?.006:0;
  const tint = new T.Color(deckTint[environment]),reactorDeck=templateId==='overload-floor'?new T.Color(0x46505a):reactorSteel;
  let hotCore:{x:number;z:number;radius:number}|undefined;world.traverse(object=>{if(object.userData.hotCore)hotCore=object.userData.hotCore;});
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
      if (material.name === 'painted-steel-deck' || material.name === 'annulus-deck' || material.name === 'annulus-circulation' || material.name === 'environment-floor') {
        material.roughness = environment === 'maintenance' ? mood.floorRoughness : Math.max(.82, mood.floorRoughness);
        material.metalness = environment === 'maintenance' ? Math.max(.38, original.metalness) : original.metalness;
        if (material.name === 'painted-steel-deck' || material.name === 'annulus-deck') {
          // Original near-black paint multiplied by colored light hid traversable floor below sRGB 30.
          material.color.copy(original.color).lerp(environment==='reactor'?reactorDeck:readableSteel, .85).multiply(tint);
        } else if(material.name !== 'annulus-circulation') {
          material.color.copy(material.userData.roomBaseColor ?? original.color).lerp(new T.Color(environment==='reactor'?0x747e88:0x8896a1),.8).multiply(tint);
        }
        applyFloorVariation(material, environment, practicalShapes);
      }
      if(environment==='reactor'&&material.name==='ship-cold-practical'){material.color.setHex(0xfff4e8);material.emissive.setHex(0xfffaf0);material.emissiveIntensity=10;applyHotFixtureSurface(material,hotCore);}
      // Keep the authored hue: red warning strips and green safe routes retain their meaning.
      if (!(environment === 'reactor' && material.name === 'ship-cold-practical') && !material.userData.motivatedEmitter && original.emissiveIntensity >= .5 && material.emissive.getHex() !== 0) {
        material.emissiveIntensity = Math.max(2.6, original.emissiveIntensity * 1.75);
      }
      optimizeLocalLights(material,environment==='reactor'?(templateId==='overload-floor'||templateId==='manual-control-chamber'?.12:1):.02,environment==='cargo'||environment==='communications'?.16:.025,Math.max(deckBounce[environment],legacyBounce));
    }
  });
}
