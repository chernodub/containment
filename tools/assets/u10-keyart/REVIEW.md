# U10 key art critique log

All rounds are actual 2560×1440 Blender Cycles renders from the staging script, opened as both 1920×1080 and 1280×720 PNG derivatives. This is original composition work using the original MIT K10/E9 artwork; no external visual reference was used.

## Round 1 → 2

Looked at `/private/tmp/u10-r1-1920.png` and `u10-r1-1280.png`. The amber marine is clear but lands left, directly in the intended menu space. The large visible wall and broad fill make a showroom, not a dying ship. The threat is too literal and large. Fix: normalize the K10 pose's XY source offset, reduce world fill and exposure, move the operator. This round revealed that placement needed camera-space correction, not just source normalization.

## Round 2 → 3

Looked at `/private/tmp/u10-r2-1920.png` and `u10-r2-1280.png`. Darker values improve the ceramic but the camera is still aimed into a broad side wall. Hero placement remains left because camera-right runs toward negative world X. Fix: move the hero to negative X, aim the camera down the service nave, turn the shoulders 24° toward camera, move the motivated key/rim with the operator, and place the console behind the right figure. The corridor vanishing point should now separate menu and hero, and the rear arch should occlude most of the organism.

## Round 3 → 4

Opened `u10-r3-1920.png` and `u10-r3-1280.png`. The service arch, asymmetrical cold/warm lamps and converging grates finally give the image depth. The figure is too close to the right/bottom crop; the simple organism is too exposed and reads as a model, not a shadow threat. Fix: bring the marine inward and slightly back, lower the camera's target to lift the complete figure in frame, shrink/recess the threat into the service bay. Preserve the low contrast left field for typography. White ceramic still looks clean, so keep the light restrained instead of adding fake distress to K10 assets.

## Round 4 → 5 (delivery)

Opened `u10-r4-1920.png` and `u10-r4-1280.png`. Both boots, the crown and complete weapon now have generous clearance. The arch's orange/cyan split gives depth while the small threat reads in shadow. The marine is still too side-on: the visor is a thin sliver and the pack dominates. Fix: rotate the complete posed marine/weapon together another 39° toward the camera, exposing the visor and chest without changing the native rig, mesh or skeleton. Export separate camera-visible layers while retaining off-camera geometry for light bounce, reflections and cast shadows. Keep the approved frame and use the rendered empty nave for the ending. Final compositing gets a left exposure falloff, restrained light breathing and sub-10px depth movement, with a reduced-motion still.

## Round 5 inspection

Opened `u10-r5-1920.png`, `u10-r5-1280.png` and the 480×270 reduction. The crown, front visor, shotgun bores and amber shoulder now read together; both feet and muzzle fit. The rear organism remains a secondary shadow, and the arch/console establish the same ship as gameplay. Accepted for UI assembly. Remaining weakness: the ceramic is clean and the held pose is fairly formal; this improves continuity with K10 but does not match the surface complexity or gesture of premium painted key art. Review the final CSS composition as well as this raw render.

## Layer assembly correction

Opened the assembled 1280px layer composite and each foreground/ending preview. The initial foreground's alpha was empty because both props lay outside the frame; re-rendered that plate with a near-edge pump and cable tray. The pump's white cap competed with the marine, so the reproducible delivery grade lowers foreground brightness to 35%. The raw fog's stochastic alpha cost 2.7 MB at 2560px: blur the low-frequency pass by 12 source pixels and deliver it at 640/1280px instead. Recompose the immediate image from the delivery plates so the decode handoff cannot jump from the full-scene atmosphere to a different layered exposure. The ending's empty nave and archived chosen-rig bust keep the death outcome explicit.

The first native title capture exposed the near pump covering the forward boot. Removed that pump and kept only the diagonal cable-tray foreground; this retains a real depth plane while restoring the complete figure. The final transmission portrait now fades into the archival plate rather than ending at a hard crop.

## Native UI review

The 1080p first assembly and final 720p screens were opened at native size. The selected rig's 330px / 210px image is immediately recognizable, the four equipment/color blocks survive the exact 480×270 contact, and text/controls remain within the desktop viewport. Pause and debrief portraits preserve the existing information hierarchy. The final transmission now has a fading suit archive instead of a harsh bust crop. The small debrief figure loses helmet detail at 480, but its rig color and adjacent rig name remain legible. The title's plain ceramic fields and simple shadow threat remain the weakest art elements.

The final native 1080p Cryo panel showed its three-line slogan pushing Equip 6px across the identity separator. Increased the slogan measure from 12ch to 17ch so the phrase takes two lines and leaves a clear gap above the ability manifest. The 720p layout already uses its own full-width slogan measure; it remains unchanged.

One guarded 1080p run recorded cancelled low-priority plate requests during an immediate title → fixture transition. The failed parent remains under `failed-transition-1080/`. Image requests now have retained off-DOM owners shared with the displayed responsive images, so replacing title markup cannot cancel them. This ownership change does not await decode or gate Start; the one-off keyboard journey also delays title art deliberately to observe this behavior.
