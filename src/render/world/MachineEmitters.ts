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
  const lamp:Strip=[end,0,18,14,7,0];
  return {origin,angle,color:source.color,parts:strips[id]??[],lamp,inspection:inspectionLamps[id]};
}

export function addMachineEmitters(root:Group,id:string){
  const mount=mountedStrips(id);if(!mount)return;
  const pieces=new IncidentPieces(),tone=new Color(mount.color).multiplyScalar(.53).getHex();
  // A hood, shoe and short post make the auxiliary head legible from above.
  const [x,z,y]=mount.lamp;
  pieces.box(x,1,z,12,2,9,0x404747);
  pieces.box(x,y/2,z,4,y,4,0x414b4d);
  pieces.box(x,y-1,z,18,3,10,0x606563);
  for(const [x,z,y,w,d,yaw] of [...mount.parts,mount.lamp])pieces.box(x,y,z,w,.9,d,tone,yaw);
  if(mount.inspection){
    const [x,z,y,w,d,yaw]=mount.inspection;
    pieces.box(x,y-1,z,w+5,2,d+4,0x434d50,yaw);
    pieces.box(x,y+.3,z,w,.7,d,tone,yaw);
  }
  const mesh=pieces.finish(root,'machine-diffusers',mount.origin[0],mount.origin[1],new MeshBasicMaterial({vertexColors:true}));
  mesh.rotation.y=-mount.angle;mesh.castShadow=false;
}

export function paintMachineSpill(c:CanvasRenderingContext2D,id:string){
  const mount=mountedStrips(id);if(!mount)return;
  c.save();c.translate(mount.origin[0],mount.origin[1]);c.rotate(mount.angle);
  const tint='#'+mount.color.toString(16).padStart(6,'0');
  // Metal visor cuts off the rectangular work lamp at the edge of its service area.
  c.save();c.translate(mount.lamp[0],mount.lamp[1]);
  const pool=c.createLinearGradient(0,0,0,56);
  pool.addColorStop(0,tint+'94');pool.addColorStop(1,tint+'22');
  c.fillStyle=pool;c.fill(new Path2D('M-7 0H7L30 55H-31Z'));c.restore();
  if(mount.inspection){
    const [x,z,,,,yaw]=mount.inspection;
    c.save();c.translate(x,z);c.rotate(-yaw+.48);
    const throwLight=c.createLinearGradient(0,0,0,59);
    throwLight.addColorStop(0,tint+'bc');throwLight.addColorStop(.64,tint+'57');throwLight.addColorStop(1,tint+'18');
    c.fillStyle=throwLight;c.fill(new Path2D('M-8 0H8L35 59H-30Z'));c.restore();
  }
  for(const [x,z,,w,d,yaw] of mount.parts){
    c.save();c.translate(x,z);c.rotate(-yaw);c.scale(w*.55+15,d*.55+20);
    const glow=c.createRadialGradient(0,0,.08,0,0,1);
    glow.addColorStop(0,tint+'b0');glow.addColorStop(.55,tint+'55');glow.addColorStop(1,tint+'00');
    c.fillStyle=glow;c.fillRect(-1,-1,2,2);c.restore();
  }
  c.restore();
}
