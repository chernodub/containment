# M10 — melee states and authored combat motion

Branch `t3/enemy-attack-motion`; authored implementation `d2eb25da1bf8cfcd96407c841907ee4a0d207334`, shipping motion/firing correction `adf3c72dbda47c5cc2df3cf22acef4555936cb72` (final report commit supplied at handoff).

Melee now earns a visible warning and resolves one shaped strike. Blender-authored animation-only packages replace the weakest primary poses while retaining runtime aim/flinch/foot correction and the original skeletons. **Balance does not meet the requested target:** the sole after cohort completed6/80 runs versus39/80 before. The cohort cap is respected; no extra balance cohort or evidence infrastructure was added.

## Attack state contract

All families use approach → windup → strike → recovery. A shared attack slot is required; existing separation, ranged spacing and three-slot limit remain. Origin/facing track during early windup, lock at72%, then remain fixed through strike/recovery. The single windup→strike transition checks circle overlap with the exact sector/capsule and clear shot. Native dash immunity still decides damage acceptance; stepping out misses. Freeze/stun/shove/launch cancel anticipation and require a new warning. Overclock scales the hostile clock. Ranged spit damage/timing and charge movement/warning clocks remain separate. Recurring touch damage is removed even during charge; a following melee hit must earn its own warning.

Values below are base catalog values before story/elite/champion multipliers. Distances are simulation units; arc/cone angles are half angles in radians. Elite windup×.82 and recovery×.85. Cooldown runs from windup start, so minimum repeat cadence is the greater of cooldown and the three phase durations.

| Family | Windup / strike / recovery ms | Strike shape | Damage M9 → M10 | Minimum cadence ms |
|---|---:|---|---:|---:|
| Crawler |260 /70 /240|arc range66, half angle.72|12→15|600|
| Stalker |420 /90 /560|capsule length155, width36|22→26|1070|
| Brute |650 /120 /450|arc range94, half angle1.08|35→42|1220|
| Spitter |350 /90 /420|cone range58, half angle.78|10→12 melee; ranged10 unchanged|860|
| Carrier |620 /120 /460|cone range82, half angle1.15|18→22|1200|

Additive snapshot fields are `meleePhase`, `meleeProgress`, `meleeAngle`, `meleeFacingLocked`, `meleeShape`, `meleeOriginX/Y`, `meleeRemainingMs`, `meleeDurationMs`, `meleeDamage`. Existing warning/attack effects carry the shape and low danger weight. The warning batch uses filled sectors/capsules matching the simulation footprint. Attack state is room-local; checkpoint bytes/schema do not change and old rooms initialize approach/default clocks. No renderer value participates in hit resolution.

## Balance — exactly two cohorts

Twenty seeds×four rigs, identical seeds before/after:1729,2718,31415,42,137,8675309,2026,9001,65537,123456,17,23,101,256,512,1024,4096,8192,16384,32768. One tuning iteration changes only melee damage/cadence. Before uses frozen original game/policy; after adds simple telegraph avoidance and late dash logic. Player/ability values and ranged damage remain unchanged.

| Measure | Before | After | Target |
|---|---:|---:|---:|
| Campaign completion |39/80,48.75%|6/80,7.5%|40–65%|
| Breacher |6/20,30%|2/20,10%|≥35%|
| Cryo |11/20,55%|3/20,15%|≥35%|
| Pyro |10/20,50%|1/20,5%|≥35%|
| Arc |12/20,60%|0/20,0%|≥35%|
| Transmission median |64.242s|61.533s|60–75s|

Transmission timing passes; completion fails badly. Baseline Breacher already missed the per-rig floor. New close-range shaped attacks can resolve beyond literal body contact, and the policy still has its earlier proximity dash behavior; these are plausible contributors, not experimentally isolated causes. No claim of restored difficulty is made. Raw cohorts and frozen sources are in `artifacts/nextgen/m10-final/balance/{before,after}`. Further balance work needs an owner-authorized evidence budget.

## Authored motion and ownership

The generating scripts live in `tools/assets/m10-motion/`. Temporary IK goals/poles author real bone arcs and planted contacts, then bake to the exact retained node names/rest hierarchy. Animation-only GLBs live in `public/assets/models/motion/`; base marine/weapon GLBs and all K10 mesh ownership remain untouched. Runtime merges clips by original bone name during asset loading, before preparation. No new runtime dependency was added. Generator code is MIT; retained skeleton animation adaptations preserve the model attribution/CC BY-SA4.0 terms in the shipped motion credits.

The marine package contains69 clips:32 travel/transition clips,16 casts,5 class-specific fire clips,5 ready grips, reload/switch/idle,4 hits and4 directional deaths. Every enemy package contains23 clips. Marine locomotion has eight independent direction cycles plus eight starts, stops and reversals. Body actions retain native impact receipts: held casts stop at their authored anticipation marker until the accepted impact. Moving reload/fire/switch use prepared upper-body additive clips. Enemy family phase clips follow the native normalized clock, including elites/time scale. Reduced motion attenuates optional hit/status clips through a prepared idle blend; zero strength clears those impulses. Essential travel/cast/attack poses remain readable. Primary death choreography hands the current articulated pose to the retained physics pool without a second launch; killing momentum and elemental frost/burn/arc/acid finishes remain native presentation.

Roots, collision, ground rings, telegraphs and health bars stay fixed. Marine authored live pelvis translation peaks at.17183m (<.175m=35% radius) and returns within233.33ms; static/held cards keep planar hips planted. Enemy authored center travel ends by250ms, with the runtime secondary layer reserving≤.049 radius inside the35% combined allowance; strike lunges follow the declared shape. Authored knees/limbs can articulate beyond the idle silhouette without moving the gameplay root. Pooling, skin batching and prepared hostile shader ownership remain; no mid-combat shader family was introduced. A≤45ms global presentation hold has650ms cooldown, scales with screenShake and clears when off/reduced; only Overdrive impact, elite kill and marine heavy hurt request it.

