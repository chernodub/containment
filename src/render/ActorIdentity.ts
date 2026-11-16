import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {geometry} from './meshParts';
import {familyAnatomy,rankAnatomy} from './FamilyAnatomy';
import {marineRigAnatomy,originalMarineRig} from './MarineRigAnatomy';
import {queenDesign} from './QueenDesign';
import {originalCreatureIdentity} from './OriginalCreatureAnatomy';

export const FAMILY_IDENTITY = Object.freeze({
  crawler: 0xb46549,
  brute: 0x795346,
  spitter: 0x92ad59,
  stalker: 0x887bb0,
  carrier: 0xb982c5,
  queen: 0x756b7d,
});
export const ENEMY_BODY_COLORS = Object.freeze({crawler:0x43312b,brute:0x30232a,spitter:0x253229,stalker:0x292737,carrier:0x382b3b,queen:0x241c2a});
export const RIG_ACCENTS = Object.freeze({breacher:0xffb454,cryo:0x7fd6ff,pyro:0xff7a2e,arc:0xb79cff});

export type ActorPart = {
  position:[number,number,number];
  scale:[number,number,number];
  role:number;
  shape:'eye'|'seam'|'spine'|'sac'|'plate'|'core'|'shield'|'rim'|'cavity'|'segment'|'coil'|'carapace';
  rotation?:[number,number,number];
  anchor?:[number,number,number];
  joint?:string;
  end?:[number,number,number];
  fitted?:boolean;
};
/** CPU bounds and corpse proxies obey the same resident role gates as the shader. */
export function identityRoleVisible(role:number,elite:number,champion:number,opening:number,dead:boolean):boolean {
  if(role===1&&elite<.5||role===6&&champion<.5)return false;
  const target=role===3||role===17||role===18||role===8||role===9;
  return !target||!dead&&opening>=.08;
}

type Part=ActorPart;
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

/** Queen armor has a broad keel and two simple closed shell halves. */
function queenCarapacePlate():T.BufferGeometry {
  const plate=new T.SphereGeometry(1,10,6),position=plate.getAttribute('position');
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    const taper=1-.30*(z+1)*.5,keel=Math.pow(Math.max(0,1-Math.abs(x)),2);
    position.setXYZ(i,x*taper,y>=0?y*.44+keel*.31-.08*Math.abs(z):y*.12,z);
  }
  plate.computeVertexNormals();return plate;
}

/** An irregular open thorax: a rolled lip above sloped, visibly deep cavity walls. */
function queenCavity(wall: boolean):T.BufferGeometry {
  const vertices:number[]=[],indices:number[]=[],segments=24;
  for(let row=0;row<2;row++)for(let i=0;i<=segments;i++){
    const angle=i/segments*Math.PI*2;
    const anatomy=1+.055*Math.sin(angle*5)+.035*Math.cos(angle*3);
    const radius=(wall?(row===0?.74:.92):(row===0?.92:1.08))*anatomy;
    vertices.push(Math.cos(angle)*radius,wall?(row===0?-1:1):(row===0?.72:1),Math.sin(angle)*radius);
  }
  for(let i=0;i<segments;i++){const j=i+segments+1;indices.push(i,i+1,j,i+1,j+1,j);}
  const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(vertices,3));result.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));result.setIndex(indices);result.computeVertexNormals();return result;
}

/** Three fused vascular lobes avoid the flat circular badge silhouette. */
function queenOrgan():T.BufferGeometry {
  const result=new T.SphereGeometry(1,20,12),p=result.getAttribute('position');
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),angle=Math.atan2(z,x);
    const lobe=1+.14*Math.cos(angle*3)+.045*Math.sin(angle*5);
    p.setXYZ(i,x*lobe,y*(.88+.12*Math.cos(z*3)),z*lobe);
  }
  result.computeVertexNormals();return result;
}

