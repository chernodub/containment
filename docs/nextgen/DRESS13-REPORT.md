# DRESS13 placement correction

This report supersedes the first-pass visual acceptance. All six infestation rooms and all fourteen incident rooms were rechecked and corrected after merging nextgen at 24836470. Production placement source: e4940156dfa5bd65bb5aeacb6c6338b6ec7e3a4d; later diagnostic changes adjust only opt-in capture inspection positions/timing.

Swarm Junction now uses the visible hive heart and local floor spill as its landmark, floor-backed plenum nests and consumed machinery, pod groups and short sloping anchor-to-anchor webs. Broad creep fields and cross-room bars are removed. Workshop colonies occupy the actual rear tool bay; Gate, Annulus and Manual growth follows inner wall faces and supported machinery; Overload growth is dark and dim at the reactor heat boundary. Wall crust faces inward below roof caps. The encounter floors and main lanes remain clear, with root creep confined to peripheral masses and machine feet. No new colliders were added.

Residential Gallery now has thirteen semantic pieces: five packing cases, open drawer/lids, tipped chair, cabin furniture barricade, dragged rumpled bedding, personal effects and the child's drawing, connected by scrape/gouge detail. The other thirteen incident rooms have visible ten-to-twelve-piece compositions with evidence specific to their incident. Atrium tables use recognizable overturned dining-table silhouettes; Coolant's ice fan and tape are exposed; the fallen Shaft cage is separate from its working winch.

The shared Brood atlas and KTX2 shipping remain unchanged: linear UASTC normal atlas, shared by instances, with a 1.333MiB 8bpp mip payload bound versus 5.333MiB RGBA8 fallback. This is format payload, not measured driver allocation. Licenses and cache/disposal ownership are preserved. No simulation, actors, camera, ability effects, UI or difficulty changes were made.

## Visual review

All twenty rooms have two opened native/480×270 look→fix rounds, with additional rounds for Workshop, Overload, Residential, Atrium, Coolant and Annulus. Details: [master review](plans/DRESS13-review.md), [root rooms](plans/DRESS13-correction-root.md), [Gate/Annulus/Manual](plans/DRESS13-gates-correction-review.md), [early incidents](plans/DRESS13-early-correction-review.md), [service incidents](plans/DRESS13-service-correction-review.md).

Gallery: artifacts/nextgen/dress13-final/index.html. Each room retains five final tour positions and one calm frame (120 quiet frames total), plus one native twenty-contact kiting study. Opened native crowd images and both exact 480×270 contact sheets: new dressing stays peripheral, marine bodies remain visible, and active telegraphs/projectiles retain visual priority. Every study starts from 20 accepted native spawns; Passenger Vault/Freight Hold retain 19 survivors after firing, the other eighteen retain 20. These staged images establish readability, not campaign balance or hardware FPS.

Raw capture failures are retained under diagnostics. Safety's original named-space marks cropped the existing warning on the merged baseline; legal west-shoulder diagnostic marks preserve the warning/body guards. Atrium's later 650ms study reaches an existing foreground block (also seen in previous DRESS13); Manual's 650ms warning crop reproduces on the merged baseline. Their DRESS13-only 300ms movement holds retain the same 20 spawns, firing, grenade and unchanged camera/guards. All selected final captures pass; failed raw/baseline evidence is not discarded.

## Build, campaign and budgets

Initial npm ci and build passed; final npm run build passed after all placement and fixture changes. No automated tests or assertion gates were added.

The final unassisted native Story campaign (Cryo, seed 1729, ordinary render-every-tick mode) completed 20/20 rooms in 1814.1s, outcome complete, errors[] and defects[], with no stuck bot. Receipt: artifacts/nextgen/playtest/dress13-correction-story-final/report.json. Distribution source SHA: e4940156dfa5bd65bb5aeacb6c6338b6ec7e3a4d; source asset hashes and native input trace are retained with the report.

