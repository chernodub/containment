import * as T from 'three';

/** Keep the loaded pad in world space as the actor moves over it. */
export function heavyContacts(root: T.Object3D) {
  let mesh: T.SkinnedMesh | undefined;
  root.traverse(node => {
    if (!mesh && node instanceof T.SkinnedMesh && node.name.includes('base')) mesh = node;
  });
  if (!mesh) return;
  const skin = mesh;
  const point = new T.Vector3(), target = new T.Vector3(), hinge = new T.Vector3();
  const direction = new T.Vector3(), rotation = new T.Quaternion();
  const pads = [-1, 1].flatMap(side => [true, false].flatMap(hand => {
    const suffix = side < 0 ? 'r' : 'l';
    const name = (hand ? 'shoulder' : 'footback') + suffix;
    const index = skin.skeleton.bones.findIndex(bone => bone.name.replace(/[._]/g, '') === name);
    if (index < 0) return [];
    const bindPoint = (x: number, y: number, z: number) => new T.Vector3(x, y, z)
      .applyMatrix4(skin.bindMatrix).applyMatrix4(skin.skeleton.boneInverses[index]);
    const pad = hand ? bindPoint(2.4, side * 3, 2.40) : bindPoint(-1.4, side * 1.95, .12);
    const pivot = bindPoint(hand ? .3 : -1.30, side * 1.70, (hand ? 6.90 : 3.05) / 1.8);
    return [{bone: skin.skeleton.bones[index], side, hand, pad, pivot, active: false, held: false,
      anchor: new T.Vector3(), offset: new T.Vector3(), original: new T.Quaternion()}];
  }));
  const palms = pads.filter(p => p.hand);
  root.userData.heavyPalmContacts = palms;
  let lastYaw: number | undefined, turnPhase = 0;
  return {
    turn(yaw: number) {
      const delta = yaw - (lastYaw ?? yaw);
      lastYaw = yaw;
      const angle = Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta)));
      if (angle < .001) return -1;
      turnPhase = (turnPhase + angle / 1.8) % 1;
      return turnPhase;
    },
    release() {
      // Restore the clip transform before the mixer evaluates the next pose.
      for (const p of pads) {
        if (!p.active) continue;
        p.bone.position.sub(p.offset);
        p.bone.quaternion.copy(p.original);
        p.bone.updateMatrix();
        p.active = false;
      }
    },
    reset() {
      lastYaw = undefined;
      turnPhase = 0;
      for (const p of pads) p.held = false;
    },
    apply(phase: number) {
      for (const p of pads) {
        const u = (phase + (p.side > 0 ? .5 : 0) + (p.hand ? 0 : .36)) % 1;
        if (phase < 0 || (u >= .76 && u < .85)) { p.held = false; continue; }
        const parent = p.bone.parent!;
        p.bone.updateWorldMatrix(true, false);
        point.copy(p.pad).applyMatrix4(p.bone.matrixWorld);
        if (u >= .85) {
          // Lower the incoming pad toward the deck before its anchor is taken.
          p.held = false;
          target.copy(point);
          target.y = T.MathUtils.lerp(point.y, root.position.y + .06, T.MathUtils.smoothstep(u, .85, 1));
        } else {
          if (!p.held) {
            if (u >= .58) continue;
            p.anchor.copy(point);
            p.anchor.y = root.position.y + .06;
            p.held = true;
          }
          if (Math.hypot(point.x - p.anchor.x, point.z - p.anchor.z) > 1.45) {
            p.anchor.x = point.x;
            p.anchor.z = point.z;
          }
          // Roll off the same planted point before returning to the swing arc.
          target.copy(p.anchor).lerp(point, T.MathUtils.smoothstep(u, .58, .76));
        }
        parent.worldToLocal(target);
        parent.worldToLocal(point);
        hinge.copy(p.pivot).applyMatrix4(p.bone.matrix);
        direction.subVectors(target, hinge).normalize();
        rotation.setFromUnitVectors(point.sub(hinge).normalize(), direction);
        p.original.copy(p.bone.quaternion);
        p.bone.quaternion.premultiply(rotation);
        p.bone.updateMatrix();
        point.copy(p.pad).applyMatrix4(p.bone.matrix);
        p.offset.subVectors(target, point);
        p.bone.position.add(p.offset);
        p.bone.updateMatrix();
        p.active = true;
      }
    }
  };
}
