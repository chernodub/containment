# I11 model integration report

Branch: `t3/integrate-creature-marine-models` (final head recorded at delivery).

## Changes

- Original K11 lantern masks now brighten on hit as well as wind-up, elite/champion state and death. This changes uniform values without adding a shader family.
- Authored marine rifle poses use the existing two-bone arm solver to bring the support hand to the shorter K10 handguard. Contact releases during reload, casts, reactions, death and equipment transitions; reacquisition blends. The two arm segments alone could not reach (69.96cm target distance versus 60.37cm combined length), so the final correction protracts the existing clavicle within a bounded rotation before solving; no wrist translation or limb stretching.
- Meshopt decoding is configured on the existing GLTFLoader. Positions stay full precision; normals, tangents, UVs and weights use 16-bit storage. Named rank meshes remain resident and share textures. Only unused accessors are pruned.
- Existing K11 collider aspect, rank selection, health offsets, socket and vertex-fitted ragdoll paths were audited. FamilyAnatomy remains necessary for supported legacy fallback; QueenDesign remains necessary for old saves. No simulation, room, UI, difficulty or bot changes.

## Asset packing and credits

Final asset bytes:

|Asset|Before|After|
|---|---:|---:|
|dretch|3749480|2700384|
|basilisk|3419020|2596272|
|marauder|3771436|2813504|
|tyrant|8285860|6480028|
|dragoon|8265192|6564052|
|marine|18394832|16262776|

Total download 45885820 → 37417016 bytes. Decoded accessor payload total 13983996 → 9135564 bytes (geometry plus animation/inverse-bind accessor storage, not measured total GPU allocation).

Positions remain full precision, with no simplification. Normal/tangent/UV/weight attributes quantized to 16 bits. Meshopt QUANTIZE encoder method losslessly encodes those preprocessed buffers; FILTER was rejected because it changed animation floats. Dedup shares identical textures/accessors, and pruning is limited to orphan accessors, preserving all named rank meshes and clips. Runtime decoder hookup in src/render/assets.ts uses the Three bundled decoder. No added package/runtime dependencies; existing meshoptimizer/glTF Transform/Three MIT texts retained.

Texture PNG payloads remain byte-identical: 3 shared textures per creature file, 4 for marine; shared across all rank/rig variants. No GPU texture compression or texture-memory reduction claimed. KTX2 transcoder/pipeline not introduced.

Credits updated in README, public/asset-credits.html, THIRD_PARTY/Character-assets-NOTICE.md. Third-party character content remaining: Unvanquished skeleton hierarchy/rest transforms, inverse binds, attachment sockets, legacy clips and source-derived motion animation. No retained Unvanquished character/weapon geometry or textures. Preserve per-source Creative Commons attributions. Queen overlay remains original code art over original K11 body and retained Tyrant rig.

Final build, captures and campaigns used the stable packed assets; asset packing itself used no browser.

NodeIO suppresses near-zero rest transforms by default; packer restores original node translation/rotation/scale/matrix JSON verbatim after writing, preserving even submicron authored offsets.

Final offline decoded audit: all six files passed exact semantic equality for full-precision positions, joint rest transforms/order/inverse binds, every retained animation channel/input/output/interpolation, and embedded image bytes. Audit utility was removed; no test/assertion infrastructure added.

## Verification and visual review

Creature integration audit
- models.ts: authored lantern emission now reacts to impact with +65% × decaying hit flash, multiplied by authored emission strength; preserves authored masks and colour, existing wind-up/elite/champion/death factors and shader program identity.
- OriginalCreatureAnatomy already consolidates rank skins before ragdoll fitting and shares alternate/frost geometry. Warden/Matron choose boss geometry; ranks without boss fall back to elite.
- FamilyAnatomy retained: still referenced by alienIdentity fallback and Queen retains QueenDesign. Removing this module wholesale would break supported fallback.
- Native collider scaling uses k11Aspect in rig loader; no simulation edits.

