import * as T from 'three';
import type { DepthGame } from '../../DepthGame';
import type { StatusActor } from './ElementKit';
import type { Telegraph } from '../vfx/TelegraphBatch';

/** Optional presentation accessor. Coordinates are renderer metres, never simulation units. */
export interface HostilePrioritySource {
  forEachShooterPriority?(visit: (x:number,y:number,z:number,angle:number)=>void): void;
  forEachHostilePriority?(visit: (shape: Readonly<Telegraph>) => void): void;
}

// Distances are measured in mask texels. Interpolate distance before evaluating coverage.
// Capping the green-channel distance here yields about 70% coverage at its smoothstep.
const SHOOTER_DISTANCE_CAP = .082;
// The shared danger channel ramps to 65% suppression around a committed limb.
const WINDUP_DISTANCE_CAP = .061;
const DISTANCE_RANGE = 1.5;

/** Shared shader hook; all materials are patched before renderer preparation. */
export function bindPriorityMask(material: T.ShaderMaterial, texture: T.Texture, attribute?: string, hostileOnly = false): void {
  if (material.uniforms.abilityPriorityMap) return;
  material.uniforms.abilityPriorityMap = { value: texture };
  material.uniforms.diagnosticPrioritySampling = { value: true };
  material.vertexShader = `varying vec4 priorityClip;${attribute ? `attribute float ${attribute};varying float priorityWeight;` : ''}\n` + material.vertexShader;
  material.vertexShader = material.vertexShader.replace('void main(){', `void main(){${attribute ? `priorityWeight=${attribute};` : ''}`)
    .replace(/gl_Position\s*=\s*([^;]+);/, '$&priorityClip=gl_Position;');
  material.fragmentShader = `uniform sampler2D abilityPriorityMap;uniform bool diagnosticPrioritySampling;varying vec4 priorityClip;${attribute ? 'varying float priorityWeight;' : ''}\n#define HAS_ABILITY_PRIORITY_MASK\nvec4 abilityPriority(){
 if(!diagnosticPrioritySampling)return vec4(0.);
 vec4 distanceSample=texture2D(abilityPriorityMap,priorityClip.xy/max(.001,priorityClip.w)*.5+.5);
 // Red uses a 0.8-texel fade (12 px at 1080p). Warnings and marine retain their previous fade.
 return smoothstep(vec4(.366667,.4,.4,.4),vec4(.633333,.6,.6,.6),distanceSample);
}\n` + material.fragmentShader;
  material.fragmentShader = material.fragmentShader.replace('void main(){', 'void main(){vec4 prioritySample=abilityPriority();')
    .replace('#include <tonemapping_fragment>', `
 float priority=${hostileOnly ? '0.' : 'max(prioritySample.r*.72,prioritySample.a*.97)'};
 gl_FragColor.a=min(gl_FragColor.a,.07+.93*(1.-prioritySample.b));
 gl_FragColor.a*=1.-prioritySample.g;
 gl_FragColor.a*=1.-priority*${attribute ? 'priorityWeight' : '1.'};
 if(gl_FragColor.a<.004)discard;
 #include <tonemapping_fragment>`);
}

/** 128×72 screen mask. CPU rasterization reuses storage; no extra draw or render target. */
export class AbilityPriorityMask {
  readonly width = 128;
  readonly height = 72;
  readonly pixels = new Uint8Array(this.width * this.height * 4);
  readonly texture = new T.DataTexture(this.pixels, this.width, this.height, T.RGBAFormat);
  private readonly raster = new Uint8Array(this.pixels.length);
  private readonly edgeDistanceSquared = new Float64Array(this.width);
  private readonly crossings: number[] = [];
  private readonly polygon = new Float32Array(68);
  private hasDanger = false;
  private hasMask = false;
  private readonly point = new T.Vector3();
  private camera?: T.Camera;
  private disposed = false;
  private readonly shooter = (x:number,y:number,z:number,angle:number) => {
    this.segment(x,y,z,x+Math.cos(angle)*1.44,y,z+Math.sin(angle)*1.44,.6,1,SHOOTER_DISTANCE_CAP);
    this.segment(x,y,z,x,y,z,.22,1);
  };
  private readonly visit = (shape: Readonly<Telegraph>) => this.shape(shape);

