import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {RoomTemplate} from '../../game/roguelike/types';
import type {ShipEnvironment} from '../ShipEnvironments';
import {retireRoomModels} from '../RoomModelCache';
import {disposeModel} from '../meshParts';
import {equipmentReservations} from './WorldDressing';
import {membraneGeometry} from './OrganicGrowth';
import {ROOM_KIT_STORIES} from './RoomKitStories';
import {buildKitFloorSurface} from './KitFloorSurface';
import {addKitPerimeter} from './KitPerimeter';
import {addKitFootprintClusters} from './KitFootprintClusters';
import {acquireRoomKit,roomKitURLs} from './RoomKitAssets';
import {kitBoundsSupported,kitHull,kitMarineSamples,kitOccludesMarine,kitMeshOccludesMarine,kitOccludesStory} from './KitSafety';

export const KIT_STANDARD_ROOMS=new Set<string>([...ROOM_STORY_ROUTE.map(room=>room.templateId),'reactor-vault']);
export type KitPlacement={model:string;position:number[];size:number[];angle:number;purpose:string;bounds:number[][];meshChecked?:boolean};
export const KIT_PALETTES:Record<ShipEnvironment,readonly number[]>={
 cryogenics:[0x60777e,0x182a32,0x9faeac,0x91cddd,0x44565c],
 habitation:[0x68776d,0x1e2c30,0xa69778,0x87b6bd,0x785953],
 security:[0x53626a,0x172229,0x87928c,0x9fe8ff,0x72544b],
 cargo:[0x716f5c,0x242c2e,0xa18b62,0x8ab6ba,0x765c47],
 communications:[0x384b52,0x101d28,0x6c8388,0x86d9db,0x42515b],
 engineering:[0x6e746b,0x232c30,0xb49661,0x91c7cc,0x8a5d43],
 maintenance:[0x546e67,0x192b2c,0x8a9281,0x89c8bd,0x75644c],
 infested:[0x4d5c51,0x202530,0x7a7a61,0x789d6e,0x694452],
 containment:[0x7c8791,0x26303c,0xadb6ba,0xa2cbe4,0x61566d],
 reactor:[0x64666b,0x242834,0xa79077,0xc79b78,0x704b47],
};
const roles=['body','dark','trim','accent','cloth'];

