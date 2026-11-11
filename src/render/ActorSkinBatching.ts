import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function sameSkeleton(a: T.Skeleton, b: T.Skeleton): boolean {
  return a === b || a.bones.length === b.bones.length &&
    a.bones.every((bone, index) => bone === b.bones[index] && a.boneInverses[index].equals(b.boneInverses[index]));
}

function layout(geometry: T.BufferGeometry): string | undefined {
  const count = geometry.index?.count ?? geometry.attributes.position?.count ?? 0;
  if (!count || geometry.drawRange.start !== 0 || geometry.drawRange.count < count ||
      Object.keys(geometry.morphAttributes).length ||
      !geometry.attributes.skinIndex || !geometry.attributes.skinWeight) return;
  const attributes: unknown[] = [];
  for (const key of Object.keys(geometry.attributes).sort()) {
    const attribute = geometry.attributes[key];
    if (!(attribute instanceof T.BufferAttribute) || attribute instanceof T.InstancedBufferAttribute) return;
    attributes.push([key, attribute.itemSize, attribute.normalized, attribute.array.constructor.name, attribute.gpuType]);
  }
  return JSON.stringify([!!geometry.index, attributes]);
}

function eligible(mesh: T.SkinnedMesh, animatedNames: ReadonlySet<string>): boolean {
  return mesh.constructor === T.SkinnedMesh && !Array.isArray(mesh.material) &&
    !mesh.material.transparent && mesh.visible && !mesh.children.length &&
    mesh.material.onBeforeRender === T.Material.prototype.onBeforeRender &&
    !animatedNames.has(mesh.name) && !animatedNames.has(mesh.uuid) &&
    !mesh.morphTargetInfluences && !mesh.customDepthMaterial && !mesh.customDistanceMaterial &&
    mesh.onBeforeRender === T.Object3D.prototype.onBeforeRender &&
    mesh.onAfterRender === T.Object3D.prototype.onAfterRender &&
    mesh.onBeforeShadow === T.Object3D.prototype.onBeforeShadow &&
    mesh.onAfterShadow === T.Object3D.prototype.onAfterShadow;
}

function compatible(a: T.SkinnedMesh, b: T.SkinnedMesh): boolean {
  // GLTFLoader retains unsanitized node labels here; each named anchor keeps it.
  const { name: _aName, ...aData } = a.userData;
  const { name: _bName, ...bData } = b.userData;
  return a.material === b.material && sameSkeleton(a.skeleton, b.skeleton) &&
    a.matrix.equals(b.matrix) && a.bindMode === b.bindMode &&
    a.bindMatrix.equals(b.bindMatrix) && a.bindMatrixInverse.equals(b.bindMatrixInverse) &&
    a.castShadow === b.castShadow && a.receiveShadow === b.receiveShadow &&
    a.frustumCulled === b.frustumCulled && a.renderOrder === b.renderOrder &&
    a.layers.mask === b.layers.mask && a.matrixAutoUpdate === b.matrixAutoUpdate &&
    JSON.stringify(aData) === JSON.stringify(bData);
}

/**
 * Merge exact same-finish skin primitives once on the loaded asset template.
 * Skin indices, bind transforms and bones stay unchanged. Named mesh transforms
 * remain as empty nodes for attachments; clones share the resulting template
 * geometry through the normal asset resource lifecycle.
 * Returns the number of removed drawable primitives.
 */
export function batchActorSkins(root: T.Object3D, clips: readonly T.AnimationClip[] = []): number {
  const animatedNames = new Set<string>();
  for (const clip of clips) for (const track of clip.tracks) {
    const binding = T.PropertyBinding.parseTrackName(track.name);
    if (binding.nodeName) animatedNames.add(binding.nodeName);
  }
  root.updateWorldMatrix(true, true);
  const parents: T.Object3D[] = [];
  root.traverse(object => { if (object.children.length) parents.push(object); });
  const retired = new Set<T.BufferGeometry>();
  let saved = 0;
  for (const parent of parents) {
    const buckets: { layout: string; meshes: T.SkinnedMesh[] }[] = [];
    for (const child of parent.children) {
      if (!(child instanceof T.SkinnedMesh) || !eligible(child, animatedNames)) continue;
      const key = layout(child.geometry);
      if (!key) continue;
      let bucket = buckets.find(value => value.layout === key && compatible(value.meshes[0], child));
      if (!bucket) { bucket = { layout: key, meshes: [] }; buckets.push(bucket); }
      bucket.meshes.push(child);
    }
    for (const { meshes } of buckets) {
      if (meshes.length < 2) continue;
      // No vertex transform or welding: every attribute remains bit-for-bit.
      const geometry = mergeGeometries(meshes.map(mesh => mesh.geometry), false);
      if (!geometry) continue;
      geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      const first = meshes[0], merged = first.clone(false);
      merged.geometry = geometry;
      merged.name = `batched-${first.name}`;
      merged.computeBoundingBox(); merged.computeBoundingSphere();
      for (const mesh of meshes) {
        const anchor = new T.Group().copy(mesh, false);
        parent.add(anchor);
        mesh.removeFromParent();
        retired.add(mesh.geometry);
      }
      parent.add(merged);
      saved += meshes.length - 1;
    }
  }
  root.traverse(object => { if (object instanceof T.Mesh) retired.delete(object.geometry); });
  for (const geometry of retired) if (!geometry.userData.sharedAsset) geometry.dispose();
  return saved;
}
