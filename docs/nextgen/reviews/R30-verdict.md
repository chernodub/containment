# R30 — lead's summary of the three independent reviews (2026-11-27, gallery final25)

Build reviewed: `68050af3` (wave 34), with the Warden and elite frames and the Story campaign at `6a902cea`. Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R30-A-visual-verdict.md`, `R30-B-play-verdict.md`, `R30-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R29 | R30 | | Play (B) | R29 | R30 | | Art second opinion (C) | R29 | R30 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 7.0 | 7.2 | | Core combat | 7.0 | 7.0 | | First impression | 6.5 | 7.0 |
| Interface and HUD | 7.5 | 7.6 | | Rigs | 7.5 | 7.5 | | Interface | 7.0 | 7.5 |
| Combat readability | 7.0 | 6.8 | | Enemy counterplay | 7.0 | 7.0 | | Combat readability | 6.0 | 6.0 |
| Environments | 6.5 | 6.6 | | Game feel | 6.5 | 6.5 | | Environments | 5.5 | 5.5 |
| Ability spectacle | 6.5 | 6.5 | | Build variety | 7.0 | 6.5 | | Ability effects | 6.0 | 6.0 |
| Characters and creatures | 6.5 | 6.1 | | Onboarding | 7.0 | 6.5 | | Characters and creatures | 5.5 | 6.0 |
| Animation | 6.5 | 6.0 | | Interface flow | 7.5 | 7.5 | | Cohesion | 6.0 | 6.5 |
| Cohesion | 7.0 | 7.2 | | Pacing | 6.0 | 6.5 | | | | |
| **Mean** | 6.81 | 6.75 | | **Mean** | 6.94 | 6.88 | | **Mean** | 6.07 | 6.36 |

Price: A US$12 (was 10), C US$15 (was 12–15). B: "at the threshold of a solid commercial indie". Third round in a row inside a quarter of a point. A and B each say their lower marks are stricter judgment, not regression ("I see an improved pose sequence despite the lower absolute score"; "The order choice itself improves the game"). Of the twenty problems A and B listed last round, four are marked fixed, sixteen partly fixed, none untouched. Nobody calls the game premium.

## What worked

- The title: "a real illustration" (C); "fixed for the foreground" (A).
- Supply stop: fixed (B). Death diagram legend: fixed (A). Shop icons match (C).
- Story's hold: "fixed for the specified encounter" (B).
- Marine value priority: "fixed in the sampled mixed fights... The thin cool rim helps... and rarely reads as a selection outline" (A).
- Pacing up half a point (B): "Standard now makes early mistakes recoverable and finishes inside its target band."
- Meltdown as one disc, Flashfire's cone, Cryo Nova's arc (A, C). Harder incident light with a source (A: keep it).
- The order cards (A): "In one picture I understand a rush, in the other I see crossing lines of fire."

## What did not, and where the three agree

1. **The Brute still does not look heavy** (A's first defect for the second round): "The hand reaches the floor before the Brute looks heavy... Repeated in a pack, that reads as a row of hinged figures." The palm now stays put; the wrist, elbow and chest do not yield over it. C: the face "reads as a goofy ape".
2. **Close contact** (A2, B3, C1): which small body at the boots will hit, and which muzzle at the screen edge fired. Crawlers took 46.7% of the Breacher's suit and 54.1% of Story Cryo's.
3. **The grille pays for a decision it barely advertises** (B1): the rule is proven in tables and invisible in the frame: "I have to look away from that exchange to find two plum shapes stopped by a rail"; "The ±30° condition tests direction without requiring proximity or a dangerous crossing." Native bots closed one of five in Atrium.
4. **The floor loses its address away from the landmark** (A3, C5). Per lane: Passenger "mostly succeeds", Transmission and Overload "partly", Checkpoint "fails once the pivot leaves frame".
5. **The Warden's mouth** (A5, C3): found at last, and now a "nearly white circular tongue", "a glowing egg that buries the marine".
6. **Powers draw on the floor instead of on the victim** (A6, C6).
7. **The final shelter explains itself too late** (A4, B8), third round.
8. **Pendulum, again** (C1): making the Crawler readable from every heading made it "the lightest thing in the crowd". C's single decision: "giving every enemy family its own always-on emissive... turns each fight into competing lights". A, the same round: exposed Crawlers are easier to identify on a dark floor. The two disagree on direction; a value rule settles it, a taste does not.
9. **Order choice ends after two rooms** (B10); **exclusive's first fight shows an ordinary button** (B5); **featured kill feels like the midpoint** (B6).

## Measurements

- Lead cohort at `68050af3`: Standard 39 of 48 (Breacher 8, Cryo 10, Pyro 10, Arc 11), Story novice 23 of 24, zero stalls. Sensitive to one number (the paired second rooms' escort health).
- Native: four of five Standard campaigns cleared; Standard Cryo 1729 died in Safety Interlock after arriving at 48.5 health. Story novice Cryo 1729 clears after PLAY40.
- Frame bench: High over budget in Safety Interlock (Pyro 12–20% of frames over 20 ms). PERF47 reverted after an A-B-A bench showed it slower. PERF48 (adaptive internal resolution) in progress.

## Lead's reading

The scores have stopped moving, and the reason is visible in the verdicts' own grammar: sixteen "partly fixed". Each wave closes about half of each gap, the reviewer then weighs the remaining half more heavily, and a new reviewer calibrates a little differently. Three things follow.

First, what is left is concentrated. Five items appear in two or three verdicts at once and have survived at least two rounds: the Brute's weight, contact at the boots, the invisible payoff of a good move, floors without an address, and effects that end on the deck. A wave that finishes two of those completely is worth more than one that half-closes ten.

Second, stop swinging. Crawler visibility has now gone too loud, too quiet, too loud. The fix is a rule the build can be measured against, the same one that settled the Spitter organ: no creature zone at rest is lighter than the marine's legs or more saturated than his visor; emission rises only on the imminent attacker. That answers C without undoing what A credited.

Third, the instrument has a floor. Three reviewers reading stills and bot traces cannot tell us what B has asked for twice: whether a person, unprompted, sees the grille, steps off the pad, or hears a Crawler under rifle fire. "Hand response, audible separation and unaided human discovery remain unverified." No delegate can supply that. It needs the owner or people the owner brings.

Wave 35, with at most four capture-heavy delegates at a time: HEAVY45 (the Brute walking past a fixed deck seam until it reads as weight; palm and forearm anatomy; the Warden's tongue as a shape, not a lamp; an elite skyline), BROOD43 (the value rule; contact pixels around the imminent claw and muzzle; the edge shooter), PLAY41 with ROOM35 (the grille as one sightline in an Atrium side aisle, escorts that push on the bars; lanes carried to both banks; the shelter's face), FX36 (one victim reaction per expensive power), then the smaller run and interface items.
