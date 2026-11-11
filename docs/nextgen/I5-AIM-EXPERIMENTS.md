# I5 — corrected targeted-aim policy experiments

**Policy-v1/v2 withdrawal:** all v1 simulation/native evidence and v2 partials below are historical/provisional. The prior v1 N80 selection is withdrawn after confirmed Bulwark-center and cursor-tip LOS policy defects. Fresh v3 baseline80/candidate80 cohorts are required before acceptance. Historical measurements and hashes remain unchanged.

These are complete forty-run simulation cohorts under **`i5-catalog-ability-aim-v1` / `sim-policy-v5`**, with navigation observer v3 retained. They are separate from historical navigation-only policy experiments. The corrected production baseline completes **33/40 (82.5%)**; V22 completes **23/40 (57.5%)**, but fails cross-rig and ordinary-time acceptance. Neither is final balance acceptance. V23–V26 are archived below; V26 selection was withdrawn after the existing full-unit invulnerability budget failed. No final profile is accepted.

## Selection and provenance

Each cohort uses ten unassisted attempts per rig, seeds **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. All natural deaths, censored counts, per-run final source receipts, all per-rig/per-depth distributions, strict ordinary-cap evidence and broad non-holdout timing remain in the compact archives:

- [Corrected-aim production baseline](evidence/I5/I5-AIM-BASELINE.json)
- [V22 candidate](evidence/I5/I5-AIM-V22.json)
- [V23 candidate](evidence/I5/I5-AIM-V23.json)
- [V24 candidate](evidence/I5/I5-AIM-V24.json)
- [V25 candidate](evidence/I5/I5-AIM-V25.json)
- [V26 rejected at full unit gate](evidence/I5/I5-AIM-V26.json)
- [V27 rejected unit-only probe](evidence/I5/I5-AIM-V27-UNIT.json)
- [V27b unit-valid, primary-cohort-rejected result](evidence/I5/I5-AIM-V27B.json)
- [V28 legal-guard, primary-cohort-rejected result](evidence/I5/I5-AIM-V28.json)
- [Historical/provisional v1 paired80-run evaluation](evidence/I5/I5-AIM-FINAL-80.json)

Both record HEAD **`c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`**. The actual shared **policy SHA-256 is `7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`**; the HEAD abbreviation c3bd53b is not a policy hash. Frozen policy, ability-aim, navigation and version bytes were concatenated in runner order and hashed independently. Every raw report, copied source and immutable bundle was verified.

| Cohort | Flag | Game source hash | Immutable bundle hash |
|---|---|---|---|
| i5-aim-v1-baseline-40 | false | `f7cb49329e57843eec613886391b9572e995572b6a5a63d0f74de8cc811c4a6c` | `ea1d9af17634bbf78ff852d41fd9e1bd76a63ba4a3a80634863848dfe589976d` |
| i5-aim-v1-v22-40 | true | `7e03eda2879cda81cbae2c94e406ab310a445d6f145a7a255fd2c27ee12708ef` | `5696d82818fb9f9f2bc57ee27c9f7cfaa98ff1389fe3a0267a5ac59cdb42e5f5` |

`catalog.ts` was not copied as original source in these two snapshots. Its compiled bundle section was read and hashed separately; the archive labels that SHA as compiled provenance, rather than claiming an original-source hash. No current V23 catalog values are substituted.

## Baseline → V22 changes

The baseline uses the default production encounter branch, `.0125` kill charge, 32-at-750-ms Transmission and the corrected targeted-aim player. It **does not contain the ordinary-room Overdrive cap**. V22 adds the cap alongside encounter and authorized cooldown changes; the campaign comparison therefore does not isolate encounter parameters alone.

| Parameter | Baseline → V22 |
|---|---|
| Ordinary Overdrive | Uncapped → one accepted activation per graph-v3 ordinary combat room, charge retained when blocked; excludes actual guardians and holdouts |
| Charge | `/12000 + kills×.0125`, Dynamo×1.3 unchanged in all graphs |
| Pyro Q / F cooldown | 8,000 / 14,000 → 6,000 / 12,000 ms |
| Cryo F cooldown | 15,000 → 18,000 ms |
| Breacher Q / Arc | Breacher 6,000 and Arc cooldowns unchanged |
| Act1 | Exact original first-five encounter/progression numbers |
| Mid mix | Crawler2 / Spitter2 / Stalker1 / Carrier1 |
| Late mix | Crawler3 / Brute1 / Spitter4 / Stalker2; no random Carrier |
| Late non-holdout count | Existing count → existing+2; normal mixed Warden encounters retained, no nine-request duels |
| Story cap | Ceiling18 →20 before room11 /15 later; ordinary concurrency adds 0/1/2/2 by act |
| Spawn packets | 1,100 ms →950/850/750 ms in acts2/3/4; within-packet100→90 ms |
| Ordinary elite chance | 0→.14+(depth−5)×.018 in rooms6–9; .60+(depth−10)×.01 from room11, including authored elite room16 |
| Mid elite damage | 1.20→1.05 in rooms6–10; 1.20 in later ordinary elites |
| Elite health | 1.65→1.08 from room6; basic health unchanged |
| Additional pressure | Damage×(1+.18×pressure), speed×(1+.05×pressure), after first5; Transmission excluded |
| Late ordinary / finale damage | Additional×.80 /×1.05 |
| Ordinary elite Brute charge | Initial1,500→5,000, warning850→1,150, repeat4,600→6,500 ms; Warden timing unchanged |
| Champions | Add Wardens9/13/19; health/damage factors1/1, Matron unchanged |
| Holdouts | Transmission32@750, finale48@900 unchanged |

## Completion, cadence and pacing

Strict ordinary rows exclude actual guardian metadata, authored elites, bosses and holdouts, matching the game’s cap predicate. **Non-holdout** time remains a separate broad clear-time measure, including elites/guardians. Death rooms contribute damage and cap violations but not cleared-room times. Rooms/Overdrive remains each run’s cleared-room count divided by all accepted uses, with p10–p90 alongside the median.

| Cohort | Rig | Completed | Mean deviation(points) | Rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---|---:|---:|---:|---:|---:|---:|
| i5-aim-v1-baseline-40 | Breacher | 10/10 (100%) | +17.5 | 1.333333 [1.176–1.429] | 32.31 | 34.52 | 67.35 |
| i5-aim-v1-baseline-40 | Cryo | 10/10 (100%) | +17.5 | 1.380952 [1.250–1.429] | 35.92 | 37.38 | 73.22 |
| i5-aim-v1-baseline-40 | Pyro | 5/10 (50%) | -32.5 | 1.428571 [1.111–1.545] | 29.85 | 31.85 | 57.31 |
| i5-aim-v1-baseline-40 | Arc | 8/10 (80%) | -2.5 | 1.333333 [1.176–1.545] | 30.70 | 32.26 | 57.22 |
| i5-aim-v1-v22-40 | Breacher | 6/10 (60%) | +2.5 | 1.591667 [1.333–1.667] | 28.30 | 31.02 | 69.53 |
| i5-aim-v1-v22-40 | Cryo | 7/10 (70%) | +12.5 | 1.666667 [1.429–1.667] | 29.83 | 32.32 | 81.25 |
| i5-aim-v1-v22-40 | Pyro | 2/10 (20%) | -37.5 | 1.625000 [1.455–1.778] | 25.12 | 26.30 | 56.23 |
| i5-aim-v1-v22-40 | Arc | 8/10 (80%) | +22.5 | 1.538462 [1.333–1.667] | 26.00 | 27.29 | 59.58 |

**i5-aim-v1-baseline-40**: 33 completes / 7 deaths / **0 censors**; pooled strict ordinary **32.22 s**, broad non-holdout **34.14 s**, Transmission **62.58 s**, median rooms/Overdrive **1.380952**. First-five clears **200/200**. Metadata-classified ordinary cap violations: **12**, unknown room categories **0**.

**i5-aim-v1-v22-40**: 23 completes / 17 deaths / **0 censors**; pooled strict ordinary **27.22 s**, broad non-holdout **29.55 s**, Transmission **63.72 s**, median rooms/Overdrive **1.583333**. First-five clears **200/200**. Metadata-classified ordinary cap violations: **0**, unknown room categories **0**.

## Act time and incoming damage

Cells are **median cleared-room seconds / median damage taken per attempted room**. Act times include holdouts; damage is actual health-plus-armor loss and can exceed starting resources after recovery. Later acts reflect survivors, not identical populations.

| Cohort | Rig | Act1 | Act2 | Act3 | Act4 |
|---|---|---:|---:|---:|---:|
| i5-aim-v1-baseline-40 | Breacher | 26.98 / 0.00 | 40.36 / 13.20 | 37.47 / 13.94 | 46.02 / 40.65 |
| i5-aim-v1-baseline-40 | Cryo | 27.74 / 0.00 | 43.21 / 10.96 | 39.19 / 13.59 | 47.17 / 41.85 |
| i5-aim-v1-baseline-40 | Pyro | 24.05 / 0.00 | 35.97 / 0.00 | 34.45 / 18.98 | 42.43 / 41.95 |
| i5-aim-v1-baseline-40 | Arc | 24.78 / 0.00 | 37.63 / 0.00 | 35.99 / 0.00 | 44.05 / 14.35 |
| i5-aim-v1-baseline-40 | Pooled | 25.77 / 0.00 | 38.30 / 10.49 | 36.52 / 13.49 | 44.64 / 34.07 |
| i5-aim-v1-v22-40 | Breacher | 26.98 / 0.00 | 38.02 / 20.71 | 33.99 / 44.09 | 38.60 / 52.49 |
| i5-aim-v1-v22-40 | Cryo | 28.49 / 0.00 | 40.48 / 21.50 | 32.42 / 38.60 | 41.22 / 61.35 |
| i5-aim-v1-v22-40 | Pyro | 22.54 / 0.00 | 30.98 / 14.39 | 28.72 / 37.84 | 35.44 / 75.10 |
| i5-aim-v1-v22-40 | Arc | 24.78 / 0.00 | 32.96 / 0.00 | 27.27 / 13.51 | 34.98 / 40.74 |
| i5-aim-v1-v22-40 | Pooled | 25.75 / 0.00 | 35.88 / 13.57 | 29.93 / 33.50 | 36.72 / 54.06 |

