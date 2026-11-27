# R30-C — art-director second opinion (Claude Opus, 2026-11-27, gallery final25)

Evidence: 44 images. The `windups` sprites were unreadable at 480 (creatures are about 10px), so windups are judged from native frames. To stay in budget I used one `overlap` and one `conditions` frame and no Brute motion sheet.

## 1. Scores

- **First impression: 7.** The restaged title is a real illustration: one breach light, a heroic marine and a crisp spined Warden (`title.png`).
- **Interface: 7.5.** Disciplined and legible, with an excellent death debrief and route cards, and the flat ink shop icons now match. But it is still the same teal box over blur on every screen, and the combat HUD is small and grey.
- **Combat readability: 6.** The red fans are hard-edged and unmistakable. But the crawlers are now cream with amber glow and as light as the marine, so a crowd reads as confetti (`crowds/…swarm-junction-01`, `fx35/flashfire-peak`).
- **Environments: 5.5.** The per-room grading and the reactor and interlock landmarks work. The arena centres are still repeating panel decks, and the accidents read as scattered greybox crates (`twenty-arena-calm`, `armory-incident`).
- **Ability effects: 6.** Railbreaker is premium. Flashfire and the Pyro flame ribbons have shape, and Cryo Nova is now a legible arc. Whiteout reads as floor tiling, Napalm is invisible at peak, and Seismic still webs cracks across the floor.
- **Characters and creatures: 6.** The marine is strong and consistent. The Brute's crowns and planted palms help, but the pale mask with a plum lip reads as a goofy ape. The Warden's stun mouth is a glowing egg that buries the marine (`bosses/…wall-stun`).
- **Cohesion: 6.5.** The inked characters, the title and the UI now share one language. The soft-graded floors and the emissive creature lights speak a second one.

## 2. Tier

A good-looking early-access indie whose menus are a tier above its in-world art. I'd pay $15. No fight frame yet stands beside Hades, Ruiner or Ravenswatch.

## 3. Seven changes, ranked

1. **Darken the Crawler** (`creatures34/crowd-relay-racks-native`). The cream body and amber spots make it the lightest thing in the crowd. Use a body at 30–35% value with the dorsal plates at 50% and no under-glow. Light only the forked prow during windup.
2. **Make glow a telegraph, not an identity** (`crowd-crew-checkpoint-now-480`, `conditions/…dark-heavy`). Purple Carriers, blue Stalkers, green Spitters and amber Crawlers glow all the time. Tell the families apart by low-saturation hue and silhouette, and keep emissive for the striking limb.
3. **Redraw the Warden's stun head** (`bosses/ktx2-warden-crew-checkpoint-wall-stun`). Make the throat a near-black, non-emissive cavity rimmed by 6–8 bone triangles with a plum tongue. Throw the head away from the marine and shrink the stun ring.
4. **Give the Brute menace** (`heavies.png`). Narrow the mask into a forward wedge with dark eye pits, keep the mouth shut until windup, and swap the army green for bruise-slate. Keep the three crowns.
5. **Author the arena centres** (`twenty-arena-calm`). Break the panel grid with 2–3 large hard decals per room (scorch, spill, drag marks, chevrons). Grime the floor toward the walls and darken it by about 10% outside the light pools. Give the debris seams and labels.
6. **Fix the three weak effects** (`fx35/whiteout`, `napalm-charge`, `seismic-slam` peaks). Whiteout: vertical frost plumes and rime on enemies, not a floor decal. Napalm: a white-core ignition flash for 2–3 frames. Seismic: one shock ring with debris, cracks inside the radius only, gone within 0.5 s.
7. **Scale the hero for the 480 read** (`fx35/railbreaker-peak`, `native-heavy/breacher-pressure-2`). The marine is about 7% of the frame's height and vanishes in crowds. Push the camera in 10–12%, or keep the cool rim on at low strength all the time.

## 4. Keep

1. The marine identity from title to play: gold "07" pauldron, cyan chevron visor, grey-white plates (`rigs-in-play.png`).
2. The death debrief diagram and the route cards.
3. The hard-edged red-only telegraph fans and the Railbreaker beam as the effect benchmark.

## 5. Value hierarchy, identity, the decision

The hierarchy is not complete. The ship is dark and the landmarks sit third where they exist (the Overload reactor and the interlock sign). In calm frames the marine is lit first, but in crowds the cream Crawlers and the family emissives tie with him, so the creatures sit beside him rather than below. The marine keeps one identity from title to selector to play, and the rig colour on the pauldron is smart, though the heroic title figure shrinks to a busy 70px one. The decision holding the picture back most is **giving every enemy family its own always-on emissive**. It turns each fight into competing lights and flattens the value ladder the team keeps rebuilding.

## 6. Against R29-C

- **Done:** none outright. The nearest is #2 (three plates and an open mouth on the Brute, though it is still army green).
- **Partly done:** #1 (darker Brutes and a rim, undone by the cream Crawlers), #3 (a bone crest, but at 480 the elite still reads as the same Brute), #4 (plates replace the stripes, but glow still tells the families apart), #5 (the dark condition's cone is hard, the incident pools still soft), #7 (Cryo and Flashfire fixed, Seismic still webs).
- **Not done:** #6 (the arena floors are unchanged).
- **Its scores:** fair for final24. I'd keep its environment and readability scores, and raise interface and creatures by 0.5 each for the shop icons and the Brute rebuild.
