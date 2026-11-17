# CAM12 verification report

Branch: `t3/camera-combat-framing`. Evidence: `artifacts/nextgen/cam12-final/`.

## Status

The 41,200-view spatial survey retains whole-marine screen/HUD clearance, with a conservative minimum 12.085 px. Four extreme 720p corner/cast views still exceed the strict 18% room-AABB bound. This is not full CAM12 acceptance; remaining exceptions are explicit below.

## Requested verification status

|Item|Result|
|---|---|
|Twenty-room/two-resolution sweep|41,200 measured pose views; all marine margins pass; four strict AABB failures retained. Cohort/path limits below.|
|Six-room heavy bursts and motion|48 burst frames and five 60-frame motion records; one real nearest-attacker/bar overlap remains. Native positional knockback does not exist.|
|Three historical comparisons|Opened pairs and native afters; Crew is approximate because historical attack/camera history is absent.|
|Native campaign to terminal outcome|Natural death at room 11, ten clears, zero technical errors/defects; no Annulus campaign frames or victory claim.|
|Twenty-enemy indicators|20 alive throughout 60 frames; grouping/fading/native danger pulse inspected.|
|Margins report|Twenty-room screen/HUD table plus raw CSV/JSON evidence; explicit remaining failures.|

## Changes and bounds

A pooled camera-oriented envelope samples native deformed vertices after final actor/socket/ability posing, including weapon, muzzle, raised arms, pack and ground ring. The final solve precedes rendering and updates masks/health bars. Geometry margin is 16 CSS px at canvas edges and HUD panels, with a further 4px conservative outline allowance in reported minima. HUD reservations retain peak occupancy and survive room loads because the UI adapter caches unchanged CSS bounds. Desktop resize holds previous occupancy until the next layout measurement.

Ordinary aim lead: at most 0.65 m, subject to final body/room constraints. Engaged target bias: at most 1.6 m, or 0.8 m reduced motion, plus at most 0.35 m aim scaled by usable viewport. Up to six contacts within 12.5 m are selected; native windup/strike, pending ranged attacks and active charge receive priority. Engagement zoom has an absolute 0.88 floor, not a universal relative percentage. Reference-body floor: normally 100 px at 1080, emergency 85 px (56.67 actual pixels at 720), closer cap 150 px. Emergency floor is 15% below the former floor. CameraRig remains the sole smooth positional follower; removing a second position spring fixed an Annulus 720 fight-under-bar regression. Room zoom remains sprung. The 18% AABB target is unchanged.

Edge indicators group sixteen 22.5° bearing sectors with counts/member IDs, fade nonapproaching enemies to 0.32–0.44 opacity, and pulse native warning/strike/charge/in-flight danger over 0.65s. Reduced motion is preserved.

No simulation, actor model/motion, world, difficulty, UI screen or dependency changes. No automated tests added or run. `npm ci` and production builds passed.

## Spatial survey

Twenty rooms, both 1920×1080 and 1280×720. Native spawn/exit plus every authored hull corner and wall-segment midpoint, snapped to nearest legal native-radius 16 position on an 8-unit grid. Duplicate coordinates retain requested aliases. Per resolution 636 requested marks / 515 unique positions. Eight aims and five representative configurations give 8,240 aim views / 41,200 pose views: Breacher shotgun idle, rocket seismic and railbreaker0.5, Cryo rocket Glacier0.75, Arc rocket Tesla0.75. Marks reset camera owners independently; one native presentation frame surveys first-visible-frame safety. Same-mark aims retain history.

**Margins are projected native deformed-geometry separation minus4 CSS pixels, a conservative visible-pixel lower bound, not raster segmentation or proof of every animation instant.** Screen and actual DOM-panel distances are separate. All forty native worst-pose PNGs and eighty worst-pose/DOM views in 480×270 contacts were opened. Raw receipts also retain conservative rectangular usable-viewport clearance.

