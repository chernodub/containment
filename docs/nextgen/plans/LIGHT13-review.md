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

## Round 4 (r4: full set incl. tours, Low, Cryo in Relay)
- Heavy frames pass the squint in all three rooms. FAIL in tours: the value field was centred on the arena only, so tour positions in Relay's/Coolant's lanes fell to near-black except the rig-lamp disc — "room third" became "room absent".
- FAIL: Coolant cabinet-top panels (`e9-cyan`, emissive 6 → mood ×1.75 = 10.5) still blow out; scaling by .2 leaves ~2.
- Fix: field now takes the room's four motivated pools (fight circle + three named-space fixtures from `deckLightSources`, lane radius ×.55); neutral fixtures in profiled rooms get a hard emissive ceiling of .7.

## Final (light13-final, after round-4 fixes)
- Room-region luminance (sRGB 0–255, central 1300×700 of calm frames) p10/p50/p90 — Crew 110/147/163 → 44/75/90; Coolant 51/99/115 → 12/38/47; Relay 30/51/63 → 7/27/49. Marine box p98 ≈ 210–214 in every room.
- Squint: heavy frames pass in all three rooms; tours keep lanes readable (four-pool field). Coolant panels now grey, not white. Crew remains the weakest: its floor centre is still a mid-grey slab (p50 75) — darker than before but the room is the least dramatic of the three.
- Low tier matches High (same uniforms). Cryo in Relay: effects read at full strength on the darker deck; warning outlines unchanged and now higher contrast.
