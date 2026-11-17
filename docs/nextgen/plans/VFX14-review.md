# VFX14 review

Final delivery uses runtime source `9fc29a5b`; see the delivery closure and VFX14-REPORT.md for completed verification. Earlier pending notes below record the state at the time of each review round.

## Seismic Slam
Round 1: opened Crew Checkpoint impact frame 03 at native resolution. Marine and enemies remain clear, but the glowing radial fissures read as electrical spokes across pale decking. Reduce their emission and cool faster into dark seams; retain the exact-radius shock front. Full native/480 timeline review remains pending.

## Napalm Charge
First pass: opened Crew Checkpoint aftermath frame 05 at native resolution. Enemy silhouettes remain clear, but fuel appears faint on pale decking and does not yet read as a flowing, boiling pool. Needs a dedicated persistent pool recipe rather than a held fan envelope; this is below flagship quality.

## Contrast review continuation
Opened exact 4×4 box-reduced 480×270 phase contacts from `vfx14-rig-first-pass` for Napalm, Afterburn, Meltdown, Overload, Tesla Pylon, Static Step, Overclock, Glacier, Frost Trail and Whiteout. These are first-round observations, not two-round acceptance.

Slam: opened dark native frame 04 from `vfx14-slam-r2`, pale 480 impact, then dark native 04 from `vfx14-breacher-review`. The broad translucent wake was compounded by a legacy shock sprite. Removing that sprite and narrowing the procedural wake leaves a crisp ring and readable floor; the radial seams still look overly electrical.

Ram: opened pale native frame 03 in `vfx14-breacher-review`. The opaque prow overlaps the marine and struck enemy, with long bright skids doing most of the reading. Reduce prow alpha and add a small open procedural pressure/dust cone that follows the native marine position.

Bulwark: opened pale native frame 04 in `vfx14-breacher-review`. This lane is nearly edge-on, so the hex face is hard to assess; supports and thin field read without covering enemies. Add sequential thin unfolding ribs, preserving the transparent field and existing contact ripples.

Afterburn: opened dark native 05 and 480 timeline. The fuel is barely visible apart from legacy enemy status flames and an orange glow. Give its bounded deposits the same soot-backed fuel recipe as Napalm; exhaust needs a stable hot tongue rather than noise occasionally eroding the entire surface.

Meltdown: opened pale native 06 and 480 timeline. Suit remains clear, but attached flame is too weak; status flames dominate and the activation band is broad. Add a stable saturated tongue/core to small sustained Fire fans; shared activation still needs later correction.

Overload: 480 contact confirms hairline paths with white-only reading; branching exists but is lost at this scale. Widen core and halo, extend discharge to .55s, brighten/lengthen the contact node, add a short low floor glow. Keep native source/destination and delayed hop receipts.

Tesla Pylon: 480 first pass has a clear coil silhouette and link but little violet body; target contact blooms into a white ball. Shared widened discharge will help the outgoing strike; native close view still pending.

Static Step: 480 first pass shows the native silhouette echo and a sparse hairline residual. Shared violet halo should carry the blink path; marine remains unique once the echo retires. Native close view still pending.

Overclock: 480 first pass has readable marine but generic pale concentric rings and a faint sustained field. Needs reduced activation band and stronger restrained suit/tracer signature. Native close view still pending.

Glacier: dark 480 timeline reads as a thin ice wall, then a disproportionately large noisy shatter carpet. Keep wall silhouette, reduce shatter floor wash; native close view still pending.

Frost Trail: pale 480 timeline almost disappears apart from upright shards. Needs a restrained dark blue rime counter-layer under bright crystal edges. Native close view still pending.

Whiteout: dark 480 timeline is a huge noisy floor field, competing with the enemy silhouettes despite low alpha. Reduce overlapping floor signature and keep the sparse dome gusts/pulses; native close view still pending.

Slam R2: opened both 480 phase contacts and dark native 04. Removing the duplicate sprite leaves a crisp advancing edge and persistent dark seams; still more electrical than fractured deck. Marine/enemy silhouettes remain distinct.

Ram R2: opened native impact on both floors across the review/correction captures and both 480 contacts. Reduced solid prow opacity preserves the struck enemy and marine. Pressure remains restrained and the long skids dominate; below flagship quality.

Bulwark R2: both 480 contacts and dark native 04 show readable supports, contact sparks and collapse shards, but the lane is edge-on. Final-check uses a different legal native lane to inspect the hex face; no camera changes.

Napalm R2: pale native 05 and both 480 contacts show a footprint that survives the pale floor. The first revision was peach and too flat; reduced body emission, removed the second full-disc sheet and added small interior flame jets for final-check.

