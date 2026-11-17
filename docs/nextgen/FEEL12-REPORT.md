# FEEL12 — readable threats and weighty hits

Branch: `t3/aim-threat-hit-feedback`. No push or PR. Final native campaigns and measured comparisons are being recorded below.

## Implementation

Merged `nextgen` (`96f9f93a`) before resumed visual work, including the second-pass creature meshes on unchanged skeletons, and again at `ef37826e` for the lead marine investigation. `npm ci` completed after the latest merge. The final ordinary `npm run build` passed (363 modules); all 30 JavaScript/CSS assets match the frozen `runtime-solid4` build byte-for-byte, runtime source `c7967ee7107d258eb7123e70d6ff0ebc25a6c867`. No tests, test runners or CI gates were added or run.

The marine startup inversion was an untracked `origin` bone: legacy rest and ready bases differ by 180°. Stopping the legacy action restored the wrong basis during ordinary startup, while the strip runner's reset masked it. Startup now preserves the ready basis. Aim correction acts through the actual firing hand before reading its socket; cast receiver arms stay in a reachable forward pocket, and free-arm gestures stay forward of the shoulder. The muzzle remains on the physical weapon. All five weapons and sixteen cast poses were captured at eight angles. Across 2,112 sampled frames, the largest measured horizontal barrel error was 3.025° (Napalm Charge 225°, frame 2); these are non-gating presentation diagnostics. Native Awakening Bay spawn and Railbreaker were opened before/after the startup correction.

The marine occlusion skin now rejects its own nearest geometry ID from the existing borrowed MRT, so self-occluded surfaces no longer draw cyan lines through the torso. The latest merged architecture-class guard additionally limits the silhouette to world obstruction. No target, extra draw or texture disposal ownership was added. Native High/Low calm and Railbreaker frames were opened; the final torso is solid and forward-facing. The lead exact heavy Crew Checkpoint frame was reproduced after the latest merge: disabling the geometry rejects recreates internal cyan skin lines. Default High and Low use classified geometry; manual Low with contours disabled has no geometry MRT and reproduced the more severe wireframe ghost. That unclassified path now omits the full-skin overlay while retaining the locator/hit arc. It allocates no new target. Matched native/480 frames and the original reviewer frame are in `lead-marine/`. Disabling stylized shading or dynamic lights did not remove the defect. The warning dimmer touches only the locator material; native affliction tint is applied to enemy actors, and the fixture has neither dash nor invulnerability active. No full-body status tint or opacity change was added.

Hostile melee marks retain their exact native footprints. Wider nested keylines/rims, a weighted sweep and a warm final 100 ms commitment beat distinguish warnings from floors and effects. The locator is quieter and dims locally under warnings. Friendly ordinary particle/spark detail yields locally; the existing ability priority mask remains. Incoming native damage direction drives a brief stable orange side arc, respecting flash intensity/reduced motion. No environmental source direction is invented.

Enemy presentation holds a loaded family pose on the first wind-up frame, stretches through native strike and remains asymmetric through recovery. Whole-body flinch is directional and weighted by mass; shotgun receipts request the heavier reaction. Brute wind-up is compressed beneath raised cleavers. The Carrier follow-up reduces excessive rear pitch against the neutral pose so the new sac stays broader over its feet. Rifle/shotgun presentation now connects muzzle/recoil, tracer, point spark, family-coloured ichor, victim loading and directional collapse/physics carry. The other three weapons share damaging/armor point feedback, distinguishing armor sparks from damaging liquid; generic rocket splash does not carry a correlated directional-flinch receipt. Authored collapse carries the native killing impulse before physics takeover.

Marine locomotion was reauthored in Blender on the unchanged skeleton: a cycle of 20 frames shortens stance reach by 16.7% at unchanged planted-foot velocity, with stronger pelvis compression and shoulder counterturn. A later native moving campaign frame exposed doubled arm translations in additive upper-body layers: the reference ready clip omits constant translation tracks, so Three's additive conversion left those translations absolute and added them again. Upper/grip additive layers now retain only quaternion tracks; base clips keep all translation. Matched moving-rifle before/after strips remove the gross shoulder/forearm gaps. The generating source remains under `tools/assets/m10-motion/`. Existing rig/animation notices remain.

## Look → fix evidence

Actual opened findings, rejected poses and three threat/physical-feedback rounds are recorded in [FEEL12-review.md](plans/FEEL12-review.md) and [FEEL12-aim-review.md](plans/FEEL12-aim-review.md). The first heading-only correction was rejected after Flashfire showed a detached receiver. Native spawn subsequently exposed the180° basis defect despite successful isolated strips. Crawler body commitment, Brute width, Carrier pitch, weak dark-floor final fill and too-small rifle flinch each received a frame-driven correction.

Gallery: `artifacts/nextgen/feel12-final/index.html`.

