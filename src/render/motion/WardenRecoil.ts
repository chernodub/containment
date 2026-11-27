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
  const position = new T.Vector3(), scale = new T.Vector3();
  const turn = new T.Quaternion();
  const {skeleton,bindMatrix}=skin;
  const supports = ['shoulderr','shoulderl'].flatMap((name,i) => {
    const bone=skeleton.bones.find(b=>b.name.toLowerCase().replace(/[._]/g,'')===name);
    if (!bone?.parent) return [];
    const direction=new T.Vector3(0,i===0?-.26:.26,-.12).applyMatrix3(new T.Matrix3().setFromMatrix4(
      skeleton.boneInverses[skeleton.bones.indexOf(bone)].clone().multiply(bindMatrix)));
    return [{bone,direction,rest:new T.Vector3()}];
  });
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
        for(const {bone,rest} of supports){bone.position.copy(rest);bone.updateMatrix();}
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
      const rear = T.MathUtils.smoothstep(Math.cos(root.rotation.y), -.10, .65);
      const exposure = amount;
      if (exposure > 0) {
        const side = Math.sin(root.rotation.y) >= 0 ? 1 : -1;
        head.updateWorldMatrix(true, false);
        world.copy(cheek).applyMatrix4(head.matrixWorld);
        neck.worldToLocal(local.copy(world));
        // The backward-slumped neck lies behind the near pauldron on this
        // approach. Carry the cheek around its outside edge with the recoil.
        target.set((.48+.50*rear) * side, .68, .34).multiplyScalar(exposure).add(world);
        parent.worldToLocal(target);
        parent.getWorldQuaternion(rotation).invert();
        axis.set(0, 1, 0).applyQuaternion(rotation).normalize();
        original.copy(neck.position);
        originalRotation.copy(neck.quaternion);
        neck.quaternion.premultiply(rotation.setFromAxisAngle(axis, -.70 * side * rear * exposure));
        neck.updateMatrix();
        neck.position.add(target.sub(local.applyMatrix4(neck.matrix)));
        neck.updateMatrix();
        // Sampling owns bone matrices. Propagate the moved neck before using
        // the skull world matrix to solve the independent jaw joint.
        neck.updateMatrixWorld(true);
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

        forward.setFromMatrixColumn(matrix,0);
        const side = forward.x<0?-1:1;
        // The camera sits above and south of the deck. Lift the snout past
        // its sight line; the open bite bisects the skull and mandible axes.
        forward.set(.14*side,.98,.10).normalize();
        lateral.set(1,0,0).addScaledVector(forward,-forward.x).normalize();
        up.crossVectors(forward,lateral);
        if(matrix.determinant()<0)lateral.negate();
        matrix.makeBasis(forward.multiplyScalar(.53),lateral.multiplyScalar(.51),up.multiplyScalar(.56));
        position.set(3.90,0,3.50).applyMatrix4(matrix);
        matrix.setPosition(world.sub(position)).multiply(headFromBind);
        opening.copy(headParent.matrixWorld).invert().multiply(matrix);
        opening.decompose(position,turn,scale);
        matrix.compose(position,turn,scale);
        head.position.lerp(position,amount);
        head.quaternion.slerp(turn,amount);
        head.scale.lerp(scale,amount);
        head.updateMatrix();
        // Inverse of the non-uniform display fit introduces shear. Preserve
        // that affine remainder or a lifted head narrows to a vertical strip.
        for(let i=0;i<12;i++)head.matrix.elements[i]+=amount*(opening.elements[i]-matrix.elements[i]);
        head.updateMatrixWorld(true);
        for(const {bone,direction,rest} of supports){
          rest.copy(bone.position);
          position.copy(direction).applyQuaternion(bone.quaternion);
          bone.position.addScaledVector(position,amount);
          bone.updateMatrix();
        }
        headActive=true;
      }
      jawParent.updateWorldMatrix(true,false);
      opening.makeRotationY(T.MathUtils.degToRad(6 + 70 * T.MathUtils.clamp(amount,0,1)));
      matrix.copy(jawParent.matrixWorld).invert().multiply(head.matrixWorld).multiply(headToBind)
        .multiply(hinge).multiply(opening).multiply(fromHinge).multiply(jawFromBind);
      matrix.decompose(jaw.position,jaw.quaternion,jaw.scale);
      jaw.matrix.copy(matrix);
      jaw.matrixWorldNeedsUpdate=true;
      jawActive = true;
    }
  };
}
