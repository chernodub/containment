import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { geometries } from './meshParts';

export type StaticRoomBatchStats = Readonly<{
  meshesBefore: number;
  meshesAfter: number;
  mergedMeshes: number;
  retiredGeometries: number;
  retiredMaterials: number;
}>;

type Bucket = { material: T.Material; meshes: T.Mesh[] };
const unsupported = Symbol('unsupported');

// Inspect values directly: Material.toJSON can serialize entire embedded images.
// Texture identity is intentional; equal pixels do not imply equal ownership.
function exactValue(value: unknown, ancestors = new Set<object>()): unknown | typeof unsupported {
  if (value === undefined) return ['undefined'];
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return ['number', Object.is(value, -0) ? '-0' : String(value)];
  if (value instanceof T.Texture) return ['texture', value.uuid];
  if (value instanceof T.Color || value instanceof T.Vector2 || value instanceof T.Vector3 ||
      value instanceof T.Vector4 || value instanceof T.Euler) return [value.constructor.name, value.toArray()];
  if (typeof value !== 'object') return unsupported;
  if (ancestors.has(value)) return unsupported;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result = value.map(entry => exactValue(entry, ancestors));
    ancestors.delete(value);
    return result.includes(unsupported) ? unsupported : result;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return unsupported;
  const result: unknown[] = [];
  for (const key of Object.keys(value).sort()) {
    const entry = exactValue((value as Record<string, unknown>)[key], ancestors);
    if (entry === unsupported) return unsupported;
    result.push([key, entry]);
  }
  ancestors.delete(value);
  return result;
}

function stockMaterial(material: T.Material): boolean {
  return (Object.getPrototypeOf(material) === T.MeshStandardMaterial.prototype || Object.getPrototypeOf(material) === T.MeshBasicMaterial.prototype) &&
    material.onBeforeCompile === T.Material.prototype.onBeforeCompile &&
    material.onBeforeRender === T.Material.prototype.onBeforeRender &&
    material.customProgramCacheKey === T.Material.prototype.customProgramCacheKey;
}

function materialKey(material: T.Material): string | undefined {
  // Only room-owned stock finishes may relinquish their separate identities.
  if (!stockMaterial(material) || !material.userData.actorMaterial) return;
  const values: Record<string, unknown> = {};
  for (const key of Object.keys(material).sort()) {
    if (key === 'uuid' || key === 'version') continue;
    // A disposal listener can own a texture or other resource independently.
    if (key === '_listeners') return;
    const value = exactValue((material as unknown as Record<string, unknown>)[key]);
    if (value === unsupported) return;
    values[key] = value;
  }
  return JSON.stringify(values);
}

function geometryKey(geometry: T.BufferGeometry): string | undefined {
  const count = geometry.index?.count ?? geometry.attributes.position?.count ?? 0;
  if (!count || geometry.drawRange.start !== 0 || geometry.drawRange.count < count ||
      Object.keys(geometry.morphAttributes).length) return;
  const layout: unknown[] = [];
  for (const name of Object.keys(geometry.attributes).sort()) {
    const attribute = geometry.attributes[name];
    if (!(attribute instanceof T.BufferAttribute) || attribute instanceof T.InstancedBufferAttribute) return;
    layout.push([name, attribute.itemSize, attribute.normalized, attribute.array.constructor.name, attribute.gpuType]);
  }
  return JSON.stringify(layout);
}

