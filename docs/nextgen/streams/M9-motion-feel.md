# Stream M9 — Motion and game feel

You are the **motion lead**. Read `AGENTS.md`, `docs/nextgen/00-VISION.md`, `docs/nextgen/01-ENGINEERING.md`,
`docs/nextgen/streams/W4-direction.md` (combat visual priority) and `docs/nextgen/reviews/R10-verdict.md` first.

## Why this stream exists

Seven review rounds judged still frames. Nobody has yet judged the game **in motion**, and a premium action game is
decided there: how the marine plants, turns and fires; whether a hit lands with weight; whether an enemy announces its
attack with its body; how a kill reads. Your job is to audit motion honestly with frame strips, then raise it.

## Scope and ownership

You own actor animation and per-hit feedback presentation:
`src/render/Actor*.ts`, `MarineRigAnatomy.ts`, `FamilyAnatomy.ts`, `models.ts`, `weapons.ts`, `AttackEffects.ts`,
`DeathRagdolls.ts`, `EnemyHealthBars.ts`, `src/render/vfx/ActorSurface.ts`, the feedback (trauma/kick/punch) parts of
`src/render/camera/CameraRig.ts`, and new modules under `src/render/motion/**`. Keep edits to `DepthRenderer.ts`
tiny and delimited. You do **not** own: world/room modules (`src/render/world/**`, room files — stream E9 is editing
them right now), ability VFX (`src/render/abilities/**`), UI, audio synthesis, or any simulation result.

Render-only rule: the simulation stays deterministic and untouched. Hit-stop, squash, anticipation poses and impact
holds are **presentation time** effects derived from snapshots and `GameEffect` events — they never delay or alter a
simulation step, a hit, or input. If you need an event or snapshot field that does not exist (e.g. attack wind-up
progress, hit direction, stagger), add it as an additive, deterministic, tested field and list it in the report.

## Step 1 — Audit (before changing anything)

Add a capture mode that records **frame strips**: N consecutive frames at fixed simulation steps (e.g. 12 frames,
every 2nd 60 Hz step) cropped around the subject at native scale, assembled into one PNG per action. Record and
look at, for the marine and for each enemy family (and elite/boss-class actors that occur in the 20-room story):

- marine: idle, run in 8 directions relative to aim (forward, strafe, backpedal), stop/start, fire each weapon class,
  reload, weapon switch, dash, each ability cast pose, taking a hit, death;
- enemies: idle, locomotion, attack wind-up → strike → recovery, taking a light hit, taking a heavy hit, stagger,
  status states (frozen, burning, shocked), death/gib, spawn from a breach.

Write `docs/nextgen/plans/M9-motion-audit.md`: per action a 0–10 score against "premium top-down action game", what is
wrong in plain words (foot sliding, no anticipation, popping, weightless hits, identical cycles, stiff torso, no
follow-through…), with the strip path. Be harsh; a strip that reads as a rigid model sliding gets a 3.

## Step 2 — Standard on three subjects, then propagate

Set the standard on **the marine, the most common melee enemy and the most common ranged enemy**; at least three
critique → fix rounds with new strips each round, written down. Then propagate to every family.

Targets:
1. **Marine locomotion**: legs match velocity (no sliding at any speed or strafe angle), upper body aims independently
   with torso twist limits, lean into acceleration, a visible plant on stop, breathing idle. Distinct fire recoil per
   weapon class through the shoulders, reload and switch readable in silhouette.
2. **Enemy attacks announce themselves with the body**: a held anticipation pose that is unmistakable in silhouette
   and synchronised to the existing telegraph timing (never changing when the hit happens), a fast strike, a recovery
   the player can punish. Each family has its own gait and attack silhouette.
3. **Hits have weight**: directional flinch from the hit direction, brief presentation hit-pause on heavy hits and
   kills (scaled by weight, capped, honoring `screenShake`/`flashIntensity` and never stacking into a stutter in
   crowds), squash/stretch on impact, knockback follow-through, readable stagger. Kills: family-specific death with
   momentum from the killing blow; overkill and elemental kills differ (shatter, burn-out, arc-convulse).
4. **Weapon feedback**: muzzle flash shape per class, shell/brass or energy vent, tracer and impact spark matched to
   surface/actor, camera kick with quick recovery. Firing a full magazine must not obscure enemies or telegraphs.
5. **Crowd behaviour stays readable**: desynchronised cycles, no synchronized marching, small enemies never pop.

## Rules

- Budgets: High holds frame p95 ≤ 20 ms at 1920×1080 with a full crowd; animation work per actor must be bounded
  (pooled, no per-frame allocation, no new shader programs mid-combat, skinning/batching contracts preserved).
  Measure CPU cost in the heavy-combat bench scenario before/after and report it; hardware certification is done
  later by the integration agent.
- Combat priority: danger > marine/cursor > enemies > friendly effects > world > HUD. Motion feedback may not hide a
  telegraph or move an actor's drawn position away from its simulated position by more than a small bounded offset
  (state the bound and test it) — visual feedback never determines or misrepresents a hit.
- Preserve all gameplay, determinism, persistence, accessibility assertions and existing actor/action/phase/priority
  capture assertions. Presentation pins superseded by the new motion may be rewritten to equivalent guarantees; list
  each in the report.
- Do not use computer-use / desktop-control tools. One browser at a time. Rerun load-induced failures in isolation
  with `VITEST_MAX_WORKERS=2`. Blender is not installed; Blender-dependent Python tests are a known local gap — do
  not regenerate model assets through Blender. Procedural/runtime animation on the existing rigs and meshes is the
  expected approach.
- You may use up to 5 Sol sub-agents with disjoint actor families/files; review their strips yourself before accepting.
- Work in your worktree only; commit on your branch; clean tree; no push, no PR. Delete intermediate capture rounds;
  keep `artifacts/nextgen/m9-final/` (before/after strips per action). Converge when gates pass once.

## Acceptance

- JavaScript gates in `01-ENGINEERING.md`, plus `npm run playtest:smoke`.
- `artifacts/nextgen/m9-final/`: before/after strip sheets for every audited action and an `index.html`.
- `docs/nextgen/M9-REPORT.md`: audit scores before → after per action, added snapshot/event fields, rewritten pins,
  measured CPU cost, and an honest list of the motions that are still weakest.
