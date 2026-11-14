# K7 — creature and character design, wave 7

Branch `t3/redesign-creature-character-art`. Actor implementation commits `f100441` and `038d947`; contract coverage `362223a`; evidence/credits tooling `520bc76`; native warning timing `c06b175`. All final app captures/gates use `c06b17508a2c20e1579103f664cd7d1a37e17ea6`. Final delivery HEAD is in the handoff. Local work only: no push, PR, other-worktree writes, computer-use, phone controls/captures, simulation, UI, ability, world, lighting or camera-module edits. `DepthRenderer.ts` is unchanged; its existing active-rig snapshot hook already drives the suit modules.

## What shipped

- Crawler: low three-scute back, separate front mask/mandibles and six thick jointed contact segments. Brute: lowered siege posture, three overlapping dorsal plates, head/sensory cluster and substantial armored forelimbs. Spitter: high olive pressure vessel, forward muzzle and four outriggers. Stalker: narrow thorax, hooked forelimbs and raised rear stinger. Carrier: armored brood abdomen, forward head and six planted supports. Small variants inherit the same bone/scale fit. No white trapezoid shoulder caps remain.
- Added anatomy is one resident skinned draw per actor, replacing the former rigid ornament draw. Its compact inverse-bind skeleton references actual source animation bones. Idle/move/attack, remaining native 500/850/1150ms windup, body hit flinch, freeze, corpse dissolve and pool reset retain the original state paths. Spitter's actual vessel swells with windup; Brute's front braces. No visual determines a hit.
- Elites retain their dorsal crest and colored contour; Warden/Matron retain the broader three-prong crown. The MRT owner/region path, Low silhouette mode and preparation/resource ownership remain. Corpse bounds and positive-influence proxy fitting exclude hidden ranks and weak points. Carrier keeps its validated source physics proxies; its larger brood anatomy remains visual and complete rendered bounds still determine retirement contact recovery.
- Queen: recognizable front mask/sensory cluster, six scutes opening as two rigid wings, thick jointed supports, dark thorax and an open sternum. Two asymmetric ventricles, a smaller longitudinal valve and one feeder artery replace the smooth cup. Short flared tendons replace the rejected rectangular study frame. The organ/structure share exposure motion, normal correction and death gates. Nests repeat the scutes, paired organs and rooted supports, retaining three live material draws and prebuilt husks.
- Breacher: asymmetric ram shoulder/cheek plate. Cryo: paired raised back vessels. Pyro: squat fuel tanks and flat exhaust fins. Arc: open induction coils. All four are prebuilt in the existing suit-identity draw and switched with uniforms through the existing rig setter. Cyan-white head/shoulders, actual2.05m height, weapon socket and original marine screen-scale assertions remain.
- Data-only CC0 candidate conversion/audit, additive desktop scenarios, owner-buffer black masks, exact-area480 reductions, native actor motion strips, phase/crowd comparisons and hashed evidence compaction. No new runtime dependency or third-party actor asset.

## Route A/B and three standard critiques

Route B was selected after native/480 review on bright Awakening Bay, dark Infested Workshop and warm Overload Floor. Round1 rejected source-value competition and generic pink Spitter tissue. Round2 rejected the suspended Brute proportion and hidden suit canisters. Round3 approved the lower segmented predator, pressure-vessel Spitter and distinct Breacher/Cryo modules. A subsequent code review removed a duplicate height-reduction statement before final evidence; the lower physical Brute retains its original conservative framing reserve. All100 focused native packing/camera checks pass without changing their assertions.

The corrected CC0 comparison uses **Quaternius Ultimate Monsters / Alien**, whose author page explicitly links CC0. The author's Drive returned quota HTML, so the review uses an identified public mirror; original-author byte identity is unverified. Source673,408bytes; review conversion624,456bytes. Axis/posture and native clip names are mapped, photographic textures removed, and the same region/banded pipeline applied. Its upright long-neck humanoid shape conflicts with the armored siege role. Rejected candidate death would use frozen-pose retention, not a validated native ragdoll mapping. No candidate model is shipped: **new shipped actor assets0bytes /6MB**.

License/source evidence: [K7 provenance](plans/K7-provenance.md), `artifacts/nextgen/k7-standard/provenance/{provenance.json,CREDITS.md,LICENSE.txt}`. The audit distinguishes quota HTML from canonical CC0 legal text. All retained Unvanquished Creative Commons credits remain in README and public credits. New code-authored anatomy is repository MIT artwork.

Retained standard evidence (absolute):

- `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-standard/round-1-native480-contact.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-standard/round-2-native480-contact.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-standard/round-3-native480-contact.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-standard/route-ab-native480.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-standard/queen-study-native480-contact.png`

