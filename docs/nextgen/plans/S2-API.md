# S2 audio public API and integration

Audio is a presentation subscriber. All existing public methods remain callable. Frozen shared contracts/catalogs and application code are unchanged.

```ts
import { AudioSystem, AUDIO_RECIPES } from 'src/game/audio/AudioSystem';

new AudioSystem(
  volumes?: Partial<Readonly<{master:number;music:number;effects:number}>>,
  options?: {context?:BaseAudioContext;loadSamples?:boolean;prewarm?:boolean},
);
AudioSystem.preload():Promise<void>;
audio.unlock():Promise<boolean>;
audio.handleEffect(effect:GameEffect,listener:Readonly<{x:number;y:number}>):void;
audio.playUi(cue:UiCue):void;
audio.setEnvironment(environment:AudioEnvironment|null):void;
audio.setCombatState(state:AudioCombatState):void;
audio.setBossPhase(phase:1|2|3|QueenBossPhase):void; // optional richer Queen snapshot hook

audio.setVolumes(volumes:Partial<AudioVolumes>):void;
audio.setMasterVolume(value:number):void;
audio.setMusicVolume(value:number):void;
audio.setEffectsVolume(value:number):void;
audio.setBusVolume(bus:AudioBus,value:number):void;
audio.setMusicIntensity(value:number):void;
audio.pauseMusic():void;
audio.resumeMusic():void;
audio.pauseAll():void;
audio.resumeAll():void;
audio.destroy():void;

audio.playPistol():void; audio.playRifle():void; audio.playShotgun():void;
audio.playPlasma():void; audio.playRocket():void; audio.playGrenade():void;
audio.playExplosion(pan?:number,distance?:number):void;
audio.playAlien(pan?:number,distance?:number):void;
audio.playConfirmedHit(blocked?:boolean):void;
audio.playBodyImpact(pan?:number,distance?:number):void;
audio.playElemental(kind:'freeze'|'shatter'|'reactor'):void;
audio.syncFrozen(ids:readonly number[],roomRevision:number):void;
audio.playPickup():void; audio.playAlarm():void; audio.playUI():void;
audio.syncCombat(snapshot:CombatSnapshot):void;
audio.diagnostics:Readonly<{
  voices:number;loops:number;buffers:number;admitted:number;
  rejected:number;highWater:number;warmed:number;
}>;

type AudioBus='music'|'ambience'|'weapons'|'abilities'|'enemies'|'impacts'|'ui';
```

The existing `GameAudioDirector`, `AudioCombatState`, `AudioEnvironment`, `AudioListener`, and `UiCue` signatures in `src/game/audio/contract.ts` are implemented unchanged. `MixEngine` and pure `synthesize(recipe,sampleRate?,variant?)` are exported for authoring/offline tests, not simulation.

## Application hooks (owned by UI stream)

1. Replace the old audio effect switch with one `audio.handleEffect(e,{x:game.player.x,y:game.player.y})`. Keep the renderer/reticle callbacks. Remove redundant legacy sound calls in that same path to avoid double shots/confirmations.
2. Push coarse state with `setCombatState`: intensity, boss presence, `abilities.overdrive.active`, danger (1 minus health fraction), `abilities.hostileTimeScale`, and paused. Keep `syncCombat` for authoritative reload/switch/death transitions; `syncFrozen` remains available for freeze onsets not explicitly emitted by the simulation.
3. On room change, call `setEnvironment(environment)` using the authored environment ID. Call `setEnvironment(null)` on room exit/menu; this clears ability loops even when the next room has the same environment. Existing `syncFrozen(...,roomRevision)` also clears old loops on revision changes.
4. Call `playUi` for all menu/reward/checkpoint/presentation beats. Continue using existing `pauseAll`/`resumeAll` for pause, visibility and graphics recovery. `playUi` schedules no paused sound; the legacy gesture helper `playUI()` preserves existing paused-menu click behavior. Call the death/victory stinger before pausing the whole engine if it should be heard.
5. Optional: forward Queen `snapshot.phase` through `setBossPhase` (armored = base voice, nest-spawn = second voice, vulnerable = third voice). The coarse frozen audio state carries only `boss:boolean`; it cannot carry phase by itself. Champion/warden/matron recipes exist, but current GameEffect only carries native family/elite, so those events use their family-specific elite identity until richer champion metadata is supplied. No gameplay inference is performed in audio.

## Lifecycle and performance

All non-music buses feed the real effects fader, including ambience/UI/reverb; music has its own fader/filter/focus/duck chain. Master starts at persisted silence before any source exists. Sources have envelope ramps, a gentle compressor and a final bounded waveshaper. Admission: 40 active voices, 48 physical voices including eight reserved fading tails, ten loop voices maximum. Important arrivals steal lower-priority one-shots; loops are protected. Event/cue rate limits bound repeated accents.

Persistent entity ticks start one keyed loop. End/burst stops the matching entity; room exit, pause, mute, death, context interruption and destroy force-stop all loops. A fresh periodic entity tick can restore a paused field after resume; no stale cached activation automatically replays. Catalog/event expiry is a ramped safety fallback. Pending worker returns cannot resurrect stopped or expired loops.

Prewarming produces one recipe at a time in an original local module worker, transferring PCM into cached AudioBuffers. Long ambience/ability beds also use the worker on a cache miss. Worker absence/error falls back to one synchronous recipe per scheduled task. Short uncached one-shots can synthesize synchronously, preserving input response. No unseeded randomness or new dependencies; synthesis does not alter simulation.

## Audition and evidence

Run `npm run dev`, then open `/scripts/nextgen/audio-audition.html` on that Vite origin. This entry is guarded by `import.meta.env.DEV` and is absent from the production build. It includes all recipe buttons, every ability phase/UI cue/environment, real layered weapons, reactive state controls, category and bus faders.

Run `node scripts/nextgen/audio-evidence.mjs` to create the full inventory, WAVs and waveform/spectrogram PNGs in `artifacts/nextgen/s2-audio/`. The runner uses Chromium OfflineAudioContext, the production MixEngine/AudioSystem, local licensed samples, and deterministic scripted events. JSON contains raw and rendered metrics, loop seam measurements, initialization timings, category/duck-aware bus taps and the limited master. No listening-quality or real-hardware FPS claim is made.
