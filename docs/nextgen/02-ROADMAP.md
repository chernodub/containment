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
| P11 one hero set piece per room, kit craft pass, fixture hierarchy — Astra (`streams/P11-set-pieces.md`) | merged | all twenty rooms placed, campaign clears, ≤ 330 draws; lead review: breach and several landmarks improved, but infestation is still thin strands (Swarm Junction) and rooms still lack incidents/belongings (Residential) |
| GROW13 Brood growth kit, fifteen pieces incl. hive heart — Opus, modelling only | merged | review placement turns Swarm Junction into a stronghold |
| DRESS13 growth-kit placement in rooms 15–20 and a staged incident in every room, with a correction pass — Sol | merged | Swarm Junction reads as a stronghold; Residential shows an interrupted evacuation; 277 draws peak |
| G13 review gallery `final7` — Sol | done | 4,258 images; native campaigns died after 11/6/2/7 rooms (Standard) and 3 rooms (Story novice) — far from the sim's numbers |
| **R12** on `final7` — Astra visual and play verdicts, Opus art-director pass | done | visual 5.5–6.5, play 4.5–7; readability, counterplay and feel +1; environments and characters unchanged; pacing worse — `reviews/R12-verdict.md` |
| **Wave 13** | running | |
| LIGHT13 "the ship is dark; actors carry the light" standard on three rooms — Opus | merged | data-driven `ROOM_VALUE_PROFILES`; floor luminance roughly halved, marine plates ≈ 210, creatures dark with hot lanterns |
| LIGHT14 the value standard in all twenty rooms, then a landmark correction — Sol | merged | twenty distinct rooms at 480×270; every landmark lit and emissive; marine first, threats second, landmark third |
| BAL13 sim-versus-native gap and early deaths — Sol | merged | causes: 2× incoming damage on Standard, late bot healing, different visibility models. Now: per-hit damage bounds, anti-chain grace, gentle rooms 1–4, shared visibility module. Sim: Story 62.5%, Standard 56%, Veteran 12.5%; no death before room 6 in 240 runs; 4/4 native campaigns completed. Open: Pyro 35% vs Breacher/Cryo 65–80% (→ KIT13) |
| KIT13 Pyro burn cash-out and survivability, Glacier on-demand shatter, Static Step chain stun, Ram crush into Bulwark, first Overdrive by room 4 — Sol 6.2 | merged | sim completions /20 (Story, Standard): Breacher 18, 7; Cryo 13, 13; Pyro 17, 11; Arc 9, 15. Native Standard: three of four rigs cleared all 20 rooms. Open: Arc on Story, Breacher on Standard; HUD hint for Glacier second press; 5 s room loads flagged twice |
| G14 review gallery `final8` — Sol 6.2 | running | then R13 |
| PERF14 room load ≤ 3 s (5–6 s holds flagged), High frame p95, main-thread cost — Sol 6.2 | running | |
| VFX15 four different Overdrive climaxes, Napalm with flame tongues, shared effect-area cap — Opus | merged | Frost Trail and Ram left for a later pass |
| K13 Warden and Matron as a real boss tier (≈ 2× marine), brood pod asset, Stalker/Carrier/Spitter fixes — Opus, modelling only | merged | |
| I13 boss footprints and collision to match, pod prop with hatch countdown, Warden wall-stun cue, LOD/KTX2 repack — Sol | merged | Story/Arc campaign cleared 16 rooms incl. Warden and Matron, zero errors; Matron (1.4×) reads less imposing than the Warden (2.3×) |
| COMM13 siege area and charge, priority vs resistance markers, off-screen shot cue, Stalker reveal, beat signals — Sol 6.2 | merged | finished its whole list in one run; resistance outline, breach flare and Stalker recovery still subtle at 480×270 |
| UI13 31 distinct reward studies, transform before/after diagrams with "you lose", illustrated shop and route cards, grouped loadout/results — Astra 6.2 | merged | finished its whole list in one run |
| INC13 one dominant incident per room as a large readable shape with floor carry-over and its own light — Astra 6.2 | merged | all twenty rooms; ≤ 325 draws (Freight 589 → 135, Transmission 1,801 → 140); weakest: Infested Workshop strands, Shielding Gate |
| PERF13 creature LODs, shadow proxies, camera/main-thread CPU — Sol | merged | triangles −32%, profiled thread CPU per render 17.2 → 7.9 ms; frame p95 ≤ 20 ms in 11/16 configurations (all Low, 3 of 8 High) on a loaded host — High still misses in five |
| G12 review gallery `final6` — Sol | done | 4,127 images in `artifacts/nextgen/final6/` |
| D11 difficulty modes (Story/Standard/Veteran), in-play hints, "how you died" — Sol | merged | Story 57.5% novice, Standard 42.5% competent; Veteran expert 96% (too easy for experts, accepted for now) |
| F11 per-pass GPU/CPU breakdown tool and small cuts — Sol | merged | max 124 draws, zero combat compiles; frame budget cannot be certified on the loaded host |
| T12 texture right-sizing and KTX2 (self-hosted Basis transcoder, plain fallback set) — Sol | merged | actor/weapon textures 233 → 8.3 MiB GPU (marine 85 → ~3), scene texture payload 372 → 147 MiB; creature files to be repacked from the second-pass models by the integration stream |
| **R11** independent verdicts by two Astra reviewers on `final6` | done | visual 5–7, play 5–7: "advanced prototype with a commercially presentable vertical slice" — `reviews/R11-verdict.md` |
| **Wave 12** — from the R11 findings | running | |
| CAM12 whole-marine framing envelope, usable viewport, threat-aware bias, grouped edge indicators — Sol | merged | 41,200-pose sweep: minimum clearance 12 px; open: four room-AABB exceptions, one attacker/bar overlap, higher CPU cost |
| FEEL12 aim/body/beam agreement, small-enemy commitment, hit and kill chains, crowd-safe warnings (outlines, union), marine light and solid — Sol | merged | |
| VFX12 translucent-marine fix — Astra | merged | Astra fixed the x-ray self-occlusion, then could not carry the effects rework |
| VFX13 flagship effects: Flashfire, Railbreaker, Cryo Nova, Overdrive moments (one pooled shader module) — Opus | merged | clear step up; author says still short of commercial bar (fire is a sheet, not a volume) |
| VFX14 the other twelve abilities and deployables with the same technique — Sol | merged | Sol names Napalm Charge, Ram, Frost Trail, Overclock as still weakest |
| ENC12 encounter scripts per room and role AI, elite saturation cut, Warden/Matron demands, teaching beats, eight transformative augments, supply stops and route choice — Sol | merged | Story/novice 57.5%, Standard/competent 42.5%, Veteran/competent 20%; rig imbalance and pod/relay presentation limits noted in `ENC12-REPORT.md` |
| K11b creature second pass — Opus; second-pass integration and KTX2 repack — Sol | merged | creature textures 132 → 4.8 MiB, downloads 23.7 → 8.1 MB; named emissive regions `warden-ram`, `matron-vents` |
| RW12 reward cards with illustrations and behavioural headlines, ending composition (transmission leaving the dying ship), re-posed rig portraits — Astra | merged | illustrations are variations of one canister form — candidate for a later pass |

Next (lead): after BAL13 — COMM13 (mechanics visible on screen: siege radius, pod countdown, priority vs resistance, Warden stun, off-screen shooter cue, Stalker reveal; priority kills with consequences); after LIGHT14 — dominant incident shapes in five signature rooms; then gallery `final8` and R13.

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
- 2026-11-17 Owner asked to push while iterating: `nextgen` is pushed to the public fork `chernodub/containment` (branch `nextgen`, never `main`) after every merge.
- 2026-11-17 Owner: reviews by Opus or Astra at high reasoning. R12 uses Astra (extra-high, then high after a request-size failure) for the two exhaustive verdicts and a bounded Opus art-director pass. Adopted from R12-C as the art direction for wave 13: "the ship is dark; actors carry the light".
- 2026-11-18 Owner: new GPT delegates use the 6.2 models (`gpt-6.2-sol`, `gpt-6.2-astra`).
