# I11 independent PNG acceptance review

## Scope and receipts

Independent review on `t3/wave7-integration-acceptance`. Application freeze supplied by the lead: `a112e70154be57c77430d0ad5c61bd9e87ef90e1`; documentation HEAD when this review was written: `cf34a78104a028eba8a1a577b191fe94e3b88c83`. No application edits, browser launches, computer-use tools, balance changes, or test changes were made by this reviewer.

Read `reviews/R9-verdict.md` and `streams/W4-direction.md`. Opened saved PNGs through `view_image` with `detail: original`. All 22 historical 480×270 contact pages and all 22 historical marine-centered 600×400 crop pages were inspected: round1 pages 001–007, states2 pages 001–008, round2 pages 001–007, in the corresponding `artifacts/nextgen/i11-*-review/review480/` and `review-native/` directories. These contain all 128 preflight frames. Separately opened 28 full 1920×1080 originals: ten round1 family phase02 frames; eight states2 ultimate phase02 frames (four abilities × containment-annulus and infested-workshop); four round2 rig phase02 frames; and phase02 frozen families, burning families, status-vfx, legacy acid, annulus landmark, and cargo landmark. A native crop does not count as opening its full original.

Exact paths, PNG dimensions, SHA-256 hashes, capture manifest hashes, source SHAs, assets and recorded framing diagnostics are in `artifacts/nextgen/i11/independent-review/preflight-opened.json`. These are historical combined preflight cohorts, not a claim that all three were captured at the final freeze: round1 source `248d4db896e03fa9250518402eeeca08bbaea2a0`, states2 `3e67c03e86547a39152dd16ae7b1b569f336e8fe`, round2 `f505c503b8753d249e302d30b27bce41af500cd9`. Their manifests each report zero failures and zero errors. Host load at receipt generation: 13.63 / 14.97 / 15.58, 22:51 local, while the lead's final captures ran. This review makes no performance claim.

## Acceptance findings

**Receipt correction after review:** the gallery engineer found occasional duplicated columns caused by floating-point floor rounding in the old equal-size sheet blit. Consequently the preflight contact pages listed above are visual review witnesses, not strictly pixel-identical exact480 or 1:1 crop witnesses. Full native originals and standalone480 reductions are unaffected. Tooling was repaired at `1cd0785`; corrected versioned pages require actual reopening before claiming strict correspondence. Old sheet hashes and files are retained. The qualitative findings below remain observations of the pages actually opened.

