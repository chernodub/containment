# Stream G2 — World pass: actors, surfaces, props, all twenty rooms

You are the **world art lead** for the second graphics pass. Read `docs/nextgen/00-VISION.md`, `docs/nextgen/01-ENGINEERING.md`,
then `docs/nextgen/G1-REPORT.md` and `docs/nextgen/plans/G1*.md` (the render pipeline, lighting moods, camera and VFX you build on)
and `docs/nextgen/plans/I2.md` (how it was integrated with the UI and the ability system).

The first pass fixed pipeline, light and camera. With the hero camera this close, the *content* is now the weakest link.
Lead's review of the current gallery:

- **Enemies** read as dark brown masses against dark floors, especially in groups; families are hard to tell apart at a glance;
  the near-camera perspective makes bottom-of-screen enemies large and muddy.
- **Floors** show obvious texture tiling (brick-like repeats in security/infested/cargo); little large-scale variation, few markings.
- **Props** are faceted low-poly blockouts (planter trees, machinery, armory carousel, containers) with flat single-color
  materials; they look like placeholders under good light.
- **Walls / boundaries** are plain extrusions; breaches (enemy spawn points), exits and doors have no visual identity.
- Only ten rooms were calibrated; the other ten story rooms and the legacy boss arena need the same care. The Queen fight
  still lacks staging. The title backdrop is just a top-down room.
- The marine's lamp blows out to white at the feet.

## You own
`src/render/**` except `src/render/abilities/**` (a parallel stream is building ability VFX there; it may add small routing
hooks in `DepthRenderer.ts` — keep your own `DepthRenderer.ts` edits surgical so the merges are trivial) and the tests for
your files. You may add capture scenarios. You may add generated/authored textures under `public/assets/` only if produced
by scripts you commit (procedural generation at build or load time is preferred); no third-party assets.

## You do not touch
`src/ui/**`, `src/game/**`, `src/DepthGame.ts`, `src/InputController.ts`, smoke scripts. Collision, navigation and room
templates are simulation data: your dressing is **visual only** and must never suggest walkable space is blocked or
blocked space is walkable (keep added clutter inside existing obstacle footprints, against walls outside nav clearance,
or flat on the floor as decals).

## Scope

### 1. Actors at hero scale
- **Enemy readability system**: per-family silhouette emphasis and a consistent "threat read": cool back-rim on all, small
  emissive identity features per family (crawler eyes, spitter sacs glowing acid-green that brighten before a spit, brute
  armor seams, stalker shimmer that actually reads as camouflage, carrier brood glow), elite/champion treatments that are
  unmistakable, grounded contact shadows. Enemies must separate from every one of the ten floor/lighting moods — test on all.
- **Animation feel**: spawn-in from breaches (emerge, dust/steam, light), hit reactions (flinch impulse, flash), attack
  wind-ups that visibly match the gameplay warning timing, death variety on top of existing ragdolls (dissolve/burn/shatter by damage type).
- **The Queen**: boss-scale presence — bespoke lighting rig for the arena, phase states readable on the model (armored vs
  exposed glow), nest visuals, acid pools as light sources, an intro and a defeat moment the UI beats can sit on.
- **The marine**: fix lamp clipping; suit emissive accents in the active rig's element color (read `game.abilities.snapshot.rig`);
  clear facing; dash/ability poses come from the ability stream — give it clean hooks.

### 2. Surfaces
- Kill visible tiling: world-space macro variation, multi-scale detail, grime/wear masks, panel seams with specular breakup,
  wetness where the mood wants it; per-environment floor identity (cryo frost, habitation composite, security plate, cargo
  scuffed paint lanes, comms raised floor, engineering grating, maintenance wet steel, infested growth creeping over deck,
  containment clean ceramic, reactor heat-stained plate).
- Floor markings as decals: lanes, hazard chevrons, bay numbers, arrows to exits, stencils — generated, crisp, worn.
- Walls: height, base trim, cable trays, pipes, panels, vents, signage; near-camera wall handling stays clean.

### 3. Props and set dressing
- Upgrade the faceted blockout props: smooth normals/bevels where they should be smooth, multi-material breakdown, edge wear,
  emissive screens with generated readable content, glass that reflects, fabric vs metal vs plastic response. Prioritize what the
  camera sees most (awakening bay pods, atrium planters/benches, armory carousel, cargo containers, relay racks, engineering
  machinery, coolant tanks, workshop tools, containment ring, reactor core).
- The atrium trees must not look like low-poly placeholders (denser canopy cards or smoothed foliage clusters with translucency).
- Procedural clutter kits per environment (crates, tools, cables, debris, personal belongings in habitation, spent casings in
  security, pods/veins/egg clusters in infested) placed deterministically from the room seed, respecting the nav rule above.
- **Infestation** as a system: organic growth meshes with pulsing emissive veins that spread from breaches in infested and
  breached rooms; subtle in early acts, dominant late.
- Breaches/vents (spawn points), exits and reward pickups get strong visual identity (lit, animated, readable from across the room).

### 4. All twenty rooms + arenas
- Bring every story room (see `src/game/roguelike/storyRooms.ts`) to the calibrated value structure from G1 with a deliberate
  lighting composition; each room should have one memorable visual idea tied to its story beat (e.g. transmission chamber's
  uplink dish glow, diagnostic gallery's wall of displays, manual-control chamber's single lit console, overload floor's rising alarm).
- Legacy templates still used by old saves/boss must at least meet the same lighting and surface standard.
- **Title presentation**: expose a renderer mode for the menu with a cinematic composed shot (low hero angle or dramatic
  three-quarter view of the marine in the awakening bay with depth of field, slow camera drift, an alien silhouette in the dark),
  replacing the current top-down backdrop. Keep the API small (`render(game, dt, menu)` already has a menu flag).

### 5. Finishing passes on the image
- Subtle depth of field / tilt-shift to sell scale (High only, off under reduced motion if animated), optional and tied to `lensEffects`.
- Shadow quality at the new camera distance (no shimmering/aliasing while the camera follows), stable AO.
- Recheck exposure/grade per room after all of the above; keep the percentile targets.

## Method
Fan out by area (actors / surfaces / props+dressing / rooms+lighting / title+boss) with disjoint files, after you land any
shared seams. Capture calm + kiting for **all twenty** story rooms plus boss and title, at High and Low; critique against the
vision like an art director; at least three rounds. Final gallery `artifacts/nextgen/g2-final/` with a baseline/G1/G2
side-by-side sheet.

## Acceptance
Gates in 01-ENGINEERING (vitest, build, smoke, authored smoke, capture); zero mid-combat shader compiles; draw calls and
frame time reported for the heaviest room on High and Low and within budget; no leaks across room cycles; determinism of
dressing (same seed ⇒ same placement).
