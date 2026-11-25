# TITLE28

Baseline desktop captures at 1920×1080 are in `artifacts/nextgen/title28-before/`. The same seed and six scenarios are used for the final comparisons.

## Re-render after a creature change

From the repository root, with npm dependencies, Playwright Chromium and Python 3 with Pillow installed, run:

```sh
tools/assets/u10-keyart/title28.sh
```

The full follow-up rebuild took 106 seconds on the M1 Pro. The command uses the production actor pool for the title and every card containing an enemy or brood pod. It writes composition A to the shipped UI directory and B’s replacement plates to `artifacts/nextgen/title28-studio/alternate/u10/`. Run `npm run build` afterward to package the images. Title and settings still load static artwork.

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