Creature capture audit
- Initial motion cohort: artifacts/nextgen/i11-final/creatures-motion-retry, 204 strips / zero errors (12 subjects ×17 actions). This used initial FILTER packed assets; do not claim it final lossless evidence. Exact-quarter sheets generated with existing m10-review.py using /tmp/containment-v6-py/bin/python. The system python lacks Pillow.
- Opened native attack strips for all five castes, Spitter run, each caste death (Crawler high impulse, Spitter frost) and native first contact pages for all five. Opened quarter contacts 1–3 for each base caste (all actions including spawn). No mesh tears, detached body sections, knee spikes or ragdoll explosions observed. Brute cleavers remain attached at raised strike, Carrier raised tail/knees coherent, Crawler antenna hooks stable, Stalker extended neck coherent. Plates still dark in isolated studio; stance and lantern determine gameplay identity.
- Final lossless motion cohort: artifacts/nextgen/i11-final/creatures-motion-final, 204 strips, zero errors, full subject/actions selection.
- Full room matrix: artifacts/nextgen/i11-final/creatures-rooms. 28 caste scenarios passed, two rejected by navigation request aborts (crawler calm Relay Racks, Spitter calm Infested Workshop; title fog/foreground image requests aborted). Four boss-reactor-vault phases passed with retained Queen overlay and new Brute body. No art change needed for legacy Queen.
- artifacts/nextgen/i11-final/creatures-rooms-retry reruns both rejected caste scenes clean (2/2). Retain failed raw parent. Combined clean coverage =30 caste scenes +4 legacy Queen phases.
- Existing u9-review.mjs generated exact-area480 reductions and contact; opened contact. Caste silhouettes/lantern colors distinguish all five at480. Marine strongest pale body and native ring against all three floors. Stalker remains least legible: dark thin legs, violet hump carries recognition. Carrier/Spitter bulb details clip toward flat bright color but stay immediately distinctive. Brute dark plates rely on pale cleavers. No extra material or outline tuning justified without washing out authored palette.
- Opened native crawler pale crowd, stalker dark crowd, Spitter/Brute pale calm: bars clear heads and bodies; elites orange rim retained as useful rank cue. Collider-fitted bodies are not visibly oversized into neighbouring fixture circles.
- Requests for modelling agent: consider stronger Stalker limb mass/pale articulation in a future modelling stream; retain current detailed mesh here per scope. Spitter green bulb/Carrier pods can use darker internal texture modulation in future, no redesign performed.

Final completion
- Final lossless QUANTIZE motion cohort completed204 strips /zero errors. Pixel comparison153/204 PNGs byte-identical to initial FILTER cohort (all Crawler/Stalker/Spitter/Brute including ranks/Warden);51 Carrier family rows differ subtly. Final Carrier attack opened; body/tail/knees coherent. Comparison receipt at i11-final/creatures-packing-pixel-comparison.json.
- All15 native base-caste contact pages were opened (three per caste), covering status, hit, stagger, deaths and entrance in addition to attacks/runs. Frost limb separation is intentional AnatomicalFrost presentation, not skin tearing.
- Historical artifacts/nextgen/k11-before is absent in checkout. No actual pre-K11 art comparison produced; initial vs final packing cohorts are explicitly labelled and cannot substitute for old artwork comparison.
- Final room evidence moved under i11-final/creatures-rooms and creatures-rooms-retry; exact480 receipts regenerated for moved paths. Both retry480 images opened; bodies identifiable and marine strongest light figure.
- No code-authored anatomy removed because FamilyAnatomy remains live through supported fallback; K11 runtime path already early-outs before constructing any old anatomy. Queen overlay intentionally retained.


Root also opened Brute attack, Carrier high-impulse death, Stalker Relay Racks crowd at native resolution and the full exact480 room contact. No tearing or ragdoll explosion seen; marine remains clearest.

Marine: all 47 final strips opened, including 16 ability casts and eight direction reversals. The motion fixture now holds the requested rig against ordinary renderer refreshes; the original fixture silently reset each study to Breacher. All 24 calm/heavy rig × three-room captures passed. Native and exact480 review plus campaigns are recorded below when complete.