|Room|1080 screen px|1080 HUD px|720 screen px|720 HUD px|Max AABB outside|
|---|---:|---:|---:|---:|---:|
|awakening-bay|12.442|13.045|12.304|12.980|17.990%|
|passenger-vault|12.510|13.045|12.296|12.096|17.992%|
|residential-gallery|12.729|13.056|119.220|19.220|11.829%|
|communal-atrium|12.610|12.450|12.356|12.085|18.899%|
|crew-checkpoint|12.727|142.046|12.473|82.705|8.909%|
|armory|12.615|13.045|12.371|12.096|17.951%|
|freight-hold|12.614|21.489|12.473|12.321|18.168%|
|breached-loading-bay|12.614|24.053|12.473|12.096|17.957%|
|relay-racks|12.729|13.203|112.096|12.096|17.951%|
|transmission-chamber|12.727|12.136|12.473|12.096|14.863%|
|diagnostic-gallery|12.607|34.078|12.327|19.220|11.829%|
|safety-interlock-station|12.438|13.189|12.292|13.166|11.829%|
|coolant-plant|12.729|12.811|12.327|12.097|17.951%|
|service-shaft-landing|12.429|13.189|12.309|12.096|18.899%|
|infested-workshop|12.637|13.045|12.296|12.999|17.990%|
|swarm-junction|12.729|25.091|12.327|26.367|17.951%|
|shielding-gate|12.728|12.136|12.327|12.096|14.863%|
|containment-annulus|12.729|160.219|12.327|70.647|8.776%|
|manual-control-chamber|12.729|25.091|12.327|12.096|17.959%|
|overload-floor|12.628|183.381|12.327|82.069|8.827%|

Strict AABB failures, all 720p with no small-room exemption: Atrium corner15/90° seismic 18.899269%; Freight Hold corner5/270° Glacier 18.168387%; Shaft Landing corner0/270° Glacier 18.386046%; Shaft Landing corner15/90° seismic 18.899269%. The bounded solve reaches the 85 px reference-body floor without finding 18%, while retaining whole-marine/HUD clearance. This is a solver limitation, not proof of geometric impossibility. Model/world changes are outside ownership. These remain failures rather than a relaxed global threshold.

Separate catalogue: four rigs × five weapons × idle/sixteen actions × three phases at Awakening spawn/aim 0, 1,020 configurations per resolution / 2,040 total. No clearance/AABB failures. This does not claim eight aims for the entire catalogue.

## Heavy combat and motion

Six rooms (Awakening, Crew Checkpoint, Armory, Atrium, Shaft Landing, Annulus), four 150 ms frames each at both resolutions:48 native burst frames. Existing twelve-visible-threat diagnostic is unchanged. Detailed final-cohort results and outstanding active-threat exceptions are retained in visual audit receipts.

Sixty native frames each record entry, dash, native hurt, death and resize, with position/quaternion/zoom and first/second differences. Native player hurt has no positional knockback; therefore physical knockback cannot be captured. Native damage camera impulse is the recorded substitute. Entry captures the first 60 visible frames after the room-ready gate, not an invented cross-room pan.

## Reference pairs, campaign, indicators and benchmark

Before/after pairs were opened at 480×270; native after images were also opened. Crew reconstructs saved position/aim/weapon/legal surviving enemy positions, but missing attack phases, damage and camera history make it an approximate staged replay. Whole weapon/body now clears the left edge. Armory uses the historical scenario/seed/150ms frame04; Annulus uses historical720p kiting frame03. Native camera-aware staging may choose different legal centres, so these are scenario comparisons, not pixel-identical world-state pairs. The spawn-facing Annulus weapon also clears the left edge (~16.9px geometry). Armory/Annulus lower distant crowds still extend behind the bar: the broad composition failure is improved but not wholly eliminated.

A real nearest-attacker failure remains in heavy720 Awakening 04: Brute 17 native windup 783.33 ms/pending attack at 128.49 world units, body bounds x 268.13–404.80 / y 533.12–679.20 partly intersect the action bar starting near y 620. The central charge lane remains visible. The existing solver falls back from an oversized six-contact group to the highest-scoring single pair (Spitter 1), and its `fit=true` then describes that pair only. Nearest-three experiments were captured, but reduced visible crowd to 9 (Crew) or 10 (Awakening), failing the unchanged twelve-enemy diagnostic, and were reverted. This bounded fitting limitation remains unresolved; markers do not count as showing the attack.

