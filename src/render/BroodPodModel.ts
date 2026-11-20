import * as T from 'three';
import {instantiateAsset} from './assets';
import type {ActorModel} from './models';
import {setActorLOD} from './ActorLOD';
import type {PodStage} from '../game/enemies/EnemySystem';

/** Native enemy snapshots own hatch timing and the transition to a living actor. */
export function broodPodModel(): ActorModel {
 const source=instantiateAsset('brood-pod');
 const root=new T.Group();
 const body=new T.Group();
 root.add(source.root);
 root.userData.broodPod=true;
 root.name='brood-pod-actor';
 root.userData.colliderRadius=14/32;

 // Linked satellite sac shares the baked vertices and both shell/core draws.
 const hatching=root.getObjectByName('brood-pod-hatching');
 const pieces:T.Mesh[]=[];
 source.root.traverse(o=>{if(o instanceof T.Mesh)pieces.push(o);});
 const batches:T.InstancedMesh[]=[];
 const satellite=new T.Matrix4().makeRotationY(1.9).scale(new T.Vector3(.46,.54,.46)).setPosition(-.28,0,.31);
 for(const mesh of pieces){
  const batch=new T.InstancedMesh(mesh.geometry,mesh.material,2);
  batch.name=mesh.name;batch.position.copy(mesh.position);batch.quaternion.copy(mesh.quaternion);batch.scale.copy(mesh.scale);
  if(!Array.isArray(mesh.material)&&mesh.material.name==='pod-core'&&hatching?.getObjectById(mesh.id)){
   batch.scale.x*=.72;batch.scale.z*=.72;batch.position.y-=.12;
  }
  batch.castShadow=mesh.castShadow;batch.receiveShadow=mesh.receiveShadow;
  batch.setMatrixAt(0,new T.Matrix4());batch.setMatrixAt(1,satellite);
  mesh.parent!.add(batch);mesh.removeFromParent();batches.push(batch);
 }
 let motion=1;
 const closed=root.getObjectByName('brood-pod');
 const cores=source.materials.filter(material=>material.name==='pod-core');
 for(const shell of source.materials.filter(m=>m.name==='brood-pod-shell')){
  shell.transparent=true; shell.opacity=.89; shell.roughness=.48;
 }
 const update=(ms:number,stage:PodStage)=>{
  if(closed)closed.visible=stage!=='opening';
  if(hatching)hatching.visible=stage==='opening';
  if(stage==='opening')source.root.scale.set(1.62,1.05,1.32);
  else source.root.scale.setScalar(stage==='swelling'?1.17+.12*motion*Math.sin(ms/100):1);
  const glow=stage==='opening'?.36:stage==='swelling'?.76+.27*motion*Math.sin(ms/100):.24;
  for(const material of cores)material.emissiveIntensity=glow;
 };
 const reset=()=>update(0,'sealed');
 reset();
 return {
  root,body,limbs:[],height:.95,
  animate(){},
  setPodCountdown(ms,stage='sealed'){update(ms,stage);setActorLOD(root,false);},
  reset,
  prepare(){if(closed)closed.visible=true;if(hatching)hatching.visible=true;},
  freeze(){},
  setMotionOptions(strength,reduced){motion=reduced?0:strength;},
  stop(){for(const batch of batches)batch.dispose();},
 };
}
