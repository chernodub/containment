# I5 archived balance experiments

This archive records two separate phases of four completed **40-attempt simulation cohorts** each: 160 original-policy attempts and 160 matched Nav3 attempts. It preserves every death and censored attempt. These experiments informed tuning; **they do not establish that the final balance targets are met**. The two native Breacher probes are labeled separately below.

## Cohort and measurement rules

- Every cohort uses all four rigs, unassisted story campaigns, and these ten seeds per rig: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. No assisted or legacy outcome enters these tables.
- The player uses the shared deterministic decision helpers, 250 ms decisions, 60 Hz simulation and the production GameFeel clock. The render-free player invokes real DepthGame actions; it does not exercise the native InputController, DOM or GPU. It earns resources, charge and rewards through ordinary rules; no fixture grants or room skips are used.
- Completion is endings divided by **all ten attempts per rig**, including censored attempts. A recorded `stalled` outcome remains censored, not a death or a successful ending. All four collections finished; “complete cohort” does not mean every campaign completed.
- Time distributions include cleared rooms only. “Ordinary time” below means **all non-holdout clears**, including the authored elite rooms; rooms 10 and 20 are excluded. Transmission time includes cleared room-10 observations only. Act damage includes every entered room attempt, including death/censor rooms. Later-act observations are therefore conditional on survival.
- Rooms/Overdrive is the median of each attempt’s cleared rooms divided by accepted Overdrive uses. The JSON also retains p10/p90, pooled cadence, time distributions, per-act damage distributions and pooled per-depth observations. Quantiles use the shared `balance-summary.mjs` implementation.
- Source shares pool authoritative damage totals before division. **A** is direct ability damage, **S** status and **B** boon damage. Their sum is non-weapon damage, not a causal measurement of rig contribution: weapon boons, ability statuses, control, protection and Overclock amplification cross these columns. The separate deterministic full-kit harness retains its unchanged **30–45% ability-share and ≤1.25× clear-time-spread assertions**.
- Raw reports remain under `artifacts/nextgen/playtest/<cohort>/`. The compact checked-in JSON records every selected report filename/SHA-256, outcome, seed, cleared-room count and uses. Summary measurements are rounded to six decimal places; raw report hashes identify the exact source bytes.

## Numerical variants

`depth` is zero-based and `pressure = max(0, depth − 4) / 15`, except Transmission (`depth=9`), whose additional progression pressure is zero. Basic enemy health progression and all rig damage/cooldowns stay unchanged in these experiments. Drive Dynamo keeps its ×1.3 charge multiplier.

| Experiment | Charge | Transmission | Added damage / speed pressure | Story elite HP | Ordinary elite chance after room 5 | Act 3–4 ordinary pool |
|---|---|---|---|---:|---|---|
| Baseline | `damage/6000 + kills*.025` | 40 at 900 ms | 0 / 0 | 1.65× | none | crawler×2, brute, spitter×2, stalker, carrier |
| C1 | `damage/12000 + kills*.0125` | 32 at 750 ms | 0 / 0 | 1.65× | none | baseline |
| Threat v1 | C1 | C1 | `.55 / .16` | 1.65× | `.04 + (depth−5)*.008` | crawler, brute, spitter×2, stalker×2, carrier |
| Threat v2 | C1 | C1 | `.28 / .07` | 1.25× | `.06 + (depth−5)*.008` | crawler×2, brute, spitter×2, stalker×2, carrier |

V1/v2 also use the following common changes:

