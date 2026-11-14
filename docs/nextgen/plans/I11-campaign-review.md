# I11 native campaigns and real-fight storyboards

Campaign application: `a112e70154be57c77430d0ad5c61bd9e87ef90e1`, served from
`artifacts/nextgen/i11/frozen-dist/`. This is the frozen application source; each
campaign report separately records harness HEAD, startup JS/CSS hashes and
`SOURCE_SHA`. Full seed1729 campaigns run unassisted, serially, with one owned
Chromium browser, ordinary fixed60Hz simulation and every fixed tick rendered.
A second owned browser may capture the visual gallery concurrently. These
fixed-step times are CPU submission evidence, never hardware FPS.

The optional first-room storyboard sampler observes the existing clock every 0.5s.
It adds no simulation tick, input/policy/camera change, damage adjustment or
ability override. The existing entry and true clear screenshots bound each
storyboard. Final file-only selection must retain twelve distinct strictly
increasing observations, including ten actual fight frames. Native PNGs and
snapshots remain unchanged and source hashes are retained.

No campaign is rerun to replace a natural death or improve an outcome. No balance,
simulation, camera or policy tuning is permitted after application freeze. All
raw reports, traces, errors and failed evidence remain authoritative.

## Completion and evidence ledger

All four original campaigns completed without infrastructure errors or soft-locks.
Cryo cleared the full twenty-room story. Breacher died in Swarm Junction, Pyro in
Shielding Gate, and Arc in Containment Annulus. Natural deaths were retained; no
campaign was rerun. All four reports have zero errors and zero defects.

`artifacts/nextgen/final5/play/index.html` contains four twelve-frame Awakening Bay
storyboards. Candidate counts are 26/40/28/25 (Breacher/Cryo/Pyro/Arc), spanning
12.533/19.100/13.383/11.750 simulated seconds. Every sequence has actual entry,
ten distinct fight observations and actual clear; no duplicate padding. The
71 organic native mid-fight PNGs in `final5/organic/` provide 16/20/17/18 per rig,
with both early and late rooms for every rig. Queen does not occur in these
ordinary twenty-room campaigns; no legacy save or fixture is used here.

Actual image opens are recorded with exact paths and SHA256 in
`artifacts/nextgen/i11/campaign-review-opens.json` (139 explicit opens). The
coverage proof `campaign-review-coverage.json` bridges all 119 final native PNGs
(48 storyboard +71 organic) to actual opened native bytes. Earlier raw-campaign
opens remain raw-path witnesses and are matched to final copies by SHA256.
All four storyboard sheets and all twelve organic sheets were opened at original
sheet dimensions. Each of their 119 displayed480×270 tiles was independently
compared against its standalone reduction:46,267,200 RGB channel comparisons,
zero mismatches. This proves the viewed sheet cells are the standalone reduction
pixels; it does not claim that every standalone reduction was individually opened.
The exact blit correction preceded these final sheets, so no pre-fix sheet is
counted. Original native PNGs and snapshot JSONs were never edited.

Two review passes were completed: native source images while campaigns ran, then
final exact480 sheets plus all Arc natives after assembly. The first pass retained
edge framing and landmark concerns below. The evidence-tool correction replaced
floating-point-scaled contact-sheet copies with integer1:1 blits and meaningful
pure tests (4/4 passed); the second pass verified every final tile. Application
code remained frozen. No presentation assertion or gameplay pin was rewritten.

## Native observations recorded during the serial runs

Breacher's single run ended naturally in Swarm Junction: 15 clears/16 entered,
11  authoritative Overdrives and 11 native cast receipts, no errors or defects.
Its first-room clear provides 26 observations over 12.533s. No death was rerun.
The native first-room sequence shows entry, initial warning, native tactical
impact/kinetic plates, kiting/reloading, an approaching final Brute and the actual
`SECTOR CLEAR` beat. All twelve selected native frames and all sixteen native
organic mid frames were actually opened before final assembly.

