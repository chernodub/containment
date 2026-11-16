# KA12 render / look / fix log

Five title rounds, three ending rounds and final delivery checks are recorded below. Retained images: `artifacts/nextgen/ka12-final/`. Weapon reviews: `../KA12-WEAPONS.md`.

Baseline npm ci and build passed on 2026-11-16. K12 close-up source was absent and rebuilt read-only from the existing generator with `--hero` (no game export).

Title candidate 11: calls K12 stage_hero; replaces three placeholder threats with four shipping Lantern Brood castes; adds conduit runs, grating and debris. The following five rounds critique that composition.

Weapon round 1 rifle beauty opened by lead: recognizable engineered silhouette; muzzle reads too soft and pale, optic is featureless, front plates too bright. Requested dark muzzle face/internal baffles, framed optic lens, rear notch, darker panels. Weapon worker retains additional reviews.

Campaign attempts: ka12-arc failed localhost EPERM; authorized ka12-arc-native failed startup waitForFunction timeout (20 seconds), zero rooms. Neither is a campaign pass.

Title round 1 (candidate 11) actually opened at native 1920×1080 and 480×270. Hero and breach read, but Brute is much too dominant and faces away; roof conduits compete with calm logo area. Visor is too dim relative to shoulder. Corrections: Brute height 2.5→1.8m and further back, turn all castes 155°, move service runs right, lower creature frontal fill, lift visor emission, add physical deck designation. CPU volume rendering was slow; restarted using authorized Metal GPU and completed.

Lead also opened all five round-3 weapon beauties. Distinct lengths and mechanical silhouettes read. Plasma fork/core is strongest. Pistol slab top remains angular, and shotgun upper bake has a faint rough seam. Rifle/rocket optics remain simple; no false claim of fully polished close-up finish.

Title round 2 (12) opened native and 480. Brute no longer overwhelms hero; quieter ceiling helps. Deck text is backwards (seen from rear of text plane), breach still too plain, depth blur merges smaller limbs. Round 3 flips physical text toward camera, changes it to compact DECK 07, adds peeled triangular metal and hot falling fragments, increases violet rear emission/backlight, stops lens from f/2.3 to f/3.5.

Title round 3 (13) opened native and 480. Correct text direction and brighter breach work; large repeated triangular tears look artificial, spark grid is too regular. Round 4 varies/shortens tears, scatters fewer sparks deterministically, reduces signage and adds amber practical; curls posed gloves to 65°. Glove/body sources remain untouched.

Title round 4 (14) opened native and 480. Smaller irregular tears and tighter glove curl improve the frame; fingers still lack convincing full grip contact. Emergency lens nearly touches helmet silhouette. Distant green/violet castes overlap at left edge. Round 5 moves practical away, separates/reduces far castes, thickens the near claw. Hero placement and logo-safe dark area retained. Low camera inherently hides most grating/wet floor; no claim that those details dominate the image.

Title round 5 (15) opened native and 480. Acid lantern now separates from frame edge; ember Crawler and large Brute remain visible below the logo field. Emergency light no longer tangents helmet. Chosen for final 128-sample plates. Honest residuals: set is a restrained nave rather than richly dressed industrial maze; low camera crops most floor detail; foreground claw reads more as black talons than a whole hand; amber/violet lanterns are weaker than acid/ember; hero support fingers improve but do not fully hug the handguard. Do not claim these weaknesses solved.

Ending round 1 (17) opened native 1920 and 480. Existing archive overlay will supply K12 portrait on left, receipt on right. The bare set is too flat: rear violet wall fills the opening and little floor depth survives. Round 2 widens lens 48→36mm, raises viewpoint slightly, pushes rear wall 5m deeper, reduces breach light and removes falling sparks/loose tear shards for a quiet aftermath.

Delivery-layer check: opened encoded title 1920 and found old U10 visibility-only plate isolation reveals creatures through foreground hull. Re-rendering middle/hero/foreground plates with other solid geometry as holdouts; background/fog remain full-frame layers. This is an offline plate correction, no UI logic change.

Ending round 2 (18) opened native and 480. Wider view now has wet reflections, floor grating, scattered debris and depth. Right console is too pale under the warning receipt. Round 3 pushes it toward frame edge and adds a disconnected floor cable; renders at full 2560/128 samples. K12 archive portrait stays an existing separate chosen-rig layer.

Ending round 3 (19) opened at 1920 and 480 from full 2560 final. Console moved clear of right receipt area; floor reflections/grating and debris read. Selected. Remains a quiet interior archive backdrop rather than a destruction spectacle. K12 portrait and exact loss/warning text are retained by the native ending screen.

Additional final check: physically masked encoded title 1920 opened; distant Stalker no longer leaks through near hull. Final visor emission was raised 3.5→8 in the offline plate only because cyan remained too subdued beside the orange shoulder. The corrected encoded title was opened again; the pale cyan visor now leads the orange shoulder. No marine runtime material was changed.

Native UI review: title/settings/ending opened at both desktop sizes and480. Old menu grade suppresses the lower Brood silhouettes beyond the source render. One CSS gradient adjustment reduces left darkening and bottom alpha (70%→40%) while retaining the dark logo field. Pre-grade captures remain retained. No layout, hooks or image lifecycle change.

Final native grade recapture passed all three UI scenarios at both sizes. Native and 480 images were opened: lower limbs are more readable, menu remains crisp, ending archive/text clear. Delayed-art check reaches rig selection with all six title requests still pending. See KA12-UI-CAPTURE.md for exact receipt and limitations.
