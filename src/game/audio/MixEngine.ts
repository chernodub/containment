import { impulseSamples, type AudioBus } from './synthesis';

export const AUDIO_BUSES: readonly AudioBus[] = ['music', 'ambience', 'weapons', 'abilities', 'enemies', 'impacts', 'ui', 'danger'];
const DANGER_DUCK_DB: Partial<Record<AudioBus, number>> = {
  music: -6, ambience: -6, abilities: -4, impacts: -4, weapons: -2.5, enemies: -3,
};
export const VOICE_LIMIT = 48;
export const ACTIVE_VOICE_LIMIT = 40;
export const LOOP_LIMIT = 10;
const clamp = (n: number, max = 1) => Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
export type MixVoice = {
  source: AudioBufferSourceNode; gain: GainNode; nodes: AudioNode[];
  group?: string; bus: AudioBus; priority: number; loop: boolean; retiring: boolean; end: number; level: number;
  rate: number; start: number; contentDuration: number; consumed: number; rateUpdatedAt: number;
};
export type VoiceOptions = {
  bus: AudioBus; level?: number; priority?: number; pan?: number; distance?: number;
  rate?: number; delay?: number; offset?: number; duration?: number; loop?: boolean;
  fadeIn?: number; group?: string;
};

/** One graph for legacy samples and original PCM. All sources count toward the cap. */
export class MixEngine {
  readonly master: GainNode;
  readonly effects: GainNode;
  readonly music: GainNode;
  readonly buses = {} as Record<AudioBus, GainNode>;
  readonly voices = new Set<MixVoice>();
  readonly musicFilter: BiquadFilterNode;
  readonly bed = new Map<AudioBus, GainNode>();
  private dangerUntil = 0;
  private readonly duckMusic: GainNode;
  private readonly duckAmbience: GainNode;
  private readonly musicFocus: GainNode;
  private readonly nodes: AudioNode[] = [];
  private readonly reverbInput: GainNode;
  private reverbs: { convolver: ConvolverNode; gain: GainNode }[] = [];
  private reverbIndex = 0;
  private duckUntil = 0;
  private duckDepth = 1;
  private destroyed = false;
  admitted = 0;
  rejected = 0;
  highWater = 0;
  constructor(readonly context: BaseAudioContext, volumes: { master: number; music: number; effects: number }) {
    this.master = context.createGain(); this.effects = context.createGain(); this.music = context.createGain();
    this.master.gain.value = volumes.master * .85;
    this.effects.gain.value = volumes.effects; this.music.gain.value = volumes.music;
    this.duckMusic = context.createGain(); this.duckAmbience = context.createGain();
    this.musicFocus = context.createGain();
    this.musicFilter = context.createBiquadFilter(); this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 20000;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -9; compressor.knee.value = 8; compressor.ratio.value = 5;
    compressor.attack.value = .003; compressor.release.value = .18;
    const limiter = context.createWaveShaper(), curve = new Float32Array(4097);
    for (let i = 0; i < curve.length; i++) curve[i] = .96 * Math.tanh((i / (curve.length - 1) * 2 - 1) / .96);
    limiter.curve = curve; limiter.oversample = '2x';
    this.effects.connect(this.master); this.music.connect(this.musicFilter).connect(this.musicFocus).connect(this.duckMusic).connect(this.master);
    this.master.connect(compressor).connect(limiter).connect(context.destination);
    this.reverbInput = context.createGain(); this.reverbInput.gain.value = .13;
    for (let i = 0; i < 2; i++) {
      const convolver = context.createConvolver(), gain = context.createGain(); gain.gain.value = 0;
      this.reverbInput.connect(convolver).connect(gain).connect(this.effects);
      this.reverbs.push({ convolver, gain }); this.nodes.push(convolver, gain);
    }
    for (const bus of AUDIO_BUSES) {
      const node = context.createGain(); this.buses[bus] = node;
      let output = node;
      if (DANGER_DUCK_DB[bus] !== undefined) {
        output = context.createGain();
        node.connect(output);
        this.bed.set(bus, output);
        this.nodes.push(output);
      }
      if (bus === 'music') output.connect(this.music);
      else if (bus === 'ambience') output.connect(this.duckAmbience).connect(this.effects);
      else output.connect(this.effects);
      if (bus !== 'music' && bus !== 'ui' && bus !== 'ambience' && bus !== 'danger') output.connect(this.reverbInput);
      this.nodes.push(node);
    }
    this.nodes.push(this.master, this.effects, this.music, this.duckMusic, this.duckAmbience, this.musicFocus, this.musicFilter, compressor, limiter, this.reverbInput);
  }

