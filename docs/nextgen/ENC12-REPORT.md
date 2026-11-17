# ENC12 — encounters, pacing and choices

Branch: `t3/difficulty-onboarding-modes`. Began by merging `nextgen` (`fcab6a52`) and running `npm ci && npm run build`, both successful. Read the complete R11 play review and combined verdict. No tests, dependencies, renderer, model, world-geometry, camera, motion or render-effect implementation edits were added. The existing HUD objective line now consumes encounter and boss-phase state so counterplay and relay tasks are visible; authored story records remain unchanged. Reward-card data maps the new IDs to existing ability glyphs and active/passive target labels; the existing benefit line consumes `whatChanges`, with no card-style or SVG-art edits. The simulation actor-metrics loader now registers the same Meshopt decoder as production, required by the newly merged compressed models.

Implemented all six encounter grammars, twenty authored scripts, role positioning, two boss demands, eight exclusive transformative augments, early guaranteed drafts, fixed supply stops and optional risk/reward preparation. Final balance and native evidence are recorded below. No automated test files or runners were added.

## Authored encounter arc

Each beat clears all living bodies, carrier child reservations and pending spawn warnings before a **2.5-second lull with no new arrivals** begins. Existing hostile projectiles may finish crossing the room during that interval; it is not guaranteed bullet-free safety. Siege beats additionally require charging the existing exit relay for 12 seconds within its visible 220-unit hold radius; leaving pauses progress. The director accepts the host's explicit readiness flag and cannot clear the siege until both bodies and the relay objective are complete. The next beat's arrival clock starts after that lull. This is a simulation-time, occupancy-gated break, not a global arrival timestamp. Seeds rotate approach sides; they do not replace the authored compositions. Crossfire and pincer use opposed breaches ordered around the room centroid. Interception flankers rank available breaches behind the marine’s actual heading when the arrival is committed, alternating the best rear/side slots with deterministic identifier tie breaks; the existing 650-ms arrival warning remains. Difficulty still scales body counts and authored elite probability; teaching beats remain fixed.

| Room | Beat sequence / tactical demand |
|---|---|
| Awakening Bay | One slow Crawler alone: evade its commitment and punish recovery → three-Crawler rush |
| Passenger Vault | Lone Brute: sidestep its heavy swing → two-angle Spitter crossfire screened by Crawlers → small rush |
| Residential Gallery | Brute holds attention while two Stalkers intercept → rush → crossfire |
| Communal Atrium | Opposed pincer → protected Carrier, defusable escorts → interception |
| Crew Checkpoint | Crossfire → interception → protected priority |
| Armory | Warden and escort: bait its charge into a wall → crossfire → rush |
| Freight Hold | Rush → opposed pincer → protected Carrier |
| Breached Loading Bay | Interception → crossfire → opposed pincer |
| Relay Racks | Crossfire → Warden priority → interception |
| Transmission Chamber | Siege → pincer → crossfire → siege; four distinct clear-gated holdout beats |
| Diagnostic Gallery | Protected Carrier → interception → crossfire |
| Safety Interlock Station | Pincer → siege → protected priority |
| Coolant Plant | Crossfire → Warden priority → pincer |
| Service Shaft Landing | Interception → pincer → crossfire |
| Infested Workshop | Large rush → protected brood → interception |
| Swarm Junction | Matron with interruptible brood → pincer → siege |
| Shielding Gate | Crossfire → protected Carrier → interception |
| Containment Annulus | Pincer → crossfire → protected priority |
| Manual Control Chamber | Interception → Warden priority → crossfire; story authorization unchanged |
| Overload Floor | Siege → pincer → protected brood → final siege |

Opening grammars never repeat in adjacent campaign rooms. Every room has two to four beats. The optional salvage detour adds one escorted priority beat only at the five preparation junctions (whose ordinary scripts have three beats), keeping the four-beat maximum.

Protected priority bodies arrive before their late escort reinforcements. Killing that body calls `reportPriorityDefeated(beat)`, removing **unannounced** reinforcement requests; already announced bodies remain real. Ordinary Carrier death children still hatch normally.

## Roles and counterplay

