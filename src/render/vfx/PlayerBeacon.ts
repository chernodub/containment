import * as T from 'three';
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
void main(){
  float rim=pow(max(0.0,1.0-abs(dot(normalize(vBeaconNormal),normalize(vBeaconView)))),2.5);
  float fill=.16*strength;
  float edge=smoothstep(.14,.58,rim);
  // A dark outer keyline preserves the cyan silhouette against white frost,
  // muzzle flashes and friendly particle cores, without another skin draw.
  vec3 color=mix(vec3(.55,.89,1.0),vec3(.012,.035,.048),smoothstep(.72,.95,rim));
  gl_FragColor=vec4(color,max(fill,edge*strength));
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
    pixels[i+3]=Math.round(Math.max(band*.86,soft*.38)*255);
  }
  const texture=new T.DataTexture(pixels,LOCATOR_SIZE,LOCATOR_SIZE);
  texture.name='marine-locator-radial';texture.colorSpace=T.SRGBColorSpace;
  texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

/** A quiet suit locator and borrowed-skin silhouette keep the marine findable in a crowd. */
export class PlayerBeacon {
  readonly root = new T.Group();
  private readonly material = new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{strength:{value:.28}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:T.NormalBlending});
  private readonly groups: SkinGroup[] = [];
  private readonly locatorMap=locatorTexture();
  private readonly locatorMaterial=new T.MeshBasicMaterial({map:this.locatorMap,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide,forceSinglePass:true});
  private readonly ring = new T.Mesh(new T.RingGeometry(.50,.66,48),this.locatorMaterial);
  private readonly direction = new T.Mesh(new T.ConeGeometry(.10,.23,3),this.locatorMaterial);
  private disposed = false;

  constructor(player:T.Object3D,scene?:T.Scene){
    this.root.name='marine-readability-beacon';this.root.renderOrder=1200;
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
    this.ring.rotation.x=-Math.PI/2;this.ring.renderOrder=1199;
    this.direction.renderOrder=1201;
    const directionUV=this.direction.geometry.getAttribute('uv');
    for(let i=0;i<directionUV.count;i++)directionUV.setXY(i,(DIRECTION_TEXEL.x+.5)/LOCATOR_SIZE,(DIRECTION_TEXEL.y+.5)/LOCATOR_SIZE);
    directionUV.needsUpdate=true;
    this.root.add(this.ring,this.direction);scene?.add(this.root);
  }

  private makeOverlay(source:T.SkinnedMesh,geometry:T.BufferGeometry){
    const overlay=new T.SkinnedMesh(geometry,this.material);
    overlay.bind(source.skeleton,source.bindMatrix);overlay.bindMode=source.bindMode;overlay.bindMatrixInverse.copy(source.bindMatrixInverse);
    overlay.matrixAutoUpdate=false;overlay.frustumCulled=false;overlay.renderOrder=1200;return overlay;
  }

  private syncOverlay(overlay:T.SkinnedMesh,source:T.SkinnedMesh,visible:boolean){
    overlay.matrix.copy(source.matrixWorld);overlay.matrixWorldNeedsUpdate=true;overlay.visible=visible;
    overlay.skeleton=source.skeleton;overlay.bindMode=source.bindMode;overlay.bindMatrix.copy(source.bindMatrix);overlay.bindMatrixInverse.copy(source.bindMatrixInverse);
  }

  /** Animation remains authoritative; merged buffers only combine identical skin spaces. */
  update(player:T.Object3D,angle:number,hidden=false,crowding=0){
    this.root.visible=!hidden&&!this.disposed;if(!this.root.visible)return;
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
    // Only merged buffers are owned here. The pool owns source geometry/skeletons.
    for(const group of this.groups)group.merged?.geometry.dispose();
    this.material.dispose();this.ring.geometry.dispose();this.direction.geometry.dispose();this.locatorMaterial.dispose();this.locatorMap.dispose();
    this.root.clear();this.root.removeFromParent();this.groups.length=0;
  }
}
