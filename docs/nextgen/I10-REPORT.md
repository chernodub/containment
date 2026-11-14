# I10 — wave 6 integration and acceptance

Branch **`t3/integrate-wave6-art-acceptance`**. Frozen application HEAD: **`a4d05a939c3e50072b59e0eaec662f57e1ba6ae0`**, distribution `artifacts/nextgen/i10/floor-r3-dist/`. The application is unchanged after the lead's convergence instruction; subsequent commits change only tests, fixtures, evidence tooling and documentation. Delivery HEAD is recorded in the final handoff and `artifacts/nextgen/i10/delivery-receipt.json`.

The complete frozen hardware matrix passes **80/80 trials**. An earlier same-build Infested/Pyro High trial misses adaptive scale (**.875**, target .90, trial load 83.26); it is retained below. All four campaigns finish without runtime errors or soft-locks. Required gate stages pass after one obsolete material-count test is corrected and rerun in isolation; the original full `verify` failure remains explicit. Both galleries contain **739 validated native frames**, with **78 organic frames** and completed comparisons/showcase. Visual acceptance is qualified: crowd/edge framing, some planar effects and simplified anatomy remain below the vision.

Local work only: no push/PR, other-worktree writes, computer-use, phone controls/captures/gates or simulation/balance changes. Desktop captures are1920×1080 and1280×720;480×270 images are file-only reductions. `src/game/**` and `src/DepthGame.ts` have no diff against0cfcecb.

## What shipped

- Ordered V6 → C6 → E6 integration over U7/0cfcecb: textured abilities/CC0 atlas, hero/room camera constraints, family-preserving freeze and small actors, recessed Queen organ, four CC0 kits, density/mood layers and illustrated title/ending/HUD/shop work.
- Native Start/Continue owns lazy kit/ability code, atlas decode/upload, room owners and shader warmup. Title/settings does not fetch those assets. Cancellation, graphics recovery, manual quality, Low and disposal are retained.
- High tagged gas volumes use one demanded half-size detached opaque-depth snapshot per frame, with an early alpha rejection. No opaque rerender/application draw; one NEAREST depth blit, approximately2.5MiB nominal1080p storage versus9.9MiB full-size. Direct legacy wafts/small tails retain atlas alpha, feathering and priority but yield depth attenuation. Low allocates none.
- Ability-side frozen/chilled ice is restricted to feet; actor anatomy remains authoritative. Overclock stamp edges feather radially and existing echoes use scan impressions. No added gameplay status or balance change.
- Joint camera/contact/room fitting preserves a100reference-pixel hero at1080 and18% playable-AABB outside area. Nearby/remote fitting uses physical bodies; bounded remote movement can spend composition padding, with strict full-body clearance retained. Threats retain native bearings until complete bodies clear the HUD/canvas. Queen uses the actual92-unit footprint. Exact concave-hull area is separately reported.
- CPU indexed vertical roof sampling retains exact Three.js triangle/material/matrix semantics and original fallback behavior, without uploading query geometry or changing rendered pixels. Tests cover all36 templates and ownership/bounds/custom policies.
- Three empty-deck rooms gain flush connected access covers/aprons/feeds in the existing floor pass: Residential, Crew Checkpoint, Transmission. Height≤.022m,140/52/90 triangles, no colliders/lights/extra floor draws. Named-floor gains are idempotent; Annulus circulation gets a bounded steel lift. Shaft floor panels gain one owned material/baked bucket while structural steel retains its authored material.
- Soft-depth trade evidence: [Cryo before](../../artifacts/nextgen/i10-depth-half-before/v2-full-cryo-relay-racks-relay-racks-03.png) / [after](../../artifacts/nextgen/i10-depth-half-after/v2-full-cryo-relay-racks-relay-racks-03.png), [Pyro before](../../artifacts/nextgen/i10-depth-half-before/v2-full-pyro-infested-workshop-infested-workshop-05.png) / [after](../../artifacts/nextgen/i10-depth-half-after/v2-full-pyro-infested-workshop-infested-workshop-05.png). All14 matched pairs were opened native+480 (56 files); earlier isolated sources65ddf6c/e697fb1 are labeled, not substituted for final acceptance. Half-size depth trades two-scene-pixel edge precision for lower copy/storage cost; legacy direct wafts yield depth attenuation while retaining alpha/feather/priority. No half-resolution particle-color-buffer claim.
- File-only licensing, source freezing, value sampling, galleries, exact-area review, actual-open witnesses, comparison and campaign/performance tooling retain failures and source hashes. Native kiting movement/priority guards were strengthened.

