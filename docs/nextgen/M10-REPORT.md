# M10 — melee states and authored combat motion

Branch `t3/enemy-attack-motion`; authored implementation `d2eb25da1bf8cfcd96407c841907ee4a0d207334`, motion/firing correction `adf3c72dbda47c5cc2df3cf22acef4555936cb72`, balance/CPU rescue `9d958c5dcc76b93a751b36142d479fac1f8c3603` (final report commit supplied at handoff).

Melee earns a visible warning and resolves one shaped strike. The lead accepted the authored motion; the balance rescue preserves those clips and all base meshes. The owner lifted the former two-iteration limit for this rescue. Final balance confirmation is recorded below.

## Attack state contract

All families use approach → windup → strike → recovery. Warnings start at the old body-contact distance, with fixed origins throughout anticipation. Facing locks at a 170ms small / 250ms heavy lead threshold, with a 50ms-step margin over the requested 120ms / 200ms visible lock. A scaled warning shorter than its lock lead locks immediately. Elite Crawler anticipation is 147.6ms. No enemy translates toward the marine during anticipation. The single windup→strike transition checks circle overlap with the exact sector/capsule and clear shot. Native dash immunity decides damage acceptance; leaving the footprint misses.

Freeze/stun/shove/launch cancel anticipation and require a fresh warning. A cancelled anticipation has120ms stabilization; a resolved strike still owes its remaining strike/recovery and full rest. Recovery is stationary and cannot attack. Rest starts after recovery and elapses on the hostile clock during freeze; control and owed rest overlap. Frozen actors still cannot reserve or start attacks, and thaw requires a fresh full warning. There are at most two small and one heavy windup/strike, with140ms between starts. Three physical approach berths and the existing escape half-plane remain; at most one heavy may reserve a berth, so idle heavy owners cannot monopolize all three. Resting actors release their berth and hold/circle outside. Player movement has no ordinary-enemy body collider; recurring touch damage is removed, including during charge. Ranged spit and charge travel retain their previous rules and clocks.

Base catalog values below precede story/elite/champion multipliers. Distances are simulation units; marine radius is added once for intersection. Elite windup×.82 and recovery×.85. Minimum cycle includes windup, strike, recovery and the full post-recovery rest.

| Family | Windup / strike / recovery ms | Strike shape | Damage M9 → M10 rescue | Rest / minimum cycle ms |
|---|---:|---|---:|---:|
| Crawler |180 /70 /240|arc range42,100° total|12→78 (scaled cap90)|900 /1390|
| Stalker |240 /90 /560|capsule length66, width16|22→80 (scaled cap90)|900 /1790|
| Brute |650 /120 /450|arc range41,110° total|35→35|1200 /2420|
| Spitter |350 /90 /420|cone range38,90° total|10→10; ranged10 unchanged|1500 /2360|
| Carrier |620 /120 /460|cone range44,100° total|18→18|1100 /2300|

Engage center distances are30.5/33.5/44.5/34.5/40.5 respectively. Maximum strike center reach, including marine radius, is58/90/57/54/60; the Stalker value includes its capsule end cap. Brute reach is1.281× old contact reach. The current ceiling90 leaves an unmodified full-health100 marine alive after one hit; Blood Price can raise it to108. The scaled small-family strike ceiling is applied in the shared snapshot/strike damage function before native incoming-damage boons. Small-family damage was first restored to original values and raised only after repeated100% completion cohorts; no player, ability, enemy health/speed, ranged damage or room-plan values changed.

Additive snapshot fields remain `meleePhase`, `meleeProgress`, `meleeAngle`, `meleeFacingLocked`, `meleeShape`, `meleeOriginX/Y`, `meleeRemainingMs`, `meleeDurationMs`, `meleeDamage`. The renderer consumes the same exact footprint. Swarm warnings use a thin edge and faint fill with no hatching, weight.12 (.17 elite) versus heavy.48, and retire with native anticipation. Attack state is room-local; checkpoint bytes/schema do not change and old rooms initialize approach/default clocks. No renderer value participates in hit resolution.

