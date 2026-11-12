# X2 — world and actor rendering

Branch: `t3/world-actor-rendering-fixes`. Baseline application: `3a7996ed9d66d2f272ca5c425f0dc03f47297440`. Frozen acceptance application: `0398bc36c8e69a945a3c50fe55fb4afd29cca991`. Capture/benchmark orchestration HEAD: `026829cb00cfcb1879c8c64964f47d668ed6dc28` (diagnostic metadata only after the frozen app). The final documentation commit follows these commits. Title arm pitch targets the crouched creature; gameplay pitch defaults to zero and its paired muzzle-direction test preserves ordinary aim.

Scope is presentation only. Simulation, room templates, collision/navigation, abilities, UI, dependencies and third-party assets are unchanged. All work is in the assigned worktree. No push or PR.

## Changes against the art review

| Item | Implemented behavior |
|---|---|
| 1. Marine readability | Persistent cyan-white helmet/shoulder identifiers, secondary rig-colored chest accents, a wider soft ground ring with dark backing, and a borrowed-skeleton silhouette rendered in the HUD scene after world particles/post. Crowding strengthens the silhouette; a dark outer keyline retains contrast against white frost and flashes. Source bones remain authoritative, and merged overlays fall back safely if skin inputs change. |
| 2. Enemy identity | Different family body values/hues, throbbing spitter throat sacs, segmented carrier brood glow, closed pale brute shoulder armor, dark shimmering stalkers, plain russet crawlers. Per-body rims, elite spines and persistent champion crests remain separate from status/flash materials. Damaged/elite-only health bars have dark backing and constant pixel dimensions. |
| 3. Equipment fidelity | Shared material-merged cabinet, cartridge and pressure-cylinder details add recessed faces, frames, vents, jaws, collars, connectors, cable runs and LEDs. Applied to comms, workshop, coolant, interlock, freight and habitation kits, with direct authored additions to Relay Racks, Armory Carousel and Communal Atrium. Comms bays cover all four exposed faces while retaining the 10,000-triangle cell cap (8,500 measured). Original Awakening Bay bed reservations remain clear. |
| 4. Infestation | Seeded slumped, bruised sacs, consumed machinery, curved wrapping membranes, branching wall fans and narrow internal fissures replace regular bulbs/discs. Large surfaces use plum/gray rather than a uniform green wash; repeated isolated ellipse pads and rooftop instrument decorations are removed. Flush, branching roots connect obstacle clusters across the deck; raised geometry remains on existing solid footprints. |
| 5. Reactor climax | World-distance white-hot center, controlled orange peripheral bands, animated energy structure, local heat/embers and moving alarm intensity. Cooler/darker lighting preserves neutral combat lanes. Uses the existing hot-fixture and atmosphere shader families. |
| 6. Queen exposure | Snapshot-driven gradual carapace displacement and a rigid hinged dorsal crown reveal a bright magenta-white organ. Dark plates remain distinct; the aperture is confined to the central torso. Closing reverses the same prewarmed uniforms. |
| 7. Queen nests | Ribbed, rooted sacs with membranes and pulsing organs retain a torn husk after destruction. Prebuilt live/husk geometry shares the original footprint; retained husks are bounded and clear on room change. |
| 8. Passenger presence | Sixteen recessed, framed frost/glass windows contain asymmetric resting human forms with soft body shading, frost diffusion and individual life telemetry. Original procedural textures only; no external asset. |
| 9. Marking semantics | Freight floor shards become flush, chipped, matte industrial paint. Containment fields use violet lines attached to physical emitters. Warning red-orange remains associated with hazards, friendly cyan-white with the marine and ship systems. |
| 10. Floors | Lower normal/roughness contrast, broader material-scale variation, filtered grain and authored-deck anisotropy reduce repetitive highlights. Leak-driven wet patches replace broad maintenance wetness. Moving kiting/calm sequences accompany stills. |
| 11. Supplies | Larger bright medical cross, gold credits, bullet shapes, armor chevrons and grenade silhouettes on shallow bases, with restrained vertical locators. Contacts and beams share one shader family; semantic beam colors and gradients are uniforms. Fractional fades clamp their inputs to prevent HDR NaNs. |
| 12. Title | Marine weapon/lamp aim toward an approaching creature, with corrected creature contact shadow, occupied/lit pod displays, existing depth of field and slow drift. Focused suit light replaces broad display lighting; private stage-light uniforms dim the creature’s anatomy accents, and an occasional presentation-only threat animation honors reduced motion. Left-side logo space stays calm and dark. |
| 13. Environment stories | Communications: dark faces, localized LEDs/cables and less broad teal wash. Habitation: belongings, damaged seating and one flickering practical. Engineering: damaged equipment vent, steam and conduit sparks. Maintenance: drips and reflections around visible leaks. Story particles honor the existing atmosphere/reduced-motion controls. |