  constructor() {
    this.texture.name = 'ability-priority-mask';
    this.texture.minFilter = this.texture.magFilter = T.LinearFilter;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
  }

  update(game: DepthGame | undefined, camera: T.Camera | undefined, source?: HostilePrioritySource, actorFor?: (id: number) => StatusActor | undefined): void {
    this.camera = camera;
    if (!game || !camera) {this.clear();return;}
    this.raster.fill(0);
    this.hasDanger = false;
    const p = game.player;
    this.segment(p.x / 32, .62 * .35, p.y / 32, p.x / 32, 2.05, p.y / 32, .62, 3);
    this.shape({shape:'circle',x:p.x/32,z:p.y/32,radius:1.5},2);
    for (const e of game.enemies.snapshot.enemies) {
      if (e.health <= 0) continue;
      // Models are fitted to their family collision envelopes. The snapshot radius
      // already carries the elite scale and any guardian-specific body radius.
      const actor = actorFor?.(e.id);
      const height = actor?.height ?? (e.type === 'crawler' ? .65 : e.type === 'brute' || e.type === 'carrier' ? 1.65 : 1.15);
      this.actor(e.x / 32, e.y / 32, e.radius / 32 * .78, height);
      const melee = e.meleePhase !== 'approach';
      if (melee || e.windupMs > 0 || e.chargeMs > 0) {
        const x = e.x / 32, z = e.y / 32;
        const charge = e.pendingAttack === 'charge' || e.chargeMs > 0;
        const angle = melee ? e.meleeAngle : Math.atan2(charge ? e.lockY : e.lockY - e.y, charge ? e.lockX : e.lockX - e.x);
        const reach = e.radius / 32 + .38;
        this.segment(x, .05, z, x, height * .78, z, .97, 1, WINDUP_DISTANCE_CAP);
        this.segment(x, height * .55, z, x + Math.cos(angle) * reach, height * .42,
          z + Math.sin(angle) * reach, .94, 1, WINDUP_DISTANCE_CAP);
      }
      if (e.type === 'spitter' && e.pendingAttack === 'spit' && e.windupMs > 0)
        this.segment(e.x/32,0,e.y/32,e.x/32,height,e.y/32,.6,1,SHOOTER_DISTANCE_CAP);
      // Snapshot fallback also works while the world renderer evolves its warning accessor.
      if (!source?.forEachHostilePriority && e.windupMs > 0 && e.pendingAttack) {
        const tx = e.pendingAttack === 'charge' ? e.x + e.lockX : e.lockX;
        const tz = e.pendingAttack === 'charge' ? e.y + e.lockY : e.lockY;
        this.segment(e.x / 32, .07, e.y / 32, tx / 32, .07, tz / 32, e.pendingAttack === 'charge' ? .8 : .32);
      }
    }
    const q = game.boss?.snapshot;
    if (q?.active && !q.defeated) {
      const actor = actorFor?.(-1);
      this.actor(q.x / 32, q.y / 32, 2.8, actor?.height ?? 4.5);
    }
    if (q?.pendingTelegraph) {
      const t = q.pendingTelegraph;
      this.shape({shape:'circle', x:t.targetX / 32, z:t.targetY / 32, radius:t.radius / 32});
    }
    // Persistent hostile ground remains dangerous after its wind-up retires.
    // Friendly weather and placement previews must yield to the pool teeth.
    for (const pool of game.pools ?? []) if (pool.life > 0)
      this.shape({shape:'circle', x:pool.x / 32, z:pool.y / 32, radius:pool.radius / 32});
    for (const b of game.bullets) {
      if (b.kind !== 'hazard') continue;
      const x = b.x / 32, z = b.y / 32, a = b.request.angle;
      this.segment(x, .65, z, x, .65, z, 1, 1, .01);
      this.segment(x - Math.cos(a) * .6, .65, z - Math.sin(a) * .6,
        x + Math.cos(a) * .35, .65, z + Math.sin(a) * .35, .35);
    }
    source?.forEachHostilePriority?.(this.visit);
    source?.forEachShooterPriority?.(this.shooter);
    this.hasMask=true;
    // Camera and actor motion can quantize to the same mask, including paused frames.
    for(let i=0;i<this.raster.length;i++){
      if(this.raster[i]===this.pixels[i])continue;
      this.pixels.set(this.raster);
      this.texture.needsUpdate=true;
      break;
    }
  }