Remaining marine weaknesses: mild high-knee tasset/belt overlap, angular Pyro hose in some casts, and retained large rocket launcher obscuring the chest. No severe tear/collapse found.

## Build and measured checks

`npm ci && npm run build` passed initially. Final `npm run build` passed; log retained in `artifacts/nextgen/i11-final/build.log`. No automated tests or gates were added.

One matched heavy Crew Checkpoint / Arc / High / 20-second trial per side used true HEAD runtime/assets frozen in `/tmp/i11-original-dist` versus final production dist. Before/after reports are retained under `i11-final/i11-models-{before,after}`. Mid-combat shader compiles: **0 → 0**. Frame p50/p95: 33.4/75.7 → 33.6/83.4 ms; CPU p50/p95: 16.5/58.9 → 18.0/65.1 ms. Host one-minute load: 550.5 → 616.3. Other streams had live captures, campaigns and benchmarks on the shared host. These single trials do not certify a hardware performance gain or regression; timing certification remains later.

Fresh Crew Checkpoint public room-readiness hold: **1202.3 → 1263.1 ms**, warmup 263.3 → 278.1 ms, programs 127 → 127, combat compiles 0 → 0. Host load 583.2 → 617.6. Reports: `i11-final/i11-models-ready-{before,after}`. Cold transfer/decode is not separately isolated by this room-readiness comparison.

Initial sandbox benchmark failed on localhost bind; elevated retry hit a navigation response failure. Both failed receipts are retained. Subsequent original/final cohorts completed successfully. No diagnostic was disabled.

## Campaigns

All campaigns use the unchanged native desktop bot, unassisted, seed 1729. Natural death is a terminal run outcome, not a twenty-room clear. Fixed-step timings are CPU submission evidence, not hardware FPS.

| Rig | Terminal outcome | Clears | Errors | Defects | Runner exit |
| --- | --- | ---: | ---: | ---: | ---: |
| Breacher | natural death, Transmission Chamber | 9 | 0 | 0 | 0 |
| Cryo | natural death, Communal Atrium | 3 | 0 | 0 | 0 |
| Pyro | natural death, Transmission Chamber | 9 | 0 | 0 | 0 |
| Arc | natural death, Service Shaft Landing | 13 | 0 | 0 | 0 |

## Requests for the modelling agent and remaining weaknesses

- Stalker: stronger limb mass or pale articulation would improve the weakest caste read; current thin dark legs rely on the violet lantern and raised abdomen.
- Spitter vessel and Carrier pods: consider darker internal texture modulation; small bright organs flatten at gameplay size.
- Marine: mild high-knee tasset/belt overlap and angular Pyro hoses remain. Large retained K10 rocket obscures the chest. These did not produce tearing or collapse in the reviewed actions.
- White impact/ability overlays temporarily mask rig hue in heavy Relay Racks captures; the marine body remains distinct. Calm rigs remain identifiable at480.

Historical `artifacts/nextgen/k11-before` is absent in this sparse checkout. No historical pre-K11 art comparison is claimed. Initial/final packing motion comparisons and the true original-runtime rifle comparison are retained. No model redesign, detail reduction, skeleton replacement, simulation change or difficulty adjustment was made.


Campaign raw reports, inputs, native images and traces are retained in `artifacts/nextgen/i11-final/campaigns/`. All four runs exited zero with no runner errors or defects; none is claimed as a twenty-room clear.

The final clavicle reach refinement followed the campaigns and benchmark cohorts. It changes only rifle presentation pose; affected rifle/release strips and a final build were reviewed afterward. Campaign/baseline timing receipts describe the preceding support-arm pose, with identical packed assets and simulation.

## Final rifle contact review

Final observed wrist in unscaled weapon space: `[0.060639998, -0.084895987, 0.212240048]` m, matching target `[0.06064, -0.08490, 0.21224]` m to floating-point precision. Clavicle rotation brings the target within arm reach; neither wrist translation nor segment scaling is used. `marine-rifle-final` contains fourteen zero-error rifle-specific strips, all opened: eight run lanes, fire, reload, switch, hit, death and cast release. Root additionally opened firing, run0/run315 and reload. Early run cells include the existing equip-release/reacquisition beat. No severe tearing/collapse observed. Final build log replaces the earlier log at `i11-final/build.log`; the observation and updated before/after rifle comparison are retained.

