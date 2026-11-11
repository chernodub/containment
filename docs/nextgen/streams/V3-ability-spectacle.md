# Stream V3 — Ability spectacle pass

You are the **ability VFX lead** for the finishing pass. Read `docs/nextgen/00-VISION.md` (pillars; §4), `docs/nextgen/01-ENGINEERING.md`,
`docs/nextgen/streams/V2-ability-presentation.md` (the per-ability direction — still the target), `docs/nextgen/V2-REPORT.md`
(what exists), `docs/nextgen/I4-REPORT.md` (integration with the world pass, performance state, benchmark `npm run bench`).

## Lead's verdict on the current ability visuals
Everything is wired, correct and readable — and **too polite**. In the all-abilities overview most abilities are a thin colored
ring or line plus a sprinkle of small particles. They read as indicators, not as events. The Arc kit (pylon, live link) and
Whiteout are close to the bar; the rest are not. A premium action game sells power through **mass, contrast and timing**:
a blinding core frame, a big readable shape, heavy secondary motion (debris, smoke, shards, embers), light that floods the room,
the camera and the world reacting, and an aftermath that stays on the floor. Raise every ability to that standard without
breaking pillar 1 (readable chaos) or the budget.

## You own
`src/render/abilities/**` and its tests; additive capture scenarios; minimal, surgical hooks in shared render modules only if
unavoidable (list them). A parallel task is working on render performance and room loading in the rest of `src/render/**`.
Do not touch `src/ui/**`, `src/game/**`, audio, smoke scripts.

## Per-ability requirements (scale references: marine ≈ 1.8 m tall; "radius" values come from the catalog — the effect must FILL its real hit shape)
- **Seismic Slam** — the floor must visibly break: a filled, fast expanding shock front (thick bright leading edge, dust wall behind it
  rising ~1.5 m, distortion), radial crack decal that persists (≥ 8 s, fades), 20+ chunks of debris hopping outward, floor dust lingering
  ~1 s, a hard 1–2 frame white-amber flash from a floor light. Enemies launched leave dust streaks. Camera: strong trauma + 2-frame punch.
- **Bulwark** — a tall (≈ 2.4 m) solid-looking energy wall with hex cells that light on impact, a projector strip on the floor,
  visible thickness and refraction of what is behind it; unfold and collapse animations with real mass; it must read as cover at a glance.
- **Railbreaker** — the single most violent visual in the game. Charge: converging particles and a tightening laser sight for the full
  600 ms with rising light. Fire: a beam core at least 0.7 m thick, white-hot for 3 frames then amber, full room length, with concentric
  shock rings spaced along it, a floor scorch trench decal along the whole line, sparks/slag showers where it meets walls, enemies on the
  line flash-silhouetted then flung; lingering glowing air trail ≥ 500 ms; maximum camera trauma, zoom punch, 1-frame exposure flash
  (respect `flashIntensity`).
- **Ram** — a visible shield-like amber pressure cone on the marine for the dash, bodies shoved with dust plumes and spark scrapes.
- **Cryo Nova** — a thick rolling vapor ring (volume, not a line) with a hard icy front that frosts the floor behind it (persistent frost
  decal across the full radius, fading over several seconds), ice needles growing on surfaces it passes, frozen enemies encased in a
  visible faceted shell with frosty glints.
- **Glacier** — chunky translucent ice columns (≈ 2 m) with internal glow, ground frost spreading from the base, cold mist pouring off;
  shatter = dozens of tumbling shards + ground-hugging cold shock + lingering sparkle.
- **Frost Trail** — a solid sheet of jagged ice along the dash with crystalline edges, not a faint streak.
- **Whiteout** — already strong; add driven snow streaks with real density, rim frost on props inside the zone, and visible freeze pulses.
- **Flashfire** — a real flamethrower dump: dense rolling fire filling the whole cone for ~350 ms (yellow-white core at the muzzle,
  orange body, dark smoke at the far edge), strong orange light throw, scorch fan decal, enemies silhouetted and left burning.
- **Napalm Charge** — visible lobbed canister with trail; impact fireball that mushrooms, then a pool that is clearly liquid fire
  (flowing surface, tall licking flames at the edge, embers, black smoke column, heat shimmer), illuminating everything within ~6 m.
- **Afterburn** — twin jets from the suit, a continuous wall of fire along the path (flames ≥ 0.8 m tall).
- **Meltdown** — the marine is a furnace: body wreathed in flame, pulsing heat-haze aura with a clear boundary, ember storm, footsteps
  leave burning prints, kill bursts are fireballs; the frame warms subtly while active.
- **Static Step** — the marine becomes a lightning bolt between start and end (bright zig-zag afterimage), arrival burst with ground
  scorch star and forks to each shocked target.
- **Overload** — thick, multi-stranded, branching lightning with bright cores and lingering after-glow per hop, each hop a flash that
  lights the target and floor; stunned enemies crackle.
- **Tesla Pylon** — keep; add an impact when it lands and stronger arcs.
- **Overclock** — the world must visibly slow: time-ripple shockwave on activation, hostile motion trails, desaturated cool grade with
  violet edge vignette for the duration, the marine leaving bright afterimages, tracers as long streaks; clear reverse-ripple on end.
- **System**: Overdrive-ready flare on the suit; rig-colored suit emissives pulse on each cast.

## Rules of the pass
- Every ability must be identifiable from a single thumbnail at 480×270 — test exactly that (downscale your captures and look).
- Hit-shape fidelity stays exact (telegraph tests keep passing). Friendly effects never look like red enemy warnings and never hide them.
- Bright rooms (cryogenics, containment) and dark rooms (infested, boss) both: verify contrast in each rig's worst-case room.
- Budget: pooled, instanced, bounded; zero mid-combat shader compiles; `npm run bench` before/after for all four rigs on High and Low —
  the spectacle pass must not increase p95 CPU by more than 0.5 ms or draw calls by more than 25 in the full-kit stress fights
  (win it back with batching if needed). Low tier keeps simplified but still weighty versions.

## Method
Fan out per rig (four sub-agents, files under `src/render/abilities/<rig>/`) after agreeing the shared upgrades (volumetric ring/shock
front, debris emitter, persistent decals, thick beam, liquid-fire surface, ice shell) which you land first. Three critique→fix rounds,
judged on sprite sheets and on the 480×270 thumbnails. Final gallery `artifacts/nextgen/v3-final/` with before/after sheets per ability.

## Acceptance
Gates in 01-ENGINEERING (vitest, build, smoke, authored smoke, capture, bench). Report per-ability before/after thumbnails and an honest
ranking of the sixteen from strongest to weakest.
