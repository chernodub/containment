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
 update(choices:DepthGame['floorControls'],breaches:DepthGame['geometry']['breaches'],unit:number){
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
   mesh.material=choice.kind==='failed-bank'?this.failed:this.materials[choice.kind==='gate'?0:1];
   mesh.position.set(choice.x/unit,.04,choice.y/unit);
   mesh.scale.setScalar(choice.radius/unit);
  });
 }
 dispose(){this.root.removeFromParent();this.geometry.dispose();this.failedGeometry.dispose();this.arrowGeometry.dispose();this.failed.dispose();this.materials.forEach(m=>m.dispose());}
}
