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
    brood('brood-consumed-shell',650,330,1.1);
    // The ruptured duct and second carriage form a continuous bank ending at
    // the original mill. The forward edge stays north of the combat circle.
    result.push({pack:'p11-inc13-workshop',asset:'swallowed-workbay',purpose:'INC13 / infested extraction line',
      cutaway:false,matrix:new T.Matrix4().makeRotationY(-.08).setPosition(515/32,0,325/32)});
    brood('brood-creep-b',489,343,.87,.024,.48);
    brood('brood-creep-a',553,351,.88,.024,-.28);
    brood('brood-creep-c',609,344,.77,.024,1.32);
    brood('brood-pods-small',565,339,.55,0,.72);
    // The active tool workbay is x584..876: use its visible right inner
    // partition, rather than the untoured lathe bay or the far roofline.
    result.push({pack:'clinical',asset:'clinical-testbench',purpose:'DRESS13 / rear workbay machine',cutaway:true,
      matrix:new T.Matrix4().compose(new T.Vector3(826/32,0,165/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-Math.PI/2),new T.Vector3(.8,.8,.8))});
    brood('brood-consumed-shell',826,165,.85,0,-Math.PI/2);
    brood('brood-burst-duct',853,230,.5);
    brood('brood-nest-medium',861,100,.7,0,-Math.PI/2);
    brood('brood-pods-small',835,240,.6);
    for(const [x,z,a] of [[860,110,.5],[860,170,1.2],[860,230,2.1]]) brood('brood-creep-c',x,z,.4,.002,a);
    brood('brood-creep-wall',875,160,.85,.5,-Math.PI/2);
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    brood('brood-web-short',875,130,1,1.3,-Math.atan2(35,-49));
    result[result.length-1].matrix.scale(new T.Vector3(Math.hypot(49,35)/48,.22,.55));
    result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(.65));
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
    // face (z340), keeping the crossing bare between the banks and heart.
    brood('brood-hive-heart', 470, 620, .65);
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
      brood('brood-creep-wall',x,z,.55,.15,a);
      result[result.length-1].matrix.scale(new T.Vector3(2,1,1));
      result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    }
    // Measured plenum tops (1.81m) to nest crowns: real sloping anchors.
    for (const [x,y,z,bx,by,bz] of [[235,1.75,365,285,2.5,375],[355,1.75,365,315,2.4,375],[955,1.75,365,908,2.5,375]]) {
      const gap=new T.Vector3((bx-x)/32,by-y,(bz-z)/32);
      brood('brood-web-short',x,z,1,y);
      result[result.length-1].matrix.compose(new T.Vector3(x/32,y,z/32),
        new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),gap.clone().normalize())
          .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.6)),
        new T.Vector3(gap.length()/1.5,.25,.55));
    }
  }
  if (id === 'overload-floor') {
    const dead = (asset: string, x: number, z: number, scale = 1, angle = 0, y = 0) => result.push({
      pack: 'p11-brood', asset, purpose: 'DRESS13 / heat-killed perimeter / ' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x/32,/^brood-creep-[abc]$/.test(asset) ? .024 : y,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(scale,/^brood-creep-[abc]$/.test(asset) ? .015 : scale,scale)),
      surfaceGain: .42, emissionGain: .16, cutaway: asset === 'brood-creep-wall' || !asset.startsWith('brood-creep'), castShadow: false,
    });
    result.push({pack:'clinical',asset:'cryo-service-console',purpose:'DRESS13 / scorched gantry machine',cutaway:true,
      matrix:new T.Matrix4().compose(new T.Vector3(970/32,0,240/32),new T.Quaternion(),new T.Vector3(.7,.7,.7))});
    dead('brood-consumed-shell',970,240,.8);
    dead('brood-nest-large',1020,238,.75);
    dead('brood-nest-large',780,664,.55);
    dead('brood-burst-duct',1080,265,.55);
    dead('brood-pods-hatched',860,700,.6);
    for(const [x,z,a] of [[1020,213,.3],[1060,225,.7],[780,650,2],[815,654,2.7]]) dead('brood-creep-c',x,z,.4,a);
    for(const [x,z,a] of [[1020,201,0],[780,641,0]]) {
      dead('brood-creep-wall',x,z,.6,a,.2);
      result[result.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    }
    // Sloping, short wall-to-crown sheets; each endpoint has real support.
    for(const [x,y,z,bx,by,bz] of [[986,1.5,201,1020,2.35,238],[800,.85,641,780,1.7,664]]) {
      const gap=new T.Vector3((bx-x)/32,by-y,(bz-z)/32);
      dead('brood-web-short',x,z,1,0,y);
      result[result.length-1].matrix.compose(new T.Vector3(x/32,y,z/32),
        new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),gap.clone().normalize())
          .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.6)),
        new T.Vector3(gap.length()/1.5,.3,.5));
    }
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