## Pooled depth distributions

Per-depth cells show **clears/attempts; median clear seconds; median incoming damage**. The JSONs additionally retain all rig-specific depth rows, p10/p90/ranges, and Overdrive-use distributions.

| Room | Corrected baseline | V22 |
|---|---|---|
| 1 | 40/40; 17.47; 0.00 | 40/40; 17.26; 0.00 |
| 2 | 40/40; 28.63; 5.04 | 40/40; 29.00; 11.09 |
| 3 | 40/40; 27.98; 0.00 | 40/40; 27.32; 0.00 |
| 4 | 40/40; 24.51; 0.00 | 40/40; 24.38; 5.12 |
| 5 | 40/40; 30.59; 0.00 | 40/40; 29.52; 0.00 |
| 6 | 40/40; 43.38; 12.49 | 40/40; 40.22; 10.53 |
| 7 | 40/40; 30.79; 0.00 | 40/40; 25.99; 10.74 |
| 8 | 40/40; 27.88; 0.00 | 40/40; 22.21; 5.94 |
| 9 | 40/40; 38.27; 13.20 | 40/40; 35.24; 28.01 |
| 10 | 40/40; 62.58; 19.94 | 39/40; 63.72; 22.16 |
| 11 | 39/40; 37.82; 11.16 | 39/39; 27.78; 22.97 |
| 12 | 39/39; 35.10; 11.24 | 39/39; 29.17; 35.49 |
| 13 | 39/39; 38.08; 13.59 | 38/39; 31.50; 46.06 |
| 14 | 39/39; 34.05; 11.40 | 38/38; 30.30; 36.59 |
| 15 | 39/39; 36.77; 23.67 | 38/38; 31.67; 27.99 |
| 16 | 38/39; 56.53; 40.51 | 35/38; 42.40; 59.78 |
| 17 | 37/38; 37.93; 26.15 | 32/35; 29.88; 28.99 |
| 18 | 34/37; 34.45; 34.78 | 29/32; 26.40; 39.09 |
| 19 | 34/34; 41.11; 12.16 | 29/29; 38.57; 43.63 |
| 20 | 33/34; 66.00; 75.28 | 23/29; 57.72; 125.57 |

## Death rooms

| Cohort | Rig | Natural death room histogram |
|---|---|---|
| i5-aim-v1-baseline-40 | Breacher | None |
| i5-aim-v1-baseline-40 | Cryo | None |
| i5-aim-v1-baseline-40 | Pyro | 11×1, 17×1, 18×2, 20×1 |
| i5-aim-v1-baseline-40 | Arc | 16×1, 18×1 |
| i5-aim-v1-baseline-40 | **Pooled** | **11×1, 16×1, 17×1, 18×3, 20×1** |
| i5-aim-v1-v22-40 | Breacher | 17×1, 18×1, 20×2 |
| i5-aim-v1-v22-40 | Cryo | 10×1, 16×1, 20×1 |
| i5-aim-v1-v22-40 | Pyro | 13×1, 16×1, 17×2, 18×2, 20×2 |
| i5-aim-v1-v22-40 | Arc | 16×1, 20×1 |
| i5-aim-v1-v22-40 | **Pooled** | **10×1, 13×1, 16×3, 17×3, 18×3, 20×6** |

## Outgoing damage shares

Values are percent of each rig’s pooled actual outgoing damage. Direct ability, status and boon buckets remain distinct; their sum is **not an isolated causal rig-share estimate** and does not replace the unchanged full-kit30–45% assertion.

| Cohort | Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---|---:|---:|---:|---:|---:|
| i5-aim-v1-baseline-40 | Breacher | 57.81 | 20.35 | 5.63 | 16.21 | 42.19 |
| i5-aim-v1-baseline-40 | Cryo | 49.50 | 20.33 | 6.36 | 23.81 | 50.50 |
| i5-aim-v1-baseline-40 | Pyro | 47.15 | 19.21 | 16.86 | 16.78 | 52.85 |
| i5-aim-v1-baseline-40 | Arc | 58.35 | 27.89 | 6.03 | 7.74 | 41.65 |
| i5-aim-v1-v22-40 | Breacher | 61.61 | 22.34 | 5.50 | 10.55 | 38.39 |
| i5-aim-v1-v22-40 | Cryo | 51.90 | 19.31 | 6.57 | 22.22 | 48.10 |
| i5-aim-v1-v22-40 | Pyro | 46.14 | 21.93 | 17.81 | 14.12 | 53.86 |
| i5-aim-v1-v22-40 | Arc | 58.17 | 30.26 | 5.67 | 5.90 | 41.83 |

## Acceptance limits

The new baseline has B/C/P/A **100/100/50/80%** completion. V22 has **60/70/20/80%**: its **57.5%** pooled result reaches the requested band, but Pyro is **37.5 points below** and Arc **22.5 above** the mean. Strict ordinary medians and the broad pacing measure remain visible instead of hiding short rooms inside elite/holdout times. The cap is enforced in V22 rather than inferred from median cadence alone.

This is a new policy epoch after the graphics integration; comparing it with older-policy outcomes cannot isolate aim correction alone. Same-seed native/analytic trajectories can diverge, and these simulation cohorts do not supply the required eight final native campaigns. V22 is rejected; V23 is assessed separately below. No game, runtime, policy, test or main report was changed for this archival step.


## V23 — completed pacing and outlier-rig trial

V23 uses the same ten seeds per rig and identical corrected-aim policy SHA **`7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`**. Its forty natural endings are preserved in [I5-AIM-V23.json](evidence/I5/I5-AIM-V23.json), with all source/report hashes and per-rig/per-depth distributions. It reaches pooled completion and rig-distance targets, but remains **unaccepted because ordinary room times are too short**. V24 is assessed separately below; its numbers are not substituted into this frozen V23 cohort.

Recorded HEAD **`c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`**, game hash **`8122332edc68281ef8d374ebe22bcb22df06d8c19ea80d6b2c636c4accbf9a66`**, immutable bundle hash **`e94af70a5fda622f9a1842722a08f26318719779e2616921b42134937761bf9f`**. The fourteen copied source files and compiled catalog section were verified independently.

| Parameter | V22 → V23 |
|---|---|
| Late non-holdout extra requests | +2 → +6; holdouts unchanged |
| Late ordinary / finale damage normalization | .80 /1.05 → .75 /1.00 |
| Pyro Flashfire | Direct damage 40→35; cast 80→0 ms; cooldown 6,000 unchanged |
| Pyro Napalm | Pulse damage 4.5→6 per 250 ms; cast 350→150 ms; cooldown 12,000 unchanged |
| Pyro Meltdown movement multiplier | 1.25→1.40 |
| Arc Q /F cooldowns | 7,000 /16,000 →8,000 /18,000 ms |
| Cryo F /Breacher Q | 18,000 /6,000 ms unchanged |
| Charge and ordinary cap | `.0125` kill contribution, divisor12,000, Dynamo×1.3; one-use cap/charge retention unchanged |
| Basic HP /legacy encounters /first-five plans | Unchanged; remaining V22 mixes, elite chance, timing, caps and champion1/1 factors retained |

| Rig | Completed | Mean deviation(points) | Rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 5/10 (50%) | +0.0 | 1.538462 [1.250–1.625] | 30.23 | 32.83 | 69.53 |
| Cryo | 5/10 (50%) | +0.0 | 1.538462 [1.333–1.750] | 31.98 | 34.85 | 81.25 |
| Pyro | 4/10 (40%) | -10.0 | 1.538462 [1.250–1.667] | 26.67 | 28.50 | 55.73 |
| Arc | 6/10 (60%) | +10.0 | 1.428571 [1.250–1.750] | 27.53 | 30.86 | 53.53 |

V23 has **20/40 (50.0%) completes, 20 deaths and 0 censors**. Pooled strict ordinary time **28.82 s**, broad non-holdout **31.66 s**, Transmission **63.52 s**, and median rooms/Overdrive **1.538462**. Strict ordinary cap violations **0** across **486** classified attempts, unknown categories **0**. First-five clears **200/200**.

### V23 act time and incoming damage

Cells retain **median cleared-room seconds /median damage per attempted room**, including holdouts in act times.

| Rig | Act1 | Act2 | Act3 | Act4 |
|---|---:|---:|---:|---:|
| Breacher | 26.98 / 0.00 | 38.02 / 20.71 | 35.71 / 58.28 | 41.21 / 58.79 |
| Cryo | 28.49 / 0.00 | 40.48 / 21.50 | 38.59 / 59.51 | 42.58 / 67.96 |
| Pyro | 22.73 / 0.00 | 31.33 / 12.97 | 31.13 / 25.41 | 36.32 / 60.66 |
| Arc | 25.00 / 0.00 | 35.80 / 5.37 | 34.18 / 13.65 | 40.68 / 38.83 |
| Pooled | 25.90 / 0.00 | 35.99 / 13.30 | 34.55 / 38.18 | 40.07 / 59.86 |

| Room | V23 clears/attempts | Median clear seconds | Median incoming damage |
|---|---:|---:|---:|
| 1 | 40/40 | 18.15 | 0.00 |
| 2 | 40/40 | 29.77 | 10.08 |
| 3 | 40/40 | 28.07 | 0.00 |
| 4 | 40/40 | 23.83 | 10.24 |
| 5 | 40/40 | 29.81 | 0.00 |
| 6 | 40/40 | 40.66 | 11.58 |
| 7 | 40/40 | 30.72 | 10.74 |
| 8 | 40/40 | 22.14 | 0.00 |
| 9 | 40/40 | 35.71 | 25.36 |
| 10 | 38/40 | 63.52 | 19.94 |
| 11 | 38/38 | 34.25 | 37.15 |
| 12 | 37/38 | 32.42 | 36.74 |
| 13 | 36/37 | 34.93 | 40.95 |
| 14 | 35/36 | 34.55 | 33.17 |
| 15 | 33/35 | 35.63 | 41.75 |
| 16 | 30/33 | 50.06 | 71.62 |
| 17 | 29/30 | 33.80 | 28.41 |
| 18 | 26/29 | 29.75 | 57.80 |
| 19 | 26/26 | 40.88 | 62.25 |
| 20 | 20/26 | 58.80 | 103.18 |

