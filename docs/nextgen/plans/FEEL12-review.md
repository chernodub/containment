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

## Aim round 2 and first native pale-room look

Opened angle45 native Flashfire, Whiteout, rifle and run90 after wrist correction. The receiver is closer to the casting hand and Whiteout no longer lifts its barrel overhead, but cast right elbow/hand still looks contorted. Run90 has conspicuous straight trailing-leg extremes. Requested shorter authored stride, stronger pelvis compression and shoulder counterturn; receiver arm needs a reachable front pocket.

Opened native Crawler Crew Checkpoint frames01,05,10. Warning edge is now immediately visible against pale floor and substantially brighter than the locally dimmed player ring. Frame05 shows a sweep approaching the strike; frame10 warning is gone and Crawler has crossed into contact. Body coil still subtle at gameplay size. Native frame01 exposes the marine's opposing gesture/gun silhouette, so isolated muzzle-direction agreement alone is not acceptance.

## B round 1 — exploratory live-dist pass (superseded)

Opened Crawler Crew native01/06, Stalker Crew06 and Relay06, Brute Crew08/17,
and complete30-frame Crawler Crew/Relay exact480 contacts. The first native
Crew Crawler edge now has a clear dark keyline on pale floor and the locator no
longer dominates; the same edge survives Relay's dark floor and bright grate.
The exposed Stalker capsule is easy to follow laterally, while its small body
still needs the held coil/strike change to communicate commitment. Brute08 has a
raised pointed silhouette and17 compresses into a broader striking mass.

Look → fix: at480 the swept interior/final100ms are still too quiet; the frame
can read as a static outlined exclusion shape rather than an imminent hit.
Increase only the final100ms fill contribution from .055 to .18; leave the
ordinary early fill and exact shape untouched. Add a cheap square broadphase
before locator/detail overlap trigonometry, clear stale damage arcs at menu or
death, and let pulse/boss warnings quiet the locator as well. Four explicitly
labelled presentation-only hurt replays will inspect incoming-side arcs without
claiming accepted native damage in an invulnerable warning fixture.

Provenance limitation: a concurrent build replaced live `dist/` at
2026-11-17 02:20:24 +0300 (`DepthRenderer-4G7NGwZK.js`). The pass reloads between
scenarios, so its starting asset inventory does not certify the whole run.
Retain it as exploratory opened look/fix evidence, exclude it from final
same-asset acceptance, and use immutable `--dist` snapshots for rounds2/3.
The original manifest is unchanged and `PROVENANCE-NOTE.md` flags the issue.

## Brute mass check on merged meshes

Opened native Brute Crew04 and Relay15/20. Raised cleavers communicate commitment; the first upright windup is too narrow compared with its broad released stance. Belly remains above the feet in these views. Requested Brute-only wider compressed held mass (implemented in7a60fd80; needs final clean capture). Relay floor keyline remains legible; sweep still reads much weaker than edge. These B1 frames are exploratory mixed-source after live dist was rebuilt at02:20:24+0300; do not use them for same-build final claims.

## B round 2 — immutable standard

Source21875431, immutable `runtime-b2`; Crawler/Stalker/Brute in both contrast
rooms plus the real20-Crawler swarm. New capture-only vertex bounds now enclose
the actual posed lunge rather than the collision cylinder. Opened both Crawler
native07 and corresponding exact480 frame07, plus the full30-frame native
Crawler Crew strip. Its strike and asymmetric return now remain in the crop.

Look → fix: the stronger final-fill alpha is visible on pale floor, but the
Relay interior still reads mainly as dark floor. The shader was leaving filled
interior color near black and changing color mainly on rim/timing. For round3,
tint only the swept interior toward warning orange, with the meaningful increase
confined to native last100ms commitment. Preserve quiet early alpha, exact shape,
opaque keyline and reduced-motion/flash scaling. Round2's frozen assets stay
unchanged for comparison. The completed pass contains210 native frames, zero capture failures/errors,
and33 native per-vertex strips. Opened all six core family/room enemy strips,
swarm actor1/10/20 strips, the documented full native phase frames, and all seven
complete exact480 contacts. The full20-actor vertex bounds stayed in the viewport
through all30 swarm frames. Brute holds a visibly raised narrow silhouette,
compresses broadly into the strike and retains that loaded mass through recovery;
the small-family recovery reads most clearly in the asymmetric leg spread. These
are staged art observations, not human dodge-success or performance claims.

Tool correction from round1: its native crop derivative stopped at mixed crowd
Spitter17 leaving the viewport in frame26. `native-strips/FAILED.txt` retains that
failure; partial root-envelope strips are not complete body evidence. All360
round1 native PNGs are retained. Native full frames were sampled at the documented
phase frames; all12 complete exact480 contacts were opened at original size. The20-Crawler standard avoids the retreating mixed-crowd source limitation.

## C round 1 → 2: paired physical chain

The first paired capture failed because the shooter was placed behind the native spawn near a viewport edge. Retained its error receipt; fixed staging to leave shooter at the native camera mark and put victim ahead, without camera changes. Opened both complete24-cell retry strips: rifle muzzle/tracer/point spark connected, but Crawler whole-body recoil was too brief/small; shotgun kill carried right and settled. Fixed contact envelope to hold35ms before smooth return, and increased mass-weighted light/heavy bend .30/.48→.55/.78, preserving native damage/shove/timing.

