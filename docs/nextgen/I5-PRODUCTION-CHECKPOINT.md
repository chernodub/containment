# I5 — production checkpoint, encounter experiment disabled

This is a reviewable production checkpoint, **not accepted final I5 balance**. The frozen `i5-production-40` cohort completes **32/40 (80%)**, with Breacher/Cryo/Pyro/Arc **90/100/40/90%**, **0 censors**. Median Overdrive cadence passes for every rig and pooled Transmission time is **66.35 s**; the **40–60% campaign target**, cross-rig target and **one Overdrive per ordinary room** constraint remain unmet. The pending policy decision and eight final native confirmations remain outstanding.

## Scope and source identity

The copied `src/game/roguelike/i5Tuning.ts` explicitly sets **`I5_ENCOUNTER_TUNING_ENABLED = false`**; all forty reports independently record `tuningEnabled:false`. Unaccepted V21 encounter code stays behind that disabled flag. The production gameplay profile uses merged revision **76e744d** encounter/progression numbers with the requested starting trial **damage / 6000 + kills × .025 → damage / 12000 + kills × .0125** (Dynamo **×1.3** preserved) and Transmission **40 at 900 ms → 32 at 750 ms**. The experimental **.015** kill coefficient is disabled too. Legacy encounter/progression numbers and champion baselines remain unchanged.

The independent [I5ProductionProfile.test.ts](../../tests/I5ProductionProfile.test.ts) pins every graph-v1/v2/v3 encounter and progression record over these ten seeds against frozen 76e744d hashes, normalizing only the requested Transmission trial; it also pins the disabled flag, charge arithmetic and original champion stats. This archive records that invariant rather than claiming a new test execution.

The campaign reports record HEAD `80e893eb471a93e5c0a5fe9f9aa288a2f779a980`, game hash `4d315ec88e368f2df38877dd7e1bd848474b28cb5ab82a07e05156bd80f4f82e`, bundle hash `bab64963dcaf8260a32ad0d5a31e999603c4da3badec15d45d226fbcd0e298d8`, and policy hash `e4e6c2e75850aa0a80052f082c748c64fa0e1ccc065cdca8f10747b5c5e2a8ff`. The **six copied gameplay files** (DepthGame, AbilitySystem, EnemySystem, progression, director and i5Tuning) were compared with **9abc6c2c75cc7ba453fd113a1ff4375541ba587a**. DepthGame, AbilitySystem and EnemySystem match byte-for-byte; progression, director and i5Tuning have comment-only edits. All six match as ordered TypeScript tokens after excluding comments/whitespace. Both raw SHA sets and normalized token hashes are retained, so comment changes are not represented as identical source bytes. The earlier report HEAD is not used to substitute current parameters: exact source hashes are retained in [the complete production archive](evidence/I5/i5-production-40.json). All thirteen copied source files, bundle bytes and forty report hashes were checked.

## Matched-policy baseline → checkpoint

Both selections use **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456** per rig, real earned campaign actions, unassisted 60 Hz simulation and the same navigation-v3 policy hash. The baseline reports explicitly load **76e744d**; their forty raw hashes and summary metrics were rechecked against [the corrected baseline archive](evidence/I5/i5-final-policy-baseline-40.json). This corrected navigation-policy baseline is used, rather than earlier navigation-censored pilots or the original browser R4 sample.

| Selection | Rig | Completed | Deviation from mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|---:|
| i5-final-policy-baseline-40 | Breacher | 10/10 (100%) | +7.5 | 0.678161 [0.588–0.714] | 35.08 | 86.63 |
| i5-final-policy-baseline-40 | Cryo | 10/10 (100%) | +7.5 | 0.701970 [0.645–0.741] | 34.93 | 93.30 |
| i5-final-policy-baseline-40 | Pyro | 7/10 (70%) | -22.5 | 0.727513 [0.606–0.824] | 31.15 | 74.67 |
| i5-final-policy-baseline-40 | Arc | 10/10 (100%) | +7.5 | 0.689655 [0.571–0.741] | 32.51 | 70.32 |
| i5-production-40 | Breacher | 9/10 (90%) | +10.0 | 1.333333 [1.176–1.429] | 35.87 | 68.03 |
| i5-production-40 | Cryo | 10/10 (100%) | +20.0 | 1.428571 [1.333–1.429] | 38.09 | 72.84 |
| i5-production-40 | Pyro | 4/10 (40%) | -40.0 | 1.428571 [1.118–1.667] | 32.10 | 58.27 |
| i5-production-40 | Arc | 9/10 (90%) | +10.0 | 1.333333 [1.176–1.429] | 34.65 | 60.24 |

Pooled completion changes **92.5% → 80.0%**; median rooms/Overdrive **0.689655 → 1.380952**, Transmission **80.475 → 66.350 s**, ordinary room time **33.65 → 35.10 s**. These are paired seed sets under the same decision code, not identical input trajectories.

## Ordinary-room Overdrive exceptions

The four median cadences **1.333333 / 1.428571 / 1.428571 / 1.333333** pass the requested **1.2–1.7** band. However, **10 ordinary, non-elite, non-holdout room attempts use two Overdrives**, so B1 is not fully met. For production, ordinary rooms exclude only authored elite rooms **6/16** and holdouts **10/20**; disabled experimental guardian rooms are not silently excluded.

