# R12-C — art-director second opinion (Claude Opus, 2026-11-17, gallery final7)

Evidence: 35 images from `artifacts/nextgen/final7/`. These were 5 screens, 2 contact sheets, 21 frames at 480×270 (six heavy fights, eight abilities, five creature families and two bosses), 3 native-size frames and 2 motion sheets. I did not run the game.

## 1. Scores

- **First impression: 6.** The title type and layout look professional. The key art is muddy: the creatures are black shapes against black, and the marine reads as a toy.
- **Interface: 7.5.** The UI is clean and consistent, and the rig-select diagrams are excellent. It leans on a generic "sci-fi dashboard" style with too much tiny micro-type. "Unidentified damage" on the death screen undercuts all of that polish.
- **Combat readability: 4.5.** In heavy fights there are about 30 rust-brown, mid-value bodies, orange telegraph lines tangled through them, and a pale hero lost in the middle.
- **Environments: 5.** Twenty rooms do have distinct colour grades. Each one is still a flat-lit grid floor with props pushed to the edges.
- **Ability effects: 5.5.** Railbreaker and Overload are commercial quality. Napalm, Whiteout and Meltdown are not.
- **Characters and creatures: 4.5.** The hero loses its identity in play. The creature families can't be told apart at 480p, and the bosses are no bigger than the regular enemies.
- **Cohesion: 5.** The menus and title art promise moody sci-fi horror. The game itself looks like an evenly lit office floor.

## 2. Tier

This is a polished vertical slice or early-access indie, below solid commercial indie. The interface is close to shipping; the world, the characters and the combat are not. As a player I would pay $10–15 on sale. It cannot compete at a $20–25 premium price next to the best top-down action games.

## 3. Seven changes, ranked

1. **Creature silhouette, value and scale hierarchy.** See `review480/compare-heavy--combat-heavy-armory-03.png`, `…containment-annulus-03.png` and `enemy-variants--g12-native-brute-warden-awakening-bay-15.png`. Every family shares the same rust-brown mid-value, and the Warden is the size of a Brute. Give each family one shape and one accent:
   - **Crawler:** low and wide.
   - **Stalker:** tall, thin and spiky.
   - **Spitter:** one glowing green sac.
   - **Brute:** about 1.6× the marine.
   - **Carrier:** bulbous, with a pink belly.

   Darken the bodies to about 20–30% value with a cool rim light, so only the emissive weak points glow hot. Bosses should be 2–2.5× the marine with a unique crown or back silhouette, not a recoloured base creature.
2. **Make the hero read like the key art.** See `native-heavy/play-r6-armory-015.png` and `motion/marine-overview.png`. In play the marine is a washed-out grey-white figure that looks translucent and carries a pure-black gun; the orange "07" pauldron from the title is barely visible.
   - Push the saturated orange onto the top-facing surfaces (helmet crown, pauldrons, backpack).
   - Darken the undersuit to separate the values.
   - Add an emissive cyan visor and a small suit lamp.
   - Make the gun mid-grey with orange edges.
   - Scale the marine up about 10–15%.
3. **Light the rooms rather than illuminating them evenly.** See `twenty-calm.png` (crew-checkpoint, freight-hold and coolant-plant are uniformly lit). Drop the ambient light about 40%. Build each room from three or four pooled practical lights with real falloff, and let the room edges go to near-black. Put the combat lanes in light and the perimeter in shadow.
4. **Break up the floors.** See `rooms/combat-calm-swarm-junction.png` and `twenty-calm.png` (awakening-bay, infested-workshop). The floors are huge unbroken grids. Add:
   - wear and grime gradients along walking paths;
   - cable runs, puddles and scorch decals;
   - mid-scale features such as raised plinths, trenches and grate pits;
   - dark foreground occluders (pipes, gantry edges) that cut across the frame borders for depth.
5. **Rework the telegraph language.** See `compare-heavy--combat-heavy-relay-racks-03.png` and `…awakening-bay-03.png`. Thin orange outlines snake through the crowd and read as UI noise. Use a low-alpha filled ground decal with a bright leading edge that sweeps in over the wind-up. Show it only for attacks about to land, give each family its own shape (cone, lane, ring), and keep it below the creature bodies in value.
6. **Give the area abilities volume.** See `abilities--v2-napalm-charge-relay-racks-relay-racks-04.png`, which is a flat noise-textured disc that looks like a pasted decal, and `…whiteout-…-04.png` and `…meltdown-…-04.png`, which are the same concentric-ring template recoloured.
   - **Napalm:** a scorch decal, standing flame cards with height, embers and heat haze.
   - **Whiteout:** drifting fog plus frost creeping across the floor, with no rings.
   - **Seismic:** floor cracks, thrown debris and a hard camera kick.
7. **Rework the infestation material.** See `rooms/combat-calm-swarm-junction.png`. The purple blobs with lilac polka dots look like plasticine. Add wet specular, a subsurface-style dark core with lit edges, veins and tendrils anchored into the walls and machines, and pustules that pulse with emissive light. Blend the edges into a stained floor decal.

## 4. Keep

1. **The UI system** (`rig-select.png`, `starting-boon.png`). Keep the typography, the colour-coded rigs, the ability diagrams and the keyboard hints. This is the most commercial-looking part of the game.
2. **A distinct colour grade per room** (`twenty-calm.png`). The twenty rooms are told apart by palette alone; keep that while adding lighting on top.
3. **Railbreaker and Overload** (`abilities--v2-railbreaker-…-04.png`, `…overload-…-04.png`). Each is a bright single-hue beam or chain that reads instantly at 480p. Use them as the benchmark for the other abilities.

## 5. The decision holding it back

The game has no value hierarchy. The floors, walls, creatures and hero all sit in the same mid-grey band under flat, even light with a toon outline, so nothing wins the eye. The fix is a lighting and value decision, not a modelling one. Commit to "the ship is dark; actors carry the light". Push environments down to low value and low saturation. The marine becomes the brightest, most saturated shape on screen. Creatures are dark masses that show only their hot weak points, and telegraphs and abilities own the remaining highlights. The title screen already works this way and the game does not. Until the rooms stop being evenly lit floors, extra props, models or VFX will only add clutter to a picture with no focal point.