- Additional Wardens in rooms **9, 13 and 19**, alongside the existing Warden in room 6 and Matron in room 16. The first request has the matching brute/carrier type. In these archived cohorts, the added guardians’ elite flag was still decided by the normal elite draw; it was **not forced true**. The later marker/cue correction is a different game state and is not credited to these results.
- Ordinary act-2 pool: crawler×2, spitter×2, stalker, carrier. V1 late pools have 4/7 specialists; v2 late pools have 4/8. Both exclude the holdout composition overrides.
- Concurrency ceiling **18 → 20**, with ordinary act bonuses **+1 / +2 / +2** after the opening act. Transmission’s base cap remains 14; the finale reaches 20 under the higher ceiling.
- Ordinary post-opening six-request batch periods **1100 → 950 / 850 / 750 ms**, with within-batch spacing **100 → 90 ms**. Opening cadence stays unchanged. Transmission uses its explicit 750 ms spacing; the finale retains **48 requests at 900 ms**.
- Elite damage remains **1.2×**; legacy v2 elite HP remains **1.65×**. V2’s frozen source returns 1.25× elite HP throughout the story, including the opening where no elites are scheduled. The later candidate scopes that value after room 5 to preserve the raw opening progression record exactly; that source change is not represented by this archived v2 hash.

## Complete experiment totals

| Experiment | Endings | Deaths | Censors | Completion | Median rooms/OD | Non-holdout time | Transmission |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline | 36/40 | 4 | 0 | 90.0% | 0.690 | 33.7 s | 80.4 s |
| Charge + holdout (C1) | 29/40 | 8 | 3 | 72.5% | 1.429 | 35.0 s | 66.5 s |
| Threat v1 | 4/40 | 34 | 2 | 10.0% | 1.625 | 33.8 s | 64.5 s |
| Threat v2 | 17/40 | 20 | 3 | 42.5% | 1.442 | 33.0 s | 62.2 s |

All 160 attempts cleared rooms 1–5; no opening-act death or censor occurred. The baseline’s 90% completion and ~0.69 rooms/use confirm excessive power availability for this simulated policy. C1 moves cadence and pooled Transmission duration into their intended ranges, but completion remains 72.5%. V1 overshoots difficulty at 10% completion. V2 returns pooled completion to 42.5%, but **Pyro is 22.5 percentage points below the four-rig mean and Cryo is 17.5 above it**; three attempts are censored. It does not meet the cross-rig acceptance target.

## Baseline

Evidence: [`i5-baseline-40.json`](evidence/I5/i5-baseline-40.json). Pooled death-room histogram: **15×1, 16×2, 20×1**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 10/10 (100%) | 0 | 0 | 0.678 [0.588–0.714] | 35.1 s | 86.6 s |
| Cryo | 10/10 (100%) | 0 | 0 | 0.690 [0.645–0.741] | 34.9 s | 93.3 s |
| Pyro | 6/10 (60%) | 4 | 0 | 0.728 [0.606–0.824] | 31.1 s | 74.7 s |
| Arc | 10/10 (100%) | 0 | 0 | 0.690 [0.571–0.741] | 33.4 s | 70.3 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 57.5 / 21.4 / 5.6 / 15.5% | 42.5% | 0.0 | 11.0 | 15.6 | 39.5 |
| Cryo | 46.7 / 21.1 / 6.7 / 25.4% | 53.3% | 0.0 | 11.8 | 13.5 | 24.7 |
| Pyro | 46.3 / 18.0 / 16.8 / 19.0% | 53.7% | 0.0 | 12.6 | 20.1 | 48.6 |
| Arc | 62.7 / 23.3 / 5.9 / 8.0% | 37.3% | 0.0 | 0.0 | 0.0 | 0.0 |

Per-rig death rooms: **Breacher** —; **Cryo** —; **Pyro** 15×1, 16×2, 20×1; **Arc** —.

Censored attempts: none.

## Charge + holdout (C1)

