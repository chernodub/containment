import type { GameEffect } from '../../DepthGame';
import type { CombatSnapshot } from '../combat/CombatSystem';
import type { QueenBossPhase } from '../enemies/QueenBossSystem';
import type { AbilityEvent } from '../abilities/contract';
import { ABILITY_CATALOG } from '../abilities/catalog';
import { elementalCueSamples, type ElementalCue } from './elementalCues';
import { DEFAULT_MASTER_VOLUME } from './preferences';
import type { AudioCombatState, AudioEnvironment, AudioListener, GameAudioDirector, UiCue } from './contract';
import { MixEngine, type MixVoice, type VoiceOptions } from './MixEngine';
import { SYNTH_SAMPLE_RATE, synthesize, type AudioBus, type CueRecipe } from './synthesis';
import { ABILITY_RECIPES, abilityLoopRecipe, abilityRecipe } from './abilityCues';
import { COMBAT_RECIPES, enemyRecipe, impactRecipe, weaponRecipe } from './combatCues';
import { ENVIRONMENT_PROFILES, ENVIRONMENT_RECIPES, HEARTBEAT_RECIPE } from './environmentCues';
import { UI_RECIPES, uiRecipe } from './uiCues';

export type AudioVolumes = Readonly<{ master: number; music: number; effects: number }>;
/** Context injection supports real OfflineAudioContext rendering without a fake playback path. */
export type AudioSystemOptions = { context?: BaseAudioContext; loadSamples?: boolean; prewarm?: boolean };
type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
const clamp01 = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
const FILES = [
  'pistol-1.wav', 'pistol-2.wav', 'pistol-3.wav', 'rifle-1.wav', 'rifle-2.wav', 'rifle-3.wav',
  'shotgun-1.wav', 'shotgun-2.wav', 'shotgun-3.wav', 'rocket.wav', 'plasma.wav', 'explosion.wav',
  'alien-impact.wav', 'switch.wav', 'click.wav', 'reload.wav', 'ambient.mp3', 'tension.mp3',
] as const;
type Sample = typeof FILES[number];
const encodedAssets = new Map<Sample, Promise<ArrayBuffer | null>>();
const loadEncoded = (name: Sample): Promise<ArrayBuffer | null> => {
  let request = encodedAssets.get(name);
  if (!request) {
    request = fetch(`${import.meta.env.BASE_URL}assets/audio/${name}`)
      .then(response => response.ok ? response.arrayBuffer() : null).catch(() => null);
    encodedAssets.set(name, request);
  }
  return request;
};
export const AUDIO_RECIPES: readonly CueRecipe[] = [
  ...COMBAT_RECIPES, ...ABILITY_RECIPES, ...ENVIRONMENT_RECIPES, ...UI_RECIPES, HEARTBEAT_RECIPE,
];
type Loop = { voice: MixVoice; ability: string };

/** Presentation-only director. Legacy methods and event routing share the same bounded graph. */
export class AudioSystem implements GameAudioDirector {
  private context: BaseAudioContext | null = null;
  private mixer: MixEngine | null = null;
  private volumes: AudioVolumes;
  private readonly buffers = new Map<Sample, AudioBuffer>();
  private readonly cueBuffers = new Map<string, AudioBuffer>();
  private readonly elementalBuffers = new Map<ElementalCue, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private frozenIds = new Set<number>();
  private frozenRoom = -1;
  private readonly variants = new Map<string, number>();
  private readonly lastPlayed = new Map<string, number>();
  private readonly loops = new Map<string, Loop>();
  private readonly pendingLoops = new Set<string>();
  private loopEpoch = 0;
  private stems: MixVoice[] = [];
  private reloadVoices: MixVoice[] = [];
  private ambience: MixVoice | null = null;
  private heartbeat: MixVoice | null = null;
  private environment: AudioEnvironment | null = null;
  private musicStartedAt = 0;
  private musicPosition = 0;
  private intensity = 0;
  private musicPaused = false;
  private effectsPaused = false;
  private destroyed = false;
  private hostileTimeScale = 1;
  private danger = 0;
  private overdrive = false;
  private boss = false;
  private bossPhase: 1 | 2 | 3 = 1;
  private previousCombat: CombatSnapshot | null = null;
  private warmTimer: ReturnType<typeof setTimeout> | null = null;
  private warmIndex = 0;
  private warmInFlight = false;
  private synthWorker: Worker | null = null;
  private workerFailed = false;
  private readonly pendingBuffers = new Map<string, Array<() => void>>();
  private readonly busVolumes = new Map<AudioBus, number>();
  private readonly stateChanged = () => {
    if (this.isOffline()) return;
    if (!this.context || this.context.state !== 'running') {
      this.stopLoops(); this.stopAmbience(); this.stopHeartbeat(); this.stopStems(); this.cancelReload();
    } else if (!this.effectsPaused) { this.startMusic(); this.startAmbience(); this.updateHeartbeat(); }
  };