Opened round2 complete native Crawler/Brute rifle-hit and exact-quarter Crawler rifle-hit/Stalker shotgun-kill. Collaborating motion review opened all6 complete strips144cells. Abdomen/shoulders now load away from the impact over visible cells; Brute remains restrained, and small shotgun victims carry farther than Brute. Retain this balance rather than amplifying all hits into topples. Round3 expands to every weapon/family, with native room firearm evidence separately: these paired strips are frozen-simulation presentation replays, not collision/damage acceptance.

## Native A startup confirmation

Opened native final Awakening Bay spawn: helmet/chest/gun now point right with the marker. The untracked origin bone had a180° mismatch between initial rest and ready pose; isolated runner reset masked it. Startup now preserves the canonical ready origin before legacy actions stop. Opened native Railbreaker03; heading agrees, but beam originates along body/native lane and extends behind the muzzle. Exact muzzle attachment requires a VFX12 kit/service anchor inside excluded ability modules; changing all event coordinates would move ground/impact shape, so no such workaround was made.

## C round 3 — all weapon/family chains and merged-body motion

Generated native four-phase contacts and exact-quarter reviews for `chains-final`
(50 rows) and `motion-final` (84 rows). Opened all ten native chain contacts and
all ten quarter contacts. Opened 25 complete native chain strips: pistol, rifle,
shotgun and plasma hit rows plus rocket kill rows for each of Crawler, Stalker,
Brute, Spitter and Carrier. All 24 quarter cells are visible in the quarter
contacts; four-phase native contacts alone skip some short impact peaks.

Observed: the point spark locates contact, and short drops retain the family's
lantern hue. Shotgun nonlethal reactions bend the small bodies more than rifle
hits, then return; killing impulses carry small victims farther than Brutes.
The rifle load remains restrained, especially at quarter scale; the flash is
still its strongest immediate cue. Brute's broad mass remains attached through
reactions and collapse. No detached limbs or explosive corpse energy observed.
Rocket paired rows are prescribed direct-contact studies, not proof of native
splash-direction association; the native firing lanes supply ordinary projectile
and explosion receipts separately.

Opened all twelve native motion contact pages and all twelve quarter pages,
covering run, primary attack, light/heavy/side hits, death and high-impulse death
for all five ordinary/elite families plus Warden and Matron. Opened complete
Carrier attack strip after its first phases looked too narrow in the contacts.
Crawler/Stalker loaded coils and Brute raised blades differ from locomotion;
heavy and side hits move connected bodies. Brute belly stays above the foot line
in the previously opened native Crew frames. Carrier's early windup instead
becomes a tall narrow column with hanging legs: unacceptable on the merged sac.
High-impulse Carrier/Matron corpses can still rock sac-up at the final 1.6-second
study cell; these short strips do not establish their eventual settled pose.

Look → fix: retain the reviewed hit envelope and killing carry; do not amplify
rifle feedback into a topple. Carrier-only correction `2d2ed75e` blends its held
windup at .62 against the already prepared neutral pose and removes the extra
parent rear tilt. First native warning-frame commitment remains immediate; no
phase clock, mesh, skeleton rest pose or hit shape changes. Separate
`runtime-carrier` build passed. A clean supplemental Carrier/elite/Matron strip
and pale/dark native lane review must establish the final result; the original
84-row cohort remains evidence of the rejected Carrier extreme.

Carrier supplemental look → retain (`runtime-final2`): opened all three native
contact pages and all three exact-quarter pages in `carrier-final` (15 rows),
then full Carrier/elite/Matron attack strips and Matron high-impulse death.
Compared with the rejected motion-final Carrier, the held body is less pitched
back and the exposed sac/torso remains a connected, broader mass. It still uses
an upright raised-abdomen silhouette; no new pose amplification is warranted.
Native `carrier-native` adds 30 frames each in Crew Checkpoint and Relay Racks:
opened both unresized enemy strips, native and exact-480 phase frames 01/08/15/20.
Feet, sac and torso stay connected and clear of the floor; the strike broadens
then recovery stays loaded. At 480 the warning communicates commitment more
strongly than the tiny body detail. Retain the Carrier correction. High-impulse
Matron still rocks/propps sac-up at the final 1.6-second study sample; eventual
settle remains outside that sample.

Native rifle pilot look → retain: `native-rifle-pilot` uses public rifle fire;
final receipt records 13 shots, 12 accepted contacts and a Crawler corpse.
The first two contacts are nonlethal damage 16 at 1.0833/1.2000 s; the third
kills at 1.3000 s and supplies corpse velocity (119.994, 1.190), carrying the
shot to the right. Opened original native frames 05/07/15 and exact-480 frames
01/05/07/15/30: the point spark/orange ichor and body load precede the carried
collapse; later Brute contacts remain restrained. At quarter size the tiny
Crawler flinch is still subtler than the impact cue. The existing native-strip
derivative cannot follow an actor after retirement (enemy-1 bounds absent at
frame 07); retain the unchanged full native frames as authoritative evidence,
plus exact-480 derivatives, rather than inventing corpse bounds.
