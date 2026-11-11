# I5 — late composition and occupancy experiments (V5–V21)

These are complete, rejected tuning experiments, preserved for the integration report. V5 completed **5/40 campaigns (12.5%)** and V6 **6/40 (15.0%)**; both have **zero censored outcomes**. Neither meets the 40–60% completion target. V7 and V8 subsequently reach the pooled completion band at **23/40 (57.5%)** and **19/40 (47.5%)**, but both fail the rig-distance target. V9 and V10 also reach the pooled band at **22/40 (55.0%)** and **21/40 (52.5%)**, but retain a **20% Pyro completion rate** and fail cross-rig balance. V11 reaches **20/40 (50.0%)**, but its **40/80/30/50%** rig rates also fail cross-rig balance. V12 then reaches **38/40 (95.0%)** and exceeds the difficulty target while slowing three rigs beyond the Overdrive cadence target. V13/V14 remain too easy at **90.0% / 82.5%** overall, and V15 returns to **47.5%** overall but leaves Pyro at **10%**. V16/V17 add **32.5% / 42.5%** overall with continued rig gaps. V18 reaches **40.0%** overall but also fails the rig-distance target. V19–V21 also remain outside acceptance. All seventeen tuning selections remain rejected experiments rather than final balance acceptance. Two V9 Breacher native probes are retained below; they do not provide final confirmation across all rigs.

## Selection and provenance

V5 and V6 use the frozen **`i5-navigation-observer-v3`** policy (`sim-policy-v4`), ten seeds per rig: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. Breacher, Cryo, Pyro and Arc each have ten unassisted twenty-room campaign attempts. Each attempt ends naturally in completion or death. Earlier navigation-censored pilots are excluded.

The compact, tracked archives were recomputed with the repository's actual `balanceSummary` helper from the forty explicitly selected raw campaign JSON files in each corresponding `artifacts/nextgen/playtest/<cohort>/` directory:

- [V5 complete experiment archive](evidence/I5/i5-final-policy-v5-40.json)
- [V6 complete experiment archive](evidence/I5/i5-final-policy-v6-40.json)
- [V7 complete experiment archive](evidence/I5/i5-final-policy-v7-40.json)
- [V8 complete experiment archive](evidence/I5/i5-final-policy-v8-40.json)
- [V9 complete experiment archive](evidence/I5/i5-final-policy-v9-40.json)
- [V10 complete experiment archive](evidence/I5/i5-final-policy-v10-40.json)
- [V11 complete experiment archive](evidence/I5/i5-final-policy-v11-40.json)
- [V12 complete experiment archive](evidence/I5/i5-final-policy-v12-40.json)
- [V13 complete experiment archive](evidence/I5/i5-final-policy-v13-40.json)
- [V14 complete experiment archive](evidence/I5/i5-final-policy-v14-40.json)
- [V15 complete experiment archive](evidence/I5/i5-final-policy-v15-40.json)
- [V16 complete tuning experiment archive](evidence/I5/i5-final-policy-v16-40.json)
- [V17 complete tuning experiment archive](evidence/I5/i5-final-policy-v17-40.json)
- [V17 reserved evaluation archive](evidence/I5/i5-v17-reserved-40.json)
- [V17 combined eighty-run archive](evidence/I5/i5-v17-combined-80.json)
- [V18 complete tuning experiment archive](evidence/I5/i5-final-policy-v18-40.json)
- [i5-final-policy-v19-40 complete tuning archive](evidence/I5/i5-final-policy-v19-40.json)
- [i5-final-policy-v20-40 complete tuning archive](evidence/I5/i5-final-policy-v20-40.json)
- [i5-final-policy-v21-40 complete tuning archive](evidence/I5/i5-final-policy-v21-40.json)
- [Production checkpoint report](I5-PRODUCTION-CHECKPOINT.md)
- [V18 native Pyro calibration archive](evidence/I5/i5-v18-native-pyro.json)
- [V9 native Breacher probe archive](evidence/I5/i5-v9-native-breacher.json)

Every archive contains the SHA-256 of each original report's exact bytes, forty run receipts, HEAD/game/policy/bundle provenance, hashes of the frozen script and gameplay sources, per-rig distributions, pooled distributions, all twenty depth rows and exact parameters. Summary measurements are rounded to six decimals; raw reports retain their original precision. Each saved bundle's bytes were checked against the bundle hash recorded by all forty runs.

V5–V10 recorded HEAD `1f26b264925bdc893a29e32256dc4b89b964201e`; V11 recorded HEAD `072e033da6bbce3d1b816fe254521873a1d39450`; V12–V15 recorded HEAD `b839492dfdff576485970ba65ee06340fff4609b`. All eleven recorded policy SHA-256 `e4e6c2e75850aa0a80052f082c748c64fa0e1ccc065cdca8f10747b5c5e2a8ff`.

| Cohort | Game source hash | Immutable bundle hash |
|---|---|---|
| i5-final-policy-v5-40 | `cc14e8a517ebcfdf6189ca36849c5a7ea184d885997f929c3b533e192e0f1dbd` | `619140e3b289485cf4c2364bedf5dd0cc9790d9b9a960aa7d3383d7fbb51a1aa` |
| i5-final-policy-v6-40 | `cc9da2d874cad968812d93cd9c122505782a6e65b322da7b98279036bf2e93bf` | `64ccff6b063f44b39447b15cc4542337fc1265b51619fc386c2bf0a6fc1033a6` |
| i5-final-policy-v7-40 | `8751737b47b971e413fd93ff54b47ca1a0e5fba00921dbcbcda20e8dcc0e4467` | `fe2d919263b4a475af40108483595f190fa7beb418e55cfcfcb5610a0c62e0f2` |
| i5-final-policy-v8-40 | `44dcecadc786e3bcaeaff321af44d5d4d8efe3742b1c4c8622219e577a075c21` | `a6ec0098eabbbb587c79c8868b62dbfa341cbfdf81ad2cad2e8ac363696bedd5` |
| i5-final-policy-v9-40 | `6877e6801c53cb0a0526052c77b75c35f8602df7455baefa00e566189392394e` | `2190f4588e4fc42dd550cdf0a6927c84f8c682c7b40308a074b9c1f64475e08c` |
| i5-final-policy-v10-40 | `e81b7519285c3cdb11a54ccb426dc16d736aea2e97341c565fb333e097a8bac8` | `24dafb361a5c04ae84d225fd28ca44ad13a52e703b1dbeb200c842c87fea7ccc` |
| i5-final-policy-v11-40 | `2bbb4671e57e046474c176a5c13d26607651a3cfceea0c141a0adb50b8019128` | `d991d83ac865e53865e05b9b47d7bf1b97689d8348fd8e227a4a254bf89ddfbe` |
| i5-final-policy-v12-40 | `2e8031d522943ac70836f3e5f3fcab0feb8926ebfecc5d56e2a46bfba96a1c58` | `70f1c8b5da5a04cde5e8b07166189f4d7286a7c50852430511a6ce419e1d06fa` |
| i5-final-policy-v13-40 | `dbf1af11fc40e314abacf6b17997a3b4c949dc3d6923f7274ee124c9b1624168` | `c58b059efdc6817ac63f1a4212c9a9d28526da12aad26924d1046bf901f91cf0` |
| i5-final-policy-v14-40 | `46dbe181095e4b6ba50a259f5dd7cf39a14ffa1adfd4a53fa8524e1f738dd252` | `21fd402890cd85b40b310da0c0ab63810e863e535e4d4180d9acdffab8b938fe` |
| i5-final-policy-v15-40 | `8127e5e957e791b862a35a3f3ebc5bda0317d6e7c83e0a854122b52b6d18a4d6` | `3bf7fadc06f0868f77e7d38a863690e275d07c9b2e00ab86d9f1700b54f0f029` |

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

V9 and V10 are complete and archived below. They separate ordinary late damage normalization from the finale override; neither supplies final acceptance.


## V9 / V10 — completed late/finale damage separation

V9 uses a **.64** enemy-progression damage factor for story zero-based depths **10–18** and a **.96** override at finale depth **19**. V10 changes only the ordinary late factor to **.68**, retaining finale **.96**. Both keep V6's late ceiling **15**, late family pool, elite frequencies, .18/.05 progression pressure, fixed encounter scheduling and rig/charging values. Their director source hashes match V6; the changed progression expression is archived exactly. As above, these factors do not automatically rescale fixed champion promotions or separately authored hazards.

