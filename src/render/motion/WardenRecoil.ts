import * as T from 'three';

/** Present the open cheek on camera-facing impacts. The common neck moves
 * both halves of the open hinge, including the tongue attached to the jaw. */
export function wardenRecoil(root: T.Object3D) {
  const neck = root.getObjectByName('neck'), head = root.getObjectByName('head');
  let skin: T.SkinnedMesh | undefined;
  root.traverse(node => { if (!skin && node instanceof T.SkinnedMesh) skin = node; });
  const jaw = root.getObjectByName('jaw');
  if (!neck?.parent || !head || !skin || !jaw?.parent) return;
  const index = skin.skeleton.bones.indexOf(head as T.Bone);
  if (index < 0) return;
  const cheek = new T.Vector3(3.15, 0, 5.99 / 1.8)
    .applyMatrix4(skin.bindMatrix).applyMatrix4(skin.skeleton.boneInverses[index]);
  const parent = neck.parent, world = new T.Vector3(), local = new T.Vector3();
  const target = new T.Vector3(), axis = new T.Vector3(), rotation = new T.Quaternion();
  const original = new T.Vector3(), originalRotation = new T.Quaternion();
  const jawIndex = skin.skeleton.bones.indexOf(jaw as T.Bone);
  const headToBind = skin.skeleton.boneInverses[index].clone().multiply(skin.bindMatrix);
  const jawFromBind = skin.skeleton.boneInverses[jawIndex].clone().multiply(skin.bindMatrix).invert();
  const hinge = new T.Matrix4().makeTranslation(3.90, 0, 3.50);
  const fromHinge = hinge.clone().invert();
  const matrix = new T.Matrix4(), opening = new T.Matrix4(), savedJaw = new T.Matrix4();
  const jawParent = jaw.parent, headParent = head.parent!;
  const headFromBind = headToBind.clone().invert(), savedHead = new T.Matrix4();
  const forward = new T.Vector3(), lateral = new T.Vector3(), up = new T.Vector3();
  const extent = new T.Vector3(), position = new T.Vector3(), scale = new T.Vector3();
  const turn = new T.Quaternion();
  let headActive = false;
  let jawActive = false, active = false;
  return {
    release() {
      if (jawActive) {
        savedJaw.decompose(jaw.position,jaw.quaternion,jaw.scale);
        jaw.updateMatrix();
        jawActive = false;
      }
      if (headActive) {
        savedHead.decompose(head.position,head.quaternion,head.scale);
        head.updateMatrix();
        headActive = false;
      }
      if (!active) return;
      neck.position.copy(original);
      neck.quaternion.copy(originalRotation);
      neck.updateMatrix();
      active = false;
    },
    apply(amount: number) {
      const exposure = amount * T.MathUtils.smoothstep(Math.cos(root.rotation.y), -.10, .65);
      if (exposure > 0) {
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
        neck.quaternion.premultiply(rotation.setFromAxisAngle(axis, -.82 * side * exposure));
        neck.updateMatrix();
        neck.position.add(target.sub(local.applyMatrix4(neck.matrix)));
        neck.updateMatrix();
        active = true;
      }
      jaw.updateMatrix();
      savedJaw.copy(jaw.matrix);
      head.updateWorldMatrix(true,false);
      if (amount > 0) {
        // Keep the cheek hinge stationary and present the near tooth row in three-quarter view.
        savedHead.copy(head.matrix);
        matrix.multiplyMatrices(head.matrixWorld,headToBind);
        world.set(3.90,0,3.50).applyMatrix4(matrix);
        extent.setFromMatrixScale(matrix);
        forward.setFromMatrixColumn(matrix,0);
        const side = forward.x<0?-1:1;
        forward.set(.643*side,-.12,.766).normalize();
        lateral.set(0,1,0).cross(forward).normalize();
        up.crossVectors(forward,lateral);
        if(matrix.determinant()<0)lateral.negate();
        matrix.makeBasis(forward.multiplyScalar(extent.x),lateral.multiplyScalar(extent.y),up.multiplyScalar(extent.z));
        position.set(3.90,0,3.50).applyMatrix4(matrix);
        matrix.setPosition(world.sub(position)).multiply(headFromBind);
        opening.copy(headParent.matrixWorld).invert().multiply(matrix).decompose(position,turn,scale);
        head.position.lerp(position,amount);
        head.quaternion.slerp(turn,amount);
        head.updateMatrix();
        head.updateWorldMatrix(false,false);
        headActive=true;
      }
      jawParent.updateWorldMatrix(true,false);
      opening.makeRotationY(T.MathUtils.degToRad(6 + 30 * T.MathUtils.clamp(amount,0,1)));
      matrix.copy(jawParent.matrixWorld).invert().multiply(head.matrixWorld).multiply(headToBind)
        .multiply(hinge).multiply(opening).multiply(fromHinge).multiply(jawFromBind)
        .decompose(jaw.position,jaw.quaternion,jaw.scale);
      jaw.updateMatrix();
      jawActive = true;
    }
  };
}
