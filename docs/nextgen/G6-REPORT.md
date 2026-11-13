# G6 — environment construction and usable combat viewport

Worktree branch `t3/environment-camera-art`. Baseline `84c0c66c1e2e1e1ceecb768038ce4a362b695159`. Original propagated application freeze is `e10c20291316465340dc305346e84a3e2a4076df`; its harness freeze is `4f9fb1a9e89670a69be7485e2504219490969ae0` (identical src trees). The lead reviewed that `g6-final` gallery and accepted Residential Gallery while rejecting infested values and separate growth masses. That gallery is preserved as pre-correction evidence. Final application source is `5f42324e671c13d2b121b44b842fd5c2944dc732`; the report-only delivery HEAD is recorded in the handoff and `artifacts/nextgen/g6-standard/DELIVERY.txt`. All work stays local: no push/PR, no computer-use, no other-worktree mutation, no simulation/UI/actor/ability edit, no dependency or license change, no phone controls/captures/gates.

## Standard and critique

The standard was established on Residential Gallery, Transmission Chamber and Swarm Junction before delegation or propagation. Three separate15-PNG production captures retain calm and four-frame kiting views at native1920×1080, exact area-reduced480×270 and native/480 grayscale. All manifests retain errors/failures. Working-round provenance is explicitly identified as working source, not a committed application SHA; round2/3 patches, construction source and SHA256 receipts are retained alongside frozen builds.

Root: `/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-standard/`. `before`, `round1`, `round2`, `round3` are local links to the unchanged harness galleries. Critique ledger: `standard-critique.md`.

1. Round1: domestic staggered courses and relay access cassettes improve grayscale identity. Reject the repeated louvre rake, bright lime tissue sheet and clipped-flat growth silhouette.
2. Round2: dark mauve curved tissue consumes machinery; quiet interrupted spill replaces the rake. Reject identical aperture grammar on every fixture and low construction disappearing behind retained parapets.
3. Round3: distinct domestic doorway spill, relay grille and crooked low-energy biological slit; visible outboard construction and larger supported story clusters. Self-approved for propagation, then explicitly superseded by the lead review of the biological rooms. See the correction ledger below. No independent biological art approval is claimed.

The lead correction adds further preserved rounds: `g6-lead-round1`, incomplete `g6-lead-round2`, `g6-lead-round3`, `g6-lead-candidate`, intentionally stopped `g6-corrected`, and `g6-last-standard`. The short standard has25native PNGs plus exact480/grayscale derivatives; the native review recovers readable deck values, machine wrapping and a hull silhouette. Rejected pale/sawtooth floor membranes are replaced by one flat dark tapered skin. Final application source is `5f42324e671c13d2b121b44b842fd5c2944dc732`; `infested-stable-dist/SOURCE_SHA` pins the immutable acceptance build. Later corrections preserve the authored gain cap4.5 and hold the longer Swarm burst at floor medians50.7–57.2, with p5 values20.2–24.2. The final all20 gallery is reported below.

Read-only references: all20 final2 calm rooms and all80 organic mid-fight frames were inspected as PNGs. Four original rig contact sheets live in the standard root. No original evidence was rewritten.

## What changed