## Architecture and ownership

Equipment and organic details merge through the existing material bins. Shared primitives and finishes remain shared; per-room owned geometry/textures dispose with their room. Room material retention, shader readiness, bounded prepare-ahead, light topology and public debug fixtures remain in place. Source-anchored particles are excluded from the static room reflection capture. No gameplay decision depends on these visuals.

A budget correction unifies contact shadows and pickup locators through one shader source/defines, with mode/color uniforms; title glass uses the prepared mapped/emissive lighting family. It preserves the locator appearance rather than adding another program family. Player overlays borrow the actual skeleton and never dispose source skins or skeletons.

## Visual review and artifacts

Artifact root (all paths below are relative to this absolute directory):

`/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/`

The cited director evidence in `t3-637d1756` was viewed read-only before implementation. Its manifests record the same `3a7996e` baseline HEAD (some dist source fields were unrecorded); it is retained in place. Fixed-step capture timestamps include idle RAF/screenshot overhead, so these are visual/staging comparisons rather than pixel-identical simulation or balance evidence. Own baseline `x2-before` contains 344 native PNGs, including all twenty calm/kiting rooms in High/Low, bosses, supplies and title. Its manifest has no capture errors/failures. The initial embedded-gallery export exceeded the JavaScript string limit after all PNGs/manifest were written; the capture harness now uses file-linked galleries above 64 MiB. That original failed export log remains available.

Three critique/fix rounds:

1. `x2-round1`: 79 verified frames. Rejected flat brute cards, almost-black pod windows, loose-looking machine fittings, broad smooth growth pads/discs, broad reactor wash, weak violet fields and black HDR pickup squares.
2. `x2-round2`: 47 verified frames. Accepted the first corrections; rejected floating Queen anatomy, oversized growth bases and pictogram-like passenger silhouettes.
3. `x2-round3`: 17 verified frames. Embedded/hinged Queen anatomy, corrected growth proportions, branching roots and organic sleeping forms; final contrast and torso-aperture refinements follow the same review.

Every round has native images, exact area-reduced 480×270 images and motion sprite sheets. `x2-final-actors` adds 102 verified phase/status/High/Low/title frames. The full f3b1f67 pass is archived under matching `*-f3b1f67` directories. Fresh reviewers inspected all forty High/Low native calm views and eight exact480 sheets; they rejected remaining decorative infestation, broad communications wash and title display lighting. A fourth correction replaces those forms, exposes rack sides and softens sleeping figures. `x2-review4` (19 PNGs) and `x2-title-shadow` (9 PNGs) record the corrected native/480 review before the frozen acceptance rerun.

## Final visual acceptance

The frozen `0398bc3` application produced **464 verified native frames**, each with an exact area-reduced 480×270 counterpart. Every manifest has `errors: []` and `failures: []`. These are desktop 1920×1080 captures reduced for readability review; no phone/touch viewport or compatibility path was introduced.

