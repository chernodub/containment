# L8 Act 3 — replacement-standard implementation

**Qualification history:** independent review `L8-final-plan-review.md` (cf6708d) withheld the 9a44 architecture and superseded its initial semantic critique below. Diagnostic/Workshop then used open floor as named subspaces, and Safety overstated its gallery as booths. Root subsequently accepted the actual workbay/side-door revision in frozen `659ac9d`, described at the end. The complete failed 9a44 cohort remains retained. Current balance, dressed-art, browser and hardware acceptance remain pending.

This packet supersedes the dormant round6 Act3 candidates. It follows the accepted replacement round9 standard at source `73d164e61af7c0d4172a7b189c319037e92d2d2e`. Root has integrated its plan and presentation hook. The initial pass changed no route, story, encounter, ability, actor, checkpoint, progression, input or UI fields. Later authorized layout/encounter balance corrections are recorded below and in `L8-simulation-verification.md`.

## Initial architectural language and critique (superseded where noted)

Diagnostic Gallery is a working diagnostic nave between an instrument gallery and a south service return. Its recorder, switch cabinets and drawer banks back onto real hull plates; short attached separators explain instrument stations. The entry and exit are articulated threshold bays, with two broad lanes to each. The center is quiet open working floor rather than a collection of machinery islands.

Safety-interlock Station has a port inspection floor, a double-ended interlock cage, recorder/AI booths off the north gallery and a battery-backed south return. The disconnected source mechanisms remain separate. A marine may cross the cage, skirt through the booths, or return south. Only the cage's two U-shaped ends are free solid components; they are both waist height. The cage doorways are 160 units wide, with a native-tested escape at either side.

Coolant Plant has four hull-built pump banks, port/starboard service galleries and north/south headers. The final return manifold is split into two low160×100 banks with a160-unit cross-service route between them, so enemies and the marine can cross the loop directly. The machinery is continuous pressure equipment with two pump barrels per bank, collars, supported bearings, headers and manual valves; it is no longer dozens of tiled isolated pump cells. Its source count is bounded by six live machine footprints; both low return banks retain their machinery details.

Service Shaft retains the exact accepted C cutout and all lift/counterweight/guide/sheave/sign assemblies. The upper and lower docking recesses make actual hull bays; the east mouth touches the hull. Its two 140+ lanes at each broad C elbow preserve separate escape routes without inventing a bridge over the shaft. The source floor grain, separate cassette material, shader hook/cache key, roof support semantics and exact-once disposal remain intact. New shell panels, outboard ribs and flush seam endpoints follow the actual polygon.

Infested Workshop remains a former inhabited machine shop: a north lathe, southwest workbench, east wall gantry and southeast stock cabinet surround the work floor. A loading vestibule, tool gallery, service gallery and two-entry gantry alcove explain the plan. Resin grips the real lathe separator, bent doorway partition and return seam. Existing source torn guards, chuck/tailstock, gripper contact, insulation break and tendon anchors survive. Only the two foreground equipment models are lowered to 0.90m; their XZ envelopes and detailed assemblies remain whole.

Demanding plan critique: these are five legible places, and their playable floor fills the plan rather than surrounding inert central landmarks. Safety's alternatives are the strongest fight composition. Coolant shares the useful engineering aisle vocabulary with Relay but differs in serviceable pressure banks and a return manifold. Diagnostic deliberately gives more open Railbreaker/dash ground; its challenge must come from encounters rather than cover density. The shaft remains the longest pursuit route, and the measured native crowd opportunity at its upper exit is 21.25s; this passes the 60s bound but requires native campaign observation. Workshop's doorway deformation has a structural origin and leaves both entries usable. These are plan/source-geometry judgments, not a claim that final dressed native captures have passed art review.

## Numerical geometry changes

