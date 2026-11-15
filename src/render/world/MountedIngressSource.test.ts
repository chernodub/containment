import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../DepthRenderer';
import {generateRun} from '../../game/roguelike/run';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {addMountedIngress,ACT4_MOUNTED_INGRESS,mountedIngressHasBacking,type MountedIngress} from './MountedIngress';
import {addWorldDressing} from './WorldDressing';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {disposeModel} from '../meshParts';
it('backs all sixty live mounted faces with actual grounded cassette triangles and retains the three caller buckets',()=>{
 let fitted=0;
 for(const node of generateRun(1729,3).nodes){
  if(ACT4_MOUNTED_INGRESS.has(node.templateId))continue;
  const t=ROOM_TEMPLATES[node.templateId],before=JSON.stringify(t),world=DepthRenderer.prototype['buildRoomArchitecture'].call(Object.create(DepthRenderer.prototype),node,t)??new T.Group(),environment=ROOM_STORY_ROUTE.find(r=>r.templateId===node.templateId)!.environment,root=addWorldDressing(world,t,environment,t.id),mounts=root.userData.mountedIngress as MountedIngress[];
  expect(root.userData.breachCount).toBe(4);expect(root.userData.ingressNewFinishes).toEqual([]);expect(mounts).toHaveLength(4);
  for(const f of mounts){
   expect(mountedIngressHasBacking(t,f)).toBe(true);
   const part=f.parts.find(p=>p.name==='grounded-ingress-cassette')!;expect(part).toBeDefined();expect(part.size[1]).toBe(.88);expect(part.size[2]).toBe(.08);expect(part.center[1]-part.size[1]/2).toBe(0);
   const source=root.children.find(o=>(o as T.Mesh<T.BufferGeometry,T.Material>).material.name===part.material) as T.Mesh,position=source.geometry.attributes.position,geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(Array.from(position.array).slice(part.start*3,part.end*3),3)),material=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(geometry,material);mesh.updateMatrixWorld(true);
   // This is the exact milled backing emitted into the live renderer bucket,
   // not a substitute box. Probe0.2mm inside shared triangle edges; the
   // independent slab proof includes both exact outer backing corners.
   for(const side of [-.5,0,.5])for(const y of [.2,.5,.85]){
    const ray=new T.Raycaster(new T.Vector3(f.center.x/32+f.tangent.x*(f.width-.0004)*side+f.normal.x*.1,y,f.center.y/32+f.tangent.y*(f.width-.0004)*side+f.normal.y*.1),new T.Vector3(-f.normal.x,0,-f.normal.y),0,.2),hit=ray.intersectObject(mesh,true)[0];expect(hit,f.name+' real backing').toBeDefined();expect(hit.distance).toBeGreaterThanOrEqual(.09999);expect(hit.distance).toBeLessThanOrEqual(.121);
   }
   geometry.dispose();material.dispose();fitted++;
  }
  expect(JSON.stringify(t)).toBe(before);
  const allocations=new Set<T.Material|T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh){allocations.add(o.geometry);allocations.add(o.material as T.Material);}});const spies=[...allocations].map(r=>vi.spyOn(r,'dispose'));disposeModel(root);spies.forEach(s=>expect(s).toHaveBeenCalledOnce());disposeModel(world);
 }
 expect(fitted).toBe(60);
});
it('mounted fitting writer never requests a new material or separate scene object',()=>{
 const t=ROOM_TEMPLATES['diagnostic-gallery'],materials={steel:new T.MeshStandardMaterial(),dark:new T.MeshStandardMaterial(),signal:new T.MeshStandardMaterial()},used=new Set<T.Material>(),counts=new Map<T.Material,number>();
 addMountedIngress(t.id,t,{vertexCount:m=>counts.get(m)??0,box(m){used.add(m);counts.set(m,(counts.get(m)??0)+36);}},materials);expect([...used].every(m=>Object.values(materials).some(known=>known===m))).toBe(true);expect(used.size).toBe(3);Object.values(materials).forEach(m=>m.dispose());
});
