> Historical mode-v7 measurements. Confirmed Node-emulation differences make these provisional for final balance acceptance; all raw/source identities remain unchanged. Corrected matched mode-v8 evidence is recorded separately in [I5-EMULATION-V8.md](I5-EMULATION-V8.md).

# I5 — policy-v3 V32 Pyro pacing trial

**Rejected: Pyro completion and rig-distance targets fail; earliest Pyro death is room7.** Both complete80-run cohorts were read only after each folder was independently verified to contain80 campaign reports and the lead confirmed both launch sessions had been reaped with exit0 (baseline56987/candidate42763). Independent process inventory was unavailable because the sandbox denied `ps` with EPERM; that limitation and the explicit termination evidence are recorded. All20seeds per rig are retained for both profiles. This document does not accept the profile. Historical v1/v2 evidence remains withdrawn and is not pooled here.

Frozen source commit **`6d1fa3e1242caaef01c8d5c7dea70b289b73b1a9`**; policy **`i5-catalog-ability-aim-v3`**, mode **`sim-policy-v7`**, shared policy SHA **`976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`**. The baseline uses historical gameplay revision `c3bd53b` with currentv3decision code; the candidate uses the frozen V32 gameplay with currentv3decision code. [Complete evidence](evidence/I5/I5-AIM-V32.json) contains all160 raw hashes, copied source hashes, paired80seed identities and per-rig/per-act/per-depth distributions.

Primary seeds: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. Supplemental seeds: **1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009**. No primary or supplement attempt is dropped.

| Profile | Game hash | Runtime bundle hash |
|---|---|---|
| baseline | `f7cb49329e57843eec613886391b9572e995572b6a5a63d0f74de8cc811c4a6c` | `49ecd17b81faefa8d6a8ff73214621c1e4c087903ef783460478604178df93f5` |
| candidate | `fbbf2634b987ebaf0c22974ab885bf713e49572f8a056ab8dbe3ee2abe06aa2b` | `7b9498fc5904dd44d71a2d8e6558273f9aea6c45b56d17c3ec898b9044a39eed` |

## Completion, charge and pacing

| Profile | Rig | Completed | Median rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Breacher | 15/20(75.00%) | 1.422619 [1.176–1.455] | 33.13 | 34.97 | 69.98 |
| Baseline | Cryo | 20/20(100.00%) | 1.333333 [1.333–1.429] | 37.17 | 38.12 | 71.37 |
| Baseline | Pyro | 13/20(65.00%) | 1.392857 [1.176–1.667] | 30.38 | 31.53 | 57.39 |
| Baseline | Arc | 18/20(90.00%) | 1.333333 [1.250–1.429] | 31.78 | 32.91 | 58.74 |
| Candidate | Breacher | 7/20(35.00%) | 1.491453 [1.176–1.750] | 31.92 | 34.27 | 67.32 |
| Candidate | Cryo | 12/20(60.00%) | 1.428571 [1.333–1.538] | 36.55 | 38.88 | 73.43 |
| Candidate | Pyro | 4/20(20.00%) | 1.500000 [1.176–1.714] | 28.92 | 31.32 | 57.93 |
| Candidate | Arc | 11/20(55.00%) | 1.428571 [1.333–1.600] | 30.03 | 32.23 | 61.56 |

**Baseline**: 66/80 completes, 14 deaths, 0 censors; pooled strict ordinary 32.83s, broad non-holdout 34.20s, Transmission 62.58s, median rooms/OD 1.333333. Cap violations 15/1257 classified ordinary attempts; unknown categories 0. First-five clears 400/400.

**Candidate**: 34/80 completes, 46 deaths, 0 censors; pooled strict ordinary 32.03s, broad non-holdout 34.21s, Transmission 64.89s, median rooms/OD 1.428571. Cap violations 0/981 classified ordinary attempts; unknown categories 0. First-five clears 400/400.

## Primary versus supplement

| Profile | Rig | Primary completions | Supplement completions | Combined completions |
|---|---|---:|---:|---:|
| Baseline | Breacher | 8/10 | 7/10 | 15/20 |
| Baseline | Cryo | 10/10 | 10/10 | 20/20 |
| Baseline | Pyro | 7/10 | 6/10 | 13/20 |
| Baseline | Arc | 8/10 | 10/10 | 18/20 |
| Candidate | Breacher | 4/10 | 3/10 | 7/20 |
| Candidate | Cryo | 5/10 | 7/10 | 12/20 |
| Candidate | Pyro | 0/10 | 4/10 | 4/20 |
| Candidate | Arc | 4/10 | 7/10 | 11/20 |