- Crawlers screen their same-beat priority body or ranged line until the marine closes; unescorted rushes use direct pressure and native flanking berths.
- Stalkers aim for alternating interception sides with a bounded movement lead. Inside 145 units they use native engagement berths: without an attack slot they wait on the outer ring, and with a slot they close for their committed lunge. The opening is available space and commitment budget, not hidden knowledge of the player’s cooldown or future action.
- Spitters hold a useful firing range and take a bounded lateral reposition after each actual shot. Crossfire scripts place the pair on opposed approach angles. Native path and line-of-fire checks still own legality.
- Brute anchors screen their same-beat priority leader, holding attention until approached. Their warning, locked footprint and recovery remain authoritative.
- Carriers hold rear territory instead of pursuing continuously. Their visible offspring still make kill order matter.
- **Warden:** the existing locked charge warning commits its direction. A geometry/cover collision ends the charge and produces a **1.5-second wall stun**, with no slide around the obstacle. The marine can sidestep, bait the wall, then punish. The committed charge uses a native swept-body damage receipt once per charge. The objective line calls out the wall stun as a punish window. Authored ordinary Brutes keep the heavy-swing role; charge belongs to the Warden.
- **Matron:** a **1-second brood commitment** can be interrupted by 20 cumulative actual damage during the commitment, immobilizing control or knockback. Successful commitment emits two native **30-HP brood pods**, represented by stationary crawler bodies with existing ground warning circles. Each hatches after **2.4 seconds** unless shot first. The Matron has a six-second recovery between successful broods; interruption delays the next attempt four seconds. Death-spawn children are removed from the Matron specifically so its unique demand is the interruptible brood cycle. The objective line changes to focus-fire interruption during commitment and destroying pods before hatch afterward.

Late authored ordinary elite probability is **21% on Standard**, multiplied by the selected mode's elite generosity. Elite appearance is independent of control resistance. Only boss-class guardians and at most one explicitly marked priority elite per beat resist control. Snapshots expose `priority`, `controlResistant`, `role`, `beat`, pod state, brood commitment and wall-stun time; no renderer decides a hit or hatch.

Legacy non-story directors retain their previous arrival schedule; family AI improvements also apply when those families appear in legacy saves.
## Economy, preparation and survival teaching

Previously, buying any one of three recovery services immediately advanced to route selection. Free recovery could cap the health/armor benefit, there were no build or consumable investments, and ordinary income exceeded those limited opportunities. Credits therefore had little useful destination.

Current-story supply stops are fixed after rooms 4, 8, 12, 15 and 19. The twenty room IDs and their order remain unchanged; legacy v1/v2 graphs retain their original rewards. A supply stop stays open after each purchase and only leaves through the explicit allocation/departure action. Its stock is two health repairs, two armor repairs, two reserve refills and one each of medkit, grenade pack, banked reroll and augment upgrade. Base prices are 90/80/95/110/90/100/240 credits respectively, plus 10 per four completed depth levels. Ordinary credit income is scaled to 15% of its previous amount; salvage payouts remain 150. The intention is a few meaningful purchases rather than a growing unusable balance. Actual campaign spending is reported with the final cohorts, not inferred from these prices.

At five boundaries—after rooms 3, 7, 11, 15 and 18—the player chooses between the direct story destination and recovering its sealed cache. The latter adds an escorted priority group and pays 150 credits on the next clear. Both choices enter the same next authored room. Other forced transitions skip the navigation screen; Manual Control still requires the separate explicit destruction authorization. The run records a depth-scoped preparation choice, and the director owns the additional encounter risk.

An early reward at room 2 (repeated at room 3 if neither was taken) offers the rig's mutually exclusive transformative pair. Draft rerolls retain this early opportunity. Draft eligibility, installation and checkpoint validation all prevent owning both members. The supply upgrade selects the first supported owned augment not already upgraded; its precise rank-two rule appears on the service card and owned-boon tooltip. Rank flags are saved in the build and consumed by the ability runtime through the parent's upgraded lookup.

Visual inspection found the existing HUD gated onboarding behind a held inspection key. The call site now lets contextual hints appear automatically while Hints is enabled, yielding only to an open ability tooltip. Finished-run and Hints-off opt-outs remain. Unfinished hints no longer expire at a room or elapsed-time boundary. The Brute lesson asks for a sidestep during its native wind-up, then a hit during recovery. Evade completion observes movement out of the exact strike footprint without vitality loss; recovery completion observes an actual hit on the recovering Brute. A new independent pack-tactical lesson appears only with Q ready and at least three nearby enemies in a forward grouping. Successful Q at that opportunity retires it, including for players whose older preference record already marked the basic Q key as learned. These observations teach presentation only and never influence a hit. Existing HUD obstacle avoidance, hints preference and finished-run opt-out remain.

