# I5 emulation-v8 fixed N40 validation

**Fixed validation complete: V30 fails the exact15-point rig-distance target.** All other declared pooled target flags pass, but Cryo+16.875/Pyro−15.625pp is not waived. The next controlled candidate is [V33](I5-EMULATION-V8-V33.md), which changes Cryo Nova freeze1800→1500ms and reruns these same forty seeds per rig; no further seed extension. This archive implements the [predeclared fixed extension](plans/I5-V8-VALIDATION.md), committed as `70a48d6fee489d8f53efde203e2ff19eea63cafd` before reading validation outcomes. Keep the original twenty and all additional twenty seeds for every rig and both profiles: forty seeds per rig,160 campaigns per profile,320 total reports. There is no further seed extension merely until a target passes.

The initial mode-v8 measurements remain immutable in [I5-EMULATION-V8.json](evidence/I5/I5-EMULATION-V8.json): baseline68/80 and current41/80. Current Pyro35% is16.25 points below the51.25% mean, so the initial strict15-point check fails. The larger fixed sample tests that boundary without selecting a better subset or altering gameplay.

Validation seeds use xorshift32 initialized with `0x49355638`, shifts13/17/5 and unsigned32-bit arithmetic. The exact twenty seeds, initial seeds, declaration timestamp, backend commit and stop rule are preserved in `artifacts/nextgen/i5-continuation/mode8-validation-plan.json`. Archival will independently reproduce the generator and require both cohorts to contain the exact planned eighty reports before reading their outcomes.

Baseline session13889 and current session77516 both finished and were reaped with exit0. The combined archive exposes initial, validation and combined rig rates, all pacing/cadence/depth/source distributions, deaths and censors, ordinary-cap attempts and every matched seed. Pooled completion40–60%, strict15-point rig distance, every-rig cadence1.2–1.7, zero ordinary cap violations, pooled strict ordinary30–45s/Transmission60–75s and welcoming opening/depth pressure are assessed separately. Broad and individual timing variations remain visible. Original full-kit and basic-crawler TTK guards are unchanged.

Initial raw reports retain workspace HEAD `f496476`, dirty backend patch `ba2af0d…`, and current gameplay reference `working-tree`. Validation reports retain HEAD `70a48d6`, dirty=false/empty patch SHA, and explicit gameplay reference `f496476`. These provenance states are not rewritten or silently conflated. Combining them requires exact per-profile game hashes/runtime bundles, shared policy `976eb173…`, backend `63b80de0…` and committed source-file identities. Initial and validation raw-source receipts stay separate even when runtime code is identical.

No gameplay, native policy or backend changes are part of the extension. Native eight-campaign calibration remains separate: the frozen native client is still `f496476`, and its actual outcomes must not be replaced by Node outcomes. Historical mode-v7 data and the initial v8 JSON remain untouched. No browser, campaign or extra verification job is launched by this archival helper.

## Complete initial, validation and combined measurements

All320 reports and160 matchedseed pairs are retained. Exact per-profile runtime/game/backend/policy identities permit combining the stages; rawworkspace heads, gameplay references and dirtypatch states stay separate. [Complete structured evidence](evidence/I5/I5-EMULATION-V8-N40.json) contains all320rawhashes, copiedsource/backendidentities, seedpairs and full distributions.

| Profile | Stage | Completed | Censors | Pooled strict ordinary s | Broad nonholdout s | Transmission s | Median rooms/OD |
|---|---|---:|---:|---:|---:|---:|---:|
| baseline | initial | 68/80 (85.00%) | 0 | 32.97 | 34.23 | 62.58 | 1.333333 |
| baseline | validation | 69/80 (86.25%) | 0 | 33.00 | 34.12 | 66.72 | 1.360390 |
| baseline | combined | 137/160 (85.63%) | 0 | 32.98 | 34.17 | 64.47 | 1.333333 |
| candidate | initial | 41/80 (51.25%) | 0 | 31.98 | 34.18 | 61.98 | 1.428571 |
| candidate | validation | 40/80 (50.00%) | 0 | 31.95 | 34.03 | 66.91 | 1.416667 |
| candidate | combined | 81/160 (50.63%) | 0 | 31.98 | 34.10 | 64.36 | 1.428571 |

| Profile | Rig | Initial complete/20 | Validation complete/20 | Combined complete/40 | Mean distance pp |
|---|---|---:|---:|---:|---:|
| baseline | breacher | 19 | 14 | 33 | -3.13 |
| baseline | cryo | 18 | 20 | 38 | 9.38 |
| baseline | pyro | 13 | 15 | 28 | -15.63 |
| baseline | arc | 18 | 20 | 38 | 9.38 |
| candidate | breacher | 12 | 6 | 18 | -5.63 |
| candidate | cryo | 12 | 15 | 27 | 16.88 |
| candidate | pyro | 7 | 7 | 14 | -15.63 |
| candidate | arc | 10 | 12 | 22 | 4.38 |

