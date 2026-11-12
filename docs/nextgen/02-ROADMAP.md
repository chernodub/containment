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

| Stream | State | Notes |
|---|---|---|
| Waves 0–3 (W0, A1, U1, G1, S2, U2, V2, G2, V3, P1, F2, D1, R1/R2/R4/R5 reviews, X1–X3 fixes, I1a…I7 integrations) | merged | `nextgen` @ d8f9d45: 2984 tests, smokes, 20/20 authored rooms, bot campaigns for all four rigs; final gallery `artifacts/nextgen/final/` |
| R6 second independent verdict | done | 6/7/4/5/5/5 — "advanced prototype visually, polished-indie UI"; see `reviews/R6-verdict.md` |
| Lead benchmark on final build (2026-11-12) | done | High: frame p50 33 ms / p95 42 ms (GPU-bound, render JS p50 7 ms); Low: p50 16.7 ms; draws ≤ 336 |
| **Wave 4** — direction in `streams/W4-direction.md` | running | |
| G3 inked graphic look + GPU frame time to 60 fps | running | post pipeline, prepass, adaptive resolution |
| G4 world forms kit, enemy footprint, danger priority, camera framing, title, Queen | running | |
| V4 abilities: distinct constructions, friendly effects yield | running | |
| A3 enemy separation + encirclement, re-balance | running | |
| U4 UI: overlays out of combat, element-true feedback, card copy, ending | running | |

Next (lead): merge A3 → U4 → V4 → G4 → G3 (integration task), gates, bench on a quiet host, final gallery, third independent verdict.

## Decisions log

- 2026-11-11 Work on branch `nextgen` in the `containment-game` project; partial + sparse clone (historical evidence folders excluded).
- 2026-11-11 Four rigs aligned with the four existing boon paths; keys Shift/Q/F/V; rig chosen before the starting boon.
- 2026-11-11 Stay on WebGL2/`WebGLRenderer`; perspective camera is an evaluated option inside G1, adopted only if framing guarantees hold.
- 2026-11-11 Legacy `newRun()` keeps working with a default Breacher rig until the rig-select UI is wired (keeps smoke green between merges).
- 2026-11-11 After reviewing the baseline gallery: closer follow camera (marine 110–140 px at 1080p), designed out-of-bounds, off-screen threat indicators + room radar; climax rooms (reactor, boss arena) get the most dramatic lighting. Sent as addenda to G1 and U1.
- 2026-11-11 Baseline `combat-heavy` scenario stacks enemies on a stationary marine; streams add a kiting scenario for readability judgments (harness v2 at Integration 1).
- 2026-11-11 Integration 1 complete: abilities + UI + graphics live together on `nextgen` (2e228be). Lead review: generational jump achieved in lighting/camera/HUD; weakest links now are enemy readability, prop/surface quality, boss staging, title, ability VFX (interim), audio.
- 2026-11-12 After R6: commit to a graphic inked look (stylize to unify actors and procedural props) and a strict combat visual priority (danger > marine/cursor > enemies > friendly effects > world > HUD). High tier must hold 60 fps on an M1 Pro.