Full critique/corrections: [plan](plans/K7.md). Every retained contact links source PNG, owner-mask and manifest hashes. Successful intermediate PNGs are compacted after final review; failed raw evidence remains.

## Final evidence

Before gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/index.html`.
Final gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/index.html`.
Native crops copy actual pixels1:1.480 images are desktop art reductions, not phone captures. Black masks derive from actual rendered owner bytes and retain world/body occlusion. No blind recognition-rate claim.

| View | Before absolute PNG | Final absolute PNG |
|---|---|---|
| Crawler native motion | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-c6-silhouettes-containment-annulus-crawler-normal-1.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-c6-silhouettes-containment-annulus-crawler-normal-1.png |
| Spitter native motion | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-c6-silhouettes-containment-annulus-spitter-normal-2.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-c6-silhouettes-containment-annulus-spitter-normal-2.png |
| Brute native motion | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-c6-silhouettes-containment-annulus-brute-normal-3.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-c6-silhouettes-containment-annulus-brute-normal-3.png |
| Carrier native motion | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-c6-silhouettes-containment-annulus-carrier-normal-4.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-c6-silhouettes-containment-annulus-carrier-normal-4.png |
| Stalker native motion | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-c6-silhouettes-containment-annulus-stalker-normal-5.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-c6-silhouettes-containment-annulus-stalker-normal-5.png |
| Marine breacher | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-k7-standard-breacher-awakening-bay-marine-normal-0.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-k7-standard-breacher-awakening-bay-marine-normal-0.png |
| Marine cryo | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-k7-standard-cryo-awakening-bay-marine-normal-0.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-k7-standard-cryo-awakening-bay-marine-normal-0.png |
| Marine pyro | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-k7-standard-pyro-awakening-bay-marine-normal-0.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-k7-standard-pyro-awakening-bay-marine-normal-0.png |
| Marine arc | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/review/native-k7-standard-arc-awakening-bay-marine-normal-0.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/review/native-k7-standard-arc-awakening-bay-marine-normal-0.png |
| Queen armored | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/boss-reactor-vault-01.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/boss-reactor-vault-01.png |
| Queen opening | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/x2-queen-opening-high-reactor-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/x2-queen-opening-high-reactor-vault-04.png |
| Queen exposed | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/g2-queen-exposed-reactor-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/g2-queen-exposed-reactor-vault-04.png |
| Queen closing | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/x2-queen-closing-high-reactor-vault-04.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/x2-queen-closing-high-reactor-vault-04.png |
| Crowd residential-gallery | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/combat-kiting-residential-gallery-03.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/combat-kiting-residential-gallery-03.png |
| Crowd infested-workshop | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/combat-kiting-infested-workshop-03.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/combat-kiting-infested-workshop-03.png |
| Crowd overload-floor | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-before/combat-kiting-overload-floor-03.png | /Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-final/combat-kiting-overload-floor-03.png |

Inspect first: `review/k7-families-before-final-native.png`, `review/k7-marines-before-final-native.png`, `review/k7-queen-phases-native.png`, `review/k7-queen-phases480.png`, `review/k7-crowds-three-rooms480.png`, `review/k7-silhouettes-native.png` and `review/k7-silhouettes480.png` under the final root above. Individual exact480 full frames begin `review/480-`. Frozen/burning family bursts and native status-vfx retain the status stress evidence.

## Verification and presentation-pin replacements

No gameplay, deterministic simulation, persistence, navigation, accessibility, native input, resizing/recovery, collision, ragdoll joint limit, exact corpse silhouette or authored-room assertion was removed. The native packing fixture and camera assertions are unchanged. A full run exposed two real corpse bugs; source fixes preserve the original exact bake and joint-error tests.

Presentation-specific replacements:

1. `FamilyAnatomy.test.ts`: three old small-family add-on shapes/max-five pieces become all-five-family back/body/front/contact-mass and categorical-design guarantees. Original conservative.50-span design bound and actual animated collision tests remain.
2. `ActorRegions.test.ts`: original source-skin region checks remain; the new skinned anatomy is additionally audited through its categorical, triangle-constant identity roles and shared buffers.
3. `G5ActorTreatments.test.ts`: family visual-height pins include Carrier's higher brood form and the original conservative Brute frame reserve around its lower physical rig; rank clearance remains.
4. `X2Actors.test.ts`: marine roles0/1 now include four resident module gates; distinct family palette test reads actual authored body values; old broad-shoulder shield normal-count pin becomes closed segmented carapace/three divisions/triangle budget; Queen normal handoff now includes skinning.
5. `QueenAnatomy.test.ts` and Queen-only X2 pins: smooth bowl/complete-lip ordering becomes closed target nesting, two rigid hinges, open sternum/depth, paired ventricles and smaller valve/artery. Actual CPU skinning checks every identity vertex over20 native poses ×5 opening samples inside the unchanged92/32*.99 envelope. Exposure/death/resource ownership is stronger.
6. `ActorGeometryMaterial.test.ts`: equivalent skinned normals, expanded weak-point death gates and rig visibility gates replace exact old shader literals; owner IDs, MRT/exclusions and program-key equality remain.
7. `I8ActorGraphics.test.ts`: the pale-cap/saturated-family fallback palette pin becomes a dark articulated-body/armor contrast guarantee and five deliberate body palettes, including the actual renderer fallback.

