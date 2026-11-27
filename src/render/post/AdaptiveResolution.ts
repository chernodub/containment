import { RENDER_BUDGET } from '../FrameBudget';

/** Uses native presentation intervals. Fixed-step tools supply no timing samples. */
export class AdaptiveResolution {
  private currentScale = 1;
  private active = false;
  private readonly samples = new Uint8Array(60);
  private cursor = 0;
  private misses = 0;
  private cleanSeconds = 0;
  private holdSeconds = 0;

  minimumScale: number = RENDER_BUDGET.adaptiveMinScale;

  get scale(): number { return this.currentScale; }
  get enabled(): boolean { return this.active; }
  get snapshot() {
    return { enabled: this.active, scale: this.currentScale, missesLast60: this.misses, source: 'frame' as const };
  }

  setEnabled(enabled: boolean): void {
    if (enabled === this.active) return;
    this.active = enabled;
    this.reset();
  }

  reset(): void {
    this.currentScale = 1;
    this.clearHistory();
    this.holdSeconds = 0;
  }

  clearHistory(): void {
    this.samples.fill(0);
    this.cursor = this.misses = this.cleanSeconds = 0;
  }

  update(frameMs: number): number {
    if (!this.active || !Number.isFinite(frameMs) || frameMs <= 0) return this.currentScale;

    const miss = Number(frameMs > 20);
    this.misses += miss - this.samples[this.cursor];
    this.samples[this.cursor] = miss;
    this.cursor = (this.cursor + 1) % this.samples.length;

    const elapsed = Math.min(frameMs / 1000, .05);
    this.holdSeconds = Math.max(0, this.holdSeconds - elapsed);
    this.cleanSeconds = this.misses > 1 ? 0 : this.cleanSeconds + elapsed;
    if (this.holdSeconds > 0) return this.currentScale;

    if (this.misses >= 2 && this.currentScale > this.minimumScale) {
      this.currentScale = Math.max(this.minimumScale, Math.round((this.currentScale - .05) * 1000) / 1000);
      this.clearHistory();
      this.holdSeconds = .25;
    } else if (this.cleanSeconds >= 6 && this.currentScale < RENDER_BUDGET.adaptiveMaxScale) {
      this.currentScale = Math.min(RENDER_BUDGET.adaptiveMaxScale, Math.round((this.currentScale + .025) * 1000) / 1000);
      this.clearHistory();
      this.holdSeconds = .25;
    }
    return this.currentScale;
  }
}
