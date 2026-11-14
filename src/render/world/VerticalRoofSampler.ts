import * as T from 'three';

type IntersectionPolicy = T.Mesh & {_computeIntersections?: unknown};

/** Temporary CPU index for downward presentation-support probes in a static room.
 * Query meshes retain the source vertices, transforms, side and Three raycast.
 * Only irrelevant triangle indices are excluded; nothing enters the render scene.
 */
export class VerticalRoofSampler {
  private readonly cells = new Map<string, T.Mesh[]>();
  private readonly fallback: T.Object3D[] = [];
  private readonly geometries: T.BufferGeometry[] = [];
  private readonly ray = new T.Raycaster();
  private readonly origin = new T.Vector3();
  private readonly down = new T.Vector3(0, -1, 0);
  private readonly hits: T.Intersection[] = [];
  private disposed = false;
  readonly diagnostics = {sourceTriangles: 0, indexedReferences: 0, fallbackObjects: 0};

  constructor(world: T.Object3D, private readonly cellSize = 2) {
    if (!Number.isFinite(cellSize) || cellSize < .25 || cellSize > 16) throw Error('Invalid roof cell size');
    world.updateWorldMatrix(true, true);
    const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
    const fallbackRoots = new Set<T.Object3D>();
    world.traverse(object => {
      for (let parent = object.parent; parent; parent = parent.parent) if (fallbackRoots.has(parent)) return;
      const mesh = object as T.Mesh;
      if (!mesh.geometry) {
        if (object.raycast !== T.Object3D.prototype.raycast) {
          this.fallback.push(object); fallbackRoots.add(object); this.diagnostics.fallbackObjects++;
        }
        return;
      }
      const geometry = mesh.geometry, position = geometry.getAttribute('position');
      // Preserve unusual, animated, grouped and instanced raycasts verbatim.
      if (!mesh.isMesh || mesh.type !== 'Mesh' || !mesh.material || Array.isArray(mesh.material)
        || mesh.raycast !== T.Mesh.prototype.raycast || mesh.getVertexPosition !== T.Mesh.prototype.getVertexPosition
        || (mesh as IntersectionPolicy)._computeIntersections !== (T.Mesh.prototype as IntersectionPolicy)._computeIntersections
        || !position || 'isGLBufferAttribute' in position
        || (geometry.morphAttributes.position?.length ?? 0) > 0) {
        this.fallback.push(object); fallbackRoots.add(object); this.diagnostics.fallbackObjects++; return;
      }
      const index = geometry.index, count = index?.count ?? position.count;
      const start = Math.max(0, geometry.drawRange.start);
      const end = Math.min(count, geometry.drawRange.start + geometry.drawRange.count);
      const perCell = new Map<string, number[]>();
      for (let offset = start; offset < end; offset += 3) {
        const ia = index?.getX(offset) ?? offset;
        const ib = index?.getX(offset + 1) ?? offset + 1;
        const ic = index?.getX(offset + 2) ?? offset + 2;
        a.fromBufferAttribute(position, ia).applyMatrix4(mesh.matrixWorld);
        b.fromBufferAttribute(position, ib).applyMatrix4(mesh.matrixWorld);
        c.fromBufferAttribute(position, ic).applyMatrix4(mesh.matrixWorld);
        if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(a.z)
          || !Number.isFinite(b.x) || !Number.isFinite(b.y) || !Number.isFinite(b.z)
          || !Number.isFinite(c.x) || !Number.isFinite(c.y) || !Number.isFinite(c.z)) throw Error('Nonfinite roof vertex');
        this.diagnostics.sourceTriangles++;
        // Queries retain the original strict .15m threshold and at most5m roof.
        if (Math.max(a.y, b.y, c.y) < .15 - 1e-6 || Math.min(a.y, b.y, c.y) > 5 + 1e-6) continue;
        const x0 = Math.floor((Math.min(a.x, b.x, c.x) - 1e-6) / cellSize);
        const x1 = Math.floor((Math.max(a.x, b.x, c.x) + 1e-6) / cellSize);
        const z0 = Math.floor((Math.min(a.z, b.z, c.z) - 1e-6) / cellSize);
        const z1 = Math.floor((Math.max(a.z, b.z, c.z) + 1e-6) / cellSize);
        for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
          const key = `${x},${z}`;
          let indices = perCell.get(key);
          if (!indices) { indices = []; perCell.set(key, indices); }
          indices.push(ia, ib, ic); this.diagnostics.indexedReferences++;
        }
      }
      if (!perCell.size) return;
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      for (const [key, indices] of perCell) {
        const queryGeometry = new T.BufferGeometry();
        queryGeometry.setAttribute('position', position);
        queryGeometry.setIndex(indices);
        // Source-position storage is unchanged, so this conservative sphere
        // is valid for every subset and avoids rescanning all vertices per cell.
        queryGeometry.boundingSphere = geometry.boundingSphere;
        queryGeometry.boundingBox = geometry.boundingBox;
        const query = new T.Mesh(queryGeometry, mesh.material);
        query.matrixAutoUpdate = query.matrixWorldAutoUpdate = false;
        query.matrixWorld.copy(mesh.matrixWorld); query.layers.mask = mesh.layers.mask;
        const meshes = this.cells.get(key) ?? [];
        meshes.push(query); this.cells.set(key, meshes); this.geometries.push(queryGeometry);
      }
    });
  }

  /** Match the first downward Three hit strictly between .15m and ceiling. */
  heightAt(x: number, z: number, ceiling: 4 | 5): number | undefined {
    if (this.disposed) throw Error('Roof sampler already disposed');
    if (!Number.isFinite(x) || !Number.isFinite(z)) throw Error('Invalid roof probe');
    this.ray.set(this.origin.set(x, 20, z), this.down); this.hits.length = 0;
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(z / this.cellSize)}`;
    this.ray.intersectObjects(this.cells.get(key) ?? [], false, this.hits);
    this.ray.intersectObjects(this.fallback, true, this.hits);
    return this.hits.find(hit => hit.point.y > .15 && hit.point.y < ceiling)?.point.y;
  }

  /** Query-only geometries were never uploaded and never own source attributes. */
  dispose(): void {
    if (this.disposed) return;
    for (const geometry of this.geometries) geometry.dispose();
    this.geometries.length = this.fallback.length = this.hits.length = 0;
    this.cells.clear(); this.disposed = true;
  }
}
