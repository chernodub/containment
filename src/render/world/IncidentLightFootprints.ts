import {AdditiveBlending,CanvasTexture,Mesh,MeshBasicMaterial,PlaneGeometry,SRGBColorSpace,type Group} from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {incidentApertures,paintIncidentAperture} from '../lighting/IncidentAperture';
import {incidentLanes} from '../lighting/IncidentLaneLayouts';
import {laneTerminal} from '../lighting/LaneWorklight';
import {clipFightingDeck} from './FightingDeck';
import {incidentPracticalColors} from './MachineEmitters';
import {storyIncidentSource} from './Inc13StoryIncidents';

export function addIncidentLightFootprints(root:Group,room:RoomTemplate){
  const terminal=laneTerminal(room.id),profile=incidentApertures[room.id];
  if(!terminal||!profile)return;
  const tint=incidentPracticalColors[room.id],lane=incidentLanes[room.id];
  const angle=lane?Math.atan2(lane[3]-lane[1],lane[2]-lane[0]):0;
  const source=storyIncidentSource(room.id);
  const mounts=[{pin:terminal,angle}];
  if(source&&Math.hypot(source[0]-terminal[0],source[1]-terminal[1])>110)mounts.push({pin:source,angle:0});
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=Math.round(canvas.width*room.height/room.width);
  const c=canvas.getContext('2d')!;
  c.scale(canvas.width/room.width,canvas.height/room.height);
  clipFightingDeck(c,room);
  for(const {pin,angle} of mounts){
    c.save();c.translate(...pin);c.rotate(angle);
    // The reflector projects away from the lamp shoe. The damaged machine
    // occupies the near edge and casts a narrow shadow through its throw.
    c.translate(0,48);c.scale(2.6,1.65);
    paintIncidentAperture(c,room.id,tint);
    c.restore();
  }
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;
  const material=new MeshBasicMaterial({map:texture,transparent:true,blending:AdditiveBlending,
    opacity:.69,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-7,polygonOffsetUnits:-7});
  material.userData.actorMaterial=true;
  material.addEventListener('dispose',()=>texture.dispose());
  const mesh=new Mesh(new PlaneGeometry(room.width/32,room.height/32).rotateX(-Math.PI/2),material);
  mesh.name='incident-reflected-light';
  mesh.userData.incidentMounts=mounts;
  mesh.position.set(room.width/64,.0218,room.height/64);
  mesh.renderOrder=3;root.add(mesh);
}
