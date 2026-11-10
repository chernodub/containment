import { Camera, Vector3, Vector4 } from 'three';

export const DISTORTION_CAPACITY = 12;

type DistortionSlot = {
  x: number; z: number; radius: number; strength: number;
  age: number; duration: number; heat: boolean;
};

/** A bounded, allocation-free world-space effect pool, projected into the post buffer. */
export class DistortionField {
  readonly waves = Array.from({ length: DISTORTION_CAPACITY }, () => new Vector4());
  readonly shapes = Array.from({ length: DISTORTION_CAPACITY }, () => new Vector4());
  private readonly slots: DistortionSlot[] = Array.from({ length: DISTORTION_CAPACITY }, () => ({
    x: 0, z: 0, radius: 1, strength: 0, age: 0, duration: 0, heat: false,
  }));
  private readonly center = new Vector3();
  private readonly edge = new Vector3();
  private enabled = true;

  /** Starts a ground-plane blast ring. Strength is a UV offset, usually 0.004–0.012. */
  shockwave(x: number, z: number, radius = 3, strength = 0.008, duration = 0.55): void {
    this.spawn(x, z, radius, strength, duration, false);
  }

  /** Starts a localized shimmer; negative strength also supports cold refraction. */
  heat(x: number, z: number, radius = 2, strength = 0.003, duration = 1): void {
    this.spawn(x, z, radius, strength, duration, true);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  get activeCount(): number {
    let count = 0;
    for (const slot of this.slots) if (slot.duration > slot.age) count++;
    return count;
  }

  /** Advances existing slots without allocating arrays or vectors. */
  update(dt: number, camera: Camera): void {
    const step = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const wave = this.waves[i];
      const shape = this.shapes[i];
      slot.age += step;
      if (slot.age >= slot.duration) { wave.set(0, 0, 0, 0); continue; }
      const progress = slot.age / slot.duration;
      const radius = slot.radius * (slot.heat ? 1 : 0.12 + progress * 0.88);
      this.center.set(slot.x, 0.18, slot.z).project(camera);
      this.edge.set(slot.x + radius, 0.18, slot.z).project(camera).sub(this.center);
      const rx = Math.max(Math.hypot(this.edge.x, this.edge.y) * 0.5, 0.0001);
      this.edge.set(slot.x, 0.18, slot.z + radius).project(camera).sub(this.center);
      const ry = Math.max(Math.hypot(this.edge.x, this.edge.y) * 0.5, 0.0001);
      wave.set(this.center.x * 0.5 + 0.5, this.center.y * 0.5 + 0.5, rx, ry);
      shape.set(slot.strength * Math.sin(progress * Math.PI), progress, slot.heat ? 1 : 0, this.center.z <= 1 ? 1 : 0);
    }
  }

  clear(): void {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].duration = 0;
      this.slots[i].age = 0;
      this.waves[i].set(0, 0, 0, 0);
      this.shapes[i].set(0, 0, 0, 0);
    }
  }

  dispose(): void { this.clear(); }

  private spawn(x: number, z: number, radius: number, strength: number, duration: number, heat: boolean): void {
    if (!this.enabled || !Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(radius)
      || !Number.isFinite(strength) || !Number.isFinite(duration) || radius <= 0 || duration <= 0) return;
    let index = 0;
    let oldest = -1;
    for (let i = 0; i < this.slots.length; i++) {
      const candidate = this.slots[i];
      if (candidate.age >= candidate.duration) { index = i; break; }
      const progress = candidate.age / candidate.duration;
      if (progress > oldest) { oldest = progress; index = i; }
    }
    const slot = this.slots[index];
    slot.x = x; slot.z = z; slot.radius = Math.min(radius, 32);
    slot.strength = Math.max(-0.025, Math.min(strength, 0.025));
    slot.age = 0; slot.duration = Math.min(duration, 30); slot.heat = heat;
  }
}

export const distortionFragment = /* glsl */ `
varying vec2 vUv;
uniform vec4 waves[12];
uniform vec4 shapes[12];
uniform float time;
void main() {
  vec2 offset = vec2(0.0);
  for (int i = 0; i < 12; i++) {
    vec4 wave = waves[i];
    vec4 shape = shapes[i];
    if (wave.z <= 0.0 || wave.w <= 0.0 || shape.w < 0.5) continue;
    vec2 delta = (vUv - wave.xy) / wave.zw;
    float distance = length(delta);
    float band = (distance - 1.0) * 11.0;
    float ring = exp(-band * band);
    vec2 direction = delta / max(distance, 0.01);
    vec2 heat = vec2(sin(delta.y * 13.0 + time * 6.0), cos(delta.x * 11.0 - time * 4.0));
    float envelope = 1.0 - smoothstep(0.3, 1.0, distance);
    offset += mix(direction * ring, heat * envelope * 0.4, shape.z) * shape.x;
  }
  gl_FragColor = vec4(clamp(offset, -0.025, 0.025), 0.0, 1.0);
}`;
