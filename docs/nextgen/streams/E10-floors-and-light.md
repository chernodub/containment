# Stream E10 — Floors, light and depth

You are the **environment lead**. Read `AGENTS.md` (no tests; Blender available; remodelling authorised),
`docs/nextgen/00-VISION.md`, `docs/nextgen/01-ENGINEERING.md`, `docs/nextgen/streams/E9-room-interiors.md`,
`docs/nextgen/E9-REPORT.md` (weakest rooms, timing miss) and `docs/nextgen/reviews/R10-verdict.md` first.
E9's final sheets: `/Users/chernodub/.t3/worktrees/containment-game/t3-84b6dc1b/artifacts/nextgen/e9-final/`
(`twenty-calm.png`, `twenty-kiting.png`, `tour-<room>.png`) — read-only reference.

## Lead review of where the rooms are

E9 gave every room a palette, real walls and an original ship kit; Crew Checkpoint is now a good-looking room.
But across the twenty, 60–70% of every gameplay frame is still **a flat, single-colour floor under even light**
(look at Shielding Gate, Relay Racks, Coolant Plant, Infested Workshop, Containment Annulus, Diagnostic). The floor is
most of the picture in a top-down game, so the floor and the light on it decide whether the game looks premium.

Specific defects I see:
1. Floors are flat colour with faint line inlays: no material, no panel relief, no wear, no story.
2. Light is even. No pools and falloff, no dark corners, few coloured accents; the same floor-mounted light-strip
   module repeats in every room and sits *on* the floor.
3. Actor and architecture shadows are long, hard and very dark; a crowd's shadows merge into purple blobs that fight
   with enemy silhouettes (see `artifacts/nextgen/wave9-merge/combat-heavy-crew-checkpoint-02.png` in the main checkout).
4. Nothing has depth below or above the deck plane: no trenches, pits, glass floors, catwalk shadows, overhead pipes.
5. Repetition: duplicated signs in one frame (Diagnostic), the same strip light everywhere.
6. Weakest rooms per E9: Shielding Gate, Relay Racks, Residential centre, Transmission airlock, Diagnostic, Workshop rear.
7. Performance: High frame p95 24–33 ms in three rooms against a 20 ms budget.

## Deliver

1. **Baked floor sets per environment (Blender).** For each of the ten environments model a modular deck set as real
   geometry — plates with bevelled seams, bolts, tread, drains, cable-trench covers, hatch frames, kick plates at wall
   bases — and bake it to tiling texture sets (base colour, normal, AO/roughness; trim sheet + 3–4 tile variants +
   decal atlas of stains, scuffs, tyre/boot wear, painted markings with chipping, hazard edges, bay numbers, spill
   and scorch marks). Apply through the existing floor material path so the ink/banded look is kept: readable large
   shapes, detail in mid-frequency, low contrast inside the fight circle. Scale to the marine: a plate is about two
   to three marine-widths. Generating scripts under `tools/assets/e10-floors/`.
2. **Depth.** Every room gets at least two of: a grated trench with pipes/cables and light below; a glass floor strip
   lit from underneath; a recessed pit/well around a machine with railings; overhead structure (gantries, pipe racks,
   cable trays, hanging lamps) that reads through shadow and partial occlusion faded near the marine. Pure
   presentation where walkable (flush grate/glass), real colliders only where a railing or machine blocks.
3. **Light with shape.** Per room: a key (motivated: ceiling fixtures → pools with falloff on the floor), a fill
   colour, and one or two accent colours from screens/indicators/hazard lamps; corners and under-gantry areas fall
   darker; the fight circle is the best-lit, calmest area; the exit is signalled by light. Replace the repeated
   floor-mounted strip with fixtures that belong (recessed deck lights, wall washers, lamp heads on gantries).
   Use baked/static light (lightmap-like vertex colour or a per-room baked light texture from Blender) wherever possible
   instead of more dynamic lights.
4. **Shadows.** Actors: short, soft contact shadows (blob/ellipse or a cheap blurred projection) that never merge into
   opaque masses; a crowd must stay readable. Architecture: soft-edged, lighter (shadow colour is a darker tint of the
   floor hue, not purple-black), no long streaks across the fight circle.
5. **Low cover (the one gameplay allowance).** You may add up to three low static cover pieces with colliders per room
   (crate stacks, consoles, pump heads, planters) outside the fight circle where clear lanes stay ≥ 140 units, to break
   the open floor and give fights shape. Check with bot campaigns that nothing gets stuck and rooms still clear.
6. **Fix the six weakest rooms** to the Crew Checkpoint level or better, remove duplicated signs, and review all twenty.
7. **Performance to budget**: High frame p95 ≤ 20 ms at 1920×1080 in every room with 25 enemies, draws ≤ 330, zero
   mid-combat shader compiles, room preparation ≤ 3 s, texture memory reasonable (compressed/KTX2 or sensibly sized
   WebP; share atlases). Low tier keeps floor sets (lower resolution) and baked light, drops the extras. Measure with
   `npm run bench` / `bench:rooms`; another two streams are running, so note host load with every number — the
   integration agent certifies later, but find and fix real costs now (E9 found 4,160 unbatched meshes once already).

## Method

- Standard first on **Shielding Gate, Coolant Plant and Relay Racks**: at least four written critique → fix rounds
  (`docs/nextgen/plans/E10-review.md`) on real captures (five-position room tours + a 20-enemy kiting frame) at native
  size and 480×270, side by side with E9's frame of the same view. Bar: with the HUD hidden, a stranger thinks the
  screenshot is from a commercial top-down shooter. Then propagate to all twenty with up to 6 Sol sub-agents (disjoint
  environment groups; you keep shared modules).
- You own `src/render/world/**`, the room modules, `src/render/lighting/**`, shadow settings, floor materials,
  `public/assets/e9-ship-kit/**` and new `public/assets/e10-*/**`, and may add the low-cover colliders in the room plan
  data. Do not touch actors/motion (`src/render/motion/**`, actor files), UI, abilities, enemy attack tuning or the
  bot policy (other streams own them). Keep `DepthRenderer.ts` edits small and delimited.
- No tests. Verify: `npm run build`; room tours and kiting captures you look at; one bot campaign
  (`npm run playtest -- --rig=cryo --seed=1729`) without errors; bench numbers.
- Do not use computer-use tools. One browser at a time. Commit on your worktree branch, clean tree, no push. Keep
  `artifacts/nextgen/e10-final/` (twenty tours, twenty-calm, twenty-kiting, before/after vs E9); delete intermediates.

## Report

`docs/nextgen/E10-REPORT.md`: per room what changed (floor set, depth features, light scheme, cover), per-room
draws/triangles/texture memory/frame times with host load, and your honest list of the weakest rooms.
