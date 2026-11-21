import * as T from 'three';
import { TelegraphBatch, type Telegraph } from '../vfx/TelegraphBatch';

/** Ground decoration is submitted before hostile timing fills, regardless of camera depth. */
export const FRIENDLY_GROUND_ORDER = -2;
export const FRIENDLY_BOUNDARY_ORDER = -2;

/** Exact hit shapes with open interiors, rotating dashes and cyan-white ownership ticks. */
export class FriendlyBoundaryBatch extends TelegraphBatch {
  priorityWeight = 1;
  private readonly priority: T.InstancedBufferAttribute;
  private readonly capsule: T.InstancedBufferAttribute;
  private readonly dominance: T.InstancedBufferAttribute;
  private readonly cold = new T.Vector3();
  private readonly capsuleShape: Telegraph = { shape: 'line', x: 0, z: 0 };

  /** Fade only redundant interior boundary pixels; the dominant perimeter stays exact. */
  setColdDominance(x = 0, z = 0, radius = 0): void { this.cold.set(x, z, radius); }

  /** Exact rounded strip in one instance, without internal end-circle/rectangle seams. */
  addCapsule(x: number, z: number, length: number, width: number, angle: number, color: number, opacity: number): void {
    const s = this.capsuleShape, half = width * .5;
    s.x = x - Math.cos(angle) * half; s.z = z - Math.sin(angle) * half;
    s.length = length + width; s.width = width; s.angle = angle; s.color = color; s.opacity = opacity;
    const slot = this.add(s);
    this.capsule.setX(slot, width / Math.max(.001, length + width)); this.capsule.needsUpdate = true;
  }
  constructor(root: T.Object3D, capacity: number) {
    super(root, capacity);
    this.priority = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.mesh.geometry.setAttribute('abilityPriority', this.priority);
    this.capsule = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.dominance = new T.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(T.DynamicDrawUsage);
    this.mesh.geometry.setAttribute('boundaryCapsule', this.capsule);
    this.mesh.geometry.setAttribute('coldDominance', this.dominance);
    const material = this.mesh.material as T.ShaderMaterial;
    material.name = 'friendly-ability-boundary';
    material.forceSinglePass = true;
    material.vertexShader = 'attribute float boundaryCapsule; attribute vec3 coldDominance; varying float capsuleRatio; varying vec3 cold; varying vec2 boundaryWorld;\n' + material.vertexShader.replace('void main(){', 'void main(){capsuleRatio=boundaryCapsule;cold=coldDominance;boundaryWorld=(modelMatrix*instanceMatrix*vec4(position,1.)).xz;');
    material.userData.friendlyBoundary = true;
    material.uniforms.boundaryTime = { value: 0 };
    material.fragmentShader = `
uniform float boundaryTime;varying vec2 local;varying vec4 data;varying vec4 ink;
varying float capsuleRatio;varying vec3 cold;varying vec2 boundaryWorld;
void main(){
 vec2 p=local;float d=length(p);float angle=atan(p.y,p.x);float edge=0.;float along=angle/6.283185;
 if(data.x<1.5){
  if(d>1.)discard;if(data.x>.5&&abs(angle)>data.z*.5)discard;
  edge=1.-smoothstep(.002,.007,abs(d-.992));
  if(data.x>.5)edge=max(edge,(1.-smoothstep(.002,.007,abs(abs(angle)-data.z*.5)))*smoothstep(.12,.25,d));
 }else if(data.x<2.5){
  if(capsuleRatio>.0001){
   vec2 q=vec2(max(0.,abs(p.x)-1.+capsuleRatio)/capsuleRatio,p.y);
   float cap=length(q);if(cap>1.)discard;edge=1.-smoothstep(.004,.014,abs(cap-.99));
  }else edge=1.-smoothstep(.004,.014,abs(max(abs(p.x),abs(p.y))-.99));along=(p.x+p.y)*.25;
 }else{
  if(d>1.)discard;edge=1.-smoothstep(.0015,.006,abs(d-(.02+data.y*.97)));
 }
 float dash=step(.36,fract(along*32.-boundaryTime*.35));
 float tick=step(.90,fract(along*8.-boundaryTime*.0875));
 float a=edge*dash*min(.30,ink.a*data.w);
 // Hot boundaries share the ember cadence of the fuel, including on Low.
 if(ink.r>ink.g*2.3&&ink.g>ink.b*1.6){
  float ember=sin(along*402.1239)+.45*sin(along*703.7168);
  a*=smoothstep(.40,.95,ember)*.68;
 }
 if(cold.z>0.)a*=mix(.08,1.,smoothstep(cold.z*.94,cold.z,length(boundaryWorld-cold.xy)));
 if(a<.004)discard;
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
    this.capsule.setX(slot, 0); this.capsule.needsUpdate = true;
    this.dominance.setXYZ(slot, this.cold.x, this.cold.y, this.cold.z); this.dominance.needsUpdate = true;
    this.priority.needsUpdate = true;
  }

  setTime(time: number, reducedMotion: boolean): void {
    (this.mesh.material as T.ShaderMaterial).uniforms.boundaryTime.value = reducedMotion ? 0 : time;
  }
}
