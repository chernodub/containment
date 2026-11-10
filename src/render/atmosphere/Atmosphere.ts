import * as T from 'three';
import type { GraphicsTier } from '../FrameBudget';
import type { GraphicsOptions } from '../graphicsOptions';
import type { ShipEnvironment } from '../ShipEnvironments';
import { getEnvironmentMood } from '../lighting/EnvironmentMoods';

type Profile = Readonly<{
  motes: number; size: number; opacity: number; rise: number; kind: number;
  fog: number; fogOpacity: number; fogSize: number;
  plumes: number; plumeOpacity: number; heat: number;
}>;

/** Sparse, local layers leave the deck, silhouettes and telegraphs readable. */
export const ATMOSPHERE_PROFILES: Readonly<Record<ShipEnvironment, Profile>> = Object.freeze({
  cryogenics: { motes: 44, size: .028, opacity: .13, rise: -.035, kind: 0, fog: 10, fogOpacity: .032, fogSize: 2.1, plumes: 0, plumeOpacity: 0, heat: 0 },
  habitation: { motes: 64, size: .022, opacity: .16, rise: -.012, kind: 0, fog: 0, fogOpacity: 0, fogSize: 1, plumes: 0, plumeOpacity: 0, heat: 0 },
  security: { motes: 24, size: .018, opacity: .12, rise: -.008, kind: 0, fog: 0, fogOpacity: 0, fogSize: 1, plumes: 0, plumeOpacity: 0, heat: 0 },
  cargo: { motes: 88, size: .027, opacity: .18, rise: -.018, kind: 0, fog: 4, fogOpacity: .014, fogSize: 1.7, plumes: 0, plumeOpacity: 0, heat: 0 },
  communications: { motes: 28, size: .019, opacity: .11, rise: -.006, kind: 0, fog: 2, fogOpacity: .012, fogSize: 1.3, plumes: 0, plumeOpacity: 0, heat: 0 },
  engineering: { motes: 28, size: .021, opacity: .15, rise: .065, kind: 2, fog: 3, fogOpacity: .018, fogSize: 1.6, plumes: 6, plumeOpacity: .045, heat: .2 },
  maintenance: { motes: 24, size: .025, opacity: .1, rise: -.04, kind: 0, fog: 8, fogOpacity: .027, fogSize: 1.7, plumes: 4, plumeOpacity: .027, heat: 0 },
  infested: { motes: 72, size: .045, opacity: .18, rise: .028, kind: 1, fog: 6, fogOpacity: .023, fogSize: 1.8, plumes: 0, plumeOpacity: 0, heat: 0 },
  containment: { motes: 36, size: .019, opacity: .13, rise: .008, kind: 0, fog: 4, fogOpacity: .018, fogSize: 1.5, plumes: 0, plumeOpacity: 0, heat: 0 },
  reactor: { motes: 80, size: .027, opacity: .25, rise: .11, kind: 2, fog: 3, fogOpacity: .015, fogSize: 1.6, plumes: 6, plumeOpacity: .018, heat: .55 },
});

export type AtmosphereFixture = Readonly<{
  position: T.Vector3;
  color: T.Color;
  visible?: boolean;
  intensity?: number;
}>;

export const ATMOSPHERE_CAPS = Object.freeze({ motes: 96, fog: 12, plumes: 6, shafts: 4 });
type Batch = T.Mesh<T.InstancedBufferGeometry, T.ShaderMaterial>;

