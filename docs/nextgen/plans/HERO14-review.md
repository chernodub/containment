# HERO14 review log — marine at gameplay size

Sheets: four rigs (rows: Breacher, Cryo, Pyro, Arc) × Crew Checkpoint / Relay Racks / Freight Hold × calm / heavy,
each frame area-reduced to 480×270 and windowed 96 px around the marine (pixel-doubled), colour + greyscale:
`artifacts/nextgen/hero14-final/{before,after}-{colour,grey}.png`.

**Before.** Confirms the reviews: LIGHT13's marine hierarchy tinted every top-facing plate with the rig colour and
self-lit the diffuse, and the marine quantizer classified the cream K12 plates as "rig panels" and saturated them —
Breacher/Pyro read as skin, Cryo/Arc as pastel, no dark undersuit anywhere; the gun was flattened to the dark
actor family tone.

**Round 1 (runtime only).** Removed the plate tint, self-light only true plates, near-black undersuit group,
desaturated room light on the marine, cool rim, interior region ink .80 → .22. He now reads as armour in every room,
no skin tones; but rig identity collapsed to small patches and the gun was still black.

**Round 2 (assets).** Cool-white plate albedo, yellow-amber Breacher, rig-coloured crown stripes, both pauldron
lames and pack barrels/cores in rig colour; weapons keep their authored atlas with a lifted grey palette. Gun now
mid-grey with a light top. Native frame showed the remaining fault: lit rig-coloured tops clip to white in tone
mapping, so only shadowed rig panels kept their hue.

**Round 3.** Rig-panel albedo darkened (×.58) so lit tops stay saturated; rig panels self-emit more; one Pyro
exhaust fin removed from the game LOD to hold the 25k budget. Result: see the after sheets (judged below).

**Round 4.** Lit rig panels take .32 of the direct light (specular .4) and rely on self-emission, so tops no longer
clip to white. Greyscale sheet: in all twelve room/state cells he is the highest-contrast figure (white plates,
black undersuit) and reads as armour; colour sheet: Breacher amber, Cryo blue, Pyro orange-red, Arc violet are
nameable in calm frames, weaker in heavy frames where combat effects overlay him. Rig coverage is below the 15–20 %
target (estimate ~10 % of the top-down silhouette).
