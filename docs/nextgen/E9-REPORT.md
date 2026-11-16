# E9 — original ship interiors

E9 replaces the close-camera bare grid with room-specific deck fields, manufactured bulkheads, original equipment and visible fixture sources across the twenty current-story rooms. The original Blender kit is MIT, has bevelled edges, panel seams and deterministic baked vertex AO, and is merged by material finish. Retained cryogenic, habitation, garden, armory and reactor landmarks keep their original owners and provenance. Legacy CC0 fallback packs and their notices remain shipped.

## Scope and owner decisions

The owner superseded the original brief's test requirements by removing all automated suites on `nextgen` (`4b2a5f4`). E9 checkpointed its work, merged `nextgen`, deleted modify/delete test conflicts, reinstalled with `npm ci`, and followed the rewritten on-disk `AGENTS.md` and Engineering guide. No replacement tests, assertion gates or proof infrastructure were added after that decision. Existing capture/playtest diagnostics remain in use.

The owner also authorised original Blender modelling and shallow wall furniture with static colliders. The additive furniture layout stays within48u of a backing wall/partition, reserves at least140u of passage, and avoids authored openings, breaches and the R144 fight circle. Scanner arches use their actual post footprints; the opening remains at least140u wide. Ceiling services have no floor collider and cut away as opaque assemblies when projected across a marine or enemy silhouette. Camera cutaways retain the physical light-blocking shadow. Existing hull/partition plans, spawn/exit/breach positions, enemies, abilities, run/save rules and balance were not changed.

## Construction and material treatment

- Original high/low wall modules have a broad cap, dark near face, panel breaks, baseboard and captive source strip. Near walls stay low. Real apertures receive jambs and flush thresholds; virtual sub-space boundaries only receive deck treatment.
- Each named space receives a clipped deck field, a quiet orientation/tone change and a function-specific fight-floor inlay. Overlapping named charts have a single surface owner. Old millimetre-high decorative floor finishes sit below the new skin; retained raised hardware, source materials and the Shaft grain hook remain owned normally. Walking skins remain below `.022m`.
- Recessed glass channels expose pipes and emitted strips; industrial gratings expose real depth. These are captive service hardware, not unsupported luminous smears. The unsupported analytic bounce plane is disabled in E9 rooms while actual source lighting remains.
- Full-scale wall stations combine consoles, screens, storage, benches and service details. Three distinct station assets are attempted per named bay where the authorised footprint fits; preserved native banks supply additional identity. Narrow returns are not filled by reducing their clear width.
- All twenty written two-tone schemes plus accents are in [E9-material-schemes.md](plans/E9-material-schemes.md). Equipment finish roles preserve AO and recess values. Low keeps the same caps, zoning and source geometry.

Sources and rebuild commands: [original kit README](../../tools/assets/e9-ship-kit/README.md), scripts under `tools/assets/e9-ship-kit/`, exports and individual hashed manifests under `public/assets/e9-ship-kit/`. No new third-party downloads or runtime dependencies were introduced.

## Loading cancellation

Gameplay kit work now starts at actual room entry, rather than at rig selection. Returning to the menu retires the current owner on the application lifecycle boundary. Session-owned model transfers can finish and populate the bounded cache; cancelled borrowers and late/partial results retire quietly, without attaching a stale room. Genuine fetch failures still log and settle to the existing fallback.

The manual playthrough held real GLB responses, returned to the menu mid-load, observed disposed owners/no attached kit root, released the responses, then loaded the next run on the same page successfully. Original and legacy owners both produced zero console/request errors. An intentional fresh-page clinical404 still emitted the actual load error. Details: [E9-cancellation-review.md](plans/E9-cancellation-review.md). No smoke assertion was weakened.

## Static batch correction

The first final combat pass exposed a warm-session hole in the original batching fix: shared procedural materials had acquired the known local-light, graphic-surface and geometry-MRT policies, so the conservative matcher skipped them. An actual renderer inspection found4,160 separate Transmission equipment meshes and zero consolidation; the last kiting phase submitted333 equipment draws alone. The fix accepts only those exact shared material identities and known cache-key chain, with a retained callback-identity check for the material-only MRT policy. Unknown shader/object hooks and all existing hierarchy/transform/geometry exclusions remain excluded. Geometry, materials, collider support parts and shadows are retained; no content is removed. The affected three budget rooms are re-captured below.

