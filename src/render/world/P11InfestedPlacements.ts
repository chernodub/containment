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
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32, /^brood-creep-[abc]$/.test(asset) ? .024 : y, z / 32),
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, /^brood-creep-[abc]$/.test(asset) ? .015 : scale, scale)),
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
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32, /^brood-creep-[abc]$/.test(asset) ? .024 : y, z / 32),
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), angle), new T.Vector3(scale, /^brood-creep-[abc]$/.test(asset) ? .015 : scale, scale)),
      cutaway: asset === 'brood-creep-wall' || !asset.startsWith('brood-creep'), castShadow: !asset.startsWith('brood-creep'),
      surfaceGain: asset.startsWith('brood-creep') ? .6 : 1,
    });
    // Recreate the modeller's wall-backed group on the actual registered bank
    // face (z340), with a clear 140-unit east/west lane at z450..590.
    brood('brood-hive-heart', 470, 610, .65);
    brood('brood-nest-large', 300, 375, .8);
    brood('brood-consumed-shell', 220, 392, 1.05, 0, .3);
    brood('brood-nest-large', 900, 375, .8);
    brood('brood-consumed-shell', 975, 392, .85);
    brood('brood-nest-medium', 250, 831, .8, 0, Math.PI);
    brood('brood-burst-duct', 370, 399, .55);
    brood('brood-pods-large', 210, 620, .65);
    brood('brood-pods-hatched', 360, 407, .6);
    brood('brood-pods-small', 965, 410, .65);
    // Small ragged fringes connect each mass to its wall; no free deck fields.
    for (const [x,z,a] of [[255,365,.3],[335,386,.7],[210,640,1.4],[885,365,2.8],[950,385,1.3],[450,650,.4]]) {
      brood('brood-creep-c',x,z,.46,.002,a);
    }
    for (const [x,z,a] of [[300,341,0],[900,341,0]]) {
      brood('brood-creep-wall',x,z,1.15,.65,a);
      result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-Math.PI/2));
    }
    // Anchors terminate on the bank and adjacent nest crown, never bare deck.
    const web=(x:number,z:number,bx:number,bz:number,y:number)=>{
      const dx=(bx-x)/32,dz=(bz-z)/32;
      brood('brood-web-short',x,z,1,y,-Math.atan2(dz,dx));
      result[result.length-1].matrix.scale(new T.Vector3(Math.hypot(dx,dz)/1.5,.25,.55));
      result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(.6));
    };
    web(230,341,282,375,2.6); web(345,341,315,375,2.5);
    web(945,341,908,375,2.6);
  }
  if (id === 'overload-floor') {
    const dead = (asset: string, x: number, z: number, scale = 1, angle = 0, y = 0) => result.push({
      pack: 'p11-brood', asset, purpose: 'DRESS13 / heat-killed perimeter / ' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x/32,/^brood-creep-[abc]$/.test(asset) ? .024 : y,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(scale,/^brood-creep-[abc]$/.test(asset) ? .015 : scale,scale)),
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
      matrix:new T.Matrix4().compose(new T.Vector3((x+dx)/32,asset.startsWith('brood-creep') ? .024 : .002,(z+dz)/32),new T.Quaternion(),new T.Vector3(scale,asset.startsWith('brood-creep') ? .015 : scale,scale)),cutaway:false,castShadow:false,surfaceGain:.65,
    });
  }
  return result;
}