| Cohort | Retained evidence | Scope |
|---|---:|---|
| Aim final |176 strips / 8 angles / 32 native contacts|Frozen canonical pose playback; native startup verified separately|
| Threat round 1 |360 native frames|Exploratory; live dist was rebuilt mid-run, explicitly mixed-source|
| Threat round 2 |210 native frames / 33 deformed strips|Immutable source `21875431`|
| Threat round 3 |460 native frames / 57 deformed strips / 19 exact480 contacts|Immutable source `ebc13052`; zero failures/errors|
| Weapon chains |50paired strips|Every weapon×family hit/kill; frozen simulation presentation replay|
| Family motion |84strips|Five families, elites, Warden and Matron; run/attack/hit/death|
| Carrier follow-up |15strips  + 60 native frames|Final2 source `e0f9d9af`; both contrast rooms|
| Native firearms |300frames / 10 weapon-room lanes|Actual projectile/contact/death receipts, capture-only invulnerability|
| Marine gait |17strips|Eight travel directions, stop/start and eight reversals at aim0°|
| Native movement |16frames|Crew Checkpoint/Relay Racks native moving combat; zero failures/errors|
| Moving weapon follow-up |10 strips / 240 poses|All five fire/reload pairs, final merged assets; every native/quarter opened|
| Lead marine follow-up |Exact heavy frame, 4 rig variants and Low modes|Original reviewer image, matched overlay counterfactual, fixed High/Low and lighting exclusions|
| Long settle |6 ten-second strips|Normal/high impulse Crawler, Brute and Matron; stable retained poses after retirement/support correction|

The full-original opening receipts are `aim-final/opened-full-strips.json`, `threats-round3/opened-files.json`, `weight-full-strip-opened.json` and `moving-weapons-final/opened-files.json`; these accompany the actual written look findings rather than substituting for them.

Native images were opened at gameplay size and exact480×270; isolated crops also have exact-quarter BOX views. Contacts preserve native pixels where labelled. Isolated strips do not establish native collision acceptance, human dodge success or hardware performance. Native firearm lanes show one actual Crawler corpse per lane; armor contacts are counted separately from damage. Rifle Relay's later contacts were chiefly armor, correcting an earlier inference that those shots missed.

The first capture attempt failed on sandbox localhost permission. Escalated capture subsequently worked; slow commands were allowed to complete. A paired pilot initially put an actor outside the viewport; its failed receipt remains. Native corpse strip derivation cannot follow retired target bounds through death; complete original firearm frames/480 views remain authoritative. No diagnostic was weakened to hide either failure.

Round3 retained render-program inventory stayed unchanged from each scenario's last prepared inventory (124–129 programs, varying by room/cohort). The capture compilation trace is null, so this is an unchanged-inventory observation, not an explicit compiler trace.

## Campaigns and measured comparisons

Pending completion of the serial native campaigns and benchmark cohorts. Runs use seed 1729, ordinary unassisted policy, every fixed tick rendered, frozen final2 source `e0f9d9af752e8194803675a4e9407d986ee74b3e`. Natural deaths are completed attempts, not twenty-room victories or completion-rate estimates.

## Remaining limits and ownership

- Railbreaker body/gun and discharge heading now agree, but its beam still starts at the native body/lane origin rather than the exact muzzle socket. Its VFX12 kit/service has no muzzle-anchor input. Moving the entire event would also move ground/impact geometry, and monkey-patching the kit is inappropriate. An optional weapon-source anchor in the excluded ability module is the specific remaining integration change.
- Rocket explosion hit receipts have no correlated source angle/weapon identifier. Native blast and killing momentum are observed; nonlethal splash flinch direction cannot be reliably reconstructed without a simulation-receipt extension, outside presentation-only scope.
- There is no critical-hit mechanic/receipt in the current simulation. Existing high-damage/lethal heavy reactions remain; no critical roll was invented.
- Light hits on tiny enemies remain brief at 480×270. Plasma's support hand is low; heavy weapons become one-handed during free-arm casts; Tesla Pylon retains a deep bow. Shared reloads retain an overhead pose; strafes retain brief straight support legs/toe angularity. Matron death can roll for several seconds and finish in a propped pose; stable retained poses after retirement/support correction are observed in the longer capture. The studio background does not establish universal native corpse-to-deck contact; Matron high-impulse root displacement reaches about -1.997 m before its last three identical poses. The short 1.6 s strip does not prove settling.

The requested order is recorded as A: aim strips/native spawn and moving follow-up; B: three written threat rounds across pale/dark/crowd fixtures; C: rifle/shotgun first, all-family/all-weapon chains, gait and long settle; D: serial native campaigns below; E: this report and retained gallery. The exact Railbreaker source anchor, splash-source receipt and nonexistent crit mechanic have the specific scope reasons above.

Simulation decisions, damage, clocks, shapes, saves, camera, encounters, UI screens and ability-effect modules were not changed by FEEL12. `DepthRenderer.ts` changes are delimited presentation bridges. No new runtime dependency or license was introduced. Sparse checkout and all third-party notices remain intact.