  /** Stamp a projected actor capsule including its head, rather than only its ground circle. */
  private actor(x: number, z: number, radius: number, height: number): void {
    this.segment(x, 0, z, x, height, z, radius, 0);
  }

  private segment(x: number, y: number, z: number, tx: number, ty: number, tz: number, radius: number, channel = 1, distanceCap = DISTANCE_RANGE): void {
    this.point.set(x, y, z).project(this.camera!);
    let px = (this.point.x * .5 + .5) * this.width, py = (this.point.y * .5 + .5) * this.height;
    this.point.set(x + radius, y, z).project(this.camera!);
    const projectedRadius = Math.abs((this.point.x * .5 + .5) * this.width - px);
    this.point.set(tx, ty, tz).project(this.camera!);
    let dx = (this.point.x * .5 + .5) * this.width - px;
    let dy = (this.point.y * .5 + .5) * this.height - py;
    // Inset the centreline so the round caps end at the body bounds.
    // The added 0.93 texels include the 8 px margin and half the 12 px fade.
    const r = channel === 0 ? projectedRadius + .93 : Math.max(1.1, projectedRadius) + .35;
    if (channel === 0) {
      const inset = Math.min(.5, projectedRadius / Math.max(1e-6, Math.hypot(dx, dy)));
      px += dx * inset;
      py += dy * inset;
      dx *= 1 - 2 * inset;
      dy *= 1 - 2 * inset;
    }
    const inverseLengthSquared = 1 / Math.max(1e-6, dx * dx + dy * dy);
    const extent = r + DISTANCE_RANGE;
    const x0 = Math.max(0, Math.floor(px + Math.min(0, dx) - extent));
    const x1 = Math.min(this.width, Math.ceil(px + Math.max(0, dx) + extent));
    const y0 = Math.max(0, Math.floor(py + Math.min(0, dy) - extent));
    const y1 = Math.min(this.height, Math.ceil(py + Math.max(0, dy) + extent));
    for (let row = y0; row < y1; row++) {
      const ry = row + .5 - py;
      for (let column = x0; column < x1; column++) {
        const rx = column + .5 - px;
        const t = Math.max(0, Math.min(1, (rx * dx + ry * dy) * inverseLengthSquared));
        this.writeDistance(column, row, channel, Math.min(distanceCap, r - Math.sqrt((rx - dx * t) ** 2 + (ry - dy * t) ** 2)));
      }
    }
  }

  private writeDistance(x: number, y: number, channel: number, distance: number): void {
    const index = (y * this.width + x) * 4 + channel;
    const value = Math.min(255, Math.round(127.5 * (1 + distance / DISTANCE_RANGE)));
    if (value <= this.raster[index]) return;
    this.raster[index] = value;
    if (channel === 1 && value >= 128) this.hasDanger = true;
  }