Each selected cohort is complete: **V9 22 completes / 18 deaths / 0 censors**, **V10 21 completes / 19 deaths / 0 censors**. V10 was archived only after its fortieth report finished. Neither is accepted, despite pooled completion inside the 40–60% band.

| Experiment | Rig | Completed | Deviation from cohort mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|---:|
| V9 | Breacher | 6/10 (60%) | +5.0 | 1.500 [1.250–1.667] | 33.38 | 65.50 |
| V9 | Cryo | 7/10 (70%) | +15.0 | 1.500 [1.429–1.667] | 35.74 | 67.88 |
| V9 | Pyro | 2/10 (20%) | -35.0 | 1.603 [1.267–1.778] | 29.92 | 58.43 |
| V9 | Arc | 7/10 (70%) | +15.0 | 1.500 [1.333–1.583] | 31.77 | 60.24 |
| V10 | Breacher | 7/10 (70%) | +17.5 | 1.500 [1.250–1.667] | 33.48 | 65.50 |
| V10 | Cryo | 5/10 (50%) | -2.5 | 1.500 [1.429–1.667] | 35.73 | 67.88 |
| V10 | Pyro | 2/10 (20%) | -32.5 | 1.642 [1.267–1.875] | 29.85 | 58.43 |
| V10 | Arc | 7/10 (70%) | +17.5 | 1.500 [1.333–1.583] | 31.81 | 60.24 |

V9's Breacher/Cryo/Pyro/Arc rates are **60/70/20/70%**, mean **55.0%**: Pyro is **35 points below** the mean. Cryo and Arc are exactly **15 points above**. V10 is **70/50/20/70%**, mean **52.5%**: Pyro is **32.5 points below**, and Breacher/Arc are each **17.5 points above**. Both fail the approximate 15-point rig-distance target; an acceptable pooled average does not fix this gap.

All per-rig median Overdrive cadences remain inside **1.2–1.7**. Pooled ordinary medians are **32.84 s** (V9) and **32.87 s** (V10), with pooled Transmission again **64.82 s**. Pyro ordinary medians are **29.92 / 29.85 s**, and its unchanged Transmission median is **58.43 s**. Act 1 again clears **200/200 room attempts** in each cohort.

### V9 / V10 time and damage by act

Cells retain the same **median cleared-room seconds / median damage taken per attempted room** definition. The JSON contains denominators and full distributions.

| Experiment | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| V9 | Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 35.23 / 15.60 | 39.00 / 63.98 |
| V9 | Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 37.89 / 26.63 | 41.67 / 56.97 |
| V9 | Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 31.97 / 30.45 | 37.53 / 60.26 |
| V9 | Arc | 25.18 / 0.00 | 33.17 / 0.00 | 32.39 / 9.53 | 39.80 / 36.18 |
| V9 | **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **34.48 / 19.06** | **39.85 / 52.35** |
| V10 | Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 35.48 / 17.90 | 39.87 / 55.37 |
| V10 | Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 37.89 / 30.07 | 39.30 / 67.41 |
| V10 | Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 31.97 / 33.12 | 38.30 / 56.70 |
| V10 | Arc | 25.18 / 0.00 | 33.17 / 0.00 | 33.63 / 10.13 | 38.32 / 39.58 |
| V10 | **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **34.63 / 21.63** | **38.82 / 55.37** |

Pooled damage medians are **0 → 19.84 → 19.06 → 52.35** for V9 and **0 → 19.84 → 21.63 → 55.37** for V10. V9's act-3 median falls slightly below act 2, so it does not establish a uniformly rising per-act damage curve. Late survivor composition remains relevant to both comparisons.

### V9 / V10 death room histograms

| Experiment | Rig | Deaths by room |
|---|---|---|
| V9 | Breacher | 10×1, 18×1, 20×2 |
| V9 | Cryo | 20×3 |
| V9 | Pyro | 16×2, 17×1, 18×2, 20×3 |
| V9 | Arc | 20×3 |
| V9 | **Pooled (18 deaths)** | **10×1, 16×2, 17×1, 18×3, 20×11** |
| V10 | Breacher | 10×1, 18×1, 20×1 |
| V10 | Cryo | 20×5 |
| V10 | Pyro | 16×3, 18×3, 20×2 |
| V10 | Arc | 20×3 |
| V10 | **Pooled (19 deaths)** | **10×1, 16×3, 18×4, 20×11** |

Both cohorts lose **11 runs in room 20**. The remaining deaths span rooms 10 and 16–18; no censoring or unstarted native job is included in those counts.

### V9 / V10 outgoing damage shares

Values are percentages of each rig's pooled outgoing damage, with the same source-attribution limitations as the earlier tables.

| Experiment | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| V9 | Breacher | 60.47 | 21.51 | 5.42 | 12.59 | 39.53 |
| V9 | Cryo | 50.28 | 18.87 | 7.10 | 23.75 | 49.72 |
| V9 | Pyro | 48.56 | 17.16 | 18.27 | 16.00 | 51.44 |
| V9 | Arc | 59.75 | 26.69 | 6.33 | 7.23 | 40.25 |
| V10 | Breacher | 60.90 | 21.18 | 5.32 | 12.60 | 39.10 |
| V10 | Cryo | 50.52 | 18.78 | 6.94 | 23.76 | 49.48 |
| V10 | Pyro | 48.90 | 17.01 | 18.20 | 15.88 | 51.10 |
| V10 | Arc | 59.87 | 26.70 | 6.26 | 7.17 | 40.13 |

### V9 native Breacher probes

Two desktop native-input fast-render campaigns finished naturally before the parent queue stopped. Scene/camera/input advance at 60 Hz; GPU draws occur at batch ends, so their wall times are not a frame-budget certificate. Both use the same recorded observer version and verified harness sources; their report bytes and named distribution directory are retained in [the native probe archive](evidence/I5/i5-v9-native-breacher.json). No native game/bundle hash was recorded, so none is invented.

| Seed | Native outcome | Clears | Overdrives | Damage taken | Errors / defects | Matched Node outcome |
|---:|---|---:|---:|---:|---:|---|
| 1729 | Death in room 20 | 19/20 | 14 | 966.56 | 0 / 0 | complete |
| 2718 | Complete | 20/20 | 15 | 755.40 | 0 / 0 | complete |

Seed **1729** dies in the native finale although its matched Node campaign completes; zero errors/defects do not establish native/simulation outcome parity. Seed **2718** completes on both. A natural campaign death is a valid runner outcome, not a tooling failure or proof of successful completion.

The queue was stopped after the complete V9 simulation cohort failed cross-rig balance. The two active Breacher campaigns were allowed to finish; queued Cryo/Pyro/Arc jobs had not started. Unstarted jobs are not native evidence, deaths or censors. These two probes therefore do **not** meet the final requirement of two native campaigns per rig and are kept separate from the forty-run Node cohort.

V11 is complete and archived below. The persistent Pyro gap in V9/V10 remains visible; V11 does not supply final acceptance either.


## V11 — completed high late elite-frequency trial

The authoritative settings are the saved V11 source files beside its immutable bundle, not later working-tree trial values. V11 keeps the V6 family pool and ceiling **15** for late rooms, changes enemy-progression damage factors to **.56** at zero-based depths **10–18** and **.80** in finale depth **19**, and raises the late elite chance to **.60 + (zeroBasedDepth − 10) × .01**. That is **60–69%** across rooms 11–20. The late rule now also applies to non-first requests in the authored elite room 16, where its chance is **65%** instead of the previous **22%**; the first elite-room request remains guaranteed. Earlier ordinary and authored elite rules, Transmission, legacy progression, rig damage and **.0125 kill charging** remain unchanged.

V11 has **20 completes / 20 deaths / 0 censors**. Its pooled **50.0%** success rate passes the overall band, while Cryo at **80%** and Pyro at **30%** fail the rig-distance rule: **+30 / −20 percentage points** from the mean. No acceptance is claimed.

| Rig | Completed | Deviation from cohort mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---:|---:|---:|---:|---:|
| Breacher | 4/10 (40%) | -10.0 | 1.538 [1.250–1.600] | 34.48 | 65.50 |
| Cryo | 8/10 (80%) | +30.0 | 1.462 [1.429–1.538] | 36.27 | 67.88 |
| Pyro | 3/10 (30%) | -20.0 | 1.519 [1.250–1.700] | 31.07 | 58.43 |
| Arc | 5/10 (50%) | +0.0 | 1.462 [1.250–1.538] | 31.30 | 60.24 |

