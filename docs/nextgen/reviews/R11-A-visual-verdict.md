# R11-A — independent visual verdict (GPT Astra, 2026-11-17, gallery final6)

| Area | Score | Judgment |
|---|---:|---|
| First impression: title and first minute | **6/10** | The title has a clear focal point and confident typography, but the first playable room replaces its threatening atmosphere with tidy fixtures and an awkwardly posed marine. (`title.png`; `play/breacher/r1-awakening-bay-start.png`) |
| Interface and HUD | **7/10** | Clear hierarchy, useful ability diagrams and explicit checkpoint feedback reach solid indie quality; reward screens feel administrative, and combat competes with the translucent action bar. (`rig-select.png`; `pause.png`; `starting-boon.png`; `../final6-720/g6-kiting-containment-annulus-03.png`) |
| Combat readability | **5.5/10** | The player ring, bullets and major charge warnings read immediately, but small enemies, weak melee outlines and edge-of-screen fighting undermine that clarity. (`play/breacher/r6-armory-mid.png`; `enemies/m10-melee-stalker-awakening-bay-15.png`; `play/breacher/r5-crew-checkpoint-mid.png`) |
| Environments | **5.5/10** | Recognizable room functions and several good landmarks sit inside an excessively repeated vocabulary of clean panels, fluorescent rectangles and oversized overhead hardware. (`twenty-calm.png`; `rooms/combat-calm-service-shaft-landing.png`; `rooms/combat-calm-infested-workshop.png`) |
| Ability spectacle | **5/10** | Functional shapes distinguish the powers, but flat fire, diagrammatic energy and weak aftermath fall well short of premium impact. (`abilities/v2-flashfire-awakening-bay-04.png`; `abilities/v2-railbreaker-awakening-bay-04.png`; `abilities/v2-meltdown-awakening-bay-07.png`) |
| Character and creature art | **5.5/10** | The marine has useful armor detail and enemies have identifiable color masses, but thin anatomy, weak material separation and modest elite differentiation limit their presence. (`rig-select.png`; `motion/brute-overview.png`; `motion/carrier-matron-overview.png`) |
| Animation and motion | **5/10** | The strips demonstrate substantial action coverage, but exaggerated leg swings, limited torso participation and restrained creature attack poses do not communicate convincing weight. (`motion/marine-overview.png`; `motion/stalker-overview.png`; `motion/brute-overview.png`) |
| Visual cohesion | **5.5/10** | The restrained interface palette holds together, while glossy portrait renders, heavily outlined gameplay assets and flat effect graphics feel like partially reconciled art treatments. (`title.png`; `rig-select.png`; `rooms/g6-kiting-communal-atrium-03.png`; `abilities/v2-flashfire-awakening-bay-04.png`) |

Evidence paths above and below are relative to [`artifacts/nextgen/final6/`](/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final6). I inspected **244 distinct PNGs**, including all twenty rooms in calm and combat, cast/impact/aftermath for all sixteen abilities, all fourteen motion overviews, every creature family and variant, the complete recorded Breacher run through its room-11 death, comparison frames, Low, 720p and 480×270 reductions.

I read `DEFECTS.md` after forming the review. Its addendum establishes an important limit: six top-level screens were refreshed after the gameplay captures. The comparison title and small title derivatives show an older image. I score the current `title.png`; gameplay findings concern the supplied gameplay revision. Animation scores concern visible poses and progression, not smoothness or responsiveness that stills cannot establish.

**2. Calibration**

This has **vertical-slice visual quality spread across a substantial game**, with presentation credible for a free release. It does not look premium/AA, and it does not yet consistently reach the user-defined solid commercial indie threshold. Against *Hades*, the missing ingredient is authored visual identity and expressive staging; against *Curse of the Dead Gods*, it is weight and material discipline; against *The Ascent*, it is environmental specificity and believable occupation. Those comparisons do not require matching their asset budgets: Containment currently spends too much visual attention on repeated fixtures and too little on the player, threats and story. I would try it free. I would consider **US$5 after a convincing gameplay demo**, but these images would not persuade me to buy at US$15–25. (`twenty-calm.png`; `play/breacher/storyboard-armory.png`; `builds/v2-full-pyro-armory-armory-04.png`; `complete-fixture.png`)

