> Node-emulation v8 supersedes v7 acceptance evidence after fixing immediate grenade/ability-facing semantics, retained warning events/sync-corpse filtering, legacy pressure targets and native pre-burst censor order. Shared policy v3 remains frozen at e97cf06. See [I5-EMULATION-V8.md](I5-EMULATION-V8.md); matched corrected cohorts are pending.

> Historical development record. Current policy is catalog aiming v3, frozen at `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`; simulation mode `sim-policy-v7`, navigation observer v3. The current encounter profile is enabled. The default-off and unchanged-aim statements below describe earlier checkpoints only. Native and Node observations can diverge; final cohorts are identified in I5-REPORT.md and must never be pooled across policy/source epochs.

# I5 render-free campaign player

## Implementation and controls

`node scripts/nextgen/playtest/sim.mjs` bundles the actual `DepthGame` and game modules once with the installed Vite build API, then fights earned campaigns entirely in Node. It uses the same `policy.mjs` decisions as the browser player: targets, movement candidates, opportunity-based ability use, draft preferences, services and routes. No damage, resources, boons, Overdrive charge, enemy positions or completed rooms are injected. An explicitly requested legacy campaign starts at its canonical first node; assisted mode multiplies incoming damage by 0.15 and remains labeled separately.

Simulation updates use the native 60 Hz `GameFeel` clock and 250 ms policy decisions. The player preserves InputController's `y / .81` movement scaling, weapon/action order, held-screen pointer projection, native torso selection and the browser collector's extra three 66.667 ms hardest-moment samples. It imports shared camera spring/framing helpers and ability event presenters through a camera-only kit; geometry, particle, light and distortion operations are no-ops. Actor torso heights are measured from the real untextured GLB geometry with the same initial pose and scale, without DOM, GPU or image decoding. The player's projected body headroom correction follows the native renderer's correction.

A run's immutable bundle and script/policy copies are saved under its label's `source/` directory. Existing simulation labels are rejected rather than overwritten. Reports include HEAD, requested game revision, SHA-256 policy/game/bundle hashes and source snapshots for the principal gameplay files (initially four; later also EnemySystem and the tuning flag when imported). `--game-revision=<ref>` reads `src/DepthGame.ts` and `src/game/**` with `git show`, retaining the current policy, camera and presentation clock. It reads no other checkout and changes no branch. Distinct labels have distinct bundle paths, so concurrent baseline/candidate jobs cannot replace each other's code. `--workers=2` uses at most two pure Node child processes; default is one. It launches no browser or server.

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

## Controlled navigation observer revision

The first controlled navigation revision was **`i5-navigation-observer-v2`** (simulation mode `sim-policy-v3`). Its pilot cohorts later exposed additional censoring and are superseded by v3 below. Every policy revision requires a new matched baseline and candidate cohort; earlier cohorts and their censored outcomes stay separate. The hash now covers both `policy.mjs` and `bot-navigation.ts`, and the helper source is included beside each immutable bundle.

The new shared `botWaypoint(game, target)` observer first queries the original game navigator. An ordinary useful waypoint or a clear firing lane preserves its answer. An occluded waypoint within **45 units** is unusable for the unchanged policy's **90-unit** movement probes: standing can score better than every moving endpoint. Recovery first tries an independent **18-unit-clearance** `FacilityNavigation`, matching the marine's radius 16 plus two units. It never replaces or changes enemy navigation.

The recorded Transmission endpoint also exposes coarse grid sampling: a fresh original navigator and the independent 18-clearance navigator both return **(1072, 432)**, only **15.23 units** from the marine. A bounded finer observer grid therefore tries **16-unit** cells, then **8-unit** cells if needed. Each grid has at most **80,000 nodes**, searches only actual legal floor, validates every graph edge with `canTraverseExpedition(..., 18)`, and returns a directly traversable lookahead. Grid and distance data are cached per geometry in a WeakMap. The fixture's first recovered waypoint is **(744, 472)**, with a legal direct segment from the recorded marine position.

The helper is shared by Node simulation and browser debug observation. The target, movement scoring, 90-unit candidate construction, fixed movement speed, collision response, weapon/action selection, resources and game stopping rules are otherwise unchanged. Three navigation regressions establish a useful legal waypoint, a nonzero legal choice from the original `chooseMovement`, read-only authoritative state, repeatable observer results, and actual collision-checked `DepthGame` movement into a clear firing lane. The fixture advances five ordinary 50 ms simulation steps per decision and rejects any displacement above 55.001 units; it does not teleport the marine or enemy. Helper plus simulation tests: **7 passed**; standalone TypeScript check passed.