All four median Overdrive cadences are inside **1.2–1.7**. Pooled ordinary median is **33.12 s**, pooled Transmission **64.82 s**, and all first-five-room attempts clear (**200/200**). Pyro's ordinary median is now inside 30–45 seconds; its unchanged Transmission median remains **58.43 s**, below 60 seconds.

### V11 time and damage by act

Cells retain the same **median cleared-room seconds / median damage taken per attempted room** definitions and survivor-denominator caveats.

| Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---:|---:|---:|---:|
| Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 37.08 / 24.84 | 43.58 / 64.65 |
| Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 37.27 / 25.15 | 44.85 / 54.65 |
| Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 32.22 / 26.14 | 41.22 / 53.71 |
| Arc | 25.18 / 0.00 | 33.17 / 0.00 | 32.81 / 16.88 | 39.18 / 38.59 |
| **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **34.90 / 24.77** | **41.38 / 52.72** |

Pooled damage medians rise **0 → 19.84 → 24.77 → 52.72**. The per-rig table remains necessary: Arc's act-2 median is zero and its act-3/4 damage remains lower than the other rigs.

### V11 death room histogram

| Rig | Deaths by room |
|---|---|
| Breacher | 10×1, 17×1, 18×1, 20×3 |
| Cryo | 20×2 |
| Pyro | 15×1, 16×1, 18×2, 20×3 |
| Arc | 20×5 |
| **Pooled (20 deaths)** | **10×1, 15×1, 16×1, 17×1, 18×3, 20×13** |

The finale contains **13 of 20 deaths**; the remaining deaths are in rooms 10 and 15–18. There are no censored outcomes in this selected cohort.

### V11 outgoing damage shares

Values remain percent of each rig's pooled outgoing damage. These source totals do not isolate control, protection or rig-only causal damage.

| Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 62.15 | 22.31 | 5.79 | 9.75 | 37.85 |
| Cryo | 50.05 | 18.84 | 7.44 | 23.68 | 49.95 |
| Pyro | 47.81 | 16.76 | 17.74 | 17.69 | 52.19 |
| Arc | 59.73 | 27.59 | 6.26 | 6.42 | 40.27 |

V11 changes both late elite frequency and incoming enemy-progression damage relative to V9/V10. Its outcomes therefore do not isolate freeze resistance as a recovery counter or prove a particular rig effect caused the gap. The earlier Frost Armor observation still applies: **chilled kills**, rather than freeze alone, govern the three-armor recovery. The cohort improves neither the acceptance status nor the need for final native validation.

V12 is complete and archived below. Later working-tree settings are not used as V11 provenance.


## V12 — completed high-spitter late-pool trial

V12 changes only the late pool array relative to the frozen V11 director. From story zero-based depth **10**, including finale **19**, its ten tickets are **2 crawlers / 6 spitters / 2 stalkers**, replacing V11's **3 crawlers / 2 brutes / 3 spitters / 2 stalkers**. Random late Brute and Carrier tickets are absent, but forced first guardian requests remain exceptions: Warden **Brute**, Matron **Carrier**. Transmission (depth 9), earlier rooms, schedule and late cap **15** are unchanged.

The V11/V12 frozen progression and AbilitySystem files are byte-identical. V12 therefore retains **.56 ordinary late / .80 finale damage**, **.60 + (depth − 10) × .01** late elite chance including room 16, and the exact charge formula **damage / 12000 + kills × .0125**, with Drive Dynamo **×1.3**. No charge-rate change is inferred from later working-tree experiments.

The full cohort records **38 completes / 2 deaths / 0 censors**: Breacher/Cryo/Pyro/Arc rates **90/100/90/100%**, pooled **95.0%**. Rig deviations are only **−5/+5/−5/+5 points**, but this close spread is achieved well outside the requested 40–60% difficulty band. It is not accepted.

| Rig | Completed | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---:|---:|---:|---:|
| Breacher | 9/10 (90%) | 1.818182 [1.429–1.818] | 27.35 | 65.50 |
| Cryo | 10/10 (100%) | 1.818182 [1.538–1.818] | 29.22 | 67.88 |
| Pyro | 9/10 (90%) | 1.818182 [1.538–1.818] | 24.08 | 58.43 |
| Arc | 10/10 (100%) | 1.666667 [1.538–1.818] | 24.73 | 60.24 |

Median rooms/Overdrive is **1.818182** for **Breacher, Cryo and Pyro**, exceeding the **1.7** target ceiling in all three; **Arc 1.666667** remains inside the target. The pooled median is **1.818182**. All four ordinary-room medians are now below 30 seconds, with pooled median **26.27 s**. Pooled Transmission remains **64.82 s**, unchanged by the late-pool experiment. First-five-room attempts still clear **200/200**.

### V12 time and damage by act

Cells retain the same **median cleared-room seconds / median damage taken per attempted room** definition.

| Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---:|---:|---:|---:|
| Breacher | 27.44 / 0.00 | 38.33 / 25.12 | 24.38 / 15.57 | 31.87 / 26.72 |
| Cryo | 30.33 / 0.00 | 43.42 / 13.57 | 25.73 / 15.91 | 33.67 / 33.70 |
| Pyro | 23.68 / 0.00 | 33.28 / 27.66 | 21.98 / 16.75 | 28.43 / 24.00 |
| Arc | 25.18 / 0.00 | 33.17 / 0.00 | 23.46 / 7.17 | 28.19 / 19.47 |
| **Pooled** | **26.60 / 0.00** | **37.33 / 19.84** | **23.78 / 14.59** | **30.85 / 25.43** |

Pooled damage is **0 → 19.84 → 14.59 → 25.43**, falling in act 3 rather than establishing a rising depth curve. Late clear times also contract sharply. These statistics keep the encounter-pressure failure visible rather than treating the 95% completion result as success.

### V12 death room histogram

| Rig | Deaths by room |
|---|---|
| Breacher | 10×1 |
| Cryo | None |
| Pyro | 17×1 |
| Arc | None |
| **Pooled (2 deaths)** | **10×1, 17×1** |

There are **no finale deaths** in these forty selected campaigns. The two natural deaths are room 10 and room 17; neither is a tooling censor.

### V12 outgoing damage shares

Values remain percent of each rig's pooled outgoing damage, with the same causal-attribution caveats as the previous experiments.

| Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---:|---:|---:|---:|---:|
| Breacher | 63.42 | 20.16 | 5.03 | 11.40 | 36.58 |
| Cryo | 53.68 | 18.40 | 6.06 | 21.86 | 46.32 |
| Pyro | 47.81 | 16.58 | 17.76 | 17.85 | 52.19 |
| Arc | 59.34 | 28.38 | 5.47 | 6.80 | 40.66 |

With damage-based charge, changing enemy family health/armor and kill trajectories can change cadence even when the charging formula is identical. The faster clears and slower median Overdrives are consistent with replacing armored Brutes with lower-health Spitters. The policy also explicitly prioritizes visible Spitters. These are mechanistic explanations consistent with the cohort, not a measured decomposition of each family's control or damage contribution, and they do not establish how a human would experience the mix.

V13–V15 are complete and archived below. Later working-tree pool or charge values are not substituted for the V12 frozen source.


## V13 / V14 / V15 — completed charge and composition trials

These three forty-run cohorts use their saved four principal gameplay source files, recorded whole-game hash and immutable bundle as authority. Their frozen bundles **do not contain the later EnemySystem tempo-hook additions**; no later working-tree hook values are applied retroactively. The compiled EnemySystem section is byte-identical across V12–V15, SHA-256 `6aeeda3dfc6f52deb5cf53151ba9b0b9646261bb2465ec12e3391d4c2d12ac8a`, and each new archive records that section hash separately from original-source hashes. No V16/V17 report was read, polled or awaited for this archive.

V13 is the first archived trial to change the global Overdrive kill contribution **.0125 → .015**, while keeping the damage divisor **12000** and Drive Dynamo **×1.3**. The frozen V12→V13 AbilitySystem diff contains only that coefficient change; V13/V14/V15 AbilitySystem files are byte-identical. This is a real charge-number experiment, not a claim that changing damage factors alone corrected cadence.

