import * as T from 'three';
import type {EnvironmentMaterials} from './EnvironmentMaterials';
import {applyFloorVariation} from './lighting/FloorVariation';
import {applyHotFixtureSurface} from './lighting/HotFixtureSurface';
import {optimizeLocalLights} from './lighting/LocalLightShading';
import {addRoomPracticals} from './lighting/RoomPracticals';

const shaderProperties = [
  'side', 'shadowSide', 'transparent', 'blending', 'vertexColors', 'flatShading', 'wireframe',
  'normalMapType', 'combine', 'toneMapped', 'fog', 'alphaHash', 'alphaToCoverage',
  'premultipliedAlpha', 'dithering', 'precision', 'sizeAttenuation', 'depthPacking',
  'clipping', 'clipIntersection', 'clipShadows', 'lights', 'glslVersion',
] as const;
const physicalFeatures = ['clearcoat', 'dispersion', 'iridescence', 'sheen', 'transmission', 'anisotropy'] as const;
type Attribute = T.BufferAttribute | T.InterleavedBufferAttribute;
type SamplerTexture = T.Texture & { normalized?: boolean };

/** A static data upload retaining the shader's video-decode flag without a DOM video. */
class StaticVideoSampler extends T.DataTexture {
  readonly isVideoTexture = true;
  update(): void {}
}

function samplerShape(texture: T.Texture): unknown[] {
  return [texture.mapping, texture.channel, texture.colorSpace, texture.format, texture.type,
    texture.internalFormat, (texture as SamplerTexture).normalized, texture instanceof T.CubeTexture,
    Boolean((texture as T.VideoTexture).isVideoTexture), texture instanceof T.DepthTexture,
    texture instanceof T.Data3DTexture, texture instanceof T.DataArrayTexture,
    texture instanceof T.DepthTexture ? texture.compareFunction : null,
    texture.mapping === T.CubeUVReflectionMapping
      ? (texture.image as { height?: number } | undefined)?.height : null];
}

function samplerPixels(texture: T.Texture, width: number, height: number): T.TypedArray {
  const packedShort = texture.type === T.UnsignedShort4444Type || texture.type === T.UnsignedShort5551Type;
  const packedInt = texture.type === T.UnsignedInt248Type || texture.type === T.UnsignedInt5999Type || texture.type === T.UnsignedInt101111Type;
  let channels = 4;
  if (texture.format === T.AlphaFormat || texture.format === T.RedFormat || texture.format === T.RedIntegerFormat || texture.format === T.DepthFormat) channels = 1;
  else if (texture.format === T.RGFormat || texture.format === T.RGIntegerFormat) channels = 2;
  else if (texture.format === T.RGBFormat || texture.format === T.RGBIntegerFormat) channels = 3;
  const count = width * height * (packedShort || packedInt ? 1 : channels);
  switch (texture.type) {
    case T.FloatType: return new Float32Array(count).fill(1);
    case T.HalfFloatType: return new Uint16Array(count).fill(T.DataUtils.toHalfFloat(1));
    case T.ByteType: return new Int8Array(count).fill(127);
    case T.ShortType: return new Int16Array(count).fill(32767);
    case T.UnsignedShortType:
    case T.UnsignedShort4444Type:
    case T.UnsignedShort5551Type: return new Uint16Array(count).fill(65535);
    case T.IntType: return new Int32Array(count).fill(1);
    case T.UnsignedIntType:
    case T.UnsignedInt248Type:
    case T.UnsignedInt5999Type:
    case T.UnsignedInt101111Type: return new Uint32Array(count).fill(1);
    default: return new Uint8Array(count).fill(255);
  }
}

function sortedEntries(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  return Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
}

function attributeShape(attribute: Attribute): unknown[] {
  return [attribute.itemSize, attribute.normalized, attribute.array.constructor.name,
    'gpuType' in attribute ? attribute.gpuType : null];
}