## Navigation observer v3: clear offscreen targets

A v2 candidate pilot, Breacher seed **65537**, stalled in Infested Workshop (room 15). The marine was stationary at **(56.1810, 822.0797)** with health/armor **100/100**; the remaining crawler at **(667.6870, 731.9520)** was `clear:true` but `visible:false`. The short-waypoint recovery had an incorrect clear-shot exemption. A target outside the camera is not selected for firing, so the unchanged movement policy still needs a useful approach waypoint even if a wall does not occlude the shot.

Revision **`i5-navigation-observer-v3`** removes that exemption. Useful ordinary waypoints and direct traversable routes remain unchanged; short waypoints are eligible for the existing legal refinement regardless of line of sight. The same `BOT_NAVIGATION_VERSION` constant is exported from `bot-navigation-version.mjs` and re-exported by the helper, with a typed declaration for TypeScript callers. Browser readiness requires that exact version. Simulation mode is `sim-policy-v4`; provenance copies and policy hashes include the helper and version module. No target selection, movement scoring, movement candidates, physics, resource, damage or timeout rules changed.

The Loading Bay pose exposed a separate short-turn problem. Cached and newly rebuilt observers both had a valid route, but the directly visible path ended before 45 units. A prototype that removed only the clear-shot exemption still censored Cryo1729; `i5-nav3-cache-probe/report.json` retains the exact geometry and cached/fresh waypoint diagnostics. Final v3 therefore evaluates the unchanged legal 90-unit direction probes using geodesic progress after the **actual 55-unit maximum movement** of one 250 ms policy interval. It applies InputController's `y / .81` scaling and diagonal normalization, checks the same six radius-19 occupancy samples, and validates the predicted body movement with real traversal geometry. The returned waypoint is an existing probe endpoint; movement still runs through ordinary input and collision. No short probe, teleport, resource change or enemy navigation change was introduced.

Ten navigation tests now cover all **eight distinct known terminal poses** retained from earlier tooling pilots: Transmission/Breacher2026, Workshop/Breacher65537, two Loading Bay/Cryo1729 poses, Relay/Arc2718, Interlock/Cryo8675309, Manual Control/Arc2718 and Relay/Breacher1729. Every pose first produces a nonzero legal move when the original navigator is supplied its recorded self-waypoint receipt, then reaches a close clear firing lane through ordinary collision-checked simulation steps and the unchanged movement policy. Candidate line-of-sight checks, six-sample probe legality, ability barriers and Loading Bay shotgun spacing match the real player. This includes the second v2 Loading Bay endpoint **(380.1290, 689.1721)** against crawler **(410.9105, 588.1950)**. No shorter movement probe or teleport was needed for these fixtures. Navigation plus simulation tests: **14 passed**; repository TypeScript check passed.

The v2 baseline/candidate pilots remain raw evidence with their censored or interrupted outcomes. They must not be pooled with the fresh matched v3 baseline/candidate cohorts or counted as gameplay deaths. The earlier Arc1729 native comparison remains a validation sample for the original policy and does not by itself certify the new routing revision.


Final-v3 isolated full-campaign proof: `i5-nav3-proof-cryo-1729-full/cryo-1729.json` completes **20/20** rooms, **536 kills**, **14 Overdrives**, **610.5233 damage taken**, **37.7366 wall seconds**. The formerly censored Loading Bay clears in **23.4167 simulated seconds**, and Transmission in **73.4000 seconds**. This is a tooling recovery proof, not a final balance cohort. Its policy SHA-256 is `e4e6c2e75850aa0a80052f082c748c64fa0e1ccc065cdca8f10747b5c5e2a8ff`. The earlier LOS-only prototype report `i5-nav3-proof-cryo-1729/` remains censored and must not be pooled with the frozen final-v3 policy.


## Default-off checkpoint and explicit experiments

The unaccepted encounter profile is disabled in `src/game/roguelike/i5Tuning.ts`. Default simulations measure production; `--tuning` replaces only the static flag in the copied game source before bundling. It leaves the working tree unchanged, records `tuningEnabled:true`, and includes the actual enabled flag source in the game hash and saved snapshots. Old revisions without the flag reject this option. Production, tuning and mixed-profile continuations are separate aggregation groups; reports from earlier epochs retain their historical keys. The disabled profile is reviewable evidence, not accepted balance. The original combat policy remains unchanged; see `I5-POLICY-LIMITS.md` for the pending scope choice.
