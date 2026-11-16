import * as T from 'three';
import type { OriginalKitInstance } from './OriginalShipKitAssets';

/** Sculptural growth stays on solid machinery/duct banks, outside the fight circle. */
export function p11InfestedPlacements(id: string): OriginalKitInstance[] {
  const result: OriginalKitInstance[] = [];
  const add = (asset: string, x: number, z: number, scale: number, y = 0, angle = 0) => result.push({
    pack: 'p11-infested', asset,
    matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32),
      new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, scale, scale)),
    purpose: 'P11 / living machinery / ' + asset, cutaway: true,
  });
  if (id === 'infested-workshop') {
    add('engulfed-milling-machine', 610, 266, 1, 0, Math.PI / 2);
    result[result.length - 1].matrix.scale(new T.Vector3(1, 1, .65));
    result[result.length - 1].cutaway = false; // Grounded shallow wall-backed machine, not overhead.
    add('engulfed-repair-bench', 250, 900, .85);
    add('root-saddle', 350, 930, 1);
    add('egg-clutch', 190, 850, 1);
  }
  if (id === 'swarm-junction') {
    add('ruptured-brood-plenum', 292, 235, 2);
    add('root-saddle', 900, 285, 2);
    add('egg-clutch', 870, 300, 2);
    add('resin-web', 950, 260, 2.5, 1);
  }
  return result;
}
