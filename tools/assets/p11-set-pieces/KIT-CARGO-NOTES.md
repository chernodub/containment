# P11 kit/cargo implementation notes

New service kit: ten separately named modules covering trays/conduit, pressure
pipes with blue valve handwheels and gauges, access hatches, transit/stowage cases,
pressure drums, railings, stairs and two dedicated console displays. All modules
are below 1,500 triangles. Stock named finishes merge with room batches; vertex
colours carry AO, curvature wear and part pigmentation. There are no textures.

Beauty review: first cases were too plain; added impact shoes, recessed lid
inserts, rear hinges and latch releases. First consoles had blank sloping tops;
moved the displays to their physical sloped surface and added lower access
panels. Final storage/machinery boards were opened natively and at 480×270.

Freight gantry: initial pale cap and spreader slab hid the engineering. Replaced
with dark structural beam, running rails, wheeled trolley, finned drive motor,
wound lifting drum, terminated conduit, four lifting eyes, open spreader frame,
corrugated roof and stacking sockets. Rear maintenance rail and inspection treads
complete the access story. Final assembly 6,474 triangles.

Breached loading bay: initial regular plate strips did not communicate a tear.
Replaced them with uneven torn pressure-skin silhouettes and exposed fracture
edges around the restrained pod. Final assembly 4,484 triangles. The pod remains
upright and mechanically wedged, not an animated/crush simulation.

Placement helpers: `P11CargoPlacements.ts` puts the gantry inside Freight's
existing 260×108-unit solid and the pod in the established diagonal tear void.
Both use existing cutaways and add no colliders. `P11ServicePlacements.ts` chooses
far-side existing furnishing roofs or wall-backed upper fittings. Its added
hardware does not change simulation solids. Lead owns native room capture,
inspection of these sites, Low selection and final integration.

All four E9 packs received a common manufactured-chamfer/curvature-wear pass,
with crisp sub-centimetre hardware and lower radial tessellation on small
rollers/pipes. Floors/emissive/glass preserve their previous colour treatment;
origins, footprints, authored panel seams, hardware and per-room tint roles stay
unchanged. This is a common finish/geometry pass, not a complete redesign of all
legacy silhouettes. Broad pale caps remain the weakest part of those old packs.

The existing authored scanner/analyser/dish/hoist/tool-bridge/exchanger are
multi-part landmark assemblies and stay below the 12k hero budget; they exceed
1.5k and must not be described as budget-compliant ordinary modules. Repeated
plenum modules were reauthored at 1,476 triangles each, after a collapsed-mesh
experiment was rejected for broken panel shading. Dark door housings and lower cooling louvres remove the pale-appliance read.
New intact doors, fan
collars/vanes, pulls and rooted conduits preserve their industrial function.

Limitations: normals are geometric smooth/custom normals, not baked tangent
normal maps. Existing stock ship-kit loader explicitly rejects textures and
strips UV attributes; this work preserves that contract. No normal-map bake or
runtime atlas support is claimed. No campaign/bench/browser capture was run by
this child because the lead owns the single-browser sequence. `npm run build`
passed with the integrated placement modules during this work.

Beauty directory: `artifacts/nextgen/p11-final/beauty/`. Nine boards: two service,
two cargo, four E9 pack boards and one close plenum detail. Corresponding `-480.png` files preserve aspect
ratio inside 480×270 with side bars. These are art inspection images, not FPS or
in-game visibility evidence. No intermediate directories were created.

Low presentation follow-up: service instances carry `highDetail`; merged finish
buffers append their vertices after all hero/stock vertices. The world quality
setter reduces draw ranges on Low and restores them on High, retaining warmed
materials and buffers. Hero silhouettes are retained on both tiers; this is a
secondary-detail simplification, not separately authored hero LOD geometry.
Small optional service lights do not allocate pool fixtures. Both screen
variants are explicitly selected on known rack/locker roofs (bars in Relay and
Checkpoint; schematic in Transmission and Armory), at 65% scale. Hardware is
omitted when its underlying stock support is replaced by a hero. Runtime capture
and build validation of this follow-up belong to the lead's final sequence.
