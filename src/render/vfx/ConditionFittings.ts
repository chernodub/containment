import * as T from 'three';
import {bindPriorityMask} from '../abilities/PriorityMask';

/** Recessed metal uses the ROOM14 machined finish. Lit glass, mist and dust
 * share one colour-only batch beneath the hostile floor warnings. */
export class ConditionFittings {
 readonly root=new T.Group();
 private geometry=new T.BoxGeometry();
 private metal=new T.MeshStandardMaterial({roughness:.81,metalness:.26});
 private glass=new T.ShaderMaterial({
  uniforms:{},transparent:true,depthWrite:false,
  vertexShader:`varying vec3 tint;varying vec2 panel;varying float mist;varying float face;
  void main(){panel=uv;tint=abs(instanceColor);mist=step(instanceColor.r,0.);face=normal.z;
   vec4 view=modelViewMatrix*instanceMatrix*vec4(position,1.);
   if(mist>.5){
    view=modelViewMatrix*instanceMatrix[3];
    view.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
   }
   gl_Position=projectionMatrix*view;}`,
  fragmentShader:`varying vec3 tint;varying vec2 panel;varying float mist;varying float face;
  void main(){float alpha=.85;
   if(mist>.5){
    if(face<.9)discard;
    vec2 p=panel*2.-1.;
    float plume=length(vec2(p.x+sin(p.y*4.)*.16,p.y));
    alpha=.28*(1.-smoothstep(.12,1.,plume));
   }
   gl_FragColor=vec4(tint,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`,
 });
 private solids=new T.InstancedMesh(this.geometry,this.metal,256);
 private emitters=new T.InstancedMesh(this.geometry,this.glass,256);
 private readonly transform=new T.Object3D();
 private readonly colour=new T.Color();
 constructor(blank:T.Texture){
  bindPriorityMask(this.glass,blank);
  this.emitters.renderOrder=4;
  this.root.add(this.solids,this.emitters);
  for(const batch of [this.solids,this.emitters]){
   batch.frustumCulled=false;
   batch.setColorAt(0,this.colour);
   batch.instanceMatrix.setUsage(T.DynamicDrawUsage);
   batch.instanceColor!.setUsage(T.DynamicDrawUsage);
   batch.count=0;
  }
 }
 begin(texture:T.Texture){this.solids.count=this.emitters.count=0;this.glass.uniforms.abilityPriorityMap.value=texture;}
 part(x:number,y:number,z:number,w:number,h:number,l:number,color:number,yaw=0,roll=0,lit=false,mist=false){
  const batch=lit?this.emitters:this.solids,i=batch.count++;
  this.transform.position.set(x,y,z);
  this.transform.rotation.set(0,yaw,roll,'YXZ');
  this.transform.scale.set(w,h,l);
  this.transform.updateMatrix();
  batch.setMatrixAt(i,this.transform.matrix);
  this.colour.setHex(color);if(mist)this.colour.r*=-1;
  batch.setColorAt(i,this.colour);
 }
 finish(){
  for(const batch of [this.solids,this.emitters]){
   batch.visible=batch.count>0;
   if(batch.visible){batch.instanceMatrix.needsUpdate=true;batch.instanceColor!.needsUpdate=true;}
  }
 }
 dispose(){this.solids.dispose();this.emitters.dispose();this.metal.dispose();this.glass.dispose();this.geometry.dispose();}
}
