# R25 — lead's summary of the three independent reviews (2026-11-26, gallery final20)

Build reviewed: fixtures at `a5a2c59d`, campaigns and effects at `f562e310` (wave 29). Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R25-A-visual-verdict.md`, `R25-B-play-verdict.md`, `R25-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R24 | R25 | | Play (B) | R24 | R25 | | Art second opinion (C) | R24 | R25 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 6.5 | 6.8 | | Core combat | 7.0 | 7.1 | | First impression | 6.0 | 6.5 |
| Interface and HUD | 7.5 | 7.1 | | Rigs | 8.0 | 8.2 | | Interface | 7.5 | 7.5 |
| Combat readability | 7.0 | 6.8 | | Enemy counterplay | 7.0 | 7.2 | | Combat readability | 6.0 | 6.5 |
| Environments | 6.0 | 6.1 | | Game feel | 7.0 | 7.1 | | Environments | 6.0 | 6.0 |
| Ability spectacle | 6.0 | 6.5 | | Build variety | 7.5 | 7.4 | | Ability effects | 6.0 | 5.5 |
| Characters and creatures | 5.0 | 5.4 | | Onboarding | 7.0 | 7.3 | | Characters and creatures | 4.5 | 5.0 |
| Animation | 5.5 | 5.9 | | Interface flow | 8.0 | 8.0 | | Cohesion | 5.0 | 6.0 |
| Cohesion | 6.0 | 6.2 | | Pacing | 6.0 | 6.6 | | | | |

Price: A US$8, C US$15. B: "solid commercial indie". Sixteen of twenty-three scores rose, three held and four fell. It is the first round since R15 in which most scores moved up, and nobody calls the game AAA: A, "a small commercial indie with a finished interface and uneven combat art"; C, "a strong early-access indie with AA menus, wrapped around creature art that is still prototype grade".

## What worked

- The first heavy exchange now happens. B: "All ten Standard opening Brutes struck and recovered. Nine drew a weapon hit within 0.28 seconds."
- Flashfire. A: "Fixed for the reported peak defect."
- The heavies are one family and no longer louder than the marine; the Warden "loses its enormous cap and gains a directional head and separated limbs" (A).
- The shield marine from title to selector (A, C); pacing (B, +0.6): "late mixed-beat tails are less punitive and Standard has credible losses".

## What did not, or got worse

1. **Area powers lost their matter** (C, 6.0 → 5.5): "bright lines over a nearly invisible glaze, so they read as UI diagrams… Whiteout lost almost all of its body." A: "several area powers spend their brightest pixels tracing a circumference." The lead thinned the fill in FX30 after FX29 had made it heavy; the right answer is a textured body under the front, not a flat fill and not nothing.
2. **Creature bodies still dissolve at native size.** C: "the three-step light lands as camouflage blotches, not planes. The Warden is still an untextured clay block… everything is untextured flat facets." A: "The Warden has a headlight where it needs a face"; "The Brute's release and recovery say nearly the same thing."
3. **Floor stencils are too loud and the lanes still lack physical story.** C: "giant 'STOP 31 / BED 40 / ISO 68' stencils that read as debug labels." A: rooms are "identified mostly by stencils… Carry one physical consequence of each accident through the playable lane."
4. **The compact supply stop hides what is worth buying** (A, interface 7.5 → 7.1; B problem 9): nine equally weighted cards; the two free exclusives sit in different rows.
5. **Late packs take away the firing position** (B problem 1): Arc 1729 loses 116.7 suit to Crawlers at the east wall of Service Shaft Landing; small-family contact is 70.8% of Standard suit loss (63% before).
6. **The protected arrival swing is a silent immunity** (B problem 6): a correct plasma shot during it does nothing visible.
7. **Untouched for three rounds:** the final crossing's shelter cannot be read as one mark (A defect 4); sectors 2–4 still cost a competent player nothing (B problem 2).
8. **Motion is hold-and-snap** (C): one held wind-up pose, then one lunge pose.

## Measurements the reviewers did not make

- Lead's cohort at `f562e310`: Standard 37 of 48 on the usual seeds (Breacher 9, Cryo 8, Pyro 10, Arc 10), 40 of 48 on fresh seeds for two rigs; Story novice 23 of 24; zero stalls. Native Standard runs on seed 1729 and 2718 cleared one of five; the simulator clears three of the same five, so native play is harder than the simulator.
- Frame bench at `a5a2c59d`: High borderline (one trial in three of four cases over 5% of frames above 20 ms); a performance pass is in progress.
- No person has played these builds for the reviews.

## Lead decisions for wave 30

- Heavies: a face for the Warden (jaw plates around the light, a dark mouth, a collar), four to six large hard plates on each heavy so the light lands on planes, distinct release and recovery poses for the Brute.
- All creatures: one hide texture in the surface (low-contrast value noise) so the toon light has something to describe. The request for one shared carapace hue is again not taken: body hue tells the player which threat is which, and B's enemy table confirms each family is identified by it.
- Area powers: a textured mid-value body under each front (frost crust, molten pool, snow bank), ice and burn on the struck bodies, drawn under actors and warnings.
- Rooms: stencils half the size, close to the floor's value and at lane edges; one physical consequence of each room's accident carried through the lane.
- Supply stop: the free exclusive pair as one comparison row; amount and price as the largest text on each card.
- Play: a second firing position in the Service Shaft pincer; shots during the protected arrival swing visibly strip plate or bank a wound; the final crossing's shelter as one mark on the first protected step; consequences that point at the next target (persistent closed grille, the exposed Spitter, the Matron's two clutches).
- Motion: anticipation, overshoot and settle on heavy attacks; a shoulder kick and shell eject on the shotgun; the Breacher braced behind its shield.
