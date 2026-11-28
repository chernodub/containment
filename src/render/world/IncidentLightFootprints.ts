import {AdditiveBlending,CanvasTexture,Mesh,MeshBasicMaterial,NormalBlending,PlaneGeometry,SRGBColorSpace,type Group} from 'three';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {MARINE_FLOOR_GLOW,roomValueProfile} from '../lighting/RoomValueStandard';
import {clipFightingDeck} from './FightingDeck';
import {laneTerminal} from '../lighting/LaneWorklight';
import {reactorReturn} from './FightLaneDamage';

import {arenaAperture} from '../lighting/ArenaAperture';
import {IncidentPieces} from './Inc13StoryIncidents';

export function paintArenaReceiver(c:CanvasRenderingContext2D,arena:Point,id:string,inner:number,tint:number){
  c.save();c.translate(arena.x,arena.y);
  const radius=inner*32;c.scale(radius,radius);
  const [w,d,taper,openings]=arenaAperture(id);
  c.scale(w,d);
  const aperture=new Path2D();
  for(let i=0;i<openings;i++){
    const near=-1+2*i/openings+(i?.04:0), far=-1+2*(i+1)/openings-(i+1<openings?.04:0);
    aperture.moveTo(-1-near*taper,near);aperture.lineTo(1+near*taper,near);
    aperture.lineTo(1+far*taper,far);aperture.lineTo(-1-far*taper,far);aperture.closePath();
  }
  c.clip(aperture);
  const cast=c.createLinearGradient(-1,-.8,1,.8);
  const color='#'+tint.toString(16).padStart(6,'0');
  cast.addColorStop(0,color+'28');cast.addColorStop(1,color+'0e');
  c.fillStyle=cast;c.fillRect(-2,-1,4,2);c.restore();
}

export function addIncidentLightFootprints(root:Group,room:RoomTemplate){
  const profile=roomValueProfile(room.id);
  // Interlock bakes this receiver into its relief sheet's emissive channel.
  if(!profile?.landmark)return;
  const plan=SHIP_ARCHITECTURE_PLANS[room.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  const arena=plan?.arena??{x:room.width/2,y:room.height/2};
  const [width,depth,taper,openings]=arenaAperture(room.id);
  const radius=profile.perimeter.inner*32;
  const span=Math.max(25,radius*width*(1-taper)*.87);
  const fixture=new IncidentPieces();
  fixture.box(0,29,0,span+12,8,17,0x485456);
  for(const side of [-1,1]){
    const x=side*(span/2+3);
    fixture.box(x,13,-5,6,26,8,0x374548);
    fixture.box(x,2,-4,14,4,19,0x667370);
  }
  fixture.box(0,34,2,span,3,8,profile.landmark.color);
  for(let i=1;i<openings;i++)fixture.box(span*(i/openings-.5),35,2,4,5,13,0x40494a);
  fixture.finish(root,'arena-projector',arena.x,arena.y-radius*depth,new MeshBasicMaterial({vertexColors:true}));
  if(room.id==='safety-interlock-station')return;
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=Math.round(canvas.width*room.height/room.width);
  const c=canvas.getContext('2d')!;
  c.scale(canvas.width/room.width,canvas.height/room.height);
  clipFightingDeck(c,room);
  paintArenaReceiver(c,arena,room.id,profile.perimeter.inner,profile.landmark.color);
  const coolant=room.id==='coolant-plant';
  if(coolant){
    const terminal=laneTerminal(room.id)!;
    c.save();c.translate(...terminal);
    c.strokeStyle='#101b20';c.lineWidth=14;c.lineCap='round';
    c.stroke(new Path2D('M-42 42L-7 48M1 51L26 63'));c.restore();
  }
  if(room.id==='overload-floor'){
    c.save();c.translate(833.71249,349.81813);c.lineJoin='round';
    const path=new Path2D(reactorReturn);
    c.strokeStyle='#bfab7e';c.lineWidth=32;c.stroke(path);
    c.strokeStyle='#82928e';c.lineWidth=25;c.stroke(path);
    c.strokeStyle='#4f6565';c.setLineDash([29,4]);c.lineWidth=19;c.stroke(path);
    c.setLineDash([]);
    c.strokeStyle='#ffe0a1';c.lineWidth=5;
    c.stroke(new Path2D('M-32 -18H-75L-80 -23V-54H-32'));
    c.restore();
  }
  const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;
  const material=new MeshBasicMaterial({map:texture,transparent:true,blending:coolant?NormalBlending:AdditiveBlending,
    opacity:.40,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-7,polygonOffsetUnits:-7});
  material.onBeforeCompile=shader=>{
    shader.uniforms.receiverMarine=MARINE_FLOOR_GLOW;
    shader.vertexShader='varying vec2 receiverXZ;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nreceiverXZ=(modelMatrix*vec4(transformed,1.)).xz;');
    const bootResponse=coolant?`
      float contact=(1.-smoothstep(.32,.79,distance(receiverXZ,receiverMarine.xy)))*receiverMarine.w/1.3;
      outgoingLight=mix(outgoingLight,vec3(.012,.018,.022),contact);
      diffuseColor.a=max(diffuseColor.a,.76*contact);`:
      'diffuseColor.a*=smoothstep(.23,.57,distance(receiverXZ,receiverMarine.xy));';
    shader.fragmentShader='varying vec2 receiverXZ; uniform vec4 receiverMarine;\n'+shader.fragmentShader.replace(
      '#include <opaque_fragment>',bootResponse+'\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=>coolant?'coolant-receiver-contact-v1':'arena-receiver-contact-v1';
  material.userData.actorMaterial=true;
  material.addEventListener('dispose',()=>texture.dispose());
  const mesh=new Mesh(new PlaneGeometry(room.width/32,room.height/32).rotateX(-Math.PI/2),material);
  mesh.name='incident-reflected-light';
  mesh.position.set(room.width/64,.0218,room.height/64);
  mesh.renderOrder=3;root.add(mesh);
}
