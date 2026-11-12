import * as T from 'three';
import {MAT, shell, rod, batch} from './meshParts';
import {optimizeLocalLights} from './lighting/LocalLightShading';

const point=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);

/** Ribbed brood sac and prebuilt ruptured state share the original collision footprint. */
export function nest():T.Group {
  const root=new T.Group(),live=new T.Group(),husk=new T.Group();
  root.name='queen-nest';live.name='nest-living-sac';husk.name='nest-ruptured-husk';
  const skin=MAT.flesh.clone(),rib=MAT.shellDark.clone(),core=MAT.flesh.clone();
  skin.name='nest-membrane';skin.color.setHex(0x713947);skin.roughness=.5;
  rib.name='nest-root-ribs';rib.color.setHex(0x322a35);rib.roughness=.76;
  core.name='nest-vulnerable-organ';core.color.setHex(0xffb2d3);core.emissive.setHex(0xff2c95);core.emissiveIntensity=1.6;
  for(const material of [skin,rib,core]){material.userData.actorMaterial=true;optimizeLocalLights(material);}
  // Skin is recessed between thick external ribs, with an exposed weak organ.
  shell(live,0,.56,0,.52,.48,1.12,skin);
  shell(live,-.025,.96,.02,.24,.28,.46,core);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9,c=Math.cos(a),s=Math.sin(a),reach=.82+(i%3)*.055;
    const p0=point(c*reach,.035,s*reach),p1=point(c*.53,.19,s*.53),p2=point(c*.43,.63,s*.43),p3=point(c*.20,1.05,s*.20);
    rod(live,p0,p1,.10,.085,rib);rod(live,p1,p2,.085,.06,rib);rod(live,p2,p3,.06,.025,rib);
    // The husk leaves torn ribs splayed around a dark, visibly empty center.
    rod(husk,p0,p1,.10,.085,rib);
    rod(husk,p1,point(c*.65,.42+(i%2)*.12,s*.65),.085,.025,rib);
    shell(husk,c*.35,.12,s*.35,.19,.09,.45,skin).rotation.y=-a;
  }
  for(let i=0;i<5;i++){
    const z=(i-2)*.18;
    shell(live,.015,.45+Math.cos(i)*.025,z,.49,.08,.21,rib);
  }
  shell(husk,0,.035,0,.42,.03,.78,rib);
  batch(live);batch(husk);husk.visible=false;root.add(live,husk);
  root.userData.nestLive=live;root.userData.nestHusk=husk;root.userData.nestCore=core;
  return root;
}

/** Snapshot-driven breathing and a retained torn husk; no resources change during combat. */
export function updateNest(root:T.Group,time:number,destroyed=false):void {
  const live=root.userData.nestLive as T.Group|undefined,husk=root.userData.nestHusk as T.Group|undefined;
  if(!live||!husk)return;
  live.visible=!destroyed;husk.visible=destroyed;
  root.userData.destroyed=destroyed;
  live.scale.y=1+Math.sin(time*3.1+root.position.x)*.035;
  const core=root.userData.nestCore as T.MeshStandardMaterial;
  core.emissiveIntensity=1.6+Math.sin(time*3.1+root.position.x)*.25;
}
