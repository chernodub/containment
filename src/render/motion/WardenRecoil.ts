import * as T from 'three';

/** Pose the bite in the chest's fitted model space, around the modeled neck joint. */
export function wardenRecoil(root: T.Object3D) {
  let skin: T.SkinnedMesh | undefined;
  root.traverse(node => { if (!skin && node instanceof T.SkinnedMesh) skin = node; });
  if (!skin) return;
  const {skeleton, bindMatrix} = skin;
  const bone = (name: string) => skeleton.bones.find(b => b.name === name);
  const neck = bone('neck'), head = bone('head'), jaw = bone('jaw'), chest = bone('chest');
  if (!neck?.parent || !head?.parent || !jaw?.parent || !chest) return;
  const toJoint = (b: T.Bone) => skeleton.boneInverses[skeleton.bones.indexOf(b)].clone().multiply(bindMatrix);
  const chestBind = toJoint(chest), headBind = toJoint(head);
  const fromHead = headBind.clone().invert(), fromJaw = toJoint(jaw).invert(), fromNeck = toJoint(neck).invert();
  const joints = [neck, head, jaw], saved = joints.map(() => new T.Matrix4());
  const chestFrame = new T.Matrix4(), target = new T.Matrix4(), inverse = new T.Matrix4();
  const position = new T.Vector3(), rotation = new T.Quaternion(), scale = new T.Vector3();
  const forward = new T.Vector3(), side = new T.Vector3(), up = new T.Vector3();
  const collar = new T.Vector3(3.10,0,3.26), hinge = new T.Vector3(3.90,0,3.50);
  const pivot = (m: T.Matrix4, p: T.Vector3) => m.setPosition(position.copy(p).sub(side.copy(p).applyMatrix4(m)));
  let active = false;
  function applyWorld(b: T.Bone, world: T.Matrix4, amount: number) {
    target.copy(b.parent!.matrixWorld).invert().multiply(world).decompose(position,rotation,scale);
    b.position.lerp(position,amount);
    b.quaternion.slerp(rotation,amount);
    b.updateMatrix();
    b.updateMatrixWorld(true);
  }
  const pose = new T.Matrix4();
  return {
    release() {
      if (!active) return;
      joints.forEach((b,i) => { saved[i].decompose(b.position,b.quaternion,b.scale); b.updateMatrix(); });
      active = false;
    },
    apply(amount: number, marineBearing: number) {
      joints.forEach((b,i) => { b.updateMatrix(); saved[i].copy(b.matrix); });
      active = true;
      head.updateWorldMatrix(true,false);
      if (amount > 0) {
        chestFrame.multiplyMatrices(chest.matrixWorld,chestBind);
        // Cancel the clip's neck throw at full recoil. The cervical sleeve stays
        // carried by the shoulder girdle while the skull turns at its far end.
        applyWorld(neck,pose.multiplyMatrices(chestFrame,fromNeck),amount);
        inverse.copy(chestFrame).invert();
        forward.set(-.134*Math.cos(marineBearing),.98,-.134*Math.sin(marineBearing)).transformDirection(inverse);
        side.set(1,0,0).transformDirection(inverse);
        side.addScaledVector(forward,-side.dot(forward)).normalize();
        if (chestFrame.determinant()<0) side.negate();
        up.crossVectors(forward,side);
        pose.makeBasis(forward,side,up);
        pivot(pose,collar);
        pose.premultiply(chestFrame).multiply(fromHead);
        applyWorld(head,pose,amount);
      }
      pose.makeRotationY(T.MathUtils.degToRad(6+70*T.MathUtils.clamp(amount,0,1)));
      pivot(pose,hinge);
      pose.premultiply(headBind).premultiply(head.matrixWorld).multiply(fromJaw);
      applyWorld(jaw,pose,1);
    }
  };
}
