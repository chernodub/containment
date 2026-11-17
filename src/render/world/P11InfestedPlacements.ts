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
    highDetail: asset === 'root-saddle' || asset === 'egg-clutch' || asset === 'resin-web',
  });
  if (id === 'infested-workshop') {
    add('engulfed-milling-machine', 650, 330, 1);
    // Bounds x590.70..703.82,z312.36..349.55 fit the shallow connected bed.
    result[result.length - 1].matrix.scale(new T.Vector3(.85, .75, .65));
    result[result.length - 1].cutaway = false; // Grounded shallow wall-backed machine, not overhead.
    add('engulfed-repair-bench', 250, 900, .85);
    add('root-saddle', 350, 930, 1);
    add('egg-clutch', 190, 850, 1);
  }
  if (id === 'swarm-junction') {
    // Front inner edge of the attached north duct bank, wholly inside its chamfer.
    // The authored Brood kit replaces the thin plenum growth.
    const brood = (asset: string, x: number, z: number, scale = 1, y = 0, angle = 0) => result.push({
      pack: 'p11-brood', asset, purpose: 'DRESS13 / stronghold / ' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32),
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, scale, scale)),
      cutaway: !asset.startsWith('brood-creep'), castShadow: !asset.startsWith('brood-creep'),
    });
    // The heart owns the deep south service recess, 430 units from the arena.
    // All tall growth is backed by the duct-bank faces; the crossing stays open.
    brood('brood-hive-heart', 600, 950, 1, 0, Math.PI);
    brood('brood-nest-large', 300, 222);
    brood('brood-nest-large', 900, 818, 1, 0, Math.PI);
    brood('brood-nest-medium', 950, 225, 1, 0, .15);
    brood('brood-nest-medium', 240, 815, 1, 0, Math.PI);
    brood('brood-burst-duct', 920, 275, .85);
    brood('brood-consumed-shell', 300, 195, 1.3);
    brood('brood-consumed-shell', 900, 845, 1.3, 0, Math.PI);
    brood('brood-pods-large', 225, 270, .85);
    brood('brood-pods-small', 970, 770);
    brood('brood-pods-hatched', 475, 925);
    for (const [x,z,a] of [[300,265,.3],[360,280,.7],[240,330,1.4],[900,780,2.6],[840,770,2.8],[970,710,1.3],[550,890,.4],[620,880,1.2],[680,930,2.1],[920,310,.8]]) {
      brood('brood-creep-a', x, z, 1.2, .002, a);
      brood('brood-creep-c', x + 38, z + 18, 1.1, .003, a + .7);
    }
    for (const [x,z,a] of [[300,181,0],[900,859,Math.PI]]) {
      brood('brood-creep-wall',x,z,1.7,.4,a);
      result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-Math.PI/2));
    }
    // Two doorway-top membranes: anchors land on the north/south plenum mouths.
    brood('brood-web-long',440,320,2,2.8,0);
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(.65));
    result[result.length-1].matrix.scale(new T.Vector3(1,.5,.5));
    brood('brood-web-long',760,720,2,2.8,Math.PI);
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(.65));
    result[result.length-1].matrix.scale(new T.Vector3(1,.5,.5));
  }
  return result;
}
