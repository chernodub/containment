import * as T from 'three';
import type {ShipEnvironment} from '../ShipEnvironments';
import {getEnvironmentMood} from './EnvironmentMoods';
import {organicGeometry,organicWallGeometry} from '../world/OrganicGrowth';

type BoundaryPoint = Readonly<{ x: number; y: number }>;
type BoundaryFixture = Readonly<{ x: number; z: number; mountX: number; mountZ: number; angle: number }>;

function insideBoundary(x: number, z: number, boundary: readonly BoundaryPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const a = boundary[i], b = boundary[j];
    if ((a.y > z) !== (b.y > z) && x < (b.x - a.x) * (z - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Generate world-unit fixture origins along real enclosure edges, independent of camera bounds. */
function boundaryFixtures(boundary?: readonly BoundaryPoint[]): BoundaryFixture[] | undefined {
  if (!boundary || boundary.length < 3 || boundary.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return;
  let signedArea = 0, perimeter = 0;
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i], b = boundary[(i + 1) % boundary.length];
    signedArea += a.x * b.y - b.x * a.y;
    perimeter += Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (Math.abs(signedArea) < .001 || perimeter < 1) return;
  const winding = signedArea > 0 ? 1 : -1;
  const spacing = Math.max(5, perimeter / 32);
  const candidates: BoundaryFixture[] = [];
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i], b = boundary[(i + 1) % boundary.length];
    const dx = b.x - a.x, dz = b.y - a.y, length = Math.hypot(dx, dz);
    if (length < .65) continue;
    const samples = Math.max(1, Math.round(length / spacing));
    const nx = -dz / length * winding, nz = dx / length * winding;
    for (let sample = 0; sample < samples; sample++) {
      const t = (sample + .5) / samples, edgeX = a.x + dx * t, edgeZ = a.y + dz * t;
      const x = edgeX + nx * .32, z = edgeZ + nz * .32;
      const mountX = edgeX + nx * .12, mountZ = edgeZ + nz * .12;
      // Very narrow or concave details may not have room for the standard housing.
      if (!insideBoundary(x, z, boundary) || !insideBoundary(mountX, mountZ, boundary)) continue;
      candidates.push({ x, z, mountX, mountZ, angle: Math.atan2(dx, dz) });
    }
  }
  if (candidates.length <= 32) return candidates;
  // Retain coverage around the full perimeter instead of truncating the final edges.
  return Array.from({ length: 32 }, (_, i) => candidates[Math.floor((i + .5) * candidates.length / 32)]);
}

/** Side-wall fixtures retain individual light origins after static room batching. */
export function addRoomPracticals(world:T.Group,width:number,depth:number,environment:ShipEnvironment,boundary?:readonly BoundaryPoint[]){
  const polygonFixtures=boundaryFixtures(boundary);
  const organic=environment==='infested',count=polygonFixtures?.length??Math.min(32,Math.max(4,Math.ceil(depth/4.5)*2));
  const geometry=organic?organicGeometry().clone():new T.BoxGeometry(1,1,1);
  const material=new T.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:organic?.7:1.5,roughness:.45,metalness:.15});
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance*=vColor.rgb;\n#endif');};
  material.customProgramCacheKey=()=> 'room-practical-emission-v1';
  const lights=new T.InstancedMesh(geometry,material,count),mounts=new T.InstancedMesh(organic?organicWallGeometry().clone():new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:organic?0x7c6257:0x28363b,roughness:organic?.85:.65,metalness:organic?.05:.6}),count);
  material.userData.actorMaterial=true;material.userData.motivatedEmitter=true;(mounts.material as T.Material).userData.actorMaterial=true;
  lights.geometry.addEventListener('dispose',()=>lights.dispose());mounts.geometry.addEventListener('dispose',()=>mounts.dispose());
  lights.name=organic?'living-bioluminescent-nodules':'wall-practical-diffusers';mounts.name='wall-practical-housings';
  const dummy=new T.Object3D(),color=new T.Color(),fixtures=world.userData.lightFixtures??=[];
  const perSide=count/2;
  for(let i=0;i<count;i++){
    const fixture=polygonFixtures?.[i];
    const right=i>=perSide,index=fixture?i:i%perSide,jitter=organic?Math.sin(i*12.73+width*2.13)*.58:0,tangentX=fixture?Math.sin(fixture.angle):0,tangentZ=fixture?Math.cos(fixture.angle):1,z=(fixture?.z??1.8+(depth-3.6)*(index+.5)/perSide)+jitter*tangentZ,x=(fixture?.x??(right?width-.32:.32))+jitter*tangentX;
    const height=organic?.72+(Math.sin(i*6.71+depth)*.5+.5)*.87:1.65,scale=organic?.7+(Math.sin(i*9.32)*.5+.5)*.65:1;
    const tint=organic?(index%3===1?0xdc68ca:0xa1ef72):environment==='security'?(index%2?0xe8f1ff:0xff6650):getEnvironmentMood(environment).practical.color;
    const organicAngle=Math.atan2(-(fixture?fixture.z-fixture.mountZ:0),fixture?fixture.x-fixture.mountX:right?-1:1);
    dummy.position.set(x,height,z);dummy.rotation.set(0,organic?organicAngle:fixture?.angle??0,organic?Math.sin(i*2.13)*.45:0);dummy.scale.set(organic?.018*scale:.09,organic?.32*scale:.12,organic?.065*scale:.85);dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix);lights.setColorAt(i,color.setHex(tint));
    dummy.position.x=fixture?fixture.mountX+jitter*tangentX:(right?width-.12:.12);dummy.position.z=fixture?fixture.mountZ+jitter*tangentZ:z;dummy.scale.set(organic?.19*scale:.22,organic?.55*scale:.3,organic?.43*scale:1.15);dummy.updateMatrix();mounts.setMatrixAt(i,dummy.matrix);
    fixtures.push({x,y:organic?height:1.5,z,color:tint,nativeColor:true});
  }
  lights.instanceMatrix.needsUpdate=mounts.instanceMatrix.needsUpdate=true;lights.frustumCulled=mounts.frustumCulled=false;world.add(mounts,lights);
}
