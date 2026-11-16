# P11 infested, maintenance and containment assets

Original MIT geometry. Rebuild commands:

```sh
blender -b --factory-startup -P tools/assets/p11-set-pieces/infested.py -- --render --modules
blender -b --factory-startup -P tools/assets/p11-set-pieces/maintenance_containment.py -- --render
```

`cpu_preview.py` uses four CPU threads and16 samples without device discovery. Initial Metal previews stalled under shared host load; stopped only these task-owned processes before restarting CPU previews. No browser processes launched by this modelling subtask.

All models use shared named finish batches, geometric normals, vertex AO/curvature/wear and emissive material zones. The final export adds one shared512² tangent normal atlas perpack, baked selected-to-active from disposable three-segment geometric bevels and subdivided/displaced membrane sources. Original UVs are packed across each pack; COLOR_0 and emitter zones survive. Each atlas uses1,398,101 estimated RGBA8+mipmap bytes; Low may omit normal sampling through the main runtime owner. No extra high-resolution geometry ships.

## Actual beauty inspection and corrections

Opened all six initial hero renders. Workshop machine had a readable cutting throat and feed bed but growth was buried in its metal body. Moved the growth mantle to front and crown surfaces, then corrected exposed root ends to join the crown mantle. Kept the tool/spindle throat clear. Brood plenum initially buried its eggs in an oversized growth blob and had apparently detached straight grille bars. Reduced growth, raised eggs, replaced bars with bent strips anchored in the mouth roof, added top cooling grille, fasteners and airway ID. Opened revised renders of both.

Pump initially had unconnected return-pipe ends and a floating flow terminal. Added deck receiver sockets and a terminal pedestal. Winch gained brake lock bolts and linkage, a terminal and gearbox handle, and its stencil moved onto the actual top face. Emitter and ring first passes were too simple: plain repeated posts and a torus. Added forked optic crowns, calibration hatches, conduit returns and numbers to the emitter; segmented gasketed shield sectors, clamp locks, identification plates and hydraulic lines to the ring. Opened revised beauties. Emitter crown was cropped by the default camera; the final render uses1.18 framing scale and was opened to verify full bounds.

## Workshop room review

Opened all five native room-tour frames and kiting02 from `p11-standard-round1-fixed`, then all six exact480 reductions. Opened matched E10 native tours02 and04 from the E10 worktree. First placement in the north lathe obstacle was almost entirely outside the gameplay crop; oversized legacy overhead bridges still dominated centre views and rear04 was essentially unchanged. It was not a successful first room round.

Moved the unique machine to the east gantry solid at(1200,340), rotated90 degrees at1.8 scale. Its transformed bounds remain inside the existing160×280 obstacle. Replaced the corresponding generic source. Added a distinct low repair bench, roots and egg clutch to the existing southern workbench obstacle; bench at.85 scale is.86m high. Removed the generic workbench to avoid overlap. Round2 five native captures were opened: the east machine remained outside the useful view. That placement also failed. A proposed free-standing north-east island was then rejected against the live final partition map because it pinched the gantry doorway. The revised grounded machine attaches to the tool-gallery separator at(610,266), rotated90 degrees with depth compressed to.65. Its footprint stays inside a new46-unit-deep wall-backed collider [584,197,46,143], leaves246 units of tool-gallery aisle, and clears the R144 fight circle. Cutaway is disabled for this grounded shallow machine. Actual next-round captures must establish visibility; no claim of success is inferred from coordinates.

## Placement and retained structures

One authorized presentation-only static collider was added for the wall-backed Workshop mill, within the48-unit depth allowance. No gameplay systems or rules changed. Infested and maintenance placements use the existing readiness/batching/cutaway owner. Coolant replaces first obstacle's generic pump. Shaft winch sits immediately inside the west shaft curb at(420,330), supplementing retained lift guides/counterweight. Shield emitter replaces the named northern backing housing (lead integration hides it). Annulus ring rests over the retained sealed core roof; the sealed core and story equipment remain owned by their existing builder.

## Limits

Room readability and final performance depend on the lead's serial captures and benchmark. Shader compilation, per-room draw counts and preparation time are not certified by Blender renders. Growth remains deliberately coarse and dark at game scale; it is the weakest sculptural part of this set and should be judged in native room captures.

## Normal atlas pilot and production rebuild

`normal_atlas.py` was piloted entirely under `/private/tmp/p11-normal-pilot/` and `/private/tmp/p11-normal-pack/` before production outputs changed. Opened the512² pump normal image: curved collars, bolt lands and edge rounding produce spatially varying tangent normals. The full maintenance pilot GLB is1,446,272 bytes versus605,072 without normal UVs/maps. Its atlas is347,667 bytes,154,693 texels differ from flat tangent XY by more than.025; bake3.738s and local Blender PNG decode51.322ms on the shared host. These local decode numbers are not browser readiness claims. The infested production rebuild is1,154,752 bytes with a355,959-byte atlas; bake4.958s and local PNG decode20.019ms. No preview, E9 or runtime files were silently inferred to be verified by those pilots.

Integration: `p11lib.export(..., normal_atlas=True)` bakes512² by default and supports explicitFalse. E9 clinical/security/industrial/structure exporters call the same helper. Runtime must allow only validated normal maps, retain UVs and key textured material/cutaway buckets by pack+finish; the lead owns those changes. Shared texture and image retirement remains with RoomModelCache.

The first normal bake used too wide a projection cage and visibly damaged touching cable coils. Tightening the cage to.0025 fixed the winch. Ring triangular seams persisted in an exact merged+tinted no-normal control, proving they came from coplanar/intersecting geometry rather than the atlas. A temporary exploded-component baking experiment produced no visual benefit and was removed. Raised ring clamp crowns and identification plates, and moved sector shields radially clear of the torus to fix the actual intersections.

Final production receipts: infested GLB1,131,560 bytes, atlas332,765 bytes,137,486 non-flat texels; bake2.043s/local PNG decode7.588ms. Maintenance GLB1,423,940 bytes, atlas324,966 bytes,145,046 non-flat texels; bake1.895s/local decode6.068ms. Both remain below the2MB decoded-file cache cap. Opened final tightened-normal Workshop, winch, emitter and corrected ring beauties. Ring shield panels now sit outside the ring and clamp crowns avoid coplanar surfaces; final image is materially cleaner. These receipts do not certify browser room preparation or GPU frame time.