/** Shader inputs matter; vertex counts, triangle layout and uniform colors do not. */
function topology(mesh: T.Mesh, material: T.Material): string {
  const properties = material as unknown as Record<string, unknown>;
  const geometry = mesh.geometry;
  const textures = Object.entries(properties).filter((entry): entry is [string, T.Texture] => entry[1] instanceof T.Texture);
  return JSON.stringify({
    type: material.type,
    properties: shaderProperties.map(name => [name, properties[name]]),
    features: physicalFeatures.map(name => [name, Number(properties[name]) > 0]),
    alphaTest: material.alphaTest > 0,
    defines: sortedEntries(properties.defines),
    extensions: sortedEntries(properties.extensions),
    clippingPlanes: material.clippingPlanes?.length ?? 0,
    shader: [properties.vertexShader, properties.fragmentShader],
    hook: material.onBeforeCompile.toString(),
    cacheKey: material.customProgramCacheKey(),
    textures: textures.sort(([a], [b]) => a.localeCompare(b)).map(([name, texture]) => [name, ...samplerShape(texture)]),
    attributes: Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b))
      .map(([name, attribute]) => [name, ...attributeShape(attribute)]),
    morphs: Object.entries(geometry.morphAttributes).sort(([a], [b]) => a.localeCompare(b))
      .map(([name, attributes]) => [name, attributes?.map(attributeShape)]),
    morphTargetsRelative: geometry.morphTargetsRelative,
    skinned: mesh instanceof T.SkinnedMesh,
    instanced: mesh instanceof T.InstancedMesh,
    instanceColor: mesh instanceof T.InstancedMesh && mesh.instanceColor ? attributeShape(mesh.instanceColor) : null,
    instanceMorph: mesh instanceof T.InstancedMesh && mesh.morphTexture !== null,
  });
}

function smallAttribute(source: Attribute): T.BufferAttribute {
  const Constructor = source.array.constructor as T.TypedArrayConstructor;
  const array = new Constructor(4 * source.itemSize);
  const attribute = source instanceof T.Float16BufferAttribute
    ? new T.Float16BufferAttribute(array, source.itemSize, source.normalized)
    : new T.BufferAttribute(array, source.itemSize, source.normalized);
  if ('gpuType' in source) attribute.gpuType = source.gpuType;
  return attribute;
}

/** Four vertices retain the input layout without retaining any room vertex buffers. */
function proxyGeometry(source: T.BufferGeometry, material: T.Material): T.BufferGeometry {
  const geometry = new T.PlaneGeometry(1, 1);
  for (const name of Object.keys(geometry.attributes)) if (!source.hasAttribute(name)) geometry.deleteAttribute(name);
  for (const [name, attribute] of Object.entries(source.attributes)) {
    const existing = geometry.getAttribute(name);
    if (existing && JSON.stringify(attributeShape(existing)) === JSON.stringify(attributeShape(attribute))) continue;
    const minimal = smallAttribute(attribute);
    if (name === 'normal') for (let i = 0; i < 4; i++) minimal.setXYZ(i, 0, 0, 1);
    if (name === 'tangent') for (let i = 0; i < 4; i++) minimal.setXYZW(i, 1, 0, 0, 1);
    if (name === 'color') minimal.array.fill(1);
    if (name === 'skinWeight') for (let i = 0; i < 4; i++) minimal.setXYZW(i, 1, 0, 0, 0);
    geometry.setAttribute(name, minimal);
  }
  for (const value of Object.values(material)) if (value instanceof T.Texture) {
    const name = value.channel === 0 ? 'uv' : `uv${value.channel}`;
    if (!geometry.hasAttribute(name)) geometry.setAttribute(name, new T.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2));
  }
  for (const [name, attributes] of Object.entries(source.morphAttributes)) {
    const morphs = geometry.morphAttributes as Record<string, T.BufferAttribute[]>;
    morphs[name] = attributes!.map(smallAttribute);
  }
  geometry.morphTargetsRelative = source.morphTargetsRelative;
  return geometry;
}

