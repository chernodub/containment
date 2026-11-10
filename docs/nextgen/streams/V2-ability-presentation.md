# Stream V2 — Ability presentation: VFX, light, camera, sound

You are the **ability presentation lead**. Read `docs/nextgen/00-VISION.md` and `docs/nextgen/01-ENGINEERING.md` first,
then the reports/plans of the streams you build on: `docs/nextgen/plans/A1*.md` (ability simulation, events, snapshots)
and `docs/nextgen/plans/G1*.md` (render building blocks: LightPool, decals, distortion buffer, telegraphs, beams,
shockwaves, zone and shield materials, CameraRig).

Goal: every one of the sixteen abilities and three deployables looks and sounds like a signature move in a premium
action game — instantly identifiable by silhouette, color and sound, with anticipation → impact → aftermath —
and the telegraph on the ground is exactly the area the simulation hits.

## You own
`src/render/abilities/**` (new), `src/game/audio/abilityCues.ts` (new) plus the minimal registration lines in
`src/game/audio/AudioSystem.ts` and in `DepthRenderer.effect()/render()` needed to route ability events and snapshots
to your modules (keep those edits tiny and clearly delimited), tests for your modules, and `ability:*` capture scenarios.
Do not change simulation results. If a snapshot/event lacks data you need, request it (Integration requests) and
approximate meanwhile.

## Inputs you render from
- `GameEffect {type:'ability', ability: AbilityEvent, x, y}` — phases `cast | impact | tick | end | burst | link | dash-start | dash-end | denied | ready | overdrive-ready`.
- `game.abilities.snapshot` — `deployables`, `zones`, `overdrive`, `dashing`, `invulnerable`, `hostileTimeScale`, per-slot cast/active timers.
- Shapes from `ABILITY_CATALOG[id].shape` — telegraphs must be generated from the same numbers the simulation uses.

## Language shared by all abilities
- **Element identity** (00-VISION §3 color table): kinetic = amber sparks, dust, hard concussive rings, metal;
  cryo = ice blue, white mist, crystalline shards, soft glow, slow drifting aftermath;
  pyro = orange→yellow core, rolling flame, embers, black smoke, heat distortion;
  arc = violet-white forked lightning, hard flicker, ozone glow, after-image ghosts.
- **Telegraph**: thin bright outline + low-opacity fill that sweeps/fills over the cast time; friendly telegraphs use the
  element color with a cyan-white edge so they never read as the red enemy warnings.
- **Impact**: a 1–2 frame bright core, a light flash from the LightPool, shockwave/distortion where physical, camera
  trauma scaled to weight (tactical < power < Overdrive), a decal or lingering ground state as aftermath.
- **Readability**: lingering effects are mostly ground-hugging and semi-transparent; enemies and their red telegraphs
  must remain visible through any friendly effect. Budget every effect (pooled instances, bounded lights).
- **Reduced motion / flash settings**: honor `graphicsOptions.screenShake` and `flashIntensity`.

## Per-ability direction

### Dashes (all rigs)
Common: stretched after-image trail of the marine (2–3 ghost poses fading over ~180 ms), ground streak, brief FOV/zoom
kick, whoosh. Arrival puff. While invulnerable the marine has a thin cyan-white rim.
- **Ram** — amber shock cone ahead of the marine, shoved enemies get a hit flash and dust burst; heavy thump.
- **Frost Trail** — the streak crystallizes into a jagged frost strip with crawling ice edges and low mist for its lifetime; glassy chime.
- **Afterburn** — twin exhaust flames, the streak ignites into a flickering fire line with embers and smoke, lights the room orange; jet roar.
- **Static Step** — the marine blinks as a lightning silhouette, arrival discharges visible forked arcs to the shocked targets; sharp crack.

### BREACHER
- **Seismic Slam** — cast: the marine crouches/braces, a ring telegraph fills, dust is sucked inward. Impact: deck-plate
  ripple (distortion ring), radial dust wall, amber sparks, floor-crack decal, debris hop; heavy low boom with sub thump; strong trauma.
- **Bulwark** — a wide hex-patterned energy barricade unfolds from a projector line (panels flip up left→right in ~150 ms),
  cyan-amber edge glow, ripples and flashes where spit/enemies hit it, flickers in its last second, collapses into falling
  shards of light; hum loop + impact pings + power-down.
