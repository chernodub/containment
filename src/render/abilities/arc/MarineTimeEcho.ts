import { Vector3, type Object3D } from 'three';
import type { ElementKit } from '../ElementKit';

const BONES = ['hips', 'ribs', 'neck', 'head', 'upper_armL', 'forearmL', 'handL',
  'upper_armR', 'forearmR', 'handR', 'thighL', 'shinL', 'footL', 'toeL',
  'thighR', 'shinR', 'footR', 'toeR'] as const;
// Proxies retain the actual animated joint endpoints, including a split stride,
// raised/recoiling arms and torso pitch. They never borrow or mutate skin buffers.
const SECTIONS = [
  [0, 2, .46, .3], [1, 2, .55, .33], [2, 3, .27, .29],
  [4, 5, .23, .23], [5, 6, .17, .18], [7, 8, .23, .23], [8, 9, .17, .18],
  [10, 11, .23, .24], [11, 12, .19, .22], [12, 13, .22, .27],
  [14, 15, .23, .24], [15, 16, .19, .22], [16, 17, .22, .27],
] as const;

/** Fixed CPU pose storage; two delayed poses share the prepared solid batch. */
export class MarineTimeEcho {
  private root?: Object3D;
  private readonly bones: (Object3D | undefined)[] = Array(BONES.length);
  private readonly point = new Vector3();
  private valid = false;

  /** Allocate only at owner construction, never while recording an animation. */
  static pose(): Float32Array { return new Float32Array(BONES.length * 3 + 6); }

  capture(pose: Float32Array, root: Object3D | undefined, x: number, z: number,
    muzzleX: number, muzzleY: number, muzzleZ: number, angle: number): boolean {
    if (!root) return false;
    if (this.root !== root) {
      this.root = root;
      this.bones.fill(undefined);
      root.traverse(node => {
        const index = BONES.indexOf(node.name.replace(/\./g, '') as typeof BONES[number]);
        if (index >= 0) this.bones[index] = node;
      });
      this.valid = this.bones.every(Boolean);
    }
    if (!this.valid) return false;
    root.updateWorldMatrix(true, true);
    for (let i = 0; i < this.bones.length; i++) {
      this.point.setFromMatrixPosition(this.bones[i]!.matrixWorld);
      pose[i * 3] = this.point.x - x;
      pose[i * 3 + 1] = this.point.y;
      pose[i * 3 + 2] = this.point.z - z;
    }
    // This rig's foot/toe pivots coincide. Its animated foot-bone Y axis still
    // supplies the shoe direction; retain that pose instead of dropping shoes.
    for (let foot = 12; foot <= 16; foot += 4) {
      const a = foot * 3, b = (foot + 1) * 3;
      if (Math.hypot(pose[a] - pose[b], pose[a + 1] - pose[b + 1], pose[a + 2] - pose[b + 2]) >= .015) continue;
      const e = this.bones[foot]!.matrixWorld.elements, length = Math.hypot(e[4], e[5], e[6]);
      if (length < .001) continue;
      pose[b] = pose[a] + e[4] / length * .24;
      pose[b + 1] = pose[a + 1] + e[5] / length * .24;
      pose[b + 2] = pose[a + 2] + e[6] / length * .24;
    }
    const offset = BONES.length * 3;
    pose[offset] = muzzleX - x; pose[offset + 1] = muzzleY; pose[offset + 2] = muzzleZ - z;
    pose[offset + 3] = Math.cos(angle); pose[offset + 4] = 0; pose[offset + 5] = Math.sin(angle);
    return true;
  }

  draw(kit: ElementKit, pose: Float32Array, x: number, z: number, opacity: number): void {
    for (let i = 0; i < SECTIONS.length; i++) {
      if (kit.low && (i === 1 || i === 9 || i === 12)) continue;
      const [a, b, width, depth] = SECTIONS[i], ao = a * 3, bo = b * 3;
      const sx = x + pose[ao], sy = pose[ao + 1], sz = z + pose[ao + 2];
      const ex = x + pose[bo], ey = pose[bo + 1], ez = z + pose[bo + 2];
      const dx = ex - sx, dy = ey - sy, dz = ez - sz, length = Math.hypot(dx, dy, dz);
      if (length < .015) continue;
      const yaw = Math.atan2(dz, -dx), tilt = Math.acos(Math.max(-1, Math.min(1, dy / length)));
      // Broad white body, restrained violet joint rails. Actual live marine stays
      // opaque and cyan; the copied pose is a sparse, locally masked time image.
      kit.draw('solid', (sx + ex) * .5, (sy + ey) * .5, (sz + ez) * .5,
        width, length + (i === 2 ? .16 : .03), depth, i === 2 ? 0xf2ecff : 0xcfc5e9,
        opacity, yaw, tilt);
      if (!kit.low && i < 7) kit.ribbon(sx, sy, sz, ex, ey, ez, 0xb79cff, .014, opacity * .35, false);
    }
    const o = BONES.length * 3, mx = x + pose[o], my = pose[o + 1], mz = z + pose[o + 2];
    kit.ribbon(mx - pose[o + 3] * .62, my, mz - pose[o + 5] * .62,
      mx, my, mz, 0xf2ecff, .075, opacity * .85, false);
  }

  clear(): void { this.root = undefined; this.valid = false; this.bones.fill(undefined); }
}
