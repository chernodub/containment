import * as T from 'three';
import type { DepthGame } from '../../DepthGame';
import type { StatusActor } from './ElementKit';
import type { Telegraph } from '../vfx/TelegraphBatch';

/** Optional presentation accessor. Coordinates are renderer metres, never simulation units. */
export interface HostilePrioritySource {
  forEachHostilePriority?(visit: (shape: Readonly<Telegraph>) => void): void;
}

/** Shared shader hook; all materials are patched before renderer preparation. */
export function bindPriorityMask(material: T.ShaderMaterial, texture: T.Texture, attribute?: string, hostileOnly = false): void {
  if (material.uniforms.abilityPriorityMap) return;
  material.uniforms.abilityPriorityMap = { value: texture };
  material.vertexShader = `varying vec4 priorityClip;${attribute ? `attribute float ${attribute};varying float priorityWeight;` : ''}\n` + material.vertexShader;
  material.vertexShader = material.vertexShader.replace('void main(){', `void main(){${attribute ? `priorityWeight=${attribute};` : ''}`)
    .replace(/gl_Position\s*=\s*([^;]+);/, '$&priorityClip=gl_Position;');
  material.fragmentShader = `uniform sampler2D abilityPriorityMap;varying vec4 priorityClip;${attribute ? 'varying float priorityWeight;' : ''}\n#define HAS_ABILITY_PRIORITY_MASK\nvec3 abilityPriority(){return texture2D(abilityPriorityMap,priorityClip.xy/max(.001,priorityClip.w)*.5+.5).rgb;}\n` + material.fragmentShader;
  material.fragmentShader = material.fragmentShader.replace('void main(){', 'void main(){vec3 prioritySample=abilityPriority();')
    .replace('#include <tonemapping_fragment>', `
 float priority=${hostileOnly ? '0.' : 'prioritySample.r'};
 gl_FragColor.a=min(gl_FragColor.a,.16+.84*(1.-prioritySample.b));
 gl_FragColor.a*=1.-prioritySample.g*.92;
 gl_FragColor.a*=1.-priority*${attribute ? 'priorityWeight' : '1.'}*.97;
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
  private readonly horizontalDistance = new Float64Array(this.width);
  private readonly polygon = new Float32Array(68);
  private hasDanger = false;
  private hasMask = false;
  private readonly point = new T.Vector3();
  private camera?: T.Camera;
  private disposed = false;
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
    this.actor(p.x / 32, p.y / 32, .62, 2.05, 1);
    this.shape({shape:'circle',x:p.x/32,z:p.y/32,radius:1.5},2);
    for (const e of game.enemies.snapshot.enemies) {
      if (e.health <= 0) continue;
      const actor = actorFor?.(e.id), span = actor?.root.userData.affliction?.span ?? 0;
      this.actor(e.x / 32, e.y / 32, Math.max(e.radius / 32 + .13, span * .46), actor?.height ?? (e.type === 'crawler' ? .65 : e.type === 'brute' || e.type === 'carrier' ? 1.65 : 1.15), .95);
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
      this.actor(q.x / 32, q.y / 32, 2.8, actor?.height ?? 4.5, 1);
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
      this.segment(x - Math.cos(a) * .6, .65, z - Math.sin(a) * .6,
        x + Math.cos(a) * .35, .65, z + Math.sin(a) * .35, .35);
    }
    source?.forEachHostilePriority?.(this.visit);
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
  private actor(x: number, z: number, radius: number, height: number, strength: number): void {
    this.segment(x, radius * .35, z, x, height, z, radius, strength);
  }

  private segment(x: number, y: number, z: number, tx: number, ty: number, tz: number, radius: number, strength = 1): void {
    this.point.set(x, y, z).project(this.camera!);
    const px = (this.point.x * .5 + .5) * this.width, py = (this.point.y * .5 + .5) * this.height;
    this.point.set(x + radius, y, z).project(this.camera!);
    const r = Math.max(1.1, Math.abs((this.point.x * .5 + .5) * this.width - px));
    this.point.set(tx, ty, tz).project(this.camera!);
    const ex = (this.point.x * .5 + .5) * this.width, ey = (this.point.y * .5 + .5) * this.height;
    // An entirely clipped capsule cannot affect a pixel; reject before disc stamping.
    const extent = r + .75;
    if (Math.max(px, ex) + extent < 0 || Math.min(px, ex) - extent > this.width - 1 ||
        Math.max(py, ey) + extent < 0 || Math.min(py, ey) - extent > this.height - 1) return;
    const steps = Math.min(96, Math.max(1, Math.ceil(Math.hypot(ex - px, ey - py) / Math.max(1, r))));
    for (let i = 0; i <= steps; i++) this.ellipse(px + (ex - px) * i / steps, py + (ey - py) * i / steps, r + .75, r + .75, strength);
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
    let bottom = Infinity, top = -Infinity;
    for (let i = 0; i < count; i++) {
      const angle = lane ? heading - Math.PI / 2 + (i % 16) * Math.PI / 15 + (i >= 16 ? Math.PI : 0)
        : heading - span / 2 + (sector ? (i - 1) * span / 32 : i * span / count);
      const reach = sector && i === 0 ? 0 : radius;
      const end = lane && i < 16 ? length : 0;
      this.point.set(s.x + Math.cos(heading) * end + Math.cos(angle) * reach, .04,
        s.z + Math.sin(heading) * end + Math.sin(angle) * reach).project(camera);
      this.polygon[i * 2] = (this.point.x * .5 + .5) * this.width;
      const y = this.polygon[i * 2 + 1] = (this.point.y * .5 + .5) * this.height;
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
    for (let y = Math.max(0, Math.floor(bottom)); y < Math.min(this.height, Math.ceil(top)); y++) {
      let left = Infinity, right = -Infinity;
      const row = y + .5;
      for (let i = 0, j = count - 1; i < count; j = i++) {
        const a = this.polygon[i * 2 + 1], b = this.polygon[j * 2 + 1];
        if ((a > row) === (b > row)) continue;
        const x = this.polygon[i * 2] + (row - a) / (b - a) * (this.polygon[j * 2] - this.polygon[i * 2]);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
      for (let x = Math.max(0, Math.floor(left)); x < Math.min(this.width, Math.ceil(right)); x++) {
        this.raster[(y * this.width + x) * 4 + channel] = 255;
        if (channel === 1) this.hasDanger = true;
      }
    }
  }

  intersectsDanger(left: number, top: number, right: number, bottom: number): boolean {
    if (!this.hasDanger) return false;
    for (let y = Math.max(0, Math.floor((1-bottom)*this.height)-1); y <= Math.min(this.height-1, Math.ceil((1-top)*this.height)+1); y++) {
      for (let x = Math.max(0, Math.floor(left*this.width)-1); x <= Math.min(this.width-1, Math.ceil(right*this.width)+1); x++) {
        if (this.pixels[(y*this.width+x)*4+1]) return true;
      }
    }
    return false;
  }

  private ellipse(cx: number, cy: number, rx: number, ry: number, strength: number): void {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rx) || !Number.isFinite(ry)) return;
    const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(this.width - 1, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(this.height - 1, Math.ceil(cy + ry));
    if (x0 > x1 || y0 > y1) return;
    const peak = strength * 255, ceiling = Math.min(255, Math.round(peak));
    for(let x=x0;x<=x1;x++)this.horizontalDistance[x]=((x-cx)/rx)**2;
    for (let y = y0; y <= y1; y++) {
      const dy2 = ((y - cy) / ry) ** 2, row = y * this.width;
      for (let x = x0; x <= x1; x++) {
        const i = (row + x) * 4;
        // Max compositing cannot raise a pixel already at this stamp's ceiling.
        if (this.raster[i] >= ceiling) continue;
        const d = this.horizontalDistance[x] + dy2;
        if (d >= 1) continue;
        const value = Math.min(255, Math.round(peak * Math.min(1, (1 - d) * 3)));
        if (value > this.raster[i]) this.raster[i] = value;
      }
    }
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
