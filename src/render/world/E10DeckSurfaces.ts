import * as T from 'three';
import type { RoomTemplate } from '../../game/roguelike/types';
import { SHIP_ARCHITECTURE_PLANS } from '../../game/roguelike/shipArchitectureLayouts';
import { shipEnvironment } from '../ShipEnvironments';
import { bakeDeckLighting } from '../lighting/DeckLightBake';

const deckSets = new WeakMap<T.MeshStandardMaterial, { high: T.Texture[]; low: T.Texture[]; selected?: boolean }>();

/** Fixed ceiling-source footprints also drive the static deck illumination. */
export function deckLightSources(t: RoomTemplate): T.Vector4[] {
  const plan = SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  if (!plan) return [];
  const domestic = shipEnvironment(t.id) === 'habitation';
  const result = [new T.Vector4(plan.arena.x / 32, plan.arena.y / 32, 5.8, 4.8)];
  for (const space of plan.spaces) {
    if (result.some(p => Math.hypot(p.x - space.anchor.x / 32, p.y - space.anchor.y / 32) < 3)) continue;
    result.push(new T.Vector4(space.anchor.x / 32, space.anchor.y / 32, domestic ? 3.5 : 4.1, 3.2));
    if (result.length === 6) break;
  }
  while (result.length < 6) result.push(new T.Vector4(0, 0, .001, .001));
  return result;
}

/** Room-owned decoded maps; the existing kit owner awaits this before warmup.
 * No title-time transfer and no cached image can outlive its owning material. */
export async function loadDeckSurfaces(world: T.Group, t: RoomTemplate, active: () => boolean, own: (dispose: () => void) => void): Promise<void> {
  const floor = world.getObjectByName('e9-named-space-decks');
  if (!(floor instanceof T.Mesh) || !(floor.material instanceof T.MeshStandardMaterial)) return;
  const material = floor.material;
  const environment = shipEnvironment(t.id) ?? 'cryogenics';
  const base = import.meta.env.BASE_URL + 'assets/e10-floors/';
  const loader = new T.TextureLoader();
  const textures: T.Texture[] = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const texture of textures) texture.dispose();
    deckSets.delete(material);
    material.map = material.normalMap = material.aoMap = material.roughnessMap = material.emissiveMap = material.lightMap = null;
    const trim = world.getObjectByName('e10-threshold-trims');
    if (trim instanceof T.Mesh && trim.material instanceof T.MeshStandardMaterial) trim.material.map = trim.material.normalMap = null;
  };
  own(dispose);
  try {
    const names = ['basecolor', 'normal', 'orm', 'decals', 'trim-basecolor', 'trim-normal'];
    const results = await Promise.allSettled([false, true].flatMap(low => names.map(async name => {
      const texture = await loader.loadAsync(base + (name === 'decals' || name.startsWith('trim-') ? 'shared' : environment) + '/' + name + (low ? '-low' : '') + '.webp');
      if (disposed) { texture.dispose(); return texture; }
      textures.push(texture);
      await (texture.image as HTMLImageElement).decode();
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.colorSpace = name === 'basecolor' || name === 'decals' || name === 'trim-basecolor' ? T.SRGBColorSpace : T.NoColorSpace;
      texture.anisotropy = 4;
      return texture;
    })));
    const failure = results.find(r => r.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
    if (!active() || disposed) { dispose(); return; }
    const loaded = results.map(r => (r as PromiseFulfilledResult<T.Texture>).value);
    deckSets.set(material, { high: loaded.slice(0, 6), low: loaded.slice(6) });
    material.normalScale.set(2.4, 2.4); material.aoMapIntensity = .42;
    material.roughness = 1; material.metalness = .08;
    const geometry = floor.geometry, positions = geometry.getAttribute('position');
    const uv = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      uv[i * 2] = positions.getX(i) / 5.6; uv[i * 2 + 1] = -positions.getZ(i) / 5.6;
    }
    geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const trim = world.getObjectByName('e10-threshold-trims');
    if (trim instanceof T.Mesh && trim.material instanceof T.MeshStandardMaterial) {
      trim.material.normalScale.set(1.8, 1.8);
      const p = trim.geometry.getAttribute('position'), uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 5.6; uv[i * 2 + 1] = -p.getZ(i) / 5.6; }
      trim.geometry.setAttribute('uv', new T.BufferAttribute(uv, 2)); trim.material.needsUpdate = true;
    }
    const light = bakeDeckLighting(t, deckLightSources(t)); textures.push(light.texture);
    material.lightMap = light.texture; material.lightMapIntensity = 0;
    setDeckQuality(world, !world.userData.e10LowTier);
    material.needsUpdate = true;
    floor.userData.e10Deck = { environment, atlas: 'four 2.8m tiles', maps: 6, ownedDecodedMaps: textures.length };
  } catch (error) { dispose(); if (active()) throw error; }
}

/** Static shaped key/fill in the existing floor draw, shared by both tiers.
 * Multiplication preserves paint, banding, AO and native warning priority. */
