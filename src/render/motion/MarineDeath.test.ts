import {beforeAll, expect, it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {marine, disposeModel} from '../models';
import {DeathRagdolls, initDeathPhysics} from '../DeathRagdolls';

beforeAll(async()=>{await loadModels();await initDeathPhysics();});

it('collapses the real marine through bounded articulated bodies with killing direction and restores its skin',()=>{
  const physics=new DeathRagdolls(),model=marine(),root=new T.Vector3(8,0,8),point=new T.Vector3();
  physics.setRoom({width:640,height:640,obstacles:[]});model.root.position.copy(root);
  model.animate(0,0,0);model.hit?.(1,Math.PI/4,true);model.animate(1/60,0,0);
  const topology=model.root.children.slice(),geometry:T.BufferGeometry[]=[],bones:T.Bone[]=[];
  model.root.traverse(node=>{if(node instanceof T.Mesh)geometry.push(node.geometry);if(node instanceof T.Bone)bones.push(node);});
  const poses=bones.map(bone=>({bone,q:bone.quaternion.clone(),p:bone.position.clone(),auto:bone.matrixAutoUpdate}));
  try{
    expect(physics.add(-10,model,'marine',{x:8,z:8})).toBe(true);
    const before=physics.inspect(-10)!;
    expect(before.length).toBeGreaterThanOrEqual(12);expect(before.length).toBeLessThanOrEqual(20);
    expect(before.some(part=>part.name==='ribs')).toBe(true);
    for(let frame=0;frame<60;frame++){
      physics.update(1/60);model.syncWeaponPose?.();
      expect(model.root.position.toArray()).toEqual(root.toArray());
      expect(model.root.rotation.z).toBe(0);expect(physics.maxJointError(-10)).toBeLessThan(.2);
      if(frame%15===14){
        let lowest=Infinity;
        model.root.updateMatrixWorld(true);model.root.traverse(node=>{
          if(!(node instanceof T.SkinnedMesh))return;
          node.skeleton.update();
          for(let index=0;index<node.geometry.getAttribute('position').count;index++)lowest=Math.min(lowest,node.getVertexPosition(index,point).applyMatrix4(node.matrixWorld).y);
        });
        expect(lowest).toBeGreaterThanOrEqual(-.025);
      }
    }
    const after=physics.inspect(-10)!;
    expect(after[0].position.x).toBeGreaterThan(before[0].position.x);
    expect(after[0].position.z).toBeGreaterThan(before[0].position.z);
    expect(after[0].position.y).toBeLessThan(before[0].position.y-.1);
    expect(after.some((part,index)=>new T.Quaternion(...Object.values(part.rotation) as [number,number,number,number]).angleTo(new T.Quaternion(...Object.values(before[index].rotation) as [number,number,number,number]))>.2)).toBe(true);
    physics.remove(-10);expect(physics.has(-10)).toBe(false);
    for(const pose of poses){expect(pose.bone.position.distanceTo(pose.p)).toBeLessThan(1e-8);pose.bone.quaternion.toArray().forEach((value,index)=>expect(value).toBeCloseTo(pose.q.toArray()[index],12));expect(pose.bone.matrixAutoUpdate).toBe(pose.auto);}
    expect(model.root.children).toEqual(topology);
    const afterGeometry:T.BufferGeometry[]=[];model.root.traverse(node=>{if(node instanceof T.Mesh)afterGeometry.push(node.geometry);});expect(afterGeometry).toEqual(geometry);
  }finally{physics.dispose();disposeModel(model.root);}
});