## Balance rescue

The owner authorized quick10-seed×four-rig iterations, then one full20×four-rig confirmation. Quick seeds are1729,2718,31415,42,137,8675309,2026,9001,65537,123456; full confirmation adds17,23,101,256,512,1024,4096,8192,16384,32768. Historical baseline uses frozen game and policy; replaying its first ten seeds reproduced every original outcome and total damage exactly. Per-room family counters observe native events only and never enter policy decisions.

| Quick iteration | Main change | Completion | Breacher / Cryo / Pyro / Arc | Transmission median s | First-five median hits |
|---|---|---:|---|---:|---|
| Before |Original contact rules and policy|20/40,50%|40 /50 /40 /70%|65.442|0 /0 /0 /0 /0|
| Failed M10 |Delivered broad strikes and policy|6/40,15%|20 /30 /10 /0%|62.567|0 /0 /0 /0 /0|
|1|Short shapes, original damage, full rest and visible exits|40/40,100%|100 /100 /100 /100%|60.375|0 /1 /0 /0 /0|
|2|Interrupted-rest debt, berth rotation and hazard exits|40/40,100%|100 /100 /100 /100%|63.758|0 /0 /0 /0 /0|
|3|Crawler180ms / Stalker240ms anticipation|40/40,100%|100 /100 /100 /100%|62.633|0 /0 /0 /0 /0|
|4|Old-contact initiation; damage14/25; prior ranged policy|40/40,100%|100 /100 /100 /100%|61.542|0 /0 /0 /0 /0|
|5|One-heavy reservation limit|40/40,100%|100 /100 /100 /100%|61.767|0 /0 /0 /0 /0|
|6|Small-family damage40/40|38/40,95%|100 /80 /100 /100%|60.217|0 /0 /0 /0 /0|
|7|Small-family damage64/64; scaled cap75|28/40,70%|60 /70 /70 /80%|64.833|0 /0 /0 /0 /0|
|8|Small-family damage72/72; scaled cap80|30/40,75%|60 /80 /80 /80%|62.408|0 /0 /0 /0 /0|
|9|Base64/64; scaled cap82|27/40,67.5%|50 /70 /70 /80%|64.833|0 /0 /0 /0 /0|
|10|Stalker anticipation220ms|27/40,67.5%|60 /70 /70 /70%|60.542|0 /0 /0 /0 /0|
|11|Crawler recovery180ms; Stalker240ms|31/40,77.5%|30 /90 /90 /100%|63.650|0 /0 /0 /0 /0|
|12|Recovery240ms; rest elapses during freeze|30/40,75%|80 /70 /70 /80%|64.833|0 /0 /0 /0 /0|
|13|Scaled ceiling90; base64/64|30/40,75%|80 /70 /70 /80%|64.833|0 /0 /0 /0 /0|
|14|Base80/80; ceiling90|22/40,55%|30 /60 /70 /60%|65.075|0 /0 /0 /0 /0|
|15|Base70/80; ceiling90|29/40,72.5%|50 /70 /80 /90%|65.075|0 /0 /0 /0 /0|
|16|Base75/80; ceiling90|28/40,70%|70 /90 /80 /40%|64.833|0 /0 /0 /0 /0|
|17|Base78/80; ceiling90|25/40,62.5%|70 /60 /70 /50%|64.833|0 /0 /0 /0 /0|

The sole full confirmation used all80 matched runs from implementation `9d958c5`: **52/80,65%**, meeting the inclusive45–65% target. Every rig exceeds35%; Breacher rises from30% to60%. No further tuning or cohorts follow this passing confirmation.

