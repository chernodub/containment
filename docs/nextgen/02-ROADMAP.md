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
| W0 capture harness | done, merged (2026-11-11) | baseline: 66 shots, Metal GPU, ~170 s for `all` |
| A1 abilities | reported 2026-11-11 | `t3/combat-rig-ability-simulation` @ b5617a2 — 1766 tests green; smoke needs UI-side HUD refresh; under independent review (R1) |
| G1 render | running (2026-11-11) | `t3/nextgen-graphics-overhaul`; steered twice (closer camera; exposure/value structure) |
| U1 interface | reported 2026-11-11 | `t3/nextgen-ui-overhaul` @ 5af5da8 — all gates green; adapter seams for A1/G1 |
| R1 review of A1 | running | read-only reviewer |
| I1a integrate A1+U1, live rig HUD | running | worktree branch (see report) |

## Decisions log

- 2026-11-11 Work on branch `nextgen` in the `containment-game` project; partial + sparse clone (historical evidence folders excluded).
- 2026-11-11 Four rigs aligned with the four existing boon paths; keys Shift/Q/F/V; rig chosen before the starting boon.
- 2026-11-11 Stay on WebGL2/`WebGLRenderer`; perspective camera is an evaluated option inside G1, adopted only if framing guarantees hold.
- 2026-11-11 Legacy `newRun()` keeps working with a default Breacher rig until the rig-select UI is wired (keeps smoke green between merges).
- 2026-11-11 After reviewing the baseline gallery: closer follow camera (marine 110–140 px at 1080p), designed out-of-bounds, off-screen threat indicators + room radar; climax rooms (reactor, boss arena) get the most dramatic lighting. Sent as addenda to G1 and U1.
- 2026-11-11 Baseline `combat-heavy` scenario stacks enemies on a stationary marine; streams add a kiting scenario for readability judgments (harness v2 at Integration 1).