  static async preload(): Promise<void> { await Promise.all(FILES.map(loadEncoded)); }
  constructor(volumes: Partial<AudioVolumes> = {}, private readonly options: AudioSystemOptions = {}) {
    this.volumes = {
      master: clamp01(volumes.master ?? DEFAULT_MASTER_VOLUME),
      music: clamp01(volumes.music ?? .65), effects: clamp01(volumes.effects ?? .8),
    };
  }
  /** Create/resume synchronously in the gesture before awaiting asset decoding. */
  async unlock(): Promise<boolean> {
    if (this.destroyed) return false;
    try {
      if (!this.context) {
        let context = this.options.context;
        if (!context) {
          if (typeof window === 'undefined') return false;
          const Audio = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
          if (!Audio) return false;
          context = new Audio();
        }
        this.context = context; this.mixer = new MixEngine(context, this.volumes);
        for (const [bus, value] of this.busVolumes) this.mixer.setBusVolume(bus, value);
        context.addEventListener('statechange', this.stateChanged);
      }
      const context = this.context;
      if ((context.state === 'suspended' || String(context.state) === 'interrupted') && 'resume' in context && !this.options.context) await (context as AudioContext).resume();
      if (this.destroyed || context !== this.context) return false;
      this.loading ??= this.options.loadSamples === false ? Promise.resolve() : Promise.all(FILES.map(async name => {
        try {
          const data = await loadEncoded(name);
          if (!data || this.destroyed) return;
          const buffer = await context.decodeAudioData(data.slice(0));
          if (!this.destroyed) { this.buffers.set(name, buffer); this.startMusic(); }
        } catch { /* A missing sample must not prevent synthesized fallback or other audio. */ }
      })).then(() => undefined);
      if (this.options.prewarm !== false) this.scheduleWarm();
      await this.loading;
      if (this.destroyed || context !== this.context) return false;
      this.startMusic(); this.startAmbience(); this.updateHeartbeat();
      this.mixer?.setTreatment(this.danger, this.hostileTimeScale < 1, this.overdrive);
      return this.usable();
    } catch { return false; }
  }
  setVolumes(volumes: Partial<AudioVolumes>): void {
    this.volumes = {
      master: clamp01(volumes.master ?? this.volumes.master), music: clamp01(volumes.music ?? this.volumes.music),
      effects: clamp01(volumes.effects ?? this.volumes.effects),
    };
    this.mixer?.setVolumes(this.volumes);
    if (this.volumes.master === 0) { this.stopLoops(); this.stopAmbience(); this.stopHeartbeat(); this.stopStems(); }
    else { this.startMusic(); this.startAmbience(); this.updateHeartbeat(); }
    if (this.volumes.effects === 0) { this.stopLoops(); this.stopAmbience(); this.stopHeartbeat(); }
    if (this.volumes.music === 0) this.stopStems();
  }
  setMasterVolume(value: number): void { this.setVolumes({ master: value }); }
  setMusicVolume(value: number): void { this.setVolumes({ music: value }); }
  setEffectsVolume(value: number): void { this.setVolumes({ effects: value }); }
  /** Additive settings API; effects controls all six non-music buses including ambience/UI. */
  setBusVolume(bus: AudioBus, value: number): void { this.busVolumes.set(bus, clamp01(value)); this.mixer?.setBusVolume(bus, value); }
  setMusicIntensity(value: number): void {
    const next = clamp01(value);
    if (Math.abs(next - this.intensity) < .01) return;
    this.intensity = next; this.mixMusic();
  }
  /** Optional richer boss snapshot hook; the frozen coarse state has no phase field. */
  setBossPhase(phase: 1 | 2 | 3 | QueenBossPhase): void {
    const next = typeof phase === 'number' ? phase : phase === 'nest-spawn' ? 2 : phase === 'vulnerable' ? 3 : 1;
    if (next === this.bossPhase) return;
    this.bossPhase = next;
    if (this.boss && phase !== 'idle' && phase !== 'defeated') this.enemy(next === 1 ? 'queen' : `queen-phase-${next}`, 'warning', true);
  }
  pauseMusic(): void { this.musicPaused = true; this.stopStems(); }
  pauseAll(): void {
    this.effectsPaused = true; this.pauseMusic(); this.stopLoops(); this.stopAmbience(); this.stopHeartbeat();
    this.mixer?.stopAll(); this.reloadVoices.length = 0;
  }
  resumeMusic(): void { if (!this.destroyed) { this.musicPaused = false; this.startMusic(); } }
  resumeAll(): void {
    if (this.destroyed) return;
    this.effectsPaused = false; this.resumeMusic(); this.startAmbience(); this.updateHeartbeat();
    this.mixer?.setTreatment(this.danger, this.hostileTimeScale < 1, this.overdrive);
    // Ability loops require fresh authoritative events; stale paused zones are never resurrected.
    if (this.previousCombat?.reloading) this.playReload(this.previousCombat.reloadRemainingMs, true);
  }
  setEnvironment(environment: AudioEnvironment | null): void {
    if (environment === this.environment) return;
    this.stopLoops(); this.stopAmbience(.8); this.stopHeartbeat(); this.cancelReload(); this.frozenIds.clear();
    this.environment = environment;
    if (environment) { this.startAmbience(); this.updateHeartbeat(); }
  }
  setCombatState(state: AudioCombatState): void {
    if (state.paused !== this.effectsPaused) { if (state.paused) this.pauseAll(); else this.resumeAll(); }
    this.setMusicIntensity(Math.max(state.intensity, state.boss ? .7 : 0));
    const scale = Number.isFinite(state.hostileTimeScale) ? Math.max(.1, Math.min(1, state.hostileTimeScale)) : 1;
    const danger = clamp01(state.danger);
    const scaleChanged = scale !== this.hostileTimeScale;
    if (scaleChanged) {
      const ratio = Math.sqrt(scale / this.hostileTimeScale);
      this.hostileTimeScale = scale;
      if (this.mixer) for (const voice of this.mixer.voices) if (voice.bus === 'enemies' && !voice.loop) this.mixer.setRate(voice, voice.rate * ratio);
    }
    if (state.overdrive !== this.overdrive || danger !== this.danger || state.boss !== this.boss || scaleChanged) {
      if (state.boss && !this.boss) this.playUi('boss-intro');
      this.danger = danger; this.overdrive = state.overdrive; this.boss = state.boss;
      if (!this.effectsPaused) this.mixer?.setTreatment(danger, scale < 1, state.overdrive);
      this.updateHeartbeat();
    }
  }
  handleEffect(effect: GameEffect, listener: AudioListener): void {
    const dx = effect.x - listener.x, dy = effect.y - listener.y;
    const pan = Math.max(-.85, Math.min(.85, dx / 500)), distance = Math.hypot(dx, dy);
    if (effect.type === 'ability' && effect.ability) { this.handleAbility(effect.ability, pan, distance); return; }
    if (effect.type === 'shot') this.weapon(effect.weapon ?? 'pistol', pan, distance);
    else if (effect.type === 'hit' && effect.contact) this.cue(impactRecipe(effect.lethal ? 'kill' : effect.contact === 'armor' ? 'armor' : effect.contact === 'blocked' ? 'blocked' : 'flesh'), { pan, distance });
    else if (effect.type === 'corpse') { this.cue(impactRecipe('body'), { pan, distance }); this.enemy(effect.family ?? 'crawler', 'death', effect.elite, pan, distance); }
    else if (effect.type === 'wall-slam') this.cue(impactRecipe('wall'), { pan, distance });
    else if (effect.type === 'explosion') this.explosion((effect.radius ?? 120) > 180 ? 'large-explosion' : (effect.radius ?? 120) < 80 ? 'small-explosion' : 'explosion', pan, distance);
    else if (effect.type === 'enemy-warning' || effect.type === 'enemy-attack') {
      const family = effect.family ?? (effect.id === -1 ? this.bossPhase === 1 ? 'queen' : `queen-phase-${this.bossPhase}` : 'crawler');
      this.enemy(family, effect.type === 'enemy-warning' ? 'warning' : 'attack', effect.elite, pan, distance);
    }
    else if (effect.type === 'hurt') this.cue(impactRecipe('hurt'));
    else if (effect.type === 'pickup') this.playPickup();
    else if (effect.type === 'acid') this.enemy('spitter', 'attack', false, pan, distance);
    else if (effect.type === 'boon') {
      if (effect.boon === 'shatter') this.playElemental('shatter');
      else if (effect.boon === 'overload') this.playElemental('reactor');
    }
  }
  playUi(cue: UiCue): void {
    if (cue === 'death' || cue === 'victory' || cue === 'room-clear') { this.stopLoops(); this.stopHeartbeat(); }
    if (cue === 'death' || cue === 'victory') this.stopAmbience();
    this.cue(uiRecipe(cue));
    if (cue === 'boss-intro' || cue === 'overdrive-ready') this.duck(.32, .65);
  }
  playPistol(): void { this.weapon('pistol'); }
  playRifle(): void { this.weapon('rifle'); }
  playShotgun(): void { this.weapon('shotgun'); }
  playPlasma(): void { this.weapon('plasma'); }
  playRocket(): void { this.weapon('rocket'); }
  playGrenade(): void { this.cue(impactRecipe('grenade')); }
  playExplosion(pan = 0, distance = 0): void { this.explosion('explosion', pan, distance); }
  playAlien(pan = 0, distance = 0): void { this.enemy('crawler', 'attack', false, pan, distance); }
  playConfirmedHit(blocked = false): void { this.cue(impactRecipe(blocked ? 'armor' : 'flesh'), {}, 'confirmed-hit', .055); }
  playBodyImpact(pan = 0, distance = 0): void { this.cue(impactRecipe('body'), { pan, distance }); }
  playElemental(kind: ElementalCue): void {
    if (!this.rateLimit(`elemental-${kind}`, kind === 'reactor' ? .22 : kind === 'freeze' ? .14 : .10)) return;
    let buffer = this.elementalBuffers.get(kind);
    if (!buffer) { buffer = this.pcmBuffer(elementalCueSamples(kind, SYNTH_SAMPLE_RATE), SYNTH_SAMPLE_RATE); this.elementalBuffers.set(kind, buffer); }
    this.mixer!.play(buffer, { bus: 'impacts', level: .65, priority: 55 });
  }
  syncFrozen(ids: readonly number[], roomRevision: number): void {
    if (this.effectsPaused || this.destroyed) return;
    if (roomRevision !== this.frozenRoom) { this.frozenRoom = roomRevision; this.frozenIds.clear(); this.stopLoops(); }
    let onset = false;
    for (let i = 0; i < ids.length; i++) if (!this.frozenIds.has(ids[i])) { onset = true; break; }
    if (onset) this.playElemental('freeze');
    this.frozenIds.clear(); for (let i = 0; i < ids.length; i++) this.frozenIds.add(ids[i]);
  }
  playPickup(): void { this.cue(uiRecipe('purchase'), {}, 'pickup', .09); }
  playAlarm(): void { this.playUi('boss-intro'); }
  /** Legacy gesture helper; paused menu clicks remain available as before. */
  playUI(): void {
    if (this.usable()) this.cue(uiRecipe('select'), {}, undefined, undefined, true);
    else void this.unlock().then(ok => { if (ok) this.cue(uiRecipe('select'), {}, undefined, undefined, true); });
  }
  syncCombat(snapshot: CombatSnapshot): void {
    const previous = this.previousCombat; this.previousCombat = snapshot;
    if (snapshot.dead) { this.stopLoops(); this.stopAmbience(); this.stopHeartbeat(); }
    else if (previous?.dead) { this.startAmbience(); this.updateHeartbeat(); }
    if (snapshot.dead || !snapshot.reloading || previous?.weaponId !== snapshot.weaponId) this.cancelReload();
    if (previous && previous.weaponId !== snapshot.weaponId && !snapshot.dead) this.cue(impactRecipe('switch'));
    if (snapshot.reloading && (!previous?.reloading || previous.weaponId !== snapshot.weaponId)) this.playReload(snapshot.reloadRemainingMs);
  }
  /** Stable diagnostics for tests/audition, never used to influence gameplay. */
  get diagnostics(): Readonly<{ voices: number; loops: number; buffers: number; admitted: number; rejected: number; highWater: number; warmed: number }> {
    return { voices: this.mixer?.voices.size ?? 0, loops: this.loops.size, buffers: this.cueBuffers.size,
      admitted: this.mixer?.admitted ?? 0, rejected: this.mixer?.rejected ?? 0, highWater: this.mixer?.highWater ?? 0, warmed: this.warmIndex };
  }
  destroy(): void {
    if (this.destroyed) return;
    this.pauseAll(); this.destroyed = true;
    if (this.warmTimer !== null) clearTimeout(this.warmTimer); this.warmTimer = null;
    this.synthWorker?.terminate(); this.synthWorker = null; this.pendingBuffers.clear();
    this.buffers.clear(); this.cueBuffers.clear(); this.elementalBuffers.clear(); this.frozenIds.clear(); this.lastPlayed.clear(); this.variants.clear(); this.previousCombat = null;
    this.mixer?.destroy(); this.mixer = null;
    const context = this.context; this.context = null;
    context?.removeEventListener('statechange', this.stateChanged);
    if (context && 'close' in context && context.state !== 'closed') void (context as AudioContext).close().catch(() => undefined);
  }

