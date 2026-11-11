import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getStaticColliderParts, setStaticColliderParts } from './StaticColliderParts';

const unsupported = Symbol('unsupported');

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
    const values = value.map(entry => exactValue(entry, ancestors));
    ancestors.delete(value);
    return values.includes(unsupported) ? unsupported : values;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return unsupported;
  const entries: unknown[] = [];
  for (const key of Object.keys(value).sort()) {
    const entry = exactValue((value as Record<string, unknown>)[key], ancestors);
    if (entry === unsupported) return unsupported;
    entries.push([key, entry]);
  }
  ancestors.delete(value);
  return entries;
}

function finishKey(material: T.Material): string | undefined {
  if (Object.getPrototypeOf(material) !== T.MeshStandardMaterial.prototype || material.transparent ||
      material.alphaHash || !material.depthWrite || !material.depthTest ||
      material.onBeforeRender !== T.Material.prototype.onBeforeRender ||
      material.onBeforeCompile !== T.Material.prototype.onBeforeCompile ||
      material.customProgramCacheKey !== T.Material.prototype.customProgramCacheKey) return;
  const entries: unknown[] = [];
  for (const key of Object.keys(material).sort()) {
    if (key === 'uuid' || key === 'version') continue;
    // These materials may own independent cleanup even when their pixels match.
    if (key === '_listeners') return;
    const value = exactValue((material as unknown as Record<string, unknown>)[key]);
    if (value === unsupported) return;
    entries.push([key, value]);
  }
  return JSON.stringify(entries);
}

function meshKey(mesh: T.Mesh): string | undefined {
  if (mesh.constructor !== T.Mesh || !mesh.visible || mesh.children.length || Array.isArray(mesh.material) ||
      mesh.customDepthMaterial || mesh.customDistanceMaterial || mesh.matrix.determinant() <= 0 ||
      Object.keys(mesh.userData).some(key => !['name', 'assembly', 'nativeGameUnitsPerUnit'].includes(key)) ||
      mesh.onBeforeRender !== T.Object3D.prototype.onBeforeRender ||
      mesh.onAfterRender !== T.Object3D.prototype.onAfterRender ||
      mesh.onBeforeShadow !== T.Object3D.prototype.onBeforeShadow ||
      mesh.onAfterShadow !== T.Object3D.prototype.onAfterShadow) return;
  const geometry = mesh.geometry, count = geometry.index?.count ?? geometry.attributes.position?.count ?? 0;
  if (!count || geometry.drawRange.start !== 0 || geometry.drawRange.count < count ||
      Object.keys(geometry.morphAttributes).length) return;
  const attributes: unknown[] = [];
  for (const key of Object.keys(geometry.attributes).sort()) {
    const attribute = geometry.attributes[key];
    if (!(attribute instanceof T.BufferAttribute) || attribute instanceof T.InstancedBufferAttribute) return;
    attributes.push([key, attribute.itemSize, attribute.normalized, attribute.array.constructor.name, attribute.gpuType]);
  }
  return JSON.stringify([!!geometry.index, attributes, mesh.castShadow, mesh.receiveShadow,
    mesh.frustumCulled, mesh.renderOrder, mesh.layers.mask]);
}

/**
 * Consolidate a validated, privately owned static GLB before material hooks.
 * Only direct opaque stock meshes with exactly equal material properties and
 * texture identities qualify. The lease root and named transform anchors stay
 * intact; borrowed geometry/maps are never modified or retired.
 */
export function batchOwnedStaticAsset(root: T.Group): number {
  root.updateWorldMatrix(true, true);
  const keys = new Map<T.Material, string | undefined>();
  const buckets = new Map<string, T.Mesh[]>();
  for (const object of root.children) {
    if (!(object instanceof T.Mesh)) continue;
    const key = meshKey(object);
    if (!key) continue;
    const material = object.material as T.Material;
    if (!keys.has(material)) keys.set(material, finishKey(material));
    const finish = keys.get(material);
    if (!finish) continue;
    const combined = finish + key, list = buckets.get(combined) ?? [];
    list.push(object); buckets.set(combined, list);
  }
  const oldMaterials = new Set<T.Material>();
  const collisionOwners = new Map<T.BufferGeometry, number>();
  const liveGeometries = new Set<T.BufferGeometry>();
  let saved = 0;
  for (const meshes of buckets.values()) {
    if (meshes.length < 2) continue;
    const parts = meshes.map(mesh => mesh.geometry.clone().applyMatrix4(mesh.matrix));
    const geometry = mergeGeometries(parts, false);
    parts.forEach(part => part.dispose());
    if (!geometry) continue;
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const first = meshes[0], material = first.material as T.Material;
    const merged = new T.Mesh(geometry, material);
    // The corpse-contact builder applies its dense-equipment proxy threshold
    // per original mesh. Render batching must never change those partitions.
    setStaticColliderParts(merged, meshes.flatMap(mesh => {
      const originals = getStaticColliderParts(mesh);
      return originals ? originals.map(part => ({ ...part, matrix: mesh.matrix.clone().multiply(part.matrix) })) :
        [{ geometry: mesh.geometry, matrix: mesh.matrix.clone(), name: mesh.name }];
    }));
    const ownedParts = new Set(meshes.map(mesh => mesh.geometry).filter(part => !part.userData.sharedAsset));
    for (const part of ownedParts) collisionOwners.set(part, (collisionOwners.get(part) ?? 0) + 1);
    if (ownedParts.size) {
      let retired = false;
      geometry.addEventListener('dispose', () => {
        if (retired) return;
        retired = true;
        for (const part of ownedParts) {
          const references = collisionOwners.get(part)! - 1;
          collisionOwners.set(part, references);
          if (!references && !liveGeometries.has(part)) part.dispose();
        }
      });
    }
    merged.name = `batched-${first.name}`;
    merged.castShadow = first.castShadow; merged.receiveShadow = first.receiveShadow;
    merged.frustumCulled = first.frustumCulled; merged.renderOrder = first.renderOrder;
    merged.layers.mask = first.layers.mask;
    for (const mesh of meshes) {
      root.add(new T.Group().copy(mesh, false));
      mesh.removeFromParent();
      if (mesh.material !== material) oldMaterials.add(mesh.material as T.Material);
    }
    root.add(merged); saved += meshes.length - 1;
  }
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    liveGeometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) oldMaterials.delete(material);
  });
  for (const material of oldMaterials) material.dispose();
  return saved;
}
