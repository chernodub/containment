import * as T from 'three';
import {box,rod,batch,disposeModel} from '../meshParts';
import {sleepingPassenger} from './EquipmentDetail';
import {optimizeLocalLights} from '../lighting/LocalLightShading';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Shared authored stage marks, consumed by the renderer's two presentation actors. */
export const TITLE_STAGE = Object.freeze({
  marine: Object.freeze({x:23.4,z:14.7,angle:-1.10,aimPitch:-.22}),
  creature: Object.freeze({x:26.65,z:9.35,angle:2.02}),
  emergency: Object.freeze({x:25.9,y:4.55,z:11.2}),
});

/** Real, bounded title armor follows the torso; accent colors never paint the skin. */
function titleMarineArmor(root:T.Group,rig:{value:T.Color}|undefined):void {
  if(root.getObjectByName('title-marine-armor'))return;
  const torso=root.getObjectByName('ribs');if(!torso)return;
  root.updateMatrixWorld(true);
  const inverse=root.matrixWorld.clone().invert(),skins:T.SkinnedMesh[]=[];
  root.traverse(object=>{if(object instanceof T.SkinnedMesh){object.skeleton.update();skins.push(object);}});
  if(!skins.length)return;
  const ray=new T.Raycaster(),origin=new T.Vector3(),direction=new T.Vector3();
  const armor=new T.Group();armor.name='title-marine-armor';root.add(armor);
  const graphite=new T.MeshStandardMaterial({color:0x333b42,metalness:.52,roughness:.63,emissive:0x3b4d5c,emissiveIntensity:.5});
  const gasket=new T.MeshStandardMaterial({color:0x080d12,metalness:.08,roughness:.85});
  const accents=new T.ShaderMaterial({
    uniforms:{rigColor:rig??{value:new T.Color(0xffb454)}},
    vertexShader:'attribute float titlePanelRole;varying float role;varying vec3 n;void main(){role=titlePanelRole;n=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 rigColor;varying float role;varying vec3 n;void main(){vec3 color=role<.5?vec3(.34,.55,.64):rigColor*.72;float shade=.62+.38*abs(normalize(n).z);gl_FragColor=vec4(color*shade,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',
  });
  graphite.name='title-graphite-plates';gasket.name='title-armor-insets';accents.name='title-rig-panel-details';
  for(const material of [graphite,gasket,accents])material.userData.actorMaterial=true;
  const pieces:T.BufferGeometry[][]=[[],[],[]],rotation=new T.Quaternion(),normal=new T.Vector3(),target=new T.Vector3();
  const piece=(bucket:number,x:number,y:number,z:number,w:number,h:number,d:number,radius:number,role=0)=>{
    const g=new RoundedBoxGeometry(w,h,d,1,radius);g.translate(x,y,z);g.applyQuaternion(rotation);g.translate(target.x,target.y,target.z);
    if(bucket===2){const roles=new Float32Array(g.getAttribute('position').count);roles.fill(role);g.setAttribute('titlePanelRole',new T.BufferAttribute(roles,1));}
    pieces[bucket].push(g);
  };
  for(const side of [-1,1]){
    const desired=new T.Vector3(side*.12,1.38,-.18);
    // Fit from outside the assembled suit: nearest vertices can select the
    // hidden undersuit and bury the panel beneath the outer armor shell.
    normal.set(side*.12,.08,-1).normalize();
    origin.copy(desired).add(normal).applyMatrix4(root.matrixWorld);
    direction.copy(normal).negate().transformDirection(root.matrixWorld);ray.set(origin,direction);
    const hit=ray.intersectObjects(skins,false)[0];
    if(!hit)continue;
    rotation.setFromUnitVectors(new T.Vector3(0,0,1),normal);target.copy(hit.point).applyMatrix4(inverse).addScaledVector(normal,.012);
    const w=.14,h=.20;
    piece(1,0,0,0,w+.012,h+.012,.024,.010);
    piece(0,0,0,.012,w,h,.022,.010);
    // Recessed center cut and a thin upper lip describe a plate, not painted noise.
    piece(1,0,-h*.12,.026,w*.73,.012,.008,.003);
    piece(2,0,h*.36,.026,w*.66,.009,.009,.003);
    piece(2,side*w*.27,h*.09,.028,w*.15,h*.27,.010,.003,1);
  }
  for(let i=0;i<pieces.length;i++){
    const geometry=mergeGeometries(pieces[i],false)!;pieces[i].forEach(piece=>piece.dispose());
    const mesh=new T.Mesh(geometry,[graphite,gasket,accents][i]);mesh.name=['title-armor-plates','title-armor-cuts','title-armor-rig-bands'][i];mesh.castShadow=i<2;mesh.receiveShadow=i<2;armor.add(mesh);
  }
  root.updateMatrixWorld(true);torso.attach(armor);
}

