# M10 implementation and motion review

## Plan and ownership

The simulation owns the melee clock, late facing lock, exact strike geometry and single damage resolution. Presentation consumes additive snapshots, leaving roots, collision, rings and health bars authoritative. Existing ranged specials remain separate. Attack state resets when rooms restart; no run checkpoint schema changes are needed.

Parallel implementation uses disjoint simulation, marine motion and enemy motion/ragdoll files. The lead owns renderer adapters, hostile ground warnings, presentation hold, bot counterplay and evidence. No world, room, UI, ability-rule, player-stat or audio synthesis changes.

Evidence uses exactly two 80-run simulation cohorts (20 identical seeds × four rigs), frozen HEAD before and final after. Seeds: 1729,2718,31415,42,137,8675309,2026,9001,65537,123456,17,23,101,256,512,1024,4096,8192,16384,32768. At most two balance tuning iterations. Native browsers run sequentially. Heavy-combat CPU is measured before/after with the ordinary benchmark.

Motion standard subjects: marine, crawler, brute. Three fresh strip critique→fix rounds precede family propagation. Mask IoU uses common native pixel registration, with 4× reductions inspected separately. Intermediate successful capture rounds are retired after review; final evidence stays in `artifacts/nextgen/m10-final/`.

Risks: the existing rig anatomy limits pose diversity; exact strike shapes must agree across simulation, bot and hostile batch; late lock and cancellation must retain slot limits; marine ragdoll lifecycle must survive room changes/restarts. Blender became available during implementation; authored clips replace the weak procedural primary poses.

## Review rounds

### Round 1 — native standard opened

Opened `m10-round1-native/{brute-attack,crawler-attack,crawler-heavy-hit,marine-hit,marine-run-90,marine-cast-seismic-slam}.png` and the actual quarter sheet. Silhouette change already exceeds the numerical target (marine hit .443, crawler heavy .420, brute anticipation .039), but extreme change does not establish a good pose. Crawler anticipation reads as a thin spear rather than a coiled animal; Brute becomes a leaning plank and detached-looking forearm blocks break the living anatomy. Marine hit bends strongly but returns too quickly to ready; slam raises one hand behind a horizontal gun instead of a two-hand overhead drop. Crossover legs read clearly.

Fix requests: broad crawler squat/coil, attached Brute shoulders/forearms and overhead torso chain; asymmetric recovery planting; marine stumble follow-through and a real deep knee drop with two-hand continuity. Strengthen secondary marine actions and distinguish nova/deployment bodies. Keep native footprint/aim assertions intact. The first sandbox-only strip attempt failed before any PNG with localhost `EPERM`; its receipt is retained.

### Round 2 — coherence before propagation

Opened full Brute/crawler idle and attack strips; marine hit/slam/Bulwark/Nova; all three exact-quarter contact sheets. Crawler is now a broad compressed animal instead of a spear, and Brute shields stay attached. Anticipation IoU .496/.345 and strike .307/.103 pass. Brute anticipation nevertheless reads as hanging arms, not an overhead hammer; its shoulder chain must actually lift the fists over the thorax. Spawn studies still resemble idle. Marine now lifts both hands/gun and drops, but the downbeat remains too upright; Nova is still a one-arm gesture. Hit counter-step finally survives quarter reduction. Cast pairwise IoU .45–.66 is distinct for the sampled Breacher trio.

Fix requests: direct Brute shoulder motion in real joint axes; a visible entrance pose in the first300ms; stronger light-hit limb response; deeper one-knee marine downbeat, bilateral Nova opening and stronger braced Railbreaker stance. Marine death study must use the actual retained articulated physics owner rather than only the fallback pose. No propagation yet.

## Balance tuning iteration 1

The frozen baseline finished exactly80 runs:39/80 complete (48.75%); Breacher6/20 (30%), Cryo11/20 (55%), Pyro10/20 (50%), Arc12/20 (60%). Transmission median64.242s. One melee-only tuning iteration raises base strike damage12→15 /22→26 /35→42 /10→12 /18→22 (crawler/stalker/brute/spitter/carrier). Brute recovery550→450ms, Carrier550→460ms, Spitter melee cooldown1500→860ms. Ranged spit and player/ability values remain unchanged. The sole80-run after cohort uses identical seeds with the simple warning-step/dash policy. No other balance cohort will run.

### Round 3 — final standard fixes, then propagate

Opened native Brute attack, crawler spawn, marine slam and actual articulated marine death; then all three exact-quarter sheets. Brute now raises connected fists above the head and drives down, but the fists overlap the centerline contour: separate them laterally in the held pose. Crawler squeeze is visible; lead-limb reach should be more asymmetric. Marine's deep downbeat and physical collapse read at quarter scale; slam still switches abruptly into the knee beat, requiring a short blend. Rail's grounded wide brace and hit counter-step are accepted as the standard. Final requested fixes are connected lateral hammer fists, leading breach reach, and smooth slam→kneel. Propagate this coherent standard to every family, then inspect final native/quarter contacts and all16 cast peaks.


## Owner revision — 2026-11-15