Evidence: [`i5-charge-holdout-40.json`](evidence/I5/i5-charge-holdout-40.json). Pooled death-room histogram: **15×1, 16×1, 17×4, 18×1, 20×1**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 8/10 (80%) | 1 | 1 | 1.381 [1.176–1.600] | 34.7 s | 72.1 s |
| Cryo | 9/10 (90%) | 0 | 1 | 1.429 [1.333–1.429] | 38.1 s | 72.8 s |
| Pyro | 4/10 (40%) | 6 | 0 | 1.429 [1.118–1.667] | 32.1 s | 60.4 s |
| Arc | 8/10 (80%) | 1 | 1 | 1.333 [1.176–1.600] | 33.6 s | 60.2 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 59.0 / 19.4 / 5.7 / 15.8% | 41.0% | 0.0 | 16.6 | 13.7 | 44.3 |
| Cryo | 51.2 / 18.5 / 5.9 / 24.3% | 48.8% | 0.0 | 10.7 | 20.3 | 40.8 |
| Pyro | 49.1 / 16.1 / 17.3 / 17.5% | 50.9% | 0.0 | 14.1 | 22.3 | 50.7 |
| Arc | 60.4 / 26.1 / 5.6 / 7.9% | 39.6% | 0.0 | 10.9 | 11.2 | 26.5 |

Per-rig death rooms: **Breacher** 17×1; **Cryo** —; **Pyro** 15×1, 16×1, 17×2, 18×1, 20×1; **Arc** 17×1.

Censored attempts: Breacher seed 2026, room 10 (stalled); Cryo seed 123456, room 17 (stalled); Arc seed 9001, room 12 (stalled).

## Threat v1

Evidence: [`i5-threat-v1-40.json`](evidence/I5/i5-threat-v1-40.json). Pooled death-room histogram: **10×1, 11×2, 12×1, 13×1, 14×8, 15×3, 16×10, 17×2, 18×3, 19×3**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 2/10 (20%) | 8 | 0 | 1.590 [1.000–1.857] | 34.8 s | 79.0 s |
| Cryo | 2/10 (20%) | 7 | 1 | 1.500 [1.333–1.750] | 36.9 s | 72.5 s |
| Pyro | 0/10 (0%) | 10 | 0 | 1.646 [1.143–2.000] | 29.3 s | 59.3 s |
| Arc | 0/10 (0%) | 9 | 1 | 1.667 [1.385–1.857] | 31.7 s | 56.4 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 60.8 / 20.8 / 5.0 / 13.4% | 39.2% | 0.0 | 24.1 | 37.9 | 96.5 |
| Cryo | 52.7 / 19.2 / 5.9 / 22.2% | 47.3% | 0.0 | 20.9 | 61.4 | 95.4 |
| Pyro | 50.4 / 17.8 / 18.7 / 13.2% | 49.6% | 0.0 | 23.3 | 48.3 | 72.2 |
| Arc | 61.1 / 27.1 / 5.6 / 6.2% | 38.9% | 0.0 | 0.0 | 47.7 | 95.9 |

Per-rig death rooms: **Breacher** 11×1, 14×2, 15×1, 16×3, 19×1; **Cryo** 13×1, 14×1, 15×1, 16×1, 18×2, 19×1; **Pyro** 10×1, 11×1, 14×3, 16×3, 17×2; **Arc** 12×1, 14×2, 15×1, 16×3, 18×1, 19×1.

Censored attempts: Cryo seed 8675309, room 12 (stalled); Arc seed 2718, room 9 (stalled).

## Threat v2

Evidence: [`i5-threat-v2-40.json`](evidence/I5/i5-threat-v2-40.json). Pooled death-room histogram: **11×1, 13×2, 14×3, 16×3, 17×3, 18×3, 19×2, 20×3**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 4/10 (40%) | 5 | 1 | 1.481 [1.176–2.000] | 33.0 s | 62.4 s |
| Cryo | 6/10 (60%) | 3 | 1 | 1.429 [1.333–1.857] | 36.2 s | 69.3 s |
| Pyro | 2/10 (20%) | 8 | 0 | 1.527 [1.111–1.714] | 31.2 s | 57.5 s |
| Arc | 5/10 (50%) | 4 | 1 | 1.333 [1.250–1.636] | 33.1 s | 57.6 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 59.0 / 20.4 / 5.9 / 14.7% | 41.0% | 0.0 | 26.0 | 45.3 | 67.5 |
| Cryo | 51.1 / 20.2 / 6.5 / 22.1% | 48.9% | 0.0 | 23.6 | 42.2 | 82.1 |
| Pyro | 48.3 / 16.9 / 17.7 / 17.1% | 51.7% | 0.0 | 21.8 | 30.5 | 66.0 |
| Arc | 60.1 / 26.2 / 6.0 / 7.7% | 39.9% | 0.0 | 11.2 | 14.5 | 49.6 |

