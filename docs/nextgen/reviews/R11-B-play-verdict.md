# R11-B — independent play-and-feel verdict (GPT Astra, 2026-11-17, gallery final6)

**1. Scores**

I inspected more than 100 original-resolution PNGs, including all sixteen abilities, every enemy attack-burst sheet, individual wind-up/strike/recovery frames, the complete available Breacher campaign sequence, and the start/death/results flow. I read the catalogs and balance reports, then `DEFECTS.md` last. Nothing was changed or executed.

Below, `F/` means [artifacts/nextgen/final6/](/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final6/index.html). Scores assess the supplied evidence; stills cannot establish input latency, animation timing in motion, audio quality or hardware performance.

| Area | Score | Justification |
|---|---:|---|
| Core combat loop | **6/10** | Shooting, repositioning and spatial abilities form a credible loop, but the recorded campaign repeatedly returns to retreating while thinning pursuing packs, with insufficient changes in the problem being solved (`F/play/breacher/`, particularly rooms 2–10; `src/game/waves/EncounterDirector.ts`). |
| Ability kits and differentiation | **7/10** | Walls, freezing, persistent fire and electrical links create four materially different toolkits, although several buttons repeat their rig’s existing function rather than introduce another decision (`src/game/abilities/catalog.ts`; all sixteen `F/abilities/v2-*-04.png`). |
| Enemy design and counterplay | **5/10** | Honest attack geometry and recovery periods are good foundations, but small melee warnings and closely related creature silhouettes make recognizing the immediate threat harder than understanding the underlying rules (`F/enemies/m10-melee-{crawler,stalker,spitter}-awakening-bay-*`; B10/C10). |
| Game feel | **5/10** | Recoil, casings, attack poses and contact effects exist, but ordinary exchanges communicate damage more convincingly through numbers than through forceful body reactions (`F/motion/marine-fire-rifle.png`, `marine-fire-shotgun.png`, `crawler-attack.png`; Breacher storyboard). |
| Build variety and run depth | **6/10** | Sixty boons include genuine interactions, but only eight augments are rig-specific, and the twenty-room story route is fixed (`src/game/abilities/augmentCatalog.ts`, `src/game/roguelike/{mutationCatalog,elementalCatalog,run,storyRooms}.ts`). |
| Onboarding and clarity | **5/10** | The interface explains buttons and statistics better than it teaches combat judgment; ten action prompts compete with a first-room/first-minute teaching window (`src/ui/onboarding.ts`; `F/rig-select.png`, `starting-boon.png`). |
| Title-to-death/results interface | **7/10** | The presentation is coherent, loadout inspection is useful and natural deaths have specific damage receipts, but the forced route screen adds ceremony without a route decision (`F/title.png`, `pause-loadout.png`, `route.png`, `play/breacher/terminal-dead.png`). |
| Twenty-room pacing and difficulty | **5/10** | The midpoint holdout changes duration, but late difficulty leans heavily on resistant elites, while all four supplied native campaigns die in rooms 11–14 and the simulated novice profile misses its stated completion target (`F/play/*/report.json`; B10; `EncounterDirector.ts`). |

**2. Honest calibration**

This is an **advanced prototype with a commercially presentable vertical slice**, not yet a convincing commercial indie release, and substantially short of premium/AA. There is considerable implemented content; content count is not the limiting factor. The biggest obstacle is that **the moment-to-moment combat does not yet make recognition, response and reward sufficiently distinct and satisfying**. Against the standard I would apply to *Hades*, *Enter the Gungeon* or *Nuclear Throne*, too many encounters appear to ask for the same sustained retreat-and-shoot solution, while their most consequential small attacks receive relatively weak presentation.

That conclusion follows from the complete available Breacher run, the crowd burst and the full-build fights—not merely from unflattering isolated frames. The [vision](/Users/chernodub/.t3/projects/containment-game/docs/nextgen/00-VISION.md) promises immediately exceptional feel and readable chaos; the evidence currently demonstrates functional combat and a strong presentation framework.

**3. The ten most damaging first-hour problems, ranked**