All browser/tool processes are closed. Final report and source changes are committed together; delivery message records the resulting head SHA. No push or PR.


## Second pass integration

2026-11-17: merged `nextgen` by fast-forward from `4bc91c51` to `9c8202fd`. `npm ci && npm run build` passed. This pass preserves FEEL12 motion files and clip clocks, T12 packing settings, camera, effects modules, world, UI and simulation.

### Deformation and corpse review

The unchanged real-clip runner captured all twelve caste/rank subjects × seventeen action/status/death rows: **204 strips, zero errors**. Every native strip and all 36 contact pages were opened. Attack rows include wind-up/strike/recovery at existing phase clocks; spawn covers breach entrance. Evidence is under `artifacts/nextgen/i11b-final/motion/`, with detailed opened-image findings in `REVIEW.md`.

New bellies, sacs, sail, second scythe/vessel, pauldrons, shield/ram, vents and stalked pods remained connected; no demonstrated weight or offset tearing/collapse justified changing the generating scripts. All five models were subsequently rebuilt for the T12 shipping pipeline with unchanged generators; mass and detail are preserved. Short folded Brute crusher/chest overlaps and Spitter vessel silhouette merging remain art/pose issues rather than speculative weighting fixes.

Carrier/Matron corpse sacs can remain conspicuously upright. The current tail/tip follow the nearest simulated ancestor; skin fitting includes their mass. No omitted geometry, exploding joints or demonstrated floating/sinking fit bug was found. A slumped sac rest needs physics/pose ownership work and is reported rather than changing FEEL12 motion or adding speculative articulation beyond the existing body budget.

### Footprint and attachments

A temporary independent mixer samples real `m10-idle` at 0.5 seconds during construction and measures each resident rank skin. Cached horizontal-only fits target 94% of the native collision circle, preserve vertical stature, restore every bone transform/local matrix and refresh attached skin bind inverses with `updateMatrixWorld(true)`. No live pose sampling or traversal occurs on combat/rank switches. Native collision/strike rules are unchanged.

The final frozen native probe measured all twelve ranks at **93.0–94.4%** of their collision-circle radius. Base Crawler horizontal fit is ×1.226 relative to the merged loader, correcting the undersized read; elite fit is ×1.047. Exact factors, bounds and native circle screenshots are in `i11b-final/runtime/measurements.json`. Pilot/stale-bind diagnostics are explicitly rejected and must not be quoted as physical before evidence.

Selected-rank height is cached from actual skin geometry; health clearance floors at measured top +0.08m, fixing the elite Crawler sail above the former anchor. Status attachment height and span follow selected-rank geometry and horizontal fit. No effect module was edited.

### Named emission controls

`ActorModel.setEmissionRegion(region, strength)` accepts finite strength 0–4 (clamped), neutral by default and reset on pool reset/death. Regions are **`warden-ram`** (warm amber brow/ram) and **`matron-vents`** (all three hatching vents, multiplying existing emission within the vent mask including its rim). Normal/elite geometry has zero masks. Two normalized byte channels per vertex follow the skin; atlas, material count and draw count are retained. Activation changes uniforms rather than shader variants. Existing global wind-up/hit/elite organ feedback continues to cover the additional authored lanterns/sacs. Encounter code can drive these named controls later; no encounter behavior was added.

### Readability, native strikes and campaign

The full rank matrix and native campaign results are recorded below.

Second-pass measured idle fits (horizontal scale relative to merged loader; vertical scale unchanged):