  private isOffline(): boolean { return !!this.options.context && 'startRendering' in this.options.context; }
  private usable(): boolean { return !this.destroyed && this.context !== null && (this.context.state === 'running' || (this.isOffline() && this.context.state === 'suspended')) && this.mixer !== null; }
  private audible(allowPaused = false): boolean { return this.usable() && this.volumes.master > 0 && this.volumes.effects > 0 && (!this.effectsPaused || allowPaused); }
  private rateLimit(key: string, interval: number, allowPaused = false): boolean {
    if (!this.audible(allowPaused)) return false;
    const now = this.context!.currentTime;
    if (now - (this.lastPlayed.get(key) ?? -Infinity) < interval) return false;
    this.lastPlayed.set(key, now); return true;
  }
  private pcmBuffer(pcm: Float32Array, rate: number): AudioBuffer {
    const buffer = this.context!.createBuffer(1, pcm.length, rate); buffer.getChannelData(0).set(pcm); return buffer;
  }
  private buffer(recipe: CueRecipe, variant = 0): AudioBuffer {
    const key = `${recipe.id}:${variant}`;
    let buffer = this.cueBuffers.get(key);
    if (!buffer) { buffer = this.pcmBuffer(synthesize(recipe, SYNTH_SAMPLE_RATE, variant), SYNTH_SAMPLE_RATE); this.cueBuffers.set(key, buffer); }
    return buffer;
  }
  private cue(recipe: CueRecipe, options: Partial<VoiceOptions> = {}, key = recipe.id, interval = recipe.interval ?? .06, allowPaused = false): MixVoice | null {
    if (!this.rateLimit(key, interval, allowPaused)) return null;
    return this.mixer!.play(this.buffer(recipe), { bus: recipe.bus, priority: recipe.priority ?? 45, ...options });
  }
  private weapon(id: 'pistol' | 'rifle' | 'shotgun' | 'plasma' | 'rocket', pan = 0, distance = 0): void {
    const recipe = weaponRecipe(id);
    if (!this.rateLimit(recipe.id, recipe.interval ?? .045)) return;
    const variant = (this.variants.get(id) ?? 0) % 3; this.variants.set(id, variant + 1);
    const rate = [.988, 1.009, 1.022][variant], level = [.98, 1, .96][variant];
    this.mixer!.play(this.buffer(recipe, variant), { bus: 'weapons', level, pan, distance, rate, priority: 65 });
    const name = (id === 'plasma' || id === 'rocket' ? `${id}.wav` : `${id}-${variant + 1}.wav`) as Sample;
    this.sample(name, id === 'shotgun' ? .27 : .23, { bus: 'weapons', priority: 60, pan, distance, rate });
    if (id === 'pistol' || id === 'shotgun' || id === 'rifle') this.cue(impactRecipe('shell'), { pan, distance, delay: id === 'shotgun' ? .32 : .15, level: .3 });
  }
  private sample(name: Sample, level: number, options: VoiceOptions): MixVoice | null {
    if (!this.audible()) return null;
    const buffer = this.buffers.get(name);
    return buffer ? this.mixer!.play(buffer, { ...options, level }) : null;
  }
  private explosion(kind: 'small-explosion' | 'explosion' | 'large-explosion', pan: number, distance: number): void {
    if (!this.cue(impactRecipe(kind), { pan, distance }, 'explosion', .07)) return;
    this.sample('explosion.wav', kind === 'large-explosion' ? .38 : .28, { bus: 'impacts', priority: 75, pan, distance });
    this.duck(kind === 'large-explosion' ? .25 : .45, .30);
  }
  private enemy(family: string, phase: 'warning' | 'attack' | 'death', elite = false, pan = 0, distance = 0): void {
    const voice = this.cue(enemyRecipe(family, phase, elite), { pan, distance, rate: Math.sqrt(this.hostileTimeScale) });
    if (voice) this.sample('alien-impact.wav', .13, { bus: 'enemies', priority: 25, pan, distance, rate: .7 * Math.sqrt(this.hostileTimeScale) });
    if (elite || family === 'queen') this.duck(.6, .22);
  }
  private handleAbility(event: AbilityEvent, pan: number, distance: number): void {
    if (event.phase === 'denied' || event.phase === 'ready' || event.phase === 'overdrive-ready') {
      this.playUi(event.phase === 'denied' ? 'denied' : event.phase === 'ready' ? 'ability-ready' : 'overdrive-ready'); return;
    }
    const key = `${event.ability}:${event.entityId ?? 'self'}`;
    if (event.phase === 'end' || event.phase === 'burst') this.stopLoop(key);
    this.cue(abilityRecipe(event), { pan, distance });
    const recipe = abilityLoopRecipe(event.ability);
    // The first entity tick precedes activation impact, which has no ID. A fresh
    // periodic tick may also restore a loop after pause; explicit end still owns expiry.
    const loopStart = event.entityId !== undefined
      ? event.phase === 'tick' || event.phase === 'impact'
      : event.ability === 'overclock' && event.phase === 'impact';
    if (recipe && loopStart && !this.loops.has(key) && !this.pendingLoops.has(key) && this.audible() && !this.previousCombat?.dead && this.loops.size + this.pendingLoops.size < 8) {
      const expiresAt = this.context!.currentTime + (event.durationMs || ABILITY_CATALOG[event.ability].durationMs || 3000) / 1000 + .1;
      const epoch = this.loopEpoch;
      if (!this.cueBuffers.has(`${recipe.id}:0`)) {
        this.pendingLoops.add(key);
        const requested = this.requestWorkerBuffer(recipe, () => {
          if (epoch !== this.loopEpoch || !this.pendingLoops.delete(key)) return;
          this.startAbilityLoop(recipe, key, event.ability, pan, distance, expiresAt);
        });
        if (!requested) { this.pendingLoops.delete(key); this.startAbilityLoop(recipe, key, event.ability, pan, distance, expiresAt); }
      } else this.startAbilityLoop(recipe, key, event.ability, pan, distance, expiresAt);
    }
    if (event.slot === 'overdrive' && (event.phase === 'impact' || event.phase === 'cast')) this.duck(.24, .65);
  }
  private startAbilityLoop(recipe: CueRecipe, key: string, ability: string, pan: number, distance: number, expiresAt: number): void {
    if (!this.audible() || this.previousCombat?.dead || expiresAt <= this.context!.currentTime + .02) return;
    const voice = this.mixer!.play(this.buffer(recipe), { bus: 'abilities', priority: 60, pan, distance, loop: true, level: .8, fadeIn: .2 });
    if (!voice) return;
    this.loops.set(key, { voice, ability }); this.mixer!.expire(voice, expiresAt - this.context!.currentTime);
    voice.source.addEventListener('ended', () => { if (this.loops.get(key)?.voice === voice) this.loops.delete(key); }, { once: true });
  }
  private stopLoop(key: string): void { this.pendingLoops.delete(key); const loop = this.loops.get(key); if (loop) { this.mixer?.stop(loop.voice); this.loops.delete(key); } }
  private stopLoops(): void { this.loopEpoch++; this.pendingLoops.clear(); for (const loop of this.loops.values()) this.mixer?.stop(loop.voice); this.loops.clear(); }
  private startAmbience(): void {
    if (!this.environment || !this.audible() || this.ambience || this.previousCombat?.dead) return;
    const profile = ENVIRONMENT_PROFILES[this.environment];
    if (!this.cueBuffers.has(`${profile.recipe.id}:0`) && this.requestWorkerBuffer(profile.recipe, () => this.startAmbience())) return;
    this.mixer!.setReverb(profile.reverbSeconds, profile.damping);
    this.ambience = this.mixer!.play(this.buffer(profile.recipe), { bus: 'ambience', priority: 95, loop: true, fadeIn: .8 });
  }
  private stopAmbience(fade = .018): void { if (this.ambience) this.mixer?.stop(this.ambience, fade); this.ambience = null; }
  private updateHeartbeat(): void {
    if (this.danger < .7 || !this.audible() || this.previousCombat?.dead) { this.stopHeartbeat(); return; }
    if (!this.heartbeat) this.heartbeat = this.mixer!.play(this.buffer(HEARTBEAT_RECIPE), { bus: HEARTBEAT_RECIPE.bus, priority: 90, loop: true, level: .38 });
  }
  private stopHeartbeat(): void { if (this.heartbeat) this.mixer?.stop(this.heartbeat); this.heartbeat = null; }
  private duck(depth: number, hold: number): void { if (this.audible()) this.mixer?.duck(depth, hold); }
  private playReload(durationMs: number, resume = false): void {
    this.cancelReload(); if (!this.audible()) return;
    const duration = Math.max(.15, durationMs / 1000);
    const cues = resume ? [[Math.max(0, duration - .36), 1, .34]] : [[0, .08, .2], [Math.max(.08, duration * .48 - .1), .52, .3], [Math.max(.12, duration - .36), 1, .34]];
    for (const [delay, offset, length] of cues) {
      const voice = this.mixer!.play(this.buffer(impactRecipe('reload')), { bus: 'weapons', level: .65, priority: 60, delay });
      if (voice) this.reloadVoices.push(voice);
      const sample = this.sample('reload.wav', .4, { bus: 'weapons', priority: 60, delay, offset, duration: length });
      if (sample) this.reloadVoices.push(sample);
    }
  }
  private cancelReload(): void { for (const voice of this.reloadVoices) this.mixer?.stop(voice); this.reloadVoices.length = 0; }
  private stopStems(): void {
    if (this.context && this.stems.length) this.musicPosition += this.context.currentTime - this.musicStartedAt;
    for (const voice of this.stems) this.mixer?.stop(voice); this.stems.length = 0;
  }
  private startMusic(): void {
    if (!this.usable() || this.musicPaused || this.stems.length || this.volumes.master === 0 || this.volumes.music === 0) return;
    if (!this.buffers.has('ambient.mp3') || !this.buffers.has('tension.mp3')) return;
    this.musicStartedAt = this.context!.currentTime;
    for (const name of ['ambient.mp3', 'tension.mp3'] as const) {
      const buffer = this.buffers.get(name)!;
      const voice = this.mixer!.play(buffer, { bus: 'music', level: 0, priority: 100, loop: true, offset: this.musicPosition % buffer.duration });
      if (voice) this.stems.push(voice);
    }
    this.mixMusic();
  }
  private mixMusic(): void {
    if (!this.context) return;
    const mix = clamp01((this.intensity - .20) / .65);
    const now = this.context.currentTime;
    if (this.stems[0]) { this.stems[0].gain.gain.cancelAndHoldAtTime(now); this.stems[0].gain.gain.setTargetAtTime(Math.cos(mix * Math.PI / 2) * .62, now, 1.1); }
    if (this.stems[1]) { this.stems[1].gain.gain.cancelAndHoldAtTime(now); this.stems[1].gain.gain.setTargetAtTime(Math.sin(mix * Math.PI / 2) * .56, now, 1.1); }
  }
  private scheduleWarm(): void {
    if (this.warmTimer !== null || this.warmInFlight || this.warmIndex >= AUDIO_RECIPES.length || this.destroyed) return;
    this.warmTimer = setTimeout(() => {
      this.warmTimer = null;
      if (this.destroyed || !this.context) return;
      const recipe = AUDIO_RECIPES[this.warmIndex];
      if (!this.cueBuffers.has(`${recipe.id}:0`)) {
        this.warmInFlight = true;
        if (this.requestWorkerBuffer(recipe, () => { this.warmInFlight = false; this.warmIndex++; this.scheduleWarm(); })) return;
        this.warmInFlight = false; this.buffer(recipe);
      }
      this.warmIndex++;
      this.scheduleWarm();
    }, 24);
  }
  /** Workers are optional; unsupported/failed workers fall back to one task per recipe. */
  private requestWorkerBuffer(recipe: CueRecipe, done: () => void): boolean {
    if (this.options.prewarm === false || this.workerFailed || typeof Worker === 'undefined' || this.destroyed) return false;
    if (!this.synthWorker) {
      try {
        this.synthWorker = new Worker(new URL('./synthesisWorker.ts', import.meta.url), { type: 'module' });
        this.synthWorker.onmessage = (event: MessageEvent<{ key: string; samples?: ArrayBuffer; error?: boolean }>) => {
          if (this.destroyed || !this.context) return;
          const { key, samples, error } = event.data;
          const callbacks = this.pendingBuffers.get(key); this.pendingBuffers.delete(key);
          if (error || !samples) { this.workerFailed = true; this.synthWorker?.terminate(); this.synthWorker = null; }
          else if (!this.cueBuffers.has(key)) this.cueBuffers.set(key, this.pcmBuffer(new Float32Array(samples), SYNTH_SAMPLE_RATE));
          if (callbacks) for (const callback of callbacks) callback();
        };
        this.synthWorker.onerror = () => {
          this.workerFailed = true; this.synthWorker?.terminate(); this.synthWorker = null;
          const pending = [...this.pendingBuffers.values()]; this.pendingBuffers.clear();
          for (const callbacks of pending) for (const callback of callbacks) callback();
        };
      } catch { this.workerFailed = true; return false; }
    }
    const key = `${recipe.id}:0`, pending = this.pendingBuffers.get(key);
    if (pending) { pending.push(done); return true; }
    this.pendingBuffers.set(key, [done]); this.synthWorker.postMessage({ key, recipe }); return true;
  }
}
