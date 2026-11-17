# FEEL12 — readable threats and weighty hits

Branch: `t3/aim-threat-hit-feedback`. No push or PR. Visual review, four native campaign attempts and the measured comparison are complete; remaining limits are explicit below.

## Implementation

Merged `nextgen` (`96f9f93a`) before resumed visual work, including the second-pass creature meshes on unchanged skeletons, and again at `ef37826e` for the lead marine investigation. `npm ci` completed after the latest merge. The final ordinary `npm run build` passed (363 modules); all 30 JavaScript/CSS assets match the frozen `runtime-solid4` build byte-for-byte, runtime source `c7967ee7107d258eb7123e70d6ff0ebc25a6c867`. No tests, test runners or CI gates were added or run.

The marine startup inversion was an untracked `origin` bone: legacy rest and ready bases differ by 180°. Stopping the legacy action restored the wrong basis during ordinary startup, while the strip runner's reset masked it. Startup now preserves the ready basis. Aim correction acts through the actual firing hand before reading its socket; cast receiver arms stay in a reachable forward pocket, and free-arm gestures stay forward of the shoulder. The muzzle remains on the physical weapon. All five weapons and sixteen cast poses were captured at eight angles. Across 2,112 sampled frames, the largest measured horizontal barrel error was 3.025° (Napalm Charge 225°, frame 2); these are non-gating presentation diagnostics. Native Awakening Bay spawn and Railbreaker were opened before/after the startup correction.

The marine occlusion skin now rejects its own nearest geometry ID from the existing borrowed MRT, so self-occluded surfaces no longer draw cyan lines through the torso. The latest merged architecture-class guard additionally limits the silhouette to world obstruction. No target, extra draw or texture disposal ownership was added. Native High/Low calm and Railbreaker frames were opened; the final torso is solid and forward-facing.

The lead exact heavy Crew Checkpoint frame was reproduced after the latest merge: disabling the geometry rejects recreates internal cyan skin lines. Default High and Low use classified geometry; manual Low with contours disabled has no geometry MRT and reproduced the more severe wireframe ghost. That unclassified path now omits the full-skin overlay while retaining the locator/hit arc. It allocates no new target. Matched native/480 frames and the original reviewer frame are in `lead-marine/`. In the corrected current pose, disabling stylized shading or dynamic lights leaves the armor similarly light; those comparisons do not isolate every color difference in the historical reversed pose. The warning dimmer touches only the locator material; native affliction tint is applied to enemy actors, and the original exact-frame ability snapshot reports neither dash nor invulnerability, while matched comparisons keep fixture protection unchanged. Opaque armour and rig albedos are left intact; status details remain separate accents. No full-body status tint or opacity change was added.

Hostile melee marks retain their exact native footprints. Wider nested keylines/rims, a weighted sweep and a warm final 100 ms commitment beat distinguish warnings from floors and effects. The locator is quieter and dims locally under warnings. Friendly ordinary particle/spark detail yields locally; the existing ability priority mask remains. Incoming native damage direction drives a brief stable orange side arc, respecting flash intensity/reduced motion. No environmental source direction is invented.

Enemy presentation holds a loaded family pose on the first wind-up frame, stretches through native strike and remains asymmetric through recovery. Whole-body flinch is directional and weighted by mass; shotgun receipts request the heavier reaction. Brute wind-up is compressed beneath raised cleavers. The Carrier follow-up reduces excessive rear pitch against the neutral pose so the new sac stays broader over its feet. Rifle/shotgun presentation now connects muzzle/recoil, tracer, point spark, family-coloured ichor, victim loading and directional collapse/physics carry. The other three weapons share damaging/armor point feedback, distinguishing armor sparks from damaging liquid; generic rocket splash does not carry a correlated directional-flinch receipt. Authored collapse carries the native killing impulse before physics takeover.

Marine locomotion was reauthored in Blender on the unchanged skeleton: a cycle of 20 frames shortens stance reach by 16.7% at unchanged planted-foot velocity, with stronger pelvis compression and shoulder counterturn.

A later native moving campaign frame exposed doubled arm translations in additive upper-body layers: the reference ready clip omits constant translation tracks, so Three's additive conversion left those translations absolute and added them again. Upper/grip additive layers now retain only quaternion tracks; base clips keep all translation. Matched moving-rifle before/after strips remove the gross shoulder/forearm gaps. The generating source remains under `tools/assets/m10-motion/`. Existing rig/animation notices remain.

## Look → fix evidence