All three retain late ceiling **15**, elite chance **.60 + (depth − 10) × .01** including authored elite room 16, fixed spawn schedules, .18/.05 progression pressure, guardian exceptions, and unchanged catalog health/damage values. The varying late parameters are:

| Trial | Ordinary late damage factor (depths 10–18) | Finale factor (depth 19) | Late pool tickets: crawler / brute / spitter / stalker | Kill charge |
|---|---:|---:|---|---:|
| V13 | .80 | 1.05 | 2 / 0 / 6 / 2 | .015 |
| V14 | 1.05 | 1.35 | 2 / 0 / 6 / 2 | .015 |
| V15 | .80 | 1.05 | 2 / 1 / 4 / 3 | .015 |

Random Carrier tickets remain absent; forced Warden/Matron requests still use Brute/Carrier. Transmission's requests, mix and scheduling stay unchanged. Its observed time distribution differs from V12 because the global charge change also affects earlier rooms; the additional progression damage and pool changes start only at depth 10.

| Experiment | Rig | Completed | Deviation from cohort mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|---:|
| V13 | Breacher | 9/10 (90%) | +0.0 | 1.625000 [1.333–1.667] | 28.07 | 67.58 |
| V13 | Cryo | 10/10 (100%) | +10.0 | 1.666667 [1.429–1.667] | 29.03 | 68.59 |
| V13 | Pyro | 7/10 (70%) | -20.0 | 1.666667 [1.333–1.667] | 24.28 | 62.76 |
| V13 | Arc | 10/10 (100%) | +10.0 | 1.666667 [1.429–1.667] | 24.62 | 59.33 |
| V14 | Breacher | 7/10 (70%) | -12.5 | 1.625000 [1.357–1.667] | 27.65 | 67.58 |
| V14 | Cryo | 10/10 (100%) | +17.5 | 1.666667 [1.429–1.667] | 29.09 | 68.59 |
| V14 | Pyro | 8/10 (80%) | -2.5 | 1.666667 [1.333–1.714] | 24.28 | 62.76 |
| V14 | Arc | 8/10 (80%) | -2.5 | 1.666667 [1.429–1.700] | 24.43 | 59.33 |
| V15 | Breacher | 5/10 (50%) | +2.5 | 1.519231 [1.176–1.700] | 31.57 | 67.58 |
| V15 | Cryo | 7/10 (70%) | +22.5 | 1.538462 [1.250–1.583] | 33.66 | 68.59 |
| V15 | Pyro | 1/10 (10%) | -37.5 | 1.572727 [1.267–1.700] | 27.59 | 62.76 |
| V15 | Arc | 6/10 (60%) | +12.5 | 1.445055 [1.250–1.583] | 27.82 | 59.33 |

V13 completes **36/40 (90.0%)**, with Breacher/Cryo/Pyro/Arc **90/100/70/100%**. V14 completes **33/40 (82.5%)**, rates **70/100/80/80%**. Both miss the overall difficulty band and have every rig's ordinary median below 30 seconds. V13 also places Pyro **20 points below** its mean; V14 places Cryo **17.5 points above**. Neither is accepted.

V15 completes **19/40 (47.5%)**, rates **50/70/10/60%**. Pooled completion and ordinary time (**30.61 s**) fall inside their target bands, but Pyro is **37.5 points below** and Cryo **22.5 points above** the cohort mean. Pyro/Arc ordinary medians remain below 30 seconds. V15 therefore fails cross-rig acceptance despite a suitable pooled average.

All twelve per-rig median Overdrive cadences are within **1.2–1.7**. Pooled cadence is **1.666667 / 1.666667 / 1.538462** for V13/V14/V15. Pooled ordinary medians are **26.30 / 26.25 / 30.61 s**, and pooled Transmission is **64.02 s** in all three. Arc's Transmission median is **59.33 s**, slightly below 60 seconds. All first-five-room attempts clear **200/200 per cohort**. There are **zero censored outcomes** in all three selections.

### V13–V15 time and damage by act

Each cell retains **median cleared-room seconds / median damage taken per attempted room**; late-act survivor counts and distributions remain in the compact JSONs.

| Experiment | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| V13 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 25.40 / 22.79 | 31.45 / 43.03 |
| V13 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 25.43 / 29.11 | 32.54 / 46.72 |
| V13 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 21.68 / 23.67 | 27.27 / 46.72 |
| V13 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 21.56 / 10.33 | 28.12 / 25.36 |
| V13 | **Pooled** | **26.26 / 0.00** | **37.08 / 18.95** | **23.46 / 22.11** | **29.17 / 37.89** |
| V14 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 25.16 / 34.11 | 29.67 / 47.59 |
| V14 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 25.99 / 41.65 | 33.60 / 43.05 |
| V14 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 22.30 / 30.10 | 28.73 / 32.30 |
| V14 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 21.56 / 13.56 | 28.42 / 32.65 |
| V14 | **Pooled** | **26.26 / 0.00** | **37.08 / 18.95** | **23.85 / 29.02** | **29.52 / 37.39** |
| V15 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 32.18 / 42.68 | 38.17 / 52.05 |
| V15 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 32.37 / 37.43 | 37.82 / 75.37 |
| V15 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 28.24 / 26.53 | 35.23 / 74.99 |
| V15 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 27.12 / 11.28 | 35.55 / 40.22 |
| V15 | **Pooled** | **26.26 / 0.00** | **37.08 / 18.95** | **30.42 / 31.68** | **36.47 / 56.42** |

Pooled damage medians are **0 → 18.95 → 22.11 → 37.89** (V13), **0 → 18.95 → 29.02 → 37.39** (V14), and **0 → 18.95 → 31.68 → 56.42** (V15). Rising pooled depth damage does not eliminate the rig success gap or the short ordinary fights in the high-spitter trials.

### V13–V15 death room histograms

| Experiment | Rig | Deaths by room |
|---|---|---|
| V13 | Breacher | 20×1 |
| V13 | Cryo | None |
| V13 | Pyro | 16×1, 20×2 |
| V13 | Arc | None |
| V13 | **Pooled (4 deaths)** | **16×1, 20×3** |
| V14 | Breacher | 17×1, 20×2 |
| V14 | Cryo | None |
| V14 | Pyro | 13×1, 17×1 |
| V14 | Arc | 18×2 |
| V14 | **Pooled (7 deaths)** | **13×1, 17×2, 18×2, 20×2** |
| V15 | Breacher | 13×1, 16×2, 17×1, 18×1 |
| V15 | Cryo | 20×3 |
| V15 | Pyro | 14×1, 16×1, 17×2, 18×3, 20×2 |
| V15 | Arc | 18×2, 20×2 |
| V15 | **Pooled (21 deaths)** | **13×1, 14×1, 16×3, 17×3, 18×6, 20×7** |

V13 has **4** natural deaths (rooms 16 and 20); V14 **7** (rooms 13, 17, 18 and 20); V15 **21** (rooms 13, 14, 16, 17, 18 and 20). These are complete outcome distributions, with no navigation censors or interrupted attempts hidden in them.

### V13–V15 outgoing damage shares

Values are percentages of each rig's pooled outgoing damage and retain all earlier source-attribution caveats.

| Experiment | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| V13 | Breacher | 62.51 | 20.68 | 5.45 | 11.36 | 37.49 |
| V13 | Cryo | 53.16 | 18.77 | 6.30 | 21.77 | 46.84 |
| V13 | Pyro | 47.75 | 16.52 | 17.55 | 18.18 | 52.25 |
| V13 | Arc | 58.87 | 28.62 | 5.44 | 7.07 | 41.13 |
| V14 | Breacher | 62.51 | 20.97 | 5.27 | 11.25 | 37.49 |
| V14 | Cryo | 52.73 | 19.58 | 6.37 | 21.31 | 47.27 |
| V14 | Pyro | 48.03 | 16.65 | 17.74 | 17.58 | 51.97 |
| V14 | Arc | 59.12 | 28.65 | 5.36 | 6.87 | 40.88 |
| V15 | Breacher | 64.06 | 21.60 | 4.82 | 9.52 | 35.94 |
| V15 | Cryo | 51.17 | 18.50 | 7.23 | 23.10 | 48.83 |
| V15 | Pyro | 49.89 | 16.93 | 18.30 | 14.88 | 50.11 |
| V15 | Arc | 60.49 | 27.56 | 5.51 | 6.44 | 39.51 |

