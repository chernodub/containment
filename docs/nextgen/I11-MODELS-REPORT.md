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