Actual opened findings, rejected poses and three threat/physical-feedback rounds are recorded in [FEEL12-review.md](plans/FEEL12-review.md) and [FEEL12-aim-review.md](plans/FEEL12-aim-review.md). The first heading-only correction was rejected after Flashfire showed a detached receiver. Native spawn subsequently exposed the 180° basis defect despite successful isolated strips. Crawler body commitment, Brute width, Carrier pitch, weak dark-floor final fill and too-small rifle flinch each received a frame-driven correction.

Gallery: `artifacts/nextgen/feel12-final/index.html`.

| Cohort | Retained evidence | Scope |
|---|---:|---|
| Aim final |176 strips / 8 angles / 32 native contacts|Frozen canonical pose playback; native startup verified separately|
| Threat round 1 |360 native frames|Exploratory; live dist was rebuilt mid-run, explicitly mixed-source|
| Threat round 2 |210 native frames / 33 deformed strips|Immutable source `21875431`|
| Threat round 3 |460 native frames / 57 deformed strips / 19 exact480 contacts|Immutable source `ebc13052`; zero failures/errors|
| Weapon chains |50 paired strips|Every weapon×family hit/kill; frozen simulation presentation replay|
| Family motion |84 strips|Five families, elites, Warden and Matron; run/attack/hit/death|
| Carrier follow-up |15 strips + 60 native frames|Final2 source `e0f9d9af`; both contrast rooms|
| Native firearms |300 frames / 10 weapon-room lanes|Actual projectile/contact/death receipts, capture-only invulnerability|
| Marine gait |17 strips|Eight travel directions, stop/start and eight reversals at aim 0°|
| Native movement |16 frames|Crew Checkpoint/Relay Racks native moving combat; zero failures/errors|
| Moving weapon follow-up |10 strips / 240 poses|All five fire/reload pairs, final merged assets; every native/quarter opened|
| Lead marine follow-up |Exact before/after +24 final burst frames|All four High rigs and default/minimal Low; every native marine strip and exact480 contact opened|
| Native heavy victims |540 frames /18 bursts|Fixed-input before, tracking-input follow-up and longer Relay Brute tail; eight accepted target-specific rifle/shotgun kill chains|
| Long settle |6 ten-second strips|Normal/high impulse Crawler, Brute and Matron; stable retained poses after retirement/support correction|

The full-original opening receipts are `aim-final/opened-full-strips.json`, `threats-round3/opened-files.json`, `weight-full-strip-opened.json` and `moving-weapons-final/opened-files.json`; these accompany the actual written look findings rather than substituting for them.

Native images were opened at gameplay size and exact480×270; isolated crops also have exact-quarter BOX views. Contacts preserve native pixels where labelled. Isolated strips do not establish native collision acceptance, human dodge success or hardware performance. The original native firearm lanes show one actual Crawler corpse per lane; armor contacts are counted separately from damage. The heavy-victim supplement adds Stalker/Brute rifle and shotgun in both rooms: six target-specific kills in the tracking cohort and the two Relay Brute kills in the longer cohort. Initial fixed aim legitimately misses after attack travel; existing capture-only aim tracking supplies the missing live chains. Native wave refills remain active, so receipts are filtered by the staged target ID. Health, armor, damage and attack timings were not normalized or weakened. The 250/500 ms supplements establish contacts and kill carry; the earlier 50 ms lanes and detailed strips remain the finer recoil/flinch evidence. Rifle Relay's later contacts were chiefly armor, correcting an earlier inference that those shots missed.

The first capture attempt failed on sandbox localhost permission. Escalated capture subsequently worked; slow commands were allowed to complete. A paired pilot initially put an actor outside the viewport; its failed receipt remains. Native corpse strip derivation cannot follow retired target bounds through death; complete original firearm frames/480 views remain authoritative. No diagnostic was weakened to hide either failure.

Round3 retained render-program inventory stayed unchanged from each scenario's last prepared inventory (124–129 programs, varying by room/cohort). The capture compilation trace is null, so this is an unchanged-inventory observation, not an explicit compiler trace.

## Campaigns and measured comparisons

Final serial runs used seed 1729, ordinary unassisted policy and every fixed tick rendered, frozen `runtime-solid4` source `c7967ee7107d258eb7123e70d6ff0ebc25a6c867`. Every process exited 0; every report has zero errors and zero defects.

