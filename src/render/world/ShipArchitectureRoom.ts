import * as T from 'three';
import {buildL8ShipSeamGrowth} from './L8ShipSeamGrowth';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {RoomTemplate,Point} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_LAYOUTS,SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {environmentObstacle,shipEnvironment} from '../ShipEnvironments';
import {MAT} from '../meshParts';
import {armoryCarousel} from '../ArmoryCarousel';
import {relayRacksRoom} from '../RelayRacksRoom';
import {act3ShipPresentation,ACT3_PRESENTATION_ROOMS} from './Act3ShipPresentation';
import {act4Architecture} from '../Act4Architecture';
import {manualControlArchitecture} from '../ManualControlBlockout';
import {shipDeckGeometry} from './ShipDeckGeometry';

// The freight crates and uplink racks use six stock finishes. Keep the
// authored emitter strength, since other rooms grade the shared palette.
const rackFinishes = new Map([MAT.steel, MAT.orange, MAT.edge, MAT.black, MAT.bone, MAT.cyan]
  .map(material => [material, material.emissiveIntensity] as const));

function ownRackFinishes(equipment: T.Group): void {
  const owned = new Map<T.MeshStandardMaterial, T.MeshStandardMaterial>();
  equipment.traverse(part => {
    if (!(part instanceof T.Mesh) || !(part.material instanceof T.MeshStandardMaterial)) return;
    const source = part.material;
    const intensity = rackFinishes.get(source);
    if (intensity === undefined) return;
    let finish = owned.get(source);
    if (!finish) {
      // A room gets freshly prepared finishes even after a previous room has
      // installed graphics hooks on the palette. The existing rigid batcher
      // retains the original mesh transforms and collision partitions.
      finish = source.clone();
      finish.emissiveIntensity = intensity;
      finish.userData.actorMaterial = true;
      owned.set(source, finish);
    }
    part.material = finish;
  });
}

/** One template-driven deck/bulkhead family, batched at the room boundary.
 * Cutaway heights keep foreground walls below bodies. Solids never overhang
 * their collision polygons; external ribs sit outside the authored hull. */
