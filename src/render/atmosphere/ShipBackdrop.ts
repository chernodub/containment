import * as T from 'three';
import type { GraphicsTier } from '../FrameBudget';
import type { ShipEnvironment } from '../ShipEnvironments';
import { getEnvironmentMood } from '../lighting/EnvironmentMoods';

/** Fixed geometry budgets independent of room size or camera movement. */
export const SHIP_BACKDROP_CAPS = Object.freeze({ plates: 144, struts: 48 });

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vTint;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vTint = instanceColor;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec4 footprint;
  uniform vec3 accent;
  uniform float detail;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vTint;
  void main() {
    vec2 outside = max(max(footprint.xy - vWorld.xz, vWorld.xz - footprint.zw), vec2(0.0));
    float distance = length(outside);
    float fade = 1.0 - smoothstep(8.0, 22.0, distance);
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float bevel = smoothstep(.0, .026, edge);
    float seam = 1.0 - smoothstep(.026, .034, edge);
    float top = max(0.0, vNormal.y);
    float illumination = .5 + top * .5 + max(0.0, vNormal.z) * .12;
    float grooves = 1.0 - smoothstep(.012, .025, abs(fract(vWorld.x * .48 + vWorld.z * .16) - .5));
    vec3 steel = vTint * illumination * (.62 + bevel * .38) * (1.0 - grooves * .12 * detail);
    // A dim utility-color seam gives distant structure a room-specific hue without becoming a route cue.
    steel += accent * seam * .0036 * detail;
    steel *= 1.0 - smoothstep(4.0, 20.0, distance) * .84;
    gl_FragColor = vec4(steel, fade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function material(detail: number): T.ShaderMaterial {
  return new T.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true,
    uniforms: { footprint: { value: new T.Vector4() }, accent: { value: new T.Color() }, detail: { value: detail } },
    vertexShader, fragmentShader,
  });
}

/** Recessed ship structure continues beyond the playable deck, with physical camera parallax. */
export class ShipBackdrop {
  readonly root = new T.Group();
  readonly plates: T.InstancedMesh<T.BoxGeometry, T.ShaderMaterial>;
  readonly struts: T.InstancedMesh<T.BoxGeometry, T.ShaderMaterial>;
  readonly footprint = new T.Box3();
  private readonly dummy = new T.Object3D();
  private readonly tint = new T.Color();
  private tier: GraphicsTier = 'high';
  private disposed = false;

  constructor(scene?: T.Scene) {
    this.root.name = 'ship-subdeck-backdrop';
    this.plates = new T.InstancedMesh(new T.BoxGeometry(), material(1), SHIP_BACKDROP_CAPS.plates);
    this.struts = new T.InstancedMesh(new T.BoxGeometry(), material(.65), SHIP_BACKDROP_CAPS.struts);
    this.plates.name = 'subdeck-layered-plates';
    this.struts.name = 'subdeck-gutters-struts';
    this.plates.count = this.struts.count = 0;
    this.plates.frustumCulled = this.struts.frustumCulled = false;
    this.plates.renderOrder = -2;
    this.struts.renderOrder = -1;
    // Allocate colors now: shader topology cannot change when a later room first fills a batch.
    this.plates.setColorAt(0, this.tint);
    this.struts.setColorAt(0, this.tint);
    this.root.add(this.plates, this.struts);
    scene?.add(this.root);
  }