### V23 death rooms and outgoing shares

| Rig | Natural death room histogram |
|---|---|
| Breacher | 12×1, 14×1, 16×1, 17×1, 20×1 |
| Cryo | 10×1, 15×1, 18×1, 20×2 |
| Pyro | 13×1, 16×2, 18×2, 20×1 |
| Arc | 10×1, 15×1, 20×2 |
| **Pooled** | **10×2, 12×1, 13×1, 14×1, 15×2, 16×3, 17×1, 18×3, 20×6** |

Outgoing shares are percent of actual pooled damage; campaign buckets do not isolate causal rig value.

| Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 60.58 | 23.22 | 5.52 | 10.67 | 39.42 |
| Cryo | 52.15 | 19.51 | 6.75 | 21.59 | 47.85 |
| Pyro | 43.93 | 23.25 | 17.40 | 15.42 | 56.07 |
| Arc | 59.81 | 28.28 | 5.12 | 6.79 | 40.19 |

The V23 rig rates **50/50/40/60%** each lie within ten points of their 50% mean. The cadence medians and ordinary cap also pass, and all four rigs show increasing act-level incoming-damage medians. These successes do not erase the short ordinary-room medians or replace final native validation.

### Pending V24 opening-count decision

The lead authorized a pending V24 pacing trial: late non-holdout extra requests **+6→+8**, late ordinary damage **.75→.72** (final1.00 unchanged), and **+2 requests in ordinary, non-champion combat rooms at zero-based depths2–8**. That deliberately adds bodies beginning in room3 while preserving the first two introductory rooms exactly, basic health/starting-weapon TTK, elite-free opening rooms and legacy encounter numbers. It is an authorized encounter-count change, not permission to remove gameplay assertions. If selected, tests must replace the old five-room exact-plan hash with the exact first-two hash plus explicit new opening-count/threat envelopes and welcoming-act campaign evidence. No V24 outcomes or acceptance are claimed here.


## V24 — completed opening and late pacing trial

V24 uses the same ten seeds per rig and corrected-aim policy SHA **`7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`**. The forty natural endings, all rig/depth distributions and exact provenance are preserved in [I5-AIM-V24.json](evidence/I5/I5-AIM-V24.json). Its **42.5%** pooled completion and improved pooled ordinary pacing do not satisfy cross-rig acceptance: B/C/P/A finish **60/50/10/50%**. The candidate remains rejected.

Recorded HEAD **`c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`**, game hash **`0262ffd626feaf504185a5f5a39bdf9505ceb9e56c6ce4cdb0765bb001faee23`**, immutable bundle hash **`1685f42969333157e78576c068589e742600b9fd497651c9da19ad6c56d1c717`**. Every raw report, fourteen copied sources and the compiled catalog section were hashed independently. Frozen DepthGame, AbilitySystem, EnemySystem and tuning flag are byte-identical to V23; only director/progression change among the six principal gameplay snapshots. The compiled catalog differs only in Napalm description text, which now states its existing 6-damage/250-ms pulse; all other compiled catalog bytes match after excluding descriptions. Both raw compiled-section hashes remain recorded.

| Parameter | V23 → V24 |
|---|---|
| Late non-holdout extra requests | +6 → +8 |
| Opening/mid ordinary requests | Add 2 at zero-based depths2–8, only combat rooms without guardians; holdouts and authored elites excluded |
| Late ordinary damage normalization | .75 → .72; finale 1.00 unchanged |
| Introductory plans | First two rooms remain exact; old five-room exact preservation intentionally replaced by authorized room3-onward count changes |
| Preserved invariants | Basic health/starting-weapon TTK, elite-free act1, legacy encounter/progression numbers, ability stats, ordinary cap and all other V23 settings unchanged |

This count change was authorized to extend short ordinary fights without increasing basic enemy HP. Final tests must retain the first-two frozen plan comparison and explicit added-count/opening-threat pins, plus welcoming-act campaign evidence. It is not a relaxation of basic HP, CC, persistence, legacy or no-early-clear assertions.

| Rig | Completed | Mean deviation(points) | Rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 6/10 (60%) | +17.5 | 1.464286 [1.176–1.833] | 33.23 | 35.67 | 75.41 |
| Cryo | 5/10 (50%) | +7.5 | 1.406593 [1.250–1.462] | 36.90 | 38.27 | 73.40 |
| Pyro | 1/10 (10%) | -32.5 | 1.522727 [1.333–1.625] | 28.28 | 28.54 | 54.04 |
| Arc | 5/10 (50%) | +7.5 | 1.357143 [1.250–1.583] | 29.13 | 31.95 | 62.42 |

V24 has **17/40 (42.5%) completes, 23 deaths and 0 censors**. Pooled strict ordinary time **31.82 s**, broad non-holdout **33.68 s**, Transmission **66.74 s**, and median rooms/Overdrive **1.428571**. Strict ordinary cap violations **0** across **487** classified attempts, unknown categories **0**. First-five clears **200/200**, despite the authorized added counts from room3.

### V24 act time and incoming damage

Cells are **median cleared-room seconds / median damage per attempted room**, retaining holdouts and survivor denominators.

| Rig | Act1 | Act2 | Act3 | Act4 |
|---|---:|---:|---:|---:|
| Breacher | 27.90 / 0.00 | 38.97 / 13.57 | 39.40 / 47.64 | 45.67 / 75.60 |
| Cryo | 32.17 / 0.00 | 40.92 / 22.70 | 41.31 / 59.83 | 44.20 / 69.34 |
| Pyro | 24.08 / 0.00 | 31.67 / 13.10 | 31.41 / 57.64 | 42.23 / 59.39 |
| Arc | 26.30 / 0.00 | 35.10 / 11.07 | 33.37 / 31.94 | 39.68 / 49.49 |
| Pooled | 27.72 / 0.00 | 36.24 / 13.57 | 35.92 / 48.29 | 42.22 / 63.48 |

| Room | V24 clears/attempts | Median clear seconds | Median incoming damage |
|---|---:|---:|---:|
| 1 | 40/40 | 18.15 | 0.00 |
| 2 | 40/40 | 29.77 | 10.08 |
| 3 | 40/40 | 29.43 | 0.00 |
| 4 | 40/40 | 26.63 | 22.53 |
| 5 | 40/40 | 34.29 | 0.00 |
| 6 | 40/40 | 39.85 | 10.79 |
| 7 | 40/40 | 32.76 | 11.81 |
| 8 | 40/40 | 24.36 | 13.57 |
| 9 | 40/40 | 35.58 | 22.71 |
| 10 | 40/40 | 66.74 | 26.59 |
| 11 | 40/40 | 35.25 | 35.15 |
| 12 | 39/40 | 34.83 | 39.66 |
| 13 | 39/39 | 35.67 | 57.90 |
| 14 | 34/39 | 37.10 | 50.01 |
| 15 | 33/34 | 38.85 | 69.57 |
| 16 | 27/33 | 49.90 | 62.93 |
| 17 | 27/27 | 33.20 | 42.69 |
| 18 | 26/27 | 35.17 | 65.14 |
| 19 | 25/26 | 41.70 | 58.53 |
| 20 | 17/25 | 60.43 | 108.00 |

### V24 death rooms and outgoing shares

| Rig | Natural death room histogram |
|---|---|
| Breacher | 12×1, 14×1, 15×1, 16×1 |
| Cryo | 16×1, 19×1, 20×3 |
| Pyro | 14×3, 16×4, 18×1, 20×1 |
| Arc | 14×1, 20×4 |
| **Pooled** | **12×1, 14×5, 15×1, 16×6, 18×1, 19×1, 20×8** |

Outgoing shares remain percent of pooled actual damage, with the same campaign-attribution limits.

| Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 62.25 | 22.68 | 4.84 | 10.23 | 37.75 |
| Cryo | 50.28 | 19.45 | 7.50 | 22.77 | 49.72 |
| Pyro | 45.45 | 23.69 | 17.36 | 13.51 | 54.55 |
| Arc | 58.42 | 28.33 | 6.39 | 6.86 | 41.58 |

Pyro remains **32.5 points below** its 42.5% mean, while Breacher is **17.5 above**. Higher body counts also change recovery, damage/kill charge and deterministic aim trajectories; improved pooled time is not an isolated causal explanation of these rig outcomes. No V25 results are assessed here, and final test pins/native acceptance remain pending.


## V25 — completed Pyro dash-escape trial

The forty-run cohort uses the same policy and V24 encounter parameters. Its frozen evidence is [I5-AIM-V25.json](evidence/I5/I5-AIM-V25.json). V25 completes **18/40 (45%)**, with B/C/P/A **60/50/20/50%**. Pyro remains **25 points below** the mean, so this is **rejected** despite pooled completion fitting its target band.

Recorded HEAD **`c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`**, game hash **`b61c68da85227f079266cf19e293aaa2de857d6ed3eb82384120dc75ddab7cde`**, immutable bundle hash **`af99d92ef68249c13617708abd58d8afe2400db7b8c227c74aa04e34ebda7838`** and policy SHA **`7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`**. Every raw report, fourteen copied source files and compiled catalog section was independently hashed. The frozen director/progression/DepthGame/EnemySystem/flag files match V24 byte-for-byte.

| Pyro dash parameter | V24 → V25 |
|---|---|
| Distance | 150 →180 units |
| Invulnerability | 220 →320 ms |
| Charge recharge | 2,600 →2,500 ms |
| Charges /width /cast /trail | 2 /44 /0 ms /2,500 ms unchanged |
| Other rigs | Original dash distance150, immunity220 ms and recharge2,600 ms unchanged |

