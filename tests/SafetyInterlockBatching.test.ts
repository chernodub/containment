import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {safetyInterlockArchitecture} from '../src/render/SafetyInterlockArchitecture';
import {batchStaticRoom} from '../src/render/StaticRoomBatching';
import {disposeModel,geometries} from '../src/render/meshParts';

describe('live insulated service channels retain geometry while batching',()=>{
 it('consolidates hundreds of static pieces without losing routes, faces or resource ownership',()=>{
  const t=ROOM_TEMPLATES['safety-interlock-station'],root=new T.Group();safetyInterlockArchitecture(root,t.width/32,t.height/32,t);root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(root,true),materials=new Set<T.Material>(),points:T.Vector3[]=[],names=new Set<string>();let triangles=0,meshes=0;
  root.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;materials.add(o.material as T.Material);names.add(o.name);if(o.name==='channel-slot'&&meshes%11===0)points.push(new T.Box3().setFromObject(o,true).getCenter(new T.Vector3()));}});
  expect(meshes).toBeGreaterThan(150);expect(points.length).toBeGreaterThan(3);
  const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),height=(p:T.Vector3)=>{ray.set(new T.Vector3(p.x,5,p.z),down);return ray.intersectObject(root,true)[0]?.point.y;};
  const heights=points.map(height),result=batchStaticRoom(root);expect(result.meshesAfter).toBeLessThan(40);expect(result.mergedMeshes).toBeGreaterThan(100);
  if(process.env.L8_BATCHING_REPORT==='1')process.stdout.write('[L8 Safety static batching] '+JSON.stringify(result)+'\n');
  const after=new T.Box3().setFromObject(root,true);expect(after.min.distanceTo(bounds.min)).toBeLessThan(1e-5);expect(after.max.distanceTo(bounds.max)).toBeLessThan(1e-5);
  let afterTriangles=0;root.traverse(o=>{if(o instanceof T.Mesh)afterTriangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;});expect(afterTriangles).toBe(triangles);
  for(const name of names)expect(root.getObjectByName(name),'retained named source '+name).toBeDefined();
  for(const name of ['recorder-load','ai-rear','battery-return'])expect(root.getObjectByName('service-route-'+name)).toBeDefined();
  points.forEach((p,i)=>expect(height(p)).toBeCloseTo(heights[i]!,5));expect(batchStaticRoom(root).mergedMeshes).toBe(0);
  const shared=new Set(geometries.values()),owned=new Set<T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh&&!shared.has(o.geometry))owned.add(o.geometry);});
  const spies=[...owned,...materials].map(r=>vi.spyOn(r,'dispose'));disposeModel(root);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
});