Native campaign completed its natural terminal outcome: **dead in Diagnostic Gallery, ten rooms cleared, zero errors and zero runner defects**, unassisted Breacher/seed1729. Wall time 1418.45 s. No `--fast`, altered difficulty, damage scaling or policy change. Crew 74 and Armory 88 storyboard entries exist (158 half-second PNGs plus four entry/clear frames); Annulus has zero because the bot died before reaching it. Therefore a victorious twenty-room campaign and native Annulus storyboard cannot be claimed. Repeating the same deterministic policy or adding assistance would not establish the requested unassisted success.

The 20-enemy fixture and before/after benchmark results are detailed below.

## Remaining composition limits

World walls/props occlude anatomy at selected corners: Atrium waist/legs, Shielding lower legs, Overload diagonal wall, Freight inset-wall weapon, Annulus southeast wall; Crew northeast pack/head has poor contrast. These are world occlusion rather than screen/HUD clipping. Quiet boundary views retain empty floor opposite the marine under room constraints. Distant effects/nonattacking bodies can extend behind the bar. These visible limits are not claimed fixed.

## Evidence cohorts

Static survey/catalogue are cohort C, aggregate asset hash `994e7e573c70edab8c16bd9d86e5caa5264f44ce64aa25b76364359fc4d7c37a`. Cohort D adds active `chargeMs>0` attack selection, unreachable in enemy-free spatial/catalogue fixtures. Final E retains HUD reservations across room loads; the spatial script reloads a fresh page for every room, so there is no prior-room reservation to carry. It does not change the established fresh-page pose solve. Heavy/motion audits retain their D asset receipts; references/campaign use E. Hashes are preserved rather than claiming a single distribution across cohorts. Source changes after E are an unused import removal and capture diagnostics/documentation only. Final runtime is immutable while browser jobs run.

Updated capture guard enforces 16 px canvas / 8 px additional reserved-HUD geometry padding (layout already reserves 8 px), with 0.5px projection tolerance. Re-reading all 48 heavy and 9 reference saved receipts passes this diagnostic; AABB failures in the separate spatial survey remain explicit.

## Motion review results

All six native 30-frame sheets (entry/dash/hurt), all 180 frames in fifteen exact 480 contacts, and eleven native death/resize/representative samples were opened. No unexplained room-scale jump was observed. Maximum per-frame camera movement: entry 0.257616 m (frame 3), dash 0.398733 m (frame 2/onset), hurt 0.203733 m (frame 1), death 0.183987 m (frame 2), resize 0.288903 m (frame 21 after 720 switch). Maximum zoom deltas respectively 0, 0.000000052, 0.00054637, 0.00054637, 0.00029996. Boundary/onset/layout safety corrections remain visible in numeric deltas; this is not a claim of zero discontinuity or exhaustive combat target-switch smoothness.

Minimum geometry clearance across all motion frames: screen 15.99993695 px, actual HUD 78.82285575 px; subtract 4 for conservative visible-pixel lower bounds (~12.0/74.82px). Death overlay hides the corpse, so its envelope receipt is not a corpse raster measurement. Raw `accepted=true` persists after dash in the original D recorder; it validates only dash, not separate hurt/death acceptance. The recorder now clears fixture state per case. Detailed files: `motion/visual-review.json`, `.md`, native sheets and CSV deltas.

## Twenty-enemy indicators

Final E1280×720 fixture accepted 20 native enemies and retained 20 alive throughout 60 native frames, zero browser errors. Pending director requests are suppressed only in this opt-in fixture to keep the requested fixed count; existing enemies retain native AI/timers. Before the first AI tick, stationary native spawn snapshots yield opacity 0.378–0.411, visibly faded. Same-bearing groups show counts 2/5/7 with exact member IDs; no count/member mismatch in 60frames. Five other enemies are drawn/otherwise do not require these bearings, so marker counts are not claimed to sum to 20.

