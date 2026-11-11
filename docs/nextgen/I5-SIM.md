# I5 render-free campaign player

## Implementation and controls

`node scripts/nextgen/playtest/sim.mjs` bundles the actual `DepthGame` and game modules once with the installed Vite build API, then fights earned campaigns entirely in Node. It uses the same `policy.mjs` decisions as the browser player: targets, movement candidates, opportunity-based ability use, draft preferences, services and routes. No damage, resources, boons, Overdrive charge, enemy positions or completed rooms are injected. An explicitly requested legacy campaign starts at its canonical first node; assisted mode multiplies incoming damage by 0.15 and remains labeled separately.

Simulation updates use the native 60 Hz `GameFeel` clock and 250 ms policy decisions. The player preserves InputController's `y / .81` movement scaling, weapon/action order, held-screen pointer projection, native torso selection and the browser collector's extra three 66.667 ms hardest-moment samples. It imports shared camera spring/framing helpers and ability event presenters through a camera-only kit; geometry, particle, light and distortion operations are no-ops. Actor torso heights are measured from the real untextured GLB geometry with the same initial pose and scale, without DOM, GPU or image decoding. The player's projected body headroom correction follows the native renderer's correction.

A run's immutable bundle and script/policy copies are saved under its label's `source/` directory. Reports include HEAD, requested game revision, SHA-256 policy/game/bundle hashes and source snapshots for the four principal gameplay files. `--game-revision=<ref>` reads `src/DepthGame.ts` and `src/game/**` with `git show`, retaining the current policy, camera and presentation clock. It reads no other checkout and changes no branch. Distinct labels have distinct bundle paths, so concurrent baseline/candidate jobs cannot replace each other's code. `--workers=2` uses at most two pure Node child processes; default is one. It launches no browser or server.

All per-room results preserve zero-based depth, clear/death/stall status, simulation seconds, damage taken, outgoing damage by source, accepted slot uses and Overdrive uses. JSON summaries include completion, death room histogram, per-depth entry/clear denominators, room time/damage/Overdrive medians, source totals and median campaign clears per Overdrive. Legacy service auto-clears are recorded as zero-second rooms. The top-level `stats` and `final.stats` contain the authoritative run statistics.

Unknown options, unsafe labels, invalid rigs, non-uint32 seeds, invalid room limits and unsupported worker counts are rejected. There are no new dependencies. CLI timing is wall time under the measured machine load, not process CPU time or a graphics certificate.

## Matched native validation

Baseline game revision: `76e744ddae0d3dfc045614efb4b6efd6509ba9e7`, Arc seed **1729**, unassisted, all twenty story rooms. Native evidence: `artifacts/nextgen/playtest/i5-before-arc-1729/report.json`. Simulation evidence: `artifacts/nextgen/playtest/i5-sim-parity-arc-1729/arc-1729.json`; complete comparison: sibling `comparison.json`.

| Metric | Native browser | Node simulation |
|---|---:|---:|
| Outcome | Complete, 20 rooms | Complete, 20 rooms |
| Kills | 570 | 570 |
| Total damage dealt | 99,587.9511 | 99,587.9511 |
| Overdrives | 31 | 32 |
| Damage taken | 163.8597 | 136.6885 |
| Transmission seconds | 91.3167 | 91.3167 |
| Wall seconds | 580.75 | 23.8859 |

Fourteen of twenty room clear times match to the fixed step. All room damage observations through room 16 match; the simulation takes 12 additional damage in room 17 and 39.1712 less in the finale. Room time divergence remains in rooms 2, 8 and 17–20. Incoming damage totals differ by −16.6%; Overdrive uses by +3.2%. Median absolute relative room time error is zero, but that does not erase the late-room differences. Observed acceleration is **24.31×**, below the aspirational 50×. The simulation preserves 60 Hz physics rather than increasing step size to manufacture throughput.

The first three smoke rooms also clear on both backends: room times 13.4333 / 34.7000 / 36.7500 native versus 13.4333 / 37.8500 / 36.7500 simulated; damage taken 0 / 12.0973 / 10.1621 on both. The earliest detected trajectory divergence is a room-2 brute hit/knockback at policy decision 86 (elapsed 21.0167 seconds). This does not justify claiming bitwise native replay or exact death prediction. Native scene/model availability, zero-delta refresh timing and physical pointer dispatch still differ from the analytic observer. Retain the discrepancies when interpreting balance cohorts and require the final native campaigns.

