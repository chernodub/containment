# Stream S2 — Audio direction

You are the **audio lead**. Read `docs/nextgen/00-VISION.md` and `docs/nextgen/01-ENGINEERING.md` first.
Goal: the game should *sound* premium — weighty weapons, signature ability sounds, a reactive mix, a distinct ambience per
environment, and a complete interface sound set — all produced locally (synthesis + the existing licensed samples),
no new third-party audio.

## You own
`src/game/audio/**` and its tests. The shared contract `src/game/audio/contract.ts` is written by the lead: implement
`GameAudioDirector` on `AudioSystem` (or a director object it owns). You may add optional members; never rename/remove.

## You do not touch
`src/ui/**` (a parallel UI stream wires your API: it will call `handleEffect`, `playUi`, `setEnvironment`,
`setCombatState` when they exist), `src/render/**`, `src/DepthGame.ts`, `src/game/**` outside audio.
Existing public methods used today (`playPistol` … `syncCombat`, volumes, pause/resume, `unlock`, `preload`, `destroy`)
must keep working — implement the new director on top and route the old calls through the same engine.

## Scope
1. **Mix engine**: buses (master → music / ambience / weapons / abilities / enemies / impacts / UI), per-bus gain,
   a gentle master compressor/limiter, sidechain-style ducking (music and ambience under explosions, Overdrives and
   boss beats), bounded voice pool with priorities and per-cue rate limits, distance attenuation and stereo pan from
   listener-relative positions, pause/resume/mute/visibility lifecycle identical to today, no clicks (ramped gains).
2. **Weapons and impacts**: layer the existing samples with synthesized transient/sub/tail so each of the five weapons
   has punch and identity; round-robin + small pitch/gain variation; shell/reload detail; hit confirmation variants
   (flesh, armor, blocked, kill); explosion sizes; wall-slam and body impacts with weight.
3. **Abilities** (`GameEffect {type:'ability'}`; phases cast/impact/tick/end/burst/link/dash-start/dash-end/denied/ready/
   overdrive-ready): a signature sound for each of the 16 abilities following the per-ability direction in
   `docs/nextgen/streams/V2-ability-presentation.md` ("Sound" notes inside each ability) and element timbres:
   kinetic = heavy low thumps, metal, concussive; cryo = glassy, breathy, crystalline; pyro = roar, crackle, whoosh;
   arc = snaps, zaps, hum, thunder. Loops for lingering effects (barrier hum, blizzard wind, furnace, pylon coil,
   Overclock clock) start/stop from events and are force-stopped on room exit, pause, death and context loss.
4. **Reactive state** (`setCombatState`): music intensity layers as today plus low-pass/tension treatment at high
   danger (heartbeat-like pulse under 30% health, never annoying), Overdrive mix treatment, time-dilation treatment
   while `hostileTimeScale < 1` (pitch-down hostile sounds, low-passed music), boss presence.
5. **Environment ambience** (`setEnvironment`): ten synthesized ambience beds (cryo hiss and hum, habitation air
   handling and distant creaks, security alarm bed, cargo bay reverberant space, comms data chatter, engineering
   machinery, maintenance drips and pumps, infested organic wetness, containment field hum, reactor roar), crossfaded
   on room change, plus a simple environment-dependent reverb/early-reflection send so rooms feel different in size.
6. **Enemies**: per-family vocal/attack/death character (synthesized on top of the existing alien sample), attack
   wind-up tells that match the visual warnings, spitter projectile whoosh, champion/boss presence, Queen phases.
7. **UI cues** (`playUi`): the full `UiCue` set — tight, quiet, consistent family of interface sounds; presentation
   beats (room enter/clear, boss intro, Overdrive ready, death, victory) are short musical/sonic stingers.
8. Preferences: keep master/mute; make music and effects volumes real if they are not already; expose per-bus API for a
   future settings UI.

## Tests
Headless tests with a fake/Offline AudioContext (follow existing `ElementalAudio*.test.ts` patterns): every ability phase
and UiCue maps to at least one scheduled voice; voice cap and rate limits hold under an event flood (e.g. 2,000 effects
in 8 s); loops always stop on the lifecycle events above; no scheduling when muted/paused/locked; determinism of the
synthesis parameters (no unseeded randomness in tests); `destroy()` releases nodes.

## Acceptance
Gates in 01-ENGINEERING (vitest, build, smoke). Provide an audition page for the lead and future agents:
`scripts/nextgen/audio-audition.html` + a tiny dev entry (served by `vite` dev only, not in production) with buttons that
trigger every cue/ability/ambience, and render a set of representative cues to WAV files under
`artifacts/nextgen/s2-audio/` via OfflineAudioContext in a headless browser, with a spectrogram/waveform PNG per cue so
the result can be inspected visually (peak levels, length, no clipping). Report measured peak/RMS per bus in a dense
scripted fight.