**3. The ten most damaging defects**

1. **The marine does not consistently look attached to its gameplay presentation.**  
   **Where:** `rooms/combat-calm-awakening-bay.png`; `builds/v2-full-breacher-armory-armory-04.png`; `abilities/v2-railbreaker-awakening-bay-04.png`.  
   The starting marine points left while the ring’s direction marker points right; in the Breacher build frame, the weapon pose and beam direction visibly disagree. The torso also becomes partially transparent in prominent ability frames. Whatever the implementation cause, the central character looks less trustworthy than the surrounding interface. This is a visual observation, not evidence of incorrect hit detection.  
   **Fix:** Have an animator and rendering engineer reconcile model forward direction, root placement, aim rotation, cast overrides and muzzle origin in the actual gameplay camera. Restrict occlusion treatment to genuine obstruction and preserve a solid readable torso wherever possible. This is integration work before further armor detailing.

2. **The camera sacrifices the fight to the room composition.**  
   **Where:** `play/breacher/r5-crew-checkpoint-mid.png`; `builds/v2-full-arc-armory-armory-04.png`; `../final6-720/g6-kiting-containment-annulus-03.png`.  
   The marine is partially outside the left edge in a real campaign frame. Elsewhere, enemies accumulate behind the action bar or below the screen while comparatively empty floor occupies the upper field. Offscreen arrows communicate that enemies exist; they cannot replace seeing their attacks.  
   **Fix:** Include weapon and animated extremities in the safe framing envelope. Limit aim look-ahead near boundaries, and reserve visible space for the nearest attacking threats. Treat the action bar as an exclusion area for crucial combat staging.

3. **Environmental lighting and outlines give fixtures too much importance.**  
   **Where:** `rooms/combat-calm-awakening-bay.png`; `rooms/combat-calm-crew-checkpoint.png`; `rooms/combat-calm-communal-atrium.png`.  
   White strip lights, massive hanging assemblies and dark outlines repeatedly become the highest-contrast objects. The atrium’s pendant lamps compete with its entire planted centerpiece. The result resembles an architectural demonstration populated by combatants.  
   **Fix:** Reduce fixture count, projected size and edge contrast. Move secondary lighting toward walls and perimeter structures. Establish a deliberate hierarchy: actors and imminent attacks first, landmark second, ordinary architecture third. Do a lighting-only pass before adding props.

4. **The ship has functions, but very little visible history.**  
   **Where:** `rooms/combat-calm-residential-gallery.png`; `rooms/room-tour-infested-workshop-sprite.png`; `rooms/room-tour-swarm-junction-sprite.png`; `rooms/combat-calm-overload-floor.png`.  
   Bedrooms look arranged, workshops remain orderly, infestation is mostly thin strands, and the final reactor deck is remarkably clean. Room names promise events that the scenery barely depicts. This weakens both discovery and escalation across twenty rooms.  
   **Fix:** Author one unmistakable incident per room: an interrupted evacuation, a cocooned workstation, cargo displaced by a breach, a failed repair, a scorched access route. Concentrate these into readable compositions around the playable space. Infestation needs masses that deform and consume architecture, not additional decorative threads.

5. **The strongest abilities look like graphics laid over the fight.**  
   **Where:** `abilities/v2-flashfire-awakening-bay-04.png`; `builds/v2-full-pyro-armory-armory-04.png`; `abilities/v2-cryo-nova-awakening-bay-04.png`; `abilities/v2-railbreaker-awakening-bay-04.png`.  
   Flashfire is a large salmon-colored flame cutout; Cryo Nova resembles a soft floor pinwheel; Railbreaker is a broad translucent rectangle with a pale stripe. They communicate area better than force, heat or energy.  
   **Fix:** Reauthor the principal effect shapes and their relationship to the world. Fire needs a hotter compact core, broken silhouettes, varied tongues and convincing ground contact. Railbreaker needs a sharper discharge and impact response. Cold needs crystallization and local frost. Add restrained light response and short-lived residue while preserving hostile telegraph contrast.