## Time and damage by act

Cells are median cleared-room seconds /median damage per attempted room; holdouts remain in act times and survivor denominators remain explicit in JSON.

| Profile | Rig | Act1 | Act2 | Act3 | Act4 |
|---|---|---:|---:|---:|---:|
| Baseline | Breacher | 27.56 / 0.00 | 39.13 / 12.58 | 38.21 / 11.28 | 44.44 / 29.38 |
| Baseline | Cryo | 30.10 / 0.00 | 43.58 / 12.53 | 38.78 / 13.68 | 49.54 / 39.71 |
| Baseline | Pyro | 23.59 / 0.00 | 34.66 / 12.58 | 33.00 / 24.73 | 42.40 / 43.19 |
| Baseline | Arc | 25.22 / 0.00 | 36.76 / 0.00 | 35.73 / 0.00 | 43.51 / 12.16 |
| Baseline | Pooled | 26.12 / 0.00 | 38.40 / 10.96 | 36.45 / 13.39 | 44.13 / 32.21 |
| Candidate | Breacher | 28.24 / 0.00 | 38.75 / 13.70 | 36.13 / 36.32 | 44.13 / 57.39 |
| Candidate | Cryo | 33.28 / 0.00 | 41.13 / 19.85 | 40.17 / 52.11 | 46.90 / 82.48 |
| Candidate | Pyro | 25.82 / 0.00 | 33.10 / 21.48 | 35.93 / 43.24 | 40.47 / 65.01 |
| Candidate | Arc | 27.36 / 0.00 | 35.06 / 11.19 | 33.47 / 25.19 | 40.30 / 38.20 |
| Candidate | Pooled | 28.45 / 0.00 | 37.20 / 13.57 | 36.36 / 38.94 | 41.87 / 61.76 |

## Pooled depth distributions

Each cell: clears/attempts; median clear seconds; median incoming damage. JSON retains full per-rig rows, p10/p90/ranges and accepted Overdrive distributions.

| Room | Baseline | Candidate |
|---|---|---|
| 1 | 80/80;18.60;0.00 | 80/80;19.18;0.00 |
| 2 | 80/80;29.77;0.00 | 80/80;30.08;10.08 |
| 3 | 80/80;29.20;0.00 | 80/80;32.66;0.00 |
| 4 | 80/80;23.98;0.00 | 80/80;26.37;10.24 |
| 5 | 80/80;30.59;0.00 | 80/80;33.93;0.00 |
| 6 | 80/80;39.75;10.41 | 80/80;38.13;18.95 |
| 7 | 80/80;31.05;0.00 | 79/80;32.72;10.74 |
| 8 | 80/80;28.29;0.00 | 79/79;27.43;13.57 |
| 9 | 80/80;39.48;13.20 | 79/79;37.73;20.75 |
| 10 | 80/80;62.58;25.48 | 78/79;64.89;22.16 |
| 11 | 80/80;36.89;13.39 | 78/78;36.23;30.58 |
| 12 | 80/80;36.84;0.00 | 78/78;35.52;26.88 |
| 13 | 80/80;36.48;13.59 | 77/78;36.83;60.22 |
| 14 | 80/80;35.07;19.39 | 75/77;35.83;44.03 |
| 15 | 79/80;36.82;13.02 | 70/75;37.83;50.39 |
| 16 | 75/79;56.37;40.51 | 60/70;49.13;57.69 |
| 17 | 74/75;36.67;26.39 | 54/60;36.28;55.38 |
| 18 | 68/74;34.62;17.39 | 48/54;32.77;53.08 |
| 19 | 68/68;40.59;26.75 | 47/48;40.30;62.99 |
| 20 | 66/68;68.63;56.30 | 34/47;57.10;79.73 |

## Death rooms and outgoing damage

| Profile | Rig | Natural death rooms |
|---|---|---|
| Baseline | Breacher | 16×1, 17×1, 18×3 |
| Baseline | Cryo | None |
| Baseline | Pyro | 15×1, 16×2, 18×2, 20×2 |
| Baseline | Arc | 16×1, 18×1 |
| Baseline | Pooled | 15×1, 16×4, 17×1, 18×6, 20×2 |
| Candidate | Breacher | 10×1, 14×1, 15×3, 16×2, 17×2, 18×3, 20×1 |
| Candidate | Cryo | 16×2, 17×1, 18×1, 19×1, 20×3 |
| Candidate | Pyro | 7×1, 13×1, 15×1, 16×6, 17×1, 18×1, 20×5 |
| Candidate | Arc | 14×1, 15×1, 17×2, 18×1, 20×4 |
| Candidate | Pooled | 7×1, 10×1, 13×1, 14×2, 15×5, 16×10, 17×6, 18×6, 19×1, 20×13 |