The runtime now reads catalog dash distance and optional immunity, falling back to the original shared immunity value when absent. This varies the existing escape parameters; movement still goes through actual collision authority. The full **stats and room arrays are deeply identical for all 30 non-Pyro attempts** versus V24, not just selected seeds. Each control comparison retains its V24 raw report SHA.

| Rig | Completed | Mean deviation(points) | Rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 6/10 (60%) | +15.0 | 1.464286 [1.176–1.833] | 33.23 | 35.67 | 75.41 |
| Cryo | 5/10 (50%) | +5.0 | 1.406593 [1.250–1.462] | 36.90 | 38.27 | 73.40 |
| Pyro | 2/10 (20%) | -25.0 | 1.428571 [1.118–1.667] | 28.03 | 28.90 | 58.58 |
| Arc | 5/10 (50%) | +5.0 | 1.357143 [1.250–1.583] | 29.13 | 31.95 | 62.42 |

V25 has **18 completes /22 deaths /0 censors**. Pooled strict ordinary time **31.95 s**, broad non-holdout **33.88 s**, Transmission **68.15 s**, median rooms/Overdrive **1.428571**. Strict cap violations **0** across **491** classified attempts; unknown categories **0**. First-five clears **200/200**.

### V25 act time and incoming damage

Cells are **median cleared-room seconds /median damage per attempted room**, with survivor denominators in the JSON.

| Rig | Act1 | Act2 | Act3 | Act4 |
|---|---:|---:|---:|---:|
| Breacher | 27.90 / 0.00 | 38.97 / 13.57 | 39.40 / 47.64 | 45.67 / 75.60 |
| Cryo | 32.17 / 0.00 | 40.92 / 22.70 | 41.31 / 59.83 | 44.20 / 69.34 |
| Pyro | 24.65 / 0.00 | 32.20 / 11.30 | 32.60 / 44.29 | 37.84 / 62.08 |
| Arc | 26.30 / 0.00 | 35.10 / 11.07 | 33.37 / 31.94 | 39.68 / 49.49 |
| Pooled | 27.50 / 0.00 | 36.45 / 13.30 | 36.01 / 45.83 | 41.70 / 64.79 |

| Room | V25 clears/attempts | Median clear seconds | Median incoming damage |
|---|---:|---:|---:|
| 1 | 40/40 | 18.15 | 0.00 |
| 2 | 40/40 | 28.93 | 10.08 |
| 3 | 40/40 | 31.28 | 0.00 |
| 4 | 40/40 | 26.55 | 21.51 |
| 5 | 40/40 | 34.36 | 0.00 |
| 6 | 40/40 | 40.42 | 11.06 |
| 7 | 40/40 | 33.13 | 12.89 |
| 8 | 40/40 | 26.02 | 13.57 |
| 9 | 40/40 | 35.58 | 21.27 |
| 10 | 39/40 | 68.15 | 21.05 |
| 11 | 39/39 | 35.28 | 36.18 |
| 12 | 38/39 | 34.93 | 33.69 |
| 13 | 38/38 | 37.03 | 44.32 |
| 14 | 35/38 | 36.55 | 51.31 |
| 15 | 34/35 | 37.08 | 61.84 |
| 16 | 30/34 | 49.89 | 64.10 |
| 17 | 30/30 | 34.09 | 40.91 |
| 18 | 29/30 | 34.77 | 67.20 |
| 19 | 28/29 | 40.94 | 74.03 |
| 20 | 18/28 | 58.99 | 102.88 |

### V25 death rooms and outgoing shares

| Rig | Natural death room histogram |
|---|---|
| Breacher | 12×1, 14×1, 15×1, 16×1 |
| Cryo | 16×1, 19×1, 20×3 |
| Pyro | 10×1, 14×1, 16×2, 18×1, 20×3 |
| Arc | 14×1, 20×4 |
| **Pooled** | **10×1, 12×1, 14×3, 15×1, 16×4, 18×1, 19×1, 20×10** |

Outgoing shares retain the actual-damage bucket definitions and their attribution limits.

| Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 62.25 | 22.68 | 4.84 | 10.23 | 37.75 |
| Cryo | 50.28 | 19.45 | 7.50 | 22.77 | 49.72 |
| Pyro | 43.57 | 23.96 | 17.91 | 14.55 | 56.43 |
| Arc | 58.42 | 28.33 | 6.39 | 6.86 | 41.58 |

The following V26 trial varied only Pyro dash immunity **320→500 ms**, retaining distance180 and recharge2,500 ms; its complete campaign and later full-unit rejection are recorded below.


## V26 — rejected at the full unit gate; prior selection withdrawn

V26 completes **20/40 (50%)**, B/C/P/A **60/50/40/50%**, under the frozen corrected-aim policy. All four rig rates lie within ten points of the mean. The lead initially selected it for final native evaluation, then **withdrew selection when the unchanged invulnerability-budget test failed**. Its campaign metrics remain valid measurements of the frozen rejected configuration, not final acceptance. [I5-AIM-V26.json](evidence/I5/I5-AIM-V26.json) retains all forty reports’ hashes, outcomes, source identities and depth distributions.

Recorded HEAD **`c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`**, game hash **`66b9cb6c60c5c40c7d16d43216d286a78a2e4dbfaceb0be6239eb8273db7edb1`**, immutable bundle hash **`437b8c4416019e47802e52ba63ec0f00eb42f312dff1cac1114f648c32157acb`**, policy SHA **`7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`**. All six copied principal gameplay files are byte-identical to V25. The compiled catalog changes only **Pyro dash invulnerability320→500 ms** and the matching description **0.32→0.5 seconds**; distance180, recharge2,500, charges2, width44 and all other ability numbers remain unchanged. The exact two catalog substitutions reproduce V26 byte-for-byte from V25’s compiled section; raw hashes remain separate.

Every one of the **30 non-Pyro stats/room arrays** is deeply identical to V25, with matched V25 raw report SHAs retained. This keeps the controlled change explicit despite a new whole-game/bundle hash. All V24/V25 encounter counts, .72 ordinary/1.00 finale damage factors, mixes, elite schedules and guardian parameters remain fixed.

| Rig | Completed | Mean deviation(points) | Rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 6/10 (60%) | +10.0 | 1.464286 [1.176–1.833] | 33.23 | 35.67 | 75.41 |
| Cryo | 5/10 (50%) | +0.0 | 1.406593 [1.250–1.462] | 36.90 | 38.27 | 73.40 |
| Pyro | 4/10 (40%) | -10.0 | 1.422619 [1.214–1.625] | 28.37 | 30.57 | 56.03 |
| Arc | 5/10 (50%) | +0.0 | 1.357143 [1.250–1.583] | 29.13 | 31.95 | 62.42 |

V26 has **20 completes /20 deaths /0 censors**. Pooled strict ordinary time **31.95 s**, broad non-holdout **33.84 s**, Transmission **67.04 s**, median rooms/Overdrive **1.422619**. Strict cap violations **0** across **499** classified attempts; unknown categories **0**. First-five clears **200/200**.

### V26 act time and incoming damage

Cells are **median cleared-room seconds / median damage per attempted room**, with full survivor denominators and percentile ranges retained in the JSON.

| Rig | Act1 | Act2 | Act3 | Act4 |
|---|---:|---:|---:|---:|
| Breacher | 27.90 / 0.00 | 38.97 / 13.57 | 39.40 / 47.64 | 45.67 / 75.60 |
| Cryo | 32.17 / 0.00 | 40.92 / 22.70 | 41.31 / 59.83 | 44.20 / 69.34 |
| Pyro | 24.42 / 0.00 | 33.10 / 11.08 | 32.94 / 41.92 | 39.10 / 51.23 |
| Arc | 26.30 / 0.00 | 35.10 / 11.07 | 33.37 / 31.94 | 39.68 / 49.49 |
| Pooled | 27.47 / 0.00 | 36.68 / 13.09 | 35.90 / 43.99 | 41.70 / 58.30 |

| Room | V26 clears/attempts | Median clear seconds | Median incoming damage |
|---|---:|---:|---:|
| 1 | 40/40 | 18.15 | 0.00 |
| 2 | 40/40 | 28.93 | 5.04 |
| 3 | 40/40 | 31.28 | 0.00 |
| 4 | 40/40 | 26.34 | 21.51 |
| 5 | 40/40 | 34.36 | 0.00 |
| 6 | 40/40 | 40.42 | 10.53 |
| 7 | 40/40 | 33.13 | 12.89 |
| 8 | 40/40 | 26.02 | 13.57 |
| 9 | 40/40 | 35.58 | 20.75 |
| 10 | 40/40 | 67.04 | 19.94 |
| 11 | 40/40 | 35.25 | 34.80 |
| 12 | 39/40 | 34.83 | 34.39 |
| 13 | 39/39 | 36.22 | 41.46 |
| 14 | 36/39 | 37.04 | 50.22 |
| 15 | 35/36 | 36.77 | 61.84 |
| 16 | 32/35 | 50.09 | 59.63 |
| 17 | 32/32 | 33.23 | 40.32 |
| 18 | 29/32 | 34.77 | 67.12 |
| 19 | 28/29 | 41.28 | 50.06 |
| 20 | 20/28 | 58.99 | 106.62 |

### V26 death rooms and outgoing shares

| Rig | Natural death room histogram |
|---|---|
| Breacher | 12×1, 14×1, 15×1, 16×1 |
| Cryo | 16×1, 19×1, 20×3 |
| Pyro | 14×1, 16×1, 18×3, 20×1 |
| Arc | 14×1, 20×4 |
| **Pooled** | **12×1, 14×3, 15×1, 16×3, 18×3, 19×1, 20×8** |

Outgoing shares remain actual pooled-damage percentages, without treating status/boon damage as an isolated causal rig estimate.

| Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 62.25 | 22.68 | 4.84 | 10.23 | 37.75 |
| Cryo | 50.28 | 19.45 | 7.50 | 22.77 | 49.72 |
| Pyro | 43.50 | 23.42 | 17.92 | 15.16 | 56.50 |
| Arc | 58.42 | 28.33 | 6.39 | 6.86 | 41.58 |

