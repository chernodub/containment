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

## TITLE34

A folded pressure collar runs from the left jamb, under the Warden's loaded paw and behind the Breacher's shield. A torn, double-skinned flange gives the claw tips an edge to grip. The Crawler rests on an upper return attached to the right jamb. A folded piece of the left jamb passes in front of the Stalker.

The blue-white breach key (#b6dbe6) comes from above and to camera right. It catches the shield, skull and torn steel. The projected marine matte falls left across the deck between the figures, while the shield's ochre reflects into the near side of the animal. The distant blue steel has a single lit opening. The bone mask remains lighter than the rust armour and darker than the cyan visor.

Run `sh tools/assets/u10-keyart/title34.sh` from the repository root with Blender and a Pillow-enabled Python on PATH. The command regenerates the creatures from the local shipped meshes and reuses the existing supersampled marine and hatch masters. A clean checkout regenerates those masters first.

The comparison set lives in `artifacts/nextgen/title34/`. The desktop pairs use matching 1920×1080, 2560×1440 and 1280×720 viewports. A fourth desktop capture at 1840×860 checks the exact store aspect. The delivered `store-460x215.png` removes 112 pixels of ceiling and 71 pixels of deck from the 1920 capture before reduction, retaining the logo, Wake up, visor, paw and shield. `capsule.json` records that source rectangle.

This pass uses the pre-HEAVY44 meshes. The title creature and affected route, lesson and ending artwork are due for a further render after the lead's HEAVY44 handoff.

The production build passed. All four previous and four current title capture manifests have empty error lists. Ship-kit preparation timed out twice at 1280×720 and once at 1840×860. Repeating the same scenario and settings produced the successful captures. With the optional artwork requests held on a fresh title, Tab reached Settings, Enter opened it and Escape restored focus to Settings. Releasing the requests let the five low-priority title plates finish decoding.

At desktop size the near claws turn over the lit flange, and the cast shadow links the deck to the shield. In the 460×215 crop the bent wrist and mouth still read. The Stalker's thin back leg blends into the jamb, and the Warden's far claw is hard to distinguish from its lower jaw at that scale.

### Revised breach lighting

The torn header now casts the Crawler's perch and the surrounding chamber into near-black. A single blue-white opening sits behind the Warden's sail and skull. Its light continues over the flange as an angular pool, with the Breacher's shadow cast forward onto it. The lit edge of the shield faces the same source as the Warden's back and reaching arm. The current Warden uses two warm shell values, ink at the roots of the plates and pale bone confined to the head.

The revision comparison in `artifacts/nextgen/title34-revision/` runs from final24 to the TITLE34 first pass to the revision. At 460×215, in colour and greyscale, I can follow the revised sail, skull and open jaw toward the shield faster than in either earlier capsule. Final24 retains more detail in the little Crawler. In the revision its legs and the Warden's individual gripping digits are clearest at desktop size. The production build passed. The native title capture and both source title manifests recorded empty error lists.

### TITLE34B shipped cast

The Warden uses the game's `shapeWardenMouth` on the shipped tyrant skin, including the separate tooth rows, lining and tongue. The title opens the jaw at its hinge and brings the tongue forward over the lower lip before subdivision. The cast also imports the rebuilt dretch and basilisk. The Breacher, breach lighting, deck, flange, contact shadows and UI layout carry over from the merged title.

Run `sh tools/assets/u10-keyart/title34b.sh` with Blender, Node and a Pillow-enabled Python on PATH. Build the game after regenerating to copy the new studio plates into the distribution.

The regenerated title files under `public/assets/ui/u10/` are `midground-1280.png`, `midground-1280.webp`, `midground-2560.webp`, `title-1280.jpg`, `title-1280.webp`, `title-1920.webp` and `title-2560.webp`.

The following table inventories the studio WebPs. Prepend the row's prefix and append `.webp` to each listed name. The studio also updated `manifest.json`. The legacy Queen shares this renderer and was included in the batch.

| File prefix | Regenerated assets |
| --- | --- |
| `lesson-` | crawler, stalker, spitter, brute, carrier, warden, matron |
| `reward-` | reserve-thruster, slide-loader, tactical-salvage, drive-dynamo, afterquake, reinforced-bulwark, spreading-nova, twin-glacier, scorched-fan, napalm-triplet, forked-overload, twin-pylon, siege-plow, fault-line, shard-harvest, ice-road, ember-relay, meltdown-core, pilgrim-pylon, live-wire, kinetic, cryo, pyro, arc, acid, universal, recovery, demolition, executioner, wildfire, cycling |
| `route-` | legacy-queen, threat-crawler, threat-stalker, threat-spitter, threat-brute, threat-carrier, threat-warden, threat-matron, awakening-bay, passenger-vault, residential-gallery, communal-atrium, crew-checkpoint, armory, freight-hold, breached-loading-bay, relay-racks, transmission-chamber, diagnostic-gallery, safety-interlock-station, coolant-plant, service-shaft-landing, infested-workshop, swarm-junction, shielding-gate, containment-annulus, manual-control-chamber, overload-floor, plate-breaker, brood, warden-cache, protected-passage, workshop-siege-plow, workshop-fault-line, workshop-shard-harvest, workshop-ice-road, workshop-ember-relay, workshop-meltdown-core, workshop-pilgrim-pylon, workshop-live-wire |

The RUN20 choices use the room vignettes. The supply strip reuses `route-threat-warden.webp` at 100×44. The death recap's six attacker glyphs (Crawler, Stalker, Spitter, Brute, Carrier and Queen) are hand-authored SVG paths in `exchangeGlyphs.ts`. Its separate lesson studies were regenerated at source. The ending shows the marine, cryodeck and uplink with no creature. The ending files (`ending-1280.jpg`, `ending-1280.webp` and `ending-1920.webp`), the SVG glyphs, the four selector portraits, weapon and service studies, and prop-only route images retain their existing artwork.

Evidence lives in `artifacts/nextgen/title34b/`. Each of the 78 studio WebPs has a matching previous/current image in `card-pairs/`. The standalone comparisons use a 549×227 route slot, a 355×237 reward slot, or the 320×180 lesson study size. The full-screen comparisons preserve the live layout and compositing.

At 460×215 the bright opening still separates the sail, head and loaded forearm faster than final24. The dark mouth reads as a bite toward the shield. The tongue and individual teeth are clearer at desktop size. The Crawler's rear plates on the upper return remain hard to count at capsule size. The production build passed and the final title, both RUN20 choices, Warden supply and death recap captures recorded empty error lists.

## TITLE35 — the perched Crawler and the four carries

The Crawler on the title is approximately 56 pixels wide in the 460 × 215 capsule. Its forked head crosses the reflected edge of the upper flange. Cool light beneath the jaw separates it from the straw dorsal plates. The marine remains the brightest figure, with the shield facing the breach and the menu on the quiet left. The Warden keeps the rust shell of its in-game rank, with a muted bone mask, dark throat and plum tongue. The regular and elite Brutes in the studio cards use the live bruise-slate palette.

The studio regenerated seven lesson, 31 reward and 40 route images, including the room crops used by both order choices. The final batch includes ROOM35. The Pyro leans from the firing wrist with a longer fore-aft stance. Arc brings the open hand outside the chest and rotates the support elbow around the shoulder-to-hand line. The same body layer continues through a cast. Arc swivels about the shoulder-to-hand line and restores the palm’s world orientation. Both selector portraits were exported from those live poses. Breacher and Cryo retain their existing carries.

Run the existing `tools/assets/u10-keyart/title34b.sh` from the repository root with Blender, Node and a Pillow-enabled Python on PATH. For a cached rebuild of the two revised selector portraits, run `npm run build` followed by `node scripts/nextgen/studio.mjs '--only=^portrait-(arc|pyro)$'`. Rebuild the distribution after generating the assets. The reviewed comparisons are in `artifacts/nextgen/title35/comparisons/index.html`. Individual card and key-art links open native-pixel pairs. Each reduced full-screen view is 480 × 270 per side.

Six fresh Chromium contexts per image set alternated the old and new artwork on the same 1920 × 1080 desktop build. The median from navigation start until all optional title layers decoded was 4,891.6 ms before and 4,788.7 ms after (−2.1%). The six selected images occupied 70,963,200 bytes (67.68 MiB) of decoded RGBA pixels in both versions. The title capture reported 130 renderer textures in each build. Browser compositor and driver allocation bytes were unavailable. The title measurement's first attempt timed out waiting for the layered title. The repeated run on the production URL prefix completed all twelve loads. Samples are in `artifacts/nextgen/title35/metrics.json`.

The production build passed after merging local nextgen through ROOM35 at `78eba9ff`. The four capture manifests (`title35-captures`, `title35-final`, `title35-carry`, `title35-release`) contain 39, 40, 18 and two frames respectively, each with empty errors and failures. The final rig pairs use Crew Checkpoint on both sides. The original current-wave overlap scenario stages Communal Atrium, so the matched capture substituted the reference room in the fixture. The comparison gallery shows the corrected Pyro and Arc against final25; Breacher and Cryo use the integrated capture.

Both seed-1729 Pyro campaigns cleared six rooms with zero runtime errors. The runner returned exit 1 on each because it records room loads over five seconds as defects. The first run flagged Passenger Vault and Residential Gallery. On the delivery build Passenger Vault alone triggered the defect, with a 6.42-second total hold. The two reports live under `artifacts/nextgen/playtest/title35-first/` and `artifacts/nextgen/playtest/title35/`.

At store size I can pick out the second animal by its forked head and hooked forelimb. Its far legs still merge into the upper hull. In the reduced greyscale lineup the shield, upright Cryo equipment, wide Pyro stance and narrow Arc fork distinguish the rigs for me. Arc's elbow gap reads most clearly in calm play and is partly filled by the shared receiver during the cast. This was an informed visual review. Disk availability was 62 GiB at checkout and 59 GiB at delivery; this worktree's nextgen artifacts used 576 MiB.
