# L8 test migration audit

Baseline: `7ceefa5a52cc74a6b95712f29653d9bf523906be`. These changes distinguish obsolete authored coordinates from gameplay invariants. Historical reproductions retain their original geometry explicitly; live geometry has independent clearance, native attack, crowd, projectile and replay coverage. No persistence, input, accessibility or desktop assertion was removed.

## Navigation and gameplay fixtures

| File | Replacement or retained guarantee |
|---|---|
| `src/game/world/FacilityNavigation.test.ts` | Replace square-expanded-grid tie-order snapshots with deterministic arrival at the actual goal, finite independent waypoints, continuous native rounded-disc clearance at radii14/28/38 and unchanged inputs. |
| `scripts/nextgen/playtest/bot-navigation.test.mjs` | Preserve seven recorded censors on frozen original geometry; move one Relay pair onto its actual cross-aisles; add six live named-space pairs. Keep unchanged policy, useful legal movement, bounded arrival, observer purity and repeatability. Explicitly reproduce the captured self-waypoint condition rather than requiring corrected navigation to retain the old defect. |
| `tests/A3CarrierRecess.test.ts` | Preserve the exact historical marine-only Loading recess and native carrier behavior. All20 live native-family tests cover the replacement room separately. |
| `tests/A3Crowd.test.ts` | Preserve the recorded Shielding corner on its frozen source geometry; retain native crowd overlap, sweep, separation and attack-slot requirements. |
| `tests/EnemyMovementSweep.test.ts` | Move the live diagonal knockback pair to the new Shielding bank corner; both endpoints must be legal and the intervening swept body must be blocked. |
| `tests/unit/roguelikeRooms.test.ts` | Iterate live dimensions and actual solids; connect off-grid anchors to the reached grid by legal continuous legs. All36 immutable layouts, whole-field reachability, radius28 and legacy Queen arena requirements remain. |
| `tests/unit/expeditionGeometry.test.ts` | Verify continuous connections from every actual exit, breach and inward spawn to the radius28 field instead of relying on exact ten-unit grid keys. No room-specific bypass. |
| `tests/unit/authoredTopology.test.ts` | The new live topology registry supersedes old story topology equality pins; retain20-room route, actual hull/solid behavior and unchanged legacy layouts. |
| `tests/unit/awakeningTopology.test.ts` | Sweep the real Release–Recovery–Service–Observation circuit in both directions at radii16/28/38; retain independent direct aisle, valid anchors and breaches. |
| `tests/unit/passengerBlockout.test.ts` | Preserve eight source reservation roles, add actual hull bridges and articulated boundary. Replace buried north approaches with central/southern circuits; test31 genuinely exposed faces, native projectiles/grenades, spawn relocation/rejection, drops and collection. Buried faces are no longer pretend approach surfaces. |
| `tests/unit/residentialGalleryGameplay.test.ts` | Replace old obstacle-island probes with real cabin/gallery routes, actual bed/desk/locker contacts, native projectile stops and accessible drop faces. |
| `tests/unit/communalSouth32Gameplay.test.ts` | Move human-scale southern probes, source roles, cover/shot/drop checks to the new garden/galley/welcome layout. Native player/enemy/projectile radii remain. |
| `tests/unit/spitterLosSteering.test.ts` | Retain the intended blocked-shot/steering condition on an actual new cover face; keep legal native movement and firing behavior. |
| `tests/unit/spitterRetreat.test.ts` | Freeze historical retreat reproductions explicitly; add40 live room/family retreat-damage cases instead of treating now-buried coordinates as legal floor. |
| `tests/unit/ServiceShaftLanding.test.ts` | Follow the articulated docking recesses while retaining the C balcony, shaft void, two directions and native clearance guarantees. |
| `tests/unit/__snapshots__/awakeningTopology.test.ts.snap` | Snapshot all16 non-story legacy templates, including `reactor-vault`, exactly. The other19 story rooms are intentionally redesigned, so the old all-other-story snapshot is obsolete. |
| `tests/unit/__snapshots__/passengerBlockout.test.ts.snap` | Same16 legacy templates preserved exactly; live story geometry is checked behaviorally rather than requiring the removed island layouts. |

## Presentation pins

