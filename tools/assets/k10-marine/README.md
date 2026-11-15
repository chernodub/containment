# Original K10 marine and arsenal

Run `tools/assets/k10-marine/rebuild.sh` from any working directory. Requires Blender 5.3 on PATH; scripts use Blender's bundled Python only. Output: the six production GLBs, baked PNG source maps in `bakes/`, and review turnarounds in `artifacts/nextgen/k10-final/`.

`marine.py` authors the shared pressure shell, rigid plates and four removable dorsal cassettes. `weapons.py` authors the five weapons and preserves the established hand/muzzle coordinate contract. All new mesh geometry, materials, textures and generating code are original work under the repository MIT license.

`marine-contract.glb` deliberately contains only the existing 123 skeleton nodes, 122 joint inverse binds and seventeen animation clips. These are retained Unvanquished data, **not** original MIT artwork. Their CC BY-SA attribution and distribution terms remain in `public/asset-credits.html`. `contract.py` appends the new meshes without round-tripping or modifying skeleton or animation values. Face/control bones remain present and mostly unweighted so animation-only GLBs from M10 can still merge by name.

Flat ceramic/structural/fabric zones feed one shared 1024² marine atlas set; AO and pointiness curvature come from authored geometry, tangent normals include Cycles bevel detail. Each weapon uses 512² base/normal maps, with AO/curvature source bakes retained in the weapons review output. Variant skins remain separate, with only one rig visible at a time. No procedural runtime rig overlay is required.

Blender’s multi-object UV packer can choose slightly different island placements between headless runs. The end-to-end rebuild was run successfully; geometry, normals and skin-weight triangles were identical, and all five weapon GLBs were byte-identical. The shipping marine is the exact frozen export used by the retained native captures/benchmarks/campaigns (SHA256 `3488b67dd4d4db5de5526cd36860d4c73d44e4514d8ec71e40aa832fd12bf395`). This does not change the byte-preserved skeleton/animation contract.
