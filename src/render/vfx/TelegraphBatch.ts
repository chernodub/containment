import * as T from 'three';

export type TelegraphShape = 'circle' | 'cone' | 'line' | 'wall' | 'shockwave';
/** All distances are world units; angle is clockwise from +X in the XZ plane. */
export type Telegraph = {
  shape: TelegraphShape;
  x: number;
  z: number;
  radius?: number;
  length?: number;
  width?: number;
  angle?: number;
  /** Cone's full angle in radians (not its half angle). */
  arc?: number;
  progress?: number;
  color?: T.ColorRepresentation;
  opacity?: number;
};
const SHAPES: Record<TelegraphShape, number> = { circle: 0, cone: 1, line: 2, wall: 2, shockwave: 3 };
const vertex = `attribute vec4 telegraph; attribute vec4 appearance;
varying vec2 local; varying vec4 data; varying vec4 ink;
void main(){local=uv*2.0-1.0;data=telegraph;ink=appearance;
gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;
const fragment = `varying vec2 local;varying vec4 data;varying vec4 ink;
void main(){vec2 p=local;float d=length(p);float edge;float filled;
if(data.x<1.5){if(d>1.0)discard;
if(data.x>.5&&abs(atan(p.y,p.x))>data.z*.5)discard;
edge=1.0-smoothstep(.025,.075,abs(d-.94));
if(data.x>.5){float a=abs(atan(p.y,p.x));edge=max(edge,(1.0-smoothstep(.014,.035,abs(a-data.z*.5)))*smoothstep(.12,.25,d));}
filled=1.0-smoothstep(data.y-.018,data.y+.018,d);
}else if(data.x<2.5){edge=1.0-smoothstep(.92,.99,max(abs(p.x),abs(p.y)));edge=1.0-edge;filled=1.0-smoothstep(data.y*2.0-1.02,data.y*2.0-.98,p.x);}
else{float r=.02+data.y*.955;float wave=abs(d-r);if(d>1.0)discard;edge=1.0-smoothstep(.012,.055,wave);filled=0.0;}
float hatch=step(.58,fract((p.x+p.y)*10.0-data.y*2.0));
float timing=1.0-smoothstep(.012,.035,abs(d-data.y*.88));
float danger=max(edge,max(timing*.8,hatch*(.14+filled*.14)));
// Dark opaque backing is part of the same draw, so friendly additive effects
// cannot turn the warning into pale orange on clinical or frozen floors.
vec3 warning=mix(vec3(.012,.008,.010),ink.rgb*(1.15+edge*.35),danger);
float a=(.92+edge*.08)*data.w;if(a<.005)discard;
gl_FragColor=vec4(warning,a*ink.a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

/** One draw for all ground warnings. Explicit dimensions never grow beyond the hit shape. */
export class TelegraphBatch {
  readonly mesh: T.InstancedMesh;
  private readonly dummy = new T.Object3D();
  private readonly color = new T.Color();
  private readonly live: Uint8Array;
  private readonly shapes: T.InstancedBufferAttribute;
  private readonly inks: T.InstancedBufferAttribute;
  private next = 0;

  constructor(scene: T.Object3D, readonly capacity = 32) {
    this.live = new Uint8Array(capacity);
    const geometry = new T.PlaneGeometry(2, 2);
    this.shapes = new T.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(T.DynamicDrawUsage);
    this.inks = new T.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('telegraph', this.shapes);
    geometry.setAttribute('appearance', this.inks);
    const material = new T.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment,
      transparent: true, depthWrite: false, depthTest:false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
    this.mesh = new T.InstancedMesh(geometry, material, capacity);
    this.mesh.name = 'ground-telegraphs';
    // Keep the public world-batch order above friendly ground boundaries (18).
    // Active combat warnings use AttackEffects in the post-HDR priority scene.
    this.mesh.renderOrder = 20;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.mesh.count = 0;
    scene.add(this.mesh);
  }

  /** Bounded circular allocation. Retain the returned slot only for the warning's lifetime. */
  add(effect: Telegraph): number {
    const slot = this.next++ % this.capacity;
    this.live[slot] = 1;
    this.set(slot, effect);
    return slot;
  }

  set(slot: number, effect: Telegraph): void {
    if (slot < 0 || slot >= this.capacity || !this.live[slot]) return;
    const round = effect.shape === 'circle' || effect.shape === 'cone' || effect.shape === 'shockwave';
    const radius = Math.max(0, effect.radius ?? 1);
    const length = Math.max(0, effect.length ?? radius * 2);
    const angle = effect.angle ?? 0;
    this.dummy.position.set(effect.x, .035, effect.z);
    // Rectangular hit shapes start at the origin; round hit shapes are centered on it.
    if (!round) { this.dummy.position.x += Math.cos(angle) * length * .5; this.dummy.position.z += Math.sin(angle) * length * .5; }
    this.dummy.rotation.set(-Math.PI / 2, 0, -angle);
    this.dummy.scale.set(round ? radius : length * .5, round ? radius : Math.max(0, effect.width ?? 1) * .5, 1);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(slot, this.dummy.matrix);
    this.shapes.setXYZW(slot, SHAPES[effect.shape], T.MathUtils.clamp(effect.progress ?? 0, 0, 1), T.MathUtils.clamp(effect.arc ?? Math.PI / 2, 0, Math.PI * 2), 1);
    this.color.set(effect.color ?? 0xff5a36);
    this.inks.setXYZW(slot, this.color.r, this.color.g, this.color.b, effect.opacity ?? 1);
    this.mesh.count = Math.max(this.mesh.count, slot + 1);
    this.flush();
  }

  progress(slot: number, progress: number): void {
    if (this.live[slot]) { this.shapes.setY(slot, T.MathUtils.clamp(progress, 0, 1)); this.shapes.needsUpdate = true; }
  }

  remove(slot: number): void {
    if (slot < 0 || slot >= this.capacity) return;
    this.live[slot] = 0;
    this.shapes.setW(slot, 0);
    this.shapes.needsUpdate = true;
  }

  private flush(): void { this.mesh.instanceMatrix.needsUpdate = true; this.shapes.needsUpdate = true; this.inks.needsUpdate = true; }
  clear(): void { this.live.fill(0); this.shapes.array.fill(0); this.shapes.needsUpdate = true; this.mesh.count = this.next = 0; }
  dispose(): void { this.clear(); this.mesh.geometry.dispose(); (this.mesh.material as T.Material).dispose(); this.mesh.removeFromParent(); }
}
