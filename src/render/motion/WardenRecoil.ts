import * as T from 'three';

/** Present the open cheek on camera-facing impacts. The common neck moves
 * both halves of the open hinge, including the tongue attached to the jaw. */
export function wardenRecoil(root: T.Object3D) {
  const neck = root.getObjectByName('neck'), head = root.getObjectByName('head');
  let skin: T.SkinnedMesh | undefined;
  root.traverse(node => { if (!skin && node instanceof T.SkinnedMesh) skin = node; });
  if (!neck?.parent || !head || !skin) return;
  const index = skin.skeleton.bones.indexOf(head as T.Bone);
  if (index < 0) return;
  const cheek = new T.Vector3(3.15, 0, 5.99 / 1.8)
    .applyMatrix4(skin.bindMatrix).applyMatrix4(skin.skeleton.boneInverses[index]);
  const parent = neck.parent, world = new T.Vector3(), local = new T.Vector3();
  const target = new T.Vector3(), axis = new T.Vector3(), rotation = new T.Quaternion();
  const original = new T.Vector3(), originalRotation = new T.Quaternion();
  let active = false;
  return {
    release() {
      if (!active) return;
      neck.position.copy(original);
      neck.quaternion.copy(originalRotation);
      neck.updateMatrix();
      active = false;
    },
    apply(amount: number) {
      const exposure = amount * T.MathUtils.smoothstep(Math.cos(root.rotation.y), -.10, .65);
      if (exposure <= 0) return;
      const side = Math.sin(root.rotation.y) >= 0 ? 1 : -1;
      head.updateWorldMatrix(true, false);
      world.copy(cheek).applyMatrix4(head.matrixWorld);
      neck.worldToLocal(local.copy(world));
      target.set(.48 * side, .61, .38).multiplyScalar(exposure).add(world);
      parent.worldToLocal(target);
      parent.getWorldQuaternion(rotation).invert();
      axis.set(0, 1, 0).applyQuaternion(rotation).normalize();
      original.copy(neck.position);
      originalRotation.copy(neck.quaternion);
      neck.quaternion.premultiply(rotation.setFromAxisAngle(axis, -1.30 * side * exposure));
      neck.updateMatrix();
      neck.position.add(target.sub(local.applyMatrix4(neck.matrix)));
      neck.updateMatrix();
      active = true;
    }
  };
}
