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