export const BESPOKE_SHIP_ROOMS=new Set(['awakening-bay','passenger-vault','communal-atrium','service-shaft-landing','containment-annulus','overload-floor','breached-loading-bay']);
export function shipArchitectureRoom(id:string,t:RoomTemplate):T.Group|null {
  if(!Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,id)||BESPOKE_SHIP_ROOMS.has(id))return null;
  const root=new T.Group();root.name='l8-ship-architecture';
  const environment=shipEnvironment(id)!;
  const act4Room=['swarm-junction','shielding-gate','manual-control-chamber'].includes(id),authoredFixtures=ACT3_PRESENTATION_ROOMS.has(id)||act4Room;
  const material=(name:string,color:number,metalness=.2)=>{
    const m=new T.MeshStandardMaterial({color,metalness,roughness:.83});
    m.name=name;m.userData.actorMaterial=true;return m;
  };
  const deck=material('painted-steel-deck',environment==='habitation'?0x646861:0x46565c);
  const steel=material('ship-bulkhead',environment==='habitation'?0x6f7568:0x55646b,.45);
  const cutaway=material('ship-interior-cutaway',0x758990,.35);cutaway.vertexColors=true;
  const dark=material('ship-bulkhead-recess',0x17232b);
  const trim=material('ship-bulkhead-ribs',0x85908b,.55);
  const practical=material(environment==='habitation'?'ship-warm-practical':'ship-cold-practical',environment==='habitation'?0xe4b37b:0x9bc7d2);
  practical.emissive.copy(practical.color);practical.emissiveIntensity=.65;practical.userData.motivatedEmitter=true;
  const batches=new Map<T.Material,T.BufferGeometry[]>();
  const push=(g:T.BufferGeometry,m:T.Material)=>{const flat=g.index?g.toNonIndexed():g.clone();g.dispose();if(m===cutaway){const normal=flat.getAttribute('normal'),values=new Float32Array(normal.count*3);for(let i=0;i<normal.count;i++){const v=normal.getY(i)>.5?1.15:normal.getZ(i)>.35?.38:.72;values.set([v,v,v],i*3);}flat.setAttribute('color',new T.BufferAttribute(values,3));}const a=batches.get(m)??[];a.push(flat);batches.set(m,a);};
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,angle=0)=>push(new T.BoxGeometry(w,h,d).rotateY(angle).translate(x,y,z),m);
  const hull=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
  const path=(p:readonly Point[])=>p.map(v=>new T.Vector2(v.x/32,-v.y/32));
  push(shipDeckGeometry(t),deck);
  root.userData.lightFixtures=[];
  // Winding in game XY is clockwise. The left normal is exterior in render XZ.
  for(let i=0;i<hull.length;i++){
    const a=hull[i],b=hull[(i+1)%hull.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);
    const nx=dz/length,nz=-dx/length,midX=(a.x+b.x)/64,midZ=(a.y+b.y)/64;
    const height=dx>0?1.65:dx<0?.48:.85;
    box(midX+nx*.15,height/2,midZ+nz*.15,length,height,.30,steel,angle);
    box(midX+nx*.15,height+.025,midZ+nz*.15,length,.05,.32,trim,angle);
    const count=Math.max(1,Math.ceil(length/3.8));
    for(let j=0;j<count;j++){
      const f=(j+.5)/count,x=(a.x+(b.x-a.x)*f)/32,z=(a.y+(b.y-a.y)*f)/32;
      box(x+nx*.24,height/2,z+nz*.24,.16,height,.24,dark,angle);
      if(dx<=0||authoredFixtures||['residential-gallery','crew-checkpoint','relay-racks'].includes(id))continue;
      box(x+nx*.02,height-.16,z+nz*.02,Math.min(1.1,length/count*.4),.08,.08,practical,angle);
      root.userData.lightFixtures.push({x:x+nx*.02,y:height-.16,z:z+nz*.02,color:practical.emissive.getHex(),nativeColor:true,poolStyle:1,poolAngle:angle,poolWidth:.35,poolDepth:5,gain:.55});
    }
  }
  // Partitions are sealed wall ribbons; unlike scenery boxes their top and
  // sides reproduce the exact polygon, including L-shaped control booths.
  for(const p of t.voids??[]){
    const wallShape=new T.Shape(path(p));
    const wall=new T.ExtrudeGeometry(wallShape,{depth:.90,bevelEnabled:false,steps:1,curveSegments:1});wall.rotateX(-Math.PI/2);push(wall,cutaway);
    for(let i=0;i<p.length;i++){
      const a=p[i],b=p[(i+1)%p.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz);
      if(length<1)continue;
      for(let s=.4;s<length-.1;s+=.8){
       const f=s/length,x=(a.x+(b.x-a.x)*f)/32,z=(a.y+(b.y-a.y)*f)/32;
       box(x,.40,z,.045,.68,.045,dark);
       if(environment==='security')box(x,.83,z,.035,.12,.035,trim);
      }
      box((a.x+b.x)/64,.89,(a.y+b.y)/64,length,.04,.04,trim,-Math.atan2(dz,dx));
    }
  }
  const fixture=(x:number,z:number,angle:number,width:number,depth:number,color:number,gain=1,y=1.30)=>{
   box(x,y-.045,z,1.65,.16,.20,dark,angle);box(x,y,z,1.45,.07,.08,gain<.2?dark:practical,angle);
   // A failed diffuser remains dark instead of inventing a round task-light pool.
   root.userData.lightFixtures.push({x,y,z,color,nativeColor:true,poolStyle:1,poolAngle:angle,poolWidth:width,poolDepth:depth,gain});
  };
  if(id==='residential-gallery'){
   for(const [i,x]of [216,600,984].entries()){
    fixture(x/32,.12,0,.85,8.4,0xe8bc87,i===2?.14:1);
    fixture(x/32,(t.height-4)/32,Math.PI,.65,6.8,0xc6d9df,i===1?.28:.55);
   }
  }else if(id==='crew-checkpoint'){
   fixture(360/32,84/32,0,.4,6,0xd5e5ea,1);fixture(360/32,796/32,Math.PI,.35,5,0xd2dbdc,.38);
   fixture(800/32,84/32,0,.35,7,0xe8b486,.62);fixture(1084/32,440/32,-Math.PI/2,.4,6,0xbddce3,.75);
  }else if(id==='relay-racks'){
   fixture(196/32,170/32,-Math.PI/2,.4,8,0x89cad5,.82);fixture(1084/32,170/32,Math.PI/2,.4,8,0x9be0d2,.42);
   fixture(640/32,964/32,Math.PI,.55,8,0x9cc8c6,1);fixture(640/32,304/32,Math.PI,.4,6,0xc1e6dc,.48);
  }
  if(id==='swarm-junction'){
   const plan=SHIP_ARCHITECTURE_PLANS['swarm-junction']!;
   for(const [i,f]of plan.breachFeatures.entries())fixture(f.at.x/32,f.at.y/32,i<2?0:Math.PI,.30,i<2?6:4.5,0xa5c8bc,[.85,.14,.26,.38][i],.84);
  }else if(id==='shielding-gate'){
   const north=t.obstacles[0],south=t.obstacles[2];
   fixture((north.x+north.width/2)/32,(north.y+north.height-2)/32,0,.35,7,0xbad7db,1,.84);
   fixture((south.x+south.width/2)/32,(south.y+2)/32,Math.PI,.30,6,0xc8ad88,.38,.84);
   fixture((t.width-4)/32,480/32,-Math.PI/2,.30,5,0xb9cecc,.46,.84);
  }else if(id==='manual-control-chamber'){
   fixture(640/32,.12,0,.40,8,0xe0b58a,.92);
   fixture((t.width-4)/32,520/32,-Math.PI/2,.30,5,0xd3b08a,.36,.84);
   fixture(164/32,840/32,Math.PI/2,.30,4,0xb5ccca,.24,.84);
  }
  for(const [m,parts]of batches){const merged=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());const mesh=new T.Mesh(merged,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
  for(const material of [deck,steel,cutaway,dark,trim,practical])if(!batches.has(material))material.dispose();
  const act3=act3ShipPresentation(id,t);if(act3){root.userData.lightFixtures.push(...act3.userData.lightFixtures??[]);delete act3.userData.lightFixtures;root.add(act3);}
  const act4=act4Architecture(id,t,undefined,SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS]);if(act4)root.add(act4);
  if(id==='manual-control-chamber'){
   const northY=Math.min(...hull.map(p=>p.y)),north=hull.filter(p=>p.y===northY),left=Math.min(...north.map(p=>p.x)),right=Math.max(...north.map(p=>p.x));
   const shell=new T.Group();shell.name='manual-control-template-observation';shell.position.set(left/32,0,northY/32);manualControlArchitecture(shell,(right-left)/32);root.add(shell);
  }
  if(id==='relay-racks')root.add(relayRacksRoom(false,t));
  else if(id==='armory')root.add(armoryCarousel());
  else if(!act3?.userData.replacesGenericObstacles){
    const equipment=new T.Group();equipment.name=id==='residential-gallery'?'residential-gallery-equipment-fallback':'l8-equipment';root.add(equipment);
    for(const [i,r]of t.obstacles.entries()){
      if(id==='residential-gallery'||id==='crew-checkpoint'){
       const h=id==='residential-gallery'?.10:.90;
       const g=new T.BoxGeometry(r.width/32,h,r.height/32).translate((r.x+r.width/2)/32,h/2,(r.y+r.height/2)/32);
       const mesh=new T.Mesh(g,dark.clone());mesh.material.userData.actorMaterial=true;mesh.name='cutaway-equipment-plinth';mesh.castShadow=mesh.receiveShadow=true;equipment.add(mesh);
      }else {
       const model=environmentObstacle(environment,{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},i,id);
       model.updateMatrixWorld(true);const sourceHeight=new T.Box3().setFromObject(model).max.y;
       // Live hull machinery uses the same low cutaway datum as partitions.
       // Keep the shared source owner, footprint, palette and legacy builder.
       if(sourceHeight>.91)model.scale.y*=.91/sourceHeight;
       model.userData.cutawaySourceHeight=sourceHeight;model.userData.cutawayHeight=.91;equipment.add(model);
      }
    }
    if (id === 'freight-hold' || id === 'transmission-chamber') ownRackFinishes(equipment);
  }
  const growth=buildL8ShipSeamGrowth(id,t);if(growth)root.add(growth);
  root.userData.templateArchitecture=true;
  return root;
}
