# RW12 review log

Merged nextgen beab6525 before work. npm ci and initial build pass. No tests added.

## Equipment art, first study
Opened cryo at native 960×600: serviceable pressure vessel silhouette, but frost shards too large. Reduced crystal lengths. Seven-family contact then exposed top cropping and overly similar coloured vessels. Wider framing, lower emission, piston/coil variations, flame geometry replacement, and imported read-only K12 rig modules for second studies. Not accepted as final yet.

## Ending round 1
Opened 480×270 then 1920×1080. Dish and outward signal read; emotional cost does not. Clean platform, tidy repeated boxes and posed standing operator weaken the premise. Requested fractured deck edge, detached crosssections with torn conduits, long human-sized cryo capsules with inactive readouts, seated slumped operator, closer lower camera. No approval at this stage.

## Browser setup
Shared preview successfully reached native starting draft, but screenshot calls twice failed with `Preview automation snapshot timed out after 15000ms.` Closed owned tab; existing production capture runner is used serially as fallback.

## Cards round 1
Opened starting boon, augment draft and pause loadout at1920; starting/augment at1280. Large art and behavioral headline improve desire immediately. Failures: tall equipment crops, repeated modifies/footer labels, excess vertical text spacing. Loadout overflow at720 found by existing runner. Fix: contain art, remove redundant draft footer, tighten metrics spacing, compact owned tiles, put small before→after geometry directly on ability-changing cards. Preserve full rules in inspection.

## Ending round 2
Opened480 then1920. Torn edge and pods improve; major failure: scene pose edits stretch marine limbs across deck. Restore tested K12 pose, hide weapon, lower head and occlude hands behind console; do not pretend broken rig is acceptable. Ship still reads as abstract plates, needs curved fuselage sections, warm ruptured interiors and brighter silhouette. Pods need visible human-scale lining/occupant hints.

## Cards round 2
Opened starting/augment/loadout1920, starting/augment720 including overflow diagnostic, and corrected720loadout. Before→after preview makes the augment action explicit. Fixes: align inspection/selection rows, shorten blank numeric area, retain140px art with50px preview at720, compact loadout portrait/owned tiles/margins so footer remains visible. Source art correction in progress: read-only rig extraction included disconnected suit parts; isolate a single housing and ground it in per-id studies, omit it from family fallback.

## Ending round 3
Opened480 and1920. Marine deformation resolved but operator fully hidden behind console. Hull became an oversized clean cylinder and does not read as wreckage. Request smaller separated/rotated hulls with uneven torn mouths, exterior panels/windows/nacelles, no regular orange grid. Lower console to reveal operator; thin pod windows to show dim liners and human silhouettes.

## Ending round 4
Opened480 then1920. Native operator now visible without deformation; cryopod occupants can be discerned. Whole platform still reads as a small diorama and torn hull mouth has too many bright angular teeth. Fifth pass: closer lower camera crops base, softer irregular mouth bends, restrained warm lighting, exterior ship detailing and thin local wreck dust. Add sparse stars and a grounded broken conduit for depth.

## Equipment individual review
Afterquake and Reinforced Bulwark opened individually. Piston shaft floated above shortened vessel; repaired length/height. Salvaged K12 housing too large and faceted; reduced scale and neutral metal, grounded beside module. Broader camera protects pulse rings and effect tips. Family fallbacks omit the salvage part to keep their silhouette simple.

## Ending round 5
Opened480 then1920. Dust/backlight and cropped framing help depth. Dish/beam, operator and occupied silent pods read together; ship hull remains simplified and partly hidden. Final refinement shifts dish camera-left to expose the wreck mouth, dims console glare and adds pod serials/one interrupted lid. This composition carries the ending instead of repeating an armed portrait.

## Portrait reviews
First512 previews opened allfour: Cryo gun incorrectly raised and fingers separated; Breacher did not read forearmguard. Arc widerstride crop and Pyro tankturn distinct but accents subtle. Corrected gestures using measured world axes, curl65 from acceptedtitle, retained native Arc arms, clean amber override. Second Breacher/Cryo now clearly guard vs loweredweapon/open coolant hand; original imported marine mesh and rig source remain untouched.