6. **Creature anatomy and materials do not sell danger or mass.**  
   **Where:** `motion/brute-overview.png`; `motion/carrier-overview.png`; `enemies/m10-melee-crowd-communal-atrium-15.png`.  
   Too many creatures resolve into a colored body perched on thin, dark, pointed legs. The brute’s scythes communicate aggression, but its support structure does not communicate weight. The carrier’s pink sac reads almost floral.  
   **Fix:** Redesign at gameplay size: strengthen the brute’s load-bearing stance, give the carrier a sagging abdominal mass and clear brood opening, and differentiate hard carapace from soft tissue with broad value and roughness changes. Remove detail that turns into black tangles.

7. **The animation library has coverage without enough physical conviction.**  
   **Where:** `motion/marine-overview.png`; `motion/crawler-overview.png`; `motion/stalker-overview.png`; `motion/carrier-overview.png`.  
   The marine’s running extremes spread the legs dramatically while the gun-bearing upper body remains comparatively fixed. Several creature attacks change position or limb angle more than overall silhouette. The strips suggest mechanical articulation rather than deliberate exertion.  
   **Fix:** Concentrate on run, primary attack, hit and death before expanding anything. Add pelvis and shoulder counterrotation, readable planted phases, compression before acceleration and clear recovery. Give each enemy one unmistakable anticipation pose. Evaluate those poses at the actual camera angle, not only in isolated previews.

8. **Elites and boss-class enemies lack a sufficiently different identity.**  
   **Where:** `enemy-variants/g12-native-brute-warden-awakening-bay-15.png`; `enemy-variants/g12-native-carrier-matron-awakening-bay-15.png`; `motion/brute-elite-overview.png`; `motion/carrier-elite-overview.png`.  
   Outlines, health bars, spikes and small color changes do much of the identification. The Warden and Matron do not immediately promise encounters different enough from their parent families. That wastes major opportunities for memorable screenshots.  
   **Fix:** Give each boss-class variant a distinctive silhouette, posture and attack apparatus: a broad asymmetric shield mass for one, an unmistakably expanded brood structure for another. Ordinary elites need one large physical modification visible without their UI treatment.

9. **Rewards are legible but visually unrewarding.**  
   **Where:** `starting-boon.png`; `augment-draft.png`; `pause-loadout.png`.  
   The cards offer substantial empty panel space, tiny schematic symbols and multiple layers of classification. They resemble configuration choices more than exciting acquisitions. Good copy hierarchy cannot supply all the desire in a roguelike reward loop.  
   **Fix:** Give boons larger, distinctive illustrations or equipment diagrams; foreground the behavioral change; demote taxonomy and secondary metadata. Show one clear visual preview of what becomes different in combat.

10. **The ending communicates the outcome without staging its emotional cost.**  
    **Where:** `complete-fixture.png`; `rig-select-cryo.png`; `pause.png`.  
    The ending repeats the standing armed-marine presentation and states the result several ways. The ship’s destruction and the passengers’ loss are largely text. It feels like a completed status report after a premise that calls for sacrifice.  
    **Fix:** Compose an ending-specific image: the failing ship, abandoned equipment, the transmission leaving the vessel, or an empty station receiving it. Give the marine a purposeful final pose if present. Remove redundant outcome text and let one image carry some meaning.

**4. Five things that are genuinely good**

1. **The interface has disciplined hierarchy.** Large headings, clear primary actions, selected-state outlines and restrained color work well. Preserve this structure while enriching reward art. (`title-settings.png`; `rig-select.png`; `pause.png`)

2. **The game explains its systems visually.** Rig ability diagrams show lanes, barriers and displacement; the native death screen identifies the fatal attack and recent damage. These are useful, player-facing explanations. (`rig-select.png`; `play/breacher/terminal-dead.png`)