/** Title exposure preserves gameplay surface forms and the hidden creature's dark values. */
export function styleTitleActor(root:T.Group,friendly:boolean):void {
  root.userData.graphicActorBase=friendly?0x30363b:0x34233b;
  const rig=(root.getObjectByName('marine-rig-accents') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>|undefined)?.material.uniforms.rigColor;
  root.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(material instanceof T.MeshStandardMaterial&&material.customProgramCacheKey().includes(':actor-surface-')){
        const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
        material.onBeforeCompile=(shader,renderer)=>{
          previous.call(material,shader,renderer);
          if(shader.uniforms.actorRimColor)shader.uniforms.actorRimColor.value.setHex(friendly?0xb6edff:0x825a90);
          if(shader.uniforms.actorRimStrength)shader.uniforms.actorRimStrength.value=friendly?.075:.08;
          if(friendly){
            shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`// Exposure preserves the shared three-tone armor and directional lighting.
float titleMarineRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),6.0);
outgoingLight=outgoingLight*1.6+vec3(.04,.095,.125)*titleMarineRim;
#include <opaque_fragment>`);
          }else{
            Object.assign(shader.uniforms,{titleBodyColor:{value:new T.Color(0x34233b)}});
            shader.fragmentShader='uniform vec3 titleBodyColor;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`vec3 titleNormal=normalize(normal);
float titleTone=.54+.28*smoothstep(.22,.28,abs(titleNormal.x))+.32*smoothstep(.60,.66,max(titleNormal.y,0.0));
float titleInnerRim=pow(1.0-clamp(dot(titleNormal,normalize(vViewPosition)),0.0,1.0),5.0);
outgoingLight=titleBodyColor*titleTone*1.2+vec3(.14,.07,.20)*titleInnerRim*.04;
#include <opaque_fragment>`);
          }
        };
        material.customProgramCacheKey=()=>key+':title-graphic-v2';material.needsUpdate=true;
      }else if(!friendly&&material instanceof T.ShaderMaterial&&material.uniforms.identityColor){
        material.uniforms.identityColor.value.setHex(0xff7146);
        material.fragmentShader=material.fragmentShader
          .replace('gl_FragColor=vec4(color*light*identityStageLight,1.0);',
            'vec3 titleOrnament=role<.5?vec3(1.0,.16,.035)*2.2:vec3(.024,.010,.031)*(.72+.55*smoothstep(.3,.6,facing));gl_FragColor=vec4(titleOrnament,1.0);');
        material.needsUpdate=true;
      }
    }
  });
  if(friendly)titleMarineArmor(root,rig);
}