/** Build merged room-owned scenery from borrowed author geometry, at a preparation boundary only. */
export function buildRoomKitDressing(world:T.Group,t:RoomTemplate,env:ShipEnvironment,id:string,sources:readonly T.Group[]):T.Group {
 const root=new T.Group();root.name='e6-room-kits';root.userData.visualOnly=true;
 const palette=KIT_PALETTES[env],finishes=new Map<string,T.MeshStandardMaterial>(),parts=new Map<string,T.BufferGeometry[]>(),models=new Map<string,T.Object3D>();
 for(const source of sources)for(const child of source.children)models.set(child.name,child);
 const finish=(role:string)=>{
  let m=finishes.get(role);if(m)return m;
  const index=roles.indexOf(role),organic=role==='resin'||role==='scar';
  m=new T.MeshStandardMaterial({color:organic?role==='resin'?0x584151:0x586448:palette[Math.max(0,index)],roughness:organic?.93:.84,metalness:organic?0:role==='trim'?.3:.12});
  m.name='e6-kit-'+role;m.userData.actorMaterial=true;m.userData.kitRole=role;if(role==='conduit'){m.userData.floorDressing=true;m.roughness=1;m.metalness=0;m.vertexColors=true;m.color.setHex(0xffffff);}
  if(role==='accent'){m.emissive.setHex(env==='infested'?0x719a53:0x9fe8ff);m.emissiveIntensity=env==='communications'?.38:.10;m.userData.motivatedEmitter=true;}
  finishes.set(role,m);return m;
 };
 const story=ROOM_KIT_STORIES[id],storyDisplay=world.getObjectByName('g2-world-dressing')?.userData.storyDisplay;let triangleCount=0;
 const placements:KitPlacement[]=[],rejected:{model:string;reason:string}[]=[],samples=kitMarineSamples(t);
 const push=(geometry:T.BufferGeometry,role:string)=>{
  const count=geometry.getAttribute('position').count;triangleCount+=count/3;
  for(const key of Object.keys(geometry.attributes))if(key!=='position'&&key!=='normal'&&!(role==='conduit'&&key==='color'))geometry.deleteAttribute(key);
  if(role==='conduit'&&!geometry.hasAttribute('color')){const c=new T.Color(palette[0]),values=new Float32Array(count*3);for(let i=0;i<count;i++)values.set([c.r,c.g,c.b],i*3);geometry.setAttribute('color',new T.BufferAttribute(values,3));}
  const a=parts.get(role)??[];a.push(geometry);parts.set(role,a);
 };
 const boundsSafe=(b:T.Box3)=>kitBoundsSupported(t,b)&&!kitOccludesMarine(b,samples);
 const place=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,angle=0,purpose='room equipment',override?:string,flat=false,tiltX=0,tiltZ=0)=>{
  const model=models.get(name);if(!model)throw Error('Unknown CC0 model '+name);
  let sourceTriangles=0;model.traverse(o=>{if(o instanceof T.Mesh)sourceTriangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;});
  if(triangleCount+sourceTriangles>30000){rejected.push({model:name,reason:'30000 triangle kit and floor budget'});return false;}
  const original=new T.Box3().setFromObject(model),size=original.getSize(new T.Vector3());
  const scale=flat?new T.Vector3(w/size.x,h/size.y,d/size.z):new T.Vector3(1,1,1).multiplyScalar(Math.min(w/size.x,h/size.y,d/size.z));
  const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(tiltX,angle,tiltZ)),scale);
  const bounds=original.clone().applyMatrix4(matrix);
  if(!kitBoundsSupported(t,bounds)){rejected.push({model:name,reason:'navigation support'});return false;}
  let candidate:T.Object3D|undefined,meshChecked=false;
  const candidateMesh=()=>{if(!candidate){candidate=model.clone(true);candidate.applyMatrix4(matrix);candidate.updateWorldMatrix(true,true);}return candidate;};
  if(kitOccludesMarine(bounds,samples)){
   // The actual silhouette keeps the same body-clearance/ray guarantee without
   // pretending the empty space above a bed's mattress is an opaque box.
   if(!['bedSingle','desk','loungeSofa','wall-window'].includes(name)||kitMeshOccludesMarine(candidateMesh(),bounds,samples)){rejected.push({model:name,reason:'marine sightline'});return false;}
   meshChecked=true;
  }
  if(storyDisplay&&kitOccludesStory(candidateMesh(),storyDisplay)){rejected.push({model:name,reason:'authored story display sightline'});return false;}

  model.updateWorldMatrix(true,true);
  model.traverse(o=>{
   if(!(o instanceof T.Mesh))return;
   const materials=Array.isArray(o.material)?o.material:[o.material];
   // glTF splits the five palette primitives into independent meshes.
   if(materials.length!==1)throw Error('kit primitive material array');
   const role=override??materials[0].name;
   const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
   geometry.applyMatrix4(new T.Matrix4().multiplyMatrices(matrix,o.matrixWorld));
   for(const a of Object.keys(geometry.attributes))if(a!=='position'&&a!=='normal')geometry.deleteAttribute(a);
   push(geometry,role);
  });
  placements.push({model:name,position:[x,y,z],size:[w,h,d],angle,purpose,bounds:[bounds.min.toArray(),bounds.max.toArray()],meshChecked});return true;
 };
 const box=(role:string,x:number,y:number,z:number,w:number,h:number,d:number,purpose:string)=>{
  const g=new T.BoxGeometry(w,h,d).translate(x,y,z);g.computeBoundingBox();if(!boundsSafe(g.boundingBox!)){g.dispose();return;}
  push(g.toNonIndexed(),role);g.dispose();placements.push({model:'connection',position:[x,y,z],size:[w,h,d],angle:0,purpose,bounds:[g.boundingBox!.min.toArray(),g.boundingBox!.max.toArray()]});
 };
 const pipe=(a:T.Vector3,b:T.Vector3,r:number,role='dark')=>{
  const g=new T.CylinderGeometry(r,r,a.distanceTo(b),8).applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize())).translate(...a.clone().add(b).multiplyScalar(.5).toArray());g.computeBoundingBox();if(boundsSafe(g.boundingBox!))push(g.toNonIndexed(),role);g.dispose();
 };
 const primary=equipmentReservations(t,id),reservations=primary.length?primary:equipmentReservations(t,'e6-'+id);
 const floor=buildKitFloorSurface(t,env,id,reservations);push(floor.geometry,'conduit');root.userData.floorSurface=floor.proof;
 root.userData.perimeter=addKitPerimeter(t,env,id,{place,box,pipe});
 world.updateWorldMatrix(true,true);
 const supportHeight=(x:number,z:number)=>new T.Raycaster(new T.Vector3(x,12,z),new T.Vector3(0,-1,0)).intersectObject(world,true).find(hit=>hit.point.y>.08)?.point.y??.17;
 root.userData.footprintClusters=addKitFootprintClusters({template:t,environment:env,roomId:id,reservations,place,placeTilted:place,supportHeight});
 // Infrastructure is physically attached at each end; intervening navigation crossings are inset into the deck.
 for(const [i,r] of reservations.slice(0,8).entries()){
  const x=(r.x+r.width*.5)/32,z=(r.y+r.height*.5)/32,rw=r.width/32,rd=r.height/32;
  const hull=kitHull(t),candidates=hull.map((a,j)=>{const b=hull[(j+1)%hull.length],av=new T.Vector2(a.x/32,a.y/32),delta=new T.Vector2((b.x-a.x)/32,(b.y-a.y)/32),f=T.MathUtils.clamp(new T.Vector2(x,z).sub(av).dot(delta)/delta.lengthSq(),0,1),p=av.addScaledVector(delta,f);return {p,d:p.distanceTo(new T.Vector2(x,z))};}).sort((a,b)=>a.d-b.d);
  const crossing=hull.flatMap((a,j)=>{const b=hull[(j+1)%hull.length];if((a.y/32>z)===(b.y/32>z))return [];return [a.x/32+(b.x-a.x)/32*(z-a.y/32)/((b.y-a.y)/32)];}).sort((a,b)=>a-b);
  const nearest=crossing.length?new T.Vector2(i%2?crossing[crossing.length-1]:crossing[0],z):candidates[0].p;
  // L-shaped flat tray spans machine → actual hull, never an overhead playfield obstruction.
  const bend=new T.Vector2(nearest.x,z),mid=new T.Vector2(x,z).lerp(bend,.5);
  box('conduit',mid.x,.027,z,Math.abs(x-nearest.x)+.08,.007,.34,'machine-to-wall cable trench');
  box('conduit',nearest.x,.027,(z+nearest.y)/2,.34,.007,Math.abs(z-nearest.y)+.08,'wall return trench');
  if(env==='infested'||id==='breached-loading-bay'||id==='reactor-vault'){
   // Author rocks flattened into one dark connective skin; raised masses continue only over architecture.
   const path=[new T.Vector3(x,.025,z),new T.Vector3(x+(nearest.x-x)*.36,.025,z+.5),new T.Vector3(x+(nearest.x-x)*.72,.025,z+.22),new T.Vector3(nearest.x,.025,nearest.y)];
   const skin=membraneGeometry(path,.34,.003,undefined,24);skin.computeBoundingBox();if(boundsSafe(skin.boundingBox!)){push(skin.toNonIndexed(),'resin');}skin.dispose();
  }
  // Every story has one deliberate service interruption. It is composed as a
  // supported cluster; no case/chair is scattered into a circulation lane.
  // Preserve loaded hero/clinical landmarks; kit vignettes sit on their original roof footprints.
  const replace=env==='habitation';
  let roof=replace?.17:.2;
  if(!replace){world.updateWorldMatrix(true,true);const ray=new T.Raycaster(new T.Vector3(x,12,z),new T.Vector3(0,-1,0));roof=ray.intersectObject(world,true).find(hit=>hit.point.y>.15)?.point.y??.2;}
  if((i===0&&id!=='transmission-chamber'||i===1&&id==='transmission-chamber')&&story&&env!=='containment'&&env!=='reactor'&&env!=='infested'&&id!=='service-shaft-landing'){
   const anchorY=env==='habitation'?.17:roof+.02;
   for(const [n,name] of story.props.entries()){
    const px=x+(n-1)*Math.min(rw*.23,.75),pz=z+rd*.22;
    const small=name==='Prop_Mug'||name==='Prop_Ammo'||name==='Prop_Ammo_Closed';
    const support=env==='habitation'?anchorY:new T.Raycaster(new T.Vector3(px,12,pz),new T.Vector3(0,-1,0)).intersectObject(world,true).find(hit=>hit.point.y>.08)?.point.y??.17;
    place(name,px,support+.015,pz,small?.45:rw*.32,small?.32:.92,small?.38:rd*.35,n===1?.16:n===2?-.23:0,story.idea);
   }
  }
  if(env==='habitation'){
   box('dark',x,.08,z,rw-.08,.16,rd-.08,'cabin foundation inside original reservation');
   place('wall-window',x,.17,z-rd*.27,rw*.94,.85,.20,0,'cabin bulkhead behind interrupted domestic scene',undefined,true);
   if(i%2===0){
    place('bedSingle',x-rw*.22,.17,z+rd*.08,rw*.45,.9,Math.min(2.3,rd*.68),0,'arrival berth left made');
    place('desk',x+rw*.20,.17,z-rd*.08,rw*.40,.85,rd*.28,0,'interrupted domestic desk');
    place('radio',x+rw*.20,1.04,z-rd*.08,.42,.28,.24,0,'radio still waiting for arrival');
    place('chairDesk',x+rw*.19,.17,z+rd*.16,.65,.85,.65,.24,'chair pulled from desk');
   }else{
    place('loungeSofa',x,.17,z-rd*.23,rw*.88,1.05,rd*.42,0,'abandoned cabin sitting area');
    place('cardboardBoxOpen',x-rw*.22,.17,z+rd*.25,.75,.65,.75,.12,'opened colony arrival box');
    place('books',x+rw*.17,.17,z+rd*.26,.65,.28,.4,-.2,'unpacked belongings');
   }
   place('pillow',x-rw*.27,.18,z+rd*.28,.5,.24,.42,.3,'dropped blanket and pillow');
  }else if(env==='communications'){
   // Long rack rows are authored cabinets and offset service desks, rather than one display per island.
   for(let n=0;n<1;n++)place('computer-system',x+(rw>rd?(n-1)*rw*.28:0),roof,z+(rd>=rw?(n-1)*rd*.28:0),rw>rd?rw*.27:rw*.90,1.35,rd>=rw?rd*.27:rd*.90,rd>=rw?Math.PI/2:0,n===1&&i===0?'removed relay cassette service gap':'linked relay equipment');
   place('computer-wide',x,roof+.85,z,Math.min(rw*.85,2.4),.8,Math.min(rd*.8,1.1),0,'local relay console');
   if(i===0)place('container-flat-open',x,roof,z+rd*.28,rw*.58,.5,rd*.25,.08,'interrupted cassette replacement');
  }else if(env==='infested'||id==='reactor-vault'){
   place('rock_largeD',x,.17,z,rw*.66,1.15,rd*.66,.12,'growth consumes machine foundation','resin',true);
   place(i%2?'rock_largeD':'rock_largeA',x-rw*.10,Math.max(.1,roof-.28),z+rd*.10,rw*.94,.72,rd*.86,i*.6,'growth consumes machine supports','resin');
   place('rock_smallTopA',x+rw*.23,roof+.1,z-rd*.2,rw*.30,.45,rd*.3,0,'acid vesicle in engulfed machine','scar');
   for(const side of [-1,1]){const path=[new T.Vector3(x,roof+.28,z),new T.Vector3(x+side*rw*.25,roof+.12,z),new T.Vector3(x+side*rw*.44,Math.max(.12,roof-.35),z)];const g=membraneGeometry(path,Math.min(.6,rd*.18),.04);g.computeBoundingBox();if(boundsSafe(g.boundingBox!)){g.deleteAttribute('uv');push(g.toNonIndexed(),'resin');}g.dispose();}
  }else if(env!=='containment'&&env!=='reactor'&&env!=='engineering'&&id!=='service-shaft-landing'){
   const name=env==='cargo'?'Prop_Crate_Tarp_Large':env==='security'?'container-flat-open':env==='maintenance'?'pipe-ring':env==='cryogenics'?'computer':env==='containment'?'computer-screen':'computer-wide';
   place(name,x,roof+.03,z,Math.min(rw*.78,2.4),.75,Math.min(rd*.76,1.5),i%2?Math.PI/2:0,'interrupted '+env+' service work');
  }
 }
 root.userData.majorCabinForms=placements.filter(p=>p.model==='bedSingle'||p.model==='loungeSofa').length;root.userData.triangles=triangleCount;root.userData.placements=placements;root.userData.rejected=rejected;root.userData.marineSightlineSamples=samples.length;root.userData.visualIdea=story?.idea??id+' / connected infrastructure and interrupted service';root.userData.narrativeVignette=story?.idea;
 for(const [role,list] of parts){const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());if(!geometry)throw Error('kit role merge failed');geometry.computeBoundingBox();geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,finish(role));mesh.name='e6-kit-'+role;mesh.castShadow=role!=='conduit';mesh.receiveShadow=true;mesh.userData.visualOnly=true;root.add(mesh);}
 world.add(root);return root;
}

