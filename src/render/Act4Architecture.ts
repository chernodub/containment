import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,RoomTemplate} from '../game/roguelike/types';
import {SHIP_ACT4_PLANS} from '../game/roguelike/shipArchitectureAct4';
import type {ShipPlan} from '../game/roguelike/shipArchitecturePlan';

type Plan=Pick<RoomTemplate,'width'|'height'|'obstacles'|'boundary'|'voids'>;
type Palette=Readonly<{shell:T.MeshStandardMaterial;recess:T.MeshStandardMaterial;edge:T.MeshStandardMaterial}>;
/** Act4 presentation only. Housings are built to live collider rectangles;
 * source core/gate/control models stay with their existing asset owners. */
export function act4Architecture(id:string,t:Plan,palette?:Palette,activePlan?:ShipPlan):T.Group|null {
 if(!Object.hasOwn(SHIP_ACT4_PLANS,id))return null;
 const plan=activePlan??SHIP_ACT4_PLANS[id];
 const root=new T.Group();root.name='act4-function-architecture';root.userData.lightFixtures=[];
 const material=(name:string,color:number,metalness:number)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness:.86});m.name=name;m.userData.actorMaterial=true;return m;};
 const own=palette??{shell:material('act4-shielded-housing',id==='overload-floor'?0x66594b:0x66736d,.25),recess:material('act4-service-recess',0x25332f,.12),edge:material('act4-service-edge',id==='swarm-junction'?0x78816a:0x8e9384,.35)};
 const batches=new Map<T.Material,T.BufferGeometry[]>();
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,angle=0)=>{
  const source=new T.BoxGeometry(w,h,d).rotateY(angle).translate(x,y,z),g=source.toNonIndexed();source.dispose();
  const list=batches.get(m)??[];list.push(g);batches.set(m,list);
  (root.userData.parts??=[]).push({name,x,y,z,w,h,d});
 };
 // The sealed passenger housing and reaction-feed/exhaust chambers have broad
 // load-bearing bodies. Repeated inspection lids are modules within one body,
 // never isolated combat cover or stretched generic reactor props.
 if(id==='containment-annulus'||id==='overload-floor')for(const [i,r]of t.obstacles.entries()){
  const x=(r.x+r.width/2)/32,z=(r.y+r.height/2)/32,w=r.width/32,d=r.height/32;
  box('grounded-hull-housing',x,.42,z,w,.84,d,own.shell);
  box('recessed-inspection-course',x,.855,z,w-.12,.03,d-.12,own.recess);
  const modules=Math.max(1,Math.floor(w/2.5)),mw=w/modules;
  for(let j=0;j<modules;j++){
   const px=r.x/32+(j+.5)*mw;
   box('shielded-service-lid',px,.88,z,mw-.16,.04,d-.22,own.shell);
   box('lid-lifting-seam',px,.903,z,.32,.006,.045,own.edge);
   for(const side of[-1,1])box('grounded-housing-rib',px+side*(mw/2-.10),.42,z,.08,.84,d-.04,own.edge);
  }
  const facing=r.y<t.height/2?1:-1,face=(r.y+(facing>0?r.height:0))/32;
  box('service-face-recess',x,.48,face-facing*.018,w-.20,.20,.025,own.recess);
  // A physical narrow diffuser is a fixture origin; no circular floor lamp.
  box('linear-service-diffuser',x,.72,face-facing*.025,Math.min(2.4,w*.25),.055,.025,own.edge);
  root.userData.lightFixtures.push({x,y:.72,z:face-facing*.025,color:id==='overload-floor'?0xe8a36b:0xb8d4ca,nativeColor:true,poolStyle:1,poolAngle:facing>0?0:Math.PI,poolWidth:.35,poolDepth:id==='overload-floor'?5:4,gain:i===0?.65:.30});
 }
 // Each ingress has an actual hull/solid-mounted vent, door or torn flange.
 // Face normals follow the authored breach, so fittings never float on a
 // remembered rectangular shell after the hull changes.
 for(const [i,feature]of plan.breachFeatures.entries()){
  const breach=plan.topology.breaches[i],dx=breach.x-feature.at.x,dz=breach.y-feature.at.y,len=Math.hypot(dx,dz),nx=dx/len,nz=dz/len,angle=-Math.atan2(nx,-nz),x=(feature.at.x-nx*2)/32,z=(feature.at.y-nz*2)/32;
  box('ingress-recess',x,.46,z,.96,.52,.035,own.recess,angle);
  const tear=feature.name.includes('tear');
  for(const side of[-1,1])box(tear?'torn-ingress-flange':'ingress-door-jamb',x-nz*side*.46,.46,z+nx*side*.46,.055,.57,.055,own.edge,angle+(tear?side*.12:0));
  if(!tear)for(const rise of[.28,.40,.52,.64])box('vent-louvre',x,rise,z,.78,.045,.055,own.shell,angle);
 }
 // Doorway seams and airlock sills coincide with authored openings. Interrupted
 // shoulders mark their function while leaving the central combat plane quiet.
 for(const o of plan.openings){
  const dx=o.to.x-o.from.x,dz=o.to.y-o.from.y,len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);
  for(const f of[.12,.88])box('threshold-shoulder',(o.from.x+dx*f)/32,.006,(o.from.y+dz*f)/32,Math.min(24,len*.12)/32,.004,.045,own.edge,angle);
 }
 if(id==='swarm-junction'){
  // Fibres cling to the former ventilation gallery's inward faces and seams;
  // no random scatter, detached nests or invented gameplay blockers.
  const hull=t.boundary!,holes=t.voids??[];
  const inside=(p:Point,a:readonly Point[])=>{let yes=false;for(let i=0,j=a.length-1;i<a.length;j=i++){const u=a[i],v=a[j];if((u.y>p.y)!==(v.y>p.y)&&p.x<(v.x-u.x)*(p.y-u.y)/(v.y-u.y)+u.x)yes=!yes;}return yes;};
  for(const hole of holes)for(let i=0;i<hole.length;i++){
   const a=hole[i],b=hole[(i+1)%hole.length],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz),mx=(a.x+b.x)/2,mz=(a.y+b.y)/2;
   const floor=[-1,1].map(sign=>({x:mx-sign*dz/len*12,y:mz+sign*dx/len*12})).find(q=>inside(q,hull)&&!holes.some(p=>inside(q,p)));
   if(!floor)continue;
   const nx=(floor.x-mx)/12,nz=(floor.y-mz)/12,angle=-Math.atan2(dz,dx);
   for(const rise of[.28,.62])box('seam-bound-growth', (mx-nx*2)/32,rise,(mz-nz*2)/32,Math.max(.1,(len-8)/32),.065,.09,own.recess,angle);
   for(let distance=28;distance<len-14;distance+=64){const f=distance/len;box('growth-clamp',(a.x+dx*f-nx*3)/32,.48,(a.y+dz*f-nz*3)/32,.10,.42,.11,own.edge,angle);}
  }
 }
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;mesh.userData.bakedEnvironment=true;root.add(mesh);}
 // Only construction-owned unused palette entries are ours to release.
 if(!palette)for(const m of Object.values(own))if(!batches.has(m))m.dispose();
 return root;
}
