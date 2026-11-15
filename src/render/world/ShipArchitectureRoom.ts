import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {RoomTemplate,Point} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_LAYOUTS} from '../../game/roguelike/shipArchitectureLayouts';
import {environmentObstacle,shipEnvironment} from '../ShipEnvironments';
import {armoryCarousel} from '../ArmoryCarousel';
import {relayRacksRoom} from '../RelayRacksRoom';

/** One template-driven deck/bulkhead family, batched at the room boundary.
 * Cutaway heights keep foreground walls below bodies. Solids never overhang
 * their collision polygons; external ribs sit outside the authored hull. */
export const BESPOKE_SHIP_ROOMS=new Set(['awakening-bay','passenger-vault','communal-atrium','service-shaft-landing','containment-annulus','overload-floor','breached-loading-bay']);
export function shipArchitectureRoom(id:string,t:RoomTemplate):T.Group|null {
  if(!Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,id)||BESPOKE_SHIP_ROOMS.has(id))return null;
  const root=new T.Group();root.name='l8-ship-architecture';
  const environment=shipEnvironment(id)!;
  const material=(name:string,color:number,metalness=.2)=>{
    const m=new T.MeshStandardMaterial({color,metalness,roughness:.83});
    m.name=name;m.userData.actorMaterial=true;return m;
  };
  const deck=material('painted-steel-deck',environment==='habitation'?0x646861:0x46565c);
  const steel=material('ship-bulkhead',environment==='habitation'?0x6f7568:0x55646b,.45);
  const dark=material('ship-bulkhead-recess',0x17232b);
  const trim=material('ship-bulkhead-ribs',0x85908b,.55);
  const practical=material(environment==='habitation'?'ship-warm-practical':'ship-cold-practical',environment==='habitation'?0xe4b37b:0x9bc7d2);
  practical.emissive.copy(practical.color);practical.emissiveIntensity=.65;practical.userData.motivatedEmitter=true;
  const batches=new Map<T.Material,T.BufferGeometry[]>();
  const push=(g:T.BufferGeometry,m:T.Material)=>{const flat=g.index?g.toNonIndexed():g.clone();g.dispose();const a=batches.get(m)??[];a.push(flat);batches.set(m,a);};
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,angle=0)=>push(new T.BoxGeometry(w,h,d).rotateY(angle).translate(x,y,z),m);
  const hull=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
  const path=(p:readonly Point[])=>p.map(v=>new T.Vector2(v.x/32,-v.y/32));
  const shape=new T.Shape(path(hull));for(const p of t.voids??[])shape.holes.push(new T.Path(path(p)));
  const floor=new T.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:false,steps:1,curveSegments:1});floor.rotateX(-Math.PI/2);floor.translate(0,-.30,0);push(floor,deck);
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
      if(dx<=0)continue;
      box(x+nx*.02,height-.16,z+nz*.02,Math.min(1.1,length/count*.4),.08,.08,practical,angle);
      root.userData.lightFixtures.push({x:x+nx*.02,y:height-.16,z:z+nz*.02,color:practical.emissive.getHex()});
    }
  }
  // Partitions are sealed wall ribbons; unlike scenery boxes their top and
  // sides reproduce the exact polygon, including L-shaped control booths.
  for(const p of t.voids??[]){
    const wallShape=new T.Shape(path(p));
    const wall=new T.ExtrudeGeometry(wallShape,{depth:.78,bevelEnabled:false,steps:1,curveSegments:1});wall.rotateX(-Math.PI/2);push(wall,steel);
    for(let i=0;i<p.length;i++){
      const a=p[i],b=p[(i+1)%p.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz);
      if(length<1)continue;
      for(let s=.4;s<length-.1;s+=.8){
       const f=s/length,x=(a.x+(b.x-a.x)*f)/32,z=(a.y+(b.y-a.y)*f)/32;
       box(x,.40,z,.045,.68,.045,dark);
       if(environment==='security')box(x,1.02,z,.035,.48,.035,trim);
      }
      box((a.x+b.x)/64,.79,(a.y+b.y)/64,length,.04,.04,trim,-Math.atan2(dz,dx));
    }
  }
  for(const [m,parts]of batches){const merged=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());const mesh=new T.Mesh(merged,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
  if(id==='relay-racks')root.add(relayRacksRoom(false));
  else if(id==='armory')root.add(armoryCarousel());
  else {
    const equipment=new T.Group();equipment.name=id==='residential-gallery'?'residential-gallery-equipment-fallback':'l8-equipment';root.add(equipment);
    for(const [i,r]of t.obstacles.entries())equipment.add(environmentObstacle(environment,{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},i,id));
  }
  root.userData.templateArchitecture=true;
  return root;
}
