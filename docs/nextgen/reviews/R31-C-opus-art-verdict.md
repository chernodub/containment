# R31-C — art-director second opinion (Claude Opus, 2026-11-28, gallery final26)

Evidence: 43 images. That is 6 screens, 3 contact sheets, `heavies` and `rigs-in-play`. From `review480` I took 3 fight frames, 3 incident frames, 7 ability impacts (current-only `now-480`), 4 windups plus a crowd windup, the Warden and the Matron, 1 crowd, 1 elite pair, 2 overlap and 1 conditions frame. At native size I took 3 frames (`native-heavy/pyro-pressure-2`, `crowds/…swarm-junction-01`, `bosses/…armory-wall-stun`), 2 `creatures35` crowds and the marine and Brute motion sheets. To stay inside the budget I used three fight frames at 480 rather than six, three incident frames rather than four, and one conditions frame rather than two.

## 1. Scores

- **First impression: 7.** The title is a real cel illustration: one breach light, a heroic marine and the spined Warden. But the two background creatures are grey cut-outs, and the centre is an empty bright hole (`title.png`).
- **Interface: 7.5.** It is disciplined Barlow typography with illustrated boon cards, a before/after diagram and an excellent death debrief. But every screen is the same teal box over blur, and the shop icons are generic.
- **Combat readability: 6.5.** The red fans are unmistakable, and darkening the crawlers and stalkers fixed the confetti problem (`ordered-crowd-native`). Melee still buries the hero: the marine is fully hidden inside the Warden (`wall-stun`) and fused with a Brute (`pyro-pressure-2`).
- **Environments: 5.5.** The per-room colour moods and the reactor, relay and console landmarks work. The arena floors are still dark panel decks covered in soft smeared light, and the "accidents" read as scattered greybox debris (`twenty-arena-calm`).
- **Ability effects: 6.** Railbreaker and Flashfire are strong. Cryo Nova, Meltdown and Seismic are flat rings on the floor. Whiteout turns enemies navy-black instead of frosted. Napalm is still not visible at +300 ms.
- **Characters and creatures: 6.5.** The slate Brute now has menace, and the elite crest, the Warden throat and the Matron's striped tail all read. But the surfaces are blotchy camouflage patches on faceted low-poly forms, which reads as papercraft (`heavies.png`).
- **Cohesion: 7.** Removing the always-on glow unified the creatures with the inked marine and the UI. The soft-graded floors are now the odd language out.

## 2. Tier

This is a polished early-access indie whose menus and marine sit a tier above its floors and effects. I would pay $15–18. No fight frame here yet stands beside Hades, Ruiner or Ravenswatch.

## 3. Seven changes, ranked

1. **Never let a body cover the hero** (`bosses/ktx2-warden-armory-wall-stun`, `native-heavy/pyro-pressure-2`). Add a presentation-only push-back of 0.4 m for heavies in contact. Draw the marine's ink outline and a warm rim above enemy bodies, and fade any creature to 50% opacity while it occludes him.
2. **Push the camera in 12% during combat** (`twenty-native`, `review480/native-heavy--arc-pressure-2`). The marine is about 6–7% of the frame's height, so all the rig detail is lost. Zoom in when enemies are within 8 m and back out for traversal.
3. **Paint creature surfaces as anatomy, not camouflage** (`heavies.png`, `motion/brute-contact-1`). Replace the random patch masks with three designed value bands: a dark dorsal, a mid flank and a light palm and claw tip. Bevel the Brute's shoulder facets and add one key-light highlight band.
4. **Give the ring effects height** (`fx36--cryo-nova-peak`, `meltdown-plus300`, `seismic-slam-peak`). Each should have a 2–3 frame white-core flash, rising particles or shards that leave the floor plane, and a 40 ms hit-stop. Whiteout should frost the bodies with a pale cyan fresnel crust, never darken them. Napalm needs a ground fire that persists at +300 ms.
5. **Author the floor light** (`twenty-arena-calm`). Use one hard-edged hero pool per arena centre in place of overlapping soft smears. Add contact AO under every prop and two clearly different floor materials (grating and plate) with trims. Give the accident debris recognisable silhouettes: a buckled gantry or a burst crate with spilt cargo.
6. **Cut the per-enemy clutter in crowds** (`twenty-kiting`, `crowds/…swarm-junction-01`). Hide health bars on full-health enemies and use rings only on the targeted enemy or the one attacking. The swarm is currently a field of white dashes.
7. **Bring the title backdrop up to the hero** (`title.png`, `run15-condition-route`). Render the two background creatures at the same finish as the foreground ones, and put ship architecture in the empty hole with a cold rim on its edge. Match the route-card Warden's palette to the in-game one.

## 4. Keep

1. The marine's identity: the gold "07" pauldron in the rig colour, the cyan chevron visor and the white plates, from title to selector to play (`rigs-in-play.png`).
2. The UI system: the boon cards with illustrated vignettes and before/after diagrams, the death debrief vector diagram and the route cards.
3. The hard red-only telegraph language and the per-room colour moods, with the Railbreaker beam as the effect benchmark.

## 5. Value hierarchy, identity, the decision

The hierarchy is nearly complete. The ship is dark. Creatures now sit below the marine in value, and families are told apart by hue (tan crawler, slate Brute, lilac Carrier, brown Warden), with no ambient glow. Landmarks are lit third where they exist (the reactor, the relay racks, the Manual Control sign). The gap is position, not value: the marine is first only when nothing touches him, and in melee or a dense crowd he is occluded or out-shouted by bars and rings. He keeps one identity from title to play, though he shrinks to about 70px in play. The decision holding the picture back most is **the far camera paired with flat-fill rendering**. At this distance the cel-shaded forms carry no light or material, so characters read as cut paper and the floor's soft light does all the work.

## 6. Against R30-C

- **Done:** #1 (crawlers darkened, no under-glow), #2 (glow only as a telegraph), #4 (slate Brute, wedge mask, eye pits).
- **Partly done:** #3 (the throat is now near-black with teeth and a plum tongue, but the head still buries the marine), #5 (darker floors outside the pools and some hard marks, though the centres are still smeared), #6 (Seismic is a ring with cracks inside it, but Whiteout has no frost and Napalm is still invisible).
- **Not done:** #7 (the camera and the hero's scale are unchanged).
- **Its scores:** they were fair for final25. This build earns +0.5 on readability, creatures and cohesion for the value pass, and nothing elsewhere.
