/** CPU update/render diagnostics. Values come from the application RAF; this class never reads a clock. */
export class NativeFrameSamples {
  private readonly costs: Float64Array;
  private cursor = 0;
  private retained = 0;
  private samples = 0;
  private total = 0;
  private maximum = 0;
  private windowTotal = 0;

  constructor(readonly capacity = 240) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 16_384) {
      throw new RangeError('Native frame sample capacity must be an integer from 1 to 16384');
    }
    this.costs = new Float64Array(capacity);
  }

  /** Record one native RAF CPU cost with no allocations; ignore invalid observations. */
  record(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return;
    if (this.retained === this.capacity) this.windowTotal -= this.costs[this.cursor]!;
    else this.retained++;
    this.costs[this.cursor] = milliseconds;
    this.cursor = (this.cursor + 1) % this.capacity;
    this.samples++;
    this.total += milliseconds;
    this.windowTotal += milliseconds;
    this.maximum = Math.max(this.maximum, milliseconds);
  }

  /** Allocate/sort only when diagnostics are requested; percentiles cover the latest window. */
  get snapshot() {
    const sorted = Array.from(this.costs.subarray(0, this.retained)).sort((a, b) => a - b);
    const percentile = (fraction: number) => sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
    return {
      samples: this.samples,
      retained: this.retained,
      capacity: this.capacity,
      p50: percentile(.5),
      p95: percentile(.95),
      max: this.maximum,
      average: this.samples ? this.total / this.samples : 0,
      windowMax: percentile(1),
      windowAverage: this.retained ? this.windowTotal / this.retained : 0,
      scope: 'Native visible RAF update + render CPU submission; p50/p95/windowMax/windowAverage use latest retained samples; max/average/samples use page lifetime. Includes menu, pause and loading frames; excludes later HUD synchronization and GPU completion.',
    };
  }
}
