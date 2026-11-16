# K11 — The Lantern Brood (species design)

One species, five castes. Ownable anatomy, shared by all castes:

1. **Shingled mantle** — dorsal chitin grows as overlapping roof-tile plates (front over back), each a thick lens with a rolled anterior lip, quiet growth rings and a chipped trailing edge; dark wine membrane shows in the seams.
2. **The lantern split** — the mantle parts along the dorsal midline to expose a ribbed glowing organ with warm sinew lips. Its colour is the caste's danger note and faces the top-down camera: Crawler ember red-orange, Stalker violet, Spitter acid green (the acid vessel), Brute amber, Carrier magenta brood pods. Wind-ups brighten it (runtime).
3. **Sinew-strung limbs** — rigid chitin segments with dark membrane at joints, tendon cords across the elbow/knee, dark claw tips, bone-pale cutting edges.
4. **The off-hand** — every caste's weapon limb is heavier on the right (crawler scythe, brute cleaver, stalker scythe, carrier fore-claw).
5. **Prow head** — low wedge head under a bone-pale prow plate with a keel ridge, rows of small glowing eye pits, hooked side mandibles. No dome, no lipped jaw.

Palette: warm rust/umber/oxblood shells with bone-pale rims and cutting edges, dark legs; far from the white marine and the cool ship.

| Caste | Skeleton | Silhouette | Lantern |
|---|---|---|---|
| Crawler | dretch | low shingled hump, crescent forelimb scythes, six legs | ember slit on the abdomen |
| Stalker | basilisk | lean mantis: keeled head on plated neck, long scythes, raised abdomen + sting, stilt legs | violet slit on the abdomen |
| Spitter | marauder | harvestman strider with high arched legs, downturned mortar mouth | tall acid-green vessel on the back |
| Brute | tyrant | bulwark chest, bone-banded gauntlet forearms, huge hooked cleavers | amber crown seam |
| Carrier | dragoon | broad shingled thorax, raised brood bulb, six arched legs, fore-claws | magenta brood pods |

Ranks: elites add bone crest spines (+ shoulder spikes / plates) and a brighter lantern (runtime); **Brute Warden** adds a bone collar shield, a crown of back-swept horns and forearm spikes; **Carrier Matron** adds a spine crown across the brood bulb and two great pods under bone shields.

Method: signed-distance sculpture in numpy → OpenVDB surface → decimated, skinned game mesh with baked atlas (see `tools/assets/k11-creatures/README.md`). Sculpted in *design space* (vertical × caste aspect) because the game squashes every creature horizontally to its collider; this is what removes the legacy "stilt" distortion while keeping on-screen presence.
