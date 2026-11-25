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
  batch.castShadow=mesh.castShadow;batch.receiveShadow=mesh.receiveShadow;
  batch.setMatrixAt(0,new T.Matrix4());batch.setMatrixAt(1,hatching?.getObjectById(mesh.id)
   ? satellite.clone().setPosition(-.64,0,.30) : satellite);
  mesh.parent!.add(batch);mesh.removeFromParent();batches.push(batch);
 }
 let motion=1;
 const closed=root.getObjectByName('brood-pod');
 // The two-material GLB loads its low-detail nodes as groups. Use their
 // shells for the rooted cups under the clutch, clear of the opening.
 for(const name of ['brood-pod__lod_low','brood-pod-hatching__lod_low']){
  const cup=root.getObjectByName(name);
  if(cup){
   cup.scale.set(.84,.17,.9);
   cup.position.x=name.includes('hatching') ? -.34 : .34;
  }
 }
 const cores=source.materials.filter(material=>material.name==='pod-core');
 for(const shell of source.materials.filter(m=>m.name==='brood-pod-shell')){
  shell.transparent=true; shell.opacity=.89; shell.roughness=.48;
  // Only the shell takes the Matron's key. The separate core owns the hatch pulse.
  const previous=shell.onBeforeCompile,cacheKey=shell.customProgramCacheKey();
  shell.onBeforeCompile=(shader,renderer)=>{
   previous.call(shell,shader,renderer);
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
    float podKey=dot(normalize(vNormal),normalize(vec3(-.78,.40,.48)));
    reflectedLight.directDiffuse=diffuseColor.rgb*(.24+.76*step(-.14,podKey)+.45*step(.94,podKey));
    reflectedLight.indirectDiffuse=vec3(0.);
   `);
  };
  shell.customProgramCacheKey=()=>cacheKey+':brood-pod-planes';
 }
 const update=(ms:number,stage:PodStage)=>{
  if(closed)closed.visible=stage!=='opening';
  if(hatching)hatching.visible=stage==='opening';
  if(stage==='opening')source.root.scale.set(1.62,1.05,1.32);
  else source.root.scale.setScalar(stage==='swelling'?1.17+.12*motion*Math.sin(ms/100):1);
  const glow=stage==='opening'?.36:stage==='swelling'?.76+.27*motion*Math.sin(ms/100):.24;
  for(const material of cores)material.emissiveIntensity=glow;
 };
 const reset=()=>{root.rotation.set(0,0,0);root.scale.setScalar(1);update(0,'sealed');};
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