Persistence adds optional run service receipts, reroll tokens and the current preparation choice, plus optional build augment upgrade IDs. Missing historical fields mean unclaimed stock, zero banked rerolls, direct entry and no upgrades. Unknown/overstocked items, invalid preparation depth, unowned or unsupported upgrades and conflicting transformative picks reject the checkpoint. Free allocation and purchase receipts are immutable boundary data and survive reload without duplicating stock or credits.

Additional first-use lessons identify the Carrier or heavy guard as the priority target and teach breaking one of two Spitter firing lines with native cover. Their completion observes an actual priority death or moving behind geometry; they persist like the other lessons.

Native UI review: the historical D11 checkpoint, without a difficulty field or any new economy fields, continued through native rig/boon choices into Standard combat. A declared 700-credit supply fixture bought health, medkit, a reroll and an augment upgrade; every purchase stayed at the stop, with credits 700→610→500→400→160. Reload restored the same four stock receipts, one banked reroll, the Siege Plow upgrade and the 160-credit balance. Explicit departure entered Crew Checkpoint. Direct/salvage preparation both entered Communal Atrium with distinct saved choices and 15/20 scheduled enemies in the captured fixture. These are UI boundary fixtures, not natural campaign evidence. The 18 retained 1920/1280 PNGs were opened at native size and as 480×270 reductions. The initial 720p supply list needed scrolling; its final compact two-column layout exposes all seven items without scrolling.

Group opportunities vary by rig and room. The conservative Brute-evade observation may leave its lesson pending if another enemy damages the marine during an otherwise correct sidestep.

Paid service buttons retain keyboard focus across their boundary re-render, falling back to another available service or explicit Leave when the selected stock is exhausted.

## Transformative Combat Rig augments

Eight new rare augments form four mutually exclusive pairs. `TRANSFORMATIVE_AUGMENT_PAIRS`, `TRANSFORMATIVE_AUGMENT_IDS`, `AUGMENT_IDS`, and `conflictingAugment` are exported for shared draft/checkpoint logic. All twenty augment definitions now have a short `whatChanges` field, shown through the existing benefit line without adding duplicate card copy. Every new definition also has complete rules and tradeoff text explicitly naming its mutually exclusive partner. Draft and checkpoint logic guarantee an early opportunity and reject taking both members.

| Rig | Augment | Changed combat rule | Supply upgrade |
|---|---|---|---|
| Breacher | Siege Plow | Bulwark advances along its placement heading at 90 units/s, stops against architecture, and launches touching enemies forward every 500 ms. It retains ordinary lifetime/health and enemy/projectile blocking. | 120 units/s |
| Breacher | Fault Line | Slam additionally leaves a 320×70 aimed fissure for 3 s. Every 500 ms it deals 8 damage and applies 200 ms shock. Its endpoint is clipped to legal visible geometry; its damage respects walls. | 4.5 s lifetime |
| Cryo | Shard Harvest | A frozen kill hits the three nearest visible live enemies within 220 units for 35 damage and one chill each. Shard-caused kills cannot recursively produce another volley. Whiteout's separate kill effect remains. | Five recipients |
| Cryo | Ice Road | Glacier becomes a 280×100 traversable frost strip along the aim for 5 s, chilling enemies and multiplying marine movement speed by 1.6 while on it. Replaces blocking walls and automatic shatter. Twin Glacier creates parallel roads. | 8 s lifetime |
| Pyro | Ember Relay | Every 500 ms, fire-zone occupants ignite up to four nearest visible non-burning neighbours within 120 units. Each spark deals 12 damage. No recursive propagation and no duplicate victim within one zone pulse. | 180-unit reach |
| Pyro | Meltdown Core | Replaces the 8 s Meltdown aura with a 2 s moving fuse followed by a 260-radius, 240-damage ignition blast. Speed/shot ignition benefits last only through that fuse. Room reset cancels unfinished detonation. | 320 blast damage |
| Arc | Pilgrim Pylon | Pylons follow a point 100 units behind the marine's aim, at up to 180 units/s. Their ordinary arcs/links remain. Native traversal prevents teleporting through architecture; dashes can outrun them. | 260 units/s |
| Arc | Live Wire | Replaces Overload's chain with one 4 s marine–target tether. Every 250 ms its 28-unit wire damages intersecting enemies for 12 and shocks for 120 ms. Cursor-nearest visible target; death, blocked visibility or >520 separation breaks it. Forked Overload adds no recipients. | 6 s lifetime |

