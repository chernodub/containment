# I5 Node emulation v8

**Paired cohorts complete; lead assessment and final native comparison pending.** Mode `sim-policy-v8` corrects confirmed Node emulation differences while the native client, gameplay numbers and shared decision policy remain frozen. Historical mode-v7 outcomes, JSON files and hashes stay intact. Their use for final acceptance is provisional after these fidelity findings. New baseline/current cohorts must both finish before evaluating the frozen V30 profile or making further tuning decisions.

The paired plan retains all twenty seeds per rig: primary `1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456`, plus `1000–1009`. Baseline uses historical gameplay `c3bd53b`; current uses unchanged V30 gameplay. Both use the same v8 backend and policy-v3 decision helpers. Each cohort has one CPU worker. Archival waits for the lead to confirm baseline session23401 and current session97533 have both been reaped, then independently verifies eighty raw reports and the twenty-seed set for every rig. Partial outcomes are not acceptance evidence.

## Confirmed emulation corrections

1. Native mouse movement alone does not refresh game facing. Immediate ability keydowns, including Shift, read the current cursor/held movement; G, R, E and weapon digits do not. V8 removes eager weapon-facing updates and the non-native facing restoration after abilities. Grenade-only, F→mouse-back→G and Shift→G regressions compare real `DepthGame` and `InputController` with fake Node event targets. The former v7 behavior demonstrably differed.
2. The native debug observer retains the latest 300 events across ordinary routes. V8 preserves that history and filters warnings with the same strict duration test, default 800 ms, rather than clearing at each route.
3. `sync-corpse` bypasses the native application effect observer before renderer logging and GameFeel. V8 returns before both operations too; such events cannot evict a warning from the300-event window.
4. Native hardest-moment pressure includes living Queen and nest targets with negative IDs as well as ordinary enemies. V8 counts the same targets. Each burst still advances held inputs at most three times by 1000/15 ms, stopping when play ends.
5. Native progress/deadline checks precede that diagnostic burst. V8 now enforces the existing strict 45 s no-progress and room-time limits at the same point. Story default 240 s and explicit legacy 360 s stay unchanged. V7 only recorded the 45 s condition and checked its room-time cutoff after the burst; historical v7 censors must be interpreted with that limitation.

These corrections implement native input/observation behavior. They add no movement, targeting, recovery or combat heuristic. Weapon selection still precedes `chooseActions` evaluated from the pre-switch snapshot. Purchases, healing thresholds, draft/route choices and four shared policy source files are unchanged.

## Frozen dirty-backend identity

At paired-cohort launch, workspace HEAD was `f49647668a116b9659dbdc151ac772a2bed33c75`; it did not identify the uncommitted Node backend patch. Native campaigns continue against the immutable approved application from that commit. No backend commit is made while those campaigns require the frozen HEAD.

| Identity | SHA256 |
|---|---|
| Shared policy | `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502` |
| V30 gameplay | `8fd2acce2caae11feea28311ade31ab0eb13c8934c1d4f56f749c22ede862957` |
| V8 backend sources | `63b80de0fedf804ff871b6ba1f2c75ea9afcb6b1be9ffcf338a2efe19affcde0` |
| Dirty backend patch | `ba2af0d134604aae987500727c8bc96a5258cf2126bba3692e542f61c9ff3abe` |
| Current v8 runtime bundle, one-room proof | `4e76f624b79afd6bd63c6f4273f45e98c5c32a0dbf89e113b68d396f5e12b5c7` |

Every CLI report and summary records `backendProvenance` separately from workspace HEAD. Each immutable source folder includes the new helper, exact backend source hashes, `backend.patch` and `backend-provenance.json`; workers execute copied worker code. Policy hashing reads the copied four decision files. The one-room source proof preserved gameplay and policy hashes. Its receipt is `artifacts/nextgen/i5-continuation/sim-v8-backend/freeze-proof.json` (SHA `cf56501b1a21d7728843109723bcb732f66dc3c372b5e96d704454b9d34b8594`).

Validation: 36 focused tests across 4 files passed, including 12 new emulation regressions (7 parameterized real InputController/EventTarget comparisons and 5 observer/pressure/censor helper tests); standard `npx tsc --noEmit` and an extended backend typecheck explicitly including `sim-core.ts` and its helper passed. Original gameplay/full-kit/cadence assertions were not rewritten. No large cohort or browser campaign was launched by the implementation helper; the lead owns the paired campaign jobs.

## Remaining limits and native evidence

