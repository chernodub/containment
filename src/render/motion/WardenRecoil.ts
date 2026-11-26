import * as T from 'three';

/** Clear the near shoulder when the ram recoils toward the fixed +Z camera.
 * Moving the common neck retains the open hinge between the head and jaw. */
export function wardenRecoil(root: T.Object3D) {
  const neck = root.getObjectByName('neck');
  if (!neck?.parent) return;
  const parent = neck.parent;
  const start = new T.Vector3(), end = new T.Vector3(), original = new T.Vector3();
  let active = false;
  return {
    release() {
      if (!active) return;
      neck.position.copy(original);
      neck.updateMatrix();
      active = false;
    },
    apply(amount: number) {
      const exposure = amount * T.MathUtils.smoothstep(Math.cos(root.rotation.y), -.10, .65);
      if (exposure <= 0) return;
      const side = Math.sin(root.rotation.y) >= 0 ? 1 : -1;
      neck.getWorldPosition(start);
      end.set(.48 * side, .61, .38).multiplyScalar(exposure).add(start);
      parent.worldToLocal(start);
      parent.worldToLocal(end);
      original.copy(neck.position);
      neck.position.add(end.sub(start));
      neck.updateMatrix();
      active = true;
    }
  };
}
