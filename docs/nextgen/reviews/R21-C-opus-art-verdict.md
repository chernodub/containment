# R21-C — art-director second opinion (Claude Opus, 2026-11-24, gallery final16)

Evidence: 44 images. I looked at 6 screens, 3 contact sheets, `rigs-in-play` and the play25 swarm-junction frame. From `review480` I looked at 6 native-heavy frames, 3 incident frames, 6 abilities, 6 windups, 2 bosses, 1 crowd, 1 elite pair, 2 overlap frames and 1 condition. I cut one incident frame, two abilities and one condition to stay in budget. At native size I looked at `cryo-pressure-3`, the relay-racks crowd and the brute elite pair, plus two motion sheets (marine and Brute). I did not run the game.

## 1. Scores

- **First impression: 7.** The title layout and type look premium, and the marine silhouette and yellow "07" dome sell the game. The title creatures are still murky, low-key PBR clutter (`title.png`).
- **Interface: 7.5.** It is one coherent system. The boon cards have before/after diagrams, the shop items are modelled, and the death card gives the cause, "Dash was ready" and a fix (`onb14-death-stalker.png`). The large panels have a lot of dead space, and the death-card tip art is a placeholder diagram.
- **Combat readability: 7.** The red wedges, lanes and capsules are crisp. Drawing only the next attack filled is a real improvement (`play25-…swarm-junction`). Pyro and Arc bursts still swallow the hostile layer (`overlap--…pyro-04`, `…arc-04`).
- **Environments: 6.** Each of the twenty rooms has its own grade, and the dark condition is atmospheric (`conditions--dark-heavy-…`). The arena centres are still bare plates lit only by the marine's pool (`twenty-arena-calm.png`).
- **Ability effects: 6.** Railbreaker's beam, the Cryo Nova ring with its shards, and Slam's gold ring are good primitives. Napalm is still thin streaks, and the flame cards are flat, opaque orange blobs (`…napalm-charge-03`, `…flashfire-03`). My Overload frame (`-03`) showed no ability effect at all.
- **Characters and creatures: 5.5.** The marine is strong. At native size the creatures render as milky, semi-translucent cut-outs with ragged painted edges (`native-heavy/cryo-pressure-3`). Brutes in a crowd read as piles of rubble (`crowds/…relay-racks-01`). The Warden is a brute variant, not a boss (`bosses--warden-…charge-windup`).
- **Cohesion: 5.5.** The game uses three finishes: glossy PBR on the title and selector, ink toon on the marine and set, and wash-painted creatures.

## 2. Tier

This is polished early-access indie. The menus are AA, and the in-room art is upper indie on its best frames and prototype in dense fights. I would pay $15–18.

## 3. Seven changes, ranked

1. **Creature finish** (`native-heavy/cryo-pressure-3`, `crowds/…relay-racks-01`). Make the bodies fully opaque. Use two-tone cel shading: base at about 45% value and a hard shadow band at about 25%. Give each family one saturated emissive cue, add a thin cool rim from the key light, and use the same ink line as the marine. Remove the painterly alpha fringe.
2. **Large-creature silhouettes** (`elite-pairs/…brute`, `crowds/…relay-racks`). Give the Brute a readable head, shoulder mass and two clean limbs. Cut the frill count by half, and separate the plates (dark) from the flesh (warm mid). The Warden needs a unique crest and needs to be about 1.5× its current scale.
3. **Player effects over hostile warnings** (`overlap--…pyro-04`, `…arc-04`). Always draw the red telegraphs above player effects. Inside creature footprints, cap fire and arc at about 60% opacity, with hot edges and transparent cores. Shorten the Arc white-out to 2 frames.
4. **Arena floor breakup** (`twenty-arena-calm.png`). Put mid-scale floor storytelling within 3–4 m of the centre: grates, cable runs, scorch, coolant puddles and debris. Add contact AO at wall bases, and give each room one practical light pool besides the marine's.
5. **Landmark light tier** (`rooms--incident-facing-transmission-chamber`, `…coolant-plant`). Give each landmark an emissive, room-coloured practical at about 60% of the marine pool's brightness, with spill on the floor. Today only the overload reactor and the annulus earn third place.
6. **One render language for the marine** (`title.png`, `rigs-in-play.png`). Re-render the title and selector portraits with the in-game ink line, the key light and the planted hero crouch, or push the in-game shader toward the portraits' material gloss. Pick one.
7. **Fire shapes** (`…napalm-charge-03`, `…flashfire-03`). Replace the flat cards with layered flame tongues: a dark-red base, an orange body and a yellow tip. Add heat-scorch decals that persist for 2 s and a single ember layer.

## 4. Keep

1. The hostile red grammar, with only the next attack drawn filled (`play25`, `windups--…stalker-02`, the Warden's charge capsule).
2. The UI system: Barlow type, diagrammed boons, modelled shop props and the death card's cause and fix.
3. The marine's identity and the per-room colour grade. The rig colour on the dome and pack reads at 480×270 (`rigs-in-play.png`), and the motion strips show a chunky, planted run and fire cycle.

## 5. Value hierarchy, identity, the decision

The hierarchy is about three-quarters complete. The ship is dark and the marine is lit first in nearly every frame. Creatures sit second in sparse fights, but in dense ones their pale, milky bodies drift up toward the marine's value, and the landmarks are third only in a few rooms. The marine keeps one identity, white plates with a rig-coloured "07" dome and a cyan visor, from the title through the selector to play. Only the finish changes, from glossy PBR to ink toon. The art-direction decision holding the picture back most is **the creature rendering style**. A translucent, painted wash sits on an ink-lined toon world, so the enemies look unfinished beside a finished hero and set.

## 6. Against R20-C

- **Done:** #4, the damage-number budget (now single merged numbers such as "231 (6 hits)"). **Mostly done:** #1, camera composition (in most native frames the marine sits inside the frame and clear of the HUD).
- **Partly done:** #2, creature value in crowds (better in relay racks, still pale ghosts in `cryo-pressure-3`). #3, Brute and boss mass (the elite Brute is bigger and the Matron pods are more opaque, but the Warden is still a brute). #6, the landmark light tier (the reactor and the annulus have it, the transmission chamber and the coolant plant do not).
- **Not done:** #5, floor breakup. #7, one marine render (the title and selector are still PBR).
- **Its scores:** I agree with most of them. On that build I would have held creatures at 5.5 rather than 6, because the translucency was the root problem then too. On this build, readability and first impression each rise by 0.5.
