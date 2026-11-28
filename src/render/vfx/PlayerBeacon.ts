import * as T from 'three';
import {projectBody} from '../world/OriginalInteriorCutaways';

// Draw only the two visible suit skins into a native-density patch. Its depth
// test selects the nearest part of the suit before any alpha compositing.
const skinVertex = `
#include <common>
#include <skinning_pars_vertex>
attribute float marinePaint;
varying float shoulder;
varying vec2 suitUv;
void main(){
  suitUv=uv;
  shoulder=float(marinePaint>.5 && marinePaint<1.5);
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);
}`;
const revealFragment = `
uniform sampler2D suitDepth, optics, sceneDepth, sceneGeometry;
uniform vec2 screenSize;
uniform vec4 patchRect;
uniform vec3 rigColor;
uniform bool classified;
void main(){
  vec2 uv=(gl_FragCoord.xy-patchRect.xy)/patchRect.zw;
  float depth=texture2D(suitDepth,uv).r;
  if(depth>=1.)discard;
  vec2 screen=gl_FragCoord.xy/screenSize;
  if(classified){
    float kind=mod(floor(texture2D(sceneGeometry,screen).a*255.+.5),8.);
    if(kind==3.||depth<=texture2D(sceneDepth,screen).r+.000001)discard;
  }
  gl_FragDepth=depth-.000001;
  vec2 px=1.5/patchRect.zw;
  float outside=max(max(texture2D(suitDepth,uv+vec2(px.x,0)).r,texture2D(suitDepth,uv-vec2(px.x,0)).r),
                    max(texture2D(suitDepth,uv+vec2(0,px.y)).r,texture2D(suitDepth,uv-vec2(0,px.y)).r));
  float edge=step(1.,outside);
  vec2 paint=texture2D(optics,uv).rg;
  vec3 suit=mix(vec3(.16,.23,.27),rigColor,paint.g);
  suit=mix(suit,vec3(.08,.72,.80),paint.r);
  gl_FragColor=vec4(mix(suit,vec3(.008,.014,.018),edge),1.);
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
  readonly maskScene=new T.Scene();
  readonly target=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthTexture:new T.DepthTexture(1,1,T.UnsignedIntType)});
  private readonly skinMaterial=new T.ShaderMaterial({vertexShader:skinVertex,fragmentShader:`uniform sampler2D glow;varying vec2 suitUv;varying float shoulder;
    void main(){vec3 c=texture2D(glow,suitUv).rgb;gl_FragColor=vec4(smoothstep(.015,.12,c.b-c.r),shoulder,0.,1.);}`,uniforms:{glow:{value:null}},toneMapped:false});
  private readonly material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthFunc:T.GreaterDepth,toneMapped:false,
    uniforms:{patchRect:{value:new T.Vector4()},screenSize:{value:new T.Vector2()},suitDepth:{value:this.target.depthTexture},optics:{value:this.target.texture},sceneDepth:{value:null},sceneGeometry:{value:null},classified:{value:false},rigColor:{value:new T.Color()}},
    vertexShader:`uniform vec4 patchRect;uniform vec2 screenSize;void main(){gl_Position=vec4((patchRect.xy+uv*patchRect.zw)/screenSize*2.-1.,0.,1.);}`,fragmentShader:revealFragment});
  private readonly quad=new T.Mesh(new T.PlaneGeometry(2,2),this.material);
  private readonly sources:Array<{source:T.SkinnedMesh,copy:T.SkinnedMesh}>=[];
  private readonly projection=new Float64Array(6);
  private readonly point=new T.Vector3();
  renderMask(renderer:T.WebGLRenderer,camera:T.Camera,body:{x:number;y:number;radius:number},height:number,depth:T.DepthTexture|null,geometry:T.Texture|null,rig:number){
    const u=this.material.uniforms,screen=renderer.getDrawingBufferSize(u.screenSize.value);
    projectBody({...body,radius:body.radius+32},height+.45,camera,this.point,this.projection,0);
    const [left,bottom,right,top]=this.projection;
    const x=Math.floor((left+1)*screen.x*.5)-3,y=Math.floor((bottom+1)*screen.y*.5)-3;
    const w=Math.ceil(((right-left)*screen.x*.5+8)/64)*64,h=Math.ceil(((top-bottom)*screen.y*.5+8)/64)*64;
    this.target.setSize(w,h);this.target.viewport.set(-x,-y,screen.x,screen.y);
    u.patchRect.value.set(x,y,w,h);u.rigColor.value.setHex(rig);
    u.sceneDepth.value=depth;u.sceneGeometry.value=geometry;u.classified.value=!!depth&&!!geometry;
    this.material.depthTest=!u.classified.value;
    for(const {copy,source} of this.sources){
      copy.visible=source.visible;copy.matrix.copy(source.matrixWorld);copy.matrixWorldNeedsUpdate=true;
      copy.bindMatrix.copy(source.bindMatrix);copy.bindMatrixInverse.copy(source.bindMatrixInverse);
    }
    const previous=renderer.getRenderTarget();renderer.setRenderTarget(this.target);
    try{renderer.render(this.maskScene,camera);}finally{renderer.setRenderTarget(previous);}
  }

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
      const copy=new T.SkinnedMesh(object.geometry,this.skinMaterial);
      copy.bind(object.skeleton,object.bindMatrix);copy.matrixAutoUpdate=false;copy.frustumCulled=false;
      this.skinMaterial.uniforms.glow.value=(object.material as T.MeshStandardMaterial).emissiveMap;
      this.sources.push({source:object,copy});this.maskScene.add(copy);
    });
    this.quad.renderOrder=23;this.quad.frustumCulled=false;this.root.add(this.quad);
    this.ring.rotation.x=-Math.PI/2;this.ring.renderOrder=24;
    this.direction.renderOrder=26;
    const directionUV=this.direction.geometry.getAttribute('uv');
    for(let i=0;i<directionUV.count;i++)directionUV.setXY(i,(DIRECTION_TEXEL.x+.5)/LOCATOR_SIZE,(DIRECTION_TEXEL.y+.5)/LOCATOR_SIZE);
    directionUV.needsUpdate=true;
    this.hitArc.rotation.x=-Math.PI/2;this.hitArc.renderOrder=27;
    this.root.add(this.ring,this.direction,this.hitArc);scene?.add(this.root);
  }

  /** Incoming side comes from the native damage receipt; the stable arc avoids motion flashes. */
  hit(angle:number,strength=1){this.hitAngle=angle;this.hitLife=.32;this.hitStrength=T.MathUtils.clamp(strength,0,1);}

  /** Place the locator and incoming-hit marker in the final HUD pass. */
  update(player:T.Object3D,angle:number,hidden=false,warning=false,dt=0,blackout=false,reveal=true){
    this.quad.visible=reveal;
    this.root.visible=!hidden&&!this.disposed;if(!this.root.visible){this.hitLife=0;return;}
    this.locatorMaterial.opacity=warning?(blackout?.55:.22):1;
    this.hitLife=Math.max(0,this.hitLife-dt);
    // HUD preparation compiles constructor-owned materials even while hidden.
    this.hitArc.visible=this.hitLife>0&&this.hitStrength>0;
    this.hitMaterial.opacity=this.hitStrength*Math.min(1,this.hitLife/.12)*.86;
    this.hitArc.position.set(player.position.x,.09,player.position.z);
    this.hitArc.rotation.z=-this.hitAngle;
    this.ring.position.set(player.position.x,.055,player.position.z);
    this.direction.position.set(player.position.x+Math.cos(angle)*.78,.08,player.position.z+Math.sin(angle)*.78);
    this.direction.rotation.set(Math.PI/2,0,angle-Math.PI/2);
  }

  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.hitArc.geometry.dispose();this.hitMaterial.dispose();
    this.maskScene.clear();this.sources.length=0;this.target.dispose();this.skinMaterial.dispose();this.quad.geometry.dispose();
    this.material.dispose();this.ring.geometry.dispose();this.direction.geometry.dispose();this.locatorMaterial.dispose();this.locatorMap.dispose();
    this.root.clear();this.root.removeFromParent();
  }
}
