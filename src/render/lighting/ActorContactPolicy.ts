import * as T from 'three';
const configured = new WeakSet<T.Object3D>();
/** Actor geometry contributes only the existing soft ground contacts.
 * Architecture owns the shadow atlas; pooled actor identities are configured once. */
export function useActorContactShadows(root: T.Object3D, reborrow = false): void {
  if (!reborrow && configured.has(root)) return;
  configured.add(root);
  root.traverse(object => { if (object instanceof T.Mesh) object.castShadow = false; });
}
