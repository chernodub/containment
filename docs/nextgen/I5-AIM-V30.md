> Historical mode-v7 measurements. Confirmed Node-emulation differences make these provisional for final balance acceptance; all raw/source identities remain unchanged. Corrected matched mode-v8 evidence is recorded separately in [I5-EMULATION-V8.md](I5-EMULATION-V8.md).

# I5 — policy-v3 V30 minimal Breacher trial

**Provisional: not accepted. Pyro per-rig strict ordinary and Transmission pacing miss the targets.** Both complete80-run cohorts were read only after each folder was independently verified to contain80 campaign reports and the lead confirmed both launch sessions had been reaped with exit0 (baseline56987/candidate3211). Independent process inventory was unavailable because the sandbox denied `ps` with EPERM; that limitation and the explicit termination evidence are recorded. All20seeds per rig are retained for both profiles. This document does not accept the profile. Historical v1/v2 evidence remains withdrawn and is not pooled here.

Frozen source commit **`1cac390797678b9dfe8c716e39d61c730e979dfd`**; policy **`i5-catalog-ability-aim-v3`**, mode **`sim-policy-v7`**, shared policy SHA **`976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`**. The baseline uses historical gameplay revision `c3bd53b` with currentv3decision code; the candidate uses the frozen V30 gameplay with currentv3decision code. [Complete evidence](evidence/I5/I5-AIM-V30.json) contains all160 raw hashes, copied source hashes, paired80seed identities and per-rig/per-act/per-depth distributions.

Primary seeds: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. Supplemental seeds: **1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009**. No primary or supplement attempt is dropped.

| Profile | Game hash | Runtime bundle hash |
|---|---|---|
| baseline | `f7cb49329e57843eec613886391b9572e995572b6a5a63d0f74de8cc811c4a6c` | `49ecd17b81faefa8d6a8ff73214621c1e4c087903ef783460478604178df93f5` |
| candidate | `8fd2acce2caae11feea28311ade31ab0eb13c8934c1d4f56f749c22ede862957` | `5fc6fd01d6cc37512124b2735b47af42d2a716b347f78aded89d8ae3a24bfea5` |

## Completion, charge and pacing

| Profile | Rig | Completed | Median rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Breacher | 15/20(75.00%) | 1.422619 [1.176–1.455] | 33.13 | 34.97 | 69.98 |
| Baseline | Cryo | 20/20(100.00%) | 1.333333 [1.333–1.429] | 37.17 | 38.12 | 71.37 |
| Baseline | Pyro | 13/20(65.00%) | 1.392857 [1.176–1.667] | 30.38 | 31.53 | 57.39 |
| Baseline | Arc | 18/20(90.00%) | 1.333333 [1.250–1.429] | 31.78 | 32.91 | 58.74 |
| Candidate | Breacher | 7/20(35.00%) | 1.491453 [1.176–1.750] | 31.92 | 34.27 | 67.32 |
| Candidate | Cryo | 12/20(60.00%) | 1.428571 [1.333–1.538] | 36.55 | 38.88 | 73.43 |
| Candidate | Pyro | 8/20(40.00%) | 1.428571 [1.214–1.750] | 28.65 | 30.03 | 57.39 |
| Candidate | Arc | 11/20(55.00%) | 1.428571 [1.333–1.600] | 30.03 | 32.23 | 61.56 |

**Baseline**: 66/80 completes, 14 deaths, 0 censors; pooled strict ordinary 32.83s, broad non-holdout 34.20s, Transmission 62.58s, median rooms/OD 1.333333. Cap violations 15/1257 classified ordinary attempts; unknown categories 0. First-five clears 400/400.

**Candidate**: 38/80 completes, 42 deaths, 0 censors; pooled strict ordinary 31.83s, broad non-holdout 33.67s, Transmission 63.23s, median rooms/OD 1.428571. Cap violations 0/987 classified ordinary attempts; unknown categories 0. First-five clears 400/400.

## Primary versus supplement

| Profile | Rig | Primary completions | Supplement completions | Combined completions |
|---|---|---:|---:|---:|
| Baseline | Breacher | 8/10 | 7/10 | 15/20 |
| Baseline | Cryo | 10/10 | 10/10 | 20/20 |
| Baseline | Pyro | 7/10 | 6/10 | 13/20 |
| Baseline | Arc | 8/10 | 10/10 | 18/20 |
| Candidate | Breacher | 4/10 | 3/10 | 7/20 |
| Candidate | Cryo | 5/10 | 7/10 | 12/20 |
| Candidate | Pyro | 4/10 | 4/10 | 8/20 |
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
| Candidate | Pyro | 24.48 / 0.00 | 32.94 / 14.89 | 32.48 / 44.22 | 38.51 / 53.08 |
| Candidate | Arc | 27.36 / 0.00 | 35.06 / 11.19 | 33.47 / 25.19 | 40.30 / 38.20 |
| Candidate | Pooled | 28.34 / 0.00 | 37.13 / 13.57 | 35.27 / 38.76 | 41.42 / 60.21 |

## Pooled depth distributions

Each cell: clears/attempts; median clear seconds; median incoming damage. JSON retains full per-rig rows, p10/p90/ranges and accepted Overdrive distributions.

