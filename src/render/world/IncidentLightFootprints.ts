import {AdditiveBlending,CanvasTexture,Mesh,MeshBasicMaterial,PlaneGeometry,SRGBColorSpace,type Group} from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {MARINE_FLOOR_GLOW,roomValueProfile} from '../lighting/RoomValueStandard';
import {clipFightingDeck} from './FightingDeck';
import {reactorReturn} from './FightLaneDamage';

export function addIncidentLightFootprints(root:Group,room:RoomTemplate){
  const profile=roomValueProfile(room.id);
  if(!profile?.landmark)return;
  const plan=SHIP_ARCHITECTURE_PLANS[room.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  const arena=plan?.arena??{x:room.width/2,y:room.height/2};
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=Math.round(canvas.width*room.height/room.width);
  const c=canvas.getContext('2d')!;
  c.scale(canvas.width/room.width,canvas.height/room.height);
  clipFightingDeck(c,room);
  c.save();c.translate(arena.x,arena.y);
  const radius=profile.perimeter.inner*32;c.scale(radius,radius);
  // The eight barn-door edges match the bevel in the floor lighting shader.
  const aperture=new Path2D('M-.50 -.87H.50L1.19 -.31V.31L.50 .87H-.50L-1.19 .31V-.31Z');
  c.clip(aperture);
  const cast=c.createLinearGradient(-1,-.8,1,.8);
  const color='#'+profile.landmark.color.toString(16).padStart(6,'0');
  cast.addColorStop(0,color+'28');cast.addColorStop(1,color+'0e');
  c.fillStyle=cast;c.fillRect(-1.2,-1,2.4,2);c.restore();
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
  const material=new MeshBasicMaterial({map:texture,transparent:true,blending:AdditiveBlending,
    opacity:.40,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-7,polygonOffsetUnits:-7});
  material.onBeforeCompile=shader=>{
    shader.uniforms.receiverMarine=MARINE_FLOOR_GLOW;
    shader.vertexShader='varying vec2 receiverXZ;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nreceiverXZ=(modelMatrix*vec4(transformed,1.)).xz;');
    shader.fragmentShader='varying vec2 receiverXZ; uniform vec4 receiverMarine;\n'+shader.fragmentShader.replace(
      '#include <opaque_fragment>','diffuseColor.a*=smoothstep(.23,.57,distance(receiverXZ,receiverMarine.xy));\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=>'arena-receiver-contact-v1';
  material.userData.actorMaterial=true;
  material.addEventListener('dispose',()=>texture.dispose());
  const mesh=new Mesh(new PlaneGeometry(room.width/32,room.height/32).rotateX(-Math.PI/2),material);
  mesh.name='incident-reflected-light';
  mesh.position.set(room.width/64,.0218,room.height/64);
  mesh.renderOrder=3;root.add(mesh);
}