Afterburn R2: both 480 contacts and dark native 05 exposed a row of glowing circular stamps. Replaced them with one native-length/width FuelStrip mode. Final-check must confirm the connected line rather than accepting the rejected circles.

Meltdown R2: pale native 06 and both 480 contacts keep the marine clear, but the suit jets are too low and weak. Raised their far height and strengthened the stable saturated core; final-check covers the result. Native kill-burst surfaces remain pooled.

Overload R2: pale/dark 480 contacts and dark native 04 show enough body, but stepped noise reads as a fence and the floor beam is a solid ribbon. Continuous jitter and a restrained per-frame floor trace replace those rejected shapes; final-check covers the correction.

Tesla Pylon R2: opened both 480 contacts and pale native 06. Coil silhouette, slam and wavering marine link are distinct. Outgoing strikes inherit the rejected stepped-noise artifact; the shared continuous-jitter correction applies to these native target links too.

Static Step R2: opened both 480 contacts and dark native 03. Silhouette echo and forked arrival contacts remain readable. Shared discharge floor rectangles are too strong; their correction is in the Overload family. No extra ghost was added that could be mistaken for the marine.

Overclock R2: opened both 480 contacts and pale native 06. Sustained suit/tracer accents preserve the marine, but the activation remains a generic broad band with flat pillar. Shared narrowed shock and cylindrical filament pillar address that next; sustained field is still modest.

Glacier R2: both 480 contacts and dark native 04 preserve the wall and surrounding enemies; shatter wash is reduced. Wall remains edge-on in the original legal lane. Final-check wall studies use the production camera with a legal face-on lane.

Frost Trail R2: both 480 contacts and pale native 05 still lose the sparse deposits against pale decking. Replaced those deposits with one exact-width FrostStrip and dark blue backing; crystals and low mist remain. Final-check must confirm this correction.

Whiteout R2: both 480 contacts and dark native 06 show substantially quieter floor veins with enemies still distinct through the sparse dome. Freeze pulse radius remains native. Weather is readable, but still below flagship art quality because of its procedural pattern.

## Third correction pass
Opened native final-check frames: Overload dark 04 now has continuous violet-white branches instead of stepped fences; Afterburn dark 05 is connected rather than circular stamps; Napalm pale 05 has a dark fuel bed and small vertical tongues, but remains flat and below Flashfire. Bulwark pale 04 in the face-on legal lane shows the hex face, unfolding ribs and contact spark without covering enemies.

Frost Trail pale 05 exposed a functional presentation bug: the native zone can be born with zero length and grows during the dash; the retained surface froze that birth extent. It now refreshes position, angle and extent from each native snapshot, guarded by slot ownership. Focused recapture follows.

Whiteout is being consolidated into the shared pooled program: one open native-radius Blizzard dome replaces the dedicated weather/ground material pair. Native freeze pulses and the restrained floor field remain; central weather opacity stays open around the marine. Focused pale/dark and heavy recapture follows.

Opened native heavy High frame 04 for all rigs in final-check: hostile Arc danger circle remains legible under the link; enemies remain distinct; the marine keeps a complete outline in all four. Pyro is the busiest presentation and its long fuel/flame lane still needs the Low/480 and campaign observations. These screenshots do not establish performance.

Frost Trail focused correction: read-only V2 receipts confirm mode 12, native length 4.6875m and half-width .6875m at +740ms, matching the native 150×44-unit strip; combat program creation remains zero. The refreshed extent alone was not enough contrast. Added an ink-backed rime layer at .065m; opened both native +600ms frames and both exact480 timelines. The pale floor now retains a dark strip and the dark room retains bright crawling seams, while the hostile melee arc visibly takes priority. It remains restrained compared with the flagship moves.

Whiteout shared-dome correction: opened pale and dark native sustained frame 06. Removing the dedicated ground/weather surfaces leaves a clear marine and readable enemies beneath sparse curved gusts. This is now a uniform-switched pooled mode, with no dedicated Whiteout shader family. Native freeze pulse receipts remain the source of shock radii.

## Frozen delivery-source inspection (656a6612)

Opened exact480 timelines for all four Low Armory studies, native Low Breacher/Pyro/Arc frame04 and Cryo frame06, plus Cryo High frame06. Low preserves strips, wall silhouettes and ground deposits. The hostile orange-red charge lane remains completely legible through Cryo's broad frost field; Arc's hostile contact circle remains visible beneath the link. Marine outlines remain complete. Pyro has the greatest visual density, particularly the long fuel lane, but the marine's legs and weapon remain readable.

Opened the final Whiteout pale exact480 timeline and both native sustained frames: the pooled weather has an open centre and sparse curved snow. The floor pattern is still recognisably procedural and below the flagship standard. Frost Trail remains a restrained dark-backed strip rather than a dramatic ice growth sequence; this protects native danger priority but is a remaining art weakness.

