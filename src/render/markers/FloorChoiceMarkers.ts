import * as T from 'three';
import type {DepthGame} from '../../DepthGame';

export class FloorChoiceMarkers {
 readonly root=new T.Group();
 private readonly geometry=new T.RingGeometry(.82,1,32);
 private readonly materials=[
  new T.MeshBasicMaterial({color:0xffbf62,transparent:true,opacity:.75,depthWrite:false,side:T.DoubleSide}),
  new T.MeshBasicMaterial({color:0x8debff,transparent:true,opacity:.72,depthWrite:false,side:T.DoubleSide}),
 ];
 private readonly failed=new T.MeshBasicMaterial({color:0xff6553,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide});
 private readonly pads=Array.from({length:3},()=>{
  const mesh=new T.Mesh(this.geometry,this.materials[0]);
  mesh.rotation.x=-Math.PI/2;mesh.visible=false;this.root.add(mesh);return mesh;
 });
 update(choices:DepthGame['floorControls'],unit:number){
  this.pads.forEach((mesh,index)=>{
   const choice=choices[index];
   mesh.visible=!!choice;
   if(!choice)return;
   mesh.material=choice.kind==='failed-bank'?this.failed:this.materials[choice.kind==='gate'?0:1];
   mesh.position.set(choice.x/unit,.04,choice.y/unit);
   mesh.scale.setScalar(choice.radius/unit);
  });
 }
 dispose(){this.root.removeFromParent();this.geometry.dispose();this.failed.dispose();this.materials.forEach(m=>m.dispose());}
}