`sim-compare.mjs` rejects mismatched rig, seed, assistance or graph before producing room-level comparison data. It keeps unmatched outcomes and all numerical differences. Tests repeat real opening combat with identical seeded authoritative results, verify earned resources and no opening Overdrive, and verify aggregation keeps death denominators instead of treating entered rooms as clears.

## Cohort commands and provenance

The controlled before/after experiment uses ten seeds for each rig: **1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456**. Breacher, Cryo, Pyro and Arc use the same policy and seed list. Root coordinates machine load and the separate native confirmations.

```sh
node scripts/nextgen/playtest/sim.mjs --label=i5-baseline-40 --game-revision=76e744d
node scripts/nextgen/playtest/sim.mjs --label=i5-charge-holdout-40
node scripts/nextgen/playtest/sim.mjs --rig=arc --seed=1729 --rooms=3 --trace --label=sim-pilot
node scripts/nextgen/playtest/sim.mjs --rig=arc --seed=1729 --legacy --assisted --label=sim-legacy
node scripts/nextgen/playtest/sim-compare.mjs native-report.json simulation-report.json comparison.json
npx vitest run scripts/nextgen/playtest/sim.test.mjs --maxWorkers=1
```

The two initial controlled cohort source copies match exactly:

- `source/sim-core.ts` SHA-256: `524026d2412a649c45ddcc057956159f36a5231b7945600460119be61d2ef526`
- `source/policy.mjs` SHA-256: `3a71094272e034b044e5e46cea11c76c768c93dbe134a4f78c2965850f7f4998`

`i5-sim-before` is an interrupted provisional policy cohort. `i5-sim-pilot` used fixed world aim; v2/v3/v4 pilot labels record the parity investigation. These are **not** the controlled baseline and must not enter before/after balance aggregation. Select only explicit final cohort labels. Source formatting and type annotations were normalized after the controlled cohort bundles were built; the immutable baseline/candidate copies above contain the identical pre-normalization policy implementation; these later changes do not change simulation decisions.

## Censored Transmission run and terminal diagnostics

`i5-charge-holdout-40/breacher-2026.json` reaches room 10 and stops at the existing 240-second room bound. This is a **censored navigation/policy failure**, not a death, campaign completion, or evidence that the encounter overpowered the marine. Do not add it to a death histogram or describe its censoring as difficulty.

A metadata-only copy of that cohort's immutable `source/sim-core.mjs` reproduced the run under `i5-stall-breacher-2026/`. The original saved bundle was not modified. The reproduction asserts deep equality of **all authoritative statistics, every room result, and the outcome** against the original campaign before writing diagnostics. `report.json.provenance` records that equality, the original bundle SHA-256 `c46a1ee6cac7c23ca8df8d9ffd7943a518994d3344f1dab37f4f44cb773bc210`, and the diagnostic copy's hash. The diagnostic module itself is retained in the new label's `source/` directory.

At the bound, the marine is stationary at **(1086.9349, 428.9947)**, health **100**, armor **59.4781**. One ordinary crawler remains at **(278.4816, 691.1328)** with **56.0479** health; it is stationary, occluded and offscreen (`clear:false`, `visible:false`). The last twenty decisions have no target, no actions, zero movement, and a navigation waypoint equal to the marine's current position. There has been no observed combat progress for **172.5 simulated seconds**. These observations establish the censoring mechanism, without changing navigation or the policy to rescue the run.

New simulation reports retain terminal `node`, `player`, `combat`, full enemy snapshots including champion/position/health/clear/visible fields, remaining threats, abilities, resources, the latest twenty decisions, and observed time since combat progress. The terminal reason remains `max-room-seconds`; `noCombatProgressOver45s` is an observation only. **No 45-second cutoff was added**, no movement/target/action decision changed, and current immutable cohorts continue with their original stopping rules. A new regression verifies a living, early-censored fight stays `stalled` with `deathRoom:null` and retains finite enemy coordinates and actionable terminal evidence. Final helper checks: four Vitest tests passed; standalone TypeScript check passed.