## Current combined target flags

Completion-distance flags use exact integer completion-count products, including the15pointboundary. Per-rig timing flags are diagnostics under the declared pooledpacing scope.

| Rig | Completion | Distance≤15pp | OD1.2–1.7 | Strict30–45s | Broad30–45s | Tx60–75s | Ordinary cap | Strict act damage rise | Opening |
|---|---:|---|---|---|---|---|---|---|---:|
| arc | 22/40 | PASS (4.38pp) | PASS (1.428571) | PASS (30.33) | PASS (32.30) | PASS (60.20) | PASS | PASS | 200/200 |
| breacher | 18/40 | PASS (-5.63pp) | PASS (1.428571) | PASS (33.05) | PASS (35.00) | PASS (68.93) | PASS | PASS | 200/200 |
| cryo | 27/40 | FAIL (16.88pp) | PASS (1.386905) | PASS (36.60) | PASS (38.85) | FAIL (78.04) | PASS | PASS | 200/200 |
| pyro | 14/40 | FAIL (-15.63pp) | PASS (1.416667) | FAIL (29.03) | PASS (30.50) | FAIL (58.20) | PASS | PASS | 200/200 |

| Combined current target | Result |
|---|---|
| completionBandPassed | PASS |
| rigDistancePassed | FAIL |
| roomsPerOverdrivePassed | PASS |
| strictOrdinaryCapPassed | PASS |
| pooledStrictOrdinaryTimePassed | PASS |
| pooledTransmissionTimePassed | PASS |
| firstFiveAllClear | PASS |
| pooledDamageRisesEachAct | PASS |
| zeroCensors | PASS |

## Combined time and incoming damage by act

Each cell is median cleared-room seconds / median incoming damage per attempted room; denominators andp10/p90/ranges remain in JSON.

| Profile | Rig | Act1 | Act2 | Act3 | Act4 |
|---|---|---:|---:|---:|---:|
| baseline | breacher | 27.64 / 0.00 | 38.64 / 12.49 | 38.19 / 13.94 | 48.98 / 41.06 |
| baseline | cryo | 28.91 / 0.00 | 42.50 / 11.08 | 39.06 / 16.89 | 48.74 / 41.52 |
| baseline | pyro | 24.18 / 0.00 | 34.63 / 12.49 | 34.35 / 14.20 | 43.37 / 49.26 |
| baseline | arc | 24.07 / 0.00 | 33.99 / 0.00 | 35.77 / 0.00 | 43.97 / 12.08 |
| baseline | pooled | 26.13 / 0.00 | 37.42 / 10.41 | 36.69 / 13.49 | 46.02 / 31.56 |
| candidate | breacher | 29.38 / 0.00 | 37.66 / 23.39 | 38.42 / 41.96 | 43.35 / 57.39 |
| candidate | cryo | 32.71 / 0.00 | 41.63 / 19.45 | 40.12 / 50.30 | 44.48 / 80.41 |
| candidate | pyro | 24.77 / 0.00 | 32.38 / 13.83 | 33.68 / 45.21 | 39.72 / 62.33 |
| candidate | arc | 27.33 / 0.00 | 33.71 / 10.53 | 34.73 / 28.59 | 40.83 / 38.60 |
| candidate | pooled | 28.32 / 0.00 | 36.36 / 13.57 | 36.56 / 39.63 | 42.85 / 63.01 |

## Pooled combined depth distributions

Cells show clears/attempts; median clear seconds; median incoming damage. Every rig/stage row remains in JSON.

