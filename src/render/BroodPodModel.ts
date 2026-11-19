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

 const closed=root.getObjectByName('brood-pod');
 const hatching=root.getObjectByName('brood-pod-hatching');
 const cores=source.materials.filter(material=>material.name==='pod-core');
 const update=(ms:number,stage:PodStage)=>{
  if(closed)closed.visible=stage!=='opening';
  if(hatching)hatching.visible=stage==='opening';
  if(stage==='opening')source.root.scale.set(1.62,1.05,1.32);
  else source.root.scale.setScalar(stage==='swelling'?1.17+.12*Math.sin(ms/65):1);
  const glow=stage==='opening'?3.4:stage==='swelling'?1.25:.3;
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
  stop(){},
 };
}
