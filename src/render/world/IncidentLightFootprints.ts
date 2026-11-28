import {AdditiveBlending,CanvasTexture,Mesh,MeshBasicMaterial,NormalBlending,PlaneGeometry,SRGBColorSpace,Vector2,Vector4,type Group} from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {incidentApertures,paintIncidentAperture} from '../lighting/IncidentAperture';
import {incidentLanes} from '../lighting/IncidentLaneLayouts';
import {MARINE_FLOOR_GLOW} from '../lighting/RoomValueStandard';
import {laneTerminal} from '../lighting/LaneWorklight';
import {reactorReturn} from './FightLaneDamage';
import {clipFightingDeck} from './FightingDeck';
import {incidentPracticalColors} from './MachineEmitters';
import {storyIncidentSource} from './Inc13StoryIncidents';

// The incident is the third read after the marine and the creatures: its
// footprint stays below the marine's own pool in every fight frame.
const INCIDENT_LEVEL=.62;

// Set exposure at the fixture, so its throw keeps the same value as the
// combat camera moves. Narrow reflector hoods have a wider penumbra.
const reflectorGain:Readonly<Record<string,number>>={
  'awakening-bay':.63,'crew-checkpoint':.96,'relay-racks':.86,'shielding-gate':.92,
  'communal-atrium':.58,armory:.51,'breached-loading-bay':.93,
  'transmission-chamber':.62,'diagnostic-gallery':.95,'safety-interlock-station':.49,
  'infested-workshop':.59,'manual-control-chamber':.84,'overload-floor':.61,'coolant-plant':.83,'containment-annulus':.75,
};

// Soot, rubber and oil on these receivers absorb the white deck reflection.
// Keep the softer return in the same texture and draw as the coloured throw.
type Receiver=readonly [absorption:number,farCoverage:number,farGain:number,nearCoverage:number,nearGain:number];
const diffuseReturn:Readonly<Record<string,number>>={
  'breached-loading-bay':1.1,'coolant-plant':1.2,'diagnostic-gallery':1.15,
};
const receiverResponses:Readonly<Record<string,Receiver>>={
  'awakening-bay':[.48,.45,2.43,.75,7],armory:[.81,1,5,1,17],
  'safety-interlock-station':[.73,.72,4.82,1,10.7],
  'infested-workshop':[.40,.45,2.4,.75,7],
  'manual-control-chamber':[.58,.72,3.4,.45,3.4],
  'service-shaft-landing':[.38,.72,2.4,.72,3.4],
  'communal-atrium':[0,1,1,1,1.5],'containment-annulus':[0,1,1.045,1,1.9],
};