Committed procedural WIP as81c3e15, merged nextgen4b2a5f4 inb725dce, and removed all conflicting/new automated test files. The previous verification run was stopped. From here verification is build, the four native rig campaigns, the already-completed two balance cohorts, and opened native/quarter/480 captures. No tests or new assertion gates are added.

Blender5.3 now authors separate animation-only files. Marine/weapon base meshes and every skeleton name/rest transform stay unchanged for K10. Temporary IK controls are baked to original bones; export rebases onto the original GLB node hierarchy/rest matrices. The old procedural strips remain a historical critique source until final authored strips replace them.

### Authored standard round1

Opened native marine strafe/slam, Crawler/Brute attacks, Brute burn death, and all three exact-quarter contacts. Brute now lifts connected fists overhead; marine slam is an articulated drop with receiver continuity. Crawler anticipation IoU.697 and Brute.666 miss the.65 requirement. Marine locomotion has a severe repeating upper-body/gun flip at loop and half-cycle boundaries, despite the feet's useful crossover. Reload retrieval remains hidden at quarter scale. Burn curl/char is recognisable; the subsequent physical handoff adds an unwanted lift.

Fixes requested: stable aim-facing marine upper body across the baked cycle; wider visible reload retrieval and a less split trailing knee;20% clearer coherent enemy anticipation and stronger leading breach pull; remove the second upward kick when authored death hands over to physics.

Round1 diagnosis: the locomotion bake assigned child pose matrices against stale parents. Direct source-bone matrix_basis conversion against sampled parent matrices removes that transient; the upper body/socket is now pinned to ready while the hips/spine/legs move. This was an authored clip defect, not a renderer frame-clock issue. The next round uses the corrected GLB.

### Authored standard round2

Opened marine native strafe/reload/slam/death and all three quarter contacts, plus both full enemy attacks. The gun-flip bake defect is gone. Brute held anticipation now IoU.607; Crawler.683 still fails and still reads as a foreleg lift. Reload's arm is partly hidden despite a larger torso answer; move its retrieval arc across the visible camera side. Slam's downbeat is forceful but its trailing knee needs a calibrated bend plane, not just a closer ankle. The death handoff now stays low; physical wrist/gun roll remains visible. Requested final standard refinements: whole-thorax Crawler coil; delayed last breach limb; knee-plane correction/visible retrieval; shorter support reach and less bob in travel, with authored start/stop/reversal clips included for inspection.

### Authored standard round3

Opened full marine reload/slam/stop-start/reversal90/death, Crawler attack and Brute spawn; opened all three complete quarter contacts. Crawler anticipation.6167 and Brute.6067 now meet the bound. The marine's calibrated knee plane gives a real kneel; retrieval hand crosses the visible side. Travel is coherent and less springy. The remaining standard defects are an abrupt reinsertion settle, a small start/reversal phase pop, and a detached Brute distal armor rectangle during its floor plant. Final fixes:60ms reinsertion/torso settle, run-phase continuity on transition handoff (also with upper-body firing), and bind the contiguous rigid Brute club plates to the same forearm owner. Breach gets a longer ease for its last lead limb. After a fresh final standard look, propagate.

### Authored standard acceptance

Fresh standard4 native reload/reversal90/Brute spawn and all three complete exact-quarter sheets opened. The camera-side reload arc and eased return survive reduction; the reversal handoff keeps the weapon stable; the Brute distal armor now stays connected during floor plant. Crawler anticipation/strike IoU .6167/.3950; Brute .6178/.5362. The last breach ease is accepted. These fixes complete the three authored critique→fix rounds, with a fourth acceptance capture, before remaining-family/full-marine export. Reload remains restrained compared with the combat actions and will be scored accordingly.

### Family propagation review

Opened Spitter/Stalker/Carrier complete quarter sheets and native attacks/heavy hits. Spitter anticipation.5096 and Stalker.5372 read as different braces; limbs stay connected. Carrier.6827 failed and its sac/parallel limbs stayed too close to idle. Carrier-only fix reared the connected sac/thorax, fanned supports and split high/low claw loading; the added coil eases off through the first35% of strike. Fresh native/quarter recapture now measures.5892 anticipation/.2844 strike and is accepted. Remaining weakness: Stalker burn physics finishes splayed rather than a tight charred curl; Carrier idle and some long Spitter foot arcs remain less expressive than their attacks.

Full marine propagation review opened all six exact-quarter contacts and native Nova/Overclock. All16 cast peaks pass (.1511–.5455), maximum within-rig pair.6226. Native hit.4075 passes. Nova nevertheless reads as a one-arm raise, too similar in meaning to Overclock; requested one final bilateral arms-out burst rather than accepting the number alone. The dash study was corrected to replay the same Breacher Ram body action dispatched by native dash-start (its old direct velocity fixture showed idle). Primary travel and attacks remain readable with motion preferences; optional authored hit/status exaggeration now blends against a prepared idle reference for reduced motion and clears at zero strength.

Final Nova native/quarter recapture opened: both hands now extend horizontally across the camera silhouette, with an outward receiver and planted brace; it reads as a bilateral burst, clearly separate from Overclock’s one-hand command. Dash now shows the real Ram shoulder/leg launch body. Accepted; primary motion sources frozen for final build/play/capture/bench.
