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
    put('service-access-hatch',759,237,0,[1.6,1.8,1]);
    put('service-safety-rail',775,252,.23,[1,.65,1]);
    put('service-cable-tray',768,261,1.5,[.5,.5,.7]);
    put('deck-access-panel',753,272,-.5,[.34,1,.2],.025,'clinical');
  }
  if (id === 'awakening-bay') {
    // Release debris and a dropped recovery kit below the forced-open berths.
    put('service-transit-case',603,360,-.35,[.75,.5,.7]);
    put('deck-access-panel',617,330,.55,[.32,1,.25],.02,'clinical');

  }
  if (id === 'passenger-vault') {
    // Empty personal-effects drawer is authored in the carrier; its contents
    // have fallen into the bank's front edge rather than the entry fight lane.
    put('service-transit-case',446,369,.4,[.5,.32,.5]);
    put('service-transit-case',472,365,-.6,[.35,.25,.4]);
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

  }
  if (id === 'armory') {
    // Half-closed magazine shutters and an abandoned issue case sit north
    // of the carousel, leaving the southern issue-court fight circle clean.
    for (const x of [572,628]) {
      put('deck-access-panel',x,246,0,[.85,1,1],2.4,'clinical');
      pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    }
    put('service-transit-case',503,420,-.35,[1.2,.4,.8]);
    put('deck-access-panel',508,409,-.65,[.48,1,.3],.03,'clinical');
    put('deck-rubber-panel',532,438,.3,[.35,.3,.22],.003,'clinical');
    put('service-cable-tray',506,438,.9,[.3,.3,.4]);
    put('deck-access-panel',516,442,.6,[.035,.3,.08],.005,'clinical');
  }
  return pieces;
}

/** Flush marks and tiny debris use the room owner's disposal/warmup lifecycle. */
export function addDress13EarlyDetails(root: T.Group, id: string): void {
  if (!['residential-gallery','awakening-bay','passenger-vault','communal-atrium','crew-checkpoint','armory'].includes(id)) return;
  const group = new T.Group(); group.name = 'dress13-early-aftermath';
  const material = (name: string, color: number, metalness = 0) => {
    const m = new T.MeshStandardMaterial({color,roughness:.95,metalness,side:T.DoubleSide});
    m.name = name; m.userData.actorMaterial = true; return m;
  };
  const dark = material('dress13-dried-scuff',0x263139), wet = material('dress13-wet-tread',0x142632), scratch = material('dress13-worn-edges',0x6c7270), brass = material('dress13-spent-cases',0x827c62,.65);
  const mesh = (g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,angle=0) => {
    const o = new T.Mesh(g,m); o.position.set(x/32,y,z/32);o.rotation.y=angle;o.receiveShadow=true;group.add(o);return o;
  };
  const flat = (points:number[][],m:T.Material,x:number,z:number,angle=0) => {
    const shape = new T.Shape(points.map(p=>new T.Vector2(p[0],p[1])));
    const g = new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);return mesh(g,m,x,.008,z,angle);
  };
  if(id==='awakening-bay') {
    for(let i=0;i<6;i++) {
      const x=620+(i%2?7:-7)+i*4,z=350+i*8;
      flat([[-.075,-.17],[.065,-.17],[.095,-.05],[.075,.16],[.025,.23],[-.06,.18],[-.09,.02]],wet,x,z,.25);
      flat([[-.06,-.04],[.065,-.04],[.065,.05],[-.06,.05]],wet,x-2,z-9,.25);
    }
  }
  if(id==='residential-gallery') {
    // Four parallel claw cuts on the barricaded hatch, with a dragged scuff below.
    for(let i=0;i<4;i++) {
      const g=new T.PlaneGeometry(.025,.60-i*.04);const o=mesh(g,scratch,750+i*5,.9,244);o.rotation.z=-.3;
    }
    flat([[-.8,-.08],[.7,-.12],[1,.03],[.35,.08],[-.9,.04]],dark,750,270,.3);
  }
  if(id==='crew-checkpoint') {
    // Irregular soot fan has a source at the jammed inspection machinery.
    flat([[0,0],[-.5,.12],[-1.05,.7],[-.65,.75],[-.18,1.1],[.25,.85],[.65,.91],[.45,.4]],dark,403,131,-.4);
    for(let i=0;i<7;i++) {
      const g=new T.CylinderGeometry(.021,.021,.10,6);g.rotateZ(Math.PI/2);
      mesh(g,brass,401+(i%3)*8,.035,148+Math.floor(i/3)*8,i*.8);
    }
  }
  if(id==='passenger-vault') {
    for(let i=0;i<3;i++) flat([[-.16,-.22],[.17,-.21],[.15,.23],[-.17,.2]],scratch,446+i*9,366+i*3,i*.4);
  }
  if(id==='communal-atrium') {
    for(let i=0;i<5;i++) flat([[-.12,-.32],[.13,-.28],[.1,.3],[-.13,.27]],dark,650+i*9,400+(i%2)*8,.3);
  }
  if(id==='armory') {
    for(let i=0;i<3;i++) flat([[-.04,-.7],[.03,-.65],[.025,.7],[-.025,.62]],dark,506+i*7,429,-.4);
  }
  // Unused per-room finishes do not enter the scene or retain resources.
  const used=new Set<T.Material>();group.traverse(o=>{if(o instanceof T.Mesh)used.add(o.material as T.Material);});
  for(const m of [dark,wet,scratch,brass])if(!used.has(m))m.dispose();
  root.add(group);
}
