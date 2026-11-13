import {CAMERA_OFFSET_Y,CAMERA_OFFSET_Z} from '../camera/CameraRig';
import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';

type Point = {x:number;y:number};
/** Inclusive polygon containment in game units. */
export function kitInside(x:number,z:number,polygon:readonly Point[]):boolean {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if(Math.abs((x-a.x)*(b.y-a.y)-(z-a.y)*(b.x-a.x))<1e-5&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)&&z>=Math.min(a.y,b.y)&&z<=Math.max(a.y,b.y))return true;
    if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function kitHull(t:RoomTemplate):readonly Point[]{return t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}];}
/** Raised dressing has no right to borrow a navigation clearance margin. */
export function kitSupported(t:RoomTemplate,x:number,z:number):boolean {
  const px=x*32,pz=z*32;
  return !kitInside(px,pz,kitHull(t))||t.obstacles.some(r=>px>=r.x&&px<=r.x+r.width&&pz>=r.y&&pz<=r.y+r.height)||!!t.voids?.some(p=>kitInside(px,pz,p));
}
/** Conservative full projected box, including edges/interior, rather than vertex-only validation. */
export function kitBoundsSupported(t:RoomTemplate,box:T.Box3):boolean {
  if(box.max.y<=.031)return true;
  for(let x=box.min.x;x<=box.max.x+.01;x+=Math.max(.08,(box.max.x-box.min.x)/8))for(let z=box.min.z;z<=box.max.z+.01;z+=Math.max(.08,(box.max.z-box.min.z)/8))if(!kitSupported(t,x,z))return false;
  return [[box.min.x,box.min.z],[box.min.x,box.max.z],[box.max.x,box.min.z],[box.max.x,box.max.z]].every(([x,z])=>kitSupported(t,x,z));
}
/** Legal radius-16 marine sample; includes the room perimeter and original solid edges. */
export function kitMarineSamples(t:RoomTemplate):T.Vector3[]{
  const points:T.Vector3[]=[];
  const clear=(x:number,z:number)=>{
    for(const [dx,dz] of [[0,0],[-.5,0],[.5,0],[0,-.5],[0,.5]]){
      const px=(x+dx)*32,pz=(z+dz)*32;
      if(!kitInside(px,pz,kitHull(t))||t.obstacles.some(r=>px>=r.x&&px<=r.x+r.width&&pz>=r.y&&pz<=r.y+r.height)||t.voids?.some(p=>kitInside(px,pz,p)))return false;
    }
    return true;
  };
  for(let x=.55;x<t.width/32;x+=.65)for(let z=.55;z<t.height/32;z+=.65){
    const edge=!clear(x-.65,z)||!clear(x+.65,z)||!clear(x,z-.65)||!clear(x,z+.65);
    if(edge&&clear(x,z))points.push(new T.Vector3(x,0,z));
  }
  return points;
}
/** Camera cone from the shipping 26:19 tilt, including lateral framing at room edges. */
export function kitOccludesMarine(bounds:T.Box3,samples:readonly T.Vector3[]):boolean {
  if(bounds.max.y<.08)return false;
  bounds=bounds.clone().expandByVector(new T.Vector3(.34,0,.34));
  const ray=new T.Ray(),hit=new T.Vector3(),target=new T.Vector3();
  for(const p of samples){
    if(p.x<bounds.min.x-3||p.x>bounds.max.x+3||p.z<bounds.min.z-6||p.z>bounds.max.z+.2)continue;
    for(const height of [.12,.55,1.1,1.6,2.05])for(const lateral of [-8,-4,0,4,8]){
      target.set(p.x,height,p.z);ray.origin.copy(target).add(new T.Vector3(lateral,CAMERA_OFFSET_Y,CAMERA_OFFSET_Z));ray.direction.copy(target).sub(ray.origin).normalize();
      if(ray.intersectBox(bounds,hit)&&hit.distanceToSquared(ray.origin)<target.distanceToSquared(ray.origin)-.01)return true;
    }
  }
  return false;
}

/** Exact static triangles resolve conservative box false positives on cutaway beds/desks. */
export function kitMeshOccludesMarine(model:T.Object3D,bounds:T.Box3,samples:readonly T.Vector3[]):boolean {
  const broad=bounds.clone().expandByVector(new T.Vector3(.34,0,.34)),ray=new T.Raycaster(),hit=new T.Vector3(),target=new T.Vector3();
  model.updateWorldMatrix(true,true);
  for(const p of samples){
    if(p.x<bounds.min.x-3||p.x>bounds.max.x+3||p.z<bounds.min.z-6||p.z>bounds.max.z+.2)continue;
    for(const height of [.12,.55,1.1,1.6,2.05])for(const lateral of [-8,-4,0,4,8])for(const dx of [-.34,0,.34])for(const dz of [-.34,0,.34]){
      target.set(p.x+dx,height,p.z+dz);const origin=target.clone().add(new T.Vector3(lateral,CAMERA_OFFSET_Y,CAMERA_OFFSET_Z));
      ray.set(origin,target.clone().sub(origin).normalize());ray.far=origin.distanceTo(target)-.01;
      if(ray.ray.intersectBox(broad,hit)&&hit.distanceTo(origin)<ray.far&&ray.intersectObject(model,true).length)return true;
    }
  }
  return false;
}

/** Keep the authored fatal-cost lettering clear of newly added dressing. */
export function kitOccludesStory(model:T.Object3D,display:{corners:number[][]}|undefined):boolean {
  if(!display)return false;
  model.updateWorldMatrix(true,true);const corners=display.corners.map(p=>new T.Vector3().fromArray(p)),ray=new T.Raycaster();
  for(let column=0;column<11;column++)for(let row=0;row<5;row++){
    const u=.005+column*.99/10,v=.005+row*.99/4,target=corners[0].clone().lerp(corners[1],u).lerp(corners[3].clone().lerp(corners[2],u),v);
    for(const lateral of [-8,0,8]){const origin=target.clone().add(new T.Vector3(lateral,CAMERA_OFFSET_Y,CAMERA_OFFSET_Z));ray.set(origin,target.clone().sub(origin).normalize());ray.far=origin.distanceTo(target)-.01;if(ray.intersectObject(model,true).length)return true;}
  }
  return false;
}
