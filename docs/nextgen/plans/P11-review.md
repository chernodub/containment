# P11 review — incomplete initial study

2026-11-16. Merged the supplied modelling library and Relay candidate. This is not one of the four required complete standard-room rounds: no in-game placement or captures have been completed.

## Relay initial Blender inspection

Rebuilt with Blender 5.3, four render threads. Opened both 1280×960 game-angle and hero-angle PNGs in `artifacts/nextgen/p11-final/beauty/`.

Budget correction: reduced the six fan wells from 18 to 12 radial segments and the six shrouds from 16 to 14 segments. Export fell from 12,090 to 11,850 triangles, below 12,000. Nine material zones; zero texture bytes. Fan guards, blades, doors and trunk paths retained.

Look: front blade rows, pull lips, handles and paired status lights communicate server equipment. Crown fans and cable connections give useful top-down secondary forms. Pale corner frames and caps remain too dominant; three near-identical cabinets make the silhouette repetitive. Side panels remain broad and clean. Further design revision required before placement approval.

Outstanding: Residential and Workshop studies, four complete render/look/fix rounds including native and 480×270 room tours and kiting comparisons, all twenty-room rollout, kit families and infestation.

## Continuation — standard round 1 (2026-11-16)

Merged nextgen, npm ci and build passed. Captures: `p11-standard-round1-fixed`, 15 tour +12 native G6 kiting PNGs, exit0. Failed initial capture records retained: shared model cache rejected >3 URLs; fixed by bounded per-pack lazy caches. The earlier baseline completed15 tours but is not a clean full before batch because dist changed during capture. E10 reference sheets remain the historical comparison.

Opened all five native tours for each standard room plus Relay kiting02. Relay is visibly improved: dark separate cabinets, fan crowns, open card bay and connected overhead tray. North cross aisle still quiet; added a dedicated north-wall patch station inside shallow wall space. Residential hero is absent from all tour views: west nook placement rejected. Move to north gallery edge with authorized static196×38 collider outside fight radius and156-unit west route. Workshop north machine is almost entirely outside frame: move to existing east solid, retain a low rear bench for rear view04. First Workshop growth looked buried; revised exposed saddle and joining roots. These are observed placement failures, not approved final rooms.

All initial P11 pieces use geometric normals plus vertex AO/curvature; tangent normal texture baking is not yet implemented. Room preparation and runtime figures remain pending final measurements.

### Standard round 2 — visible nook, incomplete Workshop, cutaway correction

Opened every native five-position tour plus kiting frame02 in `p11-standard-round2` (27 captures, exit0), then the three exact480×270 E10/P11 comparison boards. Relay is distinctly darker and the fibre ladder is legible; north crosspatch now gives tour03 a rack-wall identity, but sideways hatch faces still need status accents. Correcting those and scaling the short cabinet's blade/cooling heights to its actual shell. Residential nook is finally visible in tours01–03 and05; tabletop objects and drawing wall read as a lived-in space. However kiting02 hides the entire nook, leaving a bare grey collider plinth. Split low furniture from the tall cutaway wall next. Workshop's perimeter machine remains effectively absent from the centre/rear tour: only plate/growth fragments show at edges04/05. This is not accepted as the room's hero placement. Repositioning and checking the old assembly/cutaway ownership next. Actor upgrades from nextgen are visible in the comparison; these are not P11 changes.

Runtime work for next round: shared512 normal atlases baked from disposable geometric high sources, preserving vertex AO/curvature and authored flat zones. Atlas UVs survive merging; finish buckets include pack identity to prevent unrelated atlas sampling. Cached texture ownership remains with RoomModelCache. Low tier omits the secondary service tails through drawRange, without allocating another material or batch; heroes retained.