- Fixed four-source practical topology now feeds elongated strip, doorway/aperture, grille, organic slit and core-shaft shapes through one retained bounce draw. Real fixture orientation also shapes floor irradiance. Floor peaks yield to actor contrast; Low retains two sources and leaves packed suit-fill/muzzle slots unmasked. Props retain actual key shadows; the existing shared-key practical occlusion is still an artistic approximation, not a new per-fixture shadow atlas.
- Cryo fixtures are longer pod-supply strips, communications fixtures are short rack task lights, maintenance fixtures are longer fluorescent housings. Breached cargo sources visibly lose power, with matching source-energy gains. No perfect-disc practical-bounce kernel remains. The marine's readable local suit-fill vicinity remains broad.
- Ten floor/wall fabrication grammars and one objective/story-tied narrative cluster per room use existing writer finishes. Raised additions are constrained to original obstacle/void solids or outboard of the actual hull. Flat additions require real supported deck. No collision, navigation or template changed. All20 story-room12k dressing triangle caps and story-display sightlines remain; the Queen retains its pre-existing larger cap.
- Infested Workshop, Swarm Junction, breached cargo and Queen each receive two machine-consuming forms and one climbing hull web, with supported flat membranes connecting architecture. The revision removes standalone boulder spheres. Physical growth wounds feed the existing practical slots; surviving human strips fail beneath the cover. Raised support and material-batch tests remain.
- Renderer-only HUD-aware camera reserves usable CSS viewport space, uses bounded aim and nearby/engaged threat weighting, fits the engagement before falling back to the most urgent pair, and protects the marine inside that viewport. Existing pointer picking and bounds use the actual rendered camera.

The checked-out `docs/nextgen/reviews/R7-verdict.md` is25lines and contains no per-environment table. The explicit B3/B4/B5/B7/B12 defects, vision's ten moods and G4 follow-up table were used; no unseen table is claimed as implemented.

## Environment follow-ups

| Environment | Construction and concrete follow-up |
|---|---|
| Cryogenics | Sealed pressure cassettes, narrow pod courses and supply gutters; abandoned emergency-release tools / occupied life-support service index. |
| Habitation | Staggered domestic strip deck and deep cabin thresholds; opened arrival luggage and interrupted garden-arrival trays. |
| Security | Armored bays and crosswise inspection stops; spent magazines/braces and opened issue cases with empty equipment sockets. |
| Cargo | Broad freight plates, rail guides and paired load-bearing ribs; displaced cargo lids/manifests, sealed scar swallowing repair panels, failing sodium sources. |
| Communications | Access cassettes, stacked cable buses and a trench spine; removed relay/uplink service cassettes around the retained dish landmark. |
| Engineering | Service grate channels and interrupted overhead runs; independent/locked recorders retain full reading surfaces. |
| Maintenance | Drain covers and horizontal coolant headers; cut pressure union/displaced cover and disconnected local-power bridge, retaining leak-local floor response. |
| Infested | Broken transit panels and slumped living bulkheads; human machinery loses its original silhouette under larger asymmetric masses. |
| Containment | Clinical gasket joints and sealed shield sectors; abandoned calibration jig and unarmed mechanical authorization seals, retaining quiet traversal. |
| Reactor | Segmented heat deck and heavy thermal buttresses; manual key/service-cover remains and burnt terminal sequence, preserving the incandescent core landmark. |

## Renderer integration contract

`renderer.setHudInsets({top,right,bottom,left})` accepts four CSS-pixel numbers. Default is all zero. Non-finite/negative values become zero. Oversized opposing sums are proportionally clamped to preserve at least35% of each viewport dimension; original requests are retained and re-clamped on desktop resize. `hudInsets` returns the effective readonly values. `combatFramingDiagnostics` returns a retained receipt with selected IDs, priority contact, complete-group/pair fallback, fit and pullback.

The UI lead must call this method through its adapter with feature detection whenever the HUD's reserved extents change. No UI file changed here. The existing opt-in `window.__containmentDebug.renderer` exposes the same API; no new global was added. `g6-calm` / `g6-kiting` use0/300/160/280 at1080p, scaled to the actual CSS viewport. Native pointer picking, `visible`, `playerScreenBounds`, cached viewport dimensions, boss framing, reduced motion and resizing remain renderer contracts. The caller resets all insets to0 when reserved HUD regions disappear; requested values otherwise persist through room changes and are re-clamped on resize.

The render-free bot CameraObserver remains unchanged outside this stream's ownership. Its existing zero-inset/no-engagement parity checks pass, but live engagement framing now differs during fights. Updating that observer is an integration request before pooling new render-free policy results with old cohorts.

## Gates, budgets and final evidence