The following before→after values compare the previous DRESS13 benchmark with the current merged correction, one ordinary 10-second High/Cryo trial per room. Upstream actor/renderer changes, native population, effects and adaptive resolution vary; this is not an isolated dressing-cost comparison. Raw receipts remain in bench-after/ and bench-correction/. Draws/triangles are whole-frame maxima; scene texture estimates subtract inventoried render targets and exclude driver padding/unreferenced caches. One timing repeat does not establish stable hardware FPS.

| Room | Draws before → current | Triangles before → current | Scene texture MiB before → current | Current bench prep s |
|---|---:|---:|---:|---:|
| awakening-bay | 175 → 180 | 798,639 → 801,155 | 110.41 → 110.41 | 1.86 |
| passenger-vault | 141 → 143 | 551,941 → 564,187 | 59.81 → 62.59 | 1.33 |
| residential-gallery | 139 → 143 | 527,882 → 541,585 | 46.98 → 48.98 | 0.80 |
| communal-atrium | 149 → 163 | 528,082 → 535,118 | 72.68 → 72.68 | 1.20 |
| crew-checkpoint | 132 → 140 | 530,980 → 523,708 | 46.99 → 48.31 | 0.82 |
| armory | 164 → 246 | 526,670 → 543,158 | 48.42 → 48.42 | 1.10 |
| freight-hold | 137 → 586 | 540,839 → 542,535 | 49.52 → 49.76 | 1.23 |
| breached-loading-bay | 141 → 153 | 536,574 → 561,796 | 51.07 → 51.31 | 1.24 |
| relay-racks | 141 → 152 | 529,543 → 541,112 | 66.97 → 67.09 | 0.84 |
| transmission-chamber | 140 → 1800 | 568,304 → 548,330 | 66.42 → 66.32 | 1.54 |
| diagnostic-gallery | 134 → 143 | 539,012 → 574,164 | 47.31 → 47.31 | 0.81 |
| safety-interlock-station | 277 → 332 | 580,237 → 569,903 | 49.71 → 49.58 | 1.33 |
| coolant-plant | 132 → 142 | 529,518 → 523,284 | 60.41 → 64.42 | 0.79 |
| service-shaft-landing | 143 → 150 | 507,972 → 525,852 | 49.85 → 51.78 | 0.83 |
| infested-workshop | 183 → 214 | 535,502 → 545,584 | 50.01 → 49.89 | 1.05 |
| swarm-junction | 118 → 121 | 576,437 → 548,059 | 41.28 → 47.09 | 0.90 |
| shielding-gate | 195 → 206 | 510,943 → 528,493 | 68.42 → 68.31 | 1.47 |
| containment-annulus | 150 → 159 | 641,379 → 719,860 | 69.67 → 69.67 | 2.79 |
| manual-control-chamber | 175 → 222 | 538,573 → 557,346 | 43.31 → 43.42 | 1.46 |
| overload-floor | 139 → 147 | 574,552 → 578,862 | 39.65 → 43.43 | 1.74 |

All twenty current benchmark rooms report zero mid-combat shader compiles, browser/GL errors or context losses; maximum measured preparation is 2.79s. Seventeen rooms meet the 330-draw target. Freight Hold reaches 586, Transmission Chamber 1,800 and Safety Interlock 332; these are unresolved live-frame budget misses, not a clean performance acceptance. A separate draw audit reproduces Freight at 592 and Transmission at 1,819: existing cargo architecture contributes 468 calls at the peak, and the communications obstacle contributes 1,664. Safety varies to 293 in the audited repeat. These breakdowns identify where to investigate; the audit is not a matched baseline proof. Raw failures and audit receipts remain under bench-correction/ and bench-correction-audit/. Existing architecture is left for its owner rather than changing another stream during placement review.

The quiet capture series also retains a 6.68s Manual cold-preparation outlier, exceeding the 3s target; it is not hidden by later warm measurements.

## Remaining weakest details

Diagnostic Gallery's existing warning sign competes with the torn-cradle story. Relay Racks' fine tools/fibre still reward native inspection more than 480 viewing. Annulus is continuous and supported now, but its repeated organic relief is still less natural than Swarm's grouped masses.