Analytic camera/actor picking, DOM and resource-preparation timing remain observer approximations. The legacy Queen camera model still uses 0.43 boss weight/0.92 zoom while native uses 0.62/0.78 plus boss framing protection; this is documented, unchanged, and does not apply to the modern story encounters. The lead reports the actual native Queen checkpoint 139.7 s as authoritative; the separate selected-source Node legacy 280.6 s is retained as its own measurement.

The eight final native campaigns remain valid evidence for the frozen `f496476` client. Their mode-v7 Node comparison references are preserved in [selected-source provenance](I5-SELECTED-PROVENANCE.md); that snapshot must not be relabeled as v8. After both new80-run cohorts and all eight native campaigns finish, create a separate v8 comparison using the exact matched seeds and common-cleared-room metrics. Different endings alone do not prove a game defect, and Node outcomes must not be substituted for native outcomes.

## Completed paired 80-run measurements

# I5 — emulation-v8 paired campaign distributions

**Provisional: lead target assessment and final gates/native evidence pending.** Both complete 80-run cohorts were read only after each folder was independently verified to contain80 campaign reports and the lead confirmed both launch sessions had been reaped with exit0 (baseline23401/candidate97533). Independent process inventory was unavailable because the sandbox denied `ps` with EPERM; that limitation and the explicit termination evidence are recorded. All20seeds per rig are retained for both profiles. This document does not accept the profile. Historical v1/v2 evidence remains withdrawn and is not pooled here.

Frozen source commit **`f49647668a116b9659dbdc151ac772a2bed33c75`**; policy **`i5-catalog-ability-aim-v3`**, mode **`sim-policy-v8`**, shared policy SHA **`976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`**. The baseline uses historical gameplay revision `c3bd53b` with currentv3decision code; the candidate uses the frozen V30 gameplay with currentv3decision code. [Complete evidence](evidence/I5/I5-EMULATION-V8.json) contains all160 raw hashes, copied source hashes, paired80seed identities and per-rig/per-act/per-depth distributions.

Primary seeds: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. Supplemental seeds: **1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009**. No primary or supplement attempt is dropped.

| Profile | Game hash | Runtime bundle hash |
|---|---|---|
| baseline | `f7cb49329e57843eec613886391b9572e995572b6a5a63d0f74de8cc811c4a6c` | `87e2ccd89cc91eaf50c76684125fdd05ac73c00fd55618607bb8d1e06fd87d79` |
| candidate | `8fd2acce2caae11feea28311ade31ab0eb13c8934c1d4f56f749c22ede862957` | `4e76f624b79afd6bd63c6f4273f45e98c5c32a0dbf89e113b68d396f5e12b5c7` |

## Completion, charge and pacing

| Profile | Rig | Completed | Median rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Breacher | 19/20(95.00%) | 1.333333 [1.176–1.429] | 33.60 | 34.68 | 66.05 |
| Baseline | Cryo | 18/20(90.00%) | 1.333333 [1.333–1.429] | 37.48 | 38.24 | 72.41 |
| Baseline | Pyro | 13/20(65.00%) | 1.357143 [1.111–1.462] | 30.82 | 32.03 | 57.72 |
| Baseline | Arc | 18/20(90.00%) | 1.333333 [1.176–1.429] | 30.93 | 31.80 | 60.40 |
| Candidate | Breacher | 12/20(60.00%) | 1.428571 [1.176–1.556] | 32.94 | 34.75 | 67.05 |
| Candidate | Cryo | 12/20(60.00%) | 1.428571 [1.333–1.538] | 37.01 | 38.88 | 69.20 |
| Candidate | Pyro | 7/20(35.00%) | 1.378571 [1.176–1.667] | 28.27 | 30.09 | 57.41 |
| Candidate | Arc | 10/20(50.00%) | 1.428571 [1.333–1.667] | 30.45 | 32.77 | 59.67 |

**Baseline**: 68/80 completes, 12 deaths, 0 censors; pooled strict ordinary 32.97s, broad non-holdout 34.23s, Transmission 62.58s, median rooms/OD 1.333333. Cap violations 15/1268 classified ordinary attempts; unknown categories 0. First-five clears 400/400.

**Candidate**: 41/80 completes, 39 deaths, 0 censors; pooled strict ordinary 31.98s, broad non-holdout 34.18s, Transmission 61.98s, median rooms/OD 1.428571. Cap violations 0/998 classified ordinary attempts; unknown categories 0. First-five clears 400/400.

## Primary versus supplement