Frozen reference: `tests/fixtures/l8-walkable-baseline.json`, source `7ceefa5a52cc74a6b95712f29653d9bf523906be`, 2-unit union sampling. Full before/after numbers for every changed width, height, spawn, exit, obstacle, boundary vertex, void vertex and breach are in `artifacts/nextgen/l8-act3-plans/geometry-changes.json`. `SHIP_ACT3_PLANS` also declares every space anchor, opening span, arena, bay and breach mount explicitly. No encounter or balance numbers changed.

| Room | Extent before→after | Walkable before→after | Change | Connected solid union | Free groups | Smallest opening |
|---|---|---:|---:|---:|---:|---:|
| Diagnostic |1200×880→1280×960|969600→913600|-5.7756%|100%|0|140|
| Safety |1200×880→1280×960|982400→936544|-4.6678%|93.5882%|2|140|
| Coolant |1200×880→1360×960|956000→932800|-2.4268%|82.0896%|1|140|
| Shaft |1200×880→1200×880|802000→783600|-2.2943%|100%|0|160|
| Workshop |1200×880→1280×1000|948400→921600|-2.8258%|100%|0|180|

The first Diagnostic recorder extends to y0 with 130 depth; the two Safety source booths extend to y0 with 180 depth. Their working faces did not move. This replaces already-solid north backplate area without changing the solid union, and ensures full source roofs retain WorldDressing's warning-signature selection instead of moving fatal lettering to a narrow wall strip.

## Root integration contract

`src/render/world/Act3ShipPresentation.ts` exports:

```ts
ACT3_PRESENTATION_ROOMS: ReadonlySet<string>
act3ShipPresentation(id:string,t:RoomTemplate):THREE.Group|null
```

Append the returned group beside the shared template hull or beside the bespoke shaft. Skip shared generic obstacle dispatch for Diagnostic, Safety, Coolant and Workshop; the helper owns those complete live footprints. It replaces no shaft equipment. Preserve `addWorldDressing` fatal text/119-ray safety. Suppress old room-wide architecture and the old EnvironmentalStory center-to-center floor roots only for these handled rooms. Safety's full source architecture is called inside the helper with its new optional fourth live-template argument.

The group carries `userData.lightFixtures` in render metres with nativeColor, poolStyle 1, poolAngle, poolWidth, poolDepth and gain. Every fixture is mounted beyond radius16 actor-center clearance on a solid or hull margin. Each custom assembly merges into at most six owned material meshes before shared world batching. Safety/Workshop source geometry retains its own existing material/resource ownership; reused source materials and CC0 kits are not retired by this helper. No mid-combat dynamic construction was added.

Lighting follows function: Diagnostic's warning recorder dominates, a weaker south service bank provides depth and a failed northeast fixture leaves shadow mass. Safety has a live recorder tube, failed AI booth, warm battery return and small cage-mounted inspection source. Coolant's port header dominates; starboard return warms toward the next act while one bank remains failed. Shaft sources reveal docking recesses alongside its existing local junction task light. Workshop's remaining tool-light chain is broken and weak; human hardware motivates the light, with no free organic glow pool. Spill widths are 0.28–0.45m, depths4.5–7.2m; ordinary combat floor has no confetti, mats or repeating per-solid bars.

## Verification

Final prospective checker uses the updated exact-anchor blocked-opening proof:

```text
node scripts/nextgen/l8-check-plan.mjs src/game/roguelike/shipArchitectureAct3.ts SHIP_ACT3_PLANS
5 rooms; every errors array[]
```

This includes ≥60% real hull/partition-chain union connectivity, ≤2 free groups, articulated hull/bays, named spaces, a legal radius 144 crowd floor, ≥140-unit openings with R70 midpoint/fullR32 span+normal sweep, graph cycles, every individual opening physically sealed with all exact anchors still reachable, dense goals for enemy radii 14/18/24/28, and raw plus both native +/-56 breach offsets at R32. No rule or bound was weakened.

Prospective A3 fixtures use native five-family actors, native placement, accepted swept-leg graph assertions, ordinary health+armor damage, and the unchanged finite-fight opportunity method. Each case starts 20 actors. Carrier spawn requests are not dispatched by this fixture; this is liveness evidence, not a campaign win.

