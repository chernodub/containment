import * as T from 'three';

export type EnergyRibbon = {
  start: T.Vector3;
  end: T.Vector3;
  color?: T.ColorRepresentation;
  width?: number;
  opacity?: number;
  lightning?: boolean;
  seed?: number;
};
const UP = new T.Vector3(0, 1, 0);

/** Fixed ability-only pool: centimetre cores, faint halos and 40ms branching strikes. */
export class AbilityLightningBatch {
  low = false;
  priorityWeight = 0;
  private readonly priority: T.InstancedBufferAttribute;
  private readonly branch = new T.Vector3();
  readonly mesh: T.InstancedMesh;
  private readonly dummy = new T.Object3D();
  private readonly start = new T.Vector3();
  private readonly endpoint = new T.Vector3();
  private readonly direction = new T.Vector3();
  private readonly side = new T.Vector3();
  private readonly color = new T.Color();
  private readonly alpha: T.InstancedBufferAttribute;

  constructor(scene: T.Object3D, readonly capacity = 256) {
    const geometry = new T.CylinderGeometry(1, 1, 1, 5, 1, true);
    this.alpha = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.priority = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('ribbonPriority', this.priority);
    geometry.setAttribute('ribbonAlpha', this.alpha);
    const material = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: `attribute float ribbonAlpha;varying float alpha;varying vec3 color;varying vec2 local;
void main(){alpha=ribbonAlpha;color=instanceColor;local=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
      fragmentShader: `varying float alpha;varying vec3 color;varying vec2 local;
void main(){float cap=smoothstep(0.0,.08,local.y)*smoothstep(0.0,.12,1.0-local.y);gl_FragColor=vec4(color,alpha*cap);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` });
    this.mesh = new T.InstancedMesh(geometry, material, capacity);
    this.mesh.name = 'energy-ribbons';
    this.mesh.setColorAt(0, new T.Color());
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  /** Call begin, append all ribbons, then end. No transient segment arrays or vectors. */
  begin(): void { this.mesh.count = 0; }
  append(ribbon: EnergyRibbon, time = 0, reducedMotion = false): void {
    const segments = ribbon.lightning ? (this.low ? 6 : 10) : 1;
    this.direction.subVectors(ribbon.end, ribbon.start);
    const distance = this.direction.length();
    if (distance < .001) return;
    this.side.set(-this.direction.z, 0, this.direction.x).normalize();
    const seed = ribbon.seed ?? 1;
    const strike = reducedMotion ? 0 : Math.floor(time * 25);
    this.start.copy(ribbon.start);
    for (let i = 1; i <= segments; i++) {
      const t = i === segments ? 1 : (i + Math.sin(i * 73.1 + seed) * .24) / segments;
      this.endpoint.copy(ribbon.start).addScaledVector(this.direction, t);
      if (ribbon.lightning && i < segments) {
        const noise = Math.sin(i * 127.1 + seed * 311.7 + strike * 73.9);
        this.endpoint.addScaledVector(this.side, noise * Math.sin(t * Math.PI) * Math.min(.4, distance * .12));
      }
      const width = ribbon.lightning ? Math.min(.012, ribbon.width ?? .012) * (1 - t * .45) : ribbon.width ?? .045;
      this.segment(this.start, this.endpoint, width * (ribbon.lightning ? 2.8 : 3), ribbon.color ?? 0xb79cff, (ribbon.opacity ?? 1) * (ribbon.lightning ? .07 : .14), 1.2);
      this.segment(this.start, this.endpoint, width, ribbon.lightning ? 0xf2ecff : ribbon.color ?? 0xb79cff, ribbon.opacity ?? 1, ribbon.lightning ? 4 : 3);
      if (ribbon.lightning && !this.low && i % 3 === 0 && i < segments) {
        this.branch.copy(this.endpoint).addScaledVector(this.side, Math.sin(seed + i * 7.1 + strike) * .42);
        this.branch.y += .12 + Math.sin(i + strike) * .18;
        this.segment(this.endpoint, this.branch, width * .45, 0xd9cbff, (ribbon.opacity ?? 1) * .65, 2);
      }
      this.start.copy(this.endpoint);
    }
  }
  private segment(a: T.Vector3, b: T.Vector3, width: number, color: T.ColorRepresentation, opacity: number, hdr: number): void {
    if (this.mesh.count >= this.capacity) return;
    // Use the dummy's own position and scale as scratch to keep endpoint vectors intact.
    this.dummy.position.subVectors(b, a);
    const length = this.dummy.position.length();
    this.dummy.quaternion.setFromUnitVectors(UP, this.dummy.position.normalize());
    this.dummy.position.copy(a).add(b).multiplyScalar(.5);
    this.dummy.scale.set(width, length, width);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(this.mesh.count, this.dummy.matrix);
    this.color.set(color).multiplyScalar(hdr);
    this.mesh.setColorAt(this.mesh.count, this.color);
    this.priority.setX(this.mesh.count, this.priorityWeight);
    this.alpha.setX(this.mesh.count++, opacity);
  }
  end(): void { this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor!.needsUpdate = true; this.alpha.needsUpdate = this.priority.needsUpdate = true; }
  clear(): void { this.mesh.count = 0; }
  dispose(): void { this.clear(); this.mesh.geometry.dispose(); (this.mesh.material as T.Material).dispose(); this.mesh.removeFromParent(); }
}