## Review method

The three standard rooms went through three complete procedural critique/fix rounds, then four original-kit rounds before propagation. Each complete round was actually opened at native1920×1080 and exact480×270, with the original Residential frame alongside. Critiques and resulting changes are recorded in [E9-standard-review.md](plans/E9-standard-review.md). Subsequent twenty-room reviews exposed sparse wide crops and floor-surface interference; these received suspended room-specific fixtures and corrected surface ownership before final captures.

The final gallery contains five legal native-camera views per room, quiet spawn views, staged kiting views, exact480 reductions and L8 comparisons. These are art observations and native fixture counters, not organic combat or hardware-FPS certification.

## Verification and room measurements

Production source: `a5dd8c67e4d5e6d36d056b460422464e9cafdd1f`; final report/gallery commits do not change the captured application. Sixteen visually unchanged room sets retain source `b7b3d7882d5b4a7892f2f684e55b243040e4981c`; Armory, Freight, Transmission and Diagnostic are replaced together from the corrected production source. Each room's bundle and native hashes remain explicit. `npm ci` completed after the workflow merge. `npm run build` passed with TypeScript and production bundling; Vite retains its existing large-chunk advisory.

The assembled gallery retains200 guarded native PNGs:100 tour,20 calm and80 staged kiting. All twenty tours were reviewed at native and exact480; the four corrected rooms received replacement complete sets. Selected-frame maximum draws:296; maximum preparation:1,658.5ms; observed program-inventory delta after preparation:0. These staged counters do not certify hardware FPS.

The three L8 draw misses now peak at **Armory129, Freight85 and Transmission85**, versus L8 maxima360/365/493. Static content and its shadows remain. The first superseded capture parent recorded the Diagnostic HUD failure and old warm-material misses; its parent manifest and failure snapshot are retained separately.

- **Build:** `npm run build` passed (TypeScript + production bundle).
- **Campaign:** `npm run playtest -- --rig=breacher --seed=1729 --fast --label=e9-breacher-1729` exited0 after271.57 wall seconds. Ten rooms cleared; natural death27.63 simulation seconds into Diagnostic Gallery (room11);0 errors and0 recorded defects. No assisted damage scaling or forced advancement. The runner kept native WASD/mouse, simulation, collision and camera updates; `--fast` decimated intermediate GPU submissions. This verifies the observed path, not later-room campaign traversal or hardware FPS. [Full native input trace, screenshots and report](../../artifacts/nextgen/e9-final/campaign/index.html).
- **Captures:** twenty reviewed tours, twenty quiet views and eighty staged combat frames retained. Corrected four-room capture:40/40 PNGs,0 failed scenarios,0 page/console errors. [Gallery](../../artifacts/nextgen/e9-final/index.html).
- **Measured rendering:** `npm run bench -- --label=e9-bench --rooms=armory,freight-hold,transmission-chamber --rigs=breacher --tiers=high,low --seconds=12 --repeat=1 --no-build --dist=dist --dist-source-sha=a5dd8c67e4d5e6d36d056b460422464e9cafdd1f`. One ordinary submission trial per room/tier,1920×1080 viewport, ANGLE Metal / Apple M1 Pro;25 native enemies replenished, native ability use. All six draw/program/resource checks passed and stayed in combat without WebGL errors. [Raw benchmark](../../artifacts/nextgen/e9-final/benchmark/benchmark.json).

**Timing remains a miss.** High frame p95 was33.2/24.0/25.4ms against20ms; CPU p95 also exceeded8ms. The process exited0 because ordinary bench mode checks resources/programs; `--acceptance` was not requested. Host load at start was24.65 on10 logical cores; that limits interpretation but is not proof that load caused every miss. High internal scale ranged.925–1, Low stayed1. No quiet-machine timing pass or all-twenty hardware certification is claimed. Integration should remeasure timing on its quiet certification host; the required three-room draw-cap correction is resolved.