Early combined actors show articulated brown Crawler/Brute backs and olive
Spitters rather than repeated pale cap shapes. Chilled/frozen Cryo enemies retain
the upper anatomy and categorical family masses. On-hit white flashes retain
the outlines and are transient feedback; this is not a claim that every actor
pixel always stays its base color. Cryo's back modules visibly change the marine
outline. Critical health/ammo numerals keep their local backing when surrounding
panels fade.

Candid framing limits remain. Breacher Passenger Vault has lower-edge peripheral
body crops. Residential and Armory concentrate the encounter along the left/top
edge. Breached Loading Bay has top-edge peripheral bodies. Relay and Transmission
mid samples can contain no visible enemy bodies while the native threat bearings
remain. Diagnostic can likewise show a remote-only fight. Safety's marine stays
clear but opponents sit near the top/left boundary. Infested/Swarm decoration is
sculptural compared with the old broad lavender coverage but still repeats dark
procedural folds and can dominate the opposite half of the image. These are art
and encounter-framing qualifications, not runtime soft-locks. No camera assertion
is removed and no source tuning follows application freeze.


## Final campaign measurements

The complete source-derived tables live in
`artifacts/nextgen/i11/campaign-summary.md` and `.json`. Their `accepted=false` is
intentional: runtime acceptance passes, but preparation observation is incomplete
and selected-contact bounds fail. No gate or assertion was weakened.

| Rig | Outcome | Clears / entered | Deaths | Overdrives / cast receipts | V intervals min / median / max s | Sampled UI holds / max ms | CPU room p50 min / median / max ms | CPU room p95 min / median / max ms | Wall s | Load1m start → end | Errors / defects |
|---|---|---|---:|---|---|---|---|---|---:|---|---|
| breacher | dead | 15 / 16 | 1 | 11 / 11 | 33.6 / 55.8 / 87.9 | 15 / 711.7 | 2.9 / 4.4 / 5.6 | 4.2 / 7.1 / 9.8 | 616.5 | 11.4 → 19.9 | 0 / 0 |
| cryo | complete | 20 / 20 | 0 | 14 / 14 | 28.1 / 50.8 / 78.1 | 19 / 660.7 | 3.3 / 5.2 / 7.2 | 5 / 8 / 12.8 | 751.2 | 17.7 → 22.3 | 0 / 0 |
| pyro | dead | 16 / 17 | 1 | 11 / 11 | 30.5 / 46.1 / 58.8 | 16 / 640.4 | 4 / 5.7 / 7.8 | 5.9 / 8.4 / 18.8 | 568.5 | 18.5 → 48.7 | 0 / 0 |
| arc | dead | 17 / 18 | 1 | 13 / 13 | 33.5 / 39.3 / 76.6 | 18 / 675.4 | 3.9 / 5.4 / 7.4 | 6.8 / 9 / 23.2 | 703.6 | 47.2 → 60.5 | 0 / 0 |

## Actual renderer preparation receipts

Per-campaign room+started deduplication of actual renderer histories; every report-listed native shot JSON and terminal report snapshot are inspected. Campaign pages remain distinct. UI loadingHolds are separate sampled observations, not substituted for receipt totals.

| Rig | Completed / distinct receipts | Min / median / max ms | Over3s | Typical≤1.5s | Missing / invalid / zero-total | Entered rooms without receipts | Accepted |
|---|---:|---:|---:|---|---:|---|---|
| breacher | 7 / 18 | 417.8 / 838.8 / 1446.4 | 0 | true | 0 / 0 / 11 | none | false |
| cryo | 8 / 22 | 374.5 / 691.3 / 1537.3 | 0 | true | 0 / 0 / 14 | none | false |
| pyro | 7 / 19 | 371.5 / 864.5 / 1355 | 0 | true | 0 / 0 / 12 | none | false |
| arc | 7 / 20 | 407.5 / 842 / 1459.3 | 0 | true | 0 / 0 / 13 | none | false |

