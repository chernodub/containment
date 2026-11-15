import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import type {RoomTemplate} from '../../game/roguelike/types';
import {addMountedIngress,mountedIngressHasBacking,mountedIngressContainsVertex,ACT4_MOUNTED_INGRESS} from './MountedIngress';
import {disposeModel} from '../meshParts';
const rooms=ROOM_STORY_ROUTE.filter(r=>!ACT4_MOUNTED_INGRESS.has(r.templateId));
function fixture(){
 const materials={steel:new T.MeshStandardMaterial({name:'steel'}),dark:new T.MeshStandardMaterial({name:'dark'}),signal:new T.MeshStandardMaterial({name:'signal'})},root=new T.Group(),counts=new Map<T.Material,number>();
 const writer={vertexCount:(m:T.Material)=>counts.get(m)??0,box(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle=0){const source=new T.BoxGeometry(w,h,d),g=source.toNonIndexed();source.dispose();g.rotateY(angle).translate(x,y,z);counts.set(m,(counts.get(m)??0)+g.attributes.position.count);root.add(new T.Mesh(g,m));}};
 for(const m of Object.values(materials))m.userData.actorMaterial=true;
 return {root,materials,writer};
}
function physicalSupport(t:RoomTemplate){
 const root=new T.Group(),m=new T.MeshBasicMaterial({side:T.DoubleSide});m.userData.actorMaterial=true;
 for(const p of [...t.obstacles.map(r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}]),...(t.voids??[])]){
  const shape=new T.Shape(p.map(p=>new T.Vector2(p.x/32,-p.y/32))),g=new T.ExtrudeGeometry(shape,{depth:.90,bevelEnabled:false,steps:1}).rotateX(-Math.PI/2);root.add(new T.Mesh(g,m));
 }
 const hull=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];
 // Hull support is two-sided here: actual exposed-face selection, not mesh
 // winding, determines the playable inward side. Its face stays exactly at t.
 for(let i=0;i<hull.length;i++){
  const a=hull[i],b=hull[(i+1)%hull.length],len=Math.hypot(b.x-a.x,b.y-a.y),shape=new T.BufferGeometry().setFromPoints([new T.Vector3(a.x/32,0,a.y/32),new T.Vector3(b.x/32,0,b.y/32),new T.Vector3(b.x/32,.90,b.y/32),new T.Vector3(a.x/32,.90,a.y/32)]);shape.setIndex([0,1,2,0,2,3]);if(len)root.add(new T.Mesh(shape,m));
 }
 root.updateMatrixWorld(true);return root;
}
describe('actual mounted ship ingress',()=>{
 it('owns fifteen room fitting sets without replacing five Act4 owners or legacy',()=>{
  expect(rooms).toHaveLength(15);
  for(const id of [...ACT4_MOUNTED_INGRESS,'reactor-vault','receiving']){const f=fixture();expect(addMountedIngress(id,ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],f.writer,f.materials)).toEqual([]);expect(f.root.children).toHaveLength(0);Object.values(f.materials).forEach(m=>m.dispose());}
 });
 it.each(rooms.map(r=>r.templateId))('%s roots all four distinct ingress fittings on actual exposed faces',id=>{
  const t=ROOM_TEMPLATES[id],plan=SHIP_ARCHITECTURE_PLANS[id]!,before=JSON.stringify({t,plan}),f=fixture(),fittings=addMountedIngress(id,t,f.writer,f.materials),support=physicalSupport(t);
  expect(fittings.map(f=>f.index),JSON.stringify(fittings.map(f=>f.name))).toEqual([0,1,2,3]);expect(JSON.stringify({t,plan})).toBe(before);
  let meshIndex=0;
  for(const mount of fittings){
   expect(mount.name).toBe(plan.breachFeatures[mount.index].name);expect(mountedIngressHasBacking(t,mount)).toBe(true);expect(Math.hypot(mount.center.x-mount.at.x,mount.center.y-mount.at.y)).toBeLessThanOrEqual(64);
   let embedded=false;
   for(const part of mount.parts){
    const mesh=f.root.children[meshIndex++] as T.Mesh,p=mesh.geometry.attributes.position;expect(Object.values(f.materials)).toContain(mesh.material);expect(part.end-part.start).toBe(36);
    for(let i=0;i<p.count;i++){
     const point=[p.getX(i),p.getY(i),p.getZ(i)];expect(mountedIngressContainsVertex(mount,point),mount.name+' fitted envelope').toBe(true);
     const n=(point[0]*32-mount.center.x)*mount.normal.x/32+(point[2]*32-mount.center.y)*mount.normal.y/32;if(n<-.01)embedded=true;
    }
   }
   expect(embedded,mount.name+' physically embedded backing').toBe(true);
   // Native Three triangles complement the polygon proof. Both lateral corners
   // and the middle must ray-hit the actual hull/solid at the mounting plane.
   for(const side of [-.5,0,.5])for(const y of [.2,.5,.85]){
    const origin=new T.Vector3(mount.center.x/32+mount.tangent.x*mount.width*side+mount.normal.x*.1,y,mount.center.y/32+mount.tangent.y*mount.width*side+mount.normal.y*.1),ray=new T.Raycaster(origin,new T.Vector3(-mount.normal.x,0,-mount.normal.y),0,.2),hit=ray.intersectObject(support,true)[0];
    expect(hit,mount.name+' actual native backing').toBeDefined();expect(hit.distance).toBeCloseTo(.1,4);
   }
  }
  expect(new Set(f.root.children.map(o=>(o as T.Mesh).material)).size).toBeLessThanOrEqual(3);
  const resources=new Set<T.Material|T.BufferGeometry>();f.root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);resources.add(o.material as T.Material);}});const spies=[...resources].map(r=>vi.spyOn(r,'dispose'));disposeModel(f.root);spies.forEach(s=>expect(s).toHaveBeenCalledOnce());for(const m of Object.values(f.materials))if(!resources.has(m))m.dispose();disposeModel(support);
 });
 it('rejects unsupported floor cards, wide facades on tiny returns, excess projection and tall faces',()=>{
  const t:RoomTemplate={id:'receiving',name:'support controls',width:500,height:500,spawn:{x:200,y:200},exit:{x:400,y:400},breaches:[],obstacles:[{x:0,y:100,width:40,height:8}]};
  const mount={center:{x:20,y:108},tangent:{x:1,y:0},normal:{x:0,y:1},face:[{x:0,y:108},{x:40,y:108}] as const,width:.8};
  expect(mountedIngressHasBacking(t,mount)).toBe(true);expect(mountedIngressHasBacking(t,{...mount,width:2})).toBe(false);expect(mountedIngressHasBacking(t,{...mount,center:{x:200,y:200},face:[{x:180,y:200},{x:220,y:200}]})).toBe(false);
  expect(mountedIngressContainsVertex(mount,[20/32,.5,108/32+.034])).toBe(true);expect(mountedIngressContainsVertex(mount,[20/32,.5,108/32+.036])).toBe(false);expect(mountedIngressContainsVertex(mount,[20/32,.92,108/32])).toBe(false);expect(mountedIngressContainsVertex(mount,[20/32,.5,108/32-.09])).toBe(false);
 });
});