| Room / tier | Peak draws | Peak triangles | Frame p50 / p95 ms | CPU p95 ms | Internal scale | New programs |
|---|---:|---:|---:|---:|---|---:|
| armory / high | 291 | 1,192,092 | 16.7 / 33.2 | 34.8 | 0.925–1.000 | 0 |
| armory / low | 159 | 628,395 | 16.7 / 24.9 | 24.5 | 1.000–1.000 | 0 |
| freight-hold / high | 193 | 1,252,382 | 16.7 / 24.0 | 21.5 | 0.925–1.000 | 0 |
| freight-hold / low | 126 | 661,342 | 16.7 / 24.5 | 28.9 | 1.000–1.000 | 0 |
| transmission-chamber / high | 197 | 1,424,570 | 16.7 / 25.4 | 22.2 | 0.925–1.000 | 0 |
| transmission-chamber / low | 122 | 758,467 | 16.7 / 18.3 | 11.9 | 1.000–1.000 | 0 |

Per-room values are native capture counters. Calm is the quiet spawn frame; kiting values are independent maxima across four phases, so peak draws and triangles need not occur together. Programs and preparation are maxima across the complete selected room set. Source hashes identify the saved images; sixteen retained art sets report their original conservative counts, not relabelled measurements from the later batching build.

| Room | Function and landmark | Draws calm / kiting peak | Triangles calm / kiting peak | Programs | Prep max ms | Source |
|---|---|---:|---:|---:|---:|---|
| Awakening bay | Cryogenic recovery: open released berth, sealed banks and recovery station. | 79 / 121 | 584,290 / 690,336 | 129 | 1471.2 | `b7b3d78` |
| Passenger vault | Occupied passenger storage: human silhouettes, life-sign faces and service benches. | 53 / 89 | 343,914 / 460,564 | 122 | 621.7 | `b7b3d78` |
| Residential gallery | Domestic cabins: made berth, writing desk/stool/storage; gallery pendant. | 45 / 82 | 372,891 / 490,141 | 120 | 793.4 | `b7b3d78` |
| Communal atrium | Shared dining/conservatory: retained garden enclosure, table/seating and leaf inlay. | 57 / 90 | 286,368 / 383,054 | 121 | 799.5 | `b7b3d78` |
| Crew checkpoint | Crew inspection:05 scanner gates, glazed guard booth, baggage conveyor and lockers. | 40 / 77 | 410,450 / 527,094 | 120 | 786.6 | `b7b3d78` |
| Armory | Ordnance issue: retained radial rifle carousel and horseshoe issue counter. | 97 / 129 | 276,333 / 392,755 | 117 | 772.6 | `a5dd8c6` |
| Freight hold | Cargo dispatch: restraint banks, dispatch controls and two motorised hoists. | 48 / 85 | 295,038 / 412,402 | 120 | 509.5 | `a5dd8c6` |
| Breached loading bay | Damaged dock: peeled hull scar, repair lamps, cargo and pressure-lock services. | 60 / 100 | 289,352 / 407,642 | 120 | 741.1 | `b7b3d78` |
| Relay racks | Data relay: central rack spine, communications cabinets and paired consoles. | 63 / 97 | 332,396 / 448,617 | 117 | 578.2 | `b7b3d78` |
| Transmission chamber | Warning uplink: chancel dish, original suspended dish and communications bays. | 46 / 85 | 385,887 / 503,331 | 120 | 717.7 | `a5dd8c6` |
| Diagnostic gallery | Laboratory: probe arch, analyser/test benches, recorder and supported status gantry. | 45 / 85 | 444,559 / 562,013 | 125 | 884.0 | `a5dd8c6` |
| Safety-interlock station | Recorder isolation: recorder/AI gallery, sealed gate, battery return and local-safety display. | 67 / 145 | 452,476 / 572,214 | 125 | 777.3 | `b7b3d78` |
| Coolant plant | Pump maintenance: headers, paired pump skids, valve manifolds and drain gratings. | 45 / 80 | 291,177 / 407,817 | 113 | 484.6 | `b7b3d78` |
| Service shaft landing | Vertical transport: deep shaft, guide/pulley structure and docking controls. | 46 / 82 | 276,440 / 393,070 | 117 | 582.7 | `b7b3d78` |
| Infested workshop | Converted maintenance: rooted workbays, manifolds and suspended tool bridges. | 48 / 93 | 378,242 / 495,932 | 117 | 741.1 | `b7b3d78` |
| Swarm junction | Corrupted ventilation: rooted three-mouth plenums and overhead fan exchanger. | 45 / 81 | 295,513 / 412,415 | 116 | 761.3 | `b7b3d78` |
| Shielding gate | Shield inspection: offset shield banks, service bays and calibration floor. | 178 / 296 | 352,925 / 458,895 | 119 | 746.0 | `b7b3d78` |
| Containment annulus | Core inspection: sealed core, buttressed foundation and ring-status stations. | 51 / 89 | 342,373 / 459,415 | 123 | 670.6 | `b7b3d78` |
| Manual-control chamber | Human authorization: guarded key console, observation aperture and fatal-cost display. | 59 / 106 | 286,746 / 403,220 | 183 | 1658.5 | `b7b3d78` |
| Overload floor | Reactor feed/exhaust: hot layered core, finned service bays and thermal floor inlay. | 51 / 89 | 310,226 / 427,328 | 182 | 914.3 | `b7b3d78` |

