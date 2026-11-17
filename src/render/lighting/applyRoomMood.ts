import {SHIP_ARCHITECTURE_LAYOUTS} from '../../game/roguelike/shipArchitectureLayouts';
import * as T from 'three';
import type { ShipEnvironment } from '../ShipEnvironments';
import { getEnvironmentMood } from './EnvironmentMoods';
import { applyFloorVariation } from './FloorVariation';
import { optimizeLocalLights, setRoomValue } from './LocalLightShading';
import { roomValueProfile } from './RoomValueStandard';
import { applyHotFixtureSurface } from './HotFixtureSurface';
import {registerFlatFloorLighting} from './FlatFloorLighting';

const fixtureScales = new WeakMap<T.MeshStandardMaterial, {scale:number;written:number}>();
const hsl = {h:0,s:0,l:0};
const originals = new WeakMap<T.MeshStandardMaterial, { color: T.Color; roughness: number; metalness: number; emissiveIntensity: number }>();
// Subtle surface tint only: environment identity comes from motivated light, not tinted black paint.
const deckTint: Readonly<Record<ShipEnvironment, number>> = {
  cryogenics: 0xf1f6fa, habitation: 0xfaf5ee, security: 0xf4f6fa, cargo: 0xf9f5ec,
  communications: 0xeff6f9, engineering: 0xf9f6ee, maintenance: 0xeff7f3,
  infested: 0xf1f6f0, containment: 0xf4f3fa, reactor: 0xf9f4ed,
};
// Bounded cool reflected fill keeps construction legible in the unlit deck toe.
const deckBounce: Readonly<Record<ShipEnvironment,number>>={cryogenics:.006,habitation:.006,security:.001,cargo:.004,communications:.016,engineering:.004,maintenance:.006,infested:.010,containment:.002,reactor:.012};
const readableSteel = new T.Color(0x657481);
const reactorSteel = new T.Color(0x626b73);
const roomDeckGain:Readonly<Record<string,number>>={'armory':.95,'residential-gallery':1.5,'awakening-bay':.92,'communal-atrium':1.39,'freight-hold':1.75,'transmission-chamber':4.6,'safety-interlock-station':1.32,'coolant-plant':1.18,'relay-racks':3.25,'infested-workshop':2.65,'swarm-junction':2.4,'shielding-gate':.93,'service-shaft-landing':1.12};
const deckNames = new Set(['painted-steel-deck','annulus-deck','annulus-circulation','environment-floor','shaft-deck','shaft-floor-panel']);
// A readable deck toe must not become an ambient wash across dark rack faces.
const hardwareBounce:Partial<Record<ShipEnvironment,number>> = {infested:.001,communications:.006,security:.0002,containment:.0005,reactor:.007};

/** Tune room-owned surfaces and hot fixtures without changing warning, enemy or navigation colors. */
export function applyRoomMood(world: T.Object3D, environment: ShipEnvironment = 'cryogenics', templateId?:string, practicalShapes?:T.Vector4[], valueStandard=true) {
  const valueProfile = roomValueProfile(templateId);
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
      const floor=deckNames.has(material.name)||material.userData.floorDressing===true;
      if(floor)material.userData.architectureApertureOnly=Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,templateId??'');
      // Re-preparation must start at authored albedo, including shaft/circulation surfaces
      // which do not take the ordinary readable-steel normalization below.
      if(deckNames.has(material.name))material.color.copy(original.color);
      if(material.userData.floorDressing===true&&!deckNames.has(material.name))registerFlatFloorLighting(material,environment,practicalShapes);
      // Authored deck materials are shared by their baked floor meshes only.
      if (material.name === 'painted-steel-deck' || material.name === 'annulus-deck' || material.name === 'annulus-circulation' || material.name === 'environment-floor') {
        material.roughness = environment === 'maintenance' ? mood.floorRoughness : Math.max(.82, mood.floorRoughness);
        material.metalness = environment === 'maintenance' ? Math.max(.38, original.metalness) : original.metalness;
        if (material.name === 'painted-steel-deck' || material.name === 'annulus-deck') {
          // Original near-black paint multiplied by colored light hid traversable floor below sRGB 30.
          material.color.copy(original.color).lerp(environment==='reactor'?reactorDeck:readableSteel, .85).multiply(tint);
        } else if(material.name === 'annulus-circulation' && templateId === 'containment-annulus') {
          material.color.copy(original.color).lerp(readableSteel,.45).multiply(tint);
        } else if(material.name !== 'annulus-circulation') {
          material.color.copy(material.userData.roomBaseColor ?? original.color).lerp(new T.Color(environment==='reactor'?0x747e88:0x8896a1),.8).multiply(tint);
        }
        applyFloorVariation(material, environment, practicalShapes);
      }
      if(deckNames.has(material.name))material.color.multiplyScalar(roomDeckGain[templateId??'']??1);
      if(environment==='reactor'&&material.name==='ship-cold-practical'){material.color.setHex(0xfff4e8);material.emissive.setHex(0xfffaf0);material.emissiveIntensity=7.5;applyHotFixtureSurface(material,hotCore);}
      // Keep the authored hue: red warning strips and green safe routes retain their meaning.
      if (!(environment === 'reactor' && material.name === 'ship-cold-practical') && !material.userData.motivatedEmitter && original.emissiveIntensity >= .5 && material.emissive.getHex() !== 0) {
        material.emissiveIntensity = Math.max(2.6, original.emissiveIntensity * 1.75);
      }
      const surfaceBounce=!floor&&hardwareBounce[environment]!==undefined?hardwareBounce[environment]!:deckBounce[environment];
      // LIGHT13: dark ship, lit actors. Actor finishes are never room surfaces.
      if(valueStandard&&material.userData.containmentMarineSurface===undefined&&!material.userData.k10Original&&!material.userData.k11Original){
        const deck=material.userData.light13Deck===true,anyFloor=floor||deckNames.has(material.name);
        if(valueProfile)setRoomValue(material,deck?1:anyFloor?valueProfile.floor.lit:valueProfile.wall.value,anyFloor?valueProfile.floorSaturation:valueProfile.wall.saturation,valueProfile.tint,valueProfile.marineGlow,valueProfile.perimeter.value);
        else setRoomValue(material);
        // Neutral (white/pale) fixtures yield to actors; coloured warning/route emitters keep their meaning.
        const previous=fixtureScales.get(material);material.emissive.getHSL(hsl);
        // Divide out only our own last write; other owners may have reset the intensity since.
        const base=previous&&material.emissiveIntensity===previous.written?previous.written/previous.scale:material.emissiveIntensity;
        const scale=valueProfile&&material.emissive.getHex()!==0&&hsl.s<.4?valueProfile.fixtures:1;
        material.emissiveIntensity=base*scale;fixtureScales.set(material,{scale,written:material.emissiveIntensity});
      }
      optimizeLocalLights(material,environment==='reactor'?(templateId==='overload-floor'||templateId==='manual-control-chamber'?.12:1):.02,environment==='cargo'||environment==='communications'?.16:.025,Math.max(templateId==='reactor-vault'?.013:templateId==='manual-control-chamber'?.010:surfaceBounce,legacyBounce));
    }
  });
}