Final review selection:132 High PNGs and19 Low PNGs, with native grayscale and exact area-reduced480×270 derivatives. Raw captures are immutable; `source-receipts.json` records each selected original absolute path and SHA256. Complete primary and affected-room captures share seed, viewport, HUD reservations and step contract; duplicate scenario/room/frame/simulation/presentation clocks are asserted equal before byte-for-byte copy. The selection retains the separate capture sources and their immutable receipts. The final context-specific corrections are room fill, biological source colors, upward floor-skin winding and the infested floor shader branch; unchanged rooms retain their original primary evidence.

Across151 saved projection receipts:0 marine/HUD bounds violations and0 selected enemy-snapshot engagement body bounds violations. Queen armored/exposed frames were visually checked separately; the contact-bounds audit does not substitute for a Queen mesh-bounds test. Three conservative fit flags remain (two High, one Low, Transmission); actual8-corner body bounds are inside the usable viewport. All chosen source captures have errors[]/failures[]. Rejected/incomplete calibration folders and the failed smoke attempt remain separately preserved. No new organic campaign or per-frame60fps guarantee is inferred from staged PNGs.

## First PNGs to review

- [Final three-room standard](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-standard/final-three-room-standard.png).
- [Residential construction](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-residential-gallery.png).
- [Relay construction](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-transmission-chamber.png).
- [Consumed machinery](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-swarm-junction.png).
- [Armory engagement](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-armory-02.png).
- [Coolant engagement](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-coolant-plant-02.png).
- [All six camera cases at480](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/review-pages/g6-kiting-1.png).
- [Floor construction without props](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-standard/floor-construction-gray.png). Native crop coordinates are retained in the adjacent JSON; no props were painted out.
- [Grayscale identities](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/calm-grayscale-identity.png).

## Final floor luminance — all twenty rooms

sRGB Rec.709 code values 0–255; 70×70 uniform world grid; canStand radius12 excludes obstacle/void footprints; projected deck y=.04m within canvas x15–85%,y20–80%; hero legal floor within3m. When available, world-mesh raycast excludes occluding surfaces above.085m; per-row surfaceMask records legacy fallback to legal grid including occluders; PNG samples retain shadows, flush marks, ink and effects. Raw legal-grid histogram including occluders is retained separately. Calm simulation0ms; kiting frame02 same native fixture clocks. No exposure normalization.

Each tuple is p5 / median / p95, in0–255 sRGB code values. Kiting is G2 frame02; the last column retains the full four-frame median range. Hero values sample visible legal floor within3m. No exposure normalization or screenshot retouching.

