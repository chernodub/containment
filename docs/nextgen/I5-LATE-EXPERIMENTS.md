# I5 — late composition and occupancy experiments (V5–V8)

These are complete, rejected tuning experiments, preserved for the integration report. V5 completed **5/40 campaigns (12.5%)** and V6 **6/40 (15.0%)**; both have **zero censored outcomes**. Neither meets the 40–60% completion target. V7 and V8 subsequently reach the pooled completion band at **23/40 (57.5%)** and **19/40 (47.5%)**, but both fail the rig-distance target. All four remain rejected experiments rather than final balance acceptance or native-browser confirmation.

## Selection and provenance

V5 and V6 use the frozen **`i5-navigation-observer-v3`** policy (`sim-policy-v4`), ten seeds per rig: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. Breacher, Cryo, Pyro and Arc each have ten unassisted twenty-room campaign attempts. Each attempt ends naturally in completion or death. Earlier navigation-censored pilots are excluded.

The compact, tracked archives were recomputed with the repository's actual `balanceSummary` helper from the forty explicitly selected raw campaign JSON files in each corresponding `artifacts/nextgen/playtest/<cohort>/` directory:

- [V5 complete experiment archive](evidence/I5/i5-final-policy-v5-40.json)
- [V6 complete experiment archive](evidence/I5/i5-final-policy-v6-40.json)
- [V7 complete experiment archive](evidence/I5/i5-final-policy-v7-40.json)
- [V8 complete experiment archive](evidence/I5/i5-final-policy-v8-40.json)

Every archive contains the SHA-256 of each original report's exact bytes, forty run receipts, HEAD/game/policy/bundle provenance, hashes of the frozen script and gameplay sources, per-rig distributions, pooled distributions, all twenty depth rows and exact parameters. Summary measurements are rounded to six decimals; raw reports retain their original precision. Each saved bundle's bytes were checked against the bundle hash recorded by all forty runs.

All four cohorts recorded HEAD `1f26b264925bdc893a29e32256dc4b89b964201e` and policy SHA-256 `e4e6c2e75850aa0a80052f082c748c64fa0e1ccc065cdca8f10747b5c5e2a8ff`.

| Cohort | Game source hash | Immutable bundle hash |
|---|---|---|
| i5-final-policy-v5-40 | `cc14e8a517ebcfdf6189ca36849c5a7ea184d885997f929c3b533e192e0f1dbd` | `619140e3b289485cf4c2364bedf5dd0cc9790d9b9a960aa7d3383d7fbb51a1aa` |
| i5-final-policy-v6-40 | `cc9da2d874cad968812d93cd9c122505782a6e65b322da7b98279036bf2e93bf` | `64ccff6b063f44b39447b15cc4542337fc1265b51619fc386c2bf0a6fc1033a6` |
| i5-final-policy-v7-40 | `8751737b47b971e413fd93ff54b47ca1a0e5fba00921dbcbcda20e8dcc0e4467` | `fe2d919263b4a475af40108483595f190fa7beb418e55cfcfcb5610a0c62e0f2` |
| i5-final-policy-v8-40 | `44dcecadc786e3bcaeaff321af44d5d4d8efe3742b1c4c8622219e577a075c21` | `a6ec0098eabbbb587c79c8868b62dbfa341cbfdf81ad2cad2e8ac363696bedd5` |

## Frozen encounter parameters

Both experiments retain the V4 progression and charging values. Additional story enemy-progression damage is **×(1 + pressure × .18)** and speed **×(1 + pressure × .05)**, where `pressure = max(0, zeroBasedDepth - 4) / 15`, with room 10 excluded from that additional pressure. Story elite health/damage multipliers from room 6 onward remain **1.08 / 1.05**; opening and legacy values remain unchanged. Ordinary story elite probability remains **.14 + (zeroBasedDepth - 5) × .018**, including the finale, while authored elite rooms keep their existing **.10 + depth × .008** rule. Overdrive remains **damage / 12000 + kills × .0125**, Drive Dynamo **×1.3**.

Relative to V4, both V5 and V6 replace the pool from zero-based depth **10** onward, including finale depth **19**:

