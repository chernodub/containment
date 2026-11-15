# Stream M10 — Melee attack states and bold motion

You are the **combat motion lead**. Read `AGENTS.md`, `docs/nextgen/00-VISION.md`, `docs/nextgen/01-ENGINEERING.md`,
`docs/nextgen/streams/M9-motion-feel.md`, `docs/nextgen/M9-REPORT.md` and `docs/nextgen/plans/M9-motion-audit.md` first.
The M9 strip harness (`scripts/nextgen/m9-motion.mjs`, `m9-contacts.mjs`), `src/render/motion/**` and the before/after
strips in `artifacts/nextgen/m9-final/` (main checkout: `/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/m9-final/`)
are your starting point.

## Lead review of M9

M9 built the vocabulary and an honest audit (marine 3.25 → 5.39, enemies 3.27 → 4.79 out of 10). Looking at the final
strips myself: the poses are **timid**. `brute-warden-attack.png` is a slight lean; `crawler-heavy-hit.png` is a
flash and a twitch; the marine's hit reaction scores 4. Two causes:

1. A very tight self-imposed offset cap (0.055 m) and restrained rotations — no exaggeration.
2. A real design gap M9 correctly refused to paper over: **contact-only melee enemies have no attack wind-up in the
   simulation**. The most common enemy damages the marine by touching him. No animation can make that readable or fair.

This stream fixes both. Target: every audited action ≥ 7/10 by the same harsh scale, attack and hit actions ≥ 8.

## Part A — Melee attack states (simulation; the one authorised gameplay change)

For every enemy that currently deals damage on contact, replace contact damage with a deterministic attack state
machine in the simulation:

- `approach → windup → strike → recovery`. Wind-up starts when the marine is inside the family's engage range and the
  enemy holds an attack slot (keep the existing separation and max-engaged-melee rules). Facing locks at a defined
  point late in the wind-up. The strike resolves once, at the strike instant, against a family-specific shape
  (short lunge arc / swipe cone / pounce line) — the marine is hit only if inside it then. Dash i-frames, sidestepping
  and knockback therefore work as counterplay. Recovery is a punish window (slower turn, no new attack).
- Family identity through timing and shape (starting values, tune them): small swarmers — short wind-up ~260 ms,
  short lunge, quick recovery; stalker-type — longer ~420 ms crouch then a long fast pounce line, long recovery;
  heavy types — 600 ms+ overhead with a wide arc; elites faster or with a second swing. Frozen/stunned/shoved enemies
  cancel their wind-up. Overclock's hostile time scale applies.
- Each wind-up emits a small ground telegraph through the existing hostile telegraph path (danger color, exact strike
  shape, lowest visual weight tier so a swarm does not carpet the floor — size/intensity scale with threat) and
  snapshot fields the renderer needs: attack phase, progress 0–1, locked angle, strike shape. Additive fields with
  tests; checkpoints stay backward compatible (mid-attack state need not persist — rooms restart clean).
- Determinism: seeded, fixed-step, no wall clock; cover with deterministic unit tests (state transitions, single
  resolution, cancel rules, i-frame dodge, slot limits, time scale) and keep every existing gameplay assertion that
  still describes intended behaviour. Tests that pin "touch = damage" are replaced by the equivalent attack-state
  guarantee and listed in the report.
- Balance: enemies now miss, so the game gets easier. Retune contact-family damage / attack cadence (not player
  stats) to bring it back. Evidence: **one** `npm run playtest:sim` cohort before and one after — 20 seeds × 4 rigs,
  same seeds — targets: campaign completion 40–65%, no rig below 35%, Transmission holdout 60–75 s. At most two tuning
  iterations; then record the numbers honestly and stop. No pre-registered audits, no N160, no new proof tooling.
  The playtest bot must learn the new counterplay only as far as "dash or step out of a telegraphed strike".

## Part B — Bold motion (presentation)

Apply classic exaggeration: anticipation, squash and stretch, overshoot and settle, follow-through, arcs.

