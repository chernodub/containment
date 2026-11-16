# K12 design sheet — Crown-keel, second generation

Scope (owner, 2026-11-16): the hero marine only — helmet, armour, undersuit, gloves, boots, four rig variants, two
LODs from one source, one pose/light rig for portraits and the title hero layer. Weapons stay K10.

## Method

Generators live in `tools/assets/k12-hero/`. Armour is designed as 2D outlines (filleted corners plus an edge
profile: rolled lip, a panel groove parallel to the edge, crowned field) and conformed onto an anatomical target
along planar / cylindrical / spherical rays (`kit.plate`), then given a real wall (solidify) and a rolled chamfer.
Plates overlap and stand off the woven undersuit, so seams are real shadows, not painted lines. The close-up
source and the game mesh come from the same descriptions (`high` switch: dense profile rings, three-segment
chamfers, fasteners, markings, tread lugs only in the close-up).

## Helmet options (rendered: `artifacts/nextgen/k12-work/helmet/sheet.png`)

1. **Keel visor** — a dark pressure skull under brow, crown halves, cheeks, mandible and rear plates; a wide
   wrap visor sunk ~2 cm behind the plate faces inside a gunmetal bezel; the luminous keel light sunk between two
   gunmetal keel walls; right-temple sensor cluster with three lenses; breather slats on the mandible.
2. **Filter jaw** — narrower visor, split jaw meeting at a forward filter canister, twin crown rails.
3. **Hooded optic** — heavy projecting brow over a slit visor, squarer mandible.

**Chosen: 1, Keel visor.** It keeps the Crown-keel identity the UI already names ("CROWN–KEEL / BREACHER"); the
wide framed visor is the strongest focal glow for key art at a low camera; the single keel light stays readable
from the top-down camera. Option 2's twin rails read as floating stripes and its canister evokes a gas mask;
option 3's slit hides the visor glow that the title needs as its focal point. All three avoid the egg: the
silhouette is built from separate plates with seams.

## Body language

Heroic stylised proportions on the retained skeleton: broad chest plates split by a gunmetal sternum keel with a
thin light (echoes the helmet), ribbed abdominal bellows under two overlapping abdominal bands, gorget collar,
utility belt with buckle and pouches, codpiece and thigh-weighted tassets; layered pauldron (cap + lames) instead
of a balloon; outer upper-arm plate, two-piece vambrace, wrist cuff, elbow and knee hinges; thigh front/side
plates, knee cop, shin greave, calf plate; boots with rubber sole and tread, graphite upper, ceramic toe cap,
gunmetal heel counter, ankle hinge and instep strap with buckle; gloves with separate lofted phalanges, each
carrying its own dorsal plate, and a back-of-hand plate.

Rigs: Breacher hazard-striped oversized left pauldron, accumulator vessel between two hydraulic rams, ram
gauntlet; Cryo two dewars with insulation bands, valves, gauges, corrugated coolant hoses to the forearms, frost
collar; Pyro gunmetal right heat shield, two fuel cells, finned exhaust stacks with temper discolouration, fuel
lines, heat apron; Arc slim pauldrons, capacitor bank with insulators, two brass-wound coils, antenna forks with
glowing tips, open gauntlet coils.