Per-rig death rooms: **Breacher** 11×1, 16×2, 18×1, 20×1; **Cryo** 14×2, 17×1; **Pyro** 13×2, 14×1, 17×2, 18×1, 19×1, 20×1; **Arc** 16×1, 18×1, 19×1, 20×1.

Censored attempts: Breacher seed 1729, room 9 (stalled); Cryo seed 1729, room 8 (stalled); Arc seed 2718, room 19 (stalled).

## Source and policy provenance

All 160 reports record the same shared decision-helper SHA-256:

`3a71094272e034b044e5e46cea11c76c768c93dbe134a4f78c2965850f7f4998`

The simulator’s frozen `sim-core.ts` SHA-256 is `524026d2412a649c45ddcc057956159f36a5231b7945600460119be61d2ef526` for baseline/C1 and `46d66621b107e5244dcccfa3b491d0e3256d72002cf9d4527487975093bfc897` for v1/v2. The latter revision expands read-only final-state/recent-decision/progress diagnostics and formats the module; type-copy/Reflect.get cleanup does not change decisions. The action/target/movement policy and 240-second room bound are unchanged. The recorded 45-second no-progress observation is diagnostic; it does not add an earlier cutoff to these cohorts. This is instrumentation evolution, not a navigation-policy improvement.

**Baseline** (`i5-baseline-40`):

- HEAD: `76e744ddae0d3dfc045614efb4b6efd6509ba9e7`
- Game hash: `603632e6f8b30ad2a5bf8d1262bb24af3ad5e76c8b30d6dbf995a4d48dcdfbe4`
- Bundled player hash: `5f456a245d99f3c10d0e1b46a76346d2ac5cad08a6b8ab8e262ba4ed7cff1e67`

**Charge + holdout (C1)** (`i5-charge-holdout-40`):

- HEAD: `76e744ddae0d3dfc045614efb4b6efd6509ba9e7`
- Game hash: `6a01a74f8888f90c801dc37e4fb961b1b8562905d5804d82a800674e99d3eff3`
- Bundled player hash: `c46a1ee6cac7c23ca8df8d9ffd7943a518994d3344f1dab37f4f44cb773bc210`

**Threat v1** (`i5-threat-v1-40`):

- HEAD: `76e744ddae0d3dfc045614efb4b6efd6509ba9e7`
- Game hash: `9a83ca22459aca70dd6e36df0f10c74aef070940cafc72322d568fee69ec952f`
- Bundled player hash: `150e881eb3eccc95d478876e656f6da996b4faebe931227e7a72ec4afebb9066`

**Threat v2** (`i5-threat-v2-40`):

- HEAD: `01ed4218f9a96cb18b6f0af2f91b76c506fe5bb4`
- Game hash: `39660f791270ceb0bc6c77e785689f1d95d2fdbeb77a3ffa7530c7bfc373aee2`
- Bundled player hash: `cf0ed9357711cd39a76aaa4c475a633e2ee4de67e10519bdec53d3c655ba4b96`

A HEAD identifies the checkout metadata, while the game and bundle hashes identify the captured uncommitted experiment contents. The JSON also records frozen hashes for DepthGame, charge, progression, director, simulator and policy sources.

## Parity limits and excluded pilots