All clocks are simulation milliseconds. Target choice uses distance followed by stable numeric id. Persistent entity/target limits are retained; tethers have an additional four-entry hard bound. Room resets clear every added transient. No checkpoint transient schema was introduced; the build checkpoint persists acquired IDs and upgrade IDs with backward-compatible defaults.

Presentation reuses existing owners: moving native deployable snapshots, frost-trail strips, small Slam crack/burst pulses, Cryo Nova shard bursts, Flashfire ignition impacts, Meltdown burst, and the existing continuous Arc ribbon. `AbilityLinkSnapshot.ability` additively accepts `overload` so Live Wire supplies authoritative continuous endpoints without renderer edits. Core and tether HUD active-duration denominators use their actual 2 s / 4–6 s lifetimes. Existing twelve augment runtime rules remain unaltered and are not upgradeable through the new upgrade-rule map; the eight new ones have explicit implemented `AUGMENT_UPGRADE_RULES`.

Added `enemy-charge` to the existing incoming-damage union and whitelist, preserving every old source and naming the Warden’s killing attack correctly.

### Integration requests and remaining feel limitations

- `AbilityHost.upgraded(id)` reads `build.augmentUpgrades`; shared status includes `burning`, and the existing pre-status-clear `onKill` hook drives frozen-kill effects.
- Ice Road's native placement planner validates the actual along-aim 280×100 road. The UI adapter suppresses the fixed Glacier wall preview when Ice Road is owned, avoiding a false perpendicular blocker. A proper strip preview remains an integration request.
- Fissure feedback reuses three small Slam crack/burst positions per native pulse rather than a newly authored continuous fracture effect. Frozen-kill shards reuse the existing cold burst/target feedback, without a new travelling projectile model. These are functional presentation reuses, not bespoke new art.
- Moving pylons stop when their straight following segment is blocked; they deliberately do not find paths around obstacles. This makes their placement and the marine's route meaningful but may leave a pylon behind a corner.

Both R11 independent verdicts were read. The changes specifically address their weak run-identity/payoff finding: a moving defensive front versus an aimed stagger lane, kill-triggered cold propagation versus a movement surface, spread ignition versus a short cash-out fuse, and following constructs versus a sustained positional tether. They do not claim a human learning result or premium visual quality.


## Balance and pacing

Quick tuning cohorts used 10 seeds × four rigs. Final confirmations use the published 20-seed set × four rigs (80 attempts per mode/profile), with at most three simulation workers. All final outcomes are natural clears or deaths, without assistance.

| Mode / profile | Completion | Target | B / C / P / A clears (each /20) | Deaths in rooms 11–14 |
|---|---:|---:|---|---:|
| Story / novice | 46/80 (57.5%) | 35–60% | 16 / 11 / 7 / 12 | 7/34 |
| Standard / competent | 34/80 (42.5%) | 35–55% | 13 / 8 / 5 / 8 | 8/46 |
| Veteran / competent | 16/80 (20%) | 10–25% | 7 / 3 / 2 / 4 | 11/64 |

All 240 final attempts ended naturally with zero runtime errors or stalls. Deaths span rooms 4–20 on Story/Standard and 3–20 on Veteran. Standard’s accepted quick cohort was 17/40; Veteran’s was 8/40. Earlier quick cohorts, including controller failures, are retained as labelled compact tuning summaries. The [final summary and histograms](../../artifacts/nextgen/enc12-final/balance/confirmation-summary.json) and [tuning summary](../../artifacts/nextgen/enc12-final/balance/tuning-summary.json) accompany the accepted raw datasets.

Final descriptors multiply incoming damage / enemy rest / authored body counts / routine elite chance / pickup generosity / Overdrive gain respectively: Story **1.3 / 1.05 / 1.25 / 0.7 / 0.95 / 1.15**; Standard **2 / 0.8 / 1.5 / 1 / 0.7 / 1**; Veteran **2.25 / 0.75 / 1.5 / 1 / 0.55 / 1**. All allow two simultaneous wind-ups. Every inherited extra late-mode multiplier is neutral (1), including movement and control stagger; late pressure comes from authored compositions instead. The fixed teaching counts are exempt from body scaling. These are multipliers of the underlying family/room progression values, not direct damage or spawn counts. The bot values both transformative variants equally and breaks ties by seeded visible offer order. Each new transformative branch was selected 9–11 times in every final cohort, giving both sides campaign coverage.