| Matrix | Frames | Coverage |
|---|---:|---|
| `x2-final` | 201 | All twenty rooms calm High/Low; four kiting frames per room per tier; graphics recovery |
| `x2-final-phases` | 102 | Armored/exposed Queen, opening/closing boundaries, live nests/husks, supplies and title in both tiers; champion crowd; status crowd in both tiers; seven title drift frames |
| `x2-final-dense` | 140 | Seven full-kit kiting frames in each of ten environment moods, High and Low |
| `x2-final-reactor-motion` | 14 | Seven frames per tier, 600 ms presentation steps |
| `x2-final-floor-motion` | 7 | Original review's full Arc choreography in Containment Annulus |

The native calm and short-kiting views were inspected for all twenty rooms in both tiers. Dense frame 07 was inspected natively in all ten moods/two tiers, alongside exact480 sheets. Boss, supplies, title and status frames were inspected at native size and exact480. Opening/closing, title drift, reactor energy and moving Arc/floor highlights were judged from sprite sheets. Findings: the marine's cyan-white ring/keyline survives body overlap and bright frost; equipment reads as framed machinery rather than blank solids; comms is darker and more localized; core exposure opens/closes around a distinct magenta-white organ; nest destruction leaves a dark rooted husk. Fine authored deck/grille structure remains visible, but its broad sheen is subdued as the camera moves. The reactor's bright center and confined orange energy remain localized to its physical core.

The ten dense-room representatives are Passenger Vault (Cryogenics), Communal Atrium (Habitation), Crew Checkpoint (Security), Freight Hold (Cargo), Relay Racks (Communications), Safety-interlock Station (Engineering), Coolant Plant (Maintenance), Swarm Junction (Infested), Containment Annulus (Containment), and Overload Floor (Reactor).

Native galleries (each links the exact480 review):

- [x2-before](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/x2-gallery.html)
- [x2-final](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final/x2-gallery.html)
- [x2-final-phases](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-phases/x2-gallery.html)
- [x2-final-dense](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-dense/x2-gallery.html)
- [x2-final-reactor-motion](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-reactor-motion/x2-gallery.html)
- [x2-final-floor-motion](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-floor-motion/x2-gallery.html)

## Verification contracts

Presentation-specific tests were replaced or updated with equivalent behavioral guarantees:

- Health-bar pixel expectations follow the larger backed bars; damaged/elite visibility, projection and native contracts remain.
- Queen exposure expectations use magenta/core-focused emission, while flash caps, freezing, reset and pool ownership remain checked. Added gradual opening/closing, rigid plate-side and central-aperture coverage.
- Pickup shape/finish checks move to the dedicated pickup suite and retain the four-draw limit, distinct silhouettes, native transforms and disposal checks, with additional semantic colors and locator coverage.
- World dressing support recognizes existing solid void footprints as well as obstacle rectangles; raised-vertex bounds and material/triangle limits remain.
- Organic practical tests replace evenly-spaced origin pins with deterministic, irregular wall anchoring. Lighting tests retain hue, origin, Low-tier and disposal guarantees with the smaller motivated falloff.
- Shared growth/field finishes are recognized as shared owners; owned room materials still dispose exactly once. Original authored furniture/spindle safety assertions remain unchanged and were fixed through geometry placement.

Cinematic light assertions now require the same fixed light topology as gameplay, with combat/muzzle/blast radiance zeroed on menu entry and after late VFX updates. Mesh, projectile and actor layer isolation assertions remain. Previously hiding those light slots produced menu-only shader variants; retaining zero-energy slots removes that variant race without adding lights or resources. High dynamic/disabled light counts remain 16/5, Low 5/3.

The broad-green infested-key pin is replaced with a neutral-key bound, a green local practical and its short range, retaining fill/rim, origin, tier, topology and disposal checks. Rack tests now require vent/LED first-hits from all four axes/directions below the roof, while retaining the triangle/material caps. Title-stage shading has per-actor isolation and pool-reset tests.

No simulation, persistence, accessibility, keyboard/mouse, resizing, context recovery, navigation or authored-room safety assertion was removed.

## Remaining limits

