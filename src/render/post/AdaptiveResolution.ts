import { RENDER_BUDGET } from '../FrameBudget';

/** Stable, clock-free resolution control. Samples and elapsed time come from presentation. */
export class AdaptiveResolution {
  private currentScale = 1;
  private smoothedMs = 0;
  private overloadSeconds = 0;
  private headroomSeconds = 0;
  private holdSeconds = 0;
  private active = false;
  private source: 'gpu' | 'frame' = 'frame';

  get scale(): number { return this.currentScale; }
  get enabled(): boolean { return this.active; }
  get snapshot() {
    return { enabled: this.active, scale: this.currentScale, smoothedMs: this.smoothedMs, source: this.source };
  }

  /** Disable resets full resolution immediately; enabling starts from a clean estimate. */
  setEnabled(enabled: boolean): void {
    if (enabled === this.active) return;
    this.active = enabled;
    this.reset();
  }

  reset(): void {
    this.currentScale = 1;
    this.smoothedMs = this.overloadSeconds = this.headroomSeconds = this.holdSeconds = 0;
    this.source = 'frame';
  }

  /** Returns scale; callers only resize when this value changes. Invalid/stalled frames are ignored. */
  update(frameMs: number, gpuMs?: number): number {
    if (!this.active || !Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 80) return this.currentScale;
    const hasGpu = gpuMs !== undefined && Number.isFinite(gpuMs) && gpuMs > 0 && gpuMs < 100;
    const nextSource = hasGpu ? 'gpu' : 'frame';
    // GPU readings are sparse; callers should retain their latest valid estimate.
    const measuredMs = hasGpu ? gpuMs! : Math.min(frameMs, 40);
    const elapsed = Math.min(frameMs / 1000, .04);
    if (nextSource !== this.source) {
      this.smoothedMs = measuredMs;
      this.overloadSeconds = this.headroomSeconds = 0;
      this.source = nextSource;
    } else {
      const blend = 1 - Math.exp(-elapsed / .7);
      this.smoothedMs = this.smoothedMs === 0 ? measuredMs : this.smoothedMs + (measuredMs - this.smoothedMs) * blend;
    }
    this.holdSeconds = Math.max(0, this.holdSeconds - elapsed);
    const high = hasGpu ? RENDER_BUDGET.gpuTargetMs + 1 : 20.2;
    const low = hasGpu ? RENDER_BUDGET.gpuTargetMs - 3 : 17.1;
    this.overloadSeconds = this.smoothedMs > high ? this.overloadSeconds + elapsed : 0;
    this.headroomSeconds = this.smoothedMs < low ? this.headroomSeconds + elapsed : 0;
    if (this.holdSeconds > 0) return this.currentScale;
    if (this.overloadSeconds >= .65 && this.currentScale > RENDER_BUDGET.adaptiveMinScale) {
      this.currentScale = Math.max(RENDER_BUDGET.adaptiveMinScale, Math.round((this.currentScale - .025) * 1000) / 1000);
      this.holdSeconds = .5;
      this.overloadSeconds = this.headroomSeconds = 0;
    } else if (this.headroomSeconds >= 5 && this.currentScale < RENDER_BUDGET.adaptiveMaxScale) {
      this.currentScale = Math.min(RENDER_BUDGET.adaptiveMaxScale, Math.round((this.currentScale + .025) * 1000) / 1000);
      this.holdSeconds = 2;
      this.overloadSeconds = this.headroomSeconds = 0;
    }
    return this.currentScale;
  }
}
