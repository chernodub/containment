# DRESS13 — infestation and room incidents

Work branch: `t3/infestation-room-incidents`. `nextgen` was merged first (fast-forward to `bfe8aefd`). Original simulation, actors, motion, camera, encounters, difficulty and UI remain outside this stream; the only renderer-orchestration change supplies the existing renderer to the static room asset owner for compressed normal decoding.

The Brood kit now carries the six late-room infestation identities: Workshop's consumed workbay, Swarm's hive-heart stronghold, pressure against the Shielding Gate, continuous outer Annulus crust, swallowed Manual Control cabinets, and heat-killed growth on Overload's perimeter. First traces appear at Freight ventilation and the breached dock. Legacy thin growth in the two takeover rooms is retired. Slow emissive pulses use the existing presentation clock, with separate lantern/pod phases; the simulation never reads these effects.

Fourteen early and service rooms receive concentrated aftermath compositions made from existing kit assets, with flush footprints, drag/scorch/trample marks, gouges, foam/frost, cut fibre and frayed cable evidence. The transmission station carries a frozen last message. These are presentation geometry; no new gameplay colliders or changes to native placement/navigation rules were introduced. Existing machinery remains visible beneath consumed shells.

The existing source Brood GLB remains the hardware fallback. `tools/assets/t12-textures/pack-brood.mjs` ships the shared 1024 normal atlas as linear UASTC KTX2, preserving mesh bytes and authored finishes; its receipt is `public/assets/brood-growth/shipping.json`. Supported desktop GPUs use the compressed GLB through the existing room cache. A short-lived transcoder owns its workers; the room cache owns decoded textures. The atlas payload bound falls from 5.333 MiB RGBA8 with mips to 1.333 MiB at 8bpp, shared by all instances. This is format payload, not measured driver allocation. Other kit maps remain under their existing owners and compression policies.

## Verification

`npm ci` and final `npm run build` passed. Every room has a five-position tour, calm frame and four twenty-contact kiting frames; native images and exact 480×270 reductions were opened, with two look/fix rounds recorded in [the review](plans/DRESS13-review.md). All 20 selected kiting receipts contain 20 accepted contacts. Gallery: `artifacts/nextgen/dress13-final/index.html`; images are under `before/`, `after/`, and `reduced/`, with source manifests in `receipts/`. Superseded capture intermediates were deleted. No automated tests or assertion gates were added.

The unassisted native command `npm run playtest -- --rig=cryo --seed=1729 --difficulty=story` completed 20/20 rooms, outcome complete, errors[], defects[], in 1813.5 seconds. Receipt: `artifacts/nextgen/playtest/dress13-story-final/report.json`. Campaign source was `8bb9fc222413cf9569b9c5114d629356ba10e137`; subsequent changes remove old presentation strands, adjust/clip/flatten static creep, and improve benchmark refill sampling. They do not alter collision or navigation. The final capture and benchmark source is `ff3a7abbeccd1b6308f538339de034923dcab3e4`.

Matched numeric baseline: seven pre-DRESS13 placement/growth modules from `bfe8aefd` and incident detail calls disabled, retaining the current merged renderer/actors and loader. Sources were restored immediately after the immutable baseline build. Both benchmark cohorts use High, Cryo, one 10-second ordinary live trial per room, with 25-target replenishment through native legal spawning. Raw benchmark receipts and dist asset hashes are retained under `bench-before/` and `bench-after/`. Historical final6 staged-image counts are separately retained in `room-metrics.json`; they include upstream actor/renderer differences and are not an attributable dressing delta.

| Room | Max draws before → after | Max triangles before → after | Scene texture MiB before → after | Final tour prep s |
|---|---:|---:|---:|---:|
| awakening-bay | 165 → 175 | 796,717 → 798,639 | 110.41 → 110.41 | 2.13 |
| passenger-vault | 133 → 141 | 583,085 → 551,941 | 58.89 → 59.81 | 1.47 |
| residential-gallery | 134 → 139 | 525,889 → 527,882 | 46.98 → 46.98 | 1.91 |
| communal-atrium | 141 → 149 | 534,418 → 528,082 | 72.67 → 72.68 | 1.56 |
| crew-checkpoint | 122 → 132 | 521,204 → 530,980 | 47.10 → 46.99 | 0.97 |
| armory | 151 → 164 | 519,632 → 526,670 | 46.97 → 48.42 | 1.37 |
| freight-hold | 135 → 137 | 548,736 → 540,839 | 46.38 → 49.52 | 0.96 |
| breached-loading-bay | 142 → 141 | 526,220 → 536,574 | 46.19 → 51.07 | 1.24 |
| relay-racks | 138 → 141 | 524,583 → 529,543 | 66.98 → 66.97 | 0.92 |
| transmission-chamber | 139 → 140 | 564,990 → 568,304 | 63.94 → 66.42 | 1.64 |
| diagnostic-gallery | 136 → 134 | 535,651 → 539,012 | 47.42 → 47.31 | 0.93 |
| safety-interlock-station | 296 → 277 | 555,632 → 580,237 | 48.36 → 49.71 | 1.49 |
| coolant-plant | 130 → 132 | 501,956 → 529,518 | 62.50 → 60.41 | 0.84 |
| service-shaft-landing | 133 → 143 | 503,311 → 507,972 | 45.85 → 49.85 | 0.92 |
| infested-workshop | 203 → 183 | 530,883 → 535,502 | 50.01 → 50.01 | 1.21 |
| swarm-junction | 129 → 118 | 505,952 → 576,437 | 44.53 → 41.28 | 1.24 |
| shielding-gate | 189 → 195 | 491,072 → 510,943 | 66.97 → 68.42 | 1.46 |
| containment-annulus | 143 → 150 | 529,739 → 641,379 | 66.42 → 69.67 | 2.01 |
| manual-control-chamber | 175 → 175 | 500,740 → 538,573 | 41.98 → 43.31 | 2.24 |
| overload-floor | 135 → 139 | 517,641 → 574,552 | 36.28 → 39.65 | 1.83 |

All final benchmark rooms remain below 330 draws (maximum 277); all report zero mid-combat shader compiles and no browser/GL errors. Final tour preparation maximum is 2.24s; benchmark preparation maximum is 2.30s. An earlier 4.00s Overload cold-preparation outlier is retained in review history.

Triangles and draws are whole rendered-frame maxima, not asset-only costs. Scene texture estimates subtract inventoried render-target textures, include visible actor/bone textures, and exclude unreferenced caches/driver padding. Population, effects and adaptive resolution vary during ordinary play, so small numerical reductions are not presented as dressing optimizations. Single-repeat timing does not establish stable hardware FPS. Both raw cohorts retain their budget failures; final timing budget failures: 0.

## Remaining weakest details

Relay Racks' tools/cut fibre remain small at 480×270; Safety Interlock reads more as a welded machinery access than a full hull door; Diagnostic Gallery's existing sign competes with its torn-cradle narrative; Annulus still repeats outer growth caps. These remain peripheral art weaknesses, with the marine and telegraphs unobscured in the inspected frames.