These are render-free simulator measurements, not native browser campaign results. Sharing DepthGame, GameFeel, decision helpers and camera math does not establish identical observations or action timing through the application: actor projection, held screen rays, camera/FX feedback, readiness and native UI/input sequencing can diverge. Room preparation, GPU work, Web Audio and DOM accessibility are absent. No 50× speedup, production frame-budget or human feel claim is made. Matched native campaigns on the final policy/source remain necessary.

The original navigation observer could produce unresolved fights; those recorded stalls remain explicit here. Partial navigation-observer v2 pilots (including the earlier `i5-nav-baseline-40` / `i5-nav-candidate-40` attempts and `i5-nav-v2-native-pyro-1729`) are obsolete for balance aggregation and are excluded from all 160 attempts above. Later navigation-observer v3 collections must be reported under their own policy/game hashes and must not be pooled into these cohorts. A native proof or a short smoke is not substituted for full-campaign validation.

The corrected-policy matched cohorts are archived separately below. Subsequent experimental and native evidence must retain its own source identity. Keep the existing full-kit invariants and persistence/accessibility assertions unchanged.

## Corrected navigation policy: four additional matched cohorts

This phase is separate from the preceding 160 old-policy attempts. It adds **160 completed attempts**, all with `policyVersion:"i5-navigation-observer-v3"` and simulator mode `sim-policy-v4`. The same ten seeds and four rigs are used in each cohort. All attempts terminate as an ending or a natural death: **zero censors in every cohort**. The `final-policy` folder prefix identifies the frozen bot policy; it does not label an accepted final game balance.

Every cohort in this phase has the same combined policy hash (decision helpers + navigation helper + version module):

`e4e6c2e75850aa0a80052f082c748c64fa0e1ccc065cdca8f10747b5c5e2a8ff`

The frozen simulator core is identical across these four cohorts: `sim-core.ts` SHA-256 `0d0b76075efbce29c18e6f1ab241534ded8683b25781b0d1e203938db5344f87`. Shared navigation source SHA-256 is `334bc5a8b110a9f68841ed77abee8f5ae9290d7fec6ea2b03d99e9e9c9d164ad`; the version module is `f583b313a06e675b074de36eb556b7efd9f4b4a0320c32e85b4f2a0f9de88eec`. Each evidence JSON records the exact driver/worker source hashes as well as the game and bundled player hashes.

### Corrected-policy numerical variants

The Nav3 baseline reuses the original baseline game (old charge and 40-request Transmission). V2 uses half charge, 32-request Transmission, `.28` damage pressure, `.07` speed pressure, story elite HP `1.25×`, elite damage `1.2×`, and ordinary elite chance `.06 + (depth−5)*.008`. Unlike the earlier v2 archive, its added guardians are always marked elite after consuming the ordinary elite random draw, and lighter elite HP is scoped after room 5.

| Variant | Added speed pressure | Added damage pressure | Story elite HP | Story elite damage | Ordinary elite chance |
|---|---:|---:|---:|---:|---|
| Nav3 v2 | .07 | .28 | 1.25× | 1.2× | `.06 + (depth−5)*.008` |
| Nav3 v3 | .025 | .08 | 1.15× | 1.05× | `.10 + (depth−5)*.012` |
| Nav3 v4 | .05 | .18 | 1.08× | 1.05× | `.14 + (depth−5)*.018` |

V2/v3/v4 share the **eight-slot late ordinary pool** (crawler×2, brute, spitter×2, stalker×2, carrier), increased caps, tempo, authored guardian rooms and holdout exceptions described above. Elite HP/damage changes are story-only after room 5; the opening and legacy progression are preserved. Transmission remains excluded from additional progression pressure and ordinary composition/elite changes; the finale still uses the older holdout composition and has no ordinary elite rolls in these three variants. Basic health and rigs/boons are unchanged.

### Corrected-policy totals