| Standing check | Independent visual finding |
| --- | --- |
| Five families, crowds, pale shells | Much stronger than R9. Brown segmented Brutes, olive elevated Spitters, purple high Carriers, low brown Crawlers and hooked purple Stalkers form different large shapes. Large families keep their palettes across all ten room compositions, including dark Comms/Infested and bright Cryo/Containment. No broad white-pennant shells appear in the live, frozen, burning or elite samples. Elite orange contours reduce some hue separation. The two small families still depend on learned shape/color context at 480×270; their legs and facial detail are tiny. No exhaustive corpse evidence or blind recognition study was performed, so this is not a universal corpse/recognition certification. |
| Rooms as places, floor markings, lighting | Cargo handling arrows, Cryo equipment, habitation furniture, Comms racks, Maintenance grates, Infested folded growth, and Reactor machinery convey function. The old nested rectangle sports-court pattern is absent in this scope. Rectangular prop foundations and broad empty steel floor remain, especially Cargo. Infested growth has volume on machinery and fine floor veins; repeated folded/saddle-like forms still show. Warm habitation/Cargo, red-white Security, cyan Comms, green Maintenance, violet-green Infested and warm Reactor keys separate environments. Cryo/Comms/Containment retain a common cool steel baseline. This preflight review did not inspect a ten-up grayscale lighting sheet or independently calculate per-room luminance bands. |
| Four sustained ultimates | All four have visible state cues through their four sampled phases at 480×270. Overclock's delayed marine echoes and Railbreaker's continuous banded beam announce most strongly. Whiteout stays visible as a large frost arc/sheet with wind and snow; it still feels like a presentation layer more than environmental freezing. Meltdown keeps attached orange shoulder flame, embers and smoke, but is a modest burning suit rather than the requested walking inferno. Four still frames establish sampled persistence, not every instant of duration. |
| Shared effects and actor identity | Frost fragments, angular shot bands, embers, attached flame and translucent echoes broadly fit the illustrated game. The marine's cyan head, weapon and inked body remain legible through the mixed status fixture; frozen enemies retain brown/olive/purple identity rather than turning into white shells. Tall Carrier tops remain visually simple long shapes, but are purple and articulated below. Status counts can crowd an already dense fixture; that is not organic campaign evidence. |
| Placement and hostile priority | Valid Glacier is a pale dashed strip; blocked Glacier switches to warm orange and gives a cursor-local dark-backed reason. Friendly Pyro placement/area rings are open dashes. Hostile circles use thick orange rims plus diagonal hatching; live legacy acid uses solid orange triangular teeth around green liquid. The shape grammar distinguishes these in inspected frames despite shared warm hues. Whiteout/friendly areas do not erase the hostile hatch or strip end caps. No independent runtime mask or shader-lifecycle test was run. |
| Marine, HUD and rigs | Marine head/weapon/body/ring remain readable in all native crop pages; native critical health, armor and ammo numerals keep a dark local backing when panels fade. Four native rig views show different back/shoulder modules, particularly Pyro tanks and Arc hardware. At 480×270 the base cyan marine silhouette remains very similar across rigs; equipment identity is subtler than ultimate identity. Tiny reduced HUD labels are not a substitute for judging the native desktop HUD. |
| Camera and landmarks | Marine remains clear of HUD panels in the full originals opened. Supplied preflight diagnostics have minimum heroPixels 100.276 / 100.000 / 100.000 and maximum outside-AABB fractions 3.40% / 11.31% / 11.11% for round1 / states2 / round2. These are manifest readings, not independently measured geometry. Annulus machinery no longer hides the marine, but the large dark foundation occupies a major portion of the frame and pulls attention from the fight; bright/dark fixture views also crop distant enemies near screen edges. The cargo replay retains a readable marine while large crate banks dominate the center. No numeric landmark-share bound was independently recomputed, and these fixtures do not establish organic encounter viewport fit. |

Queen/reactor-vault evidence is **legacy saves only**. The acid frame proves a hostile pool boundary, but most of the Queen is outside the frame; it does not establish the repaired Queen's anatomy. These frames must stay out of the current-story showcase. Current new-run story ends at the Overload Floor holdout. Title/ending art, organic bot campaigns, final5 comparisons and storyboards were outside this initial preflight review.

## First images for the lead

All paths below are relative to `/Users/chernodub/.t3/worktrees/containment-game/t3-26ffbbf6/`; exact hashes are in the receipt.

1. `artifacts/nextgen/i11-round1/c6-silhouettes-relay-racks-02.png` — dark Comms family colors and contours.
2. `artifacts/nextgen/i11-round1/c6-silhouettes-overload-floor-02.png` — Reactor key, five silhouettes and elites.
3. `artifacts/nextgen/i11-round2/k7-frozen-families-containment-annulus-02.png` — frozen family identity without white shells.
4. `artifacts/nextgen/i11-states2/v7-state-meltdown-infested-workshop-infested-workshop-02.png` — persistent but modest Meltdown.
5. `artifacts/nextgen/i11-states2-review/review480/review-004.png` — Whiteout bright/dark phases on the historical visual-review sheet.
6. `artifacts/nextgen/i11-states2-review/review480/review-007.png` — blocked cursor-local preview and hostile/friendly grammar.
7. `artifacts/nextgen/i11-round2/e7-landmark-annulus-containment-annulus-02.png` — safe marine, still dominant landmark foundation.
8. `artifacts/nextgen/i11-round2/i11-legacy-acid-boundary-reactor-vault-02.png` — hostile acid teeth; legacy saves only.

## Gates, changes and remaining work

This reviewer ran no application gates or benchmarks and rewrote/removed no tests or presentation pins. Runtime gate results belong to the lead's acceptance report. This review document, file-only witness bridge, and ignored review receipts are owned here.

No integration code changes requested against the frozen application. Preserve the candid limits in the main I11 report: tiny small-family anatomy at reduction, restrained Meltdown, sheet-like Whiteout, common marine silhouettes, repeated infestation folds, large Annulus foundation, and shared cool-steel baseline. The final follow-up below extends this scope. Organic/storyboard and comparison/showcase images were not independently opened by this reviewer; other agents’ opens are preserved separately by the witness bridge.


## Final frozen-gallery follow-up and convergence

