# R13-A — independent visual verdict (GPT Astra 6.2, high reasoning, 2026-11-19, gallery final8)

## 1. Scores

| Area | /10 | Judgment |
|---|---:|---|
| First impression | **6.5** | The orange 07 shoulder, the rifle pointed across the title and the “Wake up” button sell the premise immediately, but the first fight spends its strongest contrast on empty cryo berths while the first attacker looks like a speck. `title.png`, `play/story-cryo/storyboard-awakening-bay.png` |
| Interface and HUD | **7.0** | I can choose a rig, understand a boon and read 39 health or an empty magazine under pressure, although the smaller tactical hints ask me to look away from the fight. `rig-select.png`, `augment-draft.png`, `native-heavy/arc-hardest-4758-0.png` |
| Combat readability | **6.0** | A single committed lunge gives me a clear direction to dodge, but overlapping orange footprints, damage figures and dark limbs make it hard to identify who can hit me next. `review480/champion-mechanics--comm13-flank-residential-gallery-05.png`, `review480/native-heavy--pyro-hardest-4071-0.png` |
| Environments | **6.0** | A pod leak, a frozen pipe and a machine overtaken by tendrils tell three distinct stories, yet too many entry views use the same composition of a trail across a tiled deck to a prop at the edge. `twenty-calm.png`, `twenty-calm-grey.png` |
| Ability spectacle | **6.0** | Railbreaker gives a shot direction and Glacier gives ice real height, while Meltdown spends its opening beat drawing circles and Whiteout leaves much of the crowd visually unchanged. `review480/abilities--v2-glacier-crew-checkpoint-crew-checkpoint-04.png`, `overdrive-retry/gallery-overdrive-{breacher,pyro,cryo}-armory-02.png` |
| Character and creature art | **5.5** | The marine, Warden and Matron have recognizable large shapes, but their close gameplay views expose an overlit suit, indistinct joints and creature materials that fall away around a single bright organ. `rig-select.png`, `bosses/ktx2-warden-relay-racks-charge-windup.png`, `bosses/ktx2-matron-relay-racks-pod-countdown.png` |
| Animation and motion | **5.5**, provisional | The Brute lifts its blade and folds under a heavy hit, but the marine’s torso changes little over an enormous stride and several creature hit and stagger rows repeat practically the same poses. `motion/{marine,brute,carrier,stalker}-contact-1.png` |
| Visual cohesion | **6.5** | The dark decks, lantern organs and pale operator belong to the same emergency-lit ship, though the glossy menu armour and almost solid-white gameplay armour still look lit for different games. `title.png`, `rig-select-arc.png`, `native-heavy/arc-hardest-4758-0.png`, `twenty-kiting.png` |

Paths are relative to `artifacts/nextgen/final8/`. Braces enumerate filenames. I opened 100 image files, nine at native 1920×1080, including all four Overdrives. The four room sheets provide 480-wide calm and heavy views for all twenty rooms. I also inspected twelve individual incident views, all sixteen abilities at impact, six motion overviews, a campaign storyboard, Low and native 720p. Diagnostic and Manual Control use substituted heavy encounters on the sheets. The gallery spans two build points. Pose sheets support judgments about silhouettes and staging. Timing, input feel and performance require playback. Scores were recorded before reading R12. `MANIFEST.md`, `abilities/manifest.json`, `motion/index.html`, `twenty-kiting.png`

## 2. Calibration

**I would pay US$8 on this visual showing.** This looks like a budget indie with a release-quality decision interface and an uneven combat presentation. My premium reference in *Hades* is being able to read an attack from the attacker’s body. In *The Ascent* it is being able to infer what a place did before the shooting started. Containment gets closest when I see an open berth, a spill and footprints leaving it. It falls furthest short when I can read “Sidestep the Brute’s committed strike” more easily than I can identify the striking Brute. Across twenty rooms the latter matters more to my purchase decision than the quality of the title. `review480/rooms--incident-facing-awakening-bay.png`, `overdrive-retry/gallery-overdrive-arc-armory-02.png`, `twenty-kiting-grey.png`

## 3. Ten most damaging defects, ranked