export function shapeDeckLight(material: T.MeshStandardMaterial, t: RoomTemplate): void {
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  const pools = deckLightSources(t), plan = SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  if (!plan) return;
  const arena = new T.Vector2(plan.arena.x / 32, plan.arena.y / 32);
  const hull = t.boundary ?? [{x:0,y:0},{x:t.width,y:t.height}];
  const xs = hull.map(p=>p.x/32), zs = hull.map(p=>p.y/32), minX = Math.min(...xs), minZ = Math.min(...zs);
  const lightBounds = new T.Vector4(minX,minZ,Math.max(...xs)-minX,Math.max(...zs)-minZ);
  const environment = shipEnvironment(t.id);
  const keyTint = new T.Color(environment === 'habitation' || environment === 'cargo' || environment === 'engineering' ? 0xffddad : environment === 'maintenance' || environment === 'communications' ? 0xb8e1d8 : 0xdbe7f4).lerp(new T.Color(0xffffff), .75);
  const fillTint = new T.Color(environment === 'infested' ? 0xb1a8bf : 0xa0b9cb).lerp(new T.Color(0xffffff), .75);
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.e10LightBounds = {value:lightBounds}; shader.uniforms.e10KeyTint = {value:keyTint}; shader.uniforms.e10FillTint = {value:fillTint};
    shader.uniforms.e10Arena = { value: arena };
    shader.vertexShader = 'varying vec3 e10Position;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ne10Position=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader = 'varying vec3 e10Position; uniform vec2 e10Arena; uniform vec4 e10LightBounds; uniform vec3 e10KeyTint; uniform vec3 e10FillTint;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      vec2 e10Tile=floor(e10Position.xz/2.8);
      float e10TileHash=fract(sin(dot(e10Tile,vec2(41.17,73.93)))*17431.37);
      float e10Variant=e10TileHash<.52?0.0:e10TileHash<.80?1.0:e10TileHash<.90?2.0:3.0;
      vec2 e10Local=fract(e10Position.xz/2.8);
      if(fract(e10TileHash*17.0)>.5)e10Local=e10Local.yx;
      vec2 e10UV=(e10Local*.998+.001+vec2(mod(e10Variant,2.0),floor(e10Variant/2.0)))*.5;
      #ifdef USE_MAP
        vec2 vMapUv=e10UV;
      #endif
      #ifdef USE_NORMALMAP
        vec2 vNormalMapUv=e10UV;
      #endif
      #ifdef USE_AOMAP
        vec2 vAoMapUv=e10UV;
      #endif
      #ifdef USE_ROUGHNESSMAP
        vec2 vRoughnessMapUv=e10UV;
      #endif
      float e10Calm=1.0-smoothstep(3.5,5.2,distance(e10Position.xz,e10Arena));
      ${T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;', 'sampledDiffuseColor.rgb=mix(vec3(.78),sampledDiffuseColor.rgb,mix(1.0,.50,e10Calm)); diffuseColor *= sampledDiffuseColor;')}
      // Atlas relief is quieter in the nine-metre combat circle.
      vec2 e10Irradiance=vec2(.8,1.0);
      #ifdef USE_LIGHTMAP
        e10Irradiance=texture2D(lightMap,(e10Position.xz-e10LightBounds.xy)/e10LightBounds.zw).rg;
      #endif
      float e10Pool=e10Irradiance.r;
      diffuseColor.rgb*=mix(.64,1.32,e10Pool)*mix(.76,1.0,e10Irradiance.g);
      diffuseColor.rgb*=mix(e10FillTint,e10KeyTint,e10Pool);
      diffuseColor.rgb*=1.18;
      vec2 e10Cell=floor(e10Position.xz/8.0);
      float e10Hash=fract(sin(dot(e10Cell,vec2(17.3,43.1)))*9173.7);
      float e10Index=floor(e10Hash*16.0);
      vec2 e10DecalUV=(fract(e10Position.xz/8.0)+vec2(mod(e10Index,4.0),floor(e10Index/4.0)))/4.0;
      #ifdef USE_EMISSIVEMAP
        diffuseColor.rgb*=mix(vec3(1.0),texture2D(emissiveMap,e10DecalUV).rgb,mix(.36,.09,e10Calm));
      #endif
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '// Deck decal sampler is consumed in the base-colour path.');
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      // Broad source return, tinted by the actual floor paint, never purple black.
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*(.025+.035*e10Pool);
    `);
  };
  material.customProgramCacheKey = () => key + ':e10-static-deck-v4';
  material.needsUpdate = true;
}

/** Both resolutions decode during the room hold. Tier selection swaps already
 * owned maps before normal preparation, without an asynchronous combat change. */
export function setDeckQuality(world: T.Object3D, high: boolean): void {
  const floor = world.getObjectByName('e9-named-space-decks');
  if (!(floor instanceof T.Mesh) || !(floor.material instanceof T.MeshStandardMaterial)) return;
  const m = floor.material, sets = deckSets.get(m);
  if (!sets || sets.selected === high) return;
  sets.selected = high;
  const [color, normal, orm, decals, trimColor, trimNormal] = (high ? sets.high : sets.low) as T.Texture[];
  m.map = color; m.normalMap = normal; m.aoMap = m.roughnessMap = orm;
  m.emissiveMap = decals; m.needsUpdate = true;
  const trim = world.getObjectByName('e10-threshold-trims');
  if (trim instanceof T.Mesh && trim.material instanceof T.MeshStandardMaterial) {
    trim.material.map = trimColor; trim.material.normalMap = trimNormal; trim.material.needsUpdate = true;
  }
  floor.userData.e10ActiveTextureBytes = [color, normal, orm, decals, trimColor, trimNormal]
    .reduce((bytes, texture) => bytes + (texture.image as HTMLImageElement).width * (texture.image as HTMLImageElement).height * 4 * 4 / 3, 256 * 256 * 4);
}
