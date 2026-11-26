# MARINE28 · Marine at game scale

Baseline `783c5f48`, High, seed 1729, 1920×1080. The four calm rigs use Awakening Bay. Combat rows are Swarm Junction crowd, heavy Pyro, Pyro overlap (frame four), Crew Checkpoint Warden wall stun, Breacher ram, and critical health. The dash starts at the native room entry. The older KIT13 setup requested an illegal target at (374, 424).

**Plane study.** A narrow normal interval (.94–.985 against the upper-left key) added a hard pick to pale ceramic in the existing marine shader. The dense crowd looked effectively identical at 480×270. The final build leaves it off. The off/on comparison is in `artifacts/nextgen/marine28/plane-study-{480,1920}.png`.

**Visor and shoulders.** A cyan chevron on the darker helmet crown follows the head bone. Its point shows facing at native scale, including through the orange Pyro effect. At 480 the cue is a few pixels wide. The existing rig dome and the opposite cap and lame carry the same pigment. The near dome identifies the rig more reliably than the far shoulder, which the gun or helmet often covers. Pyro wears amber.

**Equipment.** The slotted Breacher silhouette is the forearm ram. Painted ram and dorsal equipment now use graphite with a narrow rig stripe. Cryo and Pyro show the largest reduction in equipment colour. The Breacher silhouette still spans the forearm. Its shoe, face, cleats and pistons share a skinned mesh and forearm bone with the guard. A physical reduction would scale those ram parts together around their mount in the Blender generator before joining the mesh, then re-export both LODs.

**Combat read.** The cyan head is easier to locate in the crowd. Fire still draws the eye first in the overlap frame. The Warden reveal keeps its cyan optics and suit outline. In the dash the lowered head is largely covered, while the weapon and extended pose read clearly. The critical-health HUD and weapon silhouette remain readable.

The production build passed. Pyro seed 1729 cleared five rooms with zero errors. The Warden observation recorded 90 Low draws and zero program compilations during the held Low wall stun on both builds. The changes use the existing marine draw and warmed shader family.

Matched sheets in `artifacts/nextgen/marine28/`, each at 480 and 1920 pixels per frame: `rigs`, `plane-study`, and `do-no-harm`.

## RIG29

The Breacher plate was already skinned to the left forearm. Its old roll aimed at the camera, and its long edge followed the arm. The revised clipped plate sits ahead of the wrist on a bent-elbow brace. The graphite strike face has a rig-painted backing visible around its edge. The ram reaches farther forward than the resting carry.

Cryo wears two shorter, more widely spaced dewars. A return loop joins their valves and a separate coolant feed follows the firing arm to the weapon socket. Pyro carries a high outboard exhaust over the left bottle and a lower return-side stack. Arc retains its violet fork terminals on a mast canted out from the left shoulder. The off hand follows a different carry on each rig. On rifles the three two-handed rigs vary the elbow angle while keeping the hand on the guard.

The game and fallback GLBs share the same baked 1024-pixel PNGs and index-only shadow LODs. The authored clips, firing-hand socket and simulation are unchanged.

**Visual review.** The black native crops distinguish the Breacher's clipped slab, Cryo's open valve loop, Pyro's unequal flared stacks and Arc's slender mast. The Breacher's ram is the weakest single outline because the muzzle projects past the shield. Cryo's cylinders overlap in the dash. At 480×270 the equipment outlines survive better than the hose, rim or antenna tips. The visor mark is visible in all twelve selected colour frames and across eight sampled calm headings per rig. It narrows to a stroke near edge-on. The Pyro dash effect crosses the lower helmet. I found the marine as readily in the four matched fight frames as in the baseline. Pyro's orange blast still draws the eye first.

The source baseline was rebuilt from `b1f1d1ed`. In 24 matched samples (calm, four overlap frames, dash, per rig), the largest world-space muzzle difference was 2.2e-11 and the largest socket quaternion difference was 1.5e-11. The tracer continues to query that muzzle. Native attack clocks and hit resolution use the same simulation code.

The ignored proof directory is `artifacts/nextgen/rig29/`. `rigs-in-play.png` matches the selector with native calm and fight crops. `{colour,silhouette}-{native,480}.png` pairs previous and current for all twelve scenes. The black masks project the visible skinned marine and carried weapon without surrounding effects. `headings.png` shows the calm sweep and `muzzle-comparison.json` records the pose measurements.

**Verification.** The production type-check and build passed. Breacher and Arc each cleared six rooms on seed 1729 in fast desktop play with zero errors. The separate `breacher-actions.png` sequence shows aim, run, fire, reload, hit and ram in order.

## STANCE39

The Breacher carries a clipped graphite shield over the off-hand forearm. It has a gold rim and a raised strike chevron. The left clavicle advances into the ram and retracts on Railbreaker. The front boot steps forward, the elbow drops, and the firing wrist stays on its authored trajectory.

| Rig | Carry in play | Most useful silhouette cue |
| --- | --- | --- |
| Breacher | Squared behind the shield shoulder, staggered feet, gun tucked on the far side | Broad clipped face ahead of the helmet |
| Cryo | Upright, with a narrower base and the support hand reaching across to the coolant feed | Two tank ends and the open return loop |
| Pyro | Forward over a wide base, firing elbow down, bottle slung diagonally over the hip | Unequal bottle and exhaust profiles |
| Arc | Turned toward a canted coil mast, with the open support hand raised | Narrow mast ending in two separated prongs |