| Experiment | Endings | Deaths | Censors | Completion | Median rooms/OD | Non-holdout time | Transmission |
|---|---:|---:|---:|---:|---:|---:|---:|
| Nav3 baseline | 37/40 | 3 | 0 | 92.5% | 0.690 | 33.6 s | 80.5 s |
| Nav3 threat v2 | 18/40 | 22 | 0 | 45.0% | 1.429 | 33.1 s | 65.7 s |
| Nav3 threat v3 | 30/40 | 10 | 0 | 75.0% | 1.429 | 33.5 s | 67.2 s |
| Nav3 threat v4 | 23/40 | 17 | 0 | 57.5% | 1.429 | 33.4 s | 64.8 s |

None of these variants meets the combined acceptance targets. V2’s 45% aggregate completion masks **0% Pyro** and 70% Cryo/Arc. V3 is too easy overall at **75%**, with Pyro 25 points below its mean and Arc 25 above it. V4 reaches **57.5%** aggregate completion, but Pyro is **37.5 percentage points below the mean** and Cryo/Arc are 22.5 above it. New experimental collections remain pending; no later candidate is assigned an outcome here.

### Nav3 baseline

Evidence: [`i5-final-policy-baseline-40.json`](evidence/I5/i5-final-policy-baseline-40.json). Pooled death-room histogram: **15×1, 16×2**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 10/10 (100%) | 0 | 0 | 0.678 [0.588–0.714] | 35.1 s | 86.6 s |
| Cryo | 10/10 (100%) | 0 | 0 | 0.702 [0.645–0.741] | 34.9 s | 93.3 s |
| Pyro | 7/10 (70%) | 3 | 0 | 0.728 [0.606–0.824] | 31.1 s | 74.7 s |
| Arc | 10/10 (100%) | 0 | 0 | 0.690 [0.571–0.741] | 32.5 s | 70.3 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 57.5 / 21.4 / 5.6 / 15.5% | 42.5% | 0.0 | 11.0 | 15.6 | 39.5 |
| Cryo | 47.3 / 20.8 / 6.7 / 25.2% | 52.7% | 0.0 | 11.0 | 13.6 | 14.6 |
| Pyro | 46.3 / 17.9 / 16.8 / 19.0% | 53.7% | 0.0 | 12.6 | 20.1 | 44.1 |
| Arc | 62.6 / 23.5 / 5.9 / 8.0% | 37.4% | 0.0 | 0.0 | 0.0 | 0.0 |

Per-rig death rooms: **Breacher** —; **Cryo** —; **Pyro** 15×1, 16×2; **Arc** —.

- HEAD: `01af5fe5a053f215a5069ae4df117f449180a79f`
- Game hash: `603632e6f8b30ad2a5bf8d1262bb24af3ad5e76c8b30d6dbf995a4d48dcdfbe4`
- Bundled player hash: `16a70aec1d2eb4894ec37758f4a24907bbd1b1b82418860b04518db819c9cb1e`
- Driver (`sim.mjs`) hash: `c5a7977d97e3f4eb4a1f894676512b03fb1e8286667b691ba3fe37fd417ca1f8`

### Nav3 threat v2

Evidence: [`i5-final-policy-v2-40.json`](evidence/I5/i5-final-policy-v2-40.json). Pooled death-room histogram: **11×2, 13×1, 14×1, 16×6, 17×3, 18×4, 19×1, 20×4**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 4/10 (40%) | 6 | 0 | 1.429 [1.118–1.600] | 33.5 s | 74.2 s |
| Cryo | 7/10 (70%) | 3 | 0 | 1.429 [1.267–1.545] | 37.1 s | 72.2 s |
| Pyro | 0/10 (0%) | 10 | 0 | 1.646 [1.308–1.714] | 29.9 s | 58.7 s |
| Arc | 7/10 (70%) | 3 | 0 | 1.333 [1.176–1.462] | 32.2 s | 60.0 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 58.1 / 21.0 / 5.5 / 15.5% | 41.9% | 0.0 | 26.8 | 41.3 | 71.1 |
| Cryo | 50.6 / 19.2 / 6.6 / 23.7% | 49.4% | 0.0 | 20.1 | 53.4 | 49.2 |
| Pyro | 50.5 / 17.0 / 17.9 / 14.6% | 49.5% | 0.0 | 24.7 | 39.7 | 64.7 |
| Arc | 59.4 / 26.3 / 6.1 / 8.3% | 40.6% | 0.0 | 11.5 | 15.3 | 51.4 |

