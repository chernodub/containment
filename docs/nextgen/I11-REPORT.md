# I11 — wave 7 integration and acceptance

Branch `t3/wave7-integration-acceptance`. Frozen application **`a112e70154be57c77430d0ad5c61bd9e87ef90e1`**, distribution `artifacts/nextgen/i11/frozen-dist/`; descriptor `artifacts/nextgen/i11/frozen-source.json`. Application code is frozen; later commits affect evidence tooling, tests and documentation only. Final delivery HEAD is recorded in the final handoff.

**Final visual/campaign evidence is in progress.** Integration and behavioral gates are complete. Hardware acceptance is qualified:77/80 trials pass; the three Freight/Breacher High frame-tail misses remain explicit.

## What shipped

- Ordered V7 → K7 → E7 integration: persistent ultimate states, common graphic combustion/steel debris, native cursor placement, five rebuilt family/rank anatomies, Queen/nests, four physical suit modules, exact native windup timing, equipment-tied floor details, raised infestation, ten lighting compositions and encounter-aware focus.
- A retained native acid shader family prevents the legacy Queen's first pool from compiling in combat. Live native pools also remain in the friendly-effect priority mask after their warning retires. Existing hazard geometry, lifetime, damage and native placement acceptance are unchanged.
- Capture options now configure before scenario combat guards and remain effective across native tier switches. Native campaign storyboards add read-only half-second observations; they advance no simulation and alter no bot inputs. File-only final5 assembly, exact480 reductions, comparisons, lighting sheets, source hashes and performance/campaign summaries reuse I10's method.
- No `src/game/**`, `src/DepthGame.ts` or renderer orchestration changes; no balance, save, navigation or accessibility changes. No computer-use, phone work, push, PR, sparse-checkout changes or other-worktree writes.

## Conflicts and resolutions

| Order | Source branch | Merge | Resolution |
|---|---|---|---|
|1|`t3/upgrade-ability-vfx`|`c9c9266`|Clean merge.|
|2|`t3/redesign-creature-character-art`|`17029e9`|Append conflicts in scenario registry and harness README retain all V7/K7 registrations and sections.|
|3|`t3/environment-art-camera`|`5fd899b`|The same two append conflicts retain V7/K7/E7. No renderer/test source conflict occurred.|

The merged registry has438 distinct scenarios before I11's additive probes. No side was discarded. Initial Git metadata access required the worktree-scoped sandbox escalation.

## Licensing

The file-only retained-license audit passes: four CC0 room kits and seven CC0 atlas inputs, with their shipped outputs/inventories rehashed. Those wave6 inventory/byte counts are not relabeled as new wave7 assets. Wave7 adds original code-authored anatomy/VFX/world work and credit text, no new runtime dependency or shipped third-party actor binary. The K7 rejected CC0 candidate remains a source-branch review-only evaluation; this task does not claim an independent rehash of its unshipped download. Retained model/animation, audio and self-hosted Barlow OFL notices remain. Audit: `artifacts/nextgen/i10/license-audit.json`.

## Two bounded critique/fix rounds

Detailed actual-open scope and findings: [I11-review](plans/I11-review.md). Initial combined family review passed40 frames/all ten compositions; every exact480 frame and all ten native phase02 room views were opened. The first sustained-state raw failure remains intact at `i11-states1`: the harness reapplied graphics after a fatal compile guard, and its failed old guard then contaminated later reset attempts. A separate trace isolated the settings transition. Configuring first preserves the unchanged guard;48/48 state/placement/hostile-priority frames then pass.

The second review found one genuine cold native Queen-pool shader and missing persistent-pool mask coverage. Preparation and live-pool priority fixes pass focused lifecycle/topology/expiry/nonmutation tests; the actual Queen pool then passes a fatal zero-program-creation guard. Forty combined status/rig/landmark frames pass. Existing crop/landmark/value/art limitations are retained rather than weakening hero/HUD/AABB or native actor/action assertions.

## Presentation assertions

