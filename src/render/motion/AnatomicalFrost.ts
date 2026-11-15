import * as T from 'three';

const CORE: Record<string, readonly string[]> = {
  marine:['hips','spine','ribs','head'], crawler:['chest'],
  stalker:['torso','chest','neck_lo','head'], spitter:['bum','spine2','head'],
  carrier:['body','body001','body002','head'], brute:['chest','tail','neck','head'],
};

/** Same anatomical owners drive rigid frost pieces and ordinary ragdoll bodies. */
export function isAnatomicalBone(name: string, family: string) {
  const n = name.replaceAll('.', '');
  if (CORE[family]?.includes(n)) return true;
  if (family === 'marine') return /^(upper_arm|forearm|thigh|shin|ankle|foot)[RL]$/.test(n);
  if (family === 'crawler') return /^leg\d_(upper|lower)$/.test(n);
  if (family === 'stalker') return /^(leg_(back|front)_(up|mid)|arm_(up|mid))[LR]$/.test(n);
  if (family === 'spitter') return /^(leg_[bm]1?|hand1?)[LR]$/.test(n);
  if (family === 'carrier') return /^(leg_(front|middle|back)(001)?|upper_arm(001)?)[LR]$/.test(n);
  return /^(leg(back|front)|foot(back|front)|shoulder|forearm)[rl]$/.test(n);
}

type SkinVariant = {mesh: T.SkinnedMesh; original: T.BufferGeometry; frost: T.BufferGeometry};

/**
 * Prepared rigid triangle islands, still in the original single skinned draw.
 * Each triangle follows one anatomical part. Frost can separate these parts
 * without rubber bridges between the corpse pieces. Source buffers are read-only.
 */
export class AnatomicalFrost {
  private readonly variants: SkinVariant[] = [];

  constructor(root: T.Object3D, family: string) {
    root.traverse(object => {
      if (!(object instanceof T.SkinnedMesh)) return;
      const mesh = object, original = mesh.geometry;
      const frost = original.index ? original.toNonIndexed() : original.clone();
      const indices = frost.getAttribute('skinIndex'), weights = frost.getAttribute('skinWeight');
      if (!indices || !weights) {frost.dispose(); return;}
      const skeleton = mesh.skeleton.bones;
      const fallback = Math.max(0, skeleton.findIndex(bone => isAnatomicalBone(bone.name, family)));
      const owners = skeleton.map(bone => {
        let owner: T.Object3D | null = bone;
        while (owner && !isAnatomicalBone(owner.name, family)) owner = owner.parent;
        const index = skeleton.indexOf(owner as T.Bone);
        return index >= 0 ? index : fallback;
      });
      const scores = new Float32Array(skeleton.length);
      for (let vertex = 0; vertex < indices.count; vertex += 3) {
        scores.fill(0);
        let owner = fallback, best = -1;
        for (let corner = 0; corner < 3; corner++) for (let lane = 0; lane < 4; lane++) {
          const bone = owners[indices.getComponent(vertex + corner, lane)];
          scores[bone] += weights.getComponent(vertex + corner, lane);
          if (scores[bone] > best) {best = scores[bone]; owner = bone;}
        }
        for (let corner = 0; corner < 3; corner++) {
          indices.setXYZW(vertex + corner, owner, 0, 0, 0);
          weights.setXYZW(vertex + corner, 1, 0, 0, 0);
        }
      }
      frost.userData.sharedAsset = false;
      frost.name = `${original.name || mesh.name}-anatomical-frost`;
      // Inactive geometry remains lifecycle-owned without creating another
      // drawable or retaining a second skeleton/material/program variant.
      (mesh.userData.geometryVariants ??= []).push(frost);
      this.variants.push({mesh, original, frost});
    });
  }

  use() {for (const variant of this.variants) variant.mesh.geometry = variant.frost;}
  reset() {for (const variant of this.variants) variant.mesh.geometry = variant.original;}
}