| Family | V4 tickets (8 total) | V5 / V6 tickets (10 total) |
|---|---:|---:|
| Crawler | 2 | 3 |
| Brute | 1 | 2 |
| Spitter | 2 | 3 |
| Stalker | 2 | 2 |
| Carrier | 1 | 0 |

The first Matron request in room 16 remains a Carrier exception. The new late pool and ordinary elite rule also apply to the final holdout. Transmission (zero-based depth 9) is unchanged: **32 requests at 750 ms**, its existing mix and cap. Finale scheduling remains **48 requests at 900 ms**. No rig damage, basic crawler health, charging coefficient, reward amount or save schema changed between these experiments.

V5 retains the story concurrent ceiling **20**. V6 changes only the ceiling for zero-based depth **≥10** to **15**, leaving earlier story ceiling 20 and legacy ceiling 18. These are ceilings in the existing depth/act formula, not a claim that every room starts at that many live bodies: for example room 11's cap is 17 in V5 and 15 in V6. The frozen V5/V6 progression files are byte-identical; their director source differs only in this cap normalization and its comment.

## Campaign outcomes, cadence and room times

Rooms/Overdrive is the median of each run's **cleared rooms / accepted Overdrive uses**; the bracket is its p10–p90 interval. Room times pool cleared rooms, with ordinary time excluding holdouts 10 and 20. A death-room attempt contributes damage but not a clear time. The JSON also supplies pooled cadence, full ranges and sample counts; the ratio of medians is not substituted for per-run cadence.

| Experiment | Rig | Completed | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|
| V5 | Breacher | 0/10 (0%) | 1.732 [1.500–1.875] | 31.63 | 65.50 |
| V5 | Cryo | 3/10 (30%) | 1.542 [1.357–1.700] | 35.08 | 67.88 |
| V5 | Pyro | 0/10 (0%) | 1.866 [1.500–2.000] | 28.92 | 58.43 |
| V5 | Arc | 2/10 (20%) | 1.600 [1.333–1.778] | 30.90 | 60.24 |
| V6 | Breacher | 1/10 (10%) | 1.625 [1.455–1.857] | 32.06 | 65.50 |
| V6 | Cryo | 1/10 (10%) | 1.583 [1.462–1.700] | 35.82 | 67.88 |
| V6 | Pyro | 1/10 (10%) | 1.725 [1.429–2.000] | 28.72 | 58.43 |
| V6 | Arc | 3/10 (30%) | 1.538 [1.267–1.636] | 31.33 | 60.24 |

Pooled ordinary medians are **32.00 s** (V5) and **32.03 s** (V6); pooled Transmission median is **64.82 s** in both. All first-five-room attempts clear: **200/200 room clears per cohort**, keeping act 1 welcoming. Transmission is intentionally unchanged, so its repeated statistics do not establish a new pacing improvement from these experiments.

V5 misses the 1.2–1.7 median rooms/Overdrive target for Breacher (**1.732**) and Pyro (**1.866**). V6 brings Breacher inside that range, but **Pyro's 1.725 remains above the 1.7 ceiling**. Pyro's ordinary median remains below 30 seconds and its Transmission median below 60 seconds in both cohorts. These misses remain visible; neither candidate is accepted. V5 also leaves Cryo 17.5 percentage points above its 12.5% cohort mean, beyond the approximate 15-point rig-spread target.

## Time and damage by act

Each cell is **median cleared-room seconds / median damage taken per attempted room**. Acts are rooms 1–5, 6–10, 11–15 and 16–20. Holdouts remain in their act's time distribution. Damage is authoritative health-plus-armor lost and can exceed the initial resource pool after recovery. Later acts contain survivors and fewer attempts; compare the JSON's denominators and percentiles before treating a difference as a causal threat multiplier.

