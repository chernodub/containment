# R26 — lead's summary of the three independent reviews (2026-11-26, gallery final21)

Build reviewed: `bc56c43c` (wave 30), one head for the whole gallery. Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R26-A-visual-verdict.md`, `R26-B-play-verdict.md`, `R26-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R25 | R26 | | Play (B) | R25 | R26 | | Art second opinion (C) | R25 | R26 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 6.8 | 7.2 | | Core combat | 7.1 | 7.0 | | First impression | 6.5 | 6.5 |
| Interface and HUD | 7.1 | 7.4 | | Rigs | 8.2 | 8.0 | | Interface | 7.5 | 7.5 |
| Combat readability | 6.8 | 7.0 | | Enemy counterplay | 7.2 | 7.0 | | Combat readability | 6.5 | 6.5 |
| Environments | 6.1 | 6.6 | | Game feel | 7.1 | 7.0 | | Environments | 6.0 | 6.0 |
| Ability spectacle | 6.5 | 6.3 | | Build variety | 7.4 | 7.5 | | Ability effects | 5.5 | 6.0 |
| Characters and creatures | 5.4 | 5.4 | | Onboarding | 7.3 | 7.0 | | Characters and creatures | 5.0 | 5.0 |
| Animation | 5.9 | 6.1 | | Interface flow | 8.0 | 8.0 | | Cohesion | 6.0 | 6.0 |
| Cohesion | 6.2 | 6.5 | | Pacing | 6.6 | 6.5 | | | | |

Price: A US$10 (was 8), C US$15. B: "solid commercial indie". The visual reviewer rose in six of eight; the play reviewer and the art director are flat within their own noise. Nobody calls it AAA. C: "The improvements are real, but they are incremental."

## What worked

- Rooms (A, +0.5): lettering out of the fight, physical damage in the lane. C: floor stencils "done".
- Supply stop and free exclusive pair: fixed (A, B).
- The Service Shaft exchange (B): "convincing"; Arc 1729's loss there fell from 116.7 to 9.1. Weapon hits no longer vanish into the protected swing.
- Poses have anticipation (A, C); Seismic Slam and Cryo Nova have mass (A, C).

## What did not

1. **Creatures did not move for the third round** (A 5.4, C 5.0). Each pass fixed one thing and lost another. A: "All three are better lit and somewhat less animal than before… The earlier rounded joints read as more organic than the new square shoulder caps." C: "stacked green cubes: the 'plates' read as boulders… greybox gorillas and candy bugs." A: the Warden "still reads as a work light… a direction and no expression"; the Brute "looks assembled from pads".
2. **Whiteout blankets the fight again** (A, effects −0.2): "a blue surface that swallows its smallest victims." C: Cryo Nova "an opaque grey-teal paint stain", Seismic Slam "a brown hex rug".
3. **A correct read rarely controls the next exchange** outside the two authored rooms (B): 84 of 12,460 weapon contacts hit an exposed enemy.
4. **Untouched again:** the final crossing's shelter (A defect 8, B problem 5); the Breacher's shield reads as a small edge-on plate in play (A defect 9); the novice bot skips plasma in the second lesson (B); sectors 2–3 cost nothing (B).
5. **The death diagram** is too small and can show a different exchange from the fatal one (A, B).
6. **One species palette** (C, third request; A: "Lime, salmon, blue, plum and jade still occupy whole dominant body masses").

## Lead's reading

Three rounds of creature work inside the same construction method (signed-distance primitives assembled by script) have each traded one complaint for another: shards, then balloons, then boxes. The method is the ceiling, not the brief. The next creature pass changes the method and the design together: curved, overlapping shell bands built as lofted surfaces over an articulated body (an armoured arthropod, which suits what scripted modelling does well), tested first as a 2D sketch in a real fight frame as the Brute plan was in wave 29.

The request for one shared carapace was refused twice. A one-line shader experiment on the Crew Checkpoint crowd (kept in `artifacts/nextgen/lead-w31-palette/`) shows the families still tell apart by their marks and the frame reads as one species; the cost is that a resting Stalker nearly disappears on dark deck. It will be done properly, with larger marks and a find-every-family check in the darkest rooms.

Effects have now swung three ways (sheet, diagram, blanket). The rule both visual reviewers converge on is about the victim, not the floor: broken banks with bare deck under feet and around small bodies, and the brightest pixels on struck joints.

## Not addressed by any review

No person has played these builds: every play number comes from bot policies, and all three reviewers say input feel and audio need a human. The High frame budget is met for Arc and narrowly missed for Pyro on the one development machine measured.
