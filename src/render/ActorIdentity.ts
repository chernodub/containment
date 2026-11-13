import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {geometry} from './meshParts';
import {familyAnatomy,rankAnatomy} from './FamilyAnatomy';

export const FAMILY_IDENTITY = Object.freeze({
  crawler: 0xb46549,
  brute: 0xe1d6b5,
  spitter: 0xa5ef65,
  stalker: 0x887bb0,
  carrier: 0xb982c5,
  queen: 0x756b7d,
});
export const RIG_ACCENTS = Object.freeze({breacher:0xffb454,cryo:0x7fd6ff,pyro:0xff7a2e,arc:0xb79cff});

export type ActorPart = {
  position:[number,number,number];
  scale:[number,number,number];
  role:number;
  shape:'eye'|'seam'|'spine'|'sac'|'plate'|'core'|'shield'|'rim'|'cavity';
  fitted?:boolean;
};
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
      const g=(part.shape==='shield'?shoulderShield():part.shape==='core'?queenOrgan():part.shape==='rim'?queenCavity(false):part.shape==='cavity'?queenCavity(true):part.shape==='plate'?(part.role===5?queenCarapacePlate():carapacePlate()):part.shape==='seam'?new T.BoxGeometry(2,2,2):part.shape==='spine'?new T.ConeGeometry(1,2,4):new T.SphereGeometry(1,8,5)).toNonIndexed();
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
    parts.push(...familyAnatomy(kind,s,h));
  } else if(kind==='spitter') {
    detail('sac',0,h*1.12,s*.02,s*.18,h*.27,s*.16,0,false);
    detail('plate',0,h*.78,s*.04,s*.18,h*.07,s*.16,4,false);
  } else if(kind==='brute') {
    // Broad pale shoulder armor survives overhead framing and frost treatments.
    for(const side of [-1,1])detail('shield',side*s*.18,h*.86,s*.11,s*.20,h*.22,s*.28,4,false);
  } else if(kind==='queen') {
    // One organ and two large shell halves make exposure an anatomical change,
    // rather than a glow added between many small plates. Both poses are resident.
    detail('core',0,h*.84,s*.015,s*.15,h*.075,s*.19,3,false);
    detail('rim',0,h*.91,s*.015,s*.19,h*.04,s*.25,8,false);
    detail('cavity',0,h*.82,s*.015,s*.19,h*.10,s*.25,9,false);
    for(const side of [-1,1])detail('plate',side*s*.16,h*.86,0,s*.195,h*.18,s*.29,5,false);
    // The low diadem frames the closed shell; the organ stays below its lip.
    // The mantle opens around the deep thorax rather than lifting a badge.
    for(const side of [-1,1])detail('spine',side*s*.23,h*.98,-s*.17,s*.030,h*.065,s*.045,2,false);
    detail('sac',0,h*.51,-s*.29,s*.24,h*.25,s*.23,7,false);
    for(const side of [-1,1])for(let i=0;i<3;i++)detail('plate',side*s*.18,h*.60,-s*(.17+i*.10),s*.07,h*.09,s*.085,2,false);
    // Low vascular tendons keep the hinged carapace rooted into the torso.
    for(const side of [-1,1])for(let i=0;i<3;i++)detail('plate',side*s*.135,h*.70,s*(.12-i*.12),s*.035,h*.12,s*.055,2,false);
  } else {
    parts.push(...familyAnatomy(kind,s,h));
  }
  if(kind!=='queen')parts.push(...rankAnatomy(s,h));
  const mesh=new T.Mesh(identityGeometry(`c6-recessed-identity:${kind}:${elite}`,parts,root),new T.ShaderMaterial({
    uniforms:{identityColor:{value:new T.Color(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]??FAMILY_IDENTITY.crawler)},identityStageLight:{value:1},identityPulse:{value:1},identityTime:{value:0},identityShimmer:{value:kind==='stalker'?1:0},identityElite:{value:elite||kind==='queen'?1:0},identityChampion:{value:0},identityExposed:{value:0},identityOpening:{value:0},identitySpan:{value:span},identityHeight:{value:height},identityWindup:{value:0},identityOrganMotion:{value:kind==='spitter'?1:0},identityDissolve:{value:0},identityStatus:{value:0},identityAlpha:{value:1},identityDeath:{value:0}},
    vertexShader:`
      attribute float identityRole;attribute float identitySide;attribute vec3 identityAnchor;
      uniform float identityOpening;uniform float identitySpan;uniform float identityHeight;uniform float identityWindup;uniform float identityOrganMotion;
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
        if(role>2.5&&role<3.5){
          vec3 organScale=vec3(1.0+identityOpening*.08,1.0+identityOpening*.08,1.0+identityOpening*.08);
          p=identityAnchor+(p-identityAnchor)*organScale;
          p.y+=identityOpening*identityHeight*.162;
          // The geometry attachment receives this same deformed normal/position.
          plateNormal=normalize(plateNormal/organScale);
        }
        if(role>7.5&&role<9.5)p.y+=identityOpening*identityHeight*(role<8.5?.19:.18);
        if(role<.5&&identityOrganMotion>.5){p=identityAnchor+(p-identityAnchor)*(1.0+identityWindup*.28);p.y+=identityWindup*identityHeight*.05;}
        identityNormal=normalMatrix*plateNormal;vec4 view=modelViewMatrix*vec4(p,1.0);
        identityView=-view.xyz;gl_Position=projectionMatrix*view;
      }`,
    fragmentShader:`
      uniform float identityStageLight;uniform vec3 identityColor;uniform float identityPulse;uniform float identityTime;uniform float identityShimmer;uniform float identityElite;
      uniform float identityChampion;uniform float identityExposed;uniform float identityOpening;
      uniform float identityAlpha;uniform float identityDeath;uniform float identitySpan;uniform float identityDissolve;uniform float identityStatus;
      varying vec3 identityNormal;varying vec3 identityView;varying vec3 identityLocal;varying float identityInner;varying float role;
      void main(){
        if(role>.5&&role<1.5&&identityElite<.5)discard;
        if(role>5.5&&role<6.5&&identityChampion<.5)discard;
        // A corpse retains its authored anatomy; the exposed weak point is retired.
        if(identityDeath>=1.0&&((role>2.5&&role<3.5)||(role>7.5&&role<9.5)))discard;
        if(role>7.5&&role<9.5&&identityOpening<.08)discard;
        float identityAsh=fract(sin(dot(floor(identityLocal*65.0),vec3(12.9898,78.233,37.719)))*43758.5453);
        if(identityAsh<identityDissolve)discard;
        float facing=abs(dot(normalize(identityNormal),normalize(identityView)));
        vec3 color=identityColor;
        float light=.38+.38*smoothstep(.28,.32,facing)+.34*smoothstep(.65,.69,facing);
        if(role>.5&&role<1.5){color=vec3(1.0,.36,.12);light=1.15;}
        if(role>1.5&&role<2.5){color=vec3(.24,.10,.16);light=.40+.22*smoothstep(.28,.32,facing)+.24*smoothstep(.65,.69,facing);}
        if(role>2.5&&role<3.5){
          if(identityOpening<.08)discard;
          // Two quiet value groups preserve one simple weak-point shape even
          // through colored status light; no veins, stripes or texture detail.
          float organLobe=smoothstep(.35,.82,facing);
          color=mix(vec3(.32,.003,.025),vec3(.95,.12,.25),organLobe);
          light=(1.1+identityPulse*.18)*(.6+identityOpening*.4);
        }
        if(role>3.5&&role<4.5){color=vec3(.62,.61,.52);float plateLight=max(0.0,dot(normalize(identityNormal),normalize(vec3(.25,.65,.72))));light=.30+.25*smoothstep(.28,.32,plateLight)+.25*smoothstep(.65,.69,plateLight);}
        if(role>4.5&&role<5.5){
          color=mix(vec3(.075,.055,.095),vec3(.17,.09,.12),identityOpening*.45);
          light=.38+.40*smoothstep(.28,.32,facing)+.35*smoothstep(.65,.69,facing);
          color+=vec3(.42,.018,.048)*identityInner*identityOpening*(.85+identityPulse*.15);
        }
        if(role>5.5&&role<6.5){color=identityChampion>1.5?vec3(1.0,.26,.64):vec3(1.0,.70,.23);light=.9+.35*smoothstep(.28,.32,facing)+.35*smoothstep(.65,.69,facing);}
        if(role>6.5&&role<7.5){color=vec3(.22,.11,.19);light=.40+.35*smoothstep(.28,.32,facing)+.35*smoothstep(.65,.69,facing)+identityOpening*.20;}
        if(role>7.5&&role<8.5){color=vec3(.24,.045,.075)+vec3(.38,.022,.048)*identityOpening*(.8+identityPulse*.2);light=.65+.45*facing;}
        if(role>8.5&&role<9.5){color=mix(vec3(.018,.004,.012),vec3(.13,.008,.025),facing);light=.65;}
        if(role>9.5){color=vec3(.95,.28,.08);light=.85+.25*facing;}
        if(role<.5)light*=identityPulse*(1.0+identityShimmer*.12*sin(identityTime*4.0));
        // Large authored pieces retain family values through status treatments.
        if(role<2.5||role>3.5){
          if(identityStatus>.5&&identityStatus<1.5){float frostMix=role>9.5?.20:.40;color=mix(color,vec3(dot(color,vec3(.2126,.7152,.0722))),frostMix)*vec3(.83,.99,1.06)+vec3(.006,.014,.022);}
          if(identityStatus>1.5&&identityStatus<2.5)color*=.78;
          if(identityStatus>2.5)color=color*vec3(.72,.90,.58)+vec3(.006,.014,.003);
        }
        if(identityDeath>.5){color*=.54;light*=.68;}
        light*=.75+identityAlpha*.25;
        gl_FragColor=vec4(color*light*identityStageLight,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  mesh.name=`${kind}-identity`;mesh.material.userData.actorMaterial=true;mesh.castShadow=false;mesh.receiveShadow=false;
  // Precise corpse bounds include only pieces that its role gates actually draw.
  // Keep the resident geometry/VBO, with no combat allocation or hidden crown support.
  let corpse=false,rank:string|undefined;
  const vertexPosition=mesh.getVertexPosition;
  mesh.getVertexPosition=function(index:number,target:T.Vector3){
    const role=mesh.geometry.getAttribute('identityRole').getX(index);
    const hidden=corpse&&((role===1&&!elite&&kind!=='queen'&&!rank)||(role===6&&!rank)||role===3||role===8||role===9);
    return hidden?target.set(0,h*.5,0):vertexPosition.call(this,index,target);
  };
  const liveGeometry=mesh.geometry;
  root.add(mesh);
  // Preserve root-space authored proportions while attaching to the animated torso.
  const chest=root.getObjectByName(kind==='carrier'?'body':'chest')??root.getObjectByName('torso');
  if(chest){root.updateMatrixWorld(true);chest.attach(mesh);}
  let previous:number|undefined,opening=0;
  return {
    mesh,
    update(time:number,windup:number,champion:string|undefined,exposed:boolean,alpha:number,dead:boolean){
      corpse=dead;rank=champion;mesh.visible=true;mesh.geometry=liveGeometry;
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
  const material=new T.ShaderMaterial({uniforms:{rigColor:{value:new T.Color(RIG_ACCENTS.breacher)}},vertexShader:'attribute float identityRole;varying vec3 n;varying float role;void main(){role=identityRole;n=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 rigColor;varying vec3 n;varying float role;void main(){vec3 color=role<.5?vec3(.65,.93,1.0):rigColor;float facing=abs(normalize(n).z);float light=role<.5?.40:.38+.34*smoothstep(.35,.55,facing);gl_FragColor=vec4(color*light,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}'});
  material.userData.actorMaterial=true;
  const mesh=new T.Mesh(identityGeometry('g5-marine-graphic-panels',parts,root),material);mesh.name='marine-rig-accents';root.add(mesh);
  const ribs=root.getObjectByName('ribs');if(ribs){root.updateMatrixWorld(true);ribs.attach(mesh);}
  let current='';
  return {setRig(rig:string){if(rig===current)return;current=rig;material.uniforms.rigColor.value.setHex(RIG_ACCENTS[rig as keyof typeof RIG_ACCENTS]??RIG_ACCENTS.breacher);}};
}
