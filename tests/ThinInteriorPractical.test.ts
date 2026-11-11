import {expect,it} from 'vitest';
import * as T from 'three';
import {addInteriorPracticals} from '../src/render/lighting/InteriorPracticals';
import {armoryCarousel} from '../src/render/ArmoryCarousel';
import {ARMORY_SOLIDS} from '../src/game/world/armoryCarouselLayout';
import {disposeModel} from '../src/render/meshParts';

const polygon=(width:number,depth:number,angle:number)=>{
 const c=Math.cos(angle),s=Math.sin(angle);
 return [[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]].map(([x,z])=>({x:(5+x*c+z*s)*32,y:(5-x*s+z*c)*32}));
};
it('fits a tiny housing on a thin rotated island while retaining the real top height',()=>{
 const room=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(4,1,.2),new T.MeshStandardMaterial());mesh.position.set(5,.5,5);mesh.rotation.y=Math.PI/4;room.add(mesh);
 addInteriorPracticals(room,{obstacles:[],voids:[polygon(4,.2,Math.PI/4)]},'security');
 expect(room.userData.lightFixtures).toHaveLength(1);
 const matrix=new T.Matrix4(),housings=room.getObjectByName('interior-practical-housings') as T.InstancedMesh;
 housings.getMatrixAt(0,matrix);const size=new T.Vector3().setFromMatrixScale(matrix),center=new T.Vector3().setFromMatrixPosition(matrix);
 expect(size.x).toBeCloseTo(.12);expect(size.z).toBeCloseTo(.12);expect(center.y).toBeCloseTo(1.045);
 // All housing corners remain inside the rotated 0.2m solid strip.
 for(const dx of [-.06,.06])for(const dz of [-.06,.06]){
  const local=new T.Vector3(center.x+dx,1,center.z+dz);mesh.worldToLocal(local);
  expect(Math.abs(local.x)).toBeLessThanOrEqual(2.00001);expect(Math.abs(local.z)).toBeLessThanOrEqual(.10001);
 }
 const emitters=room.getObjectByName('interior-practical-emitters') as T.InstancedMesh;emitters.getMatrixAt(0,matrix);expect(new T.Vector3().setFromMatrixScale(matrix).x).toBeLessThanOrEqual(.1);
 disposeModel(room);
});
it('retains regular fixture sizes and polygon clearance on broad equipment',()=>{
 const room=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(4,1,3),new T.MeshStandardMaterial());mesh.position.set(5,.5,5);room.add(mesh);
 addInteriorPracticals(room,{obstacles:[],voids:[polygon(4,3,0)]},'communications');
 const housing=room.getObjectByName('interior-practical-housings') as T.InstancedMesh,matrix=new T.Matrix4();housing.getMatrixAt(0,matrix);
 const size=new T.Vector3().setFromMatrixScale(matrix),center=new T.Vector3().setFromMatrixPosition(matrix);
 expect(size.x).toBeCloseTo(.65);expect(size.z).toBeCloseTo(.42);
 expect(center.x).toBeGreaterThanOrEqual(3.34999);expect(center.x).toBeLessThanOrEqual(6.65001);
 expect(center.z).toBeGreaterThanOrEqual(3.84999);expect(center.z).toBeLessThanOrEqual(6.15001);disposeModel(room);
});
it('uses instance matrices rather than the shared untransformed geometry',()=>{
 const room=new T.Group(),mesh=new T.InstancedMesh(new T.BoxGeometry(2,2,2),new T.MeshStandardMaterial(),2),matrix=new T.Matrix4();
 mesh.setMatrixAt(0,matrix.makeTranslation(7,1,8));mesh.setMatrixAt(1,matrix.makeTranslation(15,1,8));room.add(mesh);
 addInteriorPracticals(room,{obstacles:[{x:192,y:224,width:64,height:64},{x:448,y:224,width:64,height:64}]},'maintenance');
 expect(room.userData.lightFixtures).toHaveLength(2);expect(room.userData.lightFixtures.every((f:{y:number})=>Math.abs(f.y-2.135)<1e-5)).toBe(true);disposeModel(room);
});
it('finds mounted sources on the real concave armory counter and carousel',()=>{
 const room=armoryCarousel();addInteriorPracticals(room,{obstacles:[],voids:ARMORY_SOLIDS},'security');
 expect(room.userData.lightFixtures).toHaveLength(2);disposeModel(room);
});
