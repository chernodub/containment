# K11 Lantern Brood creatures

Original MIT creature art for the five enemy families, rebuilt with `sh tools/assets/k11-creatures/rebuild.sh`.

- `sdf.py` numpy signed-distance sculpting kit (round cones, ellipsoids, chitin `Plate` shingles with growth rings, tubes, noise) and OpenVDB meshing.
- `species.py` shared anatomy: shingled mantle, lantern organ, sinew-strung limbs, crescent blades, hooks, eye rows, elite crest spines.
- `crawler.py`, `brute.py`, `stalker.py`, `spitter.py`, `carrier.py` caste sculptures (`body`, `elite`, optional `boss` parts).
- `build.py` per caste: VDB high mesh -> vertex-colour zones -> decimated game mesh -> weights from the sculpture's bone tags -> smart UV -> Cycles bakes (base via emission, normal, AO folded into base, glow) -> GLB via `contract.py`.
- `contracts/*.glb` stripped legacy skeleton + clips (Unvanquished, CC BY-SA; see public/asset-credits.html). `reference/*-volumes.json` per-bone extents of the retired meshes, used only for limb ends.
- `sheet.mjs` contact sheets for review.

Design space = skeleton space with Z multiplied by the caste `ASPECT`; the runtime reads `k11Aspect` from the mesh node extras so in-game height = collider-fitted horizontal scale × aspect.
