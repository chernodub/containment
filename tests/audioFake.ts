/** Observable Web Audio test double. Signal correctness is tested with OfflineAudioContext separately. */
export type ParamCall = Readonly<{
  method: 'set' | 'linear' | 'target' | 'cancel' | 'hold';
  time: number;
  value?: number;
  timeConstant?: number;
}>;
type Automation = ParamCall & { method: 'set' | 'linear' | 'target'; value: number };

export class FakeParam {
  readonly calls: ParamCall[] = [];
  private events: Automation[] = [];
  private initial: number;
  constructor(private readonly clock: () => number, value = 1) { this.initial = value; }
  get value(): number { return this.valueAt(this.clock()); }
  set value(value: number) { this.initial = value; }
  private schedule(event: Automation): this {
    this.calls.push(event); this.events.push(event);
    this.events.sort((a, b) => a.time - b.time);
    return this;
  }
  setValueAtTime(value: number, time: number): this { return this.schedule({ method: 'set', value, time }); }
  linearRampToValueAtTime(value: number, time: number): this { return this.schedule({ method: 'linear', value, time }); }
  setTargetAtTime(value: number, time: number, timeConstant: number): this { return this.schedule({ method: 'target', value, time, timeConstant }); }
  cancelScheduledValues(time: number): this {
    this.calls.push({ method: 'cancel', time });
    this.events = this.events.filter(event => event.time < time);
    return this;
  }
  cancelAndHoldAtTime(time: number): this {
    const value = this.valueAt(time);
    this.calls.push({ method: 'hold', time, value });
    this.events = this.events.filter(event => event.time < time);
    this.events.push({ method: 'set', time, value });
    this.events.sort((a, b) => a.time - b.time);
    return this;
  }
  /** Evaluate scheduled set/ramp/target operations at an explicit audio time. */
  valueAt(time: number): number {
    let value = this.initial, previousTime = 0, target: Automation | null = null, targetStart = value;
    for (const event of this.events) {
      if (event.time > time) {
        if (event.method === 'linear') {
          const progress = Math.max(0, Math.min(1, (time - previousTime) / (event.time - previousTime)));
          return value + (event.value - value) * progress;
        }
        break;
      }
      if (target) value = target.value + (targetStart - target.value) * Math.exp(-(event.time - target.time) / target.timeConstant!);
      if (event.method === 'target') { target = event; targetStart = value; }
      else { value = event.value; target = null; }
      previousTime = event.time;
    }
    if (target) return target.value + (targetStart - target.value) * Math.exp(-(time - target.time) / target.timeConstant!);
    return value;
  }
  get scheduled(): readonly Automation[] { return this.events; }
  /** Exact for step-rate automation; midpoint integration for ramps/targets. */
  integral(from: number, to: number): number {
    const boundaries = [from, ...this.events.filter(event => event.time > from && event.time < to).map(event => event.time), to];
    let total = 0;
    for (let i = 1; i < boundaries.length; i++) {
      const start = boundaries[i - 1], end = boundaries[i];
      total += (end - start) * this.valueAt((start + end) / 2);
    }
    return total;
  }
}

export type FakeNodeKind = 'destination' | 'gain' | 'filter' | 'compressor' | 'shaper' | 'convolver' | 'panner' | 'source';
export class FakeNode extends EventTarget {
  readonly connections = new Set<unknown>();
  readonly gain: FakeParam;
  readonly frequency: FakeParam;
  readonly pan: FakeParam;
  readonly threshold: FakeParam;
  readonly knee: FakeParam;
  readonly ratio: FakeParam;
  readonly attack: FakeParam;
  readonly release: FakeParam;
  readonly playbackRate: FakeParam;
  disconnects = 0;
  type = '';
  curve: Float32Array | null = null;
  oversample = 'none';
  buffer: AudioBuffer | null = null;
  normalize = true;
  constructor(readonly context: FakeAudioContext, readonly kind: FakeNodeKind) {
    super();
    const clock = () => context.currentTime;
    this.gain = new FakeParam(clock); this.frequency = new FakeParam(clock, 350);
    this.pan = new FakeParam(clock, 0); this.threshold = new FakeParam(clock, -24);
    this.knee = new FakeParam(clock, 30); this.ratio = new FakeParam(clock, 12);
    this.attack = new FakeParam(clock, .003); this.release = new FakeParam(clock, .25);
    this.playbackRate = new FakeParam(clock);
  }
  connect<T>(destination: T): T { this.connections.add(destination); return destination; }
  disconnect(destination?: unknown): void {
    this.disconnects++;
    if (destination === undefined) this.connections.clear(); else this.connections.delete(destination);
  }
}