Blender is not installed. The Python asset chain reaches the unchanged monitor artifact test and fails with `FileNotFoundError: blender`; no asset/test was changed to bypass it. The aggregate `npm run verify` therefore cannot be honestly reported as passing even when its JavaScript/browser gates pass separately.

This host is shared. Baseline load was roughly 550–690 on ten logical cores; final timings must be read with their recorded host loads. Raw measurements are scenario comparisons, not a claim of quiet-machine frame performance. Existing mesh anatomy and ability effects remain part of the baseline; severe full-screen frost can still mask family surface color, while the separate silhouette/crown/plates remain available.

Specific partials and work not done:

- **Items 3–4, authored fidelity:** procedural kit density, chamfered housings, recessed frames and shared finishes are implemented; a new trim-sheet atlas and individual hero-quality replacement of every prop are not. Existing material bins/triangle caps and the no-external-assets constraint were preserved. Infestation now connects irregular sacs, roots, membranes and consumed fixtures, but retains a visibly stylized, coarse procedural surface and three bounded sac bins.
- **Items 5 and 10, motion:** alarm energy moves through animated intensity, and the reactor cage/bands/embers animate; no separate mechanically rotating lamp mesh was added. Floor shimmer is reduced, not eliminated on every authored fine grille under all angles. Heat refraction uses the existing High-tier effect and its reduced-motion guards; Low preserves the core/structure without this expensive post effect.
- **Items 6–8, anatomy:** Queen plates/core and rooted nest husks are implemented with procedural additions on the retained model. Passenger bodies are restrained procedural silhouettes behind glass, not modeled/animated humans. Their repeated resting pose and the Queen's simplified crown remain art limitations.
- **Item 12, title:** confrontation, focused aim/light, lit occupants, depth of field, threat animation and drift are implemented. The creature does not translate along a new approach path; a fixed stage position preserves the calm left-side composition. It is dimmed into the set rather than fully hidden until an entrance cue.
- **Method:** no separate manual desktop play session was completed. The attempted optional desktop-control step was interrupted; the lead explicitly prohibited further computer-use tools. Native keyboard/mouse, resize, persistence, recovery and authored-room behavior are covered by the passing desktop browser gates. Remaining motion judgments were completed from saved sprite sheets as instructed.
- **Budgets:** overall peak draws/programs and observed final CPU p95 pass the measured cohort, with zero combat compiles. Per-scenario draws sometimes rise, retained median readiness rises 1.6%, and earlier timing outliers remain. Thus an absolute no-regression claim for every individual statistic or shared-host CPU behavior is not justified; see the raw tables below.

## Before / after image paths

