import * as T from 'three';
import type { DepthGame } from '../../DepthGame';
import type { Telegraph } from '../vfx/TelegraphBatch';

/** Optional presentation accessor. Coordinates are renderer metres, never simulation units. */
export interface HostilePrioritySource {
  forEachHostilePriority?(visit: (shape: Readonly<Telegraph>) => void): void;
}

/** Shared shader hook; all materials are patched before renderer preparation. */
export function bindPriorityMask(material: T.ShaderMaterial, texture: T.Texture, attribute?: string): void {
  if (material.uniforms.abilityPriorityMap) return;
  material.uniforms.abilityPriorityMap = { value: texture };
  material.vertexShader = `varying vec4 priorityClip;${attribute ? `attribute float ${attribute};varying float priorityWeight;` : ''}\n` + material.vertexShader;
  material.vertexShader = material.vertexShader.replace('void main(){', `void main(){${attribute ? `priorityWeight=${attribute};` : ''}`)
    .replace(/gl_Position\s*=\s*([^;]+);/, '$&priorityClip=gl_Position;');
  material.fragmentShader = `uniform sampler2D abilityPriorityMap;varying vec4 priorityClip;${attribute ? 'varying float priorityWeight;' : ''}\n` + material.fragmentShader;
  material.fragmentShader = material.fragmentShader.replace('#include <tonemapping_fragment>', `
 vec2 priorityUv=priorityClip.xy/max(.001,priorityClip.w)*.5+.5;
 float priority=texture2D(abilityPriorityMap,priorityUv).r;
 gl_FragColor.a*=1.-priority*${attribute ? 'priorityWeight' : '1.'}*.97;
 if(gl_FragColor.a<.004)discard;
 #include <tonemapping_fragment>`);
}

/** 128×72 screen mask. CPU rasterization reuses storage; no extra draw or render target. */
export class AbilityPriorityMask {
  readonly width = 128;
  readonly height = 72;
  readonly pixels = new Uint8Array(this.width * this.height);
  readonly texture = new T.DataTexture(this.pixels, this.width, this.height, T.RedFormat);
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

  update(game: DepthGame | undefined, camera: T.Camera | undefined, source?: HostilePrioritySource): void {
    this.pixels.fill(0);
    this.camera = camera;
    if (game && camera) {
      const p = game.player;
      this.actor(p.x / 32, p.y / 32, .62, 2.05, 1);
      for (const e of game.enemies.snapshot.enemies) {
        if (e.health <= 0) continue;
        this.actor(e.x / 32, e.y / 32, e.radius / 32 + .13,
          e.type === 'crawler' ? .65 : e.type === 'brute' || e.type === 'carrier' ? 1.65 : 1.15, .95);
        // Snapshot fallback also works while the world renderer evolves its warning accessor.
        if (e.windupMs > 0 && e.pendingAttack) {
          const tx = e.pendingAttack === 'charge' ? e.x + e.lockX : e.lockX;
          const tz = e.pendingAttack === 'charge' ? e.y + e.lockY : e.lockY;
          this.segment(e.x / 32, .07, e.y / 32, tx / 32, .07, tz / 32, e.pendingAttack === 'charge' ? .8 : .32);
        }
      }
      const q = game.boss?.snapshot;
      if (q?.active && !q.defeated) this.actor(q.x / 32, q.y / 32, 2.6, 4.5, 1);
      if (q?.pendingTelegraph) {
        const t = q.pendingTelegraph;
        this.ground(t.targetX / 32, t.targetY / 32, t.radius / 32 + .18);
      }
      for (const b of game.bullets) {
        if (b.kind !== 'hazard') continue;
        const x = b.x / 32, z = b.y / 32, a = b.request.angle;
        this.segment(x - Math.cos(a) * .6, .65, z - Math.sin(a) * .6,
          x + Math.cos(a) * .35, .65, z + Math.sin(a) * .35, .35);
      }
      source?.forEachHostilePriority?.(this.visit);
    }
    this.texture.needsUpdate = true;
  }

  /** Stamp a projected actor capsule including its head, rather than only its ground circle. */
  private actor(x: number, z: number, radius: number, height: number, strength: number): void {
    this.segment(x, radius * .35, z, x, height, z, radius, strength);
  }

  private ground(x: number, z: number, radius: number): void {
    this.point.set(x, .07, z).project(this.camera!);
    const px = (this.point.x * .5 + .5) * this.width, py = (this.point.y * .5 + .5) * this.height;
    this.point.set(x + radius, .07, z).project(this.camera!);
    const rx = Math.max(1.5, Math.abs((this.point.x * .5 + .5) * this.width - px));
    this.point.set(x, .07, z + radius).project(this.camera!);
    const ry = Math.max(1.5, Math.abs((this.point.y * .5 + .5) * this.height - py));
    this.ellipse(px, py, rx + 1, ry + 1, 1);
  }

  private segment(x: number, y: number, z: number, tx: number, ty: number, tz: number, radius: number, strength = 1): void {
    this.point.set(x, y, z).project(this.camera!);
    const px = (this.point.x * .5 + .5) * this.width, py = (this.point.y * .5 + .5) * this.height;
    this.point.set(x + radius, y, z).project(this.camera!);
    const r = Math.max(1.1, Math.abs((this.point.x * .5 + .5) * this.width - px));
    this.point.set(tx, ty, tz).project(this.camera!);
    const ex = (this.point.x * .5 + .5) * this.width, ey = (this.point.y * .5 + .5) * this.height;
    const steps = Math.min(96, Math.max(1, Math.ceil(Math.hypot(ex - px, ey - py) / Math.max(1, r))));
    for (let i = 0; i <= steps; i++) this.ellipse(px + (ex - px) * i / steps, py + (ey - py) * i / steps, r + .75, r + .75, strength);
  }

  private shape(s: Readonly<Telegraph>): void {
    if (!this.camera) return;
    if (s.shape === 'line' || s.shape === 'wall') {
      this.segment(s.x, .07, s.z, s.x + Math.cos(s.angle ?? 0) * (s.length ?? 1), .07,
        s.z + Math.sin(s.angle ?? 0) * (s.length ?? 1), (s.width ?? 1) * .5 + .15);
    } else this.ground(s.x, s.z, (s.radius ?? 1) + .15);
  }

  private ellipse(cx: number, cy: number, rx: number, ry: number, strength: number): void {
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rx) || !Number.isFinite(ry)) return;
    const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(this.width - 1, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(this.height - 1, Math.ceil(cy + ry));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d >= 1) continue;
      const value = Math.min(255, Math.round(strength * 255 * Math.min(1, (1 - d) * 3)));
      const i = y * this.width + x;
      if (value > this.pixels[i]) this.pixels[i] = value;
    }
  }

  clear(): void { this.pixels.fill(0); this.texture.needsUpdate = true; }
  dispose(): void { if (this.disposed) return; this.disposed = true; this.texture.dispose(); }
}
