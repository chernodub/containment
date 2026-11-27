import {BoxGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Color} from 'three';

export interface GrillePose {x:number;y:number;angle:number;escorts?:number;state:string;changedAt:number}
export class RecoveryGrille {
  private readonly material=new MeshBasicMaterial({vertexColors:true});
  readonly bars:Mesh;
  readonly frame:Mesh;
  constructor(){
    const batch=(parts:number[][])=>{
      const geometry=parts.map(([x,y,z,w,h,d,tint])=>{
        const box=new BoxGeometry(w,h,d).translate(x,y,z),color=new Color(tint);
        const rgb=new Float32Array(box.attributes.position.count*3);
        for(let i=0;i<rgb.length;i+=3)color.toArray(rgb,i);
        box.setAttribute('color',new Float32BufferAttribute(rgb,3));return box;
      });
      const merged=mergeGeometries(geometry)!;geometry.forEach(g=>g.dispose());
      return new Mesh(merged,this.material);
    };
    // The two open bays frame the waiting heads. The shutter drops between
    // the fixed jambs, in front of the lit aisle lining and the creatures.
    this.bars=batch([[0,1.07,0,.15,.16,3.28,0xaab3aa],
      ...[-1.58,0,1.58].map(z=>[-.34,.64,z,.72,.12,.11,0x929c94]),
      ...[-1.5,-.5,.5,1.5].map(z=>[0,.55,z,.12,1.1,.11,0x586464])]);
    this.frame=batch([
      ...[-1.72,0,1.72].map(z=>[.04,.83,z,.15,1.66,.12,0x303b40]),
      [0,1.73,0,.22,.17,3.58,0x788184],
      [-1.85,.78,0,.16,1.56,3.48,0xa78350],
      [-1.74,1.47,0,.10,.13,3.34,0xffdc8c],
      [-1.19,.055,0,1.28,.10,3.36,0xaa8c61]]);
    this.frame.add(this.bars);this.frame.visible=false;
  }
  update(pose:GrillePose|undefined,time:number){
    this.frame.visible=!!pose&&pose.state!=='entered';if(!pose)return;
    this.frame.scale.z=Math.max(1,(pose.escorts??2)/2);
    this.frame.position.set(pose.x/32,0,pose.y/32);this.frame.rotation.y=-pose.angle;
    this.bars.position.y=pose.state==='closed'?.64*Math.max(0,1-100*(time-pose.changedAt)**2):.64;
  }
  dispose(){this.frame.removeFromParent();this.bars.geometry.dispose();this.frame.geometry.dispose();this.material.dispose();}
}
