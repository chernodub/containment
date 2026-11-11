import * as T from 'three';
import type { GraphicsTier } from '../FrameBudget';

export type LightRequest = Readonly<{
  x: number; y?: number; z: number; color: number; intensity?: number; distance?: number;
  duration?: number; priority?: number;
}>;
type Slot = { light: T.PointLight; age: number; duration: number; energy: number; priority: number; attachment: string | number | null; serial: number };

/** One High shader topology; zero-energy slots are rejected before local shading. */
export const LIGHT_POOL_PREWARM_COUNTS = Object.freeze([9] as const);
const LOW_PREWARM_COUNTS = Object.freeze([2] as const);
const DISABLED_PREWARM_COUNTS = Object.freeze([0] as const);

/** Fixed resources and light counts keep combat from selecting new shader programs. */
export class LightPool {
  readonly root = new T.Group();
  readonly lights: readonly T.PointLight[];
  private readonly slots: Slot[];
  private readonly highPrewarmCounts: readonly number[];
  private budget = 9;
  private prewarmCount: number | null = null;
  private serial = 0;
  private intensityScale = 1;
  private disposed = false;
  constructor(tier: GraphicsTier = 'high', private readonly highBudget = 9) {
    this.root.name = 'dynamic-light-pool';
    this.highPrewarmCounts = highBudget === 9 ? LIGHT_POOL_PREWARM_COUNTS : Object.freeze([this.allowedBudget(highBudget)]);
    this.slots = Array.from({ length: 10 }, () => ({ light: new T.PointLight(0xffffff, 0, 5, 2), age: 0, duration: 0, energy: 0, priority: -Infinity, attachment: null, serial: 0 }));
    this.lights = this.slots.map(slot => slot.light);
    this.root.add(...this.lights);
    this.setQuality(tier);
  }
  /** Quality selects the fixed visible count and the admission budget together. */
  setQuality(tier: GraphicsTier, enabled = true) {
    this.budget = enabled ? tier === 'high' ? this.allowedBudget(this.highBudget) : 2 : 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (i >= this.budget) this.clear(this.slots[i]);
    }
    this.refreshVisibility();
  }
  get capacity() { return this.budget; }
  get prewarmCounts(): readonly number[] { return this.budget === 0 ? DISABLED_PREWARM_COUNTS : this.budget === 2 ? LOW_PREWARM_COUNTS : this.highPrewarmCounts; }
  /** Temporarily expose first-N slots for renderer prewarming; null restores the tier count. */
  setPrewarmCount(count: number | null) {
    this.prewarmCount = count === null ? null : Math.min(this.budget, this.allowedBudget(count));
    this.refreshVisibility();
  }
  /** Photosensitivity setting scales emitted energy without changing source lifetimes. */
  setIntensityScale(value: number) {
    this.intensityScale = Math.max(0, Math.min(1, value));
    for (const slot of this.slots) {
      const fade = slot.duration > 0 ? Math.max(0, 1 - slot.age / slot.duration) : 0;
      slot.light.intensity = slot.energy * fade * fade * this.intensityScale;
    }
  }
  /** Lowest priority/oldest light is replaced; a weak flash never steals a stronger event. */
  flash(request: LightRequest, intensityIsScaled = false): T.PointLight | null {
    const slot = this.acquire(request.priority ?? 1);
    if (!slot) return null;
    this.configure(slot, request, intensityIsScaled);
    slot.attachment = null;
    return slot.light;
  }
  /** Refresh an attached source each frame, or call release to leave a fading tail. */
  attach(id: string | number, request: LightRequest): T.PointLight | null {
    let slot: Slot | undefined;
    for (let i = 0; i < this.budget; i++) if (this.slots[i].attachment === id) { slot = this.slots[i]; break; }
    slot ??= this.acquire(request.priority ?? 1) ?? undefined;
    if (!slot) return null;
    this.configure(slot, request);
    slot.attachment = id;
    return slot.light;
  }
  release(id: string | number, fade = .15) {
    for (const slot of this.slots) if (slot.attachment === id) {
      slot.attachment = null; slot.duration = Math.max(.001, fade); slot.age = 0; slot.energy = this.intensityScale > 0 ? slot.light.intensity / this.intensityScale : 0;
    }
  }
  update(dt: number) {
    const delta = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    for (let i = 0; i < this.budget; i++) {
      const slot = this.slots[i];
      if (slot.duration === 0) continue;
      slot.age += delta;
      if (slot.age >= slot.duration) { this.clear(slot); continue; }
      const fade = 1 - slot.age / slot.duration;
      slot.light.intensity = slot.energy * fade * fade * this.intensityScale;
    }
  }
  reset() { for (const slot of this.slots) this.clear(slot); }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.reset(); this.root.removeFromParent(); this.root.clear();
  }
  private allowedBudget(value: number): number {
    return value >= 9 ? 9 : Number.isFinite(value) ? Math.max(0, Math.floor(value / 2) * 2) : 0;
  }
  private refreshVisibility() {
    const count = this.prewarmCount === null ? this.budget : Math.min(this.budget, this.prewarmCount);
    for (let i = 0; i < this.slots.length; i++) this.slots[i].light.visible = i < count;
  }
  private acquire(priority: number): Slot | null {
    if (this.disposed) return null;
    let selected: Slot | null = null;
    for (let i = 0; i < this.budget; i++) {
      const slot = this.slots[i];
      if (slot.duration === 0) return slot;
      if (!selected || slot.priority < selected.priority || slot.priority === selected.priority && slot.serial < selected.serial) selected = slot;
    }
    return selected && selected.priority <= priority ? selected : null;
  }
  private configure(slot: Slot, request: LightRequest, intensityIsScaled = false) {
    slot.light.position.set(request.x, request.y ?? .9, request.z);
    slot.light.color.setHex(request.color); slot.light.distance = Math.max(.1, Math.min(12, request.distance ?? 5));
    const sourceEnergy=intensityIsScaled&&this.intensityScale>0?(request.intensity??10)/this.intensityScale:request.intensity??10;
    slot.energy = Math.max(0, Math.min(32, sourceEnergy)); slot.light.intensity = slot.energy * this.intensityScale;
    slot.duration = Math.max(.001, Math.min(10, request.duration ?? .12)); slot.age = 0;
    slot.priority = request.priority ?? 1; slot.serial = this.serial++;
  }
  private clear(slot: Slot) { slot.light.intensity = 0; slot.duration = 0; slot.age = 0; slot.priority = -Infinity; slot.attachment = null; }
}