| Room | Entry20/20 last opportunity | Exit20/20 last opportunity | Unresolved |
|---|---:|---:|---|
| Diagnostic |5250ms|5250ms|[]|
| Safety |5700ms|5700ms|[]|
| Coolant |6000ms|6000ms|[]|
| Shaft |9450ms|21250ms|[]|
| Workshop |5050ms|6300ms|[]|

```text
VITEST_MAX_WORKERS=2: owned and related suite
Test Files 11 passed (11)
Tests 124 passed (124)

VITEST_MAX_WORKERS=2: prospective native A3 crowd suite
Test Files 1 passed (1)
Tests 10 passed (10)

npm run build
✓ tsc --noEmit
✓ vite build
```

The related suite covers `L8Act3Architecture`, `L8Act3StorySightlines`, `SafetyInterlockArchitecture`, `SafetyInterlockBlockout`, `SafetyInterlockRedesign`, `SafetyInterlockSecondRevision`, `SafetyInterlockServiceCorrection`, `InfestedWorkshop`, `unit/ServiceShaftLanding`, shared `L8ArchitectureClearance` and `unit/roguelikeRooms`. The shared tests were run against the still-live registry; the new Act3 tests build prospective candidates explicitly and therefore cover the dormant new plans. Diagnostic and Safety each retain every 119 story-screen ray from spawn and arena after actual asynchronous CC0 kit assembly, with full-width fatal text. Shaft tests preserve the separate floor material, grain shader/cache identity, roof support, full C traversal and exact-once material/texture disposal.

Honest test migrations:

- `SafetyInterlockBlockout`: the old `voids=[]` and old viewing-coordinate pin is replaced by explicit prospective cage crossing, both booth/return bypasses and three real viewing approaches at radii16/28; native breach emergence remains checked.
- `InfestedWorkshop`: the literal old four island rectangles are replaced by four retained equipment-role checks and live rectangle-derived8-unit envelope insets. Actual vertex containment, source mechanics, material budgets, flatten/bake bounds and disposal assertions remain.
- `unit/ServiceShaftLanding`: literal old spawn/exit/breach numbers are replaced by exact template-to-geometry agreement and radius38 legality. The accepted cutout, full C sweeps at16/28/30/38, shoulder/mouth floor sampling, pursuing brute, source equipment support and lifecycle remain.
- New Act3 tests add explicit mounted fixture bounds, source ownership, prospective crowd floor/alternate routes, live clipped Safety channels, authored-hull shaft ribs/floor, foreground height and solid-bound resin checks.

Logs: `artifacts/nextgen/l8-act3-plans/{checker.json,crowd-soak.log,tests.log,build.log}`.

## Evidence paths and remaining work

Absolute evidence prefix: `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/`.

| Room | Before plan absolute path | Prospective after plan absolute path |
|---|---|---|
| Diagnostic |/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/diagnostic-gallery.png|/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act3-plans/diagnostic-gallery.png|
| Safety |/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/safety-interlock-station.png|/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act3-plans/safety-interlock-station.png|
| Coolant |/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/coolant-plant.png|/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act3-plans/coolant-plant.png|
| Shaft |/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/service-shaft-landing.png|/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act3-plans/service-shaft-landing.png|
| Workshop |/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-baseline/plans/infested-workshop.png|/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act3-plans/infested-workshop.png|

The inspected prospective20-up comparison is `/Users/chernodub/.t3/worktrees/containment-game/t3-38b08eb5/artifacts/nextgen/l8-act3-plans/twenty-old-new.png`. Non-Act3 rows reflect the registry available when rendered and are not final propagation evidence. There are no intermediate image rounds in this packet.