I11 rewrites/removes **no** presentation assertion. It adds capture configuration ordering/native-tier contracts, acid-family sharing/exact-once ownership, live-pool priority expiry/nonmutation and pure real-storyboard selection coverage. Stream-specific presentation replacements remain documented in [V7](V7-REPORT.md#presentation-pins-rewritten), [K7](K7-REPORT.md#verification-and-presentation-pin-replacements) and [E7](plans/E7-assertions.md). Gameplay, determinism, persistence, accessibility, native input, resizing/recovery and authored-room assertions remain intact.

## Frozen gates

`npm ci`:84 packages installed, lockfile unchanged. The exact two-worker final JavaScript suite passes345 files /3,849 tests, with two pre-existing skips. Native model preview2/2; first three Python artifact stages pass. Full `npm run verify` then stops at unchanged monitor subprocess `FileNotFoundError: 'blender'`. Blender was not installed, per engineering. Service-finish independently retains the same missing-Blender error. An ignored worktree-local Python/Pillow13 environment runs the unaffected materials2/2, material-budget4/4 and bundle-runtime6/6 checks successfully; no asset/test was altered to bypass prerequisites.

Room evidence28/28 plus33 ragdoll checks, TypeScript/Vite build, desktop smoke, all20 authored rooms and native three-room bot smoke pass. Smoke has zero errors/defects and validates a real twelve-frame entry→clear selection. The required build reproduces all27 frozen JS/CSS asset hashes exactly. Complete logs and host-load receipts: `artifacts/nextgen/i10/logs/i11-*`; chain `artifacts/nextgen/i11/gate-chain.json`.

| Frozen command | Result | Wall seconds | Host load1m start → end |
|---|---|---:|---:|
|`npm run verify`|JS / model / first asset stages pass; stops at missing Blender|257.29|10.48 → 17.30|
|`npm run test:room-evidence`|Pass|0.98|17.30 → 17.30|
|`npm run build`|Pass; frozen hashes match|6.17|17.30 → 16.79|
|`npm run test:smoke`|Pass|92.27|16.79 → 11.58|
|`npm run test:authored-smoke:all`|Pass, all twenty rooms|101.37|11.58 → 11.94|
|`npm run playtest:smoke -- --storyboard-room=awakening-bay`|Pass, three natural room clears|79.00|11.94 → 15.47|

## Frozen performance

Native Apple M1 Pro10-core /32GB /ANGLE Metal,1920×1080 DPR1,25 replenished enemies and the native full kit,20 seconds per trial,five repeats. The fresh twenty-room full-Arc draw scan selected Relay Racks (highest) and Freight Hold (median); the latter differs from I10’s Crew Checkpoint median. No matched-before Freight cohort was run, so these data do not establish a causal regression or speedup against I10. Timings use its0.1ms reporting precision; raw values and stalls remain.

**77/80 trials and15/16 complete cases pass.** All80 frame medians are16.7ms; minimum High median adaptive scale.925; peak draws300≤330; combat program creations0. Freight/Breacher High p95 is24.2/23.7/24.9/18.3/18.5ms: its first three trials miss20ms. Their paired median scales are1/1/.95, so reduced detail does not explain the passing median. All Low cases meet the requested median limit. CPU p95 ranges up to22.6ms and raw maximum RAF842.4ms remain; this is not an every-frame60fps guarantee or a universal8ms CPU pass.

One owned benchmark browser, no capture/campaign/image-processing job. All533 ownership snapshots retain at most one owned automation browser and zero foreign automation browsers; the unrelated idle user Chrome process is recorded separately. Per-trial system load (not CPU utilization) is in the table and full JSON. Source/assets agree across every case. [Full tables/receipts](../../artifacts/nextgen/i11/performance.md), [chart](../../artifacts/nextgen/i11/performance.png), `benchmark-ownership.json` and all raw reports are retained.

| Room / rig / tier | Frame p50 all5 ms | Frame p95 all5 ms | CPU p95 range ms | Median scale range | Minimum scale | Load1m range | Draws peak | Combat compiles | Pass |
|---|---|---|---|---|---:|---|---:|---:|---|
| relay-racks/breacher/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18.1 / 18.2 / 18 / 18 | 9.9–11.1 | 0.925–1.000 | 0.900 | 9.9–16.2 | 300 | 0 | true |
| relay-racks/breacher/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18.1 / 18.1 / 17.9 / 17.9 | 7.8–8.6 | 1.000–1.000 | 1.000 | 9.9–15.1 | 178 | 0 | true |
| relay-racks/cryo/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 18.1 / 18 / 18 / 18.2 | 10.2–11.6 | 0.975–1.000 | 0.950 | 11.4–13 | 296 | 0 | true |
| relay-racks/cryo/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 17.9 / 18 / 17.9 / 17.9 | 7.7–8.2 | 1.000–1.000 | 1.000 | 11.9–13.6 | 170 | 0 | true |
| relay-racks/pyro/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18.1 / 18 / 17.9 / 18.1 | 11.2–11.9 | 0.950–1.000 | 0.950 | 11.5–14 | 297 | 0 | true |
| relay-racks/pyro/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18.2 / 18 / 18 / 17.9 | 8–8.5 | 1.000–1.000 | 1.000 | 10.9–13.5 | 174 | 0 | true |
| relay-racks/arc/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 17.9 / 18.1 / 18 | 9.2–10.4 | 0.950–1.000 | 0.950 | 9.8–11.7 | 271 | 0 | true |
| relay-racks/arc/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.7 / 18 / 18.1 / 18 / 18 | 7.3–7.5 | 1.000–1.000 | 1.000 | 9.6–12.8 | 163 | 0 | true |
| freight-hold/breacher/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 24.2 / 23.7 / 24.9 / 18.3 / 18.5 | 19–22.6 | 0.950–1.000 | 0.925 | 11.3–15.5 | 246 | 0 | false |
| freight-hold/breacher/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.2 / 18.1 / 18.2 / 18.2 / 18.2 | 12.3–21.6 | 1.000–1.000 | 1.000 | 13.9–17.1 | 146 | 0 | true |
| freight-hold/cryo/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.3 / 18.2 / 18.2 / 18.2 / 18.2 | 13.1–14.6 | 0.975–1.000 | 0.950 | 13.3–18.1 | 213 | 0 | true |
| freight-hold/cryo/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.2 / 18.1 / 18.1 / 18.1 / 18 | 8.8–11.1 | 1.000–1.000 | 1.000 | 12.2–16.1 | 137 | 0 | true |
| freight-hold/pyro/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.2 / 18.2 / 18.3 / 18.2 / 18.2 | 14.6–17.2 | 0.950–1.000 | 0.925 | 11.5–22.7 | 215 | 0 | true |
| freight-hold/pyro/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 18.1 / 18.1 / 18.1 | 9.7–11.3 | 1.000–1.000 | 1.000 | 13.9–22.7 | 134 | 0 | true |
| freight-hold/arc/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.2 / 18.2 / 18.1 / 18.1 / 18.1 | 11.4–14.3 | 0.975–1.000 | 0.950 | 13.9–25.4 | 206 | 0 | true |
| freight-hold/arc/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 18 / 18 / 18.1 / 18.1 | 8.3–10.3 | 1.000–1.000 | 1.000 | 21.7–33.3 | 129 | 0 | true |

| Preparation scope | n | Median ms | p95 ms | Worst ms |
|---|---:|---:|---:|---:|
|Public fresh/sequential readiness|210|749.4|1114.5|1533.9|
|Distinct inclusive preparation histories|320|819.5|1661.9|1707.9|

All five42-entry traversals pass; every room/mode median≤1500ms, public/inclusive worst≤3000ms, no incomplete total sentinels, post-readiness/combat program creations0. These include all20 story rooms and legacy Queen, with fresh pages and retained-session accumulation kept separate. Histories overlap and are not summed. Command durations /1-minute load start→end:86.1s /21.70→16.73;86.1s /16.73→13.14;86.8s /13.14→13.36;86.7s /13.36→13.16;86.3s /12.43→21.28.

Bounded diagnostic `i11-freight-profile` reproduces the tail (instrumented16.7/24.9ms, scale median1, draws205, programs0), with CPU/heap/GC tracing at a different host load27.9→22.8. It is excluded from acceptance. Samples expose substantial Rapier WASM work, animation and native raycasting/vertex-intersection allocations; maximum observed GC pause11.0ms. This is diagnostic localization, not proof that one function caused every failed frame. Refill-driver p95 in the failed ordinary trials is~.1ms. The frozen configuration is retained; a native physics/impact-raycast optimization needs a separately scoped change with the existing corpse/geometry/simulation contracts. No unsafe late tuning or favorable replacement cohort erases the three misses. Raw CPU/heap/trace files and `freight-profile-summary.json` remain.

The pre-freeze two-case risk probe passes requested conditions but overlaps file-only review preparation; it is not substituted for this isolated cohort. Its raw maxima/load remain in `i11-pre-freeze-risk/benchmark.json`.


## Native campaigns and final evidence

Pending. The Queen (`reactor-vault`) is **legacy saves only**. New runs use the twenty-room story ending in the Overload Floor holdout; the showcase excludes the Queen.

## Honest vision gaps

Preliminary combined review still finds economical procedural anatomy, tiny Crawler/Stalker detail at480, restrained Meltdown, sheet-like Whiteout, repeated infestation folds and machinery support rectangles. Saved Annulus/Cargo poses retain distant contact crops and a substantial low foundation: the tested35% raised-decoration bound is not universal whole-landmark share or full-fight visibility. R9's title-anatomy criticism is not changed by these three source branches. Final quantitative/galleries/campaign qualifications will be added after their actual runs.
