import {dress13ResidentialPlacements, addDress13ResidentialDetails} from './Dress13Residential';
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
  if (id === 'residential-gallery') return dress13ResidentialPlacements();
  if (id === 'awakening-bay') {
    // A torn release lid, its hinges and abandoned treatment load connect the
    // open bank to one readable aftermath at the pod-aisle shoulder.
    put('service-transit-case',465,370,-.35,[1.15,.65,1]);
    put('service-access-hatch',414,378,.2,[1.15,.65,.9],.10);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-1.35));
    put('service-access-hatch',493,380,-.6,[.7,.4,.7],.08);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-1.55));
    put('service-transit-case',514,365,.6,[.6,.35,.65]);
    put('service-cable-tray',410,366,.3,[.65,.35,.8]);
    put('deck-rubber-panel',443,385,.6,[.7,.8,.45],.025,'clinical');
    put('deck-rubber-panel',477,390,-.35,[.5,.7,.4],.025,'clinical');
    put('deck-access-panel',447,361,.55,[.55,1,.3],.03,'clinical');
    put('deck-access-panel',497,381,-.35,[.28,1,.22],.025,'clinical');
    put('service-transit-case',528,367,-.2,[.4,.25,.4]);
    put('service-cable-tray',452,397,1.5,[.35,.3,.5]);
  }
  if (id === 'passenger-vault') {
    // One empty drawer has been pulled into the aisle shoulder. Its open case,
    // separate lid, folded clothes and personal objects remain in one trail.
    put('service-transit-case',366,368,.2,[1.25,.35,.9]);
    put('service-access-hatch',358,363,.15,[1,.45,.75],.08);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-1.4));
    put('service-transit-case',414,369,-.5,[.7,.35,.6]);
    put('service-transit-case',445,366,.35,[.55,.3,.5]);
    put('service-access-hatch',438,374,-.3,[.5,.3,.45],.03);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-1.5));
    put('deck-access-panel',328,373,.5,[.25,.5,.33],.025,'clinical');
    put('deck-access-panel',343,379,-.2,[.3,.5,.24],.025,'clinical');
    put('deck-rubber-panel',396,372,.8,[.6,.5,.42],.026,'clinical');
    put('deck-rubber-panel',418,380,-.5,[.45,.4,.3],.026,'clinical');
    put('deck-access-panel',457,379,.6,[.22,.5,.16],.025,'clinical');
    put('service-transit-case',473,370,-.4,[.36,.25,.36]);
    put('deck-access-panel',383,381,-.4,[.18,.5,.14],.025,'clinical');
  }
  if (id === 'communal-atrium') {
    // A failed dining barricade gathers on the conservatory's east foot.
    for (const [x,z,a] of [[650,414,.25],[685,414,-.3]]) {
      put('habitation-desk',x,z,a,[.85,.85,.85],.82,'clinical');
      pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationZ(Math.PI/2));
    }
    put('security-bench',625,415,-.55,[.7,.6,.7],.3,'security');
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    put('service-transit-case',635,414,.7,[.65,.5,.65]);
    put('deck-rubber-panel',633,426,.4,[.4,.5,.25],.003,'clinical');
    put('deck-rubber-panel',659,434,-.3,[.3,.5,.4],.003,'clinical');
    put('deck-access-panel',685,430,.8,[.25,.5,.3],.006,'clinical');
  }
  if (id === 'crew-checkpoint') {
    // The north inspection conveyor was abandoned with baggage still aboard.
    put('service-transit-case',930,98,-.18,[.8,.7,.8],.82);
    put('service-transit-case',957,101,.23,[.65,.65,.65],.82);
    put('service-transit-case',981,121,.8,[.8,.55,.8]);
    put('service-cable-tray',992,127,.4,[.5,.4,.65]);
    // The jam's dropped load must also read from the central fight camera.
    put('service-transit-case',630,540,-.4,[.85,.45,.75]);
    put('service-transit-case',655,530,.6,[.6,.35,.6]);
    put('service-cable-tray',660,515,1.1,[.6,.5,.6],.18);

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
  if (id === 'residential-gallery') {addDress13ResidentialDetails(root);return;}
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
    const g = new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);return mesh(g,m,x,.026,z,angle);
  };
  if(id==='awakening-bay') {
    const med = material('dress13-medical-label',0xa3b4ac);
    for(const [w,d] of [[.26,.08],[.08,.26]]) {const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);mesh(g,med,465,.37,370,-.35);}
    for(let i=0;i<6;i++) {
      const x=461+(i%2?7:-7)-i*7,z=391+i*7;
      flat([[-.075,-.17],[.065,-.17],[.095,-.05],[.075,.16],[.025,.23],[-.06,.18],[-.09,.02]],wet,x,z,.25);
      flat([[-.06,-.04],[.065,-.04],[.065,.05],[-.06,.05]],wet,x-2,z-9,.25);
    }
  }
  if(id==='crew-checkpoint') {
    // Irregular soot fan has a source at the jammed inspection machinery.
    flat([[0,0],[-.5,.12],[-1.05,.7],[-.65,.75],[-.18,1.1],[.25,.85],[.65,.91],[.45,.4]],dark,648,543,-.4);
    for(let i=0;i<7;i++) {
      const g=new T.CylinderGeometry(.021,.021,.10,6);g.rotateZ(Math.PI/2);
      mesh(g,brass,625+(i%3)*8,.035,550+Math.floor(i/3)*8,i*.8);
    }
  }
  if(id==='passenger-vault') {
    const pocket=new T.PlaneGeometry(.85,.49);pocket.rotateX(-Math.PI/2);mesh(pocket,dark,366,.191,368,.2);
    for(let i=0;i<4;i++) flat([[-.22,-.27],[.23,-.26],[.21,.28],[-.23,.25]],scratch,328+i*13,377+i%2*3,i*.4);
    flat([[-.035,-.7],[.04,-.6],[.025,.65],[-.025,.6]],dark,360,374,.2);
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#26363c';ctx.fillRect(0,0,512,128);ctx.fillStyle='#b3b9ac';ctx.font='bold 38px monospace';ctx.fillText('K. VOSS / BERTH 04',18,54);ctx.font='24px monospace';ctx.fillText('PERSONAL EFFECTS - RELEASED',18,101);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const label=new T.MeshStandardMaterial({map:texture,roughness:1,metalness:0,side:T.DoubleSide});label.name='dress13-passenger-nameplate';label.userData.actorMaterial=true;label.addEventListener('dispose',()=>texture.dispose());
    mesh(new T.PlaneGeometry(1.1,.275),label,366,.26,379).rotation.x=-.55;
  }
  if(id==='communal-atrium') {
    for(let i=0;i<5;i++) flat([[-.12,-.32],[.13,-.28],[.1,.3],[-.13,.27]],dark,650+i*9,400+(i%2)*8,.3);
  }
  if(id==='armory') {
    const foam=new T.PlaneGeometry(.95,.48);foam.rotateX(-Math.PI/2);mesh(foam,dark,503,.217,420,-.35);
    for(const x of [499,507]){const cut=new T.PlaneGeometry(.06,.33);cut.rotateX(-Math.PI/2);mesh(cut,scratch,x,.22,420,-.35);}
    for(let i=0;i<3;i++) flat([[-.04,-.7],[.03,-.65],[.025,.7],[-.025,.62]],dark,506+i*7,429,-.4);
  }
  // Unused per-room finishes do not enter the scene or retain resources.
  const used=new Set<T.Material>();group.traverse(o=>{if(o instanceof T.Mesh)used.add(o.material as T.Material);});
  for(const m of [dark,wet,scratch,brass])if(!used.has(m))m.dispose();
  root.add(group);
}
