import * as T from 'three';
import {batchActorSkins} from './ActorSkinBatching';
import {originalMarineRig} from './MarineRigAnatomy';
import {prepareOriginalCreature} from './OriginalCreatureAnatomy';

type SourceFinish = {
  name: string;
  sourceAsset?: unknown;
  sourceTexture?: unknown;
};

function ordinaryOpaqueSkin(mesh: T.SkinnedMesh): boolean {
  const material = mesh.material;
  return material instanceof T.MeshStandardMaterial
    && mesh.geometry.hasAttribute('actorRegion')
    && !material.transparent && material.opacity === 1 && material.alphaTest === 0
    && material.side === T.FrontSide && material.depthFunc === T.LessEqualDepth
    && material.depthTest && material.depthWrite && material.colorWrite
    && !material.wireframe && !material.stencilWrite && !material.polygonOffset
    && !material.alphaHash && !material.alphaToCoverage
    && material.blending === T.NormalBlending && !material.clippingPlanes?.length
    && material.onBeforeCompile === T.Material.prototype.onBeforeCompile
    && material.onBeforeRender === T.Material.prototype.onBeforeRender;
}

/** Replace photographic skin finishes once, after semantic regions are authored. */
export function prepareFlatActorSkin(
  root: T.Object3D,
  asset: string,
  clips: readonly T.AnimationClip[],
): number {
  if (root.userData.actorSkinPreparation) return 0;
  if (prepareOriginalCreature(root)) {
    root.userData.actorSkinPreparation = {authoredFinish: true, rankVariants: true};
    return 0;
  }
  // The original marine already has designed flat zones and baked surface detail.
  // Its four named skins must remain independent so hidden variants cost no draw.
  if (asset === 'marine' && originalMarineRig(root)) {
    let count = 0;
    root.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      count++;
      // Title presentation patches each mesh finish; variants need independent
      // material owners while keeping their atlas textures shared.
      object.material = Array.isArray(object.material)
        ? object.material.map(material => material.clone()) : object.material.clone();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        material.userData.k10Original = true;
      }
    });
    root.userData.k10Original = true;
    root.userData.actorSkinPreparation = {before: count, after: count, saved: 0, authoredFinish: true};
    return 0;
  }
  const meshes: T.SkinnedMesh[] = [];
  const sources = new Map<T.Material, SourceFinish>();
  root.traverse(object => {
    if (!(object instanceof T.SkinnedMesh) || !ordinaryOpaqueSkin(object)) return;
    const material = object.material as T.MeshStandardMaterial;
    meshes.push(object);
    sources.set(material, {
      name: material.name,
      sourceAsset: material.userData.sourceAsset ?? asset,
      sourceTexture: material.userData.sourceTexture,
    });
  });
  if (!meshes.length) return 0;
  const first = meshes[0].material as T.MeshStandardMaterial;
  if (!first.userData.actorFlatSkin) {
    const finish = new T.MeshStandardMaterial({
      name: `g5-flat-skin-${asset}`,
      color: 0xffffff,
      roughness: .85,
      metalness: 0,
    });
    // Provenance stays plain metadata, never a retained photographic texture.
    finish.userData = {
      ...first.userData,
      actorFlatSkin: true,
      sourceAsset: asset,
      sourceMaterials: [...sources.values()],
    };
    for (const mesh of meshes) mesh.material = finish;
  }
  const before = meshes.length;
  const saved = batchActorSkins(root, clips);
  root.userData.actorSkinPreparation = {
    before,
    after: before - saved,
    saved,
    sourceMaterials: [...sources.values()],
  };
  return saved;
}