| Subject | XZ multiplier | Drawn radius / native radius | Health height (m) |
| --- | ---: | ---: | ---: |
| crawler | 1.226 | 0.944 | 0.697 |
| crawler-elite | 1.047 | 0.938 | 1.025 |
| stalker | 1.008 | 0.938 | 1.064 |
| stalker-elite | 0.946 | 0.930 | 1.064 |
| spitter | 1.010 | 0.938 | 1.408 |
| spitter-elite | 1.010 | 0.938 | 1.572 |
| brute | 1.163 | 0.941 | 1.447 |
| brute-elite | 1.163 | 0.941 | 1.614 |
| brute-warden | 1.163 | 0.941 | 1.808 |
| carrier | 1.258 | 0.930 | 2.003 |
| carrier-elite | 1.258 | 0.930 | 2.236 |
| carrier-matron | 1.086 | 0.933 | 2.504 |

Native strike evidence: `strikes/` contains twelve native30-frame phase sequences (360 frames, no capture errors), with existing simulation-owned warning geometry/timing. `phase-review/` selects wind-up immediately preceding the first strike, then strike/recovery as native600px crops without resizing. Root opened all twelve phase sheets (all36 phase crops), plus full Stalker strike. `strike-rings/` verifies the existing renderer collider toggle live for Crawler/Warden/Matron (90 frames, no capture errors); root opened their native ring frames. Brute/Carrier arc envelopes visibly extend farther than the near-body cleaver/claw poses in these close-target fixtures; FEEL12 should review visual reach. Enlarging the body to fill those arcs would violate the contact-circle fit, so no motion/telegraph change is made here.


### T12 shipping pipeline (lead addition)

Merged `nextgen` again to `807e8a13` after the T12 delivery. Rebuilt all five creatures with Blender 5.3.0, then ran unchanged `node tools/assets/i11-models/optimize.mjs` and `TOKTX=/tmp/t12-ktx/KTX-Software-4.4.2-Darwin-arm64-tools.pkg/Payload/usr/local/bin/toktx node tools/assets/t12-textures/pack.mjs`. This is T12’s existing cached Khronos KTX-Software **4.4.2** binary; no installation or packing policy change was needed.

All five `plain/` files were stale first-pass geometry before this work. Both routes now contain the regenerated second-pass geometry. Offline decoded comparisons preserve full-precision positions, oriented topology, joint indices, skeleton/rest/inverse binds and animation channels; meshopt may cyclically rotate a triangle’s first index without changing winding. Main/plain non-image compressed streams are identical. All twelve marine/weapon main/plain files are byte-identical to T12 shipping output. Receipts and command logs: `i11b-final/textures/`.

| Creature file | PNG body download MB before | KTX2 body MB after | Corrected plain body MB |
| --- | ---: | ---: | ---: |
| dretch | 2.787088 | 1.237416 | 1.645336 |
| basilisk | 2.792992 | 1.158168 | 1.600520 |
| marauder | 3.028096 | 1.486440 | 2.348436 |
| tyrant | 7.594232 | 2.045440 | 3.012652 |
| dragoon | 7.532892 | 2.132680 | 3.134360 |
| Total | 23.735300 | 8.060144 | 11.741304 |

Decimal MB covers the five body GLBs only, excluding unchanged separate motion files. Clients load one texture route. The old full-resolution PNG textures require approximately **132 MiB** RGBA8 with full mip chains; corrected capped plain textures require **32 MiB**. On the Apple M1 Pro / ANGLE Metal run, ETC2 RGB colour/emission and ASTC 4×4 normals totalled **5,068,384 bytes = 4.834 MiB** of compressed mip data. Forced plain measured **33,554,412 bytes ≈ 32 MiB** of RGBA8 mip allocation. Thus creature texture allocation is **132 → 4.834 MiB** on this compressed path, or **132 → 32 MiB** on fallback. Formats and mip inventory are recorded in `textures/runtime/verification.json`; these are texture allocations, not total GPU memory or a performance claim.

### Requests for the modelling / motion owners

Crawler and Stalker elite add-ons are not reliably distinguishable from their base anatomy alone at 480×270; their orange material rim supplies the strongest rank cue. Spitter’s second vessel is angle dependent. Carrier elite shield and Warden shield/ram read well; Matron’s larger brood mass reads, while individual vents/pods do not at that scale. Marine remains the clearest individual figure in the reviewed scenes. No mass/detail reduction was made.