Every rig’s act-level incoming-damage median rises with depth. Strict ordinary and broad non-holdout metrics remain separate; any sub30-second individual medians stay in the table and acceptance booleans rather than being relabeled as passes. The preserved campaign rows do not replace the unchanged isolated full-kit30–45% share/1.25× spread checks or the eight pending final browser campaigns.


## Deterministic test assertion migration for the shared V24–V26 encounters

Only `tests/I5Balance.test.ts` and `tests/I5ProductionProfile.test.ts` were edited. Both run the actual active profile; the old forced-true mock is removed. The numeric reference came from a read-only physical probe of the **immutable V25 bundle**, not current V26 runtime output. V25/V26 director and progression files are identical, and the source-derived probe values/hashes are retained in `I5-AIM-V26.json`. **31/31 focused tests passed with one worker** before final native acceptance; no full gates are claimed by this subsection.

### Rewritten or expanded assertions

| Assertion | Old → current pin / reason |
|---|---|
| Profile activation | `false` →`true`, matching the lead’s enabled story profile; actual imports replace the mock |
| Experimental charge receipt | `.08` /`.104` with Dynamo →`.075` /`.0975`; global `.0125` restored, now checked for graphs1/2/3 |
| Legacy full-plan/progression digests | All four graph-v1/v2 digests unchanged; experimental timing/champion fields remain forbidden in legacy balances |
| Story full-plan digest | `d5b5809a…` →`361a22737451637dc770c1992e1603c52893f0fadca9789258a3a30c88ce11ce`; authorized added counts/mixes/tempo/guardians |
| Story full-progression digest | `37f6661b…` →`99d09e9484dd593c34320ded447f0b4ee8d6503368c8c838c432d6a38b56acf0`; new story parameters and explicit guardian kind included |
| Timing-field scope | Absent in every old production room →absent before story depth10 and exact1150/6500/5000 ms plus champion1/1 thereafter; legacy remains absent |
| Exact intro plans | Add frozen first-two SHA `3a427085626c84494dddbe30f1a85dbc30ed2363e6ae61955d5e6c869aa9c5d2` |
| Five-room original preservation | Original SHA `94180310…` retained after removing **only** the authorized two-request suffixes from rooms3–5; all original request prefixes and other plan fields still match |
| Opening count/elite pins | New exact counts **12/13/15/16/17**, with every opening request non-elite; all five original progression records unchanged |
| Starting shotgun/rifle TTK | Original every-room **≤1.15×** baseline assertion retained; add actual per-act min/max envelopes **±1ms** below; every room’s basic HP and ten-seed equality remain protected |
| Strict ordinary budget scope | Exclude actual guardians as well as authored elites/holdouts, exactly matching gameplay’s room cap; add separate broad non-holdout schedule tails |
| Late Crawler/Spitter mix | Crawler range `.34–.44` →`.28–.36`; Spitter `.31–.39` →`.36–.45`, reflecting normal mixed waves replacing crawler-only duels; Stalker `.13–.20` and Brute `.05–.15` unchanged |
| Warden-room wave | Room indices12/18:9 requests(one Warden+8Crawlers) →exact28/33 requests with Warden first and real mixed ranged/flanking follow-ups |
| Final holdout relative count | Obsolete `48 > priorRoom×1.8` →exact previous-room33 and request ratio **1.40–1.50**(actual48/33), because the previous nine-body duel is removed; final48/900ms/42,950ms tail unchanged |
| Guardian roster | Old production `[5,15]` →active `[5,8,12,15,18]` zero-based; all still require the correct first elite champion |
| Late Warden health/contact | Room index12 **1140/30.8 →760/28**; index18 **1368/35 →760/28**, matching removed unaccepted champion scaling |
| Real guardian entry coverage | Original production indices5/15 retained and expanded to8/12/18; type, champion identity, elite presentation, armor/radius/speed, HP/contact and control resistance stay asserted |

Renamed test descriptions follow those changed meanings: mocked experimental charge →global approved charge; exact five-room plans →exact intro/original prefix plus authorized bodies; disabled duels →mixed Warden waves; default-off production →active story profile; full merged graph coverage →unchanged legacy digests plus independently frozen active-story digests; original two-guardian roster →active five-guardian roster. No skip, test deletion or gameplay assertion removal was used.

### Every changed per-act numeric budget envelope

Ranges below replace the obsolete disabled-V21 pins. Physical HP+armor/contact/weighted envelopes retain approximately5% tolerance around the independent frozen probe; counts and late reservation totals are exact. Unchanged cap, speed and other preserved ranges are not re-listed. This is a deterministic physical budget, not a campaign win-rate proof.

| Act | Metric | Previous range | Current range |
|---|---|---:|---:|
| 1 | Scheduled parent count | 65–69 | 73–73 |
| 1 | Weighted threat | 105–130 | 120–133 |
| 1 | Strict ordinary last request(ms) | 2500–3100 | 2850–3000 |
| 1 | Physical parent HP+armor | 9900–11600 | 11000–12200 |
| 1 | Potential contact DPS | 1175–1425 | 1330–1480 |
| 1 | Parents+child reservations | 70–82 | 80–86 |
| 1 | Broad non-holdout last request(ms) | New measure | 2850–3000 |
| 2 | Scheduled parent count | 100–108 | 108–108 |
| 2 | Weighted threat | 225–275 | 246–272 |
| 2 | Strict ordinary elite share | 0.15–0.22 | 0.115–0.165 |
| 2 | Spitter+Stalker share | 0.44–0.54 | 0.44–0.52 |
| 2 | Strict ordinary last request(ms) | 2500–3400 | 3150–3350 |
| 2 | Physical parent HP+armor | 16000–18800 | 16950–18750 |
| 2 | Potential contact DPS | 1700–2075 | 1850–2050 |
| 2 | Parents+child reservations | 140–165 | 153–164 |
| 2 | Broad non-holdout last request(ms) | New measure | 3200–3400 |
| 3 | Scheduled parent count | 96–102 | 142–142 |
| 3 | Weighted threat | 156–173 | 279–309 |
| 3 | All scheduled elite share | 0.6–0.68 | 0.6–0.67 |
| 3 | Strict ordinary elite share | 0.6–0.68 | 0.6–0.66 |
| 3 | Spitter+Stalker share | 0.47–0.54 | 0.55–0.61 |
| 3 | Strict ordinary last request(ms) | 2950–3350 | 4200–4550 |
| 3 | Damage/base ratio | 0.65–0.665 | 0.78–0.8 |
| 3 | Physical parent HP+armor | 18450–20450 | 26150–28950 |
| 3 | Potential contact DPS | 1370–1520 | 2275–2520 |
| 3 | Parents+child reservations | 99–99 | 142–142 |
| 3 | Broad non-holdout last request(ms) | New measure | 4200–4550 |
| 4 | Scheduled parent count | 134–142 | 180–180 |
| 4 | Weighted threat | 312–346 | 467–518 |
| 4 | All scheduled elite share | 0.64–0.72 | 0.65–0.72 |
| 4 | Strict ordinary elite share | 0.65–0.74 | 0.67–0.73 |
| 4 | Spitter+Stalker share | 0.52–0.6 | 0.56–0.62 |
| 4 | Strict ordinary last request(ms) | 2750–3250 | 4250–4650 |
| 4 | Damage/base ratio | 0.756–0.773 | 0.887–0.91 |
| 4 | Physical parent HP+armor | 28050–31050 | 37150–41150 |
| 4 | Potential contact DPS | 2425–2685 | 3515–3890 |
| 4 | Parents+child reservations | 141–141 | 183–183 |
| 4 | Broad non-holdout last request(ms) | New measure | 4400–4750 |

### Added physical starting-weapon TTK reference

The existing 15% baseline limit and exact basic-HP checks remain. New per-act minimum/maximum observations below are independently measured milliseconds, each protected with **±1ms** tolerance; these values do not describe enemy contact damage or player ability cooldowns.

| Weapon | Act1 min–max | Act2 min–max | Act3 min–max | Act4 min–max |
|---|---:|---:|---:|---:|
| shotgun | 94.813–94.813 | 94.813–95.397 | 95.397–95.397 | 96.619–96.619 |
| rifle | 444.901–444.901 | 444.901–561.430 | 561.430–678.561 | 678.561–678.561 |

Scheduled elite-vs-ordinary freeze behavior, actual CC resistance, the 48-request density ramp and queued-pressure/no-early-clear assertions, all historical checkpoint loading/resource/charge preservation and playable-next-room assertions remain intact. The original full-kit share30–45% /clear-time spread≤1.25× tests were not edited. Source activation and deterministic pins do not declare campaign/native acceptance.


## Full-unit rejection of V26 and unit-only V27

**V26 is rejected and its selected status is withdrawn.** The existing `A1TimingGeometryReview` dash budget requires augmented invulnerability uptime **>24% /≤35%**, and native uptime strictly **>16% /<19%**. The V26 full gate measured **60% augmented Pyro uptime**, so it failed the35% maximum. The native assertions were not reached after that throw; no native uptime measurement is invented. These bounds are unchanged and must not be weakened to accept the trial. The prior31/31 encounter-test result and passing isolated full-kit share/spread probe did not establish a passing full unit suite.

The frozen V25/V26 campaign rows and raw hashes remain intact, including their320/500ms immunity values. V25 was already rejected for rig spread; the lead additionally reports that its320ms native configuration would fail the same existing native-uptime budget. That latter V25 statement is recorded as a lead-reported budget limitation, without claiming a frozen executed V25 timing receipt.

### Preserved failed gate receipts

The complete failed-log text and SHA-256 receipts are embedded in `I5-AIM-V26.json`, including the original failures rather than later fixed expectations. The full-unit summary is **3 files failed /234 passed /1 skipped;4 tests failed /2815 passed /1 skipped**.

