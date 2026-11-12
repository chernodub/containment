import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {geometry} from './meshParts';

export const FAMILY_IDENTITY = Object.freeze({
  crawler: 0xb46549,
  brute: 0xe1d6b5,
  spitter: 0xa5ef65,
  stalker: 0x887bb0,
  carrier: 0xb982c5,
  queen: 0x756b7d,
});
export const RIG_ACCENTS = Object.freeze({breacher:0xffb454,cryo:0x7fd6ff,pyro:0xff7a2e,arc:0xb79cff});

type Part = {
  position:[number,number,number];
  scale:[number,number,number];
  role:number;
  shape:'eye'|'seam'|'spine'|'sac'|'plate'|'core';
  fitted?:boolean;
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

/** Closed, tapered chitin lens: a thick arched top, rolled edge and recessed underside. */
function carapacePlate():T.BufferGeometry {
  const geometry=new T.SphereGeometry(1,10,6),position=geometry.getAttribute('position');
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    const taper=1-.24*(z+1)*.5;
    position.setXYZ(i,x*taper,(y>=0?y*.88:y*.22)+.09*(1-Math.abs(x))*(1-Math.abs(z)),z);
  }
  geometry.computeVertexNormals();return geometry;
}

/** Queen armor has a keel and hard, overlapping lamellae rather than smooth sacs. */
function queenCarapacePlate():T.BufferGeometry {
  const plate=new T.SphereGeometry(1,10,6),position=plate.getAttribute('position');
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    const taper=1-.30*(z+1)*.5,keel=Math.pow(Math.max(0,1-Math.abs(x)),2);
    position.setXYZ(i,x*taper,y>=0?y*.44+keel*.31-.08*Math.abs(z):y*.12,z);
  }
  plate.computeVertexNormals();return plate;
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
      const g=(part.shape==='core'?new T.SphereGeometry(1,16,10):part.shape==='plate'?(part.role===5?queenCarapacePlate():carapacePlate()):part.shape==='seam'?new T.BoxGeometry(2,2,2):part.shape==='spine'?new T.ConeGeometry(1,2,4):new T.SphereGeometry(1,8,5)).toNonIndexed();
      g.scale(...part.scale);
      // Tiny positive relief embeds seams in the actual rest carapace instead of floating above it.
      if(nearest&&part.fitted!==false){
        rotation.setFromUnitVectors(up,nearest.normal);
        g.applyQuaternion(rotation);
        target.copy(nearest.position).addScaledVector(nearest.normal,part.shape==='spine'?part.scale[1]*.65:part.scale[1]*.18);
      }
      g.translate(target.x,target.y,target.z);
      const role=new Float32Array(g.getAttribute('position').count);role.fill(part.role);
      g.setAttribute('identityRole',new T.BufferAttribute(role,1));
      const side=new Float32Array(g.getAttribute('position').count);side.fill(Math.sign(part.position[0]));
      g.setAttribute('identitySide',new T.BufferAttribute(side,1));
      const anchor=new Float32Array(g.getAttribute('position').count*3);
      for(let i=0;i<g.getAttribute('position').count;i++){anchor[i*3]=target.x;anchor[i*3+1]=target.y;anchor[i*3+2]=target.z;}
      g.setAttribute('identityAnchor',new T.BufferAttribute(anchor,3));return g;
    });
    const result=mergeGeometries(pieces,false)!;pieces.forEach(g=>g.dispose());return result;
  });
}

