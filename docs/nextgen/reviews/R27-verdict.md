# R27 — lead's summary of the three independent reviews (2026-11-26, gallery final22)

Build reviewed: fixtures at `95d9beca`, campaigns and marine sections at `40650265` (wave 31). Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R27-A-visual-verdict.md`, `R27-B-play-verdict.md`, `R27-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R26 | R27 | | Play (B) | R26 | R27 | | Art second opinion (C) | R26 | R27 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 7.2 | 7.5 | | Core combat | 7.0 | 7.0 | | First impression | 6.5 | 6.5 |
| Interface and HUD | 7.4 | 7.5 | | Rigs | 8.0 | 8.0 | | Interface | 7.5 | 7.5 |
| Combat readability | 7.0 | 7.0 | | Enemy counterplay | 7.0 | 7.0 | | Combat readability | 6.5 | 6.5 |
| Environments | 6.6 | 6.5 | | Game feel | 7.0 | 7.0 | | Environments | 6.0 | 6.0 |
| Ability spectacle | 6.3 | 6.5 | | Build variety | 7.5 | 7.5 | | Ability effects | 6.0 | 6.5 |
| Characters and creatures | 5.4 | 5.5 | | Onboarding | 7.0 | 7.0 | | Characters and creatures | 5.0 | 5.5 |
| Animation | 6.1 | 6.0 | | Interface flow | 8.0 | 7.5 | | Cohesion | 6.0 | 6.0 |
| Cohesion | 6.5 | 6.5 | | Pacing | 6.5 | 6.5 | | | | |

Price: A US$9.99, C US$15–18. B: "solid commercial indie". Over four rounds (R24 → R27) the visual reviewer moved from 6.5/7.5/7.0/6.0/6.0/5.0/5.5/6.0 to 7.5/7.5/7.0/6.5/6.5/5.5/6.0/6.5 and the art director from 6.0/7.5/6.0/6.0/6.0/4.5/5.0 to 6.5/7.5/6.5/6.0/6.5/5.5/6.0; play has stayed at 7.0/8.0/7.0/7.0/7.5/7.0/8.0/6.5 give or take a tenth. The game is a commercial indie by every reviewer's account and is not AAA.

## What worked

- One species for the small families (C lists it under "keep": "a dark carapace, family colour only in the marks, and a soft pool of light on the floor"; A: "The small aliens share a recognizable dark shell").
- Seismic Slam "is fixed"; Whiteout's gaps and Flashfire's breaks "make both impacts easier to follow".
- The Brute's banded back: "a real gain"; "I can follow the curved bands over the shoulder". The Warden is "distinguishable in gray and in solid black".
- The shotgun "kicks, ejects and settles"; the Breacher's shield "reads broadly now".
- Rig hits during the protected swing: fixed (B).

## What did not

1. **The Warden's face, fourth round.** A: "a headlight for a face. Its light is easy to aim at, but the circular white core fills the head and erases the gap between the jaws." C: "a big Brute with a lamp for a face. No jaw is visible." The lead caused this: HEAVY40 was told to keep the lit area at or above the previous build in every state, and it went from 1,297 to 8,651 px. Lit area was the wrong measure; the mark has to be findable, not large.
2. **Heavies' limbs and colour.** A: "the near limb ends in a padded club and the far support in a narrow peg." C: "saturated mid-green lumps with a flat pale paper wedge for a head… the largest shapes on screen, so they set the picture's finish."
3. **Red was not reserved for danger.** C: "The crawlers' and carriers' hot-pink glow now competes directly with the red telegraphs." Fixed after the review at `a3d515dc` (Crawler marks amber-orange, Carrier and Matron violet). A adds that a waiting Carrier's broad glow "draws my eye before the marine".
4. **The authored second exchange exists on the schedule and not in play** (B): no exposed hit in the changed beat of any of the three rooms in six campaigns; "A delay between spawns buys little if a body already occupies the firing position."
5. **The novice still skips the second weapon lesson** in a full run (B).
6. **Incidents fall out of the fight; centres are bare** (A, C): ROOM31's trails and incident lights were too quiet to register; C: "Only the Overload Floor's reactor works as a landmark."
7. **The title and selector marine** is still a glossy render with a full visor band (C, fourth request).
8. **Aggregate damage labels and stamped flame cones** remain (C).
9. **The death card's large diagram was not seen**: the gallery had no natural death and the staged cards fall back to the small generic picture (B interface −0.5, C).
10. **Untouched:** the final crossing's refuge (A), the Crawler's attack end at contact (A), the Brute's release against recovery (A).

## Lead's reading

Each round now moves the visual scores by a tenth to half a point, and play does not move. Four things have been asked for three or four rounds running and are specific enough to finish: the Warden's jaw, the heavies' hands, the title marine, and a firing position after a dodge in late rooms. Wave 32 is those four, plus the smaller repeat items, and nothing new.

Two limits no delegate can remove. Creature models are authored by script from primitives; reviewers compare them with hand-sculpted work. And no person has played any of these builds: B's last recommendation is "Put a mouse and headphones in new players' hands", and input feel and audio remain unverified.