  /** Admission keeps eight spare physical voices for click-free stealing tails. */
  play(buffer: AudioBuffer, options: VoiceOptions): MixVoice | null {
    if (this.destroyed) return null;
    const now = this.context.currentTime;
    // Offline scheduling has no ended callbacks until rendering: reap completed scheduled voices.
    for (const voice of this.voices) if (voice.end <= now) this.release(voice);
    let groupCount = 0, dangerCount = 0, active = 0, loops = 0, victim: MixVoice | null = null;
    const priority = options.priority ?? 40;
    for (const voice of this.voices) {
      if (voice.loop && !voice.retiring) loops++;
      if (voice.retiring) continue;
      active++;
      if (options.group && voice.group === options.group) groupCount++;
      if (voice.bus === 'danger') dangerCount++;
      if (!voice.loop && voice.priority < priority && (!victim || voice.priority < victim.priority)) victim = voice;
    }
    if (groupCount >= 3 || (options.bus === 'danger' && dangerCount >= 8) || (options.loop && loops >= LOOP_LIMIT) || this.voices.size >= VOICE_LIMIT || (active >= ACTIVE_VOICE_LIMIT && !victim)) { this.rejected++; return null; }
    if (active >= ACTIVE_VOICE_LIMIT && victim) this.stop(victim);
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    const start = now + Math.max(0, options.delay ?? 0), rate = Math.max(.25, Math.min(3, options.rate ?? 1));
    const offset = Math.max(0, Math.min(buffer.duration - .001, options.offset ?? 0));
    const duration = Math.max(.001, Math.min(options.duration ?? buffer.duration - offset, buffer.duration - offset));
    const level = clamp(options.level ?? 1, 2) / (1 + Math.max(0, options.distance ?? 0) / 420);
    source.buffer = buffer; source.loop = options.loop ?? false; source.playbackRate.value = rate;
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(level, start + (source.loop ? Math.max(.004, options.fadeIn ?? .004) : Math.min(.004, duration / rate / 3)));
    if (!source.loop) {
      gain.gain.setValueAtTime(level, start + Math.max(.004, duration / rate - .018));
      gain.gain.linearRampToValueAtTime(0, start + duration / rate);
    }
    source.connect(gain);
    const nodes: AudioNode[] = [gain];
    const pan = this.context.createStereoPanner(); pan.pan.value = Math.max(-.85, Math.min(.85, options.pan ?? 0));
    gain.connect(pan).connect(this.buses[options.bus]); nodes.push(pan);
    const voice: MixVoice = { source, gain, nodes, priority, group: options.group, bus: options.bus, loop: source.loop, retiring: false, end: source.loop ? Infinity : start + duration / rate, level, rate, start, contentDuration: duration, consumed: 0, rateUpdatedAt: start };
    this.voices.add(voice); this.admitted++; this.highWater = Math.max(this.highWater, this.voices.size);
    source.addEventListener('ended', () => this.release(voice), { once: true });
    if (source.loop) source.start(start, offset); else source.start(start, offset, duration);
    if (voice.bus === 'danger') this.duckForDanger(voice.start);
    return voice;
  }
  private duckForDanger(start: number): void {
    if (start + .25 <= this.dangerUntil) return;
    this.dangerUntil = start + .25;
    for (const [bus, gain] of this.bed) {
      const param = gain.gain;
      const level = 10 ** ((DANGER_DUCK_DB[bus] ?? 0) / 20);
      param.cancelAndHoldAtTime(start);
      param.linearRampToValueAtTime(level, start + .015);
      param.setValueAtTime(level, this.dangerUntil);
      param.linearRampToValueAtTime(1, this.dangerUntil + .18);
    }
  }
  stop(voice: MixVoice, fade = .018): void {
    if (!this.voices.has(voice) || voice.retiring) return;
    voice.retiring = true;
    const now = this.context.currentTime;
    voice.gain.gain.cancelAndHoldAtTime(now);
    voice.gain.gain.linearRampToValueAtTime(0, now + fade);
    voice.end = now + fade;
    try { voice.source.stop(now + fade); } catch { this.release(voice); }
  }
  stopAll(): void {
    for (const voice of this.voices) this.stop(voice);
    this.dangerUntil = 0;
    const now = this.context.currentTime;
    for (const gain of this.bed.values()) {
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.setTargetAtTime(1, now, .025);
    }
  }
  /** Preserve the remaining buffer duration and release when hostile time changes. */
  setRate(voice: MixVoice, rate: number): void {
    if (voice.loop || voice.retiring || !this.voices.has(voice)) return;
    const now = this.context.currentTime;
    voice.consumed += Math.max(0, now - voice.rateUpdatedAt) * voice.rate;
    voice.rate = Math.max(.25, Math.min(3, rate)); voice.rateUpdatedAt = Math.max(now, voice.start);
    voice.end = Math.max(now, voice.start) + Math.max(0, voice.contentDuration - voice.consumed) / voice.rate;
    voice.source.playbackRate.setValueAtTime(voice.rate, now);
    voice.gain.gain.cancelAndHoldAtTime(now);
    const attackEnd = Math.max(now, voice.start) + Math.min(.004, Math.max(.001, voice.end - Math.max(now, voice.start)) / 3);
    if (now < voice.start) voice.gain.gain.setValueAtTime(0, voice.start);
    voice.gain.gain.linearRampToValueAtTime(voice.level, attackEnd);
    voice.gain.gain.setValueAtTime(voice.level, Math.max(attackEnd, voice.end - .018));
    voice.gain.gain.linearRampToValueAtTime(0, Math.max(now + .002, voice.end));
    voice.source.stop(voice.end);
  }
  /** Safety expiry for missed end events, with the same release ramp as explicit stops. */
  expire(voice: MixVoice, seconds: number): void {
    const end = this.context.currentTime + Math.max(.05, seconds);
    voice.gain.gain.setValueAtTime(voice.level, end - .025);
    voice.gain.gain.linearRampToValueAtTime(0, end);
    voice.end = end;
    voice.source.stop(end);
  }
  private release(voice: MixVoice): void {
    if (!this.voices.delete(voice)) return;
    voice.source.disconnect(); for (const node of voice.nodes) node.disconnect();
  }
  setVolumes(volumes: { master: number; music: number; effects: number }): void {
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime(volumes.master * .85, now, .025);
    this.effects.gain.setTargetAtTime(volumes.effects, now, .025);
    this.music.gain.setTargetAtTime(volumes.music, now, .15);
  }
  setBusVolume(bus: AudioBus, value: number): void { this.buses[bus].gain.setTargetAtTime(clamp(value), this.context.currentTime, .025); }
  duck(depth = .42, hold = .16): void {
    const now = this.context.currentTime;
    this.duckDepth = now < this.duckUntil ? Math.min(this.duckDepth, depth) : depth;
    this.duckUntil = Math.max(this.duckUntil, now + hold);
    for (const [param, amount] of [[this.duckMusic.gain, this.duckDepth], [this.duckAmbience.gain, Math.max(.22, this.duckDepth * .8)]] as const) {
      param.cancelAndHoldAtTime(now); param.setTargetAtTime(amount, now, .012);
      param.setTargetAtTime(1, this.duckUntil, .24);
    }
  }
  setTreatment(danger: number, slowed: boolean, overdrive: boolean): void {
    this.musicFilter.frequency.setTargetAtTime(slowed ? 1100 : danger > .7 ? 3600 : 20000, this.context.currentTime, .12);
    this.musicFocus.gain.setTargetAtTime(overdrive ? .66 : 1, this.context.currentTime, .12);
  }
  /** Dual reverbs let a room's old reflections decay through the crossfade. */
  setReverb(seconds: number, damping: number): void {
    const next = 1 - this.reverbIndex, bank = this.reverbs[next], now = this.context.currentTime;
    const rate = this.context.sampleRate;
    const pcm = impulseSamples(rate, seconds, damping), buffer = this.context.createBuffer(2, pcm[0].length, rate);
    buffer.getChannelData(0).set(pcm[0]); buffer.getChannelData(1).set(pcm[1]);
    bank.convolver.buffer = buffer;
    bank.gain.gain.setTargetAtTime(.5, now, .24);
    this.reverbs[this.reverbIndex].gain.gain.setTargetAtTime(0, now, .24);
    this.reverbIndex = next;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const voice of this.voices) { try { voice.source.stop(); } catch { /* ended */ } this.release(voice); }
    for (const node of this.nodes) node.disconnect();
    for (const bank of this.reverbs) bank.convolver.buffer = null;
    this.reverbs = []; this.nodes.length = 0;
  }
}
