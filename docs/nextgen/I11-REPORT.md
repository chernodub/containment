# I11 — wave 7 integration and acceptance

Branch `t3/wave7-integration-acceptance`. Frozen application **`a112e70154be57c77430d0ad5c61bd9e87ef90e1`**, distribution `artifacts/nextgen/i11/frozen-dist/`; descriptor `artifacts/nextgen/i11/frozen-source.json`. Application code is frozen; later commits affect evidence tooling, tests and documentation only. Final delivery HEAD is recorded in the final handoff.

**Converged delivery; qualified acceptance.** All captures, four campaigns, comparison pages and the twelve-image showcase are complete. Hardware acceptance is 77/80 trials. Blender-dependent asset gates, the three Freight/Breacher High tail misses and remaining art/framing/review coverage gaps are explicit below. The lead requested convergence after the current review batches; no further tuning, capture rounds or passed-gate reruns followed that instruction.

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

A later strict file-only review check found floating-point column duplication in the inherited contact-sheet scaler when copying already reduced tiles at 1:1. Native PNGs and standalone exact480 reductions were correct. I11 gallery, lighting, organic and storyboard sheets now copy those pixels directly at integer offsets. Nonuniform full-cell comparisons pass; corrected final sheets are reopened and separately witnessed. Earlier preflight contact pages remain historical visual observations, with their small blit defect explicit; they are not promoted to exact-pixel witnesses.

