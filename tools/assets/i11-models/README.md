# I11 actor packing

Run `sh tools/assets/k11-creatures/rebuild.sh`, then `sh tools/assets/k12-hero/rebuild.sh`, then `node tools/assets/i11-models/optimize.mjs`, then `npm run build`. It uses the existing MIT glTF Transform and meshoptimizer development dependencies (notices in `THIRD_PARTY/`). The runtime uses Three.js's bundled meshopt decoder, covered by the retained Three/meshoptimizer MIT notices.

Positions, joints, inverse binds and animations retain full precision. Normal/tangent/UV/weight attributes use 16-bit quantization, then all buffers receive lossless meshopt compression. Deduplication shares identical resources; only orphan accessors are pruned. Named rank skins are preserved. Texture image payloads remain byte-identical and shared between ranks. This geometry-only step leaves texture storage unchanged; the T12 shipping texture step below provides the reviewed KTX2 conversion and fallback set.

The size receipt goes to `artifacts/nextgen/i11-final/asset-sizes.json`. Repacking an already packed file is supported, but before values then describe that packed input; rebuild generators first for a source-to-packed comparison.

T12 adds the shipping texture step: after geometry packing, run `node tools/assets/t12-textures/pack.mjs` (requires offline Khronos `toktx` and macOS `sips`). See `../t12-textures/README.md` for source caching, exact regeneration commands, fallback files and encoder settings. This subsequent step replaces embedded images with right-sized KTX2 and writes resized PNG fallback GLBs; geometry packing itself still preserves source texture payloads.

## PERF13 skinned LODs

After the geometry and T12 texture steps, run `node tools/assets/i11-models/lod.mjs`.
It appends 30%-target meshoptimizer `simplifyWithAttributes` index streams to both
shipping KTX2 and `plain/` PNG actor GLBs. Existing BIN data stays byte-identical:
positions, normals, UVs, skin indices/weights, inverse binds, animation clips and
compressed texture payloads are never rewritten. Low geometry shares all original
vertex accessors and materials; only its index accessor is new. This deliberately
saves submitted triangles without duplicating or compacting skin vertex buffers.
Seam-preserving meshoptimizer defaults are used: no `Permissive` flag, normal
weight 1, UV and ordered skin-influence weight 10, with a 1% attribute-error cap.
Normal/UV/ordered skin-influence errors participate in simplification. The 30%
target was aspirational in the historical index-only experiment: constrained creature results retained 84.5–96.7%
of original triangles; marine body retains 52.0% and rigs 75.5–84.0%. The emitted
receipt records actual ratios and errors; silhouettes still require native review.

Creature base-rank meshes receive low siblings; elite/boss meshes remain authored.
Marine body and all four rig skins receive low siblings for runtime shadow policy.
Sibling mesh/node names are `<original-name>__lod_low`. Node extras include
`perf13LOD: "low"`, `perf13SourceNode`, `perf13SourceMesh`, and `perf13Purpose`
(`distance` for creatures, `shadow` for marine). They borrow the same skin and
rest transform. Runtime must extract their geometry and remove/hide the siblings
before preparation or drawing; their presence does not itself select a LOD.
Animation tracks continue targeting the original authored nodes only.

The script's asset metadata stores original array/BIN lengths so rerunning it
replaces its previous appended LODs, without simplifying an existing low mesh.
`--models=<directory>` selects an equivalent main/`plain/` source pair;
`--out=<receipt.json>` selects the metrics destination. Defaults retain the receipt
at `artifacts/nextgen/perf13-final/lod-assets.json`. Texture repacking after this
step can restore T12's cached pre-LOD source, so always regenerate LODs last.

If the T12 source cache is absent or stale, retain current committed geometry while
recovering original PNG images before repacking:

```
node tools/assets/i11-models/texture-source.mjs /private/tmp/perf13-png-source - HEAD
TOKTX=/absolute/path/toktx node tools/assets/t12-textures/pack.mjs /private/tmp/perf13-png-source
node tools/assets/i11-models/lod.mjs
```

The recovery helper takes geometry, node/skin/animation contracts and meshopt
streams from the specified Git revision. By default (`-` source), PNG payloads
come from that revision's committed `plain/` fallbacks, retaining current shipping
pixels without upsampling. An explicit PNG source directory may replace `-` only
when its art is verified current; the helper refuses mismatched named images. This avoids silently restoring
older mesh geometry when the texture packer's fallback source predates geometry
repacking. Retain `source-receipt.json` with the final packing receipt.

PERF13 final delivery retains the committed KTX2 and PNG payloads exactly. The
requested packer was executed, but its stale-cache regenerated creature images
were not shipped; committed actor GLBs were restored before the final LOD append.
See `artifacts/nextgen/perf13-final/texture-pack-disposition.json` and
`final-authored-preservation.json`. The experimental local T12 source cache was
removed during final cleanup. Recreate a packing source with the helper above;
committed fallback PNG pixels are shipping-size inputs, not a replacement for the
original Blender bake sources.

