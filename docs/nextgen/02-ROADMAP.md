# CONTAINMENT — Next-Gen Overhaul: Roadmap and status

Lead-maintained. Update the status table whenever a stream starts, reports or merges.

## Waves

**Wave 0 — tooling (one agent, main checkout)**
- W0 Visual capture harness (`npm run capture`, `scripts/nextgen/`, `window.__containmentDebug`) + baseline gallery
  at `artifacts/nextgen/baseline/`.

**Wave 1 — foundations (parallel worktrees, disjoint file ownership)**
- A1 Combat Rig simulation — `streams/A1-abilities.md` — owns `src/game/**`, `src/DepthGame.ts`, `src/InputController.ts`.
- G1 Render pipeline, light, atmosphere, camera, combat VFX — `streams/G1-render.md` — owns `src/render/**`.
- U1 Interface: design system, HUD, screens — `streams/U1-interface.md` — owns `src/main.ts`, `src/ui/**`, styles, smoke scripts.
  Starts after W0 lands (both edit `src/main.ts`).

**Integration 1 (lead)** — merge A1 → G1 → U1 into `nextgen`, resolve, wire the UI adapter to the live ability/graphics
APIs, full gates, capture `integration-1`, lead art/feel review, punch list.

**Wave 2 — the abilities become real on screen (parallel)**
- V2 Ability VFX + SFX: every ability's cast/impact/tick/end/link/burst in the renderer and audio, deployables and zones
  drawn from snapshots, telegraphs matching hit shapes, lights/decals/distortion/camera per ability, Overdrive screen treatment.
- U2 Live ability UI + game feel: rig-select wired to the real flow, action bar on live snapshots, augments in drafts,
  combat text from real damage events, results from `game.stats`, hit-stop / final-kill slow-motion / camera hooks in the loop,
  graphics settings wired to `setGraphicsOptions`.
- G2 Environment pass: room-by-room lighting/atmosphere/material polish across all 20 rooms, title scene, boss arena.
- A2 Encounter spice (only if Integration 1 review says combat needs it): elite affixes, enemy telegraph clarity, ability balance.

**Integration 2 (lead)** — merge, gates, capture `integration-2`, play-review all four rigs, punch list.

**Wave 3 — polish to done**
- Independent review agents (fresh eyes, no anchoring): correctness review of the diff, visual review of the gallery
  against `00-VISION.md`, performance profiling, accessibility pass. Findings → fix agents → re-review until the
  definition of done in `00-VISION.md §7` holds.
- README / AGENTS / credits / licenses updated; final gallery `artifacts/nextgen/final/`.

## Status

| Stream | State | Branch / notes |
|---|---|---|
| W0 capture harness | merged | baseline gallery `artifacts/nextgen/baseline/` |
| A1 abilities (+ R1 review, A1-fix) | merged (I1a, I1b) | `t3/combat-rig-ability-simulation` @ fd0f565 |
| U1 interface | merged (I1a) | `t3/nextgen-ui-overhaul` @ 5af5da8 |
| G1 render | merged (I2) | `t3/nextgen-graphics-overhaul` @ 1152940 |
| S2 audio | merged | `t3/audio-overhaul-synthesis` @ dbb2c00 |
| U2 experience pass | merged (I3, audio director wired) | `t3/nextgen-ui-overhaul-1` @ c9dac35 |
| V2 ability VFX | merged 2026-11-11 | `t3/ability-vfx-overhaul` @ ea0c3ec — nextgen 2248e22: 2404 tests + smoke green |
| G2 world pass | reported; merging in I4 | `t3/world-art-overhaul` @ 62e0a04 |
| R2 review of UI/loop/adapters | done: 5 MAJOR + 5 MINOR confirmed | fixes in F2 |
| F2 UI/a11y fixes + bundle split | running | worktree branch |
| R4 bot playtest, full runs × 4 rigs | running | worktree branch |
| I4 merge G2 + performance to budget | running | worktree branch |

Next (lead): merge I4 → F2 → R4; polish punch list (below); fresh-eyes visual review; README/AGENTS/credits; final gallery.

Polish punch list (lead's eye, to dispatch after I4):
- Railbreaker reads as a thin amber line; it must be the most violent visual in the game (thick white-hot core, shock rings along the line, scorch, screen flash).
- Meltdown aura still sparse; Seismic Slam/Bulwark verify against the new floors.
- Props remain faceted in places (atrium trees, containers); enemies in groups still merge at the bottom of the frame.
- Title: logotype over the cinematic shot; remove scan-circle ornament.

## Decisions log

- 2026-11-11 Work on branch `nextgen` in the `containment-game` project; partial + sparse clone (historical evidence folders excluded).
- 2026-11-11 Four rigs aligned with the four existing boon paths; keys Shift/Q/F/V; rig chosen before the starting boon.
- 2026-11-11 Stay on WebGL2/`WebGLRenderer`; perspective camera is an evaluated option inside G1, adopted only if framing guarantees hold.
- 2026-11-11 Legacy `newRun()` keeps working with a default Breacher rig until the rig-select UI is wired (keeps smoke green between merges).
- 2026-11-11 After reviewing the baseline gallery: closer follow camera (marine 110–140 px at 1080p), designed out-of-bounds, off-screen threat indicators + room radar; climax rooms (reactor, boss arena) get the most dramatic lighting. Sent as addenda to G1 and U1.
- 2026-11-11 Baseline `combat-heavy` scenario stacks enemies on a stationary marine; streams add a kiting scenario for readability judgments (harness v2 at Integration 1).
- 2026-11-11 Integration 1 complete: abilities + UI + graphics live together on `nextgen` (2e228be). Lead review: generational jump achieved in lighting/camera/HUD; weakest links now are enemy readability, prop/surface quality, boss staging, title, ability VFX (interim), audio.