## Reward full-set review
All19 final studies opened in six-per-sheet contacts; Afterquake and Napalm Triplet also individually. Repaired piston connection, grounded smaller neutral salvage housing, uniformly scaled paired assemblies, made triplet exactlythree. Shared ribbed equipment vocabulary is consistent but still visibly procedural; flame/crystal effects are intentionally stylised and comparatively simple.

## Campaign isolation correction
First Cryo seed1729 campaign progressed to room9, then the runner asset server threw `ERR_HTTP_HEADERS_SENT`. A build had replaced its live dist directory; that is the likely missing-asset trigger. No gameplay change was made. Retain the failed log as evidence, rerun from start against an immutable copied distribution using the supported --dist-dir option; do not modify the frozen copy during the campaign.

## Portrait second look and final effects
Second set opened Breacher/Cryo/Pyro/Arc at512. Distinct forearmguard, low-weapon coolant gesture, tank-facing torso and wider stride crop now survive; clean amber shared with title. Final effects-only refinement uses posed rig glow geometry to locate Pyro pilot and Arc coil bolt, plus small Cryo palm steam wisps. Full shipping128 render follows with no further body pose changes.

Final128 composition inspection caught the dish movement going camera-right, putting its pedestal directly over the operator. Reversed that scene-only offset camera-left before final delivery; corrected delivery was then opened at480 first and1920 and encoded into all three shipping sizes. The weaker distant ship detail remains documented.

## Final source review before card round 3
Expanded before/after drawings to twin Glacier walls, twin pylons and the remaining stat-changing augments; the latter retain their tactical silhouette with a compact change readout. Forked Overload now depicts two added targets. Restored explicit double-edge augment framing and warm rare outlines after noticing the illustrated-card border shorthand overrode the earlier augment edge. All twelve existing augments now have a visual change preview. Final build passes.

## Delivery detail refinement

Opened the extra detail preview at 480×270 first, then 1920×1080. The quiet deck still looked too much like a clean slab, so added narrow plate joints, captive fasteners, service channels, console switches/telemetry and small detached hull fragments. The main silhouette remains dish → small operator → silent capsules, with the broken vessel behind. The distant hull is still too tubular and the passenger deck retains a diorama quality; these remain explicit weaknesses. The final uses the same composition at 128 denoised samples.

Final delivery opened at 480×270 first and 1920×1080 after raising the service plates above the thickened torn deck. The deck joints and fasteners are now visible. Cryo family, Spreading Nova and Twin Glacier were re-rendered with opaque pale frost rather than metallic shards; family and twin masters opened individually. Final art is encoded; browser round 3 follows after the campaign.

## Cards round 3, full rig coverage

Opened starting boon, Breacher and Cryo augment drafts at 480×270 first and native 1920×1080. Art stays inside its frame and twin walls read directly. Pyro then exposed a combined room-record + effect/set-lesson state: the existing capture diagnostic found 69px of vertical overflow. Opened the failure image, preserved it in `layout-fixes`, and made only that two-banner state's illustration height responsive (150px at1080, 100px at720). This preserves both contextual messages and the native reward footer; the remaining screen set is being recaptured.

Full1080 capture set passed all13 scenarios after the conditional art-height fix. Opened every screen at480 and native size. The ending image was left-aligned inside its wider figure after aspect-ratio height capping; centered the inner render with auto inline margins. The final720 set and a focused1080 ending recapture verify that correction.

## Final browser acceptance for this implementation

Opened all13 screens at each desktop size, thumbnail first and native second. The720 non-augment install rows were too high beside a diagram card; strengthened the auto-margin selector, then opened all five corrected draft captures. Expanded the720 ending image from36vh to42vh and centered its capped frame; both ending recaptures opened at480 and native. All final captures pass existing clipping diagnostics. The report retains the procedural equipment repetition, simplified wreck and native grip limitations rather than calling them solved.