| Experiment | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| V5 | Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 32.00 / 27.54 | 38.12 / 122.59 |
| V5 | Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 36.04 / 44.05 | 38.60 / 64.45 |
| V5 | Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 33.37 / 51.92 | 36.80 / 78.43 |
| V5 | Arc | 25.18 / 0.00 | 33.17 / 0.00 | 33.43 / 15.92 | 39.63 / 47.21 |
| V5 | **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **33.66 / 38.03** | **38.70 / 67.24** |
| V6 | Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 32.82 / 27.55 | 40.01 / 63.40 |
| V6 | Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 37.55 / 41.61 | 39.88 / 93.75 |
| V6 | Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 31.82 / 43.82 | 42.60 / 48.04 |
| V6 | Arc | 25.18 / 0.00 | 33.17 / 0.00 | 32.39 / 14.89 | 37.74 / 50.44 |
| V6 | **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **33.60 / 29.61** | **39.58 / 63.45** |

Pooled median damage rises with depth in both cohorts: **0 → 19.84 → 38.03 → 67.24** for V5 and **0 → 19.84 → 29.61 → 63.45** for V6. Per-rig medians and late survivor composition differ; for example Cryo's act-4 median increases in V6 even though the cap is lower. These observations do not support a claim that reducing the cap uniformly reduces every rig's damage or raises every rig's success rate.

## Death room histograms

Counts use one-based room numbers; `room×count` lists every natural death. There are no stalls, timeouts, interrupted runs or censored observations in these two selected cohorts.

| Experiment | Rig | Deaths by room |
|---|---|---|
| V5 | Breacher | 10×1, 13×1, 15×1, 16×4, 17×1, 19×2 |
| V5 | Cryo | 16×2, 18×2, 20×3 |
| V5 | Pyro | 14×2, 15×2, 16×4, 18×1, 19×1 |
| V5 | Arc | 12×1, 15×1, 16×1, 17×3, 20×2 |
| V5 | **Pooled (35 deaths)** | **10×1, 12×1, 13×1, 14×2, 15×4, 16×11, 17×4, 18×3, 19×3, 20×5** |
| V6 | Breacher | 10×1, 13×1, 14×1, 15×1, 16×2, 17×1, 18×1, 20×1 |
| V6 | Cryo | 17×1, 18×1, 19×2, 20×5 |
| V6 | Pyro | 11×1, 12×1, 14×1, 15×1, 16×3, 17×1, 18×1 |
| V6 | Arc | 17×1, 19×2, 20×4 |
| V6 | **Pooled (34 deaths)** | **10×1, 11×1, 12×1, 13×1, 14×2, 15×2, 16×5, 17×4, 18×3, 19×4, 20×10** |

Deaths span rooms 10–20, but remain concentrated: V5 loses **11 runs in room 16**, and V6 loses **10 in room 20**. Lowering the cap shifts some deaths later without reaching the requested overall success band. V5 completion in Breacher/Cryo/Pyro/Arc order is **0/30/0/20%**; V6 is **10/10/10/30%**.

## Authoritative outgoing damage shares

Values are percentages of pooled outgoing damage within each rig and experiment. The final column combines direct ability, status and boon sources; it is not isolated causal rig attribution. Statuses/procs can belong to existing weapon builds, Arc Overclock amplifies the weapon column, and protection/control have no direct-damage receipt. These campaign columns do not replace the deterministic full-kit harness's 30–45% ability-share invariant.

| Experiment | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| V5 | Breacher | 63.36 | 21.11 | 3.88 | 11.65 | 36.64 |
| V5 | Cryo | 50.05 | 19.89 | 6.96 | 23.09 | 49.95 |
| V5 | Pyro | 49.99 | 17.38 | 18.27 | 14.36 | 50.01 |
| V5 | Arc | 61.44 | 27.15 | 4.91 | 6.50 | 38.56 |
| V6 | Breacher | 63.14 | 21.18 | 4.57 | 11.11 | 36.86 |
| V6 | Cryo | 51.34 | 18.74 | 6.35 | 23.57 | 48.66 |
| V6 | Pyro | 50.28 | 17.21 | 18.09 | 14.42 | 49.72 |
| V6 | Arc | 60.51 | 26.91 | 5.83 | 6.75 | 39.49 |

## What these experiments establish

Frost Armor restores **3 armor on a chilled kill**, not only on a frozen kill: `MutationRuntime.kill` checks positive chill stacks and ownership of the boon. Its catalog says the same. Increasing elite resistance to hard freeze alone therefore does not disable its recovery condition. No Frost Armor or rig value was changed here.