| Profile | Rig | Primary completions | Supplement completions | Combined completions |
|---|---|---:|---:|---:|
| Baseline | Breacher | 10/10 | 9/10 | 19/20 |
| Baseline | Cryo | 10/10 | 8/10 | 18/20 |
| Baseline | Pyro | 7/10 | 6/10 | 13/20 |
| Baseline | Arc | 8/10 | 10/10 | 18/20 |
| Candidate | Breacher | 6/10 | 6/10 | 12/20 |
| Candidate | Cryo | 6/10 | 6/10 | 12/20 |
| Candidate | Pyro | 4/10 | 3/10 | 7/20 |
| Candidate | Arc | 3/10 | 7/10 | 10/20 |

## Time and damage by act

Cells are median cleared-room seconds /median damage per attempted room; holdouts remain in act times and survivor denominators remain explicit in JSON.

| Profile | Rig | Act1 | Act2 | Act3 | Act4 |
|---|---|---:|---:|---:|---:|
| Baseline | Breacher | 27.27 / 0.00 | 40.02 / 10.70 | 37.27 / 13.39 | 47.71 / 28.99 |
| Baseline | Cryo | 30.53 / 0.00 | 42.52 / 10.70 | 39.91 / 23.68 | 49.14 / 35.02 |
| Baseline | Pyro | 23.71 / 0.00 | 34.73 / 12.53 | 34.12 / 13.94 | 43.15 / 56.39 |
| Baseline | Arc | 25.39 / 0.00 | 36.02 / 0.00 | 35.77 / 0.00 | 44.10 / 12.16 |
| Baseline | Pooled | 26.46 / 0.00 | 38.10 / 0.00 | 36.52 / 13.49 | 45.61 / 28.99 |
| Candidate | Breacher | 28.89 / 0.00 | 37.16 / 18.95 | 35.92 / 34.84 | 42.53 / 53.61 |
| Candidate | Cryo | 34.16 / 0.00 | 41.98 / 18.95 | 39.55 / 48.85 | 45.98 / 92.13 |
| Candidate | Pyro | 23.86 / 0.00 | 33.69 / 17.45 | 32.44 / 43.61 | 38.80 / 58.82 |
| Candidate | Arc | 27.20 / 0.00 | 35.13 / 0.00 | 34.68 / 30.15 | 40.88 / 41.37 |
| Candidate | Pooled | 27.82 / 0.00 | 37.00 / 13.53 | 35.60 / 36.85 | 42.02 / 62.33 |

## Pooled depth distributions

Each cell: clears/attempts; median clear seconds; median incoming damage. JSON retains full per-rig rows, p10/p90/ranges and accepted Overdrive distributions.

| Room | Baseline | Candidate |
|---|---|---|
| 1 | 80/80;18.60;0.00 | 80/80;19.14;0.00 |
| 2 | 80/80;29.38;10.08 | 80/80;29.93;10.08 |
| 3 | 80/80;30.32;0.00 | 80/80;33.17;0.00 |
| 4 | 80/80;23.49;0.00 | 80/80;26.48;10.24 |
| 5 | 80/80;30.77;0.00 | 80/80;31.99;0.00 |
| 6 | 80/80;40.48;11.45 | 80/80;39.72;17.06 |
| 7 | 80/80;30.69;0.00 | 80/80;32.51;10.74 |
| 8 | 80/80;28.15;0.00 | 80/80;26.94;13.57 |
| 9 | 80/80;39.52;13.20 | 80/80;35.80;20.75 |
| 10 | 80/80;62.58;24.37 | 80/80;61.98;22.16 |
| 11 | 80/80;36.08;12.28 | 80/80;34.45;29.72 |
| 12 | 80/80;36.33;11.24 | 79/80;34.35;36.85 |
| 13 | 80/80;37.23;13.59 | 79/79;35.95;41.99 |
| 14 | 80/80;36.56;21.67 | 75/79;35.02;49.13 |
| 15 | 79/80;36.07;23.67 | 71/75;37.52;34.74 |
| 16 | 78/79;57.63;50.05 | 63/71;50.85;54.77 |
| 17 | 76/78;38.76;18.00 | 61/63;35.32;41.50 |
| 18 | 74/76;34.36;26.57 | 57/61;31.85;68.76 |
| 19 | 74/74;41.89;17.51 | 55/57;41.33;57.67 |
| 20 | 68/74;66.78;69.77 | 41/55;56.73;113.23 |

## Death rooms and outgoing damage