| Room | Baseline | Candidate |
|---|---|---|
| 1 | 80/80;18.60;0.00 | 80/80;18.95;0.00 |
| 2 | 80/80;29.77;0.00 | 80/80;30.65;0.00 |
| 3 | 80/80;29.20;0.00 | 80/80;32.33;0.00 |
| 4 | 80/80;23.98;0.00 | 80/80;25.89;10.24 |
| 5 | 80/80;30.59;0.00 | 80/80;32.57;0.00 |
| 6 | 80/80;39.75;10.41 | 80/80;38.65;18.95 |
| 7 | 80/80;31.05;0.00 | 80/80;32.58;10.74 |
| 8 | 80/80;28.29;0.00 | 80/80;26.49;11.31 |
| 9 | 80/80;39.48;13.20 | 80/80;37.43;20.75 |
| 10 | 80/80;62.58;25.48 | 79/80;63.23;25.48 |
| 11 | 80/80;36.89;13.39 | 79/79;34.13;31.01 |
| 12 | 80/80;36.84;0.00 | 78/79;34.67;33.69 |
| 13 | 80/80;36.48;13.59 | 78/78;36.07;59.15 |
| 14 | 80/80;35.07;19.39 | 74/78;34.73;34.93 |
| 15 | 79/80;36.82;13.02 | 68/74;37.36;52.68 |
| 16 | 75/79;56.37;40.51 | 61/68;47.77;51.28 |
| 17 | 74/75;36.67;26.39 | 56/61;35.97;48.38 |
| 18 | 68/74;34.62;17.39 | 50/56;32.25;60.22 |
| 19 | 68/68;40.59;26.75 | 49/50;39.68;59.72 |
| 20 | 66/68;68.63;56.30 | 38/49;57.50;98.79 |

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
| Candidate | Pyro | 12×1, 14×2, 15×2, 16×3, 18×1, 20×3 |
| Candidate | Arc | 14×1, 15×1, 17×2, 18×1, 20×4 |
| Candidate | Pooled | 10×1, 12×1, 14×4, 15×6, 16×7, 17×5, 18×6, 19×1, 20×11 |

Damage-share percentages retain weapon/direct ability/status/boon buckets separately; the combined nonweapon share is not an isolated causal rig measure.

| Profile | Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Breacher | 59.43 | 19.87 | 4.64 | 16.06 | 40.57 |
| Baseline | Cryo | 48.55 | 20.42 | 6.23 | 24.81 | 51.45 |
| Baseline | Pyro | 46.05 | 18.76 | 17.94 | 17.25 | 53.95 |
| Baseline | Arc | 59.44 | 27.77 | 4.36 | 8.43 | 40.56 |
| Candidate | Breacher | 63.13 | 22.20 | 4.42 | 10.25 | 36.87 |
| Candidate | Cryo | 49.64 | 19.28 | 7.16 | 23.92 | 50.36 |
| Candidate | Pyro | 45.64 | 21.70 | 18.69 | 13.97 | 54.36 |
| Candidate | Arc | 60.17 | 28.22 | 4.52 | 7.09 | 39.83 |

These are measurements for lead review, not an acceptance decision. Any strict-time, rig-distance, depth-pressure or cadence misses remain visible in the structured assessment fields. Final gate and native evidence must be linked separately after completion.

## Artifact-only full-kit probes

This fresh probe copies the current A1Balance harness and preserves every assertion. Its catalog/runtime copies are byte-identical to frozen commit1cac390; a fresh probe was run because the earlier artifact catalog contained a redundant distance branch. They are not campaign cohorts. Effective sources, exact numeric results and logs remain in each artifact directory; the JSON archives all hashes. All five result objects are deep-equal to the earlier Railbreaker250ms artifact-only probe.

| Probe | Breacher share | Clear seconds | Spread | Original guards |
|---|---:|---:|---:|---|
| full-kit-v30 | 30.379791% | 93.45 | 1.223794000 | passed |

Passing unit probes do not establish campaign completion, cross-rig balance or native controls. The V30 campaign changes only Railbreaker600→250ms cast; Seismic remains90damage/220ms cast, Ram150distance and Bulwark16s. The first policy-v3 V27b paired80archive remains untouched in I5-AIM-V3.

## Explicit target checks

The pooled measurements do not waive per-rig pacing targets. This trial remains provisional while the lead tests the legal Pyro cooldown precheck. All60 non-Breacher outcome, room and final-state records are deep-equal to the first policy-v3 V27b candidate.

| Rig | Completion | Distance from mean ≤15pp | OD1.2–1.7 | Strict ordinary30–45s | Broad nonholdout30–45s | Transmission60–75s | Cap | Act damage rises | Opening |
|---|---:|---|---|---|---|---|---|---|---:|
| arc | 55.00% | PASS(7.5pp) | PASS(1.428571) | PASS(30.033333) | PASS(32.233333) | PASS(61.558333) | PASS | PASS | 100/100 |
| breacher | 35.00% | PASS(-12.5pp) | PASS(1.491453) | PASS(31.916667) | PASS(34.275) | PASS(67.316667) | PASS | PASS | 100/100 |
| cryo | 60.00% | PASS(12.5pp) | PASS(1.428571) | PASS(36.55) | PASS(38.875) | PASS(73.433333) | PASS | PASS | 100/100 |
| pyro | 40.00% | PASS(-7.5pp) | PASS(1.428571) | FAIL(28.65) | PASS(30.033333) | FAIL(57.391667) | PASS | PASS | 100/100 |

The lead reported217focused tests andTypeScript passing at the frozenV30commit. The fresh copied-current full-kit probe passes its original30–45% and1.25spread guards; its hashes and exact measurements are archived. Final full-gate and native receipts remain pending. The next proposedV31change, PyroQ6→7s andF12→13s, has a separate passing artifact-only probe; it is not part of this frozenV30cohort.