| Rig | Outcome | Rooms cleared | Wall seconds |
|---|---|---:|---:|
| Breacher | Natural death | 7 | 1,333.0 |
| Cryo | Complete | 20 | 3,558.1 |
| Pyro | Natural death | 13 | 1,674.9 |
| Arc | Natural death | 13 | 1,174.0 |

Reports, traces, source receipts and screenshots are retained under `campaigns/<rig>/`. Natural deaths are completed attempts, not twenty-room victories or completion-rate estimates. Fixed-step wall durations are not hardware FPS. Selected actual campaign frames for all four rigs were opened at native size and exact480, including a left-facing Cryo back view and dense frost/fire/electric effects; `campaign-review480/opened-files.json` identifies them. Superseded final2 attempts are labelled in `superseded-campaigns.json`; the manually interrupted old Cryo is not a pass.

`npm run bench` completed sixteen 10-second cases (all four rigs × Crew Checkpoint/Relay Racks × High/Low, one repeat), exit 0, zero errors, zero WebGL errors/context losses and zero measured combat shader creations. Peak draws were 130 and retained program inventory 282, below the tool’s 330 headroom/400 program bounds. Native scene-light and instance-mesh inventories remained unchanged through combat. Allocation profiling was not sampled; retained presentation pools/scratch are a source-design property, not a measured allocation-rate result.

| Room / tier | CPU p95 ms range across rigs | RAF p95 ms range | Per-case peak draws |
|---|---:|---:|---:|
| Crew Checkpoint / High | 20.1–63.2 | 40.6–76.4 | 104–119 |
| Crew Checkpoint / Low | 16.3–46.9 | 25.5–50.0 | 90–102 |
| Relay Racks / High | 20.0–48.1 | 49.6–68.1 | 123–130 |
| Relay Racks / Low | 15.4–33.4 | 18.6–50.8 | 110 |

Raw results: `bench-final/benchmark.json`; the gallery includes the observed draw-inventory chart and per-case table. CPU here is the sum of update/render/HUD phase wall times. The timing target flags are missed; this was not a requested `--acceptance` run and is not performance acceptance. Recorded one-minute host load varied from 33.6 to 250.9 on the Apple M1 Pro. These sequential one-repeat ranges cannot isolate FEEL12 cost or establish a causal High/Low speedup under that changing contention. They are measured diagnostics, not hardware FPS inferred from screenshots or fixed-step bots.

## Remaining limits and ownership

- Railbreaker body/gun and discharge heading now agree, but its beam still starts at the native body/lane origin rather than the exact muzzle socket. Its VFX12 kit/service has no muzzle-anchor input. Moving the entire event would also move ground/impact geometry, and monkey-patching the kit is inappropriate. An optional weapon-source anchor in the excluded ability module is the specific remaining integration change.
- Rocket explosion hit receipts have no correlated source angle/weapon identifier. Native blast and killing momentum are observed; nonlethal splash flinch direction cannot be reliably reconstructed without a simulation-receipt extension, outside presentation-only scope.
- There is no critical-hit mechanic/receipt in the current simulation. Existing high-damage/lethal heavy reactions remain; no critical roll was invented.
- Spitter’s small warning edge can still be partly covered by feet or a bright grate; its held body commitment carries more of the cue there. Its simulated footprint was not enlarged.
- Light hits on tiny enemies remain brief at 480×270. Plasma's support hand is low; heavy weapons become one-handed during free-arm casts; Tesla Pylon retains a deep bow. Shared reloads retain an overhead pose; strafes retain brief straight support legs/toe angularity. Matron death can roll for several seconds and finish in a propped pose; stable retained poses after retirement/support correction are observed in the longer capture. The studio background does not establish universal native corpse-to-deck contact; The short 1.6 s strip does not prove settling.

The requested order is recorded as A: aim strips/native spawn and moving follow-up; B: three written threat rounds across pale/dark/crowd fixtures; C: rifle/shotgun first, all-family/all-weapon chains, gait and long settle; D: four serial native attempts described above; E: this report and retained gallery. The exact Railbreaker source anchor, splash-source receipt and nonexistent crit mechanic have the specific scope reasons above.

Simulation decisions, damage, clocks, shapes, saves, camera, encounters, UI screens and ability-effect modules were not changed by FEEL12. `DepthRenderer.ts` changes are delimited presentation bridges. No new runtime dependency or license was introduced. Sparse checkout and all third-party notices remain intact. Six superseded build directories and the incomplete native corpse-crop derivative were removed; their hashes/source receipts and the actual critique captures remain, with only `runtime-solid4` retained as the final playable distribution.