| Gate | Original failure | Disposition |
|---|---|---|
| Dash timing budget | Pyro augmented `.60 > .35` | Reject V26; retain all augmented/native bounds |
| Napalm first-pulse boundary | Old600ms pin vs new150ms cast+250ms tick=400ms; remaining5550 vs5750 | Lead owns exact numeric pin update; retain partition/timing assertion |
| Napalm Triplet edge fixture | Expected4.5, observed6 damage | Lead owns approved damage-number update; preserve exact impact/radius/outside-edge assertions |
| StoryRoute bounded count | Expected≤31, observed36 | Lead owns authorized count pin31→36; retain bounded encounter check |
| Initial desktop smoke | Eight GLTF texture-blob console errors | Preserve zero-error failure; graphics issue remains separately owned |
| Desktop smoke retry | `false !== true` at combat-rig pause/typing ability readiness | Lead will stage a valid holdout exception after checking ordinary cap behavior; key/pause/typing assertions must remain |

The full-unit log SHA is `d8007dc8441b1bb62d49f37c7809e461f484b556b6edbf5624bfa08ba340f3af`; initial smoke `f73745d8c1d883b0e132a57d342d5acb2f602b3965d258cff2c676193c08447b`; retry `29f81cc44b180d77f504adaf63d13735c17f3915811614446b0830a4291a874a`. No failing gate is reported as a pass, and this archival update does not rerun or modify any gate.

### V27: unit-only configuration rejected before campaigns

The reverted configuration restores **220ms immunity /2,600ms recharge for every rig**, removes optional `invulnerableMs`, and varies only Pyro dash travel to220 units. The V27 damage probe uses **Flashfire30 /Napalm7**. The unchanged full-kit harness records Pyro **47.1%** ability share (exact0.471099305, maximum45%), with fastest **72150ms** and slowest **95150ms**; clear-time spread **1.318780×**, exceeding **1.25×**. Both soft assertions fail in the same test: **1 test failed /225 passed across5 files**.

[I5-AIM-V27-UNIT.json](evidence/I5/I5-AIM-V27-UNIT.json) preserves all five full-kit metric rows, exact failed assertions/log text and log SHA `70fd7c63c0710210ff24cef50c57d4f0b0dd2ed94341ce4235458f7ab6854bf2`. It explicitly records **zero campaign attempts**: no40-run completion cohort was started for this rejected unit configuration. The parameter description comes from the lead; no absent immutable source/game hash is fabricated.

V27b’s stated unit-only proposal is **Flashfire25 /Napalm6.5**, with the reverted immunity/recharge and220-unit Pyro travel. Its completed unit/cohort results are archived separately below. The shared V24 encounter parameters remain unchanged, so the two encounter suites’ independent numeric pins stay applicable; that does not certify the separate rig timing/damage budgets or final acceptance.


## V27b — unit-valid configuration, rejected campaign rig spread

V27b completes **19/40 (47.5%)**, with B/C/P/A **60/50/30/50%**. The unchanged full-kit and dash-uptime guards pass, but Pyro is **17.5 points below** the 47.5% mean, outside the strict 15-point allowance. The candidate remains **rejected**, and [I5-AIM-V27B.json](evidence/I5/I5-AIM-V27B.json) retains the complete cohort plus the unit-probe evidence.

Recorded HEAD **`7dd620a8242edf73584725bf11d175bdbd101fc9`**, game hash **`97a2ce2a621c058cd7f7fb7cf3f701d1cb6027b19c071a1b48f336c625bf4a83`**, immutable bundle hash **`de287bcc1bc0eb40ea421ebb2ab8476646dd5c0e2b380a143e76f92394c1ee30`**, policy SHA **`7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`**. All forty report hashes, fourteen copied source files, bundle and compiled catalog section were verified. The V24 encounter/progression parameters remain unchanged. All 30 non-Pyro stats/room arrays are deeply identical to V26, with paired prior report SHAs retained.

| Parameter | V26 → V27b |
|---|---|
| Universal immunity | Restore 220ms for all rigs |
| Recharge | Restore 2,600ms for all rigs |
| Pyro travel | 180→220 units; other rigs150 unchanged |
| Optional immunity API | Remove `invulnerableMs`; runtime uses original universal immunity constant |
| Pyro Flashfire | 35→25 damage; instant cast,6,000ms cooldown retained |
| Pyro Napalm | 6→6.5 damage/250ms;150ms cast,12,000ms cooldown retained |
| Other settings | Existing V24 encounters, ordinary cap, .0125 charge, Pyro Meltdown1.4× speed and other rig cooldowns unchanged |

### Matching unit probe and preserved gate receipts

The full-kit probe’s `entry.ts`, immutable `probe.mjs` and exact `results.json` are each identified by SHA-256 in the archive. Its compiled catalog differs from the campaign only by an unused `RIG_IDS` variable binding retained by the probe; removing that binding makes all remaining catalog bytes identical. Both raw section hashes remain separate. This checks the catalog configuration without pretending that different bundles or policies are byte-identical. The original30–45% share and≤1.25× clear-spread assertions remain unchanged.

| Rig | Full-kit ability share | Clear time(seconds) |
|---|---:|---:|
| Breacher | 32.064054% | 91.50 |
| Cryo | 30.458050% | 95.15 |
| Pyro | 43.868387% | 77.75 |
| Arc | 31.765811% | 90.80 |

The exact clear-time spread is **1.223794212×** (95.15/77.75), inside1.25×. The focused guard receipt reports **5 files /226 tests passed**, including the unchanged augmented>24%/≤35% and native>16%/<19% invulnerability bounds. It does not print per-rig uptime fractions, so none are invented. The archive also preserves the smoke-fixture log’s **GLTF texture-blob zero-error failure**; passing focused simulation guards is not reported as a passing browser smoke or full release gate. The lead owns the approved400ms Napalm boundary/6.5-damage numeric pins and cap-aware nonvacuous keyboard fixture; no assertion is weakened here.

### Campaign distributions

| Rig | Completed | Mean deviation(points) | Rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 6/10 (60%) | +12.5 | 1.464286 [1.176–1.833] | 33.23 | 35.67 | 75.41 |
| Cryo | 5/10 (50%) | +2.5 | 1.406593 [1.250–1.462] | 36.90 | 38.27 | 73.40 |
| Pyro | 3/10 (30%) | -17.5 | 1.464286 [1.176–1.667] | 28.65 | 30.32 | 59.14 |
| Arc | 5/10 (50%) | +2.5 | 1.357143 [1.250–1.583] | 29.13 | 31.95 | 62.42 |

V27b has **19 completes /21 deaths /0 censors**. Pooled strict ordinary time **31.97s**, broad non-holdout **33.72s**, Transmission **66.74s**, median rooms/Overdrive **1.428571**. Strict cap violations **0** across **495** classified attempts; unknown categories **0**. First-five clears **200/200**.

| Rig | Act1 time/damage | Act2 time/damage | Act3 time/damage | Act4 time/damage |
|---|---:|---:|---:|---:|
| Breacher | 27.90 / 0.00 | 38.97 / 13.57 | 39.40 / 47.64 | 45.67 / 75.60 |
| Cryo | 32.17 / 0.00 | 40.92 / 22.70 | 41.31 / 59.83 | 44.20 / 69.34 |
| Pyro | 25.51 / 0.00 | 32.62 / 13.43 | 32.48 / 40.02 | 38.10 / 57.42 |
| Arc | 26.30 / 0.00 | 35.10 / 11.07 | 33.37 / 31.94 | 39.68 / 49.49 |
| Pooled | 27.72 / 0.00 | 36.60 / 13.57 | 35.87 / 43.34 | 41.63 / 62.93 |

| Room | Clears/attempts | Median clear seconds | Median incoming damage |
|---|---:|---:|---:|
| 1 | 40/40 | 18.15 | 0.00 |
| 2 | 40/40 | 29.66 | 10.08 |
| 3 | 40/40 | 31.61 | 0.00 |
| 4 | 40/40 | 26.13 | 16.39 |
| 5 | 40/40 | 33.98 | 0.00 |
| 6 | 40/40 | 40.77 | 11.85 |
| 7 | 40/40 | 33.13 | 12.89 |
| 8 | 40/40 | 25.23 | 13.57 |
| 9 | 40/40 | 36.28 | 23.63 |
| 10 | 40/40 | 66.74 | 24.37 |
| 11 | 40/40 | 35.25 | 29.29 |
| 12 | 39/40 | 34.83 | 31.94 |
| 13 | 39/39 | 35.92 | 47.18 |
| 14 | 37/39 | 36.95 | 50.22 |
| 15 | 35/37 | 35.88 | 66.80 |
| 16 | 30/35 | 49.64 | 62.93 |
| 17 | 29/30 | 31.67 | 35.97 |
| 18 | 29/29 | 33.90 | 75.60 |
| 19 | 27/29 | 41.42 | 57.67 |
| 20 | 19/27 | 58.97 | 100.52 |

| Rig | Natural death room histogram |
|---|---|
| Breacher | 12×1, 14×1, 15×1, 16×1 |
| Cryo | 16×1, 19×1, 20×3 |
| Pyro | 15×1, 16×3, 17×1, 19×1, 20×1 |
| Arc | 14×1, 20×4 |
| **Pooled** | **12×1, 14×2, 15×2, 16×5, 17×1, 19×2, 20×8** |

Outgoing shares remain actual-damage percentages, with the preceding campaign attribution limits.

| Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 62.25 | 22.68 | 4.84 | 10.23 | 37.75 |
| Cryo | 50.28 | 19.45 | 7.50 | 22.77 | 49.72 |
| Pyro | 44.26 | 22.82 | 18.18 | 14.75 | 55.74 |
| Arc | 58.42 | 28.33 | 6.39 | 6.86 | 41.58 |

V28’s stated trial changes only Pyro recharge **2,600→2,500ms**, leaving universal immunity220ms and other rigs’2,600ms recharge intact. V28 is assessed separately below. Shared encounter pins remain unchanged; no final native acceptance is claimed.


## V28 — legal dash timing, rejected primary campaign spread

V28 completes **18/40 (45%)**, B/C/P/A **60/50/20/50%**. The **117 focused guard checks pass**, unlike the invulnerability-invalid V26 trial, but Pyro is **25 points below** its 45% cohort mean. This primary result is **rejected for rig spread**. [I5-AIM-V28.json](evidence/I5/I5-AIM-V28.json) preserves all forty raw report hashes, frozen source/bundle identities, distributions and the original guard receipt.

