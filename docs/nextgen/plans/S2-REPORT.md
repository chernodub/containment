# S2 audio implementation report

1. **Shipped and branch**

Branch: `t3/audio-overhaul-synthesis`. Implementation commits: `b42f770` (foundation), `dac0dfc` (authoring), `f3c97ff` (director/worker), `5e0cfcd` (Queen phase adapter), `5ce05ab` (explicit room exit). Final handoff SHA is in the accompanying final response; the final evidence/documentation commit necessarily follows this report.

- Seven buses, independent category/per-bus gains, compressor plus bounded final waveshaper, overlapping ducks, spatial attenuation/pan, environment reflections, 40 active / 48 physical voice cap with protected loops and fading-tail reserve.
- 240 original layered recipes: five weapon signatures, fourteen impacts/Foley, 48 native/elite/champion/Queen vocals, 128 ability world phases, nine ability loops plus heartbeat, ten environment beds, all 22 UiCues and additional ability feedback variants. Existing local licensed samples remain layered into weapons/explosions/enemies/reloads. Legacy API retained.
- Authoritative keyed entity-loop lifecycle; pause/room exit/death/mute/context interruption/destroy cleanup, pending-worker cancellation and safe expiry. Reactive music layers, low-health pulse/filter, sustained Overdrive treatment, hostile pitch retiming and Overclock lowpass recovery.
- Original module worker caches PCM off-thread. Full base cache is approximately 16.36 MiB mono PCM, plus small round-robin/elemental buffers. No new dependencies, third-party assets or simulation changes.
- Public signatures and exact UI hooks: [S2-API.md](S2-API.md). Frozen `GameAudioDirector`/ability contracts unchanged.

2. **Audition, captures and measured inventory**

Audition page: `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/scripts/nextgen/audio-audition.html` with tiny `audio-audition.ts` entry. Run `npm run dev` and open `/scripts/nextgen/audio-audition.html`; it is dev-only and absent from dist. The director and raw-recipe controls cover every ability phase, UI cue, weapon, ambience and reactive treatment, with keyboard-reachable native controls.

Audio evidence label: `s2-audio`. Production capture label: `s2-audio-production` (7 verified PNGs: title, two heavy armory, two status, two Queen). Reviewed production PNGs directly; no renderer/UI redesign is claimed in this stream.

First eight waveform/spectrogram PNGs (all opened and inspected):

- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/layered-shotgun.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/ability-railbreaker-impact.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/ability-cryo-nova-impact.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/ability-meltdown-impact.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/ability-overload-impact.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/ambience-infested.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/ui-victory.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-30b2dd58/artifacts/nextgen/s2-audio/fight-master.png`

Also reviewed `ability-whiteout-loop.png`, `weapon-shotgun.png`, `audition.png` and production `combat-heavy-armory-01.png`, `status-vfx-communal-atrium-01.png`, `boss-reactor-vault-01.png`.

**Complete per-cue peak/RMS/duration inventory:** [inventory.md](../../../artifacts/nextgen/s2-audio/inventory.md), [CSV](../../../artifacts/nextgen/s2-audio/inventory.csv), [full JSON](../../../artifacts/nextgen/s2-audio/inventory.json). All 257 WAV/PNG pairs exist locally: 240 recipes, six real sample-layered cues, three legacy elemental cues, seven fight bus stems and master. Eight review WAV/PNG pairs, audition screenshot, full metadata and gate logs are committed; regenerate the complete ~102 MiB local gallery with `node scripts/nextgen/audio-evidence.mjs`.

Metrics below are rendered stereo PCM, linear full scale, production mixer at master/music/effects 1 including .85 internal headroom, compressor and waveshaper. RMS includes the documented short render padding; raw pre-mix family-budget metrics are separately in JSON.

| Signature | Peak | RMS | Authored duration s |
|---|---:|---:|---:|
| ram impact | 0.1751 | 0.0338 | 0.30 |
| seismic-slam impact | 0.2875 | 0.0541 | 0.92 |
| bulwark impact | 0.2817 | 0.0439 | 0.54 |
| railbreaker impact | 0.4696 | 0.0859 | 1.58 |
| frost-trail impact | 0.3161 | 0.0490 | 0.48 |
| cryo-nova impact | 0.3147 | 0.0482 | 0.72 |
| glacier impact | 0.5001 | 0.0719 | 1.05 |
| whiteout impact | 0.4285 | 0.0634 | 1.34 |
| afterburn impact | 0.3497 | 0.0515 | 0.49 |
| flashfire impact | 0.3184 | 0.0514 | 0.66 |
| napalm-charge impact | 0.2548 | 0.0382 | 0.83 |
| meltdown impact | 0.3379 | 0.0555 | 1.26 |
| static-step impact | 0.2345 | 0.0657 | 0.26 |
| overload impact | 0.2983 | 0.0412 | 0.71 |
| tesla-pylon impact | 0.2298 | 0.0564 | 0.79 |
| overclock impact | 0.3468 | 0.0581 | 1.18 |

The dense fight contains 215 director events, 367 admitted sources, 42 peak physical voices, zero rejections, and zero voices after pause. It uses master .8 / music .65 / effects .8; the measurement window is 8s action + 4s full room decay. Bus taps include their actual category gain and music/ambience ducks, before the shared reverb return/master. Reverb return is included in the final master, not counted twice in bus stems.

| Effective fight bus | Peak | RMS over 12s |
|---|---:|---:|
| music | 0.0890 | 0.0052 |
| ambience | 0.0633 | 0.0108 |
| weapons | 0.7250 | 0.1029 |
| abilities | 0.4867 | 0.0482 |
| enemies | 0.2936 | 0.0502 |
| impacts | 0.4720 | 0.0654 |
| ui | 0.2799 | 0.0278 |
| Limited master | 0.6561 | 0.1248 |

All 257 renders passed finite/non-silent/duration/DC/clipping checks; first/last output samples are below 1e-6, fight endpoints exactly zero. Signal tests assert authored RMS/peak family budgets and measured same-family spectral/envelope separation; peak-limited transients may sit below their nominal RMS target. Default targets (RMS/peak): weapon .14/.70, impact .10/.55, ability .15/.72, loop .055/.27, enemy .085/.48, UI .045/.24, stinger .10/.55, ambience .04/.20. Explicit authored exceptions cover quieter confirmations and larger/boss beats.

Critique/fix rounds: (1) numerical spectra/envelopes and PNG review exposed recurring ambience onset holes, overlapping same-element tick accents and weak Static Step/Railbreaker body; moved bed entry fades to source gains, shortened repeat-boundary tapers, separated Tesla/Overload and Napalm/Afterburn accents, and added body without raising peak caps. (2) PNG/timing review exposed truncated room tails and 20–60ms synchronous prewarm tasks; rendered the full reverb decay, optimized synthesis recurrence and moved prewarm/long beds to a worker. Final PNGs show distinct cryo broadband air/crystals, kinetic sub/metal, pyro low roar/crackle, arc swept snaps, stable ambience and harmonic stingers, with clean endpoints. This is a signal/visual assessment, not listening.

Measured initialization: constructor 0ms (timer resolution), injected graph unlock .90ms; first live device startup/resume 175ms asynchronously. Base cache prewarm 7.45s spread across worker requests, 240 transferred buffers, zero synchronous synthesis calls in that prewarm, main-thread copy max .20ms / p95 .10ms, 16ms responsiveness-timer excess max 2.8ms. These are headless measurements, not real-hardware FPS certification. Short cold one-shots still have synchronous fallback; worker-disabled/error fallback uses one scheduled recipe task at a time.

3. **Gates**

- `npm ci`: 61 packages installed, no dependencies added.
- `npx vitest run --exclude scripts/cryo-model-preview.test.mjs`: **149 files passed / 1 skipped; 1,938 tests passed / 1 skipped**. Final additive lifecycle/boss fixes also passed the targeted director/mixer/worker suite: **39 passed**.
- `node --test scripts/cryo-model-preview.test.mjs` (also executed by verify): **2 passed, 0 failed**.
- `npm run build`: **tsc + Vite passed**, worker emitted as a separate ~2.16 kB chunk; audition absent from production. Existing large-chunk warning remains.
- `npm run test:room-evidence`: **28 passed, 0 failed; ragdoll CPU checks 33 passed**.
- `npm run test:authored-smoke:all`: **passed**, three desktop fixtures (Passenger vault, Breached loading bay, Overload floor), empty errors, native keyboard movement/fire.
- `npm run capture -- --label=s2-audio-production --scenarios=title,combat-heavy:armory,status-vfx,boss --burst=2`: **7 PNGs verified**, ANGLE Metal / Apple M1 Pro, 18.05s, no errors.
- `node scripts/nextgen/audio-evidence.mjs`: **257 WAV/PNG pairs; 0 assertion failures; 0 browser errors** (full rerender, no reused recipes).
- Temporary live application forwarding experiment: **passed**, real Cryo Nova and Whiteout cast/impact/ticks, two actual shot receipts, one sustained loop, 17 voices peak, zero voices after pause and buffers cleared on destroy. Experiment script/global/wiring not committed.
- `npm run verify`: unit/browser and cryo-node gates pass, then stops at documented pre-existing **Blender missing** (`test_monitor_artifacts.py`, FileNotFoundError); no Blender installation or assertion changes.
- Smoke with the supplied two-line readiness patch loaded temporarily in memory: **Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.** All original assertions retained; hook/script not committed. An earlier experiment overlapping a rebuild timed out; the isolated stable-build validation passed.
- Unmodified `npm run test:smoke`: **fails on both runs** at the final collected network-error assertion: 3–4 GLB `net::ERR_ABORTED` requests during checkpoint/reload flows. Its master/mute/native input/paused audio/restart/checkpoint/Combat Rig behavior checks all print passed. No audio/worker errors. This is an unresolved integration gate, not reported as green.

4. **Tests rewritten/removed**

No test removed; no desktop/gameplay/persistence assertions weakened.

- `AudioPreferences.test.ts`: replaced fixed four-gain allocation indices with independent live master/music/effects graph values and zero-volume scheduling checks; the approved graph now has seven buses and effects nodes.
- `ElementalAudio.test.ts`: replaced private `playBuffer` spying with actual fake-context source/buffer counts; preserves three-buffer caching, onset, rate-limit, refreeze/room and pause guarantees.
- `ElementalAudioBrowser.test.ts`: stronger muted guarantee (zero scheduled voices/buffers), real graph gain and diagnostic lifecycle assertions. Prior test deliberately scheduled inaudible voices at master zero, superseded by S2 acceptance.
- `HitInputAudio.test.ts`: validates quieter metallic authored PCM instead of an exact old `switch.wav` call; rate-limit/pause invariants and the separate native collider/aim test remain.

5. **Integration requests**

- UI owner: wire `handleEffect`, `playUi`, `setEnvironment`, `setCombatState` as described in [S2-API.md](S2-API.md). Replace old per-effect sound calls to avoid double routing. Keep syncCombat and lifecycle callbacks. Explicit room exit `setEnvironment(null)` works even before a bed was selected.
- Optional Queen phase forwarding uses the actual `QueenBossPhase` vocabulary. Champion-specific metadata is absent from current GameEffect; native family/elite identity works now, named champion recipes are auditionable.
- Smoke owner: investigate aborted GLBs; [S2-smoke-readiness.patch](S2-smoke-readiness.patch) is a concrete candidate adding network-idle settling before the two checkpoint-helper reloads, without changing assertions. The stable-build in-memory experiment with precisely those two waits **passed the entire desktop production smoke with zero errors**, including final network assertions. The patch was not applied to the other owner's file.

6. **Known gaps / honest assessment / next steps**

The full S2 engine and inventory are implemented and reproducible. All new director sounds are reachable through the audition/tests; current production application still uses legacy calls until the UI stream wires the director. Authored waveform/spectrum checks establish safe levels, differentiation, lifecycle and CPU behavior, but cannot establish premium perceived sound. A human should audition on headphones and ordinary laptop speakers, judge masking/listening fatigue and adjust bus levels in the lab. Procedural vocals and synthesized air/metal still need that perceptual review before claiming the vision's premium bar. Existing composed music stems are reused; this is a reactive mix upgrade, not a new score. Reverb is economical stereo convolution, not occlusion/acoustic simulation. No real-hardware 60fps certification is claimed. The unmodified production smoke failure (verified readiness patch supplied) and missing Blender aggregate gate are explicitly outstanding; neither was hidden with weakened desktop assertions.