| Review item | Before (native PNG) | After (native PNG) |
|---|---|---|
| Marine overlap | [combat-kiting-passenger-vault-07.png](/Users/chernodub/.t3/worktrees/containment-game/t3-637d1756/artifacts/nextgen/r5-world-1/combat-kiting-passenger-vault-07.png) | [combat-kiting-passenger-vault-07.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-dense/combat-kiting-passenger-vault-07.png) |
| Enemy / champions | [g2-champions-armory-03.png](/Users/chernodub/.t3/worktrees/containment-game/t3-637d1756/artifacts/nextgen/r5-ui1080/g2-champions-armory-03.png) | [g2-champions-armory-03.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-phases/g2-champions-armory-03.png) |
| Equipment | [g2-calm-high-relay-racks.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-calm-high-relay-racks.png) | [g2-calm-high-relay-racks.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final/g2-calm-high-relay-racks.png) |
| Infestation | [g2-calm-high-swarm-junction.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-calm-high-swarm-junction.png) | [g2-calm-high-swarm-junction.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final/g2-calm-high-swarm-junction.png) |
| Reactor | [g2-calm-high-overload-floor.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-calm-high-overload-floor.png) | [g2-calm-high-overload-floor.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final/g2-calm-high-overload-floor.png) |
| Queen exposed | [g2-queen-exposed-reactor-vault-05.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-queen-exposed-reactor-vault-05.png) | [g2-queen-exposed-reactor-vault-05.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-phases/g2-queen-exposed-reactor-vault-05.png) |
| Nest / husk | [g2-queen-exposed-reactor-vault-05.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-queen-exposed-reactor-vault-05.png) | [x2-nest-husk-high-reactor-vault-07.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-phases/x2-nest-husk-high-reactor-vault-07.png) |
| Passengers | [g2-calm-high-passenger-vault.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-calm-high-passenger-vault.png) | [g2-calm-high-passenger-vault.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final/g2-calm-high-passenger-vault.png) |
| Freight paint | [g2-calm-high-freight-hold.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-calm-high-freight-hold.png) | [g2-calm-high-freight-hold.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final/g2-calm-high-freight-hold.png) |
| Floor motion | [v2-full-arc-containment-annulus-containment-annulus-sprite.png](/Users/chernodub/.t3/worktrees/containment-game/t3-637d1756/artifacts/nextgen/r5-abilities-arc/v2-full-arc-containment-annulus-containment-annulus-sprite.png) | [v2-full-arc-containment-annulus-containment-annulus-sprite.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-floor-motion/v2-full-arc-containment-annulus-containment-annulus-sprite.png) |
| Supplies | [g2-pickups-awakening-bay.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-pickups-awakening-bay.png) | [g2-pickups-awakening-bay.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-phases/g2-pickups-awakening-bay.png) |
| Title | [title.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/title.png) | [title.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final-phases/title.png) |
| Room stories | [g2-calm-high-infested-workshop.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-before/g2-calm-high-infested-workshop.png) | [g2-calm-high-infested-workshop.png](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-final/g2-calm-high-infested-workshop.png) |

## Measured budgets

[Observed comparison chart](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/acceptance-comparison.html).

Both builds run serially in hardware Chromium/ANGLE Metal at 1920×1080. Combat trials are sixteen matched 20-second wall-time native encounters (two rooms × four rigs × High/Low), one repeat each, with 25 replenished enemies and real ability receipts. The room audit covers 21 fresh pages and the same 21-room retained sequence, including the legacy boss room. Dist snapshots identify application source; JSON `sha` records the orchestrating checkout at invocation time.

| Metric | Original | Final application |
|---|---:|---:|
| All-twenty-room heavy Arc scan, peak draws | 243 | 242 |
| Sustained-combat peak draws | 323 | 301 |
| Sustained-combat maximum retained programs | 171 | 164 |
| Fresh-room maximum programs | 187 | 179 |
| Retained-session maximum programs | 205 | 196 |
| Post-ready / combat compiles (21 fresh + 21 retained checks) | 0 / 0 | 0 / 0 |
| Combat compiles (16 native trials) | 0 | 0 |
| Worst CPU p95, ms | 27.4 | 17.3 |
| Fresh readiness median, ms | 446.1 | 431.1 |
| Fresh readiness worst, ms | 1687.4 | 1159.8 |
| Sequential readiness median, ms | 631.0 | 641.2 |
| Sequential readiness worst, ms | 2435.0 | 1302.2 |

Final combat has `errors: []`, `budgetFailures: []`, all native ability receipts, stable light/instance inventories, no GL/context errors and zero mid-combat compiles. Worst-case draws remain below 330. Every matched CPU p95 was lower in this final cohort, but the shared host load changed from roughly 558–691 to 11–27 on ten logical cores. These results do **not** establish a causal hardware speedup or certify the 8 ms CPU / 60 fps target. Individual scenario peak draws can rise even though the overall peak falls; see the complete table.

The full final room audit initially had one retained Overload Floor timing outlier, **4030 ms** against the 3000 ms gate; all program/compile guards passed at 196 programs. The isolated predecessor→Overload rerun passed at **1825 ms**, then the entire 21-room retained sequence passed with the stricter original-worst **2435 ms** ceiling and 205-program cap (worst 1302.2 ms). The table uses the 21 fresh rows from the initial final audit and the complete retained recheck. All raw failures remain saved. Median retained readiness rose by 10.2 ms (1.6%); strict no-regression in every timing statistic is therefore not established.