3. **The four rigs have a workable effect vocabulary.** Kinetic lanes and shockwaves, physical ice, fire territory and angular electrical connections are distinguishable. Improve their execution without dissolving everything into generic bloom. (`abilities/v2-seismic-slam-awakening-bay-04.png`; `abilities/v2-glacier-awakening-bay-04.png`; `abilities/v2-napalm-charge-awakening-bay-04.png`; `abilities/v2-overload-awakening-bay-04.png`)

4. **Some landmarks genuinely organize a room.** The armory carousel, service shaft and reactor rings supply recognizable shapes and spatial purpose. They are the standard the less distinctive rooms should meet. (`rooms/combat-calm-armory.png`; `rooms/combat-calm-service-shaft-landing.png`; `rooms/g6-kiting-overload-floor-03.png`)

5. **Combat leaves visible evidence, and the reactions have breadth.** Native cleared rooms retain fallen creatures; the motion sheets contain distinguishable frozen, burning and death treatments. Preserve those consequences while strengthening their weight and material response. (`play/breacher/r4-communal-atrium-clear.png`; `motion/brute-overview.png`; `motion/carrier-overview.png`)

**5. Twenty rooms: the single weakest thing in each**

| Room | Weakest aspect and evidence |
|---|---|
| Awakening Bay | The orderly pod ward and dominant lighting assemblies fail to sell an emergency awakening. `rooms/combat-calm-awakening-bay.png` |
| Passenger Vault | Repeated intact pod ranks provide scale but almost no individual human story. `rooms/combat-calm-passenger-vault.png` |
| Residential Gallery | Bare, neatly arranged accommodation lacks the belongings and interrupted activity that would make it residential. `rooms/combat-calm-residential-gallery.png` |
| Communal Atrium | Simplified round trees and giant pale pendant lamps make the centerpiece feel like a toy shopping mall. `rooms/combat-calm-communal-atrium.png` |
| Crew Checkpoint | The pale floor and repeated white fixtures flatten what should feel like a controlled, fortified threshold. `rooms/combat-calm-crew-checkpoint.png` |
| Armory | The enormous pale counter dominates the darker weapon carousel that should be the attraction. `rooms/combat-calm-armory.png` |
| Freight Hold | Neat, low cargo arrangements do not communicate the volume or disorder of a colony ship’s freight operation. `play/breacher/r7-freight-hold-start.png` |
| Breached Loading Bay | The smooth folded breach form reads like fabric or soft plastic rather than violently torn ship structure. `rooms/combat-calm-breached-loading-bay.png` |
| Relay Racks | The equipment sits visually subordinate to repeated light rectangles, weakening the room’s technical identity. `rooms/combat-calm-relay-racks.png` |
| Transmission Chamber | The important uplink landmark is peripheral to expanses of generic floor rather than commanding the encounter. `rooms/room-tour-transmission-chamber-sprite.png` |
| Diagnostic Gallery | The sign carries the revelation while the physical scene supplies little corresponding evidence. `rooms/combat-calm-diagnostic-gallery.png` |
| Safety Interlock Station | It is too close to the diagnostic room’s visual template for a distinct narrative and mechanical threshold. `rooms/combat-calm-safety-interlock-station.png` |
| Coolant Plant | Clean, dry surfaces and peripheral pipes communicate infrastructure but barely communicate coolant. `rooms/combat-calm-coolant-plant.png` |
| Service Shaft Landing | The overbright edge console competes with the shaft’s much stronger depth composition. `rooms/combat-calm-service-shaft-landing.png` |
| Infested Workshop | The infestation is too thin and sparse to appear to have taken over anything. `rooms/room-tour-infested-workshop-sprite.png` |
| Swarm Junction | Purple strands and beads decorate intact machinery instead of establishing a biological stronghold. `rooms/room-tour-swarm-junction-sprite.png` |
| Shielding Gate | The room lacks a sufficiently imposing gate or shielding mechanism to make its name visually self-evident. `rooms/room-tour-shielding-gate-sprite.png` |
| Containment Annulus | The great central installation reads as an inert gray lid, with too little indication of pressure, contents or danger. `rooms/combat-calm-containment-annulus.png` |
| Manual Control Chamber | A decisive story location still looks like another empty engineering corridor with a sign. `rooms/room-tour-manual-control-chamber-sprite.png` |
| Overload Floor | The reactor is attractive, but its pristine surrounding deck undercuts the sense of terminal catastrophe. `rooms/g6-kiting-overload-floor-03.png` |

