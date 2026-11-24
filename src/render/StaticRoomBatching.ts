import {LOCAL_LIGHT_CACHE_SUFFIX} from './lighting/LocalLightShading';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { geometries, MAT } from './meshParts';
import { getStaticColliderParts, setStaticColliderParts } from './StaticColliderParts';
import {hasStaticGeometryPolicy} from './post/GeometryBuffer';

export type StaticRoomBatchStats = Readonly<{
  meshesBefore: number;
  meshesAfter: number;
  mergedMeshes: number;
  retiredGeometries: number;
  retiredMaterials: number;
}>;

type Bucket = { material: T.Material; meshes: T.Mesh[] };

// These constructor-owned groups contain only rigid procedural ship fittings.
// Loaded/lazy owners, exit signals, live fixtures and other authored roots keep
// their existing hierarchy and lifecycle boundaries.
const rigidEquipmentOwners = new Set([
  'l8-equipment', 'armory-carousel-and-issue-bay',
  'safety-recorder', 'disconnected-ai-housing', 'split-contactor-battery',
]);
const sharedRoomFinishKeys = new Map<T.Material, string>(
  Object.values(MAT).map(material => [material, material.customProgramCacheKey()]),
);
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

function rigidMaterial(material: T.Material): boolean {
  if (stockMaterial(material)) return true;
  // These exact session-owned finishes can be lit on the title/previous room
  // before a later procedural room is built. The retained local-light, graphic
  // and MRT policies are material-only; the same material identity may batch.
  // Never equate different hooked finishes or accept an unknown shader hook.
  const original = sharedRoomFinishKeys.get(material);
  if(original===undefined)return false;
  const key=material.customProgramCacheKey(),local=original+LOCAL_LIGHT_CACHE_SUFFIX;
  if(material.onBeforeRender===T.Material.prototype.onBeforeRender)
    return key===local||key===`${local}:graphic-surface-v1`;
  return key===`${local}:graphic-surface-v1:geometry-mrt-v2`&&hasStaticGeometryPolicy(material);
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

function meshKey(mesh: T.Mesh, rigidEquipment = false): string | undefined {
  if (mesh.constructor !== T.Mesh || (!rigidEquipment && !mesh.userData.bakedEnvironment) || !mesh.visible ||
      mesh.children.length || Array.isArray(mesh.material) || mesh.material.transparent ||
      mesh.material.alphaHash || !mesh.material.depthTest || !mesh.material.depthWrite ||
      !mesh.material.visible || !(rigidEquipment ? rigidMaterial(mesh.material) : stockMaterial(mesh.material)) ||
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
 * Each parent is an independent resource boundary, except for explicit
 * rigid procedural equipment constructors. Instanced/loaded assets, transparent
 * meshes, live dressing and other named owner roots remain untouched.
 */
export function batchStaticRoom(root: T.Object3D): StaticRoomBatchStats {
  root.updateWorldMatrix(true, true);
  const parents: T.Object3D[] = [];
  const rigidOwners: T.Object3D[] = [];
  let meshesBefore = 0;
  root.traverse(object => {
    if (object instanceof T.Mesh) meshesBefore++;
    if (object.children.length) parents.push(object);
    if (object instanceof T.Group && rigidEquipmentOwners.has(object.name)) rigidOwners.push(object);
  });
  const removedGeometries = new Set<T.BufferGeometry>();
  const removedMaterials = new Set<T.Material>();
  let mergedMeshes = 0;
  // Nested equipment remains inside its constructor owner. Empty transform
  // groups survive so fixture origins and authored group hooks remain valid.
  // A hidden/reflected/custom hierarchy is an independent boundary, not static
  // permission inherited from its ancestor's name.
  const rigidMeshes = (owner: T.Object3D): T.Mesh[] => {
    const candidates: T.Mesh[] = [];
    const visit = (parent: T.Object3D) => {
      for (const child of parent.children) {
        if (!child.visible || child.matrix.determinant() <= 0) continue;
        if (child instanceof T.Mesh) { candidates.push(child); continue; }
        if (Object.getPrototypeOf(child) !== T.Group.prototype ||
            child.onBeforeRender !== T.Object3D.prototype.onBeforeRender ||
            child.onAfterRender !== T.Object3D.prototype.onAfterRender ||
            rigidEquipmentOwners.has(child.name)) continue;
        visit(child);
      }
    };
    visit(owner);
    return candidates;
  };
  const passes = [
    ...parents.map(parent => ({ parent, rigid: false })),
    ...rigidOwners.map(parent => ({ parent, rigid: true })),
  ];
  for (const { parent, rigid } of passes) {
    const inverse = rigid ? parent.matrixWorld.clone().invert() : undefined;
    const localMatrix = (mesh: T.Mesh) => inverse ? new T.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld) : mesh.matrix;
    const finishes = new Map<string, T.Material>();
    const materialKeys = new Map<T.Material, string | undefined>();
    const buckets = new Map<T.Material, Map<string, Bucket>>();
    for (const object of rigid ? rigidMeshes(parent) : parent.children) {
      if (!(object instanceof T.Mesh)) continue;
      const key = meshKey(object, rigid);
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
      const parts = meshes.map(mesh => (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(localMatrix(mesh)));
      const geometry = mergeGeometries(parts, false);
      for (const part of parts) part.dispose();
      if (!geometry) continue;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const first = meshes[0], merged = new T.Mesh(geometry, material);
      setStaticColliderParts(merged, meshes.flatMap(mesh => {
        const originals = getStaticColliderParts(mesh);
        return originals ? originals.map(part => ({ ...part, matrix: localMatrix(mesh).clone().multiply(part.matrix) })) :
          [{ geometry: mesh.geometry, matrix: localMatrix(mesh).clone(), name: mesh.name }];
      }));
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
      // A subsequent rigid pass can include meshes consolidated in this pass.
      merged.updateWorldMatrix(true, false);
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