1. **The dangerous small attack is visually subordinate to less important information.**  
   Crawler and Spitter melee footprints sit among feet, grates and body silhouettes; Stalker’s thin footprint competes with a much brighter marine ring. The actual windows are only **320 ms for Crawler** and **460 ms for Stalker**. Breacher’s terminal receipt records approximately **66 damage from four melee hits within 2.1 seconds**. This can make a technically fair death feel unexplained. **Tomorrow:** give the currently committed attacker a clear body pose, a strong final warning beat and a distinct recovery pose; suppress nearby friendly-effect detail during that warning. Preserve the accurate hit shape. Evidence: `F/enemies/m10-melee-crawler-awakening-bay-{04,08,12}.png`, Stalker `{06,11,18}`, Spitter `{04,08,13}`; `F/play/breacher/report.json`; B10/C10.

2. **The game teaches controls before it teaches survival.**  
   Onboarding covers movement, aim, fire, dash, Q/F/V, reload, grenade and medkit, but most prompts are constrained to room one and the first **60 seconds**. Neither the rig cards nor these prompts provide a safe demonstration of “recognize commitment, evade, punish recovery.” A player can know every key and still misunderstand every death. **Tomorrow:** make the first Crawler and Brute encounters deliberate teaching beats, and retain uncompleted contextual lessons across rooms. Demonstrate one rig combination through play. Evidence: `src/ui/onboarding.ts`; `F/rig-select*.png`, `starting-boon.png`; B10’s novice results.

3. **Too many rooms ask the same combat question.**  
   Geometry changes, but the Breacher sequence repeatedly shows pursuit, retreat, shooting and occasional area clearance. The late spawn pool still draws from the same five families; seven of its fourteen weighted entries are Crawlers. This risks repetition well before room twenty. **Tomorrow:** author three distinct wave compositions using existing enemies—flanker interception, ranged crossfire and a protected priority target—with explicit breaks between compositions. Evidence: `F/play/breacher/r6-armory-*.png`, `r7-*` through `r10-*`; `src/game/waves/EncounterDirector.ts`.

4. **Late escalation makes elites ordinary and weakens control fantasies.**  
   From room eleven, the director uses **60–69% elite probability**. B10 itself identifies reliance on control-resistant bodies; elemental logic substitutes weaker effects for some resisted control. That is an unattractive way to increase difficulty in a game selling freezing, launching and battlefield manipulation. **Tomorrow:** reduce the proportion of resistant enemies and reserve resistance for conspicuous priority threats; obtain difficulty through coordinated roles and approach angles. Evidence: `EncounterDirector.ts:62`, `src/game/roguelike/{ElementalRuntime,MutationRuntime}.ts`; [B10](/Users/chernodub/.t3/projects/containment-game/docs/nextgen/B10-REPORT.md).

5. **The camera sometimes spends visibility on empty floor while threats occupy the HUD boundary.**  
   In `F/play/breacher/r5-crew-checkpoint-mid.png`, the marine’s weapon/upper silhouette reaches beyond the left edge. In `F/builds/v2-full-arc-armory-armory-04.png`, much of the enemy action is at or below the bottom ability strip. Edge arrows report danger without showing the attack needed to answer it. **Tomorrow:** include the complete weapon silhouette in framing and prioritize nearby committed attackers inside the usable viewport; consolidate redundant edge indicators. This is a concrete framing issue, not a request to shrink the marine globally.

6. **Ordinary gunfire lacks enough visible physical consequence.**  
   The rifle and shotgun strips contain recoil, but the campaign’s most conspicuous hit feedback is frequently a floating numeral. Creature attack strips also spend many frames close to a neutral silhouette. A premium action game must make its most repeated action rewarding without requiring an ultimate. **Tomorrow:** improve one complete rifle hit/death chain and one shotgun chain—impact direction, differentiated victim reaction, decisive lethal collapse—and judge them at gameplay scale. Evidence: `F/motion/marine-fire-{rifle,shotgun}.png`, `crawler-death.png`; `F/play/breacher/r5-crew-checkpoint-mid.png`. Audio and real-time responsiveness remain unassessed.

7. **The upgrade catalog promises more behavioral variety than the rig-specific choices deliver.**  
   There are **twelve ability augments: four universal and two per rig**. Examples such as extra chain targets, longer-lasting walls and extra pylons are useful, but much of the catalog strengthens an existing action. Other boon systems do contain interesting combinations, so this is not “all percentage upgrades.” **Tomorrow:** add one mutually exclusive, behavior-changing modification per rig and guarantee an early opportunity to choose it. Evidence: `src/game/abilities/augmentCatalog.ts`; `src/game/roguelike/{mutationCatalog,elementalCatalog}.ts`; `F/augment-draft.png`.