1. **Small enemies lose their facing in shadow.** In the Atrium crowd I can count green and violet lights sooner than I can tell which way their owners face. In the Armory even the Brute’s blades merge with the deck. That costs the player the first beat of a dodge. Give each small family one broad, lit attacking plane and a gap between that limb and the torso. Start with the Stalker’s leading scythe. Keep the lantern as the brightest point. `review480/crowds--gallery-crowd-stalker-communal-atrium.png`, `compare/final8/compare-heavy--combat-heavy-armory-01.png`
2. **Friendly fire effects borrow the danger signal.** In the native Pyro run, orange burn ticks sit over orange fire patches and a hostile orange sector immediately above the marine. At this point “stand here to deal damage” and “leave now” need different shapes. Give the committed hostile edge an uninterrupted light lip, break the friendly fire perimeter into char and embers, and combine repeated damage ticks per target. Preserve the exact hostile footprint. `review480/native-heavy--pyro-hardest-4071-0.png`, `overdrive-retry/gallery-overdrive-pyro-armory-02.png`
3. **Foreground objects conceal tactical information.** A hanging diagnostic sign masks most of a creature in a real run. In a full Cryo build the pale debris, frost and marine occupy the same patch, and threats run into the ability strip. I need to see the occupied floor to choose an escape. Fade the sign face and rail locally over actors, reduce frost over their cores, and keep the nearest hostile edge visible where it crosses the HUD. `native-heavy/arc-hardest-4758-0.png`, `review480/builds--v2-full-cryo-armory-armory-04.png`, `../final8-720/g6-kiting-containment-annulus-02.png`
4. **Too many rooms tell their story with the same floor graphic.** A ribbon leads to the Passenger Vault cabinet, Atrium planter, Freight cargo and Relay equipment. After several rooms I start reading the artist’s pointer instead of reconstructing the accident. Recompose three scenes at gameplay scale. Give Freight a leaning stack with a corresponding impact below it, Passenger Vault an interrupted human evacuation, and Atrium a crushed gathering place. Leave their combat lanes open. `twenty-calm.png`, `review480/rooms--incident-facing-{passenger-vault,communal-atrium,relay-racks}.png`
5. **The Overdrives need a stronger consequence at the target.** Railbreaker has an excellent line, but Whiteout’s most elaborate motion cues surround the caster. Meltdown eventually fractures the deck, after an early frame dominated by two fine circles. The ability I save up for should visibly change the encounter when it lands. Carry frost up struck shells, vent heat from the first fissure, and run Overclock’s discharge through identifiable targets in sequence. Retain the quiet space around hostile tells. `overdrive-retry/gallery-overdrive-{breacher,cryo,arc,pyro}-armory-02.png`, `review480/abilities--v2-meltdown-relay-racks-relay-racks-{03,06}.png`
6. **The marine loses its identity between selection and play.** The portrait has a visor, overlapping shell plates and dark joints. In action the light joins helmet, shoulder and arm into one pale patch around a dark gun. I recognize my location faster than my character or rig. Carry the shoulder colour onto its top face, deepen the neck and elbow gaps, and give the receiver one readable upper plane. Preserve the bright overall silhouette. `title.png`, `rig-select-cryo.png`, `motion/marine-contact-1.png`, `native-heavy/arc-hardest-4758-0.png`
7. **The important poses need more weight.** The marine’s extended running legs change shape much more than the pelvis or gun carriage. The Carrier’s heavy-hit and stagger rows fold and return to nearly identical outlines. Hits risk feeling interchangeable even when damage differs. Repose pelvis and shoulders for a planted stride, give the Carrier a sac that lags the thorax, and author a recovery silhouette that shows when a heavy enemy is vulnerable. The sheets cannot establish foot sliding. `motion/{marine,carrier,brute}-contact-1.png`
8. **Small elites have little visible rank.** In the Checkpoint isolates the elite Stalker’s cursor dominates its body. The elite Crawler retains the visual weight of a small rust-coloured beetle. A player should be able to prioritize either before seeing its attack. Give each an enlarged asymmetric family feature visible from above, such as a hooked forelimb or split dorsal plate. `review480/enemy-variants--i11b-calm-{stalker,crawler,spitter,brute,carrier}-elite-crew-checkpoint.png`
9. **Secondary mechanic markers demand too much decoding.** In the 720p Annulus the instruction calls out two firing lines while a faint ochre bracket can pass for deck paint. During the transmission hold, the progress label shares a compact cluster with a chevron and the marine. Make each firing origin terminate in a directional head and attach one bold progress arc to the hold point. Keep them subordinate to an imminent strike. `../final8-720/g6-kiting-containment-annulus-02.png`, `review480/siege-retry--comm13-siege-transmission-chamber-05.png`
10. **Some decisions still look like paperwork.** The two route cards repeat the same schematic room with a small crate as the main difference. The boon draft gives a generic room record a full-width block above the reward. These screens spend attention just as a player should be anticipating the next choice. Give the cache route a distinct incident vignette and collapse the room record to one expandable line. Keep the boon’s behaviour sentence prominent. `review480/route.png`, `augment-draft.png`, `review480/starting-boon.png`

