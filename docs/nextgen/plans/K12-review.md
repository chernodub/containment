# K12 render → look → fix log

Review images: `artifacts/nextgen/k12-work/review-{1..4}/sheet.png` (four rigs: three-quarter close-up, back,
in-game-size), `review-N/breacher-face.png`, helmet sheet `artifacts/nextgen/k12-work/helmet/sheet.png`, in-game
capture `artifacts/nextgen/k12-r5/`, close-up hero `artifacts/nextgen/k12-work/portraits/`.

**Helmet sheet.** First render had spiked brow/crown plates (my ring fill assumed star-shaped outlines; crescents
broke it) and an inverted boolean cutter erased the mandible. Rewrote the plate fill as a constrained Delaunay
triangulation and offset edges without mitre amplification. Second sheet: option 1 Keel visor chosen (see
`K12-design.md`); fixed a floating keel light (now sunk between two keel walls), a buried ear hub, a hanging grille
slab and a stray antenna; cut the game helmet to ~3k triangles.

**Round 1 (four rigs).** First render was black: cylindrical outlines mixed degrees with metres, so insets and
fillets blew plates out to 100+ m; solidify even-offset also spiked on folds. Fixed with an isotropic projection
wrapper and plain offset. Then: pauldrons far too small — rig identity, K10's main strength, was gone; paint washed
out pastel; body 23.7k triangles.

**Round 2.** Larger layered pauldrons, deeper rig paint, undersuit lofts unsubdivided in the game LOD (22.0k max).
Close-up still read clean and toy-like: overexposed paint, no visible wear, plain chest; a rig-coloured gorget ring
read as a floating torus.

**Round 3.** Removed the ring; exposure −0.7; stronger edge chipping and grime; stencils (`07`, `CK / KEEL`, rig
codes on pauldrons), pectoral vent banks, corner fasteners. Big step: the chest reads as engineered armour. The
back still looked bare — traced (scene ray casts + a body-only render) to a back plate that was simply too small
and covered by the rig module, not a bug.

**Round 4.** Pauldron dome broken by a raised gunmetal ridge; larger back carapace, lumbar plate and hamstring
plates so the top-down camera (which mostly sees the back) gets ceramic, not undersuit. Baked and exported; one
in-game capture (calm Breacher, heavy Cryo, Awakening Bay): armoured read, rig colour on shoulders/back, clean
deformation in the run cycle; the suit reads a little darker overall than K10.

**Close-up hero (round 5).** Blender's armature-modifier path disagreed with the glTF bind convention (limbs flew
apart); the close-up now goes through the same contract writer/importer as the game GLB, with per-face material
roles carried in COLOR_0. Procedural detail was 6.8× too fine (object space in source units) — fixed with a
coordinate scale. Gloves: +X flexion closes the right hand on the grip; the left glove needs −Z flexion (mirrored
bone axes). Final: `public/assets/portraits/u10/*-bust*` and `artifacts/nextgen/k12-final/hero-layer-2560.png`.
