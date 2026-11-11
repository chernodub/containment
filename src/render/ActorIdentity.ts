import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {geometry} from './meshParts';

export const FAMILY_IDENTITY = Object.freeze({
  crawler: 0xff7652,
  brute: 0x86a9bb,
  spitter: 0xa5ef65,
  stalker: 0xb8b6db,
  carrier: 0xd3c67e,
  queen: 0x7db99b,
});
export const RIG_ACCENTS = Object.freeze({breacher:0xffb454,cryo:0x7fd6ff,pyro:0xff7a2e,arc:0xb79cff});

type Part = {
  position:[number,number,number];
  scale:[number,number,number];
  role:number;
  shape:'eye'|'seam'|'spine'|'sac';
};
type SurfacePoint = {position:T.Vector3;normal:T.Vector3};

/** Sample the prepared rest skin only when creating a family geometry, never during combat. */
function restSurface(root:T.Group):SurfacePoint[] {
  root.updateMatrixWorld(true);
  const inverse=root.matrixWorld.clone().invert(),surface:SurfacePoint[]=[];
  root.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    const position=object.geometry.getAttribute('position'),normal=object.geometry.getAttribute('normal');
    if(!position||!normal)return;
    const transform=inverse.clone().multiply(object.matrixWorld),normalMatrix=new T.Matrix3().getNormalMatrix(transform);
    if(object instanceof T.SkinnedMesh)object.skeleton.update();
    for(let i=0;i<position.count;i++){
      const point=new T.Vector3();object.getVertexPosition(i,point);point.applyMatrix4(transform);
      const direction=new T.Vector3().fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize();
      surface.push({position:point,normal:direction});
    }
  });
  return surface;
}

function identityGeometry(key:string,parts:readonly Part[],root:T.Group) {
  return geometry(key,()=>{
    const surface=restSurface(root),target=new T.Vector3(),up=new T.Vector3(0,1,0),rotation=new T.Quaternion();
    const pieces=parts.map(part=>{
      target.set(...part.position);
      let nearest:SurfacePoint|undefined,best=Infinity;
      for(const point of surface){
        const distance=point.position.distanceToSquared(target);
        if(distance<best){best=distance;nearest=point;}
      }
      const g=(part.shape==='seam'?new T.BoxGeometry(2,2,2):part.shape==='spine'?new T.ConeGeometry(1,2,4):new T.SphereGeometry(1,8,5)).toNonIndexed();
      g.scale(...part.scale);
      // Tiny positive relief embeds seams in the actual rest carapace instead of floating above it.
      if(nearest){
        rotation.setFromUnitVectors(up,nearest.normal);
        g.applyQuaternion(rotation);
        target.copy(nearest.position).addScaledVector(nearest.normal,part.shape==='spine'?part.scale[1]*.65:part.scale[1]*.18);
      }
      g.translate(target.x,target.y,target.z);
      const role=new Float32Array(g.getAttribute('position').count);role.fill(part.role);
      g.setAttribute('identityRole',new T.BufferAttribute(role,1));return g;
    });
    const result=mergeGeometries(pieces,false)!;pieces.forEach(g=>g.dispose());return result;
  });
}

