import {Box3,Mesh,type Group} from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {clipFightingDeck} from './FightingDeck';

type Bounds=[number[],number[]];

export function paintLaneContacts(c:CanvasRenderingContext2D,room:RoomTemplate,root:Group){
  c.save();clipFightingDeck(c,room);
  function footprint([lo,hi]:Bounds){
    const w=(hi[0]-lo[0])*32,d=(hi[2]-lo[2])*32,height=(hi[1]-lo[1])*32;
    if(lo[1]>.9||hi[1]<.10||w*d<145||Math.max(w,d)<21)return;
    const x=(hi[0]+lo[0])*16,z=(hi[2]+lo[2])*16;
    // The interior directional key is above the northwest quarter. The
    // reactor key is local, so its shadows fan out from the core.
    const reactor=room.id==='manual-control-chamber'||room.id==='overload-floor';
    const dx=reactor?x-(room.id==='overload-floor'?700:449):4,dz=reactor?z-(room.id==='overload-floor'?508:572):3;
    const reach=Math.min(42,height*(reactor?.43:.20)),len=Math.hypot(dx,dz)||1;
    c.save();c.translate(x,z);
    c.fillStyle='rgba(7,12,16,.28)';c.beginPath();
    c.ellipse(dx*reach/len,dz*reach/len,w*.49+3,d*.49+3,0,0,Math.PI*2);c.fill();
    c.scale(w*.52+8,d*.52+8);
    const contact=c.createRadialGradient(0,0,.36,0,0,1);
    contact.addColorStop(0,'rgba(5,9,13,.63)');contact.addColorStop(.76,'rgba(6,10,15,.36)');
    contact.addColorStop(1,'rgba(7,12,16,0)');c.fillStyle=contact;c.fillRect(-1,-1,2,2);c.restore();
  }
  for(const kit of root.userData.placements??[])footprint(kit.bounds);
  for(const mesh of root.children){
    if(!(mesh instanceof Mesh)||!mesh.userData.laneContactBounds)continue;
    mesh.updateMatrix();
    for(const local of mesh.userData.laneContactBounds as Box3[]){
      local.applyMatrix4(mesh.matrix);footprint([local.min.toArray(),local.max.toArray()]);
    }
    delete mesh.userData.laneContactBounds;
  }
  c.restore();
}