| Measure | Pre-M10 before | Delivered M10 | Confirmed rescue | Target |
|---|---:|---:|---:|---:|
| Campaign completion |39/80,48.75%|6/80,7.5%|52/80,65%|45–65%|
| Breacher |6/20,30%|2/20,10%|12/20,60%|≥35%|
| Cryo |11/20,55%|3/20,15%|14/20,70%|≥35%|
| Pyro |10/20,50%|1/20,5%|14/20,70%|≥35%|
| Arc |12/20,60%|0/20,0%|12/20,60%|≥35%|
| Transmission median |64.242s|61.533s|61.133s|60–75s|
| Median hits, rooms1–5 |0 /0 /0 /0 /0|0 /0 /0 /0 /0|0 /0 /0 /0 /0|No increase|

The archived pre-M1080-run baseline has zero damage in78/55/56/46/64 runs in those first five rooms, establishing zero positive-damage-hit medians; the matched quick replay directly records the same hit medians. Rescue per-room hit counters directly establish all five zero medians. Raw cohorts, frozen bundles and room-level family pressure are retained under `balance/rescue/`, including every rejected iteration. Iteration11 was briefly paused for an isolated benchmark; its simulation clock/results are unaffected and its wall time is not performance evidence.

Pressure comparison below uses the same first ten seeds×four rigs. Damage is divided by all entered combat rooms (excluding automatic clears), so zeros and natural deaths remain represented. Spitter damage includes its unchanged ranged shots. Hits/windup counts accepted damaging melee hits; contacts/strike counts exact geometric contacts before native immunity/hurt-cooldown rejection.

| Family | Before damage/room | Failed M10 damage/room | Rescue damage/room | Rescue hits/windup | Rescue contacts/strike |
|---|---:|---:|---:|---:|---:|
|crawler|8.64|13.45|15.08|31.3%|46.4%|
|stalker|8.78|23.69|4.01|7.4%|9.8%|
|brute|12.82|3.16|0.00|0.0%|0.0%|
|spitter|6.01|4.84|6.87|7.8%|16.1%|
|carrier|0.38|0.21|0.00|0.0%|0.0%|

The failed M10 first-ten replay recorded Stalker795 strikes,613 geometric contacts (77.1%),515 accepted hits and14190 damage, versus6541 Stalker damage before despite fewer rooms reached. Crawler strikes connected65.5%. After shortening footprints and fixing origins, iteration2 connected4.2% of Crawler and1.8% of Stalker strikes. Timing3 raised those to12.9%/5.4%; contact initiation4 raised Crawler connection to47.9% while reducing wasted warnings. Heavy reservations could mechanically block small attackers, but correction5 did not materially restore pressure in this cohort. These counts distinguish shape mistakes from accepted-hit cadence.

The bot reads only visible current melee shapes, origins, facing and warning deadlines for new counterplay: shortest legal backward exit for arcs, side exit for lines/cones, and a dash when walking cannot clear in time. Crawler reach is a spacing lower bound. The temporary predictive projectile solver was removed in iteration4; accepted pre-M10 ranged endpoint scoring and ranged/acid dash behavior remain. No hidden future decisions or enemy cooldowns are consulted for melee avoidance. Raw frozen cohorts retain per-room family damage, windups, strikes, contacts and accepted hits.

## Authored motion and ownership

The generating scripts live in `tools/assets/m10-motion/`. Temporary IK goals/poles author real bone arcs and planted contacts, then bake to the exact retained node names/rest hierarchy. Animation-only GLBs live in `public/assets/models/motion/`; base marine/weapon GLBs and all K10 mesh ownership remain untouched. Runtime merges clips by original bone name during asset loading, before preparation. No new runtime dependency was added. Generator code is MIT; retained skeleton animation adaptations preserve the model attribution/CC BY-SA4.0 terms in the shipped motion credits.

The marine package contains69 clips:32 travel/transition clips,16 casts,5 class-specific fire clips,5 ready grips, reload/switch/idle,4 hits and4 directional deaths. Every enemy package contains23 clips. Marine locomotion has eight independent direction cycles plus eight starts, stops and reversals. Body actions retain native impact receipts: held casts stop at their authored anticipation marker until the accepted impact. Moving reload/fire/switch use prepared upper-body additive clips. Enemy family phase clips follow the native normalized clock, including elites/time scale. Reduced motion attenuates optional hit/status clips through a prepared idle blend; zero strength clears those impulses. Essential travel/cast/attack poses remain readable. Primary death choreography hands the current articulated pose to the retained physics pool without a second launch; killing momentum and elemental frost/burn/arc/acid finishes remain native presentation.

