# I10 — wave 6 integration and acceptance

Branch `t3/integrate-wave6-art-acceptance`. Application under investigation: **`a4d05a939c3e50072b59e0eaec662f57e1ba6ae0`**, frozen in `artifacts/nextgen/i10/floor-r3-dist/`. **Acceptance remains in progress: the first ordinary risk trial failed median adaptive scale (.875 against .90).** The lead directed convergence after the current fixes: application tuning is closed, all remaining cases will run once, and any misses will be reported with load. Final hardware tables, campaigns, complete galleries and final gates must be completed on this frozen application before handoff. Earlier measurements below are explicitly historical.

Local work only: no push/PR, other-worktree writes, computer-use, phone controls/captures/gates or simulation/balance changes. Desktop captures are1920×1080 and1280×720;480×270 images are file-only reductions. `src/game/**` and `src/DepthGame.ts` have no diff against0cfcecb.

## What shipped

- Ordered V6 → C6 → E6 integration over U7/0cfcecb: textured abilities/CC0 atlas, hero/room camera constraints, family-preserving freeze and small actors, recessed Queen organ, four CC0 kits, density/mood layers and illustrated title/ending/HUD/shop work.
- Native Start/Continue owns lazy kit/ability code, atlas decode/upload, room owners and shader warmup. Title/settings does not fetch those assets. Cancellation, graphics recovery, manual quality, Low and disposal are retained.
- High tagged gas volumes use one demanded half-size detached opaque-depth snapshot per frame, with an early alpha rejection. No opaque rerender/application draw; one NEAREST depth blit, approximately2.5MiB nominal1080p storage versus9.9MiB full-size. Direct legacy wafts/small tails retain atlas alpha, feathering and priority but yield depth attenuation. Low allocates none.
- Ability-side frozen/chilled ice is restricted to feet; actor anatomy remains authoritative. Overclock stamp edges feather radially and existing echoes use scan impressions. No added gameplay status or balance change.
- Joint camera/contact/room fitting preserves a100reference-pixel hero at1080 and18% playable-AABB outside area. Nearby/remote fitting uses physical bodies; bounded remote movement can spend composition padding, with strict full-body clearance retained. Threats retain native bearings until complete bodies clear the HUD/canvas. Queen uses the actual92-unit footprint. Exact concave-hull area is separately reported.
- CPU indexed vertical roof sampling retains exact Three.js triangle/material/matrix semantics and original fallback behavior, without uploading query geometry or changing rendered pixels. Tests cover all36 templates and ownership/bounds/custom policies.
- Three empty-deck rooms gain flush connected access covers/aprons/feeds in the existing floor pass: Residential, Crew Checkpoint, Transmission. Height≤.022m,140/52/90 triangles, no colliders/lights/extra floor draws. Named-floor gains are idempotent; Annulus circulation gets a bounded steel lift. Shaft floor panels gain one owned material/baked bucket while structural steel retains its authored material.
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