## Conflicts and resolutions

| Merge | Source branch | Local merge | Resolution |
|---|---|---|---|
|1|`t3/textured-ability-vfx`|`ddcb66d`|README/scenario append conflicts keep U7 and V6 sections/registrations.|
|2|`t3/camera-queen-actor-visuals`|`370f504`|Scenario append retains U7,V6,C6; renderer auto-merge inspected.|
|3|`t3/cc0-environment-art-kits`|`d427d87`|`.gitignore` retains isolated untrusted sources; README/public credits retain atlas and all four kits,one adaptation paragraph. Renderer auto-merge preserves all owners/camera logic. E6's explicit20-room authored command and development dependencies/notices remain.|

The initial unprivileged Git metadata write was sandbox-blocked and retried with worktree-scoped access. No side was discarded to resolve a conflict. No source archive was added or sparse checkout changed.

## Licensing audit

`node scripts/nextgen/i10-license-audit.mjs`:PASS. Four CC0 kits,seven CC0 atlas inputs; all shipped outputs/inventories rehashed. Retained Unity source PNGs rehashed; excluded downloaded source GLBs/Kenney originals are honestly marked unavailable for independent rehash,with their archived source receipts retained. Pack CREDITS/LICENSE/source links/output hashes are shipped and public credits/README list them. Original generated atlas patterns remain MIT; retained model/audio/font licenses stay separate.

Newly added public asset files:30 / **4,564,662bytes**;31 changed asset files total4,565,684bytes; net public growth4,564,967bytes. Four kit GLBs total1,250,124bytes; complete kit folders1,787,735bytes. Atlas PNG2,759,007bytes. No new art source archive is tracked. New conversion dependencies are development-only MIT with retained texts; runtime dependencies remain ThreeMIT/RapierApache2.0.

