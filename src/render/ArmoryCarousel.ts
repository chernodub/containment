import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ARMORY_COUNTER,ARMORY_CAROUSEL} from '../game/world/armoryCarouselLayout';
import type {Point} from '../game/roguelike/types';
import {createStoredArmoryRifle} from './ArmoryBlockout';

/** Stationary secured inventory, with all raised parts inside the two solids. */
export function armoryCarousel():T.Group{
 const root=new T.Group();root.name='armory-carousel-and-issue-bay';
 const material=(name:string,color:number,metalness:number)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.58});m.name=name;m.userData.actorMaterial=true;
  m.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 armorySurface;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\narmorySurface=position;');
   shader.fragmentShader='varying vec3 armorySurface;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float machining=.5+.5*sin(armorySurface.y*190.0+armorySurface.x*63.0);
    float brushing=.5+.5*sin(armorySurface.z*211.0+sin(armorySurface.x*23.0));
    diffuseColor.rgb*=.90+machining*.065+brushing*.035;`);
  };m.customProgramCacheKey=()=> 'g2-armory-machined-v1';return m;};
 const graphite=material('armory-graphite',0x28383d,.72),edge=material('armory-brass',0x88724c,.68),pale=material('armory-serial-enamel',0xb7bcae,.35),rubber=material('armory-dark-rubber',0x10191c,.05);
 const add=(name:string,g:T.BufferGeometry,m:T.Material,parent:T.Object3D=root)=>{g.userData.environmentUV=true;const mesh=new T.Mesh(g,m);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const slab=(name:string,points:readonly Point[],bottom:number,height:number,m:T.Material,holes:readonly (readonly Point[])[]=[])=>{
  const shape=new T.Shape(points.map(p=>new T.Vector2(p.x/32,-p.y/32)));
  for(const hole of holes)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p.x/32,-p.y/32))));
  const g=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);return add(name,g,m);
 };
 const box=(parent:T.Object3D,name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material)=>{const beveled=name==='tray-bed'||name==='vise-jaw'||name==='secured-clamp';const p=add(name,beveled?new RoundedBoxGeometry(w,h,d,1,Math.min(.025,w*.12,h*.12,d*.12)):new T.BoxGeometry(w,h,d),m,parent);p.position.set(x,y,z);return p;};
 const cylinder=(name:string,radius:number,height:number,y:number,m:T.Material)=>{const p=add(name,new T.CylinderGeometry(radius,radius,height,48),m);p.position.set(600/32,y,450/32);return p;};
 slab('horseshoe-solid',ARMORY_COUNTER,0,1.04,graphite);
 const a=240*Math.PI/180,b=Math.PI/2-a;
 const viseRecess=[[-.72,-.70],[.72,-.70],[.72,.70],[-.72,.70]].map(([x,z])=>({x:600+255*Math.cos(a)+32*(Math.cos(b)*x+Math.sin(b)*z),y:450+255*Math.sin(a)+32*(-Math.sin(b)*x+Math.cos(b)*z)}));
 slab('horseshoe-worktop',ARMORY_COUNTER,1.04,.10,graphite,[viseRecess]);
 // Inset brushed-metal safety edges stay strictly inside the segmented solid.
 for(const [inner,outer] of [[216,219],[290,294]] as const){
  const strip=[...Array.from({length:25},(_,i)=>{const angle=(150+i*10)*Math.PI/180;return{x:600+outer*Math.cos(angle),y:450+outer*Math.sin(angle)};}),...Array.from({length:25},(_,i)=>{const angle=(390-i*10)*Math.PI/180;return{x:600+inner*Math.cos(angle),y:450+inner*Math.sin(angle)};})];
  slab('worktop-machined-edge',strip,1.142,.012,pale);
 }
 for(let degrees=155;degrees<=385;degrees+=20){
  const angle=degrees*Math.PI/180;const bolt=add('counter-captive-fastener',new T.CylinderGeometry(.025,.025,.012,8),edge);bolt.position.set((600+283*Math.cos(angle))/32,1.149,(450+283*Math.sin(angle))/32);
 }

 slab('carousel-solid-geared-foot',ARMORY_CAROUSEL,0,1.02,graphite);
 cylinder('carousel-bearing',2.23,.12,1.08,edge);
 // Two slim machined races break the broad flat base without concealing its teeth.
 for(const [radius,y] of [[1.92,1.235],[2.05,1.238]] as const){const g=new T.TorusGeometry(radius,.018,6,64);g.rotateX(Math.PI/2);const race=add('carousel-bearing-race',g,pale);race.position.set(600/32,y,450/32);}

 cylinder('carousel-deck',2.12,.09,1.185,graphite);
 cylinder('carousel-spindle',.24,2.25,2.35,pale);
 cylinder('carousel-spindle-cap',.38,.14,3.545,edge);
 for(const y of [1.47,2.07,3.31])cylinder('spindle-machined-collar',.27,.065,y,graphite);
 box(root,'spindle-motor-inspection-recess',600/32+.231,2.62,450/32,.028,.67,.28,rubber);
 for(let slot=0;slot<6;slot++)box(root,'spindle-motor-cooling-fin',600/32+.251,2.37+slot*.095,450/32,.018,.025,.22,edge);
 for(let bolt=0;bolt<8;bolt++){
  const a=bolt*Math.PI/4,fastener=add('spindle-cap-fastener',new T.CylinderGeometry(.018,.018,.012,6),graphite);
  fastener.position.set(600/32+Math.cos(a)*.3,3.622,450/32+Math.sin(a)*.3);
 }
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,g=new T.Group();g.position.set(600/32,0,450/32);g.rotation.y=-a;root.add(g);
  box(g,'gear-tooth',2.38,1.11,0,.15,.18,.35,edge);
 }
 // The front/south sector is genuinely open above the solid geared base.
 for(const degrees of [150,190,230,270,310,350,390]){
  const a=degrees*Math.PI/180,mount=new T.Group();mount.name='radial-weapon-mount';mount.position.set(600/32,0,450/32);mount.rotation.y=-a;root.add(mount);
  box(mount,'radial-spoke',.81,2.03,0,1.5,.10,.10,graphite);
  box(mount,'spindle-collar',.28,2.03,0,.16,.26,.20,edge);
  box(mount,'secured-clamp',1.55,2.03,0,.18,.38,.36,edge);
  box(mount,'mount-recessed-lock',1.55,2.227,0,.14,.014,.24,rubber);
  for(const dz of [-.1,.1])box(mount,'mount-lock-fastener',1.55,2.24,dz,.04,.012,.035,pale);
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
