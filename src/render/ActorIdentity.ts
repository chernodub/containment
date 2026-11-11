import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {geometry} from './meshParts';

export const FAMILY_IDENTITY = Object.freeze({
  crawler: 0xff7652,
  brute: 0xc4d8e3,
  spitter: 0xa5ef65,
  stalker: 0xb8b6db,
  carrier: 0xd3c67e,
  queen: 0xb8ead1,
});
export const RIG_ACCENTS = Object.freeze({breacher:0xffb454,cryo:0x7fd6ff,pyro:0xff7a2e,arc:0xb79cff});

type Part = {position:[number,number,number];scale:[number,number,number];role:number};

function identityGeometry(key:string,parts:readonly Part[]) {
  return geometry(key,()=>{
    const pieces=parts.map(part=>{
      const g=new T.SphereGeometry(1,10,6).toNonIndexed();
      g.scale(...part.scale);g.translate(...part.position);
      const role=new Float32Array(g.getAttribute('position').count);role.fill(part.role);
      g.setAttribute('identityRole',new T.BufferAttribute(role,1));return g;
    });
    const result=mergeGeometries(pieces,false)!;pieces.forEach(g=>g.dispose());return result;
  });
}

/** Small anatomical emitters follow the existing chest rig; one additional draw per actor. */
export function alienIdentity(root:T.Group,kind:string,span:number,height:number,elite:boolean) {
  const parts:Part[]=[],s=span,h=height;
  const oval=(x:number,y:number,z:number,sx:number,sy:number,sz:number,role=0)=>parts.push({position:[x,y,z],scale:[sx,sy,sz],role});
  // Paired eyes stay small and sharp; family reads come from their arrangement and dorsal organs.
  const front=kind==='carrier'?.22:kind==='spitter'?.24:.30;
  for(const side of [-1,1])oval(side*s*.075,h*.69,s*front,s*.027,h*.025,s*.035);
  if(kind==='crawler') {
    for(const side of [-1,1])oval(side*s*.115,h*.57,s*.33,s*.019,h*.018,s*.026);
    for(let i=0;i<3;i++)oval(0,h*(.69+i*.035),s*(.02-i*.09),s*.032,h*.019,s*.05);
  } else if(kind==='spitter') {
    for(const side of [-1,1])for(let i=0;i<2;i++)oval(side*s*(.12+i*.025),h*(.59+i*.09),-s*.035,s*.075,h*.085,s*.09);
    oval(0,h*.57,s*.32,s*.06,h*.027,s*.04);
  } else if(kind==='brute'||kind==='queen') {
    for(let i=0;i<5;i++)for(const side of [-1,1])oval(side*s*(.08+i*.023),h*(.86-i*.035),s*(.15-i*.085),s*.018,h*.035,s*.048);
    if(kind==='queen')for(let i=0;i<5;i++)oval((i-2)*s*.06,h*(.83+(.12-Math.abs(i-2)*.035)),s*.08,s*.022,h*.07,s*.025,2);
  } else if(kind==='stalker') {
    for(const side of [-1,1])for(let i=0;i<4;i++)oval(side*s*(.14-i*.018),h*(.7+i*.035),s*(.12-i*.065),s*.012,h*.018,s*.038);
  } else {
    for(const side of [-1,1])for(let i=0;i<3;i++)oval(side*s*.115,h*(.67-i*.025),-s*(.02+i*.075),s*.057,h*.065,s*.066);
  }
  // Crown segments are present from preparation, including ordinary rigs that may become champions.
  for(const side of [-1,1])for(let i=0;i<3;i++)oval(side*s*(.12+i*.028),h*(.91-i*.045),-s*.06,s*.014,h*.05,s*.022,1);
  const mesh=new T.Mesh(identityGeometry(`g2-identity:${kind}:${elite}`,parts),new T.ShaderMaterial({
    uniforms:{identityColor:{value:new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler)},identityPulse:{value:1},identityElite:{value:elite||kind==='queen'?1:0},identityExposed:{value:0},identityAlpha:{value:1},identityDeath:{value:0}},
    vertexShader:'attribute float identityRole;varying vec3 identityNormal;varying vec3 identityView;varying float role;void main(){role=identityRole;identityNormal=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.0);identityView=-p.xyz;gl_Position=projectionMatrix*p;}',
    fragmentShader:'uniform vec3 identityColor;uniform float identityPulse;uniform float identityElite;uniform float identityExposed;uniform float identityAlpha;uniform float identityDeath;varying vec3 identityNormal;varying vec3 identityView;varying float role;void main(){if(role>.5&&role<1.5&&identityElite<.5)discard;if(identityDeath>=1.0)discard;float facing=abs(dot(normalize(identityNormal),normalize(identityView)));vec3 color=role>.5&&role<1.5?vec3(1.0,.54,.18):identityColor;float light=.13+pow(facing,1.8)*.8;light*=identityPulse*(.65+identityAlpha*.35)*(1.0-identityDeath);if(role>1.5)light*=.6+identityExposed*2.0;gl_FragColor=vec4(color*light,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',
  }));
  mesh.name=`${kind}-identity`;mesh.material.userData.actorMaterial=true;mesh.castShadow=false;mesh.receiveShadow=false;
  root.add(mesh);
  // Preserve root-space authored proportions while attaching to the animated torso.
  const chest=root.getObjectByName(kind==='carrier'?'body':'chest')??root.getObjectByName('torso');
  if(chest){root.updateMatrixWorld(true);chest.attach(mesh);}
  return {
    mesh,
    update(time:number,windup:number,champion:string|undefined,exposed:boolean,alpha:number,dead:boolean){
      const u=mesh.material.uniforms;
      u.identityPulse.value=dead?.18:1+Math.sin(time*2.7)*.06+Math.min(1,windup/350)*1.2;
      u.identityElite.value=elite||kind==='queen'||champion?1:0;
      u.identityExposed.value=exposed?1:0;u.identityAlpha.value=alpha;u.identityDeath.value=dead?1:0;
    },
    reset(){const u=mesh.material.uniforms;u.identityPulse.value=1;u.identityElite.value=elite||kind==='queen'?1:0;u.identityExposed.value=0;u.identityAlpha.value=1;u.identityDeath.value=0;},
  };
}

