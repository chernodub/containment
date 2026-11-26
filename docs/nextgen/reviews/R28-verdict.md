# R28 — lead's summary of the three independent reviews (2026-11-26, gallery final23)

Build reviewed: `63990654` (wave 32), one head. Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R28-A-visual-verdict.md`, `R28-B-play-verdict.md`, `R28-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R27 | R28 | | Play (B) | R27 | R28 | | Art second opinion (C) | R27 | R28 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 7.5 | 6.5 | | Core combat | 7.0 | 7.0 | | First impression | 6.5 | 6.5 |
| Interface and HUD | 7.5 | 7.5 | | Rigs | 8.0 | 8.0 | | Interface | 7.5 | 7.5 |
| Combat readability | 7.0 | 7.0 | | Enemy counterplay | 7.0 | 7.0 | | Combat readability | 6.5 | 6.5 |
| Environments | 6.5 | 6.5 | | Game feel | 7.0 | 7.0 | | Environments | 6.0 | 6.0 |
| Ability spectacle | 6.5 | 6.5 | | Build variety | 7.5 | 7.0 | | Ability effects | 6.5 | 6.0 |
| Characters and creatures | 5.5 | 5.5 | | Onboarding | 7.0 | 7.0 | | Characters and creatures | 5.5 | 5.5 |
| Animation | 6.0 | 6.0 | | Interface flow | 7.5 | 8.0 | | Cohesion | 6.0 | 6.5 |
| Cohesion | 6.5 | 7.0 | | Pacing | 6.5 | 6.5 | | | | |

Price: A US$10, C US$15. B: "solid commercial indie". The round is flat: three scores rose half a point (cohesion twice, interface flow), three fell (first impression by a full point, effects, build variety), seventeen did not move. Nobody calls the game AAA.

## What worked

- One marine from title to play: cohesion up with both visual reviewers. C: "a real gain". A: "The four rig portraits finally speak the same visual language as the combat suit."
- Red means danger only (C); aggregate labels and stamped flame cones gone (C); the death diagram is large and inked (B, C).
- The novice's second weapon lesson (B): "Fixed in the supplied native novice run."
- The Warden has a mouth; the Brutes have feet; the Brute's recovery differs from its release (A).

## What did not

1. **The title regressed** (A, −1.0): the toon redraw matches play, but "the old rim light held the hero and Warden apart and gave both volume. The full-size replacement enlarges rough contours into key art." C: the title creature is "an unresolved brown-green smear". The art director asked for this redraw in four rounds; done at the game's contour quality it exposes that quality at 1,000 px.
2. **Creature surface** (C's single decision): "painterly noise on soft blobs, next to a crisp cel marine and crisp ink architecture." The mottle is the hide pattern an earlier round asked for. A: the Brute "still resolves into a mask, three bands and round-ended limbs"; "the two dark knuckles look like beads".
3. **Amber Crawlers read as ammunition** (A, C): they share a hue with the Breacher's gold, pickups, projectiles and Pyro's fire — the cost of taking them off red.
4. **Status erases species** (A, C): burning Brutes become "tan teddy bears", frozen ones "blue cutouts".
5. **The Warden's weak point is hardest to find when it matters** (A, gallery note): at wall-stun the sail, brackets and marker register before the jaw. The lamp was too big; the slot is too small.
6. **Rooms do not carry their identity into the fight** (A, C): incident lights "barely register"; arena centres bare; "repeated triangular light pools".
7. **Play: the authored exchange is optional in its own showcase** (B): no full run did the Manual Control sidestep and return; "a good tactic drawn on the floor" with "little incentive to learn it". Sectors 1–4 cost 40.1 suit against 1,035.7 for sectors 13–16. Crawlers deal half of Cryo's suit loss through a hook that vanishes at the boots.

## Measurements

- Lead cohort at `459d979a`: Standard 40 of 48 (Breacher 7, Cryo 11, Pyro 12, Arc 10), Story novice 22 of 24, zero stalls; all six native gallery campaigns cleared. A bot-policy fix (PLAY36) raises the Breacher to 9.
- Frame bench at `94e3167d`, with the fixture repaired so it holds its population: Safety Interlock High 11.9 / 9.0 / 10.4% (Pyro) and 7.9 / 10.1 / 6.0% (Arc) of frames over 20 ms against a 5% budget; the same room at Low and Transmission Chamber at High are inside it. PERF41 is on that one case.

## Lead's reading

The reviews have converged on a level and are now trading preferences: a change one round asks for (a hide texture, a toon title, a recessed jaw glow, marks off red) is the next round's complaint (painterly mottle, rough key art, a weak point too small to find, marks that look like ammunition). Scores have moved about one point in five rounds on the visual side and not at all on play.

What still separates the build from the level above is the same three things as two rounds ago, and none of them yields to another pass of the same kind: creature models built by script from primitives and judged against sculpted work; fights whose second exchange a bot can skip, with no human to say whether a person would; and a High frame budget missed in the heaviest room. Wave 33 therefore narrows to finishing, not adding: creatures drawn in the marine's flat-band language, the title's contours at key-art quality, statuses that keep the animal visible, and the one room's frame time.
