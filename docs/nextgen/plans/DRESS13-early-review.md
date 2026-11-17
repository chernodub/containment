# DRESS13 early incidents

## Residential Gallery
Placement pass: seven aftermath pieces extend the existing fallen-chair/drawings nook into an interrupted evacuation, with opened luggage and a skew cabin barricade; the central fight floor stays empty.
Build passed. Native/480 capture review and the subsequent visual correction are pending the shared browser slot; this is not yet visual acceptance.

## Awakening Bay
Placement pass: existing forced-open berths now connect to a dropped recovery kit and six dark, flush wet tread marks; pieces remain under the north bank, away from the observation fight floor.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Passenger Vault
Placement pass: six small personal effects and an identification plaque sit below the existing empty extended drawer, isolated from the west entry fight lane.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Communal Atrium
Placement pass: two overturned desks and a fallen bench form one failed barricade at the conservatory's east foot; dropped contents and dark trample panels gather beneath it, clear of the west fight floor.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Crew Checkpoint
Placement pass: baggage remains on and below the north inspection conveyor, beside a severed tray and restrained dark fan mark with four spent-case glints; the scanner fight floor is untouched.
Build passed. Native/480 capture review and visual correction await the shared browser slot.

## Armory
Placement pass: half-closed magazine shutters and a dropped, open issue case gather north of the existing emptied carousel; no objects are added to the southern fight circle.
Build pending shared-dist release. Native/480 capture review and visual correction await the shared browser slot.

Loader review correction: moved the dropped Awakening/Passenger/Armory case origins outside the authored hero AABBs; the loader retires `p11-service` supports inside hero bounds. This avoids silently omitting the incident cases. Type-check passed; visual acceptance still pending.

Detail correction before capture: replaced panel-shaped footprints/soot/casings with shaped flat wet soles and heels, an irregular dark scorch fan and seven small metallic cases. Added a barricaded hatch with four claw cuts and drag wear, paper spill, trample streaks and armory scuffs. Geometry stays presentation-only under the prepared room owner, with explicit material disposal. Production build passed.

### Round 1 actual image review — Residential Gallery
Opened native tour02 and exact480 tour01/03 against final6 calm native/480: luggage and the skew barricade now register at the nook; the marine remains unobscured and the fight floor retains quiet values. The cases still read too closed, so the correction adds a dark opening and a folded pale garment on the large case rather than more scattered props.

### Round 1 actual image review — Awakening Bay
Opened native tour02 and exact480 tour01/03 against final6: forced-open canopy reads, but the dropped kit is hidden by the bank console and the tread is too far behind it. Correction moves kit and wet trail to the exposed west foot of the bank and adds a restrained pale medical cross; the observation fight floor remains clear.

### Round 1 actual image review — Passenger Vault
Opened native tour02 and exact480 tour01/03 against final6: the empty pulled drawer is now the dominant personal story, with belongings at its foot and no marine obstruction. The paper spill disappears first at 480; correction enlarges the three sheets slightly and adds one subdued drawer-to-case drag streak instead of more high-contrast detail.

### Round 1 actual image review — Communal Atrium
Opened native tour02 and exact480 tour01/03 against final6: the damaged conservatory is clearer, but the table barricade is swallowed by foliage and the generic-furnishing retirement filter. Correction exempts explicitly authored DRESS13 furniture from that filter and moves the toppled tables to the garden's front foot, leaving at least 140 units of the south route visually open.

### Round 1 actual image review — Crew Checkpoint
Opened native tour02 and exact480 tour01/03 against final6: the central scanner remains exceptionally readable, but the baggage was placed on the wrong north bank and is absent from the intended composition. Correction seats the bags on the actual authored conveyor at (950,98), with the dropped case and soot/casing fan at its foot; this is a north-bypass incident, strongest in tour03 rather than the fight view.

### Round 1 actual image review — Armory
Opened native tour02 and exact480 tour01/03 against final6: the pale counter no longer dominates the darker carousel; the dropped case is visible beside it and never covers the marine. The case still reads shut, so correction adds a dark foam opening and two muted empty cutouts; north magazine shutters remain a peripheral tour detail rather than a fight-floor feature.

### Round 2 — Residential Gallery
Opened corrected native tour02 and exact480 tour01/03. The case now has an open dark compartment and folded garment; drawings, fallen chair and skew barricade remain a single peripheral composition. Marine silhouette and quiet fight-floor values are preserved; claw cuts remain small tertiary evidence at 480.

### Round 2 — Awakening Bay
Opened corrected native tour03 and exact480 tour01/02. The dropped medical case is now exposed beside the console and the forced-open canopy reads above it; wet soles stay subdued and are difficult to pick out at 480. No added mass overlaps the marine or the observation fight floor.

### Round 2 — Passenger Vault
Opened corrected native tour02 and exact480 tour01/03. The empty extended drawer and its two fallen cases make a clear interruption; paper and drag wear remain supporting details. The marine, ring and aisle stay unobstructed, with the original cyan/blue room hierarchy intact.

### Round 2 — Communal Atrium
Opened corrected native tour02 and exact480 tour01/03. The two toppled desks and fallen bench now read as a failed barricade at the damaged planter's foot; the former intact garden presentation has a visible consequence. The west fight floor is unchanged and the marine is fully clear; the tables remain secondary to actors.

### Round 2 — Crew Checkpoint
Opened corrected native tour03 and exact480 tour01/02. Bags now sit on the real conveyor, with a fallen case, broken tray and spent cases at its foot; no piece covers the marine. This remains the weakest early-room incident because it is peripheral to spawn/fight framing; the central pale scanner floor is intentionally kept quiet.

### Round 2 — Armory
Opened corrected native tour02 and exact480 tour01/03. The issue case now reads open and empty beside the carousel, and the southern fight court stays unobstructed. The carousel remains the room landmark; the north lockdown shutters are less visible than the case in normal fight framing.

Both six-room runs completed their requested five-position tours and calm frames without a capture failure. These are staged presentation reviews, not a campaign or hardware performance result. Round2 frozen build includes the working-tree shared details hook and loader exemption, recorded via app-asset hashes; HEAD label alone does not describe that complete source tree.
