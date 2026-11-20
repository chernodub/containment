# R16-C — art-director second opinion (Claude Opus, 2026-11-21, gallery final11)

Evidence: 44 images from `final11/`: 6 screens, 3 contact sheets, 30 review480 frames, 3 native frames (`native-heavy/breacher-pressure-3`, `native-heavy/cryo-pressure-1`, `crowds/…swarm-junction-01`) and 2 motion sheets (`marine-contact-1`, `brute-contact-1`). I did not run the game.

## 1. Scores

- **First impression: 6.5.** The title has confident type and a well-lit hero. The creatures are muddy brown masses, and the black tendril strokes read as render errors (`title.png`).
- **Interface: 7.5.** The system is coherent and commercial: rig diagrams, before/after boon cards, route previews and a death card with a cause. Against it, the shop icons are toy props and the HUD skill chips truncate ("Precision Fini…", `native-heavy/breacher-pressure-3`).
- **Combat readability: 6.** Hostile red reads well, and the marine's white suit cuts through. The red wedge is still drawn solid over the marine (`crowds/swarm-junction-01`). In Dark condition I could not find the marine at 480 (`conditions--cond15-dark-heavy-…`).
- **Environments: 6.** All twenty rooms have their own grade, and the lit landmarks are good (diagnostic LED sign, interlock station, annulus ring). Most of each frame is still flat tile grid, and props are box-modelled (`rooms--incident-facing-infested-workshop`).
- **Ability effects: 6.5.** Cryo Nova, Railbreaker, Seismic Slam and Whiteout land. Flashfire is a linear orange gradient cone, Napalm is a flat disc decal with no height, and Overload is a smear (`abilities--…-flashfire-03`, `…napalm-charge-03`, `…overload-03`).
- **Characters and creatures: 5.** The marine's black-and-white toon outline reads. The Brute, the species' anchor, is a pudgy tan plush toy with a grey fin; it is soft, not threatening (`motion/brute-contact-1`). I can't pick the elite out of the pair (`elite-pairs--…-brute`). The Matron is a pink capsule with claws.
- **Cohesion: 6.** The UI and the ink-line in-game style agree. The title is soft PBR key art with a different marine and different creatures.

## 2. Tier

This is a good early-access indie with a commercial-grade interface, but the actors are prototype-grade. I would pay $12–15 today, and $20–25 with the creatures and the marine resolved.

## 3. Seven changes, ranked

1. **Creature value and material** (`motion/brute-contact-1`, `native-heavy/breacher-pressure-3`). The tan Brute bodies sit in the same value band as the ochre floors and outweigh the marine. Repaint the bodies as dark chitin at 20–30% value and keep tan only on the underbelly and the joints. Add 2–3 hard dorsal plates so the silhouette is angular, not rounded, and put a saturated emissive on the head and weak point.
2. **One marine** (`title.png` vs `rig-breacher-quick.png`, `motion/marine-contact-1`). The title shows a smooth white and yellow "07" trooper with a cyan visor. In play it is a white suit with fragmented black patches and a gold headband. Choose one. I recommend the title's large shapes: white plates at about 70%, dark undersuit at 30%, one yellow shoulder dome and a cyan visor. Re-render the title from the game model.
3. **Elites and bosses** (`elite-pairs--…-brute`, `bosses--…-warden-charge-windup`, `…-matron-brood`). Give elites 1.25× scale, bone-pale crest plates and emissive seams. The Warden needs its own silhouette, not a scaled Brute: a forward-slung armoured head and a low stance. The Matron needs a readable anatomy (head, abdomen, legs) instead of the capsule.
4. **Hero under effects** (`crowds/swarm-junction-01`, `overlap--…-arc-05`, `conditions--…-dark-heavy`). Give telegraphs a 15–20% fill with a bright edge, and cut out the marine's footprint. Give the marine a guaranteed rim light and a ground ring at minimum luminance in every condition. Cap player effects over enemies at about 60% opacity.
5. **Floors** (`twenty-incident.png`, `rooms--incident-facing-infested-workshop`). Add grime gradients toward the walls, cable runs and drag marks leading to the landmark, contact AO under props, and lit trim on wall tops so room shapes read from above.
6. **Thin abilities** (`abilities--…-napalm-charge-03`, `…-flashfire-03`). Napalm needs vertical flame billboards, embers and emissive light spilling onto the creatures. Flashfire needs flame tongues and a hot white core instead of a gradient. Stack damage numbers: one "420 ×5", not five copies.
7. **Animation** (`motion/marine-contact-1`, `motion/brute-contact-1`). The marine keeps the same hunch for idle, run and fire, with a short stride and no lean. Add 10–15° lean into the run, a longer stride and visible recoil. The Brute's kill collapses into a flat smear, so give it a readable fall pose.

## 4. Keep

1. The UI language: Barlow, the ability diagrams, and the boon cards with illustrated vignettes (`rig-breacher-quick.png`, `augment-draft.png`).
2. Per-room grades with lit, legible landmarks and diegetic LED signage (`twenty-incident.png`, `native-heavy/cryo-pressure-1`).
3. Element-coded ability language and red-only hostile telegraphs (`abilities--…-cryo-nova-03`, `…-railbreaker-03`, `…-seismic-slam-03`).

## 5. Value hierarchy and identity

The hierarchy is complete in calm and incident frames: a dark ship, the marine in its own pool of light, and a lit landmark third. It still breaks under pressure. Large tan Brutes and bright machinery outweigh a marine about 5% of frame height, and in Dark condition the marine disappears. The marine does not keep one identity from title to play. The title shows a yellow-domed, cyan-visored trooper; the game shows a black-and-white patchwork with a gold band. The decision holding the picture back most is **the creatures' material and shape language**. A soft, mid-value, clay-tan species can't sit one value step under the marine, and it can't look dangerous. Make them dark, hard and accent-lit.

## 6. Against R15-C

- **Done:** #1, the Brute carpet: the blades are now dark grey, and crowds mix families (`crowds/swarm-junction-01`).
- **Partly done:** #3, small families: Crawlers and Spitters have emissive accents, but elites still aren't distinct. #4, landmarks: they are lit and in frame in the incident shots, but get lost in fights. #6, area abilities: Napalm is now filled but flat, and Meltdown and Overload are still thin. #7, creature material: the title creatures are textured now, but the Brute is still flat tan.
- **Not done:** #2, solid wedges still sit on the hero. #5, floors are still empty tile.
- **Its scores:** I agree within half a point. This build earns +0.5 on readability, environments and abilities. Characters stay at 5.
