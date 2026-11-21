# R18-C — art-director second opinion (Claude Opus, 2026-11-21, gallery final13)

Evidence: 44 images from `final13/`: 6 screens, 3 contact sheets, 30 review480 frames, 3 native frames (`native-heavy/pyro-pressure-1`, `crowds/…swarm-junction-01`, `elite-pairs/…-stalker-…`) and 2 motion sheets (`marine-contact-1`, `brute-contact-1`). I did not run the game.

## 1. Scores

- **First impression: 6.5.** The type and layout look premium. The key art does not: soft brown clay creatures and black wire strokes hanging in mid-air (`title.png`).
- **Interface: 7.5.** A consistent, commercial system: diagrammed rigs, before/after boon cards, a shop with modelled icons and a death card that names the cause and a fix. The route cards are smeared, posterised crops (`run15-condition-route.png`).
- **Combat readability: 6.5.** At native size the inked marine, translucent red wedges and family hues read (`crowds/…swarm-junction-01`). At 480 the marine shrinks to a few pixels, and giant floor stencils ("LOCK 12", "TRIAGE 11") compete with the actors (`native-heavy--arc-pressure-3`, `…story-cryo-pressure-1`).
- **Environments: 5.5.** All twenty rooms have their own grade, but each is a plate floor with stencilled numbers and grey box props. The landmarks are untextured blocks (`rooms--incident-facing-freight-hold`, `…-armory`).
- **Ability effects: 6.5.** Railbreaker now has a hot white core and is the best effect in the set. Flashfire, Cryo Nova, Seismic Slam and Napalm land. Overload is still a faint lilac thread, and Meltdown is a thin dashed ring (`abilities--…-overload-03`, `…-meltdown-03`).
- **Characters and creatures: 6.** The creatures now have angular shells, dark plates and pink weak-point slits, and they separate in crowds (`crowds/…swarm-junction-01`). The Brute is still muddy and melts on death (`motion/brute-contact-1`). The Matron is a pink translucent cone (`bosses--…-matron-…-brood`).
- **Cohesion: 5.5.** Four rendering languages still: ink-toon gameplay, sketch boon vignettes, blurred route crops and soft PBR title art.

## 2. Tier

A polished early-access indie: an AA-grade interface around actors that have moved up a notch and floors that have not. I would pay $15.

## 3. Seven changes, ranked

1. **One render language for out-of-game art** (`title.png`, `run15-condition-route.png`). Re-render the title creatures and the route art from the in-game ink-toon shader at 2× resolution. Delete the floating black wire strokes. Crop the route cards on a single hero silhouette against a dark ground, not on smeared colour.
2. **Floor stencils down, floor detail up** (`twenty-arena-calm.png`, `native-heavy--story-cryo-pressure-1`). Cut stencil opacity to about 25% and their size by half, and use them once per room. Spend that value on grime gradients toward walls, contact AO, cable runs, grating and plate breaks, and hazard paint at choke points.
3. **Textured, lit landmarks** (`rooms--incident-facing-freight-hold`, `…-armory`). Give each landmark painted wear, two-tone panelling and an emissive core, with a key light that puts it one clear value step above the floor. Right now the crane and the turret ring read as greybox.
4. **Marine scale at gameplay zoom** (`native-heavy--arc-pressure-3`, `twenty-native.png`). Pull the camera in about 12%, or scale the marine 1.1×. Add a thin white rim on the dome and visor so the hero survives 480 and dense VFX.
5. **Weak abilities** (`abilities--…-overload-03`, `…-meltdown-03`). Give Overload Railbreaker's treatment: a white core, violet falloff, branching arcs at three times the width and a flash at each target. Make Meltdown a filled heat-shimmer disc with an orange rim and rising embers, not a dashed outline.
6. **Brute and Matron finish** (`motion/brute-contact-1`, `bosses--…-matron-…-brood`). The Brute needs the new angular chitin language: dark plates, a pale crest and an emissive mouth. Its death should be a readable collapse onto its side, not a pale smear. The Matron needs an opaque, ribbed carapace with glowing egg sacs, not a translucent cone.
7. **Hostile colour ownership** (`overlap--…-pyro-03`, `native-heavy/pyro-pressure-1`). Move Pyro toward yellow-orange. Draw hostile red/magenta markers after player VFX with a white core ring, and cap player bloom near them.

## 4. Keep

1. The UI system: Barlow, diagrammed rig and boon cards, and the death card that names a cause and a fix (`rig-breacher-equip.png`, `onb14-death-stalker.png`).
2. The marine icon: white plates, the yellow "07" dome and a cyan visor in a personal pool of light (`elite-pairs/…-stalker`).
3. The new angular creature shells with pink weak-point slits, per-family hues and translucent rimmed red wedges (`crowds/…swarm-junction-01`).

## 5. Value hierarchy and identity

The hierarchy is now nearly complete. The ship is dark, the marine is lit first, and creatures hold second place better thanks to darker plates and rim light; even Dark Heavy now keeps the marine in a green pool (`conditions--…-dark-heavy-…`). It breaks in two places:
- The third tier is missing. Landmarks are unlit greybox, and the brightest non-actor elements are floor stencils, which pull the eye to text instead of story.
- Grey rooms (Crew Checkpoint, Armory) lift the whole floor.

The marine keeps one identity from title to play; only the rig-screen render is flatter and greyer. The single decision holding the picture back is **untextured surfaces**: flat toon fill inside an ink line, with no painted value modelling. It makes props, landmarks and floors read as outlined greybox. Commit to hand-painted gradients (dark base, lit top planes, worn edges) on the environment, as the creatures have begun to get.

## 6. Against R17-C

- **Done:** #6 is done for Railbreaker, which now has a white core, and Dark Heavy readability is fixed.
- **Partly done:** #1, creatures: there are angular shells, a cool rim and darker plates, but the Brute is still clay. #6: Overload and Meltdown are still thin. #7: elites now have pale back plates and gold rings, but marine lean and recoil are barely visible. #3, hostile markers: they read at native size, but it is still marginal under Pyro.
- **Not done:** #2, title and route art are unchanged. #4, floor density: the floors are still plates. #5, landmarks: they are in frame now, but unlit and untextured.
- **Its scores:** I agree. For this build I raise only abilities (+0.5) and characters (+0.5); everything else holds.