**6. Marine and creature families**

| Subject | Gameplay-size reading | Weakest aspect |
|---|---|---|
| **Marine** | Easy to locate through pale armor and the bright ring; individual armor design is much less apparent than in portraits. | Pose, direction and ground-marker integration; the stretched running silhouette weakens the armored weight. `play/breacher/r1-awakening-bay-start.png`; `motion/marine-overview.png` |
| **Crawler** | The orange oval body reads reliably as a small rushing bug. | Generic beetle identity and fine legs; attack intent depends heavily on its warning graphic. `enemies/m10-melee-crawler-awakening-bay-01.png`; `motion/crawler-overview.png` |
| **Stalker** | Weakest family at small size: a dark, narrow spider that can merge with the marine and floor. | Insufficient body mass and value separation; its attack silhouette is too modest. `enemies/m10-melee-stalker-awakening-bay-15.png`; `review480/enemies--m10-melee-stalker-awakening-bay-15.png` |
| **Spitter** | The green sac makes the role easy to recognize. | The sac does more communication than the anatomy; head, mouth and firing posture need a clearer relationship. `enemies/m10-melee-spitter-awakening-bay-15.png`; `motion/spitter-overview.png` |
| **Brute** | Scythes and larger body identify a heavier melee threat. | Narrow support limbs and limited body compression undermine that promised heaviness. `enemies/m10-melee-brute-awakening-bay-15.png`; `motion/brute-overview.png` |
| **Carrier** | Tall profile and pink crown/sac distinguish it from ordinary attackers. | The pink mass looks decorative, and the thin stance does not suggest a burdened brood creature. `enemies/m10-melee-carrier-awakening-bay-15.png`; `motion/carrier-overview.png` |
| **Ordinary elites** | Gold bars and orange presentation identify status faster than anatomy. | Physical differences are too small to survive busy combat. `motion/crawler-elite-overview.png`; `motion/stalker-elite-overview.png`; `motion/spitter-elite-overview.png`; `motion/brute-elite-overview.png`; `motion/carrier-elite-overview.png` |
| **Warden** | Reads as a brute variant. | Does not yet read as a distinct boss-class character. `enemy-variants/g12-native-brute-warden-awakening-bay-15.png` |
| **Matron** | Reads as a carrier variant. | Lacks the mass and unique reproductive anatomy needed to establish hierarchy immediately. `enemy-variants/g12-native-carrier-matron-awakening-bay-15.png` |

**7. What improved—and regressed**

**Against baseline:**

- **Much better interface and actor visibility.** The original has scattered HUD blocks and a tiny marine; final6 gives the player more presence and consolidates combat information. (`compare/baseline/combat-calm-awakening-bay.png`; `compare/final6/combat-calm-awakening-bay.png`)
- **Much better separation in crowds.** Baseline’s textured enemies merge into a dense dark mass. Final6’s simpler bodies, stronger color roles and explicit attack footprints are easier to parse. (`compare/baseline/combat-heavy-breached-loading-bay-01.png`; `compare/final6/combat-heavy-breached-loading-bay-01.png`)
- **Much better presentation of rooms as spaces.** Perspective, lighting and prop volume add depth and presence. (`compare/baseline/combat-calm-armory.png`; `compare/final6/combat-calm-armory.png`)
- **Worse overview of the arena.** The closer camera trades away the baseline’s immediate understanding of room boundaries and routes; the native campaign shows that this trade still needs correction. (`compare/baseline/combat-calm-communal-atrium.png`; `compare/final6/combat-calm-communal-atrium.png`; `play/breacher/r5-crew-checkpoint-mid.png`)
- **Less grotesque physical texture.** Baseline creatures have more fleshy, unpleasant surface character, although their crowd readability is substantially worse. Recover some of that material distinction without restoring the noise. (`compare/baseline/combat-heavy-relay-racks-01.png`; `compare/final6/combat-heavy-relay-racks-01.png`)

