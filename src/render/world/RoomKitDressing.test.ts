import {SHIP_ARCHITECTURE_LAYOUTS} from '../../game/roguelike/shipArchitectureLayouts';
import {beforeAll,describe,expect,it,vi} from 'vitest';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {buildRoomKitDressing,type KitPlacement} from './RoomKitDressing';
import {kitBoundsSupported,kitMarineSamples,kitOccludesMarine,kitSupported} from './KitSafety';
import {CAMERA_OFFSET_Y,CAMERA_OFFSET_Z} from '../camera/CameraRig';
import {disposeModel} from '../meshParts';
import type {ShipEnvironment} from '../ShipEnvironments';

const sources:T.Group[]=[];
beforeAll(async()=>{
 for(const pack of ['kenney-space-station','kenney-furniture','kenney-nature','quaternius-scifi-essentials']){
  const bytes=await readFile(`public/assets/kits/${pack}/kit.glb`);
  sources.push((await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'' )).scene);
 }
});
describe('CC0 room dressing safety and lifecycle',()=>{
 it.each([...ROOM_STORY_ROUTE.map(r=>[r.templateId,r.environment] as const),['reactor-vault','reactor'] as const])('%s preserves topology and every added solid protects navigation and marine sightlines',(id,env)=>{
  const t=ROOM_TEMPLATES[id],before=JSON.stringify(t),world=new T.Group(),root=buildRoomKitDressing(world,t,env as ShipEnvironment,id,sources),placements=root.userData.placements as KitPlacement[],samples=kitMarineSamples(t);
  expect(JSON.stringify(t)).toBe(before);expect(placements.length).toBeGreaterThan(4);expect(root.children.length).toBeLessThanOrEqual(8);
  expect(placements.some(p=>p.purpose.includes('wall'))).toBe(true);expect(samples.length).toBeGreaterThan(50);
  for(const p of placements){const b=new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1]));expect(kitBoundsSupported(t,b),p.model+' support').toBe(true);expect(!kitOccludesMarine(b,samples)||p.meshChecked===true,p.model+' conservative or exact sightline').toBe(true);}
  let triangles=0;
  root.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');triangles+=p.count/3;for(let i=0;i<p.count;i++){expect(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i))).toBe(true);if(p.getY(i)>.024&&p.getY(i)<3)expect(kitSupported(t,p.getX(i),p.getZ(i)),`${id} ${p.getX(i)} / ${p.getZ(i)}`).toBe(true);}expect(o.material).toBeInstanceOf(T.MeshStandardMaterial);expect((o.material as T.MeshStandardMaterial).map).toBeNull();}});
  expect(triangles).toBeLessThan(32000);if(Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,id)){expect(root.userData.floorSurface.aftermath.admitted).toBeGreaterThan(3);expect(root.userData.floorSurface.features['circulation-scuff']).toBeUndefined();}else expect(root.userData.floorSurface.views.every((v:{features:string[]})=>v.features.length>=1)).toBe(true);
  for(const removed of ['route-inlay','bay-inlay','cross-service-channel'])expect(root.userData.floorSurface.features[removed]).toBeUndefined();if(id==='residential-gallery'){
   expect(placements.filter(p=>p.model==='bedSingle'),JSON.stringify(root.userData.rejected)).toHaveLength(6);
   expect(placements.filter(p=>p.model==='desk'),JSON.stringify(root.userData.rejected)).toHaveLength(6);
   expect(placements.filter(p=>p.model==='Prop_Locker'),JSON.stringify(root.userData.rejected)).toHaveLength(18);
  }
  // Actual mesh rays complement the more conservative per-placement box cone.
  world.updateMatrixWorld(true);const ray=new T.Raycaster(),target=new T.Vector3();
  for(const p of samples)for(const height of [.12,.55,1.1,1.6,2.05])for(const lateral of [-8,0,8]){
   target.set(p.x,height,p.z);const origin=target.clone().add(new T.Vector3(lateral,CAMERA_OFFSET_Y,CAMERA_OFFSET_Z));ray.set(origin,target.clone().sub(origin).normalize());ray.far=origin.distanceTo(target)-.01;
   expect(ray.intersectObject(root,true),`${id} marine at ${target.toArray()}`).toHaveLength(0);
  }
  const allocations=new Set<T.BufferGeometry|T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){allocations.add(o.geometry);allocations.add(o.material as T.Material);}});const spies=[...allocations].map(r=>vi.spyOn(r,'dispose'));disposeModel(root);spies.forEach(s=>expect(s).toHaveBeenCalledTimes(1));
 },30000);
 it('rejects a low blocker and foreground marine occluder but permits an inset trench',()=>{
  const t=ROOM_TEMPLATES['residential-gallery'],samples=kitMarineSamples(t);
  expect(kitBoundsSupported(t,new T.Box3(new T.Vector3(3,0,12),new T.Vector3(4,1,13)))).toBe(false);
  expect(kitBoundsSupported(t,new T.Box3(new T.Vector3(3,.01,12),new T.Vector3(4,.023,13)))).toBe(true);
  expect(kitBoundsSupported(t,new T.Box3(new T.Vector3(3,.01,12),new T.Vector3(4,.03,13)))).toBe(false);
  expect(kitOccludesMarine(new T.Box3(new T.Vector3(0,0,27.6),new T.Vector3(37.5,5,28)),samples)).toBe(true);
  const overhead=new T.Box3(new T.Vector3(2,6,-.4),new T.Vector3(8,6.3,1));
  expect(kitBoundsSupported(t,overhead)).toBe(true);expect(kitOccludesMarine(overhead,samples)).toBe(false);
  expect(kitBoundsSupported(t,new T.Box3(new T.Vector3(3,2.8,12),new T.Vector3(4,3.4,13)))).toBe(false);
 });
});
