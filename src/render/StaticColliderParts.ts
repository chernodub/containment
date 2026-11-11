import type * as T from 'three';

/** Borrowed collision geometry and its transform relative to the render mesh. */
export type StaticColliderPart = Readonly<{
  geometry: T.BufferGeometry;
  matrix: T.Matrix4;
  name: string;
}>;

const partsByMesh = new WeakMap<T.Mesh, readonly StaticColliderPart[]>();

/** Keep physics partitions independent of visual batching without serializing GPU resources. */
export function setStaticColliderParts(mesh: T.Mesh, parts: readonly StaticColliderPart[]): void {
  partsByMesh.set(mesh, parts);
}

/** The collision owner borrows these immutable inputs; it must never dispose them. */
export function getStaticColliderParts(mesh: T.Mesh): readonly StaticColliderPart[] | undefined {
  return partsByMesh.get(mesh);
}