export class FakeSource extends FakeNode {
  loop = false;
  starts: Readonly<{ when: number; offset: number; duration?: number }>[] = [];
  stops: number[] = [];
  ended = false;
  private scheduledStop = Infinity;
  private consumed = 0;
  private advancedAt = 0;
  private contentDuration = Infinity;
  constructor(context: FakeAudioContext) { super(context, 'source'); }
  start(when = 0, offset = 0, duration?: number): void {
    if (this.starts.length) throw new Error('Source already started');
    this.starts.push({ when, offset, duration });
    this.advancedAt = when;
    if (!this.loop || duration !== undefined) this.contentDuration = duration ?? Math.max(0, (this.buffer?.duration ?? 0) - offset);
  }
  stop(when = 0): void {
    this.stops.push(when); this.scheduledStop = when;
    if (when <= this.context.currentTime) this.finish();
  }
  finish(): void {
    if (this.ended) return;
    this.ended = true; this.dispatchEvent(new Event('ended'));
  }
  advance(time: number): void {
    if (this.ended || !this.starts.length) return;
    if (time > this.advancedAt) {
      this.consumed += this.playbackRate.integral(this.advancedAt, time);
      this.advancedAt = time;
    }
    if (this.consumed >= this.contentDuration - 1e-9 || this.scheduledStop <= time) this.finish();
  }
}

class FakeBuffer {
  readonly duration: number;
  private readonly channels: Float32Array[];
  constructor(readonly numberOfChannels: number, readonly length: number, readonly sampleRate: number) {
    this.duration = length / sampleRate;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  getChannelData(channel: number): Float32Array { return this.channels[channel]; }
  copyToChannel(source: Float32Array, channel: number, start = 0): void { this.channels[channel].set(source, start); }
  copyFromChannel(destination: Float32Array, channel: number, start = 0): void { destination.set(this.channels[channel].subarray(start, start + destination.length)); }
}

export class FakeAudioContext extends EventTarget {
  currentTime = 0;
  state: AudioContextState = 'running';
  sampleRate = 24000;
  readonly destination: FakeNode;
  readonly nodes: FakeNode[] = [];
  readonly sources: FakeSource[] = [];
  readonly buffers: AudioBuffer[] = [];
  resumes = 0;
  closes = 0;
  constructor() { super(); this.destination = new FakeNode(this, 'destination'); }
  asContext(): BaseAudioContext { return this as unknown as BaseAudioContext; }
  private node(kind: FakeNodeKind): FakeNode { const node = new FakeNode(this, kind); this.nodes.push(node); return node; }
  createGain(): FakeNode { return this.node('gain'); }
  createBiquadFilter(): FakeNode { return this.node('filter'); }
  createDynamicsCompressor(): FakeNode { return this.node('compressor'); }
  createWaveShaper(): FakeNode { return this.node('shaper'); }
  createConvolver(): FakeNode { return this.node('convolver'); }
  createStereoPanner(): FakeNode { return this.node('panner'); }
  createBufferSource(): FakeSource {
    const source = new FakeSource(this); this.nodes.push(source); this.sources.push(source); return source;
  }
  createBuffer(channels: number, length: number, rate: number): AudioBuffer {
    const buffer = new FakeBuffer(channels, length, rate) as unknown as AudioBuffer;
    this.buffers.push(buffer); return buffer;
  }
  async decodeAudioData(_encoded: ArrayBuffer): Promise<AudioBuffer> { return this.createBuffer(1, this.sampleRate * 2, this.sampleRate); }
  async resume(): Promise<void> { this.resumes++; this.setState('running'); }
  async suspend(): Promise<void> { this.setState('suspended'); }
  async close(): Promise<void> { this.closes++; this.setState('closed'); }
  setState(state: AudioContextState): void { this.state = state; this.dispatchEvent(new Event('statechange')); }
  /** Advance monotonically, completing scheduled sources and their ended listeners. */
  advance(seconds: number): void {
    if (seconds < 0) throw new Error('Fake audio clock cannot run backwards');
    this.currentTime += seconds;
    for (const source of this.sources) source.advance(this.currentTime);
  }
}