/** An optional room owner always settles before shader warmup, and never adds late combat geometry. */
export function attachRoomKits(world:T.Group,t:RoomTemplate,env:ShipEnvironment,id:string,onChanged:()=>void,prerequisite:Promise<unknown>=Promise.resolve(),load=acquireRoomKit){
 const controller=new AbortController();let root:T.Group|undefined,replaced:T.Object3D|undefined,active=true,timer:ReturnType<typeof setTimeout>;
 const owner={state:'loading',error:undefined as unknown,ready:Promise.resolve(),dispose(){if(owner.state==='disposed')return;active=false;controller.abort();clearTimeout(timer);if(root){disposeModel(root);root=undefined;}if(replaced)replaced.visible=true;owner.state='disposed';}};
 const work=async()=>{
  const sources:T.Group[]=[];
  try{
   await prerequisite;
   const results=await Promise.allSettled(roomKitURLs(env).map(url=>load(url,controller.signal)));
   for(const result of results)if(result.status==='fulfilled')sources.push(result.value);
   const failure=results.find(result=>result.status==='rejected');if(failure?.status==='rejected')throw failure.reason;
   if(!active)return;
   root=buildRoomKitDressing(world,t,env,id,sources);
   if(env==='habitation'&&id==='residential-gallery'){const original=world.getObjectByName('residential-gallery-equipment');if(original&&root.userData.majorCabinForms>=t.obstacles.length){replaced=original;original.visible=false;}}
   
   owner.state='ready';onChanged();
  }finally{sources.forEach(source=>retireRoomModels(source));}
 };
 const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('CC0 room dressing preparation timed out')),2500);});
 const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Error('CC0 room dressing cancelled')),{once:true}));
 owner.ready=Promise.race([work(),deadline,cancelled]).catch(error=>{owner.error=error;if(active){active=false;controller.abort();if(root){disposeModel(root);root=undefined;}if(replaced)replaced.visible=true;owner.state='fallback';console.error('CC0 room dressing failed',error);}}).finally(()=>clearTimeout(timer));
 return owner;
}