- **Railbreaker** — cast: aim-line telegraph narrows and brightens, particles converge on the muzzle, rising whine, camera
  pulls back slightly. Impact: a blinding white-amber lance across the room for 2–3 frames with a lingering heat-trail,
  distortion along the line, scorch line decal, struck enemies flung sideways with spark showers; thunderous crack + tail; maximum trauma + zoom punch.

### CRYO
- **Cryo Nova** — instant expanding ring of frost-white vapor with a hard icy leading edge, frost decal spreading on the
  floor, frozen enemies get an ice-shell flash; breathy burst + crystalline crackle.
- **Glacier** — telegraph bar at the cursor; ice columns erupt from the floor in a staggered row (bottom-up growth,
  ~150 ms), refractive, glowing from inside, mist pouring off the base; cracks appear as it takes damage or nears expiry;
  shatter = shard burst + cold shockwave + frost decal; grinding rise, deep crack, glass shatter.
- **Whiteout** — a visible blizzard dome boundary on the ground, wind-driven snow streaks swirling around the marine,
  light turns cold and desaturated inside (local grade if available), freeze pulses are visible ring waves every 2 s,
  shattering enemies burst into ice shards; howling wind loop with pulse hits.

### PYRO
- **Flashfire** — a rolling cone of flame that leaves the muzzle and billows to full range in ~120 ms, bright yellow core
  to orange edges, black smoke aftermath, scorch fan decal, ignited enemies visibly burning; whooshing roar.
- **Napalm Charge** — lobbed canister with a visible arc and landing marker at the cursor; burst into a spreading,
  animated burning pool (flowing fire texture, boiling edge, embers rising, heat distortion above), strong orange light;
  thunk launch, glass-burst impact, crackling loop.
- **Meltdown** — ignition burst from the marine, then for the duration: the marine wreathed in flame with a heat-haze
  aura ring on the ground, ember trail, weapon tracers turned fiery, kill-bursts are small fireballs; the frame warms
  slightly; ignition blast + furnace loop + tail-off.

### ARC
- **Overload** — thick forked lightning from the marine to the first target then jumping target to target with ~40 ms
  stagger, each hop a flash and a lingering crackle on the stunned enemy (small orbiting sparks while stunned);
  snapping thunder with per-hop zaps.
- **Tesla Pylon** — a pylon slams into the deck (impact ring), unfolds, top coil glows; periodic visible arcs to targets;
  when the marine is in range a live, wavering energy link runs between marine and pylon with sparks where it burns
  enemies; coil hum that rises before each zap; power-down and collapse on expiry.
- **Overclock** — activation: radial time-ripple distortion, colors shift cooler/violet with gentle vignette pulse,
  hostile motion visibly slowed (their trails stretch), the marine leaves afterimages, tracers leave long light streaks,
  a subtle clock-tick layered into the mix with the music low-passed; reverse-ripple on end.

### System feedback
- **Overdrive ready**: the marine's rig vents a brief element-colored flare; unmistakable rising stinger.
- **Denied press**: tiny dry click, no visual in the world (the HUD handles it).
- **Ready**: soft per-slot tick (very quiet), rate-limited.

## Sound
Synthesize with the existing local-synthesis approach in `AudioSystem` (follow `elementalCues.ts`): layered noise/tones
with envelopes, per-element timbre, shared effects bus/volume/mute/pause lifecycle, bounded voices, rate limits.
Add a simple ducking of music under Overdrives and large impacts. No new licensed audio files.

## Acceptance
- Captures: an `ability:<id>` burst (cast → impact → aftermath) for all 16 abilities in a suitable room, plus one
  "full build" heavy-combat burst per rig. Each ability identifiable from a single frame.
- Telegraph geometry test: for every ability the drawn telegraph bounds equal the catalog shape used by the simulation.
- Budgets hold in a stress scenario (all abilities of a rig spammed in heavy combat on High): frame time, light count, instance counts reported.
- Gates in 01-ENGINEERING pass. No leaks across room changes; all loops stop on pause, death, room exit and context loss.