Per-rig death rooms: **Breacher** 11×1, 16×1, 17×1, 18×1, 19×1, 20×1; **Cryo** 16×1, 18×1, 20×1; **Pyro** 11×1, 13×1, 14×1, 16×3, 17×2, 18×2; **Arc** 16×1, 20×2.

- HEAD: `01af5fe5a053f215a5069ae4df117f449180a79f`
- Game hash: `ac4a47d6386fab6a68ea0e0e99bd247ef38d61cec547a28d8945aedd4bc2bd2d`
- Bundled player hash: `ec0d9d1b902aa08488d864c7efd964252d3a416fd6555c7cbe15d9f4acdb730b`
- Driver (`sim.mjs`) hash: `c5a7977d97e3f4eb4a1f894676512b03fb1e8286667b691ba3fe37fd417ca1f8`

### Nav3 threat v3

Evidence: [`i5-final-policy-v3-40.json`](evidence/I5/i5-final-policy-v3-40.json). Pooled death-room histogram: **13×1, 15×1, 17×2, 18×2, 19×1, 20×3**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 7/10 (70%) | 3 | 0 | 1.387 [1.111–1.429] | 34.3 s | 68.6 s |
| Cryo | 8/10 (80%) | 2 | 0 | 1.429 [1.250–1.462] | 36.6 s | 69.5 s |
| Pyro | 5/10 (50%) | 5 | 0 | 1.429 [1.111–1.750] | 30.8 s | 62.0 s |
| Arc | 10/10 (100%) | 0 | 0 | 1.333 [1.176–1.429] | 31.5 s | 67.3 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 58.7 / 20.8 / 5.5 / 14.9% | 41.3% | 0.0 | 24.4 | 26.5 | 56.8 |
| Cryo | 50.7 / 19.2 / 6.6 / 23.5% | 49.3% | 0.0 | 20.1 | 28.0 | 47.8 |
| Pyro | 47.4 / 17.1 / 17.5 / 18.1% | 52.6% | 0.0 | 19.9 | 31.6 | 59.4 |
| Arc | 59.2 / 26.5 / 6.1 / 8.3% | 40.8% | 0.0 | 11.1 | 12.8 | 44.4 |

Per-rig death rooms: **Breacher** 18×1, 20×2; **Cryo** 13×1, 20×1; **Pyro** 15×1, 17×2, 18×1, 19×1; **Arc** —.

- HEAD: `01af5fe5a053f215a5069ae4df117f449180a79f`
- Game hash: `12a6a05ce28f45ae3cd0ed3cf788a4d42ce5b5e70b6487675d41ce072cba2d2e`
- Bundled player hash: `0b298627b94a743122d263ae175c837f9f64e89846ed5a5a351d874058aa7855`
- Driver (`sim.mjs`) hash: `c5a7977d97e3f4eb4a1f894676512b03fb1e8286667b691ba3fe37fd417ca1f8`

### Nav3 threat v4

Evidence: [`i5-final-policy-v4-40.json`](evidence/I5/i5-final-policy-v4-40.json). Pooled death-room histogram: **10×1, 11×1, 13×1, 14×2, 15×1, 16×2, 17×1, 18×1, 19×2, 20×5**.

