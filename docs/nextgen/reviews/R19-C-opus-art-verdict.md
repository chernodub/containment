# R19-C — art-director second opinion (Claude Opus, 2026-11-21, gallery final14)

Evidence: 44 images from `final14/`: 6 screens, 3 contact sheets, 31 review480 frames, 2 native frames (`native-heavy/arc-pressure-3`, `crowds/…relay-racks-01`) and 2 motion sheets (`marine-contact-1`, `brute-contact-1`). I did not run the game.

## 1. Scores

- **First impression: 6.5.** The type and layout are premium. The key art still mixes soft PBR creatures with stray white wire strokes in the top third (`title.png`).
- **Interface: 7.5.** A coherent commercial system. Rig, boon, shop, route and death screens share a frame, type and keycaps, and the death card names a cause and a fix (`onb14-death-stalker.png`). The rig-screen marine is a flat grey render in an awkward, falling pose (`rig-breacher-equip.png`).
- **Combat readability: 6.** The red language is excellent: cones, lanes and the Warden capsule (`windups--…-stalker-02`, `bosses--…-charge-windup`). But in melee the marine vanishes among pale creature bodies (`native-heavy/arc-pressure-3`), and full-screen teal range rings fight the telegraphs (`native-heavy--breacher-pressure-2`, `…pyro-pressure-2`).
- **Environments: 5.5.** All twenty rooms have their own colour temperature, and some landmarks have a story (the fungal growth, the coolant leak, the reactor). But the arena centres are empty plates with oversized stencils ("ISSUE 6", "CARGO 07", "TRIAGE 11") (`twenty-arena-calm.png`).
- **Ability effects: 6.5.** Railbreaker, Flashfire and Seismic Slam are strong and legible. Meltdown is now a flat orange decal, Whiteout a pale disc, and Overload a faint lilac smear (`abilities--…-meltdown-03`, `…-whiteout-03`, `…-overload-03`).
- **Characters and creatures: 5.5.** The marine reads well. The creatures carry noisy, mottled mid-value textures inside a wobbly ink line. At 480 the families separate by hue, not by silhouette (`crowds/…relay-racks-01`), and the Matron is still a translucent purple cone (`bosses--…-matron-…-brood`).
- **Cohesion: 6.** UI, route cards and gameplay are converging. The title creatures and the rig portrait still use other rendering languages.

## 2. Tier

A polished early-access indie: AA-grade menus around gameplay art at upper-prototype level. I would pay $12–15.

## 3. Seven changes, ranked

1. **Creature surface and silhouette** (`crowds/…relay-racks-01`, `native-heavy/arc-pressure-3`). Replace the mottled texture with three flat values per material (dark plate, mid flesh, one lit edge) and a constant ink weight. Push the families apart by shape: the crawler low and wide, the stalker tall with a scythe arm, the spitter upright with a glowing sac, the Brute twice the marine's mass with a pale crest.
2. **Marine owns pure white** (`native-heavy/arc-pressure-3`). Cap creature highlights at about 70% value. Give the marine a permanent cool back-rim and an emissive cyan visor, so they stay the brightest shape inside any crowd.
3. **Arena floor breakup** (`twenty-arena-calm.png`). Halve the stencils and cut them to about 25% opacity. Fill the 3 m around the centre with low clutter: grates, cable bundles, coolant puddles, scorch, debris piles and contact AO at wall bases.
4. **Third light tier** (`rooms--incident-facing-armory`, `…-containment-annulus`, `conditions--…-dark-heavy-…`). Give each landmark a coloured practical at 60–70% of the marine pool's brightness, and frame it inside the playable view, not cropped at the top edge. In Dark Heavy the fight sits in the top-left corner beside a black void. Re-centre the camera clamp.
5. **Ground the weak abilities** (`abilities--…-meltdown-03`, `…-whiteout-03`, `…-overload-03`). Meltdown: a heat-shimmer edge, flame tongues, embers and a lingering scorch decal that casts orange light on nearby props. Whiteout: low volumetric frost with crystals on the floor. Overload: give it Railbreaker's white core with violet falloff.
6. **Quiet utility rings** (`native-heavy--breacher-pressure-2`, `…pyro-pressure-2`). Draw range and charge rings as thin dashed lines at about 30% alpha, clipped to the floor, so only hostile red owns bold strokes.
7. **One marine render everywhere** (`rig-breacher-equip.png`, `onb14-death-stalker.png`, `title.png`). Re-render the rig and debrief portraits with the in-game ink and lighting in a heroic three-quarter stance with a rig-colour accent. Re-render the title creatures in the same language and delete the wire strokes.

## 4. Keep

1. The hostile telegraph grammar: translucent red wedges, lanes and capsules with crisp rims (`bosses--…-charge-windup`).
2. The UI system: Barlow, diagrammed boons, modelled shop icons, and route cards that now show a clean creature silhouette against a dark ground (`run15-condition-route.png`).
3. Per-room colour identity with story landmarks (the fungal growth, the coolant leak, the reactor core), plus the Railbreaker, Flashfire and Slam effects.

## 5. Value hierarchy and identity

The hierarchy is mostly there. The ship is dark, and the marine stands in a personal pool of light. Creatures hold second place in sparse fights, but in dense ones their pale, noisy bodies match the marine's value and the hero dissolves. The landmark tier is still the weakest: landmarks are often unlit, grey, or pushed against the top of the frame. The marine keeps one identity from title to play (white plates, the ochre "07" dome, a cyan visor). Only the rig portrait and the blotchy motion-strip shading drift off-model. The art-direction decision holding the picture back most is the **lack of a disciplined value budget per material**. Surfaces are either flat greybox (floors, landmarks) or noisy mid-value mottling (creatures), so nothing models form cleanly and the hierarchy relies on one spotlight.

## 6. Against R18-C

- **Done:** none fully. Meltdown is now a filled disc, which answers half of #5.
- **Partly done:** #1: the route cards are fixed, but the title still has soft creatures and wire strokes. #3: the coolant and reactor landmarks are lit, the armory and annulus are not. #5: Overload is still faint. #7: Pyro is orange and hostile red survives in the overlap frames.
- **Not done:** #2, the floor stencils are still large. #4, marine scale and rim: the marine is still lost in crowds. #6, the Brute is still muddy in motion and the Matron is still a translucent cone.
- **Its scores:** broadly agree. On this build I would take characters 0.5 lower (6 → 5.5) and readability 0.5 lower because of the ring clutter, and leave the rest as they were.
