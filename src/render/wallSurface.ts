import * as T from 'three';
import {WallTriangleGrid} from './WallTriangleGrid';

/** Presentation-only wall probes. Keep Three's native intersections and scene order. */
export class WallSurfaceProbe {
 private readonly ray=new T.Raycaster();
 private readonly hits:T.Intersection[]=[];
 private readonly supportHits:T.Intersection[]=[];
 private readonly origin=new T.Vector3();
 private readonly direction=new T.Vector3();
 private readonly tangent=new T.Vector3();
 private readonly up=new T.Vector3();
 private readonly sample=new T.Vector3();
 private readonly difference=new T.Vector3();
 private readonly supportNormal=new T.Vector3();
 private readonly normalMatrix=new T.Matrix3();

 private readonly grid=new WallTriangleGrid();
 prepare(world:T.Object3D){this.grid.prepare(world);}
 clear(){this.grid.clear();this.hits.length=this.supportHits.length=0;}

 resolve(world:T.Object3D,p:T.Vector3,outward:T.Vector3,footprint=.085){
  // Start past the protruding trim and stop before an unrelated distant wall.
  world.updateWorldMatrix(true,true);
  this.ray.set(this.origin.copy(p).addScaledVector(outward,.6),this.direction.copy(outward).negate());
  this.ray.far=.95;
  this.hits.length=0;
  for(let ancestor=world.parent;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)return undefined;
  this.grid.intersect(world,this.ray,this.hits);
  for(const hit of this.hits){
   if(!hit.face)continue;
   this.normalMatrix.getNormalMatrix(hit.object.matrixWorld);
   const normal=hit.face.normal.clone().applyNormalMatrix(this.normalMatrix).normalize();
   if(Math.abs(normal.y)>.3||normal.dot(outward)<.2)continue;
   // A mark can rotate, so reserve its bounding square on this same face.
   this.tangent.set(normal.z,0,-normal.x).normalize();
   this.up.crossVectors(normal,this.tangent);
   let supported=true;
   for(let x=-1;x<=1&&supported;x+=2)for(let y=-1;y<=1&&supported;y+=2){
    this.sample.copy(hit.point).addScaledVector(this.tangent,x*footprint).addScaledVector(this.up,y*footprint);
    this.ray.set(this.origin.copy(this.sample).addScaledVector(normal,.1),this.direction.copy(normal).negate());
    this.ray.far=.12;
    this.supportHits.length=0;
    this.grid.intersect(world,this.ray,this.supportHits,hit.object);
    const support=this.supportHits[0];
    supported=!!support?.face&&Math.abs(this.difference.subVectors(support.point,this.sample).dot(normal))<=.005
     &&this.supportNormal.copy(support.face.normal).applyNormalMatrix(this.normalMatrix).normalize().dot(normal)>=.98;
   }
   this.hits.length=this.supportHits.length=0;
   return {point:hit.point,normal,supported};
  }
  this.hits.length=0;
  return undefined;
 }
}
