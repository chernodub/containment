# I10 round 1 — UI and eight calm rooms

Reviewer: I10 licensing/UI-world sub-agent. Actual source PNGs were opened through `view_image`, at original1920×1080 and exact480×270 derivatives, from `artifacts/nextgen/i10-round1/`. No browser or computer-use tools, retouching, source edits or new capture was used. Opened-file hashes and dimensions are in `artifacts/nextgen/i10/round1-ui-world-view-ledger.json`. This review covers11 originals plus11 exact480 reductions; it does not claim complete burst or organic-campaign coverage.

## Screens

- `title.png`: main title, primary action and marine/weapon silhouette read immediately at480. At native size controls and continue information have clear spacing, no clip/overlap. The corridor gives depth and the alien silhouette stays subordinate. The cast remains graphic/schematic, especially rigid limbs and simplified helmet; this is a remaining art-standard qualification, not a new integration or accessibility failure. No surgical UI correction identified.
- `complete-fixture.png`: rupture, ship halves, habitat ring and New Earth make the ending unambiguous at480. The headline is clear and native footer actions are not clipped. The ship's flat facets still look illustrated rather than physically modeled; no local correctness defect found.
- `shop.png`: no100,000 maxima; the no-benefit health service is a compact explanatory row, with useful armor/ammo actions below. Native prices, benefit projections and free allocation are legible and no panel clips. At480 the hierarchy survives, while small body text naturally becomes tiny. No new presentation pin should be weakened for this screen.

## Calm room assessment

| Actual native and480 filename | Place/readability result | Remaining qualification / surgical direction |
|---|---|---|
| `combat-calm-awakening-bay.png` | Strongest early room: coherent pod banks, released berth and service lane; cyan marine reads from armor. No near-black field. | A large central clear lane remains, appropriate for movement; avoid filling it with props just to increase density. |
| `combat-calm-residential-gallery.png` | Bed/desk/luggage forms establish habitation and warm practicals contrast with cool transit floor. | Weakest connectedness in this set: furniture sits mostly at top/bottom edges and the center reads as a broad lightly marked corridor. A future improvement should strengthen contiguous cabin thresholds/bulkhead silhouettes within existing reservations, not scatter solids into circulation. Current full-screen view still contains recognizable place-defining architecture. |
| `combat-calm-communal-atrium.png` | Garden, seating and lit wayfinding form a shared social place at480. Warm islands and broad shadow group are coherent. | Repeated wall practicals remain conspicuous, but their warmth is motivated. No body occlusion or urgent local fix found. |
| `combat-calm-armory.png` | Large weapon-issue ring is unmistakable and its interior has authored instrument detail. Marine body and HUD separate cleanly. | Left side remains sparse; the feature is still a machine presented in a hall. Extending existing reserved service connections would help more than loose floor objects. |
| `combat-calm-relay-racks.png` | Equipment frames, cyan contacts and removed covers/cable establish repair/relay use. Marine body stays readable. | Three isolated islands and broad neutral floor still have a showroom quality at480. This is an art-standard shortfall, not proof that the E6 kit failed to load. |
| `combat-calm-infested-workshop.png` | Infestation clearly consumes machinery and crosses human routes; marine is distinct on surviving deck. No near-black room. | Purple mats remain large flat shapes and a horizontal band visually suggests a raised ribbon. File-only reconstruction below confirms the band across legal floor is flush, not overhead/actor-covering geometry. Do not record it as an occlusion failure. Tapering or offsetting duplicate floor connection skins could reduce the ribbon impression at the same draw cost. |
| `combat-calm-containment-annulus.png` | Large clinical circular enclosure, violet hue and lock hardware identify containment. Marine is distinct. | Hero is strongly left-weighted in this calm spawn framing. This image alone does not prove a gameplay safety failure; organic/engaged framing must be judged separately. |
| `combat-calm-overload-floor.png` | Strong climax cue: hot reactor core and orange architectural spill form a clear warm composition at480. Armor retains cyan-white identity. | Core clips to the right by deliberate close framing and is very bright; no sampled HUD/body problem. Keep hostile warnings above friendly/world radiance in combat. |

All eight sampled calm rooms contain recognizable room-specific forms and none reads uniformly near black. This is a sampled visual result, not the all20 value-band audit. Residential/Relay/Armory remain qualified against the premium-place target. No simulation/balance or camera change is requested solely for a calm composition.

## Horizontal Infested Workshop band: source and height diagnosis

The visually broad band around native y200–285 in `combat-calm-infested-workshop.png` is an overlap of flat floor connection layers, **not** the far-edge overhead kit:

- Saved native view/projection matrices project world z8.75m to y219 and z9.0625m to y240. At z8.75, the x0→23.90625m connection spans roughly x−11→2104px, matching the full-width band.
- E6 `e6KitProof.placements` records a23.98625m-wide machine-to-wall trench at `[11.953125,.014,8.75]`, thickness.004m; its max height is.016m. Another trench at z9.0625 runs x0→11.71875.
- `src/render/world/RoomKitDressing.ts` adds the accompanying wide resin path from machine to hull at y.016m and thickness.002m. Its path uses two fixed bends and is merged into `e6-kit-resin`.
- Legacy `src/render/world/ConstructionLanguage.ts` adds a broad dark clipped bridge at fixed y.026m. That layer existed before E6. Its fixed-floor position is below the.085m raised-surface cutoff.

The diagnostic CPU reconstruction loads the four actual GLBs and the existing Workshop obstacle/world/story/kit builders, then scans actual triangles whose centroids are legal floor in z8–10m. Receipt: `artifacts/nextgen/i10/ribbon-diagnostic.json`; scoped run `ribbon-diagnostic.log`,1 test passed. It uses seed1729 rather than the renderer's room-hash seed; the fixed connection heights and reservations are unchanged. Reconstruction omits renderer mood application/static batching and cannot certify continuous camera/actor visibility.

| Generated owner/material over legal-floor stripe | Triangles | Actual min/max world height |
|---|---:|---:|
| Legacy world dressing /graphite | 34 | .0260000005 / .0260000005m |
| E6 kit /conduit | 467 | .0120000001 / .0202500001m |
| E6 kit /resin | 408 | .0142679494 / .0177320503m |

No sampled candidate triangle is above.085m. The band can alter floor value behind an actor, but cannot geometrically hide a standing body as an overhead would. The above numbers should not be promoted to an every-actor optical proof.

Suggested surgical visual improvement if the lead rejects the flat ribbon: in `RoomKitDressing.ts`, offset the second bend and vary/taper width of the additional infested machine→hull membrane where it duplicates the legacy bridge. Keep the complete layer below.024m, within current supported deck clipping, merged into the same resin draw; do not change obstacles/hitboxes or remove actor-safety assertions. Avoid adding vertical volume over circulation. No production art was edited by this reviewer.