The V13→V15 comparison keeps charging and progression damage fixed while replacing two Spitter tickets with one Brute and one Stalker. The large success-rate change demonstrates sensitivity of this policy to family mix. It does not identify the separate contributions of armor, stealth/flanking, status resistance, control, target priority or resource timing. Likewise V13→V14 raises damage without lengthening health bars, yet does not uniformly reduce every rig's success rate: Pyro rises from 70% to 80% on these ten seeds. Those coupled deterministic trajectories remain evidence for this policy and sample, not a human-feel judgment or isolated rig counterfactual.

V16/V17 tuning trials are archived below; later and reserved selections remain excluded from this section. No later tempo-hook, pool or damage setting is used as provenance for V13–V15, and none of these three cohorts is accepted.


## V16 / V17 — completed ordinary elite charge-tempo trials

These are the original **tuning** selections of forty reports each, using the same ten seeds per rig and frozen `i5-navigation-observer-v3` policy. The separately labeled V17 reserved cohort and V18 are excluded: neither was read, polled or awaited for this archive. Both tuning selections have **zero censored outcomes**. Neither is accepted.

Each snapshot now saves **five principal gameplay files**, adding `src/game/enemies/EnemySystem.ts` to DepthGame, AbilitySystem, progression and EncounterDirector. The archives hash all twelve frozen source files and all forty original reports per cohort; the immutable bundle hash matches every report, and the combined frozen policy hash was independently recomputed. The recorded whole-game source hash is preserved separately: the five copied gameplay files alone do not reproduce that full dependency-tree hash.

Both retain V15’s late pool **2 Crawler / 1 Brute / 4 Spitter / 3 Stalker**, cap **15**, ordinary/finale late damage factors **.80 / 1.05**, elite chance **.60 + (depth − 10) × .01** including room 16, damage/speed pressure **.18 / .05**, elite health **1.08**, and Overdrive **damage / 12000 + kills × .015**, Drive Dynamo **×1.3**. Transmission stays **32 at 750 ms** with its existing mix; finale remains **48 at 900 ms**. Basic enemy health, rig numbers and save schema do not change.

V16 changes ordinary late elite damage **1.05 → 1.20** and introduces ordinary elite Brute charge windup **850 → 1150 ms** and repeat cooldown **4600 → 6500 ms**, initially retaining **1500 ms** before its first charge. V17 changes only that ordinary elite initial delay **1500 → 5000 ms** (plus its typed option and explicit Warden promotion reset). Authored Wardens retain **850 ms windup / 4600 ms repeat / 1500 ms initial** and their promoted contact damage. The V16/V17 frozen DepthGame, AbilitySystem and director files are byte-identical; their progression/EnemySystem diff contains the initial-delay control and Warden preservation above.

| Trial | HEAD | Game source hash | Immutable bundle hash | EnemySystem source SHA-256 |
|---|---|---|---|---|
| V16 | `b839492dfdff576485970ba65ee06340fff4609b` | `190814dcbbbf16adaba251506709c56e09115ee4cb99e3340e437c33a169c4d7` | `55f791035a4c102ecc0f851612997725cb9e3c54b29c50bed1e092747918fa50` | `15d17738bc5e2f81e36852c3669693860220cacbc7bb53a40424ff1f935c2016` |
| V17 | `b602a77a0dc45406199f8d9d3bba82fc7d31ebc2` | `73587ac732ff156d7c6cc05ac960c69162432a429fb42e15150f3125c362cb8d` | `afb834106005b8c9725fbb1a0ad1867a30de783fe09e0a471123bdddb337e4a0` | `21186a5c5593b9ed0b431195119fc8de87ee076ef973a78072a19138f78eaffd` |

| Trial | Rig | Completed | Deviation from mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|---:|
| V16 | Breacher | 3/10 (30%) | -2.5 | 1.541958 [1.188–1.667] | 30.67 | 67.58 |
| V16 | Cryo | 4/10 (40%) | +7.5 | 1.538462 [1.333–1.667] | 34.04 | 68.59 |
| V16 | Pyro | 1/10 (10%) | -22.5 | 1.591667 [1.250–1.750] | 28.30 | 62.76 |
| V16 | Arc | 5/10 (50%) | +17.5 | 1.500000 [1.250–1.600] | 28.20 | 59.33 |
| V17 | Breacher | 3/10 (30%) | -12.5 | 1.522727 [1.333–1.750] | 30.70 | 67.58 |
| V17 | Cryo | 7/10 (70%) | +27.5 | 1.538462 [1.267–1.667] | 33.92 | 68.59 |
| V17 | Pyro | 2/10 (20%) | -22.5 | 1.572727 [1.364–1.700] | 28.50 | 62.76 |
| V17 | Arc | 5/10 (50%) | +7.5 | 1.461538 [1.250–1.667] | 28.32 | 59.33 |

V16 completes **13/40 (32.5%)**, with **27 deaths / 0 censors**. Its pooled ordinary median is **30.28 s**, Transmission **64.02 s**, and median rooms/Overdrive **1.538462**. Pooled completion misses the target band; the rig-distance target fails.

V17 completes **17/40 (42.5%)**, with **23 deaths / 0 censors**. Its pooled ordinary median is **30.47 s**, Transmission **64.02 s**, and median rooms/Overdrive **1.538462**. Pooled completion reaches the target band; the rig-distance target fails.

All eight per-rig median Overdrive cadences remain inside **1.2–1.7**. Both cohorts clear **200/200 first-five-room attempts**. Pyro and Arc ordinary medians remain below **30 s**, and Arc’s Transmission median remains below **60 s**. Pooled act damage rises **0 → 18.95 → 27.99 → 68.40** (V16) and **0 → 18.95 → 36.05 → 55.82** (V17), without resolving the completion-rate gap.

### V16–V17 time and damage by act

Cells retain **median cleared-room seconds / median damage taken per attempted room**, including holdouts in act times. Survivor denominators and depth percentiles remain in each compact JSON.

| Trial | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| V16 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 30.37 / 34.84 | 35.16 / 73.78 |
| V16 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 32.15 / 34.60 | 36.52 / 106.43 |
| V16 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 29.03 / 38.82 | 32.08 / 70.62 |
| V16 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 28.30 / 12.72 | 35.42 / 39.97 |
| V16 | Pooled | 26.26 / 0.00 | 37.08 / 18.95 | 30.07 / 27.99 | 35.64 / 68.40 |
| V17 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 30.87 / 44.28 | 35.93 / 42.41 |
| V17 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 31.94 / 53.79 | 41.35 / 86.76 |
| V17 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 29.42 / 37.43 | 33.87 / 54.07 |
| V17 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 27.57 / 12.43 | 36.92 / 42.34 |
| V17 | Pooled | 26.26 / 0.00 | 37.08 / 18.95 | 30.02 / 36.05 | 37.33 / 55.82 |

### V16–V17 death room histograms

| Trial | Rig | Deaths by room |
|---|---|---|
| V16 | Breacher | 11×1, 14×1, 16×1, 18×1, 19×1, 20×2 |
| V16 | Cryo | 15×1, 16×1, 19×1, 20×3 |
| V16 | Pyro | 14×1, 15×1, 16×1, 17×1, 18×2, 19×1, 20×2 |
| V16 | Arc | 17×1, 18×1, 20×3 |
| V16 | **Pooled (27 deaths)** | **11×1, 14×2, 15×2, 16×3, 17×2, 18×4, 19×3, 20×10** |
| V17 | Breacher | 12×1, 14×1, 15×1, 16×1, 17×1, 18×1, 20×1 |
| V17 | Cryo | 16×1, 18×1, 20×1 |
| V17 | Pyro | 13×1, 14×1, 16×2, 17×1, 18×2, 19×1 |
| V17 | Arc | 17×2, 20×3 |
| V17 | **Pooled (23 deaths)** | **12×1, 13×1, 14×2, 15×1, 16×4, 17×4, 18×4, 19×1, 20×5** |

### V16–V17 outgoing damage shares

Values are percentages of pooled outgoing damage; these campaign buckets do not isolate all control or rig-attributable status/proc value.