**Against final5:**

- **Better creature construction.** Final6’s brutes have more articulated armor and clearer scythes than final5’s broad, simplified brown forms. The marine also has more specific equipment and armor detail. (`compare/final5/combat-heavy-breached-loading-bay-01.png`; `compare/final6/combat-heavy-breached-loading-bay-01.png`)
- **Better floor continuity and less arbitrary patchwork.** The new floor treatment removes distracting large irregular patches and scattered markings. (`compare/final5/combat-calm-awakening-bay.png`; `compare/final6/combat-calm-awakening-bay.png`)
- **Worse environmental variety and focal hierarchy.** That cleanup also standardizes the rooms. Final5’s atrium has stronger localized lighting around the planter; final6 fills the scene with large pale pendants and familiar strip fixtures. (`compare/final5/combat-calm-communal-atrium.png`; `compare/final6/combat-calm-communal-atrium.png`)
- **Better explicit melee information, but reduced creature bulk.** Final6’s visible attack arcs help; the slimmer enemies lose some of final5’s imposing mass. (`compare/final5/combat-heavy-containment-annulus-01.png`; `compare/final6/combat-heavy-containment-annulus-01.png`)
- **The title comparison needs qualification.** The stored `compare/final6/title.png` is the earlier glossy marine composition. The current `title.png` adds the detailed marine, breach and stronger alien presence. It is more substantial, but I still prefer final5’s unified illustrated treatment over the current contrast between polished character rendering and simpler gameplay. (`compare/final5/title.png`; `compare/final6/title.png`; `title.png`)

Low retains the essential actor colors and HUD while losing depth; its reduced overhead clutter sometimes makes the fight easier to read. The 720p captures preserve usable menu hierarchy, but expose the combat/action-bar overlap more strongly. These are visual findings, not performance judgments. (`low/g2-kiting-low-awakening-bay-03.png`; `low/g2-calm-low-armory.png`; `../final6-720/rig-select.png`; `../final6-720/g6-kiting-containment-annulus-03.png`)

**8. One month: the five highest-return investments**

1. **Repair the marine’s presentation and combat camera together.** Assign an animator and engineer to direction, stance, muzzle alignment, transparency and screen-edge handling. This affects the object players watch constantly. (`builds/v2-full-breacher-armory-armory-04.png`; `play/breacher/r5-crew-checkpoint-mid.png`)

2. **Give the environment one decisive art-direction pass.** Reduce repetitive lighting hardware, control outlines and brightness, and establish a distinctive incident in each room. Spend the most time on the opening, infestation transition and final sequence. (`twenty-calm.png`; `rooms/room-tour-infested-workshop-sprite.png`; `rooms/combat-calm-overload-floor.png`)

3. **Rebuild the weakest combat effects around impact and aftermath.** Start with Flashfire, Railbreaker and the four overdrives. Preserve clear shapes, add material response, and make the aftermath briefly demonstrate what the power did. (`abilities/v2-flashfire-awakening-bay-04.png`; `abilities/v2-railbreaker-awakening-bay-04.png`; `abilities/v2-whiteout-awakening-bay-07.png`; `abilities/v2-overclock-awakening-bay-07.png`)

4. **Strengthen creature silhouettes and their four essential actions.** Prioritize Stalker visibility, Brute weight, Carrier biology, then distinct Warden and Matron forms. Model and animation changes should be judged together at gameplay size. (`review480/enemies--m10-melee-stalker-awakening-bay-15.png`; `motion/brute-overview.png`; `motion/carrier-matron-overview.png`)

5. **Give rewards and the ending authored images of their own.** Preserve the existing UI structure, commission meaningful boon imagery, distinguish rig portraits through posture and equipment, and stage an actual final image. These are concentrated, highly visible improvements to perceived product completeness. (`augment-draft.png`; `rig-select-cryo.png`; `rig-select-pyro.png`; `complete-fixture.png`)