Publisher CC0 declarations were rechecked: [Space Station](https://kenney.nl/assets/space-station-kit),[Furniture](https://kenney.nl/assets/furniture-kit),[Nature](https://kenney.nl/assets/nature-kit),[Particle Pack](https://kenney.nl/assets/particle-pack),[Quaternius](https://quaternius.com/packs/scifiessentialskit.html),[author-uploaded Standard release](https://opengameart.org/content/sci-fi-essentials-kit),[Unity flipbooks](https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks). Quaternius's missing archive license is explicitly distinguished from the author's webpage dedication and canonical shipped CC0 text. Detailed audit/bytes/source hashes:`artifacts/nextgen/i10/frozen-license-audit.json`;notes:[plans/I10-licenses.md](plans/I10-licenses.md).

## Two critique→fix rounds and floor follow-up

Detailed earlier chronology and raw cohort labels are preserved in [I10-history.md](plans/I10-history.md), with image-review ledgers in `artifacts/nextgen/i10/critical-reviews/` and `i10/license-review/`. Prepared images are never counted as viewed. Reviews open both the original PNG and its exact480 derivative; a prior review may carry only when both byte hashes match an actually executed new-source capture.

The initial two critiques corrected offscreen nearby combat, double-height freeze, Overclock stamp edges, disappearing entering-body bearings and cold-title asset loading. Later organic campaigns exposed real near/remote camera failures. Saved matrices and physical actor dimensions produced constructive feasible witnesses; camera corrections retained100/18%, full body/HUD boundaries, native actions and motion bounds. An impossible720 Atrium conservative-box case remains explicitly qualified; actual head anatomy is below the HUD, and native bearings remain.

Final floor review found broad empty tile fields and dark named floors that were above the kit overlay. R1 added three flush deck compositions and adjusted six kit-only gains. R2 restored original material colors before every mood calibration, lifted Annulus circulation and adjusted named floors. R3 isolated actual shaft floor panels from structural steel, then calibrated Awakening, Atrium, Freight and Shielding without global exposure/effect/actor changes.

R1 architecture before/after was actually viewed in192 images across both sizes and both480 reductions. These are functional access/parking-like deck markings; they improve connections but do not establish authored recess depth or AAA room density. Some before/after actor poses differ and are labeled non-causal comparisons. R3 review is complete at both native sizes and exact480, with fresh-open and strict dual-hash bridge witnesses retained.

## Native floor evidence — R3, not hardware acceptance

Both complete160-frame preflights pass: `i10-floor-r3-1080/` and `i10-floor-r3-720/`, sourcea4d05a9, fixed adaptive resolution off. Each contains20 calm rooms and20 native Cryo kiting fights, four phases each. Errors/failures empty. All20 calm medians and all20 canonical combat02 medians are within the I9 floor50–80 band at both sizes.

| Native size | In-band medians /100 | Retained transient excursions |
|---|---:|---|
|1920×1080|96|Swarm combat01=81.0; Annulus03=81.6/04=81.1; Overload04=82.3|
|1280×720|99|Annulus combat03=81.5|

The100 measurements are20 calm phase02 plus all80 combat phases, not160 independent rooms. Source floor JSON/Markdown includes each room, percentile samples and same-hit floor material receipts. Partial art-audit exits1 because this preflight intentionally lacks32 identity-mask and2 arena samples; it is not a complete final-gallery gate. No floor evidence is missing. Native1080 has zero marine/scale/AABB/hull/missing-contact/selected-bound failures. Native720 retains six conservative selected-body/fit flags, while marine/scale/AABB/hull and missing-ID hard checks pass. Those flags are not silently removed.

Complete per-room tables: [1080 value structure](../../artifacts/nextgen/i10-floor-r3-1080/luminance.md) and [720 value structure](../../artifacts/nextgen/i10-floor-r3-720/luminance.md). Nominal shadow-p5 excursions remain19/100 at1080 and11/100 at720; the floor-median result does not imply every shadow percentile is in band.

The current-suit/Queen probe `i10-final-suit-queen-probe/` has12 native frames, errors/failures empty. Root actually opened phase02 and its480 reduction for Meltdown, Overclock and exposed Queen (six files); other phases are not claimed viewed. Meltdown shows a rear flame mantle on the current marine; Overclock shows electric scan/ghost traces. Queen sac/wall/lip has depth but retains a procedural bowl appearance. Opaque critical numerals remain legible in faded panels; orange hostile hatching has precedence.

## Standing art checks and combined camera audit

| Check | Result and limitation | Image evidence |
|---|---|---|
| Place/value structure | All20 calm and canonical combat02 room medians50–80 at both sizes; no near-black canonical room. Connected deck zones and kit anchors improve place identity. Broad empty circulation and purple flat fields remain. | Residential kiting03; Safety calm; both full per-room luminance tables above. |
| Marine/families/freeze | Pale helmet/shoulders, dark limbs and rifle read in bright/cool/warm views. Five families retain proportions and upper colors under local foot ice. Small families still need learned context; overlapping Brutes can obscure filled marine anatomy. | FullCryo/Infested06; family/frozen Annulus phases; organic Cryo/Manual19. |
| Sixteen abilities/four Overdrives | All16 have distinct staged phase sequences at480. Four Overdrive states are present; textured Pyro/current-suit states and hostile priority survive. Whiteout/Meltdown onset can feel modest; Railbreaker/Bulwark/echoes and some Cryo mist retain planar/card artifacts. | Complete seven-phase ability sets; fullPyro/Infested04; Overclock Annulus02; Whiteout bursts. |
| Organic framing/HUD | All78 marine/HUD/100-reference-pixel/AABB checks pass and numerals remain readable through fade. Selected enemy bounds fail20/78; real peripheral crops remain. | Organic Shielding17; Relay9; Transmission10; ArcAnnulus18. |
| Queen | Exposed pink core, dark inner wall and lip create visible depth. Shell/organ remain simple and bowl-like; climax lighting is subdued. Some appendage bounds meet the HUD/edge; the opening organ can partly pass behind the boss HP panel. | Queen exposed02; opening/closing/status bursts. |

File-only final-gallery integrity audits pass at both sizes. Every one of716 playing captures per size has complete marine/camera receipts, safe marine bounds, hero scale and18% playable-AABB results. This is **not** universal full-fight fit:

| Native size | Marine/hero/AABB failures | Selected-body / conservative-fit flags | Queen-body bounds flags | Exact concave-hull exceedances |
|---|---:|---:|---:|---:|
|1920×1080|0|107 /716|73|1|
|1280×720|0|151 /716|73|3|

Minimum hero height is100.0px at1080 and66.7px at720 (100.0 reference pixels). Maximum outside-AABB area is17.96% /17.69%; maximum exact concave-hull area is19.98% /20.22%.

Raw flags and images remain in each gallery's `framing-audit.json` and `art-audit/result.json`. Native bearings remain for entering/remote threats. No added overhead piece was observed covering the playfield in reviewed ordinary fights. A staged Atrium family view has an upright grate across the marine's side/leg area while helmet/torso/ring stay clear; therefore the stronger assertion that every E6 object is non-occluding in every pose is not met. Actor crowd overlap is a separate retained readability gap.

## Frozen hardware results

Applicationa4d05a9, frozen distribution`i10/floor-r3-dist/`; harness freeze commitd74ca14. One Chromium/ANGLE Metal browser on Apple M1 Pro10 logical cores,1920×1080 DPR1. All four native ability slots,25 replenished enemies,20 seconds per trial, five repeats per room/rig/tier. The20-room full-Arc draw ranking selected **Relay Racks (highest)** and **Crew Checkpoint (median)**. No other owned browser/profile/capture or image-preparation job was active. System load is not CPU utilization. Timings use I9 reporting precision0.1ms; raw values/stalls remain in JSON.

**80/80 trials passed** all requested frame/scale/draw/compile conditions;16/16 complete cases. High worstp9518.2ms, minimum High median scale.90, peakdraws289, zero combat shader creations. All framep50s16.7ms. Complete raw trials and actual per-trial load: `i10-frozen-bench-five/benchmark.json`; all five values per case/readiness table/chart: `i10/frozen-performance.{json,md,png}`.

| Room / rig / tier | Frame p50, all5 ms | Frame p95, all5 ms | Median scale min–max | CPU p95 min–max ms | Peak draws | Load1m min–max |
|---|---|---|---|---|---:|---|
| relay-racks/pyro/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 18.2 / 18 / 18.1 / 18 | 0.925–0.950 | 11.6–12.1 | 289 | 16.1–35.9 |
| relay-racks/pyro/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 18 / 17.9 / 18 | 1.000–1.000 | 8–8.6 | 175 | 15.1–18.5 |
| relay-racks/cryo/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 18 / 18 / 18.1 | 0.950–0.975 | 10.6–11.8 | 288 | 13.3–23.3 |
| relay-racks/cryo/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18 / 18 / 17.9 / 17.9 | 1.000–1.000 | 7.9–8.5 | 174 | 12.6–18.6 |
| relay-racks/breacher/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 17.9 / 17.9 / 18 / 17.9 | 0.925–0.950 | 9.9–11.9 | 279 | 13.3–19.6 |
| relay-racks/breacher/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 17.9 / 18 / 18 / 18 | 1.000–1.000 | 7.8–8.4 | 167 | 14.2–20.4 |
| relay-racks/arc/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 18 / 18 / 18 / 18 | 0.900–0.975 | 9.4–10.4 | 273 | 13.5–18.4 |
| relay-racks/arc/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 17.9 / 18 / 17.9 / 18 | 1.000–1.000 | 7.5–7.8 | 166 | 14.7–23.1 |
| crew-checkpoint/pyro/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18.1 / 17.9 / 17.9 / 18.1 | 0.925–0.950 | 13.3–14.2 | 222 | 14.6–22.0 |
| crew-checkpoint/pyro/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.8 / 18.1 / 17.9 / 17.9 / 18.1 | 1.000–1.000 | 9.6–10.9 | 138 | 13.7–16.7 |
| crew-checkpoint/cryo/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18 / 18.1 / 18.1 / 18 / 18 | 0.950–0.975 | 11.7–13 | 221 | 12.2–18.6 |
| crew-checkpoint/cryo/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18 / 18 / 18 / 18 | 1.000–1.000 | 8.4–9.3 | 143 | 15.7–18.8 |
| crew-checkpoint/breacher/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.2 / 18 / 18 / 18.1 / 18 | 0.900–0.975 | 12.1–13.7 | 228 | 13.1–18.8 |
| crew-checkpoint/breacher/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 18.1 / 18.1 / 18 / 18.1 / 17.9 | 1.000–1.000 | 9.5–11.6 | 146 | 10.5–13.1 |
| crew-checkpoint/arc/high | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 18 / 18 / 17.9 / 17.9 | 0.950–0.975 | 8.7–10.8 | 201 | 12.3–17.3 |
| crew-checkpoint/arc/low | 16.7 / 16.7 / 16.7 / 16.7 / 16.7 | 17.9 / 17.8 / 18 / 18 / 18 | 1.000–1.000 | 7.2–7.7 | 129 | 12.0–17.0 |

| Preparation scope | n | Median ms | p95 ms | Worst ms |
|---|---:|---:|---:|---:|
| Public fresh/sequential readiness | 210 | 763.9 | 1130.3 | 2018.5 |
| Distinct inclusive preparation histories | 320 | 829.9 | 1267.1 | 1954.6 |

All five42-case preparation repeats pass; all42 room/mode medians are≤1500ms, all public and inclusive worsts≤3000ms, no post-readiness/combat shader creation. Fresh pages and the same renderer retained through21 rooms are separate modes, including work after18 rooms. Histories are inclusive and not summed. No numerical speedup is claimed against profiles or different host loads. Room-audit command durations / one-minute host load start→end:85.1s /17.01→14.24;84.9s /14.24→18.37;83.5s /18.37→18.26;82.9s /18.26→13.78;83.0s /13.78→15.89.

**Retained miss on this same application:** the earlier ordinary Infested Workshop / Pyro High risk trial recorded frame16.7/18.1ms, median scale **.875 (<.90)**, peakdraws235, combat shader creations0; load before80.49/trial83.26/after86.72. Raw max frame908.7ms remains. It is not erased by the passing ranked-room matrix. No tuning followed the lead’s convergence instruction; the different-load diagnostic is not a controlled improvement. The lead explicitly accepts an honest miss. No all-room/all-load hardware guarantee is claimed.

CPU p95 above8ms and long RAF outliers remain visible in the full table; the earlier engineering aspiration is not reported as universally met. Sparse GPU feedback/recovery may prolong reduced scale; this remains a hypothesis, not proven contamination. CPU/cost and per-pass GPU diagnostics are excluded from acceptance; non-additive Metal pass percentiles are never summed.

## Gates, loading and campaigns

`npm ci` passed (84 merged packages). The frozen full `npm run verify` reached one obsolete G2 material-count pin: **329 files / 3,754 tests passed, one failed, one skipped**. The approved shaft floor material makes eight owners rather than seven. Test-only commit509534f replaces that pin with eight owners, exclusive floor ownership and preserved grain shader/cache hooks; the corrected file passes **2/2**. All bevel, fastener, connected-balcony safety and shielding-budget assertions remain.

Only the previously unrun chain stages were then executed: Node model preview **2/2**, all **eight Python asset stages**, room evidence **28/28 plus33 ragdoll checks**, build, native desktop smoke and **all20 authored rooms** passed. The native three-room playtest smoke passed once. The initial failed invocation is retained, not reported as a clean full-suite invocation. Focused capture-contract/canvas/movement checks pass55/55; bounded Breach packing checks pass77/77; family/corpse and final Annulus legal-seed checks pass89/89 plus TypeScript. Application JS/CSS and index hashes match the frozen build after the required build.

| Gate receipt | Exit | Seconds | Host1m load start → end |
|---|---:|---:|---|
| frozen-verify | 1 | 252.1 | 14.9 → 54.6 |
| frozen-g2-material-pin | 0 | 1.1 | 40.9 → 40.3 |
| frozen-model-preview | 0 | 0.5 | 35.8 → 35.8 |
| frozen-test-room-evidence | 0 | 1.1 | 31.8 → 31.8 |
| frozen-build | 0 | 6.5 | 31.8 → 35.9 |
| frozen-test-smoke | 0 | 88.7 | 35.9 → 38.3 |
| frozen-test-authored-smoke-all | 0 | 100.3 | 38.3 → 28.9 |
| frozen-playtest-smoke | 0 | 76.5 | 54.6 → 40.5 |

The local ignored Blender4.0.2 ARM64/Pillow13.0.0 prerequisites have receipts under `i10/tools/`; no asset/test was altered to bypass them. Desktop smoke retains keyboard/mouse, focus, resize, context loss/restore, checkpoint/cross-tab/failure feedback, Continue, credits and audio checks. Overload retains explicit fatal authorization. No phone gate was added or run.

Frozen loading audit `i10/loading-frozen.json`:PASS, errors/failures empty, fresh native UI flow. HTTP requests66→66; JS requests17→17; decoded JS4,914,384→4,834,356 bytes (−80,028); gzip9 estimate1,653,100→1,626,282 (−26,818), not negotiated transfer size. CSS154,040 bytes unchanged. New kit/atlas/code owners are absent on title and await native Start readiness. Menu readiness2,047.7→2,156.0ms is one observation, not a speed claim. Completed-body cancellations are distinguished from incomplete requests; baseline public bodies match original blobs.

One full unassisted seed1729 campaign per rig, native mouse/keyboard and every fixed simulation tick rendered. No campaign rerun or balance change. The campaign browser ran alongside one capture browser, after hardware benchmarking closed. Fixed-step frame times below are CPU submission, not GPU completion or hardware FPS.

| Rig | Outcome / clears / entered | Deaths | Errors / defects | Overdrives | Interval median / max, simulated s | Room CPU p50 median / worst p95, ms | Organic frames |
|---|---|---:|---:|---:|---:|---:|---:|
| breacher | dead / 17 / 18 | 1 | 0 / 0 | 12 | 58.2 / 75.7 | 5.2 / 16.2 | 18 |
| cryo | complete / 20 / 20 | 0 | 0 / 0 | 14 | 56.5 / 88.9 | 5.2 / 13.0 | 20 |
| pyro | complete / 20 / 20 | 0 | 0 / 0 | 14 | 38.7 / 49.8 | 6.1 / 17.0 | 20 |
| arc | complete / 20 / 20 | 0 | 0 / 0 | 16 | 43.9 / 58.7 | 5.7 / 10.0 | 20 |

Campaign command-wall times / host1m load start→end: Breacher716.1s /31.03→45.45; Cryo777.2s /45.45→130.26; Pyro800.3s /130.26→74.30; Arc738.9s /74.30→91.18. No hardware FPS claim is made under these concurrent-capture conditions.

All four runtime campaigns pass, with zero reported errors/soft-lock defects. Actual cast events match authoritative Overdrive counters. All78 original mid-fight images plus snapshots/hashes are in `final4/organic/`; every rig has≥6 and spans early and late rooms. All78 have safe marine bounds, no marine/HUD overlap, hero-scale and AABB rules met; selected-enemy conservative bounds fail20/78, and real peripheral/head crops remain. Root actually observed a top-edge Spitter crop in Breacher Shielding17 and remote-only fights in Relay/Transmission. Native bearings remain. The aggregate campaign acceptance remains **false** because it retains these framing qualifications and incomplete preparation timing receipts; `runtimeAccepted=true` is not relabeled as universal visual acceptance.

| Rig | Policy-sampled holds / max ms | Complete renderer totals / incomplete sentinels | Recorded median / worst ms |
|---|---:|---:|---:|
| breacher | 16 / 666.1 | 7 / 13 | 867.2 / 1443.8 |
| cryo | 17 / 668.2 | 8 / 14 | 783.0 / 1248.1 |
| pyro | 18 / 665.3 | 8 / 14 | 719.6 / 1339.6 |
| arc | 20 / 671.0 | 8 / 14 | 697.0 / 1276.8 |

UI polling can miss short holds. Renderer histories retain55 zero/unrecorded-total sentinels across86 distinct histories; these are incomplete observations, never zero-cost readiness. The complete isolated210-row preparation audit above supplies the actual five-repeat budget certification. Raw campaign reports/traces and all per-room CPU quantiles are linked by `i10/campaign-summary.{json,md}`; `i10/frozen-campaign-compact.json` contains only bounded summary fields.

## Presentation assertions rewritten or extended

1. U5 projection scratch1→two persistent panel/danger owners, reused100 ticks; original fading/context/pointer guarantees retained.
2. Impossible forced remote zoom→physical full-body fit OR native readable bearing, preserving hero100/room18%, strict marker/contact integrity and motion bounds. All128 camera tests retain previous safety assertions plus actual near/remote saved regressions.
3. Family/mask fixtures use legal C6 body packing, existing76 spacing/min12/all five families; exact-pixel masks disable adaptation only. Kiting retains all native casts, projectiles,12 visible bodies/phase, spacing and elapsed time; consecutive native movement is stronger than the prior origin-only check. Manual/Relay use legal west approaches, with extra boundary tests.
4. Full-height frozen shell→22%-height frozen/≤~18% chilled foot fringe; pool/status/cap/expiry/Low guarantees retained.
5. Debug presentation mocks now assert the actual boundary call; no gameplay/native assertion removed. Corpse search uses a legal interior crop with exact13 deaths/10 retained bodies unchanged.
6. Detached half-depth tests cover ceil dimensions, once/frame, demanded warmup, MRT restoration, framebuffer ownership, tier/context/disposal and no Low allocation. Rejected extra-depth-render prototype and its new tests were removed together; original room guarantees restored.
7. Adaptive GPU operating target16.5ms is a prior quality/latency calibration, not a speed claim. Dwell/min/max/manual/Low/stall behavior and external16.7/20ms targets remain. Current scale miss is retained; the lead accepts an honest miss without further tuning.
8. Void silhouette palette fallback is diagnostic-only and requires native actor≥100, darkened≥30, background/full-DPR/GL0/compile0 proof; normal multi-color guards remain.
9. Annulus old unchanged-circulation-color pin→bounded steel lift plus repeat/idempotence; shader/hooks/material count unchanged. Shaft browser baked-bucket pin8→9 and G2 manufactured material pin7→8 with separate floor ownership/authored8 and unchanged grain shader/cache key; original three visits, source/texture/shared-disposal/exact-once assertions retained.

10. Capture's old center90%/80% point-visibility preference is replaced by mandatory actual eight-corner marine body/HUD clearance, viewport/receipt agreement, hero100 and room18% checks on every playing frame. A saved Pyro/Infested pose proves the old point flag false while its physical body is fully clear. Raw flags remain unchanged; the guard is strengthened physically, not removed. Opt-in `--failure-evidence` saves same-task assertion snapshots. All native actions, actor minima, phase/priority/GL checks remain.
11. Family fallback preserves105 hero reserve,76 spacing,15 requested actors, five families and minimum12. Only insufficient placements use bounded hex/matrix packing; Annulus establishes nearby legal threats before production camera fitting. Corpse fixtures retain13 actual deaths/10 retained bodies. Failed native trials are preserved; no time advance or application-camera override was added.

Merged stream pins are documented in [V6](V6-REPORT.md),[C6](C6-REPORT.md),[E6](E6-REPORT.md). No gameplay, deterministic simulation, save, accessibility or desktop safety assertion was removed.

## Final gallery delivery

- [1080 gallery](../../artifacts/nextgen/final4/index.html): 739 original1920×1080 PNGs,142 phase sheets.
- [720 gallery](../../artifacts/nextgen/final4-720/index.html): 739 original1280×720 PNGs,142 phase sheets.
- [Organic evidence](../../artifacts/nextgen/final4/organic/framing-audit.json):78 native mid-fight screenshots, snapshots and source hashes.
- [Three-way comparison](../../artifacts/nextgen/final4/compare.html), [before/after sheet](../../artifacts/nextgen/final4/before-after.png), [12-image showcase](../../artifacts/nextgen/final4/showcase.html).

Each size reuses160 accepted-source floor captures and adds579 remaining final3/wave6 frames. All application asset hashes and frozen source SHA agree. Failed raw parents remain immutable. Completed-scenario subsets retain their failed parent's manifest SHA and errors, require every phase and successful native burst receipt, and exclude the entire failed scenario. Only failed scenarios were recaptured. The final720 Annulus retry passes16/16; the previous37 passing frames were retained unchanged.

All final native images and exact480 derivatives have actual-open witnesses or strict byte-identical bridges to such witnesses. `i10/final-review-coverage.json` rehashes the originals and both byte streams of every witness chain: **739/739 at each size,1478 total,zero missing**. Root separately viewed all78 organic pairs, all25 comparison rows and the12 showcase originals/reductions/contact sheet. The file-only local-link audit passes3704 gallery href/src references; report-local links also resolve. Detailed findings: [root](plans/I10-final-root-review.md), [abilities](plans/I10-final-soft-review.md), [UI/world](plans/I10-final-ui-world-review.md), [camera/acceptance](plans/I10-final-review-acceptance.md).

Derived silhouette inspection is also complete:40 black-native/black480 pairs and four comparison boards, with124 source/derived/board hash checks and zero mismatches (`i10/critical-reviews/frozen-derived-silhouettes-acceptance.json`). Normal/frozen families retain their external proportions and Queen has a distinct giant form. Small720→480 Crawler/Stalker fine parts and actual occluded Stalker fragments remain weaker evidence. This expert inspection is not a blind recognition-rate study; black masks cannot establish internal organ depth, status color or marine crowd readability.

The three-way comparison uses only actual source PNGs from the read-only Original/final3 galleries. Four Original views are explicitly missing: rig select, ending, Residential calm and combat. Historical Results/dead and boss calm/arrival substitutions are labeled. Differing camera/poses prevent a controlled quality/performance claim.

Inspect first (paths relative to this report; each is an original native PNG):

1. [Residential kiting03](../../artifacts/nextgen/final4/combat-kiting-residential-gallery-03.png).
2. [Full Pyro / Infested04](../../artifacts/nextgen/final4/v2-full-pyro-infested-workshop-infested-workshop-04.png).
3. [Full Cryo / Infested06](../../artifacts/nextgen/final4/v2-full-cryo-infested-workshop-infested-workshop-06.png).
4. [Queen exposed02](../../artifacts/nextgen/final4/g5-queen-exposed-silhouette-reactor-vault-02.png).
5. [Title](../../artifacts/nextgen/final4/title.png).
6. [Ending](../../artifacts/nextgen/final4/complete-fixture.png).
7. [Organic Arc / Annulus18](../../artifacts/nextgen/final4/organic/arc-r18-containment-annulus-mid.png).
8. [Organic Breacher / Shielding17](../../artifacts/nextgen/final4/organic/breacher-r17-shielding-gate-mid.png).

## Honest vision gaps and R8 disposition

C1/C8: Room compositions, connected floor layers and mood/value calibration improve place identity, but flat access markings, broad showroom-like habitation floors and repetitive purple infestation membranes remain. Transient floor medians81–82.3 and nominal shadow-percentile exceptions are recorded. C2: U7 title/ending remains stylized/schematic. C3: Larger hero and bounded room framing improve combat; conservative720 body/HUD conflicts, exact concave-hull differences and some remote anatomy bounds remain explicit. C4: Opaque critical numerals preserve fade readability. C5: Frozen families keep upper anatomy/colors; actor overlaps still merge. C6: Queen recess has anatomy-like depth but clean procedural cups/plates and subdued climax lighting. C7/C9: Textured Pyro and persistent Overdrive states improve announcements, while Meltdown rear mantle, restrained Whiteout and generic Overclock ghosts remain economical approximations. Discrete rectangular Cryo mist-card edges are visible in some native danger views; no blanket no-sheet claim is made. C10: Small Crawler/Stalker families still benefit from learned context at480. C11: Grounded Bulwark/Glacier retain repeated geometric primitives. C12: U7 shop cleanup remains intact.

Heavy Atrium can overlap a Brute and marine upper body, making the ring the strongest480 cue; body-only crowd recognition is qualified. No claim of uninterrupted actor visibility through all world objects follows from camera bounds alone. No balance change was made for campaign success. Integration requests for other files: none. Application tuning is closed. Recommended follow-up is a separately scoped art/framing pass for these retained gaps, plus preparation-timing observability; this handoff does not promise another tuning wave.