Roots, collision, ground rings, telegraphs and health bars stay fixed. Marine authored live pelvis translation peaks at.17183m (<.175m=35% radius) and returns within233.33ms; static/held cards keep planar hips planted. Enemy authored center travel ends by250ms, with the runtime secondary layer reserving≤.049 radius inside the35% combined allowance; strike lunges follow the declared shape. Authored knees/limbs can articulate beyond the idle silhouette without moving the gameplay root. Pooling, skin batching and prepared hostile shader ownership remain; no mid-combat shader family was introduced. A≤45ms global presentation hold has650ms cooldown, scales with screenShake and clears when off/reduced; only Overdrive impact, elite kill and marine heavy hurt request it.

Three authored critique→fix rounds plus fresh acceptance are written in `docs/nextgen/plans/M10-review.md`. All native standard strips and their exact4× reductions were opened before family propagation. The rescue preserves those accepted clips and measurements; it changes runtime priority/sampling and attack parameters, not meshes or authored poses. Native windup/strike takes precedence over a residual flinch so thaw never hides the fresh warning.

## Verification and visual review

Owner revision merged as `b725dce` after WIP `81c3e15`. `npm ci` passed. All conflicting and newly authored test files were deleted per the owner decision; no tests, assertion gates or proof infrastructure were added afterward. Verification below uses build, play, ordinary captures and benchmark. Historical test receipts do not establish the final revision.

The accepted full 252-strip pass completed with0 errors; all43 complete exact-quarter contact pages were opened, alongside native standard/propagation strips, all16cast poses, selected full elemental deaths and the five real-room phase sheets. A crowd-only resample settles all six pooled actors past their breach entrances; both original/replacement manifests remain in receipts. The final three weapon fire cards were strengthened after review; all five firing rows were resampled after fixing accepted-shot priority over cosmetic switching and are recorded with their own source manifest. Untouched family/ability evidence uses the initial frozen authored build. The firing resample records the reviewed changes subsequently committed in `adf3c72`. Those original heavy-combat captures, benchmark and campaigns remain historical evidence of the accepted art; rescue evidence below supersedes their gameplay/performance results.

Original accepted family capture: 150 PNGs, 0 failures/errors. Heavy combat plus four public accepted ability bursts: 60 PNGs, 0 failures/errors. The first extra ability capture stopped on a stale visible-caption requirement: the pre-existing compact HUD intentionally hides captions. Its equivalent fixture now requires the visible ability icon while retaining ID/action/pool checks; no UI code changed. Failed raw parents remain under `native/failed-parent` and `native/failed-ability-parent`.

Rescue capture adds 180 native PNGs across all five family phases and a 20-enemy crowd with ten Crawlers, with zero failures/errors. All five six-frame phase boards and the crowd board were opened at exact quarter size, alongside selected native frames. A final four-frame crowd resample exercises the final pose sampling/culling code; all 20 enemies are visible in its first frames. Native and exact-quarter images were opened. Small marks remain faint, without a hatched floor. Failed close-spawn and stationary-Spitter fixture parents remain retained. Final native campaigns and measured performance follow below.

## Silhouette and score results

Native pixel masks use absolute registration, RGB difference>12 against the flat background and the middle same-rig idle reference; no translation/scale fitting. Peak is minimum IoU within the declared native phase. This includes displacement within the permitted strike lunge, so Stalker strike0.0000 is separation from idle rather than a claim about anatomy quality. All numeric limits pass; every final quarter sheet was actually opened.