| Room | Calm floor | Kiting floor | Hero calm / kite | Kiting median range |
|---|---:|---:|---:|---:|
| awakening-bay | 28.8 / 50.8 / 114 | 24.1 / 49 / 106.3 | 72.8 / 78 | 46–49.5 |
| passenger-vault | 25.9 / 56.3 / 104.4 | 19.3 / 50.1 / 99.4 | 73.1 / 88.3 | 50.1–51.6 |
| residential-gallery | 29.7 / 49.1 / 115.8 | 30.6 / 48.9 / 117.2 | 76.9 / 71.8 | 48.9–49.7 |
| communal-atrium | 28.7 / 53.3 / 123.8 | 26.5 / 49.9 / 124 | 76 / 82.5 | 49.8–51.2 |
| crew-checkpoint | 29.2 / 54.3 / 115.4 | 23 / 54.7 / 140.7 | 95 / 84.3 | 54.4–56.2 |
| armory | 23.4 / 52.3 / 83.8 | 23.8 / 52.2 / 87.6 | 74.9 / 75.5 | 50.3–52.3 |
| freight-hold | 23 / 48.3 / 119.4 | 22 / 52 / 136.8 | 86.4 / 94.3 | 50.1–52.2 |
| breached-loading-bay | 24.6 / 52.4 / 115.1 | 20.7 / 53.9 / 105.9 | 86.5 / 81 | 48.1–55.3 |
| relay-racks | 27.6 / 55.8 / 101.1 | 22.6 / 54 / 97.9 | 91.8 / 91.3 | 54–54.4 |
| transmission-chamber | 12.5 / 49.7 / 80.7 | 4.8 / 48.9 / 82.5 | 70.8 / 67.8 | 48.8–48.9 |
| diagnostic-gallery | 31.5 / 56.9 / 115.4 | 26.7 / 49.2 / 102.8 | 80.3 / 80.5 | 49.2–51.9 |
| safety-interlock-station | 27.2 / 49 / 112.6 | 21.9 / 48.4 / 92.4 | 73.3 / 78.7 | 45.1–48.4 |
| coolant-plant | 23.7 / 52.3 / 117.2 | 23.2 / 52.5 / 118.1 | 83.6 / 85.8 | 52.5–54 |
| service-shaft-landing | 23.9 / 55 / 158.7 | 19.6 / 50.5 / 89.1 | 78.6 / 57 | 50.5–52.1 |
| infested-workshop | 31.7 / 66.7 / 98.2 | 22.2 / 60.1 / 96.3 | 86.3 / 86.2 | 57.8–61 |
| swarm-junction | 32 / 64.2 / 104.9 | 25.6 / 60.2 / 93.1 | 89.4 / 86.3 | 59.4–61.8 |
| shielding-gate | 29.2 / 57.1 / 133.3 | 29.3 / 61.3 / 177.2 | 101.3 / 93.7 | 59–61.3 |
| containment-annulus | 25.9 / 63.7 / 154.8 | 25.7 / 66.7 / 175 | 110.1 / 93.2 | 60.7–66.7 |
| manual-control-chamber | 32.5 / 54 / 124.9 | 20.1 / 49.4 / 117 | 71.9 / 59.9 | 48.6–49.5 |
| overload-floor | 15.6 / 50.5 / 76.6 | 19.1 / 49 / 79.3 | 60.8 / 61.2 | 46.2–49 |

Representative medians: 48.3–66.7; p5: 4.8–32.5; hero-vicinity medians: 57–110.1. The nominal p5 target12–28 is not a strict pass on every frame. All exceptions remain in final-value-summary.json. Ink, shadows and combat effects are retained.

[Raw all-frame values](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/deck-luminance.json) · [selection receipts](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/source-receipts.json).

## All twenty before/after paths

All links are absolute original1920×1080 PNGs. Before=`g6-before`; after=`g6-final`. Matched calm/G2 staging clocks are retained; after explicitly reserves0/300/160/280 CSS pixels. Kiting selects frame02; every original four-frame sheet remains alongside.

| Room | Calm before | Calm after | Kiting before | Kiting after |
|---|---|---|---|---|
| awakening-bay | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-awakening-bay.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-awakening-bay.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-awakening-bay-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-awakening-bay-02.png) |
| passenger-vault | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-passenger-vault.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-passenger-vault.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-passenger-vault-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-passenger-vault-02.png) |
| residential-gallery | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-residential-gallery.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-residential-gallery.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-residential-gallery-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-residential-gallery-02.png) |
| communal-atrium | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-communal-atrium.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-communal-atrium.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-communal-atrium-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-communal-atrium-02.png) |
| crew-checkpoint | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-crew-checkpoint.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-crew-checkpoint.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-crew-checkpoint-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-crew-checkpoint-02.png) |
| armory | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-armory.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-armory.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-armory-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-armory-02.png) |
| freight-hold | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-freight-hold.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-freight-hold.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-freight-hold-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-freight-hold-02.png) |
| breached-loading-bay | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-breached-loading-bay.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-breached-loading-bay.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-breached-loading-bay-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-breached-loading-bay-02.png) |
| relay-racks | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-relay-racks.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-relay-racks.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-relay-racks-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-relay-racks-02.png) |
| transmission-chamber | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-transmission-chamber.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-transmission-chamber.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-transmission-chamber-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-transmission-chamber-02.png) |
| diagnostic-gallery | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-diagnostic-gallery.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-diagnostic-gallery.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-diagnostic-gallery-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-diagnostic-gallery-02.png) |
| safety-interlock-station | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-safety-interlock-station.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-safety-interlock-station.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-safety-interlock-station-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-safety-interlock-station-02.png) |
| coolant-plant | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-coolant-plant.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-coolant-plant.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-coolant-plant-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-coolant-plant-02.png) |
| service-shaft-landing | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-service-shaft-landing.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-service-shaft-landing.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-service-shaft-landing-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-service-shaft-landing-02.png) |
| infested-workshop | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-infested-workshop.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-infested-workshop.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-infested-workshop-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-infested-workshop-02.png) |
| swarm-junction | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-swarm-junction.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-swarm-junction.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-swarm-junction-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-swarm-junction-02.png) |
| shielding-gate | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-shielding-gate.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-shielding-gate.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-shielding-gate-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-shielding-gate-02.png) |
| containment-annulus | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-containment-annulus.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-containment-annulus.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-containment-annulus-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-containment-annulus-02.png) |
| manual-control-chamber | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-manual-control-chamber.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-manual-control-chamber.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-manual-control-chamber-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-manual-control-chamber-02.png) |
| overload-floor | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/combat-calm-overload-floor.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/combat-calm-overload-floor.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/g2-kiting-high-overload-floor-02.png) | [PNG](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g2-kiting-high-overload-floor-02.png) |

