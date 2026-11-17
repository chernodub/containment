import * as T from 'three';
import type {OriginalKitInstance, OriginalKitPack} from './OriginalShipKitAssets';

/** Small, grounded aftermath compositions; presentation only, never navigation solids. */
export function dress13EarlyIncidents(id: string): OriginalKitInstance[] {
  const pieces: OriginalKitInstance[] = [];
  const put = (asset: string, x: number, z: number, angle = 0, scale: [number, number, number] = [1,1,1], y = 0, pack: OriginalKitPack = 'p11-service') => {
    pieces.push({pack, asset, purpose: 'DRESS13 / ' + id + ' / ' + asset, cutaway: false,
      matrix: new T.Matrix4().compose(new T.Vector3(x / 32,y,z / 32),
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(...scale))});
  };
  if (id === 'residential-gallery') {
    // Evacuation stopped at the north cabin: the existing story wall owns
    // drawings and the nook owns the fallen chair; cases spill toward that nook.
    put('service-transit-case',548,267,-.24,[1.2,.55,1]);
    put('service-transit-case',574,288,.32,[.85,.45,.8]);
    put('deck-access-panel',548,254,-.24,[.54,1,.38],.24,'clinical');
    put('deck-rubber-panel',560,286,.7,[.25,.8,.22],.015,'clinical');
    put('service-safety-rail',775,252,.23,[1,.65,1]);
    put('service-cable-tray',768,261,1.5,[.5,.5,.7]);
    put('deck-access-panel',753,272,-.5,[.34,1,.2],.025,'clinical');
  }
  if (id === 'awakening-bay') {
    // Release debris and a dropped recovery kit below the forced-open berths.
    put('service-transit-case',603,339,-.35,[.75,.5,.7]);
    put('deck-access-panel',617,330,.55,[.32,1,.25],.02,'clinical');
    for (let i=0;i<6;i++) put('deck-rubber-panel',620+(i%2?7:-7)+i*4,350+i*8,.25,[.07,.35,.12],.002,'clinical');
  }
  return pieces;
}