| Trial | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| V16 | Breacher | 63.23 | 21.51 | 5.27 | 9.99 | 36.77 |
| V16 | Cryo | 51.86 | 18.54 | 7.01 | 22.59 | 48.14 |
| V16 | Pyro | 48.79 | 16.97 | 18.22 | 16.02 | 51.21 |
| V16 | Arc | 60.95 | 27.26 | 5.35 | 6.45 | 39.05 |
| V17 | Breacher | 64.32 | 21.03 | 4.92 | 9.73 | 35.68 |
| V17 | Cryo | 52.74 | 18.34 | 6.31 | 22.61 | 47.26 |
| V17 | Pyro | 50.57 | 16.45 | 18.33 | 14.65 | 49.43 |
| V17 | Arc | 60.22 | 27.59 | 5.46 | 6.73 | 39.78 |

Extending the initial charge delay changes coupled encounter trajectories; these ten-seed samples do not identify an isolated causal contribution to completion. The unchanged policy still gives distant Spitters target priority and uses generic kiting for every rig, so family composition and aimed-cone effectiveness remain possible policy interactions rather than proven simulation defects. Both trials retain their complete outcome distributions without claiming human difficulty or final native-browser acceptance.


## V17 reserved evaluation and V18 composition trial

The predeclared unseen seeds **1000–1009** supply ten additional V17 attempts per rig. Before combining them with the ten tuning seeds, all **twelve copied source files** were checked byte-for-byte by SHA-256 against V17 tuning; all reserved reports also match the same **HEAD, game hash, policy hash and immutable bundle hash**. This permits an explicitly labeled **80-run V17 aggregate, twenty runs per rig**, while keeping the unseen evaluation separate. No V19/V20 selection was read, polled or awaited.

V18 changes only the late pool from V17’s **2 Crawler / 1 Brute / 4 Spitter / 3 Stalker** to **3 Crawler / 1 Brute / 4 Spitter / 2 Stalker**. Its frozen DepthGame, AbilitySystem, progression and EnemySystem files are byte-identical to V17; the director changes the single pool ticket. All V17 damage factors, elite frequency, charge tempo, cap, Overdrive numbers, guardian exceptions and Transmission settings remain as archived above.

| Selection | Game source hash | Immutable bundle hash |
|---|---|---|
| i5-v17-reserved-40 | `73587ac732ff156d7c6cc05ac960c69162432a429fb42e15150f3125c362cb8d` | `afb834106005b8c9725fbb1a0ad1867a30de783fe09e0a471123bdddb337e4a0` |
| i5-final-policy-v18-40 | `15deae05afcc3b943d7538cf87c7d463a6facca58a015ef2aa06f0e870c45966` | `caf9faef2fd2b623625808969c98e66725d4604c14fc63cc4b1b62696580f29d` |

| Selection | Rig | Completed | Deviation from mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|---:|
| i5-v17-reserved-40 | Breacher | 2/10 (20%) | -20.0 | 1.519231 [1.286–1.700] | 29.74 | 65.36 |
| i5-v17-reserved-40 | Cryo | 6/10 (60%) | +20.0 | 1.500000 [1.429–1.583] | 33.83 | 70.50 |
| i5-v17-reserved-40 | Pyro | 1/10 (10%) | -30.0 | 1.480769 [1.417–1.800] | 28.20 | 56.83 |
| i5-v17-reserved-40 | Arc | 7/10 (70%) | +30.0 | 1.500000 [1.429–1.538] | 28.54 | 57.18 |
| i5-v17-combined-80 | Breacher | 5/20 (25%) | -16.3 | 1.519231 [1.333–1.714] | 30.35 | 66.53 |
| i5-v17-combined-80 | Cryo | 13/20 (65%) | +23.8 | 1.538462 [1.429–1.636] | 33.83 | 69.56 |
| i5-v17-combined-80 | Pyro | 3/20 (15%) | -26.3 | 1.541958 [1.385–1.800] | 28.48 | 61.07 |
| i5-v17-combined-80 | Arc | 12/20 (60%) | +18.8 | 1.461538 [1.333–1.600] | 28.45 | 58.53 |
| i5-final-policy-v18-40 | Breacher | 3/10 (30%) | -10.0 | 1.519231 [1.267–1.833] | 31.20 | 67.58 |
| i5-final-policy-v18-40 | Cryo | 8/10 (80%) | +40.0 | 1.538462 [1.462–1.538] | 33.30 | 68.59 |
| i5-final-policy-v18-40 | Pyro | 2/10 (20%) | -20.0 | 1.583333 [1.417–1.667] | 27.58 | 62.76 |
| i5-final-policy-v18-40 | Arc | 3/10 (30%) | -10.0 | 1.461538 [1.333–1.583] | 27.20 | 59.33 |

**i5-v17-reserved-40**: **16/40 (40.0%)** complete, **24 deaths / 0 censors**. Pooled ordinary time **30.09 s**, Transmission **63.23 s**, median rooms/Overdrive **1.500000**. The rig-distance target fails.

**i5-v17-combined-80**: **33/80 (41.25%)** complete, **47 deaths / 0 censors**. Pooled ordinary time **30.25 s**, Transmission **63.48 s**, median rooms/Overdrive **1.538462**. The rig-distance target fails.

**i5-final-policy-v18-40**: **16/40 (40.0%)** complete, **24 deaths / 0 censors**. Pooled ordinary time **29.83 s**, Transmission **64.02 s**, median rooms/Overdrive **1.538462**. The rig-distance target fails.

All twelve per-rig median Overdrive cadences remain within **1.2–1.7**. First-five-room clears are **200/200** for reserved V17, **400/400** combined V17 and **200/200** V18. The V18 pooled ordinary median **29.833333 s** is slightly below the **30 s** floor; Pyro and Arc remain below that floor individually. These misses remain separate from the completion and rig-spread failures.

### Reserved V17, combined V17 and V18 time/damage by act

Cells are **median cleared-room seconds / median damage per attempted room**, retaining holdouts and survivor denominators in the JSONs.

| Selection | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| i5-v17-reserved-40 | Breacher | 28.43 / 0.00 | 36.96 / 20.90 | 29.56 / 27.34 | 33.57 / 50.60 |
| i5-v17-reserved-40 | Cryo | 32.40 / 0.00 | 40.56 / 13.70 | 32.22 / 37.46 | 39.48 / 88.08 |
| i5-v17-reserved-40 | Pyro | 23.29 / 0.00 | 31.85 / 19.14 | 27.80 / 34.84 | 35.67 / 85.46 |
| i5-v17-reserved-40 | Arc | 26.91 / 0.00 | 31.38 / 5.27 | 27.29 / 12.32 | 31.95 / 29.74 |
| i5-v17-reserved-40 | Pooled | 27.88 / 0.00 | 34.42 / 13.83 | 29.38 / 25.74 | 35.76 / 59.48 |
| i5-v17-combined-80 | Breacher | 28.00 / 0.00 | 37.83 / 24.58 | 30.03 / 38.82 | 34.87 / 49.68 |
| i5-v17-combined-80 | Cryo | 31.14 / 0.00 | 40.98 / 13.83 | 32.01 / 41.90 | 40.24 / 88.08 |
| i5-v17-combined-80 | Pyro | 23.29 / 0.00 | 33.05 / 19.62 | 29.02 / 35.11 | 35.67 / 64.12 |
| i5-v17-combined-80 | Arc | 25.23 / 0.00 | 32.75 / 11.31 | 27.38 / 12.43 | 36.55 / 36.15 |
| i5-v17-combined-80 | Pooled | 26.86 / 0.00 | 35.75 / 18.95 | 29.73 / 30.58 | 36.72 / 57.26 |
| i5-final-policy-v18-40 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 31.48 / 39.91 | 34.28 / 79.62 |
| i5-final-policy-v18-40 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 31.81 / 42.08 | 38.08 / 67.34 |
| i5-final-policy-v18-40 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 28.19 / 40.20 | 32.43 / 63.35 |
| i5-final-policy-v18-40 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 26.91 / 5.74 | 34.10 / 38.85 |
| i5-final-policy-v18-40 | Pooled | 26.26 / 0.00 | 37.08 / 18.95 | 29.26 / 32.19 | 34.73 / 58.98 |

### Reserved V17, combined V17 and V18 death histograms