Queen: [before](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/boss-reactor-vault-02.png) / [after](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/boss-reactor-vault-02.png). Grayscale identity: [before](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-before/calm-grayscale-identity.png) / [after](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/calm-grayscale-identity.png).
Queen exposed-phase deck p5 / median / p95 is19.8 /49.1 /69.3; hero-vicinity median56.7. Its final growth and moonlit fill are visible in the native exposed-phase capture, while the linked boss frame preserves the original before/after staging.

Six longer staged kiting sheets use the same native game actions plus650ms lead-in, not organic campaign outcomes:

- [residential-gallery](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-residential-gallery-sprite.png) ([native frame02](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-residential-gallery-02.png)).
- [transmission-chamber](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-transmission-chamber-sprite.png) ([native frame02](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-transmission-chamber-02.png)).
- [swarm-junction](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-swarm-junction-sprite.png) ([native frame02](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-swarm-junction-02.png)).
- [armory](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-armory-sprite.png) ([native frame02](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-armory-02.png)).
- [coolant-plant](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-coolant-plant-sprite.png) ([native frame02](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-coolant-plant-02.png)).
- [overload-floor](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-overload-floor-sprite.png) ([native frame02](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-evidence/g6-kiting-overload-floor-02.png)).


## Verification receipts

```text
npm ci: added 61 packages; completed; no dependency/lockfile changes.
VITEST_MAX_WORKERS=2 npm run verify:
  Test Files  283 passed | 1 skipped (284)
  Tests       3308 passed | 1 skipped (3309); Duration 159.69s
node --test scripts/cryo-model-preview.test.mjs: tests 2; pass 2; fail 0.
npm run build: TypeScript + Vite production build passed.
npm run test:room-evidence: tests 28; pass 28; fail 0.
  Ragdoll CPU self-test: {passed:true,cpuOnly:true,checks:33}.
npm run test:smoke: Browser smoke passed: desktop, production Pages subpath,
  assets, fire, weapon switch, pause/resume, credits.
  Native input, resizing, recovery, checkpoint feedback and audio assertions pass.
npm run test:authored-smoke:all -- --rooms=<all20 explicit story IDs>:
  20/20 native desktop movement/fire receipts, all errors:[];
  Overload retains explicitFatalAuthorization:true.
High selection:132 PNGs; Low selection:19 PNGs; all chosen source captures errors:[]; failures:[].
Projection audit:151 frames; marineFailures0; selectedBoundsFailures0.
```