New K7 coverage proves joint references, finite shared buffers, resource disposal/reuse, status identity, four physical rig silhouettes below the original helmet height and warning timing from actual snapshot durations. The late-room1150ms Brute duration is no longer normalized against an inherited850ms constant. Native warning capture receipts record850→550→250→release and500→200→release without editing cooldowns or simulation state.

Aggregate `npm run verify` cannot complete in this environment: the unchanged Python monitor artifact stage raises `FileNotFoundError: 'blender'`. The first three Python artifact suites pass; later Python stages are not claimed. Blender is absent fromPATH and default Python also lacks Pillow. No asset/test was changed, no prerequisite installed and no gate bypassed. Independent required JavaScript/browser stages are run after that external-prerequisite stop; their final summary lines are recorded below.


Final summary lines (logs: `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-standard/gates-final/`):

```text
npm ci: completed (84 packages); initial and final npm run build: PASS.
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs
  Test Files 333 passed | 2 skipped (335)
  Tests      3797 passed | 2 skipped (3799)
node --test scripts/cryo-model-preview.test.mjs: tests2 /pass2 /fail0.
npm run test:room-evidence: tests28 /pass28 /fail0; ragdoll {passed:true,cpuOnly:true,checks:33}.
npm run build: PASS (257 modules; existing large-chunk advisory remains).
npm run test:smoke: Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
npm run test:authored-smoke:all: Authored desktop smoke passed:20 rooms, native move/fire, Continue/route, pause/resume, Low quality, no browser errors.
npm run playtest:smoke: room-limit;3 rooms cleared;0 errors (Arc seed1729).
npm run bench: accepted final matrix12/12 strict hardware/resource rows PASS; errors[]; budgetFailures[].
bench:rooms final:42/42 PASS; errors[]; failures[]; max1731.9ms; post-ready/combat compiles0.
Final art capture:101 native frames /25 sprites; errors[]; failures[].
K7 review:101 native sources;313 outputs;0 explicit missing views.
K7 candidate audit: PASS; source673408 bytes; review output624456 bytes; new shipped actor assets0 bytes.
I10 retained-license audit: PASS;4 kits,7 atlas sources; original wave6 outputs/inventories unchanged.
npm run verify: NOT COMPLETE — FileNotFoundError: 'blender' in unchanged Python monitor artifact test.
```

`npm run verify` runs the exact requested Vitest command above with `VITEST_MAX_WORKERS=2`; no worker/test exclusions were added. The two pre-existing skipped tests are retained. Browser stages are serialized in this task. Screenshots are disabled only for the smoke harness's optional screenshot saving; all native behavioral assertions execute. Overload Floor's existing explicit fatal-room authorization remains.

## Measured budgets

Before app `cbebef01e118a6c5878b3ec06fd03774eb92a3ef`; final app `c06b17508a2c20e1579103f664cd7d1a37e17ea6`. Real native1920×1080 High, accelerated Metal, ordinary20s trials, three repeats per room/rig; normal adaptive resolution enabled. Best-of-three is minimum frame-p95 with its paired scale/load, not independent minima. Host load is1-minute OS load average on10 cores. No staged screenshot is used as performance evidence.

| Room / rig | Before best p50 / p95 ms | Final best p50 / p95 ms | Paired minimum scale before / final | Cohort peak draws before / final | Selected host load before / final |
|---|---:|---:|---:|---:|---:|
| relay-racks / cryo | 16.7 / 18.2 | 16.7 / 18.0 | 0.900 / 0.950 | 289 / 287 | 12.84 / 16.00 |
| relay-racks / pyro | 16.7 / 25.5 | 16.7 / 18.1 | 0.800 / 0.900 | 285 / 291 | 13.54 / 14.65 |
| crew-checkpoint / cryo | 16.9 / 33.3 | 16.7 / 18.0 | 0.800 / 0.950 | 216 / 224 | 16.08 / 17.07 |
| crew-checkpoint / pyro | 25.1 / 50.0 | 16.7 / 18.0 | 0.800 / 0.950 | 228 / 227 | 17.71 / 14.10 |


