import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

/** Brood masses borrow existing shield/cabinet solids; no new collision owners. */
export function dress13GatePlacements(id: string): OriginalKitInstance[] {
  const pieces: OriginalKitInstance[] = [];
  const add = (asset: string, x: number, z: number, yaw = 0, scale = 1, y = 0, pitch = 0) => {
    pieces.push({pack: 'p11-brood', asset: 'brood-' + asset,
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32, asset.startsWith('creep') && asset !== 'creep-wall' ? .024 : y, z / 32),
        new T.Quaternion().setFromEuler(new T.Euler(pitch, yaw, 0, 'YXZ')), new T.Vector3(scale, asset.startsWith('creep') && asset !== 'creep-wall' ? .015 : asset.startsWith('web') ? scale * .22 : scale, scale)),
      purpose: 'DRESS13 / architecture under pressure / ' + asset,
      // Resin stays beneath the actor value range; source atlas and shaders remain shared.
      surfaceGain: asset.startsWith('creep') ? .55 : asset.startsWith('web') ? .7 : 1,
      cutaway: asset === 'creep-wall' || !asset.startsWith('creep'), castShadow: !asset.startsWith('creep'),
    });
  };
  if (id === 'shielding-gate') {
    // Both colonies stand on the deck in front of the inner shield faces.
    // The middle crossing and the west entry lane receive no floor crust.
    add('nest-medium', 430, 383, 0, .9);
    add('burst-duct', 310, 370, .35, .55);
    add('consumed-shell', 490, 365, .1, .7);
    add('pods-small', 350, 385, .4, .65);
    add('creep-c', 420, 355, .05, .5);
    add('creep-a', 350, 353, -.3, .45);
    add('creep-wall', 432, 341, 0, .9, .55, Math.PI / 2);
    pieces[pieces.length-1].surfaceGain = .85;
    add('nest-medium', 976, 553, Math.PI, .75);
    add('creep-c', 972, 606, Math.PI, .35);
    add('creep-wall', 979, 619, Math.PI, .45, .25, Math.PI / 2);
    pieces[pieces.length-1].matrix.scale(new T.Vector3(2,1,1));
    pieces[pieces.length-1].surfaceGain = .85;
    // Short angled membranes terminate on a nest crown and cabinet shoulder.
    add('web-short', 425, 366, -.18, 1.05, 1.55, .55);
    add('web-short', 950, 587, -.75, 1.05, 1.55, -.45);
  }
  if (id === 'containment-annulus') {
    // Narrow wall-foot crust leaves at least 140 units of each ring lane clean.
    // The former broad scallops across the ring and roof-top shell are retired.
    for (const z of [149, 891]) {
      const south = z > 520;
      for (const [i,x] of [250,360,475,590,710,830,950,1070,1190].entries()) {
        add(i % 2 ? 'creep-c' : 'creep-a', x, z, (south ? Math.PI : 0) + (i % 3 - 1) * .12, .32);
        if (i % 2 === 0) {
          add('creep-wall', x, south ? 899 : 141,
            south ? Math.PI : 0, .45, .25, Math.PI / 2);
          // The shielding housing is .902m tall: keep the climb below its cap.
          pieces[pieces.length-1].matrix.scale(new T.Vector3(2.3,1,1));
          pieces[pieces.length-1].surfaceGain = 1;
        }
      }
    }
    add('burst-duct', 1128, 156, .1, .35);
    add('burst-duct', 1128, 884, Math.PI + .1, .35);
    add('pods-hatched', 1198, 160, .5, .35);
    add('pods-hatched', 1198, 880, -.5, .35);
    for (const [z,yaw] of [[164,.2],[876,Math.PI+.2]]) {
      pieces.push({pack:'p11-service',asset:'service-console-schematic',
        purpose:'DRESS13 / annulus consumed wall-foot console',cutaway:true,
        matrix:new T.Matrix4().compose(new T.Vector3(1080/32,0,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(.32,.32,.32))});
      add('consumed-shell', 1080, z, yaw, .45);
    }
    // Shell-to-duct webs follow the wall lip, never bridge the walking ring.
    const link = (ax:number, az:number, ay:number, bx:number, bz:number, by:number) => {
      add('web-short',ax,az);
      const from=new T.Vector3(ax/32,ay,az/32), gap=new T.Vector3(bx/32,by,bz/32).sub(from);
      pieces[pieces.length-1].matrix.compose(from,
        new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),gap.clone().normalize())
          .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.55)),
        new T.Vector3(gap.length()/1.5,.35,.6));
    };
    link(1080,164,.6,1128,156,.24);
    link(1128,884,.24,1080,876,.6);
  }
  if (id === 'manual-control-chamber') {
    // Swallowed service consoles stand on the deck before the cabinet faces.
    // Their small root patches stay at the cabinet foot, off the core floor.
    for (const x of [254, 352, 926, 1024]) {
      pieces.push({pack:'p11-service',asset:'service-console-schematic',
        purpose:'DRESS13 / swallowed floor console',cutaway:true,
        matrix:new T.Matrix4().compose(new T.Vector3(x/32,0,315/32),new T.Quaternion(),new T.Vector3(.55,.55,.5))});
      add('consumed-shell', x, 315, 0, .65);
      add('creep-c', x, 289, .1, .38);
      add('creep-wall', x, 281, 0, .45, .25, Math.PI / 2);
      pieces[pieces.length-1].matrix.scale(new T.Vector3(2,1,1));
      pieces[pieces.length-1].surfaceGain = 1;
    }
    // The nest stands beside the cost-desk's west face, not on its roof.
    // This puts the complete body inside the south-gallery inspection camera.
    add('nest-large', 480, 900, -Math.PI / 2, .55);
    add('creep-c', 490, 930, -Math.PI / 2, .35);
    add('creep-wall', 509, 940, -Math.PI / 2, .45, .25, Math.PI / 2);
    pieces[pieces.length-1].matrix.scale(new T.Vector3(2,1,1));
    pieces[pieces.length-1].surfaceGain = 1;
    add('burst-duct', 1068, 315, .6, .5);
    add('pods-hatched', 345, 322, .4, .45);
    // Paired angled membranes join the console tops; no room-wide span.
    add('web-medium', 254, 315, .02, 1, .85, .65);
    add('web-medium', 926, 315, -.02, 1, .85, -.65);
  }
  return pieces;
}
