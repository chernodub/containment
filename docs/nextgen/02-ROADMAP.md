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
| Waves 0–6 | merged | see git history and reports under docs/nextgen/ |
| Wave 7 (K7 creature redesign, E7 floors/infestation/lighting/framing, V7 ultimates + VFX language + placement preview, I11 integration) | merged | `nextgen` @ a63eb1f: 3,852 tests, smokes, 20/20 rooms; bench 77/80 (Freight/Breacher High p95 ≈ 24 ms); gallery `artifacts/nextgen/final5/` |
| R10 independent verdict | done | 7 / 7.5 / 7 / 5.5 / 6 / 6.5 — biggest blocker: rooms look like modular arenas — `reviews/R10-verdict.md` |
| **Wave 8** — level architecture (L8 ship plans, V8 ability polish, U9 combat HUD) | merged | `nextgen` @ 13496bd. L8: all twenty rooms re-authored as hull-connected ship plans with named sub-spaces; 5,264 tests + 20/20 authored rooms on its branch. Accepted balance record (N160): 58.75% completion; misses: rig spread 16.25pp, ordinary median 29.92 s. Open: eleven staged draw-cap misses (Armory, Freight, Transmission kiting), intermittent smoke failure (kit fetch aborted on return to menu), and — lead review of `l8-final` — most gameplay frames still show bare tile grid with walls reading as floor stripes. |
| **Wave 9** — what the player sees and feels | running | |
| E9 room interiors: walls that read as walls, floor zoning per sub-space, function furnishing, fixture light (`streams/E9-room-interiors.md`) | running | also owns the smoke abort bug and the three draw-cap rooms |
| M9 motion and game feel: frame-strip audit, marine locomotion, enemy attack anticipation, hit weight, deaths (`streams/M9-motion-feel.md`) | running | first motion judgment of the project; render-only |

Next (lead): I12 integration + acceptance alone (Freight/Breacher frame miss, per-rig native campaigns, bench ×5), gallery `final6` incl. motion strips, seventh independent verdict (stills + motion).

## Decisions log

- 2026-11-11 Work on branch `nextgen` in the `containment-game` project; partial + sparse clone (historical evidence folders excluded).
- 2026-11-11 Four rigs aligned with the four existing boon paths; keys Shift/Q/F/V; rig chosen before the starting boon.
- 2026-11-11 Stay on WebGL2/`WebGLRenderer`; perspective camera is an evaluated option inside G1, adopted only if framing guarantees hold.
- 2026-11-11 Legacy `newRun()` keeps working with a default Breacher rig until the rig-select UI is wired (keeps smoke green between merges).
- 2026-11-11 After reviewing the baseline gallery: closer follow camera (marine 110–140 px at 1080p), designed out-of-bounds, off-screen threat indicators + room radar; climax rooms (reactor, boss arena) get the most dramatic lighting. Sent as addenda to G1 and U1.
- 2026-11-11 Baseline `combat-heavy` scenario stacks enemies on a stationary marine; streams add a kiting scenario for readability judgments (harness v2 at Integration 1).
- 2026-11-11 Integration 1 complete: abilities + UI + graphics live together on `nextgen` (2e228be). Lead review: generational jump achieved in lighting/camera/HUD; weakest links now are enemy readability, prop/surface quality, boss staging, title, ability VFX (interim), audio.
- 2026-11-12 After R6: commit to a graphic inked look (stylize to unify actors and procedural props) and a strict combat visual priority (danger > marine/cursor > enemies > friendly effects > world > HUD). High tier must hold 60 fps on an M1 Pro.
- 2026-11-13 After R8: code-authored art has plateaued. Allow artist-authored assets under CC0 only (Quaternius, Kenney, Poly Haven and similar; license text and source URL recorded per pack; no CC-BY-NC/unknown), restyled through the ink/banded pipeline.
- 2026-11-15 After R10: lift the visual-only rule for ONE deliberate level-architecture pass (L8): room templates may change (boundaries, obstacles, breaches) to become authored ship spaces, with navigation tests, bot soak and balance cohorts re-verified; template ids, the 20-room route and story stay.
- 2026-11-15 L8 converged by lead decision after ten hours: balance frozen at the audited c7 source, hairline misses accepted rather than chased with further cohorts. Lead review of `l8-final`: plans are right, frames are not — wave 9 inserts a presentation-only interiors pass (E9) and the first motion/game-feel stream (M9) before the next independent review.
