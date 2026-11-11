import * as T from 'three';
import {GLTFLoader, type GLTF} from 'three/addons/loaders/GLTFLoader.js';

type Disposable = {dispose():void};
export type RoomModelSpec = Readonly<{url:string; maxBytes:number; label:string}>;
type Resources = {objects:Set<Disposable>; images:Set<ImageBitmap>};
type Entry = {work:Promise<T.Group>; source?:T.Group; resources?:Resources; references:number; retired:boolean};
const shared = new WeakSet<Disposable>();
const sharedImages = new WeakSet<ImageBitmap>();
const leases = new WeakMap<T.Object3D, () => void>();
const retired = new WeakSet<T.Object3D>();

function collect(root:T.Object3D, textures:readonly T.Texture[] = []):Resources {
  const objects = new Set<Disposable>(), images = new Set<ImageBitmap>();
  const texture = (map:T.Texture) => {
    objects.add(map);
    if (typeof ImageBitmap !== 'undefined' && map.image instanceof ImageBitmap) images.add(map.image);
  };
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    objects.add(object.geometry);
    if (object instanceof T.InstancedMesh) objects.add(object);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      objects.add(material);
      for (const value of Object.values(material)) if (value instanceof T.Texture) texture(value);
    }
  });
  textures.forEach(texture);
  return {objects, images};
}

function destroy(resources:Resources):void {
  resources.objects.forEach(object => object.dispose());
  resources.images.forEach(image => image.close());
}

/** Retire room-owned copies and adapters; cached geometry, textures and images stay alive. */
export function retireRoomModels(...roots:T.Object3D[]):void {
  const objects = new Set<Disposable>(), images = new Set<ImageBitmap>(), release:(() => void)[] = [];
  for (const root of roots) {
    if (retired.has(root)) continue;
    retired.add(root);
    const resources = collect(root);
    for (const object of resources.objects) if (!shared.has(object)) objects.add(object);
    root.removeFromParent();
    const lease = leases.get(root);
    if (lease) { leases.delete(root); release.push(lease); }
  }
  // A shared texture owns its image; only exclusive images may close here.
  for (const object of objects) if (object instanceof T.Texture && typeof ImageBitmap !== 'undefined' && object.image instanceof ImageBitmap && !sharedImages.has(object.image)) images.add(object.image);
  destroy({objects, images});
  release.forEach(done => done());
}

