import * as T from 'three';
import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import { ELEMENT_COLORS, UNIT } from './types';

export type PlacementAbility = 'glacier' | 'napalm-charge' | 'tesla-pylon' | 'bulwark';
export type PlacementPreviewPoint = { x: number; y: number; valid: boolean; radius?: number };
/** Simulation coordinates; optional points describe the native twin/triplet augment placements. */
export type PlacementPreviewState = {
  ability: PlacementAbility;
  x: number;
  y: number;
  angle: number;
  valid: boolean;
  reason?: string;
  points?: readonly PlacementPreviewPoint[];
  pointCount?: number;
};

const vertex = `attribute vec4 preview;attribute vec3 tint;
varying vec2 local;varying vec4 data;varying vec3 color;
void main(){local=uv*2.-1.;data=preview;color=tint;
gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`;
const fragment = `varying vec2 local;varying vec4 data;varying vec3 color;
void main(){
 vec2 p=local;float edge;float along;
 if(data.x<.5){float r=length(p);if(r>1.)discard;edge=1.-smoothstep(.965,1.,r);edge=1.-edge;along=atan(p.y,p.x)/6.283185;}
 else{float r=max(abs(p.x),abs(p.y));edge=smoothstep(.88,.98,r);along=(p.x+p.y)*.25;}
 float dash=step(.32,fract(along*data.z));
 float invalid=1.-data.y;
 // Blocked placement has interrupted crossbars as well as a warm boundary,
 // preserving a shape cue independently of color.
 float cross=(1.-smoothstep(.018,.045,abs(abs(p.x)-abs(p.y))))*step(.5,fract((p.x-p.y)*6.));
 float mark=max(edge*dash,cross*invalid*.72);
 float backing=max(edge,cross*invalid)*.8;
 if(backing<.01)discard;
 gl_FragColor=vec4(mix(vec3(.012,.022,.028),color,mark),max(mark,backing)*.9);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

/** One pooled draw, prepared with the other ability materials; no textures or per-press GPU work. */
export class PlacementPreview {
  readonly mesh: T.InstancedMesh;
  private readonly data = new T.InstancedBufferAttribute(new Float32Array(12), 4).setUsage(T.DynamicDrawUsage);
  private readonly tint = new T.InstancedBufferAttribute(new Float32Array(9), 3).setUsage(T.DynamicDrawUsage);
  private readonly dummy = new T.Object3D();
  private readonly color = new T.Color();
  private state: PlacementPreviewState | null = null;
  private disposed = false;

  constructor(root: T.Object3D) {
    const geometry = new T.PlaneGeometry(2, 2);
    geometry.setAttribute('preview', this.data);
    geometry.setAttribute('tint', this.tint);
    const material = new T.ShaderMaterial({
      name: 'ability-placement-preview', vertexShader: vertex, fragmentShader: fragment,
      transparent: true, depthTest: false, depthWrite: false, side: T.DoubleSide,
    });
    material.forceSinglePass = true;
    this.mesh = new T.InstancedMesh(geometry, material, 3);
    this.mesh.name = 'ability-placement-preview';
    this.mesh.renderOrder = 4;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.mesh.count = 0;
    root.add(this.mesh);
  }

  /** Copy/update the caller's pooled state; invalid numeric input clears the preview. */
  set(value: PlacementPreviewState | null): void {
    if (this.disposed) return;
    this.state = value && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.angle) ? value : null;
    this.update(0, false, true);
  }

  /** The footprint is deliberately still under reduced motion and while aiming. */
  update(_time: number, _reducedMotion: boolean, visible = true): void {
    const state = this.state;
    this.mesh.count = 0;
    if (this.disposed || !state || !visible) return;
    const definition = ABILITY_CATALOG[state.ability], shape = definition?.shape;
    if (!shape || shape.kind !== 'circle' && shape.kind !== 'wall') return;
    const count = Math.min(3, Math.max(1, state.pointCount ?? state.points?.length ?? 1));
    for (let i = 0; i < count; i++) {
      const point = state.points?.[i] ?? state;
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
      const valid = point.valid;
      const radius = shape.kind === 'circle' ? (state.ability === 'tesla-pylon' ? 18 : (point as PlacementPreviewPoint).radius ?? shape.radius) / UNIT : 0;
      this.dummy.position.set(point.x / UNIT, .042, point.y / UNIT);
      // Walls are centered at the target and perpendicular to the native facing.
      this.dummy.rotation.set(-Math.PI / 2, 0, -state.angle - Math.PI / 2);
      this.dummy.scale.set(shape.kind === 'wall' ? shape.length / UNIT / 2 : radius,
        shape.kind === 'wall' ? shape.thickness / UNIT / 2 : radius, 1);
      this.dummy.updateMatrix();
      const slot = this.mesh.count++;
      this.mesh.setMatrixAt(slot, this.dummy.matrix);
      this.data.setXYZW(slot, shape.kind === 'wall' ? 1 : 0, +valid, state.ability === 'tesla-pylon' ? 12 : 28, 1);
      this.color.set(valid ? ELEMENT_COLORS[definition.element] : 0xff9b72);
      this.tint.setXYZ(slot, this.color.r, this.color.g, this.color.b);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.data.needsUpdate = this.tint.needsUpdate = true;
  }

  clear(): void { this.state = null; this.mesh.count = 0; }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear(); this.mesh.geometry.dispose(); (this.mesh.material as T.Material).dispose(); this.mesh.removeFromParent();
  }
}
