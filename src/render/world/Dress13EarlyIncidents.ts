import {addRecoverySpill} from './Inc13RecoverySpill';
import {dress13ResidentialPlacements, addDress13ResidentialDetails} from './Dress13Residential';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
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
  if (id === 'passenger-vault') {
    // One empty drawer has been pulled into the aisle shoulder. Its open case,
    // separate lid, folded clothes and personal objects remain in one trail.
    put('service-transit-case',301,571,-.4,[.66,.32,.56]);
    put('service-access-hatch',292,566,-.4,[.54,.35,.47],.10);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-1.25));
  }
  if (id === 'communal-atrium') {
    // Overturned table tops and a fallen bench form a failed line along the
    // garden's visible south face; the western fight court remains empty.
    // Three recognisable fallen tables are assembled by the room detail owner.
    put('security-bench',574,429,-.55,[.8,.45,.45],.2,'security');
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(1.15));
    put('service-transit-case',614,423,.7,[.7,.4,.6]);
    put('service-transit-case',673,419,-.3,[.5,.3,.5]);
    put('deck-rubber-panel',550,432,.4,[.7,.5,.5],.026,'clinical');
    put('deck-rubber-panel',586,435,-.3,[.5,.5,.35],.026,'clinical');
    put('deck-access-panel',628,434,.8,[.38,.5,.3],.026,'clinical');
    put('deck-access-panel',647,428,-.4,[.3,.5,.28],.026,'clinical');
    put('service-pressure-drum',694,431,.4,[.7,.65,.7],.3);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationZ(1.3));
    put('service-cable-tray',667,432,1.3,[.4,.25,.5]);
  }
  if (id === 'crew-checkpoint') {
    // The departure gate has caught the abandoned conveyor load. The incident
    // sits below the gate's north shoe, visible from the scanner-hall spawn.
    put('security-baggage-conveyor',614,330,0,[.72,.6,.52],0,'security');
    for (const [x,a,sz] of [[590,-.2,.8],[616,.18,.75],[642,-.3,.65]])
      put('service-transit-case',x,330,a,[sz,.75,sz],.495);
    put('service-transit-case',603,359,.6,[.9,.45,.75]);
    put('service-transit-case',645,356,-.35,[.65,.4,.6]);
    put('service-cable-tray',654,341,1.3,[.7,.55,.7],.24);
    put('service-safety-rail',658,345,1.45,[.75,.55,.7],.08);
    put('service-access-hatch',624,351,-.5,[.75,.4,.65],.06);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-1.4));
    put('deck-rubber-panel',586,352,.4,[.5,.5,.3],.026,'clinical');
    put('deck-access-panel',664,347,-.3,[.3,.5,.2],.026,'clinical');
    put('service-cable-tray',575,345,.3,[.4,.3,.45]);
  }
  if (id === 'armory') {
    // The interrupted issue load spills outside the port counter, fully in the
    // spawn camera. The southern native issue-court fight circle stays clear.
    for (const x of [572,628]) {
      put('deck-access-panel',x,246,0,[.85,1,1],2.4,'clinical');
      pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    }
    put('service-transit-case',268,338,-.25,[1.55,.45,1.05]);
    put('service-access-hatch',283,332,-.35,[1.25,.6,.75],.08);
    pieces[pieces.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-1.25));
    put('service-transit-case',245,371,.4,[.85,.4,.65]);
    put('service-transit-case',285,378,-.5,[.6,.3,.55]);
    put('service-cable-tray',280,364,.4,[.6,.4,.65]);
    put('service-cable-tray',253,389,1.35,[.5,.3,.55]);
    put('deck-access-panel',239,340,-.6,[.4,.5,.24],.026,'clinical');
    put('deck-access-panel',285,388,.4,[.3,.5,.2],.026,'clinical');
    put('deck-rubber-panel',255,359,.3,[.55,.5,.35],.026,'clinical');
    put('deck-rubber-panel',285,371,-.7,[.35,.5,.26],.026,'clinical');
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
    addRecoverySpill(group);
  }
  if(id==='crew-checkpoint') {
    // Irregular soot fan has a source at the jammed inspection machinery.
    const scorch=flat([[0,0],[-.5,.12],[-1.05,.7],[-.65,.75],[-.18,1.1],[.25,.85],[.65,.91],[.45,.4]],dark,650,345,-.4);scorch.scale.set(1.5,1,1.5);scorch.position.y=.034;
    for(let i=0;i<7;i++) {
      const g=new T.CylinderGeometry(.021,.021,.10,6);g.rotateZ(Math.PI/2);
      mesh(g,brass,558+(i%3)*8,.035,352+Math.floor(i/3)*8,i*.8);
    }
  }
  if(id==='passenger-vault') {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#26363c';ctx.fillRect(0,0,512,128);ctx.fillStyle='#b3b9ac';ctx.font='bold 38px monospace';ctx.fillText('K. VOSS / BERTH 04',18,54);ctx.font='24px monospace';ctx.fillText('PERSONAL EFFECTS - RELEASED',18,101);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const label=new T.MeshStandardMaterial({map:texture,roughness:1,metalness:0,side:T.DoubleSide});label.name='dress13-passenger-nameplate';label.userData.actorMaterial=true;label.addEventListener('dispose',()=>texture.dispose());
    mesh(new T.PlaneGeometry(1.1,.275),label,354,.75,669).rotation.x=-.55;
  }
  if(id==='crew-checkpoint') {
    const rim=material('checkpoint-foot-return',0x79898c,.58);
    rim.emissive.setHex(0x263c43);rim.emissiveIntensity=.36;
    for(const x of [591,636])mesh(new T.BoxGeometry(.48,.041,.11),rim,x,.09,348);
  }
  if(id==='communal-atrium') {
    const tables:T.BufferGeometry[]=[];
    for(const [x,z,y,yaw,roll,flip] of [[535,419,.73,.25,0,1],[597,414,.64,-.24,1.35,0],[654,414,.64,.2,-1.3,0]]){
      const transform=new T.Matrix4().compose(new T.Vector3(x/32,y,z/32),new T.Quaternion().setFromEuler(new T.Euler(flip?Math.PI:0,yaw,roll,'YXZ')),new T.Vector3(1,1,1));
      const part=(w:number,h:number,d:number,px:number,py:number,pz:number,color:number)=>{
        const source=new T.BoxGeometry(w,h,d),g=source.toNonIndexed();source.dispose();g.translate(px,py,pz);g.applyMatrix4(transform);
        const c=new T.Color(color),values=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<values.length/3;i++)c.toArray(values,i*3);g.setAttribute('color',new T.BufferAttribute(values,3));tables.push(g);
      };
      part(1.5,.08,.9,0,.68,0,0x899184);
      for(const lx of [-.6,.6])for(const lz of [-.32,.32])part(.065,.64,.065,lx,.32,lz,0x40545a);
      for(const lz of [-.32,.32])part(1.32,.06,.055,0,.61,lz,0x5c7071);
    }
    const tableGeometry=mergeGeometries(tables,false)!;tables.forEach(g=>g.dispose());
    const tableMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:.12});tableMaterial.userData.actorMaterial=true;
    const fallenTables=mesh(tableGeometry,tableMaterial,0,0,0);fallenTables.name='dress13-atrium-fallen-dining-tables';

    const soil=material('dress13-trampled-soil',0x2d3327),leaf=material('dress13-crushed-leaf',0x657454);
    flat([[0,0],[-.5,-.15],[-2.1,.2],[-2.4,.7],[-1.1,1.0],[-.3,.7],[.7,.9],[.5,.3]],soil,694,432,.1).position.y=.029;
    for(let i=0;i<8;i++) flat([[-.10,-.24],[.02,-.30],[.13,-.02],[.04,.24],[-.1,.12]],leaf,550+i*17,429+i%3*4,i*.8);
    for(let i=0;i<5;i++) flat([[-.12,-.32],[.13,-.28],[.1,.3],[-.13,.27]],dark,650+i*9,420+(i%2)*8,.3);
  }
  if(id==='armory') {
    const foam=new T.PlaneGeometry(1.18,.65);foam.rotateX(-Math.PI/2);mesh(foam,scratch,268,.244,338,-.25);
    const rifle=flat([[-.5,-.12],[-.28,-.12],[-.2,-.045],[.45,-.045],[.45,.025],[.05,.025],[.02,.10],[-.1,.10],[-.1,.025],[-.3,.025],[-.38,.12],[-.5,.12]],dark,268,334,-.25);rifle.position.y=.249;
    const pistol=flat([[-.21,-.055],[.19,-.055],[.19,.035],[-.02,.035],[-.04,.18],[-.14,.18],[-.17,.035],[-.21,.035]],dark,268,345,-.25);pistol.position.y=.249;
    for(let i=0;i<4;i++) flat([[-.04,-.7],[.03,-.65],[.025,.7],[-.025,.62]],dark,258+i*7,371,-.4);
  }
  // Unused per-room finishes do not enter the scene or retain resources.
  const used=new Set<T.Material>();group.traverse(o=>{if(o instanceof T.Mesh)used.add(o.material as T.Material);});
  for(const m of [dark,wet,scratch,brass])if(!used.has(m))m.dispose();
  root.add(group);
}
