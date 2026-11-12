import * as T from 'three';
import { TelegraphBatch, type Telegraph } from '../vfx/TelegraphBatch';

/** Ground decoration is submitted before hostile timing fills, regardless of camera depth. */
export const FRIENDLY_GROUND_ORDER = -2;
export const FRIENDLY_BOUNDARY_ORDER = 3;

/** Exact hit shapes with open interiors, rotating dashes and cyan-white ownership ticks. */
export class FriendlyBoundaryBatch extends TelegraphBatch {
  priorityWeight = 1;
  private readonly priority: T.InstancedBufferAttribute;
  constructor(root: T.Object3D, capacity: number) {
    super(root, capacity);
    this.priority = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.mesh.geometry.setAttribute('abilityPriority', this.priority);
    const material = this.mesh.material as T.ShaderMaterial;
    material.name = 'friendly-ability-boundary';
    material.userData.friendlyBoundary = true;
    material.uniforms.boundaryTime = { value: 0 };
    material.fragmentShader = `
uniform float boundaryTime;varying vec2 local;varying vec4 data;varying vec4 ink;
void main(){
 vec2 p=local;float d=length(p);float angle=atan(p.y,p.x);float edge=0.;float along=angle/6.283185;
 if(data.x<1.5){
  if(d>1.)discard;if(data.x>.5&&abs(angle)>data.z*.5)discard;
  edge=1.-smoothstep(.002,.007,abs(d-.992));
  if(data.x>.5)edge=max(edge,(1.-smoothstep(.002,.007,abs(abs(angle)-data.z*.5)))*smoothstep(.12,.25,d));
 }else if(data.x<2.5){
  edge=1.-smoothstep(.004,.014,abs(max(abs(p.x),abs(p.y))-.99));along=(p.x+p.y)*.25;
 }else{
  if(d>1.)discard;edge=1.-smoothstep(.0015,.006,abs(d-(.02+data.y*.97)));
 }
 float dash=step(.36,fract(along*32.-boundaryTime*.35));
 float tick=step(.90,fract(along*8.-boundaryTime*.0875));
 float a=edge*max(dash*.56,tick)*ink.a*data.w;if(a<.004)discard;
 gl_FragColor=vec4(mix(ink.rgb,vec3(.62,.91,1.),tick),a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
    this.mesh.renderOrder = FRIENDLY_BOUNDARY_ORDER;
    this.mesh.userData.friendlyBoundary = true;
  }

  override set(slot: number, effect: Telegraph): void {
    super.set(slot, effect);
    if (slot < 0 || slot >= this.capacity) return;
    this.priority.setX(slot, this.priorityWeight);
    this.priority.needsUpdate = true;
  }

  setTime(time: number, reducedMotion: boolean): void {
    (this.mesh.material as T.ShaderMaterial).uniforms.boundaryTime.value = reducedMotion ? 0 : time;
  }
}
