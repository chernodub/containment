import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {RoomTemplate} from '../../game/roguelike/types';
type Plan=Pick<RoomTemplate,'width'|'height'|'boundary'|'voids'|'obstacles'>;
/** Hull-backed cryo distribution and galley cupboards. Exact live reservations,
 * sealed waist-height casings; no scenery boxes in circulation. */
export function act1ShipPresentation(id:string,t:Plan):T.Group|null {
 if(!['awakening-bay','passenger-vault','communal-atrium'].includes(id)||(t.boundary?.length??0)<=8)return null;
 const root=new T.Group();root.name='l8-act1-presentation';
 const mat=(name:string,color:number,metalness=.4)=>{const m=new T.MeshStandardMaterial({name,color,metalness,roughness:.84});m.userData.actorMaterial=true;return m;};
 const steel=mat('act1-captive-casing',id==='communal-atrium'?0x626156:0x54676b),recess=mat('act1-service-recess',0x1c2c32),trim=mat('act1-service-joints',0x86928c),lamp=mat('ship-cold-practical',0xa4c4ca);
 lamp.emissive.setHex(id==='communal-atrium'?0xc79a68:0x8bbfc8);lamp.emissiveIntensity=.6;
 const bins=new Map<T.Material,T.BufferGeometry[]>(),add=(g:T.BufferGeometry,m:T.Material)=>{const flat=g.index?g.toNonIndexed():g;if(g!==flat)g.dispose();const a=bins.get(m)??[];a.push(flat);bins.set(m,a);};
 const box=(x:number,z:number,w:number,d:number,h:number,m:T.Material,y=h/2,angle=0)=>add(new T.BoxGeometry(w,h,d).rotateY(angle).translate(x,y,z),m);
 for(const r of t.obstacles){
  const x=(r.x+r.width/2)/32,z=(r.y+r.height/2)/32,w=r.width/32,d=r.height/32;
  box(x,z,w,d,.86,steel);box(x,z,w-.05,d-.05,.025,trim,.879);
  const step=Math.max(1,Math.ceil(w/1.5));for(let i=0;i<step;i++){
   const xx=x-w/2+(i+.5)*w/step;
   box(xx,z,w/step-.12,Math.max(.03,d-.14),.016,recess,.9);
   if(w/step>.4&&d>.6)box(xx,z-d/2+.18,Math.min(.5,w/step-.2),.04,.012,lamp,.916);
  }
 }
 if(id==='passenger-vault')for(const [i,a]of t.boundary!.entries()){
  const b=t.boundary![(i+1)%t.boundary!.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,len=Math.hypot(dx,dz),h=dx>0?1.25:.46;
  box((a.x+b.x)/64,(a.y+b.y)/64,len,.14,h,steel,h/2,-Math.atan2(dz,dx));
 }
 const fixtures:unknown[]=[];
 const source=(x:number,z:number,angle:number,color:number,gain:number)=>{
  box(x,z,1.6,.15,.12,recess,1.24,angle);box(x,z,1.4,.045,.035,lamp,1.3,angle);
  fixtures.push({x,y:1.3,z,color,nativeColor:true,poolStyle:1,poolAngle:angle,poolWidth:.45,poolDepth:7,gain});
 };
 if(id==='awakening-bay'){source(640/32,240/32,0,0x8dbdc8,1);source(80/32,780/32,-Math.PI/2,0xc6aa86,.3);}
 else if(id==='passenger-vault'){source(420/32,360/32,0,0x97c8ce,.9);source(780/32,620/32,Math.PI,0x87abae,.35);}
 else {source(340/32,170/32,0,0xe4b787,1);source(760/32,180/32,-Math.PI/2,0xa9c4bc,.4);source(1248/32,280/32,0,0xdd8d5f,.25);}
 for(const [m,parts]of bins){const g=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());const mesh=new T.Mesh(g,m);mesh.userData.bakedEnvironment=true;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
 root.userData.lightFixtures=fixtures;return root;
}