8. **The economy allows failed runs to end with conspicuously unused purchasing power.**  
   Breacher retains **4,306 credits**, Pyro **6,360**; Cryo and Arc spend only **100** each. These bots are not proof of human spending behavior, but they expose how little the run requires engagement with the economy. Purchases are tied to service opportunities, and a purchase commits the reward step. **Tomorrow:** make the service interaction show a useful survival recommendation and allow a deliberate shopping decision before leaving; consider an attractive expensive preparation purchase. Evidence: `F/play/*/report.json`; reward/purchase handling in `src/DepthGame.ts`.

9. **The route screen presents a decision-shaped interruption without a decision.**  
   The twenty-node story sequence has one successor per room. Repeatedly opening a route presentation cannot create route strategy where none exists. **Tomorrow:** combine the fixed next-room transition with the reward screen, or offer an actual preparation choice while preserving story order. Evidence: `F/route.png`; `generateStoryRun` in `src/game/roguelike/run.ts`; `storyRooms.ts`.

10. **Late rooms and major powers lack enough distinct payoff in the visible presentation.**  
    Containment Annulus and Overload Floor retain much of the same plates, vents, pursuit formation and orange projectile language. Whiteout and Overclock communicate their state, but their inspected frames do not establish the dramatic transformation expected of a scarce ultimate. **Tomorrow:** give one Overdrive and one late encounter a complete presentation arc: anticipation, unmistakable transformation, consequential aftermath. Evidence: `F/rooms/g6-kiting-{containment-annulus,overload-floor}-03.png`; `F/abilities/v2-{whiteout,overclock}-awakening-bay-04.png`. This is a visual judgment; a still cannot demonstrate Overclock’s time effect.

**4. Rigs and enemy families**

All ability values below come from the [ability catalog](/Users/chernodub/.t3/projects/containment-game/src/game/abilities/catalog.ts); visual evidence is the corresponding `F/abilities/v2-<ability>-awakening-bay-04.png` and full-build frame.

- **Breacher — fantasy substantially delivered.** Ram, a **90-damage Slam**, a physical wall and a **420-damage Railbreaker** support a convincing demolition identity. **Dullest button: Bulwark**, because its valuable contribution is largely passive after placement. Missing: an active follow-up that turns good wall placement into a deliberate execution—kick, collapse or detonation. The existing wall/beam spatial interaction is worth preserving (`v2-bulwark`, `v2-railbreaker`; `F/builds/v2-full-breacher-armory-armory-04.png`).

- **Cryo — the most coherent setup-and-payoff identity.** Trail creates chill, Nova freezes chilled targets, Glacier shapes space and Whiteout sustains control. **Dullest button: Glacier**, chiefly because its **five-second** lifetime ends in an automatic shatter rather than a player-timed release. Missing: a strong voluntary cash-out decision and clearer communication when resistant targets receive reduced control (`v2-frost-trail`, `v2-cryo-nova`, `v2-glacier`; elemental runtime).

- **Pyro — fantasy delivered, internal differentiation weaker.** Dash trail, cone, persistent pool and aggressive Overdrive all convincingly say fire, but repeatedly apply closely related damage-over-time pressure. **Dullest button: Flashfire**, whose **25 direct damage plus ignition** overlaps substantially with the rest of the kit. Missing: a consume-or-spread decision, such as spending existing burns for a directional explosion (`v2-flashfire`, `v2-napalm-charge`, `v2-meltdown`; catalog).

- **Arc — strong electrical identity and useful positional play.** Six-target Overload and the marine–pylon link create clear grouping and placement incentives; Overclock changes firing conditions for **six seconds**. **Dullest button: Static Step**, because its three-target arrival zap is a smaller version of another chaining action. Missing: a distinctive dash interaction with an existing link or pylon, rewarding route planning instead of simply adding another zap (`v2-static-step`, `v2-overload`, `v2-tesla-pylon`, `v2-overclock`).

Enemy timings below are the current B10 values, not superseded M10 damage values:

| Family | Readability and fairness | Contribution and redundancy |
|---|---|---|
| **Crawler** | **320 ms wind-up, 70 ms strike, 280 ms recovery** is mechanically answerable, but its tiny body and ankle-level warning are unreliable attention grabbers in a pack. | Necessary fodder and movement pressure; excessive use makes other melee enemies feel like larger versions of the same pursuer. |
| **Stalker** | Its **460 ms** warning and long capsule communicate a committed lunge in isolation; the snap and weakly differentiated recovery are less legible in the strip. | Useful flank/interception threat and a meaningful priority target; needs its approach/commitment to distinguish it more clearly from fast pursuit. |
| **Brute** | Best melee silhouette: raised blade, **700 ms** warning and **35 base damage** create an understandable heavy threat; the large charge lane is particularly readable. | Adds space denial and deliberate dodge timing; repeated elite/Warden variants need more than greater durability to remain events. |
| **Spitter** | Orange shots are conspicuous; its **400 ms**, short-range melee warning is comparatively easy to lose under bodies. | Ranged pressure genuinely changes movement; its generic close-range swipe adds less identity and risks feeling like an incidental contact tax. |
| **Carrier** | The pink head identifies the family, but **660 ms** melee anticipation and recovery are less distinctive than the Brute’s. | Death-spawned children create a useful kill-order question; the ordinary swipe overlaps existing melee roles, and Matron’s supplied attack burst does not sell a sufficiently different set-piece identity. |

Evidence: `F/enemies/m10-melee-<family>-awakening-bay-*`, `k7-windup-brute-*`, `k7-windup-spitter-*`; `F/motion/{stalker,brute,spitter,carrier}-attack.png`; `F/enemy-variants/g12-native-*-sprite.png`; `src/game/enemies/catalog.ts`; [C10](/Users/chernodub/.t3/projects/containment-game/docs/nextgen/C10-REPORT.md).

The elite and guardian bursts mostly preserve their family’s visual grammar. That supports recognition, but supplies limited evidence of new counterplay. The Queen is legacy-only and is not a missing current-campaign boss.

**5. What the bot campaigns actually reveal**

All four are competent-profile, seed **1729**, unassisted native campaigns with **zero reported execution errors**. These are four examples, not a completion-rate estimate.

- **Breacher:** 10 rooms cleared; dies in room **11**, Diagnostic Gallery, at **6:26**, after **305 kills**. Final damage comes from Crawler; the terminal burst includes two Stalker hits and two Crawler hits.
- **Cryo:** 13 cleared; dies in room **14**, Service Shaft Landing, at **10:04**, after **430 kills**. The last five-second receipt contains Stalker, Spitter and Crawler damage, approximately **44 total**.
- **Pyro:** 13 cleared; dies in room **14**, at **8:18**, after **449 kills**. Its final five seconds contain two Spitter projectile hits, approximately **18 total**.
- **Arc:** 12 cleared; dies in room **13**, Coolant Plant, at **8:18**, after **408 kills**. Its final receipt contains Crawler and Stalker damage, approximately **33 total**.

Sources: `F/play/{breacher,cryo,pyro,arc}/report.json`, especially `final.stats.lastDamage/recentDamage`, and each `terminal-dead.png`. I would not use the reports’ proximity-based inferred cause fields as authoritative attribution.

**The fights contain cadence, but too little variation in cadence.** Breacher’s first room takes roughly **26 seconds**, room six **42 seconds**, and the midpoint holdout **66 seconds**. Arrival pulses and clear moments exist; this is not uninterrupted random chaos. Nevertheless, the available storyboard repeatedly returns to pursuit and retreat rather than visibly distinct bait–evade–punish exchanges. Evidence: Breacher report and Awakening Bay/Armory storyboard sequences.

**The bots use the kits.** Across the four runs, dash use ranges from **102–161**, Q from **64–94**, F from **19–40**, and V from **5–8**. “Abilities go unused” would be false. Pyro and Arc do die with **V READY** visible, which merits checking readiness communication or bot policy, but does not establish prolonged hoarding. Evidence: reports and their room-death PNGs.

**There is a late difficulty concern, not proof of impossibility.** All four native runs fail shortly after the midpoint; the broader B10 simulation reports **2/80 novice completions**, below its **5–20% target**, versus **34/80 competent** and **80/80 expert**. These are modeled profiles, not human cohorts. They establish a tuning concern and a need for observed human play, not a human win rate.

There is no natural finale completion in this package. `complete-fixture.png` demonstrates the ending interface; it does not demonstrate that the twenty-room experience lands successfully.

