# R22-C — art-director second opinion (Claude Opus, 2026-11-24, gallery final17)

Evidence: 44 images, and I did not run the game. I looked at 6 screens, 3 contact sheets, `heavies.png` and `rigs-in-play.png`. From `review480` I looked at 4 native-heavy frames, 3 incident frames, 8 abilities, 5 family windups plus the swarm-junction windup crowd, 2 bosses, 1 elite pair, 1 overlap frame and 1 condition. I cut two fight frames, one incident frame, one overlap frame and one condition to stay in budget. At native size I looked at `crowds/…swarm-junction-01`, `native-heavy/pyro-pressure-4` and `bosses/…crew-checkpoint-charge-windup`, plus the marine and Brute motion sheets.

## 1. Scores

- **First impression: 6.5.** The title type and layout look premium. But the glossy hero render on the title does not match the flat toon marine you then play, and the title creatures are still murky (`title.png`).
- **Interface: 7.5.** It is one disciplined system. The boon cards have illustrations and before/after diagrams (`augment-draft.png`), and the death card gives the cause and a fix (`onb14-death-spitter.png`). The shop props are crude low-poly blocks (`shop.png`), and the route cards put creatures in an empty, dark box (`run15-condition-route.png`).
- **Combat readability: 6.5.** The red cones, capsules and pills are crisp (`windups--loaded-*`). Brown Brutes sink to the floor's value in dark rooms, and Pyro orange merges with orange crawlers and the hostile reds (`overlap--…pyro-04`, `native-heavy/pyro-pressure-4`).
- **Environments: 6.** Twenty distinct grades, and a few strong landmarks: the annulus, the overload reactor and the workshop growth. The arena centres are still huge, empty slate plates (`twenty-arena-calm.png`).
- **Ability effects: 6.** Railbreaker's beam and the Seismic Slam gold ring with its arcs are good. Flashfire is a flat orange smear, and Whiteout and Meltdown barely register (`abilities--…-03`).
- **Characters and creatures: 5.** The marine reads well. The new creature finish is opaque at last, but two flat bands per zone posterise the bodies into crumpled brown paper. At native size the Warden is a lumpy mass with no head-to-limb hierarchy (`bosses/…charge-windup`). The Matron's pink stack is the best of the large creatures.
- **Cohesion: 5.5.** There are still two worlds: PBR gloss on the title, selector and route cards, and posterised toon in play.

## 2. Tier

This is polished early-access indie: AA menus over upper-prototype creature art. I would pay $12–15 today.

## 3. Seven changes, ranked

1. **Creature form light** (`bosses/…charge-windup`, `crowds/…swarm-junction-01`). Keep them opaque and keep the ink line. Replace the per-zone two-band blotch with one light direction across the whole body: lit planes at 50% value, shadow at 20%, and a 1–2 px cool rim from the key light. Merge the camo patches into three large shapes per body. Give the flesh zones a wet specular pick.
2. **Brute and Warden anatomy** (`heavies.png`, the silhouette row). Block in a clear head wedge, a shoulder yoke and two readable forelimbs. Halve the frills. For the Warden, add a unique bone crest and a lit maw that is the brightest thing on its body. The glowing slot is a good start, so move it forward and up.
3. **Separate the creature palette from the floor and from Pyro** (`twenty-kiting.png`, `overlap--…pyro-04`). Push the Brute toward desaturated olive or bone over a dark plate, so no hostile body shares Pyro's orange hue. Draw hostile telegraphs above player effects, and cap fire at 60% opacity inside enemy footprints.
4. **Fire and frost shapes** (`…flashfire-03`, `…meltdown-03`, `…whiteout-03`). Build flame tongues in three layers: a dark-red base, an orange body and a yellow tip. Leave a 2 s scorch decal. Whiteout needs a dense rolling frost disc with ice crusting on the enemies, not hairline rings.
5. **Arena floor storytelling** (`twenty-arena-calm.png`). Within 4 m of the centre, add grates, cable runs, puddles, scorch and debris clusters, plus contact AO at prop bases and one practical light pool per room.
6. **Landmark light tier** (`rooms--incident-facing-armory`, `…transmission-chamber`). Give each landmark an emissive, room-coloured practical at about 60% of the marine pool's brightness, with spill on the floor. The armory turret and the transmission dish are currently grey props in the dark.
7. **One render language** (`title.png`, `rig-breacher-equip.png`, `run15-condition-route.png`). Re-render the title, selector and route art with the in-game ink and band shader and the same key light. Use a real room crop behind the route creatures.

## 4. Keep

1. The hostile red telegraph grammar, with a single filled next attack (`windups--loaded-stalker-02`, the Warden's charge capsule).
2. The UI system: Barlow type, boon diagrams and the death card's cause and fix.
3. The marine's identity: the white and dark-grey plates, the rig-coloured pack and dome, and the ink outline. It reads at 480×270 in every rig (`rigs-in-play.png`), and the run cycle has a real stride (`motion/marine-contact-1`).

## 5. Value hierarchy, identity, the decision

The hierarchy is about two-thirds complete. The ship is dark and the marine is lit first in every frame. Creatures are second only where they are saturated: orange crawlers, purple carriers and lime spitters do pop. Brutes and the Warden sit at floor value and depend on their white outline. The landmark tier is earned in perhaps five of twenty rooms. The marine keeps one identity from title to play in colour and silhouette, but not in material: on the title he is glossy PBR, and in play he is flat two-tone. The decision holding the picture back most is **rendering creatures with per-zone flat value bands instead of whole-body form lighting**. It makes every enemy read as a posterised cut-out rather than a lit mass in the same room as the marine.

## 6. Against R21-C

- **Done:** none fully.
- **Partly done:** #1, creature finish (opaque, ink-lined and two-band, but posterised rather than lit, and no rim). #2, large silhouettes (the Warden is now much bigger and distinct, but the Brute and Warden still lack head and limb clarity). #5, landmark light (unchanged rooms are still dim).
- **Not done:** #3, effects over warnings (`overlap--…pyro-04` still swallows the layer). #4, floor breakup. #6, one marine render. #7, fire shapes (Flashfire is still flat cards).
- **Its scores:** I broadly agree. On this build I put first impression and readability 0.5 lower than R21 did, because the shader change widened the gap between the title and play, and brown Brutes now sink into dark floors. I put creatures at 5.0 rather than 5.5, because opacity fixed one fault and exposed the posterisation.