`verify` exits1 at the unchanged `test_monitor_artifacts.py` Blender invocation (`FileNotFoundError: 'blender'`). Later Python stages are not claimed as run. Blender, Python tests and GLB assets were not modified or bypassed. The independent JavaScript/browser gates above were run after that stop. Gate logs live under `artifacts/nextgen/g6-standard/`. Acceptance smoke initially recorded an aborted Passenger equipment GLB request during a route transition; `acceptance-smoke-isolated.log` passes unchanged strict error assertions after an isolated rerun. No gameplay, persistence, input or accessibility assertion was relaxed. The previously missed Diagnostic gain4.6 was reduced to the existing4.5 guard; that guard was retained.

## Assertion changes

- PracticalPools’ old circular-radius pin becomes elongated/interrupted aperture shape and smaller-reactor-footprint coverage. Hue, physical origins, High/Low inventory, upload stability and disposal assertions remain.
- PracticalOcclusion’s cache-key pin changesv6→v7 for the floor-shape branch; existing key-shadow/actor/dynamic-light guarantees remain, with additive Low packed-slot coverage.
- WorldDressing’s raised-only-inside-obstacle pin now allows an original obstacle/void solid OR outboard of the actual hull, as required by the visual-only brief. Every interior-navigation vertex guarantee and all20 story-room12k triangle/material caps remain; Manual Control joins the119-ray display checks.
- Lead correction supersedes the old universal4–6 key/fill ratio: non-reactor moods retain2–6 directional contrast; reactor retains.8–6 raw mood ratio while its actual spotlight remains>1000 in the story rooms. Reactor fill's old<.3 pin becomes bounded cool fill>.3 and≤6. Physical source positions, shadow/tier state and finite bounded local marine illumination remain tested. This directly implements the requested readable dark deck instead of preserving the rejected lighting ratio.
- Infested key's old near-neutral channel spread<.15 becomes cool spread<.25; the old practical-distance<3 pin becomes bounded6–9m for growth spill. Native green/magenta sources remain, with an explicitly tested third cool failed-human hue. Origins, seeded transforms, cap32, two emitter batches and disposal checks remain.
- World shadow-bounce clamp.01→.02 supports the measured dark-deck correction; actor/dynamic-light paths remain unchanged. The final dark-surface fill is lower than the intermediate calibration so structural joints keep a deep toe. Failed-human emission now obeys reduced-motion and flash-intensity preferences.
- No camera presentation pin, gameplay, determinism, persistence, keyboard/native input, accessibility, navigation, graphics recovery or authored-room assertion was removed or weakened.

## Remaining limits

- Constructions and narrative clusters are still a procedural kit, with retained collision silhouettes and modest story props. Palette, landmarks and prop assemblies still help identity; the underlying room templates remain recognizable.
- Practical occlusion shares the key shadow visibility. No per-fixture shadow atlas was added. The marine’s local suit-fill vicinity remains broad; hot fixture cores can still have physically radial falloff inside the shaped spill.
- The camera prioritizes at most six nearby/aimed/attacking contacts, then a priority pair if needed, with bounded15% extra pullback. An encounter too broad to fit can leave peripheral contacts outside; danger indicators remain the UI’s responsibility. This cohort has no actual selected-contact clipping.
- Three conservative diagnostics flags near the strict padding iteration limit remain visible in raw receipts; all actual body bounds pass. The exact nominal p5 band12–28 is not met on every frame: Transmission kiting reaches4.8 with shadows/ink retained, and several calm samples sit around29–32.5. The table and full burst ranges expose those exceptions. The longer Swarm burst now remains50.7–57.2median rather than returning to dark empty floor.
- Swarm retains the High frame-rate admission result with median adaptive scale.95–.975 in this cohort, against1 in its baseline cases. This is a small quality cost; full preset/manual settings and all caps remain unchanged.
- The UI adapter still needs its authorized feature-detected call to `setHudInsets` and resize/state updates. The separate render-free bot observer needs a matching engagement model before new simulation-policy cohorts claim native-camera parity.
- No new organic campaign or per-frame60fps guarantee is claimed from staged PNGs. All80 reviewed organic references are historical read-only evidence; the six new longer kiting sheets are staged native-action fixtures.
- R7’s per-environment table is absent from this checkout. Missing Blender prevents full aggregate Python acceptance.

