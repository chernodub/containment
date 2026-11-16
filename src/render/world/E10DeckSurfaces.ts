import * as T from 'three';
import type { RoomTemplate } from '../../game/roguelike/types';
import { SHIP_ARCHITECTURE_PLANS } from '../../game/roguelike/shipArchitectureLayouts';
import { shipEnvironment } from '../ShipEnvironments';
import { bakeDeckLighting } from '../lighting/DeckLightBake';
import { tileDeckGeometry } from './E10DeckTiles';
import { buildDeckStory } from './E10DeckStory';

const deckSets = new WeakMap<T.MeshStandardMaterial, { high: T.Texture[]; low: T.Texture[]; selected?: boolean }>();
const floorNames = ['e9-named-space-decks', 'e10-service-lane-decks'];

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

/** Decoded maps, placed wear and static light belong to the lazy room owner.
 * Native sampler slots let retained warmup proxies use synthetic images. */
export async function loadDeckSurfaces(world: T.Group, t: RoomTemplate, active: () => boolean, own: (dispose: () => void) => void): Promise<void> {
  const floor = world.getObjectByName(floorNames[0]);
  if (!(floor instanceof T.Mesh) || !(floor.material instanceof T.MeshStandardMaterial)) return;
  const service = world.getObjectByName(floorNames[1]);
  const surfaces = [floor, ...(service instanceof T.Mesh && service.material instanceof T.MeshStandardMaterial ? [service] : [])];
  const environment = shipEnvironment(t.id) ?? 'cryogenics';
  const secondary = environment === 'containment' || environment === 'maintenance' ? 'security' : environment === 'communications' ? 'cargo' : environment;
  const base = import.meta.env.BASE_URL + 'assets/e10-floors/', loader = new T.TextureLoader();
  const textures = new Set<T.Texture>(), loaded = new Map<string, T.Texture>();
  let disposed = false;
  own(() => {
    if (disposed) return;
    disposed = true;
    for (const texture of textures) texture.dispose();
    for (const mesh of surfaces) {
      const m = mesh.material as T.MeshStandardMaterial; deckSets.delete(m);
      m.map = m.normalMap = m.aoMap = m.roughnessMap = m.emissiveMap = m.lightMap = null;
    }
    const trim = world.getObjectByName('e10-threshold-trims');
    if (trim instanceof T.Mesh && trim.material instanceof T.MeshStandardMaterial) trim.material.map = trim.material.normalMap = null;
  });
  const families = [...new Set([environment, ...(surfaces.length > 1 ? [secondary] : [])])];
  const requests = [false, true].flatMap(low => [
    ...families.flatMap(family => ['basecolor','normal','orm'].map(name => ({family,name,low}))),
    ...['decals','trim-basecolor','trim-normal'].map(name => ({family:'shared',name,low})),
  ]);
  const results = await Promise.allSettled(requests.map(async ({family,name,low}) => {
    const texture = await loader.loadAsync(base + family + '/' + name + (low ? '-low' : '') + '.webp');
    if (disposed || !active()) { texture.dispose(); return; }
    textures.add(texture); await (texture.image as HTMLImageElement).decode();
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.colorSpace = name === 'basecolor' || name === 'decals' || name === 'trim-basecolor' ? T.SRGBColorSpace : T.NoColorSpace;
    texture.anisotropy = 4; loaded.set(`${low}/${family}/${name}`,texture);
  }));
  const failure = results.find(r => r.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
  if (!active() || disposed) return;
  const get = (low:boolean,family:string,name:string) => loaded.get(`${low}/${family}/${name}`)!;
  const story = buildDeckStory(t,get(false,'shared','decals')); textures.add(story.high); textures.add(story.low);
  const services = world.getObjectByName('e9-room-interiors')?.userData.interior?.services ?? [];
  const light = bakeDeckLighting(t,deckLightSources(t),services); textures.add(light.texture);
  for (const [index,mesh] of surfaces.entries()) {
    const m = mesh.material as T.MeshStandardMaterial, family = index ? secondary : environment;
    const maps = (low:boolean) => [get(low,family,'basecolor'),get(low,family,'normal'),get(low,family,'orm'),low?story.low:story.high,get(low,'shared','trim-basecolor'),get(low,'shared','trim-normal')];
    deckSets.set(m,{high:maps(false),low:maps(true)});
    m.normalScale.set(index?1.8:2.4,index?1.8:2.4); m.aoMapIntensity=.42; m.roughness=index?1:.95; m.metalness=index?.02:.08;
    m.lightMap=light.texture;m.lightMapIntensity=0;
    const old=mesh.geometry;mesh.geometry=tileDeckGeometry(old);old.dispose();
  }
  const trim=world.getObjectByName('e10-threshold-trims');
  if(trim instanceof T.Mesh && trim.material instanceof T.MeshStandardMaterial){
    trim.material.normalScale.set(1.8,1.8);
    const p=trim.geometry.getAttribute('position'),uv=new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i)/5.6;uv[i*2+1]=-p.getZ(i)/5.6;}
    trim.geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
  }
  setDeckQuality(world,!world.userData.e10LowTier);
  floor.userData.e10Deck={environment,secondary:surfaces.length>1?secondary:undefined,atlas:'four 2.8m tiles',ownedMaps:textures.size,story:'exit wear, breach scorch/acid, chipped thresholds, dragged case'};
}