- **Measured silhouette change.** Extend the strip tool to compute actor masks (strips have a flat background) and
  report IoU of the peak pose against the idle pose. Required: attack anticipation peak ≤ 0.65, strike extension
  ≤ 0.60, heavy hit ≤ 0.75, light hit ≤ 0.88, marine hit ≤ 0.80, each marine ability cast ≤ 0.75 and the sixteen cast
  peaks mutually distinguishable (pairwise IoU ≤ 0.85 within a rig). Every pose must also read when the strip is
  downscaled 4× — look at that, the number alone is not acceptance.
- **Bounds, relaxed.** The simulated root, ground ring, health bar, telegraph and hitbox never move. The drawn body
  may lean/lunge/recoil up to 35% of the actor's body radius for ≤ 250 ms (strike lunges may follow the simulated
  strike shape fully). State and test the bound.
- **Enemy attacks**: wind-up pose held and unmistakable per family (coil, rear up, raise limbs, open maw), a strike
  with 2–3 frame smear/stretch along the strike shape, overshoot, a visibly off-balance recovery.
- **Hits**: directional bend through the whole spine/limbs, not a twitch; heavy hits lift or spin small enemies and
  stagger-step large ones; kill blows carry momentum into the ragdoll. Frost kills shatter into anatomical chunks,
  burn kills char and collapse, arc kills convulse then drop, acid kills dissolve — each recognisable in one frame.
- **Marine**: true eight-direction locomotion (strafe and backpedal cycles built procedurally from the rig — crossover
  steps, hip counter-rotation — not a rotated forward run), lean into acceleration, slide-stop on reversal; hit
  reaction that bends him away from the source with a stumble step; a distinct body pose for each of the sixteen
  abilities (slam = overhead two-hand drop to one knee, rail shot = braced wide stance with recoil slide, nova =
  arms-out burst, etc.); a real death (articulated collapse using the ragdoll system, direction from the killing blow).
- **Breach emergence**: enemies climb/squeeze out of the breach with a family-specific entrance instead of a rise.
- **Hit-pause and camera**: keep capped actor-local holds; add a brief global presentation hold (≤ 45 ms, rate-limited,
  scaled by `screenShake`, off at 0) only for Overdrive impacts, elite kills and the marine taking a heavy hit.

## Method and rules

- Standard on three subjects first (marine, the most common swarmer, the heaviest regular enemy): at least three
  written critique → fix rounds with fresh strips (`docs/nextgen/plans/M10-review.md`), then propagate to every family.
- You own `src/render/motion/**`, the actor/weapon/ragdoll files M9 owned, and — for Part A only — the enemy attack
  logic under `src/game/**` plus the bot policy under `scripts/nextgen/`. Another stream (E9) is editing
  `src/render/world/**` and room modules: do not touch them. Keep `DepthRenderer.ts` edits tiny and delimited. Do not
  edit ability rules, player stats, room plans, UI or audio synthesis (request audio cues for wind-up/strike under
  "Integration requests"; route existing cues if a suitable one exists).
- Budgets: no per-frame allocation, no new mid-combat shader programs, batching/skinning contracts intact; heavy-combat
  bench CPU before/after reported (M9: 7.70 → 7.80 ms). Hardware certification belongs to the integration agent.
- Preserve persistence, navigation, accessibility and native capture assertions. List every rewritten test.
- Do not use computer-use / desktop-control tools. One browser at a time; rerun load-induced failures in isolation
  (`VITEST_MAX_WORKERS=2`). Blender is not installed (known gap in the Python asset tests) — runtime/procedural
  animation on existing rigs only. Up to 5 Sol sub-agents with disjoint families/files; review their strips yourself.
- Commit on your worktree branch, clean tree, no push, no PR. Delete intermediate rounds; keep
  `artifacts/nextgen/m10-final/` (before = M9 final, after, IoU table, 4× downscaled sheets, one native combat burst
  per family showing wind-up telegraph → strike → recovery in a real room).
- Converge: when the gates pass once and the scores are honest, stop.

## Acceptance

- JavaScript gates in `01-ENGINEERING.md` plus `npm run playtest:smoke`; one native campaign
  (`npm run playtest -- --rig=breacher --seed=1729`) completing without errors.
- `docs/nextgen/M10-REPORT.md`: attack-state table per family (timings, shape, damage before/after), balance cohort
  before/after, IoU table, score per action M9 → M10, rewritten tests, integration requests, and the honest list of the
  weakest remaining motions.
