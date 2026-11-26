# TITLE28

Baseline desktop captures at 1920×1080 are in `artifacts/nextgen/title28-before/`. The same seed and six scenarios are used for the final comparisons.

## Re-render after a creature change

From the repository root, with npm dependencies, Playwright Chromium and Python 3 with Pillow installed, run:

```sh
tools/assets/u10-keyart/title28.sh
```

The TITLE33 section below describes the current rebuild. The original TITLE28 follow-up rebuild took 106 seconds on the M1 Pro. The command uses the production actor pool for the title and every card containing an enemy or brood pod. It writes composition A to the shipped UI directory and B’s replacement plates to `artifacts/nextgen/title28-studio/alternate/u10/`. Run `npm run build` afterward to package the images. Title and settings still load static artwork.

The Warden route uses the same Coolant Plant gallery as the Matron. The larger profile exposes the near shoulder plate. A blue-white plasma core and a pool of light meet on that plate. The rear leg still overlaps the torso at card size.

Five original ink illustrations replace the armor, ammo, grenade, reroll and upgrade goods. The marked medical vial and case already read at card size. The disabled shop treatment suppresses the new colours. The Stalker lesson on the death screen uses the updated creature. The selector and ending captures match baseline pixel for pixel.

The production build and all six desktop captures completed. In `artifacts/nextgen/title28-sheets/`, each screen has a `-1920.png` and a `-480.png` pair, baseline on the left.

## Backlit title studies

I would ship A. At 480×270 I read the title first, the amber maw second, then the swept crest and forward limb against the opening. A leaves daylight between the Crawler and crest. In B the larger, lower Warden pushes the maw towards the bottom edge and the Crawler meets the crest. A twelve-heading study of each current heavy favoured the Warden for its projecting crest and illuminated maw. Both compositions use the studio alpha for the rim and discard the shell colours.

The four-way sheets in `artifacts/nextgen/title28-followup-sheets/` read baseline, first TITLE28, A, B. The route and shop pairs in that directory compare first TITLE28 with the follow-up. All have native and 480×270 versions.

## TITLE29

### First pass

The first TITLE29 pass paired the production Breacher with the WARDEN34 body. Rebuild the cast and creature cards with `sh tools/assets/u10-keyart/title28.sh` as above. The title keeps its layered and static editions.

The Warden’s calm three-quarter pose leaves room between the chin and the near gauntlet. I chose it after the strike study stretched the mouth into a single oval against the forelimb. A pale edge picks out the bone prow. The amber lip encloses a dark throat, with reflected light on the lower jaw and knuckle ridges. The transparent studio cutout omits the projected floor light, which rotated into a floating sliver beside the mouth in the first study.

The marine carries the graphite shotgun and the Breacher shield on its forward off-hand forearm. The production shoulder carries the 07. The near gold shoulder is clear. The far cap is largely hidden by the helmet and gun. The pink Crawler and violet Stalker sit clear of the Warden’s back and the menu. The ultrawide crop shifts vertically to keep the confrontation in frame.

At 480×270 I read an armored creature facing right toward the marine. The lit mouth gives its direction sooner than the knuckles identify the Warden. The cyan visor catches my eye first among the actors, while the title lettering still competes on the full screen. The Breacher matches the in-play silhouette. The weakest detail is the mouth opening, which can still read as an amber ring at thumbnail size.

The production build passed. The desktop title captures cover 1920×1080, 1366×768 and 2560×1080. The route and lesson captures cover `route`, `run15-condition-route`, `play21-supply`, `play22-death` and `play26-death-card`. At menu size the guardian and death cards look consistent across the pairs. The regenerated card changes are the Stalker lesson, the breached loading bay and the brood route.

Matched PNGs are in `artifacts/nextgen/title29/`, previous on the left. The stems are `title`, `1366`, `2560` and the five scenario IDs above. Each has a `-previous-now-native.png` and `-previous-now-480.png`. The latter preserves each viewport’s aspect ratio at 480 pixels per frame.

### Breacher close-up

The final title renders the K12 close-up suit in Blender Cycles. The Breacher and selector share the same shoulder dome, 07 stencil, accumulator, graphite shotgun and shield assembly. The shield uses the play rig’s clipped outline and wrist mount. Its gunmetal inset sits inside the painted backing, with three impact cleats and four fasteners. The left elbow bends below the wrist so the shield projects ahead of the forearm and the shotgun clears its edge. The smaller far shoulder also carries rig paint.

A broad cool reflection describes the ceramic crown and pauldron. A narrower hatch rim separates the pack from the hull, and amber light from below picks up the underside of the weapon and shield. A luminous chevron follows the smoked visor. Turning the head slightly and lifting the chin clears the chevron above the near shoulder. The selector uses its own studio lights and a lower weapon carry.

At native size I judge the painted armor, glass, and metal at least as finished as TITLE28. At 480×270 the visor is the first detail I see in the cast. The title lettering still competes for the first glance across the whole menu. The equipment matches the play Breacher, and the Warden still reads as a heavy creature facing right, with its jaw and near fist visible. The far shoulder is the least legible piece of rig equipment from this angle.

