import {Color,MeshBasicMaterial,type Group} from 'three';
import {incidentLanes} from '../lighting/IncidentLaneLayouts';
import {laneTerminal} from '../lighting/LaneWorklight';
import {roomValueProfile} from '../lighting/RoomValueStandard';
import {IncidentPieces} from './Inc13StoryIncidents';

type Strip=readonly [number,number,number,number,number,number];
// x, z, elevation, length, width and yaw on the existing machine. Incident
// lanes use the source socket's longitudinal axis; other machines use deck axes.
const strips:Record<string,readonly Strip[]>={
  'awakening-bay':[[24,12,10,35,4,-.19],[280,19,8,45,4,-.16]],
  'residential-gallery':[[50,0,17.6,54,6,0]],
  'crew-checkpoint':[[48,-12,9.8,48,5,.20]],
  'freight-hold':[[224,-17,7,72,4,0],[128,17,7,44,4,0]],
  'breached-loading-bay':[[62,7,12.4,84,4,Math.PI/2]],
  'relay-racks':[[108,-72,8.2,82,4,0]],
  'transmission-chamber':[[126,-56,11,70,4,0],[-23,16,23,34,4,.5]],
  'diagnostic-gallery':[[215,79,17.8,6,68,0]],
  'safety-interlock-station':[[76,0,10,48,5,0]],
  'coolant-plant':[[-42,-104,5.4,62,4,Math.PI/2],[-12,4,25,16,4,0]],
  'service-shaft-landing':[[0,0,22,45,5,.79],[122,507,48,33,4,0]],
  'swarm-junction':[[70,0,15.2,61,4,0]],
  'shielding-gate':[[-83,36,10,70,5,0],[-39,-36,10,48,5,0]],
  'manual-control-chamber':[[-107,26,7.4,69,4,-.025]],
};

function mountedStrips(id:string){
  const layout=incidentLanes[id],origin=layout??laneTerminal(id),source=roomValueProfile(id)?.landmark;
  if(!strips[id]||!origin||!source)return;
  const angle=layout?Math.atan2(layout[3]-layout[1],layout[2]-layout[0]):0;
  return {origin,angle,color:source.color,parts:strips[id]};
}

export function addMachineEmitters(root:Group,id:string){
  const mount=mountedStrips(id);if(!mount)return;
  const pieces=new IncidentPieces(),tone=new Color(mount.color).multiplyScalar(.53).getHex();
  for(const [x,z,y,w,d,yaw] of mount.parts)pieces.box(x,y,z,w,.9,d,tone,yaw);
  const mesh=pieces.finish(root,'machine-diffusers',mount.origin[0],mount.origin[1],new MeshBasicMaterial({vertexColors:true}));
  mesh.rotation.y=-mount.angle;mesh.castShadow=false;
}

export function paintMachineSpill(c:CanvasRenderingContext2D,id:string){
  const mount=mountedStrips(id);if(!mount)return;
  c.save();c.translate(mount.origin[0],mount.origin[1]);c.rotate(mount.angle);
  const tint='#'+mount.color.toString(16).padStart(6,'0');
  for(const [x,z,,w,d,yaw] of mount.parts){
    c.save();c.translate(x,z);c.rotate(-yaw);c.scale(w*.55+15,d*.55+20);
    const glow=c.createRadialGradient(0,0,.08,0,0,1);
    glow.addColorStop(0,tint+'b0');glow.addColorStop(.55,tint+'55');glow.addColorStop(1,tint+'00');
    c.fillStyle=glow;c.fillRect(-1,-1,2,2);c.restore();
  }
  c.restore();
}
