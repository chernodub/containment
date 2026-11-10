import * as T from 'three';
import type {ShipEnvironment} from '../ShipEnvironments';
import {getEnvironmentMood} from './EnvironmentMoods';

/** Side-wall fixtures retain individual light origins after static room batching. */
export function addRoomPracticals(world:T.Group,width:number,depth:number,environment:ShipEnvironment){
  const organic=environment==='infested',count=Math.min(32,Math.max(4,Math.ceil(depth/4.5)*2));
  const geometry=organic?new T.SphereGeometry(1,12,8):new T.BoxGeometry(1,1,1);
  const material=new T.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:organic?1.3:1.5,roughness:.45,metalness:.15});
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance*=vColor;\n#endif');};
  material.customProgramCacheKey=()=> 'room-practical-emission-v1';
  const lights=new T.InstancedMesh(geometry,material,count),mounts=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:0x28363b,roughness:.65,metalness:.6}),count);
  material.userData.actorMaterial=true;material.userData.motivatedEmitter=true;(mounts.material as T.Material).userData.actorMaterial=true;
  lights.geometry.addEventListener('dispose',()=>lights.dispose());mounts.geometry.addEventListener('dispose',()=>mounts.dispose());
  lights.name=organic?'living-bioluminescent-nodules':'wall-practical-diffusers';mounts.name='wall-practical-housings';
  const dummy=new T.Object3D(),color=new T.Color(),fixtures=world.userData.lightFixtures??=[];
  const perSide=count/2;
  for(let i=0;i<count;i++){
    const right=i>=perSide,index=i%perSide,z=1.8+(depth-3.6)*(index+.5)/perSide,x=right?width-.32:.32;
    const tint=organic?(index%3===1?0xdc68ca:0xa1ef72):environment==='security'?(index%2?0xe8f1ff:0xff6650):getEnvironmentMood(environment).practical.color;
    dummy.position.set(x,organic?1.05:1.65,z);dummy.rotation.set(0,0,0);dummy.scale.set(organic?.26:.09,organic?.52:.12,organic?.37:.85);dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix);lights.setColorAt(i,color.setHex(tint));
    dummy.position.x=right?width-.12:.12;dummy.scale.set(.22,organic?.75:.3,organic?.75:1.15);dummy.updateMatrix();mounts.setMatrixAt(i,dummy.matrix);
    fixtures.push({x,y:organic?.9:1.5,z,color:tint,nativeColor:true});
  }
  lights.instanceMatrix.needsUpdate=mounts.instanceMatrix.needsUpdate=true;lights.frustumCulled=mounts.frustumCulled=false;world.add(mounts,lights);
}
