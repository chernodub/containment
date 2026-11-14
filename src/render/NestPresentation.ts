import * as T from 'three';
import {MAT,shell,rod,ball,batch} from './meshParts';
import {optimizeLocalLights} from './lighting/LocalLightShading';

const point=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);

/** Segmented brood thorax repeats the Queen's shell, dark tissue and paired heart. */
export function nest():T.Group {
  const root=new T.Group(),live=new T.Group(),husk=new T.Group();
  root.name='queen-nest';live.name='nest-living-sac';husk.name='nest-ruptured-husk';
  const skin=MAT.flesh.clone(),rib=MAT.shellDark.clone(),core=MAT.flesh.clone();
  skin.name='nest-membrane';skin.color.setHex(0x301b27);skin.roughness=.85;
  rib.name='nest-root-ribs';rib.color.setHex(0x74606a);rib.roughness=.80;
  core.name='nest-vulnerable-organ';core.color.setHex(0xca5861);core.emissive.setHex(0xa52336);core.emissiveIntensity=.40;
  for(const material of [skin,rib,core]){material.userData.actorMaterial=true;optimizeLocalLights(material);}

  shell(live,0,.48,-.045,.43,.36,1.06,skin);
  // Six overlapping scutes repeat the Queen's two opening mantle wings.
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const z=.25-i*.25;
    const plate=shell(live,side*.31,.62-i*.025,z,.22,.13,.36,rib);
    plate.rotation.z=side*.32;
    const torn=shell(husk,side*(.48+i*.035),.16,z,.21,.075,.34,rib);
    torn.rotation.set(0,side*.20,side*.60);
  }
  // Rooted contact limbs have elbow/knee masses rather than a radial hair fringe.
  for(let i=0;i<6;i++){
    const angle=i*Math.PI/3+Math.PI/6,c=Math.cos(angle),s=Math.sin(angle);
    const foot=point(c*.84,.08,s*.84),knee=point(c*.60,.24,s*.60),hip=point(c*.40,.49,s*.40);
    rod(live,foot,knee,.085,.070,rib);rod(live,knee,hip,.070,.055,rib);
    rod(husk,foot,knee,.085,.070,rib);
    rod(husk,knee,point(c*.69,.35,s*.69),.070,.028,rib);
  }
  // The contractile target has paired lobes, a dark median valve and one feeder.
  ball(live,-.105,.84,.09,.15,.23,.19,core);
  ball(live,.110,.87,.055,.14,.25,.18,core);
  shell(live,0,.92,.17,.035,.09,.28,skin);
  rod(live,point(.005,.98,.025),point(0,1.08,-.12),.035,.025,core);
  shell(husk,0,.055,0,.39,.035,.76,skin);

  batch(live);batch(husk);husk.visible=false;root.add(live,husk);
  root.userData.nestLive=live;root.userData.nestHusk=husk;root.userData.nestCore=core;
  return root;
}

/** Snapshot breathing and a retained torn husk never change GPU ownership. */
export function updateNest(root:T.Group,time:number,destroyed=false):void {
  const live=root.userData.nestLive as T.Group|undefined,husk=root.userData.nestHusk as T.Group|undefined;
  if(!live||!husk)return;
  live.visible=!destroyed;husk.visible=destroyed;root.userData.destroyed=destroyed;
  live.scale.y=1+Math.sin(time*3.1+root.position.x)*.035;
  const core=root.userData.nestCore as T.MeshStandardMaterial;
  core.emissiveIntensity=.40+Math.sin(time*3.1+root.position.x)*.07;
}