| Selection | Rig | Deaths by room |
|---|---|---|
| i5-v17-reserved-40 | Breacher | 13×1, 15×1, 16×2, 17×1, 18×1, 19×1, 20×1 |
| i5-v17-reserved-40 | Cryo | 19×1, 20×3 |
| i5-v17-reserved-40 | Pyro | 10×1, 15×1, 16×2, 18×2, 19×1, 20×2 |
| i5-v17-reserved-40 | Arc | 20×3 |
| i5-v17-reserved-40 | **Pooled (24 deaths)** | **10×1, 13×1, 15×2, 16×4, 17×1, 18×3, 19×3, 20×9** |
| i5-v17-combined-80 | Breacher | 12×1, 13×1, 14×1, 15×2, 16×3, 17×2, 18×2, 19×1, 20×2 |
| i5-v17-combined-80 | Cryo | 16×1, 18×1, 19×1, 20×4 |
| i5-v17-combined-80 | Pyro | 10×1, 13×1, 14×1, 15×1, 16×4, 17×1, 18×4, 19×2, 20×2 |
| i5-v17-combined-80 | Arc | 17×2, 20×6 |
| i5-v17-combined-80 | **Pooled (47 deaths)** | **10×1, 12×1, 13×2, 14×2, 15×3, 16×8, 17×5, 18×7, 19×4, 20×14** |
| i5-final-policy-v18-40 | Breacher | 12×1, 16×2, 19×1, 20×3 |
| i5-final-policy-v18-40 | Cryo | 19×1, 20×1 |
| i5-final-policy-v18-40 | Pyro | 14×1, 16×3, 18×1, 19×1, 20×2 |
| i5-final-policy-v18-40 | Arc | 16×1, 18×1, 20×5 |
| i5-final-policy-v18-40 | **Pooled (24 deaths)** | **12×1, 14×1, 16×6, 18×2, 19×3, 20×11** |

### Reserved V17, combined V17 and V18 outgoing shares

Values are percentages of pooled outgoing damage, with the same attribution limits as prior experiments.

| Selection | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| i5-v17-reserved-40 | Breacher | 65.64 | 21.93 | 2.79 | 9.63 | 34.36 |
| i5-v17-reserved-40 | Cryo | 49.50 | 18.95 | 7.11 | 24.45 | 50.50 |
| i5-v17-reserved-40 | Pyro | 49.61 | 16.28 | 20.39 | 13.72 | 50.39 |
| i5-v17-reserved-40 | Arc | 61.94 | 27.67 | 2.73 | 7.66 | 38.06 |
| i5-v17-combined-80 | Breacher | 64.98 | 21.48 | 3.86 | 9.68 | 35.02 |
| i5-v17-combined-80 | Cryo | 51.09 | 18.65 | 6.72 | 23.54 | 48.91 |
| i5-v17-combined-80 | Pyro | 50.09 | 16.37 | 19.36 | 14.18 | 49.91 |
| i5-v17-combined-80 | Arc | 61.11 | 27.63 | 4.05 | 7.21 | 38.89 |
| i5-final-policy-v18-40 | Breacher | 63.95 | 20.77 | 5.37 | 9.91 | 36.05 |
| i5-final-policy-v18-40 | Cryo | 52.80 | 18.65 | 6.38 | 22.17 | 47.20 |
| i5-final-policy-v18-40 | Pyro | 49.73 | 16.86 | 17.71 | 15.71 | 50.27 |
| i5-final-policy-v18-40 | Arc | 60.60 | 27.57 | 5.37 | 6.46 | 39.40 |

The unseen evaluation does not remove the Pyro gap: V17 tuning Pyro **20%** becomes **10%** on the reserved seeds and **15%** combined. The single-family-ticket change in V18 also fails cross-rig acceptance. Neither the pooled completion average nor more observations overrides that result.

### V18 native Pyro calibration

These are two unassisted native keyboard/mouse campaigns with presentation enabled and the real scene/camera updated every fixed tick; fast mode omits intermediate raw GPU submissions. Harness files and combined policy hash were independently verified from both saved source directories. Raw report hashes, complete error/defect arrays, loading receipts, inferred death-source receipts and every common-cleared-room comparison are retained in [the native archive](evidence/I5/i5-v18-native-pyro.json). Native reports record their selected `v18-dist` directory, not a simulation game/bundle hash; this is explicitly preserved as a provenance limit.

| Seed | Native outcome | Node outcome | Common clears | Native / Node common seconds | Native / Node common damage taken | Room time delta range (native − Node) | Room damage delta range |
|---|---|---|---:|---:|---:|---:|---:|
| 1729 | Dead room 18, 17 clears | Complete,20 clears | 17 | 516.65 / 520.00 | 391.68 / 506.11 | -5.33 to 7.17 s | -70.87 to 23.27 |
| 2718 | Dead room 14, 13 clears | Dead room 14, 13 clears | 13 | 354.42 / 354.82 | 269.56 / 259.66 | -4.97 to 3.93 s | 0.00 to 9.91 |

Seed **1729** has **0 errors / 0 defects**, **8 loading receipts** (maximum **1921.03 ms**); **5/17** common room times and **9/17** common room damage totals match within 1e−6. Native/Node room-time ratios range **0.838–1.226**.

Seed **2718** has **0 errors / 0 defects**, **8 loading receipts** (maximum **979.34 ms**); **10/13** common room times and **12/13** common room damage totals match within 1e−6. Native/Node room-time ratios range **0.880–1.229**.

The seed-1729 outcome disagreement is material: Node completion does not predict native completion here. Seed 2718 agrees on death room, but this does not establish identical inputs or trajectories. These pairs provide approximate native-policy calibration and preserve a clear limit on using Node completion rates as browser predictions; they do not establish final native acceptance or attribute the remaining difference specifically to Pyro damage logic. No gameplay, policy, rig controls or tests were changed for this archive.


## V19 / V20 / V21 — completed champion and late-encounter trials

All three frozen forty-run tuning selections retain the original ten seeds per rig, identical navigation-v3 policy, V18 mixed late pool **3 Crawler / 1 Brute / 4 Spitter / 2 Stalker**, high late elite frequency **.60 + (depth − 10) × .01**, cap **15**, ordinary elite Brute charge **1150 ms windup / 6500 ms repeat / 5000 ms initial**, and Overdrive **damage / 12000 + kills × .015** with Dynamo **×1.3**. Their original report metadata lacks a tuning flag; no production profile is inferred from the later working tree. Saved sources and bundles are authority.

V19 changes V18 late ordinary/finale damage normalization **.80 / 1.05 → .60 / .90**, then scales champion health **×1.2 / ×1.4** and contact damage **×1.3 / ×1.6** for zero-based depth **10–14 / 15–19**. These affect late Wardens and the Matron, while early guardians and champion armor remain unchanged. V20 keeps ordinary enemy parameters and changes those champion factors to health **×1.35 / ×1.55**, damage **×1.5 / ×1.85**.

V21 replaces the two late Warden encounters (zero-based depths **12/18**, rooms **13/19**) with **9 requests: first Warden + 8 Crawlers**, retaining the late elite draw for those Crawler requests. It adds **2 requests** to other late non-holdouts. Warden health factors become **×1.5 / ×1.8**, damage **×1.1 / ×1.25**; Matron factors return to **×1 / ×1**. Transmission and finale request schedules, basic enemy health and rig numbers remain unchanged across these trials.

| Trial | HEAD | Game source hash | Immutable bundle hash |
|---|---|---|---|
| i5-final-policy-v19-40 | `80e893eb471a93e5c0a5fe9f9aa288a2f779a980` | `5a7cc56bcb761f2a22ba31693354777eae2fe335d1e1f76ba14a3495ca9ece8f` | `bfc8e80e6300ac0e24e48e32a0d7c3cee2230f55883c19f1eec1d6f7bb5bf5be` |
| i5-final-policy-v20-40 | `80e893eb471a93e5c0a5fe9f9aa288a2f779a980` | `f903d05535f00028ddec622a90dea3fc478afb70b689644ed4dcb28d90c0d449` | `181f1dc6920328494179768d597538d0fb9ec4ba7dc2193ff964f2df8f0d7b67` |
| i5-final-policy-v21-40 | `80e893eb471a93e5c0a5fe9f9aa288a2f779a980` | `3bf824555750cff30f34e6f5823f2bf7dde782fd3b1e3c4182117ab916b52e1d` | `a1886f11456b0cac4c8602c4b291e5f3142b0a7af550ef289387a91c9b3e8b33` |