FEEL12 should review Brute folded crusher/chest overlap and Brute/Carrier strike reach against their wider warning arcs. Carrier/Matron corpse sacs can stand steeply and Crawler corpses can be edge-on/upright; these are visually stiff despite stable joints. No clip timing or motion code was changed. Exact contact-floor clearance of every corpse is not certified by the gray strip background; native room evidence supports grounded visible bodies, with the noted sac posture limitation.

### Native campaign

`npm run playtest -- --rig=arc --seed=1729 --label=i11b-arc-1729` completed with runner exit 0, zero errors and zero defects: natural death in Coolant Plant after twelve room clears / thirteen entered. This was the completed second-pass runtime before the subsequent texture-only T12 merge/repack; final shipping texture paths receive separate native High/fallback staged-combat verification. The campaign was unassisted. Shared host load was approximately 804–940 on ten cores; wall time 2292 seconds is not hardware FPS evidence. Evidence: `i11b-final/campaign/`.

Final shipping verification used one browser, sequential High KTX2 and High forced-fallback pages. Compressed extensions were hidden before renderer creation only in the isolated fallback capture page; production loading logic was not modified. Network receipts show all eleven body assets from the main route on KTX2 and all eleven from `plain/` on fallback, with shared motion assets unchanged. Both runs completed all five caste families in all three rooms (mixed ranks), fifteen images per path, zero browser errors. Two seconds of native plasma firing per family/path reported WebGL error0, no context loss, and unchanged program count (128→128 then129→129). This bounded staged check is not a hardware benchmark or another campaign.

Requests for the modelling agent: strengthen Crawler/Stalker elite silhouette separation at270p and separate the Spitter elite vessel lobes at the production view. Coordinate a Carrier/Matron slumped corpse treatment with the ragdoll/motion owner rather than changing weights blindly; the current Carrier already consumes the twenty-body budget. Folded Brute crusher clearance and visual strike reach belong in FEEL12’s pose review. These are disclosed polish limits, not unobserved tearing fixes.

### Final evidence and verification

The final assembled readability matrix contains **72 no-UI 1920×1080 images**, with exact4×4 BOX reductions to480×270 and twelve rank sheets under `rooms/review480/`. All twelve ranks have calm and twenty-enemy crowd views in Crew Checkpoint, Relay Racks and Infested Workshop. The final eighteen heavy crowds were recaptured after native contact framing settled: twenty legal, non-overlapping native circles each, zero errors/failures and zero projected body-edge contacts. No camera parameters/code were changed. Their final KTX2 parent is `heavy-shipping-parent/`; the other54 accepted views predate T12 packing with identical second-pass geometry. The additional30 shipping texture views cover mixed ranks on both final routes and all three floors. Superseded intermediate images were deleted; diagnostic manifests remain clearly labelled.

`npm run build` passed after the merge/repack and again as part of the final production capture run. Existing large-chunk warnings remain. No automated tests or gates were added. Final High/plain browser checks, native campaign and all required strip/readability reviews are retained under `artifacts/nextgen/i11b-final/`. No browser remains open. No push or PR.

## Third pass integration

Completed I13 on the lighting rollout (`nextgen` at `450fa1e0`, merged in `8a5f7825`). After the machine restart, `npm run build` passed and the intact29-file work was saved immediately in `298825a2`. The merge conflict was two independent imports in models.ts; both were retained. Final build passes; the restarted unassisted Story/Arc seed1729 campaign cleared all16 target rooms, including Armory, Relay Racks and Coolant Plant Wardens and Swarm Junction Matron, with **zero errors and zero defects**. `campaign/report.json` records the explicit room-limit outcome; this is integration coverage, not a full20-room victory or a balance certification. The interrupted earlier run is retained separately and does not count.

### Native dimensions, footprints and pathing