/** Rig lamps mount on the torso and shoulders, leaving the original marine/weapon silhouette intact. */
export function marineIdentity(root:T.Group) {
  const parts:Part[]=[
    {position:[-.29,1.52,.005],scale:[.11,.027,.055],role:0},
    {position:[.29,1.52,.005],scale:[.11,.027,.055],role:0},
    {position:[-.115,1.21,.17],scale:[.025,.13,.022],role:0},
    {position:[.115,1.21,.17],scale:[.025,.13,.022],role:0},
    {position:[0,1.78,.12],scale:[.115,.025,.035],role:0},
  ];
  const material=new T.ShaderMaterial({uniforms:{rigColor:{value:new T.Color(RIG_ACCENTS.breacher)}},vertexShader:'varying vec3 n;void main(){n=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 rigColor;varying vec3 n;void main(){gl_FragColor=vec4(rigColor*(.45+.4*abs(normalize(n).z)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});
  material.userData.actorMaterial=true;
  const mesh=new T.Mesh(identityGeometry('g2-marine-rig-accents',parts),material);mesh.name='marine-rig-accents';root.add(mesh);
  const ribs=root.getObjectByName('ribs');if(ribs){root.updateMatrixWorld(true);ribs.attach(mesh);}
  let current='';
  return {setRig(rig:string){if(rig===current)return;current=rig;material.uniforms.rigColor.value.setHex(RIG_ACCENTS[rig as keyof typeof RIG_ACCENTS]??RIG_ACCENTS.breacher);}};
}
