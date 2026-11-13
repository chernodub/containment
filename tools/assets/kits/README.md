# CC0 room kit pipeline

Author pages are listed in `build.mjs` and each shipped pack's CREDITS.md. Verify the page and the archive's own License.txt before using a pack. The current 2026-11-13 downloads were obtained through Kenney's ordinary GET page → download-link → signed URL flow with a page referrer and cookies. Historical direct media links returned HTML; no browser or downloaded executable was used.

Download each archive into its own new empty directory below ignored `tools/assets-src/<pack>/`. The retained archive is `pack.zip`. `inspect-archives.py` checks the complete central directory for traversal, symlinks, file count and expansion budgets, records every filename/size, and copies only GLB/glTF/OBJ/MTL/PNG/bin/license data into a new `inspected` directory. It never executes downloaded content. Review the recorded list and original license before conversion. Run both owned scripts from the repository root, outside source directories.

```
python3 tools/assets/kits/inspect-archives.py
node tools/assets/kits/build.mjs
```

The conversion's fixed allowlist reads only selected inspected GLBs and local PNG dependencies, rejects external URLs and paths escaping the inspected source, rejects animation/skins and oversized geometry/images. It bakes author transforms, samples the original palette atlas to five material roles, preserves positions/normals, centers footprint/base, drops all textures/UVs and performs glTF Transform weld/dedup/prune. Output has no extension/decoder or new runtime dependency. Assets are merged by room palette role at preparation time; there is no per-frame model work.

`manifest.json` records source GLB and final GLB hashes, sizes, bounds and triangles. `source-files.json` preserves the complete inspected archive list. `LICENSE.txt` is the original author dedication; `CREDITS.md`, the public credits page and README link back to the author. A changed source hash requires renewed license inspection.

The additional Quaternius archive is author-uploaded at OpenGameArt and declared CC0 both there and on the author's pack page. It has no embedded license file, so its shipped LICENSE.txt is the canonical CC0 1.0 legal text; license-evidence.json hashes the retained source-page evidence. The model archive already contains the selected glTF dependencies. The separately downloaded matching texture archive was inspected but is unnecessary to reproduce the selected models. A skinned/animated chest was rejected; only the twenty static props are selected.

Quaternius props use meshoptimizer through glTF Transform, target 25% triangles with a relative error bound of 1%. Actual achieved counts, rather than the target ratio, are recorded per model. The lead-requested density revision admits up to30,000 triangles including baked floor art before optional stock, and tests the complete room root below32,000 triangles. Floor vertex colors reuse the conduit material, preserving the eight-draw cap. The earlier17k/18k construction cap was superseded by functional floors, continuous hull runs and rich footprint clusters; the user budgets remain330 draws and3s worst /1.5s typical readiness, measured separately. Original source geometry remains available in the excluded archives for a future art pass. All output stays textureless and ordinary GLB; meshoptimizer is development-only.