Damage-share percentages retain weapon/direct ability/status/boon buckets separately; the combined nonweapon share is not an isolated causal rig measure.

| Profile | Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Breacher | 59.43 | 19.87 | 4.64 | 16.06 | 40.57 |
| Baseline | Cryo | 48.55 | 20.42 | 6.23 | 24.81 | 51.45 |
| Baseline | Pyro | 46.05 | 18.76 | 17.94 | 17.25 | 53.95 |
| Baseline | Arc | 59.44 | 27.77 | 4.36 | 8.43 | 40.56 |
| Candidate | Breacher | 63.13 | 22.20 | 4.42 | 10.25 | 36.87 |
| Candidate | Cryo | 49.64 | 19.28 | 7.16 | 23.92 | 50.36 |
| Candidate | Pyro | 48.07 | 18.37 | 19.32 | 14.24 | 51.93 |
| Candidate | Arc | 60.17 | 28.22 | 4.52 | 7.09 | 39.83 |

These are measurements for lead review, not an acceptance decision. Any strict-time, rig-distance, depth-pressure or cadence misses remain visible in the structured assessment fields. Final gate and native evidence must be linked separately after completion.

## Artifact-only full-kit probes

This fresh probe copies the current A1Balance harness and preserves every assertion. Its effective catalog/runtime and original currentA1harness are byte-identical to frozen commit6d1fa3e. The existing artifact-only probe was reused only after verifying all three source hashes. They are not campaign cohorts. Effective sources, exact numeric results and logs remain in each artifact directory; the JSON archives all hashes. Weapons-only/Breacher/Cryo/Arc result objects are deep-equal to V30; Pyro36.1991747524%/87.75s and overallspread1.08433048433 pass all original guards.

| Probe | Breacher share | Clear seconds | Spread | Original guards |
|---|---:|---:|---:|---|
| full-kit-pyro-q8-f16-dash240 | 30.379791% | 93.45 | 1.084330000 | passed |

Passing unit probes do not establish campaign completion, cross-rig balance or native controls. The V32 campaign changes only PyroQ7→8s,F13→16s anddash220→240units versusV31. V30Railbreaker250ms remains; Seismic90damage/220ms, Ram150distance andBulwark16s remain. The first policy-v3 V27b paired80archive remains untouched in I5-AIM-V3.

## Explicit target checks and rejection

V32 is rejected. Pyro remains4/20completed, with strict ordinary28.9167s and Transmission57.9333s, and a natural death as early as room7. All60 non-Pyro outcome, room and final-state records are deep-equal to V30. All20seeds per rig and every outcome are retained.

| Rig | Completion | Mean distance≤15pp | OD1.2–1.7 | Strict30–45s | Broad30–45s | Tx60–75s | Ordinary cap | Act damage rises | Opening |
|---|---:|---|---|---|---|---|---|---|---:|
| arc | 55.00% | PASS(12.5pp) | PASS(1.428571) | PASS(30.033333) | PASS(32.233333) | PASS(61.558333) | PASS | PASS | 100/100 |
| breacher | 35.00% | PASS(-7.5pp) | PASS(1.491453) | PASS(31.916667) | PASS(34.275) | PASS(67.316667) | PASS | PASS | 100/100 |
| cryo | 60.00% | FAIL(17.5pp) | PASS(1.428571) | PASS(36.55) | PASS(38.875) | PASS(73.433333) | PASS | PASS | 100/100 |
| pyro | 20.00% | FAIL(-22.5pp) | PASS(1.5) | FAIL(28.916667) | PASS(31.316667) | FAIL(57.933333) | PASS | PASS | 100/100 |

## Disposition

The lead returns to the original pooled pacing interpretation and selects V30 pending exact source proof, full gates and eight native campaigns. V30 measured47.5% completion with maximum12.5percentage-point rig distance, pooled strict ordinary31.8333s and Transmission63.2333s. Its individual Pyro28.65s/57.3917s remain a known faster variation, explicitly visible in the V30 table. V31/V32 attempted a stricter every-rig pacing interpretation and reduced Pyro completion without meeting it. This archive does not establish final acceptance or waive the remaining gates/native evidence.
