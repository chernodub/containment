# R25-C — art-director second opinion (Claude Opus, 2026-11-25, gallery final20)

Evidence: 44 images, judged by eye only. Within budget I cut 1 fight, 1 incident frame, the windup crowd, the separate `crowds` mixed crowd (the relay-racks native frame covers it), 1 overlap and 1 conditions frame. The `review480` `fx29` files are before/after pairs squeezed into 480 px, so each ability is judged at about 240 px.

## 1. Scores

- **First impression: 6.5.** The title layout and type are premium. The recomposed shield marine is a strong hero. But the creatures behind him are black cut-outs with one pink slash, a different medium from him (`title.png`).
- **Interface: 7.5.** One disciplined, legible system. The before/after boon diagrams and the death card that names the cause and the fix are standout work. It is generic sci-fi glass, though, with lots of dead space on the death card (`onb14-death-crawler.png`).
- **Combat readability: 6.5.** The red fan, capsule and lane telegraphs are excellent (`windups--*-02`, Warden charge). The marine is found by his light pool. Floating white numerals (5, 7, 12) and stamp-sprite flames clutter the native Pyro frame.
- **Environments: 6.** Twenty distinct grades, and the reactor and annulus landmarks are good (`rooms--incident-facing-overload-floor`). The new floor motifs are giant "STOP 31 / BED 40 / ISO 68" stencils that read as debug labels, and the arena centres are still empty slabs (`twenty-arena-calm.png`).
- **Ability effects: 5.5.** Railbreaker and Flashfire read. The redrawn Cryo Nova, Meltdown and Seismic are bright lines over a nearly invisible glaze, so they read as UI diagrams, not matter. Whiteout lost almost all of its body compared with final19 (`fx29--whiteout-peak`).
- **Characters and creatures: 5.** The marine is a 7: rig colour on the dome, a clean ink line, one identity across all four rigs (`rigs-in-play.png`). The creatures are a 4. The Brutes are darker and the head mark is small now, but the three-step light lands as camouflage blotches, not planes. The Warden is still an untextured clay block (`bosses/…crew-checkpoint-charge-windup.png`). Motion is hold-and-snap.
- **Cohesion: 6.** Rooms, marine and telegraphs now share the toon-and-ink language. The title/selector PBR and the five-hue creature palette still sit outside it.

## 2. Tier

A strong early-access indie with AA menus, wrapped around creature art that is still prototype grade. I would pay $15 today, and $20–25 after changes 1–4.

## 3. Seven changes, ranked

1. **Planar form on the heavies** (`heavies.png` grey row, native Warden). Light by plane: top planes 45% value, sides 30%, undersides 15%. Merge the blotches into 4–6 large carapace plates with a 1 px cool rim on the key side. Add one hide texture (pitted chitin, 8% value noise). Separate the head from the shoulder mass with a dark collar notch.
2. **Give the area powers a body** (`fx29--cryo-nova`, `--meltdown`, `--whiteout`). Under each front, add a filled mid-value mass at 35–45% opacity: frost crust and shards for Cryo, a molten pool with an ember edge for Meltdown, a drifting snow bank for Whiteout. Add a 2-frame white core flash. Spokes alone are a radar graphic.
3. **Demote the floor stencils** (`twenty-arena-calm.png`, `crowd-crew-checkpoint`). Make them about 50% smaller, within 8% of the floor's value, and put them at lane edges, not under the fight. Drop the new black vein tendrils at Swarm Junction or keep them to the walls (`crowd-swarm-junction-native`).
4. **One species palette** (`crowds/…relay-racks-01.png`, `twenty-kiting.png`). Give all five families a shared bruise-dark carapace and keep each family's hue only in its glow marks. The crawler's pink spine glow is the model to follow. Today orange, lime, periwinkle, violet and jade read as five toy sets.
5. **Animate the beats** (`motion/brute-attack.png`, `marine-fire-shotgun.png`). The Brute holds one windup pose for 13 frames, then snaps to one lunge pose. Add a creeping anticipation lean, a 2-frame smear, a 10% overshoot and a settle. For the marine shotgun, add a 3–4 frame shoulder kick and a shell eject; it currently recoils for 6 frames and then idles.
6. **Fill the fight centres** (`twenty-arena-calm.png`: crew checkpoint, shielding gate, transmission). Add one low cover cluster and one floor light source within 4 m of the centre. Give walls visible height at the frame edges, so rooms read as volumes and not as plates.
7. **Clean up native-scale clutter** (`native-heavy/pyro-pressure-1.png`). Remove the floating per-enemy numerals, or move them into the health pips. Attach burn flames to bodies as flickers rather than as upright floor stamps. Thin the scratchy ink hatching around the dash.

## 4. Keep

1. The hostile telegraph grammar: red fans, capsules and lanes, consistent across all families and the Warden.
2. The lit marine with rig-coloured dome, chevron visor and forearm shield, which reads at 480.
3. The UI system: Barlow, the boon before/after diagrams and the death debrief.

## 5. Value hierarchy, identity, the decision

The hierarchy is nearly complete. The ship is dark, and the marine is lit first in every frame, including dark conditions (`conditions--…dark-heavy`). Creatures are second only because of hue and outline, not value: in the grey heavies row the Brutes sit within a step of the floor. Landmarks are third in calm frames but fall off-screen in most fights. The marine keeps one identity from title to play: the shield, the yellow dome and the visor carry over. The title render is still glossier and bulkier, and "07" never appears in play. The decision holding the picture back most: **everything is untextured flat facets.** Chitin, metal deck and props share one material response, so the toon light has nothing to describe, and the creatures in particular look like greybox with a filter.

## 6. Against R24-C

- **Done:** #2 (the Brutes are darker and the head mark is small).
- **Partly done:** #1 (there is a three-step light, but it is blotchy rather than planar), #4 (bigger rings and fissures, but the fill is still thin and Whiteout regressed), #5 (motifs and a second pool were added, but the centres are still empty and the stencils are loud), #6 (the shield now carries into play; the title is still PBR with "07"), #7 (the route cards are in-engine renders; the boon cards still use the old brown crawlers).
- **Not done:** #3 (one species base for the small families).
- **Its scores:** they were fair for final19. For final20 I raise creatures to 5, readability to 6.5 and cohesion to 6. I lower ability effects to 5.5 because the redrawn area powers lost mass.