/** Small anatomical emitters follow the existing chest rig; one additional draw per actor. */
export function alienIdentity(root:T.Group,kind:string,span:number,height:number,elite:boolean) {
  const parts:Part[]=[],s=span,h=height;
  const detail=(shape:Part['shape'],x:number,y:number,z:number,sx:number,sy:number,sz:number,role=0,fitted=true)=>parts.push({position:[x,y,z],scale:[sx,sy,sz],role,shape,fitted});
  // Eyes use a compact cluster; broad white nodules hide the original anatomy at hero scale.
  const front=kind==='carrier'?.22:kind==='spitter'?.24:.30;
  for(const side of [-1,1])detail('eye',side*s*.075,h*.69,s*front,s*.009,h*.007,s*.012);
  if(kind==='crawler') {
    // The smallest family stays plain: a warm russet body and four tiny eyes.
    for(const side of [-1,1])detail('eye',side*s*.115,h*.57,s*.33,s*.01,h*.01,s*.016);
  } else if(kind==='spitter') {
    for(const side of [-1,1])detail('sac',side*s*.12,h*.77,s*.16,s*.075,h*.10,s*.12);
    detail('sac',0,h*.67,s*.30,s*.10,h*.075,s*.08);
  } else if(kind==='brute') {
    // Broad pale shoulder armor survives overhead framing and frost treatments.
    for(const side of [-1,1])for(let i=0;i<2;i++)detail('plate',side*s*(.14+i*.025),h*(.83-i*.04),s*(.09-i*.15),s*.047,h*.08,s*.075,4);
  } else if(kind==='queen') {
    // The vulnerable organ sits underneath a split, articulated crown. All
    // states live in this one geometry; opening changes uniforms only.
    detail('core',0,h*.80,0,s*.10,h*.09,s*.18,3,false);
    for(const side of [-1,1])for(let i=0;i<4;i++)detail('plate',side*s*.15,h*(.815-i*.022),s*(.20-i*.15),s*.145,h*.12,s*.12,5,false);
    // A swept, five-point diadem and low egg abdomen change the outline even
    // while the original Tyrant skin remains in complete shadow.
    for(let i=0;i<5;i++)detail('spine',(i-2)*s*.058,h*(1.02+(.17-Math.abs(i-2)*.055)),s*.18,s*.023,h*(.13-Math.abs(i-2)*.02),s*.045,2,false);
    detail('sac',0,h*.51,-s*.29,s*.24,h*.25,s*.23,7,false);
    for(const side of [-1,1])for(let i=0;i<3;i++)detail('plate',side*s*.18,h*.60,-s*(.17+i*.10),s*.07,h*.09,s*.085,2,false);
    // Low vascular tendons keep the hinged carapace rooted into the torso.
    for(const side of [-1,1])for(let i=0;i<3;i++)detail('plate',side*s*.135,h*.70,s*(.12-i*.12),s*.035,h*.12,s*.055,2,false);
  } else if(kind==='stalker') {
    for(const side of [-1,1])for(let i=0;i<4;i++)detail('seam',side*s*(.14-i*.018),h*(.7+i*.035),s*(.12-i*.065),s*.008,h*.004,s*.055);
  } else {
    // A swollen segmented brood abdomen distinguishes the carrier by shape.
    for(let i=0;i<4;i++)detail('sac',0,h*(.76-i*.018),-s*(.02+i*.09),s*(.12-i*.012),h*.085,s*.065);
    for(const side of [-1,1])for(let i=0;i<4;i++)detail('seam',side*s*.105,h*.78,-s*(.02+i*.09),s*.014,h*.012,s*.062,4);
  }
  for(const side of [-1,1])for(let i=0;i<3;i++)detail('spine',side*s*(.12+i*.028),h*(.96-i*.035),-s*.06,s*.018,h*.065,s*.024,1);
  // Champion overhead crest is built and prewarmed even on ordinary actors.
  for(const side of [-1,1])detail('spine',side*s*.055,h*1.16,0,s*.018,h*.045,s*.018,6,false);
  detail('spine',0,h*1.23,0,s*.025,h*.065,s*.025,6,false);
  const mesh=new T.Mesh(identityGeometry(`g4-identity-mantle-brood:${kind}:${elite}`,parts,root),new T.ShaderMaterial({
    uniforms:{identityColor:{value:new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler)},identityStageLight:{value:1},identityPulse:{value:1},identityTime:{value:0},identityShimmer:{value:kind==='stalker'?1:0},identityElite:{value:elite||kind==='queen'?1:0},identityChampion:{value:0},identityExposed:{value:0},identityOpening:{value:0},identitySpan:{value:span},identityHeight:{value:height},identityAlpha:{value:1},identityDeath:{value:0}},
    vertexShader:`
      attribute float identityRole;attribute float identitySide;attribute vec3 identityAnchor;
      uniform float identityOpening;uniform float identitySpan;uniform float identityHeight;
      varying vec3 identityNormal;varying vec3 identityView;varying vec3 identityLocal;varying float role;
      void main(){
        role=identityRole;vec3 p=position;vec3 plateNormal=normal;identityLocal=position-identityAnchor;
        if(role>4.5&&role<5.5){
          vec3 hinge=identityAnchor+vec3(identitySide*identitySpan*.075,0.0,0.0);
          vec3 delta=p-hinge;
          float angle=-identitySide*identityOpening*1.22;
          p.x=hinge.x+cos(angle)*delta.x-sin(angle)*delta.y+identitySide*identityOpening*identitySpan*.035;
          p.y=hinge.y+sin(angle)*delta.x+cos(angle)*delta.y+identityOpening*identityHeight*.035;
          plateNormal.xy=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*plateNormal.xy;
        }
        identityNormal=normalMatrix*plateNormal;vec4 view=modelViewMatrix*vec4(p,1.0);
        identityView=-view.xyz;gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`
      uniform float identityStageLight;uniform vec3 identityColor;uniform float identityPulse;uniform float identityTime;uniform float identityShimmer;uniform float identityElite;
      uniform float identityChampion;uniform float identityExposed;uniform float identityOpening;
      uniform float identityAlpha;uniform float identityDeath;uniform float identitySpan;
      varying vec3 identityNormal;varying vec3 identityView;varying vec3 identityLocal;varying float role;
      void main(){
        if(role>.5&&role<1.5&&identityElite<.5)discard;
        if(role>5.5&&role<6.5&&identityChampion<.5)discard;
        if(identityDeath>=1.0)discard;
        float facing=abs(dot(normalize(identityNormal),normalize(identityView)));
        vec3 color=identityColor;
        float light=.32+pow(facing,1.5)*.85;
        if(role>.5&&role<1.5){color=vec3(1.0,.36,.12);light=1.15;}
        if(role>1.5&&role<2.5){color=vec3(.24,.10,.16);light=.45+facing*.45;}
        if(role>2.5&&role<3.5){
          if(identityOpening<.08)discard;
          color=mix(vec3(1.0,.035,.32),vec3(1.0,.8,.95),pow(facing,3.0));
          light=(3.4+identityPulse*.9)*identityOpening;
        }
        if(role>3.5&&role<4.5){color=vec3(.62,.61,.52);light=.22+max(0.0,dot(normalize(identityNormal),normalize(vec3(.25,.65,.72))))*.58;}
        if(role>4.5&&role<5.5){
          vec3 n=normalize(identityNormal);
          float ridge=pow(max(0.0,dot(n,normalize(vec3(-.25,.55,.8)))),9.0);
          float lamella=.82+.18*smoothstep(.25,.75,sin(identityLocal.z*32.0+identityLocal.x*8.0)*.5+.5);
          color=vec3(.026,.023,.032)*lamella;light=.65+facing*.55+ridge*1.2;
          float edge=smoothstep(.82,1.02,length(vec2(identityLocal.x/(identitySpan*.095),identityLocal.z/(identitySpan*.084))));
          color+=vec3(.10,.13,.18)*ridge*.36;
          color+=vec3(.65,.025,.20)*edge*identityOpening*.36;
        }
        if(role>5.5&&role<6.5){color=identityChampion>1.5?vec3(1.0,.26,.64):vec3(1.0,.70,.23);light=.9+facing*.7;}
        if(role>6.5){color=mix(vec3(.12,.065,.10),vec3(.30,.16,.23),facing);light=.55+facing*.65+identityOpening*.20;}
        if(role<.5)light*=identityPulse*(1.0+identityShimmer*.3*sin(identityTime*5.0+identityView.y*8.0));
        light*=.75+identityAlpha*.25;
        gl_FragColor=vec4(color*light*identityStageLight,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  mesh.name=`${kind}-identity`;mesh.material.userData.actorMaterial=true;mesh.castShadow=false;mesh.receiveShadow=false;
  // Box3's precise path includes invisible meshes. A dead attachment must not
  // become a hidden support point when the skin is fitted to its ragdoll.
  // Keep the mesh/material root-owned for exact disposal; borrow an empty
  // session geometry until the same pooled rig is restored.
  const liveGeometry=mesh.geometry;
  const retiredGeometry=geometry('g4-retired-identity-empty',()=>new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([],3)));
  root.add(mesh);
  // Preserve root-space authored proportions while attaching to the animated torso.
  const chest=root.getObjectByName(kind==='carrier'?'body':'chest')??root.getObjectByName('torso');
  if(chest){root.updateMatrixWorld(true);chest.attach(mesh);}
  let previous:number|undefined,opening=0;
  return {
    mesh,
    update(time:number,windup:number,champion:string|undefined,exposed:boolean,alpha:number,dead:boolean){
      // Death already discards every fragment; skip the empty draw entirely.
      mesh.visible=!dead;mesh.geometry=dead?retiredGeometry:liveGeometry;
      const u=mesh.material.uniforms;
      u.identityTime.value=time;u.identityPulse.value=dead?.18:1+Math.sin(time*2.7)*.06+Math.max(0,Math.min(1,windup))*1.2;
      u.identityChampion.value=champion==='warden'?1:champion==='matron'?2:0;
      u.identityElite.value=elite||kind==='queen'||champion?1:0;
      const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;
      opening=T.MathUtils.damp(opening,exposed?1:0,12,dt);
      u.identityOpening.value=opening;u.identityExposed.value=exposed?1:0;u.identityAlpha.value=alpha;u.identityDeath.value=dead?1:0;
    },
    reset(){previous=undefined;opening=0;mesh.visible=true;mesh.geometry=liveGeometry;const u=mesh.material.uniforms;u.identityOpening.value=0;u.identityStageLight.value=1;u.identityPulse.value=1;u.identityElite.value=elite||kind==='queen'?1:0;u.identityChampion.value=0;u.identityExposed.value=0;u.identityAlpha.value=1;u.identityDeath.value=0;},
  };
}

/** Rig lamps mount on the torso and shoulders, leaving the original marine/weapon silhouette intact. */
export function marineIdentity(root:T.Group) {
  const parts:Part[]=[
    {position:[-.29,1.52,.005],scale:[.12,.014,.045],role:0,shape:'seam'},
    {position:[.29,1.52,.005],scale:[.12,.014,.045],role:0,shape:'seam'},
    {position:[-.115,1.21,.17],scale:[.065,.018,.105],role:1,shape:'plate'},
    {position:[.115,1.21,.17],scale:[.065,.018,.105],role:1,shape:'plate'},
    {position:[-.27,1.48,-.045],scale:[.09,.023,.095],role:1,shape:'plate'},
    {position:[.27,1.48,-.045],scale:[.09,.023,.095],role:1,shape:'plate'},
    {position:[-.12,1.32,-.18],scale:[.065,.018,.10],role:1,shape:'plate'},
    {position:[.12,1.32,-.18],scale:[.065,.018,.10],role:1,shape:'plate'},
    {position:[0,1.78,.12],scale:[.12,.012,.035],role:0,shape:'seam'},
  ];
  const material=new T.ShaderMaterial({uniforms:{rigColor:{value:new T.Color(RIG_ACCENTS.breacher)}},vertexShader:'attribute float identityRole;varying vec3 n;varying float role;void main(){role=identityRole;n=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 rigColor;varying vec3 n;varying float role;void main(){vec3 color=role<.5?vec3(.65,.93,1.0):rigColor;float facing=abs(normalize(n).z);float light=role<.5?1.25:.38+.34*smoothstep(.35,.55,facing);gl_FragColor=vec4(color*light,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});
  material.userData.actorMaterial=true;
  const mesh=new T.Mesh(identityGeometry('i8-marine-graphic-panels',parts,root),material);mesh.name='marine-rig-accents';root.add(mesh);
  const ribs=root.getObjectByName('ribs');if(ribs){root.updateMatrixWorld(true);ribs.attach(mesh);}
  let current='';
  return {setRig(rig:string){if(rig===current)return;current=rig;material.uniforms.rigColor.value.setHex(RIG_ACCENTS[rig as keyof typeof RIG_ACCENTS]??RIG_ACCENTS.breacher);}};
}
