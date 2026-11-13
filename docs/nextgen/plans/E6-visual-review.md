# E6 independent visual review — raw primary capture

Reviewed 2026-11-13 by the independent environment-review sub-agent. **C1 remains open in this capture. C8 improves visibly, particularly in security and containment, but the new kit pieces do not yet transform most rooms into connected, used places.** Several additions read as objects placed on the roofs of the existing machinery. Residential Gallery has a specific domestic-silhouette regression. These are findings about the saved raw evidence, not a verdict on later corrected captures.

The review uses the ten moods in `00-VISION.md`, the actor-first inked direction in `streams/W4-direction.md`, R8 C1/C8 and its per-environment observations, and the I9 floor-value method. No source, browser, capture harness, tests, benchmark or computer-use tool was run for this review. The only new artifacts are this report and file-derived PNG comparison pages plus their generator and source ledger.

## Evidence and provenance

Every one of the twenty raw calm native PNGs was opened at its saved 1920×1080 resolution. At inspection their directory was `artifacts/nextgen/e6-final/`; it was subsequently renamed to **`artifacts/nextgen/e6-primary/`**. All twenty SHA-256 values were checked against the preserved files after that rename and match. The primary capture is the ad15 capture, not the later floor calibration or composition corrections.

Absolute current raw root:

`/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-primary/`

Absolute baseline root, read-only:

`/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final3/`

For both roots, each room in the table below has the exact filename `combat-calm-<room>.png`. All forty exact absolute paths, SHA-256 values and source dimensions are recorded in [source-ledger.json](../../../artifacts/nextgen/e6-review/source-ledger.json). The ledger also preserves the original capture paths before the rename.

All twenty baseline calm images were compared with the raw primary images in five directly inspected pages, each containing four paired views at exactly 480×270. Pages preserve the source exposure; the file-only generator averages source pixel blocks and does not normalize or retouch images:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-review/comparison-1.png`: Awakening, Passenger, Residential, Atrium.
- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-review/comparison-2.png`: Checkpoint, Armory, Freight, Breached Bay.
- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-review/comparison-3.png`: Relay, Transmission, Diagnostic, Safety.
- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-review/comparison-4.png`: Coolant, Service Shaft, Workshop, Swarm.
- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-review/comparison-5.png`: Shielding, Annulus, Manual Control, Overload.

The three-room round4 standard was also directly inspected through the following sheets. Their three columns contain exact 480×270 panels; `critique.png` shows calm plus kiting frame 02, and the grayscale sheets show those calm/kiting states. These are earlier standard pixels, not the primary all20 source:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-standard-round4/critique.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-standard-round4/calm-grayscale-identity.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-101ac82b/artifacts/nextgen/e6-standard-round4/kiting-grayscale-identity.png`

Round4 manifest source: `367b90e7cd25f27c495ea841e058c3961914b9e1`. This review did **not** inspect all20 kiting frames or the boss arena. The primary calm views show only the entry-camera portion of a room; an unseen perimeter is not evidence that dressing is absent there.

## Art direction findings

**C1 — connectivity and lived use:** flat runs visibly join machines to walls, but their repeated long horizontal composition makes many rooms more schematic. The common solution is a line through an arena plus a few pieces on the old obstacle. At 480×270 the imported forms often collapse into rooftop clutter while the old procedural machine remains the dominant silhouette. Cargo benefits most from stacked stock because that placement fits its purpose. Domestic furniture, workshop furniture and loose devices on sealed machinery do not share that justification. Continuous biogrowth is still weak: the raw purple sawtooth strip reads as a flat carpet and the large machine covering remains visibly separate from it.

**C8 — value identity:** removing repeated white floor pools is a real gain. Security hardware receives more localized hard light; containment is quieter and the field mechanism is easier to read. Engineering has warm directional emphasis, reactor has a strong hot focal center, and communications has darker hardware and screen accents. However, many floors still share the same broad mid-dark deck composition, and the same flat service-run rhythm crosses the ten moods. The communications hardware is sometimes very black, so reduced floor competition is not automatically increased rack readability. Maintenance's large shaft-side green pool remains especially obvious. These are composition judgments, not measured band-pass claims.

**Actor priority:** the marine remains locatable in every inspected primary calm view. In the three round4 kiting frame-02 panels, enemies remain distinctly brighter than the world and the marine can still be found; the dense combat ring and effects dominate. The round4 grayscale panels support that limited observation. This does not certify moving edge occlusion, every combat phase, or all20 combat readability. The review recommends world-only changes; camera, actors, abilities and UI are outside scope.

## Per-room observations