/** Broad five-sided shoulder shield, with one bevel instead of surface greebles. */
function shoulderShield():T.BufferGeometry {
  const outline=new T.Shape();outline.moveTo(0,-1);outline.lineTo(.86,-.52);outline.lineTo(1,.64);outline.lineTo(-1,.64);outline.lineTo(-.86,-.52);outline.closePath();
  const shield=new T.ExtrudeGeometry(outline,{depth:.26,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.10,bevelThickness:.12,curveSegments:1});
  shield.rotateX(-Math.PI/2);shield.translate(0,-.13,0);return shield;
}

function identityGeometry(key:string,parts:readonly Part[],root:T.Group,joints:readonly string[]=[]) {
  return geometry(key,()=>{
    const surface=restSurface(root),target=new T.Vector3(),up=new T.Vector3(0,1,0),rotation=new T.Quaternion();
    const pieces=parts.map(part=>{
      target.set(...part.position);
      let nearest:SurfacePoint|undefined,best=Infinity;
      for(const point of surface){
        const distance=point.position.distanceToSquared(target);
        if(distance<best){best=distance;nearest=point;}
      }
      const g=(part.shape==='shield'?shoulderShield():part.shape==='core'?queenOrgan():part.shape==='rim'?queenCavity(false):part.shape==='cavity'?queenCavity(true):part.shape==='plate'?(part.role===5?queenCarapacePlate():carapacePlate()):part.shape==='carapace'?carapacePlate().scale(1,.60,1):part.shape==='coil'?new T.TorusGeometry(.78,.22,5,12,Math.PI*1.65):part.shape==='segment'?new T.CylinderGeometry(.78,1,2,6,1):part.shape==='seam'?new T.BoxGeometry(2,2,2):part.shape==='spine'?new T.ConeGeometry(1,2,4):new T.SphereGeometry(1,8,5)).toNonIndexed();
      if(part.end){
        const end=new T.Vector3(...part.end),direction=end.clone().sub(target);
        g.scale(part.scale[0],direction.length()*.5,part.scale[2]);
        g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,direction.normalize()));
        target.add(end).multiplyScalar(.5);
      }else g.scale(...part.scale);
      if(part.rotation)g.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...part.rotation)));
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
      for(let i=0;i<g.getAttribute('position').count;i++){anchor[i*3]=part.anchor?.[0]??target.x;anchor[i*3+1]=part.anchor?.[1]??target.y;anchor[i*3+2]=part.anchor?.[2]??target.z;}
      g.setAttribute('identityAnchor',new T.BufferAttribute(anchor,3));
      if(joints.length){
        const indices=new Uint16Array(g.getAttribute('position').count*4),weights=new Float32Array(indices.length);
        const joint=Math.max(0,joints.indexOf(part.joint??joints[0]));
        for(let i=0;i<indices.length;i+=4){indices[i]=joint;weights[i]=1;}
        g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
      }
      return g;
    });
    const result=mergeGeometries(pieces,false)!;pieces.forEach(g=>g.dispose());return result;
  });
}

