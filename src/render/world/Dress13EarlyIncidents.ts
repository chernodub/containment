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
  if (id === 'passenger-vault') {
    // Empty personal-effects drawer is authored in the carrier; its contents
    // have fallen into the bank's front edge rather than the entry fight lane.
    put('service-transit-case',446,343,.4,[.5,.32,.5]);
    put('service-transit-case',472,341,-.6,[.35,.25,.4]);
    put('deck-access-panel',439,355,.35,[.13,.5,.18],.005,'clinical');
    put('deck-access-panel',456,361,-.35,[.12,.5,.16],.005,'clinical');
    put('deck-rubber-panel',475,355,.8,[.18,.4,.2],.004,'clinical');
    put('security-sign-05',424,327,0,[.28,.35,1],.55,'security');
  }
  if (id === 'communal-atrium') {
    // A failed dining barricade gathers on the conservatory's east foot.
    for (const [x,z,a] of [[678,365,.25],[698,395,-.3]]) {
      put('habitation-desk',x,z,a,[.85,.85,.85],.82,'clinical');
      pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationZ(Math.PI/2));
    }
    put('security-bench',662,394,-.55,[.7,.6,.7],.3,'security');
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    put('service-transit-case',650,379,.7,[.65,.5,.65]);
    put('deck-rubber-panel',641,390,.4,[.4,.5,.25],.003,'clinical');
    put('deck-rubber-panel',659,409,-.3,[.3,.5,.4],.003,'clinical');
    put('deck-access-panel',685,415,.8,[.25,.5,.3],.006,'clinical');
  }
  if (id === 'crew-checkpoint') {
    // The north inspection conveyor was abandoned with baggage still aboard.
    put('service-transit-case',340,104,-.18,[.8,.7,.8],.82);
    put('service-transit-case',368,106,.23,[.65,.65,.65],.82);
    put('service-transit-case',393,121,.8,[.8,.55,.8]);
    put('service-cable-tray',405,127,.4,[.5,.4,.65]);
    put('deck-rubber-panel',389,147,.35,[.65,.35,.32],.003,'clinical');
    for (let i=0;i<4;i++) put('deck-access-panel',399+i*7,143+(i%2)*9,i*.7,[.028,.3,.06],.004,'clinical');
  }
  if (id === 'armory') {
    // Half-closed magazine shutters and an abandoned issue case sit north
    // of the carousel, leaving the southern issue-court fight circle clean.
    for (const x of [572,628]) {
      put('deck-access-panel',x,246,0,[.85,1,1],2.4,'clinical');
      pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    }
    put('service-transit-case',526,420,-.35,[1.2,.4,.8]);
    put('deck-access-panel',508,409,-.65,[.48,1,.3],.03,'clinical');
    put('deck-rubber-panel',532,438,.3,[.35,.3,.22],.003,'clinical');
    put('service-cable-tray',541,425,.9,[.3,.3,.4]);
    put('deck-access-panel',516,442,.6,[.035,.3,.08],.005,'clinical');
  }
  return pieces;
}