**6. What the commercial benchmark visibly has over this**

Ordered by player importance:

1. **More immediately understandable combat exchanges:** recognizable commitment, unmistakable contact and inviting recovery. Containment has the underlying phases but insufficient visual separation, especially for small enemies (`F/enemies/m10-melee-*`; C10).
2. **More encounter-specific decisions:** configurations that force different target priorities and movement plans. The fixed twenty-room campaign reuses five families and a broadly similar late pool (`EncounterDirector.ts`; `storyRooms.ts`; Breacher campaign).
3. **More consequential run identity and replay agency:** choices that change how the player fights, and discoveries that make the next attempt interesting. Eight rig-specific augments and a one-successor route provide a limited foundation (`augmentCatalog.ts`; `run.ts`).
4. **More rewarding ordinary actions and major-event payoff:** weapon-specific victim reactions, memorable elite defeats and dramatic power transitions. Existing strips and Overdrive frames show the gap (`F/motion/`; `F/abilities/v2-{whiteout,overclock}-awakening-bay-04.png`).
5. **Stronger environmental escalation:** late rooms should communicate a changing situation through composition, damage, infestation and action, beyond their labels. The inspected rooms eighteen and twenty still share much of the earlier combat presentation (`F/rooms/g6-kiting-{containment-annulus,overload-floor}-03.png`).

Permanent stat grinding is **not** mandatory; the vision deliberately excludes meta progression. Horizontal discovery, challenge variation and meaningful run choices could provide replay motivation without it. Likewise, audio is implemented according to M10, but this evidence does not let me judge its quality; I am not calling it absent.

**7. Five things that are genuinely good and must survive**

1. **The four rigs possess real mechanical identities.** Wall placement, freeze preparation, persistent burning and electrical links are substantial foundations, not merely color changes (`catalog.ts`; all four full-build captures).
2. **The attack contract is fundamentally sound.** Committed geometry, warning phases, recoveries and attack-slot limits provide something worth polishing instead of replacing with unavoidable contact attrition (M10/B10; native enemy bursts).
3. **The visual hierarchy already has useful anchors.** The marine’s light silhouette, family head colors and orange ranged shots remain identifiable in many crowded frames (`F/enemies/m10-melee-crowd-communal-atrium-20.png`).
4. **The interface respects practical player needs.** Readable health/ammo numerals, inspectable loadouts, checkpoint confirmation and specific natural-death receipts are valuable product behavior (`F/pause-loadout.png`, `play/breacher/r5-crew-checkpoint-mid.png`, `play/arc/terminal-dead.png`).
5. **Some build interactions already reward understanding.** Thermal Shock consuming burn/chill, launch interactions and weapon-alternation effects offer more than additive damage; these deserve clearer teaching and stronger payoff (`src/game/roguelike/{elementalCatalog,mutationCatalog}.ts`).

**8. One month: five investments, in order**

1. **Make threats and the camera trustworthy.** Fix small-attacker commitment/recovery presentation, protect nearby attacks from friendly effects, and correct the demonstrated edge/HUD framing cases. Use the Crawler, Stalker and Crew Checkpoint examples above as concrete acceptance references.
2. **Rebuild the first ten minutes around learning.** Teach one dodge/punish exchange and one rig combination through controlled encounters; retain unfinished lessons across rooms; observe new desktop players and revise the late difficulty transition. Target the onboarding and novice-profile gaps, not more proof infrastructure.
3. **Author a small set of genuinely different encounters.** Recompose existing families into distinct tactical situations, reduce routine elite saturation, and give Warden/Matron encounters one unmistakable new demand each. Address the repeated pursuit pattern before adding another five ordinary enemy models.
4. **Increase the consequence of choices.** Add one transformative early augment per rig, expose its interaction clearly, and make credits support meaningful preparation before danger. Fix the eight-rig-augment and largely unspent-credit limitations together.
5. **Polish the actions players repeat and the moments they remember.** Finish rifle/shotgun hit and kill chains, one signature payoff per rig, and the midpoint/finale presentation. Concentrate effort on these visible gaps rather than spreading another pass evenly across twenty rooms.

The [capture defect report](/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final6/DEFECTS.md), read last, corroborates several framing/readability concerns. Its addendum explicitly supersedes its old-title and cropped-ending complaints; I have not counted those as current defects.
