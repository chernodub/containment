# R23-C — art-director second opinion (Claude Opus, 2026-11-25, gallery final18)

Evidence: 43 images; I did not run the game. 6 screens, 3 sheets, heavies, rigs-in-play; from `review480` 5 fights, 3 incident frames, 6 ability peaks, 5 windups plus a crowd, Warden, Matron, 1 elite pair, 2 overlap, 2 conditions; 3 native frames; 2 motion sheets. I cut one fight frame, one incident frame and two abilities for budget.

## 1. Scores

- **First impression: 6.5.** The title layout and type are premium. The key art is glossy PBR, and the yellow "07" dome reads as a second head (`title.png`).
- **Interface: 7.5.** One disciplined system: illustrated boon cards with before/after diagrams, and a death card that names the cause and the fix. The shop goods are crude low-poly blocks, and the route cards float the creatures in an empty box (`shop.png`, `run15-condition-route.png`).
- **Combat readability: 6.5.** Windup telegraphs are crisp, and the marine's light pool keeps him findable (`crowds/…swarm-junction-01`). In Pyro fights he disappears into orange fire, red cones and damage numbers (`native-heavy/pyro-pressure-3`).
- **Environments: 6.** Twenty distinct grades, and good landmarks: the overload reactor, the workshop growth and the atrium greenhouse. Arena centres are still empty slate plates (`twenty-arena-calm.png`).
- **Ability effects: 6.5.** Cryo Nova's shard ring, Railbreaker's beam and Seismic Slam's gold ring are good. Meltdown now registers. Flashfire is still flat orange petals, and Overload's peak is nearly invisible (`fx26--overload-01`).
- **Characters and creatures: 5.5.** Family hue coding works: orange crawlers, lime spitters, violet carriers, grey stalkers. The Brute finally has a hood, a head and a blade arm (`elite-pairs/…brute`). But the bodies still read as torn brown paper, and the Warden is a rock lump with an eye.
- **Cohesion: 5.5.** There are still two worlds: PBR gloss on the title, selector and route art, and flat toon in play.

## 2. Tier

This is polished early-access indie: AA menus over upper-prototype creature and floor art. I would pay $12–15 today; $20 after changes 1–4.

## 3. Seven changes, ranked

1. **Creature form light** (`heavies.png`, `elite-pairs/…brute`). Keep the ink line and the three shapes, but light them from one key direction across the whole body: planes at 50% value, shadow at 20%, and a 1–2 px cool rim. Trim the ragged fur edges to 3–4 big notches per side.
2. **Reserve red for hostiles** (`fx26--meltdown-01`, `native-heavy/pyro-pressure-3`). Meltdown's red hex and Pyro's red-orange share the hostile language. Shift player Pyro toward yellow-white cores with amber edges. Draw hostile cones above player fire, and cap fire at 50% opacity inside telegraphs.
3. **Marine read in play** (`rigs-in-play.png`, the native crowd frame). The slotted yellow pack is his biggest shape, and his visor is lost. Shrink the pack by 30%, make the visor the brightest emissive on him, and put the rig colour on both shoulder plates.
4. **Arena floor storytelling** (`twenty-arena-calm.png`). Within 4 m of the centre, add grates, cable runs, scorch, puddles and debris clusters, with contact AO at prop bases and a second practical light pool per room.
5. **Warden anatomy** (`creatures26--warden--charge-windup`). Add a head wedge, a bone crest and two readable forelimbs. Make the maw the brightest point on its body.
6. **Arc peaks** (`fx26--overload-01`). Add a 2-frame white flash, a branching bolt to each target and a violet ground scorch.
7. **One render language** (`title.png`, `run15-condition-route.png`). Re-render the title, selector and route art with the in-game ink and band shader under the same key light, and put a real room crop behind the route creatures.

## 4. Keep

1. The hostile telegraph grammar of filled red cones, capsules and pills (`windups--loaded-*`, the Warden's charge capsule).
2. The UI system: Barlow type, boon diagrams, and the death card's cause and fix.
3. A dark ship with a lit pool on the marine, plus per-room colour grades and ink outlines (`twenty-kiting.png`).

## 5. Value hierarchy, identity, the decision

The hierarchy is about 70% complete. The ship is dark, and the marine is lit first in every calm and windup frame. Saturated creatures sit clearly second. Brutes and the Warden still sit at floor value and rely on their outline. Landmarks earn third place in perhaps six of twenty rooms (the reactor, the workshop, the atrium and the annulus), but not in the empty arenas. In heavy Pyro the hierarchy collapses. The marine keeps one identity in colour and silhouette, but not in material: on the title he is glossy PBR, and in play he is flat two-tone. The decision holding the picture back most is still **flat per-shape value bands on creatures instead of whole-body form lighting**: every enemy reads as a cut-out laid on the room, not a mass standing in it.

## 6. Against R22-C

- **Done:** none fully.
- **Partly done:** #1 (the shapes are merged into three large ones, but there is no form light or rim), #2 (the Brute now has a head and limbs; the Warden does not), #4 (Meltdown is visible, and fire leaves ground tongues, but Flashfire is still flat cards) and #6 (the reactor, the workshop and the atrium are lit; most landmarks are not).
- **Not done:** #3 (Pyro still merges with hostile red in `pyro-pressure-3`), #5 (the floor), #7 (one render language).
- **Its scores:** I agree. This build earns +0.5 for effects and +0.5 for creatures, from the visible Meltdown and the Brute's head; every other score is unchanged.