| File | Replacement or retained guarantee |
|---|---|
| `src/render/CommunalGarden.test.ts` | Actual mapped source garden role, including rotated small foliage reservation. |
| `src/render/G2ManufacturedKits.test.ts` | Fitted live sources retain manufactured detail/material ownership and bounded solid support. |
| `src/render/PassengerVault.test.ts` | Original source is still validated; live eight-role fitting and bay-floor support added, with original geometry/material disposal. |
| `src/render/RelayRacksRoom.test.ts` | Two real rack aisles, cross-aisles and source fitting replace old detached-bank coordinates; continuous low cover remains. |
| `src/render/ResidentialGalleryEquipment.test.ts` | Actual CC0 beds/desks/chairs/cutaway lockers in six cabins replace the old four-root placement pins; lazy source/license/ownership checks retained. |
| `src/render/ResidentialGalleryForms.test.ts` | Cabin openings and continuous connected finish replace old floating floor forms. |
| `src/render/Room8Placement.test.ts` | Actual articulated hull/equipment support replaces old apron/island coordinates. |
| `src/render/Room8Visuals.test.ts` | Actual docking repair architecture and live hull gaps replace the obsolete rectangular apron composition. |
| `src/render/WorldDressing.test.ts` | Build actual production architecture in fixtures, retain12k triangle/material/immutability/support limits. New overhead warning vertices require transparent non-depth-writing materials and real native-body clearance rather than pretending to be floor-supported props. |
| `src/render/camera/CameraWallContinuity.test.ts` | Preserve the historical shallow Atrium camera/cache regression on its exact old hull; new all20 framing suite independently checks the live garden and every new room. |
| `src/render/camera/E7EncounterFraming.test.ts` | Annulus landmark bounds follow the source core's declared translation; native scale, HUD and decorative-share bounds unchanged. |
| `src/render/camera/RoomCombatFraming.test.ts` | Keep the old concave-vs-AABB diagnostic on its frozen original hull; no weakening of the18% AABB rule. Live concave plans have separate all20 coverage. |
| `src/render/lighting/E6ValueComposition.test.ts` | Relay secondary fill follows the reviewed architecture composition gain. Existing hierarchy/reset/tier/ownership checks remain. |
| `src/render/lighting/FlatFloorLighting.test.ts` | Add live shared aperture-uniform ownership and story-room strip-only floor lighting, preserving stable shader keys and legacy mode. |
| `src/render/world/ConstructionLanguage.test.ts` | Retain old three-form source construction controls on their frozen source plans; new live seam-growth helper has independent support/door/hull/quiet-floor coverage. |
| `src/render/world/EnvironmentalStory.test.ts` | Freeze historical torn-hull, membrane and overhead support controls instead of requiring retired source recipes in live rooms. Live loading/infestation/Act3 dispatch covered separately. |
| `src/render/world/KitDeckArchitecture.test.ts` | Actual hull/void support includes new bay access surfaces; grain shader and exact ownership preserved. |
| `src/render/world/KitFloorSurface.test.ts` | Remove the obsolete requirement that every camera sample contain clutter. Retain admission/feature quantity, legal support and flush height; require door-function lines and absence of old patch/scatter recipes. Historical random-tissue control remains frozen; live seam tissue tested independently. |
| `src/render/world/KitFootprintClusters.test.ts` | Tiny structural returns cannot acquire accidental junk islands; normal equipment cluster function/bounds remain. |
| `src/render/world/KitPerimeter.test.ts` | Short concave returns cannot acquire full-size facade pieces crossing the playable deck. Exact hull owns those joints; normal perimeter support remains. |
| `src/render/world/KitStorySightlines.test.ts` | Use actual fitted recorders and native camera anchors; story lettering, readable quads and obstruction rays retained. |
| `src/render/world/RoomKitDressing.test.ts` | Live fitted support/kit ownership replaces old source placement coordinates. |
| `tests/ArmoryCarouselLayout.test.ts` | Retain horseshoe, broad independent circulation and carousel source roles in the articulated hull. |
| `tests/CommunalPracticalLighting.test.ts` | Actual relocated galley/garden fixtures rather than old coordinates. |
| `tests/CommunalSouth32.test.ts` | Actual immutable story roles and fitted supports rather than old southern furniture positions. |
| `tests/ContainmentAnnulusBlockout.test.ts` | Original core translated intact, playable inspection ring and airlocks; actual support/shot/camera tests replace fixed origin pins. |
| `tests/CrewCheckpointBlockout.test.ts` | Hull-attached inspection booths, scanner hall, two bypasses and low open cage replace freestanding island equality pins. |
| `tests/DepthTreatment.test.ts` | Actual low connected geometry replaces source-height coordinate pins; depth/readability behavior remains. |
| `tests/G6FixtureShapes.test.ts` | Fixtures use the declared live arena instead of a presumed room center; native actor/action/priority assertions remain. |
| `tests/InfestedWorkshop.test.ts` | New hull-attached workshop source roles replace island coordinates; infestation remains presentation-only. |
| `tests/ManualControlBlockout.test.ts` | Fitted authorization booth/cost gallery source roles and actual hull support. |
| `tests/NextgenLighting.test.ts` | Authored source-shaped aperture pools replace removed circular suit pedestal expectations. |
| `tests/PracticalOcclusion.test.ts` | Actual architectural fixture position replaces obsolete source pin; obstruction behavior retained. |
| `tests/RelayShotGap.test.ts` | Real port/starboard cross-aisles provide clear shot lines, while the source spine still blocks actual projectiles. |
| `tests/ResidentialGalleryBlockout.test.ts` | Full six-cabin source furnishing and real circulation replace the earlier island recipe. |
| `tests/SafetyInterlockBlockout.test.ts` | Actual upper/lower cage geometry, recorder and battery reservations replace old blockout coordinates. |
| `tests/SceneLighting.test.ts` | Test complete production room owners and transformed fixture origins; retain four live fixtures, pooled lifecycle, directional marine light and zero suit-fill pedestal in all20 live rooms. |
| `tests/ShieldingGateBlockout.test.ts` | Hull-connected shielding banks and actual source ownership replace freestanding source positions. |

New suites add strict connected-union/opening/sealed-door checks, native per-family attack access, dense navigation, A3 mixed crowds, all-rig replay hashes, true cover/source contact, merged hull-minus-union decks, all20 C6/E7 framing, function-tied floor marks, warning full-native-body envelopes and evidence/provenance controls. Candidate-only tests remain explanatory and are never substituted for the final live-room gates.

Capture fixtures in `scripts/nextgen/scenarios.mjs`, `g6-scenarios.mjs` and `scripts/authored-room-smoke.mjs` now derive arena/support positions from the same deterministic template metadata. Calm uses native pointer leave to dismiss the placement preview; it never hides a live ability pool. All original native actor/action/phase/priority/hero/HUD assertions remain. G6's existing spread-actor fixture is explicitly distinct from canonical twelve-visible-enemy kiting evidence.