| Rig | Seed / room with two uses |
|---|---|
| Breacher | 123456 / 19, 1729 / 17, 2718 / 19 |
| Cryo | None |
| Pyro | 123456 / 17, 2718 / 19, 31415 / 18 |
| Arc | 1729 / 17, 2718 / 19, 42 / 18, 9001 / 19 |

## Depth pressure and source distributions

Time/damage cells are **median cleared-room seconds / median damage per attempted room**, retaining holdouts in acts and survivor denominators in the JSONs.

| Selection | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| i5-final-policy-baseline-40 | Breacher | 27.48 / 0.00 | 40.13 / 11.00 | 37.48 / 15.62 | 45.16 / 39.47 |
| i5-final-policy-baseline-40 | Cryo | 30.33 / 0.00 | 42.92 / 11.04 | 36.92 / 13.59 | 49.52 / 14.64 |
| i5-final-policy-baseline-40 | Pyro | 24.00 / 0.00 | 35.37 / 12.58 | 34.87 / 20.09 | 42.27 / 44.06 |
| i5-final-policy-baseline-40 | Arc | 24.11 / 0.00 | 36.62 / 0.00 | 34.97 / 0.00 | 40.93 / 0.00 |
| i5-final-policy-baseline-40 | Pooled | 26.26 / 0.00 | 37.58 / 10.92 | 35.45 / 13.49 | 43.57 / 22.03 |
| i5-production-40 | Breacher | 27.44 / 0.00 | 39.27 / 16.62 | 40.09 / 13.94 | 52.49 / 46.51 |
| i5-production-40 | Cryo | 30.33 / 0.00 | 42.25 / 10.70 | 40.73 / 20.31 | 47.08 / 45.86 |
| i5-production-40 | Pyro | 23.68 / 0.00 | 36.47 / 13.15 | 34.43 / 17.15 | 45.62 / 50.73 |
| i5-production-40 | Arc | 25.18 / 0.00 | 36.94 / 10.92 | 37.31 / 11.16 | 42.38 / 26.44 |
| i5-production-40 | Pooled | 26.60 / 0.00 | 39.11 / 12.58 | 37.63 / 13.68 | 46.33 / 41.34 |

| Selection | Rig | Deaths by room |
|---|---|---|
| i5-final-policy-baseline-40 | Breacher | None |
| i5-final-policy-baseline-40 | Cryo | None |
| i5-final-policy-baseline-40 | Pyro | 15×1, 16×2 |
| i5-final-policy-baseline-40 | Arc | None |
| i5-final-policy-baseline-40 | **Pooled (3 deaths)** | **15×1, 16×2** |
| i5-production-40 | Breacher | 17×1 |
| i5-production-40 | Cryo | None |
| i5-production-40 | Pyro | 15×1, 16×1, 17×2, 18×1, 20×1 |
| i5-production-40 | Arc | 17×1 |
| i5-production-40 | **Pooled (8 deaths)** | **15×1, 16×1, 17×4, 18×1, 20×1** |

Outgoing shares are percent of pooled damage, with the preceding campaign attribution caveats.

| Selection | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| i5-final-policy-baseline-40 | Breacher | 57.46 | 21.44 | 5.58 | 15.52 | 42.54 |
| i5-final-policy-baseline-40 | Cryo | 47.25 | 20.85 | 6.70 | 25.20 | 52.75 |
| i5-final-policy-baseline-40 | Pyro | 46.31 | 17.90 | 16.77 | 19.01 | 53.69 |
| i5-final-policy-baseline-40 | Arc | 62.59 | 23.52 | 5.91 | 7.98 | 37.41 |
| i5-production-40 | Breacher | 58.38 | 19.97 | 6.21 | 15.43 | 41.62 |
| i5-production-40 | Cryo | 51.07 | 18.62 | 6.15 | 24.17 | 48.93 |
| i5-production-40 | Pyro | 49.10 | 16.13 | 17.39 | 17.39 | 50.90 |
| i5-production-40 | Arc | 59.84 | 25.93 | 5.77 | 8.46 | 40.16 |

## Remaining acceptance work

Both baseline and production clear **200/200 first-five-room attempts**. Production pooled act damage medians rise **0 → 12.58 → 13.68 → 41.34**; this does not establish monotonic increases at every individual depth, whose rows and denominators remain in the JSON. The pooled ordinary median fits 30–45 s, but completion **80%** remains too high and Pyro is **40 percentage points below the mean** while Cryo is **20 above**. Median cadence success does not erase the ten ordinary-room exceptions. Campaign source shares also cannot substitute for the isolated full-kit harness’s 30–45% assertion.

Final balance acceptance still needs the policy decision resolved, a new fixed-policy evidence loop if required, and at least **two final native campaigns per rig**. Earlier native/Node outcome disagreement remains a calibration limit; this checkpoint does not claim those eight confirmations. Graphics preparation holds, transient texture errors and CPU headroom remain assigned elsewhere. No gameplay, tooling, policy or tests were edited for this archive.
