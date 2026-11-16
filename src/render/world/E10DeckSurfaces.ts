import * as T from 'three';
import type { RoomTemplate } from '../../game/roguelike/types';
import { SHIP_ARCHITECTURE_PLANS } from '../../game/roguelike/shipArchitectureLayouts';
import { shipEnvironment } from '../ShipEnvironments';

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
export async function loadDeckSurfaces(world: T.Group, t: RoomTemplate, active: () => boolean): Promise<void> {
  const floor = world.getObjectByName('e9-named-space-decks');
  if (!(floor instanceof T.Mesh) || !(floor.material instanceof T.MeshStandardMaterial)) return;
  const material = floor.material;
  const environment = shipEnvironment(t.id) ?? 'cryogenics';
  const base = import.meta.env.BASE_URL + 'assets/e10-floors/';
  const loader = new T.TextureLoader();
  const textures: T.Texture[] = [];
  let disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; for (const texture of textures) texture.dispose(); };
  material.addEventListener('dispose', dispose);
  try {
    const results = await Promise.allSettled(['basecolor', 'normal', 'orm', 'decals', 'trim-basecolor', 'trim-normal'].map(async name => {
      const texture = await loader.loadAsync(base + (name === 'decals' || name.startsWith('trim-') ? 'shared' : environment) + '/' + name + '.webp');
      if (disposed) { texture.dispose(); return texture; }
      textures.push(texture);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.colorSpace = name === 'basecolor' || name === 'decals' || name === 'trim-basecolor' ? T.SRGBColorSpace : T.NoColorSpace;
      texture.anisotropy = 4;
      return texture;
    }));
    const failure = results.find(r => r.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
    if (!active() || disposed) { dispose(); return; }
    const [color, normal, orm, decals, trimColor, trimNormal] = results.map(r => (r as PromiseFulfilledResult<T.Texture>).value);
    material.userData.e10DecalUniform.value = decals;
    material.map = color; material.normalMap = normal; material.normalScale.set(2.4, 2.4);
    material.aoMap = orm; material.aoMapIntensity = .42; material.roughnessMap = orm;
    material.roughness = 1; material.metalness = .08;
    const geometry = floor.geometry, positions = geometry.getAttribute('position');
    const uv = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      uv[i * 2] = positions.getX(i) / 5.6; uv[i * 2 + 1] = -positions.getZ(i) / 5.6;
    }
    geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const trim = world.getObjectByName('e10-threshold-trims');
    if (trim instanceof T.Mesh && trim.material instanceof T.MeshStandardMaterial) {
      trim.material.map = trimColor; trim.material.normalMap = trimNormal; trim.material.normalScale.set(1.8, 1.8);
      const p = trim.geometry.getAttribute('position'), uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / 5.6; uv[i * 2 + 1] = -p.getZ(i) / 5.6; }
      trim.geometry.setAttribute('uv', new T.BufferAttribute(uv, 2)); trim.material.needsUpdate = true;
    }
    material.needsUpdate = true;
    floor.userData.e10Deck = { environment, atlas: 'four 2.8m tiles', maps: textures.length, textureBytes: 3 * 1024 * 1024 * 4 * 4 / 3 };
  } catch (error) { dispose(); if (active()) throw error; }
}

/** Static shaped key/fill in the existing floor draw, shared by both tiers.
 * Multiplication preserves paint, banding, AO and native warning priority. */
export function shapeDeckLight(material: T.MeshStandardMaterial, t: RoomTemplate): void {
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  const pools = deckLightSources(t), plan = SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  if (!plan) return;
  const decal = { value: null as T.Texture | null };
  material.userData.e10DecalUniform = decal;
  const arena = new T.Vector2(plan.arena.x / 32, plan.arena.y / 32);
  const exit = new T.Vector2(t.exit.x / 32, t.exit.y / 32);
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.e10Pools = { value: pools }; shader.uniforms.e10Decals = decal;
    shader.uniforms.e10Arena = { value: arena }; shader.uniforms.e10Exit = { value: exit };
    shader.vertexShader = 'varying vec3 e10Position;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ne10Position=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader = 'varying vec3 e10Position; uniform vec4 e10Pools[6]; uniform vec2 e10Arena; uniform vec2 e10Exit; uniform sampler2D e10Decals;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      float e10Calm=1.0-smoothstep(3.5,5.2,distance(e10Position.xz,e10Arena));
      ${T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;', 'sampledDiffuseColor.rgb=mix(vec3(.78),sampledDiffuseColor.rgb,mix(1.0,.50,e10Calm)); diffuseColor *= sampledDiffuseColor;')}
      // Atlas relief is quieter in the nine-metre combat circle.
      float e10Pool=0.0;
      for(int i=0;i<6;i++){
        vec2 q=abs(e10Position.xz-e10Pools[i].xy)/e10Pools[i].zw;
        float pool=(1.0-smoothstep(.22,1.45,q.x))*(1.0-smoothstep(.16,1.35,q.y));
        e10Pool=max(e10Pool,pool);
      }
      float e10ExitPool=1.0-smoothstep(.4,3.5,distance(e10Position.xz,e10Exit));
      diffuseColor.rgb*=mix(.64,1.32,max(e10Pool,e10ExitPool*.8));
      diffuseColor.rgb*=1.18;
      vec2 e10Cell=floor(e10Position.xz/8.0);
      float e10Hash=fract(sin(dot(e10Cell,vec2(17.3,43.1)))*9173.7);
      float e10Index=floor(e10Hash*16.0);
      vec2 e10DecalUV=(fract(e10Position.xz/8.0)+vec2(mod(e10Index,4.0),floor(e10Index/4.0)))/4.0;
      diffuseColor.rgb*=mix(vec3(1.0),texture2D(e10Decals,e10DecalUV).rgb,mix(.36,.09,e10Calm));
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      // Broad source return, tinted by the actual floor paint, never purple black.
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*(.025+.035*e10Pool);
    `);
  };
  material.customProgramCacheKey = () => key + ':e10-static-deck-v1';
  material.needsUpdate = true;
}