## 4. Five things to preserve

1. **The rig selection explains how a build plays.** A coloured shoulder, a representative weapon and four spatial diagrams sell distinct possibilities before the first shot. `review480/rig-select{,-arc,-cryo,-pyro}.png`
2. **Critical numerals survive the fight.** Health, ammunition and keyboard actions remain recoverable at a glance, including when the surrounding panel fades. `native-heavy/arc-hardest-4758-0.png`, `overdrive-retry/gallery-overdrive-cryo-armory-02.png`
3. **The open cryo berth has a human story.** An empty slot, tracks and footprints let the player infer that someone left. This gives the first room an image worth remembering. `review480/rooms--incident-facing-awakening-bay.png`
4. **The best abilities teach their geometry.** Bulwark has two posts and a screen, Glacier has a row of teeth, and Railbreaker has a hot straight core. Each answers a distinct tactical question even in a small image. `review480/abilities--v2-{bulwark,glacier}-crew-checkpoint-crew-checkpoint-04.png`, `review480/abilities--v2-railbreaker-relay-racks-relay-racks-03.png`
5. **The bosses now show how to fight them.** The Warden’s plated front and charge lane invite a sidestep. The Matron and her detached pods share a crown shape and colour, giving me a second target to consider. `bosses/ktx2-warden-relay-racks-charge-windup.png`, `bosses/ktx2-matron-relay-racks-pod-countdown.png`, `review480/bosses--ktx2-matron-relay-racks-hatched.png`

## 5. Twenty rooms, one weakness each

Each row cites its named 480-wide cell in `twenty-calm.png` and `twenty-kiting.png`. The greyscale equivalents show which distinctions survive without hue.

| Room | Weakest element in the supplied views |
|---|---|
| Awakening Bay | The bright spill has such a crisp outline that it competes with the Cryo field in the first fight. |
| Passenger Vault | The repeated human emblems identify occupied storage, but the identical lids give the eye no individual passenger to care about. |
| Residential Gallery | The broken domestic scene slips off the top of the incident-facing view, leaving the marine facing plain brown tile. |
| Communal Atrium | The pale striped spill commands more attention than the overturned furniture that explains the accident. |
| Crew Checkpoint | The dark sides of the inspection fixtures merge with the deck, weakening the reading of the passage between them. |
| Armory | The horseshoe counter eclipses the rifle carousel inside it, which reads as a dark wheel. |
| Freight Hold | The small scattered cargo has too little height against the much larger foreground enclosure. |
| Breached Loading Bay | Long parallel scrape marks remain in view after most of the torn hull has left the frame. |
| Relay Racks | The neatly looped, evenly spaced cable bundle makes a damaged installation look carefully dressed. |
| Transmission Chamber | The blue-black assembly beside the hold boundary has an ambiguous footprint. |
| Diagnostic Gallery | The suspended sign cuts across the apparatus and can hide a creature during play. |
| Safety Interlock Station | The hanging amber board and horizontal rail repeat Diagnostic’s composition one room later. |
| Coolant Plant | The ice sheet is so much brighter than the deck that the marine loses separation when crossing it. |
| Service Shaft Landing | The near-black open side swallows the bracing that should communicate the shaft’s depth. |
| Infested Workshop | The long parallel tendrils initially read as another cable run, delaying the reveal of living tissue. |
| Swarm Junction | The smooth purple lobes on the machine resemble clay pressed onto its casing. |
| Shielding Gate | The purple mass at its base is easier to identify than the mechanism that makes this a gate. |
| Containment Annulus | The floor fracture is clear, but the circular mechanism it leads to is cropped at entry. |
| Manual Control Chamber | The black support cuts through the soot fan that should lead the eye to the burned controls. |
| Overload Floor | The dramatic split deck leads out to a cropped reactor, withholding the scale of the final emergency. |

