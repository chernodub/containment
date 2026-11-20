import * as T from 'three';
import {observeTransparentDraws} from '../post/GeometryBuffer';
import {projectBody} from '../world/OriginalInteriorCutaways';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Skin = {source:T.SkinnedMesh;overlay:T.SkinnedMesh;geometry:T.BufferGeometry;attributes:Array<{name:string;attribute:T.BufferAttribute|T.InterleavedBufferAttribute;version:number}>;index:T.BufferAttribute|null;indexVersion:number};
type SkinGroup = {skins:Skin[];merged?:T.SkinnedMesh};

// Identity is deliberately stricter than equivalent skeletons: sharing the
// actual skeleton also preserves future bone/inverse changes without a copy.
function samePose(a:T.SkinnedMesh,b:T.SkinnedMesh){
  return a.parent===b.parent&&a.matrix.equals(b.matrix)&&a.skeleton===b.skeleton&&a.bindMode===b.bindMode&&a.bindMatrix.equals(b.bindMatrix)&&a.bindMatrixInverse.equals(b.bindMatrixInverse);
}
function mergeable(a:T.BufferGeometry,b:T.BufferGeometry){
  if(Object.keys(a.morphAttributes).length||Object.keys(b.morphAttributes).length||!!a.index!==!!b.index)return false;
  for(const name of ['position','normal','skinIndex','skinWeight'])if(!a.getAttribute(name)||!b.getAttribute(name))return false;
  for(const g of [a,b])if(g.drawRange.start!==0||g.drawRange.count<(g.index?.count??g.getAttribute('position')?.count??0))return false;
  const names=Object.keys(a.attributes);if(names.length!==Object.keys(b.attributes).length)return false;
  return names.every(name=>{const x=a.getAttribute(name),y=b.getAttribute(name);return y&&!(x instanceof T.InterleavedBufferAttribute)&&!(y instanceof T.InterleavedBufferAttribute)&&x.array.constructor===y.array.constructor&&x.itemSize===y.itemSize&&x.normalized===y.normalized&&x.gpuType===y.gpuType;});
}