## Presentation diagnostics

No gameplay, navigation, persistence, keyboard-accessibility or combat-priority diagnostic was weakened. The owner removed the test files as a project-wide policy change. Safety's repeated warning was moved inside the actual HUD-safe viewport after a tour exposed its right-edge clipping; the diagnostic stayed intact. The final room-tour and kiting receipts retain native camera framing and zero additional shader compilation after preparation.

Diagnostic's first supported board was also moved inward after the combat camera exposed its right-column clipping. The gallery's existing source comparison is scoped to each complete room set: targeted corrections replace tour/calm/combat together, while visually unchanged rooms retain their original PNG hashes and source bundle. Every room's source and application hashes are recorded explicitly; the source identity of retained views is not relabelled. This is a provenance adjustment in the required gallery assembler, not a new gameplay gate.

## Integration requests and remaining weaknesses

All twenty five-position tours were opened individually at native and exact480 across root and the three reviewers; root also opened every final tour sheet and selected weak native views before accepting their findings. Reviews: [root](plans/E9-final-tour-review-root.md), [Act2](plans/E9-final-tour-review-act2.md), [Act3](plans/E9-final-tour-review-act3.md), [Act4](plans/E9-final-tour-review-act4.md). The pass is a clear construction/material improvement, but it does **not** fully achieve equally specific furnishing in every possible40% crop.

Weakest remaining rooms/crops, honestly:

1. **Shielding Gate:** spawn, centre and sterilization bypass still put identifying machinery at the margins; the blue floor dominates and wall/floor distinction is weaker than the best rooms.
2. **Relay Racks:** North cross aisle and Console bay lose their specific rack/control silhouettes at the edges; dark detail compresses at480.
3. **Residential Gallery:** the centre now has a complete warm pendant, but still reads less domestic than its bed/desk/stool cabins. South cabin furniture sits low in the crop.
4. **Transmission Chamber:** nave and exit benefit from the original dish; the Service airlock still relies mostly on floor, low barrier and source strips.
5. **Diagnostic Gallery / Workshop rear workbay:** the diagnostic warning can outweigh the instruments; Workshop04 loses the new tool bridge and much edge furniture. Swarm's South airway is improved by its exchanger, but the crossing remains quiet.

Integration requests: certify the unresolved timing targets on a quiet host; later-room organic campaign navigation remains outside this single run’s observed coverage. Compose these remaining side windows with room-specific wall/ceiling assemblies while preserving passage and actor priority; inspect fine native floor-band artifacts in Communal/Shielding/Annulus and the mottled retained Armory carousel face. The old jagged Shaft floor and half-opaque Annulus channel defects were improved, but this report does not certify every surface artifact eliminated. Some retained practical pools remain rounder than the preferred fixture-shaped light language (notably Manual's exit). The heavy Annulus foundation still dominates several crops. No idle orange dashed ability-placement rectangle was seen in the final calm tours; no V8 preview request is raised.

## Delivery

Branch: `t3/room-interior-dressing`. The final report/gallery commit follows the production source above. Gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-84b6dc1b/artifacts/nextgen/e9-final/index.html`. After assembling all final native copies and parent receipts,37 E9 intermediate directories were removed. The final directory retains the campaign, benchmark and representative superseded failure snapshots; other streams' evidence is untouched. No push or PR.
