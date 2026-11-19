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
