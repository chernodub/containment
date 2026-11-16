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
| **Wave 9** — what the player sees and feels (E9 interiors + original ship kit, M9/M10 motion and melee attack states, K10 original marine + arsenal) | merged | `nextgen` builds with all four merged. E9: palettes, real walls, original Blender ship kit, draw misses fixed (≤ 296 draws); High frame p95 24–33 ms miss. M10: authored clips (69 marine, 23 per family), telegraphed melee strikes; motion self-scores marine 7.33, enemies 7.36; balance "rescued" to 65% bot completion only by raising swarmer damage to 78/100 — rejected by lead, see B10. K10: original marine with four colour-blocked rigs and five weapons (22–25k tris), accepted after a second pass. |
| **Wave 10** — B10 human balance, U10 hero UI + rendered title, E10 baked floors/light/shadows/cover, C10 melee readability (telegraph, lunge alignment, family audio cues) | merged | `nextgen` @ 00c91f5f builds. B10: competent bot 42.5%, expert 100%, novice 2.5% (miss → D11). E10: all twenty rooms re-floored and re-lit, draws 149–277; frame time unverified on a loaded host (→ F11). Sol's K11 creature attempt rejected (toy-like), kept on `t3/k11-sol-wip`. |
| **Wave 11** | running | model routing by owner: Opus only for critical models, Astra for decor and reviews, Sol (low effort) for the rest |
| K11 original creature families "Lantern Brood" — Opus, modelling only (`streams/K11-original-creatures.md`) | merged | five castes + elites + two boss-class, 7.6–17k tris; Brute, Spitter, Carrier clearly better than before; Crawler/Stalker leaner (Stalker weaker than the old one — follow-up candidate) |
| K12 hero-quality marine, four rigs, portraits — Opus, modelling only (`streams/K12-hero-closeup.md`) | merged | 24k tris, one 2k set; back view lightened after lead review |
| I11 model integration (deformation, lantern feedback, support-hand grip, meshopt packing 45.9 → 37.4 MB, credits) — Sol | merged | Unvanquished marine/creature meshes no longer ship; open modelling requests: thin Stalker limbs, tasset overlap, Pyro hoses |
| KA12 title key art (torn breach, Lantern Brood silhouettes), ending image, second-generation weapons — Astra | merged | title accepted after a second pass with lead direction |
| P11 one hero set piece per room, kit craft pass, infestation set — Astra (`streams/P11-set-pieces.md`) | running | redirected by R11: fixture hierarchy, one incident per room, infestation masses, per-room punch list |
| G12 review gallery `final6` — Sol | done | 4,127 images in `artifacts/nextgen/final6/` |
| D11 difficulty modes (Story/Standard/Veteran), in-play hints, "how you died" — Sol | merged | Story 57.5% novice, Standard 42.5% competent; Veteran expert 96% (too easy for experts, accepted for now) |
| F11 per-pass GPU/CPU breakdown tool and small cuts — Sol | merged | max 124 draws, zero combat compiles; frame budget cannot be certified on the loaded host |
| T12 texture right-sizing and KTX2 compression for actors/weapons — Sol | running | marine textures ≈ 85 MiB GPU |
| **R11** independent verdicts by two Astra reviewers on `final6` | done | visual 5–7, play 5–7: "advanced prototype with a commercially presentable vertical slice" — `reviews/R11-verdict.md` |
| **Wave 12** — from the R11 findings | running | |
| CAM12 camera and framing you can trust (whole marine in the usable viewport, threat-aware bias, edge indicators) — Sol | running | |
| FEEL12 aim/body/beam agreement, unmistakable small-enemy commitment, hit and kill chains, run conviction — Sol | running | |
| VFX12 ability effects with force and aftermath; translucent-marine fix — Astra | running | |
| ENC12 encounter grammar and role AI, elite saturation cut, Warden/Matron demands, teaching beats, eight transformative augments, economy and route — Sol | running | |
| K11b creature second pass (mass, legs, Stalker, Carrier, elites, boss-class silhouettes) — Opus, modelling only | running | |
| RW12 reward cards with illustrations, ending composition, re-posed rig portraits — Astra | running | |

Next (lead): merge wave 12; re-integrate creatures; performance certification on a quiet machine (nothing else running); gallery `final7`; R12 review by the same two lenses.

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
- 2026-11-15 After M9: contact-only melee damage is replaced by deterministic attack states (wind-up → strike → recovery, telegraphed, dodgeable) — the second authorised gameplay change after L8; balance re-verified with one before/after bot cohort, not an audit programme.
- 2026-11-15 Owner decisions: (1) all automated tests and test gates removed (commit 4b2a5f4, tag `pre-test-removal`) — verification is build + bot playtest + looking at captures; (2) Blender installed and ground-up remodelling authorised. E9 may model an original ship kit, M10 authors real animation clips, K10 builds an original marine and arsenal. If K10 succeeds, original creature families follow.
- 2026-11-16 Owner routing: 3D modelling by Claude Opus (subagents on Opus too), all other execution by GPT Sol at low reasoning effort, reviews/feedback by Opus and GPT Astra.
- 2026-11-16 Owner refinement: Opus tokens are scarce — Opus only for the hero and creature models; decor to Astra; integration and verification to Sol.
- 2026-11-16 Lockfile regenerated so npm 10 (used by the Codex sandbox) and npm 11 both pass `npm ci`; the lockfile produced after removing the tests had blocked three streams. Low-effort Sol and medium Astra tend to stop early with "incomplete delivery": briefs now say how long the job takes and forbid partial stops; unfinished runs are resumed in the same thread.
