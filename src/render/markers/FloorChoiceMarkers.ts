import * as T from 'three';
import type {DepthGame} from '../../DepthGame';

import {dashedRing} from './dashedRing';

export class FloorChoiceMarkers {
 readonly root=new T.Group();
 private readonly geometry=dashedRing(.98,1,64);
 private readonly materials=[
  new T.MeshBasicMaterial({color:0xffbf62,transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide}),
  new T.MeshBasicMaterial({color:0x8debff,transparent:true,opacity:.72,toneMapped:false,depthWrite:false,side:T.DoubleSide}),
 ];
 private readonly failedGeometry=dashedRing(.99,1,96);
 private readonly failed=new T.MeshBasicMaterial({color:0xcd9766,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
 private readonly pads=Array.from({length:3},()=>{
  const mesh=new T.Mesh(this.geometry,this.materials[0]);
  mesh.renderOrder=-2;mesh.rotation.x=-Math.PI/2;mesh.visible=false;this.root.add(mesh);return mesh;
 });
 private readonly coverGlyphGeometry=new T.CircleGeometry(.48,6);
 private readonly coverGlyph=new T.Mesh(this.coverGlyphGeometry,this.materials[1]);
 private readonly shutterGeometry=new T.BoxGeometry(1,1,1);
 private readonly shutterMaterial=new T.MeshStandardMaterial({color:0x74513a,emissive:0xe78338,emissiveIntensity:.55});
 private readonly shutterPanels=[new T.Mesh(this.shutterGeometry,this.shutterMaterial),new T.Mesh(this.shutterGeometry,this.shutterMaterial)];
 private readonly grilles=Array.from({length:2},()=>new T.Mesh(this.shutterGeometry,this.shutterMaterial));
 private reserve?:{x:number;y:number;life:number;entry?:string};
 closeReserve(x:number,y:number,entry?:string){this.reserve={x,y,life:3,entry};}
 resetReserve(){this.reserve=undefined;}
 updateReserve(breaches:DepthGame['geometry']['breaches'],unit:number,dt:number){
  const reserve=this.reserve;
  if(reserve)reserve.life=Math.max(0,reserve.life-dt);
  const entry=breaches.find(point=>point.id===reserve?.entry);
  this.grilles.forEach((mesh,index)=>{
   const point=index===0?reserve&&reserve.life>0?reserve:undefined:entry;
   mesh.visible=!!point;
   if(!point)return;
   const height=index===0?Math.min(1.4,(3-reserve!.life)*7):1.4;
   mesh.position.set(point.x/unit,1.4-height/2,point.y/unit);
   mesh.scale.set(.17,height,1.45);
  });
 }
 constructor(){
  this.root.add(...this.grilles);
  this.root.add(...this.shutterPanels);
  this.coverGlyph.rotation.x=-Math.PI/2;
  this.coverGlyph.visible=false;
  this.root.add(this.coverGlyph);
 }
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
 update(choices:DepthGame['floorControls'],breaches:DepthGame['geometry']['breaches'],unit:number,approaches:DepthGame['relayApproaches']=[],siege?:DepthGame['siege'],shutter?:DepthGame['relayShutter']){
  this.shutterPanels.forEach((panel,index)=>{
   panel.visible=!!shutter;
   if(!shutter)return;
   panel.position.set((shutter.x+shutter.width/2)/unit,index===0?.28:1.04,(shutter.y+shutter.height/2)/unit);
   panel.scale.set(shutter.width/unit,index===0?.56:.48,shutter.height/unit);
  });
  const covered=choices.find(choice=>choice.kind==='bank'&&choice.id==='1')??(siege?.selectedBank==='far'?siege:undefined);
  this.coverGlyph.visible=!!covered;
  if(covered)this.coverGlyph.position.set(covered.x/unit,.055,covered.y/unit);
  this.routes.forEach((mesh,index)=>{
   const path=approaches[index];
   let count=0;
   for(let i=1;path&&i<path.length;i++){
    const from=path[i-1],to=path[i],dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy);
    for(let along=22;along<distance&&count<48;along+=37){
     this.routeDummy.position.set((from.x+dx*along/distance)/unit,.05,(from.y+dy*along/distance)/unit);
     this.routeDummy.rotation.y=-Math.atan2(dy,dx);this.routeDummy.scale.setScalar(index===1?1.1:.65);this.routeDummy.updateMatrix();
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
   mesh.material=choice.kind==='failed-bank'?this.failed:this.materials[choice.kind==='gate'||choice.kind==='reserve'||choice.id==='0'?0:1];
   mesh.position.set(choice.x/unit,.04,choice.y/unit);
   mesh.scale.setScalar(choice.radius/unit);
  });
 }
 dispose(){this.root.removeFromParent();this.routes.forEach(mesh=>mesh.dispose());this.geometry.dispose();this.shutterGeometry.dispose();this.shutterMaterial.dispose();this.coverGlyphGeometry.dispose();this.failedGeometry.dispose();this.arrowGeometry.dispose();this.failed.dispose();this.materials.forEach(m=>m.dispose());}
}