| Profile | Rig | Natural death rooms |
|---|---|---|
| Baseline | Breacher | 17×1 |
| Baseline | Cryo | 20×2 |
| Baseline | Pyro | 15×1, 18×2, 20×4 |
| Baseline | Arc | 16×1, 17×1 |
| Baseline | Pooled | 15×1, 16×1, 17×2, 18×2, 20×6 |
| Candidate | Breacher | 12×1, 14×1, 15×1, 16×1, 18×2, 20×2 |
| Candidate | Cryo | 15×1, 18×1, 19×1, 20×5 |
| Candidate | Pyro | 15×2, 16×4, 18×1, 20×6 |
| Candidate | Arc | 14×3, 16×3, 17×2, 19×1, 20×1 |
| Candidate | Pooled | 12×1, 14×4, 15×4, 16×8, 17×2, 18×4, 19×2, 20×14 |

Damage-share percentages retain weapon/direct ability/status/boon buckets separately; the combined nonweapon share is not an isolated causal rig measure.

| Profile | Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Breacher | 58.61 | 20.05 | 4.84 | 16.50 | 41.39 |
| Baseline | Cryo | 48.66 | 20.32 | 6.10 | 24.92 | 51.34 |
| Baseline | Pyro | 46.41 | 18.56 | 17.70 | 17.33 | 53.59 |
| Baseline | Arc | 59.64 | 27.73 | 4.34 | 8.29 | 40.36 |
| Candidate | Breacher | 62.59 | 21.85 | 4.80 | 10.77 | 37.41 |
| Candidate | Cryo | 49.52 | 19.67 | 7.17 | 23.63 | 50.48 |
| Candidate | Pyro | 44.80 | 21.75 | 18.89 | 14.57 | 55.20 |
| Candidate | Arc | 60.71 | 28.30 | 4.27 | 6.72 | 39.29 |

These are measurements for lead review, not an acceptance decision. Any strict-time, rig-distance, depth-pressure or cadence misses remain visible in the structured assessment fields. Final gate and native evidence must be linked separately after completion.

Mode8 fixes and dirty-backend source identities are documented in [I5-EMULATION-V8](I5-EMULATION-V8.md). Historical mode7data remains provisional and unchanged. Final native comparisons require separate evidence after all eight campaigns finish.

## Explicit 80-run target flags

Current completion of 41/80 (51.25%) meets the pooled 40–60% band. Pyro at 35% is 16.25 percentage points below the 51.25% mean, so the strict 15-point rig-distance flag is **FAIL**. No acceptance is inferred from rounding this difference.

| Rig | Completion | Mean distance≤15pp | OD1.2–1.7 | Strict30–45s | Broad30–45s | Tx60–75s | Cap | Act damage rises | Opening |
|---|---:|---|---|---|---|---|---|---|---:|
| arc | 50.00% | PASS(-1.25pp) | PASS(1.428571) | PASS(30.45) | PASS(32.766667) | FAIL(59.675) | PASS | FAIL | 100/100 |
| breacher | 60.00% | PASS(8.75pp) | PASS(1.428571) | PASS(32.941667) | PASS(34.75) | PASS(67.05) | PASS | PASS | 100/100 |
| cryo | 60.00% | PASS(8.75pp) | PASS(1.428571) | PASS(37.008333) | PASS(38.875) | PASS(69.2) | PASS | PASS | 100/100 |
| pyro | 35.00% | FAIL(-16.25pp) | PASS(1.378571) | FAIL(28.266667) | PASS(30.091667) | FAIL(57.408333) | PASS | PASS | 100/100 |

Pooled strict ordinary time of 31.9833 s, broad non-holdout time of 34.1833 s and Transmission time of 61.975 s pass the pooled pacing scope. All four rigs meet cadence; all 998 classified ordinary attempts meet the one-use cap, with zero unknown categories or censors. All 400 first-five room attempts clear. Arc has an early 0→0 plateau, followed by increasing act 3/4 damage; the strict every-act increase flag is therefore false. Its exact vector is 0.000000→0.000000→30.149492→41.366838. Deaths remain listed in the full tables rather than collapsed into a completion percentage.

## Frozen-to-committed backend bridge

After all eight native campaigns were reaped, matching backend code was committed as`b6cac5f788451b162c61240896d3a846749e0de5`; post-capture-helper proof`e8034f1b11b03025cbbf0b5d8db8e54401990615` reproduces the exact current game 8fd2/runtime bundle 4e76/policy 976e/backend 63b80 identities. Every backend source SHA was independently checked against both commits. All src bytes remain exact to the frozen f496 native client, and all four policy files remain exact to e97cf06. The committed one-room proof reports dirtyfalse with the empty-patchSHA; original 80-run artifacts retain dirty=true/f496/ba2a. JSON records both provenance states without rewriting either.

The initial 80-run cohort remains provisional pending lead assessment of a prespecified extension and the separate corrected-v8/native comparison. No further tuning or acceptance is implied.