const vertexShader = /* glsl */ `
  attribute vec3 origin;
  attribute vec4 variation;
  uniform float time;
  uniform float rise;
  uniform float layer;
  uniform float heat;
  varying vec2 vUv;
  varying vec2 vSeed;
  varying float vFade;
  void main() {
    vUv = uv;
    vSeed = variation.yz;
    float phase = variation.y * 6.2831853;
    vec3 p = origin;
    float t = time;
    vFade = 1.0;
    if (layer < 0.5) {
      p.y = .25 + fract((origin.y - .25) / 2.8 + t * rise) * 2.8;
      p.x += sin(t * .17 + phase) * .16;
      p.z += cos(t * .13 + phase) * .12;
      vFade = smoothstep(.25, .65, p.y) * (1.0 - smoothstep(2.6, 3.05, p.y));
    } else if (layer > 1.5) {
      float cycle = fract(t * .075 + variation.y);
      float burst = smoothstep(.02, .16, cycle) * (1.0 - smoothstep(.35, .8, cycle));
      p.y += cycle * 1.2;
      p.x += sin(t * .65 + phase) * (.1 + heat * .08);
      vFade = burst;
    } else {
      p.x += sin(t * .09 + phase) * .18;
      p.z += cos(t * .07 + phase) * .14;
    }
    vec2 offset = position.xy * variation.x;
    if (layer > .5 && layer < 1.5) {
      p.xz += offset * vec2(1.0, .55);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    } else {
      vec4 view = modelViewMatrix * vec4(p, 1.0);
      view.xy += offset * (layer > 1.5 ? vec2(.62, 1.9) : vec2(1.0));
      gl_Position = projectionMatrix * view;
    }
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 tint;
  uniform float opacity;
  uniform float layer;
  uniform float kind;
  uniform float heat;
  uniform float time;
  varying vec2 vUv;
  varying vec2 vSeed;
  varying float vFade;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = dot(p, p);
    float alpha = pow(max(0.0, 1.0 - r), layer < .5 ? 2.0 : 3.0);
    if (layer > .5) {
      float folds = sin(p.x * 5.0 + vSeed.x * 20.0 + time * .13)
        * sin(p.y * 6.0 + vSeed.y * 20.0 - time * .09);
      alpha *= .72 + folds * .28;
      if (layer > 1.5) alpha *= 1.0 - heat * .65;
    } else if (kind > .5 && kind < 1.5) {
      alpha *= .7 + .3 * cos(r * 12.0);
    }
    gl_FragColor = vec4(tint, alpha * opacity * vFade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function batch(name: string, capacity: number, layer: number): Batch {
  const geometry = new T.InstancedBufferGeometry();
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('position', new T.Float32BufferAttribute([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0], 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geometry.setAttribute('origin', new T.InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
  geometry.setAttribute('variation', new T.InstancedBufferAttribute(new Float32Array(capacity * 4), 4));
  geometry.instanceCount = 0;
  const material = new T.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide,
    uniforms: {
      time: { value: 0 }, rise: { value: 0 }, layer: { value: layer }, kind: { value: 0 },
      tint: { value: new T.Color() }, opacity: { value: 0 }, heat: { value: 0 },
    },
    vertexShader, fragmentShader,
  });
  const mesh = new T.Mesh(geometry, material);
  mesh.name = name;
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return mesh;
}

function random(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Four fixed GPU batches; all drift is shader-driven, with no frame allocations. */
export class Atmosphere {
  readonly root = new T.Group();
  readonly motes = batch('ambient-motes', ATMOSPHERE_CAPS.motes, 0);
  readonly fog = batch('local-ground-mist', ATMOSPHERE_CAPS.fog, 1);
  readonly plumes = batch('vent-steam-heat', ATMOSPHERE_CAPS.plumes, 2);
  readonly shafts: T.InstancedMesh<T.CylinderGeometry, T.ShaderMaterial>;
  private readonly batches = [this.motes, this.fog, this.plumes];
  private readonly dummy = new T.Object3D();
  private time = 0;
  private reducedMotion = false;
  private enabled = true;
  private disposed = false;

  constructor(scene?: T.Scene) {
    this.root.name = 'room-atmosphere';
    const geometry = new T.CylinderGeometry(0, 1, 1, 12, 1, true);
    geometry.translate(0, -.5, 0);
    geometry.setAttribute('fixtureTint', new T.InstancedBufferAttribute(new Float32Array(ATMOSPHERE_CAPS.shafts * 3), 3));
    const material = new T.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { strength: { value: .012 } },
      vertexShader: 'attribute vec3 fixtureTint;varying vec2 vUv;varying vec3 vTint;void main(){vUv=uv;vTint=fixtureTint;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform float strength;varying vec2 vUv;varying vec3 vTint;void main(){float a=smoothstep(0.0,.25,vUv.y)*(1.0-smoothstep(.8,1.0,vUv.y))*pow(vUv.y,.65);gl_FragColor=vec4(vTint,a*strength);}',
    });
    this.shafts = new T.InstancedMesh(geometry, material, ATMOSPHERE_CAPS.shafts);
    this.shafts.name = 'practical-light-shafts';
    this.shafts.frustumCulled = false;
    this.shafts.renderOrder = 2;
    this.shafts.count = 0;
    this.root.add(...this.batches, this.shafts);
    scene?.add(this.root);
  }

  /** Reset room-local seeds and anchor scattering cones to actual authored light origins. */
  loadRoom(environment: ShipEnvironment = 'cryogenics', width: number, height: number, fixtures: readonly AtmosphereFixture[] = []): void {
    if (this.disposed) return;
    const profile = ATMOSPHERE_PROFILES[environment], mood = getEnvironmentMood(environment);
    const roomWidth = Math.max(1, Number.isFinite(width) ? width : 1);
    const roomHeight = Math.max(1, Number.isFinite(height) ? height : 1);
    this.time = 0;
    this.populate(this.motes, profile.motes, roomWidth, roomHeight, profile.size, 0);
    this.populate(this.fog, profile.fog, roomWidth, roomHeight, profile.fogSize, 1);
    this.populate(this.plumes, profile.plumes, roomWidth, roomHeight, .6, 2);
    for (const mesh of this.batches) {
      const uniforms = mesh.material.uniforms;
      uniforms.time.value = 0;
      uniforms.rise.value = profile.rise;
      uniforms.kind.value = profile.kind;
      uniforms.heat.value = profile.heat;
      uniforms.tint.value.setHex(mesh === this.fog ? mood.fog.color : mood.practical.color);
      uniforms.opacity.value = mesh === this.motes ? profile.opacity : mesh === this.fog ? profile.fogOpacity : profile.plumeOpacity;
      mesh.visible = mesh.geometry.instanceCount > 0;
    }
    this.shafts.count = 0;
    const colors = this.shafts.geometry.getAttribute('fixtureTint') as T.InstancedBufferAttribute;
    for (const fixture of fixtures) {
      if (this.shafts.count === ATMOSPHERE_CAPS.shafts) break;
      if (fixture.visible === false || fixture.intensity === 0 || fixture.position.y < .65) continue;
      const i = this.shafts.count++, length = Math.min(3.4, fixture.position.y - .06);
      this.dummy.position.copy(fixture.position);
      this.dummy.scale.set(length * .25, length, length * .25);
      this.dummy.updateMatrix();
      this.shafts.setMatrixAt(i, this.dummy.matrix);
      colors.setXYZ(i, fixture.color.r, fixture.color.g, fixture.color.b);
    }
    colors.needsUpdate = true;
    this.shafts.instanceMatrix.needsUpdate = true;
    this.shafts.visible = this.shafts.count > 0;
  }

  /** Low always skips both rendering and animation, even with a persisted atmosphere override. */
  setOptions(options: Pick<GraphicsOptions, 'atmosphere'>, tier: GraphicsTier, reducedMotion = false): void {
    this.enabled = !this.disposed && tier === 'high' && options.atmosphere;
    this.reducedMotion = reducedMotion;
    this.root.visible = this.enabled;
  }

  /** Camera supplies physical world/view parallax; reduced motion holds all ambient drift still. */
  update(dt: number, _camera: T.Camera): void {
    if (!this.enabled || this.disposed || this.reducedMotion || !Number.isFinite(dt) || dt <= 0) return;
    this.time += Math.min(dt, .1);
    for (let i = 0; i < this.batches.length; i++) this.batches[i].material.uniforms.time.value = this.time;
  }

  /** Expose every shader for compileAsync, including currently empty room layers; restore in finally. */
  prepare(): () => void {
    const rootVisible = this.root.visible;
    const visible = this.root.children.map(child => child.visible);
    const counts = this.batches.map(mesh => mesh.geometry.instanceCount);
    const shaftCount = this.shafts.count;
    if (!this.disposed) {
      this.root.visible = true;
      for (const mesh of this.batches) { mesh.visible = true; mesh.geometry.instanceCount = Math.max(1, mesh.geometry.instanceCount); }
      this.shafts.visible = true;
      this.shafts.count = Math.max(1, this.shafts.count);
    }
    return () => {
      if (this.disposed) return;
      this.root.visible = rootVisible;
      for (let i = 0; i < this.root.children.length; i++) this.root.children[i].visible = visible[i];
      for (let i = 0; i < this.batches.length; i++) this.batches[i].geometry.instanceCount = counts[i];
      this.shafts.count = shaftCount;
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.enabled = false;
    for (const mesh of this.batches) { mesh.geometry.dispose(); mesh.material.dispose(); }
    this.shafts.geometry.dispose();
    this.shafts.material.dispose();
    this.root.visible = false;
    this.root.clear();
    this.root.removeFromParent();
  }

  private populate(mesh: Batch, count: number, width: number, height: number, size: number, layer: number): void {
    const origins = mesh.geometry.getAttribute('origin') as T.InstancedBufferAttribute;
    const variations = mesh.geometry.getAttribute('variation') as T.InstancedBufferAttribute;
    mesh.geometry.instanceCount = count;
    for (let i = 0; i < count; i++) {
      let x = .4 + random(i, 1 + layer) * Math.max(.2, width - .8);
      let z = .4 + random(i, 9 + layer) * Math.max(.2, height - .8);
      // Mist and vents stay by bulkheads; no full-screen veil across the combat lane.
      if (layer > 0) {
        if (i % 4 === 0) x = .55;
        else if (i % 4 === 1) x = width - .55;
        else if (i % 4 === 2) z = .55;
        else z = height - .55;
      }
      origins.setXYZ(i, x, layer === 0 ? .25 + random(i, 3) * 2.8 : layer === 1 ? .06 + random(i, 7) * .09 : .35, z);
      variations.setXYZW(i, size * (.75 + random(i, 5) * .5), random(i, 11), random(i, 13), 0);
    }
    origins.needsUpdate = true;
    variations.needsUpdate = true;
  }
}