| Family | Anticipation≤.65 | Strike≤.60 | Light≤.88 | Heavy≤.75 |
|---|---:|---:|---:|---:|
| Crawler |.6167|.3950|.6289|.5758|
| Stalker |.5372|.0000|.7042|.6056|
| Brute |.6178|.5362|.7031|.6488|
| Spitter |.5096|.3228|.5859|.4877|
| Carrier |.5892|.2844|.6103|.4403|
| Brute Warden |.5812|.4789|.6743|.5970|
| Carrier Matron |.5675|.2699|.6197|.4660|

Across every family/elite/champion: worst anticipation.6210, strike.5362, light.7042, heavy.6488. Marine hit.4075≤.80; all16cast peaks≤.5455 against.75, maximum within-rig cast-pair.6226≤.85. Full per-action measurements: [iou.json](../../artifacts/nextgen/m10-final/after/iou.json).

Harsh M9 scale:0 broken,3 rigid prototype,5 competent prototype,7 strong indie,9 premium reference. The205 matched actions compare against **M9 final**, not its earlier baseline. Marine36-action mean5.39→7.33; enemy168-action mean4.79→7.36. Every scored action≥7; enemy attacks/directional hits and marine fire/hit actions8. Other casts remain7–8; these are not premium9s. [Every action and critique](../../artifacts/nextgen/m10-final/scores.md), [score JSON](../../artifacts/nextgen/m10-final/scores.json).47 extra/diagnostic rows are explicitly unpaired.

The weakest remaining motions are restrained idle/gaze, Spitter foot arcs, Stalker’s sometimes splayed burn aftermath, the marine physical wrist/gun roll after collapse and occasional boundary-corpse framing, and short command-style casts such as Overclock. Heavy foot grounding under the largest rear is less convincing than the held silhouette. In the opened Breacher native death frame, killing momentum carries the marine partly outside the viewport at the room boundary; the articulated isolated death remains fully visible in its separate study. Strips do not certify zero world foot slide; native room images and campaigns are complementary evidence. Reload has a real hand sequence but no separate magazine prop swap.

## Native campaigns — seed1729

Four unassisted native keyboard/mouse campaigns use the same frozen production distribution from `9d958c5`. They run with `--fast`: scene/camera/actor updates remain at 60Hz, while intermediate GPU submissions are omitted; preparation and evidence frames are fully drawn. These runs verify native campaign execution, not hardware performance. Natural deaths are retained. All four campaigns finish normally with zero errors and zero recorded defects. Their outcomes differ from the simulation proxy and do not establish a native 65% completion rate.

| Rig | Terminal outcome | Rooms cleared | Errors / defects | Wall seconds |
|---|---|---:|---:|---:|
|breacher|dead|5/20|0 / 0|111.4|
|cryo|complete|20/20|0 / 0|556.3|
|pyro|dead|17/20|0 / 0|373.2|
|arc|complete|20/20|0 / 0|457.1|

Full traces, snapshots, per-room PNGs and terminal evidence: [Breacher](../../artifacts/nextgen/m10-final/play/rescue/breacher/index.html), [Cryo](../../artifacts/nextgen/m10-final/play/rescue/cryo/index.html), [Pyro](../../artifacts/nextgen/m10-final/play/rescue/pyro/index.html), [Arc](../../artifacts/nextgen/m10-final/play/rescue/arc/index.html). `npm run build` passes at the frozen implementation revision. No automated suites or new assertion gates were run. Only this report changes after the played implementation.

## Heavy-combat CPU

Same ordinary benchmark:Containment Annulus, Breacher, High1920×1080,25 legal replenished enemies,3×10s trials. Native effects, deaths and ability rules remain. One browser; no M10 simulation, capture or Blender export overlapped the passing measurement.

| Trial | Before CPU average / p50 / p95 ms | Rescue CPU average / p50 / p95 ms | Before → rescue frame p95 ms | Rescue max draws | New programs |
|---|---:|---:|---:|---:|---:|
|0|7.656 /7.3 /10.9|7.817 /7.2 /11.3|18.0→18.0|187|0|
|1|7.688 /7.4 /10.5|7.566 /7.1 /11.1|18.2→18.1|187|0|
|2|7.691 /6.9 /10.3|8.130 /7.5 /11.6|18.0→18.0|187|0|

