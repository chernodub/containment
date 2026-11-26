import {Color,MeshBasicMaterial,type Group} from 'three';
import {incidentLanes} from '../lighting/IncidentLaneLayouts';
import {laneTerminal} from '../lighting/LaneWorklight';
import {roomValueProfile} from '../lighting/RoomValueStandard';
import {IncidentPieces} from './Inc13StoryIncidents';

import {environmentClock} from '../lighting/HotFixtureSurface';

export const incidentPracticalColors:Record<string,number>={
 'awakening-bay':0xefba76,'passenger-vault':0xbad89b,'residential-gallery':0xb9d9df,
 'communal-atrium':0xc9acd9,'crew-checkpoint':0xe5ad6c,armory:0x9bc89c,
 'freight-hold':0xb3d7e2,'breached-loading-bay':0xf0b078,'relay-racks':0xe7af70,
 'transmission-chamber':0xf1b172,'diagnostic-gallery':0xc3a1d6,'safety-interlock-station':0x9cd9ae,
 'coolant-plant':0xe4b071,'service-shaft-landing':0xc9c1e5,'infested-workshop':0xe6bd85,
 'swarm-junction':0xa7cba4,'shielding-gate':0xe4b56c,'containment-annulus':0xe6b277,
 'manual-control-chamber':0xa1d5ae,'overload-floor':0xb6d5e1,
};
type Strip=readonly [number,number,number,number,number,number];
// x, z, elevation, length, width and yaw on the existing machine. Incident
// lanes use the source socket's longitudinal axis; other machines use deck axes.
const strips:Record<string,readonly Strip[]>={
  'awakening-bay':[[24,12,10,35,4,-.19],[280,19,8,45,4,-.16]],
  'residential-gallery':[[50,0,17.6,54,6,0]],
  'crew-checkpoint':[[48,-12,9.8,48,5,.20]],
  'freight-hold':[[324,42,14.4,62,4,0]],
  'breached-loading-bay':[[94,3,9.7,18,3,.15]],
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

// Deck-level inspection lamps recovered with the failed hardware. Positions are
// relative to the same terminal as the matching fittings, in ship-plan units.
const inspectionLamps:Record<string,Strip>={
  'transmission-chamber':[99,43,9.7,13,4,0],
  'crew-checkpoint':[76,66,4.2,17,5,-.27],
  'shielding-gate':[92,-64,6.2,13,4,.18],
};

function mountedStrips(id:string){
  const layout=incidentLanes[id],origin=layout??laneTerminal(id),source=roomValueProfile(id)?.landmark;
  if(!origin||!source)return;
  const angle=layout?Math.atan2(layout[3]-layout[1],layout[2]-layout[0]):0;
  const end=layout?Math.hypot(layout[2]-layout[0],layout[3]-layout[1]):0;
  const lamp:Strip=[end,0,13,36,11,0];
  return {origin,angle,color:incidentPracticalColors[id]??source.color,parts:strips[id]??[],lamp,inspection:inspectionLamps[id]};
}

export function addMachineEmitters(root:Group,id:string){
  const mount=mountedStrips(id);if(!mount)return;
  const pieces=new IncidentPieces(),tone=new Color(mount.color).multiplyScalar(.83).getHex();
  // A hood, shoe and short post make the auxiliary head legible from above.
  const [x,z,y]=mount.lamp;
  pieces.box(x,1,z,12,2,9,0x404747);
  pieces.box(x,y/2,z,4,y,4,0x414b4d);
  pieces.box(x,y-1,z,41,4,16,0x606563);
  for(const [x,z,y,w,d,yaw] of [...mount.parts,mount.lamp])pieces.box(x,y,z,w,.9,d,tone,yaw);
  if(mount.inspection){
    const [x,z,y,w,d,yaw]=mount.inspection;
    pieces.box(x,y-1,z,w+5,2,d+4,0x434d50,yaw);
    pieces.box(x,y+.3,z,w,.7,d,tone,yaw);
  }
  const material=new MeshBasicMaterial({vertexColors:true});
  const mesh=pieces.finish(root,'machine-diffusers',mount.origin[0],mount.origin[1],material);
  mesh.onBeforeRender=()=>material.color.setScalar(.89+.11*Math.sin(environmentClock.value*1.7+mount.angle));
  mesh.userData.lightFixtures=[{x:x/32,y:(y+4)/32,z:z/32,color:mount.color,nativeColor:true,gain:1.5,distance:8.2,poolWidth:2.1,poolDepth:3.0,poolAngle:mount.angle}];
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