I11 rewrites/removes **no** presentation assertion. It adds capture configuration ordering/native-tier contracts, acid-family sharing/exact-once ownership, live-pool priority expiry/nonmutation and pure real-storyboard selection coverage. Stream-specific presentation replacements remain documented in [V7](V7-REPORT.md#presentation-pins-rewritten), [K7](K7-REPORT.md#verification-and-presentation-pin-replacements) and [E7](plans/E7-assertions.md). Gameplay, determinism, persistence, accessibility, native input, resizing/recovery and authored-room assertions remain intact.

## Frozen gates

`npm ci`:84 packages installed, lockfile unchanged. The final host-permitted two-worker JavaScript suite passes **346 files /3,852 tests**, with two pre-existing skips (3,854 total). Native model preview2/2; first three Python artifact stages pass. Full `npm run verify` then stops at unchanged monitor subprocess `FileNotFoundError: 'blender'`. Blender was not installed, per engineering. Service-finish independently retains the same missing-Blender error. An ignored worktree-local Python/Pillow13 environment runs the unaffected materials2/2, material-budget4/4 and bundle-runtime6/6 checks successfully; no asset/test was altered to bypass prerequisites.

Room evidence28/28 plus33 ragdoll checks, TypeScript/Vite build, desktop smoke, all20 authored rooms and native three-room bot smoke pass. Smoke has zero errors/defects and validates a real twelve-frame entry→clear selection. The required build reproduces all27 frozen JS/CSS asset hashes exactly. The later delivery verification includes the evidence-tool tests: 255.73s, load22.56→24.78, same missing-Blender stop. Its first sandboxed attempt failed Chromium/localhost permissions (18 suites), then the host-permitted rerun passed all JavaScript tests; both logs remain. Complete logs and host-load receipts: `artifacts/nextgen/i10/logs/i11-*`; chain `artifacts/nextgen/i11/gate-chain.json`.

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

All four single native seed1729 campaigns reached their natural terminal state, with **zero errors and zero soft-lock defects**. Cryo cleared twenty rooms; three rigs died naturally. There are no favorable reruns, assisted damage scaling, rendering skips, balance changes or legacy-room substitutions. Statistics below are fixed-step CPU submission evidence, excluded from hardware acceptance. Native cast events match authoritative Overdrive counters.

| Rig | Outcome | Clears / entered | Deaths | Overdrives | Cast intervals min / median / max s | Sampled loading holds / max ms | Room CPU p95 min / median / max ms | Runtime wall s | Host load1m start → end |
|---|---|---|---:|---:|---|---|---|---:|---|
|Breacher|Dead|15 / 16|1|11|33.6 / 55.8 / 87.9|15 / 711.7|4.2 / 7.1 / 9.8|616.5|11.4 → 19.9|
|Cryo|Complete|20 / 20|0|14|28.1 / 50.8 / 78.1|19 / 660.7|5.0 / 8.0 / 12.8|751.2|17.7 → 22.3|
|Pyro|Dead|16 / 17|1|11|30.5 / 46.1 / 58.8|16 / 640.4|5.9 / 8.4 / 18.8|568.5|18.5 → 48.7|
|Arc|Dead|17 / 18|1|13|33.5 / 39.3 / 76.6|18 / 675.4|6.8 / 9.0 / 23.2|703.6|47.2 → 60.5|

[Campaign summary](../../artifacts/nextgen/i11/campaign-summary.md), JSON, source reports, native inputs and traces retain every result. There are **71 organic mid-fight frames** (16 / 20 / 17 / 18): each rig has at least six across early and late rooms. All marine bounds/HUD overlaps, hero scale and AABB/hull receipts pass: hero100–124.9px at1080, maximum AABB outside17.2%. Four real first-room storyboards contain twelve distinct increasing entry→clear frames each; no fixture replay substitutes for a bot fight.

Aggregate campaign acceptance remains **false**. Fourteen organic selected-contact bound failures remain, and actual peripheral crops/remote-only fights were seen. A safe marine does not prove complete enemy-body fit or world-occlusion safety. Fifty zero-total renderer histories remain incomplete; the29 completed preparation receipts are371.5 /840.3 /1537.3ms min /median /max, none over3s. Sampled UI holds do not replace those histories. The isolated five-repeat room benchmark above supplies the complete preparation cohort, not these incomplete campaign observations.

All71 organic native originals,48 selected storyboard originals and their exact480 cells have actual-open/hash witnesses in `artifacts/nextgen/i11/campaign-review-coverage.json`. The four storyboard sheets and sixteen organic/storyboard480 pages were opened;46,267,200 cell channel comparisons pass. Details: [campaign review](plans/I11-campaign-review.md). Final galleries, comparison and showcase are complete. Visual review stopped at the lead’s convergence instruction; the archived witness bridge lists each reviewed and unreviewed frame rather than claiming exhaustive review.

The Queen (`reactor-vault`) is **legacy saves only**. New runs use the twenty-room story ending in the Overload Floor holdout; all Queen/legacy boss fixture cards are labeled and the showcase excludes them.

## Final galleries and Part B acceptance

Capture labels: `i11-1080-batch-00..27`, selected `i11-720` / `i11-720-lawful` / `i11-720-compact` batches, plus `i11-duration-1080` and `i11-duration-720`. Both final galleries contain **1,042 guarded native images**, including all 739 final4 frames and wave7 additions. Each has 174 exact480 review pages, native metadata and source receipts. All accepted captures have zero runtime errors and retain native action, phase, family, priority, marine/HUD/AABB and shader-compile guards. Two compact family fixture attempts failed before producing accepted PNGs; stricter full-body headroom and a larger lawful-origin search fixed the fixture without changing application code or reducing the twelve-body/five-family requirement. Failed raw PNGs/manifests/errors are preserved byte-for-byte at `artifacts/nextgen/i11/failures/compact-annulus-rejected/` and `compact-diagnostic-rejected/`; the earlier `i11-states1` raw failure remains intact.

| Standing check | Result and evidence |
|---|---|
| Family and rank identity | Improved brown segmented Brutes, olive Spitters, purple Carriers and small hooked families hold across ten lighting fixtures and status overlays. No white-pennant shell observed in reviewed live/frozen/elite/corpse images. Brute-heavy stress fixtures remain repetitive; tiny Crawler/Stalker detail is not equally recognizable in every480 view. `final5/review/k7-silhouettes-native.png`, `k7-silhouettes480.png`. |
| Rooms and lighting | Equipment-linked routes, grounded props and raised infestation establish places; nested court linework was replaced. Color sheet separates warm cargo/reactor, green maintenance and cold cryo/comms. Grayscale still groups several rooms around a common floor value. `final5/lighting-ten-color.png`, `lighting-ten-grayscale.png`. I10 hard luminance audit passes, but E7 target-band exceptions remain: canonical40 samples1080 median2/shadow20 misses;720 median4/shadow19. Full100 retained calm/combat phases1080 median7/shadow29,720 median15/shadow25. `i11/e7-value-band-exceptions.json` retains every value. |
| Four ultimate announcements | Eight native timeline scenarios per size add80 frames from activation through expiration in bright Annulus and dark Infested. Whiteout/Meltdown last8s; Overclock6s; all retain authoritative state assertions. Whiteout storm, orange Meltdown pack/jets and double Overclock echoes persist; Meltdown is less conspicuous in a melee. Railbreaker is an instantaneous native attack plus fading beam/debris, not a timed buff. Root opened all80 native1080 frames and14exact480 pages; gallery reviewer did the720 counterpart. |
| Friendly / hostile grammar | Valid friendly thin dashed blue outlines and invalid thin orange outlines remain geometrically distinct from hostile thick orange hatching/acid teeth. Preview is faint on bright floors at480. Native legacy pool preparation and persistent pool mask fix preserve hostile priority; no visual determines a hit. |
| Marine, rig modules and camera | All1,019 playing captures per size pass marine/HUD hard framing. Separate conservative selected-body flags remain118 at1080 /209 at720; Queen bounds77 each (legacy), exact concave hull exceptions1/4 are distinct from the18% AABB rule. Organic hero100–124.9px and max AABB17.2%; fourteen selected-contact failures remain. The35% raised-decoration share bound does not bound the entire low Annulus foundation. |
| Ordinary fights |71 organic mid-fight images across early/late rooms and four12-frame real bot storyboards retained. Critical HUD numerals remain readable with local backing; remote/peripheral contacts and actor overlap remain. See campaign table above. |
| Queen | All boss cards labeled **legacy saves only**; no Queen or stacked25-enemy stress fixture enters the showcase. New story ends in Overload Floor. |

Artifacts relative to this worktree:

- `artifacts/nextgen/final5/index.html` —1920×1080 gallery.
- `artifacts/nextgen/final5-720/index.html` —1280×720 desktop gallery.
- `artifacts/nextgen/final5/compare.html` and `before-after.png` —22 requested three-way rows. ORIGINAL lacks four requested slots (Breacher rig select, ending, Residential calm/combat); these are explicitly marked missing. FINAL4 and FINAL5 are present in every row.
- `artifacts/nextgen/final5/showcase.html`, `showcase.png`, `showcase.json` —twelve explicitly selected originals: four UI, two calm rooms and six ordinary campaign fights across all four rigs. Frozen hashes/organic receipts validated; no legacy boss/stress fixture.
- `artifacts/nextgen/final5/organic/index.html` —71 ordinary fights.
- `artifacts/nextgen/final5/play/index.html` and `{breacher,cryo,pyro,arc}-storyboard.png` —entry→clear storyboards.
- `final5*/review-witnesses/witness-bridge.json` —actual-open hashes and exact page-cell comparisons, with uncovered frames explicit. At lead convergence1080 both native+480 coverage965/1042;720 both native+480 coverage781/1042 (793 native originals,781 exact480 cells). The bridge receipt is authoritative. All119 organic/storyboard originals and their480 cells were reviewed separately. No unreviewed frame is represented as visually accepted.

First look (absolute paths):

1. `/Users/chernodub/.t3/worktrees/containment-game/t3-26ffbbf6/artifacts/nextgen/final5/showcase.png`
2. `/Users/chernodub/.t3/worktrees/containment-game/t3-26ffbbf6/artifacts/nextgen/final5/lighting-ten-grayscale.png`
3. `/Users/chernodub/.t3/worktrees/containment-game/t3-26ffbbf6/artifacts/nextgen/final5/review/k7-silhouettes480.png`
4. `/Users/chernodub/.t3/worktrees/containment-game/t3-26ffbbf6/artifacts/nextgen/final5/organic/arc-r8-breached-loading-bay-mid.png`
5. `/Users/chernodub/.t3/worktrees/containment-game/t3-26ffbbf6/artifacts/nextgen/final5/play/cryo-storyboard.png`
6. `/Users/chernodub/.t3/worktrees/containment-game/t3-26ffbbf6/artifacts/nextgen/final5/before-after.png`

### Per-room value table

Same I10 method: Rec.709-weighted sRGB PNG code values0–255, visible legal world-floor samples, no exposure normalization. Canonical calm and combat frame02. Target median50–80 and shadow p5 12–28; a table value is evidence, not a claim that every target passes. Full sample masks/counts and all phases are retained in `final5/luminance.json` and its720 counterpart.

| Room | Calm median / p5 | Combat02 median / p5 |
|---|---:|---:|
|awakening-bay|74.0 / 54.7|56.8 / 14.8|
|passenger-vault|68.3 / 43.8|67.3 / 16.4|
|residential-gallery|51.7 / 40.8|57.5 / 23.1|
|communal-atrium|61.0 / 31.7|52.7 / 26.6|
|crew-checkpoint|76.0 / 36.6|72.9 / 27.7|
|armory|71.9 / 56.3|76.5 / 31.2|
|freight-hold|79.0 / 66.0|70.2 / 30.7|
|breached-loading-bay|61.1 / 39.9|62.5 / 15.7|
|relay-racks|53.4 / 31.5|49.3 / 20.1|
|transmission-chamber|51.9 / 15.8|66.6 / 23.7|
|diagnostic-gallery|53.9 / 27.9|69.1 / 27.8|
|safety-interlock-station|52.4 / 33.4|55.8 / 25.1|
|coolant-plant|51.5 / 39.4|52.3 / 12.5|
|service-shaft-landing|54.5 / 28.3|62.0 / 22.8|
|infested-workshop|59.0 / 35.5|49.6 / 16.2|
|swarm-junction|55.0 / 34.2|58.9 / 29.4|
|shielding-gate|51.8 / 25.4|76.5 / 29.4|
|containment-annulus|51.7 / 25.8|60.1 / 19.3|
|manual-control-chamber|64.2 / 41.5|50.5 / 17.1|
|overload-floor|54.7 / 37.1|55.1 / 14.8|

## Cleanup and delivery

Removed all **58** intermediate `artifacts/nextgen/i11-*-batch-*` capture directories, releasing **7.49GiB**. Before deletion, every final native byte matched its source receipt; archived witnesses retain opened page PNGs, metadata, actual-open ledgers and all source manifests. Both bridges have **zero source-copy mismatches and zero receipt issues**. Failed parent evidence was copied and hash-verified into the failure archives above before removal. Final galleries, campaign reports/inputs/traces, benchmark data, frozen distribution and failure evidence remain. Receipt: `artifacts/nextgen/i11/cleanup-receipt.json`. No passed gate or hardware trial was rerun after the lead’s convergence instruction.

## Integration requests and honest remaining gaps

No blocking integration hook is requested from another owner. No gameplay/balance, persistence or accessibility assertion was weakened. The compact-only family fixture search became stricter; native1080 behavior and all guard minima remain unchanged. README/AGENTS and stream credits are factual, with existing third-party notices intact.

This is an integrated improvement, not an unqualified vision/AAA pass. The Freight/Breacher High tail misses, absent Blender verification, incomplete campaign preparation histories, remote/cropped contacts, broad Annulus foundation, tiny small-family detail, repetitive stress crowds/infestation, faint preview, common grayscale floor values, restrained Meltdown and sheet-like Whiteout remain. Title rifle grip/elbow/stance anatomy remains unchanged. Recommended next work is a separately scoped physics/impact-raycast profile optimization, encounter/body framing and landmark composition pass, and art-directed silhouette/value/preview refinement. Complete the missing Blender asset gates on a provisioned host. Do not infer hardware FPS from fixed-step campaign timing or screenshot capture speed.
