# I10 licensing and shipped-asset audit

File-only audit: `node scripts/nextgen/i10-license-audit.mjs`.
Receipt: `artifacts/nextgen/i10/license-audit.json`. No browser, computer-use, source download or other-worktree write was used by this audit.

## Result

PASS for the wave-6 data added relative to U7 `0cfcecb2dc292b40a616da61cf4e157d84d669a1`. Four environment kits are CC0-1.0; all seven third-party input records for the compact effect atlas are CC0-1.0. Each pack retains CREDITS.md and LICENSE.txt, source URLs and source/output hashes. No new binary with missing or non-CC0 evidence was found, so no media or uses were removed. Retained actors/weapon models remain under their existing Creative Commons terms; they were not relabeled CC0. Original generated atlas patterns retain MIT separately from the third-party dedications.

| Pack | Selected models | Shipped GLB bytes | Source |
|---|---:|---:|---|
| Kenney Space Station Kit | 25 | 138,332 | https://kenney.nl/assets/space-station-kit |
| Kenney Furniture Kit | 15 | 116,712 | https://kenney.nl/assets/furniture-kit |
| Kenney Nature Kit | 8 | 34,424 | https://kenney.nl/assets/nature-kit |
| Quaternius Sci-Fi Essentials Kit (Standard) | 20 | 960,656 | https://quaternius.com/packs/scifiessentialskit.html; author upload https://opengameart.org/content/sci-fi-essentials-kit |

Four GLBs total1,250,124 bytes. Compact atlas `elements.png` is2,759,007 bytes,2048×2048 RGBA, SHA256 `44669a02d6af2f482c509c8240c5e246b5382ed051d0d26806929f52fa6e5e0b`. Its third-party inputs are Unity Labs/Thomas Iche Flame02, WispySmoke02, Explosion01 and four Kenney Particle Pack images. Source and hash records are in `public/assets/vfx/containment-v6/atlas.json`, with original CC0 dedications under `unity-labs-v6` and `kenney-particle-v6`.

Size terminology is important: **30 newly added public asset files total4,564,662 bytes**. One pre-existing VFX credits file was also modified. The31 added/modified files total4,565,684 bytes; **net public asset growth is4,564,967 bytes**. These figures include the shipped inventories/notices and exclude pre-existing Unity PNGs and all ignored source archives. The audit records every changed file's status, baseline bytes, current bytes, net bytes and SHA256.

All four output GLBs, the atlas, all four full archive inventories and the three retained Unity source PNGs were rehashed. The downloaded source GLBs/dependencies and Kenney source images are excluded and absent in this worktree. Their recorded SHA256 values, bounded local paths, source bytes, author/license/source URL fields and credits references were checked; their underlying source bytes were **not** re-downloaded or rehashed. Historic source-page hashes similarly remain provenance, not a claim that today's web bytes match. I10 root independently reopened all publisher pages and confirmed their CC0 declarations.

The Quaternius source archive had no license file: its author's pack page and author-uploaded OpenGameArt release supply the CC0 declaration, with canonical CC0 legal text retained. Public credits now say this explicitly instead of implying an embedded archive dedication. Kenney's original archive dedication is preserved.

No added source archive or `tools/assets-src/` file is tracked. Existing historical `.log.gz` receipts are unchanged and are not new art source archives.

## Dependencies and notices

Runtime dependencies are unchanged from0cfcecb: Three.js0.185.0/MIT and Rapier0.20.0/Apache-2.0, with existing texts under `THIRD_PARTY/`. New conversion-only direct packages `@gltf-transform/core`4.5.1, `@gltf-transform/functions`4.5.1 and `meshoptimizer`1.3.0 declare MIT, with `glTF-Transform-LICENSE.txt` and `meshoptimizer-LICENSE.txt` retained. No runtime decoder was added. Barlow OFL notices remain.

## Changes and validation

- Public asset credits retain all model notices and add direct links to every VFX credits/license file and atlas manifest. Its title now describes all assets.
- README/AGENTS factual updates cover illustrated title/ending, critical HUD backing, lazy kits/atlas and readiness, camera100px/18%-AABB versus exact-hull qualification, and I10 file-only evidence tools. No measured performance number was added.
- `scripts/smoke.mjs` keeps all existing assertions and adds title/settings atlas-request deferral, first-gameplay atlas request, decoded response size/SHA256, sevenCC0 input records, and every VFX credits/license response.
- `node --check scripts/smoke.mjs`:PASS.
- `node --check scripts/nextgen/i10-license-audit.mjs`:PASS.
- `node scripts/nextgen/i10-license-audit.mjs`:PASS,4kits/7atlas sources,30added/31changed files.
- `git diff --check`:PASS.

No presentation test pin was rewritten or removed. Root must rebuild after public-credit edits and run the browser smoke; this agent did not launch a browser.