/** Small anatomical emitters follow the existing chest rig; one additional draw per actor. */
export function alienIdentity(root:T.Group,kind:string,span:number,height:number,elite:boolean) {
  const original=originalCreatureIdentity(root,kind,elite,span,height);if(original)return original;
  const parts:Part[]=[],s=span,h=height;
  const detail=(shape:Part['shape'],x:number,y:number,z:number,sx:number,sy:number,sz:number,role=0,fitted=true)=>parts.push({position:[x,y,z],scale:[sx,sy,sz],role,shape,fitted});
  // Eyes use a compact cluster; broad white nodules hide the original anatomy at hero scale.
  const front=kind==='carrier'?.22:kind==='spitter'?.24:.30;
  for(const side of [-1,1])detail('eye',side*s*.075,h*.69,s*front,s*.009,h*.007,s*.012);
  if(kind!=='queen') {
    parts.push(...familyAnatomy(kind,s,h));
  } else if(kind==='queen') {
    parts.push(...queenDesign(s,h));
  }
  if(kind!=='queen')parts.push(...rankAnatomy(s,h));
  let trunk=root.getObjectByName(kind==='carrier'?'body':'chest')??root.getObjectByName('torso')??root.getObjectByName('spine2')??root.getObjectByName('bum');
  if(!trunk){trunk=new T.Bone();trunk.name='k7-anatomy-root';root.add(trunk);}
  const jointNames=[trunk.name,...new Set(parts.map(p=>p.joint).filter((n):n is string=>!!n))];
  const bones=jointNames.map(name=>(root.getObjectByName(name)??trunk) as T.Bone);
  root.updateMatrixWorld(true);
  const mesh=new T.SkinnedMesh(identityGeometry(`k7-articulated-identity:${kind}:${elite}`,parts,root,jointNames),new T.ShaderMaterial({
    uniforms:{identityStudy:{value:0},identityCharge:{value:kind==='brute'?1:0},identityColor:{value:new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler)},identityStageLight:{value:1},identityPulse:{value:1},identityTime:{value:0},identityShimmer:{value:kind==='stalker'?1:0},identityElite:{value:elite||kind==='queen'?1:0},identityChampion:{value:0},identityExposed:{value:0},identityOpening:{value:0},identitySpan:{value:span},identityHeight:{value:height},identityWindup:{value:0},identityOrganMotion:{value:kind==='spitter'?1:0},identityDissolve:{value:0},identityStatus:{value:0},identityAlpha:{value:1},identityDeath:{value:0}},
    vertexShader:`
      #include <common>
      #include <skinning_pars_vertex>
      attribute float identityRole;attribute float identitySide;attribute vec3 identityAnchor;
      uniform float identityOpening;uniform float identitySpan;uniform float identityHeight;uniform float identityWindup;uniform float identityOrganMotion;uniform float identityCharge;
      varying vec3 identityNormal;varying vec3 identityView;varying vec3 identityLocal;varying float identityInner;varying float role;
      void main(){
        role=identityRole;identityInner=max(0.0,-normal.x*identitySide)*.7+max(0.0,-normal.y)*.3;vec3 p=position;vec3 plateNormal=normal;identityLocal=position-identityAnchor;
        if(role>4.5&&role<5.5){
          vec3 hinge=identityAnchor+vec3(identitySide*identitySpan*.075,0.0,0.0);
          vec3 delta=p-hinge;
          float angle=-identitySide*identityOpening*1.22;
          p.x=hinge.x+cos(angle)*delta.x-sin(angle)*delta.y+identitySide*identityOpening*identitySpan*.035;
          p.y=hinge.y+sin(angle)*delta.x+cos(angle)*delta.y+identityOpening*identityHeight*.035;
          plateNormal.xy=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*plateNormal.xy;
        }
        if((role>2.5&&role<3.5)||(role>16.5&&role<18.5)){
          vec3 organScale=vec3(1.0+identityOpening*.08,1.0+identityOpening*.08,1.0+identityOpening*.08);
          p=identityAnchor+(p-identityAnchor)*organScale;
          p.y+=identityOpening*identityHeight*.162;
          // The geometry attachment receives this same deformed normal/position.
          plateNormal=normalize(plateNormal/organScale);
        }
        if(role>7.5&&role<9.5)p.y+=identityOpening*identityHeight*(role<8.5?.19:.18);
        if((role<.5||abs(role-7.0)<.1)&&identityOrganMotion>.5){p=identityAnchor+(p-identityAnchor)*(1.0+identityWindup*.28);p.y+=identityWindup*identityHeight*.05;}
        if(identityCharge>.5&&role>10.5&&role<12.5)p.y-=identityWindup*identityHeight*.09;
        vec3 objectNormal=plateNormal;
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        vec3 transformed=p;
        #include <skinning_vertex>
        identityNormal=normalMatrix*objectNormal;vec4 view=modelViewMatrix*vec4(transformed,1.0);
        identityView=-view.xyz;gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`
      uniform float identityStudy;uniform float identityStageLight;uniform vec3 identityColor;uniform float identityPulse;uniform float identityTime;uniform float identityShimmer;uniform float identityElite;
      uniform float identityChampion;uniform float identityExposed;uniform float identityOpening;
      uniform float identityAlpha;uniform float identityDeath;uniform float identitySpan;uniform float identityDissolve;uniform float identityStatus;uniform float identityOrganMotion;
      varying vec3 identityNormal;varying vec3 identityView;varying vec3 identityLocal;varying float identityInner;varying float role;
      void main(){
        if(role>.5&&role<1.5&&identityElite<.5)discard;
        if(role>5.5&&role<6.5&&identityChampion<.5)discard;
        // A corpse retains its authored anatomy; the exposed weak point is retired.
        if(identityDeath>=1.0&&((role>2.5&&role<3.5)||(role>7.5&&role<9.5)||(role>16.5&&role<18.5)))discard;
        if(role>7.5&&role<9.5&&identityOpening<.08)discard;
        float identityAsh=fract(sin(dot(floor(identityLocal*65.0),vec3(12.9898,78.233,37.719)))*43758.5453);
        if(identityAsh<identityDissolve)discard;
        float facing=abs(dot(normalize(identityNormal),normalize(identityView)));
        vec3 color=identityColor;
        float light=.38+.38*smoothstep(.28,.32,facing)+.34*smoothstep(.65,.69,facing);
        if(role>.5&&role<1.5){color=vec3(1.0,.36,.12);light=1.15;}
        if(role>1.5&&role<2.5){color=vec3(.085,.042,.038);light=.40+.22*smoothstep(.28,.32,facing)+.24*smoothstep(.65,.69,facing);}
        if((role>2.5&&role<3.5)||(role>16.5&&role<18.5)){
          if(identityOpening<.08)discard;
          // Two quiet value groups preserve one simple weak-point shape even
          // through colored status light; no veins, stripes or texture detail.
          float organLobe=smoothstep(.35,.82,facing);
          color=mix(vec3(.32,.003,.025),vec3(.95,.12,.25),organLobe);
          light=(1.1+identityPulse*.18)*(.6+identityOpening*.4);
        }
        if(role>16.5&&role<17.5){color=vec3(.035,.005,.012);light=.8;}
        if(role>17.5&&role<18.5){color=vec3(.72,.055,.08);light=1.1+identityPulse*.10;}
        if(role>3.5&&role<4.5){color=mix(identityColor,vec3(.38,.26,.16),.22);float plateLight=max(0.0,dot(normalize(identityNormal),normalize(vec3(.25,.65,.72))));light=.30+.25*smoothstep(.28,.32,plateLight)+.25*smoothstep(.65,.69,plateLight);}
        if(role>4.5&&role<5.5){
          color=mix(vec3(.075,.055,.095),vec3(.17,.09,.12),identityOpening*.45);
          light=.38+.40*smoothstep(.28,.32,facing)+.35*smoothstep(.65,.69,facing);
          color+=vec3(.42,.018,.048)*identityInner*identityOpening*(.85+identityPulse*.15);
        }
        if(role>5.5&&role<6.5){color=identityChampion>1.5?vec3(1.0,.26,.64):vec3(1.0,.70,.23);light=.9+.35*smoothstep(.28,.32,facing)+.35*smoothstep(.65,.69,facing);}
        if(role>6.5&&role<7.5){color=identityOrganMotion>.5?vec3(.28,.34,.075):vec3(.22,.11,.19);light=.40+.35*smoothstep(.28,.32,facing)+.35*smoothstep(.65,.69,facing)+identityOpening*.20;}
        if(role>7.5&&role<8.5){color=vec3(.24,.045,.075)+vec3(.38,.022,.048)*identityOpening*(.8+identityPulse*.2);light=.65+.45*facing;}
        if(role>8.5&&role<9.5){color=mix(vec3(.018,.004,.012),vec3(.13,.008,.025),facing);light=.65;}
        if(role>9.5&&role<10.5){color=vec3(.62,.19,.065);light=.65+.25*facing;}
        if(role>10.5&&role<11.5){color=identityColor*.72;light=.40+.32*smoothstep(.28,.32,facing)+.30*smoothstep(.65,.69,facing);}
        if(role>11.5&&role<12.5){color=vec3(.12,.055,.043);light=.55+.35*facing;}
        if(role<.5)light*=identityPulse*(1.0+identityShimmer*.12*sin(identityTime*4.0));
        // Large authored pieces retain family values through status treatments.
        if((role<2.5||role>3.5)&&role<16.5){
          if(identityStatus>.5&&identityStatus<1.5){float frostMix=role>9.5?.20:.40;color=mix(color,vec3(dot(color,vec3(.2126,.7152,.0722))),frostMix)*vec3(.83,.99,1.06)+vec3(.006,.014,.022);}
          if(identityStatus>1.5&&identityStatus<2.5)color*=.78;
          if(identityStatus>2.5)color=color*vec3(.72,.90,.58)+vec3(.006,.014,.003);
        }
        if(identityDeath>.5){color*=.54;light*=.68;}
        light*=.75+identityAlpha*.25;
        if(identityStudy>.5){
          color=vec3(.055);light=.75+.25*facing;
          if((role>3.5&&role<6.5)||(role>10.5&&role<11.5))color=vec3(.34);
          if(role>2.5&&role<3.5)color=vec3(.75);
          if(role>16.5&&role<17.5)color=vec3(.025);
          if(role>17.5&&role<18.5)color=vec3(.85);
          if(role>7.5&&role<8.5)color=vec3(.13);
          if(role>9.5&&role<10.5)color=vec3(.55);
        }
        gl_FragColor=vec4(color*light*identityStageLight,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  mesh.bind(new T.Skeleton(bones,bones.map(b=>b.matrixWorld.clone().invert())),root.matrixWorld);
  mesh.name=`${kind}-identity`;mesh.frustumCulled=false;mesh.material.userData.actorMaterial=true;mesh.castShadow=false;mesh.receiveShadow=false;
  // Precise corpse bounds include only pieces that its role gates actually draw.
  // Keep the resident geometry/VBO, with no combat allocation or hidden crown support.
  let corpse=false,rank:string|undefined;
  const vertexPosition=mesh.getVertexPosition;
  mesh.getVertexPosition=function(index:number,target:T.Vector3){
    const role=mesh.geometry.getAttribute('identityRole').getX(index);
    const u=mesh.material.uniforms;
    const hidden=!identityRoleVisible(role,u.identityElite.value,u.identityChampion.value,u.identityOpening.value,corpse);
    return hidden?target.set(0,h*.5,0):vertexPosition.call(this,index,target);
  };
  const liveGeometry=mesh.geometry;
  root.add(mesh);
  // Preserve root-space authored proportions while attaching to the animated torso.
  // Root-space bind inverses let each substantial contact limb follow its
  // original joint, including the native ragdoll, in the same resident draw.
  let previous:number|undefined,opening=0;
  return {
    mesh,
    update(time:number,windup:number,champion:string|undefined,exposed:boolean,alpha:number,dead:boolean){
      corpse=dead;rank=champion;mesh.visible=true;if(!dead)mesh.geometry=liveGeometry;
      const u=mesh.material.uniforms;
      u.identityWindup.value=windup;u.identityTime.value=time;u.identityPulse.value=dead?.18:1+Math.sin(time*2.7)*.06+Math.max(0,Math.min(1,windup))*1.2;
      u.identityChampion.value=champion==='warden'?1:champion==='matron'?2:0;
      u.identityElite.value=elite||kind==='queen'||champion?1:0;
      const dt=previous===undefined?0:Math.max(0,Math.min(.05,time-previous));previous=time;
      opening=T.MathUtils.damp(opening,exposed?1:0,12,dt);
      u.identityOpening.value=opening;u.identityExposed.value=exposed?1:0;u.identityAlpha.value=alpha;u.identityDeath.value=dead?1:0;
    },
    reset(){previous=undefined;opening=0;corpse=false;rank=undefined;mesh.visible=true;mesh.geometry=liveGeometry;const u=mesh.material.uniforms;u.identityDissolve.value=0;u.identityStatus.value=0;u.identityOpening.value=0;u.identityStageLight.value=1;u.identityPulse.value=1;u.identityElite.value=elite||kind==='queen'?1:0;u.identityChampion.value=0;u.identityExposed.value=0;u.identityAlpha.value=1;u.identityDeath.value=0;},
  };
}

/** Rig lamps mount on the torso and shoulders, leaving the original marine/weapon silhouette intact. */
export function marineIdentity(root:T.Group) {
  const original=originalMarineRig(root);if(original)return original;
  const parts:Part[]=[
    {position:[-.29,1.52,.005],scale:[.09,.012,.045],role:0,shape:'seam'},
    {position:[.29,1.52,.005],scale:[.09,.012,.045],role:0,shape:'seam'},
    {position:[-.115,1.21,.17],scale:[.065,.018,.105],role:1,shape:'plate'},
    {position:[.115,1.21,.17],scale:[.065,.018,.105],role:1,shape:'plate'},
    {position:[-.27,1.48,-.045],scale:[.09,.023,.095],role:1,shape:'plate'},
    {position:[.27,1.48,-.045],scale:[.09,.023,.095],role:1,shape:'plate'},
    {position:[-.12,1.32,-.18],scale:[.065,.018,.10],role:1,shape:'plate'},
    {position:[.12,1.32,-.18],scale:[.065,.018,.10],role:1,shape:'plate'},
    {position:[0,1.40,.19],scale:[.03,.035,.02],role:0,shape:'plate'},
    {position:[0,1.78,.12],scale:[.12,.012,.035],role:0,shape:'seam'},
  ];
  parts.push(...marineRigAnatomy());
  const material=new T.ShaderMaterial({uniforms:{rigKind:{value:13},rigColor:{value:new T.Color(RIG_ACCENTS.breacher)}},vertexShader:'attribute float identityRole;varying vec3 n;varying float role;void main(){role=identityRole;n=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float rigKind;uniform vec3 rigColor;varying vec3 n;varying float role;void main(){if(role>12.5&&abs(role-rigKind)>.25)discard;vec3 color=role<.5?vec3(.65,.93,1.0):role>12.5?mix(vec3(.09,.16,.19),rigColor,.22):rigColor;float facing=abs(normalize(n).z);float light=role<.5?.40:.48+.32*smoothstep(.35,.55,facing);gl_FragColor=vec4(color*light,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});
  material.userData.actorMaterial=true;
  const mesh=new T.Mesh(identityGeometry('k7-marine-physical-rigs',parts,root),material);mesh.name='marine-rig-accents';root.add(mesh);
  const ribs=root.getObjectByName('ribs');if(ribs){root.updateMatrixWorld(true);ribs.attach(mesh);}
  let current='';
  const vertexPosition=mesh.getVertexPosition;
  mesh.getVertexPosition=function(index:number,target:T.Vector3){
    const role=mesh.geometry.getAttribute('identityRole').getX(index);
    return role>12.5&&Math.abs(role-material.uniforms.rigKind.value)>.25?target.set(0,1.4,0):vertexPosition.call(this,index,target);
  };
  return {setRig(rig:string){if(rig===current)return;current=rig;material.uniforms.rigKind.value=13+Math.max(0,['breacher','cryo','pyro','arc'].indexOf(rig));material.uniforms.rigColor.value.setHex(RIG_ACCENTS[rig as keyof typeof RIG_ACCENTS]??RIG_ACCENTS.breacher);}};
}
