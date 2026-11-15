# M10 implementation and motion review

## Plan and ownership

The simulation owns the melee clock, late facing lock, exact strike geometry and single damage resolution. Presentation consumes additive snapshots, leaving roots, collision, rings and health bars authoritative. Existing ranged specials remain separate. Attack state resets when rooms restart; no run checkpoint schema changes are needed.

Parallel implementation uses disjoint simulation, marine motion and enemy motion/ragdoll files. The lead owns renderer adapters, hostile ground warnings, presentation hold, bot counterplay and evidence. No world, room, UI, ability-rule, player-stat or audio synthesis changes.

Evidence uses exactly two 80-run simulation cohorts (20 identical seeds × four rigs), frozen HEAD before and final after. Seeds: 1729,2718,31415,42,137,8675309,2026,9001,65537,123456,17,23,101,256,512,1024,4096,8192,16384,32768. At most two balance tuning iterations. Native browsers run sequentially. Heavy-combat CPU is measured before/after with the ordinary benchmark.

Motion standard subjects: marine, crawler, brute. Three fresh strip critique→fix rounds precede family propagation. Mask IoU uses common native pixel registration, with 4× reductions inspected separately. Intermediate successful capture rounds are retired after review; final evidence stays in `artifacts/nextgen/m10-final/`.

Risks: the existing rig anatomy limits pose diversity; exact strike shapes must agree across simulation, bot and hostile batch; late lock and cancellation must retain slot limits; marine ragdoll lifecycle must survive room changes/restarts. Missing Blender is a known verification gap and will not be bypassed.

## Review rounds

Pending fresh standard strips.

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
