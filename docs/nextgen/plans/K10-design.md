# K10 — Split-crown marine / cassette arsenal

The marine is a shipboard containment technician in a powered pressure shell. Two ownable features carry the top view: a split crown helmet with an offset brow bridge and a dark longitudinal channel, and a dorsal cassette locked into a squared, exposed carrier. No rib helmet, military cape, oversized spherical pauldrons, skull face, or borrowed game armour proportions. The existing bone names, hierarchy, rest transforms, sockets and seventeen clips remain intact; original plates follow single bones, flexible joints blend between their two neighbours.

The shared body uses broad warm ivory ceramic plates, blue-grey structural metal, graphite pressure fabric and restrained cyan-white optics. The sternum is a narrow divided keel above a flexible waist. Shoulders are layered trapezoidal shells rather than domes. Knees, boot toes and forearms have readable blunt corners. Shallow bevels, recessed joints, boolean vents and panel insets carry the close-up; large flat material zones carry the 110–140px view. AO and curvature are baked from the authored geometry, with fine high-to-low normal relief where useful; no photographic skins.

- Breacher: a low rectangular back cassette, left ram wedge, paired exposed impact pistons and a reinforced left cuff. Broad, low, asymmetric silhouette; amber cassette slots.
- Cryo: two tall coolant vessels with collars, a finned radiator bridge, insulated shoulder collar and looping supply hoses. Two vertical lobes, ice-blue slots.
- Pyro: squat fuel cells below two splayed exhaust stacks, a broad heat shield on one shoulder, segmented apron. Wide vented V silhouette; orange heat windows.
- Arc: an open induction yoke with two curved emitters and stepped capacitor/antenna fingers, light shoulder insulation. Negative space and a narrow forked crest; violet-white terminals.

Weapons share the cassette suit's bevel language but each has its own top silhouette: short offset-breech pistol; long split-rail rifle; broad twin-port shotgun; open-sided plasma induction fork; hexagonal rocket shroud. Preserve local hand fit and muzzle attachment positions, since live VFX and animation use those contracts.

## Implementation

`tools/assets/k10-marine/` owns rebuildable Blender sources and the retained skeleton/clip contract. `marine.glb` replaces all source meshes, while the retained skeleton and animation data continue to carry their existing CC BY-SA attribution. New geometry and textures are original repository MIT artwork. Runtime changes are confined to mesh loading, authored materials and rig visibility. No changes to motion, room, UI or simulation code.

Root authors body/rig geometry and reviews every rendered delivery. A weapon agent owns its five exports and source script; a material/selection agent owns the K10-only runtime path. Browser work is serial. Baseline and final production captures use the same room fixtures; isolated motion strips supplement native play. Four written render/look/fix rounds are required, beginning with grey blockouts judged at 140px. Build, four unassisted rig campaigns, three-room captures, and ordinary before/after heavy-combat benchmarks supply verification without new tests or gates.

Risks: source skeleton uses non-metric coordinates and contains control/face bones; preserve data through mesh transplantation rather than reauthoring bones. Hidden variant geometry must not inflate runtime bounds or be batched into visible geometry. Armour must leave elbow/hip clearance during twists and crouches. Baked detail must stay subordinate to ink contours, and extra material groups must not erase the draw-call benefit of replacing runtime modules.