// A metal receiver also returns the suit light when the marine walks past.
// Choose the local fitting per fragment so the distant source stays steady.
function applyReceiverResponse(material:MeshBasicMaterial,receiver:Receiver,a:readonly number[],b:readonly number[],roomId:string){
  const [absorption,farCoverage,farGain,nearCoverage,nearGain]=receiver;
  material.color.multiplyScalar(1-absorption*.55);
  const mounts=new Vector4(a[0]/32,a[1]/32,b[0]/32,b[1]/32);
  const response=new Vector4(nearCoverage,nearCoverage*nearGain,farCoverage,farCoverage*farGain);
  material.onBeforeCompile=shader=>{
    shader.uniforms.receiverMounts={value:mounts};
    shader.uniforms.receiverResponse={value:response};
    shader.uniforms.receiverMarine=MARINE_FLOOR_GLOW;
    shader.uniforms.receiverRange={value:roomId==='manual-control-chamber'?new Vector2(1.1,1.8):
      roomId==='communal-atrium'?new Vector2(2.1,3.6):new Vector2(2.55,4.9)};
    shader.vertexShader='varying vec2 receiverXZ;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nreceiverXZ=(modelMatrix*vec4(transformed,1.)).xz;');
    shader.fragmentShader='varying vec2 receiverXZ; uniform vec4 receiverMounts,receiverMarine,receiverResponse; uniform vec2 receiverRange;\n'+
      shader.fragmentShader.replace('#include <opaque_fragment>',`
        vec2 a=receiverMounts.xy,b=receiverMounts.zw;
        float crossFade=smoothstep(-1.5,1.5,distance(receiverXZ,a)-distance(receiverXZ,b));
        vec2 distances=vec2(distance(a,receiverMarine.xy),distance(b,receiverMarine.xy));
        vec2 fades=smoothstep(vec2(receiverRange.x),vec2(receiverRange.y),distances);
        float away=mix(fades.x,fades.y,crossFade);
        vec2 response=mix(receiverResponse.xy,receiverResponse.zw,away);
        diffuseColor.a*=response.x;
        outgoingLight*=response.y/response.x;
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>'smoked-incident-receiver-v1';
}

export function addIncidentLightFootprints(root:Group,room:RoomTemplate){
  const terminal=laneTerminal(room.id),profile=incidentApertures[room.id];
  if(!terminal||!profile)return;
  const tint=incidentPracticalColors[room.id],lane=incidentLanes[room.id];
  const angle=lane?Math.atan2(lane[3]-lane[1],lane[2]-lane[0]):0;
  const source=storyIncidentSource(room.id);
  const receiver=receiverResponses[room.id];
  const absorb=receiver?.[0]??0;
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
    c.translate(0,closeThrow?(room.id==='freight-hold'?65:15):39);
    if(absorb){
      c.save();c.scale(125,112);
      const soot=c.createRadialGradient(0,0,0,0,0,1);
      soot.addColorStop(0,'rgba(18,22,23,.95)');
      soot.addColorStop(.6,'rgba(18,22,23,.82)');
      soot.addColorStop(1,'rgba(18,22,23,0)');
      c.globalAlpha=absorb;c.fillStyle=soot;c.fillRect(-1,-1,2,2);
      c.restore();
    }
    const broadFan=room.id==='armory'||room.id==='safety-interlock-station';
    c.scale(profile[0]==='strip'?3.6:closeThrow?1.7:broadFan?3.1:2.45,closeThrow?1.3:1.65);
    c.globalAlpha=absorb?gain:closeThrow?.76:1;
    if(room.id==='swarm-junction')c.scale(.48,.54);
    if(room.id==='coolant-plant'){
      c.scale(.82,.54);
      c.beginPath();c.rect(-200,-160,400,137);c.rect(-200,22,400,138);c.clip();
    }
    if(room.id==='shielding-gate'){
      // The gate shoe occludes the reflector downstream of its near flange.
      c.beginPath();c.rect(-60,-39,120,65);c.clip();
    }
    paintIncidentAperture(c,room.id,tint);
    c.restore();
  }
  if(room.id==='service-shaft-landing'&&source){
    // The spoke wheel sits on the returned tackle, 145 ship units past the
    // broken lifting eye. Its inspection head grazes the lower balcony.
    c.save();c.translate(source[0]-40,source[1]+138);c.rotate(-.38);
    c.scale(1.28,.88);c.globalAlpha=.32;paintIncidentAperture(c,room.id,tint);c.restore();
  }
  if(room.id==='overload-floor'){
    c.save();c.translate(833.71249,349.81813);c.lineJoin='round';
    c.strokeStyle='#a99a75';c.lineWidth=30;c.stroke(new Path2D(reactorReturn));
    c.strokeStyle='#ffe0a1';c.lineWidth=5;
    c.stroke(new Path2D('M-32 -18H-75L-80 -23V-54H-32'));
    c.restore();
  }
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;
  const material=new MeshBasicMaterial({map:texture,transparent:true,blending:absorb?NormalBlending:AdditiveBlending,
    opacity:(absorb?1:gain)*INCIDENT_LEVEL,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-7,polygonOffsetUnits:-7});
  material.color.multiplyScalar(diffuseReturn[room.id]??1);
  if(receiver)applyReceiverResponse(material,receiver,terminal,mounts[1]?.pin??terminal,room.id);
  material.userData.actorMaterial=true;
  material.addEventListener('dispose',()=>texture.dispose());
  const mesh=new Mesh(new PlaneGeometry(room.width/32,room.height/32).rotateX(-Math.PI/2),material);
  mesh.name='incident-reflected-light';
  mesh.userData.incidentMounts=mounts;
  mesh.position.set(room.width/64,.0218,room.height/64);
  mesh.renderOrder=3;root.add(mesh);
}