The strike face led the gun by **0.114–0.207 world units** across 31 samples spanning the ram. The following counts use depth-tested projected triangles at 1920×1080. The shield column includes the broad inset plane only. Rim, thickness and raised fittings are excluded. The helmet column counts the exposed head-bound skin.

| Aim heading | Shield face px | Helmet px | Face / helmet |
| ---: | ---: | ---: | ---: |
| 0° | 2,610 | 1,131 | 2.31× |
| 45° | 3,672 | 1,118 | 3.28× |
| 90° | 4,479 | 1,105 | 4.05× |
| 135° | 4,572 | 1,044 | 4.38× |
| 180° | 3,896 | 1,069 | 3.64× |
| 225° | 2,850 | 1,130 | 2.52× |
| 270° | 2,117 | 1,240 | 1.71× |
| 315° | 2,061 | 1,198 | 1.72× |

The shotgun drives the firing shoulder and chest back over four presentation ticks at 60 Hz. The kick pivots about the firing wrist. The hull uses the existing instanced debris pool. In the ejection capture it rose from 1.85 to 1.95 world units, bounced and settled at deck height 0.035. The rig skins share the existing marine shader and the production and fallback GLBs use the same embedded PNG atlases.

For muzzle verification, the parent and revised production models received identical animation inputs over 112 ticks per rig, covering idle, running, firing, reload, dash and cast. Across 448 paired samples, the largest world-space muzzle displacement was 0.000000377 and the largest socket quaternion component-vector distance was 0.000000366. Tracers still read the final posed muzzle. The simulation owns aim and hit timing.

**Visual review.** I could identify all four native silhouettes and the four 480×270 silhouettes by the shield, open loop, uneven stacks and fork. The cyan visor surface is visible in all 16 colour poses and all eight headings. The V narrows to a stroke at rear headings and the Pyro dash warning crosses it. The marine was as easy to locate in the four matched fights. The Cryo firing frame compresses the two tanks into the loop, and Pyro's orange blast and Arc's pale field draw attention in their fight frames. The Breacher now matches the selector and title in the equipment, carrying arm and leading shoulder. Those illustrations hold the shield upright, while the room pose tips it back to expose its broad face.

**Proof.** Open `artifacts/nextgen/stance39/index.html` for all 64 individual comparisons, `rigs-in-play.png` for the selector beside the native calm and fight frames, and `headings.png` for the eight unscaled heading crops. Native colour comparisons use the archived final21 calm/fight frames. Dash, fire and geometry masks use the rebuilt final21 source at `bc56c43c`. The 480×270 frames show the revised build alone. `muzzle-comparison.json` and `ram-and-shell.json` hold the motion measurements.

**Verification.** The production type-check and build passed. On the final build, Breacher and Pyro each cleared six rooms on seed 1729 with zero errors. Their native reports are under `artifacts/nextgen/playtest/stance39-release-breacher/` and `stance39-release-pyro/`. The Standard competent Breacher simulation cleared 7 of the 12 requested seeds, matching the lead's 7/12 baseline. The full cohort receipt is `artifacts/nextgen/playtest/stance39-standard-breacher/summary.json`.

## BROOD40

The Breacher carries the plate closer to the wrist, lower and farther in front of the torso. The inset face, segmented rim and chevron still face upward. An open brass grip bow returns under the wrist-side edge and follows the forearm through the ram. Cryo's two cylinders rise to one upper yoke. Pyro's exhaust mouths sit farther apart and lean out from the hips. Arc retains its raised hand and fork. The fittings share the existing rig meshes and baked PNG atlases.

The calm, shotgun and black silhouette comparisons for all four rigs are under `artifacts/nextgen/brood40/sheets/` with the `marine-` prefix. The native crops compare the final22 build to BROOD40. The full 480×270 frames show BROOD40.

Across 448 paired production-model samples (112 per rig, covering idle, run, fire, reload, dash and cast), the maximum muzzle displacement and weapon-socket quaternion difference were both zero. The captures are `artifacts/nextgen/brood40/parent/sockets.json` and `artifacts/nextgen/brood40/socket-now/sockets.json`.

| Rig | Calm and silhouette | Shotgun and silhouette |
| --- | --- | --- |
| Breacher | The shield meets the shoulder and the wrist return closes the old gap. The visor stays visible. | The silhouette carries one wall in front of the arm. At 480×270 the grip and receiver overlap. |
| Cryo | The nearer tank and upper yoke make a tall column. The two valves separate at native size. | The joined column stays upright behind the arm. Its lower edge touches the hose in black. |
| Pyro | The exhaust mouths occupy opposite sides of the hips. The low outer mouth has the clearest profile. | The wide ends stay distinct from Cryo. From the firing heading the far bottle reads as a separate projection. |
| Arc | The fork rises clear of the shoulder in colour and black. | The mast stays visible above the gun hand. The individual teeth need the native crop. |