  /** Prefer actual deck mesh bounds, including polygonal rooms with a larger legacy camera envelope. */
  loadRoom(world: T.Object3D, width: number, height: number, environment: ShipEnvironment = 'cryogenics'): void {
    if (this.disposed) return;
    world.updateWorldMatrix(true, true);
    this.footprint.makeEmpty();
    const bounds = new T.Box3();
    world.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (!materials.some(value => value.name === 'environment-floor' || value.name === 'painted-steel-deck')) return;
      object.geometry.computeBoundingBox();
      if (object.geometry.boundingBox) this.footprint.union(bounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld));
    });
    if (this.footprint.isEmpty()) this.footprint.setFromObject(world);
    if (this.footprint.isEmpty() || !Number.isFinite(this.footprint.min.x) || this.footprint.max.x - this.footprint.min.x < 1) {
      this.footprint.min.set(0, -.34, 0);
      this.footprint.max.set(Math.max(1, Number.isFinite(width) ? width : 1), 0, Math.max(1, Number.isFinite(height) ? height : 1));
    }
    const minX = this.footprint.min.x, minZ = this.footprint.min.z;
    const maxX = this.footprint.max.x, maxZ = this.footprint.max.z;
    const deckWidth = maxX - minX, deckHeight = maxZ - minZ;
    const mood = getEnvironmentMood(environment);
    for (const mesh of [this.plates, this.struts]) {
      mesh.material.uniforms.footprint.value.set(minX, minZ, maxX, maxZ);
      mesh.material.uniforms.accent.value.setHex(mood.practical.color);
    }
    const tileWidth = (deckWidth + 48) / 12, tileHeight = (deckHeight + 48) / 12;
    this.plates.count = 0;
    for (let z = 0; z < 12; z++) for (let x = 0; x < 12; x++) {
      const index = z * 12 + x;
      const variation = .5 + .5 * Math.sin(index * 7.13);
      this.place(this.plates, minX - 24 + (x + .5) * tileWidth, -1.55 - variation * .45,
        minZ - 24 + (z + .5) * tileHeight, tileWidth - .055, .22 + variation * .16, tileHeight - .055,
        0, .84 + variation * .32);
    }
    this.struts.count = 0;
    // Recessed utility gutters flank the deck, with a second layer of transverse support arms.
    for (let side = 0; side < 4; side++) {
      const vertical = side < 2;
      const along = vertical ? deckHeight : deckWidth;
      for (let lane = 0; lane < 4; lane++) {
        const out = 1.15 + lane * 2.3;
        const x = vertical ? (side === 0 ? minX - out : maxX + out) : (minX + maxX) / 2;
        const z = vertical ? (minZ + maxZ) / 2 : (side === 2 ? minZ - out : maxZ + out);
        this.place(this.struts, x, -1.18 - lane * .35, z,
          vertical ? .25 : along + 4, .22, vertical ? along + 4 : .25, 0, 1.25 - lane * .2);
      }
      for (let segment = 0; segment < 8; segment++) {
        const offset = (segment + .5) / 8 * along;
        const x = vertical ? (side === 0 ? minX - 2.6 : maxX + 2.6) : minX + offset;
        const z = vertical ? minZ + offset : (side === 2 ? minZ - 2.6 : maxZ + 2.6);
        this.place(this.struts, x, -1.75 - segment % 2 * .18, z,
          5.4, .28, .32, vertical ? 0 : Math.PI / 2, .95 + (segment % 3) * .12);
      }
    }
    for (const mesh of [this.plates, this.struts]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    }
    this.setQuality(this.tier);
  }

  /** Low keeps one structural draw instead of returning to a hard black void. */
  setQuality(tier: GraphicsTier): void {
    this.tier = tier;
    this.root.visible = !this.disposed;
    this.struts.visible = !this.disposed && tier === 'high';
  }

  /** Real height offsets provide parallax with camera movement; no artificial screen-space drift. */
  update(_dt: number, _focus?: T.Vector3): void {}

  /** Compile both materials even while Low hides support beams or before a room has populated. */
  prepare(): () => void {
    const visible = this.root.visible, strutsVisible = this.struts.visible;
    const plates = this.plates.count, struts = this.struts.count;
    if (!this.disposed) {
      this.root.visible = this.struts.visible = true;
      this.plates.count = Math.max(1, plates);
      this.struts.count = Math.max(1, struts);
    }
    return () => {
      if (this.disposed) return;
      this.root.visible = visible;
      this.struts.visible = strutsVisible;
      this.plates.count = plates;
      this.struts.count = struts;
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const mesh of [this.plates, this.struts]) { mesh.geometry.dispose(); mesh.material.dispose(); }
    this.root.visible = false;
    this.root.clear();
    this.root.removeFromParent();
  }

  private place(mesh: T.InstancedMesh, x: number, y: number, z: number, width: number, thickness: number, depth: number, angle: number, brightness: number): void {
    this.dummy.position.set(x, y, z);
    this.dummy.rotation.set(0, angle, 0);
    this.dummy.scale.set(width, thickness, depth);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(mesh.count, this.dummy.matrix);
    // Linear values give a subdued but visible blue/teal steel beneath the lit walkable deck.
    this.tint.setRGB(.012 * brightness * .65, .018 * brightness * .65, .021 * brightness * .65);
    mesh.setColorAt(mesh.count++, this.tint);
  }
}