The all-room Arc scan uses application `71dcd20`; later application edits affect title aim and cinematic light topology only. The final sixteen native trials and all 42 room-readiness checks use frozen application `0398bc3`. Prepare-ahead, compile-pass/material guards and readiness thresholds are unchanged.

Earlier paired CPU rechecks remain in `x2-cpu-paired-before` / `x2-cpu-paired-final`: baseline Breacher 13.3/16.3 and Arc 13.8/21.1 ms, versus then-final 29.0/21.8 and 15.9/19.6 ms. Host load rose from 126–174 to 635–795, preventing attribution. A pre-topology native run stopped after one trial failed to record dash/overdrive under extreme wall-time slowdown; the isolated four-trial recheck and subsequent complete sixteen-trial final run both passed without relaxed assertions. A GPU-finish diagnostic did not establish queued GPU work as the cause. These exploratory failures are retained, not overwritten.

| Matched trial | CPU p95 ms before → after | Peak draws before → after | Combat compiles |
|---|---:|---:|---:|
| awakening-bay-breacher-high-0 | 27.4 → 17.3 | 282 → 287 | 0 |
| awakening-bay-breacher-low-0 | 11.5 → 10.0 | 169 → 163 | 0 |
| awakening-bay-cryo-high-0 | 23.9 → 15.9 | 323 → 301 | 0 |
| awakening-bay-cryo-low-0 | 11.5 → 8.9 | 182 → 176 | 0 |
| awakening-bay-pyro-high-0 | 24.5 → 16.4 | 301 → 301 | 0 |
| awakening-bay-pyro-low-0 | 12.9 → 10.9 | 178 → 181 | 0 |
| awakening-bay-arc-high-0 | 19.0 → 14.2 | 278 → 282 | 0 |
| awakening-bay-arc-low-0 | 10.3 → 8.1 | 154 → 153 | 0 |
| crew-checkpoint-breacher-high-0 | 22.9 → 14.6 | 238 → 228 | 0 |
| crew-checkpoint-breacher-low-0 | 9.6 → 8.5 | 130 → 139 | 0 |
| crew-checkpoint-cryo-high-0 | 22.1 → 15.3 | 267 → 249 | 0 |
| crew-checkpoint-cryo-low-0 | 9.9 → 8.4 | 162 → 154 | 0 |
| crew-checkpoint-pyro-high-0 | 23.1 → 14.9 | 255 → 253 | 0 |
| crew-checkpoint-pyro-low-0 | 11.1 → 9.2 | 151 → 151 | 0 |
| crew-checkpoint-arc-high-0 | 13.9 → 10.8 | 203 → 204 | 0 |
| crew-checkpoint-arc-low-0 | 8.4 → 6.9 | 129 → 128 | 0 |

Raw evidence:

- [x2-bench-before/benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-bench-before/benchmark.json)
- [x2-bench-final/benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-bench-final/benchmark.json)
- [x2-rooms-before/rooms.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-rooms-before/rooms.json)
- [x2-rooms-topology-final/rooms.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-rooms-topology-final/rooms.json)
- [x2-rooms-overload-isolated/rooms.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-rooms-overload-isolated/rooms.json)
- [x2-rooms-sequential-recheck/rooms.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-rooms-sequential-recheck/rooms.json)
- [x2-bench-native-isolated/benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-bench-native-isolated/benchmark.json)
- [x2-bench-final-71dc-failed/benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-bench-final-71dc-failed/benchmark.json)
- [x2-rooms-acceptance-71dc-failed/rooms.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-rooms-acceptance-71dc-failed/rooms.json)
- [x2-cpu-paired-before/benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-cpu-paired-before/benchmark.json)
- [x2-cpu-paired-final/benchmark.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-cpu-paired-final/benchmark.json)
- [x2-scan-final/room-ranking.json](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2-scan-final/room-ranking.json)

