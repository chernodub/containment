import * as T from 'three';
import {industrialBoxGeometry,industrialCylinderGeometry,industrialStencil} from './world/IndustrialFormKit';
import {ARMORY_CENTER,ARMORY_COUNTER,ARMORY_CAROUSEL,ARMORY_COUNTER_START,ARMORY_COUNTER_END} from '../game/world/armoryCarouselLayout';
import type {Point} from '../game/roguelike/types';
import {createStoredArmoryRifle} from './ArmoryBlockout';

/** Stationary secured inventory, with all raised parts inside the two solids. */
export function armoryCarousel():T.Group{
 const root=new T.Group();root.name='armory-carousel-and-issue-bay';
 const material=(name:string,color:number,metalness:number)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.58});m.name=name;m.userData.actorMaterial=true;
  return m;};
 const graphite=material('armory-graphite',0x28383d,.72),edge=material('armory-brass',0x88724c,.68),pale=material('armory-serial-enamel',0x72817f,.35),rubber=material('armory-dark-rubber',0x10191c,.05),worktop=material('armory-matte-worktop',0x34434a,.14);
 worktop.roughness=.88;
 const add=(name:string,g:T.BufferGeometry,m:T.Material,parent:T.Object3D=root)=>{g.userData.environmentUV=true;const mesh=new T.Mesh(g,m);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const slab=(name:string,points:readonly Point[],bottom:number,height:number,m:T.Material,holes:readonly (readonly Point[])[]=[])=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  for(const hole of holes)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p.x/32,-p.y/32))));
  const bevel=Math.min(.055,height*.22);
  const g=new T.ExtrudeGeometry(shape,{depth:height-2*bevel,bevelEnabled:true,bevelOffset:-bevel,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,steps:1});g.rotateX(-Math.PI/2);g.translate(0,bottom+bevel,0);return add(name,g,m);
 };
 const box=(parent:T.Object3D,name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const p=add(name,industrialBoxGeometry(w,h,d,Math.min(w,h,d)>.045&&Math.max(w,h,d)>.18?Math.min(.065,Math.min(w,h,d)*.16):0),m,parent);p.position.set(x,y,z);return p;};
 const cylinder=(name:string,radius:number,height:number,y:number,m:T.Material)=>{const p=add(name,industrialCylinderGeometry(radius,height,.035,32),m);p.position.set(ARMORY_CENTER.x/32,y,ARMORY_CENTER.y/32);return p;};
 slab('horseshoe-solid',ARMORY_COUNTER,0,.14,graphite);
 const shellOutline=ARMORY_COUNTER.map(p=>{const dx=p.x-600,dz=p.y-450,r=Math.hypot(dx,dz),inset=r>255?-11:3;return{x:600+dx*(r+inset)/r,y:450+dz*(r+inset)/r};});
 slab('horseshoe-recessed-housing',shellOutline,.14,.90,graphite);
 const a=240*Math.PI/180,b=Math.PI/2-a;
 const viseRecess=[[-.72,-.70],[.72,-.70],[.72,.70],[-.72,.70]].map(([x,z])=>({x:600+255*Math.cos(a)+32*(Math.cos(b)*x+Math.sin(b)*z),y:450+255*Math.sin(a)+32*(-Math.sin(b)*x+Math.cos(b)*z)}));
 slab('horseshoe-worktop',ARMORY_COUNTER,1.04,.10,worktop,[viseRecess]);
 // Broad armored cassettes and a recessed service plinth break the long curved facade.
 // All tangent panels remain within the original counter's radial reservation.
 for(let degrees=160;degrees<=380;degrees+=20){
  const angle=degrees*Math.PI/180,g=new T.Group();g.name='counter-inset-service-cassette';g.position.set((600+295*Math.cos(angle))/32,.53,(450+295*Math.sin(angle))/32);g.rotation.y=Math.PI/2-angle;root.add(g);
  box(g,'counter-panel-shadow',0,0,0,1.82,.70,.055,rubber);
  box(g,'counter-panel-enamel',0,.025,.035,1.66,.53,.035,graphite);
  for(const side of [-1,1])box(g,'counter-frame',side*.88,0,.045,.065,.66,.055,pale);
  box(g,'counter-pull',.52,.04,.07,.065,.22,.06,edge);
  box(g,'counter-toe',0,-.39,-.06,1.85,.12,.20,rubber);
 }
 // Inset brushed-metal safety edges stay strictly inside the segmented solid.
 for(const [inner,outer] of [[216,219],[290,294]] as const){
  const strip=[...Array.from({length:25},(_,i)=>{const angle=(ARMORY_COUNTER_START+i*(ARMORY_COUNTER_END-ARMORY_COUNTER_START)/24)*Math.PI/180;return{x:600+outer*Math.cos(angle),y:450+outer*Math.sin(angle)};}),...Array.from({length:25},(_,i)=>{const angle=(ARMORY_COUNTER_END-i*(ARMORY_COUNTER_END-ARMORY_COUNTER_START)/24)*Math.PI/180;return{x:600+inner*Math.cos(angle),y:450+inner*Math.sin(angle)};})];
  slab('worktop-machined-edge',strip,1.142,.012,pale);
 }
 for(let degrees=155;degrees<=385;degrees+=20){
  const angle=degrees*Math.PI/180;const bolt=add('counter-captive-fastener',new T.CylinderGeometry(.025,.025,.012,8),edge);bolt.position.set((600+283*Math.cos(angle))/32,1.149,(450+283*Math.sin(angle))/32);
 }

 slab('carousel-solid-geared-foot',ARMORY_CAROUSEL,0,1.02,graphite);
 cylinder('carousel-bearing',2.23,.12,1.08,edge);
 // Two slim machined races break the broad flat base without concealing its teeth.
 for(const [radius,y] of [[1.92,1.235],[2.05,1.238]] as const){const g=new T.TorusGeometry(radius,.018,6,64);g.rotateX(Math.PI/2);const race=add('carousel-bearing-race',g,pale);race.position.set(ARMORY_CENTER.x/32,y,ARMORY_CENTER.y/32);}

 cylinder('carousel-deck',2.12,.09,1.185,worktop);
 cylinder('carousel-spindle',.24,2.25,2.35,pale);
 cylinder('carousel-spindle-cap',.38,.14,3.545,edge);
 for(const y of [1.47,2.07,3.31])cylinder('spindle-machined-collar',.27,.065,y,graphite);
 box(root,'spindle-motor-inspection-recess',ARMORY_CENTER.x/32+.231,2.62,ARMORY_CENTER.y/32,.028,.67,.28,rubber);
 for(let slot=0;slot<6;slot++)box(root,'spindle-motor-cooling-fin',ARMORY_CENTER.x/32+.251,2.37+slot*.095,ARMORY_CENTER.y/32,.018,.025,.22,edge);
 for(let bolt=0;bolt<8;bolt++){
  const a=bolt*Math.PI/4,fastener=add('spindle-cap-fastener',new T.CylinderGeometry(.018,.018,.012,6),graphite);
  fastener.position.set(ARMORY_CENTER.x/32+Math.cos(a)*.3,3.622,ARMORY_CENTER.y/32+Math.sin(a)*.3);
 }
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,g=new T.Group();g.position.set(ARMORY_CENTER.x/32,0,ARMORY_CENTER.y/32);g.rotation.y=-a;root.add(g);
  box(g,'gear-tooth',2.38,1.11,0,.15,.18,.35,edge);
 }
 // The front/south sector is genuinely open above the solid geared base.
 for(const degrees of [150,190,230,270,310,350,390]){
  const a=degrees*Math.PI/180,mount=new T.Group();mount.name='radial-weapon-mount';mount.position.set(ARMORY_CENTER.x/32,0,ARMORY_CENTER.y/32);mount.rotation.y=-a;root.add(mount);
  box(mount,'radial-spoke',.81,2.03,0,1.5,.10,.10,graphite);
  box(mount,'spindle-collar',.28,2.03,0,.16,.26,.20,edge);
  box(mount,'secured-clamp',1.55,2.03,0,.18,.38,.36,edge);
  box(mount,'mount-recessed-lock',1.55,2.227,0,.14,.014,.24,rubber);
  for(const dz of [-.1,.1])box(mount,'mount-lock-fastener',1.55,2.24,dz,.04,.012,.035,pale);
  box(mount,'rubber-stock-cradle',1.32,2.17,.22,.54,.14,.34,rubber);
  box(mount,'polished-issue-lip',1.58,2.25,.24,.16,.035,.38,pale);
  box(mount,'worn-clamp-paddle',1.68,2.13,-.23,.28,.10,.24,edge);
  const rifle=createStoredArmoryRifle();rifle.position.set(1.55,2.03,.21);rifle.rotation.z=Math.PI/2;mount.add(rifle);
 }
 const station=(degrees:number,name:string)=>{const a=degrees*Math.PI/180,g=new T.Group();g.name=name;g.position.set((600+255*Math.cos(a))/32,1.14,(450+255*Math.sin(a))/32);g.rotation.y=Math.PI/2-a;root.add(g);return g;};
 for(const degrees of [165,205,335,375]){
  const g=station(degrees,'sloped-inspection-tray');
  const tray=box(g,'tray-bed',0,.10,0,1.25,.12,1.45,rubber);tray.rotation.x=.16;
  for(const x of [-.65,.65])box(g,'tray-retaining-edge',x,.17,0,.07,.24,1.5,edge);
  box(g,'serial-plate',0,.28,-.66,.52,.025,.14,pale);
  for(let tick=0;tick<7;tick++)box(g,'serial-engraving',-.2+tick*.065,.294,-.66,.018,.003,tick%3===0?.09:.055,graphite);
  for(const x of [-.5,.5])for(const z of [-.51,.51]){const bolt=add('tray-fastener',new T.CylinderGeometry(.027,.027,.018,10),pale,g);bolt.position.set(x,.19,z);}

 }
 // Wide dark splice lines and short ochre safety bars read as manufactured
 // top panels, not another continuous black slab. They share existing batches.
 for(let degrees=170;degrees<=370;degrees+=40){
  const g=station(degrees,'counter-worktop-panel-joint');
  box(g,'worktop-inset-joint',0,.009,0,.038,.014,2.13,rubber);
  for(const side of [-1,1])box(g,'worktop-service-band',side*.16,.012,-.75,.16,.016,.51,edge);
 }
 for(const degrees of [180,360]){
  const g=station(degrees,'counter-issue-stencil');
  industrialStencil({box:(m,x,y,z,w,h,d)=>{box(g,'counter-stencil',x,y,z,w,h,d,m);},pipe:()=>{}},rubber,'06',0,.014,.18,.83,.96);
 }
 // Inset sector seams expose the secured deck's radial construction.
 for(const degrees of [30,90,150,210,270,330]){
  const g=new T.Group();g.position.set(ARMORY_CENTER.x/32,1.238,ARMORY_CENTER.y/32);g.rotation.y=-degrees*Math.PI/180;root.add(g);
  box(g,'carousel-sector-joint',1.35,0,0,1.28,.012,.035,rubber);
  box(g,'carousel-hazard-tab',1.84,.009,.09,.30,.014,.12,edge);
 }
 const vise=station(240,'maintenance-vise');vise.position.y=1.04;
 box(vise,'recessed-vise-well',0,.015,0,1.4,.025,1.35,rubber);
 for(const x of [-.48,.48])box(vise,'vise-jaw',x,.15,0,.22,.24,.65,edge);
 box(vise,'vise-lead-screw',0,.10,0,1.18,.08,.08,graphite);
 // Hinged shoulder hangers carry separate rigid chest plates above the counter.
 for(const degrees of [285,310]){
  const g=station(degrees,'hinged-armor-hanger');g.rotation.y=0;
  box(g,'hanger-post',0,.62,-.38,.12,1.24,.12,graphite);
  box(g,'hanger-hinge',0,1.15,-.35,.30,.16,.24,edge);
  box(g,'hanger-pivot-link',0,1.11,-.22,.12,.10,.35,edge);
  box(g,'hanger-shoulders',0,1.11,-.12,.88,.12,.12,graphite);
  const outline=[[-.38,.15],[-.25,.42],[-.12,.42],[-.09,.26],[.09,.26],[.12,.42],[.25,.42],[.38,.15],[.26,-.42],[-.26,-.42]];
  const shape=new T.Shape(outline.map(([x,y])=>new T.Vector2(x,y)));
  const armor=add('hung-armor-chest',new T.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1}),pale,g);armor.position.set(0,.68,-.09);
  box(g,'armor-waist-joint',0,.32,.16,.43,.10,.08,rubber);
 }
 return root;
}
