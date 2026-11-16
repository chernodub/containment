# FEEL12 visual review

No completed look → fix rounds. Baseline capture failed with sandbox EPERM; the escalated retry stalled without a PNG. No visual findings are claimed from code inspection. Required next steps: finish baseline/final eight-angle weapon and ability strips; inspect Crawler/Stalker/Brute plus rifle/shotgun at native and 480×270 in Crew Checkpoint, Relay Racks and twenty-enemy crowd through three actual rounds; expand to all families/weapons; run all four native campaigns.

## Resumed review: aim round 1

Merged nextgen second-pass creature meshes; npm ci/build passed. Small marine idle strip completed with zero errors and was opened at native size. Opened native angle-0 rifle and Railbreaker, angle-45 shotgun and Flashfire. Rifle/shotgun muzzle flashes follow the barrels. Flashfire early poses leave the weapon visibly displaced from the hands while horizontal heading is constrained: heading-only correction is insufficient. Fix requested: preserve grip through the cast wrist/body pose rather than rotating a detached weapon. Railbreaker lean remains readable but support grip needs scrutiny. Eight-angle batch is running serially, not stalled.

## B historical R11 look (opened 2026-11-17)

Opened original 1920×1080 and exact 480×270 area reductions of final6 enemy
frames: Crawler04, Stalker06, Brute08, Spitter04 (Awakening Bay), and mixed
crowd15 (Communal Atrium). Retained copies and source SHA256 inventory are in
`artifacts/nextgen/feel12-final/threats-before/`; these are explicitly historical
R11 inputs, not captures from this working source.

Look: the white locator takes visual priority over the peach warning perimeter
at 480. Stalker's long capsule remains visible but resembles a narrow floor
mark. Spitter's exposed warning is a short crescent partly hidden by marine feet
and nearby grate. In the mixed crowd, thin orange segments can be mistaken for
architecture lines. Brute's broader silhouette is easier to locate, but its
warning still has less luminance/edge mass than the locator.

Implementation response (931f174f): widen nested inside-footprint dark keyline
and danger edge, strengthen the progress fill without making it opaque, add a
final beat driven by actual remaining milliseconds (last100ms), reduce locator
alpha and dim it further only near a native footprint. A stable incoming-side
arc uses known damage receipt directions and fades over320ms; no invented
source direction for environmental receipts. This is the first response to the
R11 look, pending new-source pale/dark/crowd capture review. It is not counted as
one of the three completed new-source standard rounds.
