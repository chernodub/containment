# I5 — corrected targeted-aim policy experiments

These are complete forty-run simulation cohorts under **`i5-catalog-ability-aim-v1` / `sim-policy-v5`**, with navigation observer v3 retained. They are separate from historical navigation-only policy experiments. The corrected production baseline completes **33/40 (82.5%)**; V22 completes **23/40 (57.5%)**, but fails cross-rig and ordinary-time acceptance. Neither is final balance acceptance. V23–V26 are archived below; V26 is selected with final native evidence pending.

## Selection and provenance

Each cohort uses ten unassisted attempts per rig, seeds **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. All natural deaths, censored counts, per-run final source receipts, all per-rig/per-depth distributions, strict ordinary-cap evidence and broad non-holdout timing remain in the compact archives:

- [Corrected-aim production baseline](evidence/I5/I5-AIM-BASELINE.json)
- [V22 candidate](evidence/I5/I5-AIM-V22.json)
- [V23 candidate](evidence/I5/I5-AIM-V23.json)
- [V24 candidate](evidence/I5/I5-AIM-V24.json)
- [V25 candidate](evidence/I5/I5-AIM-V25.json)
- [V26 selected profile, native pending](evidence/I5/I5-AIM-V26.json)

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

The runtime now reads catalog dash distance and optional immunity, falling back to the original shared immunity value when absent. This varies the existing escape parameters; movement still goes through actual collision authority. The full **stats and room arrays are deeply identical for all30 non-Pyro attempts** versus V24, not just selected seeds. Each control comparison retains its V24 raw report SHA.

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

V26 varies only the same Pyro dash immunity **320→500 ms**, retaining distance180 and recharge2,500 ms; it is pending and no V26 results are read or accepted here.


## V26 — selected profile, final native evidence pending

V26 completes **20/40 (50%)**, B/C/P/A **60/50/40/50%**, under the frozen corrected-aim policy. All four rig rates lie within ten points of the mean. The lead selected this profile for **two final native campaigns per rig**, still pending final gates and that native evidence. Selection is not a claim that all individual pacing measures or browser acceptance have passed. [I5-AIM-V26.json](evidence/I5/I5-AIM-V26.json) retains all forty reports’ hashes, outcomes, source identities and depth distributions.

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