  /** Project the native ground contour, then fill scanlines in the existing small mask. */
  private shape(s: Readonly<Telegraph>, channel = 1): void {
    const camera = this.camera;
    if (!camera) return;
    const lane = s.shape === 'line' || s.shape === 'wall';
    const sector = s.shape === 'cone';
    const radius = lane ? (s.width ?? 0) / 2 : s.radius ?? 0;
    if (radius <= 0) return;
    const heading = s.angle ?? 0;
    const span = sector ? s.arc ?? Math.PI : 2 * Math.PI;
    const length = lane ? s.length ?? 0 : 0;
    const count = sector ? 34 : channel === 2 ? 16 : 32;
    let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity;
    for (let i = 0; i < count; i++) {
      const angle = lane ? heading - Math.PI / 2 + (i % 16) * Math.PI / 15 + (i >= 16 ? Math.PI : 0)
        : heading - span / 2 + (sector ? (i - 1) * span / 32 : i * span / count);
      const reach = sector && i === 0 ? 0 : radius;
      const end = lane && i < 16 ? length : 0;
      this.point.set(s.x + Math.cos(heading) * end + Math.cos(angle) * reach, .04,
        s.z + Math.sin(heading) * end + Math.sin(angle) * reach).project(camera);
      const x = this.polygon[i * 2] = (this.point.x * .5 + .5) * this.width;
      left = Math.min(left, x);
      right = Math.max(right, x);
      const y = this.polygon[i * 2 + 1] = (this.point.y * .5 + .5) * this.height;
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
    // A half-strength shoulder around the exact warning contour limits nearby bloom.
    this.point.set(s.x, .04, s.z).project(camera);
    const originX = this.point.x;
    this.point.set(s.x + 1, .04, s.z).project(camera);
    const shoulder = channel === 1 ? Math.abs(this.point.x - originX) * this.width * .5 : 0;
    const extent = DISTANCE_RANGE + shoulder;
    const x0 = Math.max(0, Math.floor(left - extent));
    const x1 = Math.min(this.width, Math.ceil(right + extent));
    if (x0 >= x1) return;
    const y0 = Math.max(0, Math.floor(bottom - extent));
    const y1 = Math.min(this.height, Math.ceil(top + extent));
    const crossings = this.crossings;
    for (let y = y0; y < y1; y++) {
      const row = y + .5;
      crossings.length = 0;
      this.edgeDistanceSquared.fill(extent ** 2, x0, x1);
      for (let i = 0, j = count - 1; i < count; j = i++) {
        const ax = this.polygon[j * 2], ay = this.polygon[j * 2 + 1];
        const bx = this.polygon[i * 2], by = this.polygon[i * 2 + 1];
        const dx = bx - ax, dy = by - ay;
        if ((ay > row) !== (by > row)) crossings.push(ax + (row - ay) * dx / dy);
        if (row < Math.min(ay, by) - extent || row > Math.max(ay, by) + extent) continue;
        const start = Math.max(x0, Math.floor(Math.min(ax, bx) - extent));
        const end = Math.min(x1, Math.ceil(Math.max(ax, bx) + extent));
        const inverseLengthSquared = 1 / Math.max(1e-6, dx * dx + dy * dy);
        const ry = row - ay;
        for (let x = start; x < end; x++) {
          const rx = x + .5 - ax;
          const t = Math.max(0, Math.min(1, (rx * dx + ry * dy) * inverseLengthSquared));
          const distanceSquared = (rx - t * dx) ** 2 + (ry - t * dy) ** 2;
          this.edgeDistanceSquared[x] = Math.min(this.edgeDistanceSquared[x], distanceSquared);
        }
      }
      crossings.sort((a, b) => a - b);
      let crossing = 0;
      for (let x = x0; x < x1; x++) {
        while (crossing < crossings.length && crossings[crossing] <= x + .5) crossing++;
        const distance = Math.sqrt(this.edgeDistanceSquared[x]);
        const signed = crossing % 2 ? distance : -distance;
        this.writeDistance(x, y, channel, Math.max(signed, Math.min(.01, signed + shoulder)));
      }
    }
  }

  intersectsDanger(left: number, top: number, right: number, bottom: number): boolean {
    if (!this.hasDanger) return false;
    for (let y = Math.max(0, Math.floor((1-bottom)*this.height)-1); y <= Math.min(this.height-1, Math.ceil((1-top)*this.height)+1); y++) {
      for (let x = Math.max(0, Math.floor(left*this.width)-1); x <= Math.min(this.width-1, Math.ceil(right*this.width)+1); x++) {
        if (this.pixels[(y*this.width+x)*4+1] >= 128) return true;
      }
    }
    return false;
  }

  clear(): void {
    if(!this.hasMask)return;
    this.hasMask=false;
    this.hasDanger=false;
    this.pixels.fill(0);
    this.texture.needsUpdate=true;
  }
  dispose(): void { if (this.disposed) return; this.disposed = true; this.texture.dispose(); }
}