## 6. Character read at gameplay size

| Subject | What reads first, and what fails first |
|---|---|
| Marine | **Yes.** Bright armour and gun direction locate the player. The visor and dark undersuit that give the portrait personality disappear first. `rig-select.png`, `motion/marine-contact-1.png` |
| Crawler | **Marginal.** The low red-backed beetle reads in isolation. Its leading limbs disappear among debris and the body barely changes outline through the lunge. `motion/crawler-contact-1.png`, `play/story-cryo/storyboard-awakening-bay.png` |
| Stalker | **Marginal.** Its capsule tells me where it will travel. Its narrow purple body says much less about which end will strike. `motion/stalker-contact-1.png`, `compare/final8/enemies--m10-melee-stalker-awakening-bay-01.png` |
| Spitter | **Yes by its green sac.** I can pick a ranged threat out of a group, but cannot follow the sac to a readable mouth or muzzle. `motion/spitter-contact-1.png`, `overdrive-retry/gallery-overdrive-breacher-armory-02.png` |
| Brute | **Yes.** Broad legs and paired cleavers establish a heavy. In shadow the attacking blade merges into the chest before its orange footprint appears. `motion/brute-contact-1.png`, `compare/final8/compare-heavy--combat-heavy-armory-01.png` |
| Carrier | **Yes by its raised pink sac.** The nearly parallel support legs give little sense that the abdomen bears weight. `motion/carrier-contact-1.png`, `review480/enemy-variants--i11b-calm-carrier-elite-crew-checkpoint.png` |
| Ordinary elites | **Family usually reads, rank seldom does.** The small Stalker and Crawler suffer most, even alone on an uncluttered floor. `review480/enemy-variants--i11b-calm-{crawler,stalker,spitter,brute,carrier}-elite-crew-checkpoint.png` |
| Brute Warden | **Yes, immediately boss-sized.** The forward plates and long charge lane work. Its round armour face is easier to see than the head or braced joint behind it. `bosses/ktx2-warden-relay-racks-charge-windup.png`, `review480/champion-mechanics--comm13-priority-armory-05.png` |
| Carrier Matron | **Yes.** The tall crest and flanking pods establish a brood encounter. After hatching, tiny offspring against the cable are much harder to prioritize than the mother. `bosses/ktx2-matron-relay-racks-pod-countdown.png`, `review480/bosses--ktx2-matron-relay-racks-hatched.png` |

## 7. Against R12

I compared twelve final7/final8 pairs. Each filename below occurs under both `compare/final7/` and `compare/final8/`. For the seven UI and ability pairs I reused already inspected final8 views and verified the originals match the comparison copies byte for byte. The baseline title provides a further reference. `compare/baseline/title.png`

| Paired evidence | Filenames |
|---|---|
| Screens | `title.png`, `rig-select.png`, `shop.png`, `augment-draft.png` |
| Rooms | `rooms--combat-calm-{awakening-bay,crew-checkpoint,infested-workshop}.png` |
| Combat and creature | `compare-heavy--combat-heavy-armory-01.png`, `enemies--m10-melee-stalker-awakening-bay-01.png` |
| Abilities | `abilities--v2-{whiteout,flashfire,glacier}-crew-checkpoint-crew-checkpoint-04.png` |