/** Original occupied berth display: faint human form behind frost, with individual life telemetry. */
function occupiedGlass():T.DataTexture {
  const width=128,height=256,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const u=x/width,v=y/height,dx=u-.5;
    const frost=Math.max(0,(Math.abs(dx)-.28)*2.3)+Math.max(0,.10-v)*3;
    const noise=((Math.imul(x+17,374761393)^Math.imul(y+43,668265263))>>>0)%29/29;
    const figure=sleepingPassenger(u,1-v);
    let r=figure?8:18,g=figure?23:41,b=figure?29:52;
    r+=frost*42+noise*3;g+=frost*52+noise*4;b+=frost*56+noise*5;
    if(v>.79&&v<.93&&u>.12&&u<.88){r=4;g=14;b=19;
      const phase=(u*5)%1,wave=.855+(phase>.34&&phase<.43?-.035:phase>.43&&phase<.51?.045:Math.sin(u*17)*.003);
      if(Math.abs(v-wave)<.004){r=159;g=232;b=255;}
    }
    const i=(y*width+x)*4;pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=255;
  }
  const texture=new T.DataTexture(pixels,width,height);texture.colorSpace=T.SRGBColorSpace;
  texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

/** A separate, original cryobay set: the left half is negative space for the title UI. */
export class TitlePresentation {
  readonly root = new T.Group();
  private readonly target = new T.Vector3();
  readonly shaft:T.Mesh<T.CylinderGeometry,T.ShaderMaterial>;
  private disposed = false;
  constructor(scene?: T.Scene) {
    this.root.name = 'cinematic-awakening-set';
    const material = (name:string,color:number,metalness:number,roughness:number,emissive=0,intensity=0) => {
      const m = new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:intensity});
      m.name = name; m.userData.actorMaterial = true; return m;
    };
    const steel=material('title-bulkhead',0x192a33,.72,.42),paint=material('title-ceramic',0x60777c,.45,.52),
      black=material('title-gaskets',0x070e13,.15,.85),glass=material('title-pod-glass',0x14303b,.82,.15),
      cold=material('title-cold-strip',0x657d85,.5,.3,0x9fe8ff,.42),warm=material('title-emergency',0x9a5940,.5,.4,0xff693c,3.4);
    // Near-horizontal black deck panels are matte, not a broad bevel rim.
    // This local attenuation prevents the floor from outranking the title cast.
    black.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight*=mix(1.0,.25,step(.95,dot(normalize(normal),normalize(viewMatrix[1].xyz))));\n#include <opaque_fragment>');};
    black.customProgramCacheKey=()=>':title-matte-horizontal-v1';
    const occupants=occupiedGlass();glass.map=glass.emissiveMap=occupants;glass.color.setHex(0x829b9f);glass.emissive.setHex(0x9fe8ff);glass.emissiveIntensity=.18;glass.metalness=.25;glass.roughness=.34;
    // The occupied displays use the same mapped/emissive room material program.
    optimizeLocalLights(glass);
    glass.addEventListener('dispose',()=>occupants.dispose());
    box(this.root,23,-.18,12,32,.3,30,black,0);
    // The visible broken berth behind the hero establishes the awakening beat.
    for(const x of [24.5,28.4,32.3]) {
      box(this.root,x,1.9,8.8,3.2,3.8,.7,black,.16);
      box(this.root,x,2.0,9.15,2.8,3.3,.22,paint,.15);
      box(this.root,x,2.15,9.29,2.25,2.5,.08,glass,.2);
      for(const side of [-1,1])box(this.root,x+side*1.35,2,9.34,.075,2.95,.08,cold,.025);
      box(this.root,x,3.6,9.27,1.25,.08,.12,cold,.025);
      box(this.root,x,.45,9.4,2.8,.24,1.3,steel,.08);
      for(let n=0;n<3;n++)box(this.root,x-.6+n*.6,.82,9.5,.12,.04,.16,cold,.015);
    }
    for(let i=0;i<6;i++) {
      const x=18+i*3.5;
      box(this.root,x,3.2,7.6,3.42,6.4,.5,steel,.06);
      box(this.root,x-1.65,3.3,8,.16,6.6,.5,paint,.04);
      for(const y of [4.3,5.6])rod(this.root,new T.Vector3(x-1.7,y,8.05),new T.Vector3(x+1.7,y,8.05),.065,.065,black);
      if(i>2)box(this.root,x,5.3,8.05,2.2,.06,.1,cold,.02);
    }
    // A damaged pod jamb hides most of the creature; the gap reveals its eyes
    // and hooked limbs. Foreground casing makes this a place, not a model stage.
    box(this.root,27.85,2.15,10.0,.48,4.3,1.45,steel,.12);
    box(this.root,27.58,2.15,10.58,.12,3.92,.24,paint,.045);
    box(this.root,29.4,1.85,17.1,2.7,3.7,1.9,black,.17);
    box(this.root,28.11,1.9,17.1,.18,3.4,1.8,steel,.06);
    box(this.root,29.4,3.58,17.1,2.7,.16,1.9,steel,.06);
    // One motivated emergency source, with broad protective hood and dark bail.
    const e=TITLE_STAGE.emergency;
    box(this.root,e.x,e.y+.1,e.z,.92,.28,.58,black,.07);
    box(this.root,e.x,e.y-.055,e.z+.06,.67,.07,.34,warm,.025);
    for(const side of [-1,1])box(this.root,e.x+side*.41,e.y-.16,e.z,.065,.36,.56,steel,.02);
    rod(this.root,new T.Vector3(e.x,5.9,8.1),new T.Vector3(e.x,e.y+.2,e.z),.055,.055,black);
    // Deck seams and a single rescue stripe carry the eye toward the marine.
    for(let z=9;z<22;z+=2.8)box(this.root,25,-.015,z,22,.012,.018,black,0);
    for(let z=11;z<23;z+=.7)box(this.root,25.8,.002,z,.08,.012,.34,paint,0);
    batch(this.root);
    // One static motivated shaft, outside the opaque ink and shadow passes.
    // Its prepared program exists on both tiers; visibility alone follows air quality.
    const shaftGeometry=new T.CylinderGeometry(0,.32,1,12,1,true);shaftGeometry.translate(0,-.5,0);
    const shaftMaterial=new T.ShaderMaterial({
      transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,blending:T.AdditiveBlending,
      uniforms:{shaftColor:{value:new T.Color(0xffa06c)}},
      vertexShader:'varying vec2 shaftUv;varying vec3 shaftNormal;varying vec3 shaftView;void main(){shaftUv=uv;shaftNormal=normalMatrix*normal;vec4 view=modelViewMatrix*vec4(position,1.0);shaftView=-view.xyz;gl_Position=projectionMatrix*view;}',
      fragmentShader:'uniform vec3 shaftColor;varying vec2 shaftUv;varying vec3 shaftNormal;varying vec3 shaftView;void main(){float y=clamp(shaftUv.y,0.0,1.0);float facing=abs(dot(normalize(shaftNormal),normalize(shaftView)));float alpha=smoothstep(0.0,.16,y)*(1.0-smoothstep(.92,1.0,y))*pow(y,.55)*pow(facing,1.2)*.12;gl_FragColor=vec4(shaftColor,alpha);}',
    });
    shaftMaterial.userData.actorMaterial=true;
    this.shaft=new T.Mesh(shaftGeometry,shaftMaterial);this.shaft.name='title-emergency-shaft';this.shaft.renderOrder=2;
    const direction=new T.Vector3(25.1,.06,13.6).sub(new T.Vector3(e.x,e.y-.1,e.z));
    this.shaft.position.set(e.x,e.y-.1,e.z);this.shaft.scale.y=direction.length();
    this.shaft.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),direction.normalize());this.root.add(this.shaft);
    this.root.visible=false;scene?.add(this.root);
  }
  /** Native gameplay camera is re-applied by CameraRig before every menu call. */
  apply(camera:T.OrthographicCamera|T.PerspectiveCamera,time:number,reducedMotion:boolean,atmosphere=true) {
    this.shaft.visible=atmosphere;
    const drift=reducedMotion?0:Math.sin(time*.12)*.12;
    camera.position.set(20.3+drift,4.8,29.6);
    this.target.set(20.7+drift*.35,1.6,12.8);camera.lookAt(this.target);
    camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  dispose() {if(this.disposed)return;this.disposed=true;disposeModel(this.root);}
}