## Final measured budgets

Fresh sustained comparison:16 ordinary production trials per build, Relay/Swarm × four rigs × High/Low,20seconds each. Baseline is the unchanged84c frozen build; final is5f42324. Native25-enemy replenishment, full kit, corpses, audio and all resource assertions remain. No best-of-N selection, preset reduction, effect/corpse cap reduction or timing assertion edit. Benchmark HUD insets are the production default0; the separate151-frame visual audit tests the requested nonzero reservations.

| Metric | Before | Final | Result / limit |
|---|---:|---:|---|
| Sustained draw peak,16cases |321|315|≤330 passes |
| Combat shader compiles |0|0|zero passes |
| Program inventory maximum |234|234|unchanged;≤400 guard passes |
| High frame p50 |16.7ms|16.7ms|60Hz median retained |
| High frame p95 range |17.8–18.0ms|17.9–18.0ms|below20ms admission bound |
| High CPU+HUD p95 range |7.0–12.5ms|7.8–12.7ms|8ms aspiration is not met by every case in either build |
| High median adaptive scale range |.975–1|.95–1|small Swarm quality cost remains |
| High minimum adaptive scale |.975|.95|existing automatic resolution; no manual override |
| Native host1-minute load /10cores |10.0–15.8|15.8–33.6|different loads; not a causal speedup claim |
| Room public readiness maximum,42entries |.778s|1.111s|≤3s passes |
| Maximum initial/cold-or-warm preparation |2.449s|1.403s|≤3s passes |
| Room program/material-profile maxima |200 /65|200 /65|unchanged |
| Preparation compile passes maximum |11|11|unchanged |
| Post-ready / combat compiles in room audit |0 /0|0 /0|zero passes |

The current cohort has15draws below the hard cap, but earlier frozen-art rechecks reached330 and remain preserved. Do not infer integration headroom for actor/ability/UI changes. The frame-rate result is paired with Swarm's measured adaptive-resolution cost. Raw frame maxima include long stalls in both cohorts; these runs do not certify jank-free locked60fps. Timings and their raw booleans remain unchanged in JSON. Browser inventories were recorded before and after the serial cohort; OS load is recorded per case. Room-audit loads differ too (before63.2–80.2, final26.0–37.3), so the readiness numbers establish the absolute budget rather than a causal improvement.

Final all20-room fixed-step scan: peak257draws,0combat compiles, errors[], budgetFailures[]. The scan is resource evidence, not a hardware FPS measurement. Room audit:42/42 fresh/sequential entries, errors[], failures[].

[Matched16-pair JSON](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-budget/budget-comparison.json) · [draw/load chart](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-final-budget/budget-comparison.png) · [baseline native data](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-bench-before-lead/benchmark.json) · [final native data](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-bench-final/benchmark.json).

[Before room audit](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-rooms-before-exclusive/rooms.json) · [final room audit](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-rooms-final/rooms.json) · [final scan](/Users/chernodub/.t3/worktrees/containment-game/t3-86702bff/artifacts/nextgen/g6-scan-final/benchmark.json).

Earlier contended and pre-lead cohorts remain under g6-bench-before, g6-bench-before/after-exclusive, g6-bench-before/after-recheck and g6-standard/budget-comparison.json. They are historical calibration evidence, not substituted for the final matched cohort.

```text
bench before/final:16/16 trials each; errors[]; budgetFailures[]; exit0.
  sustained draw peak321→315; program inventory234→234; combat compiles0→0.
bench:rooms before/final:42/42 entries each; errors[]; failures[]; exit0.
  final public readiness max1111ms; all preparation max1403ms; programs200; profiles65.
bench final all20 scan:peak257draws; combat programs0; errors[]; budgetFailures[]; exit0.
```
