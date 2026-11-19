import * as T from 'three';
import {registerGeometry} from '../post/GeometryBuffer';
import type {Rect} from '../../game/roguelike/types';

export function showIncidentColliders(world:T.Group,visible:boolean):void {
  let lines=world.getObjectByName('incident-collider-debug');
  const rects:readonly Rect[]|undefined=world.userData.incidentObstacles;
  if(!lines&&visible&&rects?.length){
    const vertices:number[]=[];
    for(const r of rects){
      const corners=[[r.x,r.y],[r.x+r.width,r.y],[r.x+r.width,r.y+r.height],[r.x,r.y+r.height]];
      const inner=[[r.x+2,r.y+2],[r.x+r.width-2,r.y+2],[r.x+r.width-2,r.y+r.height-2],[r.x+2,r.y+r.height-2]];
      for(let i=0;i<4;i++){
        const j=(i+1)%4;
        for(const p of [corners[i],corners[j],inner[j],corners[i],inner[j],inner[i]])
          vertices.push(p[0]/32,.03,p[1]/32);
      }
    }
    const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    const material=new T.MeshBasicMaterial({color:0x4affc2,transparent:true,opacity:.85,side:T.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false});
    material.userData.actorMaterial=true;
    lines=new T.Mesh(geometry,material);lines.name='incident-collider-debug';
    lines.renderOrder=999;registerGeometry(lines);world.add(lines);
  }
  if(lines)lines.visible=visible;
}
