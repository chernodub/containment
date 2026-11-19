# R13-C — art-director second opinion (Claude Opus, 2026-11-19, gallery final8)

Evidence: 37 images from `artifacts/nextgen/final8/`. These were 5 screens, 2 twenty-room sheets, 6 heavy fights, 4 incident frames, 8 abilities, 5 creature attacks and 2 bosses (all at 480×270), plus 3 native-size frames and 2 motion sheets. I did not run the game.

## 1. Scores

- **First impression: 7.** The title type, layout and backlit composition are confident. The marine still looks like a vinyl toy, and the creatures are black on black.
- **Interface: 7.5.** It is clean and consistent, and the before/after ability diagrams are excellent. The look is generic dark-teal dashboard, and the HUD is too small at 480p.
- **Combat readability: 6.** The marine sits in its own light pool, and the cones and lanes in one-on-one fights read well. In crowds (`compare-heavy…armory-02`, `…awakening-bay-03`), the telegraph outlines merge into one orange tangle.
- **Environments: 6.** All twenty rooms have their own palette and a dark perimeter. The middles are still empty tiled floor, and the incident set-pieces are flat vector ribbons.
- **Ability effects: 6.5.** Railbreaker, Napalm and Seismic Slam own the screen. Flashfire, Cryo Nova and Meltdown are small and hard to read, and Whiteout is mostly a line-art ring.
- **Characters and creatures: 5.** At play scale the hero reads as beige and flesh-toned. The creatures are dark brown lumps with an orange dot, the Warden reads as machinery, and the Matron is tiny.
- **Cohesion: 6.** There are four rendering styles: the soft-3D title, glossy augment-card renders, line-art shop icons and the outlined toon world. They don't agree.

## 2. Tier

This is a strong early-access indie: the interface is shippable but the actors aren't, so it is not yet solid commercial indie. I would pay $12–15, not a $25 premium price.

## 3. Seven changes, ranked

1. **Hero identity** (`rooms/g6-kiting-freight-hold-02.png`, `motion/marine-run-45.png`). The cream and tan plates with warm midtones read as bare skin. Use three values: off-white plates, a near-black gunmetal undersuit at the joints, and saturated title orange on the backpack, pauldrons and helmet crown (at least 15% of the top-down silhouette). Add a cyan emissive visor and a cool rim light.
2. **Retire orange as the universal signal** (`compare-heavy--combat-heavy-diagnostic-gallery-02`, `…armory-02`). Orange is currently used for telegraphs, enemy cores, Pyro, credits and the UI accent. Make telegraphs a filled, low-alpha red-orange decal with a leading edge, shown only for strikes about to land and merged per attacker. Move enemy weak points to a sickly yellow-green or each family's own accent, and cool the UI accent to amber-white.
3. **Creature value and silhouette** (`…infested-workshop-03`, `enemies--m10-melee-*-14`). The bodies are almost the same value as the floor. Add a cool fresnel rim and lift the dorsal plates to about 40% value. Give each family one unmistakable primitive: a flat wide crawler, a needle-limbed stalker, a spitter with a lit sac, a brute with a pale bone hump, and a carrier with an egg cluster.
4. **Make the incident set-pieces physical** (`twenty-calm.png`: passenger-vault, crew-checkpoint, relay-racks, communal-atrium). The pale swoosh ribbons look like stickers. Replace them with scorch and drag decals that have normal maps, wet specular fluid and shadow-casting debris. Put a practical light inside each landmark and add mid-floor grates and cable runs.
5. **Boss presence** (`bosses--ktx2-warden-relay-racks-charge-windup`, `…matron-…-brood`). The Warden reads as a radar dish and the Matron is the size of a regular enemy. Scale bosses to 2–2.5× the marine with an organic crown silhouette, and give each one its own key light and a ground-stain decal.
6. **Animation arcs** (`motion/brute-attack.png`). The attack holds one pose for 10 frames and then snaps to a crouch. Author 3–4 anticipation frames, a smear frame, follow-through and recovery. Give the marine run torso counter-rotation and weapon bob.
7. **One rendering language.** The augment-card gloss (`augment-draft.png`) and the shop line icons (`shop.png`) contradict the in-game toon look. Render the card and shop art from the actual game models with the in-game outline and grade.

## 4. Keep

1. The UI system: the typography, the rig colours, and the before/after diagrams on `rig-select.png` and `augment-draft.png`.
2. A distinct palette for each of the twenty rooms, with a dark perimeter (`twenty-kiting.png`).
3. The screen-owning hero effects (Railbreaker's full-width beam and Napalm's ember bloom) and the personal light pool around the marine.

## 5. Value hierarchy

The hierarchy is half built. The ship is now dark, and the marine sits in a light pool and is the brightest thing on screen; that is real progress. The landmarks are bright, but only because they are pale flat decals, not because they are lit. The enemies, which should rank second, are as dark as the floor and announced only by orange dots and outlines. The result is marine > decal > enemies ≈ floor. The decision holding the picture back is **signalling hostility with hue instead of value**: everything dangerous is "something orange". Give the creatures a value and rim-light tier of their own, between the lit marine and the dark ship, and the heavy fights will resolve.

## 6. Against R12-C

- **Done or mostly done:** #3, lighting the rooms. Ambient light is down, practical light pools are in and the perimeters fall to black.
- **Partly done:** #1, creatures (darker bodies with hot weak points and family accents, but the silhouettes and boss scale are still weak). #4, floors (incident pieces added, middles still empty). #5, telegraphs (filled wedges in one-on-one fights, tangles in crowds). #6, area abilities (Napalm now has volume; Whiteout is still rings).
- **Not done:** #2, the hero's identity, which is unchanged and still the biggest problem. #7, the infestation material: `incident-facing-swarm-junction` still shows lilac polka-dot blobs.
- **Its scores:** they were fair for final7. The gains I see in combat readability (+1.5) and environments (+1) match the fixes that landed, and characters stayed flat because its #2 didn't land.