| Selection | Rig | Completed | Deviation from mean (points) | Rooms / Overdrive [p10–p90] | Ordinary median seconds | Transmission median seconds |
|---|---|---:|---:|---:|---:|---:|
| i5-final-policy-v19-40 | Breacher | 9/10 (90%) | +10.0 | 1.538462 [1.333–1.538] | 31.20 | 67.58 |
| i5-final-policy-v19-40 | Cryo | 9/10 (90%) | +10.0 | 1.538462 [1.357–1.538] | 33.78 | 68.59 |
| i5-final-policy-v19-40 | Pyro | 4/10 (40%) | -40.0 | 1.500000 [1.250–1.600] | 28.28 | 62.76 |
| i5-final-policy-v19-40 | Arc | 10/10 (100%) | +20.0 | 1.483516 [1.250–1.538] | 27.09 | 59.33 |
| i5-final-policy-v20-40 | Breacher | 7/10 (70%) | +2.5 | 1.445055 [1.250–1.538] | 31.27 | 67.58 |
| i5-final-policy-v20-40 | Cryo | 8/10 (80%) | +12.5 | 1.538462 [1.357–1.538] | 33.13 | 68.59 |
| i5-final-policy-v20-40 | Pyro | 3/10 (30%) | -37.5 | 1.461538 [1.188–1.583] | 28.04 | 62.76 |
| i5-final-policy-v20-40 | Arc | 9/10 (90%) | +22.5 | 1.445055 [1.250–1.538] | 27.37 | 59.33 |
| i5-final-policy-v21-40 | Breacher | 6/10 (60%) | -10.0 | 1.538462 [1.267–1.667] | 29.77 | 67.58 |
| i5-final-policy-v21-40 | Cryo | 8/10 (80%) | +10.0 | 1.538462 [1.429–1.667] | 32.69 | 68.59 |
| i5-final-policy-v21-40 | Pyro | 4/10 (40%) | -30.0 | 1.560897 [1.333–1.583] | 27.60 | 62.76 |
| i5-final-policy-v21-40 | Arc | 10/10 (100%) | +30.0 | 1.538462 [1.333–1.538] | 26.67 | 59.33 |

**i5-final-policy-v19-40**: **32/40 (80.0%)** complete, **8 deaths / 0 censors**; ordinary median **30.17 s**, Transmission **64.02 s**, median rooms/Overdrive **1.538462**. Neither pooled/cross-rig acceptance nor native confirmation is established.

**i5-final-policy-v20-40**: **27/40 (67.5%)** complete, **13 deaths / 0 censors**; ordinary median **30.00 s**, Transmission **64.02 s**, median rooms/Overdrive **1.461538**. Neither pooled/cross-rig acceptance nor native confirmation is established.

**i5-final-policy-v21-40**: **28/40 (70.0%)** complete, **12 deaths / 0 censors**; ordinary median **29.14 s**, Transmission **64.02 s**, median rooms/Overdrive **1.538462**. Neither pooled/cross-rig acceptance nor native confirmation is established.

Time/damage cells are **median cleared-room seconds / median damage per attempted room**, retaining holdouts in acts and survivor denominators in the JSONs.

| Selection | Rig | Act 1 | Act 2 | Act 3 | Act 4 |
|---|---|---:|---:|---:|---:|
| i5-final-policy-v19-40 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 31.40 / 23.06 | 36.30 / 68.51 |
| i5-final-policy-v19-40 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 32.64 / 24.19 | 39.33 / 53.36 |
| i5-final-policy-v19-40 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 28.50 / 30.43 | 35.88 / 60.94 |
| i5-final-policy-v19-40 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 27.21 / 0.00 | 35.49 / 29.81 |
| i5-final-policy-v19-40 | Pooled | 26.26 / 0.00 | 37.08 / 18.95 | 29.88 / 18.19 | 37.75 / 45.24 |
| i5-final-policy-v20-40 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 31.35 / 24.01 | 40.58 / 52.82 |
| i5-final-policy-v20-40 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 31.49 / 23.27 | 36.47 / 54.02 |
| i5-final-policy-v20-40 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 28.10 / 24.18 | 33.95 / 52.06 |
| i5-final-policy-v20-40 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 27.20 / 0.00 | 35.82 / 29.84 |
| i5-final-policy-v20-40 | Pooled | 26.26 / 0.00 | 37.08 / 18.95 | 29.97 / 17.85 | 35.82 / 46.01 |
| i5-final-policy-v21-40 | Breacher | 27.18 / 0.00 | 37.88 / 24.88 | 29.13 / 23.06 | 33.34 / 37.23 |
| i5-final-policy-v21-40 | Cryo | 30.06 / 0.00 | 41.38 / 18.95 | 31.26 / 25.78 | 36.42 / 41.86 |
| i5-final-policy-v21-40 | Pyro | 23.53 / 0.00 | 35.45 / 20.13 | 28.33 / 22.09 | 32.30 / 43.70 |
| i5-final-policy-v21-40 | Arc | 24.69 / 0.00 | 35.27 / 11.97 | 26.98 / 3.98 | 31.37 / 16.70 |
| i5-final-policy-v21-40 | Pooled | 26.26 / 0.00 | 37.08 / 18.95 | 29.05 / 13.19 | 33.30 / 30.54 |

| Selection | Rig | Deaths by room |
|---|---|---|
| i5-final-policy-v19-40 | Breacher | 20×1 |
| i5-final-policy-v19-40 | Cryo | 20×1 |
| i5-final-policy-v19-40 | Pyro | 17×1, 19×1, 20×4 |
| i5-final-policy-v19-40 | Arc | None |
| i5-final-policy-v19-40 | **Pooled (8 deaths)** | **17×1, 19×1, 20×6** |
| i5-final-policy-v20-40 | Breacher | 20×3 |
| i5-final-policy-v20-40 | Cryo | 20×2 |
| i5-final-policy-v20-40 | Pyro | 16×1, 20×6 |
| i5-final-policy-v20-40 | Arc | 20×1 |
| i5-final-policy-v20-40 | **Pooled (13 deaths)** | **16×1, 20×12** |
| i5-final-policy-v21-40 | Breacher | 11×1, 20×3 |
| i5-final-policy-v21-40 | Cryo | 20×2 |
| i5-final-policy-v21-40 | Pyro | 17×1, 18×1, 20×4 |
| i5-final-policy-v21-40 | Arc | None |
| i5-final-policy-v21-40 | **Pooled (12 deaths)** | **11×1, 17×1, 18×1, 20×9** |

Outgoing shares are percent of pooled damage, with the preceding campaign attribution caveats.

| Selection | Rig | Weapon | Direct ability | Status | Boon | Ability + status + boon |
|---|---|---:|---:|---:|---:|---:|
| i5-final-policy-v19-40 | Breacher | 62.70 | 20.76 | 5.88 | 10.67 | 37.30 |
| i5-final-policy-v19-40 | Cryo | 52.20 | 18.76 | 6.62 | 22.42 | 47.80 |
| i5-final-policy-v19-40 | Pyro | 48.78 | 16.60 | 17.50 | 17.12 | 51.22 |
| i5-final-policy-v19-40 | Arc | 59.67 | 27.71 | 5.74 | 6.88 | 40.33 |
| i5-final-policy-v20-40 | Breacher | 62.65 | 20.82 | 5.79 | 10.73 | 37.35 |
| i5-final-policy-v20-40 | Cryo | 52.09 | 18.84 | 6.70 | 22.37 | 47.91 |
| i5-final-policy-v20-40 | Pyro | 49.13 | 16.31 | 17.66 | 16.90 | 50.87 |
| i5-final-policy-v20-40 | Arc | 59.93 | 27.73 | 5.72 | 6.61 | 40.07 |
| i5-final-policy-v21-40 | Breacher | 63.04 | 21.08 | 5.61 | 10.27 | 36.96 |
| i5-final-policy-v21-40 | Cryo | 53.13 | 18.55 | 6.07 | 22.25 | 46.87 |
| i5-final-policy-v21-40 | Pyro | 49.70 | 16.34 | 17.40 | 16.57 | 50.30 |
| i5-final-policy-v21-40 | Arc | 60.69 | 27.42 | 5.42 | 6.47 | 39.31 |

These remain rejected coupled encounter experiments. Larger champions and altered room composition change charge, recovery and survivor selection together; no isolated causal effect is claimed. The later production checkpoint disables this experimental encounter branch and is documented separately, retaining its own remaining failures.