Three authored critique→fix rounds plus fresh acceptance are written in `docs/nextgen/plans/M10-review.md`. All native standard strips and their exact4× reductions were opened before family propagation.

## Verification and visual review

Owner revision merged as `b725dce` after WIP `81c3e15`. `npm ci` passed. All conflicting and newly authored test files were deleted per the owner decision; no tests, assertion gates or proof infrastructure were added afterward. Verification below uses build, play, ordinary captures and benchmark. Historical test receipts do not establish the final revision.

The full252-strip pass completed with0 errors; all43 complete exact-quarter contact pages were opened, alongside native standard/propagation strips, all16cast poses, selected full elemental deaths and the five real-room phase sheets. A crowd-only resample settles all six pooled actors past their breach entrances; both original/replacement manifests remain in receipts. The final three weapon fire cards were strengthened after review; all five firing rows were resampled after fixing accepted-shot priority over cosmetic switching and are recorded with their own source manifest. Untouched family/ability evidence uses the initial frozen authored build. The firing resample records the reviewed uncommitted changes subsequently committed in adf3c72; shipping heavy combat, benchmark and campaigns use its frozen distribution. Final readability formatting emits identical production JavaScript bundle names/hashes.

Native family capture:150 guarded PNGs,0 failures/errors. Heavy combat plus four public accepted ability bursts:60 guarded PNGs,0 failures/errors. The first extra ability capture stopped on a stale visible-caption requirement: the pre-existing compact HUD intentionally hides captions. Its equivalent fixture now requires the visible ability icon while retaining ID/action/pool checks; no UI code changed. Failed raw parents remain under `native/failed-parent` and `native/failed-ability-parent`.

Final native campaigns and measured performance follow below.

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

Four unassisted native keyboard/mouse runners, every fixed tick rendered, same shipping distribution. All four finish normally with0 errors and0 recorded defects; natural deaths are retained, not campaign victories. These required runs are play verification, not an additional simulation balance cohort.

| Rig | Terminal outcome | Rooms cleared | Errors / defects | Wall seconds |
|---|---|---:|---:|---:|
|breacher|dead|10/20|0 / 0|395.1|
|cryo|complete|20/20|0 / 0|599.0|
|pyro|dead|14/20|0 / 0|401.4|
|arc|dead|16/20|0 / 0|495.6|

Full traces, snapshots, per-room PNGs and terminal evidence: [Breacher](../../artifacts/nextgen/m10-final/play/breacher/index.html), [Cryo](../../artifacts/nextgen/m10-final/play/cryo/index.html), [Pyro](../../artifacts/nextgen/m10-final/play/pyro/index.html), [Arc](../../artifacts/nextgen/m10-final/play/arc/index.html). `npm run build` passes after final formatting; no automated suites or new assertion gates were run. The final formatting emits the same runtime JavaScript bundle hashes as the played distribution.

## Heavy-combat CPU

Same ordinary benchmark:Containment Annulus, Breacher, High1920×1080,25 legal replenished enemies,3×10s trials. Native effects/deaths/ability rules remain. One local browser; no local capture or Blender export overlapped the shipping trials.

| Trial | Before CPU average / p50 / p95 ms | After CPU average / p50 / p95 ms | Before → after frame p95 ms | After max draws | New programs |
|---|---:|---:|---:|---:|---:|
|0|7.656 /7.3 /10.9|8.140 /7.6 /11.3|18.0→18.2|193|0|
|1|7.688 /7.4 /10.5|7.963 /7.3 /11.4|18.2→18.1|193|0|
|2|7.691 /6.9 /10.3|8.288 /7.6 /12.3|18.0→18.1|185|0|

Mean of update+render CPU trial averages:**7.678→8.130ms,+.452ms(+5.9%)**. This slightly misses the engineering8ms mean budget; all shipping CPU p50s are below8ms. Draws stay below350; retained program inventory115 and zero mid-combat creations in every trial. Ordinary frame p95 is18.1–18.2ms, not a16.6ms hardware certificate. Shared-host one-minute load was13.84–15.66 before versus37.28–56.25 after (10 logical cores). This is whole-pipeline submission evidence with encounter/adaptive/load variation, not isolated animation cost or GPU completion. Raw max stalls/samples remain untrimmed. [Before](../../artifacts/nextgen/m10-final/bench/before/benchmark.json), [shipping after](../../artifacts/nextgen/m10-final/bench/after/benchmark.json). Earlier procedural/authored benchmarks are retained as historical intermediates and excluded from this final comparison.

## Gallery and first looks

Absolute gallery:`/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/index.html`.

Start with these native-pixel strips:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-run-90.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-cast-seismic-slam.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-cast-cryo-nova.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/marine-hit.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/crawler-heavy-hit.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/brute-warden-attack.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/after/carrier-matron-death-frost.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-09ec8531/artifacts/nextgen/m10-final/native/families/m10-melee-brute-awakening-bay-06.png`

Successful intermediate capture rounds are deleted after final review. Failed raw parents remain. The five family native phase boards and heavy/ability images were opened at native size and480×270; all43 exact-quarter strip contacts plus corrected firing/crowd sheets were opened. Queen remains legacy-save-only and is excluded.

## Integration requests

Audio stream: add family windup and strike cues on the existing enemy-warning/enemy-attack receipts, with swarm concurrency/weight limits. M10 changes no synthesis. K10: preserve original marine bone names/rest transforms when replacing meshes; authored clips bind to those names. Gameplay integration: completion balance is an unresolved release blocker, requiring a newly authorized tuning/evidence pass.

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
