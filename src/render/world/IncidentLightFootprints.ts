import {AdditiveBlending,CanvasTexture,Mesh,MeshBasicMaterial,NormalBlending,PlaneGeometry,SRGBColorSpace,type Group} from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {incidentApertures,paintIncidentAperture} from '../lighting/IncidentAperture';
import {incidentLanes} from '../lighting/IncidentLaneLayouts';
import {laneTerminal} from '../lighting/LaneWorklight';
import {clipFightingDeck} from './FightingDeck';
import {incidentPracticalColors} from './MachineEmitters';
import {storyIncidentSource} from './Inc13StoryIncidents';

// Set exposure at the fixture, so its throw keeps the same value as the
// combat camera moves. Narrow reflector hoods have a wider penumbra.
const reflectorGain:Readonly<Record<string,number>>={
  'awakening-bay':.63,'crew-checkpoint':.96,'relay-racks':.86,'shielding-gate':.79,
  'communal-atrium':.58,armory:.51,'breached-loading-bay':.83,
  'transmission-chamber':.62,'diagnostic-gallery':.91,'safety-interlock-station':.49,
  'infested-workshop':.59,'manual-control-chamber':.84,'overload-floor':.61,
};

// Soot, rubber and oil on these receivers absorb the white deck reflection.
// Keep the softer return in the same texture and draw as the coloured throw.
const smokedReceivers:Readonly<Record<string,number>>={
  'awakening-bay':.48,armory:.81,'safety-interlock-station':.73,
  'infested-workshop':.40,'manual-control-chamber':.58,'service-shaft-landing':.38,
};

export function addIncidentLightFootprints(root:Group,room:RoomTemplate){
  const terminal=laneTerminal(room.id),profile=incidentApertures[room.id];
  if(!terminal||!profile)return;
  const tint=incidentPracticalColors[room.id],lane=incidentLanes[room.id];
  const angle=lane?Math.atan2(lane[3]-lane[1],lane[2]-lane[0]):0;
  const source=storyIncidentSource(room.id);
  const absorb=smokedReceivers[room.id]??0;
  const gain=reflectorGain[room.id]??.69;
  const mounts=[{pin:terminal,angle}];
  if(source&&Math.hypot(source[0]-terminal[0],source[1]-terminal[1])>110)mounts.push({pin:source,angle:Math.atan2(source[0]-terminal[0],terminal[1]-source[1])});
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=Math.round(canvas.width*room.height/room.width);
  const c=canvas.getContext('2d')!;
  c.scale(canvas.width/room.width,canvas.height/room.height);
  clipFightingDeck(c,room);
  for(const {pin,angle} of mounts){
    c.save();c.translate(...pin);c.rotate(angle);
    // The reflector projects away from the lamp shoe. The damaged machine
    // occupies the near edge and casts a narrow shadow through its throw.
    const atSource=pin===source;
    const closeThrow=atSource&&(room.id==='freight-hold'||room.id==='residential-gallery');
    c.translate(0,closeThrow?15:39);
    if(absorb){
      c.save();c.scale(125,112);
      const soot=c.createRadialGradient(0,0,0,0,0,1);
      soot.addColorStop(0,'rgba(18,22,23,.95)');
      soot.addColorStop(.6,'rgba(18,22,23,.82)');
      soot.addColorStop(1,'rgba(18,22,23,0)');
      c.globalAlpha=absorb;c.fillStyle=soot;c.fillRect(-1,-1,2,2);
      c.restore();
    }
    c.scale(profile[0]==='strip'?5.7:closeThrow?2.2:3.3,closeThrow?1.45:1.95);
    c.globalAlpha=absorb?gain:closeThrow?.76:1;
    paintIncidentAperture(c,room.id,tint);
    c.restore();
  }
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;
  const material=new MeshBasicMaterial({map:texture,transparent:true,blending:absorb?NormalBlending:AdditiveBlending,
    opacity:absorb?1:gain,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-7,polygonOffsetUnits:-7});
  if(absorb)material.color.multiplyScalar(1-absorb*.55);
  material.userData.actorMaterial=true;
  material.addEventListener('dispose',()=>texture.dispose());
  const mesh=new Mesh(new PlaneGeometry(room.width/32,room.height/32).rotateX(-Math.PI/2),material);
  mesh.name='incident-reflected-light';
  mesh.userData.incidentMounts=mounts;
  mesh.position.set(room.width/64,.0218,room.height/64);
  mesh.renderOrder=3;root.add(mesh);
}