The inherited Standard tuning produced 39/40 clears plus one objective stall in the first quick cohort: the new kits and reduced control resistance made it substantially easier. Final pressure therefore uses incoming damage, rest, body counts and pickup generosity while keeping player ability rules identical across modes. The final controller is `enc12-visible-counterplay-v4`. Navigation now seeks a reachable legal relay anchor and scores one native input frame toward a waypoint when no firing target exists; unseen bodies cannot impose stand-off. Combat reaction, accuracy and the separate 250-ms warning horizon remain unchanged. Pilot cohorts containing navigation stalls are labelled tuning evidence in the compact summary, not counted as final natural completions.

Standard’s median cleared-room active-play duration by opening grammar is **34.97 s swarm, 40.55 s priority, 45.04 s interception, 50.19 s pincer, 46.60 s crossfire and 69.65 s siege**. These whole-room values include the lulls and mixed later beats; they are not isolated single-grammar timings. Story medians range from 33.07 s swarm to 63.93 s siege. Veteran’s 9.37 s swarm median is survivor selection: early deaths overrepresent the small first room, not evidence that later swarms take nine seconds. Its other grammar medians range from 36.68 to 69.33 s.

Median credits earned / spent / remaining are **1259.5 / 930 / 188.5** on Story, **1118.5 / 755 / 227** on Standard and **517 / 290 / 197.5** on Veteran. Spending is computed per run before taking its median. Purchases now consume a meaningful share of earned credits, while a carried balance still lets the player choose when to invest.

The controller retains its seeded novice/competent reaction, accuracy and input limits. New decisions use visible priority bodies, currently warned charge lanes, geometry sightlines from visible Spitters, published relay position/progress, visible shops and offered preparation choices. It does not inspect future enemy decisions. Charge warnings enter the same notice/latency pipeline as melee; the generic duplicate cue is excluded from threat counting. Supply spending is measured per run as earned credits minus remaining credits, then summarized, rather than subtracting cohort medians.

## Native and visual verification

Final `npm run build` passed (TypeScript plus production Vite build). No tests or test runners were added. Final native campaigns use seed 1729, the competent input profile, no assistance, High graphics and the documented `--fast` mode: game, scene and camera step at 60 Hz, policy observes at 100 ms, and GPU draws occur at batch ends. These are native browser/input campaigns, not hardware-FPS measurements.

| Mode / rig | Natural terminal | Rooms cleared | Errors / defects |
|---|---|---:|---:|
| Standard / Breacher | Death in room 7 | 6/20 | 0 / 0 |
| Standard / Cryo | Death in room 8 | 7/20 | 0 / 0 |
| Standard / Pyro | Death in room 12 | 11/20 | 0 / 0 |
| Standard / Arc | Death in room 5 | 4/20 | 0 / 0 |
| Story / Arc | Campaign clear | 20/20 | 0 / 0 |
| Veteran / Arc | Death in room 9 | 8/20 | 0 / 0 |

All six commands exited 0, and the terminal images were opened at native size and 480×270. The final [gallery index](../../artifacts/nextgen/enc12-final/index.html) links their compact reports and selected images. Native deaths are recorded as deaths, not campaign victories; these six one-seed runs are functional verification, not a separate native win-rate cohort.

The initial High/full-render Arc visual pilot ended naturally in room 16 after 15 clears; a High/fast Breacher pilot ended in room 8 after seven clears. Both had zero errors/defects. They preceded the final pressure/controller and automatic-hint fix, so their storyboards establish encounter presentation rather than final-mode campaign verification. Final native verification uses the frozen final tuning.

Natural Transmission storyboards show the marine holding beside the existing exit panel/chevrons while attackers fire from the opposite side, with the real Reach/Hold countdown in the HUD. This differs visibly from pure pursuit. The console is findable on approach but is not self-labelled as the charge objective, and the exact 220-unit boundary is not drawn; those remain presentation integration requests. Natural Warden frames show the locked charge lane and a sidestep before commitment. A wall stun is implemented but must not be inferred from a screenshot of a warning.