/** Small anatomical emitters follow the existing chest rig; one additional draw per actor. */
export function alienIdentity(root:T.Group,kind:string,span:number,height:number,elite:boolean) {
  const parts:Part[]=[],s=span,h=height;
  const detail=(shape:Part['shape'],x:number,y:number,z:number,sx:number,sy:number,sz:number,role=0)=>parts.push({position:[x,y,z],scale:[sx,sy,sz],role,shape});
  // Eyes use a compact cluster; broad white nodules hide the original anatomy at hero scale.
  const front=kind==='carrier'?.22:kind==='spitter'?.24:.30;
  for(const side of [-1,1])detail('eye',side*s*.075,h*.69,s*front,s*.009,h*.007,s*.012);
  if(kind==='crawler') {
    for(const side of [-1,1])detail('eye',side*s*.115,h*.57,s*.33,s*.006,h*.006,s*.009);
    for(let i=0;i<3;i++)detail('seam',0,h*(.69+i*.035),s*(.02-i*.09),s*.006,h*.003,s*.035);
  } else if(kind==='spitter') {
    for(const side of [-1,1])for(let i=0;i<2;i++)detail('sac',side*s*(.12+i*.025),h*(.59+i*.09),-s*.035,s*.027,h*.012,s*.034);
    detail('seam',0,h*.57,s*.32,s*.023,h*.003,s*.009);
  } else if(kind==='brute'||kind==='queen') {
    for(let i=0;i<5;i++)for(const side of [-1,1])detail('seam',side*s*(.08+i*.023),h*(.86-i*.035),s*(.15-i*.085),s*.004,h*.0025,s*.034);
    if(kind==='queen')for(let i=0;i<5;i++)detail('spine',(i-2)*s*.06,h*(.83+(.12-Math.abs(i-2)*.035)),s*.08,s*.009,h*.042,s*.014,2);
  } else if(kind==='stalker') {
    for(const side of [-1,1])for(let i=0;i<4;i++)detail('seam',side*s*(.14-i*.018),h*(.7+i*.035),s*(.12-i*.065),s*.003,h*.002,s*.025);
  } else {
    for(const side of [-1,1])for(let i=0;i<3;i++)detail('sac',side*s*.115,h*(.67-i*.025),-s*(.02+i*.075),s*.019,h*.014,s*.024);
  }
  // Angular chitin crests follow the carapace normal and retain a separate silhouette for elites.
  for(const side of [-1,1])for(let i=0;i<3;i++)detail('spine',side*s*(.12+i*.028),h*(.91-i*.045),-s*.06,s*.008,h*.035,s*.013,1);
  const mesh=new T.Mesh(identityGeometry(`g2-identity-seams:${kind}:${elite}`,parts,root),new T.ShaderMaterial({
    uniforms:{identityColor:{value:new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler)},identityPulse:{value:1},identityElite:{value:elite||kind==='queen'?1:0},identityChampion:{value:0},identityExposed:{value:0},identityAlpha:{value:1},identityDeath:{value:0}},
    vertexShader:'attribute float identityRole;varying vec3 identityNormal;varying vec3 identityView;varying float role;void main(){role=identityRole;identityNormal=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.0);identityView=-p.xyz;gl_Position=projectionMatrix*p;}',
    fragmentShader:'uniform vec3 identityColor;uniform float identityPulse;uniform float identityElite;uniform float identityChampion;uniform float identityExposed;uniform float identityAlpha;uniform float identityDeath;varying vec3 identityNormal;varying vec3 identityView;varying float role;void main(){if(role>.5&&role<1.5&&identityElite<.5)discard;if(identityDeath>=1.0)discard;float facing=abs(dot(normalize(identityNormal),normalize(identityView)));vec3 color=role>.5&&role<1.5?mix(vec3(1.0,.54,.18),identityChampion>1.5?vec3(.8,1.0,.4):vec3(.8,.94,1.0),step(.5,identityChampion)):identityColor;float light=.10+pow(facing,1.8)*.52;light*=identityPulse*(.65+identityAlpha*.35)*(1.0-identityDeath);if(role>1.5)light*=.6+identityExposed*2.0;gl_FragColor=vec4(color*light,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',
  }));
  mesh.name=`${kind}-identity`;mesh.material.userData.actorMaterial=true;mesh.castShadow=false;mesh.receiveShadow=false;
  root.add(mesh);
  // Preserve root-space authored proportions while attaching to the animated torso.
  const chest=root.getObjectByName(kind==='carrier'?'body':'chest')??root.getObjectByName('torso');
  if(chest){root.updateMatrixWorld(true);chest.attach(mesh);}
  return {
    mesh,
    update(time:number,windup:number,champion:string|undefined,exposed:boolean,alpha:number,dead:boolean){
      // Death already discards every fragment; skip the empty draw entirely.
      mesh.visible=!dead;
      const u=mesh.material.uniforms;
      u.identityPulse.value=dead?.18:1+Math.sin(time*2.7)*.06+Math.max(0,Math.min(1,windup))*1.2;
      u.identityChampion.value=champion==='warden'?1:champion==='matron'?2:0;
      u.identityElite.value=elite||kind==='queen'||champion?1:0;
      u.identityExposed.value=exposed?1:0;u.identityAlpha.value=alpha;u.identityDeath.value=dead?1:0;
    },
    reset(){mesh.visible=true;const u=mesh.material.uniforms;u.identityPulse.value=1;u.identityElite.value=elite||kind==='queen'?1:0;u.identityChampion.value=0;u.identityExposed.value=0;u.identityAlpha.value=1;u.identityDeath.value=0;},
  };
}

/** Rig lamps mount on the torso and shoulders, leaving the original marine/weapon silhouette intact. */
export function marineIdentity(root:T.Group) {
  const parts:Part[]=[
    {position:[-.29,1.52,.005],scale:[.075,.006,.025],role:0,shape:'seam'},
    {position:[.29,1.52,.005],scale:[.075,.006,.025],role:0,shape:'seam'},
    {position:[-.115,1.21,.17],scale:[.009,.005,.065],role:0,shape:'seam'},
    {position:[.115,1.21,.17],scale:[.009,.005,.065],role:0,shape:'seam'},
    {position:[0,1.78,.12],scale:[.08,.004,.015],role:0,shape:'seam'},
  ];
  const material=new T.ShaderMaterial({uniforms:{rigColor:{value:new T.Color(RIG_ACCENTS.breacher)}},vertexShader:'varying vec3 n;void main(){n=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 rigColor;varying vec3 n;void main(){gl_FragColor=vec4(rigColor*(.45+.4*abs(normalize(n).z)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});
  material.userData.actorMaterial=true;
  const mesh=new T.Mesh(identityGeometry('g2-marine-rig-strips',parts,root),material);mesh.name='marine-rig-accents';root.add(mesh);
  const ribs=root.getObjectByName('ribs');if(ribs){root.updateMatrixWorld(true);ribs.attach(mesh);}
  let current='';
  return {setRig(rig:string){if(rig===current)return;current=rig;material.uniforms.rigColor.value.setHex(RIG_ACCENTS[rig as keyof typeof RIG_ACCENTS]??RIG_ACCENTS.breacher);}};
}
