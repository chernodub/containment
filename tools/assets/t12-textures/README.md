# T12 shipping textures

Prerequisites: Node, macOS `sips` (image resizing), Khronos KTX-Software 4.4.2 `toktx` on PATH (or `TOKTX=/absolute/path/toktx`). KTX is an offline Apache-2.0 tool, not an npm/runtime dependency. Three's Basis transcoder is self-hosted; notices are under THIRD_PARTY.

After generating new assets and running the existing geometry packing command:

```
node tools/assets/i11-models/optimize.mjs
node tools/assets/t12-textures/pack.mjs
npm run build
```

Alternatively preserve source GLBs in a separate folder and run `node tools/assets/t12-textures/pack.mjs /absolute/source/models`. This is the exact command to reapply after the creature modelling stream updates its source GLBs. The input must contain all eleven uncompressed-image GLBs; already converted KTX2 input resolves its offline source cache (see below). Outputs replace only eleven actor/weapon GLBs and their `plain/` fallback counterparts, plus self-hosted transcoder files. No kit/floor/UI art is rewritten. Offline hero close-up sources are not inputs and remain 2k.

The image-only GLB writer preserves mesh/skeleton/animation/meshopt byte streams and JSON contracts. It removes old image buffer ranges, relocates buffer-view offsets and compressed-stream offsets, appends aligned replacements, and attaches KHR_texture_basisu. Plain files have resized PNG images and no Basis extension. `packing.json` records encoded bytes and full mip estimates.

Marine colour is 1024; detail/AO/emission 512. Small crawler/stalker maps are capped at 512; larger castes use 1024 colour and 512 detail/glow. Weapons use 512 colour (pistol 256), 256 normals. At a 110–140px marine height these provide considerable UV density headroom; visual comparison remains the acceptance criterion. Normal maps and marine colour use UASTC quality 4 with lossless Zstd; other maps use ETC1S quality 255, effort 5. No sampled maps are dropped or repacked into semantically incompatible channels.

`node tools/assets/t12-textures/inventory.mjs [output-directory]` creates the original folder inventory. It is a superset of runtime residency, not a runtime memory measurement; RGBA8 estimates apply only to PNG/JPEG decoded textures. Unknown dimensions are null. External image URIs are not resolved.

Re-running in place is supported: generated PNG-image GLBs refresh the offline source cache at `artifacts/nextgen/t12-source-models/`; already-KTX2 shipping files use that cache. On a fresh checkout the original pre-T12 source revision `abec3bca71530aec5b40e90dbe95dee9d25371a7` supplies unchanged assets through `git show`. After a modeller changes an asset, regenerate that source before conversion on a fresh machine (or pass the complete source directory). The cache is build source, never copied to public/dist; this keeps the 2k marine source out of the game. Do not delete the cache when retaining uncommitted modelling sources.

Run from the repository root. Colour/data encoding is selected from glTF material slots, so regenerated source image names may change without misclassifying normal or ORM maps. Inputs currently require embedded PNG bake images; ambiguous use of one image in both colour and data slots is rejected. This matches the authored Blender generators. The texture command preserves existing geometry packing; run the existing I11 geometry step first when a modeller exports fresh uncompressed geometry.

`node tools/assets/t12-textures/summarize.mjs` regenerates the tables from retained packing receipts, source-image inventory and the before/after native breakdown cohorts; it does not run a browser. Its model download columns include unchanged animation-only GLBs.
