import * as T from 'three';
import {MAX_ACTIVE_PICKUPS, PICKUP_KINDS, type PickupKind, type PickupSnapshot} from '../game/pickups/PickupSystem';
import {pickupModel} from './models';

type Draw = {
  mesh: T.InstancedMesh;
  local: T.Matrix4;
  range: {start: number; count: number};
};

/** Retained native pickup silhouettes, with one draw per occupied kind/material. */
export class PickupInstances {
  readonly root = new T.Group();
  private readonly kinds: Record<PickupKind, Draw[]> = {credits: [], health: [], armor: [], ammo: [], grenade: []};
  private readonly draws: Draw[] = [];
  private readonly pose = new T.Matrix4();
  private readonly matrix = new T.Matrix4();
  private disposed = false;

  constructor() {
    this.root.name = 'pickup-instances';
    this.root.matrixAutoUpdate = false;
    for (const kind of PICKUP_KINDS) {
      const source = pickupModel(kind);
      source.updateMatrixWorld(true);
      source.traverse(object => {
        if (!(object instanceof T.Mesh)) return;
        // pickupModel has already merged each finish into an owned geometry.
        // Transfer it directly; shared MAT finishes remain owned by meshParts.
        const mesh = new T.InstancedMesh(object.geometry, object.material, MAX_ACTIVE_PICKUPS);
        mesh.name = `${source.name}-${this.kinds[kind].length}`;
        mesh.castShadow = object.castShadow;
        mesh.receiveShadow = object.receiveShadow;
        mesh.renderOrder = object.renderOrder;
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.count = 0;
        mesh.visible = false;
        const draw = {mesh, local: object.matrixWorld.clone(), range: {start: 0, count: 0}};
        this.kinds[kind].push(draw);
        this.draws.push(draw);
        this.root.add(mesh);
      });
      source.clear();
    }
  }

  /** Match ordinary pickup placement exactly; snapshot alpha remains presentation-neutral. */
  update(snapshot: readonly PickupSnapshot[], time: number): void {
    if (this.disposed) return;
    for (const draw of this.draws) draw.mesh.count = 0;
    this.pose.makeRotationY(time * .6);
    const limit = Math.min(snapshot.length, MAX_ACTIVE_PICKUPS);
    for (let i = 0; i < limit; i++) {
      const item = snapshot[i];
      this.pose.setPosition(item.x / 32, .26 + Math.sin(time * 2 + item.id) * .07, item.y / 32);
      for (const draw of this.kinds[item.kind]) {
        this.matrix.multiplyMatrices(this.pose, draw.local);
        draw.mesh.setMatrixAt(draw.mesh.count++, this.matrix);
      }
    }
    for (const {mesh, range} of this.draws) {
      mesh.visible = mesh.count > 0;
      if (!mesh.count) continue;
      range.count = mesh.count * 16;
      // Three clears ranges on upload. Keep our record instead of allocating one per frame.
      mesh.instanceMatrix.updateRanges[0] = range;
      mesh.instanceMatrix.updateRanges.length = 1;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /** Hide every pickup while retaining the prepared GPU inventory. */
  clear(): void {
    for (const {mesh} of this.draws) { mesh.count = 0; mesh.visible = false; }
  }

  /** Release owned geometry and instance buffers, preserving shared finishes and primitives. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear();
    for (const {mesh} of this.draws) { mesh.dispose(); mesh.geometry.dispose(); }
    this.root.removeFromParent();
    this.root.clear();
  }
}