Publisher CC0 declarations were rechecked: [Space Station](https://kenney.nl/assets/space-station-kit),[Furniture](https://kenney.nl/assets/furniture-kit),[Nature](https://kenney.nl/assets/nature-kit),[Particle Pack](https://kenney.nl/assets/particle-pack),[Quaternius](https://quaternius.com/packs/scifiessentialskit.html),[author-uploaded Standard release](https://opengameart.org/content/sci-fi-essentials-kit),[Unity flipbooks](https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks). Quaternius's missing archive license is explicitly distinguished from the author's webpage dedication and canonical shipped CC0 text. Detailed audit/bytes/source hashes:`artifacts/nextgen/i10/license-audit.json`;notes:[plans/I10-licenses.md](plans/I10-licenses.md).

## Two critique→fix rounds and floor follow-up

Detailed earlier chronology and raw cohort labels are preserved in [I10-history.md](plans/I10-history.md), with image-review ledgers in `artifacts/nextgen/i10/critical-reviews/` and `i10/license-review/`. Prepared images are never counted as viewed. Reviews open both the original PNG and its exact480 derivative; a prior review may carry only when both byte hashes match an actually executed new-source capture.

The initial two critiques corrected offscreen nearby combat, double-height freeze, Overclock stamp edges, disappearing entering-body bearings and cold-title asset loading. Later organic campaigns exposed real near/remote camera failures. Saved matrices and physical actor dimensions produced constructive feasible witnesses; camera corrections retained100/18%, full body/HUD boundaries, native actions and motion bounds. An impossible720 Atrium conservative-box case remains explicitly qualified; actual head anatomy is below the HUD, and native bearings remain.

Final floor review found broad empty tile fields and dark named floors that were above the kit overlay. R1 added three flush deck compositions and adjusted six kit-only gains. R2 restored original material colors before every mood calibration, lifted Annulus circulation and adjusted named floors. R3 isolated actual shaft floor panels from structural steel, then calibrated Awakening, Atrium, Freight and Shielding without global exposure/effect/actor changes.

R1 architecture before/after was actually viewed in192 images across both sizes and both480 reductions. These are functional access/parking-like deck markings; they improve connections but do not establish authored recess depth or AAA room density. Some before/after actor poses differ and are labeled non-causal comparisons. R3 new-source native review remains to be completed before final gallery certification.

## Native floor evidence — R3, not hardware acceptance

Both complete160-frame preflights pass: `i10-floor-r3-1080/` and `i10-floor-r3-720/`, sourcea4d05a9, fixed adaptive resolution off. Each contains20 calm rooms and20 native Cryo kiting fights, four phases each. Errors/failures empty. All20 calm medians and all20 canonical combat02 medians are within the I9 floor50–80 band at both sizes.

| Native size | In-band medians /100 | Retained transient excursions |
|---|---:|---|
|1920×1080|96|Swarm combat01=81.0; Annulus03=81.6/04=81.1; Overload04=82.3|
|1280×720|99|Annulus combat03=81.5|

The100 measurements are20 calm phase02 plus all80 combat phases, not160 independent rooms. Source floor JSON/Markdown includes each room, percentile samples and same-hit floor material receipts. Partial art-audit exits1 because this preflight intentionally lacks32 identity-mask and2 arena samples; it is not a complete final-gallery gate. No floor evidence is missing. Native1080 has zero marine/scale/AABB/hull/missing-contact/selected-bound failures. Native720 retains six conservative selected-body/fit flags, while marine/scale/AABB/hull and missing-ID hard checks pass. Those flags are not silently removed.

Complete per-room tables: [1080 value structure](../../artifacts/nextgen/i10-floor-r3-1080/luminance.md) and [720 value structure](../../artifacts/nextgen/i10-floor-r3-720/luminance.md). Nominal shadow-p5 excursions remain19/100 at1080 and11/100 at720; the floor-median result does not imply every shadow percentile is in band.

The current-suit/Queen probe `i10-final-suit-queen-probe/` has12 native frames, errors/failures empty. Root actually opened phase02 and its480 reduction for Meltdown, Overclock and exposed Queen (six files); other phases are not claimed viewed. Meltdown shows a rear flame mantle on the current marine; Overclock shows electric scan/ghost traces. Queen sac/wall/lip has depth but retains a procedural bowl appearance. Opaque critical numerals remain legible in faded panels; orange hostile hatching has precedence.

## Hardware investigation — frozen configuration

`i10-final-risk-five/benchmark.json` on sourcea4d05a9 stopped after the first ordinary20-second Pyro High / Infested Workshop trial. One Chromium/ANGLE Metal browser, Apple M1 Pro10 logical cores,1920×1080 DPR1, all four ability slots,25 replenished enemies (observed23–28). No other agent-owned browser was active.

| Metric | Trial | Requirement |
|---|---:|---:|
|Frame p50 / p95|16.7 /18.1ms|≤16.7 /20ms|
|Median adaptive scale|**.875**|≥.90|
|CPU update+render p50 / p95|9.3 /14.2ms|Old8ms engineering aspiration retained separately|
|Peak application draws|235|≤330|
|Combat shader creations|0|0|
|GPU median / p95|12.36 /24.05ms|Diagnostic context, not independent pass costs|
|Host1m load before / trial / after|80.49 /83.26 /86.72|Recorded, not CPU utilization|

Raw max frame908.7ms is retained. The median adaptive-scale failure is not accepted by pointing to good frame time. Main80-trial, five room-preparation runs, final loading/gates and complete final campaigns were not executed by that stopped driver. `accepted-source.json` was withdrawn and archived as `floor-r3-visual-only-hardware-failed-source.json`. CPU and GPU diagnostics must remain ineligible for ordinary acceptance. No target/minimum-scale clamp is authorized as a substitute for measuring the rendering cost.

Historical sourceaa37ea0 had80/80 ordinary trials passing (High worst p9518.3ms, median scale≥.90, peak297draws, shader creations0; load10.1–30.5), but it precedes the final camera/floor changes. Its210 public room preparations had median825.7ms/max2041.5ms; the sequential Swarm per-case median1631.6ms exceeded the1.5s typical target. These tables are preserved in `i10/quality-accepted-performance.*` and [history](plans/I10-history.md); they do not certify the current application.

## Gates and campaigns — final rerun pending

`npm ci` passed for the merged84 packages. Historical settled-source9a79799 full `npm run verify` passed:325 files /3723 tests (two skipped), Node model preview2/2, all eight Python asset stages, build, room evidence28+33 ragdoll checks, native desktop smoke and all20 authored rooms. Later camera/floor/tool changes require the final full chain. Scoped R3 floor/lifecycle77 tests, actual browser texture-lifecycle test, TypeScript and diff checks passed. All gameplay, persistence, keyboard/mouse, resize, context recovery, checkpoint feedback and authored-room assertions are retained.

The local ignored test prerequisites have receipts: official Blender4.0.2 ARM64 and Pillow13.0.0. No asset/test was altered to bypass the Python stages. The user's explicit full-verify instruction takes precedence over the older engineering document's no-install guidance.

Historical source2d644e1 complete unassisted campaigns: Breacher died after19 clears/20 entered; Cryo completed20. These terminal outcomes are retained, with zero reported errors; the remaining rigs were not run on that source. A still earlier AA Breacher campaign was deliberately interrupted on a real camera defect and is never reported as complete. Final-source four-rig campaigns, Overdrive cadence, preparation holds, frame statistics and≥6 early/late organic images per rig remain pending. Fixed-step campaign timings are CPU submission evidence, not hardware FPS.

Historical9a loading audit passed66→66 HTTP requests,17→17 JS requests, decoded JS4,914,384→4,833,843 bytes; the new code/atlas/kits were absent on title. These figures need new-source confirmation. Baseline bodies match original blobs; readiness measurements are individual observations, not speedup claims.

## Presentation assertions rewritten or extended

1. U5 projection scratch1→two persistent panel/danger owners, reused100 ticks; original fading/context/pointer guarantees retained.
2. Impossible forced remote zoom→physical full-body fit OR native readable bearing, preserving hero100/room18%, strict marker/contact integrity and motion bounds. All128 camera tests retain previous safety assertions plus actual near/remote saved regressions.
3. Family/mask fixtures use legal C6 body packing, existing76 spacing/min12/all five families; exact-pixel masks disable adaptation only. Kiting retains all native casts, projectiles,12 visible bodies/phase, spacing and elapsed time; consecutive native movement is stronger than the prior origin-only check. Manual/Relay use legal west approaches, with extra boundary tests.
4. Full-height frozen shell→22%-height frozen/≤~18% chilled foot fringe; pool/status/cap/expiry/Low guarantees retained.
5. Debug presentation mocks now assert the actual boundary call; no gameplay/native assertion removed. Corpse search uses a legal interior crop with exact13 deaths/10 retained bodies unchanged.
6. Detached half-depth tests cover ceil dimensions, once/frame, demanded warmup, MRT restoration, framebuffer ownership, tier/context/disposal and no Low allocation. Rejected extra-depth-render prototype and its new tests were removed together; original room guarantees restored.
7. Adaptive GPU operating target16.5ms is a prior quality/latency calibration, not a speed claim. Dwell/min/max/manual/Low/stall behavior and external16.7/20ms targets remain. Current scale miss is retained; the lead accepts an honest miss without further tuning.
8. Void silhouette palette fallback is diagnostic-only and requires native actor≥100, darkened≥30, background/full-DPR/GL0/compile0 proof; normal multi-color guards remain.
9. Annulus old unchanged-circulation-color pin→bounded steel lift plus repeat/idempotence; shader/hooks/material count unchanged. Shaft browser baked-bucket pin8→9 with separate floor ownership/authored8; original three visits, source/texture/shared-disposal/exact-once assertions retained.

Merged stream pins are documented in [V6](V6-REPORT.md),[C6](C6-REPORT.md),[E6](E6-REPORT.md). No gameplay, deterministic simulation, save, accessibility or desktop safety assertion was removed.

## Final gallery delivery — pending

Required destinations: `artifacts/nextgen/final4/` and `final4-720/`,739 native frames each, plus `final4/organic/`. Reuse of the160-floor preflight requires exact accepted-source assets/hashes;579 additional frames per size cover all remaining final3/wave6 views. `before-after.png` and `compare.html` must show the25 requested Original/final3/final4 views, and `showcase.html` must curate12 actually reviewed native images. Missing Original baseline views are labeled, never fabricated. Source2d/AA partial galleries are historical and cannot silently fill current-source coverage.

## Honest vision gaps and R8 disposition

C1/C8: Room compositions, connected floor layers and mood/value calibration improve place identity, but flat access markings, broad showroom-like habitation floors and repetitive purple infestation membranes remain. Transient floor medians81–82.3 and nominal shadow-percentile exceptions are recorded. C2: U7 title/ending remains stylized/schematic. C3: Larger hero and bounded room framing improve combat; conservative720 body/HUD conflicts, exact concave-hull differences and some remote anatomy bounds remain explicit. C4: Opaque critical numerals preserve fade readability. C5: Frozen families keep upper anatomy/colors; actor overlaps still merge. C6: Queen recess has anatomy-like depth but clean procedural cups/plates and subdued climax lighting. C7/C9: Textured Pyro and persistent Overdrive states improve announcements, while Meltdown rear mantle, restrained Whiteout and generic Overclock ghosts remain economical approximations. C10: Small Crawler/Stalker families still benefit from learned context at480. C11: Grounded Bulwark/Glacier retain repeated geometric primitives. C12: U7 shop cleanup remains intact.

Heavy Atrium can overlap a Brute and marine upper body, making the ring the strongest480 cue; body-only crowd recognition is qualified. No claim of uninterrupted actor visibility through all world objects follows from camera bounds alone. No balance change was made for campaign success. Integration requests for other files: none. **Final acceptance execution/evidence remain active work; performance misses must be explicit rather than hidden.**