/** Keep references to future-room shader variants so Three cannot evict them after preparation. */
export class MaterialWarmup {
  readonly root=new T.Group();
  private disposed=false;
  private readonly topologies = new Set<string>();
  private readonly ownedMaterials = new Set<T.Material>();
  private readonly ownedGeometries = new Set<T.BufferGeometry>();
  private readonly ownedSkeletons = new Set<T.Skeleton>();
  private readonly ownedInstances = new Set<T.InstancedMesh>();
  private readonly samplers = new Map<string, T.Texture>();
  private readonly ownedSamplers = new Set<T.Texture>();
  constructor(surfaces:Pick<EnvironmentMaterials,'floor'|'wall'|'cover'>){
    this.root.name='retained-room-material-library';this.root.position.y=-40;
    for(const material of [surfaces.floor,surfaces.wall,surfaces.cover])this.add(this.cloneMaterial(material) as T.MeshStandardMaterial);
    addRoomPracticals(this.root,2,2,'infested');
    const hot=this.owned({emissive:0xffd69a,emissiveIntensity:3.4});applyHotFixtureSurface(hot);this.add(hot);
    const annulus=this.owned({roughness:.82,metalness:.2});annulus.name='annulus-deck';applyFloorVariation(annulus,'containment');this.add(annulus);
    // Relay relief and emissive signage use texture combinations absent from
    // the first room. Numeric colors/roughness do not change shader topology.
    const relief=this.owned({normalMap:surfaces.floor.normalMap});relief.name='painted-steel-deck';applyFloorVariation(relief,'communications');this.add(relief);
    this.add(this.owned({map:surfaces.floor.map,emissiveMap:surfaces.floor.map,emissive:0xffffff}));
    const painted=this.owned({map:surfaces.floor.map,normalMap:surfaces.floor.normalMap,roughnessMap:surfaces.floor.roughnessMap});painted.name='painted-steel-deck';applyFloorVariation(painted,'cryogenics');this.add(painted);
    this.add(this.owned({map:surfaces.floor.map,roughnessMap:surfaces.floor.roughnessMap}));
    this.add(this.owned({map:surfaces.floor.map}));
    this.add(this.owned({map:surfaces.floor.map,roughnessMap:surfaces.floor.roughnessMap,metalnessMap:surfaces.floor.metalnessMap}));
    this.add(this.owned({map:surfaces.floor.map,alphaTest:.5}));
    this.root.traverse(object=>{if(object instanceof T.Mesh){object.frustumCulled=false;object.castShadow=true;object.matrixAutoUpdate=false;this.ownedGeometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material]){this.replaceSamplers(material,material);if(material instanceof T.MeshStandardMaterial)optimizeLocalLights(material);material.userData.actorMaterial=true;material.userData.retainedRoomWarmup=true;this.ownedMaterials.add(material);this.topologies.add(topology(object,material));}}});
    this.root.updateMatrix();this.root.matrixAutoUpdate=false;this.root.visible=false;
  }
  /** Hidden during ordinary rendering; visible only while compileAsync enumerates variants. */
  prepare(){this.root.visible=!this.disposed;return()=>{this.root.visible=false;};}

  /** Retain one minimal proxy per actual room shader topology; returns new variants. */
  register(root: T.Object3D): number {
    if (this.disposed || root === this.root) return 0;
    let added = 0;
    root.traverse(object => {
      if (!(object instanceof T.Mesh) || object.userData.retainedRoomWarmup) return;
      for (const source of Array.isArray(object.material) ? object.material : [object.material]) {
        // Match prepareScene's room shader patch before freezing the exact hook.
        if (source instanceof T.MeshStandardMaterial) optimizeLocalLights(source);
        const key = topology(object, source);
        if (this.topologies.has(key)) continue;
        const material = this.cloneMaterial(source);
        const geometry = proxyGeometry(object.geometry, material);
        let proxy: T.Mesh;
        if (object instanceof T.SkinnedMesh) {
          if (!geometry.hasAttribute('skinIndex')) geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(new Uint16Array(16), 4));
          if (!geometry.hasAttribute('skinWeight')) geometry.setAttribute('skinWeight', new T.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], 4));
          const skinned = new T.SkinnedMesh(geometry, material);
          const bone = new T.Bone();
          skinned.add(bone);
          skinned.bind(new T.Skeleton([bone]));
          this.ownedSkeletons.add(skinned.skeleton);
          proxy = skinned;
        } else if (object instanceof T.InstancedMesh) {
          const instanced = new T.InstancedMesh(geometry, material, 1);
          instanced.setMatrixAt(0, new T.Matrix4());
          if (object.instanceColor) {
            const Constructor = object.instanceColor.array.constructor as T.TypedArrayConstructor;
            instanced.instanceColor = new T.InstancedBufferAttribute(new Constructor(object.instanceColor.itemSize).fill(1), object.instanceColor.itemSize, object.instanceColor.normalized);
            instanced.instanceColor.gpuType = object.instanceColor.gpuType;
          }
          if (object.morphTexture) {
            const width = object.morphTexture.image.width;
            instanced.morphTexture = new T.DataTexture(new Float32Array(width), width, 1, T.RedFormat, T.FloatType);
            instanced.morphTexture.needsUpdate = true;
          }
          this.ownedInstances.add(instanced);
          proxy = instanced;
        } else proxy = new T.Mesh(geometry, material);
        proxy.name = `retained-room-${source.type}`;
        proxy.userData.retainedRoomWarmup = true;
        proxy.frustumCulled = false;
        proxy.castShadow = proxy.receiveShadow = true;
        proxy.matrixAutoUpdate = false;
        proxy.updateMatrix();
        this.root.add(proxy);
        this.ownedGeometries.add(geometry);
        this.ownedMaterials.add(material);
        this.topologies.add(key);
        added++;
      }
    });
    return added;
  }

  /** Dispose only owned proxies and sampler data; original room assets remain untouched. */
  dispose(){
    if(this.disposed)return;
    this.disposed=true;
    for(const mesh of this.ownedInstances)mesh.dispose();
    for(const skeleton of this.ownedSkeletons)skeleton.dispose();
    for(const geometry of this.ownedGeometries)geometry.dispose();
    for(const material of this.ownedMaterials)material.dispose();
    for(const sampler of this.ownedSamplers)sampler.dispose();
    this.ownedInstances.clear();this.ownedSkeletons.clear();this.ownedGeometries.clear();this.ownedMaterials.clear();
    this.samplers.clear();this.ownedSamplers.clear();
    this.topologies.clear();this.root.clear();this.root.removeFromParent();this.root.visible=false;
  }

  private cloneMaterial(source: T.Material): T.Material {
    const material = source.clone();
    material.onBeforeCompile = source.onBeforeCompile;
    const cacheKey = source.customProgramCacheKey();
    material.customProgramCacheKey = () => cacheKey;
    const sourceDefines = (source as T.ShaderMaterial).defines;
    if (sourceDefines) (material as T.ShaderMaterial).defines = { ...sourceDefines };
    material.userData.actorMaterial = true;
    material.userData.retainedRoomWarmup = true;
    this.replaceSamplers(material, source);
    return material;
  }

  private replaceSamplers(material: T.Material, source: T.Material): void {
    for (const [name, value] of Object.entries(source)) if (value instanceof T.Texture) {
      (material as unknown as Record<string, unknown>)[name] = this.sampler(value);
    }
    if (source instanceof T.ShaderMaterial && material instanceof T.ShaderMaterial) {
      for (const [name, uniform] of Object.entries(source.uniforms)) {
        material.uniforms[name].value = this.uniformSamplers(uniform.value, material.uniforms[name].value);
      }
    }
  }

  private uniformSamplers(source: unknown, clone: unknown): unknown {
    if (source instanceof T.Texture) return this.sampler(source);
    if (Array.isArray(source)) return source.map((value, i) => this.uniformSamplers(value, Array.isArray(clone) ? clone[i] : value));
    if (source && Object.getPrototypeOf(source) === Object.prototype) {
      const result = { ...(clone as Record<string, unknown> ?? {}) };
      for (const [name, value] of Object.entries(source)) result[name] = this.uniformSamplers(value, result[name]);
      return result;
    }
    return clone;
  }

  /** Pool valid uploads by sampler topology, independent of image owner lifetime. */
  private sampler(source: T.Texture): T.Texture {
    const key = JSON.stringify(samplerShape(source));
    const cached = this.samplers.get(key);
    if (cached) return cached;
    const imageHeight = (source.image as { height?: number } | undefined)?.height;
    const height = source.mapping === T.CubeUVReflectionMapping && Number.isFinite(imageHeight)
      ? Math.max(1, Math.floor(imageHeight!)) : 1;
    const width = source.mapping === T.CubeUVReflectionMapping ? Math.max(1, Math.ceil(height * 3 / 4)) : 1;
    const data = () => samplerPixels(source, width, height);
    const format = source.format as T.PixelFormat;
    let texture: T.Texture;
    if (source instanceof T.CubeTexture) {
      const faces = Array.from({ length: 6 }, () => new T.DataTexture(data(), 1, 1, format, source.type));
      for (const face of faces) this.ownedSamplers.add(face);
      texture = new T.CubeTexture(faces);
    } else if (source instanceof T.DepthTexture) texture = new T.DepthTexture(width, height, source.type);
    else if (source instanceof T.Data3DTexture) texture = new T.Data3DTexture(data(), width, height, 1);
    else if (source instanceof T.DataArrayTexture) texture = new T.DataArrayTexture(data(), width, height, 1);
    else if ((source as T.VideoTexture).isVideoTexture) texture = new StaticVideoSampler(data(), width, height, format, source.type);
    else texture = new T.DataTexture(data(), width, height, format, source.type);
    texture.name = 'retained-room-sampler';
    texture.mapping = source.mapping;
    texture.channel = source.channel;
    texture.colorSpace = source.colorSpace;
    texture.format = source.format;
    texture.type = source.type;
    texture.internalFormat = source.internalFormat;
    (texture as SamplerTexture).normalized = (source as SamplerTexture).normalized;
    texture.generateMipmaps = false;
    texture.minFilter = texture.magFilter = T.NearestFilter;
    texture.unpackAlignment = 1;
    if (texture instanceof T.DepthTexture && source instanceof T.DepthTexture) texture.compareFunction = source.compareFunction;
    texture.needsUpdate = true;
    this.samplers.set(key, texture);
    this.ownedSamplers.add(texture);
    return texture;
  }
  private owned(parameters:T.MeshStandardMaterialParameters){const material=new T.MeshStandardMaterial(parameters);material.userData.actorMaterial=true;return material;}
  private add(material:T.MeshStandardMaterial){this.root.add(new T.Mesh(new T.PlaneGeometry(1,1),material));}
}
