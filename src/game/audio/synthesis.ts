/** Pure, seeded PCM authoring. No AudioContext, wall clock or random global state. */
export type CueFamily = 'weapon' | 'impact' | 'ability' | 'loop' | 'enemy' | 'ui' | 'stinger' | 'ambience';
export type AudioBus = 'music' | 'ambience' | 'weapons' | 'abilities' | 'enemies' | 'impacts' | 'ui';
export type SynthLayer = Readonly<{
  wave: 'sine' | 'metal' | 'noise' | 'pluck';
  gain: number;
  frequency?: number;
  endFrequency?: number;
  delay?: number;
  duration?: number;
  attack?: number;
  decay?: number;
  cutoff?: number;
  highpass?: boolean;
  fm?: number;
  modRate?: number;
  am?: number;
  pulse?: number;
}>;
export type CueRecipe = Readonly<{
  id: string;
  family: CueFamily;
  bus: AudioBus;
  duration: number;
  layers: readonly SynthLayer[];
  seed?: number;
  /** Defaults to the family target; quieter mechanical details can override. */
  rms?: number;
  peak?: number;
  priority?: number;
  interval?: number;
  loop?: boolean;
}>;

/** Linear PCM budgets before bus gain. Peak caps leave room for concurrent cues. */
export const FAMILY_LEVELS: Readonly<Record<CueFamily, Readonly<{ rms: number; peak: number }>>> = {
  weapon: { rms: .14, peak: .70 }, impact: { rms: .10, peak: .55 },
  ability: { rms: .15, peak: .72 }, loop: { rms: .055, peak: .27 },
  enemy: { rms: .085, peak: .48 }, ui: { rms: .045, peak: .24 },
  stinger: { rms: .10, peak: .55 }, ambience: { rms: .04, peak: .20 },
};
export const SYNTH_SAMPLE_RATE = 24_000;

/** Stable seed for a recipe or a round-robin variant. */
export function cueSeed(id: string): number {
  let seed = 2166136261;
  for (let i = 0; i < id.length; i++) seed = Math.imul(seed ^ id.charCodeAt(i), 16777619);
  return seed >>> 0;
}

/** Layer filtered noise, swept FM, inharmonic metal and damped delay-line plucks. */
export function synthesize(recipe: CueRecipe, sampleRate = SYNTH_SAMPLE_RATE, variant = 0): Float32Array {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000) throw new Error('Invalid audio sample rate');
  if (!(recipe.duration > 0 && recipe.duration <= 12)) throw new Error('Invalid cue duration');
  const samples = new Float32Array(Math.ceil(recipe.duration * sampleRate));
  let seed = (recipe.seed ?? cueSeed(recipe.id)) ^ Math.imul(variant + 1, 2654435761);
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  for (const layer of recipe.layers) {
    const delay = layer.delay ?? 0, duration = layer.duration ?? recipe.duration - delay;
    const start = Math.round(delay * sampleRate), count = Math.min(samples.length - start, Math.ceil(duration * sampleRate));
    let phase = 0, low = 0;
    const frequency = layer.frequency ?? 180, end = layer.endFrequency ?? frequency;
    let currentFrequency = frequency, envelope = 1;
    const frequencyStep = Math.pow(end / frequency, 1 / (duration * sampleRate));
    const envelopeStep = Math.exp(-(layer.decay ?? (recipe.loop ? 0 : 4)) / (duration * sampleRate));
    const alpha = 1 - Math.exp(-2 * Math.PI * Math.min(layer.cutoff ?? 7000, sampleRate * .45) / sampleRate);
    const line = layer.wave === 'pluck' ? new Float32Array(Math.max(3, Math.round(sampleRate / frequency))) : null;
    if (line) for (let j = 0; j < line.length; j++) line[j] = random();
    for (let i = 0; i < count; i++) {
      const t = i / sampleRate;
      let value: number;
      if (line) {
        const j = i % line.length;
        value = line[j]; line[j] = .496 * (value + line[(j + 1) % line.length]);
      } else if (layer.wave === 'noise') value = random();
      else {
        phase += 2 * Math.PI * currentFrequency / sampleRate;
        currentFrequency *= frequencyStep;
        const fm = (layer.fm ?? 0) * Math.sin(phase * (layer.modRate ?? 1.43));
        value = Math.sin(phase + fm);
        if (layer.wave === 'metal') value = .56 * value + .28 * Math.sin(phase * 1.483 + fm) + .16 * Math.sin(phase * 2.731);
      }
      low += alpha * (value - low);
      value = layer.highpass ? value - low : low;
      // A bed's entry fade belongs on the source gain, not inside repeating PCM.
      // Keep authored short attacks for drips, clock ticks and heartbeats.
      const persistent = recipe.loop && delay === 0 && duration >= recipe.duration * .9;
      const attack = Math.min(1, t / (persistent ? .003 : layer.attack ?? .004));
      const release = Math.min(1, (duration - t) / (persistent ? .003 : .025));
      const amplitude = layer.am ? 1 - layer.am * (.5 + .5 * Math.cos(2 * Math.PI * (layer.pulse ?? 7) * t)) : 1;
      samples[start + i] += value * layer.gain * attack * release * envelope * amplitude;
      envelope *= envelopeStep;
    }
  }
  // Remove DC, taper both edges, then level-match without flattening transients.
  let mean = 0;
  for (let i = 0; i < samples.length; i++) mean += samples[i];
  mean /= samples.length;
  let energy = 0, peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const taper = Math.min(1, i / (sampleRate * .003), (samples.length - 1 - i) / (sampleRate * (recipe.loop ? .003 : .012)));
    samples[i] = (samples[i] - mean) * taper;
    energy += samples[i] * samples[i]; peak = Math.max(peak, Math.abs(samples[i]));
  }
  const target = FAMILY_LEVELS[recipe.family];
  const gain = Math.min((recipe.rms ?? target.rms) / Math.max(1e-9, Math.sqrt(energy / samples.length)), (recipe.peak ?? target.peak) / Math.max(1e-9, peak));
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  samples[0] = samples[samples.length - 1] = 0;
  return samples;
}

/** Deterministic stereo room response: diffuse decay plus authored early reflections. */
export function impulseSamples(sampleRate: number, seconds: number, damping: number, seed = 173): [Float32Array, Float32Array] {
  const length = Math.ceil(sampleRate * seconds);
  const channels: [Float32Array, Float32Array] = [new Float32Array(length), new Float32Array(length)];
  for (let channel = 0; channel < 2; channel++) {
    let low = 0;
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      low += damping * (seed / 2147483648 - 1 - low);
      channels[channel][i] = low * Math.exp(-6.9 * i / length) * .09;
    }
    for (const time of [.019, .037, .071]) channels[channel][Math.floor((time + channel * .003) * sampleRate)] += .25;
    channels[channel][0] = channels[channel][length - 1] = 0;
  }
  return channels;
}