## Gate results

`npm ci` and the initial build completed before implementation. No dependency or lockfile changed. All final JavaScript/browser gates below completed on the same application `0398bc3` before the optional manual-preview interruption. The resume changed documentation only, so those successful checks were not repeated without a source change. The aggregate verify failure and all raw logs remain intact.

| Command | Final result / exact summary |
|---|---|
| `VITEST_MAX_WORKERS=1 npm run verify` | **Blocked by missing Blender**, exit 1 after JavaScript: `Test Files 228 passed | 1 skipped (229)`; `Tests 2680 passed | 1 skipped (2681)`. Asset chain's unchanged monitor test: `FileNotFoundError: [Errno 2] No such file or directory: 'blender'`; `FAILED (errors=1)`. |
| `VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs --no-file-parallelism` | **PASS**: `Test Files 228 passed | 1 skipped (229)`; `Tests 2680 passed | 1 skipped (2681)`; `Duration 121.68s`. Serial files retain all assertions while limiting the shared host. |
| `node --test scripts/cryo-model-preview.test.mjs` | **PASS**: `tests 2`, `pass 2`, `fail 0`. |
| `npm run build` | **PASS**: TypeScript check and Vite production build; `built in 496ms`. Existing large-chunk warning remains. |
| `npm run test:room-evidence` | **PASS**: `tests 28`, `pass 28`, `fail 0`; ragdoll self-test `{"passed":true,"cpuOnly":true,"checks":33}`. |
| `npm run test:smoke` | **PASS**: `Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.` Graphics selection, checkpoint failure/recovery, rig native receipts and audio wiring phases also pass. |
| `npm run test:authored-smoke:all -- --rooms=<all twenty IDs>` | **PASS**: 20/20 distinct desktop room receipts, real keyboard move/fire, every `errors: []`; Overload Floor retains explicit fatal authorization. Explicit IDs expand the script's default subset to every authored room. |
| `npm run bench -- --label=x2-bench-final --dist=artifacts/nextgen/x2/topology-dist --dist-source-sha=0398bc3 --no-build --rooms=awakening-bay,crew-checkpoint --repeat=1` | **PASS**: 16/16 native trials, peak 301 draws, max 164 programs, worst CPU p95 17.3 ms, all combat compiles 0, `errors: []`, `budgetFailures: []`. |
| `npm run bench:rooms -- --label=x2-rooms-topology-final --dist=artifacts/nextgen/x2/topology-dist --dist-source-sha=0398bc3 --no-build --max-programs=205` | All 21 fresh rooms and all compile/program/material guards pass. Retained Overload timing outlier 4030 ms is retained and rechecked below. |
| `npm run bench:rooms -- --label=x2-rooms-sequential-recheck --dist=artifacts/nextgen/x2/topology-dist --dist-source-sha=0398bc3 --no-build --modes=sequential --max-programs=205 --max-ms=2435` | **PASS**, exit 0: 21/21 retained rooms, peak 196 programs, worst 1302.2 ms, all combat/post-ready compiles 0, `errors: []`, `failures: []`. |

Final gate logs:

- [verify-acceptance.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/verify-acceptance.log)
- [vitest-acceptance.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/vitest-acceptance.log)
- [model-preview-acceptance.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/model-preview-acceptance.log)
- [build-acceptance.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/build-acceptance.log)
- [room-evidence-acceptance.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/room-evidence-acceptance.log)
- [smoke-acceptance.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/smoke-acceptance.log)
- [authored-acceptance.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/authored-acceptance.log)
- [bench-final-0398.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/bench-final-0398.log)
- [rooms-topology-final.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/rooms-topology-final.log)
- [rooms-sequential-recheck.log](/Users/chernodub/.t3/worktrees/containment-game/t3-68ccb24f/artifacts/nextgen/x2/rooms-sequential-recheck.log)

The owned Vite preview process was stopped on resume. No desktop-control tool was used after the lead’s instruction. No push or PR was created.