Mean whole-pipeline update+render+HUD CPU trial averages: **7.678ms before →8.130ms delivered M10 →7.838ms rescue**. This shared-host sample is below the requested 7.9ms, saving 0.292ms against the delivered revision and retaining 0.160ms overhead versus M9; it is provisional, not an isolated performance certification. Draws remain≤197 across the reviewed rescue trials; the passing run peaks at187. Prepared program inventory114–115, with zero mid-combat creations in every passing trial. Frame tails are retained and do not establish a16.6ms hardware-FPS guarantee.

Marine base/grip/upper layers share one mixer evaluation and retain unchanged action bindings. Hidden enemy poses stop sampling while clocks advance; waiting/circling walk and idle skeletons sample30Hz while roots/facing remain full rate. Berth owners, attacks, hits, status reactions, spawn/death, the marine and direct rig studies remain full rate. Enemy local bone matrices compose only with actual authored samples; pool reset and physics handoff retain their ownership. Off-screen warning instances skip batch writes using the existing actor frustum, while warning state/priority remains live. Berth, escape and firing probes now pass primitive origin/radius overrides instead of copying entire enemy states; collision callback values and frozen context semantics remain unchanged.

Passing host one-minute load was20.47–22.25 on10 cores, versus13.84–15.66 before and37.28–56.25 for delivered M10. Earlier rescue attempts reached load181 with shared simulator/Metal work active; their raw trials are retained. The passing measurement follows the navigation-probe allocation fix; no samples were trimmed or selected from the three trials. These are submission measurements with whole-encounter/load variation, not an isolated animation-cost claim. [Before](../../artifacts/nextgen/m10-final/bench/before/benchmark.json), [delivered M10](../../artifacts/nextgen/m10-final/bench/after/benchmark.json), [passing rescue](../../artifacts/nextgen/m10-final/bench/m10-rescue-bench-probes/benchmark.json). The reviewed working-source patch and bundle hashes are retained beside the passing receipt. Subsequent tuning changed only enemy-damage constants, which the invulnerable benchmark fixture does not consume; motion and navigation code remain unchanged.

Per the owner’s final direction, no quiet window is reserved or awaited and no further M10 benchmark runs are planned. Balance work is complete. The integration agent owns isolated performance certification after other CPU-heavy jobs finish.

## Gallery and first looks

Absolute gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/index.html`.

Start with these native-pixel strips:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-run-90.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-cast-seismic-slam.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-cast-cryo-nova.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-hit.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/crawler-heavy-hit.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/brute-warden-attack.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/carrier-matron-death-frost.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/native/rescue/families-and-crowd/m10-melee-brute-awakening-bay-06.png`

The gallery opens with rescue balance, CPU, current family/crowd captures and native campaigns; original delivered gameplay evidence is labeled historical. Successful intermediate capture rounds are deleted after final review. Failed raw parents remain. The five family native phase boards and heavy/ability images were opened at native size and480×270; all43 exact-quarter strip contacts plus corrected firing/crowd sheets were opened. Queen remains legacy-save-only and is excluded.

## Integration requests

Audio stream: add family windup and strike cues on the existing enemy-warning/enemy-attack receipts, with swarm concurrency/weight limits. M10 changes no synthesis. K10: preserve original marine bone names/rest transforms when replacing meshes; authored clips bind to those names. Gameplay integration: the one authorized full balance confirmation now passes every requested target; retain the attack-shape and control/rest contracts when integrating.

## Per-action M9-final → M10 scores

All205 matched action grades are listed here; the gallery score file also includes47 explicitly unpaired studies and the per-action critiques.