Root owns activation, final native dressed calm/kiting/storyboard critique, exact 480×270/grayscale review, E7 camera/HUD/hero/viewport sampling, all 20 smoke/capture gates, full verification, frozen-bot matched cohorts and final before/after hardware benches. No browser, capture, bench or native campaign was run by this sub-agent. No 60fps/preparation/draw-budget compliance, completion-rate balance or final environmental art acceptance is claimed from CPU tests. The long C exit pursuit and the visual continuity of the new connected machine banks remain explicit native-review concerns.

## Final simulation-driven corrections

The all20 native named-space crowd sweep exposed two Safety Stalkers pinned north of the symmetric cage when the marine stood in Battery return. The authorized geometry-only fix moves the upper header north face y320→332 and shrinks its depth24→12 while retaining south face344. Door openings, U legs and source machinery stay fixed. Safety solid union244416→241056, connected solid area225600 unchanged, free groups2, walkable933184→936544. Every one of its ten entry/exit/arena/named-space mixed-crowd cases now clears20/20 within60s. All five strict plan checker errors arrays remain empty. The original all20 raw failed run is preserved under `artifacts/nextgen/l8-sim/first-failure/`.

Shaft's declared radius144 arena moves170,440→170,170, the real upper-left docking/working elbow. This changes no collision, hull, void, machinery, floor grain, shader/cache/disposal or area number. The new circle is fully legal, and the integrated framing test now passes >=60% actual playable viewport floor in1080/720 and both ordinary/reduced modes. The earlier center sample was52.14%. Source C core remains exact.

Post-correction verification: Act3 strict checker five rooms all errors[]; ten owned source/render/native suites90 tests passed; ten Safety mixed-crowd targets passed; integrated Shaft framing case passed (all four arena modes). Root owns the other three global crowd failures and an exact rounded-corner navigation correction. Final all20 named-space attack/crowd/dense/replay reruns and matched40 cohorts are reported separately in `L8-simulation-verification.md` after that source freeze. No actors, abilities, encounters or policy were changed.

The final committed-leg navigation rerun revealed a second, perfectly opposed Stalker pair above both the Relay spine and Safety cage. Layout asymmetry resolves it without touching actors: Safety's upper U moves16 units east (header516,332,280,12; legs516,344,24,56 and772,344,24,56), lower U remains fixed; its north Starboard opening starts812 rather than780, and its mounted inspection fixture moves512→528. Solid/walkable area and both doorways stay unchanged. Root also assigned Relay: central spine x590→606, Port named-space width390→406, Starboard x690→706/width390→374, matching north/south opening ends move16 units. Relay areas and anchors remain unchanged. The live Relay source-placement coordinate pin moves590→606; all original source-model, radius16/28/38 route, projectile-gap and lifecycle invariants remain. All19 affected mixed-crowd targets and380 isolated family/breach trials pass, as do89 source-fit/sightline/shot-gap/framing tests. Final strict all20 checker reports every errors array empty.


## Adopted final balance layout9a44e60

Final committed gameplay source: `9a44e604bf644b6cf0ab8b2637913e19ca3e4740`. Registry selects reviewed V1.1 for Coolant/Workshop and the proven rear-ingress map for Diagnostic/Safety. Failed V1, V1.1 and isolated Transmission diagnostic runs remain immutable evidence; the adopted source combines reviewed geometry with minimal explicitly authorized finite encounter appends. No policy, actor, ability or progression change was made.

|Act3 room|Initial authored walkable→final|Final vs frozen baseline|Connected solid union|Free groups|
|---|---:|---:|---:|---:|
|Diagnostic|913600→913600|94.2244%|100%|0|
|Safety|936544→936544|95.3322%|93.5882%|2|
|Coolant|932800→958400|100.2510%|89.1892%|2|
|Shaft|783600→783600|97.7057%|100%|0|
|Workshop|921600→971200|102.4040%|100%|0|

Coolant's160×360 return manifold at600,300 becomes two160×100 banks at600,300 and600,560. The new opening680,400→680,560 connects the service galleries. Their outlines become260,300,420,360 and680,300,420,360, with existing anchors unchanged. Machinery/floor/lighting are derived from these actual solids.