const vertex = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
varying vec3 vBeaconNormal;
varying vec3 vBeaconView;
void main(){
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 view=modelViewMatrix*vec4(transformed,1.0);
  vBeaconNormal=transformedNormal;
  vBeaconView=-view.xyz;
  gl_Position=projectionMatrix*view;
}`;
const fragment = /* glsl */ `
varying vec3 vBeaconNormal;
varying vec3 vBeaconView;
uniform float strength;
uniform sampler2D sceneDepth;
uniform sampler2D sceneGeometry;
uniform float marineId;
uniform vec2 inverseViewport;
uniform float hasSceneDepth;
uniform sampler2D opaqueColor;
uniform sampler2D finalColor;
uniform vec4 opaqueRegion;
uniform vec2 coverageSize;
void main(){
  float bossOcclusion=0.;
  float occlusion=0.;
  if(hasSceneDepth>.5){
    vec2 uv=gl_FragCoord.xy*inverseViewport;
    vec4 geometry=texture2D(sceneGeometry,uv);
    float classification=floor(geometry.a*255.+.5);
    float kind=mod(classification,8.);
    float depthDelta=gl_FragCoord.z-texture2D(sceneDepth,uv).x;
    if(classification==255.){
      // Depth-tested hostile priority fragments mark the geometry attachment.
      // Recover only where the borrowed skin shares their underlying opaque depth.
      occlusion=.58*(1.-smoothstep(.00008,.00045,abs(depthDelta)));
    }else{
      bossOcclusion=1.-step(.25,abs(kind-6.));
      float nearestId=floor(geometry.b*255.0+.5);
      if(kind==3.&&marineId>.5&&abs(nearestId-marineId)<.5){
        vec2 sampleUv=(floor(uv*coverageSize)+.5)/coverageSize;
        vec2 crop=(sampleUv-opaqueRegion.xy)*opaqueRegion.zw;
        if(all(greaterThan(opaqueRegion.zw,vec2(0.)))&&all(greaterThan(crop,vec2(0.)))&&all(lessThan(crop,vec2(1.)))){
          vec3 before=texture2D(opaqueColor,crop).rgb;
          vec3 change=abs(texture2D(finalColor,sampleUv).rgb-before);
          float delta=max(change.r,max(change.g,change.b));
          float magnitude=max(before.r,max(before.g,before.b));
          occlusion=smoothstep(.04,.18,delta/(.25+magnitude))
            *(1.-smoothstep(.00008,.00045,abs(depthDelta)));
        }
      }else if(kind==2.||(kind>=4.&&kind<=6.)){
        occlusion=smoothstep(.00008,.0008,depthDelta);
      }
    }
    if(occlusion<=0.)discard;
  }
  float rim=pow(max(0.0,1.0-abs(dot(normalize(vBeaconNormal),normalize(vBeaconView)))),2.5);
  float fill=mix(.07*strength,.24,bossOcclusion);
  float edge=smoothstep(.14,.58,rim);
  // A dark outer keyline preserves the cyan silhouette against white frost,
  // muzzle flashes and friendly particle cores, without another skin draw.
  vec3 color=mix(mix(vec3(.55,.89,1.0),vec3(.82,.95,1.),bossOcclusion),vec3(.012,.035,.048),smoothstep(.72,.95,rim));
  gl_FragColor=vec4(color,occlusion*max(fill,edge*mix(min(1.0,strength+.30),.93,bossOcclusion)));
  #include <colorspace_fragment>
}`;

const LOCATOR_SIZE=64;
const DIRECTION_TEXEL={x:59,y:32};

/** One tiny authored radial map serves both the soft ring and the solid facing marker. */
function locatorTexture():T.DataTexture {
  const pixels=new Uint8Array(LOCATOR_SIZE*LOCATOR_SIZE*4);
  for(let y=0;y<LOCATOR_SIZE;y++)for(let x=0;x<LOCATOR_SIZE;x++){
    const radius=Math.hypot((x+.5)/LOCATOR_SIZE-.5,(y+.5)/LOCATOR_SIZE-.5)*2;
    const band=1-T.MathUtils.smoothstep(Math.abs(radius-.86),.025,.07);
    const soft=1-T.MathUtils.smoothstep(radius,.77,1);
    const i=(y*LOCATOR_SIZE+x)*4;
    pixels[i]=Math.round(T.MathUtils.lerp(4,212,band));
    pixels[i+1]=Math.round(T.MathUtils.lerp(12,247,band));
    pixels[i+2]=Math.round(T.MathUtils.lerp(15,255,band));
    pixels[i+3]=Math.round(Math.max(band*.34,soft*.10)*255);
  }
  const texture=new T.DataTexture(pixels,LOCATOR_SIZE,LOCATOR_SIZE);
  texture.name='marine-locator-radial';texture.colorSpace=T.SRGBColorSpace;
  texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

/** A quiet suit locator and borrowed-skin silhouette keep the marine findable in a crowd. */
export class PlayerBeacon {
  readonly root = new T.Group();
  private readonly material = new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{opaqueColor:{value:null},finalColor:{value:null},opaqueRegion:{value:new T.Vector4()},coverageSize:{value:new T.Vector2(1,1)},strength:{value:.28},sceneDepth:{value:null},inverseViewport:{value:new T.Vector2(1,1)},hasSceneDepth:{value:0},sceneGeometry:{value:null},marineId:{value:0}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:T.NormalBlending});
  private readonly projection=new Float64Array(6);
  private readonly projectPoint=new T.Vector3();
  private readonly copyOrigin=new T.Vector2();
  private opaqueColor?:T.FramebufferTexture;
  private capturedColor:T.Texture|null=null;

  /** Borrow the cutaway's projected marine bounds and copy only that patch.
   * The transparent draw still writes color only. This samples real coverage
   * after blending, including additive light and darkening smoke. */
  beginCoverage(renderer:T.WebGLRenderer,camera:T.Camera,body:{x:number;y:number;radius:number},height:number,enabled:boolean):void {
    this.capturedColor=null;
    if(!enabled){
      this.opaqueColor?.dispose();
      this.opaqueColor=undefined;
      return;
    }
    projectBody(body,height,camera,this.projectPoint,this.projection,0);
    observeTransparentDraws(renderer,()=>{
      const target=renderer.getRenderTarget();
      if(!target)return;
      observeTransparentDraws(renderer);
      const size=Math.min(384,target.width,target.height);
      const [left,bottom,right,top]=this.projection;
      const x=T.MathUtils.clamp(Math.floor((left+right+2)*target.width*.25-size*.5),0,target.width-size);
      const y=T.MathUtils.clamp(Math.floor((bottom+top+2)*target.height*.25-size*.5),0,target.height-size);
      if(!this.opaqueColor||this.opaqueColor.image.width!==size||this.opaqueColor.type!==target.texture.type){
        this.opaqueColor?.dispose();
        this.opaqueColor=new T.FramebufferTexture(size,size);
        this.opaqueColor.type=target.texture.type;
        this.opaqueColor.format=target.texture.format;
      }
      this.copyOrigin.set(x,y);
      renderer.copyFramebufferToTexture(this.opaqueColor,this.copyOrigin);
      this.material.uniforms.opaqueRegion.value.set(x/target.width,y/target.height,target.width/size,target.height/size);
      this.material.uniforms.coverageSize.value.set(target.width,target.height);
      this.capturedColor=target.texture;
    });
  }

  endCoverage(renderer:T.WebGLRenderer):void {
    observeTransparentDraws(renderer);
    this.material.uniforms.opaqueColor.value=this.opaqueColor??null;
    this.material.uniforms.finalColor.value=this.capturedColor;
    if(!this.capturedColor)this.material.uniforms.opaqueRegion.value.set(0,0,0,0);
  }

  private readonly groups: SkinGroup[] = [];
  private readonly locatorMap=locatorTexture();
  private readonly locatorMaterial=new T.MeshBasicMaterial({map:this.locatorMap,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide,forceSinglePass:true});
  private readonly ring = new T.Mesh(new T.RingGeometry(.50,.66,48),this.locatorMaterial);
  private readonly direction = new T.Mesh(new T.ConeGeometry(.10,.23,3),this.locatorMaterial);
  private readonly hitMaterial=new T.MeshBasicMaterial({color:0xff793c,transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide,forceSinglePass:true});
  private readonly hitArc=new T.Mesh(new T.RingGeometry(.72,.83,20,1,-.55,1.1),this.hitMaterial);
  private hitLife=0;
  private hitAngle=0;
  private hitStrength=1;
  private disposed = false;

  constructor(player:T.Object3D,scene?:T.Scene){
    this.root.name='marine-readability-beacon';this.root.renderOrder=0;
    player.updateWorldMatrix(true,true);
    player.traverse(object=>{
      if(!(object instanceof T.SkinnedMesh))return;
      const geometry=object.geometry,overlay=this.makeOverlay(object,geometry);
      const skin:Skin={source:object,overlay,geometry,attributes:Object.keys(geometry.attributes).map(name=>{const attribute=geometry.getAttribute(name);return{name,attribute,version:attribute instanceof T.InterleavedBufferAttribute?attribute.data.version:attribute.version};}),index:geometry.index,indexVersion:geometry.index?.version??0};
      const group=this.groups.find(group=>samePose(group.skins[0].source,object)&&mergeable(group.skins[0].geometry,geometry));
      if(group)group.skins.push(skin);else this.groups.push({skins:[skin]});
      overlay.visible=false;this.root.add(overlay);
    });
    for(const group of this.groups)if(group.skins.length>1){
      const geometry=mergeGeometries(group.skins.map(s=>s.geometry));
      if(geometry){group.merged=this.makeOverlay(group.skins[0].source,geometry);this.root.add(group.merged);}
    }
    this.ring.rotation.x=-Math.PI/2;this.ring.renderOrder=24;
    this.direction.renderOrder=26;
    const directionUV=this.direction.geometry.getAttribute('uv');
    for(let i=0;i<directionUV.count;i++)directionUV.setXY(i,(DIRECTION_TEXEL.x+.5)/LOCATOR_SIZE,(DIRECTION_TEXEL.y+.5)/LOCATOR_SIZE);
    directionUV.needsUpdate=true;
    this.hitArc.rotation.x=-Math.PI/2;this.hitArc.renderOrder=27;
    this.root.add(this.ring,this.direction,this.hitArc);scene?.add(this.root);
  }

  private makeOverlay(source:T.SkinnedMesh,geometry:T.BufferGeometry){
    const overlay=new T.SkinnedMesh(geometry,this.material);
    overlay.bind(source.skeleton,source.bindMatrix);overlay.bindMode=source.bindMode;overlay.bindMatrixInverse.copy(source.bindMatrixInverse);
    overlay.matrixAutoUpdate=false;overlay.frustumCulled=false;overlay.renderOrder=25;return overlay;
  }

  private syncOverlay(overlay:T.SkinnedMesh,source:T.SkinnedMesh,visible:boolean){
    overlay.matrix.copy(source.matrixWorld);overlay.matrixWorldNeedsUpdate=true;overlay.visible=visible;
    overlay.skeleton=source.skeleton;overlay.bindMode=source.bindMode;overlay.bindMatrix.copy(source.bindMatrix);overlay.bindMatrixInverse.copy(source.bindMatrixInverse);
  }

  /** Borrow classified post depth; the minimal forward path keeps the locator. */
  setDepthSource(depth:T.DepthTexture|null,width:number,height:number,geometry:T.Texture|null=null):void {
    this.material.uniforms.sceneDepth.value=depth;
    // Public Three texture ownership gives the matching retained MRT attachment.
    // Borrow only; the post owner handles resize, tier recovery and disposal.
    geometry ??= depth?.renderTarget?.textures[1] ?? null;
    const hasGeometry=geometry?.name==='Containment geometry normal + identity';
    // Unclassified forward depth cannot distinguish a wall from our own armor.
    // Keep the locator/hit marker, rather than drawing a ghost through the body.
    // Contour-enabled Low and High already own the classified MRT; no new target.
    this.material.visible=!!depth&&hasGeometry;
    this.material.uniforms.sceneGeometry.value=hasGeometry?geometry:null;
    this.material.uniforms.hasSceneDepth.value=depth?1:0;
    this.material.uniforms.inverseViewport.value.set(1/Math.max(1,width),1/Math.max(1,height));
    this.material.depthTest=!depth;this.material.depthFunc=T.GreaterDepth;
  }

  /** Incoming side comes from the native damage receipt; the stable arc avoids motion flashes. */
  hit(angle:number,strength=1){this.hitAngle=angle;this.hitLife=.32;this.hitStrength=T.MathUtils.clamp(strength,0,1);}

  /** Animation remains authoritative; merged buffers only combine identical skin spaces. */
  update(player:T.Object3D,angle:number,hidden=false,crowding=0,warning=false,dt=0){
    this.root.visible=!hidden&&!this.disposed;if(!this.root.visible){this.hitLife=0;return;}
    this.locatorMaterial.opacity=warning?.22:1;
    this.hitLife=Math.max(0,this.hitLife-dt);
    // HUD preparation compiles constructor-owned materials even while hidden.
    this.hitArc.visible=this.hitLife>0&&this.hitStrength>0;
    this.hitMaterial.opacity=this.hitStrength*Math.min(1,this.hitLife/.12)*.86;
    this.hitArc.position.set(player.position.x,.09,player.position.z);
    this.hitArc.rotation.z=-this.hitAngle;
    const marineId=player.userData.containmentGeometryId;
    this.material.uniforms.marineId.value=Number.isFinite(marineId)?marineId:0;
    this.material.uniforms.strength.value=.28+.56*Math.min(1,Math.max(0,crowding));
    player.updateWorldMatrix(true,true);
    for(const group of this.groups){
      const first=group.skins[0].source;let merged=!!group.merged;
      for(const skin of group.skins){
        const source=skin.source,geometry=source.geometry;
        if(source.visible!==first.visible||!samePose(first,source)||geometry!==skin.geometry||geometry.index!==skin.index||(geometry.index?.version??0)!==skin.indexVersion||geometry.drawRange.start!==0||geometry.drawRange.count<(geometry.index?.count??geometry.getAttribute('position')?.count??0))merged=false;
        for(const saved of skin.attributes)if(geometry.getAttribute(saved.name)!==saved.attribute||(saved.attribute instanceof T.InterleavedBufferAttribute?saved.attribute.data.version:saved.attribute.version)!==saved.version)merged=false;
      }
      if(group.merged){if(merged)this.syncOverlay(group.merged,first,first.visible);else group.merged.visible=false;}
      for(const skin of group.skins){
        if(merged)skin.overlay.visible=false;
        else {skin.overlay.geometry=skin.source.geometry;this.syncOverlay(skin.overlay,skin.source,skin.source.visible);}
      }
    }
    this.ring.position.set(player.position.x,.055,player.position.z);
    this.direction.position.set(player.position.x+Math.cos(angle)*.78,.08,player.position.z+Math.sin(angle)*.78);
    this.direction.rotation.set(Math.PI/2,0,angle-Math.PI/2);
  }

  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.hitArc.geometry.dispose();this.hitMaterial.dispose();
    // Only merged buffers are owned here. The pool owns source geometry/skeletons.
    for(const group of this.groups)group.merged?.geometry.dispose();
    this.opaqueColor?.dispose();this.material.dispose();this.ring.geometry.dispose();this.direction.geometry.dispose();this.locatorMaterial.dispose();this.locatorMap.dispose();
    this.root.clear();this.root.removeFromParent();this.groups.length=0;
  }
}