The production build passed. In `artifacts/nextgen/title29/`, the six `breacher-{1920,1366,2560}-{native,480}.png` sheets show TITLE28, first TITLE29 and the final close-up from left to right. The thumbnail sheets fit each viewport into a 480×270 panel. `breacher-portrait-pair.png` shows the previous and final Breacher portrait at source size. `breacher-selector-pair.png` shows the same change in the desktop selector. The one-command title rebuild now also requires Blender on PATH and regenerates the Breacher selector portrait.

## TITLE32

The title and selector use the K12 close-up meshes. A single upper-left key selects shadow, lit and highlight swatches using the surface normal. The ceramic, shoulder, graphite and steel each have their own three inks. Silhouette and crease strokes separate the layered helmet, fingers, shield and weapon receiver. The luminous marking follows the play shader’s forward-pointing brow coordinates across the crown, with a dark backing. The Breacher keeps its 07.

The studio samples the production marine’s settled pose for each rig and weapon, then sends the joint matrices to Blender in contract space. The close-up skeleton uses the existing per-bone rest correction and the posed weapon socket. This carries over the shield-shoulder lead, wrist roll, foot placement and rig-specific torso poses. The selector uses the high-resolution version of the game’s equipment generator for the broad shield and crest, Cryo tank ends and feed hose, Pyro hip bottles and uneven exhausts, and Arc’s forked mast.

The title prints the Warden, Crawler and Stalker from the branch-point actor pool. The sail and shoulder retain their native surface planes. The mouth light is inset within the current throat mask. The Crawler carries amber-orange and the Stalker ice-blue. The matte and light follow the rendered actors when the studio regenerates the cast.

Pause, loadout and the debrief reuse the four selector PNGs. The final-transmission operator uses the same material ramps and a figure-only ink pass at the console. The route and lesson cards use the native production marine where a figure appears.

From the repo root, run `sh tools/assets/u10-keyart/title28.sh` with Blender, the npm dependencies, Playwright Chromium and Python with Pillow available, then `npm run build`. The pose exports and raw artwork are in `artifacts/nextgen/title32-studio/`.

The native comparisons in `artifacts/nextgen/title32/` place final22 on the left and TITLE32 on the right. The title files use the viewport width as their prefix (`1920`, `1366`, `2560`), and each selector uses `rig-<rig>-equip`. Files ending in `-480.png` show the current screen alone at 480×270, with letterboxing for ultrawide. `rigs-in-play.png` uses the final22 gallery script, the new selector portraits, and the original native calm and MARINE31 combat crops. Additional production captures are under `title32-ending/` and `title32-death/`. The production build passed.

At full title size the helmet lip, receiver, shoulder and shield edge have distinct thicknesses and surfaces. At thumbnail size the cyan chevron is the first detail I pick out on the figure. The larger white wordmark draws my eye first on the complete screen. Across the three widths the marks, visor and mouth clear the menu. The Warden faces the marine and reads most clearly by its bone sail and forelimb. Its recessed mouth still looks shallow at thumbnail size. The amber Crawler and ice-blue Stalker retain distinct marks and profiles.

In the rig comparison, the shoulder colours, brow, weapon and shield or pack identify the same four figures in both columns. Combat has a heavier apparent contour at native scale. The lower selector camera makes the Breacher shield read broader and shows less of the Cryo hose and Arc mast than the overhead view.

## TITLE33

The title now reads the Warden, Crawler and Stalker directly from the shipped caste meshes. The title renderer welds the atlas seams, subdivides the surfaces, reads the authored anatomy cells and lights the result with the same stepped material shader as the marine. The Warden's jaw uses its skin weights. The broken sill runs under the near hand and recedes toward the back foot. Cool light crosses the shoulder and shell, while the mouth side takes an amber bounce.

The Breacher retains the selector kit and sampled carry pose. The title master is 3584 pixels square. The four selector masters render at 1280 and reduce to 640. The Warden master renders at 2400, and the Crawler and Stalker at 1024. The cast composite fairs anatomical colour masks before final reduction and encodes the transparent plates losslessly. The deck and fog use the original stage and camera at 5120×2880. The existing transparent foreground spacer, lettering and menu are retained.

From the repository root run `sh tools/assets/u10-keyart/title33.sh` with Blender and Pillow on PATH to rebuild the title and selectors. The full `title28.sh` pipeline calls that command before rebuilding the cards and ending.

The 200% review prompted two corrections. Fairing the organ mask removed a row of triangular notches at the back of the mouth. Fitting the close-up glove inside the Breacher's knuckle bow cleared three fingertip plates that had broken through the shield below its insignia.

Proof is in `artifacts/nextgen/title33/`. Each `title-<width>-native.png` reads final22, final23, TITLE33 from left to right. `marine-200.png` and `warden-200.png` double the original 1920 capture pixels without interpolation. The three `title-<width>-480.png` files show TITLE33 alone. Each `portrait-<rig>-native.png` pairs the previous and current 640-pixel portrait.

At 200% the broad silhouette strokes and jaw bands stay continuous. At 480×270 the broken sill carries the near hand, with the amber organ visible between the jaws. The bent forelimb reads sooner than the individual claw tips. The pale rim separates the helmet and receiver from the dark hull and the rust shell from the blue aperture. I would ship this alongside the selector and game suit. Final22 still has finer material reflections, while TITLE33 gives the opposing figure a clearer head, reach and footing.

The production build and all three desktop captures passed.