Recorded HEAD **`7dd620a8242edf73584725bf11d175bdbd101fc9`**, game hash **`1c4d1e77b1a37441f78b7f323d3bd5c722b58229eeb8cda5ff1269650d225473`**, immutable bundle hash **`83b040b2cacb7a06149696d02eef585e2abd4fbafe2334ff8d998a848e1b1d92`**, policy SHA **`7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`**. All six principal source snapshots match V27b byte-for-byte; the compiled catalog changes only Pyro recharge **2,600→2,500ms** and its displayed recharge. Pyro travel220, immunity220ms, damage25/6.5 and other rigs’2,600ms recharge remain unchanged. Optional `invulnerableMs` stays removed.

All 30 non-Pyro stats/room arrays are deeply identical to V27b, with paired prior raw-report hashes retained. The existing share30–45%, spread≤1.25× and invulnerability bounds are preserved; the focused log reports **3 files /117 tests passed**. No unprinted uptime measurements or final browser pass is inferred from those aggregate lines.

| Rig | Completed | Mean deviation(points) | Rooms/OD [p10–p90] | Strict ordinary seconds | Broad non-holdout seconds | Transmission seconds |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 6/10 (60%) | +15.0 | 1.464286 [1.176–1.833] | 33.23 | 35.67 | 75.41 |
| Cryo | 5/10 (50%) | +5.0 | 1.406593 [1.250–1.462] | 36.90 | 38.27 | 73.40 |
| Pyro | 2/10 (20%) | -25.0 | 1.428571 [1.188–1.667] | 28.12 | 30.47 | 61.29 |
| Arc | 5/10 (50%) | +5.0 | 1.357143 [1.250–1.583] | 29.13 | 31.95 | 62.42 |

V28 has **18 completes /22 deaths /0 censors**. Pooled strict ordinary time **32.03s**, broad non-holdout **34.01s**, Transmission **67.66s**, median rooms/Overdrive **1.428571**. Strict cap violations **0** across **493** classified attempts; unknown categories **0**. First-five clears **200/200**.

| Rig | Act1 time/damage | Act2 time/damage | Act3 time/damage | Act4 time/damage |
|---|---:|---:|---:|---:|
| Breacher | 27.90 / 0.00 | 38.97 / 13.57 | 39.40 / 47.64 | 45.67 / 75.60 |
| Cryo | 32.17 / 0.00 | 40.92 / 22.70 | 41.31 / 59.83 | 44.20 / 69.34 |
| Pyro | 23.70 / 0.00 | 32.09 / 19.62 | 34.56 / 46.21 | 37.13 / 63.71 |
| Arc | 26.30 / 0.00 | 35.10 / 11.07 | 33.37 / 31.94 | 39.68 / 49.49 |
| Pooled | 27.72 / 0.00 | 37.14 / 13.57 | 36.22 / 46.21 | 42.07 / 64.79 |

| Room | Clears/attempts | Median clear seconds | Median incoming damage |
|---|---:|---:|---:|
| 1 | 40/40 | 18.15 | 0.00 |
| 2 | 40/40 | 29.19 | 10.08 |
| 3 | 40/40 | 31.61 | 0.00 |
| 4 | 40/40 | 25.98 | 16.39 |
| 5 | 40/40 | 33.98 | 0.00 |
| 6 | 40/40 | 40.70 | 12.64 |
| 7 | 40/40 | 32.80 | 12.89 |
| 8 | 40/40 | 25.91 | 13.57 |
| 9 | 40/40 | 35.91 | 20.75 |
| 10 | 40/40 | 67.66 | 24.37 |
| 11 | 39/40 | 35.28 | 29.46 |
| 12 | 38/39 | 35.18 | 36.85 |
| 13 | 38/38 | 37.06 | 41.46 |
| 14 | 36/38 | 36.79 | 49.67 |
| 15 | 34/36 | 37.67 | 64.32 |
| 16 | 31/34 | 49.38 | 65.26 |
| 17 | 29/31 | 33.20 | 40.32 |
| 18 | 29/29 | 33.90 | 75.60 |
| 19 | 28/29 | 40.88 | 57.67 |
| 20 | 18/28 | 58.99 | 106.62 |

| Rig | Natural death room histogram |
|---|---|
| Breacher | 12×1, 14×1, 15×1, 16×1 |
| Cryo | 16×1, 19×1, 20×3 |
| Pyro | 11×1, 15×1, 16×1, 17×2, 20×3 |
| Arc | 14×1, 20×4 |
| **Pooled** | **11×1, 12×1, 14×2, 15×2, 16×3, 17×2, 19×1, 20×10** |

Outgoing shares remain percentages of actual pooled damage, with earlier attribution caveats.

| Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 62.25 | 22.68 | 4.84 | 10.23 | 37.75 |
| Cryo | 50.28 | 19.45 | 7.50 | 22.77 | 49.72 |
| Pyro | 45.40 | 22.75 | 18.00 | 13.85 | 54.60 |
| Arc | 58.42 | 28.33 | 6.39 | 6.86 | 41.58 |

### Pending predeclared20-seed evaluation

The lead restored only Pyro recharge to **2,600ms**, returning to the unit-valid V27b configuration. Its **primary** cohort remains rejected:19/40 overall and Pyro 17.5 points below that mean. That result is kept separate from an additional predeclared evaluation; it is not relabeled accepted while waiting.

The additional seeds **1000–1009 for every rig** were declared for **both** the corrected-aim baseline and V27b **before reading their outcomes**. The pending labels are `i5-aim-v1-baseline-supp-40` and `i5-aim-v1-v27b-supp-40`. Final comparisons will retain **all 20 seeds per rig /80 attempts per profile**, including every primary and supplemental death or completion. There is no selective dropping or replacement of earlier seeds.

The lead verified the V27b primary/supplement immutable bundle SHA as **`de287bcc1bc0eb40ea421ebb2ab8476646dd5c0e2b380a143e76f92394c1ee30`**; this archive records that as a lead-provided identity until the completed supplement is independently checked. At that interim update no partial supplement outcomes were read; the completed, independently checked evaluation is appended below. Eight final native campaigns remain pending; current functional smoke work is not substituted for those campaign confirmations.


## Historical v1 paired80-run evaluation — selection withdrawn

Both predeclared supplemental cohorts are complete. [I5-AIM-FINAL-80.json](evidence/I5/I5-AIM-FINAL-80.json) retains **all80 corrected-baseline attempts and all80 V27b attempts**, twenty identical seeds per rig in each profile. Independent recomputation from the160 raw campaigns gives baseline **68/80(85%)** and candidate **43/80(53.75%)**. The candidate was previously selected; that final-acceptance selection is now withdrawn because the policy audit found confirmed action/LOS defects. These source-frozen measurements remain historical/provisional.

### No selective seed replacement

The primary ten seeds are retained exactly: **1729,2718,31415,42,137,8675309,2026,9001,65537,123456**. The supplemental **1000–1009** were declared for **both profiles before their outcomes were read**. Every primary completion/death and every supplement completion/death remains in the denominator. V27b’s **primary** rejection(17.5-pointPyro gap) remains unchanged in its original archive; the combined20-seed-per-rig evaluation is a separate result.

| Rig | Baseline primary | Baseline supplement | Baseline combined | V27b primary | V27b supplement | V27b combined | Candidate deviation(points) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Breacher | 10/10(100%) | 9/10(90%) | 19/20(95%) | 6/10(60%) | 3/10(30%) | 9/20(45%) | -8.75 |
| Cryo | 10/10(100%) | 10/10(100%) | 20/20(100%) | 5/10(50%) | 8/10(80%) | 13/20(65%) | +11.25 |
| Pyro | 5/10(50%) | 6/10(60%) | 11/20(55%) | 3/10(30%) | 6/10(60%) | 9/20(45%) | -8.75 |
| Arc | 8/10(80%) | 10/10(100%) | 18/20(90%) | 5/10(50%) | 7/10(70%) | 12/20(60%) | +6.25 |

### Independently checked source identity

Before combining, primary/supplement bundle **bytes** were compared directly and found identical within each profile, and every run’s game/policy/bundle hash matched. The six principal gameplay sources and four shared policy source files also match byte-for-byte within each pair; both complete copied-source hash sets remain in the archive. Historical HEAD labels may differ while those source/runtime identities match. The summary API accepted each explicitly unified source cohort and independently reproduced the lead’s generated80-run summaries.

| Profile | Game source hash | Runtime bundle SHA256 | Policy SHA256 |
|---|---|---|---|
| baseline | `f7cb49329e57843eec613886391b9572e995572b6a5a63d0f74de8cc811c4a6c` | `ea1d9af17634bbf78ff852d41fd9e1bd76a63ba4a3a80634863848dfe589976d` | `7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166` |
| candidate | `97a2ce2a621c058cd7f7fb7cf3f701d1cb6027b19c071a1b48f336c625bf4a83` | `de287bcc1bc0eb40ea421ebb2ab8476646dd5c0e2b380a143e76f92394c1ee30` | `7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166` |

The historical v1 implementation commit **`78c7a10c6f3c07471fbd5ae630d5a6a79d6dfed6`** is independently mapped to these exact archived game, runtime-bundle and policy hashes by the one-room source proof `i5-final-source-78c7a10/summary.json` (SHA256 `510ff2c6f2155ae134dfad4de11ea3683eb03800def0fc1971e52d018ebdbbb1`). This source proof is excluded from the80 campaign attempts; original campaign HEAD metadata remains unchanged.

The archived v1 candidate configuration is **V27b:220ms universal immunity,2,600ms recharge for every rig, Pyro travel220, Flashfire25/instant/6s, Napalm6.5per250ms/150ms cast/12s**. It is **not V28’s2,500ms Pyro recharge**. Optional `invulnerableMs` was removed. V26’s original35%-maximum augmented and16–19% native invulnerability guard remained unchanged; its failed logs are preserved in the rejected V26 archive.

### Before/after completion, charge and pacing