A Carrier can reserve up to **three child slots**; the director budgets a Carrier request at four occupied slots, and its children can later supply additional damage/kill receipts. Replacing carriers with single-body enemies therefore changes two linked systems: potential kill-based armor/Overdrive opportunities and the number of live attackers admitted under the same occupied-slot ceiling. Removing brood opportunities is a plausible recovery counter, but retaining ceiling 20 can simultaneously admit more damaging live bodies. V6's ceiling 15 tests that normalization explicitly.

The measured cadence slowdown and lower clear rates are consistent with those mechanisms, but they do not isolate each contribution. Different family health/armor, ranged pressure, movement, kill order, saturation, resource caps, boon choices and later survival all change the trajectory. No per-kill recovered-armor counterfactual or isolated control-value measurement was collected, so a precise share of the completion change cannot be assigned to Frost Armor, brood removal or occupancy alone. Even the cap-only V5→V6 comparison is specific to this policy and ten seeds per rig; Cryo falls from 30% to 10% while the other rigs improve.

V7 and V8 are complete and archived below. They retain the pool/cap changes and test an additional late-damage normalization; neither supplies final acceptance.


## V7 / V8 — completed late-damage normalization trials

V7 adds a **.72** enemy-progression damage multiplier to story rooms from zero-based depth **10** onward, including finale depth **19**. V8 uses **.80** in the same scope. Both retain V6's late ceiling **15**, brood-free late pool, elite probabilities and multipliers, .18 damage/.05 speed progression pressure, ordinary spawn cadence and unchanged rigs/charging. Earlier rooms, Transmission (depth 9) and legacy progression are unchanged. This changes the progression multiplier, not the assisted-playtest incoming-damage setting; fixed champion-promotion values and separately authored hazards do not automatically inherit it. The frozen director files match V6 byte-for-byte; the progression change is the late damage factor.

Each cohort again has forty natural campaign outcomes on the same ten seeds per rig and the same observer policy. **V7: 23 completes / 17 deaths / 0 censors. V8: 19 completes / 21 deaths / 0 censors.** Both meet the pooled 40–60% success band, but fail the rule that every rig stay within about 15 percentage points of its cohort mean.

| Experiment | Rig | Completed | Deviation from cohort mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|---:|
| V7 | Breacher | 5/10 (50%) | -7.5 | 1.500 [1.250–1.667] | 33.53 | 65.50 |
| V7 | Cryo | 7/10 (70%) | +12.5 | 1.538 [1.429–1.667] | 36.35 | 67.88 |
| V7 | Pyro | 3/10 (30%) | -27.5 | 1.561 [1.333–1.778] | 29.53 | 58.43 |
| V7 | Arc | 8/10 (80%) | +22.5 | 1.484 [1.333–1.583] | 31.82 | 60.24 |
| V8 | Breacher | 3/10 (30%) | -17.5 | 1.500 [1.250–1.667] | 33.33 | 65.50 |
| V8 | Cryo | 4/10 (40%) | -7.5 | 1.538 [1.429–1.583] | 36.26 | 67.88 |
| V8 | Pyro | 3/10 (30%) | -17.5 | 1.561 [1.250–1.875] | 29.48 | 58.43 |
| V8 | Arc | 9/10 (90%) | +42.5 | 1.500 [1.333–1.538] | 31.81 | 60.24 |

V7 completion in Breacher/Cryo/Pyro/Arc order is **50/70/30/80%**, with mean **57.5%**: Pyro is **27.5 points below** and Arc **22.5 points above** the mean. V8 is **30/40/30/90%**, with mean **47.5%**: Arc is **42.5 points above**, while Breacher and Pyro are each **17.5 points below**. These are explicit failures of the cross-rig target even though the pooled percentages look acceptable.

All eight per-rig median Overdrive cadences are inside **1.2–1.7**. Pooled ordinary medians are **32.87 s** (V7) and **33.34 s** (V8), and pooled Transmission remains **64.82 s** in both. Pyro's ordinary median remains slightly below 30 seconds and its Transmission median remains below 60 seconds. All first-five-room attempts still clear, **200/200 per cohort**.