`bossDefinitions.ts` isolates Warden radius64nativeunits (2.0m), Matron33.6 (1.05m), and melee range/width/engagement multipliers2.3/1.4. Guardian placement checks the expanded circle before promotion. Existing charge is a radius64 swept capsule with centre travel214.5units at movement1, exceeding the required38.4unit extension; geometry truncates it and retains the native1500ms wall stun. Warning length uses the snapshot's actual movement-scaled charge length. Matron requests opposed pods at radius60, with legal placement constrained to51.2–70.4units from the brood origin. Ordinary radii, health/speed/damage/cooldowns, encounter scripts and clip timing were not tuned.

Final native samples measured Warden drawn radial1.90–1.97m inside its2.0m circle, Matron0.96–0.99m inside1.05m. Melee warnings/damage share the promoted native shape. `room-clearance.json` covers all ENC12 guardian rooms, including Manual Control: every declared opening midpoint admits its boss radius, widths are at least140units, and all eligible native-navigation crossing samples reached within6units. Wall-adjacent invalid endpoints remain explicitly excluded. No world geometry or navigation implementation changed.

Two enlarged-body edge cases were corrected in delimited shared methods. Crowd/congestion lookup now accounts for the largest active boss radius; ordinary-only padding stays exactly29/40units. Native observation separated an older Crawler/later Warden from60 to78.4446units (required78). Pod-origin requests search a deterministic full annulus, avoid active body circles, and retire after bounded failed retries instead of relocating to an impossible remote breach. Identical fallback requests previously overlapped at distance0; afterward they selected legal positions41.636units apart (required28). A fully blocked ring leaves no pending request. These changes support boss dimensions; no general collision response or difficulty rule changed. `podOrigin` is ephemeral pending metadata, with no checkpoint schema change.

### Pod, emission and stun presentation

The static pod preloads through the existing owner: KTX2 `assets/brood-growth/brood-pod-ktx.glb`, PNG `brood-pod.glb`. Native remainingMs drives `pod-core`0.3→3.0 and switches to `brood-pod-hatching` for the final500ms. Native hatch swaps to a real Crawler using the existing breach entrance. Both variants are warmed and pooled; reset restores the closed state. Native wind-up/charge drives **`warden-ram`**; brood commitment drives **`matron-vents`**. Authored region attributes survive packing.

Wall stun samples existing `m10-stagger` at40% once and holds it until native stun ends, dims lantern intensity to15%, and shows three pooled amber crown arcs. The crown uses a thicker, depth-independent stroke so it remains visible above the boss. No motion implementation or clip timing was edited. Main/fallback native captures observe actual AI clocks through all requested phases, with no timer/pose injection.

### Height, framing and ragdolls

The first resumed pass exposed cached attachment heights that ignored the full boss pose: Warden1.95m while skin reached4.41m, Matron2.88m while skin reached3.97m. Fixed-idle construction sampling now caches authored-scale rank heights. A common attachment function reserves at least4.5m/4.8m for Warden/Matron; health bars, world afflictions and crown use it. Final sampled clearance is positive, minimum0.088m for Warden and0.829m for Matron, without per-frame vertex scans.

The only camera-related edit is a delimited DepthRenderer call to existing `HudCombatFraming.selectPrimaryContact` for a living guardian within12.5m. Closer ordinary contacts can no longer displace the tall guardian from the marine pair. No camera module/lens, lighting or postprocessing setting changed. Final brood/opening captures keep the full Matron spire and marine in frame.

All50 initial real-clip strips were opened. They showed attached Stalker hood, Carrier slings and Spitter duct, but revealed a brief Warden acid-death arm ribbon. Connected K11 child bones now retain captured local joint offsets while following solved physics rotation/shear; solver anchor separation cannot stretch the skin. Frost islands retain independent translation; marine/non-K11 mapping is unchanged. All30 fresh death strips were opened: the ribbon is gone and no new gross tearing/explosion was found.

The native floor check then exposed a suspended Matron skin (minimumY≈2.12m). A Matron-only, non-frost one-time skin/support check after0.75s of physics hands a genuinely suspended pose to the existing support-aware frozen fall. It never pushes colliders through the deck, supports raised surfaces and permits pit falls. Final native4-second samples put both corpse minima at **0.006m** over the deck; no floating/sinking is visible in those samples. Final Matron death variants were recaptured with longer strips. Campaign predates these final presentation-only ragdoll corrections; fresh strips/native floor captures and final build cover them, while gameplay/encounter definitions are identical.