function meshKey(mesh: T.Mesh): string | undefined {
  if (mesh.constructor !== T.Mesh || !mesh.userData.bakedEnvironment || !mesh.visible ||
      mesh.children.length || Array.isArray(mesh.material) || mesh.material.transparent ||
      mesh.material.alphaHash || !mesh.material.depthTest || !mesh.material.depthWrite ||
      !mesh.material.visible || !stockMaterial(mesh.material) ||
      mesh.customDepthMaterial || mesh.customDistanceMaterial ||
      mesh.onBeforeRender !== T.Object3D.prototype.onBeforeRender ||
      mesh.onAfterRender !== T.Object3D.prototype.onAfterRender ||
      mesh.onBeforeShadow !== T.Object3D.prototype.onBeforeShadow ||
      mesh.onAfterShadow !== T.Object3D.prototype.onAfterShadow ||
      !(mesh.matrix.determinant() > 0)) return;
  const layout = geometryKey(mesh.geometry), data = exactValue(mesh.userData);
  if (!layout || data === unsupported) return;
  // Retain names and userData as well as render flags; authored hooks stay valid.
  return JSON.stringify([layout, mesh.name, data, mesh.castShadow, mesh.receiveShadow,
    mesh.renderOrder, mesh.layers.mask, mesh.frustumCulled]);
}

/**
 * Consolidate already-baked static room meshes before applyRoomMood adds hooks.
 * Each parent is an independent resource boundary. Instanced/loaded assets,
 * transparent meshes, live dressing and named owner roots remain untouched.
 */
export function batchStaticRoom(root: T.Object3D): StaticRoomBatchStats {
  root.updateWorldMatrix(true, true);
  const parents: T.Object3D[] = [];
  let meshesBefore = 0;
  root.traverse(object => {
    if (object instanceof T.Mesh) meshesBefore++;
    if (object.children.length) parents.push(object);
  });
  const removedGeometries = new Set<T.BufferGeometry>();
  const removedMaterials = new Set<T.Material>();
  let mergedMeshes = 0;
  for (const parent of parents) {
    const finishes = new Map<string, T.Material>();
    const materialKeys = new Map<T.Material, string | undefined>();
    const buckets = new Map<T.Material, Map<string, Bucket>>();
    for (const object of parent.children) {
      if (!(object instanceof T.Mesh)) continue;
      const key = meshKey(object);
      if (!key) continue;
      const source = object.material as T.Material;
      if (!materialKeys.has(source)) materialKeys.set(source, materialKey(source));
      const finishKey = materialKeys.get(source);
      let material = source;
      if (finishKey) {
        material = finishes.get(finishKey) ?? source;
        finishes.set(finishKey, material);
      }
      const layouts = buckets.get(material) ?? new Map<string, Bucket>();
      const bucket = layouts.get(key) ?? { material, meshes: [] };
      bucket.meshes.push(object);
      layouts.set(key, bucket);
      buckets.set(material, layouts);
    }
    for (const layouts of buckets.values()) for (const { material, meshes } of layouts.values()) {
      if (meshes.length < 2) continue;
      const parts = meshes.map(mesh => (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrix));
      const geometry = mergeGeometries(parts, false);
      for (const part of parts) part.dispose();
      if (!geometry) continue;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const first = meshes[0], merged = new T.Mesh(geometry, material);
      merged.name = first.name;
      merged.userData = { ...first.userData };
      merged.castShadow = first.castShadow;
      merged.receiveShadow = first.receiveShadow;
      merged.renderOrder = first.renderOrder;
      merged.layers.mask = first.layers.mask;
      merged.frustumCulled = first.frustumCulled;
      for (const mesh of meshes) {
        removedGeometries.add(mesh.geometry);
        if (mesh.material !== material) removedMaterials.add(mesh.material as T.Material);
        mesh.removeFromParent();
      }
      parent.add(merged);
      mergedMeshes += meshes.length - 1;
    }
  }
  // A material/geometry can also be referenced by an excluded sibling. Retire
  // only detached room resources, never the shared primitive or asset caches.
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    removedGeometries.delete(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) removedMaterials.delete(material);
  });
  const shared = new Set(geometries.values());
  let retiredGeometries = 0;
  for (const geometry of removedGeometries) if (!shared.has(geometry) && !geometry.userData.sharedAsset) {
    geometry.dispose();
    retiredGeometries++;
  }
  for (const material of removedMaterials) material.dispose();
  return { meshesBefore, meshesAfter: meshesBefore - mergedMeshes, mergedMeshes,
    retiredGeometries, retiredMaterials: removedMaterials.size };
}