### V7 / V8 time and damage by act

The same definitions and survivor-denominator caveats apply: each cell is **median cleared-room seconds / median damage taken per attempted room**.

| Experiment | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| V7 | Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 35.23 / 17.55 | 40.68 / 59.27 |
| V7 | Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 37.89 / 31.84 | 43.97 / 59.35 |
| V7 | Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 31.63 / 33.47 | 38.90 / 47.76 |
| V7 | Arc | 25.18 / 0.00 | 33.17 / 0.00 | 33.63 / 10.72 | 38.79 / 34.59 |
| V7 | **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **34.91 / 22.05** | **40.26 / 48.17** |
| V8 | Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 34.23 / 22.24 | 39.78 / 64.77 |
| V8 | Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 37.11 / 33.29 | 39.38 / 65.15 |
| V8 | Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 32.22 / 37.15 | 39.08 / 52.61 |
| V8 | Arc | 25.18 / 0.00 | 33.17 / 0.00 | 33.63 / 11.91 | 39.80 / 38.43 |
| V8 | **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **34.63 / 24.97** | **39.57 / 57.19** |

Pooled median damage is **0 → 19.84 → 22.05 → 48.17** in V7 and **0 → 19.84 → 24.97 → 57.19** in V8. These do not establish equal effective difficulty across rigs; Arc still takes much less median damage in the middle acts.

### V7 / V8 death room histograms

| Experiment | Rig | Deaths by room |
|---|---|---|
| V7 | Breacher | 10×1, 16×1, 20×3 |
| V7 | Cryo | 17×2, 20×1 |
| V7 | Pyro | 15×1, 17×1, 18×3, 20×2 |
| V7 | Arc | 20×2 |
| V7 | **Pooled (17 deaths)** | **10×1, 15×1, 16×1, 17×3, 18×3, 20×8** |
| V8 | Breacher | 10×1, 16×1, 18×1, 19×1, 20×3 |
| V8 | Cryo | 18×1, 20×5 |
| V8 | Pyro | 12×1, 15×1, 16×1, 17×1, 18×1, 20×2 |
| V8 | Arc | 20×1 |
| V8 | **Pooled (21 deaths)** | **10×1, 12×1, 15×1, 16×2, 17×1, 18×3, 19×1, 20×11** |

The finale accounts for **8 of 17 deaths** in V7 and **11 of 21** in V8. V7's remaining deaths are in rooms 10 and 15–18; V8 also has room-12 and room-19 deaths. No tooling censor is relabeled as a death.

### V7 / V8 outgoing damage shares

The same authoritative-source and causal-attribution caveats above apply. Values are percent of each rig's pooled outgoing damage.

| Experiment | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| V7 | Breacher | 60.52 | 21.38 | 5.66 | 12.43 | 39.48 |
| V7 | Cryo | 50.98 | 18.35 | 6.80 | 23.87 | 49.02 |
| V7 | Pyro | 47.84 | 17.00 | 18.06 | 17.09 | 52.16 |
| V7 | Arc | 59.91 | 26.73 | 6.29 | 7.08 | 40.09 |
| V8 | Breacher | 61.52 | 21.04 | 5.47 | 11.96 | 38.48 |
| V8 | Cryo | 50.46 | 18.73 | 6.66 | 24.15 | 49.54 |
| V8 | Pyro | 47.80 | 17.20 | 18.10 | 16.90 | 52.20 |
| V8 | Arc | 59.91 | 26.55 | 6.15 | 7.38 | 40.09 |

Increasing the late damage factor from .72 to .80 does not monotonically reduce every rig's completion on these ten seeds: Arc changes from 8/10 to 9/10, while Breacher and Cryo fall. This is a coupled campaign/policy trajectory, not an isolated ability counterfactual. The data support retaining the rig-distance failure rather than accepting a pooled average or claiming a particular ability is the sole cause.

V9 is a separate trial of **.64 late damage with a .96 finale override**. Its results are **unassessed and excluded** here. Final tuning still needs an accepted complete matched cohort, final native confirmation and repository gates.