| Rig | Completion | Deaths | Censors | Median rooms/OD [p10–p90] | Non-holdout median | Transmission median |
|---|---:|---:|---:|---:|---:|---:|
| Breacher | 5/10 (50%) | 5 | 0 | 1.429 [1.111–1.625] | 33.9 s | 65.5 s |
| Cryo | 8/10 (80%) | 2 | 0 | 1.429 [1.333–1.538] | 37.3 s | 67.9 s |
| Pyro | 2/10 (20%) | 8 | 0 | 1.573 [1.111–2.000] | 31.2 s | 58.4 s |
| Arc | 8/10 (80%) | 2 | 0 | 1.345 [1.176–1.429] | 31.9 s | 60.2 s |

| Rig | Weapon / A / S / B share | Non-weapon sum | Act 1 damage | Act 2 damage | Act 3 damage | Act 4 damage |
|---|---|---:|---:|---:|---:|---:|
| Breacher | 59.4 / 21.8 / 5.3 / 13.4% | 40.6% | 0.0 | 25.1 | 42.6 | 49.4 |
| Cryo | 50.3 / 19.1 / 6.9 / 23.6% | 49.7% | 0.0 | 13.6 | 46.5 | 56.7 |
| Pyro | 47.9 / 17.5 / 18.0 / 16.6% | 52.1% | 0.0 | 27.7 | 29.8 | 79.7 |
| Arc | 59.4 / 26.3 / 6.1 / 8.3% | 40.6% | 0.0 | 0.0 | 12.7 | 32.0 |

Per-rig death rooms: **Breacher** 10×1, 14×1, 19×2, 20×1; **Cryo** 16×1, 20×1; **Pyro** 11×1, 13×1, 14×1, 15×1, 16×1, 17×1, 18×1, 20×1; **Arc** 20×2.

- HEAD: `1f26b264925bdc893a29e32256dc4b89b964201e`
- Game hash: `16128afdf5694b9e237317029fb572b3cb94a29007ed82831107ee7521d498c6`
- Bundled player hash: `7b2272f1b695057d4379d3df975f4843ae35120a69b4952d80305cebadb8a0a2`
- Driver (`sim.mjs`) hash: `0836c5c238f465d5453208c0e5b5597eeb49740d882f5ba44a9679f4893028b0`

### V4 native Breacher probes

Two native-input fast-render campaigns use the same Nav3 policy version. They advance scene/camera every fixed tick and submit the GPU draw at the batch boundary. Both record **zero errors and zero defects**; both outcomes are natural deaths. A runner exit of zero is valid for a death and must not be read as a campaign clear.

| Seed | Native outcome | Cleared rooms | Matched Node V4 outcome | Errors / defects |
|---|---|---:|---|---|
| 1729 | Dead in room 17 (Shielding gate) | 16 | Complete, 20 rooms | 0 / 0 |
| 2718 | Dead in room 14 (Service-shaft landing) | 13 | Dead in room 14 | 0 / 0 |

Raw folders: `artifacts/nextgen/playtest/i5-v4-native-breacher-breacher-1729/` and `i5-v4-native-breacher-breacher-2718/`. Compact evidence: [`i5-v4-native-breacher.json`](evidence/I5/i5-v4-native-breacher.json), including report SHA-256 and native harness hashes. Native HEAD is `1f26b264925bdc893a29e32256dc4b89b964201e`; its combined frozen policy-source hash equals `e4e6c2e75850aa0a80052f082c748c64fa0e1ccc065cdca8f10747b5c5e2a8ff`. No native game/bundle hash is invented where the report did not record one.

**Seed 1729 demonstrates a native/Node outcome mismatch.** Shared policy/version hashes and clean diagnostic runs do not certify full-campaign parity. These probes are not the required final two native campaigns per rig, and they do not validate V4 as balanced. The simulator remains an experimental tuning aid; final native evidence and human playtesting must be assessed separately. The original full-kit invariants still apply.
