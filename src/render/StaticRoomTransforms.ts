import type { Object3D } from 'three';

const frozen = new WeakSet<Object3D>();

/** Freeze an authored static hierarchy; explicit forced refreshes still traverse it. */
export function freezeStaticRoom(root: Object3D): void {
  root.updateMatrixWorld(true);
  root.traverse(object => { object.matrixAutoUpdate = false; });
  if (frozen.has(root)) return;
  frozen.add(root);
  const update = root.updateMatrixWorld;
  // Room roots are identity and all room animation is uniform-only. The normal
  // scene walk can skip this entire branch. Late asset arrivals call this API
  // again before rendering, and recovery/preparation explicitly force a refresh.
  root.updateMatrixWorld = function(force?: boolean): void {
    if (force) update.call(this, true);
  };
}
