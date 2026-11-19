# R14-C — art-director second opinion (Claude Opus, 2026-11-20, gallery final9)

Evidence: 40 images from `final9/`: 9 screens and contact sheets, 26 frames at 480×270, 3 native-size frames and 2 motion sheets. I did not run the game.

## 1. Scores

- **First impression: 6.5.** A confident title, followed by a different marine in a different rendering style.
- **Interface: 7.5.** The type, diagrams and shop renders are clean and consistent, though every screen uses the same dark-teal panel. `onb14-death-stalker.png` says "1 damage" next to a 150-damage source.
- **Combat readability: 5.5.** One-on-one telegraphs are excellent. In crowds, the red wedge covers the marine (`twenty-heavy.png`) and the Brute lanes turn into spaghetti (`combat-heavy-freight-hold-03`). Pyro fire swallows both the marine and the warnings (`overlap-pyro-…-04`).
- **Environments: 5.5.** Each room has its own grade and attractive ink-lined props, but about 60% of every frame is empty grey tile (`rooms/combat-calm-containment-annulus.png`).
- **Ability effects: 6.5.** Flashfire, Railbreaker and Cryo Nova are strong. Meltdown is a flat disc, and Whiteout and Seismic Slam are thin rings.
- **Characters and creatures: 4.5.** The marine's posterised white, black and tan blotches read as cow-print. The Brutes are identical grey lumps with a blown white highlight on the head, and they are barely bigger than the marine.
- **Cohesion: 6.** The UI, cards and shop now agree with the game. The title art does not.

## 2. Tier

This is a good early-access indie: the interface and lighting are ready, but the actors and crowd fights are not. I would pay $12–15, not $25.

## 3. Seven changes, ranked

1. **One marine** (`title.png` vs `native-heavy/cryo-pressure-1.png`, `motion/marine-run-90.png`). Repaint the in-game marine to the title's blocking: flat off-white plates, a near-black undersuit only at the joints, and title yellow on the helmet, the "07" pauldron and the backpack (at least 15% of the silhouette). Delete the blotches. Raise the run's hips and cut the knee bend by about a third.
2. **Telegraphs off the hero** (`rooms/combat-heavy-communal-atrium-02.png`). Fill at 15–20% alpha with a bright leading edge, fading to zero near the origin. Draw the marine above the decals with a 2px light outline, and merge parallel Brute lanes into one band per attacker.
3. **Brute value and scale** (`twenty-heavy.png`, `motion/brute-attack.png`). Remove the head specular, which reads as a headlamp and outranks the marine. Darken and cool the body about 15%, add one small warm emissive mouth, and scale the Brute to 1.5× the marine. Give the strike 3 anticipation frames and a smear.
4. **Landmarks in frame** (`rooms--incident-facing-overload-floor`, `…transmission-chamber`). The reactor and antenna sit at the frame edge under the objective card. Frame them on the upper third, clear of the HUD, and give each one the room's brightest practical light.
5. **Break up the floor** (`combat-calm-containment-annulus.png`). Lower the floor value by 15–20%. Add cable and drag decals that lead to the landmark, contact AO at the walls and props, and practical pools that change hue per zone.
6. **Area abilities need a core and a residue** (`abilities--v2-meltdown-…-04`, `…whiteout-…-04`). Sequence each as a white-hot flash, then the shape, then lingering embers or frost with floor light. Add vertical elements: rising embers and ice shards.
7. **Player effects yield to hostile warnings** (`overlap--value14-overlap-pyro-communal-atrium-04`). Cap player-effect alpha within 1.5 m of the marine. Draw hostile outlines above all player effects, and show the marine's silhouette when it is occluded.

## 4. Keep

1. The UI system and the before/after diagrams (`rig-select.png`, `augment-draft.png`).
2. Twenty distinct room grades with ink-lined props and dark perimeters (`twenty-incident.png`).
3. The Railbreaker, Flashfire and Cryo Nova effects, and the one-on-one red telegraphs (`enemies--value14-stalker-attack-…-06`).

## 5. Value hierarchy and identity

The hierarchy is complete only when the room is calm. The ship is dark, the marine is lit and the creatures sit a step below it. Under pressure it inverts: the red wedge and dozens of Brute head-highlights outshine the marine, and the landmark is cropped at the frame edge. The marine does not keep one identity. The title shows a grey and yellow trooper with a cyan visor, while the rig select, death card and gameplay show a white, black and tan figure. What holds the picture back most is **the hard posterised toon ramp with clipped speculars on the characters**. It turns every actor into high-contrast pattern instead of a value mass. Give the characters two soft bands and no specular clip, and keep the hard ink line for the architecture.

## 6. Against R13-C

- **Done or mostly done:** #2, orange retired (telegraphs are now red and weak points yellow-green). #7, one rendering language (only the title still differs).
- **Partly done:** #1, hero identity (no longer skin-toned, but still not the title marine). #3, creatures (lifted, but over-lifted and identical). #4, set-pieces (Swarm Junction and the reactor now have volume; the floors are still empty). #5, bosses (the Warden is now organic, but the bosses are still below 2× the marine).
- **Not done:** #6, animation arcs. The Brute strike has no anticipation and the run has no counter-rotation.
- **Its scores:** fair for final8. My lower readability and character scores reflect final9's denser crowd evidence, not proven regressions.