Declared manual native fixtures cover all eight augment branches: every activation was accepted with zero page errors. They grant the selected augment and protect the marine to isolate the effect; they are not natural campaign evidence. Observed examples include a 90-unit plow advance in one second, three 35-damage shards, Ice Road’s 1.6× movement, ignition outside the fire pool, a completed Meltdown detonation, a following pylon and a persistent damaging tether. Compact before/after data and both desktop sizes are in the [augment gallery](../../artifacts/nextgen/enc12-final/augments/index.html). Earlier blocked-placement or overwritten-aim fixture images were replaced, not counted as mechanic failures.

Six automatic teaching states were captured at 1920×1080 and 1280×720: first Crawler wind-up, Brute wind-up, Brute recovery, a three-enemy tactical opportunity, priority focus and breaking Spitter crossfire. The unprotected marine retained 100 health and zero damage taken. The pack’s subsequent native Q was accepted, dealt 126 ability damage, persisted its seen preference and retired the hint. These are staged first-room observations; their counters do not establish the authored one-then-three count. See the [teaching gallery](../../artifacts/nextgen/enc12-final/teaching/index.html).

Unprotected [guardian captures](../../artifacts/nextgen/enc12-final/guardians/index.html) show the Warden’s real wall collision leaving 1499.997 ms stun and a Matron brood commitment canceled by exactly 20 actual health damage. All 36 native mechanic/teaching/guardian images and their 36 individual 480×270 reductions were opened and inspected. The automatic prompts remain separate from marine bodies and strike shapes. Warden stun pose and Matron warning/priority marks remain understated, especially at reduced scale. The final [draft-copy gallery](../../artifacts/nextgen/enc12-final/draft-copy/index.html) covers the guaranteed Arc pair at both sizes: one benefit headline, existing ability glyphs, F/Q target labels, and native I inspection explicitly naming the excluded partner. The eight new IDs no longer fall back to a warning glyph or an empty target footer. Passive shard/fire-zone transforms use passive labels rather than pretending to modify one keyed cast. The six draft PNGs and their six reductions were also opened, bringing this mechanic/teaching/guardian/draft review to 42 native images and 42 individual 480×270 reductions.

## Integration requests

- Clearer source cues for opposed Spitter fire outside the HUD-safe view; existing edge arrows and projectile warnings are the current feedback.
- A distinctive floor boundary and relay-charge presentation around the existing exit relay; the current objective line gives Reach/Hold/charged state and the real countdown.
- Dedicated brood-pod silhouettes and an interrupted-brood/Warden wall-stun cue. Current pods are stationary, shootable Crawler bodies with native warning circles. The retained non-charge warning owner uses a small 9-unit circle that can sit under the body, so a larger pod marker is still needed. Current wall impact stops the charge for the authoritative stun duration.
- A conspicuous priority/resistance marker keyed separately to `priority` and `controlResistant`, preserving the difference between an important target and an immune one.
- A strip-compatible placement preview for Ice Road; the misleading fixed Glacier wall preview is suppressed by the UI adapter while native road placement remains authoritative.
- Dedicated persistent fissure/ice-road and relay-spark polish using the existing snapshot/event contract. Functional effects currently reuse existing ability presentation; no visual decides damage or placement.

## What still plays the same

Retreating and shooting remains useful against all five families. Authored crossfire sends Spitters through opposed breaches and gives them ranged holds/repositioning. Natural room-three data records a 168° clear-shot pair, but both bodies fall outside the renderer’s conservative HUD-safe visibility predicate; the best pair simultaneously inside that predicate is only 3.6° late in cleanup. Cover routes and framing therefore still make two-angle pressure hard to read together. These are measured geometry/visibility facts, not evidence that every screenshot shows a clean crossfire composition.

Most beats still end by clearing bodies; siege adds a positional objective, and priority beats reward early target removal. Preparation detours add risk inside the next story room rather than branching into a separate full-room graph. The eight transformative augments have supply upgrades; the twelve older augments do not. Moving pylons can be left behind architecture.

Boss demands and new augment feedback reuse existing visual owners, so the pod silhouette and resistance marker still need art integration. The Matron demand is mechanically distinct, but its pod incubation is not yet visually unmistakable at reduced scale: the retained warning owner’s tiny circle sits under a reused Crawler body. Improving that presentation needs the excluded render/art stream; the native commitment, interruption and hatch rules are implemented. The controllers still clear more often with Breacher than Pyro; the aggregate mode targets do not establish rig parity. Bot cohorts also cannot establish that a human learned the counterplay.