Workshop port hull inset160→40 and northeast hull1120→1200 widen the former service galleries; the east hull notch remains actual architecture. The southwest workbench becomes40,800,420,200 instead of160,800,300,200, filling the one-ended120×200 rear strip with real bench machinery. This keeps its front playable at100,768 with independent R32 north/east escapes, rather than leaving a marine-only pocket. Four breaches become100,100 /1100,100 /80,730 /1180,720, with real hull feature mounts40,100 /1200,100 /0,730 /1280,720.

Diagnostic rear-service breaches become600,80 /960,80 /456,880 /960,880, mounted at600,40 /960,40 /456,920 /960,920. Safety rear-service breaches become160,80 /1100,80 /360,880 /920,880, mounted at160,40 /1080,40 /360,920 /920,920. They preserve every existing source machine, warning display, floor, named-space anchor and cage opening. All raw/native-inward R32 and R38 anchors are legal; Act2's ingress proof covers them. Shaft geometry and exact C source remain unchanged.

After failed layout-first pacing trials, Diagnostic requests27→29 (tail4230→4410ms) and Safety28→30 (4320→4500ms), two actual requests each. Caps15, first650ms, native families/elites, original requests/RNG order, six-request grouping and90ms within-burst spacing remain exact. Root also authorized the separately reported Transmission/Shielding appends; all other encounter numbers are unchanged.

All20 final hardproof:13 files539 tests;20 strict checker errors arrays empty;165 mixed crowd targets3300 actors with0 unresolved;3300 actual native family trials pass;2275 dense marine positions/45500 family routes/2275 Spitter firing fields pass;4rig×20room replay equality;3 actual edge controls. Frozen final full-kit/cadence:2 files5 tests pass, unchanged cadence/ability-share/clear-time-spread guards. Geometry SHA `9a1a8d88ad7781d19ae09c25f47c39d530008d248677675c377a462c0b03be9c`; evidence under `artifacts/nextgen/l8-sim/final-combined/`. Root owns final dressed/calm/native art acceptance and hardware evidence; the fixed160 cohort for9a44 has finished:106/160 (66.25%) completion and29.8833s ordinary pacing fail, despite13.75pp rig distance,61.5167s Transmission and all native/determinism/full-kit guards passing. Root withholds semantic acceptance and awaits actual Diagnostic/Workshop partitions; the full failed packet is retained. Historical plan PNGs above remain explicitly historical; root's final gallery is authoritative for the adopted geometry and new entrance locations.


## Current reviewed physical-bay source659ac9d

Root has activated the real Diagnostic/Workshop workbays and honest Safety gallery naming from `shipFinalPartitions.ts`. Diagnostic's recorder/instrument pair and port/return pair now have real140-unit side doors as well as supported broad front mouths. Workshop's loading cheeks/lathe side door and tool/gantry/rear separators replace the prior floor-only labels. The filled rear bench remains; two independently sealable native R32 escapes replace its now-blocked straight east shortcut. Safety's actual two-ended cage remains, with its upper equipment band honestly described as an open recorder/AI gallery. No new actor, ability, policy or encounter-count change was made for this revision.

Current walkable areas: Diagnostic898600 (92.6774% baseline,99.6559% connected,2 free), Workshop939040 (99.0131%,99.8205% connected,1 free), Safety936544 unchanged. Coolant958400 and Shaft783600 remain unchanged. Final floor/partition source footprints and every numeric DTO difference are recorded in `artifacts/nextgen/l8-sim/revised659-hardproof/all20-numeric-layout-changes.json`; the shared physical-aperture checker rejects the old unsupported green lines.

Frozen659 integrated verification passes34 files840 tests, strict20 rooms and TypeScript; complete all20 named/native/dense/replay, new physical-aperture, native abilities/escape-lane and radar proofs are detailed in `L8-simulation-verification.md`. The complete predeclared fixed160 cohort is running on exact659 with no outcome-dependent stop. Final balance, dressed art, browser campaign and measured budget acceptance remain with root.