Each row names the exact suffix in `combat-calm-<room>.png`, under both absolute roots above. “Observed” refers to the primary raw calm pixels. Proposed corrections are small environment/dressing/lighting changes, not requests to alter collision or navigation.

| Room suffix | Observed C1 composition | Observed C8 / priority | Concrete environment recommendation |
| --- | --- | --- | --- |
| `awakening-bay` | Pod/life-support chain is recognizable; tiny stock on the berth reads as an accessory. Repeated horizontal covers dominate the addition. | Cold identity is clear, marine separated; reduced practical pools leave a quiet floor. | Terminate a smaller number of service links at pod seals and wall junctions; keep the berth silhouette legible. |
| `passenger-vault` | Occupied windows remain the strongest narrative cue. New upright stock on the pod rank feels generic; ranks remain isolated objects. | Cold floor is quiet and actor clear. | Prefer one supported emergency-service cluster at the pod bank end over loose pieces on pod roofs. |
| `residential-gallery` | **Regression:** upper cabin base shows chair, mugs and small objects but lacks the major bed/desk visible in round4; right cabin plinth appears empty. Lower sofa remains. | Warm practicals versus cool deck suggest habitation, but missing domestic silhouettes undermine the mood. | Retain the original cabin source whenever a major replacement is rejected; fit the bed/desk farther inside its reserved solid instead of leaving an empty plinth. |
| `communal-atrium` | Garden landmark remains a strong place cue. Colored boxes beyond the near parapet form a stock rhythm rather than an interrupted communal activity. | Isolated warm practicals are quieter; marine clear. | Concentrate one interrupted meal/maintenance cluster around an existing table or garden footprint; reduce repeated stock rhythm. |
| `crew-checkpoint` | Fortification reads clearly. Countertop cylinder/case adds detail but the inspected inspection floor remains very immaculate. | Hard white hardware lights and red alert remain clear; less competing floor light is an improvement. | Use a displaced supported barrier/tool group inside existing fortified footprint; avoid another isolated counter accessory. |
| `armory` | Arsenal landmark survives; added drum on its central platform looks like a countertop pile. Little aftermath is visible in the entry view. | Pale curved structure is a strong world shape, but marine remains locatable; floor pools are reduced. | Keep center arsenal silhouette clean; move loose stock to existing weapon-storage footprint edges. |
| `freight-hold` | Crate/tarp stock on containers is plausible here, stronger than the same stacking elsewhere. Large clean container islands and lanes remain. | Sodium warmth and long shadows retain cargo identity; actor clear. | Favor one visibly displaced cargo stack tied to a wall/loading support, retaining clear container massing. |
| `breached-loading-bay` | Irregular hull/scar silhouette is one of the stronger landmarks. Blue crate on scar still appears deliberately displayed; purple sawtooth floor strip is planar. | Mixed sodium/alien light is distinctive; marine clear. | Keep breach edges visually torn; remove arbitrary scar-top stock and replace the sawtooth visual with a continuous seam-hugging membrane. |
| `relay-racks` | New small screen/parts sit on the original rack; original silhouettes still carry the room. Long service lines make the plan schematic. | Dark racks and localized screen accents improve comms identity, though some black cavities lose detail. | Preserve dark value hierarchy while adding a small hardware shadow toe; vary link routes near rack/wall junctions rather than adding more transverse lines. |
| `transmission-chamber` | Dish remains strong; equipment on its face/rack top adds clutter rather than a clear service activity. Broad floor runs remain diagrammatic. | Dark LED racks contrast with bright dish; actor clear. | Preserve dish face as a readable hero form; relocate service pieces to a visible supported rack-end position. |
| `diagnostic-gallery` | New desk/gantry-like piece reads as furniture on top of a machine. A thin vertical part appears to cross part of the first “DIAGNOSTIC” line. The fatal third line stays readable. | Hot directional light distinct; narrative screen remains focal. | Include async kit geometry in story-screen sightline exclusions; inset/move the interfering part without moving the sign. This is an apparent pixel occlusion, not a proven ray-contract failure. |
| `safety-interlock-station` | Recorder remains readable; extra screen/hardware crowds the instrument top. No definite text occlusion seen here. | Concentrated warm focal light is effective; calm deck currently dark. | Keep the recorder face clear and reduce redundant screens; review after the separately planned floor-only gain. |
| `coolant-plant` | Tanks and gratings identify the plant; service runs connect pump islands. Drums/devices on pumps still feel extra rooftop detail. Drain-following seepage is not a strong read in this view. | Teal/green machinery provides identity; actor clear, current deck dark. | Place seepage emphasis along existing drain/grating boundaries and keep pump crown silhouettes simple. |
| `service-shaft-landing` | Open shaft and hoist frame give actual depth. A small canister appears perched on a narrow rear beam inside the shaft, without an obvious service platform. | Large pale-green shaft-side pool remains; maintenance identity clear, cleanliness high. | Remove that loose canister or visibly clamp it to a mount within the existing solid. A still cannot prove floating, but support does not read convincingly. |
| `infested-workshop` | Original machine remains legible beneath a tent-like cover. Added shelf/crates on it reinforce “decorative covering.” Purple angular caps and sawtooth carpet remain separate layers. | Alien hue/machine light distinguish it; marine retains priority. | Remove workshop furniture from growth crowns; join wall seam to machine skin with a smooth, continuous membrane inside allowed visual spaces. |
| `swarm-junction` | Larger consumed silhouette works better than Workshop; crate/drum perched on it weakens biology. Clean floor and separate flat/tendril layers remain. | Green/magenta mood clear; similar broad lighting rhythm persists. | Remove loose stock from organic crown, merge visual growth at seam/support junctions rather than adding another detached cap. |
| `shielding-gate` | Dominant mechanism still reads; small extra parts crowd its narrow top. Long covers crossing the ring retain schematic feel. | Quieter unrelated floor highlights and violet mechanism focus are a clear gain. | Keep one legible field mechanism and route fewer links to its base/wall rather than through its visual center. |
| `containment-annulus` | Sealed ring landmark legible, but small loose devices on the lid are unmotivated. Large clean diagram/platform still dominates. | Reduced floor pools improve clinical quiet; actor clear. | Remove loose lid stock; leave purposeful field/service details on perimeter mechanisms. |
| `manual-control-chamber` | Authorization/fatal display remains clearly readable. Console island still sits in a large untouched entry view; added screen feels redundant. | Hot light carries from hardware onto deck; marine clear. | Keep the story face unobstructed; concentrate one supported interrupted control task inside existing console solid. |
| `overload-floor` | New bright stock/screen on reactor rim becomes an irregular white blob, weakening a clean landmark. Surrounding inspected arena remains immaculate. | Strongest hot climax; heat reaches nearby architecture/deck. Cyan marine remains findable. | Remove loose reactor-rim devices; preserve core silhouette and use existing perimeter structure for service detail. |

