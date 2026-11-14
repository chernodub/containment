# K7 candidate provenance and raster review

K7 selected route B: original procedural anatomy on the retained rigs. No new third-party creature model is shipped. Existing Unvanquished model/animation/texture Creative Commons notices remain applicable; the new anatomy is repository MIT artwork.

## Route A evaluation source

- Author: Quaternius; pack: Ultimate Monsters; candidate: Alien.
- Author pack page: <https://quaternius.com/packs/ultimatemonsters.html>. The archived page explicitly links CC0-1.0 at <https://creativecommons.org/publicdomain/zero/1.0/>.
- The author-linked Drive folder is `18m4KpzpEzhC9wl7jzr6dUc0N8Jozr79C`; Big/glTF/Alien is `1rWF4Jo_G7-odDa5LfkQ0e2d9_p9pxb3W`.
- Both the direct glTF request and the pack License.txt request returned Google Drive quota-exceeded HTML. Those responses remain in the isolated, gitignored `tools/assets-src/k7-quaternius-monsters/`. They are not treated as model or license files.
- The comparison therefore uses the public mirror at <https://raw.githubusercontent.com/Hakhyun-Kim/constellation-defense/main/assets/models/quaternius-alien.glb>. Its archived [credits](https://github.com/Hakhyun-Kim/constellation-defense/blob/main/CREDITS.md) identify Quaternius, Ultimate Monsters, Alien, and CC0-1.0. The mirror-to-author original byte identity remains unverified because the original download was unavailable.
- Source GLB: 673,408 bytes; SHA-256 `e032f24296ab40779f00367362b62b665ee1e228b17abf36e9dd4144aef96412`.
- Review-only conversion: 624,456 bytes; SHA-256 `dda9bb8b86402042869d03b90153a6fa6d190eb26b679593b144395f4b4cd981`. Axis +90Y, height .62 for siege posture, matte untextured finish, native clip names mapped to stand/run/walk/attack/hit/death. All animations remain in the data.
- No downloaded script/plugin/executable ran. Repository-authored NodeIO conversion handles data only. The review candidate has no validated Unvanquished ragdoll mapping; the documented death fallback is the frozen-pose corpse path.

`node tools/assets/k7-actors/audit-candidate.mjs` rehashes every available page/source/response/output, validates native clip names and writes `artifacts/nextgen/k7-standard/provenance/{provenance.json,CREDITS.md,LICENSE.txt}`. The license text is canonical CC0 text copied from the existing Quaternius kit notice. It is explicitly not represented as a successful pack-archive download.

Audit result: **PASS**, review output 624,456 bytes, new shipped actor asset bytes **0**.

## File-only review tooling

```sh
node scripts/nextgen/k7-review.mjs --root=artifacts/nextgen/k7-final --before=artifacts/nextgen/k7-before --route-a=artifacts/nextgen/k7-route-a2
```

The script does not launch a browser or alter capture manifests. It writes exact-area 480×270 reductions, native actor motion strips, actual-owner black masks, a standard contact sheet, family/rank and four-rig silhouettes, before/final family crops, A/B route board, Queen phases and three-room crowd comparisons. Missing views are explicit in `review/k7-review-receipt.json`; every native source and generated PNG has a SHA-256 entry.

All native crops and owner tiles copy pixels 1:1. A silhouette sheet may become taller than 1080 when needed to fit every rank. Its 480-wide derivative uses exactly one-quarter scale and retains that height ratio; it is never squeezed to 270 pixels. This preserves combat-scale silhouettes. Whole-frame review reductions remain exact 480×270.

Owner masks contain actual visible rendered pixels and therefore retain body/world occlusion. They are not proof of unoccluded anatomy or blind recognition rates. Before/final poses and framing can differ; the comparisons preserve pixel scale and are art evidence, not controlled hardware timings.

The frozen before gallery now also contains the native Pyro/Arc standard: `node scripts/nextgen/k7-merge-evidence.mjs artifacts/nextgen/k7-before artifacts/nextgen/k7-before-rigs` passed with 8 complete frames +2 sprites added, 64 frames total. The merger rejects any error/failure/fatal run, incomplete phase sheet, changed application assets, viewport, DPR, seed or frozen distribution. It preserves `manifest-initial.json` and the exact source manifest, then records source/retained file hashes. An idempotent rerun rehashed all10 merged files. Raw `k7-before-rigs` remains untouched.

The merged before review reports **64 native sources,181 outputs,zero missing views**. All four marine rigs are present. Before/final family and rig comparisons use their actual owner pixels, without substituting another rig for missing coverage.

Three successful standard rounds are compacted into `artifacts/nextgen/k7-standard/round-{1,2,3}-native480-contact.png`. The corrected route board is `route-ab-native480.png`. `retained-contact-receipt.json` records each contact hash, original manifest hash, every contributing native PNG hash and owner-mask hash; the A/B entry also links the candidate audit hash. These receipts retain source identity when successful intermediate PNGs are removed later. No failed raw capture is removed by these tools.

The propagation review's taller Carrier exposed a fixed250px comparison tile. The file-only tool now derives native tile width/height from actual owner masks in every comparison layout, and Queen phase crops preserve the entire available viewport-visible body area. No native actor is resized to fit. A frame's off-viewport anatomy remains unavailable and is recorded as such.

Recheck: `k7-propagation` **85 sources,254 outputs,zero missing views**. The Queen-only flat study has8 sources/32 outputs; its9 missing family/rig views are expected because it is a boss-only fixture. `propagation-native480-contact.png` and `queen-study-native480-contact.png` live under `artifacts/nextgen/k7-standard/`, with exact retained manifest copies and85/8 native source hashes plus owner-mask hashes in `retained-contact-receipt.json`. The candidate audit was rerun and passes.
