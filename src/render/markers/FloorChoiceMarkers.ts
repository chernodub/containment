import * as T from 'three';
import type {DepthGame} from '../../DepthGame';

import {dashedRing} from './dashedRing';

export class FloorChoiceMarkers {
 readonly root=new T.Group();
 private readonly geometry=dashedRing(.98,1,64);
 private readonly materials=[
  new T.MeshBasicMaterial({color:0xffbf62,transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide}),
  new T.MeshBasicMaterial({color:0x8debff,transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide}),
 ];
 private readonly failedGeometry=dashedRing(.99,1,96);
 private readonly failed=new T.MeshBasicMaterial({color:0xcd9766,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
 private readonly pads=Array.from({length:3},()=>{
  const mesh=new T.Mesh(this.geometry,this.materials[0]);
  mesh.renderOrder=-2;mesh.rotation.x=-Math.PI/2;mesh.visible=false;this.root.add(mesh);return mesh;
 });
 private readonly arrowGeometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([
  -.22,0,-.12,.15,0,-.12,.15,0,.12,-.22,0,-.12,.15,0,.12,-.22,0,.12,
  .08,0,-.28,.55,0,0,.08,0,.28,
 ],3));
 private readonly arrows=this.pads.slice(0,2).map(()=>{
  const mesh=new T.Mesh(this.arrowGeometry,this.materials[0]);
  mesh.visible=false;this.root.add(mesh);return mesh;
 });
 private readonly routeDummy=new T.Object3D();
 private readonly routes=this.materials.map(material=>{
  const mesh=new T.InstancedMesh(this.arrowGeometry,material,48);
  mesh.count=0;mesh.frustumCulled=false;this.root.add(mesh);return mesh;
 });
 update(choices:DepthGame['floorControls'],breaches:DepthGame['geometry']['breaches'],unit:number,approaches:DepthGame['relayApproaches']=[]){
  this.routes.forEach((mesh,index)=>{
   const path=approaches[index];
   let count=0;
   for(let i=1;path&&i<path.length;i++){
    const from=path[i-1],to=path[i],dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy);
    for(let along=22;along<distance&&count<48;along+=37){
     this.routeDummy.position.set((from.x+dx*along/distance)/unit,.05,(from.y+dy*along/distance)/unit);
     this.routeDummy.rotation.y=-Math.atan2(dy,dx);this.routeDummy.scale.setScalar(.65);this.routeDummy.updateMatrix();
     mesh.setMatrixAt(count++,this.routeDummy.matrix);
    }
   }
   mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
  });
  this.arrows.forEach((arrow,index)=>{
   const choice=choices[index];
   const breach=choice?.kind==='gate'&&breaches.find(point=>point.id===choice.id);
   arrow.visible=!!breach;
   if(!breach)return;
   arrow.position.set(choice.x/unit,.05,choice.y/unit);
   arrow.rotation.y=-Math.atan2(breach.y-choice.y,breach.x-choice.x);
   arrow.scale.setScalar(choice.radius/unit);
  });
  this.pads.forEach((mesh,index)=>{
   const choice=choices[index];
   mesh.visible=!!choice;
   if(!choice)return;
   mesh.geometry=choice.kind==='failed-bank'?this.failedGeometry:this.geometry;
   mesh.material=choice.kind==='failed-bank'?this.failed:this.materials[choice.kind==='gate'||choice.id==='0'?0:1];
   mesh.position.set(choice.x/unit,.04,choice.y/unit);
   mesh.scale.setScalar(choice.radius/unit);
  });
 }
 dispose(){this.root.removeFromParent();this.routes.forEach(mesh=>mesh.dispose());this.geometry.dispose();this.failedGeometry.dispose();this.arrowGeometry.dispose();this.failed.dispose();this.materials.forEach(m=>m.dispose());}
}