## PERF13 Brood growth kit

Run `node tools/assets/i11-models/brood-lod.mjs` after rebuilding or texture-packing
the Brood kit. It appends `<asset-name>__lod_low` siblings to both
`public/assets/brood-growth/brood-growth.glb` and `brood-growth-ktx.glb`, retaining
all original buffers/images and source node transforms. Its receipt is
`artifacts/nextgen/perf13-final/brood-lod-assets.json`.

Only the opaque `brood-growth` material is simplified to a 50% index target.
`brood-lantern` and `brood-pod-glow` primitives retain exact original indices:
the world loader derives connected lamp positions and areas from their triangles.
All normals, vertex colors, UVs and normal-atlas bytes remain authored. The whole
kit changes from 39,300 to 33,284 triangles (84.7%) because the emissive partitions
stay full detail and seam-preserving defaults, UV/color weight 10, normal weight 1
and a 1% attribute-error cap may stop reduction above the 50% target. The sibling is a multi-primitive Group where the source is a
Group; runtime should select the sibling by the asset root name before baking
room-owned geometry. Placements and native collisions are unaffected. Metadata
allows idempotent replacement of previously appended kit LODs.

## PERF13 atlas-rebaked creatures

`node tools/assets/i11-models/atlas-lod.mjs --asset=dretch` builds a creature LOD
from committed HEAD geometry and current committed PNG fallback maps. Meshoptimizer
retains original vertex positions and skin rows, but the low mesh receives a new
512² atlas. A temporary Blender mesh welds coincident positions for UV-chart
connectivity only; its per-corner custom normals remain the original source-row
normals. Selected-to-active EMIT bakes transfer base color and emissive maps, and
NORMAL transfers the source normal-mapped shading into the new low tangent frame.
The original material's normal strength is included in the bake, so low normal
scale is 1. No original AO/ORM texture exists on the current creature materials.
UVs convert between glTF and Blender's V conventions explicitly.

Low UV seam vertices duplicate exact original POSITION/NORMAL/JOINTS/WEIGHTS
records. High accessors, geometry, materials, textures and animations remain
byte-identical to HEAD. Appended low material `<full-material>__lod_low` advertises
`perf13SourceMaterial` and `perf13NormalScale: 1`; its map, emissiveMap and normalMap
may be borrowed by the runtime's existing full-material hooks. Main files receive
KTX2 maps with the existing UASTC-normal/ETC1S-color encoder settings; PNG fallbacks
retain the same baked images. No runtime shader or simulation content is generated.

`--bake-only` retains raw bake inputs/outputs, source-row/UV correspondence and
host-load/timing receipts under `artifacts/nextgen/perf13-final/atlas-lod/<asset>/`
without changing shipped files. Other castes must remain bake-only until a native
crawler prototype capture passes review. Run this after the ordinary index-only
LOD generator: a later `lod.mjs` invocation intentionally restores/replaces the
asset's appended LOD and would discard the rebaked prototype. Original art remains
MIT under the repository license. Native comparison is mandatory: cage misses and
Mikk/derivative tangent-frame differences cannot be certified by asset metadata.

### Authoritative final creature LOD rebuild

The reviewed atlas route supersedes the index-only creature experiment. For all
five creature assets, finish with this command (after any source geometry/texture
packing and the optional marine/Brood index-only steps):

```
for asset in dretch basilisk marauder dragoon tyrant; do
  node tools/assets/i11-models/atlas-lod.mjs --asset="$asset"
done
```

Never run `lod.mjs` after that final loop. The atlas generator strips its own
previous append using saved original array/BIN lengths, so a committed atlas GLB
can be regenerated without accumulating nodes, low materials or textures. It also
recognizes the preceding index-only actor append. `--source-revision=<git-ref>`
selects a specific committed source; default is HEAD. Prepared maps may be
published with `--publish-prepared` only when the source SHA still matches.

Final source triangle counts are 7,600 / 8,800 / 9,500 / 10,998 / 11,500; atlas
LODs contain 2,258 / 2,630 / 2,836 / 3,290 / 3,442 triangles respectively. All three
low maps are 512² with ten mips. Color/emissive use sRGB ETC1S quality 255/effort 5;
normal uses linear UASTC quality 4 with Zstd 18. Low normal scale is 1. Original
high textures remain resident, so these new maps add memory: see the final
`atlas-lod/summary.json` payload estimates rather than claiming memory savings.
Original source and generated low art use the repository MIT license; existing
meshoptimizer/Three/Basis notices remain unchanged. No new runtime dependency or
third-party asset was introduced.

The crawler atlas prototype passed parent native and 480-pixel comparison; the
prepared stalker, spitter, carrier and brute atlases were then published using the
same pipeline. Final original-data preservation covers all fourteen modified actor
and Brood GLBs in `final-authored-preservation.json`.
