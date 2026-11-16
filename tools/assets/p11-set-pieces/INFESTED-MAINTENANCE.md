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

## Mandatory craft second pass (supersedes the first beauties)

The lead/user rejected the first mill as three boxes, a generic blob and cone spikes. That rejection was justified. The second pass rebuilds its recognizable mechanical assembly: splayed casting and leveling feet; tapered column with cast webs and ground ways; knee/saddle/lead screw; thin T-slotted work table; open chip sump with drain and rolled lips; ram access door; swivel flange, quill, chuck and end mill; finned motor with terminal and cable gland; articulated pendant; burst hinged service hatch and routed coolant return.

The infestation now draws from K11's species design. Pitted resin crust is evaluated as a displaced/ridged SDF with subtracted cavities, polygonized through OpenVDB and decimated. Mantle plates use closed structured lens meshes with offset growth ridges, chipped trailing edges and narrow bone rims. The first SDF plate reduction tore into facets; it was rejected. A subsequent separate ridge sweep looked like wires on pancakes and was also rejected. Integrated surface ridges and tapered shingle outlines replace it. Muted umber shells, wine/mauve membrane and small violet seams avoid danger red/orange. Three ribbed eggs moved to a visible right-side cradle; taut strands connect the burst-panel mantle to the base. Every current pack is rebaked for AO/curvature and actual tangent normals.

Opened each successive mill beauty and the rebuilt brood-plenum and module renders. The plenum now has a folded elbow roof, bolted mouth/flanges, extraction spigot, hinged roof service hatch, and anchored bent damper leaves around the clutch. The root saddle, egg clutch, resin web and bench infestation all use the same new family. Module budgets remain1500 triangles, including the eggs after reducing only their radial tessellation. Final room-scale acceptance remains with the lead's actual next captures; these beauty reviews do not substitute for them.

Maintenance second pass replaces the twin featureless drums with stepped volute castings, separate finned drive motors, open channel skid, coupling guards, terminal glands, suction elbows and connected instrument lines. The first pass still capped the suction bells; inspection caused the deck return elbows to be added. The winch now has A-frame castings, split bearing caps/grease nipples, a continuous helical rope, routed cable ends into fairleads, hydraulic brake caliper and shaped reduction case with a hinged hatch. The emitters have bolted gussets, capacitor cans/end collars, busbars, access hardware, ground glands and physically recessed focusing lenses; inspected vent overlaps were fixed. The ring gained keyed hydraulic supports/tie rods, bracing, lower cable race, insulated jumpers and removable sector fasteners. All four revised beauties were opened, including the corrected pump/winch and final emitter/ring renders.

The maintenance pack crossed the exact2,000,000-byte cache cap during this work. `compact_uv.py` now writes native glTF2 normalized UNSIGNED_SHORT UVs, preserving positions/normals/colors/images. Maximum error is0.004 texel at512². Three's checked-in loader supports normalized attributes and P11 batching retains them. A compacted production pack was successfully imported in Blender (33 meshes, UV range0.0064393–0.9935607), with no importer errors. This is a production representation change, not a new test or gate. The rebuild calls it automatically and rewrites the manifest size/hash. No runtime cache limit was relaxed.

## Final second-pass asset/placement receipt

These are P11 source triangle counts, not whole-room measured draw totals. Actor/VFX, legacy dressing, cutaway and renderer batching are measured by the lead's in-game pass. Position columns use game units (32 units/m); elevation uses metres.

| Room | Hero triangles | P11 instances High / Low triangles | Hero centre x,z; scale; elevation | Pack GLB bytes | Normal GPU estimate |
|---|---:|---:|---|---:|---:|
| Infested Workshop | 11,088 | 15,018 / 12,386 | 610,280;.85×.75×.65;0m; yaw90° | 1,767,052 | 1,398,101B |
| Swarm Junction | 10,170 | 13,402 / 10,170 | 292,235;2;0m | same infested pack | 1,398,101B |
| Coolant Plant | 10,088 | 10,088 / 10,088 | 150,150;1.4;0m | 1,923,476 | 1,398,101B |
| Service Shaft Landing | 5,950 | 5,950 / 5,950 | 420,330;1.1;.15m | same maintenance pack | 1,398,101B |
| Shielding Gate | 5,028 | 5,028 / 5,028 | 704,80;1.6;0m | same maintenance pack | 1,398,101B |
| Containment Annulus | 7,552 | 7,552 / 7,552 | 800,520;1.5;1.2m | same maintenance pack | 1,398,101B |

Low uses the existing `highDetail` draw-range omission for separate root saddle, egg clutch and resin web instances. The mill, its rear bench and the brood plenum remain. Embedded hero sculpture remains part of its shared finish meshes; it is not a separate Low mesh. Normal maps remain resident on Low; the current quality owner does not dispose or remove these maps. Memory is per unique lazy-loaded pack, not per instance. No shader recompilation or geometry replacement is introduced by these flags. Grounded Workshop mill remains cutaway=false; other heroes use existing cutaway=true. Its46-unit wall-backed collider and246-unit adjacent aisle remain unchanged by remodelling.

The lead inspected the final mill native hero/game-angle candidate and accepted its functional layout, visible egg cluster, tapered shell rings and ragged burst panel for the next actual room-camera review. A final nest game-angle inspection exposed occluded eggs; two damper leaves were shortened and the clutches moved forward, retaining the same footprint and16 additional triangles from final mesh triangulation. All final native model images are in `artifacts/nextgen/p11-final/beauty/`.


## Round4 Workshop actual-room review and next correction

Opened all five native `p11-standard-round4/room-tour-infested-workshop-01..05.png`, native kiting02, and all six corresponding exact480 images. The mill is recognizable in03, but02 and combat02 crop most of its useful table/head off the upper edge. The old overhead bridges still dominate01/02/05.04 remains mostly floor and an enormous retained legacy growth plate; this is still a weak view. Merely declaring the hero placed would overstate this round.

Next placement refinement changes only the existing mill transform: centre610,280, local scale(.85,.75,.65), yaw90 degrees. Its exact horizontal bounds become x592.36..629.55,z226.18..339.30, wholly inside the existing [584,197,46,143] collider and the wall's340-unit end. Height becomes2.204m. This moves the north tip23.5 units toward the fight view and reduces upward projection while preserving every collision lane and the fight circle. Recommended lead-owned change: retire only the legacy workshop-tool-bridge at780,620 in OriginalRoomInteriors; the modelling child did not edit that shared file. Next actual captures must establish whether this correction solves composition; no speculative pass is claimed.