The accepted final matrix passes **all12 individual trials**, not just the selected best: p50=16.7ms, worst p95=18.3ms≤20, minimum sampled adaptive scale=.90, peak draws291≤330, combat shader compiles0, resident program inventory108–109. CPU submission p95 ranges11.3–13.7ms; this meets the requested frame budget but does not meet an aspirational8ms CPU budget. No full four-rig/twenty-room hardware claim is made.

Baseline had1/12 strict rows, worst p95=58.3ms and scale floor=.80 under load11.32–33.71. Accepted final load13.69–17.45. These different host conditions preclude a causal speedup claim. Draws at the compared scenarios remain within budget with one replacement anatomy draw per actor. Fresh/sequential High preparation covers21 rooms including Queen,42 rows: max **1336.3→1731.9ms**, both below3000ms, zero post-ready/actual combat compiles. Preparation host loads8.32–10.81 before and21.22–30.54 final. Actor asset addition **0bytes**; original procedural source code contributes normal lazy actor chunks, not a hidden binary asset exemption.

Raw matrix and load/hash summary: `/Users/chernodub/.t3/worktrees/containment-game/t3-e581652c/artifacts/nextgen/k7-standard/budgets/comparison.json`; chart `comparison.html` beside it. Raw accepted trials: `artifacts/nextgen/k7-bench-accepted-final/benchmark.json`; preparation `artifacts/nextgen/k7-rooms-{before,final}/rooms.json` (all relative to the worktree above).

Ownership audit correction: the first process filter matched `/Chromium` but missed **Google Chrome for Testing**. Its empty inventories do not establish exclusivity. A risk repeat observed another stream's browser and the first corrected matrix became contested partway through. The final accepted rerun uses corrected executable matching, helper exclusion and ancestor matching to the benchmark parent: two clear prechecks10s apart,63 sampled inventories, own browser observed, external browser **never** observed. Receipt: `artifacts/nextgen/k7-standard/exclusive-acceptance/ownership.json`. Shared CPU load still exists. All63 trials remain, including baseline12, pre-timing12, first final12 (one scale.875 miss), contested risk3 (0/3), interrupted exclusivity12 (6/12), accepted12 (12/12). Their errors/resource checks remain visible; CLI exit0 alone was never treated as proof of hardware acceptance.

## Final critique, cleanup and remaining gaps

The final board was opened after the warning correction. Bright/dark/warm crowd reductions now show brown segmented backs, dark trunks and contact limbs instead of repeated white caps. The source-animated front, thick supports and segmented back provide a coherent siege role. Spitter remains a contrasting high pressure-vessel silhouette. Queen's mask, divided mantle and paired anatomical target are more specific than the former flower cup; armored/exposed/closing use visibly separate shapes. Marine modules change actual black outlines while preserving the cyan-white head/shoulders and original native screen-size guarantee.

This is an economical procedural redesign over retained licensed animation, not new bespoke sculpting. Some original angular thin appendages and the Carrier's elongated source abdomen remain visible between added forms. Tiny Crawler/Stalker silhouettes and the restrained Pyro/Breacher distinction are subtle at480 and need learned context; there is no blind user-recognition study. Burn/freeze fixtures retain readable mass differences; actual Arc boon receipts prove shock events, but there is no new full-body shock skin. Windup duration is now exact, though source attack clips limit the gesture richness. Carrier retains source ragdoll proxies rather than inflating its brood sac into unstable joints. Human play and full-run balance were not evaluated; the native bot gate covers three rooms. Aggregate Python asset verification remains blocked by missing Blender/Pillow prerequisites.

Final family/rig/Queen/crowd boards, native phase PNGs, black480 and status/warning strips were inspected through PNG files only. No desktop-control tool was used. Final successful gallery keeps101 frames; baseline keeps64. One contact per successful critique round plus Queen/propagation/pre-timing contacts remains under `k7-standard`. The fair final-app A/B sheet supersedes the earlier candidate board; its source/audit hashes are refreshed. Cleanup removed1,501 successful intermediate PNG/gallery files,1,444,307,601bytes; manifests/source hashes remain in `k7-standard/compaction-receipt.json`. The first semantically invalid A capture retains all76 raw/review PNGs and its failure explanation. No failed raw run was erased.

No integration hooks or simulation changes are required. The work is committed locally in small actor/contract/evidence/timing/report commits. No push or PR was created.
