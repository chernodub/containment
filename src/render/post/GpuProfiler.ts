type TimerExtension = {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
};

/** Sparse, asynchronous GPU frame samples for adaptive resolution; never blocks or reads pixels. */
export class GpuFrameTimer {
  private readonly extension: TimerExtension | null;
  private readonly pending: Array<WebGLQuery | null> = Array(8).fill(null);
  private readonly pendingAge = new Uint16Array(8);
  private latestAge = 0;
  private active: WebGLQuery | null = null;
  private frame = 0;
  private activeSlot = -1;
  private cursor = 0;
  private enabledValue = false;
  private disposed = false;
  private completed = 0;
  private disjoint = 0;
  private latest: number | undefined;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.extension = gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerExtension | null;
  }

  get supported(): boolean { return this.extension !== null; }
  get enabled(): boolean { return this.enabledValue; }
  get latestMs(): number | undefined { return this.latest; }
  get snapshot() {
    return { supported: this.supported, enabled: this.enabled, latestMs: this.latest, samples: this.completed, disjointSamples: this.disjoint, sampleAgeFrames: this.latest === undefined ? undefined : this.latestAge };
  }

  /** Bench per-pass timing disables this timer to avoid nested elapsed queries. */
  setEnabled(enabled: boolean): void {
    if (enabled === this.enabledValue || this.disposed) return;
    this.enabledValue = enabled;
    if (!enabled) this.clear();
  }

  /** Poll only completed results. Invalid disjoint samples never reach the resolution controller. */
  poll(): number | undefined {
    if (!this.enabledValue || !this.extension || this.disposed || this.gl.isContextLost()) return undefined;
    const gl = this.gl;
    if (gl.getParameter(this.extension.GPU_DISJOINT_EXT)) {
      this.disjoint++;
      this.clear();
      return undefined;
    }
    // A stalled driver must not hold one old overload estimate forever. At 60Hz,
    // two seconds without a result falls back to the controller's frame estimate.
    if (this.latest !== undefined && ++this.latestAge > 120) this.latest = undefined;
    let sample: number | undefined;
    // Slots are ordered from oldest to newest, so the last valid result wins.
    for (let offset = 0; offset < this.pending.length; offset++) {
      const index = (this.cursor + offset) % this.pending.length;
      const query = this.pending[index];
      if (!query) continue;
      // Retire stuck query handles too, keeping new feedback retryable and bounded.
      if (++this.pendingAge[index] > 240) {
        gl.deleteQuery(query);
        this.pending[index] = null;
        continue;
      }
      if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) continue;
      const milliseconds = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(query);
      this.pending[index] = null;
      if (Number.isFinite(milliseconds) && milliseconds > 0 && milliseconds < 100) {
        sample = milliseconds;
        this.completed++;
      }
    }
    if (sample !== undefined) { this.latest = sample; this.latestAge = 0; }
    return sample;
  }

  /** One sample per sixteen frames; skip when an external profiler owns the query target. */
  beginFrame(): void {
    if (!this.enabledValue || !this.extension || this.disposed || this.gl.isContextLost() || this.active) return;
    if (this.frame++ % 16 !== 0 || this.pending[this.cursor]) return;
    const gl = this.gl;
    if (gl.getQuery(this.extension.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)) return;
    const query = gl.createQuery();
    if (!query) return;
    this.active = query;
    this.activeSlot = this.cursor;
    gl.beginQuery(this.extension.TIME_ELAPSED_EXT, query);
  }

  endFrame(): void {
    if (!this.active || !this.extension) return;
    if (this.gl.isContextLost()) {
      this.active = null;
      this.activeSlot = -1;
      return;
    }
    this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
    this.pending[this.activeSlot] = this.active;
    this.pendingAge[this.activeSlot] = 0;
    this.cursor = (this.activeSlot + 1) % this.pending.length;
    this.active = null;
    this.activeSlot = -1;
  }

  /** Context replacement creates a new timer; disposed handles never survive recovery. */
  dispose(): void {
    if (this.disposed) return;
    this.clear();
    this.enabledValue = false;
    this.disposed = true;
  }

  private clear(): void {
    const gl = this.gl;
    if (this.active && this.extension && !gl.isContextLost()) {
      gl.endQuery(this.extension.TIME_ELAPSED_EXT);
      gl.deleteQuery(this.active);
    }
    this.active = null;
    this.activeSlot = -1;
    for (let index = 0; index < this.pending.length; index++) {
      const query = this.pending[index];
      if (query && !gl.isContextLost()) gl.deleteQuery(query);
      this.pending[index] = null;
    }
    this.cursor = 0;
    this.pendingAge.fill(0);
    this.latestAge = 0;
    this.latest = undefined;
  }
}