/** Static light and story in the existing opaque deck material. */
export function shapeDeckLight(material: T.MeshStandardMaterial, t: RoomTemplate): void {
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
  const plan=SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  if(!plan)return;
  const arena=new T.Vector2(plan.arena.x/32,plan.arena.y/32);
  const hull=t.boundary??[{x:0,y:0},{x:t.width,y:t.height}],xs=hull.map(p=>p.x/32),zs=hull.map(p=>p.y/32),minX=Math.min(...xs),minZ=Math.min(...zs);
  const bounds=new T.Vector4(minX,minZ,Math.max(...xs)-minX,Math.max(...zs)-minZ),environment=shipEnvironment(t.id);
  const keyTint=new T.Color(environment==='habitation'||environment==='cargo'||environment==='engineering'?0xffddad:environment==='maintenance'||environment==='communications'?0xb8e1d8:0xdbe7f4).lerp(new T.Color(0xffffff),.75);
  const fillTint=new T.Color(environment==='infested'?0xb1a8bf:0xa0b9cb).lerp(new T.Color(0xffffff),.75);
  const accent=new T.Color(environment==='containment'?0x9e6bff:environment==='maintenance'?0x6cbea9:environment==='communications'?0x62beaa:0x91b3c0);
  material.onBeforeCompile=(shader,renderer)=>{
    previous.call(material,shader,renderer);
    shader.uniforms.e10LightBounds={value:bounds};shader.uniforms.e10KeyTint={value:keyTint};shader.uniforms.e10FillTint={value:fillTint};shader.uniforms.e10Arena={value:arena};shader.uniforms.e10AccentTint={value:accent};
    shader.vertexShader='varying vec3 e10Position;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ne10Position=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='varying vec3 e10Position;uniform vec2 e10Arena;uniform vec4 e10LightBounds;uniform vec3 e10KeyTint;uniform vec3 e10FillTint;uniform vec3 e10AccentTint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      float e10Calm=1.0-smoothstep(3.5,5.2,distance(e10Position.xz,e10Arena));
      ${T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;','sampledDiffuseColor.rgb=mix(vec3(.78),sampledDiffuseColor.rgb,mix(1.0,.50,e10Calm));diffuseColor*=sampledDiffuseColor;')}
      vec2 e10RoomUV=(e10Position.xz-e10LightBounds.xy)/e10LightBounds.zw;
      vec4 e10Irradiance=vec4(.8,1.0,0.0,0.0);
      #ifdef USE_LIGHTMAP
        e10Irradiance=texture2D(lightMap,e10RoomUV);
      #endif
      float e10Pool=e10Irradiance.r;
      diffuseColor.rgb*=mix(.64,1.32,e10Pool)*mix(.76,1.0,e10Irradiance.g)*mix(e10FillTint,e10KeyTint,e10Pool)*1.18;
      #ifdef USE_EMISSIVEMAP
        vec3 e10Story=texture2D(emissiveMap,e10RoomUV).rgb;
        diffuseColor.rgb*=mix(vec3(1.0),e10Story,mix(.78,.22,e10Calm));
      #endif
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','// Placed deck wear uses the native sampler in the base-colour path.');
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*(.025+.035*e10Pool);
      reflectedLight.indirectDiffuse+=e10AccentTint*e10Irradiance.b*.15+vec3(.76,.36,.09)*e10Irradiance.a*.06;
    `);
  };
  material.customProgramCacheKey=()=>key+':e10-static-deck-v6';material.needsUpdate=true;
}

/** Both image resolutions decode during readiness; switching is synchronous. */
export function setDeckQuality(world: T.Object3D, high: boolean): void {
  const active=new Set<T.Texture>();
  for(const name of floorNames){
    const floor=world.getObjectByName(name);
    if(!(floor instanceof T.Mesh)||!(floor.material instanceof T.MeshStandardMaterial))continue;
    const m=floor.material,sets=deckSets.get(m);if(!sets)continue;
    const [color,normal,orm,decals,trimColor,trimNormal]=high?sets.high:sets.low;
    if(sets.selected!==high){sets.selected=high;m.map=color;m.normalMap=normal;m.aoMap=m.roughnessMap=orm;m.emissiveMap=decals;m.needsUpdate=true;}
    for(const texture of [color,normal,orm,decals,m.lightMap])if(texture)active.add(texture);
    if(name===floorNames[0]){
      const trim=world.getObjectByName('e10-threshold-trims');
      if(trim instanceof T.Mesh&&trim.material instanceof T.MeshStandardMaterial){trim.material.map=trimColor;trim.material.normalMap=trimNormal;trim.material.needsUpdate=true;}
      active.add(trimColor);active.add(trimNormal);
    }
  }
  world.userData.e10FloorTextureBytes=[...active].reduce((bytes,texture)=>{
    const image=texture.image as {width:number;height:number};return bytes+image.width*image.height*4*(texture.generateMipmaps?4/3:1);
  },0);
}
