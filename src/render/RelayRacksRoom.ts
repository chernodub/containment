import type {RoomTemplate} from '../game/roguelike/types';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RELAY_RACKS_FOOTPRINTS} from '../game/roguelike/relayRacksLayout';
import {industrialBoxGeometry,industrialCylinderGeometry} from './world/IndustrialFormKit';
import {serviceCartridge,serviceHousingGeometry} from './world/EquipmentDetail';

/** Room-local shell and major forms. Dimensions are game units.
 * Raised forms remain inside the five production solids. Cross-aisle cables
 * are flush deck inlays, not extra blockers or relay-success indicators. */
export function relayRacksRoom(includeShell=true,template?:RoomTemplate):T.Group{
 const root=new T.Group();root.name='authored-relay-racks';
 const material=(name:string,color:number,metalness=.35)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.78});m.name=name;m.userData.actorMaterial=true;return m;};
 const deck=material('painted-steel-deck',0x30383a,.1),dark=material('relay-frame-metal',0x1d272b,.65),rail=material('relay-rail-metal',0x526164,.7),pale=material('relay-ceramic',0xc7cec0,.05),cyan=material('relay-fiber',0x568b91,.1),amber=material('relay-bridge-metal',0x8b7350,.65),damage=material('relay-cut-metal',0x765746);
 rail.roughness=.48;pale.roughness=.62;amber.roughness=.58;
 // Dry, low-contrast deck. All surface treatment belongs to this room.
 const normals=new T.DataTexture(new Uint8Array([127,128,255,255,129,128,255,255,128,127,255,255,128,129,255,255]),2,2);
 normals.wrapS=normals.wrapT=T.RepeatWrapping;normals.repeat.set(150,110);normals.needsUpdate=true;
 deck.normalMap=normals;deck.normalScale.set(.3,.3);deck.roughness=.92;deck.addEventListener('dispose',()=>normals.dispose());
 const contact=new T.MeshBasicMaterial({color:0x111c23,transparent:true,opacity:.3,depthWrite:false});contact.name='environment-contact';contact.userData.actorMaterial=true;
 cyan.emissive.setHex(0x57977d);cyan.emissiveIntensity=.28;
 const groups=new Map<T.Group,Map<T.Material,{parts:T.BufferGeometry[];name:string}>>();
 const group=(name:string)=>{const g=new T.Group();g.name=name;root.add(g);groups.set(g,new Map());return g;};
 const add=(g:T.Group,geo:T.BufferGeometry,m:T.Material,name='')=>{
  const flat=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
  const batch=groups.get(g)!;if(!batch.has(m))batch.set(m,{parts:[],name});const bucket=batch.get(m)!;if(name&&!bucket.name)bucket.name=name;bucket.parts.push(flat);
 };
 const box=(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,name='')=>add(g,industrialBoxGeometry(w/32,h/32,d/32,Math.min(w,h,d)>=24&&Math.max(w,h,d)<=170?Math.min(.045,Math.min(w,h,d)/160):0).translate(x/32,y/32,z/32),m,name);
 const pipe=(g:T.Group,a:number[],b:number[],radius:number,m:T.Material,name='')=>{
  const p=new T.Vector3(...a.map(n=>n/32)),q=new T.Vector3(...b.map(n=>n/32));
  const geo=new T.CylinderGeometry(radius/32,radius/32,p.distanceTo(q),8);
  geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),q.clone().sub(p).normalize()));geo.translate(...p.add(q).multiplyScalar(.5).toArray());add(g,geo,m,name);
 };
 const shell=group('relay-neutral-shell');
 box(shell,600,-6,440,1200,12,880,deck);
 // Seams follow broad deck plates rather than outline detached cargo pads.
 const seams=group('relay-deck-seams');
 for(const z of [100,340,540,780])box(seams,600,.025,z,1200,.05,.8,contact);
 for(const x of [180,460,740,1020])box(seams,x,.025,440,.8,.05,880,contact);
 // Low service-wall cassettes stay outside the existing playable envelope.
 const panels=group('relay-shell-panels');
 for(const z of [-7,887])for(const x of [80,240,400,560,720,880,1040,1160]){
  box(panels,x,25,z,x===1160?72:140,42,12,dark);
  box(panels,x,35,z,64,12,14,rail);
  for(const dx of [-20,0,20])box(panels,x+dx,42,z,8,2,12,pale);
 }
 for(const x of [-7,1207])for(const z of [90,250,630,790]){
  box(panels,x,25,z,12,42,140,dark);
  box(panels,x,35,z,14,12,64,rail);
 }
 // Entry/exit breaks remain the same width as the reviewed blockout.
 for(const z of [-6,886])box(shell,600,12,z,1200,24,12,dark);
 for(const x of [-6,1206])for(const z of [180,700])box(shell,x,12,z,12,24,360,dark);
 root.userData.lightFixtures=[];
 for(const x of [160,480,720,1040]){
  box(shell,x,27,-6,28,4,8,cyan);
  root.userData.lightFixtures.push({x:x/32,y:27/32,z:-6/32,color:cyan.emissive.getHex()});
 }
 for(const [i,r]of (template?.obstacles??RELAY_RACKS_FOOTPRINTS).entries()){
  const g=group(`relay-fixture-${i}`),x=r.x+r.width/2,z=r.y+r.height/2;
  // Author one170-unit rack assembly, then fit its complete frame (not just
  // a low collision base) along the wall-connected cooling bank.
  const isRack=i<4||!!template&&i===4,depthScale=isRack?r.height/170:1;
  if(!includeShell)g.scale.y=.34;
  if(isRack){g.scale.z=depthScale;g.position.z=z/32*(1-depthScale);}
  if(template&&i===5){
   g.scale.y=1;
   box(g,x,10,z,r.width,20,r.height,dark);
   for(let cx=r.x+32;cx<r.x+r.width-24;cx+=72){box(g,cx,25,z,56,12,r.height-8,rail);box(g,cx,31,z,42,2,r.height-16,cyan);}
   continue;
  }
  box(g,x,4,z,r.width,8,isRack?170:r.height,dark);
  add(shell,new T.PlaneGeometry(r.width/32,r.height/32).rotateX(-Math.PI/2).translate(x/32,.005,z/32),contact);
  if(isRack){
   const broken=i===1,height=broken?56:76;
   const plenum=group(`relay-cooling-plenum-${i}`);g.add(plenum);
   box(plenum,x,13,z,84,10,148,dark);
   for(const dx of [-40,40])for(const dz of [-60,-40,-20,0,20,40,60])box(plenum,x+dx,20,z+dz,6,6,9,rail);
   // Three repeated blade bays share an open frame, not a stretched cabinet.
   for(const dx of [-43,43])for(const dz of [-77,77])box(g,x+dx,height/2,z+dz,6,height,6,rail,'relay-open-rails');
   for(const dz of [-77,77]){box(g,x,height-3,z+dz,92,6,6,rail);box(g,x,height+.3,z+dz,78,.6,4,pale);}
   box(g,x-34,height+.4,z-77,13,.8,4,amber);
   for(const dx of [-40,40])box(g,x+dx,broken?24:39,z,6,8,154,rail);
   for(const bay of [-1,0,1]){
    const bz=z+bay*50;
    box(g,x,13,bz,84,10,42,dark);
    const trayHeight=broken&&bay===0?25:40;
    box(g,x,trayHeight,bz,78,5,38,rail);
    serviceCartridge({
     box:(m,px,py,pz,w,h,d)=>box(g,px*32,py*32,pz*32,w*32,h*32,d*32,m),
     pipe:(m,a,b,r)=>pipe(g,a.toArray().map(n=>n*32),b.toArray().map(n=>n*32),r*32,m),
     housing:(m,px,py,pz,w,h,d,angle)=>add(g,serviceHousingGeometry(w,h,d).rotateY(angle).translate(px,py,pz),m),
    },{steel:rail,dark,paint:pale,signal:cyan},x/32,(trayHeight+2.6)/32,(bz-1)/32,.78,0,bay+i);
    // Ceramic is confined to the patch field and removable tray handles.
    for(const dx of [-28,28])box(g,x+dx,trayHeight+4,bz+12,12,4,6,pale);
    for(const dx of [-18,-6,6,18])box(g,x+dx,trayHeight+3,bz+6,4,1,13,dark);
    // Top-facing patch blocks and broad loops stay legible at game zoom.
    if(!(broken&&bay===0)){
     box(g,x,51,bz-12,62,9,12,dark);
     for(let port=0;port<8;port++){
      const px=x-25+port*7;
      box(g,px,56,bz-12,5,2,8,dark);
      box(g,px,57.2,bz-12,2,.5,3,(port+i+bay)%5===0?damage:cyan);
     }
     const curve=new T.CatmullRomCurve3([[x-23,57,bz-10],[x-25,broken?60:78,bz+5],[x+25,broken?60:78,bz+5],[x+23,57,bz-10]].map(p=>new T.Vector3(p[0]/32,p[1]/32,p[2]/32)));
     add(g,new T.TubeGeometry(curve,12,2.2/32,5,false),broken?damage:cyan,'relay-fiber-loops');
     // Jacketed multi-fiber looms replace the single tidy hose silhouette.
     for(let cable=0;cable<3;cable++){
      const curve=new T.CatmullRomCurve3([[x-25,58,bz-13+cable*3],[x-30-cable,63+cable*3,bz+7],[x+19,68+cable*2,bz+10],[x+25,58,bz-13+cable*3]].map(p=>new T.Vector3(p[0]/32,p[1]/32,p[2]/32)));
      add(g,new T.TubeGeometry(curve,6,1.15/32,5,false),cable===1?cyan:dark,'relay-cable-bundles');
     }
    }else{
     // Missing tray and short fallen rail are contained inside the damaged bay.
     pipe(g,[x-33,17,bz-15],[x+29,28,bz+14],4,damage);
    }
   }
  }else{
   // Exposed reel, circular retaining flanges and a split strain-relief crown.
   // The former square lid hid the drum at the shipping camera angle.
   add(g,industrialCylinderGeometry(33/32,40/32,.05,16).translate(x/32,32/32,(z-26)/32),amber,'relay-distribution-drum');
   const flanges=group('relay-drum-flanges');g.add(flanges);
   for(const y of [12,54])add(flanges,industrialCylinderGeometry(42/32,8/32,.035,16).translate(x/32,y/32,(z-26)/32),rail);
   // Concentric machined seating and radial fasteners break up the exposed flange cap.
   add(flanges,new T.RingGeometry(17/32,31/32,24).rotateX(-Math.PI/2).translate(x/32,58.2/32,(z-26)/32),dark);
   add(flanges,new T.RingGeometry(29/32,31/32,24).rotateX(-Math.PI/2).translate(x/32,58.4/32,(z-26)/32),pale);
   for(let bolt=0;bolt<8;bolt++){
    const a=bolt*Math.PI/4;
    box(flanges,x+Math.cos(a)*36,58.8,z-26+Math.sin(a)*36,3,1.4,3,pale);
   }
   for(const dx of [-24,24])box(g,x+dx,8,z-26,16,8,68,dark);
   // Broad ribs tie the two flanges together, leaving the reel visible between.
   for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const dx=Math.cos(angle)*34,dz=Math.sin(angle)*34;
    pipe(g,[x+dx,16,z-26+dz],[x+dx,50,z-26+dz],3,rail);
   }
   for(let rib=0;rib<8;rib++){
    const a=(rib+.5)*Math.PI/4;
    box(g,x+Math.cos(a)*32,32,z-26+Math.sin(a)*32,3,32,3,dark);
   }
   const fork=group('relay-fork-guides');g.add(fork);
   for(const side of [-1,1]){
    // Two ceramic combs with individual dark slots, not a rectangular cover.
    box(fork,x+side*25,62,z-7,26,8,16,pale);
    for(const lane of [-1,0,1]){
     const endX=x+side*25+lane*7;
     box(fork,endX,67,z-7,4,2,12,dark);
     const curve=new T.CatmullRomCurve3([[x+lane*5,22,z-73],[x+lane*5,63,z-52],[x+side*16+lane*5,70,z-27],[endX,69,z-7]].map(p=>new T.Vector3(p[0]/32,p[1]/32,p[2]/32)));
     add(fork,new T.TubeGeometry(curve,10,1.8/32,5,false),cyan);
    }
    // Bolted saddles and jacketed tails support the fork and bridge housing.
    box(g,x+side*25,58,z-7,28,4,20,dark);
    pipe(g,[x+side*28,19,z+1],[x+side*28,19,z+37],4,dark);
   }
   // Separate ceramic jaws expose the missing bridge. The parked handle stays
   // on the right housing, so no new interaction or success state is implied.
   const coupler=group('relay-bridge-coupler');g.add(coupler);
   for(const side of [-1,1]){
    const jaw=group(side<0?'relay-coupler-left':'relay-coupler-right');coupler.add(jaw);
    box(jaw,x+side*31,12,z+54,28,8,40,rail);
    box(jaw,x+side*30,28,z+54,24,24,34,dark);
    box(jaw,x+side*21,41,z+54,10,18,30,pale);
    box(jaw,x+side*21,50.15,z+54,7,.3,24,dark);
    for(const dz of [45,50,55,60])box(jaw,x+side*21,50.4,z+dz,5,.3,1.2,rail);
    box(jaw,x+side*31,40.2,z+54,12,.4,22,dark);
    for(let tick=0;tick<3;tick++)box(jaw,x+side*31+(tick-1)*3,40.6,z+58,1.3,.4,2,tick===0?cyan:rail);
    for(const dz of [46,62])box(jaw,x+side*12,41,z+dz,10,6,6,amber);
    for(const dz of [40,68])box(jaw,x+side*36,43,z+dz,8,6,6,rail);
   }
   // A low broken cable end below the open jaws continues the severed spur.
   pipe(coupler,[x,8,z+71],[x-5,14,z+60],3,damage);
   const lever=group('relay-manual-lever');coupler.add(lever);
   pipe(lever,[x+32,37,z+42],[x+32,62,z+58],3,rail);
   pipe(lever,[x+23,62,z+58],[x+41,62,z+58],4,amber);
  }
 }
 const channels=group('relay-flush-channels');
 // Flat rectangular inlays: north feed connects both upper banks to the hub.
 box(channels,600,.15,230,10,.3,260,cyan);
 box(channels,600,.15,100,510,.3,10,cyan);
 for(const x of [350,850])box(channels,x,.15,130,10,.3,60,cyan);
 // Severed southern spur: a 26-unit unpainted gap, no raised trip hazard.
 box(channels,600,.15,539,10,.3,38,damage);
 box(channels,600,.15,627,10,.3,86,damage);
 box(channels,500,.15,670,200,.3,10,damage);
 for(const [g,batches]of groups)for(const [m,{parts,name}]of batches){
  if(!includeShell&&[shell,seams,panels,channels].includes(g)){for(const p of parts)p.dispose();continue;}
  const geo=mergeGeometries(parts,false)!;for(const p of parts)p.dispose();
  const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=g!==channels&&g!==shell;mesh.receiveShadow=true;mesh.userData.bakedEnvironment=true;(g===shell?root:g).add(mesh);
 }
 if(!includeShell)root.userData.lightFixtures=[];
 // Skipped source-shell batches must retire their private finishes/normal map.
 const used=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])used.add(m);});
 for(const m of [deck,dark,rail,pale,cyan,amber,damage,contact])if(!used.has(m))m.dispose();
 root.userData.localizedStatusIndicators=4*3*3;
 return root;
}