All completed receipts: 29; min / median / max 371.5 / 840.3 / 1537.3ms. Raw recorded totals including zero sentinels are retained separately in JSON. Over3s failures: 0.
The UI-hold column above is sampled by the bot policy and may miss short holds. It is not the renderer-preparation table. Zero-total-only receipts remain incomplete; no missing preparation history is inferred from a favorable UI sample.

Organic frames: 71. Minimum6 per rig: true. Early (depth≤5) and late (depth≥10) coverage per rig: true. Actual marine-bound failures: 0; marine/HUD overlaps: 0; selected-contact bounds failures: 14; missing selected-contact receipt frames: 0.
Hero scale failures: 0; qualified AABB-rule failures: 0; literal full-AABB exceedances: 0; small-axis qualified frames: 0; actual hull exceedances: 0; missing C6 receipts: 0. An AABB pass does not mean an exact-hull pass.
Peripheral outside frames: 71; faded-HUD coverage frames: 17; conservative unfaded-coverage candidates: 11. Candidates require PNG review; they are not automatically classified as hidden danger.

| Rig | Organic frames | Saved depth range | Hero pixels min–max | AABB outside max | Exact hull outside max |
|---|---:|---|---|---:|---:|
| breacher | 16 | 0–15 | 100–122.2 | 15.8% | 15.9% |
| cryo | 20 | 0–19 | 100–122 | 17.2% | 17.2% |
| pyro | 17 | 0–16 | 100–124.9 | 16.4% | 16.4% |
| arc | 18 | 0–17 | 100–123.1 | 16.4% | 16.5% |


All wrapper logs/load receipts are under `artifacts/nextgen/i10/logs/` with labels
`i11-campaign-{breacher,cryo,pyro,arc}`. Host load was high and a second gallery
browser ran concurrently; these numbers cannot substitute for the parent's
single-browser hardware benchmark. Fifty zero-total preparation receipts remain
incomplete; completed receipt totals and sampled UI holds are different measures.
All 29 completed actual receipts are below3s, median840.3ms, worst1537.3ms, but
those receipts do not certify all 79 distinct observed preparation attempts.

## Final visual judgment and showcase candidates

At 480 the sequence of warning, attack, native kiting/reload and real clear is
readable. Brown multi-lobed Brutes, low Crawlers and olive Spitters are visibly
different family masses; frozen enemies keep their upper anatomy. Tiny individual
limbs still merge at480 and transient white hit flashes remain bright. Corpses
have articulated dark brown masses rather than pale pennant shells. The organic
set cannot alone certify every rank/family under all ten lighting compositions;
that is the separate guarded fixture gallery's scope.

Overclock's persistent echoes and suit electrical treatment are especially clear
in Arc Atrium4/Loading8, and Meltdown's mantle is visible on Pyro organic frames.
Cryo's Whiteout field and ice wedges remain distinct from thick orange hatched
hostile telegraphs; friendly previews are thin/dashed. Native HUD health and ammo
remain readable with local opaque backing. At 480, the critical numerals remain
legible but small auxiliary labels are reduced to marks; these are art-review
reductions of desktop evidence, not a separate supported UI size.

The second pass confirms the native framing concerns. Arc's selected danger is
low/left in Passenger2, Armory6, Relay9 and Diagnostic11. Transmission10 has only
remote threat bearings. Arc Containment18 lets the broad foundation dominate
nearly the whole right side while the battle sits along the left/bottom edge;
the raised-landmark share bound excludes that foundation. Cryo Containment18 has
the same composition weakness. At Pyro Shielding17 enemy overlap and flame obscure
some marine limbs despite a valid full-body projection and clear helmet/ring.
Bounds certify projection and HUD clearance, not world/actor occlusion. A readable
marine and AABB pass do not establish that every actual fight fits the usable
viewport. Fourteen selected-contact failures remain explicit in the audit.

Recommended actual organic fight images, all under
`artifacts/nextgen/final5/organic/`, all with visible enemy bodies and no legacy boss:

| Rig | First choice | Second choice | Reason / qualification |
|---|---|---|---|
| Breacher | `breacher-r4-communal-atrium-mid.png` | `breacher-r13-coolant-plant-mid.png` | Railbreaker with Brute/Spitter; hostile lane over ice. Peripheral combat remains edge-weighted. |
| Cryo | `cryo-r4-communal-atrium-mid.png` | `cryo-r13-coolant-plant-mid.png` | Whiteout and categorical Brute/Spitter; Glacier against hostile lane. |
| Pyro | `pyro-r4-communal-atrium-mid.png` | `pyro-r13-coolant-plant-mid.png` | Meltdown plus brown Brute/olive Spitter; fire retains hostile lane priority. |
| Arc | `arc-r8-breached-loading-bay-mid.png` | `arc-r4-communal-atrium-mid.png` | Persistent Overclock echoes, actual live Crawler/Spitter or Brute; strong marine separation. |

These are best-image recommendations, not an assertion that all ordinary fights
meet the vision. No 25-stacked-enemy fixture or legacy Queen image is recommended.

## Continuing gallery capture

After the fourth campaign browser closed, the reserved second capture slot began
`node scripts/nextgen/i11-capture.mjs --label-prefix=i11-720 --width=1280 --height=720`
against the same frozen source. The sibling owns 1080 capture; no third browser is
launched. Per-batch logs and host load receipts remain under `i10/logs/` and
`i11/capture-receipts-i11-720-0.json`. Final batch outcome is reported to the lead
separately; intermediate capture folders are retained for review.

Tool verification: targeted Vitest 4/4 passed (149ms); runner and assembler Node
syntax checks passed. An initial invocation with `node --test` used the wrong
runner for this Vitest file and failed during import; the correct Vitest run
above passed without any code change.

### Bounded 720p evidence staging correction

Base720 batches00–18 passed. Batch19 stopped before saving any guarded frame:
`i8-families:containment-annulus` reported ten legal initial family marks and its
fallback could not settle twelve full native bodies. The failed directory
`artifacts/nextgen/i11-720-batch-19/` is immutable, including failure PNG/JSON.
This is a fixture placement failure; application assets remained frozen.

At the lead's instruction the compact Annulus fallback alone now reserves18px
body headroom instead of6px and searches up to96 lawful marine origins instead
of48. Its final production camera, complete native actor bounds, radius/hull
predicates,105-unit marine reserve,76-unit spacing, requested15 and existing
minimum twelve/five-family/phase/HUD assertions are all retained. No assertion
or presentation pin was rewritten. The additional margin is stricter and lets
placement survive production framing convergence.

Fresh isolated browser probes passed all four phases at both desktop viewports:
`i11-720-c6-lawful-probe` retained twelve full native bodies;
`i11-1080-c6-lawful-probe` retained fourteen through the unchanged legacy grid.
Both have zero errors/failures, five families and requested15. Native720 phases
were opened individually; their silhouettes remain distinct, while the broad
Annulus foundation still dominates the right side. The capture then resumed
batches19–27 using fresh prefix `i11-720-lawful`; original failed19 is not reused.

Lawful19–20 subsequently passed all eighty phases. Lawful21 failed before saving
frames at Diagnostic Gallery with the same convergence problem: matching could
find fifteen bodies, then production framing moved their bounds. The failed
`i11-720-lawful-batch-21/` PNG/JSON/manifest is retained unchanged.

The lead requested consistent compact fallback treatment. All720 family fallbacks
now use the same stricter18px margin and96 lawful origins; exact1080 behavior is
unchanged. No room allowlist or count/assertion relaxation remains. A bounded
all-ten-mood720 probe passed40 native phases, with full body counts12/15/13/12/12/
15/15/13/15/13 for Awakening/Residential/Checkpoint/Freight/Relay/Diagnostic/Shaft/
Infested/Shielding/Overload. Every saved phase retains five families, requested15,
minimum twelve,76 spacing and existing full-body/HUD/phase guards. Separate
Diagnostic probes passed all four native phases at720 and1080. These probes are
validation only; final selection uses base00–18, lawful19–20 and fresh compact21–27.