| Room | Baseline | Current |
|---|---|---|
| 1 | 160/160; 19.61; 0.00 | 160/160; 19.93; 0.00 |
| 2 | 160/160; 28.27; 0.00 | 160/160; 28.42; 0.00 |
| 3 | 160/160; 28.66; 0.00 | 160/160; 32.54; 0.00 |
| 4 | 159/160; 23.28; 0.00 | 160/160; 26.50; 11.27 |
| 5 | 159/159; 30.60; 0.00 | 160/160; 32.87; 0.00 |
| 6 | 159/159; 38.42; 12.49 | 160/160; 36.67; 13.90 |
| 7 | 159/159; 30.28; 0.00 | 160/160; 31.59; 10.74 |
| 8 | 159/159; 28.10; 0.00 | 160/160; 29.06; 13.57 |
| 9 | 159/159; 38.18; 13.20 | 160/160; 35.36; 20.75 |
| 10 | 159/159; 64.47; 24.37 | 160/160; 64.36; 24.37 |
| 11 | 159/159; 35.52; 13.39 | 160/160; 34.61; 30.15 |
| 12 | 159/159; 37.65; 11.24 | 157/160; 34.15; 33.69 |
| 13 | 159/159; 37.52; 13.59 | 157/157; 37.88; 50.39 |
| 14 | 159/159; 34.78; 13.68 | 153/157; 34.92; 47.16 |
| 15 | 158/159; 37.91; 26.04 | 143/153; 40.27; 48.10 |
| 16 | 153/158; 57.35; 56.00 | 126/143; 51.10; 57.99 |
| 17 | 147/153; 39.50; 14.40 | 121/126; 35.82; 40.91 |
| 18 | 145/147; 37.02; 26.57 | 110/121; 34.29; 73.79 |
| 19 | 145/145; 41.15; 14.59 | 108/110; 40.92; 51.53 |
| 20 | 137/145; 68.15; 56.30 | 81/108; 57.85; 108.84 |

## Combined death rooms and source shares

| Profile | Rig | Natural death rooms |
|---|---|---|
| baseline | breacher | 16×2, 17×5 |
| baseline | cryo | 20×2 |
| baseline | pyro | 4×1, 15×1, 16×2, 18×2, 20×6 |
| baseline | arc | 16×1, 17×1 |
| baseline | pooled | 4×1, 15×1, 16×5, 17×6, 18×2, 20×8 |
| candidate | breacher | 12×3, 14×1, 15×5, 16×4, 18×3, 20×6 |
| candidate | cryo | 15×1, 17×1, 18×2, 19×1, 20×8 |
| candidate | pyro | 15×4, 16×8, 17×1, 18×5, 20×8 |
| candidate | arc | 14×3, 16×5, 17×3, 18×1, 19×1, 20×5 |
| candidate | pooled | 12×3, 14×4, 15×10, 16×17, 17×5, 18×11, 19×2, 20×27 |

Source-share percentages are observed weapon/directability/status/boon buckets; combined nonweapon damage is not an isolated causal rig measure.

| Profile | Rig | Weapon | Ability | Status | Boon | Ability+status+boon |
|---|---|---:|---:|---:|---:|---:|
| baseline | breacher | 58.88 | 20.25 | 3.87 | 17.00 | 41.12 |
| baseline | cryo | 48.02 | 20.15 | 6.19 | 25.64 | 51.98 |
| baseline | pyro | 46.41 | 18.98 | 17.72 | 16.89 | 53.59 |
| baseline | arc | 61.10 | 27.46 | 3.29 | 8.15 | 38.90 |
| candidate | breacher | 62.46 | 22.90 | 3.54 | 11.09 | 37.54 |
| candidate | cryo | 48.73 | 19.46 | 7.27 | 24.55 | 51.27 |
| candidate | pyro | 44.83 | 22.28 | 19.09 | 13.80 | 55.17 |
| candidate | arc | 62.19 | 28.25 | 3.03 | 6.53 | 37.81 |

No acceptance or native parity is inferred automatically. The fixed extension retains every initial and validation outcome; it does not authorize another extension merelyuntilpass. Final gates and native comparison remain separate evidence.

## Assessment for lead review

The current profile completes81/160 campaigns (50.625%), versus137/160 (85.625%) for the baseline. The original stage completes41/80 and validation40/80; neither stage or individual attempt is discarded.

The **strict15-point rig-distance target fails**. Combined rates are Breacher45%, Cryo67.5%, Pyro35% and Arc55%. Against the50.625% mean, Cryo is+16.875 points and Pyro−15.625; Breacher−5.625 and Arc+4.375 pass. The comparison uses integer completion counts, with no rounding waiver.

Every rig meets Overdrive cadence. All1997 classified ordinary attempts respect the one-use cap, with no unknown categories or censors. Current first-five rooms clear800/800 attempts. Pooled median incoming damage rises0→13.572472→39.625047→63.010327 across the acts; every rig also has strictly rising act medians in the combined sample.

Pooled strict ordinary31.975s, broad non-holdout34.1s and Transmission64.358333s meet the declared pacing scope. Individual variations remain explicit: Pyro strict ordinary29.033333s and Transmission58.2s are faster; Cryo Transmission78.041667s is slower. All four broad non-holdout medians pass.

This is the end of the predeclared fixed extension. These measurements do not authorize additional sampling merely to reach a threshold, do not establish exact native outcome prediction and do not mark the task complete. The lead decides whether the confirmed spread miss requires a measured balance adjustment. Existing full-kit, TTK, persistence/accessibility and final-gate requirements remain intact.