### Shipping and cost

Rebuilt all five creatures and pod, then meshopt, unchanged T12 KTX2/PNG settings and requested index-only `lod.mjs` on fresh shipping outputs. Used cached Khronos KTX-Software4.4.2 at `/tmp/t12-ktx/KTX-Software-4.4.2-Darwin-arm64-tools.pkg/Payload/usr/local/bin/toktx`. Bosses remain full21,500triangles with exact `_K11REGION`, no boss/elite LOD. Decoded positions, oriented topology, joints, rest/inverse binds and embedded clips match regenerated sources on all ten creature and both pod routes. All twelve marine/weapon main/plain files remain byte-identical.

| Body GLB | Before MB | KTX2 after MB |
| --- | ---: | ---: |
| Crawler | 1.859864 | 1.280536 |
| Stalker | 2.788604 | 1.221060 |
| Spitter | 3.054428 | 1.564772 |
| Brute | 7.569460 | 2.192868 |
| Carrier | 7.430880 | 2.390268 |
| Total | 22.703236 | 8.649504 |

Decimal MB covers bodies only, excluding unchanged separate motion files. The comparison includes regenerated geometry/prior LOD differences, not compression alone. Corrected plain bodies total12.363400MB. Pod raw0.609172MB becomes KTX shipping0.489004MB or PNG shipping0.634804MB including LOD siblings. Base LODs retain84–97% triangles under existing seam/skin/UV limits; pod LOD retains100%, so no triangle saving is claimed there. No settings were loosened. The explicit requested `lod.mjs` was used because the documented atlas-LOD path reads committed HEAD and could restore stale third-pass geometry. Pod was added to existing brood pack/LOD lists; receipt dimensions now use its actual512 atlas. Unrelated growth GLB/receipt were restored byte-for-byte after reprocessing retained redundant bytes; `shipping/growth-restored.json` documents this pre-existing non-idempotent path. Original artwork/third-party notices remain unchanged.

### Readability, verification and remaining requests

Relay Racks uses the merged dark lighting standard. Nineteen main-path images cover bosses beside marine/regulars, calm/mid-attack, pod countdown/opening/hatch and regular-caste comparisons. Fourteen forced-plain images cover both boss/pod sequences; five earlier-body captures use the same current runtime/light. Every native image and exact480×270 comparison sheet was opened. Both bosses clearly read above ordinary castes: Warden breadth/shield/ram and Matron pink spire/brood mass survive reduction. KTX2/plain show no meaningful material/emissive/banding or pod-state difference. Fine Stalker scythe/hood, Carrier sling and Spitter duct changes add native detail but no convincing independent480 silhouette cue.

Main, plain and final grounded-native passes have zero page/console/request failures and zero post-ready shader programs. The foreground campaign used normal rendering, competent policy, no assistance, Story/Arc seed1729 and an explicit16-room coverage target; it cleared every target room. Shared host load was651→311 on ten cores, wall1584seconds; no hardware performance claim. `npm run build` passes after the lighting merge and final ragdoll changes. No tests or gates were added. All evidence is under `artifacts/nextgen/i13-final/`; superseded cohorts are labelled. No browser remains open at delivery; no push or PR.

Remaining requests: Warden can substantially occlude the marine during close contact, despite both being in frame. The transient DOM status glyph still uses a fixed1.2m anchor in `src/ui/hud/CombatText.ts`; an actor-height-aware UI anchor needs that stream, left untouched under the UI restriction. Ordinary Carrier corpse sacs can remain stiff/steep. Individual Matron vent/pod counts and fine regular-caste anatomy do not resolve at480. Model/motion owners should review folded crusher clearance and strike-reach presentation; no speculative weight/detail reduction was made. Native corpse samples and bounded strips establish the observed fit/stability, not every possible collision/support configuration.