| Subject | Action | M9 → M10 |
|---|---|---:|
|marine|idle|4→7|
|marine|run-0|6→7|
|marine|run-45|6→7|
|marine|run-90|6→7|
|marine|run-135|5→7|
|marine|run-180|5→7|
|marine|run-225|5→7|
|marine|run-270|6→7|
|marine|run-315|6→7|
|marine|stop-start|6→7|
|marine|fire-pistol|6→8|
|marine|fire-rifle|6→8|
|marine|fire-shotgun|6→8|
|marine|fire-plasma|5→8|
|marine|fire-rocket|6→8|
|marine|reload|6→7|
|marine|weapon-switch|6→7|
|marine|dash|5→7|
|marine|hit|4→8|
|marine|death|5→8|
|marine|cast-ram|5→7|
|marine|cast-seismic-slam|5→8|
|marine|cast-bulwark|6→7|
|marine|cast-railbreaker|5→8|
|marine|cast-frost-trail|5→7|
|marine|cast-cryo-nova|5→8|
|marine|cast-glacier|6→8|
|marine|cast-whiteout|5→7|
|marine|cast-afterburn|5→7|
|marine|cast-flashfire|5→7|
|marine|cast-napalm-charge|6→7|
|marine|cast-meltdown|5→7|
|marine|cast-static-step|5→7|
|marine|cast-overload|5→7|
|marine|cast-tesla-pylon|6→8|
|marine|cast-overclock|5→7|
|crawler|idle|4→7|
|crawler|run|6→7|
|crawler|attack|4→8|
|crawler|light-hit|5→8|
|crawler|heavy-hit|6→8|
|crawler|stagger|6→8|
|crawler|frozen|6→7|
|crawler|burning|3→7|
|crawler|shocked|4→7|
|crawler|death|6→7|
|crawler|death-frost|5→8|
|crawler|death-burn|5→7|
|crawler|death-arc|5→7|
|crawler|spawn|4→7|
|spitter|idle|4→7|
|spitter|run|5→7|
|spitter|attack|6→8|
|spitter|light-hit|5→8|
|spitter|heavy-hit|6→8|
|spitter|stagger|6→8|
|spitter|frozen|6→7|
|spitter|burning|3→7|
|spitter|shocked|4→7|
|spitter|death|6→7|
|spitter|death-frost|5→8|
|spitter|death-burn|5→7|
|spitter|death-arc|5→7|
|spitter|spawn|4→7|
|brute|idle|4→7|
|brute|run|5→7|
|brute|attack|7→8|
|brute|light-hit|5→8|
|brute|heavy-hit|5→8|
|brute|stagger|5→8|
|brute|frozen|6→7|
|brute|burning|3→7|
|brute|shocked|4→7|
|brute|death|6→7|
|brute|death-frost|5→8|
|brute|death-burn|5→7|
|brute|death-arc|5→7|
|brute|spawn|4→7|
|stalker|idle|4→7|
|stalker|run|6→7|
|stalker|attack|4→8|
|stalker|light-hit|4→8|
|stalker|heavy-hit|4→8|
|stalker|stagger|4→8|
|stalker|frozen|6→7|
|stalker|burning|3→7|
|stalker|shocked|4→7|
|stalker|death|6→7|
|stalker|death-frost|5→8|
|stalker|death-burn|5→7|
|stalker|death-arc|5→7|
|stalker|spawn|4→7|
|carrier|idle|4→7|
|carrier|run|4→7|
|carrier|attack|3→8|
|carrier|light-hit|4→8|
|carrier|heavy-hit|5→8|
|carrier|stagger|5→8|
|carrier|frozen|6→7|
|carrier|burning|3→7|
|carrier|shocked|4→7|
|carrier|death|6→7|
|carrier|death-frost|5→8|
|carrier|death-burn|5→7|
|carrier|death-arc|6→7|
|carrier|spawn|4→7|
|crawler-elite|idle|4→7|
|crawler-elite|run|6→7|
|crawler-elite|attack|4→8|
|crawler-elite|light-hit|5→8|
|crawler-elite|heavy-hit|6→8|
|crawler-elite|stagger|6→8|
|crawler-elite|frozen|6→7|
|crawler-elite|burning|3→7|
|crawler-elite|shocked|4→7|
|crawler-elite|death|6→7|
|crawler-elite|death-frost|5→8|
|crawler-elite|death-burn|5→7|
|crawler-elite|death-arc|5→7|
|crawler-elite|spawn|4→7|
|spitter-elite|idle|4→7|
|spitter-elite|run|5→7|
|spitter-elite|attack|6→8|
|spitter-elite|light-hit|5→8|
|spitter-elite|heavy-hit|6→8|
|spitter-elite|stagger|6→8|
|spitter-elite|frozen|6→7|
|spitter-elite|burning|3→7|
|spitter-elite|shocked|4→7|
|spitter-elite|death|6→7|
|spitter-elite|death-frost|5→8|
|spitter-elite|death-burn|5→7|
|spitter-elite|death-arc|5→7|
|spitter-elite|spawn|4→7|
|brute-elite|idle|4→7|
|brute-elite|run|5→7|
|brute-elite|attack|7→8|
|brute-elite|light-hit|5→8|
|brute-elite|heavy-hit|5→8|
|brute-elite|stagger|5→8|
|brute-elite|frozen|6→7|
|brute-elite|burning|3→7|
|brute-elite|shocked|4→7|
|brute-elite|death|6→7|
|brute-elite|death-frost|5→8|
|brute-elite|death-burn|5→7|
|brute-elite|death-arc|5→7|
|brute-elite|spawn|4→7|
|stalker-elite|idle|4→7|
|stalker-elite|run|6→7|
|stalker-elite|attack|4→8|
|stalker-elite|light-hit|4→8|
|stalker-elite|heavy-hit|4→8|
|stalker-elite|stagger|4→8|
|stalker-elite|frozen|6→7|
|stalker-elite|burning|3→7|
|stalker-elite|shocked|4→7|
|stalker-elite|death|6→7|
|stalker-elite|death-frost|5→8|
|stalker-elite|death-burn|5→7|
|stalker-elite|death-arc|5→7|
|stalker-elite|spawn|4→7|
|carrier-elite|idle|4→7|
|carrier-elite|run|4→7|
|carrier-elite|attack|3→8|
|carrier-elite|light-hit|4→8|
|carrier-elite|heavy-hit|5→8|
|carrier-elite|stagger|5→8|
|carrier-elite|frozen|6→7|
|carrier-elite|burning|3→7|
|carrier-elite|shocked|4→7|
|carrier-elite|death|6→7|
|carrier-elite|death-frost|5→8|
|carrier-elite|death-burn|5→7|
|carrier-elite|death-arc|6→7|
|carrier-elite|spawn|4→7|
|brute-warden|idle|4→7|
|brute-warden|run|5→7|
|brute-warden|attack|7→8|
|brute-warden|light-hit|5→8|
|brute-warden|heavy-hit|5→8|
|brute-warden|stagger|5→8|
|brute-warden|frozen|6→7|
|brute-warden|burning|3→7|
|brute-warden|shocked|4→7|
|brute-warden|death|6→7|
|brute-warden|death-frost|5→8|
|brute-warden|death-burn|5→7|
|brute-warden|death-arc|5→7|
|brute-warden|spawn|4→7|
|carrier-matron|idle|4→7|
|carrier-matron|run|4→7|
|carrier-matron|attack|3→8|
|carrier-matron|light-hit|4→8|
|carrier-matron|heavy-hit|5→8|
|carrier-matron|stagger|5→8|
|carrier-matron|frozen|6→7|
|carrier-matron|burning|3→7|
|carrier-matron|shocked|4→7|
|carrier-matron|death|6→7|
|carrier-matron|death-frost|5→8|
|carrier-matron|death-burn|5→7|
|carrier-matron|death-arc|6→7|
|carrier-matron|spawn|4→7|
|crowd|run|7→7|
