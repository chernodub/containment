import {BoxGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Color} from 'three';

export interface GrillePose {x:number;y:number;angle:number;state:string;changedAt:number}
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
    this.bars=batch([[-.02,.86,0,.09,.09,1.85,0xb78a53],...[-.8,-.4,0,.4,.8].map(z=>[0,.5,z,.08,1.0,.065,0x879197])]);
    this.frame=batch([[0,.68,-.99,.13,1.36,.14,0x465253],[0,.68,.99,.13,1.36,.14,0x465253],[-.55,.08,0,.30,.13,1.87,0xffbd69]]);
    this.frame.add(this.bars);this.frame.visible=false;
  }
  update(pose:GrillePose|undefined,time:number){
    this.frame.visible=!!pose&&pose.state!=='entered';if(!pose)return;
    this.frame.position.set(pose.x/32,0,pose.y/32);this.frame.rotation.y=-pose.angle;
    this.bars.position.y=pose.state==='closed'?1.02*Math.max(0,1-64*(time-pose.changedAt)**2):1.02;
  }
  dispose(){this.frame.removeFromParent();this.bars.geometry.dispose();this.frame.geometry.dispose();this.material.dispose();}
}