The first native AI tick produces Spitter 1 windup 500 ms/pending attack. A red danger marker appears (`rgb(255,90,54)`, `threat-pressure`), with opacity 0.85–1 and brightness 1–1.5 across five CSS samples. These samples hold simulation at its real native warning state while CSS advances; no timer/velocity/attack phase is fabricated. Subsequent native steps reveal the source and retire/recluster bearings normally. Three representative native PNGs and all eleven frames in two exact 480 contacts were opened; see `edge/visual-review.json`.

## Measured benchmark

Official `npm run bench`, Awakening/Armory, Breacher, High/Low, fixed 1920×1080 scale 1, one 20 s wall-clock repeat per case before/after. Baseline substitutes only the five owned camera/orchestration files from pre-CAM12 `fcab6a5274ea78b26e6c304bce53d002bd753eae`; other application/HUD/assets stay current. Both runs exit 0, errors[] and budgetFailures[]; no combat shader compiles were observed.

|Room/tier|Before CPU p50/p95 ms|After CPU p50/p95 ms|Before/after max draws|
|---|---:|---:|---:|
|awakening-bay/high|15.40/47.60|24.20/55.40|158/153|
|awakening-bay/low|10.80/19.50|18.80/50.30|133/132|
|armory/high|14.90/44.80|28.30/60.10|154/158|
|armory/low|10.70/38.80|21.10/53.80|146/147|

CPU submission medians increased in all four final samples. This is a material performance concern, not a performance signoff. Exact live deformed-envelope sampling/final solves add work; this run does not isolate their causal cost. Shared 10-core host one-minute load ranged 55–166 before and 68–121 after, single repeats and native scenes diverge over wall time. Draw counts differ slightly; scale remained 1 throughout. No hardware FPS claim is made from screenshots or fixed-step bot timing. Raw benchmark JSON, comparison JSON/Markdown and SVG chart are retained.

## Reproduction and retained evidence

Run browser jobs serially. The production build log and asset comparison verify that frozen final runtime matches the final successful build. Raw captures, JSON/CSV receipts, exact 480 review contacts, baseline/final benchmark distributions and the final gallery remain under `artifacts/nextgen/cam12-final/`. Superseded intermediate captures/runs were deleted; compact failure/provenance receipts remain. Artifacts are intentionally gitignored; source, capture tools and this report are committed.

Main commands used: `npm ci`; `npm run build`; `cam12-sweep.mjs --settle=1` against the frozen distribution; official six-room `capture` bursts at both resolutions; `cam12-motion.mjs --cases=entry,dash,hurt,death,resize` and the separate 20-enemy case; `cam12-replay.mjs`; native `npm run playtest -- --rig=breacher --seed=1729 --dist-dir=.../runtime --max-wall-seconds=7200 --storyboard-room=crew-checkpoint,armory,containment-annulus`; official before/after `npm run bench -- --no-build --rooms=awakening-bay,armory --rigs=breacher --tiers=high,low --seconds=20 --repeat=1 --fixed-resolution`. See scripts README and each receipt for full parameters and fixture limits.

## Final campaign visual review

Opened all 27 exact 480×270 storyboard contacts: 158 half-second PNGs (72 Crew, 86 Armory), plus the four entry/clear native frames and their earlier 480 contacts, covering all 162 recorded storyboard entries. Also opened all 33 named native start/mid/clear-or-death frames through room 11 and four suspicious native half-second frames (Crew015/042, Armory034/054). Exact filenames and hashes are in `campaign-visual-review.md`, `campaign-review/story-receipts.json` and `campaign-review/final-opened-native.json`.

No marine canvas crop or HUD overlap was observed. The historical Crew left-edge failure is absent in these campaign samples. Armory034–039 south-wall occlusion/fading still obscures lower legs; Armory006/007 remote charge body/lane reaches the bottom edge while its central path remains visible. Distant threat arrows persist, so this does not establish visibility of every attack. There are no Annulus campaign images because the run died in Diagnostic Gallery. No technical errors or runner defects were recorded.

This branch is reviewable with all requested evidence or a specific limitation recorded, but **not full CAM12 visual signoff**: the four AABB exceptions, nearest-attacker bar overlap, residual world/distant-crowd occlusion and increased measured CPU cost remain open.
