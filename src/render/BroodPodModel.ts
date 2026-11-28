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
 for(const material of source.materials){
  material.emissiveIntensity=0;
  material.transparent=false;
  material.opacity=1;
  material.defines={...material.defines,BROOD_POD_SURFACE:1};
  const previous=material.onBeforeCompile, key=material.customProgramCacheKey();
  material.onBeforeCompile=(shader,renderer)=>{
   previous.call(material,shader,renderer);
   shader.vertexShader='varying float podCrown;\n'+shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\npodCrown=normal.y;');
   shader.fragmentShader='varying float podCrown;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`
    float podLight=dot(outgoingLight,vec3(.2126,.7152,.0722));
    bool podMark=podCrown>.24;
    outgoingLight=(podMark?vec3(.288,.173,.352):vec3(.069,.063,.074))*(.56+.84*smoothstep(.0,.14,podLight));
    #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>key+':brood43-pod';
  material.color.setHex(material.name==='pod-core'?0x524a57:0x463e49);
 }
 for(const shell of source.materials.filter(m=>m.name==='brood-pod-shell')){
  shell.roughness=.62;
  // The shell keeps the Matron’s directional planes as it splits open.
  const previous=shell.onBeforeCompile,cacheKey=shell.customProgramCacheKey();
  shell.onBeforeCompile=(shader,renderer)=>{
   previous.call(shell,shader,renderer);
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
    float podKey=dot(normalize(vNormal),normalize(vec3(-.78,.40,.48)));
    float shellGain=.45+.47*step(-.20,podKey)+.08*step(.94,podKey);
    reflectedLight.directDiffuse*=shellGain;
    reflectedLight.indirectDiffuse*=shellGain;
   `);
  };
  shell.customProgramCacheKey=()=>cacheKey+':brood-pod-planes';
 }
 const update=(ms:number,stage:PodStage)=>{
  if(closed)closed.visible=stage!=='opening';
  if(hatching)hatching.visible=stage==='opening';
  if(stage==='opening')source.root.scale.set(1.62,1.05,1.32);
  else source.root.scale.setScalar(stage==='swelling'?1.17+.12*motion*Math.sin(ms/100):1);

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
