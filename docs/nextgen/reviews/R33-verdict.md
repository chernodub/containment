# R33 — lead's summary of the three independent reviews (2026-11-28, gallery final28)

Build reviewed: `cbdcffd7` (wave 37), one head for fixtures and all six native campaigns. Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R33-A-visual-verdict.md`, `R33-B-play-verdict.md`, `R33-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R32 | R33 | | Play (B) | R32 | R33 | | Art second opinion (C) | R32 | R33 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 7.4 | 7.5 | | Core combat | 7.1 | 7.3 | | First impression | 7.0 | 7.0 |
| Interface and HUD | 7.7 | 7.5 | | Rigs | 7.7 | 7.8 | | Interface | 7.5 | 7.5 |
| Combat readability | 6.8 | 6.5 | | Enemy counterplay | 7.0 | 7.1 | | Combat readability | 6.5 | 6.5 |
| Environments | 6.7 | 6.5 | | Game feel | 6.7 | 6.6 | | Environments | 5.5 | 5.5 |
| Ability spectacle | 6.5 | 6.5 | | Build variety | 6.8 | 7.1 | | Ability effects | 6.0 | 6.0 |
| Characters and creatures | 6.2 | 6.0 | | Onboarding | 7.0 | 7.0 | | Characters and creatures | 6.0 | 6.5 |
| Animation | 6.3 | 6.0 | | Interface flow | 7.4 | 7.7 | | Cohesion | 6.5 | 6.5 |
| Cohesion | 7.1 | 7.0 | | Pacing | 6.7 | 6.7 | | | | |
| **Mean** | 6.84 | 6.69 | | **Mean** | 7.05 | **7.16** | | **Mean** | 6.43 | 6.50 |

Price: A and B US$9.99, C US$15–18 ("a polished early-access indie"). Play rose for the second round (combat +0.2, build depth +0.3, interface flow +0.3). A fell 0.15 and attributes most of it to its own weighting ("the deltas compare two judgments"), with two real causes it names: the darker heavies lost their resting limbs, and the repeated hard pool edge reads as a deck graphic across twenty arenas. C rose half a point on creatures (the Brute's planted walk, the marine silhouette through bodies, the Matron's body). Nobody calls it premium.

Of A's ten R32 defects: seven partly fixed, three untouched as a player read (the final refuge's standing footprint, the edge shooter's body beside the hotbar, decision typography). Of C's seven R32 changes: one done (the Matron), four partly, two not done (floor detail, title backdrop).

## What worked

- Guardian holds: all nine featured kills sent the held group back (B), replacing the opaque time-and-suit threshold.
- Manual Control in the simulator: aware 20.4, unaware 30.8, rule absent 37.8 suit; B: "the notch outside the sweep, 3.2-second recovery, leaning escorts and canceled late Spitters and Crawler screen make stepping out worthwhile."
- Interface flow 7.7 (B): "The illustrated rig selector, health forecast, fatal-exchange diagram and focused same-rig retry each answer a useful question at the moment it arises."
- Fixtures: "The suspended work lamps and visible lenses now give the pool a source" (A); "pools now hang from fixtures" (C).
- Meltdown "now gives one body a much clearer sideways fall at 300 ms" (A); the Matron's ribbed sac "reads as one distended organ" (A), "done" (C).

## What did not

1. **Light is painted, not cast** (C's single change for the second round; A's environments and cohesion). "Turn the light pool into real light... hot centre, about 40% at the rim, no hard edge. It should also light the tops of nearby props, and characters should get a lit side facing the lamp and a dark far side" (C). "The repeated pool edge... sharp-edged floor illumination still call attention to the rendering" (A).
2. **Heavies went too dark** (A, C; a regression from HEAVY47's chroma cap and darker bands). "The darker grey Brutes now sit at the same brightness as the floor in teal rooms" (C); "I lose the resting dark limbs" (A). The value rule caps saturation and lightness; it never asked heavies to sink into the deck.
3. **Who hit me, and how many are there** (A1, B1; fifth round). Crawlers lead suit loss in all six campaigns (37.6–64.1%). The Stalker's far blade merges head-on. "I can dodge and still shoot the wrong body" (B).
4. **Powers show their radius before their impact** (A2, B6). Nova's rim wins the first glance; Slam's victim is cropped at peak and reads only at +300 ms.
5. **Manual Control is not taken in native play** (B2): 0 of 4 Standard visitors closed it, for the second gallery running, against 32 of 37 aware simulator visits. "In Pyro's crossing and console-bait frames, I would keep shooting from cover."
6. **Smaller and repeated**: the first exclusive fight records an ordinary hit in three of six runs (B3); the first crossfire ends before it teaches the interrupt (B4); the final refuge's standing footprint (A6, B9, third round); the edge shooter's body beside the hotbar (A8); the Shielding Gate consequence reads as noise (B8); the paid upgrade card explains what the player already owns instead of the gain (B10); small type on the forecast and order cards (A10).

## Measurements

- Lead cohort at `cbdcffd7`: Standard 37 of 48 (9, 10, 8, 10), Story novice 23 of 24, zero stalls.
- Native: Breacher, Pyro, Arc 1729 and Arc 2718 cleared; Standard Cryo 1729 died in Diagnostic Gallery (room 11, entered with 27 suit; the card names Transmission Chamber); Story Cryo cleared. Zero runtime errors.
- Quiet A-B-A bench, final27 vs wave 37, High: 1.0–2.2% vs 1.1–2.3% of frames over 20 ms (budget 5%).

## Lead's reading

Play is climbing a tenth or two per round from mechanisms the player can see. Visual has been flat for six rounds, and the two art reviewers now name one cause from different directions: the picture has no light in it, only painted pools and inked flat colour. A wave of further painting will not move that. The frame budget now has room (about 2% of frames over 20 ms against 5%), so wave 38 tries real light once, measured, on High only: one shadowless key per arena from its fixture with a true falloff, the character's lit and dark side, prop tops catching it; Low keeps the painted version. If it costs the budget or flattens the ink, it is reverted, as PERF47 was.

Wave 38, at most four capture-heavy delegates:
- **LIGHT38** (the experiment above; the Transmission hard edge; the final refuge's standing footprint lit by its own lamp).
- **CONTACT38**: heavies lifted back to read second after the marine on every floor without breaking the saturation cap; the Stalker's far blade; the striking Crawler's wrist and the marine's near boot as separate silhouettes through recovery.
- **FX39**: Nova and Slam put the first flash, debris and landing shadow on one visible animal at peak, and retire the empty side of the ring early.
- **PLAY44**: why the native bot never closes Manual Control's grille and what in the room fails to invite it; the first exclusive fight's second target; the early crossfire's door; the late Spitter's lane and ledger.
- **UI38** (light): the paid upgrade card shows the actual gain; larger decision type on the forecast and order cards.

The human-playtest gap stands as before.