async function decode(spec:RoomModelSpec):Promise<GLTF> {
  // The session cache owns this transfer. Individual room cancellation only retires its borrow.
  const response = await fetch(spec.url);
  if (!response.ok) throw Error(`${spec.label} HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > spec.maxBytes) {
    await response.body?.cancel();
    throw Error(`${spec.label} byte budget exceeded`);
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > spec.maxBytes) throw Error(`${spec.label} byte budget exceeded`);
  return new GLTFLoader().parseAsync(bytes, spec.url.slice(0, spec.url.lastIndexOf('/') + 1));
}

/** Session cache for at most three fixed static room models; never an unbounded URL cache. */
export class RoomModelCache {
  private readonly specs:Map<string, RoomModelSpec>;
  private readonly entries = new Map<string, Entry>();
  private disposed = false;

  constructor(specs:readonly RoomModelSpec[], private readonly loader:(spec:RoomModelSpec) => Promise<GLTF> = decode) {
    if (specs.length > 3 || new Set(specs.map(spec => spec.url)).size !== specs.length) throw Error('Room model cache requires at most three unique URLs');
    this.specs = new Map(specs.map(spec => [spec.url, spec]));
  }

  /** Coalesce fetch/decode and return independent transforms/materials with borrowed immutable maps. */
  async acquire(url:string, signal?:AbortSignal):Promise<T.Group> {
    if (this.disposed) throw Error('Room model cache disposed');
    const spec = this.specs.get(url);
    if (!spec) throw Error('Unknown room model URL');
    if (signal?.aborted) throw Error(`${spec.label} cancelled`);
    let entry = this.entries.get(url);
    if (!entry) {
      entry = {work:Promise.resolve(new T.Group()), references:0, retired:false};
      const current = entry;
      current.work = Promise.resolve().then(() => this.loader(spec)).then(async asset => {
        let textures:T.Texture[] = [];
        try {
          // Three resolves missing images as null textures. Never retain that incomplete template.
          textures = await asset.parser.getDependencies('texture');
          if (textures.length !== (asset.parser.json.textures?.length ?? 0) || textures.some(texture => {
            if (!(texture instanceof T.Texture)) return true;
            const image = texture.image as {width?:number; height?:number} | undefined;
            return !image?.width || !image.height;
          })) throw Error(`${spec.label} image decode failed`);
          asset.scene.traverse(object => {
            if (object instanceof T.SkinnedMesh) throw Error('Room model cache requires static meshes');
            if (!(object instanceof T.Mesh)) return;
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
              if (!(material instanceof T.MeshStandardMaterial)) continue;
              const id = asset.parser.associations.get(material)?.materials;
              if (id === undefined) continue;
              const definition = asset.parser.json.materials[id], pbr = definition.pbrMetallicRoughness;
              if ((pbr?.baseColorTexture && !material.map) ||
                  (pbr?.metallicRoughnessTexture && (!material.roughnessMap || !material.metalnessMap)) ||
                  (definition.normalTexture && !material.normalMap) ||
                  (definition.occlusionTexture && !material.aoMap) ||
                  (definition.emissiveTexture && !material.emissiveMap)) throw Error(`${spec.label} image binding failed`);
            }
          });
          current.source = asset.scene;
          current.resources = collect(asset.scene, textures);
          if (this.disposed) { destroy(current.resources); current.resources = undefined; throw Error('Room model cache disposed'); }
          for (const object of current.resources.objects) shared.add(object);
          for (const image of current.resources.images) sharedImages.add(image);
          asset.scene.traverse(object => { if (object instanceof T.Mesh) object.geometry.userData.sharedAsset = true; });
          return asset.scene;
        } catch (error) {
          if (!current.source) destroy(collect(asset.scene, textures.filter(texture => texture instanceof T.Texture)));
          throw error;
        }
      }).catch(error => {
        if (this.entries.get(url) === current) this.entries.delete(url);
        throw error;
      });
      this.entries.set(url, current);
    }
    const source = await entry.work;
    if (this.disposed) throw Error('Room model cache disposed');
    // A cancelled borrower never gains ownership; the decoded template remains useful to others.
    if (signal?.aborted) throw Error(`${spec.label} cancelled`);
    const root = source.clone(true), materials = new Map<T.Material, T.Material>();
    root.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const copy = (material:T.Material) => {
        let owned = materials.get(material);
        if (!owned) { owned = material.clone(); materials.set(material, owned); }
        return owned;
      };
      object.material = Array.isArray(object.material) ? object.material.map(copy) : copy(object.material);
    });
    entry.references++;
    const borrowed = entry;
    leases.set(root, () => { borrowed.references--; if (borrowed.retired && !borrowed.references && borrowed.resources) { destroy(borrowed.resources); borrowed.resources = undefined; } });
    return root;
  }

  /** Explicit session shutdown. Active borrows keep their images until their final retirement. */
  dispose():void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.entries.values()) {
      entry.retired = true;
      if (!entry.references && entry.resources) { destroy(entry.resources); entry.resources = undefined; }
    }
    this.entries.clear();
  }
}

const base = import.meta.env.BASE_URL;
export const roomModelCache = new RoomModelCache([
  {url:base + 'assets/benchmark/sealed-cryo.glb', maxBytes:1100000, label:'chamber'},
  {url:base + 'assets/awakening/released-berth/released-berth.glb', maxBytes:800000, label:'released berth'},
  {url:base + 'assets/awakening/recovery-kit/room-kit.glb', maxBytes:1800000, label:'recovery kit'},
]);
