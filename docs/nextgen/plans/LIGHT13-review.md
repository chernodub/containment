# LIGHT13 review log

Squint test = greyscale 480×270: marine first, threats second, room third.

## Round 1 (r1: value uniforms + deck pools + actor hierarchy)
- Crew floor centre 145→93 sRGB; creatures fell to dark masses with orange lanterns; marine plates now the lightest shape. FAIL on crew: the kit floor centre still reads as a pale even slab — the bake only shapes the e9 deck, not kit floors.
- Fix: one shared analytic value field (arena falloff + exit pool) on every room surface, so kit floors/walls also fall off.

## Round 2 (r2: shared field, lower floor values)
- Crew floor centre 76 sRGB (was 145), perimeter 37; heavy frame squint passes: marine white, lanterns/warnings next, room last. Coolant still a flat green mid-tone; relay heavy reads well.
- Weak: marine floor glow nearly invisible (+10%); rig colour on crown/pauldrons not visible; cyan practical wedge left of spawn still the hottest floor shape in crew calm.

## Round 3 (r3: rig lamp ×3, crown ×2, practicals/decks lower)
- Squint passes in all three heavy frames: marine + his floor pool first, lantern dots/orange warnings second, room last. Coolant is now dark teal instead of a green slab; crew floor centre 69 sRGB vs marine plates ~220; pool beside marine ~125.
- Low tier (g2-calm-low) matches High numerically (floor centre 68 vs 69) — same uniforms, cheap path. Cryo in Relay: ability effects own the frame on the dark floor.
- Weak: pale-cyan wall/practical panels in Coolant bottom-left are still the brightest room objects (HSL-saturation test missed pale cyans → switched to chroma < .45 and fixtures .2); rig lamp disc slightly too large in tour frames (3.4→3.0 m).