The lead requested convergence after the current batch. I completed full-native and corrected exact480 review of odd 1080 batches 01 through 23, then stopped. No extra captures, gates, browsers or application tuning were started. `artifacts/nextgen/i11/independent-review/final-opened.json` contains **417 individually opened full 1920×1080 originals**, **74 actually opened corrected contact pages** covering those 417 frames, and 21 earlier nonexact sheet opens explicitly labeled as historical visual scope. Full originals were opened at `detail: original`; prepared native crop pages do not count toward this total. Every corrected page was reopened after the local blit repair. Batch 25 (70 frames) and batch 27 (7 frames), 77 frames and 14 pages total, remain **unreviewed by this agent**. No assertion of exhaustive final-gallery review is made.

| Odd 1080 source batch | Full native originals | Corrected480 pages |
| --- | ---: | ---: |
| 01 | 40 | 7 |
| 03 | 40 | 7 |
| 05 | 10 | 2 |
| 07 | 10 | 2 |
| 09 | 10 | 2 |
| 11 | 40 | 7 |
| 13 | 37 | 7 |
| 15 | 40 | 7 |
| 17 | 40 | 7 |
| 19 | 40 | 7 |
| 21 | 40 | 7 |
| 23 | 70 | 12 |
| Total | 417 | 74 |

Final sources use the supplied frozen application, although capture tooling/documentation HEADs differ. Each final manifest retains its source directory, source PNG SHA256 and frozen-dist source SHA. Exact original paths and actual-open hashes are in the receipt; final byte-identical replacements are identified in `final5/review-witnesses/witness-bridge.json`. This is hash correspondence, not a claim that I reopened the copied final path.

The complete final family phases in batches19/21 support the preflight findings: family palettes and ink boundaries survive the ten compositions and frozen/burning treatments, without broad pale pennant shells in the opened scope. Small-family detail remains tiny at480. Repeated Brute stress fixtures still look repeated; they should not stand in for organic crowd evidence. Batch13 native legacy Queen frames show the full rebuilt boss: layered lavender plates, pink/red upper lobes and dark articulated pincers. This extends the clipped preflight acid view; the long front plate remains simple. Queen evidence is **legacy saves only** and excluded from the current-story showcase.

Batch15 bright/dark four-phase ultimate views retain cues for every sampled state. Batch23 seven-phase ability sequences show angular bands, ice fragments, electric branches and warm flame/smoke within the same drawn language. They support sampled persistence, not a continuous-duration proof. Meltdown remains comparatively modest; Whiteout still reads as a broad frost sheet and is quieter in early phases. In batch17, friendly valid Tesla’s thin purple placement ring and Bulwark’s short gold dashed strip are faint on bright Cryo floors. Their grammar is distinct from thick hostile hatching/teeth, but immediate noticeability is weaker. Blocked cursor-local reasons remain readable. No runtime precedence test was independently run.

Native HUD critical numerals retain their local opaque backing, and the cyan marine/head/weapon stays legible. Four rig module differences are clearer native than at480. Dark Annulus machinery and Cargo crate banks still occupy substantial attention; distal enemies can leave the frame while directional arrows remain. I did not independently recompute hero pixels, landmark share, hull area or numeric luminance bands. The ten-up grayscale sheet, even1080 batches, all720 batches, organic campaigns, storyboards and final comparison/showcase layouts were not personally opened in this follow-up.

## Actual-open witness archive

`scripts/nextgen/i11-review-witness.mjs` is a file-only evidence bridge. It performs no visual review and no application tests. It reads each agent’s actual-open ledger, verifies each available opened file against its recorded SHA256, and matches final native PNG bytes by hash. For reduced evidence it requires an actually opened corrected page plus its `pages.json` native hash entry, then compares every RGB channel of the480×270 cell against the final standalone reduction. Old rounded sheet blits, unopened prepared pages, and marine crops cannot establish native/exact480 acceptance.

The bridge preserves actual opened pages, metadata, source manifests and exact ledger snapshots beneath `artifacts/nextgen/final5/review-witnesses/` and `artifacts/nextgen/final5-720/review-witnesses/`. Each `witness-bridge.json` gives per-frame status and an explicit unreviewed list. Cross-agent identity proofs are distinct from my own visual findings. Parent-owned campaign/showcase and performance evidence remains outside my independent scope. The lead owns cleanup of raw captures and failed-parent archives after these receipts are saved.
