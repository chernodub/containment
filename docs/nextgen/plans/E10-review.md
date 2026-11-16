# E10 standard review

## Round 1 — modelled deck, contact-only actors, first ceiling sources

Opened all five native1920×1080 tours for Shielding Gate, Coolant Plant and Relay Racks, plus the three exact480 E9/E10 matched tour sheets in `e10-review-r1`. E9 same-view reference is the read-only final gallery. Floor construction is clearly visible now and the marine no longer drags a long hard shadow.

Critique: Shielding still reads blue-on-blue, with too many identical bright service strips. Widening/deepening the old channel exaggerates its glowing pipe rather than explaining a recess. Coolant's tread and bolts work at native size, but the extra E9 procedural grid crosses the new atlas joints. The new ceiling beams are too flat and generic; their black near faces are empty. Relay's cross aisle remains dark, and the repeated hatch module is conspicuous. This is an improvement over E9 but does not clear the commercial screenshot bar yet.

Fix prepared: replace the old channel instances with real half-metre wells, non-emissive pipes, side pilot lights and flush glass/grating; remove the second grid; bevel and panel the ceiling beams, with pipes and retaining ribs. Cache architecture shadows once their static owners settle. Preserve contact-only actor shadows.

Capture handling note: the next build was accidentally invoked before the first capture process finished. The fifteen tour PNGs were already rendered from the first loaded source; later G6 pages use the next build. This parent is an exploratory mixed-build round, never a final single-source evidence set. Complete replacement rounds and the final immutable build are required. No timing claim is based on this exploratory parent.

The exploratory G6 frames were opened at native and exact480 for all three standards. Contact-only actors remain separated and no crowd-sized purple shadow mass appears. These G6 fixtures stage10–12 spread threats, so they are explicitly supplemental; the unchanged denser native Cryo `combat-kiting` fixture is added to the complete subsequent standard rounds to inspect a20+ actor staging.

## Round 2 — actual recesses and detailed overheads

Source `b60677203861dcf6d916c5648255debacf4aac4b`, frozen `r2-dist`, capture `e10-standard-r2-clean`. Opened all fifteen native tour PNGs and all three exact480 matched E9/E10 sheets. Opened the denser Cryo kiting frames at native/480: Shielding frame02 has26 live enemies; Coolant frame02 has20. G6 remains a separate10–12-threat supplemental fixture.

Critique: the new wells are much less lamp-like and the copper pipes/cover frames read as construction. Coolant's pipe racks now have a manufactured top and clamps, though the recesses need more under-light. Shielding is still too uniformly blue, with a regular large hatch stamp; Relay's side windows remain cool-dark and its source rows are horizontal repetitions. The fight floor is legible under the Cryo crowd; no large opaque actor-shadow mass remains.

Fix: neutral graphite/teal floor paint for Shielding and Relay; deterministic weighted atlas variant selection rather than repeating the entire four-tile page; real256² static fixture/enclosure lighting bake in the floor material instead of evaluating six pool functions on every pixel; prepared512² maps for Low, with the same light bake; reapply actor contact policy after native pool resets restore cast-shadow flags. Deck texture state moves to WeakMaps so material warmup cloning cannot serialize image resources.

## Round 3 — neutral paint, varied modules and static irradiance

Source `34c2264250243729ad8ba18dd96f88cbcb518e43`, frozen `r3-dist`, capture `e10-standard-r3`. Opened every native five-position tour and all three exact480 matched sheets. Neutral Shielding paint and teal Relay fill separate floor from machines better. The weighted hatch placement removes the repeated page pattern, but the atlas inset erroneously crops most perimeter bevel/seam pixels: wide Shielding crops regress toward blank floor. Coolant shows disconnected bolts where plate joints should connect. This is a real visual defect, not something to accept because build/capture diagnostics pass.

Fix: reduce the sampling gutter from6px to half a pixel per tile so joints remain; add distinct environment ceiling forms (coolant valve wheels, containment sensor lenses, cryogenic canisters, cargo hoists, heat baffles, infested cable growth, domestic pendant shades), brighten the captive below-deck pilots, add a rear Workshop tool bridge and an airlock pressure ring. Diagnostic uses the existing instrument/warning gantry instead of a second generic crossbar; its deck paint is lifted without lifting threat colors.

Lifecycle correction: use native material sampler slots for the static light field and decal atlas so retained warmup proxies replace them with their own synthetic samplers. Actual decoded images and light fields retire with the lazy room owner, rather than with GPU-only material disposal during context loss. No actor/motion, UI, abilities, attack tuning or bot policy changes.
