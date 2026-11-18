import * as T from 'three';
import {instantiateAsset} from './assets';
import type {ActorModel} from './models';
import {setActorLOD} from './ActorLOD';
/** Static shootable-pod presentation. Native enemy snapshots own hatch/death. */
export function broodPodModel():ActorModel {
 const source=instantiateAsset('brood-pod'),root=new T.Group(),body=new T.Group();root.add(source.root);root.userData.broodPod=true;root.name='brood-pod-actor';root.userData.colliderRadius=14/32;
 const closed=root.getObjectByName('brood-pod'),hatching=root.getObjectByName('brood-pod-hatching');
 const cores=source.materials.filter(material=>material.name==='pod-core');
 let remaining=2400;
 const show=()=>{if(closed)closed.visible=remaining>500;if(hatching)hatching.visible=remaining<=500;};
 const reset=()=>{remaining=2400;show();for(const material of cores)material.emissiveIntensity=.3;};
 reset();
 return {root,body,limbs:[],height:.95,animate(){},setPodCountdown(ms){remaining=Math.max(0,ms);show();const progress=1-T.MathUtils.clamp(remaining/2400,0,1);for(const material of cores)material.emissiveIntensity=.3+2.7*progress;setActorLOD(root,false);},reset,prepare(){if(closed)closed.visible=true;if(hatching)hatching.visible=true;},freeze(){},stop(){}};
}