| R12-A score | R12 → R13 | What the pairs show |
|---|---:|---|
| First impression | 6.5 → 6.5, **same** | Title and rig retain their strengths. Bay gains an incident, but the luminous berths still outstage the first enemy. |
| Interface and HUD | 6.5 → 7.0, **+0.5** | Shop’s text list becomes an illustrated grid. Draft’s three similar pedestals become three identifiable objects. |
| Combat readability | 6.5 → 6.0, **−0.5** | In the closely matched Armory crowd, the sector and lanterns gain contrast while the attacking limbs and gaps between bodies lose it. |
| Environments | 5.5 → 6.0, **+0.5** | Workshop replaces nearly empty foreground tile with a machine feeding tendrils into the room. Bay and Checkpoint also give the eye a destination. |
| Ability spectacle | 5.5 → 6.0, **+0.5** | Whiteout gains a torn frost lip and Flashfire’s hot core separates from the darker deck. Glacier’s silhouette was already strong. |
| Character and creature art | 5.5 → 5.5, **same** | The Armory lanterns gain presence, but the paired Stalker is still a small mark at the end of its lane. The two current boss views in §6 raise the ceiling. |
| Animation and motion | 5.5 → 5.5, **same, provisional** | The paired Stalker shows a similar strike setup. The current pose sheets show a clear heavy recoil, but the pairing supplies no timed evidence of better weight or recovery. `motion/{stalker,brute}-contact-1.png` |
| Visual cohesion | 6.0 → 6.5, **+0.5** | Checkpoint and Workshop now share the title’s dark stage and deliberate focal light. The paired rig portrait still promises more material separation than the game delivers. |

**R12-A’s ten defects**, in their original order:

1. **Room composition — partly fixed.** The Bay and Workshop pairs show authored incidents reaching into play. The repeated trail-to-prop layout is visible across `twenty-calm.png`.
2. **Shared power climaxes — partly fixed.** The Whiteout and Flashfire pairs improve. Meltdown’s late fissures help, but the early circles still look like targeting aids. `review480/abilities--v2-meltdown-relay-racks-relay-racks-{03,06}.png`
3. **Marine material identity — partly fixed.** The Bay pair gives the shoulder a warmer read. The suit still loses joint separation against its portrait in the rig pair and `native-heavy/arc-hardest-4758-0.png`.
4. **Boss tier — fixed at gameplay silhouette scale.** Warden has a shielded front and several times the small enemies’ footprint. Matron has a crest and separate pods. This is a judgment against the prior review’s description. The comparison gallery has no paired final7 boss row. `bosses/ktx2-{warden-relay-racks-charge-windup,matron-relay-racks-pod-countdown}.png`
5. **Creature biology — partly fixed.** Lantern organs read better in the Armory pair and Matron’s pods explain reproduction. The Stalker pair and `motion/spitter-contact-1.png` still give weak attack anatomy.
6. **Overlay priority — partly fixed.** A single sector wins cleanly in the Armory pair. In the native Pyro run, damage figures and fire obscure its source. `review480/native-heavy--pyro-hardest-4071-0.png`
7. **Expressive actions — untouched at the level visible here.** The Stalker pair still relies on the capsule, and the marine’s carriage stays fixed through an extreme stride. `motion/marine-contact-1.png`
8. **Administrative rewards — partly fixed.** Shop and draft pairs show real improvements. Both route options still illustrate nearly the same destination. `review480/route.png`
9. **Lighting as graphic patches — partly fixed.** Checkpoint has a focal pool now, but Relay still has regularly spaced soft spots with no obvious source in view. `review480/rooms--incident-facing-relay-racks.png`
10. **Boundary framing — partly fixed.** Both previously problematic rooms have heavy cells; the moving kiting failures remain documented. The 720p Annulus still places incoming bodies behind the bottom controls. `twenty-kiting.png`, `../final8-720/g6-kiting-containment-annulus-02.png`, `DEFECTS.md`

**R12-C’s seven proposed changes**, in their original order:

1. **Creature silhouette, value and scale — partly fixed.** Boss scale and crests work. Ordinary bodies are too dependent on bright organs in the Armory and Stalker pairs. See both boss frames in §6.
2. **Hero like the key art — partly fixed.** The Bay pair improves warmth and separation from the deck. The orange shoulder, cyan visor and readable receiver of the title still do little work in combat. `title.png`, `motion/marine-contact-1.png`
3. **Dark ship with localized light — partly fixed.** The artistic direction is in place at Checkpoint and Workshop. The Armory pair shows the remaining failure to keep peripheral combat lanes readable.
4. **Floor breakup — partly fixed.** Leaks, pulled cables and resin are visible in all three room pairs. The repeated flat trails and open areas still lack convincing changes of level. `twenty-calm-grey.png`
5. **Telegraph language — partly fixed.** The matched Stalker capsule and Armory sector have a clear footprint. Multiple orange outlines still converge on the marine. `overdrive-retry/gallery-overdrive-breacher-armory-02.png`
6. **Area-effect volume — partly fixed.** Whiteout has airborne streaks, Seismic has cracks, and Napalm has a hot raised centre. Large circular rims still carry much of the effect. `review480/abilities--v2-{seismic-slam,napalm-charge}-relay-racks-relay-racks-03.png`, paired Whiteout.
7. **Infestation material — partly fixed.** Workshop’s tendrils now attach to machinery and reach across the floor. Swarm Junction’s broad lobes still look smooth and moulded. Workshop pair and `twenty-calm.png`, Swarm Junction cell.

**Keep the darker ship.** The clearest gain is knowing where to look on entering Workshop. The clearest loss is knowing where a Brute’s blade ends in the matched Armory fight. At Crew Checkpoint, peripheral cabinet feet disappear sooner. At Service Shaft Landing, the bright upper rail survives while the drop and near-side braces merge. Those are navigation and threat cues worth recovering with local reflected light. A global exposure increase would spend that light on empty floor again. `compare/{final7,final8}/rooms--combat-calm-infested-workshop.png`, `compare/{final7,final8}/compare-heavy--combat-heavy-armory-01.png`, `review480/rooms--incident-facing-service-shaft-landing.png`, paired Checkpoint.

I read the capture agent’s `DEFECTS.md` last. The two “Unidentified damage” screens are staged, and the attributed retry names the Brute attack. The initial missing onboarding prompt also has a successful retry. I excluded both from the product defects. The agent separately reports a blank panel on Cryo’s first native ending capture. I inspected the populated ending fixture only, so the duration and frequency of that issue remain open. `dead.png`, `results-fixture.png`, `review480/screen-retry--x3-failure-analysis.png`, `review480/screen-retry--onboarding-awakening-bay.png`, `complete-fixture.png`, `DEFECTS.md`

## 8. One month, five investments

1. **Make the next hit readable.** Pair a character artist with the lighting engineer on Stalker, Crawler and Brute first. Recover an attacking limb and the negative space around it in the actual dark crowd. Give small elites one visible structural change in the same pass. `compare/{final7,final8}/compare-heavy--combat-heavy-armory-01.png`, `review480/crowds--gallery-crowd-stalker-communal-atrium.png`
2. **Resolve friendly and hostile overlap in one real fight per rig.** Start with native Pyro. Preserve the hostile edge, move repeated damage text off it, give fire a broken interior, and show one convincing target reaction per Overdrive. Carry the same priority through foreground objects and the HUD. `review480/native-heavy--pyro-hardest-4071-0.png`, `review480/builds--v2-full-cryo-armory-armory-04.png`
3. **Finish the marine at gameplay scale.** Give one artist and animator ownership of the helmet-to-shoulder value break, gun receiver, planted run and recoil. The player sees the return on this work every second. `rig-select.png`, `motion/marine-contact-1.png`, `native-heavy/arc-hardest-4758-0.png`
4. **Recompose three pivotal rooms.** Give Passenger Vault one personal evacuation story, give Swarm Junction a growth that visibly deforms the machinery, and make Manual Control’s damaged console visible across a playable approach. Use the open cryo berth as the standard for how little explanation a scene should need. `twenty-calm.png`, `review480/rooms--incident-facing-{awakening-bay,passenger-vault,manual-control-chamber}.png`
5. **Animate enemy commitment and recovery.** Spend the remaining character time on a loaded Stalker lunge, a Brute cleaver follow-through and a Carrier bracing under brood weight. Judge success by whether a player can anticipate the move from the body while the existing accurate warning remains available. `motion/{stalker,brute,carrier}-contact-1.png`, `review480/champion-mechanics--comm13-flank-residential-gallery-05.png`