## Value-method qualification

No new luminance numbers were calculated in this review. I9's table method samples Rec.709-weighted **sRGB code values**, not linear-light luminance, on legal projected floor tiles while excluding raised occluders. Its p5/median/p95 figures must not be substituted with whole-image brightness or normalized thumbnails. The stated typical floor median band is 50–80, with documented exceptions. Color and grayscale inspection here assesses value structure; it does not prove numerical band compliance.

At review time the lead was separately applying bounded floor-only albedo gains for Awakening, Atrium, Freight, Transmission, Safety and Coolant, and a communications hardware shadow toe increase. Those future pixels have not been reviewed here. Neither the quiet floor observation nor the low-floor concern is a claim that this later calibration passed or failed.

## Correction priorities and disposition

1. Preserve domestic identity when replacement meshes fail placement constraints. The primary Residential regression is more damaging than the tiny added detail is helpful. A fallback should depend on successful major forms, not any successfully placed small object.
2. Protect story-screen optical clearance from async kit meshes as well as original dressing. Diagnostic has a visible potential obstruction; check the actual imported root in the screen contract, then inspect its corrected PNG.
3. Remove loose parts from sealed core/field lids and the narrow shaft beam. The primary capture already includes per-prop support raycasting from `25fda75`; the questionable appearance is present despite that fix. Geometric support and believable art placement are different tests.
4. Replace the raw sawtooth infestation floor carpet with continuous seam-hugging forms and remove growth-crown stock. This should improve the observed problem, but a future image must show the result before claiming C1 resolved.
5. Continue composition work beyond a universal cross-room strip. Fewer, locally motivated junctions can preserve actor clearance while making cargo, domestic, communications and biological rooms feel authored for different use.

After this review, the lead reported implementing a major-cabin fallback/proportion/inset correction, story-screen ray protection, removal of containment/reactor/shaft loose devices, and smoother flush membrane connections. Those changes are **reported work, not inspected evidence in this document**. Their captures will be separate. This report intentionally retains the raw primary defects for auditability.

No license, material normalization, collision, continuous camera occlusion, shader compile, draw-call, preparation-time or performance result is asserted from these PNGs. There is no independent all20 combat or boss verdict here. The current evidence supports meaningful C8 progress and an asset-pipeline change; it does not support closing C1 across twenty rooms.
