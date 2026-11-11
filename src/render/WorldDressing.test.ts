import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {addWorldDressing,updateWorldDressing} from './world/WorldDressing';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';
import {disposeModel} from './meshParts';

function platformWorld(template:typeof ROOM_TEMPLATES['armory']){
 const root=new T.Group();
 for(const r of template.obstacles){const mesh=new T.Mesh(new T.BoxGeometry(r.width/32,1,r.height/32),new T.MeshStandardMaterial());mesh.position.set((r.x+r.width/2)/32,.5,(r.y+r.height/2)/32);root.add(mesh);}
 return root;
}
function arrays(root:T.Object3D){const all:number[][]=[];root.traverse(o=>{if(o instanceof T.Mesh)all.push(Array.from(o.geometry.attributes.position.array));});return all;}
function inside(x:number,z:number,polygon:readonly {x:number;y:number}[]){let value=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)value=!value;}return value;}

describe('G2 deterministic world dressing',()=>{
 it.each(ROOM_STORY_ROUTE.map(room=>[room.templateId,room.environment] as const))('%s retains its topology and bounds the material/triangle inventory', (id,environment)=>{
  const template=ROOM_TEMPLATES[id],before=JSON.stringify(template),world=platformWorld(template),root=addWorldDressing(world,template,environment,id,1729);
  expect(JSON.stringify(template)).toBe(before);expect(root.userData.visualIdea).toBeTruthy();expect(root.children.length).toBeLessThanOrEqual(7);
  let triangles=0;root.traverse(o=>{if(o instanceof T.Mesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;expect((o.material as T.Material).userData.actorMaterial).toBe(true);expect(Array.from(o.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);}});
  expect(triangles).toBeLessThan(12000);
  // All raised fitting vertices remain over the original nonwalkable solids,
  // including authored sealed polygons used by passenger rows and the carousel.
  root.traverse(object=>{
   if(!(object instanceof T.Mesh))return;
   const positions=object.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){
    if(positions.getY(i)<=.08)continue;
    const x=positions.getX(i)*32,z=positions.getZ(i)*32;
    const supported=template.obstacles.some(r=>x>=r.x-.01&&x<=r.x+r.width+.01&&z>=r.y-.01&&z<=r.y+r.height+.01)||!!template.voids?.some(polygon=>inside(x,z,polygon));
    expect(supported,`${object.name} ${x}/${z} at ${positions.getY(i)}`).toBe(true);
   }
  });
  disposeModel(root);for(const child of world.children)if(child instanceof T.Mesh){child.geometry.dispose();(child.material as T.Material).dispose();}
 });
 it('keeps sixteen frosted observation windows inside sealed passenger rows and retires their texture',()=>{
  const t=ROOM_TEMPLATES['passenger-vault'],world=platformWorld(t),root=addWorldDressing(world,t,'cryogenics',t.id,3);
  expect(root.userData.occupiedWindows).toBe(16);
  const display=root.getObjectByName('g2-dressing-display') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
  expect(display.material.map).toBeInstanceOf(T.DataTexture);expect(display.material.roughness).toBeLessThan(.3);
  const texture=display.material.map!,image=texture.image as {width:number;height:number;data:Uint8Array};
  expect(image.width*image.height).toBeLessThanOrEqual(32768);expect(new Set(image.data).size).toBeGreaterThan(20);
  const dispose=vi.spyOn(texture,'dispose');disposeModel(root);expect(dispose).toHaveBeenCalledTimes(1);
 });
 it('roots every bounded wet patch in a visible machine outlet',()=>{
  const t=ROOM_TEMPLATES['coolant-plant'],world=platformWorld(t),root=addWorldDressing(world,t,'maintenance',t.id,3);
  const positions=root.userData.leakPositions as Array<{x:number;z:number}>;
  expect(positions.length).toBeGreaterThan(0);expect(positions.length).toBeLessThanOrEqual(3);
  for(const p of positions)expect(t.obstacles.some(r=>Math.abs(p.x*32-r.x)<8&&p.z*32>r.y&&p.z*32<r.y+r.height)).toBe(true);
  disposeModel(world);
 });
 it('owns one generated diagnostic display and retires its image with the room',()=>{
  const template=ROOM_TEMPLATES['diagnostic-gallery'],world=platformWorld(template),root=addWorldDressing(world,template,'engineering',template.id,1729);
  expect(root.userData.displayText).toEqual(['INDEPENDENT DIAGNOSTIC','OCCUPIED CRYO DECKS','PURGE IS FATAL']);
  const mesh=root.getObjectByName('g2-dressing-display') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>,texture=mesh.material.map!;
  expect(texture).toBeInstanceOf(T.DataTexture);expect(mesh.material.emissiveMap).toBe(texture);const image=texture.image as {width:number;height:number};expect(image.width*image.height).toBeLessThanOrEqual(65536);
  const retired=vi.spyOn(texture,'dispose');disposeModel(root);expect(retired).toHaveBeenCalledTimes(1);
 });
 it('same room seed reproduces every fitting while a new seed changes clutter',()=>{
  const t=ROOM_TEMPLATES['infested-workshop'],a=platformWorld(t),b=platformWorld(t),c=platformWorld(t);
  const first=addWorldDressing(a,t,'infested',t.id,1729),same=addWorldDressing(b,t,'infested',t.id,1729),different=addWorldDressing(c,t,'infested',t.id,1730);
  expect(arrays(first)).toEqual(arrays(same));expect(arrays(first)).not.toEqual(arrays(different));
  for(const root of [a,b,c])disposeModel(root);
 });
 it('pulses retained material only, freezes reduced motion, and retires every room allocation once',()=>{
  const t=ROOM_TEMPLATES['infested-workshop'],world=platformWorld(t),root=addWorldDressing(world,t,'infested',t.id,3),material=root.userData.pulseMaterial as T.MeshStandardMaterial;
  const resources=new Set<T.BufferGeometry|T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);resources.add(o.material as T.Material);}});
  const spies=[...resources].map(resource=>vi.spyOn(resource,'dispose')),oldArrays=arrays(root),count=root.children.length;
  updateWorldDressing(world,1);expect(material.emissiveIntensity).not.toBe(root.userData.growthIntensity);
  updateWorldDressing(root,90,true);expect(material.emissiveIntensity).toBe(root.userData.growthIntensity);expect(root.children.length).toBe(count);expect(arrays(root)).toEqual(oldArrays);
  disposeModel(root);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
});
