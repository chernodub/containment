import * as T from 'three';
import type { OriginalKitInstance } from './OriginalShipKitAssets';

/** Tall takeover pieces stay outside the fight circle; shallow crust remains walkable. */
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
    const brood = (asset: string, x: number, z: number, scale = 1, y = 0, angle = 0) => result.push({
      pack: 'p11-brood', asset, purpose: 'DRESS13 / rear workbay takeover / ' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32),
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, scale, scale)),
      cutaway: asset === 'brood-creep-wall' || !asset.startsWith('brood-creep'), castShadow: !asset.startsWith('brood-creep'),
      surfaceGain: asset.startsWith('brood-creep') ? .6 : 1,
    });
    brood('brood-consumed-shell',650,330,1.3);
    brood('brood-consumed-shell',250,900,1.2);
    brood('brood-burst-duct',860,95,.85);
    brood('brood-nest-medium',930,40,1);
    brood('brood-pods-small',850,125,.85);
    for(const [x,z,a] of [[850,80,.5],[900,90,1.2],[960,110,2.1],[250,865,.8],[650,345,0]]) {
      brood('brood-creep-a',x,z,1.1,.002,a);
      brood('brood-creep-c',x+35,z-15,1,.003,a+.5);
    }
    brood('brood-creep-wall',880,2,1.6,.5,0);
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-Math.PI/2));
    brood('brood-web-short',850,65,1,1.6,0);
  }
  if (id === 'swarm-junction') {
    // Front inner edge of the attached north duct bank, wholly inside its chamfer.
    // The authored Brood kit replaces the thin plenum growth.
    const brood = (asset: string, x: number, z: number, scale = 1, y = 0, angle = 0) => result.push({
      pack: 'p11-brood', asset, purpose: 'DRESS13 / stronghold / ' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32, y, z / 32),
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, scale, scale)),
      cutaway: asset === 'brood-creep-wall' || !asset.startsWith('brood-creep'), castShadow: !asset.startsWith('brood-creep'),
      surfaceGain: asset.startsWith('brood-creep') ? .6 : 1,
    });
    // The heart owns the east crossing shoulder, beyond the fight circle.
    // Nests back onto duct-bank faces; the heart leaves the lower crossing open.
    brood('brood-hive-heart', 815, 470, .8);
    brood('brood-nest-large', 300, 222);
    brood('brood-nest-large', 900, 818, 1, 0, Math.PI);
    brood('brood-nest-medium', 950, 225, 1, 0, .15);
    brood('brood-nest-medium', 240, 815, 1, 0, Math.PI);
    brood('brood-burst-duct', 920, 275, .85);
    brood('brood-consumed-shell', 300, 195, 1.3);
    brood('brood-consumed-shell', 900, 845, 1.3, 0, Math.PI);
    brood('brood-pods-large', 225, 270, .85);
    brood('brood-pods-small', 970, 770);
    brood('brood-pods-hatched', 475, 865);
    for (const [x,z,a] of [[300,390,.3],[360,405,.7],[240,450,1.4],[900,780,2.6],[840,770,2.8],[970,710,1.3],[550,890,.4],[620,880,1.2],[680,930,2.1],[920,420,.8]]) {
      brood('brood-creep-a', x, z, 1.2, .002, a);
      brood('brood-creep-c', x + 38, z + 18, 1.1, .003, a + .7);
    }
    // The registered north banks advance to z340. Spread shallow crust on
    // the exposed approaches and southern floor, instead of below those banks.
    const floorPatches = [[280,440],[280,570],[280,700],[430,660],[580,660],[730,660],
      [880,660],[920,440],[920,570],[920,700],[430,805],[600,805],[770,805],[920,805],[540,180],[650,260]];
    for (const [i,[x,z]] of floorPatches.entries()) {
      brood(i % 3 === 1 ? 'brood-creep-b' : 'brood-creep-a',x,z,1,.002,(i%3-1)*.08);
      result[result.length-1].matrix.scale(new T.Vector3(2.5,.3,2.5));
      result[result.length-1].surfaceGain = .38;
    }
    for (const [x,z,a] of [[300,430,0],[900,859,Math.PI]]) {
      brood('brood-creep-wall',x,z,1.7,.7,a);
      result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-Math.PI/2));
    }
    // Two doorway-top membranes: anchors land on the north/south plenum mouths.
    brood('brood-web-long',440,320,2,2.8,0);
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(.65));
    result[result.length-1].matrix.scale(new T.Vector3(1,.15,.3));
    brood('brood-web-long',760,720,2,2.8,Math.PI);
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(.65));
    result[result.length-1].matrix.scale(new T.Vector3(1,.15,.3));
  }
  if (id === 'overload-floor') {
    const dead = (asset: string, x: number, z: number, scale = 1, angle = 0, y = 0) => result.push({
      pack: 'p11-brood', asset, purpose: 'DRESS13 / heat-killed perimeter / ' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x/32,y,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(scale,scale,scale)),
      surfaceGain: .42, emissionGain: .16, cutaway: asset === 'brood-creep-wall' || !asset.startsWith('brood-creep'), castShadow: false,
    });
    dead('brood-nest-large',1020,245,.85);
    dead('brood-nest-large',1010,850,.85,Math.PI);
    dead('brood-consumed-shell',850,160,1.2);
    dead('brood-burst-duct',1060,300,.7);
    dead('brood-pods-hatched',1060,785,.8);
    for(const [x,z,a] of [[1000,290,.3],[1060,345,.7],[1050,790,2],[980,830,2.7],[850,235,0],[700,855,1]]) {
      dead('brood-creep-c',x,z,1.2,a);
      dead('brood-creep-a',x-35,z+12,1,a+.6);
    }
    dead('brood-web-long',920,200,1.2,0,3.4);
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(.7));
  }
  if (id === 'freight-hold' || id === 'breached-loading-bay') {
    const x = id === 'freight-hold' ? 1150 : 215, z = id === 'freight-hold' ? 125 : 265;
    for(const [asset,dx,dz,scale] of [['brood-burst-duct',0,0,.55],['brood-creep-c',-12,25,.65]] as const) result.push({
      pack:'p11-brood',asset,purpose:'DRESS13 / first trace / '+asset,
      matrix:new T.Matrix4().compose(new T.Vector3((x+dx)/32,.002,(z+dz)/32),new T.Quaternion(),new T.Vector3(scale,scale,scale)),cutaway:false,castShadow:false,surfaceGain:.65,
    });
  }
  return result;
}