| Rig | Baseline→candidate completion | Candidate mean deviation(points) | Rooms/OD baseline→candidate | Strict ordinary seconds baseline→candidate | Broad non-holdout seconds baseline→candidate | Transmission seconds baseline→candidate |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 95%→45% | -8.75 | 1.348485→1.436508 | 33.50→33.07 | 35.15→35.22 | 68.00→71.44 |
| Cryo | 100%→65% | +11.25 | 1.333333→1.406593 | 37.28→36.96 | 38.24→38.96 | 68.55→73.43 |
| Pyro | 55%→45% | -8.75 | 1.428571→1.428571 | 30.25→28.42 | 31.80→30.60 | 59.66→57.02 |
| Arc | 90%→60% | +6.25 | 1.333333→1.428571 | 31.78→29.98 | 32.91→32.26 | 58.74→60.48 |

Pooled baseline→candidate: completion **85.00%→53.75%**; strict ordinary **33.23→32.03s**; broad non-holdout **34.40→34.07s**; Transmission **63.23→64.09s**; median rooms/Overdrive **1.333333→1.428571**. Baseline strict cap violations **18**; candidate **0** across **1001** classified ordinary attempts. Censors **0/0**. First-five clear totals **400/400** and **400/400**.

All four candidate broad non-holdout medians fit30–45s, pooled strict ordinary exceeds30s, and pooled Transmission fits60–75s. Strict ordinary Pyro/Arc medians below30s remain separately visible; they are not silently relabeled as passes. The JSON retains per-run cadence, p10/p90/ranges, every rig/depth row and all paired seed outcomes.

### All80-attempt act distributions

Cells remain **median cleared-room seconds / median incoming damage per attempted room**, with holdouts retained in act time and full survivor denominators in the JSON.

| Profile | Rig | Act1 | Act2 | Act3 | Act4 |
|---|---|---:|---:|---:|---:|
| Baseline | Breacher | 27.45 / 0.00 | 40.06 / 13.15 | 37.90 / 13.44 | 45.20 / 41.99 |
| Baseline | Cryo | 29.98 / 0.00 | 42.98 / 12.53 | 38.67 / 13.54 | 47.63 / 41.85 |
| Baseline | Pyro | 23.72 / 0.00 | 35.02 / 10.74 | 34.43 / 13.54 | 42.68 / 43.33 |
| Baseline | Arc | 25.22 / 0.00 | 36.76 / 0.00 | 35.73 / 0.00 | 43.51 / 12.16 |
| Baseline | Pooled | 26.25 / 0.00 | 38.35 / 10.92 | 36.77 / 13.39 | 45.20 / 33.82 |
| Candidate | Breacher | 29.22 / 0.00 | 38.89 / 13.83 | 36.92 / 41.46 | 44.73 / 53.87 |
| Candidate | Cryo | 33.30 / 0.00 | 41.46 / 20.35 | 40.20 / 48.26 | 45.98 / 80.79 |
| Candidate | Pyro | 25.53 / 0.00 | 32.22 / 11.29 | 32.53 / 39.71 | 39.38 / 60.12 |
| Candidate | Arc | 27.36 / 0.00 | 35.06 / 11.19 | 33.47 / 25.19 | 39.68 / 37.29 |
| Candidate | Pooled | 28.30 / 0.00 | 36.64 / 13.30 | 35.28 / 38.76 | 42.38 / 57.47 |

### Pooled depth time/damage and retained attempts

Each cell is **clears/attempts; median clear seconds; median incoming damage**.

| Room | Baseline80 | Candidate80 |
|---|---|---|
| 1 | 80/80;18.79;0.00 | 80/80;19.11;0.00 |
| 2 | 80/80;29.77;0.00 | 80/80;30.27;5.04 |
| 3 | 80/80;29.20;0.00 | 80/80;32.70;0.00 |
| 4 | 80/80;24.30;0.00 | 80/80;26.65;10.24 |
| 5 | 80/80;30.85;0.00 | 80/80;33.33;0.00 |
| 6 | 80/80;40.02;12.49 | 80/80;38.30;12.64 |
| 7 | 80/80;31.66;0.00 | 80/80;32.23;5.37 |
| 8 | 80/80;29.03;0.00 | 80/80;26.63;11.59 |
| 9 | 80/80;39.00;13.20 | 80/80;36.45;22.71 |
| 10 | 80/80;63.23;33.24 | 80/80;64.09;23.05 |
| 11 | 79/80;37.05;12.28 | 80/80;35.04;29.29 |
| 12 | 79/79;36.08;0.00 | 79/80;34.08;34.74 |
| 13 | 79/79;36.70;13.59 | 79/79;35.75;41.46 |
| 14 | 79/79;36.77;13.68 | 76/79;35.46;44.03 |
| 15 | 79/79;37.97;21.30 | 71/76;36.77;54.78 |
| 16 | 74/79;55.80;40.51 | 65/71;49.90;57.47 |
| 17 | 73/74;37.93;26.39 | 61/65;36.10;43.28 |
| 18 | 70/73;35.08;21.98 | 58/61;33.72;61.72 |
| 19 | 70/70;40.98;14.59 | 54/58;40.32;63.29 |
| 20 | 68/70;67.03;67.56 | 43/54;56.30;95.18 |

### Complete death histograms and outgoing shares

| Profile | Rig | Natural death rooms |
|---|---|---|
| Baseline | Breacher | 16×1 |
| Baseline | Cryo | None |
| Baseline | Pyro | 11×1, 16×3, 17×1, 18×2, 20×2 |
| Baseline | Arc | 16×1, 18×1 |
| Baseline | **Pooled(12deaths)** | **11×1, 16×5, 17×1, 18×3, 20×2** |
| Candidate | Breacher | 12×1, 14×2, 15×2, 16×1, 17×2, 18×1, 19×1, 20×1 |
| Candidate | Cryo | 16×1, 19×2, 20×4 |
| Candidate | Pyro | 15×2, 16×4, 17×1, 18×1, 19×1, 20×2 |
| Candidate | Arc | 14×1, 15×1, 17×1, 18×1, 20×4 |
| Candidate | **Pooled(37deaths)** | **12×1, 14×3, 15×5, 16×6, 17×4, 18×3, 19×4, 20×11** |

Outgoing shares are actual pooled-damage percentages. As before, campaign status/boon attribution does not replace isolated full-kit share/control measurements.

| Profile | Rig | Weapon | Direct ability | Status | Boon | Ability+status+boon |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Breacher | 58.62 | 20.25 | 4.71 | 16.43 | 41.38 |
| Baseline | Cryo | 48.49 | 20.37 | 6.32 | 24.82 | 51.51 |
| Baseline | Pyro | 46.80 | 18.95 | 18.19 | 16.05 | 53.20 |
| Baseline | Arc | 59.42 | 27.78 | 4.36 | 8.43 | 40.58 |
| Candidate | Breacher | 63.12 | 22.19 | 4.01 | 10.68 | 36.88 |
| Candidate | Cryo | 49.44 | 19.35 | 7.32 | 23.88 | 50.56 |
| Candidate | Pyro | 44.52 | 22.19 | 19.21 | 14.08 | 55.48 |
| Candidate | Arc | 60.02 | 28.12 | 4.57 | 7.30 | 39.98 |

### Gate status and remaining acceptance

The full Vitest receipt now reports **237 files passed /1 skipped;2819 tests passed /1 skipped;314.56s**, SHA256 **`9ddfa515ce09203250e07a27410e2a351b22572f1bf5b487f9f6d7d0424b5b58`**, preserved verbatim in the final80 archive. This follows the rejected V26 run: the original invulnerability bounds were preserved, optional immunity override removed, and authorized cast/damage/body-count pins updated without removing timing, geometry, CC or keyboard assertions. Full-kit guards remain30–45% and≤1.25×.

Eight final native campaigns and the remaining standalone gates are still required. Functional smoke checks are not campaign completions, and analytic/native outcomes can diverge. No final native acceptance, graphics-preparation fix or performance certificate is inferred from these80-run simulation samples.


## Policy-v1/v2 acceptance withdrawn; fresh v3 evidence required

The lead confirmed two policy defects: **directional Bulwark** used the resolved cursor/actor location as the predicted wall center, while native execution centers it at the marine plus aim direction times its fixed70-unit range; and a **global cursor-tip LOS prefilter** rejected otherwise valid cone/beam targets before a wall when the cursor tip extended beyond it. These are policy/action-observation defects, so passing historical balance metrics or byte-identical source snapshots do not establish corrected-policy acceptance.

All **v1 paired80 results, v1 native results and v2 partials are historical/provisional**. The v1 counts68/80 and43/80, all20 seeds per rig, complete distributions/hashes and the78c7a10 source mapping remain intact. They are not renamed v3 or combined with future v3 runs. The lead is freezing v3 and will rerun baseline80/candidate80 before fresh acceptance claims. No v3 result is read or inferred here.

The final80 evidence now includes SHA-identified interruption receipts: v1 native queue interruption (`provisional-v1-interruption-78c7a10/interruption.json`) and v2 policy interruption (`aim-v2-interruption.json`). Completed natural native outcomes retain their original classification; interrupted cases are **not counted as gameplay deaths** or as completed final confirmations. The v2 receipt records the LOS defect and contains no job details, so no partial-cohort completion counts are inferred from it.

- `artifacts/nextgen/i5-continuation/provisional-v1-interruption-78c7a10/interruption.json`: SHA256 `9975dcbbf9f6ec344627887f8c73f0d73ab665af4587369ce75a072d4fe9dda5`; PROVISIONAL_V1_INTERRUPTED.
- `artifacts/nextgen/i5-continuation/aim-v2-interruption.json`: SHA256 `268b1ae09e814162a1cc66d250718207cd19ff5875cf6471f55d50562b9b8d25`; v2-interrupted.

This update changes only evidence status/reasons and receipt references. Historical cohort data, gameplay/test/policy code and all recorded source/report hashes are preserved. The earlier full-unit pass remains a valid receipt for that source snapshot, not proof that its bot policy matched native ability semantics.