Opened all three final flagship exact480 timelines. Flashfire's raised layers and larger hot muzzle core improve depth, although the roll still reads as stacked sheets at this camera. Railbreaker's killed-target contact flares now survive actor retirement, but individual contacts remain brief beside the dominant lance. Cryo Nova has a stronger initial ring/crystal beat and less billboard mist; the secondary perimeter gust still reads as smoke in some samples. Overdrive's narrowed rings and cylindrical broken filaments improve the activation without a flat light card, but do not make Overclock's sustained presentation as distinctive as the flagship casts.

Napalm final-source recheck: opened Crew Checkpoint native05 beside the final Overload native04. Arc now has a clear continuous core, forked contacts and readable bodies; Napalm still looks salmon because luminous coverage is too broad and the pale deck leaks through the bed. This is not accepted as the requested contrast improvement. Increase soot alpha, reduce channel coverage, keep orange emission concentrated and enlarge the few vertical flame cores; capture again before delivery.

Napalm R4: opened both native05 frames. Soot now survives the pale deck and forms an unmistakable dark bed in Relay Racks; the exact edge is crisp and marine/enemies stay clear. The enlarged jets exposed a leaf/triangle silhouette. Taper the steady jet towards its tip, break its body with the existing advected noise and give it a denser counter-layer; this shared steady-fire correction also applies to Afterburn exhaust and Meltdown's small suit jets.

Final Pyro correction (239b0d48): opened Napalm pale native05, dark exact480 timeline, Afterburn dark native05 and pale exact480 timeline, and Meltdown pale native06/dark exact480 timeline. The soot bed now has independent contrast on both floors and the connected trail retains its footprint. Tapering improves the former broad leaf shapes, but the small jets are still graphic rather than convincing rolling fire; Meltdown's sustained suit flames also remain modest. This is the accepted delivery limitation, not a claim of flagship parity.

Flagship floor supplement: opened pale Flashfire native04 beside the original807 frame, pale Railbreaker native03 and Cryo Nova native03, plus dark Flashfire and pale Cryo Nova exact480 timelines. The pale-floor Flashfire difference is incremental: another raised layer and hotter near-muzzle region, still translucent sheets. Rail contacts do not hide target silhouettes but remain dominated by the lance. Cryo's first ring/crystal beat reads earlier, with later perimeter gusts still smoke-like. The gallery retains both floors for all sixteen abilities, not only the darker Awakening study.

Native footprint audit: `AbilitySystem` measures strip hits with point-to-segment distance <= width/2, including semicircular end caps. The first connected strips under-represented those caps. Extend only the FuelStrip/FrostStrip geometry by the native half-width at each end and clip by the same capsule distance in the shared fragment program, including the zero-length birth circle. This corrects presentation to the native hit area; simulation is unchanged. Focused pale/dark and Pyro/Cryo combat recaptures follow.

Zero-length Afterburn ownership follow-up: use an explicit negative sentinel for non-strip surfaces. A native strip born at zero length must remain FuelStrip (a native-radius birth circle), rather than leasing a circular Fuel slot and abandoning it when the endpoint first moves. This keeps one retained lease throughout native strip growth and retirement.

Final capsule inspection (9fc29a5b): opened native05 on both floors for Afterburn and Frost Trail, then their pale exact480 timelines. Rounded ends now follow the native segment-distance footprint; the damage-warning arcs keep priority over both strips. The late samples retire the strips without the former abandoned circular Fuel lease. These fixes improve correctness rather than making Frost Trail's restrained crystallisation or the small fire jets flagship-quality volume.

## Delivery closure
Opened final-source native heavy frames for all four rigs, including Pyro High and Cryo Low after the capsule correction, and the final Low Pyro/Cryo exact480 timelines. The charge lane remains crisp over Cryo's frost; the long Pyro lane remains the busiest effect, with the marine's complete outline retained. Opened the exported Napalm and Overload before/after sheets: labels and all four timeline columns are legible, and both floors are represented. Napalm's contrast is substantially improved but its bed remains flat; Overload's link body and contacts are the clearer quality gain.

Final source 9fc29a5b: 301 verified native frames, zero capture failures/errors, zero combat compilations in all 258 measured samples. Build passed. Native unassisted seed 1729 campaigns ended naturally with no errors/defects: Breacher 13, Pyro 14, Arc 12, Cryo 16 cleared rooms. Detailed counts, raw source receipts, the instrumented breakdown and remaining weaknesses are in VFX14-REPORT.md and artifacts/nextgen/vfx14-final/.